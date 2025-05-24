import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { fetchWithAuth } from "@/services/api/restClient";
import { certificadoService } from "@/services/certificadoService";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

// Função auxiliar para buscar nome do usuário da API
async function getUserNameFromAuth(userId: string) {
  try {
    // Buscar o usuário direto da API
    const userData = await fetchWithAuth(`/api/users/${userId}`);
    if (userData && userData.name) {
      console.log(`Nome encontrado na API: ${userData.name}`);
      return userData.name;
    }
    
    // Se não encontrar, tentar buscar no perfil
    return null;
  } catch (error) {
    console.error("Erro ao buscar nome da autenticação:", error);
    return null;
  }
}

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Award, 
  CheckCircle, 
  Loader2, 
  Search, 
  AlertTriangle, 
  RefreshCw 
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface Aluno {
  id: string;
  name: string;
  email?: string; // Tornando email opcional para compatibilidade com a consulta simplificada
  selected?: boolean;
}

interface Curso {
  id: string;
  title: string;
  description?: string; // Tornando description opcional para compatibilidade com a consulta simplificada
  selected?: boolean;
}

interface User {
  id: string;
  name?: string;
  email?: string;
}

interface Matricula {
  id: string;
  user_id: string;
  course_id: string;
  created_at: string;
  userName: string;
  courseTitle: string;
  progress: number;
  hasCertificate: boolean;
  certificateId?: string;
  selected: boolean;
}

interface Certificado {
  id: string;
  user_id: string;
  course_id: string;
  created_at: string;
  userName?: string;
  courseTitle?: string;
}

