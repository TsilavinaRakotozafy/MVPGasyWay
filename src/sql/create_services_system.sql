-- =================================================================
-- SYSTÈME DE SERVICES COMPLET POUR GASYWAY
-- =================================================================
-- Ce script crée la table services et met à jour les relations existantes

-- 1. Table principale des services
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(100), -- 'transport', 'accommodation', 'food', 'activity', 'guide', 'equipment', 'insurance', 'other'
    icon VARCHAR(50), -- Nom de l'icône (ex: 'car', 'bed', 'utensils')
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Mise à jour de la table pack_services pour référencer les services
-- Nous gardons la colonne service_name pour la rétrocompatibilité
ALTER TABLE pack_services 
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id),
ADD COLUMN IF NOT EXISTS notes TEXT; -- Notes spécifiques pour ce service dans ce pack

-- 3. Table pour les services par jour d'itinéraire
CREATE TABLE IF NOT EXISTS pack_itinerary_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_id UUID NOT NULL REFERENCES pack_itinerary(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    is_included BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(itinerary_id, service_id)
);

-- 4. Index pour les performances
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_pack_services_service_id ON pack_services(service_id);
CREATE INDEX IF NOT EXISTS idx_pack_itinerary_services_itinerary ON pack_itinerary_services(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_pack_itinerary_services_service ON pack_itinerary_services(service_id);

-- 5. Fonctions de mise à jour automatique
CREATE OR REPLACE FUNCTION update_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_services_updated_at();

-- 6. RLS (Row Level Security)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE pack_itinerary_services ENABLE ROW LEVEL SECURITY;

-- Policies pour services (lecture publique, écriture admin)
CREATE POLICY "Services are viewable by everyone" ON services
    FOR SELECT USING (true);

CREATE POLICY "Services are editable by admins" ON services
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM users WHERE role = 'admin'
        )
    );

-- Policies pour pack_itinerary_services
CREATE POLICY "Itinerary services are viewable by everyone" ON pack_itinerary_services
    FOR SELECT USING (true);

CREATE POLICY "Itinerary services are editable by admins" ON pack_itinerary_services
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM users WHERE role = 'admin'
        )
    );

-- 7. Insertion des services de base
INSERT INTO services (name, description, category, icon) VALUES 
-- Transport
('Transport privé', 'Véhicule privé avec chauffeur', 'transport', 'car'),
('Transport public', 'Bus, taxi-brousse collectif', 'transport', 'bus'),
('Transfert aéroport', 'Transfert depuis/vers l''aéroport', 'transport', 'plane'),
('Location de véhicule', 'Véhicule de location à disposition', 'transport', 'car-front'),
('Carburant', 'Essence/Diesel pour les trajets', 'transport', 'fuel'),

-- Hébergement
('Hôtel 3 étoiles', 'Hébergement en hôtel standard', 'accommodation', 'bed'),
('Hôtel 4-5 étoiles', 'Hébergement en hôtel de luxe', 'accommodation', 'crown'),
('Lodge/Écolodge', 'Hébergement en lodge écologique', 'accommodation', 'tree-pine'),
('Camping', 'Nuitée en camping/tente', 'accommodation', 'tent'),
('Chez l''habitant', 'Hébergement chez des locaux', 'accommodation', 'home'),

-- Repas
('Petit-déjeuner', 'Petit-déjeuner inclus', 'food', 'coffee'),
('Déjeuner', 'Repas de midi inclus', 'food', 'utensils'),
('Dîner', 'Repas du soir inclus', 'food', 'chef-hat'),
('Pique-nique', 'Repas à emporter pour excursions', 'food', 'sandwich'),
('Eau minérale', 'Bouteilles d''eau pendant le voyage', 'food', 'bottle'),

-- Guides et accompagnement
('Guide local francophone', 'Guide local parlant français', 'guide', 'user-check'),
('Guide spécialisé nature', 'Guide expert faune/flore', 'guide', 'binoculars'),
('Guide de montagne', 'Guide spécialisé trekking/escalade', 'guide', 'mountain'),
('Accompagnateur photographe', 'Guide spécialisé photographie', 'guide', 'camera'),

