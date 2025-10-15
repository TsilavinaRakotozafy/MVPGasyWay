# 🔧 Correctif : Erreur SQL UUID

## ❌ Problème

Lors de l'exécution du script `/sql/add_company_values_column.sql`, vous avez eu cette erreur :

```
ERROR: 42883: operator does not exist: uuid = integer
LINE 35: WHERE id = 1;
HINT: No operator matches the given name and argument types. You might need to add explicit type casts.
```

## 🔍 Cause

La colonne `id` de la table `company_info` est de type **UUID** (ex: `550e8400-e29b-41d4-a716-446655440000`), pas **INTEGER**.

Le script utilisait :
```sql
WHERE id = 1  -- ❌ ERREUR : 1 est un INTEGER, pas un UUID
```

## ✅ Solution appliquée

Le script a été corrigé pour utiliser :
```sql
WHERE is_active = true  -- ✅ CORRECT : Utilise le flag actif
```

Cette approche est **plus sûre** car :
- ✅ Pas besoin de connaître l'UUID exact
- ✅ Fonctionne quel que soit l'ID de l'enregistrement
- ✅ Cible automatiquement l'enregistrement actif

## 🚀 Exécution corrigée

### **Étape 1 : Copier le script corrigé**

Ouvrez le fichier `/sql/add_company_values_column.sql` et copiez **TOUT le contenu**.

### **Étape 2 : Exécuter dans Supabase**

1. Aller dans **Supabase Dashboard**
2. Section **"SQL Editor"**
3. **Coller** le script corrigé
4. Cliquer **"Run"**

### **Étape 3 : Vérifier le résultat**

Vous devriez voir :

```
✅ BEGIN
✅ ALTER TABLE
✅ UPDATE 1
✅ CREATE INDEX
✅ COMMENT
✅ COMMIT

Query result:
id | values_formatted | nb_values
---|------------------|----------
uuid-xxx | [{"icon":"Leaf"...}] | 4
```

---

## 🧪 Vérification manuelle

Si vous voulez vérifier que tout fonctionne, exécutez :

```sql
-- Vérifier que la colonne existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'company_info' AND column_name = 'values';

-- Résultat attendu :
-- column_name | data_type
-- values      | jsonb

-- Vérifier les données
SELECT 
  id, 
  jsonb_pretty(values) as values,
  jsonb_array_length(values) as nombre_valeurs
FROM company_info 
WHERE is_active = true;

-- Résultat attendu :
-- 4 valeurs JSON affichées
```

---

## 📋 Résumé

**Problème :** `WHERE id = 1` (UUID vs INTEGER)  
**Solution :** `WHERE is_active = true`  
**Fichier corrigé :** `/sql/add_company_values_column.sql` ✅

**Vous pouvez maintenant réexécuter le script !** 🎉
