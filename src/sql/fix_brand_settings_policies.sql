-- ========================================
-- CORRECTION DES POLITIQUES RLS BRAND SETTINGS
-- ========================================

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "brand_settings_admin_policy" ON brand_settings;
DROP POLICY IF EXISTS "brand_settings_read_policy" ON brand_settings;

-- Politique correcte pour les admins (utilise la table users personnalisée)
CREATE POLICY "brand_settings_admin_policy" ON brand_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Politique pour la lecture publique (tous peuvent lire les paramètres actifs)
CREATE POLICY "brand_settings_read_policy" ON brand_settings
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);