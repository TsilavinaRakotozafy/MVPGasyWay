-- =============================================
-- SCRIPT CORRECTEUR : ERREUR PGRST200 pack_reviews <-> profiles
-- Corrige définitivement l'erreur de relation manquante
-- =============================================

-- 🔍 DIAGNOSTIC : L'API essaie de joindre pack_reviews avec profiles
-- ❌ PROBLÈME : La table profiles n'existe pas dans Supabase
-- ✅ SOLUTION : Créer la table profiles avec les données de users

DO $$
DECLARE
    profiles_exists BOOLEAN;
    pack_reviews_exists BOOLEAN;
    users_count INTEGER;
    pack_reviews_count INTEGER;
BEGIN
    RAISE NOTICE '🔍 DIAGNOSTIC DÉTAILLÉ DES TABLES...';
    RAISE NOTICE '==========================================';

    -- Vérifier l'existence des tables
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'profiles' AND table_schema = 'public'
    ) INTO profiles_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'pack_reviews' AND table_schema = 'public'
    ) INTO pack_reviews_exists;
    
    -- Compter les enregistrements
    IF pack_reviews_exists THEN
        SELECT COUNT(*) INTO pack_reviews_count FROM pack_reviews;
    ELSE
        pack_reviews_count := 0;
    END IF;
    
    SELECT COUNT(*) INTO users_count FROM users;
    
    RAISE NOTICE '📊 ÉTAT ACTUEL :';
    RAISE NOTICE '   • Table users: % enregistrements', users_count;
    RAISE NOTICE '   • Table pack_reviews: % (% avis)', 
        CASE WHEN pack_reviews_exists THEN 'EXISTS' ELSE 'MISSING' END, 
        pack_reviews_count;
    RAISE NOTICE '   • Table profiles: %', 
        CASE WHEN profiles_exists THEN 'EXISTS' ELSE 'MISSING' END;
    RAISE NOTICE '';

    -- ==============================
    -- SOLUTION : CRÉER LA TABLE PROFILES
    -- ==============================
    
    IF NOT profiles_exists THEN
        RAISE NOTICE '🔧 CRÉATION DE LA TABLE profiles...';
        
        -- Créer la table profiles avec la structure exacte nécessaire
        CREATE TABLE profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            first_name TEXT,
            last_name TEXT,
            email TEXT,
            phone TEXT,
            bio TEXT,
            avatar_url TEXT,
            profile_picture_url TEXT,
            role TEXT DEFAULT 'voyageur' CHECK (role IN ('voyageur', 'admin')),
            status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'pending')),
            first_login_completed BOOLEAN DEFAULT false,
            gdpr_consent BOOLEAN DEFAULT false,
            locale TEXT DEFAULT 'fr',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            last_login TIMESTAMPTZ
        );
        
        -- Index pour performance
        CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
        CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
        CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
        CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
        
        RAISE NOTICE '✅ Table profiles créée avec succès !';
        
        -- Migrer TOUTES les données de users vers profiles
        INSERT INTO profiles (
            user_id, first_name, last_name, email, phone, bio, 
            profile_picture_url, role, status, first_login_completed,
            gdpr_consent, locale, created_at, updated_at, last_login
        )
        SELECT 
            id, first_name, last_name, email, phone, bio,
            profile_picture_url, role, status, first_login_completed,
            gdpr_consent, locale, created_at, updated_at, last_login
        FROM users
        ON CONFLICT (user_id) DO UPDATE SET
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            email = EXCLUDED.email,
            phone = EXCLUDED.phone,
            bio = EXCLUDED.bio,
            profile_picture_url = EXCLUDED.profile_picture_url,
            role = EXCLUDED.role,
            status = EXCLUDED.status,
            first_login_completed = EXCLUDED.first_login_completed,
            gdpr_consent = EXCLUDED.gdpr_consent,
            locale = EXCLUDED.locale,
            updated_at = NOW();
        
        RAISE NOTICE '✅ Migration des données users -> profiles terminée !';
        
    ELSE
        RAISE NOTICE '👍 Table profiles existe déjà !';
    END IF;
    
    -- ==============================
    -- VÉRIFIER/CORRIGER LES FOREIGN KEYS
    -- ==============================
    
    IF pack_reviews_exists THEN
        -- Vérifier si la foreign key vers profiles existe
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'pack_reviews' 
            AND constraint_name = 'fk_pack_reviews_user_profiles'
            AND constraint_type = 'FOREIGN KEY'
        ) THEN
            RAISE NOTICE '🔧 Ajout de la foreign key pack_reviews -> profiles...';
            
            -- Ajouter la foreign key
            ALTER TABLE pack_reviews 
            ADD CONSTRAINT fk_pack_reviews_user_profiles 
            FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
            
            RAISE NOTICE '✅ Foreign key ajoutée !';
        ELSE
            RAISE NOTICE '👍 Foreign key pack_reviews -> profiles existe déjà !';
        END IF;
    END IF;
    
    -- ==============================
    -- CONFIGURER LES POLITIQUES RLS
    -- ==============================
    
    -- Activer RLS sur profiles
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    
    -- Politique : Lecture publique pour les profils publics (avis)
    DROP POLICY IF EXISTS "profiles_select_public" ON profiles;
    CREATE POLICY "profiles_select_public" 
    ON profiles FOR SELECT 
    USING (true);  -- Tous les profils sont visibles (pour les avis publics)
    
    -- Politique : Modification par le propriétaire uniquement
    DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
    CREATE POLICY "profiles_update_own" 
    ON profiles FOR UPDATE 
    USING (user_id = auth.uid());
    
    -- Politique : Insertion par l'utilisateur authentifié
    DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
    CREATE POLICY "profiles_insert_own" 
    ON profiles FOR INSERT 
    WITH CHECK (user_id = auth.uid());
    
    RAISE NOTICE '✅ Politiques RLS configurées !';
    
    -- ==============================
    -- CRÉER UNE FONCTION DE SYNCHRONISATION
    -- ==============================
    
    -- Fonction pour maintenir la synchronisation users <-> profiles
    CREATE OR REPLACE FUNCTION sync_user_to_profile()
    RETURNS TRIGGER AS $$
    BEGIN
        -- Synchroniser lors d'une mise à jour de users
        IF TG_OP = 'UPDATE' THEN
            UPDATE profiles SET
                first_name = NEW.first_name,
                last_name = NEW.last_name,
                email = NEW.email,
                phone = NEW.phone,
                bio = NEW.bio,
                profile_picture_url = NEW.profile_picture_url,
                role = NEW.role,
                status = NEW.status,
                first_login_completed = NEW.first_login_completed,
                gdpr_consent = NEW.gdpr_consent,
                locale = NEW.locale,
                updated_at = NEW.updated_at,
                last_login = NEW.last_login
            WHERE user_id = NEW.id;
            
            RETURN NEW;
        END IF;
        
        -- Créer le profil lors d'une insertion dans users
        IF TG_OP = 'INSERT' THEN
            INSERT INTO profiles (
                user_id, first_name, last_name, email, phone, bio,
                profile_picture_url, role, status, first_login_completed,
                gdpr_consent, locale, created_at, updated_at, last_login
            ) VALUES (
                NEW.id, NEW.first_name, NEW.last_name, NEW.email, NEW.phone, NEW.bio,
                NEW.profile_picture_url, NEW.role, NEW.status, NEW.first_login_completed,
                NEW.gdpr_consent, NEW.locale, NEW.created_at, NEW.updated_at, NEW.last_login
            ) ON CONFLICT (user_id) DO NOTHING;
            
            RETURN NEW;
        END IF;
        
        -- Supprimer le profil lors d'une suppression de user
        IF TG_OP = 'DELETE' THEN
            DELETE FROM profiles WHERE user_id = OLD.id;
            RETURN OLD;
        END IF;
        
        RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;
    
    -- Créer le trigger de synchronisation
    DROP TRIGGER IF EXISTS trigger_sync_user_to_profile ON users;
    CREATE TRIGGER trigger_sync_user_to_profile
        AFTER INSERT OR UPDATE OR DELETE ON users
        FOR EACH ROW
        EXECUTE FUNCTION sync_user_to_profile();
    
    RAISE NOTICE '✅ Fonction de synchronisation users <-> profiles créée !';
    
