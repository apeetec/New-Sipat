import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '../../features/auth/LoginPage';
import { FirstAccessPage } from '../../features/auth/FirstAccessPage';
import { RegulationPage } from '../../features/regulations/RegulationPage';
import { HomePage } from '../../features/home/HomePage';
import { EventDayPage } from '../../features/events/EventDayPage';
import { WinnersPage } from '../../features/winners/WinnersPage';
import { AdminDashboardPage } from '../../features/admin/dashboard/AdminDashboardPage';
import { AdminEventsPage } from '../../features/admin/event-management/AdminEventsPage';
import { AdminQuestionsPage } from '../../features/admin/question-management/AdminQuestionsPage';
import { AdminUnitsPage } from '../../features/admin/unit-management/AdminUnitsPage';
import { AdminUsersPage } from '../../features/admin/user-management/AdminUsersPage';
import { AdminUserImportPage } from '../../features/admin/user-import/AdminUserImportPage';
import { AdminBulkDeletePage } from '../../features/admin/bulk-delete/AdminBulkDeletePage';
import { AdminResultsPage } from '../../features/admin/results/AdminResultsPage';
import { AdminDrawsPage } from '../../features/admin/draws/AdminDrawsPage';
import { AdminAuditPage } from '../../features/admin/audit/AdminAuditPage';
import { AdminSettingsPage } from '../../features/admin/settings/AdminSettingsPage';
import { AdminCustomizationPage } from '../../features/admin/customization/AdminCustomizationPage';
import { CsvValidatorPage } from '../../features/tools/CsvValidatorPage';
import { ProtectedRoute, AdminRoute, FirstAccessRoute } from '../../features/auth/guards';

export const router = createBrowserRouter([
  // Public login
  {
    path: '/login',
    element: <LoginPage />,
  },
  // First access password change
  {
    path: '/primeiro-acesso',
    element: (
      <FirstAccessRoute>
        <FirstAccessPage />
      </FirstAccessRoute>
    ),
  },
  // Regulation acceptance
  {
    path: '/regulamento',
    element: <RegulationPage />,
  },
  // Collaborator Home
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <HomePage />
      </ProtectedRoute>
    ),
  },
  // Central Session Screen
  {
    path: '/dias/:slug',
    element: (
      <ProtectedRoute>
        <EventDayPage />
      </ProtectedRoute>
    ),
  },
  // Winners Gallery (both routes point to the same canonical component)
  {
    path: '/ganhadores',
    element: (
      <ProtectedRoute>
        <WinnersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/sorteios',
    element: (
      <ProtectedRoute>
        <WinnersPage />
      </ProtectedRoute>
    ),
  },

  // Admin Shell and Pages
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminDashboardPage />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/dias',
    element: (
      <AdminRoute>
        <AdminEventsPage />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/perguntas',
    element: (
      <AdminRoute>
        <AdminQuestionsPage />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/unidades',
    element: (
      <AdminRoute>
        <AdminUnitsPage />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/usuarios',
    element: (
      <AdminRoute>
        <AdminUsersPage />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/usuarios/importar',
    element: (
      <AdminRoute>
        <AdminUserImportPage />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/usuarios/excluir-em-massa',
    element: (
      <AdminRoute>
        <AdminBulkDeletePage />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/resultados',
    element: (
      <AdminRoute>
        <AdminResultsPage />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/sorteios',
    element: (
      <AdminRoute>
        <AdminDrawsPage />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/auditoria',
    element: (
      <AdminRoute>
        <AdminAuditPage />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/configuracoes',
    element: (
      <AdminRoute>
        <AdminSettingsPage />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/personalizacao',
    element: (
      <AdminRoute>
        <AdminCustomizationPage />
      </AdminRoute>
    ),
  },
  {
    path: '/ferramentas/validar-csv',
    element: (
      <AdminRoute>
        <CsvValidatorPage />
      </AdminRoute>
    ),
  },

  // Fallback
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
