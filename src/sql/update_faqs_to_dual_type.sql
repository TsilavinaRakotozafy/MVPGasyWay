-- =====================================================
-- MISE À JOUR SYSTÈME FAQ - Support FAQ générales
-- Script pour mettre à jour une table FAQ existante
-- =====================================================

-- =====================================================
-- 1. MODIFIER LA TABLE EXISTANTE
-- =====================================================

-- Ajouter la colonne faq_type si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'faqs' AND column_name = 'faq_type') THEN
        ALTER TABLE faqs ADD COLUMN faq_type VARCHAR(20) DEFAULT 'interest' CHECK (faq_type IN ('general', 'interest'));
        RAISE NOTICE 'Colonne faq_type ajoutée';
    ELSE
        RAISE NOTICE 'Colonne faq_type existe déjà';
    END IF;
END $$;

-- Rendre interest_id optionnel (permettre NULL)
ALTER TABLE faqs ALTER COLUMN interest_id DROP NOT NULL;

-- Mettre à jour les FAQ existantes pour être de type 'interest'
UPDATE faqs SET faq_type = 'interest' WHERE interest_id IS NOT NULL;

-- Ajouter la contrainte de cohérence
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'faq_type_consistency') THEN
        ALTER TABLE faqs ADD CONSTRAINT faq_type_consistency CHECK (
            (faq_type = 'general' AND interest_id IS NULL) OR 
            (faq_type = 'interest' AND interest_id IS NOT NULL)
        );
        RAISE NOTICE 'Contrainte faq_type_consistency ajoutée';
    END IF;
END $$;

-- =====================================================
-- 2. AJOUTER LES INDEX OPTIMISÉS
-- =====================================================

-- Index pour les FAQ générales (si pas existant)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_faqs_general') THEN
        CREATE INDEX idx_faqs_general ON faqs(faq_type, is_active, order_index) WHERE faq_type = 'general';
        RAISE NOTICE 'Index idx_faqs_general créé';
    END IF;
END $$;

-- Index pour le type et statut actif
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_faqs_type_active') THEN
        CREATE INDEX idx_faqs_type_active ON faqs(faq_type, is_active, order_index);
        RAISE NOTICE 'Index idx_faqs_type_active créé';
    END IF;
END $$;

-- =====================================================
-- 3. RECRÉER LES VUES AVEC SUPPORT FAQ GÉNÉRALES
-- =====================================================

-- Supprimer l'ancienne vue pack_faqs si elle existe
DROP VIEW IF EXISTS pack_faqs;

-- Recréer la vue pour gérer les FAQ générales ET spécifiques
CREATE OR REPLACE VIEW pack_faqs AS
SELECT DISTINCT
    p.id as pack_id,
    p.title as pack_title,
    f.id as faq_id,
    f.question,
    f.answer,
    f.order_index,
    f.faq_type,
    COALESCE(i.name_fr, 'GasyWay') as interest_name,
    COALESCE(i.icon, '❓') as interest_icon,
    CASE 
        WHEN f.faq_type = 'general' THEN 0  -- FAQ générales en premier
        ELSE 1                              -- FAQ spécifiques après
    END as group_order
FROM packs p
LEFT JOIN pack_interests pi ON p.id = pi.pack_id
LEFT JOIN interests i ON pi.interest_id = i.id
JOIN faqs f ON (i.id = f.interest_id OR f.faq_type = 'general')
WHERE p.status = 'published' 
  AND f.is_active = true
ORDER BY p.id, group_order, COALESCE(i.name_fr, 'GasyWay'), f.order_index;

-- Créer la vue pour les FAQ générales uniquement
CREATE OR REPLACE VIEW general_faqs AS
SELECT 
    id as faq_id,
    question,
    answer,
    order_index,
    created_at,
    updated_at
FROM faqs 
WHERE faq_type = 'general' 
  AND is_active = true
ORDER BY order_index;

-- =====================================================
-- 4. INSÉRER LES FAQ GÉNÉRALES DE DÉMONSTRATION
-- =====================================================

