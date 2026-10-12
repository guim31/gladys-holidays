# Holidays & Workdays (jours fériés et jours ouvrés)

Aujourd'hui est-il férié, ouvré ou en vacances scolaires ? Cette intégration répond pour vos scènes : le
réveil, le chauffage et les volets ne se comportent plus pareil un jour férié, un week-end ou pendant les
vacances.

- **Jours fériés d'environ 200 pays** et de leurs régions (Alsace-Moselle, Länder allemands, cantons
  suisses, provinces canadiennes, États américains…), calculés **hors ligne** sur votre Gladys : sans
  compte, sans réseau.
- **Jours ouvrés** : les jours de la semaine où vous travaillez, moins les fériés, plus vos ponts et jours
  chômés.
- **Vacances scolaires françaises** de votre zone (facultatif), tirées des données ouvertes de
  l'Éducation nationale.

> Testée par sa suite de tests automatiques, pas encore sur beaucoup de Gladys réelles : vos retours sont
> les bienvenus sur le forum Gladys ou dans les issues GitHub.

## Ce qu'il vous faut

- Gladys Assistant 5.1.0 ou plus récent.
- Rien d'autre : ni compte, ni clé d'API, ni matériel. Seules les vacances scolaires françaises demandent
  un accès à Internet, une fois par jour.

## Configuration

Installez l'intégration (**Intégrations → Installer depuis GitHub**, adresse
`https://github.com/guim31/gladys-holidays`), ouvrez son onglet **Configuration**, remplissez les champs
ci-dessous et enregistrez. Ouvrez ensuite l'onglet **Découverte** et ajoutez l'appareil calendrier.

### Pays et subdivision

- **Pays** : le calendrier à suivre. Les pays francophones viennent en premier, puis les autres par ordre
  alphabétique (en anglais).
- **Subdivision** : facultatif, pour une région qui a ses propres fériés. Exemples : `67`, `68` ou `57`
  pour l'Alsace-Moselle (Vendredi saint et 26 décembre), `BY` pour la Bavière, `BE` pour Berlin, `QC` pour
  le Québec, `VD` pour le canton de Vaud, `NY` pour New York. Certaines subdivisions ont des régions :
  `BY-KATH` pour les communes catholiques de Bavière (15 août), `BY-A` pour Augsbourg. Le bouton
  **Vérifier la configuration** liste les codes du pays.
- **Jours comptés comme fériés** : les fériés publics seulement par défaut. Vous pouvez ajouter les fériés
  bancaires (l'après-midi du 24 décembre en Allemagne), les jours sans école locaux, les jours facultatifs
  et les célébrations (fête des Mères, dimanche de Pentecôte…).

### Jours travaillés, jours chômés en plus et fériés travaillés

- **Jours travaillés** : du lundi au vendredi par défaut. Un jour ouvré est l'un de ces jours qui n'est
  pas férié.
- **Jours chômés en plus** : ponts ou jours de fermeture, comptés comme fériés, séparés par des virgules :
  `2026-05-15` pour une date, `12-24` pour chaque année, avec un nom facultatif après `=` :
  `2026-05-15=Pont de l'Ascension, 12-24=Réveillon`.
- **Fériés travaillés** : fériés qui restent ouvrés, séparés par des virgules. Un nom dans n'importe quelle
  langue (`Lundi de Pentecôte` pour la journée de solidarité, quelle que soit sa date), une date
  (`2027-05-17`) ou un jour de chaque année (`12-26`).

### Vacances scolaires françaises

Pour la France et l'outre-mer (pays France, Guadeloupe, Guyane, Martinique, La Réunion, Mayotte,
Saint-Pierre-et-Miquelon, Saint-Barthélemy, Saint-Martin). Choisissez votre **zone** : A, B, C, Corse,
Guadeloupe, Guyane, Martinique, Mayotte, La Réunion ou Saint-Pierre-et-Miquelon. Les vacances des élèves
sont lues une fois par jour sur data.education.gouv.fr, puis gardées : une coupure d'Internet ne change
rien aux jours déjà connus. Laissez **Aucune** pour que l'intégration reste entièrement hors ligne.

