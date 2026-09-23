"""Day 3 chat backend: a small FastAPI server that sends a conversation to Groq."""

import logging
import os
from pathlib import Path
from typing import Annotated, Literal, NoReturn

import groq
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict, Field, StringConstraints

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")  # real environment variables win over values in .env

SYSTEM_PROMPT = (
    "You are a helpful educational assistant. "
    "Explain clearly, be concise, and acknowledge uncertainty."
)
MAX_MESSAGES = 20          # longest conversation the server accepts
MAX_CHARS = 4000           # longest single message
MAX_OUTPUT_TOKENS = 512    # longest reply Groq may generate
TIMEOUT_SECONDS = 30.0     # give up on Groq after this long

log = logging.getLogger("day3")
app = FastAPI(title="Day 3 chat backend")


class Message(BaseModel):
    model_config = ConfigDict(extra="forbid")
    role: Literal["user", "assistant"]
    content: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=MAX_CHARS)]


class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    messages: list[Message] = Field(min_length=1, max_length=MAX_MESSAGES)


class ChatResponse(BaseModel):
    reply: str
    model: str


def read_config() -> tuple[str, str]:
    return os.getenv("GROQ_API_KEY", "").strip(), os.getenv("GROQ_MODEL", "").strip()


def error_code(err: groq.APIStatusError) -> str:
    """Groq's short error code, such as "model_decommissioned" (never contains the key)."""
    body = err.body if isinstance(err.body, dict) else {}
    inner = body.get("error", body)
    return str(inner.get("code", "")) if isinstance(inner, dict) else ""


def fail(status: int, message: str, err: Exception | None = None) -> NoReturn:
    # Log only the error type and status, never the request, headers, or key.
    if err is not None:
        log.warning("Groq call failed: %s (HTTP %s)", type(err).__name__, getattr(err, "status_code", "-"))
    raise HTTPException(status_code=status, detail=message)


@app.get("/api/health")
def health():
    api_key, model = read_config()
    return {
        "status": "ok",
        "api_key_configured": bool(api_key),
        "model_configured": bool(model),
        "model": model or None,
    }


@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    api_key, model = read_config()
    if not api_key or not model:
        fail(503, "The server is not configured. Set GROQ_API_KEY and GROQ_MODEL in day3/.env and restart it.")
    if request.messages[-1].role != "user":
        fail(422, "The last message must come from the user.")

    client = groq.Groq(api_key=api_key, timeout=TIMEOUT_SECONDS, max_retries=0)
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages += [m.model_dump() for m in request.messages]

    try:
        completion = client.chat.completions.create(
            model=model,
            messages=messages,
            max_completion_tokens=MAX_OUTPUT_TOKENS,
        )
    except groq.AuthenticationError as err:
        fail(502, "Groq rejected the API key. Check GROQ_API_KEY in day3/.env.", err)
    except groq.PermissionDeniedError as err:
        fail(502, "This API key is not allowed to use the configured model. Check GROQ_MODEL.", err)
    except groq.NotFoundError as err:
        fail(502, f"The model '{model}' is not available on Groq. Ask your instructor for a current model ID.", err)
    except groq.RateLimitError as err:
        fail(429, "Groq's rate limit was reached. Wait a moment and try again.", err)
    except groq.APITimeoutError as err:
        fail(504, f"Groq did not answer within {TIMEOUT_SECONDS:.0f} seconds. Try again.", err)
    except groq.APIConnectionError as err:
        fail(502, "Could not connect to Groq. Check your internet connection.", err)
    except groq.BadRequestError as err:
        if "model" in error_code(err):
            fail(502, f"The model '{model}' is not available on Groq. Ask your instructor for a current model ID.", err)
        fail(502, "Groq could not process this conversation. Try a shorter message.", err)
    except groq.APIStatusError as err:
        fail(502, f"Groq returned an error (HTTP {err.status_code}). Try again later.", err)

    reply = ""
    if completion.choices:
        reply = (completion.choices[0].message.content or "").strip()
    if not reply:
        fail(502, "Groq returned an empty reply. Try rephrasing your message.")
    return ChatResponse(reply=reply, model=completion.model or model)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
