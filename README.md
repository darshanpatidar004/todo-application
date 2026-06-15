# Full Stack To-Do List Application

A production-ready, cross-platform To-Do List application built with FastAPI and React Native (Expo).

## Tech Stack

### Backend
- **Framework:** FastAPI
- **Database:** SQLite (SQLAlchemy ORM)
- **Auth:** JWT (Access & Refresh Tokens)
- **Validation:** Pydantic v2
- **Hashing:** bcrypt

### Frontend
- **Framework:** React Native (Expo)
- **Styling:** NativeWind (TailwindCSS)
- **State Management:** Zustand
- **Data Fetching:** TanStack Query (React Query)
- **Navigation:** React Navigation
- **Forms:** React Hook Form

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment and install dependencies:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
3. Run the development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The API will be available at `http://localhost:8000`.
   API Documentation (Swagger): `http://localhost:8000/docs`.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Expo development server:
   ```bash
   npx expo start
   ```
4. Press `w` for Web, or use the Expo Go app on your phone to scan the QR code for iOS/Android.

## Features

- **Authentication:** Secure Register/Login with JWT tokens and persistent sessions.
- **Task Management:** CRUD operations for tasks with priority, description, and status.
- **Categorization:** Organize tasks into custom categories.
- **Dashboard:** Overview of your productivity with task statistics.
- **Responsive Design:** Works on Web, iOS, and Android.
- **Dark Mode Support:** Built with themes in mind.

## Architecture

The project follows Clean Architecture principles:
- **Separation of Concerns:** Distinct layers for API, business logic (services), and data access (models/schemas).
- **Type Safety:** Full TypeScript on the frontend and Pydantic on the backend.
- **Scalability:** Modular structure allowing for easy expansion.

## Docker Setup

Run the entire stack with Docker Compose:
```bash
docker-compose up --build
```
