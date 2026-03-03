const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

/* IMAGES */
const bgImg = new Image();
const nightBgImg = new Image();
nightBgImg.src = "assets/bgm.jpeg";

const pipeImg = new Image();
pipeImg.src = "assets/pipe2-.png";

const coinImg = new Image();
coinImg.src = "assets/koin.png";

const birdSkins = [
  "assets/Flappy-Bird.png",
  "assets/Flappy-Bird2.png",
  "assets/Flappy-Bird3.png",
  "assets/g4-.png",
  "assets/g5.png",
  "assets/g6.png",
];

/* MAP SYSTEM */
const mapSkins = [
  "assets/background.png",
  "assets/map1.jpg",
  "assets/map2.jpg",
  "assets/map3.jpg",
];
const mapPrices = [0, 150, 300, 500];
let currentMapIndex = localStorage.getItem("currentMapIndex")
  ? parseInt(localStorage.getItem("currentMapIndex"))
  : 0;
bgImg.src = mapSkins[currentMapIndex];

let unlockedMaps = localStorage.getItem("unlockedMaps")
  ? JSON.parse(localStorage.getItem("unlockedMaps"))
  : [true, false, false, false];

const skinPrices = [0, 50, 100, 200, 500, 750];
let currentSkinIndex = 0;
let birdImg = new Image();
birdImg.src = birdSkins[currentSkinIndex];

/* SOUNDS */
const bgm = document.getElementById("backgroundMusic");
const soundMenuBg = document.getElementById("soundMenuBg");
const soundFly = document.getElementById("soundFly");
const soundScore = document.getElementById("soundScore");
const soundDie = document.getElementById("soundDie");
const soundMenu = document.getElementById("soundMenu");
const soundCoin = document.getElementById("soundCoin");
const soundBuy = document.getElementById("soundBuy");

bgm.volume = 0.3;
soundMenuBg.volume = 0.4;
soundBuy.volume = 0.6;

/* OPTIONS & MUSIC STATE */
let isMusicOn = localStorage.getItem("musicSetting") === "off" ? false : true;
document.getElementById("musicStatusText").innerText = isMusicOn ? "ON" : "OFF";

/* ========================= */
/* DAY NIGHT SYSTEM SETUP */
/* ========================= */
let isNight = false;
let lastCycleTime = Date.now();
let lastFrameTime = Date.now();
let bgAlpha = 0;
const DAY_DURATION = 10000;
const NIGHT_DURATION = 10000;
const transitionSpeed = 0.5;

/* DYNAMIC RESIZING */
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  bird.x = canvas.width * 0.2;
}
window.addEventListener("resize", resizeCanvas);

/* GAME STATE */
let gameActive = false;
let gameOver = false;
let score = 0;
let coinCount = 0;
let frame = 0;
let isNewBest = false;

let totalKoinSaved = localStorage.getItem("totalKoin")
  ? parseInt(localStorage.getItem("totalKoin"))
  : 0;

let bestScore = localStorage.getItem("bestScore")
  ? parseInt(localStorage.getItem("bestScore"))
  : 0;

let unlockedSkins = localStorage.getItem("unlockedSkins")
  ? JSON.parse(localStorage.getItem("unlockedSkins"))
  : [true, false, false, false, false, false];

/* BIRD */
let bird = {
  x: 80,
  y: 250,
  width: 40,
  height: 30,
  gravity: 0.5,
  jump: -8,
  speed: 0,
};

/* PIPE & COIN */
let pipes = [];
let coins = [];
const pipeWidth = 60;
const pipeGap = 160;
let pipeSpeed = 2.5;
let pipeSpawnDistance = 250;
const coinSize = 26;

/* SKILL SYSTEM */
let skillCooldown = 0;
let skillActiveTimer = 0;
let isInvincible = false;
let isSlowMo = false;
const originalBirdWidth = 40;
const originalBirdHeight = 30;

document.getElementById("totalKoinMenu").innerText = totalKoinSaved;

/* NAVIGATION & UI LOGIC */
function playMenuSound() {
  soundMenu.currentTime = 0;
  soundMenu.play();
}

