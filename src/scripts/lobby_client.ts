import "../styles/lobby.css";
import {io} from "socket.io-client";
import {Chart, registerables} from 'chart.js';
import {Partie} from "../entity/Partie";
import '@fortawesome/fontawesome-free/js/fontawesome';
import '@fortawesome/fontawesome-free/js/solid';
import '@fortawesome/fontawesome-free/js/regular';
import '@fortawesome/fontawesome-free/js/brands';
import '../entity/Tools';
import {Tools} from "../entity/Tools";
import Swal from "sweetalert2";
import {User} from "../entity/User";
const socket = io(`${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`);
Chart.register(...registerables);


// @ts-ignore
let uid = _id, game = _game;
// @ts-ignore
game.gameMaster = _gameMaster;
let roomName = `${game.id}`,
    players = game.players,
    share = $("#share"),
    nbPlayers = $("#nbPlayers"),
    maxPlayers = $("#maxPlayers"),
    messages = $('#messages'),
    sendMsg = $("#sendMessage"),
    input = $("#input"),
    users = $("#users"),
    fieldset = $("#fieldset"),
    change_max_players = $("#change_max_players"),
    visibility = $("#visibility"),
    $maps = $("#nom_map"),
    bans = $("#joueursBan"),
    container_choice_of_role = $("#container_choice_of_role"),
    current_role = {div: null, role: null},
    player: User;

change_max_players.on("input", function () {
    if (uid === game.gameMaster || !(fieldset[0] as HTMLFieldSetElement).disabled)
        update_max_players();
});


sendMsg.on("click", sendMessage);

$(document).on("keydown", function (e) {
    if (e.code === "Enter" || e.code === "NumpadEnter")
        sendMessage();
    if (e.key === "Escape") {
        let outer = $('.fond_blanc');
        if (outer.length > 0){
            outer.addClass("disappear");
            setTimeout(function(){outer.remove();}, 1000);
        }
    }
});

socket.on("private", bool => {
    (visibility[0] as HTMLInputElement).checked = bool;
    $("#locker").html(bool ? "<i class=\"fas fa-lock\"></i>" : "<i class=\"fas fa-lock-open\"></i>");
});

socket.on('chat_message', (user, msg) => {
    create_message(user, msg);
    messages.scrollTop(messages[0].scrollHeight);
});

socket.on("new_player", function (userId, sockId) {
    //Si le joueur est déjà connecté et joue, il est renvoyé à l'accueil
    //(il joue avec le dernier appareil connecté).
    if (uid === userId && sockId !== socket.id)
        window.location.replace("/?otherDevice=1");
});

socket.on("players", function (p) {
    players = p;
    console.log(players);
    //checks that the current player is in the room
    let s = false;
    for (let i = 0; i < p.length; i++) {
        if (p[i].id !== uid) continue;
        s = true;
        player = p[i];
        create_choice_role();
    }
    if (!s) socket.emit('new_guy', uid, roomName);
    $("#nbPlayers").text(p.length);
    create_players(p);
});

socket.on("change_max_players", max_players => {
    maxPlayers.text(`${max_players}`);
    game.nbJoueursMax = max_players;
});

socket.on("start_game", () => {
    window.location.replace("/play/" + game.id);
});

socket.on("ban", (id, bans) => {
    sendMessageBan(id);
    if (id === uid) return location.replace("/?banned=1");
    addBans(bans);
});

socket.on("unban", function(player, bans) {
    sendUnbanMessage(player);
    addBans(bans);
});

socket.on("game_master", (id) => {
    game.gameMaster = id;
    (fieldset[0] as HTMLFieldSetElement).disabled = uid !== id;
    create_players(players);
});

socket.on("maps", maps => {
    let html = "";
    for (const m of maps) {
        html += `<option value="${m}">${m}</option>`;
    }
    $maps.html(html);
});

socket.on("change_map", map => {
    game.map = map;
    $maps.find("option").each((index, elem) => {
        if ($(elem).val() === game.map) {
            (elem as HTMLOptionElement).selected = true;
            return;
        }
    });
});

