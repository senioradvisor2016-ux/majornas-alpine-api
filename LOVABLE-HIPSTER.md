# 🎿 MAJORA ALPINE - På Vift i Lift

## Build the WORLD'S MOST FUN ski vacation app!

Create a hilarious, beautiful ski resort app called **"Majora Alpine - På Vift i Lift"** featuring two hipster families on their chaotic ski adventure in Trysil, Norway.

---

## 👨‍👩‍👧 THE FAMILIES

### Family 1: The Lundbergs 🧔
- **Christer Lundberg, 44** - Dad with light brown hair and a magnificent "tomte beard" (Santa-style beard). Thinks he's an expert skier but always ends up in the wrong lift queue. Wears vintage ski gear from the 80s "because it's authentic".
- **Ylva Lindvall, 40** - Mom with long blonde hair. Actually the best skier in both families but pretends to be scared so Christer can "save" her. Always has the perfect après-ski outfit.
- **Bibbi Lindvall, 15** - Daughter with long brown hair. Too cool for family photos, always on her phone, but secretly loves the ski trips. Expert at finding the resort's best wifi spots.

### Family 2: The Bergqvists 🎸
- **Peter Bergqvist, 44** - Dad with long blonde hair in a man-bun. Brings way too much synth equipment on vacation "just in case". Names every ski run after electronic music tracks.
- **Julia Norinder, 40** - Mom with long blonde hair. The organizer. Has color-coded spreadsheets for lift schedules. Takes 47 photos at every viewpoint.
- **Edith Norinder, 15** - Daughter with long blonde hair. Eye-rolls at everything but is actually having the time of her life. Documents everything for "the 'gram".
- **Edgar Norinder, 9** - Son with long blonde hair (basically a tiny Viking). Fearless. Will ski any black slope. The adults are terrified of him.

---

## 🎨 DESIGN STYLE

### Visual Theme
- **Wes Anderson meets Scandinavian hygge** - Symmetrical compositions, pastel winter colors, quirky details
- Illustrated hipster family avatars throughout the app
- Warm, playful, slightly ironic tone
- Hand-drawn elements mixed with clean UI
- Color palette: 
  - Primary: #2D4A6E (Nordic blue)
  - Secondary: #F4A460 (Warm sunset orange)  
  - Accent: #E8D5B7 (Cream/hygge)
  - Background: #1a2744 (Dark cozy)
  - Snow: #F0F8FF

### Typography
- Headers: Playful serif (like a ski lodge sign)
- Body: Clean sans-serif
- Fun quotes and family commentary throughout

---

## 📱 APP SCREENS

### 1. SPLASH SCREEN
- Animated illustration of both families tumbling out of a Volvo packed with skis, synths, and too many snacks
- Tagline: "På Vift i Lift - Because regular ski apps are boring"

