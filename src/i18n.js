// -----------------------------------------------------------------------------
// Every text the code produces, in the four languages of the Gladys interface.
// German says "du", Spanish "usted". The device has no user language: its
// names and the scene texts follow the `language` setting; the widget gets the
// language of the person looking at it.
// -----------------------------------------------------------------------------

/** Feature names, frozen by Gladys when the device is created. */
export const NAMES = {
  en: {
    device: (country) => `Calendar ${country}`,
    holiday_today: 'Holiday today',
    holiday_tomorrow: 'Holiday tomorrow',
    workday_today: 'Workday today',
    workday_tomorrow: 'Workday tomorrow',
    school_holiday_today: 'School holidays today',
    school_holiday_tomorrow: 'School holidays tomorrow',
    days_until_holiday: 'Days until next holiday',
    days_until_workday: 'Days until next workday',
    next_holiday: 'Next holiday',
    today: 'Today',
  },
  fr: {
    device: (country) => `Calendrier ${country}`,
    holiday_today: "Férié aujourd'hui",
    holiday_tomorrow: 'Férié demain',
    workday_today: "Jour ouvré aujourd'hui",
    workday_tomorrow: 'Jour ouvré demain',
    school_holiday_today: "Vacances scolaires aujourd'hui",
    school_holiday_tomorrow: 'Vacances scolaires demain',
    days_until_holiday: 'Jours avant le prochain férié',
    days_until_workday: 'Jours avant le prochain jour ouvré',
    next_holiday: 'Prochain jour férié',
    today: "Aujourd'hui",
  },
  de: {
    device: (country) => `Kalender ${country}`,
    holiday_today: 'Feiertag heute',
    holiday_tomorrow: 'Feiertag morgen',
    workday_today: 'Arbeitstag heute',
    workday_tomorrow: 'Arbeitstag morgen',
    school_holiday_today: 'Schulferien heute',
    school_holiday_tomorrow: 'Schulferien morgen',
    days_until_holiday: 'Tage bis zum nächsten Feiertag',
    days_until_workday: 'Tage bis zum nächsten Arbeitstag',
    next_holiday: 'Nächster Feiertag',
    today: 'Heute',
  },
  es: {
    device: (country) => `Calendario ${country}`,
    holiday_today: 'Festivo hoy',
    holiday_tomorrow: 'Festivo mañana',
    workday_today: 'Día laborable hoy',
    workday_tomorrow: 'Día laborable mañana',
    school_holiday_today: 'Vacaciones escolares hoy',
    school_holiday_tomorrow: 'Vacaciones escolares mañana',
    days_until_holiday: 'Días hasta el próximo festivo',
    days_until_workday: 'Días hasta el próximo día laborable',
    next_holiday: 'Próximo festivo',
    today: 'Hoy',
  },
};

/** The texts of the "Today" feature, of the scene outputs and of the added days. */
export const DAY_TEXT = {
  en: {
    workday: 'Workday',
    dayOff: 'Day off',
    extraDay: 'Day off',
    school: 'school holidays',
  },
  fr: {
    workday: 'Jour ouvré',
    dayOff: 'Jour de repos',
    extraDay: 'Jour chômé',
    school: 'vacances scolaires',
  },
  de: {
    workday: 'Arbeitstag',
    dayOff: 'Freier Tag',
    extraDay: 'Freier Tag',
    school: 'Schulferien',
  },
  es: {
    workday: 'Día laborable',
    dayOff: 'Día libre',
    extraDay: 'Día no laborable',
    school: 'vacaciones escolares',
  },
};

