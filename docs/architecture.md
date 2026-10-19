# Architecture

## Flow

```
pasted source
  -> parseMessage      MIME parsing with postal-mime, header unfolding, addresses, auth results, Received chain
  -> HtmlExtractor     links, forms, hidden text, tracking pixels (DOMParser in the browser, cheerio in Node)
  -> DnsResolver       optional; /api/dns in the browser, node:dns in Node
  -> rules             each rule is independent and returns Finding[]
  -> score             layer caps, repeat discount, multi-layer bonus
  -> Report            plain JSON used by the site, the CLI and the tests
```

The engine itself doesn't know where it runs. The two environment-specific pieces, the HTML extractor and the DNS resolver, are interfaces passed in by the entry points:

- `@kanca/engine/browser`: DOMParser + HttpDnsResolver
- `@kanca/engine/node`: cheerio + NodeDnsResolver

So the exact same rules run in the browser, in tests and in the CLI.

## Rules

A rule is a `RuleMeta` (code, layer, severity, weight, title, why) plus a `run(ctx)` function. Titles, explanations and finding details are stored in both English and Turkish, so the report can switch language without running the analysis again. If a rule throws, the analysis keeps going and the finding is marked as failed; a test makes sure this never happens with the samples.

Code prefixes match the layer: `H` headers, `D` DNS, `N` domain, `L` links, `A` attachments, `C` content.

## Scoring

1. A triggered rule adds its weight. Repeats of the same rule add 25% of the weight each.
2. Layer caps: headers 45, DNS 25, domain 35, links 45, attachments 40, content 30.
3. +5 if at least three layers have findings.
4. Capped at 100. 25 and up is suspicious, 55 and up is high risk.

The caps are there so that one kind of weak signal, like text patterns alone, can't carry an email to high risk.

## Brand matching

`domain.ts` has a list of commonly impersonated brands: Turkish banks and couriers, large European and US banks, global couriers, big tech, a few tax offices. A domain is checked in three steps:

1. If it is an official domain or a subdomain of one, it is skipped.
2. After homoglyph normalization (0 to o, rn to m, Cyrillic look-alikes) the label is compared to the brand keywords. Equal or a small Levenshtein distance means "lookalike".
3. If the label contains a brand keyword, like paypal-security, it is "contains".

The registrable domain comes from `tldts`, so the owner of `login.paypal.com.verify-now.xyz` is correctly found as `verify-now.xyz`.

## Privacy

- Offline is the default. No network request is made.
- With the DNS check on, only the registrable domain of the sender goes to the server. The API rate-limits by IP and keeps no logs of the lookups.
- The last result lives in the tab's `sessionStorage` and disappears when the tab is closed. There is no sharing link and no export.

## Not done yet

- Links are not followed, so shortener targets are unknown.
- Attachments are not opened.
- Domain age and blocklists are not checked. These could come later as opt-in layers.
