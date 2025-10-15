-- ===============================================
-- SCRIPT PARTNERS UNIVERSEL - BULLETPROOF 🛡️
-- Compatible avec TOUTES les architectures détectées
-- ===============================================

-- 🔍 PHASE 1: DÉTECTION AUTOMATIQUE DE L'ARCHITECTURE
-- =====================================================

DO $$
DECLARE
  architecture_type TEXT := 'unknown';
  users_has_role BOOLEAN := false;
  profiles_exists BOOLEAN := false;
  profiles_has_role BOOLEAN := false;
  interests_structure TEXT := 'none';
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

  -- Vérifier structure interests
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interest_category') THEN
    interests_structure := 'with_categories';
    RAISE NOTICE '✅ INTERESTS: Avec catégories (interest_category existe)';
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interests') THEN
    interests_structure := 'simple';
    RAISE NOTICE '✅ INTERESTS: Structure simple (interests seulement)';
  ELSE
    interests_structure := 'none';
    RAISE NOTICE '⚠️  INTERESTS: Aucune table détectée';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '📋 RÉSUMÉ ARCHITECTURE DÉTECTÉE:';
  RAISE NOTICE '- Type: %', architecture_type;
  RAISE NOTICE '- Users a rôle: %', users_has_role;
  RAISE NOTICE '- Profiles existe: %', profiles_exists;
  RAISE NOTICE '- Profiles a rôle: %', profiles_has_role;
  RAISE NOTICE '- Structure interests: %', interests_structure;
  RAISE NOTICE '';

  -- Stocker dans une table temporaire pour utilisation ultérieure
  CREATE TEMP TABLE IF NOT EXISTS detected_architecture (
    architecture_type TEXT,
    users_has_role BOOLEAN,
    profiles_exists BOOLEAN,
    profiles_has_role BOOLEAN,
    interests_structure TEXT
  );
  
  DELETE FROM detected_architecture;
  INSERT INTO detected_architecture VALUES (
    architecture_type, users_has_role, profiles_exists, profiles_has_role, interests_structure
  );

END $$;

-- 🛡️ PHASE 2: NETTOYAGE SÉCURISÉ PRÉVENTIF
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '🧹 NETTOYAGE PRÉVENTIF...';
  
  -- Supprimer types ENUM potentiellement conflictuels
  DROP TYPE IF EXISTS partner_status CASCADE;
  DROP TYPE IF EXISTS partner_type CASCADE;
  DROP TYPE IF EXISTS verification_status CASCADE;
  
  -- Supprimer table partners si elle existe
  DROP TABLE IF EXISTS partners CASCADE;
  
  RAISE NOTICE '✅ Nettoyage terminé';
END $$;

-- 🏗️ PHASE 3: CRÉATION UNIVERSELLE
-- ==================================

-- Créer les types ENUM
CREATE TYPE partner_status AS ENUM ('active', 'inactive', 'pending');
CREATE TYPE partner_type AS ENUM ('hotel', 'transport', 'guide', 'restaurant', 'activity', 'other');
CREATE TYPE verification_status AS ENUM ('verified', 'pending', 'rejected');

-- Créer la table partners (structure universelle)
CREATE TABLE partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informations de base
  name VARCHAR(255) NOT NULL,
  description TEXT,
  partner_type partner_type DEFAULT 'other',
  logo_url TEXT,
  
  -- Contact
  contact_person VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50) NOT NULL,
  website TEXT,
  
  -- Adresse
  address TEXT,
  city VARCHAR(100),
  region VARCHAR(100),
  
  -- Statuts
  status partner_status DEFAULT 'pending',
  verification_status verification_status DEFAULT 'pending',
  
  -- Commercial
  commission_rate DECIMAL(5,2) DEFAULT 0.00,
  contract_start DATE,
  contract_end DATE,
  rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Contraintes
  CONSTRAINT valid_commission CHECK (commission_rate >= 0 AND commission_rate <= 100),
  CONSTRAINT valid_contract_dates CHECK (contract_end IS NULL OR contract_end >= contract_start)
);

-- Index pour performances
CREATE INDEX idx_partners_status ON partners(status);
CREATE INDEX idx_partners_type ON partners(partner_type);
CREATE INDEX idx_partners_verification ON partners(verification_status);
CREATE INDEX idx_partners_region ON partners(region);
CREATE INDEX idx_partners_city ON partners(city);
CREATE INDEX idx_partners_email ON partners(email);
CREATE INDEX idx_partners_created_at ON partners(created_at DESC);

-- Fonction pour updated_at
CREATE OR REPLACE FUNCTION update_partners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER update_partners_updated_at_trigger
  BEFORE UPDATE ON partners
  FOR EACH ROW
  EXECUTE FUNCTION update_partners_updated_at();

-- 🔐 PHASE 4: POLITIQUES RLS ADAPTATIVES
-- =======================================

DO $$
DECLARE
  arch_info RECORD;
