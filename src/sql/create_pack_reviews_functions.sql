-- ✅ Fonctions SQL pour calculer automatiquement les ratings et reviews des packs
-- Ce script crée des fonctions optimisées pour récupérer les packs avec leurs statistiques de reviews

-- 🧹 Supprimer les fonctions existantes si elles existent
DROP FUNCTION IF EXISTS get_packs_with_reviews();
DROP FUNCTION IF EXISTS get_active_packs_with_reviews();
DROP FUNCTION IF EXISTS get_pack_by_id_with_reviews(text);

-- 🔧 Fonction pour récupérer tous les packs avec leurs statistiques de reviews
CREATE OR REPLACE FUNCTION get_packs_with_reviews()
RETURNS TABLE (
  id text,
  title text,
  description text,
  short_description text,
  price numeric,
  currency text,
  duration_days integer,
  max_participants integer,
  min_participants integer,
  location text,
  category_id text,
  region_id text,
  status text,
  images jsonb,
  included_services jsonb,
  excluded_services jsonb,
  difficulty_level text,
  season_start text,
  season_end text,
  cancellation_policy text,
  created_by text,
  created_at timestamptz,
  updated_at timestamptz,
  coordinates jsonb,
  category jsonb,
  region jsonb,
  average_rating numeric,
  total_reviews integer,
  is_favorite boolean
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.short_description,
    p.price,
    p.currency,
    p.duration_days,
    p.max_participants,
    p.min_participants,
    p.location,
    p.category_id,
    p.region_id,
    p.status,
    p.images,
    p.included_services,
    p.excluded_services,
    p.difficulty_level,
    p.season_start,
    p.season_end,
    p.cancellation_policy,
    p.created_by,
    p.created_at,
    p.updated_at,
    p.coordinates,
    -- Données de catégorie
    CASE 
      WHEN pc.id IS NOT NULL THEN
        jsonb_build_object(
          'id', pc.id,
          'name', pc.name,
          'description', pc.description,
          'icon', pc.icon
        )
      ELSE NULL
    END as category,
    -- Données de région
    CASE 
      WHEN r.id IS NOT NULL THEN
        jsonb_build_object(
          'id', r.id,
          'name', r.name,
          'slug', r.slug
        )
      ELSE NULL
    END as region,
    -- Calcul de la moyenne des ratings (arrondie à 1 décimale)
    CASE 
      WHEN COUNT(rv.rating) > 0 THEN
        ROUND(AVG(rv.rating::numeric), 1)
      ELSE NULL
    END as average_rating,
    -- Nombre total de reviews
    COUNT(rv.id)::integer as total_reviews,
    -- is_favorite sera géré côté frontend selon l'utilisateur connecté
    FALSE as is_favorite
  FROM packs p
  LEFT JOIN pack_categories pc ON p.category_id = pc.id
  LEFT JOIN regions r ON p.region_id = r.id
  LEFT JOIN reviews rv ON p.id = rv.pack_id AND rv.status = 'approved'
  GROUP BY 
    p.id, p.title, p.description, p.short_description, p.price, p.currency,
    p.duration_days, p.max_participants, p.min_participants, p.location,
    p.category_id, p.region_id, p.status, p.images, p.included_services,
    p.excluded_services, p.difficulty_level, p.season_start, p.season_end,
    p.cancellation_policy, p.created_by, p.created_at, p.updated_at,
    p.coordinates, pc.id, pc.name, pc.description, pc.icon,
    r.id, r.name, r.slug
  ORDER BY p.created_at DESC;
END;
$$;

-- 🔧 Fonction pour récupérer seulement les packs actifs avec leurs statistiques
CREATE OR REPLACE FUNCTION get_active_packs_with_reviews()
RETURNS TABLE (
  id text,
  title text,
  description text,
  short_description text,
  price numeric,
  currency text,
  duration_days integer,
  max_participants integer,
  min_participants integer,
  location text,
  category_id text,
  region_id text,
  status text,
  images jsonb,
  included_services jsonb,
  excluded_services jsonb,
  difficulty_level text,
  season_start text,
  season_end text,
  cancellation_policy text,
  created_by text,
  created_at timestamptz,
  updated_at timestamptz,
  coordinates jsonb,
  category jsonb,
  region jsonb,
  average_rating numeric,
  total_reviews integer,
  is_favorite boolean
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.short_description,
    p.price,
    p.currency,
    p.duration_days,
    p.max_participants,
    p.min_participants,
    p.location,
    p.category_id,
    p.region_id,
    p.status,
    p.images,
    p.included_services,
    p.excluded_services,
    p.difficulty_level,
    p.season_start,
    p.season_end,
    p.cancellation_policy,
    p.created_by,
    p.created_at,
    p.updated_at,
    p.coordinates,
    -- Données de catégorie
    CASE 
      WHEN pc.id IS NOT NULL THEN
        jsonb_build_object(
          'id', pc.id,
          'name', pc.name,
          'description', pc.description,
          'icon', pc.icon
        )
      ELSE NULL
    END as category,
    -- Données de région
    CASE 
      WHEN r.id IS NOT NULL THEN
        jsonb_build_object(
          'id', r.id,
          'name', r.name,
          'slug', r.slug
        )
      ELSE NULL
    END as region,
    -- Calcul de la moyenne des ratings (arrondie à 1 décimale)
    CASE 
      WHEN COUNT(rv.rating) > 0 THEN
        ROUND(AVG(rv.rating::numeric), 1)
      ELSE NULL
    END as average_rating,
    -- Nombre total de reviews
    COUNT(rv.id)::integer as total_reviews,
    -- is_favorite sera géré côté frontend selon l'utilisateur connecté
    FALSE as is_favorite
  FROM packs p
  LEFT JOIN pack_categories pc ON p.category_id = pc.id
  LEFT JOIN regions r ON p.region_id = r.id
  LEFT JOIN reviews rv ON p.id = rv.pack_id AND rv.status = 'approved'
  WHERE p.status = 'active'
  GROUP BY 
    p.id, p.title, p.description, p.short_description, p.price, p.currency,
    p.duration_days, p.max_participants, p.min_participants, p.location,
    p.category_id, p.region_id, p.status, p.images, p.included_services,
    p.excluded_services, p.difficulty_level, p.season_start, p.season_end,
    p.cancellation_policy, p.created_by, p.created_at, p.updated_at,
    p.coordinates, pc.id, pc.name, pc.description, pc.icon,
    r.id, r.name, r.slug
  ORDER BY p.created_at DESC;
END;
$$;

-- 🔧 Fonction pour récupérer un pack spécifique avec ses statistiques
CREATE OR REPLACE FUNCTION get_pack_by_id_with_reviews(pack_id text)
RETURNS TABLE (
  id text,
  title text,
  description text,
  short_description text,
  price numeric,
  currency text,
  duration_days integer,
  max_participants integer,
  min_participants integer,
  location text,
  category_id text,
  region_id text,
  status text,
  images jsonb,
  included_services jsonb,
  excluded_services jsonb,
  difficulty_level text,
  season_start text,
  season_end text,
  cancellation_policy text,
  created_by text,
  created_at timestamptz,
  updated_at timestamptz,
  coordinates jsonb,
  category jsonb,
  region jsonb,
  average_rating numeric,
  total_reviews integer,
  is_favorite boolean
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.short_description,
    p.price,
    p.currency,
    p.duration_days,
    p.max_participants,
    p.min_participants,
    p.location,
    p.category_id,
    p.region_id,
    p.status,
    p.images,
    p.included_services,
    p.excluded_services,
    p.difficulty_level,
    p.season_start,
    p.season_end,
    p.cancellation_policy,
    p.created_by,
    p.created_at,
    p.updated_at,
    p.coordinates,
    -- Données de catégorie
    CASE 
      WHEN pc.id IS NOT NULL THEN
        jsonb_build_object(
          'id', pc.id,
          'name', pc.name,
          'description', pc.description,
          'icon', pc.icon
        )
      ELSE NULL
    END as category,
    -- Données de région
    CASE 
      WHEN r.id IS NOT NULL THEN
        jsonb_build_object(
          'id', r.id,
          'name', r.name,
          'slug', r.slug
        )
      ELSE NULL
    END as region,
    -- Calcul de la moyenne des ratings (arrondie à 1 décimale)
    CASE 
      WHEN COUNT(rv.rating) > 0 THEN
        ROUND(AVG(rv.rating::numeric), 1)
      ELSE NULL
    END as average_rating,
    -- Nombre total de reviews
    COUNT(rv.id)::integer as total_reviews,
    -- is_favorite sera géré côté frontend selon l'utilisateur connecté
    FALSE as is_favorite
  FROM packs p
  LEFT JOIN pack_categories pc ON p.category_id = pc.id
  LEFT JOIN regions r ON p.region_id = r.id
  LEFT JOIN reviews rv ON p.id = rv.pack_id AND rv.status = 'approved'
  WHERE p.id = pack_id
  GROUP BY 
    p.id, p.title, p.description, p.short_description, p.price, p.currency,
    p.duration_days, p.max_participants, p.min_participants, p.location,
    p.category_id, p.region_id, p.status, p.images, p.included_services,
    p.excluded_services, p.difficulty_level, p.season_start, p.season_end,
    p.cancellation_policy, p.created_by, p.created_at, p.updated_at,
    p.coordinates, pc.id, pc.name, pc.description, pc.icon,
    r.id, r.name, r.slug;
END;
$$;

-- 🔐 Accorder les permissions aux utilisateurs appropriés
GRANT EXECUTE ON FUNCTION get_packs_with_reviews() TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_packs_with_reviews() TO authenticated;
GRANT EXECUTE ON FUNCTION get_pack_by_id_with_reviews(text) TO authenticated;

-- Permissions pour les utilisateurs anonymes (consultation publique)
GRANT EXECUTE ON FUNCTION get_packs_with_reviews() TO anon;
GRANT EXECUTE ON FUNCTION get_active_packs_with_reviews() TO anon;
GRANT EXECUTE ON FUNCTION get_pack_by_id_with_reviews(text) TO anon;

-- ✅ Script terminé
SELECT 'Fonctions de calcul des ratings créées avec succès!' as status;