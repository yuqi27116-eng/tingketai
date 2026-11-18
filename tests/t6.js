async ()=>{
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  // fake dictation capability
  const h={}; let startOk=true, starts=0;
  dict={ start(){ starts++; return startOk?(setTimeout(()=>h.state&&h.state({state:"listening"}),0),Promise.resolve()):Promise.reject({code:"activation_required",message:"需要点击"}); },
         async stop(){ h.final&&h.final({text:"última frase antes de parar"}); h.state&&h.state({state:"idle",reason:"stopped"}); },
         onPartial(f){h.partial=f}, onFinal(f){h.final=f}, onState(f){h.state=f} };
  dict.onPartial(({text})=>{ if(!recording||!listening) return; onPartialText(text); renderTranscript(); });
  dict.onFinal(({text})=>{ if(!recording||!listening) return; onFinalText(text); });
  dict.onState(({state,reason})=>{ if(state==="listening"&&recording){ listening=true; interrupted=false; renderRecState(); return; } if(state==="idle"&&recording&&listening&&!intentStop) onDictationDropped(reason); });
  sample=null;
  const log=[];
  document.getElementById("micBtn").click(); await sleep(20);
  h.final({text:"Primera frase del profesor"}); log.push(["after first", cur.lines.length, listening]);
  await pauseRec(); log.push(["paused", cur.lines.map(l=>l.o), listening, paused, document.getElementById("pauseBtn").textContent]);
  h.final({text:"no debería entrar"});
  resumeRec(); await sleep(20); h.final({text:"Seguimos tras la pausa"}); log.push(["resumed", listening, cur.segments.length]);
  // unexpected drop, auto restart blocked
  startOk=false; h.partial({text:"palabras a medias"}); h.state({state:"idle",reason:"error"}); await sleep(20);
  log.push(["dropped", listening, interrupted, !document.getElementById("resumeBar").hidden, document.getElementById("resumeMsg").textContent, cur.lines.map(l=>l.o).slice(-2)]);
  startOk=true; document.getElementById("resumeBtn").click(); await sleep(20); h.final({text:"Y continuamos"});
  log.push(["recovered", listening, interrupted, cur.id, cur.lines.map(l=>[l.o,l.seg]), cur.segments.map(s=>[s.kind||"first", !!s.end])]);
  return log;
}
