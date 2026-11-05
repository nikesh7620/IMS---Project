import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import {
  AddCandidate,
  CandidateFormValue,
  buildPayload,
  formatFileSize,
  todayIso,
  validateResume,
} from './add-candidate';

/* ---------- helpers ---------- */
const normalise = (el: Element | null) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

const emptyValue: CandidateFormValue = {
  firstName: '',
  lastName: '',
  email: '',
  phoneCode: '+91',
  phone: '',
  altPhoneCode: '+91',
  altPhone: '',
  dob: '',
  gender: '',
  currentPosition: '',
  experience: '',
  noticePeriod: '',
  currentCtc: '',
  position: '',
  source: '',
  appliedOn: '',
  comments: '',
};

describe('validateResume', () => {
  it('accepts PDF, DOC and DOCX up to 5MB', () => {
    expect(validateResume({ name: 'cv.pdf', size: 1000 })).toBe('');
    expect(validateResume({ name: 'CV.DOCX', size: 5 * 1024 * 1024 })).toBe('');
    expect(validateResume({ name: 'cv.doc', size: 10 })).toBe('');
  });

  it('rejects other file types and large files', () => {
    expect(validateResume({ name: 'photo.png', size: 10 })).toBe('Only PDF, DOC or DOCX files are allowed.');
    expect(validateResume({ name: 'cv', size: 10 })).toBe('Only PDF, DOC or DOCX files are allowed.');
    expect(validateResume({ name: 'cv.pdf', size: 5 * 1024 * 1024 + 1 })).toBe('The file is larger than 5MB.');
  });
});

describe('formatFileSize', () => {
  it('uses B, KB and MB', () => {
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(2 * 1024 * 1024)).toBe('2.0 MB');
  });
});

describe('todayIso', () => {
  it('formats the local date as yyyy-MM-dd', () => {
    expect(todayIso(new Date(2024, 4, 9))).toBe('2024-05-09');
  });
});

describe('buildPayload', () => {
  it('trims text, joins phone codes and converts the CTC to a number', () => {
    const payload = buildPayload(
      {
        ...emptyValue,
        firstName: ' Ann ',
        lastName: 'Lee ',
        email: ' ann@example.com ',
        phoneCode: '+91',
        phone: '9876543210',
        altPhoneCode: '+1',
        altPhone: '5551234567',
        currentCtc: '850000.50',
      },
      null,
    );
    expect(payload.firstName).toBe('Ann');
    expect(payload.lastName).toBe('Lee');
    expect(payload.email).toBe('ann@example.com');
    expect(payload.phone).toBe('+91 9876543210');
    expect(payload.alternatePhone).toBe('+1 5551234567');
    expect(payload.currentCtc).toBe(850000.5);
    expect(payload.resume).toBeNull();
  });

  it('leaves the alternate phone and CTC empty when they are not filled in', () => {
    const payload = buildPayload(emptyValue, null);
    expect(payload.alternatePhone).toBe('');
    expect(payload.currentCtc).toBeNull();
  });
});

