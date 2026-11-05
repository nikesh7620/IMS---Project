import { DOCUMENT } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

/* ------------------------------------------------------------------ */
/* Models and constants                                                */
/* ------------------------------------------------------------------ */

export interface Country {
  iso: string;
  dial: string;
  name: string;
}

export interface CandidateFormValue {
  firstName: string;
  lastName: string;
  email: string;
  phoneCode: string;
  phone: string;
  altPhoneCode: string;
  altPhone: string;
  dob: string; // ISO date, yyyy-MM-dd
  gender: string;
  currentPosition: string;
  experience: string;
  noticePeriod: string;
  currentCtc: string;
  position: string;
  source: string;
  appliedOn: string; // ISO date, yyyy-MM-dd
  comments: string;
}

export interface CandidatePayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  alternatePhone: string;
  dateOfBirth: string;
  gender: string;
  currentPosition: string;
  experience: string;
  noticePeriod: string;
  currentCtc: number | null;
  position: string;
  source: string;
  appliedOn: string;
  comments: string;
  resume: File | null;
}

export type FieldName =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'altPhone'
  | 'currentCtc'
  | 'position'
  | 'source'
  | 'appliedOn'
  | 'comments';

export const COUNTRIES: Country[] = [
  { iso: 'IN', dial: '+91', name: 'India' },
  { iso: 'US', dial: '+1', name: 'United States' },
  { iso: 'GB', dial: '+44', name: 'United Kingdom' },
  { iso: 'AE', dial: '+971', name: 'United Arab Emirates' },
  { iso: 'AU', dial: '+61', name: 'Australia' },
];

export const PHONE_PATTERN = /^\d{7,15}$/;
export const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;
export const MAX_COMMENTS = 500;
export const MAX_RESUME_BYTES = 5 * 1024 * 1024;
export const RESUME_EXTENSIONS = ['pdf', 'doc', 'docx'];

/* TODO: load these lists from the API. They match the list page's sample data. */
export const POSITIONS = ['Software Developer', 'UI/UX Designer', 'QA Engineer', 'Business Analyst', 'DevOps Engineer'];
export const SOURCES = ['LinkedIn', 'Naukri.com', 'Referral', 'Company Website'];
export const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];
export const EXPERIENCES = ['Fresher', '0-1 years', '1-3 years', '3-5 years', '5-8 years', '8-12 years', '12+ years'];
export const NOTICE_PERIODS = ['Immediate', '15 days', '30 days', '45 days', '60 days', '90 days'];

const PATTERN_MESSAGES: Partial<Record<FieldName, string>> = {
  phone: 'Enter a valid phone number',
  altPhone: 'Enter a valid phone number',
  currentCtc: 'Enter a valid amount',
};

/* ------------------------------------------------------------------ */
/* Pure helpers (exported so they can be unit-tested directly)         */
/* ------------------------------------------------------------------ */

/** Returns an error message for a resume that is not allowed, or '' when it is fine. */
export function validateResume(file: Pick<File, 'name' | 'size'>): string {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!RESUME_EXTENSIONS.includes(extension)) {
    return 'Only PDF, DOC or DOCX files are allowed.';
  }
  if (file.size > MAX_RESUME_BYTES) {
    return 'The file is larger than 5MB.';
  }
  return '';
}

