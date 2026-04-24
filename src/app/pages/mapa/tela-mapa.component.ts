import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../core/auth.service';
import { MapaService, PontoReciclagem } from '../../services/mapa.service';
import { SideMenuComponent } from '../../shared/side-menu/side-menu.component';

@Component({
  selector: 'app-tela-mapa',
  standalone: true,
  imports: [CommonModule, SideMenuComponent],
  templateUrl: './tela-mapa.component.html',
  styleUrls: ['./tela-mapa.component.css']
})
export class TelaMapaComponent implements OnInit {
  private mapaService = inject(MapaService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  menuAberto = false;
  carregando = false;
  erro = '';
  usuarioNome = 'Usuário';

  pontos: PontoReciclagem[] = [];

  // Fallback: pontos hardcoded caso a API não retorne nada
  private pontosFallback: PontoReciclagem[] = [
    { latitude: -15.791459, longitude: -47.8990381, tipos_aceitos: ['vidro', 'papel'] },
    { latitude: -15.8052963, longitude: -47.9173675, tipos_aceitos: ['vidro', 'papel'] },
    { latitude: -15.8091535, longitude: -47.923036, tipos_aceitos: ['vidro', 'papel'] }
  ];

  ngOnInit(): void {
    this.usuarioNome = this.authService.getUsuarioNome();
    this.carregarPontos();
  }

  carregarPontos(): void {
    this.carregando = true;
    this.erro = '';

    this.mapaService.listarPontosReciclagem().subscribe({
      next: (pontos) => {
        this.pontos = pontos?.length ? pontos : this.pontosFallback;
        this.carregando = false;
      },
      error: () => {
        this.pontos = this.pontosFallback;
        this.carregando = false;
      }
    });
  }

  irComoChegar(lat: number, lon: number): void {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
    window.open(url, '_blank');
  }

  getTiposAceitos(ponto: PontoReciclagem): string {
    const tipos = ponto.tipos_aceitos || ponto.tipos || [];
    return tipos.length ? tipos.join(', ') : 'Não informado';
  }

  getNomePonto(ponto: PontoReciclagem, index: number): string {
    return ponto.nome || `Ponto de Reciclagem ${index + 1}`;
  }

  getMapaUrl(): SafeResourceUrl {
    if (!this.pontos.length) return this.sanitizer.bypassSecurityTrustResourceUrl('');
    const lat = this.pontos[0].latitude;
    const lng = this.pontos[0].longitude;
    // OpenStreetMap embed — sem necessidade de chave de API
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.02},${lat - 0.02},${lng + 0.02},${lat + 0.02}&layer=mapnik&marker=${lat},${lng}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  abrirMenu(): void { this.menuAberto = true; }
  fecharMenu(): void { this.menuAberto = false; }

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
}