### 2. HOME DASHBOARD
**Header:** Illustrated family group selfie (messy, authentic, someone's eyes are closed)

**Weather Hero Card:**
- Giant temperature display
- Christer's commentary: "Only -10°C? Back in my day, we skied in -30!"
- Wind indicator with Julia's note: "Edgar, you are NOT skiing if it's above 8 m/s!"

**Stats Grid:**
- 🚡 Lifts Open: "29/31 - Christer has been stuck in 2 of them"
- ⛷️ Slopes Open: "62/70 - Edgar has conquered 61"
- ❄️ Snow Depth: "83cm - Perfect for Ylva's 'accidental' faceplants"
- ☕ Coffees consumed: "∞"

**Family Location Tracker:**
- Show cartoon avatars on mini ski map
- Christer: "Lost near gondola (again)"
- Edgar: "Last seen heading to black slope 😱"
- Bibbi & Edith: "Wifi zone by the lodge"

### 3. LIFT STATUS
- List of all lifts with wait times
- Each lift has a family quote:
  - Trysilgondolen: "Peter's favorite - good acoustics for humming synth melodies"
  - Toppekspressen: "Julia's spreadsheet rates this 8.5/10 for efficiency"
  - Eventyr: "Where we lost Edgar for 3 hours. He was fine. We were not."

### 4. SLOPE GUIDE
- Filter by difficulty with family recommendations
- 🟢 Green: "Christer's 'warm-up' slopes (entire vacation)"
- 🔵 Blue: "Family-approved chaos zones"
- 🔴 Red: "Ylva's secret shredding territory"
- ⚫ Black: "Edgar's playground / Parent's nightmare"

### 5. AI SKI BUDDY
Illustrated chat interface with a wise, bearded ski instructor character

**Sample interactions:**
- User: "Where should we eat lunch?"
- AI: "Knettsetra has the best view! Pro tip: Go at 11:30 to avoid the Bergqvist-Lundberg circus. They take forever to order."

- User: "Is Edgar on a black slope?"
- AI: "Probably. He's 9. He fears nothing. I've alerted mountain rescue (just kidding... maybe)."

### 6. FAMILY CHALLENGE BOARD
Gamification with silly achievements:
- 🏆 "Man Bun Magnificence" - Peter kept his hair perfect all day
- 🏆 "Spreadsheet Queen" - Julia optimized 3+ lift routes
- 🏆 "Vintage Vibes" - Christer got a compliment on his 80s suit
- 🏆 "Stealth Expert" - Bibbi avoided family photo
- 🏆 "Chaos Agent" - Edgar caused lift stoppage
- 🏆 "Graceful Recovery" - Ylva's elegant "fall"

### 7. APRÈS-SKI PLANNER
- Restaurant finder with filters:
  - "Kid-friendly (Edgar-proof)"
  - "Instagrammable (Edith-approved)"
  - "Has outlets for synth charging"
  - "Ylva's wine selection"

### 8. FAMILY PHOTO ALBUM
- Auto-collage of the day's adventures
- Captions auto-generated:
  - "Christer 'teaching' Bibbi to ski"
  - "Peter found an outlet for his Moog"
  - "Edgar's 47th black slope run"

---

## 🔌 API INTEGRATION

Use this API for real ski data:
```
https://api.fnugg.no/search?q=trysil
```

Data mapping from `hits.hits[0]._source`:
- `conditions.combined.top.temperature.value` → Temperature
- `conditions.combined.top.wind.mps` → Wind
- `conditions.combined.top.snow.depth_slope` → Snow depth
- `lifts.open` / `lifts.count` → Lift stats
- `slopes.open` / `slopes.count` → Slope stats
- `conditions.combined.top.powder_alarm` → Powder alert (trigger celebration mode!)

---

## ✨ SPECIAL FEATURES

### Powder Alert Mode 🎉
When `powder_alarm = true`:
- Screen explodes with animated snowflakes
- Family avatars do happy dance
- Push notification: "POWDER DAY! Edgar is already on the mountain. The rest of you: WAKE UP!"

### Family Chaos Mode
Random funny notifications:
- "Christer has been in the same lift queue for 23 minutes"
- "Julia's spreadsheet has been updated (again)"
- "Bibbi found wifi. We've lost her."
- "Edgar wants to try ski jumping. Send help."

### Quote of the Day
Rotating family wisdom:
- "The mountain doesn't care about your man bun." - Unknown
- "Life is better with a synth and a ski pass." - Peter
- "I'm not lost, I'm exploring." - Christer (definitely lost)
- "Mom, PLEASE stop taking photos." - All the kids

---

## 🎭 TONE & VOICE

- Warm, loving family humor
- Self-deprecating Scandinavian wit  
- Nostalgic but modern
- Never mean, always playful
- Inside jokes that make you feel part of the family

---

## 📱 TECHNICAL

- PWA (Progressive Web App)
- Mobile-first, works offline
- Smooth animations
- Fast, responsive
- Share-friendly (families want to share the chaos)

---

Build this as the ski app that makes everyone smile! 🎿❄️👨‍👩‍👧‍👦
