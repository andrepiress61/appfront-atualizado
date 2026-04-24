import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router } from '@angular/router';

type MenuKey = 'menu' | 'perfil' | 'consumo' | 'graficos' | 'simulacao' | 'mapa';

interface MenuItem {
  key: MenuKey;
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-side-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.css']
})
export class SideMenuComponent {
  private router = inject(Router);

  @Input() active: MenuKey = 'menu';
  @Input() menuAberto = false;
  @Output() menuAbertoChange = new EventEmitter<boolean>();

  itens: MenuItem[] = [
    { key: 'menu', label: 'Início', route: '/menu', icon: 'home' },
    { key: 'perfil', label: 'Perfil', route: '/perfil', icon: 'user' },
    { key: 'consumo', label: 'Consumo', route: '/consumo', icon: 'file' },
    { key: 'graficos', label: 'Gráficos', route: '/graficos', icon: 'chart' },
    { key: 'simulacao', label: 'Simulação', route: '/simulacao', icon: 'zap' },
    { key: 'mapa', label: 'Mapa', route: '/mapa', icon: 'map' }
  ];

  abrir(): void {
    this.menuAberto = true;
    this.menuAbertoChange.emit(true);
  }

  fechar(): void {
    this.menuAberto = false;
    this.menuAbertoChange.emit(false);
  }

  navegar(item: MenuItem): void {
    this.router.navigate([item.route]);
    this.fechar();
  }
}
