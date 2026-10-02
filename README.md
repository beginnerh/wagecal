# WageCal

A Philippine salary calculator for daily-paid workers. Log your work hours each day and WageCal computes your pay with overtime, rest day and holiday premiums, night differential, provincial minimum wage, and SSS, PhilHealth and Pag-IBIG deductions. Entries are saved to your own account, so your records follow you across devices.

It is a static website (HTML, CSS and JavaScript) that uses Firebase for login and storage. There is no build step and no server to run.

## Features

- **Daily pay computation** with regular hours, overtime, rest days, special days and regular holidays, and night differential (10PM to 6AM).
- **Provincial minimum wage.** Pick a province and sector and the daily rate fills in for the work date.
- **Custom payout days.** Set the days you get paid (for example the 5th and 20th) and an optional cutoff. Records are grouped by the payday that pays them.
- **Deductions and net salary.** Employee shares of SSS, PhilHealth and Pag-IBIG are subtracted to show take-home pay.
- **Records page** with tables by payday, by payout month and by day, 10 rows per page, newest first.
- **SweetAlert popups** for saves, errors and delete confirmations.
- **Mobile-friendly design** with a calculator-style burger menu, plus light and dark mode that follows the device.
- **Info page** that explains the purpose of the site and how to use it.

## Files

| File | What it does |
| --- | --- |
| `index.html` | Landing page with log in and sign up |
| `calculator.html` | Wage rate, add a work day, payout days, deductions and payout totals |
| `records.html` | Full tables, pagination, and deleting entries |
| `info.html` | Purpose of the site, tutorial and how pay is computed (public page) |
| `common.js` | Firebase setup, pay computation, payout periods, deductions, table rendering, popups, menu |
| `wages.js` | Provincial minimum wage data and rate lookup |
| `style.css` | All styling, including the mobile menu |
| `favicon.svg`, `favicon.ico`, `favicon-32.png`, `apple-touch-icon.png` | Site icons |

## Setup

### 1. Create the Firebase project

1. Create a project in the [Firebase console](https://console.firebase.google.com).
2. Under **Authentication**, enable the **Email/Password** sign-in method.
3. Under **Realtime Database**, create a database.
4. Add a web app and copy its config.

### 2. Add your config

Open `common.js` and replace the values in `firebaseConfig` at the top with your own project's config.

### 3. Set the database rules

In **Realtime Database > Rules**, let each user read and write only their own data:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

If you see "Permission denied" in the app, these rules are missing or the config points to the wrong project.

### 4. Run it

Open `index.html` through any web server. Firebase Auth does not work from a plain `file://` address, so use one of these:

```bash
# Python
python3 -m http.server 8000

# or Node
npx serve .
```

Then visit `http://localhost:8000`. If you use another host or domain, add it under **Authentication > Settings > Authorized domains**.

### 5. Deploy

Any static host works: Firebase Hosting, GitHub Pages, Netlify or Cloudflare Pages. Upload all the files in this folder and keep them in the same directory.

## How pay is computed

The hourly rate is the daily rate divided by 8. The first 8 hours after the unpaid break are regular hours, and anything beyond that is overtime. The break is assumed to be in the middle of the shift.

| Day type | First 8 hours | Overtime per hour |
| --- | --- | --- |
| Regular workday | 100% | 125% |
| Rest day or Sunday | 130% | 169% |
| Special non-working day | 130% | 169% |
| Special day on a rest day | 150% | 195% |
| Regular holiday | 200% | 260% |
| Regular holiday on a rest day | 260% | 338% |

- **Night differential:** hours between 10PM and 6AM earn an extra percentage (default 10%) of that hour's pay rate.
- **Absent on a regular holiday:** paid 100% of the daily rate.
- **Overnight shifts:** a time out earlier than the time in counts as one shift that crosses midnight.

## Payout days

Set two payout days and an optional number of cutoff days before payday. Each work date belongs to the first payday whose cutoff falls on or after it. With paydays on the 5th and 20th and no cutoff, work from Sep 21 to Oct 5 is paid on Oct 5. A payout day of 29 to 31 uses the last day of shorter months.

## Deductions (employee share, 2026)

| Contribution | Employee share | Limits |
| --- | --- | --- |
| SSS | 5% of the monthly salary credit, in ₱500 steps from ₱5,000 to ₱35,000 | ₱250 to ₱1,750 |
| PhilHealth | 2.5% of monthly basic pay, using ₱10,000 to ₱100,000 | ₱250 to ₱2,500 |
| Pag-IBIG | 2% of monthly pay up to ₱10,000 (1% if pay is ₱1,500 or less) | Up to ₱200 |

Contributions are based on either the gross earned in the payout month or the daily rate × 26 days. They can be taken on both paydays (half each), the 1st only, or the 2nd only. Income tax and loans are not included.

## Provincial minimum wage data

`wages.js` holds a reference table of daily minimum wages by province, compiled on 2 Oct 2026 from NWPC summaries and news reports. Some sources disagree, and some regions have rates that vary by area or sector, so treat the values as a guide and confirm them with your wage order.

Each rate list has the form `[effective-from date, daily rate]`, sorted oldest first:

```js
r:[['2025-07-18',695],['2026-07-25',755]]
```

- `r` is non-agriculture, `g` is agriculture, and `s` is retail/service with 10 or fewer workers. If `g` or `s` is missing, `r` is used.
- To add a new wage order, append a new `[date, rate]` pair to the region's list.
- To give one province its own rates, add it to the region's `o` object, as Aurora does.

## Data structure

Everything is stored under the signed-in user's ID:

```
users/{uid}/
  profile      { uid, email }
  settings     { rate, nd, ndp, prov, sector,
                 payout:     { d1, d2, lag },
                 deductions: { sss, phic, hdmf, when, basis } }
  entries/{id} { id, date, in, out, brk, day, hol, absent,
                 rate, nd, ndp, pay, savedAt }
```

Each entry keeps the wage rate it was saved with, so changing your rate later does not rewrite old records.

## Dependencies

All loaded from a CDN, so there is nothing to install:

- Firebase 8.6.8 (App, Auth, Realtime Database)
- SweetAlert2 v11

## Disclaimer

WageCal gives estimates for personal use. It is not an official payslip, and your employer's payroll decides your actual pay. Minimum wage rates and contribution tables change, so check DOLE, NWPC, SSS, PhilHealth and Pag-IBIG for current figures.
