import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SideMenuComponent } from '../../shared/side-menu/side-menu.component';
import { ConsumoResponse, ConsumoService } from '../../services/consumo.service';
import { SimulacaoService } from '../../services/simulacao.service';
import { SimulacaoResponse } from '../../models/simulacao.model';

interface CategoriaGrafico {
  label: string;
  valor: number;
  porcentagem: number;
  cor: string;
}

interface BarraSemana {
  label: string;
  valor: number;
  altura: number;
}

@Component({
  selector: 'app-tela-graficos',
  standalone: true,
  imports: [CommonModule, SideMenuComponent],
  templateUrl: './tela-graficos.component.html',
  styleUrls: ['./tela-graficos.component.css'],
  providers: [CurrencyPipe]
})
export class TelaGraficosComponent implements OnInit {
  private consumoService = inject(ConsumoService);
  private simulacaoService = inject(SimulacaoService);
  private currencyPipe = inject(CurrencyPipe);
  private router = inject(Router);

  menuAberto = false;
  abaAtiva: 'consumo' | 'simulacao' = 'consumo';

  carregando = false;
  erro = '';

  totalRegistros = 0;
  totalGasto = 0;
  categorias: CategoriaGrafico[] = [];
  barrasUltimos7Dias: BarraSemana[] = [];

  maiorCategoriaTexto = 'Sem dados ainda.';
  graficoPizzaStyle = 'conic-gradient(#1f3d35 0deg 360deg)';

  private consumosCache: ConsumoResponse[] = [];
  private simulacoesCache: SimulacaoResponse[] = [];
  private dadosCarregados = false;

  ngOnInit(): void {
    this.carregarTodosDados();
  }

