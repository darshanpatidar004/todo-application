# 🚀 UltraTodo Deployment & APK Compilation Guide

This document guides you through setting up your **SQLite Cloud** database, deploying the **FastAPI** backend to **Render**, configuring your brand-new **React Native (Expo)** client, and compiling it to an `.apk` file for Android devices.

---

## 📂 Project Architecture

```mermaid
graph TD
    Client["📱 Android App (.APK)"] <-->|HTTPS / JSON / JWT| API["🚀 FastAPI Backend (Render)"]
    API <-->|SQLAlchemy ORM| DB["☁️ SQLite Cloud Database"]
```

---

## 🛠️ Step 1: Create a SQLite Cloud Database
SQLite Cloud provides a globally-shared SQL database with low latency.

1. Sign up for a free account at [sqlitecloud.io](https://sqlitecloud.io/).
2. Create a new project (e.g. `ultratodo`).
3. Create a database named `todo` (or let FastAPI auto-generate tables).
4. Copy your **Connection String** from the SQLite Cloud dashboard. It should look like:
   `sqlitecloud://admin:passkey@host.sqlite.cloud:port/database`

---

## 🚀 Step 2: Deploy the Backend to Render
Using the included `render.yaml` blueprint, you can deploy your backend to the cloud in one click.

1. Push your changes to your GitHub repository (`todo-application`).
2. Log in to [Render](https://render.com/).
3. Click **New +** -> **Blueprint**.
4. Select your connected GitHub repository.
5. Under environment variables, set the following:
   * **`SQLITE_CLOUD_CONNECTION_STRING`**: Paste the connection string you copied in Step 1.
   * **`SECRET_KEY`**: Leave blank (Render will auto-generate) or set a custom string.
   * **`DATABASE_URL`**: Keep default (`sqlite:///./data/todo.db`). It falls back to local if the SQLite Cloud string is missing.
6. Click **Deploy**. Render will host the service and provide a public URL:
   `https://todo-backend-xxxx.onrender.com`

> [!IMPORTANT]
> Your public API endpoint will be:  
> `https://todo-backend-xxxx.onrender.com/api/v1`

---

## 📱 Step 3: Run & Configure the Expo Frontend

Your frontend has been completely rebuilt with **React Native (Expo)**, **Zustand**, and **NativeWind (Tailwind CSS)**.

### Running Locally
To launch the app on your developer machine:
```bash
cd frontend
npm install
npx expo start
```
* Press `a` for Android Emulator.
* Scan the QR Code using the **Expo Go** app on your phone.

### Connect to Your Cloud Backend
1. On the login screen of the app, click the **"Show Core Server Config"** button at the bottom.
2. In the **Cloud Backend Server API URL** field, paste your Render URL:
   `https://todo-backend-xxxx.onrender.com/api/v1`
3. Click **Exit / Save**.
4. Register a user and log in. All actions will now write directly to your **SQLite Cloud** database!

---

## 🤖 Step 4: Build Standalone Android App (.APK)

To compile a native Android installation file (`.apk`) that does not require Expo Go:

1. **Install Expo Application Services (EAS) CLI:**
   ```bash
   npm install -g eas-cli
   ```
2. **Log In to Expo:**
   ```bash
   eas login
   ```
   *(Create a free account on [expo.dev](https://expo.dev) if you don't have one)*

3. **Initialize the Project on Expo:**
   ```bash
   cd frontend
   eas project:init
   ```
4. **Start the Build:**
   ```bash
   eas build --platform android --profile preview
   ```
   * *Skip Git check warnings if prompted.*
   * *When asked to generate a keystore, select **Yes**.*

5. **Download & Share:**
   Once EAS finishes compiling (takes ~5–10 mins), it will output a **QR Code** and a **Direct Download Link** to the `.apk` file.
   * Scan it with any Android phone to install!
   * Share the `.apk` file with multiple devices. Everyone will connect to the same cloud database smoothly.
