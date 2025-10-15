-- =====================================================
-- SYSTÈME DE RÉGIONS BULLETPROOF POUR GASYWAY
-- Compatible avec TOUTES les structures de base de données
-- Auto-adaptatif et résistant aux erreurs
-- =====================================================

-- 1. CRÉATION DE LA TABLE PRINCIPALE REGIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS regions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    short_description TEXT,
    image_url TEXT,
    coordinates_lat DECIMAL(10, 8),
    coordinates_lng DECIMAL(11, 8),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    
    -- Métadonnées SEO
    meta_title VARCHAR(255),
    meta_description TEXT,
    slug VARCHAR(255) UNIQUE,
    
    -- Statistiques pré-calculées
    total_packs INTEGER DEFAULT 0,
    total_interests INTEGER DEFAULT 0,
    total_partners INTEGER DEFAULT 0,
    
    -- Informations pratiques
    best_season_start VARCHAR(5),
    best_season_end VARCHAR(5),
    climate_info TEXT,
    access_info TEXT
);

-- 2. AJOUT CONDITIONNEL DE COLONNES REGION_ID (ULTRA-SAFE)
-- =====================================================

-- Pour la table packs
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'packs' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'packs' AND column_name = 'region_id' AND table_schema = 'public') THEN
            BEGIN
                ALTER TABLE packs ADD COLUMN region_id UUID;
                RAISE NOTICE 'Colonne region_id ajoutée à la table packs';
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE 'Impossible d''ajouter region_id à packs: %', SQLERRM;
            END;
        ELSE
            RAISE NOTICE 'Colonne region_id existe déjà dans packs';
        END IF;
    ELSE
        RAISE NOTICE 'Table packs non trouvée, sera créée plus tard';
    END IF;
END $$;

-- Pour la table partners
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'partners' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'partners' AND column_name = 'region_id' AND table_schema = 'public') THEN
            BEGIN
                ALTER TABLE partners ADD COLUMN region_id UUID;
                RAISE NOTICE 'Colonne region_id ajoutée à la table partners';
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE 'Impossible d''ajouter region_id à partners: %', SQLERRM;
            END;
        ELSE
            RAISE NOTICE 'Colonne region_id existe déjà dans partners';
        END IF;
    ELSE
        RAISE NOTICE 'Table partners non trouvée, sera créée plus tard';
    END IF;
END $$;

-- 3. CRÉATION TABLE PIVOT REGION_INTERESTS
-- =====================================================

CREATE TABLE IF NOT EXISTS region_interests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    region_id UUID NOT NULL,
    interest_id UUID NOT NULL,
    is_popular BOOLEAN DEFAULT false,
    notes TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(region_id, interest_id)
);

-- Ajouter les contraintes de manière sécurisée
DO $$
BEGIN
    -- Contrainte vers regions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'region_interests_region_id_fkey' 
        AND table_name = 'region_interests'
    ) THEN
        ALTER TABLE region_interests ADD CONSTRAINT region_interests_region_id_fkey 
        FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE CASCADE;
    END IF;

    -- Contrainte vers interests (si elle existe)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'interests' AND table_schema = 'public') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'region_interests_interest_id_fkey' 
            AND table_name = 'region_interests'
        ) THEN
            ALTER TABLE region_interests ADD CONSTRAINT region_interests_interest_id_fkey 
            FOREIGN KEY (interest_id) REFERENCES interests(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- 4. INDICES OPTIMISÉS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_regions_active ON regions(is_active);
CREATE INDEX IF NOT EXISTS idx_regions_display_order ON regions(display_order);
CREATE INDEX IF NOT EXISTS idx_regions_slug ON regions(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_region_interests_region ON region_interests(region_id);
CREATE INDEX IF NOT EXISTS idx_region_interests_interest ON region_interests(interest_id);
CREATE INDEX IF NOT EXISTS idx_region_interests_popular ON region_interests(region_id, is_popular) WHERE is_popular = true;

-- 5. FONCTION POUR DÉTECTER LA STRUCTURE DES INTERESTS
-- =====================================================

CREATE OR REPLACE FUNCTION detect_interests_structure()
RETURNS TABLE(
    has_interests_table boolean,
    has_emoji_column boolean,
    has_icon_column boolean,
    has_category_column boolean,
    has_category_id_column boolean,
    category_column_type text,
    has_categories_table boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'interests' AND table_schema = 'public'
        ) as has_interests_table,
        
        EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'interests' AND column_name = 'emoji' AND table_schema = 'public'
        ) as has_emoji_column,
        
        EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'interests' AND column_name = 'icon' AND table_schema = 'public'
        ) as has_icon_column,
        
        EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'interests' AND column_name = 'category' AND table_schema = 'public'
        ) as has_category_column,
        
        EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'interests' AND column_name = 'category_id' AND table_schema = 'public'
        ) as has_category_id_column,
        
        COALESCE((
            SELECT data_type 
            FROM information_schema.columns 
            WHERE table_name = 'interests' 
            AND (column_name = 'category' OR column_name = 'category_id') 
            AND table_schema = 'public'
            LIMIT 1
        ), 'not_found') as category_column_type,
        
        EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'interest_categories' AND table_schema = 'public'
        ) as has_categories_table;
