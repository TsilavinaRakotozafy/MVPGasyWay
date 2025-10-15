import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../utils/supabase/client';
import { toast } from 'sonner@2.0.3';
import { getResetPasswordUrl } from '../../utils/figma-make-config';

interface PasswordResetFormProps {
  onBack: () => void;
}

export function PasswordResetForm({ onBack }: PasswordResetFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getResetPasswordUrl(),
      });

      if (error) {
        throw error;
      }

      setEmailSent(true);
      toast.success('Email de réinitialisation envoyé !');
    } catch (error: any) {
      console.error('Erreur réinitialisation:', error);
      setError(
        error.message === 'User not found'
          ? 'Aucun compte associé à cette adresse email'
          : 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer.'
      );
      toast.error('Erreur lors de l\'envoi de l\'email');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Email envoyé !</CardTitle>
            <CardDescription>
              Vérifiez votre boîte email pour continuer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Un email de réinitialisation a été envoyé à <strong>{email}</strong>.
                Cliquez sur le lien dans l'email pour créer un nouveau mot de passe.
              </AlertDescription>
            </Alert>

            <div className="space-y-2 text-muted-foreground">
              <p>• Vérifiez votre dossier spam si vous ne voyez pas l'email</p>
              <p>• Le lien expire dans 1 heure</p>
              <p>• Vous pouvez fermer cette page</p>
            </div>

            <Button variant="outline" onClick={onBack} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Mot de passe oublié ?</CardTitle>
          <CardDescription>
            Entrez votre email pour recevoir un lien de réinitialisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetRequest} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="reset-email">Adresse email</Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                disabled={loading}
                className="bg-input-background"
              />
            </div>

            <div className="space-y-3">
              <Button 
                type="submit" 
                disabled={loading || !email.trim()}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
              </Button>

              <Button 
                type="button" 
                variant="outline" 
                onClick={onBack}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à la connexion
              </Button>
            </div>
          </form>

          <div className="mt-6 space-y-2 text-muted-foreground">
            <h4>Comment ça marche ?</h4>
            <ul className="space-y-1">
              <li>• Nous envoyons un lien sécurisé à votre email</li>
              <li>• Cliquez sur le lien pour accéder au formulaire</li>
              <li>• Créez votre nouveau mot de passe</li>
              <li>• Connectez-vous avec vos nouveaux identifiants</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}