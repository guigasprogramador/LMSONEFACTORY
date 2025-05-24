/**
 * Cliente REST para comunicau00e7u00e3o com a API MySQL
 * Substitui o adaptador Supabase por chamadas diretas u00e0 API REST
 */

import { Course, Module, Lesson } from '@/types';

// Configurau00e7u00e3o da API
const API_URL = 'http://localhost:3001'; // URL da API REST (porta alterada para 3001)

// Helper para obter o token de autenticau00e7u00e3o
const getAuthToken = (): string | null => {
  return localStorage.getItem('lms-auth-token-v2');
};

// Helper para fazer requisiu00e7u00f5es autenticadas
export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
  }
  return response.json();
};

// ============================
// CURSOS
// ============================

// Obter todos os cursos
export const getCourses = async (): Promise<Course[]> => {
  try {
    const data = await fetchWithAuth('/api/courses');
    
    // Converter para o formato esperado pelo frontend
    return data.map((course: any) => ({
      id: course.id,
      title: course.title,
      description: course.description || '',
      thumbnail: course.thumbnail || '/placeholder.svg',
      duration: course.duration || '',
      instructor: course.instructor,
      enrolledCount: course.enrolledcount || 0,
      rating: course.rating || 0,
      modules: [],
      createdAt: course.created_at,
      updatedAt: course.updated_at,
      progress: 0,
      isEnrolled: false
    }));
  } catch (error) {
    console.error('Erro ao buscar cursos:', error);
    throw error;
  }
};

// Obter um curso por ID
export const getCourseById = async (courseId: string): Promise<Course> => {
  try {
    const data = await fetchWithAuth(`/api/courses/${courseId}`);
    
    // Converter para o formato esperado pelo frontend
    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      thumbnail: data.thumbnail || '/placeholder.svg',
      // Garantir que a duração seja sempre uma string, e se for número, converter para string
      duration: data.duration != null ? String(data.duration) : '',
      instructor: data.instructor,
      enrolledCount: data.enrolledcount || 0,
      rating: data.rating || 0,
      modules: [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      // Adicionando propriedades obrigatórias de acordo com o tipo Course
      isEnrolled: false,
      progress: 0
    };
  } catch (error: any) {
    console.error(`Erro ao buscar curso ${courseId}:`, error);
    throw error;
  }
};

// Criar um novo curso
export const createCourse = async (courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'modules' | 'progress' | 'isEnrolled'>): Promise<Course> => {
  try {
    const data = await fetchWithAuth('/api/courses', {
      method: 'POST',
      body: JSON.stringify({
        title: courseData.title,
        description: courseData.description,
        thumbnail: courseData.thumbnail || '/placeholder.svg',
        duration: courseData.duration ? `${courseData.duration} horas` : '',
        instructor: courseData.instructor,
        enrolledCount: courseData.enrolledCount || 0,
        rating: courseData.rating || 0
      })
    });
    
    // Converter para o formato esperado pelo frontend
    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      thumbnail: data.thumbnail || '/placeholder.svg',
      // Garantir que a duração seja sempre uma string, e se for número, converter para string
      duration: data.duration != null ? String(data.duration) : '',
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
    throw error;
  }
};

