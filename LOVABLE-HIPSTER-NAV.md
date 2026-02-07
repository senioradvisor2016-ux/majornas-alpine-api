# 🎿 Majornas Alpine - I Lift på Vift

## Chat Navigation + Animated Map + Hipster Aesthetic

---

## 🎨 HIPSTER DESIGN

### Colors
```css
--cream: #F5F0E8;
--espresso: #2C1810;
--rust: #C45C26;
--forest: #2D4A3E;
--gold: #D4A03D;
--slate: #4A5568;
```

### Typography
- Headlines: **Playfair Display** (serif, elegant)
- Body: **Work Sans** (clean, readable)
- Accents: **Space Mono** (monospace, for times/stats)

### Vibe
- Vintage ski poster meets craft coffee shop
- Muted earth tones with pops of rust/gold
- Hand-drawn style icons
- Grain/texture overlays
- Rounded corners, soft shadows
- "Analog" feeling UI elements

---

## 🗺️ MAP VIEW

### Background
```jsx
// Trysil piste map with vintage filter
<MapContainer>
  <PisteMap 
    src="trysil-pistekarta.jpg"
    filter="sepia(20%) contrast(1.1)"
  />
  <GrainOverlay opacity={0.05} />
</MapContainer>
```

### Zone Markers
- Vintage-style pins (like old map markers)
- Handwritten-style labels
- Pulse animation = soft glow, not harsh

### Route Drawing
- **Lifts**: Thick cream/gold dashed line
- **Slopes**: Rust-colored brush stroke style
- Animated like drawing with a pen

---

## 💬 CHAT INTERFACE

### Design
```jsx
<ChatPanel className="glass-panel">
  {/* Vintage paper texture background */}
  <PaperTexture />
  
  <Messages>
    {messages.map(m => (
      <Message 
        className={m.sender === 'bot' ? 'typewriter' : 'handwritten'}
      >
        {m.text}
      </Message>
    ))}
  </Messages>
  
  <Input 
    placeholder="Vart ska äventyret gå? ✨"
    className="vintage-input"
  />
</ChatPanel>
```

### Message Styles
- **Bot**: Typewriter font, appears letter by letter
- **User**: Slightly tilted, like handwritten note
- **Route cards**: Vintage ticket/boarding pass style

---

## 🎫 ROUTE CARD (Vintage Ticket Style)

```
┌─────────────────────────────────────┐
│  ✂ · · · · · · · · · · · · · · ·  │
│                                     │
│  🎿 MAJORNAS ALPINE                 │
│     I LIFT PÅ VIFT                  │
│                                     │
│  FRÅN: Liekspressen                 │
│  TILL: Høgekspressen                │
│                                     │
│  ══════════════════════             │
│                                     │
│  1. 🚡 Knetta ........... 6 min    │
│  2. 🚡 Toppekspressen ... 4 min    │
│  3. ⛷️ Åk ner ........... 3 min    │
│  4. 🚡 Høgekspressen .... 5 min    │
│                                     │
│  ══════════════════════             │
│  TOTAL TID: ~18 min                 │
│                                     │
│  ✂ · · · · · · · · · · · · · · ·  │
└─────────────────────────────────────┘
```

---

## 🎯 QUICK PHRASES

Hipster-style suggestions:
```
"Toppen, tack!" 
"Var är pulvret?"
"Undvik massorna"
"Geheimtipp?"
```

---

## 📊 QUEUE DISPLAY

Vintage gauge/meter style:
```
┌──────────────────┐
│  GONDOLEN        │
│  ┌────────────┐  │
│  │ ▓▓▓░░░░░░░ │  │  ← Analog meter
│  └────────────┘  │
│  3 min · Lugnt   │
└──────────────────┘
```

---

## 🎨 UI COMPONENTS

### Header
```jsx
<Header className="vintage-header">
  <Logo>
    <Mountain className="hand-drawn" />
    <Title>
      <span className="script">Majornas</span>
      <span className="bold">ALPINE</span>
    </Title>
    <Tagline>I Lift på Vift ✨</Tagline>
  </Logo>
</Header>
```

### Floating Action Buttons
Circular, wood-texture background:
- 📍 "Jag är här"
- 💬 "Snacka"  
- 🎿 "Tips"

### Loading States
- Vintage ski lift animation
- "Spanar efter bästa rutten..." text

---

## 🔌 API ENDPOINTS

```javascript
// Base URL
const API = 'http://localhost:3850';

// Chat navigation
GET /navigate?q=Ta mig till Høgegga
→ { message, route: { path: [...coords] }, showOnMap }

// All queues
GET /queues
→ { queues: [...], recommendation }

// Specific lift
GET /queue/T7
→ { lift, forecast: [...], bestTimes, worstTimes }
```

---

## 📱 LAYOUT

```
┌─────────────────────────────────────┐
│  Majornas Alpine · I Lift på Vift   │  ← Header
├─────────────────────────────────────┤
│                                     │
│         [PISTE MAP]                 │  ← 60% height
│      with route overlay             │
│                                     │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │ 💬 Chat / Route Card        │   │  ← 40% height
│  │                             │   │     Swipe up/down
│  │ "Vart ska äventyret gå?"    │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## ✨ MICRO-INTERACTIONS

1. **Tap zone on map** → Ripple effect + "Åka hit?" tooltip
2. **Route animates** → Pen-drawing style, slight wobble
3. **Queue updates** → Gauge needle moves smoothly
4. **Send message** → Paper airplane animation
5. **New route** → Ticket "stamps" into view

---

## 🎭 PERSONALITY

Bot responses have character:
- "Ah, Høgegga! En klassiker. Här kommer rutten..."
- "Köerna? Låt mig kolla... *justerar skidglasögonen*"
- "Toppen säger du? Bokstavligen! 🏔️"
- "Undvik gondolen just nu, hipsters väntar inte i kö 😎"

---

## 🖼️ ASSETS NEEDED

1. Vintage grain texture (PNG overlay)
2. Hand-drawn ski icons
3. Paper/parchment texture for chat
4. Wood texture for buttons
5. Retro ski poster style illustrations

---

Build it BEAUTIFUL! Vintage meets modern, functional meets delightful! 🎿✨
