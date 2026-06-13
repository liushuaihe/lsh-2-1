import { useEffect, useState, useRef } from 'react';
import { formatNumber, formatPercentage, formatMSE } from '../utils/colorMap';
import type { StatsPanelProps } from '../types';

function AnimatedNumber({ value, format, duration = 500 }: { value: number; format: (v: number) => string; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * easeProgress;
      
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
      }
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  return <span>{format(displayValue)}</span>;
}

interface StatCardProps {
  title: string;
  value: number;
  format: (v: number) => string;
  gradient: string;
  icon: string;
  suffix?: string;
  maxValue?: number;
}

function StatCard({ title, value, format, gradient, icon, suffix, maxValue }: StatCardProps) {
  const progress = maxValue ? Math.min(100, (value / maxValue) * 100) : Math.min(100, value * 100);
  
  return (
    <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-5 border border-zinc-700/50 hover:border-zinc-600/50 transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-zinc-400 mb-1">{title}</p>
          <p className="text-2xl font-bold font-mono text-white group-hover:text-zinc-100 transition-colors">
            <AnimatedNumber value={value} format={format} />
            {suffix && <span className="text-lg text-zinc-400 ml-1">{suffix}</span>}
          </p>
        </div>
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
          style={{ background: gradient }}
        >
          {icon}
        </div>
      </div>
      
      <div className="mt-4 h-1 bg-zinc-700/50 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${progress}%`,
            background: gradient
          }}
        />
      </div>
    </div>
  );
}

export function StatsPanel({ 
  originalParams, 
  loraParams, 
  savingRatio, 
  mse, 
  rank,
  alpha,
  deltaNorm,
  deltaScaledNorm,
  updatedNorm,
  originalNorm,
  scaleRatio
}: StatsPanelProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="原始参数量"
          value={originalParams}
          format={(v) => formatNumber(v, 0)}
          gradient="linear-gradient(135deg, #6366f1, #8b5cf6)"
          icon="📊"
          maxValue={10000}
        />
        
        <StatCard
          title="LoRA 参数量"
          value={loraParams}
          format={(v) => formatNumber(v, 0)}
          gradient="linear-gradient(135deg, #06b6d4, #3b82f6)"
          icon="🧩"
          maxValue={2000}
        />
        
        <StatCard
          title="参数量节省比例"
          value={savingRatio}
          format={(v) => formatPercentage(v, 1)}
          gradient="linear-gradient(135deg, #10b981, #059669)"
          icon="💾"
          maxValue={1}
        />
        
        <StatCard
          title="重构误差 (MSE)"
          value={mse}
          format={(v) => formatMSE(v, 4)}
          gradient="linear-gradient(135deg, #f59e0b, #ef4444)"
          icon="📉"
          maxValue={0.1}
        />
      </div>

      {(deltaNorm !== undefined || deltaScaledNorm !== undefined || scaleRatio !== undefined) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {deltaNorm !== undefined && (
            <StatCard
              title="||ΔW|| (未缩放)"
              value={deltaNorm}
              format={(v) => v.toFixed(4)}
              gradient="linear-gradient(135deg, #8b5cf6, #6366f1)"
              icon="📐"
              maxValue={10}
            />
          )}
          
          {deltaScaledNorm !== undefined && (
            <StatCard
              title={`||α×ΔW|| (缩放 ${alpha?.toFixed(1) || '1.0'}×)`}
              value={deltaScaledNorm}
              format={(v) => v.toFixed(4)}
              gradient="linear-gradient(135deg, #f59e0b, #d97706)"
              icon="🔍"
              maxValue={50}
            />
          )}
          
          {scaleRatio !== undefined && (
            <StatCard
              title="缩放比例"
              value={scaleRatio}
              format={(v) => `${v.toFixed(2)}×`}
              gradient="linear-gradient(135deg, #ec4899, #be185d)"
              icon="⚖️"
              maxValue={10}
            />
          )}
          
          {updatedNorm !== undefined && (
            <StatCard
              title="||W'|| (更新后)"
              value={updatedNorm}
              format={(v) => v.toFixed(4)}
              gradient="linear-gradient(135deg, #10b981, #047857)"
              icon="✨"
              maxValue={20}
            />
          )}
        </div>
      )}

      {(deltaNorm !== undefined || deltaScaledNorm !== undefined) && (
        <div className="bg-gradient-to-r from-purple-900/30 via-amber-900/30 to-green-900/30 rounded-2xl p-5 border border-zinc-700/50">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            Alpha 缩放效果直观对比
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/30">
              <div className="text-sm text-zinc-400 mb-2">更新公式</div>
              <div className="font-mono text-white text-center text-lg">
                W' = W₀ + <span className="text-purple-400">α</span> × <span className="text-cyan-400">(B×A)</span>
              </div>
            </div>
            <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/30">
              <div className="text-sm text-zinc-400 mb-2">缩放效果</div>
              <div className="font-mono text-white text-center text-lg">
                <span className="text-cyan-400">||ΔW||</span>
                <span className="text-zinc-500"> → </span>
                <span className="text-amber-400">{(scaleRatio || 1).toFixed(2)}×</span>
                <span className="text-zinc-500"> → </span>
                <span className="text-amber-400">||α×ΔW||</span>
              </div>
            </div>
            <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/30">
              <div className="text-sm text-zinc-400 mb-2">范数变化</div>
              <div className="font-mono text-white text-center text-lg">
                {deltaNorm !== undefined && (
                  <span className="text-purple-400">{deltaNorm.toFixed(2)}</span>
                )}
                <span className="text-zinc-500"> → </span>
                {updatedNorm !== undefined && (
                  <span className="text-green-400">{updatedNorm.toFixed(2)}</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-black/30 rounded-xl border border-zinc-700/30">
            <div className="text-sm text-zinc-300 leading-relaxed">
              <strong className="text-amber-400">💡 理解 Alpha 的作用：</strong>
              LoRA 中使用 <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-amber-300">α/r</code> 作为缩放因子，
              当 <span className="text-purple-400">α</span> 增大时，低秩矩阵 <span className="text-cyan-400">B×A</span> 的影响被放大，
              权重更新幅度更显著。这相当于给低秩适应一个"音量旋钮"，可以调节新知识对原始模型的影响程度。
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
