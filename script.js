// UWAGA: Wklej tutaj swój URL wygenerowany w Google Apps Script!

/* ==========================================
   TEST ANT LOGIC (Wersja CRSD-ANT)
   ========================================== */
// UWAGA: Wklej tutaj swój URL wygenerowany w Google Apps Script!
const GOOGLE_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyxeFf2sappFtgsto1HwF9vw3HGFLNcor-XAJ4Z4Zw8NHgL9z92jDH3LQwM21758oxh/exec";

// Model danych - klucze ANT będą dodawane dynamicznie z prefiksami Test 1, Test 2 itd.
let sessionData = {
    name: "",
    age: "",
    gender: "",
    tiktokHours: "",
    // SART
    sartErrors: 0,
    sartTime: 0
};

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

/* ==========================================
   TEST ANT LOGIC (Segmentacja + Trening)
   ========================================== */
const cues = ["none", "spatial", "double"];
const positions = ["top", "bottom"];
const arrowTypes = [
    { target: "→ → → → →", correctKey: "ArrowRight" },
    { target: "→ → ← → →", correctKey: "ArrowLeft" },
    { target: "← ← ← ← ←", correctKey: "ArrowLeft" },
    { target: "← ← → ← ←", correctKey: "ArrowRight" }
];

const TRIALS_PER_PRACTICE = 24; 
const TRIALS_PER_REAL_BLOCK = 96;
const MAX_BLOCKS = 3;


// Generowanie prób (24 różne warianty)
let baseTrials = [];
cues.forEach(c => { 
    positions.forEach(p => { 
        arrowTypes.forEach(a => {
            baseTrials.push({ 
                cue: c, 
                position: p, 
                target: a.target, 
                correctKey: a.correctKey 
            });
        });
    });
});

// 2. Obliczamy ile prób potrzebujemy łącznie
const TOTAL_ANT_TRIALS = TRIALS_PER_PRACTICE + (TRIALS_PER_REAL_BLOCK * MAX_BLOCKS);

// 3. Powielamy zestaw 24 prób tyle razy, ile trzeba
let antTrials = [];
while (antTrials.length < TOTAL_ANT_TRIALS) {
    antTrials = antTrials.concat(JSON.parse(JSON.stringify(baseTrials)));
}

// 4. Tasujemy całość
antTrials.sort(() => Math.random() - 0.5);

// Ustawienia bloków
let currentPhase = "practice"; // "practice" (trening) lub "real" (właściwy test)
let currentBlock = 1;
let trialInBlock = 0;
let globalTrialIndex = 0; 

// ZMIENNE DO STEROWANIA DŁUGOŚCIĄ (dla testów ustawione na mało)

let antStartTime, antTimeout;
let blockMetrics = resetBlockMetrics();

function toggleDropdown() {
    document.getElementById("dropdown-options").classList.toggle("hidden");
}

const checkboxes = document.querySelectorAll('#dropdown-options input');
const selectedText = document.getElementById("selected-text");
const otherInput = document.getElementById("otherApp");

checkboxes.forEach(checkbox => {
    checkbox.addEventListener("change", () => {

        let selected = [];

        checkboxes.forEach(cb => {
            if (cb.checked) {
                selected.push(cb.value);
            }
        });

        selectedText.textContent = selected.length > 0
            ? selected.join(", ")
            : "Wybierz aplikacje...";

        if (selected.includes("Inne")) {
            otherInput.classList.remove("hidden");
        } else {
            otherInput.classList.add("hidden");
        }
    });
});

document.addEventListener("click", function(event) {
    const multiselect = document.querySelector(".custom-multiselect");

    if (!multiselect.contains(event.target)) {
        document.getElementById("dropdown-options").classList.add("hidden");
    }
});

function resetBlockMetrics() {
    return {
        totalCorrect: 0, totalIncorrect: 0, totalMissed: 0,
        rtAll: [], rtNone: [], rtSpatial: [], rtDouble: [],
        noneCorrect: 0, noneIncorrect: 0,
        spatialCorrect: 0, spatialIncorrect: 0,
        doubleCorrect: 0, doubleIncorrect: 0
    };
}

