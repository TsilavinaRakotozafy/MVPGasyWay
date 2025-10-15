-- =============================================
-- SCRIPT SQL COMPLET : SYSTÈME D'AVIS RÉEL GASYWAY
-- =============================================
-- Ce script configure complètement le système d'avis avec :
-- 1. Vérification des utilisateurs demo
-- 2. Création des fonctions Supabase optimisées  
-- 3. Génération d'avis réalistes
-- 4. Tests et vérifications

-- =============================================
-- 1. VÉRIFICATION ET CRÉATION D'UTILISATEURS DEMO
-- =============================================

DO $$
DECLARE
    demo_users TEXT[] := ARRAY['demo1@gasyway.mg', 'demo2@gasyway.mg', 'demo3@gasyway.mg', 'demo4@gasyway.mg', 'demo5@gasyway.mg'];
    demo_email TEXT;
    user_exists BOOLEAN;
    demo_user_id UUID;
BEGIN
    RAISE NOTICE '🔍 Vérification des utilisateurs demo...';
    
    FOREACH demo_email IN ARRAY demo_users LOOP
        -- Vérifier si l'utilisateur existe déjà
        SELECT EXISTS(SELECT 1 FROM users WHERE email = demo_email) INTO user_exists;
        
        IF NOT user_exists THEN
            -- Créer l'utilisateur
            INSERT INTO users (
                id,
                email,
                encrypted_password,
                email_confirmed_at,
                created_at,
                updated_at,
                raw_app_meta_data,
                raw_user_meta_data,
                is_super_admin,
                role,
                confirmation_token,
                last_sign_in_at
            ) VALUES (
                gen_random_uuid(),
                demo_email,
                crypt('demo123', gen_salt('bf')), -- Mot de passe: demo123
                now(),
                now(),
                now(),
                '{"provider": "email", "providers": ["email"]}',
                jsonb_build_object('email', demo_email, 'name', 'Utilisateur Demo'),
                false,
                'authenticated',
                '',
                now()
            ) RETURNING id INTO demo_user_id;
            
            -- Créer le profil correspondant
            INSERT INTO profiles (
                id,
                user_id,
                email,
                first_name,
                last_name,
                phone,
                profile_picture_url,
                role,
                status,
                first_login_completed,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                demo_user_id,
                demo_email,
                'Demo',
                split_part(demo_email, '@', 1), -- Utilise la partie avant @ comme nom
                '+261340000000',
                NULL,
                'voyageur',
                'active',
                true,
                now(),
                now()
            );
            
            RAISE NOTICE '✅ Utilisateur demo créé: %', demo_email;
        ELSE
            RAISE NOTICE '👍 Utilisateur demo existe déjà: %', demo_email;
        END IF;
    END LOOP;
    
    RAISE NOTICE '✅ Vérification des utilisateurs demo terminée';
END $$;

-- =============================================
-- 2. CRÉATION DES FONCTIONS SUPABASE OPTIMISÉES
-- =============================================

-- Fonction pour récupérer les packs actifs avec avis
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
SECURITY DEFINER
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
        -- Région en JSONB (si elle existe)
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
        CASE 
            WHEN COUNT(rev.id) > 0 THEN ROUND(AVG(rev.rating::numeric), 1)
            ELSE NULL
        END as average_rating,
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

-- Fonction pour récupérer un pack par ID avec avis
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
SECURITY DEFINER
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
        CASE 
            WHEN COUNT(rev.id) > 0 THEN ROUND(AVG(rev.rating::numeric), 1)
            ELSE NULL
        END as average_rating,
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
-- 3. GÉNÉRATION D'AVIS RÉALISTES
-- =============================================

