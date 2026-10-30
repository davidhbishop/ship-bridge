import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDoc, legacyGroups } from '../bridge-fetch/src/feeds/tides.js';

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

test('a gate opening the evening before the first HW keeps that day\'s earlier tides', () => {
  const port = { id: 'conwy', name: 'Conwy', station: '0471A', gate: { open_h: -2, close_h: 3 }, home: true };
  const doc = buildDoc(port, [{ EventType: 'HighWater', DateTime: '2026-10-30T00:49:00', Height: 7.1 }]);
  const days = new Map();
  legacyGroups(port, doc, days);
  const [group] = days.get('20261029');
  assert.deepEqual(group.records.map(r => r.event_type + ' ' + r.time), ['gateopen 22:49']);
  assert.equal(group.keep({ time: '13:11', event_type: 'highwater', at: '2026-10-29T13:11:00Z' }), true);
  assert.equal(group.keep({ time: '13:11', event_type: 'highwater' }), true);
  assert.equal(group.keep({ time: '23:49', event_type: 'gateopen', at: '2026-10-29T23:49:00Z' }), false);
});
