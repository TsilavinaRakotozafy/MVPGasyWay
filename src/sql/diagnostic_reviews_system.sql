-- =============================================
-- DIAGNOSTIC COMPLET : SYSTÈME D'AVIS GASYWAY
-- Identifie tous les problèmes potentiels
-- =============================================

DO $$
DECLARE
    users_count INTEGER := 0;
    packs_count INTEGER := 0;
    reviews_count INTEGER := 0;
    pack_reviews_count INTEGER := 0;
    users_table_exists BOOLEAN := false;
    packs_table_exists BOOLEAN := false;
    reviews_table_exists BOOLEAN := false;
    pack_reviews_table_exists BOOLEAN := false;
    reviews_columns TEXT;
    error_messages TEXT[] := ARRAY[]::TEXT[];
    success_messages TEXT[] := ARRAY[]::TEXT[];
BEGIN
    RAISE NOTICE '🔍 DIAGNOSTIC COMPLET DU SYSTÈME D''AVIS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    -- ==============================
    -- 1. VÉRIFICATION DES TABLES
    -- ==============================
    
    RAISE NOTICE '📋 1. VÉRIFICATION DES TABLES...';
    
    -- Vérifier existence des tables
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'users' AND table_schema = 'public'
    ) INTO users_table_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'packs' AND table_schema = 'public'
    ) INTO packs_table_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'reviews' AND table_schema = 'public'
    ) INTO reviews_table_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'pack_reviews' AND table_schema = 'public'
    ) ) INTO pack_reviews_table_exists;
    
    -- Compter les enregistrements
    IF users_table_exists THEN
        SELECT COUNT(*) INTO users_count FROM users;
        success_messages := array_append(success_messages, '✅ Table users: ' || users_count || ' utilisateurs');
    ELSE
        error_messages := array_append(error_messages, '❌ Table users: MANQUANTE');
    END IF;
    
    IF packs_table_exists THEN
        SELECT COUNT(*) INTO packs_count FROM packs;
        success_messages := array_append(success_messages, '✅ Table packs: ' || packs_count || ' packs');
    ELSE
        error_messages := array_append(error_messages, '❌ Table packs: MANQUANTE');
    END IF;
    
    IF reviews_table_exists THEN
        SELECT COUNT(*) INTO reviews_count FROM reviews;
        success_messages := array_append(success_messages, '✅ Table reviews: ' || reviews_count || ' avis');
        
        -- Vérifier la structure de la table reviews
        SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) INTO reviews_columns
        FROM information_schema.columns 
        WHERE table_name = 'reviews' AND table_schema = 'public';
        success_messages := array_append(success_messages, '✅ Colonnes reviews: ' || reviews_columns);
    ELSE
        error_messages := array_append(error_messages, '❌ Table reviews: MANQUANTE (table principale pour les avis)');
    END IF;
    
    IF pack_reviews_table_exists THEN
        SELECT COUNT(*) INTO pack_reviews_count FROM pack_reviews;
        IF pack_reviews_count > 0 THEN
            error_messages := array_append(error_messages, '⚠️ Table pack_reviews: ' || pack_reviews_count || ' avis (ancienne table, migrer vers reviews)');
        ELSE
            success_messages := array_append(success_messages, '✅ Table pack_reviews: vide (OK)');
        END IF;
    END IF;
    
    -- ==============================
    -- 2. VÉRIFICATION DES RELATIONS
    -- ==============================
    
    RAISE NOTICE '';
    RAISE NOTICE '🔗 2. VÉRIFICATION DES RELATIONS...';
    
    IF reviews_table_exists THEN
        -- Vérifier les foreign keys
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'reviews' 
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name LIKE '%user%'
        ) THEN
            success_messages := array_append(success_messages, '✅ Foreign key reviews -> users: configurée');
        ELSE
            error_messages := array_append(error_messages, '❌ Foreign key reviews -> users: MANQUANTE');
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'reviews' 
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name LIKE '%pack%'
        ) THEN
            success_messages := array_append(success_messages, '✅ Foreign key reviews -> packs: configurée');
        ELSE
            error_messages := array_append(error_messages, '❌ Foreign key reviews -> packs: MANQUANTE');
        END IF;
    END IF;
    
    -- ==============================
    -- 3. VÉRIFICATION DES POLITIQUES RLS
    -- ==============================
    
    RAISE NOTICE '';
    RAISE NOTICE '🔒 3. VÉRIFICATION DES POLITIQUES RLS...';
    
    IF reviews_table_exists THEN
        -- Vérifier si RLS est activé
        IF EXISTS (
            SELECT 1 FROM pg_class 
            WHERE relname = 'reviews' AND relrowsecurity = true
        ) THEN
            success_messages := array_append(success_messages, '✅ RLS activé sur reviews');
            
            -- Compter les politiques
            DECLARE
                policies_count INTEGER;
            BEGIN
                SELECT COUNT(*) INTO policies_count
                FROM pg_policies 
                WHERE tablename = 'reviews';
                
                IF policies_count > 0 THEN
                    success_messages := array_append(success_messages, '✅ Politiques RLS: ' || policies_count || ' configurées');
                ELSE
                    error_messages := array_append(error_messages, '❌ Politiques RLS: AUCUNE');
                END IF;
            END;
        ELSE
            error_messages := array_append(error_messages, '❌ RLS désactivé sur reviews');
        END IF;
    END IF;
    
    -- ==============================
    -- 4. VÉRIFICATION DES UTILISATEURS DEMO
    -- ==============================
    
    RAISE NOTICE '';
    RAISE NOTICE '👥 4. VÉRIFICATION DES UTILISATEURS DEMO...';
    
    IF users_table_exists THEN
        DECLARE
            demo_users_count INTEGER;
            active_voyageurs_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO demo_users_count 
            FROM users 
            WHERE email LIKE '%demo%' OR email LIKE '%@demo.mg';
            
            SELECT COUNT(*) INTO active_voyageurs_count 
            FROM users 
            WHERE role = 'voyageur' AND status = 'active';
            
            IF demo_users_count > 0 THEN
                success_messages := array_append(success_messages, '✅ Utilisateurs demo: ' || demo_users_count || ' trouvés');
            ELSE
                error_messages := array_append(error_messages, '⚠️ Utilisateurs demo: AUCUN (recommandé pour les tests)');
            END IF;
            
            IF active_voyageurs_count > 0 THEN
                success_messages := array_append(success_messages, '✅ Voyageurs actifs: ' || active_voyageurs_count);
            ELSE
                error_messages := array_append(error_messages, '❌ Voyageurs actifs: AUCUN (nécessaire pour créer des avis)');
            END IF;
        END;
    END IF;
    
    -- ==============================
    -- 5. TEST DE FONCTIONNALITÉ API
    -- ==============================
    
    RAISE NOTICE '';
    RAISE NOTICE '🧪 5. TEST DE FONCTIONNALITÉ API...';
    
    IF reviews_table_exists AND users_table_exists AND packs_table_exists THEN
        BEGIN
            -- Tester la requête GET reviews (utilisée par le serveur)
            PERFORM r.id, r.rating, r.comment, r.created_at, u.first_name, u.last_name
            FROM reviews r
            INNER JOIN users u ON r.user_id = u.id
            LIMIT 1;
            
            success_messages := array_append(success_messages, '✅ Requête GET reviews: FONCTIONNE');
            
        EXCEPTION WHEN OTHERS THEN
            error_messages := array_append(error_messages, '❌ Requête GET reviews: ÉCHEC - ' || SQLERRM);
        END;
        
        -- Vérifier s'il y a des données pour tester
        IF reviews_count > 0 THEN
            success_messages := array_append(success_messages, '✅ Données de test: ' || reviews_count || ' avis disponibles');
            
            -- Calculer des statistiques
            DECLARE
                avg_rating NUMERIC;
                rating_distribution TEXT;
            BEGIN
                SELECT ROUND(AVG(rating::numeric), 1) INTO avg_rating FROM reviews WHERE status = 'approved';
                success_messages := array_append(success_messages, '✅ Moyenne des avis: ' || COALESCE(avg_rating, 0) || '/5');
            END;
        ELSE
            error_messages := array_append(error_messages, '⚠️ Données de test: AUCUN avis (exécutez populate_demo_reviews.sql)');
        END IF;
    END IF;
    
    -- ==============================
    -- 6. AFFICHAGE DU RÉSUMÉ
    -- ==============================
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 RÉSUMÉ DU DIAGNOSTIC';
    RAISE NOTICE '======================';
    RAISE NOTICE '';
    
    -- Afficher les succès
    IF array_length(success_messages, 1) > 0 THEN
        RAISE NOTICE '✅ ÉLÉMENTS FONCTIONNELS:';
        FOR i IN 1..array_length(success_messages, 1) LOOP
            RAISE NOTICE '   %', success_messages[i];
        END LOOP;
        RAISE NOTICE '';
    END IF;
    
    -- Afficher les erreurs
    IF array_length(error_messages, 1) > 0 THEN
        RAISE NOTICE '❌ PROBLÈMES DÉTECTÉS:';
        FOR i IN 1..array_length(error_messages, 1) LOOP
            RAISE NOTICE '   %', error_messages[i];
        END LOOP;
        RAISE NOTICE '';
    END IF;
    
    -- ==============================
    -- 7. RECOMMANDATIONS
    -- ==============================
    
    RAISE NOTICE '💡 RECOMMANDATIONS:';
    
    IF NOT reviews_table_exists THEN
        RAISE NOTICE '   1. Exécutez: fix_reviews_table_structure.sql';
    END IF;
    
    IF users_count < 3 THEN
        RAISE NOTICE '   2. Exécutez: create_demo_users_for_reviews.sql';
    END IF;
    
    IF reviews_count = 0 THEN
        RAISE NOTICE '   3. Exécutez: populate_demo_reviews.sql';
    END IF;
    
    IF pack_reviews_count > 0 THEN
        RAISE NOTICE '   4. Migrez pack_reviews vers reviews avec fix_reviews_table_structure.sql';
    END IF;
    
    RAISE NOTICE '';
    
    -- Déterminer le statut global
    IF array_length(error_messages, 1) = 0 THEN
        RAISE NOTICE '🎉 SYSTÈME D''AVIS: OPÉRATIONNEL !';
        RAISE NOTICE 'Votre application peut créer et afficher des avis.';
    ELSIF array_length(error_messages, 1) <= 2 THEN
        RAISE NOTICE '⚠️ SYSTÈME D''AVIS: PARTIELLEMENT FONCTIONNEL';
        RAISE NOTICE 'Quelques corrections mineures sont nécessaires.';
    ELSE
        RAISE NOTICE '❌ SYSTÈME D''AVIS: NÉCESSITE DES CORRECTIONS';
        RAISE NOTICE 'Plusieurs éléments doivent être corrigés avant utilisation.';
    END IF;
    
    RAISE NOTICE '';
    
END $$;