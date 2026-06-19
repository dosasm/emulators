// Check if running in Node.js environment
if (typeof global === "object" && typeof process === "object") {
  const { parentPort, workerData } = require('worker_threads');
  
  // Create browser-like 'self' global object
  global.self = {
    // Message sending with transfer support
    postMessage: (data, transferList) => {
      parentPort.postMessage(data, transferList || []);
    },

    // Event listener implementation
    addEventListener: (eventType, callback) => {
      if (eventType === 'message') {
        parentPort.on('message', (data) => {
          // Mimic browser's MessageEvent structure
          callback({ data: data });
        });
      } else if (eventType === 'error') {
        parentPort.on('error', (error) => callback(error));
      }
    },

    // Message handler property
    onmessage: null,

    // Script loading simulation
    importScripts: (...scripts) => {
      scripts.forEach(script => {
        try {
          require(script); // Load local scripts
        } catch (e) {
          console.warn(`Failed to load script ${script}: ${e.message}`);
        }
      });
    },

    // Worker termination
    close: () => process.exit(0),

    // Location simulation
    location: {
      href: `file://${__dirname}`
    },

    // Console access
    console: console,

    // Expose worker initialization data
    workerData,

    // Environment simulation
    navigator: {
      userAgent: 'Node.js Worker (Browser Compatibility Mode)'
    },

    // Timer functions
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval
  };

  // Connect Node.js message handling to browser-style onmessage
  if (parentPort) {
    parentPort.on('message', (data) => {
      if (typeof global.onmessage === 'function') {
        global.onmessage({
          data: data,
          type: 'message',
          target: self
        });
      }
    });

    // Error handling
    parentPort.on('error', (error) => {
      if (typeof self.onerror === 'function') {
        self.onerror({
          message: error.message,
          filename: error.stack.split('\n')[1]?.split('/').pop(),
          lineno: 0,
          colno: 0
        });
      } else {
        console.error('Worker error:', error);
      }
    });
  }

  // Global aliases for browser compatibility
  global.importScripts = self.importScripts;
  global.postMessage = self.postMessage;
}
    