-- Script simple pour vérifier la table interest_category
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- 1. Vérifier que la table existe
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_name = 'interest_category';

-- 2. Vérifier les colonnes
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'interest_category'
ORDER BY ordinal_position;

-- 3. Compter les enregistrements
SELECT COUNT(*) as total_categories FROM interest_category;

-- 4. Afficher quelques exemples
SELECT id, name FROM interest_category LIMIT 5;

-- 5. Vérifier les politiques RLS
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'interest_category';