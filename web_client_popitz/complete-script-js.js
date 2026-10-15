document.addEventListener('DOMContentLoaded', () => {
    // ---------- Config ----------
    const params = new URLSearchParams(window.location.search);
    const isLocalPage = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    const SERVER_URL = params.get('server')
        || (isLocalPage ? 'ws://localhost:2567' : 'wss://popitz-server-4682fddc412a.herokuapp.com');
    const client = new Colyseus.Client(SERVER_URL);

    // Mirrors the server's damage tables (MyRoom.js / typeChart.js) for move previews only.
    const TYPE_CHART = {
        city: { city: 1, forest: 2, water: 0.5 },
        forest: { city: 0.5, forest: 1, water: 2 },
        water: { city: 2, forest: 0.5, water: 1 }
    };
    const EMO_BONUS = { Happiness: 1.2, Sadness: 0.9, Anger: 1.3, Fear: 0.8, Surprise: 1.1, Disgust: 1.0, Love: 1.2, Curiosity: 1.1 };
    const RARITY_BONUS = { Common: 1, Rare: 1.2, Legendary: 1.5 };
    const WORLD_BONUS = 1.2;
    const ELEMENT_COLOR = { city: '#FFC23D', forest: '#6BE36B', water: '#38CFFF' };
    const RARITY_STARS = { Common: 1, Rare: 2, Legendary: 3 };

    const ICONS = {
        city: '<svg aria-hidden="true" width="96" height="80" viewBox="0 0 96 80" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"><path d="M6 74h84"/><path d="M12 74V40h14v34"/><path d="M26 74V18l12-8v64"/><path d="M38 74V28h16v46"/><path d="M54 74V8h14v66"/><path d="M68 74V36h16v38"/><path d="M43 36h6M43 46h6M43 56h6M59 18h4M59 28h4M59 38h4M59 48h4M73 46h6M73 56h6"/></svg>',
        forest: '<svg aria-hidden="true" width="96" height="80" viewBox="0 0 96 80" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"><path d="M48 6 22 44h14L18 66h60L60 44h14L48 6z"/><path d="M48 66v10"/><path d="M48 30v26M40 46l8 6 8-8"/><circle cx="14" cy="18" r="3"/><circle cx="84" cy="24" r="3"/></svg>',
        water: '<svg aria-hidden="true" width="96" height="80" viewBox="0 0 96 80" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"><path d="M4 36c8-8 14-8 22 0s14 8 22 0 14-8 22 0 14 8 22 0"/><path d="M4 52c8-8 14-8 22 0s14 8 22 0 14-8 22 0 14 8 22 0"/><path d="M4 68c8-8 14-8 22 0s14 8 22 0 14-8 22 0 14 8 22 0"/><path d="M48 6c-6 8-9 13-9 17a9 9 0 0 0 18 0c0-4-3-9-9-17z"/></svg>',
        atk: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF7A9E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 6-6M16 16l4 4M19 21l2-2"/></svg>',
        def: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7FD4FF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
        shield: '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
        star: '<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3 6.6 7 .8-5.2 4.8 1.4 7L12 17.8 5.8 21.2l1.4-7L2 9.4l7-.8L12 2z"/></svg>',
        check: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>',
        close: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>'
    };

    const FEATURED = [
        { id: 3, name: 'Skyscraper Golem', type: 'city', power: 90, emo: 'Anger', rarity: 'Legendary', defense: 80, mojo: 9 },
        { id: 9, name: 'Kraken Lord', type: 'water', power: 95, emo: 'Anger', rarity: 'Legendary', defense: 85, mojo: 9 },
        { id: 6, name: 'Ancient Treant', type: 'forest', power: 85, emo: 'Sadness', rarity: 'Legendary', defense: 75, mojo: 10 }
    ];

    // ---------- State ----------
    let room = null;
    let game = freshGame();

    function freshGame() {
        return {
            allCards: [],
            picked: [],
            filter: 'all',
            submitted: false,
            revealed: null,
            placementSent: false,
            world: '',
            mine: [],
            theirs: [],
            myDefended: -1,
            theirDefended: -1,
            isMyTurn: false,
            started: false,
            sel: -1,
            tgt: -1,
            hit: null,
            over: false
        };
    }

    const $ = (id) => document.getElementById(id);
    const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '');

    // ---------- Screens ----------
    const SCREENS = ['lobby', 'draft', 'reveal', 'battle'];
    function showScreen(name) {
        SCREENS.forEach((s) => { $(`screen-${s}`).hidden = s !== name; });
        window.scrollTo({ top: 0 });
    }

    // ---------- Card rendering ----------
    function cardHTML(card, opts = {}) {
        const classes = ['card', `type-${card.type}`, `rarity-${card.rarity}`];
        if (opts.selected) classes.push('is-selected');
        if (opts.dim) classes.push('is-dim');
        const stars = ICONS.star.repeat(RARITY_STARS[card.rarity] || 1);
        const emo = (EMO_BONUS[card.emo] || 1).toFixed(1);
        return `
            <div class="${classes.join(' ')}">
                <div class="card-body">
                    <div class="card-top">
                        <div class="card-name">${esc(card.name)}</div>
                        <div class="mojo-gem" title="Mojo: ${esc(card.mojo)}0% chance of double damage">${esc(card.mojo)}</div>
                    </div>
                    <div class="card-art">
                        ${ICONS[card.type] || ''}
                        <div class="card-type">${esc(card.type)}</div>
                    </div>
                    <div class="card-meta">
                        <div class="card-emo">${esc(card.emo)} <b>×${emo}</b></div>
                        <div class="card-rarity">${esc(card.rarity)}</div>
                    </div>
                    <div class="card-stats">
                        <div class="card-stat">${ICONS.atk}<span class="card-stat-label">ATK</span><span class="card-stat-value">${esc(card.power)}</span></div>
                        <div class="card-stat">${ICONS.def}<span class="card-stat-label">DEF</span><span class="card-stat-value">${esc(card.defense)}</span></div>
                    </div>
                    <div class="card-foot">
                        <div class="card-stars">${stars}</div>
                        <div class="card-num">#${String(card.id).padStart(2, '0')} / 12</div>
                    </div>
                </div>
                ${opts.selected ? `<div class="card-check">${ICONS.check}</div>` : ''}
            </div>`;
    }

    // ---------- Lobby ----------
    $('hero-fan').innerHTML = `
        <div class="fan-card fan-left">${cardHTML(FEATURED[0])}</div>
        <div class="fan-card fan-right">${cardHTML(FEATURED[2])}</div>
        <div class="fan-card fan-mid">${cardHTML(FEATURED[1])}</div>`;

    $('find-match-btn').addEventListener('click', findMatch);
    $('cancel-match-btn').addEventListener('click', cancelMatch);
    $('play-again-btn').addEventListener('click', backToLobby);
    $('brand-link').addEventListener('click', (e) => {
        e.preventDefault();
        if (!room) backToLobby();
    });

    function setSearching(on, text) {
        $('find-match-btn').hidden = on;
        $('searching').hidden = !on;
        if (text) $('searching-text').textContent = text;
    }

    async function findMatch() {
        $('lobby-error').textContent = '';
        setSearching(true, 'Connecting…');
        try {
            room = await client.joinOrCreate('game');
            setupRoomHandlers(room);
            setSearching(true, 'Waiting for an opponent…');
            $('topbar-status').textContent = 'In queue';
        } catch (e) {
            console.error('Error joining game room', e);
            room = null;
            setSearching(false);
            $('lobby-error').textContent = "Couldn't reach the game server. Try again in a moment.";
        }
    }

    function cancelMatch() {
        if (room) {
            const r = room;
            room = null;
            r.leave();
        }
        setSearching(false);
        $('topbar-status').textContent = '';
    }

    function backToLobby() {
        if (room) {
            const r = room;
            room = null;
            try { r.leave(); } catch (e) { /* already closed */ }
        }
        game = freshGame();
        document.body.className = '';
        $('result-overlay').hidden = true;
        $('countdown-overlay').hidden = true;
        $('log').innerHTML = '';
        $('topbar-status').textContent = '';
        setSearching(false);
        showScreen('lobby');
    }

    // ---------- Draft ----------
    $('filter-tabs').addEventListener('click', (e) => {
        const tab = e.target.closest('[data-filter]');
        if (!tab) return;
        game.filter = tab.dataset.filter;
        renderDraft();
    });

    $('card-grid').addEventListener('click', (e) => {
        const btn = e.target.closest('[data-card-id]');
        if (!btn || game.submitted) return;
        togglePick(Number(btn.dataset.cardId));
    });

    $('team-slots').addEventListener('click', (e) => {
        const btn = e.target.closest('[data-remove-id]');
        if (!btn || game.submitted) return;
        togglePick(Number(btn.dataset.removeId));
    });

    $('lock-in-btn').addEventListener('click', () => {
        if (!room || game.submitted || game.picked.length !== 3) return;
        room.send('selectCards', { cardIds: game.picked });
        game.submitted = true;
        renderDraft();
    });

    function togglePick(id) {
        if (game.picked.includes(id)) {
            game.picked = game.picked.filter((x) => x !== id);
        } else if (game.picked.length < 3) {
            game.picked = game.picked.concat(id);
        }
        renderDraft();
    }

    function renderDraft() {
        const cards = game.allCards;
        const tabs = [['all', 'All', '#FF4D8D'], ['city', 'City', ELEMENT_COLOR.city], ['forest', 'Forest', ELEMENT_COLOR.forest], ['water', 'Water', ELEMENT_COLOR.water]];
        $('filter-tabs').innerHTML = tabs.map(([key, label, dot]) => {
            const count = key === 'all' ? cards.length : cards.filter((c) => c.type === key).length;
            return `<button type="button" class="tab" role="tab" data-filter="${key}" aria-selected="${game.filter === key}">
                <span class="tab-dot" style="background:${dot}"></span>${label}<span class="tab-count">${count}</span></button>`;
        }).join('');

        const full = game.picked.length >= 3;
        $('card-grid').innerHTML = cards
            .filter((c) => game.filter === 'all' || c.type === game.filter)
            .map((c) => {
                const selected = game.picked.includes(c.id);
                const disabled = game.submitted ? 'disabled' : '';
                return `<button type="button" class="card-btn" data-card-id="${c.id}" aria-pressed="${selected}" aria-label="${esc(c.name)}${selected ? ', selected' : ''}" ${disabled}>
                    ${cardHTML(c, { selected, dim: full && !selected })}</button>`;
            }).join('');

        const team = game.picked.map((id) => cards.find((c) => c.id === id)).filter(Boolean);
        $('team-count').textContent = team.length;
        $('team-slots').innerHTML = [0, 1, 2].map((i) => {
            const c = team[i];
            if (!c) return '<div class="slot-empty">Empty slot</div>';
            const remove = game.submitted ? '' : `<button type="button" class="slot-remove" data-remove-id="${c.id}" aria-label="Remove ${esc(c.name)}">${ICONS.close}</button>`;
            return `<div class="slot">
                <span class="slot-bar" style="background:${ELEMENT_COLOR[c.type]}"></span>
                <div class="slot-info"><div class="slot-name">${esc(c.name)}</div>
                <div class="slot-sub">ATK ${c.power} · DEF ${c.defense} · Mojo ${c.mojo}</div></div>${remove}</div>`;
        }).join('');
        $('team-atk').textContent = team.reduce((s, c) => s + c.power, 0);
        $('team-def').textContent = team.reduce((s, c) => s + c.defense, 0);

        const missing = ['city', 'forest', 'water'].filter((t) => !team.some((c) => c.type === t));
        let advice = 'Click cards to add them. Mix elements so no opponent can counter your whole team.';
        if (team.length === 3 && missing.length === 0) advice = 'All three elements covered — nothing hard-counters this team.';
        else if (team.length === 3) advice = `No ${missing.map(cap).join(' or ')} on this team. A heavy counter-pick could hurt.`;
        if (game.submitted) advice = 'Team locked! Waiting for your opponent to finish drafting…';
        $('team-advice').textContent = advice;

        const lock = $('lock-in-btn');
        lock.disabled = team.length !== 3 || game.submitted;
        lock.classList.toggle('is-ready', team.length === 3 && !game.submitted);
        lock.classList.toggle('btn-wait', game.submitted);
        lock.textContent = game.submitted ? 'Waiting for opponent…' : team.length === 3 ? 'Lock in & battle' : `Pick ${3 - team.length} more`;
    }

    // ---------- Reveal ----------
    function renderReveal(players) {
        const mine = players.find((p) => p.sessionId === room.sessionId);
        const theirs = players.find((p) => p.sessionId !== room.sessionId);
        $('reveal-mine').innerHTML = (mine ? mine.characters : []).map((c) => cardHTML(c)).join('');
        $('reveal-theirs').innerHTML = (theirs ? theirs.characters : []).map((c) => cardHTML(c)).join('');
        $('reveal-note').textContent = 'Get ready — the battle starts in a moment.';
        showScreen('reveal');
    }

    // ---------- Battle ----------
    $('their-row').addEventListener('click', (e) => {
        const tile = e.target.closest('[data-idx]');
        if (!tile || tile.disabled) return;
        game.tgt = Number(tile.dataset.idx);
        renderBattle();
    });

    $('my-row').addEventListener('click', (e) => {
        const tile = e.target.closest('[data-idx]');
        if (!tile || tile.disabled) return;
        game.sel = Number(tile.dataset.idx);
        renderBattle();
    });

    $('attack-btn').addEventListener('click', () => {
        if (!canAttack()) return;
        room.send('attack', { fromCharacterIndex: game.sel, toCharacterIndex: game.tgt });
        game.isMyTurn = false;
        renderBattle();
    });

    $('defend-btn').addEventListener('click', () => {
        if (!canDefend()) return;
        room.send('defend', { characterIndex: game.sel });
        game.isMyTurn = false;
        renderBattle();
    });

    const alive = (c) => c && !c.isDisabled && c.health > 0;
    const canDefend = () => room && game.started && game.isMyTurn && !game.over && alive(game.mine[game.sel]);
    const canAttack = () => canDefend() && alive(game.theirs[game.tgt]);

    function estimateDamage(a, d) {
        const world = a.type === game.world ? WORLD_BONUS : 1;
        const dmg = a.power * TYPE_CHART[a.type][d.type] * world * (EMO_BONUS[a.emo] || 1) * (RARITY_BONUS[a.rarity] || 1) * (1 - d.defense / 100);
        return Math.floor(dmg);
    }

    function renderWorld() {
        if (!game.world) return;
        document.body.className = `world-${game.world}`;
        const color = ELEMENT_COLOR[game.world];
        $('world-chip').innerHTML = `
            <span class="world-icon" style="background:${color}">${ICONS[game.world].replace('width="96" height="80"', 'width="20" height="18"')}</span>
            <span>World: ${cap(game.world)}</span>
            <span class="world-sub">${cap(game.world)} heroes hit ×${WORLD_BONUS}</span>`;
    }

    function tileHTML(c, i, side) {
        const ko = !alive(c);
        const picked = side === 'mine' ? game.sel === i : game.tgt === i;
        const disabled = ko || !game.isMyTurn || game.over || !game.started;
        const hp = Math.max(0, Math.round(c.health));
        const hpColor = hp > 50 ? '#6BE36B' : hp > 25 ? '#FFC23D' : '#FF4D8D';
        const shielded = side === 'mine' ? game.myDefended === i : game.theirDefended === i;
        const hit = game.hit && game.hit.side === side && game.hit.idx === i ? game.hit : null;
        const classes = ['hero-tile', side, `type-${c.type}`];
        if (picked && !ko) classes.push('is-picked');
        if (ko) classes.push('is-ko');
        if (hit && hit.fresh && hit.kind !== 'blocked') classes.push('is-shaking');
        let hitHTML = '';
        if (hit) {
            const kindClass = hit.kind === 'mojo' ? 'is-mojo' : hit.kind === 'blocked' ? 'is-blocked' : '';
            const anim = hit.fresh ? '' : ' style="animation:none;transform:translateY(-14px)"';
            hitHTML = `<div class="tile-hit ${kindClass}"${anim}>${esc(hit.text)}</div>`;
        }
        const action = side === 'mine' ? 'Use' : 'Target';
        return `<button type="button" class="${classes.join(' ')}" data-idx="${i}" aria-pressed="${picked}" aria-label="${action} ${esc(c.name)}, ${hp} HP" ${disabled ? 'disabled' : ''}>
            <div class="tile-head">
                <span class="tile-emblem">${ICONS[c.type].replace('width="96" height="80"', 'width="30" height="26"')}</span>
                <div class="tile-title"><div class="tile-name">${esc(c.name)}</div><div class="tile-type">${esc(c.type)} · ${esc(c.rarity)}</div></div>
                <span class="tile-mojo" title="Mojo">${esc(c.mojo)}</span>
            </div>
            <div>
                <div class="hp-head"><span>HP</span><span>${hp}/100</span></div>
                <div class="hp-track"><div class="hp-fill" style="width:${hp}%;background:${hpColor}"></div></div>
            </div>
            <div class="tile-stats"><span>ATK ${esc(c.power)}</span><span>DEF ${esc(c.defense)}</span><span>${esc(c.emo)}</span></div>
            ${shielded && !ko ? `<div class="tile-shield">${ICONS.shield}DEFENDING</div>` : ''}
            ${ko ? '<div class="tile-ko"><span>KO!</span></div>' : ''}
            ${hitHTML}
        </button>`;
    }

    function renderBattle() {
        if (!game.mine.length && !game.theirs.length) return;
        // Keep selections on living heroes.
        if (!alive(game.mine[game.sel])) game.sel = game.mine.findIndex(alive);
        if (!alive(game.theirs[game.tgt])) game.tgt = -1;

        $('my-row').innerHTML = game.mine.map((c, i) => tileHTML(c, i, 'mine')).join('');
        $('their-row').innerHTML = game.theirs.map((c, i) => tileHTML(c, i, 'theirs')).join('');
        if (game.hit) game.hit.fresh = false;

        $('my-alive').textContent = `${game.mine.filter(alive).length} of 3 standing`;
        $('their-alive').textContent = `${game.theirs.filter(alive).length} of 3 standing`;

        const pill = $('turn-pill');
        pill.textContent = game.over ? 'Game over' : !game.started ? 'Get ready…' : game.isMyTurn ? 'Your turn' : 'Opponent’s turn';
        pill.classList.toggle('is-mine', game.isMyTurn && game.started && !game.over);

        const a = game.mine[game.sel];
        const d = game.theirs[game.tgt];
        let preview = 'Waiting for your opponent to move…';
        if (game.isMyTurn && alive(a) && alive(d)) {
            const est = estimateDamage(a, d);
            const t = TYPE_CHART[a.type][d.type];
            const tags = [];
            if (t !== 1) tags.push(`×${t} element`);
            if (a.type === game.world) tags.push(`×${WORLD_BONUS} world`);
            if (game.theirDefended === game.tgt) tags.push('they are defending — this will be blocked');
            preview = `${a.name} → ${d.name}: about ${est} damage${tags.length ? ` (${tags.join(', ')})` : ''}${est >= d.health && game.theirDefended !== game.tgt ? ' — KO!' : ''}. ${a.mojo * 10}% Mojo chance to double it.`;
        } else if (game.isMyTurn && alive(a)) {
            preview = `${a.name} is ready. Pick a target above, or Defend to block the next hit on them.`;
        } else if (game.isMyTurn) {
            preview = 'Pick one of your heroes.';
        }
        $('action-preview').textContent = preview;

        $('attack-btn').disabled = !canAttack();
        $('defend-btn').disabled = !canDefend();
        $('attack-btn').classList.toggle('is-ready', canAttack());
    }

    function addLog(text, color, detail) {
        const li = document.createElement('li');
        const bar = document.createElement('span');
        bar.className = 'log-bar';
        bar.style.background = color;
        const body = document.createElement('span');
        body.textContent = text;
        if (detail) {
            const small = document.createElement('span');
            small.className = 'log-detail';
            small.textContent = detail;
            body.appendChild(small);
        }
        li.append(bar, body);
        const log = $('log');
        log.prepend(li);
        while (log.children.length > 40) log.lastChild.remove();
        $('vs-text').textContent = text;
    }

    let hitTimer = null;
    function flashHit(side, idx, text, kind) {
        game.hit = { side, idx, text, kind, fresh: true };
        clearTimeout(hitTimer);
        hitTimer = setTimeout(() => { game.hit = null; renderBattle(); }, 1800);
        renderBattle();
    }

    function showResult(title, text, isWin) {
        game.over = true;
        game.isMyTurn = false;
        $('result-title').textContent = title;
        $('result-text').textContent = text;
        $('result-card').classList.toggle('is-loss', !isWin);
        $('countdown-overlay').hidden = true;
        $('result-overlay').hidden = false;
        $('play-again-btn').focus();
        renderBattle();
    }

    // ---------- Server messages ----------
    function setupRoomHandlers(r) {
        const isMe = (id) => id === r.sessionId;
        const charOf = (playerId, idx) => (isMe(playerId) ? game.mine : game.theirs)[idx];
        const nameOf = (playerId, idx) => (charOf(playerId, idx) || {}).name || `Hero ${idx + 1}`;

        r.onMessage('allCards', (cards) => {
            game.allCards = cards;
            renderDraft();
        });

        r.onMessage('startCardSelection', () => {
            $('topbar-status').textContent = 'Opponent found';
            renderDraft();
            showScreen('draft');
        });

        r.onMessage('displayCards', (message) => {
            game.revealed = message.players;
            renderReveal(message.players);
        });

        r.onMessage('startCharacterPlacement', () => {
            if (game.placementSent) return;
            game.placementSent = true;
            r.send('cardplacementfinish', { positions: [0, 1, 2] });
            $('reveal-note').textContent = 'Lining up your heroes…';
        });

        r.onMessage('start', (message) => {
            game.world = message.worldType;
            renderWorld();
            $('log').innerHTML = '';
            addLog(`World rolled: ${cap(game.world)}. ${cap(game.world)} heroes hit ×${WORLD_BONUS}.`, '#8F88B8');
            $('topbar-status').textContent = '';
            $('countdown-num').textContent = message.countdown;
            $('countdown-world').textContent = `World: ${cap(game.world)}`;
            $('countdown-overlay').hidden = false;
            showScreen('battle');
            renderBattle();
        });

        r.onMessage('countdown', (message) => {
            const num = $('countdown-num');
            num.textContent = message.countdown > 0 ? message.countdown : 'POP!';
            num.style.animation = 'none';
            void num.offsetWidth;
            num.style.animation = '';
        });

        r.onMessage('turn', (message) => {
            game.started = true;
            $('countdown-overlay').hidden = true;
            game.isMyTurn = isMe(message.playerSessionId);
            if (game.isMyTurn && !alive(game.mine[game.sel])) game.sel = game.mine.findIndex(alive);
            renderBattle();
        });

        r.onMessage('attackDetails', (m) => {
            const mineAttacked = isMe(m.attackerId);
            const attacker = nameOf(m.attackerId, m.fromCharacterIndex);
            const defender = nameOf(m.defenderId, m.toCharacterIndex);
            const bits = [];
            if (m.typeMultiplier !== 1) bits.push(`element ×${m.typeMultiplier}`);
            if (m.worldTypeMultiplier !== 1) bits.push(`world ×${m.worldTypeMultiplier}`);
            bits.push(`emo ×${Number(m.emoBonus).toFixed(1)}`);
            bits.push(`rarity ×${Number(m.rarityBonus).toFixed(1)}`);
            addLog(`${attacker} hit ${defender} for ${m.damage}${m.mojoActivated ? ' — MOJO ×2!' : '.'}`,
                mineAttacked ? '#38CFFF' : '#FF7A3D', bits.join(' · '));
            flashHit(mineAttacked ? 'theirs' : 'mine', m.toCharacterIndex,
                `−${m.damage}${m.mojoActivated ? ' MOJO!' : ''}`, m.mojoActivated ? 'mojo' : 'hit');
        });

        r.onMessage('attackBlocked', (m) => {
            const mineAttacked = isMe(m.attackerId);
            addLog(`${nameOf(m.defenderId, m.characterIndex)} blocked the attack!`, '#7FD4FF');
            flashHit(mineAttacked ? 'theirs' : 'mine', m.characterIndex, 'BLOCKED', 'blocked');
        });

        r.onMessage('characterDefended', (m) => {
            addLog(`${nameOf(m.playerId, m.characterIndex)} raises a shield.`, '#7FD4FF');
        });

        r.onMessage('defenseExpired', (m) => {
            addLog(`${nameOf(m.playerId, m.characterIndex)} lowers their shield.`, '#8F88B8');
        });

        r.onMessage('characterDisabled', (m) => {
            addLog(`${nameOf(m.playerId, m.characterIndex)} is knocked out!`, '#FF4D8D');
        });

        // Health is read from the synced room state; these just trigger a redraw.
        r.onMessage('updateHealth', () => renderBattle());

        r.onMessage('gameEnd', (m) => {
            if (game.over) return;
            if (m.reason === 'Player disconnected') {
                showResult('You win!', 'Your opponent left the match.', true);
            } else if (m.result === 'draw') {
                showResult('Draw', 'Both teams got popped at once.', true);
            } else if (isMe(m.winner)) {
                showResult('Victory!', 'All three of their heroes popped. Nice drafting.', true);
            } else {
                showResult('Defeat', 'Your team got popped. Try a different element mix.', false);
            }
        });

        r.onStateChange((state) => {
            const players = Array.from(state.players.values());
            const me = players.find((p) => p.sessionId === r.sessionId);
            const them = players.find((p) => p.sessionId !== r.sessionId);
            game.mine = me ? Array.from(me.characters.values()).slice(0, 3) : [];
            game.theirs = them ? Array.from(them.characters.values()).slice(0, 3) : [];
            game.myDefended = me ? me.defendedCharacterIndex : -1;
            game.theirDefended = them ? them.defendedCharacterIndex : -1;
            if (state.worldType && state.worldType !== game.world && game.started) {
                game.world = state.worldType;
                renderWorld();
            }
            if (!$('screen-battle').hidden) renderBattle();
        });

        r.onLeave(() => {
            if (room !== r) return; // left on purpose
            room = null;
            if (game.over) return;
            if (!$('screen-lobby').hidden) {
                setSearching(false);
                $('lobby-error').textContent = 'Lost connection to the server. Try again.';
            } else {
                showResult('Disconnected', 'The connection to the game server was lost.', false);
            }
        });
    }

    showScreen('lobby');
});
