import { describe, expect, it, vi } from "vitest";

vi.mock("../src/components/styles/noteProperties.scss", () => ({ default: "" }));
vi.mock("../src/components/scripts/noteProperties.inline", () => ({ default: "" }));

import NotePropertiesComponent, { propertyType } from "../src/components/NoteProperties";

type VNode = { type: unknown; props: Record<string, unknown> & { children?: unknown } };

/** Every element with its class and data attributes, function components expanded. */
function elements(node: unknown, out: VNode[] = []): VNode[] {
  if (Array.isArray(node)) {
    node.forEach((n) => elements(n, out));
    return out;
  }
  if (!node || typeof node !== "object" || !("props" in node)) return out;
  const v = node as VNode;
  if (typeof v.type === "function" && v.type.name !== "Fragment") {
    return elements((v.type as (p: unknown) => unknown)(v.props), out);
  }
  if (typeof v.type === "string") out.push(v);
  elements(v.props.children, out);
  return out;
}

const classOf = (v: VNode) => String(v.props.class ?? "");

function render(properties: Record<string, unknown>) {
  const fileData = { slug: "page", noteProperties: { properties, resolvedLinks: {} } };
  const Component = NotePropertiesComponent();
  return elements(Component({ fileData, allFiles: [fileData], cfg: { locale: "en-US" } } as never));
}

describe("Obsidian's properties markup", () => {
  it("infers Obsidian's property types", () => {
    expect(propertyType("tags", ["a"])).toBe("tags");
    expect(propertyType("aliases", ["a"])).toBe("aliases");
    expect(propertyType("list", ["a", "b"])).toBe("multitext");
    expect(propertyType("done", true)).toBe("checkbox");
    expect(propertyType("rating", 4)).toBe("number");
    expect(propertyType("date", "2024-01-15")).toBe("date");
    expect(propertyType("at", "2024-01-15T10:00")).toBe("datetime");
    expect(propertyType("status", "published")).toBe("text");
  });

  it("renders the container, heading, rows and typed values themes style", () => {
    const els = render({ aliases: ["one", "two"], rating: 4, status: "draft" });
    const has = (cls: string) => els.filter((e) => classOf(e).split(" ").includes(cls));

    const container = has("metadata-container")[0]!;
    expect(container.type).toBe("details");
    expect(container.props["data-property-count"]).toBe(3);
    expect(has("metadata-properties-heading")[0]!.type).toBe("summary");
    expect(has("metadata-properties-title")).toHaveLength(1);
    expect(has("metadata-content")).toHaveLength(1);
    expect(has("metadata-properties")).toHaveLength(1);

    const rows = has("metadata-property");
    expect(rows.map((r) => r.props["data-property-key"])).toEqual(["aliases", "rating", "status"]);
    expect(has("metadata-property-value").map((v) => v.props["data-property-type"])).toEqual([
      "aliases",
      "number",
      "text",
    ]);
    expect(has("metadata-property-key-input")).toHaveLength(3);
    expect(has("multi-select-pill")).toHaveLength(2);
    expect(has("multi-select-pill-content")).toHaveLength(2);
    expect(has("metadata-input-number")).toHaveLength(1);
    expect(has("metadata-input-longtext")).toHaveLength(1);
  });

  it("shows Obsidian's icon for each property type", () => {
    const els = render({ tags: ["a"], aliases: ["b"], n: 1, done: true, d: "2024-01-15", s: "x" });
    const icons = els
      .filter((e) => e.type === "svg")
      .map((e) => classOf(e))
      .filter((c) => c.startsWith("svg-icon lucide-"));
    expect(icons).toEqual([
      "svg-icon lucide-tags",
      "svg-icon lucide-forward",
      "svg-icon lucide-binary",
      "svg-icon lucide-check-square",
      "svg-icon lucide-calendar",
      "svg-icon lucide-text",
    ]);
    expect(els.filter((e) => classOf(e) === "metadata-property-icon")).toHaveLength(6);
  });

  it("marks a collapsed block like Obsidian", () => {
    const fileData = {
      slug: "page",
      noteProperties: { properties: { a: "b" }, resolvedLinks: {}, collapseProperties: true },
    };
    const els = elements(
      NotePropertiesComponent()({
        fileData,
        allFiles: [fileData],
        cfg: { locale: "en-US" },
      } as never),
    );
    const container = els.find((e) => classOf(e).includes("metadata-container"))!;
    expect(classOf(container)).toContain("is-collapsed");
    expect(container.props.open).toBe(false);
  });
});
