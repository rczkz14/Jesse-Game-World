// Protect Jesse placeholder
export default function ProtectJesse() {
  return `
    <div id="protect-jesse-modal" style="background:#23293a;color:#fff;border-radius:16px;box-shadow:0 4px 24px #0006;width:340px;max-width:90vw;padding:32px 0 24px 0;position:relative;margin:40px auto;">
      <button id="close-pj-modal" style="position:absolute;top:18px;right:18px;background:none;border:none;font-size:1.4em;cursor:pointer;color:#fff;">✕</button>
      <div style="display:flex;flex-direction:column;align-items:center;">
        <img id="pj-icon" src="../../assets/protect-jesse/protectjesse.png" alt="Protect Jesse" style="width:60px;height:60px;cursor:pointer;margin-bottom:8px;" />
        <div style="font-size:1.5em;font-weight:bold;margin-bottom:10px;">Protect Jesse</div>
      </div>
      <div style="background:#2d3448;padding:16px 18px;border-radius:12px;margin:0 24px 18px 24px;font-size:1em;">
        <div style="font-weight:bold;margin-bottom:8px;">HOW TO PLAY</div>
        <ul style="padding-left:18px;margin:0;">
          <li><b>Tap</b> to protect Jesse</li>
          <li>Defend against obstacles!</li>
          <li>Go as far as you can! 🚀</li>
        </ul>
      </div>
      <button id="start-pj-game" style="width:80%;margin:0 auto 12px auto;display:block;background:#4f8cff;color:#fff;font-weight:bold;border:none;border-radius:8px;font-size:1.1em;padding:10px 0;cursor:pointer;">START GAME</button>
      <button id="pj-leaderboard" style="width:80%;margin:0 auto;display:block;background:#23293a;color:#fff;font-weight:bold;border:none;border-radius:8px;font-size:1.1em;padding:10px 0;cursor:pointer;border:2px solid #2d3448;">LEADERBOARD</button>
    </div>
    <div id="pj-leaderboard-modal-container"></div>
  `;
}
