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
};

// Add these at the top of your file to track key states
const keys = {
  left: false,
  right: false,
};

// Add these new variables at the top
let wave = 1;
let baseEnemySpeed = 0.8;

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
];

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

// Add this at the top with other variables
let gameOver = false;
let score = 0; // Let's add a score too! It goes up the longer you survive

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
}

// Add this function to create new enemies
function spawnNewWave() {
  wave++;
  // Increase speed slightly with each wave
  let newSpeed = baseEnemySpeed + wave * 0.2;

  enemies.push(
    {
      x: 100, // Spawn from left
      y: canvas.height - 30,
      width: 30,
      height: 30,
      speed: newSpeed,
    },
    {
      x: canvas.width - 130, // Spawn from right
      y: canvas.height - 30,
      width: 30,
      height: 30,
      speed: newSpeed * 0.8, // Slightly slower
    }
  );
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
  if (event.key === " " && !player.jumping) {
    player.velocityY = player.jumpPower;
    player.jumping = true;
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
          score += 100;

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
          gameOver = true;
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
  }

  // Keep running the game
  requestAnimationFrame(gameLoop);
}

// Start the game!
gameLoop();
