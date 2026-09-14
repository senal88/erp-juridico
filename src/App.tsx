import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import { ThemeProvider } from '@/components/theme-provider'

import Layout from './components/Layout'
import Login from './pages/Login'
import Index from './pages/Index'
import Leads from './pages/Leads'
import Clientes from './pages/Clientes'
import Fornecedores from './pages/Fornecedores'
import Contratos from './pages/Contratos'
import Processos from './pages/Processos'
import Agenda from './pages/Agenda'
import OrdensDeServico from './pages/OrdensDeServico'
import Financeiro from './pages/Financeiro'
import Horas from './pages/Horas'
import Modelos from './pages/Modelos'
import InvoiceDetalhes from './pages/InvoiceDetalhes'
import AdminUsers from './pages/admin/Users'
import ProcessoDetalhes from './pages/ProcessoDetalhes'
import NotFound from './pages/NotFound'

import PortalLayout from './components/PortalLayout'
import PortalDashboard from './pages/portal/Dashboard'
import PortalProcessos from './pages/portal/Processos'
import PortalProcessoDetalhes from './pages/portal/ProcessoDetalhes'
import PortalFaturas from './pages/portal/Faturas'

const ProtectedRoute = ({ children }: { children: any }) => {
  const { user, loading } = useAuth()
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        Carregando...
      </div>
    )
  if (!user) return <Navigate to="/login" />
  if (user.role === 'cliente') return <Navigate to="/portal" replace />
  return children
}

const PortalProtectedRoute = ({ children }: { children: any }) => {
  const { user, loading } = useAuth()
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        Carregando...
      </div>
    )
  if (!user) return <Navigate to="/login" />
  if (user.role !== 'cliente') return <Navigate to="/" replace />
  return children
}

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route
      element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }
    >
      <Route path="/" element={<Index />} />
      <Route path="/leads" element={<Navigate to="/crm/leads" replace />} />
      <Route path="/crm/leads" element={<Leads />} />
      <Route path="/clientes" element={<Clientes />} />
      <Route path="/fornecedores" element={<Fornecedores />} />
      <Route path="/contratos" element={<Contratos />} />
      <Route path="/processos" element={<Processos />} />
      <Route path="/agenda" element={<Agenda />} />
      <Route path="/ordens-de-servico" element={<OrdensDeServico />} />
      <Route path="/financeiro" element={<Financeiro />} />
      <Route path="/produtividade/horas" element={<Horas />} />
      <Route path="/produtividade/modelos" element={<Modelos />} />
      <Route path="/financeiro/faturas/:id" element={<InvoiceDetalhes />} />
      <Route path="/processos/:id" element={<ProcessoDetalhes />} />
      <Route path="/admin/users" element={<AdminUsers />} />
    </Route>

    <Route
      element={
        <PortalProtectedRoute>
          <PortalLayout />
        </PortalProtectedRoute>
      }
    >
      <Route path="/portal" element={<PortalDashboard />} />
      <Route path="/portal/processos" element={<PortalProcessos />} />
      <Route path="/portal/processos/:id" element={<PortalProcessoDetalhes />} />
      <Route path="/portal/faturas" element={<PortalFaturas />} />
    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
)

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
