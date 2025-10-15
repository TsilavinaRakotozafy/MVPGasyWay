import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { safeMultiFieldSearch } from '../../utils/safeSearch'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Label } from '../ui/label'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { 
  Search, 
  MoreHorizontal, 
  Shield, 
  ShieldOff, 
  UserCheck, 
  Trash2,
  Filter,
  Plus,
  UserPlus
} from 'lucide-react'
import { supabase } from '../../utils/supabase/client'
import { toast } from 'sonner@2.0.3'
import { projectId, publicAnonKey } from '../../utils/supabase/info'


interface UserWithProfile {
  id: string
  email: string
  status: 'active' | 'blocked' | 'pending'
  created_at: string
  profiles: {
    id: string
    first_name: string
    last_name: string
    role: 'traveler' | 'admin' | 'partner_stub'
    avatar_url?: string
    created_at: string
  }
}

export function UsersManagement() {
  const [users, setUsers] = useState<UserWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [updating, setUpdating] = useState<string | null>(null)
  
  // États pour la création d'utilisateur
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'traveler' as 'traveler' | 'admin' | 'partner_stub'
  })

  useEffect(() => {
    loadUsers()
  }, [searchTerm, statusFilter, roleFilter])

  async function loadUsers() {
    try {
      setLoading(true)
      
      // Utiliser l'API backend pour récupérer les utilisateurs
      const session = await supabase.auth.getSession()
      if (!session.data.session?.access_token) {
        toast.error('Session expirée, veuillez vous reconnecter')
        return
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-3aa6b185/admin/users`, {
        headers: {
          'Authorization': `Bearer ${session.data.session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors du chargement')
      }

      const usersData = await response.json()
      let filteredUsers = usersData || []

      // Filtrer par nom/email côté client
      if (searchTerm) {
        filteredUsers = filteredUsers.filter((user: any) => 
          safeMultiFieldSearch([
            user?.email,
            user?.profiles?.first_name,
            user?.profiles?.last_name
          ], searchTerm)
        )
      }

      // Filtrer par statut côté client
      if (statusFilter) {
        filteredUsers = filteredUsers.filter((user: any) => user.status === statusFilter)
      }

      // Filtrer par rôle côté client
      if (roleFilter) {
        filteredUsers = filteredUsers.filter((user: any) => 
          user.profiles?.role === roleFilter
        )
      }

      setUsers(filteredUsers)
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error)
      toast.error('Erreur lors du chargement des utilisateurs')
    } finally {
      setLoading(false)
    }
  }

  async function updateUserStatus(userId: string, newStatus: string) {
    setUpdating(userId)
    
    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session?.access_token) {
        toast.error('Session expirée, veuillez vous reconnecter')
        return
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-3aa6b185/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session.access_token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la mise à jour')
      }

      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, status: newStatus as any }
          : user
      ))

      toast.success(`Statut utilisateur mis à jour`)
    } catch (error: any) {
      console.error('Erreur mise à jour statut:', error)
      toast.error(error.message || 'Erreur lors de la mise à jour')
    } finally {
      setUpdating(null)
    }
  }

  async function softDeleteUser(userId: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? L\'utilisateur sera bloqué ou supprimé selon les contraintes système.')) {
      return
    }

    setUpdating(userId)
    
    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session?.access_token) {
        toast.error('Session expirée, veuillez vous reconnecter')
        return
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-3aa6b185/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.data.session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la suppression')
      }

      const result = await response.json()
      
      // Si l'utilisateur a été bloqué au lieu d'être supprimé
      if (result.blocked && !result.authDeleted) {
        setUsers(prev => prev.map(user => 
          user.id === userId 
            ? { ...user, status: 'blocked' as any }
            : user
        ))
        toast.success('Utilisateur bloqué définitivement')
      } else {
        // Suppression complète
        setUsers(prev => prev.filter(user => user.id !== userId))
        toast.success(result.message || 'Utilisateur supprimé')
      }
    } catch (error: any) {
      console.error('Erreur suppression utilisateur:', error)
      toast.error(error.message || 'Erreur lors de la suppression')
    } finally {
      setUpdating(null)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'blocked': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'active': return 'Actif'
      case 'blocked': return 'Bloqué'
      case 'pending': return 'En attente'
      default: return status
    }
  }

  function getRoleColor(role: string) {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800'
      case 'partner_stub': return 'bg-blue-100 text-blue-800'
      case 'traveler': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  function getRoleLabel(role: string) {
    switch (role) {
      case 'admin': return 'Admin'
      case 'partner_stub': return 'Partenaire'
      case 'traveler': return 'Voyageur'
      default: return role
    }
  }

  async function createUser() {
    if (!newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName) {
      toast.error('Tous les champs sont requis')
      return
    }

    if (newUser.password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    setCreating(true)

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-3aa6b185/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la création')
      }

      toast.success('Utilisateur créé avec succès')
      setShowCreateDialog(false)
      setNewUser({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'traveler'
      })
      loadUsers() // Recharger la liste
    } catch (error: any) {
      console.error('Erreur création utilisateur:', error)
      toast.error(error.message || 'Erreur lors de la création')
    } finally {
      setCreating(false)
    }
  }

  function getInitials(user: UserWithProfile) {
    if (!user.profiles) return user.email[0].toUpperCase()
    const first = user.profiles.first_name?.[0] || ''
    const last = user.profiles.last_name?.[0] || ''
    return (first + last).toUpperCase() || user.email[0].toUpperCase()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl">Gestion des utilisateurs</h1>
          <p className="text-gray-600">Administrez les comptes utilisateurs de la plateforme</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Créer un utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
              <DialogDescription>
                Créez un compte utilisateur pour la plateforme GasyWay.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Jean"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Dupont"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="jean.dupont@email.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Rôle</Label>
                <select
                  id="role"
                  value={newUser.role}
                  onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                >
                  <option value="traveler">Voyageur</option>
                  <option value="admin">Administrateur</option>
                  <option value="partner_stub">Partenaire</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Annuler
              </Button>
              <Button onClick={createUser} disabled={creating}>
                {creating ? 'Création...' : 'Créer l\'utilisateur'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher utilisateurs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="blocked">Bloqués</option>
              <option value="pending">En attente</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="">Tous les rôles</option>
              <option value="traveler">Voyageurs</option>
              <option value="admin">Admins</option>
              <option value="partner_stub">Partenaires</option>
            </select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('')
                setRoleFilter('')
              }}
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle>
            Utilisateurs ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Affichage direct même pendant le chargement */}
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Chargement des utilisateurs...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Inscrit le</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.profiles?.avatar_url} alt={user.profiles?.first_name} />
                          <AvatarFallback className="text-xs">{getInitials(user)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {user.profiles?.first_name} {user.profiles?.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.profiles?.role || '')}>
                        {getRoleLabel(user.profiles?.role || '')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(user.status)}>
                        {getStatusLabel(user.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {user.status === 'active' ? (
                            <DropdownMenuItem
                              onClick={() => updateUserStatus(user.id, 'blocked')}
                              disabled={updating === user.id}
                            >
                              <ShieldOff className="mr-2 h-4 w-4" />
                              Bloquer
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => updateUserStatus(user.id, 'active')}
                              disabled={updating === user.id}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Débloquer
                            </DropdownMenuItem>
                          )}
                          
                          {user.status === 'pending' && (
                            <DropdownMenuItem
                              onClick={() => updateUserStatus(user.id, 'active')}
                              disabled={updating === user.id}
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Activer
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem
                            onClick={() => softDeleteUser(user.id)}
                            disabled={updating === user.id}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && users.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucun utilisateur trouvé avec ces critères.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}