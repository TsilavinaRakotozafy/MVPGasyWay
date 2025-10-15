-- =====================================================
-- SYSTÈME DE GESTION DES INFORMATIONS DE L'ENTREPRISE
-- =====================================================
-- Création de la table company_info avec toutes les métadonnées nécessaires
-- Cache côté client : 30 minutes (données changent rarement)

-- Supprimer la table si elle existe
DROP TABLE IF EXISTS company_info CASCADE;

-- Créer la table company_info
CREATE TABLE company_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ==============================
  -- COORDONNÉES
  -- ==============================
  contact_email TEXT NOT NULL DEFAULT 'contact@gasyway.mg',
  contact_phone TEXT NOT NULL DEFAULT '+261 34 XX XX XX XX',
  address TEXT NOT NULL DEFAULT 'Antananarivo, Madagascar',
  
  -- ==============================
  -- TEXTES DE PRÉSENTATION
  -- ==============================
  hero_title TEXT NOT NULL DEFAULT 'À propos de GasyWay',
  hero_description TEXT NOT NULL DEFAULT 'Nous transformons la façon dont vous découvrez Madagascar, en connectant voyageurs et communautés locales pour un tourisme authentique et responsable.',
  
  mission_title TEXT NOT NULL DEFAULT 'Notre Mission',
  mission_description TEXT NOT NULL DEFAULT 'Créer un pont entre les voyageurs en quête d''authenticité et les communautés locales de Madagascar, tout en préservant l''environnement et la culture malgache.',
  
  vision_title TEXT NOT NULL DEFAULT 'Notre Vision',
  vision_description TEXT NOT NULL DEFAULT 'Faire de Madagascar une destination touristique de référence pour le tourisme responsable et communautaire.',
  
  commitment_title TEXT NOT NULL DEFAULT 'Notre Engagement',
  commitment_description TEXT NOT NULL DEFAULT 'Nous nous engageons à reverser une partie de nos revenus aux communautés locales et à promouvoir un tourisme respectueux de l''environnement.',
  
  -- ==============================
  -- RÉSEAUX SOCIAUX
  -- ==============================
  facebook_url TEXT,
  instagram_url TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  whatsapp_number TEXT,
  
  -- ==============================
  -- INFORMATIONS LÉGALES
  -- ==============================
  legal_name TEXT DEFAULT 'GasyWay',
  registration_number TEXT,
  founding_year INTEGER DEFAULT 2024,
  legal_form TEXT DEFAULT 'SARL',
  
  -- ==============================
  -- HORAIRES ET DISPONIBILITÉ
  -- ==============================
  business_hours TEXT DEFAULT 'Lundi - Vendredi : 9h00 - 17h00',
  timezone TEXT DEFAULT 'GMT+3 (Madagascar)',
  supported_languages TEXT[] DEFAULT ARRAY['Français', 'Malgache', 'Anglais'],
  
  -- ==============================
  -- MÉTADONNÉES
  -- ==============================
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================
-- TRIGGER DE MISE À JOUR AUTOMATIQUE
-- ==============================
CREATE OR REPLACE FUNCTION update_company_info_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER company_info_updated_at
  BEFORE UPDATE ON company_info
  FOR EACH ROW
  EXECUTE FUNCTION update_company_info_timestamp();

-- ==============================
-- POLICIES RLS (Row Level Security)
-- ==============================
ALTER TABLE company_info ENABLE ROW LEVEL SECURITY;

-- Politique lecture publique (tout le monde peut lire)
CREATE POLICY "Public can read company info"
  ON company_info
  FOR SELECT
  TO public
  USING (is_active = TRUE);

-- Politique mise à jour admin uniquement
CREATE POLICY "Only admins can update company info"
  ON company_info
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Politique insertion admin uniquement
CREATE POLICY "Only admins can insert company info"
  ON company_info
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ==============================
-- DONNÉES INITIALES
-- ==============================
INSERT INTO company_info (
  contact_email,
  contact_phone,
  address,
  hero_title,
  hero_description,
  mission_title,
  mission_description,
  vision_title,
  vision_description,
  commitment_title,
  commitment_description,
  legal_name,
  founding_year,
  legal_form,
  business_hours,
  timezone,
  supported_languages
) VALUES (
  'contact@gasyway.mg',
  '+261 34 XX XX XX XX',
  'Antananarivo, Madagascar',
  'À propos de GasyWay',
  'Nous transformons la façon dont vous découvrez Madagascar, en connectant voyageurs et communautés locales pour un tourisme authentique et responsable.',
  'Notre Mission',
  'Créer un pont entre les voyageurs en quête d''authenticité et les communautés locales de Madagascar, tout en préservant l''environnement et la culture malgache.',
  'Notre Vision',
  'Faire de Madagascar une destination touristique de référence pour le tourisme responsable et communautaire.',
  'Notre Engagement',
  'Nous nous engageons à reverser une partie de nos revenus aux communautés locales et à promouvoir un tourisme respectueux de l''environnement.',
  'GasyWay',
  2024,
  'SARL',
  'Lundi - Vendredi : 9h00 - 17h00',
  'GMT+3 (Madagascar)',
  ARRAY['Français', 'Malgache', 'Anglais']
);

-- ==============================
-- VÉRIFICATION
-- ==============================
SELECT 
  'company_info table created successfully' AS status,
  COUNT(*) AS records_count
FROM company_info;
