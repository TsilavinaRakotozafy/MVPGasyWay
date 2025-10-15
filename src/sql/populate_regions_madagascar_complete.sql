-- =====================================================
-- POPULATION COMPLÈTE DES RÉGIONS DE MADAGASCAR
-- Basée sur les données visibles dans l'interface admin
-- =====================================================

-- Insertion ou mise à jour des régions principales
INSERT INTO regions (
    id,
    name, 
    description,
    short_description,
    image_url,
    coordinates_lat,
    coordinates_lng,
    is_active,
    display_order,
    slug,
    meta_title,
    meta_description,
    best_season_start,
    best_season_end,
    climate_info,
    access_info,
    total_packs,
    total_interests,
    total_partners,
    created_at,
    updated_at
) VALUES 
-- 1. NORD DE MADAGASCAR
(
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'Nord de Madagascar',
    'Territoire exotique où l''histoire de l''île naît avec des merveilles géologiques uniques, des réserves endémiques exceptionnelles et des biodiversités spectaculaires.',
    'Tsingy et réserves endémiques. Accès depuis Antananarivo (4h30), puis Ankarana.',
    'https://images.unsplash.com/photo-1738803232667-241cd72c4715?w=600&h=400&fit=crop',
    -12.2794,
    49.2919,
    true,
    1,
    'nord-madagascar',
    'Nord de Madagascar - Tsingy d''Ankarana et Biodiversité',
    'Découvrez les merveilles géologiques du Nord de Madagascar : Tsingy d''Ankarana, réserves endémiques et biodiversité spectaculaire',
    '04',  -- Avril
    '11',  -- Novembre (saison sèche)
    'Climat tropical sec. Saison sèche d''avril à novembre, idéale pour l''exploration des Tsingy. Températures: 25-30°C.',
    'Accessible depuis Antananarivo par route (4h30) via Ambilobe. Aéroport d''Antsiranana (Diego Suarez) pour vols domestiques.',
    6,    -- 6 packs
    3,    -- 3 intérêts 
    1,    -- 1 partenaire
    '2025-01-01 00:00:00+00',
    '2025-01-01 00:00:00+00'
),

-- 2. HAUTES TERRES CENTRALES  
(
    'f47ac10b-58cc-4372-a567-0e02b2c3d480',
    'Hautes Terres Centrales',
    'Cœur historique et culturel de Madagascar. Antananarivo et sa région regorgent de trésors architecturaux, de traditions malgaches et de paysages montagneux à couper le souffle.',
    'Centre culturel d''Antananarivo et montagnes environnantes. Température 18-24°C.',
    'https://images.unsplash.com/photo-1624272909636-4995421e37e7?w=600&h=400&fit=crop',
    -18.8792,
    47.5079,
    true,
    2,
    'hautes-terres-centrales',
    'Hautes Terres Centrales - Antananarivo et Patrimoine Culturel',
    'Explorez le cœur culturel de Madagascar : Antananarivo, traditions malgaches et paysages montagneux',
    '03',  -- Mars
    '10',  -- Octobre
    'Climat tempéré d''altitude. Saison sèche de mars à octobre. Températures fraîches: 18-24°C. Nuits peuvent être fraîches.',
    'Hub principal avec l''aéroport international d''Ivato. Centre névralgique pour toutes les connexions vers les autres régions.',
    5,    -- 5 packs
    4,    -- 4 intérêts
    2,    -- 2 partenaires  
    '2025-01-01 00:00:00+00',
    '2025-01-01 00:00:00+00'
),

-- 3. CÔTE EST TROPICALE
(
    'f47ac10b-58cc-4372-a567-0e02b2c3d481', 
    'Côte Est Tropicale',
    'Rivages tropicaux, canaux d''origine coloniale et paysages enchanteurs. La côte est dévoile ses charmes à travers des écosystèmes préservés et des plages paradisiaques.',
    'Plages tropicales, canaux d''époque coloniale. Accessible toute l''année.',
    'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&h=400&fit=crop',
    -17.9139,
    49.4056,
    true,
    3,
    'cote-est-tropicale',
    'Côte Est Tropicale - Canaux et Plages Paradisiaques',
    'Découvrez la côte est tropicale de Madagascar : canaux coloniaux, plages paradisiaques et écosystèmes préservés',
    '05',  -- Mai
    '09',  -- Septembre
    'Climat tropical humide. Saison sèche mai-septembre recommandée. Températures: 24-28°C. Cyclones possibles déc-mars.',
    'Accessible via Toamasina (port principal) par route depuis Antananarivo (3h). Train FCE disponible (plus lent mais pittoresque).',
    4,    -- 4 packs
    2,    -- 2 intérêts
    1,    -- 1 partenaire
    '2025-01-01 00:00:00+00', 
    '2025-01-01 00:00:00+00'
),

-- 4. NOSY BE ET ÎLES DU NORD
(
    'f47ac10b-58cc-4372-a567-0e02b2c3d482',
    'Nosy Be et Îles du Nord',
    'Archipel paradisiaque aux eaux turquoise et plages de sable blanc. Nosy Be, l''île aux parfums, offre détente, plongée et découverte de la vanille et ylang-ylang.',
    'Île aux parfums, plages de sable blanc et eaux turquoise. Vol direct depuis Paris.',
    'https://images.unsplash.com/photo-1687360433534-eb696fe4e49e?w=600&h=400&fit=crop',
    -13.3667,
    48.2667,
    true,
    4,
    'nosy-be-iles-nord',
    'Nosy Be - Île aux Parfums et Plages Paradisiaques',
    'Séjour à Nosy Be, l''île aux parfums : plages de rêve, plongée, vanille et ylang-ylang dans l''océan Indien',
    '04',  -- Avril
    '11',  -- Novembre  
    'Climat tropical maritime. Saison sèche avril-novembre idéale. Températures: 26-30°C. Alizés rafraîchissants.',
    'Aéroport international de Fascene avec vols directs depuis Paris. Liaison bateau depuis Ankify (côte ouest, 1h).',
    8,    -- 8 packs
    3,    -- 3 intérêts
    3,    -- 3 partenaires
    '2025-01-01 00:00:00+00',
    '2025-01-01 00:00:00+00'
),

