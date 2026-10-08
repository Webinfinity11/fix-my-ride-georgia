// Check the existing worker on every visit, without reloading an open form.
if ('serviceWorker' in navigator) {
  const register = () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then(registration => registration.update())
      .catch(() => { /* Offline visits keep the already installed worker. */ });
  };
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}
