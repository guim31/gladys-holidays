# Holidays & Workdays for Gladys Assistant

An external integration for [Gladys Assistant](https://gladysassistant.com) that tells your scenes
whether today and tomorrow are **public holidays**, **workdays** or days of the **French school
holidays**: the alarm clock, the heating and the shutters no longer behave the same on a holiday, at the
weekend or during the holidays.

It brings to Gladys what the Workday and Holiday integrations do in Home Assistant, plus the French school
holidays by zone.

> Tested with its automated test suite (calendars of several countries and years, midnight and daylight
> saving time changes, recorded answers of the school-holiday API), not yet on many real Gladys
> instances: feedback welcome in the issues or on the Gladys forum.

## Features

- **Public holidays of about 200 countries** and their subdivisions (Alsace-Moselle, German states,
  Swiss cantons, Canadian provinces, US states…), computed **offline** with
  [date-holidays](https://github.com/commenthol/date-holidays): no account, no API key, no network.
- **Workdays**: the days of the week you choose, minus the holidays; extra days off (bridges, company
  closures) and holidays you work (the French _journée de solidarité_) by date, day of the year or name.
- **French school holidays** (optional): zones A, B, C, Corsica and five overseas zones, read once a
  day from the open data of the Education ministry, cached in `/data`, offline afterwards.
- **A calendar device** for the dashboard and, above all, scene conditions: holiday today / tomorrow,
  workday today / tomorrow, school holidays today / tomorrow, days until the next holiday and the next
  workday, name of the next holiday, and a "Today" summary. Everything switches at midnight in the
  time zone of Gladys.
- **Scene triggers**, each at the hour the scene chooses: _Holiday_, _Day before a holiday_ (with the
  number of days off in a row), _School holidays start_, _Last day of the school holidays_.
- **Scene action** _Check a date_: workday, holiday and school-holiday answers for today, tomorrow or
  any day of the coming year, usable in a "Condition on variables".
- **Dashboard widget** _Upcoming holidays_: today, tomorrow and the next holidays (and school holidays)
  with the days left.
- Every text in English, French, German and Spanish.

## Requirements

- Gladys Assistant **5.1.0** or later.
- Internet access only for the French school holidays (once a day, `data.education.gouv.fr`).

## Installation

1. In Gladys, open **Integrations → Install from GitHub** and enter
   `https://github.com/guim31/gladys-holidays`.
2. In the **Configuration** tab, choose the country (and a subdivision if your region has holidays of
   its own), your workdays, and a school-holiday zone if you want them. Save.
3. In the **Discover** tab, add the calendar device.

The full user documentation is in [English](docs/en.md), [French](docs/fr.md), [German](docs/de.md)
and [Spanish](docs/es.md).

## How it works

- Holidays are calendar days computed by date-holidays per year and language, then the user's extra days
  and exceptions are applied. A day starts at midnight in the time zone Gladys gives the container
  (`TZ`); a clock ticks every minute, republishes every state once a day (Gladys flags a value older
  than 48 hours as outdated) and fires the scene triggers of each new hour.
- The device is published with `should_poll: false`: nothing changes faster than once a day.
- Scene triggers carry the hour as a filter (an equality, the only comparison scene filters offer): the
  scene author picks the hour, the integration fires each trigger once an hour on the days concerned.
- School holidays come from the dataset
  [`fr-en-calendrier-scolaire`](https://data.education.gouv.fr/explore/dataset/fr-en-calendrier-scolaire/):
  one request per day at most (six hours between two tries after a failure), grouped by period, pupils'
  rows only. The end date published is the day classes resume, except for a one-day period; an open
  summer ("Début des Vacances d'Été") ends what the data covers. Beyond it, nothing is published rather
  than guessed.

## Limitations

- Holidays decided late by a government reach the integration with a date-holidays update; the
  **Extra days off** field covers the meantime. Lunar holidays can differ by a day from the official
  announcement.
- One country per installation.
- French school holidays: pupils only; Nouvelle-Calédonie, Polynésie française and Wallis-et-Futuna are
  not offered (their rows do not follow the conventions of the others), nor the days of a part of a zone.
- Gladys shows a "Prefer local connection" switch because the integration declares both transports
  (local holidays, cloud school holidays): it has no effect.

## Development

Node.js 22+, ESM, no build step. Runtime dependencies:
[`@gladysassistant/integration-sdk`](https://github.com/GladysAssistant/integration-sdk-js) and
[`date-holidays`](https://github.com/commenthol/date-holidays).

```bash
npm install
npm test              # node --test, against the SDK's fake Gladys; no network
npm run lint
npm run format:check
npx -y github:GladysAssistant/integration-store --skip-image-check .   # store validator
node scripts/countries.mjs   # regenerates the country options of the manifest
```

```
index.js              SDK wiring (src/app.js registers the handlers)
src/app.js            every SDK handler -> the service, "Check the configuration"
src/service.js        the clock: states, midnight, scene triggers, status
src/holidays.js       date-holidays -> calendar days, workdays, extra days, exceptions
src/school.js         French school holidays: request, parsing, daily cache
src/device.js         the calendar device and its states
src/scenes.js         "Check a date" scene action
src/widgets.js        "Upcoming holidays" dashboard widget
src/i18n.js           every text of the code, in four languages
src/dates.js          calendar dates as strings, time zones
src/config.js         DEFAULT_CONFIG (mirrors the manifest) + normalization
src/store.js          JSON files in /data
test/fixtures/        Gladys feature table, recorded answers of data.education.gouv.fr
```

To run it outside Gladys:

```bash
GLADYS_HOST_API_URL="http://localhost:1443" \
GLADYS_INTEGRATION_TOKEN="<token>" \
GLADYS_INTEGRATION_SELECTOR="holidays" \
HOLIDAYS_DATA_DIR=./data \
TZ=Europe/Paris \
npm start
```

Releases are made by the **Release** workflow (Actions → Release); never edit the versions by hand. See
[`CLAUDE.md`](CLAUDE.md) for the project rules.

## Credits

- [date-holidays](https://github.com/commenthol/date-holidays) by commenthol and contributors (code ISC,
  holiday data CC BY 3.0): every holiday of every country.
- [Calendrier scolaire](https://data.education.gouv.fr/explore/dataset/fr-en-calendrier-scolaire/),
  French Education ministry (Licence Ouverte 2.0): the school holidays; the test fixtures in
  `test/fixtures/education/` are answers of its API recorded on 2026-10-12.
- Home Assistant's [Workday](https://www.home-assistant.io/integrations/workday/) and
  [Holiday](https://www.home-assistant.io/integrations/holiday/) integrations (Apache-2.0): the
  workday rules (days of the week, added and removed days).

## Disclaimer

This project is not affiliated with, endorsed or sponsored by the French Education ministry, the
date-holidays project or Home Assistant.

## License

Apache-2.0
