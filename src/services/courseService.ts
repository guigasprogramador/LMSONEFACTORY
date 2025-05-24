import { Course, Module, Lesson } from '@/types';

// Interface para dados administrativos de cursos
interface CourseForAdmin {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  instructor: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
  enrollmentCount: number;
  moduleCount: number;
}
import { requestQueue } from '@/utils/requestQueue';
import * as api from './api/restClient';

// Aviso de compatibilidade para funções que ainda podem tentar usar o Supabase
import { supabase } from '@/integrations/supabase/client';
// Substituir métodos do Supabase para evitar erros
if (supabase) {
  supabase.from = (table: string) => {
    console.warn(`Aviso: Tentativa de usar supabase.from('${table}').select() - Esta função não está disponível na migração para MySQL. Use os métodos da API REST em src/services/api/restClient.ts`);
    return {
      select: () => ({
        eq: () => ({
          single: () => ({ data: null, error: { message: 'Método não disponível na migração MySQL' } })
        }),
        order: () => ({
          data: null, error: { message: 'Método não disponível na migração MySQL' }
        })
      })
    };
  };
}

// Interface para o tipo retornado pelo Supabase na busca aninhada para getCourseById
interface CourseWithRelationsDB {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  duration: string | null;
  instructor: string;
  rating: number | null;
  created_at: string;
  updated_at: string;
  enrollments: { id: string }[] | null; // Relação para contagem de matrículas
  modules: { // Relação aninhada para módulos e aulas
    id: string;
    title: string;
    description: string | null;
    order_number: number;
    lessons: { // Relação aninhada para aulas
      id: string;
      title: string | null;
      description: string | null;
      duration: string | null;
      video_url: string | null;
      content: string | null;
      order_number: number | null;
    }[] | null;
  }[] | null;
}

// Interface para o tipo retornado pelo Supabase na busca para getCoursesForAdmin
interface CourseForAdminDB {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  duration: string | null;
  instructor: string;
  rating: number | null;
  created_at: string;
  updated_at: string;
  enrollments: { id: string }[] | null; // Relação para contagem de matrículas
  modules: { id: string }[] | null; // Relação para contagem de módulos
}



