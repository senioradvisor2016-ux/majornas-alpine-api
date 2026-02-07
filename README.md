# 🎿 MAJORA ALPINE - På Vift i Lift 🚡

Real-time ski dashboard för Trysil med AI-drivna rekommendationer.

## 🚀 Snabbstart

### Starta servern
```bash
cd ~/clawd/majora-alpine
./start.sh
```

### Öppna i webbläsaren
```
http://localhost:3847
```

Eller från mobilen (samma WiFi):
```
http://<mac-mini-ip>:3847
```

## 📱 Telegram-kommandon

Skriv till mig (Clawdbot) i Telegram:

- `trysil` - Snabb statusöversikt
- `trysil liftar` - Alla liftar med status
- `trysil stängda` - Bara stängda liftar
- `trysil backar` - Backar per svårighetsgrad
- `trysil powder` - Powder alert status
- `trysil ai <fråga>` - Fråga AI om t.ex. köer, barnbackar

## 🤖 AI-funktioner

Dashboarden har inbyggd AI som kan svara på:
- Vilken lift har kortast kö?
- Bästa backen för barn?
- Var ska jag äta lunch?
- Hur blir vädret?

## 📊 API

```
GET /api/status - Full Trysil-data (JSON)
GET /api/ai?q=<fråga> - AI-svar
```

## ⏰ Automatiska notiser

- **07:00** - Morgonrapport till Telegram
- **Var 2h** - Powder alert-koll (notis vid >10cm nysnö)

## 📁 Filer

```
majora-alpine/
├── index.html      # Web dashboard
├── server.js       # HTTP server + API
├── trysil.js       # CLI-verktyg
├── powder-check.js # Powder alert checker
├── start.sh        # Startscript
└── README.md       # Denna fil
```

## 🛠️ Utveckling

Data kommer från [fnugg.no](https://fnugg.no) API.
Uppdateras automatiskt var 5:e minut.

---

Made with ❄️ by Clawdbot för Peter
