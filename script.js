/* ============================================================
   KONFIGURACJA
   ============================================================ */
const GOOGLE_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyxeFf2sappFtgsto1HwF9vw3HGFLNcor-XAJ4Z4Zw8NHgL9z92jDH3LQwM21758oxh/exec";

/* ============================================================
   MODEL DANYCH SESJI
   ============================================================ */
let sessionData = {
    name: "",
    age: "",
    gender: "",
    tiktokHours: "",
    otherAppsHours: "",
    hasADHD: "",
    shortVideoApps: "",
    sartErrors: 0,
    sartTime: 0
};

/* ============================================================
   UI HELPERS
   ============================================================ */
const PROGRESS_MAP = {
    "screen-form":             5,
    "screen-instructions-1":  15,
    "screen-instructions-2":  25,
    "screen-ant":              35,
    "screen-transition":       52,
    "screen-choice":           65,
    "screen-sart-instructions":70,
    "screen-sart-transition":  75,
    "screen-sart":             82,
    "screen-end":              100,
};

function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");

    const pct = PROGRESS_MAP[id] ?? 0;
    document.getElementById("progress-bar").style.width = pct + "%";

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function showToast(message, type = "error") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.style.borderLeftColor = type === "success"
        ? "var(--success)"
        : type === "warning"
            ? "var(--warning)"
            : "var(--error)";
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

/* ============================================================
   FORMULARZ — WALIDACJA I DANE
   ============================================================ */
function toggleOtherGender() {
    const select = document.getElementById("userGender");
    const other  = document.getElementById("userGenderOther");
    if (select.value === "Inna") {
        other.classList.remove("hidden");
        other.focus();
    } else {
        other.classList.add("hidden");
        other.value = "";
    }
}

function toggleDropdown() {
    const dropdown = document.getElementById("dropdown-options");
    const box      = document.getElementById("select-box-main");
    const isHidden = dropdown.classList.contains("hidden");

    dropdown.classList.toggle("hidden");
    box.classList.toggle("open", isHidden);
}

document.addEventListener("click", function (e) {
    const ms = document.querySelector(".custom-multiselect");
    if (ms && !ms.contains(e.target)) {
        document.getElementById("dropdown-options").classList.add("hidden");
        document.getElementById("select-box-main").classList.remove("open");
    }
});

(function initCheckboxes() {
    const checkboxes      = document.querySelectorAll("#dropdown-options input");
    const selectedText    = document.getElementById("selected-text");
    const otherInput      = document.getElementById("otherApp");
    const hoursGroup      = document.getElementById("otherAppsHoursGroup");
    const hoursInput      = document.getElementById("otherAppsHours");

    checkboxes.forEach(cb => {
        cb.addEventListener("change", () => {
            const selected = [];
            checkboxes.forEach(c => { if (c.checked) selected.push(c.value); });

            selectedText.textContent = selected.length > 0
                ? selected.join(", ")
                : "Wybierz aplikacje...";
            selectedText.style.color = selected.length > 0 ? "var(--text-1)" : "";

            otherInput.classList.toggle("hidden", !selected.includes("Inne"));

            const hasRealApps = selected.some(v => v !== "Nie korzystam" && v !== "Inne")
                || (selected.includes("Inne") && otherInput.value.trim() !== "");
            const showHours = selected.length > 0 && !selected.includes("Nie korzystam");
            hoursGroup.classList.toggle("hidden", !showHours);
            if (!showHours) hoursInput.value = "";
        });
    });

    otherInput.addEventListener("input", () => {
        const selected = [];
        checkboxes.forEach(c => { if (c.checked) selected.push(c.value); });
        const showHours = selected.length > 0 && !selected.includes("Nie korzystam");
        hoursGroup.classList.toggle("hidden", !showHours);
    });
})();

