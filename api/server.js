const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3777;
const DATA_FILE = path.join(__dirname, 'data', 'scores.json');
const STATS_FILE = path.join(__dirname, 'data', 'stats.json');
const DELETED_USERS_FILE = path.join(__dirname, 'data', 'deleted_users.json');
const PROGRESS_FILE = path.join(__dirname, 'data', 'progress.json');
const LOGS_FILE = path.join(__dirname, 'data', 'gamelogs.json');

// Log configuration
const MAX_SESSIONS_PER_USER = 50;

// Admin credentials (in production use environment variables)
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin';

// Active session tokens (in memory)
const activeSessions = new Map();

// Middleware
app.use(express.json());

// CORS to allow requests from the game
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token');
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, PATCH, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Middleware to verify admin with token
function requireAdmin(req, res, next) {
    const token = req.headers['x-admin-token'];
    if (!token || !activeSessions.has(token)) {
        return res.status(403).json({ error: 'Access denied' });
    }
    // Renew token expiration
    const session = activeSessions.get(token);
    session.expires = Date.now() + 3600000; // 1 more hour
    next();
}

// Clean expired sessions every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [token, session] of activeSessions) {
        if (session.expires < now) {
            activeSessions.delete(token);
        }
    }
}, 300000);

// Ensure data directory and files exist
function ensureDataFiles() {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify({ scores: [] }, null, 2));
    }
    if (!fs.existsSync(STATS_FILE)) {
        fs.writeFileSync(STATS_FILE, JSON.stringify({ users: {} }, null, 2));
    }
    if (!fs.existsSync(DELETED_USERS_FILE)) {
        fs.writeFileSync(DELETED_USERS_FILE, JSON.stringify({ deleted: [] }, null, 2));
    }
    if (!fs.existsSync(PROGRESS_FILE)) {
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ users: {} }, null, 2));
    }
    if (!fs.existsSync(LOGS_FILE)) {
        fs.writeFileSync(LOGS_FILE, JSON.stringify({ users: {} }, null, 2));
    }
}

// Read deleted users
function readDeletedUsers() {
    ensureDataFiles();
    try {
        const data = fs.readFileSync(DELETED_USERS_FILE, 'utf8');
        return JSON.parse(data).deleted || [];
    } catch (e) {
        return [];
    }
}

// Add user to deleted list
function addDeletedUser(username) {
    ensureDataFiles();
    const deleted = readDeletedUsers();
    if (!deleted.includes(username.toLowerCase())) {
        deleted.push(username.toLowerCase());
        fs.writeFileSync(DELETED_USERS_FILE, JSON.stringify({ deleted }, null, 2));
    }
}

// Remove user from deleted list (if re-registered)
function removeDeletedUser(username) {
    ensureDataFiles();
    let deleted = readDeletedUsers();
    deleted = deleted.filter(u => u !== username.toLowerCase());
    fs.writeFileSync(DELETED_USERS_FILE, JSON.stringify({ deleted }, null, 2));
}

// Read scores
function readScores() {
    ensureDataFiles();
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data).scores || [];
    } catch (e) {
        console.error('Error reading scores:', e);
        return [];
    }
}

// Save scores
function saveScores(scores) {
    ensureDataFiles();
    fs.writeFileSync(DATA_FILE, JSON.stringify({ scores }, null, 2));
}

// Read statistics
function readStats() {
    ensureDataFiles();
    try {
        const data = fs.readFileSync(STATS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        console.error('Error reading stats:', e);
        return { users: {} };
    }
}

// Save statistics
function saveStats(stats) {
    ensureDataFiles();
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
}

// Read user progress
function readProgress() {
    ensureDataFiles();
    try {
        const data = fs.readFileSync(PROGRESS_FILE, 'utf8');
        return JSON.parse(data).users || {};
    } catch (e) {
        console.error('Error reading progress:', e);
        return {};
    }
}

// Save user progress
function saveProgress(users) {
    ensureDataFiles();
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ users }, null, 2));
}

// Read game logs
function readGameLogs() {
    ensureDataFiles();
    try {
        const data = fs.readFileSync(LOGS_FILE, 'utf8');
        return JSON.parse(data).users || {};
    } catch (e) {
        console.error('Error reading gamelogs:', e);
        return {};
    }
}

// Save game logs
function saveGameLogs(users) {
    ensureDataFiles();
    fs.writeFileSync(LOGS_FILE, JSON.stringify({ users }, null, 2));
}

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

