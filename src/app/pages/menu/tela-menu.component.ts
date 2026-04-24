import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { SideMenuComponent } from '../../shared/side-menu/side-menu.component';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { MetaService, MetaResponse } from '../../services/meta.service';
import { ConsumoService, ConsumoResponse, InsightResponse } from '../../services/consumo.service';
import { AuthService, UsuarioLocal } from '../../core/auth.service';
import { UsuarioService, UsuarioMeResponse } from '../../services/usuarioservice';
import { ChatService, ChatMensagem } from '../../services/chat.service';

interface MetaView {
  id: number | string;
  tipo_meta: string;
  valor_objetivo: number;
  data_inicio: string;
  data_fim: string;
}

@Component({
  selector: 'app-tela-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, SideMenuComponent],
  templateUrl: './tela-menu.component.html',
  styleUrls: ['./tela-menu.component.css']
})
export class TelaMenuComponent implements OnInit {
  @ViewChild('chatContainer') chatContainer!: ElementRef;

  private usuarioService = inject(UsuarioService);
  private metaService = inject(MetaService);
  private consumoService = inject(ConsumoService);
  private authService = inject(AuthService);
  private chatService = inject(ChatService);

  menuAberto = false;
  mostrarResumo = true;
  mostrarInputMeta = false;
  carregando = false;
  erro = '';

  novaMeta = '';
  novaMetaTipo = '';
  novaMetaValor = 0;
  novaMetaDataInicio = '';
  novaMetaDataFim = '';

  get dataHoje(): string {
    return new Date().toISOString().split('T')[0];
  }

  usuarioNome = 'Usuário';
  usuarioEmail = '';
  usuarioCidade = '';

  registro = 0;
  totalGasto = 0;
  pontos = 0;
  rankRegional = 'Sem ranking';

  configuracoes: string[] = [];
  metas: MetaView[] = [];

  // Confirmar exclusão de meta
  metaParaExcluir: number | string | null = null;
  modalConfirmMetaAberto = false;

  // Insights
  modalInsightsAberto = false;
  carregandoInsights = false;
  insights: InsightResponse | null = null;
  erroInsights = '';

  // PDF
  exportandoPDF = false;
  erroPDF = '';

  // Chat
  chatAberto = false;
  chatTexto = '';
  chatCarregando = false;
  chatMensagens: ChatMensagem[] = [];

  constructor(private router: Router) {}

  ngOnInit(): void {
    const usuarioLocal = this.authService.getUsuarioLocal();
    if (usuarioLocal) {
      this.aplicarUsuario(usuarioLocal);
    }
    this.carregarTela();
  }

