# Agent Instructions: Created-Modified-Date Plugin

## Plugin Purpose

This plugin is responsible for resolving `created`, `modified`, and `published` dates for Quartz pages. It is a core transformer that populates the `dates` object in `file.data`.

## Key Files

- `src/transformer.ts`: Contains the main logic and date resolution strategies.
- `test/created-modified-date.test.ts`: Unit tests for date extraction.

## Development Guidelines

### Date Logic

- When adding new sources, ensure they respect the user-defined `priority` order.
- Always use `coerceDate` to process raw date strings or timestamps.
- Be careful with timezone differences; `YYYY-MM-DD` strings are treated as local midnight to align with user expectations.

### Performance

- Git operations are expensive. Always use the caching mechanisms (`repoCache`, `creationDateCache`) when extending git-related logic.
- Prefer asynchronous methods (e.g., `getFileLatestModifiedDateAsync`) where possible.

### Testing

- Always verify changes with `npm run test`.
- When adding a feature, add a corresponding test case to `test/created-modified-date.test.ts`.
- Mock filesystem or git state if necessary to keep tests deterministic.

## Common Tasks

- **Adding a new date field**: Update the `FrontmatterDates` type and the resolution loop in `markdownPlugins`.
- **Modifying Git logic**: Check `@napi-rs/simple-git` documentation for available repository methods.
