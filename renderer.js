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
        const img = document.createElement('img');
        img.src = imagePath;
        img.className = 'image-preview';
        container.appendChild(img);
    });
}

console.log('渲染进程已加载')