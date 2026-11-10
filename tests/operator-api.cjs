// Exercise actual route handlers with disposable in-process dependencies.
// No production accounts, external requests, payments, or persistent fixtures.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
let authUser = null;
let inserted = [];
let rpcCall;
const db = {
  from(table) {
    return {
      select() { return this; }, eq() { return this; },
      maybeSingle: async () => ({ data: null, error: null }),
      insert: async value => { inserted.push({table,value}); return { error:null }; }
    };
  },
  rpc: async (name,args) => { rpcCall={name,args}; return {data:{consumed:true},error:null}; }
};
const modules = new Map();
function load(file) {
  const filename = path.resolve(file);
  if(modules.has(filename)) return modules.get(filename).exports;
  const module = {exports:{}}; modules.set(filename,module);
  const code = ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const localRequire = name => {
    if(name==='server-only') return {};
    if(name==='@/lib/supabase/server') return {createServerAuthClient:()=>({auth:{getUser:async()=>({data:{user:authUser},error:null})}}),createSupabaseAdminClient:()=>db};
    if(name==='@/lib/rate-limit') return {allowRequest:()=>true};
    if(name.startsWith('@/')) return load('src/'+name.slice(2)+'.ts');
    return require(name);
  };
  vm.runInThisContext('(function(require,module,exports){'+code+'\n})',{filename})(localRequire,module,module.exports);
  return module.exports;
}
const userId='a131e6fb-3341-45ba-919a-e43ec2580961';
const otherId='a131e6fb-3341-45ba-919a-e43ec2580962';
const req=(url,body,token='test')=>new Request('https://www.ilmioinvito.com'+url,{method:body===undefined?'GET':'POST',headers:{...(token?{authorization:'Bearer '+token}:{}),'content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
(async()=>{
 const context=load('src/lib/operators/server.ts');
 assert.equal((await context.operatorContext(req('/api/operators',undefined,''))).response.status,401);
 assert.equal((await context.operatorContext(req('/api/operators'))).response.status,401);
 authUser={id:userId,email:'qa@example.invalid',app_metadata:{},user_metadata:{app_role:'admin',project_owner:true}};
 assert.equal((await context.operatorContext(req('/api/admin/operators'),true)).response.status,403,'User-editable metadata cannot grant admin');
 authUser.app_metadata={app_role:'admin',project_owner:true};
 assert.equal((await context.operatorContext(req('/api/admin/operators'),true)).user.id,userId);
 authUser.app_metadata={};
 const accounts=load('src/app/api/operators/route.ts');
 assert.equal((await accounts.POST(req('/api/operators',{}))).status,400);
 const registration={full_name:'Test',company_name:'Test SRL',phone:'123',vat_number:'TEST',billing_address:'Test',accepted:true,status:'active',user_id:otherId,event_count:1000};
 assert.equal((await accounts.POST(req('/api/operators',registration))).status,200);
 assert.equal(inserted.length,1);
 assert.equal(inserted[0].value.status,'pending','Client cannot approve their registration');
 assert.equal(inserted[0].value.user_id,userId,'User id must come from verified token');
 assert.equal(inserted[0].value.event_count,undefined,'Registration cannot grant credits');
 const publishing=load('src/app/api/operators/publish/route.ts');
 assert.equal((await publishing.POST(req('/api/operators/publish',{invitationId:'invalid'}))).status,400);
 assert.equal((await publishing.POST(req('/api/operators/publish',{invitationId:otherId,operatorId:otherId}))).status,200);
 assert.equal(rpcCall.name,'publish_operator_invitation');
 assert.equal(rpcCall.args.target_operator,userId,'Publication owner must come from verified token');
 const admins=load('src/app/api/admin/operators/route.ts');
 assert.equal((await admins.POST(req('/api/admin/operators',{operatorId:userId,action:'grant'}))).status,403);
 console.log('15 API checks passed: verified identity, admin access, pending registration, immutable credit authority and publication routing.');
})().catch(error=>{console.error(error);process.exitCode=1;});
