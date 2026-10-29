// New, separately attributed evidence. Never rewrites the October 6 captures.
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const reportRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [label,checkoutArg,selection='plan']=process.argv.slice(2);
if(!['main-083962c','local-correction','branch-compliance'].includes(label)||!checkoutArg)throw new Error('Usage: node scripts/collect_lab4_compliance_output.mjs main-083962c|local-correction|branch-compliance CHECKOUT plan|all|CHECK');
const checkout=path.resolve(checkoutArg);
const git=(...args)=>{
  const r=spawnSync('git',['-c',`safe.directory=${checkout.replaceAll('\\','/')}`,...args],{cwd:checkout,encoding:'utf8'});
  if(r.status!==0)throw new Error(r.stderr||'Git inspection failed');
  return r.stdout.trim();
};
const commit=git('rev-parse','HEAD');
const branch=git('branch','--show-current');
const status=git('status','--porcelain','--untracked-files=no');
if(label==='main-083962c'&&(commit!=='083962c2ec75202acae4f5e2cfebef62ee17c007'||branch!=='main'||status))throw new Error('Main evidence requires the exact clean main checkout; refusing to relabel another source.');
if(label==='branch-compliance'&&(branch!=='feature/lab4-submission-compliance'||status))throw new Error('Branch verification requires the named clean compliance branch; it is not main evidence.');
const jobs=[
 ['server','server',['node_modules/vitest/vitest.mjs','run']],
 ['client','client',['node_modules/vitest/vitest.mjs','run']],
 ['server-build','server',['node_modules/typescript/bin/tsc']],
 ['client-build','client',['node_modules/typescript/bin/tsc']],
 ['client-vite-build','client',['node_modules/vite/bin/vite.js','build']],
 ['e2e-list','.', ['node_modules/@playwright/test/cli.js','test','--list']],
 ['e2e','.', ['node_modules/@playwright/test/cli.js','test']],
 ['history','server',['scripts/run-lab4-history-test.mjs']],
 ['migration','server',['dist/scripts/run-lab4-migration-test.js']],
 ['recovery','server',['dist/scripts/run-lab4-recovery-test.js']],
 ['performance','server',['dist/scripts/run-lab4-dashboard-performance.js']],
 ['lab3-migration','server',['node_modules/vitest/vitest.mjs','run','tests/lab-03/migration.test.ts']],
 ['admin-integration','server',['node_modules/vitest/vitest.mjs','run','tests/lab-03/users-admin.integration.test.ts']],
 ['dashboard-api','server',['node_modules/vitest/vitest.mjs','run','tests/lab-04/requester-dashboard.api.test.ts','tests/lab-04/staff-dashboard.api.test.ts']],
];
if(selection==='plan'){console.log(JSON.stringify({label,checkout,branch,commit,trackedWorkingTreeClean:!status,checks:jobs.map(j=>j[0]),databaseScope:'Only the named, guarded disposable local schemas. No public-schema reset.'},null,2));process.exit(0)}
const selected=jobs.filter(j=>selection==='all'? !['e2e-list','dashboard-api'].includes(j[0]):j[0]===selection);
if(!selected.length)throw new Error('Unknown check');
// Keep subsequent review-branch commits separate, rather than overwriting the
// accepted output or refusing every legitimate rerun after an evidence commit.
const out=path.join(reportRoot,'docs/lab-04/evidence/compliance-20261029',label,...(label==='branch-compliance'?[commit.slice(0,7)]:[]));
mkdirSync(out,{recursive:true});
const manifestPath=path.join(out,'manifest.json');
const manifest=existsSync(manifestPath)?JSON.parse(readFileSync(manifestPath,'utf8')):{label,checkout,commit,branch,trackedWorkingTreeClean:!status,checks:{}};
if(manifest.commit!==commit)throw new Error('Refusing to mix source commits');
const environment={...process.env,FORCE_COLOR:'0',NO_COLOR:'1'};
for(const key of ['MIGRATION_TEST_DATABASE_URL','ADMIN_USERS_TEST_DATABASE_URL','LAB4_HISTORY_TEST_DATABASE_URL','LAB4_MIGRATION_TEST_DATABASE_URL','LAB4_PERFORMANCE_TEST_DATABASE_URL','LAB4_RECOVERY_SOURCE_URL','LAB4_RECOVERY_TARGET_URL','VITE_PRESERVE_SYMLINKS'])delete environment[key];
let database;
const envFile=path.join(checkout,'server/.env');
if(existsSync(envFile)){
 const requireServer=createRequire(path.join(checkout,'server/package.json'));
 const config=requireServer('dotenv').parse(readFileSync(envFile));
 if(config.DATABASE_URL)database=new URL(config.DATABASE_URL);
}
const disposable=schema=>{
 if(!database||!['postgres:','postgresql:'].includes(database.protocol)||!['localhost','127.0.0.1','[::1]'].includes(database.hostname))throw new Error('A local PostgreSQL URL is required; refusing external or public-schema resets.');
 const u=new URL(database);u.searchParams.set('schema',schema);return u.toString();
};
const redact=value=>{
 let text=String(value||'').replace(/(postgres(?:ql)?:\/\/)[^\s/]+@/gi,'$1[credentials-redacted]@');
 if(database?.password)text=text.replaceAll(database.password,'[password-redacted]');return text;
};
for(const [name,dir,args] of selected){
 const extra={};
 if(name==='e2e')Object.assign(extra,{E2E_DATABASE_URL:disposable('lab3_e2e'),E2E_API_PORT:process.env.LAB4_E2E_API_PORT||'18301',E2E_CLIENT_PORT:process.env.LAB4_E2E_CLIENT_PORT||'18173',E2E_REUSE_SERVERS:'false',E2E_SKIP_PRISMA_GENERATE:'true',PLAYWRIGHT_BROWSERS_PATH:process.env.LAB4_BROWSER_CACHE||'C:/Users/ASUS/AppData/Local/ms-playwright'});
 if(name==='lab3-migration')extra.MIGRATION_TEST_DATABASE_URL=disposable('lab3_migration_test');
 if(name==='admin-integration')extra.ADMIN_USERS_TEST_DATABASE_URL=disposable('lab3_admin_users_test');
 const startedAt=new Date().toISOString();
 console.log(`Starting ${label}/${name}; ${branch} ${commit.slice(0,7)}; tracked clean=${!status}`);
 // Use files rather than inherited capture pipes. On Windows a browser
 // webServer descendant can hold a pipe after Playwright itself has exited.
 // Await the actual command's exit, preserving every byte it wrote to disk.
 const spool=path.join(reportRoot,'tmp/lab4-verification-spool',`${label}-${name}-${Date.now()}`);
 mkdirSync(spool,{recursive:true});
 const stdoutPath=path.join(spool,'stdout.txt'),stderrPath=path.join(spool,'stderr.txt');
 const outFd=openSync(stdoutPath,'w'),errFd=openSync(stderrPath,'w');
 let outcome;
 try{
  outcome=await new Promise(resolve=>{
   const child=spawn(process.execPath,args,{cwd:path.resolve(checkout,dir),env:{...environment,...extra},stdio:['ignore',outFd,errFd],windowsHide:true});
   const timer=setTimeout(()=>{child.kill();resolve({status:null,error:new Error('Command exceeded 600000 ms')});},600000);
   child.once('error',error=>{clearTimeout(timer);resolve({status:null,error});});
   child.once('exit',(status,signal)=>{clearTimeout(timer);resolve({status,error:signal?new Error(`Command terminated by ${signal}`):undefined});});
  });
 }finally{closeSync(outFd);closeSync(errFd);}
 const r={...outcome,stdout:readFileSync(stdoutPath,'utf8'),stderr:readFileSync(stderrPath,'utf8')};
 const endedAt=new Date().toISOString();
 const after=git('status','--porcelain','--untracked-files=no');
 if(['main-083962c','branch-compliance'].includes(label)&&after)throw new Error('Tracked source files changed during verification; cannot sign off this run.');
 const stdout=redact(r.stdout),stderr=redact(r.stderr);
 const log=`Evidence kind: ${label}\nCheckout HEAD: ${commit}\nBranch: ${branch}\nTracked working tree clean: ${!status}\nWorking directory: ${checkout}\nCommand directory: ${dir}\nCommand: node ${args.join(' ')}\nNode: ${process.version}\nInvocation environment (non-secret): ${JSON.stringify(Object.fromEntries(Object.entries(extra).filter(([k])=>!k.includes('DATABASE_URL'))))}\nDependency provenance: installed dependencies copied from the existing workspace; lockfiles are tracked in this checkout.\nStarted UTC: ${startedAt}\n\nSTDOUT\n${stdout}\nSTDERR\n${stderr}\nCompleted UTC: ${endedAt}\nExit code: ${r.status}\n${r.error?`Process error: ${redact(r.error.message)}\n`:''}`;
 // Separate pure-suite invocations may finish concurrently. Merge the newest
 // manifest before saving so neither successful run is lost from the index.
 if(existsSync(manifestPath)){
  const latest=JSON.parse(readFileSync(manifestPath,'utf8'));
  if(latest.commit!==commit)throw new Error('Evidence source changed during execution');
  Object.assign(manifest.checks,latest.checks);
 }
 const previous=manifest.checks[name];
 if(previous){const archive=path.join(out,'attempts');mkdirSync(archive,{recursive:true});writeFileSync(path.join(archive,`${name}-${previous.startedAt.replaceAll(':','-')}.txt`),readFileSync(path.join(out,previous.file)));}
 const file=`${name}-full.txt`;writeFileSync(path.join(out,file),log);
 manifest.checks[name]={startedAt,endedAt,file,exitCode:r.status,passed:r.status===0&&!r.error,sha256:createHash('sha256').update(log).digest('hex'),testListingOnly:name==='e2e-list'};
 writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
 console.log(`${label}/${name}: exit ${r.status}\n${stdout.split(/\r?\n/).filter(l=>/Test Files|Tests |passed \(|Total:/.test(l)).join('\n')}`);
 if(r.status!==0||r.error){console.log(stderr.slice(-1800));process.exitCode=1;break;}
}
