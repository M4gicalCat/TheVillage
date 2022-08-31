import {Router} from "express";
import {getLibs} from "../scripts/libs";
import {User} from "../entity/User";
import {getRepository} from "typeorm";
import {DiskStorageOptions} from "multer";
const multer  = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/avatars/');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + req.body.userId);
    },
    limits: {
        fileSize: 5000000
    }
} as DiskStorageOptions);

const upload = multer({ storage });
const bcrypt = require('bcrypt');


export function Route(router: Router) {

    router.get('/', (req, res) => {
        res.render('main/menu', {user: (req.user as User)?.id});
    });

    router.get('/loading', (req, res) => {
        res.render('main/chargement');
    });

    router.get('/options',  (req, res) => {
        res.render('main/options', {
            user: req.user
        });
    });
    router.get('/choice', (req, res) => {
        res.render('main/choice', {
            user: req.user
        });
    });


    router.put('/options/pseudo', async (req, res) => {
        if (/<|>| /g.test(req.body.pseudo)) {
            return res.send({
                result: "bad characters : < >",
                status: 400
            });
        }
        let user = req.user as User;
        user.pseudo = req.body.pseudo;
        await getRepository(User).save(user);
        res.send({
            result: "ok",
            status: 200
        });
   });

    router.put("/options/son", async (req, res) => {
        const {son} = req.body;
        const user = req.user as User;
        user.son = Number.parseInt(son);
        if (isNaN(user.son)) return res.status(400).send("Valeur incorrecte");
        await getRepository(User).save(user);
        return res.status(200).send();
    });

    router.put('/options/email', async (req, res) => {
        let password = req.body.password;
        let user = req.user as User
        if (!(await bcrypt.compare(password, user.password))){
            res.send({
                result: "bad"
            });
        }else{
            user.adresseMail = req.body.email;
            await getRepository(User).save(user);
            res.send({
                result: "ok"
            });
        }
    });

    router.post("/options/avatar_pic", upload.single("avatar"), async (req, res) => {
        let user = (req.user as User);
        if (user.avatar !== `avatar-${user.id}`) {
            user.avatar = `avatar-${user.id}`;
            await getRepository(User).save(user);
        }
        res.redirect("/options");
    });

    router.post("/options/avatar_col", async (req, res) => {
        let user = (req.user as User);
        user.avatar = `${req.body.avatar}`;
        await getRepository(User).save(user);
        res.redirect("/options");
    });

    router.get('/profil', async (req, res) => {
        res.render('main/profil', {
            user: (await getRepository(User).findOne((req.user as User).id, {relations: ["roles", "skins", "skin"]})),
        });
    });

    router.put("/profil/skin", async (req, res) => {
        try {
            const u = req.user as User;
            const repo = getRepository(User);
            const {skins} = await repo.findOne(u.id, {relations: ["skins"]});
            const skin = skins.find(s => s.id === +req.body.id);
            if (!skin) {
                return res.status(400).send("Vous ne possédez pas cette apparence");
            }
            u.skin = skin;
            await repo.save(u);
            return res.status(200).send();
        } catch (e) {
            return res.status(400).send("une erreur est survenue, veuillez réessayer");
        }

    });

    router.get("/credits", async(req, res) => {
        let libs = getLibs();
        res.render("main/credits", {lib: JSON.stringify(libs)});
    });
}