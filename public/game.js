(() => {
  'use strict';

  // ---------- Game constants (mirror the server rules for previews) ----------
  const TYPE_CHART = {
    city: { city: 1, forest: 2, water: 0.5 },
    forest: { city: 0.5, forest: 1, water: 2 },
    water: { city: 2, forest: 0.5, water: 1 }
  };
  const WORLD_TYPE_MULTIPLIER = 1.2;
  const EMO_BONUS = { Happiness: 1.2, Sadness: 0.9, Anger: 1.3, Fear: 0.8, Surprise: 1.1, Disgust: 1.0, Love: 1.2, Curiosity: 1.1 };
  const RARITY_BONUS = { Common: 1, Rare: 1.2, Legendary: 1.5 };
  const TEAM_SIZE = 3;
  const FIELD_SLOTS = 5;
  const TURN_SECONDS = 100;

  const TYPE_ICON = { city: '🏙️', forest: '🌲', water: '🌊' };
  const WORLD_LABEL = { city: '🏙️ City world', forest: '🌲 Forest world', water: '🌊 Water world' };
  const EMO_ICON = { Happiness: '😄', Sadness: '😢', Anger: '😠', Fear: '😨', Surprise: '😲', Disgust: '🤢', Love: '😍', Curiosity: '🤔' };
  const CARD_ICON = {
    'City Guardian': '🛡️', 'Urban Ninja': '🥷', 'Skyscraper Golem': '🗿', 'Techno Wizard': '🧙',
    'Forest Druid': '🌿', 'Woodland Archer': '🏹', 'Ancient Treant': '🌳', "Nature's Fury": '🌪️',
    'Water Elemental': '💧', 'Coral Mermaid': '🧜', 'Kraken Lord': '🐙', 'Deep Sea Terror': '🦈'
  };

  // ---------- DOM helpers ----------
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const iconFor = (c) => CARD_ICON[c.name] || TYPE_ICON[c.type] || '✨';

  const screens = ['lobby', 'select', 'reveal', 'place', 'battle'];
  const PHASE_LABEL = { lobby: '', select: 'Draft', reveal: 'Reveal', place: 'Formation', battle: 'Battle' };

  function showScreen(name) {
    screens.forEach((s) => $('screen-' + s).classList.toggle('active', s === name));
    $('phase-label').textContent = PHASE_LABEL[name] || '';
    game.screen = name;
  }
  function toast(text) {
    const el = $('waiting');
    el.textContent = text || '';
    el.classList.toggle('active', !!text);
  }
  function overlay(id, on) { $(id).classList.toggle('active', on); }

  // ---------- Server URL ----------
  function defaultServerUrl() {
    const param = new URLSearchParams(location.search).get('server');
    if (param) return param;
    if (location.protocol === 'file:' || !location.host) return 'ws://localhost:2567';
    return (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host;
  }
  $('server-url').value = defaultServerUrl();

  // ---------- Game state ----------
  let game;
  function resetGame() {
    game = {
      screen: 'lobby',
      room: null,
      allCards: [],
      picked: [],
      locked: false,
      placement: {},       // character index -> slot
      placeArmed: -1,      // character index waiting for a slot
      placed: false,
      revealTimer: null,
      worldType: '',
      positions: {},       // sessionId -> [slot per character]
      turnId: null,
      selected: -1,
      turnDeadline: 0,
      turnTimer: null,
      hadOpponent: false,
      ended: false,
      units: { me: [], opp: [] }
    };
  }
  resetGame();

  const me = () => game.room && game.room.state.players && game.room.state.players.get(game.room.sessionId);
  const opp = () => {
    if (!game.room || !game.room.state.players) return null;
    let found = null;
    game.room.state.players.forEach((p, id) => { if (id !== game.room.sessionId) found = p; });
    return found;
  };
  const chars = (p) => (p && p.characters ? Array.from(p.characters) : []);
  const isMyTurn = () => game.room && game.turnId === game.room.sessionId && !game.ended;

  // ---------- Card rendering ----------
  function cardHTML(c, extra = '') {
    return `
      <div class="card-top"><span class="card-type">${TYPE_ICON[c.type] || ''} ${esc(c.type)}</span><span class="card-rarity">${esc(c.rarity)}</span></div>
      <div class="card-art">${iconFor(c)}</div>
      <div class="card-name">${esc(c.name)}</div>
      <div class="card-stats">
        <div class="stat">Power <b>${c.power}</b></div>
        <div class="stat">Defense <b>${c.defense}</b></div>
        <div class="stat">Mojo <b>${c.mojo}/10</b></div>
        <div class="stat">HP <b>${c.health ?? 100}</b></div>
      </div>
      <div class="card-emo">${EMO_ICON[c.emo] || ''} ${esc(c.emo)} · x${(EMO_BONUS[c.emo] || 1).toFixed(1)}</div>
      ${extra}`;
  }
  function cardEl(c, cls = '') {
    const el = document.createElement('div');
    el.className = `card type-${c.type} rarity-${c.rarity} ${cls}`;
    el.innerHTML = cardHTML(c);
    return el;
  }

  // ---------- Lobby ----------
  $('btn-find').addEventListener('click', () => {
    if (game.room) cancelSearch();
    else findMatch();
  });

  async function findMatch() {
    const url = $('server-url').value.trim() || defaultServerUrl();
    $('btn-find').textContent = 'Cancel';
    $('lobby-status').innerHTML = '<span class="spinner"></span>Connecting…';
    try {
      const client = new Colyseus.Client(url);
      const room = await client.joinOrCreate('game');
      game.room = room;
      bindRoom(room);
      $('conn-status').className = 'conn-status online';
      $('lobby-status').innerHTML = '<span class="spinner"></span>Waiting for an opponent…';
    } catch (e) {
      console.error(e);
      $('lobby-status').textContent = `Couldn't connect to ${url}`;
      $('btn-find').textContent = 'Find Match';
    }
  }

  function cancelSearch() {
    leaveRoom();
    $('btn-find').textContent = 'Find Match';
    $('lobby-status').textContent = '';
  }

  function leaveRoom() {
    const room = game.room;
    game.room = null;
    $('conn-status').className = 'conn-status offline';
    if (room) { try { room.leave(); } catch (_) { /* already closed */ } }
  }

  // ---------- Room wiring ----------
  function bindRoom(room) {
    room.onMessage('allCards', (cards) => {
      game.allCards = cards;
      renderPool();
    });

    room.onMessage('startCardSelection', () => {
      game.hadOpponent = true;
      showScreen('select');
      renderPool();
    });

    room.onMessage('displayCards', ({ players }) => {
      toast('');
      showReveal(players);
    });

    room.onMessage('startCharacterPlacement', () => {
      clearInterval(game.revealTimer);
      showPlacement();
    });

    room.onMessage('start', (msg) => {
      toast('');
      game.worldType = msg.worldType;
      (msg.playerPositions || []).forEach(([id, positions]) => { game.positions[id] = positions; });
      startBattle();
      $('countdown-world').textContent = WORLD_LABEL[msg.worldType] || msg.worldType;
      setCountdown(msg.countdown);
      overlay('overlay-countdown', true);
      log('sys', `The battle takes place in a <b>${esc(msg.worldType)}</b> world. ${esc(msg.worldType)} champions get x${WORLD_TYPE_MULTIPLIER} damage.`);
    });

    room.onMessage('countdown', ({ countdown }) => setCountdown(countdown));

    room.onMessage('turn', ({ playerSessionId }) => {
      overlay('overlay-countdown', false);
      game.turnId = playerSessionId;
      game.selected = -1;
      game.turnDeadline = Date.now() + TURN_SECONDS * 1000;
      startTurnTimer();
      renderBattle();
    });

    room.onMessage('attackDetails', onAttackDetails);

    room.onMessage('attackBlocked', ({ attackerId, defenderId, characterIndex }) => {
      const mine = attackerId === room.sessionId;
      const target = chars(mine ? opp() : me())[characterIndex];
      floater(mine ? 'opp' : 'me', characterIndex, '🛡 Blocked!', 'block');
      log(mine ? 'me' : 'opp', `${mine ? 'Your attack' : 'The enemy attack'} on ${mine ? '' : 'your '}<b>${esc(target && target.name)}</b> was blocked by a shield.`);
    });

    room.onMessage('characterDefended', ({ playerId, characterIndex }) => {
      const mine = playerId === room.sessionId;
      const c = chars(mine ? me() : opp())[characterIndex];
      log(mine ? 'me' : 'opp', `${mine ? 'You shield' : 'Opponent shields'} <b>${esc(c && c.name)}</b> until ${mine ? 'your' : 'their'} next turn.`);
      renderBattle();
    });

    room.onMessage('defenseExpired', () => renderBattle());

    room.onMessage('characterDisabled', ({ playerId, characterIndex }) => {
      const mine = playerId === room.sessionId;
      const c = chars(mine ? me() : opp())[characterIndex];
      log('sys', `${mine ? 'Your' : 'Enemy'} <b>${esc(c && c.name)}</b> is knocked out!`);
    });

    room.onMessage('updateHealth', () => renderBattle());

    room.onMessage('gameEnd', (msg) => endGame(msg));

    room.onStateChange(() => {
      const players = room.state.players;
      if (players && players.size >= 2) game.hadOpponent = true;
      if (!game.ended && game.hadOpponent && players && players.size < 2 && game.screen !== 'lobby') {
        endGame({ reason: 'Opponent left' });
        return;
      }
      if (game.screen === 'battle') renderBattle();
    });

    room.onLeave(() => {
      $('conn-status').className = 'conn-status offline';
      if (game.room !== room) return;
      game.room = null;
      if (!game.ended && game.screen !== 'lobby') endGame({ reason: 'Disconnected' });
      else if (game.screen === 'lobby') cancelSearch();
    });

    room.onError((code, message) => console.error('Room error', code, message));
  }

  // ---------- Draft ----------
  function renderPool() {
    const pool = $('card-pool');
    pool.innerHTML = '';
    game.allCards.forEach((c) => {
      const idx = game.picked.indexOf(c.id);
      const full = game.picked.length >= TEAM_SIZE && idx === -1;
      const el = cardEl(c, `${game.locked ? '' : 'clickable'} ${idx !== -1 ? 'picked' : ''} ${full || (game.locked && idx === -1) ? 'dim' : ''}`);
      if (idx !== -1) el.insertAdjacentHTML('beforeend', `<div class="pick-badge">${idx + 1}</div>`);
      if (!game.locked) el.addEventListener('click', () => togglePick(c.id));
      pool.appendChild(el);
    });

    const slots = $('picked-slots');
    slots.innerHTML = '';
    for (let i = 0; i < TEAM_SIZE; i++) {
      const c = game.allCards.find((x) => x.id === game.picked[i]);
      const s = document.createElement('div');
      s.className = 'picked-slot' + (c ? ' filled' : '');
      s.innerHTML = c ? `${iconFor(c)} ${esc(c.name)}` : `Slot ${i + 1}`;
      slots.appendChild(s);
    }
    const left = TEAM_SIZE - game.picked.length;
    $('select-hint').textContent = game.locked ? 'Team locked in' : left ? `Choose ${left} more champion${left === 1 ? '' : 's'}` : 'Team ready — lock it in!';
    $('btn-lock').disabled = game.locked || game.picked.length !== TEAM_SIZE;
  }

  function togglePick(id) {
    const i = game.picked.indexOf(id);
    if (i !== -1) game.picked.splice(i, 1);
    else if (game.picked.length < TEAM_SIZE) game.picked.push(id);
    renderPool();
  }

  $('btn-lock').addEventListener('click', () => {
    if (!game.room || game.picked.length !== TEAM_SIZE || game.locked) return;
    game.room.send('selectCards', { cardIds: game.picked.slice() });
    game.locked = true;
    renderPool();
    toast('Waiting for your opponent to lock in…');
  });

  // ---------- Reveal ----------
  function showReveal(players) {
    const mine = players.find((p) => p.sessionId === game.room.sessionId);
    const theirs = players.find((p) => p.sessionId !== game.room.sessionId);
    const fill = (id, list) => {
      const row = $(id);
      row.innerHTML = '';
      (list || []).forEach((c) => row.appendChild(cardEl(c)));
    };
    fill('reveal-me', mine && mine.characters);
    fill('reveal-opp', theirs && theirs.characters);
    showScreen('reveal');

    let left = 5;
    $('reveal-timer').textContent = left;
    clearInterval(game.revealTimer);
    game.revealTimer = setInterval(() => {
      left = Math.max(0, left - 1);
      $('reveal-timer').textContent = left;
      if (!left) clearInterval(game.revealTimer);
    }, 1000);
  }

  // ---------- Placement ----------
  function myTeam() {
    const fromState = chars(me());
    if (fromState.length === TEAM_SIZE) return fromState;
    return game.picked.map((id) => game.allCards.find((c) => c.id === id)).filter(Boolean);
  }

  function showPlacement() {
    game.placement = {};
    game.placeArmed = 0;
    game.placed = false;
    showScreen('place');
    renderPlacement();
  }

  function renderPlacement() {
    const team = myTeam();
    const field = $('place-field');
    field.innerHTML = '';
    for (let slot = 0; slot < FIELD_SLOTS; slot++) {
      const idx = Object.keys(game.placement).find((k) => game.placement[k] === slot);
      const el = document.createElement('div');
      el.className = 'slot';
      el.dataset.label = `Spot ${slot + 1}`;
      if (idx !== undefined) {
        el.appendChild(cardEl(team[idx], game.placed ? '' : 'clickable'));
        if (!game.placed) el.addEventListener('click', () => { delete game.placement[idx]; game.placeArmed = +idx; renderPlacement(); });
      } else {
        el.classList.add('empty');
        if (game.placeArmed !== -1 && !game.placed) el.classList.add('armed');
        if (!game.placed) el.addEventListener('click', () => placeInto(slot));
      }
      field.appendChild(el);
    }

    const hand = $('place-hand');
    hand.innerHTML = '';
    team.forEach((c, i) => {
      if (game.placement[i] !== undefined) return;
      const el = cardEl(c, i === game.placeArmed ? 'picked' : '');
      el.addEventListener('click', () => { game.placeArmed = i; renderPlacement(); });
      hand.appendChild(el);
    });

    const done = Object.keys(game.placement).length === team.length && team.length === TEAM_SIZE;
    $('btn-confirm-place').disabled = !done || game.placed;
    $('btn-auto-place').disabled = game.placed;
    $('place-hint').textContent = game.placed ? 'Formation locked' : done ? 'Formation ready — confirm when you are happy' : 'Select a champion, then click a spot on the field';
  }

  function placeInto(slot) {
    if (game.placeArmed === -1) return;
    game.placement[game.placeArmed] = slot;
    const team = myTeam();
    const next = team.findIndex((_, i) => game.placement[i] === undefined);
    game.placeArmed = next;
    renderPlacement();
  }

  $('btn-auto-place').addEventListener('click', () => {
    const spread = [0, 2, 4];
    game.placement = { 0: spread[0], 1: spread[1], 2: spread[2] };
    game.placeArmed = -1;
    renderPlacement();
  });

  $('btn-confirm-place').addEventListener('click', () => {
    if (!game.room || game.placed) return;
    const positions = [0, 1, 2].map((i) => game.placement[i]);
    if (positions.some((p) => p === undefined)) return;
    game.room.send('cardplacementfinish', { positions });
    game.placed = true;
    renderPlacement();
    toast('Waiting for your opponent to set their formation…');
  });

  // ---------- Battle ----------
  function setCountdown(n) {
    const el = $('countdown-num');
    el.textContent = n > 0 ? n : 'Fight!';
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
  }

  function slotsFor(sessionId, list) {
    // Use the positions broadcast in "start" (falls back to synced state), then fill any gaps.
    const given = game.positions[sessionId] || list.map((c) => c.position);
    const used = new Set();
    const out = list.map((_, i) => {
      const p = given[i];
      if (Number.isInteger(p) && p >= 0 && p < FIELD_SLOTS && !used.has(p)) { used.add(p); return p; }
      return -1;
    });
    return out.map((p) => {
      if (p !== -1) return p;
      let free = 0;
      while (used.has(free)) free++;
      used.add(free);
      return free;
    });
  }

  function startBattle() {
    showScreen('battle');
    $('log').innerHTML = '';
    $('arena').className = `arena world-${game.worldType}`;
    $('world-badge').textContent = WORLD_LABEL[game.worldType] || game.worldType;
    buildField('me', me());
    buildField('opp', opp());
    renderBattle();
  }

  function buildField(side, player) {
    const row = $(side === 'me' ? 'field-me' : 'field-opp');
    row.innerHTML = '';
    const list = chars(player);
    const slots = slotsFor(player ? player.sessionId : '', list);
    const cells = [];
    for (let s = 0; s < FIELD_SLOTS; s++) {
      const cell = document.createElement('div');
      cell.className = 'slot empty';
      row.appendChild(cell);
      cells.push(cell);
    }
    game.units[side] = list.map((c, i) => {
      const cell = cells[slots[i]];
      cell.classList.remove('empty');
      const el = document.createElement('div');
      el.className = `unit type-${c.type} rarity-${c.rarity}`;
      el.innerHTML = `
        <div class="preview"></div>
        <div class="unit-head">
          <div class="unit-art">${iconFor(c)}</div>
          <div>
            <div class="unit-name">${esc(c.name)}</div>
            <div class="unit-sub"><span class="t">${esc(c.type)}</span><span>${esc(c.rarity)}</span></div>
          </div>
        </div>
        <div class="hp"><div></div></div>
        <div class="hp-text"><span>HP</span><b></b></div>
        <div class="unit-stats">
          <div>PWR<b>${c.power}</b></div>
          <div>DEF<b>${c.defense}</b></div>
          <div>MOJO<b>${c.mojo}</b></div>
          <div title="${esc(c.emo)}">EMO<b>${EMO_ICON[c.emo] || '·'}</b></div>
        </div>`;
      el.addEventListener('click', () => onUnitClick(side, i));
      cell.appendChild(el);
      return el;
    });
  }

  function estimateDamage(attacker, target) {
    const type = (TYPE_CHART[attacker.type] || {})[target.type] ?? 1;
    const world = attacker.type === game.worldType ? WORLD_TYPE_MULTIPLIER : 1;
    const base = attacker.power * type * world * (EMO_BONUS[attacker.emo] || 1) * (RARITY_BONUS[attacker.rarity] || 1);
    return { dmg: Math.floor(base * (1 - target.defense / 100)), crit: Math.floor(base * 2 * (1 - target.defense / 100)), type };
  }

  function renderBattle() {
    if (game.screen !== 'battle') return;
    const mine = me();
    const theirs = opp();
    const myList = chars(mine);
    const oppList = chars(theirs);
    const myTurn = isMyTurn();
    const attacker = myList[game.selected];

    const paint = (side, list, player) => {
      list.forEach((c, i) => {
        const el = game.units[side][i];
        if (!el) return;
        const hp = Math.max(0, c.health);
        const bar = el.querySelector('.hp');
        bar.classList.toggle('mid', hp <= 60 && hp > 30);
        bar.classList.toggle('low', hp <= 30);
        bar.firstElementChild.style.width = hp + '%';
        el.querySelector('.hp-text b').textContent = `${hp}/100`;

        const defended = player && player.defendedCharacterIndex === i && !c.isDisabled;
        el.classList.toggle('disabled', !!c.isDisabled);
        el.classList.toggle('defended', defended);
        let shield = el.querySelector('.shield');
        if (defended && !shield) {
          shield = document.createElement('div');
          shield.className = 'shield';
          shield.textContent = '🛡';
          el.appendChild(shield);
        } else if (!defended && shield) shield.remove();

        const selectable = side === 'me' && myTurn && !c.isDisabled;
        const targetable = side === 'opp' && myTurn && attacker && !attacker.isDisabled && !c.isDisabled;
        el.classList.toggle('selectable', selectable);
        el.classList.toggle('selected', side === 'me' && i === game.selected && myTurn);
        el.classList.toggle('targetable', !!targetable);
        if (targetable) {
          const est = estimateDamage(attacker, c);
          const tag = est.type > 1 ? ' ▲' : est.type < 1 ? ' ▼' : '';
          el.querySelector('.preview').textContent = defended ? '🛡 Will be blocked' : `≈${est.dmg} dmg${tag} (mojo ${est.crit})`;
        }
      });
    };
    paint('me', myList, mine);
    paint('opp', oppList, theirs);

    const banner = $('turn-banner');
    if (game.ended) { banner.textContent = 'Battle over'; banner.className = 'turn-banner'; }
    else if (!game.turnId) { banner.textContent = 'Get ready…'; banner.className = 'turn-banner'; }
    else if (game.turnId === 'pending') { banner.textContent = 'Resolving…'; banner.className = 'turn-banner theirs'; }
    else { banner.textContent = myTurn ? 'Your turn' : "Opponent's turn"; banner.className = 'turn-banner ' + (myTurn ? 'mine' : 'theirs'); }

    const hint = $('action-hint');
    if (!myTurn) hint.textContent = game.turnId && game.turnId !== 'pending' && !game.ended ? 'Waiting for the opponent to act…' : '';
    else if (!attacker) hint.innerHTML = 'Select one of <b>your champions</b> to act.';
    else hint.innerHTML = `<b>${esc(attacker.name)}</b> ready — click an <b>enemy</b> to attack, or Defend to shield it until your next turn.`;
    $('btn-defend').disabled = !(myTurn && attacker && !attacker.isDisabled);
  }

  function onUnitClick(side, i) {
    if (!isMyTurn()) return;
    const myList = chars(me());
    if (side === 'me') {
      if (myList[i] && !myList[i].isDisabled) {
        game.selected = game.selected === i ? -1 : i;
        renderBattle();
      }
      return;
    }
    const attacker = myList[game.selected];
    const target = chars(opp())[i];
    if (!attacker || attacker.isDisabled || !target || target.isDisabled) return;
    game.room.send('attack', { fromCharacterIndex: game.selected, toCharacterIndex: i });
    game.selected = -1;
    game.turnId = 'pending'; // wait for the server to hand over the next turn
    renderBattle();
  }

  $('btn-defend').addEventListener('click', () => {
    if (!isMyTurn() || game.selected === -1) return;
    game.room.send('defend', { characterIndex: game.selected });
    game.selected = -1;
    game.turnId = 'pending';
    renderBattle();
  });

  function onAttackDetails(d) {
    const mine = d.attackerId === game.room.sessionId;
    const atkSide = mine ? 'me' : 'opp';
    const defSide = mine ? 'opp' : 'me';
    const attacker = chars(mine ? me() : opp())[d.fromCharacterIndex];
    const target = chars(mine ? opp() : me())[d.toCharacterIndex];

    animate(game.units[atkSide][d.fromCharacterIndex], mine ? 'lunge-up' : 'lunge-down');
    setTimeout(() => {
      animate(game.units[defSide][d.toCharacterIndex], 'hit');
      floater(defSide, d.toCharacterIndex, `-${d.damage}`);
      if (d.mojoActivated) floater(atkSide, d.fromCharacterIndex, 'MOJO x2!', 'mojo');
    }, 180);

    const chips = [];
    const chip = (label, val, cls = '') => chips.push(`<span class="mult ${cls}">${label} x${Number(val).toFixed(1)}</span>`);
    chip('type', d.typeMultiplier, d.typeMultiplier > 1 ? 'good' : d.typeMultiplier < 1 ? 'bad' : '');
    if (d.worldTypeMultiplier !== 1) chip('world', d.worldTypeMultiplier, 'good');
    chip('emo', d.emoBonus, d.emoBonus > 1 ? 'good' : d.emoBonus < 1 ? 'bad' : '');
    if (d.rarityBonus !== 1) chip('rarity', d.rarityBonus, 'good');
    if (d.mojoActivated) chips.push('<span class="mult mojo">MOJO x2</span>');
    log(mine ? 'me' : 'opp',
      `${mine ? 'Your' : 'Enemy'} <b>${esc(attacker && attacker.name)}</b> hits ${mine ? '' : 'your '}<b>${esc(target && target.name)}</b> for <b>${d.damage}</b>.` +
      `<div class="mults">${chips.join('')}</div>`);
  }

  function animate(el, cls) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 500);
  }

  function floater(side, index, text, cls = '') {
    const el = game.units[side] && game.units[side][index];
    if (!el) return;
    const f = document.createElement('div');
    f.className = 'floater ' + cls;
    f.textContent = text;
    el.appendChild(f);
    setTimeout(() => f.remove(), 1400);
  }

  function startTurnTimer() {
    clearInterval(game.turnTimer);
    const bar = $('turn-timer-bar');
    const tick = () => {
      const left = Math.max(0, game.turnDeadline - Date.now());
      bar.style.width = (left / (TURN_SECONDS * 1000)) * 100 + '%';
    };
    tick();
    game.turnTimer = setInterval(tick, 1000);
  }

  function log(kind, html) {
    const box = $('log');
    const el = document.createElement('div');
    el.className = 'log-entry ' + kind;
    el.innerHTML = html;
    box.prepend(el);
  }

  // ---------- End ----------
  function endGame(msg) {
    if (game.ended) return;
    game.ended = true;
    clearInterval(game.turnTimer);
    clearInterval(game.revealTimer);
    toast('');
    overlay('overlay-countdown', false);

    const myId = game.room ? game.room.sessionId : null;
    let title, sub, cls;
    if (msg.result === 'draw') { title = 'Draw'; sub = 'Both teams fell together.'; cls = ''; }
    else if (msg.reason === 'Player disconnected' || msg.reason === 'Opponent left') {
      const inBattle = game.screen === 'battle';
      title = inBattle ? 'Victory' : 'Match cancelled';
      sub = inBattle ? 'Your opponent fled the arena.' : 'Your opponent left before the battle started.';
      cls = inBattle ? 'win' : '';
    } else if (msg.reason === 'Disconnected') { title = 'Disconnected'; sub = 'Lost connection to the server.'; cls = 'lose'; }
    else if (msg.winner && msg.winner === myId) { title = 'Victory'; sub = 'All enemy champions are knocked out.'; cls = 'win'; }
    else { title = 'Defeat'; sub = 'Your champions have fallen.'; cls = 'lose'; }

    $('end-title').textContent = title;
    $('end-title').className = 'end-title ' + cls;
    $('end-sub').textContent = sub;
    if (game.screen === 'battle') {
      renderBattle();
      log('sys', `<b>${esc(title)}</b> — ${esc(sub)}`);
    }
    setTimeout(() => overlay('overlay-end', true), game.screen === 'battle' ? 900 : 0);
    if (msg.reason === 'Opponent left') leaveRoom();
  }

  $('btn-again').addEventListener('click', () => {
    overlay('overlay-end', false);
    leaveRoom();
    clearInterval(game.turnTimer);
    clearInterval(game.revealTimer);
    resetGame();
    showScreen('lobby');
    toast('');
    findMatch();
  });

  window.addEventListener('beforeunload', () => { if (game.room) game.room.leave(); });
})();
