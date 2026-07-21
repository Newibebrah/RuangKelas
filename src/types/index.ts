import { Timestamp } from "firebase/firestore";

export type UserRole = "admin" | "guru" | "siswa" | "pengurus";

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  roomIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  code: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}

export interface RoomMember {
  id: string;
  roomId: string;
  userId: string;
  role: UserRole;
  joinedAt: Timestamp;
  displayName: string;
  email: string;
}

export interface Tugas {
  id: string;
  roomId: string;
  title: string;
  description: string;
  deadline: Timestamp;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  attachments: string[];
  maxScore: number;
}

export interface TugasSubmission {
  id: string;
  tugasId: string;
  roomId: string;
  userId: string;
  content: string;
  attachments: string[];
  submittedAt: Timestamp;
  score?: number;
  feedback?: string;
  gradedBy?: string;
  gradedAt?: Timestamp;
  status: "submitted" | "graded" | "late";
}

export interface Kas {
  id: string;
  roomId: string;
  userId: string;
  displayName: string;
  amount: number;
  type: "pemasukan" | "pengeluaran";
  description: string;
  date: Timestamp;
  createdAt: Timestamp;
  category: string;
}

export interface KasSummary {
  totalPemasukan: number;
  totalPengeluaran: number;
  saldo: number;
}

export interface Pengurus {
  id: string;
  roomId: string;
  userId: string;
  displayName: string;
  email: string;
  jabatan: string;
  periode: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Assignment {
  id: string;
  roomId: string;
  subject: string;
  description: string;
  deadline: Timestamp;
  teacherNote?: string;
  createdBy: string;
  createdAt: Timestamp;
}

export interface Bill {
  id: string;
  roomId: string;
  amount: number;
  frequency: "weekly" | "monthly";
  periodsPerMonth: number;
  createdBy: string;
  createdAt: Timestamp;
  isActive: boolean;
}

export interface PaymentPeriod {
  id: string;
  billId: string;
  roomId: string;
  periodNumber: number;
  dueDate: Timestamp;
  status: "open" | "closed";
}

export interface Payment {
  id: string;
  billId: string;
  periodId: string;
  roomId: string;
  userId: string;
  displayName: string;
  status: "paid" | "unpaid";
  paidAt: Timestamp | null;
  proofUrl?: string;
}

export interface SubjectPJ {
  id: string;
  roomId: string;
  subjectName: string;
  userId: string | null;
  displayName: string | null;
}

export interface AppNotification {
  id: string;
  type: "assignment" | "bill" | "role";
  title: string;
  message: string;
  roomId: string;
  link: string;
  read: boolean;
  createdAt: Timestamp;
}