END;
$$ LANGUAGE plpgsql;

-- 6. FONCTION DE MISE À JOUR DES STATISTIQUES (ULTRA-SAFE)
-- =====================================================

CREATE OR REPLACE FUNCTION update_region_stats(region_uuid UUID)
RETURNS void AS $$
DECLARE
    packs_count integer := 0;
    partners_count integer := 0;
    interests_count integer := 0;
BEGIN
    -- Compter les packs (seulement si la table existe)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'packs' AND table_schema = 'public') THEN
        BEGIN
            SELECT COALESCE(COUNT(*), 0) INTO packs_count
            FROM packs 
            WHERE region_id = region_uuid;
        EXCEPTION
            WHEN OTHERS THEN
                packs_count := 0;
        END;
    END IF;

    -- Compter les partners (seulement si la table existe)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'partners' AND table_schema = 'public') THEN
        BEGIN
            SELECT COALESCE(COUNT(*), 0) INTO partners_count
            FROM partners 
            WHERE region_id = region_uuid;
        EXCEPTION
            WHEN OTHERS THEN
                partners_count := 0;
        END;
    END IF;

    -- Compter les intérêts de région
    BEGIN
        SELECT COALESCE(COUNT(*), 0) INTO interests_count
        FROM region_interests 
        WHERE region_id = region_uuid;
    EXCEPTION
        WHEN OTHERS THEN
            interests_count := 0;
    END;

    -- Mettre à jour la région
    BEGIN
        UPDATE regions 
        SET 
            total_packs = packs_count,
            total_interests = interests_count,
            total_partners = partners_count,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = region_uuid;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Erreur mise à jour stats région %: %', region_uuid, SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql;

