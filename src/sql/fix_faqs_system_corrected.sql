-- =====================================================
-- CORRECTION SYSTÈME FAQ - GasyWay
-- Correction de l'erreur "column i.name_fr does not exist"
-- Script chronologique par étapes
-- =====================================================

-- =====================================================
-- ÉTAPE 1: DIAGNOSTIC DES TABLES EXISTANTES
-- =====================================================

-- Vérifier l'existence des tables nécessaires
SELECT 
    'Vérification des tables existantes' as etape,
    table_name,
    'exists' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('faqs', 'interests')
ORDER BY table_name;

-- Vérifier la structure de la table interests
SELECT 
    'Structure table interests' as etape,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'interests'
ORDER BY ordinal_position;

-- Vérifier la structure de la table faqs
SELECT 
    'Structure table faqs' as etape,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'faqs'
ORDER BY ordinal_position;

-- =====================================================
-- ÉTAPE 2: CRÉER/CORRIGER LA TABLE FAQS
-- =====================================================

-- Créer la table faqs si elle n'existe pas
CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interest_id UUID REFERENCES interests(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    faq_type VARCHAR(20) NOT NULL DEFAULT 'interest' CHECK (faq_type IN ('general', 'interest')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- Rendre interest_id optionnel pour permettre les FAQ générales
ALTER TABLE faqs ALTER COLUMN interest_id DROP NOT NULL;

-- Ajouter la contrainte de cohérence
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'faq_type_consistency') THEN
        ALTER TABLE faqs ADD CONSTRAINT faq_type_consistency CHECK (
            (faq_type = 'general' AND interest_id IS NULL) OR 
            (faq_type = 'interest' AND interest_id IS NOT NULL)
        );
        RAISE NOTICE 'Contrainte faq_type_consistency ajoutée';
    ELSE
        RAISE NOTICE 'Contrainte faq_type_consistency existe déjà';
    END IF;
END $$;

-- =====================================================
-- ÉTAPE 3: CRÉER LES INDEX OPTIMISÉS
-- =====================================================

-- Index pour les FAQ générales
CREATE INDEX IF NOT EXISTS idx_faqs_general 
    ON faqs(faq_type, is_active, order_index) 
    WHERE faq_type = 'general';

-- Index pour les FAQ par centres d'intérêt
CREATE INDEX IF NOT EXISTS idx_faqs_interest 
    ON faqs(interest_id, is_active, order_index) 
    WHERE interest_id IS NOT NULL;

-- Index général pour type et statut actif
CREATE INDEX IF NOT EXISTS idx_faqs_type_active 
    ON faqs(faq_type, is_active, order_index);

-- =====================================================
-- ÉTAPE 4: CRÉER LES TRIGGERS DE MISE À JOUR
-- =====================================================

-- Fonction pour mise à jour automatique du timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger sur la table faqs
DROP TRIGGER IF EXISTS update_faqs_updated_at ON faqs;
CREATE TRIGGER update_faqs_updated_at 
    BEFORE UPDATE ON faqs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ÉTAPE 5: CONFIGURER RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Activer RLS sur la table
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "FAQ publiques lisibles par tous" ON faqs;
DROP POLICY IF EXISTS "Admins peuvent gérer toutes les FAQ" ON faqs;

-- Politique lecture : tout le monde peut lire les FAQ actives
CREATE POLICY "FAQ publiques lisibles par tous" ON faqs
    FOR SELECT USING (is_active = true);

-- Politique admin : les admins peuvent tout faire
CREATE POLICY "Admins peuvent gérer toutes les FAQ" ON faqs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- =====================================================
-- ÉTAPE 6: CRÉER LES VUES (CORRIGÉES)
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
ORDER BY order_index ASC;

-- Vue pour les FAQ par centres d'intérêt (CORRECTION: utiliser i.name au lieu de i.name_fr)
CREATE OR REPLACE VIEW interest_faqs AS
SELECT 
    f.id as faq_id,
    f.interest_id,
    f.question,
    f.answer,
    f.order_index,
    i.name as interest_name,  -- CORRECTION: name au lieu de name_fr
    COALESCE(i.icon_url, '📋') as interest_icon,  -- CORRECTION: utiliser icon_url avec fallback
    f.created_at,
    f.updated_at
FROM faqs f
JOIN interests i ON f.interest_id = i.id
WHERE f.faq_type = 'interest' 
  AND f.is_active = true
ORDER BY i.name, f.order_index ASC;

-- Vue administrative complète (CORRIGÉE)
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
        ELSE COALESCE(i.name, 'Inconnu')  -- CORRECTION: name au lieu de name_fr
    END as interest_name,
    CASE 
        WHEN f.faq_type = 'general' THEN '❓'
        ELSE COALESCE(i.icon_url, '📋')  -- CORRECTION: icon_url au lieu de icon
    END as interest_icon
FROM faqs f
LEFT JOIN interests i ON f.interest_id = i.id
ORDER BY 
    f.faq_type,
    COALESCE(i.name, 'GasyWay'),  -- CORRECTION: name au lieu de name_fr
    f.order_index;

-- =====================================================
-- ÉTAPE 7: FONCTION DE STATISTIQUES
-- =====================================================

CREATE OR REPLACE FUNCTION get_faq_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_faqs', (SELECT COUNT(*) FROM faqs),
        'active_faqs', (SELECT COUNT(*) FROM faqs WHERE is_active = true),
        'general_faqs', (SELECT COUNT(*) FROM faqs WHERE faq_type = 'general' AND is_active = true),
        'interest_faqs', (SELECT COUNT(*) FROM faqs WHERE faq_type = 'interest' AND is_active = true),
        'interests_with_faqs', (
            SELECT COUNT(DISTINCT interest_id) 
            FROM faqs 
            WHERE interest_id IS NOT NULL AND is_active = true
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ÉTAPE 8: INSÉRER LES FAQ GÉNÉRALES DE BASE
-- =====================================================

-- Vérifier et insérer les FAQ générales si elles n'existent pas
INSERT INTO faqs (interest_id, question, answer, order_index, faq_type)
SELECT NULL, q.question, q.answer, q.order_index, 'general'
FROM (VALUES
    ('Comment créer un compte sur GasyWay ?', 
     'Pour créer un compte, cliquez sur "Se connecter" puis "Créer un compte". Renseignez votre email, mot de passe, nom et numéro de téléphone. Vous recevrez un email de confirmation.', 
     1),
    ('Comment réserver un pack touristique ?', 
     'Parcourez notre catalogue, sélectionnez un pack qui vous intéresse, choisissez vos dates et le nombre de participants, puis cliquez sur "Réserver". Remplissez le formulaire de contact pour finaliser votre demande.', 
     2),
    ('Quels sont les moyens de paiement acceptés ?', 
     'Nous acceptons les virements bancaires, les paiements mobile money (Orange Money, MVola), et les paiements en espèces selon les arrangements avec nos partenaires.', 
     3),
    ('Puis-je annuler ou modifier ma réservation ?', 
     'Oui, les annulations et modifications sont possibles selon les conditions de chaque pack. Contactez-nous au moins 48h avant le départ. Des frais peuvent s''appliquer selon la politique d''annulation.', 
     4),
    ('GasyWay propose-t-il des assurances voyage ?', 
     'Nous recommandons fortement de souscrire une assurance voyage. Certains de nos partenaires proposent des assurances, sinon nous pouvons vous orienter vers des assureurs locaux.', 
     5),
    ('Comment contacter le service client ?', 
     'Vous pouvez nous contacter via la messagerie intégrée à la plateforme, par email à support@gasyway.mg, ou par téléphone au +261 XX XXX XX XX. Notre équipe répond dans les 24h.', 
     6),
    ('Les packs incluent-ils les vols internationaux ?', 
     'Non, nos packs couvrent uniquement les activités et services à Madagascar. Les vols internationaux sont à organiser séparément, mais nous pouvons vous conseiller sur les meilleures options.', 
     7),
    ('Qu''est-ce qui différencie GasyWay des autres agences ?', 
     'GasyWay connecte directement voyageurs et partenaires locaux experts. Notre plateforme garantit authenticité, prix transparents, et expériences personnalisées avec un impact positif sur les communautés locales.', 
     8)
) AS q(question, answer, order_index)
WHERE NOT EXISTS (
    SELECT 1 FROM faqs WHERE faq_type = 'general' AND faqs.question = q.question
);

-- =====================================================
-- ÉTAPE 9: INSÉRER QUELQUES FAQ DE CENTRES D'INTÉRÊT
-- =====================================================

-- FAQ pour Nature (si le centre d'intérêt existe)
INSERT INTO faqs (interest_id, question, answer, order_index, faq_type)
SELECT 
    i.id,
    'Quel est le meilleur moment pour observer la faune ?',
    'La période idéale est de septembre à novembre (saison sèche). Les animaux sont plus actifs le matin et en fin d''après-midi. Chaque parc a ses spécificités selon les espèces à observer.',
    1,
    'interest'
FROM interests i 
WHERE LOWER(i.name) LIKE '%nature%' 
AND NOT EXISTS (
    SELECT 1 FROM faqs f 
    WHERE f.interest_id = i.id 
    AND f.question LIKE '%meilleur moment%'
)
LIMIT 1;

-- FAQ pour Culture (si le centre d'intérêt existe)
INSERT INTO faqs (interest_id, question, answer, order_index, faq_type)
SELECT 
    i.id,
    'Peut-on visiter les sites sacrés ?',
    'Certains sites sacrés sont accessibles aux visiteurs avec respect des traditions locales. Un guide culturel vous expliquera les règles à suivre et l''histoire des lieux.',
    1,
    'interest'
FROM interests i 
WHERE LOWER(i.name) LIKE '%culture%' 
AND NOT EXISTS (
    SELECT 1 FROM faqs f 
    WHERE f.interest_id = i.id 
    AND f.question LIKE '%sites sacrés%'
)
LIMIT 1;

-- FAQ pour Aventure (si le centre d'intérêt existe)
INSERT INTO faqs (interest_id, question, answer, order_index, faq_type)
SELECT 
    i.id,
    'Quel niveau physique est requis pour les activités d''aventure ?',
    'Le niveau requis varie selon l''activité. Nous proposons des expériences pour tous niveaux : débutant, intermédiaire et expert. Chaque pack précise le niveau de difficulté et les prérequis.',
    1,
    'interest'
FROM interests i 
WHERE LOWER(i.name) LIKE '%aventure%' 
AND NOT EXISTS (
    SELECT 1 FROM faqs f 
    WHERE f.interest_id = i.id 
    AND f.question LIKE '%niveau physique%'
)
LIMIT 1;

-- =====================================================
-- ÉTAPE 10: ACCORDER LES PERMISSIONS
-- =====================================================

-- Permissions sur les tables
GRANT SELECT ON faqs TO authenticated, anon;
GRANT SELECT ON general_faqs TO authenticated, anon;
GRANT SELECT ON interest_faqs TO authenticated, anon;
GRANT SELECT ON admin_faqs_complete TO authenticated;

-- Permission sur la fonction
GRANT EXECUTE ON FUNCTION get_faq_stats() TO authenticated;

-- =====================================================
-- ÉTAPE 11: COMMENTAIRES POUR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE faqs IS 'Table FAQ supportant FAQ générales et FAQ par centres d''intérêt';
COMMENT ON COLUMN faqs.faq_type IS 'Type de FAQ: general pour GasyWay, interest pour centres d''intérêt';
COMMENT ON COLUMN faqs.interest_id IS 'Référence au centre d''intérêt (NULL pour FAQ générales)';
COMMENT ON VIEW general_faqs IS 'FAQ générales de GasyWay accessibles publiquement';
COMMENT ON VIEW interest_faqs IS 'FAQ spécifiques aux centres d''intérêt avec nom corrigé';
COMMENT ON VIEW admin_faqs_complete IS 'Vue administrative complète avec colonnes corrigées';

-- =====================================================
-- ÉTAPE 12: TESTS ET VÉRIFICATIONS FINALES
-- =====================================================

-- Test 1: Vérifier que les vues fonctionnent sans erreur
SELECT 'Test vue general_faqs' as test, COUNT(*) as count FROM general_faqs;

-- Test 2: Vérifier la vue interest_faqs (devrait maintenant fonctionner)
SELECT 'Test vue interest_faqs' as test, COUNT(*) as count FROM interest_faqs;

-- Test 3: Vérifier la vue admin complète
SELECT 'Test vue admin_faqs_complete' as test, COUNT(*) as count FROM admin_faqs_complete;

-- Test 4: Afficher quelques exemples de chaque vue
SELECT 'Exemple FAQ générales:' as section;
SELECT faq_id, question, LEFT(answer, 50) || '...' as answer_preview
FROM general_faqs LIMIT 3;

SELECT 'Exemple FAQ centres d''intérêt:' as section;
SELECT faq_id, interest_name, question, LEFT(answer, 50) || '...' as answer_preview
FROM interest_faqs LIMIT 3;

-- Test 5: Statistiques finales
SELECT 'STATISTIQUES FINALES:' as section;
SELECT get_faq_stats() as stats;

-- Test 6: Résumé du déploiement
SELECT 
    'DÉPLOIEMENT SYSTÈME FAQ TERMINÉ!' as status,
    (SELECT COUNT(*) FROM faqs WHERE faq_type = 'general') as general_faqs_count,  
    (SELECT COUNT(*) FROM faqs WHERE faq_type = 'interest') as interest_faqs_count,
    (SELECT COUNT(*) FROM faqs) as total_faqs_count,
    (SELECT COUNT(*) FROM interests) as available_interests;

-- =====================================================
-- NOTES D'UTILISATION
-- =====================================================

/*
UTILISATION DES VUES :

1. FAQ GÉNÉRALES (publiques) :
   SELECT * FROM general_faqs;

2. FAQ PAR CENTRES D'INTÉRÊT :
   SELECT * FROM interest_faqs WHERE interest_name = 'Nature';

3. VUE ADMINISTRATIVE COMPLÈTE :
   SELECT * FROM admin_faqs_complete ORDER BY faq_type, interest_name;

4. STATISTIQUES :
   SELECT get_faq_stats();

CORRECTIONS APPORTÉES :
- ✅ i.name_fr → i.name (colonne réelle de la table interests)
- ✅ i.icon → i.icon_url avec fallback (colonne réelle + valeur par défaut)
- ✅ Gestion des NULL avec COALESCE
- ✅ Tests intégrés pour vérifier le bon fonctionnement
- ✅ Documentation complète des changements
*/