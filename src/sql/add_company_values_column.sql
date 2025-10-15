-- ✅ Script SQL : Ajout de la colonne "values" à la table company_info
-- 📅 Date : 2025-10-11
-- 🎯 Objectif : Permettre la gestion dynamique des valeurs de l'entreprise (Écologie, Authenticité, etc.)

BEGIN;

-- 1️⃣ Ajouter la colonne values (type JSONB)
ALTER TABLE company_info
ADD COLUMN IF NOT EXISTS values JSONB DEFAULT '[]'::jsonb;

-- 2️⃣ Populer avec les 4 valeurs par défaut de GasyWay
UPDATE company_info
SET values = '[
  {
    "icon": "Leaf",
    "title": "Écologie",
    "description": "Préservation de la biodiversité exceptionnelle de Madagascar à travers un tourisme durable."
  },
  {
    "icon": "Handshake",
    "title": "Authenticité",
    "description": "Des expériences vraies, loin du tourisme de masse, au plus près des traditions malgaches."
  },
  {
    "icon": "Shield",
    "title": "Responsabilité",
    "description": "Impact positif sur les communautés locales avec une part équitable des revenus."
  },
  {
    "icon": "Heart",
    "title": "Humain",
    "description": "Connexion authentique entre voyageurs et habitants pour un échange culturel enrichissant."
  }
]'::jsonb
WHERE is_active = true;

-- 3️⃣ Créer un index pour améliorer les performances de recherche JSON
CREATE INDEX IF NOT EXISTS idx_company_info_values 
ON company_info USING gin (values);

-- 4️⃣ Ajouter un commentaire pour la documentation
COMMENT ON COLUMN company_info.values IS 'Valeurs de l''entreprise (JSONB array). Structure: [{"icon": "Leaf", "title": "Écologie", "description": "..."}]';

COMMIT;

-- ✅ Vérification
SELECT 
  id, 
  jsonb_pretty(values) as values_formatted,
  jsonb_array_length(values) as nb_values
FROM company_info 
WHERE is_active = true;

-- 📋 Résultat attendu :
-- ✅ Colonne "values" ajoutée
-- ✅ 4 valeurs par défaut insérées
-- ✅ Index GIN créé pour performances
-- ✅ Commentaire ajouté pour documentation

-- 🎯 Icônes Lucide-React disponibles :
-- Leaf, Handshake, Shield, Heart, Target, Users, Award, 
-- Star, CheckCircle, Globe, Compass, Zap, ThumbsUp, TrendingUp
