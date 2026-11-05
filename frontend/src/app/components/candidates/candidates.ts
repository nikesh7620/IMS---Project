import { DOCUMENT, DatePipe } from '@angular/common';
import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/* ------------------------------------------------------------------ */
/* Models and constants                                                */
/* ------------------------------------------------------------------ */

export type CandidateStatus =
  | 'New'
  | 'In Review'
  | 'Shortlisted'
  | 'Interview Scheduled'
  | 'Selected'
  | 'Rejected'
  | 'On Hold';

export interface Candidate {
  id: number;
  code: string; // CAND-00125
  name: string;
  position: string;
  source: string;
  appliedOn: string; // ISO date, yyyy-MM-dd
  status: CandidateStatus;
  avatar?: string; // photo URL; the list falls back to initials when missing
}

export type SortKey = 'code' | 'name' | 'position' | 'source' | 'appliedOn' | 'status';
export type SortDirection = 'asc' | 'desc';

export const CANDIDATE_STATUSES: CandidateStatus[] = [
  'New',
  'In Review',
  'Shortlisted',
  'Interview Scheduled',
  'Selected',
  'Rejected',
  'On Hold',
];

export const PAGE_SIZES = [10, 25, 50, 100];

/* ------------------------------------------------------------------ */
/* Pure helpers (exported so they can be unit-tested directly)         */
/* ------------------------------------------------------------------ */

/** Page buttons shown in the pager, e.g. 1 2 3 4 5 … 13 */
export function buildPageItems(current: number, total: number): (number | '…')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '…', total];
  }
  if (current >= total - 3) {
    return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, '…', current - 1, current, current + 1, '…', total];
}

/** CSV text for the given rows (header + one line per candidate). */
export function buildCsv(rows: Candidate[]): string {
  const escape = (value: string) =>
    /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

  const header = ['Candidate ID', 'Name', 'Position', 'Source', 'Applied On', 'Status'];
  const lines = rows.map((c) =>
    [c.code, c.name, c.position, c.source, c.appliedOn, c.status].map(escape).join(','),
  );
  return [header.join(','), ...lines].join('\r\n');
}

/* ------------------------------------------------------------------ */
/* Sample data. TODO: replace with the Candidates API (server-side     */
/* search, filter, sort and pagination) once the endpoints exist.      */
/* ------------------------------------------------------------------ */

const POSITIONS = ['Software Developer', 'UI/UX Designer', 'QA Engineer', 'Business Analyst', 'DevOps Engineer'];
const SOURCES = ['LinkedIn', 'Naukri.com', 'Referral', 'Company Website'];
const FIRST_NAMES = ['Aarav', 'Diya', 'Kabir', 'Ishita', 'Arjun', 'Meera', 'Rohan', 'Tanvi', 'Nikhil', 'Kavya'];
const LAST_NAMES = ['Nair', 'Kapoor', 'Joshi', 'Iyer', 'Desai', 'Rao', 'Bose', 'Chopra', 'Malhotra', 'Pillai'];

const makeCode = (id: number) => `CAND-${String(id).padStart(5, '0')}`;
// Placeholder photos. TODO: use the photo URL returned by the Candidates API.
const makeAvatar = (id: number, gender: 'men' | 'women') =>
  `https://randomuser.me/api/portraits/${gender}/${id % 100}.jpg`;

