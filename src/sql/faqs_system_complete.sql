-- =====================================================
-- SYSTÈME FAQ COMPLET - GasyWay
-- Support FAQ générales + FAQ par centres d'intérêt
-- =====================================================

-- =====================================================
-- 1. CRÉATION TABLE FAQ PRINCIPALE
-- =====================================================

-- Supprimer la table si elle existe (pour reset)
DROP TABLE IF EXISTS faqs CASCADE;

-- Créer la table FAQ avec support des deux types
CREATE TABLE faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interest_id UUID REFERENCES interests(id) ON DELETE CASCADE, -- NULL pour FAQ générales
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    faq_type VARCHAR(20) NOT NULL DEFAULT 'interest' CHECK (faq_type IN ('general', 'interest')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes de cohérence
    CONSTRAINT faq_type_consistency CHECK (
        (faq_type = 'general' AND interest_id IS NULL) OR 
        (faq_type = 'interest' AND interest_id IS NOT NULL)
    )
);

-- =====================================================
-- 2. INDEX POUR OPTIMISATION
-- =====================================================

-- Index pour les FAQ actives par type
CREATE INDEX idx_faqs_type_active ON faqs(faq_type, is_active, order_index);

-- Index pour les FAQ par centre d'intérêt
CREATE INDEX idx_faqs_interest ON faqs(interest_id, is_active, order_index) WHERE interest_id IS NOT NULL;

-- Index pour les FAQ générales
CREATE INDEX idx_faqs_general ON faqs(faq_type, is_active, order_index) WHERE faq_type = 'general';

-- Index pour la recherche textuelle
CREATE INDEX idx_faqs_search ON faqs USING gin(to_tsvector('french', question || ' ' || answer));

-- =====================================================
-- 3. TRIGGERS POUR AUTO-UPDATE
-- =====================================================

-- Trigger pour mise à jour automatique du timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_faqs_updated_at 
    BEFORE UPDATE ON faqs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. POLITIQUES RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Activer RLS sur la table
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- Politique lecture : tout le monde peut lire les FAQ actives
CREATE POLICY "FAQ publiques lisibles par tous" ON faqs
    FOR SELECT USING (is_active = true);

-- Politique admin : les admins peuvent tout faire
CREATE POLICY "Admins peuvent gérer toutes les FAQ" ON faqs
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- =====================================================
-- 5. VUE POUR FAQ GÉNÉRALES
-- =====================================================

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

-- Commentaire pour documentation
COMMENT ON VIEW general_faqs IS 'FAQ générales de GasyWay accessibles publiquement';

-- =====================================================
-- 6. VUE POUR FAQ DES PACKS (HÉRITÉES)
-- =====================================================

-- Cette vue permet aux packs d'hériter des FAQ de leurs centres d'intérêt
-- PLUS les FAQ générales
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

-- Commentaire pour documentation
COMMENT ON VIEW pack_faqs IS 'FAQ héritées par les packs (générales + centres d\'intérêt)';

-- =====================================================
-- 7. VUE ADMINISTRATIVE COMPLÈTE
-- =====================================================

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
    END as interest_icon,
    -- Compter les packs impactés
    CASE 
        WHEN f.faq_type = 'general' THEN (SELECT COUNT(*) FROM packs WHERE status = 'published')
        ELSE (SELECT COUNT(DISTINCT pi.pack_id) FROM pack_interests pi 
              JOIN packs p ON pi.pack_id = p.id 
              WHERE pi.interest_id = f.interest_id AND p.status = 'published')
    END as packs_count
FROM faqs f
LEFT JOIN interests i ON f.interest_id = i.id
ORDER BY 
    f.faq_type,
    COALESCE(i.name_fr, 'GasyWay'),
    f.order_index;

