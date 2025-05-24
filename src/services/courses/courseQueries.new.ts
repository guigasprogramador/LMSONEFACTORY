import { Course } from '@/types';
import { getCourses as apiGetCourses, getCourseById as apiGetCourseById } from '../api/restClient';

// Cache para armazenar cursos e evitar recarregamento desnecessário
let coursesCache: Course[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60000; // 1 minuto em milissegundos

/**
 * Get all courses - versão otimizada para melhor performance
 */
export const getCourses = async (): Promise<Course[]> => {
  try {
    const now = Date.now();
    
    // Verificar se temos dados em cache válidos
    if (coursesCache && (now - cacheTimestamp < CACHE_DURATION)) {
      console.log('Usando cache de cursos');
      return coursesCache;
    }
    
    // Usar um timestamp único para o timer para evitar duplicação
    const timerId = `fetchCourses_${Date.now()}`;
    console.time(timerId);
    
    // Buscar cursos usando a API REST MySQL
    try {
      const courses = await apiGetCourses();
      
      console.timeEnd(timerId); // Finalizar medição de tempo
      console.log(`Carregados ${courses.length} cursos sem detalhes de módulos e aulas`);
      
      // Atualizar cache
      coursesCache = courses;
      cacheTimestamp = now;
      
      return courses;
    } catch (error) {
      console.error('Erro ao buscar cursos da API REST:', error);
      // Tentar retornar dados do cache mesmo expirado em caso de erro
      if (coursesCache) {
        console.log('Usando cache expirado devido a erro na API');
        return coursesCache;
      }
      throw error;
    }
  } catch (error) {
    console.error('Error fetching courses:', error);
    // Limpar cache em caso de erro
    coursesCache = null;
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
    
    try {
      // Buscar dados do curso usando a API REST MySQL
      const course = await apiGetCourseById(courseId);
      
      console.timeEnd(timerId);
      
      // Atualizar cache
      courseDetailsCache.set(courseId, {
        data: course,
        timestamp: now
      });
      
      return course;
    } catch (error) {
      console.error(`Erro ao buscar curso ${courseId} da API REST:`, error);
      // Tentar retornar dados do cache mesmo expirado em caso de erro
      if (cachedCourse) {
        console.log(`Usando cache expirado para o curso ${courseId} devido a erro na API`);
        return cachedCourse.data;
      }
      throw error;
    }
  } catch (error) {
    console.error(`Error fetching course ${courseId}:`, error);
    throw error;
  }
};

/**
 * Limpar cache de cursos
 */
export const clearCoursesCache = () => {
  console.log('Limpando cache de cursos');
  coursesCache = null;
  cacheTimestamp = 0;
  courseDetailsCache.clear();
};