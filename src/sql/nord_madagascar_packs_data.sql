-- ===============================================
-- PACKS NORD MADAGASCAR - DONNÉES COMPLÈTES 🌴
-- Excursions authentiques du Nord de Madagascar
-- ===============================================

-- 🧹 PHASE 1: NETTOYAGE PRÉVENTIF
-- ================================

DO $$
BEGIN
  RAISE NOTICE '🧹 NETTOYAGE DES DONNÉES EXISTANTES...';
  
  -- Supprimer les données existantes dans l'ordre des dépendances
  DELETE FROM pack_itinerary;
  DELETE FROM pack_services;
  DELETE FROM pack_images;
  DELETE FROM packs;
  DELETE FROM pack_categories;
  
  RAISE NOTICE '✅ Nettoyage terminé';
END $$;

-- 🏷️ PHASE 2: INSERTION DES CATÉGORIES
-- ======================================

INSERT INTO pack_categories (id, name, description, icon) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Aventure Marine', 'Découverte des merveilles marines du Nord', '🌊'),
  ('22222222-2222-2222-2222-222222222222', 'Géologie & Tsingy', 'Exploration des formations géologiques uniques', '🏔️'),
  ('33333333-3333-3333-3333-333333333333', 'Bivouac & Nature', 'Immersion totale dans la nature sauvage', '🏕️'),
  ('44444444-4444-4444-4444-444444444444', 'Parcs Nationaux', 'Découverte de la biodiversité malgache', '🦋'),
  ('55555555-5555-5555-5555-555555555555', 'Panoramas & Montagnes', 'Vues spectaculaires et randonnées', '⛰️');

-- 🎒 PHASE 3: INSERTION DES PACKS
-- ================================

INSERT INTO packs (
  id, title, description, short_description, price, duration_days, 
  max_participants, min_participants, location, coordinates_lat, coordinates_lng,
  category_id, status, difficulty_level, season_start, season_end, cancellation_policy
) VALUES

-- PACK 1: Mer d'Émeraude Express (1 jour)
(
  'a1111111-1111-1111-1111-111111111111',
  'Mer d''Émeraude Express - Journée Paradisiaque',
  'Découvrez en une journée les eaux turquoise légendaires de la Mer d''Émeraude, véritable joyau du Nord de Madagascar. Cette excursion vous emmène dans un décor de rêve où se mélangent îlots coralliens, mangroves mystérieuses et plages de sable blanc immaculé. Navigation en pirogue traditionnelle à travers des canaux naturels bordés de mangroves centenaires, baignade dans des eaux cristallines aux reflets émeraude, snorkeling parmi les coraux multicolores. Déjeuner pique-nique sur un îlot désert avec vue panoramique sur l''océan Indien. Guide local expert de la région partageant les secrets de cet écosystème unique.',
  'Mer d''Émeraude en pirogue traditionnelle, snorkeling et déjeuner sur îlot',
  180000.00, 1, 12, 2, 'Ramena - Mer d''Émeraude', -12.2667, 49.4167,
  '11111111-1111-1111-1111-111111111111', 'active', 'easy', '04-01', '11-30',
  'Annulation gratuite jusqu''à 24h avant le départ. Remboursement partiel (50%) entre 24h et 12h.'
),

-- PACK 2: Tsingy Rouge Découverte (1 jour)
(
  'a2222222-2222-2222-2222-222222222222',
  'Tsingy Rouge - Merveille Géologique',
  'Aventure exceptionnelle au cœur des Tsingy Rouge d''Irodo, formation géologique unique au monde créée par l''érosion sur des millions d''années. Ces cathédrales de grès rouge offrent un spectacle saisissant avec leurs pics acérés et leurs canyons colorés. Randonnée guidée à travers ce labyrinthe naturel, découverte des processus géologiques fascinants, observation de la flore endémique adaptée à ce milieu hostile. Points de vue spectaculaires pour la photographie, exploration de grottes naturelles. La lumière dorée du coucher de soleil transforme le site en un paysage martien inoubliable.',
  'Exploration des formations géologiques rouges uniques et randonnée guidée',
  165000.00, 1, 15, 3, 'Irodo - Tsingy Rouge', -12.5333, 49.3167,
  '22222222-2222-2222-2222-222222222222', 'active', 'medium', '04-01', '12-31',
  'Annulation gratuite jusqu''à 48h avant le départ. Conditions météo applicables.'
),

-- PACK 3: Ankarana Express (2 jours)
(
  'a3333333-3333-3333-3333-333333333333',
  'Ankarana Express - Tsingy et Grottes',
  'Immersion intensive de 2 jours dans le Parc National d''Ankarana, royaume des tsingy et des grottes mystérieuses. Jour 1: Exploration des Petits Tsingy avec équipement de via ferrata, découverte des grottes d''Andrafiabe aux formations calcaires spectaculaires, observation de la faune nocturne (lémuriens, chauves-souris). Jour 2: Randonnée aux Grands Tsingy, passages sur ponts suspendus naturels, exploration de la grotte des crocodiles sacrés, rencontre avec les communautés locales Antankarana. Bivouac sous les étoiles au cœur du parc avec feu de camp traditionnel.',
  'Exploration complète d''Ankarana: tsingy, grottes, faune et bivouac',
  420000.00, 2, 10, 4, 'Parc National Ankarana', -12.9167, 49.1167,
  '44444444-4444-4444-4444-444444444444', 'active', 'hard', '04-15', '11-15',
  'Annulation gratuite jusqu''à 72h avant. Matériel de via ferrata fourni.'
),

-- PACK 4: Montagne des Français Panorama (2 jours)
(
  'a4444444-4444-4444-4444-444444444444',
  'Montagne des Français - Panorama Exceptionnel',
  'Ascension de la mythique Montagne des Français pour des panoramas à 360° sur la baie de Diego Suarez et l''océan Indien. Jour 1: Randonnée à travers la forêt sèche endémique, observation de baobabs centenaires, découverte de l''histoire militaire du site (fortifications françaises). Jour 2: Lever de soleil depuis le sommet (426m), exploration de la grotte de Milaintety, descente par les sentiers botaniques avec guide naturaliste. Hébergement en lodge écologique avec vue mer. Dégustation de rhum arrangé local et spécialités culinaires du Nord.',
  'Ascension panoramique avec vues exceptionnelles et découvertes historiques',
  385000.00, 2, 12, 3, 'Montagne des Français', -12.2833, 49.3500,
  '55555555-5555-5555-5555-555555555555', 'active', 'medium', '03-01', '12-15',
  'Annulation gratuite jusqu''à 48h avant. Guide naturaliste inclus.'
),