function toggleOtherGender() {
    let select = document.getElementById("userGender");
    let otherInput = document.getElementById("userGenderOther");
    if (select.value === "Inna") {
        otherInput.classList.remove("hidden");
    } else {
        otherInput.classList.add("hidden");
        otherInput.value = "";
    }
}

function goToInstructions1() {
    sessionData.name = document.getElementById('userName').value;
    sessionData.age = document.getElementById('userAge').value;
    sessionData.tiktokHours = document.getElementById('tiktokHours').value;
    sessionData.hasADHD = document.getElementById("hasADHD").checked ? "Tak" : "Nie";


    let genderSelect = document.getElementById('userGender').value;

    if (genderSelect === "Inna") {
        sessionData.gender = document.getElementById('userGenderOther').value;
    } else {
        sessionData.gender = genderSelect;
    }

    // NOWE — zapis aplikacji
    const selectedApps = [];

    document.querySelectorAll('#dropdown-options input:checked').forEach(cb => {
        selectedApps.push(cb.value);
    });

    if (selectedApps.includes("Inne")) {
        const other = document.getElementById("otherApp").value;

        if (other.trim() !== "") {
            selectedApps.push(other);
        }
    }

    sessionData.shortVideoApps = selectedApps.join(", ");

    // Walidacja
    if(!sessionData.name || !sessionData.age || !sessionData.gender || !sessionData.tiktokHours) {
        alert("Proszę wypełnić wszystkie dane w formularzu.");
        return;
    }

    showScreen('screen-instructions-1');
}

function goToInstructions2() {
    showScreen('screen-instructions-2');
}

function startTraining() {
    showScreen('screen-ant');
    // Pokazuje ukryty na start kontener z bodźcami
    document.getElementById('ant-stimulus-container').classList.remove('hidden');
    runANTTrial();
}

function startRealANT() {
    // Usunięcie nasłuchiwania na spację z ekranu przejściowego (jeśli użytkownik kliknął przycisk)
    document.removeEventListener("keydown", handleTransitionKey);
    currentPhase = "real";
    currentBlock = 1;
    trialInBlock = 0;
    showScreen('screen-ant');
    runANTTrial();
}

// Nowa funkcja do nasłuchiwania spacji na ekranie przejściowym
function handleTransitionKey(e) {
    if (e.code === "Space") {
        startRealANT();
    }
}

function runANTTrial() {
    let container = document.getElementById('ant-stimulus-container');
    container.classList.remove('hidden');
    
    let trial = antTrials[globalTrialIndex];
    let topDiv = document.getElementById('ant-top');
    let bottomDiv = document.getElementById('ant-bottom');
    let centerDiv = document.getElementById('ant-center');
    
    topDiv.innerHTML = "";
    bottomDiv.innerHTML = "";
    centerDiv.innerHTML = "+";

    let initialFixationTime = Math.floor(Math.random() * (1200 - 400 + 1)) + 400;

    setTimeout(() => {
        // CUE (Podpowiedź na 100ms)
        if (trial.cue === "spatial") {
            if (trial.position === "top") topDiv.innerHTML = "*";
            else bottomDiv.innerHTML = "*";
        } else if (trial.cue === "double") {
            topDiv.innerHTML = "*";
            bottomDiv.innerHTML = "*";
        }
        
        setTimeout(() => {
            // Zniknięcie CUE na 400ms
            topDiv.innerHTML = "";
            bottomDiv.innerHTML = "";
            
            setTimeout(() => {
                // Pojawia się TARGET (Strzałki)
                if (trial.position === "top") topDiv.innerHTML = trial.target;
                else bottomDiv.innerHTML = trial.target;
                
                antStartTime = performance.now();
                document.addEventListener("keydown", handleAntResponse);
                
                // Oczekiwanie na reakcję max 1500ms
                    antTimeout = setTimeout(() => {
                    document.removeEventListener("keydown", handleAntResponse);
                    
                    if (currentPhase === "practice") {
                        showAntFeedback(false, true, trial.position); // Dodano pozycję
                    } else {
                        recordMetrics(trial, false, true, 0); 
                        nextTrial();
                    }
                }, 1500);
                
            }, 400); 
        }, 100); 
    }, initialFixationTime); 
}

