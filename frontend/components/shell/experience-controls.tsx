"use client";

import { Moon, SunMedium } from "lucide-react";
import { useEffect, useState } from "react";

export function ExperienceControls() {
  const [precisionLight, setPrecisionLight] = useState(false);
  useEffect(() => {
    document.documentElement.dataset.theme = precisionLight ? "precision-light" : "command-dark";
    return () => { delete document.documentElement.dataset.theme; };
  }, [precisionLight]);
  return <button className="theme-trigger" type="button" aria-pressed={precisionLight} onClick={() => setPrecisionLight((current) => !current)}>{precisionLight ? <Moon size={14} /> : <SunMedium size={14} />}{precisionLight ? "Command dark" : "Precision light"}</button>;
}
