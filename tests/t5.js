async ()=>{
  const fn=async()=>({text:"译文"});
  let calls=[];
  fn.json=async(p)=>{ if(/Translate every numbered item/.test(p)){ const it=[...String(p).matchAll(/^\d+\. \[(piece|sentence|unfinished)\] (.*)$/gm)]; return {t:it.map(()=>"译文")}; } if(p.includes("may contain a question")){ const n=p.match(/Line (\d+) may/)[1]; const line=p.split("Lines:\n")[1].split("\n")[n-1]; calls.push(line);
      return line.toLowerCase().includes("alguien sabe")?{kind:"question",q_src:"¿Alguien sabe qué gas pasa a la sangre?",q_tgt:"有人知道哪种气体进入血液吗？",answer:"氧气从肺泡扩散进入毛细血管血液。",say:"El oxígeno pasa del alveolo a la sangre."}:{kind:"none"}; }
    return {}; };
  sample=fn;
  const det=["que es el tema de hoy","lo que vamos a ver","¿Alguien sabe qué gas pasa a la sangre?","Por qué ocurre esto, pues porque hay gradiente","vale, ¿sí?","Comentad con el compañero de al lado"].map(x=>[x, Q_RE.test(norm(x))||Q_RAW.test(x.toLowerCase())]);
  // merge test: two sessions 10 min apart
  const t0=Date.now()-3600e3;
  const A={id:"a1",title:"肺 上半节",src:"es",tgt:"zh",created:t0,startedAt:t0,endedAt:t0+60e3,durationMs:60e3,lines:[{ms:1000,o:"Primera parte",t:"第一部分"}],keyPoints:[],questions:[]};
  const B={id:"b1",title:"肺 下半节",src:"es",tgt:"zh",created:t0+11*60e3,startedAt:t0+11*60e3,endedAt:t0+12*60e3,durationMs:60e3,lines:[{ms:2000,o:"Segunda parte",t:"第二部分"}],questions:[{ms:2000,kind:"question",q:"x",qt:"y",answer:"z",say:""}]};
  sessions.push(B,A);
  document.getElementById("mergeMode").click(); mergeSel.add("b1"); mergeSel.add("a1"); await document.getElementById("mergeGo").onclick();
  const m=cur;
  // question flow on a live session
  beginRecording(); const sl=ms=>new Promise(r=>setTimeout(r,ms)); addLine("El oxígeno difunde por la membrana."); await sl(30); addLine("¿Alguien sabe qué gas pasa a la sangre?"); await sl(30); addLine("Muy bien, el oxígeno."); await translateIdle(); await checkQuestions(cur,true);
  const dbg={q:cur.questions, qq:cur.qQueue, lines:cur.lines.map(l=>[l.o,l.ms]), calls}; if(!document.querySelector("[data-qopen]")) return dbg; document.querySelector("[data-qopen]").click();
  return {det, calls, merged:{order:m.lines.map(l=>[l.o,l.ms,l.seg]),segments:m.segments.length,qms:m.questions[0].ms}, bar:document.querySelector(".qbar").innerText};
}
