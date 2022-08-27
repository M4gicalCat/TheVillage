import {Column, Entity, getRepository, PrimaryColumn} from "typeorm";

import {User} from "./User";
import {Map as Carte} from "./Map";
import {Roles} from "./types/Roles";
import {Action} from "./Action";
import {ActionType} from "./types/ActionType";
import {ObjectType} from "./types/ObjectType";
import {Role} from "./Role";

export enum PartieStatus {
    CREATING,
    WAIT_USERS,
    STARTING,
    STARTED,
    ENDED
}

@Entity()
export class Partie {

    public static readonly NB_JOUEURS_MIN = 2;
    public static readonly NB_JOUEURS_MAX = 15;
    public static readonly NB_TASKS_PER_DAY = 1;//2;

    @PrimaryColumn()
    id: string;

    @Column({
        default: false
    })
    publique: boolean;

    @Column({
        type: "enum",
        enum: PartieStatus,
        default: PartieStatus.CREATING
    })
    status: PartieStatus;

    @Column({
        default: 10
    })
    nbJoueursMax: number;

    @Column({
        default: 60
    })
    dureeVote: number;

    @Column({
        default: 240
    })
    dureeNuit: number;

    @Column({
        default: 0
    })
    gameMaster: number;

    @Column({
        type: "simple-json",
    })
    players: Array<number>;

    @Column({
        type: "simple-json",
    })
    inGamePlayers: number[];

    @Column({
        type: "simple-json",
    })
    bans: number[];

    @Column()
    map: string;

    @Column({
        type: "simple-json",
    })
    roles: {uid: number, role: Roles}[];

    idTasks: {id: number, tasks: string[]}[];

    deadPlayers: Array<number>;

    actions: Action[];

    votes: {id: number, nb_votes: number}[];

    async getPlayers(): Promise<User[]> {
        const repo = getRepository(User);
        const players = [];
        for (const id of this.players) {
            const p = await repo.findOne({where: [{id}], relations: ['roles']});
            players.push(p);
        }
        return players.filter(p => !!p);
    }

    addPlayer(userId: number): boolean{
        if (this.players.length >= this.nbJoueursMax)
            return false;
        if (!this.players.includes(userId))
            this.players.push(userId);
        if (this.gameMaster === 0 || !this.players.includes(this.gameMaster))
            this.gameMaster = userId;
        return true;
    }

    addInGamePlayer(user: User) {
        if(this.inGamePlayers.includes(user.id))
            return;
        this.inGamePlayers.push(user.id);
        getRepository(Partie).save(this).then();
    }

    removeInGamePlayer(user: User) {
        if(!this.inGamePlayers.includes(user.id))
            return;
        this.inGamePlayers.splice(this.inGamePlayers.indexOf(user.id), 1);
        this.kill(user.id);
        getRepository(Partie).save(this).then();
    }

    isInGame(user: User): boolean {
        return this.inGamePlayers.includes(user.id);
    }

    async start() {
        this.status = PartieStatus.STARTING;
        await this.init();
        await getRepository(Partie).save(this);
    }

    getMap(fs, path): Carte {
        try {
            if(this.map !== "")
                return JSON.parse(fs.readFileSync(path.resolve(__dirname, `../../public/maps/officials/${this.map}.json`), "utf-8")) as Carte;
        } catch (e) {}
        return JSON.parse(fs.readFileSync(path.resolve(__dirname, `../../public/maps/officials/The_village.json`), "utf-8")) as Carte;
    }

    /**
     * Creates the roles for the players in the game
     */
    async init() {
        const j = [];
        this.players.forEach(p => j.push(p));
        const joueurs = [];
        while (j.length > 0){
            joueurs.push(j.splice(Math.floor(Math.random() * j.length), 1)[0]);
        }
        this.roles ??= [];

        const roles: Role[] = [await getRepository(Role).findOne(Roles.Villageois), await getRepository(Role).findOne(Roles.LoupGarou)];

        for (const {role} of this.roles) {
            // Si le rôle est déjà ajouté, on passe
            if (roles.find(r => r.role === role)) continue;

            const r = await getRepository(Role).findOne(role);
            roles.push(r);
        }

        roles.sort((a, b) => {
            // Loup garou devant Village
            if (a.village && !b.village) return 1;
            // dans le même camp
            if (a.village === b.village) {
                // plus petite limite devant les autres
                if (a.limite > b.limite) return 1;
                // même limite
                if (a.limite === b.limite) return 0;
                // plus grande limite derrière
                return -1;
            }
            // Village derrière Loup garou
            return -1;
        });

        this.roles = [];
        const nbLG = this.getNombreLoupGarous();

        for (const uid of joueurs) {
            let role = roles[0];
            // Si le rôle a atteint sa limite (assez de joueurs le possèdent)
            while (role.limite <= 0) {
                roles.splice(0, 1);
                role = roles[0];
            }
            // Si le rôle fait partie du camp des loup-garous et que les joueurs de ce camp sont assez nombreux
            while (!role.village && this.roles.length >= nbLG) {
                roles.splice(0, 1);
                role = roles[0];
            }
            this.roles.push({uid, role: role.role});
            role.limite--;
        }
    }

    /**
     * Returns the number of players in the Werewolves team depending on the total number of players.
     */
    getNombreLoupGarous(): number {
        if (this.players.length < 6) return 1;
        if (this.players.length < 10) return 2;
        return Math.ceil(this.players.length / 4);
    }

    /**
     * Adds an action for the history of the game (displayed at the end)
     * @param maker
     * The player that did the action (0 if it is the village)
     * @param type
     * The type of the action
     * @param victim
     * The victim of the action (0 if there isn't)
     */
    addAction(maker: number, type: ActionType, victim: number) {
        if (!this.actions) this.actions = [];
        this.actions.push(new Action(maker, type, victim));
    }

