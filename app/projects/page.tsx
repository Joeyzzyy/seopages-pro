'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase, getSEOProjects, createSEOProject, deleteSEOProject, SEOProject } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import AuthButton from '@/components/AuthButton';
import TopBar from '@/components/TopBar';
import DomainsModal from '@/components/DomainsModal';
import ConfirmModal from '@/components/ConfirmModal';

export default function ProjectsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<SEOProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isDomainsOpen, setIsDomainsOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingProject, setDeletingProject] = useState<SEOProject | null>(null);
  const router = useRouter();
  
  const brandGradient = 'linear-gradient(80deg, #FFAF40, #D194EC, #9A8FEA, #65B4FF)';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProjects(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProjects(session.user.id);
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
      // Optional: Automatically redirect to the new project
      // router.push(`/chat/${project.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!deletingProject) return;

    try {
      await deleteSEOProject(deletingProject.id);
      setProjects(projects.filter(p => p.id !== deletingProject.id));
      setDeletingProject(null);
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project. Please try again.');
    }
  };

  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center font-sans">
        <div className="text-center">
          <div className="mb-8">
            <Image src="/product-logo.webp" alt="Logo" width={64} height={64} className="mx-auto rounded-xl" />
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
          onGSCClick={() => {}}
        />
      )}

      <main className="flex-1 max-w-4xl mx-auto w-full px-8 py-12">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Your Projects</h1>
            <p className="text-gray-500 mt-1">Select or add a domain project to start working</p>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Project
          </button>
        </div>

        {isAdding && (
          <div className="mb-12 bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Domain</h3>
            <form onSubmit={handleAddProject} className="flex gap-4">
              <input
                type="text"
                placeholder="e.g. example.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                autoFocus
              />
              <button
                type="submit"
                disabled={isSubmitting || !newDomain.trim()}
                className="px-6 py-3 bg-black text-white rounded-2xl text-sm font-bold hover:bg-gray-800 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add Project'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewDomain('');
                }}
                className="px-6 py-3 bg-gray-100 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-all"
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
              Enter your domain to start generating AI-powered SEO content and manage your site context.
            </p>
            <button 
              onClick={() => setIsAdding(true)}
              className="px-6 py-3 bg-black text-white rounded-2xl text-sm font-bold hover:bg-gray-800 transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              Add My First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project) => (
              <Link 
                key={project.id}
                href={`/chat/${project.id}`}
                className="group p-6 bg-white border border-[#F3F4F6] rounded-[28px] shadow-sm hover:shadow-xl hover:border-transparent transition-all duration-500 relative overflow-hidden flex flex-col justify-between min-h-[180px]"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500" style={{ background: brandGradient }} />
                
                <div className="relative z-10 flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#FAFAFA] flex items-center justify-center text-[#9CA3AF] group-hover:text-black group-hover:bg-white transition-all duration-500 border border-transparent group-hover:border-gray-100 shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeletingProject(project);
                    }}
                    className="p-2 text-[#9CA3AF] hover:text-[#EF4444] hover:bg-red-50 rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100"
                    title="Delete Project"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h14" />
                    </svg>
                  </button>
                </div>

                <div className="relative z-10 mt-4">
                  <h3 className="text-xl font-black text-[#111827] tracking-tight group-hover:translate-x-1 transition-transform duration-500 truncate">
                    {project.domain}
                  </h3>
                  <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mt-1">
                    Manage SEO & Context
                  </p>
                </div>

                <div className="relative z-10 flex items-center justify-end mt-4">
                  <div className="w-10 h-10 rounded-full border border-[#F3F4F6] flex items-center justify-center text-[#D1D5DB] group-hover:text-black group-hover:border-black group-hover:rotate-[-45deg] transition-all duration-500 bg-white">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
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
          message={`Are you sure you want to delete the project for "${deletingProject.domain}"? This will permanently remove all associated site contexts and conversations.`}
          confirmText="Delete Project"
          onConfirm={handleDeleteProject}
          onCancel={() => setDeletingProject(null)}
          isDangerous={true}
        />
      )}
    </div>
  );
}
