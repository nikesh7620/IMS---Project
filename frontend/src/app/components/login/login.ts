import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {

  employeeId = '';
  password = '';
  rememberMe = false;

  showPassword = false;
  selectedLanguage = 'English';

  isLoading = false;
  errorMessage = '';

  languages = ['English', 'Afrikaans', 'Zulu'];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  login(): void {

    this.errorMessage = '';

    if (!this.employeeId.trim()) {
      this.errorMessage = 'Please enter your Employee ID.';
      return;
    }

    if (!this.password.trim()) {
      this.errorMessage = 'Please enter your Password.';
      return;
    }

    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    this.authService.login(
      this.employeeId.trim(),
      this.password
    ).subscribe({
      next: (response) => {

        this.authService.saveSession(
          response,
          this.rememberMe
        );

        this.isLoading = false;

        this.router.navigate(['/dashboard']);
      },

      error: (error) => {

        this.isLoading = false;

        this.errorMessage =
          error.error?.message ||
          'Unable to login. Please try again.';
      }
    });
  }

  forgotPassword(): void {
    alert('Forgot Password functionality will be implemented.');
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}