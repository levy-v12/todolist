#!/usr/bin/env node
// Harness kiểm chứng trang welcome-sample: mở trang bằng Chrome headless, điều khiển qua
// Chrome DevTools Protocol như một người dùng (rê chuột, bấm phím, bấm nút), rồi lưu bằng chứng.
// Chỉ dùng Node có sẵn (>= 22, có WebSocket toàn cục). Không cài gói, không ghi vào repo đích.
//
//   node drive.mjs doctor
//   node drive.mjs run --out <thư-mục-bằng-chứng> <bước> [<bước> ...]
//
// Bước:  viewport=RxC | hover=<vai>:<tên> | unhover | click=<vai>:<tên> | press=Tab|Shift+Tab|Enter
//        state=<tên> | shot=<tên> | assert=<biểu thức JS>
// Trong assert: s = trạng thái mới nhất, S.<tên> = trạng thái đã lưu bằng state=<tên>,
//        el(vai, tên, trạngThái = s) = phần tử theo vai và tên, contrast(màuA, màuB) = tỉ lệ WCAG.

import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function fail(msg) {
  console.error(`LỖI: ${msg}`);
  process.exit(2);
}

function parseArgs(argv) {
  const opts = { steps: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out' || a === '--page' || a === '--root') opts[a.slice(2)] = argv[++i];
    else opts.steps.push(a);
  }
  return opts;
}

function findRoot(start) {
  for (let d = start; ; d = path.dirname(d)) {
    if (fs.existsSync(path.join(d, 'PROJECT.md'))) return d;
    if (path.dirname(d) === d) return null;
  }
}

