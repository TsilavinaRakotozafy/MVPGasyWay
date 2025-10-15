-- =====================================================
-- SYSTÈME COMPLET DE RÉGIONS POUR GASYWAY
-- À exécuter dans Supabase SQL Editor
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

-- 2. AJOUT DE COLONNES REGION_ID AUX TABLES EXISTANTES
-- =====================================================

-- Ajouter region_id à la table packs
ALTER TABLE packs 
ADD COLUMN IF NOT EXISTS region_id UUID REFERENCES regions(id) ON DELETE SET NULL;

-- Ajouter region_id à la table partners
ALTER TABLE partners 
ADD COLUMN IF NOT EXISTS region_id UUID REFERENCES regions(id) ON DELETE SET NULL;

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
CREATE INDEX IF NOT EXISTS idx_packs_region_id ON packs(region_id);
CREATE INDEX IF NOT EXISTS idx_partners_region_id ON partners(region_id);
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
            SELECT COUNT(*) 
            FROM packs 
            WHERE region_id = region_uuid AND status = 'active'
        ),
        total_interests = (
            SELECT COUNT(*) 
            FROM region_interests 
            WHERE region_id = region_uuid
        ),
        total_partners = (
            SELECT COUNT(*) 
            FROM partners 
            WHERE region_id = region_uuid AND is_active = true
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = region_uuid;
END;
$$ LANGUAGE plpgsql;

-- 6. TRIGGERS POUR MAINTENIR LES STATISTIQUES
-- =====================================================

-- Trigger pour les packs
CREATE OR REPLACE FUNCTION trigger_update_region_stats_packs()
RETURNS trigger AS $$
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
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_packs_region_stats
    AFTER INSERT OR UPDATE OR DELETE ON packs
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_region_stats_packs();

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

CREATE OR REPLACE TRIGGER trigger_region_interests_stats
    AFTER INSERT OR UPDATE OR DELETE ON region_interests
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_region_stats_interests();

-- 7. VUES OPTIMISÉES POUR LES RÉGIONS
-- =====================================================

-- Vue catalogue des régions avec statistiques
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
    
    -- Packs actifs dans cette région (array)
    COALESCE(
        array_agg(
            DISTINCT jsonb_build_object(
                'id', p.id,
                'title', p.title,
                'price', p.price,
                'currency', p.currency,
                'duration_days', p.duration_days,
                'difficulty_level', p.difficulty_level,
                'image_url', (
                    SELECT pi.image_url 
                    FROM pack_images pi 
                    WHERE pi.pack_id = p.id AND pi.is_primary = true 
                    LIMIT 1
                )
            )
        ) FILTER (WHERE p.id IS NOT NULL),
        '{}'::jsonb[]
    ) as featured_packs,
    
    -- Intérêts populaires de cette région (array)
    COALESCE(
        array_agg(
            DISTINCT jsonb_build_object(
                'id', i.id,
                'name', i.name,
                'emoji', i.emoji,
                'category', i.category,
                'is_popular', ri.is_popular
            )
        ) FILTER (WHERE i.id IS NOT NULL),
        '{}'::jsonb[]
    ) as region_interests

FROM regions r
LEFT JOIN packs p ON p.region_id = r.id AND p.status = 'active'
LEFT JOIN region_interests ri ON ri.region_id = r.id
LEFT JOIN interests i ON i.id = ri.interest_id
WHERE r.is_active = true
GROUP BY r.id, r.name, r.description, r.short_description, r.image_url, 
         r.coordinates_lat, r.coordinates_lng, r.slug, r.meta_title, 
         r.meta_description, r.total_packs, r.total_interests, 
         r.total_partners, r.best_season_start, r.best_season_end,
         r.climate_info, r.access_info, r.display_order, r.created_at, r.updated_at
ORDER BY r.display_order ASC, r.name ASC;

-- Vue détaillée d'une région
CREATE OR REPLACE VIEW region_detail_view AS
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
    
    -- Tous les packs de cette région avec détails
    COALESCE(
        (SELECT jsonb_agg(
            jsonb_build_object(
                'id', p.id,
                'title', p.title,
                'description', p.description,
                'short_description', p.short_description,
                'price', p.price,
                'currency', p.currency,
                'duration_days', p.duration_days,
                'max_participants', p.max_participants,
                'min_participants', p.min_participants,
                'difficulty_level', p.difficulty_level,
                'location', p.location,
                'average_rating', p.average_rating,
                'total_reviews', p.total_reviews,
                'images', (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'url', pi.image_url,
                            'alt_text', pi.alt_text,
                            'is_primary', pi.is_primary
                        ) ORDER BY pi.display_order
                    )
                    FROM pack_images pi
                    WHERE pi.pack_id = p.id
                )
            ) ORDER BY p.created_at DESC
        )
        FROM packs p
        WHERE p.region_id = r.id AND p.status = 'active'),
        '[]'::jsonb
    ) as all_packs,
    
    -- Tous les intérêts avec détails
    COALESCE(
        (SELECT jsonb_agg(
            jsonb_build_object(
                'id', i.id,
                'name', i.name,
                'emoji', i.emoji,
                'category', i.category,
                'description', i.description,
                'is_popular', ri.is_popular,
                'notes', ri.notes
            ) ORDER BY ri.is_popular DESC, ri.display_order ASC, i.name ASC
        )
        FROM region_interests ri
        JOIN interests i ON i.id = ri.interest_id
        WHERE ri.region_id = r.id),
        '[]'::jsonb
    ) as all_interests,
    
    -- Partenaires de cette région
    COALESCE(
        (SELECT jsonb_agg(
            jsonb_build_object(
                'id', pt.id,
                'name', pt.name,
                'type', pt.type,
                'description', pt.description,
                'logo_url', pt.logo_url,
                'website', pt.website,
                'phone', pt.phone,
                'email', pt.email
            ) ORDER BY pt.name ASC
        )
        FROM partners pt
        WHERE pt.region_id = r.id AND pt.is_active = true),
        '[]'::jsonb
    ) as partners

