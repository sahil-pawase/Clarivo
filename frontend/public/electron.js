const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

let mainWindow;
let backendProcess = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1360,
        height: 900,
        title: 'Clarivo - AI-Powered Data Analysis',
        backgroundColor: '#0D1B2A',
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
    });

    const devUrl = process.env.ELECTRON_START_URL || (!app.isPackaged ? 'http://localhost:3000' : null);
    const indexPath = path.join(__dirname, '..', 'build', 'index.html');

    if (devUrl) {
        mainWindow.loadURL(devUrl).catch(() => {
            if (fs.existsSync(indexPath)) {
                mainWindow.loadFile(indexPath);
            } else {
                mainWindow.loadFile(path.join(__dirname, 'index-simple.html'));
            }
        });
    } else {
        if (fs.existsSync(indexPath)) {
            mainWindow.loadFile(indexPath);
        } else {
            mainWindow.loadFile(path.join(__dirname, 'index-simple.html'));
        }
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('Failed to load React app:', errorCode, errorDescription);
        const simplePath = path.join(__dirname, 'index-simple.html');
        if (fs.existsSync(simplePath)) {
            mainWindow.loadFile(simplePath);
        }
    });
}

function checkBackendHealthy() {
    return new Promise((resolve) => {
        const req = http.get({ host: '127.0.0.1', port: 8000, path: '/health', timeout: 800 }, (res) => {
            res.resume();
            resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        req.on('timeout', () => {
            try { req.destroy(); } catch (_) {}
            resolve(false);
        });
    });
}

async function startBackendAndWait() {
    const isAlreadyRunning = await checkBackendHealthy();
    if (isAlreadyRunning) {
        console.log('Backend API is already running on http://127.0.0.1:8000');
        return true;
    }

    try {
        let exePath;
        let spawnArgs = [];
        let cwd;

        if (app.isPackaged) {
            exePath = path.join(process.resourcesPath, 'backend', 'clarivo-backend.exe');
            cwd = path.dirname(exePath);
        } else {
            const venvPy = path.resolve(__dirname, '..', '..', 'backend', 'venv', 'Scripts', 'python.exe');
            const mainPy = path.resolve(__dirname, '..', '..', 'backend', 'main.py');
            if (fs.existsSync(venvPy) && fs.existsSync(mainPy)) {
                exePath = venvPy;
                spawnArgs = [mainPy];
                cwd = path.dirname(mainPy);
            }
        }

        if (exePath && fs.existsSync(exePath)) {
            console.log('Spawning backend from:', exePath);
            backendProcess = spawn(exePath, spawnArgs, {
                cwd: cwd,
                detached: false,
                stdio: 'ignore',
            });
        }

        for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 500));
            if (await checkBackendHealthy()) {
                console.log('Backend became ready!');
                return true;
            }
        }
    } catch (err) {
        console.warn('Backend start attempt finished with note:', err.message);
    }
    return false;
}

app.whenReady().then(async () => {
    console.log('Starting Clarivo desktop application...');
    try {
        await startBackendAndWait();
    } catch (e) {
        console.error('Backend note:', e?.message || e);
    }
    createWindow();
    console.log('Clarivo application window initialized');
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

app.on('before-quit', () => {
    try {
        if (backendProcess && !backendProcess.killed) {
            backendProcess.kill();
        }
    } catch (_) { /* noop */ }
});
