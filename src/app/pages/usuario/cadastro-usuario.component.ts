import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { UsuarioService } from '../../services/usuarioservice';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-cadastro-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cadastro-usuario.component.html',
  styleUrls: ['./cadastro-usuario.component.css']
})
export class CadastroUsuarioComponent {
  private usuarioService = inject(UsuarioService);
  private authService = inject(AuthService);

  nome = '';
  email = '';
  senha = '';
  cidade = '';

  mensagem = '';
  erro = '';
  carregando = false;
  mostrarSenha = false;

  constructor(private router: Router) {}

  cadastrar(): void {
    this.erro = '';
    this.mensagem = '';

    if (!this.nome.trim() || !this.email.trim() || !this.senha.trim() || !this.cidade.trim()) {
      this.erro = 'Preencha todos os campos.';
      return;
    }

    this.carregando = true;

    const payload = {
      nome: this.nome.trim(),
      email: this.email.trim(),
      senha: this.senha.trim(),
      cidade: this.cidade.trim()
    };

    this.usuarioService.cadastrar(payload).subscribe({
      next: () => {
        localStorage.setItem('senha_usuario', this.senha.trim());

        this.authService.login({
          email: this.email.trim(),
          senha: this.senha.trim()
        }).subscribe({
          next: () => {
            this.carregando = false;
            this.router.navigate(['/menu']);
          },
          error: (err) => {
            console.error('Erro no login automático:', err);
            this.carregando = false;
            this.mensagem = 'Usuário cadastrado, mas o login automático falhou.';
            this.router.navigate(['/login']);
          }
        });
      },
      error: (err) => {
        console.error('Erro no cadastro:', err);
        this.carregando = false;
        this.erro =
          err?.error?.detail ||
          err?.error?.message ||
          JSON.stringify(err?.error) ||
          'Erro ao cadastrar usuário.';
      }
    });
  }

  voltarParaLogin(): void {
    this.router.navigate(['/login']);
  }

  alternarSenha(): void {
    this.mostrarSenha = !this.mostrarSenha;
  }
}