/** The dashboard widget. Tile values hold 12 characters, labels and badges 16 to 24. */
export const WIDGET_TEXT = {
  en: {
    today: 'Today',
    tomorrow: 'Tomorrow',
    school: 'School',
    holiday: 'Holiday',
    workday: 'Workday',
    dayOff: 'Day off',
    schoolOff: 'Holidays',
    schoolOn: 'Classes',
    unknown: '?',
    badgeToday: 'Today',
    badgeTomorrow: 'Tomorrow',
    badgeDays: (days) => `In ${days} days`,
    badgeOngoing: 'Ongoing',
    noHoliday: 'No holiday in the coming year.',
    noDevice: "Add the calendar device from the integration's Discover tab.",
    period: (first, last, resume) => `From ${first} to ${last}. Back to school on ${resume}.`,
    schoolPending: 'School holidays not read yet: data.education.gouv.fr unreachable.',
  },
  fr: {
    today: "Aujourd'hui",
    tomorrow: 'Demain',
    school: 'École',
    holiday: 'Férié',
    workday: 'Jour ouvré',
    dayOff: 'Repos',
    schoolOff: 'Vacances',
    schoolOn: 'Classe',
    unknown: '?',
    badgeToday: "Aujourd'hui",
    badgeTomorrow: 'Demain',
    badgeDays: (days) => `Dans ${days} jours`,
    badgeOngoing: 'En cours',
    noHoliday: "Aucun jour férié dans l'année qui vient.",
    noDevice: "Ajoutez l'appareil calendrier depuis l'onglet Découverte de l'intégration.",
    period: (first, last, resume) => `Du ${first} au ${last}. Rentrée le ${resume}.`,
    schoolPending: 'Vacances scolaires pas encore lues : data.education.gouv.fr injoignable.',
  },
  de: {
    today: 'Heute',
    tomorrow: 'Morgen',
    school: 'Schule',
    holiday: 'Feiertag',
    workday: 'Arbeitstag',
    dayOff: 'Frei',
    schoolOff: 'Ferien',
    schoolOn: 'Unterricht',
    unknown: '?',
    badgeToday: 'Heute',
    badgeTomorrow: 'Morgen',
    badgeDays: (days) => `In ${days} Tagen`,
    badgeOngoing: 'Läuft',
    noHoliday: 'Kein Feiertag im kommenden Jahr.',
    noDevice: 'Füge das Kalendergerät im Tab „Entdecken“ der Integration hinzu.',
    period: (first, last, resume) => `Von ${first} bis ${last}. Schulbeginn am ${resume}.`,
    schoolPending: 'Schulferien noch nicht gelesen: data.education.gouv.fr nicht erreichbar.',
  },
  es: {
    today: 'Hoy',
    tomorrow: 'Mañana',
    school: 'Escuela',
    holiday: 'Festivo',
    workday: 'Laborable',
    dayOff: 'Libre',
    schoolOff: 'Vacaciones',
    schoolOn: 'Clases',
    unknown: '?',
    badgeToday: 'Hoy',
    badgeTomorrow: 'Mañana',
    badgeDays: (days) => `En ${days} días`,
    badgeOngoing: 'En curso',
    noHoliday: 'Ningún festivo en el próximo año.',
    noDevice: 'Añada el dispositivo calendario desde la pestaña Descubrir de la integración.',
    period: (first, last, resume) => `Del ${first} al ${last}. Vuelta a clase el ${resume}.`,
    schoolPending: 'Vacaciones escolares aún no leídas: data.education.gouv.fr inaccesible.',
  },
};

