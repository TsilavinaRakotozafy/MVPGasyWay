-- =========================================
-- MIGRATION: Fusion table profiles dans users
-- =========================================
-- Ce script fusionne les tables users et profiles en une seule table users
-- ATTENTION: Faire un backup avant d'exécuter ce script !

-- 1. AJOUT DES COLONNES DE PROFILES À LA TABLE USERS
-- ================================================

-- Colonnes profil de base
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'voyageur',
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS profile_picture_url text;

-- Colonnes centres d'intérêt
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}';

-- États et métadonnées
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_login_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Mise à jour de la colonne status si elle n'existe pas
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status user_status DEFAULT 'active';


-- 2. MIGRATION DES DONNÉES DE PROFILES VERS USERS
-- =============================================

-- Copier toutes les données de profiles vers users
UPDATE users 
SET 
  first_name = p.first_name,
  last_name = p.last_name,
  phone = p.phone,
  role = p.role,
  bio = p.bio,
  profile_picture_url = p.profile_picture_url,
  interests = p.interests,
  first_login_completed = p.first_login_completed,
  updated_at = p.updated_at
FROM profiles p 
WHERE users.id = p.user_id;

-- Vérification de la migration
DO $$
DECLARE
  users_count INTEGER;
  profiles_count INTEGER;
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO users_count FROM users;
  SELECT COUNT(*) INTO profiles_count FROM profiles;
  SELECT COUNT(*) INTO migrated_count FROM users WHERE first_name IS NOT NULL;
  
  RAISE NOTICE 'Migration Status:';
  RAISE NOTICE '- Users total: %', users_count;
  RAISE NOTICE '- Profiles total: %', profiles_count;
  RAISE NOTICE '- Users avec données migrées: %', migrated_count;
  
  IF migrated_count < profiles_count THEN
    RAISE WARNING 'Attention: Tous les profils n''ont pas été migrés !';
  ELSE
    RAISE NOTICE '✅ Migration des données réussie !';
  END IF;
END $$;


-- 3. CONTRAINTES ET VALIDATIONS
-- ============================

-- Contrainte CHECK pour le rôle (si pas déjà présente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE constraint_name = 'users_role_check'
  ) THEN
    ALTER TABLE users 
    ADD CONSTRAINT users_role_check 
    CHECK (role IN ('voyageur', 'admin'));
  END IF;
END $$;

-- Contrainte CHECK pour le statut (si pas déjà présente)  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE constraint_name = 'users_status_check'
  ) THEN
    ALTER TABLE users 
    ADD CONSTRAINT users_status_check 
    CHECK (status IN ('active', 'inactive', 'blocked'));
  END IF;
END $$;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_first_login_completed ON users(first_login_completed);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);


-- 4. POLITIQUES RLS POUR LA TABLE USERS UNIFIÉE
-- ============================================

-- Activer RLS si pas déjà fait
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques pour éviter les conflits
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Allow signup insert" ON users;

-- Nouvelles politiques RLS unifiées
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Allow authenticated insert" ON users
  FOR INSERT WITH CHECK (
    auth.uid() = id
  );

-- Politique pour permettre aux admins de tout voir/modifier
CREATE POLICY "Admins full access" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- 5. FONCTION TRIGGER POUR UPDATED_AT
-- ==================================

-- Créer ou remplacer la fonction de mise à jour timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger existant s'il existe
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Créer le nouveau trigger
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- 6. VÉRIFICATIONS FINALES
-- =======================

-- Vérifier que toutes les données sont bien migrées
DO $$
DECLARE
  missing_data INTEGER;
  total_users INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_users FROM users WHERE id IN (SELECT user_id FROM profiles);
  SELECT COUNT(*) INTO missing_data FROM users 
  WHERE id IN (SELECT user_id FROM profiles) 
  AND (first_name IS NULL OR last_name IS NULL);
  
  RAISE NOTICE 'Vérification finale:';
  RAISE NOTICE '- Total users avec profiles: %', total_users;
  RAISE NOTICE '- Users avec données manquantes: %', missing_data;
  
  IF missing_data = 0 THEN
    RAISE NOTICE '✅ Toutes les données ont été migrées avec succès !';
    RAISE NOTICE '📋 Vous pouvez maintenant:';
    RAISE NOTICE '   1. Mettre à jour AuthContextSQL pour ne plus faire de jointure';
    RAISE NOTICE '   2. Supprimer les références à user.profile dans le code';
    RAISE NOTICE '   3. Une fois testé, supprimer la table profiles';
  ELSE
    RAISE WARNING '⚠️  Il y a encore des données manquantes !';
  END IF;
END $$;

-- 7. AFFICHAGE DE LA NOUVELLE STRUCTURE
-- ===================================

-- Afficher la structure finale de la table users
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =========================================
-- FIN DE LA MIGRATION
-- =========================================

-- PROCHAINES ÉTAPES MANUELLES:
-- 1. Tester l'application avec la nouvelle structure
-- 2. Mettre à jour AuthContextSQL 
-- 3. Supprimer les références user.profile dans le code
-- 4. Supprimer la table profiles (plus tard, après tests)

-- COMMANDE POUR SUPPRIMER LA TABLE PROFILES (À FAIRE PLUS TARD):
-- DROP TABLE IF EXISTS profiles CASCADE;

RAISE NOTICE '🎯 Migration terminée ! Table users unifiée créée.';
RAISE NOTICE '📝 Suivez les étapes manuelles dans les commentaires.';