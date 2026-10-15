document.addEventListener('DOMContentLoaded', () => {
    // ---------- Config ----------
    const params = new URLSearchParams(window.location.search);
    const isLocalPage = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    const SERVER_URL = params.get('server')
        || (isLocalPage ? 'ws://localhost:2567' : 'wss://popitz-server-4682fddc412a.herokuapp.com');
    const client = new Colyseus.Client(SERVER_URL);

    const ELEMENT_COLOR = { city: '#FFC23D', forest: '#6BE36B', water: '#38CFFF' };
    const WORLD_BONUS = 1.2;
    const OUTLINE = '#120F2A';

    // ---------- Small helpers ----------
    const $ = (id) => document.getElementById(id);
    const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '');
    function seeded(seed) {
        let s = seed;
        return () => {
            s = (s * 9301 + 49297) % 233280;
            return s / 233280;
        };
    }

    // ---------- Art: element icons ----------
    const ELEMENT_ICON = {
        city: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 21V9l6-4v16zM10 21V7h6v14zM17 21v-9h4v9z"/></svg>',
        forest: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 3C9 3 4 9.5 4 15.5c0 2.3 1 4.5 1 4.5s3-8.5 11-10.5c-6 3.2-8 8-8 11.5 9 0 12-7.5 12-18z"/></svg>',
        water: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C8 8 5 11.5 5 15a7 7 0 0 0 14 0c0-3.5-3-7-7-13z"/></svg>'
    };
    const STAR = (fill) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 3 6.6 7 .8-5.2 4.8 1.4 7L12 17.8 5.8 21.2l1.4-7L2 9.4l7-.8L12 2z" fill="${fill}" stroke="${OUTLINE}" stroke-width="2" stroke-linejoin="round"/></svg>`;

    // ---------- Art: creatures ----------
    const PALETTE = {
        city: [['#FFC23D', '#D98E00'], ['#FF9F43', '#D9661C'], ['#FFD86B', '#D9A520'], ['#F7B32B', '#C27C00']],
        forest: [['#6BE36B', '#2FA84A'], ['#3CCB7F', '#1E8F55'], ['#9BE15D', '#5FA62B'], ['#4FD69C', '#22966A']],
        water: [['#38CFFF', '#1A8FC2'], ['#5B8CFF', '#3457C9'], ['#5CE1E6', '#2AA3AA'], ['#4AA8FF', '#2167C2']]
    };

    function face(cx, ey, my, emo) {
        const o = OUTLINE;
        const lx = cx - 13;
        const rx = cx + 13;
        const eye = (x, r = 8, pr = 4, px = 0, py = 0) =>
            `<circle cx="${x}" cy="${ey}" r="${r}" fill="#fff" stroke="${o}" stroke-width="2.5"/>` +
            `<circle cx="${x + px}" cy="${ey + py}" r="${pr}" fill="${o}"/>` +
            `<circle cx="${x + px + 1.6}" cy="${ey + py - 1.8}" r="1.5" fill="#fff"/>`;
        const blush = `<ellipse cx="${cx - 22}" cy="${my - 5}" rx="5" ry="3" fill="#FF6F9E" opacity=".6"/><ellipse cx="${cx + 22}" cy="${my - 5}" rx="5" ry="3" fill="#FF6F9E" opacity=".6"/>`;
        const smile = `<path d="M${cx - 10} ${my - 3} Q${cx} ${my + 10} ${cx + 10} ${my - 3} Z" fill="#7A1F3D" stroke="${o}" stroke-width="2.5" stroke-linejoin="round"/>`;
        const heart = (x) => `<path d="M${x} ${ey + 7} C${x - 12} ${ey - 1} ${x - 7} ${ey - 11} ${x} ${ey - 4} C${x + 7} ${ey - 11} ${x + 12} ${ey - 1} ${x} ${ey + 7} Z" fill="#FF4D8D" stroke="${o}" stroke-width="2.5" stroke-linejoin="round"/>`;
        switch (emo) {
            case 'Happiness':
                return `<path d="M${lx - 7} ${ey + 2} Q${lx} ${ey - 8} ${lx + 7} ${ey + 2}" fill="none" stroke="${o}" stroke-width="3.5" stroke-linecap="round"/>` +
                    `<path d="M${rx - 7} ${ey + 2} Q${rx} ${ey - 8} ${rx + 7} ${ey + 2}" fill="none" stroke="${o}" stroke-width="3.5" stroke-linecap="round"/>` + smile + blush;
            case 'Anger':
                return eye(lx, 8, 4, 1, 1) + eye(rx, 8, 4, -1, 1) +
                    `<path d="M${lx - 10} ${ey - 13} L${lx + 7} ${ey - 6}" stroke="${o}" stroke-width="4.5" stroke-linecap="round"/>` +
                    `<path d="M${rx + 10} ${ey - 13} L${rx - 7} ${ey - 6}" stroke="${o}" stroke-width="4.5" stroke-linecap="round"/>` +
                    `<rect x="${cx - 11}" y="${my - 4}" width="22" height="8" rx="3" fill="#fff" stroke="${o}" stroke-width="2.5"/>` +
                    `<path d="M${cx - 4} ${my - 4} V${my + 4} M${cx + 4} ${my - 4} V${my + 4}" stroke="${o}" stroke-width="1.8"/>`;
            case 'Sadness':
                return eye(lx, 8, 4, 0, 3) + eye(rx, 8, 4, 0, 3) +
                    `<path d="M${lx - 8} ${ey - 8} L${lx + 6} ${ey - 13}" stroke="${o}" stroke-width="3.5" stroke-linecap="round"/>` +
                    `<path d="M${rx + 8} ${ey - 8} L${rx - 6} ${ey - 13}" stroke="${o}" stroke-width="3.5" stroke-linecap="round"/>` +
                    `<path d="M${cx - 9} ${my + 4} Q${cx} ${my - 5} ${cx + 9} ${my + 4}" fill="none" stroke="${o}" stroke-width="3.5" stroke-linecap="round"/>` +
                    `<path d="M${rx + 6} ${ey + 8} q-4 7 0 9 q4 -2 0 -9z" fill="#7FD4FF" stroke="${o}" stroke-width="1.8"/>`;
            case 'Fear':
                return eye(lx, 9, 2.5, 0, 0) + eye(rx, 9, 2.5, 0, 0) +
                    `<path d="M${cx - 11} ${my} Q${cx - 5.5} ${my - 5} ${cx} ${my} Q${cx + 5.5} ${my + 5} ${cx + 11} ${my}" fill="none" stroke="${o}" stroke-width="3.5" stroke-linecap="round"/>` +
                    `<path d="M${cx + 30} ${ey - 20} q-5 8 0 11 q5 -3 0 -11z" fill="#BDEBFF" stroke="${o}" stroke-width="2"/>`;
            case 'Surprise':
                return eye(lx, 9, 4) + eye(rx, 9, 4) +
                    `<path d="M${lx - 8} ${ey - 15} Q${lx} ${ey - 20} ${lx + 8} ${ey - 15}" fill="none" stroke="${o}" stroke-width="3.5" stroke-linecap="round"/>` +
                    `<path d="M${rx - 8} ${ey - 15} Q${rx} ${ey - 20} ${rx + 8} ${ey - 15}" fill="none" stroke="${o}" stroke-width="3.5" stroke-linecap="round"/>` +
                    `<ellipse cx="${cx}" cy="${my + 1}" rx="5.5" ry="7" fill="#7A1F3D" stroke="${o}" stroke-width="2.5"/>` + blush;
            case 'Disgust':
                return eye(lx, 8, 4, 2, 0) +
                    `<path d="M${rx - 8} ${ey + 1} L${rx + 8} ${ey - 2}" stroke="${o}" stroke-width="4" stroke-linecap="round"/>` +
                    `<path d="M${cx - 11} ${my - 2} Q${cx - 5} ${my + 2} ${cx} ${my - 2} Q${cx + 5} ${my - 6} ${cx + 11} ${my - 2}" fill="none" stroke="${o}" stroke-width="3.5" stroke-linecap="round"/>` +
                    `<path d="M${cx + 1} ${my} q2 9 7 6 q2 -3 -1 -8z" fill="#FF7AA0" stroke="${o}" stroke-width="2"/>`;
            case 'Love':
                return heart(lx) + heart(rx) + smile + blush;
            case 'Curiosity':
                return eye(lx, 9, 4.5, 3, -2) + eye(rx, 6, 3, 2, -1) +
                    `<path d="M${rx - 7} ${ey - 14} Q${rx} ${ey - 21} ${rx + 8} ${ey - 13}" fill="none" stroke="${o}" stroke-width="3.5" stroke-linecap="round"/>` +
                    `<circle cx="${cx + 6}" cy="${my}" r="3.5" fill="#7A1F3D" stroke="${o}" stroke-width="2.5"/>` + blush;
            default:
                return eye(lx) + eye(rx) + smile;
        }
    }

    function crown(cx, y) {
        return `<path d="M${cx - 17} ${y} L${cx - 19} ${y - 15} L${cx - 9} ${y - 7} L${cx} ${y - 20} L${cx + 9} ${y - 7} L${cx + 19} ${y - 15} L${cx + 17} ${y} Z" fill="#FFD45E" stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round"/>` +
            `<circle cx="${cx}" cy="${y - 6}" r="3" fill="#FF4D8D" stroke="${OUTLINE}" stroke-width="1.8"/>`;
    }
    function sparkle(x, y) {
        return `<path d="M${x} ${y - 9} Q${x + 1.5} ${y - 1.5} ${x + 9} ${y} Q${x + 1.5} ${y + 1.5} ${x} ${y + 9} Q${x - 1.5} ${y + 1.5} ${x - 9} ${y} Q${x - 1.5} ${y - 1.5} ${x} ${y - 9} Z" fill="#E3DBFF" stroke="${OUTLINE}" stroke-width="2" stroke-linejoin="round"/>`;
    }

    // Draws a hero in a 120x120 box, centred on x=60.
    function creature(card) {
        const [body, shade] = PALETTE[card.type][(card.id || 0) % 4];
        const o = OUTLINE;
        let parts = '';
        let faceY;
        let mouthY;
        let topY;
        if (card.type === 'city') {
            parts =
                `<path d="M84 36 L92 20" stroke="${o}" stroke-width="3.5" stroke-linecap="round"/><circle cx="93" cy="17" r="5.5" fill="#FF4D8D" stroke="${o}" stroke-width="3"/>` +
                `<rect x="33" y="97" width="18" height="12" rx="5" fill="${shade}" stroke="${o}" stroke-width="3"/><rect x="69" y="97" width="18" height="12" rx="5" fill="${shade}" stroke="${o}" stroke-width="3"/>` +
                `<rect x="14" y="62" width="14" height="22" rx="7" fill="${shade}" stroke="${o}" stroke-width="3"/><rect x="92" y="62" width="14" height="22" rx="7" fill="${shade}" stroke="${o}" stroke-width="3"/>` +
                `<rect x="24" y="34" width="72" height="68" rx="20" fill="${body}" stroke="${o}" stroke-width="3.5"/>` +
                `<rect x="31" y="44" width="58" height="40" rx="14" fill="#2A2160" stroke="${o}" stroke-width="3"/>` +
                `<rect x="35" y="47" width="22" height="6" rx="3" fill="#fff" opacity=".18"/>` +
                `<rect x="48" y="88" width="24" height="8" rx="4" fill="${shade}" stroke="${o}" stroke-width="2.5"/>`;
            faceY = 60;
            mouthY = 75;
            topY = 35;
        } else if (card.type === 'forest') {
            parts =
                `<path d="M60 42 C44 14 22 20 22 34 C32 44 50 46 60 42 Z" fill="${shade}" stroke="${o}" stroke-width="3.5" stroke-linejoin="round"/>` +
                `<path d="M60 42 C76 14 98 20 98 34 C88 44 70 46 60 42 Z" fill="${shade}" stroke="${o}" stroke-width="3.5" stroke-linejoin="round"/>` +
                `<ellipse cx="44" cy="107" rx="10" ry="6" fill="${shade}" stroke="${o}" stroke-width="3"/><ellipse cx="76" cy="107" rx="10" ry="6" fill="${shade}" stroke="${o}" stroke-width="3"/>` +
                `<ellipse cx="60" cy="74" rx="38" ry="35" fill="${body}" stroke="${o}" stroke-width="3.5"/>` +
                `<ellipse cx="44" cy="54" rx="8" ry="5" fill="#fff" opacity=".3" transform="rotate(-25 44 54)"/>`;
            faceY = 70;
            mouthY = 88;
            topY = 41;
        } else {
            parts =
                `<path d="M25 78 C9 70 6 90 18 98 Z" fill="${shade}" stroke="${o}" stroke-width="3" stroke-linejoin="round"/>` +
                `<path d="M95 78 C111 70 114 90 102 98 Z" fill="${shade}" stroke="${o}" stroke-width="3" stroke-linejoin="round"/>` +
                `<path d="M60 20 C74 40 98 56 98 80 C98 101 81 112 60 112 C39 112 22 101 22 80 C22 56 46 40 60 20 Z" fill="${body}" stroke="${o}" stroke-width="3.5" stroke-linejoin="round"/>` +
                `<ellipse cx="42" cy="66" rx="5" ry="10" fill="#fff" opacity=".45" transform="rotate(20 42 66)"/>`;
            faceY = 76;
            mouthY = 94;
            topY = 34;
        }
        let extra = '';
        if (card.rarity === 'Legendary') extra = crown(60, topY);
        else if (card.rarity === 'Rare') extra = sparkle(card.type === 'city' ? 30 : 92, card.type === 'city' ? 30 : topY + 10);
        return parts + face(60, faceY, mouthY, card.emo) + extra;
    }

    function cardScenery(type) {
        if (type === 'city') {
            return '<path d="M0 140V112h8V100h10v12h6V94h12v18h6v-8h10v8h8V98h12v14h6v-6h10v6h12v28Z" fill="#1B1240" opacity=".75"/>';
        }
        if (type === 'forest') {
            return '<path d="M0 140V118 L8 104 L16 118 L22 98 L30 118 L74 118 L80 100 L88 118 L94 106 L100 118V140Z" fill="#0B2A1C" opacity=".8"/><ellipse cx="50" cy="132" rx="70" ry="16" fill="#0B2A1C" opacity=".8"/>';
        }
        return '<path d="M0 120 Q12 112 25 120 T50 120 T75 120 T100 120 V140 H0Z" fill="#0A2E5A" opacity=".8"/><path d="M0 128 Q12 121 25 128 T50 128 T75 128 T100 128 V140 H0Z" fill="#071F40" opacity=".9"/>';
    }

    function cardHTML(card) {
        return `
            <div class="card el-${esc(card.type)} r-${esc(card.rarity)}">
                <div class="card-art el-${esc(card.type)}">
                    <svg viewBox="0 0 100 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                        ${cardScenery(card.type)}
                        <g transform="translate(-4 4) scale(0.9)">${creature(card)}</g>
                    </svg>
                </div>
                <div class="card-name${String(card.name).length > 13 ? ' long' : ''}">${esc(card.name)}</div>
                <div class="badge badge-mojo" title="Mojo ${esc(card.mojo)}"><span>${esc(card.mojo)}</span></div>
                <div class="badge badge-el" title="${esc(cap(card.type))}">${ELEMENT_ICON[card.type] || ''}</div>
                <div class="badge badge-atk" title="Attack">${esc(card.power)}</div>
                <div class="badge badge-def" title="Defense">${esc(card.defense)}</div>
            </div>`;
    }

    function creatureSVG(card) {
        return `<svg viewBox="0 0 120 124" aria-hidden="true"><ellipse cx="60" cy="114" rx="34" ry="7" fill="#000" opacity=".25"/>${creature(card)}</svg>`;
    }

    // ---------- Art: scenery ----------
    function sceneSegment(type, x0, x1, rnd) {
        const H = 400;
        let out = '';
        if (type === 'city') {
            for (const [fill, minH, maxH, wMin] of [['rgba(12,6,34,0.55)', 120, 280, 50], ['rgba(10,5,28,0.92)', 70, 190, 60]]) {
                let x = x0;
                while (x < x1) {
                    const w = wMin + rnd() * 50;
                    const h = minH + rnd() * (maxH - minH);
                    out += `<rect x="${x.toFixed(0)}" y="${(H - h).toFixed(0)}" width="${(w + 1).toFixed(0)}" height="${h.toFixed(0)}" fill="${fill}"/>`;
                    if (fill.includes('0.92')) {
                        for (let wy = H - h + 14; wy < H - 20; wy += 22) {
                            for (let wx = x + 10; wx < x + w - 12; wx += 16) {
                                if (rnd() > 0.55) out += `<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="7" height="10" fill="#FFC23D" opacity="${(0.35 + rnd() * 0.5).toFixed(2)}"/>`;
                            }
                        }
                    }
                    x += w;
                }
            }
        } else if (type === 'forest') {
            out += `<path d="M${x0} ${H - 120} Q${(x0 + x1) / 2} ${H - 200} ${x1} ${H - 120} V${H} H${x0} Z" fill="rgba(6,32,20,0.5)"/>`;
            for (const [fill, minH, maxH, base] of [['rgba(6,32,20,0.6)', 120, 220, H - 60], ['rgba(4,20,12,0.95)', 90, 170, H]]) {
                let x = x0 - 20;
                while (x < x1) {
                    const w = 50 + rnd() * 40;
                    const h = minH + rnd() * (maxH - minH);
                    const cx = x + w / 2;
                    for (let t = 0; t < 3; t++) {
                        const ty = base - t * h * 0.28;
                        const tw = w * (1 - t * 0.22);
                        out += `<polygon points="${(cx - tw / 2).toFixed(0)},${ty.toFixed(0)} ${cx.toFixed(0)},${(ty - h * 0.5).toFixed(0)} ${(cx + tw / 2).toFixed(0)},${ty.toFixed(0)}" fill="${fill}"/>`;
                    }
                    x += w * 0.7;
                }
            }
            out += `<rect x="${x0}" y="${H - 14}" width="${x1 - x0}" height="14" fill="rgba(4,20,12,0.95)"/>`;
        } else {
            const layers = [['rgba(8,60,110,0.55)', H - 150, 28], ['rgba(6,42,84,0.8)', H - 100, 22], ['rgba(4,28,60,0.95)', H - 50, 18]];
            for (const [fill, y, amp] of layers) {
                let d = `M${x0} ${y}`;
                const step = 80;
                for (let x = x0; x < x1; x += step) {
                    d += ` Q${x + step / 4} ${y - amp} ${x + step / 2} ${y} T${x + step} ${y}`;
                }
                d += ` V${H} H${x0} Z`;
                out += `<path d="${d}" fill="${fill}"/>`;
            }
            for (let i = 0; i < 6; i++) {
                const fx = x0 + rnd() * (x1 - x0);
                const fy = H - 140 + rnd() * 110;
                out += `<path d="M${fx.toFixed(0)} ${fy.toFixed(0)} q12 -8 24 0" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="4" stroke-linecap="round"/>`;
            }
        }
        return out;
    }

    function sceneSVG(types) {
        const W = 1600;
        const rnd = seeded(7);
        const seg = W / types.length;
        const body = types.map((t, i) => sceneSegment(t, i * seg, (i + 1) * seg, rnd)).join('');
        return `<svg viewBox="0 0 ${W} 400" preserveAspectRatio="xMidYMax slice">${body}</svg>`;
    }

    function setScenery(world) {
        document.body.className = world ? `world-${world}` : '';
        $('scenery').innerHTML = sceneSVG(world ? [world] : ['city', 'forest', 'water']);
    }

    // ---------- Game state ----------
    let room = null;
    let game = freshGame();

    function freshGame() {
        return {
            allCards: [],
            picked: [],
            submitted: false,
            placementSent: false,
            world: '',
            mine: [],
            theirs: [],
            myDefended: -1,
            theirDefended: -1,
            isMyTurn: false,
            started: false,
            sel: -1,
            over: false,
            arenaBuilt: false
        };
    }

    const SCREENS = ['lobby', 'draft', 'reveal', 'battle'];
    function showScreen(name) {
        SCREENS.forEach((s) => { $(`screen-${s}`).hidden = s !== name; });
        $('scenery').hidden = name === 'reveal';
        window.scrollTo({ top: 0 });
    }

    // ---------- Title screen ----------
    const FEATURED = [
        { id: 10, name: 'Techno Wizard', type: 'city', power: 75, emo: 'Surprise', rarity: 'Rare', defense: 55, mojo: 6 },
        { id: 4, name: 'Forest Druid', type: 'forest', power: 60, emo: 'Love', rarity: 'Rare', defense: 60, mojo: 8 },
        { id: 9, name: 'Kraken Lord', type: 'water', power: 95, emo: 'Anger', rarity: 'Legendary', defense: 85, mojo: 9 }
    ];
    $('mascots').innerHTML = FEATURED.map((c) => `<div class="mascot">${creatureSVG(c)}</div>`).join('');
    setScenery('');

    $('find-match-btn').addEventListener('click', findMatch);
    $('cancel-match-btn').addEventListener('click', cancelMatch);
    $('play-again-btn').addEventListener('click', backToLobby);
    $('help-btn').addEventListener('click', () => { $('help-overlay').hidden = false; $('help-close').focus(); });
    $('help-close').addEventListener('click', () => { $('help-overlay').hidden = true; });
    $('help-overlay').addEventListener('click', (e) => { if (e.target.id === 'help-overlay') $('help-overlay').hidden = true; });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $('help-overlay').hidden = true; });

    $('help-grid').innerHTML = [
        [`<svg viewBox="0 0 120 92">${[-14, 0, 14].map((r, i) => `<rect x="${38 + i * 14}" y="14" width="40" height="58" rx="7" fill="${['#FFC23D', '#6BE36B', '#38CFFF'][i]}" stroke="${OUTLINE}" stroke-width="4" transform="rotate(${r} ${58 + i * 2} 72)"/>`).join('')}</svg>`, 'PICK 3', 'heroes'],
        [`<svg viewBox="0 0 120 100">
            <path d="M68 24 L92 64" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M84 70 L36 70" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M28 64 L52 24" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
            <path d="M92 64 l-1 -11 m1 11 l-10 -4" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M36 70 l9 -6 m-9 6 l9 6" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M52 24 l-1 11 m1 -11 l-10 4" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
            <circle cx="60" cy="18" r="16" fill="#FFC23D" stroke="${OUTLINE}" stroke-width="4"/><circle cx="100" cy="80" r="16" fill="#6BE36B" stroke="${OUTLINE}" stroke-width="4"/><circle cx="20" cy="80" r="16" fill="#38CFFF" stroke="${OUTLINE}" stroke-width="4"/>
            <g transform="translate(51 9) scale(.75)" color="${OUTLINE}">${ELEMENT_ICON.city.replace(/<\/?svg[^>]*>/g, '')}</g>
            <g transform="translate(91 71) scale(.75)" color="${OUTLINE}">${ELEMENT_ICON.forest.replace(/<\/?svg[^>]*>/g, '')}</g>
            <g transform="translate(11 71) scale(.75)" color="${OUTLINE}">${ELEMENT_ICON.water.replace(/<\/?svg[^>]*>/g, '')}</g>
        </svg>`, '×2', 'beat the next element'],
        [`<svg viewBox="0 0 100 92"><circle cx="50" cy="46" r="38" fill="#38CFFF" stroke="${OUTLINE}" stroke-width="5"/><g transform="translate(26 22) scale(2)" color="${OUTLINE}">${ELEMENT_ICON.water.replace(/<\/?svg[^>]*>/g, '')}</g></svg>`, '×1.2', 'world bonus'],
        [`<svg viewBox="0 0 100 92"><rect x="22" y="18" width="56" height="56" rx="12" transform="rotate(45 50 46)" fill="#FFD45E" stroke="${OUTLINE}" stroke-width="5"/><text x="50" y="58" text-anchor="middle" font-family="Lilita One, sans-serif" font-size="34" fill="#fff" stroke="${OUTLINE}" stroke-width="5" paint-order="stroke">9</text></svg>`, 'MOJO', '90% = double hit'],
        [`<svg viewBox="0 0 100 92"><path d="M50 86s34-16 34-42V16L50 4 16 16v28c0 26 34 42 34 42z" fill="#3FA9FF" stroke="${OUTLINE}" stroke-width="5" stroke-linejoin="round"/></svg>`, 'DEFEND', 'block one hit']
    ].map(([art, big, small]) => `<div class="help-tile"><div class="help-art">${art}</div><div class="help-big">${big}</div><div class="help-small">${small}</div></div>`).join('');

    function setSearching(on, text) {
        $('find-match-btn').hidden = on;
        $('searching').hidden = !on;
        if (text) $('searching-text').textContent = text;
    }

    async function findMatch() {
        $('lobby-error').textContent = '';
        setSearching(true, 'Connecting');
        try {
            room = await client.joinOrCreate('game');
            setupRoomHandlers(room);
            setSearching(true, 'Finding opponent');
        } catch (e) {
            console.error('Error joining game room', e);
            room = null;
            setSearching(false);
            $('lobby-error').textContent = "Can't reach the server. Try again!";
        }
    }

    function cancelMatch() {
        if (room) {
            const r = room;
            room = null;
            r.leave();
        }
        setSearching(false);
    }

    function backToLobby() {
        if (room) {
            const r = room;
            room = null;
            try { r.leave(); } catch (e) { /* already closed */ }
        }
        game = freshGame();
        ['result-overlay', 'countdown-overlay', 'wait-overlay'].forEach((id) => { $(id).hidden = true; });
        $('confetti').innerHTML = '';
        $('my-row').innerHTML = '';
        $('their-row').innerHTML = '';
        setScenery('');
        setSearching(false);
        showScreen('lobby');
    }

    // ---------- Draft ----------
    function pipsHTML(filled, total = 3, lostFrom = null) {
        return Array.from({ length: total }, (_, i) => {
            let cls = 'pip';
            if (lostFrom !== null) cls += i < lostFrom ? ' on' : ' lost';
            else if (i < filled) cls += ' on';
            return `<span class="${cls}"></span>`;
        }).join('');
    }

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
        $('wait-overlay').hidden = false;
        renderDraft();
    });

    function togglePick(id) {
        if (game.picked.includes(id)) game.picked = game.picked.filter((x) => x !== id);
        else if (game.picked.length < 3) game.picked = game.picked.concat(id);
        renderDraft();
    }

    function renderDraft(first) {
        const cards = game.allCards;
        const full = game.picked.length >= 3;
        $('card-grid').innerHTML = cards.map((c, i) => {
            const n = game.picked.indexOf(c.id);
            const cls = ['pick'];
            if (n >= 0) cls.push('is-picked');
            else if (full) cls.push('is-dim');
            const delay = first ? ` style="animation-delay:${i * 45}ms"` : ' style="animation:none"';
            return `<button type="button" class="${cls.join(' ')}" data-card-id="${c.id}" aria-pressed="${n >= 0}"
                aria-label="${esc(c.name)}, ${esc(c.type)}, attack ${c.power}, defense ${c.defense}, mojo ${c.mojo}"${delay} ${game.submitted ? 'disabled' : ''}>
                ${n >= 0 ? `<span class="pick-num">${n + 1}</span>` : ''}${cardHTML(c)}</button>`;
        }).join('');

        const team = game.picked.map((id) => cards.find((c) => c.id === id)).filter(Boolean);
        $('team-slots').innerHTML = [0, 1, 2].map((i) => {
            const c = team[i];
            if (!c) return '<div class="tray-slot"></div>';
            return `<button type="button" class="tray-slot filled" data-remove-id="${c.id}" aria-label="Remove ${esc(c.name)}">${cardHTML(c)}</button>`;
        }).join('');
        $('draft-pips').innerHTML = pipsHTML(team.length);
        $('lock-in-btn').disabled = team.length !== 3 || game.submitted;
    }

    // ---------- VS splash ----------
    function renderReveal(players) {
        const mine = players.find((p) => p.sessionId === room.sessionId);
        const theirs = players.find((p) => p.sessionId !== room.sessionId);
        $('reveal-mine').innerHTML = (mine ? mine.characters : []).map(cardHTML).join('');
        $('reveal-theirs').innerHTML = (theirs ? theirs.characters : []).map(cardHTML).join('');
        $('wait-overlay').hidden = true;
        showScreen('reveal');
    }

    // ---------- Arena ----------
    const alive = (c) => c && !c.isDisabled && c.health > 0;
    const canAct = () => room && game.started && game.isMyTurn && !game.over && alive(game.mine[game.sel]);

    function fighterHTML(c, i, side) {
        return `<button type="button" class="fighter" data-idx="${i}" data-side="${side}">
            <div class="hp"><div class="hp-fill"></div><span class="hp-num">100</span></div>
            ${cardHTML(c)}
            <div class="target-ring"></div>
            <div class="shield-bubble"></div>
            <div class="ko-mark">KO!</div>
        </button>`;
    }

    function buildArena() {
        if (game.arenaBuilt || game.mine.length < 3 || game.theirs.length < 3) return;
        $('my-row').innerHTML = game.mine.map((c, i) => fighterHTML(c, i, 'mine')).join('');
        $('their-row').innerHTML = game.theirs.map((c, i) => fighterHTML(c, i, 'theirs')).join('');
        game.arenaBuilt = true;
    }

    const fighterEl = (side, idx) => $(side === 'mine' ? 'my-row' : 'their-row').children[idx];

    function updateFighter(el, c, i, side) {
        if (!el || !c) return;
        const hp = Math.max(0, Math.round(c.health));
        const ko = !alive(c);
        const fill = el.querySelector('.hp-fill');
        fill.style.width = `${hp}%`;
        fill.style.backgroundColor = hp > 50 ? '#6BE36B' : hp > 25 ? '#FFC23D' : '#FF4D8D';
        el.querySelector('.hp-num').textContent = hp;
        const selected = side === 'mine' && game.sel === i && !ko && game.isMyTurn;
        const targetable = side === 'theirs' && !ko && canAct();
        const defending = (side === 'mine' ? game.myDefended : game.theirDefended) === i && !ko;
        el.classList.toggle('is-ko', ko);
        el.classList.toggle('is-selected', selected);
        el.classList.toggle('is-targetable', targetable);
        el.classList.toggle('is-defending', defending);
        el.disabled = ko || !game.isMyTurn || game.over || !game.started;
        const verb = side === 'mine' ? 'Select' : 'Attack';
        el.setAttribute('aria-label', `${verb} ${c.name}, ${hp} health${defending ? ', defending' : ''}${ko ? ', knocked out' : ''}`);
        if (side === 'mine') el.setAttribute('aria-pressed', String(selected));
    }

    function renderArena() {
        buildArena();
        if (!game.arenaBuilt) return;
        if (game.isMyTurn && !alive(game.mine[game.sel])) game.sel = game.mine.findIndex(alive);
        game.mine.forEach((c, i) => updateFighter(fighterEl('mine', i), c, i, 'mine'));
        game.theirs.forEach((c, i) => updateFighter(fighterEl('theirs', i), c, i, 'theirs'));
        const myLeft = game.mine.filter(alive).length;
        const foeLeft = game.theirs.filter(alive).length;
        $('you-pips').innerHTML = pipsHTML(0, 3, myLeft);
        $('foe-pips').innerHTML = pipsHTML(0, 3, foeLeft);

        const hint = $('hint');
        let text = '';
        if (game.over || !game.started) text = '';
        else if (!game.isMyTurn) text = 'Enemy turn…';
        else if (canAct()) text = 'Tap an enemy to attack!';
        else text = 'Pick your hero';
        hint.textContent = text;
        hint.classList.toggle('is-yours', game.isMyTurn && game.started && !game.over);
        $('defend-btn').disabled = !canAct();
    }

    function renderWorld() {
        if (!game.world) return;
        setScenery(game.world);
        $('world-medal').innerHTML = `<span class="medal-icon" style="background:${ELEMENT_COLOR[game.world]}">${ELEMENT_ICON[game.world]}</span><span>×${WORLD_BONUS}</span>`;
        $('world-medal').setAttribute('aria-label', `World: ${game.world}. ${game.world} heroes deal ${WORLD_BONUS} times damage.`);
    }

    $('my-row').addEventListener('click', (e) => {
        const f = e.target.closest('.fighter');
        if (!f || f.disabled) return;
        game.sel = Number(f.dataset.idx);
        renderArena();
    });
    $('their-row').addEventListener('click', (e) => {
        const f = e.target.closest('.fighter');
        if (!f || f.disabled || !canAct()) return;
        const tgt = Number(f.dataset.idx);
        if (!alive(game.theirs[tgt])) return;
        room.send('attack', { fromCharacterIndex: game.sel, toCharacterIndex: tgt });
        game.isMyTurn = false;
        renderArena();
    });
    $('defend-btn').addEventListener('click', () => {
        if (!canAct()) return;
        room.send('defend', { characterIndex: game.sel });
        game.isMyTurn = false;
        renderArena();
    });

    // ---------- Effects ----------
    function centerOf(el) {
        const a = $('screen-battle').getBoundingClientRect();
        const r = el.querySelector('.card').getBoundingClientRect();
        return { x: r.left - a.left + r.width / 2, y: r.top - a.top + r.height / 2 };
    }

    function fx(html, x, y, cls, life = 1600) {
        const d = document.createElement('div');
        d.className = cls;
        // Keep pop-ups on screen when a hero sits near the edge.
        const w = $('screen-battle').clientWidth;
        d.style.left = `${Math.min(Math.max(x, 80), w - 80)}px`;
        d.style.top = `${y}px`;
        d.innerHTML = html;
        $('fx').appendChild(d);
        setTimeout(() => d.remove(), life);
        return d;
    }

    function sparks(x, y, color, n = 12) {
        for (let i = 0; i < n; i++) {
            const a = (Math.PI * 2 * i) / n + Math.random() * 0.4;
            const dist = 60 + Math.random() * 70;
            const s = fx('', x, y, 'fx-spark', 800);
            s.style.setProperty('--dx', `${Math.cos(a) * dist}px`);
            s.style.setProperty('--dy', `${Math.sin(a) * dist}px`);
            s.style.setProperty('--spark', color);
        }
    }

    function lunge(fromEl, toEl, then) {
        if (!fromEl || !toEl) { then(); return; }
        const a = centerOf(fromEl);
        const b = centerOf(toEl);
        const dx = (b.x - a.x) * 0.6;
        const dy = (b.y - a.y) * 0.6;
        const card = fromEl.querySelector('.card');
        fromEl.style.zIndex = 4;
        const anim = card.animate([
            { transform: 'translate(0,0) rotate(0) scale(1)' },
            { transform: `translate(${-dx * 0.08}px, ${-dy * 0.08}px) rotate(-6deg) scale(1.05)`, offset: 0.25 },
            { transform: `translate(${dx}px, ${dy}px) rotate(4deg) scale(1.12)`, offset: 0.5 },
            { transform: 'translate(0,0) rotate(0) scale(1)' }
        ], { duration: 620, easing: 'cubic-bezier(.3,.7,.4,1)' });
        setTimeout(then, 310);
        anim.onfinish = () => { fromEl.style.zIndex = ''; };
    }

    function hitShake(el) {
        if (!el) return;
        el.classList.remove('shake');
        void el.offsetWidth;
        el.classList.add('shake');
        setTimeout(() => el.classList.remove('shake'), 500);
    }

    function quake() {
        const s = $('screen-battle');
        s.classList.remove('quake');
        void s.offsetWidth;
        s.classList.add('quake');
    }

    let lastHitAt = 0;
    function playAttack(m, mineAttacked) {
        lastHitAt = Date.now();
        const fromEl = fighterEl(mineAttacked ? 'mine' : 'theirs', m.fromCharacterIndex);
        const toEl = fighterEl(mineAttacked ? 'theirs' : 'mine', m.toCharacterIndex);
        lunge(fromEl, toEl, () => {
            if (!toEl) return;
            const p = centerOf(toEl);
            fx('', p.x, p.y, 'fx-flash', 500);
            sparks(p.x, p.y, m.mojoActivated ? '#FFD45E' : '#FF5470', m.mojoActivated ? 18 : 12);
            hitShake(toEl);
            if (m.mojoActivated || m.damage >= 60) quake();
            fx(`-${m.damage}`, p.x, p.y - 20, `fx-num${m.mojoActivated ? ' mojo' : ''}`, 1500);
            let tagY = p.y - 90;
            if (m.mojoActivated) { fx('MOJO ×2', p.x, tagY, 'fx-tag mojo'); tagY -= 46; }
            if (m.typeMultiplier > 1) fx('SUPER!', p.x, tagY, 'fx-tag super');
            else if (m.typeMultiplier < 1) fx('WEAK', p.x, tagY, 'fx-tag weak');
        });
    }

    function playBlock(m, mineAttacked) {
        lastHitAt = Date.now();
        const toEl = fighterEl(mineAttacked ? 'theirs' : 'mine', m.characterIndex);
        // The server doesn't say which hero attacked a blocked target, so the
        // first standing hero on the attacking side lunges.
        const atkSide = mineAttacked ? game.mine : game.theirs;
        const fromEl = fighterEl(mineAttacked ? 'mine' : 'theirs', Math.max(0, atkSide.findIndex(alive)));
        lunge(fromEl, toEl, () => {
            if (!toEl) return;
            const p = centerOf(toEl);
            sparks(p.x, p.y, '#8CD0FF', 10);
            fx('BLOCKED!', p.x, p.y - 70, 'fx-tag block');
        });
    }

    let lastTurnMine = null;
    let bannerTimer = null;
    function showTurnBanner(mine) {
        if (lastTurnMine === mine) return;
        lastTurnMine = mine;
        // Let a hit that just landed play out before the banner covers the board.
        clearTimeout(bannerTimer);
        const wait = Math.max(0, 1100 - (Date.now() - lastHitAt));
        bannerTimer = setTimeout(() => playBanner(mine), wait);
    }
    function playBanner(mine) {
        if (game.over) return;
        const b = $('turn-banner');
        b.textContent = mine ? 'YOUR TURN' : 'ENEMY TURN';
        b.classList.toggle('foe', !mine);
        b.classList.remove('show');
        void b.offsetWidth;
        b.classList.add('show');
    }

    function showResult(kind, text) {
        game.over = true;
        game.isMyTurn = false;
        const win = kind === 'win';
        $('result-title').textContent = kind === 'win' ? 'VICTORY' : kind === 'draw' ? 'DRAW' : 'DEFEAT';
        $('result-text').textContent = text;
        $('result-card').classList.toggle('is-loss', !win);
        const stars = win ? Math.max(1, game.mine.filter(alive).length) : 0;
        $('result-stars').innerHTML = [0, 1, 2].map((i) => STAR(i < stars ? '#FFD45E' : '#4A4470')).join('');
        const conf = $('confetti');
        conf.innerHTML = '';
        if (win) {
            const colors = ['#FF4D8D', '#FFC23D', '#6BE36B', '#38CFFF', '#B3A6FF'];
            for (let i = 0; i < 60; i++) {
                const p = document.createElement('i');
                p.style.left = `${Math.random() * 100}%`;
                p.style.background = colors[i % colors.length];
                p.style.animationDuration = `${2.5 + Math.random() * 2.5}s`;
                p.style.animationDelay = `${-Math.random() * 4}s`;
                conf.appendChild(p);
            }
        }
        $('countdown-overlay').hidden = true;
        $('result-overlay').hidden = false;
        $('play-again-btn').focus();
        renderArena();
    }

    // ---------- Server messages ----------
    function setupRoomHandlers(r) {
        const isMe = (id) => id === r.sessionId;

        r.onMessage('allCards', (cards) => {
            game.allCards = cards;
            renderDraft(true);
        });

        r.onMessage('startCardSelection', () => {
            renderDraft(true);
            showScreen('draft');
        });

        r.onMessage('displayCards', (message) => renderReveal(message.players));

        r.onMessage('startCharacterPlacement', () => {
            if (game.placementSent) return;
            game.placementSent = true;
            r.send('cardplacementfinish', { positions: [0, 1, 2] });
        });

        r.onMessage('start', (message) => {
            game.world = message.worldType;
            lastTurnMine = null;
            renderWorld();
            showScreen('battle');
            renderArena();
            const num = $('countdown-num');
            num.textContent = message.countdown;
            num.classList.remove('go');
            $('countdown-overlay').hidden = false;
        });

        r.onMessage('countdown', (message) => {
            const num = $('countdown-num');
            num.textContent = message.countdown > 0 ? message.countdown : 'FIGHT!';
            num.classList.toggle('go', message.countdown <= 0);
            num.style.animation = 'none';
            void num.offsetWidth;
            num.style.animation = '';
        });

        r.onMessage('turn', (message) => {
            game.started = true;
            $('countdown-overlay').hidden = true;
            game.isMyTurn = isMe(message.playerSessionId);
            renderArena();
            if (!game.over) showTurnBanner(game.isMyTurn);
        });

        r.onMessage('attackDetails', (m) => playAttack(m, isMe(m.attackerId)));
        r.onMessage('attackBlocked', (m) => playBlock(m, isMe(m.attackerId)));
        r.onMessage('characterDefended', () => renderArena());
        r.onMessage('defenseExpired', () => renderArena());
        r.onMessage('characterDisabled', () => setTimeout(renderArena, 350));
        r.onMessage('updateHealth', () => setTimeout(renderArena, 320));

        r.onMessage('gameEnd', (m) => {
            if (game.over) return;
            const finish = () => {
                if (m.reason === 'Player disconnected') showResult('win', 'Your opponent ran away!');
                else if (m.result === 'draw') showResult('draw', 'Everyone got popped!');
                else if (isMe(m.winner)) showResult('win', 'You popped them all!');
                else showResult('loss', 'Your team got popped!');
            };
            setTimeout(finish, 1100);
        });

        r.onStateChange((state) => {
            const players = Array.from(state.players.values());
            const me = players.find((p) => p.sessionId === r.sessionId);
            const them = players.find((p) => p.sessionId !== r.sessionId);
            game.mine = me ? Array.from(me.characters.values()).slice(0, 3) : [];
            game.theirs = them ? Array.from(them.characters.values()).slice(0, 3) : [];
            game.myDefended = me ? me.defendedCharacterIndex : -1;
            game.theirDefended = them ? them.defendedCharacterIndex : -1;
            // Health changes are drawn after the hit animation lands.
            if (!$('screen-battle').hidden) setTimeout(renderArena, 320);
        });

        r.onLeave(() => {
            if (room !== r) return;
            room = null;
            if (game.over) return;
            if (!$('screen-lobby').hidden) {
                setSearching(false);
                $('lobby-error').textContent = 'Lost connection. Try again!';
            } else {
                $('wait-overlay').hidden = true;
                showResult('loss', 'Lost connection to the server.');
            }
        });
    }

    showScreen('lobby');
});
