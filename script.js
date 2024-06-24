// Open IndexedDB
const indexedDB =
    window.indexedDB ||
    window.mozIndexedDB ||
    window.webkitIndexedDB ||
    window.msIndexedDB;
const dbName = "QuestionDatabase";
const storeName = "questions";

let db;

// Open or create the IndexedDB database
const request = indexedDB.open(dbName, 1);

request.onupgradeneeded = function (event) {
    db = event.target.result;
    const store = db.createObjectStore(storeName, {
        keyPath: "id",
        autoIncrement: true,
    });
    store.createIndex("question", "question", { unique: false });
    store.createIndex("answer", "answer", { unique: false });
};

request.onsuccess = function (event) {
    db = event.target.result;
    console.log("IndexedDB opened successfully");
    displayStoredQuestions();
};

request.onerror = function (event) {
    console.error("Error opening IndexedDB:", event.target.error);
};

async function fetchQuestion() {
    const button = document.getElementById("fetchButton");
    const questionContainer = document.getElementById("questionContainer");
    button.disabled = true;

    // Show fetching progress
    let width = 0;
    const updateProgress = () => {
        button.innerText = `Fetching... ${width}%`;
    };

    const interval = setInterval(() => {
        width += 1;
        updateProgress();
        if (width >= 100) {
            clearInterval(interval);
        }
    }, 10);

    try {
        const response = await fetch(
            "https://opentdb.com/api.php?amount=1&type=boolean"
        );
        const data = await response.json();
        clearInterval(interval);
        width = 100;
        updateProgress();

        const question = decodeHtmlEntities(data.results[0].question);
        const answer = data.results[0].correct_answer;

        // Save fetched data to IndexedDB
        saveToIndexedDB(question, answer);

        // Create and append new question-answer pair
        const mainData = createMain(question, answer);
        questionContainer.appendChild(mainData);

        // Update button text and enable after a delay
        button.innerText = "Success!";
        setTimeout(() => {
            let countdown = 3;
            const timerInterval = setInterval(() => {
                button.innerText = `Wait ${countdown}s`;
                countdown -= 1;
                if (countdown < 0) {
                    clearInterval(timerInterval);
                    button.disabled = false;
                    button.innerText = "Fetch Question";
                }
            }, 1000);
        }, 1000); // Show success message for 1 second
    } catch (error) {
        clearInterval(interval);
        width = 100;
        updateProgress();
        console.error("Error fetching the question:", error);
        alert("Failed to fetch the question.");
        button.disabled = false;
        button.innerText = "Fetch Question";
    }
}

function createMain(question, answer) {
    // Create main container div
    const div = document.createElement("div");
    div.classList.add("main");

    // Create left side container div for question
    const mainLeft = document.createElement("div");
    mainLeft.classList.add("mainLeft");
    const q = document.createElement("p");
    q.classList.add("q");
    q.innerText = question;
    mainLeft.appendChild(q);

    // Create right side container div for answer
    const mainRight = document.createElement("div");
    mainRight.classList.add("mainRight");
    const c = document.createElement("p");
    c.classList.add("c");
    c.innerText = answer;
    mainRight.appendChild(c);

    // Append left and right containers to the main container
    div.appendChild(mainLeft);
    div.appendChild(mainRight);

    return div;
}

function decodeHtmlEntities(text) {
    const doc = new DOMParser().parseFromString(text, "text/html");
    return doc.documentElement.textContent;
}

function saveToIndexedDB(question, answer) {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const newItem = { question: question, answer: answer };
    const request = store.add(newItem);

    request.onsuccess = function (event) {
        console.log("Data added to IndexedDB successfully");
    };

    request.onerror = function (event) {
        console.error("Error adding data to IndexedDB:", event.target.error);
    };
}

function displayStoredQuestions() {
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.openCursor();

    request.onsuccess = function (event) {
        const cursor = event.target.result;
        if (cursor) {
            const question = cursor.value.question;
            const answer = cursor.value.answer;
            const mainData = createMain(question, answer);
            const questionContainer =
                document.getElementById("questionContainer");
            questionContainer.appendChild(mainData);
            cursor.continue();
        }
    };

    request.onerror = function (event) {
        console.error(
            "Error retrieving data from IndexedDB:",
            event.target.error
        );
    };
}

function clearIndexedDB() {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const clearRequest = store.clear();

    clearRequest.onsuccess = function () {
        const questionContainer =
            document.getElementById("questionContainer");
        questionContainer.innerHTML = ""; // Clear the container
    };

    clearRequest.onerror = function (event) {
        console.error("Error clearing IndexedDB:", event.target.error);
    };
}
function clearIndexedDB() {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const clearRequest = store.clear();

    clearRequest.onsuccess = function () {
        const main = document.querySelectorAll(".main")
        main.forEach(ele => {
            ele.remove();
        })
    };

    clearRequest.onerror = function (event) {
        console.error("Error clearing IndexedDB:", event.target.error);
    };
}
function installPWA() {
    const installPromptEvent = window.deferredInstallPromptEvent;
    if (installPromptEvent) {
        // Show the install prompt to the user
        installPromptEvent.prompt();
        // Wait for the user to respond to the prompt
        installPromptEvent.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the A2HS prompt');
            } else {
                console.log('User dismissed the A2HS prompt');
            }
            window.deferredInstallPromptEvent = null;
        });
    }
}

// Event listener for 'beforeinstallprompt' event
window.addEventListener('beforeinstallprompt', (event) => {
    // Prevent Chrome 76 and later from automatically showing the prompt
    event.preventDefault();
    // Stash the event so it can be triggered later.
    window.deferredInstallPromptEvent = event;
    // Update UI notify the user they can install the PWA
    const installButton = document.querySelector('.install');
    installButton.style.display = 'block';
});