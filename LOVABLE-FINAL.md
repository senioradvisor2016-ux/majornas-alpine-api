# 🎿 Majora Alpine - På Vift i Lift

Build a hilarious ski resort dashboard app for TWO HIPSTER FAMILIES on ski vacation!

## 👨‍👩‍👧‍👦 THE FAMILIES

**Family Bergqvist:**
- **Peter** (44) - blonde man-bun, brings synths everywhere, always setting up modular in the lodge
- **Julia** (40) - long blonde hair, spreadsheet queen, has color-coded the entire trip
- **Edith** (15) - long blonde, Instagram influencer mode, only skis for content
- **Edgar** (9) - long blonde viking hair, FEARLESS, parents constantly terrified

**Family Lindström:**
- **Christer** (44) - brown hair, magnificent Santa beard, perpetually lost
- **Ylva** (40) - long blonde, secretly an expert skier, pretends to be beginner
- **Bibbi** (15) - long brown hair, wifi expert, found signal on the summit

## 🎯 APP FEATURES

### Main Dashboard
- Current resort overview (Trysil default, dropdown for others)
- Weather widget with "Edgar Danger Level" (🟢🟡🔴)
- Family location cards with funny status updates
- "Christer GPS" - where he thinks he is vs where he is

### Lift Status Page
- All lifts with open/closed status
- Queue time estimates
- Family member icons showing who's on which lift
- "Peter's Synth Break Locations" ☕🎹

### Slope Explorer
- Color-coded difficulty (green/blue/red/black)
- Family recommendations per slope
- "Edith's Instagram Spots" 📸
- "Edgar's Forbidden Zones" ⚠️

### Weather & Conditions
- 5-day forecast
- Snow conditions
- Wind speed with "Bibbi's Hair Alert" 💨
- Visibility rating

### Family Planner
- Suggested meetup times
- Lunch spots ranked by "Julia's Spreadsheet Score"
- "Ylva's Secret Powder Stashes"

## 🎨 DESIGN STYLE

- **Wes Anderson meets Scandinavian hygge**
- Pastel colors: dusty pink, sage green, warm cream, soft blue
- Rounded corners, playful typography
- Hand-drawn style icons
- Family avatar illustrations in corners
- Quirky quotes and labels everywhere

## 🔌 API INTEGRATION

Use Fnugg.no API (Norwegian ski resort data):

```javascript
// Fetch resort data
const fetchResort = async (resort = 'trysil') => {
  const res = await fetch(`https://api.fnugg.no/search?q=${resort}`);
  const data = await res.json();
  return data.hits?.hits?.[0]?._source || null;
};

// Key data paths:
// - _source.name → Resort name
// - _source.conditions.combined.top → Conditions at top
// - _source.lifts.open → Number of open lifts
// - _source.lifts.count → Total lifts
// - _source.slopes.open → Open slopes
// - _source.last_updated → Timestamp
// - _source.forecast → Weather forecast array
```

**Resorts to support:**
- trysil (default)
- hemsedal
- åre
- sälen
- vemdalen
- geilo

## 💬 FAMILY QUOTES (use throughout UI)

**Peter:** "Wait, I need to check the filter cutoff before we go"
**Julia:** "According to my spreadsheet, we're 3 minutes behind schedule"
**Edith:** "This lift is SO aesthetic"
**Edgar:** "I'm going down the black one!" 😱
**Christer:** "I'm pretty sure the car is this way..."
**Ylva:** "Oh, I've never done a black slope before" *winks*
**Bibbi:** "Found 2 bars of 4G at the summit!"

## 🎿 UNIQUE FEATURES

1. **"Edgar Alert System"** - Tracks dangerous slopes and shows warning when Edgar might attempt them

2. **"Christer's Journey"** - A map showing his wandering path vs the intended route

3. **"Synth Break Timer"** - Countdown to Peter's next modular session

4. **"Spreadsheet Compliance Score"** - How well the family is following Julia's plan

5. **"Insta-Worthy Meter"** - Rates each slope for Edith's content

## 📱 MOBILE FIRST

- Touch-friendly buttons
- Swipe between sections
- Pull-to-refresh for live data
- Works offline with cached data

## 🎭 EASTER EGGS

- Tap Peter's avatar → plays synth sound
- Tap Christer → shows "recalculating route..."
- Shake phone → random family quote appears
- Edgar reaches black slope → confetti + alarm sound

---

Make it FUN! This is a vacation app, not a serious tool. Embrace the chaos of two families on ski vacation! 🎿😂🏔️
