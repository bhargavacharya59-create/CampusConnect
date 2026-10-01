import type { Metadata } from "next";
import { logout } from "@/app/actions/auth";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { PhoneIcon } from "@/components/icons";
import { getParentAndChild } from "../data";
import { SectionTitle } from "../ui";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const { child } = await getParentAndChild();
  if (!child) return null;
  const proctor = child.class.proctor?.user;

  const details: [string, string][] = [
    ["Student", child.user.name],
    ["Student ID", child.id],
    ["Class", `${child.class.name} · Semester ${child.class.semester}`],
    ["Department", child.class.department.name],
    ["Roll number", String(child.rollNo)],
  ];

  return (
    <>
      <section className="card shadow-[0_10px_24px_rgba(11,61,58,0.10)]">
        <h1 className="sr-only">Account</h1>
        <SectionTitle>Student details</SectionTitle>
        <dl>
          {details.map(([k, v]) => (
            <div key={k} className="row">
              <dt className="text-ink-muted">{k}</dt>
              <dd className={`text-right font-semibold ${k === "Student ID" ? "font-mono" : ""}`}>{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card">
        <SectionTitle>Your details</SectionTitle>
        <dl>
          <div className="row">
            <dt className="text-ink-muted">Name</dt>
            <dd className="font-semibold">{child.parent.name}</dd>
          </div>
          <div className="row">
            <dt className="text-ink-muted">Parent ID</dt>
            <dd className="font-mono font-semibold">{child.parentId}</dd>
          </div>
          <div className="row">
            <dt className="text-ink-muted">Phone</dt>
            <dd className="font-semibold">{child.parent.phone ?? "–"}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-ink-muted">To change your phone number, contact the college office.</p>
      </section>

      {proctor && (
        <section className="card flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-ink-muted">Proctor</div>
            <div className="font-extrabold">{proctor.name}</div>
          </div>
          {proctor.phone && (
            <a href={`tel:${proctor.phone}`} className="btn-outline shrink-0">
              <PhoneIcon size={18} />
              Call
            </a>
          )}
        </section>
      )}

      <section className="card">
        <SectionTitle>Change password</SectionTitle>
        <ChangePasswordForm />
      </section>

      <form action={logout}>
        <button type="submit" className="btn-outline w-full">
          Sign out
        </button>
      </form>
    </>
  );
}
