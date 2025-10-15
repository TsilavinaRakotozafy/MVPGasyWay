# ✅ Système Dynamique : Nos Valeurs

## 🎯 Objectif

Permettre aux administrateurs de gérer dynamiquement les valeurs de l'entreprise (anciennement hardcodées : Écologie, Authenticité, Responsabilité, Humain) directement depuis l'interface admin.

---

## 📋 Fonctionnalités implémentées

### **✅ 1. Base de données**

**Fichier :** `/sql/add_company_values_column.sql`

**Action :**
- Ajoute une colonne `values` (type JSONB) à la table `company_info`
- Peuple avec les 4 valeurs par défaut de GasyWay
- Crée un index GIN pour performances
- Ajoute commentaire pour documentation

**Structure JSON :**
```json
[
  {
    "icon": "Leaf",
    "title": "Écologie",
    "description": "Préservation de la biodiversité..."
  },
  {
    "icon": "Handshake",
    "title": "Authenticité",
    "description": "Des expériences vraies..."
  }
]
```

---

### **✅ 2. Types TypeScript**

**Fichier :** `/supabase/functions/server/company-info.ts`

**Modifications :**
```typescript
export interface CompanyValue {
  icon: string;      // Nom de l'icône Lucide-React
  title: string;     // Titre de la valeur
  description: string; // Description
}

export interface CompanyInfo {
  // ... autres champs
  values?: CompanyValue[]; // ✅ NOUVEAU
}
```

---

### **✅ 3. Interface Admin - CRUD complet**

**Fichier :** `/components/admin/CompanyInfoManagement.tsx`

**Fonctionnalités ajoutées :**

#### **3.1 State Management**
```typescript
const [values, setValues] = useState<CompanyValue[]>([]);

const availableIcons = [
  { name: 'Leaf', label: 'Feuille (Écologie)' },
  { name: 'Handshake', label: 'Poignée de main (Partenariat)' },
  { name: 'Shield', label: 'Bouclier (Protection)' },
  { name: 'Heart', label: 'Cœur (Humain)' },
  { name: 'Target', label: 'Cible (Objectif)' },
  { name: 'Users', label: 'Utilisateurs (Communauté)' },
  { name: 'Award', label: 'Récompense (Excellence)' },
  { name: 'Star', label: 'Étoile (Qualité)' },
];
```

#### **3.2 Fonctions CRUD**
```typescript
const addValue = () => {
  setValues([...values, { icon: 'Star', title: '', description: '' }]);
};

const updateValue = (index: number, field: keyof CompanyValue, value: string) => {
  const newValues = [...values];
  newValues[index] = { ...newValues[index], [field]: value };
  setValues(newValues);
};

const deleteValue = (index: number) => {
  setValues(values.filter((_, i) => i !== index));
};

const moveValue = (index: number, direction: 'up' | 'down') => {
  // Réordonne les valeurs (flèches ↑ ↓)
};
```

#### **3.3 Interface utilisateur**
- **Bouton "Ajouter une valeur"** : Crée une nouvelle carte vide
- **Champs par carte :**
  - Select : Icône (8 choix disponibles)
  - Input : Titre
  - Textarea : Description
- **Actions par carte :**
  - Boutons ↑ ↓ : Réorganiser l'ordre
  - Bouton poubelle : Supprimer
  - Icône GripVertical : Indicateur visuel de drag (futur)

#### **3.4 Sauvegarde**
```typescript
const updates = {
  ...formData,
  values: values, // ✅ Inclus dans le payload de mise à jour
};
```

---

### **✅ 4. Affichage public dynamique**

**Fichier :** `/components/traveler/AboutPage.tsx`

**Modifications :**

#### **4.1 Map des icônes**
```typescript
const iconMap: Record<string, LucideIcon> = {
  Leaf,
  Handshake,
  Shield,
  Heart,
  Target,
  Users,
  Award,
  Star,
  Compass,
  Eye,
};
```

#### **4.2 Rendu dynamique**
**AVANT (hardcodé) :**
```tsx
<Card className="text-center">
  <CardContent className="p-6 space-y-4">
    <Leaf className="w-8 h-8 text-primary" />
    <h4>Écologie</h4>
    <p>Préservation de la biodiversité...</p>
  </CardContent>
</Card>
```

