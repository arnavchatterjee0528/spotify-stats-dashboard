import { RANGES } from '../api';

export default function RangePicker({ value, onChange }) {
  return (
    <div className="segmented" role="tablist" aria-label="Time range">
      {RANGES.map((r) => (
        <button key={r.value} role="tab" aria-selected={value === r.value}
          className={value === r.value ? 'active' : ''} onClick={() => onChange(r.value)}>
          {r.label}
        </button>
      ))}
    </div>
  );
}
