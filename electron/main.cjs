const { app, BrowserWindow, ipcMain, shell } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");
const { execFile } = require("node:child_process");

const isDev = !app.isPackaged;
const nmcCacheTtlMs = 2 * 60 * 60 * 1000;
const nmcLevels = [
  { id: "h000", label: "地面", url: "http://www.nmc.cn/publish/observations/china/dm/weatherchart-h000.htm" },
  { id: "h925", label: "925hPa", url: "http://www.nmc.cn/publish/observations/china/dm/weatherchart-h925.htm" },
  { id: "h850", label: "850hPa", url: "http://www.nmc.cn/publish/observations/china/dm/weatherchart-h850.htm" },
  { id: "h700", label: "700hPa", url: "http://www.nmc.cn/publish/observations/china/dm/weatherchart-h700.htm" },
  { id: "h500", label: "500hPa", url: "http://www.nmc.cn/publish/observations/china/dm/weatherchart-h500.htm" },
  { id: "h200", label: "200hPa", url: "http://www.nmc.cn/publish/observations/china/dm/weatherchart-h200.htm" },
  { id: "h100", label: "100hPa", url: "http://www.nmc.cn/publish/observations/china/dm/weatherchart-h100.htm" }
];

function createWindow() {
  const win = new BrowserWindow({
    width: 1500,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: "#081015",
    title: "Jerry's Typhoon Workbench",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      preload: path.join(__dirname, "preload.cjs"),
      sandbox: false
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  const url = process.env.VITE_DEV_SERVER_URL;
  if (isDev && url) {
    win.loadURL(url);
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

function nmcCacheDir() {
  return path.join(app.getPath("userData"), "nmc-weather-charts");
}

function nmcMetaPath() {
  return path.join(nmcCacheDir(), "cache-meta.json");
}

function fileUrl(filePath) {
  return `file:///${filePath.replace(/\\/g, "/").replace(/ /g, "%20")}`;
}

async function readNmcMeta() {
  try {
    const raw = await fs.readFile(nmcMetaPath(), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function runCurl(args, output = "text") {
  const attempts = [
    ["--silent", "--show-error", "--fail", "--location", "--max-time", "45", ...args],
    ["--silent", "--show-error", "--fail", "--location", "--max-time", "45", "--proxy", "http://127.0.0.1:7890", ...args]
  ];

  let lastError;
  for (const curlArgs of attempts) {
    try {
      return await new Promise((resolve, reject) => {
        execFile("curl.exe", curlArgs, { encoding: output === "buffer" ? "buffer" : "utf8", maxBuffer: 20 * 1024 * 1024 }, (error, stdout, stderr) => {
          if (error) {
            reject(new Error(stderr?.toString() || error.message));
            return;
          }
          resolve(stdout);
        });
      });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function fetchText(url) {
  return runCurl([url], "text");
}

async function downloadFile(url, destination) {
  await runCurl(["--output", destination, url], "text");
}

function parseNmcCharts(html) {
  const charts = [];
  const seen = new Set();
  const pattern = /data-img="([^"]+)"[\s\S]*?data-time="([^"]+)"/g;
  let match;

  while ((match = pattern.exec(html)) && charts.length < 3) {
    const imageUrl = match[1].replace(/&amp;/g, "&");
    if (seen.has(imageUrl)) {
      continue;
    }
    seen.add(imageUrl);
    charts.push({
      sourceUrl: imageUrl,
      time: match[2]
    });
  }

  return charts;
}

function safeFilePart(value) {
  return String(value).replace(/[^a-z0-9-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
}

async function getNmcCharts(options = {}) {
  const force = Boolean(options.force);
  const cacheDir = nmcCacheDir();
  await fs.mkdir(cacheDir, { recursive: true });

  const cached = await readNmcMeta();
  if (!force && cached?.fetchedAt && Date.now() - cached.fetchedAt < nmcCacheTtlMs) {
    return { ...cached, cacheHit: true };
  }

  const nextMeta = {
    fetchedAt: Date.now(),
    ttlMs: nmcCacheTtlMs,
    levels: {}
  };
  const keepFiles = new Set();

  try {
    for (const level of nmcLevels) {
      const html = await fetchText(level.url);
      const charts = parseNmcCharts(html);
      if (charts.length === 0) {
        throw new Error(`${level.label} 未找到天气图图片`);
      }

      nextMeta.levels[level.id] = {
        id: level.id,
        label: level.label,
        pageUrl: level.url,
        charts: []
      };

      for (const [index, chart] of charts.entries()) {
        const filename = `${level.id}-${index + 1}-${safeFilePart(chart.time)}.jpg`;
        const localPath = path.join(cacheDir, filename);
        await downloadFile(chart.sourceUrl, localPath);
        keepFiles.add(filename);
        nextMeta.levels[level.id].charts.push({
          ...chart,
          localPath,
          fileUrl: fileUrl(localPath)
        });
      }
    }

    await fs.writeFile(nmcMetaPath(), JSON.stringify(nextMeta, null, 2), "utf8");

    const files = await fs.readdir(cacheDir);
    await Promise.all(
      files
        .filter((name) => /\.(jpg|jpeg|png)$/i.test(name) && !keepFiles.has(name))
        .map((name) => fs.unlink(path.join(cacheDir, name)).catch(() => undefined))
    );

    return { ...nextMeta, cacheHit: false };
  } catch (error) {
    if (cached) {
      return {
        ...cached,
        cacheHit: true,
        warning: `更新失败，已显示上次缓存：${error.message}`
      };
    }
    throw error;
  }
}

ipcMain.handle("nmc:getCharts", (_event, options) => getNmcCharts(options));

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
