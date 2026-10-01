// Pure dummy-data generator. No database access here, so it can be tested on
// its own (see prisma/data/check.ts). prisma/seed.ts writes the result to the DB.
//
// Shape of the dummy college:
//   3 departments: CSE (4 classes), Data Science (3), AIML (3)
//   10 classes x 60 students = 600 students, each with a parent login
//   10 teachers: teacher N is proctor of class N and also teaches 4 other classes
//   3 Directors (one per department) and 1 Dean
//   Timetable: Mon-Fri, 5 periods a day, 5 subjects per class, no teacher clashes

import { makeStudentId, parentIdFor } from "../../src/lib/ids";
import { addDays, isoWeekday } from "../../src/lib/dates";
import { PERIODS_PER_DAY, WORKING_DAYS } from "../../src/lib/constants";

// ---------- deterministic random numbers ----------
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rng = () => number;
const pick = <T>(rng: Rng, xs: readonly T[]): T => xs[Math.floor(rng() * xs.length)];
const between = (rng: Rng, lo: number, hi: number) => lo + rng() * (hi - lo);
/** Approximately normal (sum of uniforms). */
const normal = (rng: Rng, mean: number, sd: number) => mean + sd * ((rng() + rng() + rng() + rng() + rng() + rng() - 3) / 0.7071);

// ---------- static data ----------
export const ADMISSION_YEAR = 2024;
export const SEMESTER = 5;

export const DEPARTMENTS = [
  { id: "CSE", code: "CS", name: "Computer Science & Engineering", sections: ["A", "B", "C", "D"] },
  { id: "DS", code: "DS", name: "Data Science", sections: ["A", "B", "C"] },
  { id: "AIML", code: "AI", name: "Artificial Intelligence & Machine Learning", sections: ["A", "B", "C"] },
] as const;

// Exactly 5 subjects per department; index 4 is the lab.
export const SUBJECTS: Record<string, { name: string; short: string; isLab?: boolean }[]> = {
  CSE: [
    { name: "Data Structures", short: "DS" },
    { name: "Database Management Systems", short: "DBMS" },
    { name: "Operating Systems", short: "OS" },
    { name: "Computer Networks", short: "CN" },
    { name: "DBMS Lab", short: "DBMS Lab", isLab: true },
  ],
  DS: [
    { name: "Machine Learning", short: "ML" },
    { name: "Big Data Analytics", short: "BDA" },
    { name: "Data Visualization", short: "DV" },
    { name: "Probability & Statistics", short: "P&S" },
    { name: "ML Lab", short: "ML Lab", isLab: true },
  ],
  AIML: [
    { name: "Artificial Intelligence", short: "AI" },
    { name: "Deep Learning", short: "DL" },
    { name: "Natural Language Processing", short: "NLP" },
    { name: "Computer Vision", short: "CV" },
    { name: "AI Lab", short: "AI Lab", isLab: true },
  ],
};

export const ADMIN = { id: "ADMIN-0001", name: "College Office", email: "office@engineeringcollege.edu.in", phone: "9845000001" };
export const DEAN = { id: "DEAN-0001", name: "Dr. Ramesh Kumar", email: "dean@engineeringcollege.edu.in", phone: "9845001001" };

export const DIRECTORS = [
  { id: "DIR-0001", name: "Dr. Anil Menon", departmentId: "CSE", phone: "9845002001" },
  { id: "DIR-0002", name: "Dr. Kavya Rao", departmentId: "DS", phone: "9845002002" },
  { id: "DIR-0003", name: "Dr. Sameer Joshi", departmentId: "AIML", phone: "9845002003" },
];

// Teacher N (1-based) is proctor of class N in CLASS order below.
const TEACHER_NAMES = [
  "Prof. Arjun Shetty",
  "Prof. Neha Iyer",
  "Prof. Rahul Desai",
  "Prof. Divya Nair",
  "Prof. Kiran Kumar",
  "Prof. Meera Krishnan",
  "Prof. Suresh Babu",
  "Prof. Pallavi Kulkarni",
  "Prof. Vikram Rao",
  "Prof. Fatima Sheikh",
];

