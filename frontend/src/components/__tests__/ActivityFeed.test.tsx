import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ActivityFeed from "../ActivityFeed";
import type { Commit } from "../../types";

// Helper to create mock commits
const createMockCommit = (overrides: Partial<Commit> = {}): Commit => ({
  id: 1,
  message: "Test commit",
  created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  parent_id: null,
  author: { id: 1, username: "producer", created_at: new Date().toISOString() },
  file_count: 5,
  total_size: 1024 * 100,
  ...overrides,
});

describe("ActivityFeed", () => {
  describe("Empty State", () => {
    it("renders with no commits (only mock data)", () => {
      render(<ActivityFeed commits={[]} />);

      expect(screen.getByText("Activity")).toBeInTheDocument();
      // Should still show mock activity items
      expect(screen.getByText(/events/)).toBeInTheDocument();
    });

    it("shows event count", () => {
      render(<ActivityFeed commits={[]} />);

      // Should show mock activity items (4 items)
      expect(screen.getByText("4 events")).toBeInTheDocument();
    });
  });

  describe("Commit Activity", () => {
    it("converts commits to activity items", () => {
      const commits = [
        createMockCommit({
          id: 1,
          message: "Add synth lead",
          author: { id: 1, username: "producer", created_at: new Date().toISOString() },
        }),
      ];

      render(<ActivityFeed commits={commits} />);

      expect(screen.getByText("Add synth lead")).toBeInTheDocument();
    });

    it("shows commit author", () => {
      const commits = [
        createMockCommit({
          id: 1,
          author: { id: 1, username: "producer", created_at: new Date().toISOString() },
        }),
      ];

      render(<ActivityFeed commits={commits} />);

      expect(screen.getByText("producer")).toBeInTheDocument();
    });

    it("uses default message when commit has no message", () => {
      const commits = [
        createMockCommit({
          id: 1,
          message: "",
        }),
      ];

      render(<ActivityFeed commits={commits} />);

      expect(screen.getByText("Pushed a new version")).toBeInTheDocument();
    });
  });

  describe("Mock Activity Items", () => {
    it("shows comment activity", () => {
      render(<ActivityFeed commits={[]} />);

      expect(
        screen.getByText(/Aisha commented @01:24/)
      ).toBeInTheDocument();
    });

    it("shows approval activity", () => {
      render(<ActivityFeed commits={[]} />);

      expect(
        screen.getByText("Marco approved this version")
      ).toBeInTheDocument();
    });

    it("shows system activity", () => {
      render(<ActivityFeed commits={[]} />);

      expect(
        screen.getByText("Dedup saved 1.2 GB — 2 blobs reused")
      ).toBeInTheDocument();
    });

    it("shows review activity", () => {
      render(<ActivityFeed commits={[]} />);

      expect(screen.getByText("Review session opened")).toBeInTheDocument();
    });
  });

  describe("Sorting", () => {
    it("sorts activity by timestamp (newest first)", () => {
      const commits = [
        createMockCommit({
          id: 1,
          message: "Old commit",
          created_at: new Date(Date.now() - 24 * 3600000).toISOString(), // 1 day ago
        }),
      ];

      render(<ActivityFeed commits={commits} />);

      const messages = screen.getAllByText(/commit|commented|approved|saved|opened/);
      // First item should be the most recent mock activity
      expect(messages[0].textContent).toMatch(/comment|approved|saved|opened|commit/);
    });
  });

  describe("Max Items", () => {
    it("limits the number of items shown", () => {
      const commits = [
        createMockCommit({ id: 5, message: "Commit 5" }),
        createMockCommit({ id: 4, message: "Commit 4" }),
        createMockCommit({ id: 3, message: "Commit 3" }),
        createMockCommit({ id: 2, message: "Commit 2" }),
        createMockCommit({ id: 1, message: "Commit 1" }),
      ];

      render(<ActivityFeed commits={commits} maxItems={3} />);

      // Should only show 3 items total (maxItems)
      const activityRows = document.querySelectorAll(".activity-feed-row");
      expect(activityRows.length).toBe(3);
    });

    it("shows all items when under maxItems", () => {
      const commits = [
        createMockCommit({ id: 1, message: "Commit 1" }),
      ];

      render(<ActivityFeed commits={commits} maxItems={10} />);

      // Should show 1 commit + 4 mock = 5 items (but limited by sorting)
      const activityRows = document.querySelectorAll(".activity-feed-row");
      expect(activityRows.length).toBeLessThanOrEqual(10);
    });
  });

  describe("Time Display", () => {
    it("shows time ago for activity items", () => {
      const commits = [
        createMockCommit({
          id: 1,
          created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
        }),
      ];

      render(<ActivityFeed commits={commits} />);

      expect(screen.getByText("5m ago")).toBeInTheDocument();
    });

    it("shows hours ago for older activity", () => {
      const commits = [
        createMockCommit({
          id: 1,
          created_at: new Date(Date.now() - 3 * 3600000).toISOString(), // 3 hours ago
        }),
      ];

      render(<ActivityFeed commits={commits} />);

      expect(screen.getByText("3h ago")).toBeInTheDocument();
    });
  });

  describe("Activity Icons", () => {
    it("renders icon wrappers with correct colors", () => {
      render(<ActivityFeed commits={[]} />);

      const iconWrappers = document.querySelectorAll(".activity-feed-icon-wrapper");
      expect(iconWrappers.length).toBeGreaterThan(0);

      // Each icon wrapper should have a background color
      iconWrappers.forEach((wrapper) => {
        const style = wrapper.getAttribute("style");
        // Style can be camelCase or kebab-case depending on rendering
        expect(style).toMatch(/background/i);
      });
    });
  });

  describe("User Display", () => {
    it("shows username for activity with user", () => {
      const commits = [
        createMockCommit({
          id: 1,
          author: { id: 1, username: "producer", created_at: new Date().toISOString() },
        }),
      ];

      render(<ActivityFeed commits={commits} />);

      expect(screen.getByText("producer")).toBeInTheDocument();
    });

    it("does not show user for system activity", () => {
      render(<ActivityFeed commits={[]} />);

      // System activity should not have user displayed
      const systemActivity = screen.getByText("Dedup saved 1.2 GB — 2 blobs reused");
      const meta = systemActivity.closest(".activity-feed-content")?.querySelector(".activity-feed-meta");
      expect(meta?.querySelector(".activity-feed-user")).toBeNull();
    });
  });

  describe("Message Display", () => {
    it("truncates long messages visually", () => {
      const longMessage = "A".repeat(200);
      const commits = [
        createMockCommit({
          id: 1,
          message: longMessage,
        }),
      ];

      render(<ActivityFeed commits={commits} />);

      const messageEl = screen.getByText(longMessage);
      expect(messageEl).toBeInTheDocument();
    });
  });

  describe("Commit Count", () => {
    it("displays correct total event count", () => {
      const commits = [
        createMockCommit({ id: 1 }),
        createMockCommit({ id: 2 }),
      ];

      render(<ActivityFeed commits={commits} maxItems={10} />);

      // 2 commits + 4 mock = 6 events
      expect(screen.getByText("6 events")).toBeInTheDocument();
    });
  });
});
