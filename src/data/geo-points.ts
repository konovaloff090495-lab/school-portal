// СГЕНЕРИРОВАНО scripts/build-metro-geo.mjs — не править руками.
// Источник: OpenStreetMap (Overpass API), лицензия ODbL.
// Координаты станций метро/МЦД и городов Подмосковья, по которым построены
// страницы /shkoly/moskva/metro/[station]/ и /shkoly/moskovskaya-oblast/gorod/[city]/.
// Нужны, чтобы подобрать школы у соседних станций и в соседних городах, когда
// в самой выборке школ нужного типа нет (см. src/lib/related-schools.ts).

export const metroGeo: Record<string, { lat: number; lon: number }> = {
  'aviamotornaya': { lat: 55.75253, lon: 37.72006 },
  'avtozavodskaya': { lat: 55.70734, lon: 37.65777 },
  'akademicheskaya': { lat: 55.68781, lon: 37.57351 },
  'altufevo': { lat: 55.89792, lon: 37.58736 },
  'annino': { lat: 55.58253, lon: 37.59653 },
  'arbatskaya': { lat: 55.75209, lon: 37.60698 },
  'babushkinskaya': { lat: 55.86963, lon: 37.66411 },
  'bagrationovskaya': { lat: 55.74373, lon: 37.49774 },
  'barrikadnaya': { lat: 55.76113, lon: 37.57931 },
  'baumanskaya': { lat: 55.77304, lon: 37.68055 },
  'belorusskaya': { lat: 55.7767, lon: 37.58358 },
  'belyaevo': { lat: 55.64278, lon: 37.52568 },
  'beskudnikovo': { lat: 55.88278, lon: 37.56778 },
  'borovskoe-shosse': { lat: 55.64775, lon: 37.37042 },
  'botanicheskiy-sad': { lat: 55.84484, lon: 37.63825 },
  'bulvar-rokossovskogo': { lat: 55.81468, lon: 37.73434 },
  'vdnkh': { lat: 55.82096, lon: 37.6412 },
  'vladykino': { lat: 55.84718, lon: 37.58991 },
  'vodnyy-stadion': { lat: 55.84006, lon: 37.48671 },
  'voykovskaya': { lat: 55.81905, lon: 37.49802 },
  'vorobyovy-gory': { lat: 55.71033, lon: 37.55929 },
  'vykhino': { lat: 55.71564, lon: 37.81792 },
  'dmitrovskaya': { lat: 55.80656, lon: 37.58191 },
  'dolgoprudnaya': { lat: 55.94013, lon: 37.51999 },
  'izmaylovskaya': { lat: 55.78773, lon: 37.7816 },
  'kaluzhskaya': { lat: 55.65709, lon: 37.54053 },
  'kantemirovskaya': { lat: 55.63574, lon: 37.65654 },
  'kolomenskaya': { lat: 55.67848, lon: 37.66392 },
  'kommunarka': { lat: 55.57463, lon: 37.46799 },
  'koptevo': { lat: 55.83962, lon: 37.52011 },
  'kosino': { lat: 55.70342, lon: 37.85103 },
  'krasnye-vorota': { lat: 55.76902, lon: 37.64899 },
  'kuznetskiy-most': { lat: 55.76075, lon: 37.62614 },
  'kuntsevskaya': { lat: 55.73068, lon: 37.44602 },
  'kutuzovskaya': { lat: 55.73999, lon: 37.53439 },
  'leninskiy-prospekt': { lat: 55.70762, lon: 37.58621 },
  'lefortovo': { lat: 55.76473, lon: 37.70674 },
  'lubyanka': { lat: 55.75987, lon: 37.62786 },
  'lyublino': { lat: 55.67572, lon: 37.76196 },
  'mayakovskaya': { lat: 55.77017, lon: 37.59509 },
  'medvedkovo': { lat: 55.88718, lon: 37.66155 },
  'mitino': { lat: 55.84575, lon: 37.36223 },
  'nagatinskaya': { lat: 55.68297, lon: 37.62241 },
  'nakhimovskiy-prospekt': { lat: 55.66265, lon: 37.60562 },
  'nizhegorodskaya': { lat: 55.73192, lon: 37.72999 },
  'novokosino': { lat: 55.74509, lon: 37.86377 },
  'novokuznetskaya': { lat: 55.74143, lon: 37.6292 },
  'novye-cheryomushki': { lat: 55.67028, lon: 37.5547 },
  'oktyabrskaya': { lat: 55.7305, lon: 37.61091 },
  'oktyabrskoe-pole': { lat: 55.79337, lon: 37.49381 },
  'orekhovo': { lat: 55.61314, lon: 37.69497 },
  'okhotnyy-ryad': { lat: 55.75777, lon: 37.61651 },
  'paveletskaya': { lat: 55.7305, lon: 37.63784 },
  'pervomayskaya': { lat: 55.79473, lon: 37.7994 },
  'perovo': { lat: 55.7512, lon: 37.78648 },
  'pechatniki': { lat: 55.69349, lon: 37.72695 },
  'polezhaevskaya': { lat: 55.77751, lon: 37.51929 },
  'preobrazhenskaya-ploshchad': { lat: 55.79637, lon: 37.71535 },
  'prospekt-mira': { lat: 55.78085, lon: 37.63198 },
  'profsoyuznaya': { lat: 55.67793, lon: 37.5629 },
  'savyolovskaya': { lat: 55.79249, lon: 37.58882 },
  'sviblovo': { lat: 55.85521, lon: 37.65271 },
  'serpukhovskaya': { lat: 55.72795, lon: 37.62483 },
  'smolenskaya': { lat: 55.74739, lon: 37.58182 },
  'sokol': { lat: 55.80527, lon: 37.51505 },
  'sportivnaya': { lat: 55.72338, lon: 37.56421 },
  'strogino': { lat: 55.8037, lon: 37.40308 },
  'taganskaya': { lat: 55.74047, lon: 37.6519 },
  'tverskaya': { lat: 55.7649, lon: 37.60631 },
  'tekstilshchiki': { lat: 55.70881, lon: 37.7315 },
  'timiryazevskaya': { lat: 55.81713, lon: 37.57639 },
  'troparyovo': { lat: 55.64586, lon: 37.47253 },
  'tulskaya': { lat: 55.70866, lon: 37.62282 },
  'tushinskaya': { lat: 55.82653, lon: 37.43698 },
  'tyoplyy-stan': { lat: 55.61886, lon: 37.50822 },
  'universitet': { lat: 55.69266, lon: 37.53328 },
  'fiztekh': { lat: 55.92166, lon: 37.54658 },
  'fili': { lat: 55.74613, lon: 37.51483 },
  'frunzenskaya': { lat: 55.72688, lon: 37.57833 },
  'tsaritsyno': { lat: 55.62148, lon: 37.66924 },
  'tsvetnoy-bulvar': { lat: 55.77087, lon: 37.61791 },
  'cherkizovskaya': { lat: 55.80388, lon: 37.74503 },
  'chertanovskaya': { lat: 55.64046, lon: 37.60669 },
  'chistye-prudy': { lat: 55.76587, lon: 37.63903 },
  'shchukinskaya': { lat: 55.80846, lon: 37.4647 },
  'shchyolkovskaya': { lat: 55.80934, lon: 37.79857 },
  'elektrozavodskaya': { lat: 55.78171, lon: 37.70379 },
  'yugo-zapadnaya': { lat: 55.66365, lon: 37.48322 },
}

