// Copy original captures byte-for-byte into the labsheet's required directories.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const target='artifacts/lab-04/screenshots';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const entries=[];
for(const viewport of ['desktop','tablet','mobile']) {
  for(const [screen,group] of [['staff-dashboard','staff-dashboard'],['requester-dashboard','requester-dashboard'],['staff-ticket-actions','actions-taken'],['requester-ticket-actions','actions-taken']]) {
    const source=`docs/lab-04/evidence/main/${viewport}/${screen}.png`;
    const destination=`${target}/${group}/${screen}-${viewport}.png`;
    const bytes=readFileSync(path.join(root,source));
    const output=path.join(root,destination);
    if(existsSync(output)&&hash(readFileSync(output))!==hash(bytes))throw new Error(`Refusing to overwrite different evidence: ${destination}`);
    mkdirSync(path.dirname(output),{recursive:true});
    writeFileSync(output,bytes);
    entries.push({source,destination,sha256:hash(bytes),viewport});
  }
}
const provenance={
  purpose:'Labsheet section 12 path compliance; preserved original captures, not a new browser run',
  sourceRecord:'docs/lab-04/evidence/main/README.md',
  originalCaptureTime:'Retained in the dated source record; copy time is not capture time',
  transformations:'None. Source and destination SHA-256 values are identical.',
  entries,
};
writeFileSync(path.join(root,target,'provenance.json'),JSON.stringify(provenance,null,2)+'\n');
console.log(`Verified ${entries.length} byte-identical original captures in the three required directories.`);
