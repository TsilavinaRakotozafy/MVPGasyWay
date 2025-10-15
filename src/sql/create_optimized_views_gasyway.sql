-- =================================================================
-- VUES SQL OPTIMISÉES POUR GASYWAY
-- Tables parfaites pour les vues : jointures complexes répétées
-- =================================================================

-- 🎯 VUE 1: CATALOGUE PACKS COMPLET (★★★ PRIORITÉ MAXIMALE)
-- Utilisée par: PackCatalog, HomePage, PackDetail, recherche
-- Performance: 5+ tables jointures à chaque affichage
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
    
    -- Catégorie enrichie
    c.id as category_id,
    c.name as category_name,
    c.description as category_description,
    c.icon as category_icon,
    
    -- Partner enrichi
    pt.id as partner_id,
    pt.name as partner_name,
    pt.logo_url as partner_logo,
    pt.rating as partner_rating,
    
    -- Statistiques calculées
    COALESCE(stats.total_bookings, 0) as total_bookings,
    COALESCE(stats.avg_rating, 0) as avg_rating,
    COALESCE(stats.total_reviews, 0) as total_reviews,
    COALESCE(stats.revenue_total, 0) as revenue_total,
    
    -- Disponibilité
    CASE 
        WHEN p.status = 'active' AND 
             (p.season_start IS NULL OR DATE(p.season_start) <= CURRENT_DATE) AND
             (p.season_end IS NULL OR DATE(p.season_end) >= CURRENT_DATE)
        THEN true 
        ELSE false 
    END as is_available,
    
    -- Services formatés (pour affichage direct)
    array_to_string(p.included_services, ', ') as services_text

FROM packs p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN partners pt ON p.partner_id = pt.id
LEFT JOIN (
    SELECT 
        pack_id,
        COUNT(id) as total_bookings,
        SUM(total_amount) as revenue_total
    FROM bookings 
    WHERE status IN ('confirmed', 'completed')
    GROUP BY pack_id
) stats ON p.id = stats.pack_id
LEFT JOIN (
    SELECT 
        pack_id,
        AVG(rating) as avg_rating,
        COUNT(id) as total_reviews
    FROM reviews 
    WHERE status = 'approved'
    GROUP BY pack_id
) reviews_stats ON p.id = reviews_stats.pack_id;

-- Index pour performance catalogue
CREATE INDEX idx_packs_catalog_detailed_category ON packs_catalog_detailed(category_id);
CREATE INDEX idx_packs_catalog_detailed_price ON packs_catalog_detailed(price);
CREATE INDEX idx_packs_catalog_detailed_available ON packs_catalog_detailed(is_available);

-- =================================================================

-- 🎯 VUE 2: FAVORIS UTILISATEUR (★★★ PRIORITÉ MAXIMALE)
-- Utilisée par: FavoritesPageSupabase, toggle favoris
-- Performance: Jointure users + favorites + packs à chaque chargement
CREATE VIEW user_favorites_detailed AS
SELECT 
    f.id as favorite_id,
    f.user_id,
    f.pack_id,
    f.created_at as favorited_at,
    
    -- Pack complet (réutilise la vue précédente conceptuellement)
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
    
    -- Catégorie
    c.name as category_name,
    c.icon as category_icon,
    
    -- Statistics
    COALESCE(stats.avg_rating, 0) as avg_rating,
    COALESCE(stats.total_reviews, 0) as total_reviews,
    
    -- Disponibilité
    CASE 
        WHEN p.status = 'active' AND 
             (p.season_start IS NULL OR DATE(p.season_start) <= CURRENT_DATE) AND
             (p.season_end IS NULL OR DATE(p.season_end) >= CURRENT_DATE)
        THEN true 
        ELSE false 
    END as is_available,
    
    -- User info
    u.first_name,
    u.last_name,
    u.email

