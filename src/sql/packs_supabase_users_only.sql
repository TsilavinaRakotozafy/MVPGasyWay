-- ===============================================
-- SCRIPT PACKS SUPABASE - TABLE USERS UNIQUEMENT 🎯
-- Architecture: users avec colonne role (pas de profiles)
-- ===============================================

-- 🛡️ PHASE 1: NETTOYAGE SÉCURISÉ PRÉVENTIF
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '🧹 NETTOYAGE PRÉVENTIF...';
  
  -- Supprimer types ENUM potentiellement conflictuels
  DROP TYPE IF EXISTS pack_status CASCADE;
  DROP TYPE IF EXISTS pack_difficulty CASCADE;
  
  -- Supprimer tables dans l'ordre des dépendances
  DROP TABLE IF EXISTS pack_images CASCADE;
  DROP TABLE IF EXISTS pack_services CASCADE;
  DROP TABLE IF EXISTS pack_itinerary CASCADE;
  DROP TABLE IF EXISTS packs CASCADE;
  DROP TABLE IF EXISTS pack_categories CASCADE;
  
  RAISE NOTICE '✅ Nettoyage terminé';
END $$;

-- 🏗️ PHASE 2: CRÉATION DES TYPES ENUM
-- =====================================

CREATE TYPE pack_status AS ENUM ('active', 'inactive', 'archived');
CREATE TYPE pack_difficulty AS ENUM ('easy', 'medium', 'hard');

-- 🏗️ PHASE 3: CRÉATION DES TABLES
-- =================================

-- Table des catégories de packs
CREATE TABLE pack_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(10), -- Emoji ou code icône
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table principale des packs
CREATE TABLE packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informations de base
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL, 
  short_description TEXT,
  
  -- Prix et participants
  price DECIMAL(12,2) NOT NULL CHECK (price >= 0),
  currency VARCHAR(3) DEFAULT 'MGA',
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  max_participants INTEGER NOT NULL CHECK (max_participants > 0),
  min_participants INTEGER DEFAULT 1 CHECK (min_participants > 0),
  
  -- Localisation
  location VARCHAR(255) NOT NULL,
  coordinates_lat DECIMAL(10, 8), -- Latitude
  coordinates_lng DECIMAL(11, 8), -- Longitude
  
  -- Catégorie et statut
  category_id UUID REFERENCES pack_categories(id) ON DELETE SET NULL,
  status pack_status DEFAULT 'inactive',
  difficulty_level pack_difficulty DEFAULT 'medium',
  
  -- Saisons (format MM-DD)
  season_start VARCHAR(5), -- Ex: "04-01" pour 1er avril
  season_end VARCHAR(5),   -- Ex: "11-30" pour 30 novembre
  
  -- Politiques
  cancellation_policy TEXT,
  
  -- Métadonnées
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Contraintes
  CONSTRAINT valid_participants CHECK (min_participants <= max_participants),
  CONSTRAINT valid_seasons CHECK (
    (season_start IS NULL AND season_end IS NULL) OR 
    (season_start IS NOT NULL AND season_end IS NOT NULL)
  )
);

-- Table des images de packs
CREATE TABLE pack_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(255),
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des services inclus/exclus
CREATE TABLE pack_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  service_name VARCHAR(255) NOT NULL,
  is_included BOOLEAN NOT NULL DEFAULT true, -- true = inclus, false = exclu
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table de l'itinéraire jour par jour
CREATE TABLE pack_itinerary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number > 0),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  activities TEXT[], -- Array des activités
  accommodation VARCHAR(255),
  meals_included VARCHAR(100), -- Ex: "Petit-déjeuner, Déjeuner"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(pack_id, day_number)
);

-- 📊 PHASE 4: INDEX POUR PERFORMANCES
-- ====================================

-- Index pour les packs
CREATE INDEX idx_packs_status ON packs(status);
CREATE INDEX idx_packs_category ON packs(category_id);
CREATE INDEX idx_packs_location ON packs(location);
CREATE INDEX idx_packs_price ON packs(price);
CREATE INDEX idx_packs_duration ON packs(duration_days);
CREATE INDEX idx_packs_difficulty ON packs(difficulty_level);
CREATE INDEX idx_packs_created_at ON packs(created_at DESC);
CREATE INDEX idx_packs_created_by ON packs(created_by);

-- Index pour les images
CREATE INDEX idx_pack_images_pack_id ON pack_images(pack_id);
CREATE INDEX idx_pack_images_primary ON pack_images(pack_id, is_primary);
CREATE INDEX idx_pack_images_order ON pack_images(pack_id, display_order);

