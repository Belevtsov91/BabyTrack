import { test, Page, ConsoleMessage } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// ─── Setup ────────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOTS_DIR = path.join(__dirname, "../test-screenshots");
const BASE = "http://localhost:8081";
const errors: { page: string; type: string; message: string }[] = [];

if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

function slug(str: string) {
  return str.replace(/\//g, "_").replace(/[^a-z0-9_-]/gi, "") || "root";
}

async function shot(page: Page, label: string) {
  const filename = path.join(SCREENSHOTS_DIR, `${label}.png`);
  await page.screenshot({ path: filename, fullPage: false });
  console.log(`📸 Screenshot: ${label}.png`);
}

async function setupAuth(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("authToken", "test-token-playwright");
    localStorage.setItem("onboarded", "true");
    localStorage.setItem("babyName", "Тестовый");
    localStorage.setItem("babyGender", "boy");
    localStorage.setItem("babyBirthDate", "2024-01-15");
    localStorage.setItem("babyWeight", "3.5");
    localStorage.setItem("babyHeight", "51");
    localStorage.setItem("babyBloodType", "A+");
    // Seed some events
    localStorage.setItem("bt_events", JSON.stringify([
      { id: "1", type: "sleep",   startTime: new Date(Date.now() - 3600000).toISOString(), endTime: new Date().toISOString(),   notes: "Хороший сон" },
      { id: "2", type: "feeding", startTime: new Date(Date.now() - 7200000).toISOString(), endTime: null, amount: 120, notes: "Грудное" },
      { id: "3", type: "diaper",  startTime: new Date(Date.now() - 1800000).toISOString(), endTime: null, diaperType: "wet",   notes: "" },
      { id: "4", type: "growth",  startTime: new Date(Date.now() - 86400000).toISOString(), endTime: null, weight: 4.2, height: 54, notes: "" },
    ]));
  });
}

function collectErrors(page: Page, route: string) {
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error") {
      errors.push({ page: route, type: "console.error", message: msg.text() });
    }
  });
  page.on("pageerror", (err: Error) => {
    errors.push({ page: route, type: "pageerror", message: err.message });
  });
}

async function waitSettle(page: Page, ms = 600) {
  await page.waitForTimeout(ms);
}

// Try to click a locator safely — swallow navigation/element-gone errors
async function safeClick(page: Page, locator: ReturnType<Page["locator"]>) {
  try {
    await locator.click({ timeout: 1500, force: false });
    await page.waitForTimeout(300);
  } catch (_) {
    // element disappeared / navigated / not clickable — skip
  }
}

// ─── Routes ──────────────────────────────────────────────────────────────────

const PUBLIC_ROUTES = ["/welcome", "/login", "/register"];

const PROTECTED_ROUTES = [
  "/",
  "/stats",
  "/settings",
  "/search",
  "/add",
  "/favorites",
  "/calendar",
  "/reminders",
  // Health
  "/doctor",
  "/doctor-visits",
  "/vaccinations",
  "/temperature",
  "/allergens",
  "/growth",
  "/medications",
  // Social
  "/chat",
  "/recap",
  // Media
  "/photos",
  "/report",
  // Profile
  "/baby-profile",
  "/milestones",
  // EventDetail samples
  "/event/sleep",
  "/event/feeding",
  "/event/diaper",
];

// ─── Public pages ─────────────────────────────────────────────────────────────

