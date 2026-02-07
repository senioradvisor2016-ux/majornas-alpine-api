# 🎿 Majora Alpine - Lovable App Spec

## App Overview
Build a beautiful, modern ski resort dashboard app called "Majora Alpine - På Vift i Lift". 

The app shows real-time ski conditions for Norwegian and Swedish ski resorts, with AI-powered recommendations.

## Design Style
- **Theme**: Dark mode, premium ski/winter aesthetic
- **Colors**: 
  - Background: #0f1729 (dark blue)
  - Cards: #1a2744 (navy)
  - Accent: #3b82f6 (bright blue)
  - Snow/highlight: #e0f2fe (light blue)
  - Success: #22c55e (green)
  - Warning: #f97316 (orange)
- **Feel**: Like a luxury ski resort app - clean, modern, with subtle snow/mountain imagery
- **Typography**: Clean sans-serif, large readable numbers for stats

## Main Screens

### 1. Dashboard (Home)
- **Header**: "Majora Alpine" logo with mountain icon, current resort selector
- **Status Bar**: Resort open/closed indicator, last updated time
- **Hero Card**: Current conditions
  - Temperature (large, prominent)
  - Wind speed & direction
  - Snow depth
  - Powder alert banner (animated glow when active)
- **Stats Grid** (4 cards):
  - Lifts open (29/31 format with progress ring)
  - Slopes open (62/70 format)
  - Snow depth (cm)
  - Fresh snow (cm, last 24h)
- **AI Recommendation Card**: 
  - Smart tip based on current conditions
  - "Best area right now" suggestion
- **Quick Actions**: Webcams, Lifts, Map buttons

### 2. Lifts Screen
- **Filter tabs**: All / Open / Closed
- **List of lifts** with:
  - Status indicator (green dot = open, red = closed)
  - Lift name
  - Estimated queue time (AI predicted)
  - Lift type icon (gondola, chairlift, t-bar)
- **Tap lift** → shows which slopes it connects to

### 3. Slopes Screen  
- **Filter by difficulty**: 🟢 Green, 🔵 Blue, 🔴 Red, ⚫ Black
- **Slope cards** showing:
  - Slope number & name
  - Difficulty badge
  - Status (open/closed)
  - Connected lifts
- **Stats bar**: Count per difficulty level

### 4. AI Planner Screen
- **"Plan My Day" feature**
- Input: Skill level (beginner/intermediate/expert), preferences
- Output: Personalized day plan with:
  - Morning recommendations
  - Best lunch spot & time
  - Afternoon route
  - Equipment/clothing tips
- **Ask AI**: Free text input for questions like:
  - "Which lift has shortest queue?"
  - "Best slopes for kids?"
  - "Where should I eat lunch?"

### 5. Compare Screen
- **Side-by-side resort comparison**
- Show 3-5 resorts with key metrics:
  - Snow depth
  - Lifts open %
  - Temperature
  - Wind
  - Powder alert status
- **"Best Right Now" badge** on winning resort
- Tap resort → switch to that resort's dashboard

### 6. Forecast Screen
- **5-day weather forecast**
- Daily cards with:
  - Weather icon
  - High/low temp
  - Wind
  - Snow probability
- **Snow depth trend chart** (line graph)

### 7. Webcams Screen
- **Grid of webcam thumbnails**
- Locations: Top, Base, different areas
- Tap → fullscreen with refresh button
- Auto-refresh every 60 seconds

### 8. Settings/Profile
- **Favorite resort** selector
- **Notification preferences**:
  - Powder alerts (on/off, threshold)
  - Morning report time
  - Lift openings
- **Skill level** for AI recommendations
- **Units**: Celsius/Fahrenheit, cm/inches

## API Integration

### Primary API: fnugg.no
```
GET https://api.fnugg.no/search?q={resort_name}
```

Returns: Lifts, slopes, conditions, weather, snow data

### Resorts to include:
- Trysil (default)
- Hemsedal  
- Åre
- Sälen
- Vemdalen

## Key Features

### Real-time Updates
- Auto-refresh every 5 minutes
- Pull-to-refresh on all screens
- "Last updated" timestamp visible

### Powder Alert System
- Push notification when:
  - Official powder_alarm = true
  - Fresh snow > 10cm
- Animated banner on dashboard
- Special sound/vibration

### AI Features
- Queue predictions based on time of day
- Personalized slope recommendations
- Equipment suggestions based on weather
- Natural language Q&A

### Offline Support
- Cache last known conditions
- Show "offline" indicator
- Queue actions for when back online

## Components Needed

### Cards
- StatCard (icon, value, label, subtext)
- LiftCard (status, name, queue, type)
- SlopeCard (number, name, difficulty, status)
- WeatherCard (day, icon, temps)
- RecommendationCard (AI tip with icon)

### Charts
- Progress ring (for lift/slope percentages)
- Line chart (snow depth trend)
- Bar chart (slopes by difficulty)

### Navigation
- Bottom tab bar: Home, Lifts, Slopes, AI, More
- Resort switcher in header

### Alerts
- Powder alert banner (animated)
- Toast notifications
- Modal for AI responses

## Sample Data Structure

```json
{
  "resort": "SkiStar Trysil",
  "conditions": {
    "temp_top": -10,
    "temp_bottom": -14,
    "wind_speed": 4,
    "wind_direction": "E",
    "snow_depth": 83,
    "fresh_snow": 0,
    "condition": "Kjempebra forhold!",
    "powder_alert": false
  },
  "lifts": {
    "open": 29,
    "total": 31,
    "list": [
      {"name": "T7 Trysilgondolen", "status": "open", "type": "gondola"},
      {"name": "F9 Stjerna", "status": "closed", "type": "tbar"}
    ]
  },
  "slopes": {
    "open": 62,
    "total": 70,
    "by_difficulty": {
      "green": 18,
      "blue": 22,
      "red": 14,
      "black": 8
    }
  }
}
```

## Interactions

- **Swipe** between resorts on dashboard
- **Pull down** to refresh
- **Tap** cards for detail views
- **Long press** lift/slope to favorite
- **Shake** device for random slope suggestion (fun feature)

## Animations
- Smooth transitions between screens
- Pulse animation on powder alert
- Snow particle effect on loading
- Progress rings animate on load
- Cards slide in on scroll

## Build this as a PWA that works great on mobile!
