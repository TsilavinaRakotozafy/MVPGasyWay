-- ✅ Script de création du bucket pour les images des régions
-- À exécuter dans l'onglet SQL de Supabase

-- 1. Créer le bucket pour les images des régions
INSERT INTO storage.buckets (id, name, public)
VALUES ('regions-images', 'regions-images', true);

-- 2. Politique RLS pour permettre la lecture publique
CREATE POLICY "Allow public read access on regions images"
ON storage.objects FOR SELECT
USING (bucket_id = 'regions-images');

-- 3. Politique RLS pour permettre l'upload aux utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to upload regions images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'regions-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Politique RLS pour permettre aux utilisateurs de modifier leurs propres images
CREATE POLICY "Allow users to update their own regions images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'regions-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Politique RLS pour permettre aux utilisateurs de supprimer leurs propres images
CREATE POLICY "Allow users to delete their own regions images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'regions-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Permettre aux admins de gérer toutes les images des régions
CREATE POLICY "Allow admins to manage all regions images"
ON storage.objects FOR ALL
USING (
  bucket_id = 'regions-images' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ✅ Vérification de la création du bucket
SELECT 
  id,
  name,
  public,
  created_at
FROM storage.buckets 
WHERE id = 'regions-images';

-- ✅ Vérification des politiques RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%regions%';

-- 📋 Instructions pour tester l'upload :
-- 1. Connectez-vous avec un compte admin dans l'application
-- 2. Allez dans Gestion des régions
-- 3. Créez ou modifiez une région
-- 4. Testez l'upload d'une image dans le nouveau composant
-- 5. Vérifiez que l'image s'affiche correctement

-- 🎯 Configuration du bucket :
-- • Nom: regions-images
-- • Public: true (lecture publique des images)
-- • Upload: utilisateurs authentifiés uniquement
-- • Structure: userId/timestamp-randomId.webp
-- • Compression: WebP automatique avec qualité optimisée

COMMENT ON TABLE storage.buckets IS 'Bucket regions-images créé pour stocker les images des régions touristiques de Madagascar avec compression WebP automatique et RLS sécurisé.';