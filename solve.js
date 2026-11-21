// solve.js — fast drop-in for csv-reader 1.0.0 (make.fun csv-reader-speed-01).
// Reads {text, header} once, left to right; returns {columns, rows, errors} identical to
// the reference program, but scans with indexOf-style jumps + slice instead of building
// every field one character at a time. Pure: nothing kept from one call to the next.

const COMMA = 'comma';
const LINE_BREAK = 'line break';
const END = 'end';

export function run(input) {
  const text = String(input.text);
  const header = input.header === true;
  const errors = [];
  const rows = [];
  let columns = null;
  let width = -1;

  const n = text.length;
  let pos = 0;
  let line = 1;
  if (n > 0 && text.charCodeAt(0) === 0xfeff) pos = 1;

  let recordLine = 1;
  let recordRow = null;

  const error = (code) => { errors.push({ code, line: recordLine, row: recordRow }); };

  // Unquoted field from pos: it runs to the next comma or line break; a CR not followed by
  // LF is dropped (stray_cr). Returns {value, ended}.
  function readUnquoted(value) {
    let start = pos;
    while (pos < n) {
      const cd = text.charCodeAt(pos);
      if (cd === 44) { value += text.slice(start, pos); pos += 1; return { value, ended: COMMA }; }
      if (cd === 10) { value += text.slice(start, pos); pos += 1; line += 1; return { value, ended: LINE_BREAK }; }
      if (cd === 13) {
        value += text.slice(start, pos);
        if (text.charCodeAt(pos + 1) === 10) { pos += 2; line += 1; return { value, ended: LINE_BREAK }; }
        error('stray_cr');
        pos += 1;
        start = pos;
        continue;
      }
      // Jump ahead to the next comma (44), LF (10) or CR (13); a jumped-over run holds none.
      let q = pos;
      let cc = 0;
      do { cc = text.charCodeAt(q); q++; } while (cc !== 44 && cc !== 10 && cc !== 13 && q < n);
      if (cc !== 44 && cc !== 10 && cc !== 13 && q >= n) { pos = n; value += text.slice(start, n); return { value, ended: END }; }
      pos = q - 1;
    }
    value += text.slice(start, pos);
    return { value, ended: END };
  }

  // Quoted field whose opening quote is at pos.
  function readQuoted() {
    const open = pos;
    const openLine = line;
    let value = '';
    pos += 1;
    let segStart = pos;
    while (pos < n) {
      const cd = text.charCodeAt(pos);
      if (cd === 34) {
        if (text.charCodeAt(pos + 1) === 34) { // "" is one quote
          value += text.slice(segStart, pos) + '"';
          pos += 2;
          segStart = pos;
          continue;
        }
        value += text.slice(segStart, pos);
        pos += 1;
        if (pos >= n) return { value, ended: END };
        const dd = text.charCodeAt(pos);
        if (dd === 44) { pos += 1; return { value, ended: COMMA }; }
        if (dd === 10) { pos += 1; line += 1; return { value, ended: LINE_BREAK }; }
        if (dd === 13 && text.charCodeAt(pos + 1) === 10) { pos += 2; line += 1; return { value, ended: LINE_BREAK }; }
        // Junk after the closing quote: appended as it stands, up to the next comma or break.
        const before = value.length;
        const junk = readUnquoted(value);
        if (junk.value.length > before) error('quote_junk');
        return junk;
      }
      if (cd === 13) { // CRLF and a lone CR inside quotes are each one LF
        value += text.slice(segStart, pos) + '\n';
        line += 1;
        pos += text.charCodeAt(pos + 1) === 10 ? 2 : 1;
        segStart = pos;
        continue;
      }
      if (cd === 10) {
        value += text.slice(segStart, pos) + '\n';
        line += 1;
        pos += 1;
        segStart = pos;
        continue;
      }
      // Jump ahead to the next quote (34), CR (13) or LF (10); a jumped-over run holds none.
      let q = pos;
      let cc = 0;
      do { cc = text.charCodeAt(q); q++; } while (cc !== 34 && cc !== 13 && cc !== 10 && q < n);
      if (cc !== 34 && cc !== 13 && cc !== 10) { pos = n; value += text.slice(segStart, n); break; }
      pos = q - 1;
    }
    if (pos < n) {
      // fell out of the jump at end-of-text: unterminated
    }
    // The quote never closes: a literal character; the text after it is read again as unquoted.
    pos = open + 1;
    line = openLine;
    error('unterminated_quote');
    return readUnquoted('"');
  }

  while (true) {
    // Lines with no characters are no records.
    while (pos < n) {
      const cd = text.charCodeAt(pos);
      if (cd === 10) { pos += 1; line += 1; }
      else if (cd === 13 && text.charCodeAt(pos + 1) === 10) { pos += 2; line += 1; }
      else break;
    }
    if (pos >= n) break;

    recordLine = line;
    recordRow = header && columns === null ? null : rows.length;
    const fields = [];
    let field;
    let quoted;
    do {
      quoted = text.charCodeAt(pos) === 34;
      field = quoted ? readQuoted() : readUnquoted('');
      fields.push(field.value);
    } while (field.ended === COMMA);

    // A line that held only stray CRs is left with no characters: no record.
    if (fields.length === 1 && fields[0] === '' && !quoted) continue;

    if (width < 0) width = fields.length;
    if (header && columns === null) { columns = fields; continue; }
    if (fields.length < width) {
      errors.push({ code: 'short_row', line: recordLine, row: recordRow, fields: fields.length });
      while (fields.length < width) fields.push('');
    } else if (fields.length > width) {
      errors.push({ code: 'long_row', line: recordLine, row: recordRow, extra: fields.splice(width) });
    }
    rows.push(fields);
  }
  return { columns: header ? (columns ?? []) : null, rows, errors };
}
