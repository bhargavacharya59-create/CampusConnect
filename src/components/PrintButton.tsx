"use client";

import { PrintIcon } from "./icons";

export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn-outline h-10">
      <PrintIcon size={18} />
      {label}
    </button>
  );
}