function goToInstructions1() {
    const name   = document.getElementById("userName").value.trim();
    const age    = document.getElementById("userAge").value.trim();
    const gender = document.getElementById("userGender").value;
    const hours  = document.getElementById("tiktokHours").value.trim();

    if (!name)   { showToast("Proszę podać imię lub pseudonim."); return; }
    if (!age)    { showToast("Proszę podać wiek."); return; }
    if (!gender) { showToast("Proszę wybrać płeć."); return; }
    if (!hours)  { showToast("Proszę podać liczbę godzin TikToka."); return; }

    sessionData.name       = name;
    sessionData.age        = age;
    sessionData.tiktokHours = hours;
    sessionData.hasADHD    = document.getElementById("hasADHD").checked ? "Tak" : "Nie";

    sessionData.gender = gender === "Inna"
        ? (document.getElementById("userGenderOther").value.trim() || "Inna")
        : gender;

    const selectedApps = [];
    document.querySelectorAll("#dropdown-options input:checked").forEach(cb => selectedApps.push(cb.value));
    if (selectedApps.includes("Inne")) {
        const other = document.getElementById("otherApp").value.trim();
        if (other) selectedApps.push(other);
    }
    sessionData.shortVideoApps = selectedApps.join(", ") || "Nie wybrano";

    const hoursGroup   = document.getElementById("otherAppsHoursGroup");
    const showingHours = !hoursGroup.classList.contains("hidden");
    sessionData.otherAppsHours = showingHours
        ? (document.getElementById("otherAppsHours").value.trim() || "0")
        : "0";

    showScreen("screen-instructions-1");
}

function goToInstructions2() { showScreen("screen-instructions-2"); }

/* ============================================================
   ANT — KONFIGURACJA
   ============================================================ */
const TRIALS_PER_PRACTICE    = 24;
const TRIALS_PER_REAL_BLOCK  = 96;
const MAX_BLOCKS             = 3;

const cues      = ["none", "spatial", "double"];
const positions = ["top", "bottom"];
const arrowTypes = [
    { target: "→ → → → →", correctKey: "ArrowRight" },
    { target: "→ → ← → →", correctKey: "ArrowLeft"  },
    { target: "← ← ← ← ←", correctKey: "ArrowLeft"  },
    { target: "← ← → ← ←", correctKey: "ArrowRight" },
];

const TOTAL_ANT_TRIALS = TRIALS_PER_PRACTICE + (TRIALS_PER_REAL_BLOCK * MAX_BLOCKS);

let baseTrials = [];
cues.forEach(c => positions.forEach(p => arrowTypes.forEach(a => {
    baseTrials.push({ cue: c, position: p, target: a.target, correctKey: a.correctKey });
})));

let antTrials = [];
while (antTrials.length < TOTAL_ANT_TRIALS) {
    antTrials = antTrials.concat(JSON.parse(JSON.stringify(baseTrials)));
}
antTrials.sort(() => Math.random() - 0.5);

let currentPhase    = "practice";
let currentBlock    = 1;
let trialInBlock    = 0;
let globalTrialIndex = 0;

let antStartTime, antTimeout;
let blockMetrics = resetBlockMetrics();

function resetBlockMetrics() {
    return {
        totalCorrect: 0, totalIncorrect: 0, totalMissed: 0,
        rtAll: [], rtNone: [], rtSpatial: [], rtDouble: [],
        noneCorrect: 0, noneIncorrect: 0,
        spatialCorrect: 0, spatialIncorrect: 0,
        doubleCorrect: 0, doubleIncorrect: 0,
    };
}

/* ============================================================
   ANT — PRZEBIEG
   ============================================================ */
function startTraining() {
    showScreen("screen-ant");
    document.getElementById("ant-stimulus-container").classList.remove("hidden");
    runANTTrial();
}

function startRealANT() {
    document.removeEventListener("keydown", handleTransitionKey);
    currentPhase     = "real";
    currentBlock     = 1;
    trialInBlock     = 0;
    showScreen("screen-ant");
    runANTTrial();
}

function handleTransitionKey(e) {
    if (e.code === "Space") startRealANT();
}

function runANTTrial() {
    const container = document.getElementById("ant-stimulus-container");
    container.classList.remove("hidden");

    const trial   = antTrials[globalTrialIndex];
    const topDiv  = document.getElementById("ant-top");
    const botDiv  = document.getElementById("ant-bottom");
    const cenDiv  = document.getElementById("ant-center");

    topDiv.innerHTML = "";
    botDiv.innerHTML = "";
    cenDiv.innerHTML = "+";

    const fixTime = Math.floor(Math.random() * (1200 - 400 + 1)) + 400;

    setTimeout(() => {
        if (trial.cue === "spatial") {
            (trial.position === "top" ? topDiv : botDiv).innerHTML = "*";
        } else if (trial.cue === "double") {
            topDiv.innerHTML = "*";
            botDiv.innerHTML = "*";
        }

        setTimeout(() => {
            topDiv.innerHTML = "";
            botDiv.innerHTML = "";

            setTimeout(() => {
                (trial.position === "top" ? topDiv : botDiv).innerHTML = trial.target;
                antStartTime = performance.now();
                document.addEventListener("keydown", handleAntResponse);

                antTimeout = setTimeout(() => {
                    document.removeEventListener("keydown", handleAntResponse);
                    if (currentPhase === "practice") {
                        showAntFeedback(false, true, trial.position);
                    } else {
                        recordMetrics(trial, false, true, 0);
                        nextTrial();
                    }
                }, 1500);
            }, 400);
        }, 100);
    }, fixTime);
}

