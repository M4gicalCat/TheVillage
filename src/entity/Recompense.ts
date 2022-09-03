import {Column, Entity, getRepository, OneToMany, PrimaryColumn} from "typeorm";
import {Skin} from "./Skin";
import {Role} from "./Role";
import {Roles} from "./types/Roles";
import {SkinId} from "./types/SkinId";

@Entity()
export class Recompense {
    @PrimaryColumn()
    niveau: number;

    @Column()
    gold: number;

    @OneToMany(() => Skin, s => s.recompense)
    skins: Skin[];

    @OneToMany(() => Role, r => r.recompense)
    roles: Role[];

    static async init() {
        const repo = getRepository(Recompense);

        await repo.save({
            niveau: 1,
            gold: 100,
            skins: [{id: SkinId.Blanc} as Skin],
            roles: [{role: Roles.Chasseur} as unknown as Role]
        });

        await repo.save({
            niveau: 2,
            gold: 0,
            skins: [{id: SkinId.Orange} as Skin],
            roles: []
        });

        await repo.save({
            niveau: 3,
            gold: 0,
            skins: [{id: SkinId.Bleu} as Skin],
            roles: []
        });

        await repo.save({
            niveau: 5,
            gold: 50,
            skins: [{id: SkinId.Vert} as Skin],
            roles: []
        });

        await repo.save({
            niveau: 10,
            gold: 100,
            skins: [{id: SkinId.Rouge} as Skin],
            roles: [{id: Roles.Sorciere} as unknown as Role]
        });

        await repo.save({
            niveau: 12,
            gold: 0,
            skins: [{id: SkinId.Jaune} as unknown as Skin],
            roles: []
        });

        await repo.save({
            niveau: 15,
            gold: 50,
            skins: [{id: SkinId.VertClair} as Skin],
            roles: [{id: Roles.Voyante} as unknown as Role]
        });

        await repo.save({
            niveau: 20,
            gold: 100,
            skins: [{id: SkinId.BleuClair} as Skin],
            roles: []
        });

        await repo.save({
            niveau: 30,
            gold: 100,
            skins: [{id: SkinId.Rose} as Skin],
            roles: []
        });

        await repo.save({
            niveau: 40,
            gold: 100,
            skins: [{id: SkinId.Rose} as Skin],
            roles: []
        });

        await repo.save({
            niveau: 50,
            gold: 500,
            skins: [{id: SkinId.Rose} as Skin],
            roles: []
        });
    }
}