test.describe("Public pages", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} — render + interact`, async ({ page }) => {
      collectErrors(page, route);
      await page.goto(BASE + route);
      await waitSettle(page, 800);
      await shot(page, `01_public_${slug(route)}_initial`);

      // Fill any inputs visible
      const inputs = page.locator("input:visible");
      const count = await inputs.count();
      for (let i = 0; i < count; i++) {
        const inp = inputs.nth(i);
        const type = await inp.getAttribute("type");
        if (type === "password") {
          await inp.fill("TestPassword1!").catch(() => {});
        } else if (type === "email") {
          await inp.fill("test@test.com").catch(() => {});
        } else if (type === "text" || !type) {
          await inp.fill("Тестовый текст").catch(() => {});
        } else if (type === "tel") {
          await inp.fill("+79001234567").catch(() => {});
        }
      }

      await waitSettle(page, 400);
      await shot(page, `01_public_${slug(route)}_filled`);

      // Click buttons that don't submit (avoid accidental navigation for now)
      const buttons = page.locator("button:visible");
      const btnCount = await buttons.count();
      for (let i = 0; i < btnCount; i++) {
        const btn = buttons.nth(i);
        const text = (await btn.textContent() ?? "").trim();
        // Skip submit-like buttons to avoid navigating away
        if (/войти|зарегист|продолж|далее/i.test(text)) continue;
        await safeClick(page, btn);
      }
      await shot(page, `01_public_${slug(route)}_after_clicks`);
    });
  }
});

// ─── Protected pages ──────────────────────────────────────────────────────────

test.describe("Protected pages", () => {
  for (const route of PROTECTED_ROUTES) {
    test(`${route} — render + interact`, async ({ page }) => {
      await setupAuth(page);
      collectErrors(page, route);

      await page.goto(BASE + route);
      await waitSettle(page, 1000);

      // Check we actually landed on the right page (not redirected to /welcome)
      const url = page.url();
      if (url.includes("/welcome")) {
        errors.push({ page: route, type: "auth-redirect", message: "Redirected to /welcome — auth not applied" });
      }

      await shot(page, `02_protected_${slug(route)}_initial`);

      // ── Tabs / toggles / pills ────────────────────────────────────────────
      const tabs = page.locator("[role=tab]:visible, [role=radio]:visible");
      const tabCount = await tabs.count();
      for (let i = 0; i < tabCount; i++) {
        await safeClick(page, tabs.nth(i));
      }
      if (tabCount > 0) await shot(page, `02_protected_${slug(route)}_tabs`);

      // ── Buttons (non-nav) ─────────────────────────────────────────────────
      // Click buttons one by one, re-check after each since page may re-render
      let btnHandled = 0;
      const MAX_BTNS = 20;
      while (btnHandled < MAX_BTNS) {
        const btns = page.locator("button:visible");
        const total = await btns.count();
        if (btnHandled >= total) break;
        const btn = btns.nth(btnHandled);
        const text = (await btn.textContent() ?? "").trim().toLowerCase();
        // Skip buttons that look like navigation or destructive
        const skip = /удалить всё|выйти|сбросить|delete all/i.test(text);
        if (!skip) await safeClick(page, btn);
        btnHandled++;
      }
      await waitSettle(page, 500);
      await shot(page, `02_protected_${slug(route)}_after_btns`);

      // ── Inputs ────────────────────────────────────────────────────────────
      const inputs = page.locator("input:visible, textarea:visible");
      const inputCount = await inputs.count();
      for (let i = 0; i < inputCount; i++) {
        const inp = inputs.nth(i);
        const type = await inp.getAttribute("type");
        const placeholder = (await inp.getAttribute("placeholder") ?? "").toLowerCase();
        try {
          if (type === "number" || placeholder.includes("кг") || placeholder.includes("см")) {
            await inp.fill("5.2");
          } else if (type === "date") {
            await inp.fill("2024-06-15");
          } else if (type === "time") {
            await inp.fill("10:30");
          } else if (type === "email") {
            await inp.fill("test@test.com");
          } else if (type === "password") {
            await inp.fill("Password123!");
          } else {
            await inp.fill("Тест Playwright");
          }
        } catch (_) {}
      }
      if (inputCount > 0) {
        await waitSettle(page, 400);
        await shot(page, `02_protected_${slug(route)}_inputs_filled`);
      }

      // ── Selects / dropdowns ───────────────────────────────────────────────
      const selects = page.locator("select:visible");
      const selCount = await selects.count();
      for (let i = 0; i < selCount; i++) {
        try {
          const opts = await selects.nth(i).locator("option").allTextContents();
          if (opts.length > 1) await selects.nth(i).selectOption({ index: 1 });
        } catch (_) {}
      }

      // ── Swipeable / drag elements (framer-motion pan) ─────────────────────
      // Try swiping left on cards that might support swipe
      const swipeTargets = page.locator("[data-drag], .cursor-grab");
      const swipeCount = await swipeTargets.count();
      for (let i = 0; i < swipeCount; i++) {
        try {
          const el = swipeTargets.nth(i);
          const box = await el.boundingBox();
          if (box) {
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
            await page.mouse.down();
            await page.mouse.move(box.x - 100, box.y + box.height / 2, { steps: 10 });
            await page.mouse.up();
            await page.waitForTimeout(300);
          }
        } catch (_) {}
      }

      // ── Bottom sheets (open any that are closed) ──────────────────────────
      // Already triggered by button clicks above

      // Final screenshot
      await waitSettle(page, 600);
      await shot(page, `02_protected_${slug(route)}_final`);
    });
  }
});

// ─── Onboarding flow ─────────────────────────────────────────────────────────

test("Onboarding flow — step through all screens", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("authToken", "test-token-playwright");
    // No 'onboarded' set — so we stay on onboarding
  });
  collectErrors(page, "/onboarding");

  await page.goto(BASE + "/onboarding");
  await waitSettle(page, 1000);
  await shot(page, "03_onboarding_step1");

  // Fill inputs on step 1
  const nameInput = page.locator("input[type=text]:visible").first();
  await nameInput.fill("Малышка").catch(() => {});

  // Try date input
  const dateInput = page.locator("input[type=date]:visible").first();
  await dateInput.fill("2024-01-15").catch(() => {});

  await waitSettle(page, 400);
  await shot(page, "03_onboarding_step1_filled");

  // Click through Next / Далее buttons
  for (let step = 2; step <= 5; step++) {
    const nextBtn = page.locator("button:visible").filter({ hasText: /далее|next|продолж/i }).first();
    const exists = await nextBtn.count();
    if (exists === 0) break;
    await safeClick(page, nextBtn);
    await waitSettle(page, 800);
    await shot(page, `03_onboarding_step${step}`);

    // Fill any new inputs
    const inputs = page.locator("input:visible");
    const ic = await inputs.count();
    for (let i = 0; i < ic; i++) {
      const inp = inputs.nth(i);
      const type = await inp.getAttribute("type");
      if (type === "number") await inp.fill("3.5").catch(() => {});
      else if (type === "date")  await inp.fill("2024-01-15").catch(() => {});
      else if (!type || type === "text") await inp.fill("Тест").catch(() => {});
    }
    // Click radio/option buttons
    const radios = page.locator("[role=radio]:visible, input[type=radio]:visible");
    const rc = await radios.count();
    if (rc > 0) await safeClick(page, radios.first());
  }
  await shot(page, "03_onboarding_final");
});

// ─── Auth flow ────────────────────────────────────────────────────────────────

test("Login flow — fill and submit", async ({ page }) => {
  collectErrors(page, "/login");
  await page.goto(BASE + "/login");
  await waitSettle(page, 800);
  await shot(page, "04_login_initial");

  await page.locator("input[type=email], input[placeholder*='mail' i], input[placeholder*='почта' i]").first().fill("user@test.com").catch(() => {});
  await page.locator("input[type=password]").first().fill("Password123!").catch(() => {});
  await waitSettle(page, 300);
  await shot(page, "04_login_filled");

  // Try show/hide password toggle
  const eyeBtn = page.locator("button[aria-label*='пароль' i], button svg").first();
  await safeClick(page, eyeBtn);
  await shot(page, "04_login_password_toggle");
});

test("Register flow — fill all fields", async ({ page }) => {
  collectErrors(page, "/register");
  await page.goto(BASE + "/register");
  await waitSettle(page, 800);
  await shot(page, "05_register_initial");

  const allInputs = page.locator("input:visible");
  const cnt = await allInputs.count();
  for (let i = 0; i < cnt; i++) {
    const inp = allInputs.nth(i);
    const type = await inp.getAttribute("type");
    if (type === "email") await inp.fill(`user${i}@test.com`).catch(() => {});
    else if (type === "password") await inp.fill("Password123!").catch(() => {});
    else await inp.fill("Тест Пользователь").catch(() => {});
  }
  await waitSettle(page, 300);
  await shot(page, "05_register_filled");
});

// ─── Navigation / TabBar ─────────────────────────────────────────────────────

test("TabBar navigation — click all tabs", async ({ page }) => {
  await setupAuth(page);
  collectErrors(page, "/tabs");
  await page.goto(BASE + "/");
  await waitSettle(page, 1000);

  // Find bottom nav links
  const navLinks = page.locator("nav a:visible, [role=tablist] a:visible, nav button:visible");
  const count = await navLinks.count();
  console.log(`Found ${count} nav links`);

  for (let i = 0; i < count; i++) {
    const link = navLinks.nth(i);
    const text = await link.textContent();
    await safeClick(page, link);
    await waitSettle(page, 600);
    await shot(page, `06_tabs_${i}_${slug(text ?? "tab")}`);
  }
});

// ─── AddEvent — all event types ───────────────────────────────────────────────

test("AddEvent — cycle through all event type tabs", async ({ page }) => {
  await setupAuth(page);
  collectErrors(page, "/add");
  await page.goto(BASE + "/add");
  await waitSettle(page, 1000);
  await shot(page, "07_add_initial");

  // Click each category tab
  const typeTabs = page.locator("button:visible, [role=tab]:visible");
  const tabCount = await typeTabs.count();

  const eventTypes = ["sleep", "feeding", "diaper", "growth", "temp", "mood"];
  for (const et of eventTypes) {
    const tab = page.locator(`button:visible`).filter({ hasText: new RegExp(et, "i") }).first();
    const exists = await tab.count();
    if (exists > 0) {
      await safeClick(page, tab);
      await waitSettle(page, 400);
      await shot(page, `07_add_type_${et}`);
    }
  }

  // Also try clicking all tabs sequentially
  for (let i = 0; i < Math.min(tabCount, 10); i++) {
    await safeClick(page, typeTabs.nth(i));
    await waitSettle(page, 300);
  }
  await shot(page, "07_add_after_all_tabs");

  // Fill any visible inputs
  const inputs = page.locator("input:visible, textarea:visible");
  const ic = await inputs.count();
  for (let i = 0; i < ic; i++) {
    const inp = inputs.nth(i);
    const type = await inp.getAttribute("type");
    if (type === "number") await inp.fill("4.2").catch(() => {});
    else if (type === "time") await inp.fill("09:30").catch(() => {});
    else await inp.fill("Тестовая заметка").catch(() => {});
  }
  await waitSettle(page, 400);
  await shot(page, "07_add_inputs_filled");
});

// ─── Settings page — all toggles ─────────────────────────────────────────────

test("Settings — toggle all switches", async ({ page }) => {
  await setupAuth(page);
  collectErrors(page, "/settings");
  await page.goto(BASE + "/settings");
  await waitSettle(page, 1000);
  await shot(page, "08_settings_initial");

  const toggles = page.locator("[role=switch]:visible, input[type=checkbox]:visible");
  const count = await toggles.count();
  console.log(`Found ${count} toggles in settings`);

  for (let i = 0; i < count; i++) {
    await safeClick(page, toggles.nth(i));
    await waitSettle(page, 200);
  }
  await shot(page, "08_settings_all_toggled");

  // Click all buttons
  const btns = page.locator("button:visible");
  const bc = await btns.count();
  for (let i = 0; i < bc; i++) {
    const text = (await btns.nth(i).textContent() ?? "").toLowerCase();
    if (/сбросить|удалить|clear|reset|выйти/i.test(text)) continue;
    await safeClick(page, btns.nth(i));
    await waitSettle(page, 200);
  }
  await shot(page, "08_settings_after_all_clicks");
});

// ─── Search page ──────────────────────────────────────────────────────────────

test("Search — type queries", async ({ page }) => {
  await setupAuth(page);
  collectErrors(page, "/search");
  await page.goto(BASE + "/search");
  await waitSettle(page, 800);
  await shot(page, "09_search_initial");

  const searchInput = page.locator("input:visible").first();
  await searchInput.fill("сон").catch(() => {});
  await waitSettle(page, 500);
  await shot(page, "09_search_query_son");

  await searchInput.fill("кормление").catch(() => {});
  await waitSettle(page, 500);
  await shot(page, "09_search_query_feeding");

  await searchInput.fill("врач").catch(() => {});
  await waitSettle(page, 500);
  await shot(page, "09_search_query_doctor");

  await searchInput.fill("").catch(() => {});
  await waitSettle(page, 300);
  await shot(page, "09_search_cleared");
});

// ─── Chat — send message ──────────────────────────────────────────────────────

test("Chat — open room, send message", async ({ page }) => {
  await setupAuth(page);
  collectErrors(page, "/chat");
  await page.goto(BASE + "/chat");
  await waitSettle(page, 1000);
  await shot(page, "10_chat_rooms");

  // Click first room card
  const rooms = page.locator("button:visible, [role=button]:visible").first();
  await safeClick(page, rooms);
  await waitSettle(page, 800);
  await shot(page, "10_chat_open_room");

  // Type and send
  const chatInput = page.locator("input:visible, textarea:visible").last();
  await chatInput.fill("Привет из Playwright!").catch(() => {});
  await waitSettle(page, 300);
  await shot(page, "10_chat_typed");

  // Send button
  const sendBtn = page.locator("button:visible").last();
  await safeClick(page, sendBtn);
  await waitSettle(page, 500);
  await shot(page, "10_chat_sent");
});

// ─── GrowthCharts — all chart tabs ───────────────────────────────────────────

test("GrowthCharts — switch all chart types", async ({ page }) => {
  await setupAuth(page);
  collectErrors(page, "/growth");
  await page.goto(BASE + "/growth");
  await waitSettle(page, 1200);
  await shot(page, "11_growth_initial");

  const tabs = page.locator("button:visible, [role=tab]:visible");
  const count = await tabs.count();
  for (let i = 0; i < Math.min(count, 8); i++) {
    await safeClick(page, tabs.nth(i));
    await waitSettle(page, 600);
    await shot(page, `11_growth_tab_${i}`);
  }
});

// ─── Milestones — complete one milestone ─────────────────────────────────────

test("Milestones — switch views, complete milestone", async ({ page }) => {
  await setupAuth(page);
  collectErrors(page, "/milestones");
  await page.goto(BASE + "/milestones");
  await waitSettle(page, 1000);
  await shot(page, "12_milestones_initial");

  // Click category orbs
  const orbs = page.locator("button:visible");
  const oc = await orbs.count();
  for (let i = 0; i < Math.min(oc, 8); i++) {
    await safeClick(page, orbs.nth(i));
    await waitSettle(page, 300);
  }
  await shot(page, "12_milestones_after_filters");

  // Toggle view (roadmap vs list)
  const toggleBtn = page.locator("button:visible").filter({ hasText: /маршр|список|roadmap|list/i }).first();
  if (await toggleBtn.count() > 0) {
    await safeClick(page, toggleBtn);
    await waitSettle(page, 500);
    await shot(page, "12_milestones_roadmap_view");
  }
});

// ─── PdfReport — toggle sections, change format ──────────────────────────────

test("PdfReport — toggle all sections, all formats, generate", async ({ page }) => {
  await setupAuth(page);
  collectErrors(page, "/report");
  await page.goto(BASE + "/report");
  await waitSettle(page, 800);
  await shot(page, "13_report_initial");

  // Period buttons
  for (const p of ["week", "month", "all"]) {
    const btn = page.locator("button:visible").filter({ hasText: new RegExp(p === "all" ? "всё" : p === "week" ? "неделя" : "месяц", "i") }).first();
    await safeClick(page, btn);
    await waitSettle(page, 200);
  }
  await shot(page, "13_report_periods");

  // Format buttons
  const fmtBtns = page.locator("button:visible").filter({ hasText: /pdf|csv|json/i });
  const fc = await fmtBtns.count();
  for (let i = 0; i < fc; i++) {
    await safeClick(page, fmtBtns.nth(i));
    await waitSettle(page, 200);
  }
  await shot(page, "13_report_format_json");

  // Toggle all section checkboxes
  const sectionBtns = page.locator("button:visible");
  const sc = await sectionBtns.count();
  for (let i = 0; i < Math.min(sc, 15); i++) {
    await safeClick(page, sectionBtns.nth(i));
    await waitSettle(page, 100);
  }
  await shot(page, "13_report_sections_toggled");

  // Generate button
  const genBtn = page.locator("button:visible").filter({ hasText: /сформ|генер|скачать/i }).first();
  await safeClick(page, genBtn);
  await waitSettle(page, 2500); // wait for animation
  await shot(page, "13_report_generating");
  await waitSettle(page, 1000);
  await shot(page, "13_report_done");
});

// ─── Temperature ─────────────────────────────────────────────────────────────

test("Temperature — add reading", async ({ page }) => {
  await setupAuth(page);
  collectErrors(page, "/temperature");
  await page.goto(BASE + "/temperature");
  await waitSettle(page, 800);
  await shot(page, "14_temp_initial");

  // Tap + button or add button
  const addBtn = page.locator("button:visible").filter({ hasText: /добав|add|\+/i }).first();
  await safeClick(page, addBtn);
  await waitSettle(page, 400);
  await shot(page, "14_temp_add_sheet");

  const numInput = page.locator("input[type=number]:visible, input[inputmode=decimal]:visible").first();
  await numInput.fill("37.5").catch(() => {});

  const allBtns = page.locator("button:visible");
  const bc = await allBtns.count();
  for (let i = 0; i < Math.min(bc, 10); i++) {
    await safeClick(page, allBtns.nth(i));
    await waitSettle(page, 200);
  }
  await shot(page, "14_temp_after_interactions");
});

// ─── Vaccinations ────────────────────────────────────────────────────────────

test("Vaccinations — view calendar, toggle done", async ({ page }) => {
  await setupAuth(page);
  collectErrors(page, "/vaccinations");
  await page.goto(BASE + "/vaccinations");
  await waitSettle(page, 800);
  await shot(page, "15_vaccines_initial");

  const btns = page.locator("button:visible");
  const bc = await btns.count();
  for (let i = 0; i < Math.min(bc, 10); i++) {
    await safeClick(page, btns.nth(i));
    await waitSettle(page, 300);
  }
  await shot(page, "15_vaccines_interacted");
});

// ─── YearlyRecap ─────────────────────────────────────────────────────────────

test("YearlyRecap — navigate moments carousel", async ({ page }) => {
  await setupAuth(page);
  collectErrors(page, "/recap");
  await page.goto(BASE + "/recap");
  await waitSettle(page, 1000);
  await shot(page, "16_recap_initial");

  // Navigate carousel prev/next
  const prevBtn = page.locator("button:visible").filter({ hasText: /←|‹|prev|назад/i }).first();
  const nextBtn = page.locator("button:visible").filter({ hasText: /→|›|next|далее/i }).first();
  for (let i = 0; i < 3; i++) {
    await safeClick(page, nextBtn);
    await waitSettle(page, 400);
  }
  await shot(page, "16_recap_carousel_next3");
  for (let i = 0; i < 2; i++) {
    await safeClick(page, prevBtn);
    await waitSettle(page, 400);
  }
  await shot(page, "16_recap_carousel_prev2");

  // Share button
  const shareBtn = page.locator("button:visible").filter({ hasText: /поделит|share/i }).first();
  await safeClick(page, shareBtn);
  await waitSettle(page, 400);
  await shot(page, "16_recap_share");
});

// ─── Baby Profile ─────────────────────────────────────────────────────────────

test("BabyProfile — open edit sheet, fill fields", async ({ page }) => {
  await setupAuth(page);
  collectErrors(page, "/baby-profile");
  await page.goto(BASE + "/baby-profile");
  await waitSettle(page, 1000);
  await shot(page, "17_profile_initial");

  // Open edit
  const editBtn = page.locator("button:visible").filter({ hasText: /редактир|изменить|edit/i }).first();
  await safeClick(page, editBtn);
  await waitSettle(page, 600);
  await shot(page, "17_profile_edit_open");

  const inputs = page.locator("input:visible");
  const ic = await inputs.count();
  for (let i = 0; i < ic; i++) {
    const inp = inputs.nth(i);
    const type = await inp.getAttribute("type");
    if (type === "number") await inp.fill("5.1").catch(() => {});
    else if (type === "date") await inp.fill("2024-01-15").catch(() => {});
    else await inp.fill("Обновлено Playwright").catch(() => {});
  }
  await waitSettle(page, 400);
  await shot(page, "17_profile_edit_filled");

  // Click all quick link buttons
  const quickLinks = page.locator("button:visible");
  const qc = await quickLinks.count();
  for (let i = 0; i < Math.min(qc, 8); i++) {
    await safeClick(page, quickLinks.nth(i));
    await waitSettle(page, 200);
  }
  await shot(page, "17_profile_quick_links");
});

// ─── Medications ─────────────────────────────────────────────────────────────

test("Medications — add medication", async ({ page }) => {
  await setupAuth(page);
  collectErrors(page, "/medications");
  await page.goto(BASE + "/medications");
  await waitSettle(page, 800);
  await shot(page, "18_meds_initial");

  // Open add form
  const addBtn = page.locator("button:visible").filter({ hasText: /добав|add|\+/i }).first();
  await safeClick(page, addBtn);
  await waitSettle(page, 500);
  await shot(page, "18_meds_add_open");

  const inputs = page.locator("input:visible");
  const ic = await inputs.count();
  for (let i = 0; i < ic; i++) {
    const inp = inputs.nth(i);
    const type = await inp.getAttribute("type");
    if (type === "number") await inp.fill("5").catch(() => {});
    else if (type === "time") await inp.fill("08:00").catch(() => {});
    else await inp.fill("Парацетамол").catch(() => {});
  }
  await waitSettle(page, 400);
  await shot(page, "18_meds_filled");

  // Click all visible buttons
  const btns = page.locator("button:visible");
  const bc = await btns.count();
  for (let i = 0; i < Math.min(bc, 8); i++) {
    await safeClick(page, btns.nth(i));
    await waitSettle(page, 200);
  }
  await shot(page, "18_meds_after_interactions");
});

// ─── Doctor Visits ────────────────────────────────────────────────────────────

test("DoctorVisits — select doctor, add visit", async ({ page }) => {
  await setupAuth(page);
  collectErrors(page, "/doctor-visits");
  await page.goto(BASE + "/doctor-visits");
  await waitSettle(page, 800);
  await shot(page, "19_doctor_visits_initial");

  const btns = page.locator("button:visible");
  const bc = await btns.count();
  for (let i = 0; i < Math.min(bc, 10); i++) {
    await safeClick(page, btns.nth(i));
    await waitSettle(page, 300);
  }
  await shot(page, "19_doctor_visits_interacted");

  const inputs = page.locator("input:visible, textarea:visible");
  const ic = await inputs.count();
  for (let i = 0; i < ic; i++) {
    const type = await inputs.nth(i).getAttribute("type");
    if (type === "date") await inputs.nth(i).fill("2024-06-10").catch(() => {});
    else await inputs.nth(i).fill("Тест визит").catch(() => {});
  }
  if (ic > 0) await shot(page, "19_doctor_visits_filled");
});

// ─── Calendar ─────────────────────────────────────────────────────────────────

test("Calendar — navigate months", async ({ page }) => {
  await setupAuth(page);
  collectErrors(page, "/calendar");
  await page.goto(BASE + "/calendar");
  await waitSettle(page, 1000);
  await shot(page, "20_calendar_initial");

  // Next/prev month
  const chevrons = page.locator("button:visible svg ~ *, button:visible:has(svg)");
  const nc = await chevrons.count();

  // Just click all buttons up to 8
  const btns = page.locator("button:visible");
  const bc = await btns.count();
  for (let i = 0; i < Math.min(bc, 8); i++) {
    await safeClick(page, btns.nth(i));
    await waitSettle(page, 300);
  }
  await shot(page, "20_calendar_navigated");
});

// ─── Reminders ────────────────────────────────────────────────────────────────

test("Reminders — add and swipe reminder", async ({ page }) => {
  await setupAuth(page);
  collectErrors(page, "/reminders");
  await page.goto(BASE + "/reminders");
  await waitSettle(page, 800);
  await shot(page, "21_reminders_initial");

  const btns = page.locator("button:visible");
  const bc = await btns.count();
  for (let i = 0; i < Math.min(bc, 6); i++) {
    await safeClick(page, btns.nth(i));
    await waitSettle(page, 300);
  }
  await shot(page, "21_reminders_interacted");

  const inputs = page.locator("input:visible");
  const ic = await inputs.count();
  for (let i = 0; i < ic; i++) {
    const type = await inputs.nth(i).getAttribute("type");
    if (type === "time") await inputs.nth(i).fill("09:00").catch(() => {});
    else await inputs.nth(i).fill("Напоминание Playwright").catch(() => {});
  }
  if (ic > 0) await shot(page, "21_reminders_filled");
});

// ─── PhotoDiary ───────────────────────────────────────────────────────────────

test("PhotoDiary — toggle views, filter folders, like photo", async ({ page }) => {
  await setupAuth(page);
  collectErrors(page, "/photos");
  await page.goto(BASE + "/photos");
  await waitSettle(page, 1000);
  await shot(page, "22_photos_initial");

  const btns = page.locator("button:visible");
  const bc = await btns.count();
  for (let i = 0; i < Math.min(bc, 12); i++) {
    await safeClick(page, btns.nth(i));
    await waitSettle(page, 200);
  }
  await shot(page, "22_photos_interacted");
});

// ─── Error report summary ─────────────────────────────────────────────────────

test("SUMMARY — write error report", async ({}) => {
  const reportPath = path.join(SCREENSHOTS_DIR, "_ERROR_REPORT.txt");
  if (errors.length === 0) {
    fs.writeFileSync(reportPath, "✅ No console errors or page errors detected across all pages.\n");
    console.log("✅ No JS errors found across all pages.");
  } else {
    const lines = errors.map(e => `[${e.type}] ${e.page}\n  ${e.message}`).join("\n\n");
    fs.writeFileSync(reportPath, `⚠️ ${errors.length} errors detected:\n\n${lines}\n`);
    console.error(`⚠️ ${errors.length} errors found — see test-screenshots/_ERROR_REPORT.txt`);
  }
});
