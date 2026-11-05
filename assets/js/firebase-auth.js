(() => {
  'use strict';

  const CONFIG = window.TOOLSBySS_MASTER || {};
  const FIREBASE_CONFIG = CONFIG.firebase || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  let auth = null;
  let user = null;
  let idleTimer = null;
  let warningTimer = null;
  let lastTool = '';
  let lastArmAt = 0;
  let redirectStarted = false;
  let frameLoadBound = false;

  const pageTool = document.body?.dataset?.tool || '';
  const frame = $('[data-tool-frame]');
  const isVerified = () => !!(user && user.emailVerified);

  function setStatus(message) {
    const element = $('[data-auth-status]') || $('#auth-status');
    if (element) element.textContent = message || '';
  }

  function firebaseIsReady() {
    return !!(
      FIREBASE_CONFIG.enabled &&
      FIREBASE_CONFIG.apiKey &&
      FIREBASE_CONFIG.authDomain &&
      FIREBASE_CONFIG.projectId &&
      window.firebase
    );
  }

  async function sendAudit(eventName, details = {}) {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await fetch('/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          event: eventName,
          tool: details.tool || lastTool || pageTool || '',
          reason: details.reason || ''
        }),
        keepalive: true
      });
    } catch (error) {
      // Activity logging is optional and must not block tool usage.
      console.warn('ToolsBySS activity log was not delivered:', error);
    }
  }

  function clearSessionTimers() {
    window.clearTimeout(idleTimer);
    window.clearTimeout(warningTimer);
    idleTimer = null;
    warningTimer = null;
  }

  function sendFrameAuthState() {
    if (!frame || !frame.contentWindow) return;
    try {
      frame.contentWindow.postMessage({
        type: 'toolsbyss-auth-state',
        verified: isVerified()
      }, location.origin);
    } catch (error) {
      console.warn('Could not update embedded tool session:', error);
    }
  }

  function syncToolAccess() {
    if (!pageTool) return;

    const lockedPanel = $('[data-tool-locked]');
    const readyPanel = $('[data-tool-ready]');
    const verified = isVerified();

    lockedPanel?.classList.toggle('hidden', verified);
    readyPanel?.classList.toggle('hidden', !verified);

    if (!frame) return;

    if (!verified) {
      frame.classList.add('hidden');
      if (frame.dataset.frameLoaded === '1') {
        frame.removeAttribute('src');
        delete frame.dataset.frameLoaded;
      }
      return;
    }

    frame.classList.remove('hidden');
    if (frame.dataset.frameLoaded !== '1') {
      const source = frame.dataset.src;
      if (!source) {
        setStatus('Tool could not be loaded: iframe source is missing.');
        return;
      }
      if (!frameLoadBound) {
        frame.addEventListener('load', sendFrameAuthState);
        frameLoadBound = true;
      }
      frame.dataset.frameLoaded = '1';
      frame.src = source;
    } else {
      sendFrameAuthState();
    }
  }

  function updateUserInterface() {
    const verified = isVerified();

    $$('[data-user-email]').forEach(element => {
      element.textContent = verified ? (user.email || '') : '';
    });
    $$('[data-auth-cta]').forEach(element => {
      element.classList.toggle('hidden', verified);
    });
    $$('[data-logout]').forEach(element => {
      element.classList.toggle('hidden', !verified);
    });
    $$('[data-tool-locked]').forEach(element => {
      element.classList.toggle('hidden', verified);
    });
    $$('[data-tool-ready]').forEach(element => {
      element.classList.toggle('hidden', !verified);
    });
    $$('[data-resend-verification]').forEach(element => {
      element.classList.toggle('hidden', !(user && !user.emailVerified));
    });

    const adminEmails = (CONFIG.admins || []).map(value => String(value).trim().toLowerCase());
    const isAdmin = !!(verified && adminEmails.includes(String(user.email || '').trim().toLowerCase()));
    $$('[data-admin-only]').forEach(element => element.classList.toggle('hidden', !isAdmin));
    $$('[data-admin-lock]').forEach(element => element.classList.toggle('hidden', isAdmin));

    syncToolAccess();
  }

  function armSessionTimers() {
    clearSessionTimers();
    if (!isVerified()) return;

    const idleMinutes = Math.max(1, Number(CONFIG.idleMinutes) || 15);
    const warningSeconds = Math.max(15, Number(CONFIG.warningSeconds) || 60);
    const warningBox = $('[data-session-warning]');
    warningBox?.classList.add('hidden');

    warningTimer = window.setTimeout(() => {
      warningBox?.classList.remove('hidden');
      const countdown = $('[data-warning-countdown]');
      if (countdown) countdown.textContent = String(warningSeconds);
    }, Math.max(0, idleMinutes * 60000 - warningSeconds * 1000));

    idleTimer = window.setTimeout(() => {
      logout('idle_timeout');
    }, idleMinutes * 60000);

    lastArmAt = Date.now();
  }

  function registerActivity() {
    if (!isVerified()) return;
    const now = Date.now();
    // Iframe mousemove can fire frequently. Re-arm timers at most once per second.
    if (now - lastArmAt >= 1000) armSessionTimers();
  }

  async function logout(reason = 'manual') {
    clearSessionTimers();
    if (user) {
      await sendAudit(reason === 'manual' ? 'LOGOUT' : 'SESSION_EXPIRED', { reason });
    }

    try {
      sessionStorage.removeItem('toolsbyss_logged_session');
    } catch (_) {}

    if (auth) {
      try {
        await auth.signOut();
      } catch (error) {
        console.error('Sign out failed:', error);
      }
    }

    user = null;
    updateUserInterface();

    if (pageTool) {
      const next = encodeURIComponent(location.pathname);
      location.replace(`/login/?next=${next}`);
    }
  }

  async function recordTool(slug) {
    if (!isVerified() || !slug || slug === lastTool) return;
    lastTool = slug;
    await sendAudit('TOOL_USED', { tool: slug });
  }

  function setAuthFormMode(mode) {
    const login = $('[data-login-form]');
    const signup = $('[data-signup-form]');
    const reset = $('[data-reset-form]');
    login?.classList.toggle('hidden', mode !== 'login');
    signup?.classList.toggle('hidden', mode !== 'signup');
    reset?.classList.toggle('hidden', mode !== 'reset');
    setStatus('');
  }

  function initForms() {
    const loginForm = $('[data-login-form]');
    const signupForm = $('[data-signup-form]');
    const resetForm = $('[data-reset-form]');

    $$('[data-auth-mode]').forEach(button => {
      button.addEventListener('click', () => setAuthFormMode(button.dataset.authMode));
    });

    loginForm?.addEventListener('submit', async event => {
      event.preventDefault();
      if (!auth) return setStatus('Authentication is not ready. Refresh this page and try again.');
      const button = $('button[type="submit"]', loginForm);
      if (button) button.disabled = true;
      try {
        setStatus('Signing in…');
        await auth.signInWithEmailAndPassword(loginForm.email.value.trim(), loginForm.password.value);
        setStatus('Signed in. Opening your requested page…');
      } catch (error) {
        setStatus(error.message || 'Sign in failed. Please check your email and password.');
      } finally {
        if (button) button.disabled = false;
      }
    });

    signupForm?.addEventListener('submit', async event => {
      event.preventDefault();
      if (!auth) return setStatus('Authentication is not ready. Refresh this page and try again.');
      const button = $('button[type="submit"]', signupForm);
      if (button) button.disabled = true;
      try {
        setStatus('Creating your account…');
        const credential = await auth.createUserWithEmailAndPassword(
          signupForm.email.value.trim(),
          signupForm.password.value
        );
        await credential.user.sendEmailVerification({
          url: `${location.origin}/login/?verified=1`,
          handleCodeInApp: false
        });
        setStatus('Verification link sent. Open your email, verify the address, then sign in.');
        await auth.signOut();
      } catch (error) {
        setStatus(error.message || 'Account creation failed. Please try again.');
      } finally {
        if (button) button.disabled = false;
      }
    });

    resetForm?.addEventListener('submit', async event => {
      event.preventDefault();
      if (!auth) return setStatus('Authentication is not ready. Refresh this page and try again.');
      const button = $('button[type="submit"]', resetForm);
      if (button) button.disabled = true;
      try {
        await auth.sendPasswordResetEmail(resetForm.email.value.trim());
        setStatus('Password reset email sent. Please check your inbox.');
      } catch (error) {
        setStatus(error.message || 'Could not send the password reset email.');
      } finally {
        if (button) button.disabled = false;
      }
    });

    $('[data-resend-verification]')?.addEventListener('click', async () => {
      try {
        if (auth?.currentUser) {
          await auth.currentUser.sendEmailVerification();
          setStatus('Verification email sent again. Please check your inbox.');
        }
      } catch (error) {
        setStatus(error.message || 'Could not resend verification email.');
      }
    });

    $$('[data-logout]').forEach(button => button.addEventListener('click', () => logout('manual')));

    const googleButton = $('[data-google-login]');
    if (googleButton) {
      googleButton.classList.toggle('hidden', !FIREBASE_CONFIG.googleProvider);
      googleButton.addEventListener('click', async () => {
        try {
          await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
        } catch (error) {
          setStatus(error.message || 'Google sign in failed.');
        }
      });
    }

    $('[data-warning-continue]')?.addEventListener('click', () => {
      $('[data-session-warning]')?.classList.add('hidden');
      armSessionTimers();
    });
    $('[data-warning-logout]')?.addEventListener('click', () => logout('manual'));
  }

  function handleAuthState(nextUser) {
    user = nextUser || null;
    updateUserInterface();

    if (!user) {
      clearSessionTimers();
      try {
        sessionStorage.removeItem('toolsbyss_logged_session');
      } catch (_) {}
      return;
    }

    if (!user.emailVerified) {
      clearSessionTimers();
      setStatus('Your email is not verified yet. Open the verification link in your email, then sign in again.');
      return;
    }

    let hasSessionMarker = false;
    try {
      hasSessionMarker = sessionStorage.getItem('toolsbyss_logged_session') === '1';
    } catch (_) {}

    if (!hasSessionMarker) {
      sendAudit('LOGIN');
      try {
        sessionStorage.setItem('toolsbyss_logged_session', '1');
      } catch (_) {}
    }

    armSessionTimers();
    if (pageTool) recordTool(pageTool);

    if (location.pathname === '/login/' && !redirectStarted) {
      redirectStarted = true;
      const requested = new URLSearchParams(location.search).get('next');
      const safeNext = requested && requested.startsWith('/') && !requested.startsWith('//')
        ? requested
        : '/';
      location.replace(safeNext);
    }
  }

  function initFirebase() {
    if (!firebaseIsReady()) {
      $$('[data-auth-config-warning]').forEach(element => element.classList.remove('hidden'));
      setStatus('Firebase settings are missing. Please check master-config.js.');
      return;
    }

    try {
      if (!firebase.apps || firebase.apps.length === 0) {
        firebase.initializeApp({
          apiKey: FIREBASE_CONFIG.apiKey,
          authDomain: FIREBASE_CONFIG.authDomain,
          projectId: FIREBASE_CONFIG.projectId,
          appId: FIREBASE_CONFIG.appId
        });
      }

      auth = firebase.auth();
      auth.setPersistence(firebase.auth.Auth.Persistence.SESSION)
        .then(() => auth.onAuthStateChanged(handleAuthState))
        .catch(error => {
          console.error('Firebase persistence setup failed:', error);
          setStatus('Could not restore this tab session. Please refresh and sign in again.');
        });
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      setStatus(`Firebase setup error: ${error.message || error}`);
    }
  }

  function initFrameMessaging() {
    window.addEventListener('message', event => {
      if (event.origin !== location.origin || !frame || event.source !== frame.contentWindow) return;

      if (event.data?.type === 'toolsbyss-activity') {
        registerActivity();
      } else if (event.data?.type === 'toolsbyss-embed-ready') {
        sendFrameAuthState();
      } else if (event.data?.type === 'toolsbyss-resize' && Number.isFinite(event.data.height)) {
        frame.style.height = `${Math.max(220, Math.min(12000, event.data.height))}px`;
      }
    });
  }

  function init() {
    initForms();
    initFrameMessaging();
    initFirebase();

    ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach(eventName => {
      document.addEventListener(eventName, registerActivity, { passive: true });
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && isVerified()) armSessionTimers();
    });
  }

  window.TOOLSBySS_AUTH = {
    recordTool,
    logout,
    get user() { return user; },
    get isVerified() { return isVerified(); },
    initFirebase
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