function handleAntResponse(e) {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        clearTimeout(antTimeout);
        document.removeEventListener("keydown", handleAntResponse);
        
        let reactionTime = performance.now() - antStartTime;
        let trial = antTrials[globalTrialIndex];
        let isCorrect = (e.key === trial.correctKey);

        if (currentPhase === "practice") {
            showAntFeedback(isCorrect, false, trial.position); // Przekazanie pozycji
        } else {
            recordMetrics(trial, isCorrect, false, reactionTime);
            nextTrial();
        }
    }
}

function showAntFeedback(isCorrect, isMissed, targetPosition) {
    let fb = document.getElementById('ant-feedback');
    fb.classList.remove('hidden');
    
    // Czyszczenie poprzedniej pozycji
    fb.style.top = "";
    fb.style.bottom = "";
    
    // Ustawienie napisu przeciwlegle do strzałek
    if (targetPosition === "top") {
        fb.style.bottom = "10%"; // Strzałki na górze -> tekst na dole
    } else {
        fb.style.top = "10%";    // Strzałki na dole -> tekst na górze
    }
    
    if (isMissed) {
        fb.innerText = "BRAK ODPOWIEDZI!";
        fb.style.color = "#ff9900"; 
    } else if (isCorrect) {
        fb.innerText = "DOBRZE!";
        fb.style.color = "#28a745"; 
    } else {
        fb.innerText = "ŹLE!";
        fb.style.color = "#dc3545"; 
    }

    setTimeout(() => {
        fb.classList.add('hidden');
        nextTrial();
    }, 700); 
}

function recordMetrics(trial, isCorrect, isMissed, rt) {
    if (isMissed) {
        blockMetrics.totalMissed++;
        return;
    }

    blockMetrics.rtAll.push(rt);
    if (isCorrect) blockMetrics.totalCorrect++;
    else blockMetrics.totalIncorrect++;

    if (trial.cue === "none") {
        blockMetrics.rtNone.push(rt);
        if (isCorrect) blockMetrics.noneCorrect++; else blockMetrics.noneIncorrect++;
    } else if (trial.cue === "spatial") {
        blockMetrics.rtSpatial.push(rt);
        if (isCorrect) blockMetrics.spatialCorrect++; else blockMetrics.spatialIncorrect++;
    } else if (trial.cue === "double") {
        blockMetrics.rtDouble.push(rt);
        if (isCorrect) blockMetrics.doubleCorrect++; else blockMetrics.doubleIncorrect++;
    }
}

function nextTrial() {
    document.getElementById('ant-top').innerHTML = "";
    document.getElementById('ant-bottom').innerHTML = "";
    globalTrialIndex++;
    trialInBlock++;

    if (currentPhase === "practice") {
        if (trialInBlock >= TRIALS_PER_PRACTICE) {
            // Koniec treningu -> przejdź do ekranu INFO i nasłuchuj Spacji
            setTimeout(() => {
                showScreen('screen-transition');
                document.addEventListener("keydown", handleTransitionKey);
            }, 500);
        } else {
            setTimeout(runANTTrial, 1000);
        }
    } else {
        // Tryb Właściwy
        if (trialInBlock >= TRIALS_PER_REAL_BLOCK) {
            saveBlockMetrics();
            currentBlock++;
            trialInBlock = 0;
            blockMetrics = resetBlockMetrics();

            if (currentBlock > MAX_BLOCKS) {
                // Koniec całego ANT
                setTimeout(() => showScreen('screen-choice'), 500);
            } else {
                // Pokazanie alertu między segmentami na 1.5 sekundy
                let alertDiv = document.getElementById('block-alert');
                alertDiv.innerText = `Segment ${currentBlock}`;
                alertDiv.classList.remove('hidden');
                
                setTimeout(() => {
                    alertDiv.classList.add('hidden');
                    runANTTrial();
                }, 1500); 
            }
        } else {
            setTimeout(runANTTrial, 1000);
        }
    }
}

