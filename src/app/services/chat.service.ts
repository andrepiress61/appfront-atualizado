import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';

export interface ChatMensagem {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  mensagem: string;
  historico?: ChatMensagem[];
}

export interface ChatResponse {
  resposta?: string;
  message?: string;
  response?: string;
  content?: string;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : ''
    });
  }

  enviarMensagem(payload: ChatRequest): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(
      `${API_BASE_URL}/chat/mensagem/`,
      payload,
      { headers: this.getHeaders() }
    );
  }
}