function buildSampleCandidates(): Candidate[] {
  const visible: [number, string, string, string, string, CandidateStatus][] = [
    [125, 'John Smith', 'Software Developer', 'LinkedIn', '2024-05-14', 'New'],
    [124, 'Priya Singh', 'UI/UX Designer', 'Naukri.com', '2024-05-14', 'In Review'],
    [123, 'Rahul Kumar', 'QA Engineer', 'Referral', '2024-05-14', 'Shortlisted'],
    [122, 'Neha Gupta', 'Business Analyst', 'LinkedIn', '2024-05-13', 'Interview Scheduled'],
    [121, 'Amit Verma', 'DevOps Engineer', 'Company Website', '2024-05-13', 'In Review'],
    [120, 'Sneha Patil', 'QA Engineer', 'Naukri.com', '2024-05-12', 'Shortlisted'],
    [119, 'Vikram Singh', 'UI/UX Designer', 'Referral', '2024-05-12', 'New'],
    [118, 'Pooja Mehta', 'Software Developer', 'LinkedIn', '2024-05-11', 'Rejected'],
    [117, 'Rohit Sharma', 'Business Analyst', 'Company Website', '2024-05-11', 'On Hold'],
    [116, 'Anjali Reddy', 'QA Engineer', 'Naukri.com', '2024-05-10', 'Interview Scheduled'],
  ];

  const first: Candidate[] = visible.map(([id, name, position, source, appliedOn, status]) => ({
    id,
    code: makeCode(id),
    name,
    position,
    source,
    appliedOn,
    status,
    avatar: makeAvatar(id, id % 2 ? 'men' : 'women'),
  }));

  const rest: Candidate[] = [];
  for (let id = 115; id >= 1; id--) {
    const date = new Date(Date.UTC(2024, 4, 10 - Math.floor((116 - id) / 2)));
    rest.push({
      id,
      code: makeCode(id),
      name: `${FIRST_NAMES[id % 10]} ${LAST_NAMES[(id * 3) % 10]}`,
      position: POSITIONS[id % POSITIONS.length],
      source: SOURCES[id % SOURCES.length],
      appliedOn: date.toISOString().slice(0, 10),
      status: CANDIDATE_STATUSES[id % CANDIDATE_STATUSES.length],
      avatar: makeAvatar(id, id % 2 ? 'women' : 'men'),
    });
  }
  return [...first, ...rest];
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

@Component({
  selector: 'app-candidates',
  imports: [DatePipe, RouterLink, RouterLinkActive],
  templateUrl: './candidates.html',
  styleUrl: './candidates.css',
})
export class Candidates {
  private readonly document = inject(DOCUMENT);
  private static readonly collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

  readonly statuses = CANDIDATE_STATUSES;
  readonly pageSizes = PAGE_SIZES;
  readonly columns: { key: SortKey; label: string }[] = [
    { key: 'code', label: 'Candidate ID' },
    { key: 'name', label: 'Name' },
    { key: 'position', label: 'Position' },
    { key: 'source', label: 'Source' },
    { key: 'appliedOn', label: 'Applied On' },
    { key: 'status', label: 'Status' },
  ];

  /* ---- shell (sidebar and header) ---- */
  // TODO: replace with the auth and notification services once they exist.
  readonly user = {
    name: 'Nikesh Mali',
    role: 'HR Manager',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  };
  readonly notificationCount = 6;
  readonly sidebarOpen = signal((this.document.defaultView?.innerWidth ?? 1200) > 900);

  /* ---- state ---- */
  readonly candidates = signal<Candidate[]>(buildSampleCandidates());

  readonly searchTerm = signal('');
  readonly statusFilter = signal('');
  readonly positionFilter = signal('');
  readonly sourceFilter = signal('');
  readonly appliedFrom = signal('');
  readonly appliedTo = signal('');
  readonly showMoreFilters = signal(false);

  readonly sortKey = signal<SortKey>('code');
  readonly sortDirection = signal<SortDirection>('desc');

  readonly pageSize = signal(10);
  readonly currentPage = signal(1);

  readonly selectedIds = signal<ReadonlySet<number>>(new Set());
  readonly openMenuId = signal<number | null>(null);
  readonly exportOpen = signal(false);

  /* ---- derived ---- */
  readonly positions = computed(() => [...new Set(this.candidates().map((c) => c.position))].sort());
  readonly sources = computed(() => [...new Set(this.candidates().map((c) => c.source))].sort());

  readonly filtered = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const status = this.statusFilter();
    const position = this.positionFilter();
    const source = this.sourceFilter();
    const from = this.appliedFrom();
    const to = this.appliedTo();

    return this.candidates().filter(
      (c) =>
        (!term ||
          c.name.toLowerCase().includes(term) ||
          c.code.toLowerCase().includes(term) ||
          c.position.toLowerCase().includes(term)) &&
        (!status || c.status === status) &&
        (!position || c.position === position) &&
        (!source || c.source === source) &&
        (!from || c.appliedOn >= from) &&
        (!to || c.appliedOn <= to),
    );
  });

  readonly sorted = computed(() => {
    const key = this.sortKey();
    const direction = this.sortDirection() === 'asc' ? 1 : -1;
    return [...this.filtered()].sort((a, b) => direction * this.compare(a, b, key) || b.id - a.id);
  });

  readonly totalEntries = computed(() => this.filtered().length);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalEntries() / this.pageSize())));
  readonly page = computed(() => Math.min(this.currentPage(), this.totalPages()));

  readonly pageRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.sorted().slice(start, start + this.pageSize());
  });

  readonly rangeStart = computed(() => (this.totalEntries() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1));
  readonly rangeEnd = computed(() => Math.min(this.page() * this.pageSize(), this.totalEntries()));
  readonly pageItems = computed(() => buildPageItems(this.page(), this.totalPages()));

  readonly allOnPageSelected = computed(
    () => this.pageRows().length > 0 && this.pageRows().every((c) => this.selectedIds().has(c.id)),
  );
  readonly someOnPageSelected = computed(
    () => !this.allOnPageSelected() && this.pageRows().some((c) => this.selectedIds().has(c.id)),
  );

  /* ---- shell ---- */
  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  /* ---- filter and paging handlers ---- */
  onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  onStatus(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value);
    this.currentPage.set(1);
  }

  onPosition(event: Event): void {
    this.positionFilter.set((event.target as HTMLSelectElement).value);
    this.currentPage.set(1);
  }

  onSource(event: Event): void {
    this.sourceFilter.set((event.target as HTMLSelectElement).value);
    this.currentPage.set(1);
  }

  onAppliedFrom(event: Event): void {
    this.appliedFrom.set((event.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  onAppliedTo(event: Event): void {
    this.appliedTo.set((event.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  onPageSize(event: Event): void {
    this.pageSize.set(Number((event.target as HTMLSelectElement).value));
    this.currentPage.set(1);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.statusFilter.set('');
    this.positionFilter.set('');
    this.sourceFilter.set('');
    this.appliedFrom.set('');
    this.appliedTo.set('');
    this.currentPage.set(1);
  }

  goTo(target: number | '…'): void {
    if (typeof target === 'number' && target >= 1 && target <= this.totalPages()) {
      this.currentPage.set(target);
    }
  }

  /* ---- sorting ---- */
  sortBy(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDirection.set('asc');
    }
    this.currentPage.set(1);
  }

  ariaSort(key: SortKey): 'ascending' | 'descending' | 'none' {
    if (this.sortKey() !== key) return 'none';
    return this.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }

  /* ---- selection ---- */
  isSelected(id: number): boolean {
    return this.selectedIds().has(id);
  }

  toggleRow(id: number): void {
    const next = new Set(this.selectedIds());
    if (!next.delete(id)) next.add(id);
    this.selectedIds.set(next);
  }

  toggleAllOnPage(): void {
    const next = new Set(this.selectedIds());
    if (this.allOnPageSelected()) {
      this.pageRows().forEach((c) => next.delete(c.id));
    } else {
      this.pageRows().forEach((c) => next.add(c.id));
    }
    this.selectedIds.set(next);
  }

  /* ---- menus ---- */
  toggleMenu(id: number, event: Event): void {
    event.stopPropagation();
    this.exportOpen.set(false);
    this.openMenuId.set(this.openMenuId() === id ? null : id);
  }

  toggleExport(event: Event): void {
    event.stopPropagation();
    this.openMenuId.set(null);
    this.exportOpen.set(!this.exportOpen());
  }

  @HostListener('document:click')
  @HostListener('document:keydown.escape')
  closeMenus(): void {
    this.openMenuId.set(null);
    this.exportOpen.set(false);
  }

  /* ---- export ---- */
  /** Exports every row that matches the current filters, in the current sort order. */
  exportCsv(): void {
    const blob = new Blob(['\uFEFF', buildCsv(this.sorted())], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = this.document.createElement('a');
    link.href = url;
    link.download = 'candidates.csv';
    link.click();
    URL.revokeObjectURL(url);
    this.exportOpen.set(false);
  }

  /* ---- template helpers ---- */
  initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
  }

  statusKey(status: CandidateStatus): string {
    return status.toLowerCase().replace(/\s+/g, '-');
  }

  private compare(a: Candidate, b: Candidate, key: SortKey): number {
    switch (key) {
      case 'code':
        return a.id - b.id;
      case 'appliedOn':
        return a.appliedOn.localeCompare(b.appliedOn);
      default:
        return Candidates.collator.compare(a[key], b[key]);
    }
  }
}