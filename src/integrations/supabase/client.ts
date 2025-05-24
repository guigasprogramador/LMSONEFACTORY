// Adaptador que simula a interface do Supabase usando nosso cliente MySQL
import { authClient } from '../auth/client';
import { Database } from '@/types/database';

// Função para limpar o cache de autenticação
const clearAuthCache = () => {
  try {
    // Limpar caches de autenticação específicos
    const authKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase.auth') || key.includes('lms-auth'))) {
        authKeys.push(key);
      }
    }
    
    // Remover todos os itens relacionados à autenticação
    authKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    console.log('Cache de autenticação limpo com sucesso');
  } catch (error) {
    console.error('Erro ao limpar cache de autenticação:', error);
  }
};

// Função exportada para limpar o cache quando necessário
export const clearAuthCacheManually = clearAuthCache;

// Simulação da interface do Supabase
class SupabaseAdapter {
  auth = {
    getSession: async () => {
      const currentUser = await authClient.getCurrentUser();
      if (!currentUser) return { data: { session: null }, error: null };
      
      // Criar uma sessão no formato do Supabase
      return {
        data: {
          session: {
            user: {
              id: currentUser.id,
              email: currentUser.email,
              user_metadata: currentUser.user_metadata || {},
              role: currentUser.role,
              // Adicionar campos obrigatórios do tipo User do Supabase
              app_metadata: {},
              aud: 'authenticated',
              created_at: new Date().toISOString()
            },
            access_token: authClient.getToken() || '',
            // Adicionar campos obrigatórios do tipo Session do Supabase
            refresh_token: '',
            expires_in: 3600,
            token_type: 'bearer'
          }
        },
        error: null
      };
    },
    onAuthStateChange: (callback: any) => {
      // Simulação de evento de mudança de estado
      const unsubscribe = authClient.onAuthChange((event, session) => {
        callback(event, { data: { session } });
      });
      return { data: { subscription: { unsubscribe } } };
    },
    // Adicionar método updateUser
    updateUser: async (updates: any) => {
      try {
        console.log('Tentando atualizar usuário com:', updates);
        // Simulação de atualização do usuário
        const currentUser = await authClient.getCurrentUser();
        if (!currentUser) {
          return { data: null, error: new Error('Usuário não autenticado') };
        }
        
        // Atualizar metadados do usuário
        if (updates.data) {
          const updatedUser = {
            ...currentUser,
            user_metadata: {
              ...currentUser.user_metadata,
              ...updates.data
            }
          };
          
          // Simular uma atualização bem-sucedida
          return {
            data: {
              user: {
                ...updatedUser,
                app_metadata: {},
                aud: 'authenticated',
                created_at: new Date().toISOString()
              }
            },
            error: null
          };
        }
        
        return { data: { user: currentUser }, error: null };
      } catch (error: any) {
        console.error('Erro ao atualizar usuário:', error);
        return { data: null, error };
      }
    },
    // Adicionar método refreshSession
    refreshSession: async () => {
      try {
        console.log('Tentando atualizar sessão');
        const currentUser = await authClient.getCurrentUser();
        if (!currentUser) {
          return { data: null, error: new Error('Usuário não autenticado') };
        }
        
        // Simular uma atualização de sessão bem-sucedida
        return {
          data: {
            session: {
              user: {
                ...currentUser,
                app_metadata: {},
                aud: 'authenticated',
                created_at: new Date().toISOString()
              },
              access_token: authClient.getToken() || '',
              refresh_token: '',
              expires_in: 3600,
              token_type: 'bearer'
            }
          },
          error: null
        };
      } catch (error: any) {
        console.error('Erro ao atualizar sessão:', error);
        return { data: null, error };
      }
    },
    signInWithPassword: async ({ email, password }: { email: string, password: string }) => {
      try {
        const result = await authClient.login(email, password);
        
        // Criar um objeto de usuu00e1rio compatu00edvel com Supabase
        const user = {
          id: result.user.id,
          email: result.user.email,
          user_metadata: result.user.user_metadata || {},
          role: result.user.role,
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        };
        
        // Criar um objeto de sessu00e3o compatu00edvel com Supabase
        const session = {
          access_token: result.token,
          refresh_token: '',
          expires_in: 3600,
          token_type: 'bearer',
          user: user
        };
        
        return {
          data: {
            user,
            session
          },
          error: null
        };
      } catch (error: any) {
        console.error('Erro de login:', error);
        return {
          data: { user: null, session: null },
          error: { message: error.message || 'Erro ao fazer login' }
        };
      }
    },
    signUp: async ({ email, password, options }: any) => {
      try {
        const result = await authClient.register({
          email,
          password,
          metadata: options?.data || {},
          username: options?.username || email.split('@')[0]
        });
        
        // Criar um objeto de usuu00e1rio compatu00edvel com Supabase
        const user = {
          id: result.user.id,
          email: result.user.email,
          user_metadata: result.user.user_metadata || {},
          role: result.user.role,
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        };
        
        // Criar um objeto de sessu00e3o compatu00edvel com Supabase
        const session = {
          access_token: result.token,
          refresh_token: '',
          expires_in: 3600,
          token_type: 'bearer',
          user: user
        };
        
        return {
          data: {
            user,
            session
          },
          error: null
        };
      } catch (error: any) {
        console.error('Erro de registro:', error);
        return {
          data: { user: null, session: null },
          error: { message: error.message || 'Erro ao registrar' }
        };
      }
    },
    signOut: async () => {
      try {
        await authClient.logout();
        return { error: null };
      } catch (error: any) {
        return { error: { message: error.message || 'Erro ao fazer logout' } };
      }
    }
  };