const FIRST = [
  "Aarav", "Aditi", "Akash", "Ananya", "Arjun", "Bhavya", "Chirag", "Deepika", "Dhruv", "Diya",
  "Farhan", "Gauri", "Harsh", "Ishaan", "Ishita", "Jahnavi", "Karthik", "Kavya", "Krishna", "Lakshmi",
  "Manav", "Meghana", "Mohit", "Naveen", "Nikita", "Omkar", "Pooja", "Pranav", "Priya", "Rahul",
  "Riya", "Rohan", "Sahil", "Samarth", "Sanjana", "Shreya", "Siddharth", "Sneha", "Tanvi", "Tejas",
  "Uday", "Varun", "Vidya", "Vikas", "Yash", "Zoya", "Abhishek", "Anjali", "Imran", "Keerthi",
];
const LAST = [
  "Sharma", "Reddy", "Kulkarni", "Jain", "Rao", "Ali", "Deshpande", "Menon", "Bhat", "Pillai",
  "Gupta", "Joshi", "Naik", "Hegde", "Verma", "Shetty", "Khan", "Kamath", "Gowda", "Patil",
  "Iyer", "Nair", "Mehta", "Shaikh", "Desai", "Prabhu", "Kumar", "Agarwal", "Singh", "Das",
];
const PARENT_FIRST = ["Ravi", "Suresh", "Mahesh", "Prakash", "Ramesh", "Vinod", "Anand", "Sunil", "Manoj", "Rajesh", "Sanjay", "Ashok"];

// A few fixed students so demo screens show familiar names.
const FIXED_STUDENTS: Record<string, { name: string; rate: number }> = {
  "24SUUBECS0001": { name: "Aarav Sharma", rate: 0.93 },
  "24SUUBECS0002": { name: "Ananya Reddy", rate: 0.89 },
  "24SUUBECS0004": { name: "Chirag Jain", rate: 0.85 },
  "24SUUBECS0012": { name: "Kunal Mehta", rate: 0.71 },
  "24SUUBECS0033": { name: "Priya Nair", rate: 0.73 },
  "24SUUBECS0045": { name: "Sneha Patil", rate: 0.66 },
};

// One homework question per theory subject (index 0..3), with a short model answer.
const HOMEWORK: Record<string, { q: string; key: string }[]> = {
  CSE: [
    { q: "Explain the difference between a stack and a queue. Give one real-world example of each.", key: "Stack is LIFO (push/pop at one end), e.g. undo in an editor or plates. Queue is FIFO (enqueue at rear, dequeue at front), e.g. a ticket line or printer jobs. Mention operations and order." },
    { q: "What is normalisation in DBMS? Explain 1NF, 2NF and 3NF with a small example.", key: "Normalisation removes redundancy/anomalies. 1NF: atomic values, no repeating groups. 2NF: 1NF + no partial dependency on part of a composite key. 3NF: 2NF + no transitive dependency. Example table split." },
    { q: "What is a deadlock? List the four necessary conditions for deadlock.", key: "Deadlock: processes wait forever for resources held by each other. Conditions: mutual exclusion, hold and wait, no preemption, circular wait." },
    { q: "Compare TCP and UDP. When would you prefer UDP?", key: "TCP: connection-oriented, reliable, ordered, flow/congestion control, slower. UDP: connectionless, no guarantee, low overhead, faster. Prefer UDP for live video, voice, gaming, DNS." },
  ],
  DS: [
    { q: "Explain overfitting in machine learning and two ways to reduce it.", key: "Overfitting: model learns noise, high train accuracy but poor test accuracy. Reduce with more data, regularisation (L1/L2), cross-validation, simpler model, dropout, early stopping." },
    { q: "What are the 5 Vs of Big Data? Explain each briefly.", key: "Volume (size), Velocity (speed of generation), Variety (types/formats), Veracity (quality/trust), Value (usefulness)." },
    { q: "When would you use a bar chart vs a line chart vs a scatter plot?", key: "Bar: compare categories. Line: trend over time/ordered x. Scatter: relationship/correlation between two numeric variables." },
    { q: "Define mean, median and mode. Which is better for skewed data and why?", key: "Mean: average. Median: middle value. Mode: most frequent. Median is better for skewed data because it is not pulled by outliers." },
  ],
  AIML: [
    { q: "Compare BFS and DFS search. Which one guarantees the shortest path in an unweighted graph?", key: "BFS explores level by level using a queue; DFS goes deep using a stack/recursion. BFS guarantees shortest path in unweighted graphs. Mention memory/time trade-offs." },
    { q: "What is the vanishing gradient problem and how do ReLU and residual connections help?", key: "Gradients shrink through many layers (sigmoid/tanh), early layers learn slowly. ReLU has gradient 1 for positive inputs; residual/skip connections give a direct gradient path." },
    { q: "Explain tokenisation and stemming in NLP with an example.", key: "Tokenisation splits text into tokens/words, e.g. 'I am learning' -> [I, am, learning]. Stemming cuts words to a root, e.g. learning/learned -> learn." },
    { q: "What does a convolution layer do in a CNN? Explain kernel, stride and padding.", key: "Convolution slides a kernel/filter over the image to extract features. Kernel: small weight matrix. Stride: step size. Padding: border added to keep size." },
  ],
};

