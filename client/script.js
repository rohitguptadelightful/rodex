import bot from './assets/bot.svg';
import user from './assets/user.svg';

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');
const mic = document.getElementById('#mic');
const textArea = document.getElementById('#textarea');
var isListening = false;

let loadInterval;

function loader(element) {
  element.textContent = '';

  loadInterval = setInterval(() => {
    element.textContent += '.';

    if (element.textContent === '....') {
      element.textContent = '';
    }
  }, 300)
}

function typeText(element, text) {
  let index = 0;

  let interval = setInterval(() => {
    if (index < text.length) {
      element.innerHTML += text.charAt(index);
      index++;
    } else {
      clearInterval(interval);
    }
  }, 20)
}

function generateUniqueId() {
  const timestamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16);

  return `id-${timestamp}-${hexadecimalString}`;
}

function chatStrip(isAi, value, uniqueId) {
  return (
    `
    <div class="wrapper ${isAi && 'ai'}">
      <div class="chat">
          <div class="profile">
                <img
                  src="${isAi ? bot : user}"
                  alt="${isAi ? 'bot' : 'user'}"
                />
          </div>
          <div class="message" id=${uniqueId}>${value}</div>
      </div>
    </div>

    `
  )
}

const handleSubmit = async (e) => {
  e.preventDefault();

  const data = new FormData(form);

  //user's chatstrip
  chatContainer.innerHTML += chatStrip(false, data.get('prompt'));

  form.reset();

  //bot's chatstrip
  const uniqueId = generateUniqueId();
  chatContainer.innerHTML += chatStrip(true, " ", uniqueId);

  chatContainer.scrollTop = chatContainer.scrollHeight;

  const messageDiv = document.getElementById(uniqueId);

  loader(messageDiv);

  //fetch data from server -> bot's response

  // const response = await fetch('http://localhost:5000', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     prompt: data.get('prompt')
  //   })
  // })

  const response = await fetch('https://rodex-3w2s.onrender.com', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: data.get('prompt')
    })
  })

  clearInterval(loadInterval);
  messageDiv.innerHTML = '';
  if (response.ok) {
    const data = await response.json();
    const parsedData = data.bot.trim();

    typeText(messageDiv, parsedData);
    const speech = new SpeechSynthesisUtterance(parsedData);
    window.speechSynthesis.speak(speech);
  } else {
    const err = await response.text();
    messageDiv.innerHTML = "Something went wrong";
    alert(err);
  }
}

form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', (e) => {
  if (e.keyCode === 13) {
    handleSubmit(e);
  }
})

window.onload = function () {
  document.getElementById("#textarea").focus();
};


if ('webkitSpeechRecognition' in window) {
  const recognition = new webkitSpeechRecognition();
  recognition.countinuous = true;
  recognition.interimResults = true;

  mic.addEventListener('click', () => {
    if (isListening) {
      recognition.stop();
      isListening = false;
      mic.src = "assets/micoff.svg"
    } else {
      recognition.start();
      isListening = true;
      mic.src = "assets/mic.svg"
    }
  });

  recognition.addEventListener('result', (event) => {
    const transcript = event.results[0][0].transcript;
    textArea.value += transcript;
  });

  recognition.addEventListener('end', () => {
    recognition.start();
  });
} else {
  mic.style.display = 'none';
  textArea.value = 'speech recognition not supported by your browser.';
}

