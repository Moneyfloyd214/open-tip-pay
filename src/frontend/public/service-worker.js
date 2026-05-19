const CACHE_NAME = "opentip-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/assets/generated/opentip-logo.dim_200x200.png",
  "/assets/generated/glassmorphism-bg.dim_800x600.png",
  "/assets/generated/ai-assistant-icon.dim_32x32.png",
  "/assets/generated/biometric-auth-icon.dim_32x32.png",
  "/assets/generated/bitcoin-icon.dim_24x24.png",
  "/assets/generated/briefcase-icon.dim_32x32.png",
  "/assets/generated/crypto-coin-icon.dim_24x24.png",
  "/assets/generated/crypto-wallet-icon.dim_32x32.png",
  "/assets/generated/default-avatar.dim_200x200.png",
  "/assets/generated/ethereum-icon.dim_24x24.png",
  "/assets/generated/nfc-tap-icon.dim_32x32.png",
  "/assets/generated/security-shield-icon.dim_32x32.png",
  "/assets/generated/success-checkmark.dim_64x64.png",
  "/assets/generated/tooltip-icon.dim_24x24.png",
  "/assets/generated/voice-mic-icon.dim_32x32.png",
  "/assets/generated/tax-report-icon.dim_32x32.png",
  "/assets/generated/goal-trophy-icon.dim_32x32.png",
  "/assets/generated/live-status-dot.dim_16x16.png",
  "/assets/generated/pwa-install-icon.dim_32x32.png",
  "/assets/generated/celebration-confetti.dim_64x64.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    }),
  );
});

self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});
