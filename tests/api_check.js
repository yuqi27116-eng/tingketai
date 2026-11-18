// "Own API key" path, end to end, with no network: the official SDK (@anthropic-ai/sdk 1.4.0, bundled locally with
// esbuild) is served in place of jsDelivr, api.anthropic.com is a mock speaking the streaming Messages format,
// and the Whisper endpoint returns timed segments. Imports a recording and checks transcript, translation,
// notes, mind map, timed outline, review mode — and what was actually sent to the API.
// Usage: node tests/api_check.js <path to sdk.mjs>
const {chromium}=require('playwright'); const fs=require('fs'); const path=require('path');
(async()=>{
  const sdk=fs.readFileSync(process.argv[2]);
  const b=await chromium.launch(); const ctx=await b.newContext();
  await ctx.addInitScript(()=>{ try{ localStorage.setItem("tkt-api",JSON.stringify({mode:"api",key:"sk-ant-test",model:"claude-opus-5-5",sttBase:"https://api.openai.com/v1",sttKey:"sk-stt-test",sttModel:"whisper-1"})); }catch(e){} });
  const p=await ctx.newPage(); const sent=[]; const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  const cors={"access-control-allow-origin":"*","access-control-allow-headers":"*","access-control-allow-methods":"POST, OPTIONS"};
  const sse=text=>{
    const ev=[["message_start",{type:"message_start",message:{id:"msg_1",type:"message",role:"assistant",model:"claude-opus-5-5",content:[],stop_reason:null,stop_sequence:null,usage:{input_tokens:10,output_tokens:1}}}],
      ["content_block_start",{type:"content_block_start",index:0,content_block:{type:"text",text:""}}]];
    for(const t of text.match(/[\s\S]{1,40}/g)) ev.push(["content_block_delta",{type:"content_block_delta",index:0,delta:{type:"text_delta",text:t}}]);
    ev.push(["content_block_stop",{type:"content_block_stop",index:0}],["message_delta",{type:"message_delta",delta:{stop_reason:"end_turn",stop_sequence:null},usage:{output_tokens:5}}],["message_stop",{type:"message_stop"}]);
    return ev.map(([e,d])=>`event: ${e}\ndata: ${JSON.stringify(d)}\n\n`).join("");
  };
  const SEGS=[["Buenos días, hoy hablamos del intercambio gaseoso en el pulmón.",0,4],["Lo más importante es la ley de Fick: el flujo depende del área y del gradiente.",4,10],["¿Alguien sabe por qué el dióxido de carbono difunde más rápido?",10,14],["Porque es más soluble.",14,16],["Para el jueves leed el capítulo treinta y nueve.",16,20]];
  await p.route(/^https?:/,async r=>{
    const u=r.request().url(), m=r.request().method();
    if(u.includes("cdn.jsdelivr.net/npm/@anthropic-ai/sdk@1.4.0")) return r.fulfill({body:sdk,contentType:"text/javascript",headers:cors});
    if(m==="OPTIONS") return r.fulfill({status:204,headers:cors});
    if(u.startsWith("https://api.openai.com/v1/audio/transcriptions")){ sent.push({stt:true,auth:r.request().headers()["authorization"]});
      return r.fulfill({contentType:"application/json",headers:cors,body:JSON.stringify({text:SEGS.map(x=>x[0]).join(" "),duration:20,segments:SEGS.map(([text,start,end])=>({start,end,text}))})}); }
    if(u.startsWith("https://api.anthropic.com/v1/messages")){
      const body=JSON.parse(r.request().postData()||"{}"), h=r.request().headers(), prompt=JSON.stringify(body.messages);
      sent.push({model:body.model,effort:body.output_config&&body.output_config.effort,fallbacks:body.fallbacks,beta:h["anthropic-beta"],browser:h["anthropic-dangerous-direct-browser-access"],key:h["x-api-key"],stream:body.stream,kind:/Translate every numbered item/.test(prompt)?"translate":/study notes/.test(prompt)?"notes":/may contain a question/.test(prompt)?"question":/may flag/.test(prompt)?"keys":/course folder|short Chinese title/.test(prompt)?"classify":"other"});
      let text="{}";
      const k=sent[sent.length-1].kind;
      if(k==="translate"){ const n=(prompt.match(/\\n\d+\. \[/g)||[]).length; text=JSON.stringify({t:Array.from({length:n},(_,i)=>"中文译文"+(i+1))}); }
      if(k==="question") text=JSON.stringify({kind:"question",q_src:"¿Por qué el CO2 difunde más rápido?",q_tgt:"为什么 CO2 扩散更快？",answers:{precise:{zh:"溶解度高。",say:"Es más soluble."},simple:{zh:"更易溶。",say:"Más soluble."},safe:{zh:"和溶解度有关。",say:"Por la solubilidad."}}});
      if(k==="keys") text=JSON.stringify({key:true,start:1,end:2,title:"菲克定律",explain:"流量取决于面积和压差。"});
      if(k==="classify") text=JSON.stringify({folder:"生理学",isNew:true,title:"肺的气体交换"});
      if(k==="notes") text="## 摘要\n讲气体交换。[#1]\n## 要点\n- 菲克定律 [#2]\n## 双语考点\n- **ley de Fick 菲克定律** [#2]\n## 待办与截止日期\n- 读第 39 章 [#5]\n## 可能讨论的问题\n- CO2 为何更快 [#3]\n## 时间纲要\n- [#1] 课程导入\n- [#2] 菲克定律\n- [#5] 作业\n## 思维导图\n- 肺的气体交换 [#1]\n  - 菲克定律 [#2]\n    - 面积与压差 [#2]\n  - CO2 溶解度 [#4]\n  - 作业 [#5]";
      return r.fulfill({status:200,contentType:"text/event-stream",headers:cors,body:sse(text)});
    }
    r.abort();
  });
  await p.goto('file://'+path.resolve(__dirname,'..','index.html')); await p.waitForTimeout(400);
  const res=await p.evaluate(async()=>{
    const sleep=ms=>new Promise(r=>setTimeout(r,ms));
    document.getElementById("srcLang").value="es"; document.getElementById("tgtLang").value="zh";
    const wav=new File([new Uint8Array(4000)],"clase_fisiologia.wav",{type:"audio/wav"});
    await importRecording(wav);
    for(let i=0;i<60&&!(cur.mindmap&&cur.mindmap.root);i++) await sleep(100);
    const s=cur;
    return {provider:sample&&sample.external?"anthropic-api":"builtin", title:s.title, lines:s.lines.map(l=>[l.ms,l.o.slice(0,30),l.t]), audio:s.audio&&s.audio[0]&&{aligned:s.audio[0].aligned,dur:s.audio[0].dur},
      keyPoints:(s.keyPoints||[]).map(k=>k.title), questions:(s.questions||[]).map(q=>[q.kind,q.qt]), timeline:(s.timeline||[]).map(x=>[x.from,x.text]), mindmap:s.mindmap&&s.mindmap.root.c.map(c=>c.t), notesHidesSections:!/时间纲要|思维导图/.test(document.getElementById("notes").textContent),
      reviewing:reviewing(), tab:document.querySelector(".tabs .on").textContent, usage:s.ai};
  });
  console.log(JSON.stringify({res,requests:sent.slice(0,3),kinds:sent.map(x=>x.kind||"stt"),allBrowserHeader:sent.filter(x=>!x.stt).every(x=>x.browser==="true"),allFallback:sent.filter(x=>!x.stt).every(x=>x.fallbacks==="default"&&/server-side-fallback-2026-07-01/.test(x.beta||""))},null,1));
  if(errs.length) console.log("pageerrors",errs);
  await b.close();
})();
