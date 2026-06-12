import { Component, OnInit, OnDestroy, inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs';
import { TypingTextService } from '@shared/services/typing-text/typing-text.service';
import { AuthForm } from './auth-form/auth-form';

@Component({
  selector: 'app-login',
  imports: [AuthForm],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login implements OnInit, OnDestroy {

  private readonly router = inject(Router);
  private readonly typing = inject(TypingTextService);

  readonly typingText = this.typing.text;
  readonly typingComplete = this.typing.complete;

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  readonly showOverlay = computed(() => {
    const u = this.url();
    return u.startsWith('/login') || u.startsWith('/register');
  });

  readonly overlayMode = computed<'login' | 'register'>(() =>
    this.url().startsWith('/register') ? 'register' : 'login'
  );


  private readonly boot = `// INITIALISATION DU RESEAU D'ARCHIVES
// CONNEXION TERMINAL ETABLIE
// SYSTEME OPERATIONNEL `;

  ngOnInit(): void {
    this.typing.type(this.boot, 22);
  }

  ngOnDestroy(): void {
    this.typing.destroy();
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToVisitor(): void {
    this.router.navigate(['/accueil']);
  }

  onOverlayClose(): void {
    this.router.navigate(['/']);
  }

  onOverlayModeChange(mode: 'login' | 'register'): void {
    this.router.navigate(['/' + mode]);
  }
}