/** 1536 -> "1.5 KB" */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Today as yyyy-MM-dd in the local time zone (used as the max for date inputs). */
export function todayIso(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** The data sent to the API when the form is saved. */
export function buildPayload(value: CandidateFormValue, resume: File | null): CandidatePayload {
  const trimmed = (text: string) => text.trim();
  return {
    firstName: trimmed(value.firstName),
    lastName: trimmed(value.lastName),
    email: trimmed(value.email),
    phone: `${value.phoneCode} ${value.phone}`,
    alternatePhone: value.altPhone ? `${value.altPhoneCode} ${value.altPhone}` : '',
    dateOfBirth: value.dob,
    gender: value.gender,
    currentPosition: trimmed(value.currentPosition),
    experience: value.experience,
    noticePeriod: value.noticePeriod,
    currentCtc: value.currentCtc ? Number(value.currentCtc) : null,
    position: value.position,
    source: value.source,
    appliedOn: value.appliedOn,
    comments: trimmed(value.comments),
    resume,
  };
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

@Component({
  selector: 'app-add-candidate',
  imports: [ReactiveFormsModule, RouterLink, RouterLinkActive],
  templateUrl: './add-candidate.html',
  styleUrl: './add-candidate.css',
})
export class AddCandidate {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly countries = COUNTRIES;
  readonly positions = POSITIONS;
  readonly sources = SOURCES;
  readonly genders = GENDERS;
  readonly experiences = EXPERIENCES;
  readonly noticePeriods = NOTICE_PERIODS;
  readonly maxComments = MAX_COMMENTS;
  readonly today = todayIso();

  /* ---- shell (sidebar and header) ---- */
  // TODO: replace with the auth and notification services once they exist.
  readonly user = {
    name: 'Nikesh Mali',
    role: 'HR Manager',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  };
  readonly notificationCount = 6;
  readonly sidebarOpen = signal((this.document.defaultView?.innerWidth ?? 1200) > 900);

  /* ---- form ---- */
  readonly form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneCode: ['+91'],
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    altPhoneCode: ['+91'],
    altPhone: ['', Validators.pattern(PHONE_PATTERN)],
    dob: [''],
    gender: [''],
    currentPosition: [''],
    experience: [''],
    noticePeriod: [''],
    currentCtc: ['', Validators.pattern(AMOUNT_PATTERN)],
    position: ['', Validators.required],
    source: ['', Validators.required],
    appliedOn: ['', Validators.required],
    comments: ['', Validators.maxLength(MAX_COMMENTS)],
  });

  /* ---- state ---- */
  readonly submitted = signal(false);
  readonly resume = signal<File | null>(null);
  readonly resumeError = signal('');
  readonly dragOver = signal(false);
  /** TODO: replace with a call to the Candidates API (send the resume as multipart form data). */
  readonly submittedPayload = signal<CandidatePayload | null>(null);

  /* ---- shell ---- */
  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  /* ---- validation ---- */
  invalid(name: FieldName): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || this.submitted());
  }

  errorFor(name: FieldName): string {
    const errors = this.form.controls[name].errors;
    if (!errors) return '';
    if (errors['required']) return 'This field is required';
    if (errors['email']) return 'Enter a valid email address';
    if (errors['pattern']) return PATTERN_MESSAGES[name] ?? 'Invalid value';
    if (errors['maxlength']) return `Keep this under ${MAX_COMMENTS} characters`;
    return 'Invalid value';
  }

  /* ---- phone flags ---- */
  country(dial: string): Country | undefined {
    return this.countries.find((c) => c.dial === dial);
  }

  /** India's flag is drawn in CSS; other countries show their ISO code. */
  flagText(dial: string): string {
    const iso = this.country(dial)?.iso ?? '';
    return iso === 'IN' ? '' : iso;
  }

  /* ---- resume upload ---- */
  onResumePicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.setResume(input.files?.[0] ?? null);
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  onDragLeave(): void {
    this.dragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    this.setResume(event.dataTransfer?.files?.[0] ?? null);
  }

  removeResume(): void {
    this.resume.set(null);
    this.resumeError.set('');
  }

  fileSize(bytes: number): string {
    return formatFileSize(bytes);
  }

  private setResume(file: File | null): void {
    if (!file) return;
    const error = validateResume(file);
    this.resumeError.set(error);
    this.resume.set(error ? null : file);
  }

  /* ---- save ---- */
  save(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }
    this.submittedPayload.set(buildPayload(this.form.getRawValue(), this.resume()));
    void this.router.navigate(['/candidates']);
  }
}