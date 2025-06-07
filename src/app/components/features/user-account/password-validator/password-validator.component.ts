import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-password-validator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './password-validator.component.html',
  styleUrl: './password-validator.component.scss'
})
export class PasswordValidatorComponent {
  password = input<string>('');

  availableCharsText = 'Caractères spéciaux disponibles : @ # $ % ^ & * ! ? + - = _';

  hasMinLength = computed(() => this.password().length >= 8);
  hasUppercase = computed(() => /[A-Z]/.test(this.password()));
  
  isValid = computed(() => this.hasMinLength() && this.hasUppercase());
}