-- =====================================================
-- 8. FONCTION POUR STATISTIQUES FAQ
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
        ),
        'packs_with_faqs', (
            SELECT COUNT(DISTINCT p.id)
            FROM packs p
            JOIN pack_interests pi ON p.id = pi.pack_id
            JOIN faqs f ON pi.interest_id = f.interest_id
            WHERE f.is_active = true AND p.status = 'published'
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. DONNÉES DE DÉMONSTRATION
-- =====================================================

-- FAQ Générales GasyWay
INSERT INTO faqs (interest_id, question, answer, order_index, faq_type) VALUES

-- FAQ Générales (faq_type = 'general', interest_id = NULL)
(NULL, 'Comment créer un compte sur GasyWay ?', 
 'Pour créer un compte, cliquez sur "Se connecter" puis "Créer un compte". Renseignez votre email, mot de passe, nom et numéro de téléphone. Vous recevrez un email de confirmation.', 
 1, 'general'),

(NULL, 'Comment réserver un pack touristique ?', 
 'Parcourez notre catalogue, sélectionnez un pack qui vous intéresse, choisissez vos dates et le nombre de participants, puis cliquez sur "Réserver". Remplissez le formulaire de contact pour finaliser votre demande.', 
 2, 'general'),

(NULL, 'Quels sont les moyens de paiement acceptés ?', 
 'Nous acceptons les virements bancaires, les paiements mobile money (Orange Money, MVola), et les paiements en espèces selon les arrangements avec nos partenaires.', 
 3, 'general'),

(NULL, 'Puis-je annuler ou modifier ma réservation ?', 
 'Oui, les annulations et modifications sont possibles selon les conditions de chaque pack. Contactez-nous au moins 48h avant le départ. Des frais peuvent s''appliquer selon la politique d''annulation.', 
 4, 'general'),

(NULL, 'GasyWay propose-t-il des assurances voyage ?', 
 'Nous recommandons fortement de souscrire une assurance voyage. Certains de nos partenaires proposent des assurances, sinon nous pouvons vous orienter vers des assureurs locaux.', 
 5, 'general'),

(NULL, 'Comment contacter le service client ?', 
 'Vous pouvez nous contacter via la messagerie intégrée à la plateforme, par email à support@gasyway.mg, ou par téléphone au +261 XX XXX XX XX. Notre équipe répond dans les 24h.', 
 6, 'general'),

(NULL, 'Les packs incluent-ils les vols internationaux ?', 
 'Non, nos packs couvrent uniquement les activités et services à Madagascar. Les vols internationaux sont à organiser séparément, mais nous pouvons vous conseiller sur les meilleures options.', 
 7, 'general'),

(NULL, 'Qu''est-ce qui différencie GasyWay des autres agences ?', 
 'GasyWay connecte directement voyageurs et partenaires locaux experts. Notre plateforme garantit authenticité, prix transparents, et expériences personnalisées avec un impact positif sur les communautés locales.', 
 8, 'general');

-- FAQ spécifiques aux centres d'intérêt (exemples)
-- Ces FAQ seront automatiquement héritées par les packs correspondants

-- FAQ pour Nature & Écotourisme
INSERT INTO faqs (interest_id, question, answer, order_index, faq_type)
SELECT 
    i.id,
    'Quel est le meilleur moment pour observer la faune ?',
    'La période idéale est de septembre à novembre (saison sèche). Les animaux sont plus actifs le matin et en fin d''après-midi. Chaque parc a ses spécificités selon les espèces à observer.',
    1,
    'interest'
FROM interests i WHERE i.name_fr = 'Nature & Écotourisme';

INSERT INTO faqs (interest_id, question, answer, order_index, faq_type)
SELECT 
    i.id,
    'Faut-il un guide pour les parcs nationaux ?',
    'Oui, un guide local est obligatoire dans la plupart des parcs nationaux malgaches. Nos guides sont certifiés et connaissent parfaitement la faune, la flore et les sentiers.',
    2,
    'interest'
FROM interests i WHERE i.name_fr = 'Nature & Écotourisme';

-- FAQ pour Sports nautiques
INSERT INTO faqs (interest_id, question, answer, order_index, faq_type)
SELECT 
    i.id,
    'Quel niveau de plongée est requis ?',
    'Nous proposons des activités pour tous niveaux : baptême pour débutants, plongées encadrées pour niveaux 1-2, et sites techniques pour plongeurs expérimentés. L''équipement est fourni.',
    1,
    'interest'
FROM interests i WHERE i.name_fr = 'Sports nautiques';

INSERT INTO faqs (interest_id, question, answer, order_index, faq_type)
SELECT 
    i.id,
    'Quelle est la meilleure saison pour les sports nautiques ?',
    'D''avril à novembre pour éviter les cyclones. La mer est plus calme de mai à octobre. Pour le kitesurf, les alizés sont idéaux de mai à septembre.',
    2,
    'interest'
FROM interests i WHERE i.name_fr = 'Sports nautiques';

-- FAQ pour Culture & Patrimoine
INSERT INTO faqs (interest_id, question, answer, order_index, faq_type)
SELECT 
    i.id,
    'Peut-on visiter les sites sacrés ?',
    'Certains sites sacrés sont accessibles aux visiteurs avec respect des traditions locales. Un guide culturel vous expliquera les règles à suivre et l''histoire des lieux.',
    1,
    'interest'
FROM interests i WHERE i.name_fr = 'Culture & Patrimoine';

-- =====================================================
-- 10. VÉRIFICATIONS ET TESTS
-- =====================================================

-- Test des contraintes
DO $$
BEGIN
    -- Test: FAQ générale avec interest_id doit échouer
    BEGIN
        INSERT INTO faqs (interest_id, question, answer, faq_type) 
        SELECT i.id, 'Test', 'Test', 'general' FROM interests i LIMIT 1;
        RAISE NOTICE 'ERREUR: Contrainte faq_type_consistency non respectée';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'OK: Contrainte faq_type_consistency fonctionne';
    END;

    -- Test: FAQ interest sans interest_id doit échouer
    BEGIN
        INSERT INTO faqs (question, answer, faq_type) VALUES ('Test', 'Test', 'interest');
        RAISE NOTICE 'ERREUR: Contrainte faq_type_consistency non respectée';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'OK: Contrainte faq_type_consistency fonctionne';
    END;
END
$$;

-- =====================================================
-- 11. PERMISSIONS ET SÉCURITÉ
-- =====================================================

-- Accorder les permissions de lecture aux utilisateurs authentifiés
GRANT SELECT ON faqs TO authenticated;
GRANT SELECT ON general_faqs TO authenticated;
GRANT SELECT ON pack_faqs TO authenticated;
GRANT SELECT ON admin_faqs_complete TO authenticated;

-- Accorder l'exécution de la fonction stats
GRANT EXECUTE ON FUNCTION get_faq_stats() TO authenticated;

-- =====================================================
-- 12. COMMENTAIRES DE DOCUMENTATION
-- =====================================================

COMMENT ON TABLE faqs IS 'Table FAQ supportant FAQ générales et FAQ par centres d''intérêt';
COMMENT ON COLUMN faqs.faq_type IS 'Type de FAQ: general pour GasyWay, interest pour centres d''intérêt';
COMMENT ON COLUMN faqs.interest_id IS 'Référence au centre d''intérêt (NULL pour FAQ générales)';
COMMENT ON COLUMN faqs.order_index IS 'Ordre d''affichage dans le groupe (FAQ générales ou centre d''intérêt)';

-- =====================================================
-- RÉSUMÉ DES VUES CRÉÉES
-- =====================================================
/*
1. general_faqs : FAQ générales uniquement
2. pack_faqs : FAQ héritées par les packs (générales + spécifiques)  
3. admin_faqs_complete : Vue administrative complète avec statistiques

UTILISATION :
- Frontend public : SELECT * FROM general_faqs
- Page pack : SELECT * FROM pack_faqs WHERE pack_id = ?
- Interface admin : SELECT * FROM admin_faqs_complete
- Statistiques : SELECT get_faq_stats()
*/

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================

-- Afficher un résumé
SELECT 
    'FAQ System Setup Complete!' as status,
    (SELECT COUNT(*) FROM faqs WHERE faq_type = 'general') as general_faqs,
    (SELECT COUNT(*) FROM faqs WHERE faq_type = 'interest') as interest_faqs,
    (SELECT COUNT(*) FROM faqs) as total_faqs;