  // Simulação do método from para consultas
  from(table: string) {
    return {
      select: (columns: string = '*') => {
        console.warn(`Aviso: Tentativa de usar supabase.from('${table}').select() - Esta função não está disponível na migração para MySQL. Use os métodos da API REST em src/services/api/restClient.ts`);
        
        // Redirecionar para os métodos da API REST com base na tabela
        if (table === 'courses') {
          // Importar dinamicamente para evitar dependências circulares
          import('../../services/api/restClient').then(api => {
            console.log('Redirecionando para api.getCourses()');
            return api.getCourses();
          }).catch(err => {
            console.error('Erro ao importar API REST:', err);
            return [];
          });
        }
        
        return {
          eq: () => this.mockQueryResult([]),
          order: () => this.mockQueryResult([]),
          limit: () => this.mockQueryResult([]),
          single: () => this.mockQueryResult(null),
          match: () => this.mockQueryResult([]),
          in: () => this.mockQueryResult([]),
          range: () => this.mockQueryResult([])
        };
      },
      insert: (values: any) => {
        console.warn(`Aviso: Tentativa de usar supabase.from('${table}').insert() - Esta função não está disponível na migração para MySQL`);
        console.log(`Tentando inserir dados na tabela ${table}:`, values);
        
        // Gerar um ID UUID para o novo registro
        const newId = crypto.randomUUID();
        const now = new Date().toISOString();
        
        // Criar um objeto simulando o registro inserido
        const mockData = {
          id: newId,
          ...values,
          created_at: now,
          updated_at: now
        };
        
        // Retornar um objeto que suporta o encadeamento com select()
        return {
          select: (columns: string = '*') => {
            console.log(`Simulando select após insert na tabela ${table}`);
            return {
              single: () => this.mockQueryResult(mockData)
            };
          },
          single: () => this.mockQueryResult(mockData)
        };
      },
      update: (values: any) => {
        console.warn(`Aviso: Tentativa de usar supabase.from('${table}').update() - Esta função não está disponível na migração para MySQL`);
        console.log(`Tentando atualizar dados na tabela ${table}:`, values);
        
        // Simular uma atualização bem-sucedida
        const now = new Date().toISOString();
        const mockData = {
          ...values,
          updated_at: now
        };
        
        return {
          eq: (column: string, value: any) => {
            console.log(`Simulando update com eq na tabela ${table} onde ${column} = ${value}`);
            return {
              select: () => ({
                single: () => this.mockQueryResult({ ...mockData, id: value })
              })
            };
          },
          match: (conditions: any) => {
            console.log(`Simulando update com match na tabela ${table} com condições:`, conditions);
            return {
              select: () => ({
                single: () => this.mockQueryResult({ ...mockData, ...conditions })
              })
            };
          }
        };
      },
      delete: () => {
        console.warn(`Aviso: Tentativa de usar supabase.from('${table}').delete() - Esta função não está disponível na migração para MySQL`);
        
        return {
          eq: (column: string, value: any) => {
            console.log(`Simulando delete na tabela ${table} onde ${column} = ${value}`);
            return {
              then: (callback: (value: any) => any) => Promise.resolve({ data: { success: true }, error: null }).then(callback)
            };
          },
          match: (conditions: any) => {
            console.log(`Simulando delete na tabela ${table} com condições:`, conditions);
            return {
              then: (callback: (value: any) => any) => Promise.resolve({ data: { success: true }, error: null }).then(callback)
            };
          }
        };
      }
    };
  }

  // Simulação do método channel para realtime
  channel(name: string) {
    console.warn(`Aviso: Tentativa de usar supabase.channel('${name}') - Esta função não está disponível na migração para MySQL`);
    
    // Criar um objeto de canal que suporta múltiplas chamadas on()
    const channelObj = {
      on: (event: string, schema: string, table: string, callback: any) => {
        console.warn(`Aviso: Tentativa de escutar eventos '${event}' na tabela '${table}' - Realtime não está disponível na migração para MySQL`);
        // Retornar o mesmo objeto para permitir encadeamento
        return channelObj;
      },
      subscribe: () => {
        console.warn('Aviso: Tentativa de se inscrever em um canal - Realtime não está disponível na migração para MySQL');
        return {
          unsubscribe: () => {
            console.warn('Aviso: Tentativa de cancelar inscrição em um canal - Realtime não está disponível na migração para MySQL');
          }
        };
      }
    };
    
    return channelObj;
  }

  // Helper para simular resultados de consultas
  private mockQueryResult(data: any) {
    return {
      data,
      error: null,
      count: Array.isArray(data) ? data.length : 0,
      then: (callback: (value: any) => any) => Promise.resolve(data).then(callback)
    };
  }
}

// Exportar o adaptador Supabase
export const supabase = new SupabaseAdapter();
