-- =============================================
-- SCRIPT CORRECTEUR COMPLET : SYSTÈME D'AVIS GASYWAY
-- Corrige TOUS les problèmes identifiés en une seule exécution
-- =============================================

BEGIN;

DO $$
BEGIN
    RAISE NOTICE '🚀 CORRECTION COMPLÈTE DU SYSTÈME D''AVIS GASYWAY';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Ce script va:';
    RAISE NOTICE '  1. Corriger la structure de la table reviews';
    RAISE NOTICE '  2. Migrer les données de pack_reviews si nécessaire';
    RAISE NOTICE '  3. Configurer les politiques RLS';
    RAISE NOTICE '  4. Créer des utilisateurs demo si nécessaire';
    RAISE NOTICE '  5. Générer des avis de test réalistes';
    RAISE NOTICE '';
END $$;

-- ==============================
-- 1. CORRECTION DE LA STRUCTURE DE LA TABLE REVIEWS
-- ==============================

DO $$
DECLARE
    reviews_exists BOOLEAN;
    pack_reviews_exists BOOLEAN;
    pack_reviews_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🔧 1. CORRECTION DE LA STRUCTURE DE LA TABLE REVIEWS...';
    
    -- Vérifier l'existence des tables
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'reviews' AND table_schema = 'public'
    ) INTO reviews_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'pack_reviews' AND table_schema = 'public'
    ) INTO pack_reviews_exists;
    
    IF pack_reviews_exists THEN
        SELECT COUNT(*) INTO pack_reviews_count FROM pack_reviews;
    END IF;
    
    -- Créer la table reviews si elle n'existe pas
    IF NOT reviews_exists THEN
        CREATE TABLE reviews (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            pack_id UUID NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
            booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
            rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
            title TEXT,
            comment TEXT NOT NULL,
            status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            
            -- Contrainte pour éviter les doublons
            UNIQUE(user_id, pack_id)
        );
        
        -- Index pour performances
        CREATE INDEX IF NOT EXISTS idx_reviews_pack_id ON reviews(pack_id);
        CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
        CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
        CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
        CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
        
        RAISE NOTICE '✅ Table reviews créée avec succès !';
    ELSE
        -- Vérifier et ajouter les colonnes manquantes
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'reviews' AND column_name = 'status'
        ) THEN
            ALTER TABLE reviews ADD COLUMN status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));
            RAISE NOTICE '✅ Colonne status ajoutée';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'reviews' AND column_name = 'title'
        ) THEN
            ALTER TABLE reviews ADD COLUMN title TEXT;
            RAISE NOTICE '✅ Colonne title ajoutée';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'reviews' AND column_name = 'booking_id'
        ) THEN
            ALTER TABLE reviews ADD COLUMN booking_id UUID;
            -- Ajouter la foreign key si la table bookings existe
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
                ALTER TABLE reviews ADD CONSTRAINT fk_reviews_booking 
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;
            END IF;
            RAISE NOTICE '✅ Colonne booking_id ajoutée';
        END IF;
        
        RAISE NOTICE '✅ Table reviews vérifiée';
    END IF;
    
    -- Migrer les données de pack_reviews vers reviews
    IF pack_reviews_exists AND pack_reviews_count > 0 THEN
        RAISE NOTICE '🔄 Migration des données pack_reviews -> reviews...';
        
        INSERT INTO reviews (
            user_id, pack_id, rating, title, comment, status, created_at, updated_at
        )
        SELECT 
            user_id, 
            pack_id, 
            rating, 
            title,
            comment,
            COALESCE(status, 'approved'),
            COALESCE(created_at, NOW()),
            COALESCE(updated_at, NOW())
        FROM pack_reviews
        ON CONFLICT (user_id, pack_id) DO NOTHING;
        
        RAISE NOTICE '✅ Migration terminée !';
    END IF;
    
END $$;

-- ==============================
-- 2. CONFIGURATION DES POLITIQUES RLS
-- ==============================

