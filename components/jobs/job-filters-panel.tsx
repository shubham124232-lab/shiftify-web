import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import { SHIFT_TYPE_LABELS, POSTED_WITHIN_OPTIONS, SORT_OPTIONS, inp, lbl } from "@/lib/constants/job-filters";

export interface LiveDashboardFilters {
  category: string;
  shiftType: string;
  fundingType: string;
  isRecurring: string; // "true" | "false" | ""
  postedWithin: string;
  dateFrom: string;
  dateTo: string;
  sortBy: string;
}

export function JobFiltersPanel({
  filters, onChange, onReset, onApply,
}: {
  filters: LiveDashboardFilters;
  onChange: (f: Partial<LiveDashboardFilters>) => void;
  onReset: () => void;
  onApply: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <label className={lbl}>Sort by</label>
        <select className={inp} value={filters.sortBy} onChange={e => onChange({ sortBy: e.target.value })}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div>
        <label className={lbl}>Category</label>
        <select className={inp} value={filters.category} onChange={e => onChange({ category: e.target.value })}>
          <option value="">All categories</option>
          {JOB_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <div>
        <label className={lbl}>Shift type</label>
        <select className={inp} value={filters.shiftType} onChange={e => onChange({ shiftType: e.target.value })}>
          <option value="">All types</option>
          {Object.entries(SHIFT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div>
        <label className={lbl}>Frequency</label>
        <select className={inp} value={filters.isRecurring} onChange={e => onChange({ isRecurring: e.target.value })}>
          <option value="">All</option>
          <option value="false">One-time</option>
          <option value="true">Recurring / ongoing</option>
        </select>
      </div>

      <div>
        <label className={lbl}>Funding type</label>
        <select className={inp} value={filters.fundingType} onChange={e => onChange({ fundingType: e.target.value })}>
          <option value="">Any</option>
          <option value="SELF_MANAGED">Self-managed</option>
          <option value="PLAN_MANAGED">Plan-managed</option>
          <option value="NDIA_MANAGED">NDIA-managed</option>
        </select>
      </div>

      <div>
        <label className={lbl}>Shift date from</label>
        <input type="date" className={inp} value={filters.dateFrom} onChange={e => onChange({ dateFrom: e.target.value })} />
      </div>
      <div>
        <label className={lbl}>Shift date to</label>
        <input type="date" className={inp} value={filters.dateTo} onChange={e => onChange({ dateTo: e.target.value })} />
      </div>

      <div>
        <label className={lbl}>Posted within</label>
        <select className={inp} value={filters.postedWithin} onChange={e => onChange({ postedWithin: e.target.value })}>
          {POSTED_WITHIN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className={cn("flex items-end gap-2 sm:col-span-2 lg:col-span-4")}>
        <Button onClick={onApply}>Apply Filters</Button>
        <button onClick={onReset} className="text-xs text-brand-600 hover:underline">Reset all</button>
      </div>
    </div>
  );
}
