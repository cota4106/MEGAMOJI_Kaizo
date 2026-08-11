const { app, BrowserWindow } = require("electron");
const http = require("http");
const fs = require("fs");
const path = require("path");

// MEGAMOJI is a static SPA built by webpack into ../dist.
// We serve it over http://127.0.0.1 (instead of loading the file
// directly) because some browsers/engines refuse to spawn Web Workers
// (used here for GIF encoding) from a file:// origin.
const DIST_DIR = path.join(__dirname, "..", "dist");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff": "font/woff",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".map": "application/json; charset=utf-8",
};

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const requestPath = decodeURIComponent((req.url || "/").split("?")[0]);
      const resolved = path.normalize(path.join(DIST_DIR, requestPath));

      // prevent escaping the dist directory
      if (!resolved.startsWith(DIST_DIR)) {
        res.writeHead(403);
        res.end();
        return;
      }

      const filePath = resolved.endsWith(path.sep) || requestPath === "/"
        ? path.join(DIST_DIR, "index.html")
        : resolved;

      fs.readFile(filePath, (err, data) => {
        if (err) {
          // SPA fallback: unknown paths serve index.html
          fs.readFile(path.join(DIST_DIR, "index.html"), (err2, indexData) => {
            if (err2) {
              res.writeHead(404);
              res.end("Not found");
              return;
            }
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            res.end(indexData);
          });
          return;
        }
        const ext = path.extname(filePath);
        res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
        res.end(data);
      });
    });

    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      resolve(server);
    });
  });
}

let mainWindow = null;
let server = null;

async function createWindow() {
  if (!server) {
    server = await startServer();
  }
  const { port } = server.address();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: "MEGAMOJI改造版",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadURL(`http://127.0.0.1:${port}/index.html`);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("before-quit", () => {
  if (server) {
    server.close();
  }
});
