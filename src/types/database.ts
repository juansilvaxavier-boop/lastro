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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string
          id: string
          nome: string | null
        }
        Insert: {
          created_at?: string
          id: string
          nome?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string | null
        }
        Relationships: []
      }
      alertas: {
        Row: {
          created_at: string
          empreendimento_id: string | null
          id: string
          lido: boolean
          mensagem: string
          perfil_id: string
          tipo: string
          titulo: string
        }
        Insert: {
          created_at?: string
          empreendimento_id?: string | null
          id?: string
          lido?: boolean
          mensagem: string
          perfil_id: string
          tipo: string
          titulo: string
        }
        Update: {
          created_at?: string
          empreendimento_id?: string | null
          id?: string
          lido?: boolean
          mensagem?: string
          perfil_id?: string
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "alertas_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      bairros: {
        Row: {
          cidade: string
          created_at: string
          densidade_demografica: number | null
          estado: string
          id: string
          nome: string
          plano_diretor_url: string | null
          populacao: number | null
          renda_media: number | null
          ultima_revisao_manual: string | null
          updated_at: string
          zoneamento: string | null
        }
        Insert: {
          cidade?: string
          created_at?: string
          densidade_demografica?: number | null
          estado?: string
          id?: string
          nome: string
          plano_diretor_url?: string | null
          populacao?: number | null
          renda_media?: number | null
          ultima_revisao_manual?: string | null
          updated_at?: string
          zoneamento?: string | null
        }
        Update: {
          cidade?: string
          created_at?: string
          densidade_demografica?: number | null
          estado?: string
          id?: string
          nome?: string
          plano_diretor_url?: string | null
          populacao?: number | null
          renda_media?: number | null
          ultima_revisao_manual?: string | null
          updated_at?: string
          zoneamento?: string | null
        }
        Relationships: []
      }
      calibracao: {
        Row: {
          created_at: string
          empreendimento_id: string
          id: string
          meses_depois: number
          observacoes: string | null
          projecao_renda: number | null
          projecao_valorizacao_pct: number | null
          renda_realizada: number | null
          selo_confianca: number | null
          valorizacao_realizada_pct: number | null
        }
        Insert: {
          created_at?: string
          empreendimento_id: string
          id?: string
          meses_depois: number
          observacoes?: string | null
          projecao_renda?: number | null
          projecao_valorizacao_pct?: number | null
          renda_realizada?: number | null
          selo_confianca?: number | null
          valorizacao_realizada_pct?: number | null
        }
        Update: {
          created_at?: string
          empreendimento_id?: string
          id?: string
          meses_depois?: number
          observacoes?: string | null
          projecao_renda?: number | null
          projecao_valorizacao_pct?: number | null
          renda_realizada?: number | null
          selo_confianca?: number | null
          valorizacao_realizada_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "calibracao_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      cenarios: {
        Row: {
          calculado_em: string
          empreendimento_id: string
          id: string
          parametros: Json
          renda_projetada_mensal: number | null
          simulacoes: number
          tipo: string
          valorizacao_projetada_pct: number
        }
        Insert: {
          calculado_em?: string
          empreendimento_id: string
          id?: string
          parametros?: Json
          renda_projetada_mensal?: number | null
          simulacoes?: number
          tipo: string
          valorizacao_projetada_pct: number
        }
        Update: {
          calculado_em?: string
          empreendimento_id?: string
          id?: string
          parametros?: Json
          renda_projetada_mensal?: number | null
          simulacoes?: number
          tipo?: string
          valorizacao_projetada_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "cenarios_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      empreendimentos: {
        Row: {
          aluguel_estimado: number | null
          area_m2: number | null
          ativo: boolean
          bairro_id: string | null
          created_at: string
          data_entrega_prevista: string | null
          due_diligence_ok: boolean | null
          endereco: string | null
          fonte_dados: Json
          id: string
          incorporadora: string | null
          iptu_anual: number | null
          nome: string
          preco: number
          quartos: number | null
          status_obra: string | null
          tipo: string
          updated_at: string
          vagas: number | null
          valor_condominio: number | null
          valor_venal: number | null
        }
        Insert: {
          aluguel_estimado?: number | null
          area_m2?: number | null
          ativo?: boolean
          bairro_id?: string | null
          created_at?: string
          data_entrega_prevista?: string | null
          due_diligence_ok?: boolean | null
          endereco?: string | null
          fonte_dados?: Json
          id?: string
          incorporadora?: string | null
          iptu_anual?: number | null
          nome: string
          preco: number
          quartos?: number | null
          status_obra?: string | null
          tipo: string
          updated_at?: string
          vagas?: number | null
          valor_condominio?: number | null
          valor_venal?: number | null
        }
        Update: {
          aluguel_estimado?: number | null
          area_m2?: number | null
          ativo?: boolean
          bairro_id?: string | null
          created_at?: string
          data_entrega_prevista?: string | null
          due_diligence_ok?: boolean | null
          endereco?: string | null
          fonte_dados?: Json
          id?: string
          incorporadora?: string | null
          iptu_anual?: number | null
          nome?: string
          preco?: number
          quartos?: number | null
          status_obra?: string | null
          tipo?: string
          updated_at?: string
          vagas?: number | null
          valor_condominio?: number | null
          valor_venal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "empreendimentos_bairro_id_fkey"
            columns: ["bairro_id"]
            isOneToOne: false
            referencedRelation: "bairros"
            referencedColumns: ["id"]
          },
        ]
      }
      financiamento_simulacoes: {
        Row: {
          created_at: string
          empreendimento_id: string
          id: string
          num_parcelas: number
          perfil_id: string | null
          resultado: Json
          sistema_amortizacao: string
          taxa_juros_anual: number
          valor_entrada: number
        }
        Insert: {
          created_at?: string
          empreendimento_id: string
          id?: string
          num_parcelas: number
          perfil_id?: string | null
          resultado: Json
          sistema_amortizacao: string
          taxa_juros_anual: number
          valor_entrada: number
        }
        Update: {
          created_at?: string
          empreendimento_id?: string
          id?: string
          num_parcelas?: number
          perfil_id?: string | null
          resultado?: Json
          sistema_amortizacao?: string
          taxa_juros_anual?: number
          valor_entrada?: number
        }
        Relationships: [
          {
            foreignKeyName: "financiamento_simulacoes_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financiamento_simulacoes_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      macro_dados: {
        Row: {
          created_at: string
          data_referencia: string
          fonte: string
          id: string
          indicador: string
          raw: Json | null
          valor: number
        }
        Insert: {
          created_at?: string
          data_referencia: string
          fonte: string
          id?: string
          indicador: string
          raw?: Json | null
          valor: number
        }
        Update: {
          created_at?: string
          data_referencia?: string
          fonte?: string
          id?: string
          indicador?: string
          raw?: Json | null
          valor?: number
        }
        Relationships: []
      }
      matches: {
        Row: {
          calculado_em: string
          detalhes: Json
          empreendimento_id: string
          id: string
          perfil_id: string
          score_encaixe: number
        }
        Insert: {
          calculado_em?: string
          detalhes?: Json
          empreendimento_id: string
          id?: string
          perfil_id: string
          score_encaixe: number
        }
        Update: {
          calculado_em?: string
          detalhes?: Json
          empreendimento_id?: string
          id?: string
          perfil_id?: string
          score_encaixe?: number
        }
        Relationships: [
          {
            foreignKeyName: "matches_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          created_at: string
          id: string
          liquidez: string
          nome: string | null
          objetivo: string
          onboarding_completo: boolean
          prazo: string
          refinamento: Json
          tolerancia_risco: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          liquidez: string
          nome?: string | null
          objetivo: string
          onboarding_completo?: boolean
          prazo: string
          refinamento?: Json
          tolerancia_risco: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          liquidez?: string
          nome?: string | null
          objetivo?: string
          onboarding_completo?: boolean
          prazo?: string
          refinamento?: Json
          tolerancia_risco?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scores: {
        Row: {
          calculado_em: string
          detalhes: Json
          empreendimento_id: string
          id: string
          pesos_versao: string
          score_renda: number
          score_valorizacao: number
        }
        Insert: {
          calculado_em?: string
          detalhes?: Json
          empreendimento_id: string
          id?: string
          pesos_versao?: string
          score_renda: number
          score_valorizacao: number
        }
        Update: {
          calculado_em?: string
          detalhes?: Json
          empreendimento_id?: string
          id?: string
          pesos_versao?: string
          score_renda?: number
          score_valorizacao?: number
        }
        Relationships: [
          {
            foreignKeyName: "scores_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      watchlist: {
        Row: {
          created_at: string
          empreendimento_id: string
          id: string
          motivo_descarte: string | null
          perfil_id: string
          status: string
        }
        Insert: {
          created_at?: string
          empreendimento_id: string
          id?: string
          motivo_descarte?: string | null
          perfil_id: string
          status: string
        }
        Update: {
          created_at?: string
          empreendimento_id?: string
          id?: string
          motivo_descarte?: string | null
          perfil_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watchlist_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis"
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
