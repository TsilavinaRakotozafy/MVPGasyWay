-- ✅ Script de réparation pour la colonne icon dans interest_category
-- ⚠️  Exécuter ce script dans Supabase SQL Editor pour corriger l'erreur

-- 1. Vérifier si la table interest_category existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'interest_category' 
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'Table interest_category n''existe pas ! Veuillez créer la table d''abord.';
    ELSE
        RAISE NOTICE '✅ Table interest_category trouvée';
    END IF;
END $$;

-- 2. Ajouter la colonne icon si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'interest_category' 
        AND column_name = 'icon'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.interest_category ADD COLUMN icon TEXT;
        RAISE NOTICE '✅ Colonne icon ajoutée à interest_category';
    ELSE
        RAISE NOTICE '⚠️  Colonne icon existe déjà dans interest_category';
    END IF;
END $$;

-- 3. Vérifier que la colonne a été ajoutée
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'interest_category' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Ajouter des icônes par défaut si les catégories existent
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM public.interest_category) THEN
        UPDATE public.interest_category 
        SET icon = CASE 
            WHEN name ILIKE '%nature%' OR name ILIKE '%paysage%' OR name ILIKE '%environnement%' THEN '🌿'
            WHEN name ILIKE '%culture%' OR name ILIKE '%tradition%' OR name ILIKE '%culturel%' THEN '🎭'
            WHEN name ILIKE '%aventure%' OR name ILIKE '%sport%' OR name ILIKE '%extrême%' THEN '🏔️'
            WHEN name ILIKE '%beach%' OR name ILIKE '%détente%' OR name ILIKE '%plage%' OR name ILIKE '%relaxation%' THEN '🏖️'
            WHEN name ILIKE '%ville%' OR name ILIKE '%urbain%' OR name ILIKE '%city%' THEN '🏙️'
            WHEN name ILIKE '%gastronomie%' OR name ILIKE '%cuisine%' OR name ILIKE '%culinaire%' THEN '🍽️'
            WHEN name ILIKE '%histoire%' OR name ILIKE '%patrimoine%' OR name ILIKE '%historique%' THEN '🏛️'
            WHEN name ILIKE '%wildlife%' OR name ILIKE '%faune%' OR name ILIKE '%animaux%' THEN '🦎'
            ELSE '🎯'
        END
        WHERE icon IS NULL OR icon = '';
        
        RAISE NOTICE '✅ Icônes par défaut ajoutées aux catégories existantes';
    ELSE
        RAISE NOTICE '⚠️  Aucune catégorie trouvée pour ajouter des icônes';
    END IF;
END $$;

-- 5. Afficher le résultat final
SELECT 
    id, 
    name, 
    icon,
    created_at
FROM public.interest_category 
ORDER BY name;

-- 6. Créer quelques catégories par défaut si la table est vide
INSERT INTO public.interest_category (name, description, icon, created_at, updated_at)
SELECT * FROM (VALUES
    ('Nature et Paysages', 'Découverte des espaces naturels et paysages magnifiques', '🌿', NOW(), NOW()),
    ('Culture et Traditions', 'Immersion dans la culture locale et les traditions', '🎭', NOW(), NOW()),
    ('Aventure et Sports', 'Activités d''aventure et sports extrêmes', '🏔️', NOW(), NOW()),
    ('Détente et Bien-être', 'Moments de relaxation et de bien-être', '🏖️', NOW(), NOW())
) AS new_categories(name, description, icon, created_at, updated_at)
WHERE NOT EXISTS (SELECT 1 FROM public.interest_category);

-- 7. Vérification finale
SELECT 
    'interest_category' as table_name,
    COUNT(*) as total_categories,
    COUNT(CASE WHEN icon IS NOT NULL AND icon != '' THEN 1 END) as categories_with_icons
FROM public.interest_category;

RAISE NOTICE '🎉 Script de réparation terminé ! Vérifiez les résultats ci-dessus.';