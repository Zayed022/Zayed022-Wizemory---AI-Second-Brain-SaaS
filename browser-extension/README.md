# WizeMory Browser Extension

A Chrome/Brave/Edge extension that lets users save any webpage to their WizeMory knowledge base in one click.

## Features
- One-click save from the toolbar popup
- Keyboard shortcut: `Alt+Shift+S`
- Right-click context menu: "Save to WizeMory"
- Desktop notification on save
- Auto-detects auth token from the WizeMory web app

## Install for development

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select this `browser-extension/` folder

## Publishing to Chrome Web Store

1. Zip the entire `browser-extension/` folder (not the parent)
2. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
3. Click **New item** → Upload the zip
4. Fill in store listing details, screenshots, privacy policy URL
5. Submit for review (takes 1–3 business days)

## Store listing copy

**Short description (132 chars):**
Save any webpage to your WizeMory AI second brain. AI summarises it instantly. Find it again by asking a question.

**Long description:**
WizeMory is your AI-powered personal knowledge base. This extension lets you save any article, research paper, or blog post to WizeMory in one click.

Once saved, Claude AI automatically:
• Writes a crisp 2-3 sentence summary
• Extracts the key insights
• Tags the content by topic
• Finds connections to other things you've saved

Then ask your knowledge base anything: "What have I saved about sleep?" "What do I know about decision fatigue?" and get answers grounded in your own research — not AI hallucinations.

**Keyboard shortcut:** Alt+Shift+S to save the current page without opening the popup.

## Icons needed
Add PNG icons at these sizes to the `icons/` folder:
- icon16.png  (16×16)
- icon32.png  (32×32)  
- icon48.png  (48×48)
- icon128.png (128×128)

Use the WizeMory "m" logomark in violet (#7340f5) on a white or ink background.
You can generate these from the SVG logo or use a tool like Figma → Export.
