import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, ZoomIn, ZoomOut } from 'lucide-react';
import type { AlphaSliderProps } from '../types';

export function AlphaSlider({
  value,
  min = 0,
  max = 10,
  step = 0.1,
  onChange,
  onChangeEnd,
  disabled = false
}: AlphaSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const labelRef = useRef<HTMLDivElement>(null);

  const ticks = [0, 0.5, 1, 2, 5, 10];

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    onChange(newValue);
  }, [onChange]);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (onChangeEnd) {
      onChangeEnd(value);
    }
  }, [onChangeEnd, value]);

  const percentage = ((value - min) / (max - min)) * 100;

  const getMagnifierIntensity = () => {
    if (value < 1) return 0.5;
    if (value < 2) return 0.75;
    if (value < 5) return 1;
    return 1.5;
  };

  const intensity = getMagnifierIntensity();

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (onChangeEnd) {
          onChangeEnd(value);
        }
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, onChangeEnd, value]);

  const getGradientColor = () => {
    if (value < 0.5) return 'from-zinc-500 to-zinc-400';
    if (value < 1) return 'from-blue-600 to-cyan-500';
    if (value < 2) return 'from-cyan-500 to-emerald-500';
    if (value < 5) return 'from-emerald-500 to-yellow-500';
    return 'from-yellow-500 to-red-500';
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Search className="w-4 h-4 text-purple-400" />
          Alpha 缩放系数
        </label>
        <div className="flex items-center gap-3">
          <div 
            ref={labelRef}
            className={`bg-gradient-to-r ${getGradientColor()} px-4 py-1.5 rounded-lg font-mono font-bold text-white shadow-lg transition-all duration-150 flex items-center gap-2`}
            style={{
              transform: isDragging ? 'scale(1.1)' : 'scale(1)',
              boxShadow: isDragging 
                ? `0 0 20px rgba(168, 85, 247, ${0.3 * intensity})` 
                : `0 0 10px rgba(168, 85, 247, ${0.2 * intensity})`,
            }}
          >
            {value < 1 ? (
              <ZoomOut className="w-4 h-4" />
            ) : (
              <ZoomIn className="w-4 h-4" />
            )}
            {value.toFixed(1)}×
          </div>
        </div>
      </div>
    
      <div className="relative">
        <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${getGradientColor()} rounded-full transition-all duration-75`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleInput}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
      
        <div 
          className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg border-2 pointer-events-none transition-all duration-75`}
          style={{ 
            left: `calc(${percentage}% - 10px)`,
            borderColor: value < 1 ? '#71717a' : value < 2 ? '#3b82f6' : value < 5 ? '#10b981' : '#ef4444',
            boxShadow: isDragging 
              ? `0 0 0 4px rgba(168, 85, 247, 0.3), 0 0 20px rgba(168, 85, 247, ${0.3 * intensity})` 
              : '0 1px 3px rgba(0,0,0,0.3)',
            transform: `translateY(-50%) ${isDragging ? 'scale(1.2)' : 'scale(1)'}`,
          }}
        />
      </div>
    
      <div className="flex justify-between mt-2">
        {ticks.map((tick) => (
          <div
            key={tick}
            className="flex flex-col items-center"
          >
            <div 
              className="w-0.5 h-2 rounded-full transition-colors duration-200"
              style={{
                backgroundColor: value >= tick 
                  ? (tick < 1 ? '#71717a' : tick < 2 ? '#3b82f6' : tick < 5 ? '#10b981' : '#ef4444')
                  : 'rgba(113, 113, 122, 0.5)',
              }}
            />
            <span 
              className="text-xs mt-1 font-mono transition-colors duration-200"
              style={{
                color: value >= tick 
                  ? (tick < 1 ? '#71717a' : tick < 2 ? '#60a5fa' : tick < 5 ? '#34d399' : '#f87171')
                  : '#71717a',
              }}
            >
              {tick}
            </span>
          </div>
        ))}
      </div>
    
      <p className="text-xs text-zinc-500 mt-3">
        调整 Alpha 值观察权重更新幅度变化。Alpha = α/r，较大的 Alpha 会放大小矩阵 B×A 的影响，
        使权重更新更显著
      </p>

      <div className="mt-4 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-400">缩放强度</span>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-2 h-4 rounded-sm transition-all duration-300 ${
                  i < Math.ceil(intensity * 2)
                    ? 'bg-purple-500'
                    : 'bg-zinc-700'
                }`}
                style={{
                  opacity: i < Math.ceil(intensity * 2) ? 0.4 + i * 0.15 : 0.3,
                  transform: i < Math.ceil(intensity * 2) ? `scaleY(${1 + i * 0.1})` : 'scaleY(1)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
