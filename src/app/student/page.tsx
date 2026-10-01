import { requireRole } from "@/lib/auth";
import { ComingSoon } from "@/components/ComingSoon";

export default async function Page() {
  const session = await requireRole("STUDENT");
  return <ComingSoon role="STUDENT" name={session.name} />;
}
