# Farcaster Miniapp - 3 Games

This project is a Farcaster Miniapp featuring three games. Each game is in its own folder and can be launched from the main menu.

## Structure
- `games/jesse-jump/index.js` — Jesse Jump
- `games/virus-jesse/index.js` — Virus Jesse
- `games/protect-jesse/index.js` — Protect Jesse
- `main.js` — Main entry point and game selector
- `index.html` — App container

## Getting Started
1. Install dependencies:
   ```
   npm install
   ```
2. Start the app:
   ```
   npm start
   ```
3. Open `http://localhost:3000` in your browser.

## SDK Integration
The app uses the Farcaster Miniapp SDK via CDN. Make sure to call `sdk.actions.ready()` after loading.

Replace the game placeholders with your actual game code.
