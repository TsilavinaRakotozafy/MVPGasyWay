-- =========================================
-- Script de test du système Newsletter RGPD
-- =========================================

-- ✅ Tester l'insertion d'un abonné
INSERT INTO newsletter_subscribers (
  email,
  consent_given,
  consent_date,
  consent_source,
  consent_text,
  opted_in,
  subscription_date
) VALUES (
  'test@gasyway.com',
  true,
  NOW(),
  'Homepage Newsletter Form',
  'J''accepte de recevoir les offres, actualités et conseils de voyage de GasyWay par email.',
  true,
  NOW()
);

-- ✅ Vérifier l'insertion
SELECT 
  email,
  consent_date,
  consent_source,
  opted_in
FROM newsletter_subscribers
WHERE email = 'test@gasyway.com';

-- ✅ Tester les statistiques
SELECT * FROM newsletter_stats;

-- ✅ Tester l'export
SELECT * FROM export_newsletter_subscribers();

-- ✅ Tester le désabonnement
SELECT unsubscribe_from_newsletter('test@gasyway.com');

-- Vérifier que opted_in = false
SELECT 
  email,
  opted_in,
  unsubscribed_at
FROM newsletter_subscribers
WHERE email = 'test@gasyway.com';

-- ✅ Tester le réabonnement
SELECT resubscribe_to_newsletter('test@gasyway.com');

-- Vérifier que opted_in = true
SELECT 
  email,
  opted_in,
  unsubscribed_at
FROM newsletter_subscribers
WHERE email = 'test@gasyway.com';

-- ✅ Nettoyer les données de test
DELETE FROM newsletter_subscribers
WHERE email = 'test@gasyway.com';

-- =========================================
-- Résultats attendus
-- =========================================

/*
1. INSERT : ✅ 1 ligne insérée
2. SELECT : ✅ Affiche l'email avec consent_date, consent_source, opted_in = true
3. newsletter_stats : ✅ Affiche total_subscribers = 1
4. export_newsletter_subscribers : ✅ Affiche l'email avec toutes les infos
5. unsubscribe : ✅ Retourne true
6. Vérif opted_in : ✅ opted_in = false, unsubscribed_at = NOW()
7. resubscribe : ✅ Retourne true
8. Vérif opted_in : ✅ opted_in = true, unsubscribed_at = NULL
9. DELETE : ✅ 1 ligne supprimée

Si tous les tests passent, le système est opérationnel ! 🎉
*/
