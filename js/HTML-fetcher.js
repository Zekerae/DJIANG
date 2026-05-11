function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
    });
}

function loadSection(filePath, targetDivId) {
    return fetch(filePath)
        .then(response => response.text())
        .then(html => {
            document.getElementById(targetDivId).innerHTML = html;
        });
}

loadSection('LandingPage.html', 'landing-page');



loadScript('js/CharacterSlide.js')
    .then(() => loadSection('CharacterSlide.html', 'character-slide'))
    .then(() => initCharacterSlide());

loadScript('js/carousel.js')
    .then(() => loadSection('Carousel-3D.html', 'carousel-3D'))
    .then(() => initCarousel());