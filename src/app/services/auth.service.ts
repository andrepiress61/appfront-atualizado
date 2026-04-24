import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface UsuarioLocal {
  id?: number | string;
  nome?: string;
  email?: string;
  cidade?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${API_BASE_URL}/login/auth/login`, payload)
      .pipe(
        tap((res) => {
          localStorage.setItem('access_token', res.access_token);
          localStorage.setItem('token_type', res.token_type || 'bearer');
          localStorage.setItem('usuario_email_login', payload.email);
          localStorage.setItem('usuario_senha', payload.senha);
        })
      );
  }

  esqueceuSenha(email: string): Observable<unknown> {
    return this.http.post(`${API_BASE_URL}/login/auth/forgot-password`, { email });
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getTokenType(): string {
    return localStorage.getItem('token_type') || 'bearer';
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('usuario_nome');
    localStorage.removeItem('usuario_email');
    localStorage.removeItem('usuario_cidade');
    localStorage.removeItem('usuario_id');
    localStorage.removeItem('usuario_senha');
    localStorage.removeItem('usuario_local');
    localStorage.removeItem('usuario_email_login');
  }

  getUsuarioNome(): string {
    return localStorage.getItem('usuario_nome') || 'Usuário';
  }

  atualizarUsuarioLocal(usuario: UsuarioLocal): void {
    localStorage.setItem('usuario_local', JSON.stringify(usuario));

    if (usuario.id !== undefined && usuario.id !== null) {
      localStorage.setItem('usuario_id', String(usuario.id));
    }

    if (usuario.nome !== undefined) {
      localStorage.setItem('usuario_nome', usuario.nome);
    }

    if (usuario.email !== undefined) {
      localStorage.setItem('usuario_email', usuario.email);
    }

    if (usuario.cidade !== undefined) {
      localStorage.setItem('usuario_cidade', usuario.cidade);
    }
  }

  getUsuarioLocal(): UsuarioLocal | null {
    const usuario = localStorage.getItem('usuario_local');

    if (usuario) {
      try {
        return JSON.parse(usuario);
      } catch {
        return null;
      }
    }

    const id = localStorage.getItem('usuario_id');
    const nome = localStorage.getItem('usuario_nome');
    const email = localStorage.getItem('usuario_email');
    const cidade = localStorage.getItem('usuario_cidade');

    if (!id && !nome && !email && !cidade) {
      return null;
    }

    return {
      id: id || undefined,
      nome: nome || '',
      email: email || '',
      cidade: cidade || ''
    };
  }

  getSenhaLocal(): string {
    return localStorage.getItem('usuario_senha') || '';
  }

  atualizarSenhaLocal(senha: string): void {
    localStorage.setItem('usuario_senha', senha);
  }
}
