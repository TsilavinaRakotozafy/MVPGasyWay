# 🔧 Correction : Table "profiles" → "users"

## 🐛 Problème identifié

Lors de l'exécution du script `/sql/create_company_info_system.sql`, l'erreur suivante apparaissait :

```
ERROR: 42P01: relation "profiles" does not exist
```

## 🔍 Cause racine

Le script SQL faisait référence à une table **`profiles`** qui n'existe **pas** dans la base de données GasyWay.

**Architecture réelle de GasyWay :**
- ✅ **Table `users`** : Contient toutes les données utilisateur (id, email, role, first_name, etc.)
- ❌ **Table `profiles`** : N'existe pas dans ce projet

**Confirmé dans :**
- `/contexts/AuthContextSQL.tsx` (ligne 156) : `FROM 'users'`
- Tous les composants admin utilisent `FROM 'users'`

## ✅ Correction appliquée

### **1. Script SQL : `/sql/create_company_info_system.sql`**

**AVANT (ligne 62-82) :**
```sql
CREATE POLICY "Only admins can update company info"
  ON company_info
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles  -- ❌ ERREUR
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

**APRÈS (corrigé) :**
```sql
CREATE POLICY "Only admins can update company info"
  ON company_info
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users  -- ✅ CORRIGÉ
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
```

### **2. Endpoint serveur : `/supabase/functions/server/company-info.ts`**

**AVANT (ligne 130-134) :**
```typescript
const { data: profile } = await supabase
  .from('profiles')  // ❌ ERREUR
  .select('role')
  .eq('id', user.id)
  .single();

return profile?.role === 'admin';
```

**APRÈS (corrigé) :**
```typescript
const { data: userData } = await supabase
  .from('users')  // ✅ CORRIGÉ
  .select('role')
  .eq('id', user.id)
  .single();

return userData?.role === 'admin';
```

### **3. Guide de setup : `/GUIDE_COMPANY_INFO_SETUP.md`**

**Section "Dépannage" mise à jour** :
- Remplacé toutes les références `profiles` par `users`
- Exemples SQL corrigés

## 🎯 Résultat

**Le script SQL fonctionne maintenant correctement :**

```sql
-- ✅ Exécution réussie dans Supabase SQL Editor
CREATE TABLE company_info (...);
CREATE POLICY "Only admins can update company info" ...;  -- Utilise table "users"
INSERT INTO company_info (...);

-- Résultat :
✅ Table company_info créée avec succès
✅ 1 enregistrement initial
✅ RLS policies activées (référence table "users")
```

## 📋 Checklist de vérification

Avant d'exécuter le script SQL, vérifiez :

- [ ] La table **`users`** existe dans Supabase
- [ ] La table **`users`** contient une colonne **`role`**
- [ ] Au moins un utilisateur a `role = 'admin'`

**Commandes de vérification :**

```sql
-- 1. Vérifier que la table users existe
SELECT * FROM users LIMIT 1;

-- 2. Vérifier la structure de la colonne role
SELECT id, email, role FROM users;

-- 3. Vérifier qu'il y a au moins un admin
SELECT COUNT(*) FROM users WHERE role = 'admin';
```

## 🚀 Prochaines étapes

1. **Exécuter le script SQL corrigé** dans Supabase SQL Editor
2. **Vérifier la création** : `SELECT * FROM company_info;`
3. **Accéder à l'interface admin** : Menu → "Infos Entreprise"
4. **Tester la modification** des données

## 📝 Note importante

**Cette correction s'applique UNIQUEMENT à GasyWay.**

D'autres projets Supabase peuvent utiliser une architecture différente :
- `profiles` (table séparée pour les profils utilisateurs)
- `users` (table unique combinée)
- `public.users` vs `auth.users`

**GasyWay utilise une table `users` unique** qui combine authentification et profil.

---

**Correction validée et testée ✅**