function saveBlockMetrics() {
    let avg = (arr) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
    let prefix = `Test ${currentBlock} : `;

    // Główne
    sessionData[prefix + "antTotalCorrect"] = blockMetrics.totalCorrect;
    sessionData[prefix + "antTotalIncorrect"] = blockMetrics.totalIncorrect;
    sessionData[prefix + "antTotalMissed"] = blockMetrics.totalMissed;
    sessionData[prefix + "antAvgTime"] = avg(blockMetrics.rtAll);

    // Brak podpowiedzi (NONE)
    sessionData[prefix + "antNoneCorrect"] = blockMetrics.noneCorrect;
    sessionData[prefix + "antNoneIncorrect"] = blockMetrics.noneIncorrect;
    sessionData[prefix + "antNoneAvgTime"] = avg(blockMetrics.rtNone);

    // Przestrzenna (SPATIAL)
    sessionData[prefix + "antSpatialCorrect"] = blockMetrics.spatialCorrect;
    sessionData[prefix + "antSpatialIncorrect"] = blockMetrics.spatialIncorrect;
    sessionData[prefix + "antSpatialAvgTime"] = avg(blockMetrics.rtSpatial);

    // Zmyłka (DOUBLE)
    sessionData[prefix + "antDoubleCorrect"] = blockMetrics.doubleCorrect;
    sessionData[prefix + "antDoubleIncorrect"] = blockMetrics.doubleIncorrect;
    sessionData[prefix + "antDoubleAvgTime"] = avg(blockMetrics.rtDouble);
}
/* ==========================================
   TEST SART LOGIC (Bez zmian)
   ========================================== */
let sartPracticeTrials = [5, 8, 3, 1, 9]; // Trening: 5 prób, '3' na trzecim miejscu
let sartRealSequence = []; 
let currentSartPhase = "practice";
let currentSartBlock = 1;
let sartTrialIndex = 0;

let sartStartTime, sartTimeoutTarget, sartTimeoutMask;
let sartResponded = false;
let currentSartNumber = 0;

const SART_MAX_BLOCKS = 3;
const SART_TRIALS_PER_BLOCK = 300;

// NOWA ZMIENNA: trzyma wyniki ogólne w tle
let sartTotalMetrics = { omission: 0, commission: 0, rtAll: [] };

// Zmienne do trzymania metryk dla danego bloku
let sartBlockMetrics = resetSartMetrics();


function resetSartMetrics() {
    return {
        correctHits: 0,
        omissionErrors: 0,    // Brak spacji gdy nie było 3
        commissionErrors: 0,  // Wciśnięto spację przy 3
        rtCorrect: []
    };
}

// Funkcja generująca 6 prób na blok z gwarancją jednej cyfry '3'
function generateSartBlockSequence() {
    let block = [];
    const PROB_3 = 0.08; // 8%

    for (let i = 0; i < SART_TRIALS_PER_BLOCK; i++) {
        let num;

        // Losujemy czy będzie 3
        if (Math.random() < PROB_3) {
            num = 3;
        } else {
            // Losujemy 1–9, ale nie 3
            do {
                num = Math.floor(Math.random() * 9) + 1;
            } while (num === 3);
        }

        block.push(num);
    }

    return block;
}

function initSartInstructions() {
    showScreen('screen-sart-instructions');
}

function startSartPractice() {
    currentSartPhase = "practice";
    sartTrialIndex = 0;
    showScreen('screen-sart');
    runSARTTrial(sartPracticeTrials[sartTrialIndex]);
}

