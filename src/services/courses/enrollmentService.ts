import { Course } from '@/types';
import { toast } from 'sonner';

/**
 * Get enrolled courses for user - versão otimizada para o dashboard
 */
export const getEnrolledCourses = async (userId: string): Promise<Course[]> => {
  try {
    console.time('getEnrolledCourses');
    // Importar o módulo da API REST
    const api = await import('@/services/api/restClient');
    
    // Buscar todas as matrículas do usuário via REST API - sempre buscando dados atualizados
    // Modificamos a API para sempre buscar dados frescos do servidor
    const enrollmentsData = await api.getEnrollmentsByUser(userId);
    if (!enrollmentsData || enrollmentsData.length === 0) return [];
    
    // Obter os IDs dos cursos em que o usuário está matriculado
    const courseIds = enrollmentsData.map(enrollment => enrollment.course_id);
    
    // Criar um mapa de progresso por curso
    const progressMap = new Map();
    enrollmentsData.forEach(enrollment => {
      progressMap.set(enrollment.course_id, enrollment.progress || 0);
    });
    
    // Buscar os cursos via REST API
    const allCourses = await api.getCourses();
    const coursesData = allCourses.filter(course => courseIds.includes(course.id));
    
    if (!coursesData || coursesData.length === 0) return [];
    
    // Mapear os cursos para o formato desejado
    const courses = coursesData.map(course => ({
      ...course,
      isEnrolled: true,
      progress: progressMap.get(course.id) || 0
    }));
    
    console.timeEnd('getEnrolledCourses');
    return courses;
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    return [];
  }
};

/**
 * Enroll in a course (optimized)
 */
