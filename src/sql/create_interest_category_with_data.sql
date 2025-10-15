-- Créer la table interest_category et insérer des données d'exemple

-- 1. Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS interest_category (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Activer RLS
ALTER TABLE interest_category ENABLE ROW LEVEL SECURITY;

-- 3. Créer les politiques RLS pour permettre la lecture publique et l'écriture admin
DROP POLICY IF EXISTS "allow_read_interest_category" ON interest_category;
CREATE POLICY "allow_read_interest_category" ON interest_category
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_admin_all_interest_category" ON interest_category;
CREATE POLICY "allow_admin_all_interest_category" ON interest_category
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
           OR auth.users.user_metadata->>'role' = 'admin')
    )
  );

-- 4. Insérer des catégories d'exemple si la table est vide
INSERT INTO interest_category (name, description) 
SELECT * FROM (VALUES
  ('Aventure', 'Activités d''aventure et sports extrêmes'),
  ('Culture', 'Découverte culturelle et patrimoine'),
  ('Gastronomie', 'Cuisine locale et expériences culinaires'),
  ('Nature', 'Écotourisme et découverte de la nature'),
  ('Plage', 'Activités balnéaires et sports nautiques'),
  ('Montagne', 'Randonnée et activités de montagne')
) AS v(name, description)
WHERE NOT EXISTS (SELECT 1 FROM interest_category);

-- 5. Afficher le résultat
SELECT 
  id, 
  name, 
  description,
  created_at
FROM interest_category 
ORDER BY name;