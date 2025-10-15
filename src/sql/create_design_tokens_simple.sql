-- Script simple pour créer la table design_tokens
-- À exécuter dans l'éditeur SQL de Supabase

-- Créer la table design_tokens si elle n'existe pas
CREATE TABLE IF NOT EXISTS design_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    tokens JSONB NOT NULL,
    is_active BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    version INTEGER DEFAULT 1,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les requêtes fréquentes (si ils n'existent pas déjà)
CREATE INDEX IF NOT EXISTS idx_design_tokens_active ON design_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_design_tokens_default ON design_tokens(is_default);

-- Insérer un thème par défaut GasyWay (éviter les doublons)
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
        "h1": {"fontSize": 24, "lineHeight": 1.5, "fontWeight": 500, "textTransform": "none", "letterSpacing": 0},
        "h2": {"fontSize": 20, "lineHeight": 1.5, "fontWeight": 500, "textTransform": "none", "letterSpacing": 0},
        "h3": {"fontSize": 18, "lineHeight": 1.5, "fontWeight": 500, "textTransform": "none", "letterSpacing": 0},
        "h4": {"fontSize": 16, "lineHeight": 1.5, "fontWeight": 500, "textTransform": "none", "letterSpacing": 0},
        "h5": {"fontSize": 14, "lineHeight": 1.5, "fontWeight": 500, "textTransform": "none", "letterSpacing": 0},
        "h6": {"fontSize": 12, "lineHeight": 1.5, "fontWeight": 500, "textTransform": "none", "letterSpacing": 0},
        "p": {"fontSize": 16, "lineHeight": 1.5, "fontWeight": 400, "textTransform": "none", "letterSpacing": 0},
        "label": {"fontSize": 16, "lineHeight": 1.5, "fontWeight": 500, "textTransform": "none", "letterSpacing": 0},
        "radiusBase": 10,
        "spacingBase": 16
    }'::jsonb,
    true,
    true
)
ON CONFLICT (name) DO NOTHING;

-- Vérifier la création
SELECT name, is_active, is_default, created_at FROM design_tokens;