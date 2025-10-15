-- 📋 TABLE MÉTADONNÉES PAGES LÉGALES
-- Système hybride : contenu hardcodé + métadonnées flexibles

-- Table pour les métadonnées des pages légales
CREATE TABLE IF NOT EXISTS legal_pages_metadata (
  id TEXT PRIMARY KEY CHECK (id IN ('privacy', 'terms', 'cookies')),
  title TEXT NOT NULL,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version TEXT NOT NULL DEFAULT '1.0',
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_legal_pages_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER legal_pages_metadata_updated_at
  BEFORE UPDATE ON legal_pages_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_legal_pages_metadata_updated_at();

-- Données initiales
INSERT INTO legal_pages_metadata (id, title, version, metadata) VALUES
(
  'privacy',
  'Politique de Confidentialité',
  '1.0',
  '{
    "description": "Protection et gestion des données personnelles sur GasyWay",
    "keywords": ["rgpd", "données personnelles", "confidentialité"],
    "contact_email": "privacy@gasyway.com",
    "dpo_email": "dpo@gasyway.com",
    "languages": ["fr"],
    "sections": [
      "Informations collectées",
      "Utilisation des données",
      "Partage des données",
      "Cookies et traceurs",
      "Vos droits",
      "Sécurité",
      "Contact"
    ]
  }'::JSONB
),
(
  'terms',
  'Conditions Générales d\'Utilisation',
  '1.0',
  '{
    "description": "Conditions d\'utilisation de la plateforme GasyWay",
    "keywords": ["cgu", "conditions", "utilisation", "voyage"],
    "contact_email": "legal@gasyway.com",
    "jurisdiction": "Tribunaux d\'Antananarivo, Madagascar",
    "governing_law": "Droit malgache",
    "languages": ["fr"],
    "sections": [
      "Informations générales",
      "Définitions",
      "Accès et utilisation",
      "Services proposés",
      "Réservations et paiements",
      "Annulations",
      "Responsabilités",
      "Propriété intellectuelle",
      "Protection des données",
      "Modifications",
      "Droit applicable"
    ]
  }'::JSONB
),
(
  'cookies',
  'Politique des Cookies',
  '1.0',
  '{
    "description": "Gestion et utilisation des cookies sur GasyWay",
    "keywords": ["cookies", "rgpd", "traceurs", "consentement"],
    "contact_email": "privacy@gasyway.com",
    "consent_duration_days": 365,
    "languages": ["fr"],
    "cookie_categories": [
      {
        "id": "necessary",
        "name": "Cookies Nécessaires",
        "required": true,
        "description": "Essentiels au fonctionnement du site"
      },
      {
        "id": "analytics",
        "name": "Cookies Analytiques",
        "required": false,
        "description": "Analyse et amélioration du site"
      },
      {
        "id": "marketing",
        "name": "Cookies Marketing",
        "required": false,
        "description": "Publicités et campagnes personnalisées"
      },
      {
        "id": "preferences",
        "name": "Cookies de Préférences",
        "required": false,
        "description": "Mémorisation de vos préférences"
      }
    ]
  }'::JSONB
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  version = EXCLUDED.version,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- RLS Policies (lecture publique, écriture admin)
ALTER TABLE legal_pages_metadata ENABLE ROW LEVEL SECURITY;

-- Politique de lecture publique
CREATE POLICY "legal_pages_metadata_read" ON legal_pages_metadata
  FOR SELECT
  TO public
  USING (is_active = true);

-- Politique d'écriture pour les admins
CREATE POLICY "legal_pages_metadata_admin_write" ON legal_pages_metadata
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_legal_pages_metadata_active ON legal_pages_metadata (is_active);
CREATE INDEX IF NOT EXISTS idx_legal_pages_metadata_updated ON legal_pages_metadata (updated_at DESC);

-- Commentaires
COMMENT ON TABLE legal_pages_metadata IS 'Métadonnées des pages légales (approche hybride)';
COMMENT ON COLUMN legal_pages_metadata.id IS 'Identifiant unique de la page légale';
COMMENT ON COLUMN legal_pages_metadata.metadata IS 'Métadonnées flexibles en JSONB';
COMMENT ON COLUMN legal_pages_metadata.version IS 'Version du document légal';

-- Vérification des données
SELECT 
  id,
  title,
  version,
  last_updated,
  is_active,
  jsonb_pretty(metadata) as metadata_formatted
FROM legal_pages_metadata
ORDER BY id;