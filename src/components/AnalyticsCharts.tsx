import React, { useState } from 'react';
import { Award, CheckCircle, TrendingUp, Clock } from 'lucide-react';

interface AnalyticsChartsProps {
  studyHoursData: { day: string; hours: number; dateString?: string }[];
  skillGrowthData: { name: string; score: number }[];
  readinessScore: number;
  streakDays: number;
  targetHours?: number;
  onLogHours?: (dateString: string, hours: number) => void;
}

export default function AnalyticsCharts({
  studyHoursData,
  skillGrowthData,
  readinessScore,
  streakDays,
  targetHours = 4,
  onLogHours,
}: AnalyticsChartsProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [hoveredSkill, setHoveredSkill] = useState<number | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(6); // Default to today (last index)
  const [customHours, setCustomHours] = useState<string>('0');

  const selectedDay = studyHoursData[selectedDayIndex];

  // Constants for hours bar chart
  const barChartWidth = 480;
  const barChartHeight = 200;
  const barPadding = 12;
  const maxHours = Math.max(...studyHoursData.map((d) => d.hours), targetHours, 8);

  // Skill growth circular coordinates
  const radius = 70;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (readinessScore / 100) * circumference;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Career Readiness Score Circle */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center relative group overflow-hidden shadow-sm">
        <h3 className="text-slate-800 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-blue-600" /> Career Readiness Score
        </h3>

        <div className="relative w-44 h-44 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background ring */}
            <circle
              cx="88"
              cy="88"
              r={radius}
              className="stroke-slate-100 fill-transparent"
              strokeWidth={strokeWidth}
            />
            {/* Glow backing */}
            <circle
              cx="88"
              cy="88"
              r={radius}
              className="stroke-blue-100/50 fill-transparent blur-[1px]"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
            {/* Main colored progress ring */}
            <circle
              cx="88"
              cy="88"
              r={radius}
              className="stroke-blue-600 fill-transparent transition-all duration-1000 ease-out"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute text-center">
            <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{readinessScore}%</span>
            <p className="text-slate-500 text-[10px] uppercase font-bold mt-0.5 tracking-wider">Job Ready</p>
          </div>
        </div>

        <div className="flex gap-6 mt-6 text-center">
          <div>
            <span className="text-emerald-700 text-lg font-bold">{streakDays} Days</span>
            <p className="text-slate-500 text-xs font-semibold">Study Streak</p>
          </div>
          <div className="w-[1px] h-8 bg-slate-200" />
          <div>
            <span className="text-blue-600 text-lg font-bold">Excellent</span>
            <p className="text-slate-500 text-xs font-semibold">Pace Status</p>
          </div>
        </div>
      </div>

      {/* Study Hours bar chart */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:col-span-2 flex flex-col justify-between group overflow-hidden shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-800 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" /> Daily Study Hours
          </h3>
          <span className="text-slate-400 text-xs font-semibold">Last 7 Days</span>
        </div>

        {/* SVG Bar Chart */}
        <div className="relative w-full overflow-x-auto">
          <svg viewBox={`0 0 ${barChartWidth} ${barChartHeight}`} className="w-full h-auto min-w-[350px]">
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
              const y = barChartHeight - 30 - ratio * (barChartHeight - 50);
              return (
                <g key={index}>
                  <line
                    x1="40"
                    y1={y}
                    x2={barChartWidth - 10}
                    y2={y}
                    className="stroke-slate-100"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text x="5" y={y + 4} className="fill-slate-400 font-mono text-[10px] font-semibold" textAnchor="start">
                    {Math.round(ratio * maxHours)}h
                  </text>
                </g>
              );
            })}

            {/* Target study hours reference line */}
            {targetHours && targetHours <= maxHours && (
              <g>
                {(() => {
                  const y = barChartHeight - 30 - (targetHours / maxHours) * (barChartHeight - 50);
                  return (
                    <>
                      <line
                        x1="40"
                        y1={y}
                        x2={barChartWidth - 10}
                        y2={y}
                        className="stroke-blue-400/80"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={barChartWidth - 15}
                        y={y - 5}
                        className="fill-blue-500 font-bold text-[8px] uppercase tracking-wider"
                        textAnchor="end"
                      >
                        Target Goal ({targetHours}h)
                      </text>
                    </>
                  );
                })()}
              </g>
            )}

            {/* Bars */}
            {studyHoursData.map((d, index) => {
              const barCount = studyHoursData.length;
              const sectionWidth = (barChartWidth - 50) / barCount;
              const barWidth = sectionWidth - barPadding * 2;
              const barHeight = (d.hours / maxHours) * (barChartHeight - 50);
              const x = 50 + index * sectionWidth + barPadding;
              const y = barChartHeight - 30 - barHeight;

              const isHovered = hoveredBar === index;

              return (
                <g
                  key={index}
                  onMouseEnter={() => setHoveredBar(index)}
                  onMouseLeave={() => setHoveredBar(null)}
                  className="cursor-pointer"
                >
                  {/* Glowing background bar on hover */}
                  <rect
                    x={x - 2}
                    y={y - 2}
                    width={barWidth + 4}
                    height={barHeight + 2}
                    rx="6"
                    className={`fill-transparent transition-all duration-300 ${isHovered ? 'fill-emerald-50 stroke-emerald-200/50' : ''}`}
                    strokeWidth="1"
                  />
                  {/* Main bar */}
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx="4"
                    className="fill-emerald-600 transition-all duration-500 ease-out"
                  />
                  {/* Text on top of hovered bar */}
                  {isHovered && (
                    <g>
                      <rect x={x - 10} y={y - 25} width={barWidth + 20} height={18} rx="4" className="fill-slate-900 stroke-slate-800" strokeWidth="1" />
                      <text x={x + barWidth / 2} y={y - 12} className="fill-white font-semibold font-mono text-[9px]" textAnchor="middle">
                        {d.hours} hrs
                      </text>
                    </g>
                  )}
                  {/* X Axis labels */}
                  <text x={x + barWidth / 2} y={barChartHeight - 10} className="fill-slate-500 font-bold text-[10px]" textAnchor="middle">
                    {d.day}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Manual self-study logging interface */}
        {onLogHours && selectedDay && (
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Log Extra Self-Study</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">Select Day:</span>
                <div className="flex flex-wrap gap-1">
                  {studyHoursData.map((d, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedDayIndex(idx);
                        setCustomHours('0');
                      }}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                        selectedDayIndex === idx
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-100'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {d.day}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
                <span className="text-xs text-slate-500 font-semibold">Extra:</span>
                <input
                  type="number"
                  min="0"
                  max="12"
                  step="0.5"
                  value={customHours}
                  onChange={(e) => setCustomHours(e.target.value)}
                  className="w-12 text-center text-xs font-bold text-slate-850 focus:outline-none bg-transparent"
                />
                <span className="text-[10px] text-slate-400 font-semibold">hrs</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (onLogHours && selectedDay.dateString) {
                    const extra = parseFloat(customHours) || 0;
                    onLogHours(selectedDay.dateString, extra);
                    setCustomHours('0');
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-emerald-100/50 cursor-pointer"
              >
                Log Hours
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Skill Gap and Target Progression Breakdown */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:col-span-3 shadow-sm">
        <h3 className="text-slate-800 text-xs font-bold uppercase tracking-wider mb-5 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" /> Skill Competency Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {skillGrowthData.map((skill, index) => {
            const isHovered = hoveredSkill === index;
            return (
              <div
                key={skill.name}
                onMouseEnter={() => setHoveredSkill(index)}
                onMouseLeave={() => setHoveredSkill(null)}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 transition-all duration-300 hover:border-slate-300 shadow-sm"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-800 text-xs font-bold">{skill.name}</span>
                  <span className="text-slate-500 text-xs font-mono font-bold">{skill.score}%</span>
                </div>
                {/* Horizontal Progress Bar */}
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${skill.score}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-2.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Level</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    skill.score >= 80 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                    skill.score >= 50 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-100 border-slate-200 text-slate-500'
                  }`}>
                    {skill.score >= 80 ? 'Advanced' : skill.score >= 50 ? 'Intermediate' : 'Beginner'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
