import React from 'react';
import { Database, Zap, Layers, Trophy } from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  return (
    <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto space-y-12">
      
      {/* Section Header */}
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white">
          Platforma Imkoniyatlari
        </h2>
      </div>

      {/* Grid Layout */}
      <div className="grid md:grid-cols-12 gap-6">
        
        {/* Card 1: 1000+ Savollar (Takes 8 columns on medium screens) */}
        <div className="md:col-span-8 bg-dark-card-hover p-8 rounded-2xl space-y-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-800/50 flex items-center justify-center text-indigo-400">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-white">1000+ Savollar</h3>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
            Turli qiyinlik darajasidagi yuzlab savollar bazasi bilan o'z bilimingizni har tomonlama sinovdan o'tkazing.
          </p>
        </div>

        {/* Card 2: Real-vaqtli janglar (Takes 4 columns on medium screens) */}
        <div className="md:col-span-4 bg-dark-card-hover p-8 rounded-2xl space-y-4">
          <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-800/50 flex items-center justify-center text-rose-400">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-white">Real-vaqtli janglar</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Boshqa foydalanuvchilarga qarshi real vaqtda bellashuv.
          </p>
        </div>

        {/* Card 3: Turli fanlar (Takes 4 columns) */}
        <div className="md:col-span-4 bg-dark-card-hover p-8 rounded-2xl space-y-4">
          <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-800/50 flex items-center justify-center text-purple-400">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-white">Turli fanlar</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Matematika, Dasturlash, Tarix va boshqa ko'plab sohalar.
          </p>
        </div>

        {/* Card 4: Reyting tizimi (Takes 8 columns) */}
        <div className="md:col-span-8 bg-dark-card-hover p-8 rounded-2xl space-y-4">
          <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-800/50 flex items-center justify-center text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-white">Reyting tizimi</h3>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
            G'alabalar orqali XP to'plang, global reytingda ko'tariling va mavsumiy yutuqlarga ega bo'ling.
          </p>
        </div>

      </div>

    </section>
  );
};
