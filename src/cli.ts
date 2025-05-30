#!/usr/bin/env node
import { generateChangelog } from './index';
import * as fs from 'fs';
import * as path from 'path';
import { Config } from './config';

async function main() {
    const args = process.argv.slice(2);
    let config: Config = {
        // Default for conventionalCommits
        conventionalCommits: {
            enabled: false,
            types: [] // Empty array means all types by default in generateChangelog
        }
    };

    // Load config file
    const configPath = path.join(process.cwd(), 'changelog-lite.config.json');
    if (fs.existsSync(configPath)) {
        try {
            const configFile = fs.readFileSync(configPath, 'utf-8');
            const loadedConfig = JSON.parse(configFile) as Config;
            // Merge loaded config with defaults, ensuring conventionalCommits object and its properties are handled
            config = {
                ...config,
                ...loadedConfig,
                conventionalCommits: {
                    ...config.conventionalCommits, // Start with defaults
                    ...(loadedConfig.conventionalCommits || {}) // Override with loaded if present
                }
            };
        } catch (err) {
            console.error('Error reading or parsing changelog-lite.config.json:', err instanceof Error ? err.message : err);
            process.exit(1);
        }
    }

    // Override config with command-line arguments
    // Note: customPrompt and conventionalCommits settings are not currently overridable by command-line arguments.
    if (args.includes('--summarize') || args.includes('-s')) {
        config.summarize = true;
    }

    // Extract API key from command-line arguments if provided (e.g. --openai-api-key=YOUR_KEY)
    // This will override the apiKey from the config file or environment variable if present.
    const apiKeyArg = args.find(arg => arg.startsWith('--openai-api-key='));
    if (apiKeyArg) {
        config.openAiApiKey = apiKeyArg.split('=')[1];
    }
    // The generateChangelog function and Summarizer will handle the precedence for openAiApiKey.

    try {
        const changelog = await generateChangelog(config);
        console.log(changelog);
    } catch (err) {
        console.error('Error generating changelog:', err instanceof Error ? err.message : err);
        process.exit(1);
    }
}

main();
