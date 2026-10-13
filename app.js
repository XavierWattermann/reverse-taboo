/**
 * REVERSE TABOO — Main Application Engine
 * Dynamic clue reveals, taboo guess interception, letter dash hints,
 * zero-duplicate daily permutation, procedural audio & statistics
 */

(() => {
  'use strict';

  // =========================================================================
  // 1. BUILT-IN FALLBACK DATASET (Ensures instant play even if offline/file://)
  // =========================================================================
  const FALLBACK_WORDS = [
    { id: 1, word: "Canada", prohibited: ["maple", "ontario", "nations", "territories", "provinces", "vancouver", "toronto", "french", "quebec"] },
    { id: 4, word: "Sun", prohibited: ["temperature", "surface", "core", "energy", "light", "mass", "magnetic", "earth", "solar"] },
    { id: 6, word: "Elephant", prohibited: ["matriarch", "males", "animals", "african", "trunk", "species", "asian"] },
    { id: 10, word: "Sherlock Holmes", prohibited: ["case", "fictional", "detective", "arthur conan doyle", "stories", "adventure", "watson"] },
    { id: 17, word: "Paris", prohibited: ["capital", "eiffel tower", "french", "city", "france"] },
    { id: 24, word: "The Beatles", prohibited: ["artists", "rock", "ringo starr", "music", "songs", "george harrison", "album", "band", "paul mccartney", "john lennon"] },
    { id: 26, word: "Moon", prohibited: ["mission", "waxing", "space", "side", "waning", "orbit", "full", "earth", "lunar"] },
    { id: 35, word: "The Simpsons", prohibited: ["marge", "family", "homer", "animated", "fox", "characters", "lisa", "episode", "series", "bart", "television", "show"] },
    { id: 37, word: "Albert Einstein", prohibited: ["mechanics", "light", "motion", "energy", "genius", "quantum", "physics", "relativity", "theory"] },
    { id: 47, word: "Rice", prohibited: ["paddy", "irrigation", "farmers", "crop", "china", "cultivation", "water", "food", "grain"] },
    { id: 53, word: "Air conditioning", prohibited: ["systems", "room", "unit", "energy", "engineering", "technology", "cooling", "heat"] },
    { id: 57, word: "Xbox", prohibited: ["video", "live", "games", "kinect", "game", "microsoft", "console"] },
    { id: 76, word: "Thomas Edison", prohibited: ["light", "inventor", "bulb", "patent", "electric"] },
    { id: 77, word: "Carbon dioxide (CO2)", prohibited: ["oxygen", "doi", "concentration", "acid", "water", "gas"] },
    { id: 78, word: "Basketball", prohibited: ["rules", "court", "nba", "shot", "game", "player", "team"] },
    { id: 83, word: "Taj Mahal", prohibited: ["dome", "architecture", "monument", "buildings", "garden", "india", "marble", "tomb"] },
    { id: 90, word: "Microsoft", prohibited: ["products", "business", "gates", "ibm", "server", "companies", "software", "company", "windows"] },
    { id: 100, word: "Go (game)", prohibited: ["black", "chinese", "rules", "moves", "board", "players", "stones"] },
    { id: 106, word: "Cheese", prohibited: ["protein", "flavor", "food", "soft", "fat", "curd", "dairy", "milk"] },
    { id: 120, word: "Taylor Swift", prohibited: ["awards", "pop", "songs", "nashville", "music", "country", "album"] },
    { id: 121, word: "Christmas", prohibited: ["tree", "celebration", "christian", "church", "religious", "birth", "holiday", "calendar", "jesus", "day"] },
    { id: 126, word: "Fruit", prohibited: ["orange", "apple", "berries", "fleshy", "ovary", "plant", "seeds", "flower"] },
    { id: 139, word: "Isaac Newton", prohibited: ["theory", "mechanics", "force", "gravity", "light", "cambridge", "motion"] },
    { id: 147, word: "Ship", prohibited: ["water", "naval", "cargo", "boat", "fishing", "hull", "vessel"] },
    { id: 175, word: "Cat", prohibited: ["animals", "prey", "feline", "humans", "species", "feral", "domestic"] },
    { id: 177, word: "iPhone", prohibited: ["generation", "models", "sim", "screen", "ios", "apple"] },
    { id: 197, word: "China", prohibited: ["beijing", "country", "population", "republic", "dynasty", "chairman mao"] },
    { id: 228, word: "Diamond", prohibited: ["cut", "de beers", "natural", "carbon", "high", "color", "hardness", "synthetic"] },
    { id: 230, word: "Great Wall of China", prohibited: ["earth", "dynasty", "visible", "sections", "built", "chinese", "ming"] },
    { id: 257, word: "Queen (band)", prohibited: ["john deacon", "greatest", "performed", "brian may", "roger taylor", "british", "album", "freddie mercury", "rock"] },
    { id: 260, word: "Window", prohibited: ["curtain", "door", "building", "panes", "light", "heat", "glass"] },
    { id: 267, word: "Batman", prohibited: ["gotham city", "joker", "comic", "robin", "character", "bruce wayne"] },
    { id: 276, word: "Linux", prohibited: ["unix", "distribution", "desktop", "open source", "free", "system", "operating", "kernel", "gnu", "software"] },
    { id: 282, word: "Minecraft", prohibited: ["video", "player", "items", "blocks", "playstation", "mode", "games", "xbox", "players", "game"] },
    { id: 286, word: "Google", prohibited: ["internet", "products", "service", "billion", "advertising", "company", "search engine"] },
    { id: 295, word: "Earth", prohibited: ["life", "land", "plate", "water", "solar", "atmosphere", "planet", "sun", "moon", "surface"] },
    { id: 317, word: "Photosynthesis", prohibited: ["plant", "cycle", "energy", "oxygen", "water", "electron", "reactions", "plants", "carbon dioxide", "light"] },
    { id: 333, word: "Pi", prohibited: ["irrational", "series", "number", "mathematics", "infinite", "circle", "digits"] },
    { id: 338, word: "Water", prohibited: ["food", "chemical", "oxygen", "liquid", "surface", "temperature", "drinking", "ice", "heat", "hydrogen", "earth"] }
  ];

  let WORDS_POOL = (typeof window !== 'undefined' && Array.isArray(window.WORDS_POOL) && window.WORDS_POOL.length > 0)
    ? window.WORDS_POOL
    : [...FALLBACK_WORDS];

  // =========================================================================
  // 2. PROCEDURAL SOUND ENGINE (Zero External Assets)
  // =========================================================================
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.enabled = localStorage.getItem('rt_sound_enabled') !== 'false';
    }

    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem('rt_sound_enabled', this.enabled);
      if (this.enabled) {
        this.playCorrect();
      }
      return this.enabled;
    }

    playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.12) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {}
    }

    playFlip() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(680, this.ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
      } catch (e) {}
    }

    playCorrect() {
      if (!this.enabled) return;
      // Arpeggiated C-Major victory chime (C5 -> E5 -> G5 -> C6)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        setTimeout(() => this.playTone(freq, 'triangle', 0.18, 0.15), i * 70);
      });
    }

    playWrong() {
      if (!this.enabled) return;
      this.playTone(140, 'sawtooth', 0.2, 0.1);
      setTimeout(() => this.playTone(110, 'sawtooth', 0.25, 0.08), 80);
    }

    playClose() {
      if (!this.enabled) return;
      this.playTone(440, 'sine', 0.1, 0.1);
      setTimeout(() => this.playTone(554.37, 'sine', 0.12, 0.1), 90);
    }

    playWin() {
      if (!this.enabled) return;
      const chords = [
        [523.25, 659.25],
        [659.25, 783.99],
        [783.99, 1046.5],
        [1046.5, 1318.51]
      ];
      chords.forEach((pair, i) => {
        setTimeout(() => {
          this.playTone(pair[0], 'triangle', 0.35, 0.14);
          this.playTone(pair[1], 'sine', 0.35, 0.12);
        }, i * 140);
      });
    }
  }

  const sound = new SoundEngine();

  // =========================================================================
  // 3. FUZZY MATCHING & ALIAS ENGINE
  // =========================================================================
  class FuzzyMatcher {
    static normalize(str) {
      if (!str) return '';
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Morphological stemmer that collapses word families to a shared root
    // e.g. "pickling", "pickles", "pickled", "pickle" -> "pickl"
    static stemWord(word) {
      if (!word) return word;
      let w = word.toLowerCase().trim();

      // British / American & irregular root normalizations
      const irregulars = {
        theatre: 'theater', theatres: 'theater', theaters: 'theater',
        colour: 'color', colours: 'color',
        armour: 'armor', armours: 'armor',
        flavour: 'flavor', flavours: 'flavor',
        humour: 'humor',
        labour: 'labor',
        neighbour: 'neighbor', neighbours: 'neighbor',
        favourite: 'favorite', favourites: 'favorite',
        centre: 'center', centres: 'center',
        metre: 'meter', metres: 'meter',
        litre: 'liter', litres: 'liter',
        grey: 'gray',
        aeroplane: 'airplane', aeroplanes: 'airplane',
        aluminium: 'aluminum',
        moustache: 'mustache',
        pyjamas: 'pajama', pajamas: 'pajama',
        jewellery: 'jewelry',
        cheque: 'check',
        tyre: 'tire',
        mum: 'mom', mummy: 'mommy',
        mice: 'mouse',
        geese: 'goose',
        teeth: 'tooth',
        feet: 'foot',
        children: 'child',
        men: 'man',
        women: 'woman',
        wolves: 'wolf',
        knives: 'knife',
        wives: 'wife',
        lives: 'life',
        leaves: 'leaf',
        loaves: 'loaf',
        halves: 'half',
        calves: 'calf',
        selves: 'self',
        shelves: 'shelf',
        thieves: 'thief',
        cacti: 'cactus',
        fungi: 'fungus',
        nuclei: 'nucleus',
        syllabi: 'syllabus',
        octopi: 'octopus',
        hippopotami: 'hippopotamus',
        phenomena: 'phenomenon',
        criteria: 'criterion',
        dice: 'die',
        oxen: 'ox',
        ate: 'eat', eaten: 'eat', eating: 'eat',
        ran: 'run', running: 'run',
        swam: 'swim', swum: 'swim', swimming: 'swim',
        drank: 'drink', drunk: 'drink', drinking: 'drink',
        sang: 'sing', sung: 'sing', singing: 'sing',
        wrote: 'write', written: 'write', writing: 'write',
        drove: 'drive', driven: 'drive', driving: 'drive',
        rode: 'ride', ridden: 'ride', riding: 'ride',
        spoke: 'speak', spoken: 'speak', speaking: 'speak',
        broke: 'break', broken: 'break', breaking: 'break',
        chose: 'choose', chosen: 'choose', choosing: 'choose',
        froze: 'freeze', frozen: 'freeze', freezing: 'freeze', freezer: 'freeze',
        stole: 'steal', stolen: 'steal', stealing: 'steal',
        woke: 'wake', woken: 'wake', waking: 'wake',
        wore: 'wear', worn: 'wear', wearing: 'wear',
        tore: 'tear', torn: 'tear', tearing: 'tear',
        flew: 'fly', flown: 'fly', flying: 'fly', flight: 'fly',
        grew: 'grow', grown: 'grow', growing: 'grow', growth: 'grow',
        knew: 'know', known: 'know', knowing: 'know',
        threw: 'throw', thrown: 'throw', throwing: 'throw',
        blew: 'blow', blown: 'blow', blowing: 'blow',
        drew: 'draw', drawn: 'draw', drawing: 'draw',
        bought: 'buy', buying: 'buy',
        brought: 'bring', bringing: 'bring',
        caught: 'catch', catching: 'catch',
        taught: 'teach', teaching: 'teach', teacher: 'teach', teachers: 'teach',
        thought: 'think', thinking: 'think',
        fought: 'fight', fighting: 'fight', fighter: 'fight',
        sought: 'seek', seeking: 'seek',
        built: 'build', building: 'build', buildings: 'build', builder: 'build',
        sent: 'send', sending: 'send',
        spent: 'spend', spending: 'spend',
        lent: 'lend', lending: 'lend',
        bent: 'bend', bending: 'bend',
        slept: 'sleep', sleeping: 'sleep', sleepy: 'sleep',
        kept: 'keep', keeping: 'keep', keeper: 'keep',
        wept: 'weep', weeping: 'weep',
        swept: 'sweep', sweeping: 'sweep',
        felt: 'feel', feeling: 'feel', feelings: 'feel',
        left: 'leave', leaving: 'leave',
        lost: 'lose', losing: 'lose', loser: 'lose',
        paid: 'pay', paying: 'pay', payment: 'pay',
        laid: 'lay', laying: 'lay',
        fed: 'feed', feeding: 'feed',
        bled: 'bleed', bleeding: 'bleed', blood: 'bleed', bloody: 'bleed',
        shot: 'shoot', shooting: 'shoot', shooter: 'shoot',
        held: 'hold', holding: 'hold', holder: 'hold',
        told: 'tell', telling: 'tell',
        sold: 'sell', selling: 'sell', seller: 'sell',
        heard: 'hear', hearing: 'hear',
        won: 'win', winning: 'win', winner: 'win', winners: 'win',
        sat: 'sit', sitting: 'sit',
        dug: 'dig', digging: 'dig',
        spun: 'spin', spinning: 'spin', spinner: 'spin',
        hung: 'hang', hanging: 'hang',
        stung: 'sting', stinging: 'sting',
        swung: 'swing', swinging: 'swing'
      };

      if (irregulars[w]) {
        w = irregulars[w];
      }

      if (w.length <= 3) return w;

      // Step 1: Strip plural / tense / participle suffixes first
      if (w.endsWith('ies') && w.length > 4) {
        w = w.slice(0, -3) + 'y';
      } else if (w.endsWith('ves') && w.length > 4) {
        w = w.slice(0, -3) + 'f';
      } else if (w.endsWith('es') && w.length > 4) {
        if (/(ches|shes|xes|zes|ses)$/.test(w)) {
          w = w.slice(0, -2);
        } else {
          w = w.slice(0, -1); // e.g. "pickles" -> "pickle", "bakes" -> "bake"
        }
      } else if (w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us') && !w.endsWith('is') && w.length > 3) {
        w = w.slice(0, -1);
      }

      if (irregulars[w]) {
        w = irregulars[w];
      }

      // Step 2: Strip derivational / inflectional suffixes (longest match first)
      const suffixes = [
        ['ational', 'ate'],
        ['tional', 'tion'],
        ['ization', 'ize'],
        ['isation', 'ise'],
        ['fulness', 'ful'],
        ['ousness', 'ous'],
        ['iveness', 'ive'],
        ['ability', 'abl'],
        ['ibility', 'ibl'],
        ['icity', 'ic'],
        ['tricity', 'tric'],
        ['ically', 'ic'],
        ['istic', ''],
        ['nosis', 'not'],
        ['notize', 'not'],
        ['notic', 'not'],
        ['ology', 'olog'],
        ['ologist', 'olog'],
        ['ologists', 'olog'],
        ['logical', 'log'],
        ['graphic', 'graph'],
        ['graphy', 'graph'],
        ['ation', ''],
        ['ition', 'it'],
        ['tion', 't'],
        ['sion', 's'],
        ['ment', ''],
        ['ness', ''],
        ['ship', ''],
        ['hood', ''],
        ['able', ''],
        ['ible', ''],
        ['ical', 'ic'],
        ['ian', ''],
        ['ism', ''],
        ['ist', ''],
        ['ize', ''],
        ['ise', ''],
        ['ify', ''],
        ['ing', ''],
        ['ings', ''],
        ['ed', ''],
        ['er', ''],
        ['or', ''],
        ['est', ''],
        ['ful', ''],
        ['less', ''],
        ['ous', '']
      ];

      for (const [suf, rep] of suffixes) {
        if (w.endsWith(suf) && (w.length - suf.length + rep.length) >= 3) {
          w = w.slice(0, -suf.length) + rep;
          break;
        }
      }

      // Step 3: Strip adverbial -ly only on longer words (>= 6 chars) so 5-letter words
      // like "curly", "early", "belly", "jelly" don't lose "ly"
      if (w.endsWith('ly') && w.length >= 6) {
        w = w.slice(0, -2);
      }

      // Step 4: Normalize trailing silent 'e' or 'y' and doubled consonants
      if (w.endsWith('e') && w.length > 3) {
        w = w.slice(0, -1);
      } else if (w.endsWith('y') && w.length > 3) {
        w = w.slice(0, -1);
      } else if (w.endsWith('i') && w.length > 3) {
        w = w.slice(0, -1);
      }

      // Collapse trailing doubled consonants after suffix stripping (e.g. "runn" -> "run", "shopp" -> "shop")
      if (w.length >= 4 && w[w.length - 1] === w[w.length - 2] && !/[aeiou]/.test(w[w.length - 1])) {
        w = w.slice(0, -1);
      }

      return w;
    }

    static stemPhrase(str) {
      const norm = this.normalize(str);
      if (!norm) return '';
      return norm
        .split(' ')
        .map(token => this.stemWord(token))
        .join(' ');
    }

    // Generate common morphological word-family forms for a single word
    static expandWordFamily(word) {
      const forms = new Set([word]);
      if (!word || word.length < 3 || word.includes(' ')) return Array.from(forms);

      // If word ends in -ing (e.g. "pickling", "baking", "running", "swimming", "cooking")
      if (word.endsWith('ing') && word.length >= 5) {
        const base = word.slice(0, -3);
        forms.add(base);               // "cook"
        forms.add(base + 's');         // "cooks"
        forms.add(base + 'ed');        // "cooked"
        forms.add(base + 'er');        // "cooker"
        forms.add(base + 'ers');       // "cookers"
        forms.add(base + 'e');         // "pickle", "bake"
        forms.add(base + 'es');        // "pickles", "bakes"
        forms.add(base + 'ed');        // "pickled", "baked"
        forms.add(base + 'er');        // "baker"
        if (base.length >= 3 && base[base.length - 1] === base[base.length - 2]) {
          const undoubled = base.slice(0, -1); // "runn" -> "run"
          forms.add(undoubled);
          forms.add(undoubled + 's');
          forms.add(undoubled + 'er');
          forms.add(undoubled + 'ers');
        }
      }

      // If word ends in -e (e.g. "pickle", "bake", "freeze", "dance")
      if (word.endsWith('e') && word.length >= 4) {
        const withoutE = word.slice(0, -1);
        forms.add(word + 's');         // "pickles", "bakes"
        forms.add(word + 'd');         // "pickled", "baked"
        forms.add(word + 'r');         // "baker", "freezer", "dancer"
        forms.add(word + 'rs');        // "bakers", "dancers"
        forms.add(withoutE + 'ing');   // "pickling", "baking", "freezing"
      }

      // If word ends in -y (e.g. "curly", "penny", "puppy", "berry")
      if (word.endsWith('y') && word.length >= 4 && !/[aeiou]y$/.test(word)) {
        const withoutY = word.slice(0, -1);
        forms.add(withoutY + 'ies');   // "pennies", "puppies", "berries"
        forms.add(withoutY + 'ied');
        forms.add(withoutY);           // "curl"
        forms.add(withoutY + 's');     // "curls"
        forms.add(withoutY + 'ed');    // "curled"
        forms.add(withoutY + 'ing');   // "curling"
      }

      // Standard singular/plural/verb expansions
      if (!word.endsWith('s')) {
        forms.add(word + 's');
        forms.add(word + 'es');
        forms.add(word + 'ed');
        forms.add(word + 'ing');
        forms.add(word + 'er');
        forms.add(word + 'y');
      } else {
        if (word.endsWith('ies') && word.length > 4) {
          const base = word.slice(0, -3);
          forms.add(base + 'y');
          forms.add(base + 'ied');
        } else if (word.endsWith('es') && word.length > 4) {
          const withoutEs = word.slice(0, -2);
          const withoutS = word.slice(0, -1);
          forms.add(withoutEs);
          forms.add(withoutS);         // "pickles" -> "pickle"
          forms.add(withoutEs + 'ing'); // "pickles" -> "pickling"
          forms.add(withoutEs + 'ed');  // "pickles" -> "pickled"
        } else if (!word.endsWith('ss') && word.length > 3) {
          const sing = word.slice(0, -1);
          forms.add(sing);
          forms.add(sing + 'ing');
          forms.add(sing + 'ed');
          forms.add(sing + 'y');       // "curls" -> "curly"
        }
      }

      return Array.from(forms);
    }

    static generateAliases(rawWord) {
      const aliases = new Set();
      const normRaw = this.normalize(rawWord);
      if (normRaw) aliases.add(normRaw);

      // 1. Remove parenthetical info: "Carbon dioxide (CO2)" -> "Carbon dioxide"
      const withoutParens = rawWord.replace(/\([^)]*\)/g, '').trim();
      const normWithoutParens = this.normalize(withoutParens);
      if (normWithoutParens) aliases.add(normWithoutParens);

      // 2. Extract contents inside parens: "Carbon dioxide (CO2)" -> "CO2"
      const parensMatch = rawWord.match(/\(([^)]+)\)/);
      if (parensMatch && parensMatch[1]) {
        const insideParens = this.normalize(parensMatch[1]);
        const genericQualifiers = ['band', 'film', 'game', 'tv series', 'series', 'rapper', 'album', 'city', 'song'];
        if (!genericQualifiers.includes(insideParens) && insideParens.length >= 2) {
          aliases.add(insideParens);
        }
      }

      // 3. Strip leading articles & common prefixes: "The Simpsons" -> "Simpsons"
      for (const alias of Array.from(aliases)) {
        if (alias.startsWith('the ')) aliases.add(alias.slice(4));
        if (alias.startsWith('a ')) aliases.add(alias.slice(2));
        if (alias.startsWith('an ')) aliases.add(alias.slice(3));
        if (alias.startsWith('mount ')) aliases.add(alias.slice(6));
        if (alias.startsWith('mt ')) aliases.add(alias.slice(3));
        if (alias.startsWith('st ')) aliases.add('saint ' + alias.slice(3));
        if (alias.startsWith('saint ')) aliases.add('st ' + alias.slice(6));
      }

      // 4. Common colloquialisms, abbreviations, and synonyms in words.json
      const customSynonymMap = {
        '50 cent': ['fifty cent', '50cent'],
        'martin luther king jr': ['mlk', 'martin luther king', 'dr king'],
        'john f kennedy': ['jfk', 'kennedy'],
        'franklin d roosevelt': ['fdr', 'roosevelt'],
        'air conditioner': ['ac', 'air conditioning', 'air con'],
        'television': ['tv', 'telly'],
        'united states of america': ['usa', 'united states', 'us', 'america'],
        'united kingdom': ['uk', 'great britain', 'britain', 'england'],
        'new york city': ['nyc', 'new york'],
        'world war ii': ['ww2', 'wwii', 'world war 2', 'second world war'],
        'world war i': ['ww1', 'wwi', 'world war 1', 'first world war'],
        'nineteen eighty four': ['1984'],
        'september 11 attacks': ['9 11', '911', 'september 11', 'sept 11'],
        'dwayne johnson': ['the rock', 'rock', 'dwayne the rock johnson'],
        'spongebob squarepants': ['spongebob', 'sponge bob'],
        'parks and recreation': ['parks and rec'],
        'grandmother': ['grandma', 'granny', 'nana', 'grandmom'],
        'grandfather': ['grandpa', 'granddad', 'gramps'],
        'mother': ['mom', 'mum', 'mama', 'mommy'],
        'father': ['dad', 'daddy', 'papa'],
        'firefighter': ['fireman', 'firemen', 'fire fighters'],
        'police officer': ['police', 'cop', 'cops', 'policeman', 'policewoman'],
        'mobile phone': ['cell phone', 'cellphone', 'phone', 'smartphone', 'smart phone'],
        'french fries': ['fries', 'chips'],
        'automobiles': ['cars', 'car', 'automobile', 'auto'],
        'automobile': ['car', 'cars', 'auto'],
        'bicycle': ['bike', 'bikes', 'biking', 'cycling'],
        'motorcycle': ['motorbike', 'bike'],
        'refrigerator': ['fridge', 'icebox'],
        'microphone': ['mic', 'mike'],
        'veterinarian': ['vet', 'vets'],
        'doctor': ['md', 'physician', 'doc'],
        'professor': ['prof'],
        'mathematics': ['math', 'maths'],
        'gymnastics': ['gymnast', 'gymnasts'],
        'photography': ['photographer', 'photographs', 'photograph', 'photo', 'photos'],
        'electricity': ['electric', 'electrical'],
        'eyeglasses': ['glasses', 'spectacles'],
        'sunglasses': ['shades', 'sun glasses'],
        'christmas': ['xmas', 'christmastime'],
        'halloween': ['all hallows eve'],
        'ultraviolet': ['uv', 'uv light', 'uv rays'],
        'deoxyribonucleic acid': ['dna'],
        'ribonucleic acid': ['rna'],
        'artificial intelligence': ['ai'],
        'virtual reality': ['vr'],
        'extraterrestrial': ['et', 'alien', 'aliens'],
        'ufo': ['unidentified flying object'],
        'scuba diving': ['scuba', 'diving'],
        'pb and j': ['peanut butter and jelly', 'pbj'],
        'macaroni and cheese': ['mac and cheese', 'mac n cheese'],

        // Demonyms, nationalities, languages, and country variants
        'greece': ['greek', 'greeks', 'hellenic'],
        'greek': ['greece', 'greeks'],
        'greeks': ['greece', 'greek'],
        'france': ['french', 'frenchman', 'frenchwoman'],
        'french': ['france'],
        'spain': ['spanish', 'spaniard', 'spaniards'],
        'spanish': ['spain'],
        'italy': ['italian', 'italians'],
        'italian': ['italy', 'italians'],
        'germany': ['german', 'germans'],
        'german': ['germany', 'germans'],
        'england': ['english', 'englishman', 'britain', 'british', 'brit', 'brits'],
        'english': ['england', 'britain', 'british'],
        'britain': ['british', 'brit', 'brits', 'england', 'english', 'uk', 'united kingdom', 'great britain'],
        'british': ['britain', 'great britain', 'uk', 'united kingdom', 'england', 'english'],
        'scotland': ['scottish', 'scot', 'scots'],
        'scottish': ['scotland', 'scots', 'scot'],
        'ireland': ['irish', 'irishman'],
        'irish': ['ireland'],
        'wales': ['welsh'],
        'welsh': ['wales'],
        'netherlands': ['dutch', 'holland'],
        'holland': ['netherlands', 'dutch'],
        'dutch': ['netherlands', 'holland'],
        'switzerland': ['swiss'],
        'swiss': ['switzerland'],
        'sweden': ['swedish', 'swede', 'swedes'],
        'swedish': ['sweden', 'swedes'],
        'norway': ['norwegian', 'norwegians'],
        'norwegian': ['norway', 'norwegians'],
        'denmark': ['danish', 'dane', 'danes'],
        'danish': ['denmark', 'danes', 'dane'],
        'finland': ['finnish', 'finn', 'finns'],
        'finnish': ['finland', 'finns'],
        'poland': ['polish', 'pole', 'poles'],
        'polish': ['poland', 'poles'],
        'portugal': ['portuguese'],
        'portuguese': ['portugal'],
        'russia': ['russian', 'russians', 'soviet', 'ussr'],
        'russian': ['russia', 'russians'],
        'china': ['chinese'],
        'chinese': ['china'],
        'japan': ['japanese'],
        'japanese': ['japan'],
        'korea': ['korean', 'koreans'],
        'south korea': ['korean', 'koreans', 'korea'],
        'north korea': ['korean', 'koreans', 'korea'],
        'korean': ['korea', 'south korea'],
        'mexico': ['mexican', 'mexicans'],
        'mexican': ['mexico', 'mexicans'],
        'canada': ['canadian', 'canadians'],
        'canadian': ['canada', 'canadians'],
        'australia': ['australian', 'australians', 'aussie', 'aussies'],
        'australian': ['australia', 'aussie'],
        'brazil': ['brazilian', 'brazilians'],
        'brazilian': ['brazil', 'brazilians'],
        'argentina': ['argentine', 'argentinian', 'argentinians'],
        'argentinian': ['argentina', 'argentine'],
        'egypt': ['egyptian', 'egyptians'],
        'egyptian': ['egypt', 'egyptians'],
        'turkey': ['turkish', 'turk', 'turks'],
        'turkish': ['turkey', 'turks'],
        'israel': ['israeli', 'israelis', 'jewish', 'judaism'],
        'israeli': ['israel', 'israelis'],
        'iran': ['iranian', 'iranians', 'persia', 'persian', 'persians'],
        'persia': ['persian', 'persians', 'iran', 'iranian'],
        'persian': ['persia', 'iran', 'iranian'],
        'rome': ['roman', 'romans'],
        'roman': ['rome', 'romans'],
        'athens': ['athenian', 'athenians'],
        'athenian': ['athens', 'athenians'],
        'sparta': ['spartan', 'spartans'],
        'spartan': ['sparta', 'spartans'],
        'africa': ['african', 'africans'],
        'african': ['africa', 'africans'],
        'asia': ['asian', 'asians'],
        'asian': ['asia', 'asians'],
        'europe': ['european', 'europeans'],
        'european': ['europe', 'europeans'],
        'america': ['american', 'americans', 'usa', 'united states'],
        'american': ['america', 'united states', 'usa'],
        'india': ['indian', 'indians'],
        'indian': ['india', 'indians'],
        'cuba': ['cuban', 'cubans'],
        'cuban': ['cuba', 'cubans'],
        'jamaica': ['jamaican', 'jamaicans'],
        'jamaican': ['jamaica', 'jamaicans'],
        'iceland': ['icelandic'],
        'icelandic': ['iceland'],
        'austria': ['austrian', 'austrians'],
        'austrian': ['austria'],
        'belgium': ['belgian', 'belgians'],
        'belgian': ['belgium'],
        'czech republic': ['czech', 'czechia'],
        'czechia': ['czech', 'czech republic'],
        'czech': ['czech republic', 'czechia'],
        'hungary': ['hungarian', 'hungarians'],
        'hungarian': ['hungary'],
        'ukraine': ['ukrainian', 'ukrainians'],
        'ukrainian': ['ukraine'],
        'vietnam': ['vietnamese'],
        'vietnamese': ['vietnam'],
        'thailand': ['thai'],
        'thai': ['thailand'],
        'philippines': ['filipino', 'filipinos', 'philippine'],
        'filipino': ['philippines'],
        'indonesia': ['indonesian', 'indonesians'],
        'indonesian': ['indonesia'],
        'pakistan': ['pakistani', 'pakistanis'],
        'pakistani': ['pakistan'],
        'colombia': ['colombian', 'colombians'],
        'colombian': ['colombia'],
        'peru': ['peruvian', 'peruvians'],
        'peruvian': ['peru'],
        'chile': ['chilean', 'chileans'],
        'chilean': ['chile'],
        'venezuela': ['venezuelan', 'venezuelans'],
        'venezuelan': ['venezuela'],
        'hawaii': ['hawaiian', 'hawaiians'],
        'hawaiian': ['hawaii'],

        // Religions, philosophies, and adherents
        'christianity': ['christian', 'christians'],
        'christian': ['christianity', 'christians'],
        'catholicism': ['catholic', 'catholics'],
        'catholic': ['catholicism', 'catholics'],
        'protestantism': ['protestant', 'protestants'],
        'protestant': ['protestantism', 'protestants'],
        'judaism': ['jewish', 'jew', 'jews', 'judaic'],
        'jewish': ['judaism', 'jew', 'jews'],
        'islam': ['muslim', 'muslims', 'islamic'],
        'muslim': ['islam', 'islamic', 'muslims'],
        'islamic': ['islam', 'muslim'],
        'buddhism': ['buddhist', 'buddhists', 'buddha'],
        'buddhist': ['buddhism', 'buddha'],
        'hinduism': ['hindu', 'hindus'],
        'hindu': ['hinduism', 'hindus'],
        'mormonism': ['mormon', 'mormons'],
        'mormon': ['mormonism', 'mormons'],
        'socialism': ['socialist', 'socialists'],
        'socialist': ['socialism', 'socialists'],
        'capitalism': ['capitalist', 'capitalists'],
        'capitalist': ['capitalism', 'capitalists'],
        'communism': ['communist', 'communists'],
        'communist': ['communism', 'communists'],
        'fascism': ['fascist', 'fascists'],
        'fascist': ['fascism', 'fascists'],
        'anarchism': ['anarchist', 'anarchists'],
        'anarchist': ['anarchism', 'anarchists'],
        'democracy': ['democrat', 'democratic', 'democrats'],

        // Sciences, fields, and professions
        'astronomy': ['astronomer', 'astronomers'],
        'astronomer': ['astronomy'],
        'astrology': ['astrologer', 'astrologers'],
        'astrologer': ['astrology'],
        'biology': ['biologist', 'biologists', 'biological'],
        'biologist': ['biology'],
        'chemistry': ['chemist', 'chemists', 'chemical', 'chemicals'],
        'chemist': ['chemistry'],
        'physics': ['physicist', 'physicists', 'physical'],
        'physicist': ['physics'],
        'geology': ['geologist', 'geologists'],
        'geologist': ['geology'],
        'psychology': ['psychologist', 'psychologists', 'psychological'],
        'psychologist': ['psychology'],
        'philosophy': ['philosopher', 'philosophers', 'philosophical'],
        'philosopher': ['philosophy'],
        'archaeology': ['archaeologist', 'archaeologists'],
        'archaeologist': ['archaeology'],
        'economics': ['economist', 'economists', 'economic'],
        'economist': ['economics'],
        'mathematics': ['mathematician', 'mathematicians', 'math', 'maths'],
        'mathematician': ['mathematics', 'math'],
        'music': ['musician', 'musicians', 'musical'],
        'musician': ['music'],
        'magic': ['magician', 'magicians', 'magical'],
        'magician': ['magic'],
        'politics': ['politician', 'politicians', 'political'],
        'politician': ['politics'],
        'sculpture': ['sculptor', 'sculptors'],
        'sculptor': ['sculpture'],
        'architecture': ['architect', 'architects'],
        'architect': ['architecture'],
        'dentistry': ['dentist', 'dentists'],
        'dentist': ['dentistry'],
        'surgery': ['surgeon', 'surgeons', 'surgical'],
        'surgeon': ['surgery']
      };

      for (const baseAlias of Array.from(aliases)) {
        if (customSynonymMap[baseAlias]) {
          for (const syn of customSynonymMap[baseAlias]) {
            aliases.add(syn);
          }
        }
      }

      // 5. Significant surname or distinctive key token for multi-word names/titles
      const words = normWithoutParens.split(' ');
      if (words.length >= 2 && words.length <= 4) {
        const lastWord = words[words.length - 1];
        const genericExclusions = [
          'power', 'disaster', 'game', 'theory', 'tree', 'river', 'city', 'state', 'cup',
          'bowl', 'park', 'square', 'house', 'road', 'street', 'wall', 'room', 'size',
          'death', 'war', 'series', 'disorders', 'syndrome', 'number', 'penis', 'virus',
          'acid', 'table', 'logo', 'band', 'film', 'food', 'system', 'machine', 'light',
          'water', 'paper', 'card', 'cards', 'board', 'ball', 'balls', 'bear', 'bears',
          'dog', 'dogs', 'cat', 'cats', 'fish', 'bird', 'birds', 'cake', 'pie', 'sauce'
        ];
        if (lastWord.length >= 4 && !genericExclusions.includes(lastWord)) {
          aliases.add(lastWord);
        }
        const firstWord = words[0];
        if (['sherlock', 'napoleon', 'beyonce', 'adele', 'madonna', 'rihanna', 'elvis', 'mozart', 'beethoven', 'shakespeare', 'galileo', 'aristotle', 'socrates', 'plato', 'cleopatra', 'rembrandt', 'picasso', 'michelangelo'].includes(firstWord)) {
          aliases.add(firstWord);
        }
      }

      // 6. Expand morphological word families for all single-word aliases (e.g. "pickling" -> "pickle", "pickles", "pickled")
      for (const alias of Array.from(aliases)) {
        if (!alias.includes(' ')) {
          for (const variant of this.expandWordFamily(alias)) {
            aliases.add(variant);
          }
        } else {
          // Also add plural/singular of the last word in multi-word phrases
          const parts = alias.split(' ');
          const last = parts[parts.length - 1];
          const prefix = parts.slice(0, -1).join(' ');
          for (const lastVar of this.expandWordFamily(last)) {
            aliases.add(`${prefix} ${lastVar}`);
          }
        }
      }

      return Array.from(aliases);
    }

    static editDistance(s1, s2) {
      const len1 = s1.length;
      const len2 = s2.length;
      const d = [];

      for (let i = 0; i <= len1; i++) d[i] = [i];
      for (let j = 0; j <= len2; j++) d[0][j] = j;

      for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
          const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
          d[i][j] = Math.min(
            d[i - 1][j] + 1,
            d[i][j - 1] + 1,
            d[i - 1][j - 1] + cost
          );

          if (i > 1 && j > 1 && s1[i - 1] === s2[j - 2] && s1[i - 2] === s2[j - 1]) {
            d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
          }
        }
      }

      return d[len1][len2];
    }

    static getSignificantStemTokens(str) {
      const stopWords = new Set([
        'the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for', 'and', 'or', 'with',
        'by', 'from', 'as', 'your', 'my', 'our', 'their', 'his', 'her', 'its', 'one', 'ones'
      ]);
      const norm = this.normalize(str);
      if (!norm) return [];
      const rawTokens = norm.split(' ').filter(Boolean);
      const filtered = rawTokens.filter(t => !stopWords.has(t));
      const tokensToUse = filtered.length > 0 ? filtered : rawTokens;
      return tokensToUse.map(t => this.stemWord(t)).filter(Boolean);
    }

    static evaluateGuess(userGuess, targetWord) {
      const cleanGuess = this.normalize(userGuess);
      if (!cleanGuess) return { isCorrect: false, isTypo: false, isClose: false, message: 'Please enter a guess.' };

      const aliases = this.generateAliases(targetWord);

      // 1. Direct alias or word-family match (includes "pickles" for "Pickling")
      if (aliases.includes(cleanGuess)) {
        return { isCorrect: true, isTypo: false, isClose: false, targetWord };
      }

      // 2. Spaceless compound match (e.g. "nailbiting" <-> "nail biting", "spiderman" <-> "spider man")
      const spacelessGuess = cleanGuess.replace(/\s+/g, '');
      if (spacelessGuess.length >= 4) {
        for (const alias of aliases) {
          if (alias.replace(/\s+/g, '') === spacelessGuess) {
            return { isCorrect: true, isTypo: false, isClose: false, targetWord };
          }
        }
      }

      // 3. Morphological stem match against any generated alias
      // e.g. "pickling" (stem: "pickl") <-> "pickles" (stem: "pickl")
      const guessStem = this.stemPhrase(cleanGuess);
      if (guessStem && guessStem.length >= 3) {
        for (const alias of aliases) {
          const aliasStem = this.stemPhrase(alias);
          if (aliasStem && aliasStem.length >= 3 && guessStem === aliasStem) {
            return { isCorrect: true, isTypo: false, isClose: false, targetWord };
          }
          // Spaceless stem match (e.g. "nailbiter" -> "nailbit" vs "nail biting" -> "nail bit")
          if (guessStem.replace(/\s+/g, '') === aliasStem.replace(/\s+/g, '') && aliasStem.replace(/\s+/g, '').length >= 5) {
            return { isCorrect: true, isTypo: false, isClose: false, targetWord };
          }
        }
      }

      // 4. Multi-word token-order-independent stem matching
      // e.g. "Nail biting" <-> "biting nails", "bite nails", "biting your nails"
      const targetStemTokens = this.getSignificantStemTokens(targetWord.replace(/\([^)]*\)/g, ''));
      const guessStemTokens = this.getSignificantStemTokens(cleanGuess);
      if (targetStemTokens.length >= 2 && guessStemTokens.length >= 2) {
        const targetSet = new Set(targetStemTokens);
        const guessSet = new Set(guessStemTokens);
        const allTargetPresent = Array.from(targetSet).every(t => guessSet.has(t));
        if (allTargetPresent && guessSet.size <= targetSet.size + 1) {
          return { isCorrect: true, isTypo: false, isClose: false, targetWord };
        }
      }

      // 5. Fuzzy Levenshtein typo tolerance against all aliases and stems
      const primaryTarget = this.normalize(targetWord.replace(/\([^)]*\)/g, ''));
      let bestDistance = Infinity;
      let closestAlias = '';

      for (const alias of aliases) {
        const dist = this.editDistance(cleanGuess, alias);
        if (dist < bestDistance) {
          bestDistance = dist;
          closestAlias = alias;
        }
      }

      const aliasLen = closestAlias.length;
      const isPrimaryAlias = (closestAlias === primaryTarget || closestAlias === this.normalize(targetWord));
      const similarity = 1 - (bestDistance / Math.max(aliasLen, cleanGuess.length));

      let allowedTypoDist = 0;
      if (isPrimaryAlias && aliasLen >= 8 && cleanGuess.length >= 6) allowedTypoDist = 2;
      else if (aliasLen >= 4 && cleanGuess.length >= 4) allowedTypoDist = 1;

      if (bestDistance <= allowedTypoDist || (isPrimaryAlias && similarity >= 0.85)) {
        return {
          isCorrect: true,
          isTypo: true,
          isClose: false,
          targetWord,
          matchedAlias: closestAlias
        };
      }

      // Also check edit distance on stems (e.g. slight typo on a morphological variant)
      if (guessStem && guessStem.length >= 5) {
        for (const alias of aliases) {
          const aliasStem = this.stemPhrase(alias);
          if (aliasStem && aliasStem.length >= 5 && this.editDistance(guessStem, aliasStem) <= 1) {
            return {
              isCorrect: true,
              isTypo: true,
              isClose: false,
              targetWord,
              matchedAlias: alias
            };
          }
        }
      }

      if (bestDistance <= 3 || (aliasLen >= 8 && bestDistance <= 4)) {
        return {
          isCorrect: false,
          isTypo: false,
          isClose: true,
          message: `Warm! Very close to the spelling.`
        };
      }

      return {
        isCorrect: false,
        isTypo: false,
        isClose: false,
        message: `Incorrect guess!`
      };
    }
  }

  // =========================================================================
  // 4. GAME CONTROLLER
  // =========================================================================
  class ReverseTabooGame {
    constructor() {
      this.currentRoundIndex = 0;
      this.wordsInGame = [];
      this.currentWord = null;

      // Active word state
      this.revealedClues = [];
      this.guesses = [];
      this.isWordSolved = false;

      // Overall game metrics
      this.totalElapsedMs = 0;
      this.currentRunStart = null;
      this.timerInterval = null;
      this.isGameActive = false;
      this.isGameOver = false;

      this.roundSummaries = [];
      this.cachedPermutation = null;

      this.initDom();
      this.bindEvents();

      // Instant startup: If words.js pre-loaded WORDS_POOL into memory, start immediately with 0ms delay!
      if (typeof window !== 'undefined' && Array.isArray(window.WORDS_POOL) && window.WORDS_POOL.length > 50) {
        WORDS_POOL = window.WORDS_POOL;
        this.dom.datasetStatus.innerHTML = `
          <span class="status-indicator"></span> 
          Connected: <strong>${WORDS_POOL.length.toLocaleString()} words</strong> available
        `;
        this.startNewGame();
      } else {
        this.loadDataset();
      }
    }

    initDom() {
      this.dom = {
        puzzleIdBadge: document.getElementById('puzzleIdBadge'),
        soundToggleBtn: document.getElementById('soundToggleBtn'),
        soundIcon: document.getElementById('soundIcon'),
        helpModalBtn: document.getElementById('helpModalBtn'),
        statsModalBtn: document.getElementById('statsModalBtn'),
        roundStepper: document.getElementById('roundStepper'),
        stepChips: [
          document.getElementById('stepChip-0'),
          document.getElementById('stepChip-1'),
          document.getElementById('stepChip-2')
        ],
        timerDisplay: document.getElementById('timerDisplay'),
        revealedCluesCount: document.getElementById('revealedCluesCount'),
        totalCluesCount: document.getElementById('totalCluesCount'),
        modeBanner: document.getElementById('modeBanner'),
        cluesCaption: document.getElementById('cluesCaption'),
        cluesGrid: document.getElementById('cluesGrid'),
        wordHintBox: document.getElementById('wordHintBox'),
        hintBadge: document.getElementById('hintBadge'),
        hintTitle: document.getElementById('hintTitle'),
        wordDashesDisplay: document.getElementById('wordDashesDisplay'),
        guessForm: document.getElementById('guessForm'),
        guessInput: document.getElementById('guessInput'),
        submitGuessBtn: document.getElementById('submitGuessBtn'),
        inputWrapper: document.querySelector('.input-wrapper'),
        revealClueBtn: document.getElementById('revealClueBtn'),
        skipWordBtn: document.getElementById('skipWordBtn'),
        actionBar: document.getElementById('actionBar'),
        revealedAnswerBanner: document.getElementById('revealedAnswerBanner'),
        revealedTag: document.getElementById('revealedTag'),
        revealedPenaltyNote: document.getElementById('revealedPenaltyNote'),
        revealedLead: document.getElementById('revealedLead'),
        revealedTargetWord: document.getElementById('revealedTargetWord'),
        revealedStats: document.getElementById('revealedStats'),
        proceedNextWordBtn: document.getElementById('proceedNextWordBtn'),
        proceedBtnText: document.getElementById('proceedBtnText'),
        skipModal: document.getElementById('skipModal'),
        cancelSkipBtn: document.getElementById('cancelSkipBtn'),
        confirmSkipBtn: document.getElementById('confirmSkipBtn'),
        feedbackToast: document.getElementById('feedbackToast'),
        historyChips: document.getElementById('historyChips'),
        datasetStatus: document.getElementById('datasetStatus'),
        
        // Modals
        victoryModal: document.getElementById('victoryModal'),
        statFinalTime: document.getElementById('statFinalTime'),
        statTotalClues: document.getElementById('statTotalClues'),
        statWrongGuesses: document.getElementById('statWrongGuesses'),
        statRank: document.getElementById('statRank'),
        solvedWordsList: document.getElementById('solvedWordsList'),
        shareTextPreview: document.getElementById('shareTextPreview'),
        copyShareBtn: document.getElementById('copyShareBtn'),
        copyShareModalBtn: document.getElementById('copyShareModalBtn'),
        copiedBadge: document.getElementById('copiedBadge'),
        closeVictoryModalBtn: document.getElementById('closeVictoryModalBtn'),
        
        helpModal: document.getElementById('helpModal'),
        closeHelpModalBtn: document.getElementById('closeHelpModalBtn'),
        helpGotItBtn: document.getElementById('helpGotItBtn'),
        
        statsModal: document.getElementById('statsModal'),
        closeStatsModalBtn: document.getElementById('closeStatsModalBtn'),
        closeStatsBtn: document.getElementById('closeStatsBtn'),
        statGamesPlayed: document.getElementById('statGamesPlayed'),
        statGamesWon: document.getElementById('statGamesWon'),
        statBestTime: document.getElementById('statBestTime'),
        statAvgClues: document.getElementById('statAvgClues'),
        recentGamesList: document.getElementById('recentGamesList')
      };

      this.updateSoundIcon();
    }

    bindEvents() {
      // Sound toggle
      this.dom.soundToggleBtn.addEventListener('click', () => {
        sound.toggle();
        this.updateSoundIcon();
      });

      // Modals
      this.dom.helpModalBtn.addEventListener('click', () => this.openModal(this.dom.helpModal));
      this.dom.closeHelpModalBtn.addEventListener('click', () => this.closeModal(this.dom.helpModal));
      this.dom.helpGotItBtn.addEventListener('click', () => this.closeModal(this.dom.helpModal));

      this.dom.statsModalBtn.addEventListener('click', () => {
        this.renderStats();
        this.openModal(this.dom.statsModal);
      });
      this.dom.closeStatsModalBtn.addEventListener('click', () => this.closeModal(this.dom.statsModal));
      this.dom.closeStatsBtn.addEventListener('click', () => this.closeModal(this.dom.statsModal));

      this.dom.closeVictoryModalBtn.addEventListener('click', () => this.closeModal(this.dom.victoryModal));
      
      if (this.dom.copyShareModalBtn) {
        this.dom.copyShareModalBtn.addEventListener('click', () => this.copyShareResult());
      }

      // Guess submission
      this.dom.guessForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleGuessSubmit();
      });

      // Reveal Clue Action
      this.dom.revealClueBtn.addEventListener('click', () => this.handleManualClueReveal());

      // Skip word confirmation & proceed flow (No browser alerts!)
      this.dom.skipWordBtn.addEventListener('click', () => this.openSkipModal());
      this.dom.cancelSkipBtn.addEventListener('click', () => this.closeSkipModal());
      this.dom.confirmSkipBtn.addEventListener('click', () => this.executeSkipWord());
      this.dom.proceedNextWordBtn.addEventListener('click', () => this.proceedAfterReveal());

      // Share button
      this.dom.copyShareBtn.addEventListener('click', () => this.copyShareResult());

      // Keyboard focus helper
      window.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== this.dom.guessInput) {
          e.preventDefault();
          this.dom.guessInput.focus();
        }
      });
    }

    updateSoundIcon() {
      this.dom.soundIcon.textContent = sound.enabled ? '🔊' : '🔇';
    }

    openModal(modal) {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    }

    closeModal(modal) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }

    async loadDataset() {
      try {
        const response = await fetch('./words.json');
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            WORDS_POOL = data;
            this.dom.datasetStatus.innerHTML = `
              <span class="status-indicator"></span> 
              Connected: <strong>${WORDS_POOL.length.toLocaleString()} words</strong> available
            `;
          }
        }
      } catch (err) {
        console.info('Loaded with bundled curated word bank');
        this.dom.datasetStatus.innerHTML = `
          <span class="status-indicator" style="background:#38bdf8;"></span> 
          Offline Mode: Curated word bank ready
        `;
      }

      this.startNewGame();
    }

    // =========================================================================
    // 5. DETERMINISTIC ZERO-DUPLICATE DAILY SELECTION
    // =========================================================================
    getSeededPermutation(totalItems, seed = 20261012) {
      const arr = Array.from({ length: totalItems }, (_, i) => i);
      let s = seed;
      function random() {
        s |= 0; s = s + 0x6D2B79F5 | 0;
        let t = Math.imul(s ^ s >>> 15, 1 | s);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      }
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    getDailyWords() {
      const now = new Date();
      // Rolling local midnight: use player's local calendar date
      const localToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const localAnchor = new Date(2026, 0, 1);
      // Calendar day count elapsed in local time (Math.round safeguards DST changes)
      const diffDays = Math.max(1, Math.round((localToday - localAnchor) / (1000 * 60 * 60 * 24)));
      this.dailyPuzzleNumber = diffDays;
      this.dom.puzzleIdBadge.textContent = `DAILY #${String(diffDays).padStart(3, '0')}`;

      const poolLen = WORDS_POOL.length;
      if (!this.cachedPermutation || this.cachedPermutation.length !== poolLen) {
        this.cachedPermutation = this.getSeededPermutation(poolLen, 20261012);
      }

      // Pick 3 consecutive unique words from the fixed permutation
      const startIndex = ((diffDays - 1) * 3) % poolLen;
      const idx1 = this.cachedPermutation[startIndex % poolLen];
      const idx2 = this.cachedPermutation[(startIndex + 1) % poolLen];
      const idx3 = this.cachedPermutation[(startIndex + 2) % poolLen];

      return [WORDS_POOL[idx1], WORDS_POOL[idx2], WORDS_POOL[idx3]];
    }

    startNewGame() {
      this.stopTimer();
      this.totalElapsedMs = 0;
      this.currentRunStart = null;
      this.currentRoundIndex = 0;
      this.roundSummaries = [];
      this.isGameOver = false;
      this.postHintGuesses = 0;

      this.dom.timerDisplay.textContent = '00:00.0';
      this.wordsInGame = this.getDailyWords();
      this.loadWordForCurrentRound();
    }

    loadWordForCurrentRound() {
      this.currentWord = this.wordsInGame[this.currentRoundIndex];
      this.guesses = [];
      this.isWordSolved = false;
      this.postHintGuesses = 0;
      this.firstLetterUnlocked = false;

      // Update stepper UI
      this.dom.stepChips.forEach((chip, i) => {
        chip.classList.toggle('active', i === this.currentRoundIndex);
        chip.classList.toggle('completed', i < this.currentRoundIndex);
      });

      // Clear history chips
      this.dom.historyChips.innerHTML = '<span class="history-placeholder">No guesses yet for this word. Take a shot!</span>';

      // Clear input
      this.dom.guessInput.value = '';
      this.dom.guessInput.disabled = false;
      this.dom.submitGuessBtn.disabled = false;
      this.dom.revealClueBtn.disabled = false;
      this.dom.guessInput.focus();

      // Always show word length dashes from the start (with starting letter hidden until all clues revealed)
      this.renderWordHint(false);

      if (this.dom.revealedAnswerBanner) {
        this.dom.revealedAnswerBanner.classList.remove('active');
      }
      this.dom.guessForm.style.display = 'block';
      this.dom.actionBar.style.display = 'flex';

      // Start with 2 clues revealed
      const totalClues = this.currentWord.prohibited.length;
      this.dom.totalCluesCount.textContent = totalClues;
      const initialCount = Math.min(2, totalClues);
      this.revealedClues = Array.from({ length: initialCount }, (_, i) => i);

      this.renderClues();
      this.updateCluesCounter();
    }

    revealAllClues() {
      const totalClues = this.currentWord.prohibited.length;
      this.revealedClues = Array.from({ length: totalClues }, (_, i) => i);
      this.renderClues();
      this.updateCluesCounter();
    }

    renderClues() {
      const prohibited = this.currentWord.prohibited;
      this.dom.cluesGrid.innerHTML = '';

      prohibited.forEach((clueWord, index) => {
        const isRevealed = this.revealedClues.includes(index);
        const card = document.createElement('div');
        card.className = `clue-card ${isRevealed ? 'revealed' : ''}`;
        card.id = `clueCard-${index}`;

        card.innerHTML = `
          <div class="clue-card-inner">
            <div class="clue-front">
              <span class="lock-icon">🔒</span>
              <span class="clue-placeholder-label">Clue #${index + 1}</span>
            </div>
            <div class="clue-back">
              <span class="clue-badge" id="clueBadge-${index}">Taboo #${index + 1}</span>
              <span class="clue-text">${clueWord}</span>
            </div>
          </div>
        `;

        this.dom.cluesGrid.appendChild(card);
      });
    }

    updateCluesCounter() {
      const revealed = this.revealedClues.length;
      const total = this.currentWord.prohibited.length;
      this.dom.revealedCluesCount.textContent = revealed;
      this.dom.totalCluesCount.textContent = total;

      if (revealed >= total) {
        this.dom.revealClueBtn.disabled = true;
      } else {
        this.dom.revealClueBtn.disabled = false;
      }
    }

    // =========================================================================
    // 6. TIMER ENGINE (Pauseable Stopwatch)
    // =========================================================================
    startTimerIfNeeded() {
      if (this.isGameActive || this.isGameOver) return;
      this.isGameActive = true;
      this.currentRunStart = performance.now();

      if (!this.timerInterval) {
        this.timerInterval = setInterval(() => {
          if (!this.isGameActive) return;
          this.updateTimerDisplay();
        }, 50);
      }
    }

    stopTimer() {
      if (this.isGameActive) {
        if (this.currentRunStart !== null) {
          this.totalElapsedMs += (performance.now() - this.currentRunStart);
          this.currentRunStart = null;
        }
        this.isGameActive = false;
      }
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
      this.updateTimerDisplay();
    }

    addPenalty(seconds) {
      this.totalElapsedMs += seconds * 1000;
      this.updateTimerDisplay();
      this.showToast(`+${seconds}s Penalty Added!`, 'error');
    }

    getElapsedMs() {
      let total = this.totalElapsedMs;
      if (this.isGameActive && this.currentRunStart !== null) {
        total += (performance.now() - this.currentRunStart);
      }
      return total;
    }

    formatTime(ms) {
      const totalSeconds = Math.floor(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const tenths = Math.floor((ms % 1000) / 100);

      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`;
    }

    updateTimerDisplay() {
      this.dom.timerDisplay.textContent = this.formatTime(this.getElapsedMs());
    }

    // =========================================================================
    // 7. PROHIBITED WORD INTERCEPTION & LETTER DASH HINTS
    // =========================================================================
    checkProhibitedWordGuess(guess, exactOnly = false) {
      const cleanGuess = FuzzyMatcher.normalize(guess);
      if (!cleanGuess) return null;

      // If the guess is a valid answer for the secret target word (exact, alias, demonym, or stem),
      // never intercept it as a clue — the player solved the round!
      const targetEval = FuzzyMatcher.evaluateGuess(guess, this.currentWord.word);
      if (targetEval.isCorrect) return null;

      const guessStem = FuzzyMatcher.stemPhrase(cleanGuess);
      const prohibited = this.currentWord.prohibited;

      for (let i = 0; i < prohibited.length; i++) {
        const clueWord = prohibited[i];
        const normClue = FuzzyMatcher.normalize(clueWord);
        if (!normClue) continue;

        // 1. Exact or direct singular/plural match of the prohibited clue
        if (
          cleanGuess === normClue ||
          cleanGuess === normClue + 's' ||
          cleanGuess + 's' === normClue
        ) {
          return {
            index: i,
            clueWord,
            isAlreadyRevealed: this.revealedClues.includes(i)
          };
        }

        if (exactOnly) continue;

        // 2. Permissive morphological word-family / stem match or 1-char typo on prohibited clue
        // e.g. user enters "pickles" when "pickling" is an unrevealed prohibited clue
        const clueFamily = FuzzyMatcher.expandWordFamily(normClue);
        const clueStem = FuzzyMatcher.stemPhrase(normClue);
        const isStemMatch = guessStem.length >= 3 && clueStem.length >= 3 && guessStem === clueStem;
        const isFamilyMatch = clueFamily.includes(cleanGuess);
        const isTypoMatch = normClue.length >= 4 && FuzzyMatcher.editDistance(cleanGuess, normClue) <= 1;

        if (isFamilyMatch || isStemMatch || isTypoMatch) {
          return {
            index: i,
            clueWord,
            isAlreadyRevealed: this.revealedClues.includes(i)
          };
        }
      }
      return null;
    }

    unlockSpecificClue(index, byUser = false) {
      if (this.revealedClues.includes(index)) return;
      this.revealedClues.push(index);

      const card = document.getElementById(`clueCard-${index}`);
      if (card) {
        card.classList.add('revealed', 'just-unlocked');
        if (byUser) {
          card.classList.add('revealed-by-user');
          const badge = document.getElementById(`clueBadge-${index}`);
          if (badge) badge.textContent = 'FREE REVEAL! ✓';
        }
        sound.playFlip();
      }

      this.updateCluesCounter();
      this.checkAndRenderWordHint();
    }

    unlockNextClue() {
      const totalClues = this.currentWord.prohibited.length;
      if (this.revealedClues.length >= totalClues) {
        this.checkAndRenderWordHint();
        return;
      }

      for (let i = 0; i < totalClues; i++) {
        if (!this.revealedClues.includes(i)) {
          this.unlockSpecificClue(i, false);
          break;
        }
      }
    }

    checkAndRenderWordHint() {
      const totalClues = this.currentWord.prohibited.length;
      const allRevealed = this.revealedClues.length >= totalClues;
      if (allRevealed && !this.firstLetterUnlocked) {
        this.firstLetterUnlocked = true;
        this.showToast('💡 All clues revealed! Starting letter unlocked!', 'close');
        sound.playFlip();
      }
      this.renderWordHint(allRevealed);
    }

    renderWordHint(revealFirstLetter = false) {
      if (!this.currentWord) return;
      // Strip parenthetical content (e.g. "Carbon dioxide (CO2)" -> "Carbon dioxide")
      const baseWord = this.currentWord.word.replace(/\([^)]*\)/g, '').trim();
      const words = baseWord.split(/\s+/);

      const totalLetters = words.reduce((sum, w) => sum + w.replace(/[^a-zA-Z0-9]/g, '').length, 0);
      const wordCount = words.length;

      if (this.dom.hintBadge && this.dom.hintTitle) {
        if (revealFirstLetter) {
          this.dom.hintBadge.textContent = 'STARTING LETTER UNLOCKED 💡';
          this.dom.hintBadge.className = 'hint-badge unlocked-badge';
          this.dom.hintTitle.textContent = wordCount > 1 
            ? `${wordCount} words · ${totalLetters} letters total` 
            : `${totalLetters} letters`;
        } else {
          this.dom.hintBadge.textContent = 'WORD LENGTH';
          this.dom.hintBadge.className = 'hint-badge';
          this.dom.hintTitle.textContent = wordCount > 1 
            ? `${wordCount} words · ${totalLetters} letters total` 
            : `${totalLetters} letters`;
        }
      }

      let html = '';
      words.forEach((w, wIdx) => {
        if (wIdx > 0) {
          html += '<span class="dash-space"></span>';
        }
        for (let i = 0; i < w.length; i++) {
          const char = w[i];
          if (/[a-zA-Z0-9]/.test(char)) {
            if (revealFirstLetter && i === 0) {
              // Starting letter revealed!
              html += `<span class="dash-letter just-revealed">${char.toUpperCase()}</span>`;
            } else {
              // Blank dash for word length
              html += `<span class="dash-blank">&nbsp;</span>`;
            }
          } else {
            // Punctuation (apostrophes, hyphens)
            html += `<span class="dash-punct">${char}</span>`;
          }
        }
      });

      this.dom.wordDashesDisplay.innerHTML = html;
      this.dom.wordHintBox.classList.add('active');
      if (revealFirstLetter) {
        this.dom.wordHintBox.classList.add('unlocked');
      } else {
        this.dom.wordHintBox.classList.remove('unlocked');
      }
    }

    // =========================================================================
    // 8. GUESS HANDLING & EVALUATION
    // =========================================================================
    handleTabooClueMatch(tabooMatch) {
      if (!tabooMatch.isAlreadyRevealed) {
        // Reveal this specific card for free! No guess wasted
        this.unlockSpecificClue(tabooMatch.index, true);
        sound.playClose();
        this.showToast(`💡 Nice spot! "${tabooMatch.clueWord}" was a taboo clue — unlocked with no guess wasted!`, 'close');
        this.addGuessChip(tabooMatch.clueWord, 'close');
      } else {
        this.showToast(`ℹ️ "${tabooMatch.clueWord}" is already an unlocked clue! Guess the secret target.`, 'typo');
      }
      this.dom.guessInput.value = '';
    }

    handleGuessSubmit() {
      const guess = this.dom.guessInput.value.trim();
      if (!guess) return;

      this.startTimerIfNeeded();

      // Step 1: Evaluate guess against the secret target word (including demonyms, word-family & typos)
      const result = FuzzyMatcher.evaluateGuess(guess, this.currentWord.word);

      if (result.isCorrect) {
        this.handleCorrectGuess(result, guess);
        this.dom.guessInput.value = '';
        return;
      }

      // Step 2: Did the user guess one of the forbidden Taboo clues?
      // (Free reveal! No guess wasted)
      const tabooMatch = this.checkProhibitedWordGuess(guess, false);
      if (tabooMatch) {
        this.handleTabooClueMatch(tabooMatch);
        return;
      }

      // Step 3: Incorrect guess
      this.handleIncorrectGuess(result, guess);
      this.dom.guessInput.value = '';
    }

    handleCorrectGuess(result, rawGuess) {
      this.isWordSolved = true;
      sound.playCorrect();

      // Pause timer immediately!
      this.stopTimer();

      const currentRoundNum = this.currentRoundIndex + 1;
      this.roundSummaries.push({
        wordNumber: currentRoundNum,
        targetWord: this.currentWord.word,
        rawGuess,
        cluesUsed: this.revealedClues.length,
        totalClues: this.currentWord.prohibited.length,
        guessesCount: this.guesses.length + 1,
        wasSkipped: false
      });

      this.revealAllClues();

      if (result.isTypo) {
        this.showToast(`✓ Correct! (Typo forgiven: "${this.currentWord.word}")`, 'typo');
      } else {
        this.showToast(`✓ Brilliant! Solved: "${this.currentWord.word}"`, 'success');
      }

      if (this.currentRoundIndex >= 2) {
        // Round 3 solved: complete game immediately, timer stops permanently!
        this.handleGameComplete();
      } else {
        // Round 1 or 2: pause timer and show intermission banner!
        this.showRoundIntermission(true);
      }
    }

    handleIncorrectGuess(result, rawGuess) {
      sound.playWrong();
      this.guesses.push(rawGuess);

      this.dom.inputWrapper.classList.add('shake');
      setTimeout(() => this.dom.inputWrapper.classList.remove('shake'), 500);

      if (result.isClose) {
        sound.playClose();
        this.showToast(result.message, 'close');
        this.addGuessChip(rawGuess, 'close');
      } else {
        this.addGuessChip(rawGuess, 'wrong');
      }

      const totalClues = this.currentWord.prohibited.length;
      if (this.revealedClues.length >= totalClues) {
        // All clues already revealed; player is guessing with the letter hint
        this.postHintGuesses = (this.postHintGuesses || 0) + 1;
        if (this.postHintGuesses >= 2) {
          this.handleWordOutOfGuesses();
          return;
        } else {
          this.showToast(`Incorrect! 1 final attempt with the letter hint remaining.`, 'close');
        }
      } else {
        this.showToast(`Incorrect! Next taboo clue revealed.`, 'error');
        this.unlockNextClue();
      }
    }

    handleWordOutOfGuesses() {
      this.stopTimer();
      this.addPenalty(15);
      sound.playWrong();

      const totalClues = this.currentWord.prohibited.length;
      const currentRoundNum = this.currentRoundIndex + 1;
      this.roundSummaries.push({
        wordNumber: currentRoundNum,
        targetWord: this.currentWord.word,
        rawGuess: '[Out of Guesses]',
        cluesUsed: totalClues,
        totalClues: totalClues,
        guessesCount: this.guesses.length,
        wasSkipped: true
      });

      this.revealAllClues();
      this.renderWordHint(true);

      this.showToast(`Out of guesses! The word was "${this.currentWord.word}" (+15s)`, 'error');

      if (this.currentRoundIndex >= 2) {
        // Round 3: ends game immediately! Timer permanently stops
        this.handleGameComplete();
        return;
      }

      this.showRoundIntermission(false);
    }

    handleManualClueReveal() {
      this.startTimerIfNeeded();
      this.addPenalty(5);
      sound.playFlip();
      this.unlockNextClue();
    }

    openSkipModal() {
      this.stopTimer(); // Pause timer while modal is open!
      this.openModal(this.dom.skipModal);
    }

    closeSkipModal() {
      this.closeModal(this.dom.skipModal);
      this.startTimerIfNeeded(); // Resume timer if they cancel!
      this.dom.guessInput.focus();
    }

    executeSkipWord() {
      this.closeModal(this.dom.skipModal);
      this.stopTimer(); // Ensure timer is stopped immediately
      this.addPenalty(15);
      sound.playWrong();

      const totalClues = this.currentWord.prohibited.length;
      const currentRoundNum = this.currentRoundIndex + 1;
      this.roundSummaries.push({
        wordNumber: currentRoundNum,
        targetWord: this.currentWord.word,
        rawGuess: '[Skipped]',
        cluesUsed: totalClues,
        totalClues: totalClues,
        guessesCount: this.guesses.length,
        wasSkipped: true
      });

      this.revealAllClues();
      this.renderWordHint(true);

      if (this.currentRoundIndex >= 2) {
        // Round 3 skipped: end the game immediately! Timer stays stopped, no extra clicks required
        this.handleGameComplete();
        return;
      }

      // For Round 1 or 2, show intermission banner (timer remains PAUSED!)
      this.showRoundIntermission(false);
      this.showToast(`Revealed: "${this.currentWord.word}" (+15s penalty)`, 'error');
    }

    showRoundIntermission(isSolved) {
      const currentRoundNum = this.currentRoundIndex + 1;
      const totalClues = this.currentWord.prohibited.length;
      const cluesUsed = isSolved ? this.revealedClues.length : totalClues;
      const guessesMade = this.guesses.length + (isSolved ? 1 : 0);

      this.dom.revealedAnswerBanner.className = `revealed-answer-banner active ${isSolved ? 'solved-theme' : ''}`;
      if (this.dom.revealedTag) {
        this.dom.revealedTag.textContent = isSolved ? `WORD ${currentRoundNum} SOLVED ✓` : `WORD ${currentRoundNum} REVEALED`;
      }
      if (this.dom.revealedPenaltyNote) {
        this.dom.revealedPenaltyNote.innerHTML = `<span class="revealed-pause-pill">⏸️ Timer Paused</span> ${!isSolved ? '<span style="color:#fde68a;">(+15s)</span>' : ''}`;
      }
      if (this.dom.revealedLead) {
        this.dom.revealedLead.textContent = isSolved ? 'Nice deduction! Secret word:' : 'The secret word was:';
      }
      this.dom.revealedTargetWord.textContent = this.currentWord.word.toUpperCase();
      if (this.dom.revealedStats) {
        this.dom.revealedStats.innerHTML = `${cluesUsed}/${totalClues} clues &bull; ${guessesMade} ${guessesMade === 1 ? 'guess' : 'guesses'}`;
      }
      this.dom.proceedBtnText.textContent = `Continue to Word ${currentRoundNum + 1}`;

      this.dom.guessForm.style.display = 'none';
      this.dom.actionBar.style.display = 'none';
    }

    proceedAfterReveal() {
      if (this.isGameOver) {
        this.openModal(this.dom.victoryModal);
        return;
      }

      this.dom.revealedAnswerBanner.classList.remove('active');
      this.dom.guessForm.style.display = 'block';
      this.dom.actionBar.style.display = 'flex';

      this.currentRoundIndex++;
      this.loadWordForCurrentRound();
      this.startTimerIfNeeded(); // Resume timer for the next round
    }

    addGuessChip(text, type) {
      if (this.dom.historyChips.querySelector('.history-placeholder')) {
        this.dom.historyChips.innerHTML = '';
      }

      const chip = document.createElement('div');
      chip.className = `guess-chip ${type}`;
      chip.textContent = text;
      this.dom.historyChips.appendChild(chip);
    }

    showToast(message, type = 'success') {
      this.dom.feedbackToast.textContent = message;
      this.dom.feedbackToast.className = `feedback-toast show ${type}`;

      if (this.toastTimeout) clearTimeout(this.toastTimeout);
      this.toastTimeout = setTimeout(() => {
        this.dom.feedbackToast.classList.remove('show');
      }, 3200);
    }

    // =========================================================================
    // 9. VICTORY, SCORECARD & SHARING
    // =========================================================================
    handleGameComplete() {
      this.stopTimer();
      this.isGameOver = true;
      sound.playWin();

      launchConfetti();

      // Configure in-board banner for when user reviews board
      if (this.dom.revealedAnswerBanner) {
        this.dom.revealedAnswerBanner.className = 'revealed-answer-banner active game-over-theme';
      }
      if (this.dom.revealedTag) {
        this.dom.revealedTag.textContent = 'DAILY PUZZLE COMPLETE 🏆';
      }
      if (this.dom.revealedPenaltyNote) {
        this.dom.revealedPenaltyNote.innerHTML = '<span class="revealed-pause-pill">🏁 Timer Stopped</span>';
      }
      if (this.dom.revealedLead) {
        this.dom.revealedLead.textContent = 'Word 3 was:';
      }
      this.dom.revealedTargetWord.textContent = this.currentWord.word.toUpperCase();
      if (this.dom.revealedStats) {
        this.dom.revealedStats.innerHTML = `All 3 words completed! Final Time: <strong>${this.formatTime(this.getElapsedMs())}</strong>`;
      }
      this.dom.proceedBtnText.textContent = 'View Scorecard & Share 📋';

      this.dom.guessForm.style.display = 'none';
      this.dom.actionBar.style.display = 'none';

      // Update HUD stepper: all completed
      this.dom.stepChips.forEach(chip => {
        chip.classList.remove('active');
        chip.classList.add('completed');
      });

      const totalCluesRevealed = this.roundSummaries.reduce((sum, r) => sum + r.cluesUsed, 0);
      const totalPossibleClues = this.roundSummaries.reduce((sum, r) => sum + r.totalClues, 0);
      const totalGuesses = this.roundSummaries.reduce((sum, r) => sum + r.guessesCount, 0);
      const wrongGuesses = totalGuesses - 3;

      const finalTimeMs = this.getElapsedMs();
      const formattedFinalTime = this.formatTime(finalTimeMs);

      let rank = 'Master Sleuth 🕵️';
      if (totalCluesRevealed <= 7) rank = 'Genius Mind 🧠⚡';
      else if (totalCluesRevealed <= 11) rank = 'Sharp Detective 🔍';
      else rank = 'Tenacious Solver 🛡️';

      this.dom.statFinalTime.textContent = formattedFinalTime;
      this.dom.statTotalClues.textContent = `${totalCluesRevealed}/${totalPossibleClues}`;
      this.dom.statWrongGuesses.textContent = Math.max(0, wrongGuesses);
      this.dom.statRank.textContent = rank;

      this.dom.solvedWordsList.innerHTML = '';
      this.roundSummaries.forEach(r => {
        const item = document.createElement('div');
        item.className = 'solved-word-item';
        item.innerHTML = `
          <div class="solved-word-name">
            <span class="check">${r.wasSkipped ? '❌' : '✓'}</span>
            <span>Word ${r.wordNumber}: ${r.targetWord}</span>
          </div>
          <div class="solved-word-meta">
            ${r.cluesUsed} clues &bull; ${r.guessesCount} ${r.guessesCount === 1 ? 'guess' : 'guesses'}
          </div>
        `;
        this.dom.solvedWordsList.appendChild(item);
      });

      const shareText = this.buildShareText(formattedFinalTime, totalCluesRevealed, totalPossibleClues);
      this.dom.shareTextPreview.textContent = shareText;
      this.currentShareText = shareText;

      this.saveGameRecord(finalTimeMs, totalCluesRevealed);

      setTimeout(() => {
        this.openModal(this.dom.victoryModal);
      }, 700);
    }

    buildShareText(timeStr, cluesUsed, totalClues) {
      const puzzleNumStr = String(this.dailyPuzzleNumber).padStart(3, '0');
      let lines = [
        `REVERSE TABOO #${puzzleNumStr} 🕵️`,
        `⏱️ ${timeStr} | 💡 ${cluesUsed}/${totalClues} Clues`
      ];

      this.roundSummaries.forEach(r => {
        let emoji = '🟩';
        if (r.wasSkipped) emoji = '🟥';
        else if (r.cluesUsed >= 5) emoji = '🟧';
        else if (r.cluesUsed >= 3) emoji = '🟨';

        lines.push(`W${r.wordNumber}: ${emoji} (${r.cluesUsed} clues)`);
      });

      lines.push('Play Reverse Taboo Daily!');
      return lines.join('\n');
    }

    copyShareResult() {
      if (!this.currentShareText) return;
      navigator.clipboard.writeText(this.currentShareText).then(() => {
        this.dom.copiedBadge.classList.add('show');
        setTimeout(() => this.dom.copiedBadge.classList.remove('show'), 2500);
      }).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = this.currentShareText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        this.dom.copiedBadge.classList.add('show');
        setTimeout(() => this.dom.copiedBadge.classList.remove('show'), 2500);
      });
    }

    // =========================================================================
    // 10. LOCAL STORAGE PERSISTENCE & STATS
    // =========================================================================
    saveGameRecord(timeMs, cluesUsed) {
      const stats = JSON.parse(localStorage.getItem('rt_stats') || '{"played": 0, "won": 0, "bestTime": null, "totalClues": 0, "history": []}');
      stats.played++;
      stats.won++;
      stats.totalClues += cluesUsed;

      if (!stats.bestTime || timeMs < stats.bestTime) {
        stats.bestTime = timeMs;
      }

      stats.history.unshift({
        date: new Date().toLocaleDateString(),
        mode: 'Daily',
        time: this.formatTime(timeMs),
        clues: cluesUsed
      });

      if (stats.history.length > 10) stats.history.pop();
      localStorage.setItem('rt_stats', JSON.stringify(stats));
    }

    renderStats() {
      const stats = JSON.parse(localStorage.getItem('rt_stats') || '{"played": 0, "won": 0, "bestTime": null, "totalClues": 0, "history": []}');
      this.dom.statGamesPlayed.textContent = stats.played;
      this.dom.statGamesWon.textContent = stats.won;
      this.dom.statBestTime.textContent = stats.bestTime ? this.formatTime(stats.bestTime) : '--:--';
      
      const avgClues = stats.won > 0 ? (stats.totalClues / (stats.won * 3)).toFixed(1) : '0.0';
      this.dom.statAvgClues.textContent = avgClues;

      if (stats.history.length === 0) {
        this.dom.recentGamesList.innerHTML = '<div class="empty-state">No daily games recorded yet. Clear today\'s puzzle!</div>';
      } else {
        this.dom.recentGamesList.innerHTML = stats.history.map(item => `
          <div class="solved-word-item" style="margin-bottom: 0.4rem;">
            <div>
              <strong>${item.date}</strong> &bull; <span>Daily Puzzle</span>
            </div>
            <div class="font-mono" style="color: #38bdf8;">
              ${item.time} &bull; ${item.clues} clues
            </div>
          </div>
        `).join('');
      }
    }
  }

  // =========================================================================
  // 11. BUILT-IN PARTICLES CONFETTI SYSTEM
  // =========================================================================
  function launchConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#06b6d4', '#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#f43f5e'];
    const particles = [];
    const count = 120;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height * 0.4 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.7) * 16,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        opacity: 1
      });
    }

    let animationFrame;
    const startTime = performance.now();

    function render(time) {
      const elapsed = time - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = 0;
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.38;
        p.vx *= 0.985;
        p.rotation += p.rotationSpeed;

        if (elapsed > 1800) {
          p.opacity -= 0.02;
        }

        if (p.opacity > 0 && p.y < canvas.height + 50) {
          alive++;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      });

      if (alive > 0 && elapsed < 4000) {
        animationFrame = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    animationFrame = requestAnimationFrame(render);
  }

  window.addEventListener('resize', () => {
    const canvas = document.getElementById('confettiCanvas');
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    window.FuzzyMatcher = FuzzyMatcher;
    window.reverseTaboo = new ReverseTabooGame();
  });
})();
