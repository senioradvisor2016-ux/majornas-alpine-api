#!/usr/bin/env node
/**
 * 🧠 CHAT NAVIGATOR
 * Naturlig konversation → Rutt på karta
 */

const { findRoute, LIFTS, ZONES } = require('./trysil-routing.js');
const { SLOPES, AREA_INFO } = require('./trysil-navigator.js');
const { getAllQueuesNow, getDayForecast } = require('./queue-predictor.js');

// Koordinater för kartan (ungefärliga, för visualisering)
const ZONE_COORDS = {
  'turistsenteret': { x: 25, y: 75, label: 'Turistsenteret' },
  'skihytta': { x: 10, y: 60, label: 'Skihytta' },
  'knettsetra': { x: 35, y: 55, label: 'Knettsetra' },
  'høyfjell_bottom': { x: 55, y: 45, label: 'Høyfjell' },
  'høyfjell_top': { x: 65, y: 20, label: 'Toppen' },
  'høgegga': { x: 80, y: 35, label: 'Høgegga' },
  'skistar_lodge': { x: 85, y: 60, label: 'SkiStar Lodge' }
};

// Lift-koordinater (start och slut)
const LIFT_COORDS = {
  'T1': { start: { x: 25, y: 75 }, end: { x: 35, y: 55 } },
  'T2': { start: { x: 25, y: 75 }, end: { x: 55, y: 45 } },
  'T7': { start: { x: 25, y: 75 }, end: { x: 65, y: 20 } },
  'T3': { start: { x: 25, y: 75 }, end: { x: 35, y: 55 } },
  'T8': { start: { x: 35, y: 55 }, end: { x: 55, y: 45 } },
  'S1': { start: { x: 10, y: 60 }, end: { x: 35, y: 55 } },
  'F1': { start: { x: 55, y: 45 }, end: { x: 65, y: 20 } },
  'F2': { start: { x: 55, y: 45 }, end: { x: 65, y: 20 } },
  'F3': { start: { x: 85, y: 60 }, end: { x: 55, y: 45 } },
  'F5': { start: { x: 85, y: 60 }, end: { x: 65, y: 20 } },
  'H1': { start: { x: 80, y: 35 }, end: { x: 65, y: 20 } },
  'H2': { start: { x: 80, y: 35 }, end: { x: 80, y: 25 } }
};

/**
 * Alias för liftar och platser
 */
const ALIASES = {
  // Liftar
  'gondolen': 'T7', 'gondol': 'T7', 'trysilgondolen': 'T7',
  'liekspressen': 'T1', 'lieken': 'T1',
  'fjellekspressen': 'T2', 'fjellen': 'T2',
  'toppekspressen': 'F2', 'toppen': 'F2',
  'høgekspressen': 'H1', 'høgexpressen': 'H1',
  'skihytta ekspress': 'S1', 'skihytta': 'S1',
  'knetta': 'T8',
  'hygglo': 'T3',
  
  // Områden
  'turistsenteret': 'T1',
  'høyfjell': 'F2',
  'høyfjellssenteret': 'F2',
  'høgegga': 'H1',
  'skistar lodge': 'F3',
  'lodge': 'F3'
};

/**
 * Tolka användarens fråga och extrahera navigation
 */
function parseNavigationQuery(query) {
  const q = query.toLowerCase();
  
  // Mönster: "från X till Y", "hur kommer jag till Y", "vägen till Y", "ta mig till Y"
  const patterns = [
    /(?:från|from)\s+(.+?)\s+(?:till|to)\s+(.+)/i,
    /(?:hur|how)\s+(?:tar|kommer|går)\s+(?:jag|man)\s+(?:till|from)?\s*(.+?)\s+(?:till|to)\s+(.+)/i,
    /(?:hur|how)\s+(?:tar|kommer|går)\s+(?:jag|man)\s+(?:till|to)\s+(.+)/i,
    /(?:vägen|rutt|route)\s+(?:till|to|från|from)\s+(.+?)\s+(?:till|to)\s+(.+)/i,
    /(?:vägen|rutt|route)\s+(?:till|to)\s+(.+)/i,
    /(?:ta mig|navigera|guide)\s+(?:till|to)\s+(.+)/i,
    /(?:jag vill|will)\s+(?:till|to|åka till)\s+(.+)/i
  ];
  
  for (const pattern of patterns) {
    const match = q.match(pattern);
    if (match) {
      if (match[2]) {
        return { from: match[1].trim(), to: match[2].trim() };
      } else {
        return { from: null, to: match[1].trim() };
      }
    }
  }
  
  return null;
}

/**
 * Konvertera namn/alias till lift-ID
 */
function resolveToLiftId(name) {
  if (!name) return null;
  const n = name.toLowerCase().trim();
  
  // Direkt match på ID
  if (LIFTS[n.toUpperCase()]) return n.toUpperCase();
  
  // Alias
  if (ALIASES[n]) return ALIASES[n];
  
  // Fuzzy match på liftnamn
  for (const [id, lift] of Object.entries(LIFTS)) {
    if (lift.name.toLowerCase().includes(n)) return id;
  }
  
  // Fuzzy match på alias
  for (const [alias, id] of Object.entries(ALIASES)) {
    if (alias.includes(n) || n.includes(alias)) return id;
  }
  
  return null;
}

/**
 * Generera rutt med koordinater för karta
 */