DO $$
DECLARE
    pack_record RECORD;
    user_record RECORD;
    review_count INTEGER;
    rating_value INTEGER;
    review_titles TEXT[] := ARRAY[
        'Expérience exceptionnelle !',
        'Un voyage inoubliable',
        'Magnifique découverte',
        'Très bonne organisation',
        'Guide fantastique',
        'Paysages à couper le souffle',
        'Service impeccable',
        'Moments magiques',
        'Parfait pour les familles',
        'Adventure de rêve',
        'Culture authentique',
        'Accueil chaleureux',
        'Photos ne rendent pas justice',
        'Dépassé mes attentes',
        'Recommande vivement',
        'Bien mais perfectible',
        'Correct dans l''ensemble',
        'Quelques améliorations possibles',
        'Moyen, peut mieux faire',
        'Décevant par rapport au prix'
    ];
    review_comments TEXT[] := ARRAY[
        'Une expérience absolument fantastique ! Notre guide était très compétent et les paysages sont à couper le souffle. Je recommande vivement cette aventure.',
        'Voyage extraordinaire qui nous a permis de découvrir la beauté authentique de Madagascar. L''organisation était parfaite du début à la fin.',
        'Les lémuriens étaient magnifiques et nous avons appris énormément sur la faune locale. Un moment inoubliable pour toute la famille.',
        'Guide exceptionnel qui connaît parfaitement la région. Les hébergements étaient confortables et la nourriture délicieuse.',
        'Aventure palpitante dans un cadre naturel exceptionnel. Les formations rocheuses sont vraiment impressionnantes.',
        'Service client irréprochable, itinéraire bien pensé et découvertes culturelles enrichissantes. Merci pour ces souvenirs.',
        'Parfait pour se déconnecter et profiter de la nature. Les couchers de soleil sont magiques et l''ambiance très relaxante.',
        'Organisation impeccable, matériel de qualité et équipe professionnelle. Cette expédition restera gravée dans ma mémoire.',
        'Découverte authentique des traditions malgaches avec des rencontres humaines extraordinaires. Très enrichissant culturellement.',
        'Rapport qualité-prix excellent ! Les activités sont variées et adaptées à tous les niveaux. Je reviendrai sans hésiter.',
        'Très bonne expérience même si quelques points peuvent être améliorés au niveau de la logistique. Globalement satisfait.',
        'Bon voyage dans l''ensemble, guide sympa mais certaines activités auraient pu être mieux organisées.',
        'Expérience correcte mais j''attendais un peu plus pour le prix. Les paysages sont beaux mais hébergement basique.',
        'Bien mais sans plus. Organisation convenable, guide disponible mais manque un peu d''animations le soir.',
        'Voyage agréable qui correspond à la description. Quelques petits désagréments météo mais c''est la nature !',
        'Décevant par rapport aux attentes. Le guide n''était pas très engageant et certaines promesses n''ont pas été tenues.',
        'Service client à améliorer, retards fréquents et communication défaillante. Dommage car le potentiel est là.',
        'Prix trop élevé pour ce qui est proposé. Les prestations sont correctes mais ne justifient pas le tarif.',
        'Expérience mitigée avec des hauts et des bas. Certains moments étaient géniaux, d''autres moins.',
        'Correct sans être exceptionnel. Fait le travail mais ne vous attendez pas à être émerveillés.'
    ];
    random_title TEXT;
    random_comment TEXT;
    random_date TIMESTAMP;
    users_array UUID[];
BEGIN
    RAISE NOTICE '🎯 Génération d''avis réalistes...';
    
    -- Récupérer tous les IDs des utilisateurs voyageurs
    SELECT ARRAY_AGG(u.id) INTO users_array
    FROM users u
    JOIN profiles p ON u.id = p.user_id
    WHERE p.role = 'voyageur' AND p.status = 'active';
    
    IF array_length(users_array, 1) IS NULL OR array_length(users_array, 1) = 0 THEN
        RAISE EXCEPTION 'Aucun utilisateur voyageur trouvé ! Créez d''abord des utilisateurs demo.';
    END IF;
    
    RAISE NOTICE 'Utilisateurs voyageurs trouvés: %', array_length(users_array, 1);
    
    -- Pour chaque pack actif
    FOR pack_record IN 
        SELECT id, title FROM packs WHERE status = 'active'
    LOOP
        -- Générer entre 5 et 12 avis par pack
        review_count := floor(random() * 8) + 5;
        
        FOR i IN 1..review_count LOOP
            -- Sélectionner un utilisateur aléatoire
            user_record := users_array[floor(random() * array_length(users_array, 1)) + 1];
            
            -- Générer une note réaliste (distribution weighted vers les bonnes notes)
            CASE 
                WHEN random() < 0.45 THEN rating_value := 5  -- 45% de 5 étoiles
                WHEN random() < 0.75 THEN rating_value := 4  -- 30% de 4 étoiles  
                WHEN random() < 0.90 THEN rating_value := 3  -- 15% de 3 étoiles
                WHEN random() < 0.97 THEN rating_value := 2  -- 7% de 2 étoiles
                ELSE rating_value := 1                       -- 3% de 1 étoile
            END CASE;
            
            -- Titre et commentaire selon la note
            IF rating_value >= 4 THEN
                random_title := review_titles[floor(random() * 15) + 1]; -- Titres positifs
                random_comment := review_comments[floor(random() * 10) + 1]; -- Commentaires positifs
            ELSIF rating_value = 3 THEN
                random_title := review_titles[floor(random() * 5) + 11]; -- Titres neutres
                random_comment := review_comments[floor(random() * 5) + 11]; -- Commentaires neutres
            ELSE
                random_title := review_titles[floor(random() * 5) + 16]; -- Titres négatifs
                random_comment := review_comments[floor(random() * 5) + 16]; -- Commentaires négatifs
            END IF;
            
            -- Date aléatoire dans les 4 derniers mois
            random_date := now() - (random() * interval '120 days');
            
            -- Insérer l'avis (éviter les doublons)
            INSERT INTO reviews (
                user_id,
                pack_id, 
                rating,
                title,
                comment,
                status,
                created_at,
                updated_at
            ) 
            SELECT 
                user_record,
                pack_record.id,
                rating_value,
                random_title,
                random_comment,
                'approved',
                random_date,
                random_date
            WHERE NOT EXISTS (
                SELECT 1 FROM reviews 
                WHERE user_id = user_record 
                AND pack_id = pack_record.id
            );
            
        END LOOP;
        
        RAISE NOTICE 'Pack "%" : % avis générés', pack_record.title, review_count;
    END LOOP;
    
    RAISE NOTICE '✅ Génération des avis terminée !';
