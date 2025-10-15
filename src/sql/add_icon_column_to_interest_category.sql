-- Ajouter la colonne icon à la table interest_category si elle n'existe pas déjà
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'interest_category' 
        AND column_name = 'icon'
    ) THEN
        ALTER TABLE interest_category ADD COLUMN icon TEXT;
        RAISE NOTICE 'Colonne icon ajoutée à interest_category';
    ELSE
        RAISE NOTICE 'Colonne icon existe déjà dans interest_category';
    END IF;
END $$;

-- Ajouter quelques emoji d'exemple aux catégories existantes si elles n'en ont pas
UPDATE interest_category 
SET icon = CASE 
    WHEN name ILIKE '%nature%' OR name ILIKE '%paysage%' THEN '🌿'
    WHEN name ILIKE '%culture%' OR name ILIKE '%tradition%' THEN '🎭'
    WHEN name ILIKE '%aventure%' OR name ILIKE '%sport%' THEN '🏔️'
    WHEN name ILIKE '%beach%' OR name ILIKE '%détente%' OR name ILIKE '%plage%' THEN '🏖️'
    WHEN name ILIKE '%ville%' OR name ILIKE '%urbain%' THEN '🏙️'
    WHEN name ILIKE '%gastronomie%' OR name ILIKE '%cuisine%' THEN '🍽️'
    WHEN name ILIKE '%histoire%' OR name ILIKE '%patrimoine%' THEN '🏛️'
    WHEN name ILIKE '%wildlife%' OR name ILIKE '%faune%' THEN '🦎'
    ELSE '🎯'
END
WHERE icon IS NULL OR icon = '';

-- Vérifier les résultats
SELECT id, name, icon FROM interest_category ORDER BY name;