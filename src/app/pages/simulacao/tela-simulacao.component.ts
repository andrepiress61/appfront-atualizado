import { Component, OnInit, inject } from '@angular/core';
import { SideMenuComponent } from '../../shared/side-menu/side-menu.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { SimulacaoService } from '../../services/simulacao.service';
import { AuthService } from '../../core/auth.service';
import {
  CriarSimulacaoRequest,
  SimulacaoResponse,
  TipoSimulacao
} from '../../models/simulacao.model';

@Component({
  selector: 'app-tela-simulacao',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SideMenuComponent],
  templateUrl: './tela-simulacao.component.html',
  styleUrls: ['./tela-simulacao.component.css']
})
export class TelaSimulacaoComponent implements OnInit {
  private simulacaoService = inject(SimulacaoService);
  private authService = inject(AuthService);
  private router = inject(Router);

  menuAberto = false;

  tipoSelecionado: TipoSimulacao = 'Energia';
  atividade = '';
  consumo = 0;
  carregando = false;
  carregandoHistorico = false;
  mensagem = '';
  erro = '';

  // Confirmação de exclusão
  idParaExcluir: number | null = null;
  modalConfirmAberto = false;

  usuarioNome = 'Usuário';
  simulacoes: SimulacaoResponse[] = [];

  ngOnInit(): void {
    this.usuarioNome = this.authService.getUsuarioNome() || 'Usuário';
    this.carregarHistorico();
  }

  selecionarTipo(tipo: TipoSimulacao): void {
    this.tipoSelecionado = tipo;
    this.mensagem = '';
    this.erro = '';
  }

  getUnidade(): string {
    return this.tipoSelecionado === 'Agua' ? 'Litros' : 'kWh';
  }

  getLabelConsumo(item: SimulacaoResponse): string {
    return item.tipo === 'Agua' ? 'Litros' : 'kWh';
  }

  criarSimulacao(): void {
    this.mensagem = '';
    this.erro = '';

    if (!this.atividade.trim()) {
      this.erro = 'Informe o nome da atividade.';
      return;
    }

    if (!this.consumo || this.consumo <= 0) {
      this.erro = 'Informe um consumo maior que zero.';
      return;
    }

    const payload: CriarSimulacaoRequest = {
      atividade: this.atividade.trim(),
      tipo: this.tipoSelecionado,
      consumo_valor: Number(this.consumo)
    };

    this.carregando = true;

    this.simulacaoService.criarSimulacao(payload).subscribe({
      next: () => {
        this.mensagem = 'Simulação criada com sucesso!';
        this.atividade = '';
        this.consumo = 0;
        this.carregando = false;
        this.carregarHistorico();
      },
      error: (error) => {
        this.carregando = false;
        const msg = this.extrairMensagemErro(error);
        if (msg.toLowerCase().includes('tarifa') || msg.toLowerCase().includes('regi')) {
          this.erro = 'Sua cidade não tem tarifa configurada. Atualize sua cidade no Perfil.';
        } else {
          this.erro = msg;
        }
        console.error('Erro ao criar simulação:', error);
      }
    });
  }

  carregarHistorico(): void {
    this.carregandoHistorico = true;
    this.simulacaoService.listarSimulacoes().subscribe({
      next: (res) => {
        this.simulacoes = Array.isArray(res) ? res : [];
        this.carregandoHistorico = false;
      },
      error: () => {
        this.carregandoHistorico = false;
        this.simulacoes = [];
      }
    });
  }

  confirmarExclusao(item: SimulacaoResponse): void {
    // A API pode retornar o id com diferentes nomes: id, simulacao_id, etc.
    // Percorremos todos os campos do objeto para encontrar um valor numérico válido de id
    const raw = item as Record<string, unknown>;
    const id = Number(
      raw['id_simulacao'] ??
      raw['simulacao_id'] ??
      raw['id'] ??
      raw['simulation_id'] ??
      raw['simulacaoId'] ??
      0
    );
    if (!id || isNaN(id)) {
      // Última tentativa: procurar qualquer campo que termine em _id ou Id e seja número
      const idKey = Object.keys(raw).find(k =>
        (k.toLowerCase().endsWith('_id') || k.toLowerCase().endsWith('id')) &&
        !isNaN(Number(raw[k])) && Number(raw[k]) > 0
      );
      if (idKey) {
        this.idParaExcluir = Number(raw[idKey]);
        this.modalConfirmAberto = true;
        return;
      }
      this.erro = 'Não foi possível identificar esta simulação. Recarregue a página.';
      return;
    }
    this.idParaExcluir = id;
    this.modalConfirmAberto = true;
  }

  cancelarExclusao(): void {
    this.idParaExcluir = null;
    this.modalConfirmAberto = false;
  }

  excluirSimulacaoConfirmado(): void {
    if (!this.idParaExcluir) return;
    const id = this.idParaExcluir;
    this.modalConfirmAberto = false;
    this.idParaExcluir = null;

    this.simulacaoService.deletarSimulacao(id).subscribe({
      next: () => {
        this.mensagem = 'Simulação excluída com sucesso.';
        this.erro = '';
        this.simulacoes = this.simulacoes.filter(item => String(this.extrairSimulacaoId(item)) !== String(id));
      },
      error: (error) => {
        this.erro = this.extrairMensagemErro(error);
      }
    });
  }

  getNomeAtividade(item: SimulacaoResponse): string {
    return String(item.atividade || item.nome_atividade || 'Sem nome');
  }

  getValorConsumo(item: SimulacaoResponse): number {
    return Number(item.consumo_valor ?? item.consumo ?? 0);
  }

  getIconeTipo(tipo: string | undefined): string {
    const t = (tipo || '').toLowerCase();
    return t === 'agua' ? '💧' : '⚡';
  }

  getTituloTipo(tipo: string | undefined): string {
    const t = (tipo || '').toLowerCase();
    return t === 'agua' ? 'Água' : 'Energia';
  }

  formatarData(data?: string): string {
    if (!data) return '-';
    const novaData = new Date(data);
    if (isNaN(novaData.getTime())) return data;
    return novaData.toLocaleDateString('pt-BR');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private extrairSimulacaoId(item: SimulacaoResponse): number | string {
    const raw = item as Record<string, unknown>;
    const direto = raw['id_simulacao'] ?? raw['simulacao_id'] ?? raw['id'] ?? raw['simulation_id'] ?? raw['simulacaoId'];
    if (direto !== undefined && direto !== null && !isNaN(Number(direto))) return Number(direto);

    const idKey = Object.keys(raw).find(k =>
      (k.toLowerCase().includes('simulacao') || k.toLowerCase().endsWith('_id') || k.toLowerCase().endsWith('id')) &&
      !isNaN(Number(raw[k])) && Number(raw[k]) > 0
    );

    return idKey ? Number(raw[idKey]) : '';
  }

  extrairMensagemErro(error: any): string {
    if (error?.error?.detail && typeof error.error.detail === 'string') {
      return error.error.detail;
    }
    if (Array.isArray(error?.error?.detail)) {
      return error.error.detail.map((item: any) => item?.msg || 'Erro').join(', ');
    }
    if (typeof error?.error === 'string') return error.error;
    if (error?.error && typeof error.error === 'object') {
      return (Object.values(error.error).flat() as string[]).join(', ');
    }
    return 'Ocorreu um erro ao processar sua solicitação.';
  }
}
