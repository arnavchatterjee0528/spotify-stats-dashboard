export default function ChartTooltip({ active, payload, label, unit = 'plays', format }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="tooltip">
      <div className="tooltip-label">{format ? format(label) : label}</div>
      <div><strong>{payload[0].value}</strong> {unit}</div>
    </div>
  );
}
