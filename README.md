# SafeTrack

SafeTrack is an Android-first school-bus visibility prototype built with Expo and live GPS support. It follows the PRD's single-app model for Parent, Driver, and Admin roles and includes a demo simulation mode for presentations.

## Included features

- Role-based screens for Parent, Driver, and Admin
- Real foreground GPS permission flow with `expo-location`
- Live bus location updates while a trip is active
- Deterministic ETA, delay, and approaching-stop logic
- Map-style route and progress view
- Demo simulation mode for school presentations
- AI-style explanation layer with deterministic fallback

## Local setup

1. Install Node.js 20+
2. Run `npm install`
3. Start the shared sync server in a second terminal with `npm run sync-server`
4. Start Expo with `npx expo start`
5. Open the app in Expo Go on both phones connected to the same Wi-Fi

### Test outside Wi-Fi

Run this from the project root before leaving home:

```powershell
npm run mobile-test
```

This starts the sync API through a public LocalTunnel URL and starts Expo in tunnel mode. Scan the Expo QR code while you are at home, then take the phone onto mobile data. Keep the terminal running while testing. Both devices must have internet access.

### Deploy permanently

1. Push this project to GitHub.
2. Create a Render web service from the repository. The included `render.yaml` deploys the sync API with `npm run sync-server`.
3. Copy the Render URL, for example `https://safetrack-sync.onrender.com`.
4. Install and log in to EAS:

```powershell
npx eas-cli login
npx eas-cli build:configure
npx eas-cli env:create --name EXPO_PUBLIC_API_URL --value https://safetrack-sync.onrender.com --environment production --visibility plaintext
npx eas-cli build --platform android --profile production
```

Install the generated Android build on both phones. They will use the hosted API over mobile data and will no longer depend on your computer being online. The current sync server stores its demo state in a local JSON file; for a permanent production deployment, move that state to a managed database such as Supabase or PostgreSQL.

The sync client currently uses the development computer address `192.168.1.19` on port `3001`, matching the Expo LAN address. If Expo prints a different LAN IP, run Expo with `EXPO_PUBLIC_METRO_HOST=<your-computer-ip> npx expo start` or update the value in `src/services/syncClient.ts`.

## Demo flow

1. Choose Driver from the role screen.
2. Turn off Simulation mode.
3. Tap Grant location permission.
4. Tap Start Route to begin live GPS sharing.
5. Switch to Parent or Admin to watch the route update.
6. End the route to stop tracking.

## Important notes

- This prototype intentionally keeps the route logic deterministic and separate from AI or traffic services.
- Simulation mode remains available as a safe fallback for demos.
- The local sync server persists routes and trip state in `server/state.json` so a second Expo Go device can see the driver's route and live location.
- A production Firebase backend and school-scoped security rules are the next integration layer beyond this local test server.
