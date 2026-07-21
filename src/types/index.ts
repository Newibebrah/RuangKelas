import { Timestamp } from "firebase/firestore";

export type UserRole = "admin" | "guru" | "siswa" | "pengurus";

export interface User {
  id: string;
  email: string;
  displayName: string;
  username?: string;
  photoURL?: string;
  bio?: string;
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
  photoURL?: string;
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

export interface Assignment {
  id: string;
  roomId: string;
  subject: string;
  description: string;
  deadline: Timestamp;
  teacherNote?: string;
  attachments?: string[];
  attachmentPublicIds?: string[];
  createdBy: string;
  createdAt: Timestamp;
}

export interface Submission {
  id: string;
  assignmentId: string;
  roomId: string;
  userId: string;
  displayName: string;
  notes?: string;
  fileUrl: string;
  filePublicId: string;
  submittedAt: Timestamp;
  grade?: number;
  gradedBy?: string;
  gradedAt?: Timestamp;
  comment?: string;
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
  kkm?: number;
  semester?: string;
  createdBy?: string;
  createdAt?: Timestamp;
}

export interface Deployment {
  id: string;
  roomId: string;
  title: string;
  description: string;
  attachments: string[];
  attachmentPaths?: string[];
  attachmentPublicIds?: string[];
  createdBy: string;
  createdAt: Timestamp;
  displayName?: string;
  subject?: string;
}

export interface Transaction {
  id: string;
  roomId: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category?: string;
  createdBy: string;
  createdAt: Timestamp;
}

export interface AppNotification {
  id: string;
  type: "assignment" | "bill" | "role" | "materi";
  title: string;
  message: string;
  roomId: string;
  link: string;
  read: boolean;
  createdAt: Timestamp;
}
