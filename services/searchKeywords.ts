// ========== SEARCH KEYWORDS - Mapping scenari → oggetti/spazi ==========
// Ogni chiave può essere una parola singola o una frase/scenario completo.
// I valori sono le keywords da cercare negli annunci.

const AI_KEYWORDS_MAP: Record<string, string[]> = {

  // ========================
  // EVENTI E FESTE
  // ========================
  'festa': ['locale', 'sala', 'audio', 'casse', 'luci', 'proiettore', 'tavoli', 'sedie', 'decorazioni', 'dj', 'mixer', 'microfono'],
  'festa 18 anni': ['locale', 'sala', 'casse', 'luci', 'dj', 'mixer', 'microfono', 'proiettore', 'tavoli', 'sedie', 'decorazioni', 'macchina fumo', 'audio', 'impianto audio', 'gazebo'],
  'festa di laurea': ['locale', 'sala', 'casse', 'luci', 'decorazioni', 'tavoli', 'sedie', 'proiettore', 'audio', 'gazebo', 'catering'],
  'festa bambini': ['sala', 'locale', 'giochi', 'gonfiabili', 'tavoli', 'sedie', 'decorazioni', 'audio', 'palloncini', 'animazione'],
  'compleanno': ['locale', 'sala', 'audio', 'casse', 'luci', 'palloncini', 'tavoli', 'sedie', 'decorazioni'],
  'matrimonio': ['location', 'sala ricevimenti', 'audio', 'luci', 'decorazioni', 'gazebo', 'tavoli', 'sedie', 'arco', 'fiori'],
  'evento': ['sala', 'locale', 'audio', 'luci', 'proiettore', 'microfono', 'sedie'],
  'evento aziendale': ['sala', 'proiettore', 'microfono', 'sedie', 'schermo', 'lavagna', 'tavoli', 'audio', 'webcam'],
  'conferenza': ['sala', 'proiettore', 'microfono', 'sedie', 'lavagna', 'schermo', 'webcam'],
  'riunione': ['sala riunioni', 'ufficio', 'proiettore', 'lavagna', 'webcam'],
  'party': ['locale', 'sala', 'audio', 'casse', 'luci', 'dj', 'mixer', 'macchina fumo'],
  'aperitivo': ['locale', 'giardino', 'terrazza', 'tavoli', 'sedie', 'casse', 'luci'],
  'battesimo': ['sala', 'locale', 'gazebo', 'tavoli', 'sedie', 'decorazioni', 'audio'],
  'comunione': ['sala', 'locale', 'gazebo', 'tavoli', 'sedie', 'decorazioni', 'audio'],
  'baby shower': ['sala', 'locale', 'decorazioni', 'tavoli', 'sedie', 'palloncini'],
  'capodanno': ['locale', 'sala', 'casse', 'luci', 'dj', 'mixer', 'macchina fumo', 'audio', 'proiettore'],
  'halloween': ['locale', 'sala', 'luci', 'decorazioni', 'macchina fumo', 'casse', 'audio'],
  'cena': ['tavoli', 'sedie', 'gazebo', 'giardino', 'terrazza', 'locale', 'luci'],
  'barbecue': ['barbecue', 'griglia', 'gazebo', 'giardino', 'tavoli', 'sedie', 'casse'],
  'pic nic': ['gazebo', 'tavoli', 'sedie', 'giardino', 'casse', 'frigorifero portatile'],

  // ========================
  // LAVORO CREATIVO E MEDIA
  // ========================
  'video': ['videocamera', 'fotocamera', 'luci', 'treppiede', 'microfono', 'gimbal', 'studio'],
  'fare un video': ['videocamera', 'fotocamera', 'luci', 'treppiede', 'microfono', 'gimbal', 'studio', 'green screen', 'fondale'],
  'video youtube': ['videocamera', 'fotocamera', 'luci', 'treppiede', 'microfono', 'gimbal', 'green screen', 'ring light', 'scheda acquisizione'],
  'video matrimonio': ['videocamera', 'gimbal', 'drone', 'microfono', 'luci', 'treppiede'],
  'foto': ['fotocamera', 'obiettivo', 'luci', 'flash', 'treppiede', 'studio fotografico', 'fondale'],
  'servizio fotografico': ['fotocamera', 'obiettivo', 'luci', 'flash', 'treppiede', 'studio fotografico', 'fondale', 'riflettore', 'softbox'],
  'foto prodotti': ['fotocamera', 'obiettivo', 'luci', 'softbox', 'fondale', 'treppiede', 'light box'],
  'podcast': ['microfono', 'cuffie', 'mixer', 'scheda audio', 'studio'],
  'registrare podcast': ['microfono', 'cuffie', 'mixer', 'scheda audio', 'studio', 'pannelli acustici', 'braccio microfono'],
  'musica': ['strumenti', 'chitarra', 'tastiera', 'amplificatore', 'sala prove', 'studio registrazione'],
  'registrare musica': ['studio registrazione', 'microfono', 'mixer', 'scheda audio', 'cuffie', 'monitor', 'pannelli acustici'],
  'streaming': ['webcam', 'microfono', 'luci', 'green screen', 'scheda acquisizione', 'ring light'],
  'diretta': ['webcam', 'microfono', 'luci', 'green screen', 'scheda acquisizione', 'treppiede'],
  'cortometraggio': ['videocamera', 'luci', 'microfono', 'gimbal', 'drone', 'treppiede', 'dolly', 'studio'],
  'drone': ['drone', 'batterie', 'controller', 'scheda memoria'],

  // ========================
  // CASA, TRASLOCO E LAVORI
  // ========================
  'trasloco': ['furgone', 'carrello', 'scatoloni', 'nastro', 'coperte'],
  'devo traslocare': ['furgone', 'carrello', 'scatoloni', 'nastro', 'coperte', 'transpallet', 'cinghie'],
  'pulizia': ['aspirapolvere', 'idropulitrice', 'lucidatrice', 'vaporetto'],
  'pulire casa': ['aspirapolvere', 'vaporetto', 'lucidatrice', 'idropulitrice', 'lavasciuga'],
  'giardinaggio': ['tagliaerba', 'decespugliatore', 'motosega', 'soffiatore', 'attrezzi'],
  'curare giardino': ['tagliaerba', 'decespugliatore', 'soffiatore', 'motosega', 'tagliasiepi', 'biotrituratore', 'irrigazione'],
  'tagliare erba': ['tagliaerba', 'decespugliatore', 'soffiatore'],
  'potare': ['motosega', 'tagliasiepi', 'cesoie', 'scala', 'decespugliatore'],
  'bricolage': ['trapano', 'avvitatore', 'sega', 'levigatrice', 'attrezzi'],
  'ristrutturazione': ['trapano', 'martello demolitore', 'scala', 'ponteggio', 'attrezzi'],
  'ristrutturare bagno': ['trapano', 'martello demolitore', 'flessibile', 'piastrelle', 'livella', 'attrezzi', 'scala'],
  'ristrutturare casa': ['trapano', 'martello demolitore', 'scala', 'ponteggio', 'levigatrice', 'smerigliatrice', 'attrezzi', 'carriola'],
  'pitturare': ['rulli', 'pennelli', 'scala', 'telo protettivo', 'nastro carta', 'compressore', 'pistola a spruzzo'],
  'dipingere pareti': ['rulli', 'pennelli', 'scala', 'telo protettivo', 'nastro carta'],
  'montare mobili': ['trapano', 'avvitatore', 'livella', 'attrezzi'],
  'imbianchino': ['rulli', 'pennelli', 'scala', 'compressore', 'pistola a spruzzo', 'telo protettivo'],
  'pavimento': ['levigatrice', 'flessibile', 'livella', 'trapano', 'attrezzi'],
  'idraulico': ['chiavi', 'flessibile', 'trapano', 'attrezzi', 'saldatrice'],
  'elettricista': ['trapano', 'avvitatore', 'multimetro', 'attrezzi', 'scala'],
  'costruire': ['trapano', 'sega circolare', 'livella', 'attrezzi', 'scala', 'betoniera', 'carriola'],
  'demolire': ['martello demolitore', 'smerigliatrice', 'attrezzi', 'carriola', 'scala'],

  // ========================
  // SPORT E TEMPO LIBERO
  // ========================
  'campeggio': ['tenda', 'sacco a pelo', 'fornello', 'lanterna', 'zaino'],
  'andare in campeggio': ['tenda', 'sacco a pelo', 'fornello', 'lanterna', 'zaino', 'materassino', 'torcia', 'frigorifero portatile'],
  'escursione': ['zaino', 'bastoncini', 'tenda', 'sacco a pelo', 'gps'],
  'trekking': ['zaino', 'bastoncini', 'tenda', 'sacco a pelo', 'gps', 'torcia', 'scarponi'],
  'sci': ['sci', 'scarponi', 'bastoncini', 'casco', 'maschera'],
  'settimana bianca': ['sci', 'scarponi', 'bastoncini', 'casco', 'maschera', 'tuta sci', 'guanti'],
  'snowboard': ['snowboard', 'scarponi', 'casco', 'maschera', 'guanti'],
  'mare': ['sup', 'kayak', 'canoa', 'muta', 'attrezzatura snorkeling'],
  'giornata al mare': ['sup', 'kayak', 'canoa', 'ombrellone', 'sdraio', 'muta', 'snorkeling', 'maschera', 'pinne'],
  'weekend al mare': ['sup', 'kayak', 'canoa', 'ombrellone', 'sdraio', 'muta', 'snorkeling', 'barca', 'gommone'],
  'surf': ['tavola surf', 'muta', 'leash'],
  'sup': ['sup', 'pagaia', 'leash', 'giubbotto'],
  'kayak': ['kayak', 'pagaia', 'giubbotto', 'muta'],
  'immersione': ['muta', 'bombola', 'erogatore', 'maschera', 'pinne', 'gav', 'torcia subacquea'],
  'snorkeling': ['maschera', 'pinne', 'muta', 'boccaglio'],
  'pesca': ['canna da pesca', 'mulinello', 'attrezzatura pesca', 'barca', 'gommone'],
  'bici': ['bicicletta', 'mountain bike', 'casco', 'lucchetto'],
  'giro in bici': ['bicicletta', 'mountain bike', 'casco', 'lucchetto', 'portapacchi', 'luci bici'],
  'mountain bike': ['mountain bike', 'casco', 'guanti', 'protezioni', 'lucchetto'],
  'bici elettrica': ['bici elettrica', 'e-bike', 'casco', 'lucchetto'],
  'fitness': ['attrezzi palestra', 'tapis roulant', 'pesi', 'panca'],
  'palestra casa': ['tapis roulant', 'pesi', 'panca', 'manubri', 'elastici', 'tappetino', 'cyclette'],
  'yoga': ['tappetino', 'blocchi yoga', 'elastici'],
  'tennis': ['racchetta tennis', 'palline', 'campo tennis'],
  'padel': ['racchetta padel', 'palline', 'campo padel'],
  'calcetto': ['pallone', 'scarpe calcetto', 'campo calcetto'],
  'golf': ['mazze golf', 'sacca', 'carrello golf', 'palline golf'],
  'equitazione': ['casco equitazione', 'sella', 'stivali'],
  'arrampicata': ['imbracatura', 'casco', 'corda', 'moschettoni', 'scarpette'],
  'skateboard': ['skateboard', 'casco', 'protezioni'],
  'pattini': ['pattini', 'casco', 'protezioni'],
  'monopattino': ['monopattino', 'monopattino elettrico', 'casco'],

  // ========================
  // BAMBINI E FAMIGLIA
  // ========================
  'bambini': ['passeggino', 'seggiolino', 'culla', 'box', 'giochi'],
  'neonato': ['culla', 'passeggino', 'seggiolino', 'fasciatoio', 'sterilizzatore'],
  'vacanza con bambini': ['passeggino', 'seggiolino auto', 'culla', 'seggiolone', 'box', 'giochi'],
  'festa per bambini': ['gonfiabili', 'giochi', 'tavoli', 'sedie', 'decorazioni', 'audio', 'palloncini', 'animazione'],
  'parco giochi': ['gonfiabili', 'scivolo', 'altalena', 'giochi'],

  // ========================
  // TECNOLOGIA E UFFICIO
  // ========================
  'computer': ['notebook', 'laptop', 'pc', 'monitor', 'tastiera', 'mouse'],
  'presentazione': ['proiettore', 'schermo', 'laptop', 'puntatore', 'microfono'],
  'smart working': ['monitor', 'webcam', 'scrivania', 'sedia ergonomica', 'cuffie'],
  'stampare': ['stampante', 'stampante 3d', 'plotter', 'scanner'],
  'stampante 3d': ['stampante 3d', 'filamento'],
  'realta virtuale': ['visore vr', 'oculus', 'controller vr'],
  'gaming': ['console', 'playstation', 'xbox', 'nintendo', 'monitor gaming', 'cuffie gaming'],
  'proiettore': ['proiettore', 'schermo proiezione', 'casse', 'cavi hdmi'],
  'cinema casa': ['proiettore', 'schermo proiezione', 'casse', 'soundbar', 'subwoofer'],
  'karaoke': ['microfono', 'casse', 'mixer', 'impianto karaoke', 'schermo'],

  // ========================
  // VEICOLI E TRASPORTO
  // ========================
  'furgone': ['furgone', 'van', 'autocarro'],
  'trasportare': ['furgone', 'carrello', 'rimorchio', 'transpallet'],
  'rimorchio': ['rimorchio', 'carrello', 'gancio traino'],
  'scooter': ['scooter', 'motorino', 'casco', 'lucchetto'],
  'moto': ['moto', 'casco', 'guanti moto', 'giacca moto'],
  'auto': ['auto', 'macchina', 'navigatore'],
  'camper': ['camper', 'van', 'attrezzatura campeggio'],
  'barca': ['barca', 'gommone', 'motore fuoribordo', 'giubbotto salvagente'],

  // ========================
  // CUCINA E FOOD
  // ========================
  'cucinare': ['cucina professionale', 'forno', 'impastatrice', 'planetaria', 'pentole'],
  'catering': ['cucina', 'scaldavivande', 'tavoli', 'sedie', 'piatti', 'posate', 'bicchieri'],
  'gelato': ['macchina gelato', 'gelatiera'],
  'pizza': ['forno pizza', 'forno a legna', 'impastatrice'],
  'pasticceria': ['impastatrice', 'planetaria', 'forno', 'stampi', 'sac a poche'],
  'cocktail': ['shaker', 'bar', 'bicchieri', 'macchina ghiaccio'],

  // ========================
  // MODA E ABBIGLIAMENTO
  // ========================
  'sartoria': ['macchina da cucire', 'manichino', 'tavolo da taglio', 'ferro da stiro'],
  'cucire': ['macchina da cucire', 'tagliacuci', 'manichino'],
  'cosplay': ['macchina da cucire', 'pistola colla', 'tessuti', 'parrucca'],

  // ========================
  // SALUTE E BENESSERE
  // ========================
  'massaggio': ['lettino massaggio', 'oli', 'asciugamani'],
  'fisioterapia': ['lettino', 'elastici', 'attrezzi riabilitazione'],
};

