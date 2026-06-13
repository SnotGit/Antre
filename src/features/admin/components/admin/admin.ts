import { Component, inject, computed, resource } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService } from '@shared/services/auth/auth.service';

//========== TYPES ==========//

interface AdminStats {
  users: number;
  admins: number;
  online: number;
  stories: number;
  categories: number;
  items: number;
  uploadsBytes: number;
  lastBackup: string | null;
}

interface StatsResponse {
  stats: AdminStats;
}

interface AdminTile {
  label: string;
  description: string;
  route: string | null;
}

//========== COMPONENT ==========//

@Component({
  selector: 'app-admin',
  imports: [DatePipe],
  templateUrl: './admin.html',
  styleUrl: './admin.scss'
})
export class Admin {

  //========== INJECTIONS ==========//

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  //========== SIGNALS ==========//

  protected readonly isAdmin = this.auth.isAdmin;

  //========== DATA ==========//

  private readonly statsResource = resource({
    loader: () => firstValueFrom(
      this.http.get<StatsResponse>(`${environment.apiUrl}/admin/stats`)
    ).then(r => r.stats)
  });

  protected readonly stats = computed(() => this.statsResource.value() ?? null);

  //========== TILES ==========//

  protected readonly tiles: AdminTile[] = [
    { label: 'Dépôt', description: 'Upload groupé des items via Elena', route: '/admin/depot' },
    { label: 'Review', description: 'Fichiers en attente d\'arbitrage', route: null },
    { label: 'Logs', description: 'Connexions, comptes, actions admin', route: null },
    { label: 'Utilisateurs', description: 'Rôles et gestion des comptes', route: null },
    { label: 'Sauvegardes', description: 'Dumps de la base de données', route: null },
    { label: 'Paramétrages', description: 'Citations et réglages d\'Elena', route: null }
  ];

  //========== ACTIONS ==========//

  protected open(tile: AdminTile): void {
    if (tile.route) this.router.navigate([tile.route]);
  }

  protected formatBytes(bytes: number): string {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} Go`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
    return `${Math.round(bytes / 1024)} Ko`;
  }
}