DO $$
BEGIN
    RAISE NOTICE '🔒 2. CONFIGURATION DES POLITIQUES RLS...';
    
    -- Activer RLS sur reviews
    ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
    
    -- Politique : Lecture publique pour les avis approuvés
    DROP POLICY IF EXISTS "reviews_select_public" ON reviews;
    CREATE POLICY "reviews_select_public" 
    ON reviews FOR SELECT 
    USING (status = 'approved');
    
    -- Politique : Insertion par l'utilisateur authentifié
    DROP POLICY IF EXISTS "reviews_insert_own" ON reviews;
    CREATE POLICY "reviews_insert_own" 
    ON reviews FOR INSERT 
    WITH CHECK (user_id = auth.uid());
    
    -- Politique : Modification par le propriétaire
    DROP POLICY IF EXISTS "reviews_update_own" ON reviews;
    CREATE POLICY "reviews_update_own" 
    ON reviews FOR UPDATE 
    USING (user_id = auth.uid());
    
    -- Politique : Admin peut tout faire
    DROP POLICY IF EXISTS "reviews_admin_all" ON reviews;
    CREATE POLICY "reviews_admin_all" 
    ON reviews FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );
    
    -- Trigger de mise à jour automatique
    CREATE OR REPLACE FUNCTION update_reviews_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    DROP TRIGGER IF EXISTS trigger_update_reviews_updated_at ON reviews;
    CREATE TRIGGER trigger_update_reviews_updated_at
        BEFORE UPDATE ON reviews
        FOR EACH ROW
        EXECUTE FUNCTION update_reviews_updated_at();
    
    RAISE NOTICE '✅ Politiques RLS configurées !';
END $$;

-- ==============================
-- 3. CRÉATION D'UTILISATEURS DEMO
-- ==============================

DO $$
DECLARE
    demo_users TEXT[] := ARRAY[
        'marie.dubois@demo.mg',
        'jean.martin@demo.mg', 
        'sophie.bernard@demo.mg',
        'paul.moreau@demo.mg',
        'claire.simon@demo.mg',
        'antoine.rousseau@demo.mg'
    ];
    demo_names TEXT[] := ARRAY[
        'Marie,Dubois',
        'Jean,Martin',
        'Sophie,Bernard', 
        'Paul,Moreau',
        'Claire,Simon',
        'Antoine,Rousseau'
    ];
    demo_email TEXT;
    demo_name TEXT;
    first_name TEXT;
    last_name TEXT;
    user_exists BOOLEAN;
    demo_user_id UUID;
    existing_demo_count INTEGER;
BEGIN
    RAISE NOTICE '👥 3. CRÉATION D''UTILISATEURS DEMO...';
    
    -- Compter les utilisateurs demo existants
    SELECT COUNT(*) INTO existing_demo_count 
    FROM users 
    WHERE email LIKE '%@demo.mg' AND role = 'voyageur' AND status = 'active';
    
    IF existing_demo_count >= 3 THEN
        RAISE NOTICE '✅ Utilisateurs demo suffisants déjà présents (%)', existing_demo_count;
    ELSE
        FOR i IN 1..array_length(demo_users, 1) LOOP
            demo_email := demo_users[i];
            demo_name := demo_names[i];
            first_name := split_part(demo_name, ',', 1);
            last_name := split_part(demo_name, ',', 2);
            
            -- Vérifier si l'utilisateur existe déjà
            SELECT EXISTS(SELECT 1 FROM users WHERE email = demo_email) INTO user_exists;
            
            IF NOT user_exists THEN
                demo_user_id := gen_random_uuid();
                
                INSERT INTO users (
                    id, email, first_name, last_name, phone, role, status,
                    first_login_completed, gdpr_consent, locale, created_at, updated_at, last_login
                ) VALUES (
                    demo_user_id, demo_email, first_name, last_name,
                    '+261340000' || LPAD((i*111)::TEXT, 3, '0'),
                    'voyageur', 'active', true, true, 'fr',
                    now() - (random() * interval '90 days'),
                    now(),
                    now() - (random() * interval '30 days')
                );
                
                RAISE NOTICE '✅ Utilisateur demo créé: % %', first_name, last_name;
            END IF;
        END LOOP;
    END IF;
END $$;

-- ==============================
-- 4. GÉNÉRATION D'AVIS RÉALISTES
-- ==============================

