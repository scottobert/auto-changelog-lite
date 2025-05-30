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

The `generateChangelog` function accepts a configuration object (see the "Configuration File" section below for all available options). A primary option is:

- `summarize`: A boolean indicating whether to use AI for summarization. This can be set directly in the options object, or through the configuration file.

Many other aspects of the tool, such as Conventional Commits processing and AI prompt customization, are controlled via the configuration object, typically loaded from `changelog-lite.config.json`.

## CLI Usage

You can also use `auto-changelog-lite` as a command-line tool after installing it globally or as an npm script.
For more advanced configurations (like enabling Conventional Commits or setting a custom AI prompt), please use a `changelog-lite.config.json` file as described in the "Configuration File" section.

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

> **Note:** To use AI summarization from the CLI, ensure your OpenAI API key is set either via the `OPENAI_API_KEY` environment variable or in the `changelog-lite.config.json` file. The CLI argument `--summarize` (or `-s`) will enable summarization, using the configured API key and prompt.

### Global install

```powershell
npm install -g auto-changelog-lite
```

Then run:

```powershell
auto-changelog-lite [--summarize|-s]
```

## AI Summarization

The package includes an AI summarization feature that condenses the changelog into a concise summary using OpenAI's API. To enable this, set the `summarize` option to `true` when calling `generateChangelog` or set it in the configuration file.

**API Key Configuration:**

To use AI summarization, you must provide an OpenAI API key. This can be done in one of the following ways (listed in order of precedence):
1.  Set the `OPENAI_API_KEY` environment variable with your OpenAI API key.
2.  Provide it in the `changelog-lite.config.json` file using the `openAiApiKey` field.

If an API key is not found through any of these methods, an error will be thrown when summarization is requested.

Example (Unix/macOS):

```sh
export OPENAI_API_KEY=your_openai_api_key
```

Example (Windows PowerShell):

```powershell
$env:OPENAI_API_KEY="your_openai_api_key"
```

The summarization logic is handled by the `Summarizer` class in `src/ai/summarizer.ts`. You can also customize the prompt used for summarization via the configuration file (see below).

## Configuration File

`auto-changelog-lite` can be configured using a `changelog-lite.config.json` file in the root directory of your project. This allows for more detailed control over its behavior.

**Example `changelog-lite.config.json`:**

```json
{
  "summarize": true,
  "openAiApiKey": "your_openai_api_key_from_config",
  "customPrompt": "Please provide a very brief summary of the following changes, highlighting new features and critical fixes:",
  "conventionalCommits": {
    "enabled": true,
    "types": ["feat", "fix", "perf"]
  }
}
```

**Configuration Options:**

*   `summarize` (boolean, optional): Enables or disables AI summarization. Defaults to `false`.
*   `openAiApiKey` (string, optional): Your OpenAI API key. If provided, this key will be used unless the `OPENAI_API_KEY` environment variable is set (the environment variable takes precedence).
*   `customPrompt` (string, optional): A custom instruction prompt to guide the AI summarization process. If not provided, a default prompt is used. This allows you to tailor the tone and focus of the AI-generated summary.
    *   *Example*: `"Summarize these changes for a non-technical audience."`
*   `conventionalCommits` (object, optional): Configuration for Conventional Commits processing.
    *   `enabled` (boolean, optional): Set to `true` to enable Conventional Commits formatting. Defaults to `false`.
    *   `types` (array of strings, optional): An array of commit types (e.g., `"feat"`, `"fix"`, `"perf"`) to include in the changelog. If empty or undefined, all standard Conventional Commit types that have corresponding sections (Features, Bug Fixes, etc.) will be included.

**Order of Precedence for Settings:**

Settings are resolved in the following order of precedence (highest to lowest):

1.  **Command-line arguments:** (e.g., `--summarize`, `--openai-api-key=KEY_FROM_CLI`).
2.  **Environment Variables:** Currently, `OPENAI_API_KEY` for the API key.
3.  **Configuration File:** Values from `changelog-lite.config.json`.
4.  **Default Values:** Built-in defaults in the application.

For example, if `summarize` is `true` in the config file but `--summarize false` (assuming such an argument existed for disabling) is passed via CLI, summarization would be disabled. Similarly, `OPENAI_API_KEY` from the environment will always override `openAiApiKey` from the config file. The `--openai-api-key` CLI argument (if implemented for setting the key) would override both.

## Conventional Commits Support

`auto-changelog-lite` now supports [Conventional Commits](https://www.conventionalcommits.org/). When enabled, the changelog will be structured according to commit types (e.g., Features, Bug Fixes).

**Enabling Conventional Commits:**

To enable this feature, set `conventionalCommits.enabled` to `true` in your `changelog-lite.config.json` file:

```json
{
  "conventionalCommits": {
    "enabled": true
  }
}
```

**Output Changes:**

With Conventional Commits enabled, the changelog output will be grouped by commit type, for example:

```markdown
## ✨ New Features

- **api:** Implemented user authentication endpoint (abcdef1)
- Added dark mode toggle (bcdef23)

## 🐛 Bug Fixes

- **ui:** Corrected button alignment on the main page (cdef345)
- Fixed data parsing issue for edge cases (def4567)
```

**Filtering by Commit Types:**

You can specify which commit types to include in the changelog using the `conventionalCommits.types` array in your configuration file.

```json
{
  "conventionalCommits": {
    "enabled": true,
    "types": ["feat", "perf"]
  }
}
```
This configuration would only include "New Features" (from `feat` type) and "Performance Improvements" (from `perf` type) sections in the changelog. If `types` is omitted or empty, all recognized commit types that have a dedicated section title will be included. Non-conventional commits or those not matching a specific type handler might be grouped under "Miscellaneous" or similar, or handled according to the parser's defaults.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.