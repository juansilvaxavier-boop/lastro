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
      cliente_imovel_interesse: {
        Row: {
          cliente_id: string
          data_interesse: string
          empreendimento_id: string
        }
        Insert: {
          cliente_id: string
          data_interesse?: string
          empreendimento_id: string
        }
        Update: {
          cliente_id?: string
          data_interesse?: string
          empreendimento_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_imovel_interesse_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_imovel_interesse_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          corretor_responsavel_id: string | null
          created_at: string
          email: string | null
          etapa_funil: string
          forma_pagamento_pretendida: string | null
          id: string
          nome: string
          orcamento_max: number | null
          orcamento_min: number | null
          origem_lead: string | null
          perfil: string | null
          renda_informada: number | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          corretor_responsavel_id?: string | null
          created_at?: string
          email?: string | null
          etapa_funil?: string
          forma_pagamento_pretendida?: string | null
          id?: string
          nome: string
          orcamento_max?: number | null
          orcamento_min?: number | null
          origem_lead?: string | null
          perfil?: string | null
          renda_informada?: number | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          corretor_responsavel_id?: string | null
          created_at?: string
          email?: string | null
          etapa_funil?: string
          forma_pagamento_pretendida?: string | null
          id?: string
          nome?: string
          orcamento_max?: number | null
          orcamento_min?: number | null
          origem_lead?: string | null
          perfil?: string | null
          renda_informada?: number | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_corretor_responsavel_id_fkey"
            columns: ["corretor_responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      construtoras: {
        Row: {
          ano_fundacao: number | null
          cnpj: string | null
          created_at: string
          id: string
          nome: string
          reputacao_score: number | null
          status_certidoes: string
          updated_at: string
        }
        Insert: {
          ano_fundacao?: number | null
          cnpj?: string | null
          created_at?: string
          id?: string
          nome: string
          reputacao_score?: number | null
          status_certidoes?: string
          updated_at?: string
        }
        Update: {
          ano_fundacao?: number | null
          cnpj?: string | null
          created_at?: string
          id?: string
          nome?: string
          reputacao_score?: number | null
          status_certidoes?: string
          updated_at?: string
        }
        Relationships: []
      }
      empreendimentos: {
        Row: {
          ativo: boolean
          bairro_id: string | null
          construtora_id: string | null
          created_at: string
          data_entrega_prevista: string | null
          data_entrega_real: string | null
          data_lancamento: string | null
          id: string
          imagem_url: string | null
          indice_correcao_obra: string
          indice_correcao_pos_entrega: string
          metragem_privativa: number | null
          metragem_total: number | null
          nome: string
          percentual_vendido: number | null
          preco_m2: number | null
          preco_total: number
          status: string
          unidades_disponiveis: number
          unidades_totais: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          bairro_id?: string | null
          construtora_id?: string | null
          created_at?: string
          data_entrega_prevista?: string | null
          data_entrega_real?: string | null
          data_lancamento?: string | null
          id?: string
          imagem_url?: string | null
          indice_correcao_obra?: string
          indice_correcao_pos_entrega?: string
          metragem_privativa?: number | null
          metragem_total?: number | null
          nome: string
          percentual_vendido?: number | null
          preco_m2?: number | null
          preco_total: number
          status?: string
          unidades_disponiveis?: number
          unidades_totais?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          bairro_id?: string | null
          construtora_id?: string | null
          created_at?: string
          data_entrega_prevista?: string | null
          data_entrega_real?: string | null
          data_lancamento?: string | null
          id?: string
          imagem_url?: string | null
          indice_correcao_obra?: string
          indice_correcao_pos_entrega?: string
          metragem_privativa?: number | null
          metragem_total?: number | null
          nome?: string
          percentual_vendido?: number | null
          preco_m2?: number | null
          preco_total?: number
          status?: string
          unidades_disponiveis?: number
          unidades_totais?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "empreendimentos_bairro_id_fkey"
            columns: ["bairro_id"]
            isOneToOne: false
            referencedRelation: "localizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empreendimentos_construtora_id_fkey"
            columns: ["construtora_id"]
            isOneToOne: false
            referencedRelation: "construtoras"
            referencedColumns: ["id"]
          },
        ]
      }
      favoritos: {
        Row: {
          created_at: string
          empreendimento_id: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          empreendimento_id: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          empreendimento_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favoritos_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favoritos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      indicadores_mercado: {
        Row: {
          created_at: string
          data_referencia: string
          fonte: string
          id: string
          raw: Json | null
          tipo: string
          valor: number
        }
        Insert: {
          created_at?: string
          data_referencia: string
          fonte: string
          id?: string
          raw?: Json | null
          tipo: string
          valor: number
        }
        Update: {
          created_at?: string
          data_referencia?: string
          fonte?: string
          id?: string
          raw?: Json | null
          tipo?: string
          valor?: number
        }
        Relationships: []
      }
      interacoes: {
        Row: {
          cliente_id: string
          data: string
          id: string
          observacao: string | null
          tipo: string
          usuario_id: string | null
        }
        Insert: {
          cliente_id: string
          data?: string
          id?: string
          observacao?: string | null
          tipo: string
          usuario_id?: string | null
        }
        Update: {
          cliente_id?: string
          data?: string
          id?: string
          observacao?: string | null
          tipo?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interacoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      localizacoes: {
        Row: {
          area_km2: number | null
          codigo_ibge: string | null
          created_at: string
          dados_ibge_atualizado_em: string | null
          id: string
          nome: string
          parent_id: string | null
          pib_per_capita: number | null
          pib_per_capita_ano: number | null
          populacao: number | null
          populacao_ano: number | null
          tipo: string
        }
        Insert: {
          area_km2?: number | null
          codigo_ibge?: string | null
          created_at?: string
          dados_ibge_atualizado_em?: string | null
          id?: string
          nome: string
          parent_id?: string | null
          pib_per_capita?: number | null
          pib_per_capita_ano?: number | null
          populacao?: number | null
          populacao_ano?: number | null
          tipo: string
        }
        Update: {
          area_km2?: number | null
          codigo_ibge?: string | null
          created_at?: string
          dados_ibge_atualizado_em?: string | null
          id?: string
          nome?: string
          parent_id?: string | null
          pib_per_capita?: number | null
          pib_per_capita_ano?: number | null
          populacao?: number | null
          populacao_ano?: number | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "localizacoes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "localizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      precos_mercado_local: {
        Row: {
          created_at: string
          data_referencia: string
          id: string
          localizacao_id: string | null
          segmento: string
          tipo: string
          valor_m2: number
          variacao_anual_12m: number | null
          variacao_mensal: number | null
        }
        Insert: {
          created_at?: string
          data_referencia: string
          id?: string
          localizacao_id?: string | null
          segmento?: string
          tipo: string
          valor_m2: number
          variacao_anual_12m?: number | null
          variacao_mensal?: number | null
        }
        Update: {
          created_at?: string
          data_referencia?: string
          id?: string
          localizacao_id?: string | null
          segmento?: string
          tipo?: string
          valor_m2?: number
          variacao_anual_12m?: number | null
          variacao_mensal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "precos_mercado_local_localizacao_id_fkey"
            columns: ["localizacao_id"]
            isOneToOne: false
            referencedRelation: "localizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      simulacoes: {
        Row: {
          cliente_id: string | null
          criado_em: string
          criado_por: string | null
          empreendimento_id: string
          forma_pagamento: string
          id: string
          num_parcelas_obra: number | null
          prazo_financiamento_meses: number | null
          resultado: Json
          sistema_amortizacao: string | null
          taxa_juros_aplicada: number | null
          valor_entrada: number | null
        }
        Insert: {
          cliente_id?: string | null
          criado_em?: string
          criado_por?: string | null
          empreendimento_id: string
          forma_pagamento: string
          id?: string
          num_parcelas_obra?: number | null
          prazo_financiamento_meses?: number | null
          resultado: Json
          sistema_amortizacao?: string | null
          taxa_juros_aplicada?: number | null
          valor_entrada?: number | null
        }
        Update: {
          cliente_id?: string | null
          criado_em?: string
          criado_por?: string | null
          empreendimento_id?: string
          forma_pagamento?: string
          id?: string
          num_parcelas_obra?: number | null
          prazo_financiamento_meses?: number | null
          resultado?: Json
          sistema_amortizacao?: string | null
          taxa_juros_aplicada?: number | null
          valor_entrada?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "simulacoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulacoes_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulacoes_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      tabela_pagamento_padrao: {
        Row: {
          created_at: string
          empreendimento_id: string
          id: string
          indice_correcao_aplicavel: string | null
          offset_meses: number
          tipo_parcela: string
          valor: number
        }
        Insert: {
          created_at?: string
          empreendimento_id: string
          id?: string
          indice_correcao_aplicavel?: string | null
          offset_meses?: number
          tipo_parcela: string
          valor: number
        }
        Update: {
          created_at?: string
          empreendimento_id?: string
          id?: string
          indice_correcao_aplicavel?: string | null
          offset_meses?: number
          tipo_parcela?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "tabela_pagamento_padrao_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          ativo: boolean
          created_at: string
          email: string | null
          id: string
          nome: string | null
          papel: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          id: string
          nome?: string | null
          papel?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          id?: string
          nome?: string | null
          papel?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      usuario_ativo: { Args: never; Returns: boolean }
      usuario_papel: { Args: never; Returns: string }
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
