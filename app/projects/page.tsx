'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, getSEOProjects, createSEOProject, deleteSEOProject, SEOProject } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import AuthButton from '@/components/AuthButton';
import TopBar from '@/components/TopBar';
import DomainsModal from '@/components/DomainsModal';
import ConfirmModal from '@/components/ConfirmModal';
import PricingModal from '@/components/PricingModal';
import { useToast } from '@/components/Toast';

export default function ProjectsPage() {
  const { showToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<SEOProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isDomainsOpen, setIsDomainsOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingProject, setDeletingProject] = useState<SEOProject | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null); // null = not loaded yet
  const [maxProjects, setMaxProjects] = useState<number>(3);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showUpgradeHint, setShowUpgradeHint] = useState(false);
  const hasShownUpgradeHint = useRef(false);
  const router = useRouter();

  // Fetch user credits from API
  const fetchUserCredits = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch('/api/user/credits', { headers });
      if (response.ok) {
        const data = await response.json();
        const tier = data.subscription_tier ?? 'free';
        const credits = data.credits ?? 3;
        const maxProj = data.max_projects ?? 3;
        
        setUserCredits(credits);
        setSubscriptionTier(tier);
        setMaxProjects(maxProj);
        
        // Show a dismissible hint for free tier users (only once per session)
        if (tier === 'free' && !hasShownUpgradeHint.current) {
          hasShownUpgradeHint.current = true;
          setTimeout(() => {
            setShowUpgradeHint(true);
          }, 500);
        }
      } else {
        console.error('Failed to fetch user credits: HTTP', response.status);
        setSubscriptionTier('free'); // Set to free on error so UI doesn't hang
        showToast('Failed to fetch subscription info. Please check your network connection.', 'error', 5000);
      }
    } catch (error) {
      console.error('Failed to fetch user credits:', error);
      showToast('Failed to fetch subscription info. Please check your network connection.', 'error', 5000);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = (newCredits: number, newTier: string) => {
    setUserCredits(newCredits);
    setSubscriptionTier(newTier);
    setShowPricingModal(false);
    setShowUpgradeHint(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProjects(session.user.id);
        fetchUserCredits();
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProjects(session.user.id);
        fetchUserCredits();
      } else {
        setProjects([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProjects = async (userId: string) => {
    try {
      setLoading(true);
      const data = await getSEOProjects(userId);
      setProjects(data || []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newDomain.trim() || isSubmitting) return;

    // Check project limit
    if (projects.length >= maxProjects) {
      showToast(`You can only create up to ${maxProjects} projects. Please delete an existing project first.`, 'error', 5000);
      return;
    }

    try {
      setIsSubmitting(true);
      const project = await createSEOProject(user.id, newDomain);
      setProjects([project, ...projects]);
      setNewDomain('');
      setIsAdding(false);
      // Automatically redirect to the new project
      router.push(`/project/${project.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!deletingProject) return;

    setIsDeleting(true);
    try {
      await deleteSEOProject(deletingProject.id);
      setProjects(projects.filter(p => p.id !== deletingProject.id));
      setDeletingProject(null);
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center font-sans">
        <div className="text-center">
          <div className="mb-8">
            <img src="/new-logo.png" alt="Logo" width={64} height={64} className="mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h1>
          <p className="text-gray-500 mb-8">You need to sign in to manage your projects.</p>
          <AuthButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col font-sans">
      {user && (
        <TopBar 
          user={user}
          onDomainsClick={() => setIsDomainsOpen(true)}
          credits={userCredits}
          subscriptionTier={subscriptionTier ?? undefined}
          onCreditsUpdate={handlePaymentSuccess}
        />
      )}

      <main className="flex-1 flex items-start justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Your Projects</h1>
            <p className="text-gray-500 mt-2 text-sm">Select a project or create a new one</p>
          </div>

          {/* Add Project Form */}
          {isAdding && (
            <div className="mb-6 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <form onSubmit={handleAddProject} className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter your domain (e.g. example.com)"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-300 focus:bg-white transition-all"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !newDomain.trim()}
                    className="flex-1 px-4 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Project'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setNewDomain('');
                    }}
                    className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Content Area */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-3 border-gray-200 border-t-black rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Loading projects...</p>
            </div>
          ) : projects.length === 0 && !isAdding ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">No projects yet</h3>
              <p className="text-gray-500 text-sm mb-6">
                Create your first project to get started
              </p>
              <button 
                onClick={() => setIsAdding(true)}
                className="w-full px-4 py-3 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-all cursor-pointer"
              >
                Create Your First Project
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Project List */}
              {projects.map((project, index) => (
                <Link 
                  key={project.id}
                  href={`/project/${project.id}`}
                  className="group flex items-center gap-4 px-4 py-3.5 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                    <span className="text-sm font-bold text-gray-600">
                      {project.domain.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {project.domain}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeletingProject(project);
                      }}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h14" />
                      </svg>
                    </button>
                    <span className="text-gray-300 group-hover:text-gray-400 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </Link>
              ))}

              {/* Add Project Button */}
              {!isAdding && (
                <div>
                  <button 
                    onClick={() => projects.length < maxProjects ? setIsAdding(true) : showToast(`You can only create up to ${maxProjects} projects.`, 'error')}
                    disabled={projects.length >= maxProjects}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      projects.length >= maxProjects 
                        ? 'border-gray-100 text-gray-300 cursor-not-allowed' 
                        : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50/50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add New Project
                  </button>
                  <p className="text-center text-[10px] text-gray-400 mt-1.5">
                    {projects.length} / {maxProjects} projects used
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <DomainsModal isOpen={isDomainsOpen} onClose={() => setIsDomainsOpen(false)} />

      {deletingProject && (
        <ConfirmModal
          title="Delete Project"
          message={`Are you sure you want to delete "${deletingProject.domain}"? This will permanently remove all associated data and conversations.`}
          confirmText="Delete Project"
          onConfirm={handleDeleteProject}
          onCancel={() => !isDeleting && setDeletingProject(null)}
          isDangerous={true}
          isLoading={isDeleting}
          loadingText="Deleting Project..."
        />
      )}

      {/* Pricing Modal - Can be opened from TopBar or upgrade hint */}
      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        currentCredits={userCredits}
        currentTier={subscriptionTier || 'free'}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Dismissible welcome hint for free tier users - shown at top */}
      {showUpgradeHint && subscriptionTier === 'free' && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 max-w-lg w-full px-4">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl shadow-lg p-4 flex items-center gap-3">
            <div className="text-2xl">🎉</div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Welcome! You have {userCredits} free credits</p>
              <p className="text-xs opacity-90 mt-0.5">Create up to {maxProjects} projects and generate pages — no payment required.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPricingModal(true)}
                className="px-3 py-1.5 bg-white text-emerald-600 text-xs font-semibold rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Get More
              </button>
              <button
                onClick={() => setShowUpgradeHint(false)}
                className="p-1 hover:bg-white/20 rounded transition-colors cursor-pointer"
                aria-label="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
