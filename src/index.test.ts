import * as index from './index';

jest.mock('child_process', () => ({
  execSync: jest.fn(() => Buffer.from('abc123 Initial commit\ndef456 Add feature')),
}));

jest.mock('./ai/summarizer', () => ({
  Summarizer: jest.fn().mockImplementation(() => ({
    summarize: (changelog: string) => `AI Summary: ${changelog}`,
  })),
}));

describe('generateChangelog', () => {
  it('generates a changelog from git history', async () => {
    const changelog = await index.generateChangelog(false);
    expect(changelog).toContain('- Initial commit (abc123)');
    expect(changelog).toContain('- Add feature (def456)');
  });

  it('summarizes changelog with AI when useAI is true', async () => {
    const changelog = await index.generateChangelog(true);
    expect(changelog.startsWith('AI Summary:')).toBe(true);
  });
});