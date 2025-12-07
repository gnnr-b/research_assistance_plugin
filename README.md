# Research Assistant (Chrome Extension)

This Chrome extension accepts a user topic, uses an OpenAI model to perform a short multi-step research workflow (outline → gather page info → concise final brief), and returns a concise report in the popup.

Files added:
- `manifest.json` — MV3 manifest
- `popup.html`, `popup.js`, `popup.css` — popup UI
- `background.js` — service worker orchestrating the workflow and calling OpenAI
- `contentScript.js` — helper content script (optional)

How it works (high level):
- User opens popup, pastes their OpenAI API key (stored locally in extension storage), and enters a topic.
- Popup asks the background service worker to start research.
- Background:
  - Requests a concise outline from OpenAI.
  - Gathers page data (title, meta description, selected text, page body excerpt) from the active tab.
  - Asks OpenAI to produce a concise final brief using the outline and page data.
  - Sends progress and final result back to the popup.

Security notes:
- The API key is stored in `chrome.storage.local` on your machine only. Do not publish or check it into source control.
- This extension calls the OpenAI REST API from the background script. You should treat the key like any other secret.

Load in Chrome/Edge (developer mode):
1. Open `chrome://extensions/` (or `edge://extensions/`).
2. Enable "Developer mode".
3. Click "Load unpacked" and select this repository folder (`.../research-assistant`).
4. Open the extension popup, paste your OpenAI API key, save it, then enter a topic and click "Start Research".

Notes & improvements:
- The manifest currently requests broad host permissions (`<all_urls>`). For production, narrow host permissions to the sites you need.
- You can move the API calls to a backend if you prefer not to store the key in the extension.
- The extension currently queries only the active tab. You can expand it to visit multiple tabs or follow links.
# research_assistance_plugin
