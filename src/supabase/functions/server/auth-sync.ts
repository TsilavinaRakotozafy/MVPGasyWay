import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

export interface SyncAnalysis {
  authUsersCount: number
  dbUsersCount: number
  synchronizedCount: number
  issues: SyncIssue[]
}

export interface SyncIssue {
  type: 'missing_in_users' | 'role_mismatch' | 'orphaned_user'
  user_id: string
  email: string
  description: string
  auth_metadata?: any
  db_data?: any
}

/**
 * Analyse la synchronisation entre auth.users et public.users
 * Fonction sécurisée côté serveur uniquement
 */
export async function analyzeAuthSync(): Promise<{ success: boolean; analysis?: SyncAnalysis; error?: string }> {
  try {
    console.log('🔍 [AuthSync] Début analyse synchronisation...')

    // 1. Récupérer tous les utilisateurs Auth (côté serveur seulement)
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      throw new Error(`Erreur récupération auth users: ${authError.message}`)
    }

    const authUsers = authData.users || []
    console.log(`📊 [AuthSync] Utilisateurs Auth trouvés: ${authUsers.length}`)

    // 2. Récupérer tous les utilisateurs DB
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('id, email, role, status, first_name, last_name, created_at')

    if (dbError) {
      throw new Error(`Erreur récupération db users: ${dbError.message}`)
    }

    console.log(`📊 [AuthSync] Utilisateurs DB trouvés: ${dbUsers?.length || 0}`)

    // 3. Analyser les différences
    const issues: SyncIssue[] = []

    // Chercher les utilisateurs Auth manquants en DB
    for (const authUser of authUsers) {
      const dbUser = dbUsers?.find(u => u.id === authUser.id)
      
      if (!dbUser) {
        issues.push({
          type: 'missing_in_users',
          user_id: authUser.id,
          email: authUser.email || 'Pas d\'email',
          description: `Utilisateur ${authUser.email} existe dans Auth mais pas dans users`,
          auth_metadata: authUser.user_metadata
        })
      } else {
        // Vérifier les incohérences de rôle
        const authRole = authUser.user_metadata?.role || 'voyageur'
        if (authRole !== dbUser.role) {
          issues.push({
            type: 'role_mismatch',
            user_id: authUser.id,
            email: authUser.email || 'Pas d\'email',
            description: `Rôle incohérent: Auth=${authRole}, DB=${dbUser.role}`,
            auth_metadata: authUser.user_metadata,
            db_data: { role: dbUser.role }
          })
        }
      }
    }

    // Chercher les utilisateurs DB orphelins
    if (dbUsers) {
      for (const dbUser of dbUsers) {
        const authUser = authUsers.find(u => u.id === dbUser.id)
        
        if (!authUser) {
          issues.push({
            type: 'orphaned_user',
            user_id: dbUser.id,
            email: dbUser.email,
            description: `Utilisateur ${dbUser.email} existe dans users mais pas dans Auth`,
            db_data: { role: dbUser.role, status: dbUser.status }
          })
        }
      }
    }

    // 4. Calculer les statistiques
    const analysis: SyncAnalysis = {
      authUsersCount: authUsers.length,
      dbUsersCount: dbUsers?.length || 0,
      synchronizedCount: authUsers.length - issues.filter(i => i.type === 'missing_in_users').length,
      issues
    }

    console.log(`✅ [AuthSync] Analyse terminée: ${issues.length} problème(s) trouvé(s)`)
    
    return { success: true, analysis }

  } catch (error) {
    console.error('❌ [AuthSync] Erreur analyse:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Corrige automatiquement un utilisateur manquant dans users
 */
export async function fixMissingUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🔧 [AuthSync] Correction utilisateur manquant: ${userId}`)

    // 1. Récupérer l'utilisateur Auth
    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId)
    
    if (authError || !authData.user) {
      throw new Error(`Utilisateur Auth introuvable: ${authError?.message}`)
    }

    const authUser = authData.user

    // 2. Créer l'entrée dans users
    const userData = {
      id: authUser.id,
      email: authUser.email || '',
      role: authUser.user_metadata?.role || 'voyageur',
      status: 'active',
      first_name: authUser.user_metadata?.first_name || null,
      last_name: authUser.user_metadata?.last_name || null,
      phone: authUser.user_metadata?.phone || null,
      gdpr_consent: authUser.user_metadata?.gdpr_consent ?? true,
      locale: authUser.user_metadata?.locale || 'fr',
      first_login_completed: authUser.user_metadata?.first_login_completed ?? false,
      created_at: authUser.created_at,
      updated_at: new Date().toISOString(),
      last_login: authUser.last_sign_in_at || new Date().toISOString()
    }

    const { error: insertError } = await supabase
      .from('users')
      .insert(userData)

    if (insertError) {
      throw new Error(`Erreur insertion: ${insertError.message}`)
    }

    console.log(`✅ [AuthSync] Utilisateur ${authUser.email} synchronisé`)
    return { success: true }

  } catch (error) {
    console.error(`❌ [AuthSync] Erreur correction ${userId}:`, error)
    return { success: false, error: error.message }
  }
}

/**
 * Corrige une incohérence de rôle
 */
export async function fixRoleMismatch(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🔧 [AuthSync] Correction rôle: ${userId}`)

    // 1. Récupérer l'utilisateur Auth (source de vérité)
    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId)
    
    if (authError || !authData.user) {
      throw new Error(`Utilisateur Auth introuvable: ${authError?.message}`)
    }

    const correctRole = authData.user.user_metadata?.role || 'voyageur'

    // 2. Mettre à jour la DB
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        role: correctRole,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      throw new Error(`Erreur mise à jour: ${updateError.message}`)
    }

    console.log(`✅ [AuthSync] Rôle corrigé pour ${authData.user.email}: ${correctRole}`)
    return { success: true }

  } catch (error) {
    console.error(`❌ [AuthSync] Erreur correction rôle ${userId}:`, error)
    return { success: false, error: error.message }
  }
}

