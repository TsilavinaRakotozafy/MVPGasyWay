-- Diagnostic complet de la structure des tables GasyWay
-- Ce script vérifie l'existence et la structure des tables principales

-- Fonction pour afficher les informations d'une table
CREATE OR REPLACE FUNCTION diagnostic_table(table_name_param TEXT)
RETURNS VOID AS $$
DECLARE
    rec RECORD;
    column_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- Vérifier si la table existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = table_name_param) THEN
        RAISE NOTICE '✅ Table % existe', table_name_param;
        
        -- Compter les colonnes
        SELECT COUNT(*) INTO column_count 
        FROM information_schema.columns 
        WHERE table_name = table_name_param;
        RAISE NOTICE '   Nombre de colonnes: %', column_count;
        
        -- Lister les colonnes principales
        RAISE NOTICE '   Colonnes:';
        FOR rec IN (
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = table_name_param
            ORDER BY ordinal_position
        ) LOOP
            RAISE NOTICE '   - % : % (nullable: %, default: %)', 
                rec.column_name, rec.data_type, rec.is_nullable, 
                COALESCE(rec.column_default, 'aucun');
        END LOOP;
        
        -- Vérifier RLS
        SELECT COUNT(*) INTO policy_count 
        FROM pg_policies 
        WHERE tablename = table_name_param;
        
        RAISE NOTICE '   RLS activé: % (% politiques)', 
            CASE WHEN EXISTS (
                SELECT 1 FROM pg_class c 
                JOIN pg_namespace n ON n.oid = c.relnamespace 
                WHERE c.relname = table_name_param AND c.relrowsecurity
            ) THEN 'OUI' ELSE 'NON' END,
            policy_count;
            
    ELSE
        RAISE NOTICE '❌ Table % n''existe PAS', table_name_param;
    END IF;
    
    RAISE NOTICE '----------------------------------------';
END;
$$ LANGUAGE plpgsql;

-- Diagnostiquer toutes les tables importantes
SELECT diagnostic_table('users');
SELECT diagnostic_table('interests'); 
SELECT diagnostic_table('interest_category');
SELECT diagnostic_table('user_interests');
SELECT diagnostic_table('packs');
SELECT diagnostic_table('pack_categories');
SELECT diagnostic_table('bookings');
SELECT diagnostic_table('reviews');

-- Vérifier les contraintes de clé étrangère importantes
RAISE NOTICE 'CONTRAINTES DE CLÉ ÉTRANGÈRE:';
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('interests', 'user_interests', 'packs');

-- Vérifier les index importants
RAISE NOTICE 'INDEX PRINCIPAUX:';
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('users', 'interests', 'interest_category', 'user_interests', 'packs')
ORDER BY tablename, indexname;

-- Nettoyer la fonction temporaire
DROP FUNCTION diagnostic_table(TEXT);