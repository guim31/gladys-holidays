# CLAUDE.md

Project rules for coding assistants (Claude Code reads this file) and for human
contributors.

## What this is

A Gladys Assistant **external integration**: a Node.js service (Node 22+, ESM,
no build step) that runs in its own sandboxed Docker container and talks to
Gladys through
[`@gladysassistant/integration-sdk`](https://github.com/GladysAssistant/integration-sdk-js).
Its other runtime dependency is
[`date-holidays`](https://github.com/commenthol/date-holidays), which computes
the holidays offline. It started from the official JavaScript template.

## Commands

```bash
npm install
npm test                                  # node --test, the built-in runner
node --test test/holidays.test.js         # one file
node --test --test-name-pattern "Bavaria" # tests whose name matches
npm run lint                              # ESLint
npm run format:check                      # Prettier, as the CI runs it
npm run format                            # Prettier, fix in place
npx -y github:GladysAssistant/integration-store --skip-image-check .   # store admission checks
node scripts/countries.mjs                # country options of the manifest, from date-holidays
```

The CI (`.github/workflows/ci.yml`) runs `format:check`, `lint` and `test` on
Node 22 and 24, and builds the Docker image: run the three commands before
pushing.

## Architecture

```
index.js                          SDK wiring only: src/app.js registers the handlers before connect()
src/app.js                        every SDK handler -> the service; "Check the configuration" report
src/service.js                    the clock (minute ticks): states at midnight, scene triggers per hour, status
src/holidays.js                   date-holidays -> calendar days; workdays, extra days, holidays worked
src/school.js                     French school holidays: API request, parsing, daily cache in /data
src/device.js                     the calendar device (one per country) and its states
src/scenes.js                     scene action handlers (manifest `scene_actions`)
src/widgets.js                    dashboard widget handlers (manifest `widgets`)
src/i18n.js                       every text of the code, en/fr/de/es
src/dates.js                      'YYYY-MM-DD' arithmetic, local date and hour in a time zone
src/config.js                     DEFAULT_CONFIG (mirrors the manifest defaults) + normalization
src/store.js                      JSON files in /data (HOLIDAYS_DATA_DIR locally)
scripts/countries.mjs             prints the country options of the manifest
gladys-assistant-integration.json manifest: name, config_schema, actions, image...
docs/{en,fr,de,es}.md             user documentation, re-hosted by Gladys (en and fr mandatory)
test/                             node --test, against the SDK's fake Gladys (integration-sdk/testing)
test/fixtures/education/          answers of data.education.gouv.fr recorded on 2026-10-12
.github/scripts/release.mjs       release helpers (manifest bump, changelog), tested in test/
```

## Rules

- **External ids are forever.** Build them with
  `gladys.externalIds(type, platformId)`, `platformId` being the unique id the
  platform gives the device (serial, cloud id, MAC), never a label. Gladys keys
  devices, their history, scenes and dashboards on them: changing one creates a
  new device and orphans the old one. The same goes for every key users store:
  manifest `config_schema`, `actions`, widget and scene keys, feature keys.
- **The container rootfs is read-only.** Write only under `/data`, the one
  writable volume. Never log tokens, passwords or API keys.
- **Versions belong to the Release workflow** (Actions → Release). Never edit
  `version` in `package.json` or in the manifest, nor the `docker_image` tag,
  by hand — except on the README's hand-pushed tag path, which bumps all three
  together before tagging. `test/manifest.test.js` checks they agree.
- **Changelog.** Every user-visible change adds a line under `## [Unreleased]`
  in `CHANGELOG.md` (`### Added`, `Changed`, `Fixed`, `Removed`, `Security`).
  Never write a version heading: the Release workflow moves the section, and it
  becomes the notes of the GitHub Release.
- **Manifest.** Texts are multi-language objects `{ "en": ..., "fr": ... }`:
  `label`, `description` and `placeholder` alike, never a plain string. The
  catalog `description` holds 10 to 100 characters per language. A field the
  older cores do not know needs a higher `gladys_version` minimum
  (`categories`: 4.86.0; `widgets`, `scene_triggers`, `scene_actions`,
  `type: "provider"`: 5.1.0). `test/manifest.test.js` ties the manifest to the
  code (defaults, action, scene and widget handlers): change both sides
  together.
- **User-facing text** exists in English, French, German and Spanish: action
  messages, widget texts, feature names, manifest texts, and `docs/en.md`,
  `docs/fr.md`, `docs/de.md`, `docs/es.md` with the same sections, kept in
  sync. `test/i18n.test.js` checks it.
- **Style.** Prettier formats, ESLint catches mistakes. Comments explain why,
  in English. Tests never touch the network.

---

# Notes du mainteneur (guim31)

Ce qui suit complète les règles du template ci-dessus. Ce sont des faits vérifiés dans le code du
cœur Gladys ou payés sur les intégrations déjà publiées par guim31. Ils ne se lisent pas dans le
code de ce dépôt. Compléter ce fichier quand un nouveau piège est découvert.

## Travailler sur ce dépôt

- Mêmes étapes que la CI, dans le même ordre : `npm ci`, `npm run format:check`, `npm run lint`,
  `npm test`. Prettier contrôle **aussi le Markdown** : lancer `npm run format` après avoir
  modifié ce fichier, le README ou la documentation, sinon la CI tombe.
- Une session de code n'a **ni instance Gladys ni appareil réel**. La suite de tests, le lint et
  le validateur du store sont les seules vérifications possibles : le test réel se fait ailleurs.
  Le dire, plutôt que de conclure que « ça marche ».
- **Tout le code de démonstration du template disparaît** : station météo, prise, lampe, caméra,
  capteur de mouvement, `src/weather.js`, leurs tests, leurs entrées du manifeste et de la
  documentation. Il ne reste que ce que l'intégration fait vraiment.
- **Publier n'est jamais le travail d'une session de code** : ni Release, ni tag, ni topic, ni
  version modifiée à la main. L'orchestrateur s'en charge une fois la PR fusionnée. Les workflows
  sont ceux du template : ne pas les modifier.
- Le dépôt est **public** : aucun secret, aucune adresse ni détail d'infrastructure privée, ni
  ici, ni dans les tests, ni dans les captures.

## Pièges du cœur Gladys

**Appareils et fonctionnalités**

- **Polling** : le planificateur n'interroge un appareil que si `should_poll: true` **et**
  `poll_frequency` vaut une valeur de la liste fixe, **en millisecondes** (1000, 2000, 10000,
  15000, 30000, 60000). Le template publie `poll_frequency: 300` sans `should_poll` : c'est faux,
  le cœur répond 400 à la découverte. Pour une cadence hors liste, publier `should_poll: false` et
  pousser les états depuis le conteneur, en gardant un `onPoll` de repli.
- **`min` et `max` sont NOT NULL** dans `t_device_feature`, y compris pour `text/text` : sans eux,
  « Ajouter à Gladys » échoue en HTTP 422. Mettre 0/0, comme Zigbee2MQTT.
- Un état publié sur une fonctionnalité **pas encore ajoutée** dans Gladys reçoit un 200 puis est
  jeté (simple ligne de log) : republier les états dans `onDeviceCreated`.
- `level-sensor/decimal` n'existe pas côté serveur. `light-sensor/binary` n'a pas de libellé dans
  le front (pastille vide) : préférer `input/binary`. Un `text/text` reçoit `{ text }`, jamais
  vide, sinon l'état est ignoré.
- **Détecteur d'ouverture (`opening-sensor`) : 0 = ouvert, 1 = fermé** (`OPENING_SENSOR_STATE`), à
  l'inverse de l'intuition et des autres détecteurs (mouvement, fuite, fumée : 1 = détecté). Une
  porte ouverte publiée à 1 s'affiche « Fermé » et fausse scènes et historique. Le figer par un test.
- **Un `external_id` de fonctionnalité ne change jamais d'appareil** d'une version à l'autre. UniFi
  1.5.2 avait sorti les ports PoE dans un appareil dédié, la 1.6.0 les a remis dans la passerelle avec
  les mêmes identifiants : ceux qui avaient ajouté l'appareil dédié ne peuvent plus « Mettre à jour » la
  passerelle (409 `external_id must be unique`). Pour regrouper, garder l'appareil existant
  (`gladys.getDevices()`) ou changer d'identifiant.
- Les **noms de fonctionnalités sont figés à la création**. Et quand une fonctionnalité est seule
  de son type sur l'appareil, le tableau de bord affiche le libellé générique du type à la place
  du nom publié.
- **Aucune commande d'appareil ne permet un choix multiple** : un `text/select` n'a qu'un choix
  actif.
- Un changement de structure fait proposer « Mettre à jour » dans l'onglet Découverte
  (`structure_changed`). Un changement des seules `supported_options` ne le déclenche pas.
- **Jauge** : l'aiguille se place par `(value - min) / (max - min)` des bornes de la
  fonctionnalité. `gauge_min`/`gauge_max` ne pilotent que les couleurs, et le cœur n'applique
  jamais `min`/`max` en écriture : ce sont des bornes d'affichage. Une valeur signée exige des
  bornes symétriques.
- Le cœur plafonne à **300 états par minute** et réévalue les scènes à chaque état : ne publier
  que les changements.
- Une intégration `device` ne reçoit pas la langue de l'utilisateur, une action de scène non
  plus (un widget, si) : prévoir un champ de config `language` si des textes partent du
  conteneur. Le superviseur injecte `TZ`, le fuseau de Gladys. La sandbox est limitée à 256 Mo.

**Formulaires de configuration et actions**

- Les champs `number` sont rendus **sans `step`** : le navigateur n'accepte alors que `min + k`.
  Min et défaut **entiers** seulement ; une valeur décimale passe par un `select` ou par un
  `string` parsé (virgule acceptée).
- Un champ `secret` dans les `fields` d'une **action** est impossible à remplir, et une action
  n'applique **aucun `default`** tout en exigeant les champs `required` (422). Issues
  GladysAssistant/Gladys#3154 et #3155.

**Widgets, déclencheurs, actions de scène (SDK ≥ 0.14, Gladys ≥ 5.1)**

- **Cibler la dernière version publiée du cœur, pas `master`** : la spec de `master` décrit des
  fonctions non publiées. La dernière version publiée est la **5.2.0** (12/10/2026). Les boutons de
  widget qui ouvrent un formulaire (#3168) sont absents de la 5.1.4 : le bouton s'affiche et n'envoie
  rien. Vérifier par `git tag --contains` ou `git show v5.2.0:<chemin>`.

- Un réglage de widget ne propose en liste que les **appareils** de l'intégration
  (`source: "devices"`, seule source dynamique).
- Budget du cœur : **8 composants par widget, dont 2 textes au plus**, appliqué **avant** la
  résolution des références ; un contenu amputé reste en cache jusqu'au TTL. Appeler
  `requestWidgetRefresh` à la création d'un appareil. `validateWidgetContent` est exporté pour les
  tests, mais ne vérifie pas que les `external_id` liés existent : les croiser avec `buildDevice`.
- Une ligne de `status` exige un `value` (nombre ou texte ≤ 40).
- Le cœur **jette un bouton dont la clé d'action est déjà prise** : clés numérotées.
- Le vocabulaire des widgets n'a ni liste ni curseur, **par choix** du cœur. Seul un bouton
  `device_feature` numérique a un état actif natif.
- **En mode sombre, le style `primary` d'un bouton de widget ne se voit pas** (#3153) : signaler
  un choix courant par l'icône (`check-circle`), jamais par le style.
- Dans une grille `card-list`, la `date` s'affiche **à la place** du sous-titre.
- `onWidgetAction` fait recharger le widget dès la résolution, alors que `requestWidgetRefresh`
  est plafonné à un appel toutes les 10 s. Un toast d'action est tronqué à 200 caractères.
- Le cœur met le contenu d'un widget en cache par (réglages, langue, unités) : pré-localiser
  d'après `language` est correct.
- Les filtres de scène ne font qu'égalité et appartenance : un seuil reste le travail d'un capteur.
- **Les clés de widgets, de déclencheurs et d'actions sont figées une fois publiées.**
- `gladys_version` `>=5.1.0` dès qu'il y a widgets, déclencheurs ou actions de scène.

## Store

- Validateur officiel, depuis la racine : `npx -y github:GladysAssistant/integration-store .`
  (schéma, `description` **100 caractères au plus par langue**, documentation de 300 caractères
  au moins, image Docker, cover de **150 Ko au plus**). Il demande Node ≥ 24 mais tourne sous
  Node 22 avec un avertissement.
- L'indexeur lit le manifeste de la **dernière release**, pas celui de `main` : une correction du
  manifeste (catégorie, description…) n'atteint le store qu'avec une release.
- L'indexeur rejette **en silence** : la raison n'apparaît que dans `rejected.json`, à côté de
  `https://integration-store-storage.gladysassistant.com/index.json`.
- **Image de base** : `FROM public.ecr.aws/docker/library/node:…` (miroir officiel ECR Public, même
  empreinte) et non `node:…` de Docker Hub, qui refuse en 429 les pulls anonymes des runners GitHub
  dès qu'il y a plusieurs builds à la fois. Un échec 429 dans le job « Docker build » n'est pas un bug
  du code. Même parade dans `.github/workflows/build.yml` (posée par l'orchestrateur, ne pas la
  retirer) : QEMU et BuildKit tirés de `mirror.gcr.io`.
- La règle `data/` du `.gitignore` du template (pour le volume `/data`) exclut aussi `src/data/` :
  l'ancrer en `/data/`, dans `.prettierignore` aussi.

### Langues (depuis le 11/10/2026)

Tout texte montré à l'utilisateur existe en **`en`, `fr`, `de` et `es`** : manifeste, contenu des widgets, messages,
noms de fonctionnalités. L'allemand **tutoie** (« du »), l'espagnol **vouvoie** (« usted ») : décision de Guilhem,
appliquée à ses 21 intégrations. `test/i18n.test.js` doit échouer sur une langue manquante, un texte vide ou trop
long, et sur un « Sie »/« Ihr… » de politesse en allemand (y compris dans `docs/de.md` : « Sie » au sens de « ils »
est refusé aussi, tourner la phrase autrement). Le store publie `docs/en.md` et `docs/fr.md` (obligatoires) et aussi
`docs/de.md` et `docs/es.md` quand ils existent (`DOCS_OPTIONAL_LANGUAGES` d'integration-store) : les quatre docs
sont écrites, avec les mêmes sections.

## Pièges découverts sur cette intégration (Holidays & Workdays)

**Cœur Gladys (vérifié dans v5.2.0)**

- **« Condition sur variables » compare strictement** (`compare` : `===`), et la valeur saisie est
  enregistrée en nombre si elle en a l'air, sinon en texte. Une sortie d'action de scène de type
  `boolean` ne peut donc **jamais** être égale à ce que l'utilisateur tape : les oui/non sont des
  sorties `number` (1, 0, et -1 pour inconnu).
- Le libellé générique d'un type remplace le nom publié quand aucune autre fonctionnalité de
  l'appareil n'a **le même `type`** (`shouldDisplayDeviceName` du front compare le `type` seul, pas la
  catégorie). Un `text/text` seul s'affiche « Texte » : d'où deux `text/text` et deux
  `duration/integer` ici. `test/gladys-rules.test.js` le vérifie.
- Une valeur de plus de **48 h** s'affiche « Pas de valeur récente » : republier chaque jour même
  inchangé (`forgetPublishedStates()` puis `publishChangedStates`).
- Les filtres des déclencheurs ne font que l'égalité : pour « à l'heure choisie », le déclencheur
  porte un champ `hour` **`number` obligatoire** et l'intégration émet l'événement à chaque heure des
  jours concernés (une heure sautée au printemps ne part pas, l'heure répétée à l'automne part une
  fois). Un `select` de 24 heures coûtait 24 options × 4 langues par déclencheur dans le manifeste.
- Une `date` `'YYYY-MM-DD'` d'un élément de `card-list` s'affiche comme un jour du calendrier, sans
  décalage de fuseau (`CALENDAR_DATE_REGEX` du front, depuis 5.1.0) ; une date-heure s'affiche avec
  l'heure.
- Déclarer `transports: ["local", "cloud"]` fait afficher l'interrupteur « Préférer la connexion
  locale » sur la page de configuration, même quand il n'a pas de sens. Décision de Guilhem
  (12/10/2026) : `["local"]` seul ici, les vacances scolaires restant une option qui lit l'open data
  une fois par jour (dit dans la doc).
- Le type `calendar` (5.2.0) pousserait des événements dans le calendrier de Gladys, mais il est
  **par utilisateur** et exclut les appareils : les conditions de scène sur un appareil (usage
  principal) imposent le type `device`.

**Store**

- Le manifeste est **plafonné à 100 Ko** (`MANIFEST_MAX_BYTES` d'integration-store) : une liste de
  ~200 pays en quatre langues en prend déjà une trentaine. Garder les petits objets sur une ligne
  (Prettier les laisse ainsi s'ils tiennent dans la largeur), `test/manifest.test.js` vérifie < 80 Ko.

**date-holidays**

- Une **subdivision inconnue est ignorée en silence** (`init('FR', 'XX')` rend `true` et les fériés
  nationaux) : la valider par `getStates()` / `getRegions()` avant.
- Les entrées ont un `type` (`public`, `bank`, `school`, `optional`, `observance`) : le 15 août n'est
  `public` en Bavière que pour la région `BY-KATH` ; le 24 décembre allemand est `bank` à partir de
  14 h. Les fêtes lunaires durent parfois plusieurs jours (`end - start`) et commencent la veille au
  soir (`date` avec un décalage `-0600`) : prendre la partie date de `date`, puis la durée arrondie
  en jours.
- Le chargement complet des données pèse environ 90 Mo de RSS avec Node : correct pour 256 Mo.

**API du calendrier scolaire (`fr-en-calendrier-scolaire`)**

- Une ligne par académie : grouper (`group_by` sur toutes les colonnes lues).
- Les dates sont des **minuits de Paris** en UTC (22:00 ou 23:00Z), quelle que soit la zone : les
  convertir en date de Paris.
- `end_date` est le **jour de reprise**, sauf pour une période d'un jour où `start_date` =
  `end_date` (pont de l'Ascension 2027).
- L'été apparaît deux fois (`population` « Enseignants » et « Élèves ») ; la Guadeloupe a des lignes
  pour une partie de zone (Saint-Martin, Saint-Barthélemy) : ne garder que « - » et « Élèves ».
- Le dernier été publié peut être une ligne « Début des Vacances d'Été » d'un jour, fin inconnue :
  les données couvrent jusqu'à sa veille.
- Nouvelle-Calédonie, Wallis-et-Futuna et Polynésie ont d'autres conventions (fin un dimanche,
  marqueurs « Début des… », plusieurs populations) : non proposées.
- Un filtre `where` sur `annee_scolaire` (texte) avec `>=` est refusé ; sur `end_date`, une chaîne
  `"2026-10-05"` passe.
