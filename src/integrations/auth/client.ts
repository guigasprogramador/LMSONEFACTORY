import { Database } from '@/types/database';
import { User } from '@/types/user';
import { requestThrottler } from '@/utils/requestThrottler';

// Configurau00e7u00e3o da API
const API_URL = process.env.REACT_APP_API_URL || 'https://sua-api-azure.com/api'; // Substitua pela URL da sua API

// Classe para gerenciar autenticau00e7u00e3o
class AuthClient {
  private token: string | null = null;
  private user: User | null = null;
  
  constructor() {
    // Recuperar token do localStorage ao inicializar
    this.token = localStorage.getItem('lms-auth-token-v2');
    
    // Tentar recuperar usuu00e1rio do localStorage
    const userJson = localStorage.getItem('lms-user');
    if (userJson) {
      try {
        this.user = JSON.parse(userJson);
      } catch (e) {
        console.error('Erro ao recuperar usuu00e1rio do localStorage:', e);
      }
    }
  }
  
  // API de autenticau00e7u00e3o
  auth = {
    // Obter usuu00e1rio atual
    getUser: async () => {
      if (!this.token) {
        return { data: null, error: new Error('Nu00e3o autenticado') };
      }
      
      try {
        const response = await fetch(`${API_URL}/auth/user`, {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Falha ao obter usuu00e1rio');
        }
        
        const userData = await response.json();
        this.user = userData;
        
        return { data: userData, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    
    // Login
    signInWithPassword: async ({ email, password }: { email: string, password: string }) => {
      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) {
          throw new Error('Credenciais invu00e1lidas');
        }
        
        const { token, user } = await response.json();
        
        // Salvar token e usuu00e1rio
        this.token = token;
        this.user = user;
        localStorage.setItem('lms-auth-token-v2', token);
        localStorage.setItem('lms-user', JSON.stringify(user));
        
        return { data: { user, session: { access_token: token } }, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    
    // Registro
    signUp: async ({ email, password, options }: { email: string, password: string, options?: any }) => {
      try {
        const response = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            email, 
            password, 
            metadata: options?.data || {} 
          })
        });
        
        if (!response.ok) {
          throw new Error('Falha ao registrar');
        }
        
        const { token, user } = await response.json();
        
        // Salvar token e usuu00e1rio
        this.token = token;
        this.user = user;
        localStorage.setItem('lms-auth-token-v2', token);
        localStorage.setItem('lms-user', JSON.stringify(user));
        
        return { data: { user, session: { access_token: token } }, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    
    // Logout
    signOut: async () => {
      try {
        if (this.token) {
          await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.token}`
            }
          });
        }
        
        // Limpar dados locais
        this.token = null;
        this.user = null;
        localStorage.removeItem('lms-auth-token-v2');
        localStorage.removeItem('lms-user');
        
        return { error: null };
      } catch (error) {
        return { error };
      }
    },
    
    // Atualizar usuu00e1rio
    updateUser: async (updates: any) => {
      if (!this.token) {
        return { data: null, error: new Error('Nu00e3o autenticado') };
      }
      
      try {
        const response = await fetch(`${API_URL}/auth/user`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updates)
        });
        
        if (!response.ok) {
          throw new Error('Falha ao atualizar usuu00e1rio');
        }
        
        const userData = await response.json();
        this.user = userData;
        localStorage.setItem('lms-user', JSON.stringify(userData));
        
        return { data: { user: userData }, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    
    // Recuperar sessu00e3o
    getSession: async () => {
      if (!this.token) {
        return { data: null, error: new Error('Nu00e3o autenticado') };
      }
      
      try {
        const response = await fetch(`${API_URL}/auth/session`, {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Sessu00e3o invu00e1lida');
        }
        
        const sessionData = await response.json();
        
        return { 
          data: { 
            session: { 
              access_token: this.token,
              ...sessionData 
            } 
          }, 
          error: null 
        };
      } catch (error) {
        return { data: null, error };
      }
    },
    
    // Atualizar token
    refreshSession: async () => {
      if (!this.token) {
        return { data: null, error: new Error('Nu00e3o autenticado') };
      }
      
      try {
        const response = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Falha ao atualizar token');
        }
        
        const { token, user } = await response.json();
        
        // Atualizar token e usuu00e1rio
        this.token = token;
        this.user = user;
        localStorage.setItem('lms-auth-token-v2', token);
        localStorage.setItem('lms-user', JSON.stringify(user));
        
        return { 
          data: { 
            user,
            session: { access_token: token } 
          }, 
          error: null 
        };
      } catch (error) {
        return { data: null, error };
      }
    },

    // Compatibilidade com Supabase
    admin: {
      listUsers: async () => {
        if (!this.token) {
          return { data: null, error: new Error('Nu00e3o autenticado') };
        }
        
        try {
          const response = await fetch(`${API_URL}/auth/admin/users`, {
            headers: {
              'Authorization': `Bearer ${this.token}`
            }
          });
          
          if (!response.ok) {
            throw new Error('Falha ao listar usuu00e1rios');
          }
          
          const users = await response.json();
          
          return { data: users, error: null };
        } catch (error) {
          return { data: null, error };
        }
      }
    }
  };
  
  // Funu00e7u00e3o para fazer requisiu00e7u00f5es ao banco de dados
  async from(table: string) {
    return {
      select: async (columns = '*') => {
        try {
          const response = await fetch(`${API_URL}/${table}?select=${columns}`, {
            headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {}
          });
          
          if (!response.ok) {
            throw new Error(`Erro ao buscar dados de ${table}`);
          }
          
          const data = await response.json();
          return { data, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
      
      insert: async (values: any) => {
        try {
          const response = await fetch(`${API_URL}/${table}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {})
            },
            body: JSON.stringify(values)
          });
          
          if (!response.ok) {
            throw new Error(`Erro ao inserir em ${table}`);
          }
          
          const data = await response.json();
          return { data, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
      
      update: async (values: any) => {
        return {
          match: async (conditions: any) => {
            try {
              const queryParams = new URLSearchParams();
              Object.entries(conditions).forEach(([key, value]) => {
                queryParams.append(key, String(value));
              });
              
              const response = await fetch(`${API_URL}/${table}?${queryParams.toString()}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {})
                },
                body: JSON.stringify(values)
              });
              
              if (!response.ok) {
                throw new Error(`Erro ao atualizar em ${table}`);
              }
              
              const data = await response.json();
              return { data, error: null };
            } catch (error) {
              return { data: null, error };
            }
          }
        };
      },
      
      delete: async () => {
        return {
          match: async (conditions: any) => {
            try {
              const queryParams = new URLSearchParams();
              Object.entries(conditions).forEach(([key, value]) => {
                queryParams.append(key, String(value));
              });
              
              const response = await fetch(`${API_URL}/${table}?${queryParams.toString()}`, {
                method: 'DELETE',
                headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {}
              });
              
              if (!response.ok) {
                throw new Error(`Erro ao excluir de ${table}`);
              }
              
              const data = await response.json();
              return { data, error: null };
            } catch (error) {
              return { data: null, error };
            }
          }
        };
      },

      // Mu00e9todos adicionais para compatibilidade com Supabase
      eq: (column: string, value: any) => {
        return {
          select: async (columns = '*') => {
            try {
              const response = await fetch(`${API_URL}/${table}?${column}=${value}&select=${columns}`, {
                headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {}
              });
              
              if (!response.ok) {
                throw new Error(`Erro ao buscar dados de ${table}`);
              }
              
              const data = await response.json();
              return { data, error: null };
            } catch (error) {
              return { data: null, error };
            }
          }
        };
      }
    };
  }
  
  // Funu00e7u00e3o para chamar procedimentos armazenados
  async rpc(functionName: string, params = {}) {
    try {
      const response = await fetch(`${API_URL}/rpc/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {})
        },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao chamar funu00e7u00e3o ${functionName}`);
      }
      
      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Compatibilidade com storage do Supabase
  storage = {
    from: (bucket: string) => {
      return {
        upload: async (path: string, file: File) => {
          try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch(`${API_URL}/storage/${bucket}/${path}`, {
              method: 'POST',
              headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {},
              body: formData
            });
            
            if (!response.ok) {
              throw new Error(`Erro ao fazer upload para ${bucket}/${path}`);
            }
            
            const data = await response.json();
            return { data, error: null };
          } catch (error) {
            return { data: null, error };
          }
        },
        
        getPublicUrl: (path: string) => {
          return { 
            data: { publicUrl: `${API_URL}/storage/public/${bucket}/${path}` }
          };
        },
        
        download: async (path: string) => {
          try {
            const response = await fetch(`${API_URL}/storage/${bucket}/${path}`, {
              headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {}
            });
            
            if (!response.ok) {
              throw new Error(`Erro ao baixar ${bucket}/${path}`);
            }
            
            const blob = await response.blob();
            return { data: blob, error: null };
          } catch (error) {
            return { data: null, error };
          }
        }
      };
    }
  };
}

// Exportar instu00e2ncia do cliente
export const authClient = new AuthClient();
