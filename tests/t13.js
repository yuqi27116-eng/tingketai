async ()=>{
  // v21: a dictation service that is "half alive" after an outside interruption (start() keeps failing until stop()
  // is called — the case where only restarting the recording used to help), a silent stall, and the single-button UI.
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const h={}; let running=false, needGesture=false, starts=0, stops=0;
  dict={ start(){ starts++; if(running) return Promise.reject({code:"already_running",message:"dictation already running"});
           if(needGesture&&!window.__gesture) return Promise.reject({code:"activation_required"});
           running=true; setTimeout(()=>h.state&&h.state({state:"listening"}),0); return Promise.resolve(); },
         async stop(){ stops++; running=false; setTimeout(()=>h.state&&h.state({state:"idle",reason:"stopped"}),0); },
         onPartial(f){h.partial=f}, onFinal(f){h.final=f}, onState(f){h.state=f} };
  bindDict(); sample=null;
  document.addEventListener("pointerdown",e=>{ if(e.isTrusted){ window.__gesture=true; setTimeout(()=>window.__gesture=false,1000); } },true);
  const ui=()=>({mode:recMode(), pause:document.getElementById("pauseBtn").hidden?null:document.getElementById("pauseBtn").textContent, bar:document.getElementById("resumeBar").hidden?null:document.getElementById("resumeBtn").textContent, mic:document.getElementById("micBtn").getAttribute("aria-label")});
  const out={};
  document.getElementById("newRec").click(); document.getElementById("micBtn").click(); await sleep(30);
  h.final({text:"Primera frase."}); out.live=ui();
  // 1) outside interruption: the service reports idle but secretly keeps "running"
  h.state({state:"idle",reason:"error"}); await sleep(30);
  out.afterDrop={...ui(), autoRestartFailed:starts>1&&!listening};
  // the old "继续" (start only) would fail here; one click on 恢复转录 stops first, then starts
  document.getElementById("resumeBtn").click(); await sleep(60);
  h.final({text:"Después de recuperar."});
  out.recovered={...ui(), listening, stops, sameSession:cur.lines.length===2, segments:cur.segments.length};
  // 2) silent stall: still "listening", nothing arrives for 46 s; automatic recovery is refused (needs a click)
  needGesture=true; lastHeard=Date.now()-46000; recTickLast=0; recTick(); await sleep(60);
  out.stall={...ui(), msg:document.getElementById("resumeMsg").textContent.slice(0,20)};
  // 3) the big mic button now does the same single action instead of ending the session
  out.micDoesNotEnd={recordingBefore:recording};
  return out;
}
