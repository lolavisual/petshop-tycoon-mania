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
      accessories: {
        Row: {
          category: string
          created_at: string
          description: string | null
          description_ru: string | null
          icon: string
          id: string
          is_special: boolean
          name: string
          name_ru: string
          price_crystals: number
          price_diamonds: number
          required_level: number
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          description_ru?: string | null
          icon: string
          id?: string
          is_special?: boolean
          name: string
          name_ru: string
          price_crystals?: number
          price_diamonds?: number
          required_level?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          description_ru?: string | null
          icon?: string
          id?: string
          is_special?: boolean
          name?: string
          name_ru?: string
          price_crystals?: number
          price_diamonds?: number
          required_level?: number
        }
        Relationships: []
      }
      achievements: {
        Row: {
          category: string
          created_at: string
          description: string | null
          description_ru: string | null
          icon: string
          id: string
          is_active: boolean
          name: string
          name_ru: string
          requirement_type: string
          requirement_value: number
          reward_crystals: number
          reward_diamonds: number
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          description_ru?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          name_ru: string
          requirement_type: string
          requirement_value?: number
          reward_crystals?: number
          reward_diamonds?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          description_ru?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          name_ru?: string
          requirement_type?: string
          requirement_value?: number
          reward_crystals?: number
          reward_diamonds?: number
        }
        Relationships: []
      }
      admin_config: {
        Row: {
          admin_telegram_id: number
          allowed_ips: string[]
          created_at: string
          id: string
          secret_key: string
        }
        Insert: {
          admin_telegram_id: number
          allowed_ips?: string[]
          created_at?: string
          id?: string
          secret_key: string
        }
        Update: {
          admin_telegram_id?: number
          allowed_ips?: string[]
          created_at?: string
          id?: string
          secret_key?: string
        }
        Relationships: []
      }
      articles: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reward_given: boolean
          status: string
          title: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reward_given?: boolean
          status?: string
          title: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reward_given?: boolean
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_broadcasts: {
        Row: {
          broadcast_type: string
          button_text: string | null
          button_url: string | null
          created_at: string
          created_by: string | null
          failed_count: number | null
          id: string
          image_url: string | null
          message: string
          product_ids: string[] | null
          sent_at: string | null
          sent_count: number | null
          status: string
          title: string
        }
        Insert: {
          broadcast_type?: string
          button_text?: string | null
          button_url?: string | null
          created_at?: string
          created_by?: string | null
          failed_count?: number | null
          id?: string
          image_url?: string | null
          message: string
          product_ids?: string[] | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          title: string
        }
        Update: {
          broadcast_type?: string
          button_text?: string | null
          button_url?: string | null
          created_at?: string
          created_by?: string | null
          failed_count?: number | null
          id?: string
          image_url?: string | null
          message?: string
          product_ids?: string[] | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          title?: string
        }
        Relationships: []
      }
      bot_subscribers: {
        Row: {
          chat_id: number
          first_name: string | null
          id: string
          is_active: boolean
          last_message_at: string | null
          subscribed_at: string
          telegram_id: number
          username: string | null
        }
        Insert: {
          chat_id: number
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_message_at?: string | null
          subscribed_at?: string
          telegram_id: number
          username?: string | null
        }
        Update: {
          chat_id?: number
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_message_at?: string | null
          subscribed_at?: string
          telegram_id?: number
          username?: string | null
        }
        Relationships: []
      }
      click_logs: {
        Row: {
          clicks_count: number
          crystals_earned: number
          id: string
          timestamp: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          clicks_count?: number
          crystals_earned?: number
          id?: string
          timestamp?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          clicks_count?: number
          crystals_earned?: number
          id?: string
          timestamp?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "click_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_quests: {
        Row: {
          created_at: string
          description: string | null
          description_ru: string | null
          icon: string
          id: string
          is_active: boolean
          name: string
          name_ru: string
          requirement_type: string
          requirement_value: number
          reward_crystals: number
          reward_diamonds: number
          reward_xp: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_ru?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          name_ru: string
          requirement_type: string
          requirement_value?: number
          reward_crystals?: number
          reward_diamonds?: number
          reward_xp?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          description_ru?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          name_ru?: string
          requirement_type?: string
          requirement_value?: number
          reward_crystals?: number
          reward_diamonds?: number
          reward_xp?: number
        }
        Relationships: []
      }
      friendships: {
        Row: {
          accepted_at: string | null
          created_at: string
          friend_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      gifts: {
        Row: {
          amount: number
          claimed_at: string | null
          created_at: string
          from_user_id: string
          gift_type: string
          id: string
          is_claimed: boolean
          message: string | null
          to_user_id: string
        }
        Insert: {
          amount?: number
          claimed_at?: string | null
          created_at?: string
          from_user_id: string
          gift_type?: string
          id?: string
          is_claimed?: boolean
          message?: string | null
          to_user_id: string
        }
        Update: {
          amount?: number
          claimed_at?: string | null
          created_at?: string
          from_user_id?: string
          gift_type?: string
          id?: string
          is_claimed?: boolean
          message?: string | null
          to_user_id?: string
        }
        Relationships: []
      }
      lootbox_openings: {
        Row: {
          id: string
          lootbox_id: string
          opened_at: string
          reward_amount: number | null
          reward_id: string | null
          reward_type: string
          user_id: string
        }
        Insert: {
          id?: string
          lootbox_id: string
          opened_at?: string
          reward_amount?: number | null
          reward_id?: string | null
          reward_type: string
          user_id: string
        }
        Update: {
          id?: string
          lootbox_id?: string
          opened_at?: string
          reward_amount?: number | null
          reward_id?: string | null
          reward_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lootbox_openings_lootbox_id_fkey"
            columns: ["lootbox_id"]
            isOneToOne: false
            referencedRelation: "lootboxes"
            referencedColumns: ["id"]
          },
        ]
      }
      lootboxes: {
        Row: {
          created_at: string
          description: string | null
          description_ru: string | null
          drop_rates: Json
          icon: string
          id: string
          is_active: boolean
          name: string
          name_ru: string
          price_crystals: number
          price_diamonds: number
          rarity: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_ru?: string | null
          drop_rates?: Json
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          name_ru: string
          price_crystals?: number
          price_diamonds?: number
          rarity?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          description_ru?: string | null
          drop_rates?: Json
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          name_ru?: string
          price_crystals?: number
          price_diamonds?: number
          rarity?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          chat_id: number
          confirmed_at: string | null
          created_at: string
          customer_name: string
          customer_username: string | null
          delivered_at: string | null
          id: string
          manager_notes: string | null
          price: string
          product_id: string | null
          product_name: string
          shipped_at: string | null
          status: Database["public"]["Enums"]["order_status"]
          telegram_id: number
          updated_at: string
        }
        Insert: {
          chat_id: number
          confirmed_at?: string | null
          created_at?: string
          customer_name: string
          customer_username?: string | null
          delivered_at?: string | null
          id?: string
          manager_notes?: string | null
          price: string
          product_id?: string | null
          product_name: string
          shipped_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          telegram_id: number
          updated_at?: string
        }
        Update: {
          chat_id?: number
          confirmed_at?: string | null
          created_at?: string
          customer_name?: string
          customer_username?: string | null
          delivered_at?: string | null
          id?: string
          manager_notes?: string | null
          price?: string
          product_id?: string | null
          product_name?: string
          shipped_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          telegram_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "pet_products"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_products: {
        Row: {
          category: string
          created_at: string
          currency: string
          description: string | null
          description_ru: string | null
          icon: string
          id: string
          image_url: string | null
          in_stock: boolean
          name: string
          name_ru: string
          price: number
        }
        Insert: {
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          description_ru?: string | null
          icon?: string
          id?: string
          image_url?: string | null
          in_stock?: boolean
          name: string
          name_ru: string
          price?: number
        }
        Update: {
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          description_ru?: string | null
          icon?: string
          id?: string
          image_url?: string | null
          in_stock?: boolean
          name?: string
          name_ru?: string
          price?: number
        }
        Relationships: []
      }
      pet_types: {
        Row: {
          bonus_type: string | null
          bonus_value: number | null
          created_at: string
          description: string | null
          description_ru: string | null
          emoji: string
          id: string
          is_default: boolean
          name: string
          name_ru: string
          price_crystals: number
          price_diamonds: number
          rarity: string
          type: string
        }
        Insert: {
          bonus_type?: string | null
          bonus_value?: number | null
          created_at?: string
          description?: string | null
          description_ru?: string | null
          emoji: string
          id?: string
          is_default?: boolean
          name: string
          name_ru: string
          price_crystals?: number
          price_diamonds?: number
          rarity?: string
          type: string
        }
        Update: {
          bonus_type?: string | null
          bonus_value?: number | null
          created_at?: string
          description?: string | null
          description_ru?: string | null
          emoji?: string
          id?: string
          is_default?: boolean
          name?: string
          name_ru?: string
          price_crystals?: number
          price_diamonds?: number
          rarity?: string
          type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_variant: number
          created_at: string
          crystals: number
          diamonds: number
          first_name: string | null
          friends_count: number
          gifts_received: number
          gifts_sent: number
          id: string
          is_banned: boolean
          last_active_at: string
          last_chest_claim: string | null
          last_name: string | null
          last_passive_claim: string
          last_streak_date: string | null
          level: number
          passive_rate: number
          pet_changes: number
          pet_type: string
          quests_completed: number
          stones: number
          streak_days: number
          telegram_id: number
          total_clicks: number
          total_crystals_earned: number
          updated_at: string
          username: string | null
          xp: number
        }
        Insert: {
          avatar_variant?: number
          created_at?: string
          crystals?: number
          diamonds?: number
          first_name?: string | null
          friends_count?: number
          gifts_received?: number
          gifts_sent?: number
          id: string
          is_banned?: boolean
          last_active_at?: string
          last_chest_claim?: string | null
          last_name?: string | null
          last_passive_claim?: string
          last_streak_date?: string | null
          level?: number
          passive_rate?: number
          pet_changes?: number
          pet_type?: string
          quests_completed?: number
          stones?: number
          streak_days?: number
          telegram_id: number
          total_clicks?: number
          total_crystals_earned?: number
          updated_at?: string
          username?: string | null
          xp?: number
        }
        Update: {
          avatar_variant?: number
          created_at?: string
          crystals?: number
          diamonds?: number
          first_name?: string | null
          friends_count?: number
          gifts_received?: number
          gifts_sent?: number
          id?: string
          is_banned?: boolean
          last_active_at?: string
          last_chest_claim?: string | null
          last_name?: string | null
          last_passive_claim?: string
          last_streak_date?: string | null
          level?: number
          passive_rate?: number
          pet_changes?: number
          pet_type?: string
          quests_completed?: number
          stones?: number
          streak_days?: number
          telegram_id?: number
          total_clicks?: number
          total_crystals_earned?: number
          updated_at?: string
          username?: string | null
          xp?: number
        }
        Relationships: []
      }
      promotions: {
        Row: {
          created_at: string
          description: string | null
          discount_percent: number | null
          end_date: string | null
          id: string
          image_url: string | null
          is_active: boolean
          product_ids: string[] | null
          promo_code: string | null
          start_date: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          product_ids?: string[] | null
          promo_code?: string | null
          start_date?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          product_ids?: string[] | null
          promo_code?: string | null
          start_date?: string
          title?: string
        }
        Relationships: []
      }
      quest_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          notification_type: string
          quest_id: string | null
          quest_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          notification_type: string
          quest_id?: string | null
          quest_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          notification_type?: string
          quest_id?: string | null
          quest_type?: string
          user_id?: string
        }
        Relationships: []
      }
      quizzes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          questions: Json
          reward_type: string | null
          reward_value: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          questions?: Json
          reward_type?: string | null
          reward_value?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          questions?: Json
          reward_type?: string | null
          reward_value?: string | null
          title?: string
        }
        Relationships: []
      }
      ranks: {
        Row: {
          badge_url: string | null
          color: string
          created_at: string
          icon: string
          id: string
          min_achievements: number
          min_level: number
          name: string
          name_ru: string
        }
        Insert: {
          badge_url?: string | null
          color?: string
          created_at?: string
          icon?: string
          id?: string
          min_achievements?: number
          min_level?: number
          name: string
          name_ru: string
        }
        Update: {
          badge_url?: string | null
          color?: string
          created_at?: string
          icon?: string
          id?: string
          min_achievements?: number
          min_level?: number
          name?: string
          name_ru?: string
        }
        Relationships: []
      }
      shop_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          description_ru: string | null
          discount_percent: number | null
          effect_type: string | null
          effect_value: number | null
          icon: string
          id: string
          is_active: boolean
          is_golden: boolean
          name: string
          name_ru: string
          price_crystals: number
          price_diamonds: number
          required_level: number
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          description_ru?: string | null
          discount_percent?: number | null
          effect_type?: string | null
          effect_value?: number | null
          icon: string
          id?: string
          is_active?: boolean
          is_golden?: boolean
          name: string
          name_ru: string
          price_crystals?: number
          price_diamonds?: number
          required_level?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          description_ru?: string | null
          discount_percent?: number | null
          effect_type?: string | null
          effect_value?: number | null
          icon?: string
          id?: string
          is_active?: boolean
          is_golden?: boolean
          name?: string
          name_ru?: string
          price_crystals?: number
          price_diamonds?: number
          required_level?: number
        }
        Relationships: []
      }
      titles: {
        Row: {
          color: string
          created_at: string
          description: string | null
          description_ru: string | null
          icon: string
          id: string
          name: string
          name_ru: string
          rarity: string
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          description_ru?: string | null
          icon?: string
          id?: string
          name: string
          name_ru: string
          rarity?: string
          requirement_type: string
          requirement_value?: number
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          description_ru?: string | null
          icon?: string
          id?: string
          name?: string
          name_ru?: string
          rarity?: string
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: []
      }
      user_accessories: {
        Row: {
          accessory_id: string
          id: string
          is_equipped: boolean
          purchased_at: string
          user_id: string
        }
        Insert: {
          accessory_id: string
          id?: string
          is_equipped?: boolean
          purchased_at?: string
          user_id: string
        }
        Update: {
          accessory_id?: string
          id?: string
          is_equipped?: boolean
          purchased_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_accessories_accessory_id_fkey"
            columns: ["accessory_id"]
            isOneToOne: false
            referencedRelation: "accessories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_accessories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          reward_claimed: boolean
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          reward_claimed?: boolean
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          reward_claimed?: boolean
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_daily_quests: {
        Row: {
          claimed_at: string | null
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          progress: number
          quest_date: string
          quest_id: string
          reward_claimed: boolean
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          progress?: number
          quest_date?: string
          quest_id: string
          reward_claimed?: boolean
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          progress?: number
          quest_date?: string
          quest_id?: string
          reward_claimed?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_daily_quests_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "daily_quests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lootboxes: {
        Row: {
          id: string
          lootbox_id: string
          obtained_at: string
          quantity: number
          user_id: string
        }
        Insert: {
          id?: string
          lootbox_id: string
          obtained_at?: string
          quantity?: number
          user_id: string
        }
        Update: {
          id?: string
          lootbox_id?: string
          obtained_at?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lootboxes_lootbox_id_fkey"
            columns: ["lootbox_id"]
            isOneToOne: false
            referencedRelation: "lootboxes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_pets: {
        Row: {
          evolved_at: string | null
          id: string
          pet_level: number
          pet_type: string
          pet_xp: number
          purchased_at: string
          user_id: string
        }
        Insert: {
          evolved_at?: string | null
          id?: string
          pet_level?: number
          pet_type: string
          pet_xp?: number
          purchased_at?: string
          user_id: string
        }
        Update: {
          evolved_at?: string | null
          id?: string
          pet_level?: number
          pet_type?: string
          pet_xp?: number
          purchased_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_pets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_purchases: {
        Row: {
          id: string
          item_id: string
          purchased_at: string
          quantity: number
          user_id: string
        }
        Insert: {
          id?: string
          item_id: string
          purchased_at?: string
          quantity?: number
          user_id: string
        }
        Update: {
          id?: string
          item_id?: string
          purchased_at?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_purchases_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_titles: {
        Row: {
          id: string
          is_equipped: boolean
          title_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          id?: string
          is_equipped?: boolean
          title_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          id?: string
          is_equipped?: boolean
          title_id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_weekly_quests: {
        Row: {
          claimed_at: string | null
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          progress: number
          quest_id: string
          reward_claimed: boolean
          user_id: string
          week_start: string
        }
        Insert: {
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          progress?: number
          quest_id: string
          reward_claimed?: boolean
          user_id: string
          week_start?: string
        }
        Update: {
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          progress?: number
          quest_id?: string
          reward_claimed?: boolean
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_weekly_quests_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "weekly_quests"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_quests: {
        Row: {
          created_at: string
          description: string | null
          description_ru: string | null
          icon: string
          id: string
          is_active: boolean
          name: string
          name_ru: string
          quest_type: string
          requirement_type: string
          requirement_value: number
          reward_crystals: number
          reward_diamonds: number
          reward_xp: number
          season: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_ru?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          name_ru: string
          quest_type?: string
          requirement_type: string
          requirement_value?: number
          reward_crystals?: number
          reward_diamonds?: number
          reward_xp?: number
          season?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          description_ru?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          name_ru?: string
          quest_type?: string
          requirement_type?: string
          requirement_value?: number
          reward_crystals?: number
          reward_diamonds?: number
          reward_xp?: number
          season?: string | null
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
      order_status:
        | "new"
        | "processing"
        | "confirmed"
        | "shipped"
        | "delivered"
        | "cancelled"
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
      order_status: [
        "new",
        "processing",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
      ],
    },
  },
} as const
