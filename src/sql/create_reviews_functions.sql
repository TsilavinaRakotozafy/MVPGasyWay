-- =============================================
-- SCRIPT SQL : FONCTIONS POUR SYSTÈME D'AVIS RÉEL
-- =============================================
-- Ce script crée les fonctions Supabase nécessaires
-- pour récupérer les packs avec leurs vraies moyennes d'avis

-- =============================================
-- 1. FONCTION : Récupérer tous les packs avec avis
-- =============================================

CREATE OR REPLACE FUNCTION get_packs_with_reviews()
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    description TEXT,
    short_description TEXT,
    price BIGINT,
    currency VARCHAR,
    duration_days INTEGER,
    max_participants INTEGER,
    min_participants INTEGER,
    location VARCHAR,
    category_id UUID,
    region_id UUID,
    status VARCHAR,
    images TEXT[],
    included_services TEXT[],
    excluded_services TEXT[],
    difficulty_level VARCHAR,
    season_start VARCHAR,
    season_end VARCHAR,
    cancellation_policy TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    category JSONB,
    region JSONB,
    is_favorite BOOLEAN,
    imageUrl TEXT,
    average_rating NUMERIC,
    total_reviews BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.description,
        p.short_description,
        p.price,
        p.currency,
        p.duration_days,
        p.max_participants,
        p.min_participants,
        p.location,
        p.category_id,
        p.region_id,
        p.status,
        p.images,
        p.included_services,
        p.excluded_services,
        p.difficulty_level,
        p.season_start,
        p.season_end,
        p.cancellation_policy,
        p.created_by,
        p.created_at,
        p.updated_at,
        -- Catégorie en JSONB
        CASE 
            WHEN pc.id IS NOT NULL THEN 
                jsonb_build_object(
                    'id', pc.id,
                    'name', pc.name,
                    'description', pc.description,
                    'icon', pc.icon
                )
            ELSE NULL 
        END as category,
        -- Région en JSONB
        CASE 
            WHEN r.id IS NOT NULL THEN 
                jsonb_build_object(
                    'id', r.id,
                    'name', r.name,
                    'slug', r.slug
                )
            ELSE NULL 
        END as region,
        -- Toujours false pour is_favorite (géré côté frontend)
        false as is_favorite,
        -- Image URL basique
        NULL::TEXT as imageUrl,
        -- Moyenne des avis (arrondie à 1 décimale)
        ROUND(AVG(rev.rating::numeric), 1) as average_rating,
        -- Nombre total d'avis approuvés
        COUNT(rev.id) as total_reviews
    FROM packs p
    LEFT JOIN pack_categories pc ON p.category_id = pc.id
    LEFT JOIN regions r ON p.region_id = r.id
    LEFT JOIN reviews rev ON p.id = rev.pack_id AND rev.status = 'approved'
    GROUP BY 
        p.id, p.title, p.description, p.short_description, p.price, p.currency,
        p.duration_days, p.max_participants, p.min_participants, p.location,
        p.category_id, p.region_id, p.status, p.images, p.included_services,
        p.excluded_services, p.difficulty_level, p.season_start, p.season_end,
        p.cancellation_policy, p.created_by, p.created_at, p.updated_at,
        pc.id, pc.name, pc.description, pc.icon,
        r.id, r.name, r.slug
    ORDER BY p.created_at DESC;
END;
$$;

-- =============================================
-- 2. FONCTION : Récupérer les packs actifs avec avis
-- =============================================

