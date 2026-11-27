import { describe, expect, it, vi } from "vitest";

vi.mock("../src/components/styles/noteProperties.scss", () => ({ default: "" }));
vi.mock("../src/components/scripts/noteProperties.inline", () => ({ default: "" }));

import NotePropertiesComponent, { propertyType } from "../src/components/NoteProperties";
import { PropertyIcon } from "../src/components/icons";

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
const hasClass = (cls: string) => (v: VNode) => classOf(v).split(" ").includes(cls);

/** The text content of a rendered node. */
function textOf(node: unknown): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  const v = node as VNode;
  if (typeof v.type === "function" && v.type.name !== "Fragment") {
    return textOf((v.type as (p: unknown) => unknown)(v.props));
  }
  return textOf(v.props.children);
}

/** The value cell of property `key`. */
function valueOf(els: VNode[], key: string): VNode {
  const row = els.find((e) => e.props["data-property-key"] === key)!;
  return elements(row.props.children).find(hasClass("metadata-property-value"))!;
}

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
    // only a whole date (or a date and a time) is a date
    expect(propertyType("note", "Released 2024-01-15")).toBe("text");
    expect(propertyType("note", "Released 2024-01-15T10:00")).toBe("text");
    expect(propertyType("at", "2024-01-15T10:0")).toBe("text");
  });

  it("renders a list as pills of its items", () => {
    const els = render({ list: ["a", 2] });
    const value = valueOf(els, "list");
    expect(value.props["data-property-type"]).toBe("multitext");
    const inside = elements(value.props.children);
    const pills = inside.filter(hasClass("multi-select-pill-content"));
    expect(pills.map(textOf)).toEqual(["a", "2"]);
    expect(pills.map((p) => elements(p.props.children).map(classOf))).toEqual([
      ["note-properties-text"],
      ["note-properties-number"],
    ]);
    expect(inside.filter((e) => e.type === "code")).toEqual([]);
  });

  it("renders a boolean as Obsidian's disabled checkbox", () => {
    const value = valueOf(render({ done: true }), "done");
    expect(value.props["data-property-type"]).toBe("checkbox");
    const inside = elements(value.props.children);
    expect(inside).toHaveLength(1);
    const input = inside[0]!;
    expect(input.type).toBe("input");
    expect(input.props.type).toBe("checkbox");
    expect(classOf(input).split(" ")).toContain("metadata-input-checkbox");
    expect(input.props.checked).toBe(true);
    expect(input.props.disabled).toBe(true);
  });

  it("renders dates and date-times as Obsidian's date inputs", () => {
    const els = render({ d: "2024-01-15", at: "2024-01-15T10:00" });
    for (const [key, type, text] of [
      ["d", "date", "2024-01-15"],
      ["at", "datetime", "2024-01-15T10:00"],
    ]) {
      const value = valueOf(els, key!);
      expect(value.props["data-property-type"]).toBe(type);
      const inside = elements(value.props.children);
      expect(inside).toHaveLength(1);
      expect(classOf(inside[0]!).split(" ")).toEqual(
        expect.arrayContaining(["metadata-input", "mod-date"]),
      );
      expect(textOf(inside[0])).toBe(text);
    }
  });

  it("classes the container note-properties and draws the collapse chevron", () => {
    const els = render({ a: "b" });
    const container = els.find(hasClass("metadata-container"))!;
    expect(classOf(container).split(" ")).toContain("note-properties");
    const indicator = els.find(hasClass("collapse-indicator"))!;
    expect(elements(indicator.props.children).map((e) => [e.type, classOf(e)])).toEqual([
      ["svg", "svg-icon right-triangle"],
      ["path", ""],
    ]);
  });

  it("draws a distinct Lucide icon for every property type, and the text icon otherwise", () => {
    const icon = (type: string) => {
      const svg = elements(PropertyIcon({ type })).find((e) => e.type === "svg")!;
      return {
        name: classOf(svg),
        html: (svg.props.dangerouslySetInnerHTML as { __html?: string } | undefined)?.__html,
      };
    };
    const types = [
      "text",
      "multitext",
      "number",
      "checkbox",
      "date",
      "datetime",
      "tags",
      "aliases",
    ];
    const icons = types.map(icon);
    expect(icons.map((i) => i.name)).toEqual([
      "svg-icon lucide-text",
      "svg-icon lucide-list",
      "svg-icon lucide-binary",
      "svg-icon lucide-check-square",
      "svg-icon lucide-calendar",
      "svg-icon lucide-clock",
      "svg-icon lucide-tags",
      "svg-icon lucide-forward",
    ]);
    for (const { html } of icons) expect(html).toMatch(/^<(path|rect|circle) /);
    expect(new Set(icons.map((i) => i.html)).size).toBe(types.length);
    expect(icon("unknown")).toEqual(icon("text"));
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
