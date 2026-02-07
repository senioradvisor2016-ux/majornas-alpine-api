#!/usr/bin/env node
/**
 * 🎿 MAJORA ALPINE - Webcam URLs
 * Hämtar webbkamera-länkar för skidanläggningar
 */

const WEBCAMS = {
  trysil: [
    {
      name: 'Trysilfjellet Toppen',
      url: 'https://www.skistar.com/sv/vara-skidorter/trysil/vader-backar/webbkameror/',
      image: 'https://iwc2.wowza.com/websnap/skistar/trysil_topp.jpg',
      location: 'Toppen'
    },
    {
      name: 'Turistsenteret',
      url: 'https://www.skistar.com/sv/vara-skidorter/trysil/vader-backar/webbkameror/',
      image: 'https://iwc2.wowza.com/websnap/skistar/trysil_turistsenter.jpg',
      location: 'Turistsenteret'
    },
    {
      name: 'Høyfjellssenteret',
      url: 'https://www.skistar.com/sv/vara-skidorter/trysil/vader-backar/webbkameror/',
      image: 'https://iwc2.wowza.com/websnap/skistar/trysil_hoyfjell.jpg',
      location: 'Høyfjellssenteret'
    },
    {
      name: 'Skihytta',
      url: 'https://www.skistar.com/sv/vara-skidorter/trysil/vader-backar/webbkameror/',
      image: 'https://iwc2.wowza.com/websnap/skistar/trysil_skihytta.jpg',
      location: 'Skihytta'
    }
  ],
  are: [
    {
      name: 'Åreskutan',
      image: 'https://iwc2.wowza.com/websnap/skistar/are_areskutan.jpg',
      location: 'Toppen'
    },
    {
      name: 'Duved',
      image: 'https://iwc2.wowza.com/websnap/skistar/are_duved.jpg',
      location: 'Duved'
    }
  ],
  salen: [
    {
      name: 'Lindvallen',
      image: 'https://iwc2.wowza.com/websnap/skistar/salen_lindvallen.jpg',
      location: 'Lindvallen'
    },
    {
      name: 'Högfjällshotellet',
      image: 'https://iwc2.wowza.com/websnap/skistar/salen_hogfjall.jpg',
      location: 'Högfjället'
    }
  ]
};

// Alternativa webcam-källor (YouTube live streams)
const LIVE_STREAMS = {
  trysil: [
    {
      name: 'Trysil Live',
      platform: 'youtube',
      url: 'https://www.youtube.com/watch?v=trysil-live'
    }
  ]
};

function getWebcams(resort = 'trysil') {
  return WEBCAMS[resort] || WEBCAMS.trysil;
}

function formatWebcamMessage(resort = 'trysil') {
  const cams = getWebcams(resort);
  
  let msg = `📷 **WEBBKAMEROR - ${resort.toUpperCase()}**\n\n`;
  
  cams.forEach((cam, i) => {
    msg += `${i + 1}. **${cam.name}** (${cam.location})\n`;
    msg += `   ${cam.image}\n\n`;
  });
  
  msg += `🔗 Alla kameror: https://www.skistar.com/sv/vara-skidorter/${resort}/vader-backar/webbkameror/`;
  
  return msg;
}

// CLI
if (require.main === module) {
  const resort = process.argv[2] || 'trysil';
  console.log(formatWebcamMessage(resort));
}

module.exports = { WEBCAMS, getWebcams, formatWebcamMessage };
