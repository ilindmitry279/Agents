// Theme toggle
const root = document.documentElement;
const themeBtn = document.getElementById('themeBtn');
try { const t = localStorage.getItem('theme'); if (t) root.dataset.theme = t; } catch (e) {}
themeBtn.addEventListener('click', () => {
  const dark = root.dataset.theme
    ? root.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = dark ? 'light' : 'dark';
  try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
});

// Tabs
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab, .tab-panel').forEach(el => el.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

// Agent loop simulation
const scenarios = {
  weather: [
    ['goal',  'GOAL',    'Find a good day this weekend for a picnic in the park.'],
    ['think', 'THINK',   'I need the weekend forecast. I\'ll call the weather tool.'],
    ['act',   'ACT',     'get_forecast(city="Kyiv", days=["Sat", "Sun"])'],
    ['obs',   'OBSERVE', 'Sat: 🌧 rain 80%, 14°C   Sun: ☀️ sunny, 22°C'],
    ['think', 'THINK',   'Sunday is clearly better. Let me check the park is open.'],
    ['act',   'ACT',     'get_opening_hours(place="Central Park", day="Sun")'],
    ['obs',   'OBSERVE', 'Open 07:00 – 22:00'],
    ['done',  'DONE',    'Go on Sunday: sunny and 22°C, park open 7am–10pm. 🧺'],
  ],
  bug: [
    ['goal',  'GOAL',    'The test "test_total_price" is failing. Fix it.'],
    ['think', 'THINK',   'First, run the test to see the error.'],
    ['act',   'ACT',     'run("pytest tests/test_cart.py::test_total_price")'],
    ['obs',   'OBSERVE', 'AssertionError: expected 108.0, got 100.0'],
    ['think', 'THINK',   'Tax seems missing. Let me read the function.'],
    ['act',   'ACT',     'read_file("cart.py", lines=20-35)'],
    ['obs',   'OBSERVE', 'def total(items): return sum(i.price for i in items)'],
    ['think', 'THINK',   'The 8% tax is never applied. I\'ll add it.'],
    ['act',   'ACT',     'edit_file("cart.py", "return sum(...) * (1 + TAX_RATE)")'],
    ['act',   'ACT',     'run("pytest tests/test_cart.py")'],
    ['obs',   'OBSERVE', '12 passed in 0.41s ✅'],
    ['done',  'DONE',    'Fixed: total() now applies TAX_RATE. All tests pass.'],
  ],
  research: [
    ['goal',  'GOAL',    'Summarize the main benefits of heat pumps with sources.'],
    ['think', 'THINK',   'I\'ll search for recent, reliable sources.'],
    ['act',   'ACT',     'web_search("heat pump efficiency benefits")'],
    ['obs',   'OBSERVE', 'Found 10 results: energy agency report, university study, ...'],
    ['think', 'THINK',   'Read the two most authoritative ones.'],
    ['act',   'ACT',     'fetch(url_1); fetch(url_2)'],
    ['obs',   'OBSERVE', 'Both cite 2–4× efficiency vs. electric resistance heating.'],
    ['think', 'THINK',   'Sources agree. I have enough to write the summary.'],
    ['done',  'DONE',    '3 key benefits: efficiency, lower emissions, heating + cooling. [2 sources]'],
  ],
};

const consoleEl = document.getElementById('console');
const stepEls = document.querySelectorAll('.step');
const runBtn = document.getElementById('runBtn');
const stepBtn = document.getElementById('stepBtn');
const scenarioSel = document.getElementById('scenario');
let idx = 0, timer = null;

function highlight(k) {
  stepEls.forEach(s => s.classList.toggle('active', s.dataset.k === k));
}

function reset() {
  clearInterval(timer); timer = null; idx = 0;
  consoleEl.innerHTML = '<div class="row" style="color:#6b6f7c">// Press "Run agent" to start</div>';
  highlight(null);
  runBtn.disabled = stepBtn.disabled = false;
  runBtn.textContent = '▶ Run agent';
}

function step() {
  const s = scenarios[scenarioSel.value];
  if (idx === 0) consoleEl.innerHTML = '';
  if (idx >= s.length) return false;
  const [k, label, text] = s[idx++];
  const row = document.createElement('div');
  row.className = 'row';
  const tag = document.createElement('span');
  tag.className = 'k ' + k;
  tag.textContent = label.padEnd(8) + ' ';
  row.append(tag, document.createTextNode(text));
  consoleEl.appendChild(row);
  highlight(k);
  if (idx >= s.length) {
    clearInterval(timer); timer = null;
    runBtn.disabled = stepBtn.disabled = true;
    return false;
  }
  return true;
}

runBtn.addEventListener('click', () => {
  if (timer) { clearInterval(timer); timer = null; runBtn.textContent = '▶ Resume'; return; }
  runBtn.textContent = '⏸ Pause';
  step();
  timer = setInterval(() => { if (!step()) runBtn.textContent = '▶ Run agent'; }, 1100);
});
stepBtn.addEventListener('click', () => {
  if (timer) { clearInterval(timer); timer = null; runBtn.textContent = '▶ Resume'; }
  step();
});
document.getElementById('resetBtn').addEventListener('click', reset);
scenarioSel.addEventListener('change', reset);
