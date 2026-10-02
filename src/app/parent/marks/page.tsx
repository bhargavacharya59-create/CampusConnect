import type { Metadata } from "next";
import { formatDate } from "@/lib/dates";
import { pct } from "@/lib/format";
import { getPublishedMarks } from "@/lib/queries/student";
import { getParentAndChild } from "../data";
import { MarksContent } from "./MarksContent";

export const metadata: Metadata = { title: "Marks" };

export default async function MarksPage() {
  const { child } = await getParentAndChild();
  if (!child) return null;
  const marks = await getPublishedMarks(child.classId, child.id);

  // Group by assessment name (IA-1, Lab Internal, ...)
  const groupsMap = new Map<string, typeof marks.items>();
  for (const m of marks.items) {
    if (!groupsMap.has(m.name)) groupsMap.set(m.name, []);
    groupsMap.get(m.name)!.push(m);
  }

  const groups = [...groupsMap.entries()].map(([name, items]) => ({
    name,
    heldOn: items[0].heldOn ? formatDate(items[0].heldOn) : null,
    items: items.map((m) => ({
      id: m.id,
      subjectName: m.subject.name,
      absent: m.absent,
      score: m.score,
      maxMarks: m.maxMarks,
      classAvg: m.classAvg,
      pct: m.score != null ? (m.score / m.maxMarks) * 100 : null,
    })),
  }));

  return (
    <MarksContent
      pctFormatted={marks.pct != null ? pct(marks.pct) : "–"}
      got={marks.got}
      max={marks.max}
      childName={child.user.name}
      childId={child.id}
      className={child.class.name}
      semester={child.class.semester}
      departmentName={child.class.department.name}
      groups={groups}
    />
  );
}
