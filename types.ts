export interface School {
  id: string;
  name: string;
  countryId?: string;
  provinceId?: string;
  communeId?: string;
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
  countryId?: string;
  provinceId?: string;
  municipalityId?: string;
  communeId?: string;
  addressDetails?: string;
}

export interface Discipline {
  id: string;
  name: string;
  description: string;
  workload: number; // in hours
}

export interface Exam {
  id: string;
  classId: string;
  disciplineId: string;
  title: string;
  subject?: string;
  description?: string;
  date: string;
  dueDate?: string;
  maxScore: number;
  questions?: Array<{
    text: string;
    options: string[];
    correctIndex: number;
  }>;
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
}

export interface Country {
  id: string;
  name: string;
  code?: string;
}

export interface Province {
  id: string;
  countryId: string;
  name: string;
}

export interface Commune {
  id: string;
  provinceId: string;
  name: string;
}

export interface Grade {
  id: string;
  examId: string;
  studentId: string;
  score: number;
  comments?: string;
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

// --- EAD Module Types ---

export interface EadSubject {
  id: string;
  title: string;
  description: string;
  cover_image_url?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export interface EadLesson {
  id: string;
  subject_id?: string;
  class_id?: string;
  discipline_id?: string;
  title: string;
  description: string;
  youtube_url: string;
  cover_image_url?: string;
  order_index: number;
  created_at: string;
  lesson_date?: string;
}

export interface EadProgress {
  id: string;
  student_id: string;
  lesson_id: string;
  completed_at: string;
}

export interface Municipality {
  id: string;
  provinceId: string;
  name: string;
}
