const CACHE_NAME = "village-community-v2"
const STATIC_CACHE = "static-v2"
const DYNAMIC_CACHE = "dynamic-v2"
const API_CACHE = "api-v2"

const urlsToCache = [
  "/",
  "/community",
  "/events",
  "/directory",
  "/volunteers",
  "/offline",
  "/manifest.json",
  "/icon-192.jpg",
  "/icon-512.jpg",
]

const BACKGROUND_SYNC_TAG = "community-posts-sync"

// Install event - cache resources
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker")
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("[SW] Caching static resources")
      return cache.addAll(urlsToCache)
    }),
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker")
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== API_CACHE) {
            console.log("[SW] Deleting old cache:", cacheName)
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
  self.clients.claim()
})

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith("/api/") || url.hostname.includes("supabase")) {
    event.respondWith(networkFirstStrategy(request, API_CACHE))
    return
  }

  // Handle navigation requests
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigation responses
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Serve cached page or offline page
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match("/offline")
          })
        }),
    )
    return
  }

  // Handle static assets with cache-first strategy
  if (request.destination === "image" || request.destination === "style" || request.destination === "script") {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE))
    return
  }

  // Default: stale-while-revalidate
  event.respondWith(staleWhileRevalidateStrategy(request, DYNAMIC_CACHE))
})

// Background sync for offline posts
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync triggered:", event.tag)
  if (event.tag === BACKGROUND_SYNC_TAG) {
    event.waitUntil(syncOfflinePosts())
  }
})

// Push notification handling
self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received")

  const options = {
    body: "You have a new community update",
    icon: "/icon-192.jpg",
    badge: "/icon-192.jpg",
    vibrate: [200, 100, 200],
    data: {
      url: "/",
    },
    actions: [
      {
        action: "view",
        title: "View",
        icon: "/icon-192.jpg",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
  }

  if (event.data) {
    const payload = event.data.json()
    options.body = payload.body || options.body
    options.data.url = payload.url || options.data.url
  }

  event.waitUntil(self.registration.showNotification("Village Community", options))
})

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event.action)

  event.notification.close()

  if (event.action === "view" || !event.action) {
    const url = event.notification.data?.url || "/"
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus()
          }
        }
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      }),
    )
  }
})

// Caching strategies
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.status === 200) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.log("[SW] Network failed, trying cache:", error)
    const cachedResponse = await caches.match(request)
    return cachedResponse || new Response("Offline", { status: 503 })
  }
}

async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)
    if (networkResponse.status === 200) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.log("[SW] Cache and network failed:", error)
    return new Response("Resource not available", { status: 404 })
  }
}

async function staleWhileRevalidateStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request)

  const networkResponsePromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.status === 200) {
        const cache = caches.open(cacheName)
        cache.then((c) => c.put(request, networkResponse.clone()))
      }
      return networkResponse
    })
    .catch(() => null)

  return cachedResponse || networkResponsePromise
}

// Sync offline posts when connection is restored
async function syncOfflinePosts() {
  try {
    console.log("[SW] Syncing offline posts")

    // Get offline posts from IndexedDB or localStorage
    const offlinePosts = await getOfflinePosts()

    for (const post of offlinePosts) {
      try {
        const response = await fetch("/api/community/posts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(post.data),
        })

        if (response.ok) {
          await removeOfflinePost(post.id)
          console.log("[SW] Successfully synced offline post:", post.id)
        }
      } catch (error) {
        console.error("[SW] Failed to sync post:", post.id, error)
      }
    }
  } catch (error) {
    console.error("[SW] Background sync failed:", error)
  }
}

// Helper functions for offline post management
async function getOfflinePosts() {
  // This would typically use IndexedDB
  // For now, return empty array
  return []
}

async function removeOfflinePost(postId) {
  // This would typically remove from IndexedDB
  console.log("[SW] Removing synced offline post:", postId)
}