function handleAntResponse(e) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;

    clearTimeout(antTimeout);
    document.removeEventListener("keydown", handleAntResponse);

    const rt       = performance.now() - antStartTime;
    const trial    = antTrials[globalTrialIndex];
    const isCorrect = e.key === trial.correctKey;

    if (currentPhase === "practice") {
        showAntFeedback(isCorrect, false, trial.position);
    } else {
        recordMetrics(trial, isCorrect, false, rt);
        nextTrial();
    }
}

function showAntFeedback(isCorrect, isMissed, position) {
    const fb = document.getElementById("ant-feedback");
    fb.classList.remove("hidden");
    fb.style.top = fb.style.bottom = "";

    if (position === "top") fb.style.bottom = "10%";
    else                    fb.style.top    = "10%";

    if (isMissed) {
        fb.textContent = "BRAK ODPOWIEDZI!";
        fb.style.color = "#f59e0b";
    } else if (isCorrect) {
        fb.textContent = "DOBRZE!";
        fb.style.color = "#10b981";
    } else {
        fb.textContent = "ŹLE!";
        fb.style.color = "#ef4444";
    }

    setTimeout(() => {
        fb.classList.add("hidden");
        nextTrial();
    }, 700);
}

function recordMetrics(trial, isCorrect, isMissed, rt) {
    if (isMissed) { blockMetrics.totalMissed++; return; }

    blockMetrics.rtAll.push(rt);
    if (isCorrect) blockMetrics.totalCorrect++;
    else           blockMetrics.totalIncorrect++;

    if (trial.cue === "none") {
        blockMetrics.rtNone.push(rt);
        if (isCorrect) blockMetrics.noneCorrect++;    else blockMetrics.noneIncorrect++;
    } else if (trial.cue === "spatial") {
        blockMetrics.rtSpatial.push(rt);
        if (isCorrect) blockMetrics.spatialCorrect++; else blockMetrics.spatialIncorrect++;
    } else if (trial.cue === "double") {
        blockMetrics.rtDouble.push(rt);
        if (isCorrect) blockMetrics.doubleCorrect++;  else blockMetrics.doubleIncorrect++;
    }
}

function nextTrial() {
    document.getElementById("ant-top").innerHTML    = "";
    document.getElementById("ant-bottom").innerHTML = "";
    globalTrialIndex++;
    trialInBlock++;

    if (currentPhase === "practice") {
        if (trialInBlock >= TRIALS_PER_PRACTICE) {
            setTimeout(() => {
                showScreen("screen-transition");
                document.addEventListener("keydown", handleTransitionKey);
            }, 500);
        } else {
            setTimeout(runANTTrial, 1000);
        }
        return;
    }

    if (trialInBlock >= TRIALS_PER_REAL_BLOCK) {
        saveBlockMetrics();
        currentBlock++;
        trialInBlock    = 0;
        blockMetrics = resetBlockMetrics();

        if (currentBlock > MAX_BLOCKS) {
            setTimeout(() => showScreen("screen-choice"), 500);
        } else {
            const alertDiv = document.getElementById("block-alert");
            alertDiv.textContent = `Segment ${currentBlock} z ${MAX_BLOCKS}`;
            alertDiv.classList.remove("hidden");
            setTimeout(() => {
                alertDiv.classList.add("hidden");
                runANTTrial();
            }, 1800);
        }
    } else {
        setTimeout(runANTTrial, 1000);
    }
}

