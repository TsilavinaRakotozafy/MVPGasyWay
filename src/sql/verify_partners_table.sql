-- ===============================================
-- VÉRIFICATION DE LA TABLE PARTNERS
-- Script de diagnostic pour l'architecture actuelle
-- ===============================================

-- 1. Vérifier si la table existe
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partners') 
    THEN '✅ Table partners existe'
    ELSE '❌ Table partners N''EXISTE PAS'
  END as status_table;

-- 2. Vérifier les colonnes si la table existe
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'partners'
ORDER BY ordinal_position;

-- 3. Vérifier les types ENUM
SELECT 
  t.typname as enum_name,
  e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('partner_status', 'partner_type', 'verification_status')
ORDER BY t.typname, e.enumsortorder;

-- 4. Compter les partenaires si la table existe
SELECT 
  COUNT(*) as total_partners,
  COUNT(*) FILTER (WHERE status = 'active') as active_partners,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_partners,
  COUNT(*) FILTER (WHERE status = 'inactive') as inactive_partners
FROM partners
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partners');

-- 5. Vérifier les politiques RLS
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'partners';

-- 6. Vérifier les index
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'partners';

-- 7. Vérifier les triggers
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'partners';

-- 8. Vérifier la vue partners_with_pack_count
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'partners_with_pack_count') 
    THEN '✅ Vue partners_with_pack_count existe'
    ELSE '❌ Vue partners_with_pack_count N''EXISTE PAS'
  END as status_view;

-- 9. Test de requête simple (si la table existe)
SELECT 
  id, 
  name, 
  partner_type,
  status,
  verification_status,
  city,
  region,
  commission_rate
FROM partners 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partners')
LIMIT 5;