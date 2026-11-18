// Background gap: dictation is stopped while the page is hidden, the microphone keeps recording, and on return the
// silent stretch is transcribed (mock Whisper endpoint) and inserted at its real time.
const {chromium}=require('playwright'); const path=require('path');
(async()=>{
  const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
  const ctx=await b.newContext();
  await ctx.addInitScript(()=>{ try{ localStorage.setItem("tkt-api",JSON.stringify({mode:"builtin",sttBase:"https://api.openai.com/v1",sttKey:"sk-stt-test",sttModel:"whisper-1"})); }catch(e){} });
  const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); let sttBytes=0;
  await p.route(/^https?:/,r=>{ const u=r.request().url();
    if(r.request().method()==="OPTIONS") return r.fulfill({status:204,headers:{"access-control-allow-origin":"*","access-control-allow-headers":"*"}});
    if(u.includes("/audio/transcriptions")){ sttBytes=(r.request().postDataBuffer()||Buffer.alloc(0)).length;
      return r.fulfill({contentType:"application/json",headers:{"access-control-allow-origin":"*"},body:JSON.stringify({segments:[{start:0.4,end:1.6,text:"Esto lo dije con la pestaña en segundo plano."},{start:1.7,end:2.8,text:"Y esto también se ha recuperado del audio."}]})}); }
    r.abort(); });
  await p.goto('file://'+path.resolve(__dirname,'..','index.html')); await p.waitForTimeout(300);
  await p.evaluate(()=>{ window.h={}; dict={ start(){ setTimeout(()=>h.state&&h.state({state:"listening"}),0); return Promise.resolve(); }, async stop(){ h.state&&h.state({state:"idle",reason:"stopped"}); },
      onPartial(f){h.partial=f}, onFinal(f){h.final=f}, onState(f){h.state=f} }; bindDict(); sample=null; });
  await p.click('#newRec'); await p.click('#micBtn'); await p.waitForTimeout(800);
  const res=await p.evaluate(async()=>{ const sleep=ms=>new Promise(r=>setTimeout(r,ms));
    h.final({text:"Primera frase antes de cambiar de pestaña."}); await sleep(300);
    let vis="hidden"; Object.defineProperty(document,"visibilityState",{configurable:true,get:()=>vis});
    document.dispatchEvent(new Event("visibilitychange")); h.state({state:"idle",reason:"hidden"}); await sleep(50);
    const during={interrupted, gapRecording:!!gapRec.mr, msg:document.getElementById("resumeMsg").textContent.slice(0,40)};
    await sleep(3000);                                  // 3 s in the background
    vis="visible"; document.dispatchEvent(new Event("visibilitychange")); await sleep(1500);
    h.final({text:"Ya de vuelta en la pestaña."}); await sleep(300);
    return {during, after:{listening, gaps:cur.gaps, lines:cur.lines.map(l=>[l.ms,l.o,!!l.gap])}};
  });
  res.sttUploadBytes=sttBytes; console.log(JSON.stringify(res,null,1)); if(errs.length) console.log("pageerrors",errs);
  await b.close();
})();
