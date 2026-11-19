const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const srcDir = path.join(__dirname, '..', 'src');
const html = fs.readFileSync(path.join(srcDir, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(srcDir, 'styles.css'), 'utf8');

// ---------- Trợ giúp phân tích CSS ----------

function parseRules(source) {
  const clean = source.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(clean)) !== null) {
    const decls = {};
    for (const part of m[2].split(';')) {
      const i = part.indexOf(':');
      if (i > 0) decls[part.slice(0, i).trim()] = part.slice(i + 1).trim();
    }
    for (const selector of m[1].split(',')) {
      rules.push({ selector: selector.trim(), decls });
    }
  }
  return rules;
}

const rules = parseRules(css);

function declsOf(selector) {
  return Object.assign({}, ...rules.filter((r) => r.selector === selector).map((r) => r.decls));
}

const rootVars = {};
for (const [k, v] of Object.entries(declsOf(':root'))) {
  if (k.startsWith('--')) rootVars[k] = v;
}

function resolveVars(value, depth = 0) {
  assert.ok(depth < 10, 'var() lồng quá sâu hoặc vòng lặp');
  return value.replace(/var\(\s*(--[\w-]+)\s*\)/g, (_, name) => {
    assert.ok(name in rootVars, `Thiếu biến ${name} trong :root`);
    return resolveVars(rootVars[name], depth + 1);
  });
}

// ---------- Trợ giúp màu ----------

const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|(?:rgba?|hsla?)\([^)]*\)/g;

