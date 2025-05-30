import { request } from 'https';

export class Summarizer {
    private apiKey: string;
    private customPrompt: string;

    constructor(apiKey?: string, customPrompt?: string) {
        const envApiKey = process.env.OPENAI_API_KEY;
        if (envApiKey) {
            this.apiKey = envApiKey;
        } else if (apiKey) {
            this.apiKey = apiKey;
        } else {
            throw new Error('OpenAI API key is not set. Please set the OPENAI_API_KEY environment variable or provide it in the configuration file.');
        }
        this.customPrompt = customPrompt || 'You are a helpful assistant that summarizes changelogs concisely.';
    }

    async summarize(changelog: string): Promise<string> {
        const data = JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: this.customPrompt,
                },
                {
                    role: 'user',
                    content: `Summarize the following changelog:\n${changelog}`,
                },
            ],
            max_tokens: 150,
            temperature: 0.5,
        });

        const options = {
            hostname: 'api.openai.com',
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
            },
        };

        return new Promise<string>((resolve, reject) => {
            const req = request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => {
                    body += chunk;
                });
                res.on('end', () => {
                    try {
                        const json = JSON.parse(body);
                        const summary = json.choices?.[0]?.message?.content?.trim();
                        if (summary) {
                            resolve(summary);
                        } else {
                            reject(new Error('No summary returned from OpenAI API'));
                        }
                    } catch (err) {
                        reject(err);
                    }
                });
            });

            req.on('error', (err) => {
                reject(err);
            });

            req.write(data);
            req.end();
        });
    }
}