CREATE OR REPLACE FUNCTION get_active_packs_with_reviews()
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    description TEXT,
    short_description TEXT,
    price BIGINT,
    currency VARCHAR,
    duration_days INTEGER,
    max_participants INTEGER,
    min_participants INTEGER,
    location VARCHAR,
    category_id UUID,
    region_id UUID,
    status VARCHAR,
    images TEXT[],
    included_services TEXT[],
    excluded_services TEXT[],
    difficulty_level VARCHAR,
    season_start VARCHAR,
    season_end VARCHAR,
    cancellation_policy TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    category JSONB,
    region JSONB,
    is_favorite BOOLEAN,
    imageUrl TEXT,
    average_rating NUMERIC,
    total_reviews BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.description,
        p.short_description,
        p.price,
        p.currency,
        p.duration_days,
        p.max_participants,
        p.min_participants,
        p.location,
        p.category_id,
        p.region_id,
        p.status,
        p.images,
        p.included_services,
        p.excluded_services,
        p.difficulty_level,
        p.season_start,
        p.season_end,
        p.cancellation_policy,
        p.created_by,
        p.created_at,
        p.updated_at,
        -- Catégorie en JSONB
        CASE 
            WHEN pc.id IS NOT NULL THEN 
                jsonb_build_object(
                    'id', pc.id,
                    'name', pc.name,
                    'description', pc.description,
                    'icon', pc.icon
                )
            ELSE NULL 
        END as category,
        -- Région en JSONB
        CASE 
            WHEN r.id IS NOT NULL THEN 
                jsonb_build_object(
                    'id', r.id,
                    'name', r.name,
                    'slug', r.slug
                )
            ELSE NULL 
        END as region,
        -- Toujours false pour is_favorite (géré côté frontend)
        false as is_favorite,
        -- Image URL basique
        NULL::TEXT as imageUrl,
        -- Moyenne des avis (arrondie à 1 décimale)
        ROUND(AVG(rev.rating::numeric), 1) as average_rating,
        -- Nombre total d'avis approuvés
        COUNT(rev.id) as total_reviews
    FROM packs p
    LEFT JOIN pack_categories pc ON p.category_id = pc.id
    LEFT JOIN regions r ON p.region_id = r.id
    LEFT JOIN reviews rev ON p.id = rev.pack_id AND rev.status = 'approved'
    WHERE p.status = 'active'
    GROUP BY 
        p.id, p.title, p.description, p.short_description, p.price, p.currency,
        p.duration_days, p.max_participants, p.min_participants, p.location,
        p.category_id, p.region_id, p.status, p.images, p.included_services,
        p.excluded_services, p.difficulty_level, p.season_start, p.season_end,
        p.cancellation_policy, p.created_by, p.created_at, p.updated_at,
        pc.id, pc.name, pc.description, pc.icon,
        r.id, r.name, r.slug
    ORDER BY p.created_at DESC;
END;
$$;

-- =============================================
-- 3. FONCTION : Récupérer un pack par ID avec avis
-- =============================================

CREATE OR REPLACE FUNCTION get_pack_by_id_with_reviews(pack_id UUID)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    description TEXT,
    short_description TEXT,
    price BIGINT,
    currency VARCHAR,
    duration_days INTEGER,
    max_participants INTEGER,
    min_participants INTEGER,
    location VARCHAR,
    category_id UUID,
    region_id UUID,
    status VARCHAR,
    images TEXT[],
    included_services TEXT[],
    excluded_services TEXT[],
    difficulty_level VARCHAR,
    season_start VARCHAR,
    season_end VARCHAR,
    cancellation_policy TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    category JSONB,
    region JSONB,
    is_favorite BOOLEAN,
    imageUrl TEXT,
    average_rating NUMERIC,
    total_reviews BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.description,
        p.short_description,
        p.price,
        p.currency,
        p.duration_days,
        p.max_participants,
        p.min_participants,
        p.location,
        p.category_id,
        p.region_id,
        p.status,
        p.images,
        p.included_services,
        p.excluded_services,
        p.difficulty_level,
        p.season_start,
        p.season_end,
        p.cancellation_policy,
        p.created_by,
        p.created_at,
        p.updated_at,
        -- Catégorie en JSONB
        CASE 
            WHEN pc.id IS NOT NULL THEN 
                jsonb_build_object(
                    'id', pc.id,
                    'name', pc.name,
                    'description', pc.description,
                    'icon', pc.icon
                )
            ELSE NULL 
        END as category,
        -- Région en JSONB
        CASE 
            WHEN r.id IS NOT NULL THEN 
                jsonb_build_object(
                    'id', r.id,
                    'name', r.name,
                    'slug', r.slug
                )
            ELSE NULL 
        END as region,
        -- Toujours false pour is_favorite (géré côté frontend)
        false as is_favorite,
        -- Image URL basique
        NULL::TEXT as imageUrl,
        -- Moyenne des avis (arrondie à 1 décimale)
        ROUND(AVG(rev.rating::numeric), 1) as average_rating,
        -- Nombre total d'avis approuvés
        COUNT(rev.id) as total_reviews
    FROM packs p
    LEFT JOIN pack_categories pc ON p.category_id = pc.id
    LEFT JOIN regions r ON p.region_id = r.id
    LEFT JOIN reviews rev ON p.id = rev.pack_id AND rev.status = 'approved'
    WHERE p.id = pack_id
    GROUP BY 
        p.id, p.title, p.description, p.short_description, p.price, p.currency,
        p.duration_days, p.max_participants, p.min_participants, p.location,
        p.category_id, p.region_id, p.status, p.images, p.included_services,
        p.excluded_services, p.difficulty_level, p.season_start, p.season_end,
        p.cancellation_policy, p.created_by, p.created_at, p.updated_at,
        pc.id, pc.name, pc.description, pc.icon,
        r.id, r.name, r.slug;
