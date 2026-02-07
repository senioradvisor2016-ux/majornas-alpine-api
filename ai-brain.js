#!/usr/bin/env node
/**
 * 🎿 MAJORA ALPINE - AI Brain
 * Avancerad AI för skidrekommendationer
 */

// Tid-baserade mönster
const TIME_PATTERNS = {
  earlyBird: { start: 9, end: 10, crowdLevel: 1, description: 'Minimala köer, perfekt snö' },
  morning: { start: 10, end: 12, crowdLevel: 3, description: 'Ökande aktivitet' },
  lunchRush: { start: 12, end: 13, crowdLevel: 5, description: 'Peak trängsel' },
  afternoon: { start: 13, end: 15, crowdLevel: 4, description: 'Avtagande köer' },
  lateAfternoon: { start: 15, end: 16, crowdLevel: 2, description: 'Lugnt, skuggigt' },
  evening: { start: 17, end: 20, crowdLevel: 2, description: 'Kvällskörning, flodljus' }
};

// Backrekommendationer baserat på förhållanden
const SLOPE_RECOMMENDATIONS = {
  powder: {
    areas: ['Høgegga', 'Høyfjellssenteret'],
    slopes: ['30', '69', '70', '75', '80'],
    reason: 'Offpist och svarta backar för bästa powder-upplevelse'
  },
  cold: {
    areas: ['Turistsenteret', 'Skihytta'],
    slopes: ['13', '25', '26', '4', '5'],
    reason: 'Skyddade backar med mindre vind'
  },
  windy: {
    areas: ['Turistsenteret nedre', 'Skihytta'],
    slopes: ['14', '19', '2', '3', '10'],
    reason: 'Lägre terräng skyddar mot vind'
  },
  warm: {
    areas: ['Høgegga norrsida', 'Skihytta'],
    slopes: ['30', '76', '1', '7'],
    reason: 'Norrläge bevarar snön längre'
  },
  family: {
    areas: ['Eventyr', 'Valle-området'],
    slopes: ['21', '39', '56', '60', '65'],
    reason: 'Gröna backar med barnaktiviteter'
  },
  expert: {
    areas: ['Høgegga', 'Skihytta svart'],
    slopes: ['30', '69', '70', '75', '76', '80', '82', '1', '7', '22', '28'],
    reason: 'Branta, tekniska backar'
  }
};

// Lift-köprediktion
const LIFT_QUEUE_PATTERNS = {
  'T1 Liekspressen': { peakHours: [10, 11, 12], avgWait: 8, type: 'express' },
  'T2 Fjellekspressen': { peakHours: [10, 11], avgWait: 5, type: 'express' },
  'T7 Trysilgondolen': { peakHours: [9, 10, 14], avgWait: 10, type: 'gondol' },
  'F2 Toppekspressen': { peakHours: [11, 12, 13], avgWait: 6, type: 'express' },
  'H1 Høgekspressen': { peakHours: [10, 11, 14], avgWait: 4, type: 'express' },
  'S1 Skihytta Ekspress': { peakHours: [10, 11], avgWait: 5, type: 'express' }
};

function getCurrentTimePeriod() {
  const hour = new Date().getHours();
  for (const [name, period] of Object.entries(TIME_PATTERNS)) {
    if (hour >= period.start && hour < period.end) {
      return { name, ...period };
    }
  }
  return { name: 'closed', crowdLevel: 0, description: 'Anläggningen stängd' };
}

function predictLiftQueue(liftName) {
  const hour = new Date().getHours();
  const pattern = LIFT_QUEUE_PATTERNS[liftName];
  
  if (!pattern) return { wait: 'okänd', level: 'unknown' };
  
  const isPeak = pattern.peakHours.includes(hour);
  const baseWait = pattern.avgWait;
  const actualWait = isPeak ? baseWait * 1.5 : baseWait * 0.6;
  
  return {
    wait: Math.round(actualWait),
    level: isPeak ? 'high' : 'low',
    isPeak
  };
}

function getOptimalRoute(startArea, preferences = {}) {
  const routes = {
    'Turistsenteret': {
      warmup: ['T6 Eventyr', 'backe 21'],
      main: ['T1 Liekspressen', 'backe 15', 'backe 23'],
      advanced: ['T7 Trysilgondolen', 'backe 22', 'backe 28'],
      lunch: 'Fjellekspressen Lodge'
    },
    'Høyfjellssenteret': {
      warmup: ['F12 Familietrekket', 'backe 36'],
      main: ['F2 Toppekspressen', 'backe 44', 'backe 53'],
      advanced: ['F2 Toppekspressen', 'backe 52', 'backe 54'],
      lunch: 'Knettsetra'
    },
    'Skihytta': {
      warmup: ['S1 Skihytta Ekspress', 'backe 2', 'backe 3'],
      main: ['S1 Skihytta Ekspress', 'backe 4', 'backe 5'],
      advanced: ['S1 Skihytta Ekspress', 'backe 1', 'backe 7'],
      lunch: 'Skihytta Lodge'
    },
    'Høgegga': {
      warmup: ['H1 Høgekspressen', 'backe 17'],
      main: ['H1 Høgekspressen', 'backe 49', 'backe 59'],
      advanced: ['H1 Høgekspressen', 'backe 30', 'backe 76', 'backe 82'],
      lunch: 'Høgegga Lodge'
    }
  };
  
  return routes[startArea] || routes['Turistsenteret'];
}

