const STORE_KEY = "studySpaceState_v1";

const defaultState = {
  credits: 0,
  completedSessions: 0,
  unlockedBody: ["standard"],
  unlockedThruster: ["blue"],
  selectedBody: "standard",
  selectedThruster: "blue",
  lastSession: null,
};

const bodyOptions = [
  { id: "standard", name: "標準機身", cost: 0, description: "穩定基礎飛船。" },
  { id: "titanium", name: "鈦合金殼", cost: 40, description: "堅固外觀，反射光澤強。" },
  { id: "nebula", name: "星雲紋理", cost: 70, description: "太空雲霧般的材質。" },
];

const thrusterOptions = [
  { id: "blue", name: "藍色熱浪", cost: 0, description: "標準冷光尾焰。" },
  { id: "purple", name: "紫電光束", cost: 30, description: "能量脈衝尾焰。" },
  { id: "solar", name: "太陽耀斑", cost: 55, description: "熾熱亮光，飛行更耀眼。" },
];

let state = loadState();
let timer = null;
let timeRemaining = 25 * 60;
let isRunning = false;

const creditValue = document.getElementById("creditValue");
const completedSessions = document.getElementById("completedSessions");
const timerMinutes = document.getElementById("timerMinutes");
const timerSeconds = document.getElementById("timerSeconds");
const startButton = document.getElementById("startButton");
const pauseButton = document.getElementById("pauseButton");
const resetButton = document.getElementById("resetButton");
const durationButtons = document.querySelectorAll(".duration");
const flightMessage = document.getElementById("flightMessage");
const bodyOptionsContainer = document.getElementById("bodyOptions");
const thrusterOptionsContainer = document.getElementById("thrusterOptions");
const shipBody = document.getElementById("shipBody");
const shipThruster = document.getElementById("shipThruster");
const currentBodyName = document.getElementById("currentBodyName");
const currentThrusterName = document.getElementById("currentThrusterName");
const storageStatus = document.getElementById("storageStatus");

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { ...defaultState };
    const parsed = JSON.parse(raw);
    return { ...defaultState, ...parsed };
  } catch (err) {
    console.warn("載入本地資料失敗", err);
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
  storageStatus.textContent = "已儲存";
}

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return { m, s };
}

function updateTimerDisplay() {
  const formatted = formatTime(timeRemaining);
  timerMinutes.textContent = formatted.m;
  timerSeconds.textContent = formatted.s;
}

function setDuration(minutes) {
  timeRemaining = minutes * 60;
  updateTimerDisplay();
  durationButtons.forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.minutes) === minutes);
  });
  localStorage.setItem("studySpaceDuration", minutes);
}

function updateStatusPanels() {
  creditValue.textContent = state.credits;
  completedSessions.textContent = state.completedSessions;
}

function updateShipPreview() {
  const body = bodyOptions.find((option) => option.id === state.selectedBody);
  const thruster = thrusterOptions.find((option) => option.id === state.selectedThruster);
  currentBodyName.textContent = body ? body.name : "標準機身";
  currentThrusterName.textContent = thruster ? thruster.name : "藍色熱浪";

  shipBody.style.background = {
    standard: "linear-gradient(135deg, rgba(65, 89, 220, 0.95), rgba(26, 31, 64, 0.95))",
    titanium: "linear-gradient(135deg, rgba(183, 189, 211, 1), rgba(88, 96, 130, 1))",
    nebula: "linear-gradient(135deg, rgba(133, 64, 255, 0.98), rgba(26, 31, 64, 0.95))",
  }[state.selectedBody] || "linear-gradient(135deg, rgba(65, 89, 220, 0.95), rgba(26, 31, 64, 0.95))";

  const thrusterGlow = {
    blue: "0 0 42px rgba(77,212,255,0.5)",
    purple: "0 0 50px rgba(179, 84, 255, 0.5)",
    solar: "0 0 56px rgba(255, 172, 58,0.65)",
  }[state.selectedThruster];

  shipThruster.style.boxShadow = `${thrusterGlow}, inset 0 0 22px rgba(255,255,255,0.12)`;
  shipThruster.style.background = {
    blue: "linear-gradient(180deg, rgba(126, 235, 255, 0.95), rgba(14, 36, 70, 0.95))",
    purple: "linear-gradient(180deg, rgba(187, 114, 255, 0.9), rgba(10, 14, 42, 0.95))",
    solar: "linear-gradient(180deg, rgba(255, 202, 120, 0.92), rgba(40, 22, 18, 0.95))",
  }[state.selectedThruster] || "linear-gradient(180deg, rgba(126, 235, 255, 0.95), rgba(14, 36, 70, 0.95))";
}

