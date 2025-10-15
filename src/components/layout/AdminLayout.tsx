import React, { useState } from 'react'
import { useBrandSettings } from '../../hooks/useBrandSettings'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu'
import { MenuItem } from '../common/MenuItem'
import { 
  BarChart3,
  Users,
  Package,
  MapPin,
  Building2,
  Calendar,
  CreditCard,
  Star,
  Bell,
  MessageCircle,
  Settings,
  FileText,
  User,
  LogOut,
  Menu,
  X,
  Database,
  HardDrive,
  MessageCircleQuestion,
  Palette,
  CheckCircle2,
  Activity,
  Upload,
  Shield
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContextSQL'
import { CookieSettingsLink } from '../common/CookieSettingsLink'

interface AdminLayoutProps {
  children: React.ReactNode
  currentPage: string
  onPageChange: (page: string) => void
}

export function AdminLayout({ children, currentPage, onPageChange }: AdminLayoutProps) {
  const { user, logout } = useAuth()
  const { settings: brandSettings } = useBrandSettings()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { 
      key: 'taxonomies', 
      label: 'Taxonomies', 
      icon: Settings,
      children: [
        { key: 'interests', label: 'Centres d\'intérêt', icon: Settings },
        { key: 'regions', label: 'Régions', icon: MapPin }
      ]
    },
    { key: 'partners', label: 'Partenaires', icon: Building2 },
    { key: 'packs', label: 'Packs', icon: Package },
    { key: 'services', label: 'Services', icon: Settings },
    { key: 'faqs', label: 'FAQ', icon: MessageCircleQuestion },
    { key: 'legal-pages', label: 'Pages Légales', icon: Shield },
    { key: 'company-info', label: 'Infos Entreprise', icon: Building2 },
    { key: 'bookings', label: 'Réservations', icon: Calendar },
    { key: 'payments', label: 'Paiements', icon: CreditCard },
    { key: 'reviews', label: 'Avis', icon: Star },
    { key: 'users', label: 'Utilisateurs', icon: Users },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'messages', label: 'Messages', icon: MessageCircle },
    { 
      key: 'design-tools', 
      label: 'Design System', 
      icon: Palette,
      children: [
        { key: 'design-system', label: 'Éditeur de thème', icon: Palette },
        { key: 'brand-settings', label: 'Logos & Marque', icon: Upload },
        { key: 'design-checker', label: 'Vérificateur', icon: CheckCircle2 }

      ]
    },
    { 
      key: 'dev-tools', 
      label: 'Outils Dev', 
      icon: Database,
      children: [
        { key: 'supabase-config', label: 'Configuration Supabase', icon: Database },
        { key: 'storage-diagnostic', label: 'Diagnostic Upload', icon: Upload },
        { key: 'regions-images-diagnostic', label: 'Storage Images Régions', icon: MapPin },
        { key: 'regions-fallback-test', label: 'Test Fallback Régions', icon: MapPin },
        { key: 'users-duplicates-fixer', label: 'Correcteur Doublons', icon: Database },
        { key: 'auth-structure-validator', label: 'Validateur Auth', icon: Database },
        { key: 'auth-sync-fixer', label: 'Synchronisation Auth', icon: Activity },
        { key: 'demo-routes', label: 'Test des routes', icon: Activity }
      ]
    },
    { key: 'audit-logs', label: 'Audit Logs', icon: FileText }
  ]

  function getInitials() {
    if (!user?.profile) return 'A'
    const first = user.profile.first_name?.[0] || ''
    const last = user.profile.last_name?.[0] || ''
    return (first + last).toUpperCase()
  }

  const renderNavItem = (item: any) => {
    const Icon = item.icon
    
    if (item.children) {
      return (
        <div key={item.key}>
          <div className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wider">
            {item.label}
          </div>
          {item.children.map((child: any) => {
            const ChildIcon = child.icon
            return (
              <button
                key={child.key}
                onClick={() => onPageChange(child.key)}
                className={`w-full flex items-center space-x-2 px-6 py-2 text-sm ${
                  currentPage === child.key
                    ? 'bg-secondary text-primary border-r-2 border-secondary'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <ChildIcon className="h-4 w-4" />
                <span>{child.label}</span>
              </button>
            )
          })}
        </div>
      )
    }

    return (
      <button
        key={item.key}
        onClick={() => onPageChange(item.key)}
        className={`w-full flex items-center space-x-2 px-3 py-2 text-sm ${
          currentPage === item.key
            ? 'bg-secondary text-primary border-r-2 border-secondary'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <Icon className="h-4 w-4" />
        <span>{item.label}</span>
      </button>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white shadow-sm w-64 fixed inset-y-0 left-0 z-50 transform ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 transition-transform duration-200 ease-in-out lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            {brandSettings.logo_header.startsWith('http') ? (
              <img 
                src={brandSettings.logo_header} 
                alt={brandSettings.brand_name} 
                className="h-6 w-auto"
              />
            ) : (
              <h1 className="text-xl text-primary font-medium">{brandSettings.logo_header} Admin</h1>
            )}
          </div>
          <button
            className="lg:hidden text-gray-600 hover:text-primary"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="mt-6 space-y-1">
          {navigation.map(renderNavItem)}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-6">
          <button
            className="lg:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex items-center space-x-4 ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profile?.avatar_url} alt={user?.profile?.first_name} />
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">
                      {user?.profile?.first_name} {user?.profile?.last_name}
                    </p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user?.email} • Admin
                    </p>
                  </div>
                </div>
                <MenuItem 
                  icon={User}
                  label="Mon profil"
                  onClick={() => onPageChange('profile')}
                />
                <MenuItem 
                  icon={LogOut}
                  label="Se déconnecter"
                  onClick={logout}
                  variant="destructive"
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 flex-1 overflow-y-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground flex items-center gap-4">
              <span>© {new Date().getFullYear()} GasyWay Admin. Tous droits réservés.</span>
              <CookieSettingsLink 
                variant="link" 
                size="sm" 
                className="text-muted-foreground hover:text-primary text-sm p-0 h-auto"
                showIcon={false}
              >
                Paramètres des cookies
              </CookieSettingsLink>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-muted-foreground">Centre d'aide</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-gray-600 bg-opacity-75 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}