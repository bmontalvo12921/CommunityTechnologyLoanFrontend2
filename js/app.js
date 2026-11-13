/* =========================================================
   COMMUNITY TECHNOLOGY LOAN
   City of Orlando
   Frontend Application
   ========================================================= */

   "use strict";

   /* =========================================================
      APPLICATION STATE
      ========================================================= */
   
   const state = {
       authenticated: false,
       currentPage: "Dashboard",
       currentUser: null,
   
       // Filled from the API (GET /v1/inventory, GET /v1/centers) by
       // loadInventoryData(); never persisted in localStorage.
       devices: [],

       centers: [],
   
       loans: [
           {
               id: 1,
               assetTag: "ORL-LT-0043",
               device: "Dell Latitude 5540",
               borrower: "Community Services",
               center: "Englewood",
               status: "Active",
               loanDate: "2026-09-10",
               returnDate: "2026-10-10"
           },
           {
               id: 2,
               assetTag: "ORL-LT-0044",
               device: "Dell Latitude 5540",
               borrower: "Digital Literacy Program",
               center: "Hankins",
               status: "Active",
               loanDate: "2026-09-15",
               returnDate: "2026-10-15"
           },
           {
               id: 3,
               assetTag: "ORL-TB-0015",
               device: "iPad 10th Gen",
               borrower: "Youth Services",
               center: "Barnett",
               status: "Returned",
               loanDate: "2026-08-12",
               returnDate: "2026-09-01"
           }
       ],
   
       users: [
           {
               id: 1,
               name: "Admin User",
               email: "admin@orlando.gov",
               role: "ADMIN",
               status: "Active",
               lastLogin: "2026-09-28 09:15 AM"
           },
           {
               id: 2,
               name: "Staff User",
               email: "staff@orlando.gov",
               role: "STAFF",
               status: "Active",
               lastLogin: "2026-09-28 08:42 AM"
           }
       ],
       userFormId: null,
       settingsForm: null
   };
   
   
   /* =========================================================
      DEMO AUTHENTICATION
      ========================================================= */
   
   const demoAccounts = [
       {
           email: "admin@orlando.gov",
           password: "Admin123!",
           name: "Admin User",
           role: "ADMIN"
       },
       {
           email: "staff@orlando.gov",
           password: "Staff123!",
           name: "Staff User",
           role: "STAFF"
       }
   ];
   
   
   /* =========================================================
      APPLICATION START
      ========================================================= */
   
   document.addEventListener("DOMContentLoaded", () => {

       console.log("Community Technology Loan Frontend initialized.");

       loadSavedSession();

       startApplication();
   });


   async function startApplication() {

       const connected = await connectToServer();

       if (!connected) {
           return;
       }

       if (state.authenticated) {
           renderApplication();
       } else {
           renderLogin();
       }
   }


   /* =========================================================
      SERVER WAKE-UP
      ---------------------------------------------------------
      The free Render instance sleeps when idle and can take
      about a minute to boot. Poll GET /health (no auth) until
      it answers instead of failing on the first request.
      ========================================================= */

   const SERVER_WAKE_MAX_WAIT_MS = 150000;
   const SERVER_WAKE_RETRY_DELAY_MS = 3000;
   const SERVER_WAKE_REQUEST_TIMEOUT_MS = 15000;

   async function connectToServer() {

       const startedAt = Date.now();
       let attempt = 0;

       while (true) {

           attempt += 1;

           renderConnecting(attempt, Date.now() - startedAt);

           try {
               await window.CTLApi.health.check(SERVER_WAKE_REQUEST_TIMEOUT_MS);
               return true;
           } catch (error) {
               console.warn(`Health check attempt ${attempt} failed.`, error);
           }

           if (Date.now() - startedAt >= SERVER_WAKE_MAX_WAIT_MS) {
               break;
           }

           await new Promise(resolve =>
               setTimeout(resolve, SERVER_WAKE_RETRY_DELAY_MS)
           );
       }

       renderConnectionFailed();

       return false;
   }


   function renderConnecting(attempt, elapsedMs) {

       const app = document.getElementById("app");

       if (!app) {
           return;
       }

       const seconds = Math.round(elapsedMs / 1000);

       app.innerHTML = `
           <div class="app-loading" role="status" aria-live="polite">
               <div class="loading-content">
                   <div class="loading-brand">Tech Loan</div>
                   <div class="loading-subtitle">City of Orlando</div>
                   <div class="loading-spinner" aria-hidden="true"></div>
                   <p>Connecting to the server…</p>
                   ${attempt > 1 ? `
                   <p>
                       The server is starting up. This can take about a minute.
                       (attempt ${attempt}, ${seconds}s)
                   </p>` : ""}
               </div>
           </div>
       `;
   }


   function renderConnectionFailed() {

       const app = document.getElementById("app");

       if (!app) {
           return;
       }

       app.innerHTML = `
           <div class="app-loading" role="alert">
               <div class="loading-content">
                   <div class="loading-brand">Tech Loan</div>
                   <div class="loading-subtitle">City of Orlando</div>
                   <p>Could not connect to the server.</p>
                   <p>Please check your connection and try again in a moment.</p>
                   <button type="button" class="primary-button" id="retry-connection">
                       Try Again
                   </button>
               </div>
           </div>
       `;

       document
           .getElementById("retry-connection")
           .addEventListener("click", startApplication);
   }
   
   
   /* =========================================================
      SESSION
      ========================================================= */
   
   function loadSavedSession() {
   
       const savedUser = sessionStorage.getItem("ctl_current_user");
   
       if (!savedUser) {
           return;
       }
   
       try {
   
           state.currentUser = JSON.parse(savedUser);
           state.authenticated = true;
   
       } catch (error) {
   
           console.error("Unable to restore session.");
   
           sessionStorage.removeItem("ctl_current_user");
       }
   }
   
   
   function saveSession(user) {
   
       state.currentUser = user;
       state.authenticated = true;
   
       sessionStorage.setItem(
           "ctl_current_user",
           JSON.stringify(user)
       );
   }
   
   
   function logout() {
   
       state.authenticated = false;
       state.currentUser = null;
       state.currentPage = "Dashboard";
   
       sessionStorage.removeItem("ctl_current_user");
   
       renderLogin();
   }
   
   
   /* =========================================================
      LOGIN
      ========================================================= */
   
   function renderLogin() {
   
       const app = document.getElementById("app");
   
       if (!app) {
           return;
       }
   
       app.innerHTML = `
           <div class="login-container">
   
               <div class="login-card">
   
                   <div class="login-logo">
   
                       <h1>Tech Loan</h1>
   
                       <span>
                           City of Orlando
                       </span>
   
                   </div>
   
                   <h2>Staff Sign In</h2>
   
                   <p class="login-description">
                       Community Technology Loan Project
                       inventory management system.
                   </p>
   
                   <div
                       id="login-error"
                       class="form-error"
                       style="display:none;"
                       role="alert"
                   ></div>
   
                   <form id="login-form">
   
                       <div class="form-group">
   
                           <label for="login-email">
                               Email
                           </label>
   
                           <input
                               id="login-email"
                               name="email"
                               type="email"
                               autocomplete="username"
                               placeholder="Enter your email"
                               required
                           >
   
                       </div>
   
                       <div class="form-group">
   
                           <label for="login-password">
                               Password
                           </label>
   
                           <input
                               id="login-password"
                               name="password"
                               type="password"
                               autocomplete="current-password"
                               placeholder="Enter your password"
                               required
                           >
   
                       </div>
   
                       <button
                           type="submit"
                           class="login-button"
                       >
                           Sign In
                       </button>
   
                   </form>
   
                   <div class="login-footer">
   
                       Internal City of Orlando
                       Technology Loan System
   
                   </div>
   
               </div>
   
           </div>
       `;
   
       const form = document.getElementById("login-form");
   
       form.addEventListener("submit", handleLogin);
   }
   
   
   function handleLogin(event) {
   
       event.preventDefault();
   
       const email =
           document.getElementById("login-email").value.trim();
   
       const password =
           document.getElementById("login-password").value;
   
       const errorBox =
           document.getElementById("login-error");
   
       const account = demoAccounts.find(
           user =>
               user.email.toLowerCase() === email.toLowerCase() &&
               user.password === password
       );
   
       if (!account) {
   
           errorBox.textContent =
               "Invalid email or password. Please try again.";
   
           errorBox.style.display = "block";
   
           return;
       }
   
       saveSession({
           name: account.name,
           email: account.email,
           role: account.role
       });
   
       state.currentPage = "Dashboard";
   
       renderApplication();
   }
   
   
   /* =========================================================
      MAIN APPLICATION
      ========================================================= */
   
   function renderApplication() {
   
       const app = document.getElementById("app");
   
       if (!app) {
           return;
       }
   
       // Invalidate any page render still waiting on the API.
       beginRender();

       app.innerHTML = `

           <div class="app-container">

               ${renderSidebar()}
   
               <main
                   class="main-content"
                   id="main-content"
               ></main>
   
           </div>
       `;
   
       setupNavigation();
   
       renderPage(state.currentPage);
   }
   
   
   /* =========================================================
      SIDEBAR
      ========================================================= */
   
   function renderSidebar() {
   
       const isAdmin =
           state.currentUser &&
           state.currentUser.role === "ADMIN";
   
       return `
   
           <aside class="sidebar">
   
               <div class="logo">
   
                   <h2>Tech Loan</h2>
   
                   <span>
                       City of Orlando
                   </span>
   
               </div>
   
               <nav
                   class="navigation"
                   aria-label="Main navigation"
               >
   
                   ${navItem("Dashboard", "dashboard")}
   
                   ${navItem(
                       "Device Inventory",
                       "inventory"
                   )}
   
                   ${navItem(
                       "Outreach Centers",
                       "centers"
                   )}
   
                   ${navItem(
                       "Loans",
                       "loans"
                   )}
   
                   ${
                       isAdmin
                           ? navItem("Users", "users")
                           : ""
                   }
   
                   ${
                       isAdmin
                           ? navItem("Settings", "settings")
                           : ""
                   }
   
               </nav>
   
               <div class="sidebar-bottom">
   
                   <div class="user-info">
   
                       <strong>
                           ${escapeHTML(
                               state.currentUser?.name ||
                               "Staff User"
                           )}
                       </strong>
   
                       <span>
                           ${escapeHTML(
                               state.currentUser?.role ||
                               "STAFF"
                           )}
                       </span>
   
                   </div>
   
                   <a
                       href="#logout"
                       class="nav-item logout-link"
                       data-page="Logout"
                   >
                       Logout
                   </a>
   
               </div>
   
           </aside>
       `;
   }
   
   
   function navItem(label, page) {
   
       const active =
           state.currentPage === label
               ? "active"
               : "";
   
       return `
           <a
               href="#${page}"
               class="nav-item ${active}"
               data-page="${label}"
           >
               ${label}
           </a>
       `;
   }
   
   
   /* =========================================================
      NAVIGATION
      ========================================================= */
   
   function setupNavigation() {
   
       const links =
           document.querySelectorAll(
               "[data-page]"
           );
   
       links.forEach(link => {
   
           link.addEventListener(
               "click",
               event => {
   
                   event.preventDefault();
   
                   const page =
                       link.dataset.page;
   
                   if (page === "Logout") {
   
                       logout();
   
                       return;
                   }
   
                   navigateTo(page);
               }
           );
       });
   }
   
   
   function navigateTo(page) {
   
       if (
           (page === "Users" || page === "Settings") &&
           state.currentUser?.role !== "ADMIN"
       ) {
   
           renderUnauthorized();
   
           return;
       }
   
       state.currentPage = page;
   
       renderApplication();
   }
   
   
   /* =========================================================
      PAGE ROUTER
      ========================================================= */
   
   function renderPage(page) {
   
       switch (page) {
   
           case "Dashboard":
               renderDashboard();
               break;
   
           case "Device Inventory":
               renderInventory();
               break;
   
           case "Outreach Centers":
               renderCenters();
               break;
   
           case "Loans":
               renderLoans();
               break;
   
           case "Users":
               renderUsers();
               break;
   
           case "Settings":
               renderSettings();
               break;
   
           default:
               renderDashboard();
       }
   }
   
   
   /* =========================================================
      PAGE HEADER
      ========================================================= */
   
   function pageHeader(title, subtitle = "") {
   
       return `
           <header class="top-header">
   
               <div>
   
                   <span class="organization">
                       CITY OF ORLANDO ·
                       COMMUNITY TECHNOLOGY LOAN PROJECT
                   </span>
   
                   <h1>
                       ${escapeHTML(title)}
                   </h1>
   
                   ${
                       subtitle
                           ? `<p class="page-subtitle">
                               ${escapeHTML(subtitle)}
                              </p>`
                           : ""
                   }
   
               </div>
   
           </header>
       `;
   }
   
   
   /* =========================================================
      API DATA HELPERS
      ---------------------------------------------------------
      Devices and centers are always read from the API
      (GET /v1/inventory, GET /v1/centers). Nothing is stored
      in localStorage; state.devices / state.centers only keep
      the last response for the page currently on screen.
      ========================================================= */

   const DEVICE_TYPE_LABELS = {
       LAPTOP: "Laptop",
       TABLET: "Tablet",
       HOTSPOT: "Hotspot"
   };

   const DEVICE_STATUS_LABELS = {
       AVAILABLE: "Available",
       CHECKED_OUT: "Checked Out",
       MAINTENANCE: "Maintenance"
   };

   const DEVICE_STATUS_CLASSES = {
       AVAILABLE: "available",
       CHECKED_OUT: "assigned",
       MAINTENANCE: "maintenance"
   };

   // Every async page render takes a token; if the user moves to
   // another page before the API answers, the stale render is dropped.
   let renderSequence = 0;

   function beginRender() {
       renderSequence += 1;
       return renderSequence;
   }

   function isCurrentRender(token) {
       return token === renderSequence;
   }

   // Reads every page of a cursor-paginated list endpoint.
   async function fetchAllPages(listFn) {
       const rows = [];
       let cursor;

       for (let page = 0; page < 50; page += 1) {
           const response = await listFn({ limit: 100, cursor });
           rows.push(...responseRows(response));
           cursor = response?.page?.nextCursor;
           if (!cursor) break;
       }

       return rows;
   }

   function fetchAllCenters() {
       return fetchAllPages(params => window.CTLApi.centers.list(params));
   }

   function fetchAllDevices() {
       return fetchAllPages(params => window.CTLApi.devices.list(params));
   }

   function toDeviceView(device, centers) {
       const center = centers.find(item => item.centerId === device.centerId);
       return {
           ...device,
           typeLabel: DEVICE_TYPE_LABELS[device.deviceType] || device.deviceType || "—",
           statusLabel: DEVICE_STATUS_LABELS[device.status] || device.status || "Unknown",
           centerName: center ? center.centerName : `Center #${device.centerId}`
       };
   }

   async function loadInventoryData() {
       const [devices, centers] = await Promise.all([
           fetchAllDevices(),
           fetchAllCenters()
       ]);
       state.centers = centers;
       state.devices = devices.map(device => toDeviceView(device, centers));
       return { devices: state.devices, centers };
   }

   // Best human-readable message from an API error.
   function apiErrorMessage(error, fallback) {
       const data = error?.data;
       if (data && typeof data === "object" && data.error) {
           const fieldErrors = data.details?.fieldErrors || {};
           const fieldText = Object.entries(fieldErrors)
               .map(([field, messages]) => `${field}: ${[].concat(messages).join(", ")}`)
               .join("; ");
           const formText = [].concat(data.details?.formErrors || []).join("; ");
           const extra = [fieldText, formText].filter(Boolean).join("; ");
           return extra ? `${data.error} (${extra})` : data.error;
       }
       return error?.message || fallback;
   }

   function showLoading(content, title, subtitle, message) {
       content.innerHTML = `
           ${pageHeader(title, subtitle)}
           <section class="content-card">
               <div class="empty-state">
                   <p>${escapeHTML(message)}</p>
               </div>
           </section>
       `;
   }

   function showLoadError(content, title, subtitle, error, retry) {
       state.retryRender = retry;
       content.innerHTML = `
           ${pageHeader(title, subtitle)}
           <section class="content-card">
               <div class="empty-state">
                   <h2>Could not load data from the server</h2>
                   <p>${escapeHTML(apiErrorMessage(error, "Check that the API is running."))}</p>
                   <button class="primary-button" data-action="retry-render">Try Again</button>
               </div>
           </section>
       `;
       setupPageActions();
   }

   function deviceStatusBadge(status) {
       const className = DEVICE_STATUS_CLASSES[status] || "info";
       const label = DEVICE_STATUS_LABELS[status] || status || "Unknown";
       return `<span class="status ${escapeAttribute(className)}">${escapeHTML(label)}</span>`;
   }

   function centerStatusBadge(isActive) {
       return isActive
           ? `<span class="status active">Active</span>`
           : `<span class="status inactive">Inactive</span>`;
   }


   /* =========================================================
      DASHBOARD
      ========================================================= */

   async function renderDashboard() {

       const content =
           document.getElementById("main-content");

       const title = "Dashboard";
       const subtitle = "Technology inventory overview and recent activity.";
       const token = beginRender();

       showLoading(content, title, subtitle, "Loading inventory from the server…");

       let devices;

       try {
           ({ devices } = await loadInventoryData());
       } catch (error) {
           if (isCurrentRender(token)) {
               showLoadError(content, title, subtitle, error, renderDashboard);
           }
           return;
       }

       if (!isCurrentRender(token)) {
           return;
       }

       const countByStatus = status =>
           devices.filter(d => d.status === status).length;

       // Most recently added devices first.
       const recent = [...devices]
           .sort((a, b) => b.deviceId - a.deviceId)
           .slice(0, 5);

       content.innerHTML = `

           ${pageHeader(title, subtitle)}

           <section class="dashboard-cards">

               ${statCard("Total Devices", devices.length)}

               ${statCard("Available", countByStatus("AVAILABLE"))}

               ${statCard("Checked Out", countByStatus("CHECKED_OUT"))}

               ${statCard("Maintenance", countByStatus("MAINTENANCE"))}

           </section>

           <section class="content-card">

               <div class="card-header">

                   <h2>
                       Recent Device Activity
                   </h2>

                   <button
                       class="text-button"
                       data-action="inventory"
                   >
                       View All →
                   </button>

               </div>

               <div class="table-container">

                   <table>

                       <thead>

                           <tr>
                               <th>Asset Tag</th>
                               <th>Type</th>
                               <th>Model</th>
                               <th>Status</th>
                               <th>Center</th>
                           </tr>

                       </thead>

                       <tbody>

                           ${recent.map(deviceRow).join("") ||
                               `<tr><td colspan="5">No devices returned by the API.</td></tr>`}

                       </tbody>

                   </table>

               </div>

           </section>

           <section class="content-card">

               <div class="card-header">

                   <h2>
                       Quick Actions
                   </h2>

               </div>

               <div class="quick-actions">

                   <button
                       type="button"
                       data-action="inventory"
                   >
                       View Device Inventory
                   </button>

                   <button
                       type="button"
                       data-action="add-device"
                   >
                       Add New Device
                   </button>

                   <button
                       type="button"
                       data-action="centers"
                   >
                       Outreach Centers
                   </button>

                   <button
                       type="button"
                       data-action="loans"
                   >
                       Manage Loans
                   </button>

               </div>

           </section>
       `;

       setupPageActions();
   }


   /* =========================================================
      STAT CARD
      ========================================================= */

   function statCard(label, value) {

       return `
           <div class="dashboard-card">

               <span>
                   ${escapeHTML(label)}
               </span>

               <strong>
                   ${escapeHTML(value)}
               </strong>

           </div>
       `;
   }


   /* =========================================================
      DEVICE INVENTORY
      ========================================================= */

   async function renderInventory() {

       const content =
           document.getElementById("main-content");

       const title = "Device Inventory";
       const subtitle = "Search, filter, and manage technology assets.";
       const token = beginRender();

       showLoading(content, title, subtitle, "Loading devices from the server…");

       let devices;
       let centers;

       try {
           ({ devices, centers } = await loadInventoryData());
       } catch (error) {
           if (isCurrentRender(token)) {
               showLoadError(content, title, subtitle, error, renderInventory);
           }
           return;
       }

       if (!isCurrentRender(token)) {
           return;
       }

       content.innerHTML = `

           ${pageHeader(title, subtitle)}

           <section class="content-card">

               <div class="inventory-toolbar">

                   <div class="search-wrapper">

                       <label for="device-search">
                           Search devices
                       </label>

                       <input
                           type="search"
                           id="device-search"
                           placeholder="Search asset tag, model, serial number..."
                       >

                   </div>

                   <div>

                       <label for="type-filter">
                           Device Type
                       </label>

                       <select id="type-filter">

                           <option value="">
                               All Types
                           </option>

                           ${Object.entries(DEVICE_TYPE_LABELS)
                               .map(([value, label]) => `<option value="${value}">${label}</option>`)
                               .join("")}

                       </select>

                   </div>

                   <div>

                       <label for="status-filter">
                           Status
                       </label>

                       <select id="status-filter">

                           <option value="">
                               All Statuses
                           </option>

                           ${Object.entries(DEVICE_STATUS_LABELS)
                               .map(([value, label]) => `<option value="${value}">${label}</option>`)
                               .join("")}

                       </select>

                   </div>

                   <div>

                       <label for="center-filter">
                           Outreach Center
                       </label>

                       <select id="center-filter">

                           <option value="">
                               All Centers
                           </option>

                           ${centers
                               .map(center => `<option value="${center.centerId}">${escapeHTML(center.centerName)}</option>`)
                               .join("")}

                       </select>

                   </div>

                   <div class="toolbar-actions">

                       <button
                           class="secondary-button"
                           id="clear-filters"
                       >
                           Clear Filters
                       </button>

                       <button
                           class="primary-button"
                           data-action="add-device"
                       >
                           + Add Device
                       </button>

                   </div>

               </div>

           </section>

           <section class="content-card">

               <div class="card-header">

                   <h2>
                       Devices
                   </h2>

                   <span
                       id="inventory-count"
                       class="record-count"
                   >
                       ${devices.length} records
                   </span>

               </div>

               <div class="table-container">

                   <table id="inventory-table">

                       <thead>

                           <tr>
                               <th>Asset ID</th>
                               <th>Device Type</th>
                               <th>Manufacturer</th>
                               <th>Model</th>
                               <th>Serial Number</th>
                               <th>Status</th>
                               <th>Outreach Center</th>
                               <th>Actions</th>
                           </tr>

                       </thead>

                       <tbody id="inventory-body">

                           ${devices.map(inventoryRow).join("") || emptyInventoryRow()}

                       </tbody>

                   </table>

               </div>

           </section>
       `;

       setupPageActions();
       setupInventoryFilters(devices);
   }


   function emptyInventoryRow() {

       return `
           <tr>
               <td colspan="8">
                   <div class="empty-state">
                       <strong>
                           No devices found
                       </strong>
                       <p>
                           Try changing your search or filters.
                       </p>
                   </div>
               </td>
           </tr>
       `;
   }


   function inventoryRow(device) {

       return `
           <tr>

               <td>
                   <button
                       class="table-link"
                       data-action="device-details"
                       data-id="${device.deviceId}"
                   >
                       ${escapeHTML(device.assetTag)}
                   </button>
               </td>

               <td>
                   ${escapeHTML(device.typeLabel)}
               </td>

               <td>
                   ${escapeHTML(device.manufacturer)}
               </td>

               <td>
                   ${escapeHTML(device.model)}
               </td>

               <td>
                   ${escapeHTML(device.serialNumber)}
               </td>

               <td>
                   ${deviceStatusBadge(device.status)}
               </td>

               <td>
                   ${escapeHTML(device.centerName)}
               </td>

               <td>

                   <button
                       class="small-button"
                       data-action="device-details"
                       data-id="${device.deviceId}"
                   >
                       View
                   </button>

                   <button
                       class="small-button"
                       data-action="edit-device"
                       data-id="${device.deviceId}"
                   >
                       Edit
                   </button>

               </td>

           </tr>
       `;
   }


   function setupInventoryFilters(devices) {

       const search =
           document.getElementById("device-search");

       const type =
           document.getElementById("type-filter");

       const status =
           document.getElementById("status-filter");

       const center =
           document.getElementById("center-filter");

       const clear =
           document.getElementById("clear-filters");

       function filterDevices() {

           const searchValue =
               search.value.toLowerCase().trim();

           const filtered =
               devices.filter(device => {

                   const matchesSearch =
                       !searchValue ||
                       [device.assetTag, device.serialNumber, device.model, device.manufacturer]
                           .some(value => String(value || "").toLowerCase().includes(searchValue));

                   const matchesType =
                       !type.value ||
                       device.deviceType === type.value;

                   const matchesStatus =
                       !status.value ||
                       device.status === status.value;

                   const matchesCenter =
                       !center.value ||
                       String(device.centerId) === center.value;

                   return (
                       matchesSearch &&
                       matchesType &&
                       matchesStatus &&
                       matchesCenter
                   );
               });

           document.getElementById(
               "inventory-body"
           ).innerHTML =
               filtered.length
                   ? filtered.map(inventoryRow).join("")
                   : emptyInventoryRow();

           document.getElementById(
               "inventory-count"
           ).textContent =
               `${filtered.length} records`;

           setupPageActions(
               document.getElementById("inventory-body")
           );
       }

       search.addEventListener("input", filterDevices);
       type.addEventListener("change", filterDevices);
       status.addEventListener("change", filterDevices);
       center.addEventListener("change", filterDevices);

       clear.addEventListener(
           "click",
           () => {

               search.value = "";
               type.value = "";
               status.value = "";
               center.value = "";

               filterDevices();
           }
       );
   }


   /* =========================================================
      DEVICE DETAILS
      ========================================================= */

   async function loadDeviceWithCenters(id) {

       const [deviceResponse, centers] = await Promise.all([
           window.CTLApi.devices.get(id),
           fetchAllCenters()
       ]);

       const device = deviceResponse?.data;

       if (!device) {
           throw new Error("Device not found.");
       }

       state.centers = centers;

       return { device: toDeviceView(device, centers), centers };
   }


   async function renderDeviceDetails(id) {

       const content =
           document.getElementById("main-content");

       const title = "Device Details";
       const token = beginRender();

       showLoading(content, title, "", "Loading device from the server…");

       let device;

       try {
           ({ device } = await loadDeviceWithCenters(id));
       } catch (error) {
           if (isCurrentRender(token)) {
               showLoadError(content, title, "", error, () => renderDeviceDetails(id));
           }
           return;
       }

       if (!isCurrentRender(token)) {
           return;
       }

       content.innerHTML = `

           ${pageHeader(
               title,
               `Asset ${device.assetTag}`
           )}

           <section class="content-card">

               <div class="card-header">

                   <h2>
                       ${escapeHTML(`${device.manufacturer} ${device.model}`)}
                   </h2>

                   <div class="button-group">

                       <button
                           class="secondary-button"
                           data-action="inventory"
                       >
                           ← Back to Inventory
                       </button>

                       <button
                           class="primary-button"
                           data-action="edit-device"
                           data-id="${device.deviceId}"
                       >
                           Edit Device
                       </button>

                   </div>

               </div>

               <div class="details-grid">

                   ${detailItem("Asset Tag", escapeHTML(device.assetTag))}

                   ${detailItem("Serial Number", escapeHTML(device.serialNumber))}

                   ${detailItem("Device Type", escapeHTML(device.typeLabel))}

                   ${detailItem("Manufacturer", escapeHTML(device.manufacturer))}

                   ${detailItem("Model", escapeHTML(device.model))}

                   ${detailItem("Status", deviceStatusBadge(device.status))}

                   ${detailItem("Outreach Center", escapeHTML(device.centerName))}

                   ${detailItem("Device ID", escapeHTML(device.deviceId))}

               </div>

           </section>
       `;

       setupPageActions();
   }


   /* =========================================================
      ADD DEVICE
      ========================================================= */

   async function renderAddDevice() {

       const content =
           document.getElementById("main-content");

       const title = "Add New Device";
       const subtitle = "Create a new technology inventory record.";
       const token = beginRender();

       showLoading(content, title, subtitle, "Loading outreach centers from the server…");

       let centers;

       try {
           centers = await fetchAllCenters();
       } catch (error) {
           if (isCurrentRender(token)) {
               showLoadError(content, title, subtitle, error, renderAddDevice);
           }
           return;
       }

       if (!isCurrentRender(token)) {
           return;
       }

       state.centers = centers;

       content.innerHTML = `

           ${pageHeader(title, subtitle)}

           <section class="content-card">

               ${centers.length ? `
               <form
                   id="device-form"
                   class="device-form"
               >

                   ${deviceFormFields({}, centers, false)}

                   <div class="form-actions">

                       <button
                           type="button"
                           class="secondary-button"
                           data-action="inventory"
                       >
                           Cancel
                       </button>

                       <button
                           type="submit"
                           class="primary-button"
                       >
                           Save Device
                       </button>

                   </div>

               </form>
               ` : `
               <div class="empty-state">
                   <p>No outreach centers exist yet. Create a center before adding devices.</p>
               </div>
               `}

           </section>
       `;

       setupDeviceForm(null);
       setupPageActions();
   }


   function deviceFormFields(device, centers, isEdit) {

       return `

           <div class="form-grid">

               ${formInput(
                   "Asset Tag",
                   "assetTag",
                   device.assetTag || "",
                   true
               )}

               ${formInput(
                   "Serial Number",
                   "serialNumber",
                   device.serialNumber || "",
                   true
               )}

               <div class="form-group">

                   <label for="device-type">
                       Device Type
                   </label>

                   <select
                       id="device-type"
                       name="deviceType"
                       required
                   >

                       <option value="">
                           Select type
                       </option>

                       ${Object.entries(DEVICE_TYPE_LABELS)
                           .map(([value, label]) => labeledOption(value, label, device.deviceType))
                           .join("")}

                   </select>

               </div>

               ${formInput(
                   "Manufacturer",
                   "manufacturer",
                   device.manufacturer || "",
                   true
               )}

               ${formInput(
                   "Model",
                   "model",
                   device.model || "",
                   true
               )}

               <div class="form-group">

                   <label for="device-status">
                       Status
                   </label>

                   ${isEdit ? `
                   <p id="device-status">
                       ${deviceStatusBadge(device.status)}
                   </p>
                   <small>Status changes through Loans and Maintenance.</small>
                   ` : `
                   <select
                       id="device-status"
                       name="status"
                       required
                   >

                       ${Object.entries(DEVICE_STATUS_LABELS)
                           .map(([value, label]) => labeledOption(value, label, "AVAILABLE"))
                           .join("")}

                   </select>
                   `}

               </div>

               <div class="form-group">

                   <label for="device-center">
                       Outreach Center
                   </label>

                   <select
                       id="device-center"
                       name="centerId"
                       required
                   >

                       <option value="">
                           Select center
                       </option>

                       ${centers
                           .map(center => labeledOption(
                               String(center.centerId),
                               center.isActive
                                   ? center.centerName
                                   : `${center.centerName} (inactive)`,
                               device.centerId != null ? String(device.centerId) : ""
                           ))
                           .join("")}

                   </select>

               </div>

           </div>
       `;
   }


   function formInput(
       label,
       name,
       value = "",
       required = false,
       type = "text"
   ) {

       return `
           <div class="form-group">

               <label for="${name}">
                   ${escapeHTML(label)}
                   ${required ? "<span>*</span>" : ""}
               </label>

               <input
                   id="${name}"
                   name="${name}"
                   type="${type}"
                   value="${escapeAttribute(value)}"
                   ${required ? "required" : ""}
               >

           </div>
       `;
   }


   function labeledOption(value, label, selectedValue) {

       const selected =
           value === selectedValue
               ? "selected"
               : "";

       return `
           <option
               value="${escapeAttribute(value)}"
               ${selected}
           >
               ${escapeHTML(label)}
           </option>
       `;
   }


   // existingDevice === null  -> create (POST /v1/inventory)
   // existingDevice provided  -> edit   (PATCH /v1/inventory/:deviceId,
   //                                     only changed fields, never "status")
   function setupDeviceForm(existingDevice) {

       const form =
           document.getElementById("device-form");

       if (!form) {
           return;
       }

       form.addEventListener(
           "submit",
           async event => {

               event.preventDefault();

               const formData =
                   new FormData(form);

               const fields = {
                   assetTag: String(formData.get("assetTag") || "").trim(),
                   serialNumber: String(formData.get("serialNumber") || "").trim(),
                   deviceType: String(formData.get("deviceType") || ""),
                   manufacturer: String(formData.get("manufacturer") || "").trim(),
                   model: String(formData.get("model") || "").trim(),
                   centerId: Number(formData.get("centerId"))
               };

               if (!Number.isInteger(fields.centerId) || fields.centerId < 1) {
                   showToast("Select an outreach center.", "error");
                   return;
               }

               let payload = fields;

               if (existingDevice) {

                   payload = Object.fromEntries(
                       Object.entries(fields).filter(
                           ([key, value]) => value !== existingDevice[key]
                       )
                   );

                   if (!Object.keys(payload).length) {
                       showToast("No changes to save.", "info");
                       return;
                   }

               } else {

                   payload = {
                       ...fields,
                       status: String(formData.get("status") || "AVAILABLE")
                   };
               }

               const submitButton =
                   form.querySelector('button[type="submit"]');

               const originalButtonText =
                   submitButton ? submitButton.textContent : "Save";

               if (submitButton) {
                   submitButton.disabled = true;
                   submitButton.textContent = "Saving...";
               }

               try {

                   if (existingDevice) {

                       await window.CTLApi.devices.update(
                           existingDevice.deviceId,
                           payload
                       );

                       await renderDeviceDetails(existingDevice.deviceId);

                       showToast("Device updated successfully.", "success");

                   } else {

                       await window.CTLApi.devices.create(payload);

                       await renderInventory();

                       window.scrollTo({
                           top: 0,
                           behavior: "instant"
                       });

                       showToast(
                           "Device added successfully. It now appears in the inventory.",
                           "success"
                       );
                   }

               } catch (error) {

                   console.error("Unable to save device to the API.", error);

                   showToast(
                       `Device was not saved to the server. ${apiErrorMessage(error, "")}`,
                       "error"
                   );

               } finally {

                   if (submitButton && submitButton.isConnected) {
                       submitButton.disabled = false;
                       submitButton.textContent = originalButtonText;
                   }
               }
           }
       );
   }


   /* =========================================================
      EDIT DEVICE
      ========================================================= */

   async function renderEditDevice(id) {

       const content =
           document.getElementById("main-content");

       const title = "Edit Device";
       const token = beginRender();

       showLoading(content, title, "", "Loading device from the server…");

       let device;
       let centers;

       try {
           ({ device, centers } = await loadDeviceWithCenters(id));
       } catch (error) {
           if (isCurrentRender(token)) {
               showLoadError(content, title, "", error, () => renderEditDevice(id));
           }
           return;
       }

       if (!isCurrentRender(token)) {
           return;
       }

       content.innerHTML = `

           ${pageHeader(
               title,
               `Update ${device.assetTag}`
           )}

           <section class="content-card">

               <form
                   id="device-form"
                   class="device-form"
               >

                   ${deviceFormFields(device, centers, true)}

                   <div class="form-actions">

                       <button
                           type="button"
                           class="secondary-button"
                           data-action="device-details"
                           data-id="${device.deviceId}"
                       >
                           Cancel
                       </button>

                       <button
                           type="submit"
                           class="primary-button"
                       >
                           Save Changes
                       </button>

                   </div>

               </form>

           </section>
       `;

       setupDeviceForm(device);
       setupPageActions();
   }


   /* =========================================================
      OUTREACH CENTERS
      ========================================================= */

   async function renderCenters() {

       const content =
           document.getElementById("main-content");

       const title = "Outreach Centers";
       const subtitle = "Community locations participating in the technology loan program.";
       const token = beginRender();

       showLoading(content, title, subtitle, "Loading outreach centers from the server…");

       let devices;
       let centers;

       try {
           ({ devices, centers } = await loadInventoryData());
       } catch (error) {
           if (isCurrentRender(token)) {
               showLoadError(content, title, subtitle, error, renderCenters);
           }
           return;
       }

       if (!isCurrentRender(token)) {
           return;
       }

       content.innerHTML = `

           ${pageHeader(title, subtitle)}

           <section class="center-grid">

               ${centers
                   .map(center => {

                       const deviceCount =
                           devices.filter(
                               d => d.centerId === center.centerId
                           ).length;

                       return `

                           <div class="center-card">

                               <div class="center-card-header">

                                   <h2>
                                       ${escapeHTML(center.centerName)}
                                   </h2>

                                   ${centerStatusBadge(center.isActive)}

                               </div>

                               <p>
                                   ${escapeHTML(center.address)}
                               </p>

                               <p>
                                   ${escapeHTML(center.phone)}
                               </p>

                               <div class="center-stat">

                                   <strong>
                                       ${deviceCount}
                                   </strong>

                                   <span>
                                       Devices
                                   </span>

                               </div>

                               <button
                                   class="secondary-button"
                                   data-action="center-details"
                                   data-id="${center.centerId}"
                               >
                                   View Center
                               </button>

                           </div>
                       `;
                   })
                   .join("") || `<div class="content-card"><p>No outreach centers returned by the API.</p></div>`}

           </section>
       `;

       setupPageActions();
   }


   async function renderCenterDetails(id) {

       const content =
           document.getElementById("main-content");

       const title = "Outreach Center";
       const token = beginRender();

       showLoading(content, title, "", "Loading outreach center from the server…");

       let devices;
       let centers;

       try {
           ({ devices, centers } = await loadInventoryData());
       } catch (error) {
           if (isCurrentRender(token)) {
               showLoadError(content, title, "", error, () => renderCenterDetails(id));
           }
           return;
       }

       if (!isCurrentRender(token)) {
           return;
       }

       const center =
           centers.find(
               c => String(c.centerId) === String(id)
           );

       if (!center) {
           showLoadError(content, title, "", new Error("Center not found."), renderCenters);
           return;
       }

       const centerDevices =
           devices.filter(
               device => device.centerId === center.centerId
           );

       content.innerHTML = `

           ${pageHeader(
               center.centerName,
               "Outreach center information and assigned devices."
           )}

           <section class="content-card">

               <div class="card-header">

                   <h2>
                       Center Information
                   </h2>

                   <button
                       class="secondary-button"
                       data-action="centers"
                   >
                       ← Back
                   </button>

               </div>

               <div class="details-grid">

                   ${detailItem("Center Name", escapeHTML(center.centerName))}

                   ${detailItem("Address", escapeHTML(center.address))}

                   ${detailItem("Phone", escapeHTML(center.phone))}

                   ${detailItem("Status", centerStatusBadge(center.isActive))}

               </div>

           </section>

           <section class="content-card">

               <div class="card-header">

                   <h2>
                       Associated Devices
                   </h2>

                   <span class="record-count">
                       ${centerDevices.length} records
                   </span>

               </div>

               <div class="table-container">

                   <table>

                       <thead>
                           <tr>
                               <th>Asset Tag</th>
                               <th>Type</th>
                               <th>Model</th>
                               <th>Status</th>
                           </tr>
                       </thead>

                       <tbody>

                           ${
                               centerDevices.length
                                   ? centerDevices
                                       .map(device => `
                                           <tr>
                                               <td>
                                                   <button
                                                       class="table-link"
                                                       data-action="device-details"
                                                       data-id="${device.deviceId}"
                                                   >
                                                       ${escapeHTML(device.assetTag)}
                                                   </button>
                                               </td>
                                               <td>
                                                   ${escapeHTML(device.typeLabel)}
                                               </td>
                                               <td>
                                                   ${escapeHTML(device.model)}
                                               </td>
                                               <td>
                                                   ${deviceStatusBadge(device.status)}
                                               </td>
                                           </tr>
                                       `)
                                       .join("")
                                   : `
                                       <tr>
                                           <td colspan="4">
                                               No devices assigned to this center.
                                           </td>
                                       </tr>
                                   `
                           }

                       </tbody>

                   </table>

               </div>

           </section>
       `;

       setupPageActions();
   }

   /* =========================================================
      LOANS
      ========================================================= */
   
   async function renderLoans() {
       const content = document.getElementById("main-content");
       content.innerHTML = `${pageHeader("Loan Management", "Track technology loans and expected returns.")}<section class="content-card"><div class="empty-state">Loading loans from the API…</div></section>`;
       try {
           const [rows, devices, centers, reasonResult] = await Promise.all([
               fetchAllPages(params => window.CTLApi.loans.list(params)), fetchAllDevices(),
               fetchAllCenters(), window.CTLApi.loanReasons.list()
           ]);
           const reasons = responseRows(reasonResult);
           const availableDevices = devices.filter(device => device.status === "AVAILABLE");
           const loans = rows.map(loan => {
               const device = devices.find(item => item.deviceId === loan.deviceId) || {};
               const center = centers.find(item => item.centerId === loan.centerId) || {};
               const reason = reasons.find(item => item.reasonId === loan.reasonId) || {};
               return { ...loan, deviceName: `${device.manufacturer || "Device"} ${device.model || ""}`.trim(), assetTag: device.assetTag || `Device #${loan.deviceId}`, centerName: center.centerName || `Center #${loan.centerId}`, reasonName: reason.reasonName || "—" };
           });
           state.currentLoans = loans;
           content.innerHTML = `${pageHeader("Loan Management", "Create loans, review active records, and record returns.")}
               <section class="content-card"><div class="card-header"><h2>Check Out a Device</h2></div>
               ${availableDevices.length && centers.length && reasons.length ? `<form id="loan-create-form" class="form-grid">
                   <label>Available Device<select name="deviceId" required>${availableDevices.map(device => `<option value="${device.deviceId}">${escapeHTML(device.assetTag)} — ${escapeHTML(device.model)}</option>`).join("")}</select></label>
                   <label>Outreach Center<select name="centerId" required>${centers.filter(center => center.isActive).map(center => `<option value="${center.centerId}">${escapeHTML(center.centerName)}</option>`).join("")}</select></label>
                   <label>Loan Reason<select name="reasonId" required>${reasons.map(reason => `<option value="${reason.reasonId}">${escapeHTML(reason.reasonName)}</option>`).join("")}</select></label>
                   <label>Borrower / Participant Code<input name="participantCode" maxlength="50" required placeholder="e.g. PART-1004"></label>
                   <label>Checkout Date<input type="datetime-local" name="checkoutDate" required value="${toDateTimeLocal(new Date())}"></label>
                   <label>Expected Return<input type="datetime-local" name="dueDate" required value="${toDateTimeLocal(new Date(Date.now() + 14 * 86400000))}"></label>
                   <div class="full-width form-actions"><button class="primary-button" type="submit">Create Loan</button></div>
               </form>` : `<div class="empty-state"><p>No available devices, active centers, or loan reasons are available for a new loan.</p></div>`}</section>
               <section class="content-card"><div class="card-header"><h2>Loan Records</h2><span class="record-count">${loans.length} records</span></div><div class="table-container"><table><thead><tr><th>Device</th><th>Asset Tag</th><th>Borrower</th><th>Outreach Center</th><th>Reason</th><th>Status</th><th>Checkout</th><th>Due</th><th>Actions</th></tr></thead><tbody>
               ${loans.map(loan => `<tr><td>${escapeHTML(loan.deviceName)}</td><td>${escapeHTML(loan.assetTag)}</td><td>${escapeHTML(loan.participantCode)}</td><td>${escapeHTML(loan.centerName)}</td><td>${escapeHTML(loan.reasonName)}</td><td>${loanStatusBadge(apiLoanStatus(loan.loanStatus))}</td><td>${escapeHTML(formatDate(loan.checkoutDate))}</td><td>${escapeHTML(formatDate(loan.dueDate))}</td><td>${loan.loanStatus === "RETURNED" ? "Returned" : `<button class="small-button" data-action="return-loan" data-id="${loan.loanId}">Record Return</button>`}</td></tr>`).join("") || `<tr><td colspan="9">No loan records returned by the API.</td></tr>`}
               </tbody></table></div></section>`;
           setupPageActions();
           const form = document.getElementById("loan-create-form");
           if (form) form.addEventListener("submit", handleCreateLoan);
       } catch (error) {
           content.innerHTML = `${pageHeader("Loan Management", "Track technology loans and expected returns.")}<section class="content-card"><div class="empty-state"><h2>Could not load loans</h2><p>${escapeHTML(error.message || "Check that the local API is running.")}</p><button class="primary-button" data-action="reload-loans">Try Again</button></div></section>`;
           setupPageActions();
       }
   }
   
   
   /* =========================================================
      USERS
      ========================================================= */
   
   function renderUsers() {
   
       if (state.currentUser?.role !== "ADMIN") {
   
           renderUnauthorized();
   
           return;
       }
   
       const content =
           document.getElementById("main-content");
   
       content.innerHTML = `
   
           ${pageHeader("User Management", "Manage the demo user directory for this browser.")}

           <section class="content-card"><p class="settings-note">The backend repository does not provide user or authentication routes. These directory entries are stored in this browser only and do not provision login accounts.</p></section>

           ${state.userFormId !== null ? renderUserForm() : ""}
   
           <section class="content-card">
   
               <div class="card-header">
   
                   <h2>
                       System Users
                   </h2>
   
                   <button
                       class="primary-button"
                       data-action="add-user"
                   >
                       + Add User
                   </button>
   
               </div>
   
               <div class="table-container">
   
                   <table>
   
                       <thead>
   
                           <tr>
                               <th>Name</th>
                               <th>Email</th>
                               <th>Role</th>
                               <th>Status</th>
                               <th>Last Login</th>
                               <th>Actions</th>
                           </tr>
   
                       </thead>
   
                       <tbody>
   
                           ${state.users
                               .map(user => `
   
                                   <tr>
   
                                       <td>
                                           ${escapeHTML(
                                               user.name
                                           )}
                                       </td>
   
                                       <td>
                                           ${escapeHTML(
                                               user.email
                                           )}
                                       </td>
   
                                       <td>
                                           <span class="role-badge">
                                               ${escapeHTML(
                                                   user.role
                                               )}
                                           </span>
                                       </td>
   
                                       <td>
                                           ${user.status === "Active"
                                               ? statusBadge(
                                                   "Available",
                                                   "Active"
                                               )
                                               : statusBadge(
                                                   "Retired",
                                                   "Inactive"
                                               )}
                                       </td>
   
                                       <td>
                                           ${escapeHTML(
                                               user.lastLogin
                                           )}
                                       </td>
   
                                       <td>
   
                                           <button
                                               class="small-button"
                                               data-action="edit-user"
                                               data-id="${user.id}"
                                           >
                                               Edit
                                           </button>
   
                                       </td>
   
                                   </tr>
   
                               `)
                               .join("")}
   
                       </tbody>
   
                   </table>
   
               </div>
   
           </section>
       `;
   
       setupPageActions();
       const form = document.getElementById("user-editor-form");
       if (form) form.addEventListener("submit", saveUserForm);
   }

   function renderUserForm() {
       const user = state.users.find(item => String(item.id) === String(state.userFormId));
       const editing = Boolean(user);
       return `<section class="content-card"><div class="card-header"><h2>${editing ? "Edit User" : "Add User"}</h2></div><form id="user-editor-form" class="form-grid">
           <label class="full-width">Full Name<input name="name" required maxlength="100" value="${escapeAttribute(user?.name || "")}"></label>
           <label>Email<input name="email" type="email" required maxlength="160" value="${escapeAttribute(user?.email || "")}" ${editing ? "readonly" : ""}></label>
           <label>Role<select name="role"><option value="STAFF" ${user?.role === "STAFF" ? "selected" : ""}>Staff</option><option value="ADMIN" ${user?.role === "ADMIN" ? "selected" : ""}>Admin</option></select></label>
           <label>Status<select name="status"><option ${user?.status !== "Inactive" ? "selected" : ""}>Active</option><option ${user?.status === "Inactive" ? "selected" : ""}>Inactive</option></select></label>
           <div class="full-width form-actions"><button type="button" class="secondary-button" data-action="cancel-user-edit">Cancel</button><button type="submit" class="primary-button">Save User</button></div>
       </form></section>`;
   }
   
   
   /* =========================================================
      SETTINGS
      ========================================================= */
   
   async function renderSettings() {
   
       if (state.currentUser?.role !== "ADMIN") {
   
           renderUnauthorized();
   
           return;
       }
   
       const content =
           document.getElementById("main-content");
   
       content.innerHTML = `${pageHeader("System Settings", "Configure outreach centers and loan reasons available through the API.")}<section class="content-card"><div class="empty-state">Loading settings from the API…</div></section>`;
       try {
       const [centers, reasonResult] = await Promise.all([fetchAllCenters(), window.CTLApi.loanReasons.list()]);
       const reasons = responseRows(reasonResult);
       content.innerHTML = `
   
           ${pageHeader(
               "System Settings",
               "Administrative configuration for the technology loan system."
           )}
   
           <section class="content-card"><div class="card-header"><h2>Outreach Centers</h2></div><div class="table-container"><table><thead><tr><th>Name</th><th>Address</th><th>Phone</th><th>Status</th><th>Action</th></tr></thead><tbody>
           ${centers.map(center => `<tr><td>${escapeHTML(center.centerName)}</td><td>${escapeHTML(center.address)}</td><td>${escapeHTML(center.phone)}</td><td>${center.isActive ? "Active" : "Inactive"}</td><td><button class="small-button" data-action="edit-center" data-id="${center.centerId}">Edit</button></td></tr>`).join("") || `<tr><td colspan="5">No centers found.</td></tr>`}
           </tbody></table></div>${state.settingsForm?.kind === "center" ? renderCenterForm(centers.find(center => String(center.centerId) === String(state.settingsForm.id))) : ""}</section>

           <section class="content-card"><div class="card-header"><h2>Loan Reasons</h2><button class="primary-button" data-action="add-loan-reason">+ Add Reason</button></div>
           ${state.settingsForm?.kind === "reason" ? renderReasonForm() : ""}
           <div class="table-container"><table><thead><tr><th>Reason</th><th>Action</th></tr></thead><tbody>${reasons.map(reason => `<tr><td>${escapeHTML(reason.reasonName)}</td><td><button class="small-button" data-action="edit-loan-reason" data-id="${reason.reasonId}">Rename</button></td></tr>`).join("") || `<tr><td colspan="2">No reasons found.</td></tr>`}</tbody></table></div></section>

           <section class="settings-grid">
   
               <div class="settings-card">
   
                   <h2>
                       User Roles
                   </h2>
   
                   <p>
                       Configure role-based access for Staff
                       and Admin users. User accounts are demo-only until an authentication API is available.
                   </p>
   
                   <button
                       class="secondary-button"
                       data-action="users"
                   >
                       Manage Users
                   </button>
   
               </div>
   
               <div class="settings-card">
   
                   <h2>
                       Inventory Settings
                   </h2>
   
                   <p>Device types supported by the API: Laptop, Tablet, and Hotspot. The backend does not expose editable device-type settings.</p>
   
                   <span class="settings-readonly">Read-only API options</span>
   
               </div>
   
               <div class="settings-card">
   
                   <h2>
                       Status Options
                   </h2>
   
                   <p>Device lifecycle status is controlled by loan and maintenance operations. Status changes cannot be manually edited here.</p>
   
                   <span class="settings-readonly">Changed through Loans and Maintenance</span>
   
               </div>
   
               <div class="settings-card">
   
                   <h2>
                       System Preferences
                   </h2>
   
                   <p>Use the center and loan-reason controls above to manage values supported by the API.</p>
   
                   <span class="settings-readonly">Manage centers and reasons above</span>
   
               </div>
   
           </section>
       `;
   
       setupPageActions();
       content.querySelectorAll("form[data-settings-form]").forEach(form => form.addEventListener("submit", handleSettingsForm));
       } catch (error) {
           content.innerHTML = `${pageHeader("System Settings", "Configure administrative options.")}<section class="content-card"><div class="empty-state"><h2>Could not load API settings</h2><p>${escapeHTML(error.message || "Check that the local API is running.")}</p><button class="primary-button" data-action="reload-settings">Try Again</button></div></section>`;
           setupPageActions();
       }
   }

   function renderReasonForm() {
       const editing = state.settingsForm?.id != null;
       return `<form data-settings-form="reason" class="form-grid"><label class="full-width">${editing ? "Rename Reason" : "New Reason"}<input name="reasonName" required maxlength="100" value="${escapeAttribute(state.settingsForm?.name || "")}"></label><input type="hidden" name="reasonId" value="${escapeAttribute(state.settingsForm?.id || "")}"><div class="full-width form-actions"><button type="button" class="secondary-button" data-action="cancel-settings-form">Cancel</button><button class="primary-button" type="submit">Save Reason</button></div></form>`;
   }

   function renderCenterForm(center) {
       if (!center) return "";
       state.settingsForm = { kind: "center", id: center.centerId };
       return `<form data-settings-form="center" class="form-grid"><label>Name<input name="centerName" required maxlength="100" value="${escapeAttribute(center.centerName)}"></label><label>Phone<input name="phone" required maxlength="20" value="${escapeAttribute(center.phone)}"></label><label class="full-width">Address<input name="address" required maxlength="255" value="${escapeAttribute(center.address)}"></label><label class="full-width"><input type="checkbox" name="isActive" ${center.isActive ? "checked" : ""}> Center is active</label><input type="hidden" name="centerId" value="${center.centerId}"><div class="full-width form-actions"><button type="button" class="secondary-button" data-action="cancel-settings-form">Cancel</button><button class="primary-button" type="submit">Save Center</button></div></form>`;
   }

   async function handleCreateLoan(event) {
       event.preventDefault();
       const form = event.currentTarget;
       const data = new FormData(form);
       const submit = form.querySelector('button[type="submit"]');
       submit.disabled = true;
       submit.textContent = "Saving…";
       try {
           const payload = {
               deviceId: Number(data.get("deviceId")),
               centerId: Number(data.get("centerId")),
               reasonId: Number(data.get("reasonId")),
               participantCode: String(data.get("participantCode")).trim(),
               checkoutDate: new Date(data.get("checkoutDate")).toISOString(),
               dueDate: new Date(data.get("dueDate")).toISOString()
           };
           const response = await window.CTLApi.loans.create(payload);
           const createdLoan = response?.data || response;
           state.lastCreatedLoanId = createdLoan?.loanId;
           showToast("Loan created successfully.", "success");
           await renderLoans();
       } catch (error) {
           submit.disabled = false;
           submit.textContent = "Create Loan";
           showToast(error.message || "Could not create the loan.", "error");
       }
   }

   async function handleSettingsForm(event) {
       event.preventDefault();
       const form = event.currentTarget;
       const fields = new FormData(form);
       const kind = form.dataset.settingsForm;
       const submit = form.querySelector('button[type="submit"]');
       submit.disabled = true;
       try {
           if (kind === "center") {
               const id = Number(fields.get("centerId"));
               await window.CTLApi.centers.update(id, {
                   centerName: String(fields.get("centerName")).trim(),
                   address: String(fields.get("address")).trim(),
                   phone: String(fields.get("phone")).trim(),
                   isActive: fields.get("isActive") === "on"
               });
               showToast("Outreach center updated.", "success");
           } else {
               const reasonId = String(fields.get("reasonId") || "").trim();
               const payload = { reasonName: String(fields.get("reasonName")).trim() };
               if (reasonId) await window.CTLApi.loanReasons.update(Number(reasonId), payload);
               else await window.CTLApi.loanReasons.create(payload);
               showToast(reasonId ? "Loan reason renamed." : "Loan reason added.", "success");
           }
           state.settingsForm = null;
           await renderSettings();
       } catch (error) {
           submit.disabled = false;
           showToast(error.message || "Could not save this setting.", "error");
       }
   }

   function saveUserForm(event) {
       event.preventDefault();
       const fields = new FormData(event.currentTarget);
       const email = String(fields.get("email")).trim().toLowerCase();
       const name = String(fields.get("name")).trim();
       const role = String(fields.get("role"));
       const status = String(fields.get("status"));
       const existing = state.users.find(user => String(user.id) === String(state.userFormId));
       if (!existing && state.users.some(user => user.email.toLowerCase() === email)) {
           showToast("A user with that email already exists.", "error");
           return;
       }
       if (existing && email === state.currentUser?.email?.toLowerCase() && (role !== "ADMIN" || status !== "Active")) {
           showToast("You cannot remove admin access or deactivate the account currently in use.", "error");
           return;
       }
       if (existing) Object.assign(existing, { name, role, status });
       else state.users.push({ id: Date.now(), name, email, role, status, lastLogin: "Never" });
       saveUsers();
       state.userFormId = null;
       showToast("Demo user directory saved in this browser.", "success");
       renderUsers();
   }

   function responseRows(response) {
       if (Array.isArray(response?.data)) return response.data;
       if (Array.isArray(response?.data?.items)) return response.data.items;
       if (Array.isArray(response)) return response;
       return [];
   }

   function apiLoanStatus(status) {
       return ({ ACTIVE: "Active", OVERDUE: "Overdue", RETURNED: "Returned" })[status] || status || "Unknown";
   }

   function formatDate(value) {
       if (!value) return "—";
       const date = new Date(value);
       return Number.isNaN(date.valueOf()) ? String(value) : date.toLocaleString();
   }

   function toDateTimeLocal(date) {
       const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
       return local.toISOString().slice(0, 16);
   }
   
   
   /* =========================================================
      UNAUTHORIZED
      ========================================================= */
   
   function renderUnauthorized() {
   
       const content =
           document.getElementById("main-content");
   
       content.innerHTML = `
   
           ${pageHeader(
               "Unauthorized Access",
               "You do not have permission to access this section."
           )}
   
           <section class="content-card">
   
               <div class="empty-state">
   
                   <h2>
                       Access Restricted
                   </h2>
   
                   <p>
                       This area is available only to
                       authorized administrators.
                   </p>
   
                   <button
                       class="primary-button"
                       data-action="dashboard"
                   >
                       Return to Dashboard
                   </button>
   
               </div>
   
           </section>
       `;
   
       setupPageActions();
   }
   
   
   /* =========================================================
      PAGE ACTIONS
      ========================================================= */
   
   function setupPageActions(root = document) {

       root
           .querySelectorAll("[data-action]")
           .forEach(element => {
   
               element.addEventListener(
                   "click",
                   event => {
   
                       event.preventDefault();
   
                       const action =
                           element.dataset.action;
   
                       const id =
                           element.dataset.id;
   
                       handleAction(
                           action,
                           id
                       );
                   }
               );
           });
   }
   
   
   async function handleAction(action, id) {
   
       switch (action) {
   
           case "dashboard":
               navigateTo("Dashboard");
               break;
   
           case "inventory":
               navigateTo("Device Inventory");
               break;

           case "centers":
               navigateTo("Outreach Centers");
               break;
   
           case "loans":
               navigateTo("Loans");
               break;
   
           case "users":
               navigateTo("Users");
               break;
   
           case "settings":
               navigateTo("Settings");
               break;
   
           case "add-device":
               renderAddDevice();
               break;
   
           case "device-details":
               renderDeviceDetails(id);
               break;
   
           case "edit-device":
               renderEditDevice(id);
               break;
   
           case "center-details":
               renderCenterDetails(id);
               break;
   
           case "add-user":
               state.userFormId = "new";
               renderUsers();
               break;
   
           case "edit-user":
               state.userFormId = id;
               renderUsers();
               break;
   
           case "cancel-user-edit":
               state.userFormId = null;
               renderUsers();
               break;

           case "return-loan":
               if (window.confirm("Record this device as returned?")) {
                   try {
                       // The API sets the device back to AVAILABLE itself.
                       await window.CTLApi.loans.returnDevice(id, { returnDate: new Date().toISOString() });
                       showToast("Device return recorded.", "success");
                       await renderLoans();
                   } catch (error) {
                       showToast(error.message || "Could not record the return.", "error");
                   }
               }
               break;

           case "reload-loans":
               await renderLoans();
               break;

           case "reload-settings":
               await renderSettings();
               break;

           case "add-loan-reason":
               state.settingsForm = { kind: "reason", id: null, name: "" };
               await renderSettings();
               break;

           case "edit-loan-reason": {
               try {
                   const reasons = responseRows(await window.CTLApi.loanReasons.list());
                   const reason = reasons.find(item => String(item.reasonId) === String(id));
                   if (!reason) {
                       showToast("Loan reason not found. Reload the page and try again.", "error");
                       break;
                   }
                   state.settingsForm = { kind: "reason", id: reason.reasonId, name: reason.reasonName };
                   await renderSettings();
               } catch (error) {
                   console.error("Unable to open the loan reason editor.", error);
                   showToast(`Could not load this loan reason. ${apiErrorMessage(error, "")}`, "error");
               }
               break;
           }

           case "edit-center": {
               try {
                   const centers = await fetchAllCenters();
                   const center = centers.find(item => String(item.centerId) === String(id));
                   if (!center) {
                       showToast("Outreach center not found. Reload the page and try again.", "error");
                       break;
                   }
                   state.settingsForm = { kind: "center", id: center.centerId };
                   await renderSettings();
               } catch (error) {
                   console.error("Unable to open the center editor.", error);
                   showToast(`Could not load this outreach center. ${apiErrorMessage(error, "")}`, "error");
               }
               break;
           }

           case "retry-render":
               if (typeof state.retryRender === "function") {
                   await state.retryRender();
               }
               break;

           case "cancel-settings-form":
               state.settingsForm = null;
               await renderSettings();
               break;
   
           case "settings-message":
               showToast("This setting is read-only: the backend does not expose a route to change it.", "info");
               break;
   
           default:
               console.log(
                   "Unhandled action:",
                   action
               );
       }
   }
   
   
   /* =========================================================
      HELPERS
      ========================================================= */
   
   function deviceRow(device) {
   
       return `
           <tr>
   
               <td>
                   <button
                       class="table-link"
                       data-action="device-details"
                       data-id="${device.deviceId}"
                   >
                       ${escapeHTML(device.assetTag)}
                   </button>
               </td>

               <td>
                   ${escapeHTML(device.typeLabel)}
               </td>

               <td>
                   ${escapeHTML(device.model)}
               </td>

               <td>
                   ${deviceStatusBadge(device.status)}
               </td>

               <td>
                   ${escapeHTML(device.centerName)}
               </td>
   
           </tr>
       `;
   }
   
   
   function statusBadge(status, customText = null) {
   
       const className =
           status.toLowerCase();
   
       return `
           <span
               class="status ${escapeAttribute(className)}"
           >
               ${escapeHTML(
                   customText || status
               )}
           </span>
       `;
   }
   
   
   function loanStatusBadge(status) {
   
       let className = "available";
   
       if (status === "Active") {
           className = "assigned";
       }
   
       if (status === "Pending") {
           className = "maintenance";
       }

       if (status === "Overdue") {
           className = "maintenance";
       }
   
       if (status === "Returned") {
           className = "available";
       }
   
       return `
           <span class="status ${className}">
               ${escapeHTML(status)}
           </span>
       `;
   }
   
   
   function detailItem(label, value) {
   
       return `
           <div class="detail-item">
   
               <span>
                   ${escapeHTML(label)}
               </span>
   
               <strong>
                   ${value}
               </strong>
   
           </div>
       `;
   }
   
   
   /* =========================================================
      LOCAL STORAGE
      ========================================================= */
   
   // Devices used to be cached in localStorage ("ctl_devices"). They now
   // always come from the API, so drop any stale copy left by older builds.
   function clearLegacyDeviceCache() {
       try {
           localStorage.removeItem("ctl_devices");
       } catch (error) {
           // Storage unavailable (private mode, blocked); nothing to clear.
       }
   }

   function saveUsers() {
       localStorage.setItem("ctl_users", JSON.stringify(state.users));
   }

   function loadUsers() {
       try {
           const saved = localStorage.getItem("ctl_users");
           if (saved) state.users = JSON.parse(saved);
       } catch (error) {
           console.error("Unable to load saved demo users.");
       }
   }
   
   
   /* =========================================================
      TOAST NOTIFICATIONS
      ========================================================= */
   
   function showToast(
       message,
       type = "info"
   ) {
   
       let container =
           document.getElementById(
               "toast-container"
           );
   
       if (!container) {
   
           container =
               document.createElement("div");
   
           container.id =
               "toast-container";
   
           container.className =
               "toast-container";

           container.setAttribute(
               "aria-live",
               "polite"
           );

           container.setAttribute(
               "aria-atomic",
               "true"
           );
   
           document.body.appendChild(
               container
           );
       }
   
       const toast =
           document.createElement("div");
   
       toast.className =
           `toast toast-${type}`;

       toast.setAttribute(
           "role",
           "status"
       );
   
       toast.textContent =
           message;
   
       container.appendChild(
           toast
       );
   
       setTimeout(
           () => {
   
               toast.classList.add(
                   "toast-hide"
               );
   
               setTimeout(
                   () =>
                       toast.remove(),
                   300
               );
   
           },
           6000
       );
   }
   
   
   /* =========================================================
      SECURITY / HTML ESCAPING
      ========================================================= */
   
   function escapeHTML(value) {
   
       return String(value ?? "")
           .replaceAll("&", "&amp;")
           .replaceAll("<", "&lt;")
           .replaceAll(">", "&gt;")
           .replaceAll('"', "&quot;")
           .replaceAll("'", "&#039;");
   }
   
   
   function escapeAttribute(value) {
   
       return escapeHTML(value);
   }
   
   
   /* =========================================================
      INITIAL DATA LOAD
      ========================================================= */
   
   clearLegacyDeviceCache();
   loadUsers();
   
   console.log(
       "Community Technology Loan application ready."
   );
