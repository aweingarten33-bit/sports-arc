import Fastify from 'fastify';
import { MockResearchEngine } from '@sideline/research';
import type { ContextEnvelope } from '@sideline/context';
import { runResearchPipeline } from './research-pipeline';

const app = Fastify({ logger: true });

app.get('/health', async () => ({ ok: true, service: 'sideline-api' }));

// Legacy mock route: returns the collected mock events as JSON. Kept intact.
app.post<{ Body: { question: string; context: ContextEnvelope } }>(
  '/research',
  async (request, reply) => {
    if (!request.body?.question || !request.body.context)
      return reply.code(400).send({ error: 'question and context required' });
    const events = [];
    for await (const event of new MockResearchEngine().research(
      request.body.question,
      request.body.context,
    ))
      events.push(event);
    return { events };
  },
);

// Live research stream (SSE). Falls back to the mock engine over the same
// event shape when provider keys are absent or the live path fails.
app.post<{ Body: { question: string; context: ContextEnvelope } }>(
  '/api/research/stream',
  async (request, reply) => {
    if (!request.body?.question || !request.body.context)
      return reply.code(400).send({ error: 'question and context required' });
    const { question, context } = request.body;

    reply.hijack();
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    let aborted = false;
    // 'close' on the response fires on client disconnect (the request's
    // 'close' fires as soon as its body is received, which is useless here).
    reply.raw.on('close', () => {
      aborted = true;
    });
    const log = {
      info: (message: string) => request.log.info(message),
      error: (message: string, cause?: unknown) => request.log.error({ err: cause }, message),
    };

    try {
      for await (const ev of runResearchPipeline(question, context, log)) {
        if (aborted) break;
        reply.raw.write(`event: ${ev.event}\ndata: ${JSON.stringify(ev.data)}\n\n`);
      }
    } catch (err) {
      request.log.error({ err }, 'research stream failed');
      if (!aborted)
        reply.raw.write(`event: error\ndata: ${JSON.stringify({ message: 'research failed' })}\n\n`);
    }
    reply.raw.end();
  },
);

app.listen({ port: Number(process.env.PORT ?? '3000'), host: '0.0.0.0' }).catch(error => {
  app.log.error(error);
  process.exit(1);
});
