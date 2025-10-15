-- =========================================
-- Script de création de la table newsletter_subscribers
-- Conforme RGPD pour Mailchimp/Brevo
-- =========================================

-- ✅ Créer la table newsletter_subscribers avec tous les champs RGPD
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  consent_given BOOLEAN NOT NULL DEFAULT true,
  consent_date TIMESTAMPTZ NOT NULL,
  consent_source TEXT NOT NULL, -- Ex: 'Homepage Newsletter Form', 'Footer Form', etc.
  consent_text TEXT NOT NULL, -- Texte exact du consentement accepté
  ip_address TEXT, -- Optionnel mais recommandé pour preuve supplémentaire
  opted_in BOOLEAN NOT NULL DEFAULT true,
  subscription_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ, -- Date de désinscription si applicable
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ✅ Index pour performance
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_opted_in ON newsletter_subscribers(opted_in);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscription_date ON newsletter_subscribers(subscription_date);

-- ✅ Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_newsletter_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_newsletter_updated_at
  BEFORE UPDATE ON newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_newsletter_updated_at();

-- ✅ RLS (Row Level Security) - Accès public en lecture pour l'inscription
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Politique : Tout le monde peut s'inscrire (INSERT)
CREATE POLICY "Tout le monde peut s'inscrire à la newsletter"
  ON newsletter_subscribers
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Politique : Seuls les admins peuvent lire les données
CREATE POLICY "Seuls les admins peuvent lire les abonnés"
  ON newsletter_subscribers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Politique : Seuls les admins peuvent mettre à jour (pour gérer les désabonnements)
CREATE POLICY "Seuls les admins peuvent mettre à jour"
  ON newsletter_subscribers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ✅ Commentaires pour documentation
COMMENT ON TABLE newsletter_subscribers IS 'Table des abonnés à la newsletter - Conforme RGPD pour Mailchimp/Brevo';
COMMENT ON COLUMN newsletter_subscribers.email IS 'Adresse email de l''abonné (unique)';
COMMENT ON COLUMN newsletter_subscribers.consent_given IS 'Consentement RGPD donné (toujours true pour les nouveaux abonnés)';
COMMENT ON COLUMN newsletter_subscribers.consent_date IS 'Date et heure exacte du consentement RGPD';
COMMENT ON COLUMN newsletter_subscribers.consent_source IS 'Source du formulaire d''inscription (preuve pour audits)';
COMMENT ON COLUMN newsletter_subscribers.consent_text IS 'Texte exact du consentement accepté (preuve légale)';
COMMENT ON COLUMN newsletter_subscribers.ip_address IS 'Adresse IP au moment de l''inscription (preuve supplémentaire optionnelle)';
COMMENT ON COLUMN newsletter_subscribers.opted_in IS 'Statut d''abonnement actif (true = abonné, false = désabonné)';
COMMENT ON COLUMN newsletter_subscribers.subscription_date IS 'Date de la première inscription';
COMMENT ON COLUMN newsletter_subscribers.unsubscribed_at IS 'Date de désinscription (NULL si toujours abonné)';

-- ✅ Fonction pour exporter les données pour Mailchimp/Brevo (format CSV)
CREATE OR REPLACE FUNCTION export_newsletter_subscribers()
RETURNS TABLE (
  email TEXT,
  consent_date TEXT,
  consent_source TEXT,
  opted_in BOOLEAN,
  subscription_date TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ns.email,
    ns.consent_date::TEXT,
    ns.consent_source,
    ns.opted_in,
    ns.subscription_date::TEXT
  FROM newsletter_subscribers ns
  WHERE ns.opted_in = true
  ORDER BY ns.subscription_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ Fonction pour gérer les désabonnements
CREATE OR REPLACE FUNCTION unsubscribe_from_newsletter(subscriber_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE newsletter_subscribers
  SET 
    opted_in = false,
    unsubscribed_at = NOW(),
    updated_at = NOW()
  WHERE email = subscriber_email AND opted_in = true;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ Fonction pour réabonner un utilisateur
CREATE OR REPLACE FUNCTION resubscribe_to_newsletter(subscriber_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE newsletter_subscribers
  SET 
    opted_in = true,
    unsubscribed_at = NULL,
    consent_date = NOW(),
    updated_at = NOW()
  WHERE email = subscriber_email AND opted_in = false;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ Vue pour les statistiques de newsletter (accessible aux admins)
CREATE OR REPLACE VIEW newsletter_stats AS
SELECT 
  COUNT(*) FILTER (WHERE opted_in = true) AS total_subscribers,
  COUNT(*) FILTER (WHERE opted_in = false) AS total_unsubscribed,
  COUNT(*) FILTER (WHERE subscription_date >= NOW() - INTERVAL '7 days' AND opted_in = true) AS new_subscribers_7days,
  COUNT(*) FILTER (WHERE subscription_date >= NOW() - INTERVAL '30 days' AND opted_in = true) AS new_subscribers_30days,
  MIN(subscription_date) AS first_subscriber_date,
  MAX(subscription_date) AS last_subscriber_date
FROM newsletter_subscribers;

-- ✅ Accorder les permissions pour la vue
GRANT SELECT ON newsletter_stats TO authenticated;

-- =========================================
-- Instructions pour Mailchimp/Brevo
-- =========================================

/*
POUR MAILCHIMP/BREVO :

1. EXPORTER LES ABONNÉS :
   SELECT * FROM export_newsletter_subscribers();
   
2. PROUVER LE CONSENTEMENT LORS D'UN AUDIT :
   SELECT 
     email,
     consent_date,
     consent_source,
     consent_text,
     ip_address
   FROM newsletter_subscribers
   WHERE email = 'email@example.com';

3. STATISTIQUES :
   SELECT * FROM newsletter_stats;

4. DÉSABONNER UN UTILISATEUR :
   SELECT unsubscribe_from_newsletter('email@example.com');

5. RÉABONNER UN UTILISATEUR :
   SELECT resubscribe_to_newsletter('email@example.com');

CHAMPS IMPORTANTS POUR LA CONFORMITÉ :
- consent_date : Date exacte du consentement
- consent_source : Provenance du formulaire
- consent_text : Texte exact accepté
- ip_address : Preuve supplémentaire (optionnel)
- opted_in : Statut actif/inactif

Ces informations permettent de répondre aux audits de Mailchimp/Brevo
qui demandent la preuve du consentement RGPD pour chaque email.
*/
