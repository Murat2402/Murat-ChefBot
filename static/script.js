const messagesEl = document.getElementById("messages");
const form = document.getElementById("chat-form");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");
const suggestionsEl = document.getElementById("suggestions");

// Konuşma geçmişi: sunucuya her istekte gönderilir ki şef bağlamı hatırlasın
const history = [];

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Gemini'nin döndürdüğü basit markdown'ı (başlık, kalın, liste) HTML'e çevirir.
// Önce metin kaçışlanır, böylece güvenlidir.
function renderMarkdown(text) {
  const lines = escapeHtml(text).split("\n");
  let html = "";
  let list = null; // "ul" | "ol" | null

  const closeList = () => { if (list) { html += `</${list}>`; list = null; } };
  const inline = (s) => s
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, "$1<em>$2</em>");

  for (const raw of lines) {
    const line = raw.trim();
    let m;
    if (!line) { closeList(); continue; }
    if ((m = line.match(/^#{1,6}\s+(.*)$/))) {
      closeList(); html += `<h3>${inline(m[1])}</h3>`;
    } else if ((m = line.match(/^[-*•]\s+(.*)$/))) {
      if (list !== "ul") { closeList(); html += "<ul>"; list = "ul"; }
      html += `<li>${inline(m[1])}</li>`;
    } else if ((m = line.match(/^\d+[.)]\s+(.*)$/))) {
      if (list !== "ol") { closeList(); html += "<ol>"; list = "ol"; }
      html += `<li>${inline(m[1])}</li>`;
    } else {
      closeList(); html += `<p>${inline(line)}</p>`;
    }
  }
  closeList();
  return html;
}

function addMessage(role, content, { html = false, extraClass = "" } = {}) {
  const wrapper = document.createElement("div");
  wrapper.className = `msg ${role} ${extraClass}`.trim();

  if (role === "chef") {
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "👨‍🍳";
    wrapper.appendChild(avatar);
  }

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  if (html) bubble.innerHTML = content;
  else bubble.textContent = content;
  wrapper.appendChild(bubble);

  messagesEl.appendChild(wrapper);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return wrapper;
}

async function sendMessage(text) {
  addMessage("user", text);
  suggestionsEl.style.display = "none";
  input.value = "";
  sendBtn.disabled = true;

  const typing = addMessage(
    "chef",
    '<div class="typing"><span></span><span></span><span></span></div>',
    { html: true }
  );

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, history }),
    });
    const data = await response.json();
    typing.remove();

    if (!response.ok) {
      const detail = typeof data.detail === "string" ? data.detail : "Bir şeyler ters gitti.";
      addMessage("chef", detail, { extraClass: "error" });
      return;
    }

    addMessage("chef", renderMarkdown(data.reply), { html: true });
    history.push({ role: "user", content: text });
    history.push({ role: "assistant", content: data.reply });
  } catch (err) {
    typing.remove();
    addMessage("chef", "Sunucuya bağlanılamadı. Uygulama çalışıyor mu?", { extraClass: "error" });
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (text) sendMessage(text);
});

suggestionsEl.addEventListener("click", (event) => {
  if (event.target.classList.contains("chip")) sendMessage(event.target.textContent);
});

// ---------------------------------------------------------------
// Sesli sorma (tarayıcının Web Speech API özelliği)
// Chrome ve Edge destekler. Desteklemeyen tarayıcıda buton gizlenir.
// ---------------------------------------------------------------
const micBtn = document.getElementById("mic");
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  micBtn.style.display = "none";
} else {
  const recognition = new SpeechRecognition();
  recognition.lang = "tr-TR";
  recognition.interimResults = true; // konuşurken yazıyı canlı göster
  recognition.continuous = false;    // bir cümle söyleyince otomatik dursun

  let listening = false;
  let finalText = "";

  const MIC_ERRORS = {
    "not-allowed": "Mikrofon izni verilmedi. Adres çubuğundaki kilit simgesinden mikrofona izin ver.",
    "service-not-allowed": "Mikrofon izni verilmedi. Adres çubuğundaki kilit simgesinden mikrofona izin ver.",
    "no-speech": "Ses duyamadım, tekrar dener misin?",
    "audio-capture": "Mikrofon bulunamadı. Bir mikrofon bağlı mı?",
    "network": "Ses tanıma servisine ulaşılamadı. İnternet bağlantını kontrol et.",
  };

  recognition.onstart = () => {
    listening = true;
    finalText = "";
    micBtn.classList.add("listening");
    micBtn.title = "Dinleniyor... durdurmak için tıkla";
    input.placeholder = "Dinliyorum...";
  };

  recognition.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) finalText += transcript;
      else interim += transcript;
    }
    input.value = (finalText + interim).trim();
  };

  recognition.onerror = (event) => {
    if (event.error === "aborted") return;
    const message = MIC_ERRORS[event.error] || `Ses tanıma hatası: ${event.error}`;
    addMessage("chef", message, { extraClass: "error" });
  };

  recognition.onend = () => {
    listening = false;
    micBtn.classList.remove("listening");
    micBtn.title = "Sesli sor";
    input.placeholder = "Örn: Patates, soğan ve kıyma var...";

    // Konuşma bittiyse yazıyı otomatik şefe gönder
    const text = finalText.trim();
    if (text && !sendBtn.disabled) sendMessage(text);
  };

  micBtn.addEventListener("click", () => {
    if (listening) {
      recognition.stop();
      return;
    }
    if (sendBtn.disabled) return; // şef cevap yazarken dinleme başlatma
    try {
      recognition.start();
    } catch (err) {
      // start() zaten çalışıyorsa hata verebilir, yok sayıyoruz
    }
  });
}
