import {Displayable} from "./Displayable";
import {Coordinate} from "./types/Coordinate";
import axios from 'axios';
import {Bush} from "./Props/Bush";
import {ObjectType} from "./types/ObjectType";
import {Size} from "./types/Size";
import {Box} from "./Props/Box";
import {TreeStump} from "./Props/TreeStump";
import {Grass} from "./Grounds/Grass";
import {Flower} from "./Grounds/Flower";
import {Tree} from "./Props/Tree";
import {House} from "./Props/House";
import {PineTree} from "./Props/PineTree";
import {Fork} from "./Props/Fork";
import {Wood} from "./Grounds/Wood";
import {Cobblestone} from "./Grounds/Cobblestone";

export class Environment {

    origine: Coordinate;
    layers: Displayable[][];

    constructor() {
        this.layers = [];
        this.setOrigine({x:0, y:0});
    }

    addToLayer(layer: number, object: Displayable){
        if(!this.layers[layer])
            this.layers[layer] = [];
        object.environment = this;
        this.layers[layer].push(object);
    }

    removeFromLayer(layer: number, object: Displayable){
        if(!this.layers[layer])
            this.layers[layer] = [];
        if(!this.layers[layer].includes(object)) return;
        this.layers[layer].splice(this.layers[layer].indexOf(object), 1);
    }

    setOrigine(origine: Coordinate) {
        this.origine = origine;
    }

    update(){
        for (const layer of this.layers) {
            if(!layer) continue;
            for (const object of layer) {
                object.update();
            }
        }
    }
    async create(ctx: CanvasRenderingContext2D){
        try {
            let value = await axios.get('/map.json');
            for (const object  of value.data.objects as { type: ObjectType, coordonnees: Coordinate, size: Size }[]) {
                switch (object.type){
                    case ObjectType.buisson:
                        let buisson = new Bush(ctx, object.coordonnees, object.size);
                        this.addToLayer(1, buisson);
                        break;
                    case ObjectType.arbre:
                        let arbre = new Tree(ctx, object.coordonnees, object.size);
                        this.addToLayer(1, arbre);
                        break;
                    case ObjectType.caisse:
                        let box = new Box(ctx, object.coordonnees, object.size);
                        this.addToLayer(1, box);
                        break;
                    case ObjectType.maison:
                        let maison = new House(ctx, object.coordonnees, object.size);
                        this.addToLayer(1, maison);
                        break;
                    case ObjectType.sapin:
                        let sapin = new PineTree(ctx, object.coordonnees, object.size);
                        this.addToLayer(1, sapin);
                        break;
                    case ObjectType.fourche:
                        let fourche = new Fork(ctx, object.coordonnees, object.size);
                        this.addToLayer(1, fourche);
                        break;
                    case ObjectType.souche:
                        let souche = new TreeStump(ctx, object.coordonnees, object.size);
                        this.addToLayer(1, souche);
                        break;
                    case ObjectType.fleurs:
                        let fleur = new Flower(ctx, object.coordonnees, object.size);
                        this.addToLayer(0, fleur);
                        break;
                    case ObjectType.herbe:
                        let grass = new Grass(ctx, object.coordonnees, object.size);
                        this.addToLayer(0, grass);
                        break;
                    case ObjectType.pave:
                        let pave = new Cobblestone(ctx, object.coordonnees, object.size);
                        this.addToLayer(0, pave);
                        break;
                    case ObjectType.bois:
                        let bois = new Wood(ctx, object.coordonnees, object.size);
                        this.addToLayer(0, bois);
                        break;
                }
            }
        }catch (error){
            console.log(error);
        }
    }

    move(movement: { x: number, y: number }){
        if(this.origine){
            this.origine.x += movement.x;
            this.origine.y += movement.y;
        }
    }

    setCord(cord: {x: number; y: number}) {
        this.origine = cord;
    }

    setSpeed(speed: number) {
        for (const layer of this.layers) {
            if(!layer) continue;
            for (const object of layer) {
                object.speed = speed;
            }
        }
    }
}