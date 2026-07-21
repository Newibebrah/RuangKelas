import { renderHook, waitFor } from "@testing-library/react";
import { useAssignments } from "@/hooks/useAssignments";

jest.mock("@/lib/notifications", () => ({
  notifyAllMembers: jest.fn(),
}));

const mockOnSnapshot = jest.fn();
const mockCollection = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();

jest.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: 0, nanoseconds: 0 })),
}));

jest.mock("@/lib/firebase", () => ({
  db: {},
}));

describe("useAssignments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("memulai dengan loading true dan assignments kosong", () => {
    mockOnSnapshot.mockImplementation((_q, onNext: () => void) => {
      setTimeout(onNext, 0);
      return jest.fn();
    });

    const { result } = renderHook(() => useAssignments("room1"));

    expect(result.current.loading).toBe(true);
    expect(result.current.assignments).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("mengupdate assignments saat snapshot diterima", async () => {
    const mockData = [
      {
        id: "1",
        roomId: "room1",
        subject: "Matematika",
        description: "PR halaman 10",
        deadline: { toDate: () => new Date() },
        createdBy: "user1",
        createdAt: { toDate: () => new Date() },
      },
      {
        id: "2",
        roomId: "room1",
        subject: "Fisika",
        description: "Baca bab 3",
        deadline: { toDate: () => new Date() },
        createdBy: "user1",
        createdAt: { toDate: () => new Date() },
      },
    ];

    mockOnSnapshot.mockImplementation((_q, onNext: (snapshot: unknown) => void) => {
      onNext({
        docs: mockData.map((d) => ({
          id: d.id,
          data: () => {
            const { id, ...rest } = d;
            return rest;
          },
        })),
      });
      return jest.fn();
    });

    const { result } = renderHook(() => useAssignments("room1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.assignments).toHaveLength(2);
    expect(result.current.assignments[0].subject).toBe("Matematika");
    expect(result.current.error).toBeNull();
  });

  it("menangani error dari snapshot listener", async () => {
    mockOnSnapshot.mockImplementation(
      (_q: unknown, _onNext: () => void, onError: (err: unknown) => void) => {
        setTimeout(() => onError(new Error("Gagal load")), 0);
        return jest.fn();
      }
    );

    const { result } = renderHook(() => useAssignments("room1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Gagal memuat tugas");
  });

  it("membersihkan listener saat unmount", () => {
    const unsub = jest.fn();
    mockOnSnapshot.mockImplementation(() => {
      return unsub;
    });

    const { unmount } = renderHook(() => useAssignments("room1"));
    unmount();

    expect(unsub).toHaveBeenCalled();
  });

  it("tidak memulai listener jika roomId kosong", () => {
    renderHook(() => useAssignments(""));
    expect(mockOnSnapshot).not.toHaveBeenCalled();
  });
});
