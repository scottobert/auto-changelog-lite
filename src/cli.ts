#!/usr/bin/env node
import { generateChangelog } from './index';

async function main() {
    const args = process.argv.slice(2);
    const useAI = args.includes('--summarize') || args.includes('-s');
    try {
        const changelog = await generateChangelog(useAI);
        console.log(changelog);
    } catch (err) {
        console.error('Error generating changelog:', err instanceof Error ? err.message : err);
        process.exit(1);
    }
}

main();
