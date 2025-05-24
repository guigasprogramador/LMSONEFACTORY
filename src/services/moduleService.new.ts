import { Module, Lesson } from '@/types';
import { requestQueue } from '@/utils/requestQueue';
import { cacheManager } from '@/utils/cacheManager';
import { getModulesByCourseId as apiGetModulesByCourseId, createModule as apiCreateModule, updateModule as apiUpdateModule, deleteModule as apiDeleteModule, getLessonsByModuleId as apiGetLessonsByModuleId, getCourses, getModuleById as apiGetModuleById } from './api/restClient';

export const moduleService = {
  async getAllModules(): Promise<Module[]> {
    try {
      // Buscar todos os cursos para obter seus IDs
      const courses = await getCourses();
      
      if (!courses || courses.length === 0) {
        console.log('Nenhum curso encontrado para buscar módulos');
        return [];
      }
      
      // Para cada curso, buscar seus módulos
      const allModulesPromises = courses.map(course => this.getModulesByCourseId(course.id));
      const modulesArrays = await Promise.all(allModulesPromises);
      
      // Combinar todos os arrays de módulos em um único array
      const allModules = modulesArrays.flat();
      
      if (allModules.length === 0) {
        throw new Error('Nenhum módulo encontrado');
      }
      
      return allModules;
    } catch (error) {
      console.error('Erro ao buscar módulos:', error);
      throw new Error('Falha ao buscar módulos');
    }
  },

  async getModulesByCourseId(courseId: string): Promise<Module[]> {
    if (!courseId) throw new Error('ID do curso é obrigatório');

    // Chave de cache para este curso
    const cacheKey = `modules_${courseId}`;
    
    // Tentar obter do cache primeiro, com expiração de 10 minutos
    try {
      return await cacheManager.getOrSet(
        cacheKey,
        async () => {
          console.log(`Buscando módulos do curso ${courseId} do servidor...`);
          
          // Buscar os módulos usando a fila de requisições
          const modules = await requestQueue.enqueue(async () => {
            // Usar o cliente REST para buscar os módulos
            return await apiGetModulesByCourseId(courseId);
          });
          
          if (!modules || modules.length === 0) {
            console.log('Nenhum módulo encontrado para o curso:', courseId);
            return []; // Retornar array vazio em vez de lançar erro
          }

          // Processar módulos sequencialmente para evitar muitas requisições simultâneas
          const modulesWithLessons: Module[] = [];
          
          for (const module of modules) {
            try {
              // Buscar aulas para este módulo usando a fila de requisições
              const lessons = await requestQueue.enqueue(async () => {
                // Usar o cliente REST para buscar as aulas
                return await apiGetLessonsByModuleId(module.id);
              });

              modulesWithLessons.push({
                ...module,
                lessons: lessons || []
              });
            } catch (error) {
              console.error(`Erro ao processar módulo ${module.id}:`, error);
              // Continuar com os outros módulos mesmo se um falhar
              modulesWithLessons.push({
                ...module,
                lessons: [] // Sem aulas se houver erro
              });
            }
          }

          return modulesWithLessons;
        },
        10 * 60 * 1000 // 10 minutos de cache
      );
    } catch (error) {
      console.error('Erro ao buscar módulos do curso:', error);
      
      // Mensagens de erro mais informativas
      if (error instanceof Error) {
        if (error.message.includes('rate limit') || error.message.includes('429')) {
          throw new Error('O servidor está temporariamente sobrecarregado. Estamos limitando as requisições para evitar problemas. Por favor, aguarde alguns instantes.');
        }
        
        if (error.message.includes('network') || error.message.includes('Network')) {
          throw new Error('Problema de conexão detectado. Verifique sua internet e tente novamente.');
        }
        
        // Incluir a mensagem original para ajudar no diagnóstico
        throw new Error(`Erro ao carregar módulos e aulas: ${error.message}`);
      }
      
      throw new Error('Falha ao buscar módulos do curso. Tente novamente mais tarde.');
    }
  },

  async createModule(courseId: string, moduleData: { 
    title: string; 
    description?: string; 
    order: number 
  }): Promise<Module> {
    if (!courseId) throw new Error('ID do curso é obrigatório');
    if (!moduleData?.title?.trim()) throw new Error('Título do módulo é obrigatório');

    try {
      // Usar o cliente REST para criar o módulo
      const module = await apiCreateModule(courseId, {
        title: moduleData.title.trim(),
        description: moduleData.description?.trim() || '',
        order: moduleData.order
      });

      // Limpar o cache para este curso
      cacheManager.remove(`modules_${courseId}`);

      return module;
    } catch (error) {
      console.error('Erro ao criar módulo:', error);
      throw new Error('Falha ao criar módulo');
    }
  },

  async updateModule(moduleId: string, moduleData: { 
    title?: string; 
    description?: string; 
    order?: number 
  }): Promise<Module> {
    if (!moduleId) throw new Error('ID do módulo é obrigatório');

    const updates: Record<string, any> = {};
    
    if (moduleData.title !== undefined) {
      if (!moduleData.title.trim()) {
        throw new Error('Título do módulo não pode ficar vazio');
      }
      updates.title = moduleData.title.trim();
    }
    
    if (moduleData.description !== undefined) {
      updates.description = moduleData.description.trim();
    }
    
    if (moduleData.order !== undefined) {
      updates.order = moduleData.order;
    }
    
    // Se não houver atualizações, retornar sem fazer nada
    if (Object.keys(updates).length === 0) {
      console.log('Nenhuma atualização fornecida para o módulo:', moduleId);
      // Buscar o módulo atual para retornar
      return await apiGetModuleById(moduleId);
    }

    try {
      // Atualizar o módulo usando o cliente REST
      const updatedModule = await apiUpdateModule(moduleId, updates);
      
      // Limpar o cache para o curso deste módulo
      cacheManager.remove(`modules_${updatedModule.courseId}`);
      
      return updatedModule;
    } catch (error) {
      console.error('Erro ao atualizar módulo:', error);
      throw new Error('Falha ao atualizar módulo');
    }
  },

  async deleteModule(moduleId: string): Promise<void> {
    if (!moduleId) throw new Error('ID do módulo é obrigatório');

    try {
      // Primeiro, obter o módulo atual para saber a qual curso ele pertence
      const module = await apiGetModuleById(moduleId);
      
      if (!module) throw new Error('Módulo não encontrado');

      // Excluir o módulo usando o cliente REST
      await apiDeleteModule(moduleId);

      // Limpar o cache para o curso deste módulo
      cacheManager.remove(`modules_${module.courseId}`);
    } catch (error) {
      console.error('Erro ao excluir módulo:', error);
      throw new Error('Falha ao excluir módulo');
    }
  }
};
