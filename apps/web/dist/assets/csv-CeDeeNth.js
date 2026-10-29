const c=t=>{const e=t==null?"":String(t);return/[";\n]/.test(e)?`"${e.replace(/"/g,'""')}"`:e};function d(t,e,r){const a=[e.map(o=>c(o.header)).join(";"),...r.map(o=>e.map(s=>c(s.value(o))).join(";"))],l=new Blob([`\uFEFF${a.join(`
`)}`],{type:"text/csv;charset=utf-8"}),n=document.createElement("a");n.href=URL.createObjectURL(l),n.download=t,n.click(),URL.revokeObjectURL(n.href)}export{d};
