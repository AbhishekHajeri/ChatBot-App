let isListening = false;
let recognition = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
  loadChatHistory();
  initializeSpeechRecognition();
  
  // Focus on input field
  document.getElementById("user-input").focus();
  
  // Hide welcome message if there's chat history
  const chatHistory = document.getElementById("chat-box").children;
  if (chatHistory.length > 1) {
    hideWelcomeMessage();
  }
});

// Enhanced send message function
async function sendMessage() {
  const input = document.getElementById("user-input");
  const message = input.value.trim();
  
  if (!message) return;
  
  // Add user message to chat
  addMessage(message, 'user');
  input.value = "";
  
  // Show typing indicator
  showTypingIndicator();
  
  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ message })
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    
    // Hide typing indicator
    hideTypingIndicator();
    
    if (data.error) {
      addMessage(`Error: ${data.error}`, 'bot');
    } else {
      addMessage(data.response, 'bot');
    }
    
  } catch (error) {
    hideTypingIndicator();
    addMessage(`Sorry, there was an error processing your request: ${error.message}`, 'bot');
  }
  
  // Scroll to bottom
  scrollToBottom();
}

// Add message to chat with animation
function addMessage(content, type) {
  const chatBox = document.getElementById("chat-box");
  hideWelcomeMessage();
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;
  
  const messageContent = document.createElement('div');
  messageContent.className = 'message-bubble';
  messageContent.innerHTML = formatMessage(content);
  
  const messageTime = document.createElement('div');
  messageTime.className = 'message-time';
  messageTime.textContent = getCurrentTime();
  
  messageDiv.appendChild(messageContent);
  messageDiv.appendChild(messageTime);
  chatBox.appendChild(messageDiv);
  
  // Animate message appearance
  messageDiv.style.opacity = '0';
  messageDiv.style.transform = 'translateY(20px)';
  
  setTimeout(() => {
    messageDiv.style.transition = 'all 0.3s ease-out';
    messageDiv.style.opacity = '1';
    messageDiv.style.transform = 'translateY(0)';
  }, 10);
  
  scrollToBottom();
}

// Format message content (basic markdown support)
function formatMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}

// Get current time
function getCurrentTime() {
  return new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

// Show/hide typing indicator
function showTypingIndicator() {
  const indicator = document.getElementById("typing-indicator");
  indicator.style.display = 'flex';
  scrollToBottom();
}

function hideTypingIndicator() {
  const indicator = document.getElementById("typing-indicator");
  indicator.style.display = 'none';
}

// Hide welcome message
function hideWelcomeMessage() {
  const welcomeMessage = document.querySelector('.welcome-message');
  if (welcomeMessage) {
    welcomeMessage.style.display = 'none';
  }
}

// Scroll to bottom of chat
function scrollToBottom() {
  const chatBox = document.getElementById("chat-box");
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Enhanced speech recognition
function initializeSpeechRecognition() {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onstart = function() {
      isListening = true;
      const micIcon = document.getElementById("mic-icon");
      const voiceBtn = micIcon.closest('.voice-btn');
      micIcon.className = 'fas fa-stop';
      voiceBtn.classList.add('recording');
    };
    
    recognition.onresult = function(event) {
      const transcript = event.results[0][0].transcript;
      document.getElementById("user-input").value = transcript;
      sendMessage();
    };
    
    recognition.onend = function() {
      isListening = false;
      const micIcon = document.getElementById("mic-icon");
      const voiceBtn = micIcon.closest('.voice-btn');
      micIcon.className = 'fas fa-microphone';
      voiceBtn.classList.remove('recording');
    };
    
    recognition.onerror = function(event) {
      console.error('Speech recognition error:', event.error);
      isListening = false;
      const micIcon = document.getElementById("mic-icon");
      const voiceBtn = micIcon.closest('.voice-btn');
      micIcon.className = 'fas fa-microphone';
      voiceBtn.classList.remove('recording');
      
      if (event.error === 'not-allowed') {
        showNotification('Microphone access denied. Please allow microphone access and try again.', 'error');
      }
    };
  } else {
    // Hide voice button if not supported
    const voiceBtn = document.querySelector('.voice-btn');
    if (voiceBtn) {
      voiceBtn.style.display = 'none';
    }
  }
}

// Start/stop listening
function startListening() {
  if (!recognition) {
    showNotification('Speech recognition not supported in this browser.', 'error');
    return;
  }
  
  if (isListening) {
    recognition.stop();
  } else {
    recognition.start();
  }
}

// Send predefined messages
function sendPredefinedMessage(message) {
  document.getElementById("user-input").value = message;
  sendMessage();
}

// Load chat history
async function loadChatHistory() {
  try {
    const res = await fetch("/history");
    const history = await res.json();
    
    if (history && history.length > 0) {
      const chatBox = document.getElementById("chat-box");
      chatBox.innerHTML = ''; // Clear existing content
      
      history.forEach(item => {
        addMessage(item.user, 'user');
        addMessage(item.bot, 'bot');
      });
      
      scrollToBottom();
    }
  } catch (error) {
    console.error('Error loading chat history:', error);
  }
}

// Clear chat
async function clearChat() {
  if (confirm('Are you sure you want to clear the entire chat history?')) {
    try {
      const res = await fetch('/clear-chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
      });
      
      if (res.ok) {
        const chatBox = document.getElementById("chat-box");
        chatBox.innerHTML = `
          <div class="welcome-message">
            <div class="welcome-icon">
              <i class="fas fa-robot"></i>
            </div>
            <h3>Welcome to AI ChatBot!</h3>
            <p>I'm here to help you with any questions or tasks. Start a conversation below.</p>
          </div>
        `;
        showNotification('Chat history cleared successfully!', 'success');
      }
    } catch (error) {
      showNotification('Error clearing chat history.', 'error');
    }
  }
}

