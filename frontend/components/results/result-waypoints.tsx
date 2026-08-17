"use client";

import { useEffect, useRef, useState } from "react";

const waypoints = [
  { href: "#summary", label: "Coverage", step: "01" },
  { href: "#findings", label: "Terms", step: "02" },
  { href: "#evidence-explorer", label: "Evidence", step: "03" },
  { href: "#review", label: "Review", step: "04" },
  { href: "#resume-lab", label: "Lab", step: "05" },
] as const;

export function ResultWaypoints() {
  const [active, setActive] = useState<string>(waypoints[0].href);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const railRef = useRef<HTMLOListElement>(null);
  const visibilityRef = useRef<Map<string, boolean>>(new Map());

  useEffect(() => {
    const targets = new Map<Element, string>();
    for (const waypoint of waypoints) {
      const el = document.querySelector(waypoint.href);
      if (el) {
        targets.set(el, waypoint.href);
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = targets.get(entry.target);
          if (id) {
            visibilityRef.current.set(id, entry.isIntersecting);
          }
        }
        for (const waypoint of waypoints) {
          if (visibilityRef.current.get(waypoint.href)) {
            setActive(waypoint.href);
            break;
          }
        }
      },
      {
        root: null,
        rootMargin: "-120px 0px -60% 0px",
        threshold: 0,
      }
    );

    for (const el of targets.keys()) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const activeItem = rail.querySelector(`li[data-waypoint="${active}"]`);
    if (!activeItem) return;

    const railRect = rail.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();

    if (itemRect.left < railRect.left || itemRect.right > railRect.right) {
      activeItem.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [active]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const check = () => setIsOverflowing(rail.scrollWidth > rail.clientWidth);
    check();

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(check);
      ro.observe(rail);
      return () => ro.disconnect();
    }

    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <nav
      className={`result-waypoints${isOverflowing ? " is-overflowing" : ""}`}
      aria-label="Result waypoints"
    >
      <span className="result-waypoints-label">Result map</span>
      <ol ref={railRef}>
        {waypoints.map((waypoint) => (
          <li
            key={waypoint.href}
            data-waypoint={waypoint.href}
            className={active === waypoint.href ? "is-active" : undefined}
          >
            <a
              href={waypoint.href}
              aria-current={active === waypoint.href ? "true" : undefined}
            >
              <span aria-hidden="true">{waypoint.step}</span>
              {waypoint.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
