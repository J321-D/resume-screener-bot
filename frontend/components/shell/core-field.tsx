"use client";

import { useEffect, useRef } from "react";

const NODE_COUNT = 18;
const FRAME_INTERVAL_MS = 50;

export function CoreField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const surface = canvas;
    const drawing = context;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let lastFrame = -FRAME_INTERVAL_MS;
    let visible = true;

    function resize() {
      const bounds = surface.getBoundingClientRect();
      const ratio = Math.min(devicePixelRatio || 1, 1.5);
      surface.width = Math.max(1, Math.round(bounds.width * ratio));
      surface.height = Math.max(1, Math.round(bounds.height * ratio));
      drawing.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function draw(time = 0) {
      const width = surface.clientWidth;
      const height = surface.clientHeight;
      const centerX = width / 2;
      const centerY = height / 2;
      drawing.clearRect(0, 0, width, height);
      for (let index = 0; index < NODE_COUNT; index += 1) {
        const band = index % 3;
        const radius = Math.min(width, height) * (.17 + band * .105);
        const phase = index * 2.399 + (motion.matches ? 0 : time * .000025 * (band + 1));
        const x = centerX + Math.cos(phase) * radius * (1 + .08 * Math.sin(index));
        const y = centerY + Math.sin(phase) * radius * .62;
        drawing.beginPath();
        drawing.moveTo(centerX, centerY);
        drawing.lineTo(x, y);
        drawing.strokeStyle = index % 4 === 0 ? "rgba(146,125,255,.12)" : "rgba(83,229,255,.1)";
        drawing.lineWidth = .65;
        drawing.stroke();
        drawing.beginPath();
        drawing.arc(x, y, index % 5 === 0 ? 1.8 : 1.1, 0, Math.PI * 2);
        drawing.fillStyle = index % 4 === 0 ? "rgba(146,125,255,.55)" : "rgba(83,229,255,.52)";
        drawing.fill();
      }
    }

    function animate(time: number) {
      if (visible && time - lastFrame >= FRAME_INTERVAL_MS) {
        lastFrame = time;
        draw(time);
      }
      if (!motion.matches) frame = requestAnimationFrame(animate);
    }

    resize();
    draw();
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => { resize(); draw(); });
    const intersectionObserver = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    resizeObserver?.observe(surface);
    intersectionObserver?.observe(surface);
    if (!motion.matches) frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="core-procedural-field" aria-hidden="true" data-render-budget={`${NODE_COUNT} nodes / ${1000 / FRAME_INTERVAL_MS} fps`} />;
}
