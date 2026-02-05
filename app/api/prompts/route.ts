import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET() {
    try {
        // Use absolute path for local development to ensure stability
        const projectRoot = '/Users/applychart/Desktop/开发/Tg-news';
        const promptsPath = join(projectRoot, 'langgraph_pipeline', 'prompts.py');

        console.log('[API] Reading prompts from:', promptsPath);
        const content = await readFile(promptsPath, 'utf-8');

        const l6Path = join(projectRoot, 'langgraph_pipeline', 'nodes', 'l6_visual.py');
        let l6Content = '';
        try {
            l6Content = await readFile(l6Path, 'utf-8');
        } catch (e) {
            console.error('[API] Error reading l6_visual.py:', e);
        }

        const envPath = join(projectRoot, '.env');
        let envContent = '';
        try {
            envContent = await readFile(envPath, 'utf-8');
        } catch (e) {
            console.error('Error reading .env:', e);
        }

        // Helper to parse .env content
        const parseEnv = (content: string) => {
            const env: Record<string, string> = {};
            const lines = content.split('\n');
            for (const line of lines) {
                const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
                if (match) {
                    const key = match[1];
                    let value = match[2] || '';
                    // Remove quotes if present
                    if (value.startsWith('"') && value.endsWith('"')) {
                        value = value.slice(1, -1);
                    }
                    if (value.startsWith("'") && value.endsWith("'")) {
                        value = value.slice(1, -1);
                    }
                    env[key] = value;
                }
            }
            return env;
        };

        const env = parseEnv(envContent);

        // Helper to resolve model name
        const resolveModel = (nodePrefix: string) => {
            // 1. Check specific model config
            if (env[`${nodePrefix}_LLM_MODEL`]) return env[`${nodePrefix}_LLM_MODEL`];

            // 2. Determine provider
            let provider = env[`${nodePrefix}_LLM_PROVIDER`];
            if (!provider) {
                provider = env['LLM_PROVIDER'] || 'deepseek'; // Fallback to global or deepseek
            }
            provider = provider.toLowerCase();

            // 3. Return model based on provider
            switch (provider) {
                case 'deepseek': return env['DEEPSEEK_MODEL'] || 'deepseek-chat';
                case 'gemini': return env['GEMINI_MODEL'] || 'gemini-2.0-flash';
                case 'openai': return env['OPENAI_MODEL'] || 'gpt-4o';
                case 'claude': return env['CLAUDE_MODEL'] || 'claude-3-5-sonnet';
                case 'grok': return env['GROK_MODEL'] || 'grok-beta';
                default: return 'unknown';
            }
        };

        // Helper to extract variable content (enhanced for f-strings and local variables)
        const extractVariable = (content: string, name: string) => {
            // Match variable assignment: NAME = """...""" or NAME = "..."
            // We use a non-greedy match for the content inside quotes
            // Added \\s* at the start to handle indentation
            const regex = new RegExp(`\\s*${name}\\s*=\\s*f?"""([\\s\\S]*?)"""`, 'm');
            const match = content.match(regex);
            if (match) return match[1];

            // Try single/double quotes if triple quotes didn't match
            const regexSimple = new RegExp(`\\s*${name}\\s*=\\s*f?"([\\s\\S]*?)"`, 'm');
            const matchSimple = content.match(regexSimple);
            if (matchSimple) return matchSimple[1];

            return null;
        };

        const prompts = {
            l1_fetcher: {
                description: "从本地 JSON 文件或 Telegram API 采集原始消息数据。",
                system: "无 (纯代码逻辑)",
                user: "无 (纯代码逻辑)",
                model: "Python Script"
            },
            l2_extract: {
                system: extractVariable(content, 'L2_SYSTEM_PROMPT'),
                user: extractVariable(content, 'L2_USER_PROMPT_TEMPLATE'),
                description: "从输入的媒体消息中提取核心事件，并输出标准化的 JSON 数据。",
                model: resolveModel('L2_EXTRACT')
            },
            l3_aggregate: {
                system: extractVariable(content, 'L3_SYSTEM_PROMPT'),
                user: extractVariable(content, 'L3_USER_PROMPT_TEMPLATE'),
                description: "将输入的结构化事件列表聚合成“事件簇”。",
                model: resolveModel('L3_AGGREGATE')
            },
            l4_decision: {
                system: extractVariable(content, 'L4_SYSTEM_PROMPT'),
                user: extractVariable(content, 'L4_USER_PROMPT_TEMPLATE'),
                description: "判断事件簇是否值得生成要闻报道（负面清单制）。",
                model: resolveModel('L4_DECISION')
            },
            l5_synthesizer: {
                system: extractVariable(content, 'L5_SYNTHESIZER_SYSTEM_PROMPT'),
                user: extractVariable(content, 'L5_SYNTHESIZER_USER_PROMPT_TEMPLATE'),
                description: "阅读原始消息、搜索结果和社交媒体讨论，输出结构化的研究简报。",
                model: resolveModel('L5_SYNTHESIZER')
            },
            l5_writer: {
                planning_template: extractVariable(content, 'L5_WRITER_PLANNING_TEMPLATE'),
                content_template: extractVariable(content, 'L5_WRITER_CONTENT_TEMPLATE'),
                user: extractVariable(content, 'L5_WRITER_USER_PROMPT_TEMPLATE'), // This might also be split or removed, checking prompts.py again
                description: "基于研究简报撰写深度分析文章（行情数据类或叙事类）。",
                model: resolveModel('L5_WRITER')
            },
            l5_editor: {
                system: extractVariable(content, 'L5_EDITOR_SYSTEM_PROMPT'),
                user: extractVariable(content, 'L5_EDITOR_USER_PROMPT_TEMPLATE'),
                description: "审校文章，进行幻觉检测和时效性校验。",
                model: resolveModel('L5_EDITOR')
            },
            l6_visual: {
                system: extractVariable(l6Content, 'prompt_generation_prompt'),
                description: "根据文章内容生成 16:9 的封面图 Prompt，并调用绘图模型生成图片。",
                model: `${resolveModel('L6_VISUAL')} (Prompt) + ${env['GOOGLE_GENAI_MODEL'] || 'gemini-2.5-flash-image'} (Image)`
            },
            weekly_digest: {
                system: extractVariable(content, 'WEEKLY_DIGEST_SYSTEM_PROMPT'),
                user: extractVariable(content, 'WEEKLY_DIGEST_USER_PROMPT_TEMPLATE'),
                description: "将过去一周的碎片化事件汇总是生成深度的《周度研究简报》。",
                model: resolveModel('L5_SYNTHESIZER') // Assuming L5 Synthesizer is used for this as per doc
            },
            monthly_digest: {
                system: extractVariable(content, 'MONTHLY_DIGEST_SYSTEM_PROMPT'),
                user: extractVariable(content, 'MONTHLY_DIGEST_USER_PROMPT_TEMPLATE'),
                description: "基于过去 4 周的研究简报，生成月度战略报告。",
                model: resolveModel('L5_SYNTHESIZER')
            }
        };

        return NextResponse.json({ prompts });
    } catch (error) {
        console.error('Error reading prompts:', error);
        return NextResponse.json(
            { error: 'Failed to read prompts' },
            { status: 500 }
        );
    }
}
