import React from 'react'
import { Card, CardContent, CardHeader } from '../ui/card'
import { Skeleton } from '../ui/skeleton'

export function AuthSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-md w-full space-y-6 p-6">
        {/* Logo et titre */}
        <div className="text-center space-y-2">
          <div className="text-3xl mb-2">🇲🇬</div>
          <Skeleton className="h-8 w-32 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>

        {/* Formulaire de connexion */}
        <Card>
          <CardHeader className="text-center">
            <Skeleton className="h-6 w-24 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
            <div className="text-center">
              <Skeleton className="h-4 w-40 mx-auto" />
            </div>
          </CardContent>
        </Card>

        {/* Options supplémentaires */}
        <div className="space-y-2 text-center">
          <Skeleton className="h-4 w-32 mx-auto" />
          <div className="flex justify-center gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>
    </div>
  )
}