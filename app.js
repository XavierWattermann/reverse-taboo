/**
 * REVERSE TABOO — Main Application Engine
 * Dynamic clue reveals, fuzzy typo forgiveness, dual game modes, procedural audio & statistics
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

  let WORDS_POOL = [...FALLBACK_WORDS];

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
        this.playCorrect(0.1);
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
      } catch (e) {
        // audio context blocked or unsupported
      }
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
      // Dull low thud
      this.playTone(140, 'sawtooth', 0.2, 0.1);
      setTimeout(() => this.playTone(110, 'sawtooth', 0.25, 0.08), 80);
    }

    playClose() {
      if (!this.enabled) return;
      // Playful curious double tone
      this.playTone(440, 'sine', 0.1, 0.1);
      setTimeout(() => this.playTone(554.37, 'sine', 0.12, 0.1), 90);
    }

    playWin() {
      if (!this.enabled) return;
      // Fanfare chord progression
      const chords = [
        [523.25, 659.25], // C, E
        [659.25, 783.99], // E, G
        [783.99, 1046.5], // G, C6
        [1046.5, 1318.51] // C6, E6
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
  // 3. FUZZY MATCHING & ALIAS ENGINE (Typo forgiveness & normalization)
  // =========================================================================
  class FuzzyMatcher {
    /**
     * Cleans string: lowercases, removes diacritics, strips punctuation, collapses spaces
     */
    static normalize(str) {
      if (!str) return '';
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove accents (e.g. é -> e)
        .replace(/[^a-z0-9\s]/g, ' ')   // replace symbols with spaces
        .replace(/\s+/g, ' ')           // collapse multiple spaces
        .trim();
    }

    /**
     * Extracts intelligent alternate acceptable answers for a target word
     */
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
        // Only add if it's a substantive acronym/word, not a generic qualifier like "(band)", "(film)"
        const genericQualifiers = ['band', 'film', 'game', 'tv series', 'series', 'rapper', 'album', 'city', 'song'];
        if (!genericQualifiers.includes(insideParens) && insideParens.length >= 2) {
          aliases.add(insideParens);
        }
      }

      // 3. Strip leading articles: "The Simpsons" -> "Simpsons", "A Christmas Carol" -> "Christmas Carol"
      for (const alias of Array.from(aliases)) {
        if (alias.startsWith('the ')) aliases.add(alias.slice(4));
        if (alias.startsWith('a ')) aliases.add(alias.slice(2));
        if (alias.startsWith('an ')) aliases.add(alias.slice(3));
      }

      // 4. Common specific mappings for known formats
      if (rawWord.includes('50 Cent')) aliases.add('fifty cent');
      if (rawWord.includes('Martin Luther King')) aliases.add('mlk');

      // 5. Significant surname or distinctive key token for names (e.g. "Albert Einstein" -> "einstein")
      const words = normWithoutParens.split(' ');
      if (words.length >= 2 && words.length <= 4) {
        const lastWord = words[words.length - 1];
        const genericExclusions = [
          'power', 'disaster', 'game', 'theory', 'tree', 'river', 'city', 'state', 'cup',
          'bowl', 'park', 'square', 'house', 'road', 'street', 'wall', 'room', 'size',
          'death', 'war', 'series', 'disorders', 'syndrome', 'number', 'penis', 'virus',
          'power', 'acid', 'table', 'logo', 'band', 'film', 'food'
        ];
        if (lastWord.length >= 4 && !genericExclusions.includes(lastWord)) {
          aliases.add(lastWord);
        }
        // First name for famous mononyms like "Sherlock", "Napoleon", "Cleopatra"
        const firstWord = words[0];
        if (['sherlock', 'napoleon', 'beyonce', 'adele', 'madonna', 'rihanna', 'elvis'].includes(firstWord)) {
          aliases.add(firstWord);
        }
      }

      return Array.from(aliases);
    }

    /**
     * Levenshtein edit distance with transposition (Damerau-Levenshtein)
     */
    static editDistance(s1, s2) {
      const len1 = s1.length;
      const len2 = s2.length;
      const d = [];

      for (let i = 0; i <= len1; i++) {
        d[i] = [i];
      }
      for (let j = 0; j <= len2; j++) {
        d[0][j] = j;
      }

      for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
          const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
          d[i][j] = Math.min(
            d[i - 1][j] + 1,       // deletion
            d[i][j - 1] + 1,       // insertion
            d[i - 1][j - 1] + cost // substitution
          );

          // Transposition
          if (i > 1 && j > 1 && s1[i - 1] === s2[j - 2] && s1[i - 2] === s2[j - 1]) {
            d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
          }
        }
      }

      return d[len1][len2];
    }

    /**
     * Evaluates user guess against target word
     */
    static evaluateGuess(userGuess, targetWord) {
      const cleanGuess = this.normalize(userGuess);
      if (!cleanGuess) return { isCorrect: false, isTypo: false, isClose: false, message: 'Please enter a guess.' };

      const aliases = this.generateAliases(targetWord);

      // Check 1: Exact normalized match
      if (aliases.includes(cleanGuess)) {
        return { isCorrect: true, isTypo: false, isClose: false, targetWord };
      }

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
      const similarity = 1 - (bestDistance / Math.max(aliasLen, cleanGuess.length));

      // Typo Forgiveness Thresholds:
      // Short words (3-4 chars): distance 1 allowed only if similarity >= 0.75
      // Medium words (5-7 chars): distance 1 allowed
      // Long words (8+ chars): distance <= 2 or similarity >= 0.85 allowed
      let allowedTypoDist = 0;
      if (aliasLen >= 8) allowedTypoDist = 2;
      else if (aliasLen >= 5) allowedTypoDist = 1;
      else if (aliasLen >= 4 && bestDistance === 1) allowedTypoDist = 1;

      if (bestDistance <= allowedTypoDist || similarity >= 0.86) {
        return {
          isCorrect: true,
          isTypo: true,
          isClose: false,
          targetWord,
          matchedAlias: closestAlias
        };
      }

      // Close / Near-miss nudge (distance is small but outside forgiving range)
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
  // 4. GAME STATE & CONTROLLER
  // =========================================================================
  class ReverseTabooGame {
    constructor() {
      this.mode = 'daily'; // 'daily' | 'blitz' | 'practice'
      this.currentRoundIndex = 0; // 0, 1, 2
      this.wordsInGame = []; // 3 words for the active session
      this.currentWord = null;

      // Active word state
      this.revealedClues = []; // indices of revealed clues
      this.guesses = []; // list of string guesses for current word
      this.isWordSolved = false;

      // Overall game metrics
      this.startTime = null;
      this.elapsedMs = 0;
      this.penaltyMs = 0;
      this.timerInterval = null;
      this.isGameActive = false;
      this.isGameOver = false;

      // Scorecard summary across the 3 words
      this.roundSummaries = [];

      this.initDom();
      this.bindEvents();
      this.loadDataset();
    }

    initDom() {
      this.dom = {
        puzzleIdBadge: document.getElementById('puzzleIdBadge'),
        modeDailyBtn: document.getElementById('modeDailyBtn'),
        modeBlitzBtn: document.getElementById('modeBlitzBtn'),
        modePracticeBtn: document.getElementById('modePracticeBtn'),
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
        modeBannerIcon: document.getElementById('modeBannerIcon'),
        modeBannerText: document.getElementById('modeBannerText'),
        cluesCaption: document.getElementById('cluesCaption'),
        cluesGrid: document.getElementById('cluesGrid'),
        guessForm: document.getElementById('guessForm'),
        guessInput: document.getElementById('guessInput'),
        submitGuessBtn: document.getElementById('submitGuessBtn'),
        inputWrapper: document.querySelector('.input-wrapper'),
        revealClueBtn: document.getElementById('revealClueBtn'),
        hintPenaltyTag: document.getElementById('hintPenaltyTag'),
        skipWordBtn: document.getElementById('skipWordBtn'),
        feedbackToast: document.getElementById('feedbackToast'),
        historyContainer: document.getElementById('historyContainer'),
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
        copiedBadge: document.getElementById('copiedBadge'),
        playAgainBtn: document.getElementById('playAgainBtn'),
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
      // Mode selector
      this.dom.modeDailyBtn.addEventListener('click', () => this.switchMode('daily'));
      this.dom.modeBlitzBtn.addEventListener('click', () => this.switchMode('blitz'));
      this.dom.modePracticeBtn.addEventListener('click', () => this.switchMode('practice'));

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
      this.dom.playAgainBtn.addEventListener('click', () => {
        this.closeModal(this.dom.victoryModal);
        this.switchMode('practice');
      });

      // Guess submission
      this.dom.guessForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleGuessSubmit();
      });

      // Reveal Clue Action
      this.dom.revealClueBtn.addEventListener('click', () => this.handleManualClueReveal());

      // Skip word
      this.dom.skipWordBtn.addEventListener('click', () => this.handleSkipWord());

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
        console.info('Loaded with bundled curated word bank (standalone mode)');
        this.dom.datasetStatus.innerHTML = `
          <span class="status-indicator" style="background:#38bdf8;"></span> 
          Offline Mode: Curated word bank ready
        `;
      }

      this.startNewGame();
    }

    // =========================================================================
    // 5. WORD SELECTION & SEEDING (Daily deterministic vs Random)
    // =========================================================================
    getDailyWords() {
      // Deterministic pseudo-random seed based on UTC date
      const today = new Date();
      const dateStr = `${today.getUTCFullYear()}-${today.getUTCMonth() + 1}-${today.getUTCDate()}`;
      
      // Compute puzzle number (days since anchor date 2026-01-01)
      const anchor = new Date('2026-01-01');
      const diffDays = Math.max(1, Math.floor((today - anchor) / (1000 * 60 * 60 * 24)));
      this.dailyPuzzleNumber = diffDays;
      this.dom.puzzleIdBadge.textContent = `DAILY #${String(diffDays).padStart(3, '0')}`;

      // Simple hash
      let hash = 0;
      for (let i = 0; i < dateStr.length; i++) {
        hash = (hash << 5) - hash + dateStr.charCodeAt(i);
        hash |= 0;
      }
      hash = Math.abs(hash);

      const poolLen = WORDS_POOL.length;
      const idx1 = hash % poolLen;
      const idx2 = (hash * 31 + 7) % poolLen;
      const idx3 = (hash * 127 + 19) % poolLen;

      return [WORDS_POOL[idx1], WORDS_POOL[idx2], WORDS_POOL[idx3]];
    }

    getRandomWords() {
      const shuffled = [...WORDS_POOL].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 3);
    }

    switchMode(newMode) {
      this.mode = newMode;
      this.dom.modeDailyBtn.classList.toggle('active', newMode === 'daily');
      this.dom.modeBlitzBtn.classList.toggle('active', newMode === 'blitz');
      this.dom.modePracticeBtn.classList.toggle('active', newMode === 'practice');

      if (newMode === 'daily') {
        this.dom.puzzleIdBadge.style.display = 'inline-block';
        this.dom.modeBannerIcon.textContent = '📅';
        this.dom.modeBannerText.textContent = 'Daily 3-Pack: Start with 2 clues. Wrong guesses unlock more prohibited words!';
        this.dom.cluesCaption.textContent = 'Prohibited clues for Word ' + (this.currentRoundIndex + 1);
        this.dom.hintPenaltyTag.textContent = '+5s penalty';
      } else if (newMode === 'blitz') {
        this.dom.puzzleIdBadge.textContent = 'SPEED BLITZ';
        this.dom.modeBannerIcon.textContent = '⚡';
        this.dom.modeBannerText.textContent = 'Reverse Blitz: Clues decrease every round! Word 1: All clues. Word 2: 4 clues. Word 3: 2 clues!';
        this.dom.cluesCaption.textContent = 'Decreasing clue speed run!';
        this.dom.hintPenaltyTag.textContent = '+10s penalty';
      } else {
        this.dom.puzzleIdBadge.textContent = 'FREE PLAY';
        this.dom.modeBannerIcon.textContent = '🎯';
        this.dom.modeBannerText.textContent = 'Casual Practice: Solve random taboo targets at your own pace.';
        this.dom.cluesCaption.textContent = 'Sharpen your deduction instincts';
        this.dom.hintPenaltyTag.textContent = '+5s penalty';
      }

      this.startNewGame();
    }

    startNewGame() {
      this.stopTimer();
      this.elapsedMs = 0;
      this.penaltyMs = 0;
      this.currentRoundIndex = 0;
      this.roundSummaries = [];
      this.isGameOver = false;

      this.dom.timerDisplay.textContent = '00:00.0';

      if (this.mode === 'daily') {
        this.wordsInGame = this.getDailyWords();
      } else {
        this.wordsInGame = this.getRandomWords();
      }

      this.loadWordForCurrentRound();
    }

    loadWordForCurrentRound() {
      this.currentWord = this.wordsInGame[this.currentRoundIndex];
      this.guesses = [];
      this.isWordSolved = false;

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

      // Determine initial revealed clues based on mode
      const totalClues = this.currentWord.prohibited.length;
      this.dom.totalCluesCount.textContent = totalClues;

      if (this.mode === 'blitz') {
        if (this.currentRoundIndex === 0) {
          // Word 1: All clues revealed
          this.revealedClues = Array.from({ length: totalClues }, (_, i) => i);
        } else if (this.currentRoundIndex === 1) {
          // Word 2: 4 clues revealed
          const count = Math.min(4, totalClues);
          this.revealedClues = Array.from({ length: count }, (_, i) => i);
        } else {
          // Word 3: Only 2 clues revealed
          const count = Math.min(2, totalClues);
          this.revealedClues = Array.from({ length: count }, (_, i) => i);
        }
      } else {
        // Daily & Practice: Start with 2 clues revealed
        const initialCount = Math.min(2, totalClues);
        this.revealedClues = Array.from({ length: initialCount }, (_, i) => i);
      }

      this.renderClues(false);
      this.updateCluesCounter();
    }

    renderClues(animateNew = true) {
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
              <span class="clue-badge">Taboo #${index + 1}</span>
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
    // 6. TIMER ENGINE
    // =========================================================================
    startTimerIfNeeded() {
      if (this.isGameActive) return;
      this.isGameActive = true;
      this.startTime = performance.now() - this.elapsedMs;

      this.timerInterval = setInterval(() => {
        if (!this.isGameActive) return;
        this.elapsedMs = performance.now() - this.startTime + this.penaltyMs;
        this.updateTimerDisplay();
      }, 50);
    }

    stopTimer() {
      this.isGameActive = false;
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    }

    addPenalty(seconds) {
      this.penaltyMs += seconds * 1000;
      this.elapsedMs += seconds * 1000;
      this.updateTimerDisplay();
      this.showToast(`+${seconds}s Penalty Added!`, 'error');
    }

    formatTime(ms) {
      const totalSeconds = Math.floor(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const tenths = Math.floor((ms % 1000) / 100);

      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`;
    }

    updateTimerDisplay() {
      this.dom.timerDisplay.textContent = this.formatTime(this.elapsedMs);
    }

    // =========================================================================
    // 7. GAMEPLAY ACTIONS: GUESSING & REVEALS
    // =========================================================================
    handleGuessSubmit() {
      const guess = this.dom.guessInput.value.trim();
      if (!guess) return;

      this.startTimerIfNeeded();

      // Check against current word
      const result = FuzzyMatcher.evaluateGuess(guess, this.currentWord.word);

      if (result.isCorrect) {
        this.handleCorrectGuess(result, guess);
      } else {
        this.handleIncorrectGuess(result, guess);
      }

      this.dom.guessInput.value = '';
    }

    handleCorrectGuess(result, rawGuess) {
      this.isWordSolved = true;
      sound.playCorrect();

      // Record summary for this word
      this.roundSummaries.push({
        wordNumber: this.currentRoundIndex + 1,
        targetWord: this.currentWord.word,
        rawGuess,
        cluesUsed: this.revealedClues.length,
        totalClues: this.currentWord.prohibited.length,
        guessesCount: this.guesses.length + 1,
        wasSkipped: false
      });

      // Show toast
      if (result.isTypo) {
        this.showToast(`✓ Correct! (Typo forgiven: "${this.currentWord.word}")`, 'typo');
      } else {
        this.showToast(`✓ Brilliant! Solved: "${this.currentWord.word}"`, 'success');
      }

      // Add winning chip
      this.addGuessChip(rawGuess, 'correct');

      // Check if this was the 3rd word (Final victory)
      if (this.currentRoundIndex >= 2) {
        this.handleGameComplete();
      } else {
        // Transition to next word
        this.dom.guessInput.disabled = true;
        this.dom.submitGuessBtn.disabled = true;
        setTimeout(() => {
          this.currentRoundIndex++;
          this.loadWordForCurrentRound();
        }, 1100);
      }
    }

    handleIncorrectGuess(result, rawGuess) {
      sound.playWrong();
      this.guesses.push(rawGuess);

      // Trigger input shake
      this.dom.inputWrapper.classList.add('shake');
      setTimeout(() => this.dom.inputWrapper.classList.remove('shake'), 500);

      if (result.isClose) {
        sound.playClose();
        this.showToast(result.message, 'close');
        this.addGuessChip(rawGuess, 'close');
      } else {
        this.showToast(`Incorrect! Next taboo clue revealed.`, 'error');
        this.addGuessChip(rawGuess, 'wrong');
      }

      // Auto-unlock next clue in Daily / Practice mode
      this.unlockNextClue();
    }

    handleManualClueReveal() {
      this.startTimerIfNeeded();
      const penalty = this.mode === 'blitz' ? 10 : 5;
      this.addPenalty(penalty);
      sound.playFlip();
      this.unlockNextClue();
    }

    unlockNextClue() {
      const totalClues = this.currentWord.prohibited.length;
      if (this.revealedClues.length >= totalClues) return;

      const nextIndex = this.revealedClues.length;
      this.revealedClues.push(nextIndex);

      // Animate card flip in DOM
      const card = document.getElementById(`clueCard-${nextIndex}`);
      if (card) {
        card.classList.add('revealed', 'just-unlocked');
        sound.playFlip();
      }

      this.updateCluesCounter();
    }

    handleSkipWord() {
      if (confirm(`Reveal answer for "${this.currentWord.word}" and move to the next word?`)) {
        this.startTimerIfNeeded();
        this.addPenalty(15);

        this.roundSummaries.push({
          wordNumber: this.currentRoundIndex + 1,
          targetWord: this.currentWord.word,
          rawGuess: '[Skipped]',
          cluesUsed: this.currentWord.prohibited.length,
          totalClues: this.currentWord.prohibited.length,
          guessesCount: this.guesses.length,
          wasSkipped: true
        });

        this.showToast(`Skipped! The word was: "${this.currentWord.word}"`, 'error');

        // Reveal all clues
        this.revealedClues = Array.from({ length: this.currentWord.prohibited.length }, (_, i) => i);
        this.renderClues();

        setTimeout(() => {
          if (this.currentRoundIndex >= 2) {
            this.handleGameComplete();
          } else {
            this.currentRoundIndex++;
            this.loadWordForCurrentRound();
          }
        }, 1200);
      }
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
    // 8. VICTORY, SCORECARD & SHARING
    // =========================================================================
    handleGameComplete() {
      this.stopTimer();
      this.isGameOver = true;
      sound.playWin();

      // Launch Confetti!
      launchConfetti();

      // Calculate stats
      const totalCluesRevealed = this.roundSummaries.reduce((sum, r) => sum + r.cluesUsed, 0);
      const totalPossibleClues = this.roundSummaries.reduce((sum, r) => sum + r.totalClues, 0);
      const totalGuesses = this.roundSummaries.reduce((sum, r) => sum + r.guessesCount, 0);
      const wrongGuesses = totalGuesses - 3; // subtracting 3 winning guesses

      const formattedFinalTime = this.formatTime(this.elapsedMs);

      // Rank calculation
      let rank = 'Master Sleuth 🕵️';
      if (totalCluesRevealed <= 7) rank = 'Genius Mind 🧠⚡';
      else if (totalCluesRevealed <= 11) rank = 'Sharp Detective 🔍';
      else rank = 'Tenacious Solver 🛡️';

      // Fill Victory Modal UI
      this.dom.statFinalTime.textContent = formattedFinalTime;
      this.dom.statTotalClues.textContent = `${totalCluesRevealed}/${totalPossibleClues}`;
      this.dom.statWrongGuesses.textContent = Math.max(0, wrongGuesses);
      this.dom.statRank.textContent = rank;

      // Solved Words List
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

      // Build Shareable Result Text (Wordle/Connections Style)
      const shareText = this.buildShareText(formattedFinalTime, totalCluesRevealed, totalPossibleClues);
      this.dom.shareTextPreview.textContent = shareText;
      this.currentShareText = shareText;

      // Save user record
      this.saveGameRecord(this.elapsedMs, totalCluesRevealed);

      setTimeout(() => {
        this.openModal(this.dom.victoryModal);
      }, 700);
    }

    buildShareText(timeStr, cluesUsed, totalClues) {
      const modeName = this.mode === 'daily' 
        ? `Daily #${String(this.dailyPuzzleNumber).padStart(3, '0')}` 
        : (this.mode === 'blitz' ? 'Reverse Blitz' : 'Free Play');

      let lines = [
        `REVERSE TABOO ${modeName}`,
        `⏱️ ${timeStr} | 💡 ${cluesUsed}/${totalClues} Clues`
      ];

      this.roundSummaries.forEach(r => {
        // Emoji bar based on clues needed: 2 clues = 🟩, 3-4 clues = 🟨, 5+ = 🟧
        let emoji = '🟩';
        if (r.wasSkipped) emoji = '🟥';
        else if (r.cluesUsed >= 5) emoji = '🟧';
        else if (r.cluesUsed >= 3) emoji = '🟨';

        lines.push(`W${r.wordNumber}: ${emoji} (${r.cluesUsed} clues)`);
      });

      lines.push('Play Reverse Taboo: words.json edition');
      return lines.join('\n');
    }

    copyShareResult() {
      if (!this.currentShareText) return;
      navigator.clipboard.writeText(this.currentShareText).then(() => {
        this.dom.copiedBadge.classList.add('show');
        setTimeout(() => this.dom.copiedBadge.classList.remove('show'), 2500);
      }).catch(() => {
        // Fallback for older browsers
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
    // 9. LOCAL STORAGE PERSISTENCE & STATS
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
        mode: this.mode,
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
        this.dom.recentGamesList.innerHTML = '<div class="empty-state">No games recorded yet. Clear your first puzzle today!</div>';
      } else {
        this.dom.recentGamesList.innerHTML = stats.history.map(item => `
          <div class="solved-word-item" style="margin-bottom: 0.4rem;">
            <div>
              <strong>${item.date}</strong> &bull; <span style="text-transform: capitalize;">${item.mode}</span>
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
  // 10. BUILT-IN PARTICLES CONFETTI SYSTEM (Zero External Dependencies)
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
        p.vy += 0.38; // gravity
        p.vx *= 0.985; // drag
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

  // Handle window resizing for canvas
  window.addEventListener('resize', () => {
    const canvas = document.getElementById('confettiCanvas');
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  });

  // Initialize Game on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    window.reverseTaboo = new ReverseTabooGame();
  });
})();
