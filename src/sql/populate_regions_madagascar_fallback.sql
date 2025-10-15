-- ✅ Script de population des régions de Madagascar (sans images)
-- Pour GasyWay - Les images seront ajoutées une par une en édition

-- 🧹 Nettoyer d'abord la table si elle existe déjà
DELETE FROM regions WHERE true;

-- 🏝️ Insérer toutes les régions de Madagascar
INSERT INTO regions (name, slug, description, status) VALUES

-- Région Nord
('Antsiranana (DIANA)', 'antsiranana-diana', 
'La région la plus septentrionale de Madagascar, connue pour ses îlots paradisiaques, ses réserves naturelles et sa richesse culturelle. Destination phare avec Nosy Be, la Montagne d''Ambre et les Tsingy rouges.', 
'active'),

('Sambava (SAVA)', 'sambava-sava', 
'Région de la vanille par excellence, côte est sauvage avec des plages vierges, forêts tropicales luxuriantes et traditions authentiques. Terre des parfums et épices de Madagascar.', 
'active'),

-- Région Centre-Nord  
('Mahajanga (Boeny)', 'mahajanga-boeny', 
'Région côtière ouest réputée pour ses plages, ses baobabs majestueux et le parc national d''Ankarafantsika. Port historique et porte d''entrée vers les Tsingy de Bemaraha.', 
'active'),

('Maevatanana (Betsiboka)', 'maevatanana-betsiboka', 
'Région rurale au cœur des hautes terres centrales, riche en traditions malgaches authentiques, rizières en terrasses et paysages vallonnés typiques des hauts plateaux.', 
'active'),

-- Région Centre
('Antananarivo (Analamanga)', 'antananarivo-analamanga', 
'Capitale et région la plus peuplée, centre névralgique politique et économique. Riche patrimoine historique avec le palais royal et les marchés traditionnels d''Analakely.', 
'active'),

('Antsirabe (Vakinankaratra)', 'antsirabe-vakinankaratra', 
'Région des hautes terres centrales, station thermale historique, lac volcanique Tritriva et artisanat traditionnel. Climat tempéré et paysages montagneux verdoyants.', 
'active'),

('Ambatondrazaka (Alaotra Mangoro)', 'ambatondrazaka-alaotra-mangoro', 
'Grenier à riz de Madagascar avec le plus grand lac du pays. Région agricole stratégique, habitat du lemur bambou et paysages lacustres uniques.', 
'active'),

('Moramanga (Atsinanana)', 'moramanga-atsinanana', 
'Région de la côte est tropicale, forêts primaires d''Andasibe-Mantadia, habitat des indris. Climat tropical humide et biodiversité exceptionnelle.', 
'active'),

-- Région Sud-Est
('Fianarantsoa (Haute Matsiatra)', 'fianarantsoa-haute-matsiatra', 
'Capitale culturelle des hautes terres, région viticole et universitaire. Architecture coloniale préservée et traditions betsileo authentiques.', 
'active'),

('Mananjary (Vatovavy)', 'mananjary-vatovavy', 
'Région côtière du sud-est, canal des Pangalanes et traditions tanala. Paysages entre océan et forêt tropicale, culture du café et de la vanille.', 
'active'),

('Farafangana (Atsimo Atsinanana)', 'farafangana-atsimo-atsinanana', 
'Extrême sud-est malgache, côte sauvage battue par l''océan Indien. Forêts littorales uniques et communautés de pêcheurs traditionnels.', 
'active'),

-- Région Sud-Ouest
('Toliara (Atsimo Andrefana)', 'toliara-atsimo-andrefana', 
'Région du grand sud, terre des Antandroy et Mahafaly. Désert de spiny, baobabs géants et culture pastorale unique. Soleil garanti toute l''année.', 
'active'),

('Morombe (Atsimo Andrefana Sud)', 'morombe-atsimo-andrefana-sud', 
'Sud-ouest côtier, paysages semi-arides et villages de pêcheurs Vezo. Côte sauvage préservée et traditions maritimes ancestrales.', 
'active'),

-- Région Ouest
('Morondava (Menabe)', 'morondava-menabe', 
'Région emblématique de l''allée des baobabs, forêt sèche de Kirindy et traditions sakalava. Couchers de soleil légendaires et baobabs millénaires.', 
'active'),

('Maintirano (Melaky)', 'maintirano-melaky', 
'Région ouest isolée, forêts sèches préservées et communautés sakalava traditionnelles. Nature sauvage et paysages intacts loin du tourisme de masse.', 
'active'),

-- Régions spéciales et îles
('Nosy Be', 'nosy-be', 
'Île aux parfums, destination balnéaire de référence. Ylang-ylang, plages de sable fin, réserve de Lokobe et vie nocturne animée. Porte d''entrée touristique du nord.', 
'active'),

('Île Sainte-Marie', 'ile-sainte-marie', 
'Île paradisiaque de la côte est, ancien repaire de pirates. Observation des baleines à bosse, plages idylliques et patrimoine historique unique.', 
'active'),

-- Nouvelles régions administratives 
('Bealanana (Sofia)', 'bealanana-sofia', 
'Région montagneuse du nord-ouest, massif du Tsaratanana point culminant de Madagascar. Paysages spectaculaires et communautés rurales authentiques.', 
'active'),

('Ambanja (Sambirano)', 'ambanja-sambirano', 
'Vallée du Sambirano, cacao de renommée mondiale et paysages tropicaux luxuriants. Climat unique entre océan et montagnes.', 
'active'),

('Vohémar (Sava Nord)', 'vohemar-sava-nord', 
'Extrême nord-est, côte sauvage et traditions antakarana. Paysages entre mer émeraude et forêts tropicales préservées.', 
'active');

-- ✅ Vérification de l'insertion
SELECT 
  COUNT(*) as total_regions,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as regions_actives,
  COUNT(CASE WHEN image_url IS NULL THEN 1 END) as regions_sans_image
FROM regions;

-- ✅ Affichage de toutes les régions créées
SELECT 
  id,
  name,
  slug,
  LEFT(description, 50) || '...' as description_preview,
  status,
  CASE WHEN image_url IS NULL THEN '❌ Pas d''image' ELSE '✅ Image présente' END as image_status,
  created_at
FROM regions 
ORDER BY name;

-- 📋 Instructions pour ajouter les images :
-- 1. Aller dans Admin → Gestion des régions
-- 2. Cliquer sur "Modifier" pour chaque région
-- 3. Utiliser le composant RegionImageUploader pour ajouter une image
-- 4. L'image sera automatiquement compressée en WebP et stockée dans Supabase

-- 🎯 Statistiques finales
SELECT 
  '🏝️ Régions de Madagascar ajoutées avec succès !' as message,
  COUNT(*) as total_regions,
  'Images à ajouter une par une via l''interface admin' as next_step
FROM regions;

COMMENT ON TABLE regions IS 'Table des régions touristiques de Madagascar - 20 régions ajoutées sans images (fallback automatique actif)';