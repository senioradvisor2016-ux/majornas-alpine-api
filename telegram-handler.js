#!/usr/bin/env node
/**
 * 🎿 MAJORA ALPINE - Telegram Command Handler
 * Används av Clawdbot för att svara på "trysil" kommandon
 */

const FNUGG_API = 'https://api.fnugg.no/search';

const RESORTS = {
  trysil: { name: 'SkiStar Trysil', query: 'trysil' },
  are: { name: 'SkiStar Åre', query: 'åre' },
  salen: { name: 'SkiStar Sälen', query: 'sälen' },
  hemsedal: { name: 'Hemsedal', query: 'hemsedal' },
  vemdalen: { name: 'SkiStar Vemdalen', query: 'vemdalen' }
};

async function fetchResort(query) {
  const res = await fetch(`${FNUGG_API}?q=${encodeURIComponent(query)}`);
  const data = await res.json();
  return data.hits.hits[0]?._source;
}

function formatStatus(data, emoji = true) {
  if (!data) return 'Kunde inte hämta data';
  
  const c = data.conditions?.combined?.top || {};
  const b = data.conditions?.combined?.bottom || c;
  const lifts = data.lifts || { open: 0, count: 0 };
  const slopes = data.slopes || { open: 0, count: 0 };
  
  let msg = `🏔️ **${data.name}**\n`;
  msg += `━━━━━━━━━━━━━━━━━━\n`;
  msg += `🚡 Liftar: ${lifts.open}/${lifts.count}\n`;
  msg += `⛷️ Backar: ${slopes.open}/${slopes.count}\n`;
  msg += `❄️ Snö: ${c.snow?.depth_slope || '?'}cm (topp)\n`;
  msg += `🌡️ Temp: ${c.temperature?.value || '?'}°C / ${b.temperature?.value || '?'}°C\n`;
  msg += `💨 Vind: ${c.wind?.mps || 0} m/s\n`;
  
  if (c.condition_description) {
    msg += `📊 "${c.condition_description}"\n`;
  }
  
  if (c.powder_alarm) {
    msg += `\n🎿✨ **POWDER ALERT!** 🎿✨\n`;
  }
  
  return msg;
}

function formatLifts(data) {
  if (!data?.lifts?.list) return 'Ingen liftdata';
  
  let msg = `🚡 **LIFTAR - ${data.name}**\n\n`;
  
  const open = data.lifts.list.filter(l => l.status === '1');
  const closed = data.lifts.list.filter(l => l.status === '0');
  
  if (open.length > 0) {
    msg += `✅ **Öppna (${open.length}):**\n`;
    open.forEach(l => msg += `  • ${l.name}\n`);
  }
  
  if (closed.length > 0) {
    msg += `\n❌ **Stängda (${closed.length}):**\n`;
    closed.forEach(l => msg += `  • ${l.name}\n`);
  }
  
  return msg;
}

function formatClosed(data) {
  if (!data?.lifts?.list) return 'Ingen liftdata';
  
  const closed = data.lifts.list.filter(l => l.status === '0');
  
  if (closed.length === 0) {
    return `✅ **Alla liftar öppna i ${data.name}!**`;
  }
  
  let msg = `❌ **Stängda liftar (${closed.length}):**\n\n`;
  closed.forEach(l => msg += `• ${l.name}\n`);
  
  return msg;
}

function formatSlopes(data) {
  if (!data?.slopes?.list) return 'Ingen backdata';
  
  const open = data.slopes.list.filter(s => s.status === '1');
  const byDiff = {
    green: open.filter(s => s.slope_difficulty === 'green'),
    blue: open.filter(s => s.slope_difficulty === 'blue'),
    red: open.filter(s => s.slope_difficulty === 'red'),
    black: open.filter(s => s.slope_difficulty === 'black')
  };
  
  let msg = `⛷️ **BACKAR - ${data.name}**\n\n`;
  msg += `🟢 Gröna: ${byDiff.green.length}\n`;
  msg += `🔵 Blå: ${byDiff.blue.length}\n`;
  msg += `🔴 Röda: ${byDiff.red.length}\n`;
  msg += `⚫ Svarta: ${byDiff.black.length}\n`;
  msg += `\n📊 Totalt: ${open.length}/${data.slopes.count} öppna`;
  
  return msg;
}

function formatPowder(data) {
  if (!data) return 'Kunde inte hämta data';
  
  const c = data.conditions?.combined?.top || {};
  const fresh = c.snow?.today || 0;
  
  if (c.powder_alarm) {
    return `🎿✨ **POWDER ALERT!** 🎿✨\n\nNysnö: ${fresh}cm\nSnödjup: ${c.snow?.depth_slope}cm\n"${c.condition_description}"`;
  }
  
  if (fresh > 0) {
    return `❄️ ${fresh}cm nysnö senaste 24h\n\nInte officiell powder alert än, men snön är på väg!`;
  }
  
  return `😴 Ingen nysnö just nu\n\nSnödjup: ${c.snow?.depth_slope || '?'}cm`;
}

function formatForecast(data) {
  if (!data?.conditions?.forecast?.long_term) return 'Ingen prognos';
  
  const days = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
  const icons = {
    'Sun': '☀️', 'LightCloud': '🌤️', 'PartlyCloud': '⛅',
    'Cloud': '☁️', 'Rain': '🌧️', 'Snow': '❄️', 'LightSnow': '🌨️'
  };
  
  let msg = `📅 **PROGNOS - ${data.name}**\n\n`;
  
  // Idag
  const today = data.conditions.forecast.today?.top;
  if (today) {
    const icon = icons[today.symbol?.name] || '🌤️';
    msg += `**Idag:** ${icon} ${today.temperature?.value}°C\n`;
  }
  
  // Kommande dagar
  data.conditions.forecast.long_term.slice(0, 5).forEach(day => {
    const d = new Date(day.period.from);
    const dayName = days[d.getDay()];
    const icon = icons[day.symbol?.name] || '🌤️';
    msg += `**${dayName}:** ${icon} ${day.temperature?.value}°C\n`;
  });
  
  return msg;
}

