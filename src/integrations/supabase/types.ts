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
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
      booking_settings: {
        Row: {
          auto_confirm_bookings: boolean
          booking_enabled: boolean
          booking_fee_percentage: number
          created_at: string
          id: string
          maintenance_message: string | null
          max_advance_days: number
          min_advance_hours: number
          updated_at: string
        }
        Insert: {
          auto_confirm_bookings?: boolean
          booking_enabled?: boolean
          booking_fee_percentage?: number
          created_at?: string
          id?: string
          maintenance_message?: string | null
          max_advance_days?: number
          min_advance_hours?: number
          updated_at?: string
        }
        Update: {
          auto_confirm_bookings?: boolean
          booking_enabled?: boolean
          booking_fee_percentage?: number
          created_at?: string
          id?: string
          maintenance_message?: string | null
          max_advance_days?: number
          min_advance_hours?: number
          updated_at?: string
        }
        Relationships: []
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
      comments: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          parent_id: string | null
          post_id: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          parent_id?: string | null
          post_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          parent_id?: string | null
          post_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
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
      fuel_brands: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      fuel_importers: {
        Row: {
          created_at: string
          created_by: string | null
          id: number
          logo_url: string | null
          name: string
          premium_ron_96_price: number | null
          regular_ron_93_price: number | null
          super_ron_98_price: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: number
          logo_url?: string | null
          name: string
          premium_ron_96_price?: number | null
          regular_ron_93_price?: number | null
          super_ron_98_price?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: number
          logo_url?: string | null
          name?: string
          premium_ron_96_price?: number | null
          regular_ron_93_price?: number | null
          super_ron_98_price?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      fuel_page_settings: {
        Row: {
          banner_url: string | null
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          banner_url?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          banner_url?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      fuel_votes: {
        Row: {
          brand_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          brand_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          brand_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_votes_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "fuel_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      laundries: {
        Row: {
          address: string | null
          box_count: number | null
          contact_number: string | null
          created_at: string
          created_by: string | null
          description: string | null
          foam_price: number | null
          id: number
          latitude: number | null
          longitude: number
          name: string
          photos: string[] | null
          slug: string | null
          updated_at: string
          videos: string[] | null
          water_price: number | null
          wax_price: number | null
        }
        Insert: {
          address?: string | null
          box_count?: number | null
          contact_number?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          foam_price?: number | null
          id?: number
          latitude?: number | null
          longitude: number
          name: string
          photos?: string[] | null
          slug?: string | null
          updated_at?: string
          videos?: string[] | null
          water_price?: number | null
          wax_price?: number | null
        }
        Update: {
          address?: string | null
          box_count?: number | null
          contact_number?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          foam_price?: number | null
          id?: number
          latitude?: number | null
          longitude?: number
          name?: string
          photos?: string[] | null
          slug?: string | null
          updated_at?: string
          videos?: string[] | null
          water_price?: number | null
          wax_price?: number | null
        }
        Relationships: []
      }
      mechanic_profile_views: {
        Row: {
          created_at: string | null
          id: string
          ip_address: unknown
          mechanic_id: string
          user_agent: string | null
          viewer_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: unknown
          mechanic_id: string
          user_agent?: string | null
          viewer_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: unknown
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
          display_id: number
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
          display_id?: number
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
          display_id?: number
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
          is_vip_active: boolean | null
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
          slug: string | null
          slug_is_manual: boolean | null
          updated_at: string
          videos: string[] | null
          vip_status: Database["public"]["Enums"]["vip_plan_type"] | null
          vip_until: string | null
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
          is_vip_active?: boolean | null
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
          slug?: string | null
          slug_is_manual?: boolean | null
          updated_at?: string
          videos?: string[] | null
          vip_status?: Database["public"]["Enums"]["vip_plan_type"] | null
          vip_until?: string | null
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
          is_vip_active?: boolean | null
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
          slug?: string | null
          slug_is_manual?: boolean | null
          updated_at?: string
          videos?: string[] | null
          vip_status?: Database["public"]["Enums"]["vip_plan_type"] | null
          vip_until?: string | null
          working_days?: string[] | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_mechanic_services_profiles"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_media: {
        Row: {
          created_at: string | null
          id: string
          media_type: string
          media_url: string
          post_id: string
          thumbnail_url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          media_type: string
          media_url: string
          post_id: string
          thumbnail_url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          media_type?: string
          media_url?: string
          post_id?: string
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reports: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          post_id: string
          reason: Database["public"]["Enums"]["report_reason"]
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["report_status"] | null
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          post_id: string
          reason: Database["public"]["Enums"]["report_reason"]
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"] | null
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          post_id?: string
          reason?: Database["public"]["Enums"]["report_reason"]
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "post_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_saves: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_saves_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_tags: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          content: string | null
          created_at: string | null
          id: string
          is_deleted: boolean | null
          last_interacted_at: string | null
          score: number | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author_id: string
          content?: string | null
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          last_interacted_at?: string | null
          score?: number | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author_id?: string
          content?: string | null
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          last_interacted_at?: string | null
          score?: number | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
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
          full_address: string | null
          full_name: string | null
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
          full_address?: string | null
          full_name?: string | null
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
          full_address?: string | null
          full_name?: string | null
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
      saved_services: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          service_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          service_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          service_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "mechanic_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_services_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      search_queries: {
        Row: {
          created_at: string | null
          first_searched_at: string | null
          id: number
          last_searched_at: string | null
          query: string
          search_count: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          first_searched_at?: string | null
          id?: number
          last_searched_at?: string | null
          query: string
          search_count?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          first_searched_at?: string | null
          id?: number
          last_searched_at?: string | null
          query?: string
          search_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      seo_metadata: {
        Row: {
          created_at: string
          h1_title: string | null
          h2_description: string | null
          id: string
          meta_description: string | null
          meta_keywords: string | null
          meta_title: string | null
          page_id: string | null
          page_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          h1_title?: string | null
          h2_description?: string | null
          id?: string
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          page_id?: string | null
          page_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          h1_title?: string | null
          h2_description?: string | null
          id?: string
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          page_id?: string | null
          page_type?: string
          updated_at?: string
        }
        Relationships: []
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
      service_phone_views: {
        Row: {
          created_at: string | null
          id: string
          ip_address: unknown
          service_id: number
          user_agent: string | null
          viewer_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: unknown
          service_id: number
          user_agent?: string | null
          viewer_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: unknown
          service_id?: number
          user_agent?: string | null
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_phone_views_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "mechanic_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_phone_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      site_banners: {
        Row: {
          banner_url: string
          created_at: string | null
          created_by: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          link_url: string | null
          position: string
          updated_at: string | null
        }
        Insert: {
          banner_url: string
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          link_url?: string | null
          position: string
          updated_at?: string | null
        }
        Update: {
          banner_url?: string
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          link_url?: string | null
          position?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
          use_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
          use_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
          use_count?: number | null
        }
        Relationships: []
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
      user_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vip_requests: {
        Row: {
          admin_message: string | null
          approved_duration_days: number | null
          created_at: string | null
          id: string
          mechanic_id: string
          message: string | null
          rejection_reason: string | null
          requested_at: string
          requested_plan: Database["public"]["Enums"]["vip_plan_type"]
          reviewed_at: string | null
          reviewed_by: string | null
          service_id: number
          status: Database["public"]["Enums"]["vip_request_status"]
          updated_at: string | null
          vip_ends_at: string | null
          vip_starts_at: string | null
        }
        Insert: {
          admin_message?: string | null
          approved_duration_days?: number | null
          created_at?: string | null
          id?: string
          mechanic_id: string
          message?: string | null
          rejection_reason?: string | null
          requested_at?: string
          requested_plan: Database["public"]["Enums"]["vip_plan_type"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_id: number
          status?: Database["public"]["Enums"]["vip_request_status"]
          updated_at?: string | null
          vip_ends_at?: string | null
          vip_starts_at?: string | null
        }
        Update: {
          admin_message?: string | null
          approved_duration_days?: number | null
          created_at?: string | null
          id?: string
          mechanic_id?: string
          message?: string | null
          rejection_reason?: string | null
          requested_at?: string
          requested_plan?: Database["public"]["Enums"]["vip_plan_type"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_id?: number
          status?: Database["public"]["Enums"]["vip_request_status"]
          updated_at?: string | null
          vip_ends_at?: string | null
          vip_starts_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vip_requests_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vip_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vip_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "mechanic_services"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_is_admin: { Args: never; Returns: boolean }
      expire_vip_services: { Args: never; Returns: number }
      generate_unique_laundry_slug: {
        Args: { base_name: string; exclude_id?: number }
        Returns: string
      }
      generate_unique_slug: {
        Args: { base_name: string; exclude_id?: number }
        Returns: string
      }
      generate_unique_slug_enhanced: {
        Args: { base_name: string; exclude_id?: number }
        Returns: string
      }
      georgian_to_latin: { Args: { input_text: string }; Returns: string }
      georgian_to_latin_enhanced: {
        Args: { input_text: string }
        Returns: string
      }
      get_admin_stats: {
        Args: never
        Returns: {
          completed_bookings: number
          pending_bookings: number
          total_bookings: number
          total_customers: number
          total_mechanics: number
          total_revenue: number
          total_services: number
        }[]
      }
      get_community_feed: {
        Args: {
          filter_tag?: string
          page_limit?: number
          page_offset?: number
          sort_by?: string
        }
        Returns: {
          author_avatar: string
          author_id: string
          author_name: string
          comment_count: number
          content: string
          created_at: string
          is_liked: boolean
          is_saved: boolean
          like_count: number
          media_type: string
          media_url: string
          post_id: string
          score: number
          tags: Json
          thumbnail_url: string
        }[]
      }
      get_current_user_role: { Args: never; Returns: string }
      get_fuel_brand_stats: {
        Args: never
        Returns: {
          brand_id: string
          brand_name: string
          logo_url: string
          vote_count: number
          vote_percentage: number
        }[]
      }
      get_post_details: {
        Args: { post_uuid: string }
        Returns: {
          author_avatar: string
          author_id: string
          author_name: string
          comment_count: number
          content: string
          created_at: string
          is_liked: boolean
          is_saved: boolean
          like_count: number
          media_type: string
          media_url: string
          post_id: string
          tags: Json
          thumbnail_url: string
          view_count: number
        }[]
      }
      get_public_mechanic_info: {
        Args: { mechanic_id: string }
        Returns: {
          avatar_url: string
          city: string
          created_at: string
          district: string
          first_name: string
          id: string
          is_verified: boolean
          last_name: string
          role: Database["public"]["Enums"]["user_role"]
        }[]
      }
      get_safe_mechanic_profiles: {
        Args: never
        Returns: {
          avatar_url: string
          city: string
          created_at: string
          district: string
          first_name: string
          id: string
          is_verified: boolean
          last_name: string
          role: Database["public"]["Enums"]["user_role"]
        }[]
      }
      get_user_vote: {
        Args: { p_user_id: string }
        Returns: {
          brand_id: string
          brand_name: string
          voted_at: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { user_id?: string }; Returns: boolean }
      is_admin_or_self_or_public_mechanic: {
        Args: { profile_id: string }
        Returns: boolean
      }
      is_current_user_admin: { Args: never; Returns: boolean }
      is_moderator_or_admin: { Args: { _user_id: string }; Returns: boolean }
      submit_contact_message: {
        Args: {
          p_email: string
          p_message: string
          p_name: string
          p_subject: string
          p_topic: string
          p_user_id?: string
        }
        Returns: undefined
      }
      user_can_access_room: {
        Args: { room_id: string; user_id: string }
        Returns: boolean
      }
      user_can_create_participant: {
        Args: { room_id: string; target_user_id: string; user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "customer" | "mechanic" | "admin" | "moderator"
      report_reason: "spam" | "offensive" | "personal" | "sensitive" | "other"
      report_status: "pending" | "reviewed" | "hidden" | "deleted" | "dismissed"
      user_role: "customer" | "mechanic" | "admin"
      vip_plan_type: "vip" | "super_vip"
      vip_request_status:
        | "pending"
        | "approved"
        | "rejected"
        | "need_info"
        | "expired"
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
      app_role: ["customer", "mechanic", "admin", "moderator"],
      report_reason: ["spam", "offensive", "personal", "sensitive", "other"],
      report_status: ["pending", "reviewed", "hidden", "deleted", "dismissed"],
      user_role: ["customer", "mechanic", "admin"],
      vip_plan_type: ["vip", "super_vip"],
      vip_request_status: [
        "pending",
        "approved",
        "rejected",
        "need_info",
        "expired",
      ],
    },
  },
} as const
