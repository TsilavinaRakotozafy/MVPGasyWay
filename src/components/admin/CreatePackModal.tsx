// Composant déprécié - Utilisez CreatePackSheetTabbed à la place
import { CreatePackSheetTabbed } from './CreatePackSheetTabbed'

interface CreatePackModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  categories: any[]
}

// Redirection vers le nouveau composant Sheet
export function CreatePackModal(props: CreatePackModalProps) {
  console.warn('CreatePackModal est déprécié. Utilisez CreatePackSheetTabbed à la place.')
  return <CreatePackSheetTabbed {...props} />
}