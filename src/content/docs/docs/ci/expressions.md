---
title: Expressions and contexts
description: The ${{ }} expression language, its operators, functions and contexts.
banner:
  content: "Preview: hatchrun CI is not available yet. This page documents the configuration format."
---

hatchrun CI uses GitHub's expression language. An expression sits
between `${{` and `}}` inside any string of a step or job:

```yaml title=".hatchrun/config.yml"
jobs:
  build:
    runs-on: ubuntu-latest
    env:
      IS_MAIN: ${{ github.ref == 'refs/heads/main' }}
    steps:
      - run: echo "building ${{ github.sha }} for ${{ github.actor }}"
      - name: Upload logs
        if: failure()
        run: ./upload-logs.sh
```

`if:` takes a bare expression or one wrapped in `${{ }}`. Expressions
run when the job runs, except `${{ parameters.NAME }}`, which is
replaced when the run is planned. See
[Reading parameters](/docs/ci/configuration/#reading-parameters).

`hatchrun validate` checks that each expression parses, calls known
functions with the right number of arguments and reads known contexts.
It cannot check values that only exist at run time.

## Literals

| Type | Examples |
| --- | --- |
| null | `null` |
| boolean | `true`, `false` |
| number | `42`, `-1.5`, `2e3`, `0xff` |
| string | `'hello'`, `'it''s'` (two quotes stand for one) |

Strings use single quotes only.

## Operators

From lowest to highest precedence:

| Operator | Meaning |
| --- | --- |
| `\|\|` | Or: the first truthy operand, else the last one |
| `&&` | And: the first falsy operand, else the last one |
| `==`, `!=` | Loose equality |
| `<`, `<=`, `>`, `>=` | Comparison |
| `!` | Not |
| `.name`, `[expr]`, `.*`, `[*]` | Property, index, and every item |
| `( )` | Grouping |

`null`, `false`, `0`, `NaN` and the empty string are falsy. Everything
else is truthy, empty lists and maps included.

Reading a property that does not exist gives `null`. `.*` and `[*]`
take every item of a list or every value of a map, so
`github.event.commits.*.message` is the list of every pushed commit's
message.

### Loose equality

- Two strings compare without regard to case: `'Main' == 'main'` is
  true.
- Two values of other matching types compare directly. Lists and maps
  are never equal, even to themselves.
- Values of different types are both converted to numbers first:
  `null` is 0, `false` 0, `true` 1, a string is parsed (the empty
  string is 0), and a list or map is `NaN`. `NaN` equals nothing.

`<`, `<=`, `>` and `>=` order two strings without regard to case and
everything else as numbers.

## Functions

Function names ignore case: `startsWith` and `startswith` are the
same function.

| Function | Returns |
| --- | --- |
| `contains(search, item)` | For a list, whether an item loosely equals `item`. Otherwise whether the text of `search` holds the text of `item`, ignoring case |
| `startsWith(text, prefix)` | Whether `text` starts with `prefix`, ignoring case |
| `endsWith(text, suffix)` | Whether `text` ends with `suffix`, ignoring case |
| `format(fmt, args...)` | `fmt` with `{0}`, `{1}` and so on replaced by the arguments. `{{` and `}}` are literal braces |
| `join(list, sep)` | The items as text with `sep` between them. `sep` defaults to `,` |
| `toJSON(value)` | The value as indented JSON |
| `fromJSON(text)` | The value the JSON text holds |
| `hashFiles(patterns...)` | A hash of the files matching the patterns, on the runner |
| `success()` | Whether every earlier step or job succeeded |
| `failure()` | Whether an earlier step or job failed |
| `cancelled()` | Whether the run was cancelled |
| `always()` | Always true |

As text, `null` is the empty string, booleans are `true` and `false`,
whole numbers have no decimal point, a list is `Array` and a map is
`Object`.

### Status functions in if

A job or step whose `if:` calls none of `success()`, `failure()`,
`cancelled()` and `always()` runs only while everything before it has
succeeded, as if the condition were `success() && (...)`. Call
`always()` or `failure()` to run after a failure:

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

## Contexts

| Context | Holds |
| --- | --- |
| `github` | The event and the run: `github.sha`, `github.ref`, `github.event_name`, `github.event` and the rest of GitHub's `github` context |
| `env` | Environment variables set by the job and step `env` |
| `vars` | Organization and repository variables |
| `secrets` | Organization and repository secrets |
| `inputs` | The `workflow_dispatch` inputs of a manual run |
| `matrix` | This job's matrix values |
| `needs` | Outputs of the jobs this job requires, as `needs.ID.outputs.NAME` |
| `steps` | Outputs of earlier steps that have an `id`, as `steps.ID.outputs.NAME` |
| `runner` | The machine the job runs on |
| `job` | The current job |
| `parameters` | Job and command parameters, replaced when the run is planned, never at run time |

Context names ignore case. A name not in this table is an error,
including GitHub's `strategy` and `jobs` contexts, which hatchrun does
not provide.

## Limits

| Limit | Value |
| --- | --- |
| Length of one expression | 4,096 bytes |
| Nesting of brackets, parentheses, calls and `!` | 64 levels |
| Longest string an expression makes | 1 MiB |
| Memory one expression or one interpolated string may use | 8 MiB |

An expression past a limit fails with a message naming the limit.
