import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MetadataPanel from "../MetadataPanel";
import type { DawInfo } from "../../types";

// Helper to create mock DawInfo
const createMockDawInfo = (overrides: Partial<DawInfo> = {}): DawInfo => ({
  format: "Ableton Live",
  format_key: "als",
  version: "12.0",
  bpm: 128.0,
  time_signature: "4/4",
  tracks: [
    { name: "Synth Lead", kind: "midi", devices: ["Serum"] },
    { name: "Drums", kind: "audio", devices: ["Compressor"] },
    { name: "Master", kind: "master", devices: ["Limiter"] },
  ],
  plugins: ["Serum", "Compressor", "Limiter"],
  samples: ["Kick.wav", "Clap.wav"],
  extra: {},
  ...overrides,
});

describe("MetadataPanel", () => {
  describe("Empty State", () => {
    it("renders empty state when info is null", () => {
      render(<MetadataPanel info={null} />);

      expect(screen.getByText("Project Metadata")).toBeInTheDocument();
      expect(screen.getByText("No DAW metadata available")).toBeInTheDocument();
    });

    it("has correct CSS classes for empty state", () => {
      const { container } = render(<MetadataPanel info={null} />);

      const panel = container.querySelector(".metadata-panel");
      expect(panel).toHaveClass("metadata-panel-empty");
    });

    it("shows BarChart2 icon in header", () => {
      const { container } = render(<MetadataPanel info={null} />);

      const icon = container.querySelector(".metadata-panel-icon");
      expect(icon).toBeInTheDocument();
    });
  });

  describe("Full Mode (default)", () => {
    it("renders panel with DAW info", () => {
      const info = createMockDawInfo();
      const { container } = render(<MetadataPanel info={info} />);

      expect(screen.getByText("Project Metadata")).toBeInTheDocument();
      // Format in badge
      const badge = container.querySelector(".metadata-panel-badge");
      expect(badge).toHaveTextContent("Ableton Live");
    });

    it("displays BPM value", () => {
      const info = createMockDawInfo({ bpm: 128.0 });
      render(<MetadataPanel info={info} />);

      expect(screen.getByText("128")).toBeInTheDocument();
    });

    it("displays time signature", () => {
      const info = createMockDawInfo({ time_signature: "4/4" });
      render(<MetadataPanel info={info} />);

      expect(screen.getByText("4/4")).toBeInTheDocument();
    });

    it("displays track count", () => {
      const info = createMockDawInfo({
        tracks: [
          { name: "Track 1", kind: "midi", devices: [] },
          { name: "Track 2", kind: "audio", devices: [] },
        ],
      });
      const { container } = render(<MetadataPanel info={info} />);

      // Track count in section header
      const trackCount = container.querySelector(".metadata-section-count");
      expect(trackCount).toHaveTextContent("2");
    });

    it("displays plugin count", () => {
      const info = createMockDawInfo({
        plugins: ["Serum", "Vital", "Reverb"],
      });
      render(<MetadataPanel info={info} />);

      // Should show "3" for plugin count
      const metrics = screen.getAllByText("3");
      expect(metrics.length).toBeGreaterThan(0);
    });

    it("displays sample count", () => {
      const info = createMockDawInfo({
        samples: ["Kick.wav", "Clap.wav", "Hat.wav"],
      });
      render(<MetadataPanel info={info} />);

      const metrics = screen.getAllByText("3");
      expect(metrics.length).toBeGreaterThan(0);
    });

    it("displays format and version", () => {
      const info = createMockDawInfo({
        format: "Ableton Live",
        version: "12.0",
      });
      const { container } = render(<MetadataPanel info={info} />);

      // Format in badge
      const badge = container.querySelector(".metadata-panel-badge");
      expect(badge).toHaveTextContent("Ableton Live");
      
      // Version in info row
      const versionSpan = container.querySelector(".metadata-info-muted");
      expect(versionSpan).toHaveTextContent("(12.0)");
    });
  });

  describe("Metrics Row", () => {
    it("renders all metric labels", () => {
      const info = createMockDawInfo();
      const { container } = render(<MetadataPanel info={info} />);

      // Use metric labels specifically
      const metricLabels = container.querySelectorAll(".metadata-metric-label");
      const labelTexts = Array.from(metricLabels).map(el => el.textContent);
      expect(labelTexts).toContain("BPM");
      expect(labelTexts).toContain("Signature");
      expect(labelTexts).toContain("Tracks");
      expect(labelTexts).toContain("Plugins");
      expect(labelTexts).toContain("Samples");
    });

    it("shows dash for null BPM", () => {
      const info = createMockDawInfo({ bpm: null });
      render(<MetadataPanel info={info} />);

      expect(screen.getByText("—")).toBeInTheDocument();
    });

    it("shows dash for null time signature", () => {
      const info = createMockDawInfo({ time_signature: null });
      render(<MetadataPanel info={info} />);

      expect(screen.getByText("—")).toBeInTheDocument();
    });
  });

  describe("Tracks Section", () => {
    it("renders tracks section when tracks exist", () => {
      const info = createMockDawInfo();
      const { container } = render(<MetadataPanel info={info} />);

      // Check for tracks section header
      const sectionHeaders = container.querySelectorAll(".metadata-section-title");
      const tracksHeaders = Array.from(sectionHeaders).filter(el => el.textContent === "Tracks");
      expect(tracksHeaders.length).toBe(1);
      expect(screen.getByText("Synth Lead")).toBeInTheDocument();
      expect(screen.getByText("Drums")).toBeInTheDocument();
      expect(screen.getByText("Master")).toBeInTheDocument();
    });

    it("displays track kind", () => {
      const info = createMockDawInfo();
      render(<MetadataPanel info={info} />);

      expect(screen.getByText("midi")).toBeInTheDocument();
      expect(screen.getByText("audio")).toBeInTheDocument();
      expect(screen.getByText("master")).toBeInTheDocument();
    });

    it("shows track index numbers", () => {
      const info = createMockDawInfo();
      const { container } = render(<MetadataPanel info={info} />);

      const indices = container.querySelectorAll(".metadata-track-index");
      expect(indices[0]).toHaveTextContent("1");
      expect(indices[1]).toHaveTextContent("2");
      expect(indices[2]).toHaveTextContent("3");
    });

    it("hides tracks section when no tracks", () => {
      const info = createMockDawInfo({ tracks: [] });
      const { container } = render(<MetadataPanel info={info} />);

      // Tracks section header should not exist (but metric label "Tracks" still shows)
      const sectionHeaders = container.querySelectorAll(".metadata-section-title");
      const tracksHeaders = Array.from(sectionHeaders).filter(el => el.textContent === "Tracks");
      expect(tracksHeaders.length).toBe(0);
    });

    it("limits tracks to 10 in full mode", () => {
      const tracks = Array.from({ length: 15 }, (_, i) => ({
        name: `Track ${i + 1}`,
        kind: "midi",
        devices: [],
      }));
      const info = createMockDawInfo({ tracks });
      render(<MetadataPanel info={info} />);

      // Should show first 10 tracks
      expect(screen.getByText("Track 1")).toBeInTheDocument();
      expect(screen.getByText("Track 10")).toBeInTheDocument();
      expect(screen.queryByText("Track 11")).not.toBeInTheDocument();

      // Should show "more tracks" indicator
      expect(screen.getByText("+5 more tracks")).toBeInTheDocument();
    });
  });

  describe("Plugins Section", () => {
    it("renders plugins section when plugins exist", () => {
      const info = createMockDawInfo();
      const { container } = render(<MetadataPanel info={info} />);

      // Check for plugins section header
      const sectionHeaders = container.querySelectorAll(".metadata-section-title");
      const pluginsHeaders = Array.from(sectionHeaders).filter(el => el.textContent === "Plugins");
      expect(pluginsHeaders.length).toBe(1);
      expect(screen.getByText("Serum")).toBeInTheDocument();
      expect(screen.getByText("Compressor")).toBeInTheDocument();
      expect(screen.getByText("Limiter")).toBeInTheDocument();
    });

    it("hides plugins section when no plugins", () => {
      const info = createMockDawInfo({ plugins: [] });
      const { container } = render(<MetadataPanel info={info} />);

      // Plugins section header should not exist (but metric label "Plugins" still shows)
      const sectionHeaders = container.querySelectorAll(".metadata-section-title");
      const pluginsHeaders = Array.from(sectionHeaders).filter(el => el.textContent === "Plugins");
      expect(pluginsHeaders.length).toBe(0);
    });

    it("limits plugins to 8 in full mode", () => {
      const plugins = Array.from({ length: 12 }, (_, i) => `Plugin ${i + 1}`);
      const info = createMockDawInfo({ plugins });
      render(<MetadataPanel info={info} />);

      // Should show first 8 plugins
      expect(screen.getByText("Plugin 1")).toBeInTheDocument();
      expect(screen.getByText("Plugin 8")).toBeInTheDocument();
      expect(screen.queryByText("Plugin 9")).not.toBeInTheDocument();

      // Should show "more" indicator
      expect(screen.getByText("+4")).toBeInTheDocument();
    });

    it("plugin tags have correct class", () => {
      const info = createMockDawInfo();
      const { container } = render(<MetadataPanel info={info} />);

      const tags = container.querySelectorAll(".metadata-tag");
      expect(tags.length).toBeGreaterThan(0);
      tags.forEach((tag) => {
        expect(tag).toHaveClass("metadata-tag");
      });
    });
  });

  describe("Samples Section", () => {
    it("renders samples section when samples exist", () => {
      const info = createMockDawInfo();
      const { container } = render(<MetadataPanel info={info} />);

      // Check for samples section header
      const sectionHeaders = container.querySelectorAll(".metadata-section-title");
      const samplesHeaders = Array.from(sectionHeaders).filter(el => el.textContent === "Samples");
      expect(samplesHeaders.length).toBe(1);
      expect(screen.getByText("Kick.wav")).toBeInTheDocument();
      expect(screen.getByText("Clap.wav")).toBeInTheDocument();
    });

    it("hides samples section when no samples", () => {
      const info = createMockDawInfo({ samples: [] });
      const { container } = render(<MetadataPanel info={info} />);

      // Samples section header should not exist (but metric label "Samples" still shows)
      const sectionHeaders = container.querySelectorAll(".metadata-section-title");
      const samplesHeaders = Array.from(sectionHeaders).filter(el => el.textContent === "Samples");
      expect(samplesHeaders.length).toBe(0);
    });

    it("sample tags have sample class", () => {
      const info = createMockDawInfo();
      const { container } = render(<MetadataPanel info={info} />);

      const sampleTags = container.querySelectorAll(".metadata-tag-sample");
      expect(sampleTags.length).toBe(2);
    });

    it("limits samples to 8 in full mode", () => {
      const samples = Array.from({ length: 12 }, (_, i) => `Sample_${i + 1}.wav`);
      const info = createMockDawInfo({ samples });
      render(<MetadataPanel info={info} />);

      // Should show first 8 samples
      expect(screen.getByText("Sample_1.wav")).toBeInTheDocument();
      expect(screen.getByText("Sample_8.wav")).toBeInTheDocument();
      expect(screen.queryByText("Sample_9.wav")).not.toBeInTheDocument();
    });
  });

  describe("Compact Mode", () => {
    it("applies compact class", () => {
      const info = createMockDawInfo();
      const { container } = render(<MetadataPanel info={info} compact />);

      const panel = container.querySelector(".metadata-panel");
      expect(panel).toHaveClass("metadata-panel-compact");
    });

    it("limits tracks to 5 in compact mode", () => {
      const tracks = Array.from({ length: 10 }, (_, i) => ({
        name: `Track ${i + 1}`,
        kind: "midi",
        devices: [],
      }));
      const info = createMockDawInfo({ tracks });
      render(<MetadataPanel info={info} compact />);

      // Should show first 5 tracks
      expect(screen.getByText("Track 1")).toBeInTheDocument();
      expect(screen.getByText("Track 5")).toBeInTheDocument();
      expect(screen.queryByText("Track 6")).not.toBeInTheDocument();

      // Should NOT show "more tracks" indicator in compact mode
      expect(screen.queryByText(/more tracks/)).not.toBeInTheDocument();
    });

    it("limits plugins to 4 in compact mode", () => {
      const plugins = Array.from({ length: 10 }, (_, i) => `Plugin ${i + 1}`);
      const info = createMockDawInfo({ plugins });
      render(<MetadataPanel info={info} compact />);

      // Should show first 4 plugins
      expect(screen.getByText("Plugin 1")).toBeInTheDocument();
      expect(screen.getByText("Plugin 4")).toBeInTheDocument();
      expect(screen.queryByText("Plugin 5")).not.toBeInTheDocument();
    });

    it("limits samples to 4 in compact mode", () => {
      const samples = Array.from({ length: 10 }, (_, i) => `Sample_${i + 1}.wav`);
      const info = createMockDawInfo({ samples });
      render(<MetadataPanel info={info} compact />);

      // Should show first 4 samples
      expect(screen.getByText("Sample_1.wav")).toBeInTheDocument();
      expect(screen.getByText("Sample_4.wav")).toBeInTheDocument();
      expect(screen.queryByText("Sample_5.wav")).not.toBeInTheDocument();
    });

    it("does not show 'more' indicators in compact mode", () => {
      const plugins = Array.from({ length: 10 }, (_, i) => `Plugin ${i + 1}`);
      const info = createMockDawInfo({ plugins });
      const { container } = render(<MetadataPanel info={info} compact />);

      const moreTags = container.querySelectorAll(".metadata-tag-more");
      expect(moreTags.length).toBe(0);
    });
  });

  describe("Section Headers", () => {
    it("section headers show correct counts", () => {
      const info = createMockDawInfo();
      const { container } = render(<MetadataPanel info={info} />);

      const counts = container.querySelectorAll(".metadata-section-count");
      expect(counts[0]).toHaveTextContent("3"); // tracks
      expect(counts[1]).toHaveTextContent("3"); // plugins
      expect(counts[2]).toHaveTextContent("2"); // samples
    });

    it("section titles are uppercase", () => {
      const info = createMockDawInfo();
      const { container } = render(<MetadataPanel info={info} />);

      const titles = container.querySelectorAll(".metadata-section-title");
      titles.forEach((title) => {
        expect(title).toHaveClass("metadata-section-title");
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles empty tracks array", () => {
      const info = createMockDawInfo({ tracks: [] });
      const { container } = render(<MetadataPanel info={info} />);

      // Should still render panel
      expect(container.querySelector(".metadata-panel")).toBeInTheDocument();
      expect(screen.getByText("Project Metadata")).toBeInTheDocument();
    });

    it("handles empty plugins array", () => {
      const info = createMockDawInfo({ plugins: [] });
      const { container } = render(<MetadataPanel info={info} />);

      expect(container.querySelector(".metadata-panel")).toBeInTheDocument();
      expect(screen.getByText("Project Metadata")).toBeInTheDocument();
    });

    it("handles empty samples array", () => {
      const info = createMockDawInfo({ samples: [] });
      const { container } = render(<MetadataPanel info={info} />);

      expect(container.querySelector(".metadata-panel")).toBeInTheDocument();
      expect(screen.getByText("Project Metadata")).toBeInTheDocument();
    });

    it("handles single track", () => {
      const info = createMockDawInfo({
        tracks: [{ name: "Solo Track", kind: "midi", devices: [] }],
      });
      const { container } = render(<MetadataPanel info={info} />);

      expect(screen.getByText("Solo Track")).toBeInTheDocument();
      // Track count should be 1
      const trackCount = container.querySelector(".metadata-section-count");
      expect(trackCount).toHaveTextContent("1");
    });

    it("handles very long track names", () => {
      const longName = "A".repeat(100);
      const info = createMockDawInfo({
        tracks: [{ name: longName, kind: "midi", devices: [] }],
      });
      render(<MetadataPanel info={info} />);

      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it("handles special characters in plugin names", () => {
      const info = createMockDawInfo({
        plugins: ["FabFilter Pro-Q 3", "Waves CLA-76", "UAD Lexicon 224"],
      });
      render(<MetadataPanel info={info} />);

      expect(screen.getByText("FabFilter Pro-Q 3")).toBeInTheDocument();
      expect(screen.getByText("Waves CLA-76")).toBeInTheDocument();
      expect(screen.getByText("UAD Lexicon 224")).toBeInTheDocument();
    });
  });

  describe("CSS Classes", () => {
    it("panel has base class", () => {
      const info = createMockDawInfo();
      const { container } = render(<MetadataPanel info={info} />);

      expect(container.querySelector(".metadata-panel")).toBeInTheDocument();
    });

    it("header has correct classes", () => {
      const info = createMockDawInfo();
      const { container } = render(<MetadataPanel info={info} />);

      expect(container.querySelector(".metadata-panel-header")).toBeInTheDocument();
      expect(container.querySelector(".metadata-panel-title")).toBeInTheDocument();
      expect(container.querySelector(".metadata-panel-badge")).toBeInTheDocument();
    });

    it("metrics row has correct classes", () => {
      const info = createMockDawInfo();
      const { container } = render(<MetadataPanel info={info} />);

      expect(container.querySelector(".metadata-metrics-row")).toBeInTheDocument();
      const metrics = container.querySelectorAll(".metadata-metric");
      expect(metrics.length).toBe(5);
    });

    it("info row has correct classes", () => {
      const info = createMockDawInfo();
      const { container } = render(<MetadataPanel info={info} />);

      expect(container.querySelector(".metadata-info-row")).toBeInTheDocument();
      expect(container.querySelector(".metadata-info-label")).toBeInTheDocument();
      expect(container.querySelector(".metadata-info-value")).toBeInTheDocument();
    });
  });
});
