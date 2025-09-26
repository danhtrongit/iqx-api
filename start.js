#!/usr/bin/env node

// Load crypto module globally before anything else
global.crypto = require('crypto');

// Now load the main application
require('./dist/src/main.js');