// Atualizar um curso
export const updateCourse = async (courseId: string, courseData: Partial<Course>): Promise<Course> => {
  try {
    const data = await fetchWithAuth(`/api/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: courseData.title,
        description: courseData.description,
        thumbnail: courseData.thumbnail,
        duration: courseData.duration,
        instructor: courseData.instructor,
        enrolledCount: courseData.enrolledCount,
        rating: courseData.rating
      })
    });
    
    // Converter para o formato esperado pelo frontend
    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      thumbnail: data.thumbnail || '/placeholder.svg',
      // Garantir que a duração seja sempre uma string, e se for número, converter para string
      duration: data.duration != null ? String(data.duration) : '',
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
    console.error(`Erro ao atualizar curso ${courseId}:`, error);
    throw error;
  }
};

// Excluir um curso
export const deleteCourse = async (courseId: string): Promise<void> => {
  try {
    await fetchWithAuth(`/api/courses/${courseId}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error(`Erro ao excluir curso ${courseId}:`, error);
    throw error;
  }
};

// ============================
// Mu00d3DULOS
// ============================

// Obter todos os mu00f3dulos de um curso
export const getModulesByCourseId = async (courseId: string): Promise<Module[]> => {
  try {
    const data = await fetchWithAuth(`/api/courses/${courseId}/modules`);
    
    // Converter para o formato esperado pelo frontend
    return data.map((module: any) => ({
      id: module.id,
      courseId: module.course_id,
      title: module.title,
      description: module.description || '',
      order: module.order_number,
      lessons: [],
      createdAt: module.created_at,
      updatedAt: module.updated_at
    }));
  } catch (error) {
    console.error(`Erro ao buscar mu00f3dulos do curso ${courseId}:`, error);
    throw error;
  }
};

// Obter um mu00f3dulo por ID
export const getModuleById = async (moduleId: string): Promise<Module> => {
  try {
    const module = await fetchWithAuth(`/api/modules/${moduleId}`);
    
    // Converter para o formato esperado pelo frontend
    return {
      id: module.id,
      courseId: module.course_id,
      title: module.title,
      description: module.description || '',
      order: module.order_number,
      lessons: [],
      createdAt: module.created_at,
      updatedAt: module.updated_at
    };
  } catch (error) {
    console.error(`Erro ao buscar mu00f3dulo ${moduleId}:`, error);
    throw error;
  }
};

// Criar um novo mu00f3dulo
export const createModule = async (courseId: string, moduleData: Omit<Module, 'id' | 'courseId' | 'createdAt' | 'updatedAt' | 'lessons'>): Promise<Module> => {
  try {
    const data = await fetchWithAuth(`/api/courses/${courseId}/modules`, {
      method: 'POST',
      body: JSON.stringify({
        title: moduleData.title,
        description: moduleData.description,
        order_number: moduleData.order
      })
    });
    
    // Converter para o formato esperado pelo frontend
    return {
      id: data.id,
      courseId: data.course_id,
      title: data.title,
      description: data.description || '',
      order: data.order_number,
      lessons: [],
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error(`Erro ao criar mu00f3dulo no curso ${courseId}:`, error);
    throw error;
  }
};

// Atualizar um mu00f3dulo
export const updateModule = async (moduleId: string, moduleData: Partial<Module>): Promise<Module> => {
  try {
    const data = await fetchWithAuth(`/api/modules/${moduleId}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: moduleData.title,
        description: moduleData.description,
        order_number: moduleData.order
      })
    });
    
    // Converter para o formato esperado pelo frontend
    return {
      id: data.id,
      courseId: data.course_id,
      title: data.title,
      description: data.description || '',
      order: data.order_number,
      lessons: [],
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error(`Erro ao atualizar mu00f3dulo ${moduleId}:`, error);
    throw error;
  }
};

// Excluir um mu00f3dulo
export const deleteModule = async (moduleId: string): Promise<void> => {
  try {
    await fetchWithAuth(`/api/modules/${moduleId}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error(`Erro ao excluir mu00f3dulo ${moduleId}:`, error);
    throw error;
  }
};

// ============================
// AULAS
// ============================

// Obter todas as aulas de um mu00f3dulo
export const getLessonsByModuleId = async (moduleId: string): Promise<Lesson[]> => {
  try {
    const data = await fetchWithAuth(`/api/modules/${moduleId}/lessons`);
    
    // Converter para o formato esperado pelo frontend
    return data.map((lesson: any) => ({
      id: lesson.id,
      moduleId: lesson.module_id,
      title: lesson.title,
      description: lesson.description || '',
      duration: lesson.duration || '',
      videoUrl: lesson.video_url || '',
      content: lesson.content || '',
      order: lesson.order_number,
      isCompleted: false,
      createdAt: lesson.created_at,
      updatedAt: lesson.updated_at
    }));
  } catch (error) {
    console.error(`Erro ao buscar aulas do mu00f3dulo ${moduleId}:`, error);
    throw error;
  }
};

// Obter uma aula por ID
export const getLessonById = async (lessonId: string): Promise<Lesson> => {
  try {
    const lesson = await fetchWithAuth(`/api/lessons/${lessonId}`);
    
    // Converter para o formato esperado pelo frontend
    return {
      id: lesson.id,
      moduleId: lesson.module_id,
      title: lesson.title,
      description: lesson.description || '',
      duration: lesson.duration || '',
      videoUrl: lesson.video_url || '',
      content: lesson.content || '',
      order: lesson.order_number,
      isCompleted: false,
      createdAt: lesson.created_at,
      updatedAt: lesson.updated_at
    };
  } catch (error) {
    console.error(`Erro ao buscar aula ${lessonId}:`, error);
    throw error;
  }
};

// Criar uma nova aula
export const createLesson = async (moduleId: string, lessonData: Omit<Lesson, 'id' | 'moduleId' | 'createdAt' | 'updatedAt' | 'completed'>): Promise<Lesson> => {
  try {
    const data = await fetchWithAuth(`/api/modules/${moduleId}/lessons`, {
      method: 'POST',
      body: JSON.stringify({
        title: lessonData.title,
        description: lessonData.description,
        duration: lessonData.duration,
        video_url: lessonData.videoUrl,
        content: lessonData.content,
        order_number: lessonData.order
      })
    });
    
    // Converter para o formato esperado pelo frontend
    return {
      id: data.id,
      moduleId: data.module_id,
      title: data.title,
      description: data.description || '',
      duration: data.duration || '',
      videoUrl: data.video_url || '',
      content: data.content || '',
      order: data.order_number,
      isCompleted: false,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error(`Erro ao criar aula no mu00f3dulo ${moduleId}:`, error);
    throw error;
  }
};

// Atualizar uma aula
export const updateLesson = async (lessonId: string, lessonData: Partial<Lesson>): Promise<Lesson> => {
  try {
    const data = await fetchWithAuth(`/api/lessons/${lessonId}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: lessonData.title,
        description: lessonData.description,
        duration: lessonData.duration,
        video_url: lessonData.videoUrl,
        content: lessonData.content,
        order_number: lessonData.order
      })
    });
    
    // Converter para o formato esperado pelo frontend
    return {
      id: data.id,
      moduleId: data.module_id,
      title: data.title,
      description: data.description || '',
      duration: data.duration || '',
      videoUrl: data.video_url || '',
      content: data.content || '',
      order: data.order_number,
      isCompleted: false,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error(`Erro ao atualizar aula ${lessonId}:`, error);
    throw error;
  }
};

// Excluir uma aula
export const deleteLesson = async (lessonId: string): Promise<void> => {
  try {
    await fetchWithAuth(`/api/lessons/${lessonId}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error(`Erro ao excluir aula ${lessonId}:`, error);
    throw error;
  }
};

// ============================
// PROGRESSO DO ALUNO
// ============================

// Obter progresso de aulas específicas
export const getLessonProgress = async (userId: string, lessonIds: string[]): Promise<{ lesson_id: string, completed: boolean }[]> => {
  try {
    const data = await fetchWithAuth(`/api/progress/${userId}/lessons`, {
      method: 'POST',
      body: JSON.stringify({ lessonIds })
    });
    return data;
  } catch (error) {
    console.error('Erro ao buscar progresso das aulas:', error);
    throw error;
  }
};

// Marcar uma aula como concluiu00edda
export const markLessonAsCompleted = async (userId: string, lessonId: string): Promise<boolean> => {
  try {
    // Usar o endpoint correto para marcar aula como concluída
    await fetchWithAuth(`/api/lesson-progress`, {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        lesson_id: lessonId,
        completed: true
      })
    });
    return true;
  } catch (error) {
    console.error(`Erro ao marcar aula ${lessonId} como concluiu00edda para usuário ${userId}:`, error);
    return false;
  }
};

// Obter progresso do aluno em um curso
export const getUserCourseProgress = async (courseId: string): Promise<any> => {
  try {
    return await fetchWithAuth(`/api/user/courses/${courseId}/progress`);
  } catch (error) {
    console.error(`Erro ao obter progresso no curso ${courseId}:`, error);
    throw error;
  }
};

// ============================
// CERTIFICADOS
// ============================

// Interface para certificado
interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  issue_date: string;
  certificate_number: string;
  certificate_url?: string;
  created_at: string;
  updated_at: string;
}

// Verificar se existe certificado para um curso
export const checkCertificate = async (userId: string, courseId: string): Promise<Certificate | null> => {
  try {
    const data = await fetchWithAuth(`/api/certificates/check?user_id=${userId}&course_id=${courseId}`);
    return data;
  } catch (error) {
    if (error.message?.includes('404')) {
      // Certificado não encontrado é uma condição normal
      return null;
    }
    console.error(`Erro ao verificar certificado para usuário ${userId} no curso ${courseId}:`, error);
    throw error;
  }
};

// Criar um certificado
export const createCertificate = async (userId: string, courseId: string): Promise<Certificate> => {
  try {
    // Primeiro buscar o nome do curso
    const course = await getCourseById(courseId);
    if (!course) {
      throw new Error('Curso não encontrado');
    }

    const data = await fetchWithAuth('/api/certificates', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        course_id: courseId,
        course_name: course.title
      })
    });
    return data;
  } catch (error) {
    console.error(`Erro ao criar certificado para usuário ${userId} no curso ${courseId}:`, error);
    throw error;
  }
};

