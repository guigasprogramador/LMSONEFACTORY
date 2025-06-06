
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppDataProvider } from "./contexts/AppDataContext";
import { useEffect } from "react";
import { queryClient } from "./utils/queryClient";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import NetworkErrorBoundary from "./components/NetworkErrorBoundary";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CourseCatalog from "./pages/CourseCatalog";
import CourseDetails from "./pages/CourseDetails";
import CourseContent from "./pages/CourseContent";
import Certificate from "./pages/Certificate";
import CoursePlayer from "./pages/aluno/CoursePlayer";
import MeusCertificados from "./pages/aluno/MeusCertificados";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminModules from "./pages/admin/AdminModules";
import AdminLessons from "./pages/admin/AdminLessons";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCertificates from "./pages/admin/AdminCertificates";
import AdminProfiles from "./pages/admin/AdminProfiles";
import AdminMakeUserAdmin from "./pages/admin/AdminMakeUserAdmin";
import GerenciadorCertificados from "./pages/admin/GerenciadorCertificados";
import NotFound from "./pages/NotFound";

// Usando o queryClient global definido em utils/queryClient.ts

// Wrapper component to initialize real-time subscriptions
const RealtimeSubscriptionsInitializer = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    // Dynamically import to avoid circular dependencies
    import('./utils/realtimeSubscriptions').then(({ initializeRealtimeSubscriptions }) => {
      const unsubscribe = initializeRealtimeSubscriptions();
      
      // Clean up subscriptions when component unmounts
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }).catch(error => {
      console.error('Failed to initialize real-time subscriptions:', error);
    });
  }, []);
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <AppDataProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {/* Use a simple div instead of NetworkErrorBoundary for diagnostic purposes */}
            <div className="error-diagnostic-wrapper">
              <BrowserRouter>
              <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected student routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/courses" element={<CourseCatalog />} />
                <Route path="/courses/:courseId" element={<CourseDetails />} />
                <Route path="/courses/:courseId/content" element={<CourseContent />} />
                <Route path="/aluno/curso/:id/player" element={<CoursePlayer />} />
                <Route path="/aluno/certificados" element={<MeusCertificados />} />
                <Route path="/certificates/:certificateId" element={<Certificate />} />
                <Route path="/aluno/certificado/:certificateId" element={<Certificate />} />
              </Route>
              
              {/* Admin routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/courses" element={<AdminCourses />} />
                <Route path="/admin/modules" element={<AdminModules />} />
                <Route path="/admin/lessons" element={<AdminLessons />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/make-admin" element={<AdminMakeUserAdmin />} />
                <Route path="/admin/certificates" element={<AdminCertificates />} />
                <Route path="/admin/profiles" element={<AdminProfiles />} />
                <Route path="/admin/gerenciador-certificados" element={<GerenciadorCertificados />} />
              </Route>
              
              {/* 404 page */}
              <Route path="*" element={<NotFound />} />
              </Routes>
              </BrowserRouter>
            </div>
          </TooltipProvider>
        </AppDataProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
