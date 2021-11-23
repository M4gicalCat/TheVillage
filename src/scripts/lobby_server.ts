import {Partie, PartieStatus} from "../entity/Partie";
import {getRepository} from "typeorm";
import {User} from "../entity/User";

let gameRepo = getRepository(Partie);
let userRepo = getRepository(User);

export async function countPlayers(gameId) {
    let game = await gameRepo.findOne(gameId);
    return game?.players?.length;
}

export async function getAvailableRoom(uid) :Promise<number>{
    let user = await userRepo.findOne(uid);
    //si l'utilisateur est trouvé :
    if (user) {
        let lastGame = await gameRepo.findOne(user.partie);
        //Si sa dernière partie existe :
        if (lastGame) {
            if (lastGame.status === PartieStatus.STARTED){
                //si le joueur ne fais pas parti des joueurs de la partie
                if (!lastGame.players_playing.includes(user.id))
                    return
                //si le joueur est déjà en train de jouer
                if (lastGame.players.includes(user.id))
                    return
            }
            if (lastGame.players.length < Partie.nbJoueursMax)
                return lastGame.id;
            //checks that the user is not already playing (if so, return)
            for (let i = 0; i < lastGame.players.length; i++){
                if (lastGame.players[i] === user.id)
                    return
            }
        }
    }
    let games = await gameRepo.find({where: {status: `${PartieStatus.WAIT_USERS}`}});
    for (let i = 0; i < games.length; i++) {
        // Si la partie n'est pas pleine (et n'a pas commencé)
        if (games[i].players.length < Partie.nbJoueursMax)
            return games[i].id;
    }
    //Aucune partie n'est libre, on en créée une

    let newGame = new Partie();
    newGame.players = [];
    await gameRepo.save(newGame);
    return newGame.id
}

export async function joinRoom(uid, gameId) :Promise<number>{
    let room = await gameRepo.findOne(gameId);
    if (!room) return -1;
    if ((room.status !== PartieStatus.WAIT_USERS && room.status !== PartieStatus.CREATING && room.status !== PartieStatus.ENDED) || room.players.length >= Partie.nbJoueursMax) {
        return -1;
    }
    //Si la partie s'est remplie entre le dernier test et maintenant,
    //le joueur ne peut pas rejoindre, on le renvoie au menu
    if (!room.addPlayer(uid)) {
        return -1;
    }
    let p = await userRepo.findOne(uid);
    p.partie = room.id;
    await userRepo.save(p);
    //todo: start the game if Partie.status = STARTING
    room.status = room.players.length >= Partie.nbJoueursMax ? PartieStatus.STARTING : PartieStatus.WAIT_USERS;
    if (room.status === PartieStatus.STARTING)
        room.start();
    await gameRepo.save(room);
    return room.players.length;
}

export function disconnect(uid, io) {
    if (!uid)
        return
    userRepo.findOne(uid).then(u=>{
        if (!u){
            console.log(`${uid} not found`)
            return;
        }
        gameRepo.findOne(u.partie).then(room => {
            if (room && room.status !== PartieStatus.STARTING) {
                let index = room.players.indexOf(u.id);
                if (index !== -1){
                    console.log("réussi")
                    room.players.splice(index, 1);
                    gameRepo.save(room).then(()=>{
                        io.to(`${room.id}`).emit("nbPlayers", room.players.length);
                    })
                }else console.log("EUH NIQUE TA MÈRE")
            }
        })
    })
}


