import {Entity, PrimaryColumn, Column, ManyToMany, getRepository} from "typeorm";
import {User} from "./User";
import {SkinId} from "./types/SkinId";

@Entity()
export class Skin{
    @PrimaryColumn()
    id: number;

    // lien vers le repertoire contenant toutes les images.
    @Column()
    lien: string;

    @Column()
    name: string;

    @ManyToMany(() => User, user => user.skins)
    users: User[];

    @Column()
    price: number;

    /**
     * Méthode appelée une fois afin de créer/modifier tous les skins dans la db
     */
    static async init() {
        const repo = getRepository(Skin),
            skins = await repo.find({relations: ["users"]}),
            relations = skins.map(s => ({skin: s.id, users: s.users}));
        let users;

        const blanc = skins.splice(skins.findIndex(s => s.id === SkinId.Blanc), 1)[0] ?? new Skin();
        blanc.name = "Villageois blanc";
        blanc.lien = "blanc";
        blanc.price = 0;
        blanc.id = SkinId.Blanc;
        blanc.users = [];
        await repo.save(blanc);
        users = relations.find(r => r.skin === SkinId.Blanc)?.users;
        if (users)
            await repo.createQueryBuilder().relation(User, "skins").of(users).add(SkinId.Blanc);

        const bleu = skins.splice(skins.findIndex(s => s.id === SkinId.Bleu), 1)[0] ?? new Skin();
        bleu.name = "Villageois bleu";
        bleu.lien = "bleu";
        bleu.price = 0;
        bleu.id = SkinId.Bleu;
        bleu.users = [];
        await repo.save(bleu);
        users = relations.find(r => r.skin === SkinId.Bleu)?.users;
        if (users)
            await repo.createQueryBuilder().relation(User, "skins").of(users).add(SkinId.Bleu);

        const bleu_clair = skins.splice(skins.findIndex(s => s.id === SkinId.BleuClair), 1)[0] ?? new Skin();
        bleu_clair.name = "Villageois bleu clair";
        bleu_clair.lien = "bleu_clair";
        bleu_clair.price = 0;
        bleu_clair.id = SkinId.BleuClair;
        bleu_clair.users = [];
        await repo.save(bleu_clair);
        users = relations.find(r => r.skin === SkinId.BleuClair)?.users;
        if (users)
            await repo.createQueryBuilder().relation(User, "skins").of(users).add(SkinId.BleuClair);

        const gris = skins.splice(skins.findIndex(s => s.id === SkinId.Gris), 1)[0] ?? new Skin();
        gris.name = "Villageois gris";
        gris.lien = "gris";
        gris.price = 0;
        gris.id = SkinId.Gris;
        gris.users = [];
        await repo.save(gris);
        users = relations.find(r => r.skin === SkinId.Gris)?.users;
        if (users)
            await repo.createQueryBuilder().relation(User, "skins").of(users).add(SkinId.Gris);

        const jaune = skins.splice(skins.findIndex(s => s.id === SkinId.Jaune), 1)[0] ?? new Skin();
        jaune.name = "Villageois jaune";
        jaune.lien = "jaune";
        jaune.price = 0;
        jaune.id = SkinId.Jaune;
        jaune.users = [];
        await repo.save(jaune);
        users = relations.find(r => r.skin === SkinId.Jaune)?.users;
        if (users)
            await repo.createQueryBuilder().relation(User, "skins").of(users).add(SkinId.Jaune);

        const orange = skins.splice(skins.findIndex(s => s.id === SkinId.Orange), 1)[0] ?? new Skin();
        orange.name = "Villageois orange";
        orange.lien = "orange";
        orange.price = 0;
        orange.id = SkinId.Orange;
        orange.users = [];
        await repo.save(orange);
        users = relations.find(r => r.skin === SkinId.Orange)?.users;
        if (users)
            await repo.createQueryBuilder().relation(User, "skins").of(users).add(SkinId.Orange);

        const rose = skins.splice(skins.findIndex(s => s.id === SkinId.Rose), 1)[0] ?? new Skin();
        rose.name = "Villageois rose";
        rose.lien = "rose";
        rose.price = 0;
        rose.id = SkinId.Rose;
        rose.users = [];
        await repo.save(rose);
        users = relations.find(r => r.skin === SkinId.Rose)?.users;
        if (users)
            await repo.createQueryBuilder().relation(User, "skins").of(users).add(SkinId.Rose);

        const rouge = skins.splice(skins.findIndex(s => s.id === SkinId.Rouge), 1)[0] ?? new Skin();
        rouge.name = "Villageois rouge";
        rouge.lien = "rouge";
        rouge.price = 0;
        rouge.id = SkinId.Rouge;
        rouge.users = [];
        await repo.save(rouge);
        users = relations.find(r => r.skin === SkinId.Rouge)?.users;
        if (users)
            await repo.createQueryBuilder().relation(User, "skins").of(users).add(SkinId.Rouge);

        const vert = skins.splice(skins.findIndex(s => s.id === SkinId.Vert), 1)[0] ?? new Skin();
        vert.name = "Villageois vert";
        vert.lien = "vert";
        vert.price = 0;
        vert.id = SkinId.Vert;
        vert.users = [];
        await repo.save(vert);
        users = relations.find(r => r.skin === SkinId.Vert)?.users;
        if (users)
            await repo.createQueryBuilder().relation(User, "skins").of(users).add(SkinId.Vert);

        const vert_clair = skins.splice(skins.findIndex(s => s.id === SkinId.VertClair), 1)[0] ?? new Skin();
        vert_clair.name = "Villageois vert clair";
        vert_clair.lien = "vert_clair";
        vert_clair.price = 0;
        vert_clair.id = SkinId.VertClair;
        vert_clair.users = [];
        await repo.save(vert_clair);
        users = relations.find(r => r.skin === SkinId.VertClair)?.users;
        if (users)
            await repo.createQueryBuilder().relation(User, "skins").of(users).add(SkinId.VertClair);
    }
}