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

1. Parent website ✅
2. Teacher: take attendance, proctor class, marks entry, red/light theme
3. Student dashboard
4. Director: department dashboard, approvals, low-attendance list
5. Dean: college dashboard, publishing results, reports
6. Admin panel + Excel import
7. Mobile app
