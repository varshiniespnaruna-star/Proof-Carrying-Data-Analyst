const API_URL = "http://127.0.0.1:5000";

let historyData = [];
let qualityData = [];

// ======================================================
// HELPERS
// ======================================================

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}

function showSection(section) {
    if (!section) return;

    section.classList.remove("hidden");

    section.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function setActiveNav(button) {
    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("active");
    });

    if (button) {
        button.classList.add("active");
    }
}

// ======================================================
// HISTORY
// ======================================================

async function loadHistory() {
    try {
        const response = await fetch(`${API_URL}/api/history`);

        if (!response.ok) {
            throw new Error("Could not load history.");
        }

        historyData = await response.json();

        updateStatistics(historyData);
        displayHistory(historyData);
        updateReportPreview();

    } catch (error) {
        console.error("History error:", error);

        const table = document.getElementById("historyTable");

        if (table) {
            table.innerHTML = `
                <tr>
                    <td colspan="5">
                        Unable to load analysis history.
                    </td>
                </tr>
            `;
        }
    }
}

// ======================================================
// DASHBOARD STATISTICS
// ======================================================

function updateStatistics(analyses) {
    const total = analyses.length;

    const verified = analyses.filter(
        item => item.status === "Verified"
    ).length;

    const clarification = analyses.filter(
        item => item.status === "Needs clarification"
    ).length;

    const failed = analyses.filter(
        item => item.status === "Failed"
    ).length;

    const verificationRate =
        total > 0
            ? Math.round((verified / total) * 100)
            : 0;

    const totalElement =
        document.getElementById("totalAnalyses");

    const verifiedElement =
        document.getElementById("verifiedAnalyses");

    const clarificationElement =
        document.getElementById("clarificationAnalyses");

    const rateElement =
        document.getElementById("verificationRate");

    if (totalElement) {
        totalElement.textContent = total;
    }

    if (verifiedElement) {
        verifiedElement.textContent = verified;
    }

    if (clarificationElement) {
        clarificationElement.textContent = clarification;
    }

    if (rateElement) {
        rateElement.textContent = `${verificationRate}%`;
    }

    const critical =
        document.getElementById("criticalIssues");

    const warnings =
        document.getElementById("warningIssues");

    const ambiguities =
        document.getElementById("ambiguityIssues");

    if (critical) {
        critical.textContent = failed;
    }

    if (warnings) {
        warnings.textContent = clarification;
    }

    if (ambiguities) {
        const ambiguityCount = analyses.reduce(
            (count, item) => {
                return count +
                    (
                        item.ambiguities &&
                        item.ambiguities !== ""
                            ? 1
                            : 0
                    );
            },
            0
        );

        ambiguities.textContent = ambiguityCount;
    }
}

// ======================================================
// DISPLAY HISTORY
// ======================================================