const courseService = {
  async getCourses(): Promise<Course[]> {
    try {
      // Buscar cursos com contagem de módulos e matrículas
      const { data, error } = await supabase
        .from('courses')
        .select(
          'id, title, description, thumbnail, duration, instructor, rating, created_at, updated_at,'
          + 'modules(id, title),' // Seleciona apenas o ID e título dos módulos
          + 'enrollments(id)' // Seleciona apenas o ID das matrículas para contagem
        )
        .order('title', { ascending: true });

      if (error) throw error;
      
      // Verificar se os dados são válidos antes de fazer o cast
      if (!data || !Array.isArray(data)) return [];
      
      // Usar tipagem segura para os dados
      const safeData = data as any[];
      
      return safeData.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description || '',
        thumbnail: course.thumbnail || '/placeholder.svg',
        duration: course.duration || '',
        instructor: course.instructor,
        rating: course.rating || 0,
        // Mapear módulos e contar
        modules: course.modules ? course.modules.map((mod: { id: string, title: string }) => ({
          id: mod.id,
          courseId: course.id, // Adicionar courseId ao módulo (mesmo que não usado na UI, mantém consistência com o tipo Module)
          title: mod.title,
          order: 0, // Ordem não é relevante aqui, definir como 0
          lessons: [] // Aulas não são necessárias nesta visualização
        })) : [],
        // Contar matrículas (se enrollments for null, a contagem é 0)
        enrolledCount: course.enrollments ? course.enrollments.length : 0,
        createdAt: course.created_at,
        updatedAt: course.updated_at,
        isEnrolled: false, // Este campo é para o aluno, não para a admin view
        progress: 0 // Progresso não é relevante aqui
      }));
    } catch (error) {
      console.error('Erro ao buscar cursos:', error);
      throw new Error('Falha ao buscar cursos para administração');
    }
  },

  async createCourse(courseData: {
    title: string;
    description?: string;
    thumbnail?: string;
    duration?: string;
    instructor: string;
  }): Promise<Course> {
    if (!courseData?.title?.trim()) throw new Error('Título do curso é obrigatório');
    if (!courseData?.instructor?.trim()) throw new Error('Nome do instrutor é obrigatório');

    try {
      const { data, error } = await supabase
        .from('courses')
        .insert({
          title: courseData.title.trim(),
          description: courseData.description?.trim() || '',
          thumbnail: courseData.thumbnail?.trim() || '',
          duration: courseData.duration?.trim() || '',
          instructor: courseData.instructor.trim(),
          enrolledcount: 0,
          rating: 0
        })
        .select('id, title, description, thumbnail, duration, instructor, enrolledcount, rating, created_at, updated_at')
        .single();

      if (error) throw error;
      if (!data) throw new Error('Nenhum dado retornado após criar o curso');

      return {
        id: data.id,
        title: data.title,
        description: data.description || '',
        thumbnail: data.thumbnail || '',
        duration: data.duration || '',
        instructor: data.instructor,
        enrolledCount: data.enrolledcount || 0,
        rating: data.rating || 0,
        modules: [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        isEnrolled: false,
        progress: 0
      };
    } catch (error) {
      console.error('Erro ao criar curso:', error);
      throw new Error('Falha ao criar curso');
    }
  },

  async updateCourse(courseId: string, courseData: {
    title?: string;
    description?: string;
    thumbnail?: string;
    duration?: string;
    instructor?: string;
  }): Promise<void> {
    if (!courseId) throw new Error('ID do curso é obrigatório');

    const updates: Record<string, any> = {};

    if (courseData.title !== undefined) {
      if (!courseData.title.trim()) {
        throw new Error('Título do curso não pode ficar vazio');
      }
      updates.title = courseData.title.trim();
    }

    if (courseData.description !== undefined) {
      updates.description = courseData.description.trim();
    }

    if (courseData.thumbnail !== undefined) {
      updates.thumbnail = courseData.thumbnail.trim();
    }

    if (courseData.duration !== undefined) {
      updates.duration = courseData.duration.trim();
    }

    if (courseData.instructor !== undefined) {
      if (!courseData.instructor.trim()) {
        throw new Error('Nome do instrutor não pode ficar vazio');
      }
      updates.instructor = courseData.instructor.trim();
    }

    try {
      const { error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', courseId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao atualizar curso:', error);
      throw new Error('Falha ao atualizar curso');
    }
  },

  async deleteCourse(courseId: string): Promise<void> {
    try {
      console.log('Excluindo curso usando API MySQL');
      // Usar a implementação já existente do restClient
      await api.deleteCourse(courseId);
    } catch (error) {
      console.error('Erro ao excluir curso:', error);
      throw new Error('Falha ao excluir curso');
    }
  },

  async getCourseById(courseId: string): Promise<Course | null> {
    if (!courseId) throw new Error('ID do curso é obrigatório');

    try {
      console.log('Buscando curso por ID usando API MySQL:', courseId);
      
      // Usar a implementação já existente do restClient
      const course = await api.getCourseById(courseId);
      
      // Buscar módulos do curso
      const modules = await api.getModulesByCourseId(courseId);
      
      // Formatar os módulos com suas aulas
      const formattedModules: Module[] = [];
      
      // Buscar aulas para cada módulo
      if (modules && modules.length > 0) {
        for (const module of modules) {
          const lessons = await api.getLessonsByModuleId(module.id);
          
          formattedModules.push({
            ...module,
            lessons: lessons || []
          });
        }
      }
      
      // Construir o objeto do curso completo
      return {
        ...course,
        modules: formattedModules,
        isEnrolled: false, // Será atualizado pelo contexto do usuário
        progress: 0 // Será atualizado pelo contexto do usuário
      };

    } catch (error) {
      console.error('Erro geral ao buscar curso por ID:', error);
      throw new Error('Falha ao buscar detalhes do curso');
    }
  },

  // Função para buscar todos os cursos para a área administrativa
  async getCoursesForAdmin(): Promise<CourseForAdmin[]> {
    try {
      console.log('Buscando cursos para admin usando API MySQL');
      // Buscar todos os cursos
      const courses = await api.getCourses();
      
      // Formatar para o formato esperado na área administrativa
      return courses.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        duration: course.duration,
        instructor: course.instructor,
        enrollmentCount: course.enrolledCount || 0,
        moduleCount: course.modules?.length || 0,
        rating: course.rating || 0,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
      }));
    } catch (error) {
      console.error('Erro ao buscar cursos para admin:', error);
      throw new Error('Falha ao carregar cursos para admin');
    }
  }
};

export default courseService;