/** Configuration problems, shown in the connection status and the check action. */
export const PROBLEM_TEXT = {
  en: {
    unknownCountry: (value) => `Unknown country "${value}": France is used.`,
    unknownSubdivision: (value) =>
      `Unknown subdivision "${value}": national holidays only. "Check the configuration" lists the codes.`,
    invalidDate: (value) => `Ignored in the added days: "${value}" (write 2026-05-15 or 12-24).`,
    schoolOutsideFrance: () =>
      'School holidays only exist for France and its overseas territories: option ignored.',
    schoolUnavailable: () =>
      'School holidays not read yet (data.education.gouv.fr unreachable): new try within 6 hours.',
  },
  fr: {
    unknownCountry: (value) => `Pays inconnu « ${value} » : la France est utilisée.`,
    unknownSubdivision: (value) =>
      `Subdivision inconnue « ${value} » : fériés nationaux seulement. « Vérifier la configuration » donne les codes.`,
    invalidDate: (value) =>
      `Ignoré dans les jours ajoutés : « ${value} » (écrire 2026-05-15 ou 12-24).`,
    schoolOutsideFrance: () =>
      "Les vacances scolaires n'existent que pour la France et l'outre-mer : option ignorée.",
    schoolUnavailable: () =>
      'Vacances scolaires pas encore lues (data.education.gouv.fr injoignable) : nouvel essai sous 6 heures.',
  },
  de: {
    unknownCountry: (value) => `Unbekanntes Land „${value}“: Frankreich wird verwendet.`,
    unknownSubdivision: (value) =>
      `Unbekannte Region „${value}“: nur nationale Feiertage. „Konfiguration prüfen“ zeigt die Codes.`,
    invalidDate: (value) =>
      `In den zusätzlichen Tagen ignoriert: „${value}“ (schreibe 2026-05-15 oder 12-24).`,
    schoolOutsideFrance: () =>
      'Schulferien gibt es nur für Frankreich und seine Überseegebiete: Option ignoriert.',
    schoolUnavailable: () =>
      'Schulferien noch nicht gelesen (data.education.gouv.fr nicht erreichbar): neuer Versuch innerhalb von 6 Stunden.',
  },
  es: {
    unknownCountry: (value) => `País desconocido «${value}»: se usa Francia.`,
    unknownSubdivision: (value) =>
      `Subdivisión desconocida «${value}»: solo festivos nacionales. «Comprobar la configuración» indica los códigos.`,
    invalidDate: (value) =>
      `Ignorado en los días añadidos: «${value}» (escriba 2026-05-15 o 12-24).`,
    schoolOutsideFrance: () =>
      'Las vacaciones escolares solo existen para Francia y sus territorios de ultramar: opción ignorada.',
    schoolUnavailable: () =>
      'Vacaciones escolares aún no leídas (data.education.gouv.fr inaccesible): nuevo intento en 6 horas.',
  },
};

