(() => {
  const APP = {
    name: 'Metro Dispatch', emoji: '🚇', category: 'play', version: '1.0.0',
    summary: 'Route trains through a growing passenger network while balancing capacity, delays, incidents, energy, and service equity.',
    description: 'A local transit-dispatch strategy game with a live SVG network, three train classes, passenger queues, timed arrivals, incidents, energy and repair tradeoffs, adaptive modes, scoring, session-only express unlock, pointer, touch and keyboard controls, reduced-motion behavior, optional local audio, and teardown.'
  };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const label = (v) => v === 'play' ? 'Play' : v === 'useful' ? 'Useful' : 'Experiment';
  function css() {
    if ($('#metro-dispatch-styles')) return;
    const style = document.createElement('style');
    style.id = 'metro-dispatch-styles';
    style.textContent = `
      .md-card{animation:md-in .24s ease both}.md-game{max-width:1120px;gap:14px}
      .md-hud{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.md-stat,.md-panel,.md-map-wrap,.md-log{border:1px solid var(--line);border-radius:18px;background:#fff}
      .md-stat{padding:9px 11px}.md-stat span{display:block;color:var(--muted);font-size:.6rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.md-stat strong{display:block;margin-top:3px}
      .md-layout{display:grid;grid-template-columns:1.2fr .8fr;gap:12px}.md-map-wrap{padding:10px;background:linear-gradient(145deg,#111827,#263449)}
      .md-map{width:100%;height:auto;min-height:420px;touch-action:manipulation}.md-track{stroke:#64748b;stroke-width:8;stroke-linecap:round}.md-track.active{stroke:#38bdf8}.md-station{cursor:pointer;outline:none}.md-station circle{fill:#fff;stroke:#0f172a;stroke-width:4}.md-station[data-selected='true'] circle{stroke:#fbbf24;stroke-width:7}.md-station:focus-visible circle{stroke:#f472b6;stroke-width:7}.md-station text{font-size:13px;font-weight:900;fill:#fff;paint-order:stroke;stroke:#111827;stroke-width:4px}.md-queue{font-size:11px!important;fill:#fde68a!important}.md-train{transition:transform .42s linear}.md-train circle{stroke:#fff;stroke-width:2}
      .md-panel{padding:14px;display:grid;gap:11px;align-content:start}.md-modes,.md-trains,.md-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.md-panel button{min-height:44px;border:1px solid var(--line);border-radius:14px;background:#fff;font-weight:900}.md-panel button.is-active{box-shadow:0 0 0 3px #0284c7 inset;background:#f0f9ff}.md-panel button[disabled]{opacity:.45;cursor:not-allowed}.md-cost{display:block;font-size:.68rem;color:var(--muted);font-weight:700;margin-top:2px}.md-help{font-size:.8rem;color:var(--muted);margin:0}.md-log{padding:14px;min-height:92px}.md-log small{display:block;margin-top:5px}.md-legend{display:flex;flex-wrap:wrap;gap:10px;color:#dbeafe;font-size:.72rem;margin-top:6px}.md-legend span{display:inline-flex;align-items:center;gap:5px}.md-dot{width:12px;height:12px;border-radius:50%;background:#38bdf8}.md-dot.warn{background:#f59e0b}.md-dot.bad{background:#ef4444}
      @media(max-width:900px){.md-layout{grid-template-columns:1fr}.md-hud{grid-template-columns:repeat(3,1fr)}.md-map{min-height:360px}}
      @media(max-width:560px){.md-hud{grid-template-columns:repeat(2,1fr)}.md-map{min-height:300px}.md-trains,.md-actions{grid-template-columns:1fr 1fr}}
      @media(prefers-reduced-motion:reduce){.md-card{animation:none!important}.md-train{transition:none!important}}@keyframes md-in{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}
    `;
    document.head.append(style);
  }
  function addCard() {
    const grid = $('#app-grid'), template = $('#app-card-template');
    if (!grid || !template || $('[data-metro-dispatch-card]')) return;
    const filter = $('.filter.is-active')?.dataset.filter || 'all';
    if (filter !== 'all' && filter !== APP.category) return;
    css();
    const node = template.content.cloneNode(true), card = $('.app-card', node);
    card.dataset.category = APP.category; card.dataset.metroDispatchCard = 'true'; card.classList.add('md-card');
    $('.app-icon', node).textContent = APP.emoji; $('.app-meta', node).textContent = `${label(APP.category)} · v${APP.version}`;
    $('.app-name', node).textContent = APP.name; $('.app-summary', node).textContent = APP.summary;
    const button = $('.app-card-button', node); button.setAttribute('aria-label', `Open ${APP.name}`); button.addEventListener('click', open);
    grid.append(node);
  }
  function boot() {
    css(); let tries = 0;
    const retry = () => { addCard(); if (!$('[data-metro-dispatch-card]') && tries++ < 20) setTimeout(retry, 120); };
    retry();
    $$('.filter').forEach((button) => { if (button.dataset.mdRefresh) return; button.dataset.mdRefresh = '1'; button.addEventListener('click', () => setTimeout(addCard, 0)); });
  }
  function open() {
    const dialog = $('#app-dialog'), stage = $('#app-stage'); if (!dialog || !stage) return;
    $('#dialog-title').textContent = APP.name; $('#dialog-category').textContent = `${label(APP.category)} · ${APP.emoji}`; $('#dialog-description').textContent = APP.description;
    $('#dialog-feedback').href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Metro%20Dispatch';
    stage.replaceChildren(); game(stage, dialog); dialog.showModal();
  }
  function game(stage, dialog) {
    const root = document.createElement('section'); root.className = 'tool-panel md-game';
    root.innerHTML = `
      <div class="md-hud"><div class="md-stat"><span>Shift</span><strong id="md-shift">1 / 8</strong></div><div class="md-stat"><span>Clock</span><strong id="md-clock">0:00</strong></div><div class="md-stat"><span>Energy</span><strong id="md-energy">18</strong></div><div class="md-stat"><span>Waiting</span><strong id="md-waiting">0</strong></div><div class="md-stat"><span>Equity</span><strong id="md-equity">100%</strong></div><div class="md-stat"><span>Score</span><strong id="md-score">0</strong></div></div>
      <div class="md-layout"><div class="md-map-wrap"><svg class="md-map" viewBox="0 0 640 430" role="application" aria-label="Metro network. Select a train, then select two stations to dispatch it. Arrow keys change station, Enter selects."></svg><div class="md-legend"><span><i class="md-dot"></i> operating</span><span><i class="md-dot warn"></i> crowded</span><span><i class="md-dot bad"></i> incident</span></div></div>
      <div class="md-panel"><div class="md-modes" aria-label="Difficulty modes"></div><div class="md-trains" aria-label="Train classes"></div><p class="md-help">Choose a train, then origin and destination. Trains follow the shortest path, board passengers, consume energy, and may need repairs. Keep outer stations served. Press Space to pause, S for sound, and R to restart.</p><div class="md-actions"><button type="button" data-act="tick">Advance 15 min</button><button type="button" data-act="repair">Repair incident</button><button type="button" data-act="pause">Pause</button><button type="button" data-act="sound" aria-pressed="false">Sound off</button><button type="button" data-act="restart">Restart shift</button></div><div class="md-log result-card" aria-live="polite"><strong>Morning service begins.</strong><small>Dispatch from busy stations before queues become unsafe.</small></div></div></div>`;
    stage.append(root);
    const svg = $('.md-map', root), log = $('.md-log', root), NS = 'http://www.w3.org/2000/svg';
    const stations = [
      {n:'North',x:320,y:48,outer:true},{n:'West',x:90,y:150,outer:true},{n:'Central',x:320,y:190},{n:'Museum',x:520,y:125},{n:'South',x:330,y:365,outer:true},{n:'Harbor',x:555,y:330,outer:true}
    ];
    const links = [[0,2],[1,2],[2,3],[2,4],[3,5],[4,5],[1,4]];
    const modes = { calm:{name:'Calm',spawn:2,incident:.05,energy:22}, rush:{name:'Rush',spawn:3,incident:.1,energy:18}, disruption:{name:'Disruption',spawn:4,incident:.16,energy:16,locked:true} };
    const trains = { local:{name:'Local',icon:'🚋',capacity:8,cost:2,speed:1}, rapid:{name:'Rapid',icon:'🚇',capacity:13,cost:4,speed:2}, express:{name:'Express',icon:'🚄',capacity:18,cost:5,speed:3,locked:true} };
    const state = {mode:'rush',train:'local',shift:1,time:0,energy:18,score:0,queues:[],served:[],selected:null,vehicles:[],incident:null,paused:false,sound:false,ac:null,unlocked:false,ended:false,focus:0,timer:null};
    function E(tag, attrs={}) { const el=document.createElementNS(NS,tag); Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v)); return el; }
    function tone(freq=440,d=.08){ if(!state.sound)return; const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;state.ac||=new AC();state.ac.resume();const o=state.ac.createOscillator(),g=state.ac.createGain();o.frequency.value=freq;g.gain.setValueAtTime(.0001,state.ac.currentTime);g.gain.exponentialRampToValueAtTime(.04,state.ac.currentTime+.01);g.gain.exponentialRampToValueAtTime(.0001,state.ac.currentTime+d);o.connect(g).connect(state.ac.destination);o.start();o.stop(state.ac.currentTime+d+.02);}
    function note(a,b){log.innerHTML=`<strong>${a}</strong><small>${b}</small>`;}
    function adjacency(){return stations.map((_,i)=>links.filter(e=>e.includes(i)).map(e=>e[0]===i?e[1]:e[0]));}
    function path(a,b){const adj=adjacency(),q=[[a]],seen=new Set([a]);while(q.length){const p=q.shift(),n=p[p.length-1];if(n===b)return p;for(const x of adj[n])if(!seen.has(x)){seen.add(x);q.push([...p,x]);}}return[];}
    function setup(){const m=modes[state.mode];state.shift=1;state.time=0;state.energy=m.energy;state.score=0;state.queues=stations.map((_,i)=>i===2?5:2);state.served=stations.map(()=>0);state.selected=null;state.vehicles=[];state.incident=null;state.paused=false;state.ended=false;renderModes();renderTrains();renderMap();hud();note('Morning service begins.','Select a train, then choose origin and destination stations.');}
    function renderModes(){const box=$('.md-modes',root);box.replaceChildren();Object.entries(modes).forEach(([k,m])=>{const b=document.createElement('button');b.type='button';b.disabled=!!(m.locked&&!state.unlocked);b.classList.toggle('is-active',state.mode===k);b.textContent=m.name+(b.disabled?' 🔒':'');b.onclick=()=>{state.mode=k;setup();};box.append(b);});}
    function renderTrains(){const box=$('.md-trains',root);box.replaceChildren();Object.entries(trains).forEach(([k,t])=>{const b=document.createElement('button');b.type='button';b.disabled=!!(t.locked&&!state.unlocked);b.classList.toggle('is-active',state.train===k);b.innerHTML=`${t.icon} ${t.name}<span class="md-cost">capacity ${t.capacity} · energy ${t.cost}</span>`;b.onclick=()=>{state.train=k;renderTrains();};box.append(b);});}
    function renderMap(){svg.replaceChildren();links.forEach(([a,b],i)=>{const l=E('line',{x1:stations[a].x,y1:stations[a].y,x2:stations[b].x,y2:stations[b].y,class:`md-track${state.incident===i?' active':''}`});if(state.incident===i)l.setAttribute('stroke','#ef4444');svg.append(l);});stations.forEach((s,i)=>{const g=E('g',{class:'md-station',tabindex:i===state.focus?'0':'-1',role:'button','aria-label':`${s.n} station, ${state.queues[i]} waiting${state.selected===i?', selected':''}`,'data-selected':state.selected===i});const c=E('circle',{cx:s.x,cy:s.y,r:state.queues[i]>9?22:18});c.setAttribute('fill',state.queues[i]>12?'#ef4444':state.queues[i]>8?'#f59e0b':'#fff');const name=E('text',{x:s.x,y:s.y-27,'text-anchor':'middle'});name.textContent=s.n;const q=E('text',{x:s.x,y:s.y+4,'text-anchor':'middle',class:'md-queue'});q.textContent=state.queues[i];g.append(c,name,q);g.addEventListener('click',()=>select(i));g.addEventListener('keydown',e=>keys(e,i));svg.append(g);});state.vehicles.forEach(v=>{const s=stations[v.at],g=E('g',{class:'md-train',transform:`translate(${s.x} ${s.y})`});const c=E('circle',{cx:0,cy:0,r:10,fill:v.color});const t=E('text',{x:0,y:4,'text-anchor':'middle',fill:'#fff','font-size':'9','font-weight':'900'});t.textContent=v.passengers;g.append(c,t);svg.append(g);});}
    function keys(e,i){let next=i;if(e.key==='ArrowRight'||e.key==='ArrowDown')next=(i+1)%stations.length;if(e.key==='ArrowLeft'||e.key==='ArrowUp')next=(i+stations.length-1)%stations.length;if(next!==i){e.preventDefault();state.focus=next;renderMap();$$('.md-station',svg)[next]?.focus();}if(e.key==='Enter'||e.key===' '){e.preventDefault();select(i);}}
    function select(i){if(state.ended)return;if(state.selected===null){state.selected=i;note(`${stations[i].n} selected.`,'Choose a destination station.');tone(420);renderMap();return;}if(state.selected===i){state.selected=null;renderMap();return;}dispatch(state.selected,i);state.selected=null;renderMap();}
    function dispatch(a,b){const t=trains[state.train],route=path(a,b);if(state.energy<t.cost){note('Not enough energy.','Advance time for a small recharge or choose a cheaper local train.');tone(160);return;}const blocked=route.some((n,idx)=>idx&&links.findIndex(e=>e.includes(route[idx-1])&&e.includes(n))===state.incident);if(blocked){note('Route blocked.','Repair the highlighted incident or choose another route.');tone(140);return;}const boarded=Math.min(t.capacity,state.queues[a]);state.queues[a]-=boarded;state.served[a]+=boarded;state.energy-=t.cost;state.score+=boarded*10+Math.max(0,8-route.length*2);state.vehicles.push({at:b,passengers:boarded,color:state.train==='rapid'?'#8b5cf6':state.train==='express'?'#f43f5e':'#0ea5e9'});if(state.vehicles.length>5)state.vehicles.shift();note(`${t.name} dispatched.`,`${boarded} riders moved from ${stations[a].n} to ${stations[b].n}.`);tone(620);if(state.score>=500&&!state.unlocked){state.unlocked=true;renderModes();renderTrains();note('Express service unlocked.','High performance unlocked Express trains and Disruption mode for this session.');}}
    function advance(){if(state.ended||state.paused)return;state.time+=15;if(state.time>=60){state.time=0;state.shift++;}const m=modes[state.mode];stations.forEach((_,i)=>{state.queues[i]+=Math.floor(Math.random()*(m.spawn+1))+(i===2?1:0);});state.energy=Math.min(m.energy,state.energy+1);if(state.incident===null&&Math.random()<m.incident)state.incident=Math.floor(Math.random()*links.length);const overcrowded=state.queues.filter(q=>q>14).length;state.score=Math.max(0,state.score-overcrowded*18);if(state.shift>8||state.queues.some(q=>q>22))finish();else{note(overcrowded?'Crowding penalty applied.':'Network updated.',state.incident!==null?'A track incident is blocking one segment.':'Passenger demand has shifted across the network.');renderMap();hud();}}
    function equity(){const outer=stations.map((s,i)=>s.outer?state.served[i]:null).filter(v=>v!==null);const max=Math.max(1,...outer),min=Math.min(...outer);return Math.max(0,Math.round(100-(max-min)*9));}
    function hud(){$('#md-shift',root).textContent=`${Math.min(state.shift,8)} / 8`;$('#md-clock',root).textContent=`${state.time?'0:15':'0:00'}`;$('#md-energy',root).textContent=state.energy;$('#md-waiting',root).textContent=state.queues.reduce((a,b)=>a+b,0);$('#md-equity',root).textContent=`${equity()}%`;$('#md-score',root).textContent=state.score;}
    function repair(){if(state.incident===null){note('No active incident.','Save repair energy for the next disruption.');return;}if(state.energy<3){note('Repair team needs 3 energy.','Advance time or reduce dispatch frequency.');return;}state.energy-=3;state.incident=null;state.score+=25;note('Track restored.','The blocked segment is open again.');tone(760);renderMap();hud();}
    function finish(){state.ended=true;clearInterval(state.timer);const e=equity(),waiting=state.queues.reduce((a,b)=>a+b,0);state.score+=e*3-Math.max(0,waiting-30)*4;note(state.score>=700?'Gold timetable achieved.':state.score>=420?'Shift completed.':'Service collapsed.',`Final score ${state.score}. Equity ${e}%. ${waiting} passengers remained waiting.`);hud();}
    function action(e){const a=e.target.closest('button')?.dataset.act;if(!a)return;if(a==='tick')advance();if(a==='repair')repair();if(a==='pause'){state.paused=!state.paused;e.target.textContent=state.paused?'Resume':'Pause';note(state.paused?'Dispatch paused.':'Dispatch resumed.',state.paused?'Review queues and routes without advancing time.':'Automatic time is moving again.');}if(a==='sound'){state.sound=!state.sound;e.target.textContent=state.sound?'Sound on':'Sound off';e.target.setAttribute('aria-pressed',String(state.sound));tone(520);}if(a==='restart')setup();}
    function globalKeys(e){if(!dialog.open)return;if(e.key===' '&&e.target.tagName!=='BUTTON'){e.preventDefault();state.paused=!state.paused;}if(e.key.toLowerCase()==='s'){state.sound=!state.sound;}if(e.key.toLowerCase()==='r')setup();}
    root.addEventListener('click',action);window.addEventListener('keydown',globalKeys);state.timer=setInterval(()=>{if(!state.paused)advance();},6500);
    const teardown=()=>{clearInterval(state.timer);window.removeEventListener('keydown',globalKeys);root.removeEventListener('click',action);state.ac?.close();dialog.removeEventListener('close',teardown);};dialog.addEventListener('close',teardown);setup();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