// Thư mục repo đích lấy từ dòng "Đường dẫn repo" của PROJECT.md.
function repoDir(root) {
  const m = /Đường dẫn repo\s*\|\s*`([^`]+)`/.exec(fs.readFileSync(path.join(root, 'PROJECT.md'), 'utf8'));
  return path.resolve(root, m ? m[1] : 'repo');
}

function findChrome() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  for (const name of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
    for (const dir of (process.env.PATH || '').split(path.delimiter)) {
      const p = path.join(dir, name);
      if (dir && fs.existsSync(p)) return p;
    }
  }
  return null;
}

function git(repo, ...args) {
  try {
    return execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

function identity(repo, page, chromeVersion) {
  const status = git(repo, 'status', '--short');
  return {
    trang: pathToFileURL(page).href,
    repo,
    nhanh: git(repo, 'rev-parse', '--abbrev-ref', 'HEAD'),
    commit: git(repo, 'rev-parse', '--short', 'HEAD'),
    fileChuaCommit: status ? status.split('\n').length : 0,
    chrome: chromeVersion,
    node: process.version,
    luc: new Date().toISOString(),
  };
}

// ---------- Chrome + CDP ----------

async function launchChrome(bin) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-welcome-'));
  const proc = spawn(
    bin,
    [
      '--headless=new',
      '--remote-debugging-port=0', // cổng do hệ điều hành cấp: hai lượt chạy song song không đụng nhau
      `--user-data-dir=${profile}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--hide-scrollbars',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-component-update',
      '--disable-sync',
      '--no-pings',
      // Không phân giải tên miền nào: trang có lỡ gọi ra ngoài thì yêu cầu được ghi lại nhưng không đi đâu cả (R12).
      '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1',
      'about:blank',
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  );
  let stderr = '';
  const wsUrl = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Chrome không mở cổng DevTools sau 20 giây. stderr:\n${stderr}`)), 20000);
    proc.stderr.on('data', (chunk) => {
      stderr += chunk;
      const m = /DevTools listening on (ws:\/\/\S+)/.exec(stderr);
      if (m) {
        clearTimeout(timer);
        resolve(m[1]);
      }
    });
    proc.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`Chrome thoát sớm (mã ${code}). stderr:\n${stderr}`));
    });
  });
  const port = new URL(wsUrl).port;
  const close = async () => {
    if (proc.exitCode === null) {
      const exited = new Promise((r) => proc.once('exit', r));
      proc.kill('SIGTERM'); // chỉ dừng đúng tiến trình do lượt chạy này mở
      await Promise.race([exited, sleep(3000)]);
      if (proc.exitCode === null) proc.kill('SIGKILL');
    }
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  };
  return { port, pid: proc.pid, close };
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 1;
    this.pending = new Map();
    this.handlers = new Map();
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id) {
        const p = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) p.reject(new Error(`${p.method}: ${msg.error.message}`));
        else p.resolve(msg.result);
      } else {
        for (const h of this.handlers.get(msg.method) || []) h(msg.params);
      }
    });
  }

  static async connect(port) {
    const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    const page = targets.find((t) => t.type === 'page');
    if (!page) throw new Error('Chrome không có tab nào để điều khiển');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', () => reject(new Error('Không nối được WebSocket tới Chrome')), { once: true });
    });
    return new Cdp(ws);
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, method });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, handler) {
    if (!this.handlers.has(method)) this.handlers.set(method, []);
    this.handlers.get(method).push(handler);
  }

  once(method) {
    return new Promise((resolve) => {
      const list = this.handlers.get(method) || [];
      const h = (params) => {
        list.splice(list.indexOf(h), 1);
        resolve(params);
      };
      this.handlers.set(method, list);
      list.push(h);
    });
  }

  async eval(fn, ...args) {
    const expression = `(${fn.toString()})(${args.map((a) => JSON.stringify(a)).join(',')})`;
    const r = await this.send('Runtime.evaluate', { expression, returnByValue: true });
    if (r.exceptionDetails) throw new Error(`Lỗi khi chạy trong trang: ${r.exceptionDetails.exception?.description || r.exceptionDetails.text}`);
    return r.result.value;
  }
}

// ---------- Chạy trong trang ----------

// Vai (role) suy từ thẻ: h1-h6 = heading, a[href] = link, button = button, p = paragraph, main = main.
// Thuộc tính role="..." nếu có thì được ưu tiên. Tên = aria-label, alt, hoặc chữ hiển thị.
function pageSnapshot() {
  const roleOf = (el) => {
    const explicit = el.getAttribute('role');
    if (explicit) return explicit;
    const t = el.tagName.toLowerCase();
    if (/^h[1-6]$/.test(t)) return 'heading';
    if (t === 'a' && el.hasAttribute('href')) return 'link';
    if (t === 'p') return 'paragraph';
    if (t === 'input' || t === 'textarea') return 'textbox';
    return t;
  };
  const nameOf = (el) => (el.getAttribute('aria-label') || el.getAttribute('alt') || el.textContent || '').replace(/\s+/g, ' ').trim();
  const describe = (el) => (el && el !== document.body && el !== document.documentElement ? `${roleOf(el)}:${nameOf(el)}` : null);
  const vw = document.documentElement.clientWidth;
  const elements = [...document.querySelectorAll('main, h1, h2, h3, h4, h5, h6, p, a, button, img, input, textarea, [role]')].map((el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      role: roleOf(el),
      name: nameOf(el),
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      href: el.getAttribute('href'),
      rect: { x: r.x, y: r.y, width: r.width, height: r.height },
      lechTamNgang: Math.abs(r.x + r.width / 2 - vw / 2),
      trongKhungNhin: r.x >= 0 && r.right <= vw + 0.5,
      style: {
        color: cs.color,
        backgroundColor: cs.backgroundColor,
        fontSize: cs.fontSize,
        fontFamily: cs.fontFamily,
        textAlign: cs.textAlign,
        transform: cs.transform,
        outlineStyle: cs.outlineStyle,
        outlineWidth: cs.outlineWidth,
        outlineColor: cs.outlineColor,
      },
      matches: { hover: el.matches(':hover'), focusVisible: el.matches(':focus-visible'), target: el.matches(':target') },
    };
  });
  const body = getComputedStyle(document.body);
  return {
    url: location.href,
    title: document.title,
    lang: document.documentElement.lang,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    cuonNgang: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    body: { backgroundImage: body.backgroundImage, color: body.color },
    focus: describe(document.activeElement),
    targetId: document.querySelector(':target')?.id || null,
    soScript: document.scripts.length,
    stylesheets: [...document.styleSheets].map((sh) => sh.href),
    elements,
  };
}

function pageLocate(role, name) {
  const roleOf = (el) => {
    const explicit = el.getAttribute('role');
    if (explicit) return explicit;
    const t = el.tagName.toLowerCase();
    if (/^h[1-6]$/.test(t)) return 'heading';
    if (t === 'a' && el.hasAttribute('href')) return 'link';
    if (t === 'p') return 'paragraph';
    if (t === 'input' || t === 'textarea') return 'textbox';
    return t;
  };
  const nameOf = (el) => (el.getAttribute('aria-label') || el.getAttribute('alt') || el.textContent || '').replace(/\s+/g, ' ').trim();
  const hits = [...document.querySelectorAll('*')].filter((el) => roleOf(el) === role && nameOf(el) === name);
  if (hits.length !== 1) return { count: hits.length };
  hits[0].scrollIntoView({ block: 'center', inline: 'center' });
  const r = hits[0].getBoundingClientRect();
  return { count: 1, x: r.x + r.width / 2, y: r.y + r.height / 2 };
}

// ---------- Trợ giúp cho assert ----------

function parseRgb(color) {
  const m = /rgba?\(([^)]+)\)/.exec(color || '');
  if (!m) throw new Error(`Không đọc được màu: ${color}`);
  return m[1].split(/[\s,\/]+/).filter(Boolean).slice(0, 3).map(Number);
}

function luminance(rgb) {
  const [r, g, b] = rgb.map((x) => {
    const c = x / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(parseRgb(a)), luminance(parseRgb(b))].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function makeEl(latest) {
  return (role, name, state = latest) => {
    const hits = state.elements.filter((e) => e.role === role && (name === undefined || e.name === name));
    if (hits.length !== 1) throw new Error(`el("${role}"${name === undefined ? '' : `, "${name}"`}) khớp ${hits.length} phần tử, cần đúng 1`);
    return hits[0];
  };
}

// ---------- Lệnh ----------

const KEYS = {
  Tab: { key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 },
  Enter: { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' },
};

async function pressKey(cdp, combo) {
  const parts = combo.split('+');
  const def = KEYS[parts.at(-1)];
  if (!def) throw new Error(`Phím chưa hỗ trợ: ${combo} (có: Tab, Shift+Tab, Enter)`);
  const modifiers = parts.includes('Shift') ? 8 : 0;
  const { text, ...base } = def;
  await cdp.send('Input.dispatchKeyEvent', { type: text ? 'keyDown' : 'rawKeyDown', ...base, modifiers, ...(text ? { text } : {}) });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', ...base, modifiers });
}

async function locate(cdp, spec) {
  const i = spec.indexOf(':');
  if (i < 1) throw new Error(`Cần dạng <vai>:<tên>, nhận được "${spec}"`);
  const [role, name] = [spec.slice(0, i), spec.slice(i + 1)];
  const hit = await cdp.eval(pageLocate, role, name);
  if (hit.count !== 1) throw new Error(`"${spec}" khớp ${hit.count} phần tử, cần đúng 1`);
  return hit;
}

async function doctor(opts) {
  const root = opts.root || findRoot(HERE) || findRoot(process.cwd());
  const lines = [];
  let ok = true;
  const check = (label, pass, detail) => {
    lines.push(`${pass ? 'OK  ' : 'FAIL'} ${label}: ${detail}`);
    if (!pass) ok = false;
  };
  const major = Number(process.versions.node.split('.')[0]);
  check('Node', major >= 22 && typeof WebSocket === 'function', `${process.version} (cần >= 22, có WebSocket toàn cục)`);
  check('Thư mục gốc Agent-project', Boolean(root), root || 'không tìm thấy PROJECT.md ở thư mục cha nào; truyền --root');
  let page = opts.page;
  let repo = null;
  if (root) {
    repo = repoDir(root);
    page = path.resolve(page || path.join(repo, 'src', 'index.html'));
    check('Trang', fs.existsSync(page), page);
    const status = git(repo, 'status', '--short');
    check('Repo đích', git(repo, 'rev-parse', '--short', 'HEAD') !== null, `${repo} — nhánh ${git(repo, 'rev-parse', '--abbrev-ref', 'HEAD')}, commit ${git(repo, 'rev-parse', '--short', 'HEAD')}, ${status ? status.split('\n').length : 0} file chưa commit`);
  }
  const bin = findChrome();
  check('Chrome', Boolean(bin), bin || 'không thấy google-chrome/chromium trên PATH; đặt CHROME_BIN');
  if (bin && root && fs.existsSync(page)) {
    let chrome;
    try {
      chrome = await launchChrome(bin);
      const cdp = await Cdp.connect(chrome.port);
      const version = (await cdp.send('Browser.getVersion')).product;
      await cdp.send('Page.enable');
      const loaded = cdp.once('Page.loadEventFired');
      await cdp.send('Page.navigate', { url: pathToFileURL(page).href });
      await loaded;
      const s = await cdp.eval(pageSnapshot);
      check('Mở trang bằng Chrome headless', s.elements.length > 0, `${version}, pid ${chrome.pid}, cổng ${chrome.port}, tiêu đề "${s.title}", ${s.elements.length} phần tử`);
    } catch (e) {
      check('Mở trang bằng Chrome headless', false, e.message);
    } finally {
      if (chrome) await chrome.close();
    }
  }
  console.log(lines.join('\n'));
  console.log(ok ? 'DOCTOR: OK' : 'DOCTOR: FAIL');
  process.exit(ok ? 0 : 1);
}

async function run(opts) {
  if (!opts.out) fail('thiếu --out <thư-mục-bằng-chứng>');
  if (opts.steps.length === 0) fail('chưa có bước nào');
  const root = opts.root || findRoot(HERE) || findRoot(process.cwd());
  if (!root) fail('không tìm thấy PROJECT.md; truyền --root');
  const repo = repoDir(root);
  const page = path.resolve(opts.page || path.join(repo, 'src', 'index.html'));
  if (!fs.existsSync(page)) fail(`không có trang ${page}`);
  const bin = findChrome();
  if (!bin) fail('không thấy Chrome; chạy doctor');
  const out = path.resolve(opts.out);
  fs.mkdirSync(out, { recursive: true });

  const chrome = await launchChrome(bin);
  const report = { steps: [], requests: [], loiTaiTaiNguyen: [], console: [] };
  const saved = {};
  let latest = null;
  let failed = 0;
  try {
    const cdp = await Cdp.connect(chrome.port);
    report.identity = identity(repo, page, (await cdp.send('Browser.getVersion')).product);
    await cdp.send('Page.enable');
    await cdp.send('Network.enable');
    await cdp.send('Runtime.enable');
    const urls = new Map();
    cdp.on('Network.requestWillBeSent', (p) => {
      urls.set(p.requestId, p.request.url);
      report.requests.push(p.request.url);
    });
    cdp.on('Network.loadingFailed', (p) => report.loiTaiTaiNguyen.push({ url: urls.get(p.requestId), loi: p.errorText }));
    cdp.on('Runtime.consoleAPICalled', (p) => report.console.push({ type: p.type, text: p.args.map((a) => a.value ?? a.description).join(' ') }));
    cdp.on('Runtime.exceptionThrown', (p) => report.console.push({ type: 'exception', text: p.exceptionDetails.text }));
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
    const loaded = cdp.once('Page.loadEventFired');
    await cdp.send('Page.navigate', { url: pathToFileURL(page).href });
    await loaded;

    const snapshot = async () => {
      latest = { ...(await cdp.eval(pageSnapshot)), requests: [...report.requests], loiTaiTaiNguyen: [...report.loiTaiTaiNguyen], console: [...report.console] };
      return latest;
    };

    for (const step of opts.steps) {
      const eq = step.indexOf('=');
      const [verb, arg] = eq < 0 ? [step, ''] : [step.slice(0, eq), step.slice(eq + 1)];
      const entry = { step };
      try {
        if (verb === 'viewport') {
          const m = /^(\d+)x(\d+)$/.exec(arg);
          if (!m) throw new Error('cần dạng viewport=RỘNGxCAO');
          await cdp.send('Emulation.setDeviceMetricsOverride', { width: Number(m[1]), height: Number(m[2]), deviceScaleFactor: 1, mobile: false });
          await sleep(150);
        } else if (verb === 'hover') {
          const { x, y } = await locate(cdp, arg);
          await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
          await sleep(450); // chờ hết transition 0.2s của nút
        } else if (verb === 'unhover') {
          await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1, y: 1 });
          await sleep(450);
        } else if (verb === 'click') {
          const { x, y } = await locate(cdp, arg);
          await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
          await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
          await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
          await sleep(450);
        } else if (verb === 'press') {
          await pressKey(cdp, arg);
          await sleep(450);
        } else if (verb === 'state') {
          if (!arg) throw new Error('cần state=<tên>');
          saved[arg] = await snapshot();
          fs.writeFileSync(path.join(out, `${arg}.json`), JSON.stringify(saved[arg], null, 2));
          entry.file = `${arg}.json`;
        } else if (verb === 'shot') {
          if (!arg) throw new Error('cần shot=<tên>');
          const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(out, `${arg}.png`), Buffer.from(data, 'base64'));
          entry.file = `${arg}.png`;
        } else if (verb === 'assert') {
          const s = await snapshot();
          const value = new Function('s', 'S', 'el', 'contrast', `return (${arg});`)(s, saved, makeEl(s), contrast);
          entry.value = value;
          if (!value) throw new Error('biểu thức cho kết quả sai');
        } else {
          throw new Error(`bước lạ: ${verb}`);
        }
        entry.ok = true;
      } catch (e) {
        entry.ok = false;
        entry.error = e.message;
        failed++;
      }
      report.steps.push(entry);
      console.log(`${entry.ok ? 'OK  ' : 'FAIL'} ${step}${entry.file ? ` -> ${path.join(out, entry.file)}` : ''}${entry.error ? ` — ${entry.error}` : ''}`);
    }
  } catch (e) {
    report.loiHarness = e.message;
    failed++;
    console.error(`LỖI harness: ${e.message}`);
  } finally {
    await chrome.close();
  }
  report.ketQua = failed === 0 ? 'PASS' : 'FAIL';
  report.soBuocLoi = failed;
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  console.log(`KẾT QUẢ: ${report.ketQua} — ${report.steps.length} bước, ${failed} lỗi — bằng chứng: ${out}`);
  process.exit(failed === 0 ? 0 : 1);
}

const [command, ...rest] = process.argv.slice(2);
const opts = parseArgs(rest);
if (command === 'doctor') await doctor(opts);
else if (command === 'run') await run(opts);
else fail('dùng: drive.mjs doctor | drive.mjs run --out <thư-mục> <bước>...');
