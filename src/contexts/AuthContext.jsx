import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

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

  const withTimeout = (promise, ms, label) => {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(label || 'TIMEOUT')), ms)
    );
    return Promise.race([promise, timeout]);
  };

  const clearSupabaseStorage = () => {
    try {
      localStorage.removeItem('erp_sso_v2');
      Object.keys(localStorage)
        .filter((key) => key.startsWith('sb-') && key.endsWith('-auth-token'))
        .forEach((key) => localStorage.removeItem(key));
    } catch (e) {
      // Ignora erros de acesso ao storage
    }
  };

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
      } else {
        console.error('Nenhum perfil encontrado para o usuario:', error);
        setProfile(buildFallbackProfile(user));
      }
    } catch (err) {
      console.error('Erro no fetchProfile:', err);
      setProfile(buildFallbackProfile(user));
    } finally {
      setLoading(false);
      setStuck(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const masterTimeout = setTimeout(() => {
      if (mounted) {
        setLoading(false);
      }
    }, 12000);

    const stuckTimeout = setTimeout(() => {
      if (mounted) {
        setStuck(true);
      }
    }, 7000);

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
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;

      setSession(nextSession);

      if (nextSession) {
        setLoading(true);
        await fetchProfile(nextSession.user);
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
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', background: 'var(--color-bg-primary)', color: 'var(--color-text-secondary)' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-brand)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
          Carregando Aplicacao...
          {stuck && (
            <div style={{ marginTop: '1.5rem', textAlign: 'center', maxWidth: '360px' }}>
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
