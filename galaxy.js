import * as THREE from 'three';

const canvas = document.querySelector('canvas.webgl');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

function init() {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
  const pr = Math.min(devicePixelRatio, 2);
  renderer.setPixelRatio(pr);
  renderer.setSize(innerWidth, innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 3.2, 7);

  // Галактика
  const P = { count: innerWidth < 700 ? 35000 : 90000, radius: 6.5, branches: 4, spin: 1.1, rnd: 0.4, pow: 3.2 };
  const pos = new Float32Array(P.count * 3), col = new Float32Array(P.count * 3), sc = new Float32Array(P.count);
  const cIn = new THREE.Color('#ff7a45'), cOut = new THREE.Color('#3b5bdb');
  for (let i = 0; i < P.count; i++) {
    const r = Math.random() * P.radius;
    const a = ((i % P.branches) / P.branches) * Math.PI * 2 + r * P.spin;
    const rr = () => Math.pow(Math.random(), P.pow) * (Math.random() < 0.5 ? 1 : -1) * P.rnd * r;
    pos.set([Math.cos(a) * r + rr(), rr() * 0.6, Math.sin(a) * r + rr()], i * 3);
    const c = cIn.clone().lerp(cOut, r / P.radius);
    col.set([c.r, c.g, c.b], i * 3);
    sc[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aScale', new THREE.BufferAttribute(sc, 1));

  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 }, uSize: { value: 30 * pr },
      uPointer: { value: new THREE.Vector2(10, 10) }, uAspect: { value: innerWidth / innerHeight },
    },
    vertexShader: `
      uniform float uSize, uTime, uAspect; uniform vec2 uPointer;
      attribute vec3 aColor; attribute float aScale; varying vec3 vColor;
      void main() {
        vec4 p = modelMatrix * vec4(position, 1.0);
        float d = length(p.xz);
        float a = atan(p.z, p.x) + (1.0 / (d + 0.4)) * uTime * 0.35;
        p.x = cos(a) * d; p.z = sin(a) * d;
        vec4 mv = viewMatrix * p;
        vec4 clip = projectionMatrix * mv;
        vec2 diff = clip.xy / clip.w - uPointer; diff.x *= uAspect;
        float f = smoothstep(0.38, 0.0, length(diff));
        vec2 push = normalize(diff + 0.0001) * f * 0.09; push.x /= uAspect;
        clip.xy += push * clip.w;
        gl_Position = clip;
        gl_PointSize = uSize * aScale * (1.0 + f * 1.8) / -mv.z;
        vColor = aColor + f * 0.35;
      }`,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        float s = pow(clamp(1.0 - distance(gl_PointCoord, vec2(0.5)) * 2.0, 0.0, 1.0), 3.0);
        gl_FragColor = vec4(vColor * s, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const galaxy = new THREE.Points(geo, mat);
  scene.add(galaxy);

  // Дальние звёзды
  const sp = new Float32Array(1800 * 3);
  for (let i = 0; i < 1800; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(30 + Math.random() * 30);
    sp.set([v.x, v.y, v.z], i * 3);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ size: 0.12, color: '#cfd6ff', transparent: true, opacity: 0.7, depthWrite: false })));

  // Управление
  const target = new THREE.Vector2(10, 10), look = new THREE.Vector2();
  let scroll = 0, scrollT = 0;
  addEventListener('pointermove', (e) => {
    target.set((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1));
    if (mat.uniforms.uPointer.value.x > 5) mat.uniforms.uPointer.value.copy(target);
  });
  document.addEventListener('mouseleave', () => target.set(10, 10));
  addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    scrollT = max > 0 ? scrollY / max : 0;
  }, { passive: true });
  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    mat.uniforms.uAspect.value = camera.aspect;
  });

  const clock = new THREE.Clock();
  (function tick() {
    const t = reduce ? 0 : clock.getElapsedTime();
    mat.uniforms.uTime.value = t;
    if (!reduce) mat.uniforms.uPointer.value.lerp(target, 0.12);
    scroll += (scrollT - scroll) * 0.05;
    look.lerp(new THREE.Vector2(Math.max(-1, Math.min(1, target.x)), Math.max(-1, Math.min(1, target.y))), 0.05);
    galaxy.rotation.y = t * 0.02 + scroll * 1.6;
    galaxy.rotation.x = look.y * 0.08;
    galaxy.rotation.z = look.x * 0.05;
    camera.position.set(0, 3.2 + scroll * 5, 7 - scroll * 3);
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    document.body.classList.add('ready');
    requestAnimationFrame(tick);
  })();
}

try { init(); } catch (e) { console.warn('WebGL недоступен:', e); document.body.classList.add('ready'); }