-- PACK 5: Nosy Hara Sauvage (3 jours)
(
  'a5555555-5555-5555-5555-555555555555',
  'Nosy Hara - Archipel Sauvage et Préservé',
  'Expédition de 3 jours dans l''archipel secret de Nosy Hara, réserve spéciale préservée de toute influence humaine. Jour 1: Navigation vers l''archipel, installation du campement sur plage déserte, exploration de la mangrove en kayak. Jour 2: Randonnée dans la forêt primaire à la recherche de lémuriens endémiques, snorkeling dans des récifs coralliens intacts, pêche traditionnelle avec les pêcheurs locaux. Jour 3: Exploration des grottes marines accessibles uniquement à marée basse, observation d''oiseaux marins (frégates, paille-en-queue), cérémonie d''adieu avec la communauté locale. Bivouac sous tente avec vue sur les étoiles australes.',
  'Expédition sauvage en archipel préservé avec bivouac et snorkeling',
  680000.00, 3, 8, 4, 'Archipel Nosy Hara', -12.2167, 49.2833,
  '11111111-1111-1111-1111-111111111111', 'active', 'hard', '05-01', '10-31',
  'Annulation gratuite jusqu''à 7 jours avant. Matériel de camping fourni.'
),

-- PACK 6: Les Trois Baies Légendaires (3 jours)
(
  'a6666666-6666-6666-6666-666666666666',
  'Circuit des Trois Baies - Sakalava, Dunes et Français',
  'Circuit complet des trois baies mythiques du Nord: Baie des Sakalava, Baie des Dunes et Baie des Français. Jour 1: Baie des Sakalava avec ses eaux turquoise et ses villages de pêcheurs authentiques, initiation à la pêche traditionnelle, déjeuner chez l''habitant. Jour 2: Baie des Dunes avec ses formations sableuses mouvantes, sandboarding, observation du coucher de soleil depuis les dunes, bivouac nomade. Jour 3: Baie des Français et ses influences coloniales, visite du marché local, exploration des mangroves en pirogue, cérémonie de clôture avec danses traditionnelles sakalava.',
  'Circuit des trois baies avec immersion culturelle et activités nautiques',
  595000.00, 3, 10, 4, 'Trois Baies - Diego Suarez', -12.2667, 49.4000,
  '11111111-1111-1111-1111-111111111111', 'active', 'medium', '04-01', '11-30',
  'Annulation gratuite jusqu''à 5 jours avant. Hébergement varié inclus.'
),

-- PACK 7: Windsor Castle Adventure (4 jours)
(
  'a7777777-7777-7777-7777-777777777777',
  'Windsor Castle - Citadelle Naturelle et Bivouac',
  'Expédition de 4 jours vers la formation rocheuse spectaculaire de Windsor Castle, véritable citadelle naturelle sculptée par l''érosion. Jour 1: Approche par la forêt sèche, installation du camp de base, reconnaissance du terrain. Jour 2: Ascension technique vers les sommets avec équipement d''escalade, exploration des cavités et arches naturelles. Jour 3: Randonnée panoramique sur les crêtes, observation de la faune endémique (fossa, tenrecs), initiation à la spéléologie dans les grottes calcaires. Jour 4: Descente en rappel depuis les falaises, cérémonie de l''eau sacrée avec les anciens du village. Bivouac d''aventure avec cuisine au feu de bois et contes malgaches sous les étoiles.',
  'Escalade et exploration d''une citadelle naturelle avec bivouac d''aventure',
  820000.00, 4, 6, 3, 'Windsor Castle', -12.3167, 49.2667,
  '33333333-3333-3333-3333-333333333333', 'active', 'hard', '05-01', '10-15',
  'Annulation gratuite jusqu''à 10 jours avant. Équipement d''escalade fourni.'
),

-- PACK 8: Cap d'Ambre Intégral (5 jours)
(
  'a8888888-8888-8888-8888-888888888888',
  'Cap d''Ambre Intégral - Extrême Nord Sauvage',
  'Expédition complète de 5 jours vers le point le plus septentrional de Madagascar, territoire sauvage et préservé du Cap d''Ambre. Jour 1: Départ de Diego Suarez, traversée des villages antankarana, installation du campement avancé. Jour 2: Randonnée vers les phares du Cap, observation des baleines à bosse (saison), exploration des criques secrètes. Jour 3: Plongée en apnée dans les récifs du Cap, rencontre avec les pêcheurs nomades, collecte d''ambre fossilisé sur les plages. Jour 4: Ascension du mont Cap d''Ambre, exploration de la forêt humide relique, nuit en hamac dans la canopée. Jour 5: Cérémonie de bénédiction avec les sorciers locaux, retour par la côte sauvage avec arrêts photo spectaculaires.',
  'Expédition vers l''extrême Nord avec plongée, randonnée et immersion culturelle',
  1150000.00, 5, 8, 4, 'Cap d''Ambre', -12.0500, 49.4167,
  '33333333-3333-3333-3333-333333333333', 'active', 'hard', '06-01', '09-30',
  'Annulation gratuite jusqu''à 15 jours avant. Guide expert du territoire inclus.'
),

-- PACK 9: Grand Circuit Baobab Diego (6 jours)
(
  'a9999999-9999-9999-9999-999999999999',
  'Grand Circuit Baobab de Diego - Géants Millénaires',
  'Circuit complet de 6 jours à la découverte des baobabs géants et sites emblématiques autour de Diego Suarez. Jour 1: Baobabs sacrés de la route de Ramena, initiation aux rituels malgaches, nuit chez l''habitant. Jour 2: Mer d''Émeraude en pirogue, pêche traditionnelle, bivouac sur îlot corallien. Jour 3: Tsingy Rouge et Pain de Sucre, photographie des formations géologiques, camp sous les baobabs centenaires. Jour 4: Montagne des Français, lever de soleil panoramique, exploration botanique avec botaniste local. Jour 5: Ankarana et ses grottes, cérémonie dans la grotte sacrée, observation nocturne des lémuriens. Jour 6: Windsor Castle et retour par la vallée des baobabs endémiques, atelier d''artisanat local.',
  'Circuit complet combinant tous les sites majeurs et baobabs millénaires',
  1380000.00, 6, 12, 4, 'Circuit Diego Suarez', -12.2833, 49.3167,
  '55555555-5555-5555-5555-555555555555', 'active', 'medium', '04-15', '11-15',
  'Annulation gratuite jusqu''à 21 jours avant. Circuit tout inclus avec guide expert.'
),

