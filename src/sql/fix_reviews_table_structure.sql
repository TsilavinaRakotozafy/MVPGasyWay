-- =============================================
-- SCRIPT CORRECTEUR : STRUCTURE TABLE REVIEWS
-- Corrige les incohérences entre frontend et backend
-- =============================================

DO $$
DECLARE
    reviews_exists BOOLEAN;
    pack_reviews_exists BOOLEAN;
    reviews_count INTEGER := 0;
    pack_reviews_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🔍 DIAGNOSTIC DE LA STRUCTURE DES AVIS...';
    RAISE NOTICE '============================================';
    
    -- Vérifier l'existence des tables
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'reviews' AND table_schema = 'public'
    ) INTO reviews_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'pack_reviews' AND table_schema = 'public'
    ) INTO pack_reviews_exists;
    
    -- Compter les enregistrements
    IF reviews_exists THEN
        SELECT COUNT(*) INTO reviews_count FROM reviews;
    END IF;
    
    IF pack_reviews_exists THEN
        SELECT COUNT(*) INTO pack_reviews_count FROM pack_reviews;
    END IF;
    
    RAISE NOTICE '📊 ÉTAT ACTUEL :';
    RAISE NOTICE '   • Table reviews: % (% avis)', 
        CASE WHEN reviews_exists THEN 'EXISTS' ELSE 'MISSING' END, 
        reviews_count;
    RAISE NOTICE '   • Table pack_reviews: % (% avis)', 
        CASE WHEN pack_reviews_exists THEN 'EXISTS' ELSE 'MISSING' END, 
        pack_reviews_count;
    RAISE NOTICE '';
    
    -- ==============================
    -- CRÉER LA TABLE REVIEWS SI ELLE N'EXISTE PAS
    -- ==============================
    
    IF NOT reviews_exists THEN
        RAISE NOTICE '🔧 CRÉATION DE LA TABLE reviews...';
        
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
        RAISE NOTICE '👍 Table reviews existe déjà !';
        
        -- Vérifier que les colonnes nécessaires existent
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'reviews' AND column_name = 'status'
        ) THEN
            ALTER TABLE reviews ADD COLUMN status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));
            RAISE NOTICE '✅ Colonne status ajoutée à la table reviews';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'reviews' AND column_name = 'title'
        ) THEN
            ALTER TABLE reviews ADD COLUMN title TEXT;
            RAISE NOTICE '✅ Colonne title ajoutée à la table reviews';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'reviews' AND column_name = 'booking_id'
        ) THEN
            ALTER TABLE reviews ADD COLUMN booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL;
            RAISE NOTICE '✅ Colonne booking_id ajoutée à la table reviews';
        END IF;
    END IF;
    
    -- ==============================
    -- MIGRER LES DONNÉES DE pack_reviews VERS reviews SI NÉCESSAIRE
    -- ==============================
    
    IF pack_reviews_exists AND pack_reviews_count > 0 THEN
        RAISE NOTICE '🔄 MIGRATION DES DONNÉES pack_reviews -> reviews...';
        
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
        
        -- Compter les avis migrés
        SELECT COUNT(*) INTO reviews_count FROM reviews;
        RAISE NOTICE '✅ Migration terminée ! % avis maintenant dans reviews', reviews_count;
        
        -- Optionnel : supprimer l'ancienne table pack_reviews
        -- DROP TABLE IF EXISTS pack_reviews CASCADE;
        -- RAISE NOTICE '🗑️ Ancienne table pack_reviews supprimée';
        
    END IF;
    
    -- ==============================
    -- CONFIGURER LES POLITIQUES RLS
    -- ==============================
    
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
    
    RAISE NOTICE '✅ Politiques RLS configurées !';
    
    -- ==============================
    -- CRÉER FONCTION DE MISE À JOUR AUTOMATIQUE
    -- ==============================
    
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
    
    RAISE NOTICE '✅ Trigger de mise à jour automatique créé !';
    RAISE NOTICE '';
    
END $$;

-- ==============================
-- VÉRIFICATION FINALE
-- ==============================

DO $$
DECLARE
    final_reviews_count INTEGER;
    columns_info TEXT;
    rls_enabled BOOLEAN;
BEGIN
    RAISE NOTICE '🎯 VÉRIFICATION FINALE...';
    RAISE NOTICE '=======================';
    
    -- Compter les avis finaux
    SELECT COUNT(*) INTO final_reviews_count FROM reviews;
    
    -- Vérifier les colonnes
    SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) INTO columns_info
    FROM information_schema.columns 
    WHERE table_name = 'reviews' AND table_schema = 'public';
    
    -- Vérifier RLS
    SELECT relrowsecurity INTO rls_enabled 
    FROM pg_class 
    WHERE relname = 'reviews';
    
    RAISE NOTICE '✅ Table reviews : % avis', final_reviews_count;
    RAISE NOTICE '✅ Colonnes disponibles : %', columns_info;
    RAISE NOTICE '✅ RLS activé : %', 
        CASE WHEN rls_enabled THEN 'OUI' ELSE 'NON' END;
    RAISE NOTICE '';
    RAISE NOTICE '🚀 STRUCTURE REVIEWS CORRIGÉE AVEC SUCCÈS !';
    RAISE NOTICE '';
    RAISE NOTICE '📝 RÉSUMÉ :';
    RAISE NOTICE '   • Table reviews créée/vérifiée';
    RAISE NOTICE '   • Colonnes: id, user_id, pack_id, booking_id, rating, title, comment, status';
    RAISE NOTICE '   • Politiques RLS configurées';
    RAISE NOTICE '   • Contraintes de validation appliquées';
    RAISE NOTICE '   • Trigger de mise à jour automatique';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 LE SYSTÈME D''AVIS EST MAINTENANT OPÉRATIONNEL !';
    RAISE NOTICE 'Votre application peut créer et afficher des avis.';
    RAISE NOTICE '';
    
END $$;

-- ==============================
-- TEST DE FONCTIONNALITÉ
-- ==============================

-- Afficher un exemple d'avis existants
SELECT 
    'TEST: Avis existants' as info,
    COUNT(*) as total_avis,
    AVG(rating) as moyenne_rating,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as avis_approuves
FROM reviews;

-- Test de jointure avec users et packs
SELECT 
    'TEST: Jointure avec users/packs' as info,
    COUNT(*) as avis_avec_jointures
FROM reviews r
JOIN users u ON r.user_id = u.id
JOIN packs p ON r.pack_id = p.id
LIMIT 1;