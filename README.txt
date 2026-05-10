TEAM TASK MANAGER — TaskFlow
=============================

LIVE URL
--------
https://confident-communication-production-6fbf.up.railway.app

GITHUB REPOSITORY
-----------------
https://github.com/ajithanusree1-cmyk/team-task-manager

BACKEND API
-----------
https://team-task-manager-production-6f47.up.railway.app/api

TECH STACK
----------
Backend  : Django 6.0, Django REST Framework, JWT Authentication
Frontend : React 18, Vite, TailwindCSS, Axios
Database : PostgreSQL (Railway)
Hosting  : Railway

FEATURES
--------
1. Authentication
   - Signup / Login with JWT tokens
   - Forgot Password with OTP
   - Profile settings (edit name, email, password)

2. Role-Based Access Control
   - Admin: Full control (create projects, assign tasks, manage members)
   - Member: View assigned tasks, update task status only

3. Project Management
   - Admin can create, edit, delete projects
   - Admin can add/remove members (min 2, max 7 per project)
   - Each project has a unique Project ID

4. Task Management
   - Admin creates and assigns tasks to members
   - Tasks have status (To Do, In Progress, Done)
   - Tasks have priority (Low, Medium, High)
   - Due date tracking with overdue detection

5. Dashboard
   - Admin: Total projects, tasks, members, overdue stats
   - Member: Personal tasks, assigned work, overdue alerts

6. AI Chatbot
   - Built-in AI assistant for both admin and members
   - Context-aware (knows user's tasks and projects)

API ENDPOINTS
-------------
POST   /api/auth/register/            Register user
POST   /api/auth/login/               Login
GET    /api/auth/me/                  Current user
PATCH  /api/auth/me/                  Update profile
POST   /api/auth/me/change-password/  Change password
POST   /api/auth/forgot-password/     Request OTP
POST   /api/auth/verify-otp/          Verify OTP
POST   /api/auth/reset-password/      Reset password
GET    /api/auth/users/               List all users
GET    /api/projects/                 List projects
POST   /api/projects/                 Create project
GET    /api/projects/:id/             Project detail
POST   /api/projects/:id/members/     Add member
DELETE /api/projects/:id/members/     Remove member
GET    /api/projects/:id/tasks/       Project tasks
POST   /api/projects/:id/tasks/       Create task
GET    /api/tasks/                    All tasks
PATCH  /api/tasks/:id/                Update task
DELETE /api/tasks/:id/                Delete task
GET    /api/dashboard/                Dashboard stats

HOW TO RUN LOCALLY
------------------
Backend:
  cd backend
  python -m venv venv
  venv\Scripts\activate
  pip install -r requirements.txt
  python manage.py migrate
  python manage.py runserver

Frontend:
  cd frontend
  npm install
  npm run dev

Open: http://localhost:5173

TEST ACCOUNTS
-------------
Register as Admin role to get full access.
Register as Member role to see member dashboard.