-- 5. SUD-OUEST ARIDE
(
    'f47ac10b-58cc-4372-a567-0e02b2c3d483',
    'Sud-Ouest Aride', 
    'Terre de contrastes aux paysages lunaires et forêts d''épineux uniques au monde. Baobabs centenaires et culture Bara offrent une expérience authentique.',
    'Allée des Baobabs et paysages désertiques uniques. Culture Bara authentique.',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop',
    -23.3500,
    44.2833,
    true,
    5,
    'sud-ouest-aride',
    'Sud-Ouest Aride - Allée des Baobabs et Culture Bara',
    'Explorez le Sud-Ouest de Madagascar : Allée des Baobabs, paysages lunaires et culture Bara authentique',
    '03',  -- Mars
    '11',  -- Novembre
    'Climat semi-aride. Saison sèche mars-novembre. Températures: 20-35°C. Nuits fraîches en hiver (juin-août).',
    'Route depuis Antananarivo via Antsirabe et Morondava (8-10h). Aéroport de Morondava pour vols domestiques.',
    3,    -- 3 packs
    2,    -- 2 intérêts 
    1,    -- 1 partenaire
    '2025-01-01 00:00:00+00',
    '2025-01-01 00:00:00+00'
),

-- 6. EST LUXURIANT (ANDASIBE-MANTADIA)
(
    'f47ac10b-58cc-4372-a567-0e02b2c3d484',
    'Est Luxuriant - Andasibe',
    'Forêt primaire tropicale abritant les plus grands lémuriens de Madagascar, les Indri-Indri. Symphonie naturelle et biodiversité exceptionnelle.',
    'Forêt primaire et lémuriens Indri-Indri. 3h d''Antananarivo.',
    'https://images.unsplash.com/photo-1700077254075-c426ed0caafa?w=600&h=400&fit=crop',
    -18.9369,
    48.4247,
    true,
    6,
    'est-luxuriant-andasibe',
    'Andasibe-Mantadia - Indri-Indri et Forêt Primaire',
    'Découvrez Andasibe-Mantadia : rencontre avec les Indri-Indri dans la forêt primaire tropicale de Madagascar',
    '04',  -- Avril
    '10',  -- Octobre
    'Climat tropical humide. Saison sèche avril-octobre recommandée. Températures: 20-25°C. Brumes matinales fréquentes.',
    'Route depuis Antananarivo (3h) via RN2. Accessible en transport public ou véhicule 4x4.',
    4,    -- 4 packs
    2,    -- 2 intérêts
    1,    -- 1 partenaire
    '2025-01-01 00:00:00+00',
    '2025-01-01 00:00:00+00'
)

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    short_description = EXCLUDED.short_description, 
    image_url = EXCLUDED.image_url,
    coordinates_lat = EXCLUDED.coordinates_lat,
    coordinates_lng = EXCLUDED.coordinates_lng,
    is_active = EXCLUDED.is_active,
    display_order = EXCLUDED.display_order,
    slug = EXCLUDED.slug,
    meta_title = EXCLUDED.meta_title,
    meta_description = EXCLUDED.meta_description,
    best_season_start = EXCLUDED.best_season_start,
    best_season_end = EXCLUDED.best_season_end,
    climate_info = EXCLUDED.climate_info,
    access_info = EXCLUDED.access_info,
    total_packs = EXCLUDED.total_packs,
    total_interests = EXCLUDED.total_interests,
    total_partners = EXCLUDED.total_partners,
    updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- ACTIVATION DU DÉCLENCHEUR DE MISE À JOUR
-- =====================================================

-- Trigger pour updated_at automatique
CREATE OR REPLACE FUNCTION update_regions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger s'il n'existe pas
DROP TRIGGER IF EXISTS regions_updated_at_trigger ON regions;
CREATE TRIGGER regions_updated_at_trigger
    BEFORE UPDATE ON regions
    FOR EACH ROW
    EXECUTE FUNCTION update_regions_updated_at();

-- =====================================================
-- VÉRIFICATION ET STATISTIQUES
-- =====================================================

-- Afficher le résultat
DO $$
DECLARE
    region_count INTEGER;
    active_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO region_count FROM regions;
    SELECT COUNT(*) INTO active_count FROM regions WHERE is_active = true;
    
    RAISE NOTICE '✅ Régions créées/mises à jour avec succès!';
    RAISE NOTICE '📊 Total régions: %', region_count;
    RAISE NOTICE '🟢 Régions actives: %', active_count;
    RAISE NOTICE '📍 Régions disponibles:';
    
    FOR region_record IN (
        SELECT name, total_packs, is_active 
        FROM regions 
        ORDER BY display_order
    ) LOOP
        RAISE NOTICE '   • % (% packs) - %', 
            region_record.name, 
            region_record.total_packs,
            CASE WHEN region_record.is_active THEN 'Active' ELSE 'Inactive' END;
    END LOOP;
END $$;