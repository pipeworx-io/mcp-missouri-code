# Missouri Revised Statutes by citation

Keyless. Example: `565.020`.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1856+ live data sources. This is an independent, unofficial integration — not affiliated with, endorsed by, or published by the upstream provider.

Answers HTTP 200 for a citation that does not exist, so the section number itself is confirmed in the returned text before the page is treated as a statute.

See `docs/state-law-probe.md` — every state pack confirms a MISS is
distinguishable from a HIT before shipping.

## Data source

Official state legislature site. Statutes are public record.

## Stored copy and `data_as_of` (fleet #3754)

The Revisor of Statutes' site refuses requests that leave from some data centres (58 "upstream down" against 17
successes from external callers over 14 days). A cache cannot help a first touch, so the Revised Statutes of Missouri
are stored, one JSON object per chapter, in the shared statute store (R2, `statutes/mo/`) that the Michigan, Ohio,
West Virginia and Wisconsin packs also use. The gateway hands the pack its R2 binding and the pack reads only the
object a call names. A section found there is answered with no upstream request; the response says
`served_from: "stored-copy"` and carries `data_as_of` (when that chapter was last read from the source) and
`effective` (the section's effective date). A section the copy cannot answer (chapter missing, object unreadable, or
listed with no stored text) falls back to the live read. Absence is never remembered.

Nothing is loaded at module scope: the data never enters the gateway bundle. The reader is
`shared/src/stored-statute.ts`, the same one the Montana pack uses.

## Refresh

```
MO_DATA_DIR=<dir> node mcps/missouri-code/scripts/bake-sections.mjs     # all chapters -> <dir>
MO_DATA_DIR=<dir> node mcps/missouri-code/scripts/bake-sections.mjs --only 565
MO_DATA_DIR=<dir> node mcps/missouri-code/scripts/upload-chapters.mjs   # publish to R2 (statutes/mo/), changed files only
```

The publisher offers no chapter-level text and no bulk file, so the refresh makes one request per chapter for its
section list and one per section. Sequential, a delay between requests, an honest user agent, bounded retries, a
stop on the first 429/403/451, raw pages kept so an interrupted run resumes. Exit 0 only if every listed section was
fetched and parsed and the totals clear the floors. The baked files are a working copy, not committed (`.bake/` is
gitignored).

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "missouri-code": {
      "url": "https://gateway.pipeworx.io/missouri-code/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/missouri-code/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1856+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/mo_revised_statute \
  -H 'Content-Type: application/json' \
  -d '{"section":"565.020"}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/mo_revised_statute`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.

## Run it from npm

`@pipeworx/mcp-missouri-code` is a local stdio bridge to the Pipeworx gateway: your MCP client
starts it with `npx`, and it forwards every call to the same
`https://gateway.pipeworx.io/missouri-code/mcp` endpoint shown above. It needs network access;
there is no offline mode.

```json
{
  "mcpServers": {
    "missouri-code": {
      "command": "npx",
      "args": ["-y", "@pipeworx/mcp-missouri-code"]
    }
  }
}
```

Without a key it calls anonymously, capped at 50 calls a day. A free account
raises that to 200 a day: get a key at https://pipeworx.io/signup and add
`"env": { "PIPEWORX_API_KEY": "<your key>" }` to the server entry.
The key is sent as a Bearer token, the same way a hosted connection sends it,
so calls are metered and billed exactly as they are there.

It lists **only** this pack's tools by default. Set `PIPEWORX_META_TOOLS=1` to
also list `ask_pipeworx` and the other gateway-wide tools.

Behind an HTTPS proxy: Node's built-in `fetch` does not read `HTTPS_PROXY` by
default. Newer Node releases honour it when `NODE_USE_ENV_PROXY=1` is set; check
your Node version's documentation.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Missouri Code data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
