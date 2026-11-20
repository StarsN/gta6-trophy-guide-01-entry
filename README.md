# gta6-trophy-guide-01-entry

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/StarsN/gta6-trophy-guide-01-entry/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/StarsN/gta6-trophy-guide-01-entry/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

**Leonida Platinum** — an offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI. Every trophy carries its official name, description and grade, a guide written for this entry in our own words with its sources named beside it, and a place in a five-stage roadmap to the platinum. Five trophies whose official descriptions name a single moment, place or choice are flagged missable, with the reasoning quoted. The tracker ticks trophies off in the browser (localStorage), filters by kind and grade, searches, hides story trophies behind a spoiler shield until they are earned, and exports and imports your progress as a file. The PS5 list has no online trophies — the guide says so rather than pretending otherwise. Static files only: it opens in desktop Chrome with the network off and loads nothing from outside `app/`. The look is original; no Rockstar artwork is used.

## Run it

```sh
node serve.ts            # serves the guide at http://localhost:8080
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # hand-in: writes app/, screenshots/ and dossier.json to out/
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=vvry49c9&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
