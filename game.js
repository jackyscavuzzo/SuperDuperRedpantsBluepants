// Get our drawing canvas ready
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Create our player (this will be our character)
const player = {
  x: 100, // position from left
  y: 200, // position from top
  width: 50,
  height: 50,
  speed: 8,
  jumping: false,
  jumpPower: -15,
  gravity: 0.5,
  velocityY: 0,
  health: 100,
};

// Add these at the top of your file to track key states
const keys = {
  left: false,
  right: false,
};

// Add these new variables at the top
let wave = 1;
let baseEnemySpeed = 0.8;
let gameOver = false;
let score = 0; // Let's add a score too! It goes up the longer you survive
let lives = 3; // Add this new line
let scoreSubmitted = false;

// Add with other global variables
let projectiles = [];
const PROJECTILE_SPEED = 7;
const PROJECTILE_SIZE = 5;

// Add this after the player object:
const enemies = [
  {
    x: 300,
    y: canvas.height - 30,
    width: 30,
    height: 30,
    speed: 0.8, // Slower speed (was 2)
  },
  {
    x: 500,
    y: canvas.height - 30,
    width: 30,
    height: 30,
    speed: 0.5, // Even slower (was 1.5)
  },
  {
    x: 700,
    y: canvas.height - 30,
    width: 30,
    height: 30,
    speed: 0.5,
  },
  {
    x: 900,
    y: canvas.height - 30,
    width: 30,
    height: 30,
    speed: 0.5,
  },
];

const boss = {
  x: canvas.width / 2,
  y: canvas.height - 50,
  width: 50,
  height: 50,
  speed: 2,
  health: 3,
  active: false,
  spawnTimer: 0,
  lastSpawnTime: 0,
};

function spawnBossMinions() {
  if (boss.active && Date.now() - boss.lastSpawnTime > 3000) {
    // Spawn every 3 seconds
    enemies.push({
      x: boss.x,
      y: boss.y,
      width: 30,
      height: 30,
      speed: baseEnemySpeed * 1.2,
    });
    boss.lastSpawnTime = Date.now();
  }
}

// Add this new function to check if player hits an enemy
function checkCollision(player, enemy) {
  return (
    player.x < enemy.x + enemy.width &&
    player.x + player.width > enemy.x &&
    player.y < enemy.y + enemy.height &&
    player.y + player.height > enemy.y
  );
}

// Add this function to check if player is above enemy
function isJumpingOnEnemy(player, enemy) {
  return (
    player.y + player.height <= enemy.y + 10 && // Player is mostly above enemy
    player.velocityY > 0 && // Player is moving downward
    player.x < enemy.x + enemy.width &&
    player.x + player.width > enemy.x
  );
}

// Add this new function to reset the game
function resetGame() {
  player.x = 100;
  player.y = 200;
  player.velocityY = 0;

  // Reset wave and enemies
  wave = 1;
  enemies.length = 0;
  enemies.push(
    {
      x: 300,
      y: canvas.height - 30,
      width: 30,
      height: 30,
      speed: baseEnemySpeed,
    },
    {
      x: 500,
      y: canvas.height - 30,
      width: 30,
      height: 30,
      speed: baseEnemySpeed * 0.8,
    }
  );

  gameOver = false;
  score = 0;
  lives = 3;
  boss.active = false;
  boss.health = 3;
  boss.lastSpawnTime = 0;
  projectiles = []; // Clear projectiles
}

function spawnNewWave() {
  wave++;

  // Check if it's boss wave (wave 10)
  if (wave === 10) {
    enemies.length = 0;
    boss.active = true;
    boss.health = 3;
    boss.x = canvas.width / 2;
    return;
  }

  // Regular wave logic
  let newSpeed = baseEnemySpeed + wave * 0.2;
  const numEnemies = wave + 1;
  enemies.length = 0;

  for (let i = 0; i < numEnemies; i++) {
    const spacing = canvas.width / (numEnemies + 1);
    enemies.push({
      x: spacing * (i + 1),
      y: canvas.height - 30,
      width: 30,
      height: 30,
      speed: newSpeed * (0.8 + Math.random() * 0.4),
    });
  }
}
// Listen for keyboard buttons
document.addEventListener("keydown", function (event) {
  // Move right with right arrow
  if (event.key === "ArrowRight") {
    keys.right = true;
  }
  // Move left with left arrow
  if (event.key === "ArrowLeft") {
    keys.left = true;
  }
  // Jump with spacebar
  if (event.key === " ") {
    player.velocityY = player.jumpPower;
  }
  // Shoot with up arrow
  if (event.key === "ArrowUp") {
    shootProjectile();
  }

  if (gameOver) {
    resetGame();
    return;
  }
});
// Add this new event listener for key releases
document.addEventListener("keyup", function (event) {
  // Set key state to false when released
  if (event.key === "ArrowRight") {
    keys.right = false;
  }
  if (event.key === "ArrowLeft") {
    keys.left = false;
  }
});

