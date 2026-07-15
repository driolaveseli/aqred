/**
 * Flat translation dictionary.
 * Keys are the English source strings.
 * English is the fallback (key === value), so only other languages need entries.
 */
const T = {
  // ── Navigation groups ──────────────────────────────────────────────────────
  "Dashboard": {
    es: "Panel", fr: "Tableau de bord", de: "Dashboard", ar: "لوحة القيادة", pt: "Painel", sq: "Paneli",
  },
  "Management": {
    es: "Gestión", fr: "Gestion", de: "Verwaltung", ar: "الإدارة", pt: "Gerenciamento", sq: "Menaxhimi",
  },
  "Finance & Operations": {
    es: "Finanzas y Operaciones", fr: "Finance et Opérations", de: "Finanzen & Betrieb", ar: "المالية والعمليات", pt: "Finanças e Operações", sq: "Financat & Operacionet",
  },
  "Reports & Analytics": {
    es: "Informes y Análisis", fr: "Rapports et Analyses", de: "Berichte & Analysen", ar: "التقارير والتحليلات", pt: "Relatórios e Análises", sq: "Raporte & Analitikë",
  },
  "Administration": {
    es: "Administración", fr: "Administration", de: "Administration", ar: "الإدارة العامة", pt: "Administração", sq: "Administrimi",
  },

  // ── Navigation items ───────────────────────────────────────────────────────
  "Overview": {
    es: "Resumen", fr: "Vue d'ensemble", de: "Übersicht", ar: "نظرة عامة", pt: "Visão Geral", sq: "Pasqyrë",
  },
  "Activity Feed": {
    es: "Actividad", fr: "Fil d'activité", de: "Aktivitäten", ar: "سجل النشاط", pt: "Feed de Atividade", sq: "Aktiviteti",
  },
  "Employees": {
    es: "Empleados", fr: "Employés", de: "Mitarbeiter", ar: "الموظفون", pt: "Funcionários", sq: "Punonjësit",
  },
  "Customers": {
    es: "Clientes", fr: "Clients", de: "Kunden", ar: "العملاء", pt: "Clientes", sq: "Klientët",
  },
  "Products": {
    es: "Productos", fr: "Produits", de: "Produkte", ar: "المنتجات", pt: "Produtos", sq: "Produktet",
  },
  "Orders": {
    es: "Pedidos", fr: "Commandes", de: "Bestellungen", ar: "الطلبات", pt: "Pedidos", sq: "Porositë",
  },
  "Suppliers": {
    es: "Proveedores", fr: "Fournisseurs", de: "Lieferanten", ar: "الموردون", pt: "Fornecedores", sq: "Furnitorët",
  },
  "Inventory": {
    es: "Inventario", fr: "Inventaire", de: "Lager", ar: "المخزون", pt: "Estoque", sq: "Inventari",
  },
  "Sales": {
    es: "Ventas", fr: "Ventes", de: "Verkäufe", ar: "المبيعات", pt: "Vendas", sq: "Shitjet",
  },
  "Payments": {
    es: "Pagos", fr: "Paiements", de: "Zahlungen", ar: "المدفوعات", pt: "Pagamentos", sq: "Pagesat",
  },
  "Invoices": {
    es: "Facturas", fr: "Factures", de: "Rechnungen", ar: "الفواتير", pt: "Faturas", sq: "Faturat",
  },
  "Sales Reports": {
    es: "Informes de Ventas", fr: "Rapports de ventes", de: "Verkaufsberichte", ar: "تقارير المبيعات", pt: "Relatórios de Vendas", sq: "Raporte Shitjesh",
  },
  "Customer Reports": {
    es: "Informes de Clientes", fr: "Rapports clients", de: "Kundenberichte", ar: "تقارير العملاء", pt: "Relatórios de Clientes", sq: "Raporte Klientësh",
  },
  "Employee Reports": {
    es: "Informes de Empleados", fr: "Rapports employés", de: "Mitarbeiterberichte", ar: "تقارير الموظفين", pt: "Relatórios de Funcionários", sq: "Raporte Punonjësish",
  },
  "Revenue Analytics": {
    es: "Análisis de Ingresos", fr: "Analyse des revenus", de: "Umsatzanalyse", ar: "تحليل الإيرادات", pt: "Análise de Receita", sq: "Analitikë të Ardhurash",
  },
  "Staff": {
    es: "Personal", fr: "Personnel", de: "Personal", ar: "الموظفون", pt: "Pessoal", sq: "Stafi",
  },
  "User Management": {
    es: "Gestión de Usuarios", fr: "Gestion des utilisateurs", de: "Benutzerverwaltung", ar: "إدارة المستخدمين", pt: "Gerenciamento de Usuários", sq: "Menaxhimi i Përdoruesve",
  },
  "Roles & Permissions": {
    es: "Roles y Permisos", fr: "Rôles et permissions", de: "Rollen & Berechtigungen", ar: "الأدوار والصلاحيات", pt: "Funções e Permissões", sq: "Rolet & Lejet",
  },
  "System Logs": {
    es: "Registros del Sistema", fr: "Journaux système", de: "Systemprotokolle", ar: "سجلات النظام", pt: "Logs do Sistema", sq: "Regjistrat e Sistemit",
  },
  "Settings": {
    es: "Configuración", fr: "Paramètres", de: "Einstellungen", ar: "الإعدادات", pt: "Configurações", sq: "Cilësimet",
  },
  "Logout": {
    es: "Cerrar sesión", fr: "Déconnexion", de: "Abmelden", ar: "تسجيل الخروج", pt: "Sair", sq: "Dilni",
  },

  // ── Page titles / subtitles ────────────────────────────────────────────────
  "Dashboard Overview": {
    es: "Resumen del Panel", fr: "Vue d'ensemble", de: "Dashboard-Übersicht", ar: "نظرة عامة على لوحة القيادة", pt: "Visão Geral do Painel", sq: "Pasqyrë e Panelit",
  },
  "Monitor performance and manage transactions": {
    es: "Supervise el rendimiento y gestione transacciones", fr: "Suivez les performances et gérez les transactions", de: "Leistung überwachen und Transaktionen verwalten", ar: "راقب الأداء وأدر المعاملات", pt: "Monitore o desempenho e gerencie transações", sq: "Monitoroni performancën dhe menaxhoni transaksionet",
  },
  "Manage your team members and their information": {
    es: "Gestione los miembros de su equipo y su información", fr: "Gérez les membres de votre équipe et leurs informations", de: "Verwalten Sie Ihre Teammitglieder und deren Informationen", ar: "إدارة أعضاء فريقك ومعلوماتهم", pt: "Gerencie os membros da sua equipe e suas informações", sq: "Menaxhoni anëtarët e ekipit dhe informacionin e tyre",
  },
  "Manage your customer relationships and contact information": {
    es: "Gestione las relaciones con sus clientes", fr: "Gérez vos relations clients et leurs coordonnées", de: "Verwalten Sie Ihre Kundenbeziehungen", ar: "إدارة علاقات العملاء ومعلومات الاتصال", pt: "Gerencie seus relacionamentos com clientes", sq: "Menaxhoni marrëdhëniet me klientët dhe informacionin e kontaktit",
  },
  "Manage your product catalog and inventory levels": {
    es: "Gestione su catálogo de productos y niveles de inventario", fr: "Gérez votre catalogue produits et niveaux de stock", de: "Verwalten Sie Ihren Produktkatalog und Lagerbestand", ar: "إدارة كتالوج المنتجات ومستويات المخزون", pt: "Gerencie seu catálogo de produtos e níveis de estoque", sq: "Menaxhoni katalogun e produkteve dhe nivelet e inventarit",
  },
  "Track and manage all customer orders": {
    es: "Realice seguimiento y gestione todos los pedidos de clientes", fr: "Suivez et gérez toutes les commandes clients", de: "Verfolgen und verwalten Sie alle Kundenbestellungen", ar: "تتبع وإدارة جميع طلبات العملاء", pt: "Rastreie e gerencie todos os pedidos de clientes", sq: "Gjurmoni dhe menaxhoni të gjitha porositë e klientëve",
  },
  "Manage your supplier relationships, contacts, and product sources": {
    es: "Gestione las relaciones con proveedores y fuentes de productos", fr: "Gérez vos relations fournisseurs, contacts et sources produits", de: "Verwalten Sie Ihre Lieferantenbeziehungen", ar: "إدارة علاقات الموردين وجهات الاتصال", pt: "Gerencie seus relacionamentos com fornecedores", sq: "Menaxhoni marrëdhëniet me furnitorët, kontaktet dhe burimet e produkteve",
  },
  "Real-time stock levels — adjust quantities directly here": {
    es: "Niveles de stock en tiempo real — ajuste las cantidades aquí", fr: "Niveaux de stock en temps réel — ajustez les quantités ici", de: "Echtzeit-Lagerbestand — Mengen direkt hier anpassen", ar: "مستويات المخزون في الوقت الفعلي — اضبط الكميات هنا", pt: "Níveis de estoque em tempo real — ajuste as quantidades aqui", sq: "Nivelet e stokut në kohë reale — rregulloni sasitë drejtpërdrejt këtu",
  },
  "Track and manage all payment transactions": {
    es: "Realice seguimiento y gestione todas las transacciones de pago", fr: "Suivez et gérez toutes les transactions de paiement", de: "Verfolgen und verwalten Sie alle Zahlungstransaktionen", ar: "تتبع وإدارة جميع المعاملات المالية", pt: "Rastreie e gerencie todas as transações de pagamento", sq: "Gjurmoni dhe menaxhoni të gjitha transaksionet e pagesave",
  },
  "Invoices are generated automatically from Sales orders": {
    es: "Las facturas se generan automáticamente desde los pedidos de ventas", fr: "Les factures sont générées automatiquement à partir des commandes", de: "Rechnungen werden automatisch aus Verkaufsaufträgen erstellt", ar: "يتم إنشاء الفواتير تلقائيًا من طلبات المبيعات", pt: "As faturas são geradas automaticamente a partir dos pedidos de vendas", sq: "Faturat gjenerohen automatikisht nga porositë e shitjeve",
  },
  "Generated automatically from Sales orders with at least one item": {
    es: "Generado automáticamente desde pedidos de ventas con al menos un artículo", fr: "Généré automatiquement à partir des commandes avec au moins un article", de: "Wird automatisch aus Verkaufsaufträgen mit mindestens einem Artikel generiert", ar: "يتم إنشاؤه تلقائيًا من طلبات المبيعات التي تحتوي على عنصر واحد على الأقل", pt: "Gerado automaticamente a partir de pedidos de vendas com pelo menos um item", sq: "Gjenerohet automatikisht nga porositë e shitjeve me të paktën një artikull",
  },
  "Live analytics from orders, payments, and customers": {
    es: "Análisis en tiempo real de pedidos, pagos y clientes", fr: "Analyses en direct des commandes, paiements et clients", de: "Live-Analysen aus Bestellungen, Zahlungen und Kunden", ar: "تحليلات مباشرة من الطلبات والمدفوعات والعملاء", pt: "Análises ao vivo de pedidos, pagamentos e clientes", sq: "Analitikë live nga porositë, pagesat dhe klientët",
  },
  "Live analytics from the Customers module — changes reflect immediately": {
    es: "Análisis en tiempo real del módulo Clientes", fr: "Analyses en direct du module Clients — les modifications se reflètent immédiatement", de: "Live-Analysen aus dem Kundenmodul", ar: "تحليلات مباشرة من وحدة العملاء", pt: "Análises ao vivo do módulo Clientes", sq: "Analitikë live nga moduli i Klientëve — ndryshimet pasqyrohen menjëherë",
  },
  "Complete customer activity linked to Orders, Invoices, and Payments": {
    es: "Actividad completa de clientes vinculada a Pedidos, Facturas y Pagos", fr: "Activité client complète liée aux commandes, factures et paiements", de: "Vollständige Kundenaktivität verknüpft mit Bestellungen, Rechnungen und Zahlungen", ar: "نشاط العميل الكامل المرتبط بالطلبات والفواتير والمدفوعات", pt: "Atividade completa de clientes vinculada a Pedidos, Faturas e Pagamentos", sq: "Aktiviteti i plotë i klientëve i lidhur me Porositë, Faturat dhe Pagesat",
  },
  "Workforce analytics based on current employee records": {
    es: "Análisis de plantilla basado en registros de empleados", fr: "Analyse des effectifs basée sur les dossiers employés actuels", de: "Personalanalyse basierend auf aktuellen Mitarbeiterdaten", ar: "تحليلات القوى العاملة بناءً على سجلات الموظفين", pt: "Análise da força de trabalho com base nos registros de funcionários", sq: "Analitikë e fuqisë punëtore bazuar në të dhënat e punonjësve",
  },
  "Manage team members, roles, and HR data in one place": {
    es: "Gestione miembros, roles y RRHH en un lugar", fr: "Gérez les membres, rôles et RH en un seul endroit", de: "Verwalten Sie Teammitglieder, Rollen und HR an einem Ort", ar: "إدارة أعضاء الفريق والأدوار وبيانات الموارد البشرية في مكان واحد", pt: "Gerencie membros, funções e RH em um só lugar", sq: "Menaxhoni anëtarët e ekipit, rolet dhe të dhënat HR në një vend",
  },
  "Manage team members, roles, HR data, and workforce analytics": {
    es: "Gestione personal, roles, RRHH y analítica de plantilla", fr: "Gérez le personnel, les rôles, les RH et l'analytique", de: "Verwalten Sie Personal, Rollen, HR und Personalanalyse", ar: "إدارة أعضاء الفريق والأدوار وبيانات الموارد البشرية وتحليلات القوى العاملة", pt: "Gerencie pessoal, funções, RH e análise de mão de obra", sq: "Menaxhoni anëtarët e ekipit, rolet, të dhënat HR dhe analitikën e fuqisë punëtore",
  },
  "Deep dive into revenue streams, profitability, and growth": {
    es: "Análisis profundo de ingresos, rentabilidad y crecimiento", fr: "Analyse approfondie des flux de revenus, rentabilité et croissance", de: "Eingehende Analyse von Einnahmequellen, Rentabilität und Wachstum", ar: "تحليل معمق لتدفقات الإيرادات والربحية والنمو", pt: "Análise aprofundada de fluxos de receita, lucratividade e crescimento", sq: "Analizë e thellë e burimeve të të ardhurave, rentabilitetit dhe rritjes",
  },
  "Track all system events and user actions in real-time": {
    es: "Rastree todos los eventos del sistema y acciones de usuario en tiempo real", fr: "Suivez tous les événements système et actions utilisateur en temps réel", de: "Verfolgen Sie alle Systemereignisse und Benutzeraktionen in Echtzeit", ar: "تتبع جميع أحداث النظام وإجراءات المستخدم في الوقت الفعلي", pt: "Rastreie todos os eventos do sistema e ações do usuário em tempo real", sq: "Gjurmoni të gjitha ngjarjet e sistemit dhe veprimet e përdoruesve në kohë reale",
  },
  "Audit trail for all system events — admin only": {
    es: "Registro de auditoría para todos los eventos del sistema — solo administradores", fr: "Piste d'audit pour tous les événements système — admin uniquement", de: "Prüfpfad für alle Systemereignisse — nur Admins", ar: "سجل تدقيق لجميع أحداث النظام — للمسؤولين فقط", pt: "Trilha de auditoria para todos os eventos do sistema — somente admin", sq: "Gjurmë auditimi për të gjitha ngjarjet e sistemit — vetëm admin",
  },
  "Manage system users, roles, and access": {
    es: "Gestione los usuarios del sistema, roles y acceso", fr: "Gérez les utilisateurs système, les rôles et les accès", de: "Verwalten Sie Systembenutzer, Rollen und Zugriffe", ar: "إدارة مستخدمي النظام والأدوار والوصول", pt: "Gerencie usuários do sistema, funções e acesso", sq: "Menaxhoni përdoruesit e sistemit, rolet dhe aksesin",
  },
  "Configure role-based access control for your team": {
    es: "Configure el control de acceso basado en roles para su equipo", fr: "Configurez le contrôle d'accès par rôles pour votre équipe", de: "Rollenbasierte Zugriffssteuerung für Ihr Team konfigurieren", ar: "تكوين التحكم في الوصول القائم على الأدوار لفريقك", pt: "Configure o controle de acesso baseado em funções para sua equipe", sq: "Konfiguroni kontrollin e aksesit bazuar në role për ekipin tuaj",
  },
  "Manage your account and system preferences": {
    es: "Gestione su cuenta y preferencias del sistema", fr: "Gérez votre compte et les préférences système", de: "Konto- und Systemeinstellungen verwalten", ar: "إدارة حسابك وتفضيلات النظام", pt: "Gerencie sua conta e preferências do sistema", sq: "Menaxhoni llogarinë dhe preferencat e sistemit",
  },

  // ── Settings tabs & section headers ───────────────────────────────────────
  "Profile": {
    es: "Perfil", fr: "Profil", de: "Profil", ar: "الملف الشخصي", pt: "Perfil", sq: "Profili",
  },
  "Notifications": {
    es: "Notificaciones", fr: "Notifications", de: "Benachrichtigungen", ar: "الإشعارات", pt: "Notificações", sq: "Njoftime",
  },
  "Security": {
    es: "Seguridad", fr: "Sécurité", de: "Sicherheit", ar: "الأمان", pt: "Segurança", sq: "Siguria",
  },
  "System": {
    es: "Sistema", fr: "Système", de: "System", ar: "النظام", pt: "Sistema", sq: "Sistemi",
  },
  "Profile Settings": {
    es: "Configuración de Perfil", fr: "Paramètres de profil", de: "Profileinstellungen", ar: "إعدادات الملف الشخصي", pt: "Configurações de Perfil", sq: "Cilësimet e Profilit",
  },
  "Notification Preferences": {
    es: "Preferencias de Notificación", fr: "Préférences de notification", de: "Benachrichtigungseinstellungen", ar: "تفضيلات الإشعارات", pt: "Preferências de Notificação", sq: "Preferencat e Njoftimeve",
  },
  "Change Password": {
    es: "Cambiar Contraseña", fr: "Changer le mot de passe", de: "Passwort ändern", ar: "تغيير كلمة المرور", pt: "Alterar Senha", sq: "Ndrysho Fjalëkalimin",
  },
  "Two-Factor Authentication": {
    es: "Autenticación de Dos Factores", fr: "Authentification à deux facteurs", de: "Zwei-Faktor-Authentifizierung", ar: "المصادقة الثنائية", pt: "Autenticação de Dois Fatores", sq: "Autentifikimi me Dy Faktorë",
  },
  "Session Settings": {
    es: "Configuración de Sesión", fr: "Paramètres de session", de: "Sitzungseinstellungen", ar: "إعدادات الجلسة", pt: "Configurações de Sessão", sq: "Cilësimet e Sesionit",
  },
  "System Preferences": {
    es: "Preferencias del Sistema", fr: "Préférences système", de: "Systemeinstellungen", ar: "تفضيلات النظام", pt: "Preferências do Sistema", sq: "Preferencat e Sistemit",
  },

  // ── Common actions / buttons ───────────────────────────────────────────────
  "Save Changes": {
    es: "Guardar Cambios", fr: "Enregistrer", de: "Änderungen speichern", ar: "حفظ التغييرات", pt: "Salvar Alterações", sq: "Ruaj Ndryshimet",
  },
  "Save Preferences": {
    es: "Guardar Preferencias", fr: "Enregistrer les préférences", de: "Einstellungen speichern", ar: "حفظ التفضيلات", pt: "Salvar Preferências", sq: "Ruaj Preferencat",
  },
  "Save Session Settings": {
    es: "Guardar Sesión", fr: "Enregistrer la session", de: "Sitzung speichern", ar: "حفظ إعدادات الجلسة", pt: "Salvar Sessão", sq: "Ruaj Cilësimet e Sesionit",
  },
  "Update Password": {
    es: "Actualizar Contraseña", fr: "Mettre à jour le mot de passe", de: "Passwort aktualisieren", ar: "تحديث كلمة المرور", pt: "Atualizar Senha", sq: "Përditëso Fjalëkalimin",
  },
  "Cancel": {
    es: "Cancelar", fr: "Annuler", de: "Abbrechen", ar: "إلغاء", pt: "Cancelar", sq: "Anulo",
  },
  "Add": {
    es: "Agregar", fr: "Ajouter", de: "Hinzufügen", ar: "إضافة", pt: "Adicionar", sq: "Shto",
  },
  "Edit": {
    es: "Editar", fr: "Modifier", de: "Bearbeiten", ar: "تعديل", pt: "Editar", sq: "Ndrysho",
  },
  "Delete": {
    es: "Eliminar", fr: "Supprimer", de: "Löschen", ar: "حذف", pt: "Excluir", sq: "Fshi",
  },
  "Remove": {
    es: "Eliminar", fr: "Supprimer", de: "Entfernen", ar: "إزالة", pt: "Remover", sq: "Hiq",
  },
  "Export CSV": {
    es: "Exportar CSV", fr: "Exporter CSV", de: "CSV exportieren", ar: "تصدير CSV", pt: "Exportar CSV", sq: "Eksporto CSV",
  },
  "Export": {
    es: "Exportar", fr: "Exporter", de: "Exportieren", ar: "تصدير", pt: "Exportar", sq: "Eksporto",
  },
  "Export Revenue": {
    es: "Exportar ingresos", fr: "Exporter revenus", de: "Umsatz exportieren", ar: "تصدير الإيرادات", pt: "Exportar receita", sq: "Eksporto të Ardhurat",
  },
  "Export Orders": {
    es: "Exportar pedidos", fr: "Exporter commandes", de: "Bestellungen exportieren", ar: "تصدير الطلبات", pt: "Exportar pedidos", sq: "Eksporto Porositë",
  },
  "Search": {
    es: "Buscar", fr: "Rechercher", de: "Suchen", ar: "بحث", pt: "Pesquisar", sq: "Kërko",
  },
  "Save": {
    es: "Guardar", fr: "Enregistrer", de: "Speichern", ar: "حفظ", pt: "Salvar", sq: "Ruaj",
  },
  "Close": {
    es: "Cerrar", fr: "Fermer", de: "Schließen", ar: "إغلاق", pt: "Fechar", sq: "Mbyll",
  },
  "Refresh": {
    es: "Actualizar", fr: "Actualiser", de: "Aktualisieren", ar: "تحديث", pt: "Atualizar", sq: "Rifresko",
  },
  "New Sale": {
    es: "Nueva Venta", fr: "Nouvelle vente", de: "Neuer Verkauf", ar: "بيع جديد", pt: "Nova Venda", sq: "Shitje e Re",
  },
  "New Order": {
    es: "Nuevo Pedido", fr: "Nouvelle commande", de: "Neue Bestellung", ar: "طلب جديد", pt: "Novo Pedido", sq: "Porosi e Re",
  },
  "Add Employee": {
    es: "Agregar Empleado", fr: "Ajouter un employé", de: "Mitarbeiter hinzufügen", ar: "إضافة موظف", pt: "Adicionar Funcionário", sq: "Shto Punonjës",
  },
  "Add Customer": {
    es: "Agregar Cliente", fr: "Ajouter un client", de: "Kunden hinzufügen", ar: "إضافة عميل", pt: "Adicionar Cliente", sq: "Shto Klient",
  },
  "Add Product": {
    es: "Agregar Producto", fr: "Ajouter un produit", de: "Produkt hinzufügen", ar: "إضافة منتج", pt: "Adicionar Produto", sq: "Shto Produkt",
  },
  "Add Order": {
    es: "Agregar Pedido", fr: "Ajouter une commande", de: "Bestellung hinzufügen", ar: "إضافة طلب", pt: "Adicionar Pedido", sq: "Shto Porosi",
  },
  "Add Supplier": {
    es: "Agregar Proveedor", fr: "Ajouter un fournisseur", de: "Lieferant hinzufügen", ar: "إضافة مورد", pt: "Adicionar Fornecedor", sq: "Shto Furnitor",
  },
  "Add Staff": {
    es: "Agregar Personal", fr: "Ajouter du personnel", de: "Personal hinzufügen", ar: "إضافة موظف", pt: "Adicionar Pessoal", sq: "Shto Staf",
  },
  "Add Staff Member": {
    es: "Agregar Miembro", fr: "Ajouter un membre", de: "Mitarbeiter hinzufügen", ar: "إضافة عضو", pt: "Adicionar Membro", sq: "Shto Anëtar Stafi",
  },
  "Add User": {
    es: "Agregar Usuario", fr: "Ajouter un utilisateur", de: "Benutzer hinzufügen", ar: "إضافة مستخدم", pt: "Adicionar Usuário", sq: "Shto Përdorues",
  },
  "Add Item": {
    es: "Agregar artículo", fr: "Ajouter article", de: "Artikel hinzufügen", ar: "إضافة عنصر", pt: "Adicionar item", sq: "Shto artikull",
  },
  "Record Payment": {
    es: "Registrar Pago", fr: "Enregistrer un paiement", de: "Zahlung erfassen", ar: "تسجيل دفع", pt: "Registrar Pagamento", sq: "Regjistro Pagesë",
  },
  "Invite User": {
    es: "Invitar Usuario", fr: "Inviter un utilisateur", de: "Benutzer einladen", ar: "دعوة مستخدم", pt: "Convidar Usuário", sq: "Fto Përdorues",
  },
  "Run Now": {
    es: "Ejecutar ahora", fr: "Exécuter maintenant", de: "Jetzt ausführen", ar: "تشغيل الآن", pt: "Executar Agora", sq: "Ekzekuto Tani",
  },
  "Create Order": {
    es: "Crear Pedido", fr: "Créer commande", de: "Bestellung erstellen", ar: "إنشاء طلب", pt: "Criar Pedido", sq: "Krijo Porosi",
  },
  "Create Sale": {
    es: "Crear Venta", fr: "Créer vente", de: "Verkauf erstellen", ar: "إنشاء بيع", pt: "Criar Venda", sq: "Krijo Shitje",
  },
  "Create User": {
    es: "Crear Usuario", fr: "Créer utilisateur", de: "Benutzer erstellen", ar: "إنشاء مستخدم", pt: "Criar Usuário", sq: "Krijo Përdorues",
  },
  "Update Stock": {
    es: "Actualizar Stock", fr: "Mettre à jour le stock", de: "Bestand aktualisieren", ar: "تحديث المخزون", pt: "Atualizar Estoque", sq: "Përditëso Stokun",
  },
  "Manage Products": {
    es: "Gestionar Productos", fr: "Gérer les produits", de: "Produkte verwalten", ar: "إدارة المنتجات", pt: "Gerenciar Produtos", sq: "Menaxho Produktet",
  },
  "Approve": {
    es: "Aprobar", fr: "Approuver", de: "Genehmigen", ar: "موافقة", pt: "Aprovar", sq: "Aprovo",
  },
  "Refund": {
    es: "Reembolsar", fr: "Rembourser", de: "Erstatten", ar: "استرداد", pt: "Reembolsar", sq: "Rimburso",
  },
  "Adjust": {
    es: "Ajustar", fr: "Ajuster", de: "Anpassen", ar: "ضبط", pt: "Ajustar", sq: "Rregulloj",
  },
  "Mark as Paid": {
    es: "Marcar como pagado", fr: "Marquer comme payé", de: "Als bezahlt markieren", ar: "وضع علامة كمدفوع", pt: "Marcar como pago", sq: "Shëno si të Paguar",
  },
  "Pay Balance": {
    es: "Pagar saldo", fr: "Payer le solde", de: "Restbetrag bezahlen", ar: "دفع الرصيد", pt: "Pagar saldo", sq: "Pago Balancën",
  },
  "Print / Save PDF": {
    es: "Imprimir / Guardar PDF", fr: "Imprimer / Enregistrer PDF", de: "Drucken / PDF speichern", ar: "طباعة / حفظ PDF", pt: "Imprimir / Salvar PDF", sq: "Printo / Ruaj PDF",
  },
  "Send Email": {
    es: "Enviar correo", fr: "Envoyer e-mail", de: "E-Mail senden", ar: "إرسال بريد", pt: "Enviar e-mail", sq: "Dërgo Email",
  },

  // ── Common table/form labels ───────────────────────────────────────────────
  "Actions": {
    es: "Acciones", fr: "Actions", de: "Aktionen", ar: "الإجراءات", pt: "Ações", sq: "Veprimet",
  },
  "Status": {
    es: "Estado", fr: "Statut", de: "Status", ar: "الحالة", pt: "Status", sq: "Statusi",
  },
  "Name": {
    es: "Nombre", fr: "Nom", de: "Name", ar: "الاسم", pt: "Nome", sq: "Emri",
  },
  "Email": {
    es: "Correo", fr: "E-mail", de: "E-Mail", ar: "البريد الإلكتروني", pt: "E-mail", sq: "Email",
  },
  "Phone": {
    es: "Teléfono", fr: "Téléphone", de: "Telefon", ar: "الهاتف", pt: "Telefone", sq: "Telefon",
  },
  "Date": {
    es: "Fecha", fr: "Date", de: "Datum", ar: "التاريخ", pt: "Data", sq: "Data",
  },
  "Amount": {
    es: "Monto", fr: "Montant", de: "Betrag", ar: "المبلغ", pt: "Valor", sq: "Shuma",
  },
  "Total": {
    es: "Total", fr: "Total", de: "Gesamt", ar: "الإجمالي", pt: "Total", sq: "Totali",
  },
  "All": {
    es: "Todos", fr: "Tous", de: "Alle", ar: "الكل", pt: "Todos", sq: "Të gjitha",
  },
  "Active": {
    es: "Activo", fr: "Actif", de: "Aktiv", ar: "نشط", pt: "Ativo", sq: "Aktiv",
  },
  "Inactive": {
    es: "Inactivo", fr: "Inactif", de: "Inaktiv", ar: "غير نشط", pt: "Inativo", sq: "Joaktiv",
  },
  "Loading...": {
    es: "Cargando...", fr: "Chargement...", de: "Laden...", ar: "جار التحميل...", pt: "Carregando...", sq: "Duke ngarkuar...",
  },

  // ── Table column headers ───────────────────────────────────────────────────
  "Customer": {
    es: "Cliente", fr: "Client", de: "Kunde", ar: "العميل", pt: "Cliente", sq: "Klienti",
  },
  "Contact": {
    es: "Contacto", fr: "Contact", de: "Kontakt", ar: "جهة الاتصال", pt: "Contato", sq: "Kontakti",
  },
  "Address": {
    es: "Dirección", fr: "Adresse", de: "Adresse", ar: "العنوان", pt: "Endereço", sq: "Adresa",
  },
  "Order ID": {
    es: "ID Pedido", fr: "ID commande", de: "Bestell-ID", ar: "رقم الطلب", pt: "ID Pedido", sq: "ID Porosisë",
  },
  "Payment ID": {
    es: "ID Pago", fr: "ID paiement", de: "Zahlungs-ID", ar: "رقم الدفعة", pt: "ID Pagamento", sq: "ID Pagesës",
  },
  "Items": {
    es: "Artículos", fr: "Articles", de: "Artikel", ar: "العناصر", pt: "Itens", sq: "Artikujt",
  },
  "Price": {
    es: "Precio", fr: "Prix", de: "Preis", ar: "السعر", pt: "Preço", sq: "Çmimi",
  },
  "Stock": {
    es: "Stock", fr: "Stock", de: "Bestand", ar: "المخزون", pt: "Estoque", sq: "Stoku",
  },
  "Category": {
    es: "Categoría", fr: "Catégorie", de: "Kategorie", ar: "الفئة", pt: "Categoria", sq: "Kategoria",
  },
  "Position": {
    es: "Cargo", fr: "Poste", de: "Position", ar: "المنصب", pt: "Cargo", sq: "Pozicioni",
  },
  "Department": {
    es: "Departamento", fr: "Département", de: "Abteilung", ar: "القسم", pt: "Departamento", sq: "Departamenti",
  },
  "Salary": {
    es: "Salario", fr: "Salaire", de: "Gehalt", ar: "الراتب", pt: "Salário", sq: "Paga",
  },
  "Supplier": {
    es: "Proveedor", fr: "Fournisseur", de: "Lieferant", ar: "المورد", pt: "Fornecedor", sq: "Furnitori",
  },
  "Products Supplied": {
    es: "Productos suministrados", fr: "Produits fournis", de: "Gelieferte Produkte", ar: "المنتجات المورّدة", pt: "Produtos fornecidos", sq: "Produktet e Furnizuara",
  },
  "Invoice": {
    es: "Factura", fr: "Facture", de: "Rechnung", ar: "فاتورة", pt: "Fatura", sq: "Fatura",
  },
  "Balance": {
    es: "Saldo", fr: "Solde", de: "Saldo", ar: "الرصيد", pt: "Saldo", sq: "Bilanci",
  },
  "Issued": {
    es: "Emitido", fr: "Émis", de: "Ausgestellt", ar: "تاريخ الإصدار", pt: "Emitido", sq: "Lëshuar",
  },
  "Due Date": {
    es: "Fecha límite", fr: "Date d'échéance", de: "Fälligkeitsdatum", ar: "تاريخ الاستحقاق", pt: "Prazo", sq: "Data e Skadimit",
  },
  "Method": {
    es: "Método", fr: "Méthode", de: "Methode", ar: "الطريقة", pt: "Método", sq: "Metoda",
  },
  "Order / Invoice": {
    es: "Pedido / Factura", fr: "Commande / Facture", de: "Bestellung / Rechnung", ar: "الطلب / الفاتورة", pt: "Pedido / Fatura", sq: "Porosi / Faturë",
  },
  "Staff Member": {
    es: "Miembro del Personal", fr: "Membre du personnel", de: "Mitarbeiter", ar: "عضو الموظفين", pt: "Membro da Equipe", sq: "Anëtar i Stafit",
  },
  "System Role": {
    es: "Rol del Sistema", fr: "Rôle système", de: "Systemrolle", ar: "دور النظام", pt: "Função do Sistema", sq: "Roli i Sistemit",
  },
  "Reorder Point": {
    es: "Punto de Reorden", fr: "Point de réapprovisionnement", de: "Meldebestand", ar: "نقطة إعادة الطلب", pt: "Ponto de Reposição", sq: "Pika e Riporosisë",
  },
  "Unit Price": {
    es: "Precio Unitario", fr: "Prix unitaire", de: "Stückpreis", ar: "سعر الوحدة", pt: "Preço Unitário", sq: "Çmimi për njësi",
  },
  "Description": {
    es: "Descripción", fr: "Description", de: "Beschreibung", ar: "الوصف", pt: "Descrição", sq: "Përshkrimi",
  },
  "Product": {
    es: "Producto", fr: "Produit", de: "Produkt", ar: "المنتج", pt: "Produto", sq: "Produkti",
  },
  "Role": {
    es: "Rol", fr: "Rôle", de: "Rolle", ar: "الدور", pt: "Função", sq: "Roli",
  },
  "User": {
    es: "Usuario", fr: "Utilisateur", de: "Benutzer", ar: "المستخدم", pt: "Usuário", sq: "Përdoruesi",
  },
  "Created": {
    es: "Creado", fr: "Créé", de: "Erstellt", ar: "تاريخ الإنشاء", pt: "Criado", sq: "Krijuar",
  },
  "Rank": {
    es: "Rango", fr: "Rang", de: "Rang", ar: "الترتيب", pt: "Classificação", sq: "Renditja",
  },
  "Revenue": {
    es: "Ingresos", fr: "Revenus", de: "Umsatz", ar: "الإيرادات", pt: "Receita", sq: "Të ardhurat",
  },
  "Collected": {
    es: "Cobrado", fr: "Collecté", de: "Eingezogen", ar: "محصل", pt: "Coletado", sq: "Mbledhur",
  },
  "Outstanding": {
    es: "Pendiente", fr: "En attente", de: "Ausstehend", ar: "المستحق", pt: "Pendente", sq: "Papaguar",
  },
  "Since": {
    es: "Desde", fr: "Depuis", de: "Seit", ar: "منذ", pt: "Desde", sq: "Që prej",
  },
  "Qty": {
    es: "Cant.", fr: "Qté", de: "Menge", ar: "الكمية", pt: "Qtd.", sq: "Sasia",
  },

  // ── Form labels ────────────────────────────────────────────────────────────
  "Full Name": {
    es: "Nombre completo", fr: "Nom complet", de: "Vollständiger Name", ar: "الاسم الكامل", pt: "Nome completo", sq: "Emri i Plotë",
  },
  "Product Name": {
    es: "Nombre del producto", fr: "Nom du produit", de: "Produktname", ar: "اسم المنتج", pt: "Nome do produto", sq: "Emri i Produktit",
  },
  "Company Name": {
    es: "Nombre de empresa", fr: "Nom de l'entreprise", de: "Firmenname", ar: "اسم الشركة", pt: "Nome da empresa", sq: "Emri i Kompanisë",
  },
  "Contact Person": {
    es: "Persona de contacto", fr: "Personne de contact", de: "Ansprechpartner", ar: "جهة الاتصال", pt: "Pessoa de contato", sq: "Personi i Kontaktit",
  },
  "Location": {
    es: "Ubicación", fr: "Emplacement", de: "Standort", ar: "الموقع", pt: "Localização", sq: "Vendndodhja",
  },
  "Stock Quantity": {
    es: "Cantidad en stock", fr: "Quantité en stock", de: "Lagermenge", ar: "كمية المخزون", pt: "Quantidade em estoque", sq: "Sasia në Stok",
  },
  "Price (USD)": {
    es: "Precio (USD)", fr: "Prix (USD)", de: "Preis (USD)", ar: "السعر (USD)", pt: "Preço (USD)", sq: "Çmimi (USD)",
  },
  "Salary (USD)": {
    es: "Salario (USD)", fr: "Salaire (USD)", de: "Gehalt (USD)", ar: "الراتب (USD)", pt: "Salário (USD)", sq: "Paga (USD)",
  },
  "Employment Status": {
    es: "Estado laboral", fr: "Statut d'emploi", de: "Beschäftigungsstatus", ar: "حالة التوظيف", pt: "Status de emprego", sq: "Statusi i Punësimit",
  },
  "System Access": {
    es: "Acceso al sistema", fr: "Accès au système", de: "Systemzugang", ar: "وصول النظام", pt: "Acesso ao sistema", sq: "Aksesi i Sistemit",
  },
  "HR Details": {
    es: "Detalles de RRHH", fr: "Détails RH", de: "HR-Details", ar: "تفاصيل الموارد البشرية", pt: "Detalhes de RH", sq: "Detajet e Burimeve Njerëzore",
  },
  "Order Date": {
    es: "Fecha de pedido", fr: "Date de commande", de: "Bestelldatum", ar: "تاريخ الطلب", pt: "Data do pedido", sq: "Data e Porosisë",
  },
  "Notes": {
    es: "Notas", fr: "Notes", de: "Notizen", ar: "ملاحظات", pt: "Notas", sq: "Shënime",
  },
  "Password": {
    es: "Contraseña", fr: "Mot de passe", de: "Passwort", ar: "كلمة المرور", pt: "Senha", sq: "Fjalëkalimi",
  },
  "Order Total": {
    es: "Total del pedido", fr: "Total de la commande", de: "Bestellsumme", ar: "إجمالي الطلب", pt: "Total do pedido", sq: "Totali i Porosisë",
  },
  "New Stock Quantity": {
    es: "Nueva cantidad en stock", fr: "Nouvelle quantité en stock", de: "Neue Lagermenge", ar: "الكمية الجديدة في المخزون", pt: "Nova quantidade em estoque", sq: "Sasia e re në Stok",
  },
  "Issue Date": {
    es: "Fecha de emisión", fr: "Date d'émission", de: "Ausstellungsdatum", ar: "تاريخ الإصدار", pt: "Data de emissão", sq: "Data e Lëshimit",
  },
  "Bill To": {
    es: "Facturar a", fr: "Facturer à", de: "Rechnung an", ar: "الفاتورة إلى", pt: "Faturar para", sq: "Faturë për",
  },

  // ── Status labels ──────────────────────────────────────────────────────────
  "Pending": {
    es: "Pendiente", fr: "En attente", de: "Ausstehend", ar: "معلق", pt: "Pendente", sq: "Në pritje",
  },
  "Processing": {
    es: "Procesando", fr: "En cours", de: "In Bearbeitung", ar: "قيد المعالجة", pt: "Processando", sq: "Duke procesuar",
  },
  "Completed": {
    es: "Completado", fr: "Terminé", de: "Abgeschlossen", ar: "مكتمل", pt: "Concluído", sq: "Kompletuar",
  },
  "Cancelled": {
    es: "Cancelado", fr: "Annulé", de: "Storniert", ar: "ملغى", pt: "Cancelado", sq: "Anuluar",
  },
  "Shipped": {
    es: "Enviado", fr: "Expédié", de: "Versandt", ar: "مشحون", pt: "Enviado", sq: "Dërguar",
  },
  "Paid": {
    es: "Pagado", fr: "Payé", de: "Bezahlt", ar: "مدفوع", pt: "Pago", sq: "Paguar",
  },
  "Unpaid": {
    es: "No pagado", fr: "Non payé", de: "Unbezahlt", ar: "غير مدفوع", pt: "Não pago", sq: "Pa paguar",
  },
  "Overdue": {
    es: "Vencido", fr: "En retard", de: "Überfällig", ar: "متأخر", pt: "Vencido", sq: "I vonuar",
  },
  "Partially Paid": {
    es: "Parcialmente pagado", fr: "Partiellement payé", de: "Teilweise bezahlt", ar: "مدفوع جزئياً", pt: "Parcialmente pago", sq: "Paguar pjesërisht",
  },
  "Failed": {
    es: "Fallido", fr: "Échoué", de: "Fehlgeschlagen", ar: "فشل", pt: "Falhou", sq: "Dështuar",
  },
  "Refunded": {
    es: "Reembolsado", fr: "Remboursé", de: "Rückerstattet", ar: "مسترد", pt: "Reembolsado", sq: "Rimbursuar",
  },
  "In Stock": {
    es: "En stock", fr: "En stock", de: "Auf Lager", ar: "في المخزون", pt: "Em estoque", sq: "Në magazinë",
  },
  "Low Stock": {
    es: "Stock bajo", fr: "Stock faible", de: "Niedriger Bestand", ar: "مخزون منخفض", pt: "Estoque baixo", sq: "Stok i ulët",
  },
  "Out of Stock": {
    es: "Sin stock", fr: "Rupture de stock", de: "Ausverkauft", ar: "نفاد المخزون", pt: "Fora de estoque", sq: "Pa stok",
  },

  // ── KPI / Stat labels ──────────────────────────────────────────────────────
  "Total Customers": {
    es: "Total Clientes", fr: "Total clients", de: "Kunden gesamt", ar: "إجمالي العملاء", pt: "Total de Clientes", sq: "Gjithsej Klientë",
  },
  "Total Products": {
    es: "Total Productos", fr: "Total produits", de: "Produkte gesamt", ar: "إجمالي المنتجات", pt: "Total de Produtos", sq: "Gjithsej Produkte",
  },
  "Total Orders": {
    es: "Total Pedidos", fr: "Total commandes", de: "Bestellungen gesamt", ar: "إجمالي الطلبات", pt: "Total de Pedidos", sq: "Gjithsej Porosi",
  },
  "Total Suppliers": {
    es: "Total Proveedores", fr: "Total fournisseurs", de: "Lieferanten gesamt", ar: "إجمالي الموردين", pt: "Total de Fornecedores", sq: "Gjithsej Furnitorë",
  },
  "Total Staff": {
    es: "Personal Total", fr: "Personnel total", de: "Personal gesamt", ar: "إجمالي الموظفين", pt: "Total de Pessoal", sq: "Gjithsej Staf",
  },
  "Total Collected": {
    es: "Total Cobrado", fr: "Total collecté", de: "Gesamt eingenommen", ar: "إجمالي المحصل", pt: "Total Coletado", sq: "Gjithsej Mbledhur",
  },
  "Total Value": {
    es: "Valor Total", fr: "Valeur totale", de: "Gesamtwert", ar: "القيمة الإجمالية", pt: "Valor Total", sq: "Vlera Totale",
  },
  "Total Volume": {
    es: "Volumen Total", fr: "Volume total", de: "Gesamtvolumen", ar: "الحجم الإجمالي", pt: "Volume Total", sq: "Vëllimi Total",
  },
  "Total Items": {
    es: "Total Artículos", fr: "Total articles", de: "Artikel gesamt", ar: "إجمالي العناصر", pt: "Total de Itens", sq: "Gjithsej Artikuj",
  },
  "Total Revenue": {
    es: "Ingresos Totales", fr: "Revenus totaux", de: "Gesamtumsatz", ar: "إجمالي الإيرادات", pt: "Receita Total", sq: "Të ardhurat Totale",
  },
  "Total Users": {
    es: "Total Usuarios", fr: "Total utilisateurs", de: "Benutzer gesamt", ar: "إجمالي المستخدمين", pt: "Total de Usuários", sq: "Gjithsej Përdorues",
  },
  "Departments": {
    es: "Departamentos", fr: "Départements", de: "Abteilungen", ar: "الأقسام", pt: "Departamentos", sq: "Departamentet",
  },
  "Admins": {
    es: "Administradores", fr: "Administrateurs", de: "Administratoren", ar: "المسؤولون", pt: "Administradores", sq: "Administratorë",
  },
  "Managers": {
    es: "Gerentes", fr: "Gestionnaires", de: "Manager", ar: "المدراء", pt: "Gerentes", sq: "Menaxherë",
  },
  "Avg. Salary": {
    es: "Salario Prom.", fr: "Salaire moy.", de: "Durchsch. Gehalt", ar: "متوسط الراتب", pt: "Salário Méd.", sq: "Paga Mesatare",
  },
  "Avg. Order Value": {
    es: "Valor Prom. Pedido", fr: "Valeur moy. commande", de: "Durchsch. Bestellwert", ar: "متوسط قيمة الطلب", pt: "Valor Méd. Pedido", sq: "Vlera Mesatare e Porosisë",
  },
  "Active Customers": {
    es: "Clientes Activos", fr: "Clients actifs", de: "Aktive Kunden", ar: "العملاء النشطون", pt: "Clientes Ativos", sq: "Klientë Aktivë",
  },
  "Payments Collected": {
    es: "Pagos Cobrados", fr: "Paiements collectés", de: "Zahlungen eingegangen", ar: "المدفوعات المحصلة", pt: "Pagamentos Coletados", sq: "Pagesat e Mbledhura",
  },
  "Companies": {
    es: "Empresas", fr: "Sociétés", de: "Unternehmen", ar: "الشركات", pt: "Empresas", sq: "Kompanitë",
  },
  "Categories": {
    es: "Categorías", fr: "Catégories", de: "Kategorien", ar: "الفئات", pt: "Categorias", sq: "Kategoritë",
  },
  "Partially Paid (Due)": {
    es: "Pagado parcialmente (vencido)", fr: "Partiellement payé (dû)", de: "Teilweise bezahlt (fällig)", ar: "مدفوع جزئياً (مستحق)", pt: "Parcialmente pago (devido)", sq: "Paguar pjesërisht (i detyrueshëm)",
  },
  "Outstanding Balance": {
    es: "Saldo pendiente", fr: "Solde impayé", de: "Ausstehender Saldo", ar: "الرصيد المستحق", pt: "Saldo pendente", sq: "Bilanci i Papaguar",
  },
  "With Orders": {
    es: "Con pedidos", fr: "Avec commandes", de: "Mit Bestellungen", ar: "مع طلبات", pt: "Com pedidos", sq: "Me Porosi",
  },
  "Inactive / Pending": {
    es: "Inactivo / Pendiente", fr: "Inactif / En attente", de: "Inaktiv / Ausstehend", ar: "غير نشط / معلق", pt: "Inativo / Pendente", sq: "Joaktiv / Në pritje",
  },
  "Avg Revenue / Customer": {
    es: "Ingreso prom. / cliente", fr: "Revenu moy. / client", de: "Durchsch. Umsatz / Kunde", ar: "متوسط الإيراد / عميل", pt: "Receita méd. / cliente", sq: "Të ardhura mesatare / klient",
  },

  // ── View toggles ───────────────────────────────────────────────────────────
  "Table": {
    es: "Tabla", fr: "Tableau", de: "Tabelle", ar: "جدول", pt: "Tabela", sq: "Tabelë",
  },
  "Grid": {
    es: "Cuadrícula", fr: "Grille", de: "Raster", ar: "شبكة", pt: "Grade", sq: "Rrjetë",
  },

  // ── Date range filters ─────────────────────────────────────────────────────
  "This Month": {
    es: "Este mes", fr: "Ce mois", de: "Diesen Monat", ar: "هذا الشهر", pt: "Este mês", sq: "Këtë muaj",
  },
  "Last 3 Months": {
    es: "Últimos 3 meses", fr: "3 derniers mois", de: "Letzte 3 Monate", ar: "آخر 3 أشهر", pt: "Últimos 3 meses", sq: "3 muajt e fundit",
  },
  "This Year": {
    es: "Este año", fr: "Cette année", de: "Dieses Jahr", ar: "هذا العام", pt: "Este ano", sq: "Këtë vit",
  },
  "All Time": {
    es: "Todo el tiempo", fr: "Tout le temps", de: "Gesamte Zeit", ar: "كل الوقت", pt: "Todo o período", sq: "Gjithë kohën",
  },

  // ── Section / chart titles ─────────────────────────────────────────────────
  "Staff Management": {
    es: "Gestión de Personal", fr: "Gestion du personnel", de: "Personalmanagement", ar: "إدارة الموظفين", pt: "Gestão de Pessoal", sq: "Menaxhimi i Stafit",
  },
  "All Departments": {
    es: "Todos los departamentos", fr: "Tous les départements", de: "Alle Abteilungen", ar: "جميع الأقسام", pt: "Todos os departamentos", sq: "Të gjitha Departamentet",
  },
  "Staff by Department": {
    es: "Personal por departamento", fr: "Personnel par département", de: "Personal nach Abteilung", ar: "الموظفون حسب القسم", pt: "Pessoal por departamento", sq: "Stafi sipas Departamentit",
  },
  "Role Distribution": {
    es: "Distribución de roles", fr: "Répartition des rôles", de: "Rollenverteilung", ar: "توزيع الأدوار", pt: "Distribuição de funções", sq: "Shpërndarja e Roleve",
  },
  "Monthly Revenue": {
    es: "Ingresos mensuales", fr: "Revenus mensuels", de: "Monatlicher Umsatz", ar: "الإيرادات الشهرية", pt: "Receita mensal", sq: "Të ardhurat mujore",
  },
  "Orders per Month": {
    es: "Pedidos por mes", fr: "Commandes par mois", de: "Bestellungen pro Monat", ar: "الطلبات شهرياً", pt: "Pedidos por mês", sq: "Porosi për muaj",
  },
  "Top Products by Revenue": {
    es: "Principales productos por ingresos", fr: "Meilleurs produits par revenu", de: "Top-Produkte nach Umsatz", ar: "أفضل المنتجات حسب الإيرادات", pt: "Principais produtos por receita", sq: "Produktet kryesore sipas të ardhurave",
  },
  "Revenue by Category": {
    es: "Ingresos por categoría", fr: "Revenus par catégorie", de: "Umsatz nach Kategorie", ar: "الإيرادات حسب الفئة", pt: "Receita por categoria", sq: "Të ardhurat sipas kategorisë",
  },
  "All Staff": {
    es: "Todo el personal", fr: "Tout le personnel", de: "Gesamtes Personal", ar: "جميع الموظفين", pt: "Todo o pessoal", sq: "I gjithë Stafi",
  },
  "Invoice Preview": {
    es: "Vista previa de factura", fr: "Aperçu de la facture", de: "Rechnungsvorschau", ar: "معاينة الفاتورة", pt: "Pré-visualização da fatura", sq: "Pamja e Faturës",
  },
  "New Customers by Month": {
    es: "Nuevos clientes por mes", fr: "Nouveaux clients par mois", de: "Neue Kunden pro Monat", ar: "عملاء جدد شهرياً", pt: "Novos clientes por mês", sq: "Klientë të rinj sipas muajit",
  },
  "Collection Status": {
    es: "Estado de cobro", fr: "Statut de collecte", de: "Einzugsstatus", ar: "حالة التحصيل", pt: "Status de cobrança", sq: "Statusi i Mbledhjes",
  },
  "Revenue vs Collected — Top Customers": {
    es: "Ingresos vs Cobrado — Principales Clientes", fr: "Revenus vs Collecté — Meilleurs clients", de: "Umsatz vs Eingezogen — Top-Kunden", ar: "الإيرادات مقابل المحصل — أفضل العملاء", pt: "Receita vs Coletado — Melhores clientes", sq: "Të ardhurat vs Mbledhur — Klientët kryesorë",
  },
  "Top Customers by Revenue": {
    es: "Principales clientes por ingresos", fr: "Meilleurs clients par revenu", de: "Top-Kunden nach Umsatz", ar: "أفضل العملاء حسب الإيرادات", pt: "Principais clientes por receita", sq: "Klientët kryesorë sipas të ardhurave",
  },
  "All Customers — Financial Summary": {
    es: "Todos los clientes — Resumen financiero", fr: "Tous les clients — Résumé financier", de: "Alle Kunden — Finanzübersicht", ar: "جميع العملاء — الملخص المالي", pt: "Todos os clientes — Resumo financeiro", sq: "Të gjithë klientët — Përmbledhje financiare",
  },

  // ── Empty states ───────────────────────────────────────────────────────────
  "No customers found": {
    es: "No se encontraron clientes", fr: "Aucun client trouvé", de: "Keine Kunden gefunden", ar: "لا يوجد عملاء", pt: "Nenhum cliente encontrado", sq: "Nuk u gjet asnjë klient",
  },
  "No products found": {
    es: "No se encontraron productos", fr: "Aucun produit trouvé", de: "Keine Produkte gefunden", ar: "لا توجد منتجات", pt: "Nenhum produto encontrado", sq: "Nuk u gjet asnjë produkt",
  },
  "No orders found": {
    es: "No se encontraron pedidos", fr: "Aucune commande trouvée", de: "Keine Bestellungen gefunden", ar: "لا توجد طلبات", pt: "Nenhum pedido encontrado", sq: "Nuk u gjet asnjë porosi",
  },
  "No suppliers found": {
    es: "No se encontraron proveedores", fr: "Aucun fournisseur trouvé", de: "Keine Lieferanten gefunden", ar: "لا يوجد موردون", pt: "Nenhum fornecedor encontrado", sq: "Nuk u gjet asnjë furnitor",
  },
  "No staff members found": {
    es: "No se encontraron miembros del personal", fr: "Aucun membre du personnel trouvé", de: "Keine Mitarbeiter gefunden", ar: "لا يوجد موظفون", pt: "Nenhum membro encontrado", sq: "Nuk u gjet asnjë anëtar stafi",
  },
  "No inventory items found": {
    es: "No se encontraron artículos en inventario", fr: "Aucun article d'inventaire trouvé", de: "Keine Inventarartikel gefunden", ar: "لا توجد عناصر في المخزون", pt: "Nenhum item de inventário encontrado", sq: "Nuk u gjet asnjë artikull inventari",
  },
  "No data for selected period.": {
    es: "Sin datos para el período.", fr: "Aucune donnée pour la période.", de: "Keine Daten für den Zeitraum.", ar: "لا توجد بيانات للفترة المحددة.", pt: "Sem dados para o período.", sq: "Nuk ka të dhëna për periudhën e zgjedhur.",
  },
  "No payments match your filter.": {
    es: "Ningún pago coincide con el filtro.", fr: "Aucun paiement correspondant.", de: "Keine passenden Zahlungen.", ar: "لا توجد مدفوعات مطابقة.", pt: "Nenhum pagamento corresponde.", sq: "Asnjë pagesë nuk përputhet me filtrin.",
  },
  "No payments yet. Record one or mark an invoice as paid.": {
    es: "Sin pagos aún. Registre uno o marque una factura como pagada.", fr: "Pas encore de paiements. Enregistrez-en un ou marquez une facture comme payée.", de: "Noch keine Zahlungen. Erfassen Sie eine oder markieren Sie eine Rechnung als bezahlt.", ar: "لا توجد مدفوعات بعد. سجل دفعة أو ضع علامة على فاتورة كمدفوعة.", pt: "Nenhum pagamento ainda. Registre um ou marque uma fatura como paga.", sq: "Ende asnjë pagesë. Regjistro një ose shëno një faturë si të paguar.",
  },
  "No invoices yet — create a Sales order with products first.": {
    es: "Sin facturas aún — cree un pedido de ventas primero.", fr: "Pas encore de factures — créez d'abord une commande.", de: "Noch keine Rechnungen — erstellen Sie zuerst einen Verkaufsauftrag.", ar: "لا توجد فواتير بعد — أنشئ طلب مبيعات أولاً.", pt: "Nenhuma fatura ainda — crie primeiro um pedido de vendas.", sq: "Ende asnjë faturë — krijo fillimisht një porosi shitjesh me produkte.",
  },
  "No invoices match your filter.": {
    es: "Ninguna factura coincide con el filtro.", fr: "Aucune facture correspondante.", de: "Keine passenden Rechnungen.", ar: "لا توجد فواتير مطابقة.", pt: "Nenhuma fatura corresponde.", sq: "Asnjë faturë nuk përputhet me filtrin.",
  },
  "No orders for selected period.": {
    es: "No hay pedidos para el período seleccionado.", fr: "Aucune commande pour la période.", de: "Keine Bestellungen für den Zeitraum.", ar: "لا توجد طلبات للفترة المحددة.", pt: "Nenhum pedido para o período selecionado.", sq: "Asnjë porosi për periudhën e zgjedhur.",
  },
  "No staff yet": {
    es: "Sin personal aún", fr: "Pas encore de personnel", de: "Noch kein Personal", ar: "لا يوجد موظفون بعد", pt: "Nenhum pessoal ainda", sq: "Ende asnjë staf",
  },
  "No users found": {
    es: "No se encontraron usuarios", fr: "Aucun utilisateur trouvé", de: "Keine Benutzer gefunden", ar: "لا يوجد مستخدمون", pt: "Nenhum usuário encontrado", sq: "Nuk u gjet asnjë përdorues",
  },

  // ── Misc ───────────────────────────────────────────────────────────────────
  "units": {
    es: "unidades", fr: "unités", de: "Einheiten", ar: "وحدات", pt: "unidades", sq: "njësi",
  },
  "Subtotal": {
    es: "Subtotal", fr: "Sous-total", de: "Zwischensumme", ar: "المجموع الفرعي", pt: "Subtotal", sq: "Nëntotali",
  },
  "Tax (0%)": {
    es: "Impuesto (0%)", fr: "Taxe (0%)", de: "Steuer (0%)", ar: "الضريبة (0%)", pt: "Imposto (0%)", sq: "Tatimi (0%)",
  },
  "Balance Due": {
    es: "Saldo pendiente", fr: "Solde dû", de: "Ausstehender Betrag", ar: "المبلغ المستحق", pt: "Saldo devido", sq: "Bilanci i Detyrimit",
  },
  "Amount Paid": {
    es: "Monto pagado", fr: "Montant payé", de: "Bezahlter Betrag", ar: "المبلغ المدفوع", pt: "Valor pago", sq: "Shuma e Paguar",
  },
  "Per transaction": {
    es: "Por transacción", fr: "Par transaction", de: "Pro Transaktion", ar: "لكل معاملة", pt: "Por transação", sq: "Për transaksion",
  },
  "records": {
    es: "registros", fr: "enregistrements", de: "Einträge", ar: "سجلات", pt: "registros", sq: "rekorde",
  },
  "This action cannot be undone.": {
    es: "Esta acción no se puede deshacer.", fr: "Cette action est irréversible.", de: "Diese Aktion kann nicht rückgängig gemacht werden.", ar: "لا يمكن التراجع عن هذا الإجراء.", pt: "Esta ação não pode ser desfeita.", sq: "Ky veprim nuk mund të kthehet mbrapsht.",
  },
  "Saving...": {
    es: "Guardando...", fr: "Enregistrement...", de: "Speichern...", ar: "جار الحفظ...", pt: "Salvando...", sq: "Duke ruajtur...",
  },
  "Loading sales data...": {
    es: "Cargando datos de ventas...", fr: "Chargement des ventes...", de: "Verkaufsdaten werden geladen...", ar: "جار تحميل بيانات المبيعات...", pt: "Carregando dados de vendas...", sq: "Duke ngarkuar të dhënat e shitjeve...",
  },
  "Loading payments...": {
    es: "Cargando pagos...", fr: "Chargement des paiements...", de: "Zahlungen werden geladen...", ar: "جار تحميل المدفوعات...", pt: "Carregando pagamentos...", sq: "Duke ngarkuar pagesat...",
  },
  "Loading invoices...": {
    es: "Cargando facturas...", fr: "Chargement des factures...", de: "Rechnungen werden geladen...", ar: "جار تحميل الفواتير...", pt: "Carregando faturas...", sq: "Duke ngarkuar faturat...",
  },
  "Loading report data...": {
    es: "Cargando datos del informe...", fr: "Chargement du rapport...", de: "Berichtsdaten werden geladen...", ar: "جار تحميل بيانات التقرير...", pt: "Carregando dados do relatório...", sq: "Duke ngarkuar të dhënat e raportit...",
  },
  "Loading customer data...": {
    es: "Cargando datos de clientes...", fr: "Chargement des données clients...", de: "Kundendaten werden geladen...", ar: "جار تحميل بيانات العملاء...", pt: "Carregando dados de clientes...", sq: "Duke ngarkuar të dhënat e klientëve...",
  },
  "Adjust Stock": {
    es: "Ajustar Stock", fr: "Ajuster le stock", de: "Bestand anpassen", ar: "تعديل المخزون", pt: "Ajustar Estoque", sq: "Rregulloj Stokun",
  },

  // ── Settings field labels ──────────────────────────────────────────────────
  "First Name": {
    es: "Nombre", fr: "Prénom", de: "Vorname", ar: "الاسم الأول", pt: "Nome", sq: "Emri",
  },
  "Last Name": {
    es: "Apellido", fr: "Nom de famille", de: "Nachname", ar: "الاسم الأخير", pt: "Sobrenome", sq: "Mbiemri",
  },
  "Email Address": {
    es: "Correo electrónico", fr: "Adresse e-mail", de: "E-Mail-Adresse", ar: "عنوان البريد الإلكتروني", pt: "Endereço de E-mail", sq: "Adresa Email",
  },
  "Company": {
    es: "Empresa", fr: "Société", de: "Unternehmen", ar: "الشركة", pt: "Empresa", sq: "Kompania",
  },
  "Timezone": {
    es: "Zona horaria", fr: "Fuseau horaire", de: "Zeitzone", ar: "المنطقة الزمنية", pt: "Fuso Horário", sq: "Zona Kohore",
  },
  "Language": {
    es: "Idioma", fr: "Langue", de: "Sprache", ar: "اللغة", pt: "Idioma", sq: "Gjuha",
  },
  "Currency": {
    es: "Moneda", fr: "Devise", de: "Währung", ar: "العملة", pt: "Moeda", sq: "Valuta",
  },
  "Date Format": {
    es: "Formato de Fecha", fr: "Format de date", de: "Datumsformat", ar: "تنسيق التاريخ", pt: "Formato de Data", sq: "Formati i Datës",
  },
  "Theme": {
    es: "Tema", fr: "Thème", de: "Design", ar: "المظهر", pt: "Tema", sq: "Tema",
  },
  "Light": {
    es: "Claro", fr: "Clair", de: "Hell", ar: "فاتح", pt: "Claro", sq: "E ndritur",
  },
  "Dark": {
    es: "Oscuro", fr: "Sombre", de: "Dunkel", ar: "داكن", pt: "Oscuro", sq: "E errët",
  },
  "Auto": {
    es: "Auto", fr: "Auto", de: "Auto", ar: "تلقائي", pt: "Auto", sq: "Auto",
  },
  "Current Password": {
    es: "Contraseña actual", fr: "Mot de passe actuel", de: "Aktuelles Passwort", ar: "كلمة المرور الحالية", pt: "Senha Atual", sq: "Fjalëkalimi Aktual",
  },
  "New Password": {
    es: "Nueva contraseña", fr: "Nouveau mot de passe", de: "Neues Passwort", ar: "كلمة المرور الجديدة", pt: "Nova Senha", sq: "Fjalëkalim i Ri",
  },
  "Confirm New Password": {
    es: "Confirmar nueva contraseña", fr: "Confirmer le nouveau mot de passe", de: "Neues Passwort bestätigen", ar: "تأكيد كلمة المرور الجديدة", pt: "Confirmar Nova Senha", sq: "Konfirmo Fjalëkalimin e Ri",
  },
  "Session Timeout": {
    es: "Tiempo de sesión", fr: "Délai de session", de: "Sitzungs-Timeout", ar: "مهلة الجلسة", pt: "Tempo de Sessão", sq: "Skadimi i Sesionit",
  },
  "Password Expiry": {
    es: "Caducidad de contraseña", fr: "Expiration du mot de passe", de: "Passwortablauf", ar: "انتهاء صلاحية كلمة المرور", pt: "Validade da Senha", sq: "Skadimi i Fjalëkalimit",
  },
  "Maintenance": {
    es: "Mantenimiento", fr: "Maintenance", de: "Wartung", ar: "الصيانة", pt: "Manutenção", sq: "Mirëmbajtja",
  },
  "Automatic Database Backup": {
    es: "Copia de seguridad automática", fr: "Sauvegarde automatique de la base de données", de: "Automatische Datenbanksicherung", ar: "النسخ الاحتياطي التلقائي", pt: "Backup Automático do Banco de Dados", sq: "Kopje Rezervë Automatike e Bazës së të Dhënave",
  },
  "Maintenance Mode": {
    es: "Modo de mantenimiento", fr: "Mode maintenance", de: "Wartungsmodus", ar: "وضع الصيانة", pt: "Modo de Manutenção", sq: "Modaliteti i Mirëmbajtjes",
  },
  "Email Notifications": {
    es: "Notificaciones por correo", fr: "Notifications par e-mail", de: "E-Mail-Benachrichtigungen", ar: "إشعارات البريد الإلكتروني", pt: "Notificações por E-mail", sq: "Njoftimet me Email",
  },
  "Browser Notifications": {
    es: "Notificaciones del navegador", fr: "Notifications navigateur", de: "Browser-Benachrichtigungen", ar: "إشعارات المتصفح", pt: "Notificações do Navegador", sq: "Njoftimet e Shfletuesit",
  },
  "Business Events": {
    es: "Eventos de negocio", fr: "Événements commerciaux", de: "Geschäftsereignisse", ar: "أحداث الأعمال", pt: "Eventos de Negócios", sq: "Ngjarjet e Biznesit",
  },

  // ── Language names (shown in the language selector) ────────────────────────
  "English": {
    es: "Inglés", fr: "Anglais", de: "Englisch", ar: "الإنجليزية", pt: "Inglês", sq: "Anglisht",
  },
  "Spanish": {
    es: "Español", fr: "Espagnol", de: "Spanisch", ar: "الإسبانية", pt: "Espanhol", sq: "Spanjisht",
  },
  "French": {
    es: "Francés", fr: "Français", de: "Französisch", ar: "الفرنسية", pt: "Français", sq: "Frëngjisht",
  },
  "German": {
    es: "Alemán", fr: "Allemand", de: "Deutsch", ar: "الألمانية", pt: "Alemão", sq: "Gjermanisht",
  },
  "Arabic": {
    es: "Árabe", fr: "Arabe", de: "Arabisch", ar: "العربية", pt: "Árabe", sq: "Arabisht",
  },
  "Portuguese": {
    es: "Portugués", fr: "Portugais", de: "Portugiesisch", ar: "البرتغالية", pt: "Português", sq: "Portugalisht",
  },
  "Albanian": {
    es: "Albanés", fr: "Albanais", de: "Albanisch", ar: "الألبانية", pt: "Albanês", sq: "Shqip",
  },

  // ── Staff / UserManagement misc strings ────────────────────────────────────
  "leave blank to keep": {
    es: "dejar en blanco para mantener", fr: "laisser vide pour conserver", de: "leer lassen zum Beibehalten", ar: "اتركه فارغاً للإبقاء", pt: "deixar em branco para manter", sq: "lë bosh për të mbajtur",
  },
  "No department data yet.": {
    es: "Sin datos de departamento aún.", fr: "Pas encore de données de département.", de: "Noch keine Abteilungsdaten.", ar: "لا توجد بيانات قسم بعد.", pt: "Sem dados de departamento ainda.", sq: "Ende asnjë të dhënë departamenti.",
  },
  "No data yet.": {
    es: "Sin datos aún.", fr: "Pas encore de données.", de: "Noch keine Daten.", ar: "لا توجد بيانات بعد.", pt: "Sem dados ainda.", sq: "Ende asnjë të dhënë.",
  },
  "Showing": {
    es: "Mostrando", fr: "Affichage de", de: "Zeige", ar: "عرض", pt: "Mostrando", sq: "Duke shfaqur",
  },
  "of": {
    es: "de", fr: "sur", de: "von", ar: "من", pt: "de", sq: "nga",
  },
  "staff members": {
    es: "miembros del personal", fr: "membres du personnel", de: "Mitarbeiter", ar: "أعضاء الفريق", pt: "membros da equipe", sq: "anëtarë stafi",
  },
  "Switch to Staff Management to add team members.": {
    es: "Cambia a Gestión de Personal para agregar miembros.", fr: "Passez à Gestion du personnel pour ajouter des membres.", de: "Wechseln Sie zu Personalverwaltung, um Mitglieder hinzuzufügen.", ar: "انتقل إلى إدارة الموظفين لإضافة أعضاء.", pt: "Alterne para Gestão de Funcionários para adicionar membros.", sq: "Kaloni te Menaxhimi i Stafit për të shtuar anëtarë.",
  },
  "Try a different search term": {
    es: "Intenta con otro término de búsqueda", fr: "Essayez un autre terme de recherche", de: "Versuchen Sie einen anderen Suchbegriff", ar: "جرب مصطلح بحث مختلف", pt: "Tente um termo de pesquisa diferente", sq: "Provo një term tjetër kërkimi",
  },
  "Click \"Add Staff\" to get started": {
    es: "Haz clic en \"Agregar Personal\" para comenzar", fr: "Cliquez sur \"Ajouter du personnel\" pour commencer", de: "Klicken Sie auf \"Personal hinzufügen\", um zu beginnen", ar: "انقر على \"إضافة موظف\" للبدء", pt: "Clique em \"Adicionar Funcionário\" para começar", sq: "Kliko \"Shto Staf\" për të filluar",
  },
  "Delete User?": {
    es: "¿Eliminar usuario?", fr: "Supprimer l'utilisateur ?", de: "Benutzer löschen?", ar: "حذف المستخدم؟", pt: "Excluir Usuário?", sq: "Fshi Përdoruesin?",
  },
  "users": {
    es: "usuarios", fr: "utilisateurs", de: "Benutzer", ar: "مستخدمون", pt: "usuários", sq: "përdorues",
  },
  "This will delete their system account and HR record. This cannot be undone.": {
    es: "Esto eliminará su cuenta del sistema y registro de RRHH. No se puede deshacer.", fr: "Cela supprimera leur compte système et leur dossier RH. Irréversible.", de: "Dies löscht ihr Systemkonto und HR-Datensatz. Nicht rückgängig zu machen.", ar: "سيؤدي هذا إلى حذف حسابهم والسجل الوظيفي. لا يمكن التراجع.", pt: "Isso excluirá a conta do sistema e o registro de RH. Não pode ser desfeito.", sq: "Kjo do të fshijë llogarinë dhe rekordin HR. Nuk mund të kthehet.",
  },
};

const LANG_CODES = {
  English: "en", Spanish: "es", French: "fr",
  German: "de", Arabic: "ar", Portuguese: "pt", Albanian: "sq",
};

/**
 * Translate a key into the target language.
 * Falls back to the key itself (which is the English string) if no translation exists.
 */
export const translate = (key, language) => {
  const lang = LANG_CODES[language] || "en";
  if (lang === "en") return key;
  return T[key]?.[lang] ?? key;
};

export const isRTL = (language) => language === "Arabic";
