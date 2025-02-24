import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
    selector: 'app-navbar',
    imports: [CommonModule, RouterLink, RouterLinkActive],
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  isMenuOpen = false;  // Variable pour gérer l'état d'ouverture du menu
  isMobile = false;    // Variable pour détecter si c'est un écran mobile

  constructor() {
    this.detectMobile();  // Détecte si l'écran est mobile à l'initialisation
  }

  // Fonction pour basculer l'état du menu
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  // Fonction pour fermer le menu mobile
  closeMenu() {
    this.isMenuOpen = false;
  }

  // Fonction pour détecter si l'écran est de taille mobile
  detectMobile() {
    if (window.innerWidth <= 768) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  // Ajoute un listener pour détecter le redimensionnement de la fenêtre
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.isMobile = event.target.innerWidth <= 768;
  }
}