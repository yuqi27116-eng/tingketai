// Usage: node tests/run.js <project dir> [t3 t4 ...] [--html other.html]
// Opens index.html as a file with all network blocked, then runs each tests/tX.js via page.evaluate.
const {chromium}=require('playwright'); const fs=require('fs'); const path=require('path');
(async()=>{
  const args=process.argv.slice(2); const dir=path.resolve(args.shift()||'.');
  let html=path.join(dir,'index.html'); const hi=args.indexOf('--html'); if(hi>=0){ html=path.resolve(args[hi+1]); args.splice(hi,2); }
  const tests=args.length?args:['t3','t4','t5','t6'];
  const b=await chromium.launch();
  for(const t of tests){
    const p=await b.newPage(); await p.route(/^https?:/,r=>r.abort());
    const errs=[]; p.on('pageerror',e=>errs.push(e.message));
    await p.goto('file://'+html); await p.waitForTimeout(300);
    await p.evaluate(fs.readFileSync(path.join(dir,'tests','lecture.js'),'utf8'));
    try{ const r=await p.evaluate(`(${fs.readFileSync(path.join(dir,'tests',t+'.js'),'utf8')})()`); console.log('== '+t, JSON.stringify(r,null,1)); }
    catch(e){ console.log('== '+t+' FAILED', e.message); }
    if(errs.length) console.log('pageerrors', errs); await p.close();
  }
  await b.close();
})();
