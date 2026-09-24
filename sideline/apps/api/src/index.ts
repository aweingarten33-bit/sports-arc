import Fastify from 'fastify';
import { MockResearchEngine } from '@sideline/research';
import type { ContextEnvelope } from '@sideline/types';
const app=Fastify({logger:true});
app.get('/health',async()=>({ok:true,service:'sideline-api'}));
app.post<{Body:{question:string;context:ContextEnvelope}}>('/research',async(request,reply)=>{if(!request.body?.question||!request.body.context)return reply.code(400).send({error:'question and context required'}); const events=[]; for await(const event of new MockResearchEngine().research(request.body.question,request.body.context))events.push(event); return {events};});
app.listen({port:Number(process.env.PORT??'3000'),host:'0.0.0.0'}).catch(error=>{app.log.error(error);process.exit(1);});
