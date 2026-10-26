---
title: Expressions and functions
description: The ${{ }} expression language of hatchrun CI, its literals, operators, comparison rules and functions.
banner:
  content: "Preview: hatchrun CI is not available yet. These pages document the configuration format and the planned service."
---

hatchrun CI uses GitHub's expression language. Expressions read
[contexts](/docs/ci/reference/contexts/), compare values and call
functions.

## Syntax

An expression sits between `${{` and `}}` inside a string. A string
can hold several:

```yaml title=".hatchrun/config.yml"
jobs:
  build:
    runs-on: ubuntu-latest
    env:
      LABEL: ${{ github.ref_name }}-${{ github.run_number }}
    steps:
      - run: echo "building ${{ github.sha }}"
      - if: failure()
        run: ./collect-logs.sh
```

`if:` takes a bare expression, or one wrapped in `${{ }}`.

## When expressions run

`${{ parameters.NAME }}` is replaced when hatchrun plans the run. A
job's `if` is evaluated by hatchrun when the jobs it requires have
finished, before any machine starts. Every other expression is
evaluated on the machine, when its step runs.

`hatchrun validate` checks that each expression parses, calls known
functions with the right number of arguments, and reads known
contexts. It cannot check values that exist only at run time.

## Literals

| Type | Examples | Notes |
| --- | --- | --- |
| null | `null` | |
| boolean | `true`, `false` | |
| number | `42`, `-1.5`, `2e3`, `0xff` | Decimal, exponent or hex |
| string | `'hello'`, `'it''s'` | Single quotes only; `''` is one quote |

## Operators

From lowest precedence to highest:

| Operator | Meaning |
| --- | --- |
| `\|\|` | The first truthy operand, else the last one |
| `&&` | The first falsy operand, else the last one |
| `==`, `!=` | Loose equality |
| `<`, `<=`, `>`, `>=` | Comparison |
| `!` | Not |
| `.name`, `[expr]` | Property and index |
| `.*`, `[*]` | Every item of a list, or every value of a map |
| `( )` | Grouping |

Reading a property that does not exist gives `null`.

`github.event.commits.*.message` is the list of every pushed commit's
message.

### Truthiness

`null`, `false`, `0`, `NaN` and the empty string are falsy. Everything
else is truthy, including empty lists and maps.

### Equality

- Strings compare without regard to case. `'Main' == 'main'` is true.
- Other values of the same type compare directly. Lists and maps are
  never equal, even to themselves. GitHub treats the same list or map
  as equal to itself, and hatchrun does not.
- Values of different types become numbers first. `null` is 0, `false`
  is 0, `true` is 1, a string is parsed and the empty string is 0, a
  list or map is `NaN`. `NaN` equals nothing.

`<`, `<=`, `>` and `>=` order two strings without regard to case, and
everything else as numbers.

### Values as text

When an expression becomes part of a string, `null` is the empty
string, booleans are `true` and `false`, whole numbers have no decimal
point, a list is `Array` and a map is `Object`. Use `toJSON` to print a
list or map.

## Functions

Function names ignore case. `startsWith` and `startswith` are one
function.

| Function | Returns |
| --- | --- |
| `contains(search, item)` | For a list, whether an item loosely equals `item`. Otherwise whether the text of `search` holds the text of `item`, ignoring case |
| `startsWith(text, prefix)` | Whether `text` starts with `prefix`, ignoring case |
| `endsWith(text, suffix)` | Whether `text` ends with `suffix`, ignoring case |
| `format(fmt, args...)` | `fmt` with `{0}`, `{1}` and so on replaced by the arguments; `{{` and `}}` are literal braces |
| `join(list, sep)` | The items as text with `sep` between them; `sep` defaults to `,` |
| `toJSON(value)` | The value as indented JSON |
| `fromJSON(text)` | The value the JSON text holds |
| `hashFiles(patterns...)` | A hash of the files matching the patterns, on the machine |
| `success()` | Whether everything before has succeeded |
| `failure()` | Whether something before has failed |
| `cancelled()` | Whether the run was cancelled |
| `always()` | Always true |

Examples:

```yaml title=".hatchrun/config.yml"
jobs:
  examples:
    runs-on: ubuntu-latest
    steps:
      - if: contains(github.event.head_commit.message, '[skip tests]')
        run: echo "skipping"
      - if: startsWith(github.ref, 'refs/tags/v')
        run: ./release.sh
      - run: echo ${{ format('{0}-{1}', github.ref_name, github.sha) }}
      - run: echo '${{ toJSON(github.event.pull_request.labels.*.name) }}'
      - if: ${{ fromJSON(vars.DEPLOY_ENABLED) }}
        run: ./deploy.sh
```

## Status functions

A job or step whose `if:` calls none of `success()`, `failure()`,
`cancelled()` and `always()` runs only while everything before it has
succeeded, as if its condition were `success() && (...)`.

| `if:` | Runs when |
| --- | --- |
| none | Everything before succeeded |
| `github.ref == 'refs/heads/main'` | Everything before succeeded and the ref is `main` |
| `failure()` | Something before failed |
| `always()` | Always, even after a failure or a cancel |
| `!cancelled()` | Always, except after a cancel |

```yaml title=".hatchrun/config.yml"
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: make test
      - if: failure()
        run: ./collect-logs.sh
      - if: always()
        run: ./cleanup.sh
```

## Limits

| Limit | Value |
| --- | --- |
| Length of one expression | 4,096 bytes |
| Nesting of brackets, parentheses, calls and `!` | 64 levels |
| Longest string one expression makes | 1 MiB |
| Memory for one expression, or one string with several | 8 MiB |

`validate` checks length and nesting. The other two apply when the
step runs, and a step that goes past them fails.
