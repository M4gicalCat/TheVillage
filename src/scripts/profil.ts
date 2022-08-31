import * as $ from 'jquery';
import "../styles/profil.css";
import '@fortawesome/fontawesome-free/js/fontawesome'
import '@fortawesome/fontawesome-free/js/solid'
import '@fortawesome/fontawesome-free/js/regular'
import '@fortawesome/fontawesome-free/js/brands'
import {Chart, registerables} from 'chart.js';
import Swal from "sweetalert2";
Chart.register(...registerables);

//@ts-ignore
let selected  = _selected;

let canvas = <HTMLCanvasElement> $("#winrateChart").get(0);
let wrc = canvas.getContext('2d');

let partiesJouees = $('#nbParties');
let victoires = $('#nbVictoires').text();
let defaites = +partiesJouees.text() - +victoires;

if (parseInt(partiesJouees.text()) === 0) {
    partiesJouees.text("Aucune partie jouée");
    partiesJouees.removeClass("hidden");
}

new Chart(wrc, {
    type: 'doughnut',
    data: {
        labels: ['Victoires','Défaites'],
        datasets: [{
            label: 'Victoires/Défaites',
            data: [victoires, defaites],
            backgroundColor: [
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 99, 132, 0.2)',
            ],
            borderColor: [
                'rgba(54, 162, 235, 1)',
                'rgba(255, 99, 132, 1)',
            ],
            borderWidth: 1
        }]
    },
});

$("#retour").on("click", () => {
    history.back();
});

const roles = $(".roles")[0];
const top_roles = roles.offsetTop;
roles.style.height = `${innerHeight - top_roles}px`;

$(".skins").css("height", `${innerHeight - top_roles}px`);

//@ts-ignore
selectRole = (id) => {
    if (id === selected) return;
    $.ajax("/profil/skin", {
        method: "PUT",
        data: {id}
    }).then(() => {
        $(".selected").removeClass("selected");
        $("#skin_" + id).addClass("selected");
        selected = id;
    }).catch(e => {
        Swal.fire({title: e, icon: "error"});
    });
};