import React, { useState } from 'react'
import { DesignSystemEditor } from './DesignSystemEditor'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Palette, Info, RefreshCw } from 'lucide-react'
import { Button } from '../ui/button'
import { initializeDesignSystem } from '../../utils/design-system-loader'
import { toast } from 'sonner@2.0.3'

/**
 * Page de gestion du design system GasyWay
 * Interface simplifiée pour éditer les design tokens
 */
export function DesignSystemManagement() {
  const [activeTab, setActiveTab] = useState('editor')
  const [reloading, setReloading] = useState(false)

  /**
   * Recharger les design tokens depuis la base
   */
  async function handleReload() {
    setReloading(true)
    try {
      await initializeDesignSystem()
      toast.success('Design system rechargé avec succès')
    } catch (error) {
      console.error('Erreur rechargement design system:', error)
      toast.error('Erreur lors du rechargement')
    } finally {
      setReloading(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1>Design System</h1>
            <p className="text-muted-foreground">
              Gérez l'apparence globale de l'application : couleurs, typographie, espacements.
            </p>
          </div>
          <Button 
            onClick={handleReload} 
            disabled={reloading}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${reloading ? 'animate-spin' : ''}`} />
            Recharger
          </Button>
        </div>
      </div>

      {/* Onglets de gestion */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="editor" className="gap-2">
            <Palette className="h-4 w-4" />
            Éditeur de design
          </TabsTrigger>
          <TabsTrigger value="info" className="gap-2">
            <Info className="h-4 w-4" />
            Documentation
          </TabsTrigger>
        </TabsList>

        {/* Éditeur de design */}
        <TabsContent value="editor" className="space-y-6">
          <DesignSystemEditor />
        </TabsContent>

        {/* Documentation */}
        <TabsContent value="info" className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Comment utiliser le design system</CardTitle>
              <CardDescription>
                Guide d'utilisation du système de design dynamique de GasyWay
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Architecture */}
              <div className="space-y-3">
                <h3>🏗️ Architecture</h3>
                <p className="text-sm text-muted-foreground">
                  Le design system GasyWay fonctionne en 3 couches :
                </p>
                <ol className="space-y-2 text-sm list-decimal list-inside ml-4">
                  <li>
                    <strong>Base de données</strong> : Stocke les design tokens dans Supabase
                  </li>
                  <li>
                    <strong>Loader frontend</strong> : Charge et applique les tokens au démarrage
                  </li>
                  <li>
                    <strong>Variables CSS</strong> : Utilisées partout dans l'interface
                  </li>
                </ol>
              </div>

              {/* Couleurs */}
              <div className="space-y-3">
                <h3>🎨 Couleurs principales</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-primary text-primary-foreground rounded-lg space-y-2">
                    <p className="font-medium">Primary</p>
                    <p className="text-sm opacity-90">#0d4047</p>
                    <p className="text-xs opacity-75">Actions principales, navigation</p>
                  </div>
                  <div className="p-4 bg-secondary text-secondary-foreground rounded-lg space-y-2">
                    <p className="font-medium">Secondary</p>
                    <p className="text-sm opacity-90">#c6e5de</p>
                    <p className="text-xs opacity-75">Arrière-plans subtils, états hover</p>
                  </div>
                  <div className="p-4 bg-accent text-accent-foreground rounded-lg space-y-2">
                    <p className="font-medium">Accent</p>
                    <p className="text-sm opacity-90">#bcdc49</p>
                    <p className="text-xs opacity-75">CTA importants, highlights</p>
                  </div>
                </div>
              </div>

              {/* Typographie */}
              <div className="space-y-3">
                <h3>📝 Typographie automatique</h3>
                <p className="text-sm text-muted-foreground">
                  Tous les éléments HTML ont des styles typographiques automatiques :
                </p>
                <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                  <h1 className="text-muted-foreground">H1 - Titre principal (24px)</h1>
                  <h2 className="text-muted-foreground">H2 - Titre de section (20px)</h2>
                  <h3 className="text-muted-foreground">H3 - Sous-titre (18px)</h3>
                  <h4 className="text-muted-foreground">H4 - Titre de carte (16px)</h4>
                  <p className="text-muted-foreground">P - Paragraphe normal (16px)</p>
                  <label className="text-muted-foreground">Label - Libellé de champ (16px)</label>
                </div>
                <p className="text-sm text-destructive mt-2">
                  ⚠️ <strong>Important</strong> : Ne jamais utiliser de classes Tailwind de typographie 
                  (text-2xl, font-bold, etc.) car elles sont gérées automatiquement.
                </p>
              </div>

              {/* Modifications en temps réel */}
              <div className="space-y-3">
                <h3>⚡ Modifications en temps réel</h3>
                <p className="text-sm text-muted-foreground">
                  Lorsque vous modifiez le design system :
                </p>
                <ol className="space-y-2 text-sm list-decimal list-inside ml-4">
                  <li>Les changements sont sauvegardés dans Supabase</li>
                  <li>Un événement déclenche la mise à jour immédiate du CSS</li>
                  <li>Toutes les pages utilisent automatiquement les nouvelles valeurs</li>
                  <li>Les changements persistent après rechargement</li>
                </ol>
              </div>

              {/* Tokens disponibles */}
              <div className="space-y-3">
                <h3>🎯 Tokens disponibles</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Couleurs :</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      <code className="p-2 bg-muted rounded">--primary</code>
                      <code className="p-2 bg-muted rounded">--secondary</code>
                      <code className="p-2 bg-muted rounded">--accent</code>
                      <code className="p-2 bg-muted rounded">--muted</code>
                      <code className="p-2 bg-muted rounded">--destructive</code>
                      <code className="p-2 bg-muted rounded">--border</code>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Typographie par élément :</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      <code className="p-2 bg-muted rounded">--text-h1-size</code>
                      <code className="p-2 bg-muted rounded">--text-h2-size</code>
                      <code className="p-2 bg-muted rounded">--text-h3-size</code>
                      <code className="p-2 bg-muted rounded">--text-h4-size</code>
                      <code className="p-2 bg-muted rounded">--text-p-size</code>
                      <code className="p-2 bg-muted rounded">--text-label-size</code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bonnes pratiques */}
              <div className="space-y-3">
                <h3>✅ Bonnes pratiques</h3>
                <ul className="space-y-2 text-sm list-disc list-inside ml-4">
                  <li>Toujours utiliser les tokens CSS plutôt que des valeurs hardcodées</li>
                  <li>Ne jamais ajouter de classes Tailwind de typographie (text-xl, font-bold...)</li>
                  <li>Tester les modifications sur plusieurs pages avant de sauvegarder</li>
                  <li>Conserver une cohérence visuelle entre les couleurs</li>
                  <li>Respecter les ratios de contraste pour l'accessibilité</li>
                </ul>
              </div>

              {/* Dépannage */}
              <div className="space-y-3">
                <h3>🔧 Dépannage</h3>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium mb-1">Les modifications ne s'appliquent pas ?</p>
                    <ol className="list-decimal list-inside ml-4 space-y-1 text-xs">
                      <li>Vérifiez que la table design_tokens existe dans Supabase</li>
                      <li>Vérifiez les logs de la console (F12)</li>
                      <li>Rechargez la page (Ctrl+R ou Cmd+R)</li>
                      <li>Vérifiez que le diagnostic est vert ci-dessus</li>
                    </ol>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium mb-1">Erreur lors de la sauvegarde ?</p>
                    <ol className="list-decimal list-inside ml-4 space-y-1 text-xs">
                      <li>Vérifiez votre connexion internet</li>
                      <li>Vérifiez que vous êtes connecté en tant qu'admin</li>
                      <li>Consultez les logs de la console pour plus de détails</li>
                    </ol>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
