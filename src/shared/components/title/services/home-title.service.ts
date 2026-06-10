import { Service, signal } from '@angular/core';

@Service()
export class HomeTitleService {

  //======= SIGNALS =======

  private _title1 = "Salut Gros Têtard !";
  private _title2 = "Bienvenue dans l'Antre";
  
  private _currentTitle = signal<string>('');
  private _showTitle1 = signal<boolean>(false);
  private _showTitle2 = signal<boolean>(false);
  private _fadeOutTitle1 = signal<boolean>(false);
  private _isActive = signal<boolean>(false);

  //======= READONLY =======

  readonly currentTitle = this._currentTitle.asReadonly();
  readonly showTitle1 = this._showTitle1.asReadonly();
  readonly showTitle2 = this._showTitle2.asReadonly();
  readonly fadeOutTitle1 = this._fadeOutTitle1.asReadonly();
  readonly isActive = this._isActive.asReadonly();

  //======= METHODS =======

  startSequence(): void {
    this._isActive.set(true);
    this._showTitle1.set(true);
    this._showTitle2.set(false);
    this._fadeOutTitle1.set(false);
    this._currentTitle.set(this._title1);

    setTimeout(() => {
      this._fadeOutTitle1.set(true);
      
      setTimeout(() => {
        this._showTitle1.set(false);
        this._showTitle2.set(true);
        this._currentTitle.set(this._title2);
      }, 600);
    }, 5000);
  }

  stop(): void {
    this._isActive.set(false);
    this._showTitle1.set(false);
    this._showTitle2.set(false);
    this._fadeOutTitle1.set(false);
    this._currentTitle.set('');
  }
}