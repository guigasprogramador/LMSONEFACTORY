import { Module } from '@/types';
import { 
  createModule as apiCreateModule, 
  updateModule as apiUpdateModule, 
  deleteModule as apiDeleteModule,
  getModuleById as apiGetModuleById,
  getModulesByCourseId as apiGetModulesByCourseId
} from '../api/restClient';

/**
 * Obter todos os mu00f3dulos de um curso (admin)
 */
export const getModulesByCourseId = async (courseId: string): Promise<Module[]> => {
  try {
    console.log('Fetching modules for course:', courseId);
    
    // Usar o cliente REST para buscar os mu00f3dulos
    const modules = await apiGetModulesByCourseId(courseId);
    
    return modules;
  } catch (error) {
    console.error(`Error fetching modules for course ${courseId}:`, error);
    throw error;
  }
};

/**
 * Obter um mu00f3dulo por ID (admin)
 */
export const getModuleById = async (moduleId: string): Promise<Module> => {
  try {
    console.log('Fetching module:', moduleId);
    
    // Usar o cliente REST para buscar o mu00f3dulo
    const module = await apiGetModuleById(moduleId);
    
    return module;
  } catch (error) {
    console.error(`Error fetching module ${moduleId}:`, error);
    throw error;
  }
};

/**
 * Criar um novo mu00f3dulo (admin)
 */
export const createModule = async (courseId: string, moduleData: Omit<Module, 'id' | 'courseId' | 'createdAt' | 'updatedAt' | 'lessons'>): Promise<Module> => {
  try {
    console.log('Creating module for course:', courseId, 'with data:', moduleData);
    
    // Usar o cliente REST para criar o mu00f3dulo
    const module = await apiCreateModule(courseId, moduleData);
    
    return module;
  } catch (error) {
    console.error(`Error creating module for course ${courseId}:`, error);
    throw error;
  }
};

/**
 * Atualizar um mu00f3dulo (admin)
 */
export const updateModule = async (moduleId: string, moduleData: Partial<Module>): Promise<Module> => {
  try {
    console.log('Updating module:', moduleId, 'with data:', moduleData);
    
    // Usar o cliente REST para atualizar o mu00f3dulo
    const module = await apiUpdateModule(moduleId, moduleData);
    
    return module;
  } catch (error) {
    console.error(`Error updating module ${moduleId}:`, error);
    throw error;
  }
};

/**
 * Excluir um mu00f3dulo (admin)
 */
export const deleteModule = async (moduleId: string): Promise<void> => {
  try {
    console.log('Deleting module:', moduleId);
    
    // Usar o cliente REST para excluir o mu00f3dulo
    await apiDeleteModule(moduleId);
  } catch (error) {
    console.error(`Error deleting module ${moduleId}:`, error);
    throw error;
  }
};
