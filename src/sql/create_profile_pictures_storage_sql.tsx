-- Création du bucket de stockage pour les photos de profil
-- À exécuter dans l'interface Supabase ou via SQL Editor

-- 1. Créer le bucket profile-pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures',
  'profile-pictures',
  true,
  5242880, -- 5MB
  '{"image/jpeg", "image/jpg", "image/png", "image/webp"}'
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = '{"image/jpeg", "image/jpg", "image/png", "image/webp"}';

-- 2. Politique RLS pour permettre aux utilisateurs connectés de voir toutes les images
CREATE POLICY "Les utilisateurs peuvent voir toutes les photos de profil"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'profile-pictures');

-- 3. Politique RLS pour permettre aux utilisateurs d'uploader leurs propres photos
CREATE POLICY "Les utilisateurs peuvent uploader leurs propres photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Politique RLS pour permettre aux utilisateurs de supprimer leurs propres photos
CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Politique RLS pour permettre aux utilisateurs de remplacer leurs propres photos
CREATE POLICY "Les utilisateurs peuvent remplacer leurs propres photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Vérification des buckets créés
SELECT * FROM storage.buckets WHERE id = 'profile-pictures';

-- Vérification des politiques créées
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%photo%';