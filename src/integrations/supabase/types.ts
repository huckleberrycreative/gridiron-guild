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
      blog_posts: {
        Row: {
          author_id: string | null
          content: string | null
          created_at: string
          excerpt: string | null
          featured_image: string | null
          id: string
          published: boolean
          published_at: string | null
          recap_date: string | null
          season_year: number | null
          slug: string
          title: string
          updated_at: string
          week_number: number | null
        }
        Insert: {
          author_id?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          recap_date?: string | null
          season_year?: number | null
          slug: string
          title: string
          updated_at?: string
          week_number?: number | null
        }
        Update: {
          author_id?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          recap_date?: string | null
          season_year?: number | null
          slug?: string
          title?: string
          updated_at?: string
          week_number?: number | null
        }
        Relationships: []
      }
      coaches: {
        Row: {
          championships: number
          created_at: string
          display_order: number
          id: string
          is_current: boolean
          losses: number
          name: string
          photo_url: string | null
          playoff_losses: number
          playoff_wins: number
          team_id: string | null
          tenure_end: string | null
          tenure_start: string
          tenure_summary: string | null
          updated_at: string
          wins: number
        }
        Insert: {
          championships?: number
          created_at?: string
          display_order?: number
          id?: string
          is_current?: boolean
          losses?: number
          name: string
          photo_url?: string | null
          playoff_losses?: number
          playoff_wins?: number
          team_id?: string | null
          tenure_end?: string | null
          tenure_start: string
          tenure_summary?: string | null
          updated_at?: string
          wins?: number
        }
        Update: {
          championships?: number
          created_at?: string
          display_order?: number
          id?: string
          is_current?: boolean
          losses?: number
          name?: string
          photo_url?: string | null
          playoff_losses?: number
          playoff_wins?: number
          team_id?: string | null
          tenure_end?: string | null
          tenure_start?: string
          tenure_summary?: string | null
          updated_at?: string
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "coaches_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      draft_picks: {
        Row: {
          created_at: string
          draft_year: number
          id: string
          pick_number: number
          round: number
          selected_player_id: string | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          draft_year: number
          id?: string
          pick_number: number
          round: number
          selected_player_id?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          draft_year?: number
          id?: string
          pick_number?: number
          round?: number
          selected_player_id?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "draft_picks_selected_player_id_fkey"
            columns: ["selected_player_id"]
            isOneToOne: false
            referencedRelation: "rookie_pool"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draft_picks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          alt_text: string | null
          created_at: string
          filename: string
          id: string
          mime_type: string | null
          original_filename: string
          size_bytes: number | null
          updated_at: string
          uploaded_by: string | null
          url: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          filename: string
          id?: string
          mime_type?: string | null
          original_filename: string
          size_bytes?: number | null
          updated_at?: string
          uploaded_by?: string | null
          url: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          filename?: string
          id?: string
          mime_type?: string | null
          original_filename?: string
          size_bytes?: number | null
          updated_at?: string
          uploaded_by?: string | null
          url?: string
        }
        Relationships: []
      }
      page_content: {
        Row: {
          content: string
          content_type: string
          created_at: string
          display_order: number
          id: string
          page_slug: string
          section_key: string
          updated_at: string
        }
        Insert: {
          content?: string
          content_type?: string
          created_at?: string
          display_order?: number
          id?: string
          page_slug: string
          section_key: string
          updated_at?: string
        }
        Update: {
          content?: string
          content_type?: string
          created_at?: string
          display_order?: number
          id?: string
          page_slug?: string
          section_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      pages: {
        Row: {
          content: string | null
          created_at: string
          id: string
          published: boolean
          slug: string
          template: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          published?: boolean
          slug: string
          template?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          published?: boolean
          slug?: string
          template?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      player_salaries: {
        Row: {
          acquired_via_waivers: boolean
          contract_year: string | null
          created_at: string
          franchise_tag: boolean
          id: string
          number: number | null
          player_id: string
          practice_squad: boolean
          rookie_draft_round: string | null
          salary_2025: string | null
          salary_2026: string | null
          salary_2027: string | null
          salary_2028: string | null
          salary_2029: string | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          acquired_via_waivers?: boolean
          contract_year?: string | null
          created_at?: string
          franchise_tag?: boolean
          id?: string
          number?: number | null
          player_id: string
          practice_squad?: boolean
          rookie_draft_round?: string | null
          salary_2025?: string | null
          salary_2026?: string | null
          salary_2027?: string | null
          salary_2028?: string | null
          salary_2029?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          acquired_via_waivers?: boolean
          contract_year?: string | null
          created_at?: string
          franchise_tag?: boolean
          id?: string
          number?: number | null
          player_id?: string
          practice_squad?: boolean
          rookie_draft_round?: string | null
          salary_2025?: string | null
          salary_2026?: string | null
          salary_2027?: string | null
          salary_2028?: string | null
          salary_2029?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_salaries_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_salaries_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          created_at: string
          first_name: string
          full_name: string
          id: string
          last_name: string
          position: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_name: string
          full_name: string
          id?: string
          last_name: string
          position: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_name?: string
          full_name?: string
          id?: string
          last_name?: string
          position?: string
          updated_at?: string
        }
        Relationships: []
      }
      playoff_outcomes: {
        Row: {
          created_at: string
          finals_score: number | null
          id: string
          is_finalist: boolean
          rank: number
          season_id: string
          semifinal_score: number | null
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          finals_score?: number | null
          id?: string
          is_finalist?: boolean
          rank: number
          season_id: string
          semifinal_score?: number | null
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          finals_score?: number | null
          id?: string
          is_finalist?: boolean
          rank?: number
          season_id?: string
          semifinal_score?: number | null
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playoff_outcomes_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playoff_outcomes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      playoff_statistics: {
        Row: {
          created_at: string
          finals_appearances: number
          finals_losses: number
          finals_win_percentage: number | null
          finals_wins: number
          id: string
          playoff_appearances: number
          playoff_losses: number
          playoff_win_percentage: number | null
          playoff_wins: number
          playoffs_percentage: number | null
          team_id: string
          total_seasons: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          finals_appearances?: number
          finals_losses?: number
          finals_win_percentage?: number | null
          finals_wins?: number
          id?: string
          playoff_appearances?: number
          playoff_losses?: number
          playoff_win_percentage?: number | null
          playoff_wins?: number
          playoffs_percentage?: number | null
          team_id: string
          total_seasons?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          finals_appearances?: number
          finals_losses?: number
          finals_win_percentage?: number | null
          finals_wins?: number
          id?: string
          playoff_appearances?: number
          playoff_losses?: number
          playoff_win_percentage?: number | null
          playoff_wins?: number
          playoffs_percentage?: number | null
          team_id?: string
          total_seasons?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playoff_statistics_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      regular_season_standings: {
        Row: {
          average_finish: number | null
          average_ppw: number | null
          created_at: string
          id: string
          losses: number | null
          median_ppw: number | null
          points_accumulated: number | null
          rank: number
          season_id: string
          team_id: string
          total_points_for: number | null
          updated_at: string
          winning_percentage: number | null
          wins: number | null
        }
        Insert: {
          average_finish?: number | null
          average_ppw?: number | null
          created_at?: string
          id?: string
          losses?: number | null
          median_ppw?: number | null
          points_accumulated?: number | null
          rank: number
          season_id: string
          team_id: string
          total_points_for?: number | null
          updated_at?: string
          winning_percentage?: number | null
          wins?: number | null
        }
        Update: {
          average_finish?: number | null
          average_ppw?: number | null
          created_at?: string
          id?: string
          losses?: number | null
          median_ppw?: number | null
          points_accumulated?: number | null
          rank?: number
          season_id?: string
          team_id?: string
          total_points_for?: number | null
          updated_at?: string
          winning_percentage?: number | null
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "regular_season_standings_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regular_season_standings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      rivalries: {
        Row: {
          created_at: string
          game_name: string
          id: string
          origin_story: string[] | null
          slogan: string | null
          team1_governor: string
          team2_governor: string
          trophy_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          game_name: string
          id?: string
          origin_story?: string[] | null
          slogan?: string | null
          team1_governor: string
          team2_governor: string
          trophy_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          game_name?: string
          id?: string
          origin_story?: string[] | null
          slogan?: string | null
          team1_governor?: string
          team2_governor?: string
          trophy_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rivalry_matchups: {
        Row: {
          created_at: string
          id: string
          rivalry_id: string
          season: number
          team1_score: number
          team2_score: number
          updated_at: string
          winner: string
        }
        Insert: {
          created_at?: string
          id?: string
          rivalry_id: string
          season: number
          team1_score: number
          team2_score: number
          updated_at?: string
          winner: string
        }
        Update: {
          created_at?: string
          id?: string
          rivalry_id?: string
          season?: number
          team1_score?: number
          team2_score?: number
          updated_at?: string
          winner?: string
        }
        Relationships: [
          {
            foreignKeyName: "rivalry_matchups_rivalry_id_fkey"
            columns: ["rivalry_id"]
            isOneToOne: false
            referencedRelation: "rivalries"
            referencedColumns: ["id"]
          },
        ]
      }
      rookie_pool: {
        Row: {
          college: string | null
          created_at: string
          draft_year: number
          id: string
          notes: string | null
          player_name: string
          position: string
          updated_at: string
        }
        Insert: {
          college?: string | null
          created_at?: string
          draft_year: number
          id?: string
          notes?: string | null
          player_name: string
          position: string
          updated_at?: string
        }
        Update: {
          college?: string | null
          created_at?: string
          draft_year?: number
          id?: string
          notes?: string | null
          player_name?: string
          position?: string
          updated_at?: string
        }
        Relationships: []
      }
      seasons: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      teams: {
        Row: {
          created_at: string
          governor_response: string | null
          highest_high: string | null
          id: string
          lowest_low: string | null
          name: string
          owner_name: string | null
          profile_image_url: string | null
          shield_bio: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          governor_response?: string | null
          highest_high?: string | null
          id?: string
          lowest_low?: string | null
          name: string
          owner_name?: string | null
          profile_image_url?: string | null
          shield_bio?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          governor_response?: string | null
          highest_high?: string | null
          id?: string
          lowest_low?: string | null
          name?: string
          owner_name?: string | null
          profile_image_url?: string | null
          shield_bio?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
