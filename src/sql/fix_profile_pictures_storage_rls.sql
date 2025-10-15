-- 🔧 Correction des politiques RLS pour le bucket profile-pictures
-- Ce script corrige les erreurs de politiques et permet l'upload d'images

-- 1. Supprimer les anciennes politiques défectueuses (si elles existent)
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir toutes les photos de profil" ON storage.objects;
DROP POLICY IF EXISTS "Les utilisateurs peuvent uploader leurs propres photos" ON storage.objects;
DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs propres photos" ON storage.objects;
DROP POLICY IF EXISTS "Les utilisateurs peuvent remplacer leurs propres photos" ON storage.objects;

-- 2. Créer ou mettre à jour le bucket profile-pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures',
  'profile-pictures',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- 3. ✅ Politique pour SELECT (voir toutes les photos publiques)
CREATE POLICY "Public can view profile pictures"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');

-- 4. ✅ Politique pour INSERT (upload) - Les utilisateurs peuvent uploader leurs propres images
CREATE POLICY "Users can upload their own profile pictures"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND name LIKE (auth.uid()::text || '/%')
);

-- 5. ✅ Politique pour UPDATE (modifier) - Les utilisateurs peuvent modifier leurs propres images
CREATE POLICY "Users can update their own profile pictures"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures' 
  AND name LIKE (auth.uid()::text || '/%')
)
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND name LIKE (auth.uid()::text || '/%')
);

-- 6. ✅ Politique pour DELETE (supprimer) - Les utilisateurs peuvent supprimer leurs propres images
CREATE POLICY "Users can delete their own profile pictures"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures' 
  AND name LIKE (auth.uid()::text || '/%')
);

-- 7. 🛡️ Politique Admin (optionnelle) - Les admins peuvent tout faire
CREATE POLICY "Admins can manage all profile pictures"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'profile-pictures' 
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- 8. 📋 Vérifications
-- Vérifier que le bucket existe
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'profile-pictures';

-- Vérifier les politiques créées
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
WHERE tablename = 'objects' 
AND policyname LIKE '%profile%'
ORDER BY policyname;

-- 9. 🧪 Test de connexion utilisateur
SELECT 
  'Utilisateur connecté:' as status,
  auth.uid() as user_id,
  auth.email() as user_email;

-- 10. 💡 Instructions pour tester
-- Après avoir exécuté ce script:
-- 1. Connectez-vous avec un utilisateur 
-- 2. Testez l'upload d'une image de profil
-- 3. Le nom du fichier doit suivre le format: {user_id}/nom_fichier.webp