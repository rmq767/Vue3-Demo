import{b as B}from"./element-plus-vO1D8aWL.js";import{S as F,P as S,W as A,B as M,M as c,a as l,A as z,O as H,g as E,b as G,c as f}from"./three-3JAPmQp7.js";import{d as W,r as w,b as k,l as I,B as P,c as D,a as U,V,Q as q,o as L,U as N,T as O}from"./@vue-1pEateLc.js";import{_ as T}from"./plugin-vueexport-helper-x3n3nnut.js";import"./lodash-es-88S84ShG.js";import"./@vueuse-sS3gTgD0.js";import"./@element-plus-sRoPj2gC.js";import"./@sxzz--N-3kK7X.js";import"./@ctrl-ZggoHSuR.js";import"./dayjs-1TH0Fy64.js";import"./acorn-bQvPYi_r.js";import"./async-validator-BHjhHa7C.js";import"./memoize-one-JaOscZgY.js";import"./normalize-wheel-es-1urBKM79.js";import"./@floating-ui-_1sru3kO.js";const j={class:"three"},Q={name:"Demo"},R=W({...Q,setup(J){const e={scene:null,camera:null,renderder:null,cube:null,controller:null,material:null},d=w(),a=w(!1),h=k(()=>a.value?"退出全屏":"进入全屏"),b=()=>{const n=d.value;e.scene=new F,e.camera=new S(75,window.innerWidth/window.innerHeight,.1,2e3),e.camera.position.set(2,2,5),e.camera.lookAt(0,0,0),e.renderder=new A({antialias:!0}),e.renderder.setSize(n.offsetWidth,n.offsetHeight),x(),_(),g(),y(),C(),n.appendChild(e.renderder.domElement),e.renderder.render(e.scene,e.camera),m()},x=()=>{var s;const n=new M(1,1,1);e.material=new c({color:65280});const t=new c({color:255});e.cube=new l(n,e.material),(s=e.scene)==null||s.add(e.cube);let o=new l(n,t);e.cube.add(o),o.position.set(-3,0,0),e.cube.rotation.set(Math.PI/4,0,0),e.cube.rotation.set(0,Math.PI/4,0)},m=()=>{var n,t;(n=e.controller)==null||n.update(),requestAnimationFrame(m),(t=e.renderder)==null||t.render(e.scene,e.camera)},_=()=>{var t;const n=new z(10);(t=e.scene)==null||t.add(n)},g=()=>{var n;e.controller=new H(e.camera,(n=e.renderder)==null?void 0:n.domElement)},u=()=>{var n;(n=e.renderder)==null||n.setSize(window.innerWidth,window.innerHeight),e.camera.aspect=window.innerWidth/window.innerHeight,e.camera.updateProjectionMatrix()},v=()=>{a.value?(document.exitFullscreen(),a.value=!1):(document.body.requestFullscreen(),a.value=!0)},y=()=>{const n={fullScreen:()=>{document.body.requestFullscreen(),a.value=!0},exitFullscreen:()=>{document.exitFullscreen(),a.value=!1}},t=new E;t.add(n,"fullScreen").name("全屏"),t.add(n,"exitFullscreen").name("退出全屏");const o=t.addFolder("立方体位置");o.add(e.cube.position,"x").name("x轴位置").min(-10).max(10).step(1).onChange(r=>{console.log("x:",r)}),o.add(e.cube.position,"y").name("y轴位置").min(-10).max(10).step(1).onFinishChange(r=>{console.log("y:",r)}),o.add(e.cube.position,"z").name("z轴位置").min(-10).max(10).step(1),t.add(e.material,"wireframe").name("线框模式");const s={color:"#00ff00"};t.addColor(s,"color").onChange(r=>{var i;(i=e.material)==null||i.color.set(r)})},C=()=>{var p;const n=new G,t=new Float32Array([1,-1,-2,3,-1,-2,3,1,-2,1,1,-2]);n.setAttribute("position",new f(t,3));const o=new Uint16Array([0,1,2,2,3,0]);n.setIndex(new f(o,1));const s=new c({color:16711680}),r=new c({color:65280});n.addGroup(0,3,0),n.addGroup(3,3,1);const i=new l(n,[s,r]);(p=e.scene)==null||p.add(i)};return I(()=>{b(),window.addEventListener("resize",u)}),P(()=>{window.removeEventListener("resize",u)}),(n,t)=>{const o=B;return L(),D("div",j,[U("div",{class:"three-demo",ref_key:"threeDemo",ref:d},null,512),V(o,{type:"primary",size:"small",onClick:v,class:"to-full"},{default:q(()=>[N(O(h.value),1)]),_:1})])}}}),de=T(R,[["__scopeId","data-v-e9ab583d"]]);export{de as default};