function showScreen(screenId) {
  playMenuSound();
  document
    .querySelectorAll(".overlay")
    .forEach((el) => el.classList.add("hidden"));
  document.getElementById(screenId).classList.remove("hidden");
  document.getElementById("totalKoinMenu").innerText = totalKoinSaved;

  if (screenId === "charSelect") updateCharUI();
  if (screenId === "mapSelect") updateMapUI();
}

function updateCharUI() {
  birdSkins.forEach((_, index) => {
    const img = document.getElementById(`opt${index}`);
    const priceText = document.getElementById(`price${index}`);
    if (!img || !priceText) return;
    img.classList.toggle("selected", currentSkinIndex === index);
    if (unlockedSkins[index]) {
      priceText.innerText = currentSkinIndex === index ? "DIPAKAI" : "";
      priceText.style.color = "#00ff00";
      img.style.filter = "none";
    } else {
      priceText.innerText = skinPrices[index] + " KOIN";
      priceText.style.color = "#ffd93d";
      img.style.filter = "grayscale(100%)";
    }
  });
}

function updateMapUI() {
  mapSkins.forEach((_, index) => {
    const img = document.getElementById(`mapOpt${index}`);
    const priceText = document.getElementById(`mapPrice${index}`);
    if (!img || !priceText) return;
    img.classList.toggle("selected", currentMapIndex === index);
    if (unlockedMaps[index]) {
      priceText.innerText = currentMapIndex === index ? "DIPAKAI" : "";
      priceText.style.color = "#00ff00";
      img.style.filter = "none";
    } else {
      priceText.innerText = mapPrices[index] + " KOIN";
      priceText.style.color = "#ffd93d";
      img.style.filter = "grayscale(100%)";
    }
  });
}

/* POPUP LOGIC */
function closeConfirm() {
  playMenuSound();
  document.getElementById("confirmPopup").classList.add("hidden");
}

function closeError() {
  playMenuSound();
  document.getElementById("errorPopup").classList.add("hidden");
}

function selectMap(index) {
  if (unlockedMaps[index]) {
    playMenuSound();
    currentMapIndex = index;
    bgImg.src = mapSkins[index];
    bgAlpha = 0;
    isNight = false;
    lastCycleTime = Date.now();
    localStorage.setItem("currentMapIndex", index);
    updateMapUI();
  } else {
    playMenuSound();
    document.getElementById("confirmTitle").innerText = "BELI MAP?";
    document.getElementById("confirmImg").src = mapSkins[index];
    document.getElementById("confirmPriceText").innerText =
      "Harga: " + mapPrices[index] + " Koin";
    document.getElementById("confirmPopup").classList.remove("hidden");

    document.getElementById("confirmBuyBtn").onclick = function () {
      if (totalKoinSaved >= mapPrices[index]) {
        totalKoinSaved -= mapPrices[index];
        unlockedMaps[index] = true;
        localStorage.setItem("totalKoin", totalKoinSaved);
        localStorage.setItem("unlockedMaps", JSON.stringify(unlockedMaps));
        document.getElementById("totalKoinMenu").innerText = totalKoinSaved;
        soundBuy.currentTime = 0;
        soundBuy.play();
        currentMapIndex = index;
        bgImg.src = mapSkins[index];
        bgAlpha = 0;
        isNight = false;
        lastCycleTime = Date.now();
        localStorage.setItem("currentMapIndex", index);
        closeConfirm();
        updateMapUI();
      } else {
        closeConfirm();
        document.getElementById("errorPopup").classList.remove("hidden");
      }
    };
  }
}

