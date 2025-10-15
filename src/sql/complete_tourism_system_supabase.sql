-- ===============================================
-- SYSTÈME COMPLET DE TOURISME SUPABASE 🌍
-- Favoris, Réservations, Avis, Notifications & Paiements
-- ===============================================

-- 🔍 PHASE 1: DÉTECTION AUTOMATIQUE DE L'ARCHITECTURE (réutilise le système existant)
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
  RAISE NOTICE '🧹 NETTOYAGE PRÉVENTIF DES NOUVELLES TABLES...';
  
  -- Supprimer types ENUM potentiellement conflictuels
  DROP TYPE IF EXISTS booking_status CASCADE;
  DROP TYPE IF EXISTS payment_status CASCADE;
  DROP TYPE IF EXISTS review_status CASCADE;
  DROP TYPE IF EXISTS notification_type CASCADE;
  DROP TYPE IF EXISTS notification_status CASCADE;
  
  -- Supprimer tables dans l'ordre des dépendances
  DROP TABLE IF EXISTS review_images CASCADE;
  DROP TABLE IF EXISTS payment_transactions CASCADE;
  DROP TABLE IF EXISTS booking_participants CASCADE;
  DROP TABLE IF EXISTS notifications CASCADE;
  DROP TABLE IF EXISTS reviews CASCADE;
  DROP TABLE IF EXISTS payments CASCADE;
  DROP TABLE IF EXISTS bookings CASCADE;
  DROP TABLE IF EXISTS user_favorites CASCADE;
  
  RAISE NOTICE '✅ Nettoyage terminé';
END $$;

-- 🏗️ PHASE 3: CRÉATION DES TYPES ENUM
-- =====================================

CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'refunded');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'disputed');
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected', 'reported');
CREATE TYPE notification_type AS ENUM ('booking', 'payment', 'review', 'system', 'marketing', 'reminder');
CREATE TYPE notification_status AS ENUM ('unread', 'read', 'archived');

-- 🏗️ PHASE 4: CRÉATION DES TABLES
-- =================================

-- =============================================
-- TABLE 1: FAVORIS UTILISATEURS
-- =============================================

CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pack_id UUID NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Contraintes
  UNIQUE(user_id, pack_id) -- Un utilisateur ne peut favoriser qu'une fois le même pack
);

-- =============================================
-- TABLE 2: RÉSERVATIONS (BOOKINGS)
-- =============================================

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Références
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  pack_id UUID NOT NULL REFERENCES packs(id) ON DELETE RESTRICT,
  
  -- Informations de base
  booking_reference VARCHAR(20) NOT NULL UNIQUE, -- Ex: "GW-2024-001234"
  status booking_status DEFAULT 'pending',
  
  -- Participants et dates
  number_of_participants INTEGER NOT NULL CHECK (number_of_participants > 0),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Tarification
  price_per_person DECIMAL(12,2) NOT NULL CHECK (price_per_person >= 0),
  total_price DECIMAL(12,2) NOT NULL CHECK (total_price >= 0),
  currency VARCHAR(3) DEFAULT 'MGA',
  
  -- Informations de contact
  contact_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50) NOT NULL,
  
  -- Messages et demandes spéciales
  special_requests TEXT,
  internal_notes TEXT, -- Notes admin seulement
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  
  -- Contraintes
  CONSTRAINT valid_dates CHECK (end_date >= start_date),
  CONSTRAINT valid_total_price CHECK (total_price = price_per_person * number_of_participants)
);

-- =============================================
-- TABLE 3: PARTICIPANTS AUX RÉSERVATIONS
-- =============================================

CREATE TABLE booking_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  
  -- Informations participant
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  date_of_birth DATE,
  nationality VARCHAR(100),
  passport_number VARCHAR(50),
  dietary_restrictions TEXT,
  medical_conditions TEXT,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- TABLE 4: PAIEMENTS
