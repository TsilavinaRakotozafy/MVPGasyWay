-- ========================================
-- CRÉATION DU BUCKET STORAGE POUR BRAND SETTINGS
-- ========================================

-- Créer le bucket pour les photos (s'il n'existe pas déjà)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos', 
  'photos', 
  true, 
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/x-icon']
) ON CONFLICT (id) DO NOTHING;

-- ========================================
-- POLITIQUES RLS POUR LE BUCKET PHOTOS
-- ========================================

-- Supprimer les anciennes politiques s'il y en a
DROP POLICY IF EXISTS "photos_admin_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "photos_public_view_policy" ON storage.objects;
DROP POLICY IF EXISTS "photos_admin_delete_policy" ON storage.objects;

-- Politique pour permettre aux admins d'uploader dans photos/brand/
CREATE POLICY "photos_admin_upload_policy" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'photos' 
    AND name LIKE 'brand/%'
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Politique pour permettre la lecture publique de tous les fichiers du bucket photos
CREATE POLICY "photos_public_view_policy" ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'photos');

-- Politique pour permettre aux admins de supprimer leurs uploads dans photos/brand/
CREATE POLICY "photos_admin_delete_policy" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'photos' 
    AND name LIKE 'brand/%'
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- ========================================
-- VÉRIFICATION DE LA CONFIGURATION
-- ========================================

-- Vérifier que le bucket existe
SELECT 
  id, 
  name, 
  public, 
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'photos';

-- Vérifier les politiques RLS
SELECT 
  schemaname,
  tablename, 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%photos%';