function getSnowQualityPrediction(temp, wind, lastSnowfall, timeOfDay) {
  let quality = 'good';
  let description = [];
  
  if (temp > 0) {
    quality = 'soft';
    description.push('Blöt snö pga plusgrader');
    if (timeOfDay >= 13) {
      quality = 'slush';
      description.push('Slaskigt på eftermiddagen');
    }
  } else if (temp < -15) {
    quality = 'cold';
    description.push('Kall, snabb snö');
  } else if (temp >= -8 && temp <= -3) {
    quality = 'perfect';
    description.push('Optimal temperatur för skidåkning');
  }
  
  if (lastSnowfall > 0 && lastSnowfall <= 24) {
    quality = 'powder';
    description.push('Nysnö ger powder-förhållanden');
  }
  
  if (wind > 8) {
    description.push('Vindpackad snö på exponerade ställen');
  }
  
  return { quality, description: description.join('. ') || 'Fina förhållanden' };
}

function generateDayPlan(data, preferences = {}) {
  const hour = new Date().getHours();
  const temp = data?.conditions?.combined?.top?.temperature?.value || -5;
  const wind = data?.conditions?.combined?.top?.wind?.mps || 0;
  const freshSnow = data?.conditions?.combined?.top?.snow?.today || 0;
  
  const plan = {
    morning: null,
    lunch: null,
    afternoon: null,
    tips: []
  };
  
  // Morgon
  if (hour < 12) {
    if (freshSnow > 5) {
      plan.morning = {
        area: 'Høgegga',
        reason: 'Powder! Kör offpist innan det blir utåkt',
        lifts: ['H1 Høgekspressen'],
        slopes: ['30', '76']
      };
      plan.tips.push('🎿 Powder-dag! Var ute tidigt för bästa spåren');
    } else {
      plan.morning = {
        area: 'Turistsenteret',
        reason: 'Uppvärmning på preparerade backar',
        lifts: ['T2 Fjellekspressen'],
        slopes: ['25', '26', '35']
      };
    }
  }
  
  // Lunch
  plan.lunch = {
    time: '12:00-13:00',
    avoid: 'Huvudrestaurangen Turistsenteret',
    recommend: wind > 5 ? 'Løvlia (vindskyddat)' : 'Knettsetra (bäst utsikt)',
    tips: 'Ät tidigt (11:30) eller sent (13:30) för att undvika kö'
  };
  
  // Eftermiddag
  if (temp > -3) {
    plan.afternoon = {
      area: 'Høgegga norrsida',
      reason: 'Norrläge bevarar snökvaliteten',
      lifts: ['H1 Høgekspressen'],
      slopes: ['30', '82']
    };
    plan.tips.push('☀️ Snön blir blöt söderut - håll dig i norrlägen');
  } else {
    plan.afternoon = {
      area: 'Høyfjellssenteret',
      reason: 'Varierat, bra preparering',
      lifts: ['F2 Toppekspressen'],
      slopes: ['44', '53', '54']
    };
  }
  
  // Extra tips baserat på förhållanden
  if (wind > 8) {
    plan.tips.push('💨 Blåsigt på toppen - håll dig under 800m');
  }
  if (temp < -15) {
    plan.tips.push('🥶 Riktigt kallt - ta pauser för att värma upp');
  }
  
  return plan;
}

