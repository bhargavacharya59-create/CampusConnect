// Shared constants. Kept free of server-only imports so both the app and the
// seed script can use them.

export const COLLEGE_NAME = "Engineering College";
export const COLLEGE_SHORT = "EC";
/** Code used inside student IDs, e.g. 24 SUU BE CS 0302. */
export const COLLEGE_CODE = "SUU";
export const DEGREE_CODE = "BE";

export const ROLES = ["ADMIN", "DEAN", "DIRECTOR", "TEACHER", "STUDENT", "PARENT"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "College Office",
  DEAN: "Dean",
  DIRECTOR: "Director",
  TEACHER: "Teacher",
  STUDENT: "Student",
  PARENT: "Parent",
};

/** Where each role lands after login. */
export const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/admin",
  DEAN: "/dean",
  DIRECTOR: "/director",
  TEACHER: "/teacher",
  STUDENT: "/student",
  PARENT: "/parent",
};

/** Minimum attendance percentage before a student is flagged. */
export const ATTENDANCE_THRESHOLD = 75;

export const DAYS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

/** Period timings, index = period number. */
export const PERIODS: Record<number, { start: string; end: string }> = {
  1: { start: "09:00", end: "09:55" },
  2: { start: "10:00", end: "10:55" },
  3: { start: "11:00", end: "11:55" },
  4: { start: "12:00", end: "12:55" },
  5: { start: "14:00", end: "14:55" },
};
export const PERIODS_PER_DAY = 5;
export const WORKING_DAYS = 5; // Monday to Friday

export const ASSESSMENT_STATUS = ["DRAFT", "SUBMITTED", "DIRECTOR_APPROVED", "PUBLISHED"] as const;
export type AssessmentStatus = (typeof ASSESSMENT_STATUS)[number];

/** Director / Teacher / Student screens turn red at this many pending tasks. */
export const RED_THEME_AT = 3;

export const LEAVE_KINDS = { CASUAL: "Casual", MEDICAL: "Medical", DUTY: "On duty", OTHER: "Other" } as const;
export const REQUEST_KINDS = { EVENT: "Event", BUDGET: "Budget", COURSE: "New course", OTHER: "Other" } as const;
export const EVENT_KINDS = { EXAM: "Exam", HOLIDAY: "Holiday", EVENT: "Event", MEETING: "Meeting", DEADLINE: "Deadline" } as const;

/** Uploads for assignments. */
export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
export const UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;
