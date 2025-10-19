import React, { useEffect } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { StatusBar, Pressable } from "react-native";

import { store } from "./src/store";
import Navigation from "./src/navigation";
import { mmkvPersister, storage, STORAGE_KEYS } from "./src/utils/mmkvPersister";
import LockOverlay from "./src/components/LockOverlay";
import { SafeAreaView } from "react-native-safe-area-context";
import { setUser } from "./src/store/authSlice";
import { logout } from "./src/store/authSlice";
import { useAutoLock } from "./src/hooks/useAutoLock";
import { useBiometrics } from "./src/hooks/useBiometrics";

const queryClient = new QueryClient();

function AppContent() {
  const dispatch = useDispatch();
  const locked = useSelector((state: any) => state.ui.locked);
  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);

  const { resetTimer } = useAutoLock(10000);

  useEffect(() => {
    const token = storage.getString(STORAGE_KEYS.AUTH_TOKEN);
    const userJson = storage.getString(STORAGE_KEYS.USER_DATA);
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        dispatch(setUser({ user, token }));
      } catch (e) {
        console.warn('[App] Failed to parse cached user', e);
      }
    }


    (async () => {
      try {
        const restored = await mmkvPersister.restoreClient();
        console.log('[App][DEBUG] restored react-query cache:', restored ? Object.keys(restored).length : 0, restored);
      } catch (e) {
        console.warn('[App][DEBUG] failed to restore react-query cache', e);
      }

      try {
        const keys = storage.getAllKeys ? storage.getAllKeys() : [];
        console.log('[App][DEBUG] storage keys:', keys);
      } catch (e) {
        console.warn('[App][DEBUG] failed to list storage keys', e);
      }

      try {
        const raw = storage.getString(STORAGE_KEYS.REACT_QUERY_CACHE);
        console.log('[App][DEBUG] raw react-query cache (string length):', raw ? raw.length : 0);
      } catch (e) {
        console.warn('[App][DEBUG] failed to read raw react-query cache', e);
      }
    })();
  }, [dispatch]);

  const attemptUnlock = async () => {
    try {
      const ok = await useBiometrics();
      if (ok) {
        dispatch({ type: 'ui/setLocked', payload: false });
      }
    } catch (e) {
      console.warn('[App] Biometrics failed', e);
    }
  };

  const passwordFallback = () => {
    dispatch(logout());
    dispatch({ type: 'ui/setLocked', payload: false });
  };

  return (
    <SafeAreaView style={{ flex: 1 }} onTouchStart={resetTimer}>
      <StatusBar barStyle="dark-content" />
      <Navigation />
      {isAuthenticated && <LockOverlay visible={locked} onBiometric={attemptUnlock} onPassword={passwordFallback} />}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: mmkvPersister }}>
        <QueryClientProvider client={queryClient}>
          <AppContent />
        </QueryClientProvider>
      </PersistQueryClientProvider>
    </Provider>
  );
}