function parseColor(token) {
  let m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(token);
  if (m) {
    let h = m[1];
    if (h.length === 3) h = [...h].map((c) => c + c).join('');
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  m = /^rgba?\(([^)]*)\)$/i.exec(token);
  if (m) {
    return m[1].split(/[\s,\/]+/).filter(Boolean).slice(0, 3).map(Number);
  }
  m = /^hsla?\(([^)]*)\)$/i.exec(token);
  if (m) {
    const [h, s, l] = m[1].split(/[\s,\/]+/).filter(Boolean).slice(0, 3).map(parseFloat);
    const sat = s / 100;
    const lig = l / 100;
    const a = sat * Math.min(lig, 1 - lig);
    const f = (n) => {
      const k = (n + h / 30) % 12;
      return Math.round(255 * (lig - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
    };
    return [f(0), f(8), f(4)];
  }
  throw new Error(`Không phân tích được màu: ${token}`);
}

function hueOf([r, g, b]) {
  const [R, G, B] = [r, g, b].map((x) => x / 255);
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const d = max - min;
  if (d === 0) return NaN;
  let h;
  if (max === R) h = ((G - B) / d) % 6;
  else if (max === G) h = (B - R) / d + 2;
  else h = (R - G) / d + 4;
  return (h * 60 + 360) % 360;
}

function luminance(rgb) {
  const [R, G, B] = rgb.map((x) => {
    const c = x / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function singleColor(value) {
  const tokens = resolveVars(value).match(COLOR_RE) || [];
  assert.equal(tokens.length, 1, `Cần đúng một màu trong "${value}"`);
  return parseColor(tokens[0]);
}

// Lấy phần gradient của một khai báo nền, trả về các điểm màu (RGB).
function gradientStops(value) {
  const resolved = resolveVars(value);
  const start = resolved.search(/(?:linear|radial)-gradient\(/);
  if (start < 0) return null;
  const open = resolved.indexOf('(', start);
  let depth = 0;
  let end = -1;
  for (let i = open; i < resolved.length; i++) {
    if (resolved[i] === '(') depth++;
    if (resolved[i] === ')' && --depth === 0) {
      end = i;
      break;
    }
  }
  assert.ok(end > 0, 'Gradient thiếu dấu đóng ngoặc');
  const body = resolved.slice(open + 1, end);
  const tokens = body.match(COLOR_RE) || [];
  // Phần còn lại (hướng, vị trí) không được chứa tên màu bằng chữ.
  const rest = body.replace(COLOR_RE, ' ').replace(/-?[\d.]+(deg|turn|rad|grad|%|px)?/g, ' ');
  const allowed = new Set(['to', 'top', 'bottom', 'left', 'right', 'center', 'circle', 'ellipse', 'at', 'closest-side', 'farthest-side', 'closest-corner', 'farthest-corner']);
  for (const word of rest.split(/[\s,]+/).filter(Boolean)) {
    assert.ok(allowed.has(word), `Gradient chứa từ lạ (có thể là tên màu): ${word}`);
  }
  return tokens.map(parseColor);
}

// Nền của trang: khai báo background/background-image trên body hoặc html.
function pageGradient() {
  for (const sel of ['body', 'html']) {
    const d = declsOf(sel);
    for (const prop of ['background', 'background-image']) {
      if (d[prop] && gradientStops(d[prop])) return gradientStops(d[prop]);
    }
  }
  return null;
}

// Nền hiệu lực ngay sau phần tử: duyệt từ chính nó lên tổ tiên.
// Trả về { stops: [RGB...] } (một hoặc nhiều màu cần kiểm tra).
function backgroundBehind(selectorChain) {
  for (const sel of selectorChain) {
    const d = declsOf(sel);
    const value = d['background-color'] || d.background;
    if (value) {
      const g = gradientStops(value);
      return g ? g : [singleColor(value)];
    }
  }
  const page = pageGradient();
  assert.ok(page, 'Không tìm thấy nền trang');
  return page;
}

// ---------- Trợ giúp HTML ----------

function tagCount(name) {
  return (html.match(new RegExp(`<${name}[\\s>]`, 'gi')) || []).length;
}

function innerText(name) {
  const m = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i').exec(html);
  return m ? m[1].replace(/<[^>]*>/g, '').trim() : null;
}

// ---------- AC1 ----------

test('AC1: index.html là tài liệu HTML5 đúng cấu trúc', () => {
  assert.match(html, /^\s*<!doctype html>/i);
  assert.match(html, /<html[^>]*\slang="vi"/i);
  assert.ok(innerText('title'), 'title không rỗng');
  assert.match(html, /<meta[^>]*name="viewport"[^>]*content="[^"]*width=device-width/i);
  assert.equal(tagCount('h1'), 1, 'đúng một h1');
  assert.ok(innerText('h1').length > 0, 'h1 có lời chào');
  assert.ok(innerText('p').length > 0, 'có đoạn mô tả');
  assert.ok(tagCount('a') + tagCount('button') >= 1, 'có nút kêu gọi hành động');
  assert.ok(innerText('a') || innerText('button'), 'nút có nhãn');
});

// ---------- AC2 ----------

test('AC2: index.html liên kết styles.css và file tồn tại', () => {
  const m = /<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/i.exec(html);
  assert.ok(m, 'có link stylesheet');
  assert.ok(fs.existsSync(path.join(srcDir, m[1])));
  assert.equal(path.basename(m[1]), 'styles.css');
});

test('AC2: nền trang là gradient, mọi điểm màu có hue 250-310', () => {
  const stops = pageGradient();
  assert.ok(stops, 'body hoặc html có gradient');
  assert.ok(stops.length >= 2, 'ít nhất hai điểm màu');
  for (const rgb of stops) {
    const h = hueOf(rgb);
    assert.ok(h >= 250 && h <= 310, `hue ${h} của rgb(${rgb}) ngoài khoảng 250-310`);
  }
});

// ---------- AC3 ----------

test('AC3: màu được khai báo bằng custom properties trong :root', () => {
  const colorVars = Object.entries(rootVars).filter(([, v]) => (v.match(COLOR_RE) || []).length > 0 || /var\(/.test(v));
  assert.ok(colorVars.length >= 3, 'có nhiều biến màu trong :root');
  // Ngoài :root, mọi giá trị màu phải đi qua var().
  for (const r of rules) {
    if (r.selector === ':root') continue;
    for (const [prop, value] of Object.entries(r.decls)) {
      assert.equal(
        (value.match(COLOR_RE) || []).length,
        0,
        `${r.selector} { ${prop} } dùng màu trực tiếp thay vì var(--...)`
      );
    }
  }
  // Và mọi biến được dùng đều có định nghĩa.
  for (const [, name] of css.matchAll(/var\(\s*(--[\w-]+)/g)) {
    assert.ok(name in rootVars, `biến ${name} chưa khai báo`);
  }
});

// ---------- AC4 ----------

test('AC4: chữ h1, mô tả và nút đạt tương phản WCAG AA (4.5:1)', () => {
  const cases = [
    { name: 'h1', chain: ['.welcome-title', '.welcome', 'body'], textSel: ['.welcome-title', 'body'] },
    { name: 'đoạn mô tả', chain: ['.welcome-text', '.welcome', 'body'], textSel: ['.welcome-text', 'body'] },
    { name: 'nút', chain: ['.welcome-button', '.welcome', 'body'], textSel: ['.welcome-button', 'body'] },
  ];
  for (const c of cases) {
    const colorDecl = c.textSel.map((s) => declsOf(s).color).find(Boolean);
    assert.ok(colorDecl, `${c.name} có màu chữ`);
    const text = singleColor(colorDecl);
    for (const bg of backgroundBehind(c.chain)) {
      const ratio = contrast(text, bg);
      assert.ok(ratio >= 4.5, `${c.name}: tương phản ${ratio.toFixed(2)} < 4.5 với nền rgb(${bg})`);
    }
  }
});

test('AC4: nút vẫn đạt 4.5:1 ở trạng thái :hover', () => {
  const base = declsOf('.welcome-button');
  const hover = declsOf('.welcome-button:hover');
  const text = singleColor(hover.color || base.color);
  const bg = singleColor(hover['background-color'] || hover.background || base['background-color']);
  assert.ok(contrast(text, bg) >= 4.5);
});

test('AC4: hàm tính tương phản đúng với giá trị chuẩn', () => {
  assert.equal(Math.round(contrast([0, 0, 0], [255, 255, 255])), 21);
  assert.equal(contrast([255, 255, 255], [255, 255, 255]), 1);
});

// ---------- AC5 ----------

test('AC5: bố cục căn giữa và co giãn', () => {
  const body = declsOf('body');
  const welcome = declsOf('.welcome');
  assert.equal(body['justify-content'], 'center');
  assert.equal(welcome['text-align'], 'center');
  const title = declsOf('.welcome-title')['font-size'];
  assert.ok(/clamp\(|vw|rem/.test(title) || /@media/.test(css), 'cỡ chữ tiêu đề co giãn');
  // Không có bề rộng cố định lớn hơn 360px.
  for (const r of rules) {
    for (const prop of ['width', 'min-width']) {
      const m = /^(\d+(?:\.\d+)?)px$/.exec(r.decls[prop] || '');
      if (m) assert.ok(Number(m[1]) <= 360, `${r.selector} ${prop} ${m[1]}px gây cuộn ngang ở 360px`);
    }
  }
});

// ---------- AC6 ----------

test('AC6: nút có :hover và :focus-visible nhìn thấy được', () => {
  const base = declsOf('.welcome-button');
  const hover = declsOf('.welcome-button:hover');
  const focus = declsOf('.welcome-button:focus-visible');
  const changed = Object.keys(hover).some((k) => hover[k] !== base[k]);
  assert.ok(changed, ':hover phải đổi ít nhất một thuộc tính');
  assert.ok(focus.outline && !/^none\b|^0\b/.test(focus.outline), ':focus-visible có outline');
});

// ---------- AC7 ----------

test('AC7: không tham chiếu tài nguyên ngoài, không có script', () => {
  for (const [name, content] of [['index.html', html], ['styles.css', css]]) {
    assert.ok(!/https?:\/\//i.test(content), `${name} có URL http(s)`);
    assert.ok(!/(^|[\s"'(=])\/\/[^\s]/.test(content), `${name} có URL bắt đầu bằng //`);
    assert.ok(!/@import/i.test(content), `${name} có @import`);
  }
  assert.equal(tagCount('script'), 0);
});
