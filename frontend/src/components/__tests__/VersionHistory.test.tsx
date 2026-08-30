import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import VersionHistory from "../VersionHistory";
import type { Commit } from "../../types";

// Mock react-router-dom Link
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Link: ({ children, to, onClick, className }: any) => (
      <a href={to} onClick={onClick} className={className}>
        {children}
      </a>
    ),
  };
});

// Helper to create mock commits
const createMockCommit = (overrides: Partial<Commit> = {}): Commit => ({
  id: 1,
  message: "Test commit",
  created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  parent_id: null,
  author: { id: 1, username: "producer" },
  file_count: 5,
  total_size: 1024 * 100,
  ...overrides,
});

describe("VersionHistory", () => {
  const defaultProps = {
    commits: [],
    projectId: 1,
    branch: "main",
  };

  describe("Empty State", () => {
    it("renders empty state when no commits", () => {
      render(
        <MemoryRouter>
          <VersionHistory {...defaultProps} commits={[]} />
        </MemoryRouter>
      );

      expect(screen.getByText("No versions yet — push your first commit")).toBeInTheDocument();
    });

    it("renders the header with version count", () => {
      render(
        <MemoryRouter>
          <VersionHistory {...defaultProps} commits={[]} />
        </MemoryRouter>
      );

      expect(screen.getByText("Version History")).toBeInTheDocument();
      expect(screen.getByText("0 versions")).toBeInTheDocument();
    });
  });

  describe("Commit List", () => {
    it("renders a single commit", () => {
      const commits = [createMockCommit({ id: 1, message: "First commit" })];

      render(
        <MemoryRouter>
          <VersionHistory {...defaultProps} commits={commits} />
        </MemoryRouter>
      );

      expect(screen.getByText("First commit")).toBeInTheDocument();
      expect(screen.getByText("v1")).toBeInTheDocument();
    });

    it("renders multiple commits in reverse order", () => {
      const commits = [
        createMockCommit({ id: 3, message: "Third commit" }),
        createMockCommit({ id: 2, message: "Second commit" }),
        createMockCommit({ id: 1, message: "First commit" }),
      ];

      render(
        <MemoryRouter>
          <VersionHistory {...defaultProps} commits={commits} />
        </MemoryRouter>
      );

      const messages = screen.getAllByText(/commit/);
      expect(messages[0]).toHaveTextContent("Third commit");
      expect(messages[1]).toHaveTextContent("Second commit");
      expect(messages[2]).toHaveTextContent("First commit");
    });

    it("displays version numbers correctly", () => {
      const commits = [
        createMockCommit({ id: 3 }),
        createMockCommit({ id: 2 }),
        createMockCommit({ id: 1 }),
      ];

      render(
        <MemoryRouter>
          <VersionHistory {...defaultProps} commits={commits} />
        </MemoryRouter>
      );

      expect(screen.getByText("v3")).toBeInTheDocument();
      expect(screen.getByText("v2")).toBeInTheDocument();
      expect(screen.getByText("v1")).toBeInTheDocument();
    });
  });

  describe("Author Display", () => {
    it("shows author username", () => {
      const commits = [
        createMockCommit({
          id: 1,
          author: { id: 1, username: "producer" },
        }),
      ];

      render(
        <MemoryRouter>
          <VersionHistory {...defaultProps} commits={commits} />
        </MemoryRouter>
      );

      expect(screen.getByText("producer")).toBeInTheDocument();
    });

    it("shows author avatar initial", () => {
      const commits = [
        createMockCommit({
          id: 1,
          author: { id: 1, username: "producer" },
        }),
      ];

      render(
        <MemoryRouter>
          <VersionHistory {...defaultProps} commits={commits} />
        </MemoryRouter>
      );

      expect(screen.getByText("P")).toBeInTheDocument();
    });
  });

  describe("Time Display", () => {
    it("shows minutes ago for recent commits", () => {
      const commits = [
        createMockCommit({
          id: 1,
          created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
        }),
      ];

      render(
        <MemoryRouter>
          <VersionHistory {...defaultProps} commits={commits} />
        </MemoryRouter>
      );

      expect(screen.getByText("5m ago")).toBeInTheDocument();
    });

    it("shows hours ago for older commits", () => {
      const commits = [
        createMockCommit({
          id: 1,
          created_at: new Date(Date.now() - 3 * 3600000).toISOString(), // 3 hours ago
        }),
      ];

      render(
        <MemoryRouter>
          <VersionHistory {...defaultProps} commits={commits} />
        </MemoryRouter>
      );

      expect(screen.getByText("3h ago")).toBeInTheDocument();
    });

    it("shows days ago for old commits", () => {
      const commits = [
        createMockCommit({
          id: 1,
          created_at: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days ago
        }),
      ];

      render(
        <MemoryRouter>
          <VersionHistory {...defaultProps} commits={commits} />
        </MemoryRouter>
      );

      expect(screen.getByText("2d ago")).toBeInTheDocument();
    });
  });

  describe("Current Commit Highlight", () => {
    it("highlights the current commit", () => {
      const commits = [
        createMockCommit({ id: 2 }),
        createMockCommit({ id: 1 }),
      ];

      render(
        <MemoryRouter>
          <VersionHistory
            {...defaultProps}
            commits={commits}
            currentCommitId={1}
          />
        </MemoryRouter>
      );

      const rows = screen.getAllByText(/v\d/);
      // The row with id 1 should have current class
      const row = rows[1].closest(".version-history-row");
      expect(row).toHaveClass("version-history-row-current");
    });

    it("marks HEAD commit", () => {
      const commits = [
        createMockCommit({ id: 2 }),
        createMockCommit({ id: 1 }),
      ];

      render(
        <MemoryRouter>
          <VersionHistory {...defaultProps} commits={commits} />
        </MemoryRouter>
      );

      expect(screen.getByText("HEAD")).toBeInTheDocument();
    });
  });

  describe("Approved Badge", () => {
    it("shows approved badge for approved commits", () => {
      const commits = [
        createMockCommit({
          id: 1,
          message: "Version approved",
        }),
      ];

      render(
        <MemoryRouter>
          <VersionHistory {...defaultProps} commits={commits} />
        </MemoryRouter>
      );

      expect(screen.getByText("✓ Approved")).toBeInTheDocument();
    });

    it("does not show approved badge for regular commits", () => {
      const commits = [
        createMockCommit({
          id: 1,
          message: "Regular commit",
        }),
      ];

      render(
        <MemoryRouter>
          <VersionHistory {...defaultProps} commits={commits} />
        </MemoryRouter>
      );

      expect(screen.queryByText("✓ Approved")).not.toBeInTheDocument();
    });
  });

  describe("Actions", () => {
    it("shows View link for each commit", () => {
      const commits = [createMockCommit({ id: 1 })];

      render(
        <MemoryRouter>
          <VersionHistory {...defaultProps} commits={commits} />
        </MemoryRouter>
      );

      expect(screen.getByText("View")).toHaveAttribute(
        "href",
        "/projects/1/commit/1"
      );
    });

    it("shows Diff link for non-first commits", () => {
      const commits = [
        createMockCommit({ id: 2 }),
        createMockCommit({ id: 1 }),
      ];

      render(
        <MemoryRouter>
          <VersionHistory {...defaultProps} commits={commits} />
        </MemoryRouter>
      );

      const diffLinks = screen.getAllByText("Diff");
      expect(diffLinks.length).toBe(1); // Only one diff link (for second commit)
      // Diff link shows from current to previous
      expect(diffLinks[0]).toHaveAttribute(
        "href",
        "/projects/1/diff?from=1&to=2"
      );
    });

    it("does not show Diff link for first commit", () => {
      const commits = [createMockCommit({ id: 1 })];

      render(
        <MemoryRouter>
          <VersionHistory {...defaultProps} commits={commits} />
        </MemoryRouter>
      );

      expect(screen.queryByText("Diff")).not.toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("calls onSelect when commit is clicked", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const commits = [createMockCommit({ id: 1 })];

      render(
        <MemoryRouter>
          <VersionHistory
            {...defaultProps}
            commits={commits}
            onSelect={onSelect}
          />
        </MemoryRouter>
      );

      const row = screen.getByText("v1").closest(".version-history-row");
      await user.click(row!);

      expect(onSelect).toHaveBeenCalledWith(1);
    });

    it("does not call onSelect when View is clicked", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const commits = [createMockCommit({ id: 1 })];

      render(
        <MemoryRouter>
          <VersionHistory
            {...defaultProps}
            commits={commits}
            onSelect={onSelect}
          />
        </MemoryRouter>
      );

      await user.click(screen.getByText("View"));

      // onSelect should not be called because View has stopPropagation
      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe("Branch Display", () => {
    it("shows the branch name", () => {
      const commits = [createMockCommit({ id: 1 })];

      render(
        <MemoryRouter>
          <VersionHistory {...defaultProps} commits={commits} branch="feature/alp" />
        </MemoryRouter>
      );

      expect(screen.getByText("feature/alp")).toBeInTheDocument();
    });
  });

  describe("Timeline Connector", () => {
    it("renders timeline dots and lines", () => {
      const commits = [
        createMockCommit({ id: 2 }),
        createMockCommit({ id: 1 }),
      ];

      render(
        <MemoryRouter>
          <VersionHistory {...defaultProps} commits={commits} />
        </MemoryRouter>
      );

      const dots = document.querySelectorAll(".version-history-dot");
      const lines = document.querySelectorAll(".version-history-line");

      expect(dots.length).toBe(2);
      expect(lines.length).toBe(1); // Only between commits
    });
  });

  describe("Message Display", () => {
    it("shows commit message", () => {
      const commits = [
        createMockCommit({ id: 1, message: "Add synth lead to arrangement" }),
      ];

      render(
        <MemoryRouter>
          <VersionHistory {...defaultProps} commits={commits} />
        </MemoryRouter>
      );

      expect(screen.getByText("Add synth lead to arrangement")).toBeInTheDocument();
    });

    it("shows placeholder for empty message", () => {
      const commits = [createMockCommit({ id: 1, message: "" })];

      render(
        <MemoryRouter>
          <VersionHistory {...defaultProps} commits={commits} />
        </MemoryRouter>
      );

      expect(screen.getByText("(no message)")).toBeInTheDocument();
    });
  });
});