-- =============================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Références
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  
  -- Informations de paiement
  payment_reference VARCHAR(50) NOT NULL UNIQUE, -- Ex: "PAY-GW-2024-001234"
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'MGA',
  status payment_status DEFAULT 'pending',
  
  -- Méthode de paiement
  payment_method VARCHAR(50), -- Ex: "card", "mobile_money", "bank_transfer"
  payment_provider VARCHAR(100), -- Ex: "stripe", "mvola", "orange_money"
  
  -- Identifiants externes
  external_transaction_id VARCHAR(255), -- ID du processeur de paiement
  gateway_response TEXT, -- Réponse JSON du gateway
  
  -- Dates
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  
  -- Messages
  failure_reason TEXT,
  admin_notes TEXT
);

-- =============================================
-- TABLE 5: TRANSACTIONS DE PAIEMENT (LOGS)
-- =============================================

CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  
  -- Informations de transaction
  transaction_type VARCHAR(50) NOT NULL, -- "charge", "refund", "partial_refund"
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'MGA',
  
  -- Réponse du processeur
  external_transaction_id VARCHAR(255),
  gateway_response TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_by UUID REFERENCES users(id) ON DELETE SET NULL -- Admin qui a traité
);

-- =============================================
-- TABLE 6: AVIS ET ÉVALUATIONS
-- =============================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Références
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  pack_id UUID NOT NULL REFERENCES packs(id) ON DELETE RESTRICT,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL, -- Optionnel: lié à une réservation
  
  -- Évaluation
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  
  -- Évaluations détaillées (optionnelles)
  service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  location_rating INTEGER CHECK (location_rating >= 1 AND location_rating <= 5),
  guide_rating INTEGER CHECK (guide_rating >= 1 AND guide_rating <= 5),
  
  -- Statut et modération
  status review_status DEFAULT 'pending',
  moderated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  moderated_at TIMESTAMP WITH TIME ZONE,
  moderation_reason TEXT,
  
  -- Recommandation
  would_recommend BOOLEAN,
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Contraintes
  UNIQUE(user_id, pack_id) -- Un utilisateur ne peut donner qu'un avis par pack
);

-- =============================================
-- TABLE 7: IMAGES D'AVIS
-- =============================================

CREATE TABLE review_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  
  image_url TEXT NOT NULL,
  caption VARCHAR(255),
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- TABLE 8: NOTIFICATIONS
-- =============================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Destinataire
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Contenu
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT, -- URL vers laquelle rediriger si cliqué
  
  -- Références optionnelles
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  pack_id UUID REFERENCES packs(id) ON DELETE SET NULL,
  review_id UUID REFERENCES reviews(id) ON DELETE SET NULL,
  
  -- Statut
  status notification_status DEFAULT 'unread',
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE -- Notifications temporaires
);

-- 📊 PHASE 5: INDEX POUR PERFORMANCES
-- ====================================

-- Index pour user_favorites
CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_pack_id ON user_favorites(pack_id);
CREATE INDEX idx_user_favorites_created_at ON user_favorites(created_at DESC);

-- Index pour bookings
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_pack_id ON bookings(pack_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_start_date ON bookings(start_date);
CREATE INDEX idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);

-- Index pour booking_participants
CREATE INDEX idx_booking_participants_booking_id ON booking_participants(booking_id);

-- Index pour payments
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_reference ON payments(payment_reference);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- Index pour payment_transactions
CREATE INDEX idx_payment_transactions_payment_id ON payment_transactions(payment_id);
CREATE INDEX idx_payment_transactions_created_at ON payment_transactions(created_at DESC);

-- Index pour reviews
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_pack_id ON reviews(pack_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);

-- Index pour review_images
CREATE INDEX idx_review_images_review_id ON review_images(review_id);

-- Index pour notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ⚙️ PHASE 6: FONCTIONS TRIGGER
-- ==============================

-- Fonction pour updated_at bookings
CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour updated_at reviews
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer référence de réservation
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_reference IS NULL OR NEW.booking_reference = '' THEN
    NEW.booking_reference = 'GW-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('booking_sequence')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer référence de paiement
CREATE OR REPLACE FUNCTION generate_payment_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_reference IS NULL OR NEW.payment_reference = '' THEN
    NEW.payment_reference = 'PAY-GW-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('payment_sequence')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer les séquences
