<img alt="Version" src="https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000" />
<a href="https://github.com/scottobert/auto-changelog-lite#readme" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
</a>
<a href="https://github.com/scottobert/auto-changelog-lite/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
</a>
<a href="https://github.com/scottobert/auto-changelog-lite/blob/master/LICENSE" target="_blank">
    <img alt="License: GPL--2.0" src="https://img.shields.io/github/license/scottobert/scottobert/auto-changelog-lite" />
</a>

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=scottobert_auto-changelog-lite&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=scottobert_auto-changelog-lite)

[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=scottobert_auto-changelog-lite&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=scottobert_auto-changelog-lite)

[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=scottobert_auto-changelog-lite&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=scottobert_auto-changelog-lite)

[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=scottobert_auto-changelog-lite&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=scottobert_auto-changelog-lite)

# auto-changelog-lite

A lightweight npm package that generates concise changelogs from git commit history, with optional AI summarization.

## Installation

To install the package, run:

```
npm install auto-changelog-lite
```

## Usage

To generate a changelog, you can use the `generateChangelog` function from the package. Here’s a simple example:

```typescript
import { generateChangelog } from 'auto-changelog-lite';

const changelog = generateChangelog({ summarize: true });
console.log(changelog);
```

### Options

The `generateChangelog` function accepts an options object:

- `summarize`: A boolean indicating whether to use AI for summarization (default: false).

## CLI Usage

You can also use `auto-changelog-lite` as a command-line tool after installing it globally or as an npm script.

### Run via npx (no install required)

```powershell
npx auto-changelog-lite
```

### With AI summarization

```powershell
npx auto-changelog-lite --summarize
```

Or use the shorthand:

```powershell
npx auto-changelog-lite -s
```

> **Note:** To use AI summarization from the CLI, set the `OPENAI_API_KEY` environment variable in your shell before running the command.

### Global install

```powershell
npm install -g auto-changelog-lite
```

Then run:

```powershell
auto-changelog-lite [--summarize|-s]
```

## AI Summarization

The package includes an AI summarization feature that condenses the changelog into a concise summary using OpenAI's API. To enable this, set the `summarize` option to `true` when calling `generateChangelog`.

**Environment Variable Required:**

To use AI summarization, you must set the `OPENAI_API_KEY` environment variable with your OpenAI API key. If this variable is not set, an error will be thrown when summarization is requested.

Example (Unix/macOS):

```sh
export OPENAI_API_KEY=your_openai_api_key
```

Example (Windows PowerShell):

```powershell
$env:OPENAI_API_KEY="your_openai_api_key"
```

The summarization logic is handled by the `Summarizer` class in `src/ai/summarizer.ts`.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.