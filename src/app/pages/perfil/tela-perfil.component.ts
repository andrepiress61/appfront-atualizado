import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { SideMenuComponent } from '../../shared/side-menu/side-menu.component';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, UsuarioLocal } from '../../core/auth.service';
import { UsuarioService, UsuarioMeResponse } from '../../services/usuarioservice';

interface Dica {
  titulo: string;
  descricao: string;
}

@Component({
  selector: 'app-tela-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, SideMenuComponent],
  templateUrl: './tela-perfil.component.html',
  styleUrls: ['./tela-perfil.component.css']
})
export class TelaPerfilComponent implements OnInit {
  private usuarioService = inject(UsuarioService);
  private authService = inject(AuthService);

  menuAberto = false;
  carregando = false;
  salvando = false;
  erro = '';
  mensagem = '';

  usuarioId: number | string | null = null;

  nome = '';
  email = '';
  cidade = '';

  nomeEditavel = '';
  emailEditavel = '';
  cidadeEditavel = '';
  novaSenha = '';

  editandoNome = false;
  editandoEmail = false;
  editandoCidade = false;
  editandoSenha = false;

  avaliacaoDica: 'sim' | 'nao' | '' = '';

  dicaDoDia: Dica = {
    titulo: 'REDUZA O TEMPO DE BANHO',
    descricao: 'DIMINUIR SEU BANHO EM 2 MINUTOS PODE ECONOMIZAR ATÉ 20L DE ÁGUA'
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Carrega do cache local imediatamente (sem esperar a API)
    const usuarioLocal = this.authService.getUsuarioLocal();
    if (usuarioLocal) {
      this.aplicarUsuario(usuarioLocal);
    }
    // Atualiza com dados frescos da API em background
    this.carregarUsuario();
  }

  carregarUsuario(): void {
    this.carregando = true;
    this.erro = '';

    this.usuarioService.buscarUsuarioLogado().subscribe({
      next: (usuario) => {
        this.aplicarUsuario(usuario);
        this.authService.atualizarUsuarioLocal(usuario);
        this.carregando = false;
      },
      error: () => {
        const usuarioLocal = this.authService.getUsuarioLocal();

        if (usuarioLocal) {
          this.aplicarUsuario(usuarioLocal);
          this.carregando = false;
          return;
        }

        this.carregando = false;
        this.erro = 'Não foi possível carregar os dados do usuário.';
      }
    });
  }

  aplicarUsuario(usuario: UsuarioMeResponse | UsuarioLocal): void {
    this.usuarioId = usuario?.id ?? null;
    this.nome = String(usuario?.nome || '');
    this.email = String(usuario?.email || '');
    this.cidade = String(usuario?.cidade || '');

    this.nomeEditavel = this.nome;
    this.emailEditavel = this.email;
    this.cidadeEditavel = this.cidade;
  }

  toggleEditarNome(): void {
    this.editandoNome = !this.editandoNome;
    this.nomeEditavel = this.nome;
    this.erro = '';
    this.mensagem = '';
  }

  toggleEditarEmail(): void {
    this.editandoEmail = !this.editandoEmail;
    this.emailEditavel = this.email;
    this.erro = '';
    this.mensagem = '';
  }

  toggleEditarCidade(): void {
    this.editandoCidade = !this.editandoCidade;
    this.cidadeEditavel = this.cidade;
    this.erro = '';
    this.mensagem = '';
  }

  toggleEditarSenha(): void {
    this.editandoSenha = !this.editandoSenha;
    this.novaSenha = '';
    this.erro = '';
    this.mensagem = '';
  }

  salvarNome(): void {
    const senhaSalva = this.authService.getSenhaLocal();

    const payload = {
      nome: this.nomeEditavel.trim(),
      email: this.email.trim(),
      senha: senhaSalva,
      cidade: this.cidade.trim()
    };

    if (!payload.nome || !payload.email || !payload.senha || !payload.cidade) {
      this.erro = 'Nome, email, senha e cidade são obrigatórios para atualizar.';
      return;
    }

    this.salvando = true;
    this.erro = '';
    this.mensagem = '';

    this.usuarioService.atualizarUsuario(payload).subscribe({
      next: () => {
        this.nome = payload.nome;
        this.nomeEditavel = payload.nome;
        this.editandoNome = false;
        this.salvando = false;
        this.mensagem = 'Nome atualizado com sucesso.';
        this.atualizarUsuarioLocal();
      },
      error: (err) => {
        console.error('Erro ao atualizar nome:', err);
        this.salvando = false;
        this.erro =
          err?.error?.detail ||
          err?.error?.message ||
          JSON.stringify(err?.error) ||
          'Não foi possível atualizar o nome.';
      }
    });
  }

