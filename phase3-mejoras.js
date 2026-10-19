/* =========================================================
   GUATILA · EL TESORO VERDE — FASE 3 (JS)
   Da vida a phase3-mejoras.css: barra de progreso, contador
   de cifras, acordeón de FAQ y confeti de éxito. Respeta
   prefers-reduced-motion. No depende de librerías externas.
========================================================= */

(function () {
    'use strict';

    var reducedMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* =========================
       1. BARRA DE PROGRESO DE SCROLL
    ========================= */
    var progressBar = document.getElementById('scrollProgress');
    if (progressBar) {
        var tickingProgress = false;
        function updateProgress() {
            var scrollTop = window.scrollY;
            var docHeight = document.documentElement.scrollHeight - window.innerHeight;
            var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            progressBar.style.width = pct + '%';
            tickingProgress = false;
        }
        window.addEventListener('scroll', function () {
            if (!tickingProgress) {
                tickingProgress = true;
                requestAnimationFrame(updateProgress);
            }
        }, { passive: true });
        updateProgress();
    }

    /* =========================
       2. CONTADOR DE CIFRAS
    ========================= */
    var counters = document.querySelectorAll('.impact-number[data-count-to]');
    if (counters.length && 'IntersectionObserver' in window) {
        var countObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                countObserver.unobserve(entry.target);

                var el = entry.target;
                var target = parseFloat(el.getAttribute('data-count-to'));
                var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);

                if (reducedMotion) {
                    el.textContent = target.toFixed(decimals);
                    return;
                }

                var duration = 1400;
                var startTime = null;

                function step(timestamp) {
                    if (!startTime) startTime = timestamp;
                    var progress = Math.min((timestamp - startTime) / duration, 1);
                    var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
                    var value = target * eased;
                    el.textContent = value.toFixed(decimals);
                    if (progress < 1) {
                        requestAnimationFrame(step);
                    } else {
                        el.textContent = target.toFixed(decimals);
                    }
                }
                requestAnimationFrame(step);
            });
        }, { threshold: 0.4 });

        counters.forEach(function (el) { countObserver.observe(el); });
    }

    /* =========================
       3. ACORDEÓN DE FAQ
    ========================= */
    document.querySelectorAll('.faq-toggle').forEach(function (toggle) {
        toggle.addEventListener('click', function () {
            var card = toggle.closest('.faq-card');
            var isOpen = card.classList.contains('open');
            card.classList.toggle('open', !isOpen);
            toggle.setAttribute('aria-expanded', String(!isOpen));
        });
    });

    /* =========================
       3b. CARRUSEL DE TESTIMONIOS
       Cambia solo cada pocos segundos, con flechas, puntos y
       deslizar con el dedo en celular. Se pausa al pasar el mouse,
       con foco de teclado, o si la pestaña no está visible.
    ========================= */
    var carousel = document.getElementById('testimonialsCarousel');
    var track = document.getElementById('testimonialsTrack');
    var dotsWrap = document.getElementById('testimonialsDots');
    var prevBtn = document.getElementById('testimonialPrev');
    var nextBtn = document.getElementById('testimonialNext');

    if (carousel && track && dotsWrap) {
        var cards = Array.prototype.slice.call(track.querySelectorAll('.testimonial-card'));

        if (cards.length > 1) {
            var current = cards.findIndex(function (c) { return c.classList.contains('is-active'); });
            if (current < 0) current = 0;
            var autoplayTimer = null;
            var autoplayDelay = 6000;

            // Construir los puntos dinámicamente según cuántos testimonios haya
            cards.forEach(function (_, i) {
                var dot = document.createElement('button');
                dot.type = 'button';
                dot.className = 'testimonials-dot';
                dot.setAttribute('role', 'tab');
                dot.setAttribute('aria-label', 'Ver testimonio ' + (i + 1) + ' de ' + cards.length);
                dot.addEventListener('click', function () {
                    goTo(i);
                    restartAutoplay();
                });
                dotsWrap.appendChild(dot);
            });
            var dots = Array.prototype.slice.call(dotsWrap.children);

            function render() {
                cards.forEach(function (card, i) {
                    var isActive = i === current;
                    card.classList.toggle('is-active', isActive);
                    dots[i].classList.toggle('is-active', isActive);
                    dots[i].setAttribute('aria-selected', String(isActive));
                });
                if (reducedMotion) {
                    var activeCard = cards[current];
                    activeCard.classList.add('is-visible');
                } else {
                    requestAnimationFrame(function () {
                        requestAnimationFrame(function () {
                            cards[current].classList.add('is-visible');
                        });
                    });
                }
            }

            function goTo(index) {
                cards[current].classList.remove('is-visible');
                current = (index + cards.length) % cards.length;
                render();
            }

            function next() { goTo(current + 1); }
            function prev() { goTo(current - 1); }

            function startAutoplay() {
                if (reducedMotion || document.hidden) return;
                stopAutoplay();
                autoplayTimer = window.setInterval(next, autoplayDelay);
            }
            function stopAutoplay() {
                if (autoplayTimer) window.clearInterval(autoplayTimer);
                autoplayTimer = null;
            }
            function restartAutoplay() {
                stopAutoplay();
                startAutoplay();
            }

            if (nextBtn) nextBtn.addEventListener('click', function () { next(); restartAutoplay(); });
            if (prevBtn) prevBtn.addEventListener('click', function () { prev(); restartAutoplay(); });

            // Pausa al pasar el mouse o al enfocar con el teclado
            carousel.addEventListener('mouseenter', stopAutoplay);
            carousel.addEventListener('mouseleave', startAutoplay);
            carousel.addEventListener('focusin', stopAutoplay);
            carousel.addEventListener('focusout', startAutoplay);

            // Deslizar con el dedo en celular
            var touchStartX = null;
            track.addEventListener('touchstart', function (e) {
                touchStartX = e.changedTouches[0].clientX;
                stopAutoplay();
            }, { passive: true });
            track.addEventListener('touchend', function (e) {
                if (touchStartX === null) return;
                var dx = e.changedTouches[0].clientX - touchStartX;
                if (Math.abs(dx) > 40) {
                    if (dx < 0) next(); else prev();
                }
                touchStartX = null;
                startAutoplay();
            }, { passive: true });

            // No gastar CPU en pestañas ocultas
            document.addEventListener('visibilitychange', function () {
                if (document.hidden) stopAutoplay(); else startAutoplay();
            });

            render();
            startAutoplay();
        }
    }

    /* =========================
       4. CONFETI AL ENVIAR EL FORMULARIO
       Expuesto como window.guatilaConfetti() para que el
       script del formulario lo llame al confirmar el envío.
    ========================= */
    window.guatilaConfetti = function () {
        if (reducedMotion) return; // no gastar movimiento si el usuario lo pidió así

        var colors = ['#B0563A', '#A6854C', '#E7C4AE', '#6B7455'];
        var count = 26;

        for (var i = 0; i < count; i++) {
            (function () {
                var piece = document.createElement('div');
                piece.className = 'confetti-piece';
                piece.style.left = (Math.random() * 100) + 'vw';
                piece.style.background = colors[Math.floor(Math.random() * colors.length)];
                piece.style.setProperty('--confetti-rot', (300 + Math.random() * 400) + 'deg');
                var duration = 2.4 + Math.random() * 1.4;
                piece.style.animationDuration = duration + 's';
                piece.style.animationDelay = (Math.random() * 0.3) + 's';

                document.body.appendChild(piece);
                window.setTimeout(function () {
                    piece.remove();
                }, (duration + 0.4) * 1000);
            })();
        }
    };

    /* =========================
       5. TOGGLE DE IDIOMA (ES/EN)
       Traduce el contenido marcado con data-en-html (y los
       placeholders marcados con data-en-placeholder) sin recargar
       la página. Guarda la preferencia en este navegador.
    ========================= */
    var langToggle = document.getElementById('langToggle');
    if (langToggle) {
        var currentLang = 'es';
        try {
            currentLang = window.localStorage.getItem('guatila-lang') || 'es';
        } catch (e) { /* almacenamiento no disponible: se queda en español */ }

        var experienceStepsForLang = document.querySelectorAll('.experience-step');

        function applyLang(lang) {
            document.documentElement.lang = (lang === 'en') ? 'en' : 'es';

            document.querySelectorAll('[data-en-html]').forEach(function (el) {
                if (el.dataset.esHtml === undefined) el.dataset.esHtml = el.innerHTML;
                el.innerHTML = (lang === 'en') ? el.getAttribute('data-en-html') : el.dataset.esHtml;
            });

            document.querySelectorAll('[data-en-placeholder]').forEach(function (el) {
                if (el.dataset.esPlaceholder === undefined) el.dataset.esPlaceholder = el.getAttribute('placeholder') || '';
                el.setAttribute('placeholder', (lang === 'en') ? el.getAttribute('data-en-placeholder') : el.dataset.esPlaceholder);
            });

            document.querySelectorAll('[data-en-aria-label]').forEach(function (el) {
                if (el.dataset.esAriaLabel === undefined) el.dataset.esAriaLabel = el.getAttribute('aria-label') || '';
                el.setAttribute('aria-label', (lang === 'en') ? el.getAttribute('data-en-aria-label') : el.dataset.esAriaLabel);
            });

            // El panel grande de "Experiencia" muestra el detalle del paso
            // activo; lo volvemos a pintar en el idioma correcto.
            var activeStep = document.querySelector('.experience-step.active');
            var detailText = document.getElementById('detailText');
            if (activeStep && detailText) {
                var attr = (lang === 'en') ? 'data-detail-en' : 'data-detail';
                var detail = activeStep.getAttribute(attr) || activeStep.getAttribute('data-detail');
                detailText.textContent = detail;
            }

            langToggle.setAttribute('data-lang', lang);
            langToggle.setAttribute('aria-pressed', String(lang === 'en'));
            langToggle.setAttribute('aria-label', (lang === 'en') ? 'Cambiar a español' : 'Switch to English');
        }

        // Si el usuario hace clic en un paso de la experiencia, mostrar
        // el detalle en el idioma actualmente activo.
        experienceStepsForLang.forEach(function (step) {
            step.addEventListener('click', function () {
                var detailText = document.getElementById('detailText');
                if (!detailText) return;
                var attr = (currentLang === 'en') ? 'data-detail-en' : 'data-detail';
                var detail = step.getAttribute(attr) || step.getAttribute('data-detail');
                detailText.textContent = detail;
            });
        });

        applyLang(currentLang);

        langToggle.addEventListener('click', function () {
            currentLang = (currentLang === 'es') ? 'en' : 'es';
            try { window.localStorage.setItem('guatila-lang', currentLang); } catch (e) { /* ignorar */ }
            applyLang(currentLang);
        });
    }

})();

