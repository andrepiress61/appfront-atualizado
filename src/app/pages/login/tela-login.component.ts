import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-tela-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tela-login.component.html',
  styleUrls: ['./tela-login.component.css']
})
export class TelaLoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  senha = '';
  erro = '';
  carregando = false;
  mostrarSenha = false;

  // Esqueci senha
  modalEsqueciAberto = false;
  emailRecuperacao = '';
  erroRecuperacao = '';
  mensagemRecuperacao = '';
  carregandoRecuperacao = false;

  entrar(): void {
    this.erro = '';

    if (!this.email.trim() || !this.senha.trim()) {
      this.erro = 'Preencha email e senha.';
      return;
    }

    this.carregando = true;

    this.authService.login({ email: this.email.trim(), senha: this.senha.trim() }).subscribe({
      next: () => {
        this.carregando = false;
        this.router.navigate(['/menu']);
      },
      error: (err) => {
        this.carregando = false;
        this.erro =
          err?.error?.detail ||
          err?.error?.message ||
          'Email ou senha inválidos.';
      }
    });
  }

  irParaCadastro(): void {
    this.router.navigate(['/cadastro']);
  }

  alternarSenha(): void {
    this.mostrarSenha = !this.mostrarSenha;
  }

  abrirModalEsqueci(): void {
    this.modalEsqueciAberto = true;
    this.emailRecuperacao = this.email || '';
    this.erroRecuperacao = '';
    this.mensagemRecuperacao = '';
  }

  fecharModalEsqueci(): void {
    this.modalEsqueciAberto = false;
    this.emailRecuperacao = '';
    this.erroRecuperacao = '';
    this.mensagemRecuperacao = '';
  }

  enviarRecuperacao(): void {
    this.erroRecuperacao = '';
    this.mensagemRecuperacao = '';

    if (!this.emailRecuperacao.trim()) {
      this.erroRecuperacao = 'Informe seu email.';
      return;
    }

    this.carregandoRecuperacao = true;

    this.authService.esqueceuSenha(this.emailRecuperacao.trim()).subscribe({
      next: () => {
        this.carregandoRecuperacao = false;
        this.mensagemRecuperacao = 'Email de recuperação enviado! Verifique sua caixa de entrada.';
      },
      error: (err) => {
        this.carregandoRecuperacao = false;
        this.erroRecuperacao =
          err?.error?.detail ||
          err?.error?.message ||
          'Não foi possível enviar o email. Tente novamente.';
      }
    });
  }
}
