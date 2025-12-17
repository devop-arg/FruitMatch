// ==========================================
// FRUITMATCH - MATCH-3 GAME
// Developed by DevCatanzaro
// ==========================================

(function() {
    'use strict';

    // ==========================================
    // CONFIGURATION
    // ==========================================
    const CONFIG = {
        ROWS: 10,
        COLS: 7,
        SYMBOLS: ['🍒', '🍉', '🍇', '🍋', '💎', '🍀', '7'],
        SYMBOL_POINTS: {
            '🍒': 10,
            '🍉': 20,
            '🍇': 30,
            '🍋': 40,
            '💎': 50,
            '🍀': 60,
            '7': 100
        },
        MIN_MATCH: 3,
        ANIMATION_SPEED: 300,
        COMBO_MULTIPLIER: 1.5,
        COIN_CHANCE: 0.08, // 8% de coin probability per tile
        POWERUP_PRICES: {
            shuffle: 10,
            bomb: 20,
            extraTime: 50,
            extraMoves: 50
        }
    };

    // Difficulties for Adventure mode
    // Adjusted for progressive balance:
    // - Fácil: ~95% a 80% success probability (level 1 a 30)
    // - Normal: ~90% a 65% success probability
    // - Difícil: ~75% a 50% success probability
    const DIFFICULTIES = {
        easy: { 
            name: 'Easy', 
            movesMultiplier: 1.5,      // 50% more moves
            scoreMultiplier: 0.6,      // 40% less points required
            collectMultiplier: 0.7,    // 30% less symbols to collect
            timeMultiplier: 1.4,       // 40% more time
            coinBonus: 1.5,            // 50% more coins
            // Ice resistance per phase (levels 1-10, 11-20, 21-30)
            iceResistance: { early: 1, mid: 1, late: 2 }
        },
        normal: { 
            name: 'Normal', 
            movesMultiplier: 1.0,
            scoreMultiplier: 1.0,
            collectMultiplier: 1.0,
            timeMultiplier: 1.0,
            coinBonus: 1.0,
            iceResistance: { early: 2, mid: 2, late: 3 }
        },
        hard: { 
            name: 'Hard', 
            movesMultiplier: 0.75,     // 25% less moves
            scoreMultiplier: 1.3,      // 30% more points required
            collectMultiplier: 1.2,    // 20% more symbols to collect
            timeMultiplier: 0.75,      // 25% less time
            coinBonus: 0.6,            // 40% less coins
            iceResistance: { early: 3, mid: 4, late: 4 }
        }
    };
    
    // Frozen figures configuration
    const FROZEN_CONFIG = {
        penguin: {
            symbol: '🐧',
            coinReward: 3,  // Coins when freed
            name: 'penguin'
        },
        chick: {
            symbol: '🐤',
            coinReward: 2,  // Coins when freed
            name: 'chick'
        }
    };
    
    // Global objectives multiplier (loaded from server)
    // Nivel 1: Muy Fácil, 2: Fácil, 3: Normal, 4: Difícil, 5: Extremo
    let GLOBAL_DIFFICULTY_LEVEL = 3; // Default Normal
    
    // Configuration of 5 difficulty levels global
    const GLOBAL_DIFFICULTIES = {
        1: { name: 'Very Easy', objectiveMultiplier: 0.5, movesBonus: 1.4, frozenMultiplier: 0.5, fixedScore: null, fixedFrozen: null },
        2: { name: 'Easy', objectiveMultiplier: 0.7, movesBonus: 1.2, frozenMultiplier: 0.7, fixedScore: null, fixedFrozen: null },
        3: { name: 'Normal', objectiveMultiplier: 1.0, movesBonus: 1.0, frozenMultiplier: 1.0, fixedScore: null, fixedFrozen: null },
        4: { name: 'Hard', objectiveMultiplier: 1.5, movesBonus: 0.85, frozenMultiplier: 1.5, fixedScore: null, fixedFrozen: null },
        5: { name: 'Extreme', objectiveMultiplier: 3.0, movesBonus: 0.7, frozenMultiplier: 2.0, fixedScore: 30000, fixedFrozen: { penguins: 10, chicks: 10 } }
    };
    
    // Maximum frozen figures en el tablero (10x7 = 70 cells, leaving room to play)
    const MAX_FROZEN_FIGURES = 25;
    
    // Obtener multiplicador de objetivos actual
    function getObjectiveMultiplier() {
        return GLOBAL_DIFFICULTIES[GLOBAL_DIFFICULTY_LEVEL]?.objectiveMultiplier || 1.0;
    }
    
    // Obtener bonus de movimientos actual
    function getMovesBonus() {
        return GLOBAL_DIFFICULTIES[GLOBAL_DIFFICULTY_LEVEL]?.movesBonus || 1.0;
    }
    
    // Obtener multiplicador de figuras congeladas
    function getFrozenMultiplier() {
        return GLOBAL_DIFFICULTIES[GLOBAL_DIFFICULTY_LEVEL]?.frozenMultiplier || 1.0;
    }
    
    // Obtener score fijo si existe (para Extremo)
    function getFixedScore() {
        return GLOBAL_DIFFICULTIES[GLOBAL_DIFFICULTY_LEVEL]?.fixedScore || null;
    }
    
    // Obtener frozen fijo si existe (para Extremo)
    function getFixedFrozen() {
        return GLOBAL_DIFFICULTIES[GLOBAL_DIFFICULTY_LEVEL]?.fixedFrozen || null;
    }
    
    // Calcular cantidad de figuras congeladas respetando el máximo del tablero
    function calculateFrozenCount(basePenguins, baseChicks) {
        // Si hay valores fijos (Extremo), usarlos
        const fixed = getFixedFrozen();
        if (fixed) {
            return { penguins: fixed.penguins, chicks: fixed.chicks };
        }
        
        const frozenMult = getFrozenMultiplier();
        let penguins = Math.round(basePenguins * frozenMult);
        let chicks = Math.round(baseChicks * frozenMult);
        
        // Asegurar que no excedamos el máximo
        const total = penguins + chicks;
        if (total > MAX_FROZEN_FIGURES) {
            const ratio = MAX_FROZEN_FIGURES / total;
            penguins = Math.floor(penguins * ratio);
            chicks = Math.floor(chicks * ratio);
        }
        
        return { penguins, chicks };
    }
    
    // Definición de modos de juego
    const MODES = {
        free: {
            name: 'Juego Libre',
            options: null
        },
        timed: {
            name: 'Contra Reloj',
            options: [
                { value: 60, label: '60 segundos', desc: 'Partida rapida' },
                { value: 90, label: '90 segundos', desc: 'Partida normal' },
                { value: 120, label: '120 segundos', desc: 'Partida larga' }
            ]
        },
        moves: {
            name: 'Movimientos',
            options: [
                { value: 20, label: '20 movimientos', desc: 'Desafio corto' },
                { value: 30, label: '30 movimientos', desc: 'Desafio normal' },
                { value: 50, label: '50 movimientos', desc: 'Desafio largo' }
            ]
        },
        adventure: {
            name: 'Modo Aventura',
            difficulties: [
                { value: 'easy', label: 'Facil', desc: 'Mas movimientos, menos presion' },
                { value: 'normal', label: 'Normal', desc: 'Experiencia balanceada' },
                { value: 'hard', label: 'Dificil', desc: 'Para expertos' }
            ]
        }
    };

    // ==========================================
    // SISTEMA DE GAME LOGS (para debugging)
    // ==========================================
    const gameLog = {
        sessionId: null,
        startTime: null,
        mode: null,
        difficulty: null,
        level: null,
        events: [],
        maxEvents: 200,
        
        // Iniciar nueva sesión de juego
        startSession(mode, difficulty, level, objective, moves, time) {
            this.sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.startTime = new Date().toISOString();
            this.mode = mode;
            this.difficulty = difficulty || null;
            this.level = level || null;
            this.events = [];
            
            this.log('session_start', {
                objective,
                moves,
                time,
                coins: state.coins,
                powerups: { ...state.powerups }
            });
        },
        
        // Registrar evento
        log(type, data) {
            if (!this.sessionId) return;
            
            // Limitar cantidad de eventos
            if (this.events.length >= this.maxEvents) {
                // Mantener primeros 10 y últimos 180
                this.events = [
                    ...this.events.slice(0, 10),
                    { t: Date.now(), type: 'events_trimmed', data: { removed: this.events.length - 190 } },
                    ...this.events.slice(-180)
                ];
            }
            
            this.events.push({
                t: Date.now(),
                type,
                data
            });
        },
        
        // Finalizar sesión y enviar al servidor
        async endSession(result, finalState) {
            if (!this.sessionId) return;
            
            this.log('session_end', {
                result,
                ...finalState
            });
            
            const sessionData = {
                username: state.username,
                sessionId: this.sessionId,
                mode: this.mode,
                difficulty: this.difficulty,
                level: this.level,
                events: this.events,
                startTime: this.startTime,
                endTime: new Date().toISOString(),
                result,
                finalState
            };
            
            // Enviar al servidor (no bloqueante)
            this.sendToServer(sessionData);
            
            // Limpiar
            this.sessionId = null;
            this.events = [];
        },
        
        // Enviar logs al servidor
        async sendToServer(sessionData) {
            if (!state.username) return;
            
            try {
                const API_URL = "/api";
                await fetch(`${API_URL}/logs`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(sessionData)
                });
            } catch (e) {
                console.error('Error enviando logs:', e);
            }
        }
    };

    // ==========================================
    // GENERADOR DE NIVELES AVENTURA - 30 NIVELES
    // ==========================================
    // Sistema con todos los símbolos siempre disponibles
    // Scores: 10,000 - 100,000 puntos (redondeados en miles)
    // Algunos niveles tienen límite de tiempo además de movimientos
    // Probabilidad de éxito según dificultad:
    // - Fácil: ~95% a 80%
    // - Normal: ~90% a 65%
    // - Difícil: ~75% a 50%
    
    // Puntos promedio por movimiento (ajustado para nuevos targets)
    const AVG_POINTS_PER_MOVE = 350;
    
    function generateAdventureLevels(difficulty = 'normal') {
        const diff = DIFFICULTIES[difficulty] || DIFFICULTIES.normal;
        const levels = [];
        
        // Todos los símbolos siempre disponibles para collect (excepto 7)
        const collectSymbols = ['🍒', '🍉', '🍇', '🍋', '💎', '🍀'];
        let collectIndex = 0;
        
        // Configuración de los 30 niveles
        // type: tipo de objetivo principal
        // baseScore: puntos base (se multiplica por dificultad)
        // baseCollect: cantidad base a recolectar
        // baseTime: tiempo en segundos (null = sin límite de tiempo)
        // baseMoves: movimientos base
        // mods: modificadores especiales
        // frozen: figuras congeladas {penguins, chicks}
        const levelConfigs = [
            // === FASE 1: INTRODUCCIÓN (Niveles 1-5) ===
            // Aprender mecánicas básicas, sin hielo, sin tiempo
            // Score incremental: 3000, 4000, 5000, 6000, 7000
            { type: 'score', baseScore: 3000, baseMoves: 30, baseTime: null, mods: [], frozen: null },
            { type: 'combined', subTypes: ['collect', 'score'], baseCollect: 10, baseScore: 4000, baseMoves: 25, baseTime: null, mods: [], frozen: null },
            { type: 'combined', subTypes: ['coins', 'score'], baseCoins: 5, baseScore: 5000, baseMoves: 30, baseTime: null, mods: [], frozen: null },
            { type: 'score', baseScore: 6000, baseMoves: 35, baseTime: null, mods: [], frozen: null },
            { type: 'combined', subTypes: ['collect', 'score'], baseCollect: 10, baseScore: 7000, baseMoves: 28, baseTime: null, mods: [], frozen: null },
            
            // === FASE 2: APRENDIZAJE (Niveles 6-10) ===
            // Introducir pingüinos congelados y primeros niveles con tiempo
            // Score incremental: 8000, 9000, 10000, 11000, 12000
            { type: 'combined', subTypes: ['frozen', 'score'], baseScore: 8000, baseMoves: 25, baseTime: null, mods: [], frozen: { penguins: 2, chicks: 0 } },
            { type: 'score', baseScore: 9000, baseMoves: 35, baseTime: 90, mods: [], frozen: { penguins: 2, chicks: 0 } },
            { type: 'combined', subTypes: ['collect', 'score'], baseCollect: 10, baseScore: 10000, baseMoves: 30, baseTime: null, mods: [], frozen: { penguins: 2, chicks: 0 } },
            { type: 'combined', subTypes: ['multiCollect', 'score'], baseCollect: 10, baseScore: 11000, baseMoves: 35, baseTime: null, mods: [], frozen: { penguins: 2, chicks: 0 } },
            { type: 'combined', subTypes: ['frozen', 'score'], baseScore: 12000, baseMoves: 30, baseTime: null, mods: ['bonusCoins'], frozen: { penguins: 4, chicks: 0 } },
            
            // === FASE 3: DESAFÍO (Niveles 11-15) ===
            // Más pingüinos, introducir jackpots, más niveles con tiempo
            // Score incremental: 13000, 14000, 15000, 16000, 17000
            { type: 'score', baseScore: 13000, baseMoves: 40, baseTime: 120, mods: [], frozen: { penguins: 4, chicks: 0 } },
            { type: 'combined', subTypes: ['jackpots', 'score'], baseJackpots: 1, baseScore: 14000, baseMoves: 35, baseTime: null, mods: [], frozen: { penguins: 2, chicks: 0 } },
            { type: 'combined', subTypes: ['frozen', 'score'], baseScore: 15000, baseMoves: 35, baseTime: 90, mods: [], frozen: { penguins: 4, chicks: 0 } },
            { type: 'combined', subTypes: ['collect', 'score'], baseCollect: 15, baseScore: 16000, baseMoves: 35, baseTime: null, mods: [], frozen: { penguins: 4, chicks: 0 } },
            { type: 'combined', subTypes: ['coins', 'score'], baseCoins: 8, baseScore: 17000, baseMoves: 40, baseTime: null, mods: [], frozen: { penguins: 4, chicks: 0 } },
            
            // === FASE 4: AVANZADO (Niveles 16-20) ===
            // Modificadores, más hielo, tiempo más ajustado
            // Score incremental: 18000, 19000, 20000, 21000, 22000
            { type: 'score', baseScore: 18000, baseMoves: 45, baseTime: 150, mods: [], frozen: { penguins: 4, chicks: 0 } },
            { type: 'combined', subTypes: ['multiCollect', 'score'], baseCollect: 10, baseScore: 19000, baseMoves: 40, baseTime: null, mods: [], frozen: { penguins: 4, chicks: 0 } },
            { type: 'combined', subTypes: ['jackpots', 'score'], baseJackpots: 2, baseScore: 20000, baseMoves: 45, baseTime: 120, mods: [], frozen: { penguins: 4, chicks: 0 } },
            { type: 'combined', subTypes: ['frozen', 'score'], baseScore: 21000, baseMoves: 40, baseTime: null, mods: ['noShuffle'], frozen: { penguins: 6, chicks: 0 } },
            { type: 'score', baseScore: 22000, baseMoves: 50, baseTime: 180, mods: [], frozen: { penguins: 6, chicks: 0 } },
            
            // === FASE 5: EXPERTO (Niveles 21-25) ===
            // Introducir pollitos, objetivos combinados, tiempo crítico
            // Score incremental: 23000, 24000, 25000, 26000, 27000
            { type: 'combined', subTypes: ['score', 'frozen'], baseScore: 23000, baseMoves: 50, baseTime: null, mods: [], frozen: { penguins: 4, chicks: 2 } },
            { type: 'combined', subTypes: ['collect', 'frozen', 'score'], baseCollect: 10, baseScore: 24000, baseMoves: 45, baseTime: 150, mods: [], frozen: { penguins: 2, chicks: 4 } },
            { type: 'combined', subTypes: ['frozen', 'score'], baseScore: 25000, baseMoves: 45, baseTime: 120, mods: [], frozen: { penguins: 3, chicks: 3 } },
            { type: 'combined', subTypes: ['coins', 'frozen', 'score'], baseCoins: 10, baseScore: 26000, baseMoves: 50, baseTime: null, mods: [], frozen: { penguins: 4, chicks: 2 } },
            { type: 'combined', subTypes: ['jackpots', 'frozen', 'score'], baseJackpots: 2, baseScore: 27000, baseMoves: 50, baseTime: 180, mods: [], frozen: { penguins: 4, chicks: 2 } },
            
            // === FASE 6: MAESTRO (Niveles 26-30) ===
            // Desafíos máximos, scores balanceados, tiempo ajustado
            // Score incremental: 28000, 29000, 30000, 31000, 32000
            { type: 'combined', subTypes: ['multiCollect', 'frozen', 'score'], baseCollect: 10, baseScore: 28000, baseMoves: 55, baseTime: null, mods: [], frozen: { penguins: 4, chicks: 3 } },
            { type: 'combined', subTypes: ['score', 'frozen'], baseScore: 29000, baseMoves: 55, baseTime: 180, mods: ['noShuffle'], frozen: { penguins: 6, chicks: 4 } },
            { type: 'combined', subTypes: ['frozen', 'score'], baseScore: 30000, baseMoves: 50, baseTime: 150, mods: [], frozen: { penguins: 6, chicks: 4 } },
            { type: 'combined', subTypes: ['jackpots', 'frozen', 'score'], baseJackpots: 2, baseScore: 31000, baseMoves: 60, baseTime: 200, mods: [], frozen: { penguins: 6, chicks: 4 } },
            { type: 'score', baseScore: 32000, baseMoves: 70, baseTime: 240, mods: [], frozen: { penguins: 4, chicks: 4 } },
        ];
        
        for (let i = 0; i < 30; i++) {
            const config = levelConfigs[i];
            const levelNum = i + 1;
            
            // Determinar resistencia del hielo según fase
            let iceResistance = 1;
            if (levelNum <= 10) {
                iceResistance = diff.iceResistance.early;
            } else if (levelNum <= 20) {
                iceResistance = diff.iceResistance.mid;
            } else {
                iceResistance = diff.iceResistance.late;
            }
            
            // Calcular movimientos con multiplicador de dificultad
            let moves = Math.floor(config.baseMoves * diff.movesMultiplier);
            moves = Math.max(15, moves);
            
            // Calcular tiempo límite si existe
            let timeLimit = null;
            if (config.baseTime) {
                timeLimit = Math.floor(config.baseTime * diff.timeMultiplier);
            }
            
            // Construir objetivo
            const objective = buildLevelObjective(config, levelNum, collectSymbols, collectIndex, diff);
            if (config.type === 'collect' || config.type === 'multiCollect' || 
                (config.type === 'combined' && (config.subTypes.includes('collect') || config.subTypes.includes('multiCollect')))) {
                collectIndex++;
            }
            
            // Calcular recompensa de monedas del level (progresiva)
            const baseCoinReward = Math.floor(5 + (levelNum / 2));
            const coinReward = Math.floor(baseCoinReward * diff.coinBonus);
            
            // Estrellas basadas en puntuación (ajustadas a nuevos rangos)
            const starBase = 5000 + (levelNum * 1500);
            
            // Descripción del nivel
            const description = generateLevelDescription(config, levelNum);
            
            levels.push({
                level: levelNum,
                moves,
                timeLimit,  // nuevo: límite de tiempo en segundos o null
                objective,
                modifiers: config.mods || [],
                frozen: config.frozen,
                iceResistance,
                coinReward,
                description,
                stars: [
                    Math.floor(starBase * 0.5),
                    Math.floor(starBase * 0.75),
                    Math.floor(starBase * 1.0)
                ]
            });
        }
        return levels;
    }
    
    // Redondear score a miles
    function roundToThousand(score) {
        return Math.round(score / 1000) * 1000;
    }
    
    // Construir objetivo del nivel
    function buildLevelObjective(config, levelNum, collectSymbols, collectIndex, diff) {
        const type = config.type;
        
        switch (type) {
            case 'score':
                // Score base del config, ajustado por dificultad, redondeado a miles
                const scoreTarget = roundToThousand(config.baseScore * diff.scoreMultiplier);
                return { type: 'score', target: scoreTarget, desc: `Consigue ${scoreTarget.toLocaleString()} puntos` };
                
            case 'collect':
                const collectTarget = Math.ceil(config.baseCollect * diff.collectMultiplier);
                const collectSymbol = collectSymbols[collectIndex % collectSymbols.length];
                return { 
                    type: 'collect', 
                    symbol: collectSymbol, 
                    target: collectTarget, 
                    desc: `Recolecta ${collectTarget}x ${collectSymbol}` 
                };
                
            case 'multiCollect':
                const multiTarget = Math.ceil(config.baseCollect * diff.collectMultiplier);
                const sym1 = collectSymbols[collectIndex % collectSymbols.length];
                const sym2 = collectSymbols[(collectIndex + 3) % collectSymbols.length];
                // Asegurar que sean diferentes
                const finalSym2 = sym1 === sym2 ? collectSymbols[(collectIndex + 1) % collectSymbols.length] : sym2;
                return { 
                    type: 'multiCollect', 
                    symbols: [sym1, finalSym2], 
                    target: multiTarget, 
                    desc: `Recolecta ${multiTarget}x ${sym1} y ${multiTarget}x ${finalSym2}` 
                };
                
            case 'coins':
                const coinsTarget = Math.max(3, Math.ceil(config.baseCoins * diff.collectMultiplier));
                return { type: 'coins', target: coinsTarget, desc: `Recolecta ${coinsTarget} monedas 💰` };
                
            case 'jackpots':
                const jackpotTarget = config.baseJackpots || 1;
                return { type: 'jackpots', target: jackpotTarget, desc: `Haz ${jackpotTarget} Jackpot${jackpotTarget > 1 ? 's' : ''} 7️⃣` };
                
            case 'frozen':
                const frozenCalc = calculateFrozenCount(config.frozen?.penguins || 0, config.frozen?.chicks || 0);
                return buildFrozenObjective(frozenCalc.penguins, frozenCalc.chicks);
                
            case 'combined':
                return buildCombinedObjective(config, levelNum, collectSymbols, collectIndex, diff);
                
            default:
                return { type: 'score', target: 10000, desc: 'Consigue 10,000 puntos' };
        }
    }
    
    // Construir objetivo de figuras congeladas
    function buildFrozenObjective(penguins, chicks) {
        let desc = 'Libera ';
        const parts = [];
        
        if (penguins > 0) {
            parts.push(`${penguins} 🐧`);
        }
        if (chicks > 0) {
            parts.push(`${chicks} 🐤`);
        }
        
        desc += parts.join(' y ');
        
        return {
            type: 'frozen',
            penguins,
            chicks,
            desc
        };
    }
    
    // Construir objetivo combinado
    function buildCombinedObjective(config, levelNum, collectSymbols, collectIndex, diff) {
        const objectives = [];
        let desc = '';
        
        // Todos los símbolos siempre disponibles
        const availableSymbols = collectSymbols;
        
        for (const subType of config.subTypes) {
            if (subType === 'score') {
                // Score base del config, ajustado por dificultad (70% para combinados)
                const scoreTarget = roundToThousand((config.baseScore || 20000) * diff.scoreMultiplier * 0.7);
                objectives.push({ type: 'score', target: scoreTarget });
                desc += `${scoreTarget.toLocaleString()} pts`;
            } else if (subType === 'collect') {
                const target = Math.ceil((config.baseCollect || 8) * diff.collectMultiplier);
                const symbol = availableSymbols[collectIndex % availableSymbols.length];
                objectives.push({ type: 'collect', symbol, target });
                desc += `${target}x ${symbol}`;
            } else if (subType === 'multiCollect') {
                const target = Math.ceil((config.baseCollect || 8) * diff.collectMultiplier);
                const sym1 = availableSymbols[collectIndex % availableSymbols.length];
                const sym2idx = (collectIndex + 3) % availableSymbols.length;
                const sym2 = sym1 === availableSymbols[sym2idx] 
                    ? availableSymbols[(collectIndex + 1) % availableSymbols.length] 
                    : availableSymbols[sym2idx];
                objectives.push({ type: 'multiCollect', symbols: [sym1, sym2], target });
                desc += `${target}x ${sym1}+${sym2}`;
            } else if (subType === 'coins') {
                const target = Math.max(3, Math.ceil((config.baseCoins || 5) * diff.collectMultiplier));
                objectives.push({ type: 'coins', target });
                desc += `${target} 💰`;
            } else if (subType === 'jackpots') {
                const target = config.baseJackpots || 1;
                objectives.push({ type: 'jackpots', target });
                desc += `${target} triple 7`;
            } else if (subType === 'frozen') {
                const frozenCalc = calculateFrozenCount(config.frozen?.penguins || 0, config.frozen?.chicks || 0);
                objectives.push({ type: 'frozen', penguins: frozenCalc.penguins, chicks: frozenCalc.chicks });
                if (frozenCalc.penguins > 0 && frozenCalc.chicks > 0) {
                    desc += `${frozenCalc.penguins}🐧 + ${frozenCalc.chicks}🐤`;
                } else if (frozenCalc.penguins > 0) {
                    desc += `${frozenCalc.penguins}🐧`;
                } else {
                    desc += `${frozenCalc.chicks}🐤`;
                }
            }
            
            if (config.subTypes.indexOf(subType) < config.subTypes.length - 1) {
                desc += ' + ';
            }
        }
        
        return {
            type: 'combined',
            objectives,
            desc
        };
    }
    
    // Generar descripción del nivel
    function generateLevelDescription(config, levelNum) {
        const descriptions = {
            1: 'Tutorial de puntuación',
            2: 'Aprender a recolectar',
            3: 'Buscar monedas',
            4: 'Más puntuación',
            5: 'Recolección básica',
            6: '¡Libera al pingüino! 🐧',
            7: 'Puntos con hielo',
            8: 'Recolecta y libera',
            9: 'Dos símbolos diferentes',
            10: 'Más pingüinos',
            11: 'Desafío de puntos',
            12: 'Busca los 7s',
            13: 'Muchos pingüinos',
            14: 'Recolección avanzada',
            15: 'Monedas heladas',
            16: 'Puntos difíciles',
            17: 'Doble recolección',
            18: 'Jackpot congelado',
            19: 'Sin mezclar',
            20: 'Pingüinos expertos',
            21: '¡Llegan los pollitos! 🐤',
            22: 'Recolecta y rescata',
            23: 'Zoológico helado',
            24: 'Monedas y animales',
            25: 'Jackpot + rescate',
            26: 'Doble rescate',
            27: 'Maestro del hielo',
            28: 'Gran rescate',
            29: 'Jackpot maestro',
            30: '¡NIVEL FINAL!'
        };
        
        return descriptions[levelNum] || `Nivel ${levelNum}`;
    }

    // ==========================================
    // ESTADO DEL JUEGO
    // ==========================================
    let state = {
        board: [],
        coinBoard: [], // Tablero de monedas (true/false por celda)
        frozenBoard: [], // Tablero de cells congeladas {type: 'penguin'|'chick', resistance: N} o null
        score: 0,
        moves: 0,
        time: 0,
        combo: 0,
        maxCombo: 0,
        totalMatches: 0,
        collected: {},
        selectedCell: null,
        isAnimating: false,
        gameOver: false,
        paused: false,
        mode: null,
        modeOption: null,
        difficulty: 'normal',
        adventureLevel: 1,
        adventureLevels: generateAdventureLevels('normal'),
        timerInterval: null,
        username: localStorage.getItem('tragamonedasUsername') || '',
        soundEnabled: localStorage.getItem('tragamonedasSound') !== 'false',
        vibrationEnabled: localStorage.getItem('tragamonedasVibration') !== 'false',
        // Sistema de multiplicador para los 7
        multiplier: 1,
        multiplierMoves: 0,
        jackpotCount: 0,
        jackpotsThisGame: 0, // Jackpots conseguidos en esta partida
        combosThisGame: 0,   // Combos x2+ conseguidos en esta partida
        // Sistema de figuras congeladas
        penguinsFreed: 0,    // Pingüinos liberados en esta partida
        chicksFreed: 0,      // Pollitos liberados en esta partida
        // Sistema de monedas y comodines
        coins: parseInt(localStorage.getItem('tragamonedasCoins')) || 0,
        coinsEarnedThisGame: 0,
        powerups: (() => {
            const saved = JSON.parse(localStorage.getItem('tragamonedasPowerups')) || {};
            // Migrar wildcard a extraTime si existe
            if (saved.wildcard !== undefined && saved.extraTime === undefined) {
                saved.extraTime = saved.wildcard;
                delete saved.wildcard;
                localStorage.setItem('tragamonedasPowerups', JSON.stringify(saved));
            }
            // Migrar lightning a extraTime si existe
            if (saved.lightning !== undefined && saved.extraTime === undefined) {
                saved.extraTime = saved.lightning;
                delete saved.lightning;
                localStorage.setItem('tragamonedasPowerups', JSON.stringify(saved));
            }
            return {
                shuffle: saved.shuffle || 0,
                bomb: saved.bomb || 0,
                extraTime: saved.extraTime || 0,
                extraMoves: saved.extraMoves || 0
            };
        })(),
        activePowerup: null, // Para modo bomba que requiere seleccionar celda
        activePowerupPaid: false, // Si el powerup activo fue comprado (no del inventario)
        // Sistema de niveles completados por dificultad
        completedLevels: JSON.parse(localStorage.getItem('tragamonedasCompletedLevels')) || {
            easy: [],
            normal: [],
            hard: []
        },
        // Estrellas obtenidas por level (1-3)
        levelStars: JSON.parse(localStorage.getItem('tragamonedasLevelStars')) || {
            easy: {},
            normal: {},
            hard: {}
        },
        // Configuración dinámica del level actual
        activeSymbols: CONFIG.SYMBOLS.slice(), // Siempre 8 símbolos (7 tiene prob reducida)
        levelModifiers: [], // Modificadores activos (noShuffle, bonusCoins, etc)
        levelCoinChance: CONFIG.COIN_CHANCE, // Probabilidad de monedas del nivel
        levelIceResistance: 2, // Resistencia del hielo en level actual
        // Sistema de advertencias
        noMovesCount: 0 // Veces que se quedó sin movimientos en esta partida
    };

    // ==========================================
    // ELEMENTOS DEL DOM
    // ==========================================
    const elements = {};

    function cacheElements() {
        elements.menuScreen = document.getElementById('menu-screen');
        elements.selectScreen = document.getElementById('select-screen');
        elements.gameScreen = document.getElementById('game-screen');
        elements.gameBoard = document.getElementById('game-board');
        elements.score = document.getElementById('score');
        elements.modeInfo = document.getElementById('mode-info');
        elements.objectiveBar = document.getElementById('objective-bar');
        elements.objectiveText = document.getElementById('objective-text');
        elements.objectiveProgress = document.getElementById('objective-progress');
        elements.comboDisplay = document.getElementById('combo-display');
        elements.pauseModal = document.getElementById('pause-modal');
        elements.gameoverModal = document.getElementById('gameover-modal');
        elements.victoryModal = document.getElementById('victory-modal');
        elements.rankingModal = document.getElementById('ranking-modal');
        elements.usernameModal = document.getElementById('username-modal');
        elements.settingsModal = document.getElementById('settings-modal');
        elements.selectOptions = document.getElementById('select-options');
        elements.selectTitle = document.getElementById('select-title');
        elements.particlesContainer = document.getElementById('particles-container');
        elements.effectOverlay = document.getElementById('effect-overlay');
        // Cache de cells del tablero (se llena en renderBoard)
        elements.cellCache = [];
    }

    // ==========================================
    // UTILIDADES
    // ==========================================
    function vibrate(pattern = 50) {
        if (state.vibrationEnabled && navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }

    // ==========================================
    // SOUND SYSTEM - Web Audio API + Archivos de audio
    // ==========================================
    let audioContext = null;
    
    // Cache de archivos de audio
    const audioCache = {
        jackpot: null,
        coin: null,
        match4: null,
        match5: null,
        gameover: null,
        victory: null,
        'ice-break': null
    };
    
    function initAudio() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        // Resume context if suspended (needed after user interaction)
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        // Precargar archivos de audio
        if (!audioCache.jackpot) {
            audioCache.jackpot = new Audio('sounds/jackpot.mp3');
            audioCache.jackpot.volume = 0.6;
        }
        if (!audioCache.coin) {
            audioCache.coin = new Audio('sounds/coin.mp3');
            audioCache.coin.volume = 0.5;
        }
        if (!audioCache.match4) {
            audioCache.match4 = new Audio('sounds/match4.mp3');
            audioCache.match4.volume = 0.5;
        }
        if (!audioCache.match5) {
            audioCache.match5 = new Audio('sounds/match5.mp3');
            audioCache.match5.volume = 0.6;
        }
        if (!audioCache.gameover) {
            audioCache.gameover = new Audio('sounds/gameover.mp3');
            audioCache.gameover.volume = 0.5;
        }
        if (!audioCache.victory) {
            audioCache.victory = new Audio('sounds/victory.mp3');
            audioCache.victory.volume = 0.6;
        }
        if (!audioCache['ice-break']) {
            audioCache['ice-break'] = new Audio('sounds/ice-break.mp3');
            audioCache['ice-break'].volume = 0.5;
        }
    }
    
    // Reproducir archivo de audio desde cache
    function playAudioFile(name, volume = 1.0) {
        if (!state.soundEnabled) return;
        try {
            const audio = audioCache[name];
            if (audio) {
                audio.currentTime = 0;
                audio.volume = Math.min(1.0, Math.max(0, volume));
                audio.play().catch(e => console.log(`Error playing ${name}:`, e));
            }
        } catch (e) {
            console.log(`Error playing audio ${name}:`, e);
        }
    }
    
    function playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!state.soundEnabled || !audioContext) return;
        
        try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        } catch (e) {
            console.log('Error playing tone:', e);
        }
    }
    
    function playSound(type) {
        if (!state.soundEnabled) return;
        initAudio();
        
        switch (type) {
            case 'select':
                // Click suave
                playTone(600, 0.1, 'sine', 0.2);
                break;
                
            case 'swap':
                // Swap de fichas
                playTone(450, 0.15, 'sine', 0.25);
                break;
                
            case 'invalid':
                // Movimiento inválido
                playTone(180, 0.2, 'sawtooth', 0.2);
                break;
                
            case 'match':
                // Match de 3
                playTone(659, 0.15, 'sine', 0.25);
                break;
                
            case 'match4':
                // Match de 4 - mismo sonido que match3
                playTone(659, 0.15, 'sine', 0.25);
                break;
                
            case 'match5':
                // Match de 5+ - archivo de audio especial
                playAudioFile('match5');
                break;
                
            case 'combo':
                // Combo
                playTone(1000, 0.15, 'square', 0.25);
                break;
                
            case 'coin':
                // Recolectar moneda - archivo de audio (volumen bajo)
                playAudioFile('coin', 0.4);
                break;
                
            case 'jackpot':
                // Jackpot (7s) - ascendente
                playTone(600, 0.15, 'square', 0.3);
                playTone(800, 0.15, 'square', 0.3);
                playTone(1000, 0.3, 'sine', 0.35);
                break;
                
            case 'megajackpot':
                // Mega Jackpot - archivo de audio épico
                playAudioFile('jackpot');
                break;
                
            case 'powerup':
                // Usar comodín
                playTone(1000, 0.2, 'triangle', 0.3);
                break;
                
            case 'bomb':
                // Explosión bomba
                playTone(120, 0.4, 'sawtooth', 0.4);
                break;
                
            case 'extraTime':
                // Sonido de reloj de arena - tiempo extra
                playTone(600, 0.15, 'sine', 0.25);
                setTimeout(() => playTone(900, 0.15, 'sine', 0.2), 100);
                break;
                
            case 'shuffle':
                // Mezclar tablero
                playTone(500, 0.2, 'sine', 0.25);
                break;
                
            case 'victory':
                // Victoria - archivo de audio
                playAudioFile('victory');
                break;
                
            case 'gameover':
                // Game over - archivo de audio
                playAudioFile('gameover');
                break;
                
            case 'buy':
                // Comprar en tienda
                playTone(1000, 0.2, 'sine', 0.3);
                break;
                
            case 'error':
                // Error (fondos insuficientes) - simplified
                playTone(180, 0.25, 'square', 0.25);
                break;
                
            case 'drop':
                // Fichas cayendo
                playTone(300, 0.05, 'sine', 0.15);
                break;
                
            case 'levelup':
                // Subir de level - simplified
                playTone(784, 0.15, 'sine', 0.3);
                playTone(1047, 0.25, 'sine', 0.35);
                break;
                
            case 'icecrack':
                // Grieta en hielo - un crack
                playAudioFile('ice-break', 0.4);
                break;
                
            case 'icebreak':
                // Rotura completa - doble crack-crack (con clones para superposición)
                playAudioFile('ice-break', 0.5);
                setTimeout(() => {
                    // Crear clon para que suene encima del primero
                    if (state.soundEnabled && audioCache['ice-break']) {
                        const clone = audioCache['ice-break'].cloneNode();
                        clone.volume = 0.6;
                        clone.play().catch(e => {});
                    }
                }, 130);
                break;
                
            case 'chirp':
                // Pio pio - simplified
                playTone(3000, 0.1, 'sine', 0.4);
                playTone(3400, 0.12, 'sine', 0.35);
                break;
        }
    }

    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
        
        // Recargar ranking compacto cuando se vuelve al menu
        if (screenId === 'menu-screen' && typeof loadCompactRanking === 'function') {
            loadCompactRanking();
        }
    }

    function showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }

    function hideModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    function hideAllModals() {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    }

    // ==========================================
    // ANIMACIONES DE POWERUPS
    // ==========================================
    function showPowerupAnimation(type) {
        const overlay = document.createElement('div');
        overlay.className = `powerup-animation powerup-anim-${type}`;
        
        switch(type) {
            case 'shuffle':
                overlay.innerHTML = '🔀';
                // Efecto de mezcla en el tablero
                if (elements.gameBoard) {
                    elements.gameBoard.classList.add('shuffling');
                    setTimeout(() => {
                        elements.gameBoard.classList.remove('shuffling');
                    }, 1000);
                }
                break;
            case 'extraTime':
                overlay.innerHTML = '+60s';
                break;
            case 'extraMoves':
                overlay.innerHTML = '+20';
                break;
            case 'bomb':
                // La bomba ya tiene su propia animación
                return;
        }
        
        document.body.appendChild(overlay);
        
        // Remover después de la animación
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 1100);
    }

    // ==========================================
    // SISTEMA DE MONEDAS Y COMODINES
    // ==========================================
    function saveCoins() {
        saveUserProgress();
    }
    
    function savePowerups() {
        saveUserProgress();
    }
    
    function updateCoinsDisplay() {
        const displays = ['total-coins', 'game-coins'];
        displays.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = state.coins;
                // Mostrar en rojo si hay deuda (negativo)
                if (state.coins < 0) {
                    el.classList.add('negative');
                } else {
                    el.classList.remove('negative');
                }
            }
        });
        updatePowerupsDisplay();
    }
    
    // Obtener precio de powerup (siempre 50 monedas)
    function getPowerupPrice(type) {
        return CONFIG.POWERUP_PRICES[type] || 50;
    }
    
    function updatePowerupsDisplay() {
        Object.keys(state.powerups).forEach(key => {
            const el = document.getElementById(`count-${key}`);
            const btn = document.getElementById(`powerup-${key}`);
            const price = getPowerupPrice(key);
            
            if (el) {
                // Si tiene powerups, mostrar cantidad; si no, mostrar precio
                if (state.powerups[key] > 0) {
                    el.textContent = state.powerups[key];
                    el.classList.remove('show-price');
                } else {
                    el.textContent = `💰${price}`;
                    el.classList.add('show-price');
                }
            }
            
            if (btn) {
                // Habilitar si tiene powerups O si puede comprarlo
                const canUse = state.powerups[key] > 0 || state.coins >= price;
                const isBlocked = key === 'shuffle' && state.levelModifiers.includes('noShuffle');
                
                btn.classList.toggle('disabled', !canUse || isBlocked);
                
                // Agregar indicador visual si está bloqueado por modificador
                if (isBlocked) {
                    btn.classList.add('blocked');
                    btn.title = 'Bloqueado en este nivel';
                } else {
                    btn.classList.remove('blocked');
                    btn.title = state.powerups[key] > 0 ? '' : `Comprar por ${price} monedas`;
                }
            }
        });
    }
    
    function showCoinCollected(amount) {
        const notification = document.createElement('div');
        notification.className = 'coin-notification';
        notification.innerHTML = `<span class="coin-icon">💰</span> +${amount}`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 800);
    }
    
    function showMatch5Bonus(amount) {
        const notification = document.createElement('div');
        notification.className = 'match5-notification';
        notification.innerHTML = `
            <span class="match5-icon">✨</span>
            <span class="match5-text">¡COMBO x5!</span>
            <span class="match5-coins">+${amount} 💰</span>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 400);
        }, 1500);
    }
    
    function buyPowerup(type) {
        const price = getPowerupPrice(type);
        const coinsBefore = state.coins;
        const powerupsBefore = state.powerups[type];

        if (state.coins >= price) {
            state.coins -= price;
            state.powerups[type]++;
            saveCoins();
            savePowerups();
            updateCoinsDisplay();
            vibrate(50);
            playSound('buy');

            // Log de compra de powerup
            gameLog.log('powerup_payment', {
                type,
                coinsBefore,
                coinsAfter: state.coins,
                powerupsBefore,
                powerupsAfter: state.powerups[type],
                price,
                success: true
            });

            return true;
        }
        playSound('error');
        return false;
    }
    
    function usePowerup(type) {
        if (state.isAnimating || state.gameOver) return false;
        
        // Verificar modificador noShuffle
        if (type === 'shuffle' && state.levelModifiers.includes('noShuffle')) {
            playSound('error');
            gameLog.log('powerup_blocked', { type, reason: 'noShuffle modifier' });
            return false;
        }
        
        const price = getPowerupPrice(type);
        const hasPowerup = state.powerups[type] > 0;
        const canBuy = state.coins >= price;
        const coinsBefore = state.coins;
        const powerupsBefore = state.powerups[type];
        
        // Si no tiene el powerup y no puede comprarlo, error
        if (!hasPowerup && !canBuy) {
            playSound('error');
            vibrate([50, 30, 50]);
            gameLog.log('powerup_failed', { type, reason: 'insufficient_funds', coins: coinsBefore, price });
            return false;
        }
        
        switch (type) {
            case 'shuffle':
                // Bloquear interacción durante animación
                state.isAnimating = true;
                
                // Consumir o comprar inmediatamente
                if (hasPowerup) {
                    state.powerups[type]--;
                } else {
                    state.coins -= price;
                    saveCoins();
                }
                savePowerups();
                updatePowerupsDisplay();
                updateCoinsDisplay();
                
                // Log del uso
                gameLog.log('powerup_use', {
                    type,
                    hadInInventory: hasPowerup,
                    coinsBefore,
                    coinsAfter: state.coins,
                    powerupsBefore,
                    powerupsAfter: state.powerups[type]
                });
                
                // Animación visual (1 segundo)
                showPowerupAnimation('shuffle');
                vibrate([50, 30, 50]);
                playSound('shuffle');
                
                // Ejecutar shuffle después de la animación
                setTimeout(() => {
                    shuffleBoard();
                    state.isAnimating = false;
                }, 1000);
                
                return true;
                
            case 'bomb':
                // Activar modo selección (se consume al ejecutar)
                state.activePowerup = type;
                state.activePowerupPaid = !hasPowerup; // Marcar si hay que cobrar al usar
                elements.gameBoard.classList.add('powerup-mode', `${type}-mode`);
                playSound('powerup');
                gameLog.log('powerup_activate', { type, willPay: !hasPowerup });
                return true;
                
            case 'extraTime':
                // Solo funciona en niveles con límite de tiempo
                if (state.mode === 'adventure') {
                    const level = state.adventureLevels[state.adventureLevel - 1];
                    if (level && level.timeLimit && state.time > 0) {
                        const timeBefore = state.time;
                        
                        // Consumir o comprar inmediatamente
                        if (hasPowerup) {
                            state.powerups[type]--;
                        } else {
                            state.coins -= price;
                            saveCoins();
                        }
                        state.time += 60; // +60 segundos
                        savePowerups();
                        updatePowerupsDisplay();
                        updateCoinsDisplay();
                        updateModeInfo();
                        
                        // Log y animación
                        gameLog.log('powerup_use', {
                            type,
                            hadInInventory: hasPowerup,
                            coinsBefore,
                            coinsAfter: state.coins,
                            timeBefore,
                            timeAfter: state.time
                        });
                        showPowerupAnimation('extraTime');
                        
                        vibrate(50);
                        playSound('powerup');
                        return true;
                    }
                }
                gameLog.log('powerup_failed', { type, reason: 'not_applicable', mode: state.mode });
                return false;
                
            case 'extraMoves':
                if (state.mode === 'moves' || state.mode === 'adventure') {
                    const movesBefore = state.moves;
                    
                    // Consumir o comprar inmediatamente
                    if (hasPowerup) {
                        state.powerups[type]--;
                    } else {
                        state.coins -= price;
                        saveCoins();
                    }
                    state.moves += 20;
                    savePowerups();
                    updatePowerupsDisplay();
                    updateCoinsDisplay();
                    updateModeInfo();
                    
                    // Log y animación
                    gameLog.log('powerup_use', {
                        type,
                        hadInInventory: hasPowerup,
                        coinsBefore,
                        coinsAfter: state.coins,
                        movesBefore,
                        movesAfter: state.moves
                    });
                    showPowerupAnimation('extraMoves');
                    
                    vibrate(50);
                    playSound('powerup');
                    return true;
                }
                gameLog.log('powerup_failed', { type, reason: 'not_applicable', mode: state.mode });
                return false;
        }
        return false;
    }
    
    async function executeBomb(row, col) {
        const coinsBefore = state.coins;
        const hadInInventory = !state.activePowerupPaid;
        
        // Consumir powerup o cobrar monedas
        if (state.activePowerupPaid) {
            state.coins -= getPowerupPrice('bomb');
            saveCoins();
        } else {
            state.powerups.bomb--;
        }
        savePowerups();
        updatePowerupsDisplay();
        updateCoinsDisplay();
        state.activePowerup = null;
        state.activePowerupPaid = false;
        elements.gameBoard.classList.remove('powerup-mode', 'bomb-mode');
        
        // Log de uso de bomba
        gameLog.log('powerup_use', {
            type: 'bomb',
            hadInInventory,
            coinsBefore,
            coinsAfter: state.coins,
            position: { row, col }
        });
        
        state.isAnimating = true;
        playSound('bomb');
        const cellsToRemove = [];
        
        // Área de 4x4 centrada en la celda (2 cells en cada dirección desde el centro)
        for (let r = row - 2; r <= row + 1; r++) {
            for (let c = col - 2; c <= col + 1; c++) {
                if (r >= 0 && r < CONFIG.ROWS && c >= 0 && c < CONFIG.COLS) {
                    cellsToRemove.push({ r, c });
                    const cell = getCellElement(r, c);
                    if (cell) cell.classList.add('exploding');
                }
            }
        }
        
        vibrate([100, 50, 100]);
        await sleep(300);
        
        // Remover clase exploding para que las cells vuelvan a ser visibles
        for (const pos of cellsToRemove) {
            const cell = getCellElement(pos.r, pos.c);
            if (cell) cell.classList.remove('exploding');
        }
        
        for (const pos of cellsToRemove) {
            // Recolectar monedas
            if (state.coinBoard[pos.r] && state.coinBoard[pos.r][pos.c]) {
                state.coins++;
                state.coinsEarnedThisGame++;
                state.coinBoard[pos.r][pos.c] = false;
            }
            // Romper hielo si existe
            if (state.frozenBoard[pos.r] && state.frozenBoard[pos.r][pos.c]) {
                const frozen = state.frozenBoard[pos.r][pos.c];
                frozen.resistance--;
                if (frozen.resistance <= 0) {
                    // Liberar figura congelada con recompensas
                    const config = frozen.type === 'penguin' ? FROZEN_CONFIG.penguin : FROZEN_CONFIG.chick;
                    
                    // Incrementar contadores
                    if (frozen.type === 'penguin') state.penguinsFreed++;
                    if (frozen.type === 'chick') state.chicksFreed++;
                    
                    // Dar monedas de recompensa
                    state.coins += config.coinReward;
                    state.coinsEarnedThisGame += config.coinReward;
                    
                    // Efectos
                    showAnimalFreed(config.symbol, config.coinReward);
                    playSound('icebreak');
                    playSound('chirp');
                    
                    state.frozenBoard[pos.r][pos.c] = null;
                } else {
                    // Hielo danado pero no destruido - NO borrar el simbolo
                    playSound('icecrack');
                    continue; // Saltar el borrado del simbolo
                }
            }
            state.board[pos.r][pos.c] = null;
        }
        
        saveCoins();
        updateCoinsDisplay();
        
        await dropCells();
        await fillEmptyCells();
        await processMatches();
        
        state.isAnimating = false;
    }
    
    function cancelPowerup() {
        state.activePowerup = null;
        state.activePowerupPaid = false;
        elements.gameBoard.classList.remove('powerup-mode', 'bomb-mode');
    }

    // ==========================================
    // TABLERO
    // ==========================================
    function createBoard() {
        state.board = [];
        state.coinBoard = [];
        state.frozenBoard = [];
        
        // Usar coin probabilitys del nivel
        const coinChance = state.levelCoinChance || CONFIG.COIN_CHANCE;
        
        for (let r = 0; r < CONFIG.ROWS; r++) {
            state.board[r] = [];
            state.coinBoard[r] = [];
            state.frozenBoard[r] = [];
            for (let c = 0; c < CONFIG.COLS; c++) {
                state.board[r][c] = getRandomSymbol();
                state.coinBoard[r][c] = Math.random() < coinChance;
                state.frozenBoard[r][c] = null;
            }
        }
        
        // Eliminar matches iniciales
        let hasMatches = true;
        let attempts = 0;
        while (hasMatches && attempts < 100) {
            hasMatches = false;
            for (let r = 0; r < CONFIG.ROWS; r++) {
                for (let c = 0; c < CONFIG.COLS; c++) {
                    if (checkMatchAt(r, c).length >= CONFIG.MIN_MATCH) {
                        state.board[r][c] = getRandomSymbol();
                        hasMatches = true;
                    }
                }
            }
            attempts++;
        }
        
        // Colocar figuras congeladas si el level lo requiere
        placeFrozenCells();
    }
    
    // Colocar figuras congeladas en posiciones aleatorias
    function placeFrozenCells() {
        if (state.mode !== 'adventure') return;
        
        const level = state.adventureLevels[state.adventureLevel - 1];
        if (!level) return;
        
        // Obtener la cantidad de figuras del OBJETIVO, no de la config base
        // Esto asegura que haya suficientes figuras para completar el nivel
        let penguins = 0;
        let chicks = 0;
        
        const objective = level.objective;
        if (objective) {
            if (objective.type === 'frozen') {
                penguins = objective.penguins || 0;
                chicks = objective.chicks || 0;
            } else if (objective.type === 'combined' && objective.objectives) {
                // Buscar objetivo frozen dentro del combinado
                const frozenObj = objective.objectives.find(o => o.type === 'frozen');
                if (frozenObj) {
                    penguins = frozenObj.penguins || 0;
                    chicks = frozenObj.chicks || 0;
                }
            }
        }
        
        // Si no hay objetivo de frozen pero el level tiene frozen decorativo, usar valores base con multiplicador
        if (penguins === 0 && chicks === 0 && level.frozen) {
            const calc = calculateFrozenCount(level.frozen.penguins || 0, level.frozen.chicks || 0);
            penguins = calc.penguins;
            chicks = calc.chicks;
        }
        
        if (penguins === 0 && chicks === 0) return;
        
        const resistance = level.iceResistance || state.levelIceResistance;
        
        // Obtener posiciones disponibles (evitar bordes para mejor jugabilidad)
        const availablePositions = [];
        for (let r = 1; r < CONFIG.ROWS - 1; r++) {
            for (let c = 1; c < CONFIG.COLS - 1; c++) {
                availablePositions.push({ r, c });
            }
        }
        
        // Mezclar posiciones
        for (let i = availablePositions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availablePositions[i], availablePositions[j]] = [availablePositions[j], availablePositions[i]];
        }
        
        // Colocar pingüinos
        for (let i = 0; i < penguins && i < availablePositions.length; i++) {
            const pos = availablePositions[i];
            state.frozenBoard[pos.r][pos.c] = {
                type: 'penguin',
                resistance: resistance
            };
            // Quitar moneda y símbolo de celda congelada (celda vacía detrás del hielo)
            state.coinBoard[pos.r][pos.c] = false;
            state.board[pos.r][pos.c] = null;
        }
        
        // Colocar pollitos
        for (let i = penguins; i < penguins + chicks && i < availablePositions.length; i++) {
            const pos = availablePositions[i];
            state.frozenBoard[pos.r][pos.c] = {
                type: 'chick',
                resistance: resistance
            };
            // Quitar moneda y símbolo de celda congelada (celda vacía detrás del hielo)
            state.coinBoard[pos.r][pos.c] = false;
            state.board[pos.r][pos.c] = null;
        }
    }

    function getRandomSymbol() {
        // Siempre usar todos los 8 símbolos (7 frutas + el 7)
        const symbols = state.activeSymbols || CONFIG.SYMBOLS;
        
        // Reducir probabilidad de 7 a la mitad (~6.25% vs ~13.39% para otros)
        // El 7 tiene 50% de probabilidad respecto a otros símbolos
        if (symbols.includes('7')) {
            // 50% de las veces, excluir el 7 de la selección
            if (Math.random() < 0.5) {
                const symbolsWithout7 = symbols.filter(s => s !== '7');
                if (symbolsWithout7.length > 0) {
                    return symbolsWithout7[Math.floor(Math.random() * symbolsWithout7.length)];
                }
            }
        }
        
        return symbols[Math.floor(Math.random() * symbols.length)];
    }

    function renderBoard() {
        elements.gameBoard.innerHTML = '';
        elements.gameBoard.style.gridTemplateColumns = `repeat(${CONFIG.COLS}, var(--cell-size))`;
        elements.gameBoard.style.gridTemplateRows = `repeat(${CONFIG.ROWS}, var(--cell-size))`;
        
        // Inicializar caché de cells
        elements.cellCache = [];
        for (let r = 0; r < CONFIG.ROWS; r++) {
            elements.cellCache[r] = [];
        }
        
        for (let r = 0; r < CONFIG.ROWS; r++) {
            for (let c = 0; c < CONFIG.COLS; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                
                // Verificar si tiene moneda
                if (state.coinBoard[r] && state.coinBoard[r][c]) {
                    cell.classList.add('has-coin');
                }
                
                // Verificar si está congelada
                const frozen = state.frozenBoard[r] && state.frozenBoard[r][c];
                if (frozen) {
                    cell.classList.add('frozen');
                    cell.classList.add(`frozen-${frozen.type}`);
                    cell.dataset.resistance = frozen.resistance;
                }
                
                cell.dataset.row = r;
                cell.dataset.col = c;
                
                // Renderizar contenido de celda
                if (frozen) {
                    // Celda congelada - mostrar animal + hielo
                    const animalSymbol = frozen.type === 'penguin' ? '🐧' : '🐤';
                    cell.innerHTML = `
                        <span class="symbol frozen-animal">${animalSymbol}</span>
                        <span class="ice-layer ice-${frozen.resistance}"></span>
                    `;
                } else {
                    const symbol = state.board[r][c];
                    if (symbol === null || symbol === undefined) {
                        cell.innerHTML = `<span class="symbol"></span>`;
                    } else if (symbol === '7') {
                        cell.innerHTML = `<span class="symbol symbol-seven">7</span>`;
                    } else {
                        cell.innerHTML = `<span class="symbol">${symbol}</span>`;
                    }
                }
                
                cell.addEventListener('click', () => handleCellClick(r, c));
                cell.addEventListener('touchstart', (e) => handleTouchStart(e, r, c), { passive: false });
                cell.addEventListener('touchend', handleTouchEnd, { passive: false });
                cell.addEventListener('touchmove', handleTouchMove, { passive: false });
                
                elements.gameBoard.appendChild(cell);
                
                // Guardar en caché
                elements.cellCache[r][c] = cell;
            }
        }
    }

    function updateCell(r, c) {
        const cell = getCellElement(r, c);
        if (!cell) return;
        
        // Limpiar clases anteriores
        cell.classList.remove('frozen', 'frozen-penguin', 'frozen-chick', 'has-coin');
        
        // Verificar si tiene moneda
        if (state.coinBoard[r] && state.coinBoard[r][c]) {
            cell.classList.add('has-coin');
        }
        
        // Verificar si está congelada
        const frozen = state.frozenBoard[r] && state.frozenBoard[r][c];
        if (frozen) {
            cell.classList.add('frozen');
            cell.classList.add(`frozen-${frozen.type}`);
            cell.dataset.resistance = frozen.resistance;
            const animalSymbol = frozen.type === 'penguin' ? '🐧' : '🐤';
            cell.innerHTML = `
                <span class="symbol frozen-animal">${animalSymbol}</span>
                <span class="ice-layer ice-${frozen.resistance}"></span>
            `;
        } else {
            const symbol = state.board[r][c];
            const currentSymbol = cell.dataset.symbol;
            
            // Solo actualizar innerHTML si el símbolo cambió
            if (currentSymbol !== symbol) {
                cell.dataset.symbol = symbol || '';
                if (symbol === null || symbol === undefined) {
                    cell.innerHTML = `<span class="symbol"></span>`;
                } else if (symbol === '7') {
                    cell.innerHTML = `<span class="symbol symbol-seven">7</span>`;
                } else {
                    cell.innerHTML = `<span class="symbol">${symbol}</span>`;
                }
            }
        }
    }

    function getCellElement(r, c) {
        // Usar caché si está disponible
        if (elements.cellCache[r] && elements.cellCache[r][c]) {
            return elements.cellCache[r][c];
        }
        // Fallback a querySelector
        return elements.gameBoard.querySelector(`[data-row="${r}"][data-col="${c}"]`);
    }
    
    // Actualizar múltiples cells de forma eficiente
    function updateCells(cells) {
        for (const {r, c} of cells) {
            updateCell(r, c);
        }
    }
    
    // Actualizar todo el tablero (solo contenido, no recrear elementos)
    function refreshBoard() {
        // Limpiar selección usando el estado en lugar de querySelectorAll
        if (state.selectedCell) {
            const { row, col } = state.selectedCell;
            const cell = getCellElement(row, col);
            if (cell) cell.classList.remove('selected');
        }
        state.selectedCell = null;
        
        for (let r = 0; r < CONFIG.ROWS; r++) {
            for (let c = 0; c < CONFIG.COLS; c++) {
                updateCell(r, c);
            }
        }
    }

    // ==========================================
    // MATCH-3 LOGIC CON CUBOS 2x2 Y PROPAGACION
    // ==========================================
    
    // Detects if there is un 2x2 cube of matching symbols que incluya la celda (row, col)
    // Returns the 4 positions if match, or empty array
    function checkSquareMatchAt(row, col) {
        const symbol = state.board[row][col];
        if (!symbol) return [];
        
        // Check the 4 possible positions de cubo where the cell can participate:
        // 1. (row, col) is corner top-left
        // 2. (row, col) is corner top-right
        // 3. (row, col) is corner bottom-left
        // 4. (row, col) is corner bottom-right
        
        const squares = [
            // Cube where (row, col) is corner top-left
            [{r: row, c: col}, {r: row, c: col + 1}, {r: row + 1, c: col}, {r: row + 1, c: col + 1}],
            // Cube where (row, col) is corner top-right
            [{r: row, c: col - 1}, {r: row, c: col}, {r: row + 1, c: col - 1}, {r: row + 1, c: col}],
            // Cube where (row, col) is corner bottom-left
            [{r: row - 1, c: col}, {r: row - 1, c: col + 1}, {r: row, c: col}, {r: row, c: col + 1}],
            // Cube where (row, col) is corner bottom-right
            [{r: row - 1, c: col - 1}, {r: row - 1, c: col}, {r: row, c: col - 1}, {r: row, c: col}]
        ];
        
        for (const square of squares) {
            // Verify all positions are within the board
            const allValid = square.every(pos => 
                pos.r >= 0 && pos.r < CONFIG.ROWS && 
                pos.c >= 0 && pos.c < CONFIG.COLS
            );
            
            if (!allValid) continue;
            
            // Verify no cell is frozen
            const anyFrozen = square.some(pos => 
                state.frozenBoard[pos.r] && state.frozenBoard[pos.r][pos.c]
            );
            
            if (anyFrozen) continue;
            
            // Verify all cells have the same symbol
            const allMatch = square.every(pos => state.board[pos.r][pos.c] === symbol);
            
            if (allMatch) {
                return square;
            }
        }
        
        return [];
    }
    
    // Expands a match recursively looking for adjacent matching symbols
    // Only considers adjacency in 4 faces (up, down, left, right)
    // Does NOT consider vertices/diagonals
    function expandMatchRecursively(initialMatches, symbol) {
        const seen = new Set();
        const result = [];
        const queue = [...initialMatches];
        
        // Directions: up, down, left, right (NO diagonals)
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        // Add initial matches to seen set
        for (const m of initialMatches) {
            const key = `${m.r},${m.c}`;
            if (!seen.has(key)) {
                seen.add(key);
                result.push(m);
            }
        }
        
        // BFS to find all cells connected with the same symbol
        while (queue.length > 0) {
            const current = queue.shift();
            
            for (const [dr, dc] of directions) {
                const nr = current.r + dr;
                const nc = current.c + dc;
                const key = `${nr},${nc}`;
                
                // Check bounds
                if (nr < 0 || nr >= CONFIG.ROWS || nc < 0 || nc >= CONFIG.COLS) continue;
                
                // Check if already processed
                if (seen.has(key)) continue;
                
                // Check if frozen
                if (state.frozenBoard[nr] && state.frozenBoard[nr][nc]) continue;
                
                // Check if has the same symbol
                if (state.board[nr][nc] === symbol) {
                    seen.add(key);
                    const newPos = {r: nr, c: nc};
                    result.push(newPos);
                    queue.push(newPos);
                }
            }
        }
        
        return result;
    }
    
    // Detects linear matches (horizontal/vertical) of 3+ in a cell
    function checkLinearMatchAt(row, col) {
        const symbol = state.board[row][col];
        if (!symbol) return [];
        
        let matches = [];
        
        // Check horizontal
        let horizontal = [{r: row, c: col}];
        
        // Left
        for (let c = col - 1; c >= 0; c--) {
            const cellSym = state.board[row][c];
            // Do not count frozen cells
            if (state.frozenBoard[row] && state.frozenBoard[row][c]) break;
            if (cellSym === symbol) {
                horizontal.unshift({r: row, c});
            } else {
                break;
            }
        }
        // Right
        for (let c = col + 1; c < CONFIG.COLS; c++) {
            const cellSym = state.board[row][c];
            // Do not count frozen cells
            if (state.frozenBoard[row] && state.frozenBoard[row][c]) break;
            if (cellSym === symbol) {
                horizontal.push({r: row, c});
            } else {
                break;
            }
        }
        
        // Check vertical
        let vertical = [{r: row, c: col}];
        
        // Up
        for (let r = row - 1; r >= 0; r--) {
            const cellSym = state.board[r][col];
            // Do not count frozen cells
            if (state.frozenBoard[r] && state.frozenBoard[r][col]) break;
            if (cellSym === symbol) {
                vertical.unshift({r, c: col});
            } else {
                break;
            }
        }
        // Down
        for (let r = row + 1; r < CONFIG.ROWS; r++) {
            const cellSym = state.board[r][col];
            // Do not count frozen cells
            if (state.frozenBoard[r] && state.frozenBoard[r][col]) break;
            if (cellSym === symbol) {
                vertical.push({r, c: col});
            } else {
                break;
            }
        }
        
        if (horizontal.length >= CONFIG.MIN_MATCH) {
            matches = matches.concat(horizontal);
        }
        if (vertical.length >= CONFIG.MIN_MATCH) {
            matches = matches.concat(vertical);
        }
        
        // Remove duplicates
        const unique = [];
        const seen = new Set();
        for (const m of matches) {
            const key = `${m.r},${m.c}`;
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(m);
            }
        }
        
        return unique;
    }
    
    // Main detection function of match in a cell
    // Detects linear matches Y cubos 2x2, then applies recursive propagation
    function checkMatchAt(row, col) {
        const symbol = state.board[row][col];
        if (!symbol) return [];
        
        // Do not process frozen cells
        if (state.frozenBoard[row] && state.frozenBoard[row][col]) return [];
        
        let matches = [];
        
        // 1. Detect linear matches (3+ in line)
        const linearMatches = checkLinearMatchAt(row, col);
        
        // 2. Detect 2x2 cube matches
        const squareMatches = checkSquareMatchAt(row, col);
        
        // Combine both match types
        const seen = new Set();
        
        for (const m of linearMatches) {
            const key = `${m.r},${m.c}`;
            if (!seen.has(key)) {
                seen.add(key);
                matches.push(m);
            }
        }
        
        for (const m of squareMatches) {
            const key = `${m.r},${m.c}`;
            if (!seen.has(key)) {
                seen.add(key);
                matches.push(m);
            }
        }
        
        // 3. If there are matches, apply recursive propagation
        if (matches.length > 0) {
            matches = expandMatchRecursively(matches, symbol);
        }
        
        return matches;
    }

    function findAllMatches() {
        const allMatches = [];
        const seen = new Set();
        
        for (let r = 0; r < CONFIG.ROWS; r++) {
            for (let c = 0; c < CONFIG.COLS; c++) {
                const matches = checkMatchAt(r, c);
                for (const m of matches) {
                    const key = `${m.r},${m.c}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        allMatches.push(m);
                    }
                }
            }
        }
        
        return allMatches;
    }

    function wouldCreateMatch(r1, c1, r2, c2) {
        // Simulate the swap
        const temp = state.board[r1][c1];
        state.board[r1][c1] = state.board[r2][c2];
        state.board[r2][c2] = temp;
        
        // checkMatchAt now only returns valid matches (linear 3+ or 2x2 cube)
        // with recursive propagation applied
        const matches1 = checkMatchAt(r1, c1);
        const matches2 = checkMatchAt(r2, c2);
        
        // Revert
        state.board[r2][c2] = state.board[r1][c1];
        state.board[r1][c1] = temp;
        
        // If there is any match, the move is valid
        return matches1.length > 0 || matches2.length > 0;
    }

    function hasValidMoves() {
        for (let r = 0; r < CONFIG.ROWS; r++) {
            for (let c = 0; c < CONFIG.COLS; c++) {
                // Skip frozen cells
                if (state.frozenBoard[r] && state.frozenBoard[r][c]) continue;
                
                // Check swap right
                if (c < CONFIG.COLS - 1) {
                    // Skip if target is frozen
                    if (!(state.frozenBoard[r] && state.frozenBoard[r][c + 1])) {
                        if (wouldCreateMatch(r, c, r, c + 1)) {
                            return true;
                        }
                    }
                }
                // Check swap down
                if (r < CONFIG.ROWS - 1) {
                    // Skip if target is frozen
                    if (!(state.frozenBoard[r + 1] && state.frozenBoard[r + 1][c])) {
                        if (wouldCreateMatch(r, c, r + 1, c)) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }
    
    // Contar jugadas válidas disponibles en el tablero
    function countValidMoves() {
        let count = 0;
        for (let r = 0; r < CONFIG.ROWS; r++) {
            for (let c = 0; c < CONFIG.COLS; c++) {
                // Skip frozen cells
                if (state.frozenBoard[r] && state.frozenBoard[r][c]) continue;
                
                // Check swap right
                if (c < CONFIG.COLS - 1) {
                    // Skip if target is frozen
                    if (!(state.frozenBoard[r] && state.frozenBoard[r][c + 1])) {
                        if (wouldCreateMatch(r, c, r, c + 1)) {
                            count++;
                        }
                    }
                }
                // Check swap down
                if (r < CONFIG.ROWS - 1) {
                    // Skip if target is frozen
                    if (!(state.frozenBoard[r + 1] && state.frozenBoard[r + 1][c])) {
                        if (wouldCreateMatch(r, c, r + 1, c)) {
                            count++;
                        }
                    }
                }
            }
        }
        return count;
    }
    
    // Mostrar advertencia de pocas jugadas válidas en el tablero
    function showLowMovesWarning(validMoves) {
        // Si ya hay una advertencia visible, no mostrar otra
        if (document.querySelector('.low-moves-warning')) return;
        
        const warning = document.createElement('div');
        warning.className = 'low-moves-warning';
        const plural = validMoves === 1 ? 'jugada disponible' : 'jugadas disponibles';
        warning.innerHTML = `
            <span class="warning-icon">⚠️</span>
            <span class="warning-text">Solo ${validMoves} ${plural}</span>
        `;
        document.body.appendChild(warning);
        
        // Mostrar y ocultar suavemente
        setTimeout(() => warning.classList.add('visible'), 50);
        setTimeout(() => {
            warning.classList.remove('visible');
            setTimeout(() => warning.remove(), 300);
        }, 2500);
    }
    
    // Verificar si mostrar advertencia (llamar después de cada jugada)
    function checkLowMovesWarning() {
        // Contar jugadas válidas en el tablero
        const validMoves = countValidMoves();
        
        // Si hay 2 o menos jugadas válidas, mostrar advertencia
        if (validMoves <= 2 && validMoves > 0) {
            showLowMovesWarning(validMoves);
        }
        
        // Verificar movimientos del banco (solo en modos con límite)
        if (state.mode === 'moves' || state.mode === 'adventure') {
            if (state.moves === 3) {
                showLowBankMovesWarning();
            }
        }
    }
    
    // Advertencia de pocos movimientos en el banco
    function showLowBankMovesWarning() {
        // Si ya hay una advertencia visible, no mostrar otra
        if (document.querySelector('.low-bank-warning')) return;
        
        const warning = document.createElement('div');
        warning.className = 'low-bank-warning';
        warning.innerHTML = `
            <span class="warning-icon">🎯</span>
            <span class="warning-text">¡Solo 3 movimientos restantes!</span>
        `;
        document.body.appendChild(warning);
        
        // Mostrar y ocultar suavemente
        setTimeout(() => warning.classList.add('visible'), 50);
        setTimeout(() => {
            warning.classList.remove('visible');
            setTimeout(() => warning.remove(), 300);
        }, 2500);
    }

    // ==========================================
    // INTERACCION
    // ==========================================
    let touchStartPos = null;
    let touchStartCell = null;

    async function handleCellClick(r, c) {
        if (state.isAnimating || state.gameOver || state.paused) return;
        
        // No permitir interactuar con cells congeladas
        if (state.frozenBoard[r] && state.frozenBoard[r][c]) {
            vibrate([30, 30, 30]);
            playSound('invalid');
            return;
        }
        
        // Manejar bomba activa
        if (state.activePowerup === 'bomb') {
            await executeBomb(r, c);
            return;
        }
        
        if (state.selectedCell) {
            const { row, col } = state.selectedCell;
            
            // Check if adjacent
            const isAdjacent = (Math.abs(row - r) === 1 && col === c) || 
                              (Math.abs(col - c) === 1 && row === r);
            
            if (isAdjacent) {
                // No permitir swap si la celda destino está congelada
                if (state.frozenBoard[r] && state.frozenBoard[r][c]) {
                    vibrate([30, 30, 30]);
                    playSound('invalid');
                    clearSelection();
                    return;
                }
                trySwap(row, col, r, c);
            } else {
                // Select new cell
                clearSelection();
                selectCell(r, c);
            }
        } else {
            selectCell(r, c);
        }
    }

    function handleTouchStart(e, r, c) {
        if (state.isAnimating || state.gameOver || state.paused) return;
        
        // No permitir touch en cells congeladas
        if (state.frozenBoard[r] && state.frozenBoard[r][c]) {
            e.preventDefault();
            vibrate([30, 30, 30]);
            return;
        }
        
        // Si hay comodin activo, manejar con click
        if (state.activePowerup) {
            e.preventDefault();
            handleCellClick(r, c);
            return;
        }
        
        e.preventDefault();
        
        touchStartPos = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
        touchStartCell = { r, c };
        selectCell(r, c);
    }

    function handleTouchMove(e) {
        if (!touchStartPos || !touchStartCell || state.isAnimating) return;
        e.preventDefault();
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStartPos.x;
        const deltaY = touch.clientY - touchStartPos.y;
        const threshold = 30;
        
        if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
            let targetR = touchStartCell.r;
            let targetC = touchStartCell.c;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                targetC += deltaX > 0 ? 1 : -1;
            } else {
                targetR += deltaY > 0 ? 1 : -1;
            }
            
            if (targetR >= 0 && targetR < CONFIG.ROWS && 
                targetC >= 0 && targetC < CONFIG.COLS) {
                trySwap(touchStartCell.r, touchStartCell.c, targetR, targetC);
            }
            
            touchStartPos = null;
            touchStartCell = null;
        }
    }

    function handleTouchEnd(e) {
        e.preventDefault();
        touchStartPos = null;
    }

    function selectCell(r, c) {
        // No seleccionar cells congeladas
        if (state.frozenBoard[r] && state.frozenBoard[r][c]) {
            return;
        }
        
        clearSelection();
        state.selectedCell = { row: r, col: c };
        const cell = getCellElement(r, c);
        if (cell) {
            cell.classList.add('selected');
            vibrate(20);
            playSound('select');
        }
    }

    function clearSelection() {
        // Limpiar usando el estado guardado (más eficiente que querySelectorAll)
        if (state.selectedCell) {
            const { row, col } = state.selectedCell;
            const cell = getCellElement(row, col);
            if (cell) cell.classList.remove('selected');
        }
        state.selectedCell = null;
    }

    async function trySwap(r1, c1, r2, c2) {
        clearSelection();
        
        // No permitir swap si alguna celda está congelada
        if ((state.frozenBoard[r1] && state.frozenBoard[r1][c1]) ||
            (state.frozenBoard[r2] && state.frozenBoard[r2][c2])) {
            vibrate([30, 30, 30]);
            playSound('invalid');
            return;
        }
        
        if (!wouldCreateMatch(r1, c1, r2, c2)) {
            // Invalid swap - animate shake
            const cell1 = getCellElement(r1, c1);
            const cell2 = getCellElement(r2, c2);
            cell1?.classList.add('invalid-swap');
            cell2?.classList.add('invalid-swap');
            vibrate([50, 50, 50]);
            playSound('invalid');
            
            setTimeout(() => {
                cell1?.classList.remove('invalid-swap');
                cell2?.classList.remove('invalid-swap');
            }, 300);
            return;
        }
        
        state.isAnimating = true;
        playSound('swap');
        
        // Perform swap de símbolos
        const temp = state.board[r1][c1];
        state.board[r1][c1] = state.board[r2][c2];
        state.board[r2][c2] = temp;
        
        // Perform swap de monedas (se mueven con el símbolo)
        const tempCoin = state.coinBoard[r1][c1];
        state.coinBoard[r1][c1] = state.coinBoard[r2][c2];
        state.coinBoard[r2][c2] = tempCoin;
        
        updateCell(r1, c1);
        updateCell(r2, c2);
        vibrate(30);
        
        // Use a move (for modes that track moves)
        if (state.mode === 'moves' || state.mode === 'adventure') {
            state.moves--;
            updateModeInfo();
        }
        
        // Process matches
        await processMatches();
        
        state.isAnimating = false;
        
        // Verificar si mostrar advertencia de pocas jugadas
        checkLowMovesWarning();
        
        // Check game over conditions
        checkGameOver();
    }

    async function processMatches() {
        let combo = 0;
        let coinsChanged = false; // Flag para guardar coins solo una vez al final
        
        while (true) {
            const matches = findAllMatches();
            if (matches.length === 0) break;
            
            combo++;
            state.combo = combo;
            if (combo > state.maxCombo) state.maxCombo = combo;
            
            // Calculate score
            let matchScore = 0;
            const symbols = {};
            let coinsCollected = 0;
            
            for (const m of matches) {
                const symbol = state.board[m.r][m.c];
                matchScore += CONFIG.SYMBOL_POINTS[symbol] || 10;
                symbols[symbol] = (symbols[symbol] || 0) + 1;
                
                // Recolectar monedas
                if (state.coinBoard[m.r] && state.coinBoard[m.r][m.c]) {
                    coinsCollected++;
                    state.coinBoard[m.r][m.c] = false;
                }
            }
            
            // Dañar cells congeladas adyacentes a matches
            await damageAdjacentFrozenCells(matches);
            
            // Sonido y bonus según cantidad de matches
            if (matches.length >= 5) {
                // Match de 5 o más: sonido especial + 5 monedas bonus
                playSound('match5');
                const bonusCoins = 5;
                state.coins += bonusCoins;
                state.coinsEarnedThisGame += bonusCoins;
                coinsChanged = true;
                updateCoinsDisplay();
                showMatch5Bonus(bonusCoins);
            } else if (matches.length >= 4) {
                playSound('match4');
            } else {
                playSound('match');
            }
            
            // Agregar monedas recolectadas (van directo al saldo, puede ser negativo)
            if (coinsCollected > 0) {
                state.coins += coinsCollected;
                state.coinsEarnedThisGame += coinsCollected;
                coinsChanged = true;
                updateCoinsDisplay();
                showCoinCollected(coinsCollected);
                playSound('coin');
            }
            
            // Apply combo multiplier AND jackpot multiplier
            matchScore = Math.floor(matchScore * Math.pow(CONFIG.COMBO_MULTIPLIER, combo - 1) * state.multiplier);
            state.score += matchScore;
            state.totalMatches++;
            
            // Track collected symbols
            for (const [symbol, count] of Object.entries(symbols)) {
                state.collected[symbol] = (state.collected[symbol] || 0) + count;
            }
            
            // Show combo if > 1
            if (combo > 1) {
                showCombo(combo);
                playSound('combo');
                // Incrementar contador de combos para objetivos
                state.combosThisGame++;
            }
            
            // JACKPOT SYSTEM - Efectos especiales para los 7
            if (symbols['7'] && symbols['7'] >= 3) {
                const sevenCount = symbols['7'];
                await triggerJackpot(sevenCount);
            }
            
            // Decrementar movimientos del multiplicador
            if (state.multiplierMoves > 0) {
                state.multiplierMoves--;
                if (state.multiplierMoves === 0) {
                    state.multiplier = 1;
                    hideMultiplierDisplay();
                }
                updateMultiplierDisplay();
            }
            
            // Animate matches
            await animateMatches(matches);
            
            // Remove matched cells
            for (const m of matches) {
                state.board[m.r][m.c] = null;
            }
            
            // Drop cells
            await dropCells();
            
            // Fill empty cells
            await fillEmptyCells();
            
            updateScore();
            updateObjective();
        }
        
        // Guardar monedas una sola vez al final de todos los combos
        if (coinsChanged) {
            saveCoins();
        }
        
        state.combo = 0;
        
        // Check if no valid moves - show modal instead of auto-shuffle
        if (!hasValidMoves()) {
            showNoMovesModal();
        }
    }
    
    // Dañar cells congeladas adyacentes a los matches
    async function damageAdjacentFrozenCells(matches) {
        // Obtener todas las posiciones únicas de matches
        const matchPositions = new Set();
        for (const m of matches) {
            matchPositions.add(`${m.r},${m.c}`);
        }
        
        // Encontrar cells congeladas adyacentes
        const frozenToDamage = new Set();
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // arriba, abajo, izq, der
        
        for (const m of matches) {
            for (const [dr, dc] of directions) {
                const nr = m.r + dr;
                const nc = m.c + dc;
                
                // Verificar límites
                if (nr < 0 || nr >= CONFIG.ROWS || nc < 0 || nc >= CONFIG.COLS) continue;
                
                // Verificar si está congelada
                if (state.frozenBoard[nr] && state.frozenBoard[nr][nc]) {
                    frozenToDamage.add(`${nr},${nc}`);
                }
            }
        }
        
        // Aplicar daño a cada celda congelada encontrada
        for (const posKey of frozenToDamage) {
            const [r, c] = posKey.split(',').map(Number);
            const frozen = state.frozenBoard[r][c];
            
            if (frozen) {
                frozen.resistance--;
                
                // Sonido de hielo agrietándose
                playSound('icecrack');
                
                // Efecto visual de daño
                const cell = getCellElement(r, c);
                if (cell) {
                    cell.classList.add('ice-crack');
                    setTimeout(() => cell.classList.remove('ice-crack'), 300);
                }
                
                // Verificar si se liberó
                if (frozen.resistance <= 0) {
                    await freeFrozenAnimal(r, c, frozen.type);
                } else {
                    // Actualizar visual del hielo (cambiar clase ice-N)
                    updateCell(r, c);
                }
            }
        }
    }
    
    // Liberar animal congelado y dar recompensa
    async function freeFrozenAnimal(r, c, type) {
        const config = type === 'penguin' ? FROZEN_CONFIG.penguin : FROZEN_CONFIG.chick;
        
        // Remover de frozenBoard
        state.frozenBoard[r][c] = null;
        
        // Asignar nuevo símbolo aleatorio a la celda liberada
        state.board[r][c] = getRandomSymbol();
        
        // Incrementar contador
        if (type === 'penguin') {
            state.penguinsFreed++;
        } else {
            state.chicksFreed++;
        }
        
        // Dar monedas de recompensa
        const coinReward = config.coinReward;
        state.coins += coinReward;
        state.coinsEarnedThisGame += coinReward;
        saveCoins();
        updateCoinsDisplay();
        
        // Efectos
        const cell = getCellElement(r, c);
        if (cell) {
            cell.classList.add('animal-freed');
            
            // Mostrar notificación
            showAnimalFreed(config.symbol, coinReward);
            
            // Sonido de hielo rompiéndose completamente
            playSound('icebreak');
            
            // Sonido de pio pio del animal liberado
            playSound('chirp');
            
            // Sonido especial de monedas
            playSound('coin');
            vibrate([50, 30, 50]);
        }
        
        // Actualizar celda (ahora muestra el nuevo símbolo)
        updateCell(r, c);
        
        // Actualizar objetivo
        updateObjective();
        
        await sleep(200);
    }
    
    // Mostrar notificación de animal liberado
    function showAnimalFreed(symbol, coins) {
        const notification = document.createElement('div');
        notification.className = 'animal-freed-notification';
        notification.innerHTML = `
            <span class="freed-animal">${symbol}</span>
            <span class="freed-text">¡Liberado!</span>
            <span class="freed-coins">+${coins} 💰</span>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 1000);
    }

    async function animateMatches(matches) {
        for (const m of matches) {
            const cell = getCellElement(m.r, m.c);
            if (cell) {
                cell.classList.add('matching');
                createParticles(cell, state.board[m.r][m.c]);
            }
        }
        
        vibrate([30, 20, 30]);
        // Sonido ya se reproduce en processMatches (match o match4)
        
        await sleep(CONFIG.ANIMATION_SPEED);
    }

    async function dropCells() {
        const drops = [];
        
        for (let c = 0; c < CONFIG.COLS; c++) {
            // Find the lowest empty non-frozen row
            let emptyRow = CONFIG.ROWS - 1;
            
            // Skip frozen cells at the bottom
            while (emptyRow >= 0 && state.frozenBoard[emptyRow] && state.frozenBoard[emptyRow][c]) {
                emptyRow--;
            }
            
            for (let r = emptyRow; r >= 0; r--) {
                // Skip frozen cells
                if (state.frozenBoard[r] && state.frozenBoard[r][c]) {
                    // Reset emptyRow to above the frozen cell
                    emptyRow = r - 1;
                    continue;
                }
                
                if (state.board[r][c] !== null) {
                    if (r !== emptyRow && emptyRow >= 0) {
                        // Make sure target is not frozen
                        if (!(state.frozenBoard[emptyRow] && state.frozenBoard[emptyRow][c])) {
                            // Mover símbolo
                            state.board[emptyRow][c] = state.board[r][c];
                            state.board[r][c] = null;
                            // Mover moneda junto con el símbolo
                            state.coinBoard[emptyRow][c] = state.coinBoard[r][c];
                            state.coinBoard[r][c] = false;
                            drops.push({ from: r, to: emptyRow, col: c });
                        }
                    }
                    // Move emptyRow up, skipping frozen cells
                    emptyRow--;
                    while (emptyRow >= 0 && state.frozenBoard[emptyRow] && state.frozenBoard[emptyRow][c]) {
                        emptyRow--;
                    }
                }
            }
        }
        
        refreshBoard();
        
        // Reproducir sonido de caída si hay fichas cayendo
        if (drops.length > 0) {
            playSound('drop');
        }
        
        for (const drop of drops) {
            const cell = getCellElement(drop.to, drop.col);
            if (cell) {
                cell.classList.add('falling');
            }
        }
        
        await sleep(CONFIG.ANIMATION_SPEED);
    }

    async function fillEmptyCells() {
        const newCells = [];
        
        // Usar coin probabilitys del nivel
        const coinChance = state.levelCoinChance || CONFIG.COIN_CHANCE;
        
        for (let c = 0; c < CONFIG.COLS; c++) {
            for (let r = 0; r < CONFIG.ROWS; r++) {
                // Skip frozen cells - they have their own content
                if (state.frozenBoard[r] && state.frozenBoard[r][c]) continue;
                
                if (state.board[r][c] === null) {
                    state.board[r][c] = getRandomSymbol();
                    // Agregar moneda aleatoria a nuevas cells
                    state.coinBoard[r][c] = Math.random() < coinChance;
                    newCells.push({ r, c });
                }
            }
        }
        
        refreshBoard();
        
        for (const cell of newCells) {
            const el = getCellElement(cell.r, cell.c);
            if (el) {
                el.classList.add('falling');
            }
        }
        
        await sleep(CONFIG.ANIMATION_SPEED);
    }

    function shuffleBoard(attempts = 0) {
        const MAX_SHUFFLE_ATTEMPTS = 50;
        
        // Guard against infinite recursion
        if (attempts >= MAX_SHUFFLE_ATTEMPTS) {
            console.warn('shuffleBoard: max attempts reached, forcing new board');
            // Force generate a completely new board (excluding frozen cells)
            for (let r = 0; r < CONFIG.ROWS; r++) {
                for (let c = 0; c < CONFIG.COLS; c++) {
                    // Skip frozen cells
                    if (state.frozenBoard[r] && state.frozenBoard[r][c]) continue;
                    state.board[r][c] = getRandomSymbol();
                }
            }
            refreshBoard();
            return;
        }
        
        // Collect non-frozen symbols to shuffle
        const symbols = [];
        const positions = [];
        
        for (let r = 0; r < CONFIG.ROWS; r++) {
            for (let c = 0; c < CONFIG.COLS; c++) {
                // Skip frozen cells - don't shuffle them
                if (state.frozenBoard[r] && state.frozenBoard[r][c]) continue;
                
                if (state.board[r][c] !== null) {
                    symbols.push(state.board[r][c]);
                    positions.push({ r, c });
                }
            }
        }
        
        // Fisher-Yates shuffle
        for (let i = symbols.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [symbols[i], symbols[j]] = [symbols[j], symbols[i]];
        }
        
        // Put back only to non-frozen positions
        for (let i = 0; i < positions.length; i++) {
            const pos = positions[i];
            state.board[pos.r][pos.c] = symbols[i];
        }
        
        refreshBoard();
        
        // Check for matches and remove them - reshuffle if found
        if (findAllMatches().length > 0) {
            shuffleBoard(attempts + 1);
            return;
        }
        
        // If still no valid moves, reshuffle
        if (!hasValidMoves()) {
            shuffleBoard(attempts + 1);
            return;
        }
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ==========================================
    // VISUAL EFFECTS
    // ==========================================
    function showCombo(count) {
        const display = elements.comboDisplay;
        display.querySelector('.combo-count').textContent = `x${count}`;
        display.classList.remove('hidden');
        display.classList.add('active');
        
        setTimeout(() => {
            display.classList.remove('active');
            display.classList.add('hidden');
        }, 600);
    }

    // Sistema de Jackpot mejorado para los 7
    async function triggerJackpot(sevenCount) {
        state.jackpotCount++;
        state.jackpotsThisGame++;
        
        // Bonus de puntos según cantidad de 7s
        let bonusPoints = 0;
        let multiplierBonus = 0;
        let multiplierDuration = 0;
        let jackpotType = '';
        
        if (sevenCount === 3) {
            // JACKPOT SIMPLE - 3 sietes
            bonusPoints = 777;
            multiplierBonus = 2;
            multiplierDuration = 3;
            jackpotType = 'jackpot-mini';
            // Sonido: pin pin pin pin (4 veces, 150ms)
            for (let i = 0; i < 4; i++) {
                setTimeout(() => playSound('jackpot'), i * 150);
            }
        } else if (sevenCount === 4) {
            // SUPER JACKPOT - 4 sietes
            bonusPoints = 1777;
            multiplierBonus = 3;
            multiplierDuration = 5;
            jackpotType = 'jackpot-super';
            // Sonido: priiiii (8 veces, 100ms)
            for (let i = 0; i < 8; i++) {
                setTimeout(() => playSound('jackpot'), i * 100);
            }
        } else if (sevenCount >= 5) {
            // MEGA JACKPOT - 5+ sietes
            bonusPoints = 7777;
            multiplierBonus = 5;
            multiplierDuration = 7;
            jackpotType = 'jackpot-mega';
            // Sonido: priiiiiiiii (12 veces, 50ms)
            for (let i = 0; i < 12; i++) {
                setTimeout(() => playSound('jackpot'), i * 50);
            }
        }
        
        // Aplicar bonus
        state.score += bonusPoints;
        
        // Activar o mejorar multiplicador
        if (multiplierBonus > state.multiplier) {
            state.multiplier = multiplierBonus;
            state.multiplierMoves = multiplierDuration;
        } else {
            // Si ya tenemos un multiplicador, extender duración
            state.multiplierMoves += multiplierDuration;
        }
        
        // Mostrar efecto visual
        await showJackpotEffect(jackpotType, bonusPoints, multiplierBonus, sevenCount);
        
        // Actualizar display del multiplicador
        showMultiplierDisplay();
        updateMultiplierDisplay();
    }
    
    async function showJackpotEffect(type, points, multiplier, sevenCount) {
        const overlay = elements.effectOverlay;
        
        // Limpiar clases anteriores
        overlay.classList.remove('jackpot-mini', 'jackpot-super', 'jackpot-mega');
        overlay.classList.add(type);
        
        // Crear elemento de notificación del jackpot
        const notification = document.createElement('div');
        notification.className = `jackpot-notification ${type}`;
        
        let title = '';
        if (type === 'jackpot-mini') title = '🎰 JACKPOT! 🎰';
        else if (type === 'jackpot-super') title = '⭐ SUPER JACKPOT! ⭐';
        else if (type === 'jackpot-mega') title = '🔥 MEGA JACKPOT! 🔥';
        
        notification.innerHTML = `
            <div class="jackpot-sevens">${'7'.repeat(sevenCount)}</div>
            <div class="jackpot-title">${title}</div>
            <div class="jackpot-points">+${points.toLocaleString()}</div>
            <div class="jackpot-multiplier">x${multiplier} por ${state.multiplierMoves} jugadas</div>
        `;
        
        document.body.appendChild(notification);
        
        // Vibración épica
        if (type === 'jackpot-mega') {
            vibrate([100, 50, 100, 50, 100, 50, 200]);
        } else if (type === 'jackpot-super') {
            vibrate([100, 50, 100, 50, 100]);
        } else {
            vibrate([100, 50, 100]);
        }
        
        // Crear partículas de 7s
        createSevenParticles(sevenCount * 3);
        
        // Esperar y remover
        await sleep(type === 'jackpot-mega' ? 2000 : type === 'jackpot-super' ? 1500 : 1000);
        
        notification.classList.add('fade-out');
        await sleep(300);
        notification.remove();
        
        overlay.classList.remove(type);
    }
    
    function createSevenParticles(count) {
        // Reducido: máximo 5 partículas en lugar de count
        const maxParticles = Math.min(count, 5);
        for (let i = 0; i < maxParticles; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'particle seven-particle';
                particle.textContent = '7';
                particle.style.left = `${Math.random() * window.innerWidth}px`;
                particle.style.top = `${Math.random() * window.innerHeight * 0.5}px`;
                particle.style.fontSize = `${20 + Math.random() * 30}px`;
                particle.style.setProperty('--dx', `${(Math.random() - 0.5) * 100}px`);
                particle.style.setProperty('--dy', `${50 + Math.random() * 100}px`);
                
                elements.particlesContainer.appendChild(particle);
                
                setTimeout(() => particle.remove(), 1000);
            }, i * 80);
        }
    }
    
    function showMultiplierDisplay() {
        let display = document.getElementById('multiplier-display');
        if (!display) {
            display = document.createElement('div');
            display.id = 'multiplier-display';
            display.className = 'multiplier-display';
            const gameHeader = document.querySelector('.game-header');
            if (gameHeader) {
                gameHeader.appendChild(display);
            }
        }
        display.classList.add('active');
    }
    
    function hideMultiplierDisplay() {
        const display = document.getElementById('multiplier-display');
        if (display) {
            display.classList.remove('active');
        }
    }
    
    function updateMultiplierDisplay() {
        const display = document.getElementById('multiplier-display');
        if (display && state.multiplier > 1) {
            display.innerHTML = `
                <span class="mult-icon">🔥</span>
                <span class="mult-value">x${state.multiplier}</span>
                <span class="mult-moves">(${state.multiplierMoves})</span>
            `;
        }
    }

    function showJackpot() {
        elements.effectOverlay.classList.add('jackpot');
        vibrate([100, 50, 100, 50, 100]);
        
        setTimeout(() => {
            elements.effectOverlay.classList.remove('jackpot');
        }, 500);
    }

    function createParticles(cell, symbol) {
        // Reducido: solo 2 partículas en lugar de 5
        const rect = cell.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        for (let i = 0; i < 2; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.textContent = symbol;
            particle.style.left = `${centerX}px`;
            particle.style.top = `${centerY}px`;
            particle.style.fontSize = '18px';
            
            const angle = (Math.PI * 2 * i) / 2;
            const distance = 25 + Math.random() * 15;
            particle.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
            particle.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
            
            elements.particlesContainer.appendChild(particle);
            
            setTimeout(() => particle.remove(), 600);
        }
    }

    // ==========================================
    // UI UPDATES
    // ==========================================
    function updateScore() {
        elements.score.textContent = state.score.toLocaleString();
    }

    function updateModeInfo() {
        let html = '';
        
        switch (state.mode) {
            case 'timed':
                const minutes = Math.floor(state.time / 60);
                const seconds = state.time % 60;
                const timeClass = state.time <= 10 ? 'danger' : '';
                html = `
                    <span class="info-icon-large">⏳</span>
                    <span class="info-value-large ${timeClass}">${minutes}:${seconds.toString().padStart(2, '0')}</span>
                `;
                break;
                
            case 'moves':
                const movesClass = state.moves <= 5 ? 'danger' : '';
                html = `
                    <span class="info-icon-large">🎯</span>
                    <span class="info-value-large ${movesClass}">${state.moves}</span>
                `;
                break;
                
            case 'adventure':
                const advMovesClass = state.moves <= 5 ? 'danger' : '';
                // Verificar si el level tiene límite de tiempo
                const level = state.adventureLevels[state.adventureLevel - 1];
                if (level && level.timeLimit && state.time > 0) {
                    const advMinutes = Math.floor(state.time / 60);
                    const advSeconds = state.time % 60;
                    const advTimeClass = state.time <= 15 ? 'danger' : '';
                    html = `
                        <span class="info-icon-large">⏳</span>
                        <span class="info-value-large ${advTimeClass}">${advMinutes}:${advSeconds.toString().padStart(2, '0')}</span>
                        <span class="info-sep">|</span>
                        <span class="info-icon-large">🎯</span>
                        <span class="info-value-large ${advMovesClass}">${state.moves}</span>
                    `;
                } else {
                    html = `
                        <span class="info-icon-large">🎯</span>
                        <span class="info-value-large ${advMovesClass}">${state.moves}</span>
                    `;
                }
                break;
                
            case 'free':
            default:
                html = `
                    <span class="info-label">Matches</span>
                    <span class="info-value">${state.totalMatches}</span>
                `;
        }
        
        elements.modeInfo.innerHTML = html;
    }

    function updateObjective() {
        if (state.mode !== 'adventure') {
            elements.objectiveBar.classList.add('hidden');
            return;
        }
        
        elements.objectiveBar.classList.remove('hidden');
        const level = state.adventureLevels[state.adventureLevel - 1];
        const obj = level.objective;
        
        elements.objectiveText.textContent = obj.desc;
        
        let progress = 0;
        let html = '';
        
        switch (obj.type) {
            case 'score':
                progress = Math.min(100, (state.score / obj.target) * 100);
                html = `<span>${state.score}/${obj.target}</span>`;
                break;
                
            case 'collect':
                const collected = state.collected[obj.symbol] || 0;
                progress = Math.min(100, (collected / obj.target) * 100);
                html = `<span class="objective-item ${collected >= obj.target ? 'completed' : ''}">${obj.symbol} ${collected}/${obj.target}</span>`;
                break;
                
            case 'jackpots':
                progress = Math.min(100, (state.jackpotsThisGame / obj.target) * 100);
                html = `<span class="objective-item ${state.jackpotsThisGame >= obj.target ? 'completed' : ''}">7️⃣ ${state.jackpotsThisGame}/${obj.target}</span>`;
                break;
                
            case 'coins':
                progress = Math.min(100, (state.coinsEarnedThisGame / obj.target) * 100);
                html = `<span class="objective-item ${state.coinsEarnedThisGame >= obj.target ? 'completed' : ''}">💰 ${state.coinsEarnedThisGame}/${obj.target}</span>`;
                break;
                
            case 'multiCollect':
                // Dos símbolos diferentes a recolectar
                const sym1 = obj.symbols[0];
                const sym2 = obj.symbols[1];
                const count1 = state.collected[sym1] || 0;
                const count2 = state.collected[sym2] || 0;
                const minProgress = Math.min(count1, count2);
                progress = Math.min(100, (minProgress / obj.target) * 100);
                html = `
                    <span class="objective-item ${count1 >= obj.target ? 'completed' : ''}">${sym1} ${count1}/${obj.target}</span>
                    <span class="objective-item ${count2 >= obj.target ? 'completed' : ''}">${sym2} ${count2}/${obj.target}</span>
                `;
                break;
                
            case 'frozen':
                // Liberar pingüinos y/o pollitos
                const penguinTarget = obj.penguins || 0;
                const chickTarget = obj.chicks || 0;
                const penguinsDone = state.penguinsFreed >= penguinTarget;
                const chicksDone = state.chicksFreed >= chickTarget;
                
                let frozenParts = [];
                if (penguinTarget > 0) {
                    frozenParts.push(`<span class="objective-item ${penguinsDone ? 'completed' : ''}">🐧 ${state.penguinsFreed}/${penguinTarget}</span>`);
                }
                if (chickTarget > 0) {
                    frozenParts.push(`<span class="objective-item ${chicksDone ? 'completed' : ''}">🐤 ${state.chicksFreed}/${chickTarget}</span>`);
                }
                html = frozenParts.join(' ');
                
                // Progreso combinado
                const totalTarget = penguinTarget + chickTarget;
                const totalFreed = Math.min(state.penguinsFreed, penguinTarget) + Math.min(state.chicksFreed, chickTarget);
                progress = totalTarget > 0 ? Math.min(100, (totalFreed / totalTarget) * 100) : 100;
                break;
                
            case 'combined':
                // Múltiples objetivos
                html = buildCombinedObjectiveHTML(obj.objectives);
                progress = calculateCombinedProgress(obj.objectives);
                break;
        }
        
        elements.objectiveProgress.innerHTML = html;
    }
    
    // Construir HTML para objetivo combinado
    function buildCombinedObjectiveHTML(objectives) {
        let parts = [];
        
        for (const sub of objectives) {
            switch (sub.type) {
                case 'score':
                    const scoreDone = state.score >= sub.target;
                    parts.push(`<span class="objective-item ${scoreDone ? 'completed' : ''}">${state.score}/${sub.target} pts</span>`);
                    break;
                case 'collect':
                    const colCount = state.collected[sub.symbol] || 0;
                    parts.push(`<span class="objective-item ${colCount >= sub.target ? 'completed' : ''}">${sub.symbol} ${colCount}/${sub.target}</span>`);
                    break;
                case 'multiCollect':
                    const mc1 = state.collected[sub.symbols[0]] || 0;
                    const mc2 = state.collected[sub.symbols[1]] || 0;
                    parts.push(`<span class="objective-item ${mc1 >= sub.target ? 'completed' : ''}">${sub.symbols[0]} ${mc1}/${sub.target}</span>`);
                    parts.push(`<span class="objective-item ${mc2 >= sub.target ? 'completed' : ''}">${sub.symbols[1]} ${mc2}/${sub.target}</span>`);
                    break;
                case 'coins':
                    const coinsDone = state.coinsEarnedThisGame >= sub.target;
                    parts.push(`<span class="objective-item ${coinsDone ? 'completed' : ''}">💰 ${state.coinsEarnedThisGame}/${sub.target}</span>`);
                    break;
                case 'jackpots':
                    const jpDone = state.jackpotsThisGame >= sub.target;
                    parts.push(`<span class="objective-item ${jpDone ? 'completed' : ''}">7️⃣ ${state.jackpotsThisGame}/${sub.target}</span>`);
                    break;
                case 'frozen':
                    if (sub.penguins > 0) {
                        const pDone = state.penguinsFreed >= sub.penguins;
                        parts.push(`<span class="objective-item ${pDone ? 'completed' : ''}">🐧 ${state.penguinsFreed}/${sub.penguins}</span>`);
                    }
                    if (sub.chicks > 0) {
                        const cDone = state.chicksFreed >= sub.chicks;
                        parts.push(`<span class="objective-item ${cDone ? 'completed' : ''}">🐤 ${state.chicksFreed}/${sub.chicks}</span>`);
                    }
                    break;
            }
        }
        
        return parts.join(' ');
    }
    
    // Calcular progreso combinado
    function calculateCombinedProgress(objectives) {
        let totalProgress = 0;
        let count = 0;
        
        for (const sub of objectives) {
            let subProgress = 0;
            switch (sub.type) {
                case 'score':
                    subProgress = Math.min(100, (state.score / sub.target) * 100);
                    break;
                case 'collect':
                    subProgress = Math.min(100, ((state.collected[sub.symbol] || 0) / sub.target) * 100);
                    break;
                case 'multiCollect':
                    const m1 = Math.min(100, ((state.collected[sub.symbols[0]] || 0) / sub.target) * 100);
                    const m2 = Math.min(100, ((state.collected[sub.symbols[1]] || 0) / sub.target) * 100);
                    subProgress = (m1 + m2) / 2;
                    break;
                case 'coins':
                    subProgress = Math.min(100, (state.coinsEarnedThisGame / sub.target) * 100);
                    break;
                case 'jackpots':
                    subProgress = Math.min(100, (state.jackpotsThisGame / sub.target) * 100);
                    break;
                case 'frozen':
                    const pProg = sub.penguins > 0 ? Math.min(100, (state.penguinsFreed / sub.penguins) * 100) : 100;
                    const cProg = sub.chicks > 0 ? Math.min(100, (state.chicksFreed / sub.chicks) * 100) : 100;
                    subProgress = (pProg + cProg) / 2;
                    break;
            }
            totalProgress += subProgress;
            count++;
        }
        
        return count > 0 ? totalProgress / count : 0;
    }

    // ==========================================
    // GAME FLOW
    // ==========================================
    function startGame(mode, option = null) {
        state.mode = mode;
        state.modeOption = option;
        state.score = 0;
        state.moves = 0;
        state.time = 0;
        state.combo = 0;
        state.maxCombo = 0;
        state.totalMatches = 0;
        state.collected = {};
        state.selectedCell = null;
        state.isAnimating = false;
        state.gameOver = false;
        state.paused = false;
        state.activePowerup = null;
        // Reset multiplicador
        state.multiplier = 1;
        state.multiplierMoves = 0;
        state.jackpotCount = 0;
        state.jackpotsThisGame = 0;
        state.combosThisGame = 0;
        // Reset figuras congeladas
        state.penguinsFreed = 0;
        state.chicksFreed = 0;
        state.levelIceResistance = 2;
        // Reset monedas de esta partida
        state.coinsEarnedThisGame = 0;
        // Reset contador de sin jugadas
        state.noMovesCount = 0;
        // Reset configuración de nivel
        state.activeSymbols = CONFIG.SYMBOLS.slice();
        state.levelModifiers = [];
        state.levelCoinChance = CONFIG.COIN_CHANCE;
        hideMultiplierDisplay();
        cancelPowerup();
        
        // Mode-specific setup
        switch (mode) {
            case 'timed':
                state.time = option || 60;
                startTimer();
                break;
                
            case 'moves':
                state.moves = option || 30;
                break;
                
            case 'adventure':
                // option es la dificultad para aventura
                if (option && typeof option === 'string') {
                    state.difficulty = option;
                    state.adventureLevels = generateAdventureLevels(option);
                }
                const level = state.adventureLevels[state.adventureLevel - 1];
                state.moves = level.moves;
                
                // Configurar tiempo límite si el level lo tiene
                if (level.timeLimit) {
                    state.time = level.timeLimit;
                    startTimer();
                } else {
                    state.time = 0; // Sin límite de tiempo
                }
                
                // Configurar resistencia del hielo del nivel
                if (level.iceResistance) {
                    state.levelIceResistance = level.iceResistance;
                }
                
                // Todos los símbolos siempre activos (8 símbolos)
                // El 7 tiene probabilidad reducida en getRandomSymbol()
                state.activeSymbols = CONFIG.SYMBOLS.slice();
                
                // Aplicar modificadores del nivel
                if (level.modifiers) {
                    state.levelModifiers = level.modifiers;
                    
                    // Modificador: bonusCoins - más coin probabilitys
                    if (level.modifiers.includes('bonusCoins')) {
                        state.levelCoinChance = CONFIG.COIN_CHANCE * 1.5;
                    }
                }
                break;
        }
        
        createBoard();
        renderBoard();
        updateScore();
        updateModeInfo();
        updateObjective();
        updateCoinsDisplay();
        updatePowerupsDisplay();
        
        // Trackear partida jugada
        trackGamePlayed(mode);
        
        // Iniciar sesión de logs
        let logObjective = null;
        if (mode === 'adventure') {
            const level = state.adventureLevels[state.adventureLevel - 1];
            logObjective = level ? level.objective : null;
        }
        gameLog.startSession(
            mode,
            state.difficulty,
            state.adventureLevel,
            logObjective,
            state.moves,
            state.time
        );
        
        showScreen('game-screen');
        hideAllModals();
    }

    function startTimer() {
        if (state.timerInterval) clearInterval(state.timerInterval);
        
        state.timerInterval = setInterval(() => {
            if (state.paused || state.gameOver) return;
            
            state.time--;
            updateModeInfo();
            
            if (state.time <= 0) {
                clearInterval(state.timerInterval);
                // Verificar si puede comprar tiempo extra o pedir crédito
                const extraTimePrice = CONFIG.POWERUP_PRICES.extraTime;
                const hasExtraTime = state.powerups.extraTime > 0;
                const canBuy = state.coins >= extraTimePrice;
                const canBuyWithDebt = state.coins >= 0; // Puede pedir crédito si no tiene deuda
                
                if (hasExtraTime || canBuy || canBuyWithDebt) {
                    showOutOfTimeModal();
                } else {
                    endGame(false);
                }
            }
        }, 1000);
    }

    function pauseGame() {
        state.paused = true;
        cancelPowerup();
        document.getElementById('pause-score').textContent = state.score.toLocaleString();
        
        const pauseCoins = document.getElementById('pause-coins');
        if (pauseCoins) pauseCoins.textContent = state.coinsEarnedThisGame;
        
        let extraInfo = '';
        if (state.mode === 'timed') {
            extraInfo = `Tiempo restante: ${Math.floor(state.time / 60)}:${(state.time % 60).toString().padStart(2, '0')}`;
        } else if (state.mode === 'adventure') {
            const level = state.adventureLevels[state.adventureLevel - 1];
            if (level && level.timeLimit && state.time > 0) {
                extraInfo = `Tiempo: ${Math.floor(state.time / 60)}:${(state.time % 60).toString().padStart(2, '0')} | Movimientos: ${state.moves}`;
            } else {
                extraInfo = `Movimientos restantes: ${state.moves}`;
            }
        } else if (state.mode === 'moves') {
            extraInfo = `Movimientos restantes: ${state.moves}`;
        }
        document.getElementById('pause-extra-info').textContent = extraInfo;
        
        showModal('pause-modal');
    }

    function resumeGame() {
        state.paused = false;
        hideModal('pause-modal');
    }

    function restartGame() {
        hideAllModals();
        startGame(state.mode, state.modeOption);
    }

    async function quitGame() {
        if (state.timerInterval) clearInterval(state.timerInterval);
        
        // Guardar score al salir (especialmente importante para modo libre)
        // Solo guardar si hay un score y no se guardó ya (gameOver)
        if (!state.gameOver && state.score > 0) {
            await saveScore();
        }
        
        hideAllModals();
        showScreen('menu-screen');
        // Actualizar info del usuario (puede haber nuevo score)
        updateUserInfo();
    }

    function checkGameOver() {
        if (state.gameOver) return;
        
        // Verificar si hay jugadas válidas en el tablero
        if (!hasValidMoves()) {
            // No hay jugadas, verificar si puede comprar shuffle
            // (solo si no está bloqueado por noShuffle)
            const canBuyWithDebt = state.coins >= 0; // Puede pedir crédito si no tiene deuda
            const canShuffle = !state.levelModifiers.includes('noShuffle') &&
                (state.coins >= CONFIG.POWERUP_PRICES.shuffle || state.powerups.shuffle > 0 || canBuyWithDebt);
            
            if (canShuffle) {
                showNoMovesModal();
                return;
            } else {
                // No puede hacer nada, game over
                endGame(false);
                return;
            }
        }
        
        switch (state.mode) {
            case 'moves':
                if (state.moves <= 0) {
                    // En modo moves, terminar cuando se acaban (éxito basado en score)
                    endGame(true);
                }
                break;
                
            case 'adventure':
                const level = state.adventureLevels[state.adventureLevel - 1];
                const obj = level.objective;
                let completed = false;
                
                switch (obj.type) {
                    case 'score':
                        completed = state.score >= obj.target;
                        break;
                    case 'collect':
                        completed = (state.collected[obj.symbol] || 0) >= obj.target;
                        break;
                    case 'jackpots':
                        completed = state.jackpotsThisGame >= obj.target;
                        break;
                    case 'coins':
                        completed = state.coinsEarnedThisGame >= obj.target;
                        break;
                    case 'multiCollect':
                        const c1 = state.collected[obj.symbols[0]] || 0;
                        const c2 = state.collected[obj.symbols[1]] || 0;
                        completed = c1 >= obj.target && c2 >= obj.target;
                        break;
                    case 'frozen':
                        const penguinsDone = state.penguinsFreed >= (obj.penguins || 0);
                        const chicksDone = state.chicksFreed >= (obj.chicks || 0);
                        completed = penguinsDone && chicksDone;
                        break;
                    case 'combined':
                        completed = checkCombinedObjectiveComplete(obj.objectives);
                        break;
                }
                
                if (completed) {
                    endGame(true, true);
                } else if (state.moves <= 0) {
                    // Verificar si puede comprar movimientos extra o pedir crédito
                    const extraMovesPrice = CONFIG.POWERUP_PRICES.extraMoves;
                    const hasExtraMoves = state.powerups.extraMoves > 0;
                    const canBuy = state.coins >= extraMovesPrice;
                    const canBuyWithDebt = state.coins >= 0;
                    
                    if (hasExtraMoves || canBuy || canBuyWithDebt) {
                        showOutOfMovesModal();
                    } else {
                        endGame(false);
                    }
                }
                break;
        }
    }
    
    // Verificar si objetivo combinado está completo
    function checkCombinedObjectiveComplete(objectives) {
        for (const sub of objectives) {
            let subComplete = false;
            
            switch (sub.type) {
                case 'score':
                    subComplete = state.score >= sub.target;
                    break;
                case 'collect':
                    subComplete = (state.collected[sub.symbol] || 0) >= sub.target;
                    break;
                case 'multiCollect':
                    const m1 = (state.collected[sub.symbols[0]] || 0) >= sub.target;
                    const m2 = (state.collected[sub.symbols[1]] || 0) >= sub.target;
                    subComplete = m1 && m2;
                    break;
                case 'coins':
                    subComplete = state.coinsEarnedThisGame >= sub.target;
                    break;
                case 'jackpots':
                    subComplete = state.jackpotsThisGame >= sub.target;
                    break;
                case 'frozen':
                    const pDone = state.penguinsFreed >= (sub.penguins || 0);
                    const cDone = state.chicksFreed >= (sub.chicks || 0);
                    subComplete = pDone && cDone;
                    break;
            }
            
            if (!subComplete) return false;
        }
        return true;
    }
    
    // Modal cuando no hay jugadas disponibles pero puede comprar shuffle
    function showNoMovesModal() {
        state.paused = true;
        state.noMovesCount++; // Incrementar contador de veces sin jugadas
        
        const modal = document.getElementById('nomoves-modal');
        if (!modal) {
            // Crear modal dinámicamente si no existe
            createNoMovesModal();
        }
        
        // Actualizar info del modal
        const hasShuffle = state.powerups.shuffle > 0;
        const shufflePrice = CONFIG.POWERUP_PRICES.shuffle;
        const canBuy = state.coins >= shufflePrice;
        // Permitir deuda si no puede pagar y no tiene deuda (coins >= 0)
        const canBuyWithDebt = !canBuy && state.coins >= 0;
        const debtAmount = shufflePrice - state.coins;
        
        const shuffleBtn = document.getElementById('nomoves-shuffle');
        const buyBtn = document.getElementById('nomoves-buy');
        const debtBtn = document.getElementById('nomoves-debt');
        const tipText = document.getElementById('nomoves-tip');
        
        if (shuffleBtn) {
            shuffleBtn.style.display = hasShuffle ? 'block' : 'none';
            shuffleBtn.innerHTML = `<span class="btn-icon">🔀</span> ¡Rescate! (${state.powerups.shuffle})`;
        }
        
        if (buyBtn) {
            buyBtn.style.display = !hasShuffle && canBuy ? 'block' : 'none';
            buyBtn.innerHTML = `<span class="btn-icon">💰</span> Comprar Rescate (${shufflePrice})`;
        }
        
        if (debtBtn) {
            debtBtn.style.display = !hasShuffle && canBuyWithDebt ? 'block' : 'none';
            debtBtn.innerHTML = `<span class="btn-icon">🆘</span> Rescate a crédito (-${debtAmount} 💰)`;
        }
        
        // Mostrar tip después de la 2da vez sin jugadas
        if (tipText) {
            if (state.noMovesCount >= 2) {
                tipText.style.display = 'block';
                tipText.textContent = '💡 Tip: Junta monedas en niveles más fáciles para tener comodines en niveles difíciles';
            } else {
                tipText.style.display = 'none';
            }
        }
        
        showModal('nomoves-modal');
    }
    
    function createNoMovesModal() {
        const modal = document.createElement('div');
        modal.id = 'nomoves-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content nomoves-modal-content">
                <div class="nomoves-header">
                    <span class="warning-icon">⚠️</span>
                    <h2>¡Sin Jugadas!</h2>
                </div>
                <p class="nomoves-description">
                    No hay jugadas disponibles en el tablero.
                </p>
                <p id="nomoves-tip" class="nomoves-tip" style="display: none;"></p>
                <div class="modal-buttons">
                    <button id="nomoves-shuffle" class="rescue-btn">¡Rescate!</button>
                    <button id="nomoves-buy" class="rescue-btn">Comprar Rescate</button>
                    <button id="nomoves-debt" class="debt-btn">Rescate a crédito</button>
                    <button id="nomoves-giveup" class="danger-btn">Rendirse</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Event listeners
        document.getElementById('nomoves-shuffle').addEventListener('click', () => {
            // Log de rescate shuffle usando inventario o compra
            const hasShuffle = state.powerups.shuffle > 0;
            const method = hasShuffle ? 'inventory' : 'purchase';
            const price = hasShuffle ? 0 : CONFIG.POWERUP_PRICES.shuffle;

            gameLog.log('rescue_used', {
                type: 'shuffle',
                method,
                coinsBefore: state.coins,
                powerupsBefore: state.powerups.shuffle,
                price
            });

            hideModal('nomoves-modal');
            state.paused = false;
            usePowerup('shuffle');
        });
        
        document.getElementById('nomoves-buy').addEventListener('click', () => {
            if (buyPowerup('shuffle')) {
                // Log de rescate shuffle comprado
                gameLog.log('rescue_used', {
                    type: 'shuffle',
                    method: 'purchase',
                    coinsBefore: state.coins + CONFIG.POWERUP_PRICES.shuffle, // Antes de la compra
                    coinsAfter: state.coins,
                    powerupsBefore: state.powerups.shuffle - 1, // Antes de agregar al inventario
                    powerupsAfter: state.powerups.shuffle,
                    price: CONFIG.POWERUP_PRICES.shuffle
                });

                hideModal('nomoves-modal');
                state.paused = false;
                usePowerup('shuffle');
            }
        });
        
        document.getElementById('nomoves-debt').addEventListener('click', () => {
            // Log de rescate shuffle a crédito
            const shufflePrice = CONFIG.POWERUP_PRICES.shuffle;
            const coinsBefore = state.coins;

            gameLog.log('rescue_used', {
                type: 'shuffle',
                method: 'debt',
                coinsBefore,
                coinsAfter: state.coins - shufflePrice,
                powerupsBefore: state.powerups.shuffle,
                powerupsAfter: state.powerups.shuffle,
                price: shufflePrice
            });

            // Comprar con deuda - restar precio completo (coins queda negativo)
            state.coins -= shufflePrice;
            saveCoins();
            updateCoinsDisplay();
            updatePowerupsDisplay();

            hideModal('nomoves-modal');
            state.paused = false;

            // Ejecutar shuffle directamente (sin pasar por inventario)
            shuffleBoard();
            savePowerups();
            vibrate([50, 30, 50]);
            playSound('shuffle');
        });
        
        document.getElementById('nomoves-giveup').addEventListener('click', () => {
            hideModal('nomoves-modal');
            state.paused = false;
            endGame(false);
        });
    }

    // ==========================================
    // MODAL: SIN MOVIMIENTOS (BANCO)
    // ==========================================
    function showOutOfMovesModal() {
        state.paused = true;
        
        const modal = document.getElementById('outofmoves-modal');
        if (!modal) {
            createOutOfMovesModal();
        }
        
        // Actualizar info del modal
        const hasExtraMoves = state.powerups.extraMoves > 0;
        const extraMovesPrice = CONFIG.POWERUP_PRICES.extraMoves;
        const canBuy = state.coins >= extraMovesPrice;
        const canBuyWithDebt = !canBuy && state.coins >= 0;
        const debtAmount = extraMovesPrice - state.coins;
        
        const useBtn = document.getElementById('outofmoves-use');
        const buyBtn = document.getElementById('outofmoves-buy');
        const debtBtn = document.getElementById('outofmoves-debt');
        
        if (useBtn) {
            useBtn.style.display = hasExtraMoves ? 'block' : 'none';
            useBtn.innerHTML = `<span class="btn-icon">🎯</span> Usar +20 Mov (${state.powerups.extraMoves})`;
        }
        
        if (buyBtn) {
            buyBtn.style.display = !hasExtraMoves && canBuy ? 'block' : 'none';
            buyBtn.innerHTML = `<span class="btn-icon">💰</span> Comprar +20 Mov (${extraMovesPrice})`;
        }
        
        if (debtBtn) {
            debtBtn.style.display = !hasExtraMoves && canBuyWithDebt ? 'block' : 'none';
            debtBtn.innerHTML = `<span class="btn-icon">🆘</span> +20 Mov a crédito (-${debtAmount} 💰)`;
        }
        
        showModal('outofmoves-modal');
    }
    
    function createOutOfMovesModal() {
        const modal = document.createElement('div');
        modal.id = 'outofmoves-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content rescue-modal-content">
                <div class="rescue-header">
                    <span class="rescue-icon">🎯</span>
                    <h2>¡Sin Movimientos!</h2>
                </div>
                <p class="rescue-description">
                    Se acabaron tus movimientos. ¿Quieres continuar?
                </p>
                <div class="rescue-buttons">
                    <button id="outofmoves-use" class="rescue-btn">Usar +20 Mov</button>
                    <button id="outofmoves-buy" class="rescue-btn">Comprar +20 Mov</button>
                    <button id="outofmoves-debt" class="debt-btn">+20 Mov a crédito</button>
                    <button id="outofmoves-giveup" class="danger-btn">Rendirse</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Event listeners
        document.getElementById('outofmoves-use').addEventListener('click', () => {
            // Log de rescate +20 movimientos usando inventario
            gameLog.log('rescue_used', {
                type: 'extraMoves',
                method: 'inventory',
                coinsBefore: state.coins,
                coinsAfter: state.coins,
                powerupsBefore: state.powerups.extraMoves,
                powerupsAfter: state.powerups.extraMoves - 1,
                price: 0
            });

            state.powerups.extraMoves--;
            state.moves += 20;
            savePowerups();
            updatePowerupsDisplay();
            updateModeInfo();
            hideModal('outofmoves-modal');
            state.paused = false;
            playSound('powerup');
            vibrate(50);
        });
        
        document.getElementById('outofmoves-buy').addEventListener('click', () => {
            const price = CONFIG.POWERUP_PRICES.extraMoves;
            if (state.coins >= price) {
                // Log de rescate +20 movimientos comprado
                gameLog.log('rescue_used', {
                    type: 'extraMoves',
                    method: 'purchase',
                    coinsBefore: state.coins,
                    coinsAfter: state.coins - price,
                    powerupsBefore: state.powerups.extraMoves,
                    powerupsAfter: state.powerups.extraMoves,
                    price
                });

                state.coins -= price;
                state.moves += 20;
                saveCoins();
                updateCoinsDisplay();
                updateModeInfo();
                hideModal('outofmoves-modal');
                state.paused = false;
                playSound('powerup');
                vibrate(50);
            }
        });
        
        document.getElementById('outofmoves-debt').addEventListener('click', () => {
            const price = CONFIG.POWERUP_PRICES.extraMoves;
            const coinsBefore = state.coins;

            // Log de rescate +20 movimientos a crédito
            gameLog.log('rescue_used', {
                type: 'extraMoves',
                method: 'debt',
                coinsBefore,
                coinsAfter: state.coins - price,
                powerupsBefore: state.powerups.extraMoves,
                powerupsAfter: state.powerups.extraMoves,
                price
            });

            state.coins -= price; // Queda negativo
            state.moves += 20;
            saveCoins();
            updateCoinsDisplay();
            updateModeInfo();
            hideModal('outofmoves-modal');
            state.paused = false;
            playSound('powerup');
            vibrate(50);
        });
        
        document.getElementById('outofmoves-giveup').addEventListener('click', () => {
            hideModal('outofmoves-modal');
            state.paused = false;
            endGame(false);
        });
    }

    // ==========================================
    // MODAL: SIN TIEMPO
    // ==========================================
    function showOutOfTimeModal() {
        state.paused = true;
        
        const modal = document.getElementById('outoftime-modal');
        if (!modal) {
            createOutOfTimeModal();
        }
        
        // Actualizar info del modal
        const hasExtraTime = state.powerups.extraTime > 0;
        const extraTimePrice = CONFIG.POWERUP_PRICES.extraTime;
        const canBuy = state.coins >= extraTimePrice;
        const canBuyWithDebt = !canBuy && state.coins >= 0;
        const debtAmount = extraTimePrice - state.coins;
        
        const useBtn = document.getElementById('outoftime-use');
        const buyBtn = document.getElementById('outoftime-buy');
        const debtBtn = document.getElementById('outoftime-debt');
        
        if (useBtn) {
            useBtn.style.display = hasExtraTime ? 'block' : 'none';
            useBtn.innerHTML = `<span class="btn-icon">⏳</span> Usar +60s (${state.powerups.extraTime})`;
        }
        
        if (buyBtn) {
            buyBtn.style.display = !hasExtraTime && canBuy ? 'block' : 'none';
            buyBtn.innerHTML = `<span class="btn-icon">💰</span> Comprar +60s (${extraTimePrice})`;
        }
        
        if (debtBtn) {
            debtBtn.style.display = !hasExtraTime && canBuyWithDebt ? 'block' : 'none';
            debtBtn.innerHTML = `<span class="btn-icon">🆘</span> +60s a crédito (-${debtAmount} 💰)`;
        }
        
        showModal('outoftime-modal');
    }
    
    function createOutOfTimeModal() {
        const modal = document.createElement('div');
        modal.id = 'outoftime-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content rescue-modal-content">
                <div class="rescue-header">
                    <span class="rescue-icon">⏳</span>
                    <h2>¡Se acabó el tiempo!</h2>
                </div>
                <p class="rescue-description">
                    El tiempo ha terminado. ¿Quieres continuar?
                </p>
                <div class="rescue-buttons">
                    <button id="outoftime-use" class="rescue-btn">Usar +60s</button>
                    <button id="outoftime-buy" class="rescue-btn">Comprar +60s</button>
                    <button id="outoftime-debt" class="debt-btn">+60s a crédito</button>
                    <button id="outoftime-giveup" class="danger-btn">Rendirse</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Event listeners
        document.getElementById('outoftime-use').addEventListener('click', () => {
            // Log de rescate +60 segundos usando inventario
            gameLog.log('rescue_used', {
                type: 'extraTime',
                method: 'inventory',
                coinsBefore: state.coins,
                coinsAfter: state.coins,
                powerupsBefore: state.powerups.extraTime,
                powerupsAfter: state.powerups.extraTime - 1,
                price: 0
            });

            state.powerups.extraTime--;
            state.time += 60;
            savePowerups();
            updatePowerupsDisplay();
            updateModeInfo();
            hideModal('outoftime-modal');
            state.paused = false;
            startTimer(); // Reiniciar timer
            playSound('powerup');
            vibrate(50);
        });
        
        document.getElementById('outoftime-buy').addEventListener('click', () => {
            const price = CONFIG.POWERUP_PRICES.extraTime;
            if (state.coins >= price) {
                // Log de rescate +60 segundos comprado
                gameLog.log('rescue_used', {
                    type: 'extraTime',
                    method: 'purchase',
                    coinsBefore: state.coins,
                    coinsAfter: state.coins - price,
                    powerupsBefore: state.powerups.extraTime,
                    powerupsAfter: state.powerups.extraTime,
                    price
                });

                state.coins -= price;
                state.time += 60;
                saveCoins();
                updateCoinsDisplay();
                updateModeInfo();
                hideModal('outoftime-modal');
                state.paused = false;
                startTimer(); // Reiniciar timer
                playSound('powerup');
                vibrate(50);
            }
        });
        
        document.getElementById('outoftime-debt').addEventListener('click', () => {
            const price = CONFIG.POWERUP_PRICES.extraTime;
            const coinsBefore = state.coins;

            // Log de rescate +60 segundos a crédito
            gameLog.log('rescue_used', {
                type: 'extraTime',
                method: 'debt',
                coinsBefore,
                coinsAfter: state.coins - price,
                powerupsBefore: state.powerups.extraTime,
                powerupsAfter: state.powerups.extraTime,
                price
            });

            state.coins -= price; // Queda negativo
            state.time += 60;
            saveCoins();
            updateCoinsDisplay();
            updateModeInfo();
            hideModal('outoftime-modal');
            state.paused = false;
            startTimer(); // Reiniciar timer
            playSound('powerup');
            vibrate(50);
        });
        
        document.getElementById('outoftime-giveup').addEventListener('click', () => {
            hideModal('outoftime-modal');
            state.paused = false;
            endGame(false);
        });
    }

    async function endGame(success, isVictory = false) {
        state.gameOver = true;
        if (state.timerInterval) clearInterval(state.timerInterval);
        
        vibrate(success ? [100, 50, 100] : [200, 100, 200]);
        
        // Sonido según resultado
        if (isVictory || success) {
            playSound('victory');
        } else {
            playSound('gameover');
        }
        
        // Save score - SIEMPRE guardar al terminar (await para obtener ranking)
        await saveScore();
        
        // Enviar logs de la sesión
        const result = isVictory ? 'victory' : (success ? 'success' : 'failure');
        gameLog.endSession(result, {
            score: state.score,
            movesLeft: state.moves,
            timeLeft: state.time,
            coinsEarned: state.coinsEarnedThisGame,
            totalMatches: state.totalMatches,
            maxCombo: state.maxCombo,
            collected: state.collected,
            coins: state.coins,
            powerups: { ...state.powerups }
        });
        
        if (isVictory && state.mode === 'adventure') {
            showVictoryModal();
        } else {
            showGameOverModal(success);
        }
    }

    function showGameOverModal(success) {
        const title = success ? '¡Bien Jugado!' : 'Fin del Juego';
        document.getElementById('gameover-title').textContent = title;
        document.getElementById('final-score').textContent = state.score.toLocaleString();
        document.getElementById('final-combo').textContent = `x${state.maxCombo}`;
        document.getElementById('final-matches').textContent = state.totalMatches;
        
        const finalCoins = document.getElementById('final-coins');
        if (finalCoins) finalCoins.textContent = state.coinsEarnedThisGame;
        
        // Mostrar feedback de ranking
        const rankingFeedback = document.getElementById('ranking-feedback');
        const rankingPositionText = document.getElementById('ranking-position-text');
        const rankingRecordBadge = document.getElementById('ranking-record-badge');
        
        if (lastRankingResult && rankingFeedback) {
            const r = lastRankingResult;
            rankingFeedback.style.display = 'block';
            
            // Texto de posición
            rankingPositionText.innerHTML = `Posicion en ranking: <strong>#${r.position}</strong> de ${r.totalPlayers}`;
            
            // Badge de logro
            if (r.isNewPersonalBest && r.isInTop10) {
                rankingRecordBadge.style.display = 'inline-block';
                rankingRecordBadge.className = 'ranking-badge new-record';
                rankingRecordBadge.textContent = '🏆 ¡Nuevo Record + Top 10!';
            } else if (r.isNewPersonalBest) {
                rankingRecordBadge.style.display = 'inline-block';
                rankingRecordBadge.className = 'ranking-badge new-record';
                rankingRecordBadge.textContent = '🎉 ¡Nuevo Record Personal!';
            } else if (r.isInTop10) {
                rankingRecordBadge.style.display = 'inline-block';
                rankingRecordBadge.className = 'ranking-badge top-10';
                rankingRecordBadge.textContent = '⭐ ¡Estas en el Top 10!';
            } else if (r.previousBest > 0) {
                rankingRecordBadge.style.display = 'inline-block';
                rankingRecordBadge.className = 'ranking-badge improved';
                rankingRecordBadge.textContent = `Tu mejor: ${r.previousBest.toLocaleString()} pts`;
            } else {
                rankingRecordBadge.style.display = 'none';
            }
        } else if (rankingFeedback) {
            rankingFeedback.style.display = 'none';
        }
        
        let message = '';
        if (state.score >= 5000) message = '¡Increible! Eres un maestro 🎰';
        else if (state.score >= 2000) message = '¡Muy bien! Sigue asi 💎';
        else if (state.score >= 1000) message = 'Buen intento, puedes mejorar ⭐';
        else message = 'Sigue practicando 🍀';
        
        document.getElementById('gameover-message').textContent = message;
        
        showModal('gameover-modal');
    }

    function showVictoryModal() {
        const level = state.adventureLevels[state.adventureLevel - 1];
        let stars = 1;
        if (state.score >= level.stars[2]) stars = 3;
        else if (state.score >= level.stars[1]) stars = 2;
        
        // Sonido de victoria/subir nivel
        playSound('levelup');
        
        // Guardar level completado y estrellas
        saveCompletedLevel(state.adventureLevel, stars);
        
        const starsEl = document.getElementById('victory-stars');
        starsEl.textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
        starsEl.className = `victory-stars stars-${stars}`;
        
        document.getElementById('victory-score').textContent = state.score.toLocaleString();
        
        const victoryCoins = document.getElementById('victory-coins');
        if (victoryCoins) victoryCoins.textContent = state.coinsEarnedThisGame;
        
        // Hide next level button if last level
        const nextBtn = document.getElementById('next-level-btn');
        nextBtn.style.display = state.adventureLevel >= 30 ? 'none' : 'block';
        
        showModal('victory-modal');
    }
    
    function saveCompletedLevel(levelNum, stars) {
        const diff = state.difficulty;
        
        // Agregar level a completados si no existe
        if (!state.completedLevels[diff].includes(levelNum)) {
            state.completedLevels[diff].push(levelNum);
        }
        
        // Guardar estrellas (solo si es mejor)
        const currentStars = state.levelStars[diff][levelNum] || 0;
        if (stars > currentStars) {
            state.levelStars[diff][levelNum] = stars;
        }
        
        // Persistir en localStorage por usuario
        saveUserProgress();
    }
    
    // Estado de sincronización
    let syncPending = false;
    
    // Verificar si hay datos pendientes de sincronizar
    function checkPendingSync() {
        const pending = localStorage.getItem('tragamonedas_sync_pending');
        syncPending = pending === 'true';
        updateSyncButton();
        return syncPending;
    }
    
    // Marcar que hay datos pendientes
    function markSyncPending(pending = true) {
        syncPending = pending;
        localStorage.setItem('tragamonedas_sync_pending', pending ? 'true' : 'false');
        updateSyncButton();
    }
    
    // Actualizar visibilidad del botón de sincronización
    function updateSyncButton() {
        const btn = document.getElementById('sync-btn');
        if (btn) {
            btn.style.display = syncPending ? 'flex' : 'none';
        }
    }
    
    // Sincronización forzada
    async function forceSync() {
        if (!state.username) return false;
        
        const btn = document.getElementById('sync-btn');
        if (btn) {
            btn.classList.add('syncing');
            btn.querySelector('.sync-text').textContent = 'Sincronizando...';
        }
        
        const progress = {
            completedLevels: state.completedLevels,
            levelStars: state.levelStars,
            coins: state.coins,
            powerups: state.powerups
        };
        
        try {
            // Intentar sincronizar progreso
            if (typeof saveUserProgressToServer === 'function') {
                const result = await saveUserProgressToServer(state.username, progress);
                if (result) {
                    markSyncPending(false);
                    if (btn) {
                        btn.classList.remove('syncing');
                        btn.classList.add('success');
                        btn.querySelector('.sync-text').textContent = 'Sincronizado!';
                        setTimeout(() => {
                            btn.classList.remove('success');
                            btn.querySelector('.sync-text').textContent = 'Sincronizar datos';
                            updateSyncButton();
                        }, 2000);
                    }
                    console.log('Sincronizacion forzada exitosa');
                    return true;
                }
            }
        } catch (e) {
            console.error('Error en sincronizacion forzada:', e);
        }
        
        // Si falla
        if (btn) {
            btn.classList.remove('syncing');
            btn.querySelector('.sync-text').textContent = 'Error - Reintentar';
        }
        return false;
    }
    
    // Guardar progreso del usuario actual (local + servidor)
    async function saveUserProgress() {
        if (!state.username) return;
        
        const progress = {
            completedLevels: state.completedLevels,
            levelStars: state.levelStars,
            coins: state.coins,
            powerups: state.powerups
        };
        
        // Guardar localmente primero (siempre funciona)
        const progressKey = `tragamonedas_progress_${state.username}`;
        localStorage.setItem(progressKey, JSON.stringify(progress));
        
        // Verificar conexión
        if (!navigator.onLine) {
            console.log('Sin conexion - datos guardados localmente');
            markSyncPending(true);
            return;
        }
        
        // Intentar sincronizar con servidor
        if (typeof saveUserProgressToServer === 'function') {
            try {
                const result = await saveUserProgressToServer(state.username, progress);
                if (result) {
                    // Sincronización exitosa
                    markSyncPending(false);
                } else {
                    // Fallo silencioso - marcar pendiente
                    markSyncPending(true);
                }
            } catch (e) {
                console.error('Error sincronizando progreso con servidor:', e);
                markSyncPending(true);
            }
        }
    }
    
    // Inicializar dificultad global (hardcodeado a Normal)
    function initGlobalDifficulty() {
        // GLOBAL_DIFFICULTY_LEVEL ya está establecido en 3 (Normal) por defecto
        console.log('Dificultad global:', GLOBAL_DIFFICULTIES[GLOBAL_DIFFICULTY_LEVEL].name);
    }
    
    // Cargar progreso del usuario actual
    // IMPORTANTE: El servidor es la UNICA fuente de verdad
    // localStorage solo se usa como cache cuando no hay conexion
    async function loadUserProgress() {
        if (!state.username) {
            // Sin usuario, usar valores por defecto
            resetUserProgressState();
            return;
        }
        
        const progressKey = `tragamonedas_progress_${state.username}`;
        
        // Verificar si el usuario fue borrado por el admin
        if (typeof checkUserDeleted === 'function') {
            try {
                const status = await checkUserDeleted(state.username);
                if (status.wasDeleted) {
                    // Borrar progreso local (evitar que se restaure)
                    localStorage.removeItem(progressKey);
                    
                    // Resetear estado
                    resetUserProgressState();
                    
                    // Confirmar que se procesó el reset
                    if (typeof acknowledgeUserReset === 'function') {
                        await acknowledgeUserReset(state.username);
                    }
                    
                    // Mostrar mensaje al usuario
                    alert('Tu progreso ha sido reiniciado por el administrador. Comenzaras desde cero.');
                    
                    // Actualizar displays
                    updateCoinsDisplay();
                    updatePowerupsDisplay();
                    return;
                }
            } catch (e) {
                console.error('Error verificando estado de usuario:', e);
            }
        }
        
        // Intentar cargar desde el servidor
        let serverResult = { success: false, progress: null, networkError: true };
        if (typeof getUserProgress === 'function') {
            try {
                serverResult = await getUserProgress(state.username);
            } catch (e) {
                console.error('Error cargando progreso desde servidor:', e);
                serverResult = { success: false, progress: null, networkError: true };
            }
        }
        
        // CASO 1: Servidor respondió exitosamente
        if (serverResult.success) {
            if (serverResult.progress) {
                // Hay datos en servidor - usarlos
                state.completedLevels = serverResult.progress.completedLevels || { easy: [], normal: [], hard: [] };
                state.levelStars = serverResult.progress.levelStars || { easy: {}, normal: {}, hard: {} };
                state.coins = serverResult.progress.coins || 0;
                
                // Migrar powerups si es necesario
                const savedPowerups = serverResult.progress.powerups || {};
                state.powerups = {
                    shuffle: savedPowerups.shuffle || 0,
                    bomb: savedPowerups.bomb || 0,
                    extraTime: savedPowerups.extraTime || 0,
                    extraMoves: savedPowerups.extraMoves || 0
                };
                
                // Actualizar localStorage como respaldo (para modo offline)
                localStorage.setItem(progressKey, JSON.stringify({
                    completedLevels: state.completedLevels,
                    levelStars: state.levelStars,
                    coins: state.coins,
                    powerups: state.powerups
                }));
                
                // Limpiar flag de sync pendiente
                markSyncPending(false);
                
                console.log('Progreso cargado desde servidor:', serverResult.progress);
            } else {
                // Servidor respondió pero NO hay datos (usuario nuevo o borrado)
                // NO usar localStorage - el servidor es la fuente de verdad
                console.log('Servidor sin datos para este usuario - iniciando desde cero');
                
                // Borrar localStorage viejo para este usuario (evitar inconsistencias)
                localStorage.removeItem(progressKey);
                
                // Resetear a valores por defecto
                resetUserProgressState();
            }
        }
        // CASO 2: Error de red - usar localStorage como cache temporal
        else if (serverResult.networkError) {
            console.log('Sin conexion al servidor - usando cache local');
            
            const saved = localStorage.getItem(progressKey);
            
            if (saved) {
                try {
                    const progress = JSON.parse(saved);
                    state.completedLevels = progress.completedLevels || { easy: [], normal: [], hard: [] };
                    state.levelStars = progress.levelStars || { easy: {}, normal: {}, hard: {} };
                    state.coins = progress.coins || 0;
                    
                    // Migrar powerups (wildcard -> extraTime)
                    const savedPowerups = progress.powerups || {};
                    if (savedPowerups.wildcard !== undefined && savedPowerups.extraTime === undefined) {
                        savedPowerups.extraTime = savedPowerups.wildcard;
                        delete savedPowerups.wildcard;
                    }
                    if (savedPowerups.lightning !== undefined && savedPowerups.extraTime === undefined) {
                        savedPowerups.extraTime = savedPowerups.lightning;
                        delete savedPowerups.lightning;
                    }
                    state.powerups = {
                        shuffle: savedPowerups.shuffle || 0,
                        bomb: savedPowerups.bomb || 0,
                        extraTime: savedPowerups.extraTime || 0,
                        extraMoves: savedPowerups.extraMoves || 0
                    };
                    
                    // Marcar que hay datos pendientes de sincronizar
                    markSyncPending(true);
                    
                    console.log('Progreso cargado desde cache local (pendiente de sincronizar)');
                } catch (e) {
                    console.error('Error cargando progreso local:', e);
                    resetUserProgressState();
                }
            } else {
                // No hay cache local - valores por defecto
                resetUserProgressState();
            }
        }
        
        // Actualizar displays
        updateCoinsDisplay();
        updatePowerupsDisplay();
    }
    
    // Resetear estado de progreso a valores por defecto
    function resetUserProgressState() {
        state.completedLevels = { easy: [], normal: [], hard: [] };
        state.levelStars = { easy: {}, normal: {}, hard: {} };
        state.coins = 0;
        state.powerups = { shuffle: 0, bomb: 0, extraTime: 0, extraMoves: 0 };
    }
    
    function isLevelCompleted(levelNum, difficulty) {
        return state.completedLevels[difficulty]?.includes(levelNum) || false;
    }
    
    function getLevelStars(levelNum, difficulty) {
        return state.levelStars[difficulty]?.[levelNum] || 0;
    }

    function nextLevel() {
        if (state.adventureLevel < 30) {
            state.adventureLevel++;
            localStorage.setItem('tragamonedasAdventureLevel_' + state.difficulty, state.adventureLevel);
        }
        hideModal('victory-modal');
        startGame('adventure', state.difficulty);
    }

    // ==========================================
    // RANKING
    // ==========================================
    
    // Variable para almacenar el resultado del ranking después de guardar
    let lastRankingResult = null;
    
    async function saveScore() {
        if (!state.username || state.score === 0) return;
        
        // Reset ranking result
        lastRankingResult = null;
        
        // Construir el identificador del modo para el ranking
        let modeKey = state.mode;
        if (state.mode === 'adventure') {
            modeKey = `adventure_${state.difficulty}`;
        } else if (state.mode === 'timed') {
            modeKey = `timed_${state.modeOption}`;
        } else if (state.mode === 'moves') {
            modeKey = `moves_${state.modeOption}`;
        }
        
        try {
            if (typeof submitScorePocketBase === 'function') {
                const result = await submitScorePocketBase({
                    username: state.username,
                    score: state.score,
                    mode: modeKey,
                    level: state.mode === 'adventure' ? state.adventureLevel : 0,
                    lines: state.totalMatches
                });
                
                if (result && result.ranking) {
                    lastRankingResult = result.ranking;
                    console.log('Ranking result:', lastRankingResult);
                }
                
                console.log('Score guardado:', modeKey, state.score);
            }
        } catch (e) {
            console.error('Error guardando score:', e);
        }
    }

    async function loadRanking(mode = 'free', difficulty = null) {
        const entries = document.getElementById('ranking-entries');
        if (entries) {
            entries.innerHTML = '<div style="padding: 20px; color: var(--text-secondary);">Cargando...</div>';
        }
        
        let modeKey = mode;
        if (mode === 'adventure' && difficulty) {
            modeKey = `adventure_${difficulty}`;
        }
        
        try {
            if (typeof getTopScoresPocketBase === 'function') {
                const ranking = await getTopScoresPocketBase(10, modeKey);
                
                if (!ranking || ranking.length === 0) {
                    if (entries) entries.innerHTML = '<div style="padding: 20px; color: var(--text-secondary);">Sin puntuaciones aun</div>';
                    return;
                }
                
                if (entries) {
                    entries.innerHTML = ranking.map((item, idx) => `
                        <div class="ranking-entry ${item.username === state.username ? 'current-user' : ''}">
                            <span class="rank ${idx < 3 ? 'top-3' : ''}">${idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}</span>
                            <span>${item.username}</span>
                            <span>${item.score?.toLocaleString() || 0}</span>
                        </div>
                    `).join('');
                }
            }
        } catch (e) {
            console.error('Error cargando ranking:', e);
            if (entries) entries.innerHTML = '<div style="padding: 20px; color: var(--text-secondary);">Error al cargar ranking</div>';
        }
    }

    // Cargar ranking compacto en el menu principal
    async function loadCompactRanking() {
        const modes = [
            { id: 'ranking-free', mode: 'free' },
            { id: 'ranking-timed', mode: 'timed' },
            { id: 'ranking-moves', mode: 'moves' },
            { id: 'ranking-adventure', mode: 'adventure' }
        ];

        for (const { id, mode } of modes) {
            const container = document.getElementById(id);
            if (!container) continue;

            try {
                let ranking = [];
                
                if (typeof getTopScoresPocketBase === 'function') {
                    if (mode === 'adventure') {
                        // Para aventura, obtener top de todas las dificultades combinadas
                        const [easy, normal, hard] = await Promise.all([
                            getTopScoresPocketBase(3, 'adventure_easy'),
                            getTopScoresPocketBase(3, 'adventure_normal'),
                            getTopScoresPocketBase(3, 'adventure_hard')
                        ]);
                        // Combinar y ordenar por score
                        ranking = [...easy, ...normal, ...hard]
                            .sort((a, b) => b.score - a.score)
                            .slice(0, 3);
                    } else {
                        ranking = await getTopScoresPocketBase(3, mode);
                    }
                }

                if (!ranking || ranking.length === 0) {
                    container.innerHTML = '<div class="ranking-mini-empty">Sin puntuaciones</div>';
                } else {
                    container.innerHTML = ranking.map((item, idx) => `
                        <div class="ranking-mini-entry">
                            <span class="mini-rank">${idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                            <span class="mini-name">${item.username}</span>
                            <span class="mini-score">${item.score?.toLocaleString() || 0}</span>
                        </div>
                    `).join('');
                }
            } catch (e) {
                console.error(`Error cargando ranking ${mode}:`, e);
                container.innerHTML = '<div class="ranking-mini-empty">Error</div>';
            }
        }
    }

    // ==========================================
    // MENU Y SELECCION
    // ==========================================
    function showModeSelection(mode) {
        const modeData = MODES[mode];
        
        // Modo libre no tiene opciones
        if (mode === 'free') {
            startGame(mode);
            return;
        }
        
        // Aventura usa dificultades y luego niveles
        if (mode === 'adventure') {
            showAdventureDifficultySelect();
            return;
        }
        
        // Otros modos con opciones numéricas
        if (!modeData.options) {
            startGame(mode);
            return;
        }
        
        elements.selectTitle.textContent = modeData.name;
        elements.selectOptions.innerHTML = modeData.options.map(opt => `
            <button class="select-option" data-value="${opt.value}">
                <span class="option-title">${opt.label}</span>
                <span class="option-desc">${opt.desc}</span>
            </button>
        `).join('');
        
        elements.selectOptions.querySelectorAll('.select-option').forEach(btn => {
            btn.addEventListener('click', () => {
                startGame(mode, parseInt(btn.dataset.value));
            });
        });
        
        showScreen('select-screen');
    }
    
    function showAdventureDifficultySelect() {
        const modeData = MODES.adventure;
        elements.selectTitle.textContent = modeData.name;
        
        elements.selectOptions.innerHTML = modeData.difficulties.map(opt => {
            const completed = state.completedLevels[opt.value]?.length || 0;
            const totalStars = Object.values(state.levelStars[opt.value] || {}).reduce((a, b) => a + b, 0);
            
            return `
                <button class="select-option difficulty-option" data-value="${opt.value}">
                    <span class="option-title">${opt.label}</span>
                    <span class="option-desc">${opt.desc}</span>
                    <span class="option-progress">
                        <span class="progress-levels">${completed}/30 niveles</span>
                        <span class="progress-stars">⭐ ${totalStars}</span>
                    </span>
                </button>
            `;
        }).join('');
        
        elements.selectOptions.querySelectorAll('.select-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const diff = btn.dataset.value;
                state.difficulty = diff;
                showAdventureLevelSelect(diff);
            });
        });
        
        showScreen('select-screen');
    }
    
    function showAdventureLevelSelect(difficulty) {
        const diffName = DIFFICULTIES[difficulty].name;
        elements.selectTitle.textContent = `Aventura - ${diffName}`;
        
        // Generar niveles para esta dificultad
        state.adventureLevels = generateAdventureLevels(difficulty);
        
        let html = '<div class="levels-grid">';
        
        for (let i = 1; i <= 30; i++) {
            const isCompleted = isLevelCompleted(i, difficulty);
            const stars = getLevelStars(i, difficulty);
            // Admin puede jugar cualquier nivel
            const isAdmin = state.username && state.username.toLowerCase() === 'admin';
            const isLocked = !isAdmin && i > 1 && !isLevelCompleted(i - 1, difficulty) && !isCompleted;
            const levelData = state.adventureLevels[i - 1];
            
            const starsHtml = isCompleted 
                ? '<span class="level-stars">' + '⭐'.repeat(stars) + '☆'.repeat(3 - stars) + '</span>'
                : '';
            
            const statusClass = isLocked ? 'locked' : (isCompleted ? 'completed' : 'available');
            
            html += `
                <button class="level-btn ${statusClass}" data-level="${i}" ${isLocked ? 'disabled' : ''}>
                    <span class="level-num">${isLocked ? '🔒' : i}</span>
                    ${starsHtml}
                </button>
            `;
        }
        
        html += '</div>';
        html += '<button class="back-btn level-back">← Volver a dificultades</button>';
        
        elements.selectOptions.innerHTML = html;
        
        // Event listeners para niveles
        elements.selectOptions.querySelectorAll('.level-btn:not(.locked)').forEach(btn => {
            btn.addEventListener('click', () => {
                const level = parseInt(btn.dataset.level);
                state.adventureLevel = level;
                startGame('adventure', difficulty);
            });
        });
        
        // Boton volver a dificultades
        const backBtn = elements.selectOptions.querySelector('.level-back');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                showAdventureDifficultySelect();
            });
        }
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================
    
    // Funcion para actualizar info del usuario en menu principal
    async function updateUserInfo() {
        const userInfo = document.getElementById('user-info');
        const menuUsername = document.getElementById('menu-username');
        const userScores = document.getElementById('user-scores');
        
        if (!userInfo || !menuUsername || !userScores) return;
        
        if (!state.username) {
            userInfo.classList.add('hidden');
            return;
        }
        
        userInfo.classList.remove('hidden');
        menuUsername.textContent = state.username;
        
        // Obtener scores del usuario
        try {
            const scores = await getAllUserScores(state.username);
            
            if (scores.length === 0) {
                userScores.innerHTML = '<span class="user-scores-empty">Aun no tienes puntajes</span>';
                return;
            }
            
            // Mapeo de modos a iconos y nombres cortos
            const modeInfo = {
                'free': { icon: '🎰', name: 'Libre' },
                'timed_60': { icon: '⏱️', name: '60s' },
                'timed_90': { icon: '⏱️', name: '90s' },
                'timed_120': { icon: '⏱️', name: '120s' },
                'moves_20': { icon: '🎯', name: '20mov' },
                'moves_30': { icon: '🎯', name: '30mov' },
                'moves_50': { icon: '🎯', name: '50mov' },
                'adventure_easy': { icon: '🗺️', name: 'Easy' },
                'adventure_normal': { icon: '🗺️', name: 'Normal' },
                'adventure_hard': { icon: '🗺️', name: 'Hard' }
            };
            
            userScores.innerHTML = scores.map(s => {
                const info = modeInfo[s.mode] || { icon: '🎮', name: s.mode };
                return `
                    <div class="user-score-item">
                        <span class="mode-icon">${info.icon}</span>
                        <span class="mode-name">${info.name}</span>
                        <span class="mode-score">${s.score.toLocaleString()}</span>
                    </div>
                `;
            }).join('');
            
        } catch (e) {
            console.error('Error cargando scores del usuario:', e);
            userScores.innerHTML = '<span class="user-scores-empty">Error cargando puntajes</span>';
        }
    }
    
    async function init() {
        try {
            cacheElements();
            
            // Inicializar dificultad global (usa valor por defecto)
            initGlobalDifficulty();
            
            // Load saved data - usando 'tragamonedas' como prefijo
            state.soundEnabled = localStorage.getItem('tragamonedasSound') !== 'false';
            state.vibrationEnabled = localStorage.getItem('tragamonedasVibration') !== 'false';
            
            // Cargar progreso del usuario guardado (async para verificar si fue borrado)
            await loadUserProgress();
            
            // Actualizar display inicial de monedas
            updateCoinsDisplay();
            
            // Actualizar info del usuario
            updateUserInfo();
            
            // Menu buttons
            document.querySelectorAll('.menu-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const mode = btn.dataset.mode;
                    showModeSelection(mode);
                });
            });
            
            // Select screen back
            const selectBack = document.getElementById('select-back');
            if (selectBack) {
                selectBack.addEventListener('click', () => {
                    showScreen('menu-screen');
                });
            }
            
            // Game menu button
            const gameMenuBtn = document.getElementById('game-menu-btn');
            if (gameMenuBtn) {
                gameMenuBtn.addEventListener('click', pauseGame);
            }
            
            // Pause modal
            const resumeBtn = document.getElementById('resume-btn');
            const restartBtn = document.getElementById('restart-btn');
            const quitBtn = document.getElementById('quit-btn');
            const mobileQuitBtn = document.getElementById('mobile-quit-btn');
            
            if (resumeBtn) resumeBtn.addEventListener('click', resumeGame);
            if (restartBtn) restartBtn.addEventListener('click', restartGame);
            if (quitBtn) quitBtn.addEventListener('click', quitGame);
            if (mobileQuitBtn) mobileQuitBtn.addEventListener('click', quitGame);
            
            // Game over modal
            const gameoverRetry = document.getElementById('gameover-retry');
            const gameoverMenu = document.getElementById('gameover-menu');
            
            if (gameoverRetry) gameoverRetry.addEventListener('click', restartGame);
            if (gameoverMenu) gameoverMenu.addEventListener('click', quitGame);
            
            // Victory modal
            const nextLevelBtn = document.getElementById('next-level-btn');
            const victoryMenu = document.getElementById('victory-menu');
            
            if (nextLevelBtn) nextLevelBtn.addEventListener('click', nextLevel);
            if (victoryMenu) victoryMenu.addEventListener('click', quitGame);
            
            // ==========================================
            // COMODINES EN JUEGO - Event Listeners
            // ==========================================
            document.querySelectorAll('.powerup-btn').forEach(btn => {
                let longPressTimer = null;
                let isLongPress = false;
                
                // Click to use powerup
                btn.addEventListener('click', (e) => {
                    // If it was a long press, don't trigger use
                    if (isLongPress) {
                        isLongPress = false;
                        return;
                    }
                    const powerupType = btn.dataset.powerup;
                    if (powerupType && !state.gameOver && !state.paused) {
                        usePowerup(powerupType);
                    }
                });
                
                // Long press to show tooltip (mobile)
                btn.addEventListener('touchstart', (e) => {
                    isLongPress = false;
                    longPressTimer = setTimeout(() => {
                        isLongPress = true;
                        btn.classList.add('show-tooltip');
                        vibrate(30);
                    }, 500); // 500ms for long press
                }, { passive: true });
                
                btn.addEventListener('touchend', () => {
                    clearTimeout(longPressTimer);
                    // Hide tooltip after a delay
                    setTimeout(() => {
                        btn.classList.remove('show-tooltip');
                    }, isLongPress ? 2000 : 0);
                });
                
                btn.addEventListener('touchmove', () => {
                    clearTimeout(longPressTimer);
                    btn.classList.remove('show-tooltip');
                });
            });
            
            // Cancelar comodin activo con Escape o click fuera del tablero
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && state.activePowerup) {
                    cancelPowerup();
                }
            });
            
            // ==========================================
            // RANKING - Event Listeners
            // ==========================================
            const rankingMenuBtn = document.getElementById('ranking-menu-btn');
            const rankingClose = document.getElementById('ranking-close');
            
            if (rankingMenuBtn) {
                rankingMenuBtn.addEventListener('click', () => {
                    showModal('ranking-modal');
                    loadRanking('free');
                    // Ocultar subtabs de aventura por defecto
                    const adventureSubtabs = document.getElementById('adventure-subtabs');
                    if (adventureSubtabs) adventureSubtabs.style.display = 'none';
                });
            }
            
            if (rankingClose) {
                rankingClose.addEventListener('click', () => {
                    hideModal('ranking-modal');
                });
            }
            
            // Tabs principales del ranking
            document.querySelectorAll('.ranking-tabs .tab-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.ranking-tabs .tab-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    const tab = btn.dataset.tab;
                    const adventureSubtabs = document.getElementById('adventure-subtabs');
                    
                    if (tab === 'adventure') {
                        // Mostrar subtabs de dificultad
                        if (adventureSubtabs) adventureSubtabs.style.display = 'flex';
                        // Cargar ranking de la dificultad activa
                        const activeDiff = document.querySelector('.subtab-btn.active');
                        const difficulty = activeDiff ? activeDiff.dataset.difficulty : 'normal';
                        loadRanking('adventure', difficulty);
                    } else {
                        if (adventureSubtabs) adventureSubtabs.style.display = 'none';
                        loadRanking(tab);
                    }
                });
            });
            
            // Subtabs de dificultad para aventura
            document.querySelectorAll('.subtab-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.subtab-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    loadRanking('adventure', btn.dataset.difficulty);
                });
            });
            
            // ==========================================
            // USERNAME - Event Listeners
            // ==========================================
            const usernameBtn = document.getElementById('username-btn');
            const usernameInput = document.getElementById('username-input');
            const usernameSuggestions = document.getElementById('username-suggestions');
            
            // Funcion para mostrar sugerencias
            async function showUserSuggestions(search) {
                if (!usernameSuggestions) return;
                
                try {
                    const users = await getExistingUsers(search);
                    
                    if (users.length === 0) {
                        usernameSuggestions.classList.remove('active');
                        return;
                    }
                    
                    usernameSuggestions.innerHTML = users.slice(0, 5).map(u => `
                        <div class="username-suggestion" data-username="${u.username}">
                            <span class="name">${u.username}</span>
                            <span class="score">Mejor: ${u.bestScore.toLocaleString()}</span>
                        </div>
                    `).join('');
                    
                    usernameSuggestions.classList.add('active');
                    
                    // Click en sugerencia
                    usernameSuggestions.querySelectorAll('.username-suggestion').forEach(el => {
                        el.addEventListener('click', () => {
                            usernameInput.value = el.dataset.username;
                            usernameSuggestions.classList.remove('active');
                        });
                    });
                } catch (e) {
                    console.error('Error cargando sugerencias:', e);
                }
            }
            
            // Evento de input para buscar sugerencias
            if (usernameInput) {
                let debounceTimer;
                usernameInput.addEventListener('input', (e) => {
                    clearTimeout(debounceTimer);
                    const value = e.target.value.trim();
                    
                    if (value.length >= 1) {
                        debounceTimer = setTimeout(() => {
                            showUserSuggestions(value);
                        }, 300);
                    } else {
                        // Mostrar todos los usuarios si no hay texto
                        debounceTimer = setTimeout(() => {
                            showUserSuggestions('');
                        }, 300);
                    }
                });
                
                // Mostrar sugerencias al hacer focus
                usernameInput.addEventListener('focus', () => {
                    showUserSuggestions(usernameInput.value.trim());
                });
                
                // Ocultar sugerencias al hacer click fuera
                document.addEventListener('click', (e) => {
                    if (!e.target.closest('.username-input-container')) {
                        if (usernameSuggestions) usernameSuggestions.classList.remove('active');
                    }
                });
            }
            
            if (usernameBtn) {
                usernameBtn.addEventListener('click', async () => {
                    const input = document.getElementById('username-input');
                    const error = document.getElementById('username-error');
                    const value = input ? input.value.trim() : '';
                    
                    if (!/^[A-Za-z0-9]+$/.test(value)) {
                        if (error) error.textContent = 'Solo letras y numeros, sin espacios';
                        return;
                    }
                    
                    if (value.length < 2) {
                        if (error) error.textContent = 'Minimo 2 caracteres';
                        return;
                    }
                    
                    state.username = value;
                    localStorage.setItem('tragamonedasUsername', value);
                    
                    // Cargar progreso del usuario (async para verificar si fue borrado)
                    await loadUserProgress();
                    
                    // Actualizar display del username en settings
                    const currentUsername = document.getElementById('current-username');
                    if (currentUsername) currentUsername.textContent = value;
                    
                    // Actualizar info del usuario en menu principal
                    updateUserInfo();
                    
                    // Ocultar sugerencias
                    if (usernameSuggestions) usernameSuggestions.classList.remove('active');
                    
                    const usernameModal = document.getElementById('username-modal');
                    const pendingMode = usernameModal ? usernameModal.dataset.pendingMode : null;
                    hideModal('username-modal');
                    
                    if (pendingMode) {
                        showModeSelection(pendingMode);
                    }
                });
            }
            
            // ==========================================
            // SETTINGS - Event Listeners
            // ==========================================
            const settingsBtn = document.getElementById('settings-btn');
            const settingsClose = document.getElementById('settings-close');
            const soundToggle = document.getElementById('sound-toggle');
            const vibrationToggle = document.getElementById('vibration-toggle');
            const changeUsernameBtn = document.getElementById('change-username-btn');
            
            if (settingsBtn) {
                settingsBtn.addEventListener('click', () => {
                    if (soundToggle) soundToggle.checked = state.soundEnabled;
                    if (vibrationToggle) vibrationToggle.checked = state.vibrationEnabled;
                    
                    // Mostrar username actual
                    const currentUsername = document.getElementById('current-username');
                    if (currentUsername) currentUsername.textContent = state.username || '-';
                    
                    showModal('settings-modal');
                });
            }
            
            if (settingsClose) {
                settingsClose.addEventListener('click', () => {
                    hideModal('settings-modal');
                });
            }
            
            if (soundToggle) {
                soundToggle.addEventListener('change', (e) => {
                    state.soundEnabled = e.target.checked;
                    localStorage.setItem('tragamonedasSound', e.target.checked);
                });
            }
            
            if (vibrationToggle) {
                vibrationToggle.addEventListener('change', (e) => {
                    state.vibrationEnabled = e.target.checked;
                    localStorage.setItem('tragamonedasVibration', e.target.checked);
                });
            }
            
            // Cambiar username desde settings
            if (changeUsernameBtn) {
                changeUsernameBtn.addEventListener('click', () => {
                    hideModal('settings-modal');
                    const input = document.getElementById('username-input');
                    if (input) input.value = state.username || '';
                    const error = document.getElementById('username-error');
                    if (error) error.textContent = '';
                    showModal('username-modal');
                });
            }
            
            // Logout - Cerrar sesion
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async () => {
                    state.username = '';
                    localStorage.removeItem('tragamonedasUsername');
                    
                    // Limpiar progreso en memoria (no en storage)
                    await loadUserProgress(); // Carga valores por defecto
                    
                    // Actualizar display
                    const currentUsername = document.getElementById('current-username');
                    if (currentUsername) currentUsername.textContent = '-';
                    
                    // Ocultar info del usuario en menu
                    updateUserInfo();
                    
                    hideModal('settings-modal');
                    
                    // Mostrar modal de username
                    const input = document.getElementById('username-input');
                    if (input) input.value = '';
                    const error = document.getElementById('username-error');
                    if (error) error.textContent = '';
                    
                    setTimeout(() => {
                        showModal('username-modal');
                    }, 200);
                });
            }
            
            // ==========================================
            // INFO MODAL - Event Listeners
            // ==========================================
            const infoBtn = document.getElementById('info-btn');
            const infoClose = document.getElementById('info-close');
            
            if (infoBtn) {
                infoBtn.addEventListener('click', () => {
                    showModal('info-modal');
                    playSound('select');
                });
            }
            
            if (infoClose) {
                infoClose.addEventListener('click', () => {
                    hideModal('info-modal');
                });
            }
            
            // Tabs del modal de información
            document.querySelectorAll('.info-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    // Desactivar todas las tabs
                    document.querySelectorAll('.info-tab').forEach(t => t.classList.remove('active'));
                    document.querySelectorAll('.info-panel').forEach(p => p.classList.remove('active'));
                    
                    // Activar tab seleccionada
                    tab.classList.add('active');
                    const panelId = `panel-${tab.dataset.tab}`;
                    const panel = document.getElementById(panelId);
                    if (panel) panel.classList.add('active');
                    
                    playSound('select');
                });
            });
            
            // Prevent scrolling on game board
            document.body.addEventListener('touchmove', (e) => {
                if (e.target.closest('#game-board')) {
                    e.preventDefault();
                }
            }, { passive: false });
            
            // Inicializar AudioContext con la primera interaccion del usuario
            const initAudioOnInteraction = () => {
                initAudio();
                document.removeEventListener('click', initAudioOnInteraction);
                document.removeEventListener('touchstart', initAudioOnInteraction);
            };
            document.addEventListener('click', initAudioOnInteraction);
            document.addEventListener('touchstart', initAudioOnInteraction);
            
            // Show menu - o pedir username si no existe
            showScreen('menu-screen');
            
            // Cargar ranking compacto al iniciar
            loadCompactRanking();
            
            // Verificar si hay datos pendientes de sincronizar
            checkPendingSync();
            
            // Event listener para botón de sincronización
            const syncBtn = document.getElementById('sync-btn');
            if (syncBtn) {
                syncBtn.addEventListener('click', forceSync);
            }
            
            // Escuchar cambios de conexión para intentar sincronizar automáticamente
            window.addEventListener('online', () => {
                console.log('Conexion restaurada');
                if (syncPending && state.username) {
                    // Intentar sincronizar automáticamente al volver online
                    forceSync();
                }
            });
            
            window.addEventListener('offline', () => {
                console.log('Sin conexion - modo offline');
            });
            
            // Si no hay username guardado, pedir al inicio
            if (!state.username) {
                setTimeout(() => {
                    showModal('username-modal');
                }, 300);
            }
            
            console.log('Tuti Fruti inicializado correctamente');
            
            // Iniciar tracking de sesion
            startSessionTracking();
            
        } catch (error) {
            console.error('Error inicializando el juego:', error);
        }
    }

    // ==========================================
    // TRACKING DE TIEMPO DE USO
    // ==========================================
    let sessionStartTime = Date.now();
    let lastHeartbeat = Date.now();
    const HEARTBEAT_INTERVAL = 60000; // 1 minuto
    
    function startSessionTracking() {
        sessionStartTime = Date.now();
        lastHeartbeat = Date.now();
        
        // Registrar inicio de sesion
        if (state.username) {
            sendStats('start');
        }
        
        // Enviar heartbeat cada minuto
        setInterval(() => {
            if (state.username) {
                const now = Date.now();
                const duration = now - lastHeartbeat;
                lastHeartbeat = now;
                sendStats('heartbeat', null, duration);
            }
        }, HEARTBEAT_INTERVAL);
        
        // Enviar stats al cerrar la pagina
        window.addEventListener('beforeunload', () => {
            if (state.username) {
                const duration = Date.now() - lastHeartbeat;
                // Use API_URL from pocketbase-api.js if available
                const apiUrl = typeof API_URL !== 'undefined' ? API_URL : '/api';
                // Usar sendBeacon para enviar antes de cerrar
                const data = JSON.stringify({
                    username: state.username,
                    action: 'end',
                    duration: duration
                });
                navigator.sendBeacon(`${apiUrl}/stats/session`, data);
            }
        });
        
        // Detectar cambio de visibilidad (minimizar, cambiar tab)
        document.addEventListener('visibilitychange', () => {
            if (state.username) {
                if (document.hidden) {
                    // Pausar tracking
                    const duration = Date.now() - lastHeartbeat;
                    sendStats('heartbeat', null, duration);
                    lastHeartbeat = Date.now();
                } else {
                    // Reanudar tracking
                    lastHeartbeat = Date.now();
                }
            }
        });
    }
    
    function sendStats(action, mode = null, duration = null) {
        if (!state.username) return;
        
        const data = {
            username: state.username,
            action: action
        };
        
        if (mode) data.mode = mode;
        if (duration) data.duration = duration;
        
        // Use API_URL from pocketbase-api.js if available, otherwise use relative path
        const apiUrl = typeof API_URL !== 'undefined' ? API_URL : '/api';
        
        fetch(`${apiUrl}/stats/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).catch(e => console.log('Stats error:', e));
    }
    
    // Funcion para registrar partida jugada
    function trackGamePlayed(mode) {
        sendStats('game', mode);
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
