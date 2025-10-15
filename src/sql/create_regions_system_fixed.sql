-- =====================================================
-- SYSTÈME COMPLET DE RÉGIONS POUR GASYWAY (VERSION CORRIGÉE)
-- À exécuter dans Supabase SQL Editor
-- Compatible avec la structure existante des interests
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
    created_by UUID REFERENCES users(id),
    
    -- Métadonnées pour le SEO et l'affichage
    meta_title VARCHAR(255),
    meta_description TEXT,
    slug VARCHAR(255) UNIQUE,
    
    -- Statistiques pré-calculées
    total_packs INTEGER DEFAULT 0,
    total_interests INTEGER DEFAULT 0,
    total_partners INTEGER DEFAULT 0,
    
    -- Informations pratiques
    best_season_start VARCHAR(5), -- Format MM-DD
    best_season_end VARCHAR(5),   -- Format MM-DD
    climate_info TEXT,
    access_info TEXT
);

-- 2. AJOUT DE COLONNES REGION_ID AUX TABLES EXISTANTES (SI ELLES EXISTENT)
-- =====================================================

-- Ajouter region_id à la table packs (seulement si la table existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'packs') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'packs' AND column_name = 'region_id') THEN
            ALTER TABLE packs ADD COLUMN region_id UUID REFERENCES regions(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- Ajouter region_id à la table partners (seulement si la table existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'partners') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'partners' AND column_name = 'region_id') THEN
            ALTER TABLE partners ADD COLUMN region_id UUID REFERENCES regions(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- 3. CRÉATION DE LA TABLE PIVOT REGION_INTERESTS
-- =====================================================

CREATE TABLE IF NOT EXISTS region_interests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    interest_id UUID NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
    is_popular BOOLEAN DEFAULT false, -- Activité populaire dans cette région
    notes TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(region_id, interest_id)
);

-- 4. INDICES POUR OPTIMISER LES PERFORMANCES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_regions_active ON regions(is_active);
CREATE INDEX IF NOT EXISTS idx_regions_display_order ON regions(display_order);
CREATE INDEX IF NOT EXISTS idx_regions_slug ON regions(slug);

-- Indices conditionnels (seulement si les tables existent)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'packs') THEN
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_packs_region_id') THEN
            CREATE INDEX idx_packs_region_id ON packs(region_id);
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'partners') THEN
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_partners_region_id') THEN
            CREATE INDEX idx_partners_region_id ON partners(region_id);
        END IF;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_region_interests_region ON region_interests(region_id);
CREATE INDEX IF NOT EXISTS idx_region_interests_interest ON region_interests(interest_id);

-- 5. FONCTION DE MISE À JOUR DES STATISTIQUES
-- =====================================================

