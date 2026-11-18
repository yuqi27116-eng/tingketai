// Local audio recording with Chromium's fake microphone: record, end, check the stored parts, play back.
const {chromium}=require('playwright'); const path=require('path');
(async()=>{
  const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--autoplay-policy=no-user-gesture-required']});
  const p=await b.newPage(); await p.route(/^https?:/,r=>r.abort()); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+path.resolve(__dirname,'..','index.html')); await p.waitForTimeout(300);
  await p.evaluate(()=>{ dict=null; });
  await p.click('#newRec'); await p.click('#micBtn'); await p.waitForTimeout(400);
  const r1=await p.evaluate(async()=>{ const sleep=ms=>new Promise(r=>setTimeout(r,ms));
    addLine("Primera frase de prueba."); await sleep(1200); addLine("Segunda frase de prueba."); await sleep(1200); addLine("Tercera frase."); await sleep(600);
    return {recordingAudio:!!arec.mr, status:document.getElementById("status").textContent}; });
  await p.click('#endBtn'); await p.waitForTimeout(1500);
  const r2=await p.evaluate(async()=>{ const sleep=ms=>new Promise(r=>setTimeout(r,ms));
    const parts=cur.audio||[]; const blob=parts[0]&&await idb.get(parts[0].ref.slice(4));
    const info={reviewing:reviewing(), parts:parts.map(x=>({ref:x.ref,dur:Math.round(x.dur),mime:x.mime})), storedBytes:blob?blob.size:0, src:document.getElementById("plSrc").textContent};
    setCursor(cur.lines[1].ms,"transcript"); await sleep(300); plPlay(); await sleep(1500);
    info.playback={audioPlaying:!document.getElementById("aud").paused, usingAudio:pl.aud, ms:Math.round(pl.ms), line:revLine+1, audioTime:+document.getElementById("aud").currentTime.toFixed(2)};
    plPause(); return info; });
  console.log(JSON.stringify({r1,r2},null,1)); if(errs.length) console.log('pageerrors',errs);
  await b.close();
})();