export default function GerenciadorCertificados() {
  const { user } = useAuth();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [cursoSelecionado, setCursoSelecionado] = useState<string>("");
  const [pesquisa, setPesquisa] = useState<string>("");
  const [carregando, setCarregando] = useState<boolean>(true);
  const [processando, setProcessando] = useState<boolean>(false);
  const [progresso, setProgresso] = useState<number>(0);
  const [totalSelecionados, setTotalSelecionados] = useState<number>(0);
  const [todosSelecionados, setTodosSelecionados] = useState<boolean>(false);
  const [abaAtiva, setAbaAtiva] = useState<string>("matriculas");
  
  // Carregar dados iniciais
  useEffect(() => {
    const carregarDados = async () => {
      setCarregando(true);
      try {
        console.log("Iniciando carregamento de dados...");
        
        // Carregar cursos usando a API REST MySQL
        try {
          const cursosData = await fetchWithAuth('/api/courses');
          console.log(`Carregados ${cursosData?.length || 0} cursos`);
          setCursos(cursosData || []);
        } catch (error) {
          console.error("Erro ao carregar cursos:", error);
          toast.error("Erro ao carregar cursos");
        }
        
        // Carregar alunos usando a API REST MySQL
        try {
          const alunosData = await fetchWithAuth('/auth/admin/users');
          console.log(`Carregados ${alunosData?.length || 0} alunos`);
          setAlunos(alunosData || []);
        } catch (error) {
          console.error("Erro ao carregar alunos:", error);
          toast.error("Erro ao carregar alunos");
        }
        
        // Carregar certificados
        await carregarCertificados();
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast.error("Erro ao carregar dados. Tente novamente mais tarde.");
      } finally {
        setCarregando(false);
      }
    };
    
    carregarDados();
  }, []);
  
  // Carregar matrículas quando um curso for selecionado
  useEffect(() => {
    const carregarMatriculas = async () => {
      if (!cursoSelecionado) {
        setMatriculas([]);
        return;
      }
      
      setCarregando(true);
      try {
        console.log(`Carregando matrículas para o curso ${cursoSelecionado}...`);
        
        // Buscar matrículas para o curso selecionado
        const matriculasData = await fetchWithAuth(`/api/enrollments?course_id=${cursoSelecionado}`);
        console.log(`Encontradas ${matriculasData?.length || 0} matrículas`);
        
        if (!matriculasData || matriculasData.length === 0) {
          setMatriculas([]);
          setCarregando(false);
          return;
        }
        
        // Buscar informações dos usuários
        const usuariosData = await fetchWithAuth('/auth/admin/users') as User[];
        const usuariosMap = new Map(usuariosData.map(u => [u.id, u]));
        
        // Mapear matrículas com informações dos usuários
        const matriculasProcessadas = matriculasData.map(matricula => ({
          ...matricula,
          userName: usuariosMap.get(matricula.user_id)?.name || 
                   usuariosMap.get(matricula.user_id)?.email?.split('@')[0] || 
                   'Usuário não encontrado',
          courseTitle: cursos.find(c => c.id === matricula.course_id)?.title || 'Curso não encontrado',
          progress: 100,
          hasCertificate: false,
          selected: false
        }));
        
        // Verificar certificados existentes para cada matrícula
        const matriculasComCertificados = await Promise.all(
          matriculasProcessadas.map(async (matricula) => {
            try {
              const certificado = await fetchWithAuth(
                `/api/certificates/check?user_id=${matricula.user_id}&course_id=${matricula.course_id}`
              );
              
              // Agora a API retorna null com status 200 quando não encontra o certificado
              if (!certificado) {
                return {
                  ...matricula,
                  hasCertificate: false,
                  certificateId: null
                };
              }
              
              return {
                ...matricula,
                hasCertificate: true,
                certificateId: certificado.id
              };
            } catch (error) {
              console.error(`Erro ao verificar certificado para matrícula ${matricula.id}:`, error);
              return {
                ...matricula,
                hasCertificate: false,
                certificateId: null
              };
            }
          })
        );
        
        // Atualizar estado com as matrículas processadas
        setMatriculas(matriculasComCertificados);
        console.log(`Processadas ${matriculasComCertificados.length} matrículas com sucesso`);
      } catch (error) {
        console.error("Erro ao carregar matrículas:", error);
        toast.error("Erro ao carregar matrículas. Tente novamente mais tarde.");
      } finally {
        setCarregando(false);
      }
    };
    
    carregarMatriculas();
  }, [cursoSelecionado, alunos, cursos]);
  
  // Carregar certificados
  const carregarCertificados = async () => {
    try {
      console.log("Carregando certificados...");
      
      // Usar a API REST para buscar certificados
      const certificadosData = await fetchWithAuth('/api/certificates');
      
      console.log(`Encontrados ${certificadosData?.length || 0} certificados`);
      
      // Processar certificados um por um
      const certificadosProcessados = [];
      
      for (const certificado of (certificadosData || [])) {
        try {
          // Usar os campos user_name e course_name da API
          const aluno = alunos.find(a => a.id === certificado.user_id);
          const curso = cursos.find(c => c.id === certificado.course_id);
          
          certificadosProcessados.push({
            ...certificado,
          });
        } catch (error) {
          console.error("Erro ao processar certificado:", error);
        }
      }
      
      setCertificados(certificadosProcessados);
    } catch (error) {
      console.error("Erro ao carregar certificados:", error);
      toast.error("Erro ao carregar certificados");
    }
  };
  
  // Gerar certificado individual
  const gerarCertificadoIndividual = async (matricula: Matricula) => {
    console.log(`Gerando certificado individual para ${matricula.userName}`);
    try {
      // Verificar se já existe certificado
      const certificadoExistente = await fetchWithAuth(
        `/api/certificates/check?user_id=${matricula.user_id}&course_id=${matricula.course_id}`
      );
      
      if (certificadoExistente) {
        toast.info("Certificado já existe para este aluno");
        return;
      }

      // Criar novo certificado
      const novoCertificado = await fetchWithAuth('/api/certificates', {
        method: 'POST',
        body: JSON.stringify({
          user_id: matricula.user_id,
          course_id: matricula.course_id,
          course_name: matricula.courseTitle,
          user_name: matricula.userName
        })
      });
      
      if (!novoCertificado) {
        throw new Error("Erro ao criar certificado");
      }

      toast.success("Certificado gerado com sucesso!");
      // Recarregar as matrículas usando useEffect que monitora cursoSelecionado
      if (cursoSelecionado) {
        // Força o recarregamento das matrículas atualizando o estado do curso selecionado
        setCursoSelecionado(atual => {
          // Usar o mesmo valor atual, apenas para disparar o efeito
          return atual;
        });
      }
    } catch (error) {
      console.error("Erro ao gerar certificado:", error);
      toast.error("Erro ao gerar certificado. Tente novamente.");
    }
  };
  
  // Selecionar/deselecionar todos os alunos
  const toggleSelecionarTodos = () => {
    const novoEstado = !todosSelecionados;
    setTodosSelecionados(novoEstado);
    
    const matriculasAtualizadas = matriculas.map(matricula => ({
      ...matricula,
      selected: novoEstado
    }));
    
    setMatriculas(matriculasAtualizadas);
    setTotalSelecionados(novoEstado ? matriculasAtualizadas.length : 0);
  };
  
  // Selecionar/deselecionar um aluno específico
  const toggleSelecionarAluno = (id: string) => {
    const matriculasAtualizadas = matriculas.map(matricula => {
      if (matricula.id === id) {
        return {
          ...matricula,
          selected: !matricula.selected
        };
      }
      return matricula;
    });
    
    setMatriculas(matriculasAtualizadas);
    
    // Atualizar contagem de selecionados
    const novoTotalSelecionados = matriculasAtualizadas.filter(m => m.selected).length;
    setTotalSelecionados(novoTotalSelecionados);
    
    // Verificar se todos estão selecionados
    setTodosSelecionados(novoTotalSelecionados === matriculasAtualizadas.length);
  };
  
  // Filtrar matrículas com base na pesquisa
  const matriculasFiltradas = matriculas.filter(matricula => {
    if (!pesquisa) return true;
    
    const termoPesquisa = pesquisa.toLowerCase();
    return (
      matricula.userName?.toLowerCase().includes(termoPesquisa) ||
      matricula.courseTitle?.toLowerCase().includes(termoPesquisa)
    );
  });
  
  // Filtrar certificados com base na pesquisa
  const certificadosFiltrados = certificados.filter(certificado => {
    if (!pesquisa) return true;
    
    const termoPesquisa = pesquisa.toLowerCase();
    return (
      certificado.userName?.toLowerCase().includes(termoPesquisa) ||
      certificado.courseTitle?.toLowerCase().includes(termoPesquisa)
    );
  });
  
  // Gerar certificados para os alunos selecionados
  const gerarCertificados = async () => {
    const matriculasSelecionadas = matriculas.filter(m => m.selected && !m.hasCertificate);
    
    if (matriculasSelecionadas.length === 0) {
      toast.warning("Nenhum aluno selecionado ou todos já possuem certificados.");
      return;
    }
    
    setProcessando(true);
    setProgresso(0);
    
    let sucessos = 0;
    let falhas = 0;
    
    try {
      console.log(`Iniciando geração de ${matriculasSelecionadas.length} certificados...`);
      
      // Processar cada matrícula selecionada
      for (let i = 0; i < matriculasSelecionadas.length; i++) {
        const matricula = matriculasSelecionadas[i];
        
        try {
          console.log(`Gerando certificado para ${matricula.userName} no curso ${matricula.courseTitle}`);
          
          // Verificar se o usuário e curso existem
          if (!matricula.user_id || !matricula.course_id) {
            console.error(`Dados incompletos para gerar certificado: user_id=${matricula.user_id}, course_id=${matricula.course_id}`);
            falhas++;
            continue;
          }
          
          // Verificar se já existe um certificado usando a API REST
          try {
            const certExistente = await fetchWithAuth(
              `/api/certificates/check?user_id=${matricula.user_id}&course_id=${matricula.course_id}`
            );
            
            if (certExistente) {
              console.log(`Certificado já existe para ${matricula.userName}, pulando...`);
              sucessos++; // Consideramos como sucesso já que o certificado existe
              continue;
            }
          } catch (error) {
            console.error(`Erro ao verificar certificado para ${matricula.userName}:`, error);
            // Continua o fluxo para tentar criar um novo certificado
          }
          
          // Atualizar progresso para 100% se necessário
          if (matricula.progress < 100) {
            console.log(`Atualizando progresso para 100% para ${matricula.userName}`);
            await fetchWithAuth(`/api/enrollments/${matricula.user_id}/${matricula.course_id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ progress: 100 })
            });
          }
          
          // Obter nome do usuário e do curso
          let userName = matricula.userName;
          let courseName = matricula.courseTitle;
          
          // Primeiro tentar buscar o nome do usuário da autenticação
          console.log(`Tentando buscar nome do usuário ${matricula.user_id} da autenticação`);
          const authName = await getUserNameFromAuth(matricula.user_id);
          
          if (authName) {
            userName = authName;
            console.log(`Nome do usuário encontrado na autenticação: ${userName}`);
          } else {
            // Fallback: buscar da tabela profiles
            console.log(`Buscando nome do usuário ${matricula.user_id} da tabela profiles`);
            const userRes = await fetchWithAuth(`/api/users/${matricula.user_id}`);
            const userData = await userRes.json();
            if (userRes.status !== 200) {
              console.error(`Erro ao buscar perfil do usuário:`, userData);
            }
            if (userData && userData.name) {
              userName = userData.name;
              console.log(`Nome do usuário encontrado: ${userName}`);
            } else {
              console.warn(`Nome do usuário não encontrado para ID ${matricula.user_id}, usando valor atual: ${userName}`);
              if (userName === 'Aluno não encontrado' && userData && userData.email) {
                userName = userData.email.split('@')[0];
                console.log(`Usando email como fallback para nome: ${userName}`);
              }
            }
          }
          
          // Se o nome do curso não estiver disponível, tentar buscar
          if (courseName === 'Curso não encontrado') {
            const courseRes = await fetchWithAuth(`/api/courses/${matricula.course_id}`);
            const courseData = await courseRes.json();
            if (courseData && courseData.title) {
              courseName = courseData.title;
            }
          }
          
          // Criar o certificado diretamente no banco de dados
          const now = new Date().toISOString();
          const certRes = await fetchWithAuth(`/api/certificates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: matricula.user_id,
              course_id: matricula.course_id,
              user_name: userName,
              course_name: courseName,
              issue_date: now
            })
          });
          const novoCertificado = await certRes.json();
          if (!certRes.ok) {
            console.error(`Erro ao criar certificado:`, novoCertificado);
            falhas++;
            continue;
          }
          if (novoCertificado && novoCertificado.id) {
            sucessos++;
            console.log(`Certificado gerado com sucesso: ${novoCertificado.id}`);
            try {
              await fetchWithAuth(`/api/recent_certificates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: novoCertificado.id,
                  user_id: matricula.user_id,
                  course_id: matricula.course_id,
                  user_name: userName,
                  course_name: courseName,
                  issue_date: now
                })
              });
            } catch (recentError) {
              console.error("Erro ao registrar em recent_certificates:", recentError);
            }
          } else {
            falhas++;
            console.error(`Falha ao gerar certificado para ${matricula.userName}`);
          }
        } catch (error) {
          falhas++;
          console.error(`Erro ao gerar certificado para ${matricula.userName}:`, error);
        }
        // Atualizar progresso
        const novoProgresso = Math.round(((i + 1) / matriculasSelecionadas.length) * 100);
        setProgresso(novoProgresso);
      }
      // Exibir resultado
      if (sucessos > 0) {
        toast.success(`${sucessos} certificado(s) gerado(s) com sucesso!`);
        console.log(`Gerados ${sucessos} certificados com sucesso.`);
        if (cursoSelecionado) {
          console.log("Recarregando dados após geração de certificados...");
          // Buscar matrículas atualizadas
          const matriculasRes = await fetchWithAuth(`/api/enrollments?course_id=${cursoSelecionado}`);
          const matriculasData = await matriculasRes.json();
          if (!matriculasRes.ok) {
            console.error("Erro ao recarregar matrículas:", matriculasData);
          }
          // Buscar certificados atualizados
          const certificadosRes = await fetchWithAuth(`/api/certificates?course_id=${cursoSelecionado}`);
          const certificadosData = await certificadosRes.json();
          if (!certificadosRes.ok) {
            console.error("Erro ao recarregar certificados:", certificadosData);
          }
          if (matriculasData) {
            console.log(`Recarregadas ${matriculasData.length} matrículas`);
            const matriculasAtualizadas = [];
            for (const matricula of matriculasData) {
              try {
                const aluno = alunos.find(a => a.id === matricula.user_id);
                const certificado = certificadosData?.find(
                  c => c.user_id === matricula.user_id && c.course_id === matricula.course_id
                );
                matriculasAtualizadas.push({
                  ...matricula,
                  userName: aluno?.name || 'Aluno não encontrado',
                  courseTitle: cursos.find(c => c.id === matricula.course_id)?.title || 'Curso não encontrado',
                  hasCertificate: !!certificado,
                  certificateId: certificado?.id,
                  selected: false
                });
              } catch (itemError) {
                console.error("Erro ao processar matrícula:", itemError);
              }
            }
            console.log(`Processadas ${matriculasAtualizadas.length} matrículas atualizadas`);
            setMatriculas(matriculasAtualizadas);
            setTodosSelecionados(false);
            setTotalSelecionados(0);
          }
          await carregarCertificados();
        }
      }
      if (falhas > 0) {
        toast.error(`${falhas} certificado(s) não puderam ser gerados.`);
      }
    } catch (error) {
      console.error("Erro ao gerar certificados:", error);
      toast.error("Erro ao gerar certificados. Tente novamente mais tarde.");
    } finally {
      setProcessando(false);
      setProgresso(0);
    }
  };
  
  // Renderizar conteúdo com base no estado de carregamento
  if (carregando && !cursoSelecionado) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando dados...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold">Gerenciador de Certificados</h1>
        <p className="text-muted-foreground">
          Gerencie certificados para alunos matriculados em cursos.
        </p>
      </div>
      
      <Tabs value={abaAtiva} onValueChange={setAbaAtiva}>
        <TabsList>
          <TabsTrigger value="matriculas">Matrículas</TabsTrigger>
          <TabsTrigger value="certificados">Certificados Emitidos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="matriculas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Selecione um curso</CardTitle>
              <CardDescription>
                Escolha um curso para visualizar os alunos matriculados e gerenciar certificados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <Select value={cursoSelecionado} onValueChange={setCursoSelecionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {cursos.map((curso) => (
                      <SelectItem key={curso.id} value={curso.id}>
                        {curso.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {cursoSelecionado && (
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar alunos..."
                      value={pesquisa}
                      onChange={(e) => setPesquisa(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {cursoSelecionado && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Alunos Matriculados</CardTitle>
                  <CardDescription>
                    {matriculas.length} aluno(s) matriculado(s) neste curso
                  </CardDescription>
                </div>
                
                {matriculas.length > 0 && (
                  <Button
                    variant="default"
                    onClick={gerarCertificados}
                    disabled={totalSelecionados === 0 || processando}
                    className="gap-2"
                  >
                    {processando ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Award className="h-4 w-4" />
                        Gerar Certificados ({totalSelecionados})
                      </>
                    )}
                  </Button>
                )}
              </CardHeader>
              
              {processando && (
                <div className="px-6 pb-2">
                  <Progress value={progresso} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right mt-1">
                    {progresso}% concluído
                  </p>
                </div>
              )}
              
              <CardContent>
                {matriculas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <p className="text-muted-foreground">
                      Nenhum aluno matriculado neste curso.
                    </p>
                  </div>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={todosSelecionados}
                              onCheckedChange={toggleSelecionarTodos}
                              aria-label="Selecionar todos"
                            />
                          </TableHead>
                          <TableHead>Aluno</TableHead>
                          <TableHead>Progresso</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {matriculasFiltradas.map((matricula) => (
                          <TableRow key={matricula.id}>
                            <TableCell>
                              <Checkbox
                                checked={matricula.selected}
                                onCheckedChange={() => toggleSelecionarAluno(matricula.id)}
                                aria-label={`Selecionar ${matricula.userName}`}
                                disabled={matricula.hasCertificate}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{matricula.userName}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={matricula.progress}
                                  className="h-2 w-24"
                                />
                                <span className="text-sm">{matricula.progress}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {matricula.hasCertificate ? (
                                <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">
                                  <CheckCircle className="h-3 w-3 mr-1" /> Certificado Emitido
                                </Badge>
                              ) : matricula.progress === 100 ? (
                                <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                                  <AlertTriangle className="h-3 w-3 mr-1" /> Elegível para Certificado
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-200">
                                  Em Progresso
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {matricula.hasCertificate ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                >
                                  <a href={`/aluno/certificado/${matricula.certificateId}`} target="_blank" rel="noopener noreferrer">
                                    <Award className="h-3 w-3 mr-1" /> Ver Certificado
                                  </a>
                                </Button>
                              ) : matricula.progress === 100 ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      setProcessando(true);
                                      console.log(`Gerando certificado individual para ${matricula.userName}`);
                                      
                                      // Verificar se já existe um certificado
                                      try {
                                        const certExistente = await fetchWithAuth(`/api/certificates/check?user_id=${matricula.user_id}&course_id=${matricula.course_id}`);
                                        
                                        if (certExistente && certExistente.id) {
                                          console.log(`Certificado já existe: ${certExistente.id}`);
                                          toast.success("Certificado já existe!");
                                          
                                          // Atualizar a matrícula na lista
                                          const matriculasAtualizadas = matriculas.map(m => {
                                            if (m.id === matricula.id) {
                                              return {
                                                ...m,
                                                hasCertificate: true,
                                                certificateId: certExistente.id,
                                                selected: false
                                              };
                                            }
                                            return m;
                                          });
                                          
                                          setMatriculas(matriculasAtualizadas);
                                          await carregarCertificados();
                                          setProcessando(false);
                                          return;
                                        }
                                        
                                        // Atualizar progresso para 100%
                                        await fetchWithAuth(`/api/enrollments/${matricula.id}/progress`, {
                                          method: 'PUT',
                                          body: JSON.stringify({ progress: 100 })
                                        });
                                        
                                        // Buscar dados do curso
                                        const curso = cursos.find(c => c.id === matricula.course_id);
                                        if (!curso) {
                                          throw new Error('Curso não encontrado');
                                        }
                                        
                                        // Criar certificado
                                        const novoCertificado = await fetchWithAuth('/api/certificates', {
                                          method: 'POST',
                                          body: JSON.stringify({
                                            user_id: matricula.user_id,
                                            course_id: matricula.course_id,
                                            course_name: curso.title
                                          })
                                        });
                                        
                                        if (!novoCertificado || !novoCertificado.id) {
                                          throw new Error('Erro ao criar certificado');
                                        }
                                        
                                        // Atualizar a matrícula na lista
                                        const matriculasAtualizadas = matriculas.map(m => {
                                          if (m.id === matricula.id) {
                                            return {
                                              ...m,
                                              hasCertificate: true,
                                              certificateId: novoCertificado.id,
                                              selected: false
                                            };
                                          }
                                          return m;
                                        });
                                        
                                        setMatriculas(matriculasAtualizadas);
                                        await carregarCertificados();
                                        toast.success('Certificado gerado com sucesso!');
                                      } catch (error) {
                                        console.error('Erro ao gerar certificado:', error);
                                        toast.error('Erro ao gerar certificado. Tente novamente.');
                                      } finally {
                                        setProcessando(false);
                                      }
                                      
                                      // O certificado já foi criado na seção try acima, removemos a integração direta com Supabase
                                      // Este trecho foi removido pois estava causando problemas
                                    } catch (error) {
                                      console.error("Erro ao gerar certificado:", error);
                                      toast.error("Erro ao gerar certificado.");
                                    } finally {
                                      setProcessando(false);
                                    }
                                  }}
                                  disabled={processando}
                                >
                                  <Award className="h-3 w-3 mr-1" /> Gerar Certificado
                                </Button>
                              ) : (
                                <Button variant="outline" size="sm" disabled>
                                  Progresso Insuficiente
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
              
              {matriculas.length > 0 && (
                <CardFooter className="flex justify-between">
                  <div className="text-sm text-muted-foreground">
                    Exibindo {matriculasFiltradas.length} de {matriculas.length} alunos
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCursoSelecionado(cursoSelecionado);
                      setPesquisa("");
                    }}
                    className="gap-1"
                  >
                    <RefreshCw className="h-3 w-3" /> Atualizar
                  </Button>
                </CardFooter>
              )}
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="certificados" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Certificados Emitidos</CardTitle>
              <CardDescription>
                Visualize todos os certificados emitidos no sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar certificados..."
                  value={pesquisa}
                  onChange={(e) => setPesquisa(e.target.value)}
                  className="flex-1"
                />
              </div>
              
              {certificados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="text-muted-foreground">
                    Nenhum certificado emitido ainda.
                  </p>
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Curso</TableHead>
                        <TableHead>Data de Emissão</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {certificadosFiltrados.map((certificado) => (
                        <TableRow key={certificado.id}>
                          <TableCell>
                            <div className="font-medium">{certificado.userName}</div>
                          </TableCell>
                          <TableCell>{certificado.courseTitle}</TableCell>
                          <TableCell>
                            {new Date(certificado.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a href={`/aluno/certificado/${certificado.id}`} target="_blank" rel="noopener noreferrer">
                                <Award className="h-3 w-3 mr-1" /> Ver Certificado
                              </a>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            
            {certificados.length > 0 && (
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  Exibindo {certificadosFiltrados.length} de {certificados.length} certificados
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={carregarCertificados}
                  className="gap-1"
                >
                  <RefreshCw className="h-3 w-3" /> Atualizar
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
