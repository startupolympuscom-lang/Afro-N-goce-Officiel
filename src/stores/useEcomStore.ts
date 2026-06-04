import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { postgresStorage } from '../lib/postgresStorage';

export type OrderStatus = 'pending' | 'processed' | 'sent';

export interface EcomCategory {
  id: string;
  name: string;
  description?: string;
}

export interface EcomProduct {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface EcomOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
}

interface EcomState {
  categories: EcomCategory[];
  products: EcomProduct[];
  orders: EcomOrder[];
  cart: CartItem[];
  
  // Category Actions
  addCategory: (category: Omit<EcomCategory, 'id'>) => void;
  updateCategory: (id: string, category: Partial<EcomCategory>) => void;
  deleteCategory: (id: string) => void;
  
  // Product Actions
  addProduct: (product: Omit<EcomProduct, 'id'>) => void;
  updateProduct: (id: string, product: Partial<EcomProduct>) => void;
  deleteProduct: (id: string) => void;
  
  // Order Actions
  addOrder: (order: Omit<EcomOrder, 'id' | 'status' | 'createdAt'>) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  
  // Cart Actions
  addToCart: (productId: string, quantity: number, price: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useEcomStore = create<EcomState>()(
  persist(
    (set) => ({
      categories: [],
      products: [],
      orders: [],
      cart: [],

      addCategory: (category) => set((state) => ({
        categories: [...state.categories, { ...category, id: Math.random().toString(36).substring(2, 9) }]
      })),
      updateCategory: (id, category) => set((state) => ({
        categories: state.categories.map(c => c.id === id ? { ...c, ...category } : c)
      })),
      deleteCategory: (id) => set((state) => ({
        categories: state.categories.filter(c => c.id !== id)
      })),

      addProduct: (product) => set((state) => ({
        products: [...state.products, { ...product, id: Math.random().toString(36).substring(2, 9) }]
      })),
      updateProduct: (id, product) => set((state) => ({
        products: state.products.map(p => p.id === id ? { ...p, ...product } : p)
      })),
      deleteProduct: (id) => set((state) => ({
        products: state.products.filter(p => p.id !== id)
      })),

      addOrder: (order) => set((state) => ({
        orders: [...state.orders, { 
          ...order, 
          id: Math.random().toString(36).substring(2, 9),
          status: 'pending',
          createdAt: new Date().toISOString()
        }]
      })),
      updateOrderStatus: (id, status) => set((state) => ({
        orders: state.orders.map(o => o.id === id ? { ...o, status } : o)
      })),

      addToCart: (productId, quantity, price) => set((state) => {
        const existingItem = state.cart.find(item => item.productId === productId);
        if (existingItem) {
          return {
            cart: state.cart.map(item => 
              item.productId === productId 
                ? { ...item, quantity: item.quantity + quantity } 
                : item
            )
          };
        }
        return { cart: [...state.cart, { productId, quantity, price }] };
      }),
      removeFromCart: (productId) => set((state) => ({
        cart: state.cart.filter(item => item.productId !== productId)
      })),
      updateCartQuantity: (productId, quantity) => set((state) => ({
        cart: state.cart.map(item => 
          item.productId === productId ? { ...item, quantity } : item
        )
      })),
      clearCart: () => set({ cart: [] }),
    }),
    {
      name: 'ecom-storage',
      storage: createJSONStorage(() => postgresStorage),
    }
  )
);
