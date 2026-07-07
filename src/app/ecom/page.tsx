import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  ShoppingBasket, 
  Search, 
  Filter, 
  ArrowRight, 
  ShoppingCart,
  ChevronRight,
  Package,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEcomStore } from '../../stores/useEcomStore';
import { AfroNegoceLogo } from '../../components/Logo';

export default function EcomPage() {
  const { products = [], categories = [], addToCart, cart = [] } = useEcomStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => {
    return (products || []).filter(product => {
      const matchesCategory = selectedCategory ? product.categoryId === selectedCategory : true;
      const matchesSearch = (product.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (product.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const cartCount = (cart || []).reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Link to="/" className="flex items-center gap-3">
              <AfroNegoceLogo className="w-8 h-8" />
              <span className="text-lg font-bold tracking-tight text-blue-900">Pièces de Gaz</span>
            </Link>
            
            <div className="flex items-center gap-6">
              <Link to="/ecom/admin" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">Admin</Link>
              <Link 
                to="/ecom/cart" 
                className="relative p-2 bg-slate-100 rounded-full hover:bg-blue-50 transition-all group"
              >
                <ShoppingCart className="w-6 h-6 text-slate-600 group-hover:text-blue-600" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-12 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Marketplace Pièces de Gaz</h1>
              <p className="text-slate-500 max-w-lg">Trouvez toutes les pièces détachées et accessoires pour vos installations de gaz. Livraison à domicile, paiement à la livraison.</p>
            </div>
            
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Rechercher une pièce..." 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 shrink-0 space-y-8">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Catégories
              </h3>
              <div className="space-y-2">
                <button 
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${!selectedCategory ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-600 hover:bg-white hover:text-blue-600'}`}
                >
                  Toutes les pièces
                </button>
                {(categories || []).map(category => (
                  <button 
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${selectedCategory === category.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-600 hover:bg-white hover:text-blue-600'}`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 bg-blue-900 rounded-3xl text-white relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="font-bold mb-2">Besoin d'aide ?</h4>
                <p className="text-xs text-blue-200 mb-4">Nos experts vous conseillent sur le choix de vos pièces.</p>
                <a href="tel:0535558020" className="text-sm font-black underline">Appeler le support</a>
              </div>
              <div className="absolute -bottom-4 -right-4 opacity-10">
                <ShoppingBasket className="w-24 h-24" />
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredProducts.map(product => (
                  <motion.div 
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-xl transition-all group"
                  >
                    <div className="h-56 relative overflow-hidden">
                      <img 
                        src={product.imageUrl || "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=500"} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black text-blue-600 border border-blue-100">
                        {(product.price || 0).toLocaleString()} MAD
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-bold text-slate-900">{product.name}</h4>
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-2 mb-6">{product.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-slate-400" />
                          <span className="text-xs font-bold text-slate-500">{product.stock} en stock</span>
                        </div>
                        <button 
                          onClick={() => addToCart(product.id, 1, product.price || 0)}
                          className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
                        >
                          <ShoppingCart className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <Package className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-bold">Aucun produit trouvé</p>
                <button 
                  onClick={() => { setSelectedCategory(null); setSearchQuery(''); }}
                  className="mt-4 text-blue-600 font-bold hover:underline"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-12 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <AfroNegoceLogo className="w-8 h-8" />
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">AFRO Négoce Pièces</span>
          </div>
          <div className="flex gap-8 text-sm font-bold text-slate-500">
            <Link to="/" className="hover:text-blue-600 transition-colors">Accueil</Link>
            <Link to="/ecom/admin" className="hover:text-blue-600 transition-colors">Vendre</Link>
            <Link to="/ecom/cart" className="hover:text-blue-600 transition-colors">Panier</Link>
          </div>
          <p className="text-xs text-slate-400">© 2026 AFRO Négoce. Paiement à la livraison uniquement.</p>
        </div>
      </footer>
    </div>
  );
}