CREATE SEQUENCE IF NOT EXISTS booking_sequence START 1;
CREATE SEQUENCE IF NOT EXISTS payment_sequence START 1;

-- Triggers
CREATE TRIGGER update_bookings_updated_at_trigger
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_bookings_updated_at();

CREATE TRIGGER update_reviews_updated_at_trigger
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();

CREATE TRIGGER generate_booking_reference_trigger
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION generate_booking_reference();

CREATE TRIGGER generate_payment_reference_trigger
  BEFORE INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION generate_payment_reference();

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
  ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
  ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
  ALTER TABLE booking_participants ENABLE ROW LEVEL SECURITY;
  ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
  ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
  ALTER TABLE review_images ENABLE ROW LEVEL SECURITY;
  ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
  
  -- =============================================
  -- POLITIQUES POUR user_favorites
  -- =============================================
  
  -- Les utilisateurs peuvent voir/gérer leurs propres favoris
  CREATE POLICY "users_manage_own_favorites" ON user_favorites
    FOR ALL USING (user_id = auth.uid());
  
  -- =============================================
  -- POLITIQUES POUR bookings
  -- =============================================
  
  -- Les utilisateurs peuvent voir/gérer leurs propres réservations
  CREATE POLICY "users_manage_own_bookings" ON bookings
    FOR ALL USING (user_id = auth.uid());
  
  -- Les participants peuvent être vus par le propriétaire de la réservation
  CREATE POLICY "users_manage_own_booking_participants" ON booking_participants
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM bookings 
        WHERE bookings.id = booking_participants.booking_id 
        AND bookings.user_id = auth.uid()
      )
    );
  
  -- =============================================
  -- POLITIQUES POUR payments
  -- =============================================
  
  -- Les utilisateurs peuvent voir leurs propres paiements
  CREATE POLICY "users_view_own_payments" ON payments
    FOR SELECT USING (user_id = auth.uid());
  
  -- Les transactions peuvent être vues par le propriétaire du paiement
  CREATE POLICY "users_view_own_payment_transactions" ON payment_transactions
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM payments 
        WHERE payments.id = payment_transactions.payment_id 
        AND payments.user_id = auth.uid()
      )
    );
  
  -- =============================================
  -- POLITIQUES POUR reviews
  -- =============================================
  
  -- Lecture publique des avis approuvés
  CREATE POLICY "public_read_approved_reviews" ON reviews
    FOR SELECT USING (status = 'approved');
  
  -- Les utilisateurs gèrent leurs propres avis
  CREATE POLICY "users_manage_own_reviews" ON reviews
    FOR ALL USING (user_id = auth.uid());
  
  -- Images des avis selon les politiques des avis
  CREATE POLICY "review_images_follow_review_policy" ON review_images
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM reviews 
        WHERE reviews.id = review_images.review_id 
        AND (reviews.status = 'approved' OR reviews.user_id = auth.uid())
      )
    );
  
  -- =============================================
  -- POLITIQUES POUR notifications
  -- =============================================
  
  -- Les utilisateurs peuvent voir/gérer leurs propres notifications
  CREATE POLICY "users_manage_own_notifications" ON notifications
    FOR ALL USING (user_id = auth.uid());
  
  -- =============================================
  -- POLITIQUES ADMIN SELON L'ARCHITECTURE
  -- =============================================
  
  IF arch_info.architecture_type = 'users_unified' THEN
    -- Architecture avec rôle dans users
    RAISE NOTICE '- Politiques admin pour: users unifiée (rôle dans users)';
    
    CREATE POLICY "admin_all_favorites_users" ON user_favorites
      FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
      );
    
    CREATE POLICY "admin_all_bookings_users" ON bookings
      FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
      );
      
    CREATE POLICY "admin_all_participants_users" ON booking_participants
      FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
      );
      
    CREATE POLICY "admin_all_payments_users" ON payments
      FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
      );
      
    CREATE POLICY "admin_all_transactions_users" ON payment_transactions
      FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
      );
      
    CREATE POLICY "admin_all_reviews_users" ON reviews
      FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
      );
      
    CREATE POLICY "admin_all_review_images_users" ON review_images
      FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
      );
      
    CREATE POLICY "admin_all_notifications_users" ON notifications
      FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
      );
      
  ELSIF arch_info.architecture_type = 'users_profiles_split' THEN
    -- Architecture avec rôle dans profiles
    RAISE NOTICE '- Politiques admin pour: users + profiles séparées (rôle dans profiles)';
    
    CREATE POLICY "admin_all_favorites_profiles" ON user_favorites
      FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
      );
    
    CREATE POLICY "admin_all_bookings_profiles" ON bookings
      FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
      );
      
    CREATE POLICY "admin_all_participants_profiles" ON booking_participants
      FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
      );
      
    CREATE POLICY "admin_all_payments_profiles" ON payments
      FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
      );
      
    CREATE POLICY "admin_all_transactions_profiles" ON payment_transactions
      FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
      );
      
    CREATE POLICY "admin_all_reviews_profiles" ON reviews
      FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
      );
      
    CREATE POLICY "admin_all_review_images_profiles" ON review_images
      FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
      );
      
    CREATE POLICY "admin_all_notifications_profiles" ON notifications
      FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
      );
      
  ELSIF arch_info.architecture_type = 'hybrid' THEN
    -- Architecture hybride (rôle dans les deux)
    RAISE NOTICE '- Politiques admin pour: hybride (rôle dans users ET profiles)';
    
    CREATE POLICY "admin_all_favorites_hybrid" ON user_favorites
      FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin') OR
        EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
      );
    
    CREATE POLICY "admin_all_bookings_hybrid" ON bookings
      FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin') OR
        EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
      );
      
    CREATE POLICY "admin_all_participants_hybrid" ON booking_participants
      FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin') OR
        EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
      );
      
    CREATE POLICY "admin_all_payments_hybrid" ON payments
      FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin') OR
        EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
      );
      
    CREATE POLICY "admin_all_transactions_hybrid" ON payment_transactions
      FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin') OR
        EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
      );
      
    CREATE POLICY "admin_all_reviews_hybrid" ON reviews
      FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin') OR
        EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
      );
      
    CREATE POLICY "admin_all_review_images_hybrid" ON review_images
      FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin') OR
        EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
      );
      
    CREATE POLICY "admin_all_notifications_hybrid" ON notifications
      FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin') OR
        EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
      );
      
  ELSE
    -- Architecture basique ou inconnue (accès via raw_user_meta_data)
    RAISE NOTICE '- Politiques admin pour: basique/inconnue (métadonnées auth)';
    
    CREATE POLICY "admin_all_favorites_metadata" ON user_favorites
      FOR ALL USING (
        (auth.jwt() ->> 'role') = 'admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
      );
    
    CREATE POLICY "admin_all_bookings_metadata" ON bookings
      FOR ALL USING (
        (auth.jwt() ->> 'role') = 'admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
      );
      
    CREATE POLICY "admin_all_participants_metadata" ON booking_participants
      FOR ALL USING (
        (auth.jwt() ->> 'role') = 'admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
      );
      
    CREATE POLICY "admin_all_payments_metadata" ON payments
      FOR ALL USING (
        (auth.jwt() ->> 'role') = 'admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
      );
      
    CREATE POLICY "admin_all_transactions_metadata" ON payment_transactions
      FOR ALL USING (
        (auth.jwt() ->> 'role') = 'admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
      );
      
    CREATE POLICY "admin_all_reviews_metadata" ON reviews
      FOR ALL USING (
        (auth.jwt() ->> 'role') = 'admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
      );
      
    CREATE POLICY "admin_all_review_images_metadata" ON review_images
      FOR ALL USING (
        (auth.jwt() ->> 'role') = 'admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
      );
      
    CREATE POLICY "admin_all_notifications_metadata" ON notifications
      FOR ALL USING (
        (auth.jwt() ->> 'role') = 'admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
      );
  END IF;
  
  RAISE NOTICE '✅ Politiques RLS créées selon architecture détectée';
