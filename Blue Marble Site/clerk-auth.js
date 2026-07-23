// ─────────────────────────────────────────────────────────────────────────
// Clerk login wiring — vanilla JS, no build step (loaded via CDN in <head>,
// same pattern as the three.js globe).
//
// Handles the "Log in" nav buttons (desktop + mobile): opens Clerk's
// sign-in modal, and once signed in, sends the user to the platform.
//
// TODO: swap PLATFORM_URL to https://app.bluemarbleos.com once that
// subdomain is live and configured as a Clerk satellite domain — at that
// point the session will carry over automatically instead of asking the
// user to sign in a second time on the platform.
// ─────────────────────────────────────────────────────────────────────────
(function () {
  const PLATFORM_URL = 'https://blue-marble-intel.vercel.app';

  function setLoggedOutState(btn) {
    if (!btn) return;
    btn.textContent = 'Log in';
    btn.onclick = () => {
      window.Clerk.openSignIn({
        afterSignInUrl: PLATFORM_URL,
        afterSignUpUrl: PLATFORM_URL,
      });
    };
  }

  function setLoggedInState(btn) {
    if (!btn) return;
    btn.textContent = 'Go to platform';
    btn.onclick = () => {
      window.location.href = PLATFORM_URL;
    };
  }

  function refreshButtons(buttons) {
    const signedIn = Boolean(window.Clerk.user);
    buttons.forEach((btn) => (signedIn ? setLoggedInState(btn) : setLoggedOutState(btn)));
  }

  window.addEventListener('load', async () => {
    if (!window.Clerk) {
      console.warn('Clerk failed to load — login button will not function.');
      return;
    }

    await window.Clerk.load();

    const buttons = [
      document.getElementById('navLoginBtn'),
      document.getElementById('navLoginBtnMobile'),
    ].filter(Boolean);

    refreshButtons(buttons);
    window.Clerk.addListener(() => refreshButtons(buttons));
  });
})();