function selectBird(index) {
  if (unlockedSkins[index]) {
    playMenuSound();
    currentSkinIndex = index;
    birdImg.src = birdSkins[index];
    updateCharUI();
  } else {
    playMenuSound();
    document.getElementById("confirmTitle").innerText = "BELI KARAKTER?";
    document.getElementById("confirmImg").src = birdSkins[index];
    document.getElementById("confirmPriceText").innerText =
      "Harga: " + skinPrices[index] + " Koin";
    document.getElementById("confirmPopup").classList.remove("hidden");

    document.getElementById("confirmBuyBtn").onclick = function () {
      if (totalKoinSaved >= skinPrices[index]) {
        totalKoinSaved -= skinPrices[index];
        unlockedSkins[index] = true;
        localStorage.setItem("totalKoin", totalKoinSaved);
        localStorage.setItem("unlockedSkins", JSON.stringify(unlockedSkins));
        document.getElementById("totalKoinMenu").innerText = totalKoinSaved;
        soundBuy.currentTime = 0;
        soundBuy.play();
        currentSkinIndex = index;
        birdImg.src = birdSkins[index];
        closeConfirm();
        updateCharUI();
      } else {
        closeConfirm();
        document.getElementById("errorPopup").classList.remove("hidden");
      }
    };
  }
}

function toggleMusic() {
  playMenuSound();
  isMusicOn = !isMusicOn;
  if (isMusicOn) {
    document.getElementById("musicStatusText").innerText = "ON";
    localStorage.setItem("musicSetting", "on");
    if (!gameActive) soundMenuBg.play().catch(() => {});
  } else {
    document.getElementById("musicStatusText").innerText = "OFF";
    localStorage.setItem("musicSetting", "off");
    soundMenuBg.pause();
    bgm.pause();
  }
}

function startGame() {
  playMenuSound();
  soundMenuBg.pause();
  document.getElementById("mainMenu").classList.add("hidden");
  resizeCanvas();

  if (window.innerWidth <= 768) {
    document.getElementById("jumpBtnMobile").style.display = "block";
    if (currentSkinIndex <= 2) {
      document.getElementById("skillBtnMobile").style.display = "block";
    } else {
      document.getElementById("skillBtnMobile").style.display = "none";
    }
  } else {
    document.getElementById("jumpBtnMobile").style.display = "none";
    document.getElementById("skillBtnMobile").style.display = "none";
  }

  gameActive = true;
  gameOver = false;
  lastCycleTime = Date.now();
  lastFrameTime = Date.now();
  resetGameStats();
  if (isMusicOn) {
    bgm.currentTime = 0;
    bgm.play().catch(() => {});
  }
}

function backToMenu() {
  playMenuSound();
  gameActive = false;
  gameOver = false;
  bgm.pause();
  document.getElementById("jumpBtnMobile").style.display = "none";
  document.getElementById("skillBtnMobile").style.display = "none";
  document.getElementById("gameOverPopup").classList.add("hidden");

  // Kembalikan tombol skill mobile ke tampilan semula
  let skillBtn = document.getElementById("skillBtnMobile");
  skillBtn.innerText = "SKILL";
  skillBtn.style.background = "linear-gradient(145deg, #ff4d4d, #cc0000)";
  skillBtn.style.boxShadow = "0 6px 0 #800000, 0 12px 25px rgba(0, 0, 0, 0.4)";

  if (isMusicOn) soundMenuBg.play().catch(() => {});
  showScreen("mainMenu");
}

function control() {
  if (!gameActive || gameOver) return;
  bird.speed = bird.jump;
  soundFly.currentTime = 0;
  soundFly.play();
}

function activateSkill() {
  if (!gameActive || gameOver || skillCooldown > 0 || currentSkinIndex > 2)
    return;

  if (currentSkinIndex === 0) {
    isInvincible = true;
    skillActiveTimer = 180;
    skillCooldown = 600;
  } else if (currentSkinIndex === 1) {
    bird.width = 20;
    bird.height = 15;
    skillActiveTimer = 300;
    skillCooldown = 600;
  } else if (currentSkinIndex === 2) {
    isSlowMo = true;
    skillActiveTimer = 240;
    skillCooldown = 900;
  }
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    if (!gameActive && !gameOver && isMusicOn && soundMenuBg.paused) {
      soundMenuBg.play().catch(() => {});
    }
    control();
  }
  if (e.code === "KeyQ") {
    activateSkill();
  }
});

canvas.addEventListener("click", () => {
  if (!gameActive && !gameOver && isMusicOn && soundMenuBg.paused) {
    soundMenuBg.play().catch(() => {});
  }
  if (gameActive && !gameOver) control();
});

canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  if (gameActive && !gameOver) {
    activateSkill();
  }
});

document.getElementById("jumpBtnMobile").addEventListener("touchstart", (e) => {
  e.preventDefault();
  control();
});

document
  .getElementById("skillBtnMobile")
  .addEventListener("touchstart", (e) => {
    e.preventDefault();
    activateSkill();
  });

function spawnCoin(pipeX, gapTop, gapBottom) {
  if (Math.random() > 0.6) return;
  let centerGap = gapTop + (gapBottom - gapTop) / 2;
  let coinY = centerGap - coinSize / 2;
  coins.push({
    x: pipeX + pipeWidth / 2 - coinSize / 2,
    y: coinY,
    collected: false,
    angle: 0,
    scale: 1,
  });
}

function createPipe() {
  let minH = 50;
  let maxH = canvas.height - pipeGap - minH;
  let topH = Math.floor(Math.random() * (maxH - minH) + minH);

  let isMoving = false;
  let moveDir = Math.random() > 0.5 ? 1 : -1;
  let moveSpeed = 1.5;
  let moveRange = 80;

  let minTop = Math.max(minH, topH - moveRange);
  let maxTop = Math.min(maxH, topH + moveRange);

  if (score >= 5 && Math.random() > 0.5) {
    isMoving = true;
  }

  pipes.push({
    x: canvas.width,
    top: topH,
    bottom: canvas.height - topH - pipeGap,
    passed: false,
    isMoving: isMoving,
    moveDir: moveDir,
    moveSpeed: moveSpeed,
    minTop: minTop,
    maxTop: maxTop,
  });
  spawnCoin(canvas.width, topH, topH + pipeGap);
}

function update() {
  if (!gameActive || gameOver) return;
  let now = Date.now();
  let deltaTime = (now - lastFrameTime) / 1000;
  lastFrameTime = now;

  if (currentMapIndex === 0) {
    if (!isNight && now - lastCycleTime >= DAY_DURATION) {
      isNight = true;
      lastCycleTime = now;
    } else if (isNight && now - lastCycleTime >= NIGHT_DURATION) {
      isNight = false;
      lastCycleTime = now;
    }
    if (isNight) {
      bgAlpha += transitionSpeed * deltaTime;
      if (bgAlpha > 1) bgAlpha = 1;
    } else {
      bgAlpha -= transitionSpeed * deltaTime;
      if (bgAlpha < 0) bgAlpha = 0;
    }
  } else {
    bgAlpha = 0;
  }

  /* UPDATE SKILL TIMER & COOLDOWN */
  if (skillActiveTimer > 0) {
    skillActiveTimer--;
    if (skillActiveTimer === 0) {
      isInvincible = false;
      isSlowMo = false;
      bird.width = originalBirdWidth;
      bird.height = originalBirdHeight;
    }
  }
  if (skillCooldown > 0) {
    skillCooldown--;
  }

  bird.speed += bird.gravity;
  bird.y += bird.speed;
  if (bird.y < 0 || bird.y + bird.height > canvas.height) endGame();

  pipeSpeed = isSlowMo ? 1.25 : 2.5;

  if (pipeSpawnDistance >= 250) {
    createPipe();
    pipeSpawnDistance -= 250;
  }
  pipeSpawnDistance += pipeSpeed;

  pipes.forEach((pipe) => {
    pipe.x -= pipeSpeed;

    if (pipe.isMoving) {
      let currentMoveSpeed = isSlowMo ? pipe.moveSpeed * 0.5 : pipe.moveSpeed;
      pipe.top += pipe.moveDir * currentMoveSpeed;
      pipe.bottom = canvas.height - pipe.top - pipeGap;

      if (pipe.top >= pipe.maxTop) {
        pipe.top = pipe.maxTop;
        pipe.moveDir = -1;
      } else if (pipe.top <= pipe.minTop) {
        pipe.top = pipe.minTop;
        pipe.moveDir = 1;
      }
    }

    if (!pipe.passed && pipe.x + pipeWidth < bird.x) {
      score++;
      pipe.passed = true;
      soundScore.currentTime = 0;
      soundScore.play();
      if (score > bestScore) {
        bestScore = score;
        isNewBest = true;
        localStorage.setItem("bestScore", bestScore);
      }
    }

    if (
      !isInvincible &&
      bird.x < pipe.x + pipeWidth &&
      bird.x + bird.width > pipe.x &&
      (bird.y < pipe.top || bird.y + bird.height > canvas.height - pipe.bottom)
    ) {
      endGame();
    }
  });

  coins.forEach((coin) => {
    coin.x -= pipeSpeed;

    let coinAnimSpeed = isSlowMo ? 0.05 : 0.1;
    coin.angle += coinAnimSpeed;
    coin.scale = Math.sin(coin.angle) * 0.3 + 0.7;

    if (
      !coin.collected &&
      bird.x < coin.x + coinSize &&
      bird.x + bird.width > coin.x &&
      bird.y < coin.y + coinSize &&
      bird.y + bird.height > coin.y
    ) {
      coin.collected = true;
      coinCount++;
      totalKoinSaved++;
      localStorage.setItem("totalKoin", totalKoinSaved);
      soundCoin.currentTime = 0;
      soundCoin.play();
    }
  });

  pipes = pipes.filter((p) => p.x + pipeWidth > 0);
  coins = coins.filter((c) => !c.collected && c.x + coinSize > 0);
  frame++;
}

