const { spawn, exec, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = __dirname;
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

console.log('\n============================================================');
console.log('       CLARIVO - AI-POWERED DATA ANALYSIS PLATFORM          ');
console.log('============================================================\n');

// 1. Free ports on Windows if occupied
function freePort(port) {
    if (process.platform === 'win32') {
        try {
            const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
            const lines = out.trim().split('\n');
            for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                const pid = parts[parts.length - 1];
                if (pid && pid !== '0' && pid !== `${process.pid}`) {
                    try {
                        execSync(`taskkill /F /PID ${pid} >nul 2>&1`);
                    } catch (_) {}
                }
            }
        } catch (_) {}
    }
}

freePort(3000);
freePort(8000);

// 2. Determine Python executable
let pythonExe = 'python';
const venvPy = path.join(backendDir, 'venv', 'Scripts', 'python.exe');
if (fs.existsSync(venvPy)) {
    pythonExe = venvPy;
} else if (process.platform === 'win32') {
    pythonExe = 'py';
}

console.log(`[SYSTEM] Starting Backend API with: ${pythonExe}`);
const backendProcess = spawn(pythonExe, ['main.py'], {
    cwd: backendDir,
    stdio: 'inherit',
    shell: false
});

console.log(`[SYSTEM] Starting Frontend Server on Port 3000...`);
const frontendProcess = spawn(process.execPath, [path.join(frontendDir, 'server.js')], {
    cwd: frontendDir,
    stdio: 'inherit',
    shell: false
});

setTimeout(() => {
    console.log('\n============================================================');
    console.log('  >>> CLARIVO IS READY! <<<');
    console.log('  * Web App UI:        http://localhost:3000');
    console.log('  * Backend API:       http://localhost:8000');
    console.log('  * API Swagger Docs:  http://localhost:8000/docs');
    console.log('============================================================\n');

    if (process.platform === 'win32') {
        exec('start http://localhost:3000');
    } else if (process.platform === 'darwin') {
        exec('open http://localhost:3000');
    } else {
        exec('xdg-open http://localhost:3000');
    }
}, 2000);

function cleanup() {
    console.log('\n[SYSTEM] Shutting down Clarivo servers...');
    try { backendProcess.kill(); } catch (_) {}
    try { frontendProcess.kill(); } catch (_) {}
    process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
