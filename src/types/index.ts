// ✅ Types centralisés pour l'application GasyWay

export interface Pack {
  id: string
  title: string
  description: string
  short_description?: string
  price: number
  currency: string
  duration_days: number
  max_participants: number
  min_participants: number
  location: string
  category_id: string
  region_id?: string // ✅ Nouvelle relation avec les régions
  status: 'active' | 'inactive' | 'archived'
  images: string[]
  included_services: string[]
  excluded_services?: string[]
  difficulty_level?: 'easy' | 'medium' | 'hard'
  season_start?: string
  season_end?: string
  cancellation_policy?: string
  created_by: string
  created_at: string
  updated_at: string
  category?: {
    id: string
    name: string
    description?: string
    icon?: string
  }
  region?: {
    id: string
    name: string
    slug?: string
  }
  is_favorite?: boolean
  imageUrl?: string
  average_rating?: number
  total_reviews?: number
}

export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  profile_picture_url?: string
  role: 'voyageur' | 'admin'
  status: 'active' | 'blocked' | 'pending'
  first_login_completed: boolean
  created_at: string
  updated_at: string
}

export interface Interest {
  id: string
  name: string
  emoji: string // ✅ Changé de icon à emoji
  category: string // ✅ Changé de category_id à category (string direct)
  description?: string
  created_at: string
  updated_at: string
}

export interface InterestCategory {
  id: string
  name: string
  description?: string
  icon?: string
  created_at: string
  updated_at: string
}

// ✅ Nouveaux types pour les régions
export interface Region {
  id: string
  name: string
  description?: string
  short_description?: string
  image_url?: string
  coordinates_lat?: number
  coordinates_lng?: number
  is_active: boolean
  display_order: number
  slug?: string
  meta_title?: string
  meta_description?: string
  best_season_start?: string
  best_season_end?: string
  climate_info?: string
  access_info?: string
  total_packs: number
  total_interests: number
  total_partners: number
  created_at: string
  updated_at: string
  created_by?: string
  created_by_email?: string
}

export interface RegionInterest {
  id: string
  region_id: string
  interest_id: string
  is_popular: boolean
  notes?: string
  display_order: number
  created_at: string
}

export interface RegionCatalogView {
  id: string
  name: string
  description?: string
  short_description?: string
  image_url?: string
  coordinates_lat?: number
  coordinates_lng?: number
  slug?: string
  meta_title?: string
  meta_description?: string
  total_packs: number
  total_interests: number
  total_partners: number
  best_season_start?: string
  best_season_end?: string
  climate_info?: string
  access_info?: string
  display_order: number
  created_at: string
  updated_at: string
  featured_packs: Array<{
    id: string
    title: string
    price: number
    currency: string
    duration_days: number
    difficulty_level?: string
    image_url?: string
  }>
  region_interests: Array<{
    id: string
    name: string
    emoji: string
    category: string
    is_popular: boolean
  }>
}

export interface Partner {
  id: string
  name: string
  type: string
  description?: string
  logo_url?: string
  website?: string
  phone?: string
  email?: string
  region_id?: string // ✅ Nouvelle relation avec les régions
  is_active: boolean
  created_at: string
  updated_at: string
}

export type PageType = 'home' | 'destinations' | 'catalog' | 'pack-detail' | 'pack-gallery' | 'favorites' | 'bookings' | 'reviews' | 'profile' | 'notifications' | 'messages' | 'about' | 'blog' | 'partners' | 'contact'

export type AdminPageType = 
  | 'dashboard' 
  | 'interests' 
  | 'regions' 
  | 'partners' 
  | 'packs' 
  | 'services' 
  | 'faqs' 
  | 'legal-pages'
  | 'company-info'
  | 'bookings' 
  | 'payments' 
  | 'reviews' 
  | 'users' 
  | 'notifications' 
  | 'messages' 
  | 'audit-logs' 
  | 'profile'
  | 'design-system'
  | 'brand-settings'
  | 'design-checker'
  | 'supabase-config'
  | 'storage-diagnostic'
  | 'regions-images-diagnostic'
  | 'regions-fallback-test'
  | 'auth-sync-fixer'