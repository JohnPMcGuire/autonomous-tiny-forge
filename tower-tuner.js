(() => {
  const APP = {
    name: 'Tower Tuner', emoji: '📡', category: 'play', version: '1.0.0',
    summary: 'Tune a city radio grid by balancing coverage, interference, heat, budget, and emergency callers.',
    description: 'A local spectrum-strategy game with antenna placement, frequency choices, emergency callers, interference, heat, budget, adaptive shifts, recoverable outages, session-only storm-band unlocks, scoring, responsive SVG rendering, touch and keyboard controls, reduced-motion behavior, optional audio, and teardown.'
  };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const label = (v) => v === 'play' ? 'Play' : v === 'useful' ? 'Useful' : 'Experiment';

  function style() {
    if ($('#tower-tuner-styles')) return;
    const s = document.createElement('style');
    s.id = 'tower-tuner-styles';
    s.textContent = `.tower-card{animation:tower-rise .24s ease both}.tower-game{max-width:1080px;gap:14px}.tower-hud{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.tower-stat{border:1px solid var(--line);border-radius:15px;background:#fff;padding:10px 12px}.tower-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.tower-stat strong{display:block;margin-top:4px}.tower-board{display:grid;grid-template-columns:1fr .85fr;gap:10px}.tower-map{border:0;border-radius:28px;background:#06111f;color:white;padding:0;overflow:hidden;touch-action:none;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}.tower-map:focus-visible{outline:4px solid var(--accent);outline-offset:4px}.tower-map svg{display:block;width:100%;height:min(58vh,520px);min-height:360px}.tower-panel{border:1px solid var(--line);border-radius:18px;background:#fff;padding:13px}.tower-tools,.tower-modes{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.tower-chip{border:1px solid var(--line);border-radius:999px;background:#fff;color:var(--ink);padding:8px 11px;font-weight:900}.tower-chip.is-active{background:#111827;color:#fff}.tower-log{min-height:100px;padding:17px 19px}.tower-meter{height:12px;border-radius:999px;background:#e9f4ff;overflow:hidden;margin-top:8px}.tower-meter span{display:block;height:100%;width:30%;background:linear-gradient(90deg,#93c5fd,#a7f3d0,#facc15)}@media(max-width:780px){.tower-hud{grid-template-columns:repeat(2,1fr)}.tower-board{grid-template-columns:1fr}.tower-map svg{height:54vh;min-height:340px}}@media(prefers-reduced-motion:reduce){.tower-card{animation:none}.tower-map svg{min-height:330px}}@keyframes tower-rise{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}`;
    document.head.append(s);
  }

  function addCard() {
    const grid = $('#app-grid'), tpl = $('#app-card-template');
    if (!grid || !tpl || $('[data-tower-card]')) return;
    const f = $('.filter.is-active')?.dataset.filter || 'all';
    if (f !== 'all' && f !== APP.category) return;
    style();
    const node = tpl.content.cloneNode(true), card = $('.app-card', node);
    card.dataset.category = APP.category; card.dataset.towerCard = 'true'; card.classList.add('tower-card');
    $('.app-icon', node).textContent = APP.emoji;
    $('.app-meta', node).textContent = `${label(APP.category)} · v${APP.version}`;
    $('.app-name', node).textContent = APP.name;
    $('.app-summary', node).textContent = APP.summary;
    const btn = $('.app-card-button', node);
    btn.setAttribute('aria-label', `Open ${APP.name}`);
    btn.addEventListener('click', open);
    grid.append(node);
  }

  function boot() {
    style();
    let tries = 0;
    const retry = () => { addCard(); if (!$('[data-tower-card]') && tries++ < 20) setTimeout(retry, 120); };
    retry();
    $$('.filter').forEach((b) => {
      if (b.dataset.towerRefresh) return;
      b.dataset.towerRefresh = '1';
      b.addEventListener('click', () => setTimeout(addCard, 0));
    });
  }

  function open() {
    const dialog = $('#app-dialog'), stage = $('#app-stage'), title = $('#dialog-title'), cat = $('#dialog-category'), desc = $('#dialog-description'), fb = $('#dialog-feedback');
    if (!dialog || !stage) return;
    title.textContent = APP.name; cat.textContent = `${label(APP.category)} · ${APP.emoji}`; desc.textContent = APP.description;
    fb.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Tower%20Tuner';
    stage.replaceChildren(); game(stage, dialog); dialog.showModal();
  }

  function game(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel tower-game';
    root.innerHTML = `<div class="tower-hud"><div class="tower-stat"><span>Shift</span><strong id="tt-shift">1 / 6</strong></div><div class="tower-stat"><span>Budget</span><strong id="tt-budget">10</strong></div><div class="tower-stat"><span>Served</span><strong id="tt-served">0</strong></div><div class="tower-stat"><span>Noise</span><strong id="tt-noise">0</strong></div><div class="tower-stat"><span>Heat</span><strong id="tt-heat">0</strong></div><div class="tower-stat"><span>Score</span><strong id="tt-score">0</strong></div></div><div class="tower-board"><button class="tower-map" type="button" aria-label="Tower Tuner city map. Use arrow keys to move, one for blue, two for green, three for amber, Enter to place or retune, Space to run the shift, and N for a new shift."><svg role="img" aria-label="Radio tower city grid"></svg></button><div class="tower-panel"><strong>Dispatch board</strong><p id="tt-task"></p><div class="tower-meter"><span id="tt-meter"></span></div><div class="tower-modes"><button class="tower-chip is-active" type="button" data-band="blue">1 Blue</button><button class="tower-chip" type="button" data-band="green">2 Green</button><button class="tower-chip" type="button" data-band="amber">3 Amber</button></div><div class="tower-tools"><button class="button button-secondary tower-chip" type="button" data-act="place">Place tower</button><button class="button button-secondary tower-chip" type="button" data-act="shield">Add filter</button><button class="button button-secondary tower-chip" type="button" data-act="run">Run shift</button><button class="button button-secondary tower-chip" type="button" data-act="new">New shift</button></div><p><small>Goal: cover callers with matching frequencies. Towers cover nearby blocks, filters reduce interference, and every run adds heat.</small></p></div></div><div class="result-card tower-log" aria-live="polite"></div><div class="tool-actions"></div>`;
    stage.append(root);
    const svg = $('svg', root), board = $('.tower-map', root), log = $('.tower-log', root), meter = $('#tt-meter', root), reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const bands = { blue:'#93c5fd', green:'#86efac', amber:'#facc15' };
    const st = { shift:1, shifts:6, budget:10, heat:0, score:0, cursor:27, band:'blue', storm:false, audio:false, ac:null, anim:0, cells:[], callers:[] };
    const W = 8, H = 8, N = W * H;
    $('.tool-actions', root).append(btn('Storm band', storm, true), btn('Sound off', sound, true));
    $$('[data-band]', root).forEach((b) => b.addEventListener('click', () => setBand(b.dataset.band)));
    $$('[data-act]', root).forEach((b) => b.addEventListener('click', () => action(b.dataset.act)));
    board.addEventListener('keydown', key); board.addEventListener('click', place); board.addEventListener('pointerdown', point); dialog.addEventListener('close', tear, { once:true });
    newShift();

    function btn(t,f,sec){const b=document.createElement('button');b.type='button';b.className=sec?'button button-secondary':'button';b.textContent=t;b.addEventListener('click',f);return b;}
    function say(h){log.innerHTML=h;}
    function seed(){st.cells=Array.from({length:N},()=>({tower:null,filter:false})); const starts=[9,14,22,41,46,54,4,59,33,27]; const list=['blue','green','amber','blue','green','amber','blue','green','amber','blue']; st.callers=starts.slice(0,5+Math.floor(st.shift/2)+(st.storm?2:0)).map((i,n)=>({i,band:list[(n+st.shift)%list.length],urgent:n%3===0})); st.cells[27].tower='blue';}
    function newShift(){cancelAnimationFrame(st.anim); Object.assign(st,{budget:st.storm?8:10,heat:0,cursor:27,band:'blue'}); seed(); say(`<strong>Shift ${st.shift} opened.</strong><small>Serve urgent callers first and keep interference below the red line.</small>`); paint(); draw();}
    function dist(a,b){return Math.abs(a%W-b%W)+Math.abs(Math.floor(a/W)-Math.floor(b/W));}
    function coverage(){let served=0, urgent=0, noise=0; st.callers.forEach(c=>{const hits=st.cells.map((cell,i)=>cell.tower&&dist(i,c.i)<=2?{cell,i}:null).filter(Boolean); const match=hits.some(h=>h.cell.tower===c.band); if(match){served++; if(c.urgent) urgent++;} const bad=hits.filter(h=>h.cell.tower!==c.band).length; noise += Math.max(0,bad-(st.cells[c.i].filter?1:0));}); st.cells.forEach((c,i)=>{if(c.tower){st.cells.forEach((o,j)=>{if(i<j&&o.tower&&o.tower===c.tower&&dist(i,j)<=2)noise++;});}}); return {served, urgent, noise};}
    function paint(){const c=coverage(), need=Math.min(st.callers.length, st.storm?7:6); $('#tt-shift',root).textContent=`${st.shift} / ${st.shifts}`; $('#tt-budget',root).textContent=st.budget; $('#tt-served',root).textContent=`${c.served} / ${st.callers.length}`; $('#tt-noise',root).textContent=c.noise; $('#tt-heat',root).textContent=st.heat; $('#tt-score',root).textContent=st.score; $('#tt-task',root).textContent=`Tune ${st.storm?'storm':'normal'} shift ${st.shift}: serve ${need} callers, prioritize urgent dots, keep noise under ${st.storm?8:7}, and avoid heat 12.`; meter.style.width=`${Math.min(100,Math.round((c.served/need)*100))}%`; $$('[data-band]',root).forEach(b=>b.classList.toggle('is-active',b.dataset.band===st.band));}
    function setBand(b){st.band=b; paint(); draw();}
    function place(){if(st.budget<2){say('<strong>Budget exhausted.</strong><small>Run the shift or start over with a new layout.</small>');return;} const cell=st.cells[st.cursor]; cell.tower=st.band; st.budget-=2; st.heat++; say(`<strong>${st.band} tower tuned.</strong><small>Coverage improved, but overlapping bands may add noise.</small>`); beep(520); paint(); draw();}
    function filter(){if(st.budget<1){say('<strong>No budget for a filter.</strong><small>Try running the shift with the current interference.</small>');return;} st.cells[st.cursor].filter=!st.cells[st.cursor].filter; st.budget--; say('<strong>Filter toggled.</strong><small>Filters protect one block from mismatched nearby towers.</small>'); beep(360); paint(); draw();}
    function run(){const c=coverage(), need=Math.min(st.callers.length, st.storm?7:6), pass=c.served>=need&&c.noise<(st.storm?8:7)&&st.heat<12; st.heat+=2; if(pass){const gain=180+c.served*45+c.urgent*70+st.budget*18-c.noise*16-st.heat*6; st.score+=Math.max(50,Math.round(gain)); beep(820); if(st.shift<st.shifts){st.shift++; say(`<strong>Shift cleared.</strong><small>${c.served} callers connected with ${c.noise} noise. Next map adds pressure.</small>`); newShift();} else say(`<strong>Run complete: ${st.score}.</strong><small>${st.score>=1600?'Storm band unlocked for this session.':'Reach 1600 to unlock storm band.'}</small>`);} else {st.score=Math.max(0,st.score-90); st.budget+=2; st.heat=Math.max(0,st.heat-3); beep(190); say('<strong>Outage contained.</strong><small>Two emergency budget restored. Retune overlapping towers or add filters.</small>');} paint(); draw();}
    function action(k){if(k==='place')place(); if(k==='shield')filter(); if(k==='run')run(); if(k==='new')newShift();}
    function storm(e){if(!st.storm&&st.score<1600)return say('<strong>Storm band locked.</strong><small>Score 1600 in normal shifts to unlock more callers and tighter budget.</small>'); st.storm=!st.storm; st.shift=1; newShift(); say(`<strong>${st.storm?'Storm':'Normal'} band active.</strong><small>${st.storm?'More emergency callers, less budget, bigger scoring upside.':'Normal dispatch restored.'}</small>`); if(e?.currentTarget)e.currentTarget.setAttribute('aria-pressed',String(st.storm));}
    function point(e){const r=svg.getBoundingClientRect(), x=(e.clientX-r.left)/r.width, y=(e.clientY-r.top)/r.height; st.cursor=Math.max(0,Math.min(W-1,Math.floor(x*W)))+Math.max(0,Math.min(H-1,Math.floor(y*H)))*W; paint(); draw();}
    function key(e){const k=e.key.toLowerCase(); if(k==='1'){e.preventDefault();setBand('blue');} if(k==='2'){e.preventDefault();setBand('green');} if(k==='3'){e.preventDefault();setBand('amber');} if(k==='arrowright'){e.preventDefault();st.cursor=Math.min(N-1,st.cursor+1);draw();} if(k==='arrowleft'){e.preventDefault();st.cursor=Math.max(0,st.cursor-1);draw();} if(k==='arrowdown'){e.preventDefault();st.cursor=Math.min(N-1,st.cursor+W);draw();} if(k==='arrowup'){e.preventDefault();st.cursor=Math.max(0,st.cursor-W);draw();} if(k==='enter'){e.preventDefault();place();} if(k===' '){e.preventDefault();run();} if(k==='n'){e.preventDefault();newShift();}}
    function draw(){const size=720, cell=size/W, c=coverage(); let h=`<rect width="720" height="720" fill="#06111f"/>`; for(let y=0;y<H;y++){for(let x=0;x<W;x++){const i=y*W+x, d=st.cells[i]; h+=`<rect x="${x*cell+3}" y="${y*cell+3}" width="${cell-6}" height="${cell-6}" rx="14" fill="${d.filter?'#10294a':'#0b1c31'}" stroke="rgba(255,255,255,.08)"/>`; if(d.filter)h+=`<circle cx="${x*cell+cell/2}" cy="${y*cell+cell/2}" r="${cell*.34}" fill="none" stroke="#c4b5fd" stroke-width="4" opacity=".7"/>`; if(d.tower){const color=bands[d.tower]; h+=`<circle cx="${x*cell+cell/2}" cy="${y*cell+cell/2}" r="${cell*.18}" fill="${color}"/><circle cx="${x*cell+cell/2}" cy="${y*cell+cell/2}" r="${cell*.46}" fill="${color}" opacity=".13"/>`;}}} st.callers.forEach(ca=>{const x=(ca.i%W)*cell+cell/2,y=Math.floor(ca.i/W)*cell+cell/2,col=bands[ca.band]; h+=`<path d="M ${x} ${y-cell*.22} L ${x+cell*.22} ${y+cell*.18} L ${x-cell*.22} ${y+cell*.18} Z" fill="${col}" stroke="white" stroke-width="${ca.urgent?5:2}"/>`;}); const pulse=reduced?0:(Math.sin(Date.now()/280)+1)*3, cx=(st.cursor%W)*cell+cell/2, cy=Math.floor(st.cursor/W)*cell+cell/2; h+=`<circle cx="${cx}" cy="${cy}" r="${cell*.43+pulse}" fill="none" stroke="#fff2bd" stroke-width="5"/><text x="360" y="696" text-anchor="middle" fill="rgba(255,255,255,.78)" font-size="22" font-weight="800">Served ${c.served} · Noise ${c.noise} · Band ${st.band}</text>`; svg.setAttribute('viewBox','0 0 720 720'); svg.innerHTML=h; if(!reduced)st.anim=requestAnimationFrame(draw);}
    function sound(e){const A=window.AudioContext||window.webkitAudioContext; if(!A)return say('<strong>Sound is not available here.</strong><small>The game still works without audio.</small>'); st.audio=!st.audio; e.currentTarget.textContent=st.audio?'Sound on':'Sound off'; e.currentTarget.setAttribute('aria-pressed',String(st.audio)); st.ac ||= new A(); st.ac.resume(); beep(600);}
    function beep(f){if(!st.audio||!st.ac)return; const now=st.ac.currentTime,o=st.ac.createOscillator(),g=st.ac.createGain(); o.type='sine'; o.frequency.setValueAtTime(f,now); g.gain.setValueAtTime(.0001,now); g.gain.exponentialRampToValueAtTime(.06,now+.02); g.gain.exponentialRampToValueAtTime(.0001,now+.18); o.connect(g).connect(st.ac.destination); o.start(now); o.stop(now+.2);}
    function tear(){cancelAnimationFrame(st.anim); if(st.ac)st.ac.close();}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
