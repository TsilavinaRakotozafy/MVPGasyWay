-- ========================================
-- DIAGNOSTIC DU SETUP STORAGE SUPABASE
-- ========================================

-- 1. Vérifier les buckets existants
SELECT 
  '=== BUCKETS EXISTANTS ===' as section;

SELECT 
  id, 
  name, 
  public, 
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
ORDER BY created_at DESC;

-- 2. Vérifier les politiques RLS sur storage.objects
SELECT 
  '=== POLITIQUES RLS STORAGE ===' as section;

SELECT 
  policyname,
  permissive,
  roles,
  cmd as command,
  CASE 
    WHEN qual IS NOT NULL THEN 'Condition USING définie'
    ELSE 'Pas de condition USING'
  END as using_condition,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Condition WITH CHECK définie'
    ELSE 'Pas de condition WITH CHECK'
  END as check_condition
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
ORDER BY policyname;

-- 3. Vérifier s'il y a des fichiers dans le bucket photos
SELECT 
  '=== FICHIERS EXISTANTS ===' as section;

SELECT 
  name,
  bucket_id,
  ROUND(metadata->>'size'::numeric / 1024.0, 2) as size_kb,
  metadata->>'mimetype' as mimetype,
  created_at
FROM storage.objects 
WHERE bucket_id = 'photos'
AND name LIKE 'brand/%'
LIMIT 10;

-- 4. Test de création du bucket (safe - ne fait rien si existe déjà)
SELECT 
  '=== TEST CRÉATION BUCKET ===' as section;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos', 
  'photos', 
  true, 
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/x-icon']
) ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types
RETURNING id, name, 'Bucket créé/mis à jour' as status;

-- 5. Vérifier les permissions utilisateur
SELECT 
  '=== UTILISATEURS ADMIN ===' as section;

SELECT 
  id,
  email,
  role,
  status,
  first_login_completed
FROM users 
WHERE role = 'admin'
LIMIT 5;