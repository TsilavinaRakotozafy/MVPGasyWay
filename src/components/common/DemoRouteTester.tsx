import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { NewPasswordForm } from '../auth/NewPasswordForm';
import { AuthCallback } from '../auth/AuthCallback';
import { EmailVerificationPending } from '../auth/EmailVerificationPending';
import { Eye, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function DemoRouteTester() {
  const [currentDemo, setCurrentDemo] = useState<string | null>(null);

  const demos = [
    {
      id: 'reset-password',
      title: 'Reset Password',
      description: 'Écran de création nouveau mot de passe',
      component: 'NewPasswordForm'
    },
    {
      id: 'auth-callback',
      title: 'Auth Callback',
      description: 'Écran de traitement après email',
      component: 'AuthCallback'
    },
    {
      id: 'email-verification',
      title: 'Email Verification',
      description: 'Écran d\'attente validation email',
      component: 'EmailVerificationPending'
    }
  ];

  if (currentDemo === 'reset-password') {
    return (
      <NewPasswordForm 
        onSuccess={() => {
          toast.success('Démo terminée !');
          setCurrentDemo(null);
        }}
      />
    );
  }

  if (currentDemo === 'auth-callback') {
    return (
      <AuthCallback 
        onSuccess={() => {
          toast.success('Démo terminée !');
          setCurrentDemo(null);
        }}
        onError={() => {
          toast.info('Démo terminée (erreur simulée)');
          setCurrentDemo(null);
        }}
      />
    );
  }

  if (currentDemo === 'email-verification') {
    return (
      <EmailVerificationPending 
        email="demo@example.com"
        onBackToLogin={() => {
          toast.info('Retour depuis la démo');
          setCurrentDemo(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1>🧪 Testeur de Routes Démo</h1>
        <p className="text-muted-foreground">
          Testez les écrans d'authentification avancés sans configuration Supabase
        </p>
      </div>

      <div className="grid gap-4">
        {demos.map((demo) => (
          <Card key={demo.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4>{demo.title}</h4>
                  <Badge variant="secondary">{demo.component}</Badge>
                </div>
                <p className="text-muted-foreground">{demo.description}</p>
              </div>
              <Button 
                onClick={() => setCurrentDemo(demo.id)}
                size="sm"
              >
                <Eye className="h-4 w-4 mr-2" />
                Tester
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ℹ️ Comment ça marche</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h5>Routes spéciales dans Figma Make :</h5>
            <ul className="space-y-1 text-muted-foreground">
              <li>• <code>/reset-password</code> - Accessible uniquement via lien Supabase</li>
              <li>• <code>/auth/callback</code> - Accessible uniquement via lien Supabase</li>
              <li>• Cliquer manuellement → "Not Found" (normal)</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h5>Pour tester avec de vrais emails :</h5>
            <ol className="space-y-1 text-muted-foreground">
              <li>1. Configurez Supabase avec les URLs Figma Make</li>
              <li>2. Utilisez "Créer un compte" ou "Mot de passe oublié"</li>
              <li>3. Vérifiez votre boîte email</li>
              <li>4. Cliquez sur les liens pour tester les redirections</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}