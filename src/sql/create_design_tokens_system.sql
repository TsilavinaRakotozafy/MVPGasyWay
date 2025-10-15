-- =====================================================
-- SYSTÈME DESIGN TOKENS GASYWAY
-- =====================================================
-- Création de la table pour stocker les design tokens
-- avec gestion des versions et thèmes multiples

-- Table pour stocker les design tokens
DROP TABLE IF EXISTS design_tokens CASCADE;

CREATE TABLE design_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    tokens JSONB NOT NULL,
    is_active BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    version INTEGER DEFAULT 1,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT design_tokens_name_length CHECK (length(name) >= 3 AND length(name) <= 50),
    CONSTRAINT design_tokens_valid_tokens CHECK (tokens IS NOT NULL AND jsonb_typeof(tokens) = 'object')
);

-- Index pour les performances
CREATE INDEX idx_design_tokens_active ON design_tokens(is_active) WHERE is_active = true;
CREATE INDEX idx_design_tokens_default ON design_tokens(is_default) WHERE is_default = true;
CREATE INDEX idx_design_tokens_created_by ON design_tokens(created_by);
CREATE INDEX idx_design_tokens_created_at ON design_tokens(created_at DESC);

-- Fonction pour s'assurer qu'il n'y a qu'un seul thème actif
CREATE OR REPLACE FUNCTION ensure_single_active_design_token()
RETURNS TRIGGER AS $$
BEGIN
    -- Si on active ce token, désactiver tous les autres
    IF NEW.is_active = true THEN
        UPDATE design_tokens 
        SET is_active = false, updated_at = NOW()
        WHERE id != NEW.id AND is_active = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour maintenir un seul thème actif
DROP TRIGGER IF EXISTS trigger_ensure_single_active_design_token ON design_tokens;
CREATE TRIGGER trigger_ensure_single_active_design_token
    BEFORE UPDATE OF is_active ON design_tokens
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_active_design_token();

-- Fonction pour s'assurer qu'il n'y a qu'un seul thème par défaut
CREATE OR REPLACE FUNCTION ensure_single_default_design_token()
RETURNS TRIGGER AS $$
BEGIN
    -- Si on marque ce token comme défaut, retirer le défaut des autres
    IF NEW.is_default = true THEN
        UPDATE design_tokens 
        SET is_default = false, updated_at = NOW()
        WHERE id != NEW.id AND is_default = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour maintenir un seul thème par défaut
DROP TRIGGER IF EXISTS trigger_ensure_single_default_design_token ON design_tokens;
CREATE TRIGGER trigger_ensure_single_default_design_token
    BEFORE UPDATE OF is_default ON design_tokens
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_design_token();

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_design_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_update_design_tokens_updated_at ON design_tokens;
CREATE TRIGGER trigger_update_design_tokens_updated_at
    BEFORE UPDATE ON design_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_design_tokens_updated_at();

-- RLS (Row Level Security)
ALTER TABLE design_tokens ENABLE ROW LEVEL SECURITY;

-- Politique : tout le monde peut lire les design tokens actifs/par défaut
CREATE POLICY "Design tokens actifs lisibles par tous" ON design_tokens
    FOR SELECT USING (is_active = true OR is_default = true);

-- Politique : seuls les admins peuvent créer/modifier/supprimer
CREATE POLICY "Seuls les admins peuvent gérer les design tokens" ON design_tokens
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Insérer le thème par défaut GasyWay
INSERT INTO design_tokens (name, description, tokens, is_active, is_default, created_by) 
VALUES (
    'GasyWay Default',
    'Thème par défaut de GasyWay avec les couleurs officielles',
    '{
        "primary": "#0d4047",
        "primaryForeground": "#ffffff",
        "secondary": "#c6e5de", 
        "secondaryForeground": "#0d4047",
        "accent": "#bcdc49",
        "accentForeground": "#0d4047",
        "background": "#ffffff",
        "foreground": "#0d4047",
        "muted": "#ececf0",
        "mutedForeground": "#717182",
        "destructive": "#d4183d",
        "destructiveForeground": "#ffffff",
        "border": "rgba(0, 0, 0, 0.1)",
        "fontFamily": "Outfit",
        "fontSize": 16,
        "fontWeightNormal": 400,
        "fontWeightMedium": 500,
        "h1": {
            "fontSize": 24,
            "lineHeight": 1.25,
            "fontWeight": 600,
            "textTransform": "none",
            "letterSpacing": 0
        },
        "h2": {
            "fontSize": 20,
            "lineHeight": 1.25,
            "fontWeight": 500,
            "textTransform": "none",
            "letterSpacing": 0
        },
        "h3": {
            "fontSize": 18,
            "lineHeight": 1.25,
            "fontWeight": 500,
            "textTransform": "none",
            "letterSpacing": 0
        },
        "h4": {
            "fontSize": 16,
            "lineHeight": 1.25,
            "fontWeight": 500,
            "textTransform": "none",
            "letterSpacing": 0
        },
        "h5": {
            "fontSize": 14,
            "lineHeight": 1.25,
            "fontWeight": 500,
            "textTransform": "none",
            "letterSpacing": 0
        },
        "h6": {
            "fontSize": 12,
            "lineHeight": 1.25,
            "fontWeight": 500,
            "textTransform": "none",
            "letterSpacing": 0
        },
        "p": {
            "fontSize": 14,
            "lineHeight": 1.5,
            "fontWeight": 400,
            "textTransform": "none",
            "letterSpacing": 0
        },
        "label": {
            "fontSize": 14,
            "lineHeight": 1.5,
            "fontWeight": 400,
            "textTransform": "none",
            "letterSpacing": 0
        },
        "radiusBase": 10,
        "spacingBase": 4
    }'::jsonb,
    true,
    true,
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
);

-- Vérification de la création
DO $$
BEGIN
    -- Vérifier que la table a été créée
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'design_tokens') THEN
        RAISE NOTICE '✅ Table design_tokens créée avec succès';
    ELSE
        RAISE EXCEPTION '❌ Erreur : Table design_tokens non créée';
    END IF;
    
    -- Vérifier que le thème par défaut a été inséré
    IF EXISTS (SELECT 1 FROM design_tokens WHERE name = 'GasyWay Default') THEN
        RAISE NOTICE '✅ Thème par défaut GasyWay inséré avec succès';
    ELSE
        RAISE NOTICE '⚠️ Attention : Thème par défaut non inséré (aucun admin trouvé)';
    END IF;
END $$;

-- Afficher le résumé
SELECT 
    'SYSTÈME DESIGN TOKENS' AS info,
    COUNT(*) AS total_themes,
    COUNT(*) FILTER (WHERE is_active) AS themes_actifs,
    COUNT(*) FILTER (WHERE is_default) AS themes_par_defaut
FROM design_tokens;