import { Lesson } from '@/types';
import { 
  createLesson as apiCreateLesson, 
  updateLesson as apiUpdateLesson, 
  deleteLesson as apiDeleteLesson,
  getLessonById as apiGetLessonById,
  getLessonsByModuleId as apiGetLessonsByModuleId,
  markLessonAsCompleted as apiMarkLessonAsCompleted
} from '../api/restClient';

/**
 * Obter todas as aulas de um mu00f3dulo (admin)
 */
export const getLessonsByModuleId = async (moduleId: string): Promise<Lesson[]> => {
  try {
    console.log('Fetching lessons for module:', moduleId);
    
    // Usar o cliente REST para buscar as aulas
    const lessons = await apiGetLessonsByModuleId(moduleId);
    
    return lessons;
  } catch (error) {
    console.error(`Error fetching lessons for module ${moduleId}:`, error);
    throw error;
  }
};

/**
 * Obter uma aula por ID (admin)
 */
export const getLessonById = async (lessonId: string): Promise<Lesson> => {
  try {
    console.log('Fetching lesson:', lessonId);
    
    // Usar o cliente REST para buscar a aula
    const lesson = await apiGetLessonById(lessonId);
    
    return lesson;
  } catch (error) {
    console.error(`Error fetching lesson ${lessonId}:`, error);
    throw error;
  }
};

/**
 * Criar uma nova aula (admin)
 */
export const createLesson = async (moduleId: string, lessonData: Omit<Lesson, 'id' | 'moduleId' | 'createdAt' | 'updatedAt' | 'isCompleted'>): Promise<Lesson> => {
  try {
    console.log('Creating lesson for module:', moduleId, 'with data:', lessonData);
    
    // Usar o cliente REST para criar a aula
    const lesson = await apiCreateLesson(moduleId, lessonData);
    
    return lesson;
  } catch (error) {
    console.error(`Error creating lesson for module ${moduleId}:`, error);
    throw error;
  }
};

/**
 * Atualizar uma aula (admin)
 */
export const updateLesson = async (lessonId: string, lessonData: Partial<Lesson>): Promise<Lesson> => {
  try {
    console.log('Updating lesson:', lessonId, 'with data:', lessonData);
    
    // Usar o cliente REST para atualizar a aula
    const lesson = await apiUpdateLesson(lessonId, lessonData);
    
    return lesson;
  } catch (error) {
    console.error(`Error updating lesson ${lessonId}:`, error);
    throw error;
  }
};

/**
 * Excluir uma aula (admin)
 */
export const deleteLesson = async (lessonId: string): Promise<void> => {
  try {
    console.log('Deleting lesson:', lessonId);
    
    // Usar o cliente REST para excluir a aula
    await apiDeleteLesson(lessonId);
  } catch (error) {
    console.error(`Error deleting lesson ${lessonId}:`, error);
    throw error;
  }
};

/**
 * Marcar uma aula como concluiu00edda (estudante)
 */
export const markLessonAsCompleted = async (lessonId: string): Promise<void> => {
  try {
    console.log('Marking lesson as completed:', lessonId);
    
    // Usar o cliente REST para marcar a aula como concluiu00edda
    await apiMarkLessonAsCompleted(lessonId);
  } catch (error) {
    console.error(`Error marking lesson ${lessonId} as completed:`, error);
    throw error;
  }
};
