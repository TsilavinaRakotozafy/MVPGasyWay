-- =====================================================
-- TRIGGER ULTRA-ROBUSTE DE SYNCHRONISATION AUTH → USERS
-- Solution pérenne pour GasyWay sans données mockées
-- =====================================================

-- 1. Fonction trigger ultra-sécurisée avec gestion d'erreurs complète
CREATE OR REPLACE FUNCTION public.sync_auth_to_users()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $
DECLARE
  error_context text;
BEGIN
  -- Pour les nouvelles créations/modifications
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    
    -- Validation robuste des données d'entrée
    IF NEW.id IS NULL THEN
      RAISE WARNING 'User ID is null, skipping sync';
      RETURN NEW;
    END IF;
    
    IF NEW.email IS NULL OR NEW.email = '' THEN
      RAISE WARNING 'User % has no email, skipping sync', NEW.id;
      RETURN NEW;
    END IF;
    
    -- Synchronisation avec gestion d'erreurs robuste
    BEGIN
      INSERT INTO public.users (
        id,
        email,
        role,
        status,
        first_name,
        last_name,
        phone,
        gdpr_consent,
        locale,
        first_login_completed,
        created_at,
        updated_at,
        last_login
      ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'voyageur'),
        'active',
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name',
        NEW.raw_user_meta_data->>'phone',
        COALESCE((NEW.raw_user_meta_data->>'gdpr_consent')::boolean, true),
        COALESCE(NEW.raw_user_meta_data->>'locale', 'fr'),
        COALESCE((NEW.raw_user_meta_data->>'first_login_completed')::boolean, false),
        NEW.created_at,
        NOW(),
        COALESCE(NEW.last_sign_in_at, NOW())
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        -- Préserver les données existantes si les nouvelles sont vides
        role = CASE 
          WHEN NEW.raw_user_meta_data->>'role' IS NOT NULL 
          THEN NEW.raw_user_meta_data->>'role'
          ELSE users.role 
        END,
        first_name = COALESCE(NEW.raw_user_meta_data->>'first_name', users.first_name),
        last_name = COALESCE(NEW.raw_user_meta_data->>'last_name', users.last_name),
        phone = COALESCE(NEW.raw_user_meta_data->>'phone', users.phone),
        gdpr_consent = COALESCE(
          (NEW.raw_user_meta_data->>'gdpr_consent')::boolean, 
          users.gdpr_consent
        ),
        locale = COALESCE(NEW.raw_user_meta_data->>'locale', users.locale),
        first_login_completed = COALESCE(
          (NEW.raw_user_meta_data->>'first_login_completed')::boolean, 
          users.first_login_completed
        ),
        updated_at = NOW(),
        last_login = CASE 
          WHEN NEW.last_sign_in_at IS NOT NULL 
          THEN NEW.last_sign_in_at
          ELSE users.last_login 
        END;
        
      -- Log de succès
      RAISE NOTICE 'Successfully synced user % (%) to public.users', NEW.email, NEW.id;
        
    EXCEPTION 
      WHEN unique_violation THEN
        -- Gestion spécifique des violations d'unicité
        RAISE WARNING 'Unique violation syncing user % (%): %', NEW.email, NEW.id, SQLERRM;
        
      WHEN check_violation THEN
        -- Gestion des violations de contraintes
        RAISE WARNING 'Check violation syncing user % (%): %', NEW.email, NEW.id, SQLERRM;
        
      WHEN foreign_key_violation THEN
        -- Gestion des violations de clés étrangères
        RAISE WARNING 'Foreign key violation syncing user % (%): %', NEW.email, NEW.id, SQLERRM;
        
      WHEN OTHERS THEN
        -- Capture de toute autre erreur
        GET STACKED DIAGNOSTICS error_context = PG_EXCEPTION_CONTEXT;
        RAISE WARNING 'Failed to sync user % (%) to public.users: % - Context: %', 
          NEW.email, NEW.id, SQLERRM, error_context;
        -- IMPORTANT: Ne pas bloquer la création Auth même si la sync échoue
    END;
    
    RETURN NEW;
  END IF;
  
  -- Pour les suppressions (soft delete sécurisé)
  IF TG_OP = 'DELETE' THEN
    BEGIN
      UPDATE public.users 
      SET 
        status = 'deleted',
        updated_at = NOW()
      WHERE id = OLD.id;
      
      RAISE NOTICE 'Marked user % as deleted in public.users', OLD.id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to mark user % as deleted: %', OLD.id, SQLERRM;
    END;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$;

