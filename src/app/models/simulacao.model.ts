export type TipoSimulacao = 'Energia' | 'Agua' | string;

export interface CriarSimulacaoRequest {
  atividade: string;
  tipo: TipoSimulacao;
  consumo_valor: number;
}

export interface SimulacaoResponse {
  // A API pode retornar o id com qualquer um destes nomes
  id?: number;
  id_simulacao?: number;
  simulacao_id?: number;
  simulation_id?: number;
  simulacaoId?: number;
  tipo?: TipoSimulacao;
  atividade?: string;
  nome_atividade?: string;
  consumo_valor?: number;
  consumo?: number;
  custo?: number;
  valor_calculado?: number;
  descricao?: string;
  data_registro?: string;
  created_at?: string;
  [key: string]: unknown;
}
