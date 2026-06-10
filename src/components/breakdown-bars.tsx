export function BreakdownBars({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No data yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {data
        .slice()
        .sort((a, b) => b.value - a.value)
        .map((d) => {
          const pct = Math.round((d.value / total) * 100);
          return (
            <div key={d.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">{d.label}</span>
                <span className="text-muted-foreground tabular-nums">
                  {d.value} · {pct}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
    </div>
  );
}
