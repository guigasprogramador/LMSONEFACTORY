// Arquivo de cliente que substitui o Supabase pelo cliente de autenticau00e7u00e3o customizado para PostgreSQL na Azure
import { authClient } from '../auth/client';
import { Database } from '@/types/database';

// Funu00e7u00e3o para limpar o cache de autenticau00e7u00e3o
const clearAuthCache = () => {
  try {
    // Limpar caches de autenticau00e7u00e3o especu00edficos
    const authKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase.auth') || key.includes('lms-auth'))) {
        authKeys.push(key);
      }
    }
    
    // Remover todos os itens relacionados u00e0 autenticau00e7u00e3o
    authKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    console.log('Cache de autenticau00e7u00e3o limpo');
  } catch (e) {
    console.error('Erro ao limpar cache de autenticau00e7u00e3o:', e);
  }
};

// Funu00e7u00e3o exportada para limpar o cache quando necessu00e1rio (nu00e3o automaticamente)
export const clearAuthCacheManually = clearAuthCache;

// Exportar o cliente de autenticau00e7u00e3o customizado com a mesma interface do Supabase
export const supabase = authClient;
