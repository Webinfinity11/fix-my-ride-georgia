// Check the existing worker on every visit, without reloading an open form.
if ('serviceWorker' in navigator) {
  // A rebuilt localhost preview deletes hashed files while old tabs are open.
  // Keep local previews on the network; production retains offline support.
  const hostname = window.location?.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') {
    navigator.serviceWorker.getRegistrations().then(async registrations => {
      for (const registration of registrations) {
        const worker = registration.active || registration.waiting || registration.installing;
        if (worker && new URL(worker.scriptURL).pathname === '/sw.js') await registration.unregister();
      }
      if ('caches' in window) {
        const owned = ['app-assets', 'app-images', 'supabase-images', 'supabase-api', 'google-fonts', 'public-category-documents', 'public-documents-v2'];
        for (const name of await caches.keys()) {
          if (owned.includes(name) || name.startsWith('workbox-precache-v2-')) await caches.delete(name);
        }
      }
    }).catch(() => {});
  } else {
  const register = () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then(registration => registration.update())
      .catch(() => { /* Offline visits keep the already installed worker. */ });
  };
  // Existing clients must check now: a failed or slow lazy chunk can delay load.
  if (navigator.serviceWorker.controller || document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
  }
}