describe('AddCandidate', () => {
  let fixture: ComponentFixture<AddCandidate>;
  let component: AddCandidate;
  let el: HTMLElement;
  let navigated: unknown[] | null;

  const errors = () => Array.from(el.querySelectorAll('.field-error')).map((e) => normalise(e));

  const setValue = (selector: string, value: string, eventName: 'input' | 'change' = 'input') => {
    const control = el.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(selector)!;
    control.value = value;
    control.dispatchEvent(new Event(eventName));
    fixture.detectChanges();
  };

  const submit = () => {
    el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  const fillRequired = () => {
    setValue('#first-name', 'Ann');
    setValue('#last-name', 'Lee');
    setValue('#email', 'ann@example.com');
    setValue('#phone', '9876543210');
    setValue('#position', 'QA Engineer', 'change');
    setValue('#source', 'Referral', 'change');
    setValue('#applied-on', '2024-05-14');
  };

  const pickFile = (file: File) => {
    const input = el.querySelector<HTMLInputElement>('#resume-file')!;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCandidate],
      providers: [provideRouter([])],
    }).compileComponents();

    const router = TestBed.inject(Router);
    navigated = null;
    router.navigate = ((commands: unknown[]) => {
      navigated = commands;
      return Promise.resolve(true);
    }) as Router['navigate'];

    fixture = TestBed.createComponent(AddCandidate);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  describe('layout', () => {
    it('creates the component', () => {
      expect(component).toBeTruthy();
    });

    it('shows the page title, the user and the sidebar links', () => {
      expect(normalise(el.querySelector('.topbar__title'))).toBe('Add Candidate');
      expect(normalise(el.querySelector('.topbar__user'))).toContain('Nikesh Mali');
      expect(el.querySelectorAll('.sidebar__nav .nav-link').length).toBe(9);
    });

    it('links back to the candidate list', () => {
      const back = el.querySelector<HTMLAnchorElement>('.back-link')!;
      expect(normalise(back)).toBe('Back to Candidate List');
      expect(back.getAttribute('href')).toBe('/candidates');
    });

    it('toggles the sidebar from the menu button', () => {
      const wasOpen = component.sidebarOpen();
      el.querySelector<HTMLButtonElement>('.topbar__menu')!.click();
      fixture.detectChanges();
      expect(component.sidebarOpen()).toBe(!wasOpen);
    });
  });

  describe('form', () => {
    it('renders the three sections and the action buttons', () => {
      const titles = Array.from(el.querySelectorAll('.section__title')).map((t) => normalise(t));
      expect(titles).toEqual(['Candidate Information', 'Application Details', 'Additional Information']);
      expect(normalise(el.querySelector('.btn--neutral'))).toBe('Cancel');
      expect(normalise(el.querySelector('button[type="submit"]'))).toBe('Save Candidate');
    });

    it('shows the candidate ID as read-only and auto generated', () => {
      const id = el.querySelector<HTMLInputElement>('#candidate-id')!;
      expect(id.readOnly).toBe(true);
      expect(id.value).toBe('Auto generated');
    });

    it('shows no errors before the form is submitted', () => {
      expect(errors()).toEqual([]);
    });

    it('lists every required field after saving an empty form', () => {
      submit();
      expect(errors().length).toBe(7);
      expect(errors().every((e) => e === 'This field is required')).toBe(true);
      expect(navigated).toBeNull();
      expect(component.submittedPayload()).toBeNull();
    });

    it('marks invalid fields for assistive technology', () => {
      submit();
      const first = el.querySelector('#first-name')!;
      expect(first.getAttribute('aria-invalid')).toBe('true');
      expect(first.getAttribute('aria-describedby')).toBe('first-name-error');
      expect(el.querySelector('#first-name-error')).not.toBeNull();
    });

    it('validates the email, phone and CTC formats', () => {
      fillRequired();
      setValue('#email', 'not-an-email');
      setValue('#phone', '12ab');
      setValue('#current-ctc', 'lots');
      submit();
      expect(errors()).toEqual(['Enter a valid email address', 'Enter a valid phone number', 'Enter a valid amount']);
      expect(navigated).toBeNull();
    });

    it('treats the alternate phone as optional but checks it when filled in', () => {
      fillRequired();
      submit();
      expect(navigated).toEqual(['/candidates']);

      navigated = null;
      setValue('#alt-phone', '12');
      submit();
      expect(errors()).toEqual(['Enter a valid phone number']);
      expect(navigated).toBeNull();
    });

    it('saves a valid form and returns to the candidate list', () => {
      fillRequired();
      setValue('#phone-code', '+44', 'change');
      setValue('#current-ctc', '850000');
      setValue('#comments', 'Strong referral');
      submit();

      const payload = component.submittedPayload()!;
      expect(payload.firstName).toBe('Ann');
      expect(payload.phone).toBe('+44 9876543210');
      expect(payload.position).toBe('QA Engineer');
      expect(payload.source).toBe('Referral');
      expect(payload.appliedOn).toBe('2024-05-14');
      expect(payload.currentCtc).toBe(850000);
      expect(payload.comments).toBe('Strong referral');
      expect(navigated).toEqual(['/candidates']);
    });

    it('counts the characters typed into the comments box', () => {
      expect(normalise(el.querySelector('.counter'))).toBe('0 / 500');
      setValue('#comments', 'Hello');
      expect(normalise(el.querySelector('.counter'))).toBe('5 / 500');
    });

    it('shows the selected country code on the flag', () => {
      expect(el.querySelector('#phone')!.closest('.phone')!.querySelector('.flag')!.getAttribute('data-iso')).toBe('IN');
      setValue('#phone-code', '+971', 'change');
      const flag = el.querySelector('#phone')!.closest('.phone')!.querySelector('.flag')!;
      expect(flag.getAttribute('data-iso')).toBe('AE');
      expect(normalise(flag)).toBe('AE');
    });
  });

  describe('resume upload', () => {
    it('accepts a PDF and shows its name, size and a Remove button', () => {
      pickFile(new File(['x'.repeat(2048)], 'cv.pdf', { type: 'application/pdf' }));
      expect(normalise(el.querySelector('.file-chip'))).toContain('cv.pdf');
      expect(normalise(el.querySelector('.file-chip'))).toContain('2.0 KB');
      expect(el.querySelector('.upload')).toBeNull();
      expect(component.resume()?.name).toBe('cv.pdf');
    });

    it('rejects an unsupported file and keeps the upload box', () => {
      pickFile(new File(['x'], 'photo.png', { type: 'image/png' }));
      expect(component.resume()).toBeNull();
      expect(normalise(el.querySelector('.upload-error'))).toBe('Only PDF, DOC or DOCX files are allowed.');
      expect(el.querySelector('.upload')).not.toBeNull();
    });

    it('removes the chosen file', () => {
      pickFile(new File(['x'], 'cv.docx'));
      el.querySelector<HTMLButtonElement>('.file-chip button')!.click();
      fixture.detectChanges();
      expect(component.resume()).toBeNull();
      expect(el.querySelector('.upload')).not.toBeNull();
    });

    it('sends the chosen resume with the saved candidate', () => {
      fillRequired();
      pickFile(new File(['x'], 'cv.pdf'));
      submit();
      expect(component.submittedPayload()!.resume?.name).toBe('cv.pdf');
    });
  });
});