-- PACK 10: Expédition Nord Intégrale (7 jours)
(
  'a0000000-0000-0000-0000-000000000000',
  'Expédition Nord Intégrale - Madagascar Sauvage',
  'L''expédition ultime de 7 jours pour découvrir l''intégralité des merveilles du Nord de Madagascar, de la Mer d''Émeraude au Cap d''Ambre. Jour 1: Acclimatation à Diego, marché local, Montagne des Français sunset. Jour 2: Mer d''Émeraude approfondie avec kayak et snorkeling avancé. Jour 3: Tsingy Rouge et Windsor Castle, escalade et spéléologie. Jour 4: Ankarana complet avec Grande Grotte et Tsingy Gris. Jour 5: Expédition Nosy Hara avec nuit en bivouac sauvage. Jour 6: Cap d''Ambre avec plongée et collecte d''ambre. Jour 7: Circuit final des Trois Baies avec cérémonie de clôture traditionnelle. Hébergement varié (lodge, bivouac, chez l''habitant), tous repas inclus, guides spécialisés pour chaque site.',
  'Expédition ultime combinant tous les sites du Nord en 7 jours d''aventure',
  1850000.00, 7, 10, 4, 'Nord Madagascar Complet', -12.2500, 49.3500,
  '33333333-3333-3333-3333-333333333333', 'active', 'hard', '05-15', '10-15',
  'Annulation gratuite jusqu''à 30 jours avant. Expédition tout inclus avec équipe complète.'
);

-- 🖼️ PHASE 4: INSERTION DES IMAGES
-- =================================

INSERT INTO pack_images (pack_id, image_url, alt_text, display_order, is_primary) VALUES
-- Images Mer d'Émeraude Express
('a1111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5', 'Eaux turquoise de la Mer d''Émeraude', 1, true),
('a1111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1571804318635-31d0ac14ca69', 'Pirogue traditionnelle malgache', 2, false),
('a1111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7', 'Îlot corallien désert', 3, false),

-- Images Tsingy Rouge
('a2222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5', 'Formations rocheuses rouges spectaculaires', 1, true),
('a2222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd', 'Canyon de grès rouge', 2, false),

