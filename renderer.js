const { ipcRenderer } = require('electron');

let autoChangeTimer = null;
let allImages = [];

// 监听切换模式
document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const isAuto = e.target.value === 'auto';
        document.getElementById('timeInput').classList.toggle('show', isAuto);
        document.getElementById('selectFolder').style.display = 'block';
        if (!isAuto && autoChangeTimer) {
            clearInterval(autoChangeTimer);
            autoChangeTimer = null;
        }
    });
});

document.getElementById('selectFolder').addEventListener('click', async () => {
    const result = await ipcRenderer.invoke('select-folder');
    if (result.filePaths && result.filePaths.length > 0) {
        allImages = await ipcRenderer.invoke('get-images', result.filePaths[0]);
        displayImages(allImages);
        
        // 如果是自动模式，启动定时器
        const isAuto = document.querySelector('input[name="mode"]:checked').value === 'auto';
        if (isAuto) {
            startAutoChange();
        }
    }
});

function getIntervalMs() {
    const days = parseInt(document.getElementById('days').value) || 0;
    const hours = parseInt(document.getElementById('hours').value) || 0;
    const minutes = parseInt(document.getElementById('minutes').value) || 0;
    const seconds = parseInt(document.getElementById('seconds').value) || 0;
    
    return ((days * 24 * 60 * 60) + (hours * 60 * 60) + (minutes * 60) + seconds) * 1000;
}

function startAutoChange() {
    if (autoChangeTimer) {
        clearInterval(autoChangeTimer);
    }
    
    const intervalMs = getIntervalMs();
    if (intervalMs > 0 && allImages.length > 0) {
        // 立即切换一次
        setRandomWallpaper();
        
        // 设置定时器
        autoChangeTimer = setInterval(setRandomWallpaper, intervalMs);
    }
}

function setRandomWallpaper() {
    if (allImages.length > 0) {
        const randomIndex = Math.floor(Math.random() * allImages.length);
        ipcRenderer.invoke('set-wallpaper', allImages[randomIndex].localPath);
    }
}

function displayImages(imagePaths) {
    const container = document.getElementById('imageContainer');
    container.innerHTML = '';
    
    imagePaths.forEach(imagePath => {
        const wrapper = document.createElement('div');
        wrapper.className = 'image-wrapper';

        const img = document.createElement('img');
        img.src = imagePath.displayPath;
        img.className = 'image-preview';

        const button = document.createElement('button');
        button.className = 'set-wallpaper-btn';
        button.textContent = '设为壁纸';
        button.onclick = async (e) => {
            e.stopPropagation();
            await ipcRenderer.invoke('set-wallpaper', imagePath.localPath);
        };

        wrapper.appendChild(img);
        wrapper.appendChild(button);
        container.appendChild(wrapper);
    });
}

console.log('渲染进程已加载');