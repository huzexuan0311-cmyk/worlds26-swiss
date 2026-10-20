const fs = require('fs');

const SLUGS = [
  'lol-blg-mkoi-2026-10-23',
  'lol-tsw-ly-2026-10-23',
  'lol-los-t1-2026-10-23',
  'lol-hle1-tes-2026-10-23',
  'lol-g2-dk-2026-10-23',
  'lol-al-kc-2026-10-23',
  'lol-tl2-cfo-2026-10-23',
  'lol-gen-ig1-2026-10-23'
];
const CODE = {
  'Bilibili Gaming': 'BLG',
  'Movistar KOI': 'MKOI',
  'Team Secret Whales': 'TSW',
  'LYON': 'LYON',
  'LOS': 'LOS',
  'T1': 'T1',
  'Hanwha Life Esports': 'HLE',
  'Top Esports': 'TES',
  'G2 Esports': 'G2',
  'Dplus KIA': 'DK',
  "Anyone's Legend": 'AL',
  'Karmine Corp': 'KC',
  'Team Liquid': 'TLAW',
  'CTBC Flying Oyster': 'CFO',
  'Gen.G': 'GEN',
  'Invictus Gaming': 'IG'
};

async function main() {
  const markets = [];
  const starts = [];
  for (const slug of SLUGS) {
    const res = await fetch('https://gamma-api.polymarket.com/events?slug=' + encodeURIComponent(slug), {
      headers: { accept: 'application/json' }
    });
    if (!res.ok) throw new Error(slug + ': ' + res.status);
    const list = await res.json();
    const event = Array.isArray(list) ? list[0] : list;
    if (!event || !Array.isArray(event.markets)) throw new Error(slug + ': no event');
    const title = event.title || '';
    const m = event.markets.find(x => x.question === title) ||
      event.markets.find(x => / vs /.test(x.question || '') && !/Game \d|Both Teams|Any Player|First/.test(x.question || ''));
    if (!m) throw new Error(slug + ': no market');
    const outcomes = JSON.parse(m.outcomes || '[]');
    const prices = JSON.parse(m.outcomePrices || '[]').map(Number);
    if (outcomes.length !== 2 || prices.length !== 2 || !isFinite(prices[0])) throw new Error(slug + ': bad outcomes');
    const a = CODE[outcomes[0]];
    const b = CODE[outcomes[1]];
    if (!a || !b) throw new Error(slug + ': unmapped team ' + outcomes.join(' / '));
    const start = m.gameStartTime || event.startDate || '';
    markets.push({ a, b, pA: prices[0], start });
    if (start) starts.push(Date.parse(start.replace(' ', 'T')));
  }

  if (starts.length && Date.now() >= Math.min(...starts)) {
    console.log('First match already started; keep frozen pre-match snapshot.');
    return;
  }

  const htmlPath = 'index.html';
  let html = fs.readFileSync(htmlPath, 'utf8');
  const block = 'root.PM_R1_2026 = [\n' +
    markets.map(m => "    { a: '" + m.a + "', b: '" + m.b + "', pA: " + m.pA + ", start: '" + m.start + "' }").join(',\n') +
    '\n  ];';
  const next = html.replace(/root\.PM_R1_2026 = \[[\s\S]*?\n  \];/, block)
    .replace(/capturedAt: '[^']*'/, "capturedAt: '" + new Date().toISOString() + "'");
  if (next === html) throw new Error('market block not found in index.html');
  fs.writeFileSync(htmlPath, next);
  console.log('updated', markets.length, 'markets');
}

main().catch(err => { console.error(err); process.exit(1); });
