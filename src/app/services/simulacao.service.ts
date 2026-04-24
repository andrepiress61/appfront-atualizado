import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';
import {
  CriarSimulacaoRequest,
  SimulacaoResponse
} from '../models/simulacao.model';

@Injectable({
  providedIn: 'root'
})
export class SimulacaoService {
  private http = inject(HttpClient);
  private apiUrl = `${API_BASE_URL}/simulacao/simulacoes`;

  criarSimulacao(payload: CriarSimulacaoRequest): Observable<SimulacaoResponse> {
    return this.http.post<SimulacaoResponse>(`${this.apiUrl}/`, payload);
  }

  listarSimulacoes(): Observable<SimulacaoResponse[]> {
    return this.http.get<SimulacaoResponse[]>(`${this.apiUrl}/`);
  }

  deletarSimulacao(simulacaoId: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${simulacaoId}`);
  }
}
