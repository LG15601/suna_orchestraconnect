"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState } from "react";

interface DarkBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  dotDensity?: number; // Number of dots per 1000px²
  dotColor?: string; // Color of the dots
  glowIntensity?: number; // Intensity of the glow effect (0-1)
}

export const DarkBackground: React.FC<DarkBackgroundProps> = ({
  className,
  dotDensity = 5, // Default: 5 dots per 1000px²
  dotColor = "#00C389", // Default: OrchestraConnect green
  glowIntensity = 0.3, // Default: 30% glow intensity
  ...props
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isInView, setIsInView] = useState(false);
  
  // Setup canvas and draw dots
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const updateCanvasSize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      
      // Only update if size changed
      if (canvasSize.width !== newWidth || canvasSize.height !== newHeight) {
        setCanvasSize({ width: newWidth, height: newHeight });
        
        // Update canvas dimensions
        const dpr = window.devicePixelRatio || 1;
        canvas.width = newWidth * dpr;
        canvas.height = newHeight * dpr;
        canvas.style.width = `${newWidth}px`;
        canvas.style.height = `${newHeight}px`;
        
        // Draw the background
        drawBackground(canvas, newWidth, newHeight, dpr);
      }
    };
    
    const drawBackground = (
      canvas: HTMLCanvasElement,
      width: number,
      height: number,
      dpr: number
    ) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw deep black background
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Calculate number of dots based on density and area
      const area = width * height;
      const numDots = Math.floor((area / 1000) * dotDensity);
      
      // Draw random dots with glow
      for (let i = 0; i < numDots; i++) {
        const x = Math.random() * width * dpr;
        const y = Math.random() * height * dpr;
        const size = Math.random() * 2 * dpr + 0.5 * dpr; // Random size between 0.5-2.5px
        
        // Add glow effect
        const glow = ctx.createRadialGradient(
          x, y, 0,
          x, y, size * 4
        );
        
        glow.addColorStop(0, dotColor);
        glow.addColorStop(0.5, `${dotColor}${Math.floor(glowIntensity * 40).toString(16)}`); // 25% opacity
        glow.addColorStop(1, "transparent");
        
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, size * 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw the dot
        ctx.fillStyle = dotColor;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Add subtle circuit-like lines (very faint)
      ctx.strokeStyle = `${dotColor}10`; // Very low opacity
      ctx.lineWidth = 0.5 * dpr;
      
      const numLines = Math.floor(numDots / 10); // Fewer lines than dots
      
      for (let i = 0; i < numLines; i++) {
        const startX = Math.random() * width * dpr;
        const startY = Math.random() * height * dpr;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        
        // Create a path with 1-3 segments
        const segments = Math.floor(Math.random() * 3) + 1;
        let currentX = startX;
        let currentY = startY;
        
        for (let j = 0; j < segments; j++) {
          // Decide if horizontal or vertical movement
          if (Math.random() > 0.5) {
            // Horizontal
            currentX += (Math.random() - 0.5) * width * 0.2 * dpr;
          } else {
            // Vertical
            currentY += (Math.random() - 0.5) * height * 0.2 * dpr;
          }
          
          ctx.lineTo(currentX, currentY);
        }
        
        ctx.stroke();
      }
    };
    
    // Initial setup
    updateCanvasSize();
    
    // Setup resize observer
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });
    
    resizeObserver.observe(container);
    
    // Setup intersection observer to only render when visible
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    
    intersectionObserver.observe(canvas);
    
    return () => {
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [canvasSize, dotColor, dotDensity, glowIntensity]);
  
  return (
    <div
      ref={containerRef}
      className={cn(`h-full w-full ${className}`)}
      {...props}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none"
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
        }}
      />
    </div>
  );
};
