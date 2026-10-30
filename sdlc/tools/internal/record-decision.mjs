// The writer behind `review.mjs decide`: validates the human's accept and reject lists against the rendered cycle and
// writes docs/review/<cycle>/decisions.json. A `report` entry ("<file>:<line> <what>") is a defect the human saw in the
// browser: it gets the next F-id, class `uat`, blocking, and is carried into the next cycle like an accepted finding. It asks nothing: review.mjs decide asks on the terminal before calling it,
// and the kit's own tests call it directly. It is not a CLI and the guards refuse the file it writes to every agent.
import { join } from 'node:path';
import { readState, writeState, writeFile, expandFids, REVIEW_DIR, STATE_FILE, MAX_CYCLE } from '../review.mjs';

export function recordDecision(root, cycle, options = {}) {
  const state = readState(root);
  if (!state || state.cycle !== cycle || !state.rendered) return { ok: false, lines: [`Decision refused: cycle ${cycle} is not the rendered cycle in ${STATE_FILE}.`] };
  const confirmed = (state.confirmed ?? []).map((f) => f.fid);
  const accepted = expandFids(options.accept);
  const rejected = expandFids(options.reject);
  const bad = [...accepted, ...rejected].filter((id) => !confirmed.includes(id));
  if (bad.length) return { ok: false, lines: [`Decision refused: ${bad.join(', ')} ${bad.length === 1 ? 'is' : 'are'} not confirmed in cycle ${cycle} (confirmed: ${confirmed.join(', ') || 'none'}).`] };
  const twice = accepted.filter((id) => rejected.includes(id));
  if (twice.length) return { ok: false, lines: [`Decision refused: ${twice.join(', ')} in both lists; each F-id goes in exactly one.`] };
  const missing = confirmed.filter((id) => !accepted.includes(id) && !rejected.includes(id));
  if (missing.length) return { ok: false, lines: [`Decision refused: ${missing.join(', ')} not decided; every confirmed F-id goes in --accept or --reject.`] };
  const reports = [].concat(options.report ?? []).filter((r) => r !== undefined && r !== null && String(r).trim() !== '');
  const reported = [];
  let nextF = state.nextF ?? 1;
  for (const [i, raw] of reports.entries()) {
    const m = String(raw).trim().match(/^(\S+?):(\d+)\s+(.+)$/s);
    if (!m) return { ok: false, lines: [`Decision refused: --report ${i + 1} must read "<file>:<line> <what you saw>" (got "${String(raw).trim().slice(0, 60)}").`] };
    const fid = `F-${String(nextF++).padStart(2, '0')}`;
    reported.push({ fid, id: `UAT-${i + 1}`, class: 'uat', severity: 'blocking', level: 'code', file: m[1], line: Number(m[2]), what_breaks: m[3].trim(), evidence: 'seen by the human in the browser, recorded with the decision', requirement: 'none' });
  }
  const decisions = { cycle, accepted: [...accepted, ...reported.map((r) => r.fid)], rejected, reported, note: options.note ?? '', decidedAt: new Date().toISOString() };
  writeFile(join(root, REVIEW_DIR, String(cycle), 'decisions.json'), JSON.stringify(decisions, null, 2) + '\n');
  writeState(root, { ...state, decisions, confirmed: [...(state.confirmed ?? []), ...reported], nextF });
  return {
    ok: true,
    decisions,
    lines: [
      `decided  cycle ${cycle}: ${accepted.length} accepted (${accepted.join(', ') || 'none'}), ${rejected.length} rejected (${rejected.join(', ') || 'none'})${reported.length ? `, ${reported.length} reported by the human (${reported.map((r) => `${r.fid} ${r.file}:${r.line}`).join(', ')})` : ''}${options.note ? `; note: ${options.note}` : ''}`,
      `next     fix the accepted ones in their slices, then: /sdlc:review-change --cycle ${cycle + 1}${cycle >= MAX_CYCLE ? ' is not available (last cycle); the human ships or reopens as a requirement' : ''}`,
    ],
  };
}
