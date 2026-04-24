import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';

export interface MetaRequest {
  tipo_meta: string;
  valor_objetivo: number;
  data_inicio: string;
  data_fim: string;
}

export interface MetaResponse {
  id?: number | string;
  id_meta?: number | string;
  meta_id?: number | string;
  tipo_meta?: string;
  valor_objetivo?: number;
  data_inicio?: string;
  data_fim?: string;
  // campos legados (compatibilidade)
  titulo?: string;
  descricao?: string;
  nome?: string;
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class MetaService {
  private http = inject(HttpClient);

  listarMinhasMetas(): Observable<MetaResponse[]> {
    return this.http.get<MetaResponse[]>(`${API_BASE_URL}/metas/metas/me`);
  }

  criarMeta(payload: MetaRequest): Observable<unknown> {
    return this.http.post(`${API_BASE_URL}/metas/metas`, payload);
  }

  editarMeta(metaId: number | string, payload: MetaRequest): Observable<unknown> {
    return this.http.put(`${API_BASE_URL}/metas/metas/${metaId}`, payload);
  }

  deletarMeta(metaId: number | string): Observable<unknown> {
    return this.http.delete(`${API_BASE_URL}/metas/metas/${metaId}`);
  }
}
