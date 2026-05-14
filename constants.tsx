
import { Teacher, Student, Discipline, ClassGroup, EnrollmentSettings } from './types';

export const COLORS = {
  blue: '#0a2e4e',
  gold: '#c5a059',
  slate: '#f8f9fa'
};

export const LOGO_URL = "https://images.unsplash.com/photo-1544924222-b529806c856a?q=80&w=200&h=200&auto=format&fit=crop";

export const MOCK_TEACHERS: Teacher[] = [];
export const MOCK_STUDENTS: Student[] = [];
export const MOCK_DISCIPLINES: Discipline[] = [];
export const MOCK_CLASSES: ClassGroup[] = [];

export const INITIAL_ENROLLMENT_SETTINGS: EnrollmentSettings = {
  isOpen: true,
  deadline: '2025-12-31',
  message: 'As inscrições para a turma 2025 estão abertas!'
};
