<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fiche Personnage Editable</title>
    <style>
        /* 1. LE CONTENEUR PRINCIPAL */
        .fiche-container {
            position: relative; /* Important : permet de positionner les éléments par dessus */
            width: 100%;
            max-width: 800px;   /* Largeur max pour ordi */
            margin: 0 auto;
        }

        /* 2. L'IMAGE DE FOND */
        .fiche-img {
            width: 100%;
            height: auto;
            display: block;
        }

        /* 3. STYLE DE BASE DES ZONES EDITABLES */
        .editable-zone {
            position: absolute; /* Permet de placer l'élément où on veut */
            font-family: 'Arial', sans-serif;
            font-size: 14px;
            color: #333;
            background: rgba(255, 255, 255, 0.3); /* Légèrement blanc pour voir la zone (mettre à 0 pour invisible) */
            padding: 2px;
            overflow: hidden; /* Empêche le texte de sortir de la case */
        }

        /* Effet quand on clique dessus */
        .editable-zone:focus {
            background: rgba(255, 255, 0, 0.2); /* Surligné jaune quand on écrit */
            outline: none;
        }

        /* --- CONFIGURATION DES ZONES SPÉCIFIQUES (C'est ici que vous réglez les positions) --- */
        
        /* Zone : NOM (Le bandeau en haut) */
        #zone-nom {
            top: 2%;        /* Distance du haut */
            left: 2%;       /* Distance de gauche */
            width: 53%;     /* Largeur de la zone */
            height: 5%;     /* Hauteur de la zone */
            font-size: 20px;
            font-weight: bold;
            display: flex;
            align-items: center;
        }

        /* Zone : VITESSE (Le bouclier) */
        #zone-vitesse {
            top: 10%;
            left: 2%;
            width: 10%;
            height: 7%;
            text-align: center; /* Texte centré */
            font-size: 24px;
            font-weight: bold;
            padding-top: 15px; /* Pour descendre un peu le chiffre */
        }

        /* Zone : CLASSE (Dans la liste à droite) */
        #zone-classe {
            top: 3.5%;
            left: 79%;
            width: 18%;
            height: 2.5%;
        }

        /* Zone : INVENTAIRE (Grand bloc en bas à droite) */
        #zone-inventaire {
            top: 67%;
            left: 63%;
            width: 35%;
            height: 22%;
            font-size: 12px;
            overflow-y: auto; /* Permet de scroller si trop de texte */
            text-align: left;
            vertical-align: top;
        }

    </style>
</head>
<body>

    <div class="fiche-container">
        <img src="C:\Users\lafue\OneDrive\Jdr\C&P\blank.png" alt="Fiche Personnage" class="fiche-img">

        <div id="zone-nom" class="editable-zone" contenteditable="true" data-placeholder="Nom du héros..."></div>
        
        <div id="zone-vitesse" class="editable-zone" contenteditable="true">10</div>

        <div id="zone-classe" class="editable-zone" contenteditable="true">Guerrier</div>

        <div id="zone-inventaire" class="editable-zone" contenteditable="true">
            <ul>
                <li>Épée courte</li>
                <li>Potion de soin</li>
                <li>Corde (10m)</li>
            </ul>
        </div>

    </div>

</body>
</html>