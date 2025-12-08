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
      .recent-ticker { width:100%; overflow:hidden; white-space:nowrap; margin-bottom:20px; background:rgba(255,255,255,0.7); border-radius:12px; box-shadow:0 2px 8px #0002; padding:8px 0; }
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
      <div class="profile" id="profile-btn" style="cursor:pointer;">
        <img src="${profile.picture}" alt="Profile" />
        <span>${profile.nickname}</span>
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
            closeBtn.onclick = () => {
              jjModalContainer.innerHTML = '';
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
                <div id="jj-leaderboard-modal" style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:200;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;">
                  <div style="background:#23293a;color:#fff;width:90%;max-width:360px;border-radius:16px;padding:20px;position:relative;box-shadow:0 10px 40px rgba(0,0,0,0.5);">
                    <button id="close-jj-leaderboard" style="position:absolute;top:10px;right:10px;background:none;border:none;color:#fff;font-size:1.5em;cursor:pointer;padding:5px;">✕</button>
                    <div style="font-size:1.4em;font-weight:bold;margin-bottom:20px;text-align:center;">🏆 Leaderboard</div>
                    <div id="jj-leaderboard-content" style="max-height:50vh;overflow-y:auto;min-height:100px;">
                      Loading...
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
                    .limit(10);
                  const content = document.getElementById('jj-leaderboard-content');
                  if (error || !data) {
                    content.innerHTML = '<div style="color:#E94F9B;">Failed to load leaderboard.</div>';
                    return;
                  }
                  if (data.length === 0) {
                    content.innerHTML = '<div>No scores yet.</div>';
                    return;
                  }
                  content.innerHTML = '<ol style="padding-left:18px;">' +
                    data.map(function (row, i) {
                      return '<li style="margin-bottom:8px;display:flex;align-items:center;">' +
                        '<img src="' + (row.player_avatar || './assets/farcaster.png') + '" style="width:28px;height:28px;border-radius:50%;margin-right:10px;vertical-align:middle;" /> ' +
                        '<span style="font-weight:bold;">' + row.player_name + '</span> ' +
                        '<span style="margin-left:auto;font-size:1.1em;color:#FFD600;font-weight:bold;">' + row.score + 'm</span>' +
                        '</li>';
                    }).join('') + '</ol>';
                } catch (e) {
                  const content = document.getElementById('jj-leaderboard-content');
                  content.innerHTML = '<div style="color:#E94F9B;">Error loading leaderboard.</div>';
                }
              }, 0);
            };
          }
        }, 0);
      };
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

      } catch (err) {
        console.warn('Background data fetch error:', err);
      }
    })();

  } else {
    // Browser environment
    renderGateScreen();
  }
});
