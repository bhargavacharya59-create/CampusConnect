import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { logout } from "@/app/actions/auth";
import { requireSession } from "@/lib/auth";
import { COLLEGE_NAME, ROLE_HOME, ROLE_LABEL } from "@/lib/constants";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const session = await requireSession();
  if (session.role === "PARENT") redirect("/parent/account");
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, name: true, email: true, phone: true, mustChangePassword: true } });
  if (!user) redirect("/login");

  return (
    <main data-theme="brand" className="min-h-screen bg-ground px-4 py-8">
      <div className="mx-auto flex max-w-lg flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={36} />
            <span className="font-extrabold">{COLLEGE_NAME}</span>
          </div>
          <Link href={ROLE_HOME[session.role]} className="link text-sm">
            ← Back to dashboard
          </Link>
        </div>
        <section className="card">
          <h1 className="text-xl font-extrabold">{user.name}</h1>
          <p className="text-sm text-ink-muted">
            {ROLE_LABEL[session.role]} · <span className="font-mono">{user.id}</span>
          </p>
          <dl className="mt-3">
            <div className="row">
              <dt className="text-ink-muted">Email</dt>
              <dd>{user.email ?? "–"}</dd>
            </div>
            <div className="row">
              <dt className="text-ink-muted">Phone</dt>
              <dd>{user.phone ?? "–"}</dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-ink-muted">To change your email or phone, contact the College Office.</p>
        </section>
        <section className="card">
          <h2 className="mb-3 text-lg font-extrabold">Change password</h2>
          {user.mustChangePassword && <p className="mb-3 rounded-xl bg-warn-50 px-3 py-2 text-sm text-warn-900">You are using a first-time password. Please set your own.</p>}
          <ChangePasswordForm />
        </section>
        <form action={logout}>
          <button type="submit" className="btn-outline w-full">
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
