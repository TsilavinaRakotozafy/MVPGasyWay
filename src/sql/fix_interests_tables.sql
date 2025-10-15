-- Script de vérification et réparation des tables centres d'intérêt
-- GasyWay - Résolution problème "échec de finalisation"

-- ÉTAPE 1: Vérifier l'existence des tables
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('interests', 'user_interests')
ORDER BY table_name;

-- ÉTAPE 2: Vérifier la structure de la table interests
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'interests'
ORDER BY ordinal_position;

-- ÉTAPE 3: Vérifier la structure de la table user_interests
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_interests'
ORDER BY ordinal_position;

-- ÉTAPE 4: Vérifier les politiques RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('interests', 'user_interests')
ORDER BY tablename, policyname;

-- ÉTAPE 5: Vérifier le contenu de la table interests
SELECT 
    id,
    name,
    status,
    created_at
FROM interests 
ORDER BY name
LIMIT 10;

-- ÉTAPE 6: Compter les centres d'intérêt actifs
SELECT 
    status,
    COUNT(*) as count
FROM interests 
GROUP BY status;

-- ÉTAPE 7: Si aucun centre d'intérêt n'existe, en créer quelques-uns de base
INSERT INTO interests (name, status, created_at, updated_at)
SELECT name, 'active', NOW(), NOW()
FROM (VALUES 
    ('Aventure'),
    ('Culture'),
    ('Nature'),
    ('Gastronomie'),
    ('Plage'),
    ('Randonnée'),
    ('Safari'),
    ('Photographie'),
    ('Histoire'),
    ('Artisanat')
) AS t(name)
WHERE NOT EXISTS (
    SELECT 1 FROM interests WHERE interests.name = t.name
);

-- ÉTAPE 8: Vérifier les relations user_interests pour un utilisateur (remplacer UUID)
-- SELECT 
--     ui.user_id,
--     ui.interest_id,
--     i.name as interest_name,
--     ui.created_at
-- FROM user_interests ui
-- JOIN interests i ON i.id = ui.interest_id
-- WHERE ui.user_id = 'YOUR_USER_ID_HERE'
-- ORDER BY ui.created_at;

-- ÉTAPE 9: Réparer les politiques RLS si nécessaire
-- (Décommentez seulement si les politiques causent des problèmes)

/*
-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "interests_public_read" ON interests;
DROP POLICY IF EXISTS "interests_admin_write" ON interests;
DROP POLICY IF EXISTS "user_interests_own_access" ON user_interests;
DROP POLICY IF EXISTS "user_interests_admin_access" ON user_interests;

-- Créer des politiques simples
CREATE POLICY "interests_select_all" ON interests FOR SELECT 
  TO authenticated, anon USING (true);

CREATE POLICY "user_interests_user_access" ON user_interests FOR ALL 
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
*/

-- ÉTAPE 10: Message de confirmation
SELECT 'Vérification et réparation des centres d''intérêt terminée!' as status;