// This function runs the game
function gameLoop() {
  // Update score if game is running
  if (!gameOver) {
    score++;
  }
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!gameOver) {
    // Move player based on key states
    if (keys.right) {
      player.x += player.speed;
    }
    if (keys.left) {
      player.x -= player.speed;
    }

    // Keep player in bounds
    if (player.x > canvas.width - player.width) {
      player.x = canvas.width - player.width;
    }
    if (player.x < 0) {
      player.x = 0;
    }

    // Apply gravity
    player.velocityY += player.gravity;
    player.y += player.velocityY;

    // Stop at bottom of screen
    if (player.y > canvas.height - player.height) {
      player.y = canvas.height - player.height;
      player.jumping = false;
      player.velocityY = 0;
    }

    // Move and draw enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      let enemy = enemies[i];

      // Move enemy towards player (only left/right)
      let dx = player.x - enemy.x;
      if (dx > 0) {
        enemy.x += enemy.speed;
      } else {
        enemy.x -= enemy.speed;
      }

      // Keep enemies inside the box
      if (enemy.x >= canvas.width - enemy.width) {
        enemy.x = canvas.width - enemy.width;
      }
      if (enemy.x <= 0) {
        enemy.x = 0;
      }

      // Draw enemy
      ctx.fillStyle = "red";
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

      // Check collisions
      if (checkCollision(player, enemy)) {
        if (isJumpingOnEnemy(player, enemy)) {
          // Player jumped on enemy
          enemies.splice(i, 1);
          player.velocityY = player.jumpPower / 1.5;
          score += 10000000;

          // Check if all enemies are defeated
          if (enemies.length === 0) {
            spawnNewWave();
            // Show wave number
            ctx.fillStyle = "black";
            ctx.font = "40px Arial";
            ctx.textAlign = "center";
            ctx.fillText(
              "Wave " + wave + "!",
              canvas.width / 2,
              canvas.height / 2
            );
          }
        } else {
          handlePlayerHit();
        }
      }
    }

    // Boss logic
    if (boss.active) {
      // Move boss towards player
      if (player.x > boss.x) {
        boss.x += boss.speed;
      } else {
        boss.x -= boss.speed;
      }

      // Spawn minions
      spawnBossMinions();

      // Draw boss
      ctx.fillStyle = "purple";
      ctx.fillRect(boss.x, boss.y, boss.width, boss.height);

      // Draw boss health
      ctx.fillStyle = "red";
      ctx.fillRect(boss.x, boss.y - 20, (boss.width * boss.health) / 3, 10);

      // Check boss collision
      if (boss.active && checkCollision(player, boss)) {
        if (isJumpingOnEnemy(player, boss)) {
          boss.health--;
          player.velocityY = player.jumpPower / 1.5;
          score += 200;

          if (boss.health <= 0) {
            boss.active = false;
            score += 1000000000;
            spawnNewWave();
          }
        } else {
          handlePlayerHit();
        }
      }
    }

    // Draw player (blue square)
    ctx.fillStyle = "blue";
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Draw score
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + Math.floor(score / 10), 10, 30);

    // Draw wave number in corner
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Wave: " + wave, 10, 60);

    // Update and draw projectiles
    updateAndDrawProjectiles();
  } else {
    // Draw Game Over screen
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; // Semi-transparent black
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";

    // Draw Game Over text
    ctx.fillText("GAME OVER!", canvas.width / 2, canvas.height / 2 - 40);

    // Draw final score
    ctx.font = "32px Arial";
    ctx.fillText(
      "Score: " + Math.floor(score / 10),
      canvas.width / 2,
      canvas.height / 2 + 10
    );

    // Draw restart instruction
    ctx.font = "24px Arial";
    ctx.fillText(
      "Press any key to restart",
      canvas.width / 2,
      canvas.height / 2 + 50
    );

    if (!scoreSubmitted) {
      const playerName = prompt("Enter your name:"); // Prompt for player name
      submitScore(playerName, Math.floor(score / 10)); // Submit the score
      scoreSubmitted = true; // Ensure score is submitted only once
    }
  }

  // Keep running the game
  requestAnimationFrame(gameLoop);
} // Start the game!
gameLoop();

