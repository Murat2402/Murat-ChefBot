"""Şef Chatbot - FastAPI sunucusu.

Çalıştırmak için:  python -m uvicorn main:app --reload
Sonra tarayıcıda:  http://127.0.0.1:8000
"""
from pathlib import Path
from typing import Literal

from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from chef_ai import ChefError, ask_chef

BASE_DIR = Path(__file__).parent
STATIC_DIR = BASE_DIR / "static"

app = FastAPI(title="Şef Murat Chatbot")


class HistoryItem(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[HistoryItem] = []


class ChatResponse(BaseModel):
    reply: str


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    # Sadece son 20 mesajı gönder (maliyet ve hız için)
    history = [item.model_dump() for item in request.history[-20:]]
    reply = await ask_chef(request.message.strip(), history)
    return ChatResponse(reply=reply)


@app.exception_handler(ChefError)
async def chef_error_handler(_, exc: ChefError):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


@app.get("/")
async def index():
    return FileResponse(STATIC_DIR / "index.html")


# /static/style.css, /static/script.js gibi dosyalar buradan sunulur
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