  salvarEmail(): void {
    const senhaSalva = this.authService.getSenhaLocal();

    const payload = {
      nome: this.nome.trim(),
      email: this.emailEditavel.trim(),
      senha: senhaSalva,
      cidade: this.cidade.trim()
    };

    if (!payload.nome || !payload.email || !payload.senha || !payload.cidade) {
      this.erro = 'Nome, email, senha e cidade são obrigatórios para atualizar.';
      return;
    }

    this.salvando = true;
    this.erro = '';
    this.mensagem = '';

    this.usuarioService.atualizarUsuario(payload).subscribe({
      next: () => {
        this.email = payload.email;
        this.emailEditavel = payload.email;
        this.editandoEmail = false;
        this.salvando = false;
        this.mensagem = 'Email atualizado com sucesso.';
        this.atualizarUsuarioLocal();
      },
      error: (err) => {
        console.error('Erro ao atualizar email:', err);
        this.salvando = false;
        this.erro =
          err?.error?.detail ||
          err?.error?.message ||
          JSON.stringify(err?.error) ||
          'Não foi possível atualizar o email.';
      }
    });
  }

  salvarCidade(): void {
    const senhaSalva = this.authService.getSenhaLocal();

    const payload = {
      nome: this.nome.trim(),
      email: this.email.trim(),
      senha: senhaSalva,
      cidade: this.cidadeEditavel.trim()
    };

    if (!payload.nome || !payload.email || !payload.senha || !payload.cidade) {
      this.erro = 'Nome, email, senha e cidade são obrigatórios para atualizar.';
      return;
    }

    this.salvando = true;
    this.erro = '';
    this.mensagem = '';

    this.usuarioService.atualizarUsuario(payload).subscribe({
      next: () => {
        this.cidade = payload.cidade;
        this.cidadeEditavel = payload.cidade;
        this.editandoCidade = false;
        this.salvando = false;
        this.mensagem = 'Cidade atualizada com sucesso.';
        this.atualizarUsuarioLocal();
      },
      error: (err) => {
        console.error('Erro ao atualizar cidade:', err);
        this.salvando = false;
        this.erro =
          err?.error?.detail ||
          err?.error?.message ||
          JSON.stringify(err?.error) ||
          'Não foi possível atualizar a cidade.';
      }
    });
  }

  salvarSenha(): void {
    const senhaNova = this.novaSenha.trim();

    const payload = {
      nome: this.nome.trim(),
      email: this.email.trim(),
      senha: senhaNova,
      cidade: this.cidade.trim()
    };

    if (!payload.nome || !payload.email || !payload.senha || !payload.cidade) {
      this.erro = 'Nome, email, senha e cidade são obrigatórios para atualizar.';
      return;
    }

    this.salvando = true;
    this.erro = '';
    this.mensagem = '';

    this.usuarioService.atualizarUsuario(payload).subscribe({
      next: () => {
        this.authService.atualizarSenhaLocal(senhaNova);
        this.editandoSenha = false;
        this.novaSenha = '';
        this.salvando = false;
        this.mensagem = 'Senha atualizada com sucesso.';
      },
      error: (err) => {
        console.error('Erro ao atualizar senha:', err);
        this.salvando = false;
        this.erro =
          err?.error?.detail ||
          err?.error?.message ||
          JSON.stringify(err?.error) ||
          'Não foi possível atualizar a senha.';
      }
    });
  }

  avaliarDica(valor: 'sim' | 'nao'): void {
    this.avaliacaoDica = valor;
  }

  atualizarUsuarioLocal(): void {
    this.authService.atualizarUsuarioLocal({
      id: this.usuarioId ?? undefined,
      nome: this.nome,
      email: this.email,
      cidade: this.cidade
    });
  }

  abrirMenu(): void {
    this.menuAberto = true;
  }

  fecharMenu(): void {
    this.menuAberto = false;
  }

  irParaMenu(): void {
    this.router.navigate(['/menu']);
  }

  irParaPerfil(): void {
    this.router.navigate(['/perfil']);
  }

  irParaConsumo(): void {
    this.router.navigate(['/consumo']);
  }

  irParaGraficos(): void {
    this.router.navigate(['/graficos']);
  }

  irParaSimulacao(): void {
    this.router.navigate(['/simulacao']);
  }

  irParaMapa(): void {
    this.router.navigate(['/mapa']);
  }

  abrirChat(): void {
    this.router.navigate(['/chat']);
  }

  sair(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}