import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Utilities {

  //============ FORMATAGE DATES ============

  formatPublishDate(date: string | Date | null): string {
    if (!date) {
      return 'Date non définie';
    }
    
    try {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return 'Date invalide';
      }
      return parsedDate.toLocaleDateString('fr-FR');
    } catch (error) {
      return 'Erreur de format';
    }
  }

  formatDetailDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatAccountDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  //============ VALIDATION FORMULAIRES ============

  isEmailValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  isPasswordValid(password: string): boolean {
    return password.length >= 8 && /[A-Z]/.test(password);
  }

  isUsernameValid(username: string): boolean {
    return username.trim().length >= 3;
  }

  //============ GÉNÉRATION SLUG ============

  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[àáâäãåā]/g, 'a')
      .replace(/[èéêëēė]/g, 'e')
      .replace(/[ìíîïīį]/g, 'i')
      .replace(/[òóôöõøō]/g, 'o')
      .replace(/[ùúûüūų]/g, 'u')
      .replace(/[ÿý]/g, 'y')
      .replace(/[ñń]/g, 'n')
      .replace(/[ç]/g, 'c')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  //============ GESTION AVATARS ============

  getAvatarUrl(avatar: string | null | undefined): string {
    return avatar ? `http://localhost:3000${avatar}` : '';
  }

  isValidImageFile(file: File): boolean {
    return file.type.startsWith('image/') && file.size <= 500 * 1024; // 500KB max
  }

  //============ MANIPULATION TEXTE ============

  truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  sanitizeHtml(html: string): string {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  //============ UTILITAIRES NAVIGATION ============

  isCurrentRoute(url: string, route: string): boolean {
    return url.includes(route);
  }

  //============ GESTION FICHIERS ============

  downloadAsJson(data: any, filename: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  //============ CONSTANTES ============

  readonly API_BASE_URL = 'http://localhost:3000';
  readonly MAX_FILE_SIZE = 500 * 1024; // 500KB
  readonly MIN_PASSWORD_LENGTH = 8;
  readonly MIN_USERNAME_LENGTH = 3;
}