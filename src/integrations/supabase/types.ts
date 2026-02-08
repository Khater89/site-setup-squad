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
      bookings: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          assigned_provider_id: string | null
          city: string
          connect_charge_type: string | null
          created_at: string
          customer_name: string
          customer_phone: string
          customer_user_id: string | null
          deposit_amount: number | null
          deposit_status: string | null
          id: string
          notes: string | null
          payment_method: string
          payment_status: string
          platform_fee: number
          provider_payout: number
          remaining_cash_amount: number | null
          scheduled_at: string
          service_id: string
          status: string
          stripe_application_fee_amount: number | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          stripe_transfer_id: string | null
          subtotal: number
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_provider_id?: string | null
          city: string
          connect_charge_type?: string | null
          created_at?: string
          customer_name: string
          customer_phone: string
          customer_user_id?: string | null
          deposit_amount?: number | null
          deposit_status?: string | null
          id?: string
          notes?: string | null
          payment_method?: string
          payment_status?: string
          platform_fee?: number
          provider_payout?: number
          remaining_cash_amount?: number | null
          scheduled_at: string
          service_id: string
          status?: string
          stripe_application_fee_amount?: number | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          stripe_transfer_id?: string | null
          subtotal?: number
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_provider_id?: string | null
          city?: string
          connect_charge_type?: string | null
          created_at?: string
          customer_name?: string
          customer_phone?: string
          customer_user_id?: string | null
          deposit_amount?: number | null
          deposit_status?: string | null
          id?: string
          notes?: string | null
          payment_method?: string
          payment_status?: string
          platform_fee?: number
          provider_payout?: number
          remaining_cash_amount?: number | null
          scheduled_at?: string
          service_id?: string
          status?: string
          stripe_application_fee_amount?: number | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          stripe_transfer_id?: string | null
          subtotal?: number
        }
        Relationships: []
      }
      notifications_log: {
        Row: {
          booking_id: string | null
          created_at: string
          id: string
          payload: Json | null
          type: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          id?: string
          payload?: Json | null
          type: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          id?: string
          payload?: Json | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_log_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          deposit_percent: number
          id: number
          platform_fee_percent: number
          provider_debt_limit: number
          setup_completed: boolean
          updated_at: string
        }
        Insert: {
          deposit_percent?: number
          id?: number
          platform_fee_percent?: number
          provider_debt_limit?: number
          setup_completed?: boolean
          updated_at?: string
        }
        Update: {
          deposit_percent?: number
          id?: number
          platform_fee_percent?: number
          provider_debt_limit?: number
          setup_completed?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address_text: string | null
          available_now: boolean | null
          city: string | null
          created_at: string
          date_of_birth: string | null
          experience_years: number | null
          full_name: string | null
          languages: string[] | null
          license_id: string | null
          phone: string | null
          profile_completed: boolean | null
          provider_status: string
          radius_km: number | null
          role_type: string | null
          schedule_json: Json | null
          stripe_connect_account_id: string | null
          stripe_connect_onboarding_status: string | null
          tools: string[] | null
          user_id: string
        }
        Insert: {
          address_text?: string | null
          available_now?: boolean | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          experience_years?: number | null
          full_name?: string | null
          languages?: string[] | null
          license_id?: string | null
          phone?: string | null
          profile_completed?: boolean | null
          provider_status?: string
          radius_km?: number | null
          role_type?: string | null
          schedule_json?: Json | null
          stripe_connect_account_id?: string | null
          stripe_connect_onboarding_status?: string | null
          tools?: string[] | null
          user_id: string
        }
        Update: {
          address_text?: string | null
          available_now?: boolean | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          experience_years?: number | null
          full_name?: string | null
          languages?: string[] | null
          license_id?: string | null
          phone?: string | null
          profile_completed?: boolean | null
          provider_status?: string
          radius_km?: number | null
          role_type?: string | null
          schedule_json?: Json | null
          stripe_connect_account_id?: string | null
          stripe_connect_onboarding_status?: string | null
          tools?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      provider_wallet_ledger: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          id: string
          provider_id: string
          reason: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          id?: string
          provider_id: string
          reason: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          id?: string
          provider_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_wallet_ledger_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          base_price: number
          category: string
          city: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          base_price?: number
          category?: string
          city?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          base_price?: number
          category?: string
          city?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          name?: string
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
      get_provider_balance: { Args: { _provider_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_cs: { Args: never; Returns: boolean }
      is_customer: { Args: never; Returns: boolean }
      is_provider: { Args: never; Returns: boolean }
      remove_user_role: {
        Args: {
          old_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: undefined
      }
      set_user_role: {
        Args: {
          new_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "provider" | "customer" | "cs"
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
      app_role: ["admin", "provider", "customer", "cs"],
    },
  },
} as const
