"use client";

import { NeuroNoise } from "@paper-design/shaders-react";

export function ShaderBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 opacity-20">
      <NeuroNoise
        colorFront="#ffffff"
        colorMid="#888888"
        colorBack="#000000"
        brightness={0.08}
        contrast={0.25}
        speed={0.3}
        scale={1.2}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
