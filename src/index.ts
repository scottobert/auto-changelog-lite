import { execSync } from 'child_process';
import { Summarizer } from './ai/summarizer.js';
import { Config } from './config.js';
import { simpleGit, SimpleGitOptions, LogResult } from 'simple-git';
import { sync as conventionalCommitsParserSync, Commit } from 'conventional-commits-parser';

// Define a specific type for the commit fields we expect from simple-git
interface CustomLogFields {
    hash: string;
    date: string;
    message: string; // Subject
    body: string;    // Body without subject
    rawBody: string; // Full raw commit message (subject + body)
    author_name: string;
    author_email: string;
    refs: string;
}

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
    const conventionalConfig = config.conventionalCommits || { enabled: false, types: [] };

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
        // All fields defined in CustomLogFields must be included here.
        const logFormat: { [key in keyof CustomLogFields]: string } = {
            hash: '%H',
            date: '%ai',
            message: '%s', // Subject
            body: '%b',    // Body alone
            rawBody: '%B', // Full raw message
            author_name: '%an',
            author_email: '%ae',
            refs: '%D'
        };

        const log: LogResult<CustomLogFields> = await git.log(logFormat);

        // Define a structure for what we store after parsing or fallback
        interface HandledCommit {
            details: Commit; // The object from conventionalCommitsParserSync or our fallback
            hash: string;
            nonConventional: boolean;
        }

        const handledCommits: HandledCommit[] = log.all.map((commitInfo: CustomLogFields) => {
            const shortHash = commitInfo.hash.substring(0, 7);
            try {
                const parsed: Commit = conventionalCommitsParserSync(commitInfo.rawBody);
                // Ensure 'mentions' is always an array. Parser might return it as undefined.
                // Also ensure notes and references are arrays if the parser might omit them.
                // const parsed: Commit = conventionalCommitsParserSync(commitInfo.rawBody); // Duplicate removed
                return {
                    details: {
                        ...parsed, // 'parsed' is already declared above in this scope
                        // Explicitly cast potentially problematic array fields to 'any'
                        // to bypass index signature conflicts if 'any' is being narrowed to 'string'.
                        mentions: (parsed.mentions || []) as any,
                        notes: (parsed.notes || []) as any,
                        references: (parsed.references || []) as any,
                    } as Commit, // Assert that the resulting object is a Commit
                    hash: shortHash,
                    nonConventional: false
                };
            } catch (e) {
                // Fallback for non-conventional commits
                const fallbackCommit = { // Let TypeScript infer this object's type initially
                    type: 'chore',
                    scope: null,
                    subject: commitInfo.message,
                    header: commitInfo.message,
                    body: commitInfo.body,
                    footer: null,
                    notes: [] as any, // Cast to any
                    references: [] as any, // Cast to any
                    mentions: [] as any, // Cast to any
                    revert: null,
                    merge: null,
                };
                // Then assert it as Commit for the 'details' field.
                return { details: fallbackCommit as Commit, hash: shortHash, nonConventional: true };
            }
        });

        const groupedCommits: Record<string, HandledCommit[]> = {};
        handledCommits.forEach(handledEntry => {
            const commitDetails = handledEntry.details;
            const typeKey = (commitDetails.type ? commitDetails.type.toLowerCase() : (handledEntry.nonConventional ? 'other' : 'chore'));
            if (!groupedCommits[typeKey]) {
                groupedCommits[typeKey] = [];
            }
            groupedCommits[typeKey].push(handledEntry);
        });

        let outputLines: string[] = [];
        const includeTypes = conventionalConfig.types && conventionalConfig.types.length > 0
                             ? conventionalConfig.types.map(t => t.toLowerCase())
                             : Object.keys(defaultTypeTitles);

        for (const type of Object.keys(defaultTypeTitles)) {
            if (includeTypes.includes(type) && groupedCommits[type] && groupedCommits[type].length > 0) {
                outputLines.push(`## ${defaultTypeTitles[type]}\n`);
                groupedCommits[type].forEach(handledEntry => {
                    const commitDetails = handledEntry.details;
                    let commitLine = `- `;
                    if (commitDetails.scope) {
                        commitLine += `**${commitDetails.scope}:** `;
                    }
                    const displaySubject = commitDetails.subject || (commitDetails.header ? commitDetails.header.substring(commitDetails.header.indexOf(':') + 1).trim() : 'No subject');
                    commitLine += `${displaySubject} (${handledEntry.hash})`;
                    outputLines.push(commitLine);
                });
                outputLines.push('');
            }
        }

        if (includeTypes.includes('other') && groupedCommits['other'] && groupedCommits['other'].length > 0) {
            const otherTitle = defaultTypeTitles['other'] || 'Other Changes';
            if (!outputLines.some(line => line.startsWith(`## ${otherTitle}`))) { // Avoid duplicate "Other Changes" section
                 outputLines.push(`## ${otherTitle}\n`);
            }
            groupedCommits['other'].forEach(handledEntry => {
                 const commitDetails = handledEntry.details;
                 const displaySubject = commitDetails.subject || (commitDetails.header ? commitDetails.header.substring(commitDetails.header.indexOf(':') + 1).trim() : 'No subject');
                 let commitLine = `- ${displaySubject} (${handledEntry.hash})`;
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