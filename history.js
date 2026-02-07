#!/usr/bin/env node
/**
 * 🎿 MAJORA ALPINE - History & Trends
 * Sparar och analyserar historisk data
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

// Skapa data-mapp om den inte finns
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadHistory() {
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  } catch {
    return { records: [] };
  }
}

function saveHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

async function recordSnapshot(resortData) {
  const history = loadHistory();
  
  const snapshot = {
    timestamp: new Date().toISOString(),
    resort: resortData.name,
    snow: resortData.conditions?.combined?.top?.snow?.depth_slope || 0,
    freshSnow: resortData.conditions?.combined?.top?.snow?.today || 0,
    temp: resortData.conditions?.combined?.top?.temperature?.value || 0,
    wind: resortData.conditions?.combined?.top?.wind?.mps || 0,
    liftsOpen: resortData.lifts?.open || 0,
    liftsTotal: resortData.lifts?.count || 0,
    slopesOpen: resortData.slopes?.open || 0,
    slopesTotal: resortData.slopes?.count || 0,
    powderAlert: resortData.conditions?.combined?.top?.powder_alarm || false
  };
  
  history.records.push(snapshot);
  
  // Behåll bara senaste 30 dagarna
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  history.records = history.records.filter(r => new Date(r.timestamp) > thirtyDaysAgo);
  
  saveHistory(history);
  return snapshot;
}

function getSnowTrend(days = 7) {
  const history = loadHistory();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  const recent = history.records.filter(r => new Date(r.timestamp) > cutoff);
  
  if (recent.length < 2) return null;
  
  const first = recent[0];
  const last = recent[recent.length - 1];
  
  const snowChange = last.snow - first.snow;
  const totalFresh = recent.reduce((sum, r) => sum + r.freshSnow, 0);
  
  return {
    startSnow: first.snow,
    endSnow: last.snow,
    change: snowChange,
    totalFreshSnow: totalFresh,
    trend: snowChange > 5 ? 'up' : snowChange < -5 ? 'down' : 'stable',
    days: days,
    dataPoints: recent.length
  };
}

function getBestDays(count = 5) {
  const history = loadHistory();
  
  // Sortera efter poäng (snö, nysnö, vind)
  const scored = history.records.map(r => {
    let score = r.snow + (r.freshSnow * 3) - (r.wind * 2);
    if (r.powderAlert) score += 20;
    return { ...r, score };
  });
  
  scored.sort((a, b) => b.score - a.score);
  
  return scored.slice(0, count);
}

function formatTrend(trend) {
  if (!trend) return 'Inte tillräckligt med data för trendanalys.';
  
  const arrow = trend.trend === 'up' ? '📈' : trend.trend === 'down' ? '📉' : '➡️';
  const changeStr = trend.change >= 0 ? `+${trend.change}` : trend.change;
  
  let msg = `📊 **SNÖTREND (${trend.days} dagar)**\n\n`;
  msg += `${arrow} ${trend.startSnow}cm → ${trend.endSnow}cm (${changeStr}cm)\n`;
  msg += `❄️ Totalt nysnö: ${trend.totalFreshSnow}cm\n`;
  msg += `📈 Datapunkter: ${trend.dataPoints}`;
  
  return msg;
}

// CLI - bara om körs direkt
if (require.main === module) {
  async function main() {
    const cmd = process.argv[2] || 'trend';
    
    switch (cmd) {
      case 'trend':
        const days = parseInt(process.argv[3]) || 7;
        const trend = getSnowTrend(days);
        console.log(formatTrend(trend));
        break;
        
      case 'best':
        const count = parseInt(process.argv[3]) || 5;
        const best = getBestDays(count);
        console.log(`🏆 **BÄSTA DAGARNA**\n`);
        best.forEach((d, i) => {
          const date = new Date(d.timestamp).toLocaleDateString('sv-SE');
          console.log(`${i + 1}. ${date}: ${d.snow}cm, ${d.freshSnow}cm ny, ${d.temp}°C`);
        });
        break;
        
      case 'record':
        console.log('Använd record via API');
        break;
        
      default:
        console.log('Användning: history.js [trend|best] [days|count]');
    }
  }
  
  main().catch(console.error);
}

module.exports = { recordSnapshot, getSnowTrend, getBestDays, formatTrend };
