# 🏢 Guide de Configuration : Système Company Info

## 📋 Vue d'ensemble

Le système **Company Info** permet de gérer centralement toutes les informations de l'entreprise affichées sur le site (page "À propos", footer, coordonnées, etc.).

### ✅ Fonctionnalités implémentées

1. **Table Supabase** : `company_info` avec toutes les métadonnées
2. **Endpoint serveur** : `/supabase/functions/server/company-info.ts`
3. **Hook avec cache** : `/hooks/useCompanyInfo.ts` (cache localStorage 30 min)
4. **Page admin** : Interface complète de gestion
5. **Page publique** : AboutPage utilise les données dynamiques

---

## 🚀 Installation (3 étapes)

### **Étape 1 : Créer la table Supabase**

1. Ouvrir **Supabase SQL Editor**
2. Exécuter le fichier `/sql/create_company_info_system.sql`
3. Vérifier que la table est créée avec 1 enregistrement initial

**Résultat attendu :**
```
✅ Table company_info créée
✅ RLS policies activées
✅ 1 enregistrement initial avec données GasyWay
```

---

### **Étape 2 : Accéder à la page admin**

1. Se connecter en tant qu'**admin**
2. Menu latéral → **Infos Entreprise**
3. Interface de gestion apparaît avec toutes les sections

---

### **Étape 3 : Modifier les informations**

Remplir les sections suivantes :

#### 📧 **Coordonnées**
- Email de contact
- Téléphone
- Adresse physique

#### 📄 **Textes de présentation**
- **Hero Section** : Titre + Description
- **Mission** : Titre + Description
- **Vision** : Titre + Description
- **Engagement** : Titre + Description

#### 🌐 **Réseaux sociaux**
- Facebook, Instagram, LinkedIn, Twitter/X
- WhatsApp Business

#### 🏛️ **Informations légales**
- Nom légal
- Numéro d'immatriculation
- Année de création
- Forme juridique

#### ⏰ **Horaires**
- Horaires d'ouverture
- Fuseau horaire
- Langues supportées (séparées par virgules)

---

## 🎯 Fonctionnement du cache

### **Architecture multi-niveaux**

```
┌─────────────────────────────────────────┐
│ 1️⃣ VÉRIFICATION LOCALSTORAGE (5ms)     │
│    Cache valide < 30 min ?              │
│    OUI → Affichage immédiat ✅          │
│    NON → Étape 2                        │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ 2️⃣ REQUÊTE SUPABASE (200-500ms)        │
│    Chargement depuis PostgreSQL         │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ 3️⃣ MISE EN CACHE (30 min)              │
│    Prochaine visite = 5ms ✅            │
└─────────────────────────────────────────┘
```

### **Invalidation du cache**

**Automatique** : Quand l'admin sauvegarde les modifications
- Le cache est vidé
- Les visiteurs verront les nouvelles données dans 30 min max
- OU immédiatement s'ils rechargent la page (F5)

**Manuelle** : Dans le code
```typescript
import { invalidateCompanyInfoCache } from '../../hooks/useCompanyInfo';

// Forcer l'invalidation
invalidateCompanyInfoCache();
```

---

## 📊 Données gérées

### **Coordonnées**
| Champ | Type | Utilisation | Affiché dans AboutPage |
|-------|------|-------------|------------------------|
| `contact_email` | TEXT | Footer, page contact, page "À propos" | ✅ Section Contact |
| `contact_phone` | TEXT | Footer, page contact, page "À propos" | ✅ Section Contact |
| `address` | TEXT | Footer, page contact, page "À propos" | ✅ Section Contact |

### **Textes de présentation**
| Champ | Type | Utilisation | Affiché dans AboutPage |
|-------|------|-------------|------------------------|
| `hero_title` | TEXT | Titre principal page "À propos" | ✅ Hero Section (haut de page) |
| `hero_description` | TEXT | Description hero section | ✅ Hero Section (haut de page) |
| `mission_title` | TEXT | Titre section mission | ✅ Section "Notre Mission" |
| `mission_description` | TEXT | Texte mission | ✅ Section "Notre Mission" |
| `vision_title` | TEXT | Titre section vision | ✅ Section "Notre Vision" |
| `vision_description` | TEXT | Texte vision | ✅ Section "Notre Vision" |
| `commitment_title` | TEXT | Titre section engagement | ✅ Section "Notre Engagement" |
| `commitment_description` | TEXT | Texte engagement | ✅ Section "Notre Engagement" |

