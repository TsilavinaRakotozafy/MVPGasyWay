/**
 * Utilitaires pour les recherches sécurisées - Évite les erreurs toLowerCase sur undefined
 */

/**
 * Vérifie si une valeur contient un terme de recherche de façon sécurisée
 */
export const safeIncludes = (value: string | null | undefined, searchTerm: string): boolean => {
  if (!value || typeof value !== 'string') return false;
  if (!searchTerm || typeof searchTerm !== 'string') return true;
  
  try {
    return value.toLowerCase().includes(searchTerm.toLowerCase());
  } catch (error) {
    console.warn('Erreur lors de la recherche sécurisée:', error);
    return false;
  }
};

/**
 * Recherche dans plusieurs champs de façon sécurisée
 */
export const safeMultiFieldSearch = (
  fields: (string | null | undefined)[],
  searchTerm: string
): boolean => {
  if (!searchTerm || typeof searchTerm !== 'string') return true;
  
  return fields.some(field => safeIncludes(field, searchTerm));
};

/**
 * Normalise une chaîne de caractères de façon sécurisée pour la recherche
 */
export const safeNormalize = (value: string | null | undefined): string => {
  if (!value || typeof value !== 'string') return '';
  
  try {
    return value.toLowerCase().trim();
  } catch (error) {
    console.warn('Erreur lors de la normalisation:', error);
    return '';
  }
};

/**
 * Vérifie si une valeur correspond exactement à un terme (insensible à la casse)
 */
export const safeEquals = (value: string | null | undefined, compareValue: string | null | undefined): boolean => {
  const normalizedValue = safeNormalize(value);
  const normalizedCompare = safeNormalize(compareValue);
  
  return normalizedValue === normalizedCompare;
};

/**
 * Génère un slug de façon sécurisée
 */
export const safeSlugify = (value: string | null | undefined): string => {
  if (!value || typeof value !== 'string') return '';
  
  try {
    return value
      .toLowerCase()
      .trim()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[ñ]/g, 'n')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  } catch (error) {
    console.warn('Erreur lors de la génération du slug:', error);
    return '';
  }
};