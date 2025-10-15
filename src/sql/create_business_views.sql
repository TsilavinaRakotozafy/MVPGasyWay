-- =================================================================
-- VUES MÉTIER POUR GASYWAY - OPTIMISATION DES REQUÊTES COMPLEXES
-- =================================================================

-- 1. Vue Dashboard Admin - Statistiques temps réel
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
    -- Utilisateurs
    (SELECT COUNT(*) FROM users WHERE role = 'traveler' AND status = 'active') as active_travelers,
    (SELECT COUNT(*) FROM users WHERE role = 'admin') as admin_count,
    (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_month,
    
    -- Packs
    (SELECT COUNT(*) FROM packs WHERE status = 'active') as active_packs,
    (SELECT COUNT(*) FROM packs WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_packs_week,
    
    -- Réservations
    (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed') as confirmed_bookings,
    (SELECT COUNT(*) FROM bookings WHERE created_at >= CURRENT_DATE) as bookings_today,
    (SELECT COUNT(*) FROM bookings WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as bookings_month,
    
    -- Revenus
    (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed') as total_revenue,
    (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '30 days') as revenue_month,
    
    -- Avis
    (SELECT COUNT(*) FROM reviews) as total_reviews,
    (SELECT ROUND(AVG(rating), 2) FROM reviews) as average_rating,
    
    -- Notifications
    (SELECT COUNT(*) FROM notifications WHERE is_read = false) as unread_notifications;

-- 2. Vue Packs détaillés pour catalogue optimisé
CREATE OR REPLACE VIEW packs_catalog_detailed AS
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
    p.difficulty_level,
    p.season_start,
    p.season_end,
    p.created_at,
    
    -- Catégorie
    c.name as category_name,
    c.icon as category_icon,
    
    -- Statistiques
    COUNT(DISTINCT b.id) as booking_count,
    COUNT(DISTINCT r.id) as review_count,
    ROUND(AVG(r.rating), 2) as average_rating,
    COUNT(DISTINCT f.id) as favorite_count,
    
    -- Services (agrégés)
    COUNT(DISTINCT ps.id) as services_count,
    array_agg(DISTINCT 
        CASE WHEN ps.is_included THEN s.name END
    ) FILTER (WHERE ps.is_included = true) as included_services,
    array_agg(DISTINCT 
        CASE WHEN ps.is_included = false THEN s.name END  
    ) FILTER (WHERE ps.is_included = false) as excluded_services,
    
    -- Itinéraire
    COUNT(DISTINCT pi.id) as itinerary_days_count,
    
    -- Disponibilité (peut être enrichi selon votre logique)
    CASE 
        WHEN p.status = 'active' AND p.max_participants > COUNT(DISTINCT b.id) 
        THEN true ELSE false 
    END as is_available

FROM packs p
LEFT JOIN pack_categories c ON p.category_id = c.id
LEFT JOIN bookings b ON p.id = b.pack_id AND b.status IN ('confirmed', 'pending')
LEFT JOIN reviews r ON p.id = r.pack_id
LEFT JOIN favorites f ON p.id = f.pack_id
LEFT JOIN pack_services ps ON p.id = ps.pack_id
LEFT JOIN services s ON ps.service_id = s.id
LEFT JOIN pack_itinerary pi ON p.id = pi.pack_id
GROUP BY p.id, p.title, p.description, p.short_description, p.price, p.currency, 
         p.duration_days, p.max_participants, p.min_participants, p.location, 
         p.status, p.images, p.difficulty_level, p.season_start, p.season_end, 
         p.created_at, c.name, c.icon;

-- 3. Vue Utilisateurs enrichis (pour admin)
CREATE OR REPLACE VIEW users_detailed AS
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    u.status,
    u.first_login_completed,
    u.created_at,
    u.updated_at,
    
    -- Statistiques d'activité
    COUNT(DISTINCT b.id) as total_bookings,
    COUNT(DISTINCT f.id) as total_favorites,
    COUNT(DISTINCT r.id) as total_reviews,
    ROUND(AVG(r.rating), 2) as average_rating_given,
    
    -- Dernière activité
    GREATEST(
        COALESCE(MAX(b.created_at), '1900-01-01'::timestamp),
        COALESCE(MAX(f.created_at), '1900-01-01'::timestamp),
        COALESCE(MAX(r.created_at), '1900-01-01'::timestamp)
    ) as last_activity,
    
    -- Valeur client
    COALESCE(SUM(p.amount), 0) as total_spent

FROM users u
LEFT JOIN bookings b ON u.id = b.user_id
LEFT JOIN favorites f ON u.id = f.user_id
LEFT JOIN reviews r ON u.id = r.user_id
LEFT JOIN payments p ON b.id = p.booking_id AND p.status = 'completed'
WHERE u.role = 'traveler'
GROUP BY u.id, u.email, u.first_name, u.last_name, u.role, u.status, 
         u.first_login_completed, u.created_at, u.updated_at;

-- 4. Vue Réservations complètes
CREATE OR REPLACE VIEW bookings_detailed AS
SELECT 
    b.id,
    b.pack_id,
    b.user_id,
    b.start_date,
    b.end_date,
    b.participants_count,
    b.total_amount,
    b.status as booking_status,
    b.special_requests,
    b.created_at,
    b.updated_at,
    
    -- Informations pack
    p.title as pack_title,
    p.duration_days,
    p.location as pack_location,
    p.difficulty_level,
    
    -- Informations utilisateur
    u.first_name,
    u.last_name,
    u.email,
    
    -- Informations paiement
    pay.status as payment_status,
    pay.payment_method,
    pay.payment_date,
    
    -- Calculs
    EXTRACT(DAYS FROM (b.start_date - CURRENT_DATE)) as days_until_trip,
    b.start_date < CURRENT_DATE as is_past_trip

FROM bookings b
JOIN packs p ON b.pack_id = p.id
JOIN users u ON b.user_id = u.id
LEFT JOIN payments pay ON b.id = pay.booking_id;

-- 5. Vue Analytics Revenue par période
CREATE OR REPLACE VIEW revenue_analytics AS
SELECT 
    DATE_TRUNC('month', p.payment_date) as month,
    COUNT(*) as payment_count,
    SUM(p.amount) as total_revenue,
    AVG(p.amount) as average_amount,
    COUNT(DISTINCT b.user_id) as unique_customers,
    COUNT(DISTINCT b.pack_id) as unique_packs_sold,
    
    -- Répartition par méthode
    COUNT(*) FILTER (WHERE p.payment_method = 'card') as card_payments,
    COUNT(*) FILTER (WHERE p.payment_method = 'mobile_money') as mobile_payments,
    COUNT(*) FILTER (WHERE p.payment_method = 'bank_transfer') as transfer_payments

FROM payments p
JOIN bookings b ON p.booking_id = b.id
WHERE p.status = 'completed'
  AND p.payment_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', p.payment_date)
ORDER BY month DESC;

-- 6. Vue Performance des packs
CREATE OR REPLACE VIEW packs_performance AS
SELECT 
    p.id,
    p.title,
    p.price,
    p.created_at,
    
    -- Métriques de performance
    COUNT(DISTINCT b.id) as total_bookings,
    COUNT(DISTINCT f.id) as total_favorites,
    COUNT(DISTINCT r.id) as total_reviews,
    ROUND(AVG(r.rating), 2) as average_rating,
    
    -- Revenus
    COALESCE(SUM(pay.amount), 0) as total_revenue,
    
    -- Ratios de conversion
    ROUND(
        COUNT(DISTINCT b.id)::numeric / NULLIF(COUNT(DISTINCT f.id), 0) * 100, 2
    ) as favorite_to_booking_ratio,
    
    -- Tendance (derniers 30 jours vs précédents)
    COUNT(DISTINCT b.id) FILTER (
        WHERE b.created_at >= CURRENT_DATE - INTERVAL '30 days'
    ) as bookings_last_30d,
    
    COUNT(DISTINCT b.id) FILTER (
        WHERE b.created_at >= CURRENT_DATE - INTERVAL '60 days' 
        AND b.created_at < CURRENT_DATE - INTERVAL '30 days'
    ) as bookings_previous_30d

FROM packs p
LEFT JOIN bookings b ON p.id = b.pack_id
LEFT JOIN favorites f ON p.id = f.pack_id  
LEFT JOIN reviews r ON p.id = r.pack_id
LEFT JOIN payments pay ON b.id = pay.booking_id AND pay.status = 'completed'
GROUP BY p.id, p.title, p.price, p.created_at;

-- 7. RLS pour les vues (lecture publique ou admin selon contexte)
ALTER VIEW admin_dashboard_stats OWNER TO postgres;
ALTER VIEW packs_catalog_detailed OWNER TO postgres;
ALTER VIEW users_detailed OWNER TO postgres;
ALTER VIEW bookings_detailed OWNER TO postgres;
ALTER VIEW revenue_analytics OWNER TO postgres;
ALTER VIEW packs_performance OWNER TO postgres;

-- 8. Index pour optimiser les vues (sur tables sous-jacentes)
CREATE INDEX IF NOT EXISTS idx_bookings_status_date ON bookings(status, created_at);
CREATE INDEX IF NOT EXISTS idx_payments_status_date ON payments(status, payment_date);
CREATE INDEX IF NOT EXISTS idx_reviews_pack_rating ON reviews(pack_id, rating);
CREATE INDEX IF NOT EXISTS idx_favorites_pack_user ON favorites(pack_id, user_id);
CREATE INDEX IF NOT EXISTS idx_pack_services_pack_included ON pack_services(pack_id, is_included);

-- 9. Commentaires pour documentation
COMMENT ON VIEW admin_dashboard_stats IS 'Statistiques en temps réel pour le dashboard admin';
COMMENT ON VIEW packs_catalog_detailed IS 'Vue optimisée pour affichage catalogue avec toutes les métriques';
COMMENT ON VIEW users_detailed IS 'Profils utilisateurs enrichis avec statistiques d''activité';
COMMENT ON VIEW bookings_detailed IS 'Réservations avec toutes les informations liées';
COMMENT ON VIEW revenue_analytics IS 'Analyse des revenus par période et méthode de paiement';
COMMENT ON VIEW packs_performance IS 'Métriques de performance et tendances des packs';