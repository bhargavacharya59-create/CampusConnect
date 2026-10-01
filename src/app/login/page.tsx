import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { COLLEGE_NAME, ROLE_HOME } from "@/lib/constants";
import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

const SAMPLE_IDS = [
  { role: "Student", id: "24SUUBECS0045" },
  { role: "Parent", id: "24SUUBECS0045P" },
  { role: "Teacher", id: "TCH-0001" },
  { role: "Director · Dean", id: "DIR-0001 · DEAN-0001" },
  { role: "College Office", id: "ADMIN-0001" },
];

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(ROLE_HOME[session.role]);

  return (
    <main className="flex min-h-screen flex-col lg:flex-row">
      <section className="flex flex-col justify-between gap-10 bg-brand-900 px-6 py-8 text-white sm:px-10 lg:w-[46%] lg:max-w-[600px] lg:px-16 lg:py-16">
        <div className="flex items-center gap-3.5">
          <Logo size={48} />
          <div>
            <div className="text-xl font-extrabold">{COLLEGE_NAME}</div>
            <div className="text-sm text-brand-200">Campus Portal</div>
          </div>
        </div>
        <div className="hidden flex-col gap-5 sm:flex">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight lg:text-[46px]">
            Everything about your campus, in one place.
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-brand-200">
            Attendance, marks, fees and notices for the Dean, Directors, Teachers, Students and Parents.
          </p>
        </div>
        <div className="hidden grid-cols-2 gap-3 text-sm lg:grid [&>*:last-child]:col-span-2">
          {SAMPLE_IDS.map((s) => (
            <div key={s.role} className="rounded-xl bg-brand-800 p-3.5">
              <div className="text-brand-200">{s.role}</div>
              <div className="mt-1 font-mono">{s.id}</div>
            </div>
          ))}
        </div>
      </section>
      <section className="flex flex-1 items-start justify-center px-4 py-8 sm:items-center sm:py-12">
        <LoginForm />
      </section>
    </main>
  );
}