### Langue

Langue du nom de l'appareil et des fonctionnalités (figés à l'ajout de l'appareil : changez-la avant),
des noms des fériés quand la bibliothèque les a dans cette langue (sinon la langue officielle du pays), et
des textes envoyés aux scènes. Le widget du tableau de bord suit la langue de chaque utilisateur.

L'interrupteur **Préférer la connexion locale (LAN)** que Gladys affiche sur la page de configuration n'a
pas d'effet ici.

## L'appareil calendrier

Un appareil par pays, **Calendrier France** par exemple. Ses fonctionnalités se lisent dans le tableau de
bord et surtout dans les conditions des scènes :

| Fonctionnalité                     | Valeur                                                              |
| ---------------------------------- | ------------------------------------------------------------------- |
| Férié aujourd'hui                  | On / Off                                                            |
| Férié demain                       | On / Off                                                            |
| Jour ouvré aujourd'hui             | On / Off                                                            |
| Jour ouvré demain                  | On / Off                                                            |
| Vacances scolaires aujourd'hui     | On / Off (seulement avec une zone)                                  |
| Vacances scolaires demain          | On / Off (seulement avec une zone)                                  |
| Jours avant le prochain férié      | 0 un jour férié                                                     |
| Jours avant le prochain jour ouvré | 0 un jour ouvré, 3 le vendredi soir d'un pont…                      |
| Prochain jour férié                | Nom du férié du jour, ou du prochain                                |
| Aujourd'hui                        | « Jour ouvré », « Jour de repos » ou le nom du férié, avec vacances |

Tout bascule à **minuit, dans le fuseau horaire de Gladys** (heure d'été et d'hiver comprises), et
chaque valeur est renvoyée tous les jours : Gladys ne l'affiche jamais comme périmée. Une valeur de
vacances scolaires au-delà de ce que le ministère a publié n'est pas envoyée plutôt que devinée.

Choisir une zone scolaire plus tard ajoute deux fonctionnalités : cliquez sur **Mettre à jour** sur
l'appareil dans l'onglet Découverte.

## Widget du tableau de bord

**Prochains jours fériés** (dans **Éditer le tableau de bord**, widgets des intégrations) : aujourd'hui et
demain (ouvré, férié, repos), l'école aujourd'hui quand une zone est choisie, puis les prochains fériés et
vacances scolaires avec les jours restants. Touchez des vacances scolaires pour voir leurs dates et la
rentrée. Réglages : le nombre de dates affichées (1 à 8), et l'affichage des vacances scolaires.

## Déclencheurs de scène

Chaque déclencheur a une **Heure** (0 à 23) : la scène s'exécute à cette heure du jour concerné, une fois.
Les variables s'insèrent dans les textes des actions suivantes (un message, par exemple).

| Déclencheur                         | Quand                                                | Variables                                         |
| ----------------------------------- | ---------------------------------------------------- | ------------------------------------------------- |
| Jour férié                          | Chaque jour férié (0 : quand il commence, à minuit)  | Nom du jour férié, date                           |
| Veille de jour férié                | La veille de chaque jour férié                       | Nom du jour férié, date, jours de repos d'affilée |
| Début des vacances scolaires        | Le premier jour des vacances scolaires de votre zone | Nom des vacances, dernier jour, rentrée           |
| Dernier jour des vacances scolaires | Le dernier jour de vacances, la veille de la rentrée | Nom des vacances, dernier jour, rentrée           |

L'appareil dit déjà **si** un jour est férié ; ces déclencheurs ajoutent le **moment** et les **noms** :
« demain c'est l'Ascension, 4 jours de repos d'affilée ».

## Action de scène « Vérifier une date »

