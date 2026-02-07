#!/usr/bin/env node
/**
 * 🎿 MAJORA ALPINE - På Vift i Lift 🚡
 * Local web server + API
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3847;
const API_URL = 'https://api.fnugg.no/search?q=trysil';

// Cache för API-data (5 min)
let cache = { data: null, timestamp: 0 };
const CACHE_TTL = 5 * 60 * 1000;

async function fetchTrysil() {
  if (cache.data && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.data;
  }
  
  const res = await fetch(API_URL);
  const data = await res.json();
  const trysil = data.hits.hits.find(h => h._source.name === 'SkiStar Trysil')?._source;
  
  cache = { data: trysil, timestamp: Date.now() };
  return trysil;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // API endpoints
  if (url.pathname === '/api/status') {
    try {
      const data = await fetchTrysil();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }
  
  if (url.pathname === '/api/ai') {
    // Simple AI endpoint for future expansion
    const query = url.searchParams.get('q') || '';
    const answer = processAIQuery(query);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ answer }));
    return;
  }
  
  // Static files
  let filePath = path.join(__dirname, url.pathname === '/' ? 'index.html' : url.pathname);
  
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  
  const ext = path.extname(filePath);
  const contentTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };
  
  res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
  fs.createReadStream(filePath).pipe(res);
});

function processAIQuery(query) {
  const q = query.toLowerCase();
  
  if (q.includes('kö') || q.includes('vänta')) {
    return 'Trysilgondolen har ofta kortast kö på förmiddagen. Undvik T1 Liekspressen runt lunch.';
  }
  if (q.includes('barn') || q.includes('familj')) {
    return 'Eventyr-området på Turistsenteret är perfekt för familjer! Gröna backar 21, 39, 56, 60.';
  }
  if (q.includes('svart') || q.includes('expert')) {
    return 'Høgegga-sidan har de bästa svarta backarna: 30, 76, 82.';
  }
  if (q.includes('lunch') || q.includes('mat')) {
    return 'Knettsetra vid T8 har bäst utsikt. Undvik Turistsenteret 12-13.';
  }
  
  return 'Fråga om: köer, barnvänliga backar, svarta backar, eller lunchställen!';
}

server.listen(PORT, () => {
  console.log(`🎿 Majora Alpine server running at http://localhost:${PORT}`);
});
