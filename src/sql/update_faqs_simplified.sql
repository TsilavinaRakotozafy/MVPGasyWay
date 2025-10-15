-- =====================================================
-- MISE À JOUR SYSTÈME FAQ - Version simplifiée
-- Script pour ajouter le support FAQ générales
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

-- Index pour les FAQ générales
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
-- 3. CRÉER LES VUES SIMPLIFIÉES
-- =====================================================

-- Vue pour les FAQ générales uniquement
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

-- Vue pour les FAQ par centres d'intérêt
CREATE OR REPLACE VIEW interest_faqs AS
SELECT 
    f.id as faq_id,
    f.interest_id,
    f.question,
    f.answer,  
    f.order_index,
    i.name_fr as interest_name,
    i.icon as interest_icon,
    f.created_at,
    f.updated_at
FROM faqs f
JOIN interests i ON f.interest_id = i.id
WHERE f.faq_type = 'interest' 
  AND f.is_active = true
ORDER BY i.name_fr, f.order_index ASC;

-- Vue administrative complète
CREATE OR REPLACE VIEW admin_faqs_complete AS
SELECT 
    f.id,
    f.interest_id,
    f.question,
    f.answer,
    f.order_index,
    f.is_active,
    f.faq_type,
    f.created_at,
    f.updated_at,
    CASE 
        WHEN f.faq_type = 'general' THEN 'GasyWay'
        ELSE i.name_fr
    END as interest_name,
    CASE 
        WHEN f.faq_type = 'general' THEN '❓'
        ELSE i.icon
    END as interest_icon
FROM faqs f
LEFT JOIN interests i ON f.interest_id = i.id
ORDER BY 
    f.faq_type,
    COALESCE(i.name_fr, 'GasyWay'),
    f.order_index;

-- =====================================================
-- 4. METTRE À JOUR LES POLITIQUES RLS
-- =====================================================

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "FAQ publiques lisibles par tous" ON faqs;
DROP POLICY IF EXISTS "Admins peuvent gérer toutes les FAQ" ON faqs;

-- Recréer les politiques RLS
CREATE POLICY "FAQ publiques lisibles par tous" ON faqs
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins peuvent gérer toutes les FAQ" ON faqs
    FOR ALL USING (
        COALESCE((auth.jwt() ->> 'role'), 'traveler') = 'admin' OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- =====================================================
-- 5. INSÉRER LES FAQ GÉNÉRALES DE DÉMONSTRATION
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
-- 6. METTRE À JOUR LES PERMISSIONS
-- =====================================================

-- S'assurer que les permissions sont correctes
GRANT SELECT ON general_faqs TO authenticated;
GRANT SELECT ON interest_faqs TO authenticated;
GRANT SELECT ON admin_faqs_complete TO authenticated;

-- =====================================================
-- 7. COMMENTAIRES POUR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN faqs.faq_type IS 'Type de FAQ: general pour GasyWay, interest pour centres d''intérêt';
COMMENT ON VIEW general_faqs IS 'FAQ générales de GasyWay accessibles publiquement';
COMMENT ON VIEW interest_faqs IS 'FAQ spécifiques aux centres d''intérêt';

-- =====================================================
-- 8. VÉRIFICATION FINALE
-- =====================================================

-- Afficher le résumé des FAQ
SELECT 
    'FAQ Update Complete!' as status,
    (SELECT COUNT(*) FROM faqs WHERE faq_type = 'general') as general_faqs_count,  
    (SELECT COUNT(*) FROM faqs WHERE faq_type = 'interest') as interest_faqs_count,
    (SELECT COUNT(*) FROM faqs) as total_faqs_count;

-- Test des vues
SELECT 'Vue general_faqs' as test, COUNT(*) as count FROM general_faqs
UNION ALL
SELECT 'Vue interest_faqs' as test, COUNT(*) as count FROM interest_faqs
UNION ALL  
SELECT 'FAQ générales actives' as test, COUNT(*) as count FROM faqs WHERE faq_type = 'general' AND is_active = true
UNION ALL
SELECT 'FAQ centres intérêt actives' as test, COUNT(*) as count FROM faqs WHERE faq_type = 'interest' AND is_active = true;