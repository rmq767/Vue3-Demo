import{d as h,o as E,M as w,O as P,T as y,u as O,ag as g,as as L}from"./@vue-TgkIvK3c.js";import{E as T,i as R}from"./element-plus-C9Wo_V8k.js";import{c as A,a as I}from"./vue-router-iKQnYPVC.js";import"./lodash-es-f5-qkO2x.js";import"./@vueuse-J82ckMXX.js";import"./@element-plus-YhpsnAal.js";import"./@sxzz--N-3kK7X.js";import"./@ctrl-ZggoHSuR.js";import"./dayjs-1TH0Fy64.js";import"./acorn-bQvPYi_r.js";import"./async-validator-BHjhHa7C.js";import"./memoize-one-JaOscZgY.js";import"./escape-html-MDmRonL6.js";import"./normalize-wheel-es-1urBKM79.js";import"./@floating-ui-uFjme6UL.js";(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))a(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const r of t.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&a(r)}).observe(document,{childList:!0,subtree:!0});function n(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?t.credentials="include":e.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function a(e){if(e.ep)return;e.ep=!0;const t=n(e);fetch(e.href,t)}})();const V=h({__name:"App",setup(i){return(o,n)=>{const a=g("router-view");return E(),w(O(T),null,{default:P(()=>[y(a)]),_:1})}}}),D="modulepreload",b=function(i,o){return new URL(i,o).href},_={},s=function(o,n,a){let e=Promise.resolve();if(n&&n.length>0){const t=document.getElementsByTagName("link");e=Promise.all(n.map(r=>{if(r=b(r,a),r in _)return;_[r]=!0;const c=r.endsWith(".css"),v=c?'[rel="stylesheet"]':"";if(!!a)for(let l=t.length-1;l>=0;l--){const m=t[l];if(m.href===r&&(!c||m.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${r}"]${v}`))return;const u=document.createElement("link");if(u.rel=c?"stylesheet":D,c||(u.as="script",u.crossOrigin=""),u.href=r,document.head.appendChild(u),c)return new Promise((l,m)=>{u.addEventListener("load",l),u.addEventListener("error",()=>m(new Error(`Unable to preload CSS for ${r}`)))})}))}return e.then(()=>o()).catch(t=>{const r=new Event("vite:preloadError",{cancelable:!0});if(r.payload=t,window.dispatchEvent(r),!r.defaultPrevented)throw t})},d=Object.assign({"../views/Canvas/index.vue":()=>s(()=>import("./index-_QJ90csp.js"),__vite__mapDeps([0,1,2,3]),import.meta.url),"../views/Cesium/index.vue":()=>s(()=>import("./index-b8EkxOOY.js"),__vite__mapDeps([4,2]),import.meta.url),"../views/Gantt/index.vue":()=>s(()=>import("./index-EZEB6VLg.js"),__vite__mapDeps([5,6,2,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,3,23]),import.meta.url),"../views/Paper/index.vue":()=>s(()=>import("./index-qgIxP9R3.js"),__vite__mapDeps([24,2,25,13,1,3,26]),import.meta.url),"../views/Three/demo.vue":()=>s(()=>import("./demo-iVUXqcE0.js"),__vite__mapDeps([27,6,2,7,8,9,10,11,12,13,14,15,16,17,18,19,28,3,29]),import.meta.url),"../views/Three/event.vue":()=>s(()=>import("./event-1Lo63zow.js"),__vite__mapDeps([30,28,2,3,31]),import.meta.url),"../views/Three/fog.vue":()=>s(()=>import("./fog-p3LbBtjP.js"),__vite__mapDeps([32,28,2,3,33]),import.meta.url),"../views/Three/light.vue":()=>s(()=>import("./light-3uHbKKe7.js"),__vite__mapDeps([34,28,2,3,35]),import.meta.url),"../views/Three/spotlight.vue":()=>s(()=>import("./spotlight-VzyrW0gE.js"),__vite__mapDeps([36,28,2,3,37]),import.meta.url),"../views/Three/texture.vue":()=>s(()=>import("./texture-MTPhMHdf.js"),__vite__mapDeps([38,28,2,3,39]),import.meta.url)}),C=Object.keys(d),x=C.map(i=>({path:i.replace("../views/","/").replace(".vue",""),component:d[i]})),B=[{path:"/",redirect:"/home"},...x],p=A({history:I(),routes:B,scrollBehavior(i,o,n){return{top:0}}});p.beforeEach((i,o,n)=>{n()});p.afterEach((i,o)=>{});const f=L(V);f.use(R,{size:"small",zIndex:3e3}).use(p);f.mount("#app");
function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = ["./index-_QJ90csp.js","./demo1-ecsBbM2c.js","./@vue-TgkIvK3c.js","./plugin-vueexport-helper-x3n3nnut.js","./index-b8EkxOOY.js","./index-EZEB6VLg.js","./element-plus-C9Wo_V8k.js","./lodash-es-f5-qkO2x.js","./@vueuse-J82ckMXX.js","./@element-plus-YhpsnAal.js","./@sxzz--N-3kK7X.js","./@ctrl-ZggoHSuR.js","./dayjs-1TH0Fy64.js","./acorn-bQvPYi_r.js","./async-validator-BHjhHa7C.js","./memoize-one-JaOscZgY.js","./escape-html-MDmRonL6.js","./normalize-wheel-es-1urBKM79.js","./@floating-ui-uFjme6UL.js","../css/element-plus-tQIXMMpg.css","./dhtmlx-gantt-hxoxGPDc.js","../css/dhtmlx-gantt-cb6ThdV4.css","./html2canvas-obiqNZW0.js","../css/index-PQN1i8QF.css","./index-qgIxP9R3.js","./paper-odurGvJj.js","../css/index-gx-L4cIM.css","./demo-iVUXqcE0.js","./three-3JAPmQp7.js","../css/demo-gHqLu_ss.css","./event-1Lo63zow.js","../css/event-QrfKAHJl.css","./fog-p3LbBtjP.js","../css/fog-v6UxpqVH.css","./light-3uHbKKe7.js","../css/light-0ozff4Dh.css","./spotlight-VzyrW0gE.js","../css/spotlight-eJQtG9Ie.css","./texture-MTPhMHdf.js","../css/texture-DxAX7pGl.css"]
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}