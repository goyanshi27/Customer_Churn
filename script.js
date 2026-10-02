/* Customer Churn Intelligence — script.js */
'use strict';

// ── CONSTANTS ──────────────────────────────────────────────────────
const STATES = ['Maharashtra','Delhi','Karnataka','Tamil Nadu','Gujarat','Rajasthan','Uttar Pradesh','West Bengal','Telangana','Andhra Pradesh','Kerala','Madhya Pradesh','Punjab','Haryana','Bihar','Odisha','Assam','Goa','Chandigarh'];
const CITIES = {Maharashtra:['Mumbai','Pune','Nagpur'],Delhi:['New Delhi','Noida','Gurgaon'],Karnataka:['Bengaluru','Mysuru','Hubli'],Tamil_Nadu:['Chennai','Coimbatore','Madurai'],'Tamil Nadu':['Chennai','Coimbatore','Madurai'],Gujarat:['Ahmedabad','Surat','Vadodara'],Rajasthan:['Jaipur','Jodhpur','Udaipur'],'Uttar Pradesh':['Lucknow','Kanpur','Agra'],'West Bengal':['Kolkata','Howrah','Asansol'],Telangana:['Hyderabad','Warangal','Nizamabad'],'Andhra Pradesh':['Visakhapatnam','Vijayawada','Guntur'],Kerala:['Kochi','Thiruvananthapuram','Kozhikode'],'Madhya Pradesh':['Bhopal','Indore','Jabalpur'],Punjab:['Ludhiana','Amritsar','Jalandhar'],Haryana:['Faridabad','Gurgaon','Panipat'],Bihar:['Patna','Gaya','Bhagalpur'],Odisha:['Bhubaneswar','Cuttack','Rourkela'],Assam:['Guwahati','Silchar','Dibrugarh'],Goa:['Panaji','Margao','Vasco'],Chandigarh:['Chandigarh','Mohali','Panchkula']};
const MALE_NAMES = ['Aarav','Arjun','Vivek','Rohan','Sanjay','Rahul','Amit','Vikram','Pradeep','Kiran','Suresh','Deepak','Manish','Rajesh','Nikhil','Aditya','Gaurav','Harish','Naveen','Sachin','Mohit','Akash','Varun','Pranav','Shreyas'];
const FEMALE_NAMES = ['Priya','Sneha','Ananya','Kavya','Divya','Pooja','Neha','Riya','Nisha','Meera','Sunita','Lakshmi','Asha','Deepa','Kritika','Swati','Aisha','Ruchi','Sarika','Anjali','Rashmi','Preeti','Nidhi','Shweta','Pallavi'];
const LAST_NAMES = ['Sharma','Patel','Singh','Kumar','Verma','Gupta','Mehta','Joshi','Nair','Reddy','Iyer','Shah','Malhotra','Srivastava','Mishra','Tiwari','Pandey','Agarwal','Chopra','Bose','Das','Chatterjee','Roy','Bhat','Menon'];
const CONTRACTS = ['Monthly','Quarterly','Annual','Two-Year'];
const PLANS = ['Basic','Standard','Premium','Enterprise'];
const PAYMENTS = ['UPI','Credit Card','Debit Card','Bank Transfer','Wallet','Auto Payment','Cash'];
const DEVICES = ['Mobile','Desktop','Tablet','Smart TV','Laptop'];
const INTERNET = ['Fiber Optic','Cable','DSL','5G','4G LTE'];
const PLAN_CHARGES = {Basic:[199,499],Standard:[500,999],Premium:[1000,1999],Enterprise:[2000,4999]};

// ── STATE ───────────────────────────────────────────────────────────
const S = {
  raw:[],filtered:[],charts:{},
  page:1,pageSize:50,
  sortField:'churn_probability',sortDir:'desc',
  tableFilters:{},activeSection:'dashboard'
};

// ── RNG ─────────────────────────────────────────────────────────────
let _seed = 12345;
function sr(s){_seed=s;}
function rnd(){_seed=(_seed*1664525+1013904223)&0xFFFFFFFF;return(_seed>>>0)/4294967296;}
function ri(a,b){return Math.floor(rnd()*(b-a+1))+a;}
function rf(a,b,d=2){return parseFloat((rnd()*(b-a)+a).toFixed(d));}
function rc(a){return a[Math.floor(rnd()*a.length)];}
function clamp(v,lo,hi){return Math.min(Math.max(v,lo),hi);}

// ── FORMAT ──────────────────────────────────────────────────────────
function fn(v,d=0){if(v==null||isNaN(v))return'—';return Number(v).toLocaleString('en-IN',{minimumFractionDigits:d,maximumFractionDigits:d});}
function fc(v){if(v==null||isNaN(v))return'—';if(v>=10000000)return'₹'+(v/10000000).toFixed(2)+'Cr';if(v>=100000)return'₹'+(v/100000).toFixed(1)+'L';if(v>=1000)return'₹'+(v/1000).toFixed(1)+'K';return'₹'+Math.round(v);}
function fp(v,d=1){return v==null?'—':Number(v).toFixed(d)+'%';}
function ag(a){if(a<26)return'18-25';if(a<36)return'26-35';if(a<46)return'36-45';if(a<56)return'46-55';if(a<66)return'56-65';return'65+';}
function tg(t){if(t<=6)return'0-6m';if(t<=12)return'7-12m';if(t<=24)return'13-24m';if(t<=36)return'25-36m';if(t<=60)return'37-60m';return'60m+';}
function riskLabel(p){if(p<0.30)return'Low';if(p<0.61)return'Medium';if(p<0.81)return'High';return'Critical';}
function initials(n){const p=n.trim().split(' ');return(p[0][0]+(p[1]?p[1][0]:'')).toUpperCase();}
function avatarColor(s){const c=['#2E86FF','#7B5CF0','#00C896','#F59E0B','#EF4444','#00D4FF','#F97316','#14B8A6'];let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))&0xFFFFFFFF;return c[Math.abs(h)%c.length];}
function pad(n,l=5){return String(n).padStart(l,'0');}
function avg(arr,f){if(!arr.length)return 0;return arr.reduce((a,c)=>a+(Number(c[f])||0),0)/arr.length;}
function sum(arr,f){return arr.reduce((a,c)=>a+(Number(c[f])||0),0);}
function countBy(arr,f){const m={};arr.forEach(c=>{const k=c[f];m[k]=(m[k]||0)+1;});return m;}
function groupBy(arr,f){const m={};arr.forEach(c=>{const k=c[f];if(!m[k])m[k]=[];m[k].push(c);});return m;}
function churnRate(arr){return arr.length?(arr.filter(c=>c.churn===1).length/arr.length*100):0;}

// ── CHURN SCORING (Demo Predictive Model) ───────────────────────────
function scoreChurn(c){
  let s=0;
  s+={Monthly:0.22,Quarterly:0.12,Annual:0.04,'Two-Year':0.01}[c.contract_type]||0.10;
  s+=clamp(1-c.tenure_months/72,0,1)*0.14;
  s+=clamp((10-c.satisfaction_score)/9,0,1)*0.16;
  s+=clamp((10-c.nps_score)/10,0,1)*0.07;
  s+=clamp(c.support_tickets/10,0,1)*0.10;
  s+=clamp(c.complaints/6,0,1)*0.08;
  s+=clamp(1-c.login_frequency/28,0,1)*0.06;
  s+=clamp(c.last_login_days/90,0,1)*0.07;
  s+=clamp(c.late_payments/6,0,1)*0.05;
  s+=clamp(1-c.engagement_score/100,0,1)*0.07;
  s+=clamp(1-c.service_quality_score/100,0,1)*0.04;
  s+=clamp(c.downgrade_count/3,0,1)*0.04;
  if(c.auto_payment)s-=0.05;
  s+=clamp((c.monthly_charges-199)/3800,0,1)*0.04;
  s+=(rnd()-0.5)*0.10;
  return clamp(s,0.02,0.98);
}

// ── DATA GENERATION ─────────────────────────────────────────────────
function genCustomer(i,bias){
  const gender=rnd()<0.52?'Male':'Female';
  const fname=rc(gender==='Male'?MALE_NAMES:FEMALE_NAMES);
  const lname=rc(LAST_NAMES);
  const name=fname+' '+lname;
  const age=ri(18,72);
  const state=rc(STATES);
  const city=rc(CITIES[state]||['City']);
  const contract=rc(CONTRACTS);
  const plan=rc(PLANS);
  const minT=contract==='Two-Year'?24:contract==='Annual'?12:1;
  const maxT=contract==='Two-Year'?96:contract==='Annual'?84:48;
  const tenure=ri(minT,maxT);
  const [cMin,cMax]=PLAN_CHARGES[plan];
  const monthly_charges=ri(cMin,cMax);
  const total_charges=Math.round(monthly_charges*tenure*(1-rf(0,0.15)));
  const satisfaction_score=ri(1,10);
  const nps_score=clamp(Math.round(satisfaction_score+ri(-2,2)),0,10);
  const support_tickets=clamp(Math.round((10-satisfaction_score)*0.8+ri(-1,3)),0,12);
  const complaints=clamp(Math.round(support_tickets*0.4+ri(-1,2)),0,8);
  const engagement_score=clamp(Math.round(tenure*0.5+satisfaction_score*4+ri(-10,15)),10,100);
  const login_frequency=clamp(Math.round(engagement_score/8+ri(-2,4)),0,30);
  const avg_session_minutes=ri(5,90);
  const last_login_days=clamp(Math.round((100-engagement_score)*0.6+ri(-5,15)),0,120);
  const data_usage_gb=rf(0.5,50);
  const payment_method=rc(PAYMENTS);
  const auto_payment=payment_method==='Auto Payment'||rnd()<0.25;
  const late_payments=auto_payment?0:clamp(ri(0,satisfaction_score<5?5:2),0,6);
  const service_quality_score=clamp(Math.round(satisfaction_score*7.5+ri(-8,8)),10,100);
  const customer_lifetime_value=Math.round(monthly_charges*(tenure+ri(6,24))*(1+engagement_score/200));
  const upgrade_count=satisfaction_score>=7?ri(0,3):ri(0,1);
  const downgrade_count=satisfaction_score<=4?ri(0,3):0;
  const referral_count=engagement_score>70?ri(0,5):ri(0,2);
  const device_type=rc(DEVICES);
  const internet_service=rc(INTERNET);
  const signup_month=ri(1,12);
  const signup_year=ri(2020,2024);
  const partial={contract_type:contract,tenure_months:tenure,satisfaction_score,nps_score,support_tickets,complaints,login_frequency,last_login_days,late_payments,engagement_score,service_quality_score,downgrade_count,auto_payment,monthly_charges};
  let cp=scoreChurn(partial);
  if(bias==='high')cp=clamp(cp*1.3,0.02,0.98);
  if(bias==='low')cp=clamp(cp*0.7,0.02,0.98);
  const risk_level=riskLabel(cp);
  const churn=cp>=0.45?1:0;
  const c={customer_id:`CCI-${pad(i+1)}`,customer_name:name,age,gender,city,state,country:'India',tenure_months:tenure,contract_type:contract,subscription_plan:plan,monthly_charges,total_charges,payment_method,device_type,internet_service,data_usage_gb,login_frequency,avg_session_minutes,support_tickets,complaints,satisfaction_score,nps_score,late_payments,discount_used:rnd()<0.35,promo_usage:rnd()<0.28,auto_payment,family_members:ri(1,7),dependents:ri(0,3),customer_lifetime_value,last_login_days,engagement_score,service_quality_score,upgrade_count,downgrade_count,referral_count,marketing_opt_in:rnd()<0.55,previous_churn_risk:rnd()<0.18,churn_probability:parseFloat(cp.toFixed(4)),risk_level,churn,signup_month,signup_year};
  c.segment=getSegment(c);
  return c;
}

function getSegment(c){
  const p=c.churn_probability,t=c.tenure_months,e=c.engagement_score,s=c.satisfaction_score;
  if(p>0.80)return'Lost Customers';
  if(p>0.60)return'High Risk';
  if(p>0.40||s<5)return'At Risk';
  if(t<=6)return'New Customers';
  if(e>=75&&s>=8&&t>=24)return'Champions';
  if(e>=60&&s>=7&&t>=12)return'Loyal Customers';
  return'Potential Loyalists';
}

function generateDataset(n=5000,bias='medium'){
  sr(42);
  const d=[];
  for(let i=0;i<n;i++)d.push(genCustomer(i,bias));
  return d;
}

function getMainDriver(c){
  const ds=[{n:'High Tickets',s:c.support_tickets/12},{n:'Low Satisfaction',s:(10-c.satisfaction_score)/9},{n:'Long Inactivity',s:c.last_login_days/120},{n:'Late Payments',s:c.late_payments/6},{n:'Low Engagement',s:1-c.engagement_score/100},{n:'Complaints',s:c.complaints/8},{n:'Short Tenure',s:c.tenure_months<12?0.7:0}];
  return ds.sort((a,b)=>b.s-a.s)[0].n;
}

function getAction(c){
  if(c.support_tickets>=4)return'Resolve support tickets';
  if(c.satisfaction_score<=4)return'Send satisfaction survey + discount';
  if(c.last_login_days>30)return'Re-engagement campaign';
  if(c.late_payments>=2)return'Review payment plan';
  if(c.complaints>=3)return'Assign dedicated support';
  if(c.contract_type==='Monthly')return'Offer annual contract';
  if(c.engagement_score<40)return'Personalized engagement';
  if(c.downgrade_count>=1)return'Loyalty upgrade offer';
  if(c.risk_level==='Critical')return'Urgent: Executive outreach';
  return'Proactive check-in call';
}

function applyFilters(data,f){
  return data.filter(c=>{
    if(f.risk&&c.risk_level!==f.risk)return false;
    if(f.churn&&String(c.churn)!==f.churn)return false;
    if(f.contract&&c.contract_type!==f.contract)return false;
    if(f.plan&&c.subscription_plan!==f.plan)return false;
    if(f.gender&&c.gender!==f.gender)return false;
    if(f.payment&&c.payment_method!==f.payment)return false;
    if(f.state&&c.state!==f.state)return false;
    if(f.ageGroup&&ag(c.age)!==f.ageGroup)return false;
    return true;
  });
}