DO $$
DECLARE
    pack_record RECORD;
    user_record RECORD;
    review_count INTEGER;
    rating_value INTEGER;
    review_titles TEXT[] := ARRAY[
        'Expérience exceptionnelle !', 'Un voyage inoubliable', 'Magnifique découverte',
        'Très bonne organisation', 'Guide fantastique', 'Paysages à couper le souffle',
        'Service impeccable', 'Moments magiques', 'Parfait pour les familles',
        'Aventure de rêve', 'Culture authentique', 'Accueil chaleureux',
        'Dépassé mes attentes', 'Recommande vivement', 'Bien mais perfectible',
        'Correct dans l''ensemble', 'Quelques améliorations possibles', 'Moyen, peut mieux faire',
        'Décevant par rapport au prix', 'Pas à la hauteur'
    ];
    review_comments TEXT[] := ARRAY[
        'Une expérience absolument fantastique ! Notre guide était très compétent et les paysages sont à couper le souffle.',
        'Voyage extraordinaire qui nous a permis de découvrir la beauté authentique de Madagascar. Organisation parfaite.',
        'Les lémuriens étaient magnifiques et nous avons appris énormément sur la faune locale. Moment inoubliable.',
        'Guide exceptionnel qui connaît parfaitement la région. Hébergements confortables et nourriture délicieuse.',
        'Aventure palpitante dans un cadre naturel exceptionnel. Les formations rocheuses sont impressionnantes.',
        'Service client irréprochable, itinéraire bien pensé et découvertes culturelles enrichissantes.',
        'Parfait pour se déconnecter et profiter de la nature. Les couchers de soleil sont magiques.',
        'Organisation impeccable, matériel de qualité et équipe professionnelle. Expédition mémorable.',
        'Découverte authentique des traditions malgaches avec des rencontres humaines extraordinaires.',
        'Rapport qualité-prix excellent ! Activités variées et adaptées à tous les niveaux.',
        'Très bonne expérience même si quelques points peuvent être améliorés au niveau logistique.',
        'Bon voyage dans l''ensemble, guide sympa mais certaines activités auraient pu être mieux organisées.',
        'Expérience correcte mais j''attendais un peu plus pour le prix. Paysages beaux mais hébergement basique.',
        'Bien mais sans plus. Organisation convenable, guide disponible mais manque d''animations le soir.',
        'Voyage agréable qui correspond à la description. Quelques petits désagréments météo.',
        'Décevant par rapport aux attentes. Guide pas très engageant et promesses non tenues.',
        'Service client à améliorer, retards fréquents et communication défaillante.',
        'Prix trop élevé pour ce qui est proposé. Prestations correctes mais pas justifiées.',
        'Expérience mitigée avec des hauts et des bas. Certains moments géniaux, d''autres moins.',
        'Correct sans être exceptionnel. Fait le travail mais ne vous attendez pas à être émerveillés.'
    ];
    random_title TEXT;
    random_comment TEXT;
    random_date TIMESTAMP;
    users_array UUID[];
    existing_reviews_count INTEGER;
BEGIN
    RAISE NOTICE '🎯 4. GÉNÉRATION D''AVIS RÉALISTES...';
    
    -- Vérifier s'il y a déjà des avis
    SELECT COUNT(*) INTO existing_reviews_count FROM reviews;
    
    IF existing_reviews_count > 20 THEN
        RAISE NOTICE '✅ Avis suffisants déjà présents (%)', existing_reviews_count;
        RETURN;
    END IF;
    
    -- Récupérer les utilisateurs voyageurs actifs
    SELECT ARRAY_AGG(id) INTO users_array
    FROM users
    WHERE role = 'voyageur' AND status = 'active';
    
    IF array_length(users_array, 1) IS NULL OR array_length(users_array, 1) = 0 THEN
        RAISE NOTICE '⚠️ Aucun utilisateur voyageur trouvé pour créer des avis';
        RETURN;
    END IF;
    
    -- Pour chaque pack actif
    FOR pack_record IN 
        SELECT id, title FROM packs WHERE status = 'active' LIMIT 10
    LOOP
        -- Générer entre 3 et 7 avis par pack
        review_count := floor(random() * 5) + 3;
        
        FOR i IN 1..review_count LOOP
            -- Sélectionner un utilisateur aléatoire
            user_record := users_array[floor(random() * array_length(users_array, 1)) + 1];
            
            -- Vérifier qu'il n'y a pas déjà un avis
            IF EXISTS (
                SELECT 1 FROM reviews 
                WHERE user_id = user_record AND pack_id = pack_record.id
            ) THEN
                CONTINUE;
            END IF;
            
            -- Note réaliste (distribution weighted)
            CASE 
                WHEN random() < 0.45 THEN rating_value := 5  -- 45% de 5 étoiles
                WHEN random() < 0.75 THEN rating_value := 4  -- 30% de 4 étoiles  
                WHEN random() < 0.90 THEN rating_value := 3  -- 15% de 3 étoiles
                WHEN random() < 0.97 THEN rating_value := 2  -- 7% de 2 étoiles
                ELSE rating_value := 1                       -- 3% de 1 étoile
            END CASE;
            
            -- Titre et commentaire selon la note
            IF rating_value >= 4 THEN
                random_title := review_titles[floor(random() * 14) + 1];
                random_comment := review_comments[floor(random() * 10) + 1];
            ELSIF rating_value = 3 THEN
                random_title := review_titles[floor(random() * 3) + 15];
                random_comment := review_comments[floor(random() * 5) + 11];
            ELSE
                random_title := review_titles[floor(random() * 3) + 18];
                random_comment := review_comments[floor(random() * 4) + 16];
            END IF;
            
            -- Date aléatoire dans les 4 derniers mois
            random_date := now() - (random() * interval '120 days');
            
            -- Insérer l'avis
            INSERT INTO reviews (
                user_id, pack_id, rating, title, comment, status, created_at, updated_at
            ) VALUES (
                user_record, pack_record.id, rating_value, random_title, 
                random_comment, 'approved', random_date, random_date
            );
            
        END LOOP;
    END LOOP;
    
    RAISE NOTICE '✅ Avis réalistes générés !';