function handlePlayerHit() {
  lives--;
  if (lives <= 0) {
    gameOver = true;
    const playerName = prompt("Enter your name:"); // Prompt for player name
    submitScore(playerName, Math.floor(score / 10)); // Submit the score
  } else {
    // Reset player position but keep score and wave
    player.x = 100;
    player.y = 200;
    player.velocityY = 0;
  }
}

// Add this to your game loop where you draw score or other UI elements
function drawUI() {
  // Draw score
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${score}`, canvas.width - 150, 30);

  // Draw hearts in top right corner
  const heartSize = 15;
  const heartSpacing = 25;
  const startX = canvas.width - (heartSize + heartSpacing);
  for (let i = 0; i < lives; i++) {
    drawHeart(startX + i * heartSpacing, 10, heartSize);
  }
}

// Add this function to draw a heart symbol
function drawHeart(x, y, size) {
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = "red";

  // Move to top center of heart
  ctx.moveTo(x, y + size * 0.3);

  // Left curve
  ctx.bezierCurveTo(
    x - size * 0.5,
    y - size * 0.3, // Control point 1
    x - size,
    y + size * 0.3, // Control point 2
    x,
    y + size // End point
  );

  // Right curve
  ctx.bezierCurveTo(
    x + size,
    y + size * 0.3, // Control point 1
    x + size * 0.5,
    y - size * 0.3, // Control point 2
    x,
    y + size * 0.3 // End point
  );

  ctx.fill();
  ctx.restore();
}

function shootProjectile() {
  projectiles.push({
    x: player.x + player.width / 2,
    y: player.y + player.height,
    size: PROJECTILE_SIZE,
    velocityY: PROJECTILE_SPEED,
  });
}

function updateAndDrawProjectiles() {
  // Update and draw projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const projectile = projectiles[i];
    projectile.y += projectile.velocityY;

    // Remove projectiles that are off screen
    if (projectile.y < 0) {
      projectiles.splice(i, 1);
      continue;
    }

    // Draw projectile
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
    ctx.fill();

    // Check collisions with enemies
    for (let j = enemies.length - 1; j >= 0; j--) {
      const enemy = enemies[j];
      if (
        projectile.x > enemy.x &&
        projectile.x < enemy.x + enemy.width &&
        projectile.y > enemy.y &&
        projectile.y < enemy.y + enemy.height
      ) {
        enemies.splice(j, 1);
        projectiles.splice(i, 1);
        score += 50;
        if (enemies.length === 0) {
          spawnNewWave();
        }
        break;
      }
    }

    // Check collision with boss
    if (
      boss.active &&
      projectile.x > boss.x &&
      projectile.x < boss.x + boss.width &&
      projectile.y > boss.y &&
      projectile.y < boss.y + boss.height
    ) {
      boss.health--;
      projectiles.splice(i, 1);
      score += 200;

      if (boss.health <= 0) {
        boss.active = false;
        score += 1000;
        spawnNewWave();
      }
    }
  }
}
function shootProjectile() {
  const spread = 10; // Horizontal spread between projectiles
  const numProjectiles = 10; // Number of projectiles to shoot
  for (let i = 0; i < numProjectiles; i++) {
    projectiles.push({
      x:
        player.x +
        player.width / 2 -
        (spread * (numProjectiles - 1)) / 2 +
        i * spread,
      y: player.y,
      size: PROJECTILE_SIZE,
      velocityY: +PROJECTILE_SPEED,
    });
  }
}
function spawnNewWave() {
  wave++;

  // Check if it's wave 50
  if (wave === 50) {
    enemies.length = 0; // Clear existing enemies
    for (let i = 0; i < 1000; i++) {
      enemies.push({
        x: Math.random() * (canvas.width - 50), // Random x position
        y: canvas.height - 50,
        width: 50,
        height: 50,
        speed: 2,
        health: 3,
        isBoss: true, // Mark as boss
      });
    }
    return;
  }

  // Regular wave logic
  let newSpeed = baseEnemySpeed + wave * 0.2;
  const numEnemies = wave + 1;
  enemies.length = 0;

  for (let i = 0; i < numEnemies; i++) {
    const spacing = canvas.width / (numEnemies + 1);
    enemies.push({
      x: spacing * (i + 1),
      y: canvas.height - 30,
      width: 30,
      height: 30,
      speed: newSpeed * (0.8 + Math.random() * 0.4),
    });
  }
}

async function submitScore(playerName, score) {
  try {
    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbwj40sI4GUqq_p-FcxDkD9s-rQv-vymSQF9M3Bi7YoA2TiSeGWGOKtrd2DGcXqVUHBjzg/exec",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerName, score }),
        mode: "no-cors",
      }
    );

    const result = await response.json();
    console.log("Score submitted:", result);
  } catch (error) {
    console.error("Error submitting score:", error);
  }
}
