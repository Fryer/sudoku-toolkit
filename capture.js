'use strict';

let captureButton = document.getElementById('capture-button');
let captureImage = document.getElementById('capture-image');
let captureTab = null;

captureButton.addEventListener('click', () => {
    captureTab = window.open();
    createBoardImage();
});

captureImage.addEventListener('load', () => {
    let canvas = document.getElementById('capture-canvas');
    let ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(3, 3, 900, 900);
    ctx.drawImage(captureImage, 0, 0);
    captureTab.location = canvas.toDataURL();
});

async function createBoardImage() {
    function blobToDataURL(blob) {
        return new Promise(resolve => {
            let reader = new FileReader();
            reader.addEventListener('load', () => resolve(reader.result));
            reader.readAsDataURL(blob);
        });
    }
    
    // Add SVG headers. This is required by the <img> tag.
    let svg = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' +
        '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
        board.outerHTML;
    
    // Embed the styles and font into the SVG, because <img> tags don't allow external resources.
    let fontStyle = '';
    let fontText = [...(new Set(board.textContent.replace(/\s/g, '')))].join('');
    if (fontText !== '') {
        let fontTextURI = encodeURIComponent(fontText);
        let fontStyleResponse = await fetch(`https://fonts.googleapis.com/css2?family=Mulish:wght@600&text=${fontTextURI}`);
        fontStyle = await fontStyleResponse.text();
        let fontURLs = [...fontStyle.matchAll(/url\(([^)]+)\)/g)].map(match => match[1]);
        let fontResponses = await Promise.all(fontURLs.map(url => fetch(url)));
        let fontBlobs = await Promise.all(fontResponses.map(response => response.blob()));
        let fontDataURLs = await Promise.all(fontBlobs.map(blob => blobToDataURL(blob)));
        fontURLs.forEach((url, i) => {
            fontStyle = fontStyle.replace(url, fontDataURLs[i]);
        });
    }
    let boardStyle = [...document.getElementById('board-style').sheet.rules].map(rule => rule.cssText).join('');
    svg = svg.replace('<style></style>', `<style>${fontStyle}${boardStyle}</style>`);
    
    captureImage.src = 'data:image/svg+xml;base64,' + btoa(svg);
}
