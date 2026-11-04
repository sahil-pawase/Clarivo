const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('clarivo', {
  apiBase: 'http://127.0.0.1:8000',
});

console.log('Preload loaded');
