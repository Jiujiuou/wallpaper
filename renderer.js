const { ipcRenderer } = require('electron');

document.getElementById('selectFolder').addEventListener('click', async () => {
    const result = await ipcRenderer.invoke('select-folder');
    if (result.filePaths && result.filePaths.length > 0) {
        const images = await ipcRenderer.invoke('get-images', result.filePaths[0]);
        displayImages(images);
    }
});

function displayImages(imagePaths) {
    const container = document.getElementById('imageContainer');
    container.innerHTML = '';
    
    imagePaths.forEach(imagePath => {
        const wrapper = document.createElement('div');
        wrapper.className = 'image-wrapper';

        const img = document.createElement('img');
        img.src = imagePath.displayPath; // 使用 displayPath 来显示图片
        img.className = 'image-preview';

        const button = document.createElement('button');
        button.className = 'set-wallpaper-btn';
        button.textContent = '设为壁纸';
        button.onclick = async (e) => {
            e.stopPropagation();
            await ipcRenderer.invoke('set-wallpaper', imagePath.localPath); // 使用 localPath 来设置壁纸
        };

        wrapper.appendChild(img);
        wrapper.appendChild(button);
        container.appendChild(wrapper);
    });
}

console.log('渲染进程已加载');