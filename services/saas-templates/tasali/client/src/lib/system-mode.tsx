/**
 * نظام وضع التشغيل
 * يتيح للأدمن الاختيار بين نظام POS الكامل أو موقع قائمة Menu فقط
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type SystemMode = 'pos' | 'menu';

const STORAGE_KEY = 'qirox-system-mode';

interface SystemModeContextType {
  mode: SystemMode;
  setMode: (m: SystemMode) => void;
  isPOS: boolean;
  isMenu: boolean;
}

const SystemModeContext = createContext<SystemModeContextType>({
  mode: 'pos',
  setMode: () => {},
  isPOS: true,
  isMenu: false,
});

export function SystemModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<SystemMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return (saved === 'menu' || saved === 'pos') ? saved : 'pos';
    } catch {
      return 'pos';
    }
  });

  const setMode = (m: SystemMode) => {
    setModeState(m);
    try { localStorage.setItem(STORAGE_KEY, m); } catch {}
  };

  return (
    <SystemModeContext.Provider value={{
      mode,
      setMode,
      isPOS: mode === 'pos',
      isMenu: mode === 'menu',
    }}>
      {children}
    </SystemModeContext.Provider>
  );
}

export function useSystemMode() {
  return useContext(SystemModeContext);
}
