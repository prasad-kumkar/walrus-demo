// walrus testnet endpoints
const PUBLISHER = "https://publisher.walrus-testnet.walrus.space";
const AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space";

// sui explorer for linking to on-chain objects
const SUI_EXPLORER = "https://suiscan.xyz/testnet";

// persist blob history in localstorage
const STORAGE_KEY = "walrus_demo_history";

function getHistory() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
        return [];
    }
}

function saveHistory(history) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

// -- store blob --

async function storeBlob() {
    const input = document.getElementById("input-data");
    const epochs = document.getElementById("epochs").value;
    const resultEl = document.getElementById("write-result");
    const btn = document.getElementById("store-btn");

    const data = input.value.trim();
    if (!data) {
        showResult(resultEl, "nothing to store", true);
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>storing...';
    resultEl.classList.add("hidden");

    try {
        const resp = await fetch(`${PUBLISHER}/v1/blobs?epochs=${epochs}`, {
            method: "PUT",
            body: data,
        });

        if (!resp.ok) {
            throw new Error(`publisher returned ${resp.status}: ${await resp.text()}`);
        }

        const info = await resp.json();

        // walrus returns either newlyCreated or alreadyCertified
        let blobId, endEpoch, suiRef, suiRefType;

        if (info.newlyCreated) {
            blobId = info.newlyCreated.blobObject.blobId;
            endEpoch = info.newlyCreated.blobObject.storage.endEpoch;
            suiRef = info.newlyCreated.blobObject.id;
            suiRefType = "object";
        } else if (info.alreadyCertified) {
            blobId = info.alreadyCertified.blobId;
            endEpoch = info.alreadyCertified.endEpoch;
            suiRef = info.alreadyCertified.event.txDigest;
            suiRefType = "tx";
        } else {
            throw new Error("unexpected response shape: " + JSON.stringify(info));
        }

        const suiUrl = suiRefType === "object"
            ? `${SUI_EXPLORER}/object/${suiRef}`
            : `${SUI_EXPLORER}/tx/${suiRef}`;

        showResult(resultEl, [
            `blob id: ${blobId}`,
            `stored until epoch: ${endEpoch}`,
            `sui ${suiRefType}: ${suiRef}`,
            `aggregator url: ${AGGREGATOR}/v1/blobs/${blobId}`,
        ].join("\n"), false);

        // add to history
        addToHistory({
            blobId,
            preview: data.substring(0, 80),
            endEpoch,
            suiUrl,
            timestamp: Date.now(),
        });

        // auto-fill the read panel for convenience
        document.getElementById("blob-id").value = blobId;

    } catch (err) {
        showResult(resultEl, `error: ${err.message}`, true);
    } finally {
        btn.disabled = false;
        btn.textContent = "store on walrus";
    }
}

// -- read blob --

async function readBlob() {
    const blobIdInput = document.getElementById("blob-id");
    const resultEl = document.getElementById("read-result");
    const btn = document.getElementById("read-btn");

    const blobId = blobIdInput.value.trim();
    if (!blobId) {
        showResult(resultEl, "enter a blob id", true);
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>fetching...';
    resultEl.classList.add("hidden");

    try {
        const resp = await fetch(`${AGGREGATOR}/v1/blobs/${blobId}`);

        if (!resp.ok) {
            throw new Error(`aggregator returned ${resp.status}`);
        }

        const text = await resp.text();
        showResult(resultEl, text, false);

    } catch (err) {
        showResult(resultEl, `error: ${err.message}`, true);
    } finally {
        btn.disabled = false;
        btn.textContent = "fetch";
    }
}

// -- ui helpers --

function showResult(el, text, isError) {
    el.textContent = text;
    el.classList.remove("hidden", "error", "success");
    el.classList.add(isError ? "error" : "success");
}

function addToHistory(entry) {
    const history = getHistory();
    // dedupe by blobId
    const filtered = history.filter(h => h.blobId !== entry.blobId);
    filtered.unshift(entry);
    // keep last 20
    if (filtered.length > 20) filtered.length = 20;
    saveHistory(filtered);
    renderHistory();
}

function renderHistory() {
    const container = document.getElementById("history");
    const history = getHistory();

    if (!history.length) {
        container.innerHTML = '<p class="empty-state">nothing stored yet</p>';
        return;
    }

    container.innerHTML = history.map(h => `
        <div class="history-item">
            <span class="blob-id" onclick="loadBlob('${h.blobId}')" title="${h.blobId}">${h.blobId}</span>
            <span class="preview">${escapeHtml(h.preview)}</span>
            <span class="meta">epoch ${h.endEpoch}</span>
        </div>
    `).join("");
}

function loadBlob(blobId) {
    document.getElementById("blob-id").value = blobId;
    readBlob();
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

// init
renderHistory();
