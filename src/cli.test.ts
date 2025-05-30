import { Config } from './config';
// Import 'generateChangelog' to spy on it.
// The actual implementation will be mocked.
import { generateChangelog } from './index';

// Mock './index' to control generateChangelog behavior and spy on it
jest.mock('./index', () => ({
    generateChangelog: jest.fn().mockResolvedValue('Mocked Changelog Output'),
}));

// Mock 'fs' for config file reading
jest.mock('fs');
const mockFs = jest.requireMock('fs') as jest.Mocked<typeof fs>; // Use jest.requireMock for clarity with jest.mock above

describe('CLI Execution and Configuration Logic', () => {
    let consoleLogSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;
    let processExitSpy: jest.SpyInstance;
    let originalArgv: string[];
    let originalEnv: NodeJS.ProcessEnv;

    // Helper to run the CLI script
    const runCli = async (args: string[] = [], env: NodeJS.ProcessEnv = {}, configData: Partial<Config> | null = null, malformedConfig: boolean = false) => {
        // Set up environment variables
        process.env = { ...originalEnv, ...env };
        // Set up command line arguments
        process.argv = ['node', 'cli.js', ...args];

        // Set up fs mocks for config file
        if (configData !== null) {
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue(JSON.stringify(configData));
        } else if (malformedConfig) {
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue('{"summarize": true, malformed_json_syntax}');
        }
         else {
            mockFs.existsSync.mockReturnValue(false);
        }

        // Use jest.isolateModules to ensure cli.ts runs fresh
        await jest.isolateModulesAsync(async () => {
            // Dynamically require cli.ts to execute it
            // Its main() function will be called automatically as per its structure
            try {
                await import('./cli');
            } catch (e) {
                // Catch errors that might occur during cli execution (e.g. if generateChangelog rejects)
                // These are tested by checking console.error and process.exit spies
            }
        });
    };

    beforeEach(() => {
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as (code?: number) => never);

        originalArgv = [...process.argv];
        originalEnv = { ...process.env };
        
        (generateChangelog as jest.Mock).mockClear();
        mockFs.existsSync.mockReset();
        mockFs.readFileSync.mockReset();
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        processExitSpy.mockRestore();
        process.argv = originalArgv;
        process.env = originalEnv;
        jest.resetModules(); // Clean up modules cache
    });

    it('should load summarize:true from config file', async () => {
        await runCli([], {}, { summarize: true });
        expect(generateChangelog).toHaveBeenCalledWith(expect.objectContaining({ summarize: true }));
    });

    it('should load openAiApiKey from config file', async () => {
        await runCli([], {},{ openAiApiKey: 'config_api_key' });
        expect(generateChangelog).toHaveBeenCalledWith(expect.objectContaining({ openAiApiKey: 'config_api_key' }));
    });
    
    it('should load customPrompt from config file', async () => {
        await runCli([], {},{ customPrompt: 'Test Prompt' });
        expect(generateChangelog).toHaveBeenCalledWith(expect.objectContaining({ customPrompt: 'Test Prompt' }));
    });

    it('should load conventionalCommits.enabled:true from config file', async () => {
        await runCli([], {},{ conventionalCommits: { enabled: true } });
        expect(generateChangelog).toHaveBeenCalledWith(expect.objectContaining({
            conventionalCommits: expect.objectContaining({ enabled: true })
        }));
    });

    it('should load conventionalCommits.types from config file', async () => {
        await runCli([], {},{ conventionalCommits: { types: ['feat', 'fix'] } });
        expect(generateChangelog).toHaveBeenCalledWith(expect.objectContaining({
            conventionalCommits: expect.objectContaining({ types: ['feat', 'fix'] })
        }));
    });

    it('--summarize CLI arg should override config file (summarize:false)', async () => {
        await runCli(['--summarize'], {}, { summarize: false });
        expect(generateChangelog).toHaveBeenCalledWith(expect.objectContaining({ summarize: true }));
    });
    
    it('-s CLI arg should override config file (summarize:false)', async () => {
        await runCli(['-s'], {}, { summarize: false });
        expect(generateChangelog).toHaveBeenCalledWith(expect.objectContaining({ summarize: true }));
    });
    
    it('OPENAI_API_KEY env var should be used by Summarizer, cli.ts passes config key if present', async () => {
        // cli.ts itself doesn't prioritize env var over config for the `config.openAiApiKey` it builds.
        // It reads from config, then CLI arg can override it.
        // The Summarizer is responsible for checking env var first.
        // This test verifies what cli.ts passes to generateChangelog.
        await runCli([], { OPENAI_API_KEY: 'env_api_key' }, { openAiApiKey: 'config_api_key' });
        expect(generateChangelog).toHaveBeenCalledWith(expect.objectContaining({ openAiApiKey: 'config_api_key' }));
    });
        
    it('--openai-api-key CLI arg should override config file openAiApiKey', async () => {
        await runCli(['--openai-api-key=cli_api_key'], {}, { openAiApiKey: 'config_api_key' });
        expect(generateChangelog).toHaveBeenCalledWith(expect.objectContaining({ openAiApiKey: 'cli_api_key' }));
    });

    it('--openai-api-key CLI arg should override env var and config openAiApiKey', async () => {
        await runCli(['--openai-api-key=cli_api_key'], { OPENAI_API_KEY: 'env_api_key' }, { openAiApiKey: 'config_api_key' });
        expect(generateChangelog).toHaveBeenCalledWith(expect.objectContaining({ openAiApiKey: 'cli_api_key' }));
    });

    it('should use default values if config file is missing', async () => {
        await runCli(); // No args, no env, no configData
        expect(generateChangelog).toHaveBeenCalledWith({
            summarize: false,
            openAiApiKey: undefined,
            customPrompt: undefined,
            conventionalCommits: {
                enabled: false,
                types: []
            }
        });
    });
    
    it('should use default for conventionalCommits if field is absent in config', async () => {
        await runCli([], {}, { summarize: true }); // conventionalCommits field missing
        expect(generateChangelog).toHaveBeenCalledWith(expect.objectContaining({
            summarize: true,
            conventionalCommits: {
                enabled: false,
                types: []
            }
        }));
    });

    it('should handle malformed JSON config file gracefully and exit', async () => {
        await runCli([], {}, null, true); // malformedConfig = true
        expect(processExitSpy).toHaveBeenCalledWith(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error reading or parsing changelog-lite.config.json:',
            expect.any(Error)
        );
    });
    
    it('should call generateChangelog and log its result upon successful execution', async () => {
        (generateChangelog as jest.Mock).mockResolvedValueOnce('Successful Changelog');
        await runCli([], {}, { summarize: true });
        expect(generateChangelog).toHaveBeenCalled();
        expect(consoleLogSpy).toHaveBeenCalledWith('Successful Changelog');
    });

    it('should log error and exit if generateChangelog fails', async () => {
        const error = new Error('generateChangelog failed');
        (generateChangelog as jest.Mock).mockRejectedValueOnce(error);
        await runCli([], {}, { summarize: true });
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error generating changelog:', 'generateChangelog failed');
        expect(processExitSpy).toHaveBeenCalledWith(1);
    });
});
