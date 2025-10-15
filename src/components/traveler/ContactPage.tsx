import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Loader2,
  MessageCircle,
  Clock,
} from "lucide-react";
import { supabase } from "../../utils/supabase/client";
import { toast } from "sonner@2.0.3";
import { useCompanyInfo } from "../../hooks/useCompanyInfo";
import { useFAQs } from "../../hooks/useFAQs";
import { FAQItem } from "../common/FAQItem";

export function ContactPage() {
  // ✅ Hook pour charger les infos depuis Supabase
  const { data: companyInfo, loading: companyLoading } = useCompanyInfo();
  
  // ✅ Hook pour charger les FAQ générales depuis Supabase
  const { faqs, loading: faqsLoading } = useFAQs();

  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const { error } = await supabase.from("contact_messages").insert([
        {
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          status: "new",
        },
      ]);

      if (error) {
        console.error("Erreur envoi message:", error);
        toast.error("Erreur lors de l'envoi du message");
      } else {
        toast.success("Message envoyé avec succès !");
        setFormData({ name: "", email: "", subject: "", message: "" });
      }
    } catch (err) {
      console.error("Erreur inattendue:", err);
      toast.error("Une erreur est survenue");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-12 px-4 sm:px-6 lg:px-8 pb-16">
      {/* Hero Section */}
      <div className="relative h-[300px] -mx-4 sm:-mx-6 lg:-mx-8 overflow-hidden">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1596524430615-b46475ddff6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb250YWN0JTIwc3VwcG9ydCUyMGNvbW11bmljYXRpb258ZW58MXx8fHwxNzYwMDE5NTA4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Contactez-nous"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-white mb-4">Contactez-nous</h1>
          <p className="text-white max-w-2xl">
            Une question sur nos destinations ou nos services ? Notre équipe est
            là pour vous aider.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Informations de contact */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <h3 className="text-primary">Informations</h3>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* ✅ Bloc Email - Affiché uniquement si contact_email existe */}
              {companyInfo?.contact_email && (
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-primary">Email</h5>
                    <p className="text-muted-foreground">{companyInfo.contact_email}</p>
                  </div>
                </div>
              )}

              {/* ✅ Bloc Téléphone - Affiché uniquement si contact_phone existe */}
              {companyInfo?.contact_phone && (
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-primary">Téléphone</h5>
                    <p className="text-muted-foreground">{companyInfo.contact_phone}</p>
                  </div>
                </div>
              )}

              {/* ✅ Bloc Adresse - Affiché uniquement si address existe */}
              {companyInfo?.address && (
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-primary">Adresse</h5>
                    <p className="text-muted-foreground" style={{ whiteSpace: 'pre-line' }}>
                      {companyInfo.address}
                    </p>
                  </div>
                </div>
              )}

              {/* ✅ Bloc Horaires - Affiché uniquement si business_hours existe */}
              {companyInfo?.business_hours && (
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-primary">Horaires</h5>
                    <p className="text-muted-foreground" style={{ whiteSpace: 'pre-line' }}>
                      {companyInfo.business_hours}
                    </p>
                  </div>
                </div>
              )}

              {/* ✅ Message si aucune donnée disponible */}
              {!companyLoading && !companyInfo?.contact_email && !companyInfo?.contact_phone && !companyInfo?.address && !companyInfo?.business_hours && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Les informations de contact sont en cours de mise à jour.
                  </p>
                </div>
              )}

              {/* ✅ Skeleton pendant le chargement */}
              {companyLoading && (
                <div className="space-y-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-muted rounded-full animate-pulse" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-muted rounded w-1/4 animate-pulse" />
                        <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-accent text-accent-foreground">
            <CardContent className="p-6 space-y-3">
              <MessageCircle className="w-8 h-8" />
              <h4>Temps de réponse</h4>
              <p>
                Notre équipe répond généralement sous 24h (jours ouvrés). Pour
                les demandes urgentes, contactez-nous par téléphone.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Formulaire de contact */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                <h2 className="text-primary">Envoyez-nous un message</h2>
              </CardTitle>
              <p className="text-muted-foreground">
                Remplissez le formulaire ci-dessous et nous vous répondrons dans
                les plus brefs délais.
              </p>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom complet</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Votre nom"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Sujet</Label>
                  <Input
                    id="subject"
                    type="text"
                    placeholder="L'objet de votre message"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    rows={8}
                    placeholder="Décrivez votre demande, projet de voyage ou question..."
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    required
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Envoyer le message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ✅ FAQ rapide - Dynamique depuis Supabase */}
      {(faqsLoading || faqs.length > 0) && (
        <div className="space-y-6">
          <h2 className="text-center">Questions fréquentes</h2>
          
          <div className="space-y-4">
            {/* ✅ Skeleton pendant le chargement */}
            {faqsLoading && (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="border rounded-lg p-6 space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-muted rounded w-full animate-pulse" />
                    <div className="h-3 bg-muted rounded w-5/6 animate-pulse" />
                  </div>
                ))}
              </div>
            )}

            {/* ✅ Affichage des FAQ depuis Supabase */}
            {!faqsLoading && faqs.length > 0 && (
              <div className="space-y-3">
                {faqs.map((faq) => (
                  <FAQItem
                    key={faq.id}
                    question={faq.question}
                    answer={faq.answer}
                    defaultOpen={false}
                  />
                ))}
              </div>
            )}

            {/* ✅ Message si aucune FAQ disponible */}
            {!faqsLoading && faqs.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Aucune question fréquente disponible pour le moment.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
