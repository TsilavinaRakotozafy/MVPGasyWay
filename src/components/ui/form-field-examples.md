# FormField Components - Guide d'utilisation

## Composants disponibles

- `FormField` : Wrapper générique pour des cas personnalisés
- `InputField` : Champ de saisie text/number/email/etc.
- `TextareaField` : Zone de texte multilignes
- `SelectField` : Sélecteur avec options

## Espacement standardisé

Tous les composants utilisent automatiquement un espacement de **4px** (`space-y-1`) entre le label et le champ.

## Exemples d'utilisation

### InputField (champ obligatoire)
```tsx
<InputField
  label="Nom du centre d'intérêt"
  required
  value={formData.name}
  onChange={(value) => setFormData({ ...formData, name: value })}
  placeholder="Faune sauvage"
  error={errors.name}
/>
```

### TextareaField
```tsx
<TextareaField
  label="Description"
  required
  value={formData.description}
  onChange={(value) => setFormData({ ...formData, description: value })}
  placeholder="Décrivez ce centre d'intérêt..."
  rows={3}
  error={errors.description}
/>
```

### SelectField
```tsx
<SelectField
  label="Difficulté"
  value={formData.difficulty}
  onChange={(value) => setFormData({ ...formData, difficulty: value })}
  placeholder="Choisir une difficulté"
  options={[
    { value: 'easy', label: '🟢 Facile' },
    { value: 'medium', label: '🟡 Modéré' },
    { value: 'hard', label: '🔴 Difficile' }
  ]}
/>
```

### FormField (cas personnalisé)
```tsx
<FormField
  label="Icône"
  required
  error={errors.icon}
>
  <Input
    value={formData.icon}
    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
    placeholder="🦎"
  />
  <div className="grid grid-cols-8 gap-2 mt-2">
    {emojis.map((emoji) => (
      <button
        key={emoji}
        type="button"
        onClick={() => setFormData({ ...formData, icon: emoji })}
        className="p-2 rounded border hover:bg-gray-50"
      >
        {emoji}
      </button>
    ))}
  </div>
</FormField>
```

## Migration depuis l'ancienne approche

### Avant (répétitif)
```tsx
<div>
  <Label htmlFor="name" required>Nom du centre d'intérêt</Label>
  <Input
    id="name"
    value={formData.name}
    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
    placeholder="Faune sauvage"
    className="mt-1"
  />
  {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
</div>
```

### Après (simplifié)
```tsx
<InputField
  label="Nom du centre d'intérêt"
  required
  value={formData.name}
  onChange={(value) => setFormData({ ...formData, name: value })}
  placeholder="Faune sauvage"
  error={errors.name}
/>
```

## Avantages

✅ **Espacement standardisé** : 4px automatique entre label et champ  
✅ **Code simplifié** : Moins de répétition  
✅ **Gestion d'erreurs intégrée** : Affichage automatique des erreurs  
✅ **Astérisque rouge** : Champs requis marqués automatiquement  
✅ **Cohérence** : Design uniforme dans toute l'application  