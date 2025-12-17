/**
 * FruitMatch - Internationalization (i18n) System
 * Developed by DevCatanzaro
 * 
 * Supports: English (en), Spanish (es)
 */

const TRANSLATIONS = {
    en: {
        // Game title and tagline
        title: "FruitMatch",
        tagline: "The Lucky Match-3",
        
        // Menu
        menu: {
            hello: "Hello,",
            syncData: "Sync data",
            freePlay: "Free Play",
            freePlayDesc: "No limits, just fun",
            timed: "Timed Mode",
            timedDesc: "Max score in limited time",
            moves: "Moves",
            movesDesc: "Strategy with limited moves",
            adventure: "Adventure",
            adventureDesc: "30 levels - 3 difficulties",
            info: "Info",
            top3: "Top 3",
            free: "Free",
            clock: "Timed",
            movesShort: "Moves",
            adventureShort: "Advent."
        },
        
        // Selection screen
        select: {
            title: "Select",
            back: "← Back",
            seconds: "seconds",
            movesLabel: "moves",
            selectDifficulty: "Select Difficulty",
            easy: "Easy",
            normal: "Normal",
            hard: "Hard",
            selectLevel: "Select Level",
            level: "Level",
            locked: "Locked"
        },
        
        // Game screen
        game: {
            score: "Score",
            points: "Points",
            objective: "Objective",
            matches: "Matches",
            quit: "Quit",
            shuffle: "Shuffle",
            bomb: "Bomb",
            time: "+60s",
            extraMoves: "+20 Mov"
        },
        
        // Powerup tooltips
        powerups: {
            shuffleTooltip: "Shuffles the board without creating matches. Useful when no moves are available.",
            bombTooltip: "Destroys a 4x4 area. Tap where you want to explode.",
            timeTooltip: "Adds +60 seconds to the time bank. Only available in timed levels.",
            movesTooltip: "Adds +20 extra moves. Only available in modes with limited moves."
        },
        
        // Pause modal
        pause: {
            title: "⏸️ Paused",
            score: "Score:",
            coins: "Coins:",
            resume: "▶️ Resume",
            restart: "🔄 Restart",
            quit: "🚪 Quit"
        },
        
        // Game over modal
        gameover: {
            title: "Game Over",
            score: "Score",
            bestCombo: "Best Combo",
            matches: "Matches",
            coinsEarned: "💰 Coins earned",
            retry: "🔄 Retry",
            menu: "🏠 Menu",
            newRecord: "🎉 New Record!",
            position: "Position #{pos} of {total}"
        },
        
        // Victory modal
        victory: {
            title: "Level Complete!",
            score: "Score",
            coinsEarned: "💰 Coins earned",
            nextLevel: "▶️ Next Level",
            menu: "🏠 Menu"
        },
        
        // Ranking modal
        ranking: {
            title: "🏆 Global Ranking",
            free: "Free",
            timed: "Timed",
            moves: "Moves",
            adventure: "Adventure",
            easy: "Easy",
            normal: "Normal",
            hard: "Hard",
            player: "Player",
            points: "Points",
            close: "Close"
        },
        
        // Username modal
        username: {
            welcome: "Welcome!",
            enterName: "Enter your name for the ranking:",
            placeholder: "Your name...",
            play: "Let's Play!",
            errorEmpty: "Please enter a name",
            errorShort: "Name must be at least 2 characters",
            errorInvalid: "Name can only contain letters and numbers"
        },
        
        // Settings modal
        settings: {
            title: "⚙️ Settings",
            sound: "Sound",
            vibration: "Vibration",
            player: "Player:",
            change: "Change",
            logout: "Logout",
            close: "Close"
        },
        
        // Info modal
        info: {
            title: "ℹ️ How to Play",
            tabModes: "Modes",
            tabPoints: "Points",
            tabBonus: "Bonus",
            tabPowerups: "Powerups",
            
            // Modes
            freePlayTitle: "Free Play",
            freePlayDesc: "No time or move limits. Play relaxed and practice your strategies.",
            timedTitle: "Timed Mode",
            timedDesc: "Get the maximum score before time runs out. Choose between 60, 90, or 120 seconds.",
            movesTitle: "Moves",
            movesDesc: "You have a limited number of moves. Every move counts! Choose between 20, 30, or 50 moves.",
            adventureTitle: "Adventure",
            adventureDesc: "30 levels with unique objectives in 3 difficulties. Complete missions like scoring points, making combos, or getting jackpots.",
            
            // Points
            pointsTitle: "Points per Symbol",
            cherry: "Cherry",
            watermelon: "Watermelon",
            grape: "Grape",
            lemon: "Lemon",
            diamond: "Diamond",
            clover: "Clover",
            seven: "Seven",
            comboNote: "Combos: Chaining consecutive matches multiplies your points. A x3 combo triples the points!",
            
            // Bonus
            bonusTitle: "Special Bonuses",
            coinsTitle: "Coins",
            coinsDesc: "Appear randomly on the board. Collect them by matching those cells.",
            match5Title: "Match of 5+",
            match5Desc: "Matching 5 or more pieces gives you 5 bonus coins!",
            jackpotTitle: "Triple 7 Jackpot",
            jackpotDesc: "Match 3 or more sevens:",
            jackpot3: "3 sevens: +777 pts, x2 for 3 moves",
            jackpot4: "4 sevens: +1,777 pts, x3 for 4 moves",
            jackpot5: "5+ sevens: +7,777 pts, x5 for 5 moves",
            frozenTitle: "Frozen Cells",
            frozenDesc: "In Adventure mode, penguins trapped in ice appear. Make adjacent matches to free them.",
            
            // Powerups
            powerupsTitle: "Powerups",
            powerupsSubtitle: "Buy powerups with the coins you collect.",
            shuffleTitle: "Shuffle",
            shuffleDesc: "Reorganizes the entire board without creating matches. Use it when you have no available moves.",
            bombTitle: "Bomb",
            bombDesc: "Destroys a 4x4 area. Perfect for clearing problematic zones or breaking ice.",
            extraTimeTitle: "+60 Seconds",
            extraTimeDesc: "Adds 60 seconds to your time bank. Only works in timed modes.",
            extraMovesTitle: "+20 Moves",
            extraMovesDesc: "Adds 20 extra moves. Only works in modes with limited moves.",
            powerupTip: "Tip: Collect coins in easy levels to have powerups available in difficult levels."
        },
        
        // Rescue modals
        rescue: {
            noMoves: "No Valid Moves!",
            noMovesDesc: "The board has no possible moves.",
            shuffleFree: "🔀 Free Shuffle",
            outOfMoves: "Out of Moves!",
            outOfMovesDesc: "You've used all your moves.",
            buy20Moves: "🎯 Buy +20 Moves",
            outOfTime: "Time's Up!",
            outOfTimeDesc: "The timer has reached zero.",
            buy60Seconds: "+60 Seconds",
            cost: "Cost:",
            useCredit: "Use credit",
            endGame: "End Game"
        },
        
        // Objectives (Adventure mode)
        objectives: {
            score: "Score {target} points",
            collect: "Collect {target} {symbol}",
            jackpots: "Get {target} jackpots",
            coins: "Collect {target} coins",
            frozen: "Free {target} animals",
            penguins: "Free {target} penguins",
            chicks: "Free {target} chicks",
            combos: "Make {target} combos"
        },
        
        // Misc
        misc: {
            loading: "Loading...",
            error: "Error",
            success: "Success",
            confirm: "Confirm",
            cancel: "Cancel",
            yes: "Yes",
            no: "No",
            ok: "OK"
        }
    },
    
    es: {
        // Título y eslogan
        title: "FruitMatch",
        tagline: "El Match-3 de la Suerte",
        
        // Menú
        menu: {
            hello: "Hola,",
            syncData: "Sincronizar datos",
            freePlay: "Juego Libre",
            freePlayDesc: "Sin límites, solo diversión",
            timed: "Contra Reloj",
            timedDesc: "Máximo puntaje en tiempo límite",
            moves: "Movimientos",
            movesDesc: "Estrategia con movimientos limitados",
            adventure: "Aventura",
            adventureDesc: "30 niveles - 3 dificultades",
            info: "Info",
            top3: "Top 3",
            free: "Libre",
            clock: "Reloj",
            movesShort: "Movim.",
            adventureShort: "Advent."
        },
        
        // Pantalla de selección
        select: {
            title: "Seleccionar",
            back: "← Volver",
            seconds: "segundos",
            movesLabel: "movimientos",
            selectDifficulty: "Seleccionar Dificultad",
            easy: "Fácil",
            normal: "Normal",
            hard: "Difícil",
            selectLevel: "Seleccionar Nivel",
            level: "Nivel",
            locked: "Bloqueado"
        },
        
        // Pantalla de juego
        game: {
            score: "Puntos",
            points: "Puntos",
            objective: "Objetivo",
            matches: "Matches",
            quit: "Salir",
            shuffle: "Mezclar",
            bomb: "Bomba",
            time: "+60s",
            extraMoves: "+20 Mov"
        },
        
        // Tooltips de powerups
        powerups: {
            shuffleTooltip: "Mezcla el tablero sin crear matches. Útil cuando no hay jugadas disponibles.",
            bombTooltip: "Elimina un área de 4x4 celdas. Toca donde quieras explotar.",
            timeTooltip: "Agrega +60 segundos al banco de tiempo. Solo disponible en niveles con límite de tiempo.",
            movesTooltip: "Agrega +20 movimientos extra. Solo disponible en modos con movimientos limitados."
        },
        
        // Modal de pausa
        pause: {
            title: "⏸️ Pausa",
            score: "Puntos:",
            coins: "Monedas:",
            resume: "▶️ Continuar",
            restart: "🔄 Reiniciar",
            quit: "🚪 Salir"
        },
        
        // Modal de fin de juego
        gameover: {
            title: "Fin del Juego",
            score: "Puntuación",
            bestCombo: "Mejor Combo",
            matches: "Matches",
            coinsEarned: "💰 Monedas ganadas",
            retry: "🔄 Reintentar",
            menu: "🏠 Menú",
            newRecord: "🎉 ¡Nuevo Récord!",
            position: "Posición #{pos} de {total}"
        },
        
        // Modal de victoria
        victory: {
            title: "¡Nivel Completado!",
            score: "Puntuación",
            coinsEarned: "💰 Monedas ganadas",
            nextLevel: "▶️ Siguiente Nivel",
            menu: "🏠 Menú"
        },
        
        // Modal de ranking
        ranking: {
            title: "🏆 Ranking Global",
            free: "Libre",
            timed: "Reloj",
            moves: "Movim.",
            adventure: "Aventura",
            easy: "Fácil",
            normal: "Normal",
            hard: "Difícil",
            player: "Jugador",
            points: "Puntos",
            close: "Cerrar"
        },
        
        // Modal de usuario
        username: {
            welcome: "¡Bienvenido!",
            enterName: "Ingresa tu nombre para el ranking:",
            placeholder: "Tu nombre...",
            play: "¡A Jugar!",
            errorEmpty: "Por favor ingresa un nombre",
            errorShort: "El nombre debe tener al menos 2 caracteres",
            errorInvalid: "El nombre solo puede contener letras y números"
        },
        
        // Modal de configuración
        settings: {
            title: "⚙️ Opciones",
            sound: "Sonido",
            vibration: "Vibración",
            player: "Jugador:",
            change: "Cambiar",
            logout: "Salir",
            close: "Cerrar"
        },
        
        // Modal de información
        info: {
            title: "ℹ️ Cómo Jugar",
            tabModes: "Modos",
            tabPoints: "Puntos",
            tabBonus: "Bonus",
            tabPowerups: "Comodines",
            
            // Modos
            freePlayTitle: "Juego Libre",
            freePlayDesc: "Sin límites de tiempo ni movimientos. Juega relajado y practica tus estrategias.",
            timedTitle: "Contra Reloj",
            timedDesc: "Consigue el máximo puntaje antes de que se acabe el tiempo. Elige entre 60, 90 o 120 segundos.",
            movesTitle: "Movimientos",
            movesDesc: "Tienes un número limitado de movimientos. ¡Cada jugada cuenta! Elige entre 20, 30 o 50 movimientos.",
            adventureTitle: "Aventura",
            adventureDesc: "30 niveles con objetivos únicos en 3 dificultades. Completa misiones como juntar puntos, hacer combos o conseguir jackpots.",
            
            // Puntos
            pointsTitle: "Puntos por Símbolo",
            cherry: "Cereza",
            watermelon: "Sandía",
            grape: "Uva",
            lemon: "Limón",
            diamond: "Diamante",
            clover: "Trébol",
            seven: "Siete",
            comboNote: "Combos: Encadenar matches consecutivos multiplica tus puntos. ¡Un combo x3 triplica los puntos!",
            
            // Bonus
            bonusTitle: "Bonus Especiales",
            coinsTitle: "Monedas",
            coinsDesc: "Aparecen aleatoriamente en el tablero. Recógelas haciendo match en esas celdas.",
            match5Title: "Match de 5+",
            match5Desc: "¡Hacer match de 5 o más piezas te da 5 monedas bonus!",
            jackpotTitle: "Jackpot Triple 7",
            jackpotDesc: "Junta 3 o más sietes en un match:",
            jackpot3: "3 sietes: +777 pts, x2 por 3 jugadas",
            jackpot4: "4 sietes: +1,777 pts, x3 por 4 jugadas",
            jackpot5: "5+ sietes: +7,777 pts, x5 por 5 jugadas",
            frozenTitle: "Celdas Congeladas",
            frozenDesc: "En modo Aventura aparecen pingüinos atrapados en hielo. Haz matches adyacentes para liberarlos.",
            
            // Powerups
            powerupsTitle: "Comodines (Powerups)",
            powerupsSubtitle: "Compra comodines con las monedas que recolectes.",
            shuffleTitle: "Mezclar",
            shuffleDesc: "Reorganiza todo el tablero sin crear matches. Úsalo cuando no tengas jugadas disponibles.",
            bombTitle: "Bomba",
            bombDesc: "Elimina un área de 4x4 celdas. Perfecto para limpiar zonas problemáticas o romper hielo.",
            extraTimeTitle: "+60 Segundos",
            extraTimeDesc: "Agrega 60 segundos a tu banco de tiempo. Solo funciona en modos con tiempo.",
            extraMovesTitle: "+20 Movimientos",
            extraMovesDesc: "Agrega 20 movimientos extra. Solo funciona en modos con movimientos limitados.",
            powerupTip: "Tip: Junta monedas en niveles fáciles para tener comodines disponibles en los niveles difíciles."
        },
        
        // Modales de rescate
        rescue: {
            noMoves: "¡Sin Jugadas Válidas!",
            noMovesDesc: "El tablero no tiene movimientos posibles.",
            shuffleFree: "🔀 Mezclar Gratis",
            outOfMoves: "¡Sin Movimientos!",
            outOfMovesDesc: "Has usado todos tus movimientos.",
            buy20Moves: "🎯 Comprar +20 Mov",
            outOfTime: "¡Se Acabó el Tiempo!",
            outOfTimeDesc: "El temporizador llegó a cero.",
            buy60Seconds: "+60 Segundos",
            cost: "Costo:",
            useCredit: "Usar crédito",
            endGame: "Terminar Juego"
        },
        
        // Objetivos (Modo Aventura)
        objectives: {
            score: "Consigue {target} puntos",
            collect: "Recolecta {target} {symbol}",
            jackpots: "Consigue {target} jackpots",
            coins: "Recolecta {target} monedas",
            frozen: "Libera {target} animales",
            penguins: "Libera {target} pingüinos",
            chicks: "Libera {target} pollitos",
            combos: "Haz {target} combos"
        },
        
        // Misc
        misc: {
            loading: "Cargando...",
            error: "Error",
            success: "Éxito",
            confirm: "Confirmar",
            cancel: "Cancelar",
            yes: "Sí",
            no: "No",
            ok: "OK"
        }
    }
};

