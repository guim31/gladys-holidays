# Holidays & Workdays (Feiertage und Arbeitstage)

Ist heute ein Feiertag, ein Arbeitstag oder ein Tag der Schulferien? Diese Integration beantwortet es für
deine Szenen: Wecker, Heizung und Rollläden verhalten sich an einem Feiertag, am Wochenende oder in den
Ferien nicht mehr gleich.

- **Feiertage von rund 200 Ländern** und ihren Regionen (Bundesländer, Schweizer Kantone, Elsass-Mosel,
  kanadische Provinzen, US-Bundesstaaten…), **offline** auf deinem Gladys berechnet: kein Konto, kein
  Netzwerk.
- **Arbeitstage**: die Wochentage, an denen du arbeitest, ohne die Feiertage, plus deine Brückentage und
  freien Tage.
- **Französische Schulferien** deiner Zone (optional), aus den offenen Daten des französischen
  Bildungsministeriums.

> Mit der automatischen Testsuite geprüft, aber noch nicht auf vielen echten Gladys-Installationen:
> Rückmeldungen sind im Gladys-Forum oder in den GitHub-Issues willkommen.

## Was du brauchst

- Gladys Assistant 5.1.0 oder neuer.
- Sonst nichts: kein Konto, kein API-Schlüssel, keine Hardware. Nur die französischen Schulferien brauchen
  einmal am Tag einen Internetzugang.

## Konfiguration

Installiere die Integration (**Integrationen → Von GitHub installieren**, Adresse
`https://github.com/guim31/gladys-holidays`), öffne den Tab **Konfiguration**, fülle die Felder unten aus
und speichere. Öffne dann den Tab **Entdecken** und füge das Kalendergerät hinzu.

### Land und Region

- **Land**: der Kalender, dem gefolgt wird. Französischsprachige Länder stehen vorne, dann die anderen in
  alphabetischer Reihenfolge (auf Englisch).
- **Region**: optional, für eine Region mit eigenen Feiertagen. Beispiele: `BY` für Bayern, `BE` für
  Berlin, `BW` für Baden-Württemberg, `ZH` für den Kanton Zürich, `67` für das Elsass (Karfreitag und 26. Dezember), `QC` für Québec. Manche Regionen haben Unterregionen: `BY-KATH` für die überwiegend
  katholischen Gemeinden Bayerns (15. August), `BY-A` für Augsburg. Der Button **Konfiguration prüfen**
  zeigt die Codes des Landes.
- **Als Feiertag zählende Tage**: standardmäßig nur gesetzliche Feiertage. Du kannst Bankfeiertage
  (Heiligabend ab 14 Uhr), lokale schulfreie Tage, optionale Tage und Gedenktage (Muttertag,
  Pfingstsonntag…) hinzufügen.

### Arbeitstage, zusätzliche freie Tage und Feiertage, an denen du arbeitest

- **Arbeitstage**: standardmäßig Montag bis Freitag. Ein Arbeitstag ist einer dieser Tage, der kein
  Feiertag ist.
- **Zusätzliche freie Tage**: Brückentage oder Betriebsferien, als Feiertage gezählt, durch Kommas
  getrennt: `2026-05-15` für ein Datum, `12-24` für jedes Jahr, mit optionalem Namen nach `=`:
  `2026-05-15=Brückentag, 12-31=Silvester`.
- **Feiertage, an denen du arbeitest**: Feiertage, die Arbeitstage bleiben, durch Kommas getrennt. Ein
  Name in einer beliebigen Sprache (`Pfingstmontag`, egal an welchem Datum), ein Datum (`2027-05-17`) oder
  ein Tag jedes Jahres (`12-26`).

### Französische Schulferien

Für Frankreich und seine Überseegebiete (Länder Frankreich, Guadeloupe, Französisch-Guayana, Martinique,
Réunion, Mayotte, Saint-Pierre und Miquelon, St. Barthélemy, St. Martin). Wähle deine **Zone**: A, B, C,
Korsika, Guadeloupe, Französisch-Guayana, Martinique, Mayotte, Réunion oder Saint-Pierre und Miquelon. Die
Ferien der Schülerinnen und Schüler werden einmal am Tag von data.education.gouv.fr gelesen und dann
aufbewahrt: Ein Ausfall des Internets ändert nichts an den bereits bekannten Tagen. Lass **Keine** stehen,
damit die Integration vollständig offline bleibt.

