import { describe, expect, it } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { CreatedModifiedDate } from "../src/transformer";
import { createCtx } from "./helpers";
import type { VFile } from "vfile";

describe("CreatedModifiedDate", () => {
  it("extracts dates from frontmatter", async () => {
    const ctx = createCtx();
    const transformer = CreatedModifiedDate({ priority: ["frontmatter"] });
    const markdownPlugins = transformer.markdownPlugins?.(ctx) ?? [];
    
    const processor = unified().use(remarkParse).use(markdownPlugins).use(remarkStringify);
    
    const createdDate = "2023-01-01";
    const modifiedDate = "2023-01-02";
    
    const file = await processor.process({
      value: "content",
      data: {
        relativePath: "test.md",
        filePath: "/test.md",
        frontmatter: {
          created: createdDate,
          modified: modifiedDate,
        },
      },
    } as any) as VFile;

    const data = file.data as any;
    expect(data.dates).toBeDefined();
    expect(data.dates.created.toISOString()).toContain("2023-01-01");
    expect(data.dates.modified.toISOString()).toContain("2023-01-02");
  });
});
