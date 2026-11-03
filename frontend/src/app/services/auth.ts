import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface Employee {
  employeeId: number;
  empCode: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  status: string;
  message: string;
  token: string;
  employee: Employee;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:3000/api/auth';

  constructor(private http: HttpClient) {}

  login(employeeId: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login`,
      { employeeId, password }
    );
  }

  saveSession(response: LoginResponse, rememberMe: boolean): void {
    const storage = rememberMe ? localStorage : sessionStorage;

    storage.setItem('ims_token', response.token);
    storage.setItem('ims_employee', JSON.stringify(response.employee));
  }

  getToken(): string | null {
    return sessionStorage.getItem('ims_token')
      || localStorage.getItem('ims_token');
  }

  getEmployee(): Employee | null {
    const employeeData = sessionStorage.getItem('ims_employee')
      || localStorage.getItem('ims_employee');

    return employeeData ? JSON.parse(employeeData) as Employee : null;
  }

  logout(): void {
    sessionStorage.removeItem('ims_token');
    sessionStorage.removeItem('ims_employee');

    localStorage.removeItem('ims_token');
    localStorage.removeItem('ims_employee');
  }
}