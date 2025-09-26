// Crypto polyfill for Node.js environments
if (!global.crypto) {
  global.crypto = require('crypto');
}

// Additional polyfills if needed
if (typeof global.crypto.randomUUID === 'undefined') {
  global.crypto.randomUUID = function() {
    return require('crypto').randomUUID();
  };
}