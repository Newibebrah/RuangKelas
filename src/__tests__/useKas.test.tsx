import { renderHook, waitFor } from "@testing-library/react";
import { useKas } from "@/hooks/useKas";

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
  updateDoc: jest.fn(),
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
    userId: "user1",
    displayName: "User A",
    amount: 50000,
    type: "pemasukan",
    description: "Iuran bulanan",
    category: "Iuran",
    date: { toMillis: () => 2000 },
    createdAt: { toMillis: () => 1000 },
  },
  {
    id: "2",
    roomId: "room1",
    userId: "user1",
    displayName: "User A",
    amount: 20000,
    type: "pengeluaran",
    description: "Beli spidol",
    category: "ATK",
    date: { toMillis: () => 1000 },
    createdAt: { toMillis: () => 800 },
  },
  {
    id: "3",
    roomId: "room1",
    userId: "user2",
    displayName: "User B",
    amount: 50000,
    type: "pemasukan",
    description: "Iuran bulanan",
    category: "Iuran",
    date: { toMillis: () => 1500 },
    createdAt: { toMillis: () => 900 },
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

describe("useKas", () => {
  it("memulai dengan loading true dan data kosong", () => {
    mockOnSnapshot.mockImplementation((_q, onNext: () => void) => {
      setTimeout(onNext, 0);
      return jest.fn();
    });

    const { result } = renderHook(() => useKas("room1"));

    expect(result.current.loading).toBe(true);
    expect(result.current.transactions).toEqual([]);
    expect(result.current.summary).toEqual({
      totalPemasukan: 0,
      totalPengeluaran: 0,
      saldo: 0,
    });
    expect(result.current.error).toBeNull();
  });

  it("mengupdate data saat snapshot diterima", async () => {
    mockOnSnapshot.mockImplementation((_q, onNext: (snap: unknown) => void) => {
      onNext(createSnapshot(mockData));
      return jest.fn();
    });

    const { result } = renderHook(() => useKas("room1"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.transactions).toHaveLength(3);
    expect(result.current.summary.totalPemasukan).toBe(100000);
    expect(result.current.summary.totalPengeluaran).toBe(20000);
    expect(result.current.summary.saldo).toBe(80000);
    expect(result.current.error).toBeNull();
  });

  it("menghitung summary untuk data kosong", async () => {
    mockOnSnapshot.mockImplementation((_q, onNext: (snap: unknown) => void) => {
      onNext(createSnapshot([]));
      return jest.fn();
    });

    const { result } = renderHook(() => useKas("room1"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.transactions).toHaveLength(0);
    expect(result.current.summary).toEqual({
      totalPemasukan: 0,
      totalPengeluaran: 0,
      saldo: 0,
    });
  });

  it("menangani error dari snapshot listener", async () => {
    mockOnSnapshot.mockImplementation(
      (_q: unknown, _onNext: () => void, onError: (err: unknown) => void) => {
        setTimeout(() => onError(new Error("Gagal load")), 0);
        return jest.fn();
      }
    );

    mockGetDocs.mockRejectedValue(new Error("Fallback juga gagal"));

    const { result } = renderHook(() => useKas("room1"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe(
      "Gagal memuat data kas. Periksa Firestore indexes."
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

    const { result } = renderHook(() => useKas("room1"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.transactions).toHaveLength(3);
    expect(result.current.summary.totalPemasukan).toBe(100000);
    expect(result.current.error).toBeNull();
  });

  it("membersihkan listener saat unmount", () => {
    const unsub = jest.fn();
    mockOnSnapshot.mockImplementation(() => unsub);

    const { unmount } = renderHook(() => useKas("room1"));
    unmount();

    expect(unsub).toHaveBeenCalled();
  });

  it("tidak memulai listener jika roomId kosong", () => {
    renderHook(() => useKas(""));
    expect(mockOnSnapshot).not.toHaveBeenCalled();
  });
});