socket.on("role", (uid, role) => {
    console.log({uid, role});
    //todo afficher le rôle dans le profil du joueur ?
    // ou afficher seulement si le rôle est villageois / LG
});

socket.on("erreur", e => {
    console.log(e);
    Swal.fire({
        icon: "error",
        title: e.message ?? e
    });
});

document.body.onload = () => {
    document.title = `The Village - ${game.id}`;
    input[0].focus();
    nbPlayers.text(game.players.length);
    maxPlayers.text(game.nbJoueursMax);
    (visibility[0] as HTMLInputElement).checked = !game.publique;
    $("#locker").html(!game.publique ? "<i class=\"fas fa-lock\"></i>" : "<i class=\"fas fa-lock-open\"></i>");
    (change_max_players[0] as HTMLInputElement).value = game.nbJoueursMax;
    addBans(game.bans);
    socket.emit("new_guy", uid, roomName);
    create_players(players);
    $("#nbJoueursMin").text(Partie.NB_JOUEURS_MIN);
    socket.emit('get_game_master', roomName);
    $maps.find("option").each((index, element)=>{
        if ($(element).val() === +game.map){
            (element as HTMLOptionElement).selected = true;
            return;
        }
    });
    socket.emit('get_maps', roomName);
}

share.on("click", () => {
    let p = Tools.popup();
    $(document.body).append(p.div);
    p.text.html(`<h2 id="title_link">Copiez ce lien</h2><textarea cols="${Math.floor(document.location.href.length/1.2)}" id="lien">${document.location.href}</textarea>`);
    p.text.addClass("center");
    let w = $("#lien");
    w[0].focus();
    (w[0] as HTMLTextAreaElement).select();
    try {
        let successful = document.execCommand('copy');
        let title = $("#title_link");
        title.text(successful ? "Lien copié !" : "Copiez ce lien");
    } catch (err) {
        console.log(err);
    }
})

visibility.on("change", function() {
    socket.emit("private", roomName, uid, (visibility[0] as HTMLInputElement).checked);
});

$maps.on('change', function (e) {
    if (game.gameMaster !== uid) return;
    const map = $(e.target).val();
    socket.emit("change_map", `${game.id}`, map);
});

$("#start").on("click", function () {
    start_game();
});

function create_choice_role() {
    container_choice_of_role.empty();
    console.log(player);
    player.roles.sort((a, b) => {
       if (a.village === b.village) return 0;
       if (a.village && !b.village) return 1;
       return -1;
    });
    for (const role of player.roles) {
        const outer = $("<div>").addClass("role");
        outer.on("click", () => { select_role(role, outer); })
            .append($("<h5>").text(role.name).css("color", role.village ? "white" : "red"))
            .append($("<img>").attr("src", role.image).addClass("role_image"));
        container_choice_of_role.append(outer);
    }
}

function select_role(role, div) {
    (current_role.div as JQuery)?.removeClass("selected");
    div.addClass("selected");
    current_role.role = role;
    current_role.div = div;
    socket.emit("role", uid, role.role, roomName);
}

function sendMessage() {
    if (input.val() && `${input.val()}`.trim() !== "") {
        socket.emit('chat_message', player, input.val(), roomName);
        input.val("");
    }
}

function start_game() {
    if (players.length >= Partie.NB_JOUEURS_MIN)
        socket.emit("start_game", `${game.id}`, uid);
    else
        alert("Vous n'êtes pas assez nombreux");
}

function create_message(user, msg) {
    let item = $('<li>');
    let name = $(`<span class="msg_pseudo">${user.pseudo}</span>`);
    name.on("click", function(){
        display_user_info(user);
    });
    item.append(name);
    item.append(` : `).append($("<span>").text(msg));
    messages.append(item);
}

function create_players(players) {
    users.empty();
    for (let i = 0; i < players.length; i++) {
        users.append(create_user_tag(players[i], i));
        let avatar = $(`#avatar_${i}`);
        if (players[i].avatar.startsWith("#"))
            avatar.css("background-color", players[i].avatar);
    }
}

