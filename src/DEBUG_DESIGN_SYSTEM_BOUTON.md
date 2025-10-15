# 🔍 Debug : Bouton "Copier le script SQL" invisible

## Étapes de diagnostic

### 1. Vérifiez que vous êtes sur la bonne page
- Allez dans **Admin → Design System**
- Vous devriez voir le titre "Design System" en haut

### 2. Ouvrez la console du navigateur
- Appuyez sur **F12** (ou Cmd+Option+I sur Mac)
- Allez dans l'onglet **Console**

### 3. Cherchez les logs de diagnostic
Vous devriez voir des logs comme :
```
🚀 [DesignSystemInitializer] Composant monté - Lancement du diagnostic
🔍 [DesignSystemInitializer] Démarrage du diagnostic...
🔍 [DesignSystemInitializer] URL appelée: https://...
🔍 [DesignSystemInitializer] Status HTTP: 404 (ou autre)
🔍 [DesignSystemInitializer] Réponse: {...}
```

### 4. Analysez le résultat

#### Si vous voyez :
```
✅ [DesignSystemInitializer] Design system opérationnel
```
➡️ **La table existe déjà !** Le bouton ne s'affiche pas car le système est déjà initialisé.
Vous devriez voir une alerte verte : "✅ Design system dynamique opérationnel"

#### Si vous voyez :
```
⚠️ [DesignSystemInitializer] Design system NON initialisé - Affichage du bouton
🔍 [DesignSystemInitializer] État diagnostic: {tableExists: false, ...}
```
➡️ **Le bouton devrait s'afficher !** Vous devriez voir :
- Une carte rouge avec le titre "Design system non initialisé"
- Un diagnostic détaillé
- **Un gros bouton jaune "Copier le script SQL"**

#### Si vous ne voyez aucun log
➡️ Le composant ne se charge pas. Vérifiez :
1. Que vous êtes bien connecté en admin
2. Que la route est bien `/admin/design-system`
3. Rechargez la page (Ctrl+R)

### 5. Que faire si le bouton ne s'affiche toujours pas ?

**Option 1 : Le système est déjà initialisé**
Si vous voyez l'alerte verte, la table existe déjà ! Pas besoin du bouton.
Vous pouvez directement utiliser l'éditeur de design.

**Option 2 : Copier le script manuellement**
Si le bouton ne s'affiche vraiment pas, copiez ce script et exécutez-le dans Supabase :

```sql
-- Script d'initialisation du design system GasyWay
CREATE TABLE IF NOT EXISTS design_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    tokens JSONB NOT NULL,
    is_active BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    version INTEGER DEFAULT 1,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_design_tokens_active ON design_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_design_tokens_default ON design_tokens(is_default);

INSERT INTO design_tokens (name, description, tokens, is_active, is_default) 
VALUES (
    'Thème GasyWay par défaut',
    'Thème officiel de GasyWay avec les couleurs et styles de la marque',
    '{
        "primary": "#0d4047",
        "primaryForeground": "#ffffff",
        "secondary": "#c6e5de",
        "secondaryForeground": "#0d4047",
        "accent": "#bcdc49",
        "accentForeground": "#0d4047",
        "background": "#ffffff",
        "foreground": "#0d4047",
        "muted": "#ececf0",
        "mutedForeground": "#717182",
        "destructive": "#d4183d",
        "destructiveForeground": "#ffffff",
        "border": "rgba(0, 0, 0, 0.1)",
        "fontFamily": "Outfit",
        "fontSize": 16,
        "fontWeightNormal": 400,
        "fontWeightMedium": 500,
        "h1": {"fontSize": 24, "lineHeight": 1.5, "fontWeight": 500, "textTransform": "none", "letterSpacing": 0},
        "h2": {"fontSize": 20, "lineHeight": 1.5, "fontWeight": 500, "textTransform": "none", "letterSpacing": 0},
        "h3": {"fontSize": 18, "lineHeight": 1.5, "fontWeight": 500, "textTransform": "none", "letterSpacing": 0},
        "h4": {"fontSize": 16, "lineHeight": 1.5, "fontWeight": 500, "textTransform": "none", "letterSpacing": 0},
        "h5": {"fontSize": 14, "lineHeight": 1.5, "fontWeight": 500, "textTransform": "none", "letterSpacing": 0},
        "h6": {"fontSize": 12, "lineHeight": 1.5, "fontWeight": 500, "textTransform": "none", "letterSpacing": 0},
        "p": {"fontSize": 16, "lineHeight": 1.5, "fontWeight": 400, "textTransform": "none", "letterSpacing": 0},
        "label": {"fontSize": 16, "lineHeight": 1.5, "fontWeight": 500, "textTransform": "none", "letterSpacing": 0},
        "radiusBase": 10,
        "spacingBase": 16
    }'::jsonb,
    true,
    true
)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE design_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Public read access for active design tokens"
    ON design_tokens FOR SELECT
    USING (is_active = true OR is_default = true);

CREATE POLICY IF NOT EXISTS "Admin full access to design tokens"
    ON design_tokens FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

SELECT name, is_active, is_default, created_at FROM design_tokens;
```

## 📋 Checklist rapide

- [ ] Je suis connecté en admin
- [ ] Je suis sur la page Admin → Design System
- [ ] J'ai ouvert la console (F12)
- [ ] Je vois les logs du diagnostic
- [ ] J'ai identifié l'état du système

## 🎯 Résultat attendu

**Si le système N'EST PAS initialisé**, vous devriez voir ceci :

```
┌─────────────────────────────────────────────────────┐
│ ⚠️  Design system non initialisé                   │
│                                                     │
│ État du système :                                   │
│ ❌ Table design_tokens n'existe pas                 │
│ ❌ Thème actif non trouvé                          │
│                                                     │
│ 📋 Instructions d'initialisation :                  │
│ 1. Cliquez sur le bouton ci-dessous...            │
│                                                     │
│ ┌──────────────────────────┐                       │
│ │ ▶️  Copier le script SQL │  (GROS BOUTON JAUNE)  │
│ └──────────────────────────┘                       │
│                                                     │
│ [ Vérifier à nouveau ]                             │
└─────────────────────────────────────────────────────┘
```

## 💡 Contact

Si après ces étapes le bouton n'apparaît toujours pas, copiez-moi :
1. Tous les logs de la console
2. Une capture d'écran de la page Design System
3. Le résultat de cette commande dans la console :
```javascript
console.log('Test diagnostic:', {
  url: window.location.href,
  hasInitializer: !!document.querySelector('[data-testid="design-system-initializer"]')
})
```