function startRealSart() {
    document.removeEventListener("keydown", handleSartTransitionKey);
    currentSartPhase = "real";
    currentSartBlock = 1;
    sartTrialIndex = 0;
    sartBlockMetrics = resetSartMetrics();
    sartRealSequence = generateSartBlockSequence();
    showScreen('screen-sart');
    runSARTTrial(sartRealSequence[sartTrialIndex]);
}

function handleSartTransitionKey(e) {
    if (e.code === "Space") {
        startRealSart();
    }
}

function runSARTTrial(number) {
    let container = document.getElementById('sart-stimulus-container');
    let targetElement = document.getElementById('sart-target');
    let feedbackElement = document.getElementById('sart-feedback');
    
    container.classList.remove('hidden');
    feedbackElement.classList.add('hidden');
    targetElement.classList.remove('hidden');
    
    currentSartNumber = number;
    sartResponded = false;
    targetElement.innerHTML = currentSartNumber;
    
    sartStartTime = performance.now();
    document.addEventListener("keydown", handleSartResponse);
    
    // FAZA 1: Pokazuje cyfrę przez 250ms
    sartTimeoutTarget = setTimeout(() => {
        targetElement.innerHTML = "⊗"; // Pokazanie maski
        
        // FAZA 2: Pokazuje maskę przez 900ms
        sartTimeoutMask = setTimeout(() => {
            document.removeEventListener("keydown", handleSartResponse);
            
            // Weryfikacja po zniknięciu maski
            if (!sartResponded) {
                if (currentSartNumber !== 3) {
                    if (currentSartPhase === "practice") {
                        showSartFeedback(false, "BRAK ODPOWIEDZI!");
                        return; // return zapobiega odpaleniu nextSartTrial tutaj
                    } else {
                        sartBlockMetrics.omissionErrors++;
                    }
                } else if (currentSartNumber === 3 && currentSartPhase === "practice") {
                    showSartFeedback(true, "DOBRZE! (Powstrzymano)");
                    return;
                }
            }
            
            nextSartTrial();
        }, 900);
    }, 250);
}

function handleSartResponse(e) {
    if (e.code === "Space" && !sartResponded) {
        sartResponded = true;
        let reactionTime = performance.now() - sartStartTime;
        
        // Jeśli w treningu odpowiedziano przed zniknięciem - przerywamy cykl żeby dać feedback
        if (currentSartPhase === "practice") {
            clearTimeout(sartTimeoutTarget);
            clearTimeout(sartTimeoutMask);
            document.removeEventListener("keydown", handleSartResponse);
            document.getElementById('sart-target').classList.add('hidden');
            
            if (currentSartNumber === 3) {
                showSartFeedback(false, "ŹLE! To była trójka.");
            } else {
                showSartFeedback(true, "DOBRZE!");
            }
        } else {
            // Właściwy test (zbieranie metryk w locie bez przerywania fiksacji)
            if (currentSartNumber === 3) {
                sartBlockMetrics.commissionErrors++;
            } else {
                sartBlockMetrics.correctHits++;
                sartBlockMetrics.rtCorrect.push(reactionTime);
            }
        }
    }
}

function showSartFeedback(isCorrect, message) {
    let fb = document.getElementById('sart-feedback');
    fb.classList.remove('hidden');
    fb.innerText = message;
    fb.style.color = isCorrect ? "#28a745" : "#dc3545";
    
    setTimeout(() => {
        fb.classList.add('hidden');
        nextSartTrial();
    }, 800);
}

