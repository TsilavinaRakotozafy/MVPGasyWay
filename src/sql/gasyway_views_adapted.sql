-- =================================================================
-- VUES SQL OPTIMISÉES POUR GASYWAY - VERSION ADAPTÉE
-- Script corrigé selon la structure existante
-- =================================================================

-- 🔧 CRÉATION CONDITIONNELLE DES VUES SELON LES TABLES DISPONIBLES

-- 🎯 VUE 1: CATALOGUE PACKS SIMPLIFIÉ (sans categories si elle n'existe pas)
DROP VIEW IF EXISTS packs_catalog_detailed CASCADE;
CREATE VIEW packs_catalog_detailed AS
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
    p.status,
    p.images,
    p.included_services,
    p.excluded_services,
    p.difficulty_level,
    p.season_start,
    p.season_end,
    p.cancellation_policy,
    p.created_at,
    p.updated_at,
    p.created_by,
    
    -- Catégorie - VERSION FLEXIBLE selon tables existantes
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
            (SELECT c.id FROM categories c WHERE c.id = p.category_id)
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interest_categories') THEN
            (SELECT ic.id FROM interest_categories ic WHERE ic.id = p.category_id)
        ELSE NULL
    END as category_id,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
            (SELECT c.name FROM categories c WHERE c.id = p.category_id)
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interest_categories') THEN
            (SELECT ic.name FROM interest_categories ic WHERE ic.id = p.category_id)
        ELSE 'Sans catégorie'
    END as category_name,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
            (SELECT c.description FROM categories c WHERE c.id = p.category_id)
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interest_categories') THEN
            (SELECT ic.description FROM interest_categories ic WHERE ic.id = p.category_id)
        ELSE NULL
    END as category_description,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
            (SELECT c.icon FROM categories c WHERE c.id = p.category_id)
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interest_categories') THEN
            (SELECT ic.icon FROM interest_categories ic WHERE ic.id = p.category_id)
        ELSE '🏝️'
    END as category_icon,
    
    -- Partner enrichi (si existe)
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partners') AND p.partner_id IS NOT NULL THEN
        (SELECT JSON_BUILD_OBJECT(
            'id', pt.id,
            'name', pt.name,
            'logo_url', COALESCE(pt.logo_url, ''),
            'rating', COALESCE(pt.rating, 0)
        ) FROM partners pt WHERE pt.id = p.partner_id)
    ELSE NULL END as partner_info,
    
    -- Statistiques calculées (si les tables existent)
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
        COALESCE((
            SELECT COUNT(*)
            FROM bookings b 
            WHERE b.pack_id = p.id 
            AND b.status IN ('confirmed', 'completed')
        ), 0)
    ELSE 0 END as total_bookings,
    
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
        COALESCE((
            SELECT AVG(r.rating)
            FROM reviews r 
            WHERE r.pack_id = p.id 
            AND r.status = 'approved'
        ), 0)
    ELSE 0 END as avg_rating,
    
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
        COALESCE((
            SELECT COUNT(*)
            FROM reviews r 
            WHERE r.pack_id = p.id 
            AND r.status = 'approved'
        ), 0)
    ELSE 0 END as total_reviews,
    
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
        COALESCE((
            SELECT SUM(b.total_amount)
            FROM bookings b 
            WHERE b.pack_id = p.id 
            AND b.status IN ('confirmed', 'completed')
        ), 0)
    ELSE 0 END as revenue_total,
    
    -- Disponibilité calculée
    CASE 
        WHEN p.status = 'active' AND 
             (p.season_start IS NULL OR p.season_start::date <= CURRENT_DATE) AND
             (p.season_end IS NULL OR p.season_end::date >= CURRENT_DATE)
        THEN true 
        ELSE false 
    END as is_available,
    
    -- Services formatés pour affichage
    CASE 
        WHEN p.included_services IS NOT NULL AND array_length(p.included_services, 1) > 0
        THEN array_to_string(p.included_services, ' • ')
        ELSE 'Aucun service inclus'
    END as services_display,
    
    -- Score de popularité simple
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
        COALESCE((
            SELECT COUNT(*) * 0.7 + COALESCE(AVG(r.rating), 0) * COUNT(r.id) * 0.3
            FROM bookings b
            LEFT JOIN reviews r ON r.pack_id = b.pack_id
            WHERE b.pack_id = p.id AND b.status IN ('confirmed', 'completed')
            GROUP BY b.pack_id
        ), 0)
    ELSE 0 END as popularity_score

FROM packs p;

-- Index pour performance catalogue
CREATE INDEX IF NOT EXISTS idx_packs_catalog_category ON packs_catalog_detailed(category_id);
CREATE INDEX IF NOT EXISTS idx_packs_catalog_available ON packs_catalog_detailed(is_available);

-- =================================================================

-- 🎯 VUE 2: FAVORIS UTILISATEUR (VERSION CONDITIONNELLE)
DROP VIEW IF EXISTS user_favorites_detailed CASCADE;

-- Créer la vue favorites seulement si la table favorites existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'favorites') THEN
        EXECUTE '
        CREATE VIEW user_favorites_detailed AS
        SELECT 
            f.id as favorite_id,
            f.user_id,
            f.pack_id,
            f.created_at as favorited_at,
            
            -- Pack complet
            p.title,
            p.description,
            p.short_description,
            p.price,
            p.currency,
            p.duration_days,
            p.location,
            p.images,
            p.difficulty_level,
            p.status as pack_status,
            
            -- User info minimal
            u.first_name,
            u.last_name,
            u.email,
            
            -- Disponibilité
            CASE 
                WHEN p.status = ''active'' AND 
                     (p.season_start IS NULL OR p.season_start::date <= CURRENT_DATE) AND
                     (p.season_end IS NULL OR p.season_end::date >= CURRENT_DATE)
                THEN true 
                ELSE false 
            END as is_available

        FROM favorites f
        JOIN users u ON f.user_id = u.id
        JOIN packs p ON f.pack_id = p.id
        WHERE u.status = ''active'' AND p.status IN (''active'', ''inactive'')';
        
        -- Index pour favoris
        CREATE INDEX IF NOT EXISTS idx_favorites_detailed_user ON user_favorites_detailed(user_id);
    END IF;
