import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase/client'

interface BrandSettings {
  logo_header: string
  logo_footer: string
  favicon_url: string
  brand_name: string
}

const defaultSettings: BrandSettings = {
  logo_header: 'GasyWay',
  logo_footer: 'GasyWay', 
  favicon_url: '/favicon.ico',
  brand_name: 'GasyWay'
}

export function useBrandSettings() {
  const [settings, setSettings] = useState<BrandSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadBrandSettings = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('brand_settings')
        .select('setting_key, setting_value, file_url')
        .eq('is_active', true)

      if (fetchError) throw fetchError

      // Transformer les données en objet simple
      const brandSettings: BrandSettings = { ...defaultSettings }

      data?.forEach(item => {
        const value = item.file_url || item.setting_value
        if (value && item.setting_key in brandSettings) {
          brandSettings[item.setting_key as keyof BrandSettings] = value
        }
      })

      setSettings(brandSettings)

    } catch (err: any) {
      console.error('Erreur chargement brand settings:', err)
      
      // Si c'est une erreur de permission, on utilise silencieusement les paramètres par défaut
      if (err?.code === '42501' || err?.message?.includes('permission denied')) {
        console.warn('Permissions insuffisantes pour brand_settings, utilisation des valeurs par défaut')
        setError(null) // Pas d'erreur affichée pour les permissions
      } else {
        setError('Erreur lors du chargement des paramètres de marque')
      }
      
      // Garder les paramètres par défaut en cas d'erreur
      setSettings(defaultSettings)
    } finally {
      setLoading(false)
    }
  }

  // Écouter les changements en temps réel
  useEffect(() => {
    loadBrandSettings()

    // Subscription aux changements en temps réel
    const subscription = supabase
      .channel('brand_settings_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'brand_settings' 
      }, () => {
        loadBrandSettings()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    settings,
    loading,
    error,
    refresh: loadBrandSettings
  }
}