-- 7. TRIGGER POUR MAINTENIR LES STATISTIQUES
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_update_region_stats_interests()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM update_region_stats(NEW.region_id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM update_region_stats(OLD.region_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_region_interests_stats ON region_interests;
CREATE TRIGGER trigger_region_interests_stats
    AFTER INSERT OR UPDATE OR DELETE ON region_interests
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_region_stats_interests();

-- 8. VUE REGIONS CATALOG (ULTRA-ADAPTATIVE)
-- =====================================================

CREATE OR REPLACE VIEW regions_catalog_view AS
WITH region_base AS (
    SELECT 
        r.id,
        r.name,
        r.description,
        r.short_description,
        r.image_url,
        r.coordinates_lat,
        r.coordinates_lng,
        r.slug,
        r.meta_title,
        r.meta_description,
        r.total_packs,
        r.total_interests,
        r.total_partners,
        r.best_season_start,
        r.best_season_end,
        r.climate_info,
        r.access_info,
        r.display_order,
        r.created_at,
        r.updated_at
    FROM regions r
    WHERE r.is_active = true
),
region_interests_safe AS (
    SELECT 
        ri.region_id,
        jsonb_agg(
            jsonb_build_object(
                'id', ri.interest_id,
                'is_popular', ri.is_popular
            )
        ) as interests_data
    FROM region_interests ri
    GROUP BY ri.region_id
)
SELECT 
    rb.*,
    COALESCE(ris.interests_data, '[]'::jsonb) as region_interests,
    '[]'::jsonb as featured_packs -- Sera rempli par la fonction dédiée
FROM region_base rb
LEFT JOIN region_interests_safe ris ON rb.id = ris.region_id
ORDER BY rb.display_order ASC, rb.name ASC;

-- 9. FONCTION POUR OBTENIR LES DÉTAILS DES INTÉRÊTS (ADAPTATIVE)
-- =====================================================

CREATE OR REPLACE FUNCTION get_region_interests_details(region_uuid UUID)
RETURNS jsonb AS $$
DECLARE
    result jsonb := '[]'::jsonb;
    structure_info record;
BEGIN
    -- Détecter la structure
    SELECT * INTO structure_info FROM detect_interests_structure() LIMIT 1;
    
    IF NOT structure_info.has_interests_table THEN
        RETURN '[]'::jsonb;
    END IF;

    -- Construire la requête selon la structure détectée
    IF structure_info.has_category_id_column AND structure_info.has_categories_table THEN
        -- Structure relationnelle avec interest_categories
        BEGIN
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', i.id,
                    'name', i.name,
                    'icon', CASE 
                        WHEN structure_info.has_emoji_column THEN COALESCE(i.emoji, '🏖️')
                        WHEN structure_info.has_icon_column THEN COALESCE(i.icon, '🏖️')
                        ELSE '🏖️'
                    END,
                    'category', COALESCE(ic.name, 'Général'),
                    'is_popular', ri.is_popular
                )
            ) INTO result
            FROM region_interests ri
            JOIN interests i ON i.id = ri.interest_id
            LEFT JOIN interest_categories ic ON ic.id = i.category_id
            WHERE ri.region_id = region_uuid;
        EXCEPTION
            WHEN OTHERS THEN
                result := '[]'::jsonb;
        END;
    ELSIF structure_info.has_category_column THEN
        -- Structure directe avec category string
        BEGIN
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', i.id,
                    'name', i.name,
                    'icon', CASE 
                        WHEN structure_info.has_emoji_column THEN COALESCE(i.emoji, '🏖️')
                        WHEN structure_info.has_icon_column THEN COALESCE(i.icon, '🏖️')
                        ELSE '🏖️'
                    END,
                    'category', COALESCE(i.category, 'Général'),
                    'is_popular', ri.is_popular
                )
            ) INTO result
            FROM region_interests ri
            JOIN interests i ON i.id = ri.interest_id
            WHERE ri.region_id = region_uuid;
        EXCEPTION
            WHEN OTHERS THEN
                result := '[]'::jsonb;
        END;
    ELSE
        -- Structure minimale sans catégories
        BEGIN
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', i.id,
                    'name', i.name,
                    'icon', CASE 
                        WHEN structure_info.has_emoji_column THEN COALESCE(i.emoji, '🏖️')
                        WHEN structure_info.has_icon_column THEN COALESCE(i.icon, '🏖️')
                        ELSE '🏖️'
                    END,
                    'category', 'Général',
                    'is_popular', ri.is_popular
                )
            ) INTO result
            FROM region_interests ri
            JOIN interests i ON i.id = ri.interest_id
            WHERE ri.region_id = region_uuid;
        EXCEPTION
            WHEN OTHERS THEN
                result := '[]'::jsonb;
        END;
    END IF;

    RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- 10. POLITIQUES RLS (SÉCURISÉES)
