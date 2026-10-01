import { DAYS, PERIODS, PERIODS_PER_DAY, WORKING_DAYS } from "@/lib/constants";

export interface Cell {
  day: number;
  period: number;
  title: string;
  sub?: string;
}

/** Mon–Fri x periods grid. `today` (1-7) is highlighted. */
export function TimetableGrid({ cells, today }: { cells: Cell[]; today?: number }) {
  const at = (d: number, p: number) => cells.filter((c) => c.day === d && c.period === p);
  const days = Array.from({ length: WORKING_DAYS }, (_, i) => i + 1);
  const periods = Array.from({ length: PERIODS_PER_DAY }, (_, i) => i + 1);
  return (
    <div className="-mx-4 overflow-x-auto">
      <table className="table min-w-[720px] table-fixed">
        <thead>
          <tr>
            <th className="w-28">Day</th>
            {periods.map((p) => (
              <th key={p}>
                P{p} · {PERIODS[p].start}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d} className={d === today ? "bg-[color:var(--accent-soft)]" : ""}>
              <td className="font-bold">
                {DAYS[d]}
                {d === today && <span className="block text-xs font-semibold text-[color:var(--accent)]">Today</span>}
              </td>
              {periods.map((p) => {
                const list = at(d, p);
                return (
                  <td key={p} className="align-top">
                    {list.length === 0 ? (
                      <span className="text-ink-muted">–</span>
                    ) : (
                      list.map((c, i) => (
                        <div key={i} className="leading-tight">
                          <div className="font-semibold">{c.title}</div>
                          {c.sub && <div className="text-xs text-ink-muted">{c.sub}</div>}
                        </div>
                      ))
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
