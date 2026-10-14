import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

interface MobileBottomNavProps {
  employeeRole?: string;
  onLogout?: () => void;
}

/** Disabled — navigation moved to page-level components */
export function MobileBottomNav(_props: MobileBottomNavProps) {
  return null;
}
