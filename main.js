import { sdk } from 'https://esm.sh/@farcaster/miniapp-sdk';
import JesseJump from './games/jesse-jump/index.js';
import { startGame as startJesseJump } from './games/jesse-jump/game.js';
import VirusJesse from './games/virus-jesse/index.js';
import ProtectJesse from './games/protect-jesse/index.js';
import { supabase } from './supabaseClient.js';

const app = document.getElementById('app');

// Farcaster profile (populated via SDK)
let profile = {
  picture: './assets/farcaster.png',
  nickname: 'nickname',
};

// Try to fetch Farcaster user profile via SDK
async function fetchFarcasterProfile() {
  try {
    // Only works if opened in Farcaster/BaseApp
    const user = await sdk.user.getCurrentUser();
    if (user) {
      profile = {
        picture: user.pfp_url || './assets/farcaster.png',
        nickname: user.display_name || user.username || 'Farcaster User',
        fid: user.fid || 'Unknown',
      };
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
        <div style="background:#f5faff;padding:12px 18px;border-radius:12px;margin:0 24px 18px 24px;font-size:0.98em;color:#2a5bd7;font-weight:bold;">CONNECTED WALLET<br><span style="color:#888;font-weight:normal;">Not Connected</span></div>
        <div style="padding:0 24px;">
          <div style="font-weight:bold;color:#888;font-size:0.98em;margin-bottom:10px;">GAME STATS</div>
          <div style="background:#fff;border-radius:12px;box-shadow:0 2px 8px #0001;display:flex;align-items:center;justify-content:space-between;padding:10px 16px;margin-bottom:10px;">
            <div style="display:flex;align-items:center;"><img src="./assets/jesse-jump/jessejump.png" style="width:32px;height:32px;margin-right:10px;" /><span style="font-weight:bold;">Jesse Jump</span></div>
            <div style="font-size:1em;color:#222;font-weight:bold;">Best Score <span style="font-size:1.1em;">0m</span></div>
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
      profileBtn.onclick = () => { profileModal.style.display = 'block'; };
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
              leaderboardModalContainer.innerHTML = '<div id="jj-leaderboard-modal" style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:200;background:rgba(0,0,0,0.28);display:flex;align-items:center;justify-content:center;"><div style="font-size:1.3em;font-weight:bold;margin-bottom:18px;text-align:center;">Leaderboard</div><div id="jj-leaderboard-content" style="min-height:120px;">Loading...</div></div>';
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

document.addEventListener('DOMContentLoaded', async () => {
  window.sdk = sdk;
  await fetchFarcasterProfile();
  fetchJessePrice().then(price => {
    renderMainPage(price);
    sdk.actions.ready();
  });

  // Populate recent players ticker
  getRecentPlayers().then(originalPlayers => {
    const ticker = document.getElementById('ticker-content');
    if (ticker && originalPlayers.length > 0) {
      // Normalize to exactly 6 items for consistent speed (30s loop)
      let players = [...originalPlayers];
      while (players.length < 6) {
        players = players.concat(originalPlayers);
      }
      // Trim to exactly 6 if we exceeded (e.g. 4 -> 8 -> take 6) 
      // casting the net wide ensures we have enough data to fill the 30s slot visual
      players = players.slice(0, 6);

      const singleSet = players.map(p =>
        `<div style="display:inline-flex;align-items:center;background:rgba(255,255,255,0.9);backdrop-filter:blur(4px);padding:6px 16px;border-radius:30px;margin-right:24px;box-shadow:0 2px 8px rgba(0,0,0,0.15);border:1px solid rgba(255,255,255,0.8);">
          <img src="${p.icon}" style="width:28px;height:28px;margin-right:10px;border-radius:6px;object-fit:cover;" />
          <img src="${p.profile.picture}" style="width:28px;height:28px;border-radius:50%;margin-right:10px;border:1px solid rgba(0,0,0,0.1);object-fit:cover;" />
          <span style="font-weight:bold;color:#333;margin-right:8px;font-size:0.95em;">${p.profile.nickname}</span>
          <span style="font-weight:900;color:#E94F9B;font-size:1em;">${p.score}m</span>
        </div>`
      ).join('');
      // Repeat 4 times to ensure seamless loop buffer matching the CSS -25% transform
      ticker.innerHTML = singleSet.repeat(4);
    }
  });
});
