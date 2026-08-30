import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import DashboardPage from "../../pages/DashboardPage";
import { api } from "../../api";

// Mock the api module
vi.mock("../../api", () => ({
  api: {
    listProjects: vi.fn(),
    listBranches: vi.fn(),
    listCommits: vi.fn(),
  },
}));

// Mock react-router-dom Link
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Link: ({ children, to, className }: any) => (
      <a href={to} className={className}>
        {children}
      </a>
    ),
  };
});

// Helper to create mock projects
const createMockProjects = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Project ${i + 1}`,
    slug: `project-${i + 1}`,
    description: `Description ${i + 1}`,
    owner: { id: 1, username: "producer" },
    default_branch: "main",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

// Helper to create mock commits
const createMockCommits = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    message: `Commit ${i + 1}`,
    created_at: new Date(Date.now() - i * 3600000).toISOString(),
    parent_id: i > 0 ? i : null,
    author: { id: 1, username: "producer" },
    file_count: 5,
    total_size: 1024 * 100,
  }));

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading State", () => {
    it("shows loading spinner initially", () => {
      // Mock API to never resolve
      vi.mocked(api.listProjects).mockReturnValue(new Promise(() => {}));
      vi.mocked(api.listBranches).mockReturnValue(new Promise(() => {}));
      vi.mocked(api.listCommits).mockReturnValue(new Promise(() => {}));

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      expect(screen.getByText("Loading dashboard...")).toBeInTheDocument();
      expect(document.querySelector(".dashboard-spinner")).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("shows dashboard with zero stats when no projects", async () => {
      vi.mocked(api.listProjects).mockResolvedValue([]);
      vi.mocked(api.listBranches).mockResolvedValue([]);
      vi.mocked(api.listCommits).mockResolvedValue([]);

      const { container } = render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
      });

      // Stats should show 0 for projects
      const statValues = container.querySelectorAll(".dashboard-stat-value");
      expect(statValues[0]).toHaveTextContent("0");
    });

    it("shows 'No active sessions' when no sessions", async () => {
      vi.mocked(api.listProjects).mockResolvedValue([]);
      vi.mocked(api.listBranches).mockResolvedValue([]);
      vi.mocked(api.listCommits).mockResolvedValue([]);

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("No active sessions")).toBeInTheDocument();
      });
    });
  });

  describe("Stats Cards", () => {
    it("displays all stat cards", async () => {
      const projects = createMockProjects(3);
      vi.mocked(api.listProjects).mockResolvedValue(projects);
      vi.mocked(api.listBranches).mockResolvedValue([]);
      vi.mocked(api.listCommits).mockResolvedValue(createMockCommits(5));

      const { container } = render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        const statLabels = container.querySelectorAll(".dashboard-stat-label");
        const labelTexts = Array.from(statLabels).map(el => el.textContent);
        expect(labelTexts).toContain("Projects");
        expect(labelTexts).toContain("Versions");
        expect(labelTexts).toContain("Active Reviews");
        expect(labelTexts).toContain("Storage");
        expect(labelTexts).toContain("Dedup");
      });
    });

    it("displays correct project count", async () => {
      const projects = createMockProjects(5);
      vi.mocked(api.listProjects).mockResolvedValue(projects);
      vi.mocked(api.listBranches).mockResolvedValue([]);
      vi.mocked(api.listCommits).mockResolvedValue(createMockCommits(3));

      const { container } = render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        const statValues = container.querySelectorAll(".dashboard-stat-value");
        expect(statValues[0]).toHaveTextContent("5");
      });
    });

    it("displays storage info", async () => {
      vi.mocked(api.listProjects).mockResolvedValue([]);
      vi.mocked(api.listBranches).mockResolvedValue([]);
      vi.mocked(api.listCommits).mockResolvedValue([]);

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("2.4 GB")).toBeInTheDocument();
      });

      expect(screen.getByText("of 10 GB")).toBeInTheDocument();
    });

    it("displays dedup ratio", async () => {
      vi.mocked(api.listProjects).mockResolvedValue([]);
      vi.mocked(api.listBranches).mockResolvedValue([]);
      vi.mocked(api.listCommits).mockResolvedValue([]);

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("67%")).toBeInTheDocument();
      });

      expect(screen.getByText("saved")).toBeInTheDocument();
    });
  });

  describe("Header Actions", () => {
    it("shows All Projects link", async () => {
      vi.mocked(api.listProjects).mockResolvedValue([]);
      vi.mocked(api.listBranches).mockResolvedValue([]);
      vi.mocked(api.listCommits).mockResolvedValue([]);

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("All Projects")).toBeInTheDocument();
      });

      expect(screen.getByText("All Projects")).toHaveAttribute("href", "/projects");
    });

    it("shows New Project button", async () => {
      vi.mocked(api.listProjects).mockResolvedValue([]);
      vi.mocked(api.listBranches).mockResolvedValue([]);
      vi.mocked(api.listCommits).mockResolvedValue([]);

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("+ New Project")).toBeInTheDocument();
      });
    });
  });

  describe("Active Sessions Panel", () => {
    it("shows sessions panel header", async () => {
      vi.mocked(api.listProjects).mockResolvedValue([]);
      vi.mocked(api.listBranches).mockResolvedValue([]);
      vi.mocked(api.listCommits).mockResolvedValue([]);

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Active Sessions")).toBeInTheDocument();
      });
    });

    it("displays session count", async () => {
      const projects = createMockProjects(2);
      vi.mocked(api.listProjects).mockResolvedValue(projects);
      vi.mocked(api.listBranches).mockResolvedValue([]);
      vi.mocked(api.listCommits).mockResolvedValue(createMockCommits(3));

      const { container } = render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        const countBadge = container.querySelector(".dashboard-panel-count");
        expect(countBadge).toHaveTextContent("2");
      });
    });

    it("shows filter dropdown", async () => {
      vi.mocked(api.listProjects).mockResolvedValue([]);
      vi.mocked(api.listBranches).mockResolvedValue([]);
      vi.mocked(api.listCommits).mockResolvedValue([]);

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("All Status")).toBeInTheDocument();
      });

      expect(screen.getByText("Draft")).toBeInTheDocument();
      expect(screen.getByText("In Review")).toBeInTheDocument();
    });

    it("shows sort dropdown", async () => {
      vi.mocked(api.listProjects).mockResolvedValue([]);
      vi.mocked(api.listBranches).mockResolvedValue([]);
      vi.mocked(api.listCommits).mockResolvedValue([]);

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Last Push")).toBeInTheDocument();
      });

      expect(screen.getByText("Name")).toBeInTheDocument();
    });
  });

  describe("Activity Feed Panel", () => {
    it("shows activity panel header", async () => {
      vi.mocked(api.listProjects).mockResolvedValue([]);
      vi.mocked(api.listBranches).mockResolvedValue([]);
      vi.mocked(api.listCommits).mockResolvedValue([]);

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Recent Activity")).toBeInTheDocument();
      });
    });

    it("displays activity items", async () => {
      vi.mocked(api.listProjects).mockResolvedValue([]);
      vi.mocked(api.listBranches).mockResolvedValue([]);
      vi.mocked(api.listCommits).mockResolvedValue([]);

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Marco approved/)).toBeInTheDocument();
      });

      expect(screen.getByText(/Aisha commented/)).toBeInTheDocument();
      expect(screen.getByText(/Dedup saved/)).toBeInTheDocument();
    });
  });

  describe("Quick Stats Panel", () => {
    it("shows quick stats panel", async () => {
      vi.mocked(api.listProjects).mockResolvedValue([]);
      vi.mocked(api.listBranches).mockResolvedValue([]);
      vi.mocked(api.listCommits).mockResolvedValue([]);

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Quick Stats")).toBeInTheDocument();
      });
    });

    it("displays all quick stat items", async () => {
      vi.mocked(api.listProjects).mockResolvedValue([]);
      vi.mocked(api.listBranches).mockResolvedValue([]);
      vi.mocked(api.listCommits).mockResolvedValue([]);

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Pushes this week")).toBeInTheDocument();
      });

      expect(screen.getByText("Avg review time")).toBeInTheDocument();
      expect(screen.getByText("Comments")).toBeInTheDocument();
      expect(screen.getByText("Approvals")).toBeInTheDocument();
    });

    it("displays quick stat values", async () => {
      vi.mocked(api.listProjects).mockResolvedValue([]);
      vi.mocked(api.listBranches).mockResolvedValue([]);
      vi.mocked(api.listCommits).mockResolvedValue([]);

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("12")).toBeInTheDocument();
      });

      expect(screen.getByText("2.3 days")).toBeInTheDocument();
      expect(screen.getByText("47")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });
  });

  describe("DAW Bridge Panel", () => {
    it("shows DAW Bridge panel", async () => {
      vi.mocked(api.listProjects).mockResolvedValue([]);
      vi.mocked(api.listBranches).mockResolvedValue([]);
      vi.mocked(api.listCommits).mockResolvedValue([]);

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("DAW Bridge")).toBeInTheDocument();
      });
    });

    it("displays DAW connection status", async () => {
      vi.mocked(api.listProjects).mockResolvedValue([]);
      vi.mocked(api.listBranches).mockResolvedValue([]);
      vi.mocked(api.listCommits).mockResolvedValue([]);

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Ableton Live")).toBeInTheDocument();
      });

      expect(screen.getByText("Connected")).toBeInTheDocument();
      expect(screen.getByText("FL Studio")).toBeInTheDocument();
      expect(screen.getByText("Cubase")).toBeInTheDocument();
    });

    it("shows queue status", async () => {
      vi.mocked(api.listProjects).mockResolvedValue([]);
      vi.mocked(api.listBranches).mockResolvedValue([]);
      vi.mocked(api.listCommits).mockResolvedValue([]);

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Queue:")).toBeInTheDocument();
      });

      expect(screen.getByText("0 pending")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("shows error message when API fails", async () => {
      vi.mocked(api.listProjects).mockRejectedValue(new Error("Network error"));
      vi.mocked(api.listBranches).mockRejectedValue(new Error("Network error"));
      vi.mocked(api.listCommits).mockRejectedValue(new Error("Network error"));

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });
  });

  describe("CSS Classes", () => {
    it("has correct dashboard class", async () => {
      vi.mocked(api.listProjects).mockResolvedValue([]);
      vi.mocked(api.listBranches).mockResolvedValue([]);
      vi.mocked(api.listCommits).mockResolvedValue([]);

      const { container } = render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(container.querySelector(".dashboard")).toBeInTheDocument();
      });
    });

    it("has correct panel classes", async () => {
      vi.mocked(api.listProjects).mockResolvedValue([]);
      vi.mocked(api.listBranches).mockResolvedValue([]);
      vi.mocked(api.listCommits).mockResolvedValue([]);

      const { container } = render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(container.querySelector(".dashboard-panel-sessions")).toBeInTheDocument();
        expect(container.querySelector(".dashboard-panel-activity")).toBeInTheDocument();
        expect(container.querySelector(".dashboard-panel-quickstats")).toBeInTheDocument();
        expect(container.querySelector(".dashboard-panel-daw")).toBeInTheDocument();
      });
    });

    it("has stat card classes", async () => {
      vi.mocked(api.listProjects).mockResolvedValue([]);
      vi.mocked(api.listBranches).mockResolvedValue([]);
      vi.mocked(api.listCommits).mockResolvedValue([]);

      const { container } = render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        const statCards = container.querySelectorAll(".dashboard-stat-card");
        expect(statCards.length).toBe(5);
      });
    });
  });
});