function displayHistory(analyses) {
    const table =
        document.getElementById("historyTable");

    if (!table) return;

    table.innerHTML = "";

    if (analyses.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="5">
                    No analyses yet
                </td>
            </tr>
        `;
        return;
    }

    analyses.forEach(item => {
        const row = document.createElement("tr");

        let statusClass = "failed";

        if (item.status === "Verified") {
            statusClass = "verified";
        } else if (item.status === "Needs clarification") {
            statusClass = "clarification";
        }

        row.innerHTML = `
            <td>#${item.id}</td>

            <td>
                ${escapeHtml(item.question)}
            </td>

            <td>
                ${escapeHtml(item.answer || "-")}
            </td>

            <td>
                <span class="status-cell ${statusClass}">
                    ${escapeHtml(item.status)}
                </span>
            </td>

            <td>
                ${escapeHtml(item.timestamp)}
            </td>
        `;

        table.appendChild(row);
    });
}

// ======================================================
// DATA QUALITY
// ======================================================

async function loadQuality() {
    try {
        const response =
            await fetch(`${API_URL}/api/quality`);

        if (!response.ok) {
            throw new Error("Could not load data quality.");
        }

        qualityData = await response.json();

        if (!Array.isArray(qualityData)) {
            throw new Error("Invalid quality data.");
        }

        let totalRows = 0;
        let totalDuplicates = 0;
        let totalMissing = 0;

        qualityData.forEach(profile => {
            totalRows += Number(profile.rows || 0);

            totalDuplicates +=
                Number(profile.duplicate_rows || 0);

            if (profile.missing_values) {
                Object.values(
                    profile.missing_values
                ).forEach(value => {
                    totalMissing += Number(value || 0);
                });
            }
        });

        const datasetsElement =
            document.getElementById("qualityDatasets");

        const rowsElement =
            document.getElementById("qualityRows");

        const duplicateElement =
            document.getElementById("qualityDuplicates");

        const missingElement =
            document.getElementById("qualityMissing");

        if (datasetsElement) {
            datasetsElement.textContent =
                qualityData.length;
        }

        if (rowsElement) {
            rowsElement.textContent = totalRows;
        }

        if (duplicateElement) {
            duplicateElement.textContent =
                totalDuplicates;
        }

        if (missingElement) {
            missingElement.textContent =
                totalMissing;
        }

        displayQualityTable();

        updateQualityChecks(
            totalDuplicates,
            totalMissing
        );

    } catch (error) {
        console.error("Data quality error:", error);

        const table =
            document.getElementById("qualityTable");

        if (table) {
            table.innerHTML = `
                <tr>
                    <td colspan="6">
                        Unable to load data quality information.
                    </td>
                </tr>
            `;
        }
    }
}

// ======================================================
// QUALITY TABLE
// ======================================================

function displayQualityTable() {
    const table =
        document.getElementById("qualityTable");

    if (!table) return;

    table.innerHTML = "";

    qualityData.forEach(profile => {
        const missingCount =
            profile.missing_values
                ? Object.values(
                    profile.missing_values
                ).reduce(
                    (sum, value) =>
                        sum + Number(value || 0),
                    0
                )
                : 0;

        const duplicateCount =
            Number(profile.duplicate_rows || 0);

        const status =
            duplicateCount > 0 ||
            missingCount > 0
                ? "Needs attention"
                : "Healthy";

        const statusClass =
            status === "Healthy"
                ? "quality-status"
                : "quality-warning";

        const dateFields =
            profile.date_columns &&
            profile.date_columns.length
                ? profile.date_columns.join(", ")
                : "None";

        const currencyFields =
            profile.currency_columns &&
            profile.currency_columns.length
                ? profile.currency_columns.join(", ")
                : "None";

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>
                ${escapeHtml(profile.file)}
            </td>

            <td>
                ${Number(profile.rows || 0)}
            </td>

            <td>
                ${duplicateCount}
            </td>

            <td>
                ${escapeHtml(dateFields)}
            </td>

            <td>
                ${escapeHtml(currencyFields)}
            </td>

            <td>
                <span class="${statusClass}">
                    ${status}
                </span>
            </td>
        `;

        table.appendChild(row);
    });
}

// ======================================================
// QUALITY CHECKS
// ======================================================

function updateQualityChecks(duplicates, missing) {
    const passed =
        qualityData.filter(profile => {
            const duplicateCount =
                Number(profile.duplicate_rows || 0);

            const missingCount =
                profile.missing_values
                    ? Object.values(
                        profile.missing_values
                    ).reduce(
                        (sum, value) =>
                            sum + Number(value || 0),
                        0
                    )
                    : 0;

            return (
                duplicateCount === 0 &&
                missingCount === 0
            );
        }).length;

    const passedElement =
        document.getElementById("passedChecks");

    if (passedElement) {
        passedElement.textContent = passed;
    }

    const scoreElement =
        document.getElementById("ambiguityScore");

    if (scoreElement) {
        let score = 0;

        if (duplicates > 0) {
            score += 3;
        }

        if (missing > 0) {
            score += 2;
        }

        scoreElement.textContent =
            Math.min(score, 10);
    }
}

// ======================================================
// ANALYZE QUESTION
// ======================================================

async function analyzeQuestion() {
    const input =
        document.getElementById("questionInput");

    const button =
        document.getElementById("analyzeButton");

    if (!input || !button) return;

    const question =
        input.value.trim();

    if (!question) {
        alert("Please enter a question.");
        input.focus();
        return;
    }

    button.disabled = true;

    button.innerHTML = `
        <span>Analyzing...</span>
        <span>⏳</span>
    `;

    try {
        const response =
            await fetch(`${API_URL}/api/analyze`, {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    question: question
                })
            });

        const result =
            await response.json();

        if (!response.ok) {
            throw new Error(
                result.message ||
                result.error ||
                "Analysis failed."
            );
        }

        displayResult(result);

        await loadHistory();

    } catch (error) {
        console.error(error);

        alert(
            "Could not connect to the analysis server.\n\n" +
            error.message
        );

    } finally {
        button.disabled = false;

        button.innerHTML = `
            <span>Analyze</span>
            <span>→</span>
        `;
    }
}

