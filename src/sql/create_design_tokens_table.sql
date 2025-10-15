-- Table design_tokens pour le système de thèmes GasyWay
CREATE TABLE IF NOT EXISTS design_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tokens JSONB NOT NULL,
    is_active BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    version INTEGER DEFAULT 1,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_design_tokens_active ON design_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_design_tokens_default ON design_tokens(is_default);
CREATE INDEX IF NOT EXISTS idx_design_tokens_created_by ON design_tokens(created_by);

-- Fonction pour mettre à jour updated_at automatiquement
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

-- RLS Policies
ALTER TABLE design_tokens ENABLE ROW LEVEL SECURITY;

-- Politique pour la lecture (tous peuvent lire les thèmes actifs/par défaut)
CREATE POLICY "Anyone can read active design tokens" ON design_tokens
    FOR SELECT USING (is_active = true OR is_default = true);

-- Politique pour la création/modification (seuls les admins)
CREATE POLICY "Only admins can manage design tokens" ON design_tokens
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Contrainte pour s'assurer qu'il n'y a qu'un seul thème actif
CREATE OR REPLACE FUNCTION ensure_single_active_design_token()
RETURNS TRIGGER AS $$
BEGIN
    -- Si on active un thème, désactiver tous les autres
    IF NEW.is_active = true AND OLD.is_active = false THEN
        UPDATE design_tokens 
        SET is_active = false 
        WHERE id != NEW.id;
    END IF;
    
    -- Si on définit un thème par défaut, retirer le statut des autres
    IF NEW.is_default = true AND OLD.is_default = false THEN
        UPDATE design_tokens 
        SET is_default = false 
        WHERE id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ensure_single_active_design_token ON design_tokens;
CREATE TRIGGER trigger_ensure_single_active_design_token
    AFTER UPDATE ON design_tokens
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_active_design_token();

-- Insérer un thème par défaut GasyWay
INSERT INTO design_tokens (name, description, tokens, is_active, is_default) 
VALUES (
    'Thème GasyWay par défaut',
    'Thème officiel de GasyWay avec les couleurs et styles de la marque',
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
            "lineHeight": 1.5,
            "fontWeight": 500,
            "textTransform": "none",
            "letterSpacing": 0
        },
        "h2": {
            "fontSize": 20,
            "lineHeight": 1.5,
            "fontWeight": 500,
            "textTransform": "none",
            "letterSpacing": 0
        },
        "h3": {
            "fontSize": 18,
            "lineHeight": 1.5,
            "fontWeight": 500,
            "textTransform": "none",
            "letterSpacing": 0
        },
        "h4": {
            "fontSize": 16,
            "lineHeight": 1.5,
            "fontWeight": 500,
            "textTransform": "none",
            "letterSpacing": 0
        },
        "h5": {
            "fontSize": 14,
            "lineHeight": 1.5,
            "fontWeight": 500,
            "textTransform": "none",
            "letterSpacing": 0
        },
        "h6": {
            "fontSize": 12,
            "lineHeight": 1.5,
            "fontWeight": 500,
            "textTransform": "none",
            "letterSpacing": 0
        },
        "p": {
            "fontSize": 16,
            "lineHeight": 1.5,
            "fontWeight": 400,
            "textTransform": "none",
            "letterSpacing": 0
        },
        "label": {
            "fontSize": 16,
            "lineHeight": 1.5,
            "fontWeight": 500,
            "textTransform": "none",
            "letterSpacing": 0
        },
        "radiusBase": 10,
        "spacingBase": 16
    }'::jsonb,
    true,
    true
) ON CONFLICT DO NOTHING;

-- Vérification finale
SELECT 
    name, 
    is_active, 
    is_default, 
    created_at 
FROM design_tokens 
ORDER BY created_at DESC;