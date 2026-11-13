import type { UiLocale } from '../domain/money-dzd.js';

export interface StoryCopy {
  readonly controls: string;
  readonly button: string;
  readonly saving: string;
  readonly loading: string;
  readonly secondary: string;
  readonly search: string;
  readonly noResults: string;
  readonly emptyTitle: string;
  readonly emptyDescription: string;
  readonly create: string;
  readonly date: string;
  readonly phone: string;
  readonly deliveryType: string;
  readonly homeDelivery: string;
  readonly stopDesk: string;
  readonly wilaya: string;
  readonly commune: string;
  readonly wilayaPlaceholder: string;
  readonly communePlaceholder: string;
  readonly exampleAmount: string;
  readonly inTransit: string;
  readonly data: string;
  readonly order: string;
  readonly state: string;
  readonly dialog: string;
  readonly dialogTitle: string;
  readonly dialogDescription: string;
  readonly drawer: string;
  readonly panel: string;
  readonly tooltip: string;
  readonly notify: string;
  readonly toastTitle: string;
  readonly toastDescription: string;
  readonly empty: string;
  readonly details: string;
  readonly activity: string;
  readonly status: string;
  readonly selectRow: string;
  readonly selectedRows: string;
  readonly selectAll: string;
  readonly dismiss: string;
  readonly storyDescription: string;
  readonly invalidValue: string;
}

export const storyCopy: Readonly<Record<UiLocale, StoryCopy>> = {
  en: {
    controls: 'Controls',
    button: 'Create order',
    saving: 'Saving…',
    secondary: 'Cancel',
    search: 'Search delivery type',
    noResults: 'No delivery types match.',
    emptyTitle: 'No orders yet',
    emptyDescription: 'New orders will appear here after they are added to this store.',
    create: 'Add an order',
    date: 'Delivery date',
    phone: 'Buyer phone',
    deliveryType: 'Delivery type',
    homeDelivery: 'Home delivery',
    stopDesk: 'Stop desk',
    wilaya: 'Wilaya',
    commune: 'Commune',
    wilayaPlaceholder: 'Choose a wilaya',
    communePlaceholder: 'Choose a commune',
    exampleAmount: 'Example amount',
    inTransit: 'In transit',
    data: 'Data and status',
    order: 'Example order',
    state: 'Status',
    dialog: 'Open dialog',
    dialogTitle: 'Confirm action',
    dialogDescription: 'Review the order details before continuing.',
    drawer: 'Open drawer',
    panel: 'Order details',
    tooltip: 'This action keeps the order in the store.',
    notify: 'Show notification',
    toastTitle: 'Changes saved',
    toastDescription: 'The order details were updated.',
    empty: 'Empty state',
    loading: 'Loading rows',
    details: 'Details',
    activity: 'Activity',
    status: 'Status',
    selectRow: 'Select',
    selectedRows: 'Selected rows',
    selectAll: 'Select all rows',
    dismiss: 'Dismiss notification',
    storyDescription: 'Components in light, dark, LTR and RTL.',
    invalidValue: 'Use a valid value to continue.',
  },
  fr: {
    controls: 'Commandes',
    button: 'Créer une commande',
    saving: 'Enregistrement…',
    secondary: 'Annuler',
    search: 'Rechercher un mode de livraison',
    noResults: 'Aucun mode de livraison correspondant.',
    emptyTitle: 'Aucune commande',
    emptyDescription: 'Les nouvelles commandes de cette boutique apparaîtront ici.',
    create: 'Ajouter une commande',
    date: 'Date de livraison',
    phone: 'Téléphone du client',
    deliveryType: 'Mode de livraison',
    homeDelivery: 'À domicile',
    stopDesk: 'Point relais',
    wilaya: 'Wilaya',
    commune: 'Commune',
    wilayaPlaceholder: 'Choisir une wilaya',
    communePlaceholder: 'Choisir une commune',
    exampleAmount: 'Montant d’exemple',
    inTransit: 'En transit',
    data: 'Données et statut',
    order: 'Commande exemple',
    state: 'Statut',
    dialog: 'Ouvrir la boîte de dialogue',
    dialogTitle: 'Confirmer l’action',
    dialogDescription: 'Vérifiez les détails de la commande avant de continuer.',
    drawer: 'Ouvrir le panneau',
    panel: 'Détails de la commande',
    tooltip: 'Cette action conserve la commande dans la boutique.',
    notify: 'Afficher la notification',
    toastTitle: 'Modifications enregistrées',
    toastDescription: 'Les détails de la commande ont été mis à jour.',
    empty: 'État vide',
    loading: 'Chargement des lignes',
    details: 'Détails',
    activity: 'Activité',
    status: 'Statut',
    selectRow: 'Sélectionner',
    selectedRows: 'Lignes sélectionnées',
    selectAll: 'Tout sélectionner',
    dismiss: 'Fermer la notification',
    storyDescription: 'Composants en clair, sombre, LTR et RTL.',
    invalidValue: 'Saisissez une valeur valide pour continuer.',
  },
  ar: {
    controls: 'عناصر التحكم',
    button: 'إنشاء طلب',
    saving: 'جارٍ الحفظ…',
    secondary: 'إلغاء',
    search: 'ابحث عن طريقة التوصيل',
    noResults: 'لا توجد طريقة توصيل مطابقة.',
    emptyTitle: 'لا توجد طلبات بعد',
    emptyDescription: 'ستظهر الطلبات الجديدة هنا بعد إضافتها إلى المتجر.',
    create: 'إضافة طلب',
    date: 'تاريخ التوصيل',
    phone: 'هاتف المشتري',
    deliveryType: 'طريقة التوصيل',
    homeDelivery: 'توصيل إلى المنزل',
    stopDesk: 'نقطة استلام',
    wilaya: 'الولاية',
    commune: 'البلدية',
    wilayaPlaceholder: 'اختر ولاية',
    communePlaceholder: 'اختر بلدية',
    exampleAmount: 'مبلغ توضيحي',
    inTransit: 'قيد التوصيل',
    data: 'البيانات والحالة',
    order: 'طلب توضيحي',
    state: 'الحالة',
    dialog: 'فتح نافذة',
    dialogTitle: 'تأكيد الإجراء',
    dialogDescription: 'راجع تفاصيل الطلب قبل المتابعة.',
    drawer: 'فتح لوحة جانبية',
    panel: 'تفاصيل الطلب',
    tooltip: 'يبقي هذا الإجراء الطلب ضمن المتجر.',
    notify: 'إظهار إشعار',
    toastTitle: 'تم حفظ التغييرات',
    toastDescription: 'تم تحديث تفاصيل الطلب.',
    empty: 'حالة فارغة',
    loading: 'تحميل الصفوف',
    details: 'التفاصيل',
    activity: 'النشاط',
    status: 'الحالة',
    selectRow: 'اختيار',
    selectedRows: 'الصفوف المحددة',
    selectAll: 'تحديد كل الصفوف',
    dismiss: 'إغلاق الإشعار',
    storyDescription: 'مكونات بالوضع الفاتح والداكن وبالاتجاهين.',
    invalidValue: 'أدخل قيمة صحيحة للمتابعة.',
  },
};
