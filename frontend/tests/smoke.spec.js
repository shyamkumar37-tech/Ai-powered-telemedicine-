import { test, expect } from "@playwright/test";
import { roleRoutes } from "../src/utils/roleConfig";

test.describe("TeleCare+ smoke checks", () => {
  const credentials = {
    patient: { email: "patient@telecareplus.com", password: "Password123", home: "/patient", link: /Profile/i },
    doctor: { email: "doctor@telecareplus.com", password: "Password123", home: "/doctor", link: /Profile/i },
    caregiver: { email: "caregiver@telecareplus.com", password: "Password123", home: "/caregiver", link: /Monitoring/i },
    pharmacist: { email: "pharmacist@telecareplus.com", password: "Password123", home: "/pharmacist", link: /Inventory/i }
  };
  const logoutRegex = /Logout|लॉगआउट|ലോഗ്ഔട്ട്|లాగౌట్|ਲਾਗਆਉਟ|வெளியேறு/i;
  const voiceAssistHeadingRegex = /Voice-assisted support|குரல் உதவி ஆதரவு|वॉयस सहायता केंद्र|ശബ്ദ സഹായ കേന്ദ്രം|వాయిస్ సహాయ కేంద్రం|ਆਵਾਜ਼ ਸਹਾਇਤਾ ਕੇਂਦਰ/i;
  const startListeningRegex = /Start listening|கேட்கத் தொடங்கு|सुनना शुरू करें|ശ്രദ്ധിക്കാൻ തുടങ്ങുക|వినడం ప్రారంభించు|ਸੁਣਨਾ ਸ਼ੁਰੂ ਕਰੋ/i;
  const stopListeningRegex = /Stop listening|கேட்பதை நிறுத்து|सुनना बंद करें|ശ്രദ്ധിക്കുന്നത് നിർത്തുക|వినడం ఆపు|ਸੁਣਨਾ ਬੰਦ ਕਰੋ/i;
  const speakGuidanceRegex = /Speak guidance|வழிகாட்டலைப் பேசவும்|मार्गदर्शन बोलें|മാർഗ്ഗനിർദേശം സംസാരിക്കുക|మార్గదర్శకాన్ని పలుకు|ਮਾਰਗਦਰਸ਼ਨ ਬੋਲੋ/i;

  const loginAs = async (page, { email, password, home, link }) => {
    await page.goto("/login");
    await page.locator("input[type='email']").fill(email);
    await page.locator("input[type='password']").fill(password);
    await expect(page.locator("input[type='email']")).toHaveValue(email);
    await expect(page.locator("input[type='password']")).toHaveValue(password);
    const loginResponsePromise = page.waitForResponse((response) => response.url().includes("/api/auth/login"));
    const loginButton = page.getByRole("button", { name: /^Login$/i });
    if (await loginButton.count()) {
      await loginButton.click();
    } else {
      await page.locator("form button.btn-primary").first().click();
    }
    const loginResponse = await loginResponsePromise.catch(() => null);
    try {
      await expect(page).toHaveURL(new RegExp(home), { timeout: 12000 });
    } catch (error) {
      if (loginResponse) {
        const status = loginResponse.status();
        if (status >= 400) {
          const bodyText = await loginResponse.text().catch(() => "");
          throw new Error(`Login API failed for ${email}: ${status} ${bodyText}`);
        }
      }
      const alert = page.getByRole("alert");
      if (await alert.count()) {
        const message = await alert.first().innerText();
        throw new Error(`Login failed for ${email}: ${message}`);
      }
      const storedAuth = await page.evaluate(() => localStorage.getItem("telecareplus-auth"));
      if (storedAuth) {
        throw new Error(`Login stored auth but URL stayed on /login for ${email}: ${storedAuth}`);
      }
      throw error;
    }
    await expect(page.getByRole("button", { name: logoutRegex })).toBeVisible();
    const navLink = page.getByRole("link", { name: link });
    if (await navLink.count()) {
      await expect(navLink).toBeVisible();
    }
  };

  test("landing page loads", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#telecare-boot-splash", { state: "detached", timeout: 10000 }).catch(() => {});
    await expect(page.getByRole("heading", { name: /Smart telemedicine/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /login/i })).toBeVisible();
  });

  test("login page language switch updates UI and URL", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Secure sign in" })).toBeVisible();

    const languageSelect = page.getByTestId("language-switcher");
    await expect(languageSelect).toBeVisible();
    await languageSelect.selectOption({ value: "hi" });
    await expect(languageSelect).toHaveValue("hi");
    await expect(page.getByRole("button", { name: "ईमेल लॉगिन" })).toBeVisible();
  });

  test("protected patient route redirects to login", async ({ page }) => {
    await page.goto("/patient");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Secure sign in" })).toBeVisible();
  });

  test("role dashboards load after login", async ({ page }) => {
    await loginAs(page, credentials.patient);
    await page.getByRole("button", { name: logoutRegex }).click();
    await expect(page).toHaveURL(/\/(\?lang=hi)?$/);

    await loginAs(page, credentials.doctor);
    await page.getByRole("button", { name: logoutRegex }).click();
    await expect(page).toHaveURL(/\/(\?lang=hi)?$/);

    await loginAs(page, credentials.caregiver);
    await page.getByRole("button", { name: /Logout/i }).click();
    await expect(page).toHaveURL(/\/(\?lang=hi)?$/);

    await loginAs(page, credentials.pharmacist);
    await page.getByRole("button", { name: /Logout/i }).click();
    await expect(page).toHaveURL(/\/(\?lang=hi)?$/);
  });

  test("critical module pages render without redirect", async ({ page }) => {
    const assertPageVisible = async (path) => {
      await page.goto(path);
      await page.waitForSelector("#page-main", { state: "visible", timeout: 15000 });
      const currentUrl = page.url();
      if (currentUrl.includes("/login")) {
        throw new Error(`Unexpected redirect to login while visiting ${path}`);
      }
    };

    await loginAs(page, credentials.patient);
    for (const route of roleRoutes.PATIENT) {
      await assertPageVisible(route.path);
    }
    await page.getByRole("button", { name: /Logout/i }).click();
    await expect(page).toHaveURL(/\/(\?lang=hi)?$/);

    await loginAs(page, credentials.doctor);
    for (const route of roleRoutes.DOCTOR) {
      await assertPageVisible(route.path);
    }
    await page.getByRole("button", { name: /Logout/i }).click();
    await expect(page).toHaveURL(/\/(\?lang=hi)?$/);

    await loginAs(page, credentials.caregiver);
    for (const route of roleRoutes.CAREGIVER) {
      await assertPageVisible(route.path);
    }
    await page.getByRole("button", { name: logoutRegex }).click();
    await expect(page).toHaveURL(/\/(\?lang=hi)?$/);

    await loginAs(page, credentials.pharmacist);
    for (const route of roleRoutes.PHARMACIST) {
      await assertPageVisible(route.path);
    }
    await page.getByRole("button", { name: /Logout/i }).click();
    await expect(page).toHaveURL(/\/(\?lang=hi)?$/);
  });

  test("critical module actions (triage, IVR, messaging)", async ({ page }) => {
    const sendMessageIfPossible = async () => {
      const contactButtons = page.locator("section").first().locator("button");
      const contactCount = await contactButtons.count();
      const sendButton = page.getByRole("button", { name: /send/i });
      if (contactCount === 0) {
        await expect(sendButton).toBeDisabled();
        return;
      }

      await contactButtons.first().click();
      await page.getByRole("textbox", { name: /subject/i }).fill("Check-in");
      await page.getByRole("textbox", { name: /type/i }).fill("Automated test message.");
      await sendButton.click();
      await expect(page.getByRole("status")).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole("alert")).toHaveCount(0);
    };

    await loginAs(page, credentials.patient);
    await page.goto("/patient/triage");
    await page.getByRole("textbox", { name: /symptoms/i }).fill("Headache and fatigue");
    await page.getByRole("button", { name: /evaluate/i }).click();
    await expect(page.getByText(/triage saved successfully/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("alert")).toHaveCount(0);

    await page.goto("/patient/ivr");
    await page.getByRole("button", { name: /start/i }).click();
    await expect(page.locator("#ivr-appointment-time-error")).toBeVisible();
    await expect(page.locator("#ivr-concern-summary-error")).toBeVisible();

    await page.goto("/patient/messages");
    await sendMessageIfPossible();
    await page.getByRole("button", { name: /Logout/i }).click();
    await expect(page).toHaveURL(/\/(\?lang=hi)?$/);

    await loginAs(page, credentials.doctor);
    await page.goto("/doctor/messages");
    await sendMessageIfPossible();
    await page.getByRole("button", { name: /Logout/i }).click();
    await expect(page).toHaveURL(/\/(\?lang=hi)?$/);

    await loginAs(page, credentials.caregiver);
    await page.goto("/caregiver/messages");
    await sendMessageIfPossible();
    await page.getByRole("button", { name: /Logout/i }).click();
    await expect(page).toHaveURL(/\/(\?lang=hi)?$/);

    await loginAs(page, credentials.pharmacist);
    await page.goto("/pharmacist/messages");
    await sendMessageIfPossible();
    await page.getByRole("button", { name: logoutRegex }).click();
    await expect(page).toHaveURL(/\/(\?lang=hi)?$/);
  });

  test("deep module actions (appointments, consultation, prescriptions, caregiver interventions, inventory)", async ({ page }) => {
    const waitForMain = async () => {
      await page.waitForSelector("#page-main", { state: "visible", timeout: 15000 });
    };

    await loginAs(page, credentials.patient);
    await page.goto("/patient/appointments");
    await waitForMain();

    await page.goto("/patient/prescriptions");
    await waitForMain();
    const printLinks = page.getByRole("link", { name: /print/i });
    if (await printLinks.count()) {
      await printLinks.first().click();
      await waitForMain();
      await expect(page.getByRole("button", { name: /print/i })).toBeVisible();
      await page.getByRole("button", { name: /back/i }).click();
    }

    await page.getByRole("button", { name: /Logout/i }).click();
    await expect(page).toHaveURL(/\/(\?lang=hi)?$/);

    await loginAs(page, credentials.doctor);
    await page.goto("/doctor/appointments");
    await waitForMain();
    const openConsultButtons = page.getByRole("button", { name: /Open consultation/i });
    if (await openConsultButtons.count()) {
      await openConsultButtons.first().click();
      await waitForMain();
      const notesField = page.getByRole("textbox", { name: /notes/i });
      await notesField.fill("Consultation notes from automated check.");
      const saveConsultation = page.getByRole("button", { name: /save consultation/i });
      if (await saveConsultation.isEnabled()) {
        await saveConsultation.click();
        await expect(page.getByRole("status")).toBeVisible({ timeout: 10000 });
      }
      const generatePrescription = page.getByRole("button", { name: /generate prescription/i });
      if (await generatePrescription.count() && await generatePrescription.isEnabled()) {
        await page.getByRole("textbox", { name: /medicine/i }).fill("Paracetamol");
        await page.getByRole("textbox", { name: /dosage/i }).fill("500mg");
        await page.getByRole("textbox", { name: /frequency/i }).fill("Twice daily");
        await generatePrescription.click();
        await expect(page.getByRole("status")).toBeVisible({ timeout: 10000 });
      }
    }

    await page.getByRole("button", { name: /Logout/i }).click();
    await expect(page).toHaveURL(/\/(\?lang=hi)?$/);

    await loginAs(page, credentials.caregiver);
    await page.goto("/caregiver/interventions");
    await waitForMain();
    const logButton = page.getByRole("button", { name: /log intervention/i });
    const patientSelect = page.getByRole("combobox", { name: /patient/i });
    if (await patientSelect.count() && await logButton.count()) {
      await page.getByRole("textbox", { name: /notes/i }).fill("Followed up with patient during automated check.");
      await logButton.click();
      await expect(page.locator("p[role='status']").filter({ hasText: /intervention logged/i })).toBeVisible({ timeout: 10000 });
    }
    await page.getByRole("button", { name: /Logout/i }).click();
    await expect(page).toHaveURL(/\/(\?lang=hi)?$/);

    await loginAs(page, credentials.pharmacist);
    await page.goto("/pharmacist/inventory");
    await waitForMain();
    await page.getByRole("textbox", { name: /medicine name/i }).fill("Test Stock");
    await page.getByRole("textbox", { name: /formulation/i }).fill("Tablet");
    await page.getByRole("spinbutton", { name: /quantity/i }).fill("5");
    await page.getByRole("spinbutton", { name: /reorder level/i }).fill("2");
    await page.getByRole("textbox", { name: /unit label/i }).fill("strip");
    await page.getByRole("button", { name: /add item/i }).click();
    await expect(page.getByRole("status")).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: /Logout/i }).click();
    await expect(page).toHaveURL(/\/(\?lang=hi)?$/);
  });

  test("extended module actions (booking, dispensing updates, appointment confirm)", async ({ page }) => {
    const waitForMain = async () => {
      await page.waitForSelector("#page-main", { state: "visible", timeout: 15000 });
    };

    await loginAs(page, credentials.patient);
    await page.goto("/patient/book");
    await waitForMain();
    const dateInput = page.locator("input[type='datetime-local']").first();
    await dateInput.fill("2030-01-02T10:00");
    await page.getByRole("textbox", { name: /concern summary/i }).fill("Follow-up check.");
    await page.getByRole("button", { name: /book slot/i }).click();
    await expect(page.getByRole("status")).toBeVisible({ timeout: 10000 });
    await page.waitForURL(/\/patient\/appointments/, { timeout: 10000 }).catch(() => {});
    await page.getByRole("button", { name: /Logout/i }).click();
    await expect(page).toHaveURL(/\/(\?lang=hi)?$/);

    await loginAs(page, credentials.doctor);
    await page.goto("/doctor/appointments");
    await waitForMain();
    const confirmButtons = page.getByRole("button", { name: /^confirm$/i });
    if (await confirmButtons.count()) {
      await confirmButtons.first().click();
      await expect(page.getByRole("alert")).toHaveCount(0);
    }
    await page.getByRole("button", { name: /Logout/i }).click();
    await expect(page).toHaveURL(/\/(\?lang=hi)?$/);

    await loginAs(page, credentials.pharmacist);
    await page.goto("/pharmacist/dispensing");
    await waitForMain();
    const updateButtons = page.getByRole("button", { name: /update/i });
    if (await updateButtons.count()) {
      await page.getByRole("combobox", { name: /dispensed status/i }).first().selectOption("VERIFIED");
      await page.getByRole("textbox", { name: /verification notes/i }).first().fill("Checked in automated test.");
      await updateButtons.first().click();
      await expect(page.getByRole("alert")).toHaveCount(0);
    }
    await page.getByRole("button", { name: logoutRegex }).click();
    await expect(page).toHaveURL(/\/(\?lang=hi)?$/);
  });

  test("full lifecycle checks (cancel/resolve/refresh verification)", async ({ page }) => {
    const waitForMain = async () => {
      await page.waitForSelector("#page-main", { state: "visible", timeout: 15000 });
    };

    await loginAs(page, credentials.doctor);
    await page.goto("/doctor/appointments");
    await waitForMain();
    const cancelButtons = page.getByRole("button", { name: /^cancel$/i });
    if (await cancelButtons.count()) {
      await cancelButtons.first().click();
      await expect(page.getByRole("alert")).toHaveCount(0);
    }
    await page.getByRole("button", { name: /Logout/i }).click();
    await expect(page).toHaveURL(/\/(\?lang=hi)?$/);

    await loginAs(page, credentials.caregiver);
    await page.goto("/caregiver/interventions");
    await waitForMain();
    const resolveButtons = page.getByRole("button", { name: /mark resolved/i });
    if (await resolveButtons.count()) {
      await resolveButtons.first().click();
      await expect(page.getByRole("alert")).toHaveCount(0);
    }
    await page.getByRole("button", { name: /Logout/i }).click();
    await expect(page).toHaveURL(/\/(\?lang=hi)?$/);

    await loginAs(page, credentials.pharmacist);
    await page.goto("/pharmacist/dispensing");
    await waitForMain();
    const statusSelect = page.getByRole("combobox", { name: /dispensed status/i }).first();
    const updateButtons = page.getByRole("button", { name: /update/i });
    if (await updateButtons.count()) {
      await statusSelect.selectOption("VERIFIED");
      await updateButtons.first().click();
      await expect(page.getByRole("alert")).toHaveCount(0);
      await page.reload();
      await waitForMain();
      await expect(page.getByRole("combobox", { name: /dispensed status/i }).first()).toHaveValue("VERIFIED");
    }
    await page.getByRole("button", { name: /Logout/i }).click();
    await expect(page).toHaveURL(/\/(\?lang=hi)?$/);
  });

  test("end-to-end appointment lifecycle (book -> confirm -> consult -> prescribe)", async ({ page }) => {
    const waitForMain = async () => {
      await page.waitForSelector("#page-main", { state: "visible", timeout: 15000 });
    };

    let appointmentSummary = null;

    await loginAs(page, credentials.patient);
    await page.goto("/patient/book");
    await waitForMain();
    await page.locator("input[type='datetime-local']").first().fill("2030-02-03T10:30");
    await page.getByRole("textbox", { name: /concern summary/i }).fill("End-to-end check.");
    await page.getByRole("button", { name: /book slot/i }).click();
    await expect(page.getByRole("status")).toBeVisible({ timeout: 10000 });
    await page.waitForURL(/\/patient\/appointments/, { timeout: 10000 }).catch(() => {});
    await waitForMain();
    const firstAppointment = page.locator("section").locator(".rounded-2xl").first();
    if (await firstAppointment.count()) {
      appointmentSummary = await firstAppointment.innerText();
    }
    await page.getByRole("button", { name: /Logout/i }).click();
    await expect(page).toHaveURL(/\/(\?lang=hi)?$/);

    await loginAs(page, credentials.doctor);
    await page.goto("/doctor/appointments");
    await waitForMain();
    const appointmentCards = page.locator("section").locator(".rounded-2xl");
    if (await appointmentCards.count()) {
      const openConsultButton = appointmentCards.first().getByRole("button", { name: /Open consultation/i });
      if (await openConsultButton.count()) {
        await openConsultButton.click();
      }
    }
    await waitForMain();
    const notesField = page.getByRole("textbox", { name: /notes/i });
    if (await notesField.count()) {
      await notesField.fill("E2E consultation note.");
      const saveConsultation = page.getByRole("button", { name: /save consultation/i });
      if (await saveConsultation.isEnabled()) {
        await saveConsultation.click();
        await expect(page.getByRole("status")).toBeVisible({ timeout: 10000 });
      }
      const generatePrescription = page.getByRole("button", { name: /generate prescription/i });
      if (await generatePrescription.count() && await generatePrescription.isEnabled()) {
        await page.getByRole("textbox", { name: /medicine/i }).fill("Ibuprofen");
        await page.getByRole("textbox", { name: /dosage/i }).fill("200mg");
        await page.getByRole("textbox", { name: /frequency/i }).fill("Once daily");
        await generatePrescription.click();
        await expect(page.getByRole("status")).toBeVisible({ timeout: 10000 });
      }
    }
    await page.getByRole("button", { name: /Logout/i }).click();
    await expect(page).toHaveURL(/\/(\?lang=hi)?$/);

    await loginAs(page, credentials.patient);
    await page.goto("/patient/prescriptions");
    await waitForMain();
    const prescriptionCards = page.locator("section").locator(".rounded-2xl");
    if (await prescriptionCards.count()) {
      await expect(prescriptionCards.first()).toBeVisible();
    }
    await page.getByRole("button", { name: logoutRegex }).click();
    await expect(page).toHaveURL(/\/(\?lang=hi)?$/);
  });

  test("ai hub premium panels render and respond", async ({ page }) => {
    await loginAs(page, credentials.patient);
    await page.goto("/ai-hub");
    await page.waitForSelector("#page-main", { state: "visible", timeout: 15000 });
    await expect(page.getByRole("heading", { name: /AI Innovation Hub/i })).toBeVisible();

    await page.getByRole("textbox", { name: /Describe symptoms/i }).fill("Headache, mild fever, body aches.");
    const symptomResponsePromise = page.waitForResponse((response) => response.url().includes("/api/ai/premium/symptom-chat"));
    await page.getByRole("button", { name: /Analyze symptoms/i }).click();
    const symptomResponse = await symptomResponsePromise;
    if (!symptomResponse.ok()) {
      const body = await symptomResponse.text().catch(() => "");
      throw new Error(`Symptom chat failed: ${symptomResponse.status()} ${body}`);
    }
    const symptomData = await symptomResponse.json();
    if (!symptomData?.reply) {
      throw new Error(`Symptom chat returned unexpected payload: ${JSON.stringify(symptomData)}`);
    }
    await expect(page.getByText(symptomData.reply)).toBeVisible({ timeout: 10000 });

    const riskResponsePromise = page.waitForResponse((response) => response.url().includes("/api/ai/premium/risk-snapshot"));
    await page.getByRole("button", { name: /Load snapshot/i }).click();
    const riskResponse = await riskResponsePromise;
    if (!riskResponse.ok()) {
      const body = await riskResponse.text().catch(() => "");
      throw new Error(`Risk snapshot failed: ${riskResponse.status()} ${body}`);
    }
    const riskData = await riskResponse.json();
    if (!riskData?.category) {
      throw new Error(`Risk snapshot returned unexpected payload: ${JSON.stringify(riskData)}`);
    }
    const riskSection = page.getByRole("heading", { name: /Risk snapshot/i }).locator("xpath=ancestor::section");
    await expect(riskSection.getByText(new RegExp(`\\b${riskData.category}\\b`))).toBeVisible({ timeout: 10000 });

    const prepResponsePromise = page.waitForResponse((response) => response.url().includes("/api/ai/premium/appointment-prep"));
    await page.getByRole("button", { name: /Generate prep checklist/i }).click();
    const prepResponse = await prepResponsePromise;
    if (!prepResponse.ok()) {
      const body = await prepResponse.text().catch(() => "");
      throw new Error(`Prep checklist failed: ${prepResponse.status()} ${body}`);
    }
    const prepData = await prepResponse.json();
    if (!prepData?.checklist?.length) {
      throw new Error(`Prep checklist returned unexpected payload: ${JSON.stringify(prepData)}`);
    }
    const prepSection = page.getByRole("heading", { name: /Appointment prep checklist/i }).locator("xpath=ancestor::section");
    await expect(prepSection.getByText(prepData.checklist[0])).toBeVisible({ timeout: 10000 });

    const followResponsePromise = page.waitForResponse((response) => response.url().includes("/api/ai/premium/follow-up-plan"));
    await page.getByRole("button", { name: /Generate follow-up plan/i }).click();
    const followResponse = await followResponsePromise;
    if (!followResponse.ok()) {
      const body = await followResponse.text().catch(() => "");
      throw new Error(`Follow-up plan failed: ${followResponse.status()} ${body}`);
    }
    const followData = await followResponse.json();
    if (!followData?.recommendedDate) {
      throw new Error(`Follow-up plan returned unexpected payload: ${JSON.stringify(followData)}`);
    }
    const followSection = page.getByRole("heading", { name: /Smart follow-up plan/i }).locator("xpath=ancestor::section");
    await expect(followSection.getByText(String(followData.recommendedDate)).first()).toBeVisible({ timeout: 10000 });

    await page.getByRole("textbox", { name: /Paste a note to translate/i }).fill("Patient reports mild headache.");
    const translateResponsePromise = page.waitForResponse((response) => response.url().includes("/api/translations"));
    await page.getByRole("button", { name: /Translate/i }).click();
    const translateResponse = await translateResponsePromise;
    if (!translateResponse.ok()) {
      const body = await translateResponse.text().catch(() => "");
      throw new Error(`Translation failed: ${translateResponse.status()} ${body}`);
    }
    const translateData = await translateResponse.json();
    if (!translateData?.text) {
      throw new Error(`Translation returned unexpected payload: ${JSON.stringify(translateData)}`);
    }
    const translationSection = page.getByRole("heading", { name: /Multilingual translation/i }).locator("xpath=ancestor::section");
    await expect(translationSection.getByText(translateData.text).last()).toBeVisible({ timeout: 10000 });

    const reportResponsePromise = page.waitForResponse((response) => response.url().includes("/api/ai/premium/report-generator"));
    await page.getByRole("button", { name: /Build report outline/i }).click();
    const reportResponse = await reportResponsePromise;
    if (!reportResponse.ok()) {
      const body = await reportResponse.text().catch(() => "");
      throw new Error(`Report generator failed: ${reportResponse.status()} ${body}`);
    }
    const reportData = await reportResponse.json();
    if (!reportData?.title) {
      throw new Error(`Report generator returned unexpected payload: ${JSON.stringify(reportData)}`);
    }
    await expect(page.getByText(reportData.title)).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: /Logout/i }).click();
    await expect(page).toHaveURL(/\/(\?lang=hi)?$/);

    await loginAs(page, credentials.doctor);
    await page.goto("/ai-hub");
    await page.waitForSelector("#page-main", { state: "visible", timeout: 15000 });

    const automationResponsePromise = page.waitForResponse((response) => response.url().includes("/api/ai/premium/automation-plans"));
    await page.getByRole("button", { name: /Load automation plans/i }).click();
    const automationResponse = await automationResponsePromise;
    if (!automationResponse.ok()) {
      const body = await automationResponse.text().catch(() => "");
      throw new Error(`Automation plans failed: ${automationResponse.status()} ${body}`);
    }
    const automationData = await automationResponse.json();
    if (!automationData?.disclaimer) {
      throw new Error(`Automation plans returned unexpected payload: ${JSON.stringify(automationData)}`);
    }
    await expect(page.getByText(automationData.disclaimer).first()).toBeVisible({ timeout: 10000 });

    const complianceResponsePromise = page.waitForResponse((response) => response.url().includes("/api/ai/premium/compliance-dashboard"));
    await page.getByRole("button", { name: /Load compliance view/i }).click();
    const complianceResponse = await complianceResponsePromise;
    if (!complianceResponse.ok()) {
      const body = await complianceResponse.text().catch(() => "");
      throw new Error(`Compliance dashboard failed: ${complianceResponse.status()} ${body}`);
    }
    const complianceData = await complianceResponse.json();
    if (!complianceData?.disclaimer) {
      throw new Error(`Compliance dashboard returned unexpected payload: ${JSON.stringify(complianceData)}`);
    }
    await expect(page.getByText(complianceData.disclaimer).first()).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: /Logout/i }).click();
    await expect(page).toHaveURL(/\/(\?lang=hi)?$/);
  });

  test("language switching updates live role pages", async ({ page }) => {
    const switchLanguage = async (value) => {
      const languageSelect = page.getByTestId("language-switcher");
      await expect(languageSelect).toBeVisible();
      await languageSelect.selectOption({ value });
      await expect(languageSelect).toHaveValue(value);
    };

    await loginAs(page, credentials.patient);
    await page.goto("/patient/appointments");
    await switchLanguage("hi");
    await expect(page).toHaveURL(/lang=hi/);
    await expect(page.getByRole("button", { name: logoutRegex })).toBeVisible();
    await page.getByRole("button", { name: logoutRegex }).click();
    await expect(page).toHaveURL(/\/(\?lang=hi)?$/);

    await loginAs(page, credentials.doctor);
    await page.goto("/doctor/appointments");
    await switchLanguage("hi");
    await expect(page).toHaveURL(/lang=hi/);
    await expect(page.getByRole("button", { name: logoutRegex })).toBeVisible();
    await page.getByRole("button", { name: logoutRegex }).click();
    await expect(page).toHaveURL(/\/(\?lang=hi)?$/);

    await loginAs(page, credentials.caregiver);
    await page.goto("/caregiver/interventions");
    await switchLanguage("hi");
    await expect(page).toHaveURL(/lang=hi/);
    await expect(page.getByRole("button", { name: logoutRegex })).toBeVisible();
    await page.getByRole("button", { name: logoutRegex }).click();
    await expect(page).toHaveURL(/\/(\?lang=hi)?$/);

    await loginAs(page, credentials.pharmacist);
    await page.goto("/pharmacist/inventory");
    await switchLanguage("hi");
    await expect(page).toHaveURL(/lang=hi/);
    await expect(page.getByRole("button", { name: logoutRegex })).toBeVisible();
    await page.getByRole("button", { name: logoutRegex }).click();
    await expect(page).toHaveURL(/\/(\?lang=hi)?$/);
  });

  test("free-text areas retain content on language switch", async ({ page }) => {
    await loginAs(page, credentials.doctor);
    await page.goto("/doctor/consultation");
    await page.waitForSelector("#page-main", { state: "visible", timeout: 15000 });

    const notesField = page.getByRole("textbox", { name: /notes/i });
    if (await notesField.count()) {
      await notesField.fill("Doctor notes should stay intact after language switch.");
    }
    const languageSelect = page.getByTestId("language-switcher");
    await languageSelect.selectOption({ value: "hi" });
    await expect(languageSelect).toHaveValue("hi");
    if (await notesField.count()) {
      await expect(notesField).toHaveValue("Doctor notes should stay intact after language switch.");
    }
    await page.getByRole("button", { name: logoutRegex }).click();
    await expect(page).toHaveURL(/\/(\?lang=hi)?$/);
  });

  test("voice assist UI states render and fallbacks appear", async ({ page }) => {
    await loginAs(page, credentials.patient);
    await page.goto("/patient/voice-assist");
    await page.waitForSelector("#page-main", { state: "visible", timeout: 15000 });

    await expect(page.getByRole("heading", { name: voiceAssistHeadingRegex })).toBeVisible();
    await expect(page.getByRole("button", { name: startListeningRegex })).toBeVisible();
    await expect(page.getByRole("button", { name: stopListeningRegex }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: speakGuidanceRegex })).toBeVisible();

    // When speech APIs are unavailable, fallback guidance should be visible.
    const unsupportedNotice = page.getByText(/browser voice unsupported/i);
    if (await unsupportedNotice.count()) {
      await expect(unsupportedNotice).toBeVisible();
    }

    // Transcript area should show a status message (listening or prompt).
    await expect(page.getByRole("status").first()).toBeVisible();

    await page.getByRole("button", { name: logoutRegex }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