  carregarTela(): void {
    this.carregando = true;
    this.erro = '';

    // Carregar usuario, metas e consumos em paralelo
    forkJoin({
      usuario: this.usuarioService.buscarUsuarioLogado().pipe(catchError(() => of(null))),
      metas: this.metaService.listarMinhasMetas().pipe(catchError(() => of([]))),
      consumos: this.consumoService.listarMeusConsumos().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ usuario, metas, consumos }) => {
        // Usuario
        if (usuario) {
          this.aplicarUsuario(usuario);
          this.authService.atualizarUsuarioLocal({
            id: usuario?.id,
            nome: usuario?.nome,
            email: usuario?.email,
            cidade: usuario?.cidade
          });
        } else {
          const usuarioLocal = this.authService.getUsuarioLocal();
          if (usuarioLocal) this.aplicarUsuario(usuarioLocal);
        }

        // Metas
        const listaMetas = Array.isArray(metas) ? metas : [];
        this.metas = listaMetas.map((meta) => ({
          id: this.extrairMetaId(meta),
          tipo_meta: String(meta.tipo_meta || meta.titulo || 'Meta'),
          valor_objetivo: Number(meta.valor_objetivo ?? 0),
          data_inicio: String(meta.data_inicio || ''),
          data_fim: String(meta.data_fim || '')
        }));
        this.atualizarPontos();

        // Consumos
        const listaConsumos = Array.isArray(consumos) ? consumos : [];
        this.registro = listaConsumos.length;
        this.totalGasto = listaConsumos.reduce((acc, item) => acc + this.extrairValorConsumo(item), 0);

        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
        this.erro = 'Erro ao carregar dados.';
      }
    });
  }

  carregarUsuario(): void {
    this.usuarioService.buscarUsuarioLogado().subscribe({
      next: (usuario) => {
        this.aplicarUsuario(usuario);
        this.authService.atualizarUsuarioLocal({
          id: usuario?.id,
          nome: usuario?.nome,
          email: usuario?.email,
          cidade: usuario?.cidade
        });
      },
      error: () => {
        const usuarioLocal = this.authService.getUsuarioLocal();
        if (usuarioLocal) {
          this.aplicarUsuario(usuarioLocal);
        } else {
          this.erro = 'Não foi possível carregar os dados do usuário.';
        }
      }
    });
  }

  carregarMetas(): void {
    this.metaService.listarMinhasMetas().subscribe({
      next: (metas) => {
        this.metas = (metas || []).map((meta) => ({
          id: this.extrairMetaId(meta),
          tipo_meta: String(meta.tipo_meta || meta.titulo || 'Meta'),
          valor_objetivo: Number(meta.valor_objetivo ?? 0),
          data_inicio: String(meta.data_inicio || ''),
          data_fim: String(meta.data_fim || '')
        }));
        this.atualizarPontos();
      },
      error: () => {
        this.metas = [];
        this.atualizarPontos();
      }
    });
  }

  carregarConsumos(): void {
    this.consumoService.listarMeusConsumos().subscribe({
      next: (consumos) => {
        const lista = consumos || [];
        this.registro = lista.length;
        this.totalGasto = lista.reduce((acc, item) => acc + this.extrairValorConsumo(item), 0);
        this.carregando = false;
      },
      error: () => {
        this.registro = 0;
        this.totalGasto = 0;
        this.carregando = false;
      }
    });
  }

  aplicarUsuario(usuario: UsuarioMeResponse | UsuarioLocal): void {
    this.usuarioNome = String(usuario?.nome || 'Usuário');
    this.usuarioEmail = String(usuario?.email || '');
    this.usuarioCidade = String(usuario?.cidade || '');

    this.configuracoes = [
      `Nome: ${this.usuarioNome}`,
      this.usuarioEmail ? `Email: ${this.usuarioEmail}` : 'Email não informado',
      this.usuarioCidade ? `Cidade: ${this.usuarioCidade}` : 'Cidade não informada'
    ];
  }

  abrirMenu(): void { this.menuAberto = true; }
  fecharMenu(): void { this.menuAberto = false; }
  toggleResumo(): void { this.mostrarResumo = !this.mostrarResumo; }
  abrirInputMeta(): void { this.mostrarInputMeta = !this.mostrarInputMeta; }

  adicionarMeta(): void {
    if (!this.novaMetaTipo.trim()) { this.erro = 'Informe o tipo da meta.'; return; }
    if (!this.novaMetaValor || this.novaMetaValor <= 0) { this.erro = 'Informe um valor objetivo válido.'; return; }
    if (!this.novaMetaDataInicio) { this.erro = 'Informe a data de início.'; return; }
    if (!this.novaMetaDataFim) { this.erro = 'Informe a data de fim.'; return; }

    this.metaService.criarMeta({
      tipo_meta: this.novaMetaTipo.trim(),
      valor_objetivo: Number(this.novaMetaValor),
      data_inicio: this.novaMetaDataInicio,
      data_fim: this.novaMetaDataFim
    }).subscribe({
      next: () => {
        this.novaMetaTipo = '';
        this.novaMetaValor = 0;
        this.novaMetaDataInicio = '';
        this.novaMetaDataFim = '';
        this.mostrarInputMeta = false;
        this.erro = '';
        this.recarregarMetas();
      },
      error: () => { this.erro = 'Não foi possível cadastrar a meta.'; }
    });
  }

  confirmarRemocaoMeta(id: number | string): void {
    if (!id) { this.erro = 'Não foi possível identificar o ID da meta. Recarregue a página.'; return; }
    this.metaParaExcluir = id;
    this.modalConfirmMetaAberto = true;
  }

  cancelarRemocaoMeta(): void {
    this.metaParaExcluir = null;
    this.modalConfirmMetaAberto = false;
  }

  removerMetaConfirmado(): void {
    if (this.metaParaExcluir === null) return;
    const id = this.metaParaExcluir;
    this.modalConfirmMetaAberto = false;
    this.metaParaExcluir = null;

    this.metaService.deletarMeta(id).subscribe({
      next: () => {
        this.metas = this.metas.filter(meta => String(meta.id) !== String(id));
        this.atualizarPontos();
      },
      error: () => { this.erro = 'Não foi possível remover a meta.'; }
    });
  }

  recarregarMetas(): void {
    this.metaService.listarMinhasMetas().subscribe({
      next: (metas) => {
        this.metas = (metas || []).map((meta) => ({
          id: this.extrairMetaId(meta),
          tipo_meta: String(meta.tipo_meta || meta.titulo || 'Meta'),
          valor_objetivo: Number(meta.valor_objetivo ?? 0),
          data_inicio: String(meta.data_inicio || ''),
          data_fim: String(meta.data_fim || '')
        }));
        this.atualizarPontos();
      },
      error: () => { this.metas = []; this.atualizarPontos(); }
    });
  }

  atualizarPontos(): void {
    this.pontos = this.metas.length * 10;
    if (this.pontos >= 100) this.rankRegional = '1° LUGAR';
    else if (this.pontos >= 60) this.rankRegional = '2° LUGAR';
    else if (this.pontos >= 30) this.rankRegional = '3° LUGAR';
    else if (this.pontos > 0) this.rankRegional = '4° LUGAR';
    else this.rankRegional = 'Sem ranking';
  }

  // ── INSIGHTS ──
  abrirInsights(): void {
    this.modalInsightsAberto = true;
    this.insights = null;
    this.erroInsights = '';
    this.carregandoInsights = true;

    this.consumoService.obterInsights().subscribe({
      next: (res) => {
        this.insights = res;
        this.carregandoInsights = false;
      },
      error: () => {
        this.erroInsights = 'Não foi possível carregar os insights. Verifique se há consumos registrados.';
        this.carregandoInsights = false;
      }
    });
  }

  fecharInsights(): void {
    this.modalInsightsAberto = false;
  }

  // ── PDF ──
  exportarPDF(): void {
    this.exportandoPDF = true;
    this.erroPDF = '';

    this.consumoService.exportarRelatorioPDF().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-ecototally-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.exportandoPDF = false;
      },
      error: () => {
        this.erroPDF = 'Não foi possível gerar o PDF. Tente novamente.';
        this.exportandoPDF = false;
      }
    });
  }

  // Navegação
  irParaMenu(): void { this.router.navigate(['/menu']); }
  irParaPerfil(): void { this.router.navigate(['/perfil']); }
  irParaConsumo(): void { this.router.navigate(['/consumo']); }
  irParaGraficos(): void { this.router.navigate(['/graficos']); }
  irParaSimulacao(): void { this.router.navigate(['/simulacao']); }
  irParaMapa(): void { this.router.navigate(['/mapa']); }

  voltarParaLogin(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Chat IA
  abrirChat(): void {
    this.chatAberto = true;
    this.fecharMenu();
  }

  fecharChat(): void {
    this.chatAberto = false;
  }

  enviarMensagemChat(): void {
    const texto = this.chatTexto.trim();
    if (!texto || this.chatCarregando) return;

    const msgUser: ChatMensagem = { role: 'user', content: texto };
    this.chatMensagens.push(msgUser);
    this.chatTexto = '';
    this.chatCarregando = true;

    setTimeout(() => this.scrollChat(), 50);

    this.chatService.enviarMensagem({
      mensagem: texto,
      historico: this.chatMensagens.slice(0, -1)
    }).subscribe({
      next: (res) => {
        const resposta = res.resposta || res.message || res.response || res.content || 'Sem resposta.';
        this.chatMensagens.push({ role: 'assistant', content: String(resposta) });
        this.chatCarregando = false;
        setTimeout(() => this.scrollChat(), 50);
      },
      error: () => {
        this.chatMensagens.push({
          role: 'assistant',
          content: 'Desculpe, não consegui me conectar ao servidor. Tente novamente.'
        });
        this.chatCarregando = false;
        setTimeout(() => this.scrollChat(), 50);
      }
    });
  }

  private scrollChat(): void {
    if (this.chatContainer?.nativeElement) {
      const el = this.chatContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  private extrairMetaId(meta: MetaResponse): number | string {
    return meta.id_meta ?? meta.meta_id ?? meta.id ?? '';
  }

  private extrairValorConsumo(item: ConsumoResponse): number {
    const valor = item.valor ?? item.gasto ?? item.total ?? item.preco ?? 0;
    return typeof valor === 'number' ? valor : Number(valor) || 0;
  }
}
