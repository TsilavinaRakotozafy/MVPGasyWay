-- =================================================================
-- SYSTÈME DE MESSAGERIE TEMPS RÉEL POUR GASYWAY
-- Optimisé pour performance et temps réel (PAS DE VUES)
-- =================================================================

-- 1. Table des conversations
CREATE TABLE conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type conversation_type NOT NULL DEFAULT 'booking_support',
    title VARCHAR(255),
    
    -- Participants (pour support = user + admin)
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Contexte métier
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    pack_id UUID REFERENCES packs(id) ON DELETE SET NULL,
    
    -- Statut
    status conversation_status NOT NULL DEFAULT 'active',
    priority priority_level NOT NULL DEFAULT 'normal',
    
    -- Métadonnées
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table des messages (optimisée pour temps réel)
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    
    -- Expéditeur
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_role user_role NOT NULL, -- Cache pour éviter JOIN
    
    -- Contenu
    content TEXT NOT NULL,
    message_type message_type NOT NULL DEFAULT 'text',
    
    -- Métadonnées
    attachments JSONB, -- URLs de fichiers
    metadata JSONB, -- Données spécifiques (géolocalisation, etc.)
    
    -- État du message
    is_system_message BOOLEAN DEFAULT FALSE,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    
    -- Timestamp (crucial pour ordre et temps réel)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table des statuts de lecture (optimisée)
CREATE TABLE message_read_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contrainte unique pour éviter doublons
    UNIQUE(message_id, user_id)
);

-- 4. Enums pour typage strict
CREATE TYPE conversation_type AS ENUM (
    'booking_support',
    'general_support', 
    'pack_inquiry',
    'payment_issue',
    'emergency'
);

CREATE TYPE conversation_status AS ENUM (
    'active',
    'resolved',
    'closed',
    'escalated'
);

CREATE TYPE priority_level AS ENUM (
    'low',
    'normal', 
    'high',
    'urgent'
);

CREATE TYPE message_type AS ENUM (
    'text',
    'image',
    'file',
    'location',
    'system'
);

-- 5. INDEX CRITIQUES pour performance temps réel
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_admin_id ON conversations(admin_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- Index composites pour requêtes fréquentes
CREATE INDEX idx_conversations_user_status ON conversations(user_id, status);
CREATE INDEX idx_conversations_admin_status ON conversations(admin_id, status) WHERE admin_id IS NOT NULL;

-- Messages - INDEX CRITIQUES
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Statut lecture - INDEX CRITIQUES  
CREATE INDEX idx_message_read_status_message_id ON message_read_status(message_id);
CREATE INDEX idx_message_read_status_user_id ON message_read_status(user_id);

-- 6. TRIGGERS pour mise à jour automatique des conversations
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET 
        last_message_at = NEW.created_at,
        last_message_preview = LEFT(NEW.content, 100),
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_last_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();

-- 7. FONCTION pour marquer messages comme lus
CREATE OR REPLACE FUNCTION mark_messages_as_read(
    p_conversation_id UUID,
    p_user_id UUID,
    p_until_message_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO message_read_status (message_id, user_id)
    SELECT m.id, p_user_id
    FROM messages m
    WHERE m.conversation_id = p_conversation_id
      AND m.sender_id != p_user_id  -- Pas ses propres messages
      AND (p_until_message_id IS NULL OR m.created_at <= (
          SELECT created_at FROM messages WHERE id = p_until_message_id
      ))
      AND NOT EXISTS (
          SELECT 1 FROM message_read_status mrs 
          WHERE mrs.message_id = m.id AND mrs.user_id = p_user_id
      );
END;
$$ LANGUAGE plpgsql;

-- 8. FONCTION pour compter messages non lus
CREATE OR REPLACE FUNCTION get_unread_messages_count(
    p_user_id UUID,
    p_conversation_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER INTO unread_count
    FROM messages m
    WHERE (p_conversation_id IS NULL OR m.conversation_id = p_conversation_id)
      AND m.sender_id != p_user_id  -- Pas ses propres messages
      AND EXISTS (
          SELECT 1 FROM conversations c 
          WHERE c.id = m.conversation_id 
            AND (c.user_id = p_user_id OR c.admin_id = p_user_id)
      )
      AND NOT EXISTS (
          SELECT 1 FROM message_read_status mrs 
          WHERE mrs.message_id = m.id AND mrs.user_id = p_user_id
      );
    
    RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql;

-- 9. RLS POLICIES sécurisées
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_status ENABLE ROW LEVEL SECURITY;

-- Conversations : accès utilisateur ou admin assigné
CREATE POLICY "Users can access their conversations" ON conversations
    FOR ALL USING (
        user_id = auth.uid() OR 
        admin_id = auth.uid() OR
        (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    );

-- Messages : accès via conversation
CREATE POLICY "Users can access messages in their conversations" ON messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM conversations c 
            WHERE c.id = conversation_id 
              AND (c.user_id = auth.uid() OR c.admin_id = auth.uid() OR
                   EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
        )
    );

-- Statuts lecture : propres statuts uniquement
CREATE POLICY "Users can manage their own read status" ON message_read_status
    FOR ALL USING (user_id = auth.uid());

-- 10. FONCTIONS MÉTIER pour l'application
-- Créer conversation support
CREATE OR REPLACE FUNCTION create_support_conversation(
    p_user_id UUID,
    p_booking_id UUID DEFAULT NULL,
    p_pack_id UUID DEFAULT NULL,
    p_title VARCHAR(255) DEFAULT NULL,
    p_first_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    conversation_id UUID;
    message_id UUID;
BEGIN
    -- Créer la conversation
    INSERT INTO conversations (user_id, booking_id, pack_id, title, type)
    VALUES (p_user_id, p_booking_id, p_pack_id, p_title, 'booking_support')
    RETURNING id INTO conversation_id;
    
    -- Ajouter le premier message si fourni
    IF p_first_message IS NOT NULL THEN
        INSERT INTO messages (conversation_id, sender_id, sender_role, content)
        VALUES (conversation_id, p_user_id, 'traveler', p_first_message);
    END IF;
    
    RETURN conversation_id;
END;
$$ LANGUAGE plpgsql;

-- 11. INDEXES pour Supabase Realtime (optimisation)
-- Ces indexes supportent les subscriptions temps réel
CREATE INDEX idx_messages_realtime ON messages(conversation_id, created_at DESC, sender_id);
CREATE INDEX idx_conversations_realtime ON conversations(user_id, admin_id, last_message_at DESC) WHERE status = 'active';

-- 12. COMMENTAIRES pour documentation
COMMENT ON TABLE conversations IS 'Conversations entre utilisateurs et support admin';
COMMENT ON TABLE messages IS 'Messages individuels dans les conversations - optimisé temps réel';
COMMENT ON TABLE message_read_status IS 'Statut de lecture des messages par utilisateur';

COMMENT ON FUNCTION mark_messages_as_read IS 'Marque les messages comme lus pour un utilisateur';
COMMENT ON FUNCTION get_unread_messages_count IS 'Compte les messages non lus pour un utilisateur';
COMMENT ON FUNCTION create_support_conversation IS 'Crée une nouvelle conversation de support';