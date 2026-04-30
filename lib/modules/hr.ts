/**
 * HR Module
 * 
 * Employee management
 * Attendance tracking
 * Payroll integration
 * Training management
 * 
 * @module hr
 */

import { ModuleDefinition } from './registry'

export const hrModule: ModuleDefinition = {
  id: 'hr',
  name: 'Human Resources',
  description: 'Complete HR management with employee management, attendance tracking, payroll integration, and training management',
  version: '1.0.0',
  category: 'other',
  standalone: true,
  dependencies: [],
  enabled: true,
  routes: [
    {
      path: '/hr',
      component: 'app/hr/page',
      title: 'HR Dashboard',
      icon: 'ri-user-line',
      requiresAuth: true,
    },
    {
      path: '/hr/employees',
      component: 'app/hr/employees/page',
      title: 'Employees',
      icon: 'ri-team-line',
      requiresAuth: true,
    },
    {
      path: '/hr/attendance',
      component: 'app/hr/attendance/page',
      title: 'Attendance',
      icon: 'ri-time-line',
      requiresAuth: true,
    },
    {
      path: '/hr/training',
      component: 'app/hr/training/page',
      title: 'Training',
      icon: 'ri-graduation-cap-line',
      requiresAuth: true,
    },
    {
      path: '/hr/payroll',
      component: 'app/hr/payroll/page',
      title: 'Payroll',
      icon: 'ri-money-dollar-circle-line',
      requiresAuth: true,
    },
  ],
  components: [
    'components/hr/HRDashboard',
    'components/hr/EmployeeList',
    'components/hr/AttendanceCalendar',
    'components/hr/TrainingCompliance',
    'components/hr/PayrollManagement',
  ],
  services: [
    'lib/services/hr',
  ],
  config: {
    attendanceTracking: true,
    payrollIntegration: true,
    trainingCompliance: true,
  },
}

