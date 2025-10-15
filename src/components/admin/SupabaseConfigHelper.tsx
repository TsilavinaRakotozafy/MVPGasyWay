import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Copy, Check, Settings, ExternalLink } from 'lucide-react';
import { getSupabaseConfigInstructions, logSupabaseInstructions } from '../../utils/figma-make-config';
import { toast } from 'sonner@2.0.3';

export function SupabaseConfigHelper() {
  const [copied, setCopied] = useState<string | null>(null);
  const config = getSupabaseConfigInstructions();

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast.success(`${type} copié !`);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      toast.error('Erreur lors de la copie');
    }
  };

  const handleLogToConsole = () => {
    logSupabaseInstructions();
    toast.success('Instructions affichées dans la console !');
  };

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1>Configuration Supabase pour Figma Make</h1>
        <p className="text-muted-foreground">
          Voici les URLs automatiquement détectées pour configurer votre projet Supabase
        </p>
      </div>

      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          URL Figma Make détectée : <strong>{config.siteUrl}</strong>
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {/* Site URL */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Site URL
            </CardTitle>
            <CardDescription>
              URL principale de votre application dans Authentication → Settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-muted rounded-md font-mono break-all">
              {config.siteUrl}
            </div>
            <Button 
              variant="outline" 
              onClick={() => handleCopy(config.siteUrl, 'Site URL')}
              className="w-full"
            >
              {copied === 'Site URL' ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copier Site URL
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Redirect URLs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Redirect URLs
            </CardTitle>
            <CardDescription>
              URLs de redirection dans Authentication → URL Configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {config.redirectUrls.map((url, index) => (
              <div key={index} className="space-y-2">
                <div className="p-3 bg-muted rounded-md font-mono break-all">
                  {url}
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => handleCopy(url, `Redirect URL ${index + 1}`)}
                  size="sm"
                  className="w-full"
                >
                  {copied === `Redirect URL ${index + 1}` ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copier cette URL
                    </>
                  )}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Instructions complètes */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions complètes</CardTitle>
            <CardDescription>
              Guide étape par étape pour configurer Supabase
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-md whitespace-pre-line font-mono text-sm">
              {config.instructions}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => handleCopy(config.instructions, 'Instructions')}
                className="flex-1"
              >
                {copied === 'Instructions' ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copié !
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copier tout
                  </>
                )}
              </Button>
              <Button 
                onClick={handleLogToConsole}
                className="flex-1"
              >
                📋 Afficher dans console
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>Checklist de configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="step1" className="h-4 w-4" />
                <label htmlFor="step1" className="text-sm">
                  ✅ Aller dans Supabase Dashboard → Authentication → Settings
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="step2" className="h-4 w-4" />
                <label htmlFor="step2" className="text-sm">
                  ✅ Définir Site URL avec l'URL Figma Make
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="step3" className="h-4 w-4" />
                <label htmlFor="step3" className="text-sm">
                  ✅ Activer "Enable email confirmations"
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="step4" className="h-4 w-4" />
                <label htmlFor="step4" className="text-sm">
                  ✅ Ajouter les Redirect URLs dans URL Configuration
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="step5" className="h-4 w-4" />
                <label htmlFor="step5" className="text-sm">
                  ✅ Tester l'inscription avec validation email
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="step6" className="h-4 w-4" />
                <label htmlFor="step6" className="text-sm">
                  ✅ Tester la réinitialisation de mot de passe
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}