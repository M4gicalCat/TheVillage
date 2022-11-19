import {Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, ManyToOne} from "typeorm";
import {Skin} from "./Skin";
import {Succes} from "./Succes";
import {Role} from "./Role";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    pseudo: string;

    @Column()
    password :string;

    @Column()
    adresseMail: string;

    //Volume entre 0 et 100
    @Column({
        default: 100,
    })
    son: number;

    @Column({
        default: 0
    })
    niveau :number;

    @Column({
        default: 0
    })
    xp: number;

    @Column({
        default: 0
    })
    argent: number;

    @Column({
        default: 0
    })
    nbPartiesGagnees: number;

    @Column({
        default: 0
    })
    nbPartiesJouees: number;

    @Column({
        default: ""
    })
    partie: string;

    @Column()
    avatar: string;

    @ManyToOne(() => Skin)
    skin: Skin;

    @ManyToMany(() => Succes)
    @JoinTable()
    succes: Succes[];

    @ManyToMany(() => Skin, skin => skin.users)
    @JoinTable()
    skins: Skin[];

    @ManyToMany(() => Role, role => role.users)
    @JoinTable()
    roles: Role[];
}