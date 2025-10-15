-- =========================================
-- TABLES SUPABASE POUR GASYWAY MVP
-- =========================================
-- ⚠️ IMPORTANT: Ces scripts SQL sont fournis à titre de référence uniquement.
-- Dans l'environnement Figma Make, les tables doivent être créées manuellement
-- via l'interface Supabase car nous ne pouvons pas exécuter de DDL.
-- =========================================

-- Table des utilisateurs (étend auth.users de Supabase)
-- Cette table est synchronisée avec Supabase Auth
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR NOT NULL UNIQUE,
  role VARCHAR DEFAULT 'voyageur' CHECK (role IN ('voyageur', 'admin')),
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
  gdpr_consent BOOLEAN NOT NULL DEFAULT false,
  locale VARCHAR DEFAULT 'fr' CHECK (locale IN ('fr', 'en')),
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des profils utilisateur
-- Contient les informations personnelles détaillées
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  phone VARCHAR NOT NULL,
  avatar_url VARCHAR,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Contraintes
  UNIQUE(user_id) -- Un utilisateur = un profil
);

-- Table des centres d'intérêt
-- Catalogue géré par les administrateurs
CREATE TABLE interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label VARCHAR NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table de liaison utilisateur-intérêts (many-to-many)
-- Un utilisateur peut avoir plusieurs intérêts
-- Un intérêt peut être choisi par plusieurs utilisateurs
CREATE TABLE user_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interest_id UUID NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Contraintes
  UNIQUE(profile_id, interest_id) -- Éviter les doublons
);

-- =========================================
-- INDEXES POUR OPTIMISER LES PERFORMANCES
-- =========================================

-- Index sur les emails pour l'authentification
CREATE INDEX idx_users_email ON users(email);

-- Index sur les rôles pour filtrer admin/voyageur
CREATE INDEX idx_users_role ON users(role);

-- Index sur le statut pour exclure les utilisateurs bloqués
CREATE INDEX idx_users_status ON users(status);

-- Index sur user_id dans profiles pour les jointures
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- Index sur profile_id dans user_interests pour les requêtes de profil
CREATE INDEX idx_user_interests_profile_id ON user_interests(profile_id);

-- Index sur interest_id dans user_interests pour compter les utilisations
CREATE INDEX idx_user_interests_interest_id ON user_interests(interest_id);

-- Index sur les labels d'intérêts pour la recherche
CREATE INDEX idx_interests_label ON interests(label);

-- =========================================
-- TRIGGERS POUR LA MAINTENANCE AUTOMATIQUE
-- =========================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour users
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Trigger pour profiles
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Trigger pour interests
CREATE TRIGGER interests_updated_at
  BEFORE UPDATE ON interests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =========================================
-- ROW LEVEL SECURITY (RLS)
-- =========================================

-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

-- Politique pour users : les utilisateurs peuvent voir/modifier leur propre profil
CREATE POLICY users_own_data ON users
  USING (auth.uid() = id);

-- Politique pour profiles : les utilisateurs peuvent voir/modifier leur propre profil
CREATE POLICY profiles_own_data ON profiles
  USING (auth.uid() = user_id);

-- Politique pour interests : lecture publique, écriture admin seulement
CREATE POLICY interests_read_all ON interests
  FOR SELECT USING (true);

CREATE POLICY interests_admin_write ON interests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Politique pour user_interests : les utilisateurs peuvent gérer leurs propres intérêts
CREATE POLICY user_interests_own_data ON user_interests
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = user_interests.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

-- =========================================
-- DONNÉES DE DÉMONSTRATION
-- =========================================

-- Insérer quelques centres d'intérêt par défaut
INSERT INTO interests (id, label) VALUES
  ('a1b2c3d4-e5f6-4789-abcd-123456789001', 'Nature et Wildlife'),
  ('a1b2c3d4-e5f6-4789-abcd-123456789002', 'Culture et Histoire'),
  ('a1b2c3d4-e5f6-4789-abcd-123456789003', 'Aventure et Trekking'),
  ('a1b2c3d4-e5f6-4789-abcd-123456789004', 'Plages et Détente'),
  ('a1b2c3d4-e5f6-4789-abcd-123456789005', 'Gastronomie Locale'),
  ('a1b2c3d4-e5f6-4789-abcd-123456789006', 'Photographie'),
  ('a1b2c3d4-e5f6-4789-abcd-123456789007', 'Artisanat et Shopping'),
  ('a1b2c3d4-e5f6-4789-abcd-123456789008', 'Sports Nautiques'),
  ('a1b2c3d4-e5f6-4789-abcd-123456789009', 'Écotourisme'),
  ('a1b2c3d4-e5f6-4789-abcd-123456789010', 'Villages Traditionnels');

-- =========================================
-- NOTES D'IMPLÉMENTATION
-- =========================================

/*
MAPPING DES CHAMPS POUR LE FORMULAIRE D'INSCRIPTION :

Frontend → Table SQL:
- email → users.email
- password → auth.users.encrypted_password (géré par Supabase Auth)
- gdpr_consent → users.gdpr_consent
- locale → users.locale
- first_name → profiles.first_name
- last_name → profiles.last_name
- phone → profiles.phone
- avatar_url → profiles.avatar_url
- bio → profiles.bio
- interests[] → user_interests (lignes multiples)

LOGIQUE D'INSCRIPTION :
1. Créer l'utilisateur avec supabase.auth.signUp()
2. Insérer dans users avec les champs additionnels
3. Insérer dans profiles avec les données personnelles
4. Pour chaque intérêt : insérer dans user_interests

LOGIQUE DE CONNEXION :
1. Authentifier avec supabase.auth.signInWithPassword()
2. SELECT users avec les données de rôle/statut
3. SELECT profiles avec les données personnelles
4. SELECT interests via user_interests pour les préférences
5. Mettre à jour users.last_login

LOGIQUE D'ÉDITION DE PROFIL :
1. UPDATE profiles avec les nouvelles données
2. DELETE user_interests existants pour ce profile_id
3. INSERT nouveaux user_interests selon la sélection
*/