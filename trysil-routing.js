#!/usr/bin/env node
/**
 * 🗺️ TRYSIL SMART ROUTING
 * Hitta bästa vägen mellan två liftar
 */

// Områden i Trysil
const ZONES = {
  SKIHYTTA: 'skihytta',
  TURISTSENTERET: 'turistsenteret', 
  KNETTSETRA: 'knettsetra',
  HØYFJELL_BOTTOM: 'høyfjell_bottom',
  HØYFJELL_TOP: 'høyfjell_top',
  HØGEGGA: 'høgegga',
  SKISTAR_LODGE: 'skistar_lodge'
};

// Lift-data med start/slut-zon
const LIFTS = {
  // Skihytta-området
  'S1': { name: 'Skihytta Ekspress', from: ZONES.SKIHYTTA, to: ZONES.KNETTSETRA, type: 'express', minutes: 6 },
  'S3': { name: 'Valleheisen', from: ZONES.SKIHYTTA, to: ZONES.SKIHYTTA, type: 'beginner', minutes: 3 },
  'S4': { name: "Tolver'n", from: ZONES.SKIHYTTA, to: ZONES.KNETTSETRA, type: 'chair', minutes: 8 },
  
  // Turistsenteret-området  
  'T1': { name: 'Liekspressen', from: ZONES.TURISTSENTERET, to: ZONES.KNETTSETRA, type: 'express', minutes: 7 },
  'T2': { name: 'Fjellekspressen', from: ZONES.TURISTSENTERET, to: ZONES.HØYFJELL_BOTTOM, type: 'express', minutes: 8 },
  'T3': { name: 'Hygglo', from: ZONES.TURISTSENTERET, to: ZONES.KNETTSETRA, type: 'chair', minutes: 5 },
  'T4': { name: 'Fryvil', from: ZONES.TURISTSENTERET, to: ZONES.TURISTSENTERET, type: 'beginner', minutes: 3 },
  'T7': { name: 'Trysilgondolen', from: ZONES.TURISTSENTERET, to: ZONES.HØYFJELL_TOP, type: 'gondola', minutes: 12 },
  'T8': { name: 'Knetta', from: ZONES.KNETTSETRA, to: ZONES.HØYFJELL_BOTTOM, type: 'chair', minutes: 6 },
  
  // Høyfjell-området
  'F1': { name: 'Brynbekken', from: ZONES.HØYFJELL_BOTTOM, to: ZONES.HØYFJELL_TOP, type: 'chair', minutes: 5 },
  'F2': { name: 'Toppekspressen', from: ZONES.HØYFJELL_BOTTOM, to: ZONES.HØYFJELL_TOP, type: 'express', minutes: 4 },
  'F3': { name: 'Kanken', from: ZONES.SKISTAR_LODGE, to: ZONES.HØYFJELL_BOTTOM, type: 'chair', minutes: 6 },
  'F5': { name: 'Skarven', from: ZONES.SKISTAR_LODGE, to: ZONES.HØYFJELL_TOP, type: 'chair', minutes: 8 },
  
  // Høgegga
  'H1': { name: 'Høgekspressen', from: ZONES.HØGEGGA, to: ZONES.HØYFJELL_TOP, type: 'express', minutes: 5 },
  'H2': { name: 'Høgegga', from: ZONES.HØGEGGA, to: ZONES.HØGEGGA, type: 'tbar', minutes: 4 }
};

// Nedfarter mellan zoner (hur man tar sig NER)
const SLOPES = {
  [ZONES.KNETTSETRA]: [ZONES.TURISTSENTERET, ZONES.SKIHYTTA],
  [ZONES.HØYFJELL_BOTTOM]: [ZONES.TURISTSENTERET, ZONES.KNETTSETRA, ZONES.SKISTAR_LODGE],
  [ZONES.HØYFJELL_TOP]: [ZONES.HØYFJELL_BOTTOM, ZONES.HØGEGGA, ZONES.SKISTAR_LODGE],
  [ZONES.HØGEGGA]: [ZONES.HØYFJELL_BOTTOM, ZONES.SKISTAR_LODGE],
  [ZONES.SKISTAR_LODGE]: [ZONES.HØYFJELL_BOTTOM]
};

// Tid för att åka ner (minuter)
const SLOPE_TIME = 3; // Genomsnitt

