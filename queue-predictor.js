#!/usr/bin/env node
/**
 * 🎿 MAJORA QUEUE PREDICTOR
 * Smart köprediktion utan live-data
 * Baserat på: kapacitet, tid, dag, väder, lov, historik
 */

// Liftdata med kapacitet
const LIFT_DATA = {
  // Gondol & Express (hög kapacitet)
  'T7': { name: 'Trysilgondolen', capacity: 2400, type: 'gondola', popular: 5 },
  'T1': { name: 'Liekspressen', capacity: 3000, type: 'express', popular: 5 },
  'T2': { name: 'Fjellekspressen', capacity: 3000, type: 'express', popular: 5 },
  'S1': { name: 'Skihytta Ekspress', capacity: 2800, type: 'express', popular: 4 },
  'F2': { name: 'Toppekspressen', capacity: 2400, type: 'express', popular: 4 },
  'H1': { name: 'Høgekspressen', capacity: 2400, type: 'express', popular: 3 },
  
  // Stolliftar (medel kapacitet)
  'T3': { name: 'Hygglo', capacity: 1800, type: 'chair4', popular: 3 },
  'T8': { name: 'Knetta', capacity: 1800, type: 'chair4', popular: 3 },
  'S4': { name: "Tolver'n", capacity: 1600, type: 'chair4', popular: 2 },
  'F1': { name: 'Brynbekken', capacity: 1600, type: 'chair4', popular: 2 },
  'F3': { name: 'Kanken', capacity: 1600, type: 'chair4', popular: 2 },
  'F5': { name: 'Skarven', capacity: 1400, type: 'chair4', popular: 2 },
  
  // Ankare & Småliftar (låg kapacitet)  
  'T4': { name: 'Fryvil', capacity: 1200, type: 'tbar', popular: 1 },
  'T5': { name: 'Tussi', capacity: 800, type: 'magic', popular: 1 },
  'T6': { name: 'Eventyr', capacity: 1000, type: 'tbar', popular: 1 },
  'T10': { name: 'Hesten', capacity: 1200, type: 'chair2', popular: 2 },
  'T11': { name: 'Oddtrekket', capacity: 1000, type: 'tbar', popular: 1 },
  'S3': { name: 'Valleheisen', capacity: 800, type: 'magic', popular: 1 },
  'S6': { name: 'Oletrekket', capacity: 1000, type: 'tbar', popular: 1 },
  'S7': { name: 'Håvitrekket', capacity: 800, type: 'tbar', popular: 1 },
  'H2': { name: 'Høgegga', capacity: 1000, type: 'tbar', popular: 2 },
  'F6': { name: 'Hytteheis 1', capacity: 600, type: 'magic', popular: 1 },
  'F7': { name: 'Stormyra 2', capacity: 800, type: 'tbar', popular: 1 },
  'F8': { name: 'Stormyra', capacity: 800, type: 'tbar', popular: 1 },
  'F9': { name: 'Stjerna', capacity: 800, type: 'tbar', popular: 1 },
  'F10': { name: 'Smotten', capacity: 600, type: 'magic', popular: 1 },
  'F11': { name: 'Isiz', capacity: 600, type: 'magic', popular: 1 },
  'F12': { name: 'Familietrekket', capacity: 1000, type: 'tbar', popular: 1 },
  'F13': { name: 'Myrsnipa', capacity: 800, type: 'tbar', popular: 1 }
};

// Sportlovsperioder 2026 (Sverige & Norge)
const SCHOOL_HOLIDAYS_2026 = [
  { start: '2026-02-14', end: '2026-02-22', region: 'Stockholm', factor: 2.5 },
  { start: '2026-02-21', end: '2026-03-01', region: 'Göteborg', factor: 2.5 },
  { start: '2026-02-28', end: '2026-03-08', region: 'Malmö', factor: 2.5 },
  { start: '2026-02-14', end: '2026-02-22', region: 'Oslo', factor: 2.0 },
  { start: '2026-12-21', end: '2027-01-03', region: 'Jul', factor: 2.0 },
  { start: '2026-04-01', end: '2026-04-12', region: 'Påsk', factor: 1.8 }
];

