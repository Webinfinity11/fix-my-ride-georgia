// Check the existing worker on every visit, without reloading an open form.
if ('serviceWorker' in navigator) {
  const register = () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then(registration => registration.update())
      .catch(() => { /* Offline visits keep the already installed worker. */ });
  };
  // Existing clients must check now: a failed or slow lazy chunk can delay load.
  if (navigator.serviceWorker.controller || document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}
