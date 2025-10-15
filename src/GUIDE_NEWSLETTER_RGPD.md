# 📧 Guide Newsletter RGPD - GasyWay

## ✅ Système implémenté

Le système de newsletter GasyWay est **100% conforme RGPD** et compatible avec **Mailchimp/Brevo/Sendinblue**.

---

## 🎯 Fonctionnalités

### 1️⃣ **Consentement RGPD obligatoire**
- ✅ Checkbox **NON cochée par défaut** (obligatoire légalement)
- ✅ Texte légal clair et transparent
- ✅ Bouton désactivé tant que la checkbox n'est pas cochée
- ✅ Message d'erreur si tentative d'envoi sans consentement

### 2️⃣ **Stockage sécurisé du consentement**
Chaque inscription enregistre :
- ✅ **Email** (unique, pas de doublons)
- ✅ **Date/heure exacte** du consentement
- ✅ **Source** du formulaire (`Homepage Newsletter Form`)
- ✅ **Texte du consentement** accepté
- ✅ **IP** (optionnel - à ajouter si besoin)
- ✅ **Statut** (opted_in = abonné actif)

### 3️⃣ **Protection contre les doublons**
- ✅ Contrainte d'unicité sur l'email
- ✅ Message clair si email déjà inscrit
- ✅ Pas de doublon dans la BDD

---

## 🗄️ Structure de la table `newsletter_subscribers`

```sql
newsletter_subscribers
├── id (UUID)
├── email (TEXT, UNIQUE)
├── consent_given (BOOLEAN)
├── consent_date (TIMESTAMPTZ)
├── consent_source (TEXT)
├── consent_text (TEXT)
├── ip_address (TEXT, optionnel)
├── opted_in (BOOLEAN)
├── subscription_date (TIMESTAMPTZ)
├── unsubscribed_at (TIMESTAMPTZ)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

---

## 🚀 Installation

### Étape 1 : Créer la table
```bash
# Dans Supabase SQL Editor, exécuter :
/sql/create_newsletter_subscribers_rgpd.sql
```

### Étape 2 : Vérifier l'installation
```sql
-- Vérifier que la table existe
SELECT * FROM newsletter_subscribers LIMIT 1;

-- Vérifier les statistiques
SELECT * FROM newsletter_stats;
```

---

## 📊 Utilisation Admin

### 🔍 **Consulter les abonnés**
```sql
SELECT 
  email,
  consent_date,
  consent_source,
  subscription_date,
  opted_in
FROM newsletter_subscribers
WHERE opted_in = true
ORDER BY subscription_date DESC;
```

### 📈 **Statistiques**
```sql
SELECT * FROM newsletter_stats;
```

Retourne :
- Total d'abonnés actifs
- Total de désabonnés
- Nouveaux abonnés (7 jours)
- Nouveaux abonnés (30 jours)
- Date du premier/dernier abonné

### 📤 **Exporter pour Mailchimp/Brevo**
```sql
-- Format CSV compatible
SELECT * FROM export_newsletter_subscribers();
```

### ❌ **Désabonner un utilisateur**
```sql
SELECT unsubscribe_from_newsletter('email@example.com');
```

### ✅ **Réabonner un utilisateur**
```sql
SELECT resubscribe_to_newsletter('email@example.com');
```

---

## 🛡️ Conformité RGPD

### ✅ **Preuves pour audit Mailchimp/Brevo**

Lorsque Mailchimp/Brevo demande "D'où viennent ces emails ?", vous pouvez fournir :

```sql
-- Preuve du consentement pour un email spécifique
SELECT 
  email,
  consent_date AS "Date du consentement",
  consent_source AS "Source",
  consent_text AS "Texte accepté",
  ip_address AS "IP",
  opted_in AS "Statut actif"
FROM newsletter_subscribers
WHERE email = 'email@example.com';
```

**Résultat exemple :**
```
email: utilisateur@gmail.com
Date du consentement: 2025-01-15 14:30:22+00
Source: Homepage Newsletter Form
Texte accepté: J'accepte de recevoir les offres, actualités et conseils de voyage de GasyWay par email.
IP: 192.168.1.1
Statut actif: true
```

### ✅ **Ce qui est conforme RGPD**
- ✅ Consentement **actif** (checkbox non cochée par défaut)
- ✅ Consentement **libre** (pas de case pré-cochée)
- ✅ Consentement **éclairé** (texte clair sur l'usage)
- ✅ Consentement **spécifique** (uniquement newsletter)
- ✅ Consentement **traçable** (date, source, texte, IP)
- ✅ Possibilité de se **désabonner** facilement

### ❌ **Ce qui n'est PAS conforme RGPD**
- ❌ Checkbox pré-cochée
- ❌ Pas de texte explicite
- ❌ Pas de date de consentement
- ❌ Pas de possibilité de désabonnement

---

## 🔧 Ajouter l'IP (optionnel mais recommandé)

Pour renforcer la preuve du consentement, vous pouvez capturer l'IP :

### Modifier `HomePage.tsx` :
```tsx
// Ajouter un état pour l'IP
const [userIP, setUserIP] = useState<string | null>(null);

