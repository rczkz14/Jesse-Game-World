// Jesse Jump placeholder
export default function JesseJump() {
  return `
    <div id="jesse-jump-modal" style="background:#23293a;color:#fff;border-radius:16px;box-shadow:0 4px 24px #0006;width:90%;max-width:400px;padding:clamp(24px, 5vw, 32px) 0 clamp(20px, 4vw, 24px) 0;position:relative;margin:40px auto;">
      <button id="close-jj-modal" style="position:absolute;top:18px;right:18px;background:none;border:none;font-size:1.4em;cursor:pointer;color:#fff;min-width:44px;min-height:44px;display:flex;align-items:center;justify-content:center;">✕</button>
      <div style="display:flex;flex-direction:column;align-items:center;">
        <img id="jj-icon" src="../../assets/jesse-jump/jessejump.png" alt="Jesse Jump" style="width:clamp(50px, 15vw, 60px);height:clamp(50px, 15vw, 60px);cursor:pointer;margin-bottom:8px;" />
        <div style="font-size:clamp(1.2em, 5vw, 1.5em);font-weight:bold;margin-bottom:10px;">Jesse Jump</div>
      </div>
      <div style="background:#2d3448;padding:clamp(12px, 3vw, 16px) clamp(14px, 3.5vw, 18px);border-radius:12px;margin:0 clamp(16px, 4vw, 24px) clamp(14px, 3.5vw, 18px) clamp(16px, 4vw, 24px);font-size:clamp(0.9em, 3.5vw, 1em);">
        <div style="font-weight:bold;margin-bottom:8px;">HOW TO PLAY</div>
        <ul style="padding-left:18px;margin:0;">
          <li><b>Tap Left or Right</b> to jump</li>
          <li>Don't fall off the path!</li>
          <li>Break the obstacles 🧱</li>
          <li>Go as far as you can! 🚀</li>
        </ul>
      </div>
      <button id="start-jj-game" style="width:80%;margin:0 auto 12px auto;display:block;background:#4f8cff;color:#fff;font-weight:bold;border:none;border-radius:8px;font-size:clamp(1em, 4vw, 1.1em);padding:clamp(10px, 2.5vw, 12px) 0;cursor:pointer;min-height:44px;">START GAME</button>
      <button id="jj-leaderboard" style="width:80%;margin:0 auto;display:block;background:#23293a;color:#fff;font-weight:bold;border:none;border-radius:8px;font-size:clamp(1em, 4vw, 1.1em);padding:clamp(10px, 2.5vw, 12px) 0;cursor:pointer;border:2px solid #2d3448;min-height:44px;">LEADERBOARD</button>
    </div>
    <div id="jj-leaderboard-modal-container"></div>
  `;
}
