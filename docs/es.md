# Holidays & Workdays (festivos y días laborables)

¿Hoy es festivo, laborable o un día de vacaciones escolares? Esta integración se lo dice a sus escenas: el
despertador, la calefacción y las persianas ya no se comportan igual un festivo, un fin de semana o durante
las vacaciones.

- **Festivos de unos 200 países** y de sus regiones (comunidades autónomas, estados alemanes, cantones
  suizos, Alsacia-Mosela, provincias canadienses, estados de EE. UU.…), calculados **sin conexión** en su
  Gladys: sin cuenta, sin red.
- **Días laborables**: los días de la semana en que usted trabaja, menos los festivos, más sus puentes y
  días libres.
- **Vacaciones escolares francesas** de su zona (opcional), a partir de los datos abiertos del Ministerio
  de Educación francés.

> Probada con su batería de pruebas automáticas, aún no en muchas instalaciones reales de Gladys: sus
> comentarios son bienvenidos en el foro de Gladys o en las issues de GitHub.

## Lo que necesita

- Gladys Assistant 5.1.0 o posterior.
- Nada más: ni cuenta, ni clave de API, ni hardware. Solo las vacaciones escolares francesas necesitan
  acceso a Internet, una vez al día.

## Configuración

Instale la integración (**Integraciones → Instalar desde GitHub**, dirección
`https://github.com/guim31/gladys-holidays`), abra su pestaña **Configuración**, rellene los campos de
abajo y guarde. Después abra la pestaña **Descubrir** y añada el dispositivo calendario.

### País y subdivisión

- **País**: el calendario que se sigue. Los países francófonos aparecen primero, luego los demás por orden
  alfabético (en inglés).
- **Subdivisión**: opcional, para una región con festivos propios. Ejemplos: `MD` para Madrid, `CT` para
  Cataluña, `AN` para Andalucía, `67` para Alsacia (Viernes Santo y 26 de diciembre), `BY` para Baviera,
  `QC` para Quebec. Algunas subdivisiones tienen regiones: `BY-KATH` para los municipios católicos de
  Baviera (15 de agosto). El botón **Comprobar la configuración** indica los códigos del país.
- **Días contados como festivos**: solo los festivos oficiales por defecto. Puede añadir los festivos
  bancarios (la tarde del 24 de diciembre en Alemania), los días sin clase locales, los días opcionales y
  las conmemoraciones (Día de la Madre, domingo de Pentecostés…).

### Días laborables, días libres adicionales y festivos trabajados

- **Días laborables**: de lunes a viernes por defecto. Un día laborable es uno de estos días que no es
  festivo.
- **Días libres adicionales**: puentes o días de cierre, contados como festivos, separados por comas:
  `2026-05-15` para una fecha, `12-24` para cada año, con un nombre opcional tras `=`:
  `2026-05-15=Puente, 12-24=Nochebuena`.
- **Festivos trabajados**: festivos que siguen siendo laborables, separados por comas. Un nombre en
  cualquier idioma (`Lunes de Pascua`, sea cual sea su fecha), una fecha (`2027-05-17`) o un día de cada
  año (`12-26`).

### Vacaciones escolares francesas

Para Francia y sus territorios de ultramar (países Francia, Guadalupe, Guayana Francesa, Martinica,
Reunión, Mayotte, San Pedro y Miquelón, San Bartolomé, San Martín). Elija su **zona**: A, B, C, Córcega,
Guadalupe, Guayana Francesa, Martinica, Mayotte, Reunión o San Pedro y Miquelón. Las vacaciones de los
alumnos se leen una vez al día en data.education.gouv.fr y luego se guardan: un corte de Internet no
cambia nada para los días ya conocidos. Deje **Ninguna** para que la integración funcione totalmente sin
conexión.

### Idioma

Idioma del nombre del dispositivo y de las funciones (fijados al añadir el dispositivo: cámbielo antes),
de los nombres de los festivos cuando la biblioteca los tiene en ese idioma (si no, el idioma oficial del
país) y de los textos enviados a las escenas. El widget del panel sigue el idioma de cada usuario.

El interruptor **Preferir la conexión local (LAN)** que Gladys muestra en la página de configuración no
tiene efecto aquí.

## El dispositivo calendario

Un dispositivo por país, **Calendario España** por ejemplo. Sus funciones se leen en el panel y, sobre
todo, se usan en las condiciones de las escenas:

| Función                             | Valor                                                                |
| ----------------------------------- | -------------------------------------------------------------------- |
| Festivo hoy                         | On / Off                                                             |
| Festivo mañana                      | On / Off                                                             |
| Día laborable hoy                   | On / Off                                                             |
| Día laborable mañana                | On / Off                                                             |
| Vacaciones escolares hoy            | On / Off (solo con una zona)                                         |
| Vacaciones escolares mañana         | On / Off (solo con una zona)                                         |
| Días hasta el próximo festivo       | 0 un día festivo                                                     |
| Días hasta el próximo día laborable | 0 un día laborable, 3 el viernes por la tarde de un puente…          |
| Próximo festivo                     | Nombre del festivo de hoy, o del siguiente                           |
| Hoy                                 | «Día laborable», «Día libre» o el nombre del festivo, con vacaciones |

Todo cambia a **medianoche, en la zona horaria de Gladys** (horario de verano e invierno incluidos), y cada
valor se vuelve a enviar cada día, para que Gladys nunca lo muestre como desactualizado. Un valor de
vacaciones escolares más allá de lo publicado por el ministerio no se envía en lugar de adivinarse.

