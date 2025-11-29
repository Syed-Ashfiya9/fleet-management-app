/* script.js
   - localStorage key: "fleetData"
   - sessionStorage "fleetAppLoggedIn" contains login state
*/

(function () {
  // Protect admin page: redirect to login if not logged in
  if (location.pathname.endsWith('admin.html')) {
    if (sessionStorage.getItem('fleetAppLoggedIn') !== 'true') {
      // not logged in
      window.location.href = 'index.html';
    }
  }

  // ---------- helpers ----------
  const STORAGE_KEY = 'fleetData';

  function readFleets() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch (e) { return []; }
  }

  function writeFleets(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }

  function uid() {
    return 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2,8);
  }

  function createCardHtml(f) {
    // using placeholder image for vehicles
    const img = 'https://via.placeholder.com/400x240?text=Vehicle';
    return `
      <div class="card" data-id="${f.id}">
        <img class="fleet-img" src="${img}" alt="vehicle image">
        <h3>${escapeHtml(f.regNo)}</h3>
        <div class="meta">
          <div>Category: ${escapeHtml(f.category)}</div>
          <div>Driver: <span class="driver-name">${escapeHtml(f.driverName)}</span></div>
          <div>Availability: <strong class="avail-text">${f.isAvailable ? 'Available' : 'Unavailable'}</strong></div>
        </div>
        <div class="btn-row">
          <button class="btn small update-driver">Update Driver</button>
          <button class="btn small toggle-availability">${f.isAvailable ? 'Make Unavailable' : 'Make Available'}</button>
          <button class="btn small danger delete-vehicle">Delete Vehicle</button>
        </div>
      </div>
    `;
  }

  function escapeHtml(s) {
    if (!s) return '';
    return s.replace(/[&<>"']/g, function (m) {
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[m];
    });
  }

  // ---------- admin page logic ----------
  if (document.getElementById('fleetForm')) {
    const form = document.getElementById('fleetForm');
    const regNoInp = document.getElementById('regNo');
    const categorySel = document.getElementById('category');
    const driverInp = document.getElementById('driverName');
    const availChk = document.getElementById('isAvailable');
    const cardsContainer = document.getElementById('cardsContainer');

    const filterCategory = document.getElementById('filterCategory');
    const filterAvailability = document.getElementById('filterAvailability');
    const clearFiltersBtn = document.getElementById('clearFilters');
    const logoutBtn = document.getElementById('logoutBtn');

    // initial render
    renderAll();

    // Add fleet
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const regNo = regNoInp.value.trim();
      const category = categorySel.value;
      const driverName = driverInp.value.trim();
      const isAvailable = !!availChk.checked;

      // validation
      if (!regNo) { alert('Reg No is required'); return; }
      if (!category) { alert('Category is required'); return; }
      if (!driverName) { alert('Driver Name is required'); return; }

      const fleets = readFleets();
      const newFleet = {
        id: uid(),
        regNo, category, driverName, isAvailable
      };
      fleets.push(newFleet);
      writeFleets(fleets);

      // clear form
      form.reset();
      renderAll();
    });

    // Delegated click handlers for card actions
    cardsContainer.addEventListener('click', function (e) {
      const card = e.target.closest('.card');
      if (!card) return;
      const id = card.getAttribute('data-id');
      if (e.target.classList.contains('update-driver')) {
        // prompt
        const current = card.querySelector('.driver-name').textContent;
        const newName = prompt('Enter new driver name:', current);
        if (newName === null) return; // cancelled
        if (newName.trim() === '') {
          alert('Driver name cannot be empty.');
          return;
        }
        updateDriver(id, newName.trim());
      } else if (e.target.classList.contains('toggle-availability')) {
        toggleAvailability(id);
      } else if (e.target.classList.contains('delete-vehicle')) {
        const ok = confirm('Are you sure you want to delete this vehicle?');
        if (!ok) return;
        deleteVehicle(id);
      }
    });

    // Filters change
    filterCategory.addEventListener('change', renderAll);
    filterAvailability.addEventListener('change', renderAll);
    clearFiltersBtn.addEventListener('click', function () {
      filterCategory.value = 'All';
      filterAvailability.value = 'All';
      renderAll();
    });

    // Logout
    logoutBtn.addEventListener('click', function () {
      sessionStorage.removeItem('fleetAppLoggedIn');
      window.location.href = 'index.html';
    });

    // functions
    function renderAll() {
      const fleets = readFleets();
      // apply filters
      const cat = filterCategory ? filterCategory.value : 'All';
      const avail = filterAvailability ? filterAvailability.value : 'All';
      let filtered = fleets.slice();

      if (cat && cat !== 'All') {
        filtered = filtered.filter(f => f.category === cat);
      }
      if (avail && avail !== 'All') {
        filtered = filtered.filter(f => (avail === 'Available') === !!f.isAvailable);
      }

      // render grid
      if (filtered.length === 0) {
        cardsContainer.innerHTML = <div class="card"><p style="color:var(--muted)">No vehicles added yet.</p></div>;
        return;
      }

      cardsContainer.innerHTML = filtered.map(createCardHtml).join('');
    }

    function updateDriver(id, newName) {
      const fleets = readFleets();
      const idx = fleets.findIndex(f => f.id === id);
      if (idx === -1) return;
      fleets[idx].driverName = newName;
      writeFleets(fleets);
      renderAll();
    }

    function toggleAvailability(id) {
      const fleets = readFleets();
      const idx = fleets.findIndex(f => f.id === id);
      if (idx === -1) return;
      fleets[idx].isAvailable = !fleets[idx].isAvailable;
      writeFleets(fleets);
      renderAll();
    }

    function deleteVehicle(id) {
      let fleets = readFleets();
      fleets = fleets.filter(f => f.id !== id);
      writeFleets(fleets);
      renderAll();
    }
  }

  // Polyfill: If script loaded on index.html no admin logic runs.

})();