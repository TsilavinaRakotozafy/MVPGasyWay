# 🚨 Guide de Correction : Erreur Upload RLS

## ❌ Problème Identifié
```
Erreur: new row violates row-level security policy
```

Cette erreur se produit lors de l'upload d'images de profil car les politiques Row Level Security (RLS) du bucket Supabase Storage ne sont pas correctement configurées.

## ✅ Solution Rapide (5 minutes)

### 1. Exécuter le Script de Correction SQL

1. **Ouvrir Supabase Dashboard**
   - Allez sur https://app.supabase.com
   - Sélectionnez votre projet GasyWay

2. **Aller dans SQL Editor**
   - Menu latéral → SQL Editor
   - Créer une nouvelle query

3. **Copier-coller ce script complet :**

```sql
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

SELECT '🎯 SCRIPT TERMINÉ - Testez maintenant l''upload d''image!' as final_message;
```

4. **Exécuter le script**
   - Cliquer sur "Run" 
   - Vérifier que toutes les requêtes se sont exécutées sans erreur

### 2. Tester la Correction

1. **Se déconnecter et se reconnecter**
   - Dans l'application GasyWay, se déconnecter
   - Se reconnecter avec un compte utilisateur

2. **Tester l'upload**
   - Aller dans "Mon profil"
   - Essayer d'uploader une photo de profil
   - ✅ L'upload devrait maintenant fonctionner !

### 3. Diagnostic Avancé (si problème persiste)

1. **Interface Admin**
   - Se connecter avec un compte admin
   - Aller dans "Outils Dev" → "Diagnostic Upload"
   - Exécuter le diagnostic complet

2. **Vérifications manuelles dans Supabase**
   - Dashboard → Storage → profile-pictures
   - Vérifier que le bucket existe et est public
   - Authentication → Policies
   - Vérifier que les 4 nouvelles politiques sont présentes

## 🔧 Corrections Appliquées

### Problème 1: Format du nom de fichier
**Avant :** `profile-pictures/{userId}/filename.webp` (❌ double prefix)
**Après :** `{userId}/filename.webp` (✅ format correct)

### Problème 2: Politiques RLS défectueuses
**Avant :** Politiques utilisant `storage.foldername()` incorrectement
**Après :** Politiques avec la syntaxe correcte `(storage.foldername(name))[1]`

### Problème 3: Bucket mal configuré
**Avant :** Bucket potentiellement inexistant ou mal configuré
**Après :** Bucket créé avec les bonnes permissions et types MIME

## 🎯 Résultat Attendu

Après la correction :
- ✅ Upload d'images de profil fonctionnel
- ✅ Compression WebP intelligente active
- ✅ Qualité adaptative selon la taille du fichier
- ✅ Politiques RLS sécurisées (utilisateurs peuvent seulement modifier leurs propres images)
- ✅ Bucket public pour l'affichage des images

## 📞 Support

Si le problème persiste après ces corrections :

1. **Vérifier dans la console navigateur** s'il y a d'autres erreurs
2. **Utiliser le diagnostic admin** pour identifier le problème exact
3. **Vérifier que l'utilisateur existe bien dans la table `users`**
4. **S'assurer que Supabase RLS est activé** sur la table `storage.objects`

---

*Cette correction résout définitivement le problème d'upload RLS pour GasyWay* 🚀