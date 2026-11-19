// Boot inside a simulated claude.ai runtime: window.claude.use() returns stub capabilities, db holds
// v12-era documents (old session/folder shapes). Captures every page error through boot, review render,
// tabs, and starting a recording.
const {chromium}=require('playwright'); const path=require('path');
(async()=>{
  const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:1400,height:900}});
  await ctx.addInitScript(()=>{
    const now=Date.now()-86400000;
    const docs=[
      {id:"f_a",kind:"folder",name:"Fisiología",terms:"ley de Fick = 菲克定律",created:now-1e6},
      {id:"s_old",kind:"session",title:"旧课",src:"es",tgt:"zh",folderId:"a",created:now,startedAt:now,endedAt:now+600000,
        lines:[{ms:1000,o:"Hola a todos.",t:"大家好。"},{ms:5000,o:"¿Alguien sabe qué es la difusión?",t:"有人知道什么是扩散吗？"},{ms:9000,o:"Lo más importante es la ley de Fick.",t:"最重要的是菲克定律。",seg:1}],
        notes:"## 摘要\n讲扩散。[#1]",chat:[{q:"什么是扩散",a:"..."}],timeline:[{from:0,to:60000,text:"导入"}],
        keyPoints:[{title:"菲克定律",explain:"x",from:9000,to:9000}],questions:[{line:1,q:"¿Alguien sabe?",qt:"有人知道？",answer:"扩散是…",say:"Es…"}],refined:false},
      {id:"s_old2",kind:"session",title:"更旧",src:"es",tgt:"zh",created:now-5e5,lines:[]},
      // v12 session left open (page closed while recording): endedAt null, open segment, chat as {role,content}
      {id:"s_open",kind:"session",title:"",src:"es",tgt:"zh",folderId:null,autoFolder:true,created:now+1e6,startedAt:now+1e6,endedAt:null,durationMs:0,
        lines:[{ms:500,o:"Vamos a empezar.",t:null},{ms:2500,o:"Hoy hablamos de la difusión",t:"今天讲扩散",whole:true}],notes:"",chat:[{role:"user",content:"?"},{role:"assistant",content:"!"}],segments:[{start:now+1e6,end:null}],
        keyPoints:[{from:500,to:2500,cueMs:500,cue:"lo más importante",title:"扩散",explain:"x"}],questions:[{ms:2500,kind:"question",q:"¿?",qt:"？",answer:"a",say:"b",open:false,dismissed:false}],timeline:[{from:0,to:2500,text:"开场"}]},
    ];
    const mk=(id)=>({id, data:()=>docs.find(d=>d.id===id)});
    const db={collection:(p)=>({get:async()=>({docs:docs.map(d=>({id:d.id,data:()=>JSON.parse(JSON.stringify(d))}))}),
      doc:(id)=>({set:async v=>{window.__writes=(window.__writes||0)+1;},update:async v=>{},delete:async()=>{},get:async()=>mk(id)})})};
    const dictation={start(){window.__dstart=(window.__dstart||0)+1; this._s&&this._s({state:"listening"});},stop(){this._s&&this._s({state:"idle",reason:"stopped"});return Promise.resolve();},
      onPartial(f){this._p=f;},onFinal(f){this._f=f;},onState(f){this._s=f;}};
    const sample=async(p,o)=>({text:"译文"}); sample.json=async()=>({}); sample.limits=async()=>({});
    const caps={dictation,sample,db,user:{id:async()=>"u1"},assets:{upload:async()=>({id:"x",url:"/_blob/x"})}};
    const hang=new URLSearchParams(location.search).get("hang")||"";
    window.claude={use:n=>hang.split(",").includes(n)?new Promise(()=>{}):Promise.resolve(caps[n])};
  });
  const p=await ctx.newPage(); const errs=[];
  p.on('pageerror',e=>errs.push("pageerror: "+e.message+"\n"+(e.stack||"").split("\n").slice(0,4).join("\n")));
  p.on('console',m=>{ if(m.type()==="error"||m.type()==="warning") errs.push(m.type()+": "+m.text()); });
  await p.route(/^https?:/,r=>r.abort());
  await p.goto('file://'+path.resolve(__dirname,'..','index.html')+(process.argv[3]?'?hang='+process.argv[3]:'')); await p.waitForTimeout(1500);
  const st=await p.evaluate(()=>({sessions:sessions.length,cur:cur&&cur.title,reviewing:typeof reviewing==="function"&&reviewing(),body:document.body.innerText.length}));
  for(const t of ["Notes","Mine","Review","Chat"]) { try{ await p.evaluate(t=>showTab(t),t); }catch(e){ errs.push("showTab "+t+": "+e.message); } }
  try{ await p.click('#newRec'); await p.click('#micBtn'); await p.waitForTimeout(500); }catch(e){ errs.push("click: "+e.message); }
  const st2=await p.evaluate(()=>({recording:!!recording,listening,dstart:window.__dstart}));
  await p.screenshot({path:process.argv[2]||'/tmp/claude_check.png'});
  console.log(JSON.stringify({st,st2},null,1)); console.log(errs.join("\n")||"no errors");
  await b.close();
})();
