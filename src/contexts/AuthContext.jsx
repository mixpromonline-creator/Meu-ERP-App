import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();
const PROFILE_CACHE_KEY = 'erp_profile_cache_v1';

export const useAuth = () => {
  return useContext(AuthContext);
};

const buildFallbackProfile = (user) => ({
  id: user.id,
  full_name: user.user_metadata?.full_name || user.email || 'Usuario',
  role: 'admin',
  status: 'approved',
  business_type: null,
});

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stuck, setStuck] = useState(false);
  const profileRef = useRef(null);

  const withTimeout = (promise, ms, label) => {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(label || 'TIMEOUT')), ms)
    );
    return Promise.race([promise, timeout]);
  };

  const clearSupabaseStorage = () => {
    try {
      localStorage.removeItem('erp_sso_v2');
      localStorage.removeItem(PROFILE_CACHE_KEY);
      Object.keys(localStorage)
        .filter((key) => key.startsWith('sb-') && key.endsWith('-auth-token'))
        .forEach((key) => localStorage.removeItem(key));
    } catch (e) {
      // Ignora erros de acesso ao storage
    }
  };

  const getCachedProfile = (userId) => {
    try {
      const rawProfile = localStorage.getItem(PROFILE_CACHE_KEY);
      if (!rawProfile) return null;

      const parsedProfile = JSON.parse(rawProfile);
      return parsedProfile?.id === userId ? parsedProfile : null;
    } catch (error) {
      return null;
    }
  };

  const setCachedProfile = (nextProfile) => {
    try {
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(nextProfile));
    } catch (error) {
      // Ignora erros de acesso ao storage
    }
  };

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const signUp = async (email, password, fullName) => {
    try {
      const { data, error } = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        }),
        10000,
        'SUPABASE_SIGNUP_TIMEOUT'
      );
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email,
          password,
        }),
        10000,
        'SUPABASE_SIGNIN_TIMEOUT'
      );
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Erro ao encerrar sessao no Supabase. Limpando sessao local.', error);
    } finally {
      clearSupabaseStorage();
      setSession(null);
      setProfile(null);
      setStuck(false);
    }
  };

  const fetchProfile = async (user) => {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single(),
        8000,
        'SUPABASE_PROFILE_TIMEOUT'
      );

      if (data) {
        setProfile(data);
        setCachedProfile(data);
      } else {
        console.error('Nenhum perfil encontrado para o usuario:', error);
        setProfile((currentProfile) => currentProfile?.id === user.id ? currentProfile : buildFallbackProfile(user));
      }
    } catch (err) {
      console.error('Erro no fetchProfile:', err);
      setProfile((currentProfile) => currentProfile?.id === user.id ? currentProfile : buildFallbackProfile(user));
    } finally {
      setLoading(false);
      setStuck(false);
    }
  };

  const shouldRefreshProfile = (nextSession, currentProfile) => {
    if (!nextSession?.user) return false;
    if (!currentProfile) return true;
    return currentProfile.id !== nextSession.user.id;
  };

  useEffect(() => {
    let mounted = true;

    const masterTimeout = setTimeout(() => {
      if (mounted) {
        setLoading(false);
      }
    }, 12000);

    const stuckTimeout = setTimeout(() => {
      if (mounted && loading) {
        setStuck(true);
      }
    }, 18000);

    const bootstrap = async () => {
      try {
        const { data, error } = await withTimeout(
          supabase.auth.getSession(),
          10000,
          'SUPABASE_GETSESSION_TIMEOUT'
        );

        if (!mounted) return;

        if (error) {
          console.error('Erro ao restaurar sessao:', error);
        }

        const currentSession = data?.session || null;
        setSession(currentSession);

        if (currentSession) {
          const cachedProfile = getCachedProfile(currentSession.user.id);
          if (cachedProfile) {
            setProfile(cachedProfile);
          }
          await fetchProfile(currentSession.user);
        } else {
          setProfile(null);
          setLoading(false);
          setStuck(false);
        }
      } catch (err) {
        console.error('Erro no bootstrap de sessao:', err);
        if (!mounted) return;
        setLoading(false);
        setStuck(true);
      }
    };

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!mounted) return;

      setSession(nextSession);

      if (nextSession) {
        const cachedProfile = getCachedProfile(nextSession.user.id);
        const needsProfileRefresh = shouldRefreshProfile(nextSession, profileRef.current);
        if (cachedProfile) {
          setProfile(cachedProfile);
        }

        const isInitialLoginEvent = event === 'SIGNED_IN' || event === 'USER_UPDATED';
        if (needsProfileRefresh || (!cachedProfile && isInitialLoginEvent)) {
          setLoading(true);
          await fetchProfile(nextSession.user);
        }
      } else {
        setProfile(null);
        setLoading(false);
        setStuck(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(masterTimeout);
      clearTimeout(stuckTimeout);
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="app-loader-screen">
          <div className="app-loader-card">
            <div className="app-loader-spinner" />
            <p className="app-loader-title">Carregando aplicacao...</p>
            <p className="app-loader-subtitle">Restaurando sua sessao com seguranca.</p>
          {stuck && (
            <div className="app-loader-warning">
              <p style={{ marginBottom: '1rem', color: 'var(--color-warning)' }}>
                A sessao demorou para responder. Se quiser, voce pode resetar e entrar novamente.
              </p>
              <button
                className="btn-primary"
                style={{ background: 'transparent', border: '1px solid var(--color-border)' }}
                onClick={() => {
                  clearSupabaseStorage();
                  setSession(null);
                  setProfile(null);
                  setLoading(false);
                  setStuck(false);
                  window.location.href = '/login';
                }}
              >
                Resetar Sessao
              </button>
            </div>
          )}
          </div>
          <style>
            {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
          </style>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