function create_user_tag(p, index :number) {
    let div = $(`<div id="user_${index}">`);
    div.addClass("user");

    let html = `<div class="container">`;
    html += p.avatar.startsWith("#")
        ? `<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt=" "><div id="avatar_${index}" class="avatar"></div>`
        : `<img src="/avatars/${p.avatar}" alt=" ">`;
    html += `</div>
        <span class="pseudo">${p.pseudo} `;

    if (p.id === game.gameMaster)
        html += `<i class="fas fa-crown yellow"></i>`;

    html += `</span><span class="level">Level ${p.niveau}</span>`;
    div.html(html);
    div.on('click', function () {
        if ($(".popup").length === 0)
            display_user_info(p);
    });
    return div;
}

function display_user_info(player) {
    let p = Tools.popup();
    let html = `<div id="text_popup">
        <span class="show_pseudo">${player.pseudo}</span>
        <span class="show_level">Niveau ${player.niveau}</span>
    `;
    html +=  (player.nbPartiesJouees > 0) ?
        `<canvas class="show_camembert"></canvas><p></p>` :
        `<span class="never_played">Ce joueur n'a encore jamais joué</span>`;
    html += '</div>';
    if (uid === game.gameMaster && player.id !== uid) {
        html += `
            <button id="ban" class="red_btn">Bannir</button>
        `;
    }
    p.text.html(html);
    $(document.body).append(p.div);
    let ban = $("#ban");
    ban.on("click", function() {
        p.div[0].click();
        socket.emit("ban", roomName, uid, player.id);
    });
    if (player.nbPartiesJouees === 0)
        return;
    new Chart(($(".show_camembert").get(0) as HTMLCanvasElement).getContext("2d"), {
        type: 'doughnut',
        data: {
            labels: ['Victoires','Défaites'],
            datasets: [{
                label: 'Victoires/Défaites',
                data: [player.nbPartiesGagnees, player.nbPartiesJouees - player.nbPartiesGagnees],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 99, 132, 0.5)',
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 99, 132, 1)',
                ],
                borderWidth: 1
            }]
        },
    });
}

function update_max_players() {
    (change_max_players[0] as HTMLInputElement).min = `${Math.max(Partie.NB_JOUEURS_MIN, game.players.length)}`;
    if (change_max_players.val() === game.nbJoueursMax) return;
    if (change_max_players.val() < Partie.NB_JOUEURS_MIN || change_max_players.val() > 15) {
        (change_max_players[0] as HTMLInputElement).min = `${Math.max(Partie.NB_JOUEURS_MIN, game.players.length)}`;
        (change_max_players[0] as HTMLInputElement).max = `15`;
        return alert("Stop messing with this *(-_-)*");
    }
    socket.emit("change_max_players", game.id, uid, change_max_players.val());
}

function sendMessageBan(id) {
    let user = players.filter(u => u.id === id)[0];
    let li = $("<li>");
    li.addClass("ban_message");
    li.text(`Info : ${user.pseudo} a été banni de la partie.`);
    messages.append(li);
    messages.scrollTop(messages[0].scrollHeight);
}

function addBans(ban) {
    bans.html(`<summary>Joueurs bannis</summary>`);
    ban.forEach(b => {
        let div = $("<div>").addClass("banned_player");
        div.addClass("joueur_ban");
        let p = $("<p>");
        p.text(`${b.pseudo} `);
        div.append(p);
        let close = $("<span>").addClass("unban").text("✖");
        div.append(close);
        close.on("click", function() {
            socket.emit("unban", roomName, uid, b);
        });
        bans.append(div);
    })
}

function sendUnbanMessage(player) {
    if (uid !== game.gameMaster) return;
    let li = $("<li>");
    li.addClass("unban_message");
    li.text(`Info : ${player.pseudo} n'est plus banni de la partie.`);
    messages.append(li);
    messages.scrollTop(messages[0].scrollHeight);
}
