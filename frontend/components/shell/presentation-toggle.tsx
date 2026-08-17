"use client";

import { MonitorUp } from "lucide-react";
import { useEffect, useState } from "react";

export function PresentationToggle() {
  const [active, setActive] = useState(false);
  useEffect(() => {
    function syncPresentation(event: Event) {
      setActive((event as CustomEvent<{ active: boolean }>).detail.active);
    }
    window.addEventListener("presentation-mode-change", syncPresentation);
    return () => window.removeEventListener("presentation-mode-change", syncPresentation);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.presentation = active ? "active" : "standard";
    document.documentElement.dataset.showcase = active ? "active" : "standard";
    return () => { delete document.documentElement.dataset.presentation; delete document.documentElement.dataset.showcase; };
  }, [active]);
  return <button className="presentation-trigger" type="button" aria-pressed={active} onClick={() => setActive((value) => !value)}><MonitorUp size={14} aria-hidden="true" />{active ? "Exit showcase" : "Showcase"}</button>;
}
