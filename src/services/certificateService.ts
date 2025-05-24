import { Certificate } from '@/types';
import { toast } from 'sonner';
import { requestThrottler } from '@/utils/requestThrottler';
import { getUserCourseProgress, fetchWithAuth } from './api/restClient';

interface CertificateDB {
  id: string;
  user_id: string;
  course_id: string;
  course_name: string;
  user_name: string;
  course_hours?: number;
  issue_date: string;
  expiry_date?: string;
  certificate_url?: string;
  certificate_html?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCertificateData {
  userId: string;
  courseId: string;
  userName: string;
  courseName: string;
  courseHours?: number;
  issueDate?: string;
  expiryDate?: string;
  certificateUrl?: string;
  certificateHtml?: string;
}

const mapToCertificate = (cert: CertificateDB): Certificate => ({
  id: cert.id,
  userId: cert.user_id,
  courseId: cert.course_id,
  courseName: cert.course_name,
  userName: cert.user_name,
  courseHours: cert.course_hours,
  issueDate: cert.issue_date,
  expiryDate: cert.expiry_date,
  certificateUrl: cert.certificate_url,
  certificateHtml: cert.certificate_html
});

let certificatesCache = new Map<string, { data: Certificate[], timestamp: number }>();
const CACHE_DURATION = 60000;

const getCertificates = async (userId?: string, courseId?: string): Promise<Certificate[]> => {
  try {
    const cacheKey = `certificates_${userId || 'all'}_${courseId || 'all'}`;
    const now = Date.now();
    const cachedData = certificatesCache.get(cacheKey);
    if (cachedData && (now - cachedData.timestamp < CACHE_DURATION)) {
      return cachedData.data;
    }
    // Garantir que estamos enviando user_id ou course_id corretamente
    let url = '/api/certificates';
    const params = [];
    if (userId) params.push(`user_id=${encodeURIComponent(userId)}`);
    if (courseId) params.push(`course_id=${encodeURIComponent(courseId)}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    const response = await fetchWithAuth(url);
    const certificates = response.map(mapToCertificate);
    certificatesCache.set(cacheKey, { data: certificates, timestamp: now });
    return certificates;
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return [];
  }
};

const createCertificate = async (certificateData: CreateCertificateData): Promise<Certificate> => {
  try {
    if (!certificateData.userId || !certificateData.courseId || !certificateData.userName || !certificateData.courseName) {
      throw new Error('Dados incompletos para criar certificado');
    }
    const existingCerts = await getCertificates(certificateData.userId, certificateData.courseId);
    if (existingCerts.length > 0) {
      return existingCerts[0];
    }
    const certificateHtml = certificateData.certificateHtml || createCertificateTemplate({
      userName: certificateData.userName,
      courseName: certificateData.courseName,
      courseHours: certificateData.courseHours || 40,
      issueDate: certificateData.issueDate || new Date().toISOString()
    });
    const payload = {
      user_id: certificateData.userId,
      course_id: certificateData.courseId,
      course_name: certificateData.courseName,
      user_name: certificateData.userName,
      course_hours: certificateData.courseHours || 40,
      issue_date: certificateData.issueDate || new Date().toISOString(),
      certificate_html: certificateHtml,
      expiry_date: certificateData.expiryDate,
      certificate_url: certificateData.certificateUrl
    };
    const response = await fetchWithAuth('/api/certificates', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return mapToCertificate(response);
  } catch (error) {
    console.error('Erro ao criar certificado:', error);
    toast.error(error instanceof Error ? error.message : 'Erro ao criar certificado');
    throw error;
  }
};

const generateCertificate = async (courseId: string, userId: string): Promise<Certificate> => {
  try {
    if (!courseId || !userId) {
      throw new Error('ID do curso e ID do usuário são obrigatórios');
    }
    const certCacheKey = `certificate-${userId}-${courseId}`;
    const cachedCert = requestThrottler.getCachedItem(certCacheKey);
    if (cachedCert) {
      return cachedCert;
    }
    const existingCerts = await getCertificates(userId, courseId);
    if (existingCerts && existingCerts.length > 0) {
      requestThrottler.cacheItem(certCacheKey, existingCerts[0]);
      return existingCerts[0];
    }
    let isEligible = false;
    let courseHours = 40;
    try {
      const progress = await getUserCourseProgress(courseId);
      if (progress && progress.progress === 100) {
        isEligible = true;
      }
    } catch (eligibilityError) {
      isEligible = true;
    }
    if (!isEligible) {
      throw new Error('Usuário não é elegível para receber certificado. O curso deve estar 100% concluído.');
    }
    let courseTitle = 'Curso Concluído';
    let userName = 'Aluno';
    try {
      const courseResp = await fetchWithAuth(`/api/courses/${courseId}`);
      if (courseResp && courseResp.title) {
        courseTitle = courseResp.title;
        if (courseResp.duration) {
          const hoursMatch = courseResp.duration.match(/(\d+)\s*h/i);
          if (hoursMatch && hoursMatch[1]) {
            courseHours = parseInt(hoursMatch[1], 10);
          }
        }
      }
      const userResp = await fetchWithAuth(`/api/users/${userId}`);
      if (userResp && userResp.name) {
        userName = userResp.name;
      }
    } catch (dataError) {}
    const now = new Date();
    const certificateHtml = createCertificateTemplate({
      userName: userName,
      courseName: courseTitle,
      courseHours: courseHours,
      issueDate: now.toISOString().split('T')[0]
    });
    const certificateData = {
      userId: userId,
      courseId: courseId,
      userName: userName,
      courseName: courseTitle,
      courseHours: courseHours,
      issueDate: now.toISOString(),
      certificateHtml: certificateHtml
    };
    const certificate = await createCertificate(certificateData);
    requestThrottler.cacheItem(certCacheKey, certificate);
    toast.success('Certificado gerado com sucesso! Você pode visualizá-lo na seção de certificados.');
    return certificate;
  } catch (error) {
    console.error('[CERTIFICADO] Erro geral na geração de certificado:', error);
    throw error;
  }
};

const createVirtualCertificate = (userId: string, courseId: string, userName: string, courseName: string, courseHours: number = 40): Certificate => {
  const now = new Date();
  const virtualCert: Certificate = {
    id: `virtual-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    userId: userId,
    courseId: courseId,
    userName: userName,
    courseName: courseName,
    courseHours: courseHours,
    issueDate: now.toISOString(),
    certificateHtml: createCertificateTemplate({
      userName: userName,
      courseName: courseName,
      courseHours: courseHours,
      issueDate: now.toISOString().split('T')[0]
    }),
    certificateUrl: null,
    expiryDate: null
  };
  return virtualCert;
};

const createCertificateTemplate = (data: { userName: string; courseName: string; courseHours: number; issueDate: string; }): string => {
  const issueDateObj = new Date(data.issueDate);
  const formattedDate = issueDateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const registrationNumber = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  return `<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><title>Certificado de Conclusão - ${data.courseName}</title><style>@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');body, html {margin: 0;padding: 0;font-family: 'Montserrat', sans-serif;color: #333;background-color: #f9f9f9;}.certificate-container {width: 800px;height: 600px;margin: 0 auto;background-color: white;box-shadow: 0 0 20px rgba(0,0,0,0.1);padding: 40px;box-sizing: border-box;position: relative;border: 20px solid #f0f0f0;}.certificate-header {text-align: center;border-bottom: 2px solid #3b82f6;padding-bottom: 20px;margin-bottom: 40px;}.certificate-title {font-size: 32px;font-weight: 700;margin: 0;color: #3b82f6;text-transform: uppercase;}.certificate-subtitle {font-size: 18px;margin-top: 10px;color: #666;}.certificate-content {text-align: center;margin-bottom: 40px;}.student-name {font-size: 28px;font-weight: 600;margin: 20px 0;color: #333;border-bottom: 1px solid #ddd;display: inline-block;padding-bottom: 5px;min-width: 400px;}.certificate-text {font-size: 16px;line-height: 1.6;margin: 20px 0;}.course-name {font-size: 20px;font-weight: 600;color: #3b82f6;margin: 15px 0;}.certificate-footer {display: flex;justify-content: space-between;margin-top: 60px;border-top: 1px solid #ddd;padding-top: 20px;}.signature {text-align: center;width: 200px;}.signature-line {width: 100%;height: 1px;background-color: #333;margin-bottom: 5px;}.signature-name {font-weight: 600;}.signature-title {font-size: 12px;color: #666;}.certificate-seal {position: absolute;bottom: 30px;right: 40px;width: 100px;height: 100px;background: linear-gradient(135deg, #3b82f6, #60a5fa);border-radius: 50%;display: flex;align-items: center;justify-content: center;box-shadow: 0 0 10px rgba(0,0,0,0.2);}.seal-text {color: white;font-weight: 700;font-size: 14px;text-align: center;text-transform: uppercase;}.details {position: absolute;bottom: 20px;left: 40px;font-size: 12px;color: #666;}@media print {body {background-color: white;}.certificate-container {box-shadow: none;border: 2px solid #f0f0f0;}}</style></head><body><div class=\"certificate-container\"><div class=\"certificate-header\"><h1 class=\"certificate-title\">Certificado de Conclusão</h1><p class=\"certificate-subtitle\">Este documento certifica que</p></div><div class=\"certificate-content\"><div class=\"student-name\">${data.userName}</div><p class=\"certificate-text\">concluiu com sucesso o curso intitulado</p><div class=\"course-name\">${data.courseName}</div><p class=\"certificate-text\">com carga horária total de <strong>${data.courseHours} horas</strong>, tendo demonstrado dedicação e conhecimento em todos os módulos propostos.</p></div><div class=\"certificate-footer\"><div class=\"signature\"><div class=\"signature-line\"></div><div class=\"signature-name\">Diretor de Ensino</div><div class=\"signature-title\">Plataforma de Ensino</div></div><div class=\"signature\"><div class=\"signature-line\"></div><div class=\"signature-name\">Coordenador do Curso</div><div class=\"signature-title\">Plataforma de Ensino</div></div></div><div class=\"certificate-seal\"><div class=\"seal-text\">Certificado Verificado</div></div><div class=\"details\"><div>Data de Emissão: ${formattedDate}</div><div>Registro: ${registrationNumber}</div></div></div></body></html>`;
};

const getCertificateById = async (certificateId: string): Promise<Certificate> => {
  try {
    if (!certificateId) {
      throw new Error('ID do certificado é obrigatório');
    }
    
    // Usar o servidor na porta 3002 para buscar certificados por ID
    const token = localStorage.getItem('lms-auth-token-v2');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`http://localhost:3002/api/certificates/${certificateId}`, {
      headers
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return mapToCertificate(data);
  } catch (error) {
    console.error('Erro ao buscar certificado:', error);
    toast.error(error instanceof Error ? error.message : 'Erro ao buscar certificado');
    throw error;
  }
};

const updateCertificate = async (certificateId: string, certificateData: Partial<CreateCertificateData>): Promise<Certificate> => {
  try {
    if (!certificateId) {
      throw new Error('ID do certificado é obrigatório');
    }
    const response = await fetchWithAuth(`/api/certificates/${certificateId}`, {
      method: 'PUT',
      body: JSON.stringify(certificateData)
    });
    return mapToCertificate(response);
  } catch (error) {
    console.error('Error updating certificate:', error);
    toast.error(error instanceof Error ? error.message : 'Erro ao atualizar certificado');
    throw error;
  }
};

const deleteCertificate = async (certificateId: string): Promise<boolean> => {
  try {
    if (!certificateId) {
      throw new Error('ID do certificado é obrigatório');
    }
    await fetchWithAuth(`/api/certificates/${certificateId}`, { method: 'DELETE' });
    return true;
  } catch (error) {
    console.error('Error deleting certificate:', error);
    toast.error(error instanceof Error ? error.message : 'Erro ao excluir certificado');
    throw error;
  }
};

const isEligibleForCertificate = async (userId: string, courseId: string): Promise<boolean> => {
  try {
    if (!userId || !courseId) {
      return false;
    }
    const progress = await getUserCourseProgress(courseId);
    return progress && progress.progress === 100;
  } catch (error) {
    console.error('Erro ao verificar elegibilidade para certificado:', error);
    return false;
  }
};

export const certificateService = {
  getCertificates,
  getCertificateById,
  createCertificate,
  generateCertificate,
  updateCertificate,
  deleteCertificate,
  isEligibleForCertificate,
  createCertificateTemplate
};