// ======================================================
// DISPLAY RESULT
// ======================================================

function displayResult(result) {
    const section =
        document.getElementById("resultSection");

    const title =
        document.getElementById("resultTitle");

    const status =
        document.getElementById("resultStatus");

    const answer =
        document.getElementById("answerText");

    const proof =
        document.getElementById("proofText");

    if (!section) return;

    section.classList.remove("hidden");

    if (result.status === "Verified") {
        title.textContent =
            "Verified Analysis";

        status.textContent =
            "✓ Verified";

        answer.textContent =
            result.answer ||
            "Answer unavailable";

        proof.textContent =
            result.proof ||
            "No proof available.";

        status.style.color =
            "#16a34a";

    } else if (
        result.status === "Needs clarification"
    ) {
        title.textContent =
            "Clarification Required";

        status.textContent =
            "⚠ Needs clarification";

        answer.textContent =
            "The question needs clarification.";

        proof.textContent =
            formatAmbiguities(
                result.ambiguities
            );

        status.style.color =
            "#ea8b16";

    } else {
        title.textContent =
            "Analysis Failed";

        status.textContent =
            "✕ Failed";

        answer.textContent =
            "The system could not verify this answer.";

        proof.textContent =
            result.message ||
            "Unknown error.";

        status.style.color =
            "#ef4444";
    }

    section.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// ======================================================
// FORMAT AMBIGUITIES
// ======================================================

function formatAmbiguities(ambiguities) {
    if (
        !ambiguities ||
        ambiguities.length === 0
    ) {
        return "No specific ambiguity information available.";
    }

    return ambiguities
        .map(item =>
            `Type: ${item.type}\n` +
            `Issue: ${item.message}\n` +
            `Impact: ${item.impact}`
        )
        .join("\n\n");
}

// ======================================================
// PRINT HISTORY REPORT
// ======================================================

function printHistoryReport() {
    if (!historyData.length) {
        alert(
            "There is no analysis history to print yet."
        );
        return;
    }

    const verified =
        historyData.filter(
            item => item.status === "Verified"
        ).length;

    const clarification =
        historyData.filter(
            item =>
                item.status ===
                "Needs clarification"
        ).length;

    const failed =
        historyData.filter(
            item => item.status === "Failed"
        ).length;

    const rate =
        historyData.length > 0
            ? Math.round(
                (verified /
                    historyData.length) *
                100
            )
            : 0;

    const rows =
        historyData.map(item => {
            return `
                <tr>
                    <td>${item.id}</td>

                    <td>
                        ${escapeHtml(item.question)}
                    </td>

                    <td>
                        ${escapeHtml(
                            item.answer || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(item.status)}
                    </td>

                    <td>
                        ${escapeHtml(item.timestamp)}
                    </td>
                </tr>
            `;
        }).join("");

    const reportWindow =
        window.open(
            "",
            "_blank",
            "width=1200,height=800"
        );

    if (!reportWindow) {
        alert(
            "Please allow pop-ups for this dashboard to print the report."
        );
        return;
    }

    reportWindow.document.write(`
        <!DOCTYPE html>

        <html>
        <head>

            <title>
                Proof-Carrying Data Analyst Report
            </title>

            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 40px;
                    color: #222;
                }

                h1 {
                    margin-bottom: 5px;
                }

                .subtitle {
                    color: #666;
                    margin-bottom: 30px;
                }

                .summary {
                    display: grid;
                    grid-template-columns:
                        repeat(4, 1fr);
                    gap: 15px;
                    margin-bottom: 30px;
                }

                .summary-card {
                    border: 1px solid #ddd;
                    border-radius: 10px;
                    padding: 18px;
                }

                .summary-card strong {
                    display: block;
                    font-size: 25px;
                    margin-top: 8px;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                }

                th,
                td {
                    border: 1px solid #ddd;
                    padding: 10px;
                    text-align: left;
                    vertical-align: top;
                }

                th {
                    background: #f3f4f6;
                }

                .footer {
                    margin-top: 35px;
                    color: #777;
                    font-size: 12px;
                }

                @media print {
                    body {
                        padding: 15px;
                    }
                }
            </style>

        </head>

        <body>

            <h1>
                Proof-Carrying Data Analyst
            </h1>

            <div class="subtitle">
                Analysis History Report
            </div>

            <div class="summary">

                <div class="summary-card">
                    Total Analyses
                    <strong>
                        ${historyData.length}
                    </strong>
                </div>

                <div class="summary-card">
                    Verified
                    <strong>
                        ${verified}
                    </strong>
                </div>

                <div class="summary-card">
                    Clarifications
                    <strong>
                        ${clarification}
                    </strong>
                </div>

                <div class="summary-card">
                    Verification Rate
                    <strong>
                        ${rate}%
                    </strong>
                </div>

            </div>

            <h2>
                Analysis History
            </h2>

            <table>

                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Question</th>
                        <th>Answer</th>
                        <th>Status</th>
                        <th>Time</th>
                    </tr>
                </thead>

                <tbody>
                    ${rows}
                </tbody>

            </table>

            <div class="footer">
                Generated by Proof-Carrying Data Analyst
            </div>

            <script>
                window.onload = function() {
                    window.print();
                };
            <\/script>

        </body>
        </html>
    `);

    reportWindow.document.close();
}

// ======================================================
// DATASET EXPLORER
// ======================================================

async function loadDatasetExplorer() {
    const grid =
        document.getElementById("datasetGrid");

    if (!grid) return;

    grid.innerHTML = `
        <div class="empty-state">
            Loading dataset information...
        </div>
    `;

    try {
        const response =
            await fetch(`${API_URL}/api/quality`);

        if (!response.ok) {
            throw new Error(
                "Could not load datasets."
            );
        }

        const datasets =
            await response.json();

        grid.innerHTML = "";

        datasets.forEach(dataset => {
            const card =
                document.createElement("div");

            card.className =
                "dataset-card";

            const columns =
                dataset.column_names || [];

            const types =
                dataset.data_types || {};

            let columnHTML = "";

            columns.forEach(column => {
                columnHTML += `
                    <div class="dataset-column">

                        <span>
                            ${escapeHtml(column)}
                        </span>

                        <small>
                            ${escapeHtml(
                                types[column] ||
                                "unknown"
                            )}
                        </small>

                    </div>
                `;
            });

            card.innerHTML = `

                <div class="dataset-card-header">

                    <div class="dataset-file-icon">
                        📄
                    </div>

                    <div>

                        <h3>
                            ${escapeHtml(
                                dataset.file
                            )}
                        </h3>

                        <p>
                            ${dataset.rows || 0}
                            rows ·
                            ${dataset.columns || 0}
                            columns
                        </p>

                    </div>

                </div>

                <div class="dataset-stats">

                    <span>
                        🔄
                        ${dataset.duplicate_rows || 0}
                        duplicates
                    </span>

                    <span>
                        📅
                        ${(dataset.date_columns || []).length}
                        date fields
                    </span>

                    <span>
                        💰
                        ${(dataset.currency_columns || []).length}
                        currency fields
                    </span>

                </div>

                <div class="dataset-columns">

                    <h4>Columns</h4>

                    ${columnHTML}

                </div>
            `;

            grid.appendChild(card);
        });

    } catch (error) {
        console.error(
            "Dataset explorer error:",
            error
        );

        grid.innerHTML = `
            <div class="empty-state">
                Unable to load dataset information.
            </div>
        `;
    }
}

// ======================================================
// REPORT PREVIEW
// ======================================================

function updateReportPreview() {
    const total =
        historyData.length;

    const verified =
        historyData.filter(
            item => item.status === "Verified"
        ).length;

    const clarification =
        historyData.filter(
            item =>
                item.status ===
                "Needs clarification"
        ).length;

    const rate =
        total > 0
            ? Math.round(
                (verified / total) * 100
            )
            : 0;

    const totalElement =
        document.getElementById("reportTotal");

    const verifiedElement =
        document.getElementById("reportVerified");

    const clarificationElement =
        document.getElementById(
            "reportClarifications"
        );

    const rateElement =
        document.getElementById("reportRate");

    if (totalElement) {
        totalElement.textContent = total;
    }

    if (verifiedElement) {
        verifiedElement.textContent = verified;
    }

    if (clarificationElement) {
        clarificationElement.textContent =
            clarification;
    }

    if (rateElement) {
        rateElement.textContent =
            `${rate}%`;
    }

    const preview =
        document.getElementById(
            "reportPreviewContent"
        );

    if (!preview) return;

    if (total === 0) {
        preview.innerHTML =
            "No analysis history available yet.";
        return;
    }

    preview.innerHTML =
        historyData
            .slice(0, 5)
            .map(item => `
                <div class="report-preview-row">

                    <strong>
                        #${item.id}
                    </strong>

                    <span>
                        ${escapeHtml(
                            item.question
                        )}
                    </span>

                    <small>
                        ${escapeHtml(
                            item.status
                        )}
                    </small>

                </div>
            `)
            .join("");
}

// ======================================================
// NAVIGATION
// ======================================================

function setupNavigation() {

    const navDashboard =
        document.getElementById("navDashboard");

    const navAI =
        document.getElementById("navAI");

    const navAnalytics =
        document.getElementById("navAnalytics");

    const navQuality =
        document.getElementById("navQuality");

    const navIssues =
        document.getElementById("navIssues");

    const navDatasets =
        document.getElementById("navDatasets");

    const navProof =
        document.getElementById("navProof");

    const navHistory =
        document.getElementById("navHistory");

    const navReports =
        document.getElementById("navReports");

    const navSettings =
        document.getElementById("navSettings");


    // Dashboard

    if (navDashboard) {
        navDashboard.addEventListener(
            "click",
            () => {
                setActiveNav(navDashboard);

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });
            }
        );
    }


    // AI Analyst

    if (navAI) {
        navAI.addEventListener(
            "click",
            () => {
                setActiveNav(navAI);

                const section =
                    document.querySelector(
                        ".analysis-card"
                    );

                showSection(section);

                const input =
                    document.getElementById(
                        "questionInput"
                    );

                if (input) {
                    input.focus();
                }
            }
        );
    }


    // Analytics

    if (navAnalytics) {
        navAnalytics.addEventListener(
            "click",
            () => {
                setActiveNav(navAnalytics);

                showSection(
                    document.getElementById(
                        "analyticsSection"
                    )
                );
            }
        );
    }


    // Data Quality

    if (navQuality) {
        navQuality.addEventListener(
            "click",
            async () => {
                setActiveNav(navQuality);

                const section =
                    document.getElementById(
                        "dataQualitySection"
                    );

                showSection(section);

                await loadQuality();
            }
        );
    }


    // Issues

    if (navIssues) {
        navIssues.addEventListener(
            "click",
            () => {
                setActiveNav(navIssues);

                showSection(
                    document.getElementById(
                        "issuesSection"
                    )
                );
            }
        );
    }


    // Datasets

    if (navDatasets) {
        navDatasets.addEventListener(
            "click",
            async () => {
                setActiveNav(navDatasets);

                const datasets =
                    document.getElementById(
                        "datasetsSection"
                    );

                showSection(datasets);

                await loadDatasetExplorer();
            }
        );
    }


    // Proof

