-- ===============================================
-- SCRIPT PACKS SUPABASE COMPLET 🎯
-- Création des tables packs et relations
-- ===============================================

-- 🔍 PHASE 1: DÉTECTION AUTOMATIQUE DE L'ARCHITECTURE (réutilisation du système partners)
-- =====================================================

DO $$
DECLARE
  architecture_type TEXT := 'unknown';
  users_has_role BOOLEAN := false;
  profiles_exists BOOLEAN := false;
  profiles_has_role BOOLEAN := false;
BEGIN
  RAISE NOTICE '🔍 DÉTECTION AUTOMATIQUE DE L''ARCHITECTURE...';
  RAISE NOTICE '================================================';

  -- Vérifier si table users a la colonne role
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role'
  ) INTO users_has_role;

  -- Vérifier si table profiles existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'profiles'
  ) INTO profiles_exists;

  -- Vérifier si profiles a la colonne role
  IF profiles_exists THEN
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'profiles' AND column_name = 'role'
    ) INTO profiles_has_role;
  END IF;

  -- Déterminer l'architecture
  IF users_has_role AND NOT profiles_exists THEN
    architecture_type := 'users_unified';
    RAISE NOTICE '✅ ARCHITECTURE: Table users unifiée (avec rôle)';
  ELSIF profiles_exists AND profiles_has_role THEN
    architecture_type := 'users_profiles_split';
    RAISE NOTICE '✅ ARCHITECTURE: Tables séparées users + profiles (rôle dans profiles)';
  ELSIF profiles_exists AND users_has_role THEN
    architecture_type := 'hybrid';
    RAISE NOTICE '✅ ARCHITECTURE: Hybride (rôle dans les deux tables)';
  ELSE
    architecture_type := 'basic_users';
    RAISE NOTICE '✅ ARCHITECTURE: Table users basique (sans rôle)';
  END IF;

  -- Stocker dans une table temporaire pour utilisation ultérieure
  CREATE TEMP TABLE IF NOT EXISTS detected_architecture (
    architecture_type TEXT,
    users_has_role BOOLEAN,
    profiles_exists BOOLEAN,
    profiles_has_role BOOLEAN
  );
  
  DELETE FROM detected_architecture;
  INSERT INTO detected_architecture VALUES (
    architecture_type, users_has_role, profiles_exists, profiles_has_role
  );

END $$;

-- 🛡️ PHASE 2: NETTOYAGE SÉCURISÉ PRÉVENTIF
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '🧹 NETTOYAGE PRÉVENTIF...';
  
  -- Supprimer types ENUM potentiellement conflictuels
  DROP TYPE IF EXISTS pack_status CASCADE;
  DROP TYPE IF EXISTS pack_difficulty CASCADE;
  DROP TYPE IF EXISTS pack_itinerary_day CASCADE;
  
  -- Supprimer tables dans l'ordre des dépendances
  DROP TABLE IF EXISTS pack_images CASCADE;
  DROP TABLE IF EXISTS pack_services CASCADE;
  DROP TABLE IF EXISTS pack_itinerary CASCADE;
  DROP TABLE IF EXISTS packs CASCADE;
  DROP TABLE IF EXISTS pack_categories CASCADE;
  
  RAISE NOTICE '✅ Nettoyage terminé';
END $$;

-- 🏗️ PHASE 3: CRÉATION DES TYPES ENUM
-- =====================================

CREATE TYPE pack_status AS ENUM ('active', 'inactive', 'archived');
CREATE TYPE pack_difficulty AS ENUM ('easy', 'medium', 'hard');

-- 🏗️ PHASE 4: CRÉATION DES TABLES
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

-- 📊 PHASE 5: INDEX POUR PERFORMANCES
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

-- Index géospatial pour la recherche par coordonnées (optionnel)
-- CREATE INDEX idx_packs_coordinates ON packs USING GIST (point(coordinates_lng, coordinates_lat));

-- ⚙️ PHASE 6: FONCTIONS TRIGGER
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

-- 🔐 PHASE 7: POLITIQUES RLS ADAPTATIVES
-- =======================================

DO $$
DECLARE
  arch_info RECORD;
