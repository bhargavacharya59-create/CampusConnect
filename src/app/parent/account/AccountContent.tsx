"use client";

import { useI18n } from "@/lib/i18n/context";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { PhoneIcon } from "@/components/icons";
import { logout } from "@/app/actions/auth";

interface AccountData {
  childName: string;
  childId: string;
  className: string;
  semester: number;
  departmentName: string;
  rollNo: number;
  parentName: string;
  parentId: string;
  parentPhone: string | null;
  proctorName: string | null;
  proctorPhone: string | null;
}

export function AccountContent(props: AccountData) {
  const { t } = useI18n();

  const details: [string, string, boolean][] = [
    [t("student"), props.childName, false],
    [t("studentId"), props.childId, true],
    [t("classLabel"), `${props.className} · ${t("semester")} ${props.semester}`, false],
    [t("department"), props.departmentName, false],
    [t("rollNumber"), String(props.rollNo), false],
  ];

  return (
    <>
      <section className="card shadow-[0_10px_24px_rgba(11,61,58,0.10)]">
        <h1 className="sr-only">{t("studentDetails")}</h1>
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-extrabold">{t("studentDetails")}</h2>
        </div>
        <dl>
          {details.map(([k, v, mono]) => (
            <div key={k} className="row">
              <dt className="text-ink-muted">{k}</dt>
              <dd className={`text-right font-semibold ${mono ? "font-mono" : ""}`}>{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card">
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-extrabold">{t("yourDetails")}</h2>
        </div>
        <dl>
          <div className="row">
            <dt className="text-ink-muted">{t("name")}</dt>
            <dd className="font-semibold">{props.parentName}</dd>
          </div>
          <div className="row">
            <dt className="text-ink-muted">{t("parentId")}</dt>
            <dd className="font-mono font-semibold">{props.parentId}</dd>
          </div>
          <div className="row">
            <dt className="text-ink-muted">{t("phone")}</dt>
            <dd className="font-semibold">{props.parentPhone ?? "–"}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-ink-muted">{t("changePhoneNote")}</p>
      </section>

      {props.proctorName && (
        <section className="card flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-ink-muted">{t("proctor")}</div>
            <div className="font-extrabold">{props.proctorName}</div>
          </div>
          {props.proctorPhone && (
            <a href={`tel:${props.proctorPhone}`} className="btn-outline shrink-0">
              <PhoneIcon size={18} />
              {t("call")}
            </a>
          )}
        </section>
      )}

      <section className="card">
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-extrabold">{t("changePassword")}</h2>
        </div>
        <ChangePasswordForm />
      </section>

      <form action={logout}>
        <button type="submit" className="btn-outline w-full">
          {t("signOut")}
        </button>
      </form>
    </>
  );
}
