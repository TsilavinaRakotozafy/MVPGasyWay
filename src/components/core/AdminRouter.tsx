import React, { lazy, Suspense, memo } from 'react'
import { AdminLayout } from '../layout/AdminLayout'
import { OptimizedLoadingScreen } from '../common/OptimizedLoadingScreen'
import { ComingSoonSection } from '../common/ComingSoonSection'
import { useNavigationStore } from '../../stores'
import { AdminPageType } from '../../types'

// ✅ Lazy loading des composants admin - Syntaxe corrigée pour les exports nommés
const Dashboard = lazy(() => import('../admin/Dashboard').then(m => ({ default: m.Dashboard })))
const UsersManagement = lazy(() => import('../admin/UsersManagement').then(m => ({ default: m.UsersManagement })))
const PacksManagement = lazy(() => import('../admin/PacksManagement').then(m => ({ default: m.PacksManagement })))
const RegionsManagement = lazy(() => import('../admin/RegionsManagementSimple').then(m => ({ default: m.RegionsManagement })))
const PartnersManagement = lazy(() => import('../admin/PartnersManagement').then(m => ({ default: m.PartnersManagement })))
const BookingsManagement = lazy(() => import('../admin/BookingsManagement').then(m => ({ default: m.BookingsManagement })))
const ReviewsManagement = lazy(() => import('../admin/ReviewsManagement').then(m => ({ default: m.ReviewsManagement })))
const NotificationsManagement = lazy(() => import('../admin/NotificationsManagement').then(m => ({ default: m.NotificationsManagement })))
const ServicesManagement = lazy(() => import('../admin/ServicesManagement').then(m => ({ default: m.ServicesManagement })))
const MessagesManagement = lazy(() => import('../admin/MessagesManagement').then(m => ({ default: m.MessagesManagement })))
const InterestsManagementSQLComplete = lazy(() => import('../admin/InterestsManagementSQLComplete').then(m => ({ default: m.InterestsManagementSQLComplete })))
const FAQsManagement = lazy(() => import('../admin/FAQsManagement').then(m => ({ default: m.FAQsManagement })))
const DesignSystemManagement = lazy(() => import('../admin/DesignSystemManagement').then(m => ({ default: m.DesignSystemManagement })))
const BrandSettingsManagement = lazy(() => import('../admin/BrandSettingsManagement').then(m => ({ default: m.BrandSettingsManagement })))
const DesignSystemChecker = lazy(() => import('../admin/DesignSystemChecker').then(m => ({ default: m.DesignSystemChecker })))
const SupabaseConfigHelper = lazy(() => import('../admin/SupabaseConfigHelper').then(m => ({ default: m.SupabaseConfigHelper })))
const StorageUploadDiagnostic = lazy(() => import('../admin/StorageUploadDiagnostic').then(m => ({ default: m.StorageUploadDiagnostic })))
const RegionsImagesDiagnostic = lazy(() => import('../admin/RegionsImagesDiagnostic').then(m => ({ default: m.RegionsImagesDiagnostic })))
const RegionsFallbackTest = lazy(() => import('../admin/RegionsFallbackTest').then(m => ({ default: m.RegionsFallbackTest })))
const AuthSyncManager = lazy(() => import('../admin/AuthSyncManager').then(m => ({ default: m.AuthSyncManager })))
const LegalPagesManagement = lazy(() => import('../admin/LegalPagesManagement').then(m => ({ default: m.LegalPagesManagement })))
const CompanyInfoManagement = lazy(() => import('../admin/CompanyInfoManagement').then(m => ({ default: m.CompanyInfoManagement })))

// Composant memoïsé pour éviter les re-rendus
const MemoizedComingSoonSection = memo(ComingSoonSection)

interface AdminRouterProps {
  user: any
}

/**
 * Routeur admin - Gère toute l'interface d'administration
 * Externalisé d'App.tsx pour simplifier le composant principal
 */
export const AdminRouter = memo(function AdminRouter({ user }: AdminRouterProps) {
  const navigation = useNavigationStore()

  return (
    <AdminLayout currentPage={navigation.currentPage} onPageChange={navigation.handlePageChange}>
      <Suspense fallback={<OptimizedLoadingScreen />}>
        {navigation.currentPage === 'dashboard' && <Dashboard />}
        {navigation.currentPage === 'interests' && <InterestsManagementSQLComplete user={user} />}
        {navigation.currentPage === 'regions' && <RegionsManagement />}
        {navigation.currentPage === 'partners' && <PartnersManagement />}
        {navigation.currentPage === 'packs' && <PacksManagement />}
        {navigation.currentPage === 'services' && <ServicesManagement />}
        {navigation.currentPage === 'bookings' && <BookingsManagement />}
        {navigation.currentPage === 'payments' && (
          <MemoizedComingSoonSection
            title="Paiements"
            description="Gestion des paiements"
          />
        )}
        {navigation.currentPage === 'reviews' && <ReviewsManagement />}
        {navigation.currentPage === 'users' && <UsersManagement />}
        {navigation.currentPage === 'notifications' && <NotificationsManagement />}
        {navigation.currentPage === 'messages' && <MessagesManagement />}
        {navigation.currentPage === 'audit-logs' && (
          <MemoizedComingSoonSection
            title="Audit Logs"
            description="Journal d'audit des actions"
          />
        )}
        {navigation.currentPage === 'profile' && (
          <MemoizedComingSoonSection
            title="Mon profil"
            description="Gestion du profil administrateur"
          />
        )}
        {navigation.currentPage === 'faqs' && <FAQsManagement />}
        {navigation.currentPage === 'legal-pages' && <LegalPagesManagement />}
        {navigation.currentPage === 'company-info' && <CompanyInfoManagement />}
        {navigation.currentPage === 'design-system' && <DesignSystemManagement />}
        {navigation.currentPage === 'brand-settings' && <BrandSettingsManagement />}
        {navigation.currentPage === 'design-checker' && <DesignSystemChecker />}
        {navigation.currentPage === 'supabase-config' && <SupabaseConfigHelper />}
        {navigation.currentPage === 'storage-diagnostic' && <StorageUploadDiagnostic />}
        {navigation.currentPage === 'regions-images-diagnostic' && <RegionsImagesDiagnostic />}
        {navigation.currentPage === 'regions-fallback-test' && <RegionsFallbackTest />}
        {navigation.currentPage === 'auth-sync-fixer' && <AuthSyncManager />}
      </Suspense>
    </AdminLayout>
  )
})