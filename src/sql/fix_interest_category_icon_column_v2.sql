-- Réparer la colonne icon dans la table interest_category
-- Ce script vérifie et corrige les problèmes avec la colonne icon

-- 1. Vérifier si la table interest_category existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'interest_category') THEN
        RAISE NOTICE 'Table interest_category n''existe pas. Création...';
        
        CREATE TABLE interest_category (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(100) NOT NULL UNIQUE,
            icon TEXT, -- Emoji ou code d'icône
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        RAISE NOTICE 'Table interest_category créée avec succès';
    ELSE
        RAISE NOTICE 'Table interest_category existe déjà';
    END IF;
END $$;

-- 2. Vérifier si la colonne icon existe, sinon l'ajouter
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'interest_category' 
        AND column_name = 'icon'
    ) THEN
        RAISE NOTICE 'Colonne icon manquante. Ajout...';
        ALTER TABLE interest_category ADD COLUMN icon TEXT;
        RAISE NOTICE 'Colonne icon ajoutée avec succès';
    ELSE
        RAISE NOTICE 'Colonne icon existe déjà';
    END IF;
END $$;

-- 3. Insérer des données de base si la table est vide
INSERT INTO interest_category (name, icon, description) VALUES 
    ('Gastronomie', '🍴', 'Découvertes culinaires et gastronomiques'),
    ('Artisanat', '🎨', 'Arts et artisanat traditionnels'),
    ('Culture', '🌄', 'Immersion culturelle et traditions'),
    ('Nature', '🌿', 'Découverte de la nature et écotourisme'),
    ('Agriculture', '🍫', 'Agriculture durable et produits locaux'),
    ('Aventure', '🏔️', 'Activités d''aventure et sports'),
    ('Plage', '🏖️', 'Détente et activités balnéaires')
ON CONFLICT (name) DO UPDATE SET
    icon = EXCLUDED.icon,
    description = EXCLUDED.description,
    updated_at = now();

-- 4. Vérifier les permissions RLS
DO $$
BEGIN
    -- Activer RLS si pas déjà fait
    ALTER TABLE interest_category ENABLE ROW LEVEL SECURITY;
    
    -- Politique pour lecture publique
    DROP POLICY IF EXISTS "interest_category_select_policy" ON interest_category;
    CREATE POLICY "interest_category_select_policy" ON interest_category
        FOR SELECT TO authenticated, anon
        USING (true);
    
    -- Politique pour modification par les admins seulement
    DROP POLICY IF EXISTS "interest_category_admin_policy" ON interest_category;
    CREATE POLICY "interest_category_admin_policy" ON interest_category
        FOR ALL TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid() 
                AND users.role = 'admin'
            )
        );
    
    RAISE NOTICE 'Politiques RLS configurées pour interest_category';
END $$;

-- 5. Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_interest_category_name ON interest_category(name);

-- 6. Afficher un résumé
DO $$
DECLARE
    category_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO category_count FROM interest_category;
    RAISE NOTICE 'Script terminé. Nombre de catégories d''intérêt: %', category_count;
    
    -- Afficher quelques exemples
    RAISE NOTICE 'Exemples de catégories:';
    FOR rec IN (
        SELECT name, icon, description 
        FROM interest_category 
        ORDER BY name 
        LIMIT 5
    ) LOOP
        RAISE NOTICE '- % % : %', rec.icon, rec.name, rec.description;
    END LOOP;
END $$;