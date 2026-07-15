/* Service worker do app VR — REDE PRIMEIRO, cache só como rede reserva.
   Por que rede primeiro: o sistema muda quase todo dia. Se o cache viesse primeiro,
   a equipe abriria versão velha sem saber. Assim, a atualização SEMPRE chega,
   e o cache só entra em campo quando o celular está sem internet. */
const CACHE = "vr-app-v1";
const ESSENCIAIS = ["./", "./index.html", "./manifest.json", "./logo.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ESSENCIAIS)).catch(() => {}));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;                       // login/gravação: nunca mexer
  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (url.origin !== self.location.origin) return;        // Firebase, fontes, IA: direto na rede
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok) {
          const copia = res.clone();
          caches.open(CACHE).then(c => c.put(req, copia)).catch(() => {});
        }
        return res;
      })
      .catch(() =>                                        // sem internet: usa o que tem guardado
        caches.match(req).then(r => r || (req.mode === "navigate" ? caches.match("./index.html") : undefined))
      )
  );
});
