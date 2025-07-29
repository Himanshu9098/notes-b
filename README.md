# Notes App

A full-stack web application for creating, managing, and authenticating user notes with OTP and Google authentication. The frontend is built with React, TypeScript, and Vite, deployed on Vercel. The backend is built with Node.js, Express, TypeScript, and MongoDB, deployed on Render.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Frontend Setup](#frontend-setup)
- [Backend Setup](#backend-setup)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Future Enhancements](#future-enhancements)

## Features
- **Authentication**:
  - OTP-based sign-up and sign-in with email verification.
  - Google OAuth 2.0 for seamless sign-in/up.
  - "Keep me logged in" option with 7-day JWT tokens stored in `localStorage`.
- **Notes Management**:
  - Create, read, update, and delete (CRUD) notes via a dashboard.
- **Responsive UI**:
  - Built with Tailwind CSS for a modern, mobile-friendly design.
  - OTP input toggle (show/hide) using `react-icons` (`BsFillEyeFill`, `BsEyeSlashFill`).
- **Modular Architecture**:
  - Reusable React components (`Button`, `InputField`, `ErrorMessage`, `Logo`, etc.).
  - Custom hooks (`useAuth`, `useNotes`) for authentication and note management.
  - Backend controllers (`authController.ts`, `notesController.ts`) and utilities (`otp.ts`, `email.ts`).

## Tech Stack
### Frontend
- **React**: UI library for building components.
- **TypeScript**: Type-safe JavaScript for better developer experience.
- **Vite**: Fast build tool and dev server.
- **React Router DOM**: Client-side routing for `/signup`, `/signin`, `/dashboard`.
- **Axios**: HTTP client for API calls to the backend.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **react-icons**: Icons for OTP toggle (`BsFillEyeFill`, `BsEyeSlashFill`).

### Backend
- **Node.js/Express**: Server framework for REST API.
- **TypeScript**: Type-safe backend code.
- **MongoDB (Mongoose)**: Database for storing users and notes.
- **JSON Web Tokens (JWT)**: Secure authentication with 7-day token expiration.
- **Nodemailer**: Email service for sending OTPs (e.g., via SendGrid or Resend).
- **Passport**: Google OAuth 2.0 for authentication.
- **CORS**: Cross-Origin Resource Sharing for frontend-backend communication.

### Deployment
- **Frontend**: Vercel for hosting the React SPA.
- **Backend**: Render for hosting the Express server.

## Frontend Setup
### Prerequisites
- Node.js (>=18.0.0)
- npm or yarn
- Vercel CLI (`npm install -g vercel`)

### Project Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── InputField.tsx
│   │   ├── ErrorMessage.tsx
│   │   ├── Logo.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useNotes.ts
│   ├── pages/
│   │   ├── AuthForm.tsx
│   │   ├── Dashboard.tsx
│   ├── App.tsx
│   ├── main.tsx
├── public/
│   ├── bg.png
├── package.json
├── vite.config.ts
├── vercel.json
├── .gitignore
```

### Installation
1. **Clone the Repository**:
   ```bash
   git clone <frontend-repo-url>
   cd frontend
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Environment Variables**:
   Create a `.env.local` file in the root:
   ```
   VITE_BACKEND_URL=https://your-backend.onrender.com
   ```
   Replace `https://your-backend.onrender.com` with your Render backend URL.

4. **Run Locally**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` to view the app.

### Key Files
- **App.tsx**: Defines routes (`/signup`, `/signin`, `/dashboard`) using `react-router-dom`.
- **AuthForm.tsx**: Handles sign-up/sign-in with OTP and Google auth, using `useAuth` hook.
  - OTP input toggles between `password` and `text` using `hideValue` state and `BsFillEyeFill`/`BsEyeSlashFill` icons.
- **useAuth.ts**: Manages authentication logic (OTP send/verify, Google auth, token storage).
- **useNotes.ts**: Handles note CRUD operations via API calls.
- **vercel.json**: Configures Vercel for SPA routing:
  ```json
  {
    "rewrites": [
      {
        "source": "/(.*)",
        "destination": "/index.html"
      }
    ]
  }
  ```

## Backend Setup
### Prerequisites
- Node.js (>=18.0.0)
- MongoDB Atlas account (or local MongoDB)
- Email service API key (e.g., SendGrid, Resend)
- Google OAuth 2.0 credentials

### Project Structure
```
backend/
├── src/
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── notesController.ts
│   ├── utils/
│   │   ├── otp.ts
│   │   ├── email.ts
│   ├── config/
│   │   ├── passport.ts
├── index.ts
├── package.json
├── tsconfig.json
├── .gitignore
```

### Installation
1. **Clone the Repository**:
   ```bash
   git clone <backend-repo-url>
   cd backend
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Environment Variables**:
   Create a `.env` file in the root:
   ```
   PORT=5000
   MONGODB_URI=<your-mongodb-atlas-uri>
   JWT_SECRET=<your-jwt-secret>
   EMAIL_API_KEY=<your-email-service-api-key>
   GOOGLE_CLIENT_ID=<your-google-client-id>
   GOOGLE_CLIENT_SECRET=<your-google-client-secret>
   GOOGLE_CALLBACK_URL=https://your-backend.onrender.com/auth/google/callback
   ```

4. **Run Locally**:
   ```bash
   npm run dev
   ```
   The server runs on `http://localhost:5000`.

### Key Files
- **index.ts**: Sets up Express server, CORS, and routes (`/auth`, `/notes`).
- **authController.ts**: Handles OTP and Google auth endpoints (`/auth/register`, `/auth/otp/send`, `/auth/google`).
- **notesController.ts**: Manages note CRUD operations.
- **otp.ts**: Generates and validates OTPs.
- **email.ts**: Sends OTP emails via Nodemailer.
- **passport.ts**: Configures Passport for Google OAuth.
- **tsconfig.json**: Compiles TypeScript to `dist/`:
  ```json
  {
    "compilerOptions": {
      "target": "ES2020",
      "module": "commonjs",
      "outDir": "./dist",
      "rootDir": "./",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true
    },
    "include": ["src/**/*", "index.ts"],
    "exclude": ["node_modules", "dist"]
  }
  ```

## Deployment
### Frontend (Vercel)
1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```
   - Link your GitHub repo for automatic deployments.
   - Set `VITE_BACKEND_URL` in Vercel’s **Settings > Environment Variables**:
     ```
     VITE_BACKEND_URL=https://your-backend.onrender.com
     ```

3. **Configuration**:
   - Ensure `vercel.json` rewrites all routes to `index.html` for SPA routing.
   - Build command: `vite build`
   - Output directory: `dist`

4. **Fixes Applied**:
   - Added `vercel.json` to resolve 404 errors for `/signup` and `/signin`.
   - Replaced `<a href>` with `<Link>` in `AuthForm.tsx` for client-side routing.
   - Ensured `VITE_BACKEND_URL` points to the Render backend, not `http://localhost:5000`.

### Backend (Render)
1. **Create a Web Service**:
   - In Render’s dashboard, create a new Web Service and link your GitHub repo.
   - Set:
     - **Runtime**: Node
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Environment Variables**:
       ```
       PORT=10000
       MONGODB_URI=<your-mongodb-atlas-uri>
       JWT_SECRET=<your-jwt-secret>
       EMAIL_API_KEY=<your-email-service-api-key>
       GOOGLE_CLIENT_ID=<your-google-client-id>
       GOOGLE_CLIENT_SECRET=<your-google-client-secret>
       GOOGLE_CALLBACK_URL=https://your-backend.onrender.com/auth/google/callback
       ```

2. **Configuration**:
   - `package.json` specifies:
     ```json
     "main": "dist/index.js",
     "scripts": {
       "build": "tsc",
       "start": "node dist/index.js",
       "dev": "nodemon src/index.ts"
     }
     ```
   - `tsconfig.json` compiles TypeScript to `dist/`.

3. **Fixes Applied**:
   - Resolved `MODULE_NOT_FOUND` error for `dist/index.js` by adding `npm run build` to Render’s build command.
   - Ensured CORS in `index.ts` allows requests from `https://your-frontend.vercel.app`.

## Troubleshooting
### Frontend
- **404 Errors on `/signup` or `/signin`**:
  - Ensure `vercel.json` exists with rewrites.
  - Use `Link` from `react-router-dom`, not `<a href>`.
- **API Calls to `localhost:5000`**:
  - Verify `VITE_BACKEND_URL` in Vercel’s dashboard.
  - Remove hardcoded `localhost:5000` in `useAuth.ts` or `useNotes.ts`.
  - Clear build cache by redeploying.
- **OTP Toggle Issues**:
  - Confirm `react-icons` is installed.
  - Check `hideValue` state in `AuthForm.tsx` toggles input type (`password` ↔ `text`).

### Backend
- **MODULE_NOT_FOUND for `dist/index.js`**:
  - Ensure `npm run build` is in Render’s build command.
  - Verify `tsconfig.json` outputs to `dist/`.
- **MongoDB Connection Errors**:
  - Check `MONGODB_URI` in Render’s environment variables.
  - Ensure MongoDB Atlas allows Render’s IP.
- **Google Auth Failures**:
  - Verify `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL`.
  - Check Passport setup in `config/passport.ts`.

### Testing
- **Frontend**: Test OTP auth, Google auth, and note CRUD at `https://your-frontend.vercel.app`.
- **Backend**: Use Postman to test endpoints:
  ```bash
  curl -X POST https://your-backend.onrender.com/auth/otp/send \
  -d '{"email":"test@example.com","action":"login"}' \
  -H "Content-Type: application/json"
  ```
- **Integration**: Verify `localStorage` stores `token` and `user` for `keepLoggedIn`.

