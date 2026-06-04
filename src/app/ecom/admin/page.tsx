import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Package, 
  List, 
  ShoppingBag, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Truck,
  X,
  ArrowLeft,
  ChevronRight,
  Search,
  Filter,
  Camera,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEcomStore, OrderStatus } from '../../../stores/useEcomStore';
import { AfroNegoceLogo } from '../../../components/Logo';

export default function EcomAdminPage() {
  const { 
    categories, addCategory, updateCategory, deleteCategory,
    products, addProduct, updateProduct, deleteProduct,
    orders, updateOrderStatus 
  } = useEcomStore();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'categories'>('orders');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Form States
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [productForm, setProductForm] = useState({ 
    name: '', 
    description: '', 
    price: 0, 
    categoryId: '', 
    imageUrl: '', 
    stock: 0 
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'aziz123') {
      setIsAuthenticated(true);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AfroNegoceLogo className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Accès Administrateur</h2>
            <p className="text-slate-500 text-sm mt-2">Veuillez entrer le mot de passe pour continuer.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Mot de passe</label>
              <input 
                autoFocus
                type="password" 
                className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all ${loginError ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'}`}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              {loginError && <p className="text-xs font-bold text-rose-500 ml-1">Mot de passe incorrect</p>}
            </div>

            <button 
              type="submit"
              className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-3"
            >
              Déverrouiller
              <ChevronRight className="w-5 h-5" />
            </button>
            
            <Link 
              to="/ecom" 
              className="flex items-center justify-center gap-2 w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-all text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour Boutique
            </Link>
          </form>
        </div>
      </div>
    );
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsCameraActive(true);
        };
      }
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Impossible d'accéder à la caméra. Assurez-vous d'avoir donné les permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      // Limit resolution to 800px max dimension for mobile performance
      const MAX_SIZE = 800;
      let width = videoRef.current.videoWidth;
      let height = videoRef.current.videoHeight;

      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0, width, height);
      // Use lower quality for Base64 efficiency
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setProductForm({ ...productForm, imageUrl: dataUrl });
      stopCamera();
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    
    // Compression logic for uploads
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setProductForm({ ...productForm, imageUrl: dataUrl });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };


  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateCategory(editingItem.id, categoryForm);
    } else {
      addCategory(categoryForm);
    }
    setIsModalOpen(false);
    setEditingItem(null);
    setCategoryForm({ name: '', description: '' });
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateProduct(editingItem.id, productForm);
    } else {
      addProduct(productForm);
    }
    setIsModalOpen(false);
    setEditingItem(null);
    setProductForm({ name: '', description: '', price: 0, categoryId: '', imageUrl: '', stock: 0 });
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-600 border-amber-200';
      case 'processed': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'sent': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'processed': return <Package className="w-4 h-4" />;
      case 'sent': return <Truck className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* Mobile Navigation Toggle */}
      <div className="lg:hidden p-6 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-[60]">
        <div className="flex items-center gap-3">
          <AfroNegoceLogo className="w-8 h-8" />
          <span className="font-black text-slate-900">Admin</span>
        </div>
        <select 
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as any)}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="orders">Commandes</option>
          <option value="products">Produits</option>
          <option value="categories">Catégories</option>
        </select>
      </div>

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-white border-r border-slate-100 z-50 hidden lg:block">
        <div className="p-8">
          <Link to="/ecom" className="flex items-center gap-3 mb-12 group">
            <AfroNegoceLogo className="w-10 h-10" />
            <div>
              <span className="block text-lg font-black tracking-tight text-blue-900">E-com Admin</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AFRO Négoce</span>
            </div>
          </Link>

          <nav className="space-y-2">
            {[
              { id: 'orders', label: 'Commandes', icon: <ShoppingBag className="w-5 h-5" /> },
              { id: 'products', label: 'Produits', icon: <Package className="w-5 h-5" /> },
              { id: 'categories', label: 'Catégories', icon: <List className="w-5 h-5" /> },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${
                  activeTab === item.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-8 left-8 right-8">
          <Link to="/ecom" className="flex items-center justify-center gap-2 w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm">
            <ArrowLeft className="w-4 h-4" />
            Retour Boutique
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 p-8 lg:p-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight capitalize">{activeTab}</h1>
            <p className="text-slate-500 text-sm mt-1">Gérez votre boutique en ligne AFRO Négoce.</p>
          </div>
          
          {activeTab !== 'orders' && (
            <button 
              onClick={() => {
                setEditingItem(null);
                if (activeTab === 'categories') setCategoryForm({ name: '', description: '' });
                else setProductForm({ name: '', description: '', price: 0, categoryId: '', imageUrl: '', stock: 0 });
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              <Plus className="w-5 h-5" />
              Ajouter {activeTab === 'categories' ? 'une catégorie' : 'un produit'}
            </button>
          )}
        </header>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {(orders || []).length > 0 ? (
              <div className="grid gap-6">
                {(orders || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(order => (
                  <div key={order.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-black text-slate-900">Commande #{order.id}</h3>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black border flex items-center gap-1.5 uppercase tracking-widest ${getStatusColor(order.status)}`}>
                              {getStatusIcon(order.status)}
                              {order.status}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-400">{new Date(order.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <select 
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="pending">En attente</option>
                          <option value="processed">Traitée</option>
                          <option value="sent">Envoyée</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12">
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Client & Livraison</h4>
                        <div className="space-y-3">
                          <p className="text-sm font-bold text-slate-900">{order.customerName}</p>
                          <p className="text-sm text-slate-600">{order.customerPhone}</p>
                          <p className="text-sm text-slate-600">{order.customerEmail || 'Pas d\'email'}</p>
                          <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">{order.customerAddress}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Articles</h4>
                        <div className="space-y-3">
                          {(order.items || []).map((item, idx) => {
                            const product = (products || []).find(p => p.id === item.productId);
                            return (
                              <div key={idx} className="flex justify-between items-center text-sm">
                                <span className="font-bold text-slate-700">{item.quantity}x {product?.name || 'Produit inconnu'}</span>
                                <span className="font-black text-slate-900">{(item.price * item.quantity).toLocaleString()} MAD</span>
                              </div>
                            );
                          })}
                          <div className="pt-4 mt-4 border-t border-slate-100 flex justify-between items-center">
                            <span className="font-black text-slate-900 uppercase tracking-widest text-xs">Total</span>
                            <span className="text-xl font-black text-blue-600">{order.totalAmount.toLocaleString()} MAD</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-white rounded-[2.5rem] border border-slate-100">
                <ShoppingBag className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-bold">Aucune commande pour le moment</p>
              </div>
            )}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {(products || []).map(product => (
              <div key={product.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all group">
                <div className="h-48 relative">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        setEditingItem(product);
                        setProductForm({ ...product });
                        setIsModalOpen(true);
                      }}
                      className="p-2 bg-white/90 backdrop-blur-md text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteProduct(product.id)}
                      className="p-2 bg-white/90 backdrop-blur-md text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-900">{product.name}</h4>
                    <span className="text-sm font-black text-blue-600">{(product.price || 0).toLocaleString()} MAD</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">{product.description}</p>
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <Package className="w-3 h-3" />
                    Stock: {product.stock || 0}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(categories || []).map(category => (
              <div key={category.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center group">
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-1">{category.name}</h4>
                  <p className="text-xs text-slate-500">{category.description || 'Pas de description'}</p>
                </div>
                <div className="flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => {
                      setEditingItem(category);
                      setCategoryForm({ name: category.name, description: category.description || '' });
                      setIsModalOpen(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors bg-blue-50/50 lg:bg-transparent"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => deleteCategory(category.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors bg-rose-50/50 lg:bg-transparent"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal for Add/Edit */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-900">
                  {editingItem ? 'Modifier' : 'Ajouter'} {activeTab === 'categories' ? 'la catégorie' : 'le produit'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={activeTab === 'categories' ? handleSaveCategory : handleSaveProduct} className="flex-1 overflow-y-auto p-8 space-y-6 max-h-[70vh]">
                {activeTab === 'categories' ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Nom de la catégorie</label>
                      <input 
                        required
                        type="text" 
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="Ex: Détendeurs"
                        value={categoryForm.name}
                        onChange={e => setCategoryForm({...categoryForm, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Description</label>
                      <textarea 
                        rows={3}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                        placeholder="Description optionnelle..."
                        value={categoryForm.description}
                        onChange={e => setCategoryForm({...categoryForm, description: e.target.value})}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Nom du produit</label>
                        <input 
                          required
                          type="text" 
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          placeholder="Ex: Détendeur 30mbar"
                          value={productForm.name}
                          onChange={e => setProductForm({...productForm, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Catégorie</label>
                        <select 
                          required
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          value={productForm.categoryId}
                          onChange={e => setProductForm({...productForm, categoryId: e.target.value})}
                        >
                          <option value="">Sélectionner...</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Prix (MAD)</label>
                        <input 
                          required
                          type="number" 
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          placeholder="0.00"
                          value={productForm.price}
                          onChange={e => setProductForm({...productForm, price: Number(e.target.value)})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Stock</label>
                        <input 
                          required
                          type="number" 
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          placeholder="0"
                          value={productForm.stock}
                          onChange={e => setProductForm({...productForm, stock: Number(e.target.value)})}
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Image du produit</label>
                      
                      <div className="flex flex-col gap-4">
                        {productForm.imageUrl && !isCameraActive && (
                          <div className="relative w-full max-h-64 aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                            <img src={productForm.imageUrl} alt="Preview" className="w-full h-full object-contain" />
                            <button 
                              type="button"
                              onClick={() => setProductForm({ ...productForm, imageUrl: '' })}
                              className="absolute top-2 right-2 p-2 bg-rose-600 text-white rounded-xl shadow-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {isCameraActive && (
                          <div className="relative w-full max-h-64 aspect-video rounded-2xl overflow-hidden bg-black border border-slate-200">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                              <button 
                                type="button"
                                onClick={capturePhoto}
                                className="p-4 bg-white text-slate-900 rounded-full shadow-2xl active:scale-90"
                              >
                                <Camera className="w-6 h-6" />
                              </button>
                              <button 
                                type="button"
                                onClick={stopCamera}
                                className="p-4 bg-slate-900/50 text-white rounded-full backdrop-blur-md"
                              >
                                <X className="w-6 h-6" />
                              </button>
                            </div>
                          </div>
                        )}

                        {!isCameraActive && (
                          <div className="grid grid-cols-2 gap-4">
                            <label className="cursor-pointer">
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                              />
                              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-all gap-2">
                                <Upload className="w-6 h-6 text-slate-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Uploader</span>
                              </div>
                            </label>
                            
                            <button 
                              type="button"
                              onClick={startCamera}
                              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-all gap-2"
                            >
                              <Camera className="w-6 h-6 text-slate-400" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Prendre Photo</span>
                            </button>
                          </div>
                        )}

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ou URL de l'image</label>
                          <input 
                            type="url" 
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            placeholder="https://..."
                            value={productForm.imageUrl}
                            onChange={e => setProductForm({...productForm, imageUrl: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Description</label>
                      <textarea 
                        required
                        rows={3}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                        placeholder="Détails techniques, dimensions..."
                        value={productForm.description}
                        onChange={e => setProductForm({...productForm, description: e.target.value})}
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-4 pt-4 sticky bottom-0 bg-white">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