function formatDayPlan(plan) {
  let msg = `📋 **DAGENS SKIDPLAN**\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  if (plan.morning) {
    msg += `☀️ **FÖRMIDDAG**\n`;
    msg += `📍 ${plan.morning.area}\n`;
    msg += `💡 ${plan.morning.reason}\n`;
    msg += `🚡 ${plan.morning.lifts.join(', ')}\n`;
    msg += `⛷️ Backar: ${plan.morning.slopes.join(', ')}\n\n`;
  }
  
  msg += `🍕 **LUNCH** (${plan.lunch.time})\n`;
  msg += `✅ Rekommenderar: ${plan.lunch.recommend}\n`;
  msg += `❌ Undvik: ${plan.lunch.avoid}\n`;
  msg += `💡 ${plan.lunch.tips}\n\n`;
  
  if (plan.afternoon) {
    msg += `🌤️ **EFTERMIDDAG**\n`;
    msg += `📍 ${plan.afternoon.area}\n`;
    msg += `💡 ${plan.afternoon.reason}\n`;
    msg += `🚡 ${plan.afternoon.lifts.join(', ')}\n`;
    msg += `⛷️ Backar: ${plan.afternoon.slopes.join(', ')}\n\n`;
  }
  
  if (plan.tips.length > 0) {
    msg += `💡 **TIPS**\n`;
    plan.tips.forEach(tip => msg += `${tip}\n`);
  }
  
  return msg;
}

function getEquipmentRecommendation(temp, conditions) {
  const gear = {
    layers: [],
    accessories: [],
    wax: null
  };
  
  if (temp < -15) {
    gear.layers = ['Tjock underställ', 'Fleece mellanlager', 'Dunjacka under skaljacka'];
    gear.accessories = ['Balaklava', 'Dubbla handskar', 'Tåvärmare'];
  } else if (temp < -8) {
    gear.layers = ['Underställ', 'Fleece', 'Skaljacka'];
    gear.accessories = ['Mössa', 'Varma handskar', 'Halsvärmare'];
  } else if (temp < 0) {
    gear.layers = ['Lätt underställ', 'Skaljacka'];
    gear.accessories = ['Mössa', 'Tunna handskar'];
  } else {
    gear.layers = ['Lätt underställ', 'Ventilerande jacka'];
    gear.accessories = ['Buff', 'Lätta handskar', 'Solglasögon'];
  }
  
  // Valla
  if (temp < -10) {
    gear.wax = 'Kallvalla (grön/blå)';
  } else if (temp < -3) {
    gear.wax = 'Universalvalla';
  } else {
    gear.wax = 'Varmvalla eller fluorvalla';
  }
  
  return gear;
}

function formatEquipment(gear) {
  let msg = `🎿 **UTRUSTNINGSREKOMMENDATION**\n\n`;
  
  msg += `👕 **Klädsel:**\n`;
  gear.layers.forEach(l => msg += `  • ${l}\n`);
  
  msg += `\n🧤 **Accessoarer:**\n`;
  gear.accessories.forEach(a => msg += `  • ${a}\n`);
  
  if (gear.wax) {
    msg += `\n🎿 **Valla:** ${gear.wax}`;
  }
  
  return msg;
}

// Huvudfunktion för AI-analys
async function analyze(data, question = '') {
  const temp = data?.conditions?.combined?.top?.temperature?.value || -5;
  const wind = data?.conditions?.combined?.top?.wind?.mps || 0;
  const freshSnow = data?.conditions?.combined?.top?.snow?.today || 0;
  const q = question.toLowerCase();
  
  // Dagsplan
  if (q.includes('plan') || q.includes('dag') || q.includes('schema')) {
    const plan = generateDayPlan(data);
    return formatDayPlan(plan);
  }
  
  // Utrustning
  if (q.includes('utrustning') || q.includes('kläder') || q.includes('valla') || q.includes('packa')) {
    const gear = getEquipmentRecommendation(temp, {});
    return formatEquipment(gear);
  }
  
  // Snökvalitet
  if (q.includes('snö') || q.includes('kvalitet') || q.includes('före')) {
    const hour = new Date().getHours();
    const snowQ = getSnowQualityPrediction(temp, wind, freshSnow > 0 ? 12 : 48, hour);
    return `❄️ **Snökvalitet:** ${snowQ.quality.toUpperCase()}\n\n${snowQ.description}`;
  }
  
  // Köer
  if (q.includes('kö') || q.includes('vänta') || q.includes('trängsel')) {
    const period = getCurrentTimePeriod();
    let msg = `⏰ **${period.description}** (trängselnivå ${period.crowdLevel}/5)\n\n`;
    msg += `🚡 **Förväntade köer:**\n`;
    
    for (const [lift, pattern] of Object.entries(LIFT_QUEUE_PATTERNS)) {
      const pred = predictLiftQueue(lift);
      const indicator = pred.level === 'high' ? '🔴' : '🟢';
      msg += `${indicator} ${lift}: ~${pred.wait} min\n`;
    }
    
    return msg;
  }
  
  // Route
  if (q.includes('rutt') || q.includes('route') || q.includes('börja')) {
    const route = getOptimalRoute('Turistsenteret');
    let msg = `🗺️ **REKOMMENDERAD RUTT**\n\n`;
    msg += `**Uppvärmning:** ${route.warmup.join(' → ')}\n`;
    msg += `**Huvudåkning:** ${route.main.join(' → ')}\n`;
    msg += `**Utmaning:** ${route.advanced.join(' → ')}\n`;
    msg += `**Lunch:** ${route.lunch}`;
    return msg;
  }
  
  // Default: generell analys
  const plan = generateDayPlan(data);
  return formatDayPlan(plan);
}

module.exports = {
  analyze,
  getCurrentTimePeriod,
  predictLiftQueue,
  generateDayPlan,
  getEquipmentRecommendation,
  getSnowQualityPrediction,
  SLOPE_RECOMMENDATIONS,
  LIFT_QUEUE_PATTERNS
};
