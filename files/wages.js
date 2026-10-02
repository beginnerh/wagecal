// Reference daily minimum wages by province, compiled 2 Oct 2026 from NWPC summaries and news reports.
// Each rate list is [effective-from, daily rate] sorted oldest first; the first entry also covers earlier dates.
// n = non-agriculture, g = agriculture, s = retail/service (10 or fewer workers) and small manufacturing.
// If g or s is missing, the non-agriculture rate is used. Update this file whenever a new wage order takes effect.
const WAGES_ASOF='2 Oct 2026';
const NCRL=[['2025-07-18',658],['2026-07-25',718]];
const W=[
 {n:'NCR – Metro Manila',p:['Metro Manila'],r:[['2025-07-18',695],['2026-07-25',755]],g:NCRL,s:NCRL,note:'The ₱755 order was reported under a court injunction; confirm the rate your employer pays.'},
 {n:'CAR – Cordillera',p:['Abra','Apayao','Benguet','Ifugao','Kalinga','Mountain Province'],r:[['2025-12-30',505]]},
 {n:'Region I – Ilocos',p:['Ilocos Norte','Ilocos Sur','La Union','Pangasinan'],r:[['2025-11-19',505]],note:'Rates run from ₱480 to ₱505 depending on the area.'},
 {n:'Region II – Cagayan Valley',p:['Batanes','Cagayan','Isabela','Nueva Vizcaya','Quirino'],r:[['2025-11-05',500]]},
 {n:'Region III – Central Luzon',p:['Aurora','Bataan','Bulacan','Nueva Ecija','Pampanga','Tarlac','Zambales'],r:[['2025-01-01',560],['2026-04-16',600]],o:{Aurora:{r:[['2026-04-16',560]],g:[['2026-04-16',545]],s:[['2026-04-16',515]]}},note:'Aurora has its own lower rates.'},
 {n:'Region IV-A – CALABARZON',p:['Batangas','Cavite','Laguna','Quezon','Rizal'],r:[['2025-10-05',525],['2026-04-01',600]],note:'Rates vary by municipality class (₱508 to ₱600); showing the highest.'},
 {n:'Region IV-B – MIMAROPA',p:['Marinduque','Occidental Mindoro','Oriental Mindoro','Palawan','Romblon'],r:[['2026-01-01',455]]},
 {n:'Region V – Bicol',p:['Albay','Camarines Norte','Camarines Sur','Catanduanes','Masbate','Sorsogon'],r:[['2026-04-08',455],['2026-12-01',480]]},
 {n:'Region VI – Western Visayas',p:['Aklan','Antique','Capiz','Guimaras','Iloilo','Negros Occidental'],r:[['2025-11-19',550]],note:'Some areas pay ₱520 to ₱550.'},
 {n:'Region VII – Central Visayas',p:['Bohol','Cebu','Negros Oriental','Siquijor'],r:[['2025-10-04',540]],note:'₱500 applies outside the higher-class cities, and an increase from 14 Oct 2026 has been reported.'},
 {n:'Region VIII – Eastern Visayas',p:['Biliran','Eastern Samar','Leyte','Northern Samar','Samar','Southern Leyte'],r:[['2025-12-08',452],['2026-06-01',470]]},
 {n:'Region IX – Zamboanga Peninsula',p:['Zamboanga del Norte','Zamboanga del Sur','Zamboanga Sibugay'],r:[['2026-06-01',464]],g:[['2026-06-01',451]],s:[['2026-06-01',451]]},
 {n:'Region X – Northern Mindanao',p:['Bukidnon','Camiguin','Lanao del Norte','Misamis Occidental','Misamis Oriental'],r:[['2025-01-01',485],['2026-05-01',500]]},
 {n:'Region XI – Davao',p:['Davao de Oro','Davao del Norte','Davao del Sur','Davao Occidental','Davao Oriental'],r:[['2026-03-13',525],['2026-09-01',540]],g:[['2026-03-13',525]]},
 {n:'Region XII – SOCCSKSARGEN',p:['Cotabato','Sarangani','South Cotabato','Sultan Kudarat'],r:[['2025-12-15',460]]},
 {n:'Region XIII – Caraga',p:['Agusan del Norte','Agusan del Sur','Dinagat Islands','Surigao del Norte','Surigao del Sur'],r:[['2026-05-01',475]]},
 {n:'BARMM',p:['Basilan','Lanao del Sur','Maguindanao del Norte','Maguindanao del Sur','Sulu','Tawi-Tawi'],r:[['2025-07-17',411],['2026-08-06',436]]}
];
// sector: 'n' non-agriculture, 'g' agriculture, 's' small retail/service. Returns {rate, note} or null.
function rateFor(prov,sector,date){
  const R=W.find(x=>x.p.includes(prov));if(!R)return null;
  const o=(R.o&&R.o[prov])||{},nk=o.r||R.r;
  const key=sector==='n'?'r':sector;
  const list=o[key]||R[key]||nk,fell=sector!=='n'&&!(o[key]||R[key]);
  let v=list[0][1];for(const[f,x]of list)if(f<=date)v=x;
  return{rate:v,note:R.n+(R.note?' – '+R.note:'')+(fell?' Lower-tier rate not on file, so the standard rate is shown.':'')};
}
function provinceOptions(){
  return W.map(R=>'<optgroup label="'+R.n+'">'+R.p.map(p=>'<option value="'+p+'">'+p+'</option>').join('')+'</optgroup>').join('');
}