function getRouteWithCoords(fromId, toId) {
  const route = findRoute(fromId, toId);
  if (route.error) return route;
  
  // Lägg till koordinater för varje steg
  const path = [];
  
  route.steps.forEach((step, i) => {
    if (step.type === 'lift' && LIFT_COORDS[step.liftId]) {
      const coords = LIFT_COORDS[step.liftId];
      path.push({
        ...step,
        startCoord: coords.start,
        endCoord: coords.end,
        pathType: 'lift'
      });
    } else if (step.type === 'slope') {
      // Slope - hitta koordinater från zoner
      const fromCoord = ZONE_COORDS[step.from];
      const toCoord = ZONE_COORDS[step.to];
      if (fromCoord && toCoord) {
        path.push({
          ...step,
          startCoord: fromCoord,
          endCoord: toCoord,
          pathType: 'slope'
        });
      }
    }
  });
  
  return {
    ...route,
    path,
    mapData: {
      zones: ZONE_COORDS,
      startZone: route.from,
      endZone: route.to
    }
  };
}

/**
 * Huvudfunktion: Chatta och få rutt
 */
function chatNavigate(message, currentLocation = null) {
  const q = message.toLowerCase();
  
  // 1. Försök tolka som navigation
  const navQuery = parseNavigationQuery(message);
  
  if (navQuery) {
    let fromId = navQuery.from ? resolveToLiftId(navQuery.from) : null;
    let toId = resolveToLiftId(navQuery.to);
    
    // Om ingen start angiven, använd currentLocation eller default
    if (!fromId && currentLocation) {
      fromId = resolveToLiftId(currentLocation);
    }
    if (!fromId) {
      fromId = 'T1'; // Default: Turistsenteret
    }
    
    if (!toId) {
      return {
        type: 'error',
        message: `Jag förstod inte vart du vill. Prova: "Ta mig till Høgegga" eller "Från gondolen till Toppekspressen"`,
        suggestions: ['Høgegga', 'Toppen', 'Skihytta', 'SkiStar Lodge']
      };
    }
    
    const route = getRouteWithCoords(fromId, toId);
    
    if (route.error) {
      return {
        type: 'error',
        message: `Kunde inte hitta rutt: ${route.error}`,
        suggestions: Object.keys(LIFTS).slice(0, 5)
      };
    }
    
    // Formatera svar
    const steps = route.steps.map((step, i) => {
      if (step.type === 'lift') {
        return `${i + 1}. 🚡 Ta **${step.liftName}** (${step.minutes} min)`;
      } else {
        return `${i + 1}. ⛷️ Åk ner till **${step.to}** (~${step.minutes} min)`;
      }
    });
    
    return {
      type: 'route',
      message: `🗺️ **${route.from.name} → ${route.to.name}**\n⏱️ Total tid: ~${route.totalMinutes} min\n\n${steps.join('\n')}`,
      route: route,
      showOnMap: true
    };
  }
  
  // 2. Kö-frågor
  if (q.includes('kö') || q.includes('vänta') || q.includes('queue')) {
    const queues = getAllQueuesNow();
    const worst = queues.slice(-3);
    const best = queues.slice(0, 3);
    
    return {
      type: 'queue',
      message: `🎿 **Köläget just nu:**\n\n` +
        `✅ **Bäst:**\n${best.map(q => `${q.emoji} ${q.name}: ${q.queueMinutes} min`).join('\n')}\n\n` +
        `⚠️ **Undvik:**\n${worst.map(q => `${q.emoji} ${q.name}: ${q.queueMinutes} min`).join('\n')}`,
      queues: { best, worst },
      showOnMap: true
    };
  }
  
  // 3. Var är X?
  const whereMatch = q.match(/(?:var|where)\s+(?:är|is|ligger)\s+(.+)/i);
  if (whereMatch) {
    const place = whereMatch[1].trim();
    const liftId = resolveToLiftId(place);
    
    if (liftId && LIFT_COORDS[liftId]) {
      const lift = LIFTS[liftId];
      const coords = LIFT_COORDS[liftId];
      return {
        type: 'location',
        message: `📍 **${lift.name}** (${liftId})\nStartar vid: ${lift.from}\nSlutar vid: ${lift.to}`,
        highlight: { liftId, coords },
        showOnMap: true
      };
    }
  }
  
  // 4. Fallback
  return {
    type: 'help',
    message: `🎿 **Jag kan hjälpa dig med:**\n\n` +
      `• "Ta mig till Høgegga"\n` +
      `• "Från gondolen till Toppekspressen"\n` +
      `• "Hur är köerna?"\n` +
      `• "Var ligger Skihytta?"\n\n` +
      `Vart vill du åka? 🗺️`,
    suggestions: ['Høgegga', 'Toppen', 'Gondolen', 'Köerna']
  };
}

module.exports = {
  chatNavigate,
  parseNavigationQuery,
  resolveToLiftId,
  getRouteWithCoords,
  ZONE_COORDS,
  LIFT_COORDS,
  ALIASES
};

// CLI test
if (require.main === module) {
  const query = process.argv.slice(2).join(' ') || 'Ta mig till Høgegga';
  const result = chatNavigate(query);
  console.log('\n' + result.message);
  if (result.route) {
    console.log('\n📊 Path data för karta:', result.route.path?.length, 'steg');
  }
}
