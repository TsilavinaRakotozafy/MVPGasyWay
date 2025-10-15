-- 🚨 CORRECTION D'URGENCE: Upload photos de profil
-- Script complet pour résoudre le problème RLS d'upload immédiatement

-- =============================================
-- 1. NETTOYAGE DES ANCIENNES POLITIQUES
-- =============================================

-- Supprimer toutes les anciennes politiques défectueuses
DO $$ 
BEGIN
    -- Supprimer les politiques avec des noms en français
    DROP POLICY IF EXISTS "Les utilisateurs peuvent voir toutes les photos de profil" ON storage.objects;
    DROP POLICY IF EXISTS "Les utilisateurs peuvent uploader leurs propres photos" ON storage.objects;
    DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs propres photos" ON storage.objects;
    DROP POLICY IF EXISTS "Les utilisateurs peuvent remplacer leurs propres photos" ON storage.objects;
    
    -- Supprimer les politiques avec des noms en anglais (si elles existent)
    DROP POLICY IF EXISTS "Public can view profile pictures" ON storage.objects;
    DROP POLICY IF EXISTS "Users can upload their own profile pictures" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own profile pictures" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own profile pictures" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can manage all profile pictures" ON storage.objects;
    
    EXCEPTION WHEN OTHERS THEN
        -- Ignorer les erreurs si les politiques n'existent pas
        NULL;
END $$;

-- =============================================
-- 2. CRÉATION/MISE À JOUR DU BUCKET
-- =============================================

-- Créer ou mettre à jour le bucket profile-pictures
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

-- =============================================
-- 3. NOUVELLES POLITIQUES RLS FONCTIONNELLES
-- =============================================

-- ✅ SELECT: Tout le monde peut voir les photos (public bucket)
CREATE POLICY "allow_public_select_profile_pictures"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');

-- ✅ INSERT: Utilisateurs connectés peuvent uploader dans leur dossier
CREATE POLICY "allow_authenticated_insert_profile_pictures"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ✅ UPDATE: Utilisateurs connectés peuvent modifier leurs fichiers
CREATE POLICY "allow_authenticated_update_profile_pictures"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ✅ DELETE: Utilisateurs connectés peuvent supprimer leurs fichiers
CREATE POLICY "allow_authenticated_delete_profile_pictures"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =============================================
-- 4. VÉRIFICATIONS DE SÉCURITÉ
-- =============================================

-- Vérifier que le bucket est correctement configuré
SELECT 
  '✅ Bucket configuré:' as status,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'profile-pictures';

-- Vérifier que les politiques sont créées
SELECT 
  '✅ Politiques créées:' as status,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%profile_pictures%'
ORDER BY policyname;

-- Vérifier l'utilisateur actuel
SELECT 
  '✅ Session utilisateur:' as status,
  auth.uid() as user_id,
  auth.email() as user_email,
  auth.role() as user_role;

-- =============================================
-- 5. INSTRUCTIONS POST-EXÉCUTION
-- =============================================

-- Après avoir exécuté ce script:
-- 1. Déconnectez-vous et reconnectez-vous dans l'app
-- 2. Testez l'upload d'une image de profil
-- 3. Le format du fichier sera: {user_id}/timestamp-random.webp
-- 4. Si ça ne marche toujours pas, vérifiez que l'utilisateur existe dans la table users

SELECT '🎯 SCRIPT TERMINÉ - Testez maintenant l''upload d''image!' as final_message;