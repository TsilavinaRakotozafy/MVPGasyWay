/**
 * Utilitaire de compression d'images pour GasyWay
 * Compresse les images en format WebP avec optimisation de taille
 */

interface ImageCompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  maxSizeKB?: number
}

/**
 * Compresse une image en format WebP
 */
export async function compressImageToWebP(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.85,
    maxSizeKB = 500
  } = options

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }

    img.onload = () => {
      try {
        // Calculer les nouvelles dimensions en gardant le ratio
        let { width, height } = img
        const aspectRatio = width / height

        if (width > maxWidth) {
          width = maxWidth
          height = width / aspectRatio
        }
        
        if (height > maxHeight) {
          height = maxHeight
          width = height * aspectRatio
        }

        // Configurer le canvas
        canvas.width = width
        canvas.height = height

        // Dessiner l'image redimensionnée
        ctx.drawImage(img, 0, 0, width, height)

        // Première compression avec la qualité demandée
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }

            // Vérifier la taille et ajuster si nécessaire
            const sizeKB = blob.size / 1024
            
            if (sizeKB <= maxSizeKB) {
              resolve(blob)
            } else {
              // Réduire la qualité pour atteindre la taille cible
              const adjustedQuality = Math.max(0.3, quality * (maxSizeKB / sizeKB))
              
              canvas.toBlob(
                (adjustedBlob) => {
                  if (!adjustedBlob) {
                    reject(new Error('Failed to compress image with adjusted quality'))
                    return
                  }
                  resolve(adjustedBlob)
                },
                'image/webp',
                adjustedQuality
              )
            }
          },
          'image/webp',
          quality
        )
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    // Créer l'URL de l'image pour le chargement
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Valide qu'un fichier est une image supportée
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024 // 10MB max avant compression
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Format non supporté. Utilisez JPG, PNG ou WebP.'
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Fichier trop volumineux. Maximum 10MB.'
    }
  }

  return { valid: true }
}

/**
 * Génère un nom de fichier unique pour l'upload
 * Format: {userId}/{timestamp}-{randomId}.webp (compatible RLS)
 */
export function generateImageFileName(userId: string, originalName: string): string {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 15)
  const extension = 'webp' // Toujours WebP après compression
  
  // 🔧 Format correct pour RLS: userId/filename.webp (sans prefix bucket)
  return `${userId}/${timestamp}-${randomId}.${extension}`
}

/**
 * Prévisualise une image avant upload
 */
export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string)
      } else {
        reject(new Error('Failed to read file'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Error reading file'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * Supprime l'ancienne image de profil du stockage
 */
export function extractFilePathFromUrl(url: string): string | null {
  try {
    // Extraire le chemin du fichier depuis l'URL Supabase
    const urlObj = new URL(url)
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/)
    return pathMatch ? pathMatch[1] : null
  } catch {
    return null
  }
}

/**
 * Configuration par défaut pour les avatars de profil
 */
export const PROFILE_PICTURE_CONFIG: ImageCompressionOptions = {
  maxWidth: 400,
  maxHeight: 400,
  quality: 0.95,        // 🎯 AJUSTE ICI pour changer globalement
  maxSizeKB: 250        // 🎯 Augmente si tu veux plus de qualité
}

/**
 * Configurations alternatives prêtes à l'emploi
 */
export const IMAGE_QUALITY_PRESETS = {
  // 🔥 Qualité maximale (pour portfolios)
  ULTRA_HIGH: {
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.98,
    maxSizeKB: 800
  },
  
  // ⚡ Performance optimisée (pour feed/listes)
  OPTIMIZED: {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.85,
    maxSizeKB: 150
  },
  
  // 🚀 Ultra-compact (pour miniatures)
  COMPACT: {
    maxWidth: 200,
    maxHeight: 200,
    quality: 0.7,
    maxSizeKB: 50
  }
}