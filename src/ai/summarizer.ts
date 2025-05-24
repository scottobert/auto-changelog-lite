import { request } from 'https';

export class Summarizer {
    async summarize(changelog: string): Promise<string> {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error('OPENAI_API_KEY is not set');

        const data = JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant that summarizes changelogs concisely.',
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
                'Authorization': `Bearer ${apiKey}`,
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