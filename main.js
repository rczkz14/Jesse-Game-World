import sdk from 'https://esm.sh/@farcaster/frame-sdk';
import JesseJump from './games/jesse-jump/index.js';
import { startGame as startJesseJump } from './games/jesse-jump/game.js';
import VirusJesse from './games/virus-jesse/index.js';
import ProtectJesse from './games/protect-jesse/index.js';
import { supabase } from './supabaseClient.js';

const app = document.getElementById('app');

// Farcaster profile (populated via SDK)
let profile = {
  picture: './assets/farcaster.png',
  nickname: 'Guest',
};

// Try to fetch Farcaster user profile via SDK
async function fetchFarcasterProfile() {
  try {
    // Wait for context from local client
    const context = await sdk.context;
    if (context && context.user) {
      const user = context.user;
      profile = {
        picture: user.pfpUrl || './assets/farcaster.png',
        nickname: user.displayName || user.username || 'Guest Player',
        fid: user.fid || 'Unknown',
      };
      console.log('Farcaster profile loaded:', profile);
    } else {
      console.log('No Farcaster context/user found');
    }
  } catch (e) {
    console.warn('Farcaster profile fetch failed:', e);
  }
}

async function getRecentPlayers() {
  console.log('Fetching recent players from Supabase...');
  const { data, error } = await supabase
    .from('game_scores')
    .select('game_name, player_name, player_avatar, score')
    .order('created_at', { ascending: false })
    .limit(6);
  if (error) {
    console.error('Supabase error:', error);
    return [];
  }
  if (!data) {
    console.warn('Supabase returned no data');
    return [];
  }
  return data.map(row => {
    const gn = (row.game_name || '').trim().toLowerCase();
    const icon = (gn === 'jesse jump' || gn === 'jesse-jump')
      ? './assets/jesse-jump/jessejump.png'
      : (gn === 'virus jesse' || gn === 'virus-jesse')
        ? './assets/virus-jesse/virusjesse.png'
        : './assets/protect-jesse/protectjesse.png';
    return {
      game: row.game_name,
      icon: icon,
      profile: { picture: row.player_avatar || './assets/farcaster.png', nickname: row.player_name },
      score: row.score
    };
  });
}

// Fetch $JESSE token price from Dexscreener
async function fetchJessePrice() {
  try {
    const res = await fetch('https://api.dexscreener.com/latest/dex/tokens/0x50f88fe97f72cd3e75b9eb4f747f59bceba80d59');
    const data = await res.json();
    return data.pairs && data.pairs[0] ? `$${data.pairs[0].priceUsd}` : 'N/A';
  } catch {
    return 'N/A';
  }
}

