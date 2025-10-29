const config = {
    // Bot Configuration
    botName: "DarkX Official",
    ownerName: "MrX Developer",
    prefix: ".",
    
    // Owner Information
    ownerNumber: "1234567890", // Replace with your number
    email: "mrxdeveloper@darkx.com",
    
    // API Keys
    openaiKey: "your-openai-api-key-here",
    geminiKey: "your-gemini-api-key-here",
    
    // Bot Settings
    sessionPath: "./session",
    maxFileSize: 100, // MB
    autoReadMessages: true,
    
    // Status Update Interval (minutes)
    statusUpdateInterval: 30,
    
    // Feature Toggles
    enableAI: true,
    enableDownloads: true,
    enableGroupTools: true
};

module.exports = config;