// Timmönster (normaliserat 0-1)
const HOURLY_PATTERN = {
  8: 0.1, 9: 0.4, 10: 0.9, 11: 1.0, 12: 0.7,
  13: 0.6, 14: 0.85, 15: 0.7, 16: 0.3, 17: 0.05
};

// Dagmönster (måndag = 1)
const DAILY_PATTERN = {
  1: 0.5,  // Måndag
  2: 0.6,  // Tisdag  
  3: 0.7,  // Onsdag
  4: 0.8,  // Torsdag
  5: 0.9,  // Fredag
  6: 1.0,  // Lördag
  0: 0.95  // Söndag
};

// Väder-påverkan
const WEATHER_FACTORS = {
  'clear': 1.0,
  'partly_cloudy': 1.0,
  'cloudy': 0.95,
  'light_snow': 1.1,  // Folk vill åka nysnö!
  'snow': 0.85,
  'heavy_snow': 0.5,
  'rain': 0.3,
  'fog': 0.6,
  'wind': 0.7,
  'storm': 0.2
};

/**
 * Kolla om datum är under skollov
 */
function getHolidayFactor(date) {
  const dateStr = date.toISOString().split('T')[0];
  for (const holiday of SCHOOL_HOLIDAYS_2026) {
    if (dateStr >= holiday.start && dateStr <= holiday.end) {
      return holiday.factor;
    }
  }
  return 1.0;
}

/**
 * Beräkna efterfrågan (personer som vill åka)
 */
function calculateDemand(liftId, datetime, weather = 'partly_cloudy') {
  const lift = LIFT_DATA[liftId];
  if (!lift) return null;
  
  const hour = datetime.getHours();
  const day = datetime.getDay();
  
  // Bas-efterfrågan baserat på popularitet
  const baseDemand = lift.capacity * (0.3 + lift.popular * 0.15);
  
  // Faktorer
  const hourFactor = HOURLY_PATTERN[hour] || 0.5;
  const dayFactor = DAILY_PATTERN[day];
  const holidayFactor = getHolidayFactor(datetime);
  const weatherFactor = WEATHER_FACTORS[weather] || 1.0;
  
  // Total efterfrågan
  const demand = baseDemand * hourFactor * dayFactor * holidayFactor * weatherFactor;
  
  return {
    demand: Math.round(demand),
    factors: { hour: hourFactor, day: dayFactor, holiday: holidayFactor, weather: weatherFactor }
  };
}

/**
 * Beräkna kötid i minuter
 */
function calculateQueueTime(liftId, datetime, weather = 'partly_cloudy') {
  const lift = LIFT_DATA[liftId];
  if (!lift) return null;
  
  const demandData = calculateDemand(liftId, datetime, weather);
  const demand = demandData.demand;
  const capacity = lift.capacity;
  
  // Kö = efterfrågan - kapacitet (per timme, konvertera till minuter)
  // Om efterfrågan > kapacitet → kö bildas
  const excessDemand = Math.max(0, demand - capacity);
  
  // Kötid ≈ excess / (capacity/60) = minuter att vänta
  const queueMinutes = (excessDemand / capacity) * 60;
  
  // Lägg till bas-kötid (alltid tar det lite tid)
  const baseQueue = lift.type === 'gondola' ? 3 : lift.type === 'express' ? 1 : 0.5;
  
  return Math.round((queueMinutes + baseQueue) * 10) / 10;
}

/**
 * Prognos för hela dagen
 */