CREATE OR REPLACE FUNCTION update_region_stats(region_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE regions 
    SET 
        total_packs = (
            SELECT COALESCE(COUNT(*), 0)
            FROM packs 
            WHERE region_id = region_uuid 
            AND (status = 'active' OR status IS NULL)
        ),
        total_interests = (
            SELECT COALESCE(COUNT(*), 0)
            FROM region_interests 
            WHERE region_id = region_uuid
        ),
        total_partners = (
            SELECT COALESCE(COUNT(*), 0)
            FROM partners 
            WHERE region_id = region_uuid 
            AND (is_active = true OR is_active IS NULL)
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = region_uuid;
EXCEPTION
    WHEN OTHERS THEN
        -- Si les tables n'existent pas, on met à 0
        UPDATE regions 
        SET 
            total_packs = 0,
            total_interests = (
                SELECT COALESCE(COUNT(*), 0)
                FROM region_interests 
                WHERE region_id = region_uuid
            ),
            total_partners = 0,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = region_uuid;
END;
$$ LANGUAGE plpgsql;

-- 6. TRIGGERS POUR MAINTENIR LES STATISTIQUES (CONDITIONNELS)
-- =====================================================

-- Trigger pour les packs (seulement si la table existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'packs') THEN
        -- Créer la fonction trigger pour packs
        CREATE OR REPLACE FUNCTION trigger_update_region_stats_packs()
        RETURNS trigger AS $trigger$
        BEGIN
            IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
                IF NEW.region_id IS NOT NULL THEN
                    PERFORM update_region_stats(NEW.region_id);
                END IF;
                IF TG_OP = 'UPDATE' AND OLD.region_id IS NOT NULL AND OLD.region_id != NEW.region_id THEN
                    PERFORM update_region_stats(OLD.region_id);
                END IF;
                RETURN NEW;
            ELSIF TG_OP = 'DELETE' THEN
                IF OLD.region_id IS NOT NULL THEN
                    PERFORM update_region_stats(OLD.region_id);
                END IF;
                RETURN OLD;
            END IF;
            RETURN NULL;
        END;
        $trigger$ LANGUAGE plpgsql;

        -- Supprimer le trigger s'il existe déjà
        DROP TRIGGER IF EXISTS trigger_packs_region_stats ON packs;
        
        -- Créer le trigger
        CREATE TRIGGER trigger_packs_region_stats
            AFTER INSERT OR UPDATE OR DELETE ON packs
            FOR EACH ROW
            EXECUTE FUNCTION trigger_update_region_stats_packs();
    END IF;
END $$;

-- Trigger pour region_interests
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

-- 7. FONCTION POUR DÉTECTER LA STRUCTURE DE LA TABLE INTERESTS
-- =====================================================

CREATE OR REPLACE FUNCTION get_interest_icon_column()
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    -- Vérifier si la colonne emoji existe
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'interests' AND column_name = 'emoji'
    ) THEN
        RETURN 'emoji';
    -- Sinon vérifier si la colonne icon existe
    ELSIF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'interests' AND column_name = 'icon'
    ) THEN
        RETURN 'icon';
    ELSE
        RETURN 'name'; -- Fallback
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 8. VUES OPTIMISÉES POUR LES RÉGIONS (VERSION ADAPTATIVE)
-- =====================================================

-- Vue catalogue des régions avec statistiques (version sécurisée)
CREATE OR REPLACE VIEW regions_catalog_view AS
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
    r.updated_at,
    
    -- Packs actifs dans cette région (seulement si la table packs existe)
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'packs') THEN
            COALESCE(
                (SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', p.id,
                        'title', p.title,
                        'price', p.price,
                        'currency', COALESCE(p.currency, 'MGA'),
                        'duration_days', p.duration_days,
                        'difficulty_level', p.difficulty_level
                    )
                )
                FROM packs p 
                WHERE p.region_id = r.id AND COALESCE(p.status, 'active') = 'active'
                LIMIT 5),
                '[]'::jsonb
            )
        ELSE
            '[]'::jsonb
    END as featured_packs,
    
    -- Intérêts de cette région (version adaptative)
    COALESCE(
        (SELECT jsonb_agg(
            jsonb_build_object(
                'id', i.id,
                'name', i.name,
                'icon_or_emoji', CASE 
                    WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'interests' AND column_name = 'emoji') 
                    THEN COALESCE(i.emoji, i.name)
                    WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'interests' AND column_name = 'icon') 
                    THEN COALESCE(i.icon, i.name)
                    ELSE i.name
                END,
                'category', COALESCE(i.category, 'general'),
                'is_popular', ri.is_popular
            )
        )
        FROM region_interests ri
        JOIN interests i ON i.id = ri.interest_id
        WHERE ri.region_id = r.id),
        '[]'::jsonb
    ) as region_interests

FROM regions r
WHERE r.is_active = true
ORDER BY r.display_order ASC, r.name ASC;