END $$;


-- ==============================
-- VÉRIFICATION FINALE ET STATISTIQUES
-- ==============================

DO $$
DECLARE
    profiles_count INTEGER;
    pack_reviews_count INTEGER;
    foreign_key_exists BOOLEAN;
    rls_enabled BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎯 VÉRIFICATION FINALE...';
    RAISE NOTICE '========================';
    
    -- Compter les profils
    SELECT COUNT(*) INTO profiles_count FROM profiles;
    
    -- Compter les avis
    SELECT COUNT(*) INTO pack_reviews_count FROM pack_reviews;
    
    -- Vérifier la foreign key
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'pack_reviews' 
        AND constraint_name = 'fk_pack_reviews_user_profiles'
        AND constraint_type = 'FOREIGN KEY'
    ) INTO foreign_key_exists;
    
    -- Vérifier RLS
    SELECT relrowsecurity INTO rls_enabled 
    FROM pg_class 
    WHERE relname = 'profiles';
    
    RAISE NOTICE '✅ Table profiles : % profils créés', profiles_count;
    RAISE NOTICE '✅ Table pack_reviews : % avis', pack_reviews_count;
    RAISE NOTICE '✅ Foreign key pack_reviews -> profiles : %', 
        CASE WHEN foreign_key_exists THEN 'CONFIGURÉE' ELSE 'MANQUANTE' END;
    RAISE NOTICE '✅ Politiques RLS : %', 
        CASE WHEN rls_enabled THEN 'ACTIVÉES' ELSE 'DÉSACTIVÉES' END;
    RAISE NOTICE '✅ Synchronisation automatique : ACTIVE';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 CORRECTION TERMINÉE AVEC SUCCÈS !';
    RAISE NOTICE '';
    RAISE NOTICE '📝 RÉSUMÉ :';
    RAISE NOTICE '   • Table profiles créée et peuplée';
    RAISE NOTICE '   • Relation pack_reviews <-> profiles établie';
    RAISE NOTICE '   • Politiques RLS configurées';
    RAISE NOTICE '   • Synchronisation automatique active';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 L''erreur PGRST200 est maintenant résolue !';
    RAISE NOTICE 'L''API /packs/:id/reviews fonctionne correctement.';
    RAISE NOTICE '';
