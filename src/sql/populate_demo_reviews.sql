-- =============================================
-- SCRIPT DE PEUPLEMENT : AVIS DEMO RÉALISTES
-- Génère des avis réalistes pour tester la fonctionnalité
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
        'Aventure de rêve',
        'Culture authentique',
        'Accueil chaleureux',
        'Dépassé mes attentes',
        'Recommande vivement',
        'Bien mais perfectible',
        'Correct dans l''ensemble',
        'Quelques améliorations possibles',
        'Moyen, peut mieux faire',
        'Décevant par rapport au prix',
        'Pas à la hauteur'
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
    existing_reviews_count INTEGER;
BEGIN
    RAISE NOTICE '🎯 GÉNÉRATION D''AVIS DEMO RÉALISTES...';
    RAISE NOTICE '====================================';
    
    -- Vérifier s'il y a déjà des avis
    SELECT COUNT(*) INTO existing_reviews_count FROM reviews;
    
    IF existing_reviews_count > 0 THEN
        RAISE NOTICE '⚠️ Il y a déjà % avis dans la base', existing_reviews_count;
        RAISE NOTICE 'Voulez-vous continuer à ajouter des avis demo ? (Ce script va continuer)';
    END IF;
    
    -- Récupérer tous les IDs des utilisateurs voyageurs actifs
    SELECT ARRAY_AGG(id) INTO users_array
    FROM users
    WHERE role = 'voyageur' AND status = 'active';
    
    IF array_length(users_array, 1) IS NULL OR array_length(users_array, 1) = 0 THEN
        RAISE NOTICE '❌ Aucun utilisateur voyageur trouvé !';
        RAISE NOTICE 'Créez d''abord des utilisateurs demo avec le script approprié.';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Utilisateurs voyageurs trouvés: %', array_length(users_array, 1);
    
    -- Pour chaque pack actif
    FOR pack_record IN 
        SELECT id, title FROM packs WHERE status = 'active'
    LOOP
        -- Générer entre 3 et 8 avis par pack
        review_count := floor(random() * 6) + 3;
        
        RAISE NOTICE '📦 Pack "%": génération de % avis...', pack_record.title, review_count;
        
        FOR i IN 1..review_count LOOP
            -- Sélectionner un utilisateur aléatoire
            user_record := users_array[floor(random() * array_length(users_array, 1)) + 1];
            
            -- Vérifier qu'il n'y a pas déjà un avis de cet user pour ce pack
            IF EXISTS (
                SELECT 1 FROM reviews 
                WHERE user_id = user_record AND pack_id = pack_record.id
            ) THEN
                CONTINUE; -- Passer à l'itération suivante
            END IF;
            
            -- Générer une note réaliste (distribution weighted vers les bonnes notes)
            CASE 
                WHEN random() < 0.40 THEN rating_value := 5  -- 40% de 5 étoiles
                WHEN random() < 0.70 THEN rating_value := 4  -- 30% de 4 étoiles  
                WHEN random() < 0.85 THEN rating_value := 3  -- 15% de 3 étoiles
                WHEN random() < 0.95 THEN rating_value := 2  -- 10% de 2 étoiles
                ELSE rating_value := 1                       -- 5% de 1 étoile
            END CASE;
            
            -- Titre et commentaire selon la note
            IF rating_value >= 4 THEN
                random_title := review_titles[floor(random() * 14) + 1]; -- Titres positifs
                random_comment := review_comments[floor(random() * 10) + 1]; -- Commentaires positifs
            ELSIF rating_value = 3 THEN
                random_title := review_titles[floor(random() * 3) + 15]; -- Titres neutres
                random_comment := review_comments[floor(random() * 5) + 11]; -- Commentaires neutres
            ELSE
                random_title := review_titles[floor(random() * 3) + 18]; -- Titres négatifs
                random_comment := review_comments[floor(random() * 4) + 16]; -- Commentaires négatifs
            END IF;
            
            -- Date aléatoire dans les 6 derniers mois
            random_date := now() - (random() * interval '180 days');
            
            -- Insérer l'avis
            INSERT INTO reviews (
                user_id,
                pack_id, 
                rating,
                title,
                comment,
                status,
                created_at,
                updated_at
            ) VALUES (
                user_record,
                pack_record.id,
                rating_value,
                random_title,
                random_comment,
                'approved',
                random_date,
                random_date
            );
            
        END LOOP;
        
    END LOOP;
    
    RAISE NOTICE '✅ Génération des avis terminée !';
    
