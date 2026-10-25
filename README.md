# Hello, Harbour

Une première version jouable d’un jeu d’immersion en anglais, en **3D**, conçu pour le navigateur et les écrans mobiles. Vous incarnez Charlie, un nouvel habitant d’un quartier britannique fictif. Le prénom est personnalisable, un pseudonyme suffit.

## Jouer

- Marchez en touchant le sol, avec les flèches, ZQSD ou WASD. Un joystick apparaît sur mobile.
- Faites glisser le décor pour tourner la caméra ; utilisez la molette ou les boutons + et − pour zoomer. Les commandes de marche suivent l’orientation de la caméra.
- Les boutons de vue d’ensemble et de masquage des panneaux permettent de choisir entre explorer de près, repérer les lieux et profiter du décor. Le calendrier ouvre le détail des étapes du jour.
- Les bâtiments, le plan et le bouton **Rejoindre** permettent de retrouver un habitant à pied, en contournant les bâtiments.
- Chaque journée comprend trois situations : matin, après-midi, soir. Réussir le défi guidé débloque la suite. Les essais sont illimités.
- **Écrire** et **Parler** permettent de s’entraîner librement, puis de comparer sa réponse avec un exemple. Ces modes ne prétendent pas corriger toutes les réponses possibles.
- Le bouton d’activité, à côté de **Parler** près d’un lieu, permet de préparer un petit-déjeuner, manger au café, faire des courses, travailler, bouger ou lire. Ces petites activités sont libres et sans score.
- Gardez des expressions dans votre carnet et rejouez les journées ouvertes depuis **Les 30 jours**.

## Ce qui est inclus

- Un quartier 3D en perspective : façades variées, briques et ardoises texturées, vitrines, fleurs, terrasse, parc, promenade, bateaux, phare et mer animée. Les textures sont générées localement.
- Des personnages humains KayKit sous licence CC0, avec animations de repos, marche, course et interaction, ainsi que des portraits tirés des modèles 3D. Les bâtiments et arbres s’estompent lorsqu’ils masquent le joueur.
- 30 journées, **90 situations distinctes** et des explications en français. Le [parcours détaillé](docs/parcours-30-jours.md) récapitule chaque objectif.
- Un calendrier fictif cohérent du lundi 1er au mardi 30 juin 2026, avec semaines, météo, pluie et lumière de fin de journée. Il ne dépend pas de la météo réelle et ne demande aucune géolocalisation.
- Trois moments par journée. Environ 5 à 10 minutes pour une journée, selon votre rythme ; aucune limite, pénalité de retard ou attente jusqu’au lendemain réel. Le jeu n’avance pas en votre absence.
- Lecture des dialogues avec les voix anglaises du navigateur, si disponibles. Dictée facultative avec `SpeechRecognition` lorsqu’elle est prise en charge ; un mode texte reste disponible.
- Sauvegarde locale, journal, export JSON et effacement limité aux données du jeu.
- Graphismes et polices servis avec le jeu ; aucune image, police ou IA à récupérer auprès d’un fournisseur externe pendant une partie.

## Installer et développer

Prérequis : Node.js 22.12+ ou 24, npm et navigateur récent compatible WebGL 2.

```sh
cd /workspace/Jeu-video
npm ci
npm run dev
```

Le serveur de développement écoute sur le port 5173. Le projet utilise Vite et Three.js, sans backend, compte utilisateur ni clé API. Les versions sont verrouillées dans `package-lock.json`.

```sh
npm run build
npm run preview
```

`dist/` est le site statique à héberger. La base relative permet un déploiement dans le sous-chemin GitHub Pages du dépôt. Le build fait environ 2 Mo non compressés, dont environ 1 Mo de personnages et animations. Les clips inutilisés ont été retirés ; les textures sont générées et aucun fichier audio n’est nécessaire. Les dépendances de développement ne sont pas publiées avec le site.

## Vérifier

```sh
npm test
```