### Sprache

Standardmäßig Französisch. Sprache des Geräte- und Funktionsnamens (beim Hinzufügen des Geräts festgelegt: ändere sie vorher), der
Feiertagsnamen, wenn die Bibliothek sie in dieser Sprache hat (sonst die Amtssprache des Landes), und der
Texte für Szenen. Das Dashboard-Widget folgt der Sprache jeder Person.

## Das Kalendergerät

Ein Gerät pro Land, zum Beispiel **Kalender Deutschland**. Seine Funktionen lassen sich im Dashboard lesen
und vor allem in den Bedingungen von Szenen verwenden:

| Funktion                         | Wert                                                               |
| -------------------------------- | ------------------------------------------------------------------ |
| Feiertag heute                   | On / Off                                                           |
| Feiertag morgen                  | On / Off                                                           |
| Arbeitstag heute                 | On / Off                                                           |
| Arbeitstag morgen                | On / Off                                                           |
| Schulferien heute                | On / Off (nur mit einer Zone)                                      |
| Schulferien morgen               | On / Off (nur mit einer Zone)                                      |
| Tage bis zum nächsten Feiertag   | 0 an einem Feiertag                                                |
| Tage bis zum nächsten Arbeitstag | 0 an einem Arbeitstag, 3 am Freitagabend eines langen Wochenendes… |
| Nächster Feiertag                | Name des heutigen Feiertags oder des nächsten                      |
| Heute                            | „Arbeitstag“, „Freier Tag“ oder der Name des Feiertags, mit Ferien |

Alles wechselt um **Mitternacht, in der Zeitzone von Gladys** (Sommer- und Winterzeit inbegriffen), und
jeder Wert wird jeden Tag neu gesendet, damit Gladys ihn nie als veraltet anzeigt. Ein Schulferienwert
jenseits dessen, was das Ministerium veröffentlicht hat, wird nicht gesendet statt geraten.

Wählst du später eine Ferienzone, kommen zwei Funktionen hinzu: Klicke im Tab Entdecken beim Gerät auf
**Aktualisieren**.

## Dashboard-Widget

**Nächste Feiertage** (unter **Dashboard bearbeiten**, Widgets der Integrationen): heute und morgen
(Arbeitstag, Feiertag, frei), die Schule heute, wenn eine Zone gewählt ist, dann die nächsten Feiertage und
Schulferien mit den verbleibenden Tagen. Tippe auf Schulferien, um ihre Daten und den Schulbeginn zu sehen.
Einstellungen: die Zahl der angezeigten Termine (1 bis 8) und ob die Schulferien angezeigt werden.

## Szenen-Auslöser

Jeder Auslöser hat eine **Stunde** (0 bis 23): Die Szene läuft zu dieser Uhrzeit des betreffenden Tages,
einmal. Die Variablen lassen sich in die Texte der folgenden Aktionen einfügen (zum Beispiel in eine
Nachricht).

| Auslöser                    | Wann                                                   | Variablen                                       |
| --------------------------- | ------------------------------------------------------ | ----------------------------------------------- |
| Feiertag                    | An jedem Feiertag (0: wenn er beginnt, um Mitternacht) | Name des Feiertags, Datum                       |
| Vortag eines Feiertags      | Am Tag vor jedem Feiertag                              | Name des Feiertags, Datum, freie Tage am Stück  |
| Beginn der Schulferien      | Am ersten Tag der Schulferien deiner Zone              | Name der Ferien, letzter Ferientag, Schulbeginn |
| Letzter Tag der Schulferien | Am letzten Ferientag, dem Tag vor Schulbeginn          | Name der Ferien, letzter Ferientag, Schulbeginn |

Das Gerät sagt schon, **ob** ein Tag ein Feiertag ist; diese Auslöser fügen den **Zeitpunkt** und die
**Namen** hinzu: „morgen ist Christi Himmelfahrt, 4 freie Tage am Stück“.

## Szenen-Aktion „Datum prüfen“

Liefert die Antworten für heute (0), morgen (1) oder einen beliebigen Tag des kommenden Jahres (bis 366):
**Arbeitstag**, **Feiertag** und **Schulferien** (1 = ja, 0 = nein, -1 = unbekannt: keine Zone oder
jenseits des veröffentlichten Kalenders), den **Namen des Feiertags**, den **Namen der Schulferien** und
das **Datum**. Lass ein **Nur fortsetzen, wenn** auf eines dieser Ergebnisse folgen, zum Beispiel
„Arbeitstag = 1“.