// ---------- output types ----------
export interface GenUser { id: string; role: string; name: string; email: string | null; phone: string | null }
export interface GenClass { id: string; name: string; departmentId: string; semester: number; section: string; proctorId: string; index: number }
export interface GenTeacher { id: string; departmentId: string; designation: string }
export interface GenSubject { id: string; name: string; shortName: string; departmentId: string; semester: number; isLab: boolean }
export interface GenStudent { id: string; classId: string; rollNo: number; admissionYear: number; parentId: string; guardianName: string; dateOfBirth: Date; rate: number; ability: number }
export interface GenAssignment { id: number; teacherId: string; classId: string; subjectId: string; subjectIndex: number }
export interface GenSlot { classId: string; day: number; period: number; assignmentId: number; room: string }
export interface GenSession { id: number; assignmentId: number; date: Date; period: number; takenById: string; takenAt: Date }
export interface GenRecord { sessionId: number; studentId: string; status: "P" | "A" }
export interface GenAssessment { id: number; assignmentId: number; name: string; maxMarks: number; heldOn: Date | null; status: string; publishedAt: Date | null }
export interface GenMark { assessmentId: number; studentId: string; score: number | null; absent: boolean }
export interface GenInvoice { studentId: string; title: string; amount: number; dueDate: Date; paidAt: Date | null; receiptNo: string | null; mode: string | null }
export interface GenNotice { title: string; body: string; audience: string; departmentId: string | null; authorId: string; createdAt: Date }
export interface GenLeave { teacherId: string; fromDate: Date; toDate: Date; kind: string; reason: string; status: string; reviewedById: string | null; decidedAt: Date | null; createdAt: Date }
export interface GenDeanRequest { departmentId: string; createdById: string; kind: string; title: string; details: string; amount: number | null; status: string; reply: string | null; createdAt: Date; decidedAt: Date | null }
export interface GenEvent { title: string; date: Date; kind: string; departmentId: string | null; createdById: string }
export interface GenCoursework { id: number; assignmentId: number; title: string; instructions: string; answerKey: string; maxMarks: number; dueDate: Date; createdAt: Date }
export interface GenSubmission { courseworkId: number; studentId: string; text: string; submittedAt: Date; status: string; aiScore: number | null; aiFeedback: string | null; aiCheckedAt: Date | null; finalScore: number | null; teacherComment: string | null; reviewedAt: Date | null }
export interface GenMeeting { parentId: string; teacherId: string; studentId: string; preferredDate: Date; reason: string; status: string; createdAt: Date }
export interface GenMessage { fromId: string; toId: string; studentId: string | null; body: string; createdAt: Date }