function nextSartTrial() {
    sartTrialIndex++;
    
    if (currentSartPhase === "practice") {
        if (sartTrialIndex >= sartPracticeTrials.length) {
            showScreen('screen-sart-transition');
            document.addEventListener("keydown", handleSartTransitionKey);
        } else {
            runSARTTrial(sartPracticeTrials[sartTrialIndex]);
        }
    } else {
        // Właściwy test
        if (sartTrialIndex >= SART_TRIALS_PER_BLOCK) {
            saveSartBlockMetrics(); // Zapis danych za ten blok
            
            currentSartBlock++;
            sartTrialIndex = 0;
            sartBlockMetrics = resetSartMetrics();
            sartRealSequence = generateSartBlockSequence();
            
            if (currentSartBlock > SART_MAX_BLOCKS) {
                // ZAPIS WYNIKÓW OGÓLNYCH NA SAMYM KOŃCU DANYCH
                sessionData["SART Ogółem : OmissionErrors"] = sartTotalMetrics.omission;
                sessionData["SART Ogółem : CommissionErrors"] = sartTotalMetrics.commission;
                sessionData["SART Ogółem : SumaRT (wszystkie 15 klikniec)"] = sartTotalMetrics.rtAll;
                
                // Automatyczne wyliczenie średniej z całego testu SART
                sessionData["SART Ogółem : ŚredniaRT"] = sartTotalMetrics.rtAll.length > 0 ? 
                    Math.round(sartTotalMetrics.rtAll.reduce((a, b) => a + b, 0) / sartTotalMetrics.rtAll.length) : 0;

                finishAndSave();
            } else {
                // Bezszwowe przejście do kolejnego bloku
                runSARTTrial(sartRealSequence[sartTrialIndex]);
            }
        } else {
            runSARTTrial(sartRealSequence[sartTrialIndex]);
        }
    }
}

function saveSartBlockMetrics() {
    let avgRt = sartBlockMetrics.rtCorrect.length > 0 ? 
                Math.round(sartBlockMetrics.rtCorrect.reduce((a, b) => a + b, 0) / sartBlockMetrics.rtCorrect.length) : 0;
                
    let prefix = `SART Segment ${currentSartBlock} : `;
    
    sessionData[prefix + "OmissionErrors (pominiecia)"] = sartBlockMetrics.omissionErrors;
    sessionData[prefix + "CommissionErrors (blad 3)"] = sartBlockMetrics.commissionErrors;
    sessionData[prefix + "AvgCorrectRT"] = avgRt;
    
    // ZAPISUJEMY SUROWE CZASY DLA TEGO KONKRETNEGO SEGMENTU
    sessionData[prefix + "CzasyReakcji (surowe)"] = sartBlockMetrics.rtCorrect;
    
    // Zbieramy dane do zmiennej pomocniczej w tle (do sekcji Ogółem)
    sartTotalMetrics.omission += sartBlockMetrics.omissionErrors;
    sartTotalMetrics.commission += sartBlockMetrics.commissionErrors;
    sartTotalMetrics.rtAll = sartTotalMetrics.rtAll.concat(sartBlockMetrics.rtCorrect);
}

/* ==========================================
   ZAPISYWANIE DANYCH
   ========================================== */
function finishAndSave() {
    showScreen('screen-end');
    
    // Wypisujemy dane tylko w ukrytej konsoli przeglądarki (F12) dla celów technicznych
    console.log("=== WYNIKI TESTÓW ===");
    console.log(sessionData);

    let statusElement = document.getElementById('save-status');

    if (GOOGLE_WEB_APP_URL === "TUTAJ_WKLEJ_SWOJ_LINK_Z_GOOGLE_APPS_SCRIPT") {
        statusElement.innerText = "Wyniki gotowe, ale brakuje podpiętego linku do zapisu.";
        return;
    }

    // Wysyłanie danych do Google Sheets
    fetch(GOOGLE_WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(sessionData)
    })
    .then(() => {
        // SUKCES
        statusElement.innerText = "Wyniki zostały zapisane poprawnie.";
        statusElement.style.color = "#28a745"; // Zielony kolor
        statusElement.style.fontWeight = "bold";
    })
    .catch((error) => {
        // BŁĄD
        console.error('Błąd zapisu:', error);
        statusElement.innerText = "Błąd w zapisie wyników, skontaktuj się z osobą zlecającą test.";
        statusElement.style.color = "#dc3545"; // Czerwony kolor
        statusElement.style.fontWeight = "bold";
    });
}