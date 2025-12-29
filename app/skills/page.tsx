'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Toast from '@/components/Toast';

export default function SkillsPage() {
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('research');
  const [selectedSkillId, setSelectedSkillId] = useState<string>('');
  const [selectedLogic, setSelectedLogic] = useState<{ name: string; logic: string } | null>(null);
  const [toast, setToast] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });
  const [toolModal, setToolModal] = useState<{ isOpen: boolean; toolId: string; skillId: string; sourceCode: string; filePath: string; loading: boolean }>({
    isOpen: false,
    toolId: '',
    skillId: '',
    sourceCode: '',
    filePath: '',
    loading: false,
  });
  
  // State for execution examples
  const [executionExamples, setExecutionExamples] = useState<Record<string, any[]>>({});
  const [editingExample, setEditingExample] = useState<string | null>(null); // Stores issue ID or "new_[skillId]"
  const [tempExample, setTempExample] = useState<string>('');
  const [tempImages, setTempImages] = useState<string[]>([]);
  const [tempStatus, setTempStatus] = useState<'pending_review' | 'unresolved' | 'resolved'>('pending_review');
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const brandGradient = 'linear-gradient(80deg, #FFAF40, #D194EC, #9A8FEA, #65B4FF)';

  // Field label translation map (English -> Chinese)
  const fieldLabelMap: Record<string, string> = {
    // Research fields
    'Target Site URL': '目标网站 URL',
    'Page URL': '页面 URL',
    'Target Keyword': '目标关键词',
    'Target Keyword (Optional)': '目标关键词（可选）',
    'Focus Topic / Keywords (Optional)': '焦点主题/关键词（可选）',
    'Known Competitor URLs (Optional, comma-separated)': '已知竞争对手 URL（可选，逗号分隔）',
    'Your Website URL': '你的网站 URL',
    'Your Product Name': '你的产品名称',
    'Product Description (Optional)': '产品描述（可选）',
    'Known Competitors (Optional)': '已知竞争对手（可选）',
    'Competitor URLs (Optional)': '竞争对手 URL（可选）',
    'Specific Competitors (Optional)': '特定竞争对手（可选）',
    'Target Market': '目标市场',
    'Results to Analyze': '分析结果数量',
    
    // Build fields
    'Site Goals / Target Audience': '网站目标/目标受众',
    'Seed Topics or Keywords (Optional)': '种子主题或关键词（可选）',
    'Cluster Topic / Theme': '集群主题/主题',
    'Site Context / Goal (Optional)': '网站背景/目标（可选）',
    
    // Optimize fields
    'Target URL': '目标 URL',
    'Page to Optimize (URL)': '待优化页面（URL）',
    'Site Homepage (for Sitemap)': '网站首页（用于站点地图）',
    
    // Monitor fields
    'Site URL': '网站 URL',
    'Domain or URL': '域名或 URL',
    'Report Period': '报告周期',
    'Target Keywords (Optional)': '目标关键词（可选）',
    'Specific URLs to check Indexing (Optional)': '检查索引的特定 URL（可选）',
    
    // Common fields
    'Competitor Domain': '竞争对手域名',
    'Compare With': '对比对象',
    'Domain': '域名',
    'Niche/Topic': '利基市场/主题',
  };

  const tabs = [
    { id: 'research', name: '研究阶段', nameEn: 'Research Phase' },
    { id: 'build', name: '内容构建', nameEn: 'Build Phase' },
    { id: 'optimize', name: '优化阶段', nameEn: 'Optimize Phase' },
    { id: 'monitor', name: '监控阶段', nameEn: 'Monitor Phase' }
  ];

  useEffect(() => {
    fetch('/api/skills')
      .then(res => res.json())
      .then(data => {
        const skillsData = data.skills || [];
        // Filter out system category skills
        const filteredSkills = skillsData.filter((s: any) => s.metadata?.category !== 'system');
        setSkills(filteredSkills);
        if (filteredSkills.length > 0) {
          // Initialize with first skill of research phase if available
          const firstResearchSkill = filteredSkills.find((s: any) => s.metadata?.category === 'research');
          if (firstResearchSkill) {
            setSelectedSkillId(firstResearchSkill.id);
          } else {
            setSelectedSkillId(filteredSkills[0].id);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch skills:', err);
        setLoading(false);
      });
    
    // Load execution examples from database
    fetch('/api/skills/issues')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setExecutionExamples(data.issues || {});
        }
      })
      .catch(err => {
        console.error('Failed to fetch skill issues:', err);
      });
  }, []);

  const currentSkillId = selectedSkillId || (skills.length > 0 ? skills[0].id : '');
  
  // Check if a tab has any skills with issues (pending_review or unresolved)
  const tabHasIssues = (tabId: string) => {
    const skillsInTab = skills.filter(s => {
      const cat = s.metadata?.category || 'Others';
      return cat === tabId;
    });
    return skillsInTab.some(s => executionExamples[s.id]?.some(issue => issue.status !== 'resolved'));
  };
  
  // Filter skills based on active tab
  const filteredSkills = skills.filter(s => {
    const cat = s.metadata?.category || 'Others';
    return cat === activeTab;
  });

  const selectedSkill = skills.find(s => s.id === currentSkillId) || filteredSkills[0];

  const sortSkills = (skills: any[]) => {
    return [...skills].sort((a, b) => {
      // 1. Coming soon skills always go to the bottom
      const aIsComingSoon = a.metadata?.status === 'coming_soon';
      const bIsComingSoon = b.metadata?.status === 'coming_soon';
      if (aIsComingSoon !== bIsComingSoon) return aIsComingSoon ? 1 : -1;

      // 2. Sort by priority
      const aPriority = parseInt(a.metadata?.priority || '99');
      const bPriority = parseInt(b.metadata?.priority || '99');
      if (aPriority !== bPriority) return aPriority - bPriority;

      // 3. Sort by availability (playbook trigger or tools present)
      const aAvail = !!a.metadata?.playbook?.trigger || (a.tools && a.tools.length > 0);
      const bAvail = !!b.metadata?.playbook?.trigger || (b.tools && b.tools.length > 0);
      if (aAvail !== bAvail) return aAvail ? -1 : 1;
      
      return a.name.localeCompare(b.name);
    });
  };

  const openToolModal = async (toolId: string, skillId: string) => {
    setToolModal({
      isOpen: true,
      toolId,
      skillId,
      sourceCode: '',
      filePath: '',
      loading: true,
    });

    try {
      const response = await fetch(`/api/skills/tool-source?toolId=${encodeURIComponent(toolId)}&skillId=${encodeURIComponent(skillId)}`);
      const data = await response.json();
      
      if (response.ok) {
        setToolModal(prev => ({
          ...prev,
          sourceCode: data.sourceCode || '',
          filePath: data.filePath || '',
          loading: false,
        }));
      } else {
        setToolModal(prev => ({
          ...prev,
          sourceCode: `// Error: ${data.error || 'Failed to load source code'}`,
          filePath: '',
          loading: false,
        }));
      }
    } catch (error) {
      setToolModal(prev => ({
        ...prev,
        sourceCode: `// Error: Failed to fetch source code`,
        filePath: '',
        loading: false,
      }));
    }
  };

  const closeToolModal = () => {
    setToolModal({
      isOpen: false,
      toolId: '',
      skillId: '',
      sourceCode: '',
      filePath: '',
      loading: false,
    });
  };
  
  const handleEditExample = (skillId: string, issue?: any) => {
    if (issue) {
      setEditingExample(issue.id);
      setTempExample(issue.text || '');
      setTempImages(issue.images || []);
      setTempStatus(issue.status || 'pending_review');
    } else {
      setEditingExample(`new_${skillId}`);
      setTempExample('');
      setTempImages([]);
      setTempStatus('pending_review');
    }
  };
  
  const handleSaveExample = async (skillId: string) => {
    const isNew = editingExample?.startsWith('new_');
    const issueId = isNew ? undefined : editingExample;

    try {
      const response = await fetch('/api/skills/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: issueId,
          skill_id: skillId,
          issue_text: tempExample,
          image_urls: tempImages,
          status: tempStatus,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh issues
        const res = await fetch('/api/skills/issues');
        const updatedData = await res.json();
        if (updatedData.success) {
          setExecutionExamples(updatedData.issues || {});
        }
        
        setEditingExample(null);
        setToast({ isOpen: true, message: '问题已保存！' });
      } else {
        setToast({ isOpen: true, message: '保存失败：' + data.error });
      }
    } catch (error: any) {
      console.error('Failed to save issue:', error);
      setToast({ isOpen: true, message: '保存失败：' + error.message });
    }
  };

  const handleDeleteIssue = async (issueId: string) => {
    if (!confirm('确定要删除这个问题吗？')) return;

    try {
      const response = await fetch(`/api/skills/issues?id=${issueId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        // Refresh issues
        const res = await fetch('/api/skills/issues');
        const updatedData = await res.json();
        if (updatedData.success) {
          setExecutionExamples(updatedData.issues || {});
        }
        setToast({ isOpen: true, message: '问题已删除！' });
      }
    } catch (error: any) {
      console.error('Failed to delete issue:', error);
      setToast({ isOpen: true, message: '删除失败' });
    }
  };

  const handleStatusChange = async (issue: any, skillId: string, newStatus: 'pending_review' | 'unresolved' | 'resolved') => {
    try {
      const response = await fetch('/api/skills/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: issue.id,
          skill_id: skillId,
          issue_text: issue.text,
          image_urls: issue.images,
          status: newStatus,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Refresh issues
        const res = await fetch('/api/skills/issues');
        const updatedData = await res.json();
        if (updatedData.success) {
          setExecutionExamples(updatedData.issues || {});
        }
        const statusLabels: Record<string, string> = {
          'pending_review': '待验收',
          'unresolved': '未解决',
          'resolved': '已解决'
        };
        setToast({ isOpen: true, message: `状态已更新为「${statusLabels[newStatus]}」` });
      }
    } catch (error) {
      console.error('Failed to change status:', error);
    }
  };
  
  const handleCancelEdit = () => {
    setEditingExample(null);
    setTempExample('');
    setTempImages([]);
    setTempStatus('pending_review');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setTempImages(prev => [...prev, data.url]);
        setToast({ isOpen: true, message: '图片上传成功！' });
      } else {
        setToast({ isOpen: true, message: '上传失败：' + (data.error || '未知错误') });
      }
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      setToast({ isOpen: true, message: '上传失败：' + error.message });
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setTempImages(prev => prev.filter((_, i) => i !== index));
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          setIsUploading(true);
          const formData = new FormData();
          formData.append('file', file);

          try {
            const response = await fetch('/api/upload-logo', {
              method: 'POST',
              body: formData,
            });

            const data = await response.json();
            if (data.success) {
              setTempImages(prev => [...prev, data.url]);
              setToast({ isOpen: true, message: '图片已从剪贴板上传！' });
            }
          } catch (error) {
            console.error('Failed to upload pasted image:', error);
          } finally {
            setIsUploading(false);
          }
        }
      }
    }
  };

  return (
    <div className="h-screen bg-[#FAFAFA] flex flex-col overflow-hidden">
      {/* Top Header: Navigation Tabs */}
      <header className="h-16 border-b border-[#F3F4F6] bg-white flex items-center justify-between px-8 z-10 shrink-0">
        <div className="flex items-center gap-12 h-full">
          <Link href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white shadow-sm border border-[#F3F4F6] group-hover:scale-110 transition-transform shrink-0">
              <Image src="/logo.svg" alt="Logo" width={24} height={24} />
            </div>
            <div className="hidden md:block">
              <h1 className="text-sm font-black text-[#111827] uppercase tracking-tighter">Mini Seenos</h1>
            </div>
          </Link>

          <nav className="flex items-center gap-2 h-full">
            {tabs.map((tab) => {
              const hasIssues = tabHasIssues(tab.id);
              return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  const skillsInTab = skills.filter(s => {
                    const cat = s.metadata?.category || 'Others';
                    if (tab.id === 'system') return cat === 'system';
                    return cat === tab.id;
                  });
                  if (skillsInTab.length > 0) {
                    setSelectedSkillId(skillsInTab[0].id);
                  }
                }}
                className="relative px-6 h-16 flex items-center transition-all group"
              >
                <div className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] font-black leading-tight transition-colors ${
                      activeTab === tab.id ? 'text-[#111827]' : 'text-[#9CA3AF] group-hover:text-[#6B7280]'
                    }`}>
                      {tab.name}
                    </span>
                    {hasIssues && (
                      <div className="relative">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                        <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping opacity-75"></div>
                      </div>
                    )}
                  </div>
                  <span className={`text-[7px] font-medium uppercase tracking-wider transition-colors ${
                    activeTab === tab.id ? 'text-[#6B7280]' : 'text-[#D1D5DB] group-hover:text-[#9CA3AF]'
                  }`}>
                    {tab.nameEn}
                  </span>
                </div>
                {activeTab === tab.id && (
                  <div 
                    className="absolute bottom-0 left-4 right-4 h-1 rounded-t-full"
                    style={{ background: brandGradient }}
                  />
                )}
              </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link 
            href="/chat"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-0.5 py-2 px-5 rounded-xl text-white hover:opacity-90 transition-all shadow-sm"
            style={{ background: brandGradient }}
          >
            <span className="text-[11px] font-black leading-tight">返回对话</span>
            <span className="text-[7px] font-medium uppercase tracking-wider opacity-70">Back to Chat</span>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: Skill List */}
        <div className="w-80 border-r border-[#F3F4F6] bg-white flex flex-col shrink-0 h-full">
          <div className="px-6 h-[52px] border-b border-[#F3F4F6] bg-[#FAFAFA] flex items-center">
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-[#111827] leading-tight">技能列表</span>
              <span className="text-[7px] text-[#9CA3AF] font-medium uppercase tracking-wider">Skills</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2 thin-scrollbar">
            {loading ? (
              <div className="p-4 text-center">
                <div className="text-[11px] text-[#111827] animate-pulse font-black mb-0.5">加载中...</div>
                <div className="text-[8px] text-[#9CA3AF] uppercase font-medium tracking-wider">Loading...</div>
              </div>
            ) : (
              <>
                {sortSkills(filteredSkills).map((skill) => {
                  const isAvailable = !!skill.metadata?.playbook?.trigger || (skill.tools && skill.tools.length > 0);
                  const isComingSoon = !isAvailable || skill.metadata?.status === 'coming_soon';
                  const isSystem = skill.metadata?.category === 'system';
                  const hasIssue = executionExamples[skill.id]?.some(issue => issue.status !== 'resolved');
                  const hasPendingReview = executionExamples[skill.id]?.some(issue => issue.status === 'pending_review');
                  const hasUnresolved = executionExamples[skill.id]?.some(issue => issue.status === 'unresolved');
                  
                  return (
            <button 
                      key={skill.id}
                      onClick={() => setSelectedSkillId(skill.id)}
                      className={`w-full text-left p-4 rounded-xl transition-all relative group ${
                        currentSkillId === skill.id 
                          ? 'bg-[#FAFAFA] shadow-sm border border-[#E5E5E5] text-[#111827]' 
                          : 'text-[#6B7280] hover:bg-[#F9FAFB]'
                      } ${isComingSoon && !isSystem ? 'opacity-50 grayscale-[0.5]' : ''}`}
                    >
                      {/* Skill Name */}
                      <div className="text-[14px] font-black leading-tight tracking-tight mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="block flex-1">{skill.name.split(': ')[1] || skill.name}</span>
                          {hasUnresolved && (
                            <div className="relative flex-shrink-0">
                              <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                              <div className="absolute inset-0 w-2 h-2 rounded-full bg-rose-500 animate-ping opacity-75"></div>
                            </div>
                          )}
                          {!hasUnresolved && hasPendingReview && (
                            <div className="relative flex-shrink-0">
                              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                              <div className="absolute inset-0 w-2 h-2 rounded-full bg-amber-500 animate-ping opacity-75"></div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* What this skill will do */}
                      {skill.metadata?.whatThisSkillWillDo && skill.metadata.whatThisSkillWillDo.length > 0 && (
                        <div className="mb-2.5">
                          <div className="flex flex-col mb-1.5">
                            <span className="text-[9px] font-black text-[#111827] leading-tight">将会执行</span>
                            <span className="text-[7px] text-[#9CA3AF] font-medium uppercase tracking-wider">What It Does</span>
                          </div>
                          <div className="space-y-1">
                            {skill.metadata.whatThisSkillWillDo.slice(0, 3).map((action: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#65B4FF] flex-shrink-0 mt-1"></div>
                                <span className="text-[10px] text-[#6B7280] leading-relaxed line-clamp-1">{action}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* What artifacts will be generated */}
                      {skill.metadata?.whatArtifactsWillBeGenerated && skill.metadata.whatArtifactsWillBeGenerated.length > 0 && (
                        <div>
                          <div className="flex flex-col mb-1.5">
                            <span className="text-[9px] font-black text-[#111827] leading-tight">输出物</span>
                            <span className="text-[7px] text-[#9CA3AF] font-medium uppercase tracking-wider">Artifacts</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {skill.metadata.whatArtifactsWillBeGenerated.map((artifact: string, idx: number) => (
                              <span key={idx} className="px-2 py-1 rounded-md bg-[#FAFAFA] text-[#9A8FEA] text-[9px] font-bold border border-[#D194EC]/20">
                                {artifact}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {currentSkillId === skill.id && (
                        <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full" style={{ background: brandGradient }} />
                      )}
            </button>
                  );
                })}
                {filteredSkills.length === 0 && (
                  <div className="p-8 text-center">
                    <div className="text-[11px] text-[#111827] font-black mb-1">该阶段暂无技能</div>
                    <div className="text-[8px] text-[#9CA3AF] uppercase font-medium tracking-wider">No skills mapped to this phase</div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
        <main className="flex-1 flex overflow-hidden bg-[#FCFCFC]">
            {/* Input & Value Proposition Column */}
            <div className="w-[25%] flex flex-col border-r border-[#F3F4F6] bg-white">
              <div className="px-6 h-[52px] bg-[#FAFAFA] border-b border-[#F3F4F6] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-[#111827] leading-tight">输入与价值</span>
                  <span className="text-[7px] text-[#9CA3AF] font-medium uppercase tracking-wider">Input & Value Proposition</span>
                </div>
              </div>
              </div>
              <div className="p-8 overflow-y-auto flex-1 thin-scrollbar space-y-10">
              <div>
                  <div className="flex flex-col mb-4">
                    <h4 className="text-[10px] font-black text-[#111827] leading-tight">解决的核心问题</h4>
                    <span className="text-[7px] text-[#9CA3AF] font-medium uppercase tracking-wider">Core Problem Solved</span>
                  </div>
                  <p className="text-[13px] font-medium text-[#111827] leading-[1.8]">
                    {selectedSkill?.metadata?.solution || 'This skill is designed to solve specific business pain points in SEO, content creation, or market research.'}
                </p>
              </div>
              
                  {selectedSkill?.metadata?.demoUrl && (
                <div>
                  <div className="flex flex-col mb-4">
                    <h4 className="text-[10px] font-black text-[#111827] leading-tight">案例展示</h4>
                    <span className="text-[7px] text-[#9CA3AF] font-medium uppercase tracking-wider">Case Study / Demo</span>
                  </div>
                  <Link 
                    href={selectedSkill.metadata.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col gap-3 p-5 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] hover:border-[#111827] transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-[#111827] leading-tight">查看演示页面</span>
                        <span className="text-[7px] text-[#9CA3AF] uppercase font-medium tracking-wider">View Demo Page</span>
                      </div>
                      <svg className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#111827] transition-colors flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                      </svg>
                    </div>
                  </Link>
                </div>
              )}

              <div>
                <div className="flex flex-col mb-3">
                  <h4 className="text-[10px] font-black text-[#111827] leading-tight">预期输入</h4>
                  <span className="text-[7px] text-[#9CA3AF] font-medium uppercase tracking-wider">Expected Input</span>
                </div>
                {selectedSkill?.metadata?.playbook?.trigger?.fields && selectedSkill.metadata.playbook.trigger.fields.length > 0 ? (
                  <div className="p-4 rounded-xl bg-white border border-[#E5E5E5]">
                    <div className="space-y-3">
                      {selectedSkill.metadata.playbook.trigger.fields.map((field: any, index: number) => {
                        const chineseLabel = fieldLabelMap[field.label] || field.label;
                        const fieldTypeMap: Record<string, string> = {
                          'text': '文本',
                          'select': '选择',
                          'country': '国家'
                        };
                        const typeLabel = fieldTypeMap[field.type] || field.type;
                        
                        // Check if this field should have auto-fill note (site/domain/url fields)
                        const isAutoFillField = field.id.includes('site') || field.id.includes('domain') || field.id.includes('url') || 
                                                field.label.toLowerCase().includes('site') || field.label.toLowerCase().includes('domain');
                        
                        return (
                          <div key={field.id} className={index > 0 ? 'pt-3 border-t border-[#F3F4F6]' : ''}>
                            {/* Field Label */}
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex-1 min-w-0">
                                <label className="text-[10px] font-black text-[#111827] leading-tight block truncate">
                                  {chineseLabel}
                                  {field.required && (
                                    <span className="text-rose-600 ml-0.5">*</span>
                                  )}
                                </label>
                                <div className="text-[7px] text-[#9CA3AF] font-medium uppercase tracking-wide truncate">
                                  {field.label}
                                </div>
                              </div>
                              <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[7px] font-black uppercase tracking-tight border border-blue-100 flex-shrink-0 ml-2">
                                {typeLabel}
                              </span>
                            </div>
                            
                            {/* Form Field Preview */}
                            {field.type === 'select' ? (
                              <div className="relative">
                                <select 
                                  disabled
                                  className="w-full px-2.5 py-1.5 rounded-md border border-[#E5E5E5] bg-[#FAFAFA] text-[9px] font-medium text-[#6B7280] appearance-none cursor-not-allowed"
                                  value={field.defaultValue || (field.options && field.options[0]?.value)}
                                >
                                  {field.options && field.options.map((option: any, idx: number) => (
                                    <option key={idx} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                  <svg className="w-3 h-3 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>
                            ) : (
                              <input
                                type="text"
                                disabled
                                placeholder={field.placeholder || `请输入${chineseLabel}...`}
                                defaultValue={field.defaultValue || ''}
                                className="w-full px-2.5 py-1.5 rounded-md border border-[#E5E5E5] bg-[#FAFAFA] text-[9px] font-medium text-[#6B7280] placeholder:text-[#9CA3AF] placeholder:italic cursor-not-allowed"
                              />
                            )}
                            
                            {/* Auto-fill Note for site/domain/url fields */}
                            {isAutoFillField && (
                              <div className="mt-1.5 flex items-start gap-1 bg-emerald-50 border border-emerald-100 rounded-md px-2 py-1">
                                <svg className="w-2.5 h-2.5 text-emerald-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-[8px] text-emerald-700 font-medium leading-tight">
                                  自动填充：系统会使用你 Onboarding 时配置的网站作为默认值
                                </span>
                              </div>
                            )}
                            
                            {/* Additional Info */}
                            {(field.placeholder || (field.defaultValue && field.type === 'select')) && (
                              <div className="mt-1.5 flex items-start gap-1">
                                <svg className="w-2.5 h-2.5 text-[#9CA3AF] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <div className="text-[8px] text-[#6B7280] leading-tight">
                                  {field.placeholder && !field.defaultValue && (
                                    <span className="italic">{field.placeholder}</span>
                                  )}
                                  {field.defaultValue && field.type === 'select' && (
                                    <span>默认：<span className="font-semibold text-[#111827]">{field.options?.find((opt: any) => opt.value === field.defaultValue)?.label || field.defaultValue}</span></span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl border-2 border-dashed border-[#F3F4F6] text-center bg-[#FAFAFA]/50">
                    <div className="text-[11px] text-[#111827] font-black mb-1">无需特定输入</div>
                    <div className="text-[8px] text-[#9CA3AF] uppercase font-medium tracking-wider">No Specific Input Required</div>
                  </div>
                )}
              </div>
            </div>
          </div>

            {/* Logic Inside Column */}
          <div className="w-[35%] flex flex-col border-r border-[#F3F4F6] bg-white">
              <div className="px-6 h-[52px] bg-[#FAFAFA] border-b border-[#F3F4F6] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-[#111827] leading-tight">内部逻辑</span>
                  <span className="text-[7px] text-[#9CA3AF] font-medium uppercase tracking-wider">Logic Inside</span>
                </div>
                </div>
              </div>
              
              {/* System Prompt Section - 50% height */}
              <div className="h-1/2 flex flex-col border-b border-[#F3F4F6]">
                <div className="p-6 pb-3">
                  <div className="flex flex-col mb-3">
                    <h4 className="text-[10px] font-black text-[#111827] leading-tight">系统提示词</h4>
                    <span className="text-[7px] text-[#9CA3AF] font-medium uppercase tracking-wider">System Prompt</span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto thin-scrollbar px-6 pb-6">
                  <div className="font-mono text-[11px] leading-[1.8] text-[#374151] whitespace-pre-wrap selection:bg-[#D194EC]/20">
                    {selectedSkill?.systemPrompt || 'The core instruction for this skill defines how the AI agent processes information.'}
                  </div>
                </div>
              </div>
                
              {/* Tools Section - 50% height */}
              <div className="h-1/2 flex flex-col">
                <div className="p-6 pb-3">
                  <div className="flex flex-col mb-3">
                    <h4 className="text-[10px] font-black text-[#111827] leading-tight">使用的工具</h4>
                    <span className="text-[7px] text-[#9CA3AF] font-medium uppercase tracking-wider">Tools Used</span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto thin-scrollbar px-6 pb-6">
                  <div className="space-y-2">
                    {(selectedSkill?.tools || []).map((skillTool: any) => (
                      <div
                        key={skillTool.id}
                        onClick={() => openToolModal(skillTool.id, currentSkillId)}
                        className="p-3 rounded-xl border border-[#F3F4F6] bg-[#FAFAFA] hover:border-[#111827] hover:shadow-sm transition-all group flex items-start gap-3 cursor-pointer"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <div className="text-[10px] font-black text-[#111827] uppercase tracking-tight truncate">
                              {skillTool.name}
                            </div>
                            <span className="px-1.5 py-0.5 rounded-full bg-white text-[#9CA3AF] text-[7px] font-black uppercase tracking-tighter group-hover:text-[#111827] group-hover:bg-amber-50 transition-colors border border-[#E5E5E5]">
                              {skillTool.provider}
                            </span>
                          </div>
                          <div className="text-[9px] leading-relaxed text-[#6B7280] font-medium line-clamp-1">
                            {skillTool.description}
                          </div>
                        </div>
                        <div className="flex-none self-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-3 h-3 text-[#111827]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    ))}
                    {(selectedSkill?.tools || []).length === 0 && (
                      <div className="py-12 text-center border-2 border-dashed border-[#F3F4F6] rounded-2xl bg-white">
                        <div className="text-[11px] text-[#111827] font-black mb-1">暂无工具配置</div>
                        <div className="text-[8px] text-[#9CA3AF] uppercase font-medium tracking-wider">No Tools Mapped</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
          </div>

            {/* Right Column - Reserved for Execution Results */}
          <div className="flex-1 flex flex-col bg-[#FCFCFC]">
              <div className="px-6 h-[52px] bg-[#FAFAFA] border-b border-[#F3F4F6] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-[#111827] leading-tight">执行结果</span>
                  <span className="text-[7px] text-[#9CA3AF] font-medium uppercase tracking-wider">Execution Results</span>
                </div>
                </div>
              </div>
            <div className="flex-1 overflow-y-auto p-8 thin-scrollbar">
                {selectedSkill?.metadata?.expectedOutput ? (
                  <div>
                    <div className="flex flex-col mb-4">
                      <h4 className="text-[10px] font-black text-[#111827] leading-tight">预期输出</h4>
                      <span className="text-[7px] text-[#9CA3AF] font-medium uppercase tracking-wider">Expected Output</span>
                    </div>
                    <div className="p-6 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5]">
                      <p className="text-[12px] font-medium text-[#111827] leading-[1.8] whitespace-pre-line">
                        {selectedSkill.metadata.expectedOutput}
                      </p>
                    </div>
                    
                    <div className="mt-8 pt-8 border-t border-[#E5E5E5]">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="flex flex-col">
                            <h4 className="text-[10px] font-black text-[#111827] leading-tight">问题反馈</h4>
                            <span className="text-[7px] text-[#9CA3AF] font-medium uppercase tracking-wider">Skill Issues & Feedback</span>
                          </div>
                        </div>
                        
                        {/* Add Button */}
                        {!editingExample?.startsWith('new_') && (
                          <button
                            onClick={() => handleEditExample(currentSkillId)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black text-white uppercase tracking-wider transition-all hover:opacity-90 shadow-sm"
                            style={{ background: brandGradient }}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                            新增问题
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        {/* New Issue Editor */}
                        {editingExample === `new_${currentSkillId}` && (
                          <div 
                            className="p-4 rounded-2xl border-2 border-[#D194EC]/30 bg-white shadow-sm space-y-3"
                            onPaste={handlePaste}
                          >
                            <textarea
                              value={tempExample}
                              onChange={(e) => setTempExample(e.target.value)}
                              placeholder="描述发现的问题或建议..."
                              className="w-full p-3 rounded-xl border border-[#F3F4F6] focus:border-[#9A8FEA] focus:outline-none text-[11px] text-[#111827] font-medium leading-relaxed resize-none"
                              rows={2}
                              autoFocus
                            />
                            
                            {/* Image Upload Area */}
                            <div className="flex flex-wrap items-center gap-2">
                              {tempImages.map((url, idx) => (
                                <div key={idx} className="relative group w-14 h-14 rounded-lg overflow-hidden border border-[#E5E5E5]">
                                  <img src={url} alt="" className="w-full h-full object-cover" />
                                  <button onClick={() => handleRemoveImage(idx)} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2} /></svg>
                                  </button>
                                </div>
                              ))}
                              {isUploading && (
                                <div className="w-14 h-14 rounded-lg border border-[#D194EC]/30 bg-[#FAFAFA] flex items-center justify-center">
                                  <div className="w-5 h-5 border-2 border-[#9A8FEA] border-t-transparent rounded-full animate-spin"></div>
                                </div>
                              )}
                              <label className="w-14 h-14 rounded-lg border-2 border-dashed border-[#E5E5E5] hover:border-[#9A8FEA] flex flex-col items-center justify-center cursor-pointer transition-colors">
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                <svg className="w-4 h-4 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth={2} /></svg>
                              </label>
                              <span className="text-[8px] text-[#9CA3AF] ml-1">Ctrl+V 粘贴图片</span>
                            </div>

                            <div className="flex items-center gap-2 justify-end">
                              <button onClick={handleCancelEdit} className="px-3 py-1.5 rounded-lg border border-[#E5E5E5] text-[9px] font-black text-[#6B7280] hover:bg-[#F3F4F6] uppercase">取消</button>
                              <button 
                                onClick={() => handleSaveExample(currentSkillId)} 
                                className="px-4 py-1.5 rounded-lg text-white text-[9px] font-black hover:opacity-90 uppercase shadow-sm"
                                style={{ background: brandGradient }}
                                disabled={isUploading}
                              >
                                提交
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Issues List */}
                        {executionExamples[currentSkillId]?.map((issue: any) => (
                          <div key={issue.id} className={`group relative p-4 rounded-2xl border transition-all ${
                            issue.status === 'resolved' 
                              ? 'bg-[#F9FAFB] border-[#E5E5E5] opacity-70' 
                              : issue.status === 'unresolved'
                              ? 'bg-rose-50/30 border-rose-100'
                              : 'bg-amber-50/30 border-amber-100'
                          }`}>
                            {editingExample === issue.id ? (
                              <div className="space-y-3" onPaste={handlePaste}>
                                <textarea
                                  value={tempExample}
                                  onChange={(e) => setTempExample(e.target.value)}
                                  className="w-full p-3 rounded-xl border border-[#D194EC]/30 focus:border-[#9A8FEA] focus:outline-none text-[11px] text-[#111827] font-medium leading-relaxed resize-none"
                                  rows={2}
                                  autoFocus
                                />
                                <div className="flex flex-wrap items-center gap-2">
                                  {tempImages.map((url, idx) => (
                                    <div key={idx} className="relative group w-14 h-14 rounded-lg overflow-hidden border border-[#E5E5E5]">
                                      <img src={url} alt="" className="w-full h-full object-cover" />
                                      <button onClick={() => handleRemoveImage(idx)} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2} /></svg>
                                      </button>
                                    </div>
                                  ))}
                                  {isUploading && (
                                    <div className="w-14 h-14 rounded-lg border border-[#D194EC]/30 bg-[#FAFAFA] flex items-center justify-center">
                                      <div className="w-5 h-5 border-2 border-[#9A8FEA] border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                  )}
                                  <label className="w-14 h-14 rounded-lg border-2 border-dashed border-[#E5E5E5] hover:border-[#9A8FEA] flex flex-col items-center justify-center cursor-pointer transition-colors">
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                    <svg className="w-4 h-4 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth={2} /></svg>
                                  </label>
                                  <span className="text-[8px] text-[#9CA3AF] ml-1">Ctrl+V 粘贴图片</span>
                                </div>
                                <div className="flex items-center gap-2 justify-end">
                                  <button onClick={handleCancelEdit} className="px-3 py-1.5 rounded-lg border border-[#E5E5E5] text-[9px] font-black text-[#6B7280] hover:bg-[#F3F4F6] uppercase">取消</button>
                                  <button 
                                    onClick={() => handleSaveExample(currentSkillId)} 
                                    className="px-4 py-1.5 rounded-lg text-white text-[9px] font-black hover:opacity-90 uppercase shadow-sm"
                                    style={{ background: brandGradient }}
                                    disabled={isUploading}
                                  >
                                    保存
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-start justify-between gap-4 mb-2">
                                  <div className="flex items-center gap-2">
                                    {/* Status indicator dot: 未解决=红色, 待验收=黄色, 已解决=无 */}
                                    {issue.status === 'unresolved' && (
                                      <div className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0"></div>
                                    )}
                                    {issue.status === 'pending_review' && (
                                      <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"></div>
                                    )}
                                    {/* Status dropdown */}
                                    <select
                                      value={issue.status || 'pending_review'}
                                      onChange={(e) => handleStatusChange(issue, currentSkillId, e.target.value as any)}
                                      className={`text-[9px] font-black uppercase tracking-tight py-1 px-2 rounded-lg border cursor-pointer transition-all focus:outline-none ${
                                        issue.status === 'resolved' 
                                          ? 'bg-[#F3F4F6] border-[#E5E5E5] text-[#6B7280]' 
                                          : issue.status === 'unresolved'
                                          ? 'bg-rose-50 border-rose-200 text-rose-700'
                                          : 'bg-amber-50 border-amber-200 text-amber-700'
                                      }`}
                                    >
                                      <option value="pending_review">待验收</option>
                                      <option value="unresolved">未解决</option>
                                      <option value="resolved">已解决</option>
                                    </select>
                                  </div>
                                  
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    <button onClick={() => handleEditExample(currentSkillId, issue)} className="p-1 hover:bg-[#F3F4F6] rounded-lg text-[#9CA3AF] hover:text-[#111827]"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth={2} /></svg></button>
                                    <button onClick={() => handleDeleteIssue(issue.id)} className="p-1 hover:bg-rose-50 rounded-lg text-[#9CA3AF] hover:text-rose-600"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2} /></svg></button>
                                  </div>
                                </div>
                                
                                <p className={`text-[11px] font-medium leading-relaxed whitespace-pre-wrap ${issue.status === 'resolved' ? 'text-[#9CA3AF] line-through' : issue.status === 'unresolved' ? 'text-rose-600' : 'text-amber-700'}`}>
                                  {issue.text}
                                </p>
                                
                                {issue.images?.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    {issue.images.map((url: string, idx: number) => (
                                      <div key={idx} className="w-14 h-14 rounded-lg overflow-hidden border border-[#E5E5E5] cursor-zoom-in hover:opacity-80" onClick={() => setPreviewImage(url)}>
                                        <img src={url} alt="" className="w-full h-full object-cover" />
                                      </div>
                                    ))}
                                  </div>
                                )}{" "}
                                <div className="mt-2.5 flex items-center justify-end gap-1.5 text-[7px] text-[#9CA3AF] font-bold uppercase tracking-wider">
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={2.5} /></svg>
                                  <span>{new Date(issue.updatedAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </>
                            )}
                          </div>
                        ))}

                        {(!executionExamples[currentSkillId] || executionExamples[currentSkillId].length === 0) && !editingExample?.startsWith('new_') && (
                          <div className="text-center py-12 border-2 border-dashed border-[#F3F4F6] rounded-2xl">
                            <div className="w-12 h-12 rounded-full bg-[#FAFAFA] flex items-center justify-center mx-auto mb-3 border border-[#E5E5E5]">
                              <svg className="w-6 h-6 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6v6m0 0v6m0-6h6m-6 0H6" strokeWidth={2} /></svg>
                            </div>
                            <button onClick={() => handleEditExample(currentSkillId)} className="text-[11px] text-[#111827] hover:text-[#6B7280] font-black underline">添加首个问题反馈</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 rounded-full bg-[#FAFAFA] flex items-center justify-center mx-auto mb-3 border border-[#E5E5E5]">
                      <svg className="w-6 h-6 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-[11px] text-[#6B7280]">
                      预期输出待补充 / Output Description Pending
                    </p>
                  </div>
                )}
              </div>
          </div>
        </main>

          <footer className="p-4 border-t border-[#F3F4F6] bg-white flex items-center justify-center gap-8 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#111827] font-black">Mini Seenos</span>
              <span className="text-[8px] text-[#9CA3AF]">&copy; 2025</span>
              <span className="text-[8px] text-[#9CA3AF] uppercase tracking-wider">Expertise Hub</span>
            </div>
        </footer>
        </div>
      </div>

      {/* Toast Notification */}
      <Toast 
        isOpen={toast.isOpen} 
        message={toast.message} 
        onClose={() => setToast(prev => ({ ...prev, isOpen: false }))} 
      />

      {/* Logic Modal */}
      {selectedLogic && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70] flex items-end md:items-center justify-center p-4" onClick={() => setSelectedLogic(null)}>
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300" onClick={e => e.stopPropagation()}>
            <div className="px-10 py-8 border-b border-[#F5F5F5] flex items-center justify-between bg-[#FAFAFA]">
              <div>
                <h3 className="text-2xl font-black tracking-tighter">{selectedLogic.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-[11px] text-[#111827] font-black leading-tight">推理逻辑（系统提示词）</p>
                  <span className="text-[8px] text-[#9CA3AF] font-medium uppercase tracking-wider">Reasoning Logic (System Prompt)</span>
                </div>
              </div>
              <button onClick={() => setSelectedLogic(null)} className="p-3 hover:bg-[#F3F4F6] rounded-2xl transition-all border border-[#E5E5E5]">
                <svg className="w-6 h-6 text-[#111827]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 font-mono text-[13px] leading-[2] text-[#374151] whitespace-pre-wrap selection:bg-[#D194EC]/20 bg-white">
              {selectedLogic.logic}
            </div>
          </div>
        </div>
      )}

      {/* Tool Source Code Modal */}
      {toolModal.isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-[80] flex items-center justify-center p-4"
          onClick={closeToolModal}
        >
          <div 
            className="bg-white rounded-[32px] shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-10 py-8 border-b border-[#F3F4F6] flex items-center justify-between bg-[#FAFAFA]">
              <div className="flex-1">
                <h3 className="text-xl font-black text-[#111827] tracking-tight mb-2">
                  {toolModal.toolId.replace(/_/g, ' ')}
                </h3>
                {toolModal.filePath && (
                  <p className="text-[9px] text-[#9CA3AF] font-medium tracking-wider font-mono">{toolModal.filePath}</p>
                )}
              </div>
              <button
                onClick={closeToolModal}
                className="p-3 hover:bg-[#F3F4F6] rounded-2xl transition-all border border-[#E5E5E5]"
              >
                <svg className="w-6 h-6 text-[#111827]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {toolModal.loading ? (
                <div className="flex-1 flex items-center justify-center bg-[#1E1E1E]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FFAF40] mx-auto mb-4"></div>
                    <div className="text-[11px] font-black text-white mb-1">加载中...</div>
                    <div className="text-[8px] text-[#9CA3AF] uppercase tracking-wider">Fetching Asset...</div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-auto p-10 bg-[#1E1E1E] thin-scrollbar">
                  <pre className="text-xs font-mono text-[#D4D4D4] leading-[1.8] whitespace-pre-wrap">
                    <code>{toolModal.sourceCode || '// No source code available'}</code>
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-10 py-6 border-t border-[#F3F4F6] flex items-center justify-end gap-4 bg-white">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(toolModal.sourceCode);
                  setToast({ isOpen: true, message: 'Source code copied!' });
                }}
                className="flex flex-col items-center px-6 py-2.5 rounded-xl border border-[#E5E5E5] hover:bg-[#F3F4F6] transition-all"
              >
                <span className="text-[11px] font-black text-[#111827] leading-tight">复制代码</span>
                <span className="text-[7px] text-[#9CA3AF] uppercase tracking-wider">Copy Code</span>
              </button>
              <button
                onClick={closeToolModal}
                className="flex flex-col items-center px-6 py-2.5 rounded-xl text-white hover:opacity-90 transition-all shadow-sm"
                style={{ background: brandGradient }}
              >
                <span className="text-[11px] font-black leading-tight">关闭</span>
                <span className="text-[7px] opacity-70 uppercase tracking-wider">Close</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <img 
              src={previewImage} 
              alt="Preview" 
              className="max-w-full max-h-full object-contain shadow-2xl animate-in zoom-in-95 duration-200"
            />
            <button 
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              onClick={() => setPreviewImage(null)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