## Szenen-Beispiele

- **Wecker nur an Arbeitstagen**: zeitabhängiger Auslöser um 6:45, Nur fortsetzen, wenn „Kalender
  Deutschland: Arbeitstag heute = On“, dann das Schlafzimmerlicht einschalten und die Rollläden öffnen.
- **Heizung für ein langes Wochenende**: Auslöser Vortag eines Feiertags um 18:00, dann die Nachricht
  „Morgen ist {{Name des Feiertags}}: {{freie Tage am Stück}} freie Tage“ senden und das Thermostat in den
  Wochenendmodus schalten.
- **Schulbeginn**: Auslöser Letzter Tag der Schulferien um 19:00, dann die Nachricht „Schulbeginn am
  {{Schulbeginn}}: Denk an den Wecker“.
- **Vorausplanen**: jeden Freitag um 18:00 die Aktion Datum prüfen mit 3 Tagen, Nur fortsetzen, wenn
  „Arbeitstag = 0“, dann die Heizung auch für den Montag absenken.

## Bei Problemen

- **Kein Gerät im Tab Entdecken**: Speichere zuerst die Konfiguration und klicke dann auf **Scannen**.
- **Ein regionaler Feiertag fehlt**: Prüfe die Region mit **Konfiguration prüfen**; der Status der
  Integration meldet einen unbekannten Code (bis dahin gelten die nationalen Feiertage).
- **Die Schulferien bleiben leer**: Die Integration liest data.education.gouv.fr höchstens einmal am Tag
  und versucht es sechs Stunden nach einem Fehler erneut; der Status der Integration sagt, wenn noch nichts
  gelesen werden konnte. Gefragt ist deine Zone, nicht deine Académie: Bordeaux liegt in Zone A, Paris in
  Zone C.
- **Die Funktionsnamen sind in der falschen Sprache**: Die Namen werden beim Hinzufügen des Geräts festgelegt.
  Lösche das Gerät, ändere die Sprache und füge es erneut hinzu (sein Verlauf geht verloren).
- **Ein Auslöser löst 24-mal aus**: Stelle seine **Stunde** ein; der Szenen-Editor verlangt sie.
- **Logs**: Die Integration schreibt nur ihren Start, die Probleme und deren Ende (ein Problem, das sich
  wiederholt, steht nur einmal da). Für jeden einzelnen Schritt braucht der Container die
  Umgebungsvariable `LOG_LEVEL=debug`, die Gladys nicht setzt: nützlich, wenn du das Image für einen Test
  selbst startest.

## Grenzen

- Die Feiertage stammen aus der Bibliothek date-holidays: Ein spät von einer Regierung beschlossener
  Feiertag (ein außerordentlicher freier Tag) kommt mit einem Update der Integration; trage ihn bis dahin
  unter **Zusätzliche freie Tage** ein.
- Islamische und andere Mondfeiertage werden berechnet und können um einen Tag von der offiziellen
  Ankündigung abweichen.
- Ein Land pro Installation: ein zweiter Kalender (für Grenzgänger) wird nicht unterstützt; seine
  Feiertage lassen sich unter **Zusätzliche freie Tage** eintragen.
- Französische Schulferien: nur der Kalender der Schülerinnen und Schüler (nicht der Lehrkräfte);
  Neukaledonien, Französisch-Polynesien und Wallis und Futuna werden nicht angeboten, und die Tage eines
  Teils einer Zone (St. Martin in der Zone Guadeloupe) werden nicht berücksichtigt.
- Nach einem Neustart wird die gerade begonnene Auslöser-Stunde noch ausgelöst, wenn die Integration
  innerhalb von 10 Minuten zurück ist; später wird sie übersprungen, statt zur falschen Zeit auszulösen.

## Danksagung

Feiertage: [date-holidays](https://github.com/commenthol/date-holidays) von commenthol (ISC-Lizenz, Daten
unter CC BY 3.0). Schulferien: [Calendrier scolaire](https://data.education.gouv.fr/explore/dataset/fr-en-calendrier-scolaire/),
französisches Bildungsministerium (Licence Ouverte 2.0). Inspiriert von den Integrationen Workday und
Holiday von Home Assistant. Nicht mit dem französischen Bildungsministerium oder Home Assistant verbunden.
