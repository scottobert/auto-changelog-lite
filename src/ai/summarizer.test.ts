import { Summarizer } from './summarizer';

// Mock the https request
jest.mock('https', () => {
    return {
        request: (_options: any, callback: any) => {
            const res = {
                on: (event: string, handler: (chunk?: any) => void) => {
                    if (event === 'data') {
                        // Simulate OpenAI API response
                        handler(JSON.stringify({
                            choices: [
                                { message: { content: 'This is a summary.' } }
                            ]
                        }));
                    }
                    if (event === 'end') {
                        handler();
                    }
                }
            };
            // Call the callback with the mocked response
            setImmediate(() => callback(res));
            return {
                on: jest.fn(),
                write: jest.fn(),
                end: jest.fn(),
            };
        }
    };
});

describe('Summarizer', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...OLD_ENV, OPENAI_API_KEY: 'test-key' };
    });

    afterAll(() => {
        process.env = OLD_ENV;
    });

    it('returns a summary from the OpenAI API', async () => {
        const summarizer = new Summarizer();
        const result = await summarizer.summarize('Some changelog');
        expect(result).toBe('This is a summary.');
    });

    it('throws if OPENAI_API_KEY is not set', async () => {
        process.env.OPENAI_API_KEY = '';
        const summarizer = new Summarizer();
        await expect(summarizer.summarize('Some changelog')).rejects.toThrow('OPENAI_API_KEY is not set');
    });
});