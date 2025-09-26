// Handle Add Player
document.getElementById("add-form").addEventListener("submit", e => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const handicap = document.getElementById("handicap").value.trim();

  fetch("/add-player", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({name, handicap})
  })
  .then(res => res.json())
  .then(data => {
    updatePlayerList(data.players);
    document.getElementById("add-form").reset();
  });
});

// Handle Remove Player
function removePlayer(name) {
  fetch("/remove-player", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({name})
  })
  .then(res => res.json())
  .then(data => {
    updatePlayerList(data.players);
  });
}

// Handle Save Edit
function saveEdit(name) {
  const input = document.getElementById(`handicap-${name}`);
  const newHandicap = input.value.trim();

  fetch("/edit-player", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({name, handicap: newHandicap})
  })
  .then(res => res.json())
  .then(data => {
    updatePlayerList(data.players);
  });
}

// Update Player Table
function updatePlayerList(players) {
  const list = document.getElementById("player-list");
  list.innerHTML = "";
  players.forEach(p => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${p.name}</td>
      <td><input type="number" id="handicap-${p.name}" value="${p.handicap}"></td>
      <td><button onclick="saveEdit('${p.name}')">Save</button></td>
      <td><button class="remove-btn" onclick="removePlayer('${p.name}')">❌</button></td>
    `;
    list.appendChild(row);
  });
}