END $$;

-- =============================================
-- STATISTIQUES FINALES
-- =============================================

DO $$
DECLARE
    total_reviews INTEGER;
    total_packs INTEGER;
    avg_rating NUMERIC;
    rating_distribution RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📊 STATISTIQUES FINALES DES AVIS';
    RAISE NOTICE '================================';
    
    -- Statistiques globales
    SELECT COUNT(*) INTO total_reviews FROM reviews WHERE status = 'approved';
    SELECT COUNT(*) INTO total_packs FROM packs WHERE status = 'active';
    SELECT ROUND(AVG(rating::numeric), 2) INTO avg_rating FROM reviews WHERE status = 'approved';
    
    RAISE NOTICE '✅ Total avis approuvés: %', total_reviews;
    RAISE NOTICE '✅ Total packs actifs: %', total_packs;
    RAISE NOTICE '✅ Moyenne globale: %/5', avg_rating;
    RAISE NOTICE '';
    
    -- Distribution des notes
    RAISE NOTICE '⭐ DISTRIBUTION DES NOTES:';
    FOR rating_distribution IN
        SELECT 
            rating,
            COUNT(*) as count,
            ROUND((COUNT(*) * 100.0 / total_reviews), 1) as percentage
        FROM reviews 
        WHERE status = 'approved'
        GROUP BY rating 
        ORDER BY rating DESC
    LOOP
        RAISE NOTICE '   % étoiles: % avis (% %%)', 
            rating_distribution.rating,
            rating_distribution.count,
            rating_distribution.percentage;
    END LOOP;
    
    RAISE NOTICE '';
    
END $$;

-- =============================================
-- APERÇU DES PACKS AVEC LEURS MOYENNES
-- =============================================

SELECT 
    p.title as "Pack",
    COUNT(r.id) as "Nb Avis",
    ROUND(AVG(r.rating::numeric), 1) as "Moyenne",
    COUNT(CASE WHEN r.rating = 5 THEN 1 END) as "5⭐",
    COUNT(CASE WHEN r.rating = 4 THEN 1 END) as "4⭐",
    COUNT(CASE WHEN r.rating = 3 THEN 1 END) as "3⭐",
    COUNT(CASE WHEN r.rating = 2 THEN 1 END) as "2⭐",
    COUNT(CASE WHEN r.rating = 1 THEN 1 END) as "1⭐"
FROM packs p
LEFT JOIN reviews r ON p.id = r.pack_id AND r.status = 'approved'
WHERE p.status = 'active'
GROUP BY p.id, p.title
HAVING COUNT(r.id) > 0
ORDER BY AVG(r.rating::numeric) DESC, COUNT(r.id) DESC;

-- =============================================
-- MESSAGE FINAL
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 AVIS DEMO GÉNÉRÉS AVEC SUCCÈS !';
    RAISE NOTICE '';
    RAISE NOTICE '📝 PROCHAINES ÉTAPES :';
    RAISE NOTICE '   1. Testez la création d''avis depuis l''interface';
    RAISE NOTICE '   2. Vérifiez l''affichage des moyennes dans PackCard';
    RAISE NOTICE '   3. Consultez les avis détaillés dans PackDetail';
    RAISE NOTICE '   4. Testez la page "Mes Avis" pour les utilisateurs';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 VOTRE SYSTÈME D''AVIS EST OPÉRATIONNEL !';
    RAISE NOTICE '';
END $$;