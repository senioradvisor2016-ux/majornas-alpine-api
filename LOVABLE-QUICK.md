# Majora Alpine - Lovable Prompt

Build a ski resort dashboard PWA called "Majora Alpine - På Vift i Lift".

## API
Use this public API directly:
```
https://api.fnugg.no/search?q=trysil
```

## Design
- Dark theme (#0f1729 background, #1a2744 cards, #3b82f6 accent)
- Modern, premium ski app feel
- Mobile-first PWA

## Features
1. **Dashboard**: Temperature, wind, snow depth, lifts open (29/31), slopes open (62/70)
2. **Lift list**: Show all lifts with open/closed status
3. **Slope list**: Filter by difficulty (green/blue/red/black)
4. **Powder alert**: Banner when powder_alarm=true or fresh snow>10cm
5. **5-day forecast**: Weather cards
6. **Resort switcher**: Trysil, Hemsedal, Åre, Sälen

## Data Mapping
From API response `hits.hits[0]._source`:
- `lifts.open` / `lifts.count` → Lifts stat
- `slopes.open` / `slopes.count` → Slopes stat  
- `conditions.combined.top.temperature.value` → Temp
- `conditions.combined.top.wind.mps` → Wind
- `conditions.combined.top.snow.depth_slope` → Snow depth
- `conditions.combined.top.snow.today` → Fresh snow
- `conditions.combined.top.powder_alarm` → Powder alert
- `conditions.combined.top.condition_description` → Status text

## UI Components
- Hero card with current temp & conditions
- 4-stat grid (lifts, slopes, snow, fresh snow)
- Lift cards with green/red status dots
- Slope cards with difficulty color badges
- Pull-to-refresh
- Bottom navigation

Build it beautiful! 🎿
