import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from './src/modules/Dashboard/Dashboard';
import './src/index.css';

window.fetch = async (input) => {
  const url = new URL(String(input));
  const month = Number(url.searchParams.get('month'));
  const year = Number(url.searchParams.get('year'));
  const projectId = Number(url.searchParams.get('projectId')) || null;
  const currency = url.searchParams.get('currency') || 'PEN';
  const values = { income: 154830.45, materials: 80500, services: 18200, payroll: 9400, pettyCash: 3200, adjustments: 600, expenses: 111900, result: 42930.45 };
  const projectOptions = Array.from({ length: 12 }, (_, i) => ({ projectId: i + 1, code: `22${31 + i}`, name: ['REDES ELÉCTRICAS QUINTA LAS PALMAS II', 'RED BT PROVISIONAL EDIFICIO IX', 'PROYECTO DE INSTALACIONES SAN ISIDRO'][i % 3] }));
  const data = {
    generatedAt: new Date().toISOString(), period: { month, year, projectId, currency },
    permissions: { finance: true, payroll: true, purchases: true, documents: true },
    projectOptions, activeProjects: projectId ? 1 : 9,
    finances: { ...values, previous: { ...values, income: 140000, expenses: 105000 }, pendingPurchases: 5400,
      trend: Array.from({length:6},(_, i) => ({ ...values, income: 40000 + i*18000, expenses: 50000 + i*10000, month: new Date(Date.UTC(year, month - 6 + i, 1)).toISOString().slice(0,7) })) },
    projects: projectOptions.filter(p => !projectId || p.projectId === projectId).map((p,i) => ({ ...p, status:'active', endDate:'2026-09-30', progress: i === 2 ? null : 65, overdue:false, overdueTasks:2, pendingRequests:1, pendingOrders:0, finances:values })),
    payroll: {currency:'PEN', total:14800, projectOnly:!!projectId, weeks:[{weekId:3,startDate:'2026-08-31',endDate:'2026-09-06',includedInMonth:month===9,total:14800,groups:[{group:'laborer',workerCount:22,attendances:120,dominical:20,base:10000,adjustments:600,total:10600},{group:'technician',workerCount:6,attendances:30,dominical:5,base:4000,adjustments:200,total:4200}]}]},
    alerts:[{key:'tasks',title:'Tareas vencidas',detail:'Pendientes o en progreso, sin incluir canceladas.',count:8,severity:'critical',href:'/admin/projects',scope:'project'},{key:'expired',title:'Documentos vencidos',detail:'Todos los documentos vigentes en el catálogo, sin filtro de mes.',count:4,severity:'critical',href:'/admin/document-expirations',scope:'global'},{key:'stock',title:'Stock de oficina bajo el mínimo',detail:'Elementos con mínimo configurado; solo existencias disponibles.',count:3,severity:'warning',href:'/admin/inventory',scope:'global'}],criticalCount:12,
  };
  if (new URLSearchParams(location.search).has('empty')) { data.projects=[]; data.alerts=[]; data.payroll.weeks=[]; data.finances = {...data.finances, ...Object.fromEntries(Object.keys(values).map(k => [k,0])),trend: data.finances.trend.map(row=>({...row,income:0,expenses:0}))}; }
  return new Response(JSON.stringify({statusCode:200,data}),{headers:{'Content-Type':'application/json'}});
};
createRoot(document.getElementById('root')!).render(<BrowserRouter><div className="mx-auto max-w-[1800px] p-4 md:p-8"><Dashboard /></div></BrowserRouter>);
