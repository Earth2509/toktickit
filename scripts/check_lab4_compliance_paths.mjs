import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const requireServer=createRequire(path.join(root,'server/package.json'));
const ts=requireServer('typescript');
const git=(...args)=>{
 const r=spawnSync('git',['-c',`safe.directory=${root.replaceAll('\\','/')}`,...args],{cwd:root,encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);return r.stdout;
};
const cases=(file,text)=>{
 const src=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true);
 const entries=[];
 const walk=node=>{
  if(ts.isCallExpression(node)&&['it','test'].includes(node.expression.getText(src))&&node.arguments.length>1&&ts.isStringLiteral(node.arguments[0])){
   const callback=node.arguments.at(-1);
   entries.push([node.arguments[0].text,ts.createPrinter({removeComments:true}).printNode(ts.EmitHint.Unspecified,callback,src)]);
  }
  ts.forEachChild(node,walk);
 };walk(src);return entries;
};
const checkMoved=(oldFile,newFiles)=>{
 const before=cases(oldFile,git('show',`083962c:${oldFile}`));
 const after=newFiles.flatMap(f=>cases(f,fs.readFileSync(path.join(root,f),'utf8')));
 assert.equal(after.length,before.length,'Do not add duplicates or lose a case');
 assert.deepEqual(new Map(after),new Map(before),'Every original callback must be retained verbatim apart from formatting/comments');
 return before.length;
};
const apiCases=checkMoved('server/tests/lab-04/dashboards.api.test.ts',['server/tests/lab-04/requester-dashboard.api.test.ts','server/tests/lab-04/staff-dashboard.api.test.ts']);
const browserCases=checkMoved('e2e/lab-04/actions-taken-flow.spec.ts',['e2e/lab-04/actions-taken-flow.spec.ts','e2e/lab-04/ticket-resolution.spec.ts']);
const originalHelper=git('show','083962c:e2e/lab-04/actions-taken-flow.spec.ts').split('async function signIn')[1].split('\ntest(')[0].trim();
const currentHelper=fs.readFileSync(path.join(root,'e2e/lab-04/support.ts'),'utf8').split('async function signIn')[1].trim();
assert.equal(currentHelper,originalHelper,'Shared sign-in helper behaviour changed');
const provenance=JSON.parse(fs.readFileSync(path.join(root,'artifacts/lab-04/screenshots/provenance.json'),'utf8'));
for(const entry of provenance.entries){
 const digest=f=>createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex');
 assert.equal(digest(entry.source),entry.sha256);assert.equal(digest(entry.destination),entry.sha256);
}
assert.equal(provenance.entries.length,12);
const result={unchangedApiCases:apiCases,unchangedBrowserCases:browserCases,byteIdenticalScreenshots:provenance.entries.length,requiredPathsPresent:true};
console.log(JSON.stringify(result,null,2));
