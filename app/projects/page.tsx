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

export default function ProjectsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<SEOProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isDomainsOpen, setIsDomainsOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingProject, setDeletingProject] = useState<SEOProject | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userCredits, setUserCredits] = useState<number>(1);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const [showPricingModal, setShowPricingModal] = useState(false);
  const hasShownPricingModal = useRef(false);
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
        setUserCredits(data.credits ?? 1);
        setSubscriptionTier(data.subscription_tier ?? 'free');
        
        // Auto-show pricing modal for free tier users (only once per session)
        if (data.subscription_tier === 'free' && !hasShownPricingModal.current) {
          hasShownPricingModal.current = true;
          // Small delay to ensure page is loaded
          setTimeout(() => {
            setShowPricingModal(true);
          }, 500);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user credits:', error);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = (newCredits: number, newTier: string) => {
    setUserCredits(newCredits);
    setSubscriptionTier(newTier);
    setShowPricingModal(false);
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
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans">
      {user && (
        <TopBar 
          user={user}
          onDomainsClick={() => setIsDomainsOpen(true)}
          credits={userCredits}
          subscriptionTier={subscriptionTier}
          onCreditsUpdate={handlePaymentSuccess}
        />
      )}

      <main className="flex-1 max-w-4xl mx-auto w-full px-8 py-12">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Your Projects</h1>
            <p className="text-gray-500 mt-1">Select or add a project to start creating alternative pages</p>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Project
          </button>
        </div>

        {isAdding && (
          <div className="mb-12 bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Project</h3>
            <form onSubmit={handleAddProject} className="flex gap-4">
              <input
                type="text"
                placeholder="e.g. example.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-300 transition-all"
                autoFocus
              />
              <button
                type="submit"
                disabled={isSubmitting || !newDomain.trim()}
                className="px-6 py-3 bg-black text-white rounded-2xl text-sm font-bold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? 'Adding...' : 'Add Project'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewDomain('');
                }}
                className="px-6 py-3 bg-gray-100 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
            <p className="text-sm text-gray-500 animate-pulse">Loading your projects...</p>
          </div>
        ) : projects.length === 0 && !isAdding ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-[32px] p-16 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-500 max-w-xs mx-auto mb-8 text-sm">
              Enter your domain to start creating alternative pages for your competitors.
            </p>
            <button 
              onClick={() => setIsAdding(true)}
              className="px-6 py-3 bg-black text-white rounded-2xl text-sm font-bold hover:bg-gray-800 transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              Add My First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => (
              <Link 
                key={project.id}
                href={`/project/${project.id}`}
                className="group px-6 py-5 bg-white border border-gray-100 rounded-2xl hover:border-gray-200 hover:shadow-md transition-all duration-300 flex items-center justify-between cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 truncate">
                    {project.domain}
                  </h3>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeletingProject(project);
                    }}
                    className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
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
          </div>
        )}
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

      {/* Pricing Modal - Auto shows for free tier users */}
      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        currentCredits={userCredits}
        currentTier={subscriptionTier}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