// Current language
let currentLang = 'en';

/**
 * Detect browser language and set default
 */
function detectLanguage() {
    const saved = localStorage.getItem('fruitmatch_lang');
    if (saved && TRANSLATIONS[saved]) {
        return saved;
    }
    
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang.startsWith('es')) {
        return 'es';
    }
    return 'en';
}

/**
 * Get translation by key path (e.g., "menu.freePlay")
 * @param {string} key - Dot-separated key path
 * @param {object} params - Optional parameters for interpolation
 * @returns {string} - Translated string
 */
function t(key, params = {}) {
    const keys = key.split('.');
    let value = TRANSLATIONS[currentLang];
    
    for (const k of keys) {
        if (value && value[k] !== undefined) {
            value = value[k];
        } else {
            // Fallback to English
            value = TRANSLATIONS['en'];
            for (const k2 of keys) {
                if (value && value[k2] !== undefined) {
                    value = value[k2];
                } else {
                    return key; // Return key if not found
                }
            }
            break;
        }
    }
    
    // Interpolate parameters
    if (typeof value === 'string' && Object.keys(params).length > 0) {
        for (const [param, val] of Object.entries(params)) {
            value = value.replace(new RegExp(`{${param}}`, 'g'), val);
        }
    }
    
    return value;
}