Les cinq tests Playwright vérifient les 90 situations, le chargement des modèles, WebGL, les trajets réels, l’animation du squelette, la caméra et les décors masquants, les modes de vue, les retours après une erreur, les exercices écrits, le carnet, la sauvegarde/reprise, l’interface tactile, le jour 30 et l’effacement des seules données du jeu. Chromium est utilisé à `/usr/bin/chromium` ; définissez `CHROMIUM_PATH` pour un autre chemin. Sur une autre machine, installez Chromium ou adaptez cette variable. Les tests démarrent leur propre serveur sur le port 4173.

Les tests de navigateur sont des simulations de téléphone ; ils ne remplacent pas une validation sur des téléphones physiques. La reconnaissance et la synthèse vocales dépendent du navigateur, de ses permissions, de son fournisseur et des voix installées ; elles ne sont pas garanties sur tous les appareils.

## Publier gratuitement sur GitHub Pages

Le workflow [deploy.yml](.github/workflows/deploy.yml) construit et déploie le site à chaque push sur `main`.

Conserver ce seul workflow de publication. Les modèles GitHub « Static content » et « Jekyll » publient les sources sans la compilation Vite nécessaire et peuvent annuler ce déploiement. L’artefact publié doit être le dossier `dist/`, jamais la racine du dépôt.

1. Dans le dépôt GitHub, ouvrir **Settings → Pages**.
2. Choisir **GitHub Actions** comme source.
3. Lancer ou relancer **Deploy Hello Harbour** dans **Actions**.
4. Attendre le succès du job `deploy` ; utiliser l’URL fournie par GitHub.

Le dépôt doit disposer de GitHub Pages et autoriser les Actions. Ne pas confondre un push réussi avec une mise en ligne réussie : le workflow et la réponse du site doivent être vérifiés.

## Données et limites pédagogiques

La clé `hello-harbour-v1` du stockage local contient le pseudonyme, le jour courant, les situations validées, les compteurs d’essais, les phrases choisies, les activités et les notes facultatives (200 caractères). Le jeu n’envoie pas ces données à un serveur. L’effacement du stockage du navigateur efface aussi cette progression ; l’export JSON permet de la conserver mais l’import n’est pas proposé dans cette version.

Les réponses libres sont gardées uniquement dans le champ pendant l’exercice et ne sont pas sauvegardées. Aucun audio n’est enregistré par le jeu. Si vous activez la dictée, votre navigateur peut transmettre l’audio à son fournisseur ; son autorisation est nécessaire. Utilisez des situations fictives et évitez les informations personnelles. Il n’y a ni publicité, ni analytique, ni chat entre joueurs.

Les personnages suivent des dialogues écrits, sans IA générative. Les pourcentages concernent exclusivement les choix réussis au premier essai. Ils ne mesurent ni un niveau CECRL, ni la prononciation, ni la capacité globale à converser. Les activités de vie sont de courtes interactions ; cette première version n’est pas une simulation exhaustive de la vie quotidienne.

## Structure

| Fichier | Rôle |
| --- | --- |
| `src/world.js` | Ville, personnage, collisions, chemins, météo, caméra, animations et regroupement des géométries |
| `src/scenery.js` | Architecture, textures, côte, mer, végétation et mobilier |
| `src/residents.js` | Chargement des modèles GLB, animation squelettique, portraits et optimisation |
| `src/content.js` | 30 jours, 90 situations, habitants et activités |
| `src/main.js` | Interface, conversations, voix, carnet et commandes tactiles |
| `src/state.js` | Lecture, validation et sauvegarde des données locales |
| `src/style.css` | Interface responsive, typographie et fenêtres de jeu |
| `src/experience.css` | Interface d’exploration compacte et mode sans panneaux |
| `scripts/prepare-characters.py` | Reproduction des ressources avec versions et sommes de contrôle fixes |
| `tests/game.spec.js` | Vérifications fonctionnelles |

Three.js est distribué sous licence MIT. Les polices DM Sans et DM Serif Display sont distribuées sous SIL Open Font License par les paquets Fontsource ; leurs licences sont incluses dans ces dépendances.

Les personnages et animations sont créés par Kay Lousberg / KayKit et distribués sous CC0. Les [crédits et sources versionnées](public/models/CREDITS.md) ainsi que la licence complète sont inclus. Les modèles préparés sont versionnés : le script de préparation n’est pas requis pour installer ou jouer.
