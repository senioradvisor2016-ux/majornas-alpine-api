#!/usr/bin/env node
/**
 * 🎿 MAJORA ALPINE API - På Vift i Lift 🚡
 * Full-featured API för Lovable-integration
 * 
 * Endpoints:
 *   GET /                     - API info
 *   GET /resorts              - Lista alla anläggningar
 *   GET /resort/:id           - Full data för en anläggning
 *   GET /resort/:id/lifts     - Liftar med köprediktioner
 *   GET /resort/:id/slopes    - Backar per svårighetsgrad
 *   GET /resort/:id/forecast  - 5-dagars prognos
 *   GET /resort/:id/ai        - AI-rekommendation
 *   GET /resort/:id/plan      - Personlig dagsplan
 *   GET /resort/:id/gear      - Utrustningsrekommendation
 *   GET /compare              - Jämför alla anläggningar
 *   GET /best                 - Bästa anläggningen just nu
 *   POST /ai/ask              - Fråga AI (body: {question, resort})
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3850;

// Import routing
const routing = require('./trysil-routing.js');
const FNUGG_API = 'https://api.fnugg.no/search';

// ===== RESORT CONFIG =====
const RESORTS = {
  trysil: { name: 'Trysil', query: 'trysil', country: 'NO' },
  hemsedal: { name: 'Hemsedal', query: 'hemsedal', country: 'NO' },
  are: { name: 'Åre', query: 'åre', country: 'SE' },
  salen: { name: 'Sälen', query: 'sälen hundfjället', country: 'SE' },
  vemdalen: { name: 'Vemdalen', query: 'vemdalen', country: 'SE' },
  geilo: { name: 'Geilo', query: 'geilo', country: 'NO' },
  hovden: { name: 'Hovden', query: 'hovden', country: 'NO' }
};

// ===== CACHE =====
const cache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 min

// ===== HISTORY =====
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ===== LIFT QUEUE PATTERNS (AI-baserat) =====
const QUEUE_PATTERNS = {
  gondola: { peakMultiplier: 2.0, baseWait: 12 },
  express: { peakMultiplier: 1.5, baseWait: 6 },
  chairlift: { peakMultiplier: 1.3, baseWait: 4 },
  tbar: { peakMultiplier: 1.2, baseWait: 2 }
};

const PEAK_HOURS = [10, 11, 12, 14, 15];

// ===== HELPER FUNCTIONS =====

async function fetchResort(query) {
  const cacheKey = `resort:${query}`;
  if (cache[cacheKey] && Date.now() - cache[cacheKey].ts < CACHE_TTL) {
    return cache[cacheKey].data;
  }
  
  const res = await fetch(`${FNUGG_API}?q=${encodeURIComponent(query)}`);
  const json = await res.json();
  const data = json.hits?.hits?.[0]?._source || null;
  
  if (data) {
    cache[cacheKey] = { data, ts: Date.now() };
  }
  return data;
}

function getLiftType(name) {
  const n = name.toLowerCase();
  if (n.includes('gondol')) return 'gondola';
  if (n.includes('ekspress') || n.includes('express')) return 'express';
  if (n.includes('stol') || n.includes('chair')) return 'chairlift';
  return 'tbar';
}

function predictQueueTime(liftName, hour = new Date().getHours()) {
  const type = getLiftType(liftName);
  const pattern = QUEUE_PATTERNS[type];
  const isPeak = PEAK_HOURS.includes(hour);
  
  const baseWait = pattern.baseWait;
  const wait = isPeak ? Math.round(baseWait * pattern.peakMultiplier) : Math.round(baseWait * 0.5);
  
  return {
    waitMinutes: wait,
    isPeak,
    crowdLevel: isPeak ? 'high' : 'low',
    recommendation: isPeak ? 'Överväg alternativa liftar' : 'Bra tid att åka!'
  };
}

function transformResortData(raw, resortId) {
  if (!raw) return null;
  
  const c = raw.conditions?.combined?.top || {};
  const b = raw.conditions?.combined?.bottom || c;
  
  // Räkna backar per svårighet
  const slopesByDiff = { green: 0, blue: 0, red: 0, black: 0 };
  (raw.slopes?.list || []).filter(s => s.status === '1').forEach(s => {
    if (slopesByDiff.hasOwnProperty(s.slope_difficulty)) {
      slopesByDiff[s.slope_difficulty]++;
    }
  });

  return {
    id: resortId,
    name: raw.name,
    country: RESORTS[resortId]?.country || 'NO',
    isOpen: raw.resort_open || false,
    lastUpdated: raw.last_updated,
    
    conditions: {
      tempTop: c.temperature?.value || 0,
      tempBottom: b.temperature?.value || 0,
      wind: {
        speed: c.wind?.mps || 0,
        direction: c.wind?.name || 'N',
        description: c.wind?.speed || ''
      },
      snow: {
        depthTop: c.snow?.depth_slope || 0,
        depthBottom: b.snow?.depth_slope || 0,
        fresh24h: c.snow?.today || 0,
        quality: getSnowQuality(c.temperature?.value, c.wind?.mps, c.snow?.today)
      },
      description: c.condition_description || '',
      powderAlert: c.powder_alarm || false
    },
    
    lifts: {
      open: raw.lifts?.open || 0,
      total: raw.lifts?.count || 0,
      percentage: Math.round((raw.lifts?.open / raw.lifts?.count) * 100) || 0
    },
    
    slopes: {
      open: raw.slopes?.open || 0,
      total: raw.slopes?.count || 0,
      percentage: Math.round((raw.slopes?.open / raw.slopes?.count) * 100) || 0,
      byDifficulty: slopesByDiff
    },
    
    // AI-genererade fält
    ai: {
      recommendation: getQuickRecommendation(c, raw.lifts),
      crowdLevel: getCrowdLevel(),
      bestTimeToday: getBestTime(c)
    }
  };
}

function getSnowQuality(temp, wind, freshSnow) {
  if (freshSnow > 10) return { rating: 'powder', description: 'Powder! Nysnö ger fantastiska förhållanden' };
  if (temp > 0) return { rating: 'wet', description: 'Blöt snö pga plusgrader' };
  if (temp < -15) return { rating: 'cold', description: 'Kall, snabb snö - lite hård' };
  if (temp >= -8 && temp <= -3 && wind < 5) return { rating: 'perfect', description: 'Perfekt temperatur och vindförhållanden' };
  if (wind > 8) return { rating: 'windpacked', description: 'Vindpackad på exponerade ställen' };
  return { rating: 'good', description: 'Fina, normala förhållanden' };
}

function getQuickRecommendation(conditions, lifts) {
  const temp = conditions.temperature?.value || 0;
  const wind = conditions.wind?.mps || 0;
  const fresh = conditions.snow?.today || 0;
  const hour = new Date().getHours();
  
  if (fresh >= 10) return '🎿 Powder day! Kör offpist tidigt innan det blir utåkt';
  if (hour < 10) return '☀️ Perfekt morgon - minimala köer, fin snö';
  if (hour >= 11 && hour <= 13) return '🍕 Lunchtid - förvänta dig köer vid huvudliftarna';
  if (temp > 0) return '☀️ Plusgrader - snön blir blöt, kör norrlägen';
  if (wind > 8) return '💨 Blåsigt - håll dig i skyddade backar';
  return '✅ Fina förhållanden - kör på!';
}

function getCrowdLevel() {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  const isWeekend = day === 0 || day === 6;
  
  let level = 2; // base
  if (PEAK_HOURS.includes(hour)) level += 2;
  if (isWeekend) level += 1;
  level = Math.min(5, level);
  
  const labels = ['Tomt', 'Lugnt', 'Normalt', 'Fullt', 'Mycket fullt', 'Extremt'];
  return { level, label: labels[level], isWeekend };
}

function getBestTime(conditions) {
  const temp = conditions.temperature?.value || 0;
  if (temp > 0) return { time: '09:00-11:00', reason: 'Innan snön blir blöt' };
  return { time: '09:00-10:30', reason: 'Minimala köer, perfekta förhållanden' };
}

function generateDayPlan(data) {
  const temp = data.conditions?.tempTop || -5;
  const wind = data.conditions?.wind?.speed || 0;
  const fresh = data.conditions?.snow?.fresh24h || 0;
  
  const plan = {
    summary: '',
    morning: { time: '09:00-12:00', activities: [] },
    lunch: { time: '12:00-13:00', recommendation: '' },
    afternoon: { time: '13:00-16:00', activities: [] },
    tips: []
  };
  
  // Morgon
  if (fresh >= 5) {
    plan.morning.activities.push({
      type: 'powder',
      area: 'Offpist-områden',
      description: 'Kör powder innan det blir utåkt!',
      priority: 'high'
    });
    plan.summary = 'Powder day! Prioritera offpist på morgonen.';
  } else {
    plan.morning.activities.push({
      type: 'warmup',
      area: 'Huvudområdet',
      description: 'Uppvärmning på preparerade backar',
      priority: 'normal'
    });
    plan.summary = 'Normal dag med fina förhållanden.';
  }
  
  // Lunch
  if (wind > 5) {
    plan.lunch.recommendation = 'Vindskyddat ställe - undvik topprestauranger';
  } else {
    plan.lunch.recommendation = 'Valfritt - bäst utsikt på topprestaurangen';
  }
  plan.lunch.tip = 'Ät 11:30 eller 13:30 för att undvika rusning';
  
  // Eftermiddag
  if (temp > 0) {
    plan.afternoon.activities.push({
      type: 'north-facing',
      area: 'Norrlägen',
      description: 'Snön bevaras bättre i skuggan',
      priority: 'high'
    });
  } else {
    plan.afternoon.activities.push({
      type: 'explore',
      area: 'Valfritt område',
      description: 'Utforska hela anläggningen',
      priority: 'normal'
    });
  }
  
  // Tips
  if (wind > 8) plan.tips.push('💨 Ta med extra lager - blåsigt på toppen');
  if (temp < -15) plan.tips.push('🥶 Mycket kallt - ta regelbundna pauser');
  if (fresh > 0) plan.tips.push('❄️ Nysnö - överväg bredare skidor');
  
  return plan;
}

function getGearRecommendation(temp) {
  const gear = {
    layers: [],
    accessories: [],
    skis: '',
    wax: ''
  };
  
  if (temp < -15) {
    gear.layers = ['Tjockt merino-underställ', 'Fleece mellanlager', 'Dunjacka under skal'];
    gear.accessories = ['Balaklava', 'Dubbla vantar', 'Tåvärmare'];
    gear.skis = 'Korta, snabba skidor - snön är hård';
    gear.wax = 'Kallvalla (grön)';
  } else if (temp < -8) {
    gear.layers = ['Underställ', 'Fleece', 'Skaljacka'];
    gear.accessories = ['Mössa', 'Varma handskar', 'Halsvärmare'];
    gear.skis = 'Allround-skidor';
    gear.wax = 'Universalvalla';
  } else if (temp < 0) {
    gear.layers = ['Tunt underställ', 'Lätt fleece', 'Skal'];
    gear.accessories = ['Mössa', 'Tunna handskar'];
    gear.skis = 'Allround-skidor';
    gear.wax = 'Universalvalla';
  } else {
    gear.layers = ['Lätt underställ', 'Ventilerande jacka'];
    gear.accessories = ['Buff', 'Tunna handskar', 'Solglasögon'];
    gear.skis = 'Breda skidor om det är blött';
    gear.wax = 'Vårvalla / fluorvalla';
  }
  
  return gear;
}

async function compareResorts() {
  const results = [];
  
  for (const [id, config] of Object.entries(RESORTS)) {
    try {
      const raw = await fetchResort(config.query);
      if (raw) {
        const data = transformResortData(raw, id);
        
        // Beräkna poäng
        let score = 0;
        score += data.conditions.snow.depthTop * 1;
        score += data.conditions.snow.fresh24h * 5;
        score += data.lifts.percentage * 0.5;
        score -= Math.abs(data.conditions.tempTop + 8) * 2;
        score -= data.conditions.wind.speed * 3;
        if (data.conditions.powderAlert) score += 50;
        
        results.push({ ...data, score: Math.round(score) });
      }
    } catch (e) {
      // Skip failed resorts
    }
  }
  
  results.sort((a, b) => b.score - a.score);
  return results;
}

function answerQuestion(question, data) {
  const q = question.toLowerCase();
  
  // Köer
  if (q.includes('kö') || q.includes('vänta') || q.includes('trängsel')) {
    const crowd = getCrowdLevel();
    return {
      answer: `Just nu är det ${crowd.label.toLowerCase()} (nivå ${crowd.level}/5). ${crowd.isWeekend ? 'Det är helg så förvänta dig mer folk.' : ''} Bästa tiden är före 10:00 eller efter 14:00.`,
      type: 'crowd'
    };
  }
  
  // Barn/familj
  if (q.includes('barn') || q.includes('familj') || q.includes('nybörjar')) {
    return {
      answer: 'För familjer rekommenderar jag barnområdena med gröna backar. Undvik de branta partierna. Boka skidskola för barnen - det brukar finnas drop-in.',
      type: 'family',
      areas: ['Barnområdet', 'Familjebackarna']
    };
  }
  
  // Expert/svart
  if (q.includes('svart') || q.includes('brant') || q.includes('expert') || q.includes('utmaning')) {
    return {
      answer: `Det finns ${data.slopes.byDifficulty.black} svarta backar öppna. De bästa utmaningarna hittar du vanligtvis i de högre partierna.`,
      type: 'expert',
      slopeCount: data.slopes.byDifficulty.black
    };
  }
  
  // Väder
  if (q.includes('väder') || q.includes('temp') || q.includes('vind') || q.includes('kall')) {
    return {
      answer: `Just nu: ${data.conditions.tempTop}°C på toppen, ${data.conditions.wind.speed} m/s vind. ${data.conditions.description}`,
      type: 'weather',
      conditions: data.conditions
    };
  }
  
  // Mat/lunch
  if (q.includes('mat') || q.includes('lunch') || q.includes('äta') || q.includes('restaurang')) {
    return {
      answer: 'Undvik huvudrestaurangerna 12-13 (rusning). Bäst att äta tidigt (11:30) eller sent (13:30). Topprestaurangerna har bäst utsikt men längre köer.',
      type: 'food'
    };
  }
  
  // Snö
  if (q.includes('snö') || q.includes('powder') || q.includes('nysnö')) {
    const snow = data.conditions.snow;
    return {
      answer: `Snödjup: ${snow.depthTop}cm på toppen. ${snow.fresh24h > 0 ? `${snow.fresh24h}cm nysnö senaste 24h!` : 'Ingen nysnö senaste dygnet.'} Kvalitet: ${snow.quality.description}`,
      type: 'snow',
      snow: snow
    };
  }
  
  // Default
  return {
    answer: `${data.name}: ${data.conditions.tempTop}°C, ${data.lifts.open}/${data.lifts.total} liftar öppna. ${data.ai.recommendation}`,
    type: 'general'
  };
}

// ===== HTTP SERVER =====

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;
  
  try {
    // GET / - API info
    if (pathname === '/') {
      res.end(JSON.stringify({
        name: 'Majora Alpine API',
        version: '1.0.0',
        tagline: 'På Vift i Lift 🎿',
        endpoints: [
          'GET /resorts',
          'GET /resort/:id',
          'GET /resort/:id/lifts',
          'GET /resort/:id/slopes', 
          'GET /resort/:id/forecast',
          'GET /resort/:id/ai',
          'GET /resort/:id/plan',
          'GET /resort/:id/gear',
          'GET /compare',
          'GET /best',
          'POST /ai/ask'
        ],
        resorts: Object.keys(RESORTS)
      }));
      return;
    }
    
    // GET /resorts
    // Queue Predictor
    const queueResult = handleQueueEndpoints(pathname, Object.fromEntries(url.searchParams));
    if (queueResult) {
      res.end(JSON.stringify(queueResult));
      return;
    }

    // Routing
    if (pathname === '/route') {
      const result = handleRoute(Object.fromEntries(url.searchParams));
      res.end(JSON.stringify(result));
      return;
    }
    
    if (pathname === '/lifts/list') {
      res.end(JSON.stringify(handleLiftsList()));
      return;
    }
    
    // Navigator Chat (LLM)
    if (pathname === '/chat' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          const result = await handleNavigatorChat(data);
          res.end(JSON.stringify(result));
        } catch (e) {
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
      return;
    }
    
    // Navigate with map data (POST)
    if (pathname === '/navigate' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const result = handleNavigateChat(data);
          res.end(JSON.stringify(result));
        } catch (e) {
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
      return;
    }
    
    // Navigate (GET for simple queries)
    if (pathname === '/navigate') {
      const message = url.searchParams.get('q') || '';
      const currentLocation = url.searchParams.get('from') || null;
      const result = chatNav.chatNavigate(message, currentLocation);
      res.end(JSON.stringify(result));
      return;
    }

    // Quick query (GET)
    if (pathname === '/chat') {
      const q = url.searchParams.get('q') || '';
      const quick = navigator.quickQuery(q);
      res.end(JSON.stringify({
        query: q,
        response: quick || 'Ställ en fråga om liftar, backar eller navigation!',
        suggestions: ['gröna backar', 'från T1 till F2', 'Høyfjellssenteret']
      }));
      return;
    }

    if (pathname === '/resorts') {
      res.end(JSON.stringify({
        resorts: Object.entries(RESORTS).map(([id, r]) => ({
          id,
          name: r.name,
          country: r.country
        }))
      }));
      return;
    }
    
    // GET /compare
    if (pathname === '/compare') {
      const results = await compareResorts();
      res.end(JSON.stringify({
        compared: results.length,
        resorts: results,
        best: results[0] || null
      }));
      return;
    }
    
    // GET /best
    if (pathname === '/best') {
      const results = await compareResorts();
      const best = results[0];
      if (best) {
        res.end(JSON.stringify({
          resort: best,
          reason: `Högst poäng (${best.score}) baserat på snö, väder och öppna liftar`
        }));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Kunde inte jämföra anläggningar' }));
      }
      return;
    }
    
    // POST /ai/ask
    if (pathname === '/ai/ask' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const { question, resort = 'trysil' } = JSON.parse(body);
          const config = RESORTS[resort] || RESORTS.trysil;
          const raw = await fetchResort(config.query);
          const data = transformResortData(raw, resort);
          const answer = answerQuestion(question, data);
          res.end(JSON.stringify(answer));
        } catch (e) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid request body' }));
        }
      });
      return;
    }
    
    // Resort-specific endpoints
    const resortMatch = pathname.match(/^\/resort\/(\w+)(\/(\w+))?$/);
    if (resortMatch) {
      const resortId = resortMatch[1];
      const subpath = resortMatch[3];
      
      const config = RESORTS[resortId];
      if (!config) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Resort not found', available: Object.keys(RESORTS) }));
        return;
      }
      
      const raw = await fetchResort(config.query);
      if (!raw) {
        res.writeHead(502);
        res.end(JSON.stringify({ error: 'Could not fetch resort data' }));
        return;
      }
      
      const data = transformResortData(raw, resortId);
      
      // GET /resort/:id
      if (!subpath) {
        res.end(JSON.stringify(data));
        return;
      }
      
      // GET /resort/:id/lifts
      if (subpath === 'lifts') {
        const hour = parseInt(url.searchParams.get('hour')) || new Date().getHours();
        const lifts = (raw.lifts?.list || []).map(l => ({
          name: l.name,
          status: l.status === '1' ? 'open' : 'closed',
          type: getLiftType(l.name),
          queue: l.status === '1' ? predictQueueTime(l.name, hour) : null
        }));
        res.end(JSON.stringify({
          total: lifts.length,
          open: lifts.filter(l => l.status === 'open').length,
          hour,
          lifts
        }));
        return;
      }
      
      // GET /resort/:id/slopes
      if (subpath === 'slopes') {
        const difficulty = url.searchParams.get('difficulty');
        let slopes = (raw.slopes?.list || []).map(s => ({
          name: s.name,
          status: s.status === '1' ? 'open' : 'closed',
          difficulty: s.slope_difficulty
        }));
        
        if (difficulty) {
          slopes = slopes.filter(s => s.difficulty === difficulty);
        }
        
        res.end(JSON.stringify({
          total: slopes.length,
          open: slopes.filter(s => s.status === 'open').length,
          byDifficulty: data.slopes.byDifficulty,
          slopes
        }));
        return;
      }
      
      // GET /resort/:id/forecast
      if (subpath === 'forecast') {
        const forecast = (raw.conditions?.forecast?.long_term || []).slice(0, 5).map(d => ({
          date: d.period?.from,
          dayOfWeek: new Date(d.period?.from).toLocaleDateString('sv-SE', { weekday: 'short' }),
          temp: d.temperature?.value,
          symbol: d.symbol?.name,
          wind: d.wind?.mps
        }));
        res.end(JSON.stringify({
          days: forecast.length,
          forecast
        }));
        return;
      }
      
      // GET /resort/:id/ai
      if (subpath === 'ai') {
        res.end(JSON.stringify({
          recommendation: data.ai.recommendation,
          crowdLevel: data.ai.crowdLevel,
          bestTime: data.ai.bestTimeToday,
          snowQuality: data.conditions.snow.quality,
          powderAlert: data.conditions.powderAlert
        }));
        return;
      }
      
      // GET /resort/:id/plan
      if (subpath === 'plan') {
        const plan = generateDayPlan(data);
        res.end(JSON.stringify(plan));
        return;
      }
      
      // GET /resort/:id/gear
      if (subpath === 'gear') {
        const gear = getGearRecommendation(data.conditions.tempTop);
        res.end(JSON.stringify({
          temperature: data.conditions.tempTop,
          ...gear
        }));
        return;
      }
      
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Unknown endpoint' }));
      return;
    }
    
    // 404
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
    
  } catch (err) {
    console.error('API Error:', err);
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`
🎿 ═══════════════════════════════════════════════════════
   MAJORA ALPINE API - På Vift i Lift
   Running on http://localhost:${PORT}
═══════════════════════════════════════════════════════ 🚡

Endpoints:
  GET  /                    API info
  GET  /resorts             Lista anläggningar
  GET  /resort/:id          Full resort data
  GET  /resort/:id/lifts    Liftar + köprediktioner
  GET  /resort/:id/slopes   Backar per svårighet
  GET  /resort/:id/forecast 5-dagars prognos
  GET  /resort/:id/ai       AI-rekommendationer
  GET  /resort/:id/plan     Personlig dagsplan
  GET  /resort/:id/gear     Utrustningsråd
  GET  /compare             Jämför alla
  GET  /best                Bästa anläggningen
  POST /ai/ask              Fråga AI

Resorts: ${Object.keys(RESORTS).join(', ')}
  `);
});

// ===== ROUTING ENDPOINT =====
// GET /route?from=T1&to=F2
function handleRoute(query) {
  const from = (query.from || '').toUpperCase();
  const to = (query.to || '').toUpperCase();
  
  if (!from || !to) {
    return { error: 'Missing from or to parameter', example: '/route?from=T1&to=F2' };
  }
  
  const route = routing.findRoute(from, to);
  
  if (route.error) {
    return { error: route.error, availableLifts: Object.keys(routing.LIFTS) };
  }
  
  // Format för frontend
  return {
    success: true,
    from: route.from,
    to: route.to,
    totalMinutes: route.totalMinutes,
    steps: route.steps.map((step, i) => ({
      order: i + 1,
      type: step.type,
      action: step.type === 'lift' 
        ? `Ta ${step.liftName}` 
        : `Åk ner till ${step.to}`,
      duration: step.minutes,
      liftId: step.liftId || null,
      liftName: step.liftName || null,
      fromZone: step.from,
      toZone: step.to
    })),
    formatted: formatRouteText(route)
  };
}

function formatRouteText(route) {
  let text = `🗺️ ${route.from.name} → ${route.to.name}\n`;
  text += `⏱️ ~${route.totalMinutes} min\n\n`;
  route.steps.forEach((step, i) => {
    if (step.type === 'lift') {
      text += `${i+1}. 🚡 ${step.liftName} (${step.minutes} min)\n`;
    } else {
      text += `${i+1}. ⛷️ Åk ner till ${step.to} (~${step.minutes} min)\n`;
    }
  });
  return text;
}

// GET /lifts/list - Alla liftar för dropdown
function handleLiftsList() {
  return {
    lifts: Object.entries(routing.LIFTS).map(([id, lift]) => ({
      id,
      name: lift.name,
      type: lift.type,
      fromZone: lift.from,
      toZone: lift.to
    }))
  };
}

// ===== LLM NAVIGATOR CHAT =====
const navigator = require('./trysil-navigator.js');

async function handleNavigatorChat(body) {
  const { message, history = [] } = body;
  
  if (!message) {
    return { error: 'Missing message' };
  }
  
  // Först: försök quick query (ingen LLM behövs)
  const quickAnswer = navigator.quickQuery(message);
  if (quickAnswer) {
    return {
      response: quickAnswer,
      source: 'quick',
      suggestions: getSuggestions(message)
    };
  }
  
  // Behöver LLM för komplext svar
  const systemPrompt = navigator.buildSystemContext();
  
  // Kalla Claude API
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_KEY) {
    return {
      response: 'LLM inte konfigurerad. Testa en enklare fråga som "gröna backar" eller "från T1 till F2".',
      source: 'fallback',
      context: navigator.getNavigatorContext()
    };
  }
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          ...history.map(h => ({ role: h.role, content: h.content })),
          { role: 'user', content: message }
        ]
      })
    });
    
    const data = await response.json();
    
    return {
      response: data.content?.[0]?.text || 'Kunde inte generera svar',
      source: 'llm',
      suggestions: getSuggestions(message)
    };
  } catch (err) {
    return {
      response: `Fel vid LLM-anrop: ${err.message}`,
      source: 'error'
    };
  }
}

function getSuggestions(lastMessage) {
  // Kontextuella förslag
  const suggestions = [
    'Vilka gröna backar finns det?',
    'Hur tar jag mig från T1 till Høgegga?',
    'Berätta om Høyfjellssenteret',
    'Vilka svarta backar finns det?',
    'Vilken lift tar mig till Panorama?'
  ];
  return suggestions.slice(0, 3);
}

// ===== QUEUE PREDICTOR ENDPOINTS =====
const queuePredictor = require('./queue-predictor.js');

function handleQueueEndpoints(pathname, query) {
  // GET /queues - Alla köer just nu
  if (pathname === '/queues') {
    const weather = query.weather || 'partly_cloudy';
    const datetime = query.datetime ? new Date(query.datetime) : new Date();
    return {
      timestamp: datetime.toISOString(),
      weather,
      queues: queuePredictor.getAllQueuesNow(datetime, weather),
      recommendation: queuePredictor.getBestLiftNow(null, datetime, weather)
    };
  }
  
  // GET /queues/best - Bästa liften
  if (pathname === '/queues/best') {
    const weather = query.weather || 'partly_cloudy';
    const datetime = query.datetime ? new Date(query.datetime) : new Date();
    return queuePredictor.getBestLiftNow(null, datetime, weather);
  }
  
  // GET /queue/:liftId - Specifik lift prognos
  const queueMatch = pathname.match(/^\/queue\/(\w+)$/);
  if (queueMatch) {
    const liftId = queueMatch[1].toUpperCase();
    const weather = query.weather || 'partly_cloudy';
    const datetime = query.datetime ? new Date(query.datetime) : new Date();
    const forecast = queuePredictor.getDayForecast(liftId, datetime, weather);
    if (!forecast) {
      return { error: 'Lift not found', availableLifts: Object.keys(queuePredictor.LIFT_DATA) };
    }
    return forecast;
  }
  
  // GET /queue/:liftId/now - Just nu
  const queueNowMatch = pathname.match(/^\/queue\/(\w+)\/now$/);
  if (queueNowMatch) {
    const liftId = queueNowMatch[1].toUpperCase();
    const weather = query.weather || 'partly_cloudy';
    const datetime = query.datetime ? new Date(query.datetime) : new Date();
    const queueTime = queuePredictor.calculateQueueTime(liftId, datetime, weather);
    const lift = queuePredictor.LIFT_DATA[liftId];
    if (!lift) {
      return { error: 'Lift not found' };
    }
    return {
      lift: { id: liftId, name: lift.name },
      timestamp: datetime.toISOString(),
      queueMinutes: queueTime,
      level: queueTime < 3 ? 'low' : queueTime < 8 ? 'medium' : 'high',
      emoji: queueTime < 3 ? '🟢' : queueTime < 8 ? '🟡' : '🔴'
    };
  }
  
  return null;
}

// ===== CHAT NAVIGATOR WITH MAP =====
const chatNav = require('./chat-navigator.js');

// POST /navigate - Chat-baserad navigation med kartdata
// Body: { message: "Ta mig till Høgegga", currentLocation: "T1" }
function handleNavigateChat(body) {
  const { message, currentLocation } = body;
  if (!message) {
    return { error: 'Missing message' };
  }
  return chatNav.chatNavigate(message, currentLocation);
}
