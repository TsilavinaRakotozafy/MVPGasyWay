import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Mail, CheckCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../../utils/supabase/client';
import { toast } from 'sonner@2.0.3';
import { getAuthCallbackUrl } from '../../utils/figma-make-config';

interface EmailVerificationPendingProps {
  email: string;
  onBackToLogin: () => void;
}

export function EmailVerificationPending({ email, onBackToLogin }: EmailVerificationPendingProps) {
  const [resending, setResending] = React.useState(false);

  const handleResendEmail = async () => {
    setResending(true);
    try {
      console.log('🔄 Tentative de renvoi email pour:', email);
      console.log('🔗 URL de redirection:', getAuthCallbackUrl());

      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: getAuthCallbackUrl()
        }
      });

      console.log('📧 Résultat renvoi email:', { data, error });

      if (error) {
        console.error('❌ Erreur Supabase renvoi email:', error);
        
        // Messages d'erreur plus spécifiques
        let errorMessage = 'Erreur lors du renvoi de l\'email';
        
        if (error.message?.includes('rate limit')) {
          errorMessage = 'Trop de tentatives. Attendez quelques minutes avant de réessayer.';
        } else if (error.message?.includes('not found')) {
          errorMessage = 'Adresse email non trouvée. Vérifiez votre inscription.';
        } else if (error.message?.includes('invalid')) {
          errorMessage = 'Configuration email invalide. Contactez le support.';
        } else if (error.message?.includes('disabled')) {
          errorMessage = 'Service d\'email temporairement désactivé.';
        }
        
        toast.error(errorMessage, {
          description: `Erreur technique: ${error.message}`,
          duration: 8000
        });
        throw error;
      }

      console.log('✅ Email de vérification renvoyé avec succès');
      toast.success('Email de vérification renvoyé !', {
        description: 'Vérifiez votre boîte de réception et le dossier spam.',
        duration: 6000
      });
    } catch (error: any) {
      console.error('❌ Erreur critique renvoi email:', error);
      
      // Log détaillé pour le débogage
      console.log('🔍 Détails de l\'erreur:', {
        email,
        redirectUrl: getAuthCallbackUrl(),
        error: error.message,
        stack: error.stack
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>Vérifiez votre email</CardTitle>
          <CardDescription>
            Un email de confirmation a été envoyé
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Un email de vérification a été envoyé à <strong>{email}</strong>.
              Cliquez sur le lien dans l'email pour activer votre compte.
            </AlertDescription>
          </Alert>

          <div className="space-y-2 text-muted-foreground">
            <h4>Étapes suivantes :</h4>
            <ul className="space-y-1">
              <li>• Vérifiez votre boîte email (et le dossier spam)</li>
              <li>• Cliquez sur le lien de confirmation</li>
              <li>• Vous serez redirigé vers l'application</li>
              <li>• Connectez-vous avec vos identifiants</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleResendEmail}
              disabled={resending}
              variant="outline"
              className="w-full"
            >
              {resending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Renvoi en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Renvoyer l'email
                </>
              )}
            </Button>

            <Button 
              onClick={onBackToLogin}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Retour à la connexion
            </Button>
          </div>

          <div className="text-center">
            <p className="text-muted-foreground">
              Le lien de vérification expire dans 24 heures.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}