if (navProof) {
    navProof.addEventListener(
        "click",
        async () => {
            setActiveNav(navProof);

            await loadHistory();

            const result =
                document.getElementById(
                    "resultSection"
                );

            if (!historyData || historyData.length === 0) {
                alert(
                    "Run an analysis first to view its proof and verification."
                );
                return;
            }

            const latest =
                historyData[0];

            if (result) {
                result.classList.remove("hidden");

                const title =
                    document.getElementById("resultTitle");

                const status =
                    document.getElementById("resultStatus");

                const answer =
                    document.getElementById("answerText");

                const proof =
                    document.getElementById("proofText");

                if (latest.status === "Verified") {
                    title.textContent =
                        "Verified Analysis";

                    status.textContent =
                        "✓ Verified";

                    status.style.color =
                        "#16a34a";

                    answer.textContent =
                        latest.answer || "Answer unavailable";

                    proof.textContent =
                        latest.evidence ||
                        "No proof evidence available.";
                }

                else if (
                    latest.status ===
                    "Needs clarification"
                ) {
                    title.textContent =
                        "Clarification Required";

                    status.textContent =
                        "⚠ Needs clarification";

                    status.style.color =
                        "#ea8b16";

                    answer.textContent =
                        latest.answer ||
                        "The question needs clarification.";

                    proof.textContent =
                        latest.ambiguities ||
                        "No ambiguity information available.";
                }

                else {
                    title.textContent =
                        "Analysis Failed";

                    status.textContent =
                        "✕ Failed";

                    status.style.color =
                        "#ef4444";

                    answer.textContent =
                        latest.answer ||
                        "Analysis failed.";

                    proof.textContent =
                        latest.evidence ||
                        "No proof evidence available.";
                }

                showSection(result);
            }
        }
    );
}


    // History

    if (navHistory) {
        navHistory.addEventListener(
            "click",
            async () => {
                setActiveNav(navHistory);

                const history =
                    document.querySelector(
                        ".history-card"
                    );

                showSection(history);

                await loadHistory();
            }
        );
    }


    // Reports

    if (navReports) {
        navReports.addEventListener(
            "click",
            async () => {
                setActiveNav(navReports);

                await loadHistory();

                const reports =
                    document.getElementById(
                        "reportsSection"
                    );

                showSection(reports);

                updateReportPreview();
            }
        );
    }


    // Settings

    if (navSettings) {
        navSettings.addEventListener(
            "click",
            () => {
                setActiveNav(navSettings);

                const settings =
                    document.getElementById(
                        "settingsSection"
                    );

                showSection(settings);
            }
        );
    }
}

