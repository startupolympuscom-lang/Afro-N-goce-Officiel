import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Truck, 
  CreditCard,
  CheckCircle2,
  Package,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEcomStore } from '../../../stores/useEcomStore';
import { AfroNegoceLogo } from '../../../components/Logo';

export default function EcomCartPage() {
  const navigate = useNavigate();
  const { cart, products, removeFromCart, updateCartQuantity, addOrder, clearCart } = useEcomStore();
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const cartItems = (cart || []).map(item => {
    const product = (products || []).find(p => p.id === item.productId);
    return {
      ...item,
      product
    };
  }).filter(item => item.product);

  const total = (cartItems || []).reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    addOrder({
      customerName: formData.name,
      customerEmail: formData.email,
      customerPhone: formData.phone,
      customerAddress: formData.address,
      items: cart,
      totalAmount: total
    });
    clearCart();
    setStep('success');
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-[2.5rem] p-12 text-center shadow-2xl shadow-blue-500/10 border border-slate-100"
        >
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Commande Reçue !</h2>
          <p className="text-slate-500 mb-10 leading-relaxed">Merci pour votre confiance. Notre équipe vous contactera sous peu pour confirmer la livraison et le paiement.</p>
          <Link 
            to="/ecom" 
            className="inline-flex items-center justify-center gap-2 w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            Retour à la boutique
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/ecom" className="flex items-center gap-3 group">
            <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-blue-50 transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:text-blue-600" />
            </div>
            <span className="font-bold text-slate-900">Retour Boutique</span>
          </Link>
          <div className="flex items-center gap-3">
            <AfroNegoceLogo className="w-8 h-8" />
            <span className="text-lg font-black tracking-tight text-blue-900">Panier</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {cartItems.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <ShoppingBag className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-4">Votre panier est vide</h2>
            <p className="text-slate-500 mb-8">Il semble que vous n'ayez pas encore ajouté de pièces à votre panier.</p>
            <Link 
              to="/ecom" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              Découvrir nos produits
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-12">
            {/* Left Column: Cart or Checkout Form */}
            <div className="lg:col-span-7">
              {step === 'cart' ? (
                <div className="space-y-6">
                  <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                    <ShoppingBag className="w-6 h-6 text-blue-600" />
                    Articles dans le panier
                  </h2>
                  {cartItems.map(item => (
                    <motion.div 
                      key={item.productId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white p-6 rounded-3xl border border-slate-100 flex gap-6 items-center shadow-sm"
                    >
                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-50 shrink-0">
                        <img 
                          src={item.product?.imageUrl} 
                          alt={item.product?.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 mb-1">{item.product?.name}</h4>
                        <p className="text-sm text-slate-500 mb-4">{(item.price || 0).toLocaleString()} MAD / unité</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-xl">
                            <button 
                              onClick={() => updateCartQuantity(item.productId, Math.max(1, item.quantity - 1))}
                              className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm hover:text-blue-600 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-black text-sm">{item.quantity}</span>
                            <button 
                              onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm hover:text-blue-600 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.productId)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                    <Truck className="w-6 h-6 text-blue-600" />
                    Informations de Livraison
                  </h2>
                  <form onSubmit={handleCheckout} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Nom Complet</label>
                        <input 
                          required
                          type="text" 
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          placeholder="Ex: Ahmed Benani"
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Téléphone</label>
                        <input 
                          required
                          type="tel" 
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          placeholder="Ex: 06 00 00 00 00"
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Email (Optionnel)</label>
                      <input 
                        type="email" 
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="votre@email.com"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Adresse de Livraison</label>
                      <textarea 
                        required
                        rows={3}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                        placeholder="Adresse complète, Ville, Quartier..."
                        value={formData.address}
                        onChange={e => setFormData({...formData, address: e.target.value})}
                      />
                    </div>
                    
                    <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex gap-4 items-start">
                      <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-amber-900 text-sm">Paiement à la Livraison (COD)</h4>
                        <p className="text-xs text-amber-700 mt-1">Vous paierez le montant total en espèces lors de la réception de votre commande.</p>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 mt-8 flex items-center justify-center gap-3"
                    >
                      Confirmer la Commande
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Right Column: Summary */}
            <div className="lg:col-span-5">
              <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white sticky top-32">
                <h3 className="text-xl font-black mb-8 uppercase tracking-tight">Résumé de la commande</h3>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-slate-400">
                    <span className="text-sm font-bold">Sous-total</span>
                    <span className="font-black text-white">{total.toLocaleString()} MAD</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span className="text-sm font-bold">Livraison</span>
                    <span className="text-emerald-400 font-black uppercase text-[10px] tracking-widest">Gratuite</span>
                  </div>
                  <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-3xl font-black text-blue-400">{total.toLocaleString()} MAD</span>
                  </div>
                </div>

                {step === 'cart' && (
                  <button 
                    onClick={() => setStep('checkout')}
                    className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3"
                  >
                    Passer à la caisse
                    <ArrowRight className="w-5 h-5" />
                  </button>
                )}

                {step === 'checkout' && (
                  <button 
                    onClick={() => setStep('cart')}
                    className="w-full py-4 bg-slate-800 text-slate-400 font-bold rounded-2xl hover:bg-slate-700 hover:text-white transition-all mt-4"
                  >
                    Modifier le panier
                  </button>
                )}

                <div className="mt-12 space-y-4">
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Livraison sécurisée par AFRO Négoce
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Paiement cash à la réception
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
