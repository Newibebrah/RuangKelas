import { renderHook, waitFor } from "@testing-library/react";
import { useTransactions } from "@/hooks/useTransactions";

const mockOnSnapshot = jest.fn();
const mockGetDocs = jest.fn();
const mockCollection = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();

jest.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  limit: (...args: unknown[]) => jest.fn(...args),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  addDoc: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: 0, nanoseconds: 0 })),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
}));

jest.mock("@/lib/firebase", () => ({ db: {} }));

jest.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ user: { id: "user1", displayName: "Test User" } }),
}));

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ setQueryData: jest.fn() }),
}));

const mockData = [
  {
    id: "1",
    roomId: "room1",
    type: "income" as const,
    amount: 100000,
    description: "Iuran kas",
    category: "Iuran",
    createdBy: "user1",
    createdAt: { toMillis: () => 3000 },
  },
  {
    id: "2",
    roomId: "room1",
    type: "expense" as const,
    amount: 25000,
    description: "Beli kertas",
    category: "ATK",
    createdBy: "user1",
    createdAt: { toMillis: () => 2000 },
  },
  {
    id: "3",
    roomId: "room1",
    type: "income" as const,
    amount: 50000,
    description: "Iuran tambahan",
    createdBy: "user2",
    createdAt: { toMillis: () => 1000 },
  },
];

beforeEach(() => {
  jest.clearAllMocks();
});

function createSnapshot(data: typeof mockData) {
  return {
    docs: data.map((d) => ({
      id: d.id,
      data: () => {
        const { id, ...rest } = d;
        return rest;
      },
    })),
  };
}

describe("useTransactions", () => {
  it("memulai dengan loading true dan data kosong", () => {
    mockOnSnapshot.mockImplementation((_q, onNext: () => void) => {
      setTimeout(onNext, 0);
      return jest.fn();
    });

    const { result } = renderHook(() => useTransactions("room1"));

    expect(result.current.loading).toBe(true);
    expect(result.current.transactions).toEqual([]);
    expect(result.current.totalIncome).toBe(0);
    expect(result.current.totalExpense).toBe(0);
    expect(result.current.balance).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it("mengupdate data saat snapshot diterima", async () => {
    mockOnSnapshot.mockImplementation((_q, onNext: (snap: unknown) => void) => {
      onNext(createSnapshot(mockData));
      return jest.fn();
    });

    const { result } = renderHook(() => useTransactions("room1"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.transactions).toHaveLength(3);
    expect(result.current.totalIncome).toBe(150000);
    expect(result.current.totalExpense).toBe(25000);
    expect(result.current.balance).toBe(125000);
    expect(result.current.error).toBeNull();
  });

  it("menangani data kosong dengan benar", async () => {
    mockOnSnapshot.mockImplementation((_q, onNext: (snap: unknown) => void) => {
      onNext(createSnapshot([]));
      return jest.fn();
    });

    const { result } = renderHook(() => useTransactions("room1"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.transactions).toHaveLength(0);
    expect(result.current.totalIncome).toBe(0);
    expect(result.current.totalExpense).toBe(0);
    expect(result.current.balance).toBe(0);
  });

  it("menangani error dari snapshot listener", async () => {
    mockOnSnapshot.mockImplementation(
      (_q: unknown, _onNext: () => void, onError: (err: unknown) => void) => {
        setTimeout(() => onError(new Error("Gagal load")), 0);
        return jest.fn();
      }
    );

    mockGetDocs.mockRejectedValue(new Error("Fallback gagal"));

    const { result } = renderHook(() => useTransactions("room1"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe(
      "Gagal memuat transaksi. Periksa Firestore indexes."
    );
  });

  it("fallback query ketika listener error", async () => {
    mockOnSnapshot.mockImplementation(
      (_q: unknown, _onNext: () => void, onError: (err: unknown) => void) => {
        setTimeout(() => onError(new Error("Index error")), 0);
        return jest.fn();
      }
    );

    mockGetDocs.mockResolvedValue({
      docs: mockData.map((d) => ({
        id: d.id,
        data: () => {
          const { id, ...rest } = d;
          return rest;
        },
      })),
    });

    const { result } = renderHook(() => useTransactions("room1"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.transactions).toHaveLength(3);
    expect(result.current.totalIncome).toBe(150000);
    expect(result.current.error).toBeNull();
  });

  it("membersihkan listener saat unmount", () => {
    const unsub = jest.fn();
    mockOnSnapshot.mockImplementation(() => unsub);

    const { unmount } = renderHook(() => useTransactions("room1"));
    unmount();

    expect(unsub).toHaveBeenCalled();
  });
});
