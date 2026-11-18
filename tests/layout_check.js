// Width priority: transcript first, AI notes (right) second, files (left) last.
const {chromium}=require('playwright'); const path=require('path');
(async()=>{
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1440,height:900}}); await p.route(/^https?:/,r=>r.abort());
  await p.goto('file://'+path.resolve(__dirname,'..','index.html')); await p.waitForTimeout(300);
  const out={};
  for(const w of [1440,1100,960,800,600]){
    await p.setViewportSize({width:w,height:900}); await p.waitForTimeout(150);
    out[w]=await p.evaluate(()=>{ const r=id=>Math.round(document.getElementById(id).getBoundingClientRect().width);
      return {left:document.getElementById("pLeft").classList.contains("collapsed")?"折叠":r("pLeft"), mid:r("pMid"), right:document.getElementById("pRight").classList.contains("collapsed")?"折叠":r("pRight"), stacked:document.getElementById("app").classList.contains("narrow")?["pMid","pRight","pLeft"].map(id=>Math.round(document.getElementById(id).getBoundingClientRect().top)):null}; });
  }
  // opening the auto-folded left pane at 960 px folds the right one instead
  await p.setViewportSize({width:960,height:900}); await p.waitForTimeout(100);
  await p.evaluate(()=>document.querySelector('#pLeft .rail [data-fold="left"]').click()); await p.waitForTimeout(100);
  out.peekLeftAt960=await p.evaluate(()=>({left:document.getElementById("pLeft").classList.contains("collapsed"),right:document.getElementById("pRight").classList.contains("collapsed")}));
  await p.setViewportSize({width:1100,height:800}); await p.waitForTimeout(100);
  await p.evaluate(()=>{ lay.peek=null; applyLayout(); demo={speed:2}; runDemo(); });
  await p.waitForTimeout(6000);
  await p.screenshot({path:process.argv[2]||'layout.png'});
  console.log(JSON.stringify(out));
  await b.close();
})();
