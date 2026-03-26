/**
 * Visual breakpoint audit — screenshot every key page at every viewport.
 * Runs after playwright.config.ts defines the 8 viewport projects.
 * Output: test-screenshots/bp_<project>_<page>.png
 */
import { test, Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const DIR = path.join(__dirname, "../test-screenshots/breakpoints");
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

const BASE = "http://localhost:8081";

async function setupAuth(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("authToken",   "pw-token");
    localStorage.setItem("onboarded",   "true");
    localStorage.setItem("babyName",    "Арсений");
    localStorage.setItem("birthDate",   "2024-06-15");
    localStorage.setItem("babyGender",  "boy");
  });
}

async function shot(page: Page, project: string, label: string) {
  const name = `${project}_${label}.png`.replace(/[^a-z0-9_.-]/gi, "_");
  await page.screenshot({
    path: path.join(DIR, name),
    fullPage: true,
  });
  console.log(`📸 ${name}`);
}

function slug(s: string) {
  return s.replace(/\//g, "_").replace(/[^a-z0-9_]/gi, "") || "root";
}

const PAGES = [
  { route: "/",              label: "home"        },
  { route: "/stats",         label: "stats"       },
  { route: "/add",           label: "add_event"   },
  { route: "/settings",      label: "settings"    },
  { route: "/chat",          label: "chat"        },
  { route: "/calendar",      label: "calendar"    },
  { route: "/growth",        label: "growth"      },
  { route: "/vaccinations",  label: "vaccinations"},
  { route: "/medications",   label: "medications" },
  { route: "/milestones",    label: "milestones"  },
  { route: "/baby-profile",  label: "baby_profile"},
  { route: "/reminders",     label: "reminders"   },
  { route: "/photos",        label: "photos"      },
  { route: "/report",        label: "report"      },
  { route: "/temperature",   label: "temperature" },
  { route: "/recap",         label: "yearly_recap"},
  { route: "/event/sleep",   label: "event_sleep" },
  { route: "/event/breast",  label: "event_breast"},
  { route: "/event/diaper",  label: "event_diaper"},
  { route: "/doctor-visits", label: "doctor_visits"},
  { route: "/allergens",     label: "allergens"   },
  { route: "/search",        label: "search"      },
];

test.describe("Breakpoint visual audit", () => {
  for (const { route, label } of PAGES) {
    test(`${label}`, async ({ page }, testInfo) => {
      const project = testInfo.project.name;
      await setupAuth(page);
      await page.goto(BASE + route);
      await page.waitForTimeout(1200); // let animations settle
      await shot(page, project, label);
    });
  }
});
