# ⚠️ AVISO CRÍTICO: ESTA BRANCH NÃO PODE SER MERGEADA NA MAIN ⚠️

> **IMPORTANTE / DESTINO EXCLUSIVO:**
> Esta branch (`android-webapp`) é uma **versão dedicada e independente** do jogo configurada como **Web App Android (PWA / Mobile Web Game)**.
>
> ❌ **NÃO REALIZE MERGE OU PULL REQUEST DESTA BRANCH PARA A BRANCH `main`.**
>
> Esta branch foi preparada para ser migrada futuramente para um **novo repositório próprio e isolado** exclusivo para o aplicativo Android/Mobile.

---

## 📱 Recursos Exclusivos desta Branch Android Web App

1. **Progressive Web App (PWA) Completo**:
   - `manifest.json` com display `fullscreen` e orientação responsiva.
   - Ícones de alta resolução nativos para Android (`icon-192.png`, `icon-512.png`, `icon-maskable.png`).
   - Ícone personalizado na tela inicial do celular e na bandeja de aplicativos abertos do Android.
2. **Operação 100% Offline (Service Worker)**:
   - `sw.js` realiza cache inteligente de todos os recursos (App Shell, Scripts, Canvas, CSS, Sprites, Áudios e SVGs).
   - O jogo pode ser iniciado e jogado na íntegra sem conexão com a internet.
3. **Persistência Híbrida (IndexedDB + LocalStorage + Cloud Sync)**:
   - `android-app.js` garante armazenamento local duplo (IndexedDB e LocalStorage) para que o progresso nunca seja perdido.
   - Sincronização automática com a conta em nuvem / banco de dados quando a conexão retornar.
4. **Interface Mobile Responsiva e Tátil**:
   - Touch controls otimizados sem atraso de clique (`touch-action: manipulation`).
   - Bloqueio de scroll acidental durante os minigames (`touch-action: none`).
   - Suporte a entalhes / recortes de câmera (*notches*) com `env(safe-area-inset-*)`.
   - Botão de alternar tela cheia nativa (`requestFullscreen`) e feedback tátil por vibração (`navigator.vibrate`).