FROM favorites f
JOIN users u ON f.user_id = u.id
JOIN packs p ON f.pack_id = p.id
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN (
    SELECT 
        pack_id,
        AVG(rating) as avg_rating,
        COUNT(id) as total_reviews
    FROM reviews 
    WHERE status = 'approved'
    GROUP BY pack_id
) stats ON p.id = stats.pack_id
WHERE u.status = 'active' AND p.status = 'active';

-- Index pour favoris
CREATE INDEX idx_user_favorites_detailed_user ON user_favorites_detailed(user_id);
CREATE INDEX idx_user_favorites_detailed_pack ON user_favorites_detailed(pack_id);

-- =================================================================

-- 🎯 VUE 3: RÉSERVATIONS DÉTAILLÉES (★★★ PRIORITÉ MAXIMALE)
-- Utilisée par: BookingsPageSupabase, BookingsManagement admin
-- Performance: 4+ tables jointures constantes
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
    p.price as pack_price,
    p.duration_days,
    p.location,
    p.images as pack_images,
    p.difficulty_level,
    p.cancellation_policy,
    
    -- Catégorie
    c.name as category_name,
    c.icon as category_icon,
    
    -- Partner
    pt.name as partner_name,
    pt.contact_email as partner_email,
    pt.contact_phone as partner_phone,
    
    -- Calculs utiles
    (b.travel_date - CURRENT_DATE) as days_until_travel,
    CASE 
        WHEN b.travel_date < CURRENT_DATE THEN 'past'
        WHEN b.travel_date = CURRENT_DATE THEN 'today'
        WHEN b.travel_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'upcoming'
        ELSE 'future'
    END as travel_timing,
    
    -- Statut d'annulation possible
    CASE 
        WHEN b.status IN ('cancelled', 'completed') THEN false
        WHEN b.travel_date <= CURRENT_DATE + INTERVAL '48 hours' THEN false
        ELSE true
    END as can_cancel

FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN packs p ON b.pack_id = p.id
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN partners pt ON p.partner_id = pt.id;

-- Index pour réservations
CREATE INDEX idx_bookings_detailed_user ON bookings_detailed(user_id);
CREATE INDEX idx_bookings_detailed_status ON bookings_detailed(status);
CREATE INDEX idx_bookings_detailed_travel_date ON bookings_detailed(travel_date);

-- =================================================================

-- 🎯 VUE 4: AVIS DÉTAILLÉS (★★ PRIORITÉ ÉLEVÉE)
-- Utilisée par: ReviewsPageSupabase, ReviewsManagement, PackDetail
-- Performance: 3+ tables à chaque affichage d'avis
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
    
    -- Utilisateur
    u.first_name,
    u.last_name,
    CONCAT(u.first_name, ' ', COALESCE(LEFT(u.last_name, 1), '')) as user_display_name,
    
    -- Pack
    p.title as pack_title,
    p.images as pack_images,
    p.location as pack_location,
    
    -- Catégorie
    c.name as category_name,
    
    -- Réservation associée
    b.travel_date,
    b.number_of_participants,
    
    -- Calculs
    (r.created_at - b.travel_date) as days_after_travel,
    CASE 
        WHEN r.rating >= 4.5 THEN 'excellent'
        WHEN r.rating >= 3.5 THEN 'good'
        WHEN r.rating >= 2.5 THEN 'average'
        ELSE 'poor'
    END as rating_category

FROM reviews r
JOIN users u ON r.user_id = u.id
JOIN packs p ON r.pack_id = p.id
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN bookings b ON r.booking_id = b.id;

-- Index pour avis
CREATE INDEX idx_reviews_detailed_pack ON reviews_detailed(pack_id);
CREATE INDEX idx_reviews_detailed_user ON reviews_detailed(user_id);
CREATE INDEX idx_reviews_detailed_status ON reviews_detailed(status);

-- =================================================================