/**
 * Which subject (0..4) every class has in a given day/period.
 * Class c's subject k is taught by teacher (c + k) mod 10, so when every class
 * has the same subject index k, the teachers are c + k for c = 0..9: all
 * different, so nobody is double-booked. Each k appears 5 times a week.
 */
export function subjectIndexForSlot(day: number, period: number): number {
  return (day + period) % 5;
}
export function teacherIndexFor(classIndex: number, subjectIndex: number): number {
  return (classIndex + subjectIndex) % 10;
}

export interface GenerateOptions {
  /** "Today" in India as midnight UTC. */
  today: Date;
  /** How many calendar days of attendance history to create. */
  historyDays?: number;
  /** Periods already taken today (default: periods 1-2). */
  periodsTakenToday?: number;
  seed?: number;
}

export function generate(opts: GenerateOptions) {
  const seed = opts.seed ?? 20261001;
  // Separate streams so people/marks/fees stay the same whatever day the seed
  // runs; only the attendance history depends on the date.
  const rng = mulberry32(seed);
  const rngAtt = mulberry32(seed + 1);
  const rngMarks = mulberry32(seed + 2);
  const today = opts.today;
  const historyDays = opts.historyDays ?? 42;
  const periodsTakenToday = opts.periodsTakenToday ?? 2;

  const users: GenUser[] = [];
  users.push({ id: DEAN.id, role: "DEAN", name: DEAN.name, email: DEAN.email, phone: DEAN.phone });
  users.push({ id: ADMIN.id, role: "ADMIN", name: ADMIN.name, email: ADMIN.email, phone: ADMIN.phone });
  for (const d of DIRECTORS) {
    users.push({ id: d.id, role: "DIRECTOR", name: d.name, email: `${d.id.toLowerCase()}@engineeringcollege.edu.in`, phone: d.phone });
  }

  // Classes in a fixed order; class index == proctor teacher index.
  const classes: GenClass[] = [];
  for (const dept of DEPARTMENTS) {
    for (const section of dept.sections) {
      const index = classes.length;
      classes.push({
        id: `${dept.id}-${section}`,
        name: `${dept.id}-${section}`,
        departmentId: dept.id,
        semester: SEMESTER,
        section,
        proctorId: `TCH-${String(index + 1).padStart(4, "0")}`,
        index,
      });
    }
  }

  const teachers: GenTeacher[] = classes.map((c, i) => ({ id: c.proctorId, departmentId: c.departmentId, designation: i < 3 ? "Associate Professor" : "Assistant Professor" }));
  teachers.forEach((t, i) => {
    users.push({ id: t.id, role: "TEACHER", name: TEACHER_NAMES[i], email: `${t.id.toLowerCase()}@engineeringcollege.edu.in`, phone: `98450030${String(i + 1).padStart(2, "0")}` });
  });

  const subjects: GenSubject[] = [];
  for (const dept of DEPARTMENTS) {
    SUBJECTS[dept.id].forEach((s, k) => {
      subjects.push({ id: `${dept.code}${SEMESTER}0${k + 1}`, name: s.name, shortName: s.short, departmentId: dept.id, semester: SEMESTER, isLab: !!s.isLab });
    });
  }
  const subjectFor = (deptId: string, k: number) => subjects.filter((s) => s.departmentId === deptId)[k];

  // Teaching assignments: class c, subject k -> teacher (c + k) % 10
  const assignments: GenAssignment[] = [];
  for (const c of classes) {
    for (let k = 0; k < 5; k++) {
      assignments.push({
        id: assignments.length + 1,
        teacherId: teachers[teacherIndexFor(c.index, k)].id,
        classId: c.id,
        subjectId: subjectFor(c.departmentId, k).id,
        subjectIndex: k,
      });
    }
  }
  const assignmentFor = (classId: string, k: number) => assignments.find((a) => a.classId === classId && a.subjectIndex === k)!;

  // Timetable
  const slots: GenSlot[] = [];
  for (const c of classes) {
    for (let day = 1; day <= WORKING_DAYS; day++) {
      for (let period = 1; period <= PERIODS_PER_DAY; period++) {
        const k = subjectIndexForSlot(day, period);
        const room = k === 4 ? `Lab ${(c.index % 4) + 1}` : `Room ${100 + (c.index + 1) * 10 + (c.index % 3)}`;
        slots.push({ classId: c.id, day, period, assignmentId: assignmentFor(c.id, k).id, room });
      }
    }
  }

  // Students + parents
  const students: GenStudent[] = [];
  for (const dept of DEPARTMENTS) {
    let roll = 0;
    for (const c of classes.filter((x) => x.departmentId === dept.id)) {
      for (let i = 0; i < 60; i++) {
        roll++;
        const id = makeStudentId(ADMISSION_YEAR, dept.code, roll);
        const fixed = FIXED_STUDENTS[id];
        const last = fixed ? fixed.name.split(" ").slice(-1)[0] : pick(rng, LAST);
        const name = fixed ? fixed.name : `${pick(rng, FIRST)} ${last}`;
        const r = rng();
        const rate = fixed ? fixed.rate : r < 0.05 ? between(rng, 0.58, 0.73) : r < 0.15 ? between(rng, 0.74, 0.82) : between(rng, 0.83, 0.98);
        const ability = fixed ? (fixed.rate > 0.8 ? 0.8 : 0.55) : Math.min(0.97, Math.max(0.25, normal(rng, 0.66, 0.13)));
        const parentName = `${pick(rng, PARENT_FIRST)} ${last}`;
        const dob = new Date(Date.UTC(2005 + Math.floor(rng() * 2), Math.floor(rng() * 12), 1 + Math.floor(rng() * 28)));
        students.push({ id, classId: c.id, rollNo: roll, admissionYear: ADMISSION_YEAR, parentId: parentIdFor(id), guardianName: parentName, dateOfBirth: dob, rate, ability });
        users.push({ id, role: "STUDENT", name, email: `${id.toLowerCase()}@students.engineeringcollege.edu.in`, phone: null });
        users.push({ id: parentIdFor(id), role: "PARENT", name: parentName, email: null, phone: `9${String(Math.floor(rng() * 1e9)).padStart(9, "0")}` });
      }
    }
  }
  const studentsByClass = new Map<string, GenStudent[]>();
  for (const s of students) {
    if (!studentsByClass.has(s.classId)) studentsByClass.set(s.classId, []);
    studentsByClass.get(s.classId)!.push(s);
  }

  // Attendance history: working days from (today - historyDays) to yesterday,
  // plus the first `periodsTakenToday` periods of today.
  const sessions: GenSession[] = [];
  const records: GenRecord[] = [];
  const takeDay = (date: Date, maxPeriod: number) => {
    const day = isoWeekday(date);
    if (day > WORKING_DAYS) return;
    for (const c of classes) {
      for (let period = 1; period <= maxPeriod; period++) {
        const a = assignmentFor(c.id, subjectIndexForSlot(day, period));
        const id = sessions.length + 1;
        sessions.push({ id, assignmentId: a.id, date, period, takenById: a.teacherId, takenAt: new Date(date.getTime() + (3.5 + period) * 3600 * 1000) });
        for (const s of studentsByClass.get(c.id)!) {
          records.push({ sessionId: id, studentId: s.id, status: rngAtt() < s.rate ? "P" : "A" });
        }
      }
    }
  };
  for (let i = historyDays; i >= 1; i--) takeDay(addDays(today, -i), PERIODS_PER_DAY);
  if (periodsTakenToday > 0) takeDay(today, Math.min(periodsTakenToday, PERIODS_PER_DAY));

  // Assessments: IA-1 for theory (max 50), Lab Internal for labs (max 25).
  // Most are published; two are mid-approval to demo the workflow.
  const assessments: GenAssessment[] = [];
  const marks: GenMark[] = [];
  const ia1Date = addDays(today, -20);
  for (const a of assignments) {
    const isLab = a.subjectIndex === 4;
    let status = "PUBLISHED";
    if (a.classId === "CSE-C" && a.subjectIndex === 1) status = "SUBMITTED";
    if (a.classId === "CSE-B" && a.subjectIndex === 2) status = "DIRECTOR_APPROVED";
    const id = assessments.length + 1;
    const maxMarks = isLab ? 25 : 50;
    assessments.push({ id, assignmentId: a.id, name: isLab ? "Lab Internal" : "IA-1", maxMarks, heldOn: ia1Date, status, publishedAt: status === "PUBLISHED" ? addDays(ia1Date, 8) : null });
    for (const s of studentsByClass.get(a.classId)!) {
      const absent = rngMarks() < 0.02;
      const raw = normal(rngMarks, s.ability, 0.1) * maxMarks;
      const score = absent ? null : Math.max(0, Math.min(maxMarks, Math.round(raw)));
      marks.push({ assessmentId: id, studentId: s.id, score, absent });
    }
  }

  // Fees: instalment 1 (paid by all), exam fee, instalment 2.
  const invoices: GenInvoice[] = [];
  let receipt = 1000;
  const modes = ["UPI", "UPI", "BANK", "CARD", "CASH"];
  const receiptNo = () => `ECR-${ADMISSION_YEAR + 2}-${String(++receipt).padStart(5, "0")}`;
  for (const s of students) {
    const inst1Due = addDays(today, -50);
    invoices.push({ studentId: s.id, title: "Semester 5 tuition · Instalment 1", amount: 45000, dueDate: inst1Due, paidAt: addDays(inst1Due, -Math.floor(rngMarks() * 10)), receiptNo: receiptNo(), mode: pick(rngMarks, modes) });
    const examDue = addDays(today, 14);
    const examPaid = rngMarks() < 0.7;
    invoices.push({ studentId: s.id, title: "Semester 5 exam fee", amount: 1500, dueDate: examDue, paidAt: examPaid ? addDays(today, -Math.floor(rngMarks() * 12)) : null, receiptNo: examPaid ? receiptNo() : null, mode: examPaid ? pick(rngMarks, modes) : null });
    const inst2Due = addDays(today, 33);
    const inst2Paid = s.id !== "24SUUBECS0045" && rngMarks() < 0.45;
    invoices.push({ studentId: s.id, title: "Semester 5 tuition · Instalment 2", amount: 18500, dueDate: inst2Due, paidAt: inst2Paid ? addDays(today, -Math.floor(rngMarks() * 15)) : null, receiptNo: inst2Paid ? receiptNo() : null, mode: inst2Paid ? pick(rngMarks, modes) : null });
  }

  const at = (daysAgo: number, hour: number) => new Date(addDays(today, -daysAgo).getTime() + (hour - 5.5) * 3600 * 1000);
  const notices: GenNotice[] = [
    { title: "Internal Assessment 2 timetable", body: "IA-2 for all 5th semester classes starts in two weeks. The subject-wise schedule is available with your proctor and on the notice board.", audience: "ALL", departmentId: null, authorId: DEAN.id, createdAt: at(1, 11) },
    { title: "Parent–teacher meeting", body: "A parent–teacher meeting for all departments will be held on Saturday, 10:00 am to 1:00 pm. Parents can meet the proctor and subject teachers. Please carry your parent ID.", audience: "PARENTS", departmentId: null, authorId: DEAN.id, createdAt: at(3, 10) },
    { title: "Fee instalment 2 reminder", body: "Semester 5 tuition instalment 2 is due next month. Pay at the accounts office (10 am – 4 pm) or by bank transfer. Keep the receipt for your records.", audience: "PARENTS", departmentId: null, authorId: DEAN.id, createdAt: at(5, 9) },
    { title: "Minimum attendance rule", body: "Students need at least 75% attendance in every subject to be eligible for the semester-end exam. Parents of students below 75% will be informed by the proctor.", audience: "ALL", departmentId: null, authorId: DEAN.id, createdAt: at(9, 12) },
    { title: "CSE technical talk on cloud computing", body: "A guest lecture on cloud computing for all CSE students will be held in the seminar hall on Friday at 2 pm. Attendance is compulsory.", audience: "ALL", departmentId: "CSE", authorId: "DIR-0001", createdAt: at(2, 15) },
    { title: "Data Science project expo", body: "5th semester Data Science students will present mini-projects next week. Parents are welcome to attend.", audience: "ALL", departmentId: "DS", authorId: "DIR-0002", createdAt: at(4, 14) },
    { title: "AIML hackathon registrations open", body: "Teams of up to 4 can register with their proctor by Friday. The 24-hour hackathon will be held on campus.", audience: "ALL", departmentId: "AIML", authorId: "DIR-0003", createdAt: at(6, 16) },
  ];

  const messages: GenMessage[] = [
    {
      fromId: "TCH-0001",
      toId: "24SUUBECS0045P",
      studentId: "24SUUBECS0045",
      body: "Namaste. Sneha's attendance has dropped below 75%, especially in Data Structures and Operating Systems. Please make sure she attends regularly. You can request a meeting with me through this portal.",
      createdAt: at(1, 16),
    },
    {
      fromId: "TCH-0001",
      toId: "24SUUBECS0012P",
      studentId: "24SUUBECS0012",
      body: "Kunal's attendance in DBMS is low. Please encourage him to attend all classes this month.",
      createdAt: at(2, 17),
    },
  ];


  messages.push({
    fromId: "24SUUBECS0012P",
    toId: "TCH-0001",
    studentId: "24SUUBECS0012",
    body: "Thank you sir. Kunal was unwell last week. He will attend regularly from now on. Can he get the DBMS notes he missed?",
    createdAt: at(1, 19),
  });

  // Teacher leave requests (two pending in CSE so the Director has work).
  const leaves: GenLeave[] = [
    { teacherId: "TCH-0002", fromDate: addDays(today, 4), toDate: addDays(today, 6), kind: "MEDICAL", reason: "Minor surgery and rest as advised by doctor.", status: "PENDING", reviewedById: null, decidedAt: null, createdAt: at(1, 10) },
    { teacherId: "TCH-0004", fromDate: addDays(today, 8), toDate: addDays(today, 8), kind: "CASUAL", reason: "Family function out of town.", status: "PENDING", reviewedById: null, decidedAt: null, createdAt: at(0, 9) },
    { teacherId: "TCH-0006", fromDate: addDays(today, -10), toDate: addDays(today, -9), kind: "DUTY", reason: "Invited as external examiner at another college.", status: "APPROVED", reviewedById: "DIR-0002", decidedAt: at(14, 12), createdAt: at(15, 11) },
  ];

  const deanRequests: GenDeanRequest[] = [
    { departmentId: "AIML", createdById: "DIR-0003", kind: "BUDGET", title: "24-hour AIML hackathon", details: "Budget for food, prizes and cloud credits for about 120 students. Industry judges have agreed to come.", amount: 120000, status: "PENDING", reply: null, createdAt: at(2, 11), decidedAt: null },
    { departmentId: "DS", createdById: "DIR-0002", kind: "COURSE", title: "New elective: Cloud Computing for Data Science", details: "Proposed open elective for semester 6. Syllabus prepared; two faculty trained.", amount: null, status: "PENDING", reply: null, createdAt: at(3, 15), decidedAt: null },
    { departmentId: "CSE", createdById: "DIR-0001", kind: "EVENT", title: "Guest lecture on cloud computing", details: "Speaker from industry, Friday 2 pm in the seminar hall.", amount: 15000, status: "APPROVED", reply: "Approved. Please share photos for the college newsletter.", createdAt: at(8, 10), decidedAt: at(7, 12) },
  ];

  const events: GenEvent[] = [
    { title: "Internal Assessment 2 begins", date: addDays(today, 14), kind: "EXAM", departmentId: null, createdById: DEAN.id },
    { title: "Parent–teacher meeting (all departments)", date: addDays(today, 9), kind: "MEETING", departmentId: null, createdById: DEAN.id },
    { title: "Semester fee instalment 2 due", date: addDays(today, 33), kind: "DEADLINE", departmentId: null, createdById: DEAN.id },
    { title: "Holiday: Deepavali", date: addDays(today, 27), kind: "HOLIDAY", departmentId: null, createdById: DEAN.id },
    { title: "CSE guest lecture: cloud computing", date: addDays(today, 1), kind: "EVENT", departmentId: "CSE", createdById: "DIR-0001" },
    { title: "Data Science project expo", date: addDays(today, 6), kind: "EVENT", departmentId: "DS", createdById: "DIR-0002" },
    { title: "AIML hackathon", date: addDays(today, 20), kind: "EVENT", departmentId: "AIML", createdById: "DIR-0003" },
  ];

  // Homework: "Assignment 1" for every theory subject (closed, mostly marked),
  // and "Assignment 2" for subject 0 (open, some submissions waiting for review).
  const coursework: GenCoursework[] = [];
  const submissions: GenSubmission[] = [];
  const rngHw = mulberry32(seed + 3);
  for (const a of assignments) {
    if (a.subjectIndex === 4) continue;
    const c = classes.find((x) => x.id === a.classId)!;
    const hw = HOMEWORK[c.departmentId][a.subjectIndex];
    const id1 = coursework.length + 1;
    coursework.push({ id: id1, assignmentId: a.id, title: "Assignment 1", instructions: hw.q, answerKey: hw.key, maxMarks: 10, dueDate: addDays(today, -6), createdAt: addDays(today, -16) });
    for (const s of studentsByClass.get(a.classId)!) {
      if (rngHw() < 0.12) continue; // did not submit
      const score = Math.max(2, Math.min(10, Math.round(normal(rngHw, s.ability, 0.12) * 10)));
      submissions.push({
        courseworkId: id1,
        studentId: s.id,
        text: `My answer: ${hw.key.split(".")[0]}.`,
        submittedAt: addDays(today, -7 - Math.floor(rngHw() * 5)),
        status: "APPROVED",
        aiScore: score,
        aiFeedback: score >= 7 ? "Good answer covering the main points." : "Covers some points; add more detail and an example.",
        aiCheckedAt: addDays(today, -6),
        finalScore: score,
        teacherComment: null,
        reviewedAt: addDays(today, -5),
      });
    }
    if (a.subjectIndex === 0) {
      const id2 = coursework.length + 1;
      const hw2 = HOMEWORK[c.departmentId][(a.subjectIndex + 1) % 4];
      coursework.push({ id: id2, assignmentId: a.id, title: "Assignment 2", instructions: `${hw2.q} Write in your own words.`, answerKey: hw2.key, maxMarks: 10, dueDate: addDays(today, 4), createdAt: addDays(today, -3) });
      for (const s of studentsByClass.get(a.classId)!) {
        if (rngHw() > 0.3) continue;
        const score = Math.max(2, Math.min(10, Math.round(normal(rngHw, s.ability, 0.12) * 10)));
        submissions.push({
          courseworkId: id2,
          studentId: s.id,
          text: `Answer: ${hw2.key}`,
          submittedAt: addDays(today, -1),
          status: "AI_CHECKED",
          aiScore: score,
          aiFeedback: score >= 7 ? "Correct and well explained. Add one example to make it complete." : "Partly correct. Some key points are missing.",
          aiCheckedAt: addDays(today, -1),
          finalScore: null,
          teacherComment: null,
          reviewedAt: null,
        });
      }
    }
  }

  const meetings: GenMeeting[] = [
    { parentId: "24SUUBECS0045P", teacherId: "TCH-0001", studentId: "24SUUBECS0045", preferredDate: addDays(today, isoWeekday(today) >= 5 ? 4 : 1), reason: "To discuss Sneha's attendance and how she can catch up.", status: "PENDING", createdAt: at(0, 9) },
  ];

  return { users, classes, teachers, subjects, assignments, slots, students, sessions, records, assessments, marks, invoices, notices, messages, leaves, deanRequests, events, coursework, submissions, meetings };
}

export type Generated = ReturnType<typeof generate>;