FROM regions r
WHERE r.is_active = true;

-- Vue admin avec toutes les informations
CREATE OR REPLACE VIEW regions_admin_view AS
SELECT 
    r.*,
    u.email as created_by_email,
    
    -- Compter les éléments liés
    (SELECT COUNT(*) FROM packs WHERE region_id = r.id) as total_packs_all,
    (SELECT COUNT(*) FROM packs WHERE region_id = r.id AND status = 'active') as total_packs_active,
    (SELECT COUNT(*) FROM region_interests WHERE region_id = r.id) as total_region_interests,
    (SELECT COUNT(*) FROM partners WHERE region_id = r.id) as total_region_partners,
    
    -- Dernière mise à jour des statistiques
    r.updated_at as stats_updated_at

FROM regions r
LEFT JOIN users u ON u.id = r.created_by
ORDER BY r.display_order ASC, r.name ASC;

-- 8. POLITIQUES RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Activer RLS sur les nouvelles tables
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE region_interests ENABLE ROW LEVEL SECURITY;

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

-- 9. DONNÉES DE DÉMONSTRATION - RÉGIONS DE MADAGASCAR
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
5);

-- 10. ASSOCIER LES INTÉRÊTS AUX RÉGIONS
-- =====================================================

-- Insérer les associations région-intérêts selon la logique géographique
WITH region_mappings AS (
    SELECT 
        r.id as region_id,
        r.name as region_name,
        i.id as interest_id,
        i.name as interest_name,
        i.category as interest_category
    FROM regions r
    CROSS JOIN interests i
    WHERE r.name IN ('Nord de Madagascar', 'Hautes Terres Centrales', 'Côte Est Tropicale', 'Ouest - Terres Sauvages', 'Grand Sud Aride')
)
INSERT INTO region_interests (region_id, interest_id, is_popular, display_order)
SELECT 
    rm.region_id,
    rm.interest_id,
    CASE 
        -- Nord de Madagascar - Activités populaires
        WHEN rm.region_name = 'Nord de Madagascar' AND rm.interest_name IN 
            ('Randonnée dans les Tsingy', 'Observation des lémuriens', 'Spéléologie', 'Trekking en montagne', 'Photographie nature', 'Ornithologie') 
            THEN true
        
        -- Hautes Terres Centrales - Activités populaires  
        WHEN rm.region_name = 'Hautes Terres Centrales' AND rm.interest_name IN 
            ('Visite culturelle', 'Artisanat local', 'Randonnée en montagne', 'Marché traditionnel', 'Photographie nature')
            THEN true
            
        -- Côte Est - Activités populaires
        WHEN rm.region_name = 'Côte Est Tropicale' AND rm.interest_name IN 
            ('Observation des lémuriens', 'Randonnée en forêt tropicale', 'Plongée sous-marine', 'Snorkeling', 'Détente plage', 'Observation des baleines')
            THEN true
            
        -- Ouest - Activités populaires
        WHEN rm.region_name = 'Ouest - Terres Sauvages' AND rm.interest_name IN 
            ('Safari photo', 'Randonnée dans les Tsingy', 'Observation des baobabs', 'Coucher de soleil', 'Photographie nature')
            THEN true
            
        -- Sud - Activités populaires
        WHEN rm.region_name = 'Grand Sud Aride' AND rm.interest_name IN 
            ('Trekking en montagne', 'Safari photo', 'Visite culturelle', 'Observation des baobabs', 'Astronomie')
            THEN true
            
        ELSE false
    END as is_popular,
    
    -- Ordre d'affichage basé sur la popularité et la catégorie
    CASE rm.interest_category
        WHEN 'nature' THEN 1
        WHEN 'aventure' THEN 2  
        WHEN 'culture' THEN 3
        WHEN 'detente' THEN 4
        WHEN 'sport' THEN 5
        ELSE 6
    END as display_order
    
