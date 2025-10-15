-- SCRIPT D'URGENCE: Désactiver temporairement RLS
-- ⚠️ ATTENTION: À utiliser uniquement pour débloquer l'authentification
-- ⚠️ RÉACTIVER RLS dès que possible pour la sécurité

-- Désactiver RLS sur toutes les tables critiques
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE interests DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests DISABLE ROW LEVEL SECURITY;

-- Vérification
SELECT 
  schemaname, 
  tablename, 
  rowsecurity,
  CASE 
    WHEN rowsecurity = false THEN '✅ RLS désactivé'
    ELSE '❌ RLS encore actif'
  END as status
FROM pg_tables 
WHERE tablename IN ('users', 'interests', 'user_interests');

-- Message d'avertissement
SELECT '⚠️ RLS DÉSACTIVÉ - Ne pas oublier de le réactiver après debug!' as warning;