// GET /scores - Get ranking
app.get('/scores', (req, res) => {
    try {
        const { mode, limit = 10 } = req.query;
        let scores = readScores();
        
        if (mode && mode !== 'all') {
            // Support for modes with variants (timed, moves)
            // Si mode es 'timed' o 'moves', search all starting with that prefix
            if (mode === 'timed' || mode === 'moves') {
                scores = scores.filter(s => s.mode && s.mode.startsWith(mode));
            } else {
                scores = scores.filter(s => s.mode === mode);
            }
        }
        
        scores = scores
            .sort((a, b) => b.score - a.score)
            .slice(0, parseInt(limit));
        
        res.json({ items: scores });
    } catch (e) {
        console.error('Error GET /scores:', e);
        res.status(500).json({ error: 'Internal error' });
    }
});

// POST /scores - Save score
app.post('/scores', (req, res) => {
    try {
        const { username, score, mode = 'free', level = 0, lines = 0 } = req.body;
        
        if (!username || typeof score !== 'number') {
            return res.status(400).json({ error: 'username and score required' });
        }
        
        let scores = readScores();
        
        const existingIndex = scores.findIndex(
            s => s.username === username && s.mode === mode
        );
        
        const newRecord = {
            username,
            score,
            mode,
            level,
            lines,
            timestamp: new Date().toISOString()
        };
        
        let isNewPersonalBest = false;
        let previousBest = 0;
        
        if (existingIndex >= 0) {
            previousBest = scores[existingIndex].score;
            if (score > scores[existingIndex].score) {
                scores[existingIndex] = newRecord;
                saveScores(scores);
                isNewPersonalBest = true;
            }
        } else {
            scores.push(newRecord);
            saveScores(scores);
            isNewPersonalBest = true;
        }
        
        // Calculate ranking position for this mode
        const modeScores = scores
            .filter(s => s.mode === mode)
            .sort((a, b) => b.score - a.score);
        
        const rankingPosition = modeScores.findIndex(s => s.username === username) + 1;
        const totalPlayers = modeScores.length;
        const isInTop10 = rankingPosition <= 10;
        
        // Calculate position this specific score would have (not the best saved)
        const scoreRank = modeScores.filter(s => s.score > score).length + 1;
        
        res.json({ 
            updated: isNewPersonalBest && existingIndex >= 0,
            created: isNewPersonalBest && existingIndex < 0,
            record: isNewPersonalBest ? newRecord : scores[existingIndex],
            ranking: {
                position: rankingPosition,
                scorePosition: scoreRank,  // Posición de este score específico
                totalPlayers,
                isNewPersonalBest,
                previousBest,
                isInTop10
            }
        });
    } catch (e) {
        console.error('Error POST /scores:', e);
        res.status(500).json({ error: 'Internal error' });
    }
});

// GET /scores/:username - Get scores for a user
app.get('/scores/:username', (req, res) => {
    try {
        const { username } = req.params;
        const { mode } = req.query;
        
        let scores = readScores().filter(s => s.username === username);
        
        if (mode) {
            scores = scores.filter(s => s.mode === mode);
        }
        
        res.json({ items: scores.sort((a, b) => b.score - a.score) });
    } catch (e) {
        console.error('Error GET /scores/:username:', e);
        res.status(500).json({ error: 'Internal error' });
    }
});

