-- =====================================================
-- SYSTÈME FAQ GASYWAY - Liées aux centres d'intérêt
-- =====================================================

-- Table principale des FAQ
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interest_id UUID NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT faqs_question_not_empty CHECK (LENGTH(TRIM(question)) > 0),
  CONSTRAINT faqs_answer_not_empty CHECK (LENGTH(TRIM(answer)) > 0)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_faqs_interest_id ON faqs(interest_id);
CREATE INDEX IF NOT EXISTS idx_faqs_active_order ON faqs(interest_id, is_active, order_index) WHERE is_active = true;

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_faqs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_faqs_updated_at ON faqs;
CREATE TRIGGER trigger_faqs_updated_at
  BEFORE UPDATE ON faqs
  FOR EACH ROW
  EXECUTE FUNCTION update_faqs_updated_at();

-- =====================================================
-- DONNÉES DE DÉMONSTRATION
-- =====================================================

-- FAQ pour la Plongée sous-marine
INSERT INTO faqs (interest_id, question, answer, order_index) VALUES
-- Récupérer l'ID du centre d'intérêt "Plongée sous-marine"
((SELECT id FROM interests WHERE name_fr = 'Plongée sous-marine' LIMIT 1),
 'Quel niveau de plongée est requis ?',
 'Nos excursions s''adaptent à tous les niveaux, du débutant (Open Water) au plongeur avancé. Les sites sont sélectionnés selon votre certification.',
 1),

((SELECT id FROM interests WHERE name_fr = 'Plongée sous-marine' LIMIT 1),
 'L''équipement est-il fourni ?',
 'Oui, tout l''équipement de plongée professionnel est inclus : combinaison, masque, palmes, détendeur, gilet stabilisateur et bouteilles.',
 2),

((SELECT id FROM interests WHERE name_fr = 'Plongée sous-marine' LIMIT 1),
 'Quelle est la visibilité sous l''eau ?',
 'Madagascar offre une excellente visibilité, généralement entre 20-30 mètres. Les meilleures conditions sont d''avril à décembre.',
 3);

-- FAQ pour la Randonnée
INSERT INTO faqs (interest_id, question, answer, order_index) VALUES
((SELECT id FROM interests WHERE name_fr = 'Randonnée' LIMIT 1),
 'Quel niveau de difficulté pour les randonnées ?',
 'Nous proposons des randonnées de tous niveaux : faciles (2-4h), modérées (4-6h) et difficiles (6-8h+). Le niveau est toujours précisé.',
 1),

((SELECT id FROM interests WHERE name_fr = 'Randonnée' LIMIT 1),
 'Que faut-il apporter ?',
 'Chaussures de randonnée, vêtements légers, chapeau, crème solaire, gourde. Un guide détaillé est fourni avant le départ.',
 2),

((SELECT id FROM interests WHERE name_fr = 'Randonnée' LIMIT 1),
 'Y a-t-il des guides locaux ?',
 'Absolument ! Tous nos guides sont locaux, expérimentés et parlent français. Ils connaissent parfaitement la faune, flore et culture locale.',
 3);

-- FAQ pour l'Observation de la faune
INSERT INTO faqs (interest_id, question, answer, order_index) VALUES
((SELECT id FROM interests WHERE name_fr = 'Observation de la faune' LIMIT 1),
 'Quels animaux peut-on observer ?',
 'Madagascar abrite une faune unique : lémuriens, fossas, caméléons, tenrecs, et plus de 200 espèces d''oiseaux endémiques.',
 1),

((SELECT id FROM interests WHERE name_fr = 'Observation de la faune' LIMIT 1),
 'Quelle est la meilleure période ?',
 'La saison sèche (mai-octobre) est idéale. Les animaux sont plus actifs le matin et en fin d''après-midi.',
 2),

((SELECT id FROM interests WHERE name_fr = 'Observation de la faune' LIMIT 1),
 'Faut-il des jumelles ?',
 'Nous fournissons des jumelles professionnelles, mais vous pouvez apporter les vôtres si vous préférez.',
 3);

-- FAQ pour la Culture locale
INSERT INTO faqs (interest_id, question, answer, order_index) VALUES
((SELECT id FROM interests WHERE name_fr = 'Culture locale' LIMIT 1),
 'Comment se déroulent les visites culturelles ?',
 'Nos visites incluent des rencontres avec les communautés locales, découverte de l''artisanat, traditions et parfois participation aux activités quotidiennes.',
 1),

((SELECT id FROM interests WHERE name_fr = 'Culture locale' LIMIT 1),
 'Y a-t-il des règles à respecter ?',
 'Oui, nous respectons les "fady" (tabous) locaux. Un briefing culturel est donné avant chaque visite pour assurer le respect mutuel.',
 2);

-- FAQ pour la Gastronomie
INSERT INTO faqs (interest_id, question, answer, order_index) VALUES
((SELECT id FROM interests WHERE name_fr = 'Gastronomie' LIMIT 1),
 'La cuisine malgache est-elle épicée ?',
 'La cuisine malgache est généralement douce, avec des influences africaines, asiatiques et françaises. Le niveau d''épices s''adapte à vos goûts.',
 1),

((SELECT id FROM interests WHERE name_fr = 'Gastronomie' LIMIT 1),
 'Y a-t-il des options végétariennes ?',
 'Absolument ! Madagascar offre une grande variété de fruits, légumes et légumineuses. Nous adaptons tous nos menus aux régimes spéciaux.',
 2);

-- =====================================================
-- VUE POUR RÉCUPÉRER LES FAQ DES PACKS
-- =====================================================

CREATE OR REPLACE VIEW pack_faqs AS
SELECT DISTINCT
  p.id as pack_id,
  p.title as pack_title,
  f.id as faq_id,
  f.question,
  f.answer,
  f.order_index,
  i.name_fr as interest_name,
  i.icon as interest_icon
FROM packs p
JOIN pack_interests pi ON p.id = pi.pack_id
JOIN interests i ON pi.interest_id = i.id
JOIN faqs f ON i.id = f.interest_id
WHERE p.status = 'published' 
  AND f.is_active = true
ORDER BY p.id, i.name_fr, f.order_index;

-- =====================================================
-- POLITIQUES RLS (si nécessaire)
-- =====================================================

-- Les FAQ sont publiquement lisibles
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "FAQ publiquement lisibles" ON faqs
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin peut gérer les FAQ" ON faqs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Commentaires pour documentation
COMMENT ON TABLE faqs IS 'FAQ liées aux centres d''intérêt - permettent aux packs d''hériter des FAQ via leurs centres d''intérêt';
COMMENT ON VIEW pack_faqs IS 'Vue pour récupérer toutes les FAQ d''un pack via ses centres d''intérêt';