import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Serves an uploaded assignment file to the student who sent it or the teacher of that class. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return new Response("Please sign in.", { status: 401 });

  const sub = await prisma.submission.findUnique({
    where: { id: Number(params.id) || -1 },
    select: { studentId: true, fileName: true, fileMime: true, fileData: true, coursework: { select: { assignment: { select: { teacherId: true, class: { select: { proctorId: true, departmentId: true } } } } } } },
  });
  if (!sub || !sub.fileData) return new Response("Not found.", { status: 404 });

  const a = sub.coursework.assignment;
  let allowed = false;
  if (session.role === "STUDENT") allowed = session.userId === sub.studentId;
  else if (session.role === "TEACHER") allowed = session.userId === a.teacherId || session.userId === a.class.proctorId;
  else if (session.role === "DEAN") allowed = true;
  else if (session.role === "DIRECTOR") {
    const dept = await prisma.department.findFirst({ where: { directorId: session.userId }, select: { id: true } });
    allowed = dept?.id === a.class.departmentId;
  }
  if (!allowed) return new Response("Not allowed.", { status: 403 });

  const name = (sub.fileName ?? "file").replace(/[^\w.\- ]+/g, "_");
  return new Response(new Uint8Array(sub.fileData), {
    headers: {
      "Content-Type": sub.fileMime ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${name}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
