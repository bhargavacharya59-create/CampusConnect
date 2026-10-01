import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ROLE_LABEL, ROLES, type Role } from "@/lib/constants";
import { Card, Empty, PageHeader } from "@/components/ui";
import { InlineAction } from "@/components/forms";
import { resetPassword } from "../actions";

export const metadata: Metadata = { title: "Users & passwords" };

export default async function AdminUsers({ searchParams }: { searchParams: { q?: string; role?: string } }) {
  await requireRole("ADMIN");
  const q = (searchParams.q ?? "").trim();
  const role = ROLES.includes(searchParams.role as Role) ? (searchParams.role as Role) : undefined;
  const users =
    q || role
      ? await prisma.user.findMany({
          where: { ...(role ? { role } : {}), ...(q ? { OR: [{ id: { contains: q.toUpperCase() } }, { name: { contains: q } }, { phone: { contains: q } }] } : {}) },
          orderBy: { id: "asc" },
          take: 100,
          select: { id: true, name: true, role: true, phone: true, email: true, mustChangePassword: true },
        })
      : [];

  return (
    <>
      <PageHeader title="Users & passwords" subtitle="Find any account and give it a new first-time password" />
      <Card>
        <form action="/admin/users" className="flex flex-wrap gap-2">
          <label htmlFor="q" className="sr-only">
            Search
          </label>
          <input id="q" name="q" defaultValue={q} placeholder="ID, name or phone" className="field max-w-sm" />
          <label htmlFor="role" className="sr-only">
            Role
          </label>
          <select id="role" name="role" defaultValue={role ?? ""} className="field w-44">
            <option value="">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
          <button type="submit" className="btn">
            Search
          </button>
        </form>
      </Card>
      {(q || role) && (
        <Card title={`${users.length}${users.length === 100 ? "+" : ""} accounts`}>
          {users.length === 0 ? (
            <Empty>No accounts found.</Empty>
          ) : (
            <div className="-mx-4 overflow-x-auto">
              <table className="table min-w-[720px]">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Contact</th>
                    <th>Password</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="font-mono text-sm">{u.id}</td>
                      <td className="font-semibold">{u.name}</td>
                      <td>{ROLE_LABEL[u.role as Role] ?? u.role}</td>
                      <td className="text-sm">
                        {u.phone ?? ""}
                        <span className="block text-xs text-ink-muted">{u.email ?? ""}</span>
                      </td>
                      <td>{u.mustChangePassword ? <span className="pill pill-amber">First-time</span> : <span className="pill pill-green">Changed</span>}</td>
                      <td>{u.role !== "ADMIN" && <InlineAction action={resetPassword} fields={{ userId: u.id }} label="Reset password" busy="…" className="btn-outline btn-sm" confirm={`Give ${u.id} a new password?`} />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </>
  );
}
