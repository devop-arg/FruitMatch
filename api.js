/**
 * FruitMatch - API Client
 * Developed by DevCatanzaro
 * 
 * Backend: Node.js + Express
 */

// API URL - Change this to your server URL
const API_URL = window.location.origin + "/api";

/**
 * Submit or update user score for a specific mode
 * Only updates if the new score is higher
 * @param {Object} data - {username, score, mode, level, lines}
 * @returns {Object} - {record, ranking: {position, isNewPersonalBest, previousBest, isInTop10, totalPlayers}}
 */
async function submitScorePocketBase({username, score, mode = 'free', level = 0, lines = 0}) {
    try {
        const res = await fetch(`${API_URL}/scores`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ username, score, mode, level, lines })
        });
        
        if (!res.ok) {
            console.error('Error saving score:', await res.text());
            return null;
        }
        
        const data = await res.json();
        console.log(`Score saved: ${username} - ${mode} - ${score}`, data);
        return data;
    } catch (e) {
        console.error('Error in submitScorePocketBase:', e);
        return null;
    }
}

/**
 * Get ranking from API
 * @param {number} limit - number of results
 * @param {string} mode - game mode ('all' for global)
 */
async function getTopScoresPocketBase(limit = 10, mode = 'all') {
    try {
        const params = new URLSearchParams({ limit });
        if (mode && mode !== 'all') {
            params.append('mode', mode);
        }
        
        const res = await fetch(`${API_URL}/scores?${params}`);
        
        if (!res.ok) {
            console.error('Error getting ranking:', await res.text());
            return [];
        }
        
        const data = await res.json();
        return data.scores || [];
    } catch (e) {
        console.error('Error in getTopScoresPocketBase:', e);
        return [];
    }
}

/**
 * Get user stats
 * @param {string} username
 */
async function getUserStatsPocketBase(username) {
    try {
        const res = await fetch(`${API_URL}/stats/${encodeURIComponent(username)}`);
        
        if (!res.ok) {
            return null;
        }
        
        return await res.json();
    } catch (e) {
        console.error('Error in getUserStatsPocketBase:', e);
        return null;
    }
}

/**
 * Update user stats
 * @param {string} username
 * @param {Object} stats
 */
async function updateUserStatsPocketBase(username, stats) {
    try {
        const res = await fetch(`${API_URL}/stats/${encodeURIComponent(username)}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(stats)
        });
        
        if (!res.ok) {
            console.error('Error updating stats:', await res.text());
            return null;
        }
        
        return await res.json();
    } catch (e) {
        console.error('Error in updateUserStatsPocketBase:', e);
        return null;
    }
}

/**
 * Get user progress (adventure mode)
 * @param {string} username
 */
async function getUserProgressPocketBase(username) {
    try {
        const res = await fetch(`${API_URL}/progress/${encodeURIComponent(username)}`);
        
        if (!res.ok) {
            return null;
        }
        
        return await res.json();
    } catch (e) {
        console.error('Error in getUserProgressPocketBase:', e);
        return null;
    }
}

/**
 * Save user progress (adventure mode)
 * @param {string} username
 * @param {Object} progress
 */
async function saveUserProgressPocketBase(username, progress) {
    try {
        const res = await fetch(`${API_URL}/progress/${encodeURIComponent(username)}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(progress)
        });
        
        if (!res.ok) {
            console.error('Error saving progress:', await res.text());
            return null;
        }
        
        return await res.json();
    } catch (e) {
        console.error('Error in saveUserProgressPocketBase:', e);
        return null;
    }
}

/**
 * Log game event
 * @param {string} username
 * @param {string} eventType
 * @param {Object} eventData
 */
async function logGameEvent(username, eventType, eventData) {
    try {
        const res = await fetch(`${API_URL}/logs/${encodeURIComponent(username)}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ eventType, eventData })
        });
        
        if (!res.ok) {
            console.error('Error logging event:', await res.text());
            return null;
        }
        
        return await res.json();
    } catch (e) {
        console.error('Error in logGameEvent:', e);
        return null;
    }
}

/**
 * Get existing usernames (for suggestions)
 */
async function getExistingUsernames() {
    try {
        const res = await fetch(`${API_URL}/usernames`);
        
        if (!res.ok) {
            return [];
        }
        
        const data = await res.json();
        return data.usernames || [];
    } catch (e) {
        console.error('Error in getExistingUsernames:', e);
        return [];
    }
}
