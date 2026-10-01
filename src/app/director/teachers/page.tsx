import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import { getDept } from "../data";

export const metadata: Metadata = { title: "Teachers & workload" };

const PERIOD_HOURS = 55 / 60;

export default async function DirectorTeachers() {
  const { dept } = await getDept();
  // Department teachers plus anyone who teaches a class of this department.
  const teachers = await prisma.teacher.findMany({
    where: { OR: [{ departmentId: dept.id }, { assignments: { some: { class: { departmentId: dept.id } } } }] },
    include: {
      user: { select: { name: true, phone: true, email: true } },
      proctorOf: true,
      assignments: { include: { subject: true, _count: { select: { slots: true } } } },
      leaves: { where: { status: "APPROVED" }, select: { id: true } },
    },
    orderBy: { id: "asc" },
  });
  const max = Math.max(1, ...teachers.map((t) => t.assignments.reduce((s, a) => s + a._count.slots, 0)));

  return (
    <>
      <PageHeader title="Teachers & workload" subtitle={`Teachers of ${dept.name} and teachers from other departments who teach your classes`} />
      <Card>
        <div className="-mx-4 overflow-x-auto">
          <table className="table min-w-[860px]">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Department</th>
                <th>Proctor of</th>
                <th>Teaches</th>
                <th className="w-56">Periods / week</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => {
                const periods = t.assignments.reduce((s, a) => s + a._count.slots, 0);
                return (
                  <tr key={t.id}>
                    <td>
                      <div className="font-bold">{t.user.name}</div>
                      <div className="text-xs text-ink-muted">
                        {t.id} · {t.designation}
                      </div>
                    </td>
                    <td>{t.departmentId === dept.id ? <span className="pill pill-green">{t.departmentId}</span> : <span className="pill pill-gray">{t.departmentId}</span>}</td>
                    <td>{t.proctorOf?.id ?? "–"}</td>
                    <td className="text-sm">
                      {t.assignments.map((a) => (
                        <div key={a.id}>
                          {a.classId} · {a.subject.shortName}
                        </div>
                      ))}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 flex-1 rounded-full bg-[#EEF0F3]">
                          <div className="h-2.5 rounded-full bg-[color:var(--accent)]" style={{ width: `${(periods / max) * 100}%` }} />
                        </div>
                        <b className="w-24 text-right text-sm">
                          {periods} · {Math.round(periods * PERIOD_HOURS)} h
                        </b>
                      </div>
                    </td>
                    <td className="text-sm">
                      {t.user.phone}
                      <div className="text-xs text-ink-muted">{t.user.email}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
