const http = require('http');
const url = require('url');

// Import modules
const routing = require('../trysil-routing.js');
const navigator = require('../trysil-navigator.js');
const queuePredictor = require('../queue-predictor.js');
const chatNav = require('../chat-navigator.js');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;
  const query = Object.fromEntries(parsedUrl.searchParams);
  
  try {
    // Routes
    if (pathname === '/' || pathname === '/api') {
      return res.json({ name: 'Majornas Alpine API', version: '2.0', tagline: 'I Lift på Vift 🎿' });
    }
    
    if (pathname === '/navigate' || pathname === '/api/navigate') {
      const message = query.q || '';
      const result = chatNav.chatNavigate(message, query.from);
      return res.json(result);
    }
    
    if (pathname === '/queues' || pathname === '/api/queues') {
      const datetime = query.datetime ? new Date(query.datetime) : new Date();
      const weather = query.weather || 'partly_cloudy';
      return res.json({
        timestamp: datetime.toISOString(),
        queues: queuePredictor.getAllQueuesNow(datetime, weather),
        recommendation: queuePredictor.getBestLiftNow(null, datetime, weather)
      });
    }
    
    if (pathname === '/route' || pathname === '/api/route') {
      const from = (query.from || '').toUpperCase();
      const to = (query.to || '').toUpperCase();
      const route = routing.findRoute(from, to);
      return res.json(route);
    }
    
    if (pathname === '/chat' || pathname === '/api/chat') {
      const q = query.q || '';
      const result = navigator.quickQuery(q);
      return res.json({ query: q, response: result || 'Ställ en fråga!' });
    }
    
    if (pathname.startsWith('/queue/') || pathname.startsWith('/api/queue/')) {
      const liftId = pathname.split('/').pop().toUpperCase();
      const forecast = queuePredictor.getDayForecast(liftId);
      return res.json(forecast || { error: 'Lift not found' });
    }
    
    return res.json({ error: 'Not found', endpoints: ['/navigate', '/queues', '/route', '/chat'] });
    
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