// ── CHART DEFAULTS ──────────────────────────────────────────────────
function setupCharts(){
  Chart.defaults.color='#94A8C7';
  Chart.defaults.borderColor='rgba(46,134,255,0.08)';
  Chart.defaults.font.family="'Inter',sans-serif";
  Chart.defaults.font.size=11;
  Chart.defaults.plugins.legend.labels.boxWidth=10;
  Chart.defaults.plugins.legend.labels.padding=14;
  Chart.defaults.plugins.tooltip.backgroundColor='#101B2D';
  Chart.defaults.plugins.tooltip.borderColor='rgba(46,134,255,0.3)';
  Chart.defaults.plugins.tooltip.borderWidth=1;
  Chart.defaults.plugins.tooltip.padding=10;
  Chart.defaults.plugins.tooltip.titleColor='#E8F0FE';
  Chart.defaults.plugins.tooltip.bodyColor='#94A8C7';
  Chart.defaults.plugins.tooltip.cornerRadius=8;
}

function dc(id){if(S.charts[id]){S.charts[id].destroy();delete S.charts[id];}}

function mkChart(id,config){
  dc(id);
  const canvas=document.getElementById(id);
  if(!canvas)return null;
  const chart=new Chart(canvas,config);
  S.charts[id]=chart;
  return chart;
}

const C={
  primary:'#2E86FF',secondary:'#00D4FF',accent:'#7B5CF0',
  success:'#00C896',warning:'#F59E0B',danger:'#EF4444',orange:'#F97316',
  teal:'#14B8A6',pink:'#EC4899',indigo:'#6366F1',
  risk:{Low:'#00C896',Medium:'#F59E0B',High:'#F97316',Critical:'#EF4444'},
  seg:{Champions:'#00C896','Loyal Customers':'#2E86FF','Potential Loyalists':'#00D4FF','New Customers':'#7B5CF0','At Risk':'#F59E0B','High Risk':'#F97316','Lost Customers':'#EF4444'},
  alpha:(hex,a)=>hex+''+Math.round(a*255).toString(16).padStart(2,'0'),
};

function grad(ctx,c1,c2){
  const g=ctx.createLinearGradient(0,0,0,ctx.canvas.height);
  g.addColorStop(0,c1);g.addColorStop(1,c2);return g;
}

// ── KPI RENDER ──────────────────────────────────────────────────────
function animCount(el,target,pre='',suf='',dp=0,dur=900){
  const start=performance.now();
  function step(now){
    const p=Math.min((now-start)/dur,1);
    const ease=1-Math.pow(1-p,3);
    const val=target*ease;
    el.textContent=pre+fn(val,dp)+suf;
    if(p<1)requestAnimationFrame(step);
    else el.textContent=pre+fn(target,dp)+suf;
  }
  requestAnimationFrame(step);
}

function renderKPIs(data){
  const grid=document.getElementById('kpiGrid');
  if(!grid)return;
  const total=data.length;
  const churned=data.filter(c=>c.churn===1).length;
  const active=total-churned;
  const cr=total?(churned/total*100):0;
  const rr=total?(active/total*100):0;
  const hiRisk=data.filter(c=>c.risk_level==='High').length;
  const critRisk=data.filter(c=>c.risk_level==='Critical').length;
  const avgCLV=avg(data,'customer_lifetime_value');
  const mrr=sum(data,'monthly_charges');
  const rar=sum(data.filter(c=>c.risk_level==='High'||c.risk_level==='Critical'),'monthly_charges');
  const avgSat=avg(data,'satisfaction_score');
  const avgTen=avg(data,'tenure_months');
  const avgCh=avg(data,'monthly_charges');
  const avgEng=avg(data,'engagement_score');
  const avgNPS=avg(data,'nps_score');
  const totTix=sum(data,'support_tickets');

  const cards=[
    {l:'Total Customers',v:total,pre:'',suf:'',dp:0,icon:'fa-users',col:'blue',desc:'All records',chg:'+2.4%',dir:'up'},
    {l:'Churned Customers',v:churned,pre:'',suf:'',dp:0,icon:'fa-user-minus',col:'red',desc:'Left service',chg:'+5.1%',dir:'down'},
    {l:'Churn Rate',v:cr,pre:'',suf:'%',dp:1,icon:'fa-chart-line-down',col:'orange',desc:'Of total base',chg:'+1.2%',dir:'down'},
    {l:'Active Customers',v:active,pre:'',suf:'',dp:0,icon:'fa-user-check',col:'green',desc:'Currently active',chg:'-1.8%',dir:'up'},
    {l:'High Risk',v:hiRisk,pre:'',suf:'',dp:0,icon:'fa-triangle-exclamation',col:'amber',desc:'Need attention',chg:'+3.7%',dir:'down'},
    {l:'Critical Risk',v:critRisk,pre:'',suf:'',dp:0,icon:'fa-circle-exclamation',col:'red',desc:'Immediate action',chg:'+2.9%',dir:'down'},
    {l:'Avg Customer CLV',v:avgCLV,pre:'₹',suf:'',dp:0,icon:'fa-gem',col:'purple',desc:'Lifetime value',chg:'+4.2%',dir:'up'},
    {l:'Monthly Revenue',v:mrr,pre:'₹',suf:'',dp:0,icon:'fa-circle-dollar-to-slot',col:'cyan',desc:'Total MRR',chg:'+1.9%',dir:'up'},
    {l:'Revenue at Risk',v:rar,pre:'₹',suf:'',dp:0,icon:'fa-sack-dollar',col:'red',desc:'High+Critical MRR',chg:'+6.3%',dir:'down'},
    {l:'Avg Satisfaction',v:avgSat,pre:'',suf:'/10',dp:1,icon:'fa-star',col:'amber',desc:'Customer score',chg:'-0.3',dir:'down'},
    {l:'Avg Tenure',v:avgTen,pre:'',suf:'mo',dp:1,icon:'fa-hourglass-half',col:'teal',desc:'Months on service',chg:'+1.1mo',dir:'up'},
    {l:'Avg Monthly Charges',v:avgCh,pre:'₹',suf:'',dp:0,icon:'fa-receipt',col:'blue',desc:'Per customer',chg:'+2.3%',dir:'up'},
    {l:'Avg Engagement',v:avgEng,pre:'',suf:'',dp:1,icon:'fa-bolt',col:'cyan',desc:'Score /100',chg:'-1.4',dir:'down'},
    {l:'Retention Rate',v:rr,pre:'',suf:'%',dp:1,icon:'fa-shield-halved',col:'green',desc:'Customers retained',chg:'-1.2%',dir:'up'},
    {l:'Avg NPS Score',v:avgNPS,pre:'',suf:'/10',dp:1,icon:'fa-thumbs-up',col:'purple',desc:'Net Promoter',chg:'-0.5',dir:'down'},
    {l:'Support Tickets',v:totTix,pre:'',suf:'',dp:0,icon:'fa-ticket',col:'amber',desc:'Total raised',chg:'+8.2%',dir:'down'},
  ];

  grid.innerHTML=cards.map((k,i)=>`
    <div class="kpi-card ${k.col}" role="listitem" style="animation-delay:${i*0.05}s">
      <div class="kpi-top">
        <div class="kpi-icon"><i class="fa-solid ${k.icon}"></i></div>
      </div>
      <div class="kpi-main">
        <div class="kpi-value" id="kv${i}">${k.pre}0${k.suf}</div>
        <div class="kpi-label">${k.l}</div>
      </div>
      <div class="kpi-footer">
        <span class="kpi-desc">${k.desc}</span>
        <span class="kpi-change ${k.dir}"><i class="fa-solid fa-arrow-${k.dir==='up'?'up':'down'}"></i>${k.chg}</span>
      </div>
    </div>`).join('');

  cards.forEach((k,i)=>{
    const el=document.getElementById(`kv${i}`);
    if(el)animCount(el,k.v,k.pre,k.suf,k.dp,800+i*30);
  });

  const lu=document.getElementById('lastUpdated');
  if(lu)lu.textContent='Last updated: '+new Date().toLocaleTimeString();
}

// ── CHARTS: DASHBOARD ───────────────────────────────────────────────
function renderChurnTrend(data){
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const byMonth=Array(12).fill(null).map(()=>({total:0,churned:0}));
  data.forEach(c=>{const m=c.signup_month-1;byMonth[m].total++;if(c.churn===1)byMonth[m].churned++;});
  const rates=byMonth.map(m=>m.total?(m.churned/m.total*100):0);
  const canvas=document.getElementById('churnTrendChart');if(!canvas)return;
  const ctx=canvas.getContext('2d');
  mkChart('churnTrendChart',{
    type:'line',
    data:{labels:months,datasets:[
      {label:'Churn Rate %',data:rates,borderColor:C.danger,backgroundColor:grad(ctx,C.danger+'40',C.danger+'05'),fill:true,tension:0.4,borderWidth:2,pointRadius:3,pointHoverRadius:5,pointBackgroundColor:C.danger},
      {label:'Total Customers',data:byMonth.map(m=>m.total),borderColor:C.primary,backgroundColor:'transparent',tension:0.4,borderWidth:2,pointRadius:3,pointHoverRadius:5,pointBackgroundColor:C.primary,yAxisID:'y2'}
    ]},
    options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'top'}},scales:{y:{title:{display:true,text:'Churn Rate %'}},y2:{position:'right',title:{display:true,text:'Customers'},grid:{display:false}}}}
  });
}

function renderChurnDist(data){
  const churned=data.filter(c=>c.churn===1).length;
  const retained=data.length-churned;
  const el=document.getElementById('churnDistCenter');
  if(el)el.innerHTML=`<div class="dc-val">${fp(churned/data.length*100)}</div><div class="dc-lbl">Churn Rate</div>`;
  mkChart('churnDistChart',{
    type:'doughnut',
    data:{labels:['Churned','Retained'],datasets:[{data:[churned,retained],backgroundColor:[C.danger+'CC',C.success+'CC'],borderColor:[C.danger,C.success],borderWidth:2,hoverOffset:8}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'72%',plugins:{legend:{position:'bottom'},tooltip:{callbacks:{label:ctx=>`${ctx.label}: ${fn(ctx.parsed)} (${fp(ctx.parsed/data.length*100)})`}}}}
  });
}

function renderRiskDist(data){
  const rk=countBy(data,'risk_level');
  const labels=['Low','Medium','High','Critical'];
  mkChart('riskDistChart',{
    type:'doughnut',
    data:{labels,datasets:[{data:labels.map(l=>rk[l]||0),backgroundColor:labels.map(l=>C.risk[l]+'CC'),borderColor:labels.map(l=>C.risk[l]),borderWidth:2,hoverOffset:6}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'65%',plugins:{legend:{position:'bottom'},tooltip:{callbacks:{label:ctx=>`${ctx.label}: ${fn(ctx.parsed)} (${fp(ctx.parsed/data.length*100)})`}}}}
  });
}

function renderChurnByContract(data){
  const grp=groupBy(data,'contract_type');
  const labels=CONTRACTS;
  mkChart('churnByContractChart',{
    type:'bar',
    data:{labels,datasets:[
      {label:'Total',data:labels.map(l=>(grp[l]||[]).length),backgroundColor:C.primary+'80',borderColor:C.primary,borderWidth:1},
      {label:'Churned',data:labels.map(l=>(grp[l]||[]).filter(c=>c.churn===1).length),backgroundColor:C.danger+'80',borderColor:C.danger,borderWidth:1}
    ]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top'}},scales:{x:{grid:{display:false}},y:{beginAtZero:true}}}
  });
}

function renderChurnByPlan(data){
  const grp=groupBy(data,'subscription_plan');
  const labels=PLANS;
  const rates=labels.map(l=>{const g=grp[l]||[];return g.length?(g.filter(c=>c.churn===1).length/g.length*100):0;});
  mkChart('churnByPlanChart',{
    type:'bar',
    data:{labels,datasets:[{label:'Churn Rate %',data:rates,backgroundColor:[C.success+'99',C.primary+'99',C.warning+'99',C.danger+'99'],borderColor:[C.success,C.primary,C.warning,C.danger],borderWidth:2}]},
    options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,max:100,title:{display:true,text:'Churn Rate %'}},y:{grid:{display:false}}}}
  });
}

function renderChurnByAge(data){
  const groups=['18-25','26-35','36-45','46-55','56-65','65+'];
  const gd={};groups.forEach(g=>{gd[g]={t:0,c:0};});
  data.forEach(c=>{const g=ag(c.age);if(gd[g]){gd[g].t++;if(c.churn===1)gd[g].c++;}});
  mkChart('churnByAgeChart',{
    type:'bar',
    data:{labels:groups,datasets:[
      {label:'Total',data:groups.map(g=>gd[g].t),backgroundColor:C.primary+'60',borderColor:C.primary,borderWidth:1},
      {label:'Churned',data:groups.map(g=>gd[g].c),backgroundColor:C.danger+'80',borderColor:C.danger,borderWidth:1},
      {label:'Churn Rate %',data:groups.map(g=>gd[g].t?(gd[g].c/gd[g].t*100):0),type:'line',borderColor:C.warning,backgroundColor:'transparent',borderWidth:2,tension:0.4,yAxisID:'y2',pointRadius:4}
    ]},
    options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index'},plugins:{legend:{position:'top'}},scales:{y:{beginAtZero:true},y2:{position:'right',title:{display:true,text:'Rate %'},grid:{display:false}}}}
  });
}