function draw() {
  ctx.globalAlpha = 1;
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
  if (bgAlpha > 0) {
    ctx.globalAlpha = bgAlpha;
    ctx.drawImage(nightBgImg, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
  }
  pipes.forEach((pipe) => {
    ctx.save();
    ctx.translate(pipe.x + pipeWidth / 2, pipe.top / 2);
    ctx.scale(1, -1);
    ctx.drawImage(pipeImg, -pipeWidth / 2, -pipe.top / 2, pipeWidth, pipe.top);
    ctx.restore();
    ctx.drawImage(
      pipeImg,
      pipe.x,
      canvas.height - pipe.bottom,
      pipeWidth,
      pipe.bottom,
    );
  });
  coins.forEach((coin) => {
    ctx.save();
    ctx.translate(coin.x + coinSize / 2, coin.y + coinSize / 2);
    ctx.scale(coin.scale, 1);
    ctx.drawImage(coinImg, -coinSize / 2, -coinSize / 2, coinSize, coinSize);
    ctx.restore();
  });

  if (isInvincible && frame % 10 < 5) {
    ctx.globalAlpha = 0.5;
  } else {
    ctx.globalAlpha = 1;
  }
  ctx.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
  ctx.globalAlpha = 1;

  if (gameActive) {
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 4;
    ctx.font = "10px 'Press Start 2P'";
    ctx.fillStyle = "#e3c505";
    ctx.textAlign = "left";
    ctx.strokeText("BEST SCORE:" + bestScore, 15, 30);
    ctx.fillText("BEST SCORE:" + bestScore, 15, 30);
    ctx.fillStyle = "#fff";
    ctx.strokeText("COIN: " + coinCount, 15, 50);
    ctx.fillText("COIN: " + coinCount, 15, 50);

    let fontSize = score > 99 ? "15px" : "25px";
    ctx.font = fontSize + " 'Press Start 2P'";
    ctx.textAlign = "center";
    ctx.strokeText(score, canvas.width / 2, 70);
    ctx.fillText(score, canvas.width / 2, 70);
    if (isNewBest) {
      ctx.font = "10px 'Press Start 2P'";
      ctx.fillStyle = "#00ff00";
      ctx.strokeText("NEW BEST SCORE!", canvas.width / 2, 100);
      ctx.fillText("NEW BEST SCORE!", canvas.width / 2, 100);
    }
    ctx.textAlign = "left"; // Reset

    // ==========================================
    // TAMPILAN STATUS SKILL (Desktop & Mobile)
    // ==========================================
    if (currentSkinIndex <= 2) {
      let cdSeconds = Math.ceil(skillCooldown / 60);

      // Update Tombol Mobile Kiri Bawah
      let skillBtn = document.getElementById("skillBtnMobile");
      if (skillBtn.style.display !== "none") {
        if (skillCooldown > 0) {
          skillBtn.innerText = cdSeconds + "s";
          skillBtn.style.background = "#555"; // Warna abu-abu saat CD
          skillBtn.style.boxShadow =
            "0 6px 0 #333, 0 12px 25px rgba(0, 0, 0, 0.4)";
        } else if (skillActiveTimer > 0) {
          skillBtn.innerText = "ACT";
          skillBtn.style.background = "#ffd93d"; // Warna emas saat aktif
          skillBtn.style.boxShadow =
            "0 6px 0 #cc9400, 0 12px 25px rgba(0, 0, 0, 0.4)";
        } else {
          skillBtn.innerText = "SKILL";
          skillBtn.style.background =
            "linear-gradient(145deg, #ff4d4d, #cc0000)"; // Merah saat Ready
          skillBtn.style.boxShadow =
            "0 6px 0 #800000, 0 12px 25px rgba(0, 0, 0, 0.4)";
        }
      }

      // Draw Overlay UI di Desktop (Tengah Bawah ala MOBA)
      if (window.innerWidth > 768) {
        let iconSize = 55;
        let iconX = canvas.width / 2 - iconSize / 2;
        let iconY = canvas.height - iconSize - 20;

        // Background Kotak Icon
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(iconX, iconY, iconSize, iconSize);

        // Gambar Wajah Burung di dalam kotak
        ctx.drawImage(
          birdImg,
          iconX + 8,
          iconY + 15,
          iconSize - 16,
          iconSize - 26,
        );

        // Frame Border (Hijau: Ready, Emas: Aktif, Abu-abu: CD)
        ctx.lineWidth = 3;
        if (skillCooldown > 0) {
          ctx.strokeStyle = "#555";
        } else if (skillActiveTimer > 0) {
          ctx.strokeStyle = "#ffd93d";
        } else {
          ctx.strokeStyle = "#00ff00";
        }
        ctx.strokeRect(iconX, iconY, iconSize, iconSize);

        // Overlay Gelap & Angka Hitung Mundur saat Cooldown
        if (skillCooldown > 0) {
          ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; // Lapisan gelap transparan
          ctx.fillRect(iconX, iconY, iconSize, iconSize);

          ctx.fillStyle = "#fff";
          ctx.font = "18px 'Press Start 2P'";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle"; // Posisi teks persis di tengah
          ctx.fillText(
            cdSeconds,
            iconX + iconSize / 2,
            iconY + iconSize / 2 + 2,
          );
          ctx.textBaseline = "alphabetic"; // Reset
        }
        ctx.textAlign = "left"; // Reset
      }
    }
  }
}

function endGame() {
  gameOver = true;
  bgm.pause();
  soundDie.play();
  document.getElementById("finalScore").innerText = score;
  document.getElementById("finalCoin").innerText = coinCount;
  document.getElementById("gameOverPopup").classList.remove("hidden");
}

function resetGameStats() {
  bird.y = canvas.height / 2;
  bird.speed = 0;
  pipes = [];
  coins = [];
  score = 0;
  coinCount = 0;
  frame = 0;
  isNewBest = false;

  skillCooldown = 0;
  skillActiveTimer = 0;
  isInvincible = false;
  isSlowMo = false;
  bird.width = originalBirdWidth;
  bird.height = originalBirdHeight;

  pipeSpawnDistance = 250;
}

document.getElementById("retryBtn").addEventListener("click", () => {
  playMenuSound();
  document.getElementById("gameOverPopup").classList.add("hidden");

  let skillBtn = document.getElementById("skillBtnMobile");
  skillBtn.innerText = "SKILL";
  skillBtn.style.background = "linear-gradient(145deg, #ff4d4d, #cc0000)";
  skillBtn.style.boxShadow = "0 6px 0 #800000, 0 12px 25px rgba(0, 0, 0, 0.4)";

  startGame();
});

resizeCanvas();
updateCharUI();
updateMapUI();

window.addEventListener("load", () => {
  if (isMusicOn) soundMenuBg.play().catch(() => {});
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
gameLoop();
