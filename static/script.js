document.getElementById("create-btn").addEventListener("click", () => {
  const checkboxes = document.querySelectorAll("input[name='player']:checked");
  const players = Array.from(checkboxes).map(cb => ({
    name: cb.value,
    handicap: parseInt(cb.dataset.handicap)
  }));

  const numTeams = parseInt(document.getElementById("num-teams").value);

  fetch("/create-teams", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({players, numTeams})
  })
  .then(res => res.json())
  .then(data => {
    if (!data.teams || data.teams.length === 0) {
      document.getElementById("results").innerHTML = "<p>No players selected.</p>";
      return;
    }

    let html = "<h2>Teams</h2><div class='teams-container'>";
    data.teams.forEach((team, i) => {
      const playersHTML = team.players.map(p => `
        <div class="player" draggable="true" data-handicap="${p.handicap}">
          ${p.name} (${p.handicap})
        </div>
      `).join("");

      html += `
        <div class="team" data-team="${i}">
          <h3>Team ${i+1}: <span class="total">${team.total}</span></h3>
          <div class="team-players">${playersHTML}</div>
        </div>
      `;
    });
    html += "</div>";

    document.getElementById("results").innerHTML = html;

    enableDragAndDrop();
  })
  .catch(err => console.error("❌ Error:", err));
});

// Enable drag & drop
function enableDragAndDrop() {
  const players = document.querySelectorAll(".player");
  const teams = document.querySelectorAll(".team-players");

  players.forEach(player => {
    player.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", JSON.stringify({
        name: player.textContent,
        handicap: player.dataset.handicap
      }));
      e.dataTransfer.effectAllowed = "move";
      player.classList.add("dragging");
    });

    player.addEventListener("dragend", () => {
      player.classList.remove("dragging");
    });
  });

  teams.forEach(team => {
    team.addEventListener("dragover", e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      team.classList.add("drag-over");
    });

    team.addEventListener("dragleave", () => {
      team.classList.remove("drag-over");
    });

    team.addEventListener("drop", e => {
      e.preventDefault();
      team.classList.remove("drag-over");

      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      const dragged = document.querySelector(".dragging");

      if (dragged) {
        team.appendChild(dragged);
        updateTotals();
      }
    });
  });
}

// Update totals after re-dragging players
function updateTotals() {
  document.querySelectorAll(".team").forEach(team => {
    let total = 0;
    team.querySelectorAll(".player").forEach(p => {
      total += parseInt(p.dataset.handicap);
    });
    team.querySelector(".total").textContent = total;
  });
}
