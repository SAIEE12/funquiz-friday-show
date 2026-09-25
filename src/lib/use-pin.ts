import { useEffect, useState } from "react";

const KEY = "mew-host-pin";

export function usePin() {
  const [pin, setPinState] = useState<string | null>(null);
  useEffect(() => {
    setPinState(sessionStorage.getItem(KEY));
  }, []);
  const setPin = (p: string | null) => {
    if (p) sessionStorage.setItem(KEY, p);
    else sessionStorage.removeItem(KEY);
    setPinState(p);
  };
  return { pin, setPin };
}
