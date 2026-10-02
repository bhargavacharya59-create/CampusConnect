import { prisma } from "@/lib/db";
import { ATTENDANCE_THRESHOLD } from "@/lib/constants";
import { formatDay, formatDateTime, istToday, weekStart } from "@/lib/dates";
import { pct, plural, rupees } from "@/lib/format";
import { getAttendance, getFees, getNoticesFor, getPublishedMarks, getToday } from "@/lib/queries/student";
import { isAiEnabled } from "@/lib/ai/gemini";
import { summaryKind } from "@/lib/i18n/lang";
import { getServerLang } from "@/lib/i18n/server";
import { getParentAndChild } from "./data";
import { ParentDashboard } from "./ParentDashboard";

export default async function ParentHome() {
  const { session, child } = await getParentAndChild();
  if (!child) return null;

  const [att, today, marks, fees, notices, latestMsg] = await Promise.all([
    getAttendance(child.id),
    getToday(child.classId, child.id),
    getPublishedMarks(child.classId, child.id),
    getFees(child.id),
    getNoticesFor("PARENTS", child.class.departmentId, 3),
    prisma.message.findFirst({
      where: { toId: session.userId, readAt: null },
      orderBy: { createdAt: "desc" },
      include: { from: { select: { name: true } } },
    }),
  ]);
  const low = att.pct < ATTENDANCE_THRESHOLD;
  const proctor = child.class.proctor?.user;
  const aiOn = isAiEnabled("PARENT");
  const summary = aiOn
    ? await prisma.aiSummary.findUnique({
        where: { studentId_kind_periodStart: { studentId: child.id, kind: summaryKind(getServerLang()), periodStart: weekStart(istToday()) } },
      })
    : null;

  return (
    <ParentDashboard
      att={{ pct: att.pct, needed: att.needed }}
      marksPct={marks.pct}
      feeDue={fees.dueTotal}
      feeFormatted={rupees(fees.dueTotal)}
      low={low}
      childName={child.user.name}
      childFirstName={child.user.name.split(" ")[0]}
      mustChangePassword={child.parent.mustChangePassword}
      aiOn={aiOn}
      summaryText={summary?.text ?? null}
      threshold={ATTENDANCE_THRESHOLD}
      latestMsg={latestMsg ? { fromName: latestMsg.from.name, body: latestMsg.body } : null}
      todayLabel={formatDay(today.date)}
      todayHoliday={today.holiday}
      todayPeriods={today.periods.map((p) => ({
        period: p.period,
        start: p.start,
        subject: p.subject,
        teacher: p.teacher,
        room: p.room,
        status: p.status,
      }))}
      marksItems={marks.items.map((m) => ({
        id: m.id,
        subjectName: m.subject.name,
        name: m.name,
        absent: m.absent,
        score: m.score,
        maxMarks: m.maxMarks,
      }))}
      nextDueFee={fees.nextDue ? {
        state: fees.nextDue.state,
        dueDate: formatDay(fees.nextDue.dueDate),
        amount: rupees(fees.nextDue.amount),
        title: fees.nextDue.title,
      } : null}
      proctor={proctor ? { name: proctor.name } : null}
      notices={notices.map((n) => ({
        id: n.id,
        title: n.title,
        authorName: n.author.name,
        createdAt: formatDateTime(n.createdAt),
      }))}
      pctFormatted={pct(att.pct)}
      marksPctFormatted={marks.pct != null ? pct(marks.pct) : "–"}
    />
  );
}
