import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Save, ArrowLeft, Image as ImageIcon, Phone, Mail, MapPin, Type, FileText, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLandingStore } from '../../../stores/useLandingStore';

export default function CMSHomePage() {
  const store = useLandingStore();
  const [formData, setFormData] = useState({
    heroTitle: store.heroTitle,
    heroSubtitle: store.heroSubtitle,
    heroDescription: store.heroDescription,
    heroImage: store.heroImage || "",
    aboutTitle: store.aboutTitle,
    aboutDescription: store.aboutDescription,
    servicesTitle: store.servicesTitle,
    servicesDescription: store.servicesDescription,
    pipelineImage: store.pipelineImage,
    contactPhone: store.contactPhone,
    contactEmail: store.contactEmail,
    contactAddress: store.contactAddress,
    butagazCardImage: store.butagazCardImage,
    airLiquideCardImage: store.airLiquideCardImage,
    contactBgImage: store.contactBgImage,
    logoText: store.logoText,
    logoImage: store.logoImage || "",
    mascotImage: store.mascotImage || "",
  });

  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    store.updateHeroContent({
      heroTitle: formData.heroTitle,
      heroSubtitle: formData.heroSubtitle,
      heroDescription: formData.heroDescription,
    });
    if (formData.heroImage) store.setHeroImage(formData.heroImage);
    
    store.updateAboutContent({
      aboutTitle: formData.aboutTitle,
      aboutDescription: formData.aboutDescription,
    });
    
    store.updateServicesContent({
      servicesTitle: formData.servicesTitle,
      servicesDescription: formData.servicesDescription,
      pipelineImage: formData.pipelineImage,
    });
    
    store.updateContactInfo({
      contactPhone: formData.contactPhone,
      contactEmail: formData.contactEmail,
      contactAddress: formData.contactAddress,
    });

    store.updateMediaContent({
      butagazCardImage: formData.butagazCardImage,
      airLiquideCardImage: formData.airLiquideCardImage,
      contactBgImage: formData.contactBgImage,
      logoText: formData.logoText,
      logoImage: formData.logoImage,
      mascotImage: formData.mascotImage,
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleMascotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, mascotImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-4xl pb-20">
      <div className="flex items-center justify-between mb-8">
        <Link to="/cms" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-widest">Retour au CMS</span>
        </Link>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
        >
          <Save className="w-4 h-4" />
          {isSaved ? "Enregistré !" : "Enregistrer"}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <h1 className="text-3xl font-black text-slate-900 font-display">ÉDITEUR PAGE D'ACCUEIL</h1>

        {/* Hero Section */}
        <section className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
            <Type className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-black text-slate-900 uppercase">Section Hero</h2>
          </div>
          
          <div className="grid gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sous-titre (Badge)</label>
              <input 
                name="heroSubtitle"
                value={formData.heroSubtitle}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Titre Principal</label>
              <input 
                name="heroTitle"
                value={formData.heroTitle}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
              <textarea 
                name="heroDescription"
                value={formData.heroDescription}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all resize-none" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">URL de l'image Hero</label>
              <div className="flex gap-4">
                <input 
                  name="heroImage"
                  value={formData.heroImage}
                  onChange={handleChange}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" 
                />
                {formData.heroImage && (
                  <img src={formData.heroImage} alt="Hero Preview" className="w-12 h-12 rounded-lg object-cover" />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-black text-slate-900 uppercase">Section À Propos</h2>
          </div>
          
          <div className="grid gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Titre de la section</label>
              <input 
                name="aboutTitle"
                value={formData.aboutTitle}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
              <textarea 
                name="aboutDescription"
                value={formData.aboutDescription}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-none" 
              />
            </div>
          </div>
        </section>

        {/* Services / Pipeline Section */}
        <section className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
            <ImageIcon className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-black text-slate-900 uppercase">Section Services & Pipeline</h2>
          </div>
          
          <div className="grid gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Titre du service</label>
              <input 
                name="servicesTitle"
                value={formData.servicesTitle}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description du service</label>
              <textarea 
                name="servicesDescription"
                value={formData.servicesDescription}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all resize-none" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">URL de l'image Pipeline</label>
              <div className="flex gap-4">
                <input 
                  name="pipelineImage"
                  value={formData.pipelineImage}
                  onChange={handleChange}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all" 
                />
                {formData.pipelineImage && (
                  <img src={formData.pipelineImage} alt="Pipeline Preview" className="w-12 h-12 rounded-lg object-cover" />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Contact Info */}
        <section className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6 text-slate-900">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
            <Phone className="w-5 h-5 text-rose-600" />
            <h2 className="text-lg font-black text-slate-900 uppercase">Informations de Contact</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Phone className="w-3 h-3" /> Téléphone
              </label>
              <input 
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Mail className="w-3 h-3" /> Email
              </label>
              <input 
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all" 
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <MapPin className="w-3 h-3" /> Adresse
              </label>
              <input 
                name="contactAddress"
                value={formData.contactAddress}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all" 
              />
            </div>
          </div>
        </section>

        {/* Global Media Content */}
        <section className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6 text-slate-900">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
            <ImageIcon className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-black text-slate-900 uppercase">Média & Images Globales</h2>
          </div>
          
          <div className="grid gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Texte du Logo (Affiché si pas d'image)</label>
              <input 
                name="logoText"
                value={formData.logoText}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">URL du Logo (Header)</label>
              <div className="flex gap-4">
                <input 
                  name="logoImage"
                  value={formData.logoImage}
                  onChange={handleChange}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" 
                />
                {formData.logoImage && (
                  <img src={formData.logoImage} alt="Preview" className="w-12 h-12 rounded-lg object-contain bg-slate-50 border border-slate-200" />
                )}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Image de la Mascotte (Uploader)</label>
              <div className="flex gap-4">
                <input 
                  type="file"
                  accept="image/*"
                  onChange={handleMascotUpload}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
                />
                {formData.mascotImage && (
                  <img src={formData.mascotImage} alt="Preview" className="w-12 h-12 rounded-lg object-contain bg-slate-50 border border-slate-200" />
                )}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Image Carte Butagaz</label>
              <div className="flex gap-4">
                <input 
                  name="butagazCardImage"
                  value={formData.butagazCardImage}
                  onChange={handleChange}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" 
                />
                {formData.butagazCardImage && (
                  <img src={formData.butagazCardImage} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Image Carte Air Liquide</label>
              <div className="flex gap-4">
                <input 
                  name="airLiquideCardImage"
                  value={formData.airLiquideCardImage}
                  onChange={handleChange}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" 
                />
                {formData.airLiquideCardImage && (
                  <img src={formData.airLiquideCardImage} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
                )}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Image Fond Contact</label>
              <div className="flex gap-4">
                <input 
                  name="contactBgImage"
                  value={formData.contactBgImage}
                  onChange={handleChange}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" 
                />
                {formData.contactBgImage && (
                  <img src={formData.contactBgImage} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Partners Logos Section */}
        <section className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6 text-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <ImageIcon className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-black text-slate-900 uppercase">Logos Partenaires</h2>
            </div>
            <button
              type="button"
              onClick={() => store.addPartnerLogo({ id: Math.random().toString(), name: 'Nouveau Partenaire', url: '' })}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg text-xs font-bold transition-colors"
            >
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </div>
          
          <div className="grid gap-4">
            {store.partnerLogos.map((logo) => (
              <div key={logo.id} className="flex gap-4 items-start p-4 border border-slate-100 rounded-xl bg-slate-50">
                <div className="flex-1 space-y-3">
                  <input 
                    value={logo.name}
                    onChange={(e) => store.updatePartnerLogoName(logo.id, e.target.value)}
                    placeholder="Nom du partenaire"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500" 
                  />
                  <input 
                    value={logo.url}
                    onChange={(e) => {
                      const updatedLogos = store.partnerLogos.map(l => l.id === logo.id ? { ...l, url: e.target.value } : l);
                      useLandingStore.setState({ partnerLogos: updatedLogos });
                    }}
                    placeholder="URL de l'image du logo"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500" 
                  />
                </div>
                <div className="flex flex-col items-center gap-3 shrink-0">
                  <div className="w-16 h-12 bg-white rounded flex items-center justify-center border border-slate-200 p-2 overflow-hidden">
                    {logo.url ? (
                      <img src={logo.url} alt="Logo" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  <button
                    onClick={() => store.removePartnerLogo(logo.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {store.partnerLogos.length === 0 && (
              <p className="text-sm text-center text-slate-500 py-6">Aucun logo configuré. Les logos par défaut seront affichés.</p>
            )}
          </div>
        </section>
      </motion.div>
    </div>
  );
}