END $$;

-- 📊 PHASE 8: DONNÉES D'EXEMPLE
-- ==============================

DO $$
DECLARE
  test_user_id UUID;
  admin_user_id UUID;
  pack_andasibe_id UUID;
  pack_tsingy_id UUID;
  pack_nosy_be_id UUID;
  booking_test_id UUID;
  payment_test_id UUID;
  review_test_id UUID;
BEGIN
  RAISE NOTICE '📊 INSERTION DES DONNÉES D''EXEMPLE...';

  -- Récupérer des utilisateurs existants (flexibilité selon l'architecture)
  SELECT id INTO test_user_id FROM users WHERE email LIKE '%test%' OR email LIKE '%demo%' LIMIT 1;
  SELECT id INTO admin_user_id FROM users WHERE email LIKE '%admin%' LIMIT 1;
  
  -- Si pas d'utilisateur trouvé, prendre le premier disponible
  IF test_user_id IS NULL THEN
    SELECT id INTO test_user_id FROM users LIMIT 1;
  END IF;
  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id FROM users LIMIT 1;
  END IF;
  
  -- Récupérer les IDs des packs existants
  SELECT id INTO pack_andasibe_id FROM packs WHERE title ILIKE '%andasibe%' LIMIT 1;
  SELECT id INTO pack_tsingy_id FROM packs WHERE title ILIKE '%tsingy%' LIMIT 1;
  SELECT id INTO pack_nosy_be_id FROM packs WHERE title ILIKE '%nosy%' LIMIT 1;
  
  -- Si des utilisateurs et packs existent, créer des données d'exemple
  IF test_user_id IS NOT NULL AND pack_andasibe_id IS NOT NULL THEN
    
    -- ======= FAVORIS =======
    INSERT INTO user_favorites (user_id, pack_id) VALUES 
    (test_user_id, pack_andasibe_id),
    (test_user_id, pack_tsingy_id)
    ON CONFLICT DO NOTHING;
    
    -- ======= RÉSERVATIONS =======
    INSERT INTO bookings (
      user_id, pack_id, number_of_participants, start_date, end_date,
      price_per_person, total_price, contact_name, contact_email, contact_phone,
      special_requests, status
    ) VALUES 
    (
      test_user_id, pack_andasibe_id, 4, 
      CURRENT_DATE + INTERVAL '30 days', CURRENT_DATE + INTERVAL '33 days',
      280000, 1120000, 'Jean Rakoto', 'jean.rakoto@example.mg', '+261 34 12 345 67',
      'Régime végétarien pour 2 personnes', 'confirmed'
    ),
    (
      test_user_id, pack_nosy_be_id, 2,
      CURRENT_DATE + INTERVAL '60 days', CURRENT_DATE + INTERVAL '64 days', 
      320000, 640000, 'Marie Razafy', 'marie.razafy@example.mg', '+261 32 98 765 43',
      'Anniversaire de mariage le 2ème jour', 'pending'
    )
    RETURNING id INTO booking_test_id;
    
    -- ======= PARTICIPANTS =======
    INSERT INTO booking_participants (
      booking_id, first_name, last_name, date_of_birth, nationality,
      emergency_contact_name, emergency_contact_phone
    ) VALUES 
    (booking_test_id, 'Jean', 'Rakoto', '1985-03-15', 'Malagasy', 'Sophie Rakoto', '+261 34 11 111 11'),
    (booking_test_id, 'Marie', 'Rakoto', '1987-07-22', 'Malagasy', 'Sophie Rakoto', '+261 34 11 111 11');
    
    -- ======= PAIEMENTS =======
    INSERT INTO payments (
      booking_id, user_id, amount, status, payment_method, payment_provider
    ) VALUES 
    (booking_test_id, test_user_id, 1120000, 'completed', 'mobile_money', 'mvola')
    RETURNING id INTO payment_test_id;
    
    -- ======= TRANSACTIONS DE PAIEMENT =======
    INSERT INTO payment_transactions (
      payment_id, transaction_type, amount, external_transaction_id, success
    ) VALUES 
    (payment_test_id, 'charge', 1120000, 'mvola_tx_123456789', true);
    
    -- ======= AVIS =======
    INSERT INTO reviews (
      user_id, pack_id, booking_id, rating, title, comment,
      service_rating, value_rating, location_rating, guide_rating,
      would_recommend, status
    ) VALUES 
    (
      test_user_id, pack_andasibe_id, booking_test_id, 5,
      'Expérience extraordinaire !',
      'Safari absolument magique ! Nous avons vu les lémuriens Indri de très près et notre guide était passionnant. L''hébergement était confortable et la nourriture délicieuse. Je recommande vivement cette expérience unique à Madagascar.',
      5, 4, 5, 5, true, 'approved'
    )
    RETURNING id INTO review_test_id;
    
    -- ======= IMAGES D'AVIS =======
    INSERT INTO review_images (review_id, image_url, caption) VALUES 
    (review_test_id, 'https://images.unsplash.com/photo-1564760055775-d63b17a55c44', 'Lémurien Indri rencontré lors du safari'),
    (review_test_id, 'https://images.unsplash.com/photo-1547036967-23d11aacaee0', 'Paysage magnifique de la forêt d''Andasibe');
    
    -- ======= NOTIFICATIONS =======
    INSERT INTO notifications (
      user_id, type, title, message, booking_id, status
    ) VALUES 
    (
      test_user_id, 'booking', 
      'Réservation confirmée !',
      'Votre réservation pour le Safari Andasibe-Mantadia a été confirmée. Référence: GW-2024-000001',
      booking_test_id, 'read'
    ),
    (
      test_user_id, 'reminder',
      'Voyage dans 7 jours !',
      'Votre aventure Safari Andasibe-Mantadia commence dans une semaine. Préparez vos affaires !',
      booking_test_id, 'unread'
    ),
    (
      test_user_id, 'marketing',
      'Nouvelles destinations disponibles',
      'Découvrez nos nouveaux packs aventure dans les Tsingy de Bemaraha !',
      NULL, 'unread'
    );
    
    RAISE NOTICE '��� Données d''exemple créées avec succès';
  ELSE
    RAISE NOTICE '⚠️ Pas d''utilisateurs ou de packs trouvés - données d''exemple non créées';
  END IF;
END $$;

-- 🎉 VÉRIFICATION FINALE
-- =======================

SELECT 
  '🎉 SYSTÈME COMPLET CRÉÉ AVEC SUCCÈS !' as message,
  (SELECT COUNT(*) FROM user_favorites) as favorites_count,
  (SELECT COUNT(*) FROM bookings) as bookings_count,
  (SELECT COUNT(*) FROM booking_participants) as participants_count,
  (SELECT COUNT(*) FROM payments) as payments_count,
  (SELECT COUNT(*) FROM payment_transactions) as transactions_count,
  (SELECT COUNT(*) FROM reviews) as reviews_count,
  (SELECT COUNT(*) FROM review_images) as review_images_count,
  (SELECT COUNT(*) FROM notifications) as notifications_count;

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
WHERE tablename IN ('user_favorites', 'bookings', 'booking_participants', 'payments', 'payment_transactions', 'reviews', 'review_images', 'notifications')
GROUP BY tablename
ORDER BY tablename;

-- Résumé des fonctionnalités
SELECT 
  '🎯 FONCTIONNALITÉS DISPONIBLES:' as info,
  '✅ Favoris utilisateurs' as feature_1,
  '✅ Réservations complètes' as feature_2,
  '✅ Gestion des participants' as feature_3,
  '✅ Paiements & transactions' as feature_4,
  '✅ Avis & évaluations' as feature_5,
  '✅ Images d''avis' as feature_6,
  '✅ Notifications' as feature_7,
  '✅ Sécurité RLS complète' as feature_8;

-- Nettoyage table temporaire
DROP TABLE IF EXISTS detected_architecture;

-- Message final
SELECT '✅ SYSTÈME COMPLET DE TOURISME SUPABASE PRÊT À L''UTILISATION !' as final_status;