/**
 * Supprime un utilisateur orphelin de la DB
 */
export async function removeOrphanedUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🗑️ [AuthSync] Suppression utilisateur orphelin: ${userId}`)

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) {
      throw new Error(`Erreur suppression: ${error.message}`)
    }

    console.log(`✅ [AuthSync] Utilisateur orphelin ${userId} supprimé`)
    return { success: true }

  } catch (error) {
    console.error(`❌ [AuthSync] Erreur suppression ${userId}:`, error)
    return { success: false, error: error.message }
  }
}

/**
 * Corrige automatiquement TOUS les problèmes détectés
 */
export async function fixAllIssues(): Promise<{ success: boolean; fixed: number; errors: string[]; error?: string }> {
  try {
    console.log('🔧 [AuthSync] Correction automatique globale...')

    // 1. Analyser d'abord
    const analysisResult = await analyzeAuthSync()
    
    if (!analysisResult.success || !analysisResult.analysis) {
      throw new Error(analysisResult.error || 'Échec analyse')
    }

    const { issues } = analysisResult.analysis
    const errors: string[] = []
    let fixed = 0

    // 2. Corriger chaque problème
    for (const issue of issues) {
      try {
        switch (issue.type) {
          case 'missing_in_users':
            const fixResult = await fixMissingUser(issue.user_id)
            if (fixResult.success) {
              fixed++
            } else {
              errors.push(`${issue.email}: ${fixResult.error}`)
            }
            break

          case 'role_mismatch':
            const roleResult = await fixRoleMismatch(issue.user_id)
            if (roleResult.success) {
              fixed++
            } else {
              errors.push(`${issue.email}: ${roleResult.error}`)
            }
            break

          case 'orphaned_user':
            const orphanResult = await removeOrphanedUser(issue.user_id)
            if (orphanResult.success) {
              fixed++
            } else {
              errors.push(`${issue.email}: ${orphanResult.error}`)
            }
            break
        }
      } catch (error) {
        errors.push(`${issue.email}: ${error.message}`)
      }
    }

    console.log(`✅ [AuthSync] Correction globale terminée: ${fixed} réparations, ${errors.length} erreurs`)
    
    return { success: true, fixed, errors }

  } catch (error) {
    console.error('❌ [AuthSync] Erreur correction globale:', error)
    return { success: false, fixed: 0, errors: [], error: error.message }
  }
}

/**
 * Crée le trigger de synchronisation automatique
 */
export async function createAutoSyncTrigger(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔧 [AuthSync] Création trigger automatique...')

    // SQL pour le trigger ultra-robuste
    const triggerSQL = `
