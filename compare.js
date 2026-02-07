#!/usr/bin/env node
/**
 * 🎿 MAJORA ALPINE - Resort Comparison
 * Jämför flera anläggningar
 */

const FNUGG_API = 'https://api.fnugg.no/search';

const POPULAR_RESORTS = [
  { id: 'trysil', query: 'trysil', name: 'Trysil' },
  { id: 'hemsedal', query: 'hemsedal', name: 'Hemsedal' },
  { id: 'are', query: 'åre', name: 'Åre' },
  { id: 'salen', query: 'sälen hundfjället', name: 'Sälen' },
  { id: 'vemdalen', query: 'vemdalen', name: 'Vemdalen' }
];

async function fetchResort(query) {
  try {
    const res = await fetch(`${FNUGG_API}?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    return data.hits.hits[0]?._source;
  } catch (err) {
    return null;
  }
}

function extractConditions(data) {
  if (!data) return null;
  
  const c = data.conditions?.combined?.top || {};
  
  return {
    name: data.name,
    open: data.resort_open,
    lifts: {
      open: data.lifts?.open || 0,
      total: data.lifts?.count || 0,
      pct: Math.round((data.lifts?.open / data.lifts?.count) * 100) || 0
    },
    slopes: {
      open: data.slopes?.open || 0,
      total: data.slopes?.count || 0,
      pct: Math.round((data.slopes?.open / data.slopes?.count) * 100) || 0
    },
    snow: c.snow?.depth_slope || 0,
    freshSnow: c.snow?.today || 0,
    temp: c.temperature?.value || 0,
    wind: c.wind?.mps || 0,
    condition: c.condition_description || '',
    powderAlert: c.powder_alarm || false
  };
}

async function compareResorts(resortIds = ['trysil', 'hemsedal', 'are']) {
  const resorts = POPULAR_RESORTS.filter(r => resortIds.includes(r.id));
  
  const results = await Promise.all(
    resorts.map(async r => {
      const data = await fetchResort(r.query);
      return { ...r, data: extractConditions(data) };
    })
  );
  
  return results.filter(r => r.data);
}

function formatComparison(results) {
  let msg = `🏔️ **JÄMFÖRELSE**\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  // Sortera efter snödjup
  results.sort((a, b) => b.data.snow - a.data.snow);
  
  results.forEach((r, i) => {
    const d = r.data;
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
    
    msg += `${medal} **${d.name}**\n`;
    msg += `   ❄️ ${d.snow}cm`;
    if (d.freshSnow > 0) msg += ` (+${d.freshSnow}cm ny!)`;
    msg += `\n`;
    msg += `   🚡 ${d.lifts.open}/${d.lifts.total} (${d.lifts.pct}%)\n`;
    msg += `   🌡️ ${d.temp}°C | 💨 ${d.wind}m/s\n`;
    if (d.powderAlert) msg += `   🎿✨ POWDER ALERT!\n`;
    msg += `\n`;
  });
  
  // Rekommendation
  const best = results[0]?.data;
  if (best) {
    msg += `📍 **Bäst just nu:** ${best.name} (${best.snow}cm snö)`;
  }
  
  return msg;
}

async function findBestResort() {
  const results = await compareResorts(['trysil', 'hemsedal', 'are', 'salen', 'vemdalen']);
  
  // Poängsystem
  const scored = results.map(r => {
    const d = r.data;
    let score = 0;
    
    score += d.snow * 1;           // Snödjup
    score += d.freshSnow * 5;      // Nysnö är värt mer
    score += d.lifts.pct * 0.5;    // Öppna liftar
    score += d.slopes.pct * 0.3;   // Öppna backar
    score -= Math.abs(d.temp + 8) * 2;  // Optimal temp runt -8°C
    score -= d.wind * 3;           // Vind är dåligt
    if (d.powderAlert) score += 50;
    
    return { ...r, score };
  });
  
  scored.sort((a, b) => b.score - a.score);
  
  return scored[0];
}

// CLI - bara om körs direkt
if (require.main === module) {
  async function main() {
    const cmd = process.argv[2] || 'compare';
    
    if (cmd === 'best') {
      const best = await findBestResort();
      console.log(`🏆 **BÄSTA VALET JUST NU**\n`);
      console.log(`${best.data.name}\n`);
      console.log(`❄️ ${best.data.snow}cm snö`);
      if (best.data.freshSnow > 0) console.log(`✨ ${best.data.freshSnow}cm nysnö!`);
      console.log(`🌡️ ${best.data.temp}°C`);
      console.log(`💨 ${best.data.wind} m/s`);
      console.log(`\n(Poäng: ${Math.round(best.score)})`);
    } else {
      const results = await compareResorts(['trysil', 'hemsedal', 'are']);
      console.log(formatComparison(results));
    }
  }
  
  main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}

module.exports = { compareResorts, findBestResort, formatComparison };