// ======================================================
// SETTINGS BUTTONS
// ======================================================

function setupSettings() {

    const settingsThemeButton =
        document.getElementById(
            "settingsThemeButton"
        );

    if (settingsThemeButton) {
        settingsThemeButton.addEventListener(
            "click",
            () => {
                const themeButton =
                    document.getElementById(
                        "themeToggle"
                    );

                if (themeButton) {
                    themeButton.click();
                }
            }
        );
    }


    const settingsRefreshButton =
        document.getElementById(
            "settingsRefreshButton"
        );

    if (settingsRefreshButton) {
        settingsRefreshButton.addEventListener(
            "click",
            async () => {

                await loadHistory();
                await loadQuality();

                alert(
                    "Dashboard data refreshed successfully."
                );
            }
        );
    }


    const printReportButton =
        document.getElementById(
            "printReportButton"
        );

    if (printReportButton) {
        printReportButton.addEventListener(
            "click",
            () => {
                printHistoryReport();
            }
        );
    }
}

// ======================================================
// THEME
// ======================================================

function setupTheme() {

    const themeButton =
        document.getElementById("themeToggle");

    if (!themeButton) return;

    const savedTheme =
        localStorage.getItem("theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark");
        themeButton.textContent = "🌙";
    }

    themeButton.addEventListener(
        "click",
        () => {

            document.body.classList.toggle("dark");

            const isDark =
                document.body.classList.contains(
                    "dark"
                );

            themeButton.textContent =
                isDark ? "🌙" : "☀️";

            localStorage.setItem(
                "theme",
                isDark ? "dark" : "light"
            );
        }
    );
}

// ======================================================
// BUTTON EVENTS
// ======================================================

function setupButtons() {

    const analyzeButton =
        document.getElementById(
            "analyzeButton"
        );

    if (analyzeButton) {
        analyzeButton.addEventListener(
            "click",
            analyzeQuestion
        );
    }


    const refreshButton =
        document.getElementById(
            "refreshHistory"
        );

    if (refreshButton) {
        refreshButton.addEventListener(
            "click",
            loadHistory
        );
    }


    const questionInput =
        document.getElementById(
            "questionInput"
        );

    if (questionInput) {
        questionInput.addEventListener(
            "keydown",
            event => {

                if (
                    event.ctrlKey &&
                    event.key === "Enter"
                ) {
                    event.preventDefault();
                    analyzeQuestion();
                }

            }
        );
    }
}

// ======================================================
// INITIALIZE
// ======================================================

async function initializeApp() {

    setupTheme();

    setupButtons();

    setupSettings();

    setupNavigation();

    await loadHistory();
}

// Start application
initializeApp();