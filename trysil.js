#!/usr/bin/env node
/**
 * 🎿 MAJORA ALPINE - På Vift i Lift 🚡
 * Hämtar realtidsdata från fnugg.no API
 */

const TRYSIL_API = 'https://api.fnugg.no/search?q=trysil';

async function fetchTrysil() {
  const res = await fetch(TRYSIL_API);
  const data = await res.json();
  const trysil = data.hits.hits.find(h => h._source.name === 'SkiStar Trysil')?._source;
  
  if (!trysil) throw new Error('Kunde inte hitta Trysil');
  return trysil;
}

function formatConditions(data) {
  const c = data.conditions.combined;
  const lifts = data.lifts;
  const slopes = data.slopes;
  
  const top = c.top || {};
  const bottom = c.bottom || top;
  
  return {
    lifts: { open: lifts.open, total: lifts.count },
    slopes: { open: slopes.open, total: slopes.count },
    snow: {
      top: top.snow?.depth_slope || 0,
      bottom: bottom.snow?.depth_slope || 0,
      fresh: top.snow?.today || 0
    },
    temp: {
      top: top.temperature?.value || 0,
      bottom: bottom.temperature?.value || 0
    },
    wind: {
      speed: top.wind?.mps || 0,
      dir: top.wind?.name || ''
    },
    condition: top.condition_description || '',
    powderAlert: top.powder_alarm || false,
    updated: data.last_updated
  };
}

function formatMessage(cond, emoji = true) {
  const e = emoji ? {
    mountain: '🏔️', lift: '🚡', slope: '⛷️', snow: '❄️', 
    temp: '🌡️', wind: '💨', status: '📊', powder: '🎿✨'
  } : { mountain: '', lift: '', slope: '', snow: '', temp: '', wind: '', status: '', powder: '' };

  let msg = `${e.mountain} **MAJORA ALPINE**\n`;
  msg += `_På Vift i Lift - Trysil_\n`;
  msg += `━━━━━━━━━━━━━━━━━━\n`;
  msg += `${e.lift} Liftar: ${cond.lifts.open}/${cond.lifts.total} öppna\n`;
  msg += `${e.slope} Backar: ${cond.slopes.open}/${cond.slopes.total} öppna\n`;
  msg += `${e.snow} Snö: ${cond.snow.top}cm (topp) / ${cond.snow.bottom}cm (dal)\n`;
  if (cond.snow.fresh > 0) {
    msg += `   ➕ Nysnö: ${cond.snow.fresh}cm!\n`;
  }
  msg += `${e.temp} Temp: ${cond.temp.top}°C (topp) / ${cond.temp.bottom}°C (dal)\n`;
  msg += `${e.wind} Vind: ${cond.wind.speed} m/s ${cond.wind.dir}\n`;
  msg += `${e.status} "${cond.condition}"\n`;
  
  if (cond.powderAlert) {
    msg += `\n${e.powder} **POWDER ALERT!** ${e.powder}\n`;
  }
  
  return msg;
}

function getClosedLifts(data) {
  return data.lifts.list
    .filter(l => l.status === '0')
    .map(l => l.name);
}

function getSlopesByDifficulty(data) {
  const slopes = data.slopes.list.filter(s => s.status === '1');
  return {
    green: slopes.filter(s => s.slope_difficulty === 'green').length,
    blue: slopes.filter(s => s.slope_difficulty === 'blue').length,
    red: slopes.filter(s => s.slope_difficulty === 'red').length,
    black: slopes.filter(s => s.slope_difficulty === 'black').length
  };
}

// CLI
async function main() {
  const cmd = process.argv[2] || 'status';
  
  try {
    const data = await fetchTrysil();
    const cond = formatConditions(data);
    
    switch (cmd) {
      case 'status':
        console.log(formatMessage(cond));
        break;
        
      case 'json':
        console.log(JSON.stringify(cond, null, 2));
        break;
        
      case 'lifts':
        console.log('🚡 LIFTAR\n');
        data.lifts.list.forEach(l => {
          const status = l.status === '1' ? '✅' : '❌';
          console.log(`${status} ${l.name}`);
        });
        break;
        
      case 'closed':
        const closed = getClosedLifts(data);
        if (closed.length === 0) {
          console.log('✅ Alla liftar öppna!');
        } else {
          console.log('❌ Stängda liftar:\n');
          closed.forEach(l => console.log(`  - ${l}`));
        }
        break;
        
      case 'slopes':
        const byDiff = getSlopesByDifficulty(data);
        console.log('🎿 BACKAR PER SVÅRIGHETSGRAD\n');
        console.log(`🟢 Gröna: ${byDiff.green}`);
        console.log(`🔵 Blåa: ${byDiff.blue}`);
        console.log(`🔴 Röda: ${byDiff.red}`);
        console.log(`⚫ Svarta: ${byDiff.black}`);
        break;
        
      case 'powder':
        if (cond.powderAlert) {
          console.log('🎿✨ POWDER ALERT! Nysnö och perfekta förhållanden!');
        } else if (cond.snow.fresh > 0) {
          console.log(`❄️ ${cond.snow.fresh}cm nysnö - inte officiell powder alert än`);
        } else {
          console.log('😴 Ingen nysnö just nu');
        }
        break;
        
      default:
        console.log('Användning: trysil.js [status|json|lifts|closed|slopes|powder]');
    }
  } catch (err) {
    console.error('Fel:', err.message);
    process.exit(1);
  }
}

main();
