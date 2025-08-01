import { Injectable, signal, computed } from '@angular/core';

type MenuType = 'navbar' | 'console' | null;

@Injectable({
  providedIn: 'root'
})
export class MobileMenuService {
  
  //============ ÉTAT CENTRAL ============
  
  private _activeMenu = signal<MenuType>(null);
  
  //============ COMPUTED PUBLICS ============
  
  activeMenu = this._activeMenu.asReadonly();
  
  isNavbarOpen = computed(() => this._activeMenu() === 'navbar');
  isConsoleOpen = computed(() => this._activeMenu() === 'console');
  
  //============ DEBUG (temporaire) ============
  
  debug(): void {
    console.log('MobileMenuService State:', {
      activeMenu: this._activeMenu(),
      isNavbarOpen: this.isNavbarOpen(),
      isConsoleOpen: this.isConsoleOpen()
    });
  }
  
  //============ ACTIONS ============
  
  openNavbar(): void {
    this._activeMenu.set('navbar');
    this.saveState();
  }
  
  openConsole(): void {
    this._activeMenu.set('console');
    this.saveState();
  }
  
  closeAll(): void {
    this._activeMenu.set(null);
    this.saveState();
  }
  
  toggleNavbar(): void {
    if (this._activeMenu() === 'navbar') {
      this.closeAll();
    } else {
      this.openNavbar();
    }
  }
  
  toggleConsole(): void {
    if (this._activeMenu() === 'console') {
      this.closeAll();
    } else {
      this.openConsole();
    }
  }
  
  //============ PERSISTENCE ============
  
  private readonly STORAGE_KEY = 'mobile-menu-state';
  
  constructor() {
    this._activeMenu.set(null);
  }
  
  private loadState(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved && ['navbar', 'console'].includes(saved)) {
      this._activeMenu.set(saved as MenuType);
    }
  }
  
  private saveState(): void {
    const current = this._activeMenu();
    if (current) {
      localStorage.setItem(this.STORAGE_KEY, current);
    } else {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }
}