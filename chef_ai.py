"""Şef karakterinin tanımı ve Gemini API ile konuşan kısım."""
import asyncio
import os

import httpx
from dotenv import load_dotenv

MAX_ATTEMPTS = 3
RETRY_STATUS_CODES = {429, 500, 503}

# .env dosyasındaki değerleri ortam değişkeni olarak yükler
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent"
)

# Modele "kim olduğunu" söyleyen talimat (system prompt)
SYSTEM_PROMPT = """Sen "Şef Murat" adında, 30 yıllık deneyime sahip, sıcakkanlı ve tutkulu bir şefsin.
Her soruya baştan sona bir şef gibi, Türkçe cevap verirsin.

Kurallar:
- Kullanıcı malzeme söylerse, o malzemelerle yapılabilecek 1-3 PRATİK tarif öner.
  Her tarif için: Tarif adı, süre, malzemeler (eksik/ekstra olanları belirt) ve kısa adımlar ver.
- Tarifler evde, az ekipmanla ve kısa sürede yapılabilir olsun.
- Yemek, mutfak, malzeme ikamesi, pişirme teknikleri, saklama, servis gibi tüm sorulara şef gibi cevap ver.
- Konu yemekle hiç ilgili değilse kibarca ve esprili şekilde konuyu mutfağa getir.
- Ton: samimi, motive edici, hafif esprili. Ara sıra "Aşkla pişir!" gibi şef deyimleri kullanabilirsin.
- Cevapları okunaklı tut: kısa başlıklar için **kalın**, liste için "- " kullan. Gereksiz uzatma.
"""


class ChefError(Exception):
    """Kullanıcıya gösterilebilecek anlaşılır hata."""

    def __init__(self, message: str, status_code: int = 500):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


async def ask_chef(message: str, history: list[dict]) -> str:
    """Geçmiş konuşma + yeni mesajı Gemini'ye gönderip şefin cevabını döndürür."""
    if not GEMINI_API_KEY or GEMINI_API_KEY.startswith("buraya"):
        raise ChefError(
            "Gemini API anahtarı bulunamadı. .env dosyasına GEMINI_API_KEY ekleyin.", 500
        )

    # Gemini'de roller "user" ve "model" şeklindedir
    contents = [
        {
            "role": "user" if item["role"] == "user" else "model",
            "parts": [{"text": item["content"]}],
        }
        for item in history
    ]
    contents.append({"role": "user", "parts": [{"text": message}]})

    payload = {
        "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "contents": contents,
        "generationConfig": {"temperature": 0.8, "maxOutputTokens": 2048},
    }
    headers = {"x-goog-api-key": GEMINI_API_KEY, "Content-Type": "application/json"}

    # Gemini bazen geçici olarak yoğun olur (429/503); birkaç kez tekrar deneriz
    response = None
    for attempt in range(MAX_ATTEMPTS):
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                response = await client.post(GEMINI_URL, json=payload, headers=headers)
        except httpx.HTTPError as exc:
            raise ChefError(f"Gemini'ye ulaşılamadı: {exc.__class__.__name__}", 502)

        if response.status_code not in RETRY_STATUS_CODES:
            break
        if attempt < MAX_ATTEMPTS - 1:
            await asyncio.sleep(2 * (attempt + 1))

    if response.status_code != 200:
        try:
            detail = response.json()["error"]["message"]
        except Exception:
            detail = response.text[:200]
        raise ChefError(f"Gemini hatası ({response.status_code}): {detail}", 502)

    data = response.json()
    try:
        parts = data["candidates"][0]["content"]["parts"]
        return "".join(part.get("text", "") for part in parts).strip()
    except (KeyError, IndexError):
        raise ChefError("Şef şu an cevap veremedi, lütfen tekrar deneyin.", 502)
