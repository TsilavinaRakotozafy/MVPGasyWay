import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const app = new Hono()

// CORS middleware
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['POST', 'GET', 'OPTIONS'],
}))

// Interface pour les données admin
interface AdminAccountData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
}

// Créer un compte admin complet
app.post('/create-admin-account', async (c) => {
  try {
    const adminData: AdminAccountData = await c.req.json()
    
    console.log('🔐 Création compte admin:', adminData.email)
    
    // Créer le client Supabase avec les permissions de service
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // Étape 1: Créer l'utilisateur dans auth.users
    console.log('📝 Création dans auth.users...')
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: adminData.email,
      password: adminData.password,
      email_confirm: true, // Confirmer automatiquement l'email
      user_metadata: {
        first_name: adminData.firstName,
        last_name: adminData.lastName,
        role: 'admin'
      }
    })
    
    if (authError) {
      console.error('❌ Erreur auth.users:', authError)
      throw new Error(`Erreur création auth.users: ${authError.message}`)
    }
    
    if (!authUser.user) {
      throw new Error('Utilisateur non créé dans auth.users')
    }
    
    const userId = authUser.user.id
    console.log('✅ Utilisateur créé dans auth.users:', userId)
    
    // Étape 2: Insérer dans public.users
    console.log('📝 Insertion dans public.users...')
    const { error: usersError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: adminData.email,
        role: 'admin',
        gdpr_consent: true,
        status: 'active',
        locale: 'fr',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (usersError) {
      console.error('❌ Erreur public.users:', usersError)
      throw new Error(`Erreur insertion public.users: ${usersError.message}`)
    }
    
    console.log('✅ Données insérées dans public.users')
    
    // Étape 3: Créer le profil dans profiles
    console.log('📝 Création du profil...')
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        first_name: adminData.firstName,
        last_name: adminData.lastName,
        phone: adminData.phone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (profileError) {
      console.error('❌ Erreur profiles:', profileError)
      throw new Error(`Erreur création profil: ${profileError.message}`)
    }
    
    console.log('✅ Profil créé dans profiles')
    
    // Étape 4: Vérification complète
    console.log('🔍 Vérification des données...')
    const { data: verification, error: verifyError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        role,
        status,
        profiles (
          first_name,
          last_name,
          phone
        )
      `)
      .eq('id', userId)
      .single()
    
    if (verifyError) {
      console.error('❌ Erreur vérification:', verifyError)
      throw new Error(`Erreur vérification: ${verifyError.message}`)
    }
    
    console.log('✅ Vérification réussie:', verification)
    
    return c.json({
      success: true,
      message: 'Compte admin créé avec succès',
      userId: userId,
      data: verification
    })
    
  } catch (error: any) {
    console.error('❌ Erreur création compte admin:', error)
    
    return c.json({
      success: false,
      error: error.message || 'Erreur inconnue lors de la création du compte admin'
    }, 500)
  }
})

// Vérifier si un admin existe déjà
app.get('/check-admin-exists', async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role, status')
      .eq('role', 'admin')
      .eq('status', 'active')
    
    if (error) {
      throw new Error(`Erreur vérification admin: ${error.message}`)
    }
    
    return c.json({
      success: true,
      adminExists: data && data.length > 0,
      adminCount: data ? data.length : 0,
      admins: data || []
    })
    
  } catch (error: any) {
    console.error('❌ Erreur vérification admin:', error)
    
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// Réinitialiser le mot de passe admin
app.post('/reset-admin-password', async (c) => {
  try {
    const { email, newPassword } = await c.req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Trouver l'utilisateur admin
    const { data: userData, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .eq('role', 'admin')
      .single()
    
    if (findError || !userData) {
      throw new Error('Admin non trouvé')
    }
    
    // Mettre à jour le mot de passe
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userData.id,
      { password: newPassword }
    )
    
    if (updateError) {
      throw new Error(`Erreur mise à jour mot de passe: ${updateError.message}`)
    }
    
    return c.json({
      success: true,
      message: 'Mot de passe admin mis à jour avec succès'
    })
    
  } catch (error: any) {
    console.error('❌ Erreur reset password admin:', error)
    
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

export default app