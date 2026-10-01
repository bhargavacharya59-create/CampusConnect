import { requireRole } from "@/lib/auth";
import { ComingSoon } from "@/components/ComingSoon";

export default async function Page() {
  const session = await requireRole("DEAN");
  return <ComingSoon role="DEAN" name={session.name} />;
}
