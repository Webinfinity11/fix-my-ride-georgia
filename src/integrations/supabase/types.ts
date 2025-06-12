export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          address: string | null
          car_id: number | null
          created_at: string
          id: number
          is_mobile_service: boolean | null
          mechanic_id: string
          notes: string | null
          phone_number: string | null
          price: number | null
          scheduled_date: string
          scheduled_time: string
          service_id: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          car_id?: number | null
          created_at?: string
          id?: number
          is_mobile_service?: boolean | null
          mechanic_id: string
          notes?: string | null
          phone_number?: string | null
          price?: number | null
          scheduled_date: string
          scheduled_time: string
          service_id: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          car_id?: number | null
          created_at?: string
          id?: number
          is_mobile_service?: boolean | null
          mechanic_id?: string
          notes?: string | null
          phone_number?: string | null
          price?: number | null
          scheduled_date?: string
          scheduled_time?: string
          service_id?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanic_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "mechanic_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      car_brands: {
        Row: {
          created_at: string | null
          id: number
          is_popular: boolean | null
          logo_url: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_popular?: boolean | null
          logo_url?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          is_popular?: boolean | null
          logo_url?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cars: {
        Row: {
          created_at: string
          engine: string | null
          id: number
          make: string
          model: string
          transmission: string | null
          updated_at: string
          user_id: string
          vin: string | null
          year: number
        }
        Insert: {
          created_at?: string
          engine?: string | null
          id?: number
          make: string
          model: string
          transmission?: string | null
          updated_at?: string
          user_id: string
          vin?: string | null
          year: number
        }
        Update: {
          created_at?: string
          engine?: string | null
          id?: number
          make?: string
          model?: string
          transmission?: string | null
          updated_at?: string
          user_id?: string
          vin?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "cars_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          created_at: string
          id: number
          image_url: string | null
          issue_date: string | null
          issuing_organization: string | null
          mechanic_id: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: number
          image_url?: string | null
          issue_date?: string | null
          issuing_organization?: string | null
          mechanic_id: string
          title: string
        }
        Update: {
          created_at?: string
          id?: number
          image_url?: string | null
          issue_date?: string | null
          issuing_organization?: string | null
          mechanic_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanic_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          id: string
          joined_at: string | null
          last_read_at: string | null
          room_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          room_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          room_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          country: string | null
          created_at: string | null
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          id?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          assigned_to: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
          subject: string
          topic: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
          subject: string
          topic: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          subject?: string
          topic?: string
          user_id?: string | null
        }
        Relationships: []
      }
      districts: {
        Row: {
          city_id: number | null
          created_at: string | null
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          city_id?: number | null
          created_at?: string | null
          id?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          city_id?: number | null
          created_at?: string | null
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "districts_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_profile_views: {
        Row: {
          created_at: string | null
          id: string
          ip_address: unknown | null
          mechanic_id: string
          user_agent: string | null
          viewer_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          mechanic_id: string
          user_agent?: string | null
          viewer_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          mechanic_id?: string
          user_agent?: string | null
          viewer_id?: string | null
        }
        Relationships: []
      }
      mechanic_profiles: {
        Row: {
          accepts_card_payment: boolean | null
          description: string | null
          experience_years: number | null
          hourly_rate: number | null
          id: string
          is_mobile: boolean | null
          rating: number | null
          review_count: number | null
          specialization: string | null
          verified_at: string | null
          working_hours: Json | null
        }
        Insert: {
          accepts_card_payment?: boolean | null
          description?: string | null
          experience_years?: number | null
          hourly_rate?: number | null
          id: string
          is_mobile?: boolean | null
          rating?: number | null
          review_count?: number | null
          specialization?: string | null
          verified_at?: string | null
          working_hours?: Json | null
        }
        Update: {
          accepts_card_payment?: boolean | null
          description?: string | null
          experience_years?: number | null
          hourly_rate?: number | null
          id?: string
          is_mobile?: boolean | null
          rating?: number | null
          review_count?: number | null
          specialization?: string | null
          verified_at?: string | null
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_services: {
        Row: {
          accepts_card_payment: boolean | null
          accepts_cash_payment: boolean | null
          address: string | null
          car_brands: string[] | null
          category_id: number | null
          city: string | null
          created_at: string
          custom_category: string | null
          description: string | null
          district: string | null
          estimated_hours: number | null
          id: number
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          mechanic_id: string
          name: string
          on_site_service: boolean | null
          photos: string[] | null
          price_from: number | null
          price_to: number | null
          rating: number | null
          review_count: number | null
          updated_at: string
          videos: string[] | null
          working_days: string[] | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          accepts_card_payment?: boolean | null
          accepts_cash_payment?: boolean | null
          address?: string | null
          car_brands?: string[] | null
          category_id?: number | null
          city?: string | null
          created_at?: string
          custom_category?: string | null
          description?: string | null
          district?: string | null
          estimated_hours?: number | null
          id?: number
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          mechanic_id: string
          name: string
          on_site_service?: boolean | null
          photos?: string[] | null
          price_from?: number | null
          price_to?: number | null
          rating?: number | null
          review_count?: number | null
          updated_at?: string
          videos?: string[] | null
          working_days?: string[] | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          accepts_card_payment?: boolean | null
          accepts_cash_payment?: boolean | null
          address?: string | null
          car_brands?: string[] | null
          category_id?: number | null
          city?: string | null
          created_at?: string
          custom_category?: string | null
          description?: string | null
          district?: string | null
          estimated_hours?: number | null
          id?: number
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          mechanic_id?: string
          name?: string
          on_site_service?: boolean | null
          photos?: string[] | null
          price_from?: number | null
          price_to?: number | null
          rating?: number | null
          review_count?: number | null
          updated_at?: string
          videos?: string[] | null
          working_days?: string[] | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_services_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanic_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: string
          room_id: string | null
          sender_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          room_id?: string | null
          sender_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          room_id?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          created_at: string
          description: string | null
          id: number
          images: Json
          mechanic_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          images: Json
          mechanic_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          images?: Json
          mechanic_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanic_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          apartment: string | null
          avatar_url: string | null
          building: string | null
          city: string | null
          created_at: string
          district: string | null
          email: string
          first_name: string
          id: string
          is_verified: boolean
          last_name: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          street: string | null
          updated_at: string
        }
        Insert: {
          apartment?: string | null
          avatar_url?: string | null
          building?: string | null
          city?: string | null
          created_at?: string
          district?: string | null
          email: string
          first_name: string
          id: string
          is_verified?: boolean
          last_name: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          street?: string | null
          updated_at?: string
        }
        Update: {
          apartment?: string | null
          avatar_url?: string | null
          building?: string | null
          city?: string | null
          created_at?: string
          district?: string | null
          email?: string
          first_name?: string
          id?: string
          is_verified?: boolean
          last_name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          street?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: number | null
          comment: string | null
          created_at: string
          id: number
          images: Json | null
          mechanic_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_id?: number | null
          comment?: string | null
          created_at?: string
          id?: number
          images?: Json | null
          mechanic_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_id?: number | null
          comment?: string | null
          created_at?: string
          id?: number
          images?: Json | null
          mechanic_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanic_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          description: string | null
          icon: string | null
          id: number
          name: string
        }
        Insert: {
          description?: string | null
          icon?: string | null
          id?: number
          name: string
        }
        Update: {
          description?: string | null
          icon?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      service_reviews: {
        Row: {
          booking_id: number | null
          comment: string | null
          created_at: string
          id: number
          images: Json | null
          rating: number
          service_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_id?: number | null
          comment?: string | null
          created_at?: string
          id?: number
          images?: Json | null
          rating: number
          service_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_id?: number | null
          comment?: string | null
          created_at?: string
          id?: number
          images?: Json | null
          rating?: number
          service_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_reviews_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "mechanic_services"
            referencedColumns: ["id"]
          },
        ]
      }
      user_presence: {
        Row: {
          is_online: boolean | null
          last_seen: string | null
          user_id: string
        }
        Insert: {
          is_online?: boolean | null
          last_seen?: string | null
          user_id: string
        }
        Update: {
          is_online?: boolean | null
          last_seen?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_presence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_admin_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_customers: number
          total_mechanics: number
          total_services: number
          total_bookings: number
          pending_bookings: number
          completed_bookings: number
          total_revenue: number
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: { user_id?: string }
        Returns: boolean
      }
      submit_contact_message: {
        Args: {
          p_name: string
          p_email: string
          p_subject: string
          p_message: string
          p_topic: string
          p_user_id?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      user_role: "customer" | "mechanic" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["customer", "mechanic", "admin"],
    },
  },
} as const
