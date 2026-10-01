import { cache } from "react";
import { requireRole } from "@/lib/auth";
import { getStudentProfileByParent } from "@/lib/queries/student";

/**
 * The logged-in parent and their child. Wrapped in React `cache` so the layout
 * and the page share one database call per request.
 */
export const getParentAndChild = cache(async () => {
  const session = await requireRole("PARENT");
  const child = await getStudentProfileByParent(session.userId);
  return { session, child };
});