// ========== NORMALIZZA TESTO ==========
const normalizeText = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

// ========== LEVENSHTEIN DISTANCE ==========
const levenshteinDistance = (a: string, b: string): number => {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  if (Math.abs(a.length - b.length) > 3) return Math.abs(a.length - b.length);
  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) matrix[i] = [i];
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
};

/**
 * Trova keywords correlate a una query di ricerca.
 * Supporta parole singole, frasi e scenari complessi.
 * Es: "festa 18 anni" → ['locale', 'sala', 'casse', 'luci', 'dj', ...]
 */
export const findRelatedKeywords = (query: string): string[] => {
  const nq = normalizeText(query);
  const relatedTerms: Set<string> = new Set();

  // Ordina le chiavi per lunghezza decrescente (match frasi lunghe prima)
  const sortedKeys = Object.keys(AI_KEYWORDS_MAP).sort((a, b) => b.length - a.length);

  for (const key of sortedKeys) {
    const nk = normalizeText(key);

    // Match esatto o parziale
    if (nq.includes(nk) || nk.includes(nq)) {
      AI_KEYWORDS_MAP[key].forEach(v => relatedTerms.add(normalizeText(v)));
      continue;
    }

    // Match per parole condivise (es: "festa compleanno 18" matcha "festa 18 anni")
    const queryWords = nq.split(/\s+/).filter(w => w.length >= 2);
    const keyWords = nk.split(/\s+/).filter(w => w.length >= 2);
    const sharedWords = queryWords.filter(qw =>
      keyWords.some(kw => kw === qw || kw.startsWith(qw) || qw.startsWith(kw))
    );
    if (keyWords.length > 1 && sharedWords.length >= Math.ceil(keyWords.length * 0.5)) {
      AI_KEYWORDS_MAP[key].forEach(v => relatedTerms.add(normalizeText(v)));
      continue;
    }

    // Match con tolleranza errori (solo per chiavi a parola singola)
    if (keyWords.length === 1 && queryWords.length <= 2) {
      for (const qw of queryWords) {
        if (levenshteinDistance(nk, qw) <= 2) {
          AI_KEYWORDS_MAP[key].forEach(v => relatedTerms.add(normalizeText(v)));
          break;
        }
      }
    }
  }

  return Array.from(relatedTerms);
};

/**
 * Restituisce gli esempi di ricerca da mostrare nel dropdown.
 */
export const getSearchExamples = (): string[] => [
  'festa di 18 anni',
  'weekend al mare',
  'servizio fotografico',
  'ristrutturare casa',
  'campeggio',
  'trasloco',
];