export const enrollCourse = async (courseId: string, userId: string): Promise<{ success: boolean; message: string; enrollment?: any }> => {
  try {
    const api = await import('@/services/api/restClient');
    const { clearCoursesCache } = await import('./courseQueries');
    
    // Fazer a matrícula via API
    const result = await api.enrollCourse(courseId, userId);
    
    // Se a matrícula foi bem-sucedida, limpar o cache para garantir que as alterações sejam refletidas imediatamente
    if (result.success) {
      // Limpar o cache para forçar atualização dos dados no próximo carregamento
      clearCoursesCache();
      console.log(`Cache limpo após matrícula do usuário ${userId} no curso ${courseId}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error enrolling in course:', error);
    return { success: false, message: 'Erro ao matricular no curso.' };
  }
};

/**
 * Get enrolled course details - versão completa com módulos e aulas
 * Usar esta função apenas quando precisar dos detalhes completos do curso
 */
export const getEnrolledCourseDetails = async (userId: string, courseId: string): Promise<Course | null> => {
  try {
    console.time(`getEnrolledCourseDetails-${courseId}`);
    
    // Importar as funções da API REST necessárias
    const api = await import('@/services/api/restClient');
    
    // Verificar se o usuário está matriculado
    const enrollment = await api.checkEnrollment(courseId, userId);

    if (!enrollment) {
      console.log('Usuário não está matriculado neste curso');
      return null;
    }
    
    // Buscar dados do curso, módulos e aulas em paralelo
    const [course, modules, lessonProgress] = await Promise.all([
      // 1. Buscar detalhes do curso
      api.getCourseById(courseId),
      
      // 2. Buscar módulos do curso
      api.getModulesByCourseId(courseId),
      
      // 3. Buscar progresso do usuário no curso
      api.getUserCourseProgress(courseId)
    ]);

    if (!course) {
      console.error('Curso não encontrado');
      return null;
    }
    
    // Buscar todas as aulas para cada módulo
    const modulesWithLessons = await Promise.all(
      modules.map(async (module) => {
        const lessons = await api.getLessonsByModuleId(module.id);
        
        // Mapear as aulas com informações de progresso
        const mappedLessons = lessons.map(lesson => ({
          id: lesson.id,
          moduleId: lesson.moduleId,
          title: lesson.title,
          description: lesson.description || '',
          duration: lesson.duration || '',
          videoUrl: lesson.videoUrl || '',
          content: lesson.content || '',
          order: lesson.order,
          isCompleted: lessonProgress?.completedLessons?.includes(lesson.id) || false
        }));
        
        return {
          id: module.id,
          courseId: module.courseId,
          title: module.title,
          description: module.description || '',
          order: module.order,
          lessons: mappedLessons
        };
      })
    );
    
    // Construir o objeto do curso
    const courseDetails = {
      id: course.id,
      title: course.title,
      description: course.description || '',
      thumbnail: course.thumbnail || '/placeholder.svg',
      duration: course.duration || '',
      instructor: course.instructor,
      enrolledCount: course.enrolledCount || 0,
      rating: course.rating || 0,
      modules: modulesWithLessons,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      isEnrolled: true,
      progress: enrollment.progress || 0
    };
    
    console.timeEnd(`getEnrolledCourseDetails-${courseId}`);
    return courseDetails;
  } catch (error) {
    console.error('Error fetching enrolled course details:', error);
    return null;
  }
};

/**
 * Update course progress
 */
export const updateCourseProgress = async (courseId: string, userId: string, progress: number): Promise<void> => {
  try {
    // Importar a função da API REST
    const api = await import('@/services/api/restClient');
    
    // Usar a implementação REST para atualizar o progresso
    await api.updateCourseProgress(courseId, userId, progress);
  } catch (error) {
    console.error('Error updating course progress:', error);
    throw error;
  }
};

/**
 * Check if a user is enrolled in a specific course
 */
export const checkEnrollment = async (courseId: string, userId: string) => {
  try {
    console.log(`Verificando matrícula do usuário ${userId} no curso ${courseId}`);
    // Usar a implementação REST em vez do Supabase
    const api = await import('@/services/api/restClient');
    const enrollment = await api.checkEnrollment(courseId, userId);
    
    return { 
      data: enrollment, 
      error: null 
    };
  } catch (error) {
    console.error('Error checking enrollment:', error);
    // Em caso de erro, retornar formato compatível com o código existente
    return { data: null, error };
  }
};

/**
 * Busca alunos matriculados em um curso específico
 */
export const getEnrolledUsers = async (courseId: string) => {
  try {
    console.log('Buscando alunos matriculados para o curso:', courseId);
    
    if (!courseId) {
      console.error('ID do curso não fornecido');
      toast.error('ID do curso não fornecido');
      return [];
    }

    // Usar a API REST para buscar matrículas
    const api = await import('@/services/api/restClient');
    
    // Buscar matrículas para este curso
    const enrollments = await api.getEnrollmentsByCourse(courseId);
    
    if (!enrollments || enrollments.length === 0) {
      console.log(`Nenhuma matrícula encontrada para o curso ${courseId}`);
      return [];
    }
    
    console.log(`Encontradas ${enrollments.length} matrículas para o curso ${courseId}`);
    
    // Extrair IDs de usuários únicos
    const userIds = [...new Set(enrollments.map(e => e.user_id).filter(Boolean))];
    console.log(`IDs de usuários matriculados: ${userIds.join(', ')}`);
    
    if (userIds.length === 0) {
      console.log('Nenhum ID de usuário válido encontrado nas matrículas');
      return [];
    }
    
    // Buscar detalhes dos usuários usando a API REST
    const users = await api.getUsers();
    
    if (!users || users.length === 0) {
      console.log('Nenhum usuário encontrado no sistema');
      return [];
    }
    
    console.log(`Encontrados ${users.length} usuários no sistema`);
    
    // Mapear usuários matriculados com seus detalhes
    const enrolledUsers = [];
    
    for (const userId of userIds) {
      const user = users.find(u => u.id === userId);
      const enrollment = enrollments.find(e => e.user_id === userId);
      
      if (user) {
        const userData = {
          id: user.id,
          email: user.email,
          name: user.name || user.email?.split('@')[0] || 'Usuário',
          role: user.role || 'student',
          progress: enrollment?.progress || 0,
          enrolledAt: enrollment?.enrolled_at || new Date().toISOString()
        };
        
        enrolledUsers.push(userData);
      } else {
        console.log(`Detalhes do usuário não encontrados para o ID: ${userId}`);
        // Adicionar versão simplificada se não encontrar o usuário
        if (enrollment) {
          enrolledUsers.push({
            id: userId,
            email: 'email@exemplo.com',
            name: `Usuário ${userId.substring(0, 6)}`,
            role: 'student',
            progress: enrollment.progress || 0,
            enrolledAt: enrollment.enrolled_at || new Date().toISOString()
          });
        }
      }
    }
    
    console.log(`Retornando ${enrolledUsers.length} usuários matriculados no curso ${courseId}`);
    if (enrolledUsers.length > 0) {
      toast.success(`${enrolledUsers.length} alunos matriculados encontrados`);
    }
    return enrolledUsers;
  } catch (error) {
    console.error('Erro ao buscar alunos matriculados:', error);
    toast.error('Erro ao buscar alunos matriculados');
    return [];
  }
}
