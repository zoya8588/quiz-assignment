

// STATE VARIABLES


let currentQuestion = 0;

// Load saved answers (for refresh resume)


let answers = JSON.parse(localStorage.getItem("answers"))
  || new Array(questions.length).fill(null);

// Track locked questions (time over)


let locked = JSON.parse(localStorage.getItem("locked"))
  || new Array(questions.length).fill(false);

// Track per-question timers


let questionTimers = JSON.parse(localStorage.getItem("questionTimers")) || {};

let timeLeft = 30;
let timer;

// TIMER FUNCTION


function startTimer() {
  if (timer) clearInterval(timer);

  timer = setInterval(() => {
    document.getElementById("time").innerText = timeLeft;
    timeLeft--;
    
    // Save remaining time for this question


    questionTimers[currentQuestion] = timeLeft;
    localStorage.setItem("questionTimers", JSON.stringify(questionTimers));

    if (timeLeft < 0) {
      clearInterval(timer);
      
      const selected = document.querySelector('input[name="option"]:checked');

      if (selected) {
        answers[currentQuestion] = parseInt(selected.value);
      } else {
        answers[currentQuestion] = null;


        // lock question only if not answered when time is up


        locked[currentQuestion] = true;
      }

      localStorage.setItem("answers", JSON.stringify(answers));
      localStorage.setItem("locked", JSON.stringify(locked));
      localStorage.setItem("questionTimers", JSON.stringify(questionTimers));

      if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        loadQuestion();
      } else {
        submitQuiz();
      }
    }

  }, 1000);
}

// LOAD QUESTION


function loadQuestion() {
  const q = questions[currentQuestion];
  document.getElementById("question").innerText = q.question;

  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";

  q.options.forEach((opt, index) => {
    const label = document.createElement("label");
    label.className = "option-label";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "option";
    input.value = index;
    input.id = `option-${index}`;

    if (answers[currentQuestion] === index) {
      input.checked = true;
    }

    label.appendChild(input);
    label.append(opt);
    optionsDiv.appendChild(label);
  });

  // Initialize timer for this question if not already set


  if (questionTimers[currentQuestion] === undefined) {
    questionTimers[currentQuestion] = 30;
  }
  timeLeft = questionTimers[currentQuestion];

  updateProgress();
  createPalette();
  updateNavButtons();
  document.getElementById("time").innerText = timeLeft;
  startTimer();
}

function updateNavButtons() {
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");

  prevBtn.disabled = currentQuestion === 0;
  nextBtn.disabled = currentQuestion === questions.length - 1;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getOptionText(question, answerIndex) {
  return answerIndex === null ? "No answer" : escapeHtml(question.options[answerIndex]);
}

// SAVE ANSWER (mandatory)


function saveAnswer() {
  const selected = document.querySelector('input[name="option"]:checked');

  if (!selected) {
    alert("Please select an answer");
    return false;
  }

  answers[currentQuestion] = parseInt(selected.value);
  localStorage.setItem("answers", JSON.stringify(answers));
  return true;
}

function saveCurrentSelection() {
  const selected = document.querySelector('input[name="option"]:checked');
  if (!selected) return;

  answers[currentQuestion] = parseInt(selected.value);
  localStorage.setItem("answers", JSON.stringify(answers));
}

// NEXT BUTTON


function nextQuestion() {
  if (!saveAnswer()) return;

  if (currentQuestion < questions.length - 1) {
    currentQuestion++;
    loadQuestion();
  }
}

// PREVIOUS BUTTON (locked check)


function prevQuestion() {
  if (currentQuestion === 0) return;

  if (locked[currentQuestion - 1]) {
    alert("This question has timed out, you cannot go back");
    return;
  }

  saveCurrentSelection();
  currentQuestion--;
  loadQuestion();
}

// SUBMIT QUIZ


function submitQuiz() {
  clearInterval(timer);
  saveCurrentSelection();

  let score = 0;

  questions.forEach((q, i) => {
    if (answers[i] === q.answer) score++;
  });

  let message = "";

  if (score === questions.length) {
    message = "Excellent work:)";
  } else if (score >= 15) {
    message = "Well done!!";
  } else if (score >= 10) {
    message = "Good job:)";
  } else {
    message = "Better luck next time:(";
  }

  const reviewHtml = questions.map((q, i) => {
    const selected = answers[i];
    const correct = q.answer;
    const isCorrect = selected === correct;

    return `
      <div class="review-card ${isCorrect ? "correct" : "wrong"}">
        <div class="review-title">Q${i + 1}: ${escapeHtml(q.question)}</div>
        <div class="review-row"><strong>Your answer:</strong> ${getOptionText(q, selected)}</div>
        <div class="review-row"><strong>Correct answer:</strong> ${getOptionText(q, correct)}</div>
      </div>`;
  }).join("");

  showResultPopup(score, message, reviewHtml);
  localStorage.clear();
}

function showResultPopup(score, message, reviewHtml) {
  const container = document.getElementById("quiz-container");
  container.innerHTML = `
    <div class="result-card">
      <h2>Quiz Completed</h2>
      <p class="result-score">Your Score: ${score}/${questions.length}</p>
      <p class="result-message">${message}</p>
      <div class="review-grid">${reviewHtml}</div>
      <button onclick="restartQuiz()">Restart</button>
    </div>`;
}

// RESTART


function restartQuiz() {
  localStorage.clear();
  location.reload();
}

// PROGRESS BAR


function updateProgress() {
  let progress = ((currentQuestion + 1) / questions.length) * 100;
  document.getElementById("progress-bar").style.width = progress + "%";
}

// QUESTION PALETTE


function createPalette() {
  const palette = document.getElementById("palette");
  palette.innerHTML = "";

  questions.forEach((_, index) => {
    const btn = document.createElement("button");
    btn.innerText = index + 1;

    if (answers[index] !== null) {
      btn.classList.add("answered");
    }

    if (index === currentQuestion) {
      btn.classList.add("current");
    }

    btn.onclick = () => {
      if (locked[index]) {
        alert("This question is locked you cannot go back");
        return;
      }

      saveCurrentSelection();
      currentQuestion = index;
      loadQuestion();
    };

    palette.appendChild(btn);
  });
}

// START APP


loadQuestion();