BEGIN
  RAISE NOTICE '🔐 CRÉATION POLITIQUES RLS ADAPTATIVES...';
  
  -- Récupérer l'architecture détectée
  SELECT * INTO arch_info FROM detected_architecture LIMIT 1;
  
  -- Activer RLS
  ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
  
  -- Politique de lecture universelle (partenaires actifs publics)
  CREATE POLICY "allow_read_active_partners" ON partners
    FOR SELECT USING (status = 'active');
  
  -- Politiques admin selon l'architecture détectée
  IF arch_info.architecture_type = 'users_unified' THEN
    -- Architecture avec rôle dans users
    RAISE NOTICE '- Politiques pour: users unifiée (rôle dans users)';
    
    CREATE POLICY "allow_admin_all_partners_users" ON partners
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
      
  ELSIF arch_info.architecture_type = 'users_profiles_split' THEN
    -- Architecture avec rôle dans profiles
    RAISE NOTICE '- Politiques pour: users + profiles séparées (rôle dans profiles)';
    
    CREATE POLICY "allow_admin_all_partners_profiles" ON partners
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
      
  ELSIF arch_info.architecture_type = 'hybrid' THEN
    -- Architecture hybride (rôle dans les deux)
    RAISE NOTICE '- Politiques pour: hybride (rôle dans users ET profiles)';
    
    CREATE POLICY "allow_admin_all_partners_hybrid" ON partners
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
    RAISE NOTICE '- Politiques pour: basique/inconnue (métadonnées auth)';
    
    CREATE POLICY "allow_admin_all_partners_metadata" ON partners
      FOR ALL USING (
        (auth.jwt() ->> 'role') = 'admin' OR
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
      );
  END IF;
  
  RAISE NOTICE '✅ Politiques RLS créées selon architecture détectée';
END $$;

-- 📊 PHASE 5: DONNÉES D'EXEMPLE ET VÉRIFICATION
-- ===============================================

-- Insérer des données d'exemple
INSERT INTO partners (
  name, description, contact_person, email, phone, website,
  address, city, region, status, partner_type, rating,
  commission_rate, contract_start, contract_end, verification_status
) VALUES 
(
  'Madagascar Safari Lodge',
  'Lodge de luxe spécialisé dans les safaris et l''écotourisme',
  'Jean Rakoto',
  'contact@safari-lodge.mg',
  '+261 34 12 345 67',
  'https://safari-lodge.mg',
  '123 Avenue de l''Indépendance',
  'Antananarivo',
  'Analamanga',
  'active',
  'hotel',
  4.5,
  15.00,
  '2024-01-01',
  '2025-12-31',
  'verified'
),
(
  'Tsingy Adventures',
  'Agence spécialisée dans les excursions aux Tsingy de Bemaraha',
  'Marie Razafy',
  'info@tsingy-adventures.mg',
  '+261 32 98 765 43',
  'https://tsingy-adventures.mg',
  'BP 456',
  'Morondava',
  'Menabe',
  'active',
  'guide',
  4.8,
  20.00,
  '2024-02-01',
  '2024-12-31',
  'verified'
),
(
  'Transport Malagasy',
  'Service de transport touristique dans tout Madagascar',
  'Paul Andry',
  'reservations@transport-mg.com',
  '+261 33 11 222 33',
  NULL,
  'Zone Industrielle Forello',
  'Antananarivo',
  'Analamanga',
  'pending',
  'transport',
  NULL,
  10.00,
  NULL,
  NULL,
  'pending'
),
(
  'Nosy Be Resort',
  'Resort 5 étoiles sur l''île aux parfums',
  'Sophie Martin',
  'booking@nosybe-resort.mg',
  '+261 32 44 555 66',
  'https://nosybe-resort.mg',
  'Plage d''Andilana',
  'Nosy Be',
  'Diana',
  'active',
  'hotel',
  4.7,
  18.00,
  '2024-01-01',
  '2025-06-30',
  'verified'
),
(
  'Andasibe Nature Guide',
  'Guides experts pour la réserve d''Andasibe-Mantadia',
  'Hery Rasoanaivo',
  'contact@andasibe-guide.mg',
  '+261 34 77 888 99',
  NULL,
  'Village d''Andasibe',
  'Andasibe',
  'Alaotra-Mangoro',
  'active',
  'guide',
  4.9,
  25.00,
  '2024-01-01',
  '2024-12-31',
  'verified'
);

-- 🎉 VÉRIFICATION FINALE
-- =======================

SELECT 
  '🎉 TABLE PARTNERS CRÉÉE AVEC SUCCÈS !' as message,
  COUNT(*) as total_partners,
  COUNT(*) FILTER (WHERE status = 'active') as active_partners,
  COUNT(*) FILTER (WHERE verification_status = 'verified') as verified_partners
FROM partners;

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
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%users%role%admin%' THEN 'Via table users'
    WHEN qual LIKE '%profiles%role%admin%' THEN 'Via table profiles'
    WHEN qual LIKE '%jwt%' THEN 'Via métadonnées JWT'
    ELSE 'Politique publique'
  END as access_method
FROM pg_policies 
WHERE tablename = 'partners'
ORDER BY policyname;

-- Afficher les partenaires créés
SELECT 
  '📊 PARTENAIRES CRÉÉS:' as info,
  name,
  partner_type,
  status,
  verification_status,
  city,
  commission_rate
FROM partners 
ORDER BY created_at DESC;

-- Nettoyage table temporaire
DROP TABLE IF EXISTS detected_architecture;

-- Message final
SELECT '✅ SCRIPT PARTNERS UNIVERSEL TERMINÉ AVEC SUCCÈS !' as final_status;