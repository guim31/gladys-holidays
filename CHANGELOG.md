# Changelog

All notable changes to this integration are documented in this file. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
uses [semantic versioning](https://semver.org/).

Describe each change under `## [Unreleased]` as you make it. The Release
workflow moves that section under the version it ships, and the section becomes
the notes of the version's GitHub Release.

## [Unreleased]

### Changed

- Quieter logs: the daily read of the school calendar and the clock no longer write anything in normal
  operation, and a problem that repeats (Gladys unreachable, school calendar unavailable, `/data` not
  writable) is written once, with one line when it is over. `LOG_LEVEL=debug` shows the details.
- Dependencies updated.

## [1.0.0] - 2026-10-12

### Added

- A calendar device per country, for the dashboard and scene conditions: holiday today and tomorrow,
  workday today and tomorrow, French school holidays today and tomorrow, days until the next holiday
  and the next workday, name of the next holiday, and a "Today" summary. Values switch at midnight in
  the time zone of Gladys and are sent again every day.
- Public holidays of about 200 countries and their subdivisions (Alsace-Moselle, German states, Swiss
  cantons, Canadian provinces, US states…), computed offline with date-holidays; public holidays only
  by default, bank holidays, local school days off, optional days and observances on demand.
- Workdays: the days of the week to choose, extra days off (bridges, closures) and holidays worked (by
  date, day of the year or name in any language, such as Whit Monday for the solidarity day).
- French school holidays of zones A, B, C, Corsica, Guadeloupe, French Guiana, Martinique, Mayotte,
  Réunion and Saint Pierre and Miquelon, read once a day from data.education.gouv.fr and kept for
  offline use.
- Scene triggers at the hour of your choice: Holiday, Day before a holiday, School holidays start,
  Last day of the school holidays, with the names and dates as variables.
- Scene action "Check a date": workday, holiday and school holidays for today, tomorrow or any day of
  the coming year.
- Dashboard widget "Upcoming holidays".
- "Check the configuration" button: the calendar in use, the next holiday, the school holidays read,
  what to fix and the subdivision codes of the country.
- Texts and documentation in English, French, German and Spanish; device and feature names in
  French by default.

[Unreleased]: https://github.com/guim31/gladys-holidays/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/guim31/gladys-holidays/releases/tag/v1.0.0
