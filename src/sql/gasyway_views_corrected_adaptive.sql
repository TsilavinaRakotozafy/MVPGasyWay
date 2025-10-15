-- =================================================================
-- VUES SQL OPTIMISÉES POUR GASYWAY - VERSION ADAPTATIVE CORRIGÉE
-- Script 100% adaptatif qui détecte automatiquement la structure réelle
-- =================================================================

-- 🔧 DÉTECTION AUTOMATIQUE DES COLONNES DISPONIBLES

-- Fonction helper pour détecter la colonne d'image disponible
CREATE OR REPLACE FUNCTION get_packs_image_column() 
RETURNS text AS $$
DECLARE
    image_column text;
BEGIN
    -- Tester dans l'ordre de préférence
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'packs' AND column_name = 'images') THEN
        image_column := 'images';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'packs' AND column_name = 'image_urls') THEN
        image_column := 'image_urls';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'packs' AND column_name = 'image_url') THEN
        image_column := 'image_url';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'packs' AND column_name = 'gallery') THEN
        image_column := 'gallery';
    ELSE
        image_column := 'NULL::text[]'; -- Valeur par défaut si aucune colonne d'image
    END IF;
    
    RETURN image_column;
END;
$$ LANGUAGE plpgsql;

-- =================================================================

-- 🎯 VUE 1: CATALOGUE PACKS - VERSION ENTIÈREMENT ADAPTATIVE
DROP VIEW IF EXISTS packs_catalog_detailed CASCADE;

-- Construire la vue dynamiquement selon les colonnes disponibles
DO $$
DECLARE
    image_col text;
    sql_query text;