-- Vue admin avec toutes les informations (version sécurisée)
CREATE OR REPLACE VIEW regions_admin_view AS
SELECT 
    r.*,
    u.email as created_by_email,
    
    -- Compter les éléments liés de manière sécurisée
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'packs') THEN
            (SELECT COALESCE(COUNT(*), 0) FROM packs WHERE region_id = r.id)
        ELSE 0
    END as total_packs_all,
    
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'packs') THEN
            (SELECT COALESCE(COUNT(*), 0) FROM packs WHERE region_id = r.id AND COALESCE(status, 'active') = 'active')
        ELSE 0
    END as total_packs_active,
    
    (SELECT COALESCE(COUNT(*), 0) FROM region_interests WHERE region_id = r.id) as total_region_interests,
    
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'partners') THEN
            (SELECT COALESCE(COUNT(*), 0) FROM partners WHERE region_id = r.id)
        ELSE 0
    END as total_region_partners,
    
    -- Dernière mise à jour des statistiques
    r.updated_at as stats_updated_at

FROM regions r
LEFT JOIN users u ON u.id = r.created_by
ORDER BY r.display_order ASC, r.name ASC;

-- 9. POLITIQUES RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Activer RLS sur les nouvelles tables
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE region_interests ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Regions readable by all" ON regions;
DROP POLICY IF EXISTS "Regions writable by admins" ON regions;
DROP POLICY IF EXISTS "Region interests readable by all" ON region_interests;
DROP POLICY IF EXISTS "Region interests writable by admins" ON region_interests;

-- Politique pour les régions - lecture publique, écriture admin
CREATE POLICY "Regions readable by all" ON regions FOR SELECT USING (true);
CREATE POLICY "Regions writable by admins" ON regions FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Politique pour region_interests - lecture publique, écriture admin
CREATE POLICY "Region interests readable by all" ON region_interests FOR SELECT USING (true);
CREATE POLICY "Region interests writable by admins" ON region_interests FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- 10. DONNÉES DE DÉMONSTRATION - RÉGIONS DE MADAGASCAR
-- =====================================================

-- Insérer les régions principales de Madagascar
INSERT INTO regions (name, description, short_description, image_url, coordinates_lat, coordinates_lng, slug, meta_title, meta_description, best_season_start, best_season_end, climate_info, access_info, display_order) VALUES

-- Nord de Madagascar
('Nord de Madagascar', 
'Découvrez les merveilles du Nord malgache avec ses formations géologiques uniques, ses réserves naturelles exceptionnelles et sa biodiversité remarquable. Des Tsingy Rouge aux parcs nationaux d''Ankarana et de la Montagne d''Ambre, cette région offre des paysages à couper le souffle.',
'Tsingy, parcs nationaux et biodiversité exceptionnelle du Nord malgache',
'https://images.unsplash.com/photo-1578662996442-48f60103fc96',
-12.3529, 49.2993,
'nord-madagascar',
'Nord de Madagascar - Tsingy et Parcs Nationaux | GasyWay',
'Explorez le Nord de Madagascar : Tsingy Rouge, Ankarana, Montagne d''Ambre. Circuits et excursions dans la région la plus spectaculaire de Madagascar.',
'04-01', '11-30',
'Climat tropical avec saison sèche d''avril à novembre. Températures agréables (20-30°C).',
'Accessible depuis Antsiranana (Diego Suarez) par avion depuis Antananarivo. Route nationale en bon état.',
1),

-- Hautes Terres Centrales
('Hautes Terres Centrales',
'Le cœur historique et culturel de Madagascar, où se mélangent traditions ancestrales et modernité. Découvrez Antananarivo, les collines sacrées, les rizières en terrasses et l''artisanat traditionnel malgache dans un climat tempéré unique.',
'Cœur culturel de Madagascar avec Antananarivo et traditions ancestrales',
'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b',
-18.8792, 47.5079,
'hautes-terres-centrales',
'Hautes Terres Centrales Madagascar - Culture et Traditions | GasyWay',
'Découvrez les Hautes Terres de Madagascar : Antananarivo, culture malgache, rizières en terrasses. Immersion authentique au cœur de l''île.',
'03-01', '11-30',
'Climat tempéré d''altitude. Saison sèche de mars à novembre. Températures 15-25°C.',
'Hub principal avec l''aéroport international d''Ivato. Réseau routier développé.',
2),

