# React Native Coding Challenge: 3 Pages Store

This workspace contains a minimal React Native app implementing the challenge requirements:

- 3 screens: Login, All Products, Category (chosen: `smartphones`).
- DummyJSON authentication and products API usage.
- Auto-lock after 10s of inactivity / on background, with lock overlay.
- Biometric unlock (expo-local-authentication) with password fallback.
- React Query for data fetching; cache persisted to MMKV.
- Superadmin user: `superadmin` (press "مدير خارق" on login screen to autofill).

Files of interest

- `App.tsx` — sets up Redux, React Query with MMKV persister, and Lock overlay.
- `src/screens/LoginScreen.tsx` — login UI and test credentials.
- `src/screens/AllProductsScreen.tsx` — shows product grid; Delete button for superadmin.
- `src/screens/CategoryScreen.tsx` — shows products filtered to one chosen category.
- `src/utils/mmkvPersister.ts` — MMKV storage wrapper and keys.

Chosen category

- Category used for the Category screen: `smartphones`.

Superadmin user

- Username: `super@demo` (you can autofill it on the Login screen).
- Any username may be considered superadmin in original spec; this project treats `super@demo` as the superadmin marker.

Setup & Run (Expo)

# React Native Coding Challenge — 3 Pages Store

This repository is an implementation of the "3 Pages Store" React Native challenge. It focuses on authentication, product lists, a category screen, offline caching with MMKV, auto-lock/biometrics, and a small admin delete flow.

This README describes how the app behaves, how the offline caching & delete mechanics work, and how to run and test the app locally.

## Features (implemented)

- Three primary screens:
	- Login (`src/screens/LoginScreen.tsx`)
	- All Products (`src/screens/AllProductsScreen.tsx`) — grid of products
	- Category (`src/screens/CategoryScreen.tsx`) — horizontal category tabs + product list
- Authentication: supports DummyJSON auth and a local superadmin shortcut (see below).
- Superadmin delete: superadmin users can delete products. Deletion is persisted locally to MMKV so the item remains removed across app restarts and sessions.
- Offline caching: products are cached to MMKV and used as `initialData` for React Query so the products list shows immediately while offline.
- React Query persisted with a lightweight MMKV persister (`src/utils/mmkvPersister.ts`). The persister includes a fallback shim that uses Expo SecureStore if MMKV/TurboModules are unavailable.
- Auto-lock: app auto-locks after 10s of inactivity. A LockOverlay is shown when the app is locked (the overlay is intentionally not shown on the Login screen).
- Biometrics: `expo-local-authentication` is used for biometric unlock with a password fallback.
- Snackbar-style toasts for in-app messages (delete confirmations, errors).

## Important behavior details

- Superadmin credentials (local shortcut):
	- Username: `superadmin`
	- Password: `1234567`
	- This login path is handled locally and stored in MMKV (no remote auth call). Use the test button on the Login screen to autofill.

- Delete behavior (persistent local deletion):
	- When a superadmin deletes a product, the app immediately removes the product from the in-memory React Query cache and from the MMKV cache (under `STORAGE_KEYS.REACT_QUERY_CACHE`).
	- The app then makes a best-effort background call to the remote DELETE endpoint. If that call fails (offline or API limitation), the local deletion remains in place — the cached list is authoritative locally.
	- When the app fetches fresh products from the network (manual refresh with network available), the remote product list may include items that were deleted locally; if you want server-merge semantics instead of local authoritative deletes, we can implement a `deleted_ids` set to hide server-returned items.

- Offline behavior:
	- On load, `AllProductsScreen` reads an MMKV cached products array (if present) and uses it as `initialData` for React Query. This ensures cached products are shown immediately when there's no network.
	- The UI shows a small badge `(showing cached data)` when the screen is currently using the cached fallback.

- Lock overlay:
	- The lock overlay is shown only when a user is authenticated and the app is locked; it is intentionally hidden on the Login screen so it does not block sign-in.

## Files of interest

- `App.tsx` — root provider wiring (Redux, React Query, persist provider), startup cache restore, auto-lock wiring and LockOverlay placement.
- `src/utils/mmkvPersister.ts` — MMKV initialization and SecureStore fallback; storage helper functions and `mmkvPersister` object used by React Query persist client.
- `src/screens/LoginScreen.tsx` — login UI and test buttons for regular and superadmin accounts.
- `src/screens/AllProductsScreen.tsx` — main product list, delete handling, snackbar integration, offline/cache usage.
- `src/screens/CategoryScreen.tsx` — category tabs (disabled while categories fail to load / offline) and per-category product list.
- `src/components/LockOverlay.tsx` — animated lock UI with biometric/password actions.
- `src/components/Snackbar.tsx` — small animated snackbar component used for delete messages.

## How to run (Windows / PowerShell)

1. Install dependencies (one-time):

```powershell
cd "d:\Projects\Front-End Track\React Native\GetPayln Project\project"
npm install
```

2. Start Expo (Metro):

```powershell
npm start
```

3. Open the app in Expo Go or a simulator.

Notes: this project uses `react-native-mmkv`. On some Expo-managed environments MMKV's native module may be unavailable; `src/utils/mmkvPersister.ts` falls back to an in-memory Map with SecureStore backup for those cases.

## How to test key flows

- Superadmin delete (persistent-local):
	1. Open Login screen and tap the "Superadmin" test button (auto-fills credentials).
	2. Sign in.
	3. On All Products, tap Delete on a product. The product will disappear immediately and a snackbar will display.
	4. Restart the app — the deleted product will still be absent because the cached list was updated.

- Offline product display:
	1. With network ON, load All Products so the cache is populated.
	2. Disable network (airplane mode) and re-open the app. The products list should show from cache and you'll see the `(showing cached data)` badge.

- Lock & biometrics:
	1. After sign-in, stop interacting for 10s or background the app; the lock overlay will show on return.
	2. Use the biometric button to attempt `expo-local-authentication`, or use the password fallback which currently logs the user out and unlocks the UI.

## Debugging & development notes

- To inspect what is stored in MMKV you can open `src/utils/mmkvPersister.ts` — the file provides helper functions like `storage.getString(key)` and key constants in `STORAGE_KEYS`.
- I added some debug logs on startup in `App.tsx` that print the restored react-query cache and present storage keys — check Metro/console logs.
