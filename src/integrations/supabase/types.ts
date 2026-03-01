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
          id: string
          mention_id: string | null
          politician_id: string
          priority: string | null
          alert_type: string | null
          is_read: boolean | null
          sent_at: string | null
          sent_email: boolean | null
          sent_whatsapp: boolean | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          mention_id?: string | null
          politician_id: string
          priority?: string | null
          alert_type?: string | null
          is_read?: boolean | null
          sent_at?: string | null
          sent_email?: boolean | null
          sent_whatsapp?: boolean | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          mention_id?: string | null
          politician_id?: string
          priority?: string | null
          alert_type?: string | null
          is_read?: boolean | null
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
      competitors: {
        Row: {
          id: string
          politician_id: string
          competitor_politician_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          politician_id: string
          competitor_politician_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          politician_id?: string
          competitor_politician_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitors_politician_id_fkey"
            columns: ["politician_id"]
            isOneToOne: false
            referencedRelation: "politicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitors_competitor_politician_id_fkey"
            columns: ["competitor_politician_id"]
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
          id: string
          mention_count: number | null
          negative_count: number | null
          neutral_count: number | null
          politician_id: string
          positive_count: number | null
          report_date: string
          sent_at: string | null
          sent_email: boolean | null
          sent_whatsapp: boolean | null
          summary: string | null
          risks: Json | null
          opportunities: Json | null
          dominant_narrative: string | null
          alert_level: string | null
          score: number | null
          score_breakdown: Json | null
        }
        Insert: {
          created_at?: string | null
          highlights?: Json | null
          id?: string
          mention_count?: number | null
          negative_count?: number | null
          neutral_count?: number | null
          politician_id: string
          positive_count?: number | null
          report_date: string
          sent_at?: string | null
          sent_email?: boolean | null
          sent_whatsapp?: boolean | null
          summary?: string | null
          risks?: Json | null
          opportunities?: Json | null
          dominant_narrative?: string | null
          alert_level?: string | null
          score?: number | null
          score_breakdown?: Json | null
        }
        Update: {
          created_at?: string | null
          highlights?: Json | null
          id?: string
          mention_count?: number | null
          negative_count?: number | null
          neutral_count?: number | null
          politician_id?: string
          positive_count?: number | null
          report_date?: string
          sent_at?: string | null
          sent_email?: boolean | null
          sent_whatsapp?: boolean | null
          summary?: string | null
          risks?: Json | null
          opportunities?: Json | null
          dominant_narrative?: string | null
          alert_level?: string | null
          score?: number | null
          score_breakdown?: Json | null
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
          id: string
          is_alerted: boolean | null
          is_processed: boolean | null
          politician_id: string
          published_at: string | null
          relevance_score: number | null
          sentiment: string | null
          sentiment_score: number | null
          source_name: string | null
          source_type: string | null
          source_logo_url: string | null
          summary: string | null
          title: string | null
          topics: string[] | null
          url: string
          views_count: number | null
          engagement_count: number | null
        }
        Insert: {
          content?: string | null
          content_hash: string
          created_at?: string | null
          id?: string
          is_alerted?: boolean | null
          is_processed?: boolean | null
          politician_id: string
          published_at?: string | null
          relevance_score?: number | null
          sentiment?: string | null
          sentiment_score?: number | null
          source_name?: string | null
          source_type?: string | null
          source_logo_url?: string | null
          summary?: string | null
          title?: string | null
          topics?: string[] | null
          url: string
          views_count?: number | null
          engagement_count?: number | null
        }
        Update: {
          content?: string | null
          content_hash?: string
          created_at?: string | null
          id?: string
          is_alerted?: boolean | null
          is_processed?: boolean | null
          politician_id?: string
          published_at?: string | null
          relevance_score?: number | null
          sentiment?: string | null
          sentiment_score?: number | null
          source_name?: string | null
          source_type?: string | null
          source_logo_url?: string | null
          summary?: string | null
          title?: string | null
          topics?: string[] | null
          url?: string
          views_count?: number | null
          engagement_count?: number | null
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
      network_metrics: {
        Row: {
          id: string
          politician_id: string
          network: string
          date: string
          mention_count: number | null
          positive_count: number | null
          negative_count: number | null
          neutral_count: number | null
          avg_sentiment: number | null
          total_reach: number | null
          top_mention_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          politician_id: string
          network: string
          date: string
          mention_count?: number | null
          positive_count?: number | null
          negative_count?: number | null
          neutral_count?: number | null
          avg_sentiment?: number | null
          total_reach?: number | null
          top_mention_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          politician_id?: string
          network?: string
          date?: string
          mention_count?: number | null
          positive_count?: number | null
          negative_count?: number | null
          neutral_count?: number | null
          avg_sentiment?: number | null
          total_reach?: number | null
          top_mention_id?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "network_metrics_politician_id_fkey"
            columns: ["politician_id"]
            isOneToOne: false
            referencedRelation: "politicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_metrics_top_mention_id_fkey"
            columns: ["top_mention_id"]
            isOneToOne: false
            referencedRelation: "mentions"
            referencedColumns: ["id"]
          },
        ]
      }
      politicians: {
        Row: {
          city: string | null
          created_at: string | null
          email: string | null
          id: string
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
          photo_url: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
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
          photo_url?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
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
          photo_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "politicians_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          max_politicians: number | null
          trial_ends_at: string | null
          current_period_start: string | null
          current_period_end: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          max_politicians?: number | null
          trial_ends_at?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          max_politicians?: number | null
          trial_ends_at?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          theme: string | null
          language: string | null
          timezone: string | null
          daily_report_hour: number | null
          whatsapp_number: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          theme?: string | null
          language?: string | null
          timezone?: string | null
          daily_report_hour?: number | null
          whatsapp_number?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          theme?: string | null
          language?: string | null
          timezone?: string | null
          daily_report_hour?: number | null
          whatsapp_number?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
      alert_type: "mention" | "trend" | "crisis" | "opportunity"
      sentiment_type: "positivo" | "negativo" | "neutro"
      source_type:
        | "news"
        | "youtube"
        | "twitter"
        | "instagram"
        | "tiktok"
        | "telegram"
        | "diario_oficial"
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
      alert_type: ["mention", "trend", "crisis", "opportunity"],
      sentiment_type: ["positivo", "negativo", "neutro"],
      source_type: [
        "news",
        "youtube",
        "twitter",
        "instagram",
        "tiktok",
        "telegram",
        "diario_oficial",
      ],
    },
  },
} as const