-- Activités et entrées
('Entrées parcs nationaux', 'Droits d''entrée dans les parcs', 'activity', 'trees'),
('Randonnée guidée', 'Trekking avec guide expérimenté', 'activity', 'footprints'),
('Observation baleines', 'Sortie en mer pour voir les baleines', 'activity', 'waves'),
('Plongée/Snorkeling', 'Équipement et sortie plongée', 'activity', 'fish'),
('Visite culturelle', 'Découverte sites culturels/historiques', 'activity', 'landmark'),

-- Équipements
('Matériel de randonnée', 'Sacs, bâtons, équipements de marche', 'equipment', 'backpack'),
('Équipement camping', 'Tentes, sacs de couchage, matelas', 'equipment', 'tent'),
('Matériel d''observation', 'Jumelles, guides d''identification', 'equipment', 'eye'),
('Équipement photo', 'Matériel professionnel de photographie', 'equipment', 'camera'),

-- Assurances et services
('Assurance voyage', 'Couverture médicale et rapatriement', 'insurance', 'shield'),
('Assistance 24h/24', 'Support téléphonique permanent', 'insurance', 'phone-call'),
('Frais médicaux', 'Consultation médicale si nécessaire', 'insurance', 'plus-square'),

-- Exclusions communes
('Vols internationaux', 'Billets d''avion international', 'transport', 'plane-takeoff'),
('Boissons alcoolisées', 'Boissons alcoolisées aux repas', 'food', 'wine'),
('Achats personnels', 'Souvenirs, achats individuels', 'other', 'shopping-bag'),
('Pourboires', 'Tips pour guides et chauffeurs', 'other', 'coins'),
('Visa et formalités', 'Frais de visa et documents', 'other', 'file-text')

ON CONFLICT (name) DO NOTHING;

-- 8. Vue pratique pour les services par catégorie
CREATE OR REPLACE VIEW services_by_category AS
SELECT 
    category,
    COUNT(*) as service_count,
    array_agg(
        json_build_object(
            'id', id,
            'name', name,
            'description', description,
            'icon', icon,
            'is_active', is_active
        ) ORDER BY name
    ) as services
FROM services 
WHERE is_active = true
GROUP BY category
ORDER BY category;

-- 9. Fonction pour migrer les anciens pack_services vers le nouveau système
CREATE OR REPLACE FUNCTION migrate_pack_services()
RETURNS void AS $$
DECLARE
    pack_service_record RECORD;
    service_uuid UUID;
BEGIN
    -- Pour chaque pack_service existant sans service_id
    FOR pack_service_record IN 
        SELECT * FROM pack_services WHERE service_id IS NULL
    LOOP
        -- Chercher un service existant avec le même nom
        SELECT id INTO service_uuid 
        FROM services 
        WHERE LOWER(name) = LOWER(pack_service_record.service_name)
        LIMIT 1;
        
        -- Si pas trouvé, créer un nouveau service
        IF service_uuid IS NULL THEN
            INSERT INTO services (name, category, is_active)
            VALUES (pack_service_record.service_name, 'other', true)
            RETURNING id INTO service_uuid;
        END IF;
        
        -- Mettre à jour le pack_service avec la référence
        UPDATE pack_services 
        SET service_id = service_uuid
        WHERE id = pack_service_record.id;
    END LOOP;
    
    RAISE NOTICE 'Migration des pack_services terminée';
END;
$$ LANGUAGE plpgsql;

-- Exécuter la migration
SELECT migrate_pack_services();

-- 10. Vérifications finales
DO $$
BEGIN
    RAISE NOTICE 'Services créés: %', (SELECT COUNT(*) FROM services);
    RAISE NOTICE 'Services par catégorie: %', (
        SELECT string_agg(category || ': ' || service_count::text, ', ')
        FROM services_by_category
    );
    RAISE NOTICE 'Pack services migrés: %', (
        SELECT COUNT(*) FROM pack_services WHERE service_id IS NOT NULL
    );
END $$;