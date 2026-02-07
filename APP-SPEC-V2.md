# 🎿 Majora Alpine 2.0 - App Specification

## Vision
**Den smartaste skidappen i Skandinavien** - Realtidsdata + AI-driven insikter + Familje-kul

---

## 🏔️ CORE FEATURES (Skidapp)

### 1. Live Dashboard
- **Lift Status** - Alla liftar med öppen/stängd + köttid
- **Backe Status** - Alla backar med preparering, status
- **Väder Widget** - Temp, vind, sikt, snöförhållanden
- **Snö-rapport** - Senaste snöfall, underlag, kvalitet

### 2. Interaktiv Pistkarta
- Officiell SkiStar-karta som bakgrund
- **Tappable liftar** - Visa status, kötid, senast öppnad
- **Tappable backar** - Svårighet, längd, höjdskillnad
- **Live crowd indicators** - Grönt/gult/rött per område
- Zoom & pan, fungerar offline

### 3. Smart Prognos
- 7-dagars väderprognos
- **"Bästa dagen"** - AI-rankar kommande dagar
- **Snöprognos** - När kommer nästa snöfall?
- **Vind-varning** - Vilka liftar riskerar stänga?

---

## 🚀 UNIKA FEATURES (Ingen annan har)

### 4. 🧠 AI Köprediktion
```
Analyserar:
- Tid på dagen
- Veckodag
- Skollov/helgdag
- Väder (dåligt väder = färre)
- Historisk data

Output:
"Trysilexpressen: 2 min nu → 15 min kl 11"
"Bästa tid för Högfjällsliften: 13:30"
```

### 5. 📍 Smart Routing
- "Jag är vid Turistsenteret, vill till Högfjället"
- Visar optimal rutt (liftar + backar)
- Estimerad tid
- Alternativa rutter vid kö

### 6. 🎯 Personlig Dagsplan
```
Input: Nivå (nybörjare/mellan/avancerad), antal timmar
Output:
09:00 - Uppvärmning: Barnbacken (grön)
09:30 - Trysilexpressen → Backe 43 (blå)
10:30 - Fika: Skihytta (15 min)
11:00 - Högfjällsliften → Backe 52 (röd)
12:30 - Lunch: Knettsetra
...
```

### 7. ⚡ Realtidsrapporter
- Användare kan rapportera:
  - "Lång kö vid X"
  - "Isigt på backe Y"
  - "Grym powder vid Z"
- Visas som overlay på kartan
- Upvote/downvote för trovärdighet

### 8. 🏆 Resort Jämförelse
```
Idag bäst: Trysil (sol, lite vind, bra snö)
        vs Hemsedal (molnigt, blåsigt)
        vs Åre (snöfall, begränsad sikt)
```

### 9. 🔔 Smarta Notiser
- "Lift X har öppnat!"
- "Kön vid Y har minskat till 3 min"
- "Snöfall börjar om 2 timmar"
- "Dags för lunch enligt din plan"

### 10. 📊 Statistik & Historia
- Dina åkta höjdmeter (manuell input eller GPS)
- Favoritbackar
- "Förra veckan: 12 min snittköttid"
- Personliga rekord

---

## 👨‍👩‍👧‍👦 FAMILJE-FEATURES

### 11. Familjeläge
- Lägg till familjemedlemmar
- Roliga avatarer & citat
- "Hitta familjen" - Var är alla?
- Gemensam dagsplan
- Mötesplatser med timer

### 12. Kul-Features (opt-in)
- Edgar Danger Level
- Christer GPS
- Peter's Synth Timer
- Julia's Spreadsheet
- Achievement system
- Familje-feed

---

## 🔌 API ARKITEKTUR

### Fnugg.no (Primary)
```javascript
GET https://api.fnugg.no/search?q={resort}

Returns:
- lifts.list[] → namn, status
- slopes.list[] → namn, svårighet, status
- conditions.combined → snöförhållanden
- conditions.forecast → väderprognos
- opening_hours → öppettider
- slope_map.image_full → pistekarta URL
```

### Majora API (Custom Backend)
```javascript
// Köprediktioner
GET /api/resort/{id}/queue-prediction
→ { lift: "Trysilexpressen", currentWait: 2, predictedWait: {...} }

// Dagsplan
POST /api/resort/{id}/day-plan
Body: { level: "intermediate", hours: 6, breaks: 2 }
→ { plan: [...activities] }

// Smart routing
GET /api/resort/{id}/route?from=tourist&to=hogfjall
→ { route: [...steps], estimatedTime: 25 }

// Crowd reports
POST /api/resort/{id}/report
Body: { type: "queue", lift: "T1", waitMinutes: 15 }

GET /api/resort/{id}/reports
→ { reports: [...] }

// Multi-resort comparison
GET /api/compare?resorts=trysil,hemsedal,are
→ { ranking: [...], bestToday: "trysil" }
```

### Yr.no (Weather Backup)
- Detaljerad timvis prognos
- Precipitation data

---

## 🎨 DESIGN

### Style
- **Clean & Functional** - Inte för lekfullt i skidläget
- **Wes Anderson mode** - Toggle för familje-features
- **Dark mode** - För användning i solljus
- Colors: Snow white, Alpine blue, Forest green, Warning red

### Navigation
```
[Dashboard] [Karta] [Plan] [Familj] [Mer]
```

### Mobile First
- Touch-optimerad
- Fungerar med handskar (stora knappar)
- Offline-läge med cachad data
- PWA - installerbar

---

## 📱 TECH STACK (Lovable)

- React + TypeScript
- Tailwind CSS
- Mapbox/Leaflet för karta (eller image overlay)
- Service Worker för offline
- LocalStorage för cache

---

## 🚀 MVP SCOPE

**Fas 1 - Core (vecka 1)**
1. Dashboard med live data
2. Lift & backe-status
3. Väder & prognos
4. Statisk karta med status

**Fas 2 - Smart (vecka 2)**
5. Köprediktion (mock → real)
6. Dagsplan-generator
7. Interaktiv karta

**Fas 3 - Social (vecka 3)**
8. Crowd reports
9. Resort-jämförelse
10. Notiser

**Fas 4 - Family (vecka 4)**
11. Familjeläge
12. Kul-features
13. Achievement system

---

## 🎯 USP (Unique Selling Points)

1. **AI-driven köprediktion** - Ingen annan app har detta
2. **Personlig dagsplanering** - Skräddarsytt för dig
3. **Cross-resort jämförelse** - Vart ska jag åka idag?
4. **Crowd-sourced realtidsdata** - Community-driven
5. **Familjeläge** - Seriöst + kul i en app

---

*"Den enda skidappen du behöver"*