-- 2. Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS sync_auth_to_users_trigger ON auth.users;

-- 3. Créer le nouveau trigger robuste
CREATE TRIGGER sync_auth_to_users_trigger
  AFTER INSERT OR UPDATE OR DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_auth_to_users();

-- 4. Synchronisation initiale robuste des utilisateurs existants
-- Cette partie synchronise tous les utilisateurs Auth non présents dans users
DO $
DECLARE
  user_record RECORD;
  sync_count integer := 0;
  error_count integer := 0;
BEGIN
  RAISE NOTICE 'Début synchronisation initiale des utilisateurs existants...';
  
  FOR user_record IN 
    SELECT 
      au.id,
      au.email,
      au.raw_user_meta_data,
      au.created_at,
      au.last_sign_in_at
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL
      AND au.email IS NOT NULL
  LOOP
    BEGIN
      INSERT INTO public.users (
        id,
        email,
        role,
        status,
        first_name,
        last_name,
        phone,
        gdpr_consent,
        locale,
        first_login_completed,
        created_at,
        updated_at,
        last_login
      ) VALUES (
        user_record.id,
        user_record.email,
        COALESCE(user_record.raw_user_meta_data->>'role', 'voyageur'),
        'active',
        user_record.raw_user_meta_data->>'first_name',
        user_record.raw_user_meta_data->>'last_name',
        user_record.raw_user_meta_data->>'phone',
        COALESCE((user_record.raw_user_meta_data->>'gdpr_consent')::boolean, true),
        COALESCE(user_record.raw_user_meta_data->>'locale', 'fr'),
        COALESCE((user_record.raw_user_meta_data->>'first_login_completed')::boolean, false),
        user_record.created_at,
        NOW(),
        COALESCE(user_record.last_sign_in_at, NOW())
      )
      ON CONFLICT (id) DO NOTHING; -- Sécurité supplémentaire
      
      sync_count := sync_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      RAISE WARNING 'Erreur synchronisation utilisateur % (%): %', 
        user_record.email, user_record.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '=== SYNCHRONISATION TERMINÉE ===';
  RAISE NOTICE 'Utilisateurs synchronisés avec succès: %', sync_count;
  RAISE NOTICE 'Erreurs de synchronisation: %', error_count;
  RAISE NOTICE 'Trigger automatique activé pour les futurs utilisateurs';
  
END $;

-- 5. Vérification finale et statistiques
DO $
DECLARE
  total_auth integer;
  total_users integer;
  synchronized integer;
BEGIN
  -- Compter les totaux
  SELECT COUNT(*) INTO total_auth FROM auth.users WHERE email IS NOT NULL;
  SELECT COUNT(*) INTO total_users FROM public.users;
  SELECT COUNT(*) INTO synchronized 
  FROM auth.users au 
  INNER JOIN public.users pu ON au.id = pu.id;
  
  RAISE NOTICE '=== STATISTIQUES FINALES ===';
  RAISE NOTICE 'Total auth.users (avec email): %', total_auth;
  RAISE NOTICE 'Total public.users: %', total_users;
  RAISE NOTICE 'Utilisateurs synchronisés: %', synchronized;
  RAISE NOTICE 'Taux de synchronisation: %% ', ROUND((synchronized::numeric / total_auth::numeric) * 100, 2);
  
  IF synchronized = total_auth THEN
    RAISE NOTICE '✅ SYNCHRONISATION PARFAITE - Tous les utilisateurs sont synchronisés!';
  ELSE
    RAISE NOTICE '⚠️  Il reste % utilisateur(s) non synchronisé(s)', (total_auth - synchronized);
  END IF;
  
END $;

-- 6. Message final
DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎯 SYSTÈME DE SYNCHRONISATION AUTOMATIQUE INSTALLÉ';
  RAISE NOTICE 'ℹ️  Tous les nouveaux utilisateurs seront automatiquement synchronisés';
  RAISE NOTICE 'ℹ️  Utilisez le AuthSyncManager pour diagnostiquer d''éventuels problèmes';
  RAISE NOTICE '';
END $;