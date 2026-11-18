async ()=>{
  const fn=async(p)=>({text: (p.includes("piece by piece")||p.includes("whole sentence"))?"[整句]":"[片段]"}); fn.json=async(p)=>{ if(/Translate every numbered item/.test(p)){ const it=[...String(p).matchAll(/^\d+\. \[(piece|sentence|unfinished)\] (.*)$/gm)]; return {t:it.map(x=>x[1]==="sentence"?"[整句]":"[片段]")}; } return {}; };
  sample=fn; beginRecording(); listening=true; // pauseCheck only runs while dictation is live (v12)
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  // utterance stays open in dictation (no final) across several sentences, like a teacher who never stops long
  const parts=[["los alveolos están rodeados de capilares",900],["que se pegan a la pared alveolar",1500],["es decir a la pared interna del alveolo",700],["y ahí se produce el intercambio de gases",1500],["el oxígeno pasa a la sangre y el dióxido de carbono sale",200]];
  let said="";
  for(const [p,pause] of parts){
    for(const w of p.split(" ")){ said+=(said?" ":"")+w; onPartialText(said); await sleep(120); }
    await sleep(pause);
  }
  onFinalText(said);
  await translateIdle(); await Promise.allSettled([...pendingWhole]);
  return cur.lines.map(l=>l.o+"  =>  "+l.t);
}
