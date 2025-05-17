async function sendMessage() {
  const input = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");
  const message = input.value.trim();
  if (!message) return;

  chatBox.innerHTML += `<p><b>You:</b> ${message}</p>`;
  input.value = "";

  const res = await fetch("/chat", {
    method: "POST",
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ message })
  });
  const data = await res.json();
  chatBox.innerHTML += `<p><b>Bot:</b> ${data.response}</p>`;
  chatBox.scrollTop = chatBox.scrollHeight;
}

function startListening() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'en-US';
  recognition.start();
  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript;
    document.getElementById("user-input").value = transcript;
    sendMessage();
  };
}

document.getElementById("user-input").addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault(); // Prevent form submission (if inside a form)
    sendMessage();
  }
});
document.getElementById("toggle-dark").addEventListener("click", () => {
  const html = document.documentElement;
  html.setAttribute("data-theme", html.getAttribute("data-theme") === "dark" ? "light" : "dark");
});

document.getElementById("download").addEventListener("click", () => {
  window.location.href = "/download";
});

async function logout() {
  await fetch("/logout");
  window.location.href = "/";
}
