import fs from 'fs';
import { Repository } from '@napi-rs/simple-git';
import path from 'path';
import { styleText } from 'util';
import { spawnSync } from 'child_process';

// src/transformer.ts
var defaultOptions = {
  priority: ["frontmatter", "git", "filesystem"],
  defaultDateType: "modified"
};
var iso8601DateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
function coerceDate(fp, d) {
  if (typeof d === "string" && iso8601DateOnlyRegex.test(d)) {
    d = `${d}T00:00:00`;
  }
  const dt = d === void 0 ? /* @__PURE__ */ new Date() : d === null ? /* @__PURE__ */ new Date(0) : new Date(d);
  const invalidDate = isNaN(dt.getTime()) || dt.getTime() === 0;
  if (invalidDate && d !== void 0) {
    console.log(
      styleText(
        "yellow",
        `
Warning: found invalid date "${d}" in \`${fp}\`. Supported formats: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#date_time_string_format`
      )
    );
  }
  return invalidDate ? /* @__PURE__ */ new Date() : dt;
}
var CreatedModifiedDate = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts };
  return {
    name: "CreatedModifiedDate",
    markdownPlugins(ctx) {
      return [
        () => {
          const repoCache = /* @__PURE__ */ new Map();
          const creationDateCache = /* @__PURE__ */ new Map();
          const loadedWorkdirs = /* @__PURE__ */ new Set();
          return async (_tree, file) => {
            let created = void 0;
            let modified = void 0;
            let published = void 0;
            const data = file.data;
            const fp = data.relativePath;
            const fullFp = data.filePath;
            for (const source of opts.priority) {
              if (source === "filesystem") {
                const st = await fs.promises.stat(fullFp);
                created ||= st.birthtimeMs;
                modified ||= st.mtimeMs;
              } else if (source === "frontmatter" && data.frontmatter) {
                created ||= data.frontmatter.created;
                modified ||= data.frontmatter.modified;
                published ||= data.frontmatter.published;
              } else if (source === "git") {
                const dir = path.dirname(fullFp);
                let currentRepo = repoCache.get(dir);
                if (!currentRepo) {
                  try {
                    currentRepo = Repository.discover(dir);
                    repoCache.set(dir, currentRepo);
                  } catch {
                  }
                }
                if (currentRepo) {
                  try {
                    const workdir = currentRepo.workdir() ?? ctx.argv.directory;
                    const relativePath = path.relative(workdir, fullFp);
                    if (!loadedWorkdirs.has(workdir)) {
                      const repoCreationCache = /* @__PURE__ */ new Map();
                      try {
                        const result = spawnSync(
                          "git",
                          ["log", "--diff-filter=A", "--name-only", "--format=COMMIT:%at", "-z"],
                          { encoding: "utf-8", cwd: workdir }
                        );
                        if (result.status === 0) {
                          const pieces = result.stdout.split("\0");
                          let currentTimestamp;
                          for (const piece of pieces) {
                            if (piece.startsWith("COMMIT:")) {
                              currentTimestamp = parseInt(piece.slice(7));
                            } else {
                              const filePiece = piece.trim();
                              if (filePiece && currentTimestamp) {
                                const timestampMs = currentTimestamp * 1e3;
                                const existing = repoCreationCache.get(filePiece);
                                if (!existing || timestampMs < existing) {
                                  repoCreationCache.set(filePiece, timestampMs);
                                }
                              }
                            }
                          }
                        }
                      } catch {
                      }
                      creationDateCache.set(workdir, repoCreationCache);
                      loadedWorkdirs.add(workdir);
                    }
                    created ||= creationDateCache.get(workdir)?.get(relativePath);
                    modified ||= await currentRepo.getFileLatestModifiedDateAsync(relativePath);
                  } catch {
                    console.log(
                      styleText(
                        "yellow",
                        `
Warning: ${data.filePath} isn't yet tracked by git, dates will be inaccurate`
                      )
                    );
                  }
                }
              }
            }
            data.dates = {
              created: coerceDate(fp, created),
              modified: coerceDate(fp, modified),
              published: coerceDate(fp, published)
            };
            data.defaultDateType = opts.defaultDateType;
          };
        }
      ];
    }
  };
};

export { CreatedModifiedDate };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map