Donne les réponses pour aujourd'hui (0), demain (1) ou n'importe quel jour de l'année qui vient (jusqu'à 366) : **Jour ouvré**, **Férié** et **Vacances scolaires** (1 = oui, 0 = non, -1 = inconnu : pas de zone,
ou au-delà du calendrier publié), le **nom du jour férié**, le **nom des vacances scolaires** et la
**date**. Faites-la suivre d'une **Condition sur variables** sur l'un de ces résultats, par exemple
« Jour ouvré = 1 ».

## Exemples de scènes

- **Réveil seulement les jours ouvrés** : déclenchement programmé à 6 h 45, Condition sur variables
  « Calendrier France : Jour ouvré aujourd'hui = On », puis allumer la lumière de la chambre et ouvrir les
  volets.
- **Chauffage pour un pont** : déclencheur Veille de jour férié à 18 h, puis envoyer le message « Demain
  c'est {{nom du jour férié}} : {{jours de repos d'affilée}} jours de repos » et passer le thermostat en
  mode week-end.
- **Rentrée** : déclencheur Dernier jour des vacances scolaires à 19 h, puis le message « Rentrée le
  {{rentrée}} : pensez au réveil ».
- **Anticiper** : chaque vendredi à 18 h, action Vérifier une date avec 3 jours, Condition sur variables
  « Jour ouvré = 0 », puis baisser aussi le chauffage pour le lundi.

## En cas de problème

- **Aucun appareil dans l'onglet Découverte** : enregistrez d'abord la configuration, puis cliquez sur
  **Scanner**.
- **Un férié régional manque** : vérifiez la subdivision avec **Vérifier la configuration** ; l'état de
  l'intégration signale un code inconnu (les fériés nationaux sont utilisés en attendant).
- **Les vacances scolaires restent vides** : l'intégration lit data.education.gouv.fr une fois par jour au
  plus et réessaie six heures après un échec ; l'état de l'intégration indique quand rien n'a encore pu être
  lu. C'est votre zone qui est demandée, pas votre académie : Bordeaux est en zone A, Paris en zone C.
- **Les noms des fonctionnalités ne sont pas dans la bonne langue** : ils sont figés à l'ajout de
  l'appareil. Supprimez l'appareil, changez la langue, puis ajoutez-le de nouveau (son historique est
  perdu).
- **Un déclencheur part 24 fois** : réglez son **Heure** ; l'éditeur de scène l'exige.

## Limites

- Les fériés viennent de la bibliothèque date-holidays : un férié décidé tard par un gouvernement (un jour
  chômé exceptionnel) arrive avec une mise à jour de l'intégration ; ajoutez-le en attendant dans **Jours
  chômés en plus**.
- Les fêtes islamiques et autres fêtes lunaires sont calculées, et peuvent différer d'un jour de l'annonce
  officielle.
- Un pays par installation : un second calendrier (pour un travailleur frontalier) n'est pas pris en
  charge ; ses fériés peuvent être ajoutés dans **Jours chômés en plus**.
- Vacances scolaires françaises : calendrier des élèves seulement (pas celui des enseignants) ; la
  Nouvelle-Calédonie, la Polynésie française et Wallis-et-Futuna ne sont pas proposées, et les jours d'une
  partie de zone (Saint-Martin dans la zone Guadeloupe) ne sont pas pris en compte.
- Après un redémarrage, l'heure de déclenchement tout juste commencée part si l'intégration revient dans
  les 10 minutes ; plus tard, elle est sautée plutôt que lancée au mauvais moment.

## Crédits

Fériés : [date-holidays](https://github.com/commenthol/date-holidays) de commenthol (licence ISC, données
sous CC BY 3.0). Vacances scolaires : [Calendrier scolaire](https://data.education.gouv.fr/explore/dataset/fr-en-calendrier-scolaire/),
ministère de l'Éducation nationale (Licence Ouverte 2.0). Inspirée des intégrations Workday et Holiday de
Home Assistant. Sans lien avec le ministère de l'Éducation nationale ni avec Home Assistant.