// Show notifications
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-${getNotificationIcon(type)}"></i>
      <span>${message}</span>
    </div>
  `;
  
  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${getNotificationColor(type)};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    max-width: 300px;
  `;
  
  notification.querySelector('.notification-content').style.cssText = `
    display: flex;
    align-items: center;
    gap: 0.5rem;
  `;
  
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

function getNotificationIcon(type) {
  switch(type) {
    case 'success': return 'check-circle';
    case 'error': return 'exclamation-circle';
    case 'warning': return 'exclamation-triangle';
    default: return 'info-circle';
  }
}

function getNotificationColor(type) {
  switch(type) {
    case 'success': return '#48bb78';
    case 'error': return '#f56565';
    case 'warning': return '#ed8936';
    default: return '#4299e1';
  }
}

// Theme toggle
function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  html.setAttribute("data-theme", newTheme);
  
  // Update theme toggle icon
  const themeToggle = document.getElementById("toggle-dark");
  const icon = themeToggle.querySelector('i');
  icon.className = newTheme === "dark" ? "fas fa-sun" : "fas fa-moon";
  
  // Save preference
  localStorage.setItem('theme', newTheme);
}

// Download chat history
function downloadHistory() {
  window.location.href = "/download";
}

// Logout function
async function logout() {
  if (confirm('Are you sure you want to logout?')) {
    try {
      await fetch("/logout");
      window.location.href = "/login";
    } catch (error) {
      window.location.href = "/login";
    }
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
  // Load saved theme
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  // Update theme toggle icon
  const themeToggle = document.getElementById("toggle-dark");
  if (themeToggle) {
    const icon = themeToggle.querySelector('i');
    icon.className = savedTheme === "dark" ? "fas fa-sun" : "fas fa-moon";
  }
});

// Enter key to send message
document.getElementById("user-input").addEventListener("keydown", function (event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

// Theme toggle event listener
document.getElementById("toggle-dark").addEventListener("click", toggleTheme);

// Download button event listener
document.getElementById("download").addEventListener("click", downloadHistory);

// Clear chat button event listener
document.getElementById("clear-chat").addEventListener("click", clearChat);

// Auto-resize input field
document.getElementById("user-input").addEventListener("input", function() {
  this.style.height = "auto";
  this.style.height = Math.min(this.scrollHeight, 120) + "px";
});

// Prevent form submission on enter in input field
document.getElementById("user-input").addEventListener("keypress", function(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});