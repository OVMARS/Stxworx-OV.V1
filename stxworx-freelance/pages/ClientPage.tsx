import React from 'react';
import { useAppStore } from '../stores/useAppStore';
import ProjectCard from '../components/ProjectCard';
import { PlusCircle, Layers } from 'lucide-react';

const ClientPage: React.FC = () => {
  const { projects, isProcessing, handleProjectAction, setIsModalOpen } = useAppStore();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">Client Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your active contracts and escrow.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-orange-900/20 flex items-center gap-2 transition-all hover:scale-105"
        >
          <PlusCircle className="w-5 h-5" /> New Contract
        </button>
      </div>

      <div className="space-y-6">
        {projects.length > 0 ? (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              role="client"
              onAction={handleProjectAction}
              isProcessing={isProcessing}
            />
          ))
        ) : (
          <div className="text-center py-20 bg-[#0b0f19] rounded-2xl border border-dashed border-slate-800">
            <Layers className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Active Contracts</h3>
            <p className="text-slate-400 max-w-md mx-auto mb-6">
              Create a new milestone-based escrow contract to start working with freelancers securely.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-orange-500 font-bold hover:underline uppercase tracking-wide text-xs"
            >
              Create your first contract
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientPage;
