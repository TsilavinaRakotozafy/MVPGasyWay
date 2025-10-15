// ❌ CONTEXTE OBSOLETE - NE PAS UTILISER
// Utilisez AuthContextSQL.tsx à la place

console.warn('⚠️ AuthContext.tsx est obsolète. Utilisez AuthContextSQL.tsx')

// Export vide pour éviter les erreurs d'import
export const useAuth = () => {
  throw new Error('❌ ERREUR: Vous utilisez l\'ancien contexte AuthContext.tsx. Utilisez AuthContextSQL.tsx à la place!')
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  throw new Error('❌ ERREUR: Vous utilisez l\'ancien contexte AuthContext.tsx. Utilisez AuthContextSQL.tsx à la place!')
}