-- Images Ankarana Express
('a3333333-3333-3333-3333-333333333333', 'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5', 'Tsingy d''Ankarana majestueux', 1, true),
('a3333333-3333-3333-3333-333333333333', 'https://images.unsplash.com/photo-1515940175183-6798529cb860', 'Grottes calcaires mystérieuses', 2, false),
('a3333333-3333-3333-3333-333333333333', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b', 'Bivouac sous les étoiles', 3, false),

-- Images Montagne des Français
('a4444444-4444-4444-4444-444444444444', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4', 'Vue panoramique depuis le sommet', 1, true),
('a4444444-4444-4444-4444-444444444444', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e', 'Forêt sèche et baobabs', 2, false),

-- Images Nosy Hara
('a5555555-5555-5555-5555-555555555555', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b', 'Archipel sauvage de Nosy Hara', 1, true),
('a5555555-5555-5555-5555-555555555555', 'https://images.unsplash.com/photo-1583743089695-4b816a340f82', 'Bivouac sur plage déserte', 2, false),
('a5555555-5555-5555-5555-555555555555', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b', 'Kayak dans la mangrove', 3, false),

-- Images Trois Baies
('a6666666-6666-6666-6666-666666666666', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4', 'Baie des Sakalava au coucher de soleil', 1, true),
('a6666666-6666-6666-6666-666666666666', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750', 'Dunes dorées de la Baie des Dunes', 2, false),

-- Images Windsor Castle
('a7777777-7777-7777-7777-777777777777', 'https://images.unsplash.com/photo-1464207687429-7505649dae38', 'Formation rocheuse de Windsor Castle', 1, true),
('a7777777-7777-7777-7777-777777777777', 'https://images.unsplash.com/photo-1551632811-561732d1e306', 'Escalade sur rocher naturel', 2, false),

-- Images Cap d'Ambre
('a8888888-8888-8888-8888-888888888888', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4', 'Phare du Cap d''Ambre', 1, true),
('a8888888-8888-8888-8888-888888888888', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5', 'Côte sauvage du Cap', 2, false),

-- Images Circuit Baobab
('a9999999-9999-9999-9999-999999999999', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96', 'Baobab géant millénaire', 1, true),
('a9999999-9999-9999-9999-999999999999', 'https://images.unsplash.com/photo-1505142468610-359e7d316be0', 'Route des baobabs au coucher de soleil', 2, false),

-- Images Expédition Intégrale
('a0000000-0000-0000-0000-000000000000', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4', 'Panorama du Nord Madagascar', 1, true),
('a0000000-0000-0000-0000-000000000000', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b', 'Équipe d''expédition au sommet', 2, false);

-- 🛠️ PHASE 5: SERVICES INCLUS/EXCLUS
-- ===================================

INSERT INTO pack_services (pack_id, service_name, is_included, display_order) VALUES
-- Services Mer d'Émeraude Express
('a1111111-1111-1111-1111-111111111111', 'Transport en 4x4 depuis Diego Suarez', true, 1),
('a1111111-1111-1111-1111-111111111111', 'Navigation en pirogue traditionnelle', true, 2),
('a1111111-1111-1111-1111-111111111111', 'Guide local expert', true, 3),
('a1111111-1111-1111-1111-111111111111', 'Déjeuner pique-nique', true, 4),
('a1111111-1111-1111-1111-111111111111', 'Équipement de snorkeling', true, 5),
('a1111111-1111-1111-1111-111111111111', 'Boissons alcoolisées', false, 6),

-- Services Tsingy Rouge
('a2222222-2222-2222-2222-222222222222', 'Transport 4x4 aller-retour', true, 1),
('a2222222-2222-2222-2222-222222222222', 'Guide géologue spécialisé', true, 2),
('a2222222-2222-2222-2222-222222222222', 'Déjeuner traditionnel malgache', true, 3),
('a2222222-2222-2222-2222-222222222222', 'Eau minérale', true, 4),
('a2222222-2222-2222-2222-222222222222', 'Équipement de randonnée', false, 5),

-- Services Ankarana Express
('a3333333-3333-3333-3333-333333333333', 'Transport 4x4 spécialisé', true, 1),
('a3333333-3333-3333-3333-333333333333', 'Équipement de via ferrata complet', true, 2),
('a3333333-3333-3333-3333-333333333333', 'Guide parc national certifié', true, 3),
('a3333333-3333-3333-3333-333333333333', 'Matériel de bivouac', true, 4),
('a3333333-3333-3333-3333-333333333333', 'Tous les repas', true, 5),
('a3333333-3333-3333-3333-333333333333', 'Droit d''entrée parc', true, 6),
('a3333333-3333-3333-3333-333333333333', 'Assurance voyage', false, 7),

-- Services Montagne des Français
('a4444444-4444-4444-4444-444444444444', 'Hébergement lodge écologique', true, 1),
('a4444444-4444-4444-4444-444444444444', 'Guide naturaliste expert', true, 2),
('a4444444-4444-4444-4444-444444444444', 'Tous les repas et collations', true, 3),
('a4444444-4444-4444-4444-444444444444', 'Dégustation rhum arrangé', true, 4),
('a4444444-4444-4444-4444-444444444444', 'Transport privé', true, 5),

-- Services Nosy Hara
('a5555555-5555-5555-5555-555555555555', 'Navigation maritime privée', true, 1),
('a5555555-5555-5555-5555-555555555555', 'Équipement camping complet', true, 2),
('a5555555-5555-5555-5555-555555555555', 'Guide marin expert', true, 3),
('a5555555-5555-5555-5555-555555555555', 'Matériel snorkeling et kayak', true, 4),
('a5555555-5555-5555-5555-555555555555', 'Repas traditionnels malgaches', true, 5),
('a5555555-5555-5555-5555-555555555555', 'Permis spécial réserve', true, 6),
('a5555555-5555-5555-5555-555555555555', 'Équipement de pêche', false, 7),

-- Services Trois Baies
('a6666666-6666-6666-6666-666666666666', 'Circuit complet en 4x4', true, 1),
('a6666666-6666-6666-6666-666666666666', 'Hébergement varié (lodge + bivouac)', true, 2),
('a6666666-6666-6666-6666-666666666666', 'Guide culturel sakalava', true, 3),
('a6666666-6666-6666-6666-666666666666', 'Repas chez l''habitant', true, 4),
('a6666666-6666-6666-6666-666666666666', 'Planches de sandboarding', true, 5),
('a6666666-6666-6666-6666-666666666666', 'Spectacle de danses traditionnelles', true, 6),

-- Services Windsor Castle
('a7777777-7777-7777-7777-777777777777', 'Équipement escalade complet', true, 1),
('a7777777-7777-7777-7777-777777777777', 'Guide montagne certifié', true, 2),
('a7777777-7777-7777-7777-777777777777', 'Matériel bivouac d''aventure', true, 3),
('a7777777-7777-7777-7777-777777777777', 'Équipement spéléologie', true, 4),
('a7777777-7777-7777-7777-777777777777', 'Repas cuisine au feu de bois', true, 5),
('a7777777-7777-7777-7777-777777777777', 'Cérémonie traditionnelle', true, 6),
('a7777777-7777-7777-7777-777777777777', 'Assurance activités extrêmes', false, 7),

-- Services Cap d'Ambre
('a8888888-8888-8888-8888-888888888888', 'Expédition tout inclus 5 jours', true, 1),
('a8888888-8888-8888-8888-888888888888', 'Guide expert du territoire', true, 2),
('a8888888-8888-8888-8888-888888888888', 'Équipement plongée libre', true, 3),
('a8888888-8888-8888-8888-888888888888', 'Hébergement camps avancés', true, 4),
('a8888888-8888-8888-8888-888888888888', 'Tous les repas et collations', true, 5),
('a8888888-8888-8888-8888-888888888888', 'Hamacs de canopée', true, 6),
('a8888888-8888-8888-8888-888888888888', 'Collection d''ambre fossilisé', false, 7),

-- Services Circuit Baobab
('a9999999-9999-9999-9999-999999999999', 'Circuit complet 6 jours', true, 1),
('a9999999-9999-9999-9999-999999999999', 'Guide botaniste spécialisé', true, 2),
('a9999999-9999-9999-9999-999999999999', 'Hébergement varié tout inclus', true, 3),
('a9999999-9999-9999-9999-999999999999', 'Tous les transports', true, 4),
('a9999999-9999-9999-9999-999999999999', 'Repas gastronomie locale', true, 5),
('a9999999-9999-9999-9999-999999999999', 'Atelier artisanat local', true, 6),
('a9999999-9999-9999-9999-999999999999', 'Droits d''entrée sites', true, 7),

-- Services Expédition Intégrale
('a0000000-0000-0000-0000-000000000000', 'Expédition premium 7 jours', true, 1),
('a0000000-0000-0000-0000-000000000000', 'Équipe de guides experts', true, 2),
('a0000000-0000-0000-0000-000000000000', 'Hébergement premium varié', true, 3),
('a0000000-0000-0000-0000-000000000000', 'Tous équipements spécialisés', true, 4),
('a0000000-0000-0000-0000-000000000000', 'Gastronomie locale authentique', true, 5),
('a0000000-0000-0000-0000-000000000000', 'Cérémonie de clôture traditionnelle', true, 6),
('a0000000-0000-0000-0000-000000000000', 'Tous droits d''entrée et permis', true, 7),
('a0000000-0000-0000-0000-000000000000', 'Transport aérien retour', false, 8);

-- 🗓️ PHASE 6: ITINÉRAIRES DÉTAILLÉS
-- ==================================

-- Itinéraire Mer d'Émeraude Express (1 jour)
INSERT INTO pack_itinerary (pack_id, day_number, title, description, activities, accommodation, meals_included) VALUES
('a1111111-1111-1111-1111-111111111111', 1, 'Découverte de la Mer d''Émeraude', 
 'Journée complète dans ce paradis aquatique unique, navigation en pirogue traditionnelle à travers les canaux de mangrove jusqu''aux eaux turquoise légendaires.',
 ARRAY['Départ matinal de Diego Suarez', 'Navigation en pirogue dans la mangrove', 'Baignade dans les eaux émeraude', 'Snorkeling récifs coralliens', 'Déjeuner sur îlot désert', 'Exploration à pied des îlots', 'Retour coucher de soleil'],
 'Retour le soir même', 'Déjeuner pique-nique, collations, eau');

-- Itinéraire Tsingy Rouge (1 jour)
INSERT INTO pack_itinerary (pack_id, day_number, title, description, activities, accommodation, meals_included) VALUES
('a2222222-2222-2222-2222-222222222222', 1, 'Exploration des Tsingy Rouge',
 'Découverte de ce site géologique unique aux formations de grès rouge sculptées par l''érosion, véritable labyrinthe naturel aux couleurs flamboyantes.',
 ARRAY['Route vers Irodo et les Tsingy Rouge', 'Randonnée guidée dans le labyrinthe', 'Explications géologiques détaillées', 'Exploration des grottes naturelles', 'Points de vue panoramiques', 'Photographie coucher de soleil', 'Retour Diego Suarez'],
 'Retour le soir même', 'Déjeuner traditionnel malgache');

-- Itinéraire Ankarana Express (2 jours)
INSERT INTO pack_itinerary (pack_id, day_number, title, description, activities, accommodation, meals_included) VALUES
('a3333333-3333-3333-3333-333333333333', 1, 'Petits Tsingy et Grottes d''Andrafiabe',
 'Première immersion dans le royaume des tsingy avec équipement de via ferrata, découverte des grottes mystérieuses aux formations calcaires spectaculaires.',
 ARRAY['Route vers le Parc National Ankarana', 'Équipement via ferrata', 'Exploration Petits Tsingy', 'Grottes d''Andrafiabe et formations calcaires', 'Installation bivouac', 'Observation faune nocturne', 'Veillée contes malgaches'],
 'Bivouac dans le parc', 'Petit-déjeuner, Déjeuner, Dîner'),
('a3333333-3333-3333-3333-333333333333', 2, 'Grands Tsingy et Crocodiles Sacrés',
 'Exploration approfondie des Grands Tsingy avec passages spectaculaires, visite de la grotte des crocodiles sacrés et rencontre avec les communautés locales.',
 ARRAY['Lever de soleil sur les tsingy', 'Randonnée Grands Tsingy', 'Passages sur ponts naturels', 'Grotte des crocodiles sacrés', 'Rencontre communauté Antankarana', 'Cérémonie traditionnelle', 'Retour Diego Suarez'],
 'Retour en ville', 'Petit-déjeuner, Déjeuner');

-- Itinéraire Montagne des Français (2 jours)
INSERT INTO pack_itinerary (pack_id, day_number, title, description, activities, accommodation, meals_included) VALUES
('a4444444-4444-4444-4444-444444444444', 1, 'Ascension et Histoire Militaire',
 'Randonnée à travers la forêt sèche endémique vers les vestiges des fortifications françaises, découverte des baobabs centenaires et de l''histoire du site.',
 ARRAY['Départ randonnée base montagne', 'Forêt sèche et baobabs centenaires', 'Sites historiques fortifications', 'Montée progressive vers sommet', 'Installation lodge écologique', 'Coucher de soleil panoramique', 'Dégustation rhum arrangé'],
 'Lodge écologique avec vue mer', 'Petit-déjeuner, Déjeuner, Dîner'),
('a4444444-4444-4444-4444-444444444444', 2, 'Sommet et Grotte de Milaintety',
 'Lever de soleil exceptionnel depuis le point culminant, exploration de la grotte mystérieuse et descente par les sentiers botaniques avec guide naturaliste.',
 ARRAY['Lever de soleil sommet 426m', 'Panorama 360° baie Diego', 'Exploration grotte Milaintety', 'Descente sentiers botaniques', 'Guide naturaliste spécialisé', 'Observation faune endémique', 'Retour et spécialités locales'],
 'Retour en ville', 'Petit-déjeuner, Déjeuner');

-- Itinéraire Nosy Hara Sauvage (3 jours)
INSERT INTO pack_itinerary (pack_id, day_number, title, description, activities, accommodation, meals_included) VALUES
('a5555555-5555-5555-5555-555555555555', 1, 'Navigation vers l''Archipel Secret',
 'Départ en bateau vers l''archipel préservé de Nosy Hara, installation du campement sur une plage vierge et première exploration en kayak.',
 ARRAY['Départ maritime vers archipel', 'Navigation côte sauvage', 'Installation camp plage déserte', 'Exploration mangrove en kayak', 'Première baignade eaux cristallines', 'Observation oiseaux marins', 'Dîner feu de camp'],
 'Bivouac plage sous les étoiles', 'Petit-déjeuner, Déjeuner, Dîner'),
('a5555555-5555-5555-5555-555555555555', 2, 'Forêt Primaire et Récifs Coralliens',
 'Exploration de la forêt primaire à la recherche de lémuriens, snorkeling dans des récifs intacts et initiation à la pêche traditionnelle malgache.',
 ARRAY['Randonnée forêt primaire', 'Recherche lémuriens endémiques', 'Snorkeling récifs coralliens intacts', 'Pêche traditionnelle locale', 'Déjeuner poisson grillé plage', 'Exploration îlots secondaires', 'Nuit étoiles australes'],
 'Bivouac nature sauvage', 'Petit-déjeuner, Déjeuner, Dîner'),
('a5555555-5555-5555-5555-555555555555', 3, 'Grottes Marines et Adieux',
 'Exploration des grottes marines accessibles à marée basse, observation ornithologique et cérémonie d''adieu avec la communauté locale.',
 ARRAY['Exploration grottes marines marée basse', 'Observation frégates et paille-en-queue', 'Collecte coquillages rares', 'Cérémonie adieu communauté locale', 'Dernier snorkeling', 'Navigation retour continent', 'Débarquement Diego Suarez'],
 'Retour en ville', 'Petit-déjeuner, Déjeuner');

-- Itinéraire Trois Baies (3 jours)
INSERT INTO pack_itinerary (pack_id, day_number, title, description, activities, accommodation, meals_included) VALUES
('a6666666-6666-6666-6666-666666666666', 1, 'Baie des Sakalava Authentique',
 'Immersion dans la culture sakalava authentique, rencontre avec les pêcheurs traditionnels et découverte des eaux turquoise de cette baie préservée.',
 ARRAY['Route vers Baie des Sakalava', 'Rencontre pêcheurs traditionnels', 'Initiation pêche locale', 'Déjeuner famille malgache', 'Exploration village authentique', 'Baignade eaux turquoise', 'Nuit chez l''habitant'],
 'Chez l''habitant village sakalava', 'Petit-déjeuner, Déjeuner, Dîner'),
('a6666666-6666-6666-6666-666666666666', 2, 'Baie des Dunes et Sandboarding',
 'Découverte des formations dunaires uniques, activité sandboarding et observation du coucher de soleil depuis les dunes mouvantes.',
 ARRAY['Route vers Baie des Dunes', 'Découverte formations sableuses', 'Sandboarding sur dunes', 'Exploration géomorphologie', 'Coucher soleil panoramique', 'Installation bivouac nomade', 'Nuit sous étoiles désert'],
 'Bivouac nomade dans les dunes', 'Petit-déjeuner, Déjeuner, Dîner'),
('a6666666-6666-6666-6666-666666666666', 3, 'Baie des Français et Héritage Colonial',
 'Exploration de la baie historique avec ses influences coloniales, visite du marché local et navigation finale dans les mangroves.',
 ARRAY['Visite marché local Diego', 'Exploration influences coloniales', 'Navigation mangroves pirogue', 'Découverte histoire locale', 'Rencontre artisans traditionnels', 'Danses sakalava clôture', 'Retour et bilan voyage'],
 'Retour en ville', 'Petit-déjeuner, Déjeuner, Dîner spectacle');

-- Itinéraire Windsor Castle Adventure (4 jours)
INSERT INTO pack_itinerary (pack_id, day_number, title, description, activities, accommodation, meals_included) VALUES
('a7777777-7777-7777-7777-777777777777', 1, 'Approche et Reconnaissance',
 'Approche de la citadelle naturelle par la forêt sèche, installation du camp de base et reconnaissance du terrain d''escalade.',
 ARRAY['Route vers Windsor Castle', 'Traversée forêt sèche endémique', 'Installation camp de base', 'Reconnaissance terrain escalade', 'Briefing sécurité équipement', 'Préparation matériel technique', 'Veillée préparation ascension'],
 'Camp de base sous formation rocheuse', 'Petit-déjeuner, Déjeuner, Dîner'),
('a7777777-7777-7777-7777-777777777777', 2, 'Ascension Technique Windsor Castle',
 'Ascension technique de la formation rocheuse avec équipement d''escalade, exploration des cavités et arches naturelles sculptées par l''érosion.',
 ARRAY['Équipement escalade complet', 'Ascension technique progressive', 'Exploration arches naturelles', 'Découverte cavités rocheuses', 'Points de vue exceptionnels', 'Installation bivouac altitude', 'Nuit perchée formation'],
 'Bivouac d''altitude sur formation', 'Petit-déjeuner, Déjeuner, Dîner'),
('a7777777-7777-7777-7777-777777777777', 3, 'Randonnée Crêtes et Spéléologie',
 'Randonnée panoramique sur les crêtes, observation de la faune endémique malgache et initiation à la spéléologie dans les grottes calcaires.',
 ARRAY['Randonnée crêtes panoramiques', 'Observation fossa et tenrecs', 'Initiation spéléologie grottes', 'Exploration réseau souterrain', 'Techniques progression souterraine', 'Découverte concrétions calcaires', 'Camp intermédiaire grottes'],
 'Camp intermédiaire près grottes', 'Petit-déjeuner, Déjeuner, Dîner'),
('a7777777-7777-7777-7777-777777777777', 4, 'Descente en Rappel et Cérémonie',
 'Descente spectaculaire en rappel depuis les falaises et participation à la cérémonie traditionnelle de l''eau sacrée avec les anciens du village.',
 ARRAY['Préparation descente rappel', 'Rappel falaises spectaculaire', 'Retour camp de base', 'Cérémonie eau sacrée anciens', 'Rituels traditionnels malgaches', 'Partage expérience communauté', 'Retour Diego Suarez'],
 'Retour en ville', 'Petit-déjeuner, Déjeuner, Dîner cér��monie');

-- Itinéraire Cap d'Ambre Intégral (5 jours)
INSERT INTO pack_itinerary (pack_id, day_number, title, description, activities, accommodation, meals_included) VALUES
('a8888888-8888-8888-8888-888888888888', 1, 'Route vers l''Extrême Nord',
 'Départ vers le point le plus septentrional de Madagascar, traversée des villages antankarana et installation du campement avancé en territoire sauvage.',
 ARRAY['Départ matinal Diego Suarez', 'Traversée villages Antankarana', 'Route piste vers extrême nord', 'Rencontre communautés isolées', 'Installation campement avancé', 'Reconnaissance territoire sauvage', 'Première nuit terres vierges'],
 'Campement avancé territoire sauvage', 'Petit-déjeuner, Déjeuner, Dîner'),
('a8888888-8888-8888-8888-888888888888', 2, 'Phares du Cap et Observation Marines',
 'Randonnée vers les phares historiques du Cap d''Ambre, observation des baleines à bosse en saison et exploration des criques secrètes.',
 ARRAY['Randonnée vers phares du Cap', 'Histoire phares et navigation', 'Observation baleines à bosse', 'Exploration criques secrètes', 'Baignade eaux cristallines', 'Collecte premiers ambres', 'Camp côte sauvage'],
 'Camp sur côte sauvage', 'Petit-déjeuner, Déjeuner, Dîner'),
('a8888888-8888-8888-8888-888888888888', 3, 'Plongée et Pêcheurs Nomades',
 'Plongée en apnée dans les récifs du Cap, rencontre authentique avec les pêcheurs nomades et collecte d''ambre fossilisé sur les plages vierges.',
 ARRAY['Plongée apnée récifs du Cap', 'Rencontre pêcheurs nomades', 'Apprentissage techniques pêche', 'Collecte ambre fossilisé plages', 'Déjeuner poisson fraîchement pêché', 'Exploration côte rocheuse', 'Nuit étoiles océan'],
 'Camp plage ambre', 'Petit-déjeuner, Déjeuner, Dîner'),
('a8888888-8888-8888-8888-888888888888', 4, 'Ascension Mont et Forêt Relique',
 'Ascension du mont Cap d''Ambre, exploration de la forêt humide relique unique et nuit exceptionnelle en hamac suspendu dans la canopée.',
 ARRAY['Ascension mont Cap d''Ambre', 'Exploration forêt humide relique', 'Découverte espèces endémiques', 'Installation hamacs canopée', 'Observation faune nocturne', 'Sons mystérieux forêt primaire', 'Nuit suspendue arbres géants'],
 'Hamacs suspendus canopée', 'Petit-déjeuner, Déjeuner, Dîner'),
('a8888888-8888-8888-8888-888888888888', 5, 'Cérémonie Sorciers et Retour Côtier',
 'Participation à une cérémonie traditionnelle avec les sorciers locaux et retour spectaculaire par la côte sauvage avec arrêts photographiques.',
 ARRAY['Cérémonie bénédiction sorciers', 'Rituels protection voyage', 'Descente vers côte sauvage', 'Route panoramique côtière', 'Arrêts photos spectaculaires', 'Derniers moments extrême nord', 'Retour Diego Suarez soir'],
 'Retour en ville', 'Petit-déjeuner, Déjeuner, Dîner');

-- Itinéraire Circuit Baobab Diego (6 jours)
INSERT INTO pack_itinerary (pack_id, day_number, title, description, activities, accommodation, meals_included) VALUES
('a9999999-9999-9999-9999-999999999999', 1, 'Baobabs Sacrés Route Ramena',
 'Découverte des baobabs millénaires de la route de Ramena, initiation aux rituels malgaches ancestraux et première nuit en immersion culturelle.',
 ARRAY['Route baobabs sacrés Ramena', 'Découverte arbres millénaires', 'Initiation rituels malgaches', 'Cérémonie respect ancêtres', 'Installation famille d''accueil', 'Repas traditionnel authentique', 'Contes sous baobab géant'],
 'Chez l''habitant village traditionnel', 'Petit-déjeuner, Déjeuner, Dîner'),
('a9999999-9999-9999-9999-999999999999', 2, 'Mer d''Émeraude et Îlot Corallien',
 'Navigation traditionnelle en pirogue vers la Mer d''Émeraude, apprentissage de la pêche ancestrale et bivouac romantique sur îlot corallien.',
 ARRAY['Navigation pirogue Mer Émeraude', 'Pêche traditionnelle malgache', 'Baignade eaux turquoise légendaires', 'Installation bivouac îlot', 'Déjeuner poisson grillé', 'Exploration récifs coralliens', 'Nuit étoiles océan Indien'],
 'Bivouac îlot corallien désert', 'Petit-déjeuner, Déjeuner, Dîner'),
('a9999999-9999-9999-9999-999999999999', 3, 'Tsingy Rouge et Pain de Sucre',
 'Exploration photographique des formations géologiques uniques, session intensive de photographie landscape et camp sous les baobabs centenaires.',
 ARRAY['Exploration Tsingy Rouge matinal', 'Session photo formations géologiques', 'Découverte Pain de Sucre', 'Techniques photographie paysage', 'Installation camp baobabs', 'Cours botanique baobabs', 'Veillée photo étoiles'],
 'Camp sous baobabs centenaires', 'Petit-déjeuner, Déjeuner, Dîner'),
('a9999999-9999-9999-9999-999999999999', 4, 'Montagne Français et Botanique',
 'Lever de soleil panoramique depuis la Montagne des Français et exploration botanique approfondie avec un botaniste spécialisé en flore malgache.',
 ARRAY['Lever soleil Montagne Français', 'Panorama 360° baie Diego', 'Exploration botanique spécialisée', 'Découverte plantes endémiques', 'Herborisation avec botaniste', 'Création herbier personnel', 'Lodge écologique vue mer'],
 'Lodge écologique panoramique', 'Petit-déjeuner, Déjeuner, Dîner'),
('a9999999-9999-9999-9999-999999999999', 5, 'Ankarana et Cérémonie Grotte Sacrée',
 'Exploration complète du parc d''Ankarana avec cérémonie traditionnelle dans la grotte sacrée et observation nocturne privilégiée des lémuriens.',
 ARRAY['Exploration complète Ankarana', 'Randonnée tsingy spectaculaires', 'Cérémonie grotte sacrée', 'Rituels respect ancêtres', 'Observation nocturne lémuriens', 'Guide spécialisé primates', 'Bivouac cœur parc national'],
 'Bivouac parc national Ankarana', 'Petit-déjeuner, Déjeuner, Dîner'),
('a9999999-9999-9999-9999-999999999999', 6, 'Windsor Castle et Vallée Baobabs',
 'Exploration finale de Windsor Castle, découverte de la vallée secrète des baobabs endémiques et atelier d''artisanat local traditionnel.',
 ARRAY['Exploration Windsor Castle', 'Découverte vallée baobabs endémiques', 'Observation espèces rares', 'Atelier artisanat local', 'Création souvenir authentique', 'Bilan voyage avec guides', 'Retour Diego Suarez'],
 'Retour en ville', 'Petit-déjeuner, Déjeuner, Dîner');

-- Itinéraire Expédition Nord Intégrale (7 jours)
INSERT INTO pack_itinerary (pack_id, day_number, title, description, activities, accommodation, meals_included) VALUES
('a0000000-0000-0000-0000-000000000000', 1, 'Acclimatation Diego et Montagne Français',
 'Journée d''acclimatation dans la capitale du Nord, exploration du marché authentique et coucher de soleil depuis la Montagne des Français.',
 ARRAY['Accueil aéroport Diego Suarez', 'Installation hôtel premium', 'Exploration marché local authentique', 'Briefing expédition complète', 'Ascension Montagne des Français', 'Coucher soleil panoramique', 'Dîner gastronomie locale'],
 'Hôtel premium Diego Suarez', 'Petit-déjeuner, Déjeuner, Dîner'),
('a0000000-0000-0000-0000-000000000000', 2, 'Mer d''Émeraude Approfondie',
 'Exploration complète et approfondie de la Mer d''Émeraude avec kayak, snorkeling avancé et navigation dans tous les recoins secrets de ce joyau.',
 ARRAY['Navigation approfondie Mer Émeraude', 'Kayak exploration mangroves', 'Snorkeling avancé récifs', 'Découverte grottes marines', 'Pêche traditionnelle perfectionnement', 'Déjeuner îlot secret', 'Lodge maritime vue mer'],
 'Lodge maritime premium', 'Petit-déjeuner, Déjeuner, Dîner'),
('a0000000-0000-0000-0000-000000000000', 3, 'Tsingy Rouge et Windsor Castle Combinés',
 'Journée intensive combinant l''exploration des Tsingy Rouge et l''escalade technique de Windsor Castle avec équipement professionnel.',
 ARRAY['Exploration matinale Tsingy Rouge', 'Photographie formations géologiques', 'Route vers Windsor Castle', 'Escalade technique équipée', 'Spéléologie grottes calcaires', 'Bivouac aventure premium', 'Cuisine feu de bois'],
 'Bivouac aventure équipé', 'Petit-déjeuner, Déjeuner, Dîner'),
('a0000000-0000-0000-0000-000000000000', 4, 'Ankarana Complet Tsingy et Grottes',
 'Exploration exhaustive du parc national d''Ankarana incluant les Grands Tsingy et la découverte de la Grande Grotte aux formations exceptionnelles.',
 ARRAY['Entrée parc national Ankarana', 'Exploration Grands Tsingy via ferrata', 'Grande Grotte formations calcaires', 'Tsingy Gris moins connus', 'Observation lémuriens diurnes', 'Guide parc spécialisé', 'Lodge parc national'],
 'Lodge dans parc national', 'Petit-déjeuner, Déjeuner, Dîner'),
('a0000000-0000-0000-0000-000000000000', 5, 'Expédition Nosy Hara Sauvage',
 'Expédition maritime vers l''archipel préservé de Nosy Hara avec nuit en bivouac sauvage sur plage vierge et exploration marine poussée.',
 ARRAY['Navigation maritime Nosy Hara', 'Installation bivouac plage vierge', 'Exploration forêt primaire', 'Snorkeling récifs intacts', 'Kayak exploration archipel', 'Observation oiseaux endémiques', 'Nuit étoiles australes'],
 'Bivouac sauvage plage déserte', 'Petit-déjeuner, Déjeuner, Dîner'),
('a0000000-0000-0000-0000-000000000000', 6, 'Cap d''Ambre et Plongée Ambre',
 'Expédition vers l''extrême Nord au Cap d''Ambre avec plongée libre dans les récifs et collecte authentique d''ambre fossilisé sur les plages.',
 ARRAY['Route extrême nord Cap Ambre', 'Randonnée phares historiques', 'Plongée libre récifs du Cap', 'Collecte ambre fossilisé authentique', 'Rencontre pêcheurs nomades', 'Exploration côte sauvage', 'Camp côte nord'],
 'Camp côte extrême nord', 'Petit-déjeuner, Déjeuner, Dîner'),
('a0000000-0000-0000-0000-000000000000', 7, 'Circuit Final Trois Baies et Clôture',
 'Circuit final des Trois Baies avec cérémonie de clôture traditionnelle, bilan de l''expédition et derniers moments dans le Nord magique.',
 ARRAY['Circuit matinal Trois Baies', 'Baie Sakalava dernière baignade', 'Baie Dunes sandboarding final', 'Baie Français héritage colonial', 'Cérémonie clôture traditionnelle', 'Bilan expédition équipe', 'Transfert aéroport retour'],
 'Retour selon destination', 'Petit-déjeuner, Déjeuner, Dîner spectacle');

-- 🎯 PHASE 7: FINALISATION ET VÉRIFICATIONS
-- =========================================

DO $$
BEGIN
  RAISE NOTICE '✅ SCRIPT PACKS NORD MADAGASCAR TERMINÉ !';
  RAISE NOTICE '================================================';
  RAISE NOTICE '📊 RÉSUMÉ DES DONNÉES INSÉRÉES:';
  RAISE NOTICE '   • 5 catégories de packs créées';
  RAISE NOTICE '   • 10 packs Nord Madagascar complets';
  RAISE NOTICE '   • Images Unsplash pour tous les packs';
  RAISE NOTICE '   • Services détaillés inclus/exclus';
  RAISE NOTICE '   • Itinéraires jour par jour complets';
  RAISE NOTICE '   • Prix de 165,000 à 1,850,000 MGA';
  RAISE NOTICE '   • Durées de 1 à 7 jours';
  RAISE NOTICE '   • Tous les sites demandés inclus';
  RAISE NOTICE '================================================';
END $$;

-- 🔍 REQUÊTES DE VÉRIFICATION
-- ===========================

-- Vérifier les packs créés
SELECT 
  title,
  duration_days,
  price,
  location,
  status
FROM packs 
ORDER BY duration_days, price;

-- Vérifier les catégories
SELECT name, description, icon FROM pack_categories ORDER BY name;

-- Vérifier les images
SELECT 
  p.title,
  COUNT(pi.id) as nb_images
FROM packs p
LEFT JOIN pack_images pi ON p.id = pi.pack_id
GROUP BY p.id, p.title
ORDER BY p.title;

-- Vérifier les services
SELECT 
  p.title,
  COUNT(ps.id) as nb_services
FROM packs p
LEFT JOIN pack_services ps ON p.id = ps.pack_id
GROUP BY p.id, p.title
ORDER BY p.title;

-- Vérifier les itinéraires
SELECT 
  p.title,
  p.duration_days,
  COUNT(pi.id) as nb_jours_itineraire
FROM packs p
LEFT JOIN pack_itinerary pi ON p.id = pi.pack_id
GROUP BY p.id, p.title, p.duration_days
ORDER BY p.duration_days;