/**
 * RadarPolítico - Cliente Supabase
 * Configuração da conexão com o banco de dados
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const SUPABASE_URL = "https://opwibtfwlfilzqwsmppo.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wd2lidGZ3bGZpbHpxd3NtcHBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMjQzMDgsImV4cCI6MjA4NTgwMDMwOH0.CFD3sNYBc5TGAZ9zm2bav2vpoaCelosb5M8QmLNvK2g"

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
export type SentimentType = Database['public']['Enums']['sentiment_type']

export type PoliticianInsert = Database['public']['Tables']['politicians']['Insert']
export type PoliticianUpdate = Database['public']['Tables']['politicians']['Update']
export type MentionInsert = Database['public']['Tables']['mentions']['Insert']
