-- ✅ Script de démarrage - Régions principales de Madagascar (sans images)
-- À exécuter dans l'onglet SQL de Supabase

-- 🧹 Nettoyer d'abord la table
DELETE FROM regions WHERE true;
RESET IDENTITY regions RESTART WITH 1;

-- 🏝️ Insérer les régions principales de Madagascar pour commencer
INSERT INTO regions (name, slug, description, status, display_order) VALUES

-- Les 5 régions touristiques principales
('Antananarivo - Capitale', 'antananarivo', 
'La capitale historique de Madagascar, centre névralgique du pays. Découvrez le palais royal de Manjakamiadana, les marchés colorés d''Analakely et l''architecture coloniale unique. Point de départ idéal pour explorer Madagascar.',
'active', 1),

('Nosy Be - Île aux Parfums', 'nosy-be', 
'L''île paradisiaque du nord-ouest, destination balnéaire de référence. Plages de sable fin, parfums d''ylang-ylang, réserve de Lokobe et couchers de soleil spectaculaires. Porte d''entrée touristique du nord.',
'active', 2),

('Antsiranana - Nord Sauvage', 'antsiranana', 
'La région du grand nord avec ses merveilles naturelles uniques : Montagne d''Ambre, Tsingy rouges d''Ankarana, îlots de l''océan Indien. Biodiversité exceptionnelle et paysages à couper le souffle.',
'active', 3),

('Morondava - Allée des Baobabs', 'morondava', 
'La région emblématique de l''ouest malgache, célèbre pour ses baobabs millénaires. Avenue des Baobabs au coucher du soleil, forêt de Kirindy, traditions sakalava et paysages semi-arides fascinants.',
'active', 4),

('Andasibe-Mantadia - Forêt des Indris', 'andasibe', 
'Région de la côte est, sanctuaire de la biodiversité malgache. Forêts primaires d''Andasibe-Mantadia, chants mystiques des indris, orchidées rares et climat tropical humide propice à la faune endémique.',
'active', 5);

-- ✅ Vérification de l'insertion
SELECT 
  '🎯 Régions starter créées avec succès !' as message,
  COUNT(*) as total_regions,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as regions_actives,
  COUNT(CASE WHEN image_url IS NULL THEN 1 END) as regions_sans_image
FROM regions;

-- ✅ Affichage des régions créées
SELECT 
  id,
  display_order as ordre,
  name as nom_region,
  slug,
  LEFT(description, 80) || '...' as description_preview,
  status,
  CASE WHEN image_url IS NULL THEN '📷 À ajouter' ELSE '✅ Image OK' END as image_status,
  created_at
FROM regions 
ORDER BY display_order;

-- 📋 Instructions pour la suite :
COMMENT ON TABLE regions IS 'Régions starter de Madagascar - 5 régions principales sans images (fallback automatique actif)';

-- 🎯 Prochaines étapes :
-- 1. Aller dans Admin → Gestion des régions
-- 2. Modifier chaque région une par une
-- 3. Ajouter une image via le RegionImageUploader
-- 4. L'image sera automatiquement optimisée et stockée
-- 5. Ajouter d'autres régions si nécessaire via le formulaire de création

-- ✨ Le système de fallback garantit qu'aucune erreur ne s'affiche en l'absence d'image