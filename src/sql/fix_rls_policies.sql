-- Script de réparation des politiques RLS pour résoudre les récursions infinies
-- GasyWay - Réparation urgente des politiques Row Level Security
-- Date: 2024

-- ÉTAPE 1: Supprimer toutes les politiques existantes qui peuvent causer des conflits
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "admin_full_access_users" ON users;
DROP POLICY IF EXISTS "Anyone can view interests" ON interests;
DROP POLICY IF EXISTS "interests_select_all" ON interests;
DROP POLICY IF EXISTS "interests_admin_manage" ON interests;
DROP POLICY IF EXISTS "Users can view own interests" ON user_interests;
DROP POLICY IF EXISTS "Users can manage own interests" ON user_interests;
DROP POLICY IF EXISTS "user_interests_select_own" ON user_interests;
DROP POLICY IF EXISTS "user_interests_manage_own" ON user_interests;
DROP POLICY IF EXISTS "user_interests_admin_full" ON user_interests;

-- ÉTAPE 2: Désactiver temporairement RLS pour nettoyer
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE interests DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests DISABLE ROW LEVEL SECURITY;

-- ÉTAPE 3: Réactiver RLS proprement
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 4: Créer des politiques RLS simples et sans récursion

-- Table USERS - Politiques de base
CREATE POLICY "users_can_view_own_profile" ON users 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "users_can_update_own_profile" ON users 
  FOR UPDATE 
  USING (auth.uid() = id) 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_can_insert_own_profile" ON users 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Table USERS - Politique admin (simple, sans sous-requête sur users)
CREATE POLICY "admin_users_full_access" ON users 
  FOR ALL 
  TO authenticated
  USING (
    -- Vérification simple sans sous-requête récursive
    auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin'
    OR 
    -- Fallback: vérifier directement dans auth.users metadata
    (auth.jwt() ->> 'user_metadata')::jsonb ? 'admin_access'
  );

-- Table INTERESTS - Accès public en lecture
CREATE POLICY "interests_public_read" ON interests 
  FOR SELECT 
  TO authenticated, anon 
  USING (true);

-- Table INTERESTS - Gestion admin (simple)
CREATE POLICY "interests_admin_write" ON interests 
  FOR ALL 
  TO authenticated
  USING (
    auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin'
  );

-- Table USER_INTERESTS - Accès utilisateur
CREATE POLICY "user_interests_own_access" ON user_interests 
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Table USER_INTERESTS - Accès admin
CREATE POLICY "user_interests_admin_access" ON user_interests 
  FOR ALL 
  TO authenticated
  USING (
    auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin'
  );

-- ÉTAPE 5: Vérifications de sécurité

-- Vérifier que RLS est activé
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('users', 'interests', 'user_interests');

-- Vérifier les politiques créées
SELECT schemaname, tablename, policyname, permissive, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('users', 'interests', 'user_interests')
ORDER BY tablename, policyname;

-- Message de confirmation
SELECT 'Politiques RLS réparées avec succès! Les récursions infinies ont été éliminées.' as status;