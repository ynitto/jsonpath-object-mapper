import m from"deepmerge";import{JSONPath as M}from"jsonpath-plus";var S={objectMergeMode:"overwrite",arrayMergeMode:"replace"},j=(e,a)=>[...Array(a-e)].map((n,t)=>e+t),h=(e,a)=>a,x=(e,a)=>e;function O(e){return e.startsWith("`")?e.substring(1):e}function V(e){return e.startsWith("$.")}function A(e){return!!e&&typeof e=="object"&&"@path"in e&&typeof e["@path"]=="string"}function I(e){return!!e&&typeof e=="object"&&"@element"in e&&!!e["@element"]&&typeof e["@element"]=="object"}function d(e,a,n,t){let r=n;if(A(n)){if(r=d(e,a,n["@path"],t),n["@default"]!==void 0&&(r=r!=null?r:b(e,a,n["@default"],t)),n["@transform"]){let i={source:e,schema:n["@path"]};r=n["@transform"](r,a,i)}}else if(typeof n=="string")if(V(n)){let i=!0,c=n;n.endsWith("[]")&&(c=n.substring(0,n.length-2),i=!1);let l=M({path:c,json:e});i&&Array.isArray(l)&&l.length<=1?r=l[0]:r=l}else r=O(n);return r}function w(e,a,n,t){let r=a;(!r||typeof r!="object")&&(r={});let i=Object.fromEntries(Object.entries(n).map(([f,J])=>{let y=O(f);return[y,b(e,r[y],J,t)]}).filter(f=>f[1]!==void 0)),c;switch(t.arrayMergeMode){case"replace":c=h;break;case"append":case"prepend":switch(t.objectMergeMode){case"overwrite":c=h;break;case"preserve":c=x;break}break}let l=r;switch(t.objectMergeMode){case"overwrite":l=m(r,i,{arrayMerge:c});break;case"preserve":l=m(i,r,{arrayMerge:c});break;case"replace":l=i;break}return l}function v(e,a,n,t){let r=a;Array.isArray(a)||(r=[]);let i=n.flatMap((l,f)=>{if(I(l)){let J={};for(let[o,u]of Object.entries(l["@element"])){let s=u==null?void 0:u["@padding"],p=b(e,r[f],u,t);J[o]=[p,s]}let y=Math.max(...Object.values(J).map(([o])=>Array.isArray(o)?o.length:1));if(l["@length"]){let o=b(e,null,l["@length"],t);Number.isInteger(o)&&(y=o),Array.isArray(o)&&(y=o.length)}return j(0,y).map(o=>Object.fromEntries(Object.entries(J).map(([u,[s,p]])=>{var g;if(Array.isArray(s))switch(p!=null?p:"empty"){case"empty":return[u,s[o]];case"edge":return[u,(g=s[o])!=null?g:s.at(-1)];case"reflect":return[u,s[(o/s.length|0)%2===0?o%s.length:s.length-1-o%s.length]];case"wrap":return[u,s[o%s.length]]}switch(p!=null?p:"edge"){case"empty":return[u,o===0?s:void 0];default:return[u,s]}}).filter(([u,s])=>s!==void 0))).filter(o=>o!==void 0)}return[b(e,r[f],l,t)].filter(J=>J!==void 0)}),c=r;switch(t.arrayMergeMode){case"replace":c=i;break;case"append":c=[...r,...i];break;case"prepend":c=[...i,...r];break}return c}function b(e,a,n,t){return Array.isArray(n)?v(e,a,n,t):n!=null&&typeof n=="object"&&!A(n)?w(e,a,n,t):d(e,a,n,t)}function P(e,a,n=null,t){let r=Object.assign({},S,t!=null?t:{});return b(e,n,a,r)}function T(e,a){return d(e,null,a,S)}export{P as map,T as value};
