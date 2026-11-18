async ()=>{
  // v16: (a) background tab: dictation stops with reason "hidden" → resumes on return or on the first click anywhere;
  //      the recording clock runs from a worker. (b) rate limiting: back-off, queue resumes, batching, no stuck lines.
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const out={};
  // ---------- (a) background ----------
  const h={}; let startNeedsGesture=false, starts=0;
  dict={ start(){ starts++; if(startNeedsGesture&&!navigator.userActivation.isActive) return Promise.reject({code:"activation_required"}); setTimeout(()=>h.state&&h.state({state:"listening"}),0); return Promise.resolve(); },
         async stop(){ h.state&&h.state({state:"idle",reason:"stopped"}); }, onPartial(f){h.partial=f}, onFinal(f){h.final=f}, onState(f){h.state=f} };
  bindDict(); sample=null;
  document.getElementById("newRec").click(); document.getElementById("micBtn").click(); await sleep(50);
  h.final({text:"Primera frase antes de cambiar de pestaña."});
  out.clock={worker:!!tickW, ticks:ticks.size};
  // the page goes to the background: claude.ai stops dictation with reason "hidden"
  let vis="hidden"; Object.defineProperty(document,"visibilityState",{configurable:true,get:()=>vis});
  document.dispatchEvent(new Event("visibilitychange"));
  h.state({state:"idle",reason:"hidden"}); await sleep(30);
  out.hidden={recording, listening, interrupted, msg:document.getElementById("resumeMsg").textContent.slice(0,40)};
  // back to the page; automatic restart refused without a gesture
  startNeedsGesture=true; vis="visible"; document.dispatchEvent(new Event("visibilitychange")); await sleep(50);
  out.backNoGesture={listening, interrupted};
  return out;
}
