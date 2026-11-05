import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Candidate, Candidates, buildCsv, buildPageItems } from './candidates';

/* ---------- helpers ---------- */
const normalise = (el: Element | null) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

describe('buildPageItems', () => {
  it('shows every page when there are seven or fewer', () => {
    expect(buildPageItems(1, 1)).toEqual([1]);
    expect(buildPageItems(2, 3)).toEqual([1, 2, 3]);
    expect(buildPageItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('collapses the tail near the start (1 2 3 4 5 … 13)', () => {
    expect(buildPageItems(1, 13)).toEqual([1, 2, 3, 4, 5, '…', 13]);
    expect(buildPageItems(4, 13)).toEqual([1, 2, 3, 4, 5, '…', 13]);
  });

  it('collapses both sides in the middle', () => {
    expect(buildPageItems(7, 13)).toEqual([1, '…', 6, 7, 8, '…', 13]);
  });

  it('collapses the head near the end', () => {
    expect(buildPageItems(13, 13)).toEqual([1, '…', 9, 10, 11, 12, 13]);
  });
});

describe('buildCsv', () => {
  it('writes a header and escapes commas and quotes', () => {
    const rows: Candidate[] = [
      {
        id: 1,
        code: 'CAND-00001',
        name: 'Ann "A" Lee',
        position: 'QA, Lead',
        source: 'Referral',
        appliedOn: '2024-05-01',
        status: 'New',
      },
    ];
    const lines = buildCsv(rows).split('\r\n');
    expect(lines[0]).toBe('Candidate ID,Name,Position,Source,Applied On,Status');
    expect(lines[1]).toBe('CAND-00001,"Ann ""A"" Lee","QA, Lead",Referral,2024-05-01,New');
  });
});

describe('Candidates', () => {
  let fixture: ComponentFixture<Candidates>;
  let component: Candidates;
  let el: HTMLElement;

  const rows = () => Array.from(el.querySelectorAll<HTMLTableRowElement>('tbody tr.row'));
  const summary = () => normalise(el.querySelector('.summary'));
  const rowCodes = () => rows().map((r) => normalise(r.querySelector('.code-link')));

  const typeInto = (selector: string, value: string) => {
    const input = el.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const pick = (selector: string, value: string) => {
    const select = el.querySelector<HTMLSelectElement>(selector)!;
    select.value = value;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Candidates],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Candidates);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  describe('initial view', () => {
    it('creates the component', () => {
      expect(component).toBeTruthy();
    });

    it('shows the first 10 of 125 entries, newest ID first', () => {
      expect(rows().length).toBe(10);
      expect(summary()).toBe('Showing 1 to 10 of 125 entries');
      expect(rowCodes()[0]).toBe('CAND-00125');
      expect(rowCodes()[9]).toBe('CAND-00116');
    });

    it('renders name, position, source, applied date and status for a row', () => {
      const text = normalise(rows()[0]);
      expect(text).toContain('John Smith');
      expect(text).toContain('Software Developer');
      expect(text).toContain('LinkedIn');
      expect(text).toContain('14 May 2024');
      expect(normalise(rows()[0].querySelector('.badge'))).toBe('New');
    });

    it('shows a photo avatar for each row', () => {
      expect(el.querySelectorAll('tbody tr.row img.avatar').length).toBe(10);
    });

    it('shows the pager as 1 2 3 4 5 … 13', () => {
      const labels = Array.from(el.querySelectorAll('.pagination .page-btn, .pagination .ellipsis')).map((n) =>
        normalise(n),
      );
      expect(labels.filter(Boolean)).toEqual(['1', '2', '3', '4', '5', '…', '13']);
    });

    it('disables Previous on the first page', () => {
      const previous = el.querySelector<HTMLButtonElement>('button[aria-label="Previous page"]')!;
      expect(previous.disabled).toBe(true);
    });
  });

  describe('layout', () => {
    it('shows the page title and the signed-in user in the header', () => {
      expect(normalise(el.querySelector('.topbar__title'))).toBe('Candidate List');
      expect(normalise(el.querySelector('.topbar__user'))).toContain('Nikesh Mali');
      expect(normalise(el.querySelector('.topbar__user'))).toContain('HR Manager');
    });

    it('lists the sidebar links in order with the notification count', () => {
      const labels = Array.from(el.querySelectorAll('.sidebar__nav .nav-link__label')).map((n) => normalise(n));
      expect(labels).toEqual([
        'Dashboard',
        'Candidates',
        'Interviews',
        'Interviewers',
        'Feedback',
        'Reports',
        'Notifications',
        'Activity Log',
        'Settings',
      ]);
      expect(normalise(el.querySelector('.nav-badge'))).toBe('6');
    });

    it('toggles the sidebar from the menu button', () => {
      const wasOpen = component.sidebarOpen();
      el.querySelector<HTMLButtonElement>('.topbar__menu')!.click();
      fixture.detectChanges();
      expect(component.sidebarOpen()).toBe(!wasOpen);
      expect(el.querySelector('.shell--collapsed') !== null).toBe(wasOpen);
    });
  });

  describe('search and filters', () => {
    it('filters by name, case-insensitively, and resets to page 1', () => {
      component.goTo(3);
      typeInto('#candidate-search', 'priya SINGH');
      expect(rows().length).toBe(1);
      expect(rowCodes()[0]).toBe('CAND-00124');
      expect(summary()).toBe('Showing 1 to 1 of 1 entries');
    });

    it('filters by status', () => {
      pick('#status-filter', 'Rejected');
      expect(rows().length).toBeGreaterThan(0);
      rows().forEach((r) => expect(normalise(r.querySelector('.badge'))).toBe('Rejected'));
    });

    it('combines position and source filters', () => {
      pick('#position-filter', 'QA Engineer');
      pick('#source-filter', 'Naukri.com');
      expect(rows().length).toBeGreaterThan(0);
      rows().forEach((r) => {
        const text = normalise(r);
        expect(text).toContain('QA Engineer');
        expect(text).toContain('Naukri.com');
      });
    });

    it('filters by applied date range from More Filters', () => {
      component.showMoreFilters.set(true);
      fixture.detectChanges();
      typeInto('#applied-from', '2024-05-14');
      expect(component.filtered().every((c) => c.appliedOn >= '2024-05-14')).toBe(true);
      expect(component.totalEntries()).toBe(3);
    });

    it('shows an empty state and recovers with Clear filters', () => {
      typeInto('#candidate-search', 'zzzz-no-match');
      expect(rows().length).toBe(0);
      expect(normalise(el.querySelector('.empty'))).toContain('No candidates match your filters.');
      expect(summary()).toBe('Showing 0 to 0 of 0 entries');

      el.querySelector<HTMLButtonElement>('.empty button')!.click();
      fixture.detectChanges();
      expect(summary()).toBe('Showing 1 to 10 of 125 entries');
    });
  });

  describe('sorting', () => {
    it('sorts ascending on first click and descending on second click', () => {
      const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

      component.sortBy('name');
      fixture.detectChanges();
      let names = component.pageRows().map((c) => c.name);
      expect(names).toEqual([...names].sort(collator.compare));
      expect(component.ariaSort('name')).toBe('ascending');

      component.sortBy('name');
      fixture.detectChanges();
      names = component.pageRows().map((c) => c.name);
      expect(names).toEqual([...names].sort((a, b) => collator.compare(b, a)));
      expect(component.ariaSort('name')).toBe('descending');
    });

    it('sorts by applied date using the real date, not the text', () => {
      component.sortBy('appliedOn');
      fixture.detectChanges();
      const dates = component.pageRows().map((c) => c.appliedOn);
      expect(dates).toEqual([...dates].sort());
    });

    it('marks only the active column header with aria-sort', () => {
      component.sortBy('position');
      fixture.detectChanges();
      const active = el.querySelectorAll('th[aria-sort="ascending"]');
      expect(active.length).toBe(1);
      expect(normalise(active[0])).toContain('Position');
    });
  });

  describe('paging', () => {
    it('changes page size', () => {
      pick('#page-size', '25');
      expect(rows().length).toBe(25);
      expect(summary()).toBe('Showing 1 to 25 of 125 entries');
    });

    it('moves between pages', () => {
      component.goTo(2);
      fixture.detectChanges();
      expect(summary()).toBe('Showing 11 to 20 of 125 entries');
      expect(rowCodes()[0]).toBe('CAND-00115');

      el.querySelector<HTMLButtonElement>('button[aria-label="Next page"]')!.click();
      fixture.detectChanges();
      expect(summary()).toBe('Showing 21 to 30 of 125 entries');
    });

    it('ignores page numbers outside the range and the ellipsis', () => {
      component.goTo(0);
      component.goTo(99);
      component.goTo('…');
      expect(component.page()).toBe(1);
    });

    it('shows a short last page correctly', () => {
      component.goTo(13);
      fixture.detectChanges();
      expect(rows().length).toBe(5);
      expect(summary()).toBe('Showing 121 to 125 of 125 entries');
      const next = el.querySelector<HTMLButtonElement>('button[aria-label="Next page"]')!;
      expect(next.disabled).toBe(true);
    });
  });

  describe('selection', () => {
    it('selects and clears every row on the current page', () => {
      const header = el.querySelector<HTMLInputElement>('.check-all')!;

      header.click();
      fixture.detectChanges();
      expect(component.selectedIds().size).toBe(10);
      expect(rows().every((r) => r.classList.contains('is-selected'))).toBe(true);

      header.click();
      fixture.detectChanges();
      expect(component.selectedIds().size).toBe(0);
    });

    it('shows the header checkbox as indeterminate for a partial selection', () => {
      el.querySelector<HTMLInputElement>('.row-check')!.click();
      fixture.detectChanges();
      const header = el.querySelector<HTMLInputElement>('.check-all')!;
      expect(header.indeterminate).toBe(true);
      expect(header.checked).toBe(false);
    });

    it('keeps selections when moving to another page', () => {
      el.querySelector<HTMLInputElement>('.row-check')!.click();
      component.goTo(2);
      fixture.detectChanges();
      expect(component.selectedIds().size).toBe(1);
    });
  });

  describe('row menu', () => {
    const kebab = () => el.querySelector<HTMLButtonElement>('.kebab')!;

    it('opens the menu with three actions', () => {
      kebab().click();
      fixture.detectChanges();
      const items = Array.from(el.querySelectorAll('.actions .menu a')).map((a) => normalise(a));
      expect(items).toEqual(['View details', 'Edit candidate', 'Schedule interview']);
      expect(kebab().getAttribute('aria-expanded')).toBe('true');
    });

    it('closes on Escape', () => {
      kebab().click();
      fixture.detectChanges();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();
      expect(el.querySelector('.actions .menu')).toBeNull();
    });

    it('closes on an outside click', () => {
      kebab().click();
      fixture.detectChanges();
      document.body.click();
      fixture.detectChanges();
      expect(el.querySelector('.actions .menu')).toBeNull();
    });

    it('keeps only one row menu open at a time', () => {
      const buttons = el.querySelectorAll<HTMLButtonElement>('.kebab');
      buttons[0].click();
      fixture.detectChanges();
      buttons[1].click();
      fixture.detectChanges();
      expect(el.querySelectorAll('.actions .menu').length).toBe(1);
    });
  });

  describe('export', () => {
    it('downloads a CSV of all filtered rows, not just the visible page', async () => {
      const originalCreate = URL.createObjectURL;
      const originalRevoke = URL.revokeObjectURL;
      const originalClick = HTMLAnchorElement.prototype.click;

      let captured: Blob | null = null;
      let fileName = '';
      URL.createObjectURL = (blob: Blob | MediaSource) => {
        captured = blob as Blob;
        return 'blob:test';
      };
      URL.revokeObjectURL = () => undefined;
      HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
        fileName = this.download;
      };

      try {
        pick('#status-filter', 'On Hold');
        const expectedRows = component.totalEntries();

        el.querySelector<HTMLButtonElement>('.export-btn')!.click();
        fixture.detectChanges();
        el.querySelector<HTMLButtonElement>('.menu button:not([disabled])')!.click();
        fixture.detectChanges();

        expect(fileName).toBe('candidates.csv');
        const text = await (captured as unknown as Blob).text();
        const lines = text.replace(/^\uFEFF/, '').split('\r\n');
        expect(lines[0]).toBe('Candidate ID,Name,Position,Source,Applied On,Status');
        expect(lines.length - 1).toBe(expectedRows);
        expect(expectedRows).toBeGreaterThan(component.pageSize());
        expect(el.querySelector('.export-btn + .menu')).toBeNull();
      } finally {
        URL.createObjectURL = originalCreate;
        URL.revokeObjectURL = originalRevoke;
        HTMLAnchorElement.prototype.click = originalClick;
      }
    });

    it('keeps Excel and PDF disabled until the API is connected', () => {
      el.querySelector<HTMLButtonElement>('.export-btn')!.click();
      fixture.detectChanges();
      const disabled = Array.from(el.querySelectorAll<HTMLButtonElement>('.menu button[disabled]')).map((b) =>
        normalise(b),
      );
      expect(disabled).toEqual(['Excel (.xlsx)', 'PDF (.pdf)']);
    });
  });

  describe('accessibility', () => {
    it('labels every row checkbox and action with the candidate name', () => {
      const first = rows()[0];
      expect(first.querySelector('.row-check')!.getAttribute('aria-label')).toBe('Select John Smith');
      expect(first.querySelector('.icon-btn--view')!.getAttribute('aria-label')).toBe('View John Smith');
      expect(first.querySelector('.kebab')!.getAttribute('aria-label')).toBe('More actions for John Smith');
    });

    it('marks the current page with aria-current', () => {
      const current = el.querySelector('.page-btn[aria-current="page"]')!;
      expect(normalise(current)).toBe('1');
    });
  });
});