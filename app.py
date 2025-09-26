from flask import Flask, render_template, request, jsonify
import json, os

app = Flask(__name__)

# -------------------------
# Data location (supports Render Disk)
# -------------------------
HERE = os.path.dirname(os.path.abspath(__file__))
SEED_FILE = os.path.join(HERE, "roster.json")
DATA_DIR = os.environ.get("ROSTER_DIR", HERE)  # set this on Render to your Disk mount path
ROSTER_FILE = os.path.join(DATA_DIR, "roster.json")

def ensure_roster_exists():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(ROSTER_FILE):
        if os.path.exists(SEED_FILE):
            with open(SEED_FILE) as f_in, open(ROSTER_FILE, "w") as f_out:
                f_out.write(f_in.read())
        else:
            with open(ROSTER_FILE, "w") as f:
                json.dump([], f, indent=2)

# -------------------------
# Helpers
# -------------------------
def load_roster():
    ensure_roster_exists()
    with open(ROSTER_FILE) as f:
        players = json.load(f)
    # Alphabetical by name
    return sorted(players, key=lambda x: x["name"].lower())

def save_roster(players):
    players = sorted(players, key=lambda x: x["name"].lower())
    ensure_roster_exists()
    with open(ROSTER_FILE, "w") as f:
        json.dump(players, f, indent=2)

# -------------------------
# Routes
# -------------------------

@app.route("/")
def index():
    players = load_roster()
    return render_template("index.html", players=players)

@app.route("/create-teams", methods=["POST"])
def create_teams():
    data = request.json
    selected_players = data["players"]
    num_teams = data.get("numTeams", 2)

    if not selected_players:
        return jsonify({"teams": []})

    # Sort by handicap: lowest first (best golfer)
    selected_players.sort(key=lambda x: x["handicap"])

    # Initialize teams
    teams = [{"players": [], "total": 0} for _ in range(num_teams)]

    # Snake draft: best → worst → back again
    direction = 1
    team_index = 0

    for player in selected_players:
        teams[team_index]["players"].append(player)
        teams[team_index]["total"] += player["handicap"]

        team_index += direction
        if team_index == num_teams:
            team_index = num_teams - 1
            direction = -1
        elif team_index < 0:
            team_index = 0
            direction = 1

    return jsonify({"teams": teams})

@app.route("/roster")
def roster_page():
    players = load_roster()
    return render_template("roster.html", players=players)

@app.route("/add-player", methods=["POST"])
def add_player():
    data = request.json
    new_player = {"name": data["name"], "handicap": int(data["handicap"])}
    players = load_roster()
    players.append(new_player)
    save_roster(players)
    return jsonify({"success": True, "players": load_roster()})

@app.route("/remove-player", methods=["POST"])
def remove_player():
    data = request.json
    name_to_remove = data["name"]
    players = [p for p in load_roster() if p["name"] != name_to_remove]
    save_roster(players)
    return jsonify({"success": True, "players": load_roster()})

@app.route("/edit-player", methods=["POST"])
def edit_player():
    data = request.json
    name_to_edit = data["name"]
    new_handicap = int(data["handicap"])
    players = load_roster()
    for p in players:
        if p["name"] == name_to_edit:
            p["handicap"] = new_handicap
            break
    save_roster(players)
    return jsonify({"success": True, "players": load_roster()})

if __name__ == "__main__":
    app.run(debug=True)
