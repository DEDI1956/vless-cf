const fs = require('fs-extra');
const path = require('path');

class Database {
    constructor() {
        this.sessionFile = path.join(__dirname, '../data/sessions.json');
        this.ensureDataDir();
        this.loadSessions();
    }

    ensureDataDir() {
        const dataDir = path.dirname(this.sessionFile);
        fs.ensureDirSync(dataDir);
    }

    loadSessions() {
        try {
            if (fs.existsSync(this.sessionFile)) {
                this.sessions = fs.readJsonSync(this.sessionFile);
            } else {
                this.sessions = {};
                this.saveSessions();
            }
        } catch (error) {
            console.error('Error loading sessions:', error);
            this.sessions = {};
        }
    }

    saveSessions() {
        try {
            fs.writeJsonSync(this.sessionFile, this.sessions, { spaces: 2 });
        } catch (error) {
            console.error('Error saving sessions:', error);
        }
    }

    getUser(userId) {
        return this.sessions[userId] || null;
    }

    setUser(userId, userData) {
        this.sessions[userId] = {
            ...this.sessions[userId],
            ...userData,
            lastUpdate: new Date().toISOString()
        };
        this.saveSessions();
    }

    updateUserStep(userId, step, stepData = {}) {
        if (!this.sessions[userId]) {
            this.sessions[userId] = {};
        }
        
        this.sessions[userId].currentStep = step;
        this.sessions[userId].stepData = stepData;
        this.sessions[userId].lastUpdate = new Date().toISOString();
        this.saveSessions();
    }

    clearUserStep(userId) {
        if (this.sessions[userId]) {
            delete this.sessions[userId].currentStep;
            delete this.sessions[userId].stepData;
            this.saveSessions();
        }
    }

    isUserLoggedIn(userId) {
        const user = this.getUser(userId);
        return user && user.apiToken && user.accountId && user.zoneId;
    }
}

module.exports = new Database();