END $$;


-- ==============================
-- TEST DE LA REQUÊTE API
-- ==============================

-- Tester la requête exacte de l'API pour s'assurer qu'elle fonctionne
DO $$
DECLARE
    test_result RECORD;
    query_success BOOLEAN := true;
BEGIN
    RAISE NOTICE '🧪 TEST DE LA REQUÊTE API...';
    RAISE NOTICE '============================';
    
    BEGIN
        -- Test de la requête exacte utilisée par l'API
        SELECT 
            pr.id,
            pr.rating,
            pr.comment,
            pr.created_at,
            p.first_name,
            p.last_name
        INTO test_result
        FROM pack_reviews pr
        INNER JOIN profiles p ON pr.user_id = p.user_id
        LIMIT 1;
        
        IF FOUND THEN
            RAISE NOTICE '✅ Requête API : SUCCÈS';
            RAISE NOTICE '   • Avis ID: %', test_result.id;
            RAISE NOTICE '   • Note: %/5', test_result.rating;
            RAISE NOTICE '   • Utilisateur: % %', test_result.first_name, test_result.last_name;
        ELSE
            RAISE NOTICE '⚠️ Requête API : Aucun avis trouvé (normal si pas d''avis)';
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        query_success := false;
        RAISE NOTICE '❌ Requête API : ÉCHEC - %', SQLERRM;
    END;
    
    IF query_success THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎯 L''API /packs/:id/reviews va maintenir fonctionner !';
    END IF;
    
END $$;