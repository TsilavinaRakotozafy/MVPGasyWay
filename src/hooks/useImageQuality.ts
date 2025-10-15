import { useState, useEffect } from 'react'
import { ImageCompressionOptions } from '../utils/imageCompression'

type ImageContext = 'avatar' | 'gallery' | 'thumbnail' | 'banner' | 'product'

/**
 * Hook pour gérer la qualité d'image selon le contexte
 */
export function useImageQuality(context: ImageContext = 'avatar') {
  const [quality, setQuality] = useState<ImageCompressionOptions>()

  // 🎯 Configurations par contexte
  const contextConfigs: Record<ImageContext, ImageCompressionOptions> = {
    avatar: {
      maxWidth: 400,
      maxHeight: 400, 
      quality: 0.9,
      maxSizeKB: 200
    },
    gallery: {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.95,
      maxSizeKB: 800
    },
    thumbnail: {
      maxWidth: 200,
      maxHeight: 200,
      quality: 0.75,
      maxSizeKB: 50
    },
    banner: {
      maxWidth: 1600,
      maxHeight: 600,
      quality: 0.92,
      maxSizeKB: 500
    },
    product: {
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.88,
      maxSizeKB: 400
    }
  }

  useEffect(() => {
    setQuality(contextConfigs[context])
  }, [context])

  // 🔄 Méthodes pour ajuster la qualité
  const adjustQuality = (newQuality: number) => {
    if (quality) {
      setQuality({
        ...quality,
        quality: Math.max(0.3, Math.min(1.0, newQuality))
      })
    }
  }

  const adjustSize = (maxSizeKB: number) => {
    if (quality) {
      setQuality({
        ...quality,
        maxSizeKB: Math.max(10, maxSizeKB)
      })
    }
  }

  const setCustomConfig = (config: Partial<ImageCompressionOptions>) => {
    if (quality) {
      setQuality({
        ...quality,
        ...config
      })
    }
  }

  return {
    quality,
    context,
    adjustQuality,
    adjustSize,
    setCustomConfig,
    availableContexts: Object.keys(contextConfigs) as ImageContext[]
  }
}

/**
 * Hook simple pour obtenir une configuration optimisée selon la taille du fichier
 */
export function useAdaptiveQuality(fileSizeKB: number) {
  const getOptimalConfig = (): ImageCompressionOptions => {
    // 📊 Ajustement intelligent selon la taille source
    if (fileSizeKB > 5000) {
      // Fichier très lourd (>5MB) - compression agressive
      return {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.8,
        maxSizeKB: 300
      }
    } else if (fileSizeKB > 2000) {
      // Fichier lourd (>2MB) - compression modérée  
      return {
        maxWidth: 600,
        maxHeight: 600,
        quality: 0.85,
        maxSizeKB: 250
      }
    } else {
      // Fichier normal - compression douce
      return {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.9,
        maxSizeKB: 200
      }
    }
  }

  return getOptimalConfig()
}