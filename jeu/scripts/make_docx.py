#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Génère docs/Chasse-et-Peche-Livret-numerique.docx — livret numérique de
« Chasse & Pêche — Légendes », condensé fidèle du livret de règles officiel
(Règles de Campagne complètes V2) adapté à la version web.

Aucune dépendance : Python 3 standard uniquement (zipfile).
Usage :  python3 scripts/make_docx.py
"""

import os
import zipfile

# ── Contenu du livret : liste (style, texte) ─────────────────────────────
# styles : 'T' titre, 'H1', 'H2', 'N' normal, 'B' puce
LIVRET: list[tuple[str, str]] = [
    ('T', 'Chasse & Pêche — Légendes'),
    ('N', 'Livret numérique des règles de campagne (adaptation web). Version condensée du document '
          '« Règles de Campagne complètes V2 » ; la référence de simulation reste le moteur du classeur.'),
    ('N', 'Un tour représente 2 ans de temps de jeu. La partie oppose jusqu\u2019à 8 joueurs.'),

    ('H1', 'I. Présentation'),
    ('B', 'Chasse et Pêche est un jeu de grande stratégie : développez vos villes, agrandissez votre '
          'territoire, recrutez des armées et faites prospérer votre dynastie.'),
    ('B', 'Chaque joueur incarne un peuple (faction) avec sa culture et son régime politique, et dirige '
          'une population de personnages qui naissent, vieillissent, se marient et meurent.'),
    ('B', 'Les ressources (Bétail, Bois, Charbon, Fer, Pierre, Soie, Or, Nourriture, Science, Tourisme, '
          'Garnison…) font tourner l\u2019économie : chaque tour, stock += production, puis les gains de '
          'population, les taxes et la consommation s\u2019appliquent par ville.'),

    ('H1', 'II. Déroulement de la partie'),
    ('B', 'Avant le premier tour : chaque joueur choisit sa culture, son régime politique et les '
          'caractéristiques de son dirigeant, puis génère sa population initiale (couple royal garanti).'),
    ('B', 'Le premier tour débute sans événement. Le premier joueur tire une carte de dynastie et en '
          'applique l\u2019effet, puis effectue ses actions dans l\u2019ordre de son choix.'),
    ('B', 'À chaque changement de saison (tous les 3 tours), un événement est tiré (table Été ou Hiver) ; '
          'sa dangerosité est 1d6 + modificateur de danger : ≤5 faible, 6-8 moyenne, 9-10 forte, 11+ extrême.'),
    ('B', 'Fin de tour : ressources, carte dynastie, moteur de population (vieillissement, mariages, '
          'naissances, décès, maladies, écoles, influence culturelle, migration), armées, historique.'),

    ('H1', 'III. Les cultures'),
    ('N', 'L\u2019hérédité donne le sexe possible du dirigeant ; la martialité, celui des commandants ; '
          'une culture intolérante à l\u2019homosexualité ne peut en accueillir un comme dirigeant ou commandant.'),
    ('H2', 'a. Chamanisme'),
    ('B', 'Hérédité : les deux · Martialité : masculine · Homosexualité : interdite.'),
    ('B', 'Volonté des esprits : les ministres rapportent +2 Or par tour. Prophétie : la carte Oracle se '
          'tire en trois exemplaires au choix.'),
    ('H2', 'b. Communautarisme'),
    ('B', 'Hérédité : masculine · Martialité : masculine · Homosexualité : interdite.'),
    ('B', 'La communauté avant tout : bonus aux gains de population dans les villes densément peuplées.'),
    ('H2', 'c. Déisme'),
    ('B', 'Hérédité : masculine · Martialité : masculine · Homosexualité : interdite.'),
    ('B', 'Foi structurée : +résistance à la conversion culturelle, temples plus efficaces.'),
    ('H2', 'd. Lunisme'),
    ('B', 'Hérédité : masculine · Martialité : masculine · Homosexualité : interdite.'),
    ('B', 'Cycles lunaires : les événements de nuit influencent récoltes et naissances.'),
    ('H2', 'e. Naturalisme'),
    ('B', 'Hérédité : féminine · Martialité : masculine · Homosexualité : interdite.'),
    ('B', 'Harmonie avec la nature : bonus de Nourriture, guérisseuses réputées (+guérison).'),
    ('H2', 'f. Occultisme'),
    ('B', 'Hérédité : masculine · Martialité : les deux · Homosexualité : autorisée.'),
    ('B', 'Sciences occultes : +Science par tour, écoles supérieures moins chères.'),
    ('H2', 'g. Sethisme'),
    ('B', 'Hérédité : féminine · Martialité : les deux · Homosexualité : autorisée.'),
    ('B', 'Sorcellerie : la capitale produit +1 Science par tour. Adaptation : les déserts produisent 1 Or.'),
    ('H2', 'h. Zélotisme'),
    ('B', 'Hérédité : féminine · Martialité : les deux · Homosexualité : autorisée.'),
    ('B', 'Conversion forcée : +10 Or par rang en cas de victoire militaire. Le Zélotisme avant tout : '
          'les non-Zélotes consomment 2 Or par tour ; les Zélotes résistent mieux à la conversion.'),

    ('H1', 'IV. Régimes politiques'),
    ('N', 'Une crise survient lors d\u2019un tirage de dynastie défavorable ou par action d\u2019un espion. '
          'Une Anarchie se produit si une crise survient alors que le pays était déjà en crise.'),
    ('H2', 'a. Autoritarisme'),
    ('B', 'Crise de l\u2019insoumission : les habitations sans fortification protestent (−5 Or/tour/rang) ; '
          'les autres perdent leur fortification de plus haut rang.'),
    ('H2', 'b. Confédération'),
    ('B', 'Crise d\u2019unité : une habitation menace de sécession ; elle peut rejoindre une autre culture.'),
    ('H2', 'c. Monarchie de droit divin'),
    ('B', 'Crise du concurrent : un personnage aléatoire devient votre nouvel héritier. Épée divine : le '
          'dirigeant commence avec le trait Zélé (héréditaire). Offrande : +3 d\u2019une ressource produite '
          'à chaque fin d\u2019été.'),
    ('H2', 'd. Oligarchie'),
    ('B', 'Crise du soulèvement : une habitation opprimée se révolte.'),
    ('H2', 'e. Thalassocratie'),
    ('B', 'Crise du blocus : routes maritimes interrompues (−Tourisme, −Or du commerce).'),
    ('H2', 'f. Théocratie'),
    ('B', 'Crise du schisme : le clergé se divise (−Influence, −Science).'),
    ('H2', 'g. Sethisme (régime)'),
    ('B', 'Crise des rites : les sorciers exigent des offrandes (−Science, −Or).'),

    ('H1', 'V. Les personnages'),
    ('H2', 'Naissance et sexualité'),
    ('B', 'À la naissance, jetez 1d20 : 1-16 hétérosexuel, 17-18 homosexuel, 19 bisexuel, 20 asexuel.'),
    ('B', 'Traits génétiques : 1d100 dans la table des traits ; pour chaque trait des parents, 1d8 par '
          'trait, sur 4+ l\u2019enfant en hérite (le moteur web applique 40 % par essai, 3 essais par parent).'),
    ('B', 'Consanguinité : deux parents partageant un ascendant direct donnent le trait « Consanguin ».'),
    ('B', 'Un enfant né hors mariage est « Bâtard » ; légitime, il prend la dynastie selon l\u2019hérédité '
          'de la culture (masculine : le père ; féminine : la mère ; parité : au hasard).'),
    ('H2', 'Mariages'),
    ('B', 'Probabilité de mariage : roturiers 0,30 ; deux nobles 0,15 ; mésalliance 0,03. '
          '+0,10 par époux titré (hors Chasseur), ±0,20 maximum d\u2019effets de traits, '
          '+0,10 même culture (−0,10 sinon), −0,005 par an d\u2019écart d\u2019âge, ajustements de bâtardise. '
          'Bornes : 0,01 à 0,90.'),
    ('H2', 'Grossesses et naissances'),
    ('B', 'Conception : 1,5 × facteur d\u2019âge de la femme × facteur d\u2019âge du mari (0,1 si célibataire) '
          '× facteur des traits (0 à 1,6) × facteur de culture × 0,7 si orientation homo/asexuelle × taxes de la ville.'),
    ('B', 'Adultère : 3 % des naissances de femmes mariées. Naissance : 1 enfant (94,9 %), jumeaux (5 %), '
          'triplets (0,1 %).'),
    ('H2', 'Maladies'),
    ('B', 'Probabilité de contracter : 0,05 % + 0,01 % par an d\u2019âge (+3 % si enceinte), réduite par '
          'Herboristerie (−1 %), Clinique (−2 %), Hôpital (−3 %).'),
    ('B', 'Guérison : 25 % − 0,3 % par an d\u2019âge + bonus des bâtiments (+5 % Herboristerie/Clinique, '
          '+15 % Hôpital, +10 % Guilde des Médecins partout). Un malade qui re-contracte meurt ; '
          'une femme enceinte malade perd sa grossesse.'),
    ('H2', 'Éducation'),
    ('B', 'Huit éducations (agricole, renseignements, économique, médicale, militaire, monarchique, '
          'religieuse, scientifique), enseignées par les Professeurs d\u2019une ville possédant une école '
          '(élémentaire, intermédiaire, supérieure).'),
    ('B', 'Un mineur est éduqué avec une chance par tour : (0,15 noble / 0,08 roturier) × rang d\u2019école '
          '× (1 + 0,1 par Professeur supplémentaire). Un adulte sans titre reçoit à 16 ans le titre lié à '
          'son éducation (Chasseur par défaut, toujours Chasseur pour les bâtards).'),
    ('H2', 'Postes et titres'),
    ('B', 'Dirigeant : unique, sa mort déclenche la succession (Héritier vivant, sinon noble adulte '
          'promu — Crise de succession —, sinon poste vacant).'),
    ('B', 'Gouverneur : un seul par ville. Professeurs : nombre plafonné au rang de l\u2019école de la ville.'),
    ('B', 'Ministres et Courtisans rapportent des revenus ; les titres rapportent des gains par tour '
          '(cf. table des Titres, modulés par les taxes : Faible ×0,5 Or/×1,5 naissances, Forte ×1,5/×0,5).'),
    ('H2', 'Influence culturelle'),
    ('B', 'Chaque personnage vivant (hors Dirigeant) a 10 % de chance par tour de changer de culture : '
          'la nouvelle culture est tirée selon la pression touristique mondiale et la présence locale (×5).'),

    ('H1', 'VI. Habitations et aménagements'),
    ('B', 'Chaque habitation possède une enceinte et des aménagements : Champ (+10 nourritures en été), '
          'Bateau de pêche (+10 nourritures), Carrière (+1 Pierre), Mine d\u2019Or (+4 Or), Mine de Fer '
          '(+1 Fer), Mine de Charbon (+1 Charbon), Foire (+2 Or, +4 Tourisme), Centre équestre (+1 Cheval), '
          'Temple (+1 Tourisme, +résistance à la conversion), etc.'),
    ('B', 'La capitale est toujours de la culture de votre peuple ; les habitations d\u2019une autre '
          'culture ne donnent pas leurs bonus culturels.'),

    ('H1', 'VII. Le pays et ses rangs'),
    ('B', 'Les rangs s\u2019achètent avec de l\u2019Or : Baronnie (par défaut, 2 habitations max, +3 résistance), '
          'Comté (50 Or), puis rangs supérieurs. Chaque rang donne une loi de partition, un bonus de fin '
          'd\u2019été et de fin d\u2019hiver, et un nombre maximum d\u2019habitations.'),
    ('B', 'Loi de partition (Baronnie) : à la mort du dirigeant, un enfant hérite ; le reste rejoint les '
          'factions libres.'),

    ('H1', 'VIII. Espionnage'),
    ('B', 'Recruter un espion coûte 3 Soies et 20 Or (entretien 1 Soie/tour). Un espion chez l\u2019adversaire '
          'génère 1 Manigance/tour ; un espion chez soi génère 1 Protection si un espion ennemi est présent. '
          '5 Or = 1 Protection à tout moment.'),
    ('B', 'Exemples de manigances : Arrêter les marchands (7), Sabotage (cf. table complète du livret).'),

    ('H1', 'IX. Les décisions'),
    ('B', 'Une fois par saison : Adoption (30 Or, enfant avec le trait Adopté), Déverrouillage des '
          'croisades (guerre contre une culture voisienne, conversion en cas de victoire), etc.'),

    ('H1', 'X. Les armées'),
    ('B', 'Lever une armée : choisir un commandant noble adulte libre, fixer une puissance cible (45-300). '
          'Un Général vaut 45 points, un soldat 15 points (adulte 16-30 ans, conforme à la martialité).'),
    ('B', 'Chaque tour, l\u2019armée recrute jusqu\u2019à sa puissance cible ; un commandant mort doit être '
          'remplacé. La dissolution re-titre les soldats « Chasseur ».'),

    ('H1', 'XI. Cartes dynastie'),
    ('B', 'Chaque tour, chaque joueur tire une carte : Oracle, Étoile montante, Héritage contesté, '
          'Union providentielle, Anoblissement, Disgrâce, Prophétie, Trésor oublié, Famine dynastique, '
          'Sang neuf, Guerre de succession, Ère de prospérité…'),

    ('H1', 'XII. Déterminer le vainqueur'),
    ('B', 'Militaire : détruire toutes les armées des autres joueurs.'),
    ('B', 'Économique : posséder une citadelle et générer plus de 50 % de l\u2019Or mondial à chaque tour '
          '(75 % en lvl).'),
    ('B', 'Culturelle : citadelle + plus de 50 % du Tourisme mondial, et 50 % des habitations mondiales '
          'de la culture de votre capitale.'),
    ('B', 'Scientifique : découvrir toutes les technologies.'),
    ('B', 'Démographique : au moins 5 habitations dont 3 citadelles et un excédent de 100 Nourriture par tour.'),
    ('B', 'Dynastique (extension 1) : la dynastie de votre dirigeant possède 2 Gouverneurs, 4 personnages '
          'd\u2019éducation de rang 3 et 10 personnages au total ; 33 % des personnages mondiaux à votre cour.'),
    ('B', 'Trouver le Saint Graal (extension 2) : réunir trois Artéfacts Légendaires et conserver le Saint '
          'Graal trois tours, avec une citadelle et deux Merveilles.'),

    ('N', '— Fin du livret numérique. Les valeurs de simulation détaillées (constantes de population, '
          'pondérations des événements, tables de titres et de traits) sont documentées dans le code du '
          'moteur et consultables dans l\u2019onglet Référentiels du jeu. —'),
]

# ── Gabarits OOXML ────────────────────────────────────────────────────────
CT = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>'''

RELS = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>'''

DOC_RELS = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>'''

STYLES = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr>
<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
<w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:styleId="Titre"><w:name w:val="Titre"/>
<w:pPr><w:spacing w:after="300"/></w:pPr>
<w:rPr><w:sz w:val="56"/><w:b/><w:color w:val="7B5310"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="H1"><w:name w:val="Titre 1"/>
<w:pPr><w:spacing w:before="360" w:after="160"/><w:outlineLvl w:val="0"/></w:pPr>
<w:rPr><w:sz w:val="32"/><w:b/><w:color w:val="7B5310"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="H2"><w:name w:val="Titre 2"/>
<w:pPr><w:spacing w:before="240" w:after="120"/><w:outlineLvl w:val="1"/></w:pPr>
<w:rPr><w:sz w:val="26"/><w:b/><w:color w:val="8A6D3B"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Normal"><w:name w:val="Normal"/>
<w:pPr><w:spacing w:after="140" w:line="276" w:lineRule="auto"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Puce"><w:name w:val="Liste Puce"/>
<w:pPr><w:ind w:left="420" w:hanging="280"/><w:spacing w:after="100" w:line="276" w:lineRule="auto"/></w:pPr>
<w:rPr/></w:style>
</w:styles>'''


def esc(s: str) -> str:
    return (s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'))


def para(style: str, text: str) -> str:
    style_map = {'T': 'Titre', 'H1': 'H1', 'H2': 'H2', 'N': 'Normal', 'B': 'Puce'}
    if style == 'B':
        run = '<w:r><w:t xml:space="preserve">\u2022 </w:t></w:r>'
    else:
        run = ''
    return (
        f'<w:p><w:pPr><w:pStyle w:val="{style_map[style]}"/></w:pPr>'
        f'{run}<w:r><w:t xml:space="preserve">{esc(text)}</w:t></w:r></w:p>'
    )


def build_document() -> str:
    sect = ('<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>'
            '<w:pgMar w:top="1418" w:right="1418" w:bottom="1418" w:left="1418"/></w:sectPr>')
    body = ''.join(para(style, text) for style, text in LIVRET)
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
            f'<w:body>{body}{sect}</w:body></w:document>')


def main() -> None:
    out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                       'docs', 'Chasse-et-Peche-Livret-numerique.docx')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', CT)
        z.writestr('_rels/.rels', RELS)
        z.writestr('word/document.xml', build_document())
        z.writestr('word/_rels/document.xml.rels', DOC_RELS)
        z.writestr('word/styles.xml', STYLES)
    print(f'OK : {out} ({len(LIVRET)} paragraphes)')


if __name__ == '__main__':
    main()
