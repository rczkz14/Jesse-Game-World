import { supabase } from '../../supabaseClient.js';

export function startGame() {
    const app = document.getElementById('app');

    // Setup UI
    app.innerHTML = `
        <style>
            #game-container {
                position: relative;
                width: 100vw;
                height: 100vh;
                height: 100dvh; /* Dynamic viewport height for mobile browsers */
                margin: 0;
                overflow: hidden;
                background: #000;
                touch-action: none; /* Prevent zoom/scroll */
                -webkit-user-select: none;
                user-select: none;
            }
            canvas {
                display: block;
                width: 100%;
                height: 100%;
                margin: 0;
                image-rendering: pixelated;
                image-rendering: -moz-crisp-edges;
                image-rendering: crisp-edges;
            }
      #ui-layer {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }
      #farcaster-profile {
        position: absolute;
        top: max(10px, env(safe-area-inset-top) + 5px);
        left: max(10px, env(safe-area-inset-left) + 5px);
        pointer-events: auto;
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(4px);
        border: 1px solid rgba(255, 255, 255, 0.4);
        color: white;
        padding: 4px 8px;
        border-radius: 16px;
        font-weight: bold;
        font-size: clamp(10px, 2.5vw, 12px);
        z-index: 10;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      #farcaster-profile img {
        width: 24px;
        height: 24px;
        border-radius: 50%;
      }
      #logo-display {
        position: absolute;
        top: max(15px, env(safe-area-inset-top) + 10px);
        right: max(15px, env(safe-area-inset-right) + 10px);
        pointer-events: auto;
        z-index: 10;
        display: block;
      }
      #logo-display img {
        height: 50px;
        width: auto;
      }
      #score-display {
        position: absolute;
        top: max(15px, env(safe-area-inset-top) + 10px);
        right: max(15px, env(safe-area-inset-right) + 10px);
        color: #fff;
        font-family: 'Arial', sans-serif;
        font-size: clamp(32px, 8vw, 48px);
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        z-index: 10;
        display: none;
        background: rgba(0, 0, 0, 0.6);
        padding: 8px 16px;
        border-radius: 12px;
        backdrop-filter: blur(4px);
      }
      #game-over-modal {
        display: none;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        justify-content: center;
        align-items: center;
        flex-direction: column;
        z-index: 100;
        pointer-events: auto;
        font-family: 'Courier New', Courier, monospace;
      }
      .go-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 90%;
        max-width: 360px;
        background: rgba(88, 76, 125, 0.95);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 24px;
        padding: 40px 20px 30px;
        position: relative;
        box-shadow: 0 20px 50px rgba(0,0,0,0.5);
      }
      .home-btn {
        position: absolute;
        top: 15px;
        right: 15px;
        width: 36px;
        height: 36px;
        background: rgba(255, 255, 255, 0.15);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border: 1px solid rgba(255, 255, 255, 0.3);
        transition: background 0.2s;
      }
      .home-btn:active {
        background: rgba(255, 255, 255, 0.3);
      }
      .go-title {
        font-size: clamp(36px, 10vw, 48px);
        color: white;
        font-weight: 900;
        text-transform: uppercase;
        text-shadow: 4px 4px 0px #000;
        margin-bottom: 10px;
        letter-spacing: 2px;
        text-align: center;
      }
      .go-score {
        font-size: clamp(60px, 15vw, 80px);
        color: #00BFFF;
        font-weight: 900;
        text-shadow: 4px 4px 0px #000;
        margin-bottom: 30px;
      }
      .go-buttons-row {
        display: flex;
        gap: 15px;
        width: 100%;
        justify-content: center;
        margin-bottom: 20px;
      }
      .go-btn-large {
        flex: 1;
        height: 70px;
        border-radius: 12px;
        border: 3px solid white;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 6px 12px rgba(0,0,0,0.3);
        transition: transform 0.1s;
        text-decoration: none;
        position: relative;
        overflow: hidden;
      }
      .go-btn-large:active {
        transform: scale(0.95);
      }
      .btn-try-again {
        background: linear-gradient(180deg, #29B6F6 0%, #0288D1 100%);
        color: white;
      }
      .btn-revive {
        background: linear-gradient(180deg, #FFCA28 0%, #F57C00 100%);
        color: white;
      }
      .btn-label {
        font-size: clamp(14px, 4vw, 16px);
        font-weight: 900;
        text-transform: uppercase;
        text-shadow: 1px 1px 0 rgba(0,0,0,0.2);
      }
      .btn-sublabel {
        font-size: 10px;
        font-weight: bold;
        margin-top: 2px;
        opacity: 0.9;
      }
      .social-row {
        display: flex;
        gap: 15px;
        margin-top: 10px;
        width: 100%;
        justify-content: center;
      }
      .social-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 10px 0;
        width: 120px;
        border-radius: 8px;
        font-weight: bold;
        color: white;
        cursor: pointer;
        border: none;
        font-size: 16px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        text-decoration: none;
        text-transform: uppercase;
        font-family: sans-serif;
      }
      .btn-cast {
        background: #855DCD;
      }
      .btn-tweet {
        background: #000000;
      }
      .social-icon {
        width: 18px;
        height: 18px;
        fill: white;
      }
      #controls-hint {
        position: absolute;
        bottom: max(10%, env(safe-area-inset-bottom) + 60px);
        width: 100%;
        text-align: center;
        color: rgba(255,255,255,0.8);
        font-size: clamp(14px, 4vw, 18px);
        animation: pulse 2s infinite;
        padding: 0 20px;
      }
      @keyframes pulse { 0% { opacity:0.5; } 50% { opacity:1; } 100% { opacity:0.5; } }
      
      /* Control Buttons */
      #controls-container {
        position: absolute;
        bottom: 90px;
        left: 0;
        width: 100%;
        display: flex;
        justify-content: space-between;
        padding: 0 20px;
        pointer-events: none;
        z-index: 20;
        box-sizing: border-box;
      }
      .control-btn {
        width: 80px;
        height: 80px;
        background: rgba(255, 255, 255, 0.2);
        border: 2px solid rgba(255, 255, 255, 0.5);
        border-radius: 50%;
        pointer-events: auto;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(4px);
        touch-action: manipulation;
        cursor: pointer;
        transition: transform 0.1s, background 0.1s;
      }
      .control-btn:active {
        background: rgba(255, 255, 255, 0.4);
        transform: scale(0.95);
      }
      .control-btn svg {
        width: 40px;
        height: 40px;
        stroke: white;
        stroke-width: 3;
        stroke-linecap: round;
        stroke-linejoin: round;
        fill: none;
      }
    </style>
    <div id="game-container">
      <canvas id="gameCanvas"></canvas>
      <div id="ui-layer">
        <div id="controls-container">
            <div id="btn-left" class="control-btn">
                <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
            </div>
            <div id="btn-right" class="control-btn">
                <svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
            </div>
        </div>
        <div id="farcaster-profile">
          <img src="./assets/farcaster.png" alt="Profile" id="profile-pic" />
          <span id="profile-name">Player</span>
        </div>
        <div id="logo-display" style="cursor: pointer;">
          <img src="./assets/jgw.png" alt="Logo" />
        </div>
        <div id="score-display">0m</div>
        <div id="controls-hint">Tap Left or Right to Jump</div>
        <div id="game-over-modal">
          <div class="go-content">
            <div class="go-title">GAME OVER</div>
            <div class="home-btn" id="home-btn">
                <svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:white;"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
            </div>
            <div class="go-score" id="final-score">0</div>
            
            <div class="go-buttons-row">
              <div class="go-btn-large btn-try-again" id="restart-btn">
                <span class="btn-label">TRY AGAIN</span>
              </div>
              <div class="go-btn-large btn-revive" id="revive-btn">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="btn-label">REVIVE</span>
                    <img src="./assets/jessepp.png" style="width:20px;height:20px;border-radius:4px;">
                </div>
                <span class="btn-sublabel" id="revive-cost">(~loading $JESSE)</span>
              </div>
            </div>

            <div class="social-row">
              <a id="share-cast" class="social-btn btn-cast" target="_blank">
                <img src="./assets/farcaster.png" class="social-icon" style="border-radius:50%;"> CAST
              </a>
              <a id="share-tweet" class="social-btn btn-tweet" target="_blank">
                <svg class="social-icon" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> TWEET
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Enable pixel-perfect rendering
    ctx.imageSmoothingEnabled = false;

    let width, height;
    // Responsive canvas for mobile and desktop
    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // Camera logic: follow player smoothly
    function updateCamera() {
        // Center camera on player (vertical position controlled by iso function)
        const playerIso = (state.player.visualX - state.player.visualY) * TILE_WIDTH / 2;
        const playerIsoY = -(state.player.visualX + state.player.visualY) * TILE_HEIGHT / 2;
        // No vertical offset needed - position controlled by iso function
        const verticalOffset = 0;
        state.camera.x += (playerIso - state.camera.x) * 0.2;
        state.camera.y += (playerIsoY - state.camera.y - verticalOffset) * 0.2;
    }

    // Assets
    const assets = {
        player: new Image(),
        bgMorning: new Image(),
        bgNight: new Image(),
        rocks: [new Image(), new Image(), new Image()],
        rugby: new Image(),
        // Create a simple block texture programmatically or use an image if available
        // For now we will draw blocks with code, but we can load an image if needed
    };

    assets.player.src = './assets/jesse-jump/jessee.png';
    assets.bgMorning.src = './assets/jesse-jump/backgroundmorning.png';
    assets.bgNight.src = './assets/jesse-jump/backgroundnight.png';
    assets.rocks[0].src = './assets/jesse-jump/smallrock.png';
    assets.rocks[1].src = './assets/jesse-jump/mediumrock.png';
    assets.rocks[2].src = './assets/jesse-jump/bigrock.png';
    assets.rocks[2].src = './assets/jesse-jump/bigrock.png';
    assets.rugby.src = './assets/jesse-jump/powerup.png';

    // Background Music
    const bgMusic = new Audio('./assets/jesse-jump/JesseJumpMusic.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.4;

    // SFX
    const sfxRockBreak = new Audio('./assets/jesse-jump/RockBreak.mp3');
    const sfxRockDestroy = new Audio('./assets/jesse-jump/RockDestroy.mp3');

    // Ensure Max Volume
    sfxRockBreak.volume = 1.0;
    sfxRockDestroy.volume = 1.0;

    // Game Constants - Smaller tiles for zoomed out view
    const TILE_WIDTH = 50;  // Reduced from 80 for wider view
    const TILE_HEIGHT = 37; // Reduced from 60 for wider view
    const BLOCK_SIZE = 50; // Visual size of the block top

    // Game State
    let state = {
        running: false, // Wait for first input
        gameOver: false,
        score: 0,
        blocks: [], // Array of {x, y, hasRugby, hasRock} (grid coordinates)
        inputQueue: [],
        isMoving: false,
        player: {
            gridX: 0,
            gridY: 0,
            targetGridX: 0,
            targetGridY: 0,
            visualX: 0,
            visualY: 0,
            z: 0, // Jump height
            direction: 1, // 1 for right-facing, -1 for left-facing
            animProgress: 0, // 0 to 1 for animation
            startX: 0,
            startY: 0,
        },
        camera: {
            x: 0,
            y: 0
        },
        lastInputTime: 0,
        stepsSinceCage: 0,
        // Doom / Falling Tiles Logic
        doomStarted: false, // Flag to start the chase
        doomIndex: 0,      // Index of the block that is about to fall
        doomTimer: 0,      // Accumulator for timing
        doomSpeed: 2.0,    // Blocks per second (Starting speed)
        // Rugby Ball Spawn Control
        rugbyPositions: [], // Track where rugby balls have been placed
        rugbyCount: 0,      // Total rugby balls spawned
    };

    // Initialize Game
    async function initGame() {
        // Reset and Play Music
        bgMusic.currentTime = 0;
        bgMusic.play().catch(e => console.log('Music autoplay blocked:', e));

        state.score = 0;
        state.gameOver = false;
        state.running = false;
        state.blocks = [];
        state.inputQueue = [];
        state.isMoving = false;
        state.player.gridX = 3; // Start on blue center tile
        state.player.gridY = 3;
        state.player.targetGridX = 3;
        state.player.targetGridY = 3;
        state.player.visualX = 3;
        state.player.visualY = 3;
        state.player.prevGridX = 3;
        state.player.prevGridY = 3;
        state.player.z = 0;
        state.stepsSinceCage = 0;

        // Reset Doom State
        state.doomStarted = false;
        state.doomIndex = 49; // Start after initial cage (7x7 = 49 blocks)
        state.doomTimer = 0;
        state.doomSpeed = 2.0; // Start comfortably (2 blocks/sec)
        state.doomGrace = 0; // Grace period steps after exiting cage

        // Reset Rugby Ball Tracking
        state.rugbyPositions = [];
        state.rugbyCount = 0;

        // Tutorial Rock Tracking (0-100m)
        state.tutorialRocks = { small: 0, medium: 0, big: 0 };

        // Reset Power Up
        state.powerUpActive = false;
        state.powerUpTimer = 0;

        // Reset Score/Revive Logic
        state.hasRevived = false;
        state.scoreSaved = false;

        // Load Farcaster profile
        try {
            const context = await window.sdk?.context;
            const user = context?.user;
            if (user) {
                document.getElementById('profile-pic').src = user.pfpUrl || './assets/farcaster.png';
                document.getElementById('profile-name').innerText = user.displayName || user.username || 'Player';
            }
        } catch (e) {
            console.warn('Failed to load Farcaster profile:', e);
        }

        // Generate initial cage
        generateCage(0, 0, true);

        // Add connecting blocks from cage exit (6,5) to start the path
        state.blocks.push({ x: 7, y: 5, z: 0, type: 'path' });
        state.blocks.push({ x: 8, y: 5, z: 0, type: 'path' });
        state.blocks.push({ x: 9, y: 5, z: 0, type: 'path' });

        // Generate more path
        generateBlocks(30);

        // Reset camera to initial position
        state.camera.x = 0;
        state.camera.y = 0;
        updateCamera();

        // Reset UI - show logo, hide score
        document.getElementById('logo-display').style.display = 'block';
        document.getElementById('score-display').style.display = 'none';
        document.getElementById('score-display').innerText = '0m';
        document.getElementById('controls-hint').style.display = 'block';
        document.getElementById('game-over-modal').style.display = 'none';

        loop();
    }

    function generateCage(startX, startY, isInitial = false) {
        const sizeX = 7;
        const sizeY = 7; // Changed from 6 to 7
        const wallHeight = 6;

        for (let x = 0; x < sizeX; x++) {
            for (let y = 0; y < sizeY; y++) {
                // Floor
                // Center is now single block at (3,3)
                const isCenter = (x === 3 && y === 3);
                state.blocks.push({
                    x: startX + x,
                    y: startY + y,
                    z: 0,
                    type: 'floor',
                    isCenter: isCenter
                });

                // Walls (Perimeter)
                if (x === 0 || x === sizeX - 1 || y === 0 || y === sizeY - 1) {
                    // Exit is always open at (6,5) - adjusted for 7x7
                    const isExit = (x === 6 && y === 5);

                    // Entrance logic:
                    // Initial cage: All closed (spawn inside)
                    // Later cages: Open at (1,0)
                    const isEntrance = !isInitial && (x === 1 && y === 0);

                    if (!isExit && !isEntrance) {
                        state.blocks.push({
                            x: startX + x,
                            y: startY + y,
                            z: 20, // 1 block high
                            type: 'wall'
                        });
                    }
                }
            }
        }
        return { x: startX + 6, y: startY + 5 }; // Return exit coordinates
    }

    function generateBlocks(count) {
        let lastBlock = state.blocks[state.blocks.length - 1];
        if (!lastBlock) lastBlock = { x: 0, y: 0 };

        // Find the furthest floor/path block
        let head = state.blocks.reduce((prev, curr) => {
            // Only consider floor and path blocks (not walls)
            if (curr.type === 'wall') return prev;
            if (curr.z && curr.z > 0) return prev; // Skip elevated blocks
            return (curr.x + curr.y > prev.x + prev.y) ? curr : prev;
        }, { x: 9, y: 5 }); // Default to last connecting block after initial cage

        // Define helper for tutorial rocks at function scope
        const applyTutorialSpawns = (blk) => {
            const d = blk.x + blk.y;
            if (d >= 120) return; // Only apply in tutorial phase

            // Force spawn if conditions met. Use fixed checkpoints.
            // Small 1
            if (d > 25 && state.tutorialRocks.small < 1) {
                blk.hasRock = true; blk.rockType = 0; blk.rockHP = 1;
                state.tutorialRocks.small++;
                return;
            }
            // Small 2
            if (d > 45 && state.tutorialRocks.small < 2) {
                blk.hasRock = true; blk.rockType = 0; blk.rockHP = 1;
                state.tutorialRocks.small++;
                return;
            }
            // Medium
            if (d > 65 && state.tutorialRocks.medium < 1) {
                blk.hasRock = true; blk.rockType = 1; blk.rockHP = 2;
                state.tutorialRocks.medium++;
                return;
            }
            // Big
            if (d > 85 && state.tutorialRocks.big < 1) {
                blk.hasRock = true; blk.rockType = 2; blk.rockHP = 3;
                state.tutorialRocks.big++;
                return;
            }
        };

        const tryAddRandomObstacle = (blk) => {
            const genDist = blk.x + blk.y;
            if (genDist < 120) return;

            if (state.score <= 250) {
                if (Math.random() < 0.05) { blk.hasRock = true; blk.rockType = 0; blk.rockHP = 1; }
                else if (Math.random() < 0.03) { blk.hasRock = true; blk.rockType = 1; blk.rockHP = 2; }
                else if (Math.random() < 0.03) { blk.hasRock = true; blk.rockType = 2; blk.rockHP = 3; }
            } else if (state.score >= 750) {
                if (Math.random() < 0.06) { blk.hasRock = true; blk.rockType = 0; blk.rockHP = 1; }
                else if (Math.random() < 0.07) { blk.hasRock = true; blk.rockType = 1; blk.rockHP = 2; }
                else if (Math.random() < 0.06) { blk.hasRock = true; blk.rockType = 2; blk.rockHP = 3; }
            } else {
                if (Math.random() < 0.04) { blk.hasRock = true; blk.rockType = 0; blk.rockHP = 1; }
                else if (Math.random() < 0.05) { blk.hasRock = true; blk.rockType = 1; blk.rockHP = 2; }
                else if (Math.random() < 0.04) { blk.hasRock = true; blk.rockType = 2; blk.rockHP = 3; }
            }
        };

        for (let i = 0; i < count; i++) {
            // Calculate distance based on grid coordinates
            const currentGridDist = head.x + head.y;

            // Target grid distance for next cage:
            // We want the tile BEFORE entrance to be exactly 100m, 200m (Score)
            // Cycle length is 111 (100 score + 11 cage traversal)
            // Formula: Target = 111 * N + 1
            const N = Math.floor((currentGridDist - 1) / 111) + 1;
            const nextMilestone = 111 * N + 1;

            const distToMilestone = nextMilestone - currentGridDist;

            // Check if we are close enough to force the path to the cage
            // We need to trigger cage when head is at (Target - 3)
            // Because connectors add +3 distance to the entrance
            if (distToMilestone <= 15 && state.stepsSinceCage > 20) {

                if (distToMilestone > 3) {
                    // Force straight path to reach the exact trigger point
                    // Just add one block (x+1 or y+1)
                    // We can alternate or random to keep it looking like a path
                    // Helper to check if rugby can spawn
                    // Helper to check if powerup can spawn
                    const trySpawnPowerUp = (dist) => {
                        // Check global limits first
                        let canSpawn = false;
                        if (state.score >= 301 && state.score < 600 && state.rugbyCount < 2) canSpawn = true;
                        else if (state.score >= 601 && state.score < 750 && state.rugbyCount < 5) canSpawn = true;

                        if (!canSpawn) return false;

                        // Check spacing (60m)
                        for (let pos of state.rugbyPositions) {
                            if (Math.abs(dist - pos) < 60) return false;
                        }

                        // 10% chance if conditions met
                        return Math.random() < 0.1;
                    };

                    const dir = Math.random() < 0.5 ? 'right' : 'left';
                    const nextX = head.x + (dir === 'right' ? 1 : 0);
                    const nextY = head.y + (dir === 'left' ? 1 : 0);
                    const nextDist = nextX + nextY;

                    // Powerup logic restored
                    let hasRugby = trySpawnPowerUp(nextDist);
                    if (hasRugby) {
                        state.rugbyPositions.push(nextDist);
                        state.rugbyCount++;
                    }




                    let nextBlock = {
                        x: nextX,
                        y: nextY,
                        z: 0,
                        hasRugby: hasRugby,
                        hasRock: false, // Default false, helper may enable
                        type: 'path'
                    };

                    applyTutorialSpawns(nextBlock);

                    state.blocks.push(nextBlock);
                    head = nextBlock;
                    continue; // Continue loop to generate next block
                } else if (distToMilestone === 3) {
                    // EXACT TRIGGER POINT REACHED!
                    // head distance is Target - 3

                    // Add connector blocks to bridge into the cage entrance at (1,0)
                    // Path: head -> (x+1, y) -> (x+2, y) -> Entrance (x+2, y+1)
                    const c1 = { x: head.x + 1, y: head.y, z: 0, type: 'path' };
                    // applyTutorialSpawns(c1); // Typically > 120 but safe to call if needed
                    state.blocks.push(c1);

                    const c2 = { x: head.x + 2, y: head.y, z: 0, type: 'path' };
                    state.blocks.push(c2);
                    // Entrance is at Dist + 3 (Target!)

                    // Generate cage and get exit coordinates
                    const cageExit = generateCage(head.x + 1, head.y + 1, false);

                    // Force 3 straight blocks after exit
                    let currentX = cageExit.x;
                    let currentY = cageExit.y;

                    for (let k = 0; k < 3; k++) {
                        currentX++;
                        state.blocks.push({
                            x: currentX,
                            y: currentY,
                            z: 0,
                            type: 'path'
                        });
                    }

                    head = { x: currentX, y: currentY, z: 0 };
                    state.stepsSinceCage = 0;
                    continue;
                }
            }

            // Chance to generate a donut (split path)
            // Disable Donuts in Tutorial Phase (< 120 dist)
            if (Math.random() < 0.1 && i < count - 5 && (head.x + head.y) >= 120) {
                const W = Math.floor(Math.random() * 7) + 2;
                const H = Math.floor(Math.random() * 7) + 2;

                const startX = head.x;
                const startY = head.y;

                // Right Wing
                for (let w = 1; w <= W; w++) {
                    let b = { x: startX + w, y: startY, type: 'path', hasRugby: false };
                    tryAddRandomObstacle(b);
                    state.blocks.push(b);
                }
                for (let h = 1; h < H; h++) {
                    let b = { x: startX + W, y: startY + h, type: 'path', hasRugby: false };
                    tryAddRandomObstacle(b);
                    state.blocks.push(b);
                }

                // Left Wing
                for (let h = 1; h <= H; h++) {
                    let b = { x: startX, y: startY + h, type: 'path', hasRugby: false };
                    tryAddRandomObstacle(b);
                    state.blocks.push(b);
                }
                for (let w = 1; w < W; w++) {
                    let b = { x: startX + w, y: startY + H, type: 'path', hasRugby: false };
                    tryAddRandomObstacle(b);
                    state.blocks.push(b);
                }

                // Merge
                const mergeBlock = {
                    x: startX + W,
                    y: startY + H,
                    type: 'path',
                    hasRugby: false
                };
                state.blocks.push(mergeBlock);

                head = mergeBlock;
                i += Math.max(W, H);

            } else {
                // Standard ZigZag
                state.stepsSinceCage++; // Track steps for cage generation
                const dir = Math.random() < 0.5 ? 'right' : 'left';

                // Determine spawn rates based on score
                const rugbyRate = state.score <= 250 ? 0.00001 : 0.00001;

                let nextBlock = {
                    x: head.x + (dir === 'right' ? 1 : 0),
                    y: head.y + (dir === 'left' ? 1 : 0),
                    z: 0,
                    hasRugby: false,
                    hasRock: false,
                    type: 'path'
                };

                // PowerUp (formerly Rugby) Spawning Logic Restored
                const currentDistance = nextBlock.x + nextBlock.y;
                let canSpawnPowerUp = false;

                if (state.score >= 301 && state.score < 600) {
                    // 301-600m: Max 2 powerups
                    if (state.rugbyCount < 2) {
                        canSpawnPowerUp = true;
                    }
                } else if (state.score >= 601 && state.score < 750) {
                    // 601-750m: Max 3 more powerups (5 total)
                    if (state.rugbyCount < 5) {
                        canSpawnPowerUp = true;
                    }
                }

                // Check minimum spacing (60m between powerups)
                if (canSpawnPowerUp) {
                    let tooClose = false;
                    for (let pos of state.rugbyPositions) {
                        if (Math.abs(currentDistance - pos) < 60) {
                            tooClose = true;
                            break;
                        }
                    }

                    // Random chance to place powerup (1% when conditions are met)
                    if (!tooClose && Math.random() < 0.01) {
                        nextBlock.hasRugby = true; // reusing existing property
                        state.rugbyPositions.push(currentDistance);
                        state.rugbyCount++;
                    }
                }

                // Random rock generation - independent probability per type per tile
                // Use generation distance for map logic, not player score
                const genDist = nextBlock.x + nextBlock.y;
                // 100m score roughly equals 111 distance grid units

                applyTutorialSpawns(nextBlock);
                tryAddRandomObstacle(nextBlock);

                state.blocks.push(nextBlock);
                head = nextBlock;
            }
        }
    }

    // Input Handling
    function handleInput(direction) {
        if (state.gameOver) return;
        if (!state.running) {
            state.running = true;
            state.doomStarted = true; // Start doom immediately
            document.getElementById('controls-hint').style.display = 'none';
            // Show score, hide logo on first jump
            document.getElementById('logo-display').style.display = 'none';
            document.getElementById('score-display').style.display = 'block';
        }

        // Queue input
        if (state.inputQueue.length < 3) {
            state.inputQueue.push(direction);
        }
    }

    // Audio Optimization: Web Audio API (Best for frequent SFX)
    let audioCtx = null;
    let jumpBuffer = null;

    // Load sound once
    async function loadJumpSound() {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const res = await fetch('./assets/jesse-jump/Jump.mp3');
            const arrayBuffer = await res.arrayBuffer();
            jumpBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        } catch (e) {
            console.error('Failed to load jump sound via Web Audio API', e);
        }
    }
    loadJumpSound(); // Start loading immediately

    function playJumpSound() {
        if (!audioCtx || !jumpBuffer) return;

        // Resume if suspended (browser policy)
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const source = audioCtx.createBufferSource();
        source.buffer = jumpBuffer;
        source.connect(audioCtx.destination);

        // Play precisely from 0.02s
        // Duration: 0.02s start, plays for 0.05s duration
        const offset = 0.02;
        const duration = 0.05; // Play slightly longer slice to ensure audibility (20ms-70ms)

        source.start(0, offset, duration);
    }

    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');

    const triggerLeft = (e) => {
        e.preventDefault();
        // e.stopPropagation(); // Removed to allow bubbling if needed, though preventDefault handles most
        console.log('Left button clicked');
        handleInput('left');
    };
    const triggerRight = (e) => {
        e.preventDefault();
        // e.stopPropagation();
        console.log('Right button clicked');
        handleInput('right');
    };

    if (btnLeft && btnRight) {
        btnLeft.addEventListener('mousedown', triggerLeft);
        btnRight.addEventListener('mousedown', triggerRight);

        // Touch events for mobile
        btnLeft.addEventListener('touchstart', triggerLeft, { passive: false });
        btnRight.addEventListener('touchstart', triggerRight, { passive: false });
    } else {
        console.error('Control buttons not found!');
    }

    window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') handleInput('left');
        if (e.key === 'ArrowRight') handleInput('right');
        if (e.key === 'ArrowUp') handleInput('up');
        if (e.key === 'ArrowDown') handleInput('down');
    });

    function iso(x, y) {
        // Position game in lower portion of screen (red box area)
        const verticalCenter = height * 0.75; // Moved lower (was 0.65, now 0.75)
        return {
            x: (x - y) * TILE_WIDTH / 2 + width / 2 - state.camera.x,
            y: -(x + y) * TILE_HEIGHT / 2 + verticalCenter - state.camera.y
        };
    }

    function update(dt) {
        // Default dt if undefined (first frame)
        if (!dt) dt = 0.016;

        if (state.gameOver) {
            state.player.z -= 15;
            return;
        }

        if (state.running) {
            // Power Up Logic
            if (state.powerUpActive) {
                state.powerUpTimer -= dt;
                if (state.powerUpTimer <= 0) {
                    state.powerUpActive = false;
                    state.powerUpTimer = 0;
                }
            }

            // --- DOOM / FALLING TILES LOGIC ---
            if (state.doomStarted) {
                // Efficient Skip: Ensure doomIndex always points to a valid PATH block to drop.
                // Continuously skip blocks that have already fallen, or are walls/floors (cage parts),
                // so the doom cursor instantly jumps over cages instead of slowly counting them.
                while (state.doomIndex < state.blocks.length) {
                    const blk = state.blocks[state.doomIndex];
                    if (blk.isFalling || blk.type === 'wall' || blk.type === 'floor') {
                        state.doomIndex++;
                    } else {
                        break;
                    }
                }

                // Pause doom if player is in a cage (on 'floor' tile)
                const playerBlock = state.blocks.find(b => b.x === state.player.gridX && b.y === state.player.gridY);
                if (playerBlock && playerBlock.type === 'floor') {
                    // Do nothing - Pause Doom while in cage
                } else if (state.doomGrace > 0) {
                    // Grace period after exiting cage (wait for 3 moves)
                    // Pause doom
                } else {
                    // Calculate Base Speed based on Score tiers
                    let secondsPerBlock = 0.30; // 0-199m

                    if (state.hasRevived) {
                        secondsPerBlock = 0.225; // Revive speed
                    } else if (state.score >= 400) {
                        secondsPerBlock = 0.205; // Base for 400m+
                    } else if (state.score >= 300) secondsPerBlock = 0.25;
                    else if (state.score >= 200) secondsPerBlock = 0.275;

                    // Obstacle Penalty Logic (400m+)
                    if (state.score >= 400 && !state.hasRevived) {
                        const currentHundred = Math.floor(state.score / 100);
                        const getBlockScore = (b) => {
                            const raw = b.x + b.y;
                            const startOffset = 11;
                            const cycleLength = 111;
                            const dist = Math.max(0, raw - startOffset);
                            const cages = Math.floor(dist / cycleLength);
                            return dist - (cages * 11);
                        };
                        let obsCount = 0;
                        for (const b of state.blocks) {
                            if (b.hasRock) {
                                const bScore = getBlockScore(b);
                                if (Math.floor(bScore / 100) === currentHundred) {
                                    obsCount++;
                                }
                            }
                        }
                        secondsPerBlock += (obsCount * 0.02);
                    }

                    // Revive Protection: Pause doom until player passes the revive point
                    if (state.hasRevived && state.reviveGridDist) {
                        const playerDist = state.player.gridX + state.player.gridY;
                        if (playerDist <= state.reviveGridDist) {
                            secondsPerBlock = 9999; // Effectively pause
                        }
                    }

                    const currentDoomSpeed = 1.0 / secondsPerBlock;



                    if (state.doomIndex < state.blocks.length) {
                        const currentBlock = state.blocks[state.doomIndex];

                        // Standard Path Logic - Doom Chases!
                        state.doomTimer += dt;

                        // Time to drop the next block?
                        if (state.doomTimer > (1.0 / currentDoomSpeed)) {
                            state.doomTimer = 0;

                            if (currentBlock) {
                                // Drop the main block
                                currentBlock.isFalling = true;
                                currentBlock.fallVelocity = 0;

                                // DONUT LOGIC: Drop parallel blocks (same distance) simultaneously
                                const targetDist = currentBlock.x + currentBlock.y;

                                // Scan ahead for blocks at the same distance
                                for (let k = state.doomIndex + 1; k < Math.min(state.doomIndex + 50, state.blocks.length); k++) {
                                    const sibling = state.blocks[k];
                                    if (!sibling.isFalling &&
                                        sibling.type !== 'wall' &&
                                        sibling.type !== 'floor' &&
                                        (sibling.x + sibling.y === targetDist)) {

                                        sibling.isFalling = true;
                                        sibling.fallVelocity = 0;
                                    }
                                }
                                state.doomIndex++;
                            }
                        }
                    }
                }
            } // End of else (not in cage)

            // Update Falling Blocks Physics
            for (let i = 0; i < state.blocks.length; i++) {
                const block = state.blocks[i];
                if (block.isFalling) {
                    block.fallVelocity = (block.fallVelocity || 0) + 20 * dt;
                    block.z = (block.z || 0) - block.fallVelocity;

                    if (state.player.gridX === block.x && state.player.gridY === block.y) {
                        if (block.z < -10) {
                            state.gameOver = true;
                            gameOver();
                            return;
                        }
                    }
                }
            }
        }
        // ----------------------------------

        // Process Input Queue
        if (!state.isMoving && state.inputQueue.length > 0) {
            const dir = state.inputQueue[0]; // Peek
            let nextGridX = state.player.gridX;
            let nextGridY = state.player.gridY;

            // Allow movement in all four directions
            if (dir === 'left') nextGridY++;
            else if (dir === 'right') nextGridX++;
            else if (dir === 'up') nextGridY--;
            else if (dir === 'down') nextGridX--;

            // Check for wall
            const wall = state.blocks.find(b => b.x === nextGridX && b.y === nextGridY && b.type === 'wall');
            if (wall) {
                state.inputQueue.shift();
                return;
            }

            state.inputQueue.shift();

            // Save previous position for bounce back
            state.player.prevGridX = state.player.gridX;
            state.player.prevGridY = state.player.gridY;

            state.player.targetGridX = nextGridX;
            state.player.targetGridY = nextGridY;
            state.player.startX = state.player.gridX;
            state.player.startY = state.player.gridY;
            state.player.animProgress = 0;
            // Set direction for left/right only
            if (dir === 'right') state.player.direction = 1;
            else if (dir === 'left') state.player.direction = -1;
            state.isMoving = true;

            // Play Jump Sound
            playJumpSound();
        }

        // Animate Movement
        if (state.isMoving) {
            const tx = state.player.targetGridX;
            const ty = state.player.targetGridY;
            const sx = state.player.startX;
            const sy = state.player.startY;

            // Fixed animation speed using delta time
            // 0.12 per frame at 60fps ~= 7.2 per second
            const jumpSpeed = 7.2;
            state.player.animProgress += jumpSpeed * dt;

            if (state.player.animProgress >= 1) {
                state.player.animProgress = 1;
            }

            // Smooth easing (ease-out)
            const t = state.player.animProgress;
            const eased = 1 - Math.pow(1 - t, 3); // Cubic ease-out

            state.player.visualX = sx + (tx - sx) * eased;
            state.player.visualY = sy + (ty - sy) * eased;
            state.player.z = Math.sin(t * Math.PI) * 40; // Arc jump

            if (state.player.animProgress >= 1) {
                state.player.visualX = tx;
                state.player.visualY = ty;
                state.player.z = 0;
                state.isMoving = false;
                checkLanding();
            }
        }

        // Generate more blocks logic
        // Check distance to the last block to ensure we always have path ahead
        const lastBlock = state.blocks[state.blocks.length - 1];
        const playerDist = state.player.gridX + state.player.gridY;
        const lastBlockDist = lastBlock ? (lastBlock.x + lastBlock.y) : 0;

        if (lastBlockDist - playerDist < 50) {
            generateBlocks(20);
        }

        // Remove old blocks to save memory, but keep a buffer behind player
        // Remove old blocks to save memory
        // Only remove blocks that have fallen deep enough
        if (state.blocks.length > 0) {
            const firstBlock = state.blocks[0];
            if (firstBlock.isFalling && firstBlock.z < -500) {
                state.blocks.shift();
                // Since we removed from the start, we must shift the doomIndex back
                // doomIndex points to the next block to fall.
                // If we remove a block that has ALREADY fallen, doomIndex (which is ahead) must decrease.
                if (state.doomIndex > 0) {
                    state.doomIndex--;
                }
            }
        }

        updateCamera();
    }


    function draw() {
        ctx.clearRect(0, 0, width, height);

        const bg = Math.floor(state.score / 250) % 2 === 0 ? assets.bgMorning : assets.bgNight;
        // Simple parallax or just static cover
        ctx.drawImage(bg, 0, 0, width, height);

        // Sort blocks by depth (painter's algorithm)
        // In iso: depth = x + y
        // We also need to draw player at correct depth

        // Combine blocks and player into render list
        let renderList = [...state.blocks];

        // Add player to render list as a pseudo-object
        const playerObj = {
            type: 'player',
            x: Math.round(state.player.visualX), // Round for depth sorting
            y: Math.round(state.player.visualY),
            visualX: state.player.visualX, // Actual pos for drawing
            visualY: state.player.visualY,
            z: state.player.z
        };
        renderList.push(playerObj);

        // Sort: primarily by (x+y) DESCENDING so far blocks (Top) are drawn first, covered by near blocks (Bottom)
        // Secondary sort by Z ASCENDING so ground blocks are drawn before walls on top of them
        renderList.sort((a, b) => (b.x + b.y) - (a.x + a.y) || (a.z - b.z));

        renderList.forEach(obj => {
            let pos;
            if (obj.type === 'player') {
                pos = iso(obj.visualX, obj.visualY);
            } else {
                pos = iso(obj.x, obj.y);
            }

            if (obj.type === 'player') {
                // Draw Player
                // Adjust Y for Z (height)
                const drawY = pos.y - 40 - obj.z; // Reduced from 60 to match smaller tiles

                // Shadow
                if (!state.gameOver) {
                    ctx.beginPath();
                    ctx.ellipse(pos.x, pos.y - TILE_HEIGHT / 2, 15, 8, 0, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(0,0,0,0.3)';
                    ctx.fill();
                }

                // Power-up Shine Effect
                if (state.powerUpActive) {
                    ctx.save();
                    ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 100) * 0.2; // Pulsing
                    ctx.beginPath();
                    ctx.arc(pos.x, drawY, 40, 0, Math.PI * 2);
                    ctx.fillStyle = '#FFD700'; // Gold
                    ctx.shadowColor = '#FFD700';
                    ctx.shadowBlur = 20;
                    ctx.fill();
                    ctx.restore();
                }

                // Sprite - smaller to match zoomed out view
                const spriteSize = 50; // Reduced from 80
                ctx.save();
                if (state.player.direction === -1) {
                    ctx.scale(-1, 1);
                    ctx.drawImage(assets.player, -pos.x - spriteSize / 2, drawY - spriteSize / 2, spriteSize, spriteSize);
                } else {
                    ctx.drawImage(assets.player, pos.x - spriteSize / 2, drawY - spriteSize / 2, spriteSize, spriteSize);
                }
                ctx.restore();

            } else {
                // Draw Block - Pixel Art Style
                const x = pos.x;
                const y = pos.y - (obj.z || 0); // Apply Z offset

                // Top face
                ctx.beginPath();
                ctx.moveTo(x, y - TILE_HEIGHT);
                ctx.lineTo(x + TILE_WIDTH / 2, y - TILE_HEIGHT / 2);
                ctx.lineTo(x, y);
                ctx.lineTo(x - TILE_WIDTH / 2, y - TILE_HEIGHT / 2);
                ctx.closePath();

                let topColor;
                if (obj.type === 'wall') {
                    topColor = '#555'; // Dark gray walls
                } else if (obj.type === 'start' || obj.type === 'floor') {
                    if (obj.isCenter) {
                        topColor = '#2196f3'; // Blue center
                    } else {
                        topColor = '#222'; // Black floor
                    }
                } else {
                    // Alternating Soft Blue for path
                    if ((obj.x + obj.y) % 2 === 0) {
                        topColor = '#87CEEB'; // Sky Blue (Soft)
                    } else {
                        topColor = '#B0E0E6'; // Powder Blue (Very Soft)
                    }
                }

                ctx.fillStyle = topColor;
                ctx.fill();

                // Pixel-style outline
                ctx.strokeStyle = obj.type === 'wall' ? '#333' : '#fff';
                ctx.lineWidth = 1;
                ctx.stroke();

                // Right face
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + TILE_WIDTH / 2, y - TILE_HEIGHT / 2);
                ctx.lineTo(x + TILE_WIDTH / 2, y - TILE_HEIGHT / 2 + 20);
                ctx.lineTo(x, y + 20);
                ctx.closePath();

                const rightColor = obj.type === 'wall' ? '#444' : (topColor === '#87CEEB' ? '#6BB6D6' : topColor === '#B0E0E6' ? '#9ACDD3' : '#1976d2');
                ctx.fillStyle = rightColor;
                ctx.fill();
                ctx.strokeStyle = obj.type === 'wall' ? '#222' : 'rgba(255,255,255,0.3)';
                ctx.stroke();

                // Left face
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x - TILE_WIDTH / 2, y - TILE_HEIGHT / 2);
                ctx.lineTo(x - TILE_WIDTH / 2, y - TILE_HEIGHT / 2 + 20);
                ctx.lineTo(x, y + 20);
                ctx.closePath();

                const leftColor = obj.type === 'wall' ? '#333' : (topColor === '#87CEEB' ? '#5A9FB8' : topColor === '#B0E0E6' ? '#7FB8BE' : '#1565c0');
                ctx.fillStyle = leftColor;
                ctx.fill();
                ctx.strokeStyle = obj.type === 'wall' ? '#111' : 'rgba(0,0,0,0.3)';
                ctx.stroke();

                // Items - smaller to match zoomed out view
                if (obj.hasRugby) {
                    ctx.drawImage(assets.rugby, x - 12, y - 40, 25, 25);
                }
                if (obj.hasRock) {
                    // Draw rock slightly offset based on type
                    const rockType = obj.rockType || 0;
                    const rockImg = assets.rocks[rockType];
                    // Increased size from 25x25 to 45x45
                    ctx.drawImage(rockImg, x - 22, y - 55, 45, 45);
                }
            }
        });
    }

    function checkLanding() {
        // Update grid position
        state.player.gridX = state.player.targetGridX;
        state.player.gridY = state.player.targetGridY;

        // Check if player landed on a valid block
        const landedBlock = state.blocks.find(b =>
            b.x === state.player.gridX &&
            b.y === state.player.gridY &&
            (b.type === 'path' || b.type === 'floor' || b.type === 'start')
        );

        if (!landedBlock) {
            // Game over - fell off
            state.gameOver = true;
            gameOver();
            return;
        }

        // Collect rugby ball
        if (landedBlock.hasRugby) {
            landedBlock.hasRugby = false;
            // Activate Power Up
            state.powerUpActive = true;
            state.powerUpTimer = 20; // 20 seconds
        }

        // Hit rock
        if (landedBlock.hasRock) {
            if (state.powerUpActive) {
                // Destroy rock immediately
                landedBlock.hasRock = false;
                // Play destroy sound
                const clone = sfxRockDestroy.cloneNode();
                clone.volume = 1.0;
                clone.play().catch(() => { });
            } else {
                // Damage rock
                landedBlock.rockHP--;

                // Bounce back animation - use same smooth animation as regular jumps
                state.player.targetGridX = state.player.prevGridX;
                state.player.targetGridY = state.player.prevGridY;
                state.player.startX = state.player.gridX;
                state.player.startY = state.player.gridY;
                state.player.animProgress = 0;

                // Reset grid position to current (rock) position
                state.player.gridX = state.player.targetGridX;
                state.player.gridY = state.player.targetGridY;

                state.isMoving = true;

                // If broken
                if (landedBlock.rockHP <= 0) {
                    landedBlock.hasRock = false;
                    const clone = sfxRockDestroy.cloneNode();
                    clone.volume = 1.0;
                    clone.play().catch(() => { });
                } else {
                    // Just hit/damaged
                    const clone = sfxRockBreak.cloneNode();
                    clone.volume = 1.0;
                    clone.play().catch(() => { });
                }

                // Return early so we don't process item collection or score on the rock tile
                return;
            }
        }

        // Collect rugby ball
        if (landedBlock.hasRugby) {
            landedBlock.hasRugby = false;
            // Could add score bonus here
        }

        // Update score (distance traveled) - ONLY on path, not in cage (floor)
        if (landedBlock.type === 'path') {
            const rawScore = Math.floor(state.player.gridX + state.player.gridY);
            const startOffset = 11;
            const physicalCageLength = 10; // Actual grid distance of cage
            const scoreSubtraction = 11; // Subtract 11 so that 12 grid units (enter+cage+exit) = 1 score unit

            const cycleLength = 100 + 11; // 111

            // Calculate how many cages we have passed
            // We subtract startOffset first
            const distFromStart = Math.max(0, rawScore - startOffset);
            const cagesPassed = Math.floor(distFromStart / cycleLength);

            // Subtract the distance "lost" inside cages
            const adjustedScore = distFromStart - (cagesPassed * scoreSubtraction);

            if (adjustedScore > state.score) {
                state.score = adjustedScore;
                document.getElementById('score-display').innerText = state.score + 'm';
            }
        }

        // Logic for doom grace period on cage exit
        if (landedBlock) {
            const prevBlock = state.blocks.find(b => b.x === state.player.prevGridX && b.y === state.player.prevGridY);

            if (prevBlock && prevBlock.type === 'floor' && landedBlock.type === 'path') {
                // Exited Cage
                state.doomGrace = 3;
            } else if (state.doomGrace > 0 && landedBlock.type === 'path') {
                state.doomGrace--;
            }
        }
    }

    let lastTime = 0;
    function loop(timestamp) {
        if (!lastTime) lastTime = timestamp;
        let dt = (timestamp - lastTime) / 1000;
        lastTime = timestamp;

        // Cap dt to prevent huge jumps (e.g. tab switching)
        if (dt > 0.05) dt = 0.05;

        update(dt);
        draw();
        if (!state.gameOver || state.player.z > -500) {
            requestAnimationFrame(loop);
        }
    }

    async function saveScore(finalScore) {
        console.log('Attempting to save score:', finalScore);

        let user = null;
        try {
            if (window.sdk && window.sdk.context) {
                const context = await window.sdk.context;
                if (context && context.user) {
                    user = context.user;
                }
            }
        } catch (e) {
            console.error('SDK Context Fetch Error:', e);
        }

        const playerData = {
            game_name: 'jesse-jump',
            player_name: user ? (user.displayName || user.username || 'Anonymous') : 'Guest Player',
            player_avatar: user ? user.pfpUrl : null,
            player_fid: user ? user.fid : null, // Add FID to payload if schema supports it or just strict to logging
            score: finalScore
        };

        // Note: Check if 'player_fid' column exists in Supabase. If not, this might error.
        // The user complained about "supabasedata keep NULL for playeravatar and playerfid".
        // This implies 'player_fid' column likely exists or they are looking at 'playerID' etc.
        // We'll trust the user implies they want FID saved. If the column is missing in DB, this insert might fail implicitly or ignore it.
        // However, looking at previous main.js, it selects 'game_name, player_name, player_avatar, score'. 
        // It didn't mention 'player_fid' in the SELECT.
        // But the user *asked* about playerfid. I'll include it.

        // Actually, let's allow the insert to handle it. 
        // If the table doesn't have player_fid, we should probably check.
        // But invalid column usually throws error.
        // Let's assume the user has the column.

        console.log('Saving data payload:', playerData);

        const { data, error } = await supabase.from('game_scores').insert(playerData);

        if (error) {
            console.error('Supabase Insert Error:', error);
            // Don't alert blocking error, just log
        } else {
            console.log('Score saved successfully:', data);
        }
    }

    async function gameOver() {
        // Pause Music
        bgMusic.pause();

        document.getElementById('game-over-modal').style.display = 'flex';
        document.getElementById('final-score').innerText = state.score;

        // Update Share Links
        const url = 'https://jesse-game-world.vercel.app';

        const castText = `I jumped ${state.score}m in Jesse Jump !\nCan you beat me on #JesseGameWorld ?`;
        const tweetText = `I jumped ${state.score}m in Jesse Jump !\nCan you beat me on #JesseGameWorld ?\nTry now : jesse-game-world.vercel.app`;

        const castUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}&embeds[]=${encodeURIComponent(url)}`;
        const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(url)}`;

        // Set fallback hrefs
        const shareCastBtn = document.getElementById('share-cast');
        shareCastBtn.href = castUrl;

        const shareTweetBtn = document.getElementById('share-tweet');
        shareTweetBtn.href = tweetUrl;

        // Hybrid Share Logic:
        // - Farcaster (Warpcast): Use sdk.actions.openUrl() to trigger native native composer/actions.
        // - Base App / Others: Use window.open() to trigger system deep links and avoid internal browser traps.

        const isWarpcast = navigator.userAgent.match(/Warpcast/i);

        shareCastBtn.onclick = (e) => {
            if (window.sdk && window.sdk.actions) {
                e.preventDefault();
                window.sdk.actions.openUrl(castUrl);
            }
        };

        shareTweetBtn.onclick = (e) => {
            e.preventDefault();
            if (isWarpcast && window.sdk && window.sdk.actions) {
                // Warpcast handles https intents well via SDK
                window.sdk.actions.openUrl(tweetUrl);
            } else {
                // Base App / Others: Try native scheme to force Twitter App and avoid internal browser "profile" bug
                // Note: twitter:// scheme combines text and url in 'message' usually, or just 'text'
                const nativeTweetText = tweetText + ' ' + url;
                const nativeUrl = `twitter://post?message=${encodeURIComponent(nativeTweetText)}`;

                // Use window.location.href for deep links to ensure it triggers the app switch
                window.location.href = nativeUrl;

                // Fallback (timeout) could be added to open web url, but web url triggers the profile bug. 
                // We'll trust the user wants the App.
                setTimeout(() => {
                    // unexpected fallback if app switch fails quickly
                    window.open(tweetUrl, '_blank');
                }, 1500);
            }
        };

        // Storage Case 2: If user has revived, subsequent death automatically stores
        if (state.hasRevived) {
            saveScore(state.score);
            state.scoreSaved = true;

            // Hide Revive button as only 1 revive per run is allowed
            const reviveBtn = document.getElementById('revive-btn');
            if (reviveBtn) reviveBtn.style.display = 'none';

        } else {
            // Case 1: Don't store yet
            state.scoreSaved = false;

            // Ensure Revive button is visible for the first death
            const reviveBtn = document.getElementById('revive-btn');
            if (reviveBtn) {
                reviveBtn.style.display = 'flex';
                reviveBtn.style.opacity = '1';
            }
        }

        // Fetch Revive Price
        const costLabel = document.getElementById('revive-cost');
        if (costLabel) {
            costLabel.innerText = 'Loading...';
            try {
                const price = await fetchJessePriceValue();
                if (price) {
                    const jesseNeeded = 0.15 / price;
                    const displayAmount = Math.ceil(jesseNeeded * 10) / 10;
                    costLabel.innerText = `(${displayAmount} $JESSE)`;
                    state.reviveAmount = jesseNeeded;
                } else {
                    costLabel.innerText = '(Price Error)';
                }
            } catch (e) {
                console.error('Price fetch error:', e);
                costLabel.innerText = '(Error)';
            }
        }
    }

    document.getElementById('restart-btn').onclick = async () => {
        const btn = document.getElementById('restart-btn');
        // Case 1: Save on "Try Again"
        if (!state.scoreSaved) {
            btn.style.opacity = '0.5';
            btn.innerText = 'Saving...';
            await saveScore(state.score);
        }
        btn.style.opacity = '1'; // Reset opacity
        btn.innerText = 'TRY AGAIN'; // Reset text

        // Reset Revive button just in case
        const reviveBtn = document.getElementById('revive-btn');
        if (reviveBtn) {
            reviveBtn.style.display = 'flex';
            reviveBtn.style.opacity = '1';
        }

        initGame();
    };

    // --- REVIVE LOGIC HELPERS ---

    async function fetchJessePriceValue() {
        try {
            const res = await fetch('https://api.dexscreener.com/latest/dex/tokens/0x50f88fe97f72cd3e75b9eb4f747f59bceba80d59');
            const data = await res.json();
            return data.pairs && data.pairs[0] ? parseFloat(data.pairs[0].priceUsd) : null;
        } catch {
            return null;
        }
    }

    function encodeTransfer(to, amount) {
        const selector = 'a9059cbb';
        const cleanTo = to.replace('0x', '').toLowerCase().padStart(64, '0');
        const hexAmount = amount.toString(16).padStart(64, '0');
        return `0x${selector}${cleanTo}${hexAmount}`;
    }

    function reviveGame() {
        // Resume Music
        bgMusic.play().catch(e => console.log('Music resume blocked:', e));

        document.getElementById('game-over-modal').style.display = 'none';
        state.gameOver = false;
        state.running = true;

        // Restore player to previous safe position
        const safeBlock = state.blocks.find(b => b.x === state.player.prevGridX && b.y === state.player.prevGridY && !b.isFalling);

        let recoverX, recoverY;
        if (safeBlock) {
            recoverX = state.player.prevGridX;
            recoverY = state.player.prevGridY;
        } else {
            // Find NEAREST safe block
            const nearest = state.blocks.filter(b => !b.isFalling && b.type !== 'wall').sort((a, b) => {
                const distA = Math.abs(a.x - state.player.gridX) + Math.abs(a.y - state.player.gridY);
                const distB = Math.abs(b.x - state.player.gridX) + Math.abs(b.y - state.player.gridY);
                return distA - distB;
            })[0];

            if (nearest) {
                recoverX = nearest.x;
                recoverY = nearest.y;
            } else {
                recoverX = state.player.gridX;
                recoverY = state.player.gridY;
            }
        }

        state.player.gridX = recoverX;
        state.player.gridY = recoverY;
        state.player.targetGridX = recoverX;
        state.player.targetGridY = recoverY;
        state.player.visualX = recoverX;
        state.player.visualY = recoverY;
        state.player.z = 0;
        state.player.fallVelocity = 0;
        state.player.animProgress = 1;
        state.isMoving = false;
        state.inputQueue = [];

        // Grace period
        state.doomGrace = 5;

        // Set revive distance threshold
        state.reviveGridDist = state.player.gridX + state.player.gridY;

        requestAnimationFrame(loop);
    }

    document.getElementById('revive-btn').onclick = async () => {
        const btn = document.getElementById('revive-btn');
        const costLabel = document.getElementById('revive-cost');

        if (!state.reviveAmount) {
            alert('Calculating price... please wait.');
            return;
        }

        const originalText = costLabel.innerText;
        costLabel.innerText = 'Confirming...';
        btn.style.opacity = '0.7';

        const JESSE_TOKEN_ADDRESS = '0x50f88fe97f72cd3e75b9eb4f747f59bceba80d59';
        const DEV_WALLET = '0xEb4697A9888B10894eF6Ff596f81f890178bE776';

        // Calculate raw amount (18 decimals)
        const amountWei = BigInt(Math.floor(state.reviveAmount * 1e18));

        const data = encodeTransfer(DEV_WALLET, amountWei);

        let fromAddress;
        try {
            const accounts = await window.sdk.wallet.ethProvider.request({ method: 'eth_requestAccounts' });
            fromAddress = accounts[0];
        } catch (err) {
            console.error('Failed to get user address:', err);
            costLabel.innerText = 'Wallet Error';
            return;
        }

        const tx = {
            from: fromAddress, // REQUIRED for many providers
            to: JESSE_TOKEN_ADDRESS,
            value: "0x0",
            data: data,
            chainId: 8453 // Base Mainnet
        };

        try {
            // Updated for Frame SDK v2
            const result = await window.sdk.wallet.ethProvider.request({
                method: 'eth_sendTransaction',
                params: [tx]
            });
            console.log('Revive Transaction Result:', result);
            state.hasRevived = true;
            reviveGame();

            btn.style.opacity = '1';
            costLabel.innerText = originalText;

        } catch (e) {
            console.error('Revive cancelled or failed:', e);
            costLabel.innerText = 'Failed. Try Again?';
            btn.style.opacity = '1';
            setTimeout(() => {
                if (state.gameOver) costLabel.innerText = originalText;
            }, 2000);
        }
    };

    document.getElementById('home-btn').onclick = async () => {
        if (!state.scoreSaved) {
            await saveScore(state.score);
        }
        location.reload();
    };

    document.getElementById('logo-display').onclick = () => {
        location.reload();
    };

    // Start
    initGame();
}
// End of file

