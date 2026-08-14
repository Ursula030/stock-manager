const CACHE='stock-radar-v5-15-3-swfix2';

const ASSETS=[
 './',
 './index.html',
 './manifest.webmanifest',
 './app-icon-192.png',
 './app-icon-512.png',
 './apple-touch-icon.png'
];

self.addEventListener('install',e=>{
 e.waitUntil(
  caches.open(CACHE).then(c=>c.addAll(ASSETS))
 );
 self.skipWaiting();
});

self.addEventListener('activate',e=>{
 e.waitUntil(
  caches.keys().then(keys=>
   Promise.all(
    keys
     .filter(k=>k!==CACHE)
     .map(k=>caches.delete(k))
   )
  )
 );
 self.clients.claim();
});

self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET') return;

 const url=new URL(e.request.url);

 // 外部 API 不交給 PWA Service Worker 處理
 if(url.origin!==self.location.origin) return;

 e.respondWith(
  fetch(e.request)
   .then(r=>{
    if(r && r.ok && r.type==='basic'){
     const copy=r.clone();
     caches.open(CACHE).then(c=>c.put(e.request,copy));
    }
    return r;
   })
   .catch(async()=>{
    const cached=await caches.match(e.request);

    if(cached) return cached;

    // 只有股倉雷達自己的頁面才能 fallback 到 index.html
    if(e.request.mode==='navigate'){
     const app=await caches.match('./index.html');
     if(app) return app;
    }

    return Response.error();
   })
 );
});

self.addEventListener('notificationclick',e=>{
 e.notification.close();

 e.waitUntil(
  clients
   .matchAll({
    type:'window',
    includeUncontrolled:true
   })
   .then(list=>
    list.length
     ? list[0].focus()
     : clients.openWindow('./index.html')
   )
 );
});