BEGIN
    -- Détecter la colonne d'image
    image_col := get_packs_image_column();
    
    -- Construire la requête SQL adaptative
    sql_query := format('
    CREATE VIEW packs_catalog_detailed AS
    SELECT 
        p.id,
        p.title,
        p.description,
        %s, -- Description courte si existe
        p.price,
        %s, -- Currency si existe
        %s, -- Duration_days si existe
        %s, -- Max_participants si existe
        %s, -- Min_participants si existe
        p.location,
        p.status,
        %s as images, -- Colonne d''image détectée
        %s, -- Included_services si existe
        %s, -- Excluded_services si existe
        %s, -- Difficulty_level si existe
        %s, -- Season_start si existe
        %s, -- Season_end si existe
        %s, -- Cancellation_policy si existe
        p.created_at,
        p.updated_at,
        %s, -- Created_by si existe
        
        -- Catégorie - VERSION FLEXIBLE selon tables existantes
        CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = ''categories'') THEN
                (SELECT c.id FROM categories c WHERE c.id = p.category_id)
            WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = ''interest_categories'') THEN
                (SELECT ic.id FROM interest_categories ic WHERE ic.id = p.category_id)
            ELSE NULL
        END as category_id,
        
        CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = ''categories'') THEN
                (SELECT c.name FROM categories c WHERE c.id = p.category_id)
            WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = ''interest_categories'') THEN
                (SELECT ic.name FROM interest_categories ic WHERE ic.id = p.category_id)
            ELSE ''Sans catégorie''
        END as category_name,
        
        -- Partner enrichi (si existe)
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = ''partners'') AND %s THEN
            (SELECT JSON_BUILD_OBJECT(
                ''id'', pt.id,
                ''name'', pt.name,
                ''logo_url'', COALESCE(pt.logo_url, ''''),
                ''rating'', COALESCE(pt.rating, 0)
            ) FROM partners pt WHERE pt.id = p.partner_id)
        ELSE NULL END as partner_info,
        
        -- Statistiques calculées (si les tables existent)
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = ''bookings'') THEN
            COALESCE((
                SELECT COUNT(*)
                FROM bookings b 
                WHERE b.pack_id = p.id 
                AND b.status IN (''confirmed'', ''completed'')
            ), 0)
        ELSE 0 END as total_bookings,
        
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = ''reviews'') THEN
            COALESCE((
                SELECT AVG(r.rating)
                FROM reviews r 
                WHERE r.pack_id = p.id 
                AND r.status = ''approved''
            ), 0)
        ELSE 0 END as avg_rating,
        
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = ''reviews'') THEN
            COALESCE((
                SELECT COUNT(*)
                FROM reviews r 
                WHERE r.pack_id = p.id 
                AND r.status = ''approved''
            ), 0)
        ELSE 0 END as total_reviews,
        
        -- Disponibilité calculée
        CASE 
            WHEN p.status = ''active'' AND 
                 (%s IS NULL OR %s <= CURRENT_DATE) AND
                 (%s IS NULL OR %s >= CURRENT_DATE)
            THEN true 
            ELSE false 
        END as is_available
    
    FROM packs p',
        -- Paramètres pour les colonnes conditionnelles
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'packs' AND column_name = 'short_description') 
             THEN 'p.short_description' ELSE 'NULL as short_description' END,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'packs' AND column_name = 'currency') 
             THEN 'p.currency' ELSE '''EUR'' as currency' END,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'packs' AND column_name = 'duration_days') 
             THEN 'p.duration_days' ELSE '1 as duration_days' END,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'packs' AND column_name = 'max_participants') 
             THEN 'p.max_participants' ELSE '10 as max_participants' END,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'packs' AND column_name = 'min_participants') 
             THEN 'p.min_participants' ELSE '1 as min_participants' END,
        image_col,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'packs' AND column_name = 'included_services') 
             THEN 'p.included_services' ELSE 'NULL::text[] as included_services' END,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'packs' AND column_name = 'excluded_services') 
             THEN 'p.excluded_services' ELSE 'NULL::text[] as excluded_services' END,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'packs' AND column_name = 'difficulty_level') 
             THEN 'p.difficulty_level' ELSE '''facile'' as difficulty_level' END,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'packs' AND column_name = 'season_start') 
             THEN 'p.season_start' ELSE 'NULL as season_start' END,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'packs' AND column_name = 'season_end') 
             THEN 'p.season_end' ELSE 'NULL as season_end' END,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'packs' AND column_name = 'cancellation_policy') 
             THEN 'p.cancellation_policy' ELSE '''flexible'' as cancellation_policy' END,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'packs' AND column_name = 'created_by') 
             THEN 'p.created_by' ELSE 'NULL as created_by' END,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'packs' AND column_name = 'partner_id') 
             THEN 'p.partner_id IS NOT NULL' ELSE 'false' END,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'packs' AND column_name = 'season_start') 
             THEN 'p.season_start::date' ELSE 'NULL' END,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'packs' AND column_name = 'season_start') 
             THEN 'p.season_start::date' ELSE 'NULL' END,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'packs' AND column_name = 'season_end') 
             THEN 'p.season_end::date' ELSE 'NULL' END,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'packs' AND column_name = 'season_end') 
             THEN 'p.season_end::date' ELSE 'NULL' END
    );
    
    -- Exécuter la requête construite
    EXECUTE sql_query;
    
    -- Créer les index
    CREATE INDEX IF NOT EXISTS idx_packs_catalog_category ON packs_catalog_detailed(category_id);
    CREATE INDEX IF NOT EXISTS idx_packs_catalog_available ON packs_catalog_detailed(is_available);
    
END $$;

-- =================================================================

