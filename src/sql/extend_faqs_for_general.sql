-- =====================================================
-- EXTENSION FAQ SYSTEM - Support FAQ Générales GasyWay
-- =====================================================

-- Modifier la table FAQ pour rendre interest_id optionnel
ALTER TABLE faqs 
  ALTER COLUMN interest_id DROP NOT NULL;

-- Ajouter un champ type pour différencier
ALTER TABLE faqs 
  ADD COLUMN faq_type VARCHAR(20) DEFAULT 'interest' CHECK (faq_type IN ('general', 'interest'));

-- Mise à jour des FAQ existantes
UPDATE faqs SET faq_type = 'interest' WHERE interest_id IS NOT NULL;

-- Index pour optimiser les requêtes par type
CREATE INDEX IF NOT EXISTS idx_faqs_type ON faqs(faq_type, is_active, order_index);
CREATE INDEX IF NOT EXISTS idx_faqs_general ON faqs(faq_type) WHERE faq_type = 'general';

-- =====================================================
-- FAQ GÉNÉRALES DE DÉMONSTRATION
-- =====================================================

INSERT INTO faqs (interest_id, question, answer, order_index, faq_type) VALUES
-- FAQ Générales GasyWay
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

-- =====================================================
-- VUE MISE À JOUR POUR INCLURE LES FAQ GÉNÉRALES
-- =====================================================

-- Supprimer l'ancienne vue
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

-- =====================================================
-- VUE POUR LES FAQ GÉNÉRALES UNIQUEMENT
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
ORDER BY order_index;

-- Commentaires pour documentation
COMMENT ON VIEW general_faqs IS 'FAQ générales de GasyWay accessibles publiquement';
COMMENT ON COLUMN faqs.faq_type IS 'Type de FAQ: general pour GasyWay, interest pour centres d''intérêt';