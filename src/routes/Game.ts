import {RequestHandler, Router} from "express";
import {Server as SocketIOServer} from "socket.io";
import {getRepository} from "typeorm";
import {Partie, PartieStatus} from "../entity/Partie";
import {User} from "../entity/User";
import * as fs from "fs";
import * as path from "path";
import {Roles} from "../entity/types/Roles";
import {ActionType} from "../entity/types/ActionType";
import {Config} from "../entity/Config";
import {Coordinate} from "../entity/types/Coordinate";
import {AudioType} from "../entity/types/AudioType";
import {LoupGarou} from "../entity/roles/LoupGarou";
import {Sorciere} from "../entity/roles/Sorciere";

const passport = require("passport");

export function Route(router: Router, io: SocketIOServer, sessionMiddleware: RequestHandler) {

    router.get('/play/:id', async (req, res, next) => {

        let partie = await getRepository(Partie).findOne(req.params.id);

        if(!partie) return next();
        if (partie.status === PartieStatus.ENDED) return res.redirect("/");
        const user = req.user as User;
        if (partie.status > PartieStatus.STARTING) {
            const p = findPartie(partie.id);
            if (p) {
                p.removeInGamePlayer(user);
                if (p.votes?.length > 0) {
                    await p.checkVote(io);
                }
                p.kill(user.id);
                const t = p.idTasks.find(p => p.id === user.id);
                if (t && t.tasks.length !== 0) {
                    t.tasks = [];
                    await p.checkTasks(io);
                }
                const winner = await p.victoire();
                if (winner !== null) {
                    io.to(partie.id).emit("victoire", winner);
                }
            }
            else partie.removeInGamePlayer(user);
            return res.redirect("/?err=game_already_started");
        }
        let role = (partie.roles.filter(p => p.uid === user.id))[0]?.role;
        if (!role) role = Roles.Villageois;
        const LG = role === Roles.LoupGarou ? (partie.roles.filter(p => p.role === Roles.LoupGarou)).map(p => {
            return p.uid
        }) : [];
        //pour ne pas envoyer les rôles à tout le monde (aka anti-cheat ma gueule)
        partie.roles = [];
        let numeroJoueur = partie.players.indexOf(user.id);
        if (numeroJoueur < 0) return res.redirect("/?err=wrong_game");

        let roomId = req.params.id;
        let game = await getRepository(Partie).findOne(roomId);
        let players = await game.getPlayers();
        let users = [];
        for (let p of players) {
            let u = await getRepository(User).findOne(p.id);
            p.color = u.color;
            users.push(u);
        }
        io.to(roomId).emit("players", users);

        res.render("game/main", {
            partie,
            map: partie.getMap(fs, path),
            role,
            numeroJoueur,
            LoupsGarous: JSON.stringify(LG),
            user,
            players,
            isDebug: Config.CONFIGURATION.env === "debug"
        });
    });

    const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
    io.use(wrap(sessionMiddleware));
    io.use(wrap(passport.initialize()));
    io.use(wrap(passport.session()));
    io.use((socket, next) => {
        if (socket.request["user"]) {
            next();
        } else {
            next(new Error("unauthorized"));
        }
    });

    getRepository(Partie).find().then(async (parties) => {
        for (const party of parties) {
            party.inGamePlayers = [];
            await getRepository(Partie).save(parties);
        }
    });

    const PARTIES: Partie[] = [];

    function monitorPartie(partie: Partie): Partie {
        if(!isMonitoredPartie(partie)) {
            PARTIES.push(partie);
            partie.deadPlayers = [];
            partie.generateTasks();
        }
        return findPartie(partie.id);
    }

    function isMonitoredPartie(partie: Partie): boolean {
        return findPartie(partie.id) !== null;
    }

    function findPartie(partieId: string): Partie {
        for (const monitoredPartie of PARTIES)
            if(monitoredPartie.id === partieId) return monitoredPartie;
        return null;
    }

    io.on("connection", (socket) => {

        let partie: Partie,
            user: User = socket.request["user"],
            position: Coordinate,
            role: Roles

        function sendError(msg: string) {
            socket.emit("error", {
                type: 'error',
                message: msg
            });
            socket.disconnect();
        }

        socket.on("chat_message", (user, msg, room) =>{
            io.to(room).emit("message", user, msg);
        });

        socket.on("joinPartie", async (data) => {
            partie = monitorPartie(await getRepository(Partie).findOne(data.gameId));
            role = data.role;
            if(!partie) return sendError("Game not found");
            if(partie.isInGame(user)) return sendError("Is already in this game");
            partie.addInGamePlayer(user);
            if (partie.inGamePlayers.length === partie.players.length) io.to(partie.id).emit("everyone_is_here");
            socket.join(partie.id);
            io.to(partie.id).emit("playerJoin", {
                id: user.id,
                pseudo: user.pseudo,
                position: data.position,
                index: data.index,
                color: data.color,
                role
            });
            partie.status = PartieStatus.STARTED;
            await getRepository(Partie).save(partie);
        });

        socket.on("disconnect", () => {
            if(!partie) return;
            partie.removeInGamePlayer(user);
        });

        socket.on("playerMove", async (data) => {
            if(!partie) return;
            position = data.position as Coordinate;
            io.to(partie.id).emit("playerMove", {
                id: user.id,
                pseudo: user.pseudo,
                position: data.position,
                index: data.index,
                color: user.color,
            });
        });

        socket.on("action", async (data) => {
            if (!partie) return;
            switch (data.role) {
                case Roles.Sorciere:
                    partie.addAction(data.data.maker, data.data.revive ? ActionType.REVIVE : ActionType.KILL, data.data.player);
                    if (data.data.revive)
                        partie.revive(data.data.player);
                    else {
                        partie.kill(data.data.player);
                        await partie.checkTasks(io);
                        let gagnant = await partie.victoire();
                        if (gagnant !== null) {
                            return io.to(partie.id).emit("victoire", gagnant);
                        }
                    }
                    io.to(partie.id).emit("audio", data.data.revive ? AudioType.Revive : AudioType.Kill, data.position, data.data.revive ? Sorciere.DISTANCE_SON_REVIVE : Sorciere.DISTANCE_SON_KILL);
                    return io.to(partie.id).emit(data.data.revive ? "revive" : "kill", data.data.player);
                case Roles.Voyante:
                    partie.addAction(data.data.maker,ActionType.REVEAL, data.data.player);
                    io.to(partie.id).emit("audio", AudioType.Voyante);
                    return socket.emit("see_role", {role: partie.roles.filter(p => p.uid === data.data.player)[0].role, id: data.data.player, voyante: true});
                case Roles.Chasseur:
                    // Même chose que pour le loup-garou
                case Roles.LoupGarou:
                    partie.addAction(data.data.maker, ActionType.KILL, data.data.player);
                    partie.kill(data.data.player);
                    let gagnant = await partie.victoire();
                    if (gagnant !== null) {
                        return io.to(partie.id).emit("victoire", gagnant);
                    }
                    await partie.checkTasks(io);
                    io.to(partie.id).emit("audio", AudioType.Kill, data.position, LoupGarou.DISTANCE_SON_KILL);
                    return io.to(partie.id).emit("kill", data.data.player);
            }
        });

        socket.on("drink", data => {
            if (!partie) return;
            partie.addAction(data.id, ActionType.DRINK, 0);
            io.to(partie.id).emit("drink", data.pos);
        });

        socket.on("task_completed",  (id, name) => {
            if (!partie) return;
            const index = partie.idTasks.find(p => p.id === id).tasks.findIndex(p => p === name);
            if (index === -1) return;
            partie.idTasks.find(p => p.id === id).tasks.splice(index, 1);
            partie.addAction(id, ActionType.TASK, 0);
            partie.checkTasks(io).then();
        });

        socket.on("get_tasks", async (id) => {
            if (!partie) {
                partie = findPartie((await getRepository(User).findOne(id))?.partie);
                if (!partie) return;
            }
            //emit only to send to the player that requested it
            socket.emit("tasks", partie.idTasks.find(p => p.id === id));
        });

        socket.on("aVote", async (id) => {
            const couple = partie.votes.find(p => p.id === id);
            if (couple === undefined) {
                partie.votes.push({id, nb_votes: 1});
            } else {
                couple.nb_votes ++;
            }
            await partie.checkVote(io);
        });

        socket.on("history", async () => {
            if (!partie) return;
            const history = await partie.getHistory();
            socket.emit("history", history);
        });
    });
}