/**
 * Bygg graf för routing
 */
function buildGraph() {
  const graph = {};
  
  // Initiera alla zoner
  Object.values(ZONES).forEach(zone => {
    graph[zone] = [];
  });
  
  // Lägg till liftar (tar dig UPP)
  Object.entries(LIFTS).forEach(([id, lift]) => {
    graph[lift.from].push({
      to: lift.to,
      type: 'lift',
      liftId: id,
      liftName: lift.name,
      minutes: lift.minutes
    });
  });
  
  // Lägg till nedfarter (tar dig NER)
  Object.entries(SLOPES).forEach(([from, destinations]) => {
    destinations.forEach(to => {
      graph[from].push({
        to: to,
        type: 'slope',
        minutes: SLOPE_TIME
      });
    });
  });
  
  return graph;
}

/**
 * Hitta kortaste vägen (Dijkstra)
 */
function findRoute(fromLift, toLift) {
  const graph = buildGraph();
  
  // Hitta start och mål-zon
  const startLift = LIFTS[fromLift];
  const endLift = LIFTS[toLift];
  
  if (!startLift || !endLift) {
    return { error: 'Lift not found' };
  }
  
  const startZone = startLift.to; // Vi startar där liften SLUTAR (toppen)
  const endZone = endLift.from;   // Vi vill komma till där liften BÖRJAR (botten)
  
  // Dijkstra
  const distances = {};
  const previous = {};
  const visited = new Set();
  const queue = [];
  
  Object.values(ZONES).forEach(zone => {
    distances[zone] = Infinity;
  });
  distances[startZone] = 0;
  queue.push({ zone: startZone, dist: 0 });
  
  while (queue.length > 0) {
    queue.sort((a, b) => a.dist - b.dist);
    const { zone: current } = queue.shift();
    
    if (visited.has(current)) continue;
    visited.add(current);
    
    if (current === endZone) break;
    
    for (const edge of graph[current] || []) {
      const newDist = distances[current] + edge.minutes;
      if (newDist < distances[edge.to]) {
        distances[edge.to] = newDist;
        previous[edge.to] = { zone: current, edge };
        queue.push({ zone: edge.to, dist: newDist });
      }
    }
  }
  
  // Bygg rutt bakåt
  const route = [];
  let current = endZone;
  
  while (previous[current]) {
    const { zone, edge } = previous[current];
    route.unshift({
      from: zone,
      to: current,
      ...edge
    });
    current = zone;
  }
  
  // Lägg till mål-liften
  route.push({
    from: endZone,
    to: endLift.to,
    type: 'lift',
    liftId: toLift,
    liftName: endLift.name,
    minutes: endLift.minutes
  });
  
  return {
    from: { id: fromLift, name: startLift.name },
    to: { id: toLift, name: endLift.name },
    totalMinutes: distances[endZone] + endLift.minutes,
    steps: route
  };
}

/**
 * Formatera rutt för visning
 */
function formatRoute(route) {
  if (route.error) return `❌ ${route.error}`;
  
  let output = `\n🗺️ RUTT: ${route.from.name} → ${route.to.name}\n`;
  output += `⏱️ Total tid: ~${route.totalMinutes} minuter\n\n`;
  
  route.steps.forEach((step, i) => {
    if (step.type === 'lift') {
      output += `${i + 1}. 🚡 Ta ${step.liftName} (${step.minutes} min)\n`;
    } else {
      output += `${i + 1}. ⛷️ Åk ner till ${step.to} (~${step.minutes} min)\n`;
    }
  });
  
  return output;
}

// CLI
const args = process.argv.slice(2);
if (args.length === 2) {
  const route = findRoute(args[0].toUpperCase(), args[1].toUpperCase());
  console.log(formatRoute(route));
} else if (args[0] === '--list') {
  console.log('\n📋 TILLGÄNGLIGA LIFTAR:\n');
  Object.entries(LIFTS).forEach(([id, lift]) => {
    console.log(`  ${id}: ${lift.name}`);
  });
} else {
  console.log('Usage: node trysil-routing.js <from-lift> <to-lift>');
  console.log('       node trysil-routing.js --list');
  console.log('\nExample: node trysil-routing.js T1 F2');
}

module.exports = { findRoute, formatRoute, LIFTS, ZONES };