function getAIAnswer(question, data) {
  const q = question.toLowerCase();
  const c = data?.conditions?.combined?.top || {};
  
  // Köer
  if (q.includes('kö') || q.includes('vänta') || q.includes('trängsel')) {
    const hour = new Date().getHours();
    if (hour < 10) {
      return '🎯 **Bästa tiden!** Minimala köer innan 10. Kör Trysilgondolen eller Toppekspressen nu!';
    } else if (hour >= 11 && hour <= 13) {
      return '⚠️ **Lunchtid = köer.** Undvik T1 Liekspressen och Turistsenteret. Prova Høyfjellssenteret eller Skihytta istället.';
    } else {
      return '🎯 Köerna avtar nu. Trysilgondolen och Fjellekspressen bör gå snabbt.';
    }
  }
  
  // Barn/familj
  if (q.includes('barn') || q.includes('familj') || q.includes('nybörjar') || q.includes('lätt')) {
    return '👨‍👩‍👧 **Familjeområden:**\n\n• **Eventyr** (Turistsenteret) - Bäst för små barn\n• **Valle-området** - Skidskola\n• Gröna backar: 21, 39, 56, 60\n\nTips: Undvik Høgegga - för branta backar!';
  }
  
  // Expert/svart
  if (q.includes('svart') || q.includes('expert') || q.includes('brant') || q.includes('avancerad')) {
    const blackSlopes = data?.slopes?.list?.filter(s => s.slope_difficulty === 'black' && s.status === '1') || [];
    return `⚫ **Svarta backar (${blackSlopes.length} öppna):**\n\n• Høgegga: 30, 76, 82\n• Skihytta: 1, 7\n• Turistsenteret: 22, 28\n\nBäst just nu: Høgegga-sidan har mest utmaning!`;
  }
  
  // Mat/lunch
  if (q.includes('lunch') || q.includes('mat') || q.includes('äta') || q.includes('fika')) {
    return '🍕 **Lunchställen:**\n\n• **Knettsetra** (T8) - Bäst utsikt!\n• **Fjellekspressen Lodge** (T2) - Snabbt & bra\n• **Løvlia** - Mysig stuga\n\n⚠️ Undvik Turistsenteret 12-13 (rusning)';
  }
  
  // Väder
  if (q.includes('väder') || q.includes('prognos') || q.includes('vind') || q.includes('snö')) {
    const temp = c.temperature?.value || 0;
    const wind = c.wind?.mps || 0;
    let msg = `🌤️ **Just nu:**\n• Temp: ${temp}°C\n• Vind: ${wind} m/s\n\n`;
    
    if (wind > 8) {
      msg += '⚠️ Blåsigt på toppen - håll dig i lägre partier!';
    } else if (temp > 0) {
      msg += '☀️ Plusgrader - snön blir blöt på eftermiddagen.';
    } else if (temp < -15) {
      msg += '🥶 Riktigt kallt! Klä dig varmt och ta pauser.';
    } else {
      msg += '✅ Perfekt skidväder!';
    }
    return msg;
  }
  
  // Parkering
  if (q.includes('parkera') || q.includes('parkering') || q.includes('bil')) {
    return '🅿️ **Parkering:**\n\n• **Turistsenteret P1** - Fylls först, kom före 09\n• **Høyfjellssenteret** - Ofta ledigt\n• **Skihytta** - Bra på helger\n\nTips: Åk skidorna ner till bilen på eftermiddagen!';
  }
  
  // Kvällskörning
  if (q.includes('kväll') || q.includes('natt') || q.includes('kvällskör')) {
    return '🌙 **Kvällskörning:**\n\n• Mån, Ons, Fre: 17:00-20:00\n• Området: Turistsenteret\n• Flodbelyst park!\n\nBoka liftkort i appen för snabbare inpassering.';
  }
  
  return `🤔 Jag kan svara på frågor om:\n• Köer & trängsel\n• Barnbackar & familj\n• Svarta backar\n• Lunchställen\n• Väder & vind\n• Parkering\n• Kvällskörning\n\nProva igen!`;
}

async function handleCommand(cmd, args = '') {
  const resort = args.split(' ')[0] || 'trysil';
  const resortConfig = RESORTS[resort] || RESORTS.trysil;
  
  try {
    const data = await fetchResort(resortConfig.query);
    
    switch (cmd) {
      case 'status':
      case '':
        return formatStatus(data);
      case 'liftar':
      case 'lifts':
        return formatLifts(data);
      case 'stängda':
      case 'closed':
        return formatClosed(data);
      case 'backar':
      case 'slopes':
        return formatSlopes(data);
      case 'powder':
      case 'snö':
        return formatPowder(data);
      case 'prognos':
      case 'forecast':
        return formatForecast(data);
      case 'ai':
        const question = args.replace(resort, '').trim();
        return getAIAnswer(question, data);
      default:
        return formatStatus(data);
    }
  } catch (err) {
    return `❌ Fel: ${err.message}`;
  }
}

// CLI - bara om körs direkt
if (require.main === module) {
  async function main() {
    const [,, cmd, ...args] = process.argv;
    const result = await handleCommand(cmd || '', args.join(' '));
    console.log(result);
  }
  
  main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}

module.exports = { handleCommand, fetchResort, RESORTS };