/**
 * Set language and update UI
 * @param {string} lang - Language code ('en' or 'es')
 */
function setLanguage(lang) {
    if (!TRANSLATIONS[lang]) {
        console.warn(`Language "${lang}" not supported, falling back to English`);
        lang = 'en';
    }
    
    currentLang = lang;
    localStorage.setItem('fruitmatch_lang', lang);
    
    // Update HTML lang attribute
    document.documentElement.lang = lang;
    
    // Update all elements with data-i18n attribute
    updateAllTranslations();
    
    // Update language selector button
    updateLangButton();
    
    // Dispatch event for dynamic content
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
}

/**
 * Update all elements with data-i18n attribute
 */
function updateAllTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = t(key);
        
        // Check if it's an attribute or text content
        const attr = el.getAttribute('data-i18n-attr');
        if (attr) {
            el.setAttribute(attr, translation);
        } else {
            el.textContent = translation;
        }
    });
    
    // Update elements with data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t(key);
    });
    
    // Update elements with data-i18n-tooltip
    document.querySelectorAll('[data-i18n-tooltip]').forEach(el => {
        const key = el.getAttribute('data-i18n-tooltip');
        el.setAttribute('data-tooltip', t(key));
    });
}

/**
 * Update language selector button
 */
function updateLangButton() {
    const btn = document.getElementById('lang-btn');
    if (btn) {
        btn.textContent = currentLang === 'en' ? '🇺🇸' : '🇪🇸';
        btn.title = currentLang === 'en' ? 'Switch to Spanish' : 'Cambiar a Inglés';
    }
}

/**
 * Toggle between languages
 */
function toggleLanguage() {
    const newLang = currentLang === 'en' ? 'es' : 'en';
    setLanguage(newLang);
}

/**
 * Get current language
 * @returns {string} - Current language code
 */
function getCurrentLang() {
    return currentLang;
}

// Initialize language on load
document.addEventListener('DOMContentLoaded', () => {
    currentLang = detectLanguage();
    updateAllTranslations();
    updateLangButton();
});
