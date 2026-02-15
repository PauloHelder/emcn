
export interface School {
  id: string;
  name: string;
  city: string;
  address: string;
}

export type UserRole = 'ADMIN' | 'SECRETARY' | 'TEACHER' | 'STUDENT';

export interface Permission {
  id: string;
  role: UserRole;
  module: string; // e.g., 'STUDENTS', 'CLASSES', 'FINANCE'
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface Teacher extends User {
  discipline_ids: string[];
  bio: string;
}

export interface Student extends User {
  status: 'ACTIVE' | 'INACTIVE';
  enrollmentDate: string;
  phone: string;
}

export interface Discipline {
  id: string;
  name: string;
  description: string;
  workload: number; // in hours
}

export interface ClassSession {
  id: string;
  date: string;
  disciplineId: string;
  teacherId: string;
  attendance: Record<string, boolean>; // studentId -> present
}

export interface ClassGroup {
  id: string;
  name: string;
  year: number;
  students: string[]; // studentIds
  sessions: ClassSession[];
  schoolId: string;
  // Novos campos de configuração por turma
  isEnrollmentOpen: boolean;
  enrollmentDeadline?: string;
  enrollmentMessage?: string;
  enrollmentRequirements: string[];
}

export interface EnrollmentSettings {
  isOpen: boolean;
  deadline: string;
  message: string;
}
