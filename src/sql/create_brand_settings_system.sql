-- ========================================
-- TABLE BRAND SETTINGS POUR GASYWAY - VERSION ULTRA SIMPLE
-- ========================================

-- Étape 1: Créer la table de base
CREATE TABLE brand_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL DEFAULT '',
  file_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Étape 2: Activer RLS
ALTER TABLE brand_settings ENABLE ROW LEVEL SECURITY;

-- Étape 3: Politique pour les admins
CREATE POLICY "brand_settings_admin_policy" ON brand_settings
  FOR ALL
  TO authenticated
  USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- Étape 4: Politique pour la lecture publique
CREATE POLICY "brand_settings_read_policy" ON brand_settings
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Étape 5: Insérer les données par défaut
INSERT INTO brand_settings (setting_key, setting_value, description) VALUES
  ('logo_header', 'GasyWay', 'Logo affiché dans le header (texte ou URL)'),
  ('logo_footer', 'GasyWay', 'Logo affiché dans le footer (texte ou URL)'),
  ('favicon_url', '/favicon.ico', 'URL du favicon du site'),
  ('brand_name', 'GasyWay', 'Nom de la marque');