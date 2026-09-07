// ═══════════════════════════════════════════════════════════════════
// terminal-alert.js — Modal de Alerta CRT 100% Estilizado
// Substitui os alertas nativos do Windows pelo padrão estético do jogo
// ═══════════════════════════════════════════════════════════════════

export function showTerminalAlert(title, message) {
  return new Promise((resolve) => {
    let overlay = document.getElementById('termUniversalModalOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'termUniversalModalOverlay';
      overlay.className = 'term-universal-alert-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.innerHTML = `
        <div class="term-universal-alert-backdrop" id="termAlertBackdrop"></div>
        <div class="term-universal-alert-card">
          <div class="term-alert-scanlines"></div>
          <div class="term-alert-header">
            <div class="term-alert-title-wrap">
              <span class="term-alert-badge" id="termAlertBadge">[ ALERTA DE SISTEMA ]</span>
              <span class="term-alert-sub">// PROTOCOLO QUEZAS-DOS</span>
            </div>
            <button class="term-alert-close-btn" id="termAlertCloseBtn" title="Fechar">&times;</button>
          </div>
          <div class="term-alert-body" id="termAlertBodyMessage"></div>
          <div class="term-alert-footer">
            <button class="term-alert-confirm-btn" id="termAlertConfirmBtn">[ CONFIRMAR / OK ]</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    }

    const badgeEl = overlay.querySelector('#termAlertBadge');
    const bodyEl = overlay.querySelector('#termAlertBodyMessage');
    const confirmBtn = overlay.querySelector('#termAlertConfirmBtn');
    const closeBtn = overlay.querySelector('#termAlertCloseBtn');
    const backdrop = overlay.querySelector('#termAlertBackdrop');

    if (badgeEl && title) badgeEl.textContent = `[ ${title.toUpperCase()} ]`;
    if (bodyEl) bodyEl.textContent = message || '';

    overlay.classList.remove('hidden');

    const cleanup = () => {
      overlay.classList.add('hidden');
      window.removeEventListener('keydown', onKeyDown);
      resolve();
    };

    const onKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') {
        e.preventDefault();
        cleanup();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    if (confirmBtn) confirmBtn.onclick = cleanup;
    if (closeBtn) closeBtn.onclick = cleanup;
    if (backdrop) backdrop.onclick = cleanup;

    // Foco acessível no botão de confirmação
    if (confirmBtn) confirmBtn.focus();
  });
}

// Expõe globalmente e substitui o window.alert nativo do navegador
window.showTerminalAlert = showTerminalAlert;
window.alert = function (message) {
  showTerminalAlert('ALERTA DE SISTEMA', String(message));
};
