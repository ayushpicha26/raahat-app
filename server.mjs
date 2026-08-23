import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const preferredPort = Number(process.env.PORT || 3000);
const records = [
  { id:'RAH-2026-00124', priority:'Critical', svi:91, problem:'Threat / intimidation', district:'Pune', status:'Human review required' },
  { id:'RAH-2026-00125', priority:'High', svi:68, problem:'Social boycott', district:'Nashik', status:'Under review' },
  { id:'RAH-2026-00126', priority:'Moderate', svi:42, problem:'Legal proceeding distress', district:'Nagpur', status:'Support assigned' }
];
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};
function json(res,status,body){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(body));}
async function body(req){let raw='';for await(const c of req)raw+=c;if(raw.length>200000)throw Error('Request too large');return raw?JSON.parse(raw):{};}
function localAssessment(text=''){
  const t=text.toLowerCase(); const danger=/unsafe|kill|attack|threat|afraid|violence|hurt/.test(t); const distress=/fear|anxious|panic|alone|scared|distress/.test(t);
  const svi=Math.min(92,Math.max(38,42+(danger?32:0)+(distress?18:0)));
  return {mode:'local-safe-fallback',svi,priority:svi>=80?'Critical':svi>=65?'High':'Moderate',reply:danger?'Thank you for sharing this. Your safety matters. If you are in immediate danger, contact 14566 or local emergency services. With your consent, an authorized professional can review your case.':'Thank you for sharing. You can continue at your own pace. I can help identify support options and request human review.',summary:'AI-assisted demo summary based only on the information shared. Human review is recommended.',recommendations:['Counselling support','Legal aid','Safety assessment']};
}
async function aiAssessment(text){
  if(!process.env.OPENAI_API_KEY)return localAssessment(text);
  const instructions='You are RAAHAT, an empathetic Indian government victim-support assistant. Never diagnose or claim to be a therapist, police officer or final decision maker. Ask concise safety-focused questions, encourage local emergency help if immediate danger is indicated, and return strictly valid JSON with reply, summary, priority (Low|Moderate|High|Critical), svi (0-100), recommendations array. Do not contact anyone.';
  const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Authorization':`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-5',instructions,input:text,store:false,text:{format:{type:'json_object'}}})});
  if(!response.ok)throw Error(`AI service returned ${response.status}`);const data=await response.json();return {...JSON.parse(data.output_text),mode:'openai'};
}
const server=http.createServer(async(req,res)=>{try{
  const url=new URL(req.url,`http://${req.headers.host}`);
  if(req.method==='GET'&&url.pathname==='/api/health')return json(res,200,{ok:true,aiConfigured:Boolean(process.env.OPENAI_API_KEY)});
  if(req.method==='GET'&&url.pathname==='/api/cases')return json(res,200,{demoData:true,cases:records});
  if(req.method==='POST'&&url.pathname==='/api/auth/login'){const b=await body(req);return json(res,200,{token:'demo-session-token',role:b.role==='admin'?'admin':'citizen'});}
  if(req.method==='POST'&&url.pathname==='/api/ai/assess'){const b=await body(req);if(typeof b.text!=='string'||!b.text.trim())return json(res,400,{error:'text is required'});return json(res,200,await aiAssessment(b.text));}
  if(req.method==='POST'&&url.pathname==='/api/support-request'){const b=await body(req);return json(res,201,{ok:true,reference:'REQ-'+Date.now(),service:b.service||'General support'});}
  if(req.method!=='GET')return json(res,404,{error:'Not found'});
  const pathname=url.pathname==='/'?'/index.html':url.pathname;const safe=normalize(pathname).replace(/^([.][.][\\/])+/, '');const file=join(root,safe);
  if(!file.startsWith(root))return json(res,403,{error:'Forbidden'});await stat(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});createReadStream(file).pipe(res);
}catch(e){json(res,500,{error:'Request failed',detail:process.env.NODE_ENV==='development'?e.message:undefined});}});
let activePort = preferredPort;
let retries = 0;
server.on('error', error => {
  if (error.code === 'EADDRINUSE' && !process.env.PORT && retries < 5) {
    activePort += 1;
    retries += 1;
    console.warn(`Port ${activePort - 1} is busy; trying ${activePort}…`);
    server.listen(activePort);
    return;
  }
  console.error(error);
  process.exitCode = 1;
});
server.on('listening', () => {
  const address = server.address();
  console.log(`RAAHAT running at http://localhost:${address.port}`);
});
server.listen(activePort);
