-- =============================================
-- SCRIPT SQL : REMPLISSAGE TABLE REVIEWS AVEC DONNÉES RÉALISTES
-- =============================================
-- Ce script remplit la table reviews avec des avis réalistes
-- pour tester le système de calcul des moyennes d'avis

-- =============================================
-- 1. NETTOYAGE (OPTIONNEL - DÉCOMMENTEZ SI NÉCESSAIRE)
-- =============================================
-- DELETE FROM reviews WHERE created_at >= '2024-01-01';

-- =============================================
-- 2. INSERTION D'AVIS POUR LES PACKS EXISTANTS
-- =============================================

-- Fonction pour générer des avis réalistes
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
        'Recommande vivement'
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
        'Voyage agréable qui correspond à la description. Quelques petits désagréments météo mais c''est la nature !'
    ];
    random_title TEXT;
    random_comment TEXT;
    random_date TIMESTAMP;
BEGIN
    -- Pour chaque pack actif
    FOR pack_record IN 
        SELECT id, title FROM packs WHERE status = 'active'
    LOOP
        -- Générer entre 3 et 15 avis par pack
        review_count := floor(random() * 13) + 3;
        
        FOR i IN 1..review_count LOOP
            -- Sélectionner un utilisateur aléatoire (éviter les admins)
            SELECT id INTO user_record 
            FROM users 
            WHERE EXISTS (
                SELECT 1 FROM profiles p 
                WHERE p.user_id = users.id 
                AND p.role = 'voyageur'
            )
            ORDER BY random() 
            LIMIT 1;
            
            -- Si pas d'utilisateur trouvé, on passe au suivant
            IF user_record IS NULL THEN
                CONTINUE;
            END IF;
            
            -- Générer une note réaliste (plus de bonnes notes que de mauvaises)
            CASE 
                WHEN random() < 0.4 THEN rating_value := 5  -- 40% de 5 étoiles
                WHEN random() < 0.7 THEN rating_value := 4  -- 30% de 4 étoiles  
                WHEN random() < 0.85 THEN rating_value := 3 -- 15% de 3 étoiles
                WHEN random() < 0.95 THEN rating_value := 2 -- 10% de 2 étoiles
                ELSE rating_value := 1                      -- 5% de 1 étoile
            END CASE;
            
            -- Titre et commentaire selon la note
            IF rating_value >= 4 THEN
                random_title := review_titles[floor(random() * 10) + 1]; -- Premiers titres positifs
                random_comment := review_comments[floor(random() * 10) + 1]; -- Premiers commentaires positifs
            ELSE
                random_title := review_titles[floor(random() * 5) + 11]; -- Derniers titres neutres
                random_comment := review_comments[floor(random() * 5) + 11]; -- Derniers commentaires neutres
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
                'approved', -- Tous les avis sont approuvés pour les tests
                random_date,
                random_date
            );
            
        END LOOP;
        
        RAISE NOTICE 'Pack "%" : % avis générés', pack_record.title, review_count;
    END LOOP;
    
    RAISE NOTICE 'Génération des avis terminée !';
END $$;

-- =============================================
-- 3. VÉRIFICATION DES DONNÉES GÉNÉRÉES
-- =============================================

-- Compter les avis par pack avec moyennes
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

-- Statistiques globales
SELECT 
    'STATISTIQUES GLOBALES' as type,
    COUNT(*) as total_avis,
    ROUND(AVG(rating::numeric), 2) as moyenne_globale,
    MIN(created_at) as premier_avis,
    MAX(created_at) as dernier_avis
FROM reviews 
WHERE status = 'approved';

-- =============================================
-- 4. CRÉATION D'UNE VUE POUR LES STATISTIQUES PACK
-- =============================================

CREATE OR REPLACE VIEW pack_reviews_stats AS
SELECT 
    p.id as pack_id,
    p.title,
    COUNT(r.id) as total_reviews,
    ROUND(AVG(r.rating::numeric), 1) as average_rating,
    COUNT(CASE WHEN r.rating = 5 THEN 1 END) as five_stars,
    COUNT(CASE WHEN r.rating = 4 THEN 1 END) as four_stars,
    COUNT(CASE WHEN r.rating = 3 THEN 1 END) as three_stars,
    COUNT(CASE WHEN r.rating = 2 THEN 1 END) as two_stars,
    COUNT(CASE WHEN r.rating = 1 THEN 1 END) as one_star
FROM packs p
LEFT JOIN reviews r ON p.id = r.pack_id AND r.status = 'approved'
WHERE p.status = 'active'
GROUP BY p.id, p.title;

-- Tester la vue
SELECT * FROM pack_reviews_stats ORDER BY average_rating DESC;

COMMENT ON VIEW pack_reviews_stats IS 'Vue des statistiques d''avis par pack pour l''application GasyWay';

-- =============================================
-- 5. MESSAGE FINAL
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 GÉNÉRATION DES AVIS TERMINÉE !';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Données générées :';
    RAISE NOTICE '   • Avis réalistes avec notes de 1 à 5 étoiles';
    RAISE NOTICE '   • Distribution réaliste (plus de bonnes notes)';
    RAISE NOTICE '   • Titres et commentaires variés';
    RAISE NOTICE '   • Dates sur les 6 derniers mois';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Vue créée : pack_reviews_stats';
    RAISE NOTICE '   • Statistiques détaillées par pack';
    RAISE NOTICE '   • Moyennes et répartitions';
    RAISE NOTICE '';
    RAISE NOTICE '🔥 Votre application affiche maintenant de VRAIES moyennes d''avis !';
    RAISE NOTICE '';
END $$;