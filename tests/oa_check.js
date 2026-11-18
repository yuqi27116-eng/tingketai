// Other providers (DeepSeek preset) through the OpenAI-compatible /chat/completions stream, end to end with mocks:
// import a recording → translation → key point, question → notes + mind map + outline. Also: a provider that the
// browser cannot reach (CORS-style failure) gives a clear message.
const {chromium}=require('playwright'); const path=require('path');
(async()=>{
  const b=await chromium.launch(); const ctx=await b.newContext();
  await ctx.addInitScript(()=>{ try{ localStorage.setItem("tkt-api",JSON.stringify({mode:"openai",oaBase:"https://api.deepseek.com",oaKey:"sk-ds-test",oaModel:"deepseek-chat",oaQuick:"",sttBase:"https://api.openai.com/v1",sttKey:"sk-stt",sttModel:"whisper-1"})); }catch(e){} });
  const p=await ctx.newPage(); const sent=[]; const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  const cors={"access-control-allow-origin":"*","access-control-allow-headers":"*"};
  const SEGS=[["Hoy hablamos del intercambio gaseoso.",0,3],["Lo más importante es la ley de Fick.",3,6],["¿Alguien sabe por qué el CO2 difunde más rápido?",6,9],["Porque es más soluble.",9,11]];
  const sse=t=>t.match(/[\s\S]{1,25}/g).map(x=>`data: ${JSON.stringify({choices:[{delta:{content:x}}]})}\n\n`).join("")+"data: [DONE]\n\n";
  await p.route(/^https?:/,r=>{ const u=r.request().url();
    if(r.request().method()==="OPTIONS") return r.fulfill({status:204,headers:cors});
    if(u.includes("/audio/transcriptions")) return r.fulfill({contentType:"application/json",headers:cors,body:JSON.stringify({segments:SEGS.map(([text,start,end])=>({start,end,text}))})});
    if(u==="https://api.deepseek.com/chat/completions"){
      const body=JSON.parse(r.request().postData()), pr=body.messages.map(m=>m.content).join("\n");
      const kind=/Translate every numbered item/.test(pr)?"translate":/study notes/.test(pr)?"notes":/may contain a question/.test(pr)?"question":/may flag/.test(pr)?"keys":/course folder|short Chinese title/.test(pr)?"classify":"other";
      sent.push({model:body.model,stream:body.stream,auth:r.request().headers()["authorization"],kind});
      let t="{}";
      if(kind==="translate"){ const n=(pr.match(/^\d+\. \[/gm)||[]).length; t="```json\n"+JSON.stringify({t:Array.from({length:n},(_,i)=>"DeepSeek译文"+(i+1))})+"\n```"; }
      if(kind==="keys") t=JSON.stringify({key:true,start:1,end:2,title:"菲克定律",explain:"扩散取决于面积和压差。"});
      if(kind==="question") t=JSON.stringify({kind:"question",q_src:"¿Por qué?",q_tgt:"为什么 CO2 更快？",answers:{precise:{zh:"溶解度高。",say:"Es más soluble."},simple:{zh:"易溶。",say:"Soluble."},safe:{zh:"和溶解度有关。",say:"Por la solubilidad."}}});
      if(kind==="classify") t=JSON.stringify({folder:"生理学",isNew:true,title:"气体交换"});
      if(kind==="notes") t="## 摘要\n气体交换。[#1]\n## 时间纲要\n- [#1] 导入\n- [#2] 菲克定律\n## 思维导图\n- 气体交换 [#1]\n  - 菲克定律 [#2]\n  - CO2 溶解度 [#4]";
      return r.fulfill({status:200,contentType:"text/event-stream",headers:cors,body:sse(t)});
    }
    r.abort(); });
  await p.goto('file://'+path.resolve(__dirname,'..','index.html')); await p.waitForTimeout(300);
  const res=await p.evaluate(async()=>{ const sleep=ms=>new Promise(r=>setTimeout(r,ms));
    document.getElementById("srcLang").value="es"; document.getElementById("tgtLang").value="zh";
    await importRecording(new File([new Uint8Array(3000)],"clase.wav",{type:"audio/wav"}));
    for(let i=0;i<60&&!(cur.mindmap&&cur.mindmap.root);i++) await sleep(100);
    const s=cur;
    // a provider the browser cannot reach
    api.oaBase="https://blocked.example.com/v1"; let blocked; oaReached=false;
    try{ await makeOpenAISample()("hi"); }catch(e){ blocked=e.message; }
    return {title:s.title,translations:s.lines.map(l=>l.t),keyPoints:(s.keyPoints||[]).map(k=>k.title),questions:(s.questions||[]).map(q=>q.qt),timeline:(s.timeline||[]).map(x=>x.text),mindmap:s.mindmap&&s.mindmap.root.c.map(c=>c.t),reviewing:reviewing(),blocked};
  });
  console.log(JSON.stringify({res,requests:sent.length,first:sent[0],kinds:sent.map(x=>x.kind)},null,1)); if(errs.length) console.log("pageerrors",errs);
  await b.close();
})();
