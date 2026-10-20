const fs = require('fs');
const KEY = '0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z';
const LEAGUE = '98767975604431411';
const API = 'https://esports-api.lolesports.com/persisted/gw';

async function getSchedule() {
  let token = null;
  const events = [];
  for (let page = 0; page < 20; page++) {
    const url = API + '/getSchedule?hl=en-US&leagueId=' + LEAGUE + (token ? '&pageToken=' + encodeURIComponent(token) : '');
    const res = await fetch(url, { headers: { 'x-api-key': KEY, accept: 'application/json' } });
    if (!res.ok) throw new Error('getSchedule ' + res.status);
    const data = await res.json();
    const schedule = (data.data && data.data.schedule) || {};
    events.push(...(schedule.events || []));
    token = schedule.pages && schedule.pages.older;
    if (!token) break;
  }
  return events;
}

async function main() {
  const events = await getSchedule();
  const seen = {};
  const matches = [];
  for (const e of events) {
    if (e.type !== 'match' || e.state !== 'completed') continue;
    if (!String(e.startTime || '').startsWith('2026-')) continue;
    const m = e.match || {};
    const teams = m.teams || [];
    if (teams.length !== 2) continue;
    const a = teams[0], b = teams[1];
    const ar = (a.result || {}), br = (b.result || {});
    if (ar.gameWins == null || br.gameWins == null) continue;
    const winner = ar.outcome === 'win' ? a.code : b.code;
    const row = {
      id: m.id || e.id,
      date: String(e.startTime).slice(0, 10),
      event: e.blockName || 'Worlds',
      bo: (m.strategy && m.strategy.count) || 1,
      a: a.code,
      b: b.code,
      scoreA: ar.gameWins,
      scoreB: br.gameWins,
      winner
    };
    if (!row.id || seen[row.id]) continue;
    seen[row.id] = 1;
    matches.push(row);
  }
  matches.sort((x, y) => String(x.date).localeCompare(String(y.date)));
  const block = 'root.RESULTS_2026 = {\n' +
    '    updatedAt: ' + JSON.stringify(new Date().toISOString()) + ',\n' +
    '    matches: ' + JSON.stringify(matches, null, 2).replace(/\n/g, '\n    ') + '\n  };';
  const html = fs.readFileSync('index.html', 'utf8');
  const next = html.replace(/root\.RESULTS_2026 = \{[\s\S]*?\n  \};/, block);
  if (next === html) throw new Error('results block not found');
  fs.writeFileSync('index.html', next);
  console.log('results', matches.length);
}

main().catch(err => { console.error(err); process.exit(1); });