### **Valeurs de l'entreprise** ⭐ NOUVEAU
| Champ | Type | Utilisation | Affiché dans AboutPage |
|-------|------|-------------|------------------------|
| `values` | JSONB | Array de valeurs éditables (icône, titre, description) | ✅ Section "Nos Valeurs" (cards sous Mission/Vision) |

**Structure `values` :**
```json
[
  {
    "icon": "Leaf",
    "title": "Écologie",
    "description": "Préservation de la biodiversité..."
  }
]
```

**Guide complet :** Voir `/COMPANY_VALUES_DYNAMIC_SYSTEM.md`

### **Réseaux sociaux**
| Champ | Type | Utilisation |
|-------|------|-------------|
| `facebook_url` | TEXT | Lien footer/header (optionnel) |
| `instagram_url` | TEXT | Lien footer/header (optionnel) |
| `linkedin_url` | TEXT | Lien footer/header (optionnel) |
| `twitter_url` | TEXT | Lien footer/header (optionnel) |
| `whatsapp_number` | TEXT | Lien WhatsApp Business (optionnel) |

### **Informations légales**
| Champ | Type | Utilisation |
|-------|------|-------------|
| `legal_name` | TEXT | Mentions légales |
| `registration_number` | TEXT | NIF/SIRET (mentions légales) |
| `founding_year` | INTEGER | Footer "© 2024 GasyWay" |
| `legal_form` | TEXT | Mentions légales (SARL, SAS, etc.) |

### **Horaires**
| Champ | Type | Utilisation |
|-------|------|-------------|
| `business_hours` | TEXT | Page contact, footer |
| `timezone` | TEXT | Informations pratiques |
| `supported_languages` | TEXT[] | Sélecteur de langue (futur) |

---

## 🔒 Sécurité (RLS Policies)

### **Lecture publique**
```sql
✅ Tout le monde peut lire les données actives
SELECT * FROM company_info WHERE is_active = TRUE
```

### **Modification admin uniquement**
```sql
✅ Seuls les admins peuvent modifier
UPDATE company_info ... WHERE user.role = 'admin'
```

---

## 🛠️ Utilisation dans le code

### **Hook dans un composant**

```tsx
import { useCompanyInfo } from '../../hooks/useCompanyInfo';

function MyComponent() {
  const { data: companyInfo, loading, error, refresh } = useCompanyInfo();

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur</div>;

  return (
    <div>
      {/* Hero Section */}
      <h1>{companyInfo?.hero_title || "Titre par défaut"}</h1>
      <p>{companyInfo?.hero_description || "Description par défaut"}</p>
      
      {/* Mission */}
      <h2>{companyInfo?.mission_title || "Notre Mission"}</h2>
      <p>{companyInfo?.mission_description || "Texte mission par défaut"}</p>
      
      {/* Vision */}
      <h2>{companyInfo?.vision_title || "Notre Vision"}</h2>
      <p>{companyInfo?.vision_description || "Texte vision par défaut"}</p>
      
      {/* Engagement */}
      <h2>{companyInfo?.commitment_title || "Notre Engagement"}</h2>
      <p>{companyInfo?.commitment_description || "Texte engagement par défaut"}</p>
      
      {/* Coordonnées */}
      <p>Email : {companyInfo?.contact_email || "contact@gasyway.mg"}</p>
      <p>Téléphone : {companyInfo?.contact_phone || "+261 34 XX XX XX XX"}</p>
      <p>Adresse : {companyInfo?.address || "Antananarivo, Madagascar"}</p>
    </div>
  );
}
```

### **Endpoint serveur (CRUD)**

```tsx
import { getCompanyInfo, updateCompanyInfo } from '../supabase/functions/server/company-info';
import { supabase } from '../utils/supabase/client';

// Lire les données
const { data, error } = await getCompanyInfo(supabase);

// Mettre à jour (admin uniquement)
const { data, error } = await updateCompanyInfo(supabase, {
  contact_email: 'nouveau@email.com',
  contact_phone: '+261 34 XX XX XX XX',
  hero_title: 'Nouveau titre'
});
```

