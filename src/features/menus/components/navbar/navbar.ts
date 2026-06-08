import { Component, inject, computed, signal, HostListener, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@features/auth/services/auth.service';
import { SearchFiltersService } from '@features/search/services/search-filters.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './navbar.scss'
})
export class Navbar {

  private readonly auth = inject(AuthService);
  private readonly el = inject(ElementRef);
  protected readonly filters = inject(SearchFiltersService);

  readonly user = this.auth.currentUser;
  readonly isLoggedIn = this.auth.isLoggedIn;
  readonly isAdmin = this.auth.isAdmin;
  readonly menuOpen = signal(false);

  readonly avatarUrl = computed(() => {
    const u = this.user();
    if (!u?.avatar) return null;
    return `http://localhost:3000${u.avatar}`;
  });

  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.menuOpen.update(v => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  logout(): void {
    this.menuOpen.set(false);
    this.auth.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node;
    if (!(this.el.nativeElement as HTMLElement).contains(target)) {
      this.menuOpen.set(false);
    }
  }
}
