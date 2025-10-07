"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
//======= ENVIRONMENT =======
dotenv_1.default.config();
//======= DEBUG IMPORTS =======
console.log('Starting server...');
try {
    console.log('Importing app...');
    const app = require('./app').default;
    console.log('App imported successfully');
    //======= CONFIGURATION =======
    const PORT = process.env.PORT || 3000;
    //======= SERVER START =======
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Health check: http://localhost:${PORT}/api/health`);
        console.log('Routes mounted successfully');
    });
}
catch (error) {
    console.error('ERROR STARTING SERVER:', error);
    process.exit(1);
}
