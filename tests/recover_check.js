// Runs t13 and then does real mouse clicks (a user gesture) on the single recovery button and on the mic button.
const {chromium}=require('playwright'); const fs=require('fs'); const path=require('path');
(async()=>{
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1440,height:900}}); await p.route(/^https?:/,r=>r.abort());
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+path.resolve(__dirname,'..','index.html')); await p.waitForTimeout(300);
  const a=await p.evaluate(`(${fs.readFileSync(path.join(__dirname,'t13.js'),'utf8')})()`);
  await p.click('#resumeBtn'); await p.waitForTimeout(150);
  a.stallFixedByClick=await p.evaluate(()=>({mode:recMode(),listening,stalled}));
  await p.click('#micBtn'); await p.waitForTimeout(150);
  a.micClickWhileLive=await p.evaluate(()=>({recording,mode:recMode()}));
  await p.click('#micBtn'); await p.waitForTimeout(150);
  a.micClickWhilePaused=await p.evaluate(()=>({recording,mode:recMode()}));
  await p.click('#endBtn'); await p.waitForTimeout(400);
  a.endButton=await p.evaluate(()=>({recording,reviewing:reviewing()}));
  console.log(JSON.stringify(a,null,1)); if(errs.length) console.log('pageerrors',errs);
  await b.close();
})();
