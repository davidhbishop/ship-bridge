// Parser for Met Office coast-and-sea pages (inshore waters and shipping
// forecast). Both render each area as a section.marine-card (class "warning"
// when one is in force) with an h2, an optional warning paragraph, and one
// .forecast-info <dl> per period (inshore: 24 hour forecast, then outlook).
export async function parseMarinePage(html) {
  const page = { issued: '', issuedText: '', general: '', areas: [] };
  let area = null;
  let block = null;
  let term = '';
  let inBlock = false;
  let timeCount = 0;

  const rewriter = new HTMLRewriter()
    .on('.sea-area-overview .synopsis-text, #summary .synopsis-text', {
      text(t) { page.general += t.text; },
    })
    .on('.sea-area-overview time, #sea-forecast-time time', {
      // The first <time> is the issue time; later ones are the valid period.
      element(el) {
        timeCount += 1;
        if (timeCount === 1) page.issued = el.getAttribute('datetime') || '';
      },
      text(t) { if (timeCount === 1) page.issuedText += t.text; },
    })
    .on('section.marine-card', {
      element(el) {
        const warned = /\bwarning\b/.test(el.getAttribute('class') || '');
        area = { id: el.getAttribute('id') || '', name: '', warning: '', warned, periods: [] };
        page.areas.push(area);
      },
    })
    .on('section.marine-card h2', {
      text(t) { if (area) area.name += t.text; },
    })
    .on('section.marine-card p', {
      text(t) { if (area && !inBlock && !area.periods.length) area.warning += t.text; },
    })
    .on('section.marine-card .forecast-info', {
      element(el) {
        inBlock = true;
        block = { wind: '', sea: '', weather: '', visibility: '' };
        area?.periods.push(block);
        el.onEndTag(() => { inBlock = false; });
      },
    })
    .on('section.marine-card .forecast-info dt', {
      element() { term = ''; },
      text(t) { term += t.text.toLowerCase(); },
    })
    .on('section.marine-card .forecast-info dd', {
      text(t) {
        if (!block) return;
        if (term.includes('wind')) block.wind += t.text;
        else if (term.includes('sea')) block.sea += t.text;
        else if (term.includes('weather')) block.weather += t.text;
        else if (term.includes('visib')) block.visibility += t.text;
      },
    });

  await rewriter.transform(new Response(html)).text();

  const clean = s => s.replace(/\s+/g, ' ').trim();
  page.general = clean(page.general);
  page.issuedText = clean(page.issuedText);
  page.areas = page.areas.map(a => ({
    id: a.id,
    name: clean(a.name),
    warning: clean(a.warning),
    warned: a.warned,
    periods: a.periods.map(p => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, clean(v)]))),
  }));
  return page;
}

// "18:00 (UTC) on Fri 30 Oct 2026" -> ISO, for pages without a datetime attribute.
const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
export function issuedAt(page) {
  if (page.issued) return new Date(page.issued).toISOString().replace(/\.\d{3}Z$/, 'Z');
  const m = page.issuedText.match(/(\d{2}):(\d{2}) \(UTC\) on \w+ (\d{1,2}) (\w{3}) (\d{4})/);
  if (!m || MONTHS[m[4]] === undefined) return null;
  return new Date(Date.UTC(+m[5], MONTHS[m[4]], +m[3], +m[1], +m[2])).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export function period(p) {
  if (!p) return null;
  const { wind, sea, weather, visibility } = p;
  return { wind, sea, weather, visibility };
}
