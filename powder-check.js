#!/usr/bin/env node
/**
 * 🎿 MAJORA ALPINE - På Vift i Lift 🚡
 * Powder Alert Checker
 */

const TRYSIL_API = 'https://api.fnugg.no/search?q=trysil';
const STATE_FILE = '/tmp/trysil-powder-state.json';
const fs = require('fs');

async function fetchTrysil() {
  const res = await fetch(TRYSIL_API);
  const data = await res.json();
  return data.hits.hits.find(h => h._source.name === 'SkiStar Trysil')?._source;
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return { lastAlertSnow: 0, lastAlertTime: 0 };
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state));
}

async function main() {
  const data = await fetchTrysil();
  if (!data) {
    console.log('NO_ALERT');
    return;
  }

  const cond = data.conditions.combined.top || {};
  const powderAlert = cond.powder_alarm || false;
  const freshSnow = cond.snow?.today || 0;
  const state = loadState();
  
  // Powder alert från anläggningen
  if (powderAlert) {
    console.log('POWDER_ALERT');
    console.log('🎿✨ POWDER ALERT TRYSIL! 🎿✨');
    console.log(`Nysnö: ${freshSnow}cm`);
    console.log(`Snödjup: ${cond.snow?.depth_slope}cm`);
    console.log(`Temp: ${cond.temperature?.value}°C`);
    console.log(`"${cond.condition_description}"`);
    return;
  }
  
  // Egen alert om > 10cm nysnö och inte redan alertat
  if (freshSnow >= 10 && freshSnow > state.lastAlertSnow) {
    state.lastAlertSnow = freshSnow;
    state.lastAlertTime = Date.now();
    saveState(state);
    
    console.log('FRESH_SNOW');
    console.log(`❄️ ${freshSnow}cm NYSNÖ i Trysil!`);
    console.log(`Snödjup nu: ${cond.snow?.depth_slope}cm`);
    console.log(`Temp: ${cond.temperature?.value}°C`);
    return;
  }
  
  // Reset state om det inte snöat på 24h
  if (freshSnow === 0 && Date.now() - state.lastAlertTime > 86400000) {
    state.lastAlertSnow = 0;
    saveState(state);
  }
  
  console.log('NO_ALERT');
}

main().catch(err => {
  console.error('Error:', err.message);
  console.log('NO_ALERT');
});
