-- =====================================================
-- DIAGNOSTIC SUPPRESSION UTILISATEUR - CONTRAINTES ET RLS
-- =====================================================
-- Ce script diagnostic les problèmes de suppression d'utilisateur
-- =====================================================

-- 🔍 ÉTAPE 1: VÉRIFIER LA STRUCTURE DE LA TABLE USERS
-- ====================================================

SELECT 
  '🔍 STRUCTURE TABLE USERS' as diagnostic_step,
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 🔍 ÉTAPE 2: VÉRIFIER LES CONTRAINTES CHECK
-- ==========================================

SELECT 
  '🔍 CONTRAINTES CHECK SUR STATUS' as diagnostic_step,
  conname as constraint_name,
  pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'users'
AND c.contype = 'c'
AND pg_get_constraintdef(c.oid) LIKE '%status%';

-- 🔍 ÉTAPE 3: VÉRIFIER LES CLÉS ÉTRANGÈRES
-- =========================================

SELECT 
  '🔍 CLÉS ÉTRANGÈRES USERS' as diagnostic_step,
  conname as constraint_name,
  pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'users'
AND c.contype = 'f';

-- 🔍 ÉTAPE 4: VÉRIFIER LES POLITIQUES RLS
-- =======================================

SELECT 
  '🔍 POLITIQUES RLS USERS' as diagnostic_step,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users';

-- 🔍 ÉTAPE 5: VÉRIFIER LE STATUT RLS
-- ===================================

SELECT 
  '🔍 STATUT RLS' as diagnostic_step,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users';

-- 🔍 ÉTAPE 6: VÉRIFIER LES TRIGGERS
-- =================================

SELECT 
  '🔍 TRIGGERS SUR USERS' as diagnostic_step,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users';

-- 🔍 ÉTAPE 7: TESTER LES VALEURS DE STATUS AUTORISÉES
-- ====================================================

DO $$
DECLARE
  test_result TEXT;
BEGIN
  -- Tenter de créer un utilisateur test avec status = 'deleted'
  BEGIN
    INSERT INTO users (id, email, status, role)
    VALUES (gen_random_uuid(), 'test_delete_status@test.com', 'deleted', 'traveler');
    
    test_result := '✅ Status "deleted" autorisé';
    
    -- Nettoyer le test
    DELETE FROM users WHERE email = 'test_delete_status@test.com';
  EXCEPTION 
    WHEN check_violation THEN
      test_result := '❌ Status "deleted" bloqué par contrainte CHECK';
    WHEN OTHERS THEN
      test_result := '❌ Erreur autre: ' || SQLERRM;
  END;
  
  RAISE NOTICE '🧪 TEST STATUS DELETED: %', test_result;
END $$;

-- 🔍 ÉTAPE 8: VÉRIFIER LES RÉFÉRENCES VERS USERS
-- ===============================================

SELECT 
  '🔍 TABLES RÉFÉRENÇANT USERS' as diagnostic_step,
  conrelid::regclass as referencing_table,
  confrelid::regclass as referenced_table,
  conname as constraint_name,
  pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c
WHERE confrelid = 'users'::regclass
AND c.contype = 'f';

-- 🔍 ÉTAPE 9: DIAGNOSTIC COMPLET STATUS
-- =====================================

SELECT 
  '🎯 RÉSUMÉ DIAGNOSTIC' as summary,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'users'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) LIKE '%status%'
      AND pg_get_constraintdef(c.oid) NOT LIKE '%deleted%'
    ) THEN 'PROBLÈME: Contrainte CHECK bloque "deleted"'
    ELSE 'OK: Pas de contrainte CHECK bloquante détectée'
  END as status_constraint_issue,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users')
    THEN 'ATTENTION: Politiques RLS actives sur users'
    ELSE 'OK: Pas de politiques RLS sur users'
  END as rls_issue,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE tablename = 'users' AND rowsecurity = true
    ) THEN 'ATTENTION: RLS activé sur table users'
    ELSE 'OK: RLS désactivé sur table users'
  END as rls_enabled_status;

-- 📋 SOLUTION RECOMMANDÉE
-- =======================

SELECT 
  '💡 SOLUTIONS POSSIBLES' as solutions,
  '1. Modifier contrainte CHECK pour autoriser "deleted"' as solution_1,
  '2. Utiliser DELETE au lieu de UPDATE status' as solution_2,  
  '3. Bloquer utilisateur au lieu de supprimer' as solution_3,
  '4. Désactiver RLS temporairement pour admin' as solution_4;