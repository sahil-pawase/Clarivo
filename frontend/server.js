const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const BACKEND_PORT = 8000;
const BUILD_DIR = path.join(__dirname, 'build');

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.map': 'application/json'
};

function proxyRequest(req, res) {
    const options = {
        hostname: '127.0.0.1',
        port: BACKEND_PORT,
        path: req.url,
        method: req.method,
        headers: req.headers
    };

    const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Backend server not reachable on port 8000', details: err.message }));
    });

    req.pipe(proxyReq, { end: true });
}

const server = http.createServer((req, res) => {
    const urlPath = req.url.split('?')[0];

    // Proxy API requests to backend
    if (urlPath.startsWith('/api') || urlPath.startsWith('/docs') || urlPath.startsWith('/openapi.json') || urlPath === '/health') {
        return proxyRequest(req, res);
    }

    // Static file serving from build/
    let safeSuffix = path.normalize(urlPath).replace(/^(\.\.[\/\\])+/, '');
    if (safeSuffix === '.' || safeSuffix === '/' || safeSuffix === '\\') {
        safeSuffix = 'index.html';
    }

    let filePath = path.join(BUILD_DIR, safeSuffix);

    fs.stat(filePath, (err, stats) => {
        if (!err && stats.isFile()) {
            const ext = path.extname(filePath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': contentType });
            fs.createReadStream(filePath).pipe(res);
        } else {
            // SPA fallback: return index.html
            const indexPath = path.join(BUILD_DIR, 'index.html');
            fs.readFile(indexPath, (err2, content) => {
                if (err2) {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Clarivo build files not found. Please run npm run build.');
                } else {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(content);
                }
            });
        }
    });
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.warn(`[WARN] Port ${PORT} is already in use by an existing Clarivo instance.`);
        console.log(`Clarivo is already running at: http://localhost:${PORT}`);
        process.exit(0);
    } else {
        console.error('Server error:', err);
        process.exit(1);
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n============================================================`);
    console.log(`  CLARIVO WEB APPLICATION IS RUNNING!`);
    console.log(`  * Frontend Web App:  http://localhost:${PORT}`);
    console.log(`  * Backend REST API:  http://localhost:${BACKEND_PORT}`);
    console.log(`  * API Documentation: http://localhost:${BACKEND_PORT}/docs`);
    console.log(`============================================================\n`);
});