-- =====================================================
-- TRIGGER ROBUSTE DE SYNCHRONISATION AUTH → USERS
-- =====================================================

-- 1. Fonction trigger sécurisée
CREATE OR REPLACE FUNCTION public.sync_auth_to_users()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  -- Pour les nouvelles créations/modifications
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    
    -- Vérifier que l'email n'est pas vide
    IF NEW.email IS NULL OR NEW.email = '' THEN
      RAISE WARNING 'User % has no email, skipping sync', NEW.id;
      RETURN NEW;
    END IF;
    
    -- Synchroniser avec gestion d'erreurs
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
        role = COALESCE(NEW.raw_user_meta_data->>'role', users.role),
        first_name = COALESCE(NEW.raw_user_meta_data->>'first_name', users.first_name),
        last_name = COALESCE(NEW.raw_user_meta_data->>'last_name', users.last_name),
        phone = COALESCE(NEW.raw_user_meta_data->>'phone', users.phone),
        gdpr_consent = COALESCE((NEW.raw_user_meta_data->>'gdpr_consent')::boolean, users.gdpr_consent),
        locale = COALESCE(NEW.raw_user_meta_data->>'locale', users.locale),
        first_login_completed = COALESCE((NEW.raw_user_meta_data->>'first_login_completed')::boolean, users.first_login_completed),
        updated_at = NOW(),
        last_login = COALESCE(NEW.last_sign_in_at, users.last_login);
        
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to sync user % to public.users: %', NEW.id, SQLERRM;
      -- Ne pas bloquer la création du user Auth même si la sync échoue
    END;
    
    RETURN NEW;
  END IF;
  
  -- Pour les suppressions
  IF TG_OP = 'DELETE' THEN
    BEGIN
      UPDATE public.users 
      SET 
        status = 'deleted',
        updated_at = NOW()
      WHERE id = OLD.id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to mark user % as deleted: %', OLD.id, SQLERRM;
    END;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- 2. Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS sync_auth_to_users_trigger ON auth.users;

-- 3. Créer le nouveau trigger
CREATE TRIGGER sync_auth_to_users_trigger
  AFTER INSERT OR UPDATE OR DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_auth_to_users();

-- 4. Synchroniser les utilisateurs existants
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
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'role', 'voyageur'),
  'active',
  au.raw_user_meta_data->>'first_name',
  au.raw_user_meta_data->>'last_name',
  au.raw_user_meta_data->>'phone',
  COALESCE((au.raw_user_meta_data->>'gdpr_consent')::boolean, true),
  COALESCE(au.raw_user_meta_data->>'locale', 'fr'),
  COALESCE((au.raw_user_meta_data->>'first_login_completed')::boolean, false),
  au.created_at,
  NOW(),
  COALESCE(au.last_sign_in_at, NOW())
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
  AND au.email IS NOT NULL
ON CONFLICT (id) DO NOTHING;
    `

    // Exécuter le SQL
    const { error } = await supabase.rpc('exec_sql', { sql: triggerSQL })

    if (error) {
      throw new Error(`Erreur création trigger: ${error.message}`)
    }

    console.log('✅ [AuthSync] Trigger automatique créé avec succès')
    return { success: true }

  } catch (error) {
    console.error('❌ [AuthSync] Erreur création trigger:', error)
    return { success: false, error: error.message }
  }
}