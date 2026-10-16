(() => {
  const fmt = (n) => n.toLocaleString('ru-RU') + ' $';

  // Каталог: меняйте названия, описания и цены здесь
  const planets = [
    { id: 'karmin', name: 'Кармин', type: 'rocky', label: 'Скалистая', desc: 'Пустынный мир с красными каньонами и двумя тусклыми лунами.', d: '12 400 км', day: '26 ч', far: '42 св. года', price: 4200000, c: ['#b8452e', '#e0734f', '#6e2418'], glow: '#ff7a45' },
    { id: 'lazuria', name: 'Лазурия', type: 'rocky', label: 'Скалистая', desc: 'Океанический мир: суша — только архипелаги, остальное тёплая вода.', d: '13 100 км', day: '31 ч', far: '18 св. лет', price: 9800000, c: ['#1f5fb4', '#3fa3d9', '#e8f4ff'], glow: '#4cc3ff' },
    { id: 'moh', name: 'Мох', type: 'rocky', label: 'Скалистая', desc: 'Покрыта зелёными лесами из лишайников. Воздух пригоден после фильтра.', d: '9 700 км', day: '19 ч', far: '67 св. лет', price: 3100000, c: ['#2f7d46', '#7cc46a', '#1d4a2b'], glow: '#7cff9a' },
    { id: 'gigas9', name: 'Гигас-9', type: 'gas', label: 'Газовый гигант', desc: 'Кольца из льда и пыли. Подходит для орбитальных станций.', d: '142 000 км', day: '9 ч', far: '210 св. лет', price: 24000000, ring: true, c: ['#c98b4a', '#e8c28a', '#8a5a2c'], glow: '#ffb454' },
    { id: 'aurum', name: 'Аурум', type: 'gas', label: 'Газовый гигант', desc: 'Золотые облака и вечные штормы. Лучшие кадры с орбиты.', d: '98 500 км', day: '11 ч', far: '144 св. года', price: 17500000, c: ['#d9a93a', '#f3d58a', '#a2701e'], glow: '#ffd36b' },
    { id: 'frost', name: 'Фрост', type: 'ice', label: 'Ледяная', desc: 'Гладкие ледяные равнины и океан подо льдом. Тишина гарантирована.', d: '15 800 км', day: '40 ч', far: '96 св. лет', price: 6400000, c: ['#bfe3f5', '#eaf8ff', '#7fb6d6'], glow: '#9fe6ff' },
  ];

  const $ = (s) => document.querySelector(s);
  const grid = $('#grid'), cart = $('#cart'), list = $('#cartList'), toastEl = $('#toast');
  let filter = 'all';
  let inCart = [];
  try { inCart = JSON.parse(localStorage.getItem('cart') || '[]').filter((id) => planets.some((p) => p.id === id)); } catch {}

  const orb = (p) => `<div class="orb-wrap ${p.ring ? 'has-ring' : ''}" style="--c1:${p.c[0]};--c2:${p.c[1]};--c3:${p.c[2]};--glow:${p.glow}"><div class="orb ${p.type}"></div></div>`;

  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  function renderGrid() {
    const items = planets.filter((p) => filter === 'all' || p.type === filter);
    grid.innerHTML = items.map((p, n) => `
      <article class="card" style="--n:${n}">
        <div class="stage">${orb(p)}</div>
        <h3>${p.name}</h3><div class="type">${p.label}</div>
        <p>${p.desc}</p>
        <dl><dt>Диаметр</dt><dd>${p.d}</dd><dt>Сутки</dt><dd>${p.day}</dd><dt>От Земли</dt><dd>${p.far}</dd></dl>
        <div class="buy"><span class="price">${fmt(p.price)}</span>
          <button class="btn" data-add="${p.id}" ${inCart.includes(p.id) ? 'disabled' : ''}>${inCart.includes(p.id) ? 'В корзине' : 'В корзину'}</button></div>
      </article>`).join('');
    if (matchMedia('(hover: hover)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      grid.querySelectorAll('.card').forEach((c) => {
        c.addEventListener('pointermove', (e) => {
          const r = c.getBoundingClientRect();
          c.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 10 + 'deg');
          c.style.setProperty('--rx', -((e.clientY - r.top) / r.height - .5) * 10 + 'deg');
        });
        c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
      });
    }
  }

  function renderCart() {
    const items = inCart.map((id) => planets.find((p) => p.id === id));
    list.innerHTML = items.length
      ? items.map((p) => `<li>${orb(p)}<span>${p.name}<br><small>${fmt(p.price)}</small></span><button data-rm="${p.id}" aria-label="Убрать ${p.name}">✕</button></li>`).join('')
      : '<li class="empty">Пока пусто. Выберите планету в каталоге.</li>';
    $('#cartTotal').textContent = fmt(items.reduce((s, p) => s + p.price, 0));
    $('#cartCount').textContent = items.length;
    try { localStorage.setItem('cart', JSON.stringify(inCart)); } catch {}
  }

  const setCart = (open) => { cart.classList.toggle('open', open); cart.inert = !open; if (open) $('#cartClose').focus(); };

  $('#filters').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    filter = b.dataset.f;
    document.querySelectorAll('#filters button').forEach((x) => x.setAttribute('aria-pressed', x === b));
    renderGrid();
  });
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('[data-add]'); if (!b) return;
    inCart.push(b.dataset.add); renderCart(); renderGrid();
    $('#cartBtn').classList.remove('bump'); void $('#cartBtn').offsetWidth; $('#cartBtn').classList.add('bump');
    toast('Планета добавлена в корзину');
  });
  list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-rm]'); if (!b) return;
    inCart = inCart.filter((id) => id !== b.dataset.rm); renderCart(); renderGrid();
  });
  $('#cartBtn').addEventListener('click', () => setCart(true));
  $('#cartClose').addEventListener('click', () => setCart(false));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setCart(false); });
  $('#checkout').addEventListener('click', () => {
    if (!inCart.length) return toast('Сначала выберите планету');
    inCart = []; renderCart(); renderGrid(); setCart(false);
    toast('Заявка принята (демо: данные никуда не отправляются)');
  });

  renderGrid(); renderCart();
})();
