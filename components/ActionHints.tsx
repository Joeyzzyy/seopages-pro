'use client';

import { useState } from 'react';

interface ActionHintsProps {
  skills: any[];
  onPlaybookClick: (skill: any) => void;
}

export default function ActionHints({ skills, onPlaybookClick }: ActionHintsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'research' | 'build' | 'optimize' | 'monitor'>('research');

  const playbookSkills = skills.filter(s => s.metadata?.category !== 'system');
  
  const categoryOrder = ['research', 'build', 'optimize', 'monitor'];
  
  // 动态提取所有分类并按顺序排序
  const dynamicCategories = Array.from(new Set(playbookSkills.map(s => s.metadata?.category).filter(Boolean))) as string[];
  dynamicCategories.sort((a, b) => {
    const aIdx = categoryOrder.indexOf(a);
    const bIdx = categoryOrder.indexOf(b);
    if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });
  
  const categoryNames: Record<string, string> = {
    research: 'Research',
    build: 'Build',
    optimize: 'Optimize',
    monitor: 'Monitor'
  };

  const categories = dynamicCategories.map(id => ({
    id,
    name: categoryNames[id] || id.charAt(0).toUpperCase() + id.slice(1)
  }));

  const groupedSkills: Record<string, any[]> = {};

  // 动态填充各分类下的技能
  dynamicCategories.forEach(cat => {
    groupedSkills[cat] = playbookSkills.filter(s => s.metadata?.category === cat);
  });

  Object.keys(groupedSkills).forEach(cat => {
    groupedSkills[cat].sort((a, b) => {
      // 1. Prioritize OpenSource skills
      const aIsOS = !!a.metadata?.isOpenSource;
      const bIsOS = !!b.metadata?.isOpenSource;
      if (aIsOS !== bIsOS) return aIsOS ? -1 : 1;

      // 2. Sort by availability (playbook trigger present)
      const aAvail = !!a.metadata?.playbook?.trigger;
      const bAvail = !!b.metadata?.playbook?.trigger;
      if (aAvail !== bAvail) return aAvail ? -1 : 1;

      // 3. 按优先级排序 (如果 metadata.priority 是数字字符串)
      const aPriority = parseInt(a.metadata?.priority || '99');
      const bPriority = parseInt(b.metadata?.priority || '99');
      if (aPriority !== bPriority) return aPriority - bPriority;

      return a.name.localeCompare(b.name);
    });
  });

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-7 h-7 rounded-full border transition-all flex items-center justify-center cursor-pointer ${
          isOpen 
            ? 'bg-[#111827] border-[#111827] text-white shadow-sm' 
            : 'bg-[#FAFAFA] border-[#E5E5E5] text-[#6B7280] hover:bg-[#F3F4F6]'
        }`}
        title="Action Hints (Playbooks)"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full left-0 mb-1 w-[480px] h-[480px] bg-white rounded-2xl shadow-2xl border border-[#E5E5E5] flex z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-bottom-left">
            {/* Sidebar Category Selection - Vertical Tabs */}
            <div className="w-32 bg-[#FAFAFA] border-r border-[#F5F5F5] flex flex-col p-2 gap-1 shrink-0">
              <div className="px-2 py-2 mb-1">
                <span className="text-[9px] font-black text-[#111827] uppercase tracking-[0.2em] opacity-50">
                  Playbooks
                </span>
              </div>
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                if (groupedSkills[cat.id]?.length === 0) return null;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id as any)}
                    className={`relative px-3 py-2.5 rounded-xl text-left text-[10px] font-bold uppercase tracking-wider transition-all ${
                      isActive 
                        ? 'bg-white text-[#111827] shadow-sm border border-[#F0F0F0]' 
                        : 'text-[#9CA3AF] hover:text-[#6B7280] hover:bg-[#F3F4F6]'
                    }`}
                  >
                    {cat.name}
                    {isActive && (
                      <div 
                        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
                        style={{
                          background: 'linear-gradient(180deg, #FFB040, #D194EC, #9A8FEA, #65B4FF)'
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* List of Actions - Scrollable Area */}
            <div className="flex-1 p-2 overflow-y-auto thin-scrollbar bg-white">
              <div className="grid grid-cols-1 gap-0.5">
                {groupedSkills[activeCategory]?.map((skill) => {
                  const isAvailable = !!skill.metadata?.playbook?.trigger;
                  
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => {
                        if (isAvailable) {
                          onPlaybookClick(skill);
                          setIsOpen(false);
                        }
                      }}
                      disabled={!isAvailable}
                      className={`group flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left ${
                        isAvailable
                          ? 'hover:bg-[#FAFAFA] cursor-pointer border border-transparent hover:border-[#F5F5F5]'
                          : 'opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-4">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-[11px] font-bold truncate ${
                            isAvailable ? 'text-[#374151]' : 'text-[#9CA3AF]'
                          }`}>
                            {skill.name.split(': ')[1] || skill.name}
                          </span>
                          {skill.metadata?.isOpenSource && (
                            <span className="flex-none px-1 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[6px] font-black tracking-tighter border border-emerald-100 uppercase">
                              Open
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#9CA3AF] line-clamp-2 leading-relaxed">
                          {skill.description}
                        </span>
                      </div>
                      {!isAvailable ? (
                        <span className="text-[8px] font-black text-[#D1D5DB] uppercase tracking-tighter bg-[#FAFAFA] px-1.5 py-0.5 rounded border border-[#F5F5F5] shrink-0">Soon</span>
                      ) : (
                        <svg className="w-3 h-3 text-[#E5E5E5] group-hover:text-[#111827] transition-colors shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
