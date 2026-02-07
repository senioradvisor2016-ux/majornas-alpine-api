# 🎿 Majora Alpine - UPGRADE PROMPT

Add these features to the existing app:

## 1. 🗺️ Interactive Ski Map

Add a new "Karta" tab with:
- SVG-based ski map (stylized, not realistic)
- Family member avatars as draggable pins
- Pulsing dots showing "last seen" locations
- Tap avatar → show timestamp + funny status
- "Christer's Wandering Trail" - dotted line showing his confused path

```jsx
// Example positions
const familyPositions = {
  peter: { x: 45, y: 30, status: "Setting up modular in the lodge", lastSeen: "2 min ago" },
  christer: { x: 80, y: 60, status: "Pretty sure this is the right way", lastSeen: "15 min ago" },
  edgar: { x: 20, y: 10, status: "HEADING TOWARDS BLACK SLOPE", lastSeen: "30 sec ago" }
};
```

## 2. 📸 Webcam View

Add webcam section:
- Use placeholder images or actual webcam URLs from fnugg
- "Edith's Filter" button - adds Instagram-style overlays
- Tap to fullscreen

```javascript
// Fnugg webcam data path:
// _source.webcams[].image → webcam image URL
// _source.webcams[].name → webcam name
```

## 3. 🔔 Alert System

Add notification banner at top:
- Slides in for important events
- Color-coded by urgency (green/yellow/red)
- Auto-dismisses after 5 seconds
- Tap to see details

Example alerts:
- 🔴 "EDGAR ALERT: Approaching Störtloppet!"
- 🟡 "Christer has deviated 500m from route"
- 🟢 "Peter's synth break starting in 5 min"
- 🟢 "Julia: Fika scheduled in 20 min, compliance mandatory"

## 4. 🏆 Leaderboard

Add "Topplistan" section:
- Vertical meters today
- Slopes conquered
- Speed record (fake/fun data)
- "Christer's Distance Wandered"

```jsx
const leaderboard = [
  { name: "Ylva", verticalM: 4850, note: "Still 'learning'" },
  { name: "Edgar", verticalM: 4200, note: "Mostly black slopes 😱" },
  { name: "Bibbi", verticalM: 3100, note: "Good signal up there" },
  { name: "Edith", verticalM: 2800, note: "15 Insta posts" },
  { name: "Peter", verticalM: 1200, note: "3 synth breaks" },
  { name: "Julia", verticalM: 3500, note: "On schedule ✓" },
  { name: "Christer", verticalM: 2000, note: "1.5km wandered" }
];
```

## 5. 🎭 Enhanced Easter Eggs

Improve avatar interactions:
- **Peter**: Play synth arpeggio sound, show "Filter resonance increasing..."
- **Christer**: Spinning compass animation, "Recalculating... recalculating..."
- **Edgar**: Screen shakes, alarm sound, "HOLD ON TO YOUR HELMETS"
- **Julia**: Spreadsheet popup with real stats
- **Ylva**: Wink animation, secret "Pro Mode" unlocks showing her true skills
- **Edith**: Camera flash effect, "Posted to Instagram ✨"
- **Bibbi**: Signal bars animation, "4G ACQUIRED 📶"

## 6. 📱 PWA Support

Make it installable:
- Add manifest.json
- Add service worker for offline
- Cache resort data
- "Add to Home Screen" prompt

## 7. 🌅 Time-based Themes

- Morning (06-10): Soft sunrise colors, "God morgon!"
- Day (10-16): Bright and clear
- Afternoon (16-19): Golden hour, "Après-ski soon!"
- Evening (19+): Cozy lodge vibes, "Vila benen"

## 8. 💬 Family Feed

Add real-time family updates:
```
14:32 - Edgar: "Den där backen såg inte så svår ut"
14:33 - Julia: "EDGAR NEJ"
14:35 - Christer: "Var är ni någonstans?"
14:35 - Everyone: "..."
14:40 - Peter: "Någon som vill höra min nya patch?"
14:41 - Bibbi: "Jag har wifi vid lift 7 om någon behöver"
14:45 - Ylva: "Jag tar en till svart, alltså blå, backe"
```

---

Keep the Wes Anderson aesthetic! Pastels, playful typography, warm and cozy! 🎿✨
