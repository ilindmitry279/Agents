# Day 3: Local chat backend

A small Python server that receives a chat conversation and returns a reply from a Groq-hosted language model.

It runs on your own computer. Your Groq API key stays on the server and is never sent to the browser.

This folder is self-contained. The Day 2 website at the root of the repository and its GitHub Pages setup are not affected.

## Files

| File | Purpose |
|------|---------|
| `app.py` | The server (FastAPI) |
| `requirements.txt` | Python packages to install |
| `.env.example` | Template for your settings. Copy it to `.env`. |
| `README.md` | This guide |

## Setup

You need **Python 3.14**. Run every command from inside this `day3/` folder.

**1. Create and activate a virtual environment**

Windows (PowerShell):

```powershell
py -3.14 -m venv .venv
.venv\Scripts\Activate.ps1
```

macOS / Linux:

```bash
python3.14 -m venv .venv
source .venv/bin/activate
```

**2. Install the packages**

```bash
pip install -r requirements.txt
```

**3. Add your settings**

Copy `.env.example` to a new file named `.env` in this folder. Then open `.env` and replace both placeholders:

- `GROQ_API_KEY`: your key from <https://console.groq.com/keys>
- `GROQ_MODEL`: the model ID your instructor gives you

`.env` is listed in the repository's `.gitignore`, so Git won't commit it. Never paste your key into chat, code, or `.env.example`.

**4. Start the server**

```bash
python app.py
```

The server runs at <http://127.0.0.1:8000> and is reachable only from your own computer. Press `Ctrl+C` to stop it.

## Try it

Open <http://127.0.0.1:8000/docs> in your browser. This test page is generated automatically. Pick an endpoint, click **Try it out**, then **Execute**.

### `GET /api/health`

Shows whether the server is running and whether both settings are present. It doesn't contact Groq and never shows the key.

```json
{"status": "ok", "api_key_configured": true, "model_configured": true, "model": "your-model-id"}
```

### `POST /api/chat`

Send the conversation so far. The last message must come from the user.

```json
{"messages": [{"role": "user", "content": "Hello"}]}
```

Reply:

```json
{"reply": "Hi! How can I help you learn today?", "model": "your-model-id"}
```

To continue the conversation, send the whole history again with the model's earlier replies as `assistant` messages:

```json
{"messages": [
  {"role": "user", "content": "What is an API?"},
  {"role": "assistant", "content": "An API is a way for programs to talk to each other..."},
  {"role": "user", "content": "Give me an example."}
]}
```

## Built-in rules

- **Server-owned instruction:** every conversation starts with *"You are a helpful educational assistant. Explain clearly, be concise, and acknowledge uncertainty."* The browser can't change it.
- **Allowed roles:** only `user` and `assistant`. Any other role (such as `system`) or any extra field is rejected.
- **Limits:** at most 20 messages per request and 4,000 characters per message. Empty or whitespace-only messages are rejected.
- **One Groq call per request:** replies are capped at 512 tokens, Groq gets 30 seconds to answer, and failed calls are not retried automatically.

You can change these numbers at the top of `app.py`.

## Error messages

| HTTP status | Meaning | What to do |
|------|---------|------------|
| 422 | The request was empty, too long, or used a wrong role | Fix the request body |
| 503 | `GROQ_API_KEY` or `GROQ_MODEL` is missing | Fill in `.env` and restart the server |
| 502 | Groq rejected the key, the model is unavailable, the connection failed, or the reply was empty | Read the message. It says which of these happened. |
| 429 | Groq's rate limit was reached | Wait a moment and try again |
| 504 | Groq took longer than 30 seconds | Try again |

Error messages never include your API key.
