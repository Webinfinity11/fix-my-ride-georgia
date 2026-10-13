// Keep this independent of the app bundle: it also handles a missing entry file.
(function () {
  if (window.__fixupRecoveryInstalled) return;
  window.__fixupRecoveryInstalled = true;
  function isLoadFailure(error) {
    return /Failed to fetch dynamically imported module|Importing a module script failed|Loading (?:CSS )?chunk|Unable to preload CSS/i.test(String(error && (error.message || error)));
  }
  function showRecovery() {
    if (document.getElementById('fixup-update-notice')) return;
    function mount() {
      if (document.getElementById('fixup-update-notice')) return;
      var notice = document.createElement('div');
      notice.id = 'fixup-update-notice';
      notice.setAttribute('role', 'alert');
      notice.style.cssText = 'position:fixed;bottom:85px;left:16px;right:16px;max-width:420px;margin:auto;padding:16px;background:#fff;color:#0f172a;border:1px solid #cbd5e1;border-radius:16px;box-shadow:0 12px 40px #0f172a30;z-index:12000;font:14px system-ui';
      notice.innerHTML = '<strong>გვერდის ნაწილი ვერ ჩაიტვირთა</strong><p style="margin:8px 0 12px">განაახლეთ გვერდი და სცადეთ ხელახლა. დაუმთავრებელი ინფორმაცია მანამდე შეინახეთ.</p><button type="button" style="padding:9px 14px;background:#154b7b;color:white;border:0;border-radius:9px;cursor:pointer">გვერდის განახლება</button> <button type="button" style="padding:9px;background:transparent;border:0;cursor:pointer">მოგვიანებით</button>';
      document.body.appendChild(notice);
      var buttons = notice.querySelectorAll('button');
      buttons[1].addEventListener('click', function () { notice.remove(); });
      buttons[0].addEventListener('click', async function () {
        buttons[0].disabled = true;
        buttons[0].textContent = 'იტვირთება…';
        try {
          if ('serviceWorker' in navigator) {
            await Promise.race([
              navigator.serviceWorker.getRegistration().then(async function (registration) {
                if (!registration) return;
                await registration.update();
                if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                if (registration.installing || registration.waiting) {
                  await new Promise(function (resolve) {
                    navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
                    setTimeout(resolve, 2500);
                  });
                }
              }),
              new Promise(function (resolve) { setTimeout(resolve, 5000); }),
            ]);
          }
        } catch (_) { /* A reload can still recover a transient network failure. */ }
        window.location.reload();
      });
    }
    if (document.body) mount();
    else document.addEventListener('DOMContentLoaded', mount, { once: true });
  }
  window.addEventListener('vite:preloadError', function (event) {
    if (!isLoadFailure(event.payload)) return;
    event.preventDefault();
    showRecovery();
  });
  window.addEventListener('unhandledrejection', function (event) {
    if (!isLoadFailure(event.reason)) return;
    event.preventDefault();
    showRecovery();
  });
  window.addEventListener('error', function (event) {
    var target = event.target;
    if (target && /^(SCRIPT|LINK)$/.test(target.tagName) && /\/assets\/[^?#]+\.(js|css)(?:[?#]|$)/.test(target.src || target.href || '')) showRecovery();
  }, true);
}());
