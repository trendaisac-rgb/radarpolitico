export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          mention_id: number | null
          politician_id: number
          priority: Database["public"]["Enums"]["alert_priority"] | null
          sent_at: string | null
          sent_email: boolean | null
          sent_whatsapp: boolean | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          mention_id?: number | null
          politician_id: number
          priority?: Database["public"]["Enums"]["alert_priority"] | null
          sent_at?: string | null
          sent_email?: boolean | null
          sent_whatsapp?: boolean | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          mention_id?: number | null
          politician_id?: number
          priority?: Database["public"]["Enums"]["alert_priority"] | null
          sent_at?: string | null
          sent_email?: boolean | null
          sent_whatsapp?: boolean | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_mention_id_fkey"
            columns: ["mention_id"]
            isOneToOne: false
            referencedRelation: "mentions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_politician_id_fkey"
            columns: ["politician_id"]
            isOneToOne: false
            referencedRelation: "politicians"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_reports: {
        Row: {
          created_at: string | null
          highlights: Json | null
          id: number
          mention_count: number | null
          negative_count: number | null
          neutral_count: number | null
          politician_id: number
          positive_count: number | null
          report_date: string
          sent_at: string | null
          sent_email: boolean | null
          sent_whatsapp: boolean | null
          sentiment_overview: Json | null
          summary: string | null
        }
        Insert: {
          created_at?: string | null
          highlights?: Json | null
          id?: number
          mention_count?: number | null
          negative_count?: number | null
          neutral_count?: number | null
          politician_id: number
          positive_count?: number | null
          report_date: string
          sent_at?: string | null
          sent_email?: boolean | null
          sent_whatsapp?: boolean | null
          sentiment_overview?: Json | null
          summary?: string | null
        }
        Update: {
          created_at?: string | null
          highlights?: Json | null
          id?: number
          mention_count?: number | null
          negative_count?: number | null
          neutral_count?: number | null
          politician_id?: number
          positive_count?: number | null
          report_date?: string
          sent_at?: string | null
          sent_email?: boolean | null
          sent_whatsapp?: boolean | null
          sentiment_overview?: Json | null
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_politician_id_fkey"
            columns: ["politician_id"]
            isOneToOne: false
            referencedRelation: "politicians"
            referencedColumns: ["id"]
          },
        ]
      }
      mentions: {
        Row: {
          content: string | null
          content_hash: string
          created_at: string | null
          entities: Json | null
          id: number
          is_alerted: boolean | null
          is_processed: boolean | null
          politician_id: number
          published_at: string | null
          relevance_score: number | null
          scraped_at: string | null
          sentiment: Database["public"]["Enums"]["sentiment_type"] | null
          sentiment_score: number | null
          source_name: string | null
          source_type: Database["public"]["Enums"]["source_type"] | null
          summary: string | null
          title: string | null
          topics: string[] | null
          url: string
        }
        Insert: {
          content?: string | null
          content_hash: string
          created_at?: string | null
          entities?: Json | null
          id?: number
          is_alerted?: boolean | null
          is_processed?: boolean | null
          politician_id: number
          published_at?: string | null
          relevance_score?: number | null
          scraped_at?: string | null
          sentiment?: Database["public"]["Enums"]["sentiment_type"] | null
          sentiment_score?: number | null
          source_name?: string | null
          source_type?: Database["public"]["Enums"]["source_type"] | null
          summary?: string | null
          title?: string | null
          topics?: string[] | null
          url: string
        }
        Update: {
          content?: string | null
          content_hash?: string
          created_at?: string | null
          entities?: Json | null
          id?: number
          is_alerted?: boolean | null
          is_processed?: boolean | null
          politician_id?: number
          published_at?: string | null
          relevance_score?: number | null
          scraped_at?: string | null
          sentiment?: Database["public"]["Enums"]["sentiment_type"] | null
          sentiment_score?: number | null
          source_name?: string | null
          source_type?: Database["public"]["Enums"]["source_type"] | null
          summary?: string | null
          title?: string | null
          topics?: string[] | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentions_politician_id_fkey"
            columns: ["politician_id"]
            isOneToOne: false
            referencedRelation: "politicians"
            referencedColumns: ["id"]
          },
        ]
      }
      news_sources: {
        Row: {
          base_url: string
          created_at: string | null
          id: number
          is_active: boolean | null
          last_scraped_at: string | null
          name: string
          rate_limit_seconds: number | null
          requires_selenium: boolean | null
          search_url_template: string | null
          source_type: Database["public"]["Enums"]["source_type"] | null
        }
        Insert: {
          base_url: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          last_scraped_at?: string | null
          name: string
          rate_limit_seconds?: number | null
          requires_selenium?: boolean | null
          search_url_template?: string | null
          source_type?: Database["public"]["Enums"]["source_type"] | null
        }
        Update: {
          base_url?: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          last_scraped_at?: string | null
          name?: string
          rate_limit_seconds?: number | null
          requires_selenium?: boolean | null
          search_url_template?: string | null
          source_type?: Database["public"]["Enums"]["source_type"] | null
        }
        Relationships: []
      }
      politicians: {
        Row: {
          city: string | null
          competitors: number[] | null
          created_at: string | null
          email: string | null
          id: number
          is_active: boolean | null
          keywords: string[] | null
          name: string
          nickname: string | null
          notify_critical_only: boolean | null
          notify_email: boolean | null
          notify_whatsapp: boolean | null
          party: string | null
          position: string | null
          state: string | null
          updated_at: string | null
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          city?: string | null
          competitors?: number[] | null
          created_at?: string | null
          email?: string | null
          id?: number
          is_active?: boolean | null
          keywords?: string[] | null
          name: string
          nickname?: string | null
          notify_critical_only?: boolean | null
          notify_email?: boolean | null
          notify_whatsapp?: boolean | null
          party?: string | null
          position?: string | null
          state?: string | null
          updated_at?: string | null
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          city?: string | null
          competitors?: number[] | null
          created_at?: string | null
          email?: string | null
          id?: number
          is_active?: boolean | null
          keywords?: string[] | null
          name?: string
          nickname?: string | null
          notify_critical_only?: boolean | null
          notify_email?: boolean | null
          notify_whatsapp?: boolean | null
          party?: string | null
          position?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      alert_priority: "low" | "medium" | "high" | "critical"
      sentiment_type: "positivo" | "negativo" | "neutro"
      source_type:
        | "news"
        | "twitter"
        | "instagram"
        | "facebook"
        | "diario_oficial"
        | "tse"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      alert_priority: ["low", "medium", "high", "critical"],
      sentiment_type: ["positivo", "negativo", "neutro"],
      source_type: [
        "news",
        "twitter",
        "instagram",
        "facebook",
        "diario_oficial",
        "tse",
        "other",
      ],
    },
  },
} as const
