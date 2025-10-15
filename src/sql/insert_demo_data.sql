-- =========================================
-- DONNÉES DE DÉMONSTRATION POUR GASYWAY
-- =========================================
-- ⚠️ IMPORTANT: Ces scripts SQL sont fournis à titre de référence uniquement.
-- Dans l'environnement Figma Make, les données doivent être insérées via l'API
-- =========================================

-- IDs fixes pour les données de démonstration
-- Utilisateur démo voyageur : a1b2c3d4-demo-user-0001-voyageur0001
-- Utilisateur démo admin : a1b2c3d4-demo-user-0001-admin0000001

-- =========================================
-- 1. CENTRES D'INTÉRÊT PAR DÉFAUT
-- =========================================

INSERT INTO interests (id, label, created_at, updated_at) VALUES
  ('interest-001-nature-wildlife', 'Nature et Wildlife', now(), now()),
  ('interest-002-culture-histoire', 'Culture et Histoire', now(), now()),
  ('interest-003-aventure-trekking', 'Aventure et Trekking', now(), now()),
  ('interest-004-plages-detente', 'Plages et Détente', now(), now()),
  ('interest-005-gastronomie-locale', 'Gastronomie Locale', now(), now()),
  ('interest-006-photographie', 'Photographie', now(), now()),
  ('interest-007-artisanat-shopping', 'Artisanat et Shopping', now(), now()),
  ('interest-008-sports-nautiques', 'Sports Nautiques', now(), now()),
  ('interest-009-ecotourisme', 'Écotourisme', now(), now()),
  ('interest-010-villages-traditionnels', 'Villages Traditionnels', now(), now())
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  updated_at = now();

-- =========================================
-- 2. UTILISATEURS DE DÉMONSTRATION
-- =========================================

-- VOYAGEUR DÉMO
INSERT INTO users (
  id, 
  email, 
  role, 
  status, 
  gdpr_consent, 
  locale, 
  created_at, 
  last_login
) VALUES (
  'a1b2c3d4-demo-user-0001-voyageur0001',
  'demo@voyageur.com',
  'voyageur',
  'active',
  true,
  'fr',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  last_login = now();

-- ADMIN DÉMO
INSERT INTO users (
  id, 
  email, 
  role, 
  status, 
  gdpr_consent, 
  locale, 
  created_at, 
  last_login
) VALUES (
  'a1b2c3d4-demo-user-0001-admin0000001',
  'admin@gasyway.com',
  'admin',
  'active',
  true,
  'fr',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  last_login = now();

-- =========================================
-- 3. PROFILS DES UTILISATEURS DE DÉMONSTRATION
-- =========================================

-- PROFIL VOYAGEUR DÉMO
INSERT INTO profiles (
  id,
  user_id,
  first_name,
  last_name,
  phone,
  avatar_url,
  bio,
  created_at,
  updated_at
) VALUES (
  'profile-demo-voyageur-001',
  'a1b2c3d4-demo-user-0001-voyageur0001',
  'Demo',
  'Voyageur',
  '+261 34 12 345 67',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  'Utilisateur de démonstration pour tester les fonctionnalités voyageur de GasyWay. Passionné de découvertes et d''aventures à Madagascar.',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio,
  updated_at = now();

-- PROFIL ADMIN DÉMO
INSERT INTO profiles (
  id,
  user_id,
  first_name,
  last_name,
  phone,
  avatar_url,
  bio,
  created_at,
  updated_at
) VALUES (
  'profile-demo-admin-001',
  'a1b2c3d4-demo-user-0001-admin0000001',
  'Admin',
  'GasyWay',
  '+261 20 12 345 67',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  'Administrateur de la plateforme GasyWay. Responsable de la gestion des contenus touristiques et de l''expérience utilisateur.',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio,
  updated_at = now();

-- =========================================
-- 4. CENTRES D'INTÉRÊT DU VOYAGEUR DÉMO
-- =========================================

-- Supprimer les anciens intérêts du voyageur demo (pour éviter les doublons)
DELETE FROM user_interests WHERE profile_id = 'profile-demo-voyageur-001';

-- Ajouter quelques intérêts au voyageur démo
INSERT INTO user_interests (id, profile_id, interest_id, created_at) VALUES
  ('user-interest-demo-001', 'profile-demo-voyageur-001', 'interest-001-nature-wildlife', now()),
  ('user-interest-demo-002', 'profile-demo-voyageur-001', 'interest-003-aventure-trekking', now()),
  ('user-interest-demo-003', 'profile-demo-voyageur-001', 'interest-006-photographie', now()),
  ('user-interest-demo-004', 'profile-demo-voyageur-001', 'interest-009-ecotourisme', now());

-- =========================================
-- NOTES D'UTILISATION
-- =========================================

/*
COMPTES DE DÉMONSTRATION CRÉÉS :

1. VOYAGEUR :
   - Email : demo@voyageur.com
   - Mot de passe : demo123 (doit être configuré dans Supabase Auth séparément)
   - Nom : Demo Voyageur
   - Intérêts : Nature, Aventure, Photographie, Écotourisme

2. ADMIN :
   - Email : admin@gasyway.com
   - Mot de passe : admin123 (doit être configuré dans Supabase Auth séparément)
   - Nom : Admin GasyWay
   - Accès : Dashboard administrateur complet

IMPORTANT :
Ces scripts créent les données dans les tables mais PAS les comptes d'authentification.
Les comptes Supabase Auth doivent être créés séparément avec les mêmes IDs.

POUR CRÉER LES COMPTES AUTH :
1. Utiliser l'interface Supabase Auth
2. Ou utiliser l'API admin de Supabase
3. Utiliser les IDs exacts spécifiés ci-dessus
*/