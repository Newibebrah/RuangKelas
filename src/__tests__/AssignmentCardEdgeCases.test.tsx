import { render, screen } from "@testing-library/react";
import { AssignmentCard } from "@/components/tugas/AssignmentCard";
import { Timestamp } from "firebase/firestore";

const baseAssignment = {
  id: "1",
  roomId: "room1",
  subject: "Matematika",
  description: "Kerjakan soal",
  deadline: Timestamp.fromDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)),
  createdBy: "user1",
  createdAt: Timestamp.fromDate(new Date()),
};

describe("AssignmentCard — edge cases", () => {
  it("menampilkan fallback judul jika subject null", () => {
    render(
      <AssignmentCard
        assignment={{ ...baseAssignment, subject: "" }}
        canManage={false}
        isDeleting={false}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(screen.getByText("Tanpa judul")).toBeInTheDocument();
  });

  it("menampilkan fallback deskripsi jika description null", () => {
    render(
      <AssignmentCard
        assignment={{ ...baseAssignment, description: "" }}
        canManage={false}
        isDeleting={false}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(screen.getByText("Tidak ada deskripsi")).toBeInTheDocument();
  });

  it("tidak menampilkan badge Baru untuk tugas lama", () => {
    const oldCreatedAt = Timestamp.fromDate(
      new Date(Date.now() - 48 * 60 * 60 * 1000)
    );
    render(
      <AssignmentCard
        assignment={{ ...baseAssignment, createdAt: oldCreatedAt }}
        canManage={false}
        isDeleting={false}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(screen.queryByText("Baru")).not.toBeInTheDocument();
  });

  it("menampilkan status Terlewat jika deadline sudah lewat", () => {
    const pastDeadline = Timestamp.fromDate(
      new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    render(
      <AssignmentCard
        assignment={{ ...baseAssignment, deadline: pastDeadline }}
        canManage={false}
        isDeleting={false}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(screen.getByText("Terlewat")).toBeInTheDocument();
  });

  it("tidak crash saat createdAt atau deadline undefined", () => {
    const { container } = render(
      <AssignmentCard
        assignment={{ ...baseAssignment, createdAt: undefined as unknown as Timestamp }}
        canManage={false}
        isDeleting={false}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(container).toBeInTheDocument();
  });

  it("tidak crash saat deadline sudah lewat dengan data minimal", () => {
    render(
      <AssignmentCard
        assignment={{
          id: "2",
          roomId: "room1",
          subject: "IPA",
          description: "",
          deadline: Timestamp.fromDate(new Date(Date.now() - 100000)),
          createdBy: "user1",
          createdAt: Timestamp.fromDate(new Date(Date.now() - 48 * 60 * 60 * 1000)),
        }}
        canManage={false}
        isDeleting={false}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(screen.getByText("IPA")).toBeInTheDocument();
    expect(screen.getByText("Terlewat")).toBeInTheDocument();
  });
});
