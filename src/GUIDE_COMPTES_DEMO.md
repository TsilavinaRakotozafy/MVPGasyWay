# 🎯 Guide des Comptes de Démonstration - GasyWay

## 🚀 Configuration Rapide

### 1. **Accès Admin**
- Connectez-vous avec n'importe quel compte admin existant
- Allez dans **Système > Comptes Démo**
- Cliquez sur **"Configuration Complète Automatique"**

### 2. **Vérification**
- Les comptes seront automatiquement configurés
- Vérifiez l'état avec le bouton **"Vérifier"**

---

## 👥 Comptes de Démonstration

### 🧳 **Voyageur Demo**
```
Email: demo@voyageur.com
Mot de passe: demo123
Rôle: Voyageur
```
**Fonctionnalités disponibles :**
- Navigation du catalogue de packs
- Gestion du profil personnel
- Sélection des centres d'intérêt
- Ajout aux favoris
- Interface voyageur complète

### ⚙️ **Admin Demo**
```
Email: admin@gasyway.com
Mot de passe: admin123
Rôle: Administrateur
```
**Fonctionnalités disponibles :**
- Dashboard administrateur complet
- Gestion des centres d'intérêt
- Gestion des partenaires et packs
- Diagnostics système
- Gestion des utilisateurs

---

## 🛠️ Architecture Technique

### **Tables SQL Supabase**
```sql
users (comptes et authentification)
├── profiles (informations personnelles)
└── user_interests (centres d'intérêt sélectionnés)
    └── interests (catalogue des intérêts)
```

### **IDs Fixes pour la Démonstration**
- **Voyageur** : `a1b2c3d4-demo-user-0001-voyageur0001`
- **Admin** : `a1b2c3d4-demo-user-0001-admin0000001`

*Ces IDs fixes permettent la cohérence entre les tables SQL et l'authentification Supabase.*

---

## 🔧 Maintenance

### **Actions Disponibles**
1. **Initialiser SQL** : Crée les données dans les tables
2. **Créer Auth** : Configure les comptes d'authentification
3. **Configuration Complète** : Fait les deux automatiquement
4. **Réinitialiser** : Supprime et recrée tout

### **Diagnostic**
- **Système > Diagnostic SQL** : État des tables et données
- **Système > Comptes Démo** : État des comptes d'authentification

---

## ⚡ Actions Rapides

### **Si les comptes ne fonctionnent pas :**
1. Allez dans **Admin > Système > Comptes Démo**
2. Cliquez **"Configuration Complète Automatique"**
3. Attendez la confirmation
4. Testez la connexion

### **Pour réinitialiser complètement :**
1. **Système > Comptes Démo > Réinitialiser**
2. Confirmez l'action
3. Les comptes seront recréés automatiquement

---

## 📊 Données de Test Incluses

### **Centres d'Intérêt**
- Nature et Wildlife
- Culture et Histoire  
- Aventure et Trekking
- Plages et Détente
- Gastronomie Locale
- Photographie
- Artisanat et Shopping
- Sports Nautiques
- Écotourisme
- Villages Traditionnels

### **Profils Configurés**
- **Voyageur Demo** : Profil complet avec avatar, bio et 4 intérêts
- **Admin Demo** : Profil administrateur avec tous les accès

---

## 🚨 Important

⚠️ **Ces comptes sont uniquement pour les tests et démonstrations**

- Ils sont recréés automatiquement à chaque initialisation
- N'utilisez pas ces comptes pour des données de production
- Les mots de passe sont volontairement simples (demo123, admin123)

---

## 💡 Utilisation Recommandée

### **Pour les Développeurs**
1. Utilisez le compte admin pour tester les fonctionnalités de gestion
2. Utilisez le compte voyageur pour tester l'expérience utilisateur
3. Réinitialisez les comptes quand nécessaire

### **Pour les Démonstrations**
1. Commencez toujours par vérifier l'état des comptes
2. Présentez d'abord l'interface voyageur (plus intuitive)
3. Montrez ensuite le dashboard admin (fonctionnalités avancées)

---

*Dernière mise à jour : Septembre 2025*