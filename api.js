#!/usr/bin/env node
/**
 * 🎿 MAJORA ALPINE - REST API
 * Enkel API för Lovable-integration
 */

const http = require('http');

const PORT = 3848;
const FNUGG_API = 'https://api.fnugg.no/search';

const RESORTS = {
  trysil: 'trysil',
  hemsedal: 'hemsedal',
  are: 'åre',
  salen: 'sälen hundfjället',
  vemdalen: 'vemdalen'
};

// Cache
let cache = {};
const CACHE_TTL = 5 * 60 * 1000;

async function fetchResort(query) {
  const cacheKey = query;
  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
    return cache[cacheKey].data;
  }
  
  const res = await fetch(`${FNUGG_API}?q=${encodeURIComponent(query)}`);
  const data = await res.json();
  const resort = data.hits.hits[0]?._source;
  
  cache[cacheKey] = { data: resort, timestamp: Date.now() };
  return resort;
}

function transformData(raw) {
  if (!raw) return null;
  
  const c = raw.conditions?.combined?.top || {};
  const b = raw.conditions?.combined?.bottom || c;
  
  return {
    resort: raw.name,
    id: raw.id,
    isOpen: raw.resort_open,
    lastUpdated: raw.last_updated,
    conditions: {
      temp_top: c.temperature?.value || 0,
      temp_bottom: b.temperature?.value || 0,
      wind_speed: c.wind?.mps || 0,
      wind_direction: c.wind?.name || '',
      snow_depth: c.snow?.depth_slope || 0,
      fresh_snow: c.snow?.today || 0,
      condition: c.condition_description || '',
      powder_alert: c.powder_alarm || false
    },
    lifts: {
      open: raw.lifts?.open || 0,
      total: raw.lifts?.count || 0,
      list: (raw.lifts?.list || []).map(l => ({
        name: l.name,
        status: l.status === '1' ? 'open' : 'closed',
        type: l.name.includes('gondol') ? 'gondola' : 
              l.name.includes('Ekspress') ? 'express' : 'tbar'
      }))
    },
    slopes: {
      open: raw.slopes?.open || 0,
      total: raw.slopes?.count || 0,
      list: (raw.slopes?.list || []).map(s => ({
        name: s.name,
        status: s.status === '1' ? 'open' : 'closed',
        difficulty: s.slope_difficulty
      })),
      by_difficulty: {
        green: (raw.slopes?.list || []).filter(s => s.status === '1' && s.slope_difficulty === 'green').length,
        blue: (raw.slopes?.list || []).filter(s => s.status === '1' && s.slope_difficulty === 'blue').length,
        red: (raw.slopes?.list || []).filter(s => s.status === '1' && s.slope_difficulty === 'red').length,
        black: (raw.slopes?.list || []).filter(s => s.status === '1' && s.slope_difficulty === 'black').length
      }
    },
    forecast: raw.conditions?.forecast?.long_term?.slice(0, 5).map(d => ({
      date: d.period?.from,
      temp: d.temperature?.value,
      symbol: d.symbol?.name,
      wind: d.wind?.mps
    })) || [],
    webcams: [
      { name: 'Toppen', url: `https://iwc2.wowza.com/websnap/skistar/${raw.name.toLowerCase().replace(/[^a-z]/g, '')}_topp.jpg` },
      { name: 'Base', url: `https://iwc2.wowza.com/websnap/skistar/${raw.name.toLowerCase().replace(/[^a-z]/g, '')}_base.jpg` }
    ]
  };
}

// AI recommendations
function getRecommendation(data) {
  if (!data) return null;
  
  const temp = data.conditions.temp_top;
  const wind = data.conditions.wind_speed;
  const fresh = data.conditions.fresh_snow;
  const hour = new Date().getHours();
  
  let tip = '';
  let area = '';
  
  if (fresh >= 10) {
    tip = 'Powder day! Kör offpist innan det blir utåkt.';
    area = 'Høgegga';
  } else if (hour < 10) {
    tip = 'Perfekt tid - minimala köer!';
    area = 'Trysilgondolen';
  } else if (hour >= 11 && hour <= 13) {
    tip = 'Lunchtid = köer. Prova Høyfjellssenteret.';
    area = 'Høyfjellssenteret';
  } else if (temp > 0) {
    tip = 'Plusgrader - snön blir blöt. Kör norrlägen!';
    area = 'Høgegga norrsida';
  } else if (wind > 8) {
    tip = 'Blåsigt på toppen. Håll dig i skyddade backar.';
    area = 'Turistsenteret';
  } else {
    tip = 'Fina förhållanden över hela anläggningen!';
    area = 'Valfritt';
  }
  
  return { tip, recommended_area: area };
}

// Queue predictions
function getQueuePredictions() {
  const hour = new Date().getHours();
  const lifts = [
    { name: 'T7 Trysilgondolen', peak: [9, 10, 14], base: 10 },
    { name: 'T1 Liekspressen', peak: [10, 11, 12], base: 8 },
    { name: 'T2 Fjellekspressen', peak: [10, 11], base: 5 },
    { name: 'F2 Toppekspressen', peak: [11, 12, 13], base: 6 },
    { name: 'H1 Høgekspressen', peak: [10, 11, 14], base: 4 }
  ];
  
  return lifts.map(l => ({
    name: l.name,
    wait_minutes: l.peak.includes(hour) ? Math.round(l.base * 1.5) : Math.round(l.base * 0.6),
    is_peak: l.peak.includes(hour)
  }));
}

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;
  
  try {
    // GET /resorts - lista alla
    if (path === '/resorts') {
      res.end(JSON.stringify({ resorts: Object.keys(RESORTS) }));
      return;
    }
    
    // GET /resort/:id - en resort
    const resortMatch = path.match(/^\/resort\/(\w+)$/);
    if (resortMatch) {
      const id = resortMatch[1];
      const query = RESORTS[id];
      if (!query) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Resort not found' }));
        return;
      }
      const raw = await fetchResort(query);
      const data = transformData(raw);
      res.end(JSON.stringify(data));
      return;
    }
    
    // GET /resort/:id/recommendation
    if (path.match(/^\/resort\/(\w+)\/recommendation$/)) {
      const id = path.split('/')[2];
      const query = RESORTS[id];
      const raw = await fetchResort(query);
      const data = transformData(raw);
      const rec = getRecommendation(data);
      res.end(JSON.stringify(rec));
      return;
    }
    
    // GET /resort/:id/queues
    if (path.match(/^\/resort\/(\w+)\/queues$/)) {
      const queues = getQueuePredictions();
      res.end(JSON.stringify({ queues }));
      return;
    }
    
    // GET /compare
    if (path === '/compare') {
      const results = await Promise.all(
        Object.entries(RESORTS).map(async ([id, query]) => {
          const raw = await fetchResort(query);
          return { id, ...transformData(raw) };
        })
      );
      res.end(JSON.stringify({ resorts: results.filter(r => r.resort) }));
      return;
    }
    
    // Default: 404
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
    
  } catch (err) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`🎿 Majora Alpine API running at http://localhost:${PORT}`);
  console.log(`
Endpoints:
  GET /resorts              - List all resorts
  GET /resort/:id           - Get resort data
  GET /resort/:id/recommendation - AI recommendation
  GET /resort/:id/queues    - Queue predictions
  GET /compare              - Compare all resorts
  `);
});