-- Est - Côte Tropicale
('Côte Est Tropicale',
'La côte orientale luxuriante de Madagascar, avec ses forêts primaires, ses plantations de vanille et de girofle, et ses plages préservées. Tamatave, Sainte-Marie et Andasibe-Mantadia offrent une immersion totale dans la nature tropicale.',
'Forêts tropicales, vanille et plages sauvages de l''océan Indien',
'https://images.unsplash.com/photo-1559827260-dc66d52bef19',
-18.1669, 49.4026,
'cote-est-tropicale',
'Côte Est Madagascar - Forêts Tropicales et Océan Indien | GasyWay',
'Explorez la côte Est de Madagascar : Andasibe, Sainte-Marie, forêts tropicales. Nature luxuriante et plages paradisiaques.',
'01-01', '12-31',
'Climat tropical humide toute l''année. Saison cyclonique de décembre à avril.',
'Accessible par Tamatave (port principal) et routes nationales. Liaisons aériennes vers Sainte-Marie.',
3),

-- Ouest - Terres Sauvages
('Ouest - Terres Sauvages',
'Les immenses plaines et savanes de l''Ouest malgache, royaume des baobabs géants et de la faune endémique. Morondava, l''Allée des Baobabs et les Tsingy du Bemaraha créent un décor de cinéma grandeur nature.',
'Baobabs géants, Tsingy du Bemaraha et savanes infinies',
'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
-20.2868, 44.2859,
'ouest-terres-sauvages',
'Ouest Madagascar - Baobabs et Tsingy du Bemaraha | GasyWay',
'Découvrez l''Ouest de Madagascar : Allée des Baobabs, Tsingy du Bemaraha, Morondava. Paysages mythiques et faune unique.',
'04-01', '11-30',
'Climat sec avec saison des pluies de décembre à mars. Températures élevées (25-35°C).',
'Accessible par Morondava (aéroport). Routes difficiles en saison des pluies.',
4),

-- Sud - Grand Sud Aride
('Grand Sud Aride',
'Le Sud mystique de Madagascar, terre des épineux et du peuple Antandroy. Paysages lunaires, formations rocheuses spectaculaires et une biodiversité adaptée à l''aridité. Fort-Dauphin et Toliara sont les portes d''entrée de cette région fascinante.',
'Paysages lunaires, forêt d''épineux et culture Antandroy authentique',
'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3',
-23.3587, 43.9627,
'grand-sud-aride',
'Sud Madagascar - Forêt d''Épineux et Culture Antandroy | GasyWay',
'Explorez le Sud de Madagascar : forêt d''épineux, paysages lunaires, culture Antandroy. Aventure au bout du monde.',
'03-01', '11-30',
'Climat aride et sec. Très peu de pluies. Températures variables (15-40°C).',
'Accessible par Fort-Dauphin et Toliara (aéroports). Routes difficiles, 4x4 recommandé.',
5)

ON CONFLICT (slug) DO NOTHING;

-- 11. ASSOCIER LES INTÉRÊTS AUX RÉGIONS (VERSION SÉCURISÉE)
-- =====================================================

-- Seulement si la table interests existe et a des données
DO $$
DECLARE
    region_record RECORD;
    interest_record RECORD;
    region_count INTEGER;
    interest_count INTEGER;
