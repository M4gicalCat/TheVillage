import {Column, Entity, getRepository, ManyToMany, PrimaryColumn} from "typeorm";
import {Roles} from "./types/Roles";
import {User} from "./User";
import {Partie} from "./Partie";

@Entity()
export class Role {
    // Le rôle représenté
    @PrimaryColumn()
    role: Roles;

    // Le nom du rôle
    @Column()
    name: string;

    // L'URL de l'image du rôle (par ex. /roles/<image>.png)
    @Column()
    image: string;

    // true si le rôle fait partie du camp des villageois, false sinon
    @Column()
    village: boolean;

    @Column()
    limite: number;

    // Les utilisateurs possédant ce rôle
    @ManyToMany(() => User, user => user.roles, {cascade: true})
    users: User[];

    /**
     * Creates (or updates) the different roles available.
     * Called once at the start of the app
     */
    static async init() {
        const repo = getRepository(Role),
            roles = await repo.find({relations: ["users"]}),
            relations = roles.map(r => ({role: r.role, users: r.users}));
        let villageois = roles.splice(roles.findIndex(r => r.role === Roles.Villageois), 1)[0];
        if (!villageois)
            villageois = new Role();
        villageois.role = Roles.Villageois;
        villageois.image = `/roles/Villageois.png`;
        villageois.village = true;
        villageois.users = [];
        villageois.name = "Villageois";
        villageois.limite = Partie.NB_JOUEURS_MAX;
        await repo.save(villageois);
        await repo.createQueryBuilder().relation(User, "roles").of(relations.find(r => r.role === Roles.Villageois).users).add(Roles.Villageois);

        let chasseur = roles.splice(roles.findIndex(r => r.role === Roles.Chasseur), 1)[0];
        if (!chasseur)
            chasseur = new Role();
        chasseur.role = Roles.Chasseur;
        chasseur.image = `/roles/Chasseur.png`;
        chasseur.village = true;
        chasseur.users = [];
        chasseur.name = "Chasseur";
        chasseur.limite = 1;
        await repo.save(chasseur);
        await repo.createQueryBuilder().relation(User, "roles").of(relations.find(r => r.role === Roles.Chasseur).users).add(Roles.Chasseur);

        let loupGarou = roles.splice(roles.findIndex(r => r.role === Roles.LoupGarou), 1)[0];
        if (!loupGarou)
            loupGarou = new Role();
        loupGarou.role = Roles.LoupGarou;
        loupGarou.image = `/roles/LoupGarou.png`;
        loupGarou.village = false;
        loupGarou.users = [];
        loupGarou.name = "Loup-Garou";
        loupGarou.limite = Partie.NB_JOUEURS_MAX;
        await repo.save(loupGarou);
        await repo.createQueryBuilder().relation(User, "roles").of(relations.find(r => r.role === Roles.LoupGarou).users).add(Roles.LoupGarou);

        let sorciere = roles.splice(roles.findIndex(r => r.role === Roles.Sorciere), 1)[0];
        if (!sorciere)
            sorciere = new Role();
        sorciere.role = Roles.Sorciere;
        sorciere.image = `/roles/Sorciere.png`;
        sorciere.village = true;
        sorciere.users = [];
        sorciere.name = "Sorcière";
        sorciere.limite = 1;
        await repo.save(sorciere);
        await repo.createQueryBuilder().relation(User, "roles").of(relations.find(r => r.role === Roles.Sorciere).users).add(Roles.Sorciere);

        let voyante = roles.splice(roles.findIndex(r => r.role === Roles.Voyante), 1)[0];
        if (!voyante)
            voyante = new Role();
        voyante.role = Roles.Voyante;
        voyante.image = `/roles/Voyante.png`;
        voyante.village = true;
        voyante.users = [];
        voyante.name = "Voyante";
        voyante.limite = 1;
        await repo.save(voyante);
        await repo.createQueryBuilder().relation(User, "roles").of(relations.find(r => r.role === Roles.Voyante).users).add(Roles.Voyante);
    }
}