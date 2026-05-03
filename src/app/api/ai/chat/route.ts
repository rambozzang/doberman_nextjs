import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface ClientRequest {
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  temperature?: number;
  responseFormat?: 'json' | 'text';
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    const apiUrl = process.env.DASHSCOPE_API_URL ?? 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
    const model = process.env.DASHSCOPE_MODEL ?? 'qwen-plus';

    if (!apiKey) {
      return NextResponse.json({ error: 'DASHSCOPE_API_KEY 가 설정되지 않았습니다.' }, { status: 500 });
    }

    const body: ClientRequest = await req.json();
    if (!body?.messages || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: 'messages 배열이 필요합니다.' }, { status: 400 });
    }

    const upstreamPayload: Record<string, unknown> = {
      model,
      messages: body.messages,
      temperature: body.temperature ?? 0.3,
    };
    // 응답을 JSON 으로 강제하고 싶을 때
    if (body.responseFormat === 'json') {
      upstreamPayload.response_format = { type: 'json_object' };
    }

    const upstream = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(upstreamPayload),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      console.error('DashScope error:', upstream.status, text);
      return NextResponse.json(
        { error: `LLM 응답 오류 (${upstream.status})`, detail: text.slice(0, 500) },
        { status: 502 },
      );
    }

    const data = await upstream.json();
    // OpenAI compatible: { choices: [{ message: { content: string } }] }
    const content: string = data?.choices?.[0]?.message?.content ?? '';
    return NextResponse.json({ content });
  } catch (e) {
    console.error('AI chat route 오류:', e);
    return NextResponse.json({ error: 'AI 호출 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
