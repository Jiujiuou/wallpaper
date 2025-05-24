const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs").promises;
const wallpaper = require("wallpaper");

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile("index.html");
  win.webContents.openDevTools();
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
    return { success: true };
  } catch (error) {
    console.error("设置壁纸失败:", error);
    return { success: false, error: error.message };
  }
});