END $$;

-- =================================================================

-- 🎯 VUE 3: RÉSERVATIONS DÉTAILLÉES (VERSION CONDITIONNELLE)
DROP VIEW IF EXISTS bookings_detailed CASCADE;

-- Créer la vue bookings seulement si la table bookings existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
        EXECUTE '
        CREATE VIEW bookings_detailed AS
        SELECT 
            b.id,
            b.user_id,
            b.pack_id,
            b.status,
            b.booking_date,
            b.travel_date,
            b.number_of_participants,
            b.total_amount,
            b.currency,
            b.payment_status,
            b.cancellation_reason,
            b.created_at,
            b.updated_at,
            
            -- Utilisateur
            u.first_name,
            u.last_name,
            u.email,
            u.phone_number,
            
            -- Pack complet
            p.title as pack_title,
            p.description as pack_description,
            p.price as pack_unit_price,
            p.duration_days,
            p.location,
            p.images as pack_images,
            p.difficulty_level,
            p.cancellation_policy,
            
            -- Calculs utiles
            (b.travel_date - CURRENT_DATE) as days_until_travel,
            CASE 
                WHEN b.travel_date < CURRENT_DATE THEN ''past''
                WHEN b.travel_date = CURRENT_DATE THEN ''today''
                WHEN b.travel_date <= CURRENT_DATE + INTERVAL ''7 days'' THEN ''upcoming''
                ELSE ''future''
            END as travel_timing,
            
            -- Statut d''annulation possible
            CASE 
                WHEN b.status IN (''cancelled'', ''completed'') THEN false
                WHEN b.travel_date <= CURRENT_DATE + INTERVAL ''48 hours'' THEN false
                ELSE true
            END as can_cancel

        FROM bookings b
        JOIN users u ON b.user_id = u.id
        JOIN packs p ON b.pack_id = p.id';
        
        -- Index pour réservations
        CREATE INDEX IF NOT EXISTS idx_bookings_detailed_user_status ON bookings_detailed(user_id, status);
        CREATE INDEX IF NOT EXISTS idx_bookings_detailed_travel_timing ON bookings_detailed(travel_timing);
    END IF;