// ============================
// ENROLLMENTS
// ============================

// Enroll a user in a course
export const enrollCourse = async (courseId: string, userId: string): Promise<{ success: boolean; message: string; enrollment?: any }> => {
  try {
    const data = await fetchWithAuth(`/api/enrollments`, {
      method: 'POST',
      body: JSON.stringify({ course_id: courseId, user_id: userId })
    });
    return { success: true, message: 'Matrícula realizada com sucesso!', enrollment: data };
  } catch (error: any) {
    if (error.message && error.message.includes('already enrolled')) {
      return { success: true, message: 'Usuário já está matriculado neste curso.' };
    }
    return { success: false, message: error.message || 'Erro ao realizar matrícula.' };
  }
};

// Get all enrollments for a user
export const getEnrollmentsByUser = async (userId: string): Promise<any[]> => {
  try {
    // Adicionar timestamp à URL para evitar cache do navegador
    const timestamp = new Date().getTime();
    return await fetchWithAuth(`/api/enrollments?user_id=${userId}&_t=${timestamp}`);
  } catch (error: any) {
    console.error('Error fetching enrollments:', error);
    return [];
  }
};

// Update course progress for a user
export const updateCourseProgress = async (courseId: string, userId: string, progress: number): Promise<void> => {
  try {
    await fetchWithAuth(`/api/enrollments/progress`, {
      method: 'PUT',
      body: JSON.stringify({ course_id: courseId, user_id: userId, progress })
    });
  } catch (error: any) {
    console.error('Error updating course progress:', error);
    throw error;
  }
};

// Get all enrollments for a specific course
export const getEnrollmentsByCourse = async (courseId: string): Promise<any[]> => {
  try {
    return await fetchWithAuth(`/api/enrollments/course/${courseId}`);
  } catch (error: any) {
    console.error('Error fetching course enrollments:', error);
    return [];
  }
};

// Get all users
export const getUsers = async (): Promise<any[]> => {
  try {
    return await fetchWithAuth('/auth/users');
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return [];
  }
};

// Get enrollment status for a user in a course
export const checkEnrollment = async (courseId: string, userId: string): Promise<any> => {
  try {
    return await fetchWithAuth(`/api/enrollments/${userId}/${courseId}`);
  } catch (error) {
    return null;
  }
};