BEGIN
    -- Vérifier si les tables et données existent
    SELECT COUNT(*) INTO region_count FROM regions WHERE is_active = true;
    SELECT COUNT(*) INTO interest_count FROM interests;
    
    IF region_count > 0 AND interest_count > 0 THEN
        -- Associer quelques intérêts de base aux régions
        FOR region_record IN SELECT id, name FROM regions WHERE is_active = true LOOP
            -- Associer les 5 premiers intérêts à chaque région comme exemple
            INSERT INTO region_interests (region_id, interest_id, is_popular, display_order)
            SELECT 
                region_record.id,
                i.id,
                false, -- Pas populaire par défaut
                ROW_NUMBER() OVER ()
            FROM interests i
            LIMIT 5
            ON CONFLICT (region_id, interest_id) DO NOTHING;
        END LOOP;
        
        -- Marquer quelques intérêts comme populaires pour le Nord de Madagascar
        UPDATE region_interests 
        SET is_popular = true 
        WHERE region_id = (SELECT id FROM regions WHERE slug = 'nord-madagascar' LIMIT 1)
        AND interest_id IN (SELECT id FROM interests LIMIT 3);
        
    END IF;
END $$;

-- 12. MISE À JOUR DES STATISTIQUES INITIALES
-- =====================================================

-- Mettre à jour les statistiques de toutes les régions
DO $$
DECLARE
    region_record RECORD;
BEGIN
    FOR region_record IN SELECT id FROM regions LOOP
        PERFORM update_region_stats(region_record.id);
    END LOOP;
END $$;

-- 13. FONCTION UTILITAIRE POUR OBTENIR LES RÉGIONS AVEC PACKS
-- =====================================================

CREATE OR REPLACE FUNCTION get_regions_with_pack_counts()
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    description TEXT,
    short_description TEXT,
    image_url TEXT,
    slug VARCHAR,
    total_packs BIGINT,
    active_packs BIGINT,
    popular_interests JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.name,
        r.description,
        r.short_description,
        r.image_url,
        r.slug,
        CASE 
            WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'packs') THEN
                (SELECT COALESCE(COUNT(*), 0) FROM packs p WHERE p.region_id = r.id)
            ELSE 0::BIGINT
        END as total_packs,
        CASE 
            WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'packs') THEN
                (SELECT COALESCE(COUNT(*), 0) FROM packs p WHERE p.region_id = r.id AND COALESCE(p.status, 'active') = 'active')
            ELSE 0::BIGINT
        END as active_packs,
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'name', i.name,
                    'icon', CASE 
                        WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'interests' AND column_name = 'emoji') 
                        THEN COALESCE(i.emoji, '🏖️')
                        WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'interests' AND column_name = 'icon') 
                        THEN COALESCE(i.icon, '🏖️')
                        ELSE '🏖️'
                    END,
                    'category', COALESCE(i.category, 'general')
                )
            )
            FROM region_interests ri
            JOIN interests i ON i.id = ri.interest_id
            WHERE ri.region_id = r.id AND ri.is_popular = true),
            '[]'::jsonb
        ) as popular_interests
    FROM regions r
    WHERE r.is_active = true
    ORDER BY r.display_order ASC, r.name ASC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FIN DU SCRIPT - SYSTÈME DE RÉGIONS CORRIGÉ
-- =====================================================

-- Vérification finale avec gestion d'erreurs
DO $$
DECLARE
    regions_count INTEGER;
    region_interests_count INTEGER;
    views_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO regions_count FROM regions;
    SELECT COUNT(*) INTO region_interests_count FROM region_interests;
    SELECT COUNT(*) INTO views_count FROM information_schema.views WHERE table_name LIKE '%region%';
    
    RAISE NOTICE 'SYSTÈME DE RÉGIONS INSTALLÉ AVEC SUCCÈS !';
    RAISE NOTICE '✅ Régions créées: %', regions_count;
    RAISE NOTICE '✅ Associations région-intérêts: %', region_interests_count;
    RAISE NOTICE '✅ Vues créées: %', views_count;
    RAISE NOTICE '✅ Structure adaptée à votre base de données existante';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Installation terminée avec quelques avertissements: %', SQLERRM;
END $$;