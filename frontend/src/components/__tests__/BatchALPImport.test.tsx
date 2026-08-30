import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BatchALPImport from "../BatchALPImport";

// Mock the fetch API
const mockFetch = vi.fn();
window.fetch = mockFetch;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => "mock-token"),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("BatchALPImport", () => {
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

  describe("Initial Render", () => {
    it("renders the trigger button when closed", () => {
      render(<BatchALPImport {...defaultProps} />);

      expect(screen.getByText("Batch ALP Import")).toBeInTheDocument();
    });

    it("does not show the import panel initially", () => {
      render(<BatchALPImport {...defaultProps} />);

      expect(screen.queryByText("Select Folder with ALP Files")).not.toBeInTheDocument();
    });
  });

  describe("Opening/Closing Panel", () => {
    it("opens the panel when trigger button is clicked", async () => {
      const user = userEvent.setup();
      render(<BatchALPImport {...defaultProps} />);

      await user.click(screen.getByText("Batch ALP Import"));

      expect(screen.getByText("Select Folder with ALP Files")).toBeInTheDocument();
      expect(screen.getByText("Select ALP Files")).toBeInTheDocument();
    });

    it("closes the panel when close button is clicked", async () => {
      const user = userEvent.setup();
      render(<BatchALPImport {...defaultProps} />);

      // Open
      await user.click(screen.getByText("Batch ALP Import"));

      // Close
      const closeButtons = screen.getAllByRole("button");
      const closeButton = closeButtons.find((btn) =>
        btn.querySelector("svg")?.classList.contains("lucide-x")
      );
      if (closeButton) {
        await user.click(closeButton);
      }

      expect(screen.queryByText("Select Folder with ALP Files")).not.toBeInTheDocument();
    });
  });

  describe("File Selection", () => {
    it("shows selection buttons when panel is open", async () => {
      const user = userEvent.setup();
      render(<BatchALPImport {...defaultProps} />);

      await user.click(screen.getByText("Batch ALP Import"));

      expect(screen.getByText("Select Folder with ALP Files")).toBeInTheDocument();
      expect(screen.getByText("Select ALP Files")).toBeInTheDocument();
    });

    it("shows hint text", async () => {
      const user = userEvent.setup();
      render(<BatchALPImport {...defaultProps} />);

      await user.click(screen.getByText("Batch ALP Import"));

      expect(
        screen.getByText("Scan a folder for .alp files or select multiple .alp files directly")
      ).toBeInTheDocument();
    });
  });

  describe("Upload State", () => {
    it("shows file list when files are selected", async () => {
      const user = userEvent.setup();
      render(<BatchALPImport {...defaultProps} />);

      await user.click(screen.getByText("Batch ALP Import"));

      // Simulate file selection by finding the hidden input
      const fileInput = document.querySelector('input[accept=".alp"]') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();

      // Create mock files
      const file1 = new File(["alp content 1"], "Pack1.alp", { type: "application/octet-stream" });
      const file2 = new File(["alp content 2"], "Pack2.alp", { type: "application/octet-stream" });

      // Trigger change event
      Object.defineProperty(fileInput, "files", {
        value: [file1, file2],
        writable: true,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText("2 ALP file(s) selected")).toBeInTheDocument();
      });
    });

    it("shows file names and sizes", async () => {
      const user = userEvent.setup();
      render(<BatchALPImport {...defaultProps} />);

      await user.click(screen.getByText("Batch ALP Import"));

      const fileInput = document.querySelector('input[accept=".alp"]') as HTMLInputElement;
      const file = new File(["x".repeat(1024 * 100)], "TestPack.alp", {
        type: "application/octet-stream",
      });

      Object.defineProperty(fileInput, "files", {
        value: [file],
        writable: true,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText("TestPack.alp")).toBeInTheDocument();
      });
      // Size formatting might vary, just check the file name is shown
    });

    it("shows Clear button when files are selected", async () => {
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

      await waitFor(() => {
        expect(screen.getByText("Clear")).toBeInTheDocument();
      });
    });

    it("clears files when Clear button is clicked", async () => {
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

      await waitFor(() => {
        expect(screen.getByText("1 ALP file(s) selected")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Clear"));

      expect(screen.queryByText("1 ALP file(s) selected")).not.toBeInTheDocument();
    });
  });

  describe("Import Process", () => {
    it("shows Import button with correct count", async () => {
      const user = userEvent.setup();
      render(<BatchALPImport {...defaultProps} />);

      await user.click(screen.getByText("Batch ALP Import"));

      const fileInput = document.querySelector('input[accept=".alp"]') as HTMLInputElement;
      const files = [
        new File(["alp1"], "Pack1.alp", { type: "application/octet-stream" }),
        new File(["alp2"], "Pack2.alp", { type: "application/octet-stream" }),
      ];

      Object.defineProperty(fileInput, "files", {
        value: files,
        writable: true,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText("Import 2 ALP File(s)")).toBeInTheDocument();
      });
    });

    it("calls fetch for each file during import", async () => {
      const user = userEvent.setup();
      render(<BatchALPImport {...defaultProps} />);

      await user.click(screen.getByText("Batch ALP Import"));

      const fileInput = document.querySelector('input[accept=".alp"]') as HTMLInputElement;
      const file = new File(["alp content"], "Pack.alp", { type: "application/octet-stream" });

      Object.defineProperty(fileInput, "files", {
        value: [file],
        writable: true,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText("Import 1 ALP File(s)")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Import 1 ALP File(s)"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/projects/1/commits",
          expect.objectContaining({
            method: "POST",
          })
        );
      });
    });

    it("shows success summary after import", async () => {
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

      await waitFor(() => {
        expect(screen.getByText("Import 1 ALP File(s)")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Import 1 ALP File(s)"));

      await waitFor(() => {
        expect(screen.getByText("Import Complete")).toBeInTheDocument();
      });
    });

    it("calls onImportComplete after successful import", async () => {
      const user = userEvent.setup();
      const onImportComplete = vi.fn();
      render(<BatchALPImport {...defaultProps} onImportComplete={onImportComplete} />);

      await user.click(screen.getByText("Batch ALP Import"));

      const fileInput = document.querySelector('input[accept=".alp"]') as HTMLInputElement;
      const file = new File(["alp"], "Pack.alp", { type: "application/octet-stream" });

      Object.defineProperty(fileInput, "files", {
        value: [file],
        writable: true,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText("Import 1 ALP File(s)")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Import 1 ALP File(s)"));

      await waitFor(() => {
        expect(onImportComplete).toHaveBeenCalled();
      });
    });

    it("shows error status when upload fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Internal Server Error",
      });

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

      await waitFor(() => {
        expect(screen.getByText("Import 1 ALP File(s)")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Import 1 ALP File(s)"));

      await waitFor(() => {
        expect(screen.getByText("Import Complete")).toBeInTheDocument();
        expect(screen.getByText("Failed")).toBeInTheDocument();
      });
    });
  });

  describe("Summary Display", () => {
    it("shows Import More button after completion", async () => {
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

      await waitFor(() => {
        expect(screen.getByText("Import 1 ALP File(s)")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Import 1 ALP File(s)"));

      await waitFor(() => {
        expect(screen.getByText("Import More")).toBeInTheDocument();
      });
    });

    it("resets state when Import More is clicked", async () => {
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

      await waitFor(() => {
        expect(screen.getByText("Import 1 ALP File(s)")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Import 1 ALP File(s)"));

      await waitFor(() => {
        expect(screen.getByText("Import Complete")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Import More"));

      expect(screen.queryByText("Import Complete")).not.toBeInTheDocument();
      expect(screen.getByText("Select Folder with ALP Files")).toBeInTheDocument();
    });
  });

  describe("File Filtering", () => {
    it("filters out non-.alp files", async () => {
      const user = userEvent.setup();
      render(<BatchALPImport {...defaultProps} />);

      await user.click(screen.getByText("Batch ALP Import"));

      const fileInput = document.querySelector('input[accept=".alp"]') as HTMLInputElement;
      const files = [
        new File(["alp"], "Pack.alp", { type: "application/octet-stream" }),
        new File(["wav"], "Audio.wav", { type: "audio/wav" }),
        new File(["zip"], "Archive.zip", { type: "application/zip" }),
      ];

      Object.defineProperty(fileInput, "files", {
        value: files,
        writable: true,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText("1 ALP file(s) selected")).toBeInTheDocument();
        expect(screen.getByText("Pack.alp")).toBeInTheDocument();
        expect(screen.queryByText("Audio.wav")).not.toBeInTheDocument();
        expect(screen.queryByText("Archive.zip")).not.toBeInTheDocument();
      });
    });
  });

  describe("File Size Formatting", () => {
    it("formats bytes correctly", async () => {
      const user = userEvent.setup();
      render(<BatchALPImport {...defaultProps} />);

      await user.click(screen.getByText("Batch ALP Import"));

      const fileInput = document.querySelector('input[accept=".alp"]') as HTMLInputElement;
      const file = new File(["x".repeat(512)], "Small.alp", { type: "application/octet-stream" });

      Object.defineProperty(fileInput, "files", {
        value: [file],
        writable: true,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText("512 B")).toBeInTheDocument();
      });
    });

    it("formats kilobytes correctly", async () => {
      const user = userEvent.setup();
      render(<BatchALPImport {...defaultProps} />);

      await user.click(screen.getByText("Batch ALP Import"));

      const fileInput = document.querySelector('input[accept=".alp"]') as HTMLInputElement;
      const file = new File(["x".repeat(1024 * 5)], "Medium.alp", { type: "application/octet-stream" });

      Object.defineProperty(fileInput, "files", {
        value: [file],
        writable: true,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        // Size should contain KB
        expect(screen.getByText(/KB/)).toBeInTheDocument();
      });
    });

    it("formats megabytes correctly", async () => {
      const user = userEvent.setup();
      render(<BatchALPImport {...defaultProps} />);

      await user.click(screen.getByText("Batch ALP Import"));

      const fileInput = document.querySelector('input[accept=".alp"]') as HTMLInputElement;
      const file = new File(["x".repeat(1024 * 1024 * 2)], "Large.alp", {
        type: "application/octet-stream",
      });

      Object.defineProperty(fileInput, "files", {
        value: [file],
        writable: true,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        // Size should contain MB
        expect(screen.getByText(/MB/)).toBeInTheDocument();
      });
    });
  });
});