function renderMainPage(jessePrice) {
  app.innerHTML = `
    <style>
      body, html { margin:0; padding:0; height:100%; }
      #bg-video { position:fixed; top:0; left:0; width:100vw; height:100vh; object-fit:cover; z-index:-1; transform:scale(1.4); }
      .main-header { position: relative; display: flex; align-items: center; padding: 20px; }
      .jesse-price { position: absolute; top: 20px; right: 20px; font-size:0.75em; font-weight:bold; background:yellow; padding:2px 8px; border-radius:8px; display: flex; align-items: center; gap: 6px; }
      .profile { display:flex; align-items:center; }
      .profile img { width:40px; height:40px; border-radius:50%; margin-right:10px; }
      .center-img { display:flex; justify-content:center; margin:30px 0; }
      .center-img img { max-width:200px; }
      .recent-ticker { width:100%; overflow:hidden; white-space:nowrap; margin-bottom:20px; padding:8px 0; }
      .ticker-content { display:inline-flex; animation:fly 10s linear infinite; width: max-content; }
      @keyframes fly { 0% { transform:translateX(0); } 100% { transform:translateX(-25%); } }
      .game-boxes { display:flex; justify-content:center; gap:30px; margin-bottom:40px; }
      .game-box { width:180px; height:220px; background:#fff8; border-radius:16px; box-shadow:0 2px 8px #0002; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; transition:box-shadow .2s; position: relative; background: #fff; width: 210px; height: 160px; }
      .game-box:hover { box-shadow:0 4px 16px #0004; }
      .game-box img { width:80px; height:80px; margin-bottom:10px; border-radius:12px; background:#fff; }
      .game-title { font-size:1.1em; font-weight:bold; margin-bottom:6px; text-align:center; }
      .coming-soon { position: absolute; top: -16px; left: 50%; transform: translateX(-50%); background: #E94F9B; color: #fff; font-size: 1em; font-weight: bold; padding: 4px 18px 4px 18px; border-radius: 18px; box-shadow: 0 2px 8px #0002; letter-spacing: 0.5px; z-index: 2; }
      .live-label { position: absolute; top: -16px; left: 50%; transform: translateX(-50%); background: #FFD600; color: #222; font-size: 1em; font-weight: bold; padding: 4px 18px 4px 18px; border-radius: 18px; box-shadow: 0 2px 8px #0002; letter-spacing: 0.5px; z-index: 2; }
    </style>
    <video id="bg-video" src="./assets/background.mp4" autoplay loop muted playsinline></video>
    <div class="main-header">
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div class="profile" id="profile-btn" style="cursor:pointer;">
          <img src="${profile.picture}" alt="Profile" />
          <span>${profile.nickname}</span>
        </div>
        <div id="achievement-btn" style="width:40px; height:40px; background:rgba(255,255,255,0.9); border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.15); display:flex; align-items:center; justify-content:center; font-size:1.4em; cursor:pointer; margin-left:2px;">
          🏆
        </div>
      </div>
    </div>
    <div id="profile-modal" style="display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:30;background:rgba(0,0,0,0.28);">
      <div style="position:absolute;top:32px;left:50%;transform:translateX(-50%);background:rgba(255,255,255,0.95);border-radius:18px;box-shadow:0 4px 24px #0004;width:340px;max-width:90vw;padding:32px 0 24px 0;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:0 24px 12px 24px;">
          <span style="font-weight:bold;font-size:1.2em;display:flex;align-items:center;"><span style="margin-right:8px;">👤</span>Profile</span>
          <button id="close-profile" style="background:none;border:none;font-size:1.4em;cursor:pointer;">✕</button>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;">
          <div style="border:4px solid #FFD600;border-radius:50%;padding:4px;margin-bottom:10px;">
            <img src="${profile.picture}" alt="Profile" style="width:90px;height:90px;border-radius:50%;" />
          </div>
          <div style="font-size:1.3em;font-weight:bold;margin-bottom:4px;">${profile.nickname}</div>
          <div style="background:#f5f5f5;padding:4px 14px;border-radius:8px;font-size:0.95em;margin-bottom:16px;">FID: ${profile.fid || 'Unknown'}</div>
        </div>
        <div style="background:#f5faff;padding:12px 18px;border-radius:12px;margin:0 24px 18px 24px;font-size:0.98em;color:#2a5bd7;font-weight:bold;">CONNECTED WALLET<br><span id="wallet-address-display" style="color:#888;font-weight:normal;">Not Connected</span></div>
          <div style="padding:0 24px;">
          <div style="font-weight:bold;color:#888;font-size:0.98em;margin-bottom:10px;">GAME STATS</div>
          <div style="background:#fff;border-radius:12px;box-shadow:0 2px 8px #0001;display:flex;align-items:center;justify-content:space-between;padding:10px 16px;margin-bottom:10px;">
            <div style="display:flex;align-items:center;"><span style="font-size:20px;margin-right:10px;">✨</span><span style="font-weight:bold;">Total Points</span></div>
            <div style="font-size:1.1em;color:#E94F9B;font-weight:900;" id="profile-points">...</div>
          </div>
          <div style="background:#fff;border-radius:12px;box-shadow:0 2px 8px #0001;display:flex;align-items:center;justify-content:space-between;padding:10px 16px;margin-bottom:10px;">
            <div style="display:flex;align-items:center;"><img src="./assets/jesse-jump/jessejump.png" style="width:32px;height:32px;margin-right:10px;" /><span style="font-weight:bold;">Jesse Jump</span></div>
            <div style="font-size:1em;color:#222;font-weight:bold;">Best Score <span id="best-score-display" style="font-size:1.1em;">0m</span></div>
          </div>
          <div style="background:#f5f5f5;border-radius:12px;display:flex;align-items:center;justify-content:space-between;padding:10px 16px;margin-bottom:10px;opacity:0.7;">
            <div style="display:flex;align-items:center;"><img src="./assets/virus-jesse/virusjesse.png" style="width:32px;height:32px;margin-right:10px;filter:grayscale(1);" /><span style="font-weight:bold;color:#888;">Virus Jesse</span></div>
            <div style="font-size:1em;color:#888;font-weight:bold;background:#eee;padding:2px 12px;border-radius:8px;">Coming Soon</div>
          </div>
          <div style="background:#f5f5f5;border-radius:12px;display:flex;align-items:center;justify-content:space-between;padding:10px 16px;opacity:0.7;">
            <div style="display:flex;align-items:center;"><img src="./assets/protect-jesse/protectjesse.png" style="width:32px;height:32px;margin-right:10px;filter:grayscale(1);" /><span style="font-weight:bold;color:#888;">Protect Jesse</span></div>
            <div style="font-size:1em;color:#888;font-weight:bold;background:#eee;padding:2px 12px;border-radius:8px;">Coming Soon</div>
          </div>
        </div>
      </div>
    </div>
    <div class="jesse-price">
      <img src="/assets/jessepp.png" alt="$JESSE" style="width:28px;height:28px;vertical-align:middle;border-radius:6px;object-fit:cover;display:inline-block;" />
      <span>$JESSE: ${jessePrice}</span>
    </div>
    <div class="center-img">
      <img src="./assets/jgw.png" alt="JGW" />
    </div>
    <div class="recent-ticker">
      <div class="ticker-content" id="ticker-content">
        Loading recent players...
      </div>
    </div>
    <div class="game-boxes">
      <div class="game-box" id="jesse-jump-box">
        <div class="live-label">Live</div>
        <img src="./assets/jesse-jump/jessejump.png" alt="Jesse Jump" />
        <div class="game-title">Jesse Jump</div>
      </div>
      <div class="game-box">
        <div class="coming-soon">Soon</div>
        <img src="./assets/virus-jesse/virusjesse.png" alt="Virus Jesse" />
        <div class="game-title">Virus Jesse</div>
      </div>
      <div class="game-box">
        <div class="coming-soon">Soon</div>
        <img src="./assets/protect-jesse/protectjesse.png" alt="Protect Jesse" />
        <div class="game-title">Protect Jesse</div>
      </div>
    </div>
    <div id="jesse-jump-modal-container"></div>
    <button id="readme-btn" style="position:fixed;bottom:18px;right:18px;z-index:10;min-width:60px;height:22px;background:#fff;color:#E94F9B;font-weight:bold;border:none;border-radius:12px;box-shadow:0 2px 8px #0002;cursor:pointer;font-size:0.7em;display:flex;align-items:center;justify-content:center;white-space:nowrap;padding:0 10px;">Read Me</button>
    <div id="readme-modal" style="display:none;position:fixed;bottom:60px;right:24px;z-index:20;background:#fff;padding:16px 14px 14px 14px;border-radius:12px;box-shadow:0 4px 24px #0004;max-width:260px;width:80vw;font-size:0.95em;overflow-wrap:break-word;box-sizing:border-box;">
      <div style="margin-bottom:8px;">This project uses the $JESSE token for in-app features and for fun.</div>
      <div style="margin-bottom:8px;">Contract : <span style="font-family:monospace;">0x50f88fe97f72cd3e75b9eb4f747f59bceba80d59</span></div>
      <div style="color:#E94F9B;font-weight:bold;">Tip : Transact with $JESSE only for micro value. DYOR</div>
      <button id="close-readme" style="margin-top:12px;padding:4px 14px;background:#E94F9B;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:bold;font-size:0.9em;">Close</button>
    </div>
    <div id="achievement-modal-container"></div>
  `;

  requestAnimationFrame(() => {
    // Readme logic
    const btn = document.getElementById('readme-btn');
    const modal = document.getElementById('readme-modal');
    const closeBtn = document.getElementById('close-readme');
    if (btn && modal && closeBtn) {
      btn.onclick = () => { modal.style.display = 'block'; };
      closeBtn.onclick = () => { modal.style.display = 'none'; };
    }
    // Profile logic
    const profileBtn = document.getElementById('profile-btn');
    const profileModal = document.getElementById('profile-modal');
    const closeProfile = document.getElementById('close-profile');
    if (profileBtn && profileModal && closeProfile) {
      profileBtn.onclick = async () => {
        profileModal.style.display = 'block';

        const walletDisplay = document.getElementById('wallet-address-display');
        const scoreDisplay = document.getElementById('best-score-display');
        const pointsDisplay = document.getElementById('profile-points');

        // Fetch Points
        if (pointsDisplay) {
          pointsDisplay.innerText = 'Loading...';
          if (profile.fid) {
            const { data } = await supabase.from('player_stats').select('points').eq('player_fid', profile.fid).maybeSingle();
            const pts = data ? (data.points || 0) : 0;
            pointsDisplay.innerText = pts + ' PTS';
          } else {
            pointsDisplay.innerText = '0 PTS';
          }
        }

        // 1. Fetch Wallet Address
        if (walletDisplay) {
          walletDisplay.innerText = 'Connecting...';
          try {
            const result = await sdk.wallet.ethProvider.request({ method: 'eth_requestAccounts' });
            if (result && result.length > 0) {
              const addr = result[0];
              walletDisplay.innerText = addr.slice(0, 6) + '...' + addr.slice(-4);
              // Add Copy ability? Maybe later
            } else {
              walletDisplay.innerText = 'Not Connected';
            }
          } catch (e) {
            console.warn('Wallet fetch failed', e);
            walletDisplay.innerText = 'Not Connected';
          }
        }

        // 2. Fetch Best Score
        if (scoreDisplay) {
          scoreDisplay.innerText = '...';
          // We use nickname matching because that is how we saved it. Optimally should use FID.
          // game.js saves player_name.
          if (profile.nickname && profile.nickname !== 'Guest') {
            const { data, error } = await supabase
              .from('game_scores')
              .select('score')
              .eq('game_name', 'jesse-jump')
              .eq('player_name', profile.nickname)
              .order('score', { ascending: false })
              .limit(1);

            if (data && data.length > 0) {
              scoreDisplay.innerText = data[0].score + 'm';
            } else {
              scoreDisplay.innerText = '0m';
            }
          } else {
            scoreDisplay.innerText = '0m';
          }
        }
      };
      closeProfile.onclick = () => { profileModal.style.display = 'none'; };
    }

    // Jesse Jump modal logic
    const jjBox = document.getElementById('jesse-jump-box');
    const jjModalContainer = document.getElementById('jesse-jump-modal-container');
    if (jjBox && jjModalContainer) {
      jjBox.onclick = () => {
        jjModalContainer.innerHTML = '<div id="jj-modal-bg" style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:100;background:rgba(0,0,0,0.18);display:flex;align-items:center;justify-content:center;">' + JesseJump() + '</div>';
        setTimeout(() => {
          const closeBtn = document.getElementById('close-jj-modal');
          if (closeBtn) {
            closeBtn.onclick = async () => {
              jjModalContainer.innerHTML = '';

              // Refresh Ticker on Close
              try {
                const updatedPlayers = await getRecentPlayers();
                const ticker = document.getElementById('ticker-content');
                if (ticker && updatedPlayers.length > 0) {
                  let players = [...updatedPlayers];
                  while (players.length < 6) players = players.concat(updatedPlayers);
                  players = players.slice(0, 6);

                  const singleSet = players.map(p =>
                    `<div style="display:inline-flex;align-items:center;background:rgba(255,255,255,0.9);backdrop-filter:blur(4px);padding:6px 16px;border-radius:30px;margin-right:24px;box-shadow:0 2px 8px rgba(0,0,0,0.15);border:1px solid rgba(255,255,255,0.8);">
                      <img src="${p.icon}" style="width:28px;height:28px;margin-right:10px;border-radius:6px;object-fit:cover;" />
                      <img src="${p.profile.picture}" style="width:28px;height:28px;border-radius:50%;margin-right:10px;border:1px solid rgba(0,0,0,0.1);object-fit:cover;" />
                      <span style="font-weight:bold;color:#333;margin-right:8px;font-size:0.95em;">${p.profile.nickname}</span>
                      <span style="font-weight:900;color:#E94F9B;font-size:1em;">${p.score}m</span>
                    </div>`
                  ).join('');
                  ticker.innerHTML = singleSet.repeat(4);
                }
              } catch (e) { console.warn('Ticker refresh failed', e); }
            };
          }
          const startBtn = document.getElementById('start-jj-game');
          if (startBtn) {
            startBtn.onclick = () => {
              // Close modal and start game directly
              jjModalContainer.innerHTML = '';
              startJesseJump();
            };
          }
          const leaderboardBtn = document.getElementById('jj-leaderboard');
          const leaderboardModalContainer = document.getElementById('jj-leaderboard-modal-container');
          if (leaderboardBtn && leaderboardModalContainer) {
            leaderboardBtn.onclick = async () => {
              leaderboardModalContainer.innerHTML = `
                <style>
                  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
                  .pixel-font { font-family: 'Press Start 2P', cursive; }
                  .rank-1 { color: #FFD700; text-shadow: 2px 2px #000; } /* Gold */
                  .rank-2 { color: #C0C0C0; text-shadow: 2px 2px #000; } /* Silver */
                  .rank-3 { color: #CD7F32; text-shadow: 2px 2px #000; } /* Bronze */
                  .rank-item {
                    display: flex;
                    align-items: center;
                    background: rgba(0,0,0,0.3);
                    margin-bottom: 12px;
                    padding: 12px;
                    border: 4px solid #fff;
                    image-rendering: pixelated;
                    box-shadow: 4px 4px 0px rgba(0,0,0,0.5);
                    transition: transform 0.1s;
                  }
                  .rank-item:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0px rgba(0,0,0,0.5); }
                </style>
                <div id="jj-leaderboard-modal" style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:200;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;">
                  <div class="pixel-font" style="background:#2d3448;color:#fff;width:90%;max-width:380px;border: 4px solid #fff; padding:20px;position:relative;box-shadow:0 10px 40px rgba(0,0,0,0.8);image-rendering:pixelated;">
                    <button id="close-jj-leaderboard" style="position:absolute;top:-20px;right:-20px;background:#E94F9B;border:4px solid #fff;color:#fff;font-family:'Press Start 2P';font-size:12px;cursor:pointer;padding:12px;box-shadow:4px 4px 0 #000;">X</button>
                    <div style="font-size:18px;margin-bottom:24px;text-align:center;text-shadow:3px 3px 0 #000;color:#55dbcb;">LEADERBOARD</div>
                    <div id="jj-leaderboard-content" style="max-height:50vh;overflow-y:auto;min-height:150px;font-size:12px;padding-right:8px;">
                      <div style="text-align:center;padding:20px;">LOADING...</div>
                    </div>
                  </div>
                </div>
              `;
              setTimeout(async () => {
                const closeLbBtn = document.getElementById('close-jj-leaderboard');
                if (closeLbBtn) {
                  closeLbBtn.onclick = () => {
                    leaderboardModalContainer.innerHTML = '';
                  };
                }
                // Fetch leaderboard data
                try {
                  const { data, error } = await supabase
                    .from('game_scores')
                    .select('player_name, player_avatar, score')
                    .eq('game_name', 'jesse-jump')
                    .order('score', { ascending: false })
                    .limit(5);

                  const content = document.getElementById('jj-leaderboard-content');

                  if (error || !data) {
                    content.innerHTML = '<div style="color:#E94F9B;text-align:center;">Failed to load.</div>';
                    return;
                  }
                  if (data.length === 0) {
                    content.innerHTML = '<div style="text-align:center;">No scores yet.</div>';
                    return;
                  }

                  content.innerHTML = data.map(function (row, i) {
                    let rankStyle = '';
                    let rankIcon = `<span style="width:24px;display:inline-block;text-align:center;margin-right:8px;">#${i + 1}</span>`;

                    if (i === 0) {
                      rankStyle = 'rank-1';
                      rankIcon = `<span style="font-size:20px;width:24px;display:inline-block;margin-right:8px;">🏆</span>`;
                    } else if (i === 1) {
                      rankStyle = 'rank-2';
                      rankIcon = `<span style="font-size:20px;width:24px;display:inline-block;margin-right:8px;">🥈</span>`;
                    } else if (i === 2) {
                      rankStyle = 'rank-3';
                      rankIcon = `<span style="font-size:20px;width:24px;display:inline-block;margin-right:8px;">🥉</span>`;
                    }

                    return `
                        <div class="rank-item ${rankStyle}">
                          ${rankIcon}
                          <img src="${row.player_avatar || './assets/farcaster.png'}" style="width:32px;height:32px;border:2px solid #fff;margin-right:12px;object-fit:cover;background:#000;">
                          <div style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-right:8px;">
                            ${row.player_name}
                          </div>
                          <div style="color:#fff;text-shadow:2px 2px 0 #000;">${row.score}m</div>
                        </div>
                      `;
                  }).join('');
                } catch (e) {
                  const content = document.getElementById('jj-leaderboard-content');
                  if (content) content.innerHTML = '<div style="color:#E94F9B;text-align:center;">Error loading.</div>';
                }
              }, 0);
            };
          }
        }, 0);
      };
    }

    // Achievement Modal Logic
    const achievementBtn = document.getElementById('achievement-btn');
    const achievementContainer = document.getElementById('achievement-modal-container');

    if (achievementBtn && achievementContainer) {
      achievementBtn.onclick = () => {
        // Render Hub
        renderAchievementHub();
      };

      function renderAchievementHub() {
        achievementContainer.innerHTML = `
          <div id="ach-modal-bg" style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:200;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;">
             <style>
               @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
               .pixel-font { font-family: 'Press Start 2P', cursive; }
               .pixel-card { 
                  background: #fff;
                  border: 4px solid #000;
                  box-shadow: 8px 8px 0px rgba(0,0,0,0.5);
                  image-rendering: pixelated;
               }
               .pixel-btn {
                  border: 4px solid #000;
                  background: #E94F9B;
                  color: #fff;
                  font-family: 'Press Start 2P';
                  cursor: pointer;
                  box-shadow: 4px 4px 0px #000;
                  transition: transform 0.1s;
               }
               .pixel-btn:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0px #000; }
               .pixel-list-item {
                  border: 4px solid #eee;
                  background: #fff;
                  margin-bottom: 12px;
                  cursor: pointer;
                  transition: transform 0.1s;
                  box-shadow: 4px 4px 0px #ddd;
               }
               .pixel-list-item:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0px #ccc; border-color:#000; }
               .pixel-list-item:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0px #ccc; }
             </style>
            <div class="pixel-card" style="width:90%;max-width:380px;border-radius:0;padding:20px;position:relative;animation:popIn 0.2s;">
              <button id="close-ach" class="pixel-btn" style="position:absolute;top:-20px;right:-20px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:16px;">X</button>
              
              <div style="text-align:center;margin-bottom:24px;">
                <div class="pixel-font" style="font-size:16px;color:#000;margin-bottom:8px;line-height:1.5;">ACHIEVEMENTS</div>
                <div class="pixel-font" style="font-size:9px;color:#666;">SELECT CATEGORY</div>
              </div>

              <div style="display:flex;flex-direction:column;gap:12px;">
                
                <!-- Jesee Jump Card -->
                <div id="ach-jesse-jump" class="pixel-list-item" style="padding:12px;display:flex;align-items:center;">
                   <img src="./assets/jesse-jump/jessejump.png" style="width:40px;height:40px;border:2px solid #000;margin-right:12px;">
                   <div style="flex:1;">
                     <div class="pixel-font" style="font-size:10px;color:#000;margin-bottom:6px;">JESSE JUMP</div>
                     <div class="pixel-font" style="font-size:8px;color:#666;">Distance Badges</div>
                   </div>
                   <div class="pixel-font" style="font-size:12px;">&gt;</div>
                </div>

                <!-- Virus Jesse (Disabled) -->
                <div style="background:#ddd;border:4px solid #bbb;padding:12px;display:flex;align-items:center;opacity:0.8;">
                   <img src="./assets/virus-jesse/virusjesse.png" style="width:40px;height:40px;border:2px solid #999;margin-right:12px;filter:grayscale(1);">
                   <div style="flex:1;">
                     <div class="pixel-font" style="font-size:10px;color:#777;margin-bottom:6px;">VIRUS JESSE</div>
                     <div class="pixel-font" style="font-size:8px;color:#888;">Coming Soon</div>
                   </div>
                </div>

                <!-- Protect Jesse (Disabled) -->
                <div style="background:#ddd;border:4px solid #bbb;padding:12px;display:flex;align-items:center;opacity:0.8;">
                   <img src="./assets/protect-jesse/protectjesse.png" style="width:40px;height:40px;border:2px solid #999;margin-right:12px;filter:grayscale(1);">
                   <div style="flex:1;">
                     <div class="pixel-font" style="font-size:10px;color:#777;margin-bottom:6px;">PROTECT JESSE</div>
                     <div class="pixel-font" style="font-size:8px;color:#888;">Coming Soon</div>
                   </div>
                </div>

                <!-- Spending Rewards Card -->
                <div id="ach-spending" class="pixel-list-item" style="padding:12px;display:flex;align-items:center;background:#ffffff;border-color:#E94F9B;">
                   <img src="./assets/jessepp.png" style="width:40px;height:40px;border:2px solid #000;margin-right:12px;">
                   <div style="flex:1;">
                     <div class="pixel-font" style="font-size:10px;color:#E94F9B;margin-bottom:6px;">$JESSE REWARDS</div>
                     <div class="pixel-font" style="font-size:8px;color:#666;">Spending Milestones</div>
                   </div>
                   <div class="pixel-font" style="font-size:12px;">&gt;</div>
                </div>

              </div>
            </div>
          </div>
          <style>@keyframes popIn { 0% { opacity:0; transform:scale(0.9); } 100% { opacity:1; transform:scale(1); } }</style>
        `;

        setTimeout(() => {
          const closeBtn = document.getElementById('close-ach');
          const jjCard = document.getElementById('ach-jesse-jump');
          const spendingCard = document.getElementById('ach-spending');

          if (closeBtn) {
            closeBtn.onclick = () => { achievementContainer.innerHTML = ''; };
          }
          if (jjCard) {
            jjCard.onclick = () => { renderCategoryAchievements('jesse-jump'); };
          }
          if (spendingCard) {
            spendingCard.onclick = () => { renderCategoryAchievements('spending'); };
          }
        }, 0);
      }

      async function renderCategoryAchievements(category) {
        // Loading State
        achievementContainer.innerHTML = `
          <div style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:200;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;">
             <div class="pixel-font" style="color:#fff;font-size:12px;text-align:center;">
               LOADING DATA...<br><br>Please Wait
             </div>
          </div>
        `;

        let currentValue = 0;
        let badges = [];
        let title = '';
        let claimedIds = new Set();

        try {
          if (!profile.fid) throw new Error('No FID');

          // 1. Fetch Claimed Badges
          const { data: claims } = await supabase
            .from('claimed_achievements')
            .select('achievement_id')
            .eq('player_fid', profile.fid);

          if (claims) {
            claims.forEach(c => claimedIds.add(c.achievement_id));
          }

          if (category === 'jesse-jump') {
            title = 'DISTANCE RUN';
            // Get Best Score
            if (profile.nickname !== 'Guest') {
              const { data: scoreData } = await supabase
                .from('game_scores')
                .select('score')
                .eq('game_name', 'jesse-jump')
                .eq('player_name', profile.nickname)
                .order('score', { ascending: false })
                .limit(1);
              if (scoreData && scoreData.length > 0) currentValue = scoreData[0].score;
            }
            badges = [
              { id: 'jump_1', name: 'FIRST HOP', desc: 'Reach 1m', req: 1, icon: '🥉', points: 10 },
              { id: 'jump_300', name: 'CLOUD JUMP', desc: 'Reach 300m', req: 300, icon: '🥈', points: 50 },
              { id: 'jump_750', name: 'SKY HIGH', desc: 'Reach 750m', req: 750, icon: '🥇', points: 100 },
              { id: 'jump_1000', name: 'MOON WALK', desc: 'Reach 1000m', req: 1000, icon: '🚀', points: 250 },
              { id: 'jump_2000', name: 'GALACTIC', desc: 'Reach 2000m', req: 2000, icon: '🪐', points: 500 },
              { id: 'jump_3000', name: 'GOD MODE', desc: 'Reach 3000m', req: 3000, icon: '👑', points: 1000 }
            ];
          }
          else if (category === 'spending') {
            title = '$JESSE SPENT';
            // Get Spending
            const { data: statData } = await supabase
              .from('player_stats')
              .select('total_jesse_spent')
              .eq('player_fid', profile.fid)
              .maybeSingle();
            if (statData) currentValue = parseFloat(statData.total_jesse_spent) || 0;

            badges = [
              { id: 'spend_1', name: 'SUPPORTER', desc: 'Spend 1 $JESSE', req: 1, icon: '💸' },
              { id: 'spend_50', name: 'INVESTOR', desc: 'Spend 50 $JESSE', req: 50, icon: '🎩' },
              { id: 'spend_250', name: 'DIAMOND', desc: 'Spend 250 $JESSE', req: 250, icon: '💎' },
              { id: 'spend_1000', name: 'WHALE', desc: 'Spend 1000 $JESSE', req: 1000, icon: '🐳' }
            ];
          }

        } catch (e) {
          console.warn('Ach fetch error', e);
        }

        const renderBadgeItem = (b) => {
          const unlocked = currentValue >= b.req;
          const isClaimed = claimedIds.has(b.id);

          // Visual States
          // 1. Locked: Greyed out, Lock icon
          // 2. Unlocked (Not Claimed): Color, 'CLAIM' button active
          // 3. Claimed: Color, 'CLAIMED' button disabled green

          let btnHtml = '';
          if (!unlocked) {
            btnHtml = `<button class="pixel-btn" style="background:#ccc;border-color:#999;color:#666;font-size:8px;padding:8px;cursor:not-allowed;" disabled>LOCKED</button>`;
          } else if (isClaimed) {
            btnHtml = `<button class="pixel-btn" style="background:#55dbcb;border-color:#000;color:#000;font-size:8px;padding:8px;cursor:default;" disabled>CLAIMED</button>`;
          } else {
            // Unlocked & Unclaimed
            btnHtml = `<button id="btn-${b.id}" class="pixel-btn" style="font-size:8px;padding:8px;" onclick="claimBadge('${b.id}')">CLAIM</button>`;
          }

          const iconStyle = unlocked ? '' : 'filter:grayscale(1);opacity:0.5;';

          return `
             <div style="border:4px solid #000;background:${unlocked ? '#fff' : '#eee'};padding:12px;margin-bottom:12px;display:flex;align-items:center;box-shadow:4px 4px 0px rgba(0,0,0,0.2);">
               <div style="font-size:24px;margin-right:12px;${iconStyle}">${b.icon}</div>
               <div style="flex:1;">
                 <div class="pixel-font" style="font-size:10px;color:#000;margin-bottom:6px;">${b.name}</div>
                 <div class="pixel-font" style="font-size:8px;color:#666;">${b.desc}</div>
                 <div class="pixel-font" style="font-size:8px;color:#E94F9B;margin-top:2px;">+${b.points || 0} PTS</div>
                 ${!unlocked ? `<div class="pixel-font" style="font-size:7px;color:#aaa;margin-top:4px;">${Math.floor(currentValue)} / ${b.req}</div>` : ''}
               </div>
               <div>${btnHtml}</div>
             </div>
           `;
        };

        // Attach global function for claim onclick (hacky but works for template string)
        window.claimBadge = async (badgeId) => {
          const btn = document.getElementById(`btn-${badgeId}`);
          if (btn) {
            btn.innerText = '...';
            btn.disabled = true;
          }
          try {
            const { error } = await supabase.from('claimed_achievements').insert({
              player_fid: profile.fid,
              achievement_id: badgeId
            });
            // Treat Duplicate Key (23505) as Success
            if (!error || error.code === '23505') {
              if (btn) {
                btn.innerText = 'CLAIMED';
                btn.style.background = '#55dbcb';
                btn.style.color = '#000';
                btn.style.cursor = 'default';
                claimedIds.add(badgeId); // Update local state strictly
                // Award Points
                const item = badges.find(b => b.id === badgeId);
                if (item && item.points) {
                  awardPoints(item.points);
                }
              }
            } else {
              console.error(error);
              alert('Claim Error: ' + (error.message || error.code));
              if (btn) { btn.innerText = 'ERROR'; btn.disabled = false; }
            }
          } catch (e) {
            console.error(e);
            if (btn) { btn.innerText = 'ERROR'; btn.disabled = false; }
          }
        };

        const html = `
          <div style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:200;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;">
             <div class="pixel-card" style="width:90%;max-width:380px;height:70vh;border-radius:0;position:relative;display:flex;flex-direction:column;padding:0;">
                
                <!-- Header -->
                <div style="padding:16px;border-bottom:4px solid #000;background:#E94F9B;display:flex;align-items:center;">
                   <button id="back-to-hub" class="pixel-btn" style="font-size:12px;padding:6px;margin-right:12px;background:#fff;color:#000;">&lt;</button>
                   <div class="pixel-font" style="color:#fff;font-size:12px;">${title}</div>
                </div>

                <div style="flex:1;overflow-y:auto;padding:16px;background:#f0f0f0;">
                   ${badges.map(renderBadgeItem).join('')}
                </div>
             </div>
          </div>
        `;

        achievementContainer.innerHTML = html;

        setTimeout(() => {
          const backBtn = document.getElementById('back-to-hub');
          if (backBtn) backBtn.onclick = () => renderAchievementHub();
        }, 0);
      }
    }
  });
}