-- 🎯 VUE 2: DASHBOARD ADMIN - VERSION SÉCURISÉE
DROP VIEW IF EXISTS admin_dashboard_stats CASCADE;
CREATE VIEW admin_dashboard_stats AS
SELECT 
    -- Statistiques utilisateurs (toujours disponible)
    (SELECT COUNT(*) FROM users WHERE status = 'active') as active_users_count,
    (SELECT COUNT(*) FROM users WHERE created_at::date = CURRENT_DATE) as new_users_today,
    (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_users_week,
    
    -- Statistiques packs (toujours disponible)
    (SELECT COUNT(*) FROM packs WHERE status = 'active') as active_packs_count,
    (SELECT COUNT(*) FROM packs WHERE created_at::date = CURRENT_DATE) as new_packs_today,
    
    -- Statistiques réservations (si la table existe)
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
        (SELECT COUNT(*) FROM bookings WHERE created_at::date = CURRENT_DATE)
    ELSE 0 END as bookings_today,
    
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
        (SELECT COUNT(*) FROM bookings WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')
    ELSE 0 END as bookings_week,
    
    -- Avis (si reviews existe)
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
        (SELECT COUNT(*) FROM reviews WHERE created_at::date = CURRENT_DATE)
    ELSE 0 END as reviews_today,
    
    -- Messages support (si conversations existe)
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') THEN
        (SELECT COUNT(*) FROM conversations WHERE status = 'active')
    ELSE 0 END as active_conversations,
    
    CURRENT_TIMESTAMP as calculated_at;

-- =================================================================

-- 🎯 VUE 3: FAVORIS - VERSION ADAPTATIVE SIMPLIFIÉE
DROP VIEW IF EXISTS user_favorites_simple CASCADE;

DO $$
DECLARE
    image_col text;
    sql_query text;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'favorites') THEN
        image_col := get_packs_image_column();
        
        sql_query := format('
        CREATE VIEW user_favorites_simple AS
        SELECT 
            f.id as favorite_id,
            f.user_id,
            f.pack_id,
            f.created_at as favorited_at,
            
            -- Pack info
            p.title,
            p.description,
            p.price,
            p.location,
            %s as images,
            p.status as pack_status,
            
            -- User info minimal
            u.first_name,
            u.last_name,
            
            -- Disponibilité simple
            CASE 
                WHEN p.status = ''active'' THEN true 
                ELSE false 
            END as is_available

        FROM favorites f
        JOIN users u ON f.user_id = u.id
        JOIN packs p ON f.pack_id = p.id
        WHERE u.status = ''active''', image_col);
        
        EXECUTE sql_query;
        
        CREATE INDEX IF NOT EXISTS idx_favorites_simple_user ON user_favorites_simple(user_id);
    END IF;
END $$;

-- =================================================================

-- 🎯 FONCTION DE DIAGNOSTIC FINALE
CREATE OR REPLACE FUNCTION gasyway_views_diagnostic()
RETURNS TABLE(
    component text,
    status text,
    details text
) AS $$
BEGIN
    -- Vérifier packs_catalog_detailed
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'packs_catalog_detailed') THEN
        RETURN QUERY SELECT 'packs_catalog_detailed'::text, 'SUCCESS'::text, 'Vue créée avec adaptation automatique'::text;
    ELSE
        RETURN QUERY SELECT 'packs_catalog_detailed'::text, 'ERROR'::text, 'Vue non créée'::text;
    END IF;
    
    -- Vérifier admin_dashboard_stats
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'admin_dashboard_stats') THEN
        RETURN QUERY SELECT 'admin_dashboard_stats'::text, 'SUCCESS'::text, 'Vue dashboard créée'::text;
    ELSE
        RETURN QUERY SELECT 'admin_dashboard_stats'::text, 'ERROR'::text, 'Vue dashboard non créée'::text;
    END IF;
    
    -- Vérifier user_favorites_simple
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'favorites') THEN
        IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'user_favorites_simple') THEN
            RETURN QUERY SELECT 'user_favorites_simple'::text, 'SUCCESS'::text, 'Vue favoris créée'::text;
        ELSE
            RETURN QUERY SELECT 'user_favorites_simple'::text, 'ERROR'::text, 'Vue favoris non créée'::text;
        END IF;
    ELSE
        RETURN QUERY SELECT 'user_favorites_simple'::text, 'SKIPPED'::text, 'Table favorites non trouvée'::text;
    END IF;
    
    -- Vérifier la colonne d'image détectée
    RETURN QUERY SELECT 'image_column_detection'::text, 'INFO'::text, get_packs_image_column()::text;
    
    -- Test de performance basic
    BEGIN
        PERFORM COUNT(*) FROM packs_catalog_detailed LIMIT 1;
        RETURN QUERY SELECT 'performance_test'::text, 'SUCCESS'::text, 'Vue catalogue fonctionnelle'::text;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'performance_test'::text, 'ERROR'::text, SQLERRM::text;
    END;
END;
$$ LANGUAGE plpgsql;

-- =================================================================

-- 🧹 NETTOYAGE
DROP FUNCTION IF EXISTS get_packs_image_column();

-- =================================================================

-- ✅ SCRIPT ADAPTATIF CORRIGÉ TERMINÉ !
-- 
-- 🔍 POUR DIAGNOSTIQUER:
-- SELECT * FROM gasyway_views_diagnostic();
-- 
-- 🚀 POUR TESTER LA VUE PRINCIPALE:
-- SELECT * FROM packs_catalog_detailed LIMIT 3;
-- 
-- 📊 VUE DASHBOARD:
-- SELECT * FROM admin_dashboard_stats;
-- 
-- =================================================================