import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ConsumoRequest,
  ConsumoResponse,
  ConsumoService
} from '../../services/consumo.service';
import { SideMenuComponent } from '../../shared/side-menu/side-menu.component';

interface RegistroView {
  id: number;
  tipo: string;
  gasto: number;
  data: string;
  dataFormatada: string;
  descricao: string;
  expandido: boolean;
}

@Component({
  selector: 'app-tela-consumo',
  standalone: true,
  imports: [CommonModule, FormsModule, SideMenuComponent],
  templateUrl: './tela-consumo.component.html',
  styleUrls: ['./tela-consumo.component.css'],
  providers: [CurrencyPipe, DatePipe]
})
export class TelaConsumoComponent implements OnInit {
  private consumoService = inject(ConsumoService);
  private currencyPipe = inject(CurrencyPipe);
  private datePipe = inject(DatePipe);

  constructor(private router: Router) {}

  menuAberto = false;
  carregando = false;
  salvando = false;
  erro = '';
  mensagem = '';

  tipoSelecionado = '';
  valor = '';
  dataSelecionada = '';
  descricao = '';

  editandoId: number | null = null;

  registros: RegistroView[] = [];

  readonly tipos = [
    { chave: 'energia', label: 'ENERGIA', emoji: '⚡' },
    { chave: 'agua', label: 'ÁGUA', emoji: '💧' },
    { chave: 'transporte', label: 'TRANSPORTE', emoji: '🚗' },
    { chave: 'alimentacao', label: 'ALIMENTAÇÃO', emoji: '🌽' },
    { chave: 'residuos', label: 'RESÍDUOS', emoji: '♻️' },
    { chave: 'outros', label: 'OUTROS', emoji: '📦' }
  ];

  get dataMaxima(): string {
    return new Date().toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.carregarHistorico();
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

  selecionarTipo(tipo: string): void {
    this.tipoSelecionado = tipo;
  }

  toggleExpandir(item: RegistroView): void {
    item.expandido = !item.expandido;
  }

  carregarHistorico(): void {
    this.carregando = true;
    this.erro = '';

    this.consumoService.listarMeusConsumos().subscribe({
      next: (consumos: ConsumoResponse[]) => {
        this.registros = (consumos || []).map((item, index) => ({
          id: Number(item.id ?? item.consumo_id ?? index),
          tipo: String(item.tipo || 'outros'),
          gasto: this.extrairValor(item),
          data: String(item.data || ''),
          dataFormatada: this.formatarData(String(item.data || '')),
          descricao: String(item.descricao || ''),
          expandido: false
        }));

        this.carregando = false;
      },
      error: (err) => {
        console.error('Erro ao carregar histórico:', err);
        this.carregando = false;
        this.erro =
          err?.error?.detail ||
          err?.error?.message ||
          'Não foi possível carregar o histórico.';
      }
    });
  }

  salvarRegistro(): void {
    this.erro = '';
    this.mensagem = '';

    if (!this.tipoSelecionado) {
      this.erro = 'Selecione um tipo de registro.';
      return;
    }

    const gasto = Number(this.valor.replace(',', '.'));

    if (!gasto || gasto <= 0) {
      this.erro = 'Informe um valor válido.';
      return;
    }

    if (!this.dataSelecionada) {
      this.erro = 'Selecione uma data.';
      return;
    }

    this.salvando = true;

    const payload: ConsumoRequest = {
      tipo: this.tipoSelecionado,
      gasto,
      data: this.montarDataIso(this.dataSelecionada),
      meta_id: null
    };

    const requisicao$ = this.editandoId
      ? this.consumoService.editarConsumo(this.editandoId, payload)
      : this.consumoService.criarConsumo(payload);

    requisicao$.subscribe({
      next: () => {
        this.salvando = false;
        this.mensagem = this.editandoId
          ? 'Registro atualizado com sucesso.'
          : 'Registro criado com sucesso.';

        this.limparFormulario();
        this.carregarHistorico();
      },
      error: (err) => {
        console.error('Erro ao salvar registro:', err);
        this.salvando = false;
        this.erro =
          err?.error?.detail ||
          err?.error?.message ||
          JSON.stringify(err?.error) ||
          'Não foi possível salvar o registro.';
      }
    });
  }

  editarRegistro(item: RegistroView): void {
    this.editandoId = item.id;
    this.tipoSelecionado = item.tipo;
    this.valor = String(item.gasto).replace('.', ',');
    this.dataSelecionada = item.data ? item.data.slice(0, 10) : '';
    this.descricao = item.descricao || '';

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  excluirRegistro(id: number): void {
    this.erro = '';
    this.mensagem = '';

    this.consumoService.deletarConsumo(id).subscribe({
      next: () => {
        this.mensagem = 'Registro removido com sucesso.';
        this.carregarHistorico();
      },
      error: (err) => {
        console.error('Erro ao excluir registro:', err);
        this.erro =
          err?.error?.detail ||
          err?.error?.message ||
          'Não foi possível excluir o registro.';
      }
    });
  }

  cancelarEdicao(): void {
    this.limparFormulario();
  }

  formatarData(data: string): string {
    if (!data) {
      return '';
    }

    return this.datePipe.transform(data, 'dd/MM/yyyy') || data;
  }

  formatarMoeda(valor: number): string {
    return this.currencyPipe.transform(valor, 'BRL', 'symbol', '1.2-2') || 'R$0,00';
  }

  tipoLabel(tipo: string): string {
    const encontrado = this.tipos.find((t) => t.chave === tipo);
    return encontrado?.label || tipo.toUpperCase();
  }

  tipoEmoji(tipo: string): string {
    const encontrado = this.tipos.find((t) => t.chave === tipo);
    return encontrado?.emoji || '🟢';
  }

  private montarDataIso(data: string): string {
    return `${data}T12:00:00`;
  }

  private limparFormulario(): void {
    this.editandoId = null;
    this.tipoSelecionado = '';
    this.valor = '';
    this.dataSelecionada = '';
    this.descricao = '';
  }

  private extrairValor(item: ConsumoResponse): number {
    const valor = item.gasto ?? item.valor ?? item.total ?? item.preco ?? 0;
    return typeof valor === 'number' ? valor : Number(valor) || 0;
  }
}