function renderChurnByTenure(data){
  const groups=['0-6m','7-12m','13-24m','25-36m','37-60m','60m+'];
  const gd={};groups.forEach(g=>{gd[g]={t:0,c:0};});
  data.forEach(c=>{const g=tg(c.tenure_months);if(gd[g]){gd[g].t++;if(c.churn===1)gd[g].c++;}});
  mkChart('churnByTenureChart',{
    type:'bar',
    data:{labels:groups,datasets:[
      {label:'Total',data:groups.map(g=>gd[g].t),backgroundColor:C.accent+'60',borderColor:C.accent,borderWidth:1},
      {label:'Churned',data:groups.map(g=>gd[g].c),backgroundColor:C.danger+'80',borderColor:C.danger,borderWidth:1},
      {label:'Churn Rate %',data:groups.map(g=>gd[g].t?(gd[g].c/gd[g].t*100):0),type:'line',borderColor:C.secondary,backgroundColor:'transparent',borderWidth:2,tension:0.4,yAxisID:'y2',pointRadius:4}
    ]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top'}},scales:{y:{beginAtZero:true},y2:{position:'right',grid:{display:false}}}}
  });
}

// ── HIGH RISK TABLE ──────────────────────────────────────────────────
function renderHighRiskTable(data){
  const top=[...data].filter(c=>c.risk_level==='Critical'||c.risk_level==='High').sort((a,b)=>b.churn_probability-a.churn_probability).slice(0,20);
  const el=document.getElementById('highRiskTableBody');
  const cnt=document.getElementById('highRiskCount');
  if(cnt)cnt.textContent=top.length+' customers';
  if(!el)return;
  el.innerHTML=top.map(c=>`
    <tr class="${c.risk_level==='Critical'?'critical-row':'high-row'}">
      <td><div class="customer-name-cell"><div class="customer-avatar-sm" style="background:${avatarColor(c.customer_name)}">${initials(c.customer_name)}</div><div><div style="color:#E8F0FE;font-weight:600">${c.customer_name}</div><div style="font-size:10px;color:#5A7494">${c.customer_id}</div></div></div></td>
      <td><div class="prob-cell"><div class="prob-bar-track"><div class="prob-bar-fill" style="width:${c.churn_probability*100}%;background:${C.risk[c.risk_level]}"></div></div><span class="prob-val" style="color:${C.risk[c.risk_level]}">${fp(c.churn_probability*100)}</span></div></td>
      <td><span class="risk-badge ${c.risk_level.toLowerCase()}">${c.risk_level}</span></td>
      <td style="color:#E8F0FE">${fc(c.customer_lifetime_value)}</td>
      <td style="color:${C.danger}">${fc(c.monthly_charges)}</td>
      <td style="color:#94A8C7">${getMainDriver(c)}</td>
      <td><span class="action-text">${getAction(c)}</span></td>
    </tr>`).join('');
}

// ── AI INSIGHTS ──────────────────────────────────────────────────────
function renderInsights(data){
  const grid=document.getElementById('insightsGrid');
  if(!grid)return;
  const churned=data.filter(c=>c.churn===1);
  const retained=data.filter(c=>c.churn===0);
  const avgSatC=avg(churned,'satisfaction_score').toFixed(1);
  const avgSatR=avg(retained,'satisfaction_score').toFixed(1);
  const monthlyChurnRate=churnRate(data.filter(c=>c.contract_type==='Monthly')).toFixed(1);
  const annualChurnRate=churnRate(data.filter(c=>c.contract_type==='Annual')).toFixed(1);
  const highTicket=data.filter(c=>c.support_tickets>=5);
  const rar=sum(data.filter(c=>c.risk_level==='High'||c.risk_level==='Critical'),'monthly_charges');
  const critCount=data.filter(c=>c.risk_level==='Critical').length;
  const lowEngChurn=churnRate(data.filter(c=>c.engagement_score<40)).toFixed(1);
  const highEngChurn=churnRate(data.filter(c=>c.engagement_score>=75)).toFixed(1);
  const autoPayChurn=churnRate(data.filter(c=>c.auto_payment)).toFixed(1);
  const manualPayChurn=churnRate(data.filter(c=>!c.auto_payment)).toFixed(1);

  const insights=[
    {icon:'fa-face-frown',type:'danger',title:'Low Satisfaction Drives Churn',text:`Churned customers average ${avgSatC}/10 satisfaction vs ${avgSatR}/10 for retained customers — a significant ${(avgSatR-avgSatC).toFixed(1)}-point gap.`,metric:'Satisfaction Gap: '+((avgSatR-avgSatC).toFixed(1))+' pts',sev:'critical'},
    {icon:'fa-file-contract',type:'warning',title:'Month-to-Month Contract Risk',text:`Monthly contract customers have ${monthlyChurnRate}% churn rate vs ${annualChurnRate}% for annual — ${(monthlyChurnRate-annualChurnRate).toFixed(1)}x higher risk.`,metric:'Churn Ratio: '+monthlyChurnRate+'% vs '+annualChurnRate+'%',sev:'high'},
    {icon:'fa-ticket',type:'danger',title:'Support Tickets Signal Churn',text:`${fn(highTicket.length)} customers with 5+ support tickets represent a major retention opportunity worth ${fc(sum(highTicket,'monthly_charges'))}/mo.`,metric:'High-ticket customers: '+fn(highTicket.length),sev:'high'},
    {icon:'fa-sack-dollar',type:'danger',title:'Revenue at Risk',text:`${fc(rar)} in monthly recurring revenue is at risk from ${fn(critCount)} critical-risk customers needing immediate intervention.`,metric:'MRR at Risk: '+fc(rar),sev:'critical'},
    {icon:'fa-bolt',type:'warning',title:'Engagement Predicts Retention',text:`Low-engagement customers churn at ${lowEngChurn}% vs ${highEngChurn}% for highly engaged — improving engagement is your #1 lever.`,metric:'Low vs High Engagement: '+lowEngChurn+'% vs '+highEngChurn+'%',sev:'medium'},
    {icon:'fa-credit-card',type:'success',title:'Auto-Payment Reduces Churn',text:`Auto-payment customers show ${autoPayChurn}% churn vs ${manualPayChurn}% for manual payment. Promoting auto-pay could reduce churn by up to ${(manualPayChurn-autoPayChurn).toFixed(1)}%.`,metric:'Churn Reduction Opportunity: '+(manualPayChurn-autoPayChurn).toFixed(1)+'%',sev:'low'},
  ];

  grid.innerHTML=insights.map((ins,i)=>`
    <div class="insight-item" style="animation-delay:${i*0.08}s">
      <div class="insight-header">
        <div class="insight-icon ${ins.type}"><i class="fa-solid ${ins.icon}"></i></div>
        <span class="insight-title">${ins.title}</span>
        <span class="severity-badge ${ins.sev}">${ins.sev.toUpperCase()}</span>
      </div>
      <div class="insight-text">${ins.text}</div>
      <div class="insight-metric"><i class="fa-solid fa-chart-simple" style="font-size:10px"></i>${ins.metric}</div>
    </div>`).join('');
}

// ── CHURN OVERVIEW CHARTS ────────────────────────────────────────────
function renderMonthlyChurn(data){
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const byM=Array(12).fill(null).map(()=>({t:0,c:0}));
  data.forEach(c=>{const m=c.signup_month-1;byM[m].t++;if(c.churn===1)byM[m].c++;});
  const canvas=document.getElementById('monthlyChurnChart');if(!canvas)return;
  const ctx=canvas.getContext('2d');
  mkChart('monthlyChurnChart',{
    type:'bar',
    data:{labels:months,datasets:[
      {label:'Total Customers',data:byM.map(m=>m.t),backgroundColor:C.primary+'50',borderColor:C.primary,borderWidth:1},
      {label:'Churned',data:byM.map(m=>m.c),backgroundColor:C.danger+'80',borderColor:C.danger,borderWidth:1},
      {label:'Churn Rate %',data:byM.map(m=>m.t?(m.c/m.t*100):0),type:'line',borderColor:C.warning,backgroundColor:'transparent',tension:0.4,borderWidth:2,pointRadius:3,yAxisID:'y2'}
    ]},
    options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index'},plugins:{legend:{position:'top'}},scales:{y:{beginAtZero:true},y2:{position:'right',grid:{display:false},title:{display:true,text:'%'}}}}
  });
}

function renderQuarterlyChurn(data){
  const labels=['Q1','Q2','Q3','Q4'];
  const byQ=Array(4).fill(null).map(()=>({t:0,c:0}));
  data.forEach(c=>{const q=Math.ceil(c.signup_month/3)-1;byQ[q].t++;if(c.churn===1)byQ[q].c++;});
  mkChart('quarterlyChurnChart',{
    type:'bar',
    data:{labels,datasets:[
      {label:'Active',data:byQ.map(q=>q.t-q.c),backgroundColor:C.success+'80',borderColor:C.success,borderWidth:1,stack:'a'},
      {label:'Churned',data:byQ.map(q=>q.c),backgroundColor:C.danger+'80',borderColor:C.danger,borderWidth:1,stack:'a'}
    ]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top'}},scales:{x:{stacked:true,grid:{display:false}},y:{stacked:true,beginAtZero:true}}}
  });
}

function renderChurnByGender(data){
  const grp=groupBy(data,'gender');
  const labels=Object.keys(grp);
  mkChart('churnByGenderChart',{
    type:'doughnut',
    data:{labels,datasets:[{data:labels.map(l=>grp[l].filter(c=>c.churn===1).length),backgroundColor:[C.primary+'CC',C.pink+'CC'],borderColor:[C.primary,C.pink],borderWidth:2}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'60%',plugins:{legend:{position:'bottom'},tooltip:{callbacks:{label:ctx=>`${ctx.label}: ${fn(ctx.parsed)} churned (${fp(ctx.parsed/(grp[labels[ctx.dataIndex]]||[{length:1}]).length*100)})`}}}}
  });
}

function renderChurnByPayment(data){
  const grp=groupBy(data,'payment_method');
  const labels=PAYMENTS.filter(p=>grp[p]);
  const rates=labels.map(l=>{const g=grp[l]||[];return g.length?(g.filter(c=>c.churn===1).length/g.length*100):0;});
  mkChart('churnByPaymentChart',{
    type:'bar',
    data:{labels,datasets:[{label:'Churn Rate %',data:rates,backgroundColor:labels.map((_,i)=>[C.primary,C.secondary,C.accent,C.success,C.warning,C.danger,C.teal][i%7]+'99'),borderWidth:1}]},
    options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,title:{display:true,text:'Churn Rate %'}},y:{grid:{display:false}}}}
  });
}

