import{a as w}from"./element-plus-t8j70jxJ.js";import{A as b}from"./ajv-BKO59nDp.js";import{z as l,A as v,E as f}from"./@codemirror-S2Qcb8c0.js";import{b as g}from"./codemirror-IKSWjZHF.js";import{r as p,s as _,w as I,k as y,U as h,d as O,e as J,c as A,a,R,J as k,P as N,o as E,O as $}from"./@vue-AhIeOBdH.js";import{_ as B}from"./plugin-vueexport-helper-DlAUqK2U.js";import"./lodash-es-CVJ_Bk8S.js";import"./@vueuse-CAc1CHwG.js";import"./@element-plus-CLWHGgw5.js";import"./@sxzz-D_chPuIy.js";import"./@ctrl-r5W6hzzQ.js";import"./dayjs-BkBTkyCe.js";import"./@turf-Bfw5sV2K.js";import"./async-validator-9PlIezaS.js";import"./memoize-one-BdPwpGay.js";import"./normalize-wheel-es-BQoi3Ox2.js";import"./@floating-ui-D0iZPv2f.js";import"./fast-deep-equal-DhA4GXGS.js";import"./json-schema-traverse-DW8_mBst.js";import"./fast-uri-BqpueqOB.js";import"./@lezer-Cw24EBjP.js";import"./crelt-C8TCjufn.js";import"./@marijn-DXwl3gUT.js";import"./style-mod-Bc2inJdb.js";import"./w3c-keyname-Vcq4gwWv.js";const P=()=>{const n=p(`{
    "type":"object",
    "properties":{
      "name":{
        "type":"string",
        "pattern": "^J"
      },
      "age":{
        "type":"integer",
        "exclusiveMinimum":0,
        "maximum":100,
        "multipleOf":10
      },
      "tags":{
        "type":"array",
        "items":{
          "type":"string"
        },
        "uniqueItems":true,
        "minItems":1,
        "maxItems":10
      },
      "address":{
        "type":"object",
        "properties":{
          "city":{
            "const":"New York"
          },
          "street":{
            "enum": ["Street", "Avenue", "Boulevard"]
          }
        },
        "patternProperties": {
          "^S_": { "type": "string" },
          "^I_": { "type": "integer" }
        },
        "required":["city","street"]
      },
      "phone":{
        "type": "array",
        "items": [
          { "type": "number" },
          { "type": "string" },
          { "enum": ["IOS", "Android"] },
          { "enum": ["IPhone", "Samsung", "Huawei"] }
        ],
        "minItems": 1,
        "maxItems": 4
      },
      "email":{
        "allOf":[
          {
            "type":"string",
            "maxLength":50
          },
          {
            "pattern":"^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(.[a-zA-Z0-9_-]+)+$"
          }
        ]
      },
      "email2":{
        "anyOf": [
          { "type": "string", "maxLength": 5 },
          { "type": "number", "minimum": 0 }
        ]
      },
      "email3":{
        "oneOf": [
          { "type": "number", "multipleOf": 5 },
          { "type": "number", "multipleOf": 3 }
        ]
      },
      "email4":{
        "not": {
          "type": "number"
        }
      }
    },
    "required":["name","age"]
  }`),t=p({}),o=_(),r=p(),i=[l.lineWrapping,g,v(),S(n)];I(()=>n.value,(s,e)=>{t.value=c(s)},{deep:!0,immediate:!0});function c(s){try{let e=s.trim();return e.startsWith("`")&&e.endsWith("`")&&(e=e.substring(1,e.length-1)),e=e.replace(/\${(.*?)}/g,'"$1"'),JSON.parse(e)}catch(e){throw new Error(`转换失败: ${e.message}`)}}const m=()=>{r.value&&(o.value=new l({parent:r.value,state:f.create({doc:n.value,extensions:i})}))},u=()=>{var s;(s=o.value)==null||s.destroy(),o.value=void 0};return y(()=>{m()}),h(()=>{u()}),{jsonSchema:t,editorRef:r}},V=()=>{const n=p(`{
    "name": "John",
    "age": 30,
    "tags": ["developer", "teacher", "musician"],
    "address": {
      "city": "New York",
      "street":"Street",
      "ID": 12345
    },
    "phone":[2,"phone","Android","IPhone"],
    "email": "example@example.com",
    "email2":"a@b.c",
    "email3":6,
    "email4":"test"
  }`),t=_(),o=p(),r=[l.lineWrapping,g,v(),S(n)],i=()=>{o.value&&(t.value=new l({parent:o.value,state:f.create({doc:n.value,extensions:r})}))},c=()=>{var m;(m=t.value)==null||m.destroy(),t.value=void 0};return y(()=>{i()}),h(()=>{c()}),{jsonStr:n,editorRef:o}};function S(n){return l.updateListener.of(t=>{if(t.docChanged){const o=t.state.doc;n.value=o.toString()}})}const z={class:"json-schema"},C={class:"content"},W={class:"left"},q={class:"right"},L={class:"message"},T={name:"JsonSchema"},Z=O({...T,setup(n){const t=J({message:""}),{jsonSchema:o,editorRef:r}=P(),{jsonStr:i,editorRef:c}=V();function m(){const s=new b().compile(o.value);if(i.value)try{const e=JSON.parse(i.value);if(s(e))t.message="验证通过";else{console.log(s.errors);const x=s.errors.map(d=>`${d.instancePath} -- ${d.message}`);t.message=x.join(`
`)}}catch(e){t.message=String(e)}}return(u,s)=>{const e=w;return E(),A("div",z,[a("div",C,[a("div",W,[a("div",{class:"editor",ref_key:"editorRef",ref:r},null,512)]),a("div",q,[a("div",{class:"editor",ref_key:"editorRef2",ref:c},null,512)])]),a("div",null,[R(e,{onClick:m},{default:k(()=>[...s[0]||(s[0]=[$("验证",-1)])]),_:1}),a("div",L,N(t.message),1)])])}}}),fe=B(Z,[["__scopeId","data-v-253086a5"]]);export{fe as default};
