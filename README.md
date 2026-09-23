# AI Agents Explained

A single-page, interactive introduction to AI agents: what they are, how they work, and when to use them.

It's a static website built with plain HTML, CSS, and JavaScript. It has no dependencies and no build step, and it works offline.

## What's on the page

| Section | What it covers |
|---------|----------------|
| **Chatbot vs. agent** | How an agent differs from a chatbot: one goal and many steps, instead of one question and one answer. |
| **The agent loop** | An animated walkthrough of the *Goal → Think → Act → Observe → Finish* cycle. |
| **Components** | The parts of an agent: model, tools, memory, planning, control loop, and guardrails. |
| **Patterns** | Tabs comparing a single agent, a fixed workflow, and a multi-agent (orchestrator) setup, each with a short pseudocode example. |
| **Use cases** | Where agents work well: software development, research, data analysis, support, personal assistance, and operations. |
| **Limits and risks** | Compounding errors, prompt injection, unsafe actions, and cost. |
| **FAQ** | Short answers to common questions. |

### Interactive features

- **Agent loop simulator.** Pick a scenario (*Plan a picnic*, *Fix a failing test*, or *Research a topic*) and watch a simulated agent step through its reasoning and tool calls in a console. You can run, pause, step through, or reset it.
- **Pattern tabs.** Switch between the three agent architectures.
- **Light/dark theme.** Follows your system setting by default. The toggle button overrides it, and your choice is saved in `localStorage`.
- **Responsive layout.** Works on phones, tablets, and desktops.

## Project structure

```
.
├── index.html   # Page content and structure
├── styles.css   # Layout, components, light/dark theme tokens
└── script.js    # Theme toggle, tabs, and the agent-loop simulation
```

## Download and run locally

### 1. Get the code

**Option A: clone with Git**

```bash
git clone https://github.com/ilindmitry279/Agents.git
cd Agents
```

**Option B: download a ZIP (no Git needed)**

1. Open <https://github.com/ilindmitry279/Agents>.
2. Click the green **Code** button, then **Download ZIP**.
3. Unzip the file. This gives you a folder named `Agents-main`.

### 2. Open the page

Double-click `index.html`, or drag it into any modern browser (Chrome, Firefox, Edge, or Safari). That's all you need. There's nothing to install and no internet connection is required.

### 3. (Optional) Serve it with a local web server

Some browsers limit what pages opened straight from the disk (`file://`) can do. If something doesn't work, serve the folder instead. Run one of these commands from inside the project folder:

```bash
# Python 3
python -m http.server 8000
```

```bash
# Node.js
npx serve .
```

Then open <http://localhost:8000> for Python, or the address that `serve` prints for Node.js.

## Adding a scenario to the simulator

Scenarios are defined in the `scenarios` object in [`script.js`](script.js). Each step is a `[stepKey, label, text]` array, where `stepKey` is one of `goal`, `think`, `act`, `obs`, or `done`:

```js
scenarios.email = [
  ['goal',  'GOAL',    'Reply to the latest customer email.'],
  ['think', 'THINK',   'Read the email first.'],
  ['act',   'ACT',     'read_email(id="latest")'],
  ['obs',   'OBSERVE', 'Customer asks about a refund for order #1042.'],
  ['done',  'DONE',    'Drafted a refund reply for approval.'],
];
```

Then add a matching `<option value="email">` to the `#scenario` dropdown in `index.html`.