BEGIN
  RAISE NOTICE '🔐 CRÉATION POLITIQUES RLS ADAPTATIVES...';
  
  -- Récupérer l'architecture détectée
  SELECT * INTO arch_info FROM detected_architecture LIMIT 1;
  
  -- Activer RLS sur toutes les tables
  ALTER TABLE pack_categories ENABLE ROW LEVEL SECURITY;
  ALTER TABLE packs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE pack_images ENABLE ROW LEVEL SECURITY;
  ALTER TABLE pack_services ENABLE ROW LEVEL SECURITY;
  ALTER TABLE pack_itinerary ENABLE ROW LEVEL SECURITY;
  
  -- =============================================
  -- POLITIQUES POUR pack_categories
  -- =============================================
  
  -- Lecture publique des catégories actives (pour le catalogue public)
  CREATE POLICY "allow_read_categories_public" ON pack_categories
    FOR SELECT USING (true); -- Toutes les catégories sont lisibles publiquement
  
  -- =============================================
  -- POLITIQUES POUR packs
  -- =============================================
  
  -- Lecture publique des packs actifs (pour le catalogue public)
  CREATE POLICY "allow_read_active_packs_public" ON packs
    FOR SELECT USING (status = 'active');
  
  -- =============================================
  -- POLITIQUES POUR pack_images, pack_services, pack_itinerary
  -- =============================================
  
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
  
  -- =============================================
  -- POLITIQUES ADMIN SELON L'ARCHITECTURE
  -- =============================================
  
  IF arch_info.architecture_type = 'users_unified' THEN
    -- Architecture avec rôle dans users
    RAISE NOTICE '- Politiques admin pour: users unifiée (rôle dans users)';
    
    CREATE POLICY "allow_admin_all_pack_categories_users" ON pack_categories
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
    
    CREATE POLICY "allow_admin_all_packs_users" ON packs
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
      
    CREATE POLICY "allow_admin_all_pack_images_users" ON pack_images
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
      
    CREATE POLICY "allow_admin_all_pack_services_users" ON pack_services
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
      
    CREATE POLICY "allow_admin_all_pack_itinerary_users" ON pack_itinerary
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
      
  ELSIF arch_info.architecture_type = 'users_profiles_split' THEN
    -- Architecture avec rôle dans profiles
    RAISE NOTICE '- Politiques admin pour: users + profiles séparées (rôle dans profiles)';
    
    CREATE POLICY "allow_admin_all_pack_categories_profiles" ON pack_categories
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
    
    CREATE POLICY "allow_admin_all_packs_profiles" ON packs
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
      
    CREATE POLICY "allow_admin_all_pack_images_profiles" ON pack_images
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
      
    CREATE POLICY "allow_admin_all_pack_services_profiles" ON pack_services
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
      
    CREATE POLICY "allow_admin_all_pack_itinerary_profiles" ON pack_itinerary
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
      
  ELSIF arch_info.architecture_type = 'hybrid' THEN
    -- Architecture hybride (rôle dans les deux)
    RAISE NOTICE '- Politiques admin pour: hybride (rôle dans users ET profiles)';
    
    CREATE POLICY "allow_admin_all_pack_categories_hybrid" ON pack_categories
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() AND role = 'admin'
        ) OR EXISTS (
          SELECT 1 FROM profiles 
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
    
    CREATE POLICY "allow_admin_all_packs_hybrid" ON packs
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() AND role = 'admin'
        ) OR EXISTS (
          SELECT 1 FROM profiles 
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
      
    CREATE POLICY "allow_admin_all_pack_images_hybrid" ON pack_images
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() AND role = 'admin'
        ) OR EXISTS (
          SELECT 1 FROM profiles 
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
      
    CREATE POLICY "allow_admin_all_pack_services_hybrid" ON pack_services
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() AND role = 'admin'
        ) OR EXISTS (
          SELECT 1 FROM profiles 
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
      
    CREATE POLICY "allow_admin_all_pack_itinerary_hybrid" ON pack_itinerary
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() AND role = 'admin'
        ) OR EXISTS (
          SELECT 1 FROM profiles 
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
      
  ELSE
    -- Architecture basique ou inconnue (accès via raw_user_meta_data)
    RAISE NOTICE '- Politiques admin pour: basique/inconnue (métadonnées auth)';
    
    CREATE POLICY "allow_admin_all_pack_categories_metadata" ON pack_categories
      FOR ALL USING (
        (auth.jwt() ->> 'role') = 'admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
      );
    
    CREATE POLICY "allow_admin_all_packs_metadata" ON packs
      FOR ALL USING (
        (auth.jwt() ->> 'role') = 'admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
      );
      
    CREATE POLICY "allow_admin_all_pack_images_metadata" ON pack_images
      FOR ALL USING (
        (auth.jwt() ->> 'role') = 'admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
      );
      
    CREATE POLICY "allow_admin_all_pack_services_metadata" ON pack_services
      FOR ALL USING (
        (auth.jwt() ->> 'role') = 'admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
      );
      
    CREATE POLICY "allow_admin_all_pack_itinerary_metadata" ON pack_itinerary
      FOR ALL USING (
        (auth.jwt() ->> 'role') = 'admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
      );
  END IF;
  
  RAISE NOTICE '✅ Politiques RLS créées selon architecture détectée';
END $$;

-- 📊 PHASE 8: DONNÉES D'EXEMPLE
-- ==============================

-- Insérer les catégories d'exemple
INSERT INTO pack_categories (name, description, icon) VALUES 
('Aventure', 'Expériences palpitantes et sports extrêmes', '🏔️'),
('Culture', 'Découverte du patrimoine et des traditions', '🏛️'),
('Nature', 'Immersion dans la faune et la flore', '🌿'),
('Plage', 'Détente et activités balnéaires', '🏖️'),
('Gastronomie', 'Découverte de la cuisine locale', '🍽️'),
('Randonnée', 'Treks et marches en pleine nature', '🥾');

-- Récupérer les IDs des catégories pour les packs
DO $$
DECLARE
  cat_adventure_id UUID;
  cat_culture_id UUID;
  cat_nature_id UUID;
  cat_beach_id UUID;
  pack_andasibe_id UUID;
  pack_tsingy_id UUID;
  pack_nosy_be_id UUID;
  admin_user_id UUID;
BEGIN
  -- Récupérer les IDs des catégories
  SELECT id INTO cat_adventure_id FROM pack_categories WHERE name = 'Aventure';
  SELECT id INTO cat_culture_id FROM pack_categories WHERE name = 'Culture';
  SELECT id INTO cat_nature_id FROM pack_categories WHERE name = 'Nature';
  SELECT id INTO cat_beach_id FROM pack_categories WHERE name = 'Plage';
  
  -- Essayer de récupérer un utilisateur admin (flexible selon l'architecture)
  BEGIN
    SELECT id INTO admin_user_id FROM users WHERE email LIKE '%admin%' LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    admin_user_id := NULL;
  END;
  
  IF admin_user_id IS NULL THEN
    BEGIN
      SELECT id INTO admin_user_id FROM users LIMIT 1; -- Prendre n'importe quel utilisateur
    EXCEPTION WHEN OTHERS THEN
      admin_user_id := NULL;
    END;
  END IF;
  
  -- Insérer les packs d'exemple
  INSERT INTO packs (
    title, description, short_description, price, currency, duration_days,
    max_participants, min_participants, location, coordinates_lat, coordinates_lng,
    category_id, status, difficulty_level, season_start, season_end,
    cancellation_policy, created_by
  ) VALUES 
  (
    'Safari Andasibe-Mantadia',
    'Découvrez les lémuriens emblématiques de Madagascar dans leur habitat naturel. Une expérience inoubliable au cœur de la forêt tropicale humide.',
    'Safari lémuriens dans la forêt d''Andasibe',
    280000, 'MGA', 3, 8, 2,
    'Andasibe-Mantadia, Madagascar', -18.9441, 48.4245,
    cat_nature_id, 'active', 'medium', '04-01', '11-30',
    'Annulation gratuite jusqu''à 7 jours avant',
    admin_user_id
  ),
  (
    'Expédition Tsingy de Bemaraha',
    'Aventure exceptionnelle dans les formations rocheuses uniques des Tsingy. Escalade, tyrolienne et découverte d''un écosystème unique au monde.',
    'Aventure dans les formations rocheuses des Tsingy',
    450000, 'MGA', 5, 6, 2,
    'Tsingy de Bemaraha, Madagascar', -19.1347, 44.7844,
    cat_adventure_id, 'active', 'hard', '05-01', '10-31',
    'Annulation avec frais selon conditions météo',
    admin_user_id
  ),
  (
    'Détente à Nosy Be',
    'Séjour paradisiaque sur l''île aux parfums. Plages de sable blanc, eaux cristallines et couchers de soleil spectaculaires.',
    'Séjour détente sur l''île aux parfums',
    320000, 'MGA', 4, 12, 1,
    'Nosy Be, Madagascar', -13.3205, 48.2613,
    cat_beach_id, 'active', 'easy', '03-01', '12-31',
    'Annulation gratuite jusqu''à 3 jours avant',
    admin_user_id
  )
  RETURNING id INTO pack_andasibe_id, pack_tsingy_id, pack_nosy_be_id;
  
  -- Insérer des images d'exemple (Unsplash)
  INSERT INTO pack_images (pack_id, image_url, alt_text, display_order, is_primary) VALUES
  -- Pack Andasibe
  ((SELECT id FROM packs WHERE title = 'Safari Andasibe-Mantadia'), 'https://images.unsplash.com/photo-1564760055775-d63b17a55c44', 'Lémurien dans la forêt d''Andasibe', 1, true),
  ((SELECT id FROM packs WHERE title = 'Safari Andasibe-Mantadia'), 'https://images.unsplash.com/photo-1547036967-23d11aacaee0', 'Forêt tropicale Madagascar', 2, false),
  
  -- Pack Tsingy  
  ((SELECT id FROM packs WHERE title = 'Expédition Tsingy de Bemaraha'), 'https://images.unsplash.com/photo-1578662996442-48f60103fc96', 'Formations rocheuses Tsingy', 1, true),
  ((SELECT id FROM packs WHERE title = 'Expédition Tsingy de Bemaraha'), 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4', 'Escalade dans les Tsingy', 2, false),
  
  -- Pack Nosy Be
  ((SELECT id FROM packs WHERE title = 'Détente à Nosy Be'), 'https://images.unsplash.com/photo-1559827260-dc66d52bef19', 'Plage paradisiaque Nosy Be', 1, true),
  ((SELECT id FROM packs WHERE title = 'Détente à Nosy Be'), 'https://images.unsplash.com/photo-1571104508999-893933ded431', 'Coucher de soleil Nosy Be', 2, false);
  
  -- Insérer des services inclus/exclus
  INSERT INTO pack_services (pack_id, service_name, is_included, display_order) VALUES
  -- Pack Andasibe - Services inclus
  ((SELECT id FROM packs WHERE title = 'Safari Andasibe-Mantadia'), 'Transport', true, 1),
  ((SELECT id FROM packs WHERE title = 'Safari Andasibe-Mantadia'), 'Guide local', true, 2),
  ((SELECT id FROM packs WHERE title = 'Safari Andasibe-Mantadia'), 'Hébergement', true, 3),
  ((SELECT id FROM packs WHERE title = 'Safari Andasibe-Mantadia'), 'Repas', true, 4),
  ((SELECT id FROM packs WHERE title = 'Safari Andasibe-Mantadia'), 'Entrées parcs', true, 5),
  -- Pack Andasibe - Services exclus
  ((SELECT id FROM packs WHERE title = 'Safari Andasibe-Mantadia'), 'Vols internationaux', false, 1),
  ((SELECT id FROM packs WHERE title = 'Safari Andasibe-Mantadia'), 'Assurance voyage', false, 2),
  ((SELECT id FROM packs WHERE title = 'Safari Andasibe-Mantadia'), 'Pourboires', false, 3),
  
  -- Pack Tsingy - Services inclus
  ((SELECT id FROM packs WHERE title = 'Expédition Tsingy de Bemaraha'), 'Transport 4x4', true, 1),
  ((SELECT id FROM packs WHERE title = 'Expédition Tsingy de Bemaraha'), 'Guide spécialisé', true, 2),
  ((SELECT id FROM packs WHERE title = 'Expédition Tsingy de Bemaraha'), 'Équipement escalade', true, 3),
  ((SELECT id FROM packs WHERE title = 'Expédition Tsingy de Bemaraha'), 'Camping', true, 4),
  ((SELECT id FROM packs WHERE title = 'Expédition Tsingy de Bemaraha'), 'Repas', true, 5),
  -- Pack Tsingy - Services exclus
  ((SELECT id FROM packs WHERE title = 'Expédition Tsingy de Bemaraha'), 'Vols domestiques', false, 1),
  ((SELECT id FROM packs WHERE title = 'Expédition Tsingy de Bemaraha'), 'Équipement personnel', false, 2),
  ((SELECT id FROM packs WHERE title = 'Expédition Tsingy de Bemaraha'), 'Assurance', false, 3),
  
  -- Pack Nosy Be - Services inclus
  ((SELECT id FROM packs WHERE title = 'Détente à Nosy Be'), 'Hébergement bord de mer', true, 1),
  ((SELECT id FROM packs WHERE title = 'Détente à Nosy Be'), 'Petits déjeuners', true, 2),
  ((SELECT id FROM packs WHERE title = 'Détente à Nosy Be'), 'Excursions îles', true, 3),
  ((SELECT id FROM packs WHERE title = 'Détente à Nosy Be'), 'Transferts', true, 4),
  -- Pack Nosy Be - Services exclus
  ((SELECT id FROM packs WHERE title = 'Détente à Nosy Be'), 'Vols', false, 1),
  ((SELECT id FROM packs WHERE title = 'Détente à Nosy Be'), 'Déjeuners et dîners', false, 2),
  ((SELECT id FROM packs WHERE title = 'Détente à Nosy Be'), 'Activités nautiques payantes', false, 3);
  
  -- Insérer des itinéraires d'exemple
  INSERT INTO pack_itinerary (pack_id, day_number, title, description, activities, accommodation, meals_included) VALUES
  -- Itinéraire Pack Andasibe (3 jours)
  ((SELECT id FROM packs WHERE title = 'Safari Andasibe-Mantadia'), 1, 'Arrivée et première découverte', 'Accueil à Antananarivo et route vers Andasibe', ARRAY['Transfert depuis Antananarivo', 'Installation à l''hôtel', 'Première balade nocturne'], 'Hôtel Andasibe', 'Dîner'),
  ((SELECT id FROM packs WHERE title = 'Safari Andasibe-Mantadia'), 2, 'Safari dans le parc national', 'Journée complète d''exploration de la réserve', ARRAY['Safari matinal', 'Observation des lémuriens Indri', 'Randonnée dans la forêt primaire'], 'Hôtel Andasibe', 'Petit-déjeuner, Déjeuner, Dîner'),
  ((SELECT id FROM packs WHERE title = 'Safari Andasibe-Mantadia'), 3, 'Dernières observations et retour', 'Dernière matinée dans le parc et retour', ARRAY['Safari matinal', 'Visite village local', 'Retour Antananarivo'], 'Vol retour', 'Petit-déjeuner, Déjeuner'),
  
  -- Itinéraire Pack Tsingy (5 jours)
  ((SELECT id FROM packs WHERE title = 'Expédition Tsingy de Bemaraha'), 1, 'Départ vers les Tsingy', 'Route vers le parc national', ARRAY['Vol vers Morondava', 'Route 4x4 vers Bekopaka', 'Installation campement'], 'Campement Bekopaka', 'Dîner'),
  ((SELECT id FROM packs WHERE title = 'Expédition Tsingy de Bemaraha'), 2, 'Petits Tsingy', 'Découverte des petites formations', ARRAY['Randonnée Petits Tsingy', 'Initiation escalade', 'Via ferrata débutant'], 'Campement Bekopaka', 'Petit-déjeuner, Déjeuner, Dîner'),
  ((SELECT id FROM packs WHERE title = 'Expédition Tsingy de Bemaraha'), 3, 'Grands Tsingy', 'Aventure dans les grandes formations', ARRAY['Escalade Grands Tsingy', 'Tyrolienne', 'Exploration grottes'], 'Campement Bekopaka', 'Petit-déjeuner, Déjeuner, Dîner'),
  ((SELECT id FROM packs WHERE title = 'Expédition Tsingy de Bemaraha'), 4, 'Forêt de baobabs', 'Découverte de l''avenue des baobabs', ARRAY['Lever de soleil sur les Tsingy', 'Route vers Morondava', 'Coucher de soleil baobabs'], 'Hôtel Morondava', 'Petit-déjeuner, Déjeuner, Dîner'),
  ((SELECT id FROM packs WHERE title = 'Expédition Tsingy de Bemaraha'), 5, 'Retour', 'Vol retour vers Antananarivo', ARRAY['Dernière visite Morondava', 'Vol retour'], 'Vol retour', 'Petit-déjeuner'),
  
  -- Itinéraire Pack Nosy Be (4 jours)  
  ((SELECT id FROM packs WHERE title = 'Détente à Nosy Be'), 1, 'Arrivée à Nosy Be', 'Installation et première découverte', ARRAY['Vol vers Nosy Be', 'Installation resort', 'Détente plage'], 'Resort bord de mer', 'Dîner'),
  ((SELECT id FROM packs WHERE title = 'Détente à Nosy Be'), 2, 'Tour de l''île', 'Exploration de Nosy Be', ARRAY['Visite Hell-Ville', 'Distillerie ylang-ylang', 'Plage Andilana'], 'Resort bord de mer', 'Petit-déjeuner, Déjeuner'),
  ((SELECT id FROM packs WHERE title = 'Détente à Nosy Be'), 3, 'Excursion îles voisines', 'Découverte Nosy Komba et Nosy Tanikely', ARRAY['Excursion bateau', 'Snorkeling Nosy Tanikely', 'Village Nosy Komba'], 'Resort bord de mer', 'Petit-déjeuner, Déjeuner'),
  ((SELECT id FROM packs WHERE title = 'Détente à Nosy Be'), 4, 'Départ', 'Dernière matinée et vol retour', ARRAY['Détente matinale', 'Shopping souvenirs', 'Vol retour'], 'Vol retour', 'Petit-déjeuner');
  
  RAISE NOTICE '✅ Données d''exemple insérées avec succès';
END $$;

-- 🎉 VÉRIFICATION FINALE
-- =======================

SELECT 
  '🎉 TABLES PACKS CRÉÉES AVEC SUCCÈS !' as message,
  (SELECT COUNT(*) FROM pack_categories) as categories_count,
  (SELECT COUNT(*) FROM packs) as packs_count,
  (SELECT COUNT(*) FROM pack_images) as images_count,
  (SELECT COUNT(*) FROM pack_services) as services_count,
  (SELECT COUNT(*) FROM pack_itinerary) as itinerary_count;

-- Afficher l'architecture utilisée
SELECT 
  '📋 ARCHITECTURE DÉTECTÉE ET UTILISÉE:' as info,
  architecture_type,
  'Rôle dans users: ' || users_has_role as users_role,
  'Profiles existe: ' || profiles_exists as profiles,
  'Rôle dans profiles: ' || profiles_has_role as profiles_role
FROM detected_architecture;

-- Test des politiques RLS
SELECT 
  '🔐 POLITIQUES RLS CRÉÉES:' as info,
  tablename,
  COUNT(*) as policies_count
FROM pg_policies 
WHERE tablename LIKE 'pack%'
GROUP BY tablename
ORDER BY tablename;

-- Afficher les packs créés avec leurs relations
SELECT 
  '📊 PACKS CRÉÉS AVEC RELATIONS:' as info,
  p.title,
  pc.name as category,
  p.status,
  p.difficulty_level,
  p.price,
  (SELECT COUNT(*) FROM pack_images pi WHERE pi.pack_id = p.id) as images_count,
  (SELECT COUNT(*) FROM pack_services ps WHERE ps.pack_id = p.id AND ps.is_included = true) as included_services_count,
  (SELECT COUNT(*) FROM pack_itinerary pit WHERE pit.pack_id = p.id) as itinerary_days_count
FROM packs p
LEFT JOIN pack_categories pc ON p.category_id = pc.id
ORDER BY p.created_at DESC;

-- Nettoyage table temporaire
DROP TABLE IF EXISTS detected_architecture;

-- Message final
SELECT '✅ SCRIPT PACKS SUPABASE COMPLET TERMINÉ AVEC SUCCÈS !' as final_status;