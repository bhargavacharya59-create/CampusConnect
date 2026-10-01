import { COLLEGE_SHORT } from "@/lib/constants";

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <div
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-[11px] bg-gold font-extrabold text-gold-ink"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {COLLEGE_SHORT}
    </div>
  );
}
