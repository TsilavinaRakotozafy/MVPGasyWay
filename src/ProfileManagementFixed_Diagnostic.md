# Ajout de l'onglet Diagnostic au ProfileManagementFixed.tsx

Voici la partie à ajouter après les onglets existants :

```tsx
          <TabsContent value="sync" className="space-y-6">
            {/* Onglet de diagnostic et synchronisation */}
            <UserSyncChecker />
            
            {/* Boutons d'actions rapides */}
            <Card>
              <CardHeader>
                <CardTitle>Actions Rapides</CardTitle>
                <CardDescription>
                  Outils de dépannage et de synchronisation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={syncUserToDatabase}
                    disabled={syncing}
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary/5"
                  >
                    {syncing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Synchronisation...
                      </>
                    ) : (
                      "🔧 Synchroniser vers DB"
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="border-secondary text-secondary-foreground hover:bg-secondary/10"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Recharger la page
                  </Button>
                </div>
                
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Si les champs nom et prénom restent vides, utilisez "Synchroniser vers DB" 
                    pour créer votre profil dans la base de données.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
```

Et il faut importer RefreshCw :

```tsx
import {
  User,
  Mail,
  Phone,
  Upload,
  Save,
  Heart,
  X,
  Loader2,
  Camera,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
```