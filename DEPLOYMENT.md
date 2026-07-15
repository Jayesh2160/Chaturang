# Chaturang Deployment Guide

This guide details the deployment steps and configurations required to host **Chaturang** on public production services: **Vercel** (frontend), **Render** (backend), and **Neon** (PostgreSQL).

---

## 1. Environment Variables Checklist

### Backend (Render Environment)
Configure these variables in your **Render Web Service** control panel:

| Variable Name | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | Activates production profile settings. | `prod` |
| `DB_URL` | Neon PostgreSQL JDBC connection URL. | `jdbc:postgresql://ep-calm-lake...neon.tech/neondb?sslmode=require` |
| `DB_USERNAME` | Neon database username. | `neondb_owner` |
| `DB_PASSWORD` | Neon database password. | `*********` |
| `JWT_SECRET` | Secret key used to sign JWT security tokens. | *(Use a cryptographically secure 512-bit key)* |
| `JWT_EXPIRATION` | Expiration time of JWT tokens in milliseconds. | `86400000` (24 hours) |
| `CORS_ALLOWED_ORIGINS` | Deployed frontend domains allowed to call the API. | `https://chaturang.vercel.app` |

### Frontend (Vercel Environment)
Configure this variable in your **Vercel Project** settings under Environment Variables:

| Variable Name | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `VITE_API_URL` | API base URL pointing to the active backend server. | `https://chaturang-backend.onrender.com` |

---

## 2. Infrastructure Setup & Steps

### Step 1: Deploy Neon PostgreSQL Database
1. Create a project on [Neon](https://neon.tech/).
2. Fetch the connection string (`JDBC` tab) and password.
3. Keep the parameters ready to inject into your Render Web Service.

### Step 2: Deploy Spring Boot Backend on Render
1. Log in to [Render](https://render.com/) and create a new **Web Service**.
2. Connect your Git repository.
3. Configure the following build settings:
   - **Runtime:** `Docker` (or `Java` if using Maven build commands)
   - **Build Command:** `./mvnw clean package -DskipTests`
   - **Start Command:** `java -jar target/backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod`
4. Add all required backend environment variables under the **Environment** tab.

### Step 3: Deploy React Frontend on Vercel
1. Log in to [Vercel](https://vercel.com/) and import your project repository.
2. Select `frontend` as the root directory of the Vercel project.
3. Configure the framework preset as **Vite**.
4. Set the **Build Command** to: `npm run build`
5. Set the **Output Directory** to: `dist`
6. Add the environment variable `VITE_API_URL` matching your Render Web Service URL.
7. Click **Deploy**. Vercel will automatically configure CDN delivery and SSL certificates.

---

## 3. Deployment Security & Routing Validations

- **JWT Over HTTPS:**
  All user authentication operations pass the JWT token inside the request headers: `Authorization: Bearer <token>`. Because both Vercel and Render enforce TLS/HTTPS by default, all request headers (including the JWT token) are fully encrypted in transit.
- **SPA Routing Fallback:**
  The [vercel.json](file:///d:/Chaturang/frontend/vercel.json) rewrite rule handles client-side routing. Direct refreshes on routes like `/academy` or `/play` will rewrite internally to `/index.html` instead of triggering a CDN 404, allowing React Router to correctly resolve paths.
- **CORS Constraints:**
  CORS is configured dynamically via `CORS_ALLOWED_ORIGINS`. Render will automatically block any requests originating from non-registered domains, defending the API from unauthorized resource access.
