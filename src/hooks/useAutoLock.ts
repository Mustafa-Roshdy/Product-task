import { useEffect, useRef, useCallback } from "react";
import { AppState } from "react-native";
import { useDispatch } from "react-redux";
import { setLocked } from "../store/uiSlice";

export function useAutoLock(timeout = 10000) {
  const dispatch = useDispatch();
  const timer = useRef<any>(null);

  const resetTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => dispatch(setLocked(true)), timeout);
  }, [dispatch, timeout]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        dispatch(setLocked(true));
      } else {
        resetTimer();
      }
    });

    resetTimer();

    return () => {
      sub.remove();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [dispatch, resetTimer]);

  return { resetTimer };
}
