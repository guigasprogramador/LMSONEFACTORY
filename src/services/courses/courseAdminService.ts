
import { Course } from '@/types';
import { createCourse as apiCreateCourse, updateCourse as apiUpdateCourse, deleteCourse as apiDeleteCourse } from '../api/restClient';

/**
 * Create a new course (admin)
 */
export const createCourse = async (courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'modules'>): Promise<Course> => {
  try {
    console.log('Creating course with data:', courseData);
    
    // Usar o cliente REST para criar o curso
    const course = await apiCreateCourse(courseData);
    
    return course;
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
};

/**
 * Update a course (admin)
 */
export const updateCourse = async (courseId: string, course: Partial<Course>): Promise<Course> => {
  try {
    console.log('Updating course:', courseId, 'with data:', course);
    
    // Usar o cliente REST para atualizar o curso
    const updatedCourse = await apiUpdateCourse(courseId, course);
    return updatedCourse;
  } catch (error) {
    console.error(`Error updating course ${courseId}:`, error);
    throw error;
  }
};

/**
 * Delete a course (admin)
 */
export const deleteCourse = async (courseId: string): Promise<void> => {
  try {
    // Usar o cliente REST para excluir o curso
    await apiDeleteCourse(courseId);
  } catch (error) {
    console.error(`Error deleting course ${courseId}:`, error);
    throw error;
  }
};
