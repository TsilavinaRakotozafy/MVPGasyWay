import { createClient } from 'jsr:@supabase/supabase-js@2'

export async function initializeDatabase() {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    // Créer les tables avec Supabase Client (les tables seront créées via l'interface Supabase)
    console.log('Base de données GasyWay prête à être utilisée')
    
    // Vérifier que les tables principales existent
    const { data: tables } = await supabase.rpc('get_schema_tables')
    console.log('Tables disponibles:', tables)
    
    return { success: true, message: 'Base de données initialisée' }
  } catch (error) {
    console.error('Erreur initialisation base:', error)
    return { success: false, error: error.message }
  }
}

// Types pour les données GasyWay
export type UserStatus = 'active' | 'blocked' | 'pending'
export type UserRole = 'traveler' | 'admin' | 'partner_stub'
export type PackStatus = 'active' | 'inactive' | 'archived'
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'

export interface User {
  id: string
  email: string
  status: UserStatus
  gdpr_consent: boolean
  locale: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface Profile {
  id: string
  user_id: string
  first_name: string
  last_name: string
  phone?: string
  avatar_url?: string
  bio?: string
  locale: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  description?: string
  icon?: string
  created_at: string
  updated_at: string
}

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
  coordinates?: { lat: number; lng: number }
  category_id: string
  status: PackStatus
  images: string[]
  included_services: string[]
  excluded_services?: string[]
  itinerary?: any
  difficulty_level?: 'easy' | 'medium' | 'hard'
  season_start?: string
  season_end?: string
  cancellation_policy?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  pack_id: string
  user_id: string
  participants_count: number
  start_date: string
  end_date: string
  total_amount: number
  currency: string
  status: BookingStatus
  special_requests?: string
  participant_details?: any
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  pack_id: string
  user_id: string
  booking_id?: string
  rating: number
  title?: string
  comment?: string
  images?: string[]
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface Favorite {
  id: string
  user_id: string
  pack_id: string
  created_at: string
}

export interface Interest {
  id: string
  name: string
  icon?: string
  created_at: string
}

export interface UserInterest {
  id: string
  user_id: string
  interest_id: string
  created_at: string
}

export interface Payment {
  id: string
  booking_id: string
  amount: number
  currency: string
  status: PaymentStatus
  payment_method: string
  transaction_id?: string
  gateway_response?: any
  created_at: string
  updated_at: string
}