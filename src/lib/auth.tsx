import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { hasSupabase, supabase } from './supabase'
import type { Profile } from './types'

interface AuthValue {
  /** null while we are still checking, or when the app runs offline. */
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  /** True when there is no Supabase project, so nothing is saved. */
  offline: boolean
  signInWithEmail: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthValue>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  offline: true,
  signInWithEmail: async () => ({ error: 'Supabase is not set up.' }),
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(hasSupabase)

  const loadProfile = useCallback(async (userId: string) => {
    if (!supabase) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    if (data) setProfile(data as Profile)
  }, [])

  useEffect(() => {
    if (!supabase) return

    let cancelled = false

    async function start() {
      if (!supabase) return
      const { data } = await supabase.auth.getSession()
      if (cancelled) return

      if (data.session) {
        setSession(data.session)
        await loadProfile(data.session.user.id)
      } else {
        // Give every visitor a private account straight away, so their
        // progress is saved without asking them to type anything.
        const { data: anon } = await supabase.auth.signInAnonymously()
        if (!cancelled && anon.session) {
          setSession(anon.session)
          await loadProfile(anon.session.user.id)
        }
      }
      if (!cancelled) setLoading(false)
    }

    void start()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      if (next?.user) void loadProfile(next.user.id)
      else setProfile(null)
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [loadProfile])

  const signInWithEmail = useCallback(async (email: string) => {
    if (!supabase) return { error: 'Supabase is not set up.' }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    return { error: error?.message ?? null }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setProfile(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id)
  }, [session, loadProfile])

  const value = useMemo<AuthValue>(
    () => ({
      user: session?.user ?? null,
      session,
      profile,
      loading,
      offline: !hasSupabase,
      signInWithEmail,
      signOut,
      refreshProfile,
    }),
    [session, profile, loading, signInWithEmail, signOut, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
