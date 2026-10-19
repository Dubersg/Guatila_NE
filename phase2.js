/* =========================================================
   GUATILA · EL TESORO VERDE — FASE 2 (JS)
   Da vida a las reglas de phase2.css: entrada del hero,
   parallax sutil, hojas ocasionales (con easter egg clicable)
   y reveals direccionales.
   Todo respeta prefers-reduced-motion y usa sólo
   transform/opacity + IntersectionObserver + rAF.
   No depende de librerías externas.
========================================================= */

(function () {
    'use strict';

    var reducedMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // En gama baja / ahorro de datos, tratamos los adornos igual
    // que si el usuario hubiera pedido "reducir movimiento": no
    // hay hojas ni parallax, pero el resto de la página funciona igual.
    var perfLite = document.documentElement.classList.contains('perf-lite');
    var skipExtras = reducedMotion || perfLite;

    /* =========================
       2. ENTRADA DEL HERO
    ========================= */
    var hero = document.querySelector('.hero');
    if (hero && !reducedMotion) { // la entrada del hero se mantiene incluso en perf-lite: es una sola vez, no un bucle
        hero.classList.add('hero-anim-ready');
        // Un frame extra para asegurar que el navegador pinte el
        // estado inicial antes de animar hacia el estado final.
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                hero.classList.add('hero-anim-in');
            });
        });
    }

    /* =========================
       3. PARALLAX SUTIL DEL HERO
       (sólo transform, con rAF y sólo mientras el hero es visible)
    ========================= */
    var heroLayer = document.querySelector('.hero-parallax-layer');
    if (heroLayer && !skipExtras && 'IntersectionObserver' in window) {
        var ticking = false;
        var heroVisible = false;

        function onScroll() {
            if (!heroVisible || ticking) return;
            ticking = true;
            requestAnimationFrame(function () {
                var offset = Math.min(window.scrollY * 0.12, 60);
                heroLayer.style.transform = 'translate3d(0,' + offset + 'px,0) scale(1.06)';
                ticking = false;
            });
        }

        var heroObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                heroVisible = entry.isIntersecting;
                if (!heroVisible) {
                    heroLayer.style.transform = '';
                }
            });
        }, { threshold: 0 });

        heroObserver.observe(hero);
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    /* =========================
       4. HOJAS OCASIONALES
       Una hoja discreta cruzando el hero de vez en cuando.
       Nunca más de una a la vez; nada de "lluvia" de partículas.
    ========================= */
    if (hero && !skipExtras) {
        var leafActive = false;

        // Datos curiosos muy cortos: el detalle "kul" al atrapar una hoja.
        var leafFacts = [
            'Trepa hasta 12 m 🌿',
            'Toda la mata se aprovecha 🍃',
            'Prima del pepino 🥒',
            'Su semilla también se come 🌱',
            'Casi toda agua 💧',
            'Fruto de enredadera 🌎'
        ];
        var leafFactIndex = 0;

        function showLeafFact(x, y) {
            var bubble = document.createElement('span');
            bubble.className = 'leaf-fact-bubble';
            bubble.setAttribute('aria-hidden', 'true');
            bubble.textContent = leafFacts[leafFactIndex % leafFacts.length];
            leafFactIndex++;
            bubble.style.left = x + 'px';
            bubble.style.top = (y - 14) + 'px';
            document.body.appendChild(bubble);

            requestAnimationFrame(function () {
                bubble.classList.add('visible');
            });

            window.setTimeout(function () {
                bubble.classList.remove('visible');
                window.setTimeout(function () { bubble.remove(); }, 300);
            }, 1600);
        }

        function spawnLeaf() {
            if (leafActive || document.hidden) return;
            var rect = hero.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top > window.innerHeight) return; // hero fuera de vista

            leafActive = true;

            var leaf = document.createElement('div');
            leaf.className = 'leaf-particle';
            leaf.setAttribute('aria-hidden', 'true');
            leaf.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13c0-6 5-9 15-9 0 10-4 15-11 15-2 0-4-1-4-3z"/><path d="M6 18c3-4 6-7 12-11"/></svg>';

            var startX = 10 + Math.random() * 70; // % del ancho del hero
            var dx = 160 + Math.random() * 140;
            var dy = 200 + Math.random() * 160;
            var rot = 140 + Math.random() * 160;
            var duration = 7 + Math.random() * 3;

            leaf.style.left = startX + '%';
            leaf.style.top = '-5%';
            leaf.style.setProperty('--leaf-dx', dx + 'px');
            leaf.style.setProperty('--leaf-dy', dy + 'px');
            leaf.style.setProperty('--leaf-rot', rot + 'deg');
            leaf.style.animationDuration = duration + 's';

            leaf.addEventListener('animationend', function () {
                leaf.remove();
                leafActive = false;
            });

            leaf.addEventListener('click', function (e) {
                if (leaf.classList.contains('leaf-particle--caught')) return; // ya atrapada, no repetir
                leaf.classList.add('leaf-particle--caught');
                showLeafFact(e.clientX, e.clientY);
                window.setTimeout(function () {
                    leaf.classList.remove('leaf-particle--caught');
                }, 900);
            });

            hero.appendChild(leaf);
        }

        function scheduleLeaf() {
            var delay = 9000 + Math.random() * 8000; // cada 9-17s aprox.
            window.setTimeout(function () {
                spawnLeaf();
                scheduleLeaf();
            }, delay);
        }

        scheduleLeaf();
    }

    /* =========================
       5. REVEAL DIRECCIONAL EN ENCABEZADOS DE SECCIÓN
       Usa las clases reveal-fx / reveal-fx--left / reveal-fx--right
       ya definidas en phase2.css, dando ritmo sin abusar.
    ========================= */
    var headings = document.querySelectorAll('.section-heading');
    if (headings.length && 'IntersectionObserver' in window) {
        headings.forEach(function (heading, index) {
            heading.classList.add('reveal-fx', index % 2 === 0 ? 'reveal-fx--left' : 'reveal-fx--right');
        });

        var headingObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    headingObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

        headings.forEach(function (heading) {
            headingObserver.observe(heading);
        });
    }

    /* =========================
       6. RELOJ DE TÁMARA (sección Contacto)
       Un solo setInterval de 1s que sólo mueve 3 líneas (transform)
       y actualiza un texto. Costo prácticamente nulo, funciona
       igual de bien en un celular de gama baja que en un PC.
       Se pausa solo cuando la pestaña no está visible.
    ========================= */
    var clockHour = document.getElementById('clockHour');
    var clockMinute = document.getElementById('clockMinute');
    var clockSecond = document.getElementById('clockSecond');
    var clockDigital = document.getElementById('clockDigital');

    if (clockHour && clockMinute && clockSecond && clockDigital) {

        var clockFormatter = new Intl.DateTimeFormat('es-CO', {
            timeZone: 'America/Bogota',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        function tickClock() {
            if (document.hidden) return; // no gastar CPU en pestañas ocultas

            var parts = clockFormatter.formatToParts(new Date());
            var h = 0, m = 0, s = 0;
            parts.forEach(function (p) {
                if (p.type === 'hour') h = parseInt(p.value, 10);
                if (p.type === 'minute') m = parseInt(p.value, 10);
                if (p.type === 'second') s = parseInt(p.value, 10);
            });

            var hourDeg = (h % 12) * 30 + m * 0.5;
            var minuteDeg = m * 6 + s * 0.1;
            var secondDeg = s * 6;

            clockHour.style.transform = 'rotate(' + hourDeg + 'deg)';
            clockMinute.style.transform = 'rotate(' + minuteDeg + 'deg)';
            clockSecond.style.transform = 'rotate(' + secondDeg + 'deg)';

            var pad = function (n) { return String(n).padStart(2, '0'); };
            clockDigital.textContent = pad(h) + ':' + pad(m) + ':' + pad(s);
        }

        tickClock();
        setInterval(tickClock, 1000);
    }

})();
