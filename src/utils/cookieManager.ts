/**
 * 🍪 GESTIONNAIRE DE COOKIES RGPD COMPLET
 * Conforme aux exigences RGPD pour GasyWay
 */

// Déclarations TypeScript pour les services externes
declare global {
  interface Window {
    dataLayer: any[];
    fbq: (...args: any[]) => void;
    gtag: (...args: any[]) => void;
  }
}

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  timestamp?: string;
}

const STORAGE_KEY = 'gasyway-cookie-consent';
const COOKIE_EXPIRY_DAYS = 365;

/**
 * 📝 DOCUMENTATION DES COOKIES UTILISÉS
 */
export const COOKIE_CATALOG = {
  necessary: [
    {
      name: 'gasyway-auth-token',
      purpose: 'Token d\'authentification utilisateur',
      duration: '24h',
      provider: 'GasyWay'
    },
    {
      name: 'gasyway-session',
      purpose: 'Session utilisateur',
      duration: 'Session',
      provider: 'GasyWay'
    },
    {
      name: 'gasyway-cookie-consent',
      purpose: 'Préférences de cookies',
      duration: '365 jours',
      provider: 'GasyWay'
    }
  ],
  analytics: [
    {
      name: '_ga',
      purpose: 'Google Analytics - Identifiant unique',
      duration: '2 ans',
      provider: 'Google'
    },
    {
      name: '_ga_*',
      purpose: 'Google Analytics - Sessions',
      duration: '2 ans',
      provider: 'Google'
    },
    {
      name: 'gasyway-analytics',
      purpose: 'Statistiques internes',
      duration: '30 jours',
      provider: 'GasyWay'
    }
  ],
  marketing: [
    {
      name: '_fbp',
      purpose: 'Facebook Pixel',
      duration: '90 jours',
      provider: 'Facebook'
    },
    {
      name: 'gasyway-marketing',
      purpose: 'Préférences publicitaires',
      duration: '180 jours',
      provider: 'GasyWay'
    }
  ],
  preferences: [
    {
      name: 'gasyway-theme',
      purpose: 'Thème d\'affichage',
      duration: '365 jours',
      provider: 'GasyWay'
    },
    {
      name: 'gasyway-language',
      purpose: 'Préférence de langue',
      duration: '365 jours',
      provider: 'GasyWay'
    },
    {
      name: 'gasyway-region',
      purpose: 'Région préférée',
      duration: '365 jours',
      provider: 'GasyWay'
    }
  ]
};

/**
 * 🔍 OBTENIR LES PRÉFÉRENCES ACTUELLES
 */
export function getCookiePreferences(): CookiePreferences | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    
    // Vérifier si les préférences ont expiré
    if (parsed.timestamp) {
      const stored = new Date(parsed.timestamp);
      const now = new Date();
      const diffDays = (now.getTime() - stored.getTime()) / (1000 * 60 * 60 * 24);
      
      if (diffDays > COOKIE_EXPIRY_DAYS) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
    }
    
    return {
      necessary: true, // Toujours true
      analytics: parsed.analytics || false,
      marketing: parsed.marketing || false,
      preferences: parsed.preferences || false,
      timestamp: parsed.timestamp
    };
  } catch (error) {
    console.error('Erreur lecture préférences cookies:', error);
    return null;
  }
}

/**
 * 💾 SAUVEGARDER LES PRÉFÉRENCES
 */