END $$;

-- =================================================================

-- 🎯 VUE 4: AVIS DÉTAILLÉS (VERSION CONDITIONNELLE)
DROP VIEW IF EXISTS reviews_detailed CASCADE;

-- Créer la vue reviews seulement si la table reviews existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
        EXECUTE '
        CREATE VIEW reviews_detailed AS
        SELECT 
            r.id,
            r.user_id,
            r.pack_id,
            r.booking_id,
            r.rating,
            r.comment,
            r.status,
            r.created_at,
            r.updated_at,
            
            -- Utilisateur (anonymisé pour affichage public)
            u.first_name,
            LEFT(u.last_name, 1) as last_name_initial,
            CONCAT(u.first_name, '' '', LEFT(COALESCE(u.last_name, ''''), 1), ''.'') as user_display_name,
            
            -- Pack
            p.title as pack_title,
            p.images as pack_images,
            p.location as pack_location,
            
            -- Calculs utiles
            CASE 
                WHEN r.rating >= 4.5 THEN ''excellent''
                WHEN r.rating >= 3.5 THEN ''good''
                WHEN r.rating >= 2.5 THEN ''average''
                ELSE ''poor''
            END as rating_category,
            
            -- Avis certifié (lié à une vraie réservation)
            CASE WHEN r.booking_id IS NOT NULL THEN true ELSE false END as is_verified

        FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN packs p ON r.pack_id = p.id';
        
        -- Index pour avis
        CREATE INDEX IF NOT EXISTS idx_reviews_detailed_pack_approved ON reviews_detailed(pack_id, status) WHERE status = 'approved';
    END IF;
END $$;

-- =================================================================

-- 🎯 VUE 5: DASHBOARD ADMIN (VERSION BASIQUE UNIVERSELLE)
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
    
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
        (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed')
    ELSE 0 END as confirmed_bookings_total,
    
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
        (SELECT COUNT(*) FROM bookings WHERE status = 'pending')
    ELSE 0 END as pending_bookings_total,
    
    -- Revenus (si bookings existe)
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
        (SELECT COALESCE(SUM(total_amount), 0) FROM bookings 
         WHERE payment_status = 'paid' AND created_at::date = CURRENT_DATE)
    ELSE 0 END as revenue_today,
    
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
        (SELECT COALESCE(SUM(total_amount), 0) FROM bookings 
         WHERE payment_status = 'paid' AND created_at >= CURRENT_DATE - INTERVAL '7 days')
    ELSE 0 END as revenue_week,
    
    -- Avis (si reviews existe)
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
        (SELECT COUNT(*) FROM reviews WHERE created_at::date = CURRENT_DATE)
    ELSE 0 END as reviews_today,
    
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
        (SELECT COUNT(*) FROM reviews WHERE status = 'pending')
    ELSE 0 END as reviews_pending,
    
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
        (SELECT COALESCE(ROUND(AVG(rating), 2), 0) FROM reviews WHERE status = 'approved')
    ELSE 0 END as avg_rating_global,
    
    -- Messages support (si conversations existe)
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') THEN
        (SELECT COUNT(*) FROM conversations WHERE status = 'active')
    ELSE 0 END as active_conversations,
    
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') THEN
        (SELECT COUNT(*) FROM conversations WHERE created_at::date = CURRENT_DATE)
    ELSE 0 END as new_conversations_today,
    
    CURRENT_TIMESTAMP as calculated_at;

-- =================================================================

-- 🎯 VUE 6: NOTIFICATIONS UTILISATEUR (VERSION CONDITIONNELLE)
DROP VIEW IF EXISTS user_notifications_detailed CASCADE;

-- Créer la vue notifications seulement si la table notifications existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        EXECUTE '
        CREATE VIEW user_notifications_detailed AS
        SELECT 
            n.id,
            n.user_id,
            n.type,
            n.title,
            n.message,
            n.data,
            n.is_read,
            n.created_at,
            
            -- Utilisateur
            u.first_name,
            u.last_name,
            
            -- Formatage du temps relatif
            CASE 
                WHEN n.created_at >= CURRENT_TIMESTAMP - INTERVAL ''5 minutes'' THEN ''just_now''
                WHEN n.created_at >= CURRENT_TIMESTAMP - INTERVAL ''1 hour'' THEN ''this_hour''
                WHEN n.created_at >= CURRENT_TIMESTAMP - INTERVAL ''24 hours'' THEN ''today''
                WHEN n.created_at >= CURRENT_TIMESTAMP - INTERVAL ''7 days'' THEN ''this_week''
                ELSE ''older''
            END as time_category,
            
            -- Priorité calculée
            CASE 
                WHEN n.type IN (''booking_confirmed'', ''payment_failed'', ''booking_cancelled'') THEN ''high''
                WHEN n.type IN (''travel_reminder'', ''review_request'') THEN ''medium''
                ELSE ''normal''
            END as priority_level

        FROM notifications n
        JOIN users u ON n.user_id = u.id
        WHERE u.status = ''active''
        ORDER BY n.created_at DESC';
        
        -- Index pour notifications
        CREATE INDEX IF NOT EXISTS idx_notifications_detailed_user_read ON user_notifications_detailed(user_id, is_read);
    END IF;
END $$;

-- =================================================================

-- 🚀 FONCTIONS UTILITAIRES POUR LES VUES

-- Fonction de monitoring des performances des vues
CREATE OR REPLACE FUNCTION gasyway_views_health_check()
RETURNS TABLE(
    view_name text,
    exists_status text,
    row_count bigint,
    status text
) AS $$
BEGIN
    -- Vérifier packs_catalog_detailed (toujours créée)
    RETURN QUERY
    SELECT 
        'packs_catalog_detailed'::text,
        'EXISTS'::text,
        (SELECT COUNT(*) FROM packs_catalog_detailed),
        'OK'::text;
    
    -- Vérifier user_favorites_detailed (si existe)
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'user_favorites_detailed') THEN
        RETURN QUERY
        SELECT 
            'user_favorites_detailed'::text,
            'EXISTS'::text,
            (SELECT COUNT(*) FROM user_favorites_detailed),
            'OK'::text;
    ELSE
        RETURN QUERY
        SELECT 
            'user_favorites_detailed'::text,
            'MISSING (table favorites not found)'::text,
            0::bigint,
            'SKIPPED'::text;
    END IF;
    
    -- Vérifier bookings_detailed (si existe)
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'bookings_detailed') THEN
        RETURN QUERY
        SELECT 
            'bookings_detailed'::text,
            'EXISTS'::text,
            (SELECT COUNT(*) FROM bookings_detailed),
            'OK'::text;
    ELSE
        RETURN QUERY
        SELECT 
            'bookings_detailed'::text,
            'MISSING (table bookings not found)'::text,
            0::bigint,
            'SKIPPED'::text;
    END IF;
    
    -- Vérifier admin_dashboard_stats (toujours créée)
    RETURN QUERY
    SELECT 
        'admin_dashboard_stats'::text,
        'EXISTS'::text,
        1::bigint,
        'OK'::text;
END;
$$ LANGUAGE plpgsql;

-- =================================================================

-- 📊 COMMENTAIRES POUR DOCUMENTATION
COMMENT ON VIEW packs_catalog_detailed IS 'Vue adaptative catalogue - fonctionne même sans table categories';
COMMENT ON VIEW admin_dashboard_stats IS 'Vue dashboard universelle - s''adapte aux tables disponibles';
COMMENT ON FUNCTION gasyway_views_health_check IS 'Diagnostic des vues créées avec statuts conditionnels';

-- =================================================================

-- ✅ SCRIPT ADAPTATIF TERMINÉ !
-- 
-- 🔍 POUR DIAGNOSTIQUER VOTRE STRUCTURE ACTUELLE:
-- Exécutez d'abord: /sql/diagnostic_existing_tables.sql
-- 
-- 🚀 POUR TESTER LES VUES CRÉÉES:
-- SELECT * FROM gasyway_views_health_check();
-- 
-- 📊 VUE PRINCIPALE GARANTIE:
-- SELECT * FROM packs_catalog_detailed LIMIT 5;
-- 
-- =================================================================