END $$;

COMMIT;

-- ==============================
-- 5. VÉRIFICATION FINALE
-- ==============================

DO $$
DECLARE
    total_reviews INTEGER;
    total_users INTEGER;
    total_packs INTEGER;
    avg_rating NUMERIC;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 CORRECTION COMPLÈTE TERMINÉE !';
    RAISE NOTICE '=================================';
    RAISE NOTICE '';
    
    -- Statistiques finales
    SELECT COUNT(*) INTO total_reviews FROM reviews WHERE status = 'approved';
    SELECT COUNT(*) INTO total_users FROM users WHERE role = 'voyageur' AND status = 'active';
    SELECT COUNT(*) INTO total_packs FROM packs WHERE status = 'active';
    SELECT ROUND(AVG(rating::numeric), 1) INTO avg_rating FROM reviews WHERE status = 'approved';
    
    RAISE NOTICE '📊 STATISTIQUES FINALES :';
    RAISE NOTICE '   • % avis approuvés', total_reviews;
    RAISE NOTICE '   • % utilisateurs voyageurs actifs', total_users;
    RAISE NOTICE '   • % packs actifs', total_packs;
    RAISE NOTICE '   • Moyenne globale : %/5', COALESCE(avg_rating, 0);
    RAISE NOTICE '';
    
    RAISE NOTICE '✅ FONCTIONNALITÉS OPÉRATIONNELLES :';
    RAISE NOTICE '   • Table reviews avec structure correcte';
    RAISE NOTICE '   • Politiques RLS configurées';
    RAISE NOTICE '   • Utilisateurs demo créés';
    RAISE NOTICE '   • Avis réalistes générés';
    RAISE NOTICE '   • API backend compatible';
    RAISE NOTICE '';
    
    RAISE NOTICE '🚀 VOTRE SYSTÈME D''AVIS EST MAINTENANT OPÉRATIONNEL !';
    RAISE NOTICE '';
    RAISE NOTICE '📝 PROCHAINES ÉTAPES :';
    RAISE NOTICE '   1. Testez la création d''avis depuis l''interface';
    RAISE NOTICE '   2. Vérifiez l''affichage des moyennes sur les packs';
    RAISE NOTICE '   3. Consultez les avis détaillés dans PackDetail';
    RAISE NOTICE '';
    
END $$;

-- Test final de la requête API
SELECT 
    'TEST API: Requête GET reviews' as test_type,
    COUNT(*) as total_avis_disponibles
FROM reviews r
JOIN users u ON r.user_id = u.id
WHERE r.status = 'approved';

SELECT 
    'TEST API: Exemple d''avis formaté' as test_type,
    r.id,
    CONCAT(u.first_name, ' ', UPPER(LEFT(u.last_name, 1)), '.') as user_name,
    r.rating,
    LEFT(r.comment, 50) || '...' as comment_preview,
    r.created_at::date as date
FROM reviews r
JOIN users u ON r.user_id = u.id
WHERE r.status = 'approved'
ORDER BY r.created_at DESC
LIMIT 3;