function saveBlockMetrics() {
    const avg = arr => arr.length > 0
        ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
        : 0;
    const p = `Test ${currentBlock} : `;

    sessionData[p + "antTotalCorrect"]   = blockMetrics.totalCorrect;
    sessionData[p + "antTotalIncorrect"] = blockMetrics.totalIncorrect;
    sessionData[p + "antTotalMissed"]    = blockMetrics.totalMissed;
    sessionData[p + "antAvgTime"]        = avg(blockMetrics.rtAll);

    sessionData[p + "antNoneCorrect"]    = blockMetrics.noneCorrect;
    sessionData[p + "antNoneIncorrect"]  = blockMetrics.noneIncorrect;
    sessionData[p + "antNoneAvgTime"]    = avg(blockMetrics.rtNone);

    sessionData[p + "antSpatialCorrect"]    = blockMetrics.spatialCorrect;
    sessionData[p + "antSpatialIncorrect"]  = blockMetrics.spatialIncorrect;
    sessionData[p + "antSpatialAvgTime"]    = avg(blockMetrics.rtSpatial);

    sessionData[p + "antDoubleCorrect"]    = blockMetrics.doubleCorrect;
    sessionData[p + "antDoubleIncorrect"]  = blockMetrics.doubleIncorrect;
    sessionData[p + "antDoubleAvgTime"]    = avg(blockMetrics.rtDouble);
}

/* ============================================================
   SART — KONFIGURACJA
   ============================================================ */
const SART_MAX_BLOCKS      = 3;
const SART_TRIALS_PER_BLOCK = 300;
const SART_PROB_3          = 0.08;

let sartPracticeTrials = [5, 8, 3, 1, 9];
let sartRealSequence   = [];
let currentSartPhase   = "practice";
let currentSartBlock   = 1;
let sartTrialIndex     = 0;

let sartStartTime, sartTimeoutTarget, sartTimeoutMask;
let sartResponded     = false;
let currentSartNumber = 0;

let sartTotalMetrics = { omission: 0, commission: 0, rtAll: [] };
let sartBlockMetrics = resetSartMetrics();

function resetSartMetrics() {
    return { correctHits: 0, omissionErrors: 0, commissionErrors: 0, rtCorrect: [] };
}

function generateSartBlockSequence() {
    const block = [];
    for (let i = 0; i < SART_TRIALS_PER_BLOCK; i++) {
        let num;
        if (Math.random() < SART_PROB_3) {
            num = 3;
        } else {
            do { num = Math.floor(Math.random() * 9) + 1; } while (num === 3);
        }
        block.push(num);
    }
    return block;
}

/* ============================================================
   SART — PRZEBIEG
   ============================================================ */
function initSartInstructions() { showScreen("screen-sart-instructions"); }

function startSartPractice() {
    currentSartPhase = "practice";
    sartTrialIndex   = 0;
    showScreen("screen-sart");
    runSARTTrial(sartPracticeTrials[sartTrialIndex]);
}

function startRealSart() {
    document.removeEventListener("keydown", handleSartTransitionKey);
    currentSartPhase  = "real";
    currentSartBlock  = 1;
    sartTrialIndex    = 0;
    sartBlockMetrics  = resetSartMetrics();
    sartRealSequence  = generateSartBlockSequence();
    showScreen("screen-sart");
    runSARTTrial(sartRealSequence[sartTrialIndex]);
}

function handleSartTransitionKey(e) {
    if (e.code === "Space") startRealSart();
}

function runSARTTrial(number) {
    const container = document.getElementById("sart-stimulus-container");
    const target    = document.getElementById("sart-target");
    const feedback  = document.getElementById("sart-feedback");

    container.classList.remove("hidden");
    feedback.classList.add("hidden");
    target.classList.remove("hidden");

    currentSartNumber = number;
    sartResponded     = false;
    target.textContent = String(number);

    sartStartTime = performance.now();
    document.addEventListener("keydown", handleSartResponse);

    sartTimeoutTarget = setTimeout(() => {
        target.textContent = "⊗";

        sartTimeoutMask = setTimeout(() => {
            document.removeEventListener("keydown", handleSartResponse);

            if (!sartResponded) {
                if (currentSartNumber !== 3) {
                    if (currentSartPhase === "practice") {
                        showSartFeedback(false, "BRAK ODPOWIEDZI!");
                        return;
                    } else {
                        sartBlockMetrics.omissionErrors++;
                    }
                } else if (currentSartPhase === "practice") {
                    showSartFeedback(true, "DOBRZE! (Powstrzymano)");
                    return;
                }
            }

            nextSartTrial();
        }, 900);
    }, 250);
}

