import { useRef, useEffect, useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import { getColor, getMatrixBounds } from '../utils/colorMap';
import type { HeatmapProps } from '../types';

export function Heatmap({ 
  data, 
  colorScheme = 'warm', 
  showMagnifier = false,
  magnifierScale = 1.0
}: HeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number; value: number } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [magnifierPos, setMagnifierPos] = useState<{ x: number; y: number } | null>(null);

  const { min, max } = getMatrixBounds(data.data);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const size = Math.min(containerWidth, containerHeight);

    if (size !== canvasSize.width || size !== canvasSize.height) {
      setCanvasSize({ width: size, height: size });
    }

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, size, size);

    const cellWidth = size / data.cols;
    const cellHeight = size / data.rows;

    for (let row = 0; row < data.rows; row++) {
      for (let col = 0; col < data.cols; col++) {
        const value = data.data[row][col];
        const color = getColor(value, min, max, colorScheme);
        
        ctx.fillStyle = color;
        ctx.fillRect(
          col * cellWidth,
          row * cellHeight,
          cellWidth + 0.5,
          cellHeight + 0.5
        );
      }
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= data.rows; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * cellHeight);
      ctx.lineTo(size, i * cellHeight);
      ctx.stroke();
    }
    for (let j = 0; j <= data.cols; j++) {
      ctx.beginPath();
      ctx.moveTo(j * cellWidth, 0);
      ctx.lineTo(j * cellWidth, size);
      ctx.stroke();
    }

    if (showMagnifier && magnifierPos && magnifierScale !== 1.0) {
      const magnifierRadius = 60;
      const magnifierZoom = 2.5;
      const sourceRadius = magnifierRadius / magnifierZoom;
      
      const mx = magnifierPos.x;
      const my = magnifierPos.y;
      
      ctx.save();
      
      ctx.beginPath();
      ctx.arc(mx, my, magnifierRadius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      
      const sourceX = mx - sourceRadius;
      const sourceY = my - sourceRadius;
      const sourceSize = sourceRadius * 2;
      
      ctx.imageSmoothingEnabled = false;
      
      const opacity = Math.min(1, Math.abs(magnifierScale - 1) * 0.8 + 0.2);
      
      for (let row = 0; row < data.rows; row++) {
        for (let col = 0; col < data.cols; col++) {
          const value = data.data[row][col];
          const scaledValue = value * magnifierScale;
          const color = getColor(scaledValue, min * magnifierScale, max * magnifierScale, colorScheme);
          
          const cellX = col * cellWidth;
          const cellY = row * cellHeight;
          
          const destX = mx + (cellX - mx) * magnifierZoom;
          const destY = my + (cellY - my) * magnifierZoom;
          const destWidth = cellWidth * magnifierZoom;
          const destHeight = cellHeight * magnifierZoom;
          
          ctx.globalAlpha = opacity;
          ctx.fillStyle = color;
          ctx.fillRect(destX, destY, destWidth + 1, destHeight + 1);
        }
      }
      
      ctx.restore();
      
      ctx.beginPath();
      ctx.arc(mx, my, magnifierRadius, 0, Math.PI * 2);
      ctx.strokeStyle = magnifierScale > 1 ? '#f59e0b' : '#3b82f6';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      const gradient = ctx.createRadialGradient(mx, my, magnifierRadius - 20, mx, my, magnifierRadius);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, magnifierScale > 1 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(59, 130, 246, 0.3)');
      ctx.fillStyle = gradient;
      ctx.fill();
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(mx - 35, my + magnifierRadius + 5, 70, 22);
      ctx.fillStyle = magnifierScale > 1 ? '#fbbf24' : '#60a5fa';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${magnifierScale.toFixed(1)}×`, mx, my + magnifierRadius + 21);
    }
  }, [data, colorScheme, min, max, canvasSize, showMagnifier, magnifierScale, magnifierPos]);

  useEffect(() => {
    draw();
    
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = rect.width;
    
    const cellWidth = size / data.cols;
    const cellHeight = size / data.rows;
    
    const col = Math.floor(x / cellWidth);
    const row = Math.floor(y / cellHeight);
    
    if (showMagnifier && magnifierScale !== 1.0) {
      setMagnifierPos({ x, y });
    }
    
    if (row >= 0 && row < data.rows && col >= 0 && col < data.cols) {
      setHoveredCell({
        row,
        col,
        value: data.data[row][col]
      });
    } else {
      setHoveredCell(null);
    }
  }, [data, showMagnifier, magnifierScale]);

  const handleMouseLeave = useCallback(() => {
    setHoveredCell(null);
    setMagnifierPos(null);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full aspect-square">
      <canvas
        ref={canvasRef}
        className={`rounded-lg ${showMagnifier && magnifierScale !== 1.0 ? 'cursor-crosshair' : 'cursor-crosshair'}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      
      {hoveredCell && (
        <div
          className="absolute pointer-events-none bg-zinc-900/95 text-white text-xs px-2 py-1 rounded font-mono z-10 border border-zinc-700 shadow-lg"
          style={{
            left: `${(hoveredCell.col / data.cols) * 100 + 1}%`,
            top: `${(hoveredCell.row / data.rows) * 100 + 1}%`,
            transform: 'translateY(-110%)'
          }}
        >
          [{hoveredCell.row}, {hoveredCell.col}]: {hoveredCell.value.toFixed(4)}
        </div>
      )}

      {showMagnifier && magnifierScale !== 1.0 && !magnifierPos && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 text-white/80 text-sm">
            <Search className="w-4 h-4" />
            <span>悬停查看 {magnifierScale.toFixed(1)}× 缩放效果</span>
          </div>
        </div>
      )}
      
      <div className="absolute bottom-2 right-2 flex items-center gap-1">
        <div 
          className="w-3 h-3 rounded-sm" 
          style={{ background: getColor(min, min, max, colorScheme) }}
        />
        <span className="text-[10px] text-zinc-400 font-mono">{min.toFixed(2)}</span>
        <div 
          className="w-8 h-1.5 rounded"
          style={{
            background: `linear-gradient(to right, ${getColor(min, min, max, colorScheme)}, ${getColor((min + max) / 2, min, max, colorScheme)}, ${getColor(max, min, max, colorScheme)})`
          }}
        />
        <span className="text-[10px] text-zinc-400 font-mono">{max.toFixed(2)}</span>
        <div 
          className="w-3 h-3 rounded-sm" 
          style={{ background: getColor(max, min, max, colorScheme) }}
        />
      </div>

      {showMagnifier && magnifierScale !== 1.0 && (
        <div className="absolute top-2 left-2">
          <div className={`px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 ${
            magnifierScale > 1 
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}>
            <Search className="w-3 h-3" />
            {magnifierScale.toFixed(1)}×
          </div>
        </div>
      )}
    </div>
  );
}