-- Index pour les services
CREATE INDEX idx_pack_services_pack_id ON pack_services(pack_id);
CREATE INDEX idx_pack_services_included ON pack_services(pack_id, is_included);

-- Index pour l'itinéraire
CREATE INDEX idx_pack_itinerary_pack_id ON pack_itinerary(pack_id);
CREATE INDEX idx_pack_itinerary_day ON pack_itinerary(pack_id, day_number);

-- ⚙️ PHASE 5: FONCTIONS TRIGGER
-- ==============================

-- Fonction pour updated_at
CREATE OR REPLACE FUNCTION update_packs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_pack_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_packs_updated_at_trigger
  BEFORE UPDATE ON packs
  FOR EACH ROW
  EXECUTE FUNCTION update_packs_updated_at();

CREATE TRIGGER update_pack_categories_updated_at_trigger
  BEFORE UPDATE ON pack_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_pack_categories_updated_at();

-- 🔐 PHASE 6: POLITIQUES RLS - TABLE USERS UNIQUEMENT
-- ====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE pack_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pack_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE pack_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE pack_itinerary ENABLE ROW LEVEL SECURITY;

-- Lecture publique des catégories actives (pour le catalogue public)
CREATE POLICY "allow_read_categories_public" ON pack_categories
  FOR SELECT USING (true);

-- Lecture publique des packs actifs (pour le catalogue public)
CREATE POLICY "allow_read_active_packs_public" ON packs
  FOR SELECT USING (status = 'active');

-- Lecture publique des données liées aux packs actifs
CREATE POLICY "allow_read_pack_images_public" ON pack_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM packs 
      WHERE packs.id = pack_images.pack_id AND packs.status = 'active'
    )
  );

CREATE POLICY "allow_read_pack_services_public" ON pack_services
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM packs 
      WHERE packs.id = pack_services.pack_id AND packs.status = 'active'
    )
  );

CREATE POLICY "allow_read_pack_itinerary_public" ON pack_itinerary
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM packs 
      WHERE packs.id = pack_itinerary.pack_id AND packs.status = 'active'
    )
  );

-- 🔑 POLITIQUES ADMIN - TABLE USERS AVEC COLONNE ROLE UNIQUEMENT
-- ===============================================================

-- Politiques admin pour pack_categories
CREATE POLICY "admin_all_pack_categories" ON pack_categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Politiques admin pour packs
CREATE POLICY "admin_all_packs" ON packs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Politiques admin pour pack_images
CREATE POLICY "admin_all_pack_images" ON pack_images
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Politiques admin pour pack_services
CREATE POLICY "admin_all_pack_services" ON pack_services
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Politiques admin pour pack_itinerary
CREATE POLICY "admin_all_pack_itinerary" ON pack_itinerary
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- 📊 PHASE 7: DONNÉES DE BASE
-- ============================

-- Insérer les catégories d'exemple
INSERT INTO pack_categories (name, description, icon) VALUES 
('Aventure', 'Expériences palpitantes et sports extrêmes', '🏔️'),
('Culture', 'Découverte du patrimoine et des traditions', '🏛️'),
('Nature', 'Immersion dans la faune et la flore', '🌿'),
('Plage', 'Détente et activités balnéaires', '🏖️'),
('Gastronomie', 'Découverte de la cuisine locale', '🍽️'),
('Randonnée', 'Treks et marches en pleine nature', '🥾');

-- 🎉 VÉRIFICATION FINALE
-- =======================

SELECT 
  '🎉 TABLES PACKS CRÉÉES AVEC SUCCÈS !' as message,
  (SELECT COUNT(*) FROM pack_categories) as categories_count,
  (SELECT COUNT(*) FROM packs) as packs_count,
  (SELECT COUNT(*) FROM pack_images) as images_count,
  (SELECT COUNT(*) FROM pack_services) as services_count,
  (SELECT COUNT(*) FROM pack_itinerary) as itinerary_count;

-- Test des politiques RLS
SELECT 
  '🔐 POLITIQUES RLS CRÉÉES (USERS UNIQUEMENT):' as info,
  tablename,
  COUNT(*) as policies_count
FROM pg_policies 
WHERE tablename LIKE 'pack%'
GROUP BY tablename
ORDER BY tablename;

-- Vérifier que la table users a bien une colonne role
SELECT 
  '👤 VÉRIFICATION TABLE USERS:' as info,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'role'
    ) THEN '✅ Colonne role trouvée dans users'
    ELSE '❌ Colonne role manquante dans users'
  END as users_role_status;

-- Message final
SELECT '✅ SCRIPT PACKS SUPABASE (USERS UNIQUEMENT) TERMINÉ !' as final_status;