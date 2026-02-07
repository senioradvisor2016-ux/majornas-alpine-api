#!/usr/bin/env node
/**
 * 🎿 MAJORA ALPINE - Voice Reports
 * Genererar röstrapporter för TTS
 */

function generateVoiceReport(data, type = 'morning') {
  if (!data) return 'Kunde inte hämta skiddata.';
  
  const name = data.name || 'Trysil';
  const lifts = data.lifts || { open: 0, count: 0 };
  const slopes = data.slopes || { open: 0, count: 0 };
  const c = data.conditions?.combined?.top || {};
  const temp = c.temperature?.value || 0;
  const wind = c.wind?.mps || 0;
  const snow = c.snow?.depth_slope || 0;
  const freshSnow = c.snow?.today || 0;
  const condition = c.condition_description || '';
  const powderAlert = c.powder_alarm || false;
  
  let script = '';
  
  switch (type) {
    case 'morning':
      script = `God morgon! Här kommer dagens skidrapport från ${name}. `;
      
      if (powderAlert || freshSnow >= 10) {
        script += `Wow! Det har kommit ${freshSnow} centimeter nysnö! Powder-alarm är aktiverat. `;
      }
      
      script += `Just nu är ${lifts.open} av ${lifts.count} liftar öppna, `;
      script += `och ${slopes.open} av ${slopes.count} backar är preparerade. `;
      script += `Snödjupet på toppen är ${snow} centimeter. `;
      script += `Temperaturen ligger på ${temp} grader, `;
      
      if (wind > 8) {
        script += `och det blåser ganska friskt med ${wind} meter per sekund. Håll dig i skyddade backar. `;
      } else if (wind > 4) {
        script += `med lätt vind på ${wind} meter per sekund. `;
      } else {
        script += `och det är nästan vindstilla. Perfekt! `;
      }
      
      script += `Anläggningen rapporterar: "${condition}". `;
      script += `Ha en fantastisk dag i backarna!`;
      break;
      
    case 'conditions':
      script = `Aktuella förhållanden i ${name}: `;
      script += `${temp} grader, ${wind} meter per sekund vind, `;
      script += `${snow} centimeter snödjup. `;
      if (freshSnow > 0) {
        script += `Det har kommit ${freshSnow} centimeter nysnö. `;
      }
      script += condition;
      break;
      
    case 'lifts':
      const closedLifts = data.lifts?.list?.filter(l => l.status === '0') || [];
      if (closedLifts.length === 0) {
        script = `Alla ${lifts.count} liftar i ${name} är öppna!`;
      } else {
        script = `${lifts.open} av ${lifts.count} liftar är öppna i ${name}. `;
        script += `Stängda är: ${closedLifts.map(l => l.name).join(', ')}.`;
      }
      break;
      
    case 'powder':
      if (powderAlert) {
        script = `Powder-alarm! ${name} rapporterar ${freshSnow} centimeter nysnö! `;
        script += `Snödjupet är nu ${snow} centimeter. Dags att köra offpist!`;
      } else if (freshSnow > 0) {
        script = `Det har kommit ${freshSnow} centimeter nysnö i ${name}. `;
        script += `Inte officiellt powder-alarm än, men det ser lovande ut!`;
      } else {
        script = `Ingen nysnö att rapportera i ${name} just nu. `;
        script += `Snödjupet är ${snow} centimeter.`;
      }
      break;
      
    case 'recommendation':
      script = generateRecommendationScript(data);
      break;
      
    default:
      script = generateVoiceReport(data, 'morning');
  }
  
  return script;
}

function generateRecommendationScript(data) {
  const temp = data?.conditions?.combined?.top?.temperature?.value || 0;
  const wind = data?.conditions?.combined?.top?.wind?.mps || 0;
  const freshSnow = data?.conditions?.combined?.top?.snow?.today || 0;
  const hour = new Date().getHours();
  
  let script = 'Här är mina rekommendationer för idag. ';
  
  // Tid-baserade råd
  if (hour < 10) {
    script += 'Det är fortfarande tidigt, så köerna borde vara minimala. ';
    script += 'Perfekt tid att ta de populära liftarna. ';
  } else if (hour >= 11 && hour <= 13) {
    script += 'Det är rusning nu, så räkna med köer vid huvudliftarna. ';
    script += 'Jag rekommenderar att du åker på Høyfjellssenteret eller Skihytta för kortare väntetider. ';
  }
  
  // Väderbaserade råd
  if (freshSnow >= 5) {
    script += `Med ${freshSnow} centimeter nysnö rekommenderar jag Høgegga för bästa powder. `;
    script += 'Backe 30 och 76 brukar ha bäst orörd snö. ';
  }
  
  if (temp > 0) {
    script += 'Det är plusgrader, så snön kommer bli blöt på eftermiddagen. ';
    script += 'Kör de branta backarna på förmiddagen medan snön fortfarande är fast. ';
  } else if (temp < -15) {
    script += 'Det är riktigt kallt idag. Klä dig extra varmt och ta pauser för att värma upp. ';
  }
  
  if (wind > 8) {
    script += 'Det blåser ganska mycket på toppen. Håll dig i de lägre partierna eller skyddade backar. ';
  }
  
  script += 'Ha det gött i backarna!';
  
  return script;
}

// CLI
if (require.main === module) {
  const type = process.argv[2] || 'morning';
  
  // Hämta data och generera rapport
  (async () => {
    const res = await fetch('https://api.fnugg.no/search?q=trysil');
    const json = await res.json();
    const data = json.hits.hits.find(h => h._source.name === 'SkiStar Trysil')?._source;
    
    const script = generateVoiceReport(data, type);
    console.log(script);
  })();
}

module.exports = { generateVoiceReport, generateRecommendationScript };