// GET /users - Get list of users
app.get('/users', (req, res) => {
    try {
        const { search } = req.query;
        const scores = readScores();
        
        const usersMap = {};
        for (const s of scores) {
            if (!usersMap[s.username] || s.score > usersMap[s.username].bestScore) {
                usersMap[s.username] = {
                    username: s.username,
                    bestScore: s.score
                };
            }
        }
        
        let users = Object.values(usersMap);
        
        if (search) {
            const searchLower = search.toLowerCase();
            users = users.filter(u => u.username.toLowerCase().includes(searchLower));
        }
        
        users.sort((a, b) => b.bestScore - a.bestScore);
        
        res.json({ users });
    } catch (e) {
        console.error('Error GET /users:', e);
        res.status(500).json({ error: 'Internal error' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /user/status/:username - Check if a user was deleted
app.get('/user/status/:username', (req, res) => {
    try {
        const { username } = req.params;
        const deleted = readDeletedUsers();
        const wasDeleted = deleted.includes(username.toLowerCase());
        res.json({ username, wasDeleted });
    } catch (e) {
        console.error('Error GET /user/status:', e);
        res.status(500).json({ error: 'Internal error' });
    }
});

// POST /user/acknowledge-reset/:username - User acknowledges reset
app.post('/user/acknowledge-reset/:username', (req, res) => {
    try {
        const { username } = req.params;
        removeDeletedUser(username);
        res.json({ success: true });
    } catch (e) {
        console.error('Error POST /user/acknowledge-reset:', e);
        res.status(500).json({ error: 'Internal error' });
    }
});

// ==========================================
// USER PROGRESS (coins, powerups, levels)
// ==========================================

// GET /user/:username/progress - Get user progress
app.get('/user/:username/progress', (req, res) => {
    try {
        const { username } = req.params;
        const users = readProgress();
        
        if (users[username]) {
            res.json({ success: true, progress: users[username] });
        } else {
            res.json({ success: true, progress: null });
        }
    } catch (e) {
        console.error('Error GET /user/:username/progress:', e);
        res.status(500).json({ error: 'Internal error' });
    }
});

// POST /user/:username/progress - Save user progress
app.post('/user/:username/progress', (req, res) => {
    try {
        const { username } = req.params;
        const { coins, powerups, completedLevels, levelStars } = req.body;
        
        const users = readProgress();
        
        users[username] = {
            coins: typeof coins === 'number' ? coins : (users[username]?.coins || 0),
            powerups: powerups || users[username]?.powerups || {},
            completedLevels: completedLevels || users[username]?.completedLevels || {},
            levelStars: levelStars || users[username]?.levelStars || {},
            lastUpdated: new Date().toISOString()
        };
        
        saveProgress(users);
        res.json({ success: true, progress: users[username] });
    } catch (e) {
        console.error('Error POST /user/:username/progress:', e);
        res.status(500).json({ error: 'Internal error' });
    }
});

// ==========================================
// GAME LOGS (for debugging)
// ==========================================

// POST /logs - Receive game session logs
app.post('/logs', (req, res) => {
    try {
        const { username, sessionId, mode, difficulty, level, events, startTime, endTime, result, finalState } = req.body;
        
        if (!username || !sessionId) {
            return res.status(400).json({ error: 'username and sessionId required' });
        }
        
        const logs = readGameLogs();
        
        // Initialize user sessions array if not exists
        if (!logs[username]) {
            logs[username] = [];
        }
        
        // Create session object
        const session = {
            sessionId,
            mode: mode || 'unknown',
            difficulty: difficulty || null,
            level: level || null,
            startTime: startTime || new Date().toISOString(),
            endTime: endTime || new Date().toISOString(),
            result: result || 'unknown',
            finalState: finalState || {},
            events: events || [],
            receivedAt: new Date().toISOString()
        };
        
        // Add session at beginning (most recent first)
        logs[username].unshift(session);
        
        // Keep only the last MAX_SESSIONS_PER_USER sessions
        if (logs[username].length > MAX_SESSIONS_PER_USER) {
            logs[username] = logs[username].slice(0, MAX_SESSIONS_PER_USER);
        }
        
        saveGameLogs(logs);
        res.json({ success: true, sessionsStored: logs[username].length });
    } catch (e) {
        console.error('Error POST /logs:', e);
        res.status(500).json({ error: 'Internal error' });
    }
});

// ==========================================
// USAGE TIME TRACKING
// ==========================================

// POST /stats/session - Register session start/end
app.post('/stats/session', (req, res) => {
    try {
        const { username, action, mode, duration } = req.body;
        
        if (!username) {
            return res.status(400).json({ error: 'username required' });
        }
        
        const stats = readStats();
        
        if (!stats.users[username]) {
            stats.users[username] = {
                totalTime: 0,
                sessions: 0,
                gamesPlayed: 0,
                gamesByMode: {},
                lastSeen: null,
                firstSeen: new Date().toISOString()
            };
        }
        
        const user = stats.users[username];
        
        if (action === 'start') {
            user.sessions++;
            user.lastSeen = new Date().toISOString();
        } else if (action === 'end' && typeof duration === 'number') {
            user.totalTime += duration;
            user.lastSeen = new Date().toISOString();
        } else if (action === 'game' && mode) {
            user.gamesPlayed++;
            user.gamesByMode[mode] = (user.gamesByMode[mode] || 0) + 1;
            user.lastSeen = new Date().toISOString();
        } else if (action === 'heartbeat' && typeof duration === 'number') {
            // Update time without incrementing sessions
            user.totalTime += duration;
            user.lastSeen = new Date().toISOString();
        }
        
        saveStats(stats);
        res.json({ success: true });
    } catch (e) {
        console.error('Error POST /stats/session:', e);
        res.status(500).json({ error: 'Internal error' });
    }
});

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

// POST /admin/login - Administrator login
app.post('/admin/login', (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (username !== ADMIN_USER || password !== ADMIN_PASS) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Generate token
        const token = crypto.randomBytes(32).toString('hex');
        activeSessions.set(token, {
            user: username,
            expires: Date.now() + 3600000 // 1 hour
        });
        
        res.json({ success: true, token });
    } catch (e) {
        console.error('Error POST /admin/login:', e);
        res.status(500).json({ error: 'Internal error' });
    }
});

// POST /admin/logout - Admin logout
app.post('/admin/logout', requireAdmin, (req, res) => {
    const token = req.headers['x-admin-token'];
    activeSessions.delete(token);
    res.json({ success: true });
});

// GET /admin/verify - Verify if token is valid
app.get('/admin/verify', requireAdmin, (req, res) => {
    res.json({ valid: true });
});

// GET /admin/logs - Get game logs
app.get('/admin/logs', requireAdmin, (req, res) => {
    try {
        const { username, limit = 10 } = req.query;
        const logs = readGameLogs();
        
        if (username) {
            // Logs for a specific user
            const userLogs = logs[username] || [];
            res.json({ 
                username,
                sessions: userLogs.slice(0, parseInt(limit)),
                totalSessions: userLogs.length
            });
        } else {
            // Summary of all users
            const summary = Object.entries(logs).map(([user, sessions]) => ({
                username: user,
                totalSessions: sessions.length,
                lastSession: sessions[0]?.endTime || null,
                lastResult: sessions[0]?.result || null,
                lastMode: sessions[0]?.mode || null
            }));
            
            // Sort by last session
            summary.sort((a, b) => {
                if (!a.lastSession) return 1;
                if (!b.lastSession) return -1;
                return new Date(b.lastSession) - new Date(a.lastSession);
            });
            
            res.json({ users: summary, totalUsers: summary.length });
        }
    } catch (e) {
        console.error('Error GET /admin/logs:', e);
        res.status(500).json({ error: 'Internal error' });
    }
});

// GET /admin/logs/:username/:sessionId - Get details of a specific session
app.get('/admin/logs/:username/:sessionId', requireAdmin, (req, res) => {
    try {
        const { username, sessionId } = req.params;
        const logs = readGameLogs();
        
        if (!logs[username]) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const session = logs[username].find(s => s.sessionId === sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        res.json({ session });
    } catch (e) {
        console.error('Error GET /admin/logs/:username/:sessionId:', e);
        res.status(500).json({ error: 'Internal error' });
    }
});

// DELETE /admin/logs/:username - Delete logs for a user
app.delete('/admin/logs/:username', requireAdmin, (req, res) => {
    try {
        const { username } = req.params;
        const logs = readGameLogs();
        
        if (!logs[username]) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const deleted = logs[username].length;
        delete logs[username];
        saveGameLogs(logs);
        
        res.json({ success: true, deleted });
    } catch (e) {
        console.error('Error DELETE /admin/logs/:username:', e);
        res.status(500).json({ error: 'Internal error' });
    }
});

// GET /admin/scores - List all scores
app.get('/admin/scores', requireAdmin, (req, res) => {
    try {
        const scores = readScores().sort((a, b) => b.score - a.score);
        res.json({ items: scores, total: scores.length });
    } catch (e) {
        console.error('Error GET /admin/scores:', e);
        res.status(500).json({ error: 'Internal error' });
    }
});

// DELETE /admin/scores/:username - Delete scores for a user
app.delete('/admin/scores/:username', requireAdmin, (req, res) => {
    try {
        const { username } = req.params;
        const { mode } = req.query;
        
        let scores = readScores();
        const originalCount = scores.length;
        
        if (mode) {
            scores = scores.filter(s => !(s.username === username && s.mode === mode));
        } else {
            scores = scores.filter(s => s.username !== username);
        }
        
        const deleted = originalCount - scores.length;
        saveScores(scores);
        
        res.json({ deleted, remaining: scores.length });
    } catch (e) {
        console.error('Error DELETE /admin/scores/:username:', e);
        res.status(500).json({ error: 'Internal error' });
    }
});

// PATCH /admin/scores/:username - Modify score
app.patch('/admin/scores/:username', requireAdmin, (req, res) => {
    try {
        const { username } = req.params;
        const { mode, score, level, lines } = req.body;
        
        if (!mode) {
            return res.status(400).json({ error: 'mode required' });
        }
        
        let scores = readScores();
        const index = scores.findIndex(s => s.username === username && s.mode === mode);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Record not found' });
        }
        
        if (typeof score === 'number') scores[index].score = score;
        if (typeof level === 'number') scores[index].level = level;
        if (typeof lines === 'number') scores[index].lines = lines;
        scores[index].timestamp = new Date().toISOString();
        
        saveScores(scores);
        res.json({ updated: true, record: scores[index] });
    } catch (e) {
        console.error('Error PATCH /admin/scores/:username:', e);
        res.status(500).json({ error: 'Internal error' });
    }
});

// DELETE /admin/scores - Delete ALL scores
app.delete('/admin/scores', requireAdmin, (req, res) => {
    try {
        const scores = readScores();
        const count = scores.length;
        saveScores([]);
        res.json({ deleted: count, message: 'All scores deleted' });
    } catch (e) {
        console.error('Error DELETE /admin/scores:', e);
        res.status(500).json({ error: 'Internal error' });
    }
});

// GET /admin/stats - Get usage statistics
app.get('/admin/stats', requireAdmin, (req, res) => {
    try {
        const stats = readStats();
        const scores = readScores();
        
        // Calculate global statistics
        const users = Object.entries(stats.users).map(([username, data]) => ({
            username,
            ...data,
            totalTimeFormatted: formatTime(data.totalTime)
        }));
        
        // Sort by total time
        users.sort((a, b) => b.totalTime - a.totalTime);
        
        // Global statistics
        const totalUsers = users.length;
        const totalTime = users.reduce((sum, u) => sum + u.totalTime, 0);
        const totalSessions = users.reduce((sum, u) => sum + u.sessions, 0);
        const totalGames = users.reduce((sum, u) => sum + u.gamesPlayed, 0);
        
        // Games per mode
        const gamesByMode = {};
        for (const user of users) {
            for (const [mode, count] of Object.entries(user.gamesByMode || {})) {
                gamesByMode[mode] = (gamesByMode[mode] || 0) + count;
            }
        }
        
        // Active users (last week)
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const activeUsers = users.filter(u => 
            u.lastSeen && new Date(u.lastSeen).getTime() > oneWeekAgo
        ).length;
        
        res.json({
            global: {
                totalUsers,
                activeUsers,
                totalTime,
                totalTimeFormatted: formatTime(totalTime),
                totalSessions,
                totalGames,
                gamesByMode,
                avgTimePerUser: totalUsers > 0 ? formatTime(totalTime / totalUsers) : '0s',
                avgGamesPerUser: totalUsers > 0 ? (totalGames / totalUsers).toFixed(1) : 0
            },
            users,
            scoresCount: scores.length
        });
    } catch (e) {
        console.error('Error GET /admin/stats:', e);
        res.status(500).json({ error: 'Internal error' });
    }
});

// DELETE /admin/stats/:username - Delete statistics for a user
app.delete('/admin/stats/:username', requireAdmin, (req, res) => {
    try {
        const { username } = req.params;
        const stats = readStats();
        
        if (stats.users[username]) {
            delete stats.users[username];
            saveStats(stats);
            res.json({ deleted: true });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (e) {
        console.error('Error DELETE /admin/stats/:username:', e);
        res.status(500).json({ error: 'Internal error' });
    }
});

// DELETE /admin/user/:username - Delete ALL for a user (scores + stats + progress)
app.delete('/admin/user/:username', requireAdmin, (req, res) => {
    try {
        const { username } = req.params;
        
        // Delete scores
        let scores = readScores();
        const originalScoreCount = scores.length;
        scores = scores.filter(s => s.username !== username);
        const scoresDeleted = originalScoreCount - scores.length;
        saveScores(scores);
        
        // Delete stats
        const stats = readStats();
        let statsDeleted = false;
        if (stats.users[username]) {
            delete stats.users[username];
            saveStats(stats);
            statsDeleted = true;
        }
        
        // Delete progress (coins, powerups, levels)
        const progress = readProgress();
        let progressDeleted = false;
        if (progress[username]) {
            delete progress[username];
            saveProgress(progress);
            progressDeleted = true;
        }
        
        // Add to deleted users list (to clean client localStorage)
        addDeletedUser(username);
        
        res.json({ 
            success: true,
            scoresDeleted,
            statsDeleted,
            progressDeleted,
            message: `Usuario "${username}" completely deleted`
        });
    } catch (e) {
        console.error('Error DELETE /admin/user/:username:', e);
        res.status(500).json({ error: 'Internal error' });
    }
});

// Function to format time
function formatTime(ms) {
    if (!ms || ms < 1000) return '0s';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
        return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
    ensureDataFiles();
    console.log(`Scores API running on port ${PORT}`);
});
