/* ==========================================================
   Blue Marble OS — front-end JS
   - WebGL globe (three.js): realistic textured Earth, clouds,
     atmosphere glow & mission data points
   - Scroll-triggered nav state
   - Scroll reveal animations
   - Mobile nav toggle
   - Footer year
   ========================================================== */

(function () {
  'use strict';

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Scrolled nav ---------- */
  var nav = document.getElementById('nav');
  function onScroll() {
    if (!nav) return;
    if (window.scrollY > 8) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector('.nav__toggle');
  var mobile = document.getElementById('mobileMenu');
  if (toggle && mobile) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      if (open) { mobile.setAttribute('hidden', ''); }
      else      { mobile.removeAttribute('hidden'); }
    });
    mobile.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        toggle.setAttribute('aria-expanded', 'false');
        mobile.setAttribute('hidden', '');
      });
    });
  }

  /* ---------- Scroll reveal ---------- */
  var targets = document.querySelectorAll('.section, .phase, .layer, .mission, .partner, .cta');
  targets.forEach(function (el) { el.classList.add('reveal'); });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Platform screenshot fallback ----------
     If a device mockup image fails to load, show a visible message
     with the attempted path (and log it) instead of leaving the
     screen blank with no clue why. */
  document.querySelectorAll('.device-mockup__screen img').forEach(function (img) {
    img.addEventListener('error', function () {
      var src = img.getAttribute('src');
      console.error('Blue Marble: platform screenshot failed to load — ' + src);
      var screen = img.closest('.device-mockup__screen');
      if (screen) {
        screen.classList.add('device-mockup__screen--error');
        screen.setAttribute('data-error-src', src);
      }
    });
  });

  /* ==========================================================
     HERO GLOBE — realistic textured Earth WebGL visual
     ========================================================== */
  var canvas = document.getElementById('globe');
  if (!canvas || typeof THREE === 'undefined') return;

  // Respect reduced motion: keep the canvas but render a single frame.
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var width  = canvas.clientWidth  || window.innerWidth;
  var height = canvas.clientHeight || window.innerHeight;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height, false);
  if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;

  var scene  = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 0.4, 5.4);

  // Group so we can tilt + spin
  var earth = new THREE.Group();
  earth.rotation.z = THREE.Math.degToRad(18); // axial tilt
  scene.add(earth);

  var EARTH_RADIUS = 1.62;

  /* ---- Earth sphere — realistic day-map texture ----
     Loaded from a CDN mirror of the three.js example assets (NASA "Blue
     Marble" style imagery). A flat ocean-blue fallback colour keeps the
     globe looking correct even if the texture is blocked or offline —
     it just won't show continents until/unless the image loads. */
  var earthMat = new THREE.MeshBasicMaterial({ color: 0x0b2a4a });
  var earthGeo = new THREE.SphereGeometry(EARTH_RADIUS, 96, 96);
  var earthMesh = new THREE.Mesh(earthGeo, earthMat);
  earth.add(earthMesh);

  var textureLoader = new THREE.TextureLoader();
  textureLoader.crossOrigin = 'anonymous';

  var EARTH_TEXTURE_URL  = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/earth_atmos_2048.jpg';
  var CLOUDS_TEXTURE_URL = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/earth_clouds_1024.png';

  textureLoader.load(
    EARTH_TEXTURE_URL,
    function (tex) {
      if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
      earthMat.map = tex;
      earthMat.color.set(0xffffff);
      earthMat.needsUpdate = true;
      // With reduced motion the render loop only fires once, before this async
      // load resolves — force a fresh frame so the texture actually shows up.
      if (reduceMotion) renderer.render(scene, camera);
    },
    undefined,
    function () {
      // Load failed (offline / blocked) — keep the flat ocean-blue sphere, no broken visuals.
      earthMat.color.set(0x0b2a4a);
      if (reduceMotion) renderer.render(scene, camera);
    }
  );

  /* ---- Cloud layer — thin, slightly larger sphere, drifts independently ---- */
  var cloudsMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false
  });
  var cloudsMesh = new THREE.Mesh(new THREE.SphereGeometry(EARTH_RADIUS + 0.02, 96, 96), cloudsMat);
  earth.add(cloudsMesh);

  textureLoader.load(CLOUDS_TEXTURE_URL, function (tex) {
    if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    cloudsMat.map = tex;
    cloudsMat.opacity = 0.4;
    cloudsMat.needsUpdate = true;
    if (reduceMotion) renderer.render(scene, camera);
  });
  // No onError for clouds — purely an embellishment; if it fails to load,
  // opacity simply stays at 0 and the sphere underneath is unaffected.

  /* ---- Atmospheric glow (back-side shader) ---- */
  var atmoMat = new THREE.ShaderMaterial({
    vertexShader: [
      'varying vec3 vNormal;',
      'void main() {',
      '  vNormal = normalize(normalMatrix * normal);',
      '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
      '}'
    ].join('\n'),
    fragmentShader: [
      'varying vec3 vNormal;',
      'void main() {',
      '  float intensity = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);',
      '  gl_FragColor = vec4(0.18, 0.65, 1.0, 1.0) * intensity;',
      '}'
    ].join('\n'),
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false
  });
  var atmo = new THREE.Mesh(new THREE.SphereGeometry(1.8, 64, 64), atmoMat);
  scene.add(atmo);

  /* ---- Star/particle field ---- */
  var STARS = 1200;
  var starPos = new Float32Array(STARS * 3);
  for (var s = 0; s < STARS; s++) {
    var r = 18 + Math.random() * 30;
    var u = Math.random() * 2 - 1;
    var theta = Math.random() * Math.PI * 2;
    var sR = Math.sqrt(1 - u * u);
    starPos[s * 3]     = r * sR * Math.cos(theta);
    starPos[s * 3 + 1] = r * sR * Math.sin(theta);
    starPos[s * 3 + 2] = r * u;
  }
  var starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  var starMat = new THREE.PointsMaterial({
    color: 0xb3e5fc,
    size: 0.07,
    transparent: true,
    opacity: 0.55,
    depthWrite: false
  });
  scene.add(new THREE.Points(starGeo, starMat));

  /* ---- Data points + glow rings (a few accent markers) ---- */
  function addDataPoint(latDeg, lonDeg) {
    var phi   = (90 - latDeg) * Math.PI / 180;
    var theta = (lonDeg + 180) * Math.PI / 180;
    var r2 = EARTH_RADIUS + 0.045; // sits just above the cloud layer
    var x = -r2 * Math.sin(phi) * Math.cos(theta);
    var z =  r2 * Math.sin(phi) * Math.sin(theta);
    var y =  r2 * Math.cos(phi);

    var group = new THREE.Group();
    group.position.set(x, y, z);
    group.lookAt(0, 0, 0); // point inward so ring sits flat on surface

    var pt = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x2dd4ff })
    );
    group.add(pt);

    var ringMat = new THREE.MeshBasicMaterial({
      color: 0x2dd4ff, transparent: true, opacity: 0.7, side: THREE.DoubleSide
    });
    var ring = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.034, 32), ringMat);
    group.add(ring);
    ring.userData = { phase: Math.random() * Math.PI * 2 };

    earth.add(group);
    return ring;
  }

  var rings = [
    addDataPoint(  0,    0), // off Africa
    addDataPoint( 25,  -80), // Caribbean
    addDataPoint(-30,  150), // East of Australia
    addDataPoint( 35,  140), // Japan / Pacific
    addDataPoint(-15,  -75), // Pacific off Peru
    addDataPoint( 55,    8), // North Sea
    addDataPoint(-40,  -60), // South Atlantic
    addDataPoint( 10,   75), // Indian Ocean
    // Land-based conservation regions — reflects the broader wildlife & habitat mission
    addDataPoint( -3,  -60), // Amazon Basin — rainforest
    addDataPoint(  2,   20), // Congo Basin — rainforest
    addDataPoint( -2,   35), // East African savanna — migration corridors
    addDataPoint( 68,  -40)  // Arctic — polar habitat
  ];

  /* ---- Animate ---- */
  var clock = new THREE.Clock();
  function animate() {
    var dt = clock.getDelta();
    var t  = clock.getElapsedTime();

    if (!reduceMotion) {
      earth.rotation.y += dt * 0.035;        // slow, stately rotation — realistic, not "spinning logo"
      cloudsMesh.rotation.y += dt * 0.046;   // clouds drift slightly faster for subtle parallax
    }

    // Pulse rings outward then reset.
    rings.forEach(function (ring) {
      var phase = (t + ring.userData.phase) % 3;
      var k = phase / 3;
      ring.scale.setScalar(1 + k * 4);
      ring.material.opacity = (1 - k) * 0.7;
    });

    renderer.render(scene, camera);
    if (!reduceMotion) requestAnimationFrame(animate);
  }
  animate();

  /* ---- Resize ---- */
  function resize() {
    width  = canvas.clientWidth;
    height = canvas.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();
})();
