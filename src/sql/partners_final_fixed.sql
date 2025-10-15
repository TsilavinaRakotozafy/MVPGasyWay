-- ===============================================
-- SCRIPT SQL FINAL CORRIGÉ POUR SUPABASE
-- Utilise la table "users" (pas "profiles") pour les politiques RLS
-- ===============================================

-- 1. Supprimer les types ENUM s'ils existent déjà (éviter les erreurs)
DROP TYPE IF EXISTS partner_status CASCADE;
DROP TYPE IF EXISTS partner_type CASCADE;
DROP TYPE IF EXISTS verification_status CASCADE;

-- 2. Créer les types ENUM
CREATE TYPE partner_status AS ENUM ('active', 'inactive', 'pending');
CREATE TYPE partner_type AS ENUM ('hotel', 'transport', 'guide', 'restaurant', 'activity', 'other');
CREATE TYPE verification_status AS ENUM ('verified', 'pending', 'rejected');

-- 3. Supprimer la table si elle existe (pour recommencer proprement)
DROP TABLE IF EXISTS partners CASCADE;

-- 4. Créer la table partners
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

-- 5. Créer les index pour les performances
CREATE INDEX idx_partners_status ON partners(status);
CREATE INDEX idx_partners_type ON partners(partner_type);
CREATE INDEX idx_partners_verification ON partners(verification_status);
CREATE INDEX idx_partners_region ON partners(region);
CREATE INDEX idx_partners_city ON partners(city);
CREATE INDEX idx_partners_email ON partners(email);
CREATE INDEX idx_partners_created_at ON partners(created_at DESC);

-- 6. Activer RLS
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- 7. Politiques RLS CORRIGÉES - Utilise la table "users" existante
-- Lecture : partenaires actifs publics + tout pour admins
CREATE POLICY "allow_read_partners" ON partners
  FOR SELECT USING (
    status = 'active' OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Toutes opérations : admin seulement (INSERT, UPDATE, DELETE)
CREATE POLICY "allow_admin_all_partners" ON partners
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- 8. Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_partners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_partners_updated_at_trigger
  BEFORE UPDATE ON partners
  FOR EACH ROW
  EXECUTE FUNCTION update_partners_updated_at();

-- 9. Insérer des données d'exemple (basées sur le mock du code)
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

-- 10. Vérification finale
SELECT 
  'TABLE PARTNERS CRÉÉE AVEC SUCCÈS ! 🎉' as message,
  COUNT(*) as total_partners,
  COUNT(*) FILTER (WHERE status = 'active') as active_partners,
  COUNT(*) FILTER (WHERE verification_status = 'verified') as verified_partners
FROM partners;

-- 11. Afficher les partenaires créés
SELECT 
  name,
  partner_type,
  status,
  verification_status,
  city,
  commission_rate
FROM partners 
ORDER BY created_at DESC;