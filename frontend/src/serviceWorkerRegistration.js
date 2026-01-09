// Service worker registration with retry logic
export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL || ''}/service-worker.js`;
      navigator.serviceWorker
        .register(swUrl, { scope: '/' })
        .then((registration) => {
          console.log('ServiceWorker registered:', registration);
          // Check for updates periodically
          setInterval(() => {
            registration.update().catch((err) => console.error('SW update check failed:', err));
          }, 60000); // Check every minute
        })
        .catch((error) => {
          console.error('ServiceWorker registration failed:', error);
        });
    });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister().then(() => {
          console.log('ServiceWorker unregistered');
          // Refresh to clean up
          window.location.reload();
        });
      })
      .catch((err) => console.error('ServiceWorker unregister failed:', err));
  }
}
