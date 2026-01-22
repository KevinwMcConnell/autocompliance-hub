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
      documents: {
        Row: {
          classification: string | null
          classification_confidence: number | null
          evidence_item_id: string | null
          extracted_fields: Json | null
          facility_id: string
          file_name: string
          file_size: number
          file_type: string
          id: string
          needs_review: boolean | null
          reviewed_at: string | null
          storage_path: string
          uploaded_at: string
        }
        Insert: {
          classification?: string | null
          classification_confidence?: number | null
          evidence_item_id?: string | null
          extracted_fields?: Json | null
          facility_id: string
          file_name: string
          file_size: number
          file_type: string
          id?: string
          needs_review?: boolean | null
          reviewed_at?: string | null
          storage_path: string
          uploaded_at?: string
        }
        Update: {
          classification?: string | null
          classification_confidence?: number | null
          evidence_item_id?: string | null
          extracted_fields?: Json | null
          facility_id?: string
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          needs_review?: boolean | null
          reviewed_at?: string | null
          storage_path?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_evidence_item_id_fkey"
            columns: ["evidence_item_id"]
            isOneToOne: false
            referencedRelation: "evidence_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_items: {
        Row: {
          created_at: string
          evidence_type_id: string
          facility_id: string
          id: string
          last_received_at: string | null
          next_due_at: string | null
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          evidence_type_id: string
          facility_id: string
          id?: string
          last_received_at?: string | null
          next_due_at?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          evidence_type_id?: string
          facility_id?: string
          id?: string
          last_received_at?: string | null
          next_due_at?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_items_evidence_type_id_fkey"
            columns: ["evidence_type_id"]
            isOneToOne: false
            referencedRelation: "evidence_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_items_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_types: {
        Row: {
          applicable_conditions: Json | null
          category: string
          created_at: string
          description: string | null
          id: string
          is_required: boolean | null
          name: string
          recurrence_days: number | null
          retention_days: number | null
        }
        Insert: {
          applicable_conditions?: Json | null
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean | null
          name: string
          recurrence_days?: number | null
          retention_days?: number | null
        }
        Update: {
          applicable_conditions?: Json | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean | null
          name?: string
          recurrence_days?: number | null
          retention_days?: number | null
        }
        Relationships: []
      }
      export_packets: {
        Row: {
          created_at: string
          description: string | null
          download_url: string | null
          facility_id: string
          generated_at: string | null
          id: string
          included_evidence_ids: string[] | null
          missing_evidence_ids: string[] | null
          name: string
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          download_url?: string | null
          facility_id: string
          generated_at?: string | null
          id?: string
          included_evidence_ids?: string[] | null
          missing_evidence_ids?: string[] | null
          name: string
          status?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          download_url?: string | null
          facility_id?: string
          generated_at?: string | null
          id?: string
          included_evidence_ids?: string[] | null
          missing_evidence_ids?: string[] | null
          name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "export_packets_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      facilities: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          employee_count: number | null
          has_air_compressor: boolean | null
          has_fire_suppression: boolean | null
          has_hazardous_waste: boolean | null
          has_lift_equipment: boolean | null
          has_osha_safety_program: boolean | null
          has_paint_booth: boolean | null
          has_refrigerant_handling: boolean | null
          has_stormwater_discharge: boolean | null
          has_underground_tanks: boolean | null
          id: string
          license_number: string | null
          name: string
          onboarding_completed: boolean | null
          phone: string | null
          state: string | null
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          employee_count?: number | null
          has_air_compressor?: boolean | null
          has_fire_suppression?: boolean | null
          has_hazardous_waste?: boolean | null
          has_lift_equipment?: boolean | null
          has_osha_safety_program?: boolean | null
          has_paint_booth?: boolean | null
          has_refrigerant_handling?: boolean | null
          has_stormwater_discharge?: boolean | null
          has_underground_tanks?: boolean | null
          id?: string
          license_number?: string | null
          name: string
          onboarding_completed?: boolean | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          employee_count?: number | null
          has_air_compressor?: boolean | null
          has_fire_suppression?: boolean | null
          has_hazardous_waste?: boolean | null
          has_lift_equipment?: boolean | null
          has_osha_safety_program?: boolean | null
          has_paint_booth?: boolean | null
          has_refrigerant_handling?: boolean | null
          has_stormwater_discharge?: boolean | null
          has_underground_tanks?: boolean | null
          id?: string
          license_number?: string | null
          name?: string
          onboarding_completed?: boolean | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      task_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_type: string
          id: string
          notes: string | null
          storage_path: string
          task_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_type: string
          id?: string
          notes?: string | null
          storage_path: string
          task_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_type?: string
          id?: string
          notes?: string | null
          storage_path?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed_at: string | null
          completion_notes: string | null
          created_at: string
          description: string | null
          due_date: string | null
          evidence_item_id: string | null
          facility_id: string
          id: string
          is_recurring: boolean | null
          recurrence_days: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          evidence_item_id?: string | null
          facility_id: string
          id?: string
          is_recurring?: boolean | null
          recurrence_days?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          evidence_item_id?: string | null
          facility_id?: string
          id?: string
          is_recurring?: boolean | null
          recurrence_days?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_evidence_item_id_fkey"
            columns: ["evidence_item_id"]
            isOneToOne: false
            referencedRelation: "evidence_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      set_user_role: {
        Args: {
          _new_role: Database["public"]["Enums"]["app_role"]
          _target_user_id: string
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
