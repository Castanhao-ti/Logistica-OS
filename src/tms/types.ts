export type RoutingStatus = 'pending' | 'approved' | 'in_load' | 'alert_value' | 'forced_cep';
export type BillingStatus = 'pendente' | 'faturado' | 'cancelado';
export type RuleType = 'value_alert' | 'cep_prefix' | 'cep_prefix_value' | 'fallback' | 'forced_cep';

export interface Carrier {
  id: string;
  name: string;
  alias: string;
  color: string;
  is_active: boolean;
}

export interface Order {
  id: string;
  pedido_forca_venda_key: string;
  numero_pedido_cliente: number | null;
  nome_razao_cliente: string;
  cep: string;
  cidade: string;
  bairro: string | null;
  valor_pedido: number;
  peso_pedido: number | null;
  billing_status: BillingStatus;
  routing_status: RoutingStatus;
  rule_explanation: string | null;
  suggested_carrier_id: string | null;
  suggested_carrier_name: string | null;
  suggested_carrier_color: string | null;
  viamex_unit: string | null;
  assigned_carrier_id: string | null;
  assigned_carrier_name: string | null;
  synced_at: string | null;
  status_real_pedido: string | null;
  nf_numero: string | null;
  data_emissao_nf: string | null;
  status_nota_fiscal: string | null;
  chave_nota_fiscal: string | null;
  valor_nota_fiscal: number | null;
  qtde_skus_nf: number | null;
  qtde_total_nf: number | null;
  peso_nf: number | null;
  perc_ruptura_valor: number | null;
  perc_ruptura_qtde: number | null;
  nome_transportadora_nf: string | null;
  nome_motorista: string | null;
  numero_cte: string | null;
  valor_cte: number | null;
  status_cte: string | null;
  ultima_ocorrencia_status: string | null;
  ultima_ocorrencia_data: string | null;
}

export const VIAMEX_UNITS = ['DIADEMA', 'ITAPECERICA DA SERRA', 'OSASCO', 'POA', 'PRAIA GRANDE'];

export interface RoutingRule {
  id: string;
  priority: number;
  name: string;
  carrier_id: string | null;
  carrier_name?: string | null;
  rule_type: RuleType;
  cep_prefixes: string[] | null;
  min_value: number | null;
  max_value: number | null;
  is_active: boolean;
  description: string | null;
}

export interface CepException {
  id: string;
  cep_start: string;
  cep_end: string;
  carrier_id: string;
  carrier_name?: string;
  reason: string | null;
  is_active: boolean;
}

export interface Load {
  id: string;
  carrier_id: string;
  carrier_name?: string;
  order_count?: number;
  total_value?: number;
  status: string;
  created_at: string;
  created_by?: string;
}

export interface Filters {
  search: string;
  city: string;
  bairro: string;
  minValue: string;
  maxValue: string;
  carrierId: string;
  unit: string;
}
