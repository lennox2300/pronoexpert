export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          is_admin: boolean
          is_vip: boolean
          membership_level: 'simple' | 'vip'
          vip_expires_at: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          is_admin?: boolean
          is_vip?: boolean
          membership_level?: 'simple' | 'vip'
          vip_expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          is_admin?: boolean
          is_vip?: boolean
          membership_level?: 'simple' | 'vip'
          vip_expires_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      predictions: {
        Row: {
          id: string
          user_id: string
          type: 'simple' | 'combined'
          stake: number
          total_odds: number
          status: 'pending' | 'won' | 'lost'
          is_public: boolean
          profit: number | null
          validated_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'simple' | 'combined'
          stake: number
          total_odds: number
          status?: 'pending' | 'won' | 'lost'
          is_public?: boolean
          profit?: number | null
          validated_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'simple' | 'combined'
          stake?: number
          total_odds?: number
          status?: 'pending' | 'won' | 'lost'
          is_public?: boolean
          profit?: number | null
          validated_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          id: string
          prediction_id: string
          sport: 'football' | 'tennis' | 'basketball' | 'hockey' | 'rugby' | 'sports_us' | 'boxing' | 'mma' | 'golf' | 'volleyball' | 'handball' | 'baseball' | 'cycling'
          competition: string
          team1: string
          team2: string
          bet_type: string
          odds: number
          result: string | null
          score: string
          match_date: string
          created_at: string
          team1_logo_url: string | null
          team2_logo_url: string | null
          competition_logo_url: string | null
        }
        Insert: {
          id?: string
          prediction_id: string
          sport: 'football' | 'tennis' | 'basketball' | 'hockey' | 'rugby' | 'sports_us' | 'boxing' | 'mma' | 'golf' | 'volleyball' | 'handball' | 'baseball' | 'cycling'
          competition?: string
          team1: string
          team2: string
          bet_type: string
          odds: number
          result?: string | null
          score?: string
          match_date: string
          created_at?: string
          team1_logo_url?: string | null
          team2_logo_url?: string | null
          competition_logo_url?: string | null
        }
        Update: {
          id?: string
          prediction_id?: string
          sport?: 'football' | 'tennis' | 'basketball' | 'hockey' | 'rugby' | 'sports_us' | 'boxing' | 'mma' | 'golf' | 'volleyball' | 'handball' | 'baseball' | 'cycling'
          competition?: string
          team1?: string
          team2?: string
          bet_type?: string
          odds?: number
          result?: string | null
          score?: string
          match_date?: string
          created_at?: string
          team1_logo_url?: string | null
          team2_logo_url?: string | null
          competition_logo_url?: string | null
        }
        Relationships: []
      }
      bankroll: {
        Row: {
          id: string
          balance: number
          total_profit: number
          total_loss: number
          won_count: number
          lost_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          balance?: number
          total_profit?: number
          total_loss?: number
          won_count?: number
          lost_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          balance?: number
          total_profit?: number
          total_loss?: number
          won_count?: number
          lost_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      news: {
        Row: {
          id: string
          title: string
          content: string
          image_url: string | null
          youtube_url: string | null
          dropbox_video_url: string | null
          is_public: boolean
          status: 'pending' | 'won' | 'lost'
          category: 'article' | 'analysis' | 'prediction' | 'infos'
          created_by: string | null
          created_at: string
          likes_count: number
          event_time: string | null
          gallery_images: string[] | null
          status_changed_at: string | null
        }
        Insert: {
          id?: string
          title: string
          content: string
          image_url?: string | null
          youtube_url?: string | null
          dropbox_video_url?: string | null
          is_public?: boolean
          status?: 'pending' | 'won' | 'lost'
          category?: 'article' | 'analysis' | 'prediction' | 'infos'
          created_by?: string | null
          created_at?: string
          likes_count?: number
          event_time?: string | null
          gallery_images?: string[] | null
          status_changed_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          content?: string
          image_url?: string | null
          youtube_url?: string | null
          dropbox_video_url?: string | null
          is_public?: boolean
          status?: 'pending' | 'won' | 'lost'
          category?: 'article' | 'analysis' | 'prediction' | 'infos'
          created_by?: string | null
          created_at?: string
          likes_count?: number
          event_time?: string | null
          gallery_images?: string[] | null
          status_changed_at?: string | null
        }
        Relationships: []
      }
      custom_entries: {
        Row: {
          id: string
          entry_type: 'league' | 'team' | 'bet_type'
          name: string
          logo_url: string | null
          competition: string | null
          sport: string | null
          created_at: string
        }
        Insert: {
          id?: string
          entry_type: 'league' | 'team' | 'bet_type'
          name: string
          logo_url?: string | null
          competition?: string | null
          sport?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          entry_type?: 'league' | 'team' | 'bet_type'
          name?: string
          logo_url?: string | null
          competition?: string | null
          sport?: string | null
          created_at?: string
        }
        Relationships: []
      }
      legal_pages: {
        Row: {
          id: string
          slug: string
          title: string
          content: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          slug: string
          title: string
          content?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      vip_requests: {
        Row: {
          id: string
          user_id: string
          status: 'pending' | 'approved' | 'rejected'
          created_at: string | null
          processed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          processed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          processed_at?: string | null
        }
        Relationships: []
      }
      monetisation_config: {
        Row: {
          id: string
          payment_mode_enabled: boolean
          plans: Json
          stripe_public_key: string | null
          stripe_secret_key: string | null
          stripe_webhook_secret: string | null
          stripe_test_mode: boolean
          paypal_client_id: string | null
          paypal_client_secret: string | null
          paypal_sandbox_mode: boolean
          ads_config: Json
          updated_at: string
        }
        Insert: {
          id?: string
          payment_mode_enabled?: boolean
          plans?: Json
          stripe_public_key?: string | null
          stripe_secret_key?: string | null
          stripe_webhook_secret?: string | null
          stripe_test_mode?: boolean
          paypal_client_id?: string | null
          paypal_client_secret?: string | null
          paypal_sandbox_mode?: boolean
          ads_config?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          payment_mode_enabled?: boolean
          plans?: Json
          stripe_public_key?: string | null
          stripe_secret_key?: string | null
          stripe_webhook_secret?: string | null
          stripe_test_mode?: boolean
          paypal_client_id?: string | null
          paypal_client_secret?: string | null
          paypal_sandbox_mode?: boolean
          ads_config?: Json
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}
