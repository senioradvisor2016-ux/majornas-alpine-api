#!/usr/bin/env node
/**
 * 🎿 MAJORA ALPINE - På Vift i Lift 🚡
 * Huvudkommando för all funktionalitet
 */

const { handleCommand, fetchResort, RESORTS } = require('./telegram-handler');
const { getWebcams, formatWebcamMessage } = require('./webcams');
const { compareResorts, findBestResort, formatComparison } = require('./compare');
const { recordSnapshot, getSnowTrend, formatTrend } = require('./history');
const { analyze, getCurrentTimePeriod, predictLiftQueue, generateDayPlan, getEquipmentRecommendation, LIFT_QUEUE_PATTERNS } = require('./ai-brain');
const { generateVoiceReport } = require('./voice-report');

const HELP = `
🎿 **MAJORA ALPINE - På Vift i Lift** 🚡

**Grundläggande:**
  majora status [resort]      Aktuell status
  majora liftar [resort]      Alla liftar
  majora stängda [resort]     Stängda liftar
  majora backar [resort]      Backar per svårighet
  majora powder [resort]      Powder alert status
  majora prognos [resort]     Väderprognos

**AI & Analys:**
  majora plan                 Personlig dagsplan
  majora köer                 Aktuella köprediktioner
  majora utrustning           Kläd- & utrustningsråd
  majora snökvalitet          Snöanalys
  majora ai <fråga>           Fråga AI vad som helst

**Jämförelse:**
  majora compare              Jämför anläggningar
  majora best                 Bästa anläggningen just nu

**Media:**
  majora webcam [resort]      Webbkameror
  majora voice [type]         Röstrapport (morning/conditions)

**Data:**
  majora trend [dagar]        Snötrend
  majora record               Spara snapshot

**Anläggningar:**
  trysil, are, salen, hemsedal, vemdalen
`;

async function main() {
  const [,, cmd, ...args] = process.argv;
  const argStr = args.join(' ');
  
  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') {
    console.log(HELP);
    return;
  }
  
  try {
    switch (cmd) {
      case 'status':
      case 'liftar':
      case 'lifts':
      case 'stängda':
      case 'closed':
      case 'backar':
      case 'slopes':
      case 'powder':
      case 'snö':
      case 'prognos':
      case 'forecast':
        const result = await handleCommand(cmd, argStr);
        console.log(result);
        break;
        
      case 'ai':
        const aiResult = await handleCommand('ai', argStr);
        console.log(aiResult);
        break;
        
      case 'webcam':
      case 'kamera':
      case 'cam':
        const resort = args[0] || 'trysil';
        console.log(formatWebcamMessage(resort));
        break;
        
      case 'compare':
      case 'jämför':
        const compareResults = await compareResorts(['trysil', 'hemsedal', 'are']);
        console.log(formatComparison(compareResults));
        break;
        
      case 'best':
      case 'bäst':
        const best = await findBestResort();
        console.log(`🏆 **BÄSTA VALET JUST NU**\n`);
        console.log(`**${best.data.name}**\n`);
        console.log(`❄️ Snödjup: ${best.data.snow}cm`);
        if (best.data.freshSnow > 0) console.log(`✨ Nysnö: ${best.data.freshSnow}cm`);
        console.log(`🚡 Liftar: ${best.data.lifts.open}/${best.data.lifts.total}`);
        console.log(`🌡️ Temp: ${best.data.temp}°C`);
        console.log(`💨 Vind: ${best.data.wind} m/s`);
        if (best.data.powderAlert) console.log(`\n🎿✨ POWDER ALERT! 🎿✨`);
        break;
        
      case 'trend':
        const days = parseInt(args[0]) || 7;
        const trend = getSnowTrend(days);
        console.log(formatTrend(trend));
        break;
        
      case 'record':
        const resortToRecord = args[0] || 'trysil';
        const resortConfig = RESORTS[resortToRecord] || RESORTS.trysil;
        const data = await fetchResort(resortConfig.query);
        if (data) {
          const snapshot = await recordSnapshot(data);
          console.log(`✅ Sparat snapshot för ${snapshot.resort}`);
          console.log(`   ❄️ ${snapshot.snow}cm | 🌡️ ${snapshot.temp}°C`);
        } else {
          console.log('❌ Kunde inte hämta data');
        }
        break;
      
      case 'plan':
      case 'dagsplan':
        const planData = await fetchResort('trysil');
        const analysis = await analyze(planData, 'plan');
        console.log(analysis);
        break;
        
      case 'köer':
      case 'kö':
      case 'queue':
        const queueData = await fetchResort('trysil');
        const queueAnalysis = await analyze(queueData, 'köer');
        console.log(queueAnalysis);
        break;
        
      case 'utrustning':
      case 'gear':
      case 'kläder':
        const gearData = await fetchResort('trysil');
        const gearAnalysis = await analyze(gearData, 'utrustning');
        console.log(gearAnalysis);
        break;
        
      case 'snökvalitet':
      case 'snö':
      case 'snow':
        const snowData = await fetchResort('trysil');
        const snowAnalysis = await analyze(snowData, 'snökvalitet');
        console.log(snowAnalysis);
        break;
        
      case 'voice':
      case 'röst':
        const voiceType = args[0] || 'morning';
        const voiceData = await fetchResort('trysil');
        const script = generateVoiceReport(voiceData, voiceType);
        console.log(script);
        break;
        
      default:
        // Default till status
        const defaultResult = await handleCommand('status', cmd + ' ' + argStr);
        console.log(defaultResult);
    }
  } catch (err) {
    console.error(`❌ Fel: ${err.message}`);
    process.exit(1);
  }
}

main();
