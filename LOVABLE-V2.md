# 🎿 Majora Alpine V2 - Chat Navigation + Live Map

Build a ski navigation app with natural language chat and animated route visualization!

## 🎯 CORE CONCEPT

User chats: "Ta mig till Høgegga"
→ App shows route animated on real piste map
→ Step-by-step directions with timing

## 🗺️ MAIN VIEW: INTERACTIVE MAP

### Map Setup
```jsx
// Use official Trysil piste map as background
const MAP_IMAGE = "https://www.skistar.com/globalassets/bilder-nya-skistar.com/kartor/pistkartor-2526/1920x1400/1920_1400px_trysil_2526.jpg";

// Zone positions (% of map dimensions)
const ZONES = {
  turistsenteret: { x: 25, y: 75, label: 'Turistsenteret' },
  skihytta: { x: 10, y: 60, label: 'Skihytta' },
  knettsetra: { x: 35, y: 55, label: 'Knettsetra' },
  høyfjell_bottom: { x: 55, y: 45, label: 'Høyfjell' },
  høyfjell_top: { x: 65, y: 20, label: 'Toppen' },
  høgegga: { x: 80, y: 35, label: 'Høgegga' },
  skistar_lodge: { x: 85, y: 60, label: 'Lodge' }
};
```

### Map Features
- **Piste map background** (zoomable, pannable)
- **Zone markers** as subtle dots (pulse when relevant)
- **Lift lines** shown as colored paths
- **Queue indicators** (🟢🟡🔴) on each lift
- **User position** (blue pulsing dot)

## 💬 CHAT INTERFACE

### Chat Box (bottom of screen)
```jsx
<ChatInput 
  placeholder="Vart vill du åka? 🎿"
  onSend={handleChat}
/>
```

### Example Conversations
```
User: "Ta mig till Høgegga"
Bot: "🗺️ Liekspressen → Høgegga
      ⏱️ ~18 min
      
      1. 🚡 Ta Knetta (6 min)
      2. 🚡 Ta Toppekspressen (4 min)
      3. ⛷️ Åk ner till Høgegga (3 min)
      4. 🚡 Ta Høgekspressen (5 min)"
      
[MAP ANIMATES THE ROUTE]

User: "Hur är köerna?"
Bot: "🎿 Köläget just nu:
      ✅ Bäst: Hygglo (0.5 min), Knetta (0.5 min)
      ⚠️ Undvik: Gondolen (3 min)"
      
[MAP HIGHLIGHTS QUEUE COLORS]

User: "Från gondolen till toppen"
Bot: "🗺️ Trysilgondolen → Toppekspressen
      ⏱️ ~7 min"
      
[MAP SHOWS ROUTE]
```

## 🎨 ROUTE ANIMATION

When a route is returned, animate on map:

```jsx
const animateRoute = (path) => {
  // 1. Highlight start point (pulse green)
  // 2. Draw line segment by segment (1 sec each)
  // 3. Different styles for lift vs slope:
  //    - Lift: solid blue line, ski lift icon moves along
  //    - Slope: dashed red line, skier icon moves along
  // 4. Highlight end point (pulse gold)
};

// Path format from API:
// [
//   { type: 'lift', liftName: 'Knetta', startCoord: {x,y}, endCoord: {x,y} },
//   { type: 'slope', startCoord: {x,y}, endCoord: {x,y} },
//   ...
// ]
```

## 🔌 API INTEGRATION

```javascript
const API_BASE = 'https://your-api.com'; // or localhost:3850

// Chat navigation
const navigate = async (message, currentLocation) => {
  const res = await fetch(`${API_BASE}/navigate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, currentLocation })
  });
  return res.json();
  // Returns: { type, message, route, showOnMap, path }
};

// Get all queues
const getQueues = async () => {
  const res = await fetch(`${API_BASE}/queues`);
  return res.json();
  // Returns: { queues: [...], recommendation }
};

// Get lift forecast
const getLiftForecast = async (liftId) => {
  const res = await fetch(`${API_BASE}/queue/${liftId}`);
  return res.json();
};
```

## 🎛️ UI COMPONENTS

### 1. Map Container
```jsx
<MapContainer>
  <PisteMapImage src={MAP_IMAGE} />
  <ZoneMarkers zones={ZONES} queues={queueData} />
  <RoutePath path={currentRoute} animated={true} />
  <UserMarker position={userPosition} />
</MapContainer>
```

### 2. Chat Panel (slide up from bottom)
```jsx
<ChatPanel expanded={chatOpen}>
  <MessageList messages={messages} />
  <QuickReplies options={['Köerna', 'Toppen', 'Høgegga', 'Skihytta']} />
  <ChatInput onSend={handleSend} />
</ChatPanel>
```

### 3. Queue Overview (collapsible sidebar)
```jsx
<QueueSidebar>
  <QueueHeader>Köer just nu</QueueHeader>
  {queues.map(q => (
    <QueueItem 
      key={q.id}
      emoji={q.emoji}
      name={q.name}
      minutes={q.queueMinutes}
      onClick={() => highlightLift(q.id)}
    />
  ))}
</QueueSidebar>
```

### 4. Route Card (appears after navigation)
```jsx
<RouteCard visible={!!currentRoute}>
  <RouteHeader>
    {route.from.name} → {route.to.name}
  </RouteHeader>
  <RouteTime>{route.totalMinutes} min</RouteTime>
  <RouteSteps>
    {route.steps.map((step, i) => (
      <Step key={i} type={step.type}>
        {step.type === 'lift' ? '🚡' : '⛷️'} {step.action}
      </Step>
    ))}
  </RouteSteps>
  <Button onClick={startNavigation}>Starta navigation</Button>
</RouteCard>
```

## 🎨 DESIGN STYLE

- **Dark map overlay** for better contrast
- **Glassmorphism** on cards (blur + transparency)
- **Accent color**: Electric blue (#00D4FF)
- **Route colors**: 
  - Lift = blue (#00D4FF)
  - Slope = orange (#FF6B35)
- **Queue colors**:
  - Low = green (#00FF88)
  - Medium = yellow (#FFD700)
  - High = red (#FF4444)

## 📱 MOBILE FIRST

- Full-screen map
- Chat slides up from bottom (50% height)
- Swipe down to minimize chat
- Tap zones on map to quick-navigate
- Pinch to zoom

## ✨ ANIMATIONS

1. **Route drawing**: SVG path animation, 0.5s per segment
2. **Queue pulses**: CSS pulse animation on high-queue lifts
3. **Chat messages**: Fade in from bottom
4. **Zone highlight**: Scale + glow on hover/tap

## 🎯 QUICK ACTIONS

Floating buttons on map:
- 📍 "Jag är här" (set location)
- 🎿 "Bästa liften" (show recommendation)
- 🗣️ "Prata" (open chat)

---

## EXAMPLE FLOW

1. User opens app → sees map with queue colors
2. Taps chat → "Ta mig till toppen"
3. API returns route with coordinates
4. Map animates: Turistsenteret → Gondolen → Toppen
5. Route card appears with steps
6. User taps "Starta" → blue dot follows route
7. Each step highlights as user progresses

---

Make it feel like a GAME! Smooth animations, satisfying interactions, beautiful design! 🎿🗺️✨