-- Vérifier et insérer les FAQ générales si elles n'existent pas
INSERT INTO faqs (interest_id, question, answer, order_index, faq_type)
SELECT NULL, q.question, q.answer, q.order_index, 'general'
FROM (VALUES
    ('Comment créer un compte sur GasyWay ?', 'Pour créer un compte, cliquez sur "Se connecter" puis "Créer un compte". Renseignez votre email, mot de passe, nom et numéro de téléphone. Vous recevrez un email de confirmation.', 1),
    ('Comment réserver un pack touristique ?', 'Parcourez notre catalogue, sélectionnez un pack qui vous intéresse, choisissez vos dates et le nombre de participants, puis cliquez sur "Réserver". Remplissez le formulaire de contact pour finaliser votre demande.', 2),
    ('Quels sont les moyens de paiement acceptés ?', 'Nous acceptons les virements bancaires, les paiements mobile money (Orange Money, MVola), et les paiements en espèces selon les arrangements avec nos partenaires.', 3),
    ('Puis-je annuler ou modifier ma réservation ?', 'Oui, les annulations et modifications sont possibles selon les conditions de chaque pack. Contactez-nous au moins 48h avant le départ. Des frais peuvent s''appliquer selon la politique d''annulation.', 4),
    ('GasyWay propose-t-il des assurances voyage ?', 'Nous recommandons fortement de souscrire une assurance voyage. Certains de nos partenaires proposent des assurances, sinon nous pouvons vous orienter vers des assureurs locaux.', 5),
    ('Comment contacter le service client ?', 'Vous pouvez nous contacter via la messagerie intégrée à la plateforme, par email à support@gasyway.mg, ou par téléphone au +261 XX XXX XX XX. Notre équipe répond dans les 24h.', 6),
    ('Les packs incluent-ils les vols internationaux ?', 'Non, nos packs couvrent uniquement les activités et services à Madagascar. Les vols internationaux sont à organiser séparément, mais nous pouvons vous conseiller sur les meilleures options.', 7),
    ('Qu''est-ce qui différencie GasyWay des autres agences ?', 'GasyWay connecte directement voyageurs et partenaires locaux experts. Notre plateforme garantit authenticité, prix transparents, et expériences personnalisées avec un impact positif sur les communautés locales.', 8)
) AS q(question, answer, order_index)
WHERE NOT EXISTS (
    SELECT 1 FROM faqs WHERE faq_type = 'general' AND faqs.question = q.question
);

-- =====================================================
-- 5. METTRE À JOUR LES PERMISSIONS
-- =====================================================

-- S'assurer que les permissions sont correctes
GRANT SELECT ON general_faqs TO authenticated;
GRANT SELECT ON pack_faqs TO authenticated;

-- =====================================================
-- 6. COMMENTAIRES POUR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN faqs.faq_type IS 'Type de FAQ: general pour GasyWay, interest pour centres d''intérêt';
COMMENT ON VIEW general_faqs IS 'FAQ générales de GasyWay accessibles publiquement';
COMMENT ON VIEW pack_faqs IS 'FAQ héritées par les packs (générales + centres d''intérêt)';

-- =====================================================
-- 7. VÉRIFICATION FINALE
-- =====================================================

-- Afficher le résumé des FAQ
SELECT 
    'FAQ Update Complete!' as status,
    (SELECT COUNT(*) FROM faqs WHERE faq_type = 'general') as general_faqs_count,
    (SELECT COUNT(*) FROM faqs WHERE faq_type = 'interest') as interest_faqs_count,
    (SELECT COUNT(*) FROM faqs) as total_faqs_count,
    (SELECT COUNT(*) FROM general_faqs) as general_faqs_view_count,
    (SELECT COUNT(DISTINCT pack_id) FROM pack_faqs) as packs_with_faqs_count;

-- Test rapide des vues
SELECT 'Vue general_faqs' as test, COUNT(*) as count FROM general_faqs
UNION ALL
SELECT 'Vue pack_faqs' as test, COUNT(*) as count FROM pack_faqs
UNION ALL  
SELECT 'FAQ générales actives' as test, COUNT(*) as count FROM faqs WHERE faq_type = 'general' AND is_active = true
UNION ALL
SELECT 'FAQ centres intérêt actives' as test, COUNT(*) as count FROM faqs WHERE faq_type = 'interest' AND is_active = true;