END;
$$;

-- =============================================
-- 4. FONCTION : Statistiques globales des avis
-- =============================================

CREATE OR REPLACE FUNCTION get_reviews_global_stats()
RETURNS TABLE (
    total_reviews BIGINT,
    average_rating NUMERIC,
    five_stars BIGINT,
    four_stars BIGINT,
    three_stars BIGINT,
    two_stars BIGINT,
    one_star BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_reviews,
        ROUND(AVG(rating::numeric), 2) as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_stars,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_stars,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_stars,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_stars,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
    FROM reviews 
    WHERE status = 'approved';
END;
$$;

-- =============================================
-- 5. FONCTION : Top 10 des packs les mieux notés
-- =============================================

CREATE OR REPLACE FUNCTION get_top_rated_packs(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    average_rating NUMERIC,
    total_reviews BIGINT,
    category_name VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        ROUND(AVG(r.rating::numeric), 1) as average_rating,
        COUNT(r.id) as total_reviews,
        pc.name as category_name
    FROM packs p
    LEFT JOIN reviews r ON p.id = r.pack_id AND r.status = 'approved'
    LEFT JOIN pack_categories pc ON p.category_id = pc.id
    WHERE p.status = 'active'
    GROUP BY p.id, p.title, pc.name
    HAVING COUNT(r.id) >= 3  -- Au moins 3 avis
    ORDER BY average_rating DESC, total_reviews DESC
    LIMIT limit_count;
END;
$$;

-- =============================================
-- 6. COMMENTAIRES ET PERMISSIONS
-- =============================================

-- Commentaires sur les fonctions
COMMENT ON FUNCTION get_packs_with_reviews() IS 'Récupère tous les packs avec leurs statistiques d''avis calculées en temps réel';
COMMENT ON FUNCTION get_active_packs_with_reviews() IS 'Récupère les packs actifs avec leurs statistiques d''avis calculées en temps réel';
COMMENT ON FUNCTION get_pack_by_id_with_reviews(UUID) IS 'Récupère un pack spécifique avec ses statistiques d''avis calculées en temps réel';
COMMENT ON FUNCTION get_reviews_global_stats() IS 'Statistiques globales des avis approuvés';
COMMENT ON FUNCTION get_top_rated_packs(INTEGER) IS 'Top des packs les mieux notés avec au moins 3 avis';

-- Donner les permissions nécessaires (ajustez selon vos rôles)
-- GRANT EXECUTE ON FUNCTION get_packs_with_reviews() TO anon, authenticated;
-- GRANT EXECUTE ON FUNCTION get_active_packs_with_reviews() TO anon, authenticated;
-- GRANT EXECUTE ON FUNCTION get_pack_by_id_with_reviews(UUID) TO anon, authenticated;
-- GRANT EXECUTE ON FUNCTION get_reviews_global_stats() TO anon, authenticated;
-- GRANT EXECUTE ON FUNCTION get_top_rated_packs(INTEGER) TO anon, authenticated;

-- =============================================
-- 7. TESTS DES FONCTIONS
-- =============================================

-- Tester les fonctions
SELECT 'TEST: get_active_packs_with_reviews' as test_name;
SELECT id, title, average_rating, total_reviews FROM get_active_packs_with_reviews() LIMIT 5;

SELECT 'TEST: get_reviews_global_stats' as test_name;
SELECT * FROM get_reviews_global_stats();

SELECT 'TEST: get_top_rated_packs' as test_name;
SELECT * FROM get_top_rated_packs(5);

-- =============================================
-- 8. MESSAGE FINAL
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 FONCTIONS SUPABASE CRÉÉES AVEC SUCCÈS !';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Fonctions disponibles :';
    RAISE NOTICE '   • get_packs_with_reviews() - Tous les packs avec avis';
    RAISE NOTICE '   • get_active_packs_with_reviews() - Packs actifs avec avis';
    RAISE NOTICE '   • get_pack_by_id_with_reviews(uuid) - Pack spécifique avec avis';
    RAISE NOTICE '   • get_reviews_global_stats() - Statistiques globales';
    RAISE NOTICE '   • get_top_rated_packs(limit) - Top des packs notés';
    RAISE NOTICE '';
    RAISE NOTICE '🔥 Vos API retournent maintenant de VRAIES moyennes calculées !';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Prochaines étapes :';
    RAISE NOTICE '   1. Exécuter populate_reviews_data.sql pour ajouter des avis';
    RAISE NOTICE '   2. Tester l''application frontend';
    RAISE NOTICE '   3. Vérifier que les moyennes s''affichent correctement';
    RAISE NOTICE '';
END $$;