export function saveCookiePreferences(preferences: CookiePreferences): void {
  try {
    const toSave = {
      ...preferences,
      necessary: true, // Forcer à true
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    
    // Déclencher l'événement pour notifier l'app
    window.dispatchEvent(new CustomEvent('cookie-consent-updated', {
      detail: toSave
    }));
    
    console.log('🍪 Préférences cookies sauvegardées:', toSave);
  } catch (error) {
    console.error('Erreur sauvegarde préférences cookies:', error);
  }
}

/**
 * 🚫 SUPPRIMER LES COOKIES NON AUTORISÉS
 */
export function enforceConsent(): void {
  console.log('🔧 Mode développement - Enforcement cookies désactivé');
  return; // TEMPORAIREMENT DÉSACTIVÉ
  
  const preferences = getCookiePreferences();
  if (!preferences) return;
  
  // Supprimer les cookies analytics si non autorisés
  if (!preferences.analytics) {
    deleteCookiesByCategory('analytics');
  }
  
  // Supprimer les cookies marketing si non autorisés
  if (!preferences.marketing) {
    deleteCookiesByCategory('marketing');
  }
  
  // Supprimer les cookies de préférences si non autorisés
  if (!preferences.preferences) {
    deleteCookiesByCategory('preferences');
  }
}

/**
 * 🗑️ SUPPRIMER LES COOKIES PAR CATÉGORIE
 */
function deleteCookiesByCategory(category: keyof typeof COOKIE_CATALOG): void {
  const cookies = COOKIE_CATALOG[category];
  
  cookies.forEach(cookie => {
    // Supprimer le cookie
    document.cookie = `${cookie.name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${cookie.name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
    
    // Supprimer du localStorage si applicable
    if (cookie.name.startsWith('gasyway-')) {
      localStorage.removeItem(cookie.name);
      sessionStorage.removeItem(cookie.name);
    }
  });
  
  console.log(`🗑️ Cookies ${category} supprimés`);
}

/**
 * ✅ VÉRIFIER SI UN TYPE DE COOKIE EST AUTORISÉ
 */
export function isCookieTypeAllowed(type: keyof CookiePreferences): boolean {
  const preferences = getCookiePreferences();
  if (!preferences) return false;
  
  return preferences[type] === true;
}

/**
 * 🔄 RÉINITIALISER LE CONSENTEMENT
 */
export function resetConsent(): void {
  localStorage.removeItem(STORAGE_KEY);
  
  // Supprimer tous les cookies optionnels
  deleteCookiesByCategory('analytics');
  deleteCookiesByCategory('marketing');
  deleteCookiesByCategory('preferences');
  
  // Déclencher l'événement de réinitialisation
  window.dispatchEvent(new CustomEvent('reset-cookie-consent'));
  
  console.log('🔄 Consentement cookies réinitialisé');
}

/**
 * 📊 ANALYTICS - GOOGLE ANALYTICS
 */
export function initGoogleAnalytics(): void {
  try {
    if (!isCookieTypeAllowed('analytics')) return;
    
    // Lire l'ID depuis les variables d'environnement
    let GA_ID = 'G-XXXXXXXXXX';
    try {
      GA_ID = import.meta.env?.VITE_GOOGLE_ANALYTICS_ID || 'G-XXXXXXXXXX';
    } catch (error) {
      console.warn('⚠️ Variables d\'environnement non disponibles');
    }
    
    // Vérifier que l'ID est configuré
    if (GA_ID === 'G-XXXXXXXXXX') {
      console.warn('⚠️ Google Analytics ID non configuré. Ajoutez VITE_GOOGLE_ANALYTICS_ID dans vos variables d\'environnement.');
      return;
    }
  
  // Charger Google Analytics
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);
  
  // Configuration GA
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  
  gtag('js', new Date());
  gtag('config', GA_ID, {
    anonymize_ip: true,
    cookie_expires: 63072000 // 2 ans
  });
  
  console.log(`📊 Google Analytics initialisé avec ID: ${GA_ID}`);
  } catch (error) {
    console.warn('⚠️ Erreur lors de l\'initialisation de Google Analytics:', error);
  }
}

/**
 * 📱 MARKETING - FACEBOOK PIXEL
 */
export function initFacebookPixel(): void {
  try {
    if (!isCookieTypeAllowed('marketing')) return;
    
    // Lire l'ID depuis les variables d'environnement
    let PIXEL_ID = 'XXXXXXXXXXXXXXX';
    try {
      PIXEL_ID = import.meta.env?.VITE_FACEBOOK_PIXEL_ID || 'XXXXXXXXXXXXXXX';
    } catch (error) {
      console.warn('⚠️ Variables d\'environnement non disponibles');
    }
    
    // Vérifier que l'ID est configuré
    if (PIXEL_ID === 'XXXXXXXXXXXXXXX') {
      console.warn('⚠️ Facebook Pixel ID non configuré. Ajoutez VITE_FACEBOOK_PIXEL_ID dans vos variables d\'environnement.');
      return;
    }
    
    // Code Facebook Pixel
    !function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
      if(f.fbq) return;
      n = f.fbq = function() {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if(!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    
    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
    
    console.log(`📱 Facebook Pixel initialisé avec ID: ${PIXEL_ID}`);
  } catch (error) {
    console.warn('⚠️ Erreur lors de l\'initialisation de Facebook Pixel:', error);
  }
}

/**
 * 🎯 INITIALISER TOUS LES SERVICES SELON PRÉFÉRENCES
 */
export function initializeConsentedServices(): void {
  console.log('🔧 Mode développement - Services cookies désactivés');
  return; // TEMPORAIREMENT DÉSACTIVÉ
  
  try {
    const preferences = getCookiePreferences();
    if (!preferences) return;
    
    if (preferences.analytics) {
      initGoogleAnalytics();
    }
    
    if (preferences.marketing) {
      initFacebookPixel();
    }
    
    if (preferences.preferences) {
      // Charger les préférences utilisateur sauvegardées
      loadUserPreferences();
    }
  } catch (error) {
    console.warn('⚠️ Erreur lors de l\'initialisation des services cookies:', error);
  }
  
  console.log('🎯 Services initialisés selon consentement:', preferences);
}

/**
 * 💾 CHARGER LES PRÉFÉRENCES UTILISATEUR
 */
function loadUserPreferences(): void {
  try {
    const theme = localStorage.getItem('gasyway-theme');
    if (theme) {
      document.documentElement.setAttribute('data-theme', theme);
    }
    
    const language = localStorage.getItem('gasyway-language');
    if (language) {
      document.documentElement.setAttribute('lang', language);
    }
    
    console.log('💾 Préférences utilisateur chargées');
  } catch (error) {
    console.error('Erreur chargement préférences:', error);
  }
}

/**
 * 📋 OBTENIR LA LISTE COMPLÈTE DES COOKIES POUR LA DOCUMENTATION
 */
export function getAllCookiesDocumentation() {
  return COOKIE_CATALOG;
}

// Déclarations TypeScript pour les services externes
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}