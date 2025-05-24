const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs").promises;
const wallpaper = require("wallpaper");

let mainWindow;
let floatWindow;
let currentWallpaperPath = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile("index.html");
  mainWindow.webContents.openDevTools();

  // 创建隐藏的悬浮窗
  floatWindow = new BrowserWindow({
    width: 150,
    height: 50,
    frame: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    resizable: false,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  floatWindow.loadFile("float.html");

  // 监听主窗口的最小化事件
  mainWindow.on("minimize", () => {
    const { screen } = require("electron");
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    // 将悬浮窗定位到右下角
    floatWindow.setPosition(width - 170, height - 70);
    floatWindow.show();
  });

  // 监听主窗口的恢复事件
  mainWindow.on("restore", () => {
    floatWindow.hide();
  });

  // 监听主窗口的关闭事件
  mainWindow.on("close", () => {
    floatWindow.close();
  });
}

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

// 处理选择文件夹的请求
ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  return result;
});

// 获取文件夹中的图片
ipcMain.handle("get-images", async (event, folderPath) => {
  async function getImagesRecursively(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp"];
    let results = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // 递归搜索子文件夹
        results = results.concat(await getImagesRecursively(fullPath));
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        if (imageExtensions.includes(ext)) {
          results.push({
            displayPath: "file://" + fullPath,
            localPath: fullPath,
          });
        }
      }
    }

    return results;
  }

  try {
    return await getImagesRecursively(folderPath);
  } catch (error) {
    console.error("获取图片失败:", error);
    return [];
  }
});

// 处理设置壁纸的请求
ipcMain.handle("set-wallpaper", async (event, imagePath) => {
  try {
    await wallpaper.setWallpaper(imagePath, {
      scale: "fit", // 设置缩放模式为 fit，保持原始比例
    });
    currentWallpaperPath = imagePath; // 保存当前壁纸路径
    return { success: true };
  } catch (error) {
    console.error("设置壁纸失败:", error);
    return { success: false, error: error.message };
  }
});

// 处理删除当前壁纸的请求
ipcMain.handle("delete-current-wallpaper", async () => {
  if (!currentWallpaperPath) {
    return { success: false, error: "没有正在使用的壁纸" };
  }

  try {
    // 删除文件
    await fs.unlink(currentWallpaperPath);

    // 通知主窗口刷新图片列表
    mainWindow.webContents.send("wallpaper-deleted", currentWallpaperPath);

    return { success: true };
  } catch (error) {
    console.error("删除壁纸失败:", error);
    return { success: false, error: error.message };
  }
});
