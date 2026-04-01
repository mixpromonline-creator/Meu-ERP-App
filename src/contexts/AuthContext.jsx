import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

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

  // Sign Up com tratamento
  const signUp = async (email, password, fullName) => {
    try {
      const { data, error } = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        }),
        8000,
        'SUPABASE_SIGNUP_TIMEOUT'
      );
      return { data, error };
    } catch (error) {
      if (error?.message?.includes('TIMEOUT')) {
        clearSupabaseStorage();
      }
      return { data: null, error };
    }
  };

  // Sign In
  const signIn = async (email, password) => {
    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email,
          password,
        }),
        8000,
        'SUPABASE_SIGNIN_TIMEOUT'
      );
      return { data, error };
    } catch (error) {
      if (error?.message?.includes('TIMEOUT')) {
        clearSupabaseStorage();
      }
      return { data: null, error };
    }
  };

  // Sign Out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Supabase logout lock error. Forçando limpeza de sessão.', error);
    } finally {
      setSession(null);
      setProfile(null);
    }
  };

  // Obter perfil (role, status, business_type)
  const fetchProfile = async (userId) => {
    try {
      // Wrapper de timeout para impedir que a query pendure a interface para sempre
      const requestPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Aguarda quem terminar primeiro
      const { data, error } = await withTimeout(requestPromise, 3500, "SUPABASE_TIMEOUT");
      
      if (data) {
        setProfile(data);
      } else {
        console.error("Nenhum perfil encontrado para o usuário: ", error);
        setProfile({ id: userId, status: 'pending', role: 'employee', full_name: 'Usuário sem Perfil' });
      }
    } catch (err) {
      console.error("Erro no fetchProfile:", err);
      // Se ocorreu travamento total da requisição, a sessão pode estar corrompida.
      if (err.message === "SUPABASE_TIMEOUT") {
        console.error("A API do Supabase (gotrue) travou durante a renovação de sessão. Deslogando com segurança.");
        try {
           clearSupabaseStorage(); // limpa as chaves supabase à força
           await supabase.auth.signOut();
        } catch(e) {}
        setSession(null);
        setProfile(null);
      }
    } finally {
      // Sempre encerramos o loading
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    // Fallback super seguro: se em 4,5 segundos o listener não desbloquear (ou o fetchProfile), desbloqueamos.
    const masterTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.error("Master Timeout Atingido: Supabase travou na inicialização geral.");
        setLoading(false);
      }
    }, 4500);

    const stuckTimeout = setTimeout(() => {
      if (mounted && loading) {
        setStuck(true);
      }
    }, 6500);

    const bootstrap = async () => {
      try {
        const { data } = await withTimeout(supabase.auth.getSession(), 3500, 'SUPABASE_GETSESSION_TIMEOUT');
        if (!mounted) return;
        const currentSession = data?.session || null;
        setSession(currentSession);
        if (currentSession) {
          await fetchProfile(currentSession.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      } catch (err) {
        console.error("Erro no bootstrap de sessão:", err);
        if (err.message === 'SUPABASE_GETSESSION_TIMEOUT') {
          clearSupabaseStorage();
        }
        setSession(null);
        setProfile(null);
        setLoading(false);
      } finally {
        clearTimeout(masterTimeout);
        clearTimeout(stuckTimeout);
      }
    };

    bootstrap();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        if (session) {
          // fetchProfile irá setar loading = false por si só no finally ou jogar para o catch
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
        
        // Finalizou qualquer uma das etapas? matamos o master timeout.
        clearTimeout(masterTimeout);
      }
    );

    return () => {
      mounted = false;
      clearTimeout(masterTimeout);
      clearTimeout(stuckTimeout);
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Removemos o useEffect antigo que dependia do 'profile' ser preenchido para destravar o setLoading.

  const value = {
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', background: 'var(--color-bg-primary)', color: 'var(--color-text-secondary)' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-brand)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
          Carregando Aplicação...
          {stuck && (
            <div style={{ marginTop: '1.5rem', textAlign: 'center', maxWidth: '360px' }}>
              <p style={{ marginBottom: '1rem', color: 'var(--color-warning)' }}>
                A sessão parece travada. Você pode resetar sem precisar limpar o site manualmente.
              </p>
              <button
                className="btn-primary"
                style={{ background: 'transparent', border: '1px solid var(--color-border)' }}
                onClick={() => {
                  clearSupabaseStorage();
                  setSession(null);
                  setProfile(null);
                  setLoading(false);
                  window.location.href = '/login';
                }}
              >
                Resetar Sessão
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