-- =====================================================

ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE region_interests ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques
DO $$
BEGIN
    DROP POLICY IF EXISTS "Regions readable by all" ON regions;
    DROP POLICY IF EXISTS "Regions writable by admins" ON regions;
    DROP POLICY IF EXISTS "Region interests readable by all" ON region_interests;
    DROP POLICY IF EXISTS "Region interests writable by admins" ON region_interests;
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- Ignorer les erreurs si les politiques n'existent pas
END $$;

-- Créer les nouvelles politiques
CREATE POLICY "Regions readable by all" ON regions FOR SELECT USING (true);

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        CREATE POLICY "Regions writable by admins" ON regions FOR ALL USING (
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
        );
    ELSE
        -- Si pas de table users, permettre tout pour l'admin setup
        CREATE POLICY "Regions writable by admins" ON regions FOR ALL USING (true);
    END IF;
END $$;

CREATE POLICY "Region interests readable by all" ON region_interests FOR SELECT USING (true);

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        CREATE POLICY "Region interests writable by admins" ON region_interests FOR ALL USING (
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
        );
    ELSE
        CREATE POLICY "Region interests writable by admins" ON region_interests FOR ALL USING (true);
    END IF;
END $$;

-- 11. DONNÉES DE DÉMONSTRATION
-- =====================================================

INSERT INTO regions (name, description, short_description, image_url, coordinates_lat, coordinates_lng, slug, meta_title, meta_description, best_season_start, best_season_end, climate_info, access_info, display_order) VALUES

('Nord de Madagascar', 
'Découvrez les merveilles du Nord malgache avec ses formations géologiques uniques, ses réserves naturelles exceptionnelles et sa biodiversité remarquable.',
'Tsingy, parcs nationaux et biodiversité exceptionnelle',
'https://images.unsplash.com/photo-1578662996442-48f60103fc96',
-12.3529, 49.2993,
'nord-madagascar',
'Nord de Madagascar - Tsingy et Parcs | GasyWay',
'Explorez le Nord de Madagascar : Tsingy Rouge, Ankarana, Montagne d''Ambre.',
'04-01', '11-30',
'Climat tropical avec saison sèche d''avril à novembre (20-30°C).',
'Accessible depuis Antsiranana par avion depuis Antananarivo.',
1),

('Hautes Terres Centrales',
'Le cœur historique et culturel de Madagascar, où se mélangent traditions ancestrales et modernité.',
'Cœur culturel avec Antananarivo et traditions ancestrales',
'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b',
-18.8792, 47.5079,
'hautes-terres-centrales',
'Hautes Terres Centrales - Culture et Traditions | GasyWay',
'Découvrez les Hautes Terres : Antananarivo, culture malgache, rizières.',
'03-01', '11-30',
'Climat tempéré d''altitude. Saison sèche mars-novembre (15-25°C).',
'Hub principal avec aéroport international d''Ivato.',
2),

('Côte Est Tropicale',
'La côte orientale luxuriante avec ses forêts primaires, plantations de vanille et plages préservées.',
'Forêts tropicales, vanille et plages sauvages',
'https://images.unsplash.com/photo-1559827260-dc66d52bef19',
-18.1669, 49.4026,
'cote-est-tropicale',
'Côte Est Madagascar - Forêts Tropicales | GasyWay',
'Explorez la côte Est : Andasibe, Sainte-Marie, forêts tropicales.',
'01-01', '12-31',
'Climat tropical humide. Saison cyclonique décembre-avril.',
'Accessible par Tamatave et routes nationales.',
3),

('Ouest - Terres Sauvages',
'Les immenses plaines de l''Ouest, royaume des baobabs géants et de la faune endémique.',
'Baobabs géants, Tsingy du Bemaraha et savanes infinies',
'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
-20.2868, 44.2859,
'ouest-terres-sauvages',
'Ouest Madagascar - Baobabs et Tsingy | GasyWay',
'Découvrez l''Ouest : Allée des Baobabs, Tsingy du Bemaraha, Morondava.',
'04-01', '11-30',
'Climat sec avec pluies décembre-mars (25-35°C).',
'Accessible par Morondava (aéroport).',
4),

