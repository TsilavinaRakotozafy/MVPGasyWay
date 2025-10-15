-- ========================================
-- TABLE BRAND SETTINGS POUR GASYWAY
-- ========================================

-- Table pour stocker les paramètres de marque (logos, favicon)
CREATE TABLE IF NOT EXISTS brand_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  file_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies pour la sécurité
ALTER TABLE brand_settings ENABLE ROW LEVEL SECURITY;

-- Les admins peuvent tout faire
CREATE POLICY "Admin can manage brand settings" ON brand_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Lecture publique pour tous (pour afficher les logos)
CREATE POLICY "Public can read brand settings" ON brand_settings
  FOR SELECT
  USING (is_active = true);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_brand_settings_key ON brand_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_brand_settings_active ON brand_settings(is_active);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_brand_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_brand_settings_updated_at
  BEFORE UPDATE ON brand_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_brand_settings_updated_at();

-- Insertion des valeurs par défaut
INSERT INTO brand_settings (setting_key, setting_value, description) VALUES
  ('logo_header', 'GasyWay', 'Logo affiché dans le header (texte ou URL)'),
  ('logo_footer', 'GasyWay', 'Logo affiché dans le footer (texte ou URL)'),
  ('favicon_url', '/favicon.ico', 'URL du favicon du site'),
  ('brand_name', 'GasyWay', 'Nom de la marque')
ON CONFLICT (setting_key) DO NOTHING;

-- Vue pour faciliter l'accès aux paramètres actifs
CREATE OR REPLACE VIEW active_brand_settings AS
SELECT 
  setting_key,
  setting_value,
  file_url,
  description,
  updated_at
FROM brand_settings 
WHERE is_active = true;

-- Fonction pour récupérer un paramètre facilement
CREATE OR REPLACE FUNCTION get_brand_setting(key_name TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  SELECT COALESCE(file_url, setting_value) INTO result
  FROM brand_settings 
  WHERE setting_key = key_name AND is_active = true;
  
  RETURN COALESCE(result, key_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON brand_settings TO anon, authenticated;
GRANT ALL ON brand_settings TO service_role;
GRANT SELECT ON active_brand_settings TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_brand_setting(TEXT) TO anon, authenticated;