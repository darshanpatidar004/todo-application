# UltraTodo Native App Installation Guide

This guide provides instructions on how to install and access your **UltraTodo** application as a standalone mobile app on Android, iOS, and Web.

---

## 🛠️ Prerequisites
- Both Backend and Frontend must be running for the app to function.
- Your phone and computer must be on the **same Wi-Fi network**.
- **Backend URL:** `http://192.168.0.205:8008/api/v1`
- **Frontend URL:** `http://192.168.0.205:8081`

---

## 📱 1. Web / Progressive Web App (PWA)
*The fastest way to get an app icon on your home screen right now.*

### **Android (Chrome)**
1. Open Chrome and navigate to `http://192.168.0.205:8081`.
2. Tap the **three dots (⋮)** menu icon at the top right.
3. Select **"Install App"** or **"Add to Home screen"**.
4. Confirm by clicking **Install**.

### **iOS (Safari)**
1. Open Safari and navigate to `http://192.168.0.205:8081`.
2. Tap the **Share** button (square with an arrow pointing up) at the bottom.
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **Add** in the top right corner.

---

## 🤖 2. Android Standalone App (.APK)
*To build a real installer file that works without a browser.*

1. **Install Build Tools:**
   ```bash
   npm install -g eas-cli
   ```
2. **Login to Expo:**
   ```bash
   eas login
   ```
3. **Run the Build:**
   ```bash
   cd frontend
   eas build --platform android --profile preview
   ```
4. **Download & Install:**
   Expo will provide a QR code and a link to download the `.apk` file once the build is complete.


🛠️ What I have configured:
  I created a frontend/eas.json file specifically set up to generate an APK (standard
  installer) instead of an AAB (Play Store format) when using the preview profile.

  🚀 Steps to build your APK:

   1. Install the EAS CLI (if not already installed):
   1     npm install -g eas-cli

   2. Navigate to the frontend folder:
   1     cd frontend

   3. Log in to your Expo account:
   1     eas login

   4. Run the APK Build command:
   1     eas build --platform android --profile preview

  ---

  📋 What happens next?
   * The command will ask you to create a "Project" on Expo — press Y.
   
   * It will ask you to generate a Keystore — press Y (Expo will handle the security keys for
     you).
   * The Build starts: Expo's servers will compile your code into a luxury Android app. This
     usually takes 5-10 minutes.
   * Download: Once finished, a QR Code and a Direct Download Link will appear in your
     terminal. Scan the code with your phone to download and install your UltraTodo APK!

  Note: Since this is a "Standalone" APK, it will use the icon and splash screen defined in
  your app.json. You can now share this file with anyone!



---

## 🍎 3. iOS Development Access
*iOS standalone apps require an Apple Developer Account ($99/year). Use this method for free testing.*

1. Install **Expo Go** from the App Store.
2. Open your **Camera App** and scan the QR code displayed in your terminal when you run `npx expo start`.
3. The app will launch inside Expo Go.
4. **Pro Tip:** In the Expo Go app list, you can often "Pin" the app or add it to your home screen depending on your iOS version.

---

## 📋 App Identity Details
- **App Name:** UltraTodo
- **Package Name:** `com.ultratodo.app`
- **Theme:** Elite Dark / Luxury Slate
- **Version:** 1.0.0
