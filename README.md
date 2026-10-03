# 👨‍🍳 Şef Murat'ın Mutfağı

### 🔗 [Canlı Demo: murat-chef-bot.vercel.app](https://murat-chef-bot.vercel.app)

> Elindeki malzemeleri söyle, **Şef Murat** sana pratik yemek tarifleri versin. Mutfakla ilgili aklına takılan her şeyi de sorabilirsin.

Python, FastAPI ve Google Gemini ile geliştirilmiş, **eğitim amaçlı** bir yemek şefi chatbot projesidir.

---

## ✨ Özellikler

- 🍳 **Malzemeye göre tarif:** "Yumurta, domates ve peynir var" yaz, süresi ve adımlarıyla 1-3 pratik tarif al.
- 💬 **Şef gibi sohbet:** Pişirme teknikleri, malzeme ikamesi, saklama ve servis gibi tüm mutfak sorularına şef üslubuyla cevap verir.
- 🧠 **Konuşmayı hatırlar:** Önceki mesajları bağlam olarak kullanır, "peki bunu fırında yapabilir miyim?" gibi devam sorularını anlar.
- 🎤 **Sesli sorma:** Mikrofon butonuna basıp Türkçe konuşarak soru sorabilirsin (Chrome ve Edge).
- 📖 **Yemek sayfası teması:** Krem ve kiremit tonlarında, sade ve okunaklı bir arayüz.
- 🔁 **Otomatik yeniden deneme:** Gemini geçici olarak yoğun olduğunda (429/503) istek birkaç kez tekrarlanır.

## 🛠️ Kullanılan Teknolojiler

| Katman | Teknoloji |
|---|---|
| Backend | Python, [FastAPI](https://fastapi.tiangolo.com/) |
| Yapay zekâ | [Google Gemini API](https://ai.google.dev/) (REST, `httpx` ile) |
| Frontend | Saf HTML, CSS ve JavaScript |
| Sesli giriş | Tarayıcının Web Speech API özelliği |
| Yayın | [Vercel](https://vercel.com) |

## 📁 Proje Yapısı

```text
.
├── main.py            # FastAPI sunucusu ve /api/chat uç noktası
├── chef_ai.py         # Şef karakteri (system prompt) ve Gemini isteği
├── requirements.txt   # Python bağımlılıkları
├── .env.example       # Ortam değişkenleri şablonu
└── static/
    ├── index.html     # Sayfa yapısı
    ├── style.css      # Tasarım
    └── script.js      # Sohbet ve sesli sorma mantığı
```

## 🚀 Kendi Bilgisayarında Çalıştırma

1. **Depoyu klonla**
   ```bash
   git clone https://github.com/Murat2402/Murat-ChefBot.git
   cd Murat-ChefBot
   ```

2. **Sanal ortam oluştur ve bağımlılıkları kur**
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # macOS / Linux:
   source .venv/bin/activate

   pip install -r requirements.txt
   ```

3. **API anahtarını ekle**

   [Google AI Studio](https://aistudio.google.com/apikey) üzerinden ücretsiz bir Gemini API anahtarı al, ardından `.env.example` dosyasını `.env` adıyla kopyalayıp doldur:
   ```env
   GEMINI_API_KEY=buraya_api_anahtarini_yaz
   GEMINI_MODEL=gemini-3.5-flash
   ```

4. **Sunucuyu başlat**
   ```bash
   python -m uvicorn main:app --reload
   ```

5. Tarayıcıda **http://127.0.0.1:8000** adresini aç.

## ☁️ Vercel'e Yayınlama

1. Projeyi GitHub'a yükle.
2. [Vercel](https://vercel.com) üzerinden depoyu içe aktar. FastAPI otomatik algılanır.
3. **Environment Variables** bölümüne `GEMINI_API_KEY` ve `GEMINI_MODEL` değerlerini ekle.
4. **Deploy**'a bas.

> ⚠️ API anahtarını asla koda yazma veya GitHub'a yükleme. `.env` dosyası `.gitignore` içinde olduğu için git'e girmez.

## 🔌 API

**`POST /api/chat`**

```json
{
  "message": "Patates ve kıyma var, ne yapabilirim?",
  "history": [
    { "role": "user", "content": "Merhaba" },
    { "role": "assistant", "content": "Hoş geldin!" }
  ]
}
```

Yanıt:

```json
{ "reply": "Şefin cevabı..." }
```

## 🗺️ Gelecek Fikirleri

- Malzeme etiketleri ile hızlı seçim
- Beslenme filtreleri (vejetaryen, glütensiz, alerjen)
- Favori tarifleri kaydetme
- Fotoğraftan malzeme tanıma
- Şefin cevabını sesli okuması

---

Aşkla pişir! 🍝
