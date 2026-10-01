# CampusConnect

College portal for **Engineering College** (working name). There is one login for five roles, and each role gets its own dashboard:

| Role | Login ID format | Example | Status |
|---|---|---|---|
| Dean (head of college) | `DEAN-xxxx` | `DEAN-0001` | coming next |
| Director (one per department) | `DIR-xxxx` | `DIR-0001` | coming next |
| Teacher | `TCH-xxxx` | `TCH-0001` | coming next |
| Student | year + `SUU` + `BE` + dept + roll | `24SUUBECS0045` | coming next |
| Parent | student ID + `P` | `24SUUBECS0045P` | **built** |

Department codes inside student IDs: `CS` = CSE, `DS` = Data Science, `AI` = AIML.

## What's built so far

- **Database and dummy data:** 3 departments (CSE 4 classes, Data Science 3, AIML 3), 10 classes of 60 students (600 in total), 600 parent logins, 10 teachers (each the proctor of one class who also teaches in 4 other classes), 3 Directors and 1 Dean. Also included: a clash-free Mon–Fri timetable, about 6 weeks of attendance history, IA-1/lab marks, fee instalments, notices and teacher messages.
- **Login:** ID + password. The ID format tells the system the role; passwords are hashed with bcrypt and the session is kept in a signed, HTTP-only cookie.
- **Parent website (phone-style layout):**
  - Home: attendance %, marks %, fee due, low-attendance warning (with "attend the next N classes to reach 75%"), today's classes with present/absent, latest marks, proctor and notices
  - Attendance: subject-wise bars with a 75% marker and recent absences by date
  - Marks: published tests only, with class average and a printable report card
  - Fees: dues, overdue items, paid receipts
  - Messages: chat with the proctor, meeting requests, college notices
  - Account: student and parent details, change password, sign out
  - **Ask AI** (Gemini): parents ask questions in English, Kannada or Hindi and get answers built only from their own child's data
  - **AI progress summary**: a short weekly note about the child on the home page, cached once per week

## AI (Google Gemini)

Each AI feature has its own key in `.env`:

| Key | Feature | Status |
|---|---|---|
| `GEMINI_KEY_PARENT` | Parent AI assistant + weekly parent summary | built |
| `GEMINI_KEY_ASSIGNMENT` | Checking student notes/assignments (teacher approves the AI's marks) | planned |
| `GEMINI_KEY_TEACHER` | Teacher writing helper + proctor class summaries | planned |
| `GEMINI_KEY_ALERTS` | At-risk student alerts | planned |
| `GEMINI_API_KEY` | Optional fallback for any feature whose key is empty | |

- Create each key in a **separate Google Cloud project**, because Gemini limits are per project.
- Use a **billed (paid) project** before real student data goes in. On the free tier, Google may use requests to improve its products.
- Every user has a daily AI limit per feature (`AI_LIMIT_*` in `.env`), so costs stay predictable.
- The model is set by `GEMINI_MODEL`. If that model is ever retired, the code falls back to `gemini-flash-latest` automatically.
- If no key is set, the AI parts of the site show "not switched on yet" and everything else keeps working.

Code: `src/lib/ai/gemini.ts` (client), `src/lib/ai/limits.ts` (daily limits), `src/lib/ai/studentContext.ts` (the data the AI sees).

## Run it locally

Requires Node.js 18.18 or newer.

```bash
npm install
cp .env.example .env          # then edit AUTH_SECRET
npm run setup                 # creates the database and loads the dummy data
npm run dev                   # http://localhost:3000
```

Demo logins (password for all of them: `Welcome@123`, set by `SEED_DEFAULT_PASSWORD`):

| Who | ID |
|---|---|
| Parent of a student with low attendance | `24SUUBECS0045P` |
| Parent of a student with good attendance | `24SUUBECS0001P` |
| Teacher (proctor of CSE-A) | `TCH-0001` |
| Director, CSE | `DIR-0001` |
| Dean | `DEAN-0001` |

Other useful commands:

```bash
npm run db:reset     # wipe and reload the dummy data
npm run check:data   # sanity checks on the dummy-data generator
npx prisma studio    # browse the database in the browser
```

The dummy data is generated relative to the day you run the seed, so "today's" classes and due dates always look current.

## Theme rules

- **Fixed brand theme** (deep teal, amber logo): login, Dean, Parent.
- **Director, Teacher and Student** switch themes based on their own pending work: **red** while there is a lot pending, **light** once everything is done. This will be built with those dashboards.

Colour tokens live in `tailwind.config.ts`.

## Project layout

```
prisma/
  schema.prisma          database tables
  seed.ts                loads the dummy data
  data/generate.ts       dummy-data generator (pure, testable)
  data/check.ts          checks for the generator
src/
  app/
    login/               login page
    parent/              parent website (layout, pages, server actions)
    dean/ director/ teacher/ student/   placeholders for now
    actions/auth.ts      login, logout, change password
  components/            shared UI (logo, icons, forms)
  lib/
    auth.ts session.ts   session cookie and role checks
    db.ts                Prisma client
    queries/student.ts   attendance, marks, fees, notices for one student
    attendance.ts        75% maths
    ids.ts               login ID formats
    dates.ts             India-timezone date helpers
```

## Handing over to the college

1. **Database:** the project uses SQLite for local development. For a real deployment, change `provider = "sqlite"` to `"postgresql"` in `prisma/schema.prisma` and point `DATABASE_URL` at a Postgres database.
2. **Secrets:** set a long random `AUTH_SECRET` in production.
3. **HTTPS:** login cookies are HTTPS-only in production. If the college runs the portal on a plain-HTTP internal server, set `COOKIE_SECURE=false`.
4. **Real data:** the college office will replace the dummy data with real students, staff and parents. An admin panel and Excel/CSV import are planned.
5. **Passwords:** every account starts with the default password. Parents see a reminder to change it until they do; the other roles will get the same reminder.

## Roadmap

1. Parent website ✅ (with AI assistant and weekly summary ✅)
2. Teacher: take attendance, proctor class, marks entry, red/light theme (red at 3 or more pending tasks), AI writing helper
3. Student assignment upload with AI checking (teacher approves the marks)
4. Student dashboard
5. Director: department dashboard, approvals, low-attendance list, at-risk alerts
6. Dean: college dashboard, publishing results, reports
7. Admin panel + Excel import
8. Mobile app
