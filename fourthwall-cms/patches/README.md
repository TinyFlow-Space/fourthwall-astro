# Patches

Applied automatically after `npm install` by `patch-package` (see the
`postinstall` script in `package.json`).

## `sanity@6.21.0` — nested page-builder blocks in Presentation

**File:** `lib/PostMessageSchema-*.js` (`_temp`, the per-path type query)

To find each canvas element's block type, Presentation queries
`<path>[0]._type`. For a nested path such as
`pageBuilder[_key=="a"].content[_key=="b"]`, GROQ returns an array after the
first key filter, so the query yields `["grid"]` instead of `"grid"`, the
Studio discards it, and nested blocks get no overlay (no click, drag or
right-click menu). The patch inserts `[0]` after every `[_key==…]` filter
except the last.

Same fix as patch A in https://github.com/flowtricks/remarkable/tree/main/patches.
Remove it once Sanity resolves nested paths upstream; regenerate it with
`npx patch-package sanity` if the `sanity` version changes.
