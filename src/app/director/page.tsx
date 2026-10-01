import { requireRole } from "@/lib/auth";
import { ComingSoon } from "@/components/ComingSoon";

export default async function Page() {
  const session = await requireRole("DIRECTOR");
  return <ComingSoon role="DIRECTOR" name={session.name} />;
}