function renderShopItems() {
  bodyOptionsContainer.innerHTML = "";
  thrusterOptionsContainer.innerHTML = "";

  bodyOptions.forEach((option) => {
    const unlocked = state.unlockedBody.includes(option.id);
    const isSelected = state.selectedBody === option.id;
    bodyOptionsContainer.appendChild(createShopItem(option, unlocked, isSelected, "body"));
  });

  thrusterOptions.forEach((option) => {
    const unlocked = state.unlockedThruster.includes(option.id);
    const isSelected = state.selectedThruster === option.id;
    thrusterOptionsContainer.appendChild(createShopItem(option, unlocked, isSelected, "thruster"));
  });
}

function createShopItem(option, unlocked, selected, type) {
  const item = document.createElement("div");
  item.className = "shop-item";
  const info = document.createElement("div");
  info.className = "item-info";
  info.innerHTML = `<span class="item-name">${option.name}</span><span class="item-cost">${option.description}</span>`;
  const button = document.createElement("button");
  if (selected) {
    button.textContent = "已選擇";
    button.className = "select";
    button.disabled = true;
  } else if (unlocked) {
    button.textContent = "選擇";
    button.addEventListener("click", () => selectItem(type, option.id));
  } else {
    button.textContent = `解鎖 ${option.cost}`;
    button.className = "unlock";
    button.addEventListener("click", () => purchaseItem(type, option.id));
  }
  item.appendChild(info);
  item.appendChild(button);
  return item;
}

function purchaseItem(type, id) {
  const optionList = type === "body" ? bodyOptions : thrusterOptions;
  const option = optionList.find((item) => item.id === id);
  if (!option) return;
  if (state.credits < option.cost) {
    flightMessage.textContent = `CREDITS 不足，還需要 ${option.cost - state.credits} 點。`;
    return;
  }
  state.credits -= option.cost;
  if (type === "body") {
    state.unlockedBody.push(option.id);
    state.selectedBody = option.id;
  } else {
    state.unlockedThruster.push(option.id);
    state.selectedThruster = option.id;
  }
  flightMessage.textContent = `成功解鎖 ${option.name}，已更新飛船配置。`;
  saveState();
  updateStatusPanels();
  renderShopItems();
  updateShipPreview();
}

function selectItem(type, id) {
  if (type === "body") {
    state.selectedBody = id;
  } else {
    state.selectedThruster = id;
  }
  flightMessage.textContent = `已套用新 ${type === "body" ? "船體" : "尾焰"} 配置。`;
  saveState();
  renderShopItems();
  updateShipPreview();
}

function tick() {
  if (timeRemaining <= 0) {
    completeFocusSession();
    return;
  }
  timeRemaining -= 1;
  updateTimerDisplay();
}

function completeFocusSession() {
  clearInterval(timer);
  isRunning = false;
  timer = null;
  startButton.textContent = "開始";
  pauseButton.disabled = true;
  const minutes = Math.floor((durationButtons.find((button) => button.classList.contains("active")).dataset.minutes) ?? 25);
  const reward = Math.max(5, Math.round(minutes * 1.8));
  state.credits += reward;
  state.completedSessions += 1;
  state.lastSession = { earned: reward, duration: minutes, finishedAt: new Date().toISOString() };
  flightMessage.textContent = `恭喜完成 ${minutes} 分飛行任務，獲得 ${reward} CREDITS！`;
  saveState();
  updateStatusPanels();
  renderShopItems();
}

function startTimer() {
  if (isRunning) return;
  if (timeRemaining <= 0) {
    setDuration(25);
  }
  timer = setInterval(tick, 1000);
  isRunning = true;
  startButton.textContent = "繼續";
  pauseButton.disabled = false;
  flightMessage.textContent = "艙門已關閉，飛行中...保持專注。";
}

function pauseTimer() {
  if (!isRunning) return;
  clearInterval(timer);
  isRunning = false;
  startButton.textContent = "開始";
  pauseButton.disabled = true;
  flightMessage.textContent = "已暫停任務，隨時可繼續。";
}

function resetTimer() {
  clearInterval(timer);
  isRunning = false;
  timer = null;
  setDuration(25);
  startButton.textContent = "開始";
  pauseButton.disabled = true;
  flightMessage.textContent = "計時器重置，準備好再次啟航。";
}

startButton.addEventListener("click", startTimer);
pauseButton.addEventListener("click", pauseTimer);
resetButton.addEventListener("click", resetTimer);

durationButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const minutes = Number(button.dataset.minutes);
    setDuration(minutes);
    if (isRunning) {
      clearInterval(timer);
      isRunning = false;
      startButton.textContent = "開始";
      pauseButton.disabled = true;
    }
  });
});

function init() {
  updateStatusPanels();
  updateShipPreview();
  renderShopItems();
  const savedDuration = Number(localStorage.getItem("studySpaceDuration")) || 25;
  setDuration(savedDuration);
  storageStatus.textContent = "已儲存";
}

window.addEventListener("beforeunload", saveState);

init();
