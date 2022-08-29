import * as $ from 'jquery';
import Swal from "sweetalert2";
import "../styles/options.css";
import '@fortawesome/fontawesome-free/js/fontawesome';
import '@fortawesome/fontawesome-free/js/solid';
import '@fortawesome/fontawesome-free/js/regular';
import '@fortawesome/fontawesome-free/js/brands';
import '../entity/Tools';
import {Tools} from "../entity/Tools";
// @ts-ignore
let user = _user;
let uid = user.id;

const son_on = $("<i class='fas fa-volume-up color-green'></i>")
const son_off = $("<i class='fas fa-volume-off color-red'></i>")
const $icone_son = $('#icone_son');
update_volume();
$icone_son.on("click", () => {
    user.son = user.son > 0 ? 0 : 100;
    $("#son").val(user.son);
    $.ajax('/options/son', {
        method: "PUT",
        data: {
            son: user.son
        }
    })
        .done(update_volume)
        .catch(e => {
        Swal.fire(e.responseJSON);
    });
});
$("#son").on("change", e => {
    user.son = +((e.target as HTMLInputElement).value);
    $.ajax('/options/son', {
        method: "PUT",
        data: {
            son: user.son
        }
    })
        .done(update_volume)
        .catch(e => {
        Swal.fire(e.responseJSON);
    });
});

$("#retour").on("click", () => {
    window.location.replace("/");
});

$("#changepassword").on("click", (e) => {
    e.preventDefault();
    Swal.fire({title: "L'envoi d'email est en travaux", text: "Vous devrez encore patienter un peu avant de pouvoir changer votre mot de passe.", icon: "info"});
    //window.location.href = "../auth/getPassword?email="+$("#email").text();
});

$("#changeusername").on("click", async () => {
    let result = await Swal.fire({
       title: 'Modifier votre pseudo',
       input: "text",
       confirmButtonText: "<i class=\"fas fa-save color-blue\"></i> Sauvegarder",
       showCancelButton: true,
       cancelButtonText: "<i class=\"fas fa-times color-red\"></i> Annuler"
   });
    if(!result.isConfirmed) return;
    const res = await $.ajax({
       url: "/options/pseudo",
       method: "PUT",
        data: {
            pseudo: result.value
        }
    });
    if (res.status === 200)
        $("#pseudo").text(result.value);
    else {
        await Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: res.result,
        });
    }
});

$("#changeemail").on("click", async () => {
    let resultEmail = await Swal.fire({
        title: 'Modifier votre adresse mail',
        input: "email",
        inputLabel: 'Adresse mail',
        inputPlaceholder: 'Nouvelle adresse mail',
        confirmButtonText: "<i class=\"fas fa-save color-blue\"></i> Sauvegarder",
        showCancelButton: true,
        cancelButtonText: "<i class=\"fas fa-times color-red\"></i> Annuler"
    });
    if (!resultEmail.isConfirmed) return;
    let resultPassword = await Swal.fire({
        title: 'Entrez votre mot de passe',
        input: "password",
        inputLabel: 'Mot de passe',
        inputPlaceholder: 'Entrez votre mot de passe',
        confirmButtonText: "<i class=\"fas fa-save color-blue\"></i> Valider",
        showCancelButton: true,
        cancelButtonText: "<i class=\"fas fa-times color-red\"></i> Annuler"
    });
    if (!resultPassword.isConfirmed) return;
    let result = await $.ajax({
        url: "/options/email",
        method: "PUT",
        data: {
            email: resultEmail.value,
            password: resultPassword.value
        }
    });

    if (result.result === "ok") {
        $("#email").text(resultEmail.value);
    }

    if (result.result === "bad") {
        await Swal.fire({
            icon: 'error',
            title: 'Bad password',
            text: 'Mot de passe incorrect !',
        })
    }
});

$("#changeavatar").on("click", async function() {
    let {value: type} = await Swal.fire({
        title: 'Selectionnez le type d\'avatar',
        input: "radio",
        inputOptions: {
            "color" : "Couleur",
            "image" : "Image"
        },
        inputValidator: (value) => {
            if (!value) {
                return 'Choisissez une option'
            }
        },
        confirmButtonText: "<i class=\"fas fa-save color-blue\"></i> Valider",
        showCancelButton: true,
        cancelButtonText: "<i class=\"fas fa-times color-red\"></i> Annuler"
    });
    if (type) {
        let popup = Tools.popup();
        $(document.body).append(popup.div);
        let html = type === "image" ? `
            <h2>Choisissez un fichier</h2>
            <form id="form_avatar" action="/options/avatar_pic" method="post" enctype="multipart/form-data">
                <input type="hidden" name="userId" value='${uid}'>
                <input id="avatar_input" required type="file" accept=".png, .jpg, .jpeg, .gif" name="avatar">
                <button form="form_avatar" id="submit_avatar"><i class="fas fa-save color-blue"></i> Valider</input>
            </form>
        ` : `
            <h2>Choisissez une couleur</h2>
            <form id="form_avatar" action="/options/avatar_col" method="post">
                <input type="hidden" name="userId" value='${uid}'>
                <input type="color" name="avatar" required>
                <button form="form_avatar" id="submit_avatar"><i class="fas fa-save color-blue"></i> Valider</input>
            </form>
        `;
        popup.text.html(html);
    }
});


let avatar = $(`#avatar_pic`);
let html = "";
html += user.avatar.startsWith("#")
    ? `<div id="avatar_color" class="avatar"></div>`
    : `<img src="/avatars/${user.avatar}" width="50" alt=" ">`;
html += `</div>`
avatar.html(html);
if (user.avatar.startsWith("#"))
    $("#avatar_color").css("background-color", user.avatar);


function update_volume() {
    if (user.son > 0) {
        $icone_son.empty().append(son_on);
    } else {
        $icone_son.empty().append(son_off);
    }
}