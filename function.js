const chalk = require('chalk');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
    color: (text, color) => {
        return chalk[color](text);
    },
    
    getBuffer: async (url, options) => {
        try {
            const response = await axios({
                method: 'get',
                url,
                headers: {
                    'User-Agent': 'DarkX-Bot/1.0.0'
                },
                responseType: 'arraybuffer',
                ...options
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    
    runtime: (seconds) => {
        seconds = Number(seconds);
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor(seconds % (3600 * 24) / 3600);
        const m = Math.floor(seconds % 3600 / 60);
        const s = Math.floor(seconds % 60);
        
        const dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
        const hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
        const mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
        const sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
        return (dDisplay + hDisplay + mDisplay + sDisplay).replace(/,\s*$/, "");
    },
    
    formatBytes: (bytes, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },
    
    isUrl: (string) => {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
};
