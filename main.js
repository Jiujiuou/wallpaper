const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const wallpaper = require('wallpaper');

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// 处理选择文件夹的请求
ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });
    return result;
});

// 获取文件夹中的图片
ipcMain.handle('get-images', async (event, folderPath) => {
    const files = await fs.readdir(folderPath);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
    
    const imagePaths = files
        .filter(file => {
            const ext = path.extname(file).toLowerCase();
            return imageExtensions.includes(ext);
        })
        .map(file => ({
            // 用于显示的 URL 路径
            displayPath: 'file://' + path.join(folderPath, file),
            // 用于设置壁纸的本地路径
            localPath: path.join(folderPath, file)
        }));
    
    return imagePaths;
});

// 处理设置壁纸的请求
ipcMain.handle('set-wallpaper', async (event, imagePath) => {
    try {
        await wallpaper.setWallpaper(imagePath);
        return { success: true };
    } catch (error) {
        console.error('设置壁纸失败:', error);
        return { success: false, error: error.message };
    }
});