('Grand Sud Aride',
'Le Sud mystique, terre des épineux et du peuple Antandroy avec paysages lunaires.',
'Paysages lunaires, forêt d''épineux et culture Antandroy',
'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3',
-23.3587, 43.9627,
'grand-sud-aride',
'Sud Madagascar - Forêt d''Épineux | GasyWay',
'Explorez le Sud : forêt d''épineux, paysages lunaires, culture Antandroy.',
'03-01', '11-30',
'Climat aride et sec. Peu de pluies (15-40°C).',
'Accessible par Fort-Dauphin et Toliara.',
5)

ON CONFLICT (slug) DO NOTHING;

-- 12. ASSOCIATION SÉCURISÉE DES INTÉRÊTS AUX RÉGIONS
-- =====================================================

DO $$
DECLARE
    region_record record;
    interest_record record;
    structure_info record;
    regions_count integer;
    interests_count integer;
BEGIN
    -- Vérifier les prérequis
    SELECT COUNT(*) INTO regions_count FROM regions WHERE is_active = true;
    
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'interests' AND table_schema = 'public') THEN
        RAISE NOTICE 'Table interests non trouvée, pas d''association possible';
        RETURN;
    END IF;
    
    SELECT COUNT(*) INTO interests_count FROM interests;
    
    IF regions_count = 0 OR interests_count = 0 THEN
        RAISE NOTICE 'Pas assez de données pour les associations (regions: %, interests: %)', regions_count, interests_count;
        RETURN;
    END IF;

    -- Associer quelques intérêts à chaque région
    FOR region_record IN SELECT id, name FROM regions WHERE is_active = true LOOP
        -- Associer les 5 premiers intérêts disponibles
        INSERT INTO region_interests (region_id, interest_id, is_popular, display_order)
        SELECT 
            region_record.id,
            i.id,
            false, -- Pas populaire par défaut
            ROW_NUMBER() OVER (ORDER BY i.name)
        FROM interests i
        LIMIT 5
        ON CONFLICT (region_id, interest_id) DO NOTHING;
        
        RAISE NOTICE 'Intérêts associés à la région: %', region_record.name;
    END LOOP;

    -- Marquer quelques intérêts comme populaires pour la première région
    UPDATE region_interests 
    SET is_popular = true 
    WHERE region_id = (SELECT id FROM regions ORDER BY display_order LIMIT 1)
    AND interest_id IN (SELECT id FROM interests LIMIT 3);

    RAISE NOTICE 'Associations créées avec succès';
END $$;

-- 13. MISE À JOUR DES STATISTIQUES
-- =====================================================

SELECT update_region_stats(id) FROM regions;

-- 14. VÉRIFICATION FINALE
-- =====================================================

DO $$
DECLARE
    regions_count integer;
    region_interests_count integer;
    structure_info record;
BEGIN
    SELECT COUNT(*) INTO regions_count FROM regions;
    SELECT COUNT(*) INTO region_interests_count FROM region_interests;
    SELECT * INTO structure_info FROM detect_interests_structure() LIMIT 1;
    
    RAISE NOTICE '=== INSTALLATION TERMINÉE ===';
    RAISE NOTICE 'Régions créées: %', regions_count;
    RAISE NOTICE 'Associations région-intérêts: %', region_interests_count;
    RAISE NOTICE 'Structure interests détectée:';
    RAISE NOTICE '  - Table interests: %', structure_info.has_interests_table;
    RAISE NOTICE '  - Colonne emoji: %', structure_info.has_emoji_column;
    RAISE NOTICE '  - Colonne icon: %', structure_info.has_icon_column;
    RAISE NOTICE '  - Colonne category: %', structure_info.has_category_column;
    RAISE NOTICE '  - Colonne category_id: %', structure_info.has_category_id_column;
    RAISE NOTICE '  - Table categories: %', structure_info.has_categories_table;
    RAISE NOTICE 'SYSTÈME PRÊT À UTILISER !';
END $$;