function handleSartResponse(e) {
    if (e.code !== "Space" || sartResponded) return;
    sartResponded = true;
    const rt = performance.now() - sartStartTime;

    if (currentSartPhase === "practice") {
        clearTimeout(sartTimeoutTarget);
        clearTimeout(sartTimeoutMask);
        document.removeEventListener("keydown", handleSartResponse);
        document.getElementById("sart-target").classList.add("hidden");

        if (currentSartNumber === 3) {
            showSartFeedback(false, "ŹLE! To była trójka.");
        } else {
            showSartFeedback(true, "DOBRZE!");
        }
    } else {
        if (currentSartNumber === 3) {
            sartBlockMetrics.commissionErrors++;
        } else {
            sartBlockMetrics.correctHits++;
            sartBlockMetrics.rtCorrect.push(rt);
        }
    }
}

function showSartFeedback(isCorrect, message) {
    const fb = document.getElementById("sart-feedback");
    fb.classList.remove("hidden");
    fb.textContent  = message;
    fb.style.color  = isCorrect ? "#10b981" : "#ef4444";

    setTimeout(() => {
        fb.classList.add("hidden");
        nextSartTrial();
    }, 800);
}

function nextSartTrial() {
    sartTrialIndex++;

    if (currentSartPhase === "practice") {
        if (sartTrialIndex >= sartPracticeTrials.length) {
            showScreen("screen-sart-transition");
            document.addEventListener("keydown", handleSartTransitionKey);
        } else {
            runSARTTrial(sartPracticeTrials[sartTrialIndex]);
        }
        return;
    }

    if (sartTrialIndex >= SART_TRIALS_PER_BLOCK) {
        saveSartBlockMetrics();
        currentSartBlock++;
        sartTrialIndex   = 0;
        sartBlockMetrics = resetSartMetrics();
        sartRealSequence = generateSartBlockSequence();

        if (currentSartBlock > SART_MAX_BLOCKS) {
            const avg = arr => arr.length > 0
                ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
                : 0;

            sessionData["SART Ogółem : OmissionErrors"]               = sartTotalMetrics.omission;
            sessionData["SART Ogółem : CommissionErrors"]             = sartTotalMetrics.commission;
            sessionData["SART Ogółem : SumaRT (wszystkie kliknięcia)"] = sartTotalMetrics.rtAll;
            sessionData["SART Ogółem : ŚredniaRT"]                    = avg(sartTotalMetrics.rtAll);

            finishAndSave();
        } else {
            runSARTTrial(sartRealSequence[sartTrialIndex]);
        }
    } else {
        runSARTTrial(sartRealSequence[sartTrialIndex]);
    }
}

function saveSartBlockMetrics() {
    const avg = arr => arr.length > 0
        ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
        : 0;
    const p = `SART Segment ${currentSartBlock} : `;

    sessionData[p + "OmissionErrors (pominiecia)"]  = sartBlockMetrics.omissionErrors;
    sessionData[p + "CommissionErrors (blad 3)"]    = sartBlockMetrics.commissionErrors;
    sessionData[p + "AvgCorrectRT"]                 = avg(sartBlockMetrics.rtCorrect);
    sessionData[p + "CzasyReakcji (surowe)"]        = sartBlockMetrics.rtCorrect;

    sartTotalMetrics.omission  += sartBlockMetrics.omissionErrors;
    sartTotalMetrics.commission += sartBlockMetrics.commissionErrors;
    sartTotalMetrics.rtAll      = sartTotalMetrics.rtAll.concat(sartBlockMetrics.rtCorrect);
}

/* ============================================================
   ZAPIS WYNIKÓW
   ============================================================ */
function finishAndSave() {
    showScreen("screen-end");
    console.log("=== WYNIKI TESTÓW ===", sessionData);

    const statusEl = document.getElementById("save-status");

    fetch(GOOGLE_WEB_APP_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionData),
    })
    .then(() => {
        statusEl.innerHTML = `<span style="color:var(--success);font-weight:700;">
            ✓ Wyniki zostały zapisane poprawnie.
        </span>`;
    })
    .catch(err => {
        console.error("Błąd zapisu:", err);
        statusEl.innerHTML = `<span style="color:var(--error);font-weight:700;">
            Błąd zapisu — skontaktuj się z osobą zlecającą test.
        </span>`;
    });
}
