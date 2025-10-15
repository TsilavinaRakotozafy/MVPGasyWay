# GasyWay Design System Guidelines

## 🎨 Couleurs

### Couleurs principales
- **Primary (#0d4047)** : Actions principales, navigation, textes importants
- **Secondary (#c6e5de)** : Arrière-plans subtils, états hover, éléments secondaires  
- **Accent (#bcdc49)** : CTA importants, highlights, boutons d'action

### Tokens CSS disponibles
```css
/* Couleurs principales */
bg-primary, text-primary, border-primary
bg-primary-foreground, text-primary-foreground

/* Couleurs secondaires */
bg-secondary, text-secondary, border-secondary
bg-secondary-foreground, text-secondary-foreground

/* Couleurs système */
bg-muted, text-muted, bg-muted-foreground, text-muted-foreground
bg-accent, text-accent, bg-accent-foreground, text-accent-foreground
bg-destructive, text-destructive, text-destructive-foreground
bg-background, text-foreground
bg-card, text-card-foreground
```

### Usage des couleurs
- **INTERDICTION** : Ne jamais utiliser de couleurs hardcodées comme `bg-green-600`, `text-blue-500`, etc.
- **OBLIGATION** : Toujours utiliser les tokens CSS : `bg-primary`, `text-primary-foreground`, `bg-secondary`, etc.

## 📝 Typographie

### Font Family
- **Police principale** : Outfit (déjà importée dans globals.css)
- **INTERDICTION ABSOLUE** : Ne jamais spécifier `font-size`, `font-weight` ou `line-height` via Tailwind
- **RAISON** : Les styles sont automatiquement définis dans globals.css pour chaque élément HTML

### Hiérarchie typographique (AUTO-STYLÉE)
```tsx
// ✅ Styles automatiques via globals.css
<h1>Titre principal de page</h1>           // font-size: var(--text-2xl), font-weight: 500
<h2>Titre de section</h2>                  // font-size: var(--text-xl), font-weight: 500  
<h3>Sous-titre</h3>                        // font-size: var(--text-lg), font-weight: 500
<h4>Titre de carte/composant</h4>          // font-size: var(--text-base), font-weight: 500
<h5>Sous-composant</h5>                    // font-size: var(--text-sm), font-weight: 500
<h6>Détail/label/boutons/liens</h6>        // font-size: var(--text-xs), font-weight: 500
<p>Contenu standard</p>                    // font-size: var(--text-base), font-weight: 400
<label>Libellé de champ</label>            // font-size: var(--text-base), font-weight: 500
<button>Bouton</button>                    // font-size: var(--text-xs), font-weight: 500 (Style H6)
<a>Lien</a>                               // font-size: var(--text-xs), font-weight: 500 (Style H6)
```

### INTERDICTIONS strictes
- ❌ `text-2xl`, `text-xl`, `text-lg`, `text-base`, `text-sm`
- ❌ `font-bold`, `font-semibold`, `font-medium`, `font-normal`, `font-light`
- ❌ `leading-none`, `leading-tight`, `leading-normal`, `leading-relaxed`

## 🔘 Système de Boutons GasyWay

### Hiérarchie obligatoire (par ordre de priorité)

#### 1️⃣ **Bouton Primary** (Premier choix)
```tsx
// ✅ Pour toutes les actions principales
<Button>Action principale</Button>
<Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Action principale</Button>
```
**Usage :** Actions principales, navigation, submit de formulaires

#### 2️⃣ **Bouton Outline** (Deuxième choix)  
```tsx
// ✅ Pour les actions secondaires
<Button variant="outline">Action secondaire</Button>
<Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">Action secondaire</Button>
```
**Usage :** Actions secondaires, alternatives, boutons d'annulation

#### 3️⃣ **Bouton Accent** (Troisième choix - Accessibilité uniquement)
```tsx
// ⚠️ Utiliser UNIQUEMENT si Primary/Outline sont impossibles pour des raisons d'accessibilité
<Button variant="accent">CTA Important</Button>
<Button variant="accent" className="bg-accent hover:bg-accent/90 text-accent-foreground">CTA Important</Button>
```
**Usage :** Uniquement quand Primary/Outline ne fonctionnent pas (contraste insuffisant, lisibilité)

#### 4️⃣ **Bouton Destructive** (Actions destructives uniquement)
```tsx
// ✅ Uniquement pour supprimer/détruire
<Button variant="destructive">Supprimer</Button>
<Button variant="destructive">Annuler définitivement</Button>
```
**Usage :** Suppression, annulation définitive, actions irréversibles

#### 5️⃣ **Bouton Glass** (Images sombres uniquement)
```tsx
// ✅ Nouveau variant pour superposition sur images sombres
<Button variant="glass">Voir les destinations</Button>
<Button variant="glass" className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white hover:text-primary">Découvrir</Button>
```
**Usage :** Boutons superposés sur images sombres, hero sections avec backgrounds

### Tailles disponibles
```tsx
<Button size="sm">Petit</Button>      // h-8, espacement réduit
<Button size="default">Normal</Button>  // h-9, taille standard
<Button size="lg">Grand</Button>      // h-10, espacement augmenté
<Button size="icon">🔍</Button>       // 36x36px carré pour icônes
```

### Transitions et animations
Tous les boutons incluent automatiquement :
- `transition-all duration-200` (transition fluide 200ms)
- États hover avec opacité `/90`
- Focus visible avec ring
- États disabled avec `opacity-50`

## 📦 Composants Cards

### Structure recommandée
```tsx
// ✅ Card conforme au design system
<Card className="p-6 space-y-4">
  <CardHeader>
    <CardTitle>Titre automatiquement stylé</CardTitle>
    <CardDescription>Description automatiquement stylée</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Contenu automatiquement stylé</p>
  </CardContent>
</Card>
```

## 📋 Formulaires

### Standardisation des placeholders
**TOUS les placeholders utilisent la couleur `text-muted-foreground` du design system :**
- Input fields : `placeholder:text-muted-foreground`
- Textarea : `placeholder:text-muted-foreground`
- Select components : `data-[placeholder]:text-muted-foreground`
- Composants personnalisés : `text-muted-foreground`

### Inputs conformes
```tsx
// ✅ Input avec style automatique et placeholder standardisé
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>  {/* Style automatique */}
  <Input 
    id="email" 
    type="email" 
    placeholder="votre@email.com"  {/* Placeholder automatiquement en text-muted-foreground */}
    className="bg-input-background"  // Couleur définie dans le design system
  />
</div>
```

### Autres composants de formulaire
```tsx
// ✅ Textarea - placeholder automatiquement standardisé
<Textarea placeholder="Votre message..." />

// ✅ Select - placeholder automatiquement standardisé
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Choisir..." />  {/* Automatiquement en text-muted-foreground */}
  </SelectTrigger>
</Select>

// ✅ Composants personnalisés - utiliser text-muted-foreground
<SearchableDropdown placeholder="Rechercher..." />  {/* Couleur standardisée */}
<DateRangePicker placeholder="Ajouter des dates" />  {/* Couleur standardisée */}

// ✅ Checkbox & Radio
<Checkbox id="terms" />
<RadioGroup defaultValue="option1">
  <RadioGroupItem value="option1" id="option1" />
</RadioGroup>
```

## 🔗 Liens et Navigation

### Styles de liens
```tsx
// ✅ Lien principal
<Button variant="link" className="text-primary hover:text-primary/80">
  Lien principal
</Button>

// ✅ Lien dans le texte
<a href="#" className="text-primary hover:text-primary/80 underline">
  Lien dans le texte
</a>

// ✅ Lien muted
<a href="#" className="text-muted-foreground hover:text-foreground">
  Lien secondaire
</a>
```

## 📏 Espacements du système

### Règles d'espacement standardisées
```tsx
// ✅ Espacements entre composants
<div className="space-y-6">          // Espacement vertical entre éléments
<div className="space-x-4">          // Espacement horizontal

// ✅ Padding intérieur
<div className="p-6">               // Padding standard des cards
<div className="p-4">               // Padding réduit
<div className="p-8">               // Padding large

// ✅ Gaps pour Flexbox/Grid
<div className="flex gap-4">        // Gap standard
<div className="grid gap-6">        // Gap pour grilles
```

### Hiérarchie des espacements
- `gap-2` / `space-2` : 8px (éléments très proches)
- `gap-4` / `space-4` : 16px (éléments normaux)
- `gap-6` / `space-6` : 24px (sections)
- `gap-8` / `space-8` : 32px (grandes sections)

## 🎭 États et interactions

### États des composants
```tsx
// ✅ États hover conformes
<Button className="hover:bg-primary/90">     // Hover avec opacity
<Card className="hover:shadow-lg">           // Hover avec shadow

// ✅ États disabled
<Button disabled>Bouton désactivé</Button>   // Style automatique
<Input disabled />                           // Style automatique

// ✅ États focus
// Les focus states sont automatiquement gérés par le design system
```

## 📧 Formulaire Newsletter RGPD

### Implémentation conforme RGPD (obligatoire)

**IMPORTANT** : Tous les formulaires de newsletter doivent inclure une checkbox de consentement RGPD **NON cochée par défaut**.

```tsx
// ✅ Exemple conforme
const [email, setEmail] = useState("");
const [consentChecked, setConsentChecked] = useState(false); // NON coché par défaut

// Validation du consentement
const handleSubmit = async (e) => {
  if (!consentChecked) {
    toast.error("Veuillez accepter de recevoir nos communications");
    return;
  }
  
  // Stocker avec preuve RGPD
  await supabase.from('newsletter_subscribers').insert([{
    email: email.toLowerCase().trim(),
    consent_given: true,
    consent_date: new Date().toISOString(),
    consent_source: 'Homepage Newsletter Form',
    consent_text: "J'accepte de recevoir...",
    opted_in: true,
  }]);
};

// UI
<Checkbox
  id="newsletter-consent"
  checked={consentChecked}
  onCheckedChange={(checked) => setConsentChecked(checked === true)}
/>
<label htmlFor="newsletter-consent">
  J'accepte de recevoir les offres, actualités et conseils de voyage 
  de GasyWay par email. Je peux me désabonner à tout moment via le 
  lien présent dans chaque email.
</label>
<Button 
  onClick={handleSubmit} 
  disabled={!consentChecked} // Désactivé sans consentement
>
  S'abonner
</Button>
```

### ❌ INTERDIT : Checkbox pré-cochée
```tsx
// ❌ NON CONFORME RGPD
const [consentChecked, setConsentChecked] = useState(true); // Interdit !
```

### Texte légal minimum requis
Le texte doit être **clair, visible et explicite** sur :
- Ce qui sera envoyé (offres, actualités, etc.)
- Par quel moyen (email)
- Comment se désabonner (lien dans chaque email)

## 🚫 Interdictions strictes

### Couleurs
- ❌ `bg-green-600`, `bg-blue-500`, `bg-red-400`, `text-gray-500`, etc.
- ❌ Toute couleur Tailwind non définie dans le design system

### Typographie  
- ❌ `text-2xl`, `font-bold`, `leading-none`, etc.
- ❌ Styles de font personnalisés

### Espacements non-standard
- ❌ `p-3`, `p-5`, `gap-3`, `gap-5` (utiliser 2, 4, 6, 8)
- ❌ Marges négatives sans justification

## ✅ Template de page conforme

```tsx
// ✅ Page entièrement conforme au design system
function MyPage() {
  return (
    <div className="space-y-8 p-6">
      {/* Titre principal - style automatique */}
      <div className="space-y-2">
        <h1>Titre de la page</h1>
        <p className="text-muted-foreground">Description de la page</p>
      </div>

      {/* Section principale */}
      <Card className="p-6 space-y-6">
        <h2>Section importante</h2>
        
        <div className="space-y-4">
          <p>Contenu avec style automatique</p>
          
          {/* Formulaire conforme */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input id="name" placeholder="Votre nom" />
            </div>
          </div>
          
          {/* Boutons conformes */}
          <div className="flex gap-4">
            <Button>Action principale</Button>
            <Button variant="outline">Action secondaire</Button>
            <Button className="bg-[#bcdc49] hover:bg-[#bcdc49]/90 text-[#0d4047]">
              CTA spécial
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
```

## 🎯 Points clés à retenir

1. **Typographie** : JAMAIS de classes Tailwind de font, tout est automatique
2. **Couleurs** : TOUJOURS utiliser les tokens CSS du design system  
3. **Espacements** : Suivre la hiérarchie 2-4-6-8
4. **Composants** : Utiliser les composants UI existants
5. **Cohérence** : Chaque élément doit suivre ces règles sans exception