# 🏥 SymptaCare
A 100% offline, mobile-first Medical Rule Engine and Triage Application built with React Native and Expo.

## 🌟 Features
* **Zero Network Dependency:** The core Inference Engine and all clinical rules run completely offline using an embedded Expo SQLite database.
* **Knowledge-Based System (KBS):** Implements a Forward-Chaining matching algorithm that supports partial symptom matching (66% threshold for 3+ symptoms) and severity overrides.
* **Admin Protocol Builder:** A built-in CMS interface allowing doctors/administrators to dynamically create, test, and save new IF-THEN medical rules directly to the local database without needing app updates.
* **Patient History:** Automatically saves past assessment logs and triage results.

## 🛠️ Tech Stack
* **Framework:** React Native / Expo (Managed Workflow)
* **Language:** TypeScript
* **Database:** Expo SQLite
* **Icons:** Expo Vector Icons (Feather)

---

## 📱 How to Run on a Phone (Recommended)
Since the app utilizes an embedded mobile SQLite database, it is best tested on a real mobile device.
1. Download the **Expo Go** app from the Google Play Store or Apple App Store.
2. In your terminal, run:
   ```bash
   npm start
   ```
3. Scan the QR code that appears in the terminal using the Expo Go app (Android) or your Camera app (iOS).

## 💻 How to Run on the Web
*Note: Web support for expo-sqlite requires WASM parsing. Metro bundler has been configured to support this.*
1. Clear the bundler cache and start the web server:
   ```bash
   npm run web -- -c
   ```
2. The app will open in your default browser. 
3. **To get a Phone-like view:** Press `F12` to open Chrome Developer Tools, then press `Ctrl + Shift + M` to toggle the Device Toolbar.

## 📦 How to Build the Android APK Installer
To generate a standalone `.apk` file for Android devices:
1. Ensure EAS CLI is installed and you are logged in:
   ```bash
   npm install -g eas-cli
   eas login
   ```
2. Run the build command:
   ```bash
   npx eas-cli build -p android --profile preview
   ```
3. Wait for the Expo cloud servers to finish the build. Once done, download the provided link to get your `.apk` file.