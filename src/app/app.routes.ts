import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/tela-login.component').then(m => m.TelaLoginComponent)
  },
  {
    path: 'cadastro',
    loadComponent: () =>
      import('./pages/usuario/cadastro-usuario.component').then(m => m.CadastroUsuarioComponent)
  },
  {
    path: 'menu',
    loadComponent: () =>
      import('./pages/menu/tela-menu.component').then(m => m.TelaMenuComponent)
  },
  {
    path: 'perfil',
    loadComponent: () =>
      import('./pages/perfil/tela-perfil.component').then(m => m.TelaPerfilComponent)
  },
  {
    path: 'consumo',
    loadComponent: () =>
      import('./pages/consumo/tela-consumo.component').then(m => m.TelaConsumoComponent)
  },
  {
    path: 'graficos',
    loadComponent: () =>
      import('./pages/graficos/tela-graficos.component').then(m => m.TelaGraficosComponent)
  },
  {
    path: 'simulacao',
    loadComponent: () =>
      import('./pages/simulacao/tela-simulacao.component').then(m => m.TelaSimulacaoComponent)
  },
  {
    path: 'mapa',
    loadComponent: () =>
      import('./pages/mapa/tela-mapa.component').then(m => m.TelaMapaComponent)
  },
  {
    path: 'chat',
    redirectTo: 'menu',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'menu'
  }
];
