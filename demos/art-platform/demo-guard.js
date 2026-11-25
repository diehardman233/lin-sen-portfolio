/* Presentation-only storage; never read prior internal-preview settings. */
window.demoStorage = (() => { const values = new Map(); return {getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k),clear:()=>values.clear()}; })();
// A wholly synthetic fixture keeps local grading controls operable without any network.
const demoGrades=['S','A','B','C','D'];
const demoGrading={version:'presentation-sample',grades:{},mandays:{},businessTypes:{},categoryExamples:{},pyramid:{S:'10%',A:'20%',B:'30%',CD:'40%'}};
demoGrades.forEach((g,i)=>{const reuse=[10,30,50,80,100][i],effort=[10,8,6,4,2][i];demoGrading.grades[g]={label:'演示级别 '+g,reuse:reuse+'%',newCap:(100-reuse)+'%',color:'var(--'+g.toLowerCase()+')',bg:'var(--'+g.toLowerCase()+'-bg)',figmaColor:[.3,.3,.7],figmaBg:[.95,.95,1]};demoGrading.mandays[g]={ux:effort/4,ui:effort/4,fx:effort/4,layout:effort/4,total:effort};});
for(const [key,label,grades] of [['pay','商品体验',demoGrades],['core','核心玩法',demoGrades],['social','社交体验',demoGrades.slice(1)],['std','常规功能',demoGrades.slice(2)]]){demoGrading.businessTypes[key]={label,grades};demoGrading.categoryExamples[key]=Object.fromEntries(grades.map(g=>[g,'通用示例 '+g]));}
window.fetch = url => String(url).split('?')[0].endsWith('grading-config.json') ? Promise.resolve(new Response(JSON.stringify(demoGrading),{headers:{'Content-Type':'application/json'}})) : Promise.reject(new Error('展示版未连接生成服务'));
window.WebSocket = function(){ throw new Error('展示版未连接生成服务'); };
document.addEventListener('DOMContentLoaded',()=>{
  const disable = /^(?:🚀\s*)?(?:开始批量生图|开始生成|一键生成全流程|并线启动全部任务)|测试连通性|保存配置/;
  for(const b of document.querySelectorAll('button')) if(disable.test(b.textContent.trim())) {b.disabled=true;b.title='展示版未连接生成服务';}
  // Avoid surprising popups: all local workspaces remain in the current viewer.
  document.addEventListener('click',e=>{
    const a=e.target.closest('a');if(!a)return;
    const raw=a.getAttribute('href');if(!raw)return;
    if(raw.startsWith('#')){const target=document.getElementById(raw.slice(1));if(target){e.preventDefault();target.scrollIntoView({behavior:'smooth'});}return;}
    const url=new URL(raw,location.href);
    if(url.origin!==location.origin){e.preventDefault();location.href='unavailable.html';return;}
    a.removeAttribute('target');
    const file=url.pathname.split('/').pop();
    e.preventDefault();
    if(!['index.html','character.html','character-tools.html','themes.html','scene-tools.html','scene.html','model.html','environment.html','world-art.html','experience.html','unavailable.html'].includes(file)) location.replace('unavailable.html');
    else location.replace(url.href);
  },true);
});