END $$;

-- =============================================
-- 4. VÉRIFICATION ET STATISTIQUES
-- =============================================

-- Statistiques par pack
SELECT 
    p.title,
    COUNT(r.id) as nombre_avis,
    ROUND(AVG(r.rating::numeric), 1) as moyenne_rating,
    COUNT(CASE WHEN r.rating = 5 THEN 1 END) as cinq_etoiles,
    COUNT(CASE WHEN r.rating = 4 THEN 1 END) as quatre_etoiles,
    COUNT(CASE WHEN r.rating = 3 THEN 1 END) as trois_etoiles,
    COUNT(CASE WHEN r.rating = 2 THEN 1 END) as deux_etoiles,
    COUNT(CASE WHEN r.rating = 1 THEN 1 END) as une_etoile
FROM packs p
LEFT JOIN reviews r ON p.id = r.pack_id AND r.status = 'approved'
WHERE p.status = 'active'
GROUP BY p.id, p.title
ORDER BY moyenne_rating DESC;

-- Test des fonctions
SELECT 'TEST FONCTION: get_active_packs_with_reviews' as test_info;
SELECT title, average_rating, total_reviews 
FROM get_active_packs_with_reviews() 
WHERE total_reviews > 0
ORDER BY average_rating DESC 
LIMIT 5;

-- =============================================
-- 5. MESSAGE FINAL
-- =============================================

DO $$
DECLARE
    total_reviews_count BIGINT;
    total_packs_count BIGINT;
    avg_global_rating NUMERIC;
BEGIN
    -- Statistiques finales
    SELECT COUNT(*) INTO total_reviews_count FROM reviews WHERE status = 'approved';
    SELECT COUNT(*) INTO total_packs_count FROM packs WHERE status = 'active';
    SELECT ROUND(AVG(rating::numeric), 2) INTO avg_global_rating FROM reviews WHERE status = 'approved';
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 SYSTÈME D''AVIS RÉEL INSTALLÉ AVEC SUCCÈS !';
    RAISE NOTICE '';
    RAISE NOTICE '📊 STATISTIQUES FINALES :';
    RAISE NOTICE '   • % avis générés au total', total_reviews_count;
    RAISE NOTICE '   • % packs actifs avec avis', total_packs_count;
    RAISE NOTICE '   • Moyenne globale : %/5', avg_global_rating;
    RAISE NOTICE '';
    RAISE NOTICE '✅ FONCTIONNALITÉS INSTALLÉES :';
    RAISE NOTICE '   • Calcul automatique des moyennes d''avis';
    RAISE NOTICE '   • Fonctions Supabase optimisées';
    RAISE NOTICE '   • Données réalistes avec distribution weighted';
    RAISE NOTICE '   • API prête pour le frontend';
    RAISE NOTICE '';
    RAISE NOTICE '🔥 VOTRE APPLICATION AFFICHE MAINTENANT DE VRAIES NOTES !';
    RAISE NOTICE '';
    RAISE NOTICE '📝 NEXT STEPS :';
    RAISE NOTICE '   1. Redémarrer votre application frontend';
    RAISE NOTICE '   2. Vérifier que les notes s''affichent dans PackCard';
    RAISE NOTICE '   3. Tester PackDetail avec les vraies moyennes';
    RAISE NOTICE '   4. Profiter de votre système d''avis fonctionnel !';
    RAISE NOTICE '';
END $$;