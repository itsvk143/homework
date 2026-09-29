# ClassBoard — Complete Homework Tracking & Question-Level Progress Platform

Production-ready platform combining the Academic Hierarchy (Subject → Book → Chapter → Exercise) with question-level homework progress tracking, teacher verification, bulk homework assignment, and React Native mobile application.

## Quick Start

### 1. Web Application & Backend (Next.js 16 + Prisma SQLite)

```bash
# Install dependencies (already completed)
npm install

# Push database schema & seed demo data
npx prisma db push
npx tsx prisma/seed.ts

# Start the dev server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Demo User Accounts

Use the **Persona Switcher** in the top navigation bar to switch between roles instantly:

| Role | Name | Email | Password | Details |
|---|---|---|---|---|
| **Student** | Rahul Kumar | `rahul@classboard.com` | `student123` | Class 8-A (Roll #14) |
| **Student** | Priya Patel | `priya@classboard.com` | `student123` | Class 8-A (Roll #22) |
| **Teacher** | Mrs. Sunita Sharma | `teacher@classboard.com` | `teacher123` | Mathematics & Science Coordinator |
| **Teacher** | Mr. R. K. Verma | `verma@classboard.com` | `teacher123` | Science & English |
| **Admin** | Dr. Arvind Gupta | `admin@classboard.com` | `admin123` | Principal / Administrator |

---

## 3. Key Features

- **Master Book Library (NCERT & Competitive Exam Books)**:
  - Preloaded with authentic **NCERT curriculum for Classes 4 through 12** with real textbook titles and chapters (Math-Magic, Looking Around, Ganita Prakash, Curiosity, Exploring Society, Secondary Mathematics, Science, Senior Secondary Physics, Chemistry, Biology, Mathematics).
  - Preloaded **JEE Main & Advanced reference books** categorized by subject and branch:
    - *Problems in Physical Chemistry for JEE* by Narendra Avasthi (Shri Balaji Publications)
    - *Advanced Problems in Organic Chemistry for JEE* by M. S. Chouhan (Shri Balaji Publications)
    - *Advanced Problems in Organic Chemistry for JEE* by Himanshu Pandey (GRB Publications)
  - Preloaded **NEET Medical reference books** kept cleanly distinct:
    - *Objective Physical Chemistry for NEET* by Narendra Avasthi (Shri Balaji Publications)
    - *Elementary Problems in Organic Chemistry for NEET* by M. S. Chouhan (Shri Balaji Publications)
    - *Concepts and Problems in Organic Chemistry for NEET* by Himanshu Pandey (GRB Publications)
- **Authoritative Progress Calculation**: Server enforces $0 \le \text{completed} \le \text{totalQuestions}$, computes percentage and status, and preserves an immutable `HomeworkProgressHistory` log for every attempt.
- **Fast Quick Progress Updater (< 10 seconds)**: Choice between "In Progress" with stepper/slider and 1-click "Completed" with confetti celebration.
- **Bulk Homework Assignment in 3–5 Clicks**: Dynamic cascading filters (Subject → Book → Chapter → Exercise) with multi-student checkboxes.
- **Proof Upload & Verification**: Attach handwritten notebook photos or PDFs. Teachers can verify with 1 click or send back with revision comments.
- **Master Academic Content Tree Builder**: Admin tree view with Delete Protection preventing the removal of exercises referenced by historical homework.
- **Global Search (⌘K)** & CSV Reports Export.
- **React Native Mobile App in `mobile/`**: Plus a live in-browser **"Mobile Preview"** smartphone simulator.
