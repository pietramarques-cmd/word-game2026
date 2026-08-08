const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 5;
let words = [];

const boardEl = document.getElementById("board");
const messageEl = document.getElementById("message");
const submitBtn = document.getElementById("submitBtn");
const deleteBtn = document.getElementById("deleteBtn");
const playAgainWrap = document.getElementById("playAgainWrap");
const playAgainBtn = document.getElementById("playAgainBtn");

const rows = [];
let secretWord = "";
let currentRow = 0;
let currentCol = 0;
let isFinished = false;

function normalizeWords(text) {
  return text
    .split(/\r?\n/)
    .map((word) =>
      word
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .trim()
        .replace(/[^A-Z]/g, "")
    )
    .filter((word) => word.length === WORD_LENGTH && word !== "");
}

async function loadWords() {
  try {
    const response = await fetch("palavra.txt");
    if (!response.ok) {
      throw new Error("Arquivo palavra.txt não encontrado.");
    }

    const text = await response.text();
    words = [...new Set(normalizeWords(text))];

    if (words.length === 0) {
      throw new Error("Nenhuma palavra válida foi encontrada no arquivo.");
    }

    startGame();
  } catch (error) {
    console.error(error);
    setMessage("Não foi possível carregar as palavras. Verifique o arquivo palavra.txt.", "error");
  }
}

function pickRandomWord() {
  const randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex];
}

function setMessage(text, type = "info") {
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
}

function togglePlayAgainButton(show) {
  playAgainWrap.hidden = !show;
}

function createBoard() {
  boardEl.innerHTML = "";
  rows.length = 0;

  for (let rowIndex = 0; rowIndex < MAX_ATTEMPTS; rowIndex += 1) {
    const row = document.createElement("div");
    row.className = "row";

    const tiles = [];

    for (let colIndex = 0; colIndex < WORD_LENGTH; colIndex += 1) {
      const tile = document.createElement("div");
      tile.className = "tile";
      row.appendChild(tile);
      tiles.push(tile);
    }

    rows.push({ row, tiles });
    boardEl.appendChild(row);
  }
}

function getCurrentRowTiles() {
  return rows[currentRow].tiles;
}

function handleLetter(letter) {
  if (isFinished) return;

  if (currentCol >= WORD_LENGTH) return;

  const tile = getCurrentRowTiles()[currentCol];
  tile.textContent = letter;
  tile.classList.add("filled");
  currentCol += 1;
}

function deleteLetter() {
  if (isFinished) return;

  if (currentCol === 0) return;

  currentCol -= 1;
  const tile = getCurrentRowTiles()[currentCol];
  tile.textContent = "";
  tile.classList.remove("filled");
}

function getCurrentGuess() {
  const tiles = getCurrentRowTiles();
  return tiles.map((tile) => tile.textContent).join("");
}

function evaluateGuess(guess) {
  const result = Array(WORD_LENGTH).fill("absent");
  const remaining = secretWord.split("");

  for (let i = 0; i < WORD_LENGTH; i += 1) {
    if (guess[i] === secretWord[i]) {
      result[i] = "correct";
      remaining[i] = null;
    }
  }

  for (let i = 0; i < WORD_LENGTH; i += 1) {
    if (result[i] === "correct") continue;

    const index = remaining.indexOf(guess[i]);
    if (index !== -1) {
      result[i] = "present";
      remaining[index] = null;
    }
  }

  return result;
}

function revealRow(guess, result) {
  const tiles = getCurrentRowTiles();

  guess.split("").forEach((letter, index) => {
    const tile = tiles[index];
    tile.textContent = letter;
    tile.classList.add(result[index]);
  });
}

function submitGuess() {
  if (isFinished) return;

  if (currentCol < WORD_LENGTH) {
    setMessage("Faltam letras para completar a palavra.", "info");
    return;
  }

  const guess = getCurrentGuess().toUpperCase();

  if (!words.includes(guess)) {
    setMessage("Essa palavra não está na lista de palavras válidas.", "error");
    return;
  }

  const result = evaluateGuess(guess);
  revealRow(guess, result);

  if (guess === secretWord) {
    isFinished = true;
    setMessage(`Parabéns! Você acertou: ${secretWord}`, "success");
    togglePlayAgainButton(currentRow === MAX_ATTEMPTS - 1);
    return;
  }

  if (currentRow === MAX_ATTEMPTS - 1) {
    isFinished = true;
    togglePlayAgainButton(false);
    setMessage(`Você perdeu! A palavra era: ${secretWord}`, "error");
    return;
  }

  currentRow += 1;
  currentCol = 0;
  setMessage("Tente outra palavra.", "info");
}

function handleKeydown(event) {
  const key = event.key.toUpperCase();

  if (/^[A-Z]$/.test(key)) {
    handleLetter(key);
    return;
  }

  if (event.key === "Backspace") {
    deleteLetter();
    return;
  }

  if (event.key === "Enter") {
    submitGuess();
  }
}

function startGame() {
  secretWord = pickRandomWord();
  currentRow = 0;
  currentCol = 0;
  isFinished = false;
  togglePlayAgainButton(false);
  createBoard();
  setMessage("Adivinhe a palavra de 5 letras.", "info");
}

playAgainBtn.addEventListener("click", () => {
  loadWords();
});

loadWords();

document.addEventListener("keydown", handleKeydown);
submitBtn.addEventListener("click", submitGuess);
deleteBtn.addEventListener("click", deleteLetter);
