# 💬 RealTime Chat Web App

A modern **WhatsApp-inspired Real-Time Chat Application** built using the **MERN Stack**. The project focuses on scalable architecture, clean code practices, real-time communication, and modern UI/UX. It is being developed as a **Master's Project** while following production-level development workflows.

---

## 🚀 Current Progress

### ✅ Project Setup

- React + Vite frontend
- Express.js backend
- Modular folder structure
- Environment variable management
- GitHub repository
- CI/CD setup

### ✅ Frontend

- React 19
- Tailwind CSS v4
- shadcn/ui
- React Router DOM
- Axios Instance
- Welcome Page
- Register Page (UI)
- Routing Structure

### ✅ Backend

- Express Server
- Modular Express App
- MongoDB Atlas Connection
- Environment Configuration
- MVC Architecture
- User Model
- Authentication Routes
- Register Controller
- Zod Validation Middleware
- Password Hashing with bcrypt

### ✅ Deployment

- Frontend deployed on Vercel
- Backend deployed on Railway
- Automatic deployment on every GitHub push

---

# 🛠 Tech Stack

## Frontend

- React
- Vite
- Tailwind CSS v4
- shadcn/ui
- React Router DOM
- Axios
- React Hook Form _(In Progress)_
- Zod _(In Progress)_
- Lucide React
- Sonner _(Planned)_

## Backend

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- bcryptjs
- Zod
- dotenv
- CORS

## Deployment

- Vercel
- Railway
- GitHub

---

# 📂 Project Structure

```text
RealTimeChatWebApp/
│
├── frontend/
│   │
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js
│   │   │
│   │   ├── components/
│   │   │   └── ui/
│   │   │
│   │   ├── pages/
│   │   │   ├── Welcome.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Chat.jsx
│   │   │
│   │   ├── routes/
│   │   │   └── AppRoutes.jsx
│   │   │
│   │   ├── validations/
│   │   │   └── auth.validation.js
│   │   │
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── .env
│   └── package.json
│
└── backend/
    │
    ├── src/
    │   │
    │   ├── config/
    │   │   ├── db.js
    │   │   └── env.js
    │   │
    │   ├── controllers/
    │   │   └── auth.controller.js
    │   │
    │   ├── middlewares/
    │   │   └── validate.middleware.js
    │   │
    │   ├── models/
    │   │   └── user.model.js
    │   │
    │   ├── routes/
    │   │   └── auth.route.js
    │   │
    │   ├── validations/
    │   │   └── auth.validation.js
    │   │
    │   ├── app.js
    │   └── server.js
    │
    ├── .env
    └── package.json
```

---

# ✨ Current Features

- Express API setup
- MongoDB Atlas connection
- User Registration API
- Zod request validation
- Password hashing using bcrypt
- Modular backend architecture
- Frontend to backend communication using Axios
- Environment-based configuration
- Automatic deployment pipeline

---

# 📡 API Endpoints

## Test API

```http
GET /
```

Response

```json
{
  "message": "Backend is running"
}
```

---

## Register User

```http
POST /api/auth/register
```

Request

```json
{
  "firstName": "Saurav",
  "lastName": "Rajput",
  "email": "saurav@example.com",
  "dateOfBirth": "2002-06-15",
  "password": "Password@123",
  "confirmPassword": "Password@123"
}
```

Successful Response

```json
{
  "success": true,
  "message": "Registration successful. Please log in."
}
```

---

# 🔒 Validation

Current backend validation uses **Zod**.

### Register Rules

| Field            | Validation                                |
| ---------------- | ----------------------------------------- |
| First Name       | Required • 2-30 Characters • Letters Only |
| Last Name        | Required • 2-30 Characters • Letters Only |
| Email            | Valid Email                               |
| Date of Birth    | Required • Minimum Age 13                 |
| Password         | Minimum 8 Characters                      |
| Confirm Password | Must Match Password                       |

---

# 🌐 Environment Variables

## Backend

```env
PORT=5000

MONGO_URI=your_mongodb_uri

CLIENT_URL=http://localhost:5173

JWT_SECRET=your_secret

JWT_EXPIRE=7d
```

## Frontend

```env
VITE_API_URL=http://localhost:5000
```

---

# ▶️ Running Locally

## Clone Repository

```bash
git clone <repository-url>

cd RealTimeChatWebApp
```

---

## Backend

```bash
cd backend

npm install

npm run dev
```

Server

```
http://localhost:5000
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend

```
http://localhost:5173
```

---

# 🚀 Deployment

| Service  | Platform      |
| -------- | ------------- |
| Frontend | Vercel        |
| Backend  | Railway       |
| Database | MongoDB Atlas |

The application is configured for **continuous deployment**.

Every push to the **main** branch automatically redeploys the latest version.

---

# 🗺 Roadmap

## Phase 1

- ✅ Project Setup
- ✅ Register API
- 🔄 Register UI
- 🔄 Login API
- 🔄 Login UI
- 🔄 JWT Authentication

## Phase 2

- Protected Routes
- Authentication Middleware
- User Session
- Logout

## Phase 3

- User Search
- Profile Page
- Edit Profile
- Profile Picture Upload

## Phase 4

- One-to-One Chat
- Message Storage
- Chat Sidebar
- Recent Conversations

## Phase 5

- Socket.io Integration
- Real-Time Messaging
- Online Status
- Typing Indicator
- Read Receipts

## Phase 6

- Group Chats
- Image Sharing
- File Sharing
- Cloudinary Integration
- Emoji Picker
- Notifications

---

# 📖 Development Workflow

Each feature follows a structured workflow:

```
Planning
        ↓
Database Design
        ↓
API Design
        ↓
Backend Development
        ↓
Postman Testing
        ↓
Frontend Development
        ↓
Integration Testing
        ↓
Git Commit
        ↓
Automatic Deployment
```

---

# 🎯 Project Goal

The objective of this project is to build a **production-inspired real-time chat application** using the MERN Stack that demonstrates:

- Clean Architecture
- REST API Design
- Authentication & Authorization
- Real-Time Communication with Socket.io
- Modern React Development
- Responsive UI Design
- Secure Backend Practices
- CI/CD Deployment Workflow

This project serves as both a **Master's Project** and a **portfolio-ready application** for software engineering placements.