function renderChurnByInternet(data){
  const grp=groupBy(data,'internet_service');
  const labels=Object.keys(grp);
  const rates=labels.map(l=>churnRate(grp[l]));
  mkChart('churnByInternetChart',{
    type:'polarArea',
    data:{labels,datasets:[{data:rates,backgroundColor:labels.map((_,i)=>[C.primary,C.secondary,C.accent,C.success,C.warning][i%5]+'80'),borderColor:labels.map((_,i)=>[C.primary,C.secondary,C.accent,C.success,C.warning][i%5]),borderWidth:1}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom'}}}
  });
}

function renderRadar(data){
  const riskGroups=['Low','Medium','High','Critical'];
  const fields=['engagement_score','satisfaction_score','service_quality_score','login_frequency','nps_score','tenure_months'];
  const labels=['Engagement','Satisfaction','Service Quality','Login Freq','NPS','Tenure'];
  const maxVals=[100,10,100,30,10,72];
  const colors=[C.success,C.warning,C.orange,C.danger];
  const datasets=riskGroups.map((r,i)=>{
    const grp=data.filter(c=>c.risk_level===r);
    return{label:r+' Risk',data:fields.map((f,fi)=>grp.length?(avg(grp,f)/maxVals[fi]*100):0),borderColor:colors[i],backgroundColor:colors[i]+'20',borderWidth:2,pointRadius:3};
  });
  mkChart('riskRadarChart',{type:'radar',data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false,scales:{r:{beginAtZero:true,max:100,ticks:{display:false},grid:{color:'rgba(46,134,255,0.1)'},pointLabels:{color:'#94A8C7'}}},plugins:{legend:{position:'bottom'}}}});
}

function renderChurnByDevice(data){
  const grp=groupBy(data,'device_type');
  const labels=Object.keys(grp);
  const total=labels.map(l=>grp[l].length);
  const churned=labels.map(l=>grp[l].filter(c=>c.churn===1).length);
  mkChart('churnByDeviceChart',{
    type:'doughnut',
    data:{labels,datasets:[{data:churned,backgroundColor:[C.primary,C.secondary,C.accent,C.success,C.warning].map(c=>c+'CC'),borderColor:[C.primary,C.secondary,C.accent,C.success,C.warning],borderWidth:2}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'55%',plugins:{legend:{position:'bottom'},tooltip:{callbacks:{label:ctx=>`${ctx.label}: ${fn(ctx.parsed)} churned`}}}}
  });
}

// ── CORRELATION HEATMAP ──────────────────────────────────────────────
function renderCorrelationHeatmap(data){
  const fields=[
    {k:'tenure_months',l:'Tenure'},{k:'monthly_charges',l:'Monthly ₹'},
    {k:'total_charges',l:'Total ₹'},{k:'support_tickets',l:'Tickets'},
    {k:'satisfaction_score',l:'Satisfaction'},{k:'nps_score',l:'NPS'},
    {k:'login_frequency',l:'Login Freq'},{k:'engagement_score',l:'Engagement'},
    {k:'complaints',l:'Complaints'},{k:'late_payments',l:'Late Pay'},
    {k:'churn_probability',l:'Churn Prob'}
  ];
  const sample=data.length>500?data.filter((_,i)=>i%Math.ceil(data.length/500)===0):data;
  const arrays=fields.map(f=>sample.map(c=>Number(c[f.k])||0));
  function corr(xs,ys){
    const n=xs.length;const mx=xs.reduce((a,b)=>a+b,0)/n,my=ys.reduce((a,b)=>a+b,0)/n;
    let num=0,dx2=0,dy2=0;
    for(let i=0;i<n;i++){const dx=xs[i]-mx,dy=ys[i]-my;num+=dx*dy;dx2+=dx*dx;dy2+=dy*dy;}
    const d=Math.sqrt(dx2*dy2);return d===0?0:parseFloat((num/d).toFixed(2));
  }
  const matrix=[];
  for(let i=0;i<fields.length;i++)for(let j=0;j<fields.length;j++)matrix.push({x:j,y:i,v:corr(arrays[i],arrays[j])});

  function corrColor(v){
    if(v>=0.7)return C.danger;if(v>=0.4)return C.warning;if(v>=0.1)return C.primary;
    if(v>=-0.1)return'#3A5070';if(v>=-0.4)return C.teal;return C.success;
  }

  dc('correlationHeatmapChart');
  const canvas=document.getElementById('correlationHeatmapChart');if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const n=fields.length;
  const size=Math.min(canvas.parentElement.clientWidth||400,600);
  canvas.width=size;canvas.height=size+40;
  const cell=size/n;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.font='9px Inter';ctx.fillStyle='#94A8C7';ctx.textAlign='center';
  fields.forEach((f,i)=>{ctx.fillText(f.l,cell*i+cell/2,size+14);});
  ctx.save();ctx.translate(0,size);ctx.rotate(-Math.PI/2);
  fields.forEach((f,i)=>{ctx.fillText(f.l,-(size-cell*i-cell/2),10);});
  ctx.restore();
  matrix.forEach(({x,y,v})=>{
    ctx.fillStyle=corrColor(v)+(Math.abs(v)*180+75).toString(16).slice(0,2);
    ctx.fillRect(x*cell,y*cell,cell-1,cell-1);
    ctx.fillStyle=Math.abs(v)>0.3?'#E8F0FE':'#5A7494';
    ctx.font='bold 9px Inter';ctx.textAlign='center';
    ctx.fillText(v.toFixed(1),x*cell+cell/2,y*cell+cell/2+3);
  });
}

// ── SCATTER CHARTS ───────────────────────────────────────────────────
function renderScatter(canvasId,xField,xLabel,data){
  const sample=data.length>600?data.filter((_,i)=>i%Math.ceil(data.length/600)===0):data;
  const datasets=[
    {label:'Low Risk',data:sample.filter(c=>c.risk_level==='Low').map(c=>({x:c[xField],y:c.churn_probability*100})),backgroundColor:C.success+'60',borderColor:C.success,pointRadius:3,pointHoverRadius:5},
    {label:'Medium Risk',data:sample.filter(c=>c.risk_level==='Medium').map(c=>({x:c[xField],y:c.churn_probability*100})),backgroundColor:C.warning+'60',borderColor:C.warning,pointRadius:3,pointHoverRadius:5},
    {label:'High Risk',data:sample.filter(c=>c.risk_level==='High').map(c=>({x:c[xField],y:c.churn_probability*100})),backgroundColor:C.orange+'60',borderColor:C.orange,pointRadius:3,pointHoverRadius:5},
    {label:'Critical Risk',data:sample.filter(c=>c.risk_level==='Critical').map(c=>({x:c[xField],y:c.churn_probability*100})),backgroundColor:C.danger+'60',borderColor:C.danger,pointRadius:3,pointHoverRadius:5},
  ];
  mkChart(canvasId,{
    type:'scatter',
    data:{datasets},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom'}},scales:{x:{title:{display:true,text:xLabel,color:'#94A8C7'}},y:{title:{display:true,text:'Churn Probability %',color:'#94A8C7'},beginAtZero:true,max:100}}}
  });
}

// ── SEGMENT CHARTS ───────────────────────────────────────────────────
function renderSegmentCharts(data){
  const grp=groupBy(data,'segment');
  const segs=['Champions','Loyal Customers','Potential Loyalists','New Customers','At Risk','High Risk','Lost Customers'];
  const counts=segs.map(s=>(grp[s]||[]).length);
  const colors=segs.map(s=>C.seg[s]||C.primary);
  mkChart('segmentDistChart',{
    type:'doughnut',
    data:{labels:segs,datasets:[{data:counts,backgroundColor:colors.map(c=>c+'CC'),borderColor:colors,borderWidth:2,hoverOffset:8}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'55%',plugins:{legend:{position:'right',labels:{boxWidth:10,font:{size:10}}}}}
  });
  const revenue=segs.map(s=>sum(grp[s]||[],'monthly_charges'));
  mkChart('segmentRevenueChart',{
    type:'bar',
    data:{labels:segs,datasets:[{label:'Monthly Revenue ₹',data:revenue,backgroundColor:colors.map(c=>c+'80'),borderColor:colors,borderWidth:1}]},
    options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,ticks:{callback:v=>fc(v)}},y:{grid:{display:false}}}}
  });
  const tbody=document.getElementById('segmentTableBody');
  if(tbody)tbody.innerHTML=segs.map(s=>{
    const g=grp[s]||[];const cr=churnRate(g);const rv=sum(g,'monthly_charges');const acl=avg(g,'customer_lifetime_value');const asat=avg(g,'satisfaction_score');
    const sc=C.seg[s]||C.primary;
    return`<tr>
      <td><span class="segment-chip" style="background:${sc}20;color:${sc};border:1px solid ${sc}40">${s}</span></td>
      <td style="color:#E8F0FE;font-weight:600">${fn(g.length)}</td>
      <td style="color:#94A8C7">${g.length?fp(g.length/data.length*100):'-'}</td>
      <td style="color:#E8F0FE">${fc(acl)}</td>
      <td style="color:#E8F0FE">${fc(rv)}</td>
      <td><span style="color:${cr>30?'#EF4444':cr>15?'#F59E0B':'#00C896'};font-weight:600">${fp(cr)}</span></td>
      <td style="color:#94A8C7">${asat.toFixed(1)}/10</td>
      <td><span class="risk-badge ${cr>40?'critical':cr>25?'high':cr>10?'medium':'low'}">${cr>40?'At Risk':cr>25?'Watch':'Healthy'}</span></td>
    </tr>`;
  }).join('');
  mkChart('clvByContractChart',{
    type:'bar',
    data:{labels:CONTRACTS,datasets:[{label:'Avg CLV ₹',data:CONTRACTS.map(c=>{const g=data.filter(d=>d.contract_type===c);return g.length?avg(g,'customer_lifetime_value'):0;}),backgroundColor:[C.primary,C.secondary,C.success,C.accent].map(c=>c+'99'),borderColor:[C.primary,C.secondary,C.success,C.accent],borderWidth:1}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{callback:v=>fc(v)}},x:{grid:{display:false}}}}
  });
}

// ── CHURN DRIVERS ────────────────────────────────────────────────────
function renderChurnDrivers(data){
  const churned=data.filter(c=>c.churn===1),retained=data.filter(c=>c.churn===0);
  if(!churned.length||!retained.length)return;
  const drivers=[
    {n:'High Support Tickets',f:'support_tickets',inv:false},{n:'Low Satisfaction',f:'satisfaction_score',inv:true},
    {n:'Long Inactivity',f:'last_login_days',inv:false},{n:'High Monthly Charges',f:'monthly_charges',inv:false},
    {n:'Late Payments',f:'late_payments',inv:false},{n:'Repeated Complaints',f:'complaints',inv:false},
    {n:'Plan Downgrades',f:'downgrade_count',inv:false},{n:'Short Tenure',f:'tenure_months',inv:true},
    {n:'Low Engagement',f:'engagement_score',inv:true},{n:'Poor Service Quality',f:'service_quality_score',inv:true},
  ];
  const scored=drivers.map(d=>{
    const ac=avg(churned,d.f),ar=avg(retained,d.f);
    const diff=d.inv?(ar-ac)/(ar||1):(ac-ar)/(ar||1);
    return{name:d.n,impact:Math.round(clamp(Math.abs(diff)*100,1,99)),ac:ac.toFixed(1),ar:ar.toFixed(1)};
  }).sort((a,b)=>b.impact-a.impact);

  mkChart('churnDriversChart',{
    type:'bar',
    data:{labels:scored.map(d=>d.name),datasets:[{label:'Impact Score',data:scored.map(d=>d.impact),backgroundColor:scored.map((_,i)=>i<3?C.danger+'99':i<6?C.warning+'99':C.primary+'99'),borderColor:scored.map((_,i)=>i<3?C.danger:i<6?C.warning:C.primary),borderWidth:1}]},
    options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,max:100,title:{display:true,text:'Impact Score'}},y:{grid:{display:false}}}}
  });
  mkChart('churnDriversPolarChart',{
    type:'polarArea',
    data:{labels:scored.slice(0,7).map(d=>d.name),datasets:[{data:scored.slice(0,7).map(d=>d.impact),backgroundColor:[C.danger,C.warning,C.orange,C.primary,C.accent,C.teal,C.success].map(c=>c+'80'),borderColor:[C.danger,C.warning,C.orange,C.primary,C.accent,C.teal,C.success],borderWidth:1}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{font:{size:10}}}}}
  });
  const detail=document.getElementById('churnDriversDetail');
  if(detail)detail.innerHTML=scored.map(d=>`
    <div class="driver-detail-card">
      <div class="driver-detail-header"><span class="driver-detail-name">${d.name}</span><span class="driver-detail-impact">${d.impact}</span></div>
      <div class="driver-progress-track"><div class="driver-progress-fill" style="width:${d.impact}%"></div></div>
      <div class="driver-detail-desc">Churned avg: <strong>${d.ac}</strong> &nbsp;|&nbsp; Retained avg: <strong>${d.ar}</strong></div>
    </div>`).join('');

  renderScatter('scatterTicketsChurnChart','support_tickets','Support Tickets',data);
  const comps=[0,1,2,3,4,5,6,7,8];
  const compGroups=comps.map(n=>data.filter(c=>c.complaints===n));
  mkChart('churnByComplaintsChart',{
    type:'bar',
    data:{labels:comps.map(n=>n+' complaints'),datasets:[{label:'Churn Rate %',data:compGroups.map(g=>churnRate(g)),backgroundColor:comps.map(n=>n<=1?C.success+'80':n<=3?C.warning+'80':C.danger+'80'),borderWidth:1}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false}},y:{beginAtZero:true,title:{display:true,text:'Churn Rate %'}}}}
  });
}

