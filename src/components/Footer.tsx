import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/60 py-8 px-4 md:px-8 mt-16 bg-[#05070F]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        
        {/* Brand */}
        <div className="font-extrabold text-base text-white tracking-tight">
          AI Study Battle
        </div>

        {/* Links */}
        <div className="flex items-center gap-6">
          <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-slate-200 transition-colors">
            Maxfiylik siyosati
          </a>
          <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:text-slate-200 transition-colors">
            Foydalanish shartlari
          </a>
          <a href="#contact" onClick={(e) => e.preventDefault()} className="hover:text-slate-200 transition-colors">
            Aloqa
          </a>
        </div>

        {/* Copyright */}
        <div>
          © 2026 AI Study Battle. Barcha huquqlar himoyalangan.
        </div>

      </div>
    </footer>
  );
};
