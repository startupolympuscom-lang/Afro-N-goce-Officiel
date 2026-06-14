import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type Language = 'fr' | 'ar' | 'en';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// Translation dictionary
const translations: Record<Language, Record<string, string>> = {
  fr: {
    'drivers.title': 'Chauffeurs / Vendeurs',
    'drivers.addButton': 'Ajouter un chauffeur',
    'drivers.newDriver': 'Nouveau Chauffeur',
    'drivers.form.name': 'Nom',
    'drivers.form.firstname': 'Prénom',
    'drivers.form.email': 'Email (pour connexion)',
    'drivers.form.password': 'Mot de passe',
    'drivers.form.phone': 'Téléphone',
    'drivers.form.cin': 'Numéro de CIN',
    'drivers.form.cnss': 'Num CNSS',
    'drivers.form.address': 'Adresse Domicile',
    'drivers.form.passwordPlaceholder': 'Créer le mot de passe',
    'drivers.form.cancel': 'Annuler',
    'drivers.form.save': 'Enregistrer',
    'drivers.table.namePrename': 'Nom & Prénom',
    'drivers.table.contact': 'Contact',
    'drivers.table.status': 'Statut',
    'drivers.table.actions': 'Actions',
    'drivers.table.empty': 'Aucun chauffeur enregistré.',
    'drivers.status.active': 'actif',
    'drivers.status.inactive': 'inactif',
    'drivers.success.added': 'Chauffeur ajouté avec succès',
    'drivers.success.deleted': 'Chauffeur supprimé',
    'drivers.error.accountCreation': 'Erreur lors de la création du compte',
    'drivers.error.passwordRequired': 'Mot de passe requis si vous fournissez un email',
    'drivers.error.network': 'Erreur réseau',
  },
  ar: {
    'drivers.title': 'السائقين / البائعين',
    'drivers.addButton': 'إضافة سائق',
    'drivers.newDriver': 'سائق جديد',
    'drivers.form.name': 'الاسم الأخير',
    'drivers.form.firstname': 'الاسم الأول',
    'drivers.form.email': 'البريد الإلكتروني (للدخول)',
    'drivers.form.password': 'كلمة المرور',
    'drivers.form.phone': 'الهاتف',
    'drivers.form.cin': 'رقم الهوية الوطنية',
    'drivers.form.cnss': 'رقم CNSS',
    'drivers.form.address': 'عنوان السكن',
    'drivers.form.passwordPlaceholder': 'إنشاء كلمة المرور',
    'drivers.form.cancel': 'إلغاء',
    'drivers.form.save': 'حفظ',
    'drivers.table.namePrename': 'الاسم الأول والأخير',
    'drivers.table.contact': 'جهة الاتصال',
    'drivers.table.status': 'الحالة',
    'drivers.table.actions': 'الإجراءات',
    'drivers.table.empty': 'لا توجد سائقين مسجلين.',
    'drivers.status.active': 'نشط',
    'drivers.status.inactive': 'غير نشط',
    'drivers.success.added': 'تم إضافة السائق بنجاح',
    'drivers.success.deleted': 'تم حذف السائق',
    'drivers.error.accountCreation': 'خطأ في إنشاء الحساب',
    'drivers.error.passwordRequired': 'كلمة المرور مطلوبة إذا قدمت بريد إلكتروني',
    'drivers.error.network': 'خطأ في الشبكة',
  },
  en: {
    'drivers.title': 'Drivers / Sellers',
    'drivers.addButton': 'Add Driver',
    'drivers.newDriver': 'New Driver',
    'drivers.form.name': 'Last Name',
    'drivers.form.firstname': 'First Name',
    'drivers.form.email': 'Email (for login)',
    'drivers.form.password': 'Password',
    'drivers.form.phone': 'Phone',
    'drivers.form.cin': 'CIN Number',
    'drivers.form.cnss': 'CNSS Number',
    'drivers.form.address': 'Home Address',
    'drivers.form.passwordPlaceholder': 'Create password',
    'drivers.form.cancel': 'Cancel',
    'drivers.form.save': 'Save',
    'drivers.table.namePrename': 'Name & First Name',
    'drivers.table.contact': 'Contact',
    'drivers.table.status': 'Status',
    'drivers.table.actions': 'Actions',
    'drivers.table.empty': 'No drivers registered.',
    'drivers.status.active': 'active',
    'drivers.status.inactive': 'inactive',
    'drivers.success.added': 'Driver added successfully',
    'drivers.success.deleted': 'Driver deleted',
    'drivers.error.accountCreation': 'Error creating account',
    'drivers.error.passwordRequired': 'Password required if you provide an email',
    'drivers.error.network': 'Network error',
  },
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'fr' as Language,
      setLanguage: (lang: Language) => set({ language: lang }),
      t: (key: string) => {
        const { language } = get();
        return translations[language]?.[key] ?? translations['fr']?.[key] ?? key;
      },
    }),
    {
      name: 'language-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