// Récupérer l'IP au chargement
useEffect(() => {
  fetch('https://api.ipify.org?format=json')
    .then(res => res.json())
    .then(data => setUserIP(data.ip))
    .catch(err => console.error('Erreur IP:', err));
}, []);

// Dans handleNewsletterSubmit, ajouter :
const { data, error } = await supabase
  .from('newsletter_subscribers')
  .insert([
    {
      email: email.toLowerCase().trim(),
      consent_given: true,
      consent_date: new Date().toISOString(),
      consent_source: 'Homepage Newsletter Form',
      consent_text: "J'accepte de recevoir les offres...",
      ip_address: userIP, // ✅ Ajouter l'IP
      opted_in: true,
      subscription_date: new Date().toISOString(),
    }
  ]);
```

---

## 📧 Intégration Mailchimp/Brevo

### **Étape 1 : Exporter les abonnés**
```sql
SELECT email, consent_date, consent_source 
FROM export_newsletter_subscribers();
```

### **Étape 2 : Importer dans Mailchimp/Brevo**
1. Télécharger le CSV depuis Supabase
2. Aller dans Mailchimp/Brevo → Import Contacts
3. Upload le fichier CSV
4. Mapper les colonnes :
   - `email` → Email Address
   - `consent_date` → Consent Date
   - `consent_source` → Source

### **Étape 3 : Configurer le double opt-in (optionnel)**
- Mailchimp : Settings → Audience → Form Settings → Enable Double Opt-in
- Brevo : Contacts → Settings → Double opt-in

---

## 🆘 Questions fréquentes

### ❓ **La checkbox pré-cochée, c'est légal ?**
**NON.** Le RGPD interdit formellement les checkbox pré-cochées. Le consentement doit être une action **positive** de l'utilisateur.

### ❓ **Que se passe-t-il si l'utilisateur ne coche pas ?**
Le bouton reste désactivé et un message d'erreur s'affiche s'il clique dessus.

### ❓ **Combien de temps garder les données ?**
Le RGPD recommande de supprimer les emails inactifs après **3 ans sans interaction**. Vous pouvez créer un script automatique :

```sql
-- Supprimer les abonnés inactifs depuis plus de 3 ans
DELETE FROM newsletter_subscribers
WHERE 
  opted_in = false 
  AND unsubscribed_at < NOW() - INTERVAL '3 years';
```

### ❓ **Mailchimp/Brevo demande une preuve, que faire ?**
Fournissez les données de la table `newsletter_subscribers` avec les colonnes :
- `email`
- `consent_date`
- `consent_source`
- `consent_text`
- `ip_address` (si disponible)

Cela prouve que le consentement a été donné activement.

---

## ✅ Checklist finale

- [x] Table `newsletter_subscribers` créée
- [x] Checkbox RGPD implémentée (non cochée par défaut)
- [x] Texte légal clair et visible
- [x] Bouton désactivé sans consentement
- [x] Message d'erreur si pas de consentement
- [x] Stockage de la date/source/texte du consentement
- [x] Protection contre les doublons (email unique)
- [x] Fonction d'export pour Mailchimp/Brevo
- [x] Fonction de désabonnement
- [x] Statistiques accessibles
- [ ] Capturer l'IP (optionnel mais recommandé)
- [ ] Créer un email de bienvenue automatique
- [ ] Créer un email de désabonnement automatique

---

## 📚 Ressources utiles

- [RGPD - Consentement](https://www.cnil.fr/fr/rgpd-le-consentement)
- [Mailchimp - GDPR Compliance](https://mailchimp.com/help/about-the-general-data-protection-regulation/)
- [Brevo - RGPD](https://help.brevo.com/hc/fr/articles/360001005630)

---

## 🎉 C'est fait !

Votre système de newsletter est maintenant **100% conforme RGPD** et prêt pour Mailchimp/Brevo.

Les utilisateurs ne peuvent s'inscrire qu'en acceptant explicitement, et vous avez toutes les preuves nécessaires en cas d'audit. 🚀
