import React, { lazy, Suspense, memo } from 'react'
import { TravelerLayout } from '../layout/TravelerLayout'
import { OptimizedLoadingScreen } from '../common/OptimizedLoadingScreen'
import { LoginRequiredPage } from '../common/LoginRequiredPage'
import { useNavigationStore, usePacksStore } from '../../stores'
import { PageType } from '../../types'

// ✅ HomePage chargée DIRECTEMENT (pas de lazy) car c'est la landing page principale
import { HomePage } from '../traveler/HomePage'

// ✅ Lazy loading des autres composants traveler - Syntaxe corrigée pour les exports nommés
const AboutPage = lazy(() => import('../traveler/AboutPage').then(m => ({ default: m.AboutPage })))
const BlogPage = lazy(() => import('../traveler/BlogPage').then(m => ({ default: m.BlogPage })))
const PartnersPage = lazy(() => import('../traveler/PartnersPage').then(m => ({ default: m.PartnersPage })))
const ContactPage = lazy(() => import('../traveler/ContactPage').then(m => ({ default: m.ContactPage })))
const DestinationsPage = lazy(() => import('../traveler/DestinationsPage').then(m => ({ default: m.DestinationsPage })))
const PackCatalog = lazy(() => import('../traveler/PackCatalogSimple').then(m => ({ default: m.PackCatalogSimple })))
const PackDetail = lazy(() => import('../traveler/PackDetail').then(m => ({ default: m.PackDetail })))
const FavoritesPageSupabase = lazy(() => import('../traveler/FavoritesPageSupabase').then(m => ({ default: m.FavoritesPageSupabase })))
const BookingsPageSupabase = lazy(() => import('../traveler/BookingsPageSupabase').then(m => ({ default: m.BookingsPageSupabase })))
const ReviewsPageSupabase = lazy(() => import('../traveler/ReviewsPageSupabase').then(m => ({ default: m.ReviewsPageSupabase })))
const NotificationsPage = lazy(() => import('../traveler/NotificationsPage').then(m => ({ default: m.NotificationsPage })))
const ProfilePage = lazy(() => import('../traveler/ProfilePage').then(m => ({ default: m.ProfilePage })))
const MessagingSystem = lazy(() => import('../messaging/MessagingSystem').then(m => ({ default: m.MessagingSystem })))
const PackGallery = lazy(() => import('../traveler/PackGallery').then(m => ({ default: m.PackGallery })))

interface TravelerRouterProps {
  user: any
}

/**
 * Helper pour vérifier si la page courante est une page traveler valide
 */
function isTravelerPage(page: PageType | string): page is PageType {
  const travelerPages: PageType[] = ['home', 'about', 'blog', 'partners', 'contact', 'destinations', 'catalog', 'favorites', 'bookings', 'reviews', 'profile', 'notifications', 'pack-detail', 'pack-gallery']
  return travelerPages.includes(page as PageType)
}

/**
 * Routeur voyageur - Gère toute l'interface voyageur/publique
 * Externalisé d'App.tsx pour simplifier le composant principal
 */
export const TravelerRouter = memo(function TravelerRouter({ user }: TravelerRouterProps) {
  const navigation = useNavigationStore()
  const packs = usePacksStore()

  // ✅ Type safety : s'assurer que la page courante est valide pour TravelerLayout
  const currentPage = isTravelerPage(navigation.currentPage) 
    ? navigation.currentPage 
    : 'home' // Fallback sécurisé

  return (
    <TravelerLayout 
      currentPage={currentPage}
      onPageChange={navigation.handlePageChange}
      showLoginButton={!user}
      onLoginClick={navigation.handleLoginClick}
    >
      <Suspense fallback={<OptimizedLoadingScreen />}>
        {currentPage === 'home' && (
          <HomePage 
            onPageChange={navigation.handlePageChange}
            onPackSelect={(pack) => packs.handlePackSelect(pack, navigation.handlePageChange)}
          />
        )}
        {currentPage === 'about' && <AboutPage />}
        {currentPage === 'blog' && <BlogPage />}
        {currentPage === 'partners' && <PartnersPage />}
        {currentPage === 'contact' && <ContactPage />}
        {currentPage === 'destinations' && (
          <DestinationsPage 
            onDestinationSelect={(destinationId) => {
              console.log('Destination sélectionnée:', destinationId)
              // TODO: Naviguer vers une page détail de destination ou filtrer les packs
              navigation.handlePageChange('catalog')
            }}
          />
        )}
        {currentPage === 'catalog' && <PackCatalog 
          onLoginRequest={navigation.handleLoginClick} 
          onPackSelect={(pack) => packs.handlePackSelect(pack, navigation.handlePageChange)} 
        />}
        {currentPage === 'pack-detail' && packs.selectedPack && (
          <PackDetail
            pack={packs.selectedPack}
            onBack={() => packs.handleBackFromPackDetail(navigation.handlePageChange)}
            onToggleFavorite={(packId) => packs.handleToggleFavorite(packId, user)}
            favoriteLoading={packs.favoriteLoading === packs.selectedPack.id}
            onLoginRequest={navigation.handleLoginClick}
          />
        )}
        {currentPage === 'pack-gallery' && packs.selectedPack && (
          <PackGallery
            pack={packs.selectedPack}
            onBack={() => packs.handleBackFromPackGallery(navigation.handlePageChange)}
          />
        )}
        {currentPage === 'favorites' && user && (
          <FavoritesPageSupabase 
            onPageChange={navigation.handlePageChange}
            onPackSelect={(pack) => packs.handlePackSelect(pack, navigation.handlePageChange)}
          />
        )}
        
        {/* Pages nécessitant une authentification */}
        {currentPage === 'bookings' && (
          user ? (
            <BookingsPageSupabase />
          ) : (
            <LoginRequiredPage 
              title="Mes réservations"
              description="Veuillez vous connecter pour accéder à vos réservations."
              onLoginClick={navigation.handleLoginClick}
            />
          )
        )}
        
        {currentPage === 'reviews' && (
          user ? (
            <ReviewsPageSupabase />
          ) : (
            <LoginRequiredPage 
              title="Mes avis"
              description="Veuillez vous connecter pour accéder à vos avis."
              onLoginClick={navigation.handleLoginClick}
            />
          )
        )}
        
        {currentPage === 'notifications' && (
          user ? (
            <NotificationsPage />
          ) : (
            <LoginRequiredPage 
              title="Notifications"
              description="Veuillez vous connecter pour accéder aux notifications."
              onLoginClick={navigation.handleLoginClick}
            />
          )
        )}
        
        {currentPage === 'profile' && (
          user ? (
            <ProfilePage />
          ) : (
            <LoginRequiredPage 
              title="Mon profil"
              description="Veuillez vous connecter pour accéder à votre profil."
              onLoginClick={navigation.handleLoginClick}
            />
          )
        )}
        
        {currentPage === 'messages' && (
          user ? (
            <MessagingSystem />
          ) : (
            <LoginRequiredPage 
              title="Messages"
              description="Veuillez vous connecter pour accéder à vos messages."
              onLoginClick={navigation.handleLoginClick}
            />
          )
        )}
      </Suspense>
    </TravelerLayout>
  )
})