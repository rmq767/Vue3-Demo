import{c as X,d as ne,e as oe,f as se,g as ae,h as le,j as re,k as Y,l as ie,m as me,n as ue,o as ce}from"./element-plus-Cq2ytW1q.js";import{C as de}from"./ChatInput-Cym6AKgT.js";import{O as K,Q as pe,R as fe,S as ge}from"./@element-plus-D5pNfDjj.js";import{d as z,c as k,a as i,S as r,P as v,L as d,o as f,u as V,G as A,j as R,R as H,v as x,Q as S,r as j,w as J,K as E,a7 as W,n as _e,l as Q}from"./@vue-G_DW9frV.js";import{_ as N}from"./plugin-vueexport-helper-DlAUqK2U.js";import{M as he}from"./markdown-it-DCpB9EU-.js";import{p as ye}from"./dompurify-CEVJ7K31.js";import{f as ke}from"./@microsoft-IOhmRd8d.js";import"./lodash-es-CVJ_Bk8S.js";import"./@vueuse-OBgtyWRh.js";import"./@sxzz-D_chPuIy.js";import"./@ctrl-r5W6hzzQ.js";import"./dayjs-ByrSNtky.js";import"./@turf-CI0Jh7zo.js";import"./async-validator-9PlIezaS.js";import"./memoize-one-BdPwpGay.js";import"./normalize-wheel-es-BQoi3Ox2.js";import"./@floating-ui-D0iZPv2f.js";import"./vue-router-D-PTvgkm.js";import"./axios-NIGUFBhG.js";import"./mdurl-k9Sl0PQj.js";import"./uc.micro-kMc2yuuw.js";import"./entities-DOYUvOU8.js";import"./linkify-it-B01Iq_O2.js";import"./punycode.js-Dj65hjkv.js";const ve={class:"task-form"},be={class:"form-title"},$e={name:"TaskForm"},Te=z({...$e,props:{model:{},highlightField:{}},setup(n){return(t,e)=>{const o=X,s=se,a=oe,m=le,p=ae,_=re,c=ne;return f(),k("div",ve,[i("h3",be,[r(o,null,{default:d(()=>[r(V(K))]),_:1}),e[6]||(e[6]=v(" 演示表单 ",-1))]),r(c,{model:t.model,"label-position":"top",class:"form-body"},{default:d(()=>[r(a,{label:"姓名"},{default:d(()=>[r(s,{modelValue:t.model.name,"onUpdate:modelValue":e[0]||(e[0]=l=>t.model.name=l),placeholder:"请输入姓名",class:A({"field-highlight":t.highlightField==="name"})},null,8,["modelValue","class"])]),_:1}),r(a,{label:"邮箱"},{default:d(()=>[r(s,{modelValue:t.model.email,"onUpdate:modelValue":e[1]||(e[1]=l=>t.model.email=l),placeholder:"请输入邮箱",class:A({"field-highlight":t.highlightField==="email"})},null,8,["modelValue","class"])]),_:1}),r(a,{label:"手机"},{default:d(()=>[r(s,{modelValue:t.model.phone,"onUpdate:modelValue":e[2]||(e[2]=l=>t.model.phone=l),placeholder:"请输入手机号",class:A({"field-highlight":t.highlightField==="phone"})},null,8,["modelValue","class"])]),_:1}),r(a,{label:"主题"},{default:d(()=>[r(p,{modelValue:t.model.topic,"onUpdate:modelValue":e[3]||(e[3]=l=>t.model.topic=l),placeholder:"请选择主题",class:A(["w-full",{"field-highlight":t.highlightField==="topic"}])},{default:d(()=>[r(m,{label:"产品咨询",value:"产品咨询"}),r(m,{label:"技术支持",value:"技术支持"}),r(m,{label:"商务合作",value:"商务合作"}),r(m,{label:"投诉建议",value:"投诉建议"}),r(m,{label:"其他",value:"其他"})]),_:1},8,["modelValue","class"])]),_:1}),r(a,{label:"留言"},{default:d(()=>[r(s,{modelValue:t.model.message,"onUpdate:modelValue":e[4]||(e[4]=l=>t.model.message=l),type:"textarea",rows:3,placeholder:"请输入留言内容",class:A({"field-highlight":t.highlightField==="message"})},null,8,["modelValue","class"])]),_:1}),r(a,null,{default:d(()=>[r(_,{modelValue:t.model.agree,"onUpdate:modelValue":e[5]||(e[5]=l=>t.model.agree=l),class:A({"field-highlight":t.highlightField==="agree"})},{default:d(()=>[...e[7]||(e[7]=[v(" 我已阅读并同意《用户协议》 ",-1)])]),_:1},8,["modelValue","class"])]),_:1})]),_:1},8,["model"])])}}}),Se=N(Te,[["__scopeId","data-v-8d169e49"]]),we={class:"doc-panel"},Ee={class:"panel-title"},Oe={key:0,class:"doc-empty"},Me={class:"doc-meta"},Ae={class:"meta-row"},Ve={class:"value"},Re={class:"meta-row"},je={class:"value"},Ce={key:0,class:"meta-row"},xe={key:1,class:"meta-row"},Pe=["innerHTML"],De={name:"DocPanel"},Ie=z({...De,props:{model:{}},setup(n){const t=n,e=new he({html:!1,linkify:!0,breaks:!0}),o=R(()=>t.model.content?ye.sanitize(e.render(t.model.content)):"");return(s,a)=>{const m=X,p=Y;return f(),k("div",we,[i("h3",Ee,[r(m,null,{default:d(()=>[r(V(pe))]),_:1}),a[0]||(a[0]=v(" 文档工作区 ",-1))]),!s.model.content&&!s.model.title?(f(),k("div",Oe,[r(m,{size:40,color:"#d9d9d9"},{default:d(()=>[r(V(K))]),_:1}),a[1]||(a[1]=i("p",null,"让右侧 Agent 生成文档，内容会实时显示在这里",-1))])):(f(),k(H,{key:1},[i("div",Me,[i("div",Ae,[a[2]||(a[2]=i("span",{class:"label"},"标题",-1)),i("span",Ve,S(s.model.title||"—"),1)]),i("div",Re,[a[3]||(a[3]=i("span",{class:"label"},"文件名",-1)),i("span",je,S(s.model.filename||"—"),1)]),s.model.savedPath?(f(),k("div",Ce,[a[4]||(a[4]=i("span",{class:"label"},"已保存",-1)),r(p,{type:"success",size:"small",class:"path-tag"},{default:d(()=>[v(S(s.model.savedPath),1)]),_:1})])):s.model.saving?(f(),k("div",xe,[a[6]||(a[6]=i("span",{class:"label"},"状态",-1)),r(p,{type:"primary",size:"small"},{default:d(()=>[...a[5]||(a[5]=[v("正在写入桌面…",-1)])]),_:1})])):x("",!0)]),i("div",{class:"doc-preview",innerHTML:o.value},null,8,Pe)],64))])}}}),Le=N(Ie,[["__scopeId","data-v-d813cf23"]]),Fe={class:"agent-trace"},ze={class:"trace-header"},Ne={key:0,class:"empty-state"},Ue={class:"example-tasks"},Be={class:"step-content"},He={key:0,class:"step-detail"},Je={key:1,class:"step-detail"},Ge={name:"AgentTrace"},qe=z({...Ge,props:{steps:{},isRunning:{type:Boolean},status:{},examples:{}},emits:["useExample"],setup(n){const t=n,e=j(),o=R(()=>t.examples??["帮我填写表单：姓名张三，邮箱 zhangsan@example.com","填写表单，姓名李明，手机13800138000，主题技术支持，勾选同意","重置表单"]),s=R(()=>{switch(t.status){case"done":return"success";case"error":return"danger";case"aborted":return"warning";default:return"info"}}),a=R(()=>{switch(t.status){case"done":return"已完成";case"error":return"出错";case"aborted":return"已中止";default:return"空闲"}});function m(c){switch(c){case"thought":return"info";case"tool_call":return"primary";case"tool_result":return"success";case"error":return"danger";case"final":return"warning";default:return"info"}}function p(c){switch(c){case"thought":return"💭";case"tool_call":return"🔧";case"tool_result":return"✅";case"error":return"❌";case"final":return"🎉";default:return}}function _(c){const l=new Date(c);return`${l.getHours().toString().padStart(2,"0")}:${l.getMinutes().toString().padStart(2,"0")}:${l.getSeconds().toString().padStart(2,"0")}`}return J(()=>t.steps.length,async()=>{await _e(),e.value&&(e.value.scrollTop=e.value.scrollHeight)}),(c,l)=>{const O=X,g=Y,b=me,h=ie;return f(),k("div",Fe,[i("div",ze,[i("h3",null,[r(O,null,{default:d(()=>[r(V(fe))]),_:1}),l[0]||(l[0]=v(" 执行轨迹 ",-1))]),c.isRunning?(f(),E(g,{key:0,type:"primary",size:"small",effect:"dark"},{default:d(()=>[...l[1]||(l[1]=[i("span",{class:"running-dot"},null,-1),v(" 运行中 ",-1)])]),_:1})):c.steps.length?(f(),E(g,{key:1,type:s.value,size:"small"},{default:d(()=>[v(S(a.value),1)]),_:1},8,["type"])):x("",!0)]),i("div",{class:"trace-body",ref_key:"traceBodyRef",ref:e},[c.steps.length===0&&!c.isRunning?(f(),k("div",Ne,[r(O,{size:40,color:"#d9d9d9"},{default:d(()=>[r(V(ge))]),_:1}),l[3]||(l[3]=i("p",null,"输入任务描述，Agent 将自动执行",-1)),i("div",Ue,[l[2]||(l[2]=i("span",{class:"example-label"},"试试：",-1)),(f(!0),k(H,null,W(o.value,u=>(f(),E(g,{key:u,class:"example-tag",effect:"plain",onClick:$=>c.$emit("useExample",u)},{default:d(()=>[v(S(u),1)]),_:2},1032,["onClick"]))),128))])])):(f(),E(h,{key:1},{default:d(()=>[(f(!0),k(H,null,W(c.steps,u=>(f(),E(b,{key:u.id,type:m(u.kind),icon:p(u.kind),timestamp:_(u.timestamp),placement:"top"},{default:d(()=>[i("div",{class:A(["step-card",u.kind])},[i("div",Be,S(u.content),1),u.toolCall&&u.kind==="tool_call"?(f(),k("div",He,[i("code",null,S(u.toolCall.name),1),i("pre",null,S(JSON.stringify(u.toolCall.arguments,null,2)),1)])):x("",!0),u.toolResult&&u.kind==="tool_result"?(f(),k("div",Je,[r(g,{type:u.toolResult.ok?"success":"danger",size:"small"},{default:d(()=>[v(S(u.toolResult.ok?"成功":"失败"),1)]),_:2},1032,["type"])])):x("",!0)],2)]),_:2},1032,["type","icon","timestamp"]))),128)),c.isRunning?(f(),E(b,{key:0,type:"primary",hollow:!0},{default:d(()=>[...l[4]||(l[4]=[i("div",{class:"step-card thinking"},[i("div",{class:"loading-dots"},[i("span"),i("span"),i("span")])],-1)])]),_:1})):x("",!0)]),_:1}))],512)])}}}),Xe=N(qe,[["__scopeId","data-v-4ab9582b"]]);function We(n){const{messages:t,signal:e,model:o,onToken:s,onDone:a,onError:m}=n;let p="",_=!1;ke("http://localhost:3001/api/agent/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:t,model:o||""}),signal:e,onmessage(c){if(!_){if(c.event==="done"||c.data==="[DONE]"){_=!0,a(p);return}try{const l=JSON.parse(c.data);if(l.error){_=!0,m(new Error(l.error));return}if(l.messageId&&!l.token){_=!0,a(p);return}l.token&&(p+=l.token,s(l.token))}catch{}}},onerror(c){throw _||(_=!0,m(c instanceof Error?c:new Error(String(c)))),c},openWhenHidden:!0})}const B=8,Z=/```tool_call\s*\n([\s\S]*?)\n\s*```/g;function ee(){return crypto.randomUUID()}function Qe(n){const t=[];let e;const o=new RegExp(Z.source,"g");for(;(e=o.exec(n))!==null;)try{const s=JSON.parse(e[1].trim());s.name&&t.push({id:ee(),name:s.name,arguments:s.arguments||{}})}catch{}return t}function Ye(n){return n.replace(Z,"").trim()}function Ke(n){const t=j([]),e=j("idle"),o=j("");let s=null,a=!1;function m(g){t.value.push({...g,id:ee(),timestamp:Date.now()})}function p(g){return new Promise((b,h)=>{o.value="",We({messages:g,signal:s.signal,onToken(u){o.value+=u},onDone(u){b(u)},onError(u){h(u)}})})}async function _(g,b){m({kind:"tool_call",content:`${g.name}(${JSON.stringify(g.arguments)})`,toolCall:g});const h=await b.executeTool(g.name,g.arguments);return m({kind:h.ok?"tool_result":"error",content:h.message,toolResult:h}),h}async function c(g){O(),e.value="thinking",a=!1,s=new AbortController;const b=n(),h=[{role:"system",content:b.buildSystemPrompt()},{role:"user",content:g}];let u=0;try{for(;u<B&&!a;){u++;const $=await p(h);if(a)break;const M=Ye($),P=Qe($);if(M&&m({kind:"thought",content:M}),h.push({role:"assistant",content:$}),P.length===0){m({kind:"final",content:M||"任务已完成"}),e.value="done";break}e.value="executing";const D=P[0],C=await _(D,b);if(D.name==="finish"){m({kind:"final",content:C.message}),e.value="done";break}h.push({role:"user",content:`[TOOL_RESULT] ${JSON.stringify({ok:C.ok,message:C.message})}`}),e.value="thinking"}u>=B&&e.value!=="done"&&(m({kind:"error",content:`已达到最大执行轮次 (${B})，任务可能未完成`}),e.value="error")}catch($){if(a)return;m({kind:"error",content:`执行出错: ${$.message||String($)}`}),e.value="error"}}function l(){a=!0,s&&(s.abort(),s=null),e.value="aborted",m({kind:"error",content:"用户中止了任务执行"})}function O(){t.value=[],e.value="idle",o.value="",s&&(s.abort(),s=null)}return{steps:t,status:e,currentThought:o,run:c,abort:l,reset:O}}function te(n){return n.map(t=>{const e=Object.entries(t.parameters.properties||{}).map(([o,s])=>{var m;const a=(m=t.parameters.required)!=null&&m.includes(o)?" (必填)":" (可选)";return`    - ${o}${a}: ${s.description||s.type}`}).join(`
`);return`### ${t.name}
${t.description}
参数:
${e||"    无参数"}`}).join(`

`)}function Ze(){return`你是一个智能表单助手 Agent，能够通过调用工具来自动完成用户指定的表单填写任务。

## 可用工具

${te(rt)}

## 输出格式

你的回复必须遵循以下格式：

1. **思考部分**：用自然语言描述你的分析和计划（直接输出文本）
2. **工具调用**：当需要执行操作时，使用以下代码块格式：

\`\`\`tool_call
{"name": "工具名", "arguments": {"参数名": "参数值"}}
\`\`\`

## 重要规则

- 每次回复中只能调用 **一个** 工具
- 调用工具后，你会收到工具执行结果，然后根据结果决定下一步
- 所有字段填写完毕后，**必须** 调用 \`finish\` 工具结束任务
- 如果用户没有指定某个字段，可以跳过不填
- topic 字段可选值: 产品咨询、技术支持、商务合作、投诉建议、其他
- agree 字段值为 true/false（布尔值）
- 不要编造用户没有提供的信息

## 示例

用户: 帮我填写表单，姓名张三，邮箱 zhangsan@example.com

助手:
好的，我来帮你填写表单。首先填写姓名字段。

\`\`\`tool_call
{"name": "fill_field", "arguments": {"field": "name", "value": "张三"}}
\`\`\`

[收到工具结果: 已设置 name = "张三"]

接下来填写邮箱。

\`\`\`tool_call
{"name": "fill_field", "arguments": {"field": "email", "value": "zhangsan@example.com"}}
\`\`\`

[收到工具结果: 已设置 email = "zhangsan@example.com"]

所有指定字段已填写完毕，任务完成。

\`\`\`tool_call
{"name": "finish", "arguments": {"summary": "已填写姓名(张三)和邮箱(zhangsan@example.com)"}}
\`\`\`
`}const L=["name","email","phone","topic","message","agree"],et=500,tt=["产品咨询","技术支持","商务合作","投诉建议","其他"],nt={name:"fill_field",description:"填写表单中的单个字段",parameters:{type:"object",properties:{field:{type:"string",description:`字段名，可选值: ${L.join(", ")}`,enum:L},value:{type:"string | boolean",description:"要填入的值"}},required:["field","value"]},execute(n,t){const e=t.formModel,{field:o,value:s}=n;if(!L.includes(o))return{ok:!1,message:`未知字段 "${o}"，可用字段: ${L.join(", ")}`};if(o==="agree"){const m=s===!0||s==="true"||s==="是";return e.agree=m,{ok:!0,message:`已设置 ${o} = ${m}`,patch:{agree:m}}}const a=String(s).slice(0,et);if(o==="topic"){const p=tt.find(_=>_.includes(a)||a.includes(_))||a;return e.topic=p,{ok:!0,message:`已设置 topic = "${p}"`,patch:{topic:p}}}return e[o]=a,{ok:!0,message:`已设置 ${o} = "${a}"`,patch:{[o]:a}}}},ot={name:"read_form",description:"读取当前表单所有字段的值",parameters:{type:"object",properties:{}},execute(n,t){const o={...t.formModel};return{ok:!0,message:`当前表单状态: ${JSON.stringify(o,null,2)}`}}},st={name:"submit_form",description:"提交表单（模拟提交，不会真正发送请求）",parameters:{type:"object",properties:{}},execute(n,t){const e=t.formModel,o=[];return e.name.trim()||o.push("姓名不能为空"),e.email.trim()||o.push("邮箱不能为空"),e.agree||o.push("需要勾选同意协议"),o.length>0?{ok:!1,message:`表单校验失败: ${o.join("; ")}`}:{ok:!0,message:"表单已成功提交（模拟）！"}}},at={name:"reset_form",description:"重置表单为初始空状态",parameters:{type:"object",properties:{}},execute(n,t){const e=t.formModel;return e.name="",e.email="",e.phone="",e.topic="",e.message="",e.agree=!1,{ok:!0,message:"表单已重置为空",patch:{name:"",email:"",phone:"",topic:"",message:"",agree:!1}}}},lt={name:"finish",description:"标记任务已完成，终止 Agent 执行循环",parameters:{type:"object",properties:{summary:{type:"string",description:"任务完成摘要"}},required:["summary"]},execute(n){return{ok:!0,message:n.summary||"任务已完成"}}},G={fill_field:nt,read_form:ot,submit_form:st,reset_form:at,finish:lt},rt=Object.values(G).map(n=>({name:n.name,description:n.description,parameters:n.parameters}));async function it(n,t,e){const o=G[n];if(!o)return{ok:!1,message:`未知工具 "${n}"，可用工具: ${Object.keys(G).join(", ")}`};try{return await o.execute(t,e)}catch(s){return{ok:!1,message:`工具执行异常: ${s.message||String(s)}`}}}function mt(n){return{mode:"form",buildSystemPrompt:Ze,executeTool:(t,e)=>it(t,e,{formModel:n})}}function ut(){return`你是一个智能文档生成助手 Agent，能够根据用户需求生成 Markdown 文档，并把它保存到本机桌面。

## 可用工具

${te(_t)}

## 输出格式

你的回复必须遵循以下格式：

1. **思考部分**：用自然语言描述你的分析和计划（直接输出文本）
2. **工具调用**：当需要执行操作时，使用以下代码块格式：

\`\`\`tool_call
{"name": "工具名", "arguments": {"参数名": "参数值"}}
\`\`\`

## 重要规则

- 每次回复中只能调用 **一个** 工具
- 调用工具后，你会收到工具执行结果，然后根据结果决定下一步
- 标准流程：先用 \`create_document\` 生成 Markdown 草稿，再用 \`save_document\` 保存到桌面，最后调用 \`finish\` 结束
- \`create_document\` 的 content 必须是完整、格式良好的 Markdown（合理使用标题、列表、表格等）
- filename 必须以 \`.md\` 结尾；用户没指定时，根据标题生成一个简短的英文或拼音文件名
- 文档内容要围绕用户需求认真撰写，不要偷懒只写一两句话
- 任务全部完成后，**必须** 调用 \`finish\` 工具结束任务

## 示例

用户: 帮我生成一份本周工作总结，保存为 weekly-report.md

助手:
好的，我先根据你的需求撰写一份本周工作总结的 Markdown 文档。

\`\`\`tool_call
{"name": "create_document", "arguments": {"title": "本周工作总结", "filename": "weekly-report.md", "content": "# 本周工作总结\\n\\n## 一、本周完成\\n- ...\\n\\n## 二、下周计划\\n- ..."}}
\`\`\`

[收到工具结果: 已生成文档草稿「本周工作总结」...]

草稿已生成，现在保存到桌面。

\`\`\`tool_call
{"name": "save_document", "arguments": {}}
\`\`\`

[收到工具结果: 已保存到桌面: C:\\Users\\xxx\\Desktop\\weekly-report.md]

文档已成功保存到桌面，任务完成。

\`\`\`tool_call
{"name": "finish", "arguments": {"summary": "已生成《本周工作总结》并保存到桌面 weekly-report.md"}}
\`\`\`
`}const ct="http://localhost:3001/api/agent";function F(n){let t=String(n).replace(/[\\/:*?"<>|]/g,"_").replace(/\.\.+/g,"_").trim();return t||(t="document"),t.toLowerCase().endsWith(".md")||(t+=".md"),t}const dt={name:"create_document",description:"创建或更新 Markdown 文档草稿（标题、文件名、正文），内容会实时显示在左侧预览区",parameters:{type:"object",properties:{title:{type:"string",description:"文档标题"},filename:{type:"string",description:"保存到桌面的文件名，需以 .md 结尾，例如 weekly-report.md（可选，缺省时根据标题生成）"},content:{type:"string",description:"Markdown 格式的正文内容"}},required:["title","content"]},execute(n,t){const e=t.docModel;return n.title!=null&&(e.title=String(n.title)),n.content!=null&&(e.content=String(n.content)),n.filename?e.filename=F(String(n.filename)):e.filename||(e.filename=F(`${e.title||"document"}.md`)),e.content.trim()?(e.savedPath="",{ok:!0,message:`已生成文档草稿「${e.title}」，共 ${e.content.length} 个字符，文件名 ${e.filename}`}):{ok:!1,message:"文档正文不能为空"}}},pt={name:"save_document",description:"将当前文档草稿保存到本机桌面（通过后端写入真实文件），返回保存的绝对路径",parameters:{type:"object",properties:{filename:{type:"string",description:"可选，覆盖保存的文件名（.md）"}}},async execute(n,t){const e=t.docModel;if(!e.content.trim())return{ok:!1,message:"没有可保存的文档内容，请先调用 create_document 生成草稿"};n.filename&&(e.filename=F(String(n.filename))),e.filename||(e.filename=F(`${e.title||"document"}.md`)),e.saving=!0;try{const o=await fetch(`${ct}/save-document`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename:e.filename,title:e.title,content:e.content})}),s=await o.json().catch(()=>({}));return!o.ok||!s.ok?{ok:!1,message:`保存失败: ${s.error||o.statusText}`}:(e.savedPath=s.path,{ok:!0,message:`已保存到桌面: ${s.path}`})}catch(o){return{ok:!1,message:`保存请求失败（请确认 agent-server 已启动）: ${o.message||String(o)}`}}finally{e.saving=!1}}},ft={name:"read_document",description:"读取当前文档草稿的标题、文件名与正文",parameters:{type:"object",properties:{}},execute(n,t){const e=t.docModel;return e.content?{ok:!0,message:`标题: ${e.title}
文件名: ${e.filename}
正文:
${e.content}`}:{ok:!0,message:"当前没有文档草稿"}}},gt={name:"finish",description:"标记任务已完成，终止 Agent 执行循环",parameters:{type:"object",properties:{summary:{type:"string",description:"任务完成摘要"}},required:["summary"]},execute(n){return{ok:!0,message:n.summary||"任务已完成"}}},q={create_document:dt,save_document:pt,read_document:ft,finish:gt},_t=Object.values(q).map(n=>({name:n.name,description:n.description,parameters:n.parameters}));async function ht(n,t,e){const o=q[n];if(!o)return{ok:!1,message:`未知工具 "${n}"，可用工具: ${Object.keys(q).join(", ")}`};try{return await o.execute(t,e)}catch(s){return{ok:!1,message:`工具执行异常: ${s.message||String(s)}`}}}function yt(n){return{mode:"doc",buildSystemPrompt:ut,executeTool:(t,e)=>ht(t,e,{docModel:n})}}const kt={class:"agent-page"},vt={class:"left-panel"},bt={class:"mode-switch"},$t={class:"right-panel"},Tt={class:"input-wrapper"},St={name:"Agent"},wt=z({...St,setup(n){const t=j("form"),e=Q({name:"",email:"",phone:"",topic:"",message:"",agree:!1}),o=Q({title:"",filename:"",content:"",savedPath:"",saving:!1}),s=mt(e),a=yt(o),m=()=>t.value==="form"?s:a,{steps:p,status:_,run:c,abort:l,reset:O}=Ke(m),g=R(()=>_.value==="thinking"||_.value==="executing"),b=["帮我填写表单：姓名张三，邮箱 zhangsan@example.com","填写表单，姓名李明，手机13800138000，主题技术支持，勾选同意","重置表单"],h=["帮我生成一份本周工作总结，保存为 weekly-report.md","生成一份 Vue3 项目 README 文档，保存到桌面","写一份前端性能优化清单的 Markdown 文档"],u=R(()=>t.value==="form"?b:h);J(t,()=>{O()});const $=j(null);let M=null;J(()=>p.value.length,()=>{var y;const T=p.value[p.value.length-1];if((T==null?void 0:T.kind)==="tool_result"&&((y=T.toolResult)!=null&&y.patch)){const w=Object.keys(T.toolResult.patch);w.length>0&&($.value=w[0],M&&clearTimeout(M),M=setTimeout(()=>{$.value=null},1500))}});function P(T){var I;const y=T.find(U=>U.type==="text"),w=(I=y==null?void 0:y.text)==null?void 0:I.trim();w&&c(w)}function D(){l()}function C(T){c(T)}return(T,y)=>{const w=ce,I=ue;return f(),k("div",kt,[i("aside",vt,[i("div",bt,[r(I,{modelValue:t.value,"onUpdate:modelValue":y[0]||(y[0]=U=>t.value=U),size:"small",disabled:g.value},{default:d(()=>[r(w,{value:"form"},{default:d(()=>[...y[1]||(y[1]=[v("表单 Agent",-1)])]),_:1}),r(w,{value:"doc"},{default:d(()=>[...y[2]||(y[2]=[v("文档 Agent",-1)])]),_:1})]),_:1},8,["modelValue","disabled"])]),t.value==="form"?(f(),E(Se,{key:0,model:e,"highlight-field":$.value},null,8,["model","highlight-field"])):(f(),E(Le,{key:1,model:o},null,8,["model"]))]),i("main",$t,[r(Xe,{steps:V(p),"is-running":g.value,status:V(_),examples:u.value,onUseExample:C},null,8,["steps","is-running","status","examples"]),i("div",Tt,[r(de,{"is-streaming":g.value,onSend:P,onClose:D},null,8,["is-streaming"])])])])}}}),Yt=N(wt,[["__scopeId","data-v-256a3c1c"]]);export{Yt as default};
