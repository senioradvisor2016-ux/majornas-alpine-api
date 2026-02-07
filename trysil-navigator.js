#!/usr/bin/env node
/**
 * 🧠 TRYSIL NAVIGATOR - LLM-driven ski navigation
 * Chat naturally about lifts, slopes, and routing
 */

const { findRoute, LIFTS, ZONES } = require('./trysil-routing.js');

// Backar med svårighetsgrad och kopplingar
const SLOPES = {
  // Turistsenteret-området
  '13': { name: 'Familieløypa', difficulty: 'green', zone: 'turistsenteret', lift: 'T4' },
  '14': { name: 'Lekeparken', difficulty: 'green', zone: 'turistsenteret', lift: 'T4' },
  '15': { name: 'Eventyrløypa', difficulty: 'green', zone: 'turistsenteret', lift: 'T6' },
  '19': { name: 'Trysilstien', difficulty: 'blue', zone: 'knettsetra', lift: 'T1' },
  '20': { name: 'Fun Ride', difficulty: 'blue', zone: 'knettsetra', lift: 'T3' },
  '22': { name: 'Lialøypa', difficulty: 'blue', zone: 'knettsetra', lift: 'T1' },
  '24': { name: 'Knettløypa', difficulty: 'red', zone: 'knettsetra', lift: 'T8' },
  '25': { name: 'Stupet', difficulty: 'black', zone: 'knettsetra', lift: 'T1' },
  
  // Skihytta-området  
  '27': { name: 'Skihyttløypa', difficulty: 'blue', zone: 'skihytta', lift: 'S1' },
  '28': { name: 'Morraløypa', difficulty: 'green', zone: 'skihytta', lift: 'S3' },
  
  // Høyfjell-området
  '43': { name: 'Panorama', difficulty: 'blue', zone: 'høyfjell_top', lift: 'F2' },
  '44': { name: 'Solsida', difficulty: 'blue', zone: 'høyfjell_top', lift: 'F2' },
  '45': { name: 'Ekspertløypa', difficulty: 'black', zone: 'høyfjell_top', lift: 'F2' },
  '46': { name: 'Fjellstien', difficulty: 'red', zone: 'høyfjell_top', lift: 'F1' },
  '48': { name: 'Høgegga-rennet', difficulty: 'black', zone: 'høgegga', lift: 'H1' },
  '50': { name: 'Skogsstien', difficulty: 'blue', zone: 'høyfjell_bottom', lift: 'F3' },
  '51': { name: 'Lodgeløypa', difficulty: 'green', zone: 'skistar_lodge', lift: 'F3' },
  
  // Vihammerskogen
  '33': { name: 'Vihammer Express', difficulty: 'red', zone: 'høyfjell_bottom', lift: 'T2' },
  '36': { name: 'Skogsveien', difficulty: 'blue', zone: 'høyfjell_bottom', lift: 'T2' },
  '37': { name: 'Naturstien', difficulty: 'green', zone: 'skistar_lodge', lift: 'F5' }
};

// Områdesbeskrivningar
const AREA_INFO = {
  'turistsenteret': {
    name: 'Turistsenteret',
    description: 'Huvudområdet med bra mix av backar. Nära parkering och service.',
    lifts: ['T1', 'T2', 'T3', 'T4', 'T6', 'T7'],
    bestFor: 'Alla nivåer, familjer'
  },
  'skihytta': {
    name: 'Skihytta',
    description: 'Västra sidan, lite lugnare. Bra nybörjarområde.',
    lifts: ['S1', 'S3', 'S4'],
    bestFor: 'Nybörjare, barnfamiljer'
  },
  'høyfjell_top': {
    name: 'Høyfjellssenteret (toppen)',
    description: 'Högsta punkten! Fantastisk utsikt, längre backar.',
    lifts: ['F1', 'F2'],
    bestFor: 'Avancerade, längre åk'
  },
  'høyfjell_bottom': {
    name: 'Høyfjellssenteret (botten)',
    description: 'Mellanstation med kopplingspunkt till flera områden.',
    lifts: ['T8', 'F3'],
    bestFor: 'Genomfart, mellannivå'
  },
  'høgegga': {
    name: 'Høgegga',
    description: 'Utmanande terräng för experter. Branta backar!',
    lifts: ['H1', 'H2'],
    bestFor: 'Experter, offpist'
  },
  'skistar_lodge': {
    name: 'SkiStar Lodge',
    description: 'Östra sidan med ski-in/ski-out till boendet.',
    lifts: ['F3', 'F5'],
    bestFor: 'Boende på östra sidan'
  }
};

/**
 * Systemkontext för LLM
 */
