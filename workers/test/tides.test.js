import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDoc } from '../bridge-fetch/src/feeds/tides.js';

const conwy = { id: 'conwy', name: 'Conwy', station: '0471A', gate: { open_h: -2, close_h: 3 } };

test('GMT tide times are not shifted', () => {
  const doc = buildDoc(conwy, [{ EventType: 'HighWater', DateTime: '2026-10-30T13:11:00', Height: 7.721 }]);
  assert.equal(doc.events[0].at, '2026-10-30T13:11:00Z');
  assert.equal(doc.events[0].local, '13:11');
  assert.equal(doc.events[0].height_m, 7.72);
});

test('BST tide times are shown an hour later, across midnight', () => {
  const doc = buildDoc(conwy, [{ EventType: 'HighWater', DateTime: '2026-07-01T23:30:00', Height: 7 }]);
  assert.equal(doc.events[0].local, '00:30');
  assert.equal(doc.events[0].date, '2026-07-02');
});

test('gate window is HW -2h to +3h', () => {
  const doc = buildDoc(conwy, [{ EventType: 'HighWater', DateTime: '2026-10-30T13:11:00', Height: 7.7 }]);
  assert.deepEqual(doc.gates.map(g => [g.type, g.local]), [['open', '11:11'], ['close', '16:11']]);
  assert.equal(doc.windows[0].open_local, '11:11');
});
