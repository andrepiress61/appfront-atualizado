import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';

export interface PontoReciclagem {
  id?: number;
  nome?: string;
  latitude: number;
  longitude: number;
  tipos_aceitos?: string[];
  tipos?: string[];
  descricao?: string;
  endereco?: string;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class MapaService {
  private http = inject(HttpClient);

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : ''
    });
  }

  listarPontosReciclagem(): Observable<PontoReciclagem[]> {
    return this.http.get<PontoReciclagem[]>(
      `${API_BASE_URL}/reciclagem/pontos/`,
      { headers: this.getHeaders() }
    );
  }
}