Elegir una zona escolar más tarde añade dos funciones: haga clic en **Actualizar** en el dispositivo, en la
pestaña Descubrir.

## Widget del panel

**Próximos festivos** (en **Editar panel**, widgets de las integraciones): hoy y mañana (laborable,
festivo, libre), la escuela hoy cuando hay una zona, y después los próximos festivos y vacaciones escolares
con los días restantes. Toque unas vacaciones escolares para ver sus fechas y la vuelta a clase. Ajustes: el
número de fechas mostradas (1 a 8) y si se muestran las vacaciones escolares.

## Activadores de escena

Cada activador tiene una **Hora** (0 a 23): la escena se ejecuta a esa hora del día en cuestión, una vez.
Las variables se insertan en los textos de las acciones siguientes (un mensaje, por ejemplo).

| Activador                              | Cuándo                                                    | Variables                                            |
| -------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------- |
| Día festivo                            | Cada festivo (0: cuando empieza, a medianoche)            | Nombre del festivo, fecha                            |
| Víspera de festivo                     | La víspera de cada festivo                                | Nombre del festivo, fecha, días libres seguidos      |
| Inicio de las vacaciones escolares     | El primer día de las vacaciones escolares de su zona      | Nombre de las vacaciones, último día, vuelta a clase |
| Último día de las vacaciones escolares | El último día de vacaciones, víspera de la vuelta a clase | Nombre de las vacaciones, último día, vuelta a clase |

El dispositivo ya dice **si** un día es festivo; estos activadores añaden el **momento** y los **nombres**:
«mañana es la Ascensión, 4 días libres seguidos».

## Acción de escena «Comprobar una fecha»

Da las respuestas para hoy (0), mañana (1) o cualquier día del próximo año (hasta 366): **Día laborable**,
**Festivo** y **Vacaciones escolares** (1 = sí, 0 = no, -1 = desconocido: sin zona, o más allá del
calendario publicado), el **nombre del festivo**, el **nombre de las vacaciones escolares** y la **fecha**.
Póngale detrás una **Condición sobre variables** sobre uno de estos resultados, por ejemplo «Día
laborable = 1».

## Ejemplos de escenas

- **Despertador solo los días laborables**: activador programado a las 6:45, Condición sobre variables
  «Calendario España: Día laborable hoy = On», y luego encender la luz del dormitorio y abrir las persianas.
- **Calefacción para un puente**: activador Víspera de festivo a las 18:00, y luego enviar el mensaje
  «Mañana es {{nombre del festivo}}: {{días libres seguidos}} días libres» y poner el termostato en modo fin
  de semana.
- **Vuelta a clase**: activador Último día de las vacaciones escolares a las 19:00, y luego el mensaje
  «Vuelta a clase el {{vuelta a clase}}: revise el despertador».
- **Anticiparse**: cada viernes a las 18:00, acción Comprobar una fecha con 3 días, Condición sobre
  variables «Día laborable = 0», y luego bajar la calefacción también para el lunes.

## En caso de problema

- **Ningún dispositivo en la pestaña Descubrir**: guarde primero la configuración y luego haga clic en
  **Buscar**.
- **Falta un festivo regional**: compruebe la subdivisión con **Comprobar la configuración**; el estado de
  la integración indica un código desconocido (mientras tanto se usan los festivos nacionales).
- **Las vacaciones escolares siguen vacías**: la integración lee data.education.gouv.fr como máximo una
  vez al día y lo vuelve a intentar seis horas después de un fallo; el estado de la integración indica
  cuándo aún no se ha podido leer nada. Se pide su zona, no su académie: Burdeos está en la zona A, París
  en la zona C.
- **Los nombres de las funciones están en otro idioma**: se fijan al añadir el dispositivo. Elimine el
  dispositivo, cambie el idioma y vuelva a añadirlo (se pierde su historial).
- **Un activador se dispara 24 veces**: ajuste su **Hora**; el editor de escenas la exige.

## Límites

- Los festivos vienen de la biblioteca date-holidays: un festivo decidido tarde por un gobierno (un día
  libre excepcional) llega con una actualización de la integración; mientras tanto, añádalo en **Días
  libres adicionales**.
- Las fiestas islámicas y otras fiestas lunares se calculan y pueden diferir en un día del anuncio
  oficial.
- Un país por instalación: no se admite un segundo calendario (para un trabajador transfronterizo); sus
  festivos pueden añadirse en **Días libres adicionales**.
- Vacaciones escolares francesas: solo el calendario de los alumnos (no el de los docentes); Nueva
  Caledonia, la Polinesia Francesa y Wallis y Futuna no se ofrecen, y los días de una parte de zona (San
  Martín en la zona Guadalupe) no se tienen en cuenta.
- Tras un reinicio, la hora de activación recién empezada se dispara si la integración vuelve en menos de
  10 minutos; más tarde, se omite en lugar de dispararse a destiempo.

## Créditos

Festivos: [date-holidays](https://github.com/commenthol/date-holidays) de commenthol (licencia ISC, datos
bajo CC BY 3.0). Vacaciones escolares: [Calendrier scolaire](https://data.education.gouv.fr/explore/dataset/fr-en-calendrier-scolaire/),
Ministerio de Educación francés (Licence Ouverte 2.0). Inspirada en las integraciones Workday y Holiday de
Home Assistant. Sin relación con el Ministerio de Educación francés ni con Home Assistant.
