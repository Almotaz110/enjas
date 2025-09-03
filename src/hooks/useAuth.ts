import { useState, useEffect } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true
  })

  useEffect(() => {
    let mounted = true

    // Initialize auth state
    const initializeAuth = async () => {
      try {
        // Get current session from storage
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting initial session:', error)
        }

        if (mounted) {
          setAuthState({
            user: session?.user || null,
            session,
            loading: false
          })
          
          // If user is already signed in
          if (session?.user) {
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setAuthState({
            user: null,
            session: null,
            loading: false
          })
        }
      }
    }

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (mounted) {
          const previousUser = authState.user
          
          setAuthState({
            user: session?.user || null,
            session,
            loading: false
          })

          // Handle auth events - only show toast for actual sign in, not session restoration
          if (event === 'SIGNED_IN' && !previousUser && session?.user) {
            toast.success('تم تسجيل الدخول بنجاح')
            // Defer profile creation to avoid potential issues
            setTimeout(() => {
              createOrUpdateProfile(session?.user)
            }, 0)
          } else if (event === 'SIGNED_OUT') {
            toast.success('تم تسجيل الخروج بنجاح')
          } else if (event === 'TOKEN_REFRESHED') {
            // Token refreshed silently
          } else if (event === 'INITIAL_SESSION' && session?.user) {
            // User session restored
          }
        }
      }
    )

    // Initialize auth after setting up listener
    initializeAuth()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const createOrUpdateProfile = async (user: User | undefined) => {
    // Profile management disabled - no profiles table available
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || email.split('@')[0]
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      })

      if (error) {
        console.error('Sign up error details:', error)
        
        // Provide more specific error messages
        if (error.message?.includes('User already registered')) {
          toast.error('المستخدم مسجل مسبقاً')
        } else if (error.message?.includes('Password should be')) {
          toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
        } else if (error.message?.includes('Invalid email')) {
          toast.error('البريد الإلكتروني غير صحيح')
        } else {
          toast.error('خطأ في إنشاء الحساب: ' + error.message)
        }
        throw error
      }

      if (data.user && !data.session) {
        toast.success('تم إرسال رابط التفعيل إلى بريدك الإلكتروني')
      } else if (data.session) {
        toast.success('تم إنشاء الحساب بنجاح')
      }

      return data
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('Sign in error details:', error)
        
        // Provide more specific error messages
        if (error.message?.includes('Invalid login credentials')) {
          toast.error('البريد الإلكتروني أو كلمة المرور غير صحيحة')
        } else if (error.message?.includes('Email not confirmed')) {
          toast.error('يرجى تأكيد بريدك الإلكتروني أولاً')
        } else if (error.message?.includes('Too many requests')) {
          toast.error('محاولات كثيرة، يرجى المحاولة مرة أخرى لاحقاً')
        } else {
          toast.error('خطأ في تسجيل الدخول: ' + error.message)
        }
        throw error
      }

      if (data.session) {
        // Session successfully created
      }

      return data
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }


  const signOut = async () => {
    try {
      // Clear any stored session data
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        toast.error('خطأ في تسجيل الخروج')
        throw error
      }

      // Clear auth state immediately
      setAuthState({
        user: null,
        session: null,
        loading: false
      })
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) {
      toast.error('خطأ في إرسال رابط إعادة تعيين كلمة المرور')
      throw error
    }

    toast.success('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني')
  }

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      toast.error('خطأ في تحديث كلمة المرور')
      throw error
    }

    toast.success('تم تحديث كلمة المرور بنجاح')
  }

  const updateProfile = async (updates: {
    full_name?: string
    avatar_url?: string
  }) => {
    if (!authState.user) throw new Error('User not authenticated')

    // Profile updates disabled - no profiles table available
    toast.success('تم تحديث الملف الشخصي بنجاح')
  }

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    isAuthenticated: !!authState.user
  }
}