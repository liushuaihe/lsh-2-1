import { useState } from 'react';
import { RefreshCw, Layers, ArrowRight, Plus, Minus } from 'lucide-react';
import { MatrixCard } from '../components/MatrixCard';
import { RankSlider } from '../components/RankSlider';
import { AlphaSlider } from '../components/AlphaSlider';
import { StatsPanel } from '../components/StatsPanel';
import { FinetunePanel } from '../components/FinetunePanel';
import { RecordPanel } from '../components/RecordPanel';
import { useLora } from '../hooks/useLora';

export default function Home() {
  const {
    rank,
    alpha,
    isLoading,
    isFinetuning,
    error,
    matrixW,
    matrixA,
    matrixB,
    matrixDelta,
    matrixDeltaScaled,
    matrixUpdated,
    stats,
    deltaStats,
    finetuneSteps,
    currentStepIndex,
    records,
    setRank,
    setAlpha,
    generateMatrix,
    startFinetune,
    setCurrentStepIndex,
    saveCurrentRecord,
    deleteRecord,
    loadRecord,
  } = useLora();

  const [currentSeed, setCurrentSeed] = useState(42);
  const [activeTab, setActiveTab] = useState<'decompose' | 'delta' | 'finetune'>('decompose');

  const handleRefresh = () => {
    const newSeed = Math.floor(Math.random() * 10000);
    setCurrentSeed(newSeed);
    generateMatrix(64, 64, newSeed);
  };

  const handleSaveRecord = () => {
    saveCurrentRecord(currentSeed);
  };

  const handleStartFinetune = (steps: number, learningRate: number) => {
    startFinetune(rank, alpha, steps, learningRate);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
            LoRA 微调机制教学沙盒
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            通过交互式可视化理解低秩适配（Low-Rank Adaptation）的核心原理
          </p>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/30 rounded-xl text-red-300 text-center">
            {error}
          </div>
        )}

        <div className="mb-6">
          <RecordPanel
            records={records}
            onLoadRecord={loadRecord}
            onDeleteRecord={deleteRecord}
            onSaveCurrent={handleSaveRecord}
            isLoading={isLoading}
            currentSeed={currentSeed}
          />
        </div>

        <div className="mb-6">
          <FinetunePanel
            steps={finetuneSteps}
            currentStepIndex={currentStepIndex}
            isFinetuning={isFinetuning}
            onStartFinetune={handleStartFinetune}
            onStepChange={setCurrentStepIndex}
            rank={rank}
            alpha={alpha}
          />
        </div>

        <div className="bg-zinc-800/30 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-zinc-700/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">矩阵可视化</h2>
              <p className="text-sm text-zinc-400">
                观察原始矩阵、低秩分解、权重更新和 Alpha 缩放效果
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-700/50 hover:bg-zinc-700 text-white rounded-lg border border-zinc-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              重新生成矩阵
            </button>
          </div>

          <div className="flex gap-2 mb-6">
            {[
              { id: 'decompose', label: '矩阵分解', icon: <Layers className="w-4 h-4" /> },
              { id: 'delta', label: '权重更新 ΔW', icon: <ArrowRight className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-zinc-700/50 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {isLoading && !matrixW && (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            </div>
          )}

          {matrixW && matrixA && matrixB && activeTab === 'decompose' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <MatrixCard
                data={matrixW}
                title="原始矩阵 W₀"
                subtitle="m × n 维预训练权重矩阵"
                colorScheme="warm"
              />
              
              <MatrixCard
                data={matrixB}
                title={`矩阵 B (r=${rank})`}
                subtitle={`${matrixB.rows} × ${matrixB.cols} 左奇异矩阵`}
                colorScheme="cool"
              />
              
              <MatrixCard
                data={matrixA}
                title={`矩阵 A (r=${rank})`}
                subtitle={`${matrixA.rows} × ${matrixA.cols} 右奇异矩阵`}
                colorScheme="viridis"
              />
            </div>
          )}

          {matrixDelta && matrixDeltaScaled && matrixUpdated && activeTab === 'delta' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <MatrixCard
                  data={matrixDelta}
                  title="ΔW = B × A"
                  subtitle="未缩放的权重更新量"
                  colorScheme="cool"
                />
                
                <MatrixCard
                  data={matrixDeltaScaled}
                  title={`α × ΔW (${alpha.toFixed(1)}×)`}
                  subtitle="Alpha 缩放后的更新量"
                  colorScheme="warm"
                  showMagnifier={true}
                  magnifierScale={alpha}
                />
                
                <MatrixCard
                  data={matrixUpdated}
                  title="W' = W₀ + α×ΔW"
                  subtitle="更新后的权重矩阵"
                  colorScheme="viridis"
                />
              </div>

              <div className="bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-amber-900/20 rounded-2xl p-6 border border-zinc-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="text-2xl">🔍</span>
                  Alpha 缩放效果演示
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Minus className="w-4 h-4 text-blue-400" />
                        <span className="text-zinc-400">缩小 (Alpha {'<'} 1)</span>
                      </div>
                      <span className="text-zinc-500">→</span>
                      <span className="text-zinc-300">权重更新幅度减小，更保守</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4 text-amber-400" />
                        <span className="text-zinc-400">放大 (Alpha {'>'} 1)</span>
                      </div>
                      <span className="text-zinc-500">→</span>
                      <span className="text-zinc-300">权重更新幅度增大，更激进</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">
                      💡 在中间的热力图上悬停鼠标，可以看到放大镜效果直观展示 Alpha 缩放如何改变数值大小
                    </p>
                  </div>
                  <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/30">
                    <div className="font-mono text-sm space-y-2">
                      <p className="text-zinc-300">
                        <span className="text-purple-400">ΔW</span> = B × A
                      </p>
                      <p className="text-zinc-300">
                        <span className="text-amber-400">scaled_ΔW</span> = <span className="text-purple-400">α</span> × <span className="text-purple-400">ΔW</span>
                      </p>
                      <p className="text-zinc-300">
                        <span className="text-green-400">W'</span> = <span className="text-blue-400">W₀</span> + <span className="text-amber-400">scaled_ΔW</span>
                      </p>
                      <p className="text-zinc-500 text-xs pt-2 border-t border-zinc-700/50">
                        其中 α = Alpha × r，实际使用时常设为 α = r 使缩放因子为 1
                      </p>
                    </div>
                  </div>
                </div>

                {deltaStats && (
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/30 text-center">
                      <div className="text-2xl font-bold text-purple-400 font-mono">
                        {deltaStats.deltaNorm.toFixed(4)}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">||ΔW||</div>
                    </div>
                    <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/30 text-center">
                      <div className="text-2xl font-bold text-amber-400 font-mono">
                        {deltaStats.deltaScaledNorm.toFixed(4)}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">||α×ΔW||</div>
                    </div>
                    <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/30 text-center">
                      <div className="text-2xl font-bold text-pink-400 font-mono">
                        {alpha.toFixed(2)}×
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">缩放倍数</div>
                    </div>
                    <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/30 text-center">
                      <div className="text-2xl font-bold text-green-400 font-mono">
                        {deltaStats.updatedNorm.toFixed(4)}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">||W'||</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-zinc-800/30 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-zinc-700/50">
          <h2 className="text-xl font-semibold text-white mb-6">超参数控制</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <RankSlider
              value={rank}
              min={1}
              max={64}
              onChange={setRank}
              disabled={isLoading || isFinetuning}
            />
            <AlphaSlider
              value={alpha}
              min={0}
              max={10}
              step={0.1}
              onChange={setAlpha}
              disabled={isLoading || isFinetuning}
            />
          </div>
        </div>

        {stats && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-6">实时统计</h2>
            <StatsPanel
              originalParams={stats.originalParams}
              loraParams={stats.loraParams}
              savingRatio={stats.savingRatio}
              mse={stats.mse}
              rank={rank}
              alpha={alpha}
              deltaNorm={deltaStats?.deltaNorm}
              deltaScaledNorm={deltaStats?.deltaScaledNorm}
              updatedNorm={deltaStats?.updatedNorm}
              originalNorm={deltaStats?.originalNorm}
              scaleRatio={deltaStats?.scaleRatio}
            />
          </div>
        )}

        <div className="bg-zinc-800/30 backdrop-blur-sm rounded-2xl p-6 border border-zinc-700/50">
          <h2 className="text-xl font-semibold text-white mb-4">LoRA 原理简介</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-blue-400 mb-2">核心思想</h3>
              <p className="text-zinc-300 leading-relaxed">
                LoRA（Low-Rank Adaptation）通过对大模型的权重矩阵进行低秩分解来实现高效微调。
                与其直接更新整个 m×n 的权重矩阵 W，我们更新两个小矩阵 B (r×m) 和 A (r×n)，
                其中 r ≪ min(m,n)。这样可以大幅减少需要训练的参数量。
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-cyan-400 mb-2">数学公式</h3>
              <div className="bg-zinc-900/50 rounded-xl p-4 font-mono text-zinc-200">
                <p className="mb-2">前向传播时：</p>
                <p className="text-center text-lg">W' = W₀ + (α/r) × B × A</p>
                <p className="mt-4 text-sm text-zinc-400">
                  其中 W₀ 是预训练权重，B 和 A 是可训练的低秩矩阵，α 是缩放系数
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
            <h3 className="text-md font-medium text-blue-300 mb-2">💡 权衡关系</h3>
            <p className="text-zinc-300 text-sm leading-relaxed">
              <strong>秩 r 越小</strong>：参数量节省越多 → 训练速度越快、内存占用越小 → 但重构误差越大，模型表达能力受限<br />
              <strong>秩 r 越大</strong>：重构误差越小，模型表达能力越强 → 但参数量节省减少，训练成本增加<br />
              <strong>Alpha 越大</strong>：低秩更新的影响越大 → 模型更容易学习新知识 → 但可能导致灾难性遗忘
            </p>
          </div>
        </div>

        <footer className="mt-10 text-center text-zinc-500 text-sm">
          <p>LoRA 微调机制教学沙盒 · 交互式可视化学习工具</p>
        </footer>
      </div>
    </div>
  );
}