FROM region_mappings rm
WHERE (
    -- Nord : toutes les activités nature et aventure + culturelles spécifiques
    (rm.region_name = 'Nord de Madagascar' AND rm.interest_category IN ('nature', 'aventure', 'culture')) OR
    
    -- Hautes Terres : focus culture + nature de montagne
    (rm.region_name = 'Hautes Terres Centrales' AND (rm.interest_category IN ('culture', 'nature') OR rm.interest_name LIKE '%montagne%')) OR
    
    -- Côte Est : nature + détente + sports aquatiques
    (rm.region_name = 'Côte Est Tropicale' AND rm.interest_category IN ('nature', 'detente', 'sport')) OR
    
    -- Ouest : nature + aventure
    (rm.region_name = 'Ouest - Terres Sauvages' AND rm.interest_category IN ('nature', 'aventure')) OR
    
    -- Sud : aventure + culture + nature spécialisée
    (rm.region_name = 'Grand Sud Aride' AND (rm.interest_category IN ('aventure', 'culture') OR rm.interest_name IN ('Observation des baobabs', 'Safari photo', 'Astronomie')))
);

-- 11. MISE À JOUR DES STATISTIQUES INITIALES
-- =====================================================

-- Mettre à jour les statistiques de toutes les régions
SELECT update_region_stats(id) FROM regions;

-- 12. CRÉATION D'UNE FONCTION POUR OBTENIR LES RÉGIONS AVEC PACKS
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
        COUNT(p.id) as total_packs,
        COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_packs,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'name', i.name,
                    'emoji', i.emoji,
                    'category', i.category
                )
            ) FILTER (WHERE ri.is_popular = true AND i.id IS NOT NULL),
            '[]'::jsonb
        ) as popular_interests
    FROM regions r
    LEFT JOIN packs p ON p.region_id = r.id
    LEFT JOIN region_interests ri ON ri.region_id = r.id AND ri.is_popular = true
    LEFT JOIN interests i ON i.id = ri.interest_id
    WHERE r.is_active = true
    GROUP BY r.id, r.name, r.description, r.short_description, r.image_url, r.slug
    ORDER BY r.display_order ASC, r.name ASC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FIN DU SCRIPT - SYSTÈME DE RÉGIONS COMPLET
-- =====================================================

-- Vérification finale
SELECT 
    'Régions créées' as action,
    COUNT(*) as count
FROM regions
UNION ALL
SELECT 
    'Associations région-intérêts créées' as action,
    COUNT(*) as count  
FROM region_interests
UNION ALL
SELECT 
    'Vues créées' as action,
    COUNT(*) as count
FROM information_schema.views 
WHERE table_name LIKE '%region%';