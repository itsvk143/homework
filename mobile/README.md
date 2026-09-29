# ClassBoard Mobile (React Native + Expo)

A cross-platform iOS and Android mobile app for students and teachers to track exercises, manage homework, and update question-level progress in less than 10 seconds.

## Architecture

- **Framework**: React Native + Expo (TypeScript)
- **Shared API**: Communicates with the Next.js shared backend API at `/api/...`
- **Navigation**: Bottom Tab Navigation (Student: Home, Homework, Calendar, Progress, Profile | Teacher: Dashboard, Students, Homework, Reports, Profile)
- **Features**:
  - Ultra-fast Question-Level Progress Stepper & Slider (< 10 seconds flow)
  - 1-Click "Mark Exercise Completed"
  - Offline sync indicator ("Offline / Last synced: 4:32 PM")
  - Homework proof photos upload (Camera & Gallery)
  - Push notification hooks for reminders and teacher feedback

## Running the Mobile App

1. Ensure the backend Next.js server is running on `http://localhost:3000` (or your machine's local IP).
2. In the `mobile/` directory:
   ```bash
   cd mobile
   npm install
   npx expo start
   ```
3. Scan the QR code using **Expo Go** on your iOS or Android physical device, or press `a` for Android Emulator / `i` for iOS Simulator.

*Note: You can also test the exact mobile UI directly in your browser using the "Mobile Preview" button in the top navigation bar of the web dashboard!*
