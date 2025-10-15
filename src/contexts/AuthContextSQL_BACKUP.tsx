// VERSION ORIGINALE avec nettoyage agressif
const signIn = async (email: string, password: string) => {
  try {
    console.log('🔄 Tentative de connexion pour:', email)
    
    // Nettoyer d'abord toute session corrompue
    await supabase.auth.signOut()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('❌ Erreur de connexion:', error.message)
      
      let errorMessage = 'Erreur de connexion'
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Email ou mot de passe incorrect'
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Veuillez confirmer votre email'
      } else if (error.message.includes('Too many requests')) {
        errorMessage = 'Trop de tentatives, veuillez réessayer plus tard'
      } else {
        errorMessage = error.message
      }
      
      return { error: errorMessage }
    }

    if (data?.user && data?.session) {
      console.log('✅ Connexion réussie pour:', data.user.email)
      
      // La session sera automatiquement mise à jour via onAuthStateChange
      // et loadUserData sera appelé
      
      return {}
    }

    return { error: 'Erreur inattendue lors de la connexion' }
  } catch (error: any) {
    console.error('❌ Erreur critique de connexion:', error)
    return { error: 'Erreur de connexion' }
  }
}