function getDayForecast(liftId, date = new Date(), weather = 'partly_cloudy') {
  const lift = LIFT_DATA[liftId];
  if (!lift) return null;
  
  const forecast = [];
  for (let hour = 9; hour <= 16; hour++) {
    const dt = new Date(date);
    dt.setHours(hour, 0, 0, 0);
    
    const queueTime = calculateQueueTime(liftId, dt, weather);
    forecast.push({
      hour: `${hour}:00`,
      queueMinutes: queueTime,
      level: queueTime < 3 ? 'low' : queueTime < 8 ? 'medium' : 'high',
      emoji: queueTime < 3 ? '🟢' : queueTime < 8 ? '🟡' : '🔴'
    });
  }
  
  // Hitta bästa tider
  const sorted = [...forecast].sort((a, b) => a.queueMinutes - b.queueMinutes);
  const bestTimes = sorted.slice(0, 3).map(t => t.hour);
  const worstTimes = sorted.slice(-2).map(t => t.hour);
  
  return {
    lift: { id: liftId, name: lift.name, type: lift.type, capacity: lift.capacity },
    date: date.toISOString().split('T')[0],
    weather,
    forecast,
    bestTimes,
    worstTimes,
    peakQueue: Math.max(...forecast.map(f => f.queueMinutes)),
    avgQueue: Math.round(forecast.reduce((a, b) => a + b.queueMinutes, 0) / forecast.length * 10) / 10
  };
}

/**
 * Alla liftar just nu
 */
function getAllQueuesNow(datetime = new Date(), weather = 'partly_cloudy') {
  const queues = [];
  
  for (const [id, lift] of Object.entries(LIFT_DATA)) {
    const queueTime = calculateQueueTime(id, datetime, weather);
    queues.push({
      id,
      name: lift.name,
      type: lift.type,
      queueMinutes: queueTime,
      level: queueTime < 3 ? 'low' : queueTime < 8 ? 'medium' : 'high',
      emoji: queueTime < 3 ? '🟢' : queueTime < 8 ? '🟡' : '🔴'
    });
  }
  
  return queues.sort((a, b) => a.queueMinutes - b.queueMinutes);
}

/**
 * Bästa liftval just nu
 */
function getBestLiftNow(zone = null, datetime = new Date(), weather = 'partly_cloudy') {
  const queues = getAllQueuesNow(datetime, weather);
  
  // Filtrera på zon om angiven
  // TODO: Lägg till zon-mappning
  
  const best = queues[0];
  const worst = queues[queues.length - 1];
  
  return {
    recommendation: `Kör ${best.name}! Bara ${best.queueMinutes} min kö`,
    avoid: `Undvik ${worst.name} (${worst.queueMinutes} min kö)`,
    best,
    worst,
    allQueues: queues
  };
}

/**
 * Formatera för display
 */
function formatQueueDisplay(liftId, datetime = new Date()) {
  const forecast = getDayForecast(liftId, datetime);
  if (!forecast) return 'Lift not found';
  
  let output = `\n🚡 ${forecast.lift.name}\n`;
  output += `📊 Köprognos ${forecast.date}\n\n`;
  
  forecast.forecast.forEach(f => {
    const bar = '█'.repeat(Math.min(10, Math.round(f.queueMinutes)));
    output += `${f.emoji} ${f.hour}: ${f.queueMinutes} min ${bar}\n`;
  });
  
  output += `\n✨ Bäst: ${forecast.bestTimes.join(', ')}\n`;
  output += `⚠️  Undvik: ${forecast.worstTimes.join(', ')}\n`;
  output += `📈 Peak: ${forecast.peakQueue} min | Snitt: ${forecast.avgQueue} min\n`;
  
  return output;
}

// Export
module.exports = {
  LIFT_DATA,
  calculateQueueTime,
  getDayForecast,
  getAllQueuesNow,
  getBestLiftNow,
  formatQueueDisplay,
  getHolidayFactor
};

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const liftId = args[0]?.toUpperCase() || 'T7';
  
  if (args[0] === '--all') {
    console.log('\n🎿 ALLA KÖER JUST NU\n');
    const queues = getAllQueuesNow();
    queues.forEach(q => {
      console.log(`${q.emoji} ${q.name.padEnd(20)} ${q.queueMinutes} min`);
    });
    console.log('\n' + getBestLiftNow().recommendation);
  } else if (args[0] === '--best') {
    const result = getBestLiftNow();
    console.log('\n🎯 ' + result.recommendation);
    console.log('⚠️  ' + result.avoid);
  } else {
    console.log(formatQueueDisplay(liftId));
  }
}
