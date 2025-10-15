-- ===============================================
-- DONNÉES D'EXEMPLE POUR LES PACKS 📊
-- À exécuter après packs_supabase_simple_fix.sql
-- ===============================================

-- Vérifier que les tables existent
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pack_categories') THEN
    RAISE EXCEPTION 'Table pack_categories non trouvée. Exécutez d''abord packs_supabase_simple_fix.sql';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'packs') THEN
    RAISE EXCEPTION 'Table packs non trouvée. Exécutez d''abord packs_supabase_simple_fix.sql';
  END IF;
  
  RAISE NOTICE '✅ Tables détectées, insertion des données d''exemple...';
END $$;

-- 📊 INSERTION DES PACKS D'EXEMPLE
-- =================================

DO $$
DECLARE
  cat_adventure_id UUID;
  cat_culture_id UUID;
  cat_nature_id UUID;
  cat_beach_id UUID;
  admin_user_id UUID;
  pack1_id UUID;
  pack2_id UUID;
  pack3_id UUID;
BEGIN
  RAISE NOTICE '📊 INSERTION DES DONNÉES D''EXEMPLE...';

  -- Récupérer les IDs des catégories (avec gestion d'erreur)
  BEGIN
    SELECT id INTO STRICT cat_adventure_id FROM pack_categories WHERE name = 'Aventure';
    SELECT id INTO STRICT cat_culture_id FROM pack_categories WHERE name = 'Culture';
    SELECT id INTO STRICT cat_nature_id FROM pack_categories WHERE name = 'Nature';
    SELECT id INTO STRICT cat_beach_id FROM pack_categories WHERE name = 'Plage';
  EXCEPTION 
    WHEN NO_DATA_FOUND THEN
      RAISE EXCEPTION 'Catégorie non trouvée. Vérifiez que les catégories ont été créées.';
    WHEN TOO_MANY_ROWS THEN
      RAISE EXCEPTION 'Plusieurs catégories avec le même nom trouvées.';
  END;
  
  -- Essayer de récupérer un utilisateur pour created_by (optionnel)
  BEGIN
    -- Essayer d'abord un admin
    SELECT id INTO admin_user_id FROM users WHERE email LIKE '%admin%' LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    admin_user_id := NULL;
  END;
  
  -- Si pas d'admin trouvé, prendre le premier utilisateur
  IF admin_user_id IS NULL THEN
    BEGIN
      SELECT id INTO admin_user_id FROM users LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
      admin_user_id := NULL;
    END;
  END IF;
  
  -- Si aucun utilisateur trouvé, continuer sans created_by
  IF admin_user_id IS NULL THEN
    RAISE NOTICE '⚠️ Aucun utilisateur trouvé pour created_by, les packs seront créés sans créateur';
  ELSE
    RAISE NOTICE '✅ Utilisateur trouvé pour created_by: %', admin_user_id;
  END IF;
  
  -- Insérer les packs d'exemple
  INSERT INTO packs (
    title, description, short_description, price, currency, duration_days,
    max_participants, min_participants, location, coordinates_lat, coordinates_lng,
    category_id, status, difficulty_level, season_start, season_end,
    cancellation_policy, created_by
  ) VALUES 
  (
    'Safari Andasibe-Mantadia',
    'Découvrez les lémuriens emblématiques de Madagascar dans leur habitat naturel. Une expérience inoubliable au cœur de la forêt tropicale humide.',
    'Safari lémuriens dans la forêt d''Andasibe',
    280000, 'MGA', 3, 8, 2,
    'Andasibe-Mantadia, Madagascar', -18.9441, 48.4245,
    cat_nature_id, 'active', 'medium', '04-01', '11-30',
    'Annulation gratuite jusqu''à 7 jours avant',
    admin_user_id
  ),
  (
    'Expédition Tsingy de Bemaraha',
    'Aventure exceptionnelle dans les formations rocheuses uniques des Tsingy. Escalade, tyrolienne et découverte d''un écosystème unique au monde.',
    'Aventure dans les formations rocheuses des Tsingy',
    450000, 'MGA', 5, 6, 2,
    'Tsingy de Bemaraha, Madagascar', -19.1347, 44.7844,
    cat_adventure_id, 'active', 'hard', '05-01', '10-31',
    'Annulation avec frais selon conditions météo',
    admin_user_id
  ),
  (
    'Détente à Nosy Be',
    'Séjour paradisiaque sur l''île aux parfums. Plages de sable blanc, eaux cristallines et couchers de soleil spectaculaires.',
    'Séjour détente sur l''île aux parfums',
    320000, 'MGA', 4, 12, 1,
    'Nosy Be, Madagascar', -13.3205, 48.2613,
    cat_beach_id, 'active', 'easy', '03-01', '12-31',
    'Annulation gratuite jusqu''à 3 jours avant',
    admin_user_id
  )
  RETURNING id;

  -- Récupérer les IDs des packs créés pour les relations
  SELECT id INTO pack1_id FROM packs WHERE title = 'Safari Andasibe-Mantadia';
  SELECT id INTO pack2_id FROM packs WHERE title = 'Expédition Tsingy de Bemaraha';  
  SELECT id INTO pack3_id FROM packs WHERE title = 'Détente à Nosy Be';
  
  -- Insérer des images d'exemple (Unsplash)
  INSERT INTO pack_images (pack_id, image_url, alt_text, display_order, is_primary) VALUES
  -- Pack Andasibe
  (pack1_id, 'https://images.unsplash.com/photo-1564760055775-d63b17a55c44', 'Lémurien dans la forêt d''Andasibe', 1, true),
  (pack1_id, 'https://images.unsplash.com/photo-1547036967-23d11aacaee0', 'Forêt tropicale Madagascar', 2, false),
  
  -- Pack Tsingy  
  (pack2_id, 'https://images.unsplash.com/photo-1578662996442-48f60103fc96', 'Formations rocheuses Tsingy', 1, true),
  (pack2_id, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4', 'Escalade dans les Tsingy', 2, false),
  
  -- Pack Nosy Be
  (pack3_id, 'https://images.unsplash.com/photo-1559827260-dc66d52bef19', 'Plage paradisiaque Nosy Be', 1, true),
  (pack3_id, 'https://images.unsplash.com/photo-1571104508999-893933ded431', 'Coucher de soleil Nosy Be', 2, false);
  
  -- Insérer des services inclus/exclus
  INSERT INTO pack_services (pack_id, service_name, is_included, display_order) VALUES
  -- Pack Andasibe - Services inclus
  (pack1_id, 'Transport', true, 1),
  (pack1_id, 'Guide local', true, 2),
  (pack1_id, 'Hébergement', true, 3),
  (pack1_id, 'Repas', true, 4),
  (pack1_id, 'Entrées parcs', true, 5),
  -- Pack Andasibe - Services exclus
  (pack1_id, 'Vols internationaux', false, 1),
  (pack1_id, 'Assurance voyage', false, 2),
  (pack1_id, 'Pourboires', false, 3),
  
  -- Pack Tsingy - Services inclus
  (pack2_id, 'Transport 4x4', true, 1),
  (pack2_id, 'Guide spécialisé', true, 2),
  (pack2_id, 'Équipement escalade', true, 3),
  (pack2_id, 'Camping', true, 4),
  (pack2_id, 'Repas', true, 5),
  -- Pack Tsingy - Services exclus
  (pack2_id, 'Vols domestiques', false, 1),
  (pack2_id, 'Équipement personnel', false, 2),
  (pack2_id, 'Assurance', false, 3),
  
  -- Pack Nosy Be - Services inclus
  (pack3_id, 'Hébergement bord de mer', true, 1),
  (pack3_id, 'Petits déjeuners', true, 2),
  (pack3_id, 'Excursions îles', true, 3),
  (pack3_id, 'Transferts', true, 4),
  -- Pack Nosy Be - Services exclus
  (pack3_id, 'Vols', false, 1),
  (pack3_id, 'Déjeuners et dîners', false, 2),
  (pack3_id, 'Activités nautiques payantes', false, 3);
  
  -- Insérer des itinéraires d'exemple
  INSERT INTO pack_itinerary (pack_id, day_number, title, description, activities, accommodation, meals_included) VALUES
  -- Itinéraire Pack Andasibe (3 jours)
  (pack1_id, 1, 'Arrivée et première découverte', 'Accueil à Antananarivo et route vers Andasibe', ARRAY['Transfert depuis Antananarivo', 'Installation à l''hôtel', 'Première balade nocturne'], 'Hôtel Andasibe', 'Dîner'),
  (pack1_id, 2, 'Safari dans le parc national', 'Journée complète d''exploration de la réserve', ARRAY['Safari matinal', 'Observation des lémuriens Indri', 'Randonnée dans la forêt primaire'], 'Hôtel Andasibe', 'Petit-déjeuner, Déjeuner, Dîner'),
  (pack1_id, 3, 'Dernières observations et retour', 'Dernière matinée dans le parc et retour', ARRAY['Safari matinal', 'Visite village local', 'Retour Antananarivo'], 'Vol retour', 'Petit-déjeuner, Déjeuner'),
  
  -- Itinéraire Pack Tsingy (5 jours)
  (pack2_id, 1, 'Départ vers les Tsingy', 'Route vers le parc national', ARRAY['Vol vers Morondava', 'Route 4x4 vers Bekopaka', 'Installation campement'], 'Campement Bekopaka', 'Dîner'),
  (pack2_id, 2, 'Petits Tsingy', 'Découverte des petites formations', ARRAY['Randonnée Petits Tsingy', 'Initiation escalade', 'Via ferrata débutant'], 'Campement Bekopaka', 'Petit-déjeuner, Déjeuner, Dîner'),
  (pack2_id, 3, 'Grands Tsingy', 'Aventure dans les grandes formations', ARRAY['Escalade Grands Tsingy', 'Tyrolienne', 'Exploration grottes'], 'Campement Bekopaka', 'Petit-déjeuner, Déjeuner, Dîner'),
  (pack2_id, 4, 'Forêt de baobabs', 'Découverte de l''avenue des baobabs', ARRAY['Lever de soleil sur les Tsingy', 'Route vers Morondava', 'Coucher de soleil baobabs'], 'Hôtel Morondava', 'Petit-déjeuner, Déjeuner, Dîner'),
  (pack2_id, 5, 'Retour', 'Vol retour vers Antananarivo', ARRAY['Dernière visite Morondava', 'Vol retour'], 'Vol retour', 'Petit-déjeuner'),
  
  -- Itinéraire Pack Nosy Be (4 jours)  
  (pack3_id, 1, 'Arrivée à Nosy Be', 'Installation et première découverte', ARRAY['Vol vers Nosy Be', 'Installation resort', 'Détente plage'], 'Resort bord de mer', 'Dîner'),
  (pack3_id, 2, 'Tour de l''île', 'Exploration de Nosy Be', ARRAY['Visite Hell-Ville', 'Distillerie ylang-ylang', 'Plage Andilana'], 'Resort bord de mer', 'Petit-déjeuner, Déjeuner'),
  (pack3_id, 3, 'Excursion îles voisines', 'Découverte Nosy Komba et Nosy Tanikely', ARRAY['Excursion bateau', 'Snorkeling Nosy Tanikely', 'Village Nosy Komba'], 'Resort bord de mer', 'Petit-déjeuner, Déjeuner'),
  (pack3_id, 4, 'Départ', 'Dernière matinée et vol retour', ARRAY['Détente matinale', 'Shopping souvenirs', 'Vol retour'], 'Vol retour', 'Petit-déjeuner');
  
  RAISE NOTICE '✅ Données d''exemple insérées avec succès';
  RAISE NOTICE '  - 3 packs créés';
  RAISE NOTICE '  - 6 images ajoutées';
  RAISE NOTICE '  - 18 services configurés';
  RAISE NOTICE '  - 12 jours d''itinéraire détaillés';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Erreur lors de l''insertion: %', SQLERRM;
  RAISE;
END $$;

-- 📊 VÉRIFICATION FINALE
-- =======================

SELECT 
  '🎉 DONNÉES D''EXEMPLE AJOUTÉES AVEC SUCCÈS !' as message,
  (SELECT COUNT(*) FROM pack_categories) as categories_count,
  (SELECT COUNT(*) FROM packs) as packs_count,
  (SELECT COUNT(*) FROM pack_images) as images_count,
  (SELECT COUNT(*) FROM pack_services) as services_count,
  (SELECT COUNT(*) FROM pack_itinerary) as itinerary_count;

-- Afficher les packs créés avec leurs relations
SELECT 
  '📊 PACKS CRÉÉS AVEC RELATIONS:' as info,
  p.title,
  pc.name as category,
  p.status,
  p.difficulty_level,
  p.price,
  (SELECT COUNT(*) FROM pack_images pi WHERE pi.pack_id = p.id) as images_count,
  (SELECT COUNT(*) FROM pack_services ps WHERE ps.pack_id = p.id AND ps.is_included = true) as included_services_count,
  (SELECT COUNT(*) FROM pack_itinerary pit WHERE pit.pack_id = p.id) as itinerary_days_count
FROM packs p
LEFT JOIN pack_categories pc ON p.category_id = pc.id
ORDER BY p.created_at DESC;

-- Message final
SELECT '✅ SCRIPT DONNÉES D''EXEMPLE PACKS TERMINÉ AVEC SUCCÈS !' as final_status;