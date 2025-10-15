import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

interface AuthCallbackProps {
  onSuccess: () => void;
  onError: () => void;
}

export function AuthCallback({ onSuccess, onError }: AuthCallbackProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Vérification en cours...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Obtenir les paramètres de l'URL
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        const type = urlParams.get('type');

        console.log('🔗 Callback auth:', { type, hasAccessToken: !!accessToken });

        if (type === 'signup' && accessToken && refreshToken) {
          // Confirmer l'email verification
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            throw error;
          }

          if (data.user) {
            console.log('✅ Email vérifié pour:', data.user.email);
            
            // Créer/Mettre à jour l'entrée dans la table users unifiée
            const { error: userError } = await supabase
              .from('users')
              .upsert({
                id: data.user.id,
                email: data.user.email,
                first_name: data.user.user_metadata?.first_name || '',
                last_name: data.user.user_metadata?.last_name || '',
                phone: data.user.user_metadata?.phone || '',
                role: 'voyageur',
                status: 'active',
                first_login_completed: false,
                gdpr_consent: true,
                locale: 'fr',
                interests: [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                last_login: new Date().toISOString()
              }, {
                onConflict: 'id',
                ignoreDuplicates: false
              });

            if (userError) {
              console.error('❌ Erreur création user:', userError);
              throw userError;
            }

            setStatus('success');
            setMessage('Email vérifié avec succès ! Redirection...');
            toast.success('Compte activé avec succès !');
            
            setTimeout(() => {
              onSuccess();
            }, 2000);
          }
        } else if (type === 'recovery' && accessToken && refreshToken) {
          // Redirection pour reset password
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            throw error;
          }

          setStatus('success');
          setMessage('Session restaurée. Vous pouvez maintenant changer votre mot de passe.');
          
          // Rediriger vers le formulaire de nouveau mot de passe
          setTimeout(() => {
            window.location.href = '/reset-password';
          }, 1000);
        } else {
          throw new Error('Paramètres de callback invalides');
        }
      } catch (error: any) {
        console.error('❌ Erreur callback auth:', error);
        setStatus('error');
        setMessage(error.message || 'Erreur lors de la vérification');
        toast.error('Erreur lors de la vérification');
      }
    };

    handleAuthCallback();
  }, [onSuccess]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
            status === 'loading' ? 'bg-blue-100' :
            status === 'success' ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {status === 'loading' && <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-6 w-6 text-green-600" />}
            {status === 'error' && <AlertCircle className="h-6 w-6 text-red-600" />}
          </div>
          <CardTitle>
            {status === 'loading' && 'Vérification...'}
            {status === 'success' && 'Succès !'}
            {status === 'error' && 'Erreur'}
          </CardTitle>
          <CardDescription>
            Traitement de votre demande
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant={status === 'error' ? 'destructive' : 'default'}>
            <AlertDescription>
              {message}
            </AlertDescription>
          </Alert>

          {status === 'error' && (
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full"
              >
                Réessayer
              </Button>
              <Button 
                onClick={onError}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Retour à l'accueil
              </Button>
            </div>
          )}

          {status === 'loading' && (
            <div className="text-center text-muted-foreground">
              <p>Veuillez patienter pendant la vérification...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}