import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { toast } from "sonner@2.0.3";
import {
  LogIn,
  Mail,
  Lock,
  UserPlus,
  MapPin,
  KeyRound,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContextSQL";
import { SignupForm } from "./SignupForm";
import { PasswordResetForm } from "./PasswordResetForm";

interface LoginFormProps {
  onLoginSuccess: () => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] =
    useState("Connexion...");
  const [showSignup, setShowSignup] = useState(false);
  const [showPasswordReset, setShowPasswordReset] =
    useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Afficher le formulaire d'inscription
  if (showSignup) {
    return (
      <SignupForm
        onSignupSuccess={onLoginSuccess}
        onBackToLogin={() => setShowSignup(false)}
      />
    );
  }

  // Afficher le formulaire de réinitialisation de mot de passe
  if (showPasswordReset) {
    return (
      <PasswordResetForm
        onBack={() => setShowPasswordReset(false)}
      />
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Messages de progression
      setLoadingMessage("Vérification des identifiants...");

      const result = await signIn(
        formData.email,
        formData.password,
      );

      if (result.error) {
        toast.error(result.error);
        setLoading(false);
      } else {
        setLoadingMessage("Chargement de votre profil...");
        toast.success("Connexion réussie !");

        // Attendre un peu plus pour laisser le temps aux données de se charger
        setTimeout(() => {
          setLoading(false);
          onLoginSuccess();
        }, 2000);
      }
    } catch (error: any) {
      console.error("Erreur de connexion:", error);
      toast.error("Erreur lors de la connexion");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Section image - masquée en mobile */}
      <div className="hidden md:flex flex-3 relative">
        <img
          src="https://images.unsplash.com/photo-1659944984855-776187144baf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWRhZ2FzY2FyJTIwbGFuZHNjYXBlJTIwYmFvYmFiJTIwdHJlZXMlMjBzdW5zZXR8ZW58MXx8fHwxNzU5Njc3MzA1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Paysage de Madagascar avec baobabs au coucher du soleil"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/20" />
        <div className="absolute bottom-8 left-8 right-8 text-white">
          <h2 className="text-white mb-2">
            Découvrez Madagascar
          </h2>
          <p className="text-white/90">
            Une île unique au monde avec des paysages à couper
            le souffle et une biodiversité exceptionnelle.
          </p>
        </div>
      </div>

      {/* Section formulaire - toujours visible */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Header avec logo */}
          <div className="text-center space-y-6">
            <div
              className="mx-auto w-16 h-16 bg-secondary rounded-full flex items-center justify-center cursor-pointer hover:bg-secondary/80 transition-colors"
              onClick={onLoginSuccess}
              title="Retour à l'accueil"
            >
              <MapPin className="h-8 w-8 text-secondary-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-primary">
                Connexion GasyWay
              </h3>
              <p className="text-muted-foreground">
                Connectez-vous pour découvrir Madagascar
              </p>
            </div>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">
                  Email{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: e.target.value,
                      })
                    }
                    placeholder="votre@email.com"
                    className="pl-10 bg-input-background border-border"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="password">
                  Mot de passe{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        password: e.target.value,
                      })
                    }
                    placeholder="••••••••"
                    className="pl-10 bg-input-background border-border"
                    required
                  />
                </div>
              </div>

              {/* Lien mot de passe oublié */}
              <div className="text-right">
                <Button
                  type="button"
                  variant="link"
                  className="text-primary hover:text-primary/80 p-0 h-auto"
                  onClick={() => setShowPasswordReset(true)}
                >
                  Mot de passe oublié ?
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {loadingMessage}
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Se connecter
                </>
              )}
            </Button>
          </form>

          {/* Séparateur */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-2 text-muted-foreground">
                ou
              </span>
            </div>
          </div>

          {/* Bouton d'inscription */}
          <Button
            type="button"
            variant="outline"
            className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            onClick={() => setShowSignup(true)}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Créer un compte
          </Button>
        </div>
      </div>
    </div>
  );
}