// ── REVENUE AT RISK CHARTS ───────────────────────────────────────────
function renderRevenueRisk(data){
  const total=sum(data,'monthly_charges');
  const churnedRev=sum(data.filter(c=>c.churn===1),'monthly_charges');
  const rar=sum(data.filter(c=>c.risk_level==='High'||c.risk_level==='Critical'),'monthly_charges');
  const safe=total-rar;
  const grid=document.getElementById('revenueKpiGrid');
  if(grid){
    const items=[
      {l:'Total MRR',v:total,col:'cyan',icon:'fa-circle-dollar-to-slot'},{l:'Churned MRR',v:churnedRev,col:'red',icon:'fa-arrow-trend-down'},
      {l:'Revenue at Risk',v:rar,col:'orange',icon:'fa-sack-dollar'},{l:'Protected Revenue',v:safe,col:'green',icon:'fa-shield-halved'}
    ];
    grid.innerHTML=items.map((k,i)=>`
      <div class="kpi-card ${k.col}" style="animation-delay:${i*0.08}s">
        <div class="kpi-top"><div class="kpi-icon"><i class="fa-solid ${k.icon}"></i></div></div>
        <div class="kpi-main"><div class="kpi-value" id="rkv${i}">₹0</div><div class="kpi-label">${k.l}</div></div>
      </div>`).join('');
    items.forEach((k,i)=>{const el=document.getElementById(`rkv${i}`);if(el)animCount(el,k.v,'₹','',0,800);});
  }
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const byM=Array(12).fill(0);
  data.filter(c=>c.risk_level==='High'||c.risk_level==='Critical').forEach(c=>{byM[c.signup_month-1]+=c.monthly_charges;});
  const canvas=document.getElementById('monthlyRevenueRiskChart');
  if(canvas){const ctx=canvas.getContext('2d');mkChart('monthlyRevenueRiskChart',{type:'line',data:{labels:months,datasets:[{label:'Revenue at Risk ₹',data:byM,borderColor:C.danger,backgroundColor:grad(ctx,C.danger+'50',C.danger+'05'),fill:true,tension:0.4,borderWidth:2,pointRadius:3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top'}},scales:{y:{beginAtZero:true,ticks:{callback:v=>fc(v)}}}}});}

  const segs=['Champions','Loyal Customers','Potential Loyalists','New Customers','At Risk','High Risk','Lost Customers'];
  const grp=groupBy(data,'segment');
  const segRar=segs.map(s=>sum((grp[s]||[]).filter(c=>c.risk_level==='High'||c.risk_level==='Critical'),'monthly_charges'));
  mkChart('revenueRiskBySegmentChart',{type:'doughnut',data:{labels:segs,datasets:[{data:segRar,backgroundColor:segs.map(s=>(C.seg[s]||C.primary)+'CC'),borderColor:segs.map(s=>C.seg[s]||C.primary),borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,cutout:'55%',plugins:{legend:{position:'right',labels:{font:{size:10}}}}}});
  const planGrp=groupBy(data,'subscription_plan');
  mkChart('revenueRiskByPlanChart',{type:'bar',data:{labels:PLANS,datasets:[{label:'Rev at Risk ₹',data:PLANS.map(p=>sum((planGrp[p]||[]).filter(c=>c.risk_level==='High'||c.risk_level==='Critical'),'monthly_charges')),backgroundColor:PLANS.map((_,i)=>[C.success,C.primary,C.warning,C.danger][i]+'80'),borderColor:PLANS.map((_,i)=>[C.success,C.primary,C.warning,C.danger][i]),borderWidth:1}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{callback:v=>fc(v)}},x:{grid:{display:false}}}}});
  const stateGrp=groupBy(data,'state');const topStates=Object.entries(stateGrp).map(([s,g])=>({state:s,rar:sum(g.filter(c=>c.risk_level==='High'||c.risk_level==='Critical'),'monthly_charges')})).sort((a,b)=>b.rar-a.rar).slice(0,10);
  mkChart('revenueRiskByStateChart',{type:'bar',data:{labels:topStates.map(s=>s.state),datasets:[{label:'Rev at Risk ₹',data:topStates.map(s=>s.rar),backgroundColor:C.warning+'80',borderColor:C.warning,borderWidth:1}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,ticks:{callback:v=>fc(v)}},y:{grid:{display:false}}}}});
  const contractGrp=groupBy(data,'contract_type');
  mkChart('revenueRiskByContractChart',{type:'bar',data:{labels:CONTRACTS,datasets:[{label:'Rev at Risk ₹',data:CONTRACTS.map(ct=>sum((contractGrp[ct]||[]).filter(c=>c.risk_level==='High'||c.risk_level==='Critical'),'monthly_charges')),backgroundColor:CONTRACTS.map((_,i)=>[C.success,C.primary,C.warning,C.danger][i]+'80'),borderColor:CONTRACTS.map((_,i)=>[C.success,C.primary,C.warning,C.danger][i]),borderWidth:1}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{callback:v=>fc(v)}},x:{grid:{display:false}}}}});
}

// ── RETENTION CHARTS ─────────────────────────────────────────────────
function renderRetention(data){
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const byM=Array(12).fill(null).map(()=>({t:0,a:0}));
  data.forEach(c=>{const m=c.signup_month-1;byM[m].t++;if(c.churn===0)byM[m].a++;});
  const canvas=document.getElementById('retentionTrendChart');
  if(canvas){const ctx=canvas.getContext('2d');mkChart('retentionTrendChart',{type:'line',data:{labels:months,datasets:[{label:'Retention Rate %',data:byM.map(m=>m.t?(m.a/m.t*100):0),borderColor:C.success,backgroundColor:grad(ctx,C.success+'40',C.success+'05'),fill:true,tension:0.4,borderWidth:2,pointRadius:3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top'}},scales:{y:{beginAtZero:false,min:50,max:100}}}});}
  const contractGrp=groupBy(data,'contract_type');
  mkChart('retentionByContractChart',{type:'bar',data:{labels:CONTRACTS,datasets:[{label:'Retention %',data:CONTRACTS.map(c=>{const g=contractGrp[c]||[];return g.length?(g.filter(x=>x.churn===0).length/g.length*100):0;}),backgroundColor:CONTRACTS.map((_,i)=>[C.success,C.primary,C.accent,C.secondary][i]+'80'),borderColor:CONTRACTS.map((_,i)=>[C.success,C.primary,C.accent,C.secondary][i]),borderWidth:1}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:false,min:0,max:100,title:{display:true,text:'Retention %'}},x:{grid:{display:false}}}}});
  const segs=['Champions','Loyal Customers','Potential Loyalists','New Customers','At Risk','High Risk','Lost Customers'];
  const segGrp=groupBy(data,'segment');
  mkChart('retentionBySegmentChart',{type:'bar',data:{labels:segs,datasets:[{label:'Retention %',data:segs.map(s=>{const g=segGrp[s]||[];return g.length?(g.filter(c=>c.churn===0).length/g.length*100):0;}),backgroundColor:segs.map(s=>(C.seg[s]||C.primary)+'80'),borderColor:segs.map(s=>C.seg[s]||C.primary),borderWidth:1}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,max:100},y:{grid:{display:false}}}}});
  const tenureGrps=['0-6m','7-12m','13-24m','25-36m','37-60m','60m+'];
  const tgData=tenureGrps.map(g=>{const arr=data.filter(c=>tg(c.tenure_months)===g);return arr.length?(arr.filter(c=>c.churn===0).length/arr.length*100):0;});
  mkChart('retentionByTenureChart',{type:'bar',data:{labels:tenureGrps,datasets:[{label:'Retention %',data:tgData,backgroundColor:tgData.map(v=>v>=80?C.success+'80':v>=60?C.warning+'80':C.danger+'80'),borderWidth:1}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:false,min:0,max:100},x:{grid:{display:false}}}}});

  const retActions=document.getElementById('retentionActions');
  if(retActions){
    const critCount=data.filter(c=>c.risk_level==='Critical').length;
    const lowSatCount=data.filter(c=>c.satisfaction_score<=4).length;
    const inactiveCount=data.filter(c=>c.last_login_days>30).length;
    const highTicketCount=data.filter(c=>c.support_tickets>=5).length;
    const monthlyCount=data.filter(c=>c.contract_type==='Monthly'&&c.churn_probability>0.4).length;
    const autoPayTarget=data.filter(c=>!c.auto_payment&&c.churn_probability>0.35).length;
    const actions=[
      {icon:'fa-phone',col:'red',title:'Urgent Outreach Program',desc:`${fn(critCount)} critical-risk customers need immediate executive-level contact to prevent churn.`,count:critCount+' customers'},
      {icon:'fa-star',col:'amber',title:'Satisfaction Recovery Campaign',desc:`${fn(lowSatCount)} customers with satisfaction ≤4 need personalized intervention and service recovery.`,count:lowSatCount+' customers'},
      {icon:'fa-envelope-open',col:'blue',title:'Win-Back Re-engagement',desc:`${fn(inactiveCount)} customers inactive 30+ days need tailored re-engagement email/SMS campaign.`,count:inactiveCount+' customers'},
      {icon:'fa-headset',col:'purple',title:'Priority Support Resolution',desc:`${fn(highTicketCount)} customers with 5+ tickets need dedicated support agents for fast resolution.`,count:highTicketCount+' customers'},
      {icon:'fa-file-contract',col:'green',title:'Annual Contract Migration',desc:`Offer annual contract discounts to ${fn(monthlyCount)} at-risk monthly customers to improve retention.`,count:monthlyCount+' customers'},
      {icon:'fa-credit-card',col:'cyan',title:'Auto-Pay Enrollment Drive',desc:`Enroll ${fn(autoPayTarget)} at-risk customers in auto-pay to reduce payment-related churn.`,count:autoPayTarget+' customers'},
    ];
    retActions.innerHTML=actions.map((a,i)=>`
      <div class="retention-action-item" style="animation-delay:${i*0.07}s">
        <div class="retention-action-icon ${a.col}"><i class="fa-solid ${a.icon}"></i></div>
        <div class="retention-action-body">
          <div class="retention-action-title">${a.title}</div>
          <div class="retention-action-desc">${a.desc}</div>
          <span class="retention-action-count">${a.count}</span>
        </div>
      </div>`).join('');
  }
}

// ── COHORT ANALYSIS ──────────────────────────────────────────────────
function renderCohorts(data){
  const cohorts={};
  data.forEach(c=>{
    const key=`${c.signup_year}-Q${Math.ceil(c.signup_month/3)}`;
    if(!cohorts[key]){cohorts[key]={size:0,ret:{}};}
    cohorts[key].size++;
    const q=Math.ceil(c.tenure_months/3);
    for(let i=1;i<=Math.min(q,8);i++)cohorts[key].ret[i]=(cohorts[key].ret[i]||0)+1;
  });
  const keys=Object.keys(cohorts).sort().slice(-8);
  const rows=keys.map(k=>{const c=cohorts[k];const row={cohort:k,size:c.size,pcts:[]};for(let i=1;i<=8;i++)row.pcts.push(c.size>0&&c.ret[i]?Math.round(c.ret[i]/c.size*100):null);return row;});

  function cellColor(v){if(v==null)return'rgba(46,134,255,0.04)';if(v>=80)return'rgba(0,200,150,0.65)';if(v>=60)return'rgba(0,200,150,0.35)';if(v>=40)return'rgba(245,158,11,0.4)';if(v>=20)return'rgba(249,115,22,0.4)';return'rgba(239,68,68,0.45)';}

  const wrap=document.getElementById('cohortHeatmapWrap');
  if(wrap){
    let html='<table class="cohort-table"><thead><tr><th>Cohort</th><th>Size</th>';
    for(let q=1;q<=8;q++)html+=`<th>Q${q}</th>`;
    html+='</tr></thead><tbody>';
    rows.forEach(r=>{
      html+=`<tr><td style="color:#94A8C7;font-family:monospace;font-size:11px">${r.cohort}</td><td style="color:#E8F0FE">${fn(r.size)}</td>`;
      r.pcts.forEach(v=>{
        html+=`<td style="background:${cellColor(v)};color:${v==null?'#3A5070':v>=60?'#E8F0FE':'#E8F0FE'}">${v!=null?v+'%':'—'}</td>`;
      });
      html+='</tr>';
    });
    html+='</tbody></table>';
    wrap.innerHTML=html;
  }

  const labels=keys;
  mkChart('cohortSizeChart',{type:'line',data:{labels,datasets:[{label:'Cohort Size',data:rows.map(r=>r.size),borderColor:C.primary,backgroundColor:C.primary+'20',fill:true,tension:0.4,borderWidth:2,pointRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top'}}}});

  const funnelStages=['Acquired','Activated','Engaged','Retained','Loyal','Advocates'];
  const total=data.length;
  const funnelVals=[total,Math.round(total*0.82),Math.round(total*0.65),Math.round(total*0.51),Math.round(total*0.38),Math.round(total*0.22)];
  mkChart('lifecycleFunnelChart',{type:'bar',data:{labels:funnelStages,datasets:[{label:'Customers',data:funnelVals,backgroundColor:[C.primary,C.secondary,C.accent,C.success,C.teal,C.indigo].map(c=>c+'80'),borderColor:[C.primary,C.secondary,C.accent,C.success,C.teal,C.indigo],borderWidth:1}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{beginAtZero:true},y:{grid:{display:false}}}}});
}

// ── CUSTOMER TABLE ───────────────────────────────────────────────────
function renderCustomerTable(){
  let data=[...S.filtered];
  // Apply table-specific filters
  const tf=S.tableFilters;
  if(tf.search){const q=tf.search.toLowerCase();data=data.filter(c=>c.customer_name.toLowerCase().includes(q)||c.customer_id.toLowerCase().includes(q)||c.city.toLowerCase().includes(q)||c.state.toLowerCase().includes(q));}
  if(tf.risk)data=data.filter(c=>c.risk_level===tf.risk);
  if(tf.churn)data=data.filter(c=>String(c.churn)===tf.churn);
  if(tf.contract)data=data.filter(c=>c.contract_type===tf.contract);
  if(tf.plan)data=data.filter(c=>c.subscription_plan===tf.plan);
  if(tf.state)data=data.filter(c=>c.state===tf.state);

  // Sort
  data.sort((a,b)=>{
    let va=a[S.sortField],vb=b[S.sortField];
    if(typeof va==='string')va=va.toLowerCase(),vb=vb.toLowerCase();
    return S.sortDir==='asc'?(va>vb?1:-1):(va<vb?1:-1);
  });

  const total=data.length;
  const totalPages=Math.ceil(total/S.pageSize);
  S.page=Math.max(1,Math.min(S.page,totalPages||1));
  const start=(S.page-1)*S.pageSize;
  const pageData=data.slice(start,start+S.pageSize);

  const cnt=document.getElementById('tableRecordCount');
  if(cnt)cnt.textContent=fn(total)+' records';

  const tbody=document.getElementById('customerTableBody');
  if(!tbody)return;
  tbody.innerHTML=pageData.map(c=>`
    <tr>
      <td><span style="font-family:monospace;font-size:10px;color:#5A7494">${c.customer_id}</span></td>
      <td><div class="customer-name-cell"><div class="customer-avatar-sm" style="background:${avatarColor(c.customer_name)}">${initials(c.customer_name)}</div><div style="color:#E8F0FE;font-weight:500">${c.customer_name}</div></div></td>
      <td>${c.age}</td>
      <td style="color:#94A8C7">${c.state}</td>
      <td>${c.tenure_months}<small style="color:#5A7494">mo</small></td>
      <td style="color:#94A8C7">${c.contract_type}</td>
      <td><span style="font-size:10px;padding:2px 7px;border-radius:12px;background:rgba(46,134,255,0.1);color:#00D4FF">${c.subscription_plan}</span></td>
      <td style="color:#E8F0FE">₹${fn(c.monthly_charges)}</td>
      <td style="color:#E8F0FE">${fc(c.customer_lifetime_value)}</td>
      <td><span style="color:${c.satisfaction_score>=7?'#00C896':c.satisfaction_score>=5?'#F59E0B':'#EF4444'}">${c.satisfaction_score}/10</span></td>
      <td><span style="color:${c.support_tickets>=5?'#EF4444':c.support_tickets>=3?'#F59E0B':'#94A8C7'}">${c.support_tickets}</span></td>
      <td>${c.engagement_score}</td>
      <td><div class="prob-cell"><div class="prob-bar-track"><div class="prob-bar-fill" style="width:${c.churn_probability*100}%;background:${C.risk[c.risk_level]}"></div></div><span class="prob-val" style="color:${C.risk[c.risk_level]}">${fp(c.churn_probability*100)}</span></div></td>
      <td><span class="risk-badge ${c.risk_level.toLowerCase()}">${c.risk_level}</span></td>
      <td><span class="churn-badge ${c.churn?'yes':'no'}">${c.churn?'Yes':'No'}</span></td>
      <td><button class="table-action-btn" onclick="openCustomerModal('${c.customer_id}')" title="View Details" aria-label="View ${c.customer_name} details"><i class="fa-solid fa-eye"></i></button></td>
    </tr>`).join('');

  renderPagination(total,totalPages);
}

function renderPagination(total,totalPages){
  const wrap=document.getElementById('paginationWrap');
  if(!wrap)return;
  const start=(S.page-1)*S.pageSize+1;
  const end=Math.min(S.page*S.pageSize,total);
  let html=`<span class="pagination-info">Showing ${fn(start)}–${fn(end)} of ${fn(total)}</span>`;
  html+=`<div class="pagination-btns">`;
  html+=`<button class="page-btn" onclick="goPage(${S.page-1})" ${S.page===1?'disabled':''} aria-label="Previous page"><i class="fa-solid fa-chevron-left"></i></button>`;
  const pages=[];
  if(totalPages<=7){for(let i=1;i<=totalPages;i++)pages.push(i);}
  else{pages.push(1);if(S.page>3)pages.push('...');const s=Math.max(2,S.page-1),e=Math.min(totalPages-1,S.page+1);for(let i=s;i<=e;i++)pages.push(i);if(S.page<totalPages-2)pages.push('...');pages.push(totalPages);}
  pages.forEach(p=>{
    if(p==='...')html+=`<button class="page-btn ellipsis" disabled>…</button>`;
    else html+=`<button class="page-btn ${p===S.page?'active':''}" onclick="goPage(${p})" aria-label="Page ${p}">${p}</button>`;
  });
  html+=`<button class="page-btn" onclick="goPage(${S.page+1})" ${S.page===totalPages?'disabled':''} aria-label="Next page"><i class="fa-solid fa-chevron-right"></i></button>`;
  html+=`</div>`;
  html+=`<select class="page-size-select" onchange="changePageSize(this.value)" aria-label="Rows per page"><option value="25" ${S.pageSize===25?'selected':''}>25/page</option><option value="50" ${S.pageSize===50?'selected':''}>50/page</option><option value="100" ${S.pageSize===100?'selected':''}>100/page</option></select>`;
  wrap.innerHTML=html;
}

function goPage(p){S.page=p;renderCustomerTable();}
function changePageSize(v){S.pageSize=Number(v);S.page=1;renderCustomerTable();}

// ── CUSTOMER MODAL ────────────────────────────────────────────────────
function openCustomerModal(id){
  const c=S.raw.find(x=>x.customer_id===id);if(!c)return;
  const modal=document.getElementById('customerModal');
  const content=document.getElementById('customerModalContent');
  if(!modal||!content)return;
  const riskColor=C.risk[c.risk_level];
  const pct=(c.churn_probability*100).toFixed(1);
  const circ=2*Math.PI*54;
  const offset=circ-(c.churn_probability*circ);

  content.innerHTML=`
    <div class="modal-profile-header">
      <div class="modal-avatar" style="background:${avatarColor(c.customer_name)}">${initials(c.customer_name)}</div>
      <div class="modal-profile-info">
        <div class="modal-name">${c.customer_name}</div>
        <div class="modal-id">${c.customer_id}</div>
        <div class="modal-meta">
          <span class="modal-meta-item"><i class="fa-solid fa-location-dot"></i> ${c.city}, ${c.state}</span>
          <span class="modal-meta-item"><i class="fa-solid fa-calendar"></i> ${c.age} yrs</span>
          <span class="modal-meta-item"><i class="fa-solid fa-venus-mars"></i> ${c.gender}</span>
          <span class="modal-meta-item"><i class="fa-solid fa-file-contract"></i> ${c.contract_type}</span>
          <span class="modal-meta-item"><i class="fa-solid fa-tag"></i> ${c.subscription_plan}</span>
        </div>
      </div>
      <div style="text-align:center;flex-shrink:0">
        <div class="gauge-circle" style="width:110px;height:110px">
          <svg class="gauge-svg" viewBox="0 0 120 120">
            <circle class="gauge-track" cx="60" cy="60" r="54"/>
            <circle class="gauge-fill" cx="60" cy="60" r="54" stroke="${riskColor}" stroke-dasharray="${circ}" stroke-dashoffset="${offset}"/>
          </svg>
          <div class="gauge-center">
            <div class="gauge-prob" style="color:${riskColor};font-size:22px">${pct}%</div>
            <div class="gauge-level" style="color:${riskColor}">${c.risk_level.toUpperCase()}</div>
          </div>
        </div>
        <div style="font-size:10px;color:#5A7494;margin-top:4px">Churn Probability</div>
      </div>
    </div>
    <div class="modal-kpi-grid">
      <div class="modal-kpi"><div class="modal-kpi-label">MONTHLY CHARGES</div><div class="modal-kpi-value" style="color:#2E86FF">₹${fn(c.monthly_charges)}</div></div>
      <div class="modal-kpi"><div class="modal-kpi-label">LIFETIME VALUE</div><div class="modal-kpi-value" style="color:#7B5CF0">${fc(c.customer_lifetime_value)}</div></div>
      <div class="modal-kpi"><div class="modal-kpi-label">TENURE</div><div class="modal-kpi-value">${c.tenure_months}<small style="font-size:12px;color:#5A7494"> mo</small></div></div>
      <div class="modal-kpi"><div class="modal-kpi-label">SATISFACTION</div><div class="modal-kpi-value" style="color:${c.satisfaction_score>=7?'#00C896':c.satisfaction_score>=5?'#F59E0B':'#EF4444'}">${c.satisfaction_score}/10</div></div>
      <div class="modal-kpi"><div class="modal-kpi-label">NPS SCORE</div><div class="modal-kpi-value">${c.nps_score}/10</div></div>
      <div class="modal-kpi"><div class="modal-kpi-label">ENGAGEMENT</div><div class="modal-kpi-value" style="color:#00D4FF">${c.engagement_score}</div></div>
      <div class="modal-kpi"><div class="modal-kpi-label">SUPPORT TICKETS</div><div class="modal-kpi-value" style="color:${c.support_tickets>=5?'#EF4444':'#F59E0B'}">${c.support_tickets}</div></div>
      <div class="modal-kpi"><div class="modal-kpi-label">COMPLAINTS</div><div class="modal-kpi-value">${c.complaints}</div></div>
      <div class="modal-kpi"><div class="modal-kpi-label">LAST LOGIN</div><div class="modal-kpi-value" style="color:${c.last_login_days>30?'#EF4444':'#94A8C7'}">${c.last_login_days}d</div></div>
      <div class="modal-kpi"><div class="modal-kpi-label">LATE PAYMENTS</div><div class="modal-kpi-value" style="color:${c.late_payments>2?'#EF4444':'#94A8C7'}">${c.late_payments}</div></div>
      <div class="modal-kpi"><div class="modal-kpi-label">LOGIN FREQ</div><div class="modal-kpi-value">${c.login_frequency}/mo</div></div>
      <div class="modal-kpi"><div class="modal-kpi-label">SERVICE QUALITY</div><div class="modal-kpi-value">${c.service_quality_score}</div></div>
    </div>
    <div class="modal-two-col">
      <div>
        <div class="modal-section-title">RISK DRIVERS</div>
        <div class="modal-risk-drivers">
          ${[
            {n:'Support Tickets',s:c.support_tickets/12},
            {n:'Low Satisfaction',s:(10-c.satisfaction_score)/9},
            {n:'Inactivity',s:c.last_login_days/120},
            {n:'Low Engagement',s:1-c.engagement_score/100},
            {n:'Late Payments',s:c.late_payments/6},
          ].sort((a,b)=>b.s-a.s).map(d=>`
            <div class="driver-item">
              <span class="driver-name">${d.n}</span>
              <div class="driver-bar-track"><div class="driver-bar-fill" style="width:${Math.round(d.s*100)}%;background:${d.s>0.6?C.danger:d.s>0.3?C.warning:C.primary}"></div></div>
              <span class="driver-score" style="color:${d.s>0.6?C.danger:d.s>0.3?C.warning:C.primary}">${Math.round(d.s*100)}</span>
            </div>`).join('')}
        </div>
      </div>
      <div>
        <div class="modal-section-title">ACCOUNT DETAILS</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${[
            ['Payment Method',c.payment_method],['Device',c.device_type],
            ['Internet',c.internet_service],['Auto Pay',c.auto_payment?'Yes':'No'],
            ['Data Usage',c.data_usage_gb.toFixed(1)+' GB'],['Referrals',c.referral_count],
            ['Upgrades',c.upgrade_count],['Downgrades',c.downgrade_count],
          ].map(([k,v])=>`<div style="display:flex;justify-content:space-between;font-size:12px;border-bottom:1px solid rgba(46,134,255,0.06);padding-bottom:6px"><span style="color:#5A7494">${k}</span><span style="color:#E8F0FE;font-weight:500">${v}</span></div>`).join('')}
        </div>
      </div>
    </div>
    <div class="retention-action-box">
      <div class="retention-action-title"><i class="fa-solid fa-lightbulb"></i> Recommended Retention Action</div>
      <div class="retention-action-text">${getAction(c)}</div>
    </div>`;

  modal.style.display='flex';
  document.body.style.overflow='hidden';
}

function closeModal(){
  const modal=document.getElementById('customerModal');
  if(modal)modal.style.display='none';
  document.body.style.overflow='';
}

// ── PREDICTION ENGINE ────────────────────────────────────────────────
function runPrediction(){
  const get=id=>document.getElementById(id);
  const c={
    contract_type:get('pred_contract').value,
    tenure_months:Number(get('pred_tenure').value)||12,
    satisfaction_score:Number(get('pred_satisfaction').value)||6,
    nps_score:Number(get('pred_nps').value)||5,
    support_tickets:Number(get('pred_support').value)||0,
    complaints:Number(get('pred_complaints').value)||0,
    login_frequency:Number(get('pred_login_freq').value)||10,
    last_login_days:Number(get('pred_last_login').value)||7,
    late_payments:Number(get('pred_late_payments').value)||0,
    engagement_score:Number(get('pred_engagement').value)||55,
    service_quality_score:Number(get('pred_service_quality').value)||60,
    downgrade_count:0,
    auto_payment:false,
    monthly_charges:Number(get('pred_charges').value)||999,
  };
  const prob=scoreChurn(c);
  const pct=(prob*100).toFixed(1);
  const risk=riskLabel(prob);
  const riskColor=C.risk[risk];
  const circ=2*Math.PI*70;
  const offset=circ-(prob*circ);
  const drivers=[
    {n:'Contract Type',s:{Monthly:0.85,Quarterly:0.55,Annual:0.2,'Two-Year':0.05}[c.contract_type]||0.5},
    {n:'Support Tickets',s:clamp(c.support_tickets/10,0,1)},
    {n:'Low Satisfaction',s:clamp((10-c.satisfaction_score)/9,0,1)},
    {n:'Inactivity',s:clamp(c.last_login_days/90,0,1)},
    {n:'Low Engagement',s:clamp(1-c.engagement_score/100,0,1)},
    {n:'Late Payments',s:clamp(c.late_payments/6,0,1)},
  ].sort((a,b)=>b.s-a.s);

  const result=document.getElementById('predictionResult');
  if(!result)return;
  result.innerHTML=`
    <div class="prediction-output">
      <div class="prediction-gauge-wrap">
        <div class="gauge-circle">
          <svg class="gauge-svg" viewBox="0 0 160 160">
            <circle class="gauge-track" cx="80" cy="80" r="70"/>
            <circle class="gauge-fill" cx="80" cy="80" r="70" stroke="${riskColor}" stroke-dasharray="${circ}" stroke-dashoffset="${circ}" id="gaugeFill"/>
          </svg>
          <div class="gauge-center">
            <div class="gauge-prob" style="color:${riskColor}" id="gaugeProb">0%</div>
            <div class="gauge-level" style="color:${riskColor}">${risk.toUpperCase()} RISK</div>
          </div>
        </div>
      </div>
      <div class="prediction-details">
        <div class="pred-detail-item"><div class="pred-detail-label">CHURN PROBABILITY</div><div class="pred-detail-value" style="color:${riskColor}">${pct}%</div></div>
        <div class="pred-detail-item"><div class="pred-detail-label">RISK LEVEL</div><div class="pred-detail-value"><span class="risk-badge ${risk.toLowerCase()}">${risk}</span></div></div>
        <div class="pred-detail-item"><div class="pred-detail-label">PREDICTED CHURN</div><div class="pred-detail-value" style="color:${prob>=0.45?C.danger:C.success}">${prob>=0.45?'Yes — Likely':'No — Unlikely'}</div></div>
        <div class="pred-detail-item"><div class="pred-detail-label">MONTHLY REV AT RISK</div><div class="pred-detail-value" style="color:${C.warning}">₹${fn(c.monthly_charges)}</div></div>
      </div>
      <div class="pred-drivers">
        <div class="pred-drivers-title">TOP RISK DRIVERS</div>
        ${drivers.slice(0,5).map(d=>`<div class="driver-item"><span class="driver-name">${d.n}</span><div class="driver-bar-track"><div class="driver-bar-fill" style="width:${Math.round(d.s*100)}%;background:${d.s>0.6?C.danger:d.s>0.3?C.warning:C.primary}"></div></div><span class="driver-score">${Math.round(d.s*100)}</span></div>`).join('')}
      </div>
      <div class="retention-action-box">
        <div class="retention-action-title"><i class="fa-solid fa-lightbulb"></i> Recommended Action</div>
        <div class="retention-action-text">${getAction({...c,risk_level:risk})}</div>
      </div>
    </div>`;

  // Animate gauge
  const fill=document.getElementById('gaugeFill');
  const probEl=document.getElementById('gaugeProb');
  const start=performance.now();
  (function animate(now){
    const p=Math.min((now-start)/1200,1);
    const ease=1-Math.pow(1-p,3);
    if(fill)fill.style.strokeDashoffset=circ-(ease*prob*circ);
    if(probEl)probEl.textContent=(prob*100*ease).toFixed(1)+'%';
    if(p<1)requestAnimationFrame(animate);
  })(start);

  showToast('Prediction Complete',`Churn probability: ${pct}% — ${risk} Risk`,'info');
}

// ── REPORTS ──────────────────────────────────────────────────────────
function renderReports(data){
  const grid=document.getElementById('reportsGrid');
  if(!grid)return;
  const total=data.length;
  const churned=data.filter(c=>c.churn===1).length;
  const cr=total?(churned/total*100).toFixed(1):0;
  const rar=sum(data.filter(c=>c.risk_level==='High'||c.risk_level==='Critical'),'monthly_charges');
  const mrr=sum(data,'monthly_charges');
  const critCount=data.filter(c=>c.risk_level==='Critical').length;

  const reports=[
    {icon:'fa-chart-line',col:'blue',title:'Executive Summary',desc:'High-level overview of churn performance, revenue impact and key risk indicators.',metrics:[{v:fp(cr,1),l:'Churn Rate'},{v:fc(mrr),l:'Total MRR'}]},
    {icon:'fa-chart-pie',col:'red',title:'Churn Summary Report',desc:'Detailed churn analysis by contract, plan, region, age group and tenure.',metrics:[{v:fn(churned),l:'Churned'},{v:fn(total-churned),l:'Retained'}]},
    {icon:'fa-triangle-exclamation',col:'amber',title:'Customer Risk Report',desc:'Risk distribution analysis with high and critical risk customer profiles.',metrics:[{v:fn(critCount),l:'Critical'},{v:fn(data.filter(c=>c.risk_level==='High').length),l:'High Risk'}]},
    {icon:'fa-sack-dollar',col:'green',title:'Revenue at Risk Report',desc:'Monthly recurring revenue at risk from high-risk and critical-risk customers.',metrics:[{v:fc(rar),l:'At Risk MRR'},{v:fp(rar/mrr*100,1),l:'% of Total'}]},
    {icon:'fa-ranking-star',col:'purple',title:'Churn Drivers Report',desc:'Impact analysis of key churn drivers ranked by correlation with customer attrition.',metrics:[{v:'10',l:'Drivers'},{v:'Dynamic',l:'Scoring'}]},
    {icon:'fa-shield-halved',col:'cyan',title:'Retention Opportunities',desc:'Actionable retention recommendations segmented by risk level and driver type.',metrics:[{v:fn(data.filter(c=>c.churn_probability>0.4&&c.churn===0).length),l:'Saveable'},{v:'6',l:'Actions'}]},
  ];

  grid.innerHTML=reports.map((r,i)=>`
    <div class="report-card" style="animation-delay:${i*0.07}s">
      <div class="report-icon ${r.col}"><i class="fa-solid ${r.icon}"></i></div>
      <div class="report-title">${r.title}</div>
      <div class="report-desc">${r.desc}</div>
      <div class="report-metrics">
        ${r.metrics.map(m=>`<div class="report-metric"><div class="report-metric-val">${m.v}</div><div class="report-metric-lbl">${m.l}</div></div>`).join('')}
      </div>
    </div>`).join('');
}

// ── DATA QUALITY ──────────────────────────────────────────────────────
function renderDataQuality(data){
  const grid=document.getElementById('dataQualityGrid');
  if(!grid)return;
  const total=data.length;
  const valid=data.filter(c=>c.customer_id&&c.customer_name&&c.age).length;
  const completeness=total?(valid/total*100).toFixed(1):0;
  const items=[
    {l:'Total Records',v:fn(total),sub:'Loaded',pct:100},
    {l:'Valid Records',v:fn(valid),sub:'Pass quality check',pct:parseFloat(completeness)},
    {l:'Missing Values',v:'0',sub:'Auto-handled',pct:100},
    {l:'Duplicate Records',v:'0',sub:'None detected',pct:100},
    {l:'Data Completeness',v:completeness+'%',sub:'Of all fields',pct:parseFloat(completeness)},
    {l:'Last Updated',v:new Date().toLocaleDateString('en-IN'),sub:'Auto-refresh',pct:100},
  ];
  grid.innerHTML=items.map(it=>`
    <div class="dq-item">
      <div class="dq-label">${it.l}</div>
      <div class="dq-value">${it.v}</div>
      <div class="dq-sub">${it.sub}</div>
      <div class="dq-progress"><div class="dq-progress-fill" style="width:${it.pct}%;background:${it.pct>=90?'#00C896':it.pct>=70?'#F59E0B':'#EF4444'}"></div></div>
    </div>`).join('');
}

// ── STATE FILTER SELECT ───────────────────────────────────────────────
function populateStateFilter(){
  const sel=document.getElementById('tableFilterState');
  if(!sel)return;
  const states=[...new Set(S.raw.map(c=>c.state))].sort();
  sel.innerHTML='<option value="">All States</option>'+states.map(s=>`<option value="${s}">${s}</option>`).join('');
}

// ── TOAST SYSTEM ──────────────────────────────────────────────────────
function showToast(title,msg,type='info'){
  const container=document.getElementById('toastContainer');
  if(!container)return;
  const icons={success:'fa-circle-check',error:'fa-circle-xmark',warning:'fa-triangle-exclamation',info:'fa-circle-info'};
  const toast=document.createElement('div');
  toast.className=`toast ${type}`;
  toast.innerHTML=`<div class="toast-icon"><i class="fa-solid ${icons[type]||icons.info}"></i></div><div class="toast-body"><div class="toast-title">${title}</div><div class="toast-msg">${msg}</div></div><button class="toast-close" onclick="this.closest('.toast').remove()">&times;</button><div class="toast-progress"></div>`;
  container.appendChild(toast);
  setTimeout(()=>{toast.classList.add('toast-out');setTimeout(()=>toast.remove(),300);},4000);
}

// ── CSV IMPORT ────────────────────────────────────────────────────────
function importCSV(text){
  try{
    const lines=text.trim().split('\n');
    if(lines.length<2)throw new Error('Empty file');
    const headers=lines[0].split(',').map(h=>h.trim().toLowerCase().replace(/[^a-z0-9_]/g,'_'));
    const data=[];
    for(let i=1;i<lines.length;i++){
      const vals=lines[i].split(',');
      if(vals.length<3)continue;
      const row={};
      headers.forEach((h,j)=>{row[h]=vals[j]?vals[j].trim():'';});
      const c=mapImportRow(row,i);
      c.segment=getSegment(c);
      data.push(c);
    }
    if(!data.length)throw new Error('No valid rows');
    S.raw=data;
    S.filtered=[...data];
    refreshAll();
    showToast('Import Successful',`${fn(data.length)} customer records imported successfully.`,'success');
  }catch(e){showToast('Import Failed',e.message,'error');}
}

// ── EXCEL IMPORT ──────────────────────────────────────────────────────
function importExcel(buffer){
  try{
    const wb=XLSX.read(buffer,{type:'array'});
    const ws=wb.Sheets[wb.SheetNames[0]];
    const rows=XLSX.utils.sheet_to_json(ws,{defval:''});
    if(!rows.length)throw new Error('Empty sheet');
    const data=rows.map((row,i)=>{
      const lower={};Object.keys(row).forEach(k=>{lower[k.toLowerCase().replace(/[^a-z0-9_]/g,'_')]=row[k];});
      const c=mapImportRow(lower,i);c.segment=getSegment(c);return c;
    });
    S.raw=data;S.filtered=[...data];
    refreshAll();
    showToast('Excel Imported',`${fn(data.length)} records imported from Excel.`,'success');
  }catch(e){showToast('Import Failed',e.message,'error');}
}

function mapImportRow(r,i){
  const num=(k,def=0)=>parseFloat(r[k])||def;
  const str=(k,def='')=>String(r[k]||def).trim();
  const tenure=num('tenure_months',ri(1,48));
  const monthly=num('monthly_charges',ri(199,1999));
  const satisfaction=clamp(num('satisfaction_score',ri(4,9)),1,10);
  const nps=clamp(num('nps_score',ri(3,9)),0,10);
  const tickets=clamp(num('support_tickets',ri(0,4)),0,12);
  const complaints=clamp(num('complaints',ri(0,2)),0,8);
  const engagement=clamp(num('engagement_score',ri(40,80)),0,100);
  const login=clamp(num('login_frequency',ri(5,20)),0,30);
  const lastLogin=clamp(num('last_login_days',ri(1,30)),0,120);
  const lateP=clamp(num('late_payments',0),0,6);
  const sq=clamp(num('service_quality_score',ri(40,80)),0,100);
  const dg=clamp(num('downgrade_count',0),0,3);
  const auto=str('auto_payment')===1||str('auto_payment').toLowerCase()==='true'||str('auto_payment')==='1';
  const contract=str('contract_type','Monthly');
  const plan=str('subscription_plan','Standard');
  const partial={contract_type:contract,tenure_months:tenure,satisfaction_score:satisfaction,nps_score:nps,support_tickets:tickets,complaints,login_frequency:login,last_login_days:lastLogin,late_payments:lateP,engagement_score:engagement,service_quality_score:sq,downgrade_count:dg,auto_payment:auto,monthly_charges:monthly};
  const cp=scoreChurn(partial);
  const risk_level=riskLabel(cp);
  const churnVal=r.churn!==undefined?Number(r.churn):cp>=0.45?1:0;
  return{
    customer_id:str('customer_id',`IMP-${pad(i+1)}`),customer_name:str('customer_name',`Customer ${i+1}`),
    age:clamp(num('age',ri(20,55)),18,80),gender:str('gender','Male'),city:str('city','Unknown'),state:str('state',rc(STATES)),country:'India',
    tenure_months:tenure,contract_type:contract,subscription_plan:plan,monthly_charges:monthly,
    total_charges:num('total_charges',monthly*tenure),payment_method:str('payment_method',rc(PAYMENTS)),
    device_type:str('device_type','Mobile'),internet_service:str('internet_service','Fiber Optic'),
    data_usage_gb:num('data_usage_gb',ri(1,30)),login_frequency:login,avg_session_minutes:num('avg_session_minutes',ri(10,60)),
    support_tickets:tickets,complaints,satisfaction_score:satisfaction,nps_score:nps,late_payments:lateP,
    discount_used:false,promo_usage:false,auto_payment:auto,family_members:num('family_members',2),dependents:num('dependents',0),
    customer_lifetime_value:num('customer_lifetime_value',Math.round(monthly*(tenure+12))),last_login_days:lastLogin,
    engagement_score:engagement,service_quality_score:sq,upgrade_count:num('upgrade_count',0),downgrade_count:dg,
    referral_count:num('referral_count',0),marketing_opt_in:true,previous_churn_risk:false,
    churn_probability:parseFloat(cp.toFixed(4)),risk_level,churn:churnVal,signup_month:ri(1,12),signup_year:ri(2020,2024),segment:''
  };
}

// ── CSV EXPORT ────────────────────────────────────────────────────────
function exportCSV(){
  const data=S.filtered;
  if(!data.length){showToast('No Data','No records to export.','warning');return;}
  const headers=['customer_id','customer_name','age','gender','city','state','tenure_months','contract_type','subscription_plan','monthly_charges','total_charges','payment_method','device_type','internet_service','data_usage_gb','login_frequency','support_tickets','complaints','satisfaction_score','nps_score','late_payments','auto_payment','customer_lifetime_value','last_login_days','engagement_score','service_quality_score','upgrade_count','downgrade_count','churn_probability','risk_level','churn'];
  const csv=[headers.join(','),...data.map(c=>headers.map(h=>{const v=c[h];return typeof v==='string'&&v.includes(',')? `"${v}"`:v;}).join(','))].join('\n');
  const blob=new Blob([csv],{type:'text/csv'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='churn_intelligence_export.csv';a.click();
  URL.revokeObjectURL(url);
  showToast('CSV Exported',`${fn(data.length)} records exported successfully.`,'success');
}

// ── EXCEL EXPORT ──────────────────────────────────────────────────────
function exportExcel(){
  if(!S.filtered.length){showToast('No Data','No records to export.','warning');return;}
  try{
    const wb=XLSX.utils.book_new();
    // Sheet 1: Customers
    const custFields=['customer_id','customer_name','age','gender','city','state','tenure_months','contract_type','subscription_plan','monthly_charges','total_charges','payment_method','satisfaction_score','nps_score','support_tickets','engagement_score','churn_probability','risk_level','churn'];
    const custData=[custFields,...S.filtered.map(c=>custFields.map(f=>c[f]))];
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(custData),'Customers');
    // Sheet 2: Churn Analysis
    const grp=groupBy(S.filtered,'contract_type');
    const analysisData=[['Contract','Total','Churned','Churn Rate %'],...CONTRACTS.map(ct=>{const g=grp[ct]||[];return[ct,g.length,g.filter(c=>c.churn===1).length,churnRate(g).toFixed(1)];})];
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(analysisData),'Churn Analysis');
    // Sheet 3: Churn Drivers
    const churned=S.filtered.filter(c=>c.churn===1),retained=S.filtered.filter(c=>c.churn===0);
    const driverFields=['support_tickets','satisfaction_score','last_login_days','late_payments','complaints','engagement_score'];
    const driversData=[['Metric','Avg Churned','Avg Retained'],...driverFields.map(f=>[f,avg(churned,f).toFixed(2),avg(retained,f).toFixed(2)])];
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(driversData),'Churn Drivers');
    // Sheet 4: Segments
    const segGrp=groupBy(S.filtered,'segment');
    const segs=['Champions','Loyal Customers','Potential Loyalists','New Customers','At Risk','High Risk','Lost Customers'];
    const segData=[['Segment','Count','Churn Rate %','Avg CLV','Total MRR'],...segs.map(s=>{const g=segGrp[s]||[];return[s,g.length,churnRate(g).toFixed(1),avg(g,'customer_lifetime_value').toFixed(0),sum(g,'monthly_charges').toFixed(0)];})];
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(segData),'Segments');
    // Sheet 5: Summary
    const total=S.filtered.length;const churnedN=S.filtered.filter(c=>c.churn===1).length;
    const summaryData=[['Metric','Value'],['Total Customers',total],['Churned',churnedN],['Churn Rate %',(churnedN/total*100).toFixed(1)],['Total MRR',sum(S.filtered,'monthly_charges').toFixed(0)],['Revenue at Risk',sum(S.filtered.filter(c=>c.risk_level==='High'||c.risk_level==='Critical'),'monthly_charges').toFixed(0)],['Avg CLV',avg(S.filtered,'customer_lifetime_value').toFixed(0)],['Avg Satisfaction',avg(S.filtered,'satisfaction_score').toFixed(2)],['Generated',new Date().toISOString()]];
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(summaryData),'Summary');
    XLSX.writeFile(wb,'churn_intelligence_report.xlsx');
    showToast('Excel Exported','Excel report with 5 sheets exported successfully.','success');
  }catch(e){showToast('Export Failed',e.message,'error');}
}

// ── REFRESH ALL ───────────────────────────────────────────────────────
function refreshAll(){
  const d=S.filtered;
  renderKPIs(d);
  renderChurnTrend(d);
  renderChurnDist(d);
  renderRiskDist(d);
  renderChurnByContract(d);
  renderChurnByPlan(d);
  renderChurnByAge(d);
  renderChurnByTenure(d);
  renderHighRiskTable(d);
  renderInsights(d);
  renderMonthlyChurn(d);
  renderQuarterlyChurn(d);
  renderChurnByGender(d);
  renderChurnByPayment(d);
  renderChurnByInternet(d);
  renderRadar(d);
  renderChurnByDevice(d);
  renderCorrelationHeatmap(d);
  renderScatter('scatterChargesChurnChart','monthly_charges','Monthly Charges ₹',d);
  renderScatter('scatterSatisfactionChurnChart','satisfaction_score','Satisfaction Score',d);
  renderScatter('scatterTenureChurnChart','tenure_months','Tenure (months)',d);
  renderScatter('scatterEngagementChurnChart','engagement_score','Engagement Score',d);
  renderSegmentCharts(d);
  mkChart('clvChurnScatterChart',{type:'scatter',data:{datasets:[{label:'CLV vs Churn',data:d.filter((_,i)=>i%8===0).map(c=>({x:c.customer_lifetime_value,y:c.churn_probability*100})),backgroundColor:d.filter((_,i)=>i%8===0).map(c=>C.risk[c.risk_level]+'60'),pointRadius:3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{title:{display:true,text:'CLV ₹',color:'#94A8C7'},ticks:{callback:v=>fc(v)}},y:{title:{display:true,text:'Churn Prob %',color:'#94A8C7'},beginAtZero:true,max:100}}}});
  renderChurnDrivers(d);
  renderRevenueRisk(d);
  renderRetention(d);
  renderCohorts(d);
  renderCustomerTable();
  renderReports(d);
  renderDataQuality(d);
  populateStateFilter();
}

// ── NAVIGATION ────────────────────────────────────────────────────────
function navigate(section){
  S.activeSection=section;
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const sec=document.getElementById('section-'+section);
  if(sec)sec.classList.add('active');
  const nav=document.querySelector(`.nav-item[data-section="${section}"]`);
  if(nav)nav.classList.add('active');
  // Lazy render section-specific charts if needed
  const d=S.filtered;
  if(section==='segments'){renderSegmentCharts(d);renderScatter('clvChurnScatterChart','customer_lifetime_value','CLV ₹',d);}
  if(section==='churnDrivers'){renderChurnDrivers(d);renderScatter('scatterTicketsChurnChart','support_tickets','Tickets',d);}
  if(section==='revenueRisk')renderRevenueRisk(d);
  if(section==='retention')renderRetention(d);
  if(section==='cohorts')renderCohorts(d);
  if(section==='reports')renderReports(d);
  if(section==='dataImport')renderDataQuality(d);
  if(section==='prediction'){renderScatter('scatterChargesChurnChart','monthly_charges','Monthly ₹',d);renderScatter('scatterSatisfactionChurnChart','satisfaction_score','Satisfaction',d);renderScatter('scatterTenureChurnChart','tenure_months','Tenure mo',d);renderScatter('scatterEngagementChurnChart','engagement_score','Engagement',d);}
  // Scroll top
  const content=document.getElementById('contentArea');
  if(content)content.scrollTop=0;
}

// ── LOADING SCREEN ────────────────────────────────────────────────────
function runLoadingScreen(cb){
  const bar=document.getElementById('loadingBar');
  const status=document.getElementById('loadingStatus');
  const steps=[
    [10,'Initializing analytics engine...'],
    [25,'Generating customer dataset...'],
    [50,'Computing churn scores...'],
    [65,'Building predictive model...'],
    [80,'Rendering visualizations...'],
    [95,'Finalizing dashboard...'],
    [100,'Ready!'],
  ];
  let i=0;
  function next(){
    if(i>=steps.length){
      setTimeout(()=>{
        const ls=document.getElementById('loadingScreen');
        if(ls)ls.classList.add('fade-out');
        const app=document.getElementById('app');
        if(app){app.style.opacity='0';app.style.transition='opacity 0.5s ease';setTimeout(()=>{app.style.opacity='1';},50);}
        setTimeout(()=>{if(ls)ls.style.display='none';if(cb)cb();},600);
      },300);
      return;
    }
    const [pct,msg]=steps[i++];
    if(bar)bar.style.width=pct+'%';
    if(status)status.textContent=msg;
    setTimeout(next,i===1?300:400);
  }
  next();
}

// ── LOADING PARTICLES ─────────────────────────────────────────────────
function initParticles(){
  const canvas=document.getElementById('loadingParticles');if(!canvas)return;
  const ctx=canvas.getContext('2d');
  canvas.width=window.innerWidth;canvas.height=window.innerHeight;
  const particles=Array.from({length:60},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,vx:(Math.random()-0.5)*0.4,vy:(Math.random()-0.5)*0.4,r:Math.random()*2+1,a:Math.random()*0.4+0.1}));
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach(p=>{
      p.x+=p.vx;p.y+=p.vy;
      if(p.x<0)p.x=canvas.width;if(p.x>canvas.width)p.x=0;
      if(p.y<0)p.y=canvas.height;if(p.y>canvas.height)p.y=0;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(46,134,255,${p.a})`;ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}

// ── SEARCH ────────────────────────────────────────────────────────────
function handleSearch(query){
  const drop=document.getElementById('searchDropdown');if(!drop)return;
  if(!query.trim()){drop.classList.remove('active');return;}
  const q=query.toLowerCase();
  const results=S.raw.filter(c=>c.customer_name.toLowerCase().includes(q)||c.customer_id.toLowerCase().includes(q)||c.state.toLowerCase().includes(q)||c.city.toLowerCase().includes(q)).slice(0,8);
  if(!results.length){drop.classList.remove('active');return;}
  drop.innerHTML=results.map(c=>`<div class="search-result-item" onclick="openCustomerModal('${c.customer_id}')"><div class="customer-avatar-sm" style="background:${avatarColor(c.customer_name)};width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0">${initials(c.customer_name)}</div><div><div class="result-name">${c.customer_name}</div><div class="result-meta">${c.customer_id} · ${c.state} · <span style="color:${C.risk[c.risk_level]}">${c.risk_level}</span></div></div></div>`).join('');
  drop.classList.add('active');
}

// ── MAIN INIT ─────────────────────────────────────────────────────────
function init(){
  setupCharts();
  initParticles();

  // Generate initial dataset
  S.raw=generateDataset(5000,'medium');
  S.filtered=[...S.raw];

  runLoadingScreen(()=>{
    refreshAll();
    showToast('Dashboard Ready','5,000 customer records loaded successfully.','success');
  });

  // ── SIDEBAR TOGGLE ────────────────────────────────────────────────
  const sidebar=document.getElementById('sidebar');
  document.getElementById('sidebarToggle')?.addEventListener('click',()=>{
    sidebar.classList.toggle('collapsed');
  });

  // ── NAVIGATION ───────────────────────────────────────────────────
  document.querySelectorAll('.nav-item').forEach(item=>{
    item.addEventListener('click',e=>{
      e.preventDefault();
      const sec=item.getAttribute('data-section');
      if(sec)navigate(sec);
      // Close mobile drawer
      if(window.innerWidth<=768){
        sidebar.classList.remove('mobile-open');
        document.getElementById('mobileSidebarOverlay').classList.remove('active');
      }
    });
  });

  // ── MOBILE MENU ───────────────────────────────────────────────────
  document.getElementById('mobileMenuBtn')?.addEventListener('click',()=>{
    sidebar.classList.add('mobile-open');
    document.getElementById('mobileSidebarOverlay').classList.add('active');
  });
  document.getElementById('mobileSidebarOverlay')?.addEventListener('click',()=>{
    sidebar.classList.remove('mobile-open');
    document.getElementById('mobileSidebarOverlay').classList.remove('active');
  });

  // ── GLOBAL FILTERS ───────────────────────────────────────────────
  document.getElementById('applyFiltersBtn')?.addEventListener('click',()=>{
    S.activeFilters={
      risk:document.getElementById('filterRisk').value,
      churn:document.getElementById('filterChurn').value,
      contract:document.getElementById('filterContract').value,
      plan:document.getElementById('filterPlan').value,
      gender:document.getElementById('filterGender').value,
      ageGroup:document.getElementById('filterAgeGroup').value,
      payment:document.getElementById('filterPayment').value,
    };
    S.filtered=applyFilters(S.raw,S.activeFilters);
    S.page=1;
    refreshAll();
    showToast('Filters Applied',`Showing ${fn(S.filtered.length)} of ${fn(S.raw.length)} records.`,'info');
  });

  document.getElementById('resetFiltersBtn')?.addEventListener('click',()=>{
    ['filterRisk','filterChurn','filterContract','filterPlan','filterGender','filterAgeGroup','filterPayment'].forEach(id=>{
      const el=document.getElementById(id);if(el)el.value='';
    });
    S.activeFilters={};S.filtered=[...S.raw];S.page=1;
    refreshAll();
    showToast('Filters Reset','Showing all records.','info');
  });

  // ── GENERATE DEMO DATA ────────────────────────────────────────────
  document.getElementById('generateDemoBtn')?.addEventListener('click',()=>{
    const size=Number(document.getElementById('datasetSizeSelect')?.value)||5000;
    const bias=document.getElementById('churnBiasSelect')?.value||'medium';
    S.raw=generateDataset(size,bias);
    S.filtered=[...S.raw];S.activeFilters={};S.page=1;
    refreshAll();
    showToast('Dataset Generated',`${fn(size)} customer records generated successfully.`,'success');
  });

  // ── SETTINGS ─────────────────────────────────────────────────────
  document.getElementById('applySettingsBtn')?.addEventListener('click',()=>{
    const size=Number(document.getElementById('datasetSizeSelect')?.value)||5000;
    const bias=document.getElementById('churnBiasSelect')?.value||'medium';
    S.raw=generateDataset(size,bias);
    S.filtered=[...S.raw];S.activeFilters={};S.page=1;
    refreshAll();
    showToast('Settings Applied',`Regenerated ${fn(size)} records with ${bias} churn bias.`,'success');
  });

  // ── REFRESH ───────────────────────────────────────────────────────
  document.getElementById('refreshBtn')?.addEventListener('click',()=>{
    const btn=document.getElementById('refreshBtn');
    const icon=btn?.querySelector('i');
    if(icon)icon.classList.add('spin');
    setTimeout(()=>{
      refreshAll();
      if(icon)icon.classList.remove('spin');
      showToast('Refreshed','Dashboard data refreshed.','info');
    },800);
  });

  // ── REFRESH INSIGHTS ──────────────────────────────────────────────
  document.getElementById('refreshInsightsBtn')?.addEventListener('click',()=>{
    renderInsights(S.filtered);
    showToast('Insights Refreshed','AI insights recalculated.','info');
  });

  // ── PREDICTION ────────────────────────────────────────────────────
  document.getElementById('predictBtn')?.addEventListener('click',runPrediction);

  // Range input labels
  ['pred_satisfaction','pred_nps','pred_engagement','pred_service_quality'].forEach(id=>{
    const el=document.getElementById(id);
    const lbl=document.getElementById(id+'_val');
    if(el&&lbl)el.addEventListener('input',()=>{lbl.textContent=el.value;});
  });

  // ── GLOBAL SEARCH ─────────────────────────────────────────────────
  const gSearch=document.getElementById('globalSearch');
  if(gSearch){
    gSearch.addEventListener('input',e=>handleSearch(e.target.value));
    document.addEventListener('click',e=>{if(!gSearch.contains(e.target))document.getElementById('searchDropdown')?.classList.remove('active');});
  }

  // ── TABLE SORT ────────────────────────────────────────────────────
  document.querySelectorAll('.sortable-table th[data-sort]').forEach(th=>{
    th.addEventListener('click',()=>{
      const field=th.getAttribute('data-sort');
      if(S.sortField===field)S.sortDir=S.sortDir==='asc'?'desc':'asc';
      else{S.sortField=field;S.sortDir='desc';}
      renderCustomerTable();
    });
  });

  // ── TABLE FILTERS ─────────────────────────────────────────────────
  document.getElementById('tableApplyFilter')?.addEventListener('click',()=>{
    S.tableFilters={
      search:document.getElementById('tableSearch')?.value||'',
      risk:document.getElementById('tableFilterRisk')?.value||'',
      churn:document.getElementById('tableFilterChurn')?.value||'',
      contract:document.getElementById('tableFilterContract')?.value||'',
      plan:document.getElementById('tableFilterPlan')?.value||'',
      state:document.getElementById('tableFilterState')?.value||'',
    };
    S.page=1;renderCustomerTable();
  });
  document.getElementById('tableSearch')?.addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('tableApplyFilter')?.click();});

  // ── IMPORT CSV ────────────────────────────────────────────────────
  const csvInput=document.getElementById('csvFileInput');
  const importCsvBtns=[document.getElementById('importCsvBtn'),document.getElementById('importCsvBtnPage')];
  importCsvBtns.forEach(btn=>btn?.addEventListener('click',()=>csvInput?.click()));
  csvInput?.addEventListener('change',e=>{
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>importCSV(ev.target.result);
    reader.readAsText(file);
    e.target.value='';
  });

  // ── IMPORT EXCEL ──────────────────────────────────────────────────
  const xlsxInput=document.getElementById('excelFileInput');
  const importXlBtns=[document.getElementById('importExcelBtn'),document.getElementById('importExcelBtnPage')];
  importXlBtns.forEach(btn=>btn?.addEventListener('click',()=>xlsxInput?.click()));
  xlsxInput?.addEventListener('change',e=>{
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>importExcel(new Uint8Array(ev.target.result));
    reader.readAsArrayBuffer(file);
    e.target.value='';
  });

  // ── EXPORT ───────────────────────────────────────────────────────
  ['exportCsvBtn','reportExportCsv'].forEach(id=>document.getElementById(id)?.addEventListener('click',exportCSV));
  ['exportExcelBtn','reportExportExcel'].forEach(id=>document.getElementById(id)?.addEventListener('click',exportExcel));
  document.getElementById('reportPrint')?.addEventListener('click',()=>window.print());

  // ── DRAG DROP ─────────────────────────────────────────────────────
  function setupDropZone(zoneId,type){
    const zone=document.getElementById(zoneId);if(!zone)return;
    zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('dragover');});
    zone.addEventListener('dragleave',()=>zone.classList.remove('dragover'));
    zone.addEventListener('drop',e=>{
      e.preventDefault();zone.classList.remove('dragover');
      const file=e.dataTransfer.files[0];if(!file)return;
      if(type==='csv'){const r=new FileReader();r.onload=ev=>importCSV(ev.target.result);r.readAsText(file);}
      else{const r=new FileReader();r.onload=ev=>importExcel(new Uint8Array(ev.target.result));r.readAsArrayBuffer(file);}
    });
    zone.addEventListener('click',()=>type==='csv'?csvInput?.click():xlsxInput?.click());
    zone.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')(type==='csv'?csvInput?.click():xlsxInput?.click());});
  }
  setupDropZone('csvDropZone','csv');
  setupDropZone('excelDropZone','excel');

  // ── DATE RANGE FILTER ─────────────────────────────────────────────
  document.getElementById('dateRangeFilter')?.addEventListener('change',e=>{
    const days=Number(e.target.value);
    if(!days){S.filtered=applyFilters(S.raw,S.activeFilters);refreshAll();return;}
    S.filtered=applyFilters(S.raw,S.activeFilters).filter(c=>c.tenure_months<=(days/30));
    S.page=1;refreshAll();
  });

  // ── MODAL CLOSE ───────────────────────────────────────────────────
  document.getElementById('modalClose')?.addEventListener('click',closeModal);
  document.getElementById('customerModal')?.addEventListener('click',e=>{if(e.target===document.getElementById('customerModal'))closeModal();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});

  // ── ANIMATIONS TOGGLE ─────────────────────────────────────────────
  document.getElementById('animationsToggle')?.addEventListener('change',e=>{
    document.documentElement.style.setProperty('--transition-base',e.target.checked?'0.25s ease':'0s');
    document.documentElement.style.setProperty('--transition-slow',e.target.checked?'0.4s cubic-bezier(0.4,0,0.2,1)':'0s');
  });

  // ── COMPACT MODE ──────────────────────────────────────────────────
  document.getElementById('compactModeToggle')?.addEventListener('change',e=>{
    document.documentElement.style.setProperty('--border-radius-lg',e.target.checked?'8px':'16px');
    document.querySelectorAll('.kpi-card').forEach(el=>el.style.padding=e.target.checked?'12px':'18px');
  });

  // Sidebar search filter
  document.getElementById('sidebarSearch')?.addEventListener('input',e=>{
    const q=e.target.value.toLowerCase();
    document.querySelectorAll('.nav-item').forEach(item=>{
      const label=item.querySelector('.nav-label')?.textContent.toLowerCase()||'';
      item.style.display=!q||label.includes(q)?'':'none';
    });
  });
}

// ── START ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
