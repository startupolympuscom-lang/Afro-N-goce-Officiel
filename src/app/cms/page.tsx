import React from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function CMSDashboardPage() {
  return (
    <div className="max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h1 className="text-sm font-black uppercase tracking-widest text-slate-500">Bienvenue</h1>
        </div>
        <h2 className="text-4xl font-black text-slate-900 font-display mb-8">Tableau de Bord CMS</h2>
      </motion.div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Contenu Accueil</h3>
          <p className="text-slate-500 mb-6">Gérez les textes du Hero, de la section À Propos, des Services et les informations de contact.</p>
          <Link to="/cms/home" className="inline-flex px-4 py-2 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-emerald-700 transition-colors">
            Éditer le contenu
          </Link>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Gérer Notre Histoire</h3>
          <p className="text-slate-500 mb-6">Ajoutez, modifiez ou supprimez les événements marquants de l'histoire de l'entreprise.</p>
          <Link to="/cms/history" className="inline-flex px-4 py-2 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-blue-600 transition-colors">
            Ouvrir l'éditeur
          </Link>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Identité Visuelle</h3>
          <p className="text-slate-500 mb-6">Uploadez les logos et mascottes des marques (Butagaz, Air Liquide) pour mise à jour immédiate.</p>
          <Link to="/cms/identity" className="inline-flex px-4 py-2 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-blue-700 transition-colors">
            Gérer les Assets
          </Link>
        </div>
        
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Images des Produits</h3>
          <p className="text-slate-500 mb-6">Modifiez les images des produits affichés sur les pages Butagaz et Air Liquide.</p>
          <Link to="/cms/products" className="inline-flex px-4 py-2 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-indigo-700 transition-colors">
            Gérer les Produits
          </Link>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Actualités & Événements</h3>
          <p className="text-slate-500 mb-6">Publiez les dernières nouvelles, événements et annonces sur la page d'accueil.</p>
          <Link to="/cms/news" className="inline-flex px-4 py-2 bg-rose-600 text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-rose-700 transition-colors">
            Gérer le contenu
          </Link>
        </div>
      </div>
    </div>
  );
}