const R = 6371000
const rad = (d: number) => (d * Math.PI) / 180

/** Расстояние между двумя станциями в метрах. */
export function stationDistance(a: string, b: string): number | null {
  const p = metroGeo[a], q = metroGeo[b]
  if (!p || !q) return null
  const dLat = rad(q.lat - p.lat), dLon = rad(q.lon - p.lon)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(p.lat)) * Math.cos(rad(q.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Слаги станций в радиусе radiusM от station, отсортированы по возрастанию расстояния. */
export function nearbyStations(station: string, radiusM = 3000): string[] {
  if (!metroGeo[station]) return []
  return Object.keys(metroGeo)
    .filter(s => s !== station)
    .map(s => ({ s, d: stationDistance(station, s)! }))
    .filter(x => x.d <= radiusM)
    .sort((a, b) => a.d - b.d)
    .map(x => x.s)
}

export const moCityGeo: Record<string, { lat: number; lon: number }> = {
  'balashikha': { lat: 55.79977, lon: 37.93737 },
  'dmitrov': { lat: 56.34507, lon: 37.52007 },
  'dolgoprudny': { lat: 55.93415, lon: 37.51424 },
  'domodedovo': { lat: 55.43682, lon: 37.76807 },
  'zheleznodorozhny': { lat: 55.74646, lon: 38.00908 },
  'klin': { lat: 56.33533, lon: 36.73465 },
  'kolomna': { lat: 55.09387, lon: 38.76701 },
  'korolev': { lat: 55.919, lon: 37.81504 },
  'krasnogorsk': { lat: 55.82047, lon: 37.31969 },
  'lyubertsy': { lat: 55.67831, lon: 37.89377 },
  'mytishchi': { lat: 55.90949, lon: 37.73394 },
  'noginsk': { lat: 55.85535, lon: 38.44119 },
  'odintsovo': { lat: 55.67822, lon: 37.26681 },
  'podolsk': { lat: 55.43088, lon: 37.54531 },
  'ramenskoye': { lat: 55.57094, lon: 38.22821 },
  'reutov': { lat: 55.76225, lon: 37.85656 },
  'ruza': { lat: 55.69989, lon: 36.1947 },
  'serpukhov': { lat: 54.91552, lon: 37.41955 },
  'khimki': { lat: 55.89173, lon: 37.4397 },
  'shchyolkovo': { lat: 55.92065, lon: 37.99156 },
}

/** Слаги городов Подмосковья, ближайшие к city — отсортированы по расстоянию. */
export function nearbyMoCities(city: string, limit = 6): string[] {
  const p = moCityGeo[city]
  if (!p) return []
  return Object.keys(moCityGeo)
    .filter(c => c !== city)
    .map(c => {
      const q = moCityGeo[c]
      const dLat = rad(q.lat - p.lat), dLon = rad(q.lon - p.lon)
      const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(p.lat)) * Math.cos(rad(q.lat)) * Math.sin(dLon / 2) ** 2
      return { c, d: 2 * R * Math.asin(Math.sqrt(h)) }
    })
    .sort((a, b) => a.d - b.d)
    .slice(0, limit)
    .map(x => x.c)
}