function buildSystemContext() {
  let context = `Du är en expert på Trysils skidsystem. Du hjälper besökare navigera mellan liftar och backar.

LIFTAR I TRYSIL:
`;
  
  Object.entries(LIFTS).forEach(([id, lift]) => {
    context += `- ${id} ${lift.name}: ${lift.from} → ${lift.to} (${lift.type}, ${lift.minutes} min)\n`;
  });
  
  context += `\nBACKAR I TRYSIL:\n`;
  Object.entries(SLOPES).forEach(([num, slope]) => {
    const diffEmoji = { green: '🟢', blue: '🔵', red: '🔴', black: '⚫' }[slope.difficulty];
    context += `- Backe ${num} "${slope.name}": ${diffEmoji} ${slope.difficulty}, zon: ${slope.zone}, lift: ${slope.lift}\n`;
  });
  
  context += `\nOMRÅDEN:\n`;
  Object.entries(AREA_INFO).forEach(([id, area]) => {
    context += `- ${area.name}: ${area.description} Liftar: ${area.lifts.join(', ')}. Bäst för: ${area.bestFor}\n`;
  });
  
  context += `
INSTRUKTIONER:
- Svara alltid på svenska
- Var konkret och hjälpsam
- Om någon frågar hur de tar sig mellan två punkter, ge steg-för-steg instruktioner
- Rekommendera backar baserat på användarens nivå
- Nämn liftnamn OCH backenummer/namn när relevant
- Var entusiastisk om skidåkning! 🎿
`;
  
  return context;
}

/**
 * Hitta backar för en nivå
 */
function findSlopesForLevel(level) {
  const levelMap = {
    'nybörjare': ['green'],
    'beginner': ['green'],
    'mellan': ['green', 'blue'],
    'intermediate': ['green', 'blue'],
    'avancerad': ['blue', 'red'],
    'advanced': ['blue', 'red'],
    'expert': ['red', 'black'],
    'proffs': ['black']
  };
  
  const difficulties = levelMap[level.toLowerCase()] || ['blue'];
  return Object.entries(SLOPES)
    .filter(([_, s]) => difficulties.includes(s.difficulty))
    .map(([num, s]) => ({ number: num, ...s }));
}

/**
 * Hitta lift för en backe
 */
function findLiftForSlope(slopeNum) {
  const slope = SLOPES[slopeNum];
  if (!slope) return null;
  return { slope, lift: LIFTS[slope.lift] };
}

/**
 * Skapa smart svar (för användning med LLM API)
 */
function getNavigatorContext() {
  return {
    systemPrompt: buildSystemContext(),
    lifts: LIFTS,
    slopes: SLOPES,
    areas: AREA_INFO,
    functions: {
      findRoute: (from, to) => findRoute(from, to),
      findSlopesForLevel: (level) => findSlopesForLevel(level),
      findLiftForSlope: (num) => findLiftForSlope(num)
    }
  };
}

/**
 * Quick query - för snabba svar utan LLM
 */
function quickQuery(query) {
  const q = query.toLowerCase();
  
  // Routing-fråga
  const routeMatch = q.match(/(?:från|from)\s+(\w+)\s+(?:till|to)\s+(\w+)/i);
  if (routeMatch) {
    const route = findRoute(routeMatch[1].toUpperCase(), routeMatch[2].toUpperCase());
    if (!route.error) {
      return route.formatted;
    }
  }
  
  // Nivå-fråga
  if (q.includes('nybörjare') || q.includes('grön')) {
    const slopes = findSlopesForLevel('nybörjare');
    return `🟢 Gröna backar för nybörjare:\n${slopes.map(s => `- Backe ${s.number} "${s.name}" (lift: ${s.lift})`).join('\n')}`;
  }
  
  if (q.includes('svart') || q.includes('expert')) {
    const slopes = findSlopesForLevel('expert');
    return `⚫ Svarta backar för experter:\n${slopes.map(s => `- Backe ${s.number} "${s.name}" (lift: ${s.lift})`).join('\n')}`;
  }
  
  // Område-fråga
  for (const [id, area] of Object.entries(AREA_INFO)) {
    if (q.includes(area.name.toLowerCase()) || q.includes(id)) {
      return `🏔️ ${area.name}\n${area.description}\n\nLiftar: ${area.lifts.join(', ')}\nBäst för: ${area.bestFor}`;
    }
  }
  
  // Lift-fråga
  for (const [id, lift] of Object.entries(LIFTS)) {
    if (q.includes(lift.name.toLowerCase()) || q.includes(id.toLowerCase())) {
      return `🚡 ${lift.name} (${id})\nTyp: ${lift.type}\nFrån: ${lift.from} → Till: ${lift.to}\nTid: ${lift.minutes} min`;
    }
  }
  
  return null; // Behöver LLM för mer komplexa frågor
}

// Export för API
module.exports = {
  getNavigatorContext,
  quickQuery,
  findSlopesForLevel,
  findLiftForSlope,
  SLOPES,
  AREA_INFO,
  buildSystemContext
};

// CLI test
if (require.main === module) {
  const query = process.argv.slice(2).join(' ') || 'nybörjare';
  const result = quickQuery(query);
  if (result) {
    console.log(result);
  } else {
    console.log('Komplex fråga - behöver LLM. Context:\n');
    console.log(buildSystemContext().slice(0, 2000) + '...');
  }
}
