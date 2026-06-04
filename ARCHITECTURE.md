# Architecture: Created-Modified-Date Plugin

This plugin extracts creation and modification dates for each file from three possible sources: frontmatter, git history, and filesystem metadata.

## Core Components

### 1. Transformer Plugin (`src/transformer.ts`)
The main entry point implements the `QuartzTransformerPlugin` interface. It provides a Remark plugin via the `markdownPlugins` hook.

### 2. Date Coercion (`coerceDate`)
A utility function that normalizes various date formats (ISO8601, timestamps, Date objects) into standard JavaScript `Date` objects. It handles UTC vs. local time nuances for YYYY-MM-DD strings.

### 3. Source Resolvers
The plugin iterates through the `priority` list defined in options:
- **Frontmatter**: Directly reads `created`, `modified`, and `published` fields from `file.data.frontmatter`.
- **Git**: Uses `@napi-rs/simple-git` to find the repository root and query commit history.
  - **Created Date**: Uses `git log --diff-filter=A` to find the first addition of the file.
  - **Modified Date**: Uses `getFileLatestModifiedDateAsync` for the most recent commit.
- **Filesystem**: Uses `fs.promises.stat` to get `birthtimeMs` and `mtimeMs`.

### 4. Caching Logic
To optimize performance during large site builds:
- `repoCache`: Caches `Repository` instances by directory.
- `creationDateCache`: Caches the entire git history (creation dates) for a repository to avoid repeated expensive `git log` calls.
- `loadedWorkdirs`: Tracks which repositories have already had their history indexed.

## Data Flow
1. Receive `VFile` in the Remark plugin.
2. Iterate sources according to `opts.priority`.
3. If a date is found for a specific source, it is assigned to `created`, `modified`, or `published` if not already set.
4. Coerce final values into `Date` objects.
5. Populate `file.data.dates` with the results.
