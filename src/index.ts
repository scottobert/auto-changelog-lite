import { execSync } from 'child_process';
import { Summarizer } from './ai/summarizer';

// If using TypeScript, ensure 'es2015' or later is included in tsconfig.json lib
export async function generateChangelog(options: { summarize?: boolean } | boolean = false): Promise<string> {
    let useAI: boolean;
    if (typeof options === 'boolean') {
        useAI = options;
    } else {
        useAI = !!options.summarize;
    }

    // Retrieve git commit history
    const commitHistory = execSync('git log --oneline').toString().trim();
    
    // Format the changelog
    const changelog = commitHistory.split('\n').map((commit: string) => {
        const [hash, ...messageParts] = commit.split(' ');
        const message = messageParts.join(' ');
        return `- ${message} (${hash})`;
    }).join('\n');

    // Optionally summarize the changelog using AI
    if (useAI) {
        const summarizer = new Summarizer();
        return await summarizer.summarize(changelog);
    }

    return changelog;
}