import { logout } from "@/app/actions/auth";
import { COLLEGE_NAME, ROLE_LABEL, type Role } from "@/lib/constants";
import { Logo } from "./Logo";

/** Temporary page for roles whose dashboards are not built yet. */
export function ComingSoon({ role, name }: { role: Role; name: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="card flex w-full max-w-md flex-col items-center gap-4 p-8 text-center">
        <Logo size={48} />
        <div>
          <div className="text-sm font-semibold text-ink-muted">{COLLEGE_NAME}</div>
          <h1 className="mt-1 text-2xl font-extrabold">Welcome, {name}</h1>
        </div>
        <p className="text-ink-muted">
          The {ROLE_LABEL[role]} dashboard is being built and will be available here soon.
        </p>
        <form action={logout}>
          <button type="submit" className="btn-outline">
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
