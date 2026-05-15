function initCharacterSlide() {
    var root = document.querySelector('.cs-root')
    if (!root) return

    var nextBtn = root.querySelector('.next')
    var prevBtn = root.querySelector('.prev')
    var carousel = root.querySelector('.carousel')
    var list = root.querySelector('.list')
    var runningTime = root.querySelector('.timeRunning')

    if (!carousel || !list || !nextBtn || !prevBtn) return

    /* Match --cs-list-fade-duration in css/HomepageOperator.css (0.6s → 600ms). */
    var FADE_MS = 600
    var timeAutoNext = 7000
    var runNextAuto
    var runFallback
    var busy = false

    function resetTimeAnimation() {
        if (!runningTime) return
        runningTime.style.animation = 'none'
        runningTime.offsetHeight
        runningTime.style.animation = null
        runningTime.style.animation = 'cs-runningTime 7s linear 1 forwards'
    }

    function scheduleAuto() {
        clearTimeout(runNextAuto)
        runNextAuto = setTimeout(function () {
            showSlider('next')
        }, timeAutoNext)
    }

    function setNavDisabled(disabled) {
        nextBtn.disabled = disabled
        prevBtn.disabled = disabled
    }

    function waitListOpacityThen(cb) {
        var done = false
        function finish() {
            if (done) return
            done = true
            list.removeEventListener('transitionend', onEnd)
            clearTimeout(runFallback)
            cb()
        }
        function onEnd(e) {
            if (e.target !== list || e.propertyName !== 'opacity') return
            finish()
        }
        list.addEventListener('transitionend', onEnd)
        runFallback = setTimeout(finish, FADE_MS + 100)
    }

    function reorder(type) {
        var items = list.querySelectorAll('.item')
        if (!items.length) return
        if (type === 'next') {
            list.appendChild(items[0])
        } else {
            list.insertBefore(items[items.length - 1], items[0])
        }
    }

    function restartActiveContentAnimations() {
        var content = list.querySelector('.item:nth-child(2) .content')
        if (!content) return
        content.querySelectorAll('.title, .name, .des, .btn').forEach(function (el) {
            el.style.animation = 'none'
            void el.offsetHeight
            el.style.animation = ''
        })
    }

    function showSlider(type) {
        if (busy) return
        busy = true
        clearTimeout(runNextAuto)
        setNavDisabled(true)

        carousel.classList.add('cs-is-fading')
        void list.offsetWidth

        waitListOpacityThen(function afterFadeOut() {
            reorder(type)
            restartActiveContentAnimations()
            void list.offsetWidth
            carousel.classList.remove('cs-is-fading')
            void list.offsetWidth

            waitListOpacityThen(function afterFadeIn() {
                resetTimeAnimation()
                scheduleAuto()
                busy = false
                setNavDisabled(false)
            })
        })
    }

    nextBtn.onclick = function () {
        showSlider('next')
    }
    prevBtn.onclick = function () {
        showSlider('prev')
    }

    resetTimeAnimation()
    scheduleAuto()
}

initCharacterSlide()
