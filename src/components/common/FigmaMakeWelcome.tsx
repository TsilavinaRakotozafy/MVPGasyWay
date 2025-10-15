import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Info, Globe, Zap } from 'lucide-react';

export function FigmaMakeWelcome() {
  const figmaUrl = window.location.origin;
  
  return (
    <Card className="mb-6 bg-secondary/20 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-accent" />
          Bienvenue dans GasyWay sur Figma Make !
        </CardTitle>
        <CardDescription>
          Application de tourisme Madagascar avec authentification avancée
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>URL Figma Make détectée :</strong> {figmaUrl}
          </AlertDescription>
        </Alert>

        <div className="grid gap-3">
          <div>
            <h5>🎯 Navigation interne</h5>
            <p className="text-muted-foreground">
              Cette application utilise un système de navigation React interne. 
              Vous naviguez via les boutons et menus, pas via les URLs.
            </p>
          </div>

          <div>
            <h5>📧 Routes spéciales</h5>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">/reset-password</Badge>
              <Badge variant="outline">/auth/callback</Badge>
            </div>
            <p className="text-muted-foreground">
              Ces URLs ne fonctionnent que via les emails Supabase
            </p>
          </div>

          <div>
            <h5>🚀 Fonctionnalités prêtes</h5>
            <ul className="text-muted-foreground space-y-1">
              <li>✅ Catalogue de packs Madagascar</li>
              <li>✅ Système d'authentification complet</li>
              <li>✅ Validation par email</li>
              <li>✅ Reset password</li>
              <li>✅ Interface admin</li>
              <li>✅ Design system harmonisé</li>
            </ul>
          </div>
        </div>

        <Alert>
          <Globe className="h-4 w-4" />
          <AlertDescription>
            <strong>Comportement normal :</strong> Cliquer directement sur l'URL de base 
            peut afficher "Not Found" selon le navigateur. L'application doit être 
            ouverte via Figma Make directement.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}