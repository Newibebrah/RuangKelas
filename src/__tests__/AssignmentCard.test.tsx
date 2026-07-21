import { render, screen } from "@testing-library/react";
import { AssignmentCard } from "@/components/tugas/AssignmentCard";
import { Timestamp } from "firebase/firestore";

const mockAssignment = {
  id: "1",
  roomId: "room1",
  subject: "Matematika",
  description: "Kerjakan soal latihan halaman 20-25",
  deadline: Timestamp.fromDate(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  ),
  teacherNote: "Kumpulkan tepat waktu",
  createdBy: "user1",
  createdAt: Timestamp.fromDate(new Date()),
};

describe("AssignmentCard", () => {
  it("menampilkan subject tugas", () => {
    render(
      <AssignmentCard
        assignment={mockAssignment}
        canManage={false}
        isDeleting={false}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(screen.getByText("Matematika")).toBeInTheDocument();
  });

  it("menampilkan deskripsi tugas", () => {
    render(
      <AssignmentCard
        assignment={mockAssignment}
        canManage={false}
        isDeleting={false}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(
      screen.getByText("Kerjakan soal latihan halaman 20-25")
    ).toBeInTheDocument();
  });

  it("menampilkan badge Baru untuk tugas yang dibuat < 24 jam", () => {
    render(
      <AssignmentCard
        assignment={mockAssignment}
        canManage={false}
        isDeleting={false}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(screen.getByText("Baru")).toBeInTheDocument();
  });

  it("menampilkan catatan guru jika ada", () => {
    render(
      <AssignmentCard
        assignment={mockAssignment}
        canManage={false}
        isDeleting={false}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(screen.getByText(/Kumpulkan tepat waktu/)).toBeInTheDocument();
  });

  it("menampilkan tombol edit/hapus jika canManage true", () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    render(
      <AssignmentCard
        assignment={mockAssignment}
        canManage={true}
        isDeleting={false}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
    const editButtons = screen.getAllByRole("button");
    expect(editButtons.length).toBeGreaterThanOrEqual(2);
  });

  it("tidak menampilkan tombol edit/hapus jika canManage false", () => {
    render(
      <AssignmentCard
        assignment={mockAssignment}
        canManage={false}
        isDeleting={false}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    const buttons = screen.queryAllByRole("button");
    expect(buttons.length).toBe(0);
  });
});
