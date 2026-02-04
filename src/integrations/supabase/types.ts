/**
 * RadarPolítico - Tipos do Supabase
 * Gerado para integração com o banco de dados
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type SentimentType = 'positivo' | 'negativo' | 'neutro'
export type SourceType = 'news' | 'twitter' | 'instagram' | 'facebook' | 'diario_oficial' | 'tse' | 'other'
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Database {
  public: {
    Tables: {
      politicians: {
        Row: {
          id: number
          user_id: string
          name: string
          nickname: string | null
          party: string | null
          position: string | null
          state: string | null
          city: string | null
          whatsapp: string | null
          email: string | null
          keywords: string[] | null
          competitors: number[] | null
          is_active: boolean
          notify_whatsapp: boolean
          notify_email: boolean
          notify_critical_only: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          name: string
          nickname?: string | null
          party?: string | null
          position?: string | null
          state?: string | null
          city?: string | null
          whatsapp?: string | null
          email?: string | null
          keywords?: string[] | null
          competitors?: number[] | null
          is_active?: boolean
          notify_whatsapp?: boolean
          notify_email?: boolean
          notify_critical_only?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          name?: string
          nickname?: string | null
          party?: string | null
          position?: string | null
          state?: string | null
          city?: string | null
          whatsapp?: string | null
          email?: string | null
          keywords?: string[] | null
          competitors?: number[] | null
          is_active?: boolean
          notify_whatsapp?: boolean
          notify_email?: boolean
          notify_critical_only?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      mentions: {
        Row: {
          id: number
          politician_id: number
          title: string | null
          content: string | null
          summary: string | null
          url: string
          source_name: string | null
          source_type: SourceType
          sentiment: SentimentType
          sentiment_score: number | null
          relevance_score: number | null
          topics: string[] | null
          entities: Json | null
          published_at: string | null
          scraped_at: string
          is_processed: boolean
          is_alerted: boolean
          content_hash: string
          created_at: string
        }
        Insert: {
          id?: number
          politician_id: number
          title?: string | null
          content?: string | null
          summary?: string | null
          url: string
          source_name?: string | null
          source_type?: SourceType
          sentiment?: SentimentType
          sentiment_score?: number | null
          relevance_score?: number | null
          topics?: string[] | null
          entities?: Json | null
          published_at?: string | null
          scraped_at?: string
          is_processed?: boolean
          is_alerted?: boolean
          content_hash: string
          created_at?: string
        }
        Update: {
          id?: number
          politician_id?: number
          title?: string | null
          content?: string | null
          summary?: string | null
          url?: string
          source_name?: string | null
          source_type?: SourceType
          sentiment?: SentimentType
          sentiment_score?: number | null
          relevance_score?: number | null
          topics?: string[] | null
          entities?: Json | null
          published_at?: string | null
          scraped_at?: string
          is_processed?: boolean
          is_alerted?: boolean
          content_hash?: string
          created_at?: string
        }
      }
      daily_reports: {
        Row: {
          id: number
          politician_id: number
          report_date: string
          summary: string | null
          highlights: Json | null
          sentiment_overview: Json | null
          mention_count: number
          positive_count: number
          negative_count: number
          neutral_count: number
          sent_whatsapp: boolean
          sent_email: boolean
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: number
          politician_id: number
          report_date: string
          summary?: string | null
          highlights?: Json | null
          sentiment_overview?: Json | null
          mention_count?: number
          positive_count?: number
          negative_count?: number
          neutral_count?: number
          sent_whatsapp?: boolean
          sent_email?: boolean
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          politician_id?: number
          report_date?: string
          summary?: string | null
          highlights?: Json | null
          sentiment_overview?: Json | null
          mention_count?: number
          positive_count?: number
          negative_count?: number
          neutral_count?: number
          sent_whatsapp?: boolean
          sent_email?: boolean
          sent_at?: string | null
          created_at?: string
        }
      }
      alerts: {
        Row: {
          id: number
          politician_id: number
          mention_id: number | null
          title: string
          description: string | null
          priority: AlertPriority
          sent_whatsapp: boolean
          sent_email: boolean
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: number
          politician_id: number
          mention_id?: number | null
          title: string
          description?: string | null
          priority?: AlertPriority
          sent_whatsapp?: boolean
          sent_email?: boolean
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          politician_id?: number
          mention_id?: number | null
          title?: string
          description?: string | null
          priority?: AlertPriority
          sent_whatsapp?: boolean
          sent_email?: boolean
          sent_at?: string | null
          created_at?: string
        }
      }
      news_sources: {
        Row: {
          id: number
          name: string
          base_url: string
          search_url_template: string | null
          source_type: SourceType
          rate_limit_seconds: number
          requires_selenium: boolean
          is_active: boolean
          last_scraped_at: string | null
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          base_url: string
          search_url_template?: string | null
          source_type?: SourceType
          rate_limit_seconds?: number
          requires_selenium?: boolean
          is_active?: boolean
          last_scraped_at?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          base_url?: string
          search_url_template?: string | null
          source_type?: SourceType
          rate_limit_seconds?: number
          requires_selenium?: boolean
          is_active?: boolean
          last_scraped_at?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      sentiment_type: SentimentType
      source_type: SourceType
      alert_priority: AlertPriority
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updatable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenient aliases
export type Politician = Tables<'politicians'>
export type Mention = Tables<'mentions'>
export type DailyReport = Tables<'daily_reports'>
export type Alert = Tables<'alerts'>
export type NewsSource = Tables<'news_sources'>