// Check if we are in a supported environment (Farcaster/BaseApp)
// We utilize UA check + context race to be robust
async function checkEnvironment() {
  // 1. Trust User Agent if it explicitly says Warpcast/Farcaster
  if (/Warpcast|Farcaster/i.test(navigator.userAgent)) {
    return true;
  }

  // 2. Fallback: Check if sdk.context resolves within a timeout
  // Increased timeout to 3500ms to verify slower connections/clients
  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 3500));
  try {
    const context = await Promise.race([sdk.context, timeout]);
    return !!context;
  } catch (e) {
    return false;
  }
}

function renderGateScreen() {
  const deepLink = 'https://warpcast.com/~/frames/launch?url=https%3A%2F%2Fjesse-game-world.vercel.app';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(deepLink)}`;

  app.innerHTML = `
    <style>
      body, html { margin:0; padding:0; height:100%; background: #f0f2f5; color: #333; font-family: 'Inter', sans-serif; }
      .gate-container { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; padding:20px; text-align:center; background: radial-gradient(circle at center, #ffffff 0%, #f0f2f5 100%); }
      .logo { width:120px; height:auto; margin-bottom:20px; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.1)); }
      .title { font-size:1.6em; font-weight:800; margin-bottom:30px; color: #1a1a1a; letter-spacing: -0.5px; }
      .qr-block { background: white; padding: 16px; border-radius: 20px; margin-bottom: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid rgba(0,0,0,0.05); }
      .qr-code { width:200px; height:200px; display: block; border-radius: 8px; }
      .action-btn { background: linear-gradient(135deg, #E94F9B, #D63384); color:white; border:none; padding:16px 32px; font-size:1.1em; font-weight:bold; border-radius:30px; text-decoration:none; display:inline-block; box-shadow:0 8px 20px rgba(233,79,155,0.35); transition: transform 0.2s, box-shadow 0.2s; }
      .action-btn:active { transform: scale(0.98); box-shadow:0 4px 10px rgba(233,79,155,0.2); }
      .note { margin-top: 24px; font-size: 0.9em; color: #666; font-weight: 500; }
    </style>
    <div class="gate-container">
      <img src="./assets/jgw.png" alt="JGW" class="logo" />
      <div class="title">Play Jesse Game World<br>on Farcaster</div>
      
      <div class="qr-block">
        <img src="${qrCodeUrl}" alt="Scan to Play" class="qr-code" />
      </div>
      
      <a href="${deepLink}" class="action-btn">Open MiniApp</a>

      <div class="note">Scan Code or Click Button</div>
    </div>
  `;
  document.body.style.background = '#f0f2f5';
}

document.addEventListener('DOMContentLoaded', async () => {
  window.sdk = sdk;

  // 1. Immediate Environment Check
  const isFarcasterEnv = await checkEnvironment();

  if (isFarcasterEnv) {
    // 2. Render IMMEDIATELY with defaults to clear the splash screen (black screen)
    // We don't wait for profile/price data here.
    renderMainPage('Loading...');

    // 3. Clear Splash Screen
    try {
      sdk.actions.ready();
    } catch (e) {
      console.error('Failed to call sdk.actions.ready:', e);
    }

    // 4. Background Data Fetching
    // We can update the UI once data arrives
    (async () => {
      try {
        const [pricePromise, profilePromise] = [
          fetchJessePrice(),
          fetchFarcasterProfile()
        ];

        // Wait for both, but dont block the UI thread which is already rendered
        const price = await pricePromise;
        await profilePromise; // This updates the global 'profile' object

        // Re-render with real data
        console.log('Data loaded, re-rendering...');
        renderMainPage(price || 'N/A');

        // Re-attach listeners is handled by renderMainPage re-running

        // Load Ticker logic
        const originalPlayers = await getRecentPlayers();
        const ticker = document.getElementById('ticker-content');
        if (ticker && originalPlayers.length > 0) {
          let players = [...originalPlayers];
          while (players.length < 6) players = players.concat(originalPlayers);
          players = players.slice(0, 6);

          const singleSet = players.map(p =>
            `<div style="display:inline-flex;align-items:center;background:rgba(255,255,255,0.9);backdrop-filter:blur(4px);padding:6px 16px;border-radius:30px;margin-right:24px;box-shadow:0 2px 8px rgba(0,0,0,0.15);border:1px solid rgba(255,255,255,0.8);">
              <img src="${p.icon}" style="width:28px;height:28px;margin-right:10px;border-radius:6px;object-fit:cover;" />
              <img src="${p.profile.picture}" style="width:28px;height:28px;border-radius:50%;margin-right:10px;border:1px solid rgba(0,0,0,0.1);object-fit:cover;" />
              <span style="font-weight:bold;color:#333;margin-right:8px;font-size:0.95em;">${p.profile.nickname}</span>
              <span style="font-weight:900;color:#E94F9B;font-size:1em;">${p.score}m</span>
            </div>`
          ).join('');
          ticker.innerHTML = singleSet.repeat(4);
        }

        // Initialize Daily Tasks
        initDailyTasks();

      } catch (err) {
        console.warn('Background data fetch error:', err);
      }
    })();

  } else {
    // Browser environment
    renderGateScreen();
  }
});

// --- DAILY TASKS SYSTEM ---
function initDailyTasks() {
  const btnContainer = document.querySelector('.main-header > div');
  if (btnContainer) {
    const dailyBtn = document.createElement('div');
    dailyBtn.id = 'daily-btn';
    dailyBtn.style.cssText = 'width:40px; height:40px; background:rgba(255,255,255,0.9); border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.15); display:flex; align-items:center; justify-content:center; font-size:1.4em; cursor:pointer; margin-left:2px; margin-top:12px;';
    dailyBtn.innerHTML = '📅';
    dailyBtn.onclick = openDailyTasks;
    btnContainer.appendChild(dailyBtn);
  }
}

function getDailyState() {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const key = `jgw_daily_${today}`;
  try {
    return JSON.parse(localStorage.getItem(key)) || { play: false, cast: false, tweet: false, spend: false };
  } catch {
    return { play: false, cast: false, tweet: false, spend: false };
  }
}

function setDailyTaskComplete(task) {
  const today = new Date().toISOString().slice(0, 10);
  const key = `jgw_daily_${today}`;
  const state = getDailyState();
  if (!state[task]) {
    state[task] = true;
    localStorage.setItem(key, JSON.stringify(state));
    // Award Daily Points (50)
    if (window.awardPoints) window.awardPoints(50);

    // Refresh modal if open
    if (document.getElementById('daily-modal-bg')) {
      openDailyTasks();
    }
  }
}

// Global Award Points Helper
window.awardPoints = async (amount) => {
  if (!profile.fid) return;
  console.log('Awarding points: ', amount);
  try {
    await supabase.rpc('add_points', { p_fid: profile.fid, p_amount: amount });
    // Optional: Toast notification could go here
  } catch (e) {
    console.error('Point award failed', e);
  }
};

// Hook into game start
const originalStart = startJesseJump;
startJesseJump = function () {
  setDailyTaskComplete('play');
  originalStart.apply(this, arguments);
};

async function openDailyTasks() {
  let state = getDailyState(); // { play, cast, tweet, spend }
  const container = document.getElementById('achievement-modal-container'); // Reuse container
  if (!container) return;

  // Show Loading
  container.innerHTML = `
    <div id="daily-loading" style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:200;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;">
       <div style="font-family:'Press Start 2P', cursive;color:#fff;font-size:12px;">CHECKING LOGS...</div>
    </div>
  `;

  // Verify Spending Task via Supabase
  if (!state.spend && profile.fid) {
    try {
      const { data, error } = await supabase
        .from('player_stats')
        .select('updated_at')
        .eq('player_fid', profile.fid)
        .maybeSingle();

      if (data && data.updated_at) {
        const lastUpdate = new Date(data.updated_at).toISOString().slice(0, 10);
        const today = new Date().toISOString().slice(0, 10);
        if (lastUpdate === today) {
          setDailyTaskComplete('spend');
          state = getDailyState(); // Refresh state
        }
      }
    } catch (e) {
      console.warn('Failed to verify daily spend:', e);
    }
  }

  const renderTask = (id, name, desc, isDone, actionFn, actionLabel) => {
    const btnColor = isDone ? '#55dbcb' : '#E94F9B';
    const btnText = isDone ? 'DONE' : actionLabel;
    const btnCursor = isDone ? 'default' : 'pointer';

    // Pixel verification checkmark
    const check = isDone ? '✅' : '⏳';

    return `
      <div class="pixel-list-item" style="padding:12px;display:flex;align-items:center;margin-bottom:12px;background:#fff;border:4px solid #eee;box-shadow:4px 4px 0 #ddd;">
         <div style="font-size:20px;margin-right:12px;">${check}</div>
         <div style="flex:1;">
           <div class="pixel-font" style="font-size:10px;color:#000;margin-bottom:6px;">${name}</div>
           <div class="pixel-font" style="font-size:8px;color:#666;">${desc}</div>
           <div class="pixel-font" style="font-size:8px;color:#E94F9B;margin-top:2px;">+50 PTS</div>
         </div>
         <button id="task-btn-${id}" class="pixel-btn" 
           style="font-size:8px;padding:8px;background:${btnColor};border-color:#000;color:${isDone ? '#000' : '#fff'};cursor:${btnCursor};width:60px;"
           ${isDone ? 'disabled' : ''}>
           ${btnText}
         </button>
      </div>
    `;
  };

  const html = `
    <div id="daily-modal-bg" style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:200;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;">
       <div class="pixel-card" style="width:90%;max-width:380px;border-radius:0;padding:20px;position:relative;background:#fff;border:4px solid #000;box-shadow:8px 8px 0 rgba(0,0,0,0.5);">
         <button id="close-daily" class="pixel-btn" style="position:absolute;top:-20px;right:-20px;width:40px;height:40px;font-size:16px;">X</button>
         
         <div style="text-align:center;margin-bottom:24px;">
           <div class="pixel-font" style="font-size:16px;color:#000;border-bottom:4px solid #FFD600;display:inline-block;padding-bottom:4px;">DAILY TASKS</div>
         </div>

         <div style="display:flex;flex-direction:column;">
           ${renderTask('play', 'PLAY JESSE JUMP', 'Play one game session', state.play, '', 'GO')}
           ${renderTask('cast', 'CAST ON WARPCAST', 'Share your journey', state.cast, '', 'CAST')}
           ${renderTask('tweet', 'TWEET ABOUT US', 'Spread the word on X', state.tweet, '', 'TWEET')}
           ${renderTask('spend', 'USE $JESSE', 'Spend any amount today', state.spend, '', 'USE')}
         </div>
         
         <div class="pixel-font" style="font-size:8px;color:#aaa;text-align:center;margin-top:16px;">
           Resets every day at 00:00 UTC
         </div>
       </div>
    </div>
  `;

  container.innerHTML = html;

  // Bind Events
  setTimeout(() => {
    const closeBtn = document.getElementById('close-daily');
    if (closeBtn) closeBtn.onclick = () => container.innerHTML = '';

    if (!state.play) {
      document.getElementById('task-btn-play').onclick = () => {
        container.innerHTML = '';
        startJesseJump();
      };
    }

    if (!state.cast) {
      document.getElementById('task-btn-cast').onclick = () => {
        const text = "Daily Quest: Verified! ✅\n\nPlaying Jesse Jump and climbing the ranks. 🪐\n\nPlay now! 👇";
        const url = "https://warpcast.com/~/compose?text=" + encodeURIComponent(text) + "&embeds[]=" + encodeURIComponent("https://jesse-game-world.vercel.app");
        window.open(url, '_blank');
        setDailyTaskComplete('cast');
      };
    }

    if (!state.tweet) {
      document.getElementById('task-btn-tweet').onclick = () => {
        const text = "Daily Quest: Verified! ✅\n\nPlaying Jesse Jump! 🪐\n#JesseGameWorld $JESSE";
        const url = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(text) + "&url=" + encodeURIComponent("https://jesse-game-world.vercel.app");
        window.open(url, '_blank');
        setDailyTaskComplete('tweet');
      };
    }

    if (!state.spend) {
      document.getElementById('task-btn-spend').onclick = () => {
        alert("To complete this:\n1. Play the game\n2. Use 'Revive' or spend $JESSE\n3. Come back here and check!");
        container.innerHTML = '';
        startJesseJump();
      };
    }

  }, 0);
}
