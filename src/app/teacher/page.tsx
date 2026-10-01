import { requireRole } from "@/lib/auth";
import { ComingSoon } from "@/components/ComingSoon";

export default async function Page() {
  const session = await requireRole("TEACHER");
  return <ComingSoon role="TEACHER" name={session.name} />;
}
