import { renderHook } from "@testing-library/react";
import { useRoleAccess } from "@/hooks/useRoleAccess";

const mockUseAuth = jest.fn();
const mockUseRoom = jest.fn();
const mockUsePengurus = jest.fn();

jest.mock("@/lib/auth-context", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("@/lib/room-context", () => ({
  useRoom: () => mockUseRoom(),
}));

jest.mock("@/hooks/usePengurus", () => ({
  usePengurus: () => mockUsePengurus(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAuth.mockReturnValue({ user: { id: "user1" } });
});

describe("useRoleAccess", () => {
  it("returns bendahara role for admin member", () => {
    mockUseRoom.mockReturnValue({ members: [{ userId: "user1", role: "admin" }] });
    mockUsePengurus.mockReturnValue({ pengurus: [] });

    const { result } = renderHook(() => useRoleAccess("room1"));

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isBendahara).toBe(true);
    expect(result.current.kasRole).toBe("bendahara");
    expect(result.current.canManageKas).toBe(true);
    expect(result.current.canViewKasManagement).toBe(true);
    expect(result.current.canDownloadReport).toBe(true);
  });

  it("returns bendahara role for pengurus with jabatan bendahara", () => {
    mockUseRoom.mockReturnValue({ members: [{ userId: "user1", role: "siswa" }] });
    mockUsePengurus.mockReturnValue({
      pengurus: [{ userId: "user1", jabatan: "bendahara" }],
    });

    const { result } = renderHook(() => useRoleAccess("room1"));

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isBendahara).toBe(true);
    expect(result.current.kasRole).toBe("bendahara");
    expect(result.current.canManageKas).toBe(true);
    expect(result.current.canViewKasManagement).toBe(true);
  });

  it("returns ketua role for pengurus with jabatan ketua", () => {
    mockUseRoom.mockReturnValue({ members: [{ userId: "user1", role: "siswa" }] });
    mockUsePengurus.mockReturnValue({
      pengurus: [{ userId: "user1", jabatan: "ketua" }],
    });

    const { result } = renderHook(() => useRoleAccess("room1"));

    expect(result.current.isKetua).toBe(true);
    expect(result.current.kasRole).toBe("ketua");
    expect(result.current.canManageKas).toBe(false);
    expect(result.current.canViewKasManagement).toBe(true);
    expect(result.current.canDownloadReport).toBe(true);
  });

  it("returns sekretaris role for pengurus with jabatan sekretaris", () => {
    mockUseRoom.mockReturnValue({ members: [{ userId: "user1", role: "siswa" }] });
    mockUsePengurus.mockReturnValue({
      pengurus: [{ userId: "user1", jabatan: "sekretaris" }],
    });

    const { result } = renderHook(() => useRoleAccess("room1"));

    expect(result.current.isSekretaris).toBe(true);
    expect(result.current.kasRole).toBe("sekretaris");
    expect(result.current.canManageKas).toBe(false);
    expect(result.current.canViewKasManagement).toBe(true);
  });

  it("returns anggota role for user without special role", () => {
    mockUseRoom.mockReturnValue({ members: [{ userId: "user1", role: "siswa" }] });
    mockUsePengurus.mockReturnValue({ pengurus: [] });

    const { result } = renderHook(() => useRoleAccess("room1"));

    expect(result.current.kasRole).toBe("anggota");
    expect(result.current.canManageKas).toBe(false);
    expect(result.current.canViewKasManagement).toBe(false);
    expect(result.current.canDownloadReport).toBe(false);
  });

  it("returns anggota role when user is not in members", () => {
    mockUseRoom.mockReturnValue({ members: [{ userId: "user2", role: "admin" }] });
    mockUsePengurus.mockReturnValue({ pengurus: [] });

    const { result } = renderHook(() => useRoleAccess("room1"));

    expect(result.current.kasRole).toBe("anggota");
    expect(result.current.canManageKas).toBe(false);
  });
});
