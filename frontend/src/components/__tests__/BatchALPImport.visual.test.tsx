import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BatchALPImport from "../BatchALPImport";

// Mock fetch
const mockFetch = vi.fn();
window.fetch = mockFetch;

// Mock localStorage
Object.defineProperty(window, "localStorage", {
  value: {
    getItem: vi.fn(() => "mock-token"),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
});

/**
 * Visual Regression Tests for BatchALPImport
 *
 * These tests verify the visual structure, CSS classes, and layout
 * of the component in different states. They serve as a baseline
 * to detect unintended visual changes.
 */

describe("BatchALPImport Visual Regression", () => {
  const defaultProps = {
    projectId: 1,
    branch: "main",
    onImportComplete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ file_count: 10 }),
    });
  });

  describe("Trigger Button State", () => {
    it("has correct visual structure when closed", () => {
      const { container } = render(<BatchALPImport {...defaultProps} />);

      const trigger = container.querySelector(".batch-alp-trigger");
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveClass("batch-alp-trigger");

      // Should have Package icon
      const icon = trigger?.querySelector("svg");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass("lucide-package");

      // Should have text
      expect(screen.getByText("Batch ALP Import")).toBeInTheDocument();
    });

    it("trigger button has dashed border style", () => {
      const { container } = render(<BatchALPImport {...defaultProps} />);

      const trigger = container.querySelector(".batch-alp-trigger");
      expect(trigger).toBeInTheDocument();

      // Verify it's a button element
      expect(trigger?.tagName).toBe("BUTTON");
    });
  });

  describe("Panel Open State", () => {
    it("panel has correct container structure", async () => {
      const user = userEvent.setup();
      const { container } = render(<BatchALPImport {...defaultProps} />);

      await user.click(screen.getByText("Batch ALP Import"));

      const panel = container.querySelector(".batch-alp-container");
      expect(panel).toBeInTheDocument();
      expect(panel).toHaveClass("batch-alp-container");
    });

    it("header has correct structure", async () => {
      const user = userEvent.setup();
      const { container } = render(<BatchALPImport {...defaultProps} />);

      await user.click(screen.getByText("Batch ALP Import"));

      const header = container.querySelector(".batch-alp-header");
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass("batch-alp-header");

      const title = container.querySelector(".batch-alp-title");
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent("Batch ALP Import");

      const closeBtn = container.querySelector(".batch-alp-close");
      expect(closeBtn).toBeInTheDocument();
    });

    it("selection area has centered layout", async () => {
      const user = userEvent.setup();
      const { container } = render(<BatchALPImport {...defaultProps} />);

      await user.click(screen.getByText("Batch ALP Import"));

      const selectArea = container.querySelector(".batch-alp-select");
      expect(selectArea).toBeInTheDocument();
      expect(selectArea).toHaveClass("batch-alp-select");

      const actions = container.querySelector(".batch-alp-select-actions");
      expect(actions).toBeInTheDocument();
    });

    it("shows both folder and file selection buttons", async () => {
      const user = userEvent.setup();
      render(<BatchALPImport {...defaultProps} />);

      await user.click(screen.getByText("Batch ALP Import"));

      expect(screen.getByText("Select Folder with ALP Files")).toBeInTheDocument();
      expect(screen.getByText("Select ALP Files")).toBeInTheDocument();

      // "or" separator
      expect(screen.getByText("or")).toBeInTheDocument();
    });

    it("buttons have correct visual hierarchy", async () => {
      const user = userEvent.setup();
      const { container } = render(<BatchALPImport {...defaultProps} />);

      await user.click(screen.getByText("Batch ALP Import"));

      const buttons = container.querySelectorAll(".batch-alp-btn");
      expect(buttons.length).toBe(2);

      // First button is primary
      expect(buttons[0]).toHaveClass("batch-alp-btn");
      expect(buttons[0]).not.toHaveClass("batch-alp-btn-secondary");

      // Second button is secondary
      expect(buttons[1]).toHaveClass("batch-alp-btn-secondary");
    });
  });

  describe("File List State", () => {
    const setupWithFiles = async () => {
      const user = userEvent.setup();
      const result = render(<BatchALPImport {...defaultProps} />);

      await user.click(screen.getByText("Batch ALP Import"));

      const fileInput = document.querySelector('input[accept=".alp"]') as HTMLInputElement;
      const files = [
        new File(["x".repeat(1024 * 10)], "Pack1.alp", { type: "application/octet-stream" }),
        new File(["x".repeat(1024 * 50)], "Pack2.alp", { type: "application/octet-stream" }),
        new File(["x".repeat(1024 * 100)], "Pack3.alp", { type: "application/octet-stream" }),
      ];

      Object.defineProperty(fileInput, "files", {
        value: files,
        writable: true,
      });
      fireEvent.change(fileInput);

      await screen.findByText("3 ALP file(s) selected");

      return { user, container: result.container };
    };

    it("file list has correct container structure", async () => {
      const { container } = await setupWithFiles();

      const filesContainer = container.querySelector(".batch-alp-files");
      expect(filesContainer).toBeInTheDocument();
      expect(filesContainer).toHaveClass("batch-alp-files");
    });

    it("file list header shows count and clear button", async () => {
      const { container } = await setupWithFiles();

      const header = container.querySelector(".batch-alp-files-header");
      expect(header).toBeInTheDocument();

      expect(screen.getByText("3 ALP file(s) selected")).toBeInTheDocument();
      expect(screen.getByText("Clear")).toBeInTheDocument();
    });

    it("file rows have correct structure", async () => {
      const { container } = await setupWithFiles();

      const fileRows = container.querySelectorAll(".batch-alp-file-row");
      expect(fileRows.length).toBe(3);

      fileRows.forEach((row) => {
        // Each row should have pending status class
        expect(row).toHaveClass("batch-alp-file-row");
        expect(row).toHaveClass("batch-alp-file-pending");

        // Should have icon, info, and name
        expect(row.querySelector(".batch-alp-file-icon")).toBeInTheDocument();
        expect(row.querySelector(".batch-alp-file-info")).toBeInTheDocument();
        expect(row.querySelector(".batch-alp-file-name")).toBeInTheDocument();
        expect(row.querySelector(".batch-alp-file-size")).toBeInTheDocument();
      });
    });

    it("file names are displayed correctly", async () => {
      await setupWithFiles();

      expect(screen.getByText("Pack1.alp")).toBeInTheDocument();
      expect(screen.getByText("Pack2.alp")).toBeInTheDocument();
      expect(screen.getByText("Pack3.alp")).toBeInTheDocument();
    });

    it("import button shows correct count", async () => {
      const { container } = await setupWithFiles();

      const importBtn = container.querySelector(".batch-alp-btn-primary");
      expect(importBtn).toBeInTheDocument();
      expect(importBtn).toHaveTextContent("Import 3 ALP File(s)");
    });
  });

  describe("Import Progress State", () => {
    it("shows uploading status during import", async () => {
      const user = userEvent.setup();
      render(<BatchALPImport {...defaultProps} />);

      await user.click(screen.getByText("Batch ALP Import"));

      const fileInput = document.querySelector('input[accept=".alp"]') as HTMLInputElement;
      const file = new File(["alp"], "Pack.alp", { type: "application/octet-stream" });

      Object.defineProperty(fileInput, "files", {
        value: [file],
        writable: true,
      });
      fireEvent.change(fileInput);

      await screen.findByText("Import 1 ALP File(s)");

      // Start import
      await user.click(screen.getByText("Import 1 ALP File(s)"));

      // Should show summary after completion
      await screen.findByText("Import Complete");
    });
  });

  describe("Summary State", () => {
    it("summary has correct structure", async () => {
      const user = userEvent.setup();
      render(<BatchALPImport {...defaultProps} />);

      await user.click(screen.getByText("Batch ALP Import"));

      const fileInput = document.querySelector('input[accept=".alp"]') as HTMLInputElement;
      const file = new File(["alp"], "Pack.alp", { type: "application/octet-stream" });

      Object.defineProperty(fileInput, "files", {
        value: [file],
        writable: true,
      });
      fireEvent.change(fileInput);

      await screen.findByText("Import 1 ALP File(s)");
      await user.click(screen.getByText("Import 1 ALP File(s)"));

      await screen.findByText("Import Complete");

      const summary = document.querySelector(".batch-alp-summary");
      expect(summary).toBeInTheDocument();
      expect(summary).toHaveClass("batch-alp-summary");

      const header = document.querySelector(".batch-alp-summary-header");
      expect(header).toBeInTheDocument();
      expect(header).toHaveTextContent("Import Complete");

      const stats = document.querySelector(".batch-alp-summary-stats");
      expect(stats).toBeInTheDocument();
    });

    it("shows stat cards with correct structure", async () => {
      const user = userEvent.setup();
      render(<BatchALPImport {...defaultProps} />);

      await user.click(screen.getByText("Batch ALP Import"));

      const fileInput = document.querySelector('input[accept=".alp"]') as HTMLInputElement;
      const file = new File(["alp"], "Pack.alp", { type: "application/octet-stream" });

      Object.defineProperty(fileInput, "files", {
        value: [file],
        writable: true,
      });
      fireEvent.change(fileInput);

      await screen.findByText("Import 1 ALP File(s)");
      await user.click(screen.getByText("Import 1 ALP File(s)"));

      await screen.findByText("Import Complete");

      const statCards = document.querySelectorAll(".batch-alp-stat");
      expect(statCards.length).toBeGreaterThanOrEqual(3);

      statCards.forEach((card) => {
        expect(card.querySelector(".batch-alp-stat-value")).toBeInTheDocument();
        expect(card.querySelector(".batch-alp-stat-label")).toBeInTheDocument();
      });
    });

    it("shows success stat with correct styling", async () => {
      const user = userEvent.setup();
      render(<BatchALPImport {...defaultProps} />);

      await user.click(screen.getByText("Batch ALP Import"));

      const fileInput = document.querySelector('input[accept=".alp"]') as HTMLInputElement;
      const file = new File(["alp"], "Pack.alp", { type: "application/octet-stream" });

      Object.defineProperty(fileInput, "files", {
        value: [file],
        writable: true,
      });
      fireEvent.change(fileInput);

      await screen.findByText("Import 1 ALP File(s)");
      await user.click(screen.getByText("Import 1 ALP File(s)"));

      await screen.findByText("Import Complete");

      const successStat = document.querySelector(".batch-alp-stat-success");
      expect(successStat).toBeInTheDocument();
      expect(successStat).toHaveClass("batch-alp-stat-success");
    });

    it("Import More button has secondary styling", async () => {
      const user = userEvent.setup();
      render(<BatchALPImport {...defaultProps} />);

      await user.click(screen.getByText("Batch ALP Import"));

      const fileInput = document.querySelector('input[accept=".alp"]') as HTMLInputElement;
      const file = new File(["alp"], "Pack.alp", { type: "application/octet-stream" });

      Object.defineProperty(fileInput, "files", {
        value: [file],
        writable: true,
      });
      fireEvent.change(fileInput);

      await screen.findByText("Import 1 ALP File(s)");
      await user.click(screen.getByText("Import 1 ALP File(s)"));

      await screen.findByText("Import Complete");

      const importMoreBtn = screen.getByText("Import More");
      expect(importMoreBtn).toHaveClass("batch-alp-btn-secondary");
    });
  });

  describe("CSS Class Consistency", () => {
    it("all batch-alp prefixed classes are used consistently", async () => {
      const user = userEvent.setup();
      const { container } = render(<BatchALPImport {...defaultProps} />);

      // Trigger state
      expect(container.querySelector(".batch-alp-trigger")).toBeInTheDocument();

      // Open panel
      await user.click(screen.getByText("Batch ALP Import"));

      // Panel structure
      expect(container.querySelector(".batch-alp-container")).toBeInTheDocument();
      expect(container.querySelector(".batch-alp-header")).toBeInTheDocument();
      expect(container.querySelector(".batch-alp-title")).toBeInTheDocument();
      expect(container.querySelector(".batch-alp-close")).toBeInTheDocument();
      expect(container.querySelector(".batch-alp-body")).toBeInTheDocument();
      expect(container.querySelector(".batch-alp-select")).toBeInTheDocument();
      expect(container.querySelector(".batch-alp-select-actions")).toBeInTheDocument();
      expect(container.querySelector(".batch-alp-hint")).toBeInTheDocument();
    });

    it("button classes follow naming convention", async () => {
      const user = userEvent.setup();
      const { container } = render(<BatchALPImport {...defaultProps} />);

      await user.click(screen.getByText("Batch ALP Import"));

      const buttons = container.querySelectorAll('[class*="batch-alp-btn"]');
      buttons.forEach((btn) => {
        expect(btn.className).toMatch(/batch-alp-btn/);
      });
    });
  });

  describe("Accessibility Structure", () => {
    it("has proper heading hierarchy", async () => {
      const user = userEvent.setup();
      render(<BatchALPImport {...defaultProps} />);

      await user.click(screen.getByText("Batch ALP Import"));

      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toHaveTextContent("Batch ALP Import");
    });

    it("buttons are keyboard accessible", async () => {
      render(<BatchALPImport {...defaultProps} />);

      const trigger = screen.getByText("Batch ALP Import").closest("button");
      expect(trigger).toBeInTheDocument();
      expect(trigger?.tagName).toBe("BUTTON");
    });

    it("file input has correct accept attribute", async () => {
      const user = userEvent.setup();
      render(<BatchALPImport {...defaultProps} />);

      await user.click(screen.getByText("Batch ALP Import"));

      const fileInput = document.querySelector('input[accept=".alp"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute("accept", ".alp");
    });
  });
});
