/**
 * RadarPolítico - Cliente Supabase
 * Configuração da conexão com o banco de dados
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const SUPABASE_URL = "https://shdnkxjqprvbsgaegcia.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZG5reGpxcHJ2YnNnYWVnY2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzOTk0ODIsImV4cCI6MjA4Nzk3NTQ4Mn0.b-dOsM60n7Ma0oKPhJfJZpoXSXr_B9YupBmk6E2pW6Y"

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Type helpers for better type inference
export type Politician = Database['public']['Tables']['politicians']['Row']
export type Mention = Database['public']['Tables']['mentions']['Row']
export type Alert = Database['public']['Tables']['alerts']['Row']
export type DailyReport = Database['public']['Tables']['daily_reports']['Row']
export type Competitor = Database['public']['Tables']['competitors']['Row']
export type NetworkMetric = Database['public']['Tables']['network_metrics']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type UserSettings = Database['public']['Tables']['user_settings']['Row']
export type SentimentType = Database['public']['Enums']['sentiment_type']
export type AlertType = Database['public']['Enums']['alert_type']
export type AlertPriority = Database['public']['Enums']['alert_priority']

export type PoliticianInsert = Database['public']['Tables']['politicians']['Insert']
export type PoliticianUpdate = Database['public']['Tables']['politicians']['Update']
export type MentionInsert = Database['public']['Tables']['mentions']['Insert']
export type CompetitorInsert = Database['public']['Tables']['competitors']['Insert']
export type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert']
export type UserSettingsInsert = Database['public']['Tables']['user_settings']['Insert']
export type UserSettingsUpdate = Database['public']['Tables']['user_settings']['Update']
