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

  // Sign Up com tratamento
  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });
    return { data, error };
  };

  // Sign In
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data) {
        setProfile(data);
      } else {
        console.error("Nenhum perfil encontrado para o usuário: ", error);
        // Se o perfil não existir, garantimos que não fique nulo quebrando o app, 
        // inserindo um default "fantasma" que forçará ele a ver a tela de pendente (ou recriar o perfil)
        setProfile({ id: userId, status: 'pending', role: 'employee', full_name: 'Usuário sem Perfil' });
      }
    } catch (err) {
      console.error("Erro no fetchProfile:", err);
    } finally {
      // Sempre encerramos o loading, independentemente do sucesso
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    // Obter sessão inicial de forma segura
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        if (session) {
          fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      }
    });

    // Escutar mudanças de estado (login, logout, refresh), ignorando a primeira chamada simultanea
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Ignora a chamada inicial para não brigar pela trava (Lock) com o getSession()
        if (event === 'INITIAL_SESSION') return;
        
        if (mounted) {
          setSession(session);
          if (session) {
            await fetchProfile(session.user.id);
          } else {
            setProfile(null);
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
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
      {!loading && children}
    </AuthContext.Provider>
  );
};
