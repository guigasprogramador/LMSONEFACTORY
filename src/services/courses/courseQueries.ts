import { Course } from '@/types';
import { getCourses as getCoursesRest } from '../api/restClient';

// Cache para armazenar cursos e evitar recarregamento desnecessário
let coursesCache: Course[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60000; // 1 minuto em milissegundos

// Variável para controlar quando devemos forçar a atualização do cache
let forceCacheRefresh = false;

/**
 * Limpar o cache de cursos para garantir que os dados serão atualizados
 * Esta função deve ser chamada quando ocorrem mudanças que afetam os cursos
 * como matrículas, conclusões de cursos, etc.
 */
export const clearCoursesCache = () => {
  console.log('Limpando cache de cursos');
  coursesCache = null;
  cacheTimestamp = 0;
  forceCacheRefresh = true;
};

/**
 * Get all courses - versão otimizada para melhor performance
 */
export const getCourses = async (): Promise<Course[]> => {
  try {
    const now = Date.now();
    // Usar cache apenas se não foi solicitado refresh forçado e se o cache é válido
    if (!forceCacheRefresh && coursesCache && (now - cacheTimestamp < CACHE_DURATION)) {
      console.log('Usando cache de cursos');
      return coursesCache;
    }
    
    // Resetar flag após usar
    forceCacheRefresh = false;
    
    const coursesData = await getCoursesRest();
    coursesCache = coursesData;
    cacheTimestamp = now;
    return coursesData;
  } catch (error) {
    console.error('Erro ao buscar cursos:', error);
    throw error;
  }
};

// Cache para cursos individuais
const courseDetailsCache = new Map<string, {data: Course, timestamp: number}>();

/**
 * Get course by ID - versão otimizada
 */
export const getCourseById = async (courseId: string): Promise<Course> => {
  try {
    const now = Date.now();
    
    // Verificar cache
    const cachedCourse = courseDetailsCache.get(courseId);
    if (cachedCourse && (now - cachedCourse.timestamp < CACHE_DURATION)) {
      console.log(`Usando cache para o curso ${courseId}`);
      return cachedCourse.data;
    }
    
    // Usar um timestamp único para o timer para evitar duplicação
    const timerId = `fetchCourse:${courseId}_${Date.now()}`;
    console.time(timerId);
    
    // Simplificando as consultas para evitar erros 400
    // Vamos fazer consultas separadas em vez de Promise.all para melhor tratamento de erros
    
    // 1. Buscar dados básicos do curso
    const courseResult = await supabase
      .from('courses')
      .select('id, title, description, thumbnail, duration, instructor, created_at')
      .eq('id', courseId)
      .single();
    
    if (courseResult.error) {
      console.error('Erro ao buscar dados do curso, tentando consulta simplificada:', courseResult.error);
      // Tentativa simplificada como fallback
      const simpleCourseResult = await supabase
        .from('courses')
        .select('id, title')
        .eq('id', courseId)
        .single();
        
      if (simpleCourseResult.error) throw simpleCourseResult.error;
      
      // Criar um curso com dados mínimos
      return {
        id: simpleCourseResult.data.id,
        title: simpleCourseResult.data.title,
        description: '',
        thumbnail: '/placeholder.svg',
        duration: '',
        instructor: 'Instrutor',
        enrolledCount: 0,
        rating: 0,
        modules: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isEnrolled: false,
        progress: 0
      };
    }
    
    // 2. Buscar módulos do curso
    const modulesResult = await supabase
      .from('modules')
      .select('id, title, description, course_id, order_number')
      .eq('course_id', courseId)
      .order('order_number', { ascending: true });
    
    // Verificar erros
    if (courseResult.error) throw courseResult.error;
    if (!courseResult.data) throw new Error('Curso não encontrado');
    if (modulesResult.error) throw modulesResult.error;
    
    const courseData = courseResult.data;
    const modulesData = modulesResult.data || [];
    
    // 3. Buscar aulas para todos os módulos em uma única consulta (mais eficiente)
    const moduleIds = modulesData.map(m => m.id);
    let lessonsData = [];
    
    if (moduleIds.length > 0) {
      const lessonsResult = await supabase
        .from('lessons')
        .select('id, title, description, video_url, content, order_number, module_id, duration')
        .in('module_id', moduleIds)
        .order('order_number', { ascending: true });
      
      if (lessonsResult.error) throw lessonsResult.error;
      lessonsData = lessonsResult.data || [];
    }
    
    // Agrupar aulas por módulo para evitar múltiplas consultas
    const lessonsByModule = {};
    lessonsData.forEach(lesson => {
      if (!lessonsByModule[lesson.module_id]) {
        lessonsByModule[lesson.module_id] = [];
      }
      lessonsByModule[lesson.module_id].push({
        id: lesson.id,
        moduleId: lesson.module_id,
        title: lesson.title,
        description: lesson.description || '',
        duration: lesson.duration || '',
        videoUrl: lesson.video_url || '',
        content: lesson.content || '',
        order: lesson.order_number,
        isCompleted: false
      });
    });
    
    // Mapear módulos com suas aulas
    const modules = modulesData.map(module => ({
      id: module.id,
      courseId: module.course_id,
      title: module.title,
      description: module.description || '',
      order: module.order_number,
      lessons: lessonsByModule[module.id] || []
    }));
    
    // Montar o objeto do curso
    const course = {
      id: courseData.id,
      title: courseData.title,
      description: courseData.description || '',
      thumbnail: courseData.thumbnail || '/placeholder.svg',
      duration: courseData.duration || '',
      instructor: courseData.instructor,
      enrolledCount: 0, // Valor padrão já que removemos o campo enrolledcount da consulta
      rating: 0, // Valor padrão já que removemos o campo rating da consulta
      modules: modules,
      createdAt: courseData.created_at,
      updatedAt: courseData.created_at, // Usando created_at como fallback já que removemos updated_at da consulta
      isEnrolled: false,
      progress: 0
    };
    
    console.timeEnd(timerId);
    console.log(`Curso ${courseId} carregado com ${modules.length} módulos e ${lessonsData.length} aulas`);
    
    // Atualizar cache
    courseDetailsCache.set(courseId, {
      data: course,
      timestamp: now
    });
    
    return course;
  } catch (error) {
    console.error('Error fetching course by ID:', error);
    // Remover do cache em caso de erro
    courseDetailsCache.delete(courseId);
    throw error;
  }
};