  carregarTodosDados(): void {
    this.iniciarCarregamento();

    forkJoin({
      consumos: this.consumoService.listarMeusConsumos().pipe(catchError(() => of([]))),
      simulacoes: this.simulacaoService.listarSimulacoes().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ consumos, simulacoes }) => {
        this.consumosCache = Array.isArray(consumos) ? consumos : [];
        this.simulacoesCache = Array.isArray(simulacoes) ? simulacoes : [];
        this.dadosCarregados = true;
        this.aplicarDadosConsumo();
      },
      error: () => {
        this.limparGraficos('Não foi possível carregar os dados.', 'Sem dados.');
      }
    });
  }

  private aplicarDadosConsumo(): void {
    const lista = this.consumosCache;
    this.totalRegistros = lista.length;
    this.totalGasto = lista.reduce((acc, item) => acc + this.extrairValorConsumo(item), 0);
    this.montarGraficoCategoriasConsumo(lista);
    this.montarGraficoUltimos7DiasConsumo(lista);
    this.carregando = false;
  }

  private aplicarDadosSimulacao(): void {
    const lista = this.simulacoesCache;
    this.totalRegistros = lista.length;
    this.totalGasto = lista.reduce((acc, item) => acc + this.extrairValorSimulacao(item), 0);
    this.montarGraficoCategoriasSimulacao(lista);
    this.montarGraficoUltimos7DiasSimulacao(lista);
    this.carregando = false;
  }

  selecionarAba(aba: 'consumo' | 'simulacao'): void {
    this.abaAtiva = aba;

    if (!this.dadosCarregados) {
      this.carregarTodosDados();
      return;
    }

    this.iniciarCarregamento();
    // Troca instantânea usando cache
    if (aba === 'consumo') {
      this.aplicarDadosConsumo();
    } else {
      this.aplicarDadosSimulacao();
    }
  }

  carregarGraficosConsumo(): void {
    this.iniciarCarregamento();

    this.consumoService.listarMeusConsumos().subscribe({
      next: (consumos) => {
        const lista = Array.isArray(consumos) ? consumos : [];
        this.consumosCache = lista;
        this.totalRegistros = lista.length;
        this.totalGasto = lista.reduce((acc, item) => acc + this.extrairValorConsumo(item), 0);
        this.montarGraficoCategoriasConsumo(lista);
        this.montarGraficoUltimos7DiasConsumo(lista);
        this.carregando = false;
      },
      error: (err) => {
        console.error('Erro ao carregar gráficos de consumo:', err);
        this.limparGraficos('Não foi possível carregar os gráficos de consumo.', 'Sem dados de consumo.');
      }
    });
  }

  carregarGraficosSimulacao(): void {
    this.iniciarCarregamento();

    this.simulacaoService.listarSimulacoes().subscribe({
      next: (simulacoes) => {
        const lista = Array.isArray(simulacoes) ? simulacoes : [];
        this.simulacoesCache = lista;
        this.totalRegistros = lista.length;
        this.totalGasto = lista.reduce((acc, item) => acc + this.extrairValorSimulacao(item), 0);
        this.montarGraficoCategoriasSimulacao(lista);
        this.montarGraficoUltimos7DiasSimulacao(lista);
        this.carregando = false;
      },
      error: (err) => {
        console.error('Erro ao carregar gráficos de simulação:', err);
        this.limparGraficos('Não foi possível carregar as simulações.', 'Sem dados de simulação.');
      }
    });
  }

  formatarMoeda(valor: number): string {
    return this.currencyPipe.transform(valor || 0, 'BRL', 'symbol', '1.2-2') || 'R$ 0,00';
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

  private iniciarCarregamento(): void {
    this.carregando = true;
    this.erro = '';
    this.totalRegistros = 0;
    this.totalGasto = 0;
    this.categorias = [];
    this.barrasUltimos7Dias = [];
    this.graficoPizzaStyle = 'conic-gradient(#1f3d35 0deg 360deg)';
    this.maiorCategoriaTexto = 'Carregando dados...';
  }

  private limparGraficos(mensagemErro: string, textoDestaque: string): void {
    this.carregando = false;
    this.erro = mensagemErro;
    this.totalRegistros = 0;
    this.totalGasto = 0;
    this.categorias = [];
    this.barrasUltimos7Dias = this.gerarDiasVazios();
    this.graficoPizzaStyle = 'conic-gradient(#1f3d35 0deg 360deg)';
    this.maiorCategoriaTexto = textoDestaque;
  }

  private montarGraficoCategoriasConsumo(consumos: ConsumoResponse[]): void {
    const mapaCategorias: Record<string, number> = {};

    for (const item of consumos) {
      const tipo = String(item.tipo || 'outros').toLowerCase();
      const valor = this.extrairValorConsumo(item);
      mapaCategorias[tipo] = (mapaCategorias[tipo] || 0) + valor;
    }

    this.aplicarCategoriasNoGrafico(mapaCategorias, 'Sem dados de consumo.');
  }

  private montarGraficoCategoriasSimulacao(simulacoes: SimulacaoResponse[]): void {
    const mapaCategorias: Record<string, number> = {};

    for (const item of simulacoes) {
      const tipo = String(item.tipo || 'outros').toLowerCase();
      const valor = this.extrairValorSimulacao(item);
      mapaCategorias[tipo] = (mapaCategorias[tipo] || 0) + valor;
    }

    this.aplicarCategoriasNoGrafico(mapaCategorias, 'Sem dados de simulação.');
  }

  private aplicarCategoriasNoGrafico(mapaCategorias: Record<string, number>, textoSemDados: string): void {
    const total = Object.values(mapaCategorias).reduce((acc, val) => acc + val, 0);
    const paleta: Record<string, string> = {
      energia: '#f5ea14',
      transporte: '#ff3c1f',
      agua: '#3ec7ff',
      alimentacao: '#63e06c',
      residuos: '#36d17c',
      produtos: '#c9a56b',
      outros: '#7ce0b3'
    };

    this.categorias = Object.entries(mapaCategorias)
      .map(([tipo, valor]) => ({
        label: this.labelCategoria(tipo),
        valor,
        porcentagem: total > 0 ? (valor / total) * 100 : 0,
        cor: paleta[tipo] || paleta['outros']
      }))
      .sort((a, b) => b.valor - a.valor);

    if (!this.categorias.length || total <= 0) {
      this.graficoPizzaStyle = 'conic-gradient(#1f3d35 0deg 360deg)';
      this.maiorCategoriaTexto = textoSemDados;
      return;
    }

    let acumulado = 0;
    const partes: string[] = [];

    for (const categoria of this.categorias) {
      const inicio = acumulado;
      acumulado += categoria.porcentagem;
      partes.push(`${categoria.cor} ${inicio}% ${acumulado}%`);
    }

    this.graficoPizzaStyle = `conic-gradient(${partes.join(', ')})`;
    const maior = this.categorias[0];
    this.maiorCategoriaTexto = `Maior foco: ${maior.label}, com ${maior.porcentagem.toFixed(1)}% do total.`;
  }

  private montarGraficoUltimos7DiasConsumo(consumos: ConsumoResponse[]): void {
    const dias = this.gerarDiasVazios();

    for (const dia of dias) {
      dia.valor = consumos
        .filter((item) => this.extrairDataConsumo(item) === dia['chave'])
        .reduce((acc, item) => acc + this.extrairValorConsumo(item), 0);
    }

    this.barrasUltimos7Dias = this.calcularAlturaBarras(dias);
  }

  private montarGraficoUltimos7DiasSimulacao(simulacoes: SimulacaoResponse[]): void {
    const dias = this.gerarDiasVazios();

    for (const dia of dias) {
      dia.valor = simulacoes
        .filter((item) => this.extrairDataSimulacao(item) === dia['chave'])
        .reduce((acc, item) => acc + this.extrairValorSimulacao(item), 0);
    }

    this.barrasUltimos7Dias = this.calcularAlturaBarras(dias);
  }

  private gerarDiasVazios(): Array<BarraSemana & { chave: string }> {
    const hoje = new Date();
    const dias: Array<BarraSemana & { chave: string }> = [];

    for (let i = 6; i >= 0; i--) {
      const data = new Date();
      data.setDate(hoje.getDate() - i);
      dias.push({
        chave: this.formatarDataChave(data),
        label: this.labelDiaSemana(data.getDay()),
        valor: 0,
        altura: 0
      });
    }

    return dias;
  }

  private calcularAlturaBarras(dias: Array<BarraSemana & { chave?: string }>): BarraSemana[] {
    const maiorValor = Math.max(...dias.map((dia) => dia.valor), 0);

    return dias.map((dia) => ({
      label: dia.label,
      valor: dia.valor,
      altura: maiorValor > 0 ? Math.max((dia.valor / maiorValor) * 100, dia.valor > 0 ? 8 : 0) : 0
    }));
  }

  private extrairValorConsumo(item: ConsumoResponse): number {
    const valor = item.gasto ?? item.valor ?? item.total ?? item.preco ?? 0;
    return this.normalizarNumero(valor);
  }

  private extrairValorSimulacao(item: SimulacaoResponse): number {
    const dados = item as SimulacaoResponse & Record<string, unknown>;
    const valor = dados['custo'] ?? dados['valor_calculado'] ?? dados['consumo_valor'] ?? dados['consumo'] ?? dados['total'] ?? 0;
    return this.normalizarNumero(valor);
  }

  private extrairDataConsumo(item: ConsumoResponse): string {
    return String(item.data || '').slice(0, 10);
  }

  private extrairDataSimulacao(item: SimulacaoResponse): string {
    const dados = item as SimulacaoResponse & Record<string, unknown>;
    return String(dados['data_registro'] || dados['created_at'] || dados['data'] || '').slice(0, 10);
  }

  private normalizarNumero(valor: unknown): number {
    if (typeof valor === 'number') return valor;
    if (typeof valor === 'string') return Number(valor.replace(',', '.')) || 0;
    return 0;
  }

  private formatarDataChave(data: Date): string {
    const yyyy = data.getFullYear();
    const mm = String(data.getMonth() + 1).padStart(2, '0');
    const dd = String(data.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private labelCategoria(tipo: string): string {
    const mapa: Record<string, string> = {
      energia: 'Energia',
      transporte: 'Transporte',
      agua: 'Água',
      alimentacao: 'Alimentação',
      residuos: 'Resíduos',
      produtos: 'Produtos',
      outros: 'Outros'
    };

    return mapa[tipo] || 'Outros';
  }

  private labelDiaSemana(dia: number): string {
    const mapa = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return mapa[dia];
  }
}