/** The report of the "Check the configuration" action. */
export const CHECK_TEXT = {
  en: {
    calendar: (country, subdivision) =>
      `Calendar: ${country}${subdivision ? `, ${subdivision}` : ''}.`,
    types: (list) => `Counted as holidays: ${list}.`,
    next: (name, date, days) =>
      days === 0
        ? `Today is a holiday: ${name}.`
        : days === 1
          ? `Tomorrow is a holiday: ${name}.`
          : `Next holiday: ${name}, ${date} (in ${days} days).`,
    noHoliday: 'No holiday in the coming year with these settings.',
    workdays: (list) => `Workdays: ${list || 'none'}.`,
    codes: (country, list) => `Subdivision codes for ${country}: ${list}.`,
    noCodes: (country) => `${country} has no subdivision: leave the field empty.`,
    school: (zone, until, read) => `School holidays (${zone}): known until ${until}, read ${read}.`,
    schoolNext: (name, first, last) => `Next: ${name}, ${first} to ${last}.`,
    schoolOff: 'School holidays: not followed.',
    problems: 'To fix:',
    ok: 'Nothing to fix.',
  },
  fr: {
    calendar: (country, subdivision) =>
      `Calendrier : ${country}${subdivision ? `, ${subdivision}` : ''}.`,
    types: (list) => `Comptés comme fériés : ${list}.`,
    next: (name, date, days) =>
      days === 0
        ? `Aujourd'hui est férié : ${name}.`
        : days === 1
          ? `Demain est férié : ${name}.`
          : `Prochain férié : ${name}, ${date} (dans ${days} jours).`,
    noHoliday: "Aucun jour férié dans l'année qui vient avec ces réglages.",
    workdays: (list) => `Jours travaillés : ${list || 'aucun'}.`,
    codes: (country, list) => `Codes de subdivision pour ${country} : ${list}.`,
    noCodes: (country) => `${country} n'a pas de subdivision : laissez le champ vide.`,
    school: (zone, until, read) =>
      `Vacances scolaires (${zone}) : connues jusqu'au ${until}, lues le ${read}.`,
    schoolNext: (name, first, last) => `Prochaines : ${name}, du ${first} au ${last}.`,
    schoolOff: 'Vacances scolaires : non suivies.',
    problems: 'À corriger :',
    ok: 'Rien à corriger.',
  },
  de: {
    calendar: (country, subdivision) =>
      `Kalender: ${country}${subdivision ? `, ${subdivision}` : ''}.`,
    types: (list) => `Als Feiertag gezählt: ${list}.`,
    next: (name, date, days) =>
      days === 0
        ? `Heute ist Feiertag: ${name}.`
        : days === 1
          ? `Morgen ist Feiertag: ${name}.`
          : `Nächster Feiertag: ${name}, ${date} (in ${days} Tagen).`,
    noHoliday: 'Mit diesen Einstellungen kein Feiertag im kommenden Jahr.',
    workdays: (list) => `Arbeitstage: ${list || 'keine'}.`,
    codes: (country, list) => `Regionscodes für ${country}: ${list}.`,
    noCodes: (country) => `${country} hat keine Regionen: Lass das Feld leer.`,
    school: (zone, until, read) =>
      `Schulferien (${zone}): bekannt bis ${until}, gelesen am ${read}.`,
    schoolNext: (name, first, last) => `Nächste: ${name}, ${first} bis ${last}.`,
    schoolOff: 'Schulferien: nicht verfolgt.',
    problems: 'Zu korrigieren:',
    ok: 'Nichts zu korrigieren.',
  },
  es: {
    calendar: (country, subdivision) =>
      `Calendario: ${country}${subdivision ? `, ${subdivision}` : ''}.`,
    types: (list) => `Contados como festivos: ${list}.`,
    next: (name, date, days) =>
      days === 0
        ? `Hoy es festivo: ${name}.`
        : days === 1
          ? `Mañana es festivo: ${name}.`
          : `Próximo festivo: ${name}, ${date} (en ${days} días).`,
    noHoliday: 'Ningún festivo en el próximo año con estos ajustes.',
    workdays: (list) => `Días laborables: ${list || 'ninguno'}.`,
    codes: (country, list) => `Códigos de subdivisión para ${country}: ${list}.`,
    noCodes: (country) => `${country} no tiene subdivisiones: deje el campo vacío.`,
    school: (zone, until, read) =>
      `Vacaciones escolares (${zone}): conocidas hasta el ${until}, leídas el ${read}.`,
    schoolNext: (name, first, last) => `Próximas: ${name}, del ${first} al ${last}.`,
    schoolOff: 'Vacaciones escolares: no seguidas.',
    problems: 'Por corregir:',
    ok: 'Nada que corregir.',
  },
};

/** Labels of the holiday types and weekdays, for the check report. */
export const TYPE_TEXT = {
  en: {
    public: 'public',
    bank: 'bank',
    school: 'school',
    optional: 'optional',
    observance: 'observances',
  },
  fr: {
    public: 'publics',
    bank: 'bancaires',
    school: 'scolaires',
    optional: 'facultatifs',
    observance: 'célébrations',
  },
  de: {
    public: 'gesetzliche',
    bank: 'Bankfeiertage',
    school: 'schulfreie Tage',
    optional: 'optionale',
    observance: 'Gedenktage',
  },
  es: {
    public: 'oficiales',
    bank: 'bancarios',
    school: 'escolares',
    optional: 'opcionales',
    observance: 'conmemoraciones',
  },
};

export const INIT_FAILED = {
  en: 'Initialization failed, check the integration logs.',
  fr: "L'initialisation a échoué, consultez les logs de l'intégration.",
  de: 'Initialisierung fehlgeschlagen, sieh dir die Protokolle der Integration an.',
  es: 'La inicialización ha fallado, consulte los registros de la integración.',
};

/** One text per language from a table of functions or strings. */
export function inEveryLanguage(table, pick) {
  return Object.fromEntries(
    Object.entries(table).map(([language, text]) => [language, pick(text)]),
  );
}