-- 🎯 VUE 5: DASHBOARD ADMIN (★★★ PRIORITÉ MAXIMALE)
-- Utilisée par: Dashboard admin, statistiques
-- Performance: Agrégations complexes multi-tables
CREATE VIEW admin_dashboard_stats AS
SELECT 
    -- Statistiques globales temps réel
    (SELECT COUNT(*) FROM users WHERE status = 'active') as active_users_count,
    (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE) as new_users_today,
    (SELECT COUNT(*) FROM packs WHERE status = 'active') as active_packs_count,
    (SELECT COUNT(*) FROM bookings WHERE created_at >= CURRENT_DATE) as bookings_today,
    (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed') as confirmed_bookings,
    (SELECT COUNT(*) FROM bookings WHERE status = 'pending') as pending_bookings,
    (SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE payment_status = 'paid' AND created_at >= CURRENT_DATE) as revenue_today,
    (SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE payment_status = 'paid' AND created_at >= DATE_TRUNC('month', CURRENT_DATE)) as revenue_month,
    (SELECT COUNT(*) FROM reviews WHERE created_at >= CURRENT_DATE) as reviews_today,
    (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE status = 'approved') as avg_rating_global,
    
    -- Top performing
    (
        SELECT JSON_OBJECT_AGG(pack_title, booking_count)
        FROM (
            SELECT p.title as pack_title, COUNT(b.id) as booking_count
            FROM bookings b
            JOIN packs p ON b.pack_id = p.id
            WHERE b.created_at >= DATE_TRUNC('month', CURRENT_DATE)
            GROUP BY p.id, p.title
            ORDER BY booking_count DESC
            LIMIT 5
        ) top_packs
    ) as top_packs_month,
    
    -- Revenus par catégorie
    (
        SELECT JSON_OBJECT_AGG(category_name, revenue)
        FROM (
            SELECT c.name as category_name, COALESCE(SUM(b.total_amount), 0) as revenue
            FROM categories c
            LEFT JOIN packs p ON c.id = p.category_id
            LEFT JOIN bookings b ON p.id = b.pack_id AND b.payment_status = 'paid'
            WHERE b.created_at >= DATE_TRUNC('month', CURRENT_DATE) OR b.created_at IS NULL
            GROUP BY c.id, c.name
            ORDER BY revenue DESC
        ) cat_revenue
    ) as revenue_by_category,
    
    CURRENT_TIMESTAMP as calculated_at;

-- =================================================================

-- 🎯 VUE 6: NOTIFICATIONS UTILISATEUR (★★ PRIORITÉ ÉLEVÉE)
-- Utilisée par: NotificationsPage, compteurs non lus
-- Performance: Jointures utilisateur + contexte fréquentes
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
    u.email,
    
    -- Contexte selon le type
    CASE 
        WHEN n.type = 'booking_confirmed' AND (n.data->>'booking_id') IS NOT NULL THEN
            (SELECT JSON_BUILD_OBJECT(
                'pack_title', p.title,
                'travel_date', b.travel_date,
                'total_amount', b.total_amount
            ) FROM bookings b 
            JOIN packs p ON b.pack_id = p.id 
            WHERE b.id = (n.data->>'booking_id')::UUID)
        WHEN n.type = 'pack_reminder' AND (n.data->>'pack_id') IS NOT NULL THEN
            (SELECT JSON_BUILD_OBJECT(
                'pack_title', title,
                'pack_price', price,
                'pack_location', location
            ) FROM packs WHERE id = (n.data->>'pack_id')::UUID)
        ELSE NULL
    END as context_data,
    
    -- Formatage du temps
    CASE 
        WHEN n.created_at >= CURRENT_TIMESTAMP - INTERVAL '1 hour' THEN 'just_now'
        WHEN n.created_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours' THEN 'today'
        WHEN n.created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 'this_week'
        ELSE 'older'
    END as time_category

FROM notifications n
JOIN users u ON n.user_id = u.id
WHERE u.status = 'active'
ORDER BY n.created_at DESC;

-- Index pour notifications
CREATE INDEX idx_user_notifications_detailed_user ON user_notifications_detailed(user_id);
CREATE INDEX idx_user_notifications_detailed_read ON user_notifications_detailed(is_read);

-- =================================================================

-- 🎯 VUE 7: SERVICES PAR CATÉGORIE (★ PRIORITÉ MOYENNE)
-- Utilisée par: CreatePackSheetTabbed, gestion services
-- Performance: Évite requêtes répétées services + catégories
CREATE VIEW services_by_category AS
SELECT 
    s.id,
    s.name,
    s.description,
    s.category_id,
    s.is_active,
    s.created_at,
    
    -- Catégorie
    sc.name as category_name,
    sc.description as category_description,
    sc.sort_order as category_sort,
    
    -- Statistiques d'usage
    (
        SELECT COUNT(*)
        FROM unnest(p.included_services) as service_name
        WHERE service_name = s.name
    ) as usage_count

FROM services s
JOIN service_categories sc ON s.category_id = sc.id
WHERE s.is_active = true
ORDER BY sc.sort_order, s.name;

-- =================================================================

-- 🚫 TABLES À NE PAS METTRE EN VUE SQL:

-- ❌ CONVERSATIONS & MESSAGES
-- → Temps réel critique, Supabase Realtime nécessaire
-- → Fréquence très élevée de modifications
-- → États "lu/non lu" en temps réel

-- ❌ USERS (simple)
-- → Table simple, pas de jointures complexes répétées
-- → Modifications fréquentes (last_login, etc.)

-- ❌ PAYMENTS
-- → Données sensibles, requêtes spécifiques
-- → États transitoires fréquents

-- =================================================================

-- 🎯 COMMENTAIRES ET PERFORMANCE

COMMENT ON VIEW packs_catalog_detailed IS 'Vue optimisée pour le catalogue - jointures 5+ tables automatiques';
COMMENT ON VIEW user_favorites_detailed IS 'Vue optimisée favoris - évite 3+ jointures répétées';  
COMMENT ON VIEW bookings_detailed IS 'Vue optimisée réservations - calculs automatiques statut/délais';
COMMENT ON VIEW reviews_detailed IS 'Vue optimisée avis - agrégation utilisateur/pack/réservation';
COMMENT ON VIEW admin_dashboard_stats IS 'Vue temps réel dashboard - statistiques pré-calculées';
COMMENT ON VIEW user_notifications_detailed IS 'Vue notifications - enrichissement automatique contexte';
COMMENT ON VIEW services_by_category IS 'Vue services - organisation par catégorie + stats usage';

-- =================================================================

-- 🚀 FONCTIONS UTILITAIRES POUR LES VUES

-- Fonction pour rafraîchir les vues manuellement si besoin
CREATE OR REPLACE FUNCTION refresh_gasyway_views()
RETURNS text AS $$
BEGIN
    -- En PostgreSQL, les vues standard se mettent à jour automatiquement
    -- Cette fonction sert pour le monitoring
    RETURN 'Vues GasyWay: mise à jour automatique - ' || CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Fonction de diagnostic performance des vues
CREATE OR REPLACE FUNCTION analyze_views_performance()
RETURNS TABLE(
    view_name text,
    row_count bigint,
    avg_query_time_estimate text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'packs_catalog_detailed'::text,
        (SELECT COUNT(*) FROM packs_catalog_detailed),
        'Estimation: 50-200ms selon filtres'::text
    UNION ALL
    SELECT 
        'user_favorites_detailed'::text,
        (SELECT COUNT(*) FROM user_favorites_detailed),
        'Estimation: 10-50ms par utilisateur'::text
    UNION ALL
    SELECT 
        'bookings_detailed'::text,
        (SELECT COUNT(*) FROM bookings_detailed),
        'Estimation: 20-100ms selon filtres'::text
    UNION ALL
    SELECT 
        'admin_dashboard_stats'::text,
        1::bigint,
        'Estimation: 100-500ms (calculs complexes)'::text;
END;
$$ LANGUAGE plpgsql;