# CampusConnect

The complete college portal for **Engineering College** (working name). One website with six kinds of login, each with its own dashboard.

| Role | Login ID | Example | Theme |
|---|---|---|---|
| College Office (admin) | `ADMIN-xxxx` | `ADMIN-0001` | fixed teal |
| Dean (head of college) | `DEAN-xxxx` | `DEAN-0001` | fixed teal |
| Director (one per department) | `DIR-xxxx` | `DIR-0001` | **red / light** |
| Teacher | `TCH-xxxx` | `TCH-0001` | **red / light** |
| Student | year + `SUU` + `BE` + dept + roll | `24SUUBECS0045` | **red / light** |
| Parent | student ID + `P` | `24SUUBECS0045P` | fixed teal, phone layout |

Department codes inside student IDs: `CS` = CSE, `DS` = Data Science, `AI` = AIML.

**Red / light theme:** Director, Teacher and Student screens turn **red when 3 or more tasks are pending** and switch to the **light theme** when fewer are left. With 1–2 tasks a calm reminder shows; with none, a green "All caught up" banner shows. The rules are in `src/lib/pending.ts` (`RED_THEME_AT` in `src/lib/constants.ts`).

---

## Where to add the API keys

1. Copy `.env.example` to a new file called `.env` in the project folder.
2. Paste the four Gemini keys between the quotes:

```
GEMINI_KEY_PARENT="..."       # Gemini 1: parent AI assistant + weekly progress summary
GEMINI_KEY_ASSIGNMENT="..."   # Gemini 2: AI checking of student assignments
GEMINI_KEY_TEACHER="..."      # Gemini 3: teacher AI helper + proctor class summary
GEMINI_KEY_ALERTS="..."       # Gemini 4: at-risk student alerts for Directors
```

3. Restart the site (`npm run dev`, or `npm run build && npm start` in production).

That's all: no code changes needed. If a key is missing, only that AI feature shows "not switched on"; everything else keeps working. `GEMINI_API_KEY` is an optional fallback used by any feature whose own key is empty. Keys are never sent to the browser and `.env` is never uploaded to GitHub.

Tips: create each key in a **separate Google Cloud project** (limits are per project), and use a **billed project** before real student data goes in. Daily per-user limits (`AI_LIMIT_*`) keep costs predictable.

---

## Run it

Requires **Node.js 18.18+** (20 or 22 recommended).

```bash
npm install
cp .env.example .env      # set AUTH_SECRET to any long random text, add Gemini keys
npm run setup             # creates the database and loads the dummy college
npm run dev               # open http://localhost:3000
```

Every dummy account's password is `Welcome@123` (set by `SEED_DEFAULT_PASSWORD`).

### Demo logins and what to try

| Login | Try this |
|---|---|
| `TCH-0001` | Red theme (missed attendance, 19 AI-checked submissions, a parent message, a meeting request). Take attendance, approve AI marks, reply to the parent. The screen turns light once fewer than 3 tasks remain. |
| `24SUUBECS0045` | Student with low attendance (red). Submit Assignment 2 with typed text or a photo; AI feedback appears in seconds. |
| `24SUUBECS0001` | Student in good standing. |
| `24SUUBECS0045P` | Parent (phone layout): attendance warning, Ask AI in English/Kannada/Hindi, weekly AI summary, messages, meeting requests. |
| `DIR-0001` | CSE Director, red: approve CSE-C DBMS marks, two leave requests, inform parents of low-attendance students, AI at-risk alerts. |
| `DIR-0002` | Data Science Director, light theme. |
| `DEAN-0001` | Publish CSE-B OS results, approve the AIML hackathon budget, compare departments, download reports. |
| `ADMIN-0001` | College Office: reset passwords, add students/staff, import from Excel, record fee payments. |

The dummy data is generated relative to the day you run `npm run setup`, so "today's" classes and due dates always look current. Run `npm run db:reset` any time to start fresh.

---

## What each role can do

**Parent** (phone-style website): child's attendance with the "attend the next N classes" warning, today's classes (present/absent), published marks with class average and printable report card, fees and receipts, messages with the proctor, meeting requests, college notices, **Ask AI**, weekly **AI progress summary**, change password.

**Student:** dashboard with pending tasks, attendance by subject, weekly timetable, marks and report card, **assignments** (type an answer or upload a photo/PDF, max 5 MB; AI checks it and gives feedback; marks show after the teacher approves), fees, notices and calendar.

**Teacher:** today's classes, **take attendance** (everyone starts Present, tap absentees, editable until midnight), **My proctor class** (all 60 students across every subject, student pages with marks, fees, mentoring notes and parent messaging, AI class summary), **marks entry** (draft then submit to Director; sent-back marks show the Director's note), **assignments** (create with a hidden answer key, AI checks submissions, approve/change/return), messages and meeting requests, timetable, leave applications, **AI helper** (draft parent messages in English/Kannada/Hindi, generate questions).

**Director:** department overview, **marks approval** with statistics (approve or send back), **leave requests**, **low attendance** with one-click parent warnings, **AI at-risk alerts**, student search, teachers and workload, class timetables, requests to the Dean, department notices and calendar, CSV reports.

**Dean:** college overview and department comparison, **publish results** (Teacher → Director → Dean → students and parents see them), **approvals** of Director requests, departments and Director assignment, student search, college notices and academic calendar, CSV reports.

**College Office:** search any account and **reset passwords**, **add students** (parent login created automatically), **import students from Excel/CSV**, add staff (Teacher, Director, Dean, Office), set proctors and subject teachers, **edit each class's weekly timetable** (double-booking is refused), **record fee payments** (receipt numbers generated) and add fee items, CSV reports.

---

## Handing over to the college

1. **Database:** local development uses SQLite. For production, change `provider = "sqlite"` to `"postgresql"` in `prisma/schema.prisma`, set `DATABASE_URL` to a Postgres database and run `npx prisma db push`.
2. **Secrets:** set a long random `AUTH_SECRET`. Login cookies are HTTPS-only in production; on a plain-HTTP campus server set `COOKIE_SECURE=false`.
3. **Real data:** sign in as `ADMIN-0001` → add staff → set proctors/subject teachers → **Import from Excel** (template provided on that page). Do not run `npm run setup` on the real database: it wipes all data and reloads the dummy college.
4. **First passwords:** every new account must change its first-time password; a reminder shows until they do.
5. **Uploads:** assignment files are stored in the database (max 5 MB each), so backups of the database include them.

## Known limits

- Online fee payment (e.g. Razorpay) and SMS/WhatsApp alerts are not connected; payments are recorded by the office and alerts appear inside the portal.
- On Postgres, name search is case-sensitive (IDs are not).

## Project layout

```
prisma/schema.prisma        all tables
prisma/seed.ts              loads the dummy college (npm run setup / db:reset)
prisma/data/generate.ts     dummy-data generator (pure, tested by check.ts)
src/app/<role>/             pages for admin, dean, director, teacher, student, parent
src/app/<role>/actions.ts   server actions (every one checks the role and ownership)
src/app/api/                CSV reports, file downloads, import template
src/components/             shell (sidebar + themes), UI pieces, forms
src/lib/pending.ts          pending-work rules that drive the red/light theme
src/lib/ai/                 Gemini client, daily limits, assignment checker, student context
src/lib/risk.ts             at-risk rules used by AI alerts
```

Useful commands: `npm run db:reset`, `npm run check:data`, `npx prisma studio` (browse the database), `npm run build`.
