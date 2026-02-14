import { toast as sonnerToast } from 'sonner'

type ToastProps = {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

export function useToast() {
  const toast = ({ title, description, variant }: ToastProps) => {
    const message = description || title || ''
    const titleText = description ? title : undefined

    if (variant === 'destructive') {
      sonnerToast.error(titleText || message, {
        description: titleText ? message : undefined,
      })
    } else {
      sonnerToast.success(titleText || message, {
        description: titleText ? message : undefined,
      })
    }
  }

  return { toast }
}