**APRÈS (dynamique) :**
```tsx
{companyInfo?.values && companyInfo.values.length > 0 && (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {companyInfo.values.map((value, index) => {
      const IconComponent = iconMap[value.icon] || Star;
      
      return (
        <Card key={index} className="text-center">
          <CardContent className="p-6 space-y-4">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto">
              <IconComponent className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h4 className="text-primary">{value.title}</h4>
              <p className="text-muted-foreground">{value.description}</p>
            </div>
          </CardContent>
        </Card>
      );
    })}
  </div>
)}
```

**Comportement :**
- Si `values` est vide → Aucune carte affichée
- Si `values` contient 2 éléments → 2 cards affichées
- Si `values` contient 10 éléments → 10 cards affichées (responsive)
- Icône par défaut : `Star` si l'icône n'existe pas dans `iconMap`

---

## 🚀 Guide d'utilisation

### **1️⃣ Exécuter le script SQL**

```sql
-- Dans Supabase SQL Editor
-- Copier/coller le contenu de /sql/add_company_values_column.sql
```

**Résultat attendu :**
```
✅ Colonne "values" ajoutée
✅ 4 valeurs par défaut insérées
✅ Index GIN créé
```

---

### **2️⃣ Accéder à l'interface admin**

**Chemin :** Menu admin → **"Infos Entreprise"**

**Section "Nos Valeurs" :**
- Affiche les valeurs existantes (4 par défaut après script SQL)
- Permet d'ajouter, modifier, supprimer, réorganiser

---

### **3️⃣ Gérer les valeurs**

#### **Ajouter une valeur**
1. Cliquer sur **"Ajouter une valeur"**
2. Remplir les champs :
   - **Icône** : Choisir dans la liste
   - **Titre** : Ex: "Innovation"
   - **Description** : Texte descriptif
3. Cliquer sur **"Enregistrer les modifications"**

#### **Modifier une valeur**
1. Modifier directement les champs dans la carte
2. Cliquer sur **"Enregistrer les modifications"**

#### **Supprimer une valeur**
1. Cliquer sur l'icône **poubelle** (🗑️)
2. Cliquer sur **"Enregistrer les modifications"**

#### **Réorganiser les valeurs**
1. Utiliser les flèches **↑** et **↓**
2. Cliquer sur **"Enregistrer les modifications"**

---

### **4️⃣ Vérifier sur la page publique**

**URL :** `/about`

**Résultat :**
- Les cards "Nos Valeurs" s'affichent sous "Mission & Vision"
- Grid responsive (1 col mobile → 4 cols desktop)
- Icônes, titres et descriptions dynamiques

---

## 🎨 Icônes disponibles

| Icône | Label | Usage recommandé |
|-------|-------|------------------|
| **Leaf** | Feuille | Écologie, environnement |
| **Handshake** | Poignée de main | Partenariat, authenticité |
| **Shield** | Bouclier | Sécurité, responsabilité |
| **Heart** | Cœur | Humain, bien-être |
| **Target** | Cible | Objectif, précision |
| **Users** | Utilisateurs | Communauté, équipe |
| **Award** | Récompense | Excellence, qualité |
| **Star** | Étoile | Qualité, succès |

**Note :** Pour ajouter une nouvelle icône :
1. Importer depuis `lucide-react` dans `AboutPage.tsx`
2. Ajouter dans `iconMap`
3. Ajouter dans `availableIcons` dans `CompanyInfoManagement.tsx`

---

## 📊 Structure de données

### **Table `company_info`**

```sql
CREATE TABLE company_info (
  id UUID PRIMARY KEY,
  -- ... autres colonnes
  values JSONB DEFAULT '[]'::jsonb, -- ✅ NOUVELLE COLONNE
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX idx_company_info_values 
ON company_info USING gin (values);
```

### **Exemple de données**

```json
{
  "id": "uuid-xxx",
  "contact_email": "contact@gasyway.mg",
  "values": [
    {
      "icon": "Leaf",
      "title": "Écologie",
      "description": "Préservation de la biodiversité exceptionnelle de Madagascar à travers un tourisme durable."
    },
    {
      "icon": "Handshake",
      "title": "Authenticité",
      "description": "Des expériences vraies, loin du tourisme de masse, au plus près des traditions malgaches."
    },
    {
      "icon": "Shield",
      "title": "Responsabilité",
      "description": "Impact positif sur les communautés locales avec une part équitable des revenus."
    },
    {
      "icon": "Heart",
      "title": "Humain",
      "description": "Connexion authentique entre voyageurs et habitants pour un échange culturel enrichissant."
    }
  ]
}
```

---

## 🔄 Cache et performance

### **Comportement du cache**

1. **Modification admin** → Cache `company_info` invalidé automatiquement
2. **Visiteur déjà sur la page** → Verra les nouvelles valeurs après 30 min OU après F5
3. **Nouveau visiteur** → Verra immédiatement les nouvelles valeurs

### **Invalidation manuelle**

```typescript
import { invalidateCompanyInfoCache } from '../../hooks/useCompanyInfo';

// Après sauvegarde admin
invalidateCompanyInfoCache();
```

---

## ✅ Checklist de vérification

Après modification des valeurs dans l'admin :

- [ ] Les valeurs sont sauvegardées dans Supabase
- [ ] Le cache est invalidé automatiquement
- [ ] La page "À propos" affiche les nouvelles valeurs après F5
- [ ] L'ordre des cards correspond à l'ordre dans l'admin
- [ ] Les icônes s'affichent correctement
- [ ] Le responsive fonctionne (mobile → desktop)
- [ ] Toutes les valeurs ont un titre et une description

---

## 🐛 Dépannage

### **Les valeurs ne s'affichent pas sur la page publique**

**Solution 1 : Vérifier Supabase**
```sql
SELECT id, jsonb_pretty(values) FROM company_info WHERE id = 1;
```

**Solution 2 : Vider le cache manuellement**
```javascript
localStorage.removeItem('gasyway_company_info');
// Puis recharger la page (F5)
```

**Solution 3 : Vérifier la console**
```javascript
// Ouvrir DevTools (F12)
// Rechercher les erreurs dans la console
```

---

### **Icône ne s'affiche pas**

**Cause :** L'icône n'existe pas dans `iconMap`

**Solution :**
1. Ouvrir `/components/traveler/AboutPage.tsx`
2. Ajouter l'import :
   ```typescript
   import { MonIcone } from "lucide-react";
   ```
3. Ajouter dans `iconMap` :
   ```typescript
   const iconMap: Record<string, LucideIcon> = {
     // ... autres icônes
     MonIcone,
   };
   ```

---

### **Les modifications ne se sauvegardent pas**

**Vérifier :**
1. Rôle admin : `SELECT role FROM users WHERE id = auth.uid();`
2. RLS policies : Les admins peuvent-ils UPDATE `company_info` ?
3. Console navigateur : Y a-t-il des erreurs ?

---

## 🎯 Améliorations futures possibles

### **1️⃣ Drag & Drop pour réorganiser**
Remplacer les flèches ↑ ↓ par un système de drag & drop visuel.

### **2️⃣ Prévisualisation en temps réel**
Afficher un aperçu de la card pendant l'édition.

### **3️⃣ Bibliothèque d'icônes étendue**
Ajouter toutes les icônes Lucide-React (300+).

### **4️⃣ Templates prédéfinis**
Proposer des ensembles de valeurs par secteur (Tourisme, Tech, etc.).

### **5️⃣ Upload d'icônes personnalisées**
Permettre l'upload d'icônes SVG personnalisées.

---

## 📝 Résumé technique

**Fichiers modifiés :**
- ✅ `/sql/add_company_values_column.sql` (NOUVEAU)
- ✅ `/supabase/functions/server/company-info.ts` (Type `CompanyValue` ajouté)
- ✅ `/components/admin/CompanyInfoManagement.tsx` (Interface CRUD)
- ✅ `/components/traveler/AboutPage.tsx` (Rendu dynamique)

**Fonctionnalités :**
- ✅ Ajouter/Modifier/Supprimer des valeurs
- ✅ Réorganiser l'ordre (↑ ↓)
- ✅ Choisir parmi 8 icônes prédéfinies
- ✅ Affichage dynamique sur page publique
- ✅ Cache optimisé (30 min TTL)
- ✅ Responsive design

**Migrations nécessaires :**
1. Exécuter `/sql/add_company_values_column.sql`
2. Redéployer l'application

---

**Système complet et opérationnel !** 🎉

Les valeurs de l'entreprise sont maintenant **100% dynamiques** et **éditables depuis l'interface admin**.
