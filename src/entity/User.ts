import {Entity, PrimaryGeneratedColumn, Column, ManyToMany} from "typeorm";
import {Skin} from "./Skin";
import {Succes} from "./Succes";

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

    @Column("date")
    dateDeNaissance: string;

    @Column({
        default: 1
    })
    niveau :number;

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

    @ManyToMany(() => Succes)
    succes: Succes[];

    @ManyToMany(() => Skin)
    skins: Skin[];
}

