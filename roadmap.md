# Game Completion Tracker Roadmap (Post-Base Functionality)

This document outlines the planned feature enhancements, focusing on data integration, asset management, and the Mosaic Generator. These items should be considered during the initial architectural phase to ensure the core database and file structure can accommodate them easily.

---

## 1. Data Import (CSV / Google Sheets)

**Goal:** Integrate the user's existing ~20 years of game completion data into the application.

* **Priority:** High (Essential for full data migration).
* **Implementation Note:** Must include a robust **Data Normalization** step. Since source data may contain inconsistent naming, the import process must attempt fuzzy-matching to link historical entries to the correct Steam App ID or a new Non-Steam Game ID (see Feature 4).
* **Technical Requirement:** Use Node.js APIs within Electron to handle file parsing (CSV) or secure OAuth for Google Sheets integration.

---

## 2. Data Export (CSV / Google Sheets)

**Goal:** Allow users to export selected completion data (e.g., all games finished in a calendar year) for archival or external tracking.

* **Priority:** Medium.
* **Implementation Note:** Query the database for the specified time range, serialize the resulting JavaScript objects into a clean CSV format, and use the Node.js file system to save the file locally.

---

## 3. Artwork Asset Management Strategy (Local Caching)

**Goal:** Ensure the Mosaic Generator and all game lists are high-performance, responsive, and functional offline by eliminating dependence on external network calls for game artwork.

* **Architectural Decision:** **Mandatory Local Caching.**
* **Process:**
    1.  Upon syncing the Steam library or manually adding a game, immediately download the required artwork (Capsule, Capsule Wide, etc.).
    2.  Store these images permanently in a dedicated local cache directory (e.g., `app.getPath('userData')/cache`).
    3.  The database record for the game **must store the local file path** (e.g., `/local/path/to/12345_capsule_wide.jpg`) instead of the external URL.
* **Benefit:** This moves the performance hit (network latency) to a background sync process and guarantees near-instantaneous loading for the Mosaic Generator.

---

## 4. Non-Steam Game Integration (Unified Data Model)

**Goal:** Create a standardized way to add games from other platforms (PS5, Switch, GOG, etc.) so they can be seamlessly used alongside Steam games in the Mosaic Generator.

* **Workflow:**
    1.  The user adds a non-Steam game via a dedicated UI form.
    2.  The user provides the Title, Platform, and either an Artwork URL or a local image file.
    3.  The app generates a unique identifier (e.g., `NSG-0001`) for the entry.
    4.  **Critical Step:** The app executes the **Local Caching Strategy (Feature 3)** on the provided artwork, stores the resulting local file path, and creates a record in the database structure designed to mirror Steam game entries.
* **Result:** The Mosaic Generator simply queries the necessary field (`localImagePath_capsule` or similar) regardless of the game's origin platform.