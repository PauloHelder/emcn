
export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Teacher extends User {
  specialties: string[];
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
}

export interface EnrollmentSettings {
  isOpen: boolean;
  deadline: string;
  message: string;
}
