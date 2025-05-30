import { execSync } from 'child_process';
import { Summarizer } from './ai/summarizer';
import { Config, ConventionalCommitsConfig } from './config'; // Updated import
import { simpleGit, SimpleGitOptions, DefaultLogFields, LogResult } from 'simple-git'; // Added simple-git
import { sync as conventionalCommitsParserSync, Commit } from 'conventional-commits-parser'; // Added parser

// Default conventional commit type titles
const defaultTypeTitles: Record<string, string> = {
    feat: '✨ New Features',
    fix: '🐛 Bug Fixes',
    perf: '⚡ Performance Improvements',
    docs: '📚 Documentation',
    style: '💅 Styles',
    refactor: '♻️ Code Refactoring',
    test: '✅ Tests',
    build: '📦 Build System',
    ci: '🤖 Continuous Integration',
    chore: '🧹 Chores',
    revert: '⏪ Reverts',
    other: ' miscellaneous' // For non-conventional or uncategorized
};

// If using TypeScript, ensure 'es2015' or later is included in tsconfig.json lib
export async function generateChangelog(config: Config = {}): Promise<string> {
    const useAI = !!config.summarize;
    // Ensure conventionalCommits config exists and has a default for enabled
    const conventionalConfig = config.conventionalCommits || { enabled: false };

    let changelogContent: string;

    if (conventionalConfig.enabled) {
        const options: Partial<SimpleGitOptions> = {
            baseDir: process.cwd(),
            binary: 'git',
            maxConcurrentProcesses: 6,
        };
        const git = simpleGit(options);

        // Using simple-git to get structured log data
        // We need body (%B) and hash (%H) for conventional commit parsing and output.
        // The format object maps placeholders to keys in the resulting commit objects.
        const log: LogResult<DefaultLogFields | { body: string, hash: string, rawBody: string }> = await git.log({
            format: {
                hash: '%H',
                date: '%ai', // author date, ISO 8601 format
                message: '%s', // subject
                body: '%b', // body
                rawBody: '%B' // raw body (subject + body)
            }
        });
        
        const parsedCommits = log.all.map(commitInfo => {
            try {
                // Parse the raw body which includes subject and body
                const parsed = conventionalCommitsParserSync(commitInfo.rawBody);
                return { ...parsed, hash: commitInfo.hash.substring(0, 7) }; // Use short hash
            } catch (e) {
                // Handle commits that don't follow the spec
                return { 
                    type: 'chore', // Default to 'chore' or a special type like 'other'
                    scope: null, 
                    subject: commitInfo.message, // Use the subject from git log
                    header: commitInfo.message, 
                    body: commitInfo.body, 
                    footer: null, 
                    notes: [], 
                    references: [], 
                    mentions: [], 
                    revert: null, 
                    hash: commitInfo.hash.substring(0, 7),
                    nonConventional: true 
                };
            }
        });

        const groupedCommits: Record<string, (Commit & { hash: string; nonConventional?: boolean })[]> = {};
        parsedCommits.forEach(commit => {
            const typeKey = (commit.type ? commit.type.toLowerCase() : (commit.nonConventional ? 'other' : 'chore'));
            if (!groupedCommits[typeKey]) {
                groupedCommits[typeKey] = [];
            }
            groupedCommits[typeKey].push(commit);
        });

        let outputLines: string[] = [];
        const includeTypes = conventionalConfig.types && conventionalConfig.types.length > 0 
                             ? conventionalConfig.types.map(t => t.toLowerCase()) 
                             : Object.keys(defaultTypeTitles); // Default to all known types if not specified

        for (const type of Object.keys(defaultTypeTitles)) {
            if (includeTypes.includes(type) && groupedCommits[type] && groupedCommits[type].length > 0) {
                outputLines.push(`## ${defaultTypeTitles[type]}\n`);
                groupedCommits[type].forEach(commit => {
                    let commitLine = `- `;
                    if (commit.scope) {
                        commitLine += `**${commit.scope}:** `;
                    }
                    // Use commit.subject if available (it's usually the first line of the message)
                    // For non-conventional commits, subject might be the best representation.
                    const displaySubject = commit.subject || (commit.header ? commit.header.substring(commit.header.indexOf(':') + 1).trim() : '');
                    commitLine += `${displaySubject} (${commit.hash})`;
                    outputLines.push(commitLine);
                });
                outputLines.push(''); // Add a blank line after the section
            }
        }
        // Handle 'other' commits specifically if they were not part of defaultTypeTitles initially
        if (includeTypes.includes('other') && groupedCommits['other'] && groupedCommits['other'].length > 0) {
            if (!defaultTypeTitles['other']) outputLines.push(`## Other Changes\n`);
            else outputLines.push(`## ${defaultTypeTitles['other']}\n`);
            groupedCommits['other'].forEach(commit => {
                 let commitLine = `- ${commit.subject || commit.header} (${commit.hash})`; // Simpler format for 'other'
                outputLines.push(commitLine);
            });
            outputLines.push('');
        }

        changelogContent = outputLines.join('\n').trim();

    } else {
        // Original logic for non-conventional commits
        const commitHistory = execSync('git log --oneline').toString().trim();
        changelogContent = commitHistory.split('\n').map((commit: string) => {
            const [hash, ...messageParts] = commit.split(' ');
            const message = messageParts.join(' ');
            return `- ${message} (${hash})`;
        }).join('\n');
    }

    if (useAI) {
        const summarizer = new Summarizer(config.openAiApiKey, config.customPrompt);
        return await summarizer.summarize(changelogContent);
    }

    return changelogContent;
}