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
          created_at: string
        }
        Insert: {
          id: string
          email: string
          is_admin?: boolean
          is_vip?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          is_admin?: boolean
          is_vip?: boolean
          created_at?: string
        }
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
      }
      matches: {
        Row: {
          id: string
          prediction_id: string
          sport: 'football' | 'tennis' | 'basketball' | 'hockey' | 'rugby' | 'sports_us'
          team1: string
          team2: string
          bet_type: string
          odds: number
          result: string | null
          match_date: string
          created_at: string
        }
        Insert: {
          id?: string
          prediction_id: string
          sport: 'football' | 'tennis' | 'basketball' | 'hockey' | 'rugby' | 'sports_us'
          team1: string
          team2: string
          bet_type: string
          odds: number
          result?: string | null
          match_date: string
          created_at?: string
        }
        Update: {
          id?: string
          prediction_id?: string
          sport?: 'football' | 'tennis' | 'basketball' | 'hockey' | 'rugby' | 'sports_us'
          team1?: string
          team2?: string
          bet_type?: string
          odds?: number
          result?: string | null
          match_date?: string
          created_at?: string
        }
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
      }
      news: {
        Row: {
          id: string
          title: string
          content: string
          image_url: string | null
          is_public: boolean
          status: 'pending' | 'won' | 'lost'
          category: 'article' | 'analysis' | 'prediction'
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          image_url?: string | null
          is_public?: boolean
          status?: 'pending' | 'won' | 'lost'
          category?: 'article' | 'analysis' | 'prediction'
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          image_url?: string | null
          is_public?: boolean
          status?: 'pending' | 'won' | 'lost'
          category?: 'article' | 'analysis' | 'prediction'
          created_by?: string | null
          created_at?: string
        }
      }
    }
  }
}
