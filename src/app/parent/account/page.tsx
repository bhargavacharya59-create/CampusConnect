import type { Metadata } from "next";
import { getParentAndChild } from "../data";
import { AccountContent } from "./AccountContent";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const { child } = await getParentAndChild();
  if (!child) return null;
  const proctor = child.class.proctor?.user;

  return (
    <AccountContent
      childName={child.user.name}
      childId={child.id}
      className={child.class.name}
      semester={child.class.semester}
      departmentName={child.class.department.name}
      rollNo={child.rollNo}
      parentName={child.parent.name}
      parentId={child.parentId}
      parentPhone={child.parent.phone}
      proctorName={proctor?.name ?? null}
      proctorPhone={proctor?.phone ?? null}
    />
  );
}