---

## 📈 Performance

### **Métriques attendues**

| Scénario | Temps de chargement |
|----------|---------------------|
| **Première visite** | 200-500ms (Supabase) |
| **Visite suivante (cache valide)** | 5ms (localStorage) |
| **Après modification admin** | 200-500ms (cache invalidé) |

### **Optimisations actives**

1. ✅ **Cache localStorage** (30 min TTL)
2. ✅ **Invalidation automatique** après modification
3. ✅ **Fallbacks** pour données manquantes
4. ✅ **Chargement lazy** (pas de blocage au démarrage)

---

## 🐛 Dépannage

### **Problème : Les modifications ne s'affichent pas**

**Solution 1** : Vider le cache
```typescript
localStorage.removeItem('gasyway_company_info');
```

**Solution 2** : Recharger la page (F5)

**Solution 3** : Attendre 30 minutes (expiration cache automatique)

---

### **Problème : Erreur "No active company info found"**

**Cause** : Aucun enregistrement actif dans la table

**Solution** :
```sql
-- Vérifier les données
SELECT * FROM company_info;

-- Activer l'enregistrement si désactivé
UPDATE company_info SET is_active = TRUE WHERE id = 'xxx';
```

---

### **Problème : Les admins ne peuvent pas modifier**

**Cause** : RLS policy bloque l'accès

**Solution** :
```sql
-- Vérifier le rôle de l'utilisateur (GasyWay utilise la table "users")
SELECT id, email, role FROM users WHERE id = auth.uid();

-- Corriger si nécessaire
UPDATE users SET role = 'admin' WHERE id = 'xxx';
```

---

## 🔄 Migration vers Production

### **Étapes de déploiement**

1. **Exécuter le script SQL** sur Supabase Production
2. **Vérifier les RLS policies** activées
3. **Remplir les données** via l'interface admin
4. **Tester le cache** (vérifier localStorage)
5. **Activer Cloudflare** (optionnel, améliore cache edge)

### **Checklist pré-production**

- [ ] Script SQL exécuté sans erreur
- [ ] 1 enregistrement company_info créé
- [ ] RLS policies activées et testées
- [ ] Interface admin accessible
- [ ] Page "À propos" affiche les bonnes données
- [ ] Cache fonctionne (vérifier Network tab)
- [ ] Modifications admin se répercutent

---

## 📚 Fichiers du système

```
/sql/create_company_info_system.sql          # Script création table
/supabase/functions/server/company-info.ts   # Endpoint serveur
/hooks/useCompanyInfo.ts                     # Hook avec cache
/components/admin/CompanyInfoManagement.tsx  # Interface admin
/components/traveler/AboutPage.tsx           # Page publique (modifiée)
/types/index.ts                              # Type AdminPageType (modifié)
/components/core/AdminRouter.tsx             # Router admin (modifié)
/components/layout/AdminLayout.tsx           # Menu admin (modifié)
```

---

## ✅ Résumé

**Ce qui a été créé :**
1. ✅ Table Supabase avec RLS
2. ✅ Endpoint serveur CRUD
3. ✅ Hook React avec cache 30 min
4. ✅ Interface admin complète avec 6 sections (Coordonnées, Textes, **Valeurs**, Réseaux sociaux, Infos légales, Horaires)
5. ✅ Intégration AboutPage avec **8 champs dynamiques + valeurs** :
   - Hero Section (hero_title, hero_description)
   - Mission (mission_title, mission_description)
   - Vision (vision_title, vision_description)
   - Engagement (commitment_title, commitment_description)
   - **Valeurs (values array JSONB - éditable dynamiquement)** ⭐ NOUVEAU
   - Contact (contact_email, contact_phone, address)

**Performance :**
- 🚀 5ms après cache (vs 300-500ms sans cache)
- 🔄 Invalidation automatique après modification
- ⚡ Pas de blocage au démarrage

**Sécurité :**
- 🔒 RLS : lecture publique, modification admin uniquement
- ✅ Validation côté serveur
- 🛡️ Policies Supabase natives

---

**Prêt à être utilisé en production !** 🎉
