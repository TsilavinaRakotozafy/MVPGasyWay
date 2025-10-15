-- Script de création/réparation de la table interests
-- GasyWay - Structure cohérente pour les centres d'intérêt

-- Vérifier si la table existe et la recréer si nécessaire
DROP TABLE IF EXISTS interests CASCADE;
DROP TABLE IF EXISTS user_interests CASCADE;

-- Créer la table interests avec une structure cohérente
CREATE TABLE interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) UNIQUE,
    description TEXT,
    icon_url VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer la table de liaison user_interests
CREATE TABLE user_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interest_id UUID NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte d'unicité pour éviter les doublons
    UNIQUE(user_id, interest_id)
);

-- Créer les index pour les performances
CREATE INDEX idx_interests_status ON interests(status);
CREATE INDEX idx_interests_name ON interests(name);
CREATE INDEX idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX idx_user_interests_interest_id ON user_interests(interest_id);

-- Activer RLS
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

-- Politiques RLS simples et sûres
CREATE POLICY "interests_public_read" ON interests 
  FOR SELECT TO authenticated, anon 
  USING (true);

CREATE POLICY "interests_admin_manage" ON interests 
  FOR ALL TO authenticated
  USING (
    (current_setting('request.jwt.claims', true)::json ->> 'user_metadata')::json ->> 'role' = 'admin'
  );

CREATE POLICY "user_interests_own_access" ON user_interests 
  FOR ALL 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_interests_admin_access" ON user_interests 
  FOR ALL TO authenticated
  USING (
    (current_setting('request.jwt.claims', true)::json ->> 'user_metadata')::json ->> 'role' = 'admin'
  );

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_interests_updated_at 
    BEFORE UPDATE ON interests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insérer quelques centres d'intérêt de base
INSERT INTO interests (name, slug, description, status) VALUES
('Aventure', 'aventure', 'Expériences palpitantes et sensations fortes', 'active'),
('Culture', 'culture', 'Découverte du patrimoine et des traditions malgaches', 'active'),
('Nature', 'nature', 'Exploration de la biodiversité unique de Madagascar', 'active'),
('Gastronomie', 'gastronomie', 'Découverte de la cuisine malgache authentique', 'active'),
('Plage', 'plage', 'Détente sur les plus belles plages de l''île', 'active'),
('Randonnée', 'randonnee', 'Trekking et marche dans les paysages exceptionnels', 'active'),
('Safari', 'safari', 'Observation de la faune endémique', 'active'),
('Photographie', 'photographie', 'Capture des merveilles naturelles et culturelles', 'active'),
('Histoire', 'histoire', 'Exploration du riche passé de Madagascar', 'active'),
('Artisanat', 'artisanat', 'Découverte des savoir-faire traditionnels', 'active');

-- Vérifications finales
SELECT 'Table interests créée avec ' || COUNT(*) || ' centres d''intérêt' as status 
FROM interests;

SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'interests'
ORDER BY ordinal_position;