    /**
     * Returns an HTML string containing every action done during the game as a list
     */
    async getHistory(): Promise<string> {
        if (!this.actions) return "<div>Aucun historique n'est disponible pour cette partie.</div>";
        let html = "<ul>";
        for (const a of this.actions) {
            let li = `<li style="color: ${a.color}">`;
            li += (await a.toString());
            html += li + `</li>`;
        }
        return html;
    }

    generateTasks() {
        this.idTasks = [];
        for (const id of this.players) {
            if (this.deadPlayers.includes(id)) continue;
            if (this.roles.find(p => p.uid === id).role === Roles.LoupGarou) this.idTasks.push({id, tasks: []});
            else {
                const possibleTasks = [ObjectType.caisse, ObjectType.foin, ObjectType.maison, ObjectType.sapin, ObjectType.arbre];
                const tasks = [];
                for (let i = 0; i < Partie.NB_TASKS_PER_DAY && possibleTasks.length > 0; i++) {
                    tasks.push(possibleTasks.splice(Math.floor(Math.random() * possibleTasks.length), 1)[0]);
                }
                this.idTasks.push({id, tasks});
            }
        }
    }

    kill(id: number) {
        if (!this.inGamePlayers.includes(id)) return;
        if (this.deadPlayers.includes(id)) return;
        this.deadPlayers.push(id);
    }

    revive(id: number) {
        const index = this.deadPlayers.findIndex(pid => pid === id);
        if (index === -1) return;
        this.deadPlayers.splice(index, 1);
    }

    /**
     * Checks for a victory :
     * @returns - `null` if no one wins (yet) |
     * @returns - `true` if the Villagers win |
     * @returns - `false` if the WereWolves win.
     */
    async victoire(): Promise<null | boolean> {
        const alive = this.inGamePlayers.filter(p => !this.deadPlayers.includes(p));
        let camp = null;
        for (const player of alive) {
            if (camp === null) camp = this.roles.find(p => p.uid === player).role === Roles.LoupGarou;
            else {
                //Si au moins 2 personnes ne sont pas dans le même camp
                if ((this.roles.find(p => p.uid === player).role === Roles.LoupGarou) !== camp) {
                    return null;
                }
            }
        }
        // Tout le monde est dans le même camp, victoire d'un des camps
        this.status = PartieStatus.ENDED;
        await getRepository(Partie).save(this);
        await this.assignXP(!camp);
        return !camp;
    }

    async checkTasks(io) {
        let compteur = 0;
        if (!this.idTasks) return;
        this.idTasks.forEach(t => {
            //Ne prends pas en compte les tâches des joueurs morts
            if (this.deadPlayers.includes(t.id)) return;
            compteur += t.tasks.length;
        });
        if (compteur > 0) {
            io.to(this.id).emit("nb_tasks", compteur);
        } else {
            for (const pid of this.deadPlayers) {
                io.to(this.id).emit("see_role", {role: this.roles.filter(p => p.uid === pid)[0].role, id: pid});
            }
            io.to(this.id).emit("DAY", (await getRepository(User).findByIds(this.inGamePlayers)).map(p => {return {pid: p.id, avatar: p.avatar, pseudo: p.pseudo}}));
            this.votes = [];
        }
    }

    async checkVote(io) {
        if (!this.votes || !this.players || !this.deadPlayers) return;
        let max = {id: -1, nb_votes: -1};
        let tie = false;
        let compteur = 0;
        for (const vote of this.votes) {
            compteur += vote.nb_votes;
            if (vote.nb_votes > max.nb_votes) {
                max = vote;
                tie = false;
            } else
                tie = vote.nb_votes === max.nb_votes && vote.id !== max.id;
        }
        if (compteur >= this.inGamePlayers.length - this.deadPlayers.length) {
            if (!tie) {
                this.kill(max.id);
                this.addAction(0, ActionType.EXPELLED, max.id);
                io.to(this.id).emit("final_kill", [...this.deadPlayers, max.id]);
            } else {
                io.to(this.id).emit("final_kill", this.deadPlayers);
            }
            this.votes = [];
            const gagnant = await this.victoire();
            if (gagnant !== null) {
                return io.to(this.id).emit("victoire", gagnant);
            }
            //Si tout le monde a voté (seulement)
            this.generateTasks();
            io.to(this.id).emit("NIGHT");
        }
    }

    //true = villager win, false = werewolves win
    /**
     * Grants exp to every player in the game.
     * Grants more exp if the player won than if the player lost the game.
     * It also adds `1` to player.nbPartiesJouees or player.nbPartieGagnees (depending on the win / loss of the game).
     * @param winner
     */
    async assignXP(winner) {
        const uRepo = getRepository(User);
        for (const p of this.inGamePlayers) {
            const role = this.roles.find(r => r.uid === p);
            const user = await uRepo.findOne(p);
            if (!user) continue;
            if (!role) {
                user.xp += 50;
            } else {
                if (this.deadPlayers.includes(p)) {
                    user.xp += ((role.role === Roles.LoupGarou) !== winner) ? 100 : 50;
                } else {
                    user.xp += ((role.role === Roles.LoupGarou) !== winner) ? 200 : 100;
                }
                // Partie gagnée
                if (((role.role === Roles.LoupGarou) !== winner)) {
                    user.nbPartiesGagnees++;
                }
            }
            user.nbPartiesJouees++;
            if (user.xp >= (user.niveau + 1) * 10) {
                user.niveau += 1;
                user.xp -= (user.niveau) * 10;
            }
            await uRepo.save(user);
        }
    }
}