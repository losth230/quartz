// src/engine/rng.ts
function makeRng(seed) {
  let s = seed >>> 0;
  function next() {
    s = s + 1831565813 >>> 0;
    let t = s;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    die: (n) => 1 + Math.floor(next() * n),
    chance: (p) => next() < p,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    pickWeighted: (items, weight) => {
      const total = items.reduce((s2, it) => s2 + Math.max(0, weight(it)), 0);
      if (total <= 0) return items[Math.floor(next() * items.length)];
      let r = next() * total;
      for (const it of items) {
        r -= Math.max(0, weight(it));
        if (r <= 0) return it;
      }
      return items[items.length - 1];
    },
    shuffle: (arr) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    state: () => s
  };
}

// src/config/referentiels.json
var referentiels_default = {
  init: {
    nbPerso: 20,
    pourcentageMarie: 0.5,
    nbNoble: 1,
    ageDefaut: 18,
    orientationDefaut: "H\xE9t\xE9rosexuelle",
    sexeDefaut: "M"
  },
  genres: [
    {
      nom: "F\xE9minin",
      poids: 51
    },
    {
      nom: "Masculin",
      poids: 49
    }
  ],
  orientations: [
    {
      nom: "H\xE9t\xE9rosexuelle",
      poids: 80
    },
    {
      nom: "Homosexuelle",
      poids: 8
    },
    {
      nom: "Bisexuelle",
      poids: 8
    },
    {
      nom: "Asexuelle",
      poids: 4
    }
  ],
  agesPoids: [
    {
      age: "1 an",
      poids: 2
    },
    {
      age: "2 ans",
      poids: 3
    },
    {
      age: "3 ans",
      poids: 5
    }
  ],
  traits: [
    {
      name: "Albinos",
      weight: 3,
      heritable: true,
      fertAdd: 0,
      description: "Les unit\xE9s ciblant ce personnage en m\xEAl\xE9e souffrent d'un malus de -1 sur leurs jets d'attaque. Cependant, ce personnage peut poss\xE9der un titre de moins que ceux permis par son rang."
    },
    {
      name: "Avare",
      weight: 3,
      heritable: false,
      fertAdd: 0,
      description: "Si ce personnage poss\xE8de un titre, vos revenus diminuent de 1 Or par rang de votre pays."
    },
    {
      name: "Beau",
      weight: 3,
      heritable: true,
      fertAdd: 0.1,
      description: "Si le jet d'h\xE9r\xE9dit\xE9 donne 5 ou plus, l'enfant obtient le trait Magnifique. Ne peut \xEAtre cumul\xE9 avec Magnifique. Ce personnage b\xE9n\xE9ficie d'un bonus de +1 lorsqu'il tente de convertir un autre personnage \xE0 sa culture."
    },
    {
      name: "B\xE9ni",
      weight: 3,
      heritable: false,
      fertAdd: 0,
      description: "Lorsque ce personnage meurt, jetez un d\xE9, sur 4+ il survit mais perd ce trait."
    },
    {
      name: "Charismatique",
      weight: 3,
      heritable: false,
      fertAdd: 0,
      description: "Toutes les figurines \xE0 3\u2019\u2019 ou moins de ce personnage, lui compris, b\xE9n\xE9ficient d'un bonus de +1 au moral."
    },
    {
      name: "Consanguin",
      weight: 3,
      heritable: true,
      fertAdd: 0,
      description: "Ce personnage perd 1 an d'esp\xE9rance de vie. Ce trait peut \xEAtre cumul\xE9 \xE0 l\u2019infini."
    },
    {
      name: "Cruel",
      weight: 3,
      heritable: false,
      fertAdd: 0,
      description: "Lorsque ce personnage est au pouvoir et qu\u2019une r\xE9volte \xE9clate, jetez 1d6, sur 3+ la r\xE9volte \xE0 trop peur et prend fin, sinon doublez la valeur en point des r\xE9volt\xE9s. Cela fonctionne s\u2019il est gouverneur et que sa ville se r\xE9volte."
    },
    {
      name: "Doyen",
      weight: 3,
      heritable: false,
      fertAdd: 0,
      description: "Ce personnage a une esp\xE9rance de vie de 14 ans (au lieu de 12)."
    },
    {
      name: "Efficace",
      weight: 3,
      heritable: false,
      fertAdd: 0,
      description: "Si ce personnage poss\xE8de un titre, il g\xE9n\xE8re +4 Or."
    },
    {
      name: "Eloquent",
      weight: 3,
      heritable: false,
      fertAdd: 0,
      description: "Si ce personnage est marchand, il g\xE9n\xE8re 2 Or par tour, si ce personnage est propagandiste il g\xE9n\xE8re 6 Tourisme \xE0 sa mort."
    },
    {
      name: "Enfant Sauvage",
      weight: 3,
      heritable: false,
      fertAdd: 0,
      description: "Ce personnage b\xE9n\xE9ficie de la r\xE8gle sp\xE9ciale Sauvagerie mais ne peut poss\xE9der de Titre."
    },
    {
      name: "Fertile",
      weight: 30,
      heritable: false,
      fertAdd: 0.3,
      description: "F\xE9condit\xE9 +3"
    },
    {
      name: "Fort",
      weight: 3,
      heritable: false,
      fertAdd: 0,
      description: "Ce personnage b\xE9n\xE9ficie de +1d6 en m\xEAl\xE9e."
    },
    {
      name: "Fr\xEAle",
      weight: 3,
      heritable: false,
      fertAdd: 0,
      description: "Ce personnage a une esp\xE9rance de vie de 10 ans (au lieu de 14)."
    },
    {
      name: "G\xE9ant",
      weight: 3,
      heritable: false,
      fertAdd: 0,
      description: "Augmente la taille de ce personnage de +1."
    },
    {
      name: "G\xE9nie",
      weight: 3,
      heritable: false,
      fertAdd: 0,
      description: "Ce personnage na\xEEt avec l'\xE9ducation de rang 2 de votre choix."
    },
    {
      name: "Impuissant",
      weight: 3,
      heritable: false,
      fertAdd: -0.3,
      description: "F\xE9condit\xE9 -3"
    },
    {
      name: "Intelligent",
      weight: 3,
      heritable: false,
      fertAdd: 0,
      description: "Ce personnage peut \xEAtre \xE9duqu\xE9 2 fois."
    },
    {
      name: "Magnifique",
      weight: 1,
      heritable: true,
      fertAdd: 0.2,
      description: "Si le jet d'h\xE9r\xE9dit\xE9 est un \xE9chec, l'enfant obtient le trait Beau. Ne peut \xEAtre cumul\xE9 avec Beau. Ce personnage b\xE9n\xE9ficie d'un bonus de +1 lorsqu'il effectue une conversion culturelle."
    },
    {
      name: "Masochiste",
      weight: 3,
      heritable: false,
      fertAdd: 0,
      description: "Si ce personnage est atteint d'une maladie ou bless\xE9 en bataille, g\xE9rerez 3 de la ressource de base de votre choix et 3 Sciences."
    },
    {
      name: "Maudit",
      weight: 3,
      heritable: true,
      fertAdd: 0,
      description: "Ce personnage obtient un bonus de 1d6 en m\xEAl\xE9e, cependant, il contracte automatiquement les maladies et ne peut en \xEAtre gu\xE9ri."
    },
    {
      name: "Nanisme",
      weight: 3,
      heritable: true,
      fertAdd: 0,
      description: "Ce personnage ne peut monter \xE0 cheval et souffre d\u2019un malus de -1 en Taille."
    },
    {
      name: "Pacifique",
      weight: 3,
      heritable: false,
      fertAdd: 0,
      description: "Ce personnage ne peut combattre. Quiconque ex\xE9cute ce personnage d\xE9clenche une R\xE9volte dans sa capitale."
    },
    {
      name: "Patriarche/Matriarche",
      weight: 3,
      heritable: true,
      fertAdd: 0,
      description: "Lorsque ce personnage enfante, jetez un d\xE9, sur 6+ l'enfant aura un trait g\xE9n\xE9tique al\xE9atoire suppl\xE9mentaire."
    },
    {
      name: "Pied bot",
      weight: 3,
      heritable: false,
      fertAdd: 0,
      description: "Ce personnage souffre d\u2019un malus de -1 en Vit et -1d6 en m\xEAl\xE9e."
    },
    {
      name: "Proph\xE8te",
      weight: 3,
      heritable: false,
      fertAdd: 0,
      description: "Quand ce personnage se trouve dans une cit\xE9 d'une culture diff\xE9rente et qu'il tente de la convertir \xE0 sa culture, il le fait avec un bonus de +2. Ses enfants b\xE9n\xE9ficient ensuite de Sang Divin."
    },
    {
      name: "R\xE9incarnation",
      weight: 3,
      heritable: false,
      fertAdd: 0,
      description: "Ce personnage est la r\xE9incarnation d'un de ses l\xE9gendaires anc\xEAtres. Choisissez l\u2019anc\xEAtre de votre choix, il conserve tous ses traits g\xE9n\xE9tiques et son \xE9ducation mais perd ses maladies (sauf touch\xE9 par les dieux)."
    },
    {
      name: "Sang Divin",
      weight: 3,
      heritable: true,
      fertAdd: 0,
      description: "Quand ce personnage se trouve dans une cit\xE9 d'une culture diff\xE9rente et qu'il tente de la convertir \xE0 sa culture, il le fait avec un bonus de +1."
    },
    {
      name: "Sang pur",
      weight: 3,
      heritable: true,
      fertAdd: 0,
      description: "Lorsque ce personnage enfante, jetez deux d\xE9s pour les traits g\xE9n\xE9tiques et choisissez celui que vous gardez."
    },
    {
      name: "Savant",
      weight: 3,
      heritable: false,
      fertAdd: 0,
      description: "Si ce personnage poss\xE8de un Titre, il g\xE9n\xE8re +1 Science par tour."
    },
    {
      name: "St\xE9rile",
      weight: 3,
      heritable: false,
      fertAdd: -10,
      description: ""
    },
    {
      name: "Stupide",
      weight: 3,
      heritable: false,
      fertAdd: 0,
      description: "Ce personnage ne peut poss\xE9der de Titre."
    },
    {
      name: "Terrifiant",
      weight: 3,
      heritable: false,
      fertAdd: 0,
      description: "Tous les mod\xE8les situ\xE9es \xE0 6\u2019\u2019 de ce personnage ou moins souffrent d\u2019un malus de -1 au moral."
    },
    {
      name: "Th\xE9ologien",
      weight: 3,
      heritable: false,
      fertAdd: 0,
      description: "Ce personnage g\xE9n\xE8re 5 Tourisme."
    },
    {
      name: "Touch\xE9 par les dieux",
      weight: 3,
      heritable: true,
      fertAdd: 0,
      description: "Quand ce personnage enfante, jetez un d\xE9, sur 5+ il obtient al\xE9atoirement le trait : 1 \u2013 Intelligent ; 2 \u2013 Fertile ; 3 \u2013 Fort ; 4 \u2013 Charismatique."
    },
    {
      name: "Vif",
      weight: 3,
      heritable: false,
      fertAdd: 0.1,
      description: "Ce personnage b\xE9n\xE9ficie d\u2019un bonus de +2 en Vit."
    },
    {
      name: "Z\xE9l\xE9",
      weight: 3,
      heritable: false,
      fertAdd: 0,
      description: "Ce personnage obtient un bonus de +2 \xE0 la r\xE9sistance \xE0 la conversion culturelle ainsi qu'un bonus de +2d6 lorsqu'il combat une arm\xE9e d'une culture diff\xE9rente. De plus, il ne peut pas effectuer d\u2019action de repli ni d\xE9route et r\xE9ussira automatiquement tous ses jets de moral."
    }
  ],
  events: [
    {
      nom: "S\xE9cheresse",
      poids: 5,
      saison: "\xC9t\xE9",
      faible: "Les champs ne produisent rien pendant l'\xE9t\xE9.",
      moyenne: "Les champs ne produisent rien pendant l'\xE9t\xE9.",
      forte: "Les champs et marais ne produisent rien pendant l'\xE9t\xE9.",
      extreme: "Les champs et marais ne produisent rien pendant l'\xE9t\xE9."
    },
    {
      nom: "Explosion volcanique",
      poids: 8,
      saison: "\xC9t\xE9",
      faible: "Tous les volcans produisent instantan\xE9ment 5 Sciences.",
      moyenne: "Tous les volcans produisent instantan\xE9ment 10 Sciences. Les volcans explosent et d\xE9truisent les am\xE9nagements adjacents.",
      forte: "Tous les volcans produisent instantan\xE9ment 10 Sciences. Les volcans explosent et d\xE9truisent les am\xE9nagements adjacents.",
      extreme: "Tous les volcans produisent instantan\xE9ment 15 Sciences. Les volcans explosent et d\xE9truisent les am\xE9nagements \xE0 2 cases ou moins."
    },
    {
      nom: "Innondation",
      poids: 7,
      saison: "\xC9t\xE9",
      faible: "Tous les marais sont innond\xE9s, d\xE9truisant leurs am\xE9nagements et immobilise les arm\xE9es et  personnages s'y trouvant.",
      moyenne: "Tous les marais et plaines adjacentes \xE0 la mer, rivi\xE8re et lacs sont innond\xE9s, d\xE9truisant leurs am\xE9nagements et immobilise les arm\xE9es et  personnages s'y trouvant.",
      forte: "Tous les marais, ainsi que les plaines et d\xE9serts adjacents \xE0 la mer, rivi\xE8re et lacs sont innond\xE9s, d\xE9truisant leurs am\xE9nagements et immobilise les arm\xE9es et  personnages s'y trouvant.",
      extreme: "Tous les marais, ainsi que les plaines, d\xE9serts et for\xEAts adjacents \xE0 la mer, rivi\xE8re et lacs sont innond\xE9s, d\xE9truisant leurs am\xE9nagements et immobilise les arm\xE9es et  personnages s'y trouvant."
    },
    {
      nom: "Barbarisme",
      poids: 5,
      saison: "\xC9t\xE9",
      faible: "1 arm\xE9e apparait dans 1 cit\xE9 libre al\xE9atoire et attaque le joueur le plus proche, sa puissance est \xE9gale \xE0 1d20 par num\xE9ro du tour.",
      moyenne: "2 arm\xE9es apparait dans 2 cit\xE9s libres al\xE9atoire et attaquent le joueur le plus proche, leur puissance est \xE9gale \xE0 1d20 par num\xE9ro du tour.",
      forte: "3 arm\xE9es apparait dans 3 cit\xE9s libres al\xE9atoire et attaquent le joueur le plus proche, leur puissance est \xE9gale \xE0 1d20 par num\xE9ro du tour.",
      extreme: "1 arm\xE9es apparait dans chaque cit\xE9 libre et attaque le joueur le plus proche, leur puissance est \xE9gale \xE0 1d20 par num\xE9ro du tour."
    },
    {
      nom: "Brigandage",
      poids: 8,
      saison: "\xC9t\xE9",
      faible: "Tous les joueurs perdent 6 Or par rang de leur pays, ou de la Nourriture s'ils n'ont plus d'Or.",
      moyenne: "Tous les joueurs perdent 12 Or par rang de leur pays, ou de la Nourriture s'ils n'ont plus d'Or.",
      forte: "Tous les joueurs perdent 20 Or par rang de leur pays, ou de la Nourriture s'ils n'ont plus d'Or.",
      extreme: "Tous les joueurs perdent 35 Or par rang de leur pays, ou de la Nourriture s'ils n'ont plus d'Or."
    },
    {
      nom: "Incendie",
      poids: 7,
      saison: "\xC9t\xE9",
      faible: "Une case al\xE9atoire se transforme  en d\xE9sert.",
      moyenne: "Deux cases al\xE9atoires se transforment  en d\xE9sert.",
      forte: "Trois cases al\xE9atoires se transforment  en d\xE9sert.",
      extreme: "Cinq cases al\xE9atoires se transforment  en d\xE9sert."
    },
    {
      nom: "Radiations solaires",
      poids: 3,
      saison: "\xC9t\xE9",
      faible: "Si au moins 6 cases ont \xE9t\xE9 transform\xE9es en d\xE9sert via des Incendies, 3 cases deviennent des d\xE9serts.",
      moyenne: "Si au moins 6 cases ont \xE9t\xE9 transform\xE9es en d\xE9sert via des Incendies, 5 cases deviennent des d\xE9serts.",
      forte: "Si au moins 6 cases ont \xE9t\xE9 transform\xE9es en d\xE9sert via des Incendies, 8 cases deviennent des d\xE9serts.",
      extreme: "Si au moins 6 cases ont \xE9t\xE9 transform\xE9es en d\xE9sert via des Incendies, 12 cases deviennent des d\xE9serts."
    },
    {
      nom: "Ouragan",
      poids: 5,
      saison: "\xC9t\xE9",
      faible: "Un ouragan de 1 case de rayon apparait sur une case al\xE9atoire, en fonction de la case sur laquelle il apparait, regardez son effet\xA0:\n\u2022	D\xE9sert : toute arm\xE9e ou habitation travers\xE9e par l\u2019ouragan doit imm\xE9diatement payer sa consommation en nourriture, r\xE9duit de 1 PM les d\xE9placements des arm\xE9es et la case centrale sur laquelle termine l\u2019ouragan chaque tour se transforme en d\xE9sert. Il persiste jusqu\u2019\xE0 la fin de l\u2019\xE9t\xE9.\n\u2022	Plaine : lorsque cet ouragan rencontre une arm\xE9e, il l\u2019emm\xE8ne avec lui et r\xE9duit ses PM \xE0 0. Jetez un d\xE9 pour chaque am\xE9nagement travers\xE9, sur 6+ il est d\xE9truit. Il se termine \xE0 la fin de l\u2019\xE9t\xE9. A la fin de l\u2019hiver il se transforme en temp\xEAte de neige sur 5+ et sinon il se termine.\n\u2022	Lac : Chaque case travers\xE9e perd ses Garnison et B\xE2timent de faction. A la fin de l\u2019hiver il se transforme en temp\xEAte de neige sur 4+ et sinon il se termine.\n\u2022	Montagne : chaque case de ville travers\xE9e octroie 1 Pierre \xE0 son propri\xE9taire. D\xE9truit tous les am\xE9nagements travers\xE9s. Jetez un d\xE9 pour chaque unit\xE9 travers\xE9e, sur 6+ elle perd 1 Blessure. A la fin de l\u2019hiver il se transforme en temp\xEAte de neige sur 4+ et sinon il se termine.\n\u2022	Volcan : chaque case de ville travers\xE9e octroie 1 Science \xE0 son propri\xE9taire. D\xE9truit tous les am\xE9nagements travers\xE9s. Jetez un d\xE9 pour chaque ressource travers\xE9e, sur 8+ elle est retir\xE9e du jeu. Jetez un d\xE9 pour chaque unit\xE9 travers\xE9e, sur 5+ elle perd 1Bl, sur 7+ elle perd 2Bl, sur 8+ elle perd 4Bl. D\xE9truit \xE9galement les b\xE2timents de faction et les Garnisons. A la fin de chaque saison il continue sur 4+ et sinon il se termine. A la fin de chaque ann\xE9e augmente sa puissance de razzia de 1.\n\u2022	For\xEAt : chaque case de ville travers\xE9e octroie 1 Bois \xE0 son propri\xE9taire. D\xE9truit tous les am\xE9nagements travers\xE9s. Jetez un d\xE9 pour chaque unit\xE9 travers\xE9e, sur 6+ elle perd 1 Blessure.\n\u2022	Marais : lorsque l\u2019ouragan rencontre des arm\xE9es ou des villes, jetez un d\xE9 pour chaque personnage rencontr\xE9, sur 7+ il contracte une maladie al\xE9atoire. A la fin de l\u2019hiver il se transforme en temp\xEAte de neige sur 4+ et sinon il se termine.\n\u2022	Un ouragan se d\xE9place de 2d8 dans une direction al\xE9atoire chaque tour.\n\u2022	Temp\xEAte de neige : les cases d\u2019eaux travers\xE9es sont gel\xE9es jusqu\u2019\xE0 la fin de l\u2019hiver, et les arm\xE9es travers\xE9es voient leur vitesse r\xE9duite \xE0 0 PM. A la fin de l\u2019hiver elle se transforme en ouragan relatif \xE0 sa case d\u2019arriv\xE9e.",
      moyenne: "Un ouragan de 1 case de rayon apparait sur une case al\xE9atoire, en fonction de la case sur laquelle il apparait, regardez son effet\xA0:\n\u2022	D\xE9sert : toute arm\xE9e ou habitation travers\xE9e par l\u2019ouragan doit imm\xE9diatement payer sa consommation en nourriture, r\xE9duit de 1 PM les d\xE9placements des arm\xE9es et la case centrale sur laquelle termine l\u2019ouragan chaque tour se transforme en d\xE9sert. Il persiste jusqu\u2019\xE0 la fin de l\u2019\xE9t\xE9.\n\u2022	Plaine : lorsque cet ouragan rencontre une arm\xE9e, il l\u2019emm\xE8ne avec lui et r\xE9duit ses PM \xE0 0. Jetez un d\xE9 pour chaque am\xE9nagement travers\xE9, sur 6+ il est d\xE9truit. Il se termine \xE0 la fin de l\u2019\xE9t\xE9. A la fin de l\u2019hiver il se transforme en temp\xEAte de neige sur 5+ et sinon il se termine.\n\u2022	Lac : Chaque case travers\xE9e perd ses Garnison et B\xE2timent de faction. A la fin de l\u2019hiver il se transforme en temp\xEAte de neige sur 4+ et sinon il se termine.\n\u2022	Montagne : chaque case de ville travers\xE9e octroie 1 Pierre \xE0 son propri\xE9taire. D\xE9truit tous les am\xE9nagements travers\xE9s. Jetez un d\xE9 pour chaque unit\xE9 travers\xE9e, sur 6+ elle perd 1 Blessure. A la fin de l\u2019hiver il se transforme en temp\xEAte de neige sur 4+ et sinon il se termine.\n\u2022	Volcan : chaque case de ville travers\xE9e octroie 1 Science \xE0 son propri\xE9taire. D\xE9truit tous les am\xE9nagements travers\xE9s. Jetez un d\xE9 pour chaque ressource travers\xE9e, sur 8+ elle est retir\xE9e du jeu. Jetez un d\xE9 pour chaque unit\xE9 travers\xE9e, sur 5+ elle perd 1Bl, sur 7+ elle perd 2Bl, sur 8+ elle perd 4Bl. D\xE9truit \xE9galement les b\xE2timents de faction et les Garnisons. A la fin de chaque saison il continue sur 4+ et sinon il se termine. A la fin de chaque ann\xE9e augmente sa puissance de razzia de 1.\n\u2022	For\xEAt : chaque case de ville travers\xE9e octroie 1 Bois \xE0 son propri\xE9taire. D\xE9truit tous les am\xE9nagements travers\xE9s. Jetez un d\xE9 pour chaque unit\xE9 travers\xE9e, sur 6+ elle perd 1 Blessure.\n\u2022	Marais : lorsque l\u2019ouragan rencontre des arm\xE9es ou des villes, jetez un d\xE9 pour chaque personnage rencontr\xE9, sur 7+ il contracte une maladie al\xE9atoire. A la fin de l\u2019hiver il se transforme en temp\xEAte de neige sur 4+ et sinon il se termine.\n\u2022	Un ouragan se d\xE9place de 2d8 dans une direction al\xE9atoire chaque tour.\n\u2022	Temp\xEAte de neige : les cases d\u2019eaux travers\xE9es sont gel\xE9es jusqu\u2019\xE0 la fin de l\u2019hiver, et les arm\xE9es travers\xE9es voient leur vitesse r\xE9duite \xE0 0 PM. A la fin de l\u2019hiver elle se transforme en ouragan relatif \xE0 sa case d\u2019arriv\xE9e sur 4+ et sinon se termine.",
      forte: "Un ouragan de 2 cases de rayon apparait sur une case al\xE9atoire, en fonction de la case sur laquelle il apparait, regardez son effet\xA0:\n\u2022	D\xE9sert : toute arm\xE9e ou habitation travers\xE9e par l\u2019ouragan doit imm\xE9diatement payer sa consommation en nourriture, r\xE9duit de 1 PM les d\xE9placements des arm\xE9es et la case centrale sur laquelle termine l\u2019ouragan chaque tour se transforme en d\xE9sert. Il persiste jusqu\u2019\xE0 la fin de l\u2019\xE9t\xE9.\n\u2022	Plaine : lorsque cet ouragan rencontre une arm\xE9e, il l\u2019emm\xE8ne avec lui et r\xE9duit ses PM \xE0 0. Jetez un d\xE9 pour chaque am\xE9nagement travers\xE9, sur 6+ il est d\xE9truit. Il se termine \xE0 la fin de l\u2019\xE9t\xE9. A la fin de l\u2019hiver il se transforme en temp\xEAte de neige sur 5+ et sinon il se termine.\n\u2022	Lac : Chaque case travers\xE9e perd ses Garnison et B\xE2timent de faction. A la fin de l\u2019hiver il se transforme en temp\xEAte de neige sur 4+ et sinon il se termine.\n\u2022	Montagne : chaque case de ville travers\xE9e octroie 1 Pierre \xE0 son propri\xE9taire. D\xE9truit tous les am\xE9nagements travers\xE9s. Jetez un d\xE9 pour chaque unit\xE9 travers\xE9e, sur 6+ elle perd 1 Blessure. A la fin de l\u2019hiver il se transforme en temp\xEAte de neige sur 4+ et sinon il se termine.\n\u2022	Volcan : chaque case de ville travers\xE9e octroie 1 Science \xE0 son propri\xE9taire. D\xE9truit tous les am\xE9nagements travers\xE9s. Jetez un d\xE9 pour chaque ressource travers\xE9e, sur 8+ elle est retir\xE9e du jeu. Jetez un d\xE9 pour chaque unit\xE9 travers\xE9e, sur 5+ elle perd 1Bl, sur 7+ elle perd 2Bl, sur 8+ elle perd 4Bl. D\xE9truit \xE9galement les b\xE2timents de faction et les Garnisons. A la fin de chaque saison il continue sur 4+ et sinon il se termine. A la fin de chaque ann\xE9e augmente sa puissance de razzia de 1.\n\u2022	For\xEAt : chaque case de ville travers\xE9e octroie 1 Bois \xE0 son propri\xE9taire. D\xE9truit tous les am\xE9nagements travers\xE9s. Jetez un d\xE9 pour chaque unit\xE9 travers\xE9e, sur 6+ elle perd 1 Blessure.\n\u2022	Marais : lorsque l\u2019ouragan rencontre des arm\xE9es ou des villes, jetez un d\xE9 pour chaque personnage rencontr\xE9, sur 7+ il contracte une maladie al\xE9atoire. A la fin de l\u2019hiver il se transforme en temp\xEAte de neige sur 4+ et sinon il se termine.\n\u2022	Un ouragan se d\xE9place de 2d8 dans une direction al\xE9atoire chaque tour.\n\u2022	Temp\xEAte de neige : les cases d\u2019eaux travers\xE9es sont gel\xE9es jusqu\u2019\xE0 la fin de l\u2019hiver, et les arm\xE9es travers\xE9es voient leur vitesse r\xE9duite \xE0 0 PM. A la fin de l\u2019hiver elle se transforme en ouragan relatif \xE0 sa case d\u2019arriv\xE9e sur 4+ et sinon se termine.",
      extreme: "Un ouragan de 3 cases de rayon apparait sur une case al\xE9atoire, en fonction de la case sur laquelle il apparait, regardez son effet\xA0:\n\u2022	D\xE9sert : toute arm\xE9e ou habitation travers\xE9e par l\u2019ouragan doit imm\xE9diatement payer sa consommation en nourriture, r\xE9duit de 1 PM les d\xE9placements des arm\xE9es et la case centrale sur laquelle termine l\u2019ouragan chaque tour se transforme en d\xE9sert. Il persiste jusqu\u2019\xE0 la fin de l\u2019\xE9t\xE9.\n\u2022	Plaine : lorsque cet ouragan rencontre une arm\xE9e, il l\u2019emm\xE8ne avec lui et r\xE9duit ses PM \xE0 0. Jetez un d\xE9 pour chaque am\xE9nagement travers\xE9, sur 6+ il est d\xE9truit. Il se termine \xE0 la fin de l\u2019\xE9t\xE9. A la fin de l\u2019hiver il se transforme en temp\xEAte de neige sur 5+ et sinon il se termine.\n\u2022	Lac : Chaque case travers\xE9e perd ses Garnison et B\xE2timent de faction. A la fin de l\u2019hiver il se transforme en temp\xEAte de neige sur 4+ et sinon il se termine.\n\u2022	Montagne : chaque case de ville travers\xE9e octroie 1 Pierre \xE0 son propri\xE9taire. D\xE9truit tous les am\xE9nagements travers\xE9s. Jetez un d\xE9 pour chaque unit\xE9 travers\xE9e, sur 6+ elle perd 1 Blessure. A la fin de l\u2019hiver il se transforme en temp\xEAte de neige sur 4+ et sinon il se termine.\n\u2022	Volcan : chaque case de ville travers\xE9e octroie 1 Science \xE0 son propri\xE9taire. D\xE9truit tous les am\xE9nagements travers\xE9s. Jetez un d\xE9 pour chaque ressource travers\xE9e, sur 8+ elle est retir\xE9e du jeu. Jetez un d\xE9 pour chaque unit\xE9 travers\xE9e, sur 5+ elle perd 1Bl, sur 7+ elle perd 2Bl, sur 8+ elle perd 4Bl. D\xE9truit \xE9galement les b\xE2timents de faction et les Garnisons. A la fin de chaque saison il continue sur 4+ et sinon il se termine. A la fin de chaque ann\xE9e augmente sa puissance de razzia de 1.\n\u2022	For\xEAt : chaque case de ville travers\xE9e octroie 1 Bois \xE0 son propri\xE9taire. D\xE9truit tous les am\xE9nagements travers\xE9s. Jetez un d\xE9 pour chaque unit\xE9 travers\xE9e, sur 6+ elle perd 1 Blessure.\n\u2022	Marais : lorsque l\u2019ouragan rencontre des arm\xE9es ou des villes, jetez un d\xE9 pour chaque personnage rencontr\xE9, sur 7+ il contracte une maladie al\xE9atoire. A la fin de l\u2019hiver il se transforme en temp\xEAte de neige sur 4+ et sinon il se termine.\n\u2022	Un ouragan se d\xE9place de 2d8 dans une direction al\xE9atoire chaque tour.\n\u2022	Temp\xEAte de neige : les cases d\u2019eaux travers\xE9es sont gel\xE9es jusqu\u2019\xE0 la fin de l\u2019hiver, et les arm\xE9es travers\xE9es voient leur vitesse r\xE9duite \xE0 0 PM. A la fin de l\u2019hiver elle se transforme en ouragan relatif \xE0 sa case d\u2019arriv\xE9e sur 4+ et sinon se termine."
    },
    {
      nom: "Eclipse",
      poids: 3,
      saison: "\xC9t\xE9",
      faible: "Tous les joueurs produisent 1 Science par rang de leur pays. La dangerosit\xE9 des \xE9v\xE8nements augmente de 1 pour le reste de la partie.",
      moyenne: "Tous les joueurs produisent 3 Science par rang de leur pays. La dangerosit\xE9 des \xE9v\xE8nements augmente de 1 pour le reste de la partie.",
      forte: "Tous les joueurs produisent 5 Science par rang de leur pays. La dangerosit\xE9 des \xE9v\xE8nements augmente de 1 pour le reste de la partie.",
      extreme: "Tous les joueurs produisent 8 Science par rang de leur pays. La dangerosit\xE9 des \xE9v\xE8nements augmente de 1 pour le reste de la partie."
    },
    {
      nom: "Famine",
      poids: 7,
      saison: "Hiver",
      faible: "Tous les joueurs perdent 10  Nourriture par rang de leur pays.",
      moyenne: "Tous les joueurs perdent 20  Nourriture par rang de leur pays.",
      forte: "Tous les joueurs perdent 35 Nourriture ar rang de leur pays.",
      extreme: "Tous les joueurs perdent 50  Nourriture par rang de leur pays."
    },
    {
      nom: "Avalanche",
      poids: 15,
      saison: "Hiver",
      faible: "jetez un d\xE9 pour chaque montagne, sur 6+  l'avalanche d\xE9truit les am\xE9nagements adjacents.",
      moyenne: "jetez un d\xE9 pour chaque montagne, sur 5+  l'avalanche d\xE9truit les am\xE9nagements adjacents.",
      forte: "jetez un d\xE9 pour chaque montagne, sur 5+  l'avalanche d\xE9truit les am\xE9nagements adjacents.",
      extreme: "jetez un d\xE9 pour chaque montagne, sur 4+  l'avalanche d\xE9truit les am\xE9nagements adjacents."
    },
    {
      nom: "Blizzard",
      poids: 5,
      saison: "Hiver",
      faible: "Le mouvement de toutes les arm\xE9es est r\xE9duit \xE0 1 PM.",
      moyenne: "Le mouvement de toutes les arm\xE9es est r\xE9duit \xE0 1 PM.",
      forte: "Le mouvement de toutes les arm\xE9es est r\xE9duit \xE0 0 PM.",
      extreme: "Le mouvement de toutes les arm\xE9es est r\xE9duit \xE0 0 PM."
    },
    {
      nom: "Ere glaciaire",
      poids: 5,
      saison: "Hiver",
      faible: "Toutes les rivi\xE8res sont gel\xE9es et peuvent \xEAtre travers\xE9es. Les bateaux sont immobilis\xE9s. La dangerosit\xE9 des \xE9v\xE8nements augmente de 1 pour le reste de la partie.",
      moyenne: "Toutes les rivi\xE8res et lac sont gel\xE9s et peuvent \xEAtre travers\xE9es. Les bateaux sont immobilis\xE9s. La dangerosit\xE9 des \xE9v\xE8nements augmente de 1 pour le reste de la partie.",
      forte: "Toutes les rivi\xE8res, lacs et c\xF4tes sont gel\xE9s et peuvent \xEAtre travers\xE9es. Les bateaux sont immobilis\xE9s. La dangerosit\xE9 des \xE9v\xE8nements augmente de 1 pour le reste de la partie.",
      extreme: "Toutes les rivi\xE8res, lacs et c\xF4tes sont gel\xE9s et peuvent \xEAtre travers\xE9es. Les bateaux sont immobilis\xE9s. La dangerosit\xE9 des \xE9v\xE8nements augmente de 1 pour le reste de la partie."
    },
    {
      nom: "Hiver prolong\xE9",
      poids: 4,
      saison: "Hiver",
      faible: "L'hiver durera 1 tour de plus, la dangerosit\xE9 de ces \xE9v\xE8nements augmente de 1 pour le reste de la partie.",
      moyenne: "L'hiver durera 1 tour de plus, la dangerosit\xE9 de ces \xE9v\xE8nements augmente de 1 pour le reste de la partie.",
      forte: "L'hiver durera 1 tour de plus, la dangerosit\xE9 de ces \xE9v\xE8nements augmente de 1 pour le reste de la partie.",
      extreme: "L'hiver durera 2 tours de plus, la dangerosit\xE9 de ces \xE9v\xE8nements augmente de 1 pour le reste de la partie."
    },
    {
      nom: "Peste",
      poids: 5,
      saison: "Hiver",
      faible: "Toutes les habitations perdent 10 habitants par rang de l'habitation.",
      moyenne: "Toutes les habitations perdent 15 habitants par rang de l'habitation.",
      forte: "Toutes les habitations perdent 20 habitants par rang de l'habitation.",
      extreme: "Toutes les habitations perdent 30 habitants par rang de l'habitation."
    },
    {
      nom: "Gel",
      poids: 3,
      saison: "Hiver",
      faible: "Tous les joueurs doivent retirer 1 case de l'enceinte de leur pays.",
      moyenne: "Tous les joueurs doivent retirer 2 cases de l'enceinte de leur pays.",
      forte: "Tous les joueurs doivent retirer 3 cases de l'enceinte de leur pays.",
      extreme: "Tous les joueurs doivent retirer 5 cases de l'enceinte de leur pays."
    },
    {
      nom: "Redoux",
      poids: 5,
      saison: "Hiver",
      faible: "Une case al\xE9atoire de d\xE9sert devient une plaine.",
      moyenne: "Une case al\xE9atoire de d\xE9sert devient une plaine. Un B\xE9tail apparait dessus.",
      forte: "Deux cases al\xE9atoires de d\xE9sert deviennent des plaines. Un B\xE9tail apparait dessus.",
      extreme: "Trois cases al\xE9atoires de d\xE9sert deviennent des plaines. Un B\xE9tail apparait dessus."
    },
    {
      nom: "Sombres pr\xE9sages",
      poids: 3,
      saison: "Hiver",
      faible: "La dangerosit\xE9 des \xE9v\xE8nements augmente de 1.  1 n\xE9cromancien apparait dans chaque habitation",
      moyenne: "La dangerosit\xE9 des \xE9v\xE8nements augmente de 1. 1 n\xE9cromancien apparait dans chaque habitation",
      forte: "La dangerosit\xE9 des \xE9v\xE8nements augmente de 1. 2 n\xE9cromancien apparait dans chaque habitation",
      extreme: "La dangerosit\xE9 des \xE9v\xE8nements augmente de 1. 3 n\xE9cromancien apparait dans chaque habitation"
    }
  ],
  dynasties: [
    {
      nom: "B\xE9n\xE9diction de Samodiva",
      poids: 1,
      description: "Vos champs, champs de bl\xE9s, p\xE2turages et rizi\xE8res produisent tous instantan\xE9ment 5 Nourritures."
    },
    {
      nom: "Brigandage",
      poids: 1,
      description: "Vous perdez 4 Or par rang du royaume."
    },
    {
      nom: "Etrangers gobelins",
      poids: 1,
      description: "Des \xE9trangers gobelins arrivent aux fronti\xE8res d\u2019une de vos habitations al\xE9atoires. Si vous les refusez, ils prendront les armes contre vous avec une arm\xE9e de 4d20 pts par rang de votre habitation + 1d100 par citadelle que vous poss\xE9dez +2d20 par rang de votre pays. Si vous les acceptez, d\xE9pensez 50% de leur valeur en point en nourriture et gagnez 10% de leur valeur en points sous  forme d'habitants."
    },
    {
      nom: "Crise politique",
      poids: 1,
      description: "Voir R\xE9gime politique."
    },
    {
      nom: "D\xE9couverte d'\xE9pave",
      poids: 1,
      description: "Vous pouvez d\xE9penser 4 Fer et 10 Or pour obtenir un b\xE2teau dans une de vos habitations al\xE9atoires (qui a acc\xE8s \xE0 l'eau)."
    },
    {
      nom: "D\xE9couverte",
      poids: 1,
      description: "Vous gagnez 2 Science par rang de votre royaume."
    },
    {
      nom: "Hommage au roi",
      poids: 1,
      description: "Recevez 2 d\u2019une ressource de base al\xE9atoire par rang de votre royaume."
    },
    {
      nom: "Lassitude",
      poids: 1,
      description: "Un personnage abandonne son titre et ne pourra plus en recevoir par la suite."
    },
    {
      nom: "Manifestation druidique",
      poids: 1,
      description: "Vous devez retirer une case de l\u2019enceinte de votre pays sous peine que vos scieries ne produisent plus de Bois tant que vous ne l\u2019avez pas fait."
    },
    {
      nom: "Marchand ambulant",
      poids: 1,
      description: "Vous pouvez \xE9changez 5 ressources de base de votre choix contre 4 ressources de base de votre choix."
    },
    {
      nom: "Merveille architecturale",
      poids: 1,
      description: "La beaut\xE9 de votre capitale augmente de 5 votre tourisme d\xE9finitivement."
    },
    {
      nom: "Miracle",
      poids: 1,
      description: "Gu\xE9rit la st\xE9rilit\xE9 ou n\u2019importe quelle maladie d\u2019un personnage du pays."
    },
    {
      nom: "Nain \xE9gar\xE9",
      poids: 1,
      description: "Jetez 4d6 +3, vous gagnez un nain (soldat ou guerrier) de votre choix de ce co\xFBt ou moins, (c\u2019est un personnage, tirez ses traits al\xE9atoirement)."
    },
    {
      nom: "Sombre n\xE9cromancie",
      poids: 1,
      description: "Un n\xE9cromancien r\xE9veille les morts dans une de vos habitations al\xE9atoires, r\xE9duisant de 30 par rang de l\u2019habitation la valeur de la garnison de la prochaine attaque qu\u2019elle subit (cumulable si plusieurs n\xE9cromanciens apparaissent dans la m\xEAme habitation)."
    },
    {
      nom: "Guides",
      poids: 1,
      description: "Vous povez d\xE9penser 5 Or par rang de votre royaume pour embaucher un guide permettant \xE0 vos arm\xE9es de traverser les marais et for\xEAts pour 1 PM pour le reste de la saison."
    },
    {
      nom: "Troupe de troubadours",
      poids: 1,
      description: "Des troubadours s\u2019installent dans votre capitale, augmentant de 5 votre tourisme d\xE9finitivement."
    },
    {
      nom: "Voisins vigilants",
      poids: 1,
      description: "Si vous construisez une am\xE9lioration de fortification de b\xE2timent ce tour-ci, celle-ci ne co\xFBte aucun Or."
    },
    {
      nom: "temp\xEAte magique",
      poids: 1,
      description: "Vous pouvez canaliser la temp\xEAte pour obtenir 2 Sciences par rang de votre royaume, ou l'utiliser pour octroyer 1 PM \xE0 vos arm\xE9es pour le reste de la saison."
    },
    {
      nom: "Syst\xE8me de pr\xE9vention",
      poids: 1,
      description: "Vous pouvez d\xE9penser 15 Or par rang de votre royaume pour prot\xE9ger l'habitation de votre choix des effets de la prochaine calamit\xE9. Si vous ne le faites pas, gagnez 5 Or par rang de votre royaume."
    },
    {
      nom: "Sombre proposition",
      poids: 1,
      description: "Des mages noirs vous proposent leurs services, si vous acceptez, placez un n\xE9cromancien dans la ville de votre choix, si vous refusez, gagnez 2 Science et 5 Or par rang de votre royaume."
    },
    {
      nom: "D\xE9couverte arch\xE9ologique",
      poids: 1,
      description: "vous pouvez d\xE9penser 5 Science pour d\xE9couvrir un ressource de Ruines Antiques sur une case de votre choix. Si vous ne le faites pas, gagnez 5 Sciences."
    },
    {
      nom: "Etablissement d'une embassade",
      poids: 1,
      description: "Vous pouvez d\xE9penser 5 fois votre rang de pays en Or et Nourriture pour gagner 10 Influence avec la cit\xE9 libre de votre choix."
    },
    {
      nom: "camp de gitan",
      poids: 1,
      description: "vous pouvez demandez une taxe de 8 Or par rang d'une habitation al\xE9atoire. Si vous refusez, un village tribal apparait al\xE9atoirement dans l'enceinte de l'habitation."
    },
    {
      nom: "R\xE9volte",
      poids: 2,
      description: "Vos villes d\u2019une autre culture se r\xE9voltent (4d20 par rang de l'habitaiton + 2d20 par rang du pays). Si aucune n\u2019est \xE9ligible vous obtenez l\u2019effet Hommage au roi."
    },
    {
      nom: "Attrition",
      poids: 1,
      description: "Si vous ne d\xE9pensez pas 20% de leur montant en Or, la vitesse de vos arm\xE9e est r\xE9duite \xE0 1 PM pour la saison."
    },
    {
      nom: "Rupture de mat\xE9riaux",
      poids: 1,
      description: "tous les b\xE2timents co\xFBtent 1 ressource de base suppl\xE9mentaire par rang de l'habitation \xE0 \xEAtre construits."
    },
    {
      nom: "Exc\xE8s de population",
      poids: 1,
      description: "Vous pouvez gratuitement construire un am\xE9nagement ou une extension dans une de vos habitation al\xE9atoire."
    },
    {
      nom: "Citoyens volontaires",
      poids: 1,
      description: "Si vous effectuez une lev\xE9e ce tour-ci, elle co\xFBte -5 Or par rang du pays."
    },
    {
      nom: "pacte de d\xE9fense",
      poids: 1,
      description: "Vous pouvez d\xE9penser 3 ressources de base de votre choix paur augmenter la garnison d'une cit\xE9 libre de votre choix de 40."
    },
    {
      nom: "R\xE9volution",
      poids: 1,
      description: "Si vous \xEAtes suzerain d'une cit\xE9 libre, vous pouvez changer son type en d\xE9pensant 60 Or. Si vous ne le faites pas, perdez 20 Influence avec la cit\xE9 lirbe."
    },
    {
      nom: "Exploration de grotte",
      poids: 1,
      description: "Vous pouvez d\xE9penser 15 Or pour obtenir une r\xE9solution de d\xE9couverte de village."
    },
    {
      nom: "Rien",
      poids: 1,
      description: "tout va bien, ouf"
    },
    {
      nom: "Rien",
      poids: 1,
      description: "tout va bien, ouf"
    },
    {
      nom: "Rien",
      poids: 1,
      description: "tout va bien, ouf"
    },
    {
      nom: "Migration",
      poids: 1,
      description: "Une de vos habitation al\xE9atoire gagne 2 habitants par rang de l'habitation."
    },
    {
      nom: "Barbares en vue",
      poids: 1,
      description: "la cit\xE9 libre la plus  proche avec laquelle vous  n'avez pas au  moins 30 Influence envoie des troupes vous conqu\xE9rir d'une puissance totale de 1d100 par citadelle que vous poss\xE9dez +4d20 par rang de votre pays"
    },
    {
      nom: "Sup\xE9riorit\xE9 culturelle",
      poids: 1,
      description: "2  habitants par rang de votre pays partent pour aller vivre chez le joueur avec le plus de tourisme, si vous \xEAtes celui avec le plus de tourisme, votre capitale gagne 2 habitants par rand de votre pays."
    },
    {
      nom: "incendie",
      poids: 1,
      description: "Perdez 1  ressource de base par rang de votre royaume"
    }
  ],
  offrandes: [
    {
      nom: "Offrande",
      poids: 0,
      description: "description"
    },
    {
      nom: "Offrande",
      poids: 12,
      description: "Cet \xE9v\xE9nement d\xE9clenche un tirage d\u2019Offrande (voir feuille Offrande)."
    },
    {
      nom: "B\xE9tail",
      poids: 1,
      description: "Les villageois vous offrent 5 B\xE9tail."
    },
    {
      nom: "Pr\xE9sent",
      poids: 6,
      description: "Les villageois vous offrent 12 Or."
    },
    {
      nom: "Bois",
      poids: 1,
      description: "Les villageois vous offrent 5 Bois."
    },
    {
      nom: "Connaissance",
      poids: 6,
      description: "Les villageois vous offrent 3 Science."
    },
    {
      nom: "Charbon",
      poids: 1,
      description: "Les villageois vous offrent 5 Charbon."
    },
    {
      nom: "Recrue",
      poids: 4,
      description: "Les villageois vous offrent 1 personnage (\xE2ge 3 ans, traits al\xE9atoires)."
    },
    {
      nom: "Fer",
      poids: 1,
      description: "Les villageois vous offrent 5 Fer."
    },
    {
      nom: "Union",
      poids: 1,
      description: "Le village rejoint votre pays en tant que nouveau Hameau."
    },
    {
      nom: "Pierre",
      poids: 1,
      description: "Les villageois vous offrent 5 Pierre."
    },
    {
      nom: "Soie",
      poids: 1,
      description: "Les villageois vous offrent 5 Soie."
    }
  ],
  traitsGenetiques: [
    {
      id: 1,
      name: "Obstin\xE9",
      weight: 10,
      heritable: true,
      marriageMod: -0.05,
      fertAdd: 0,
      lifeDelta: 0,
      resurrectionMinRoll: 0,
      description: "Refuse toute \xE9ducation."
    },
    {
      id: 2,
      name: "Long\xE9vit\xE9",
      weight: 10,
      heritable: true,
      marriageMod: 0,
      fertAdd: 0,
      lifeDelta: 6,
      resurrectionMinRoll: 0,
      description: "Vit six ans de plus que la moyenne."
    },
    {
      id: 3,
      name: "Fragile",
      weight: 10,
      heritable: true,
      marriageMod: 0,
      fertAdd: 0,
      lifeDelta: -6,
      resurrectionMinRoll: 0,
      description: "Meurt six ans plus t\xF4t que la moyenne."
    },
    {
      id: 4,
      name: "St\xE9rile",
      weight: 6,
      heritable: true,
      marriageMod: 0,
      fertAdd: -2,
      lifeDelta: 0,
      resurrectionMinRoll: 0,
      description: "Ne peut pas concevoir d'enfants."
    },
    {
      id: 5,
      name: "F\xE9cond",
      weight: 8,
      heritable: true,
      marriageMod: 0,
      fertAdd: 0.5,
      lifeDelta: 0,
      resurrectionMinRoll: 0,
      description: "F\xE9condit\xE9 +0,5"
    },
    {
      id: 6,
      name: "Charmant",
      weight: 8,
      heritable: false,
      marriageMod: 0.2,
      fertAdd: 0,
      lifeDelta: 0,
      resurrectionMinRoll: 0,
      description: "mariage +20%"
    },
    {
      id: 7,
      name: "Repoussant",
      weight: 8,
      heritable: false,
      marriageMod: -0.2,
      fertAdd: 0,
      lifeDelta: 0,
      resurrectionMinRoll: 0,
      description: "mariage -20%"
    },
    {
      id: 8,
      name: "R\xE9silient",
      weight: 5,
      heritable: false,
      marriageMod: 0,
      fertAdd: 0,
      lifeDelta: 0,
      resurrectionMinRoll: 5,
      description: "Peut revenir d'entre les morts (5+ sur 1d6)."
    },
    {
      id: 9,
      name: "B\xE2tard",
      weight: 0,
      heritable: false,
      marriageMod: 0,
      fertAdd: 0,
      lifeDelta: 0,
      resurrectionMinRoll: 0,
      description: "(syst\xE8me) Enfant ill\xE9gitime."
    },
    {
      id: 10,
      name: "Consanguin",
      weight: 0,
      heritable: false,
      marriageMod: 0,
      fertAdd: -0.2,
      lifeDelta: -2,
      resurrectionMinRoll: 0,
      description: "(syst\xE8me) Parents apparent\xE9s."
    }
  ],
  titres: [
    {
      titre: "Chasseur",
      education: "",
      valeur1: 1,
      ressource1: "Nourriture",
      valeur2: 0.1,
      ressource2: "Or",
      description: "Titre par d\xE9faut",
      nobleSeul: false,
      regleGenre: "vide",
      attribution: ""
    },
    {
      titre: "Artiste",
      education: "Culturelle",
      valeur1: 1.2,
      ressource1: "Tourisme",
      valeur2: 0,
      ressource2: "",
      description: "",
      nobleSeul: false,
      regleGenre: "vide",
      attribution: "Education"
    },
    {
      titre: "Chercheur",
      education: "Scientifique",
      valeur1: 0.2,
      ressource1: "Science",
      valeur2: 0,
      ressource2: "",
      description: "",
      nobleSeul: false,
      regleGenre: "vide",
      attribution: "Education"
    },
    {
      titre: "\xC9leveur",
      education: "Agricole",
      valeur1: 2.5,
      ressource1: "Nourriture",
      valeur2: 0,
      ressource2: "",
      description: "",
      nobleSeul: false,
      regleGenre: "vide",
      attribution: "Education"
    },
    {
      titre: "Sportif",
      education: "Militaire",
      valeur1: 5,
      ressource1: "Garnison",
      valeur2: 0,
      ressource2: "",
      description: "",
      nobleSeul: false,
      regleGenre: "vide",
      attribution: "Education"
    },
    {
      titre: "Artisan",
      education: "\xC9conomique",
      valeur1: 1.5,
      ressource1: "Or",
      valeur2: 0,
      ressource2: "",
      description: "",
      nobleSeul: false,
      regleGenre: "vide",
      attribution: "Education"
    },
    {
      titre: "Professeur",
      education: "",
      valeur1: 0,
      ressource1: "",
      valeur2: 0,
      ressource2: "",
      description: "",
      nobleSeul: false,
      regleGenre: "vide",
      attribution: "Ville"
    },
    {
      titre: "Dirigeant",
      education: "",
      valeur1: 0,
      ressource1: "",
      valeur2: 0,
      ressource2: "",
      description: "Chef de faction \xB7 1 par joueur",
      nobleSeul: true,
      regleGenre: "H\xE9r\xE9dit\xE9",
      attribution: "Succession"
    },
    {
      titre: "Gouverneur",
      education: "",
      valeur1: 0,
      ressource1: "",
      valeur2: 0,
      ressource2: "",
      description: "Max 1 par ville",
      nobleSeul: true,
      regleGenre: "vide",
      attribution: "Manuelle"
    },
    {
      titre: "H\xE9ritier",
      education: "",
      valeur1: 0,
      ressource1: "",
      valeur2: 0,
      ressource2: "",
      description: "M\xEAme dynastie que le Dirigeant",
      nobleSeul: true,
      regleGenre: "H\xE9r\xE9dit\xE9",
      attribution: "Manuelle"
    },
    {
      titre: "Marchand",
      education: "",
      valeur1: 0,
      ressource1: "",
      valeur2: 0,
      ressource2: "",
      description: "",
      nobleSeul: false,
      regleGenre: "vide",
      attribution: "Manuelle"
    },
    {
      titre: "Ministre",
      education: "",
      valeur1: 0,
      ressource1: "",
      valeur2: 0,
      ressource2: "",
      description: "Plusieurs autoris\xE9s",
      nobleSeul: true,
      regleGenre: "vide",
      attribution: "Manuelle"
    },
    {
      titre: "Propagandiste",
      education: "",
      valeur1: 0,
      ressource1: "",
      valeur2: 0,
      ressource2: "",
      description: "",
      nobleSeul: false,
      regleGenre: "vide",
      attribution: "Manuelle"
    },
    {
      titre: "Soldat",
      education: "",
      valeur1: 0,
      ressource1: "",
      valeur2: 0,
      ressource2: "",
      description: "",
      nobleSeul: false,
      regleGenre: "Martialit\xE9",
      attribution: "Arm\xE9e"
    },
    {
      titre: "Commandant",
      education: "",
      valeur1: 0,
      ressource1: "",
      valeur2: 0,
      ressource2: "",
      description: "",
      nobleSeul: true,
      regleGenre: "Martialit\xE9",
      attribution: "Arm\xE9e"
    }
  ],
  ministeres: [
    {
      ministere: "Grand bailli",
      effet: "Co\xFBt de fondation des habitations -8 Or et -3 Bois.",
      rangMinimum: "Baronnie",
      mode: "Auto"
    },
    {
      ministere: "Grand pr\xE9v\xF4t",
      effet: "Votre capitale produit +1 Fer par tour. +10 Garnison dans vos habitations par rang de pays.",
      rangMinimum: "Baronnie",
      mode: "Auto"
    },
    {
      ministere: "Grand veneur",
      effet: "Vos habitations consomment -5 Nourriture par rang de votre pays.",
      rangMinimum: "Baronnie",
      mode: "Auto"
    },
    {
      ministere: "Surintendant des finances",
      effet: "Apr\xE8s avoir construit un b\xE2timent, g\xE9n\xE9rez 1 Ressource de votre choix produite par l'habitation par rang de l'habitation.",
      rangMinimum: "Baronnie",
      mode: "Auto"
    },
    {
      ministere: "Grand \xE9cuyer",
      effet: "Co\xFBt de lev\xE9e d'arm\xE9e -10 Or par rang de votre pays.",
      rangMinimum: "Baronnie",
      mode: "Auto"
    },
    {
      ministere: "Grand biblioth\xE9caire",
      effet: "Apr\xE8s avoir d\xE9couvert une technologie, gagnez votre rang de pays sous forme de Science.",
      rangMinimum: "Baronnie",
      mode: "Auto"
    },
    {
      ministere: "S\xE9n\xE9chal",
      effet: "+15 Nourriture \xE0 la fin de l'\xE9t\xE9 (cr\xE9dit\xE9e automatiquement).",
      rangMinimum: "Baronnie",
      mode: "Auto"
    },
    {
      ministere: "Tr\xE9sorier",
      effet: "+5 Or par tour (cr\xE9dit\xE9 automatiquement).",
      rangMinimum: "Baronnie",
      mode: "Auto"
    },
    {
      ministere: "Ma\xEEtre de cour",
      effet: "+2 Tourisme \xE0 la fin de chaque saison (cr\xE9dit\xE9 automatiquement).",
      rangMinimum: "Baronnie",
      mode: "Auto"
    },
    {
      ministere: "Grand Pr\xE9cepteur",
      effet: "+1 Science par tour (cr\xE9dit\xE9 automatiquement).",
      rangMinimum: "Comt\xE9",
      mode: "Auto"
    },
    {
      ministere: "Conn\xE9table",
      effet: "+15 Garnison \xE0 toutes vos villes d\xE8s la nomination (cr\xE9dit\xE9e une fois, automatiquement).",
      rangMinimum: "Duch\xE9",
      mode: "Auto"
    },
    {
      ministere: "Chancelier des \xE9missaires",
      effet: "+1 \xE9missaire en r\xE9serve \xE0 chaque fin de saison (cr\xE9dit\xE9 automatiquement).",
      rangMinimum: "Royaume",
      mode: "Auto"
    },
    {
      ministere: "Chancelier de justice",
      effet: "\u221225 % sur le co\xFBt des sacres (mont\xE9e de rang et sacre d'av\xE8nement), appliqu\xE9 automatiquement.",
      rangMinimum: "Duch\xE9",
      mode: "Auto"
    },
    {
      ministere: "Ma\xEEtre des guildes",
      effet: "Votre capitale peut poss\xE9der 1 Guilde suppl\xE9mentaire (limite appliqu\xE9e automatiquement : 2 Guildes pour la capitale).",
      rangMinimum: "Royaume",
      mode: "Auto"
    },
    {
      ministere: "L\xE9gat du pontificat",
      effet: "+20 Tourisme.",
      rangMinimum: "Royaume",
      mode: "Auto"
    },
    {
      ministere: "Mar\xE9chal",
      effet: "Vos arm\xE9es ont +1 PM.",
      rangMinimum: "Royaume",
      mode: "Plateau"
    },
    {
      ministere: "Grand Chambellan",
      effet: "+10 % sur toutes les taxes que vous recevez (villes et cit\xE9s libres), appliqu\xE9 automatiquement.",
      rangMinimum: "Royaume",
      mode: "Auto"
    },
    {
      ministere: "Archichancelier",
      effet: "Le sacre d'av\xE8nement de vos successions est r\xE9duit de moiti\xE9 (appliqu\xE9 automatiquement).",
      rangMinimum: "Empire",
      mode: "Auto"
    }
  ],
  titresEffets: [
    {
      titre: "Commandant",
      effet: "Il s'agit d'une unit\xE9 de type Commandant.",
      revocation: "10  Or"
    },
    {
      titre: "Dirigeant",
      effet: "Un de vos personnage doit poss\xE9der ce titre, s'il meurt, d\xE9clenchez une succession. Ce titre n'est pas exclusif.",
      revocation: "Irr\xE9vocable"
    },
    {
      titre: "G\xE9n\xE9ral",
      effet: "Chaque arm\xE9e doit poss\xE9der un g\xE9n\xE9ral parmi ses commandants.",
      revocation: "20  Or"
    },
    {
      titre: "Gouverneur",
      effet: "Un gouverneur doit \xEAtre plac\xE9 dans une habitation et octroie +10 % d'imp\xF4ts \xE0 sa ville (les anciens bonus de garnison et d'Or sont retir\xE9s). Si une ville sans gouverneur abrite un noble, le noble le plus \xE2g\xE9 devient automatiquement gouverneur \xE0 la fin du tour.",
      revocation: "30  Or"
    },
    {
      titre: "H\xE9ritier",
      effet: "L'H\xE9ritier devient Dirigeant lors de la succession. Si votre h\xE9ritier meurt, d\xE9clenchez une crise.",
      revocation: "50 Or \n+  10  Soie"
    },
    {
      titre: "Mage",
      effet: "Il s'agit d'un unit\xE9 de type Lanceur de sorts.",
      revocation: "5  Or"
    },
    {
      titre: "Marchand",
      effet: "Port\xE9e 9 PM, 4 PM par tour. Le marchand ouvre UNE route commerciale entre sa ville et la ville d'un autre joueur : chaque tour, les DEUX joueurs reli\xE9s gagnent 4 Or et le propri\xE9taire du marchand copie la production de l'am\xE9nagement ENTIER choisi dans la ville cibl\xE9e \u2014 toutes ses ressources produites (choisi \xE0 l'ouverture de la route, modifiable \xE0 tout moment ; un marchand ne tient qu'une route, qui se ferme s'il perd son titre ou meurt). Un marchand peut traverser les cases d'eau et de rivi\xE8re une fois les bateaux d\xE9bloqu\xE9s. Un marchand envoy\xE9 vers une cit\xE9 libre ne produit pas de ressources (r\xE8gle de plateau).",
      revocation: "20  Or + 6 ressources au choix"
    },
    {
      titre: "Ministre",
      effet: "Octroie un ministre qui appartient \xE0 un minist\xE8re, maximum 1.",
      revocation: "30 Or\n+ 6  Soie"
    },
    {
      titre: "Propagandiste",
      effet: "Peut d\xE9penser une charge pour convertir 5 personnes al\xE9atoire \xE0 sa culture ou 1 personne choisie.  Le propagandiste poss\xE8de 3 charges.",
      revocation: "6  Tourisme"
    }
  ],
  cultures: [
    {
      nom: "Communautarisme",
      homoAutorisee: false,
      fertFactor: 1,
      heredite: "Parit\xE9",
      martialite: "F\xE9minine",
      reglePays: "Entraide : votre capitale g\xE9n\xE8re +3 Nourriture par habitation de cette culture dans le monde.",
      reglePerso: "G\xE9n\xE9rosit\xE9 : les personnages gouverneurs r\xE9duisent la puissance des r\xE9voltes de 20 pts suppl\xE9mentaires.",
      capitalNourrParHabMonde: 3
    },
    {
      nom: "D\xE9isme",
      homoAutorisee: false,
      fertFactor: 1,
      heredite: "Masculine",
      martialite: "Parit\xE9",
      reglePays: "Prier les dieux : chaque fois que vous construisez un b\xE2timent de faction, vous gagnez 4 Science.",
      reglePerso: "Enfant Divin : un personnage H\xE9ritier g\xE9n\xE8re +6 Tourisme par rang de la capitale.",
      scienceParConstruction: 4
    },
    {
      nom: "Lunisme",
      homoAutorisee: false,
      fertFactor: 1,
      heredite: "Masculine",
      martialite: "Masculine",
      reglePays: "Pr\xEAcheurs : votre capitale g\xE9n\xE8re +4 Tourisme par habitation de cette culture dans le monde.",
      reglePerso: "Soldats de la Lumi\xE8re : lorsqu'une arm\xE9e attaque une habitation, la garnison de celle-ci est r\xE9duite de 15 par rang de votre pays.",
      capitalTourismeParHabMonde: 4
    },
    {
      nom: "Naturalisme",
      homoAutorisee: false,
      fertFactor: 1,
      heredite: "Parit\xE9",
      martialite: "Masculine",
      reglePays: "Ecologisme : vos habitations construites sur des cases de for\xEAt produisent +1 Bois.",
      reglePerso: "Walpurgis : les personnages poss\xE8dent 0,1 F\xE9condit\xE9."
    },
    {
      nom: "Sethisme",
      homoAutorisee: false,
      fertFactor: 1,
      heredite: "F\xE9minine",
      martialite: "Parit\xE9",
      reglePays: "Adaptation : vos habitations g\xE9n\xE8rent +1 Or par case de d\xE9sert dans leur enceinte.",
      reglePerso: "Sorcellerie : votre dirigeant g\xE9n\xE8rent +1 Science par rang de votre capitale."
    },
    {
      nom: "Z\xE9lotisme",
      homoAutorisee: false,
      fertFactor: 1,
      heredite: "F\xE9minine",
      martialite: "F\xE9minine",
      reglePays: "Sup\xE9riorit\xE9 \xE9vidente : votre capitale g\xE9n\xE8re +2 Or par habitation de cette culture dans le monde.",
      reglePerso: "Par le fer : les personnages g\xE9n\xE8rent un d\xE9 de man\u0153uvre rouge s'ils sont commandants.",
      capitalOrParHabMonde: 2
    }
  ],
  regimes: [
    {
      nom: "Autoritarisme",
      loi: "Conscription : garnison des habitations +15 par rang des habitations. Co\xFBt de lev\xE9e d'arm\xE9e -10 par rang du pays.",
      garnisonParRang: 15
    },
    {
      nom: "Socialisme",
      loi: "Pour le peuple : +5 Nourriture par tour d'\xE9t\xE9 pour les champs et rizi\xE8res.",
      nourrEteChampRiziere: 5
    },
    {
      nom: "D\xE9mocratie",
      loi: "Elections : le sacre d'av\xE8nement est gratuit."
    },
    {
      nom: "Monarchie",
      loi: "Droit Divin : vous poss\xE9dez 1 serment suppl\xE9mentaire."
    }
  ],
  banquesNoms: [
    {
      nom: "Banque 1",
      noms: [
        "Martel",
        "Fauconnier",
        "Charpentier",
        "Forgeron",
        "Tisserand",
        "Berger",
        "Boucher",
        "Forestier",
        "Chasseur",
        "P\xEAcheur",
        "Lemaire",
        "Chevalier",
        "Serrurier",
        "Villain",
        "Morceau",
        "Petit",
        "Legrand",
        "Laroux",
        "Noirdier",
        "Beauregard",
        "Fortin",
        "Hardy",
        "Bruneau",
        "Clair",
        "Lenoir",
        "Bonhomme",
        "Costurier",
        "Garnier",
        "Mercier",
        "Colombier",
        "Renard",
        "Louvet",
        "Rousseau",
        "Sarazin",
        "Jourdain",
        "Lancelin",
        "Lambelin",
        "Broc",
        "Clopin",
        "Sanspeur",
        "Boniface",
        "Rocbrune",
        "Deval",
        "Montclerc",
        "Boisdor\xE9",
        "Froissart",
        "Courteheuse",
        "Chantemerle",
        "Aub\xE9pine",
        "Fierbois",
        "Vieuxpont",
        "Hauterive",
        "Bellebranche",
        "Noirebranche",
        "Troisfontaines",
        "Longchamp",
        "Montfaucon",
        "Bellemarche",
        "Sombreval",
        "Duroc",
        "Clairmont",
        "Ferreol",
        "Rougemont",
        "Villeroy",
        "Chanteloup",
        "Brisemont",
        "Boisverd",
        "Malvoisin",
        "Cendrecourt",
        "Pierrefeu",
        "Fauvel",
        "Rochefort",
        "Ch\xE8vremont",
        "Montreuil",
        "Valombre",
        "Beaufort",
        "Hautefeuille",
        "Lormont",
        "Grisbois",
        "Mauclerc",
        "Sainteclaire",
        "Rochebrune",
        "Courcelles",
        "Vaugrenier",
        "Lestang",
        "Froidemare",
        "Boisguerin",
        "Aigreval",
        "Palegrue",
        "Sombreuil",
        "Barbefleur",
        "Grosbois",
        "Charbonnel",
        "Fleurigny",
        "Chassebrume",
        "Taillefer",
        "Sanglier",
        "Dumoulin",
        "Despr\xE9s",
        "Courtepaille",
        "Vifargent",
        "Noiroiseau",
        "Beauchesne",
        "Montaigu",
        "Froidval",
        "Luneau",
        "Beauchamp",
        "Clairvaux",
        "Bellerive",
        "Rochelame",
        "Ferbois",
        "Dorl\xE9ans",
        "Maupertuis",
        "Piedfer",
        "Boislevent",
        "Chantelac",
        "Aubemont",
        "Villeneige",
        "Sombresaule",
        "Hautelune",
        "Montjoie",
        "Vauclair",
        "Laforge",
        "Durocher",
        "Bellecroix",
        "Boisrenard",
        "Froidepierre",
        "Riveforte",
        "C\u0153urvaillant",
        "Gravelot",
        "Brisepierre",
        "Loupblanc",
        "Soleilgris",
        "Vieuxch\xEAne",
        "Chantelierre",
        "Bassebrume",
        "Hautecombe",
        "Mornelac",
        "Grisvaux",
        "Rochecendre",
        "Brunval",
        "Dumarch\xE9",
        "Ferrand",
        "Lacorne",
        "Porcher",
        "Tanneur",
        "Vigneron",
        "M\xE9nestrel",
        "Piquebois",
        "Courtemanche",
        "Brisemare",
        "Saintval",
        "Aubefort",
        "Noiremotte",
        "Belestat",
        "Rochegarde",
        "Montserein",
        "Fauconroux",
        "Hautbois",
        "Vieilleforge",
        "Rivemorte",
        "Claire\xE9pine",
        "Longuebrise",
        "Valdor\xE9",
        "Morneplaine",
        "Belleserre",
        "Boiscl\xE9ment",
        "Ferrelame",
        "Aubecourt",
        "Pierrebrune",
        "Ch\xEAnevieux",
        "Fossenoire",
        "Hautecroix",
        "Vallombre",
        "Dormeuil",
        "Cendreval",
        "Blanchegarde",
        "Rivelune",
        "Montbrume",
        "Basseforge",
        "Vieil\xE9tang",
        "Chantegrive",
        "Boisnoir",
        "Froidecombe",
        "Lameforte",
        "Rochelierre",
        "Vaugris",
        "Fierclerc",
        "Bonnemare",
        "Sombrech\xEAne",
        "Claircour",
        "Rocheveille",
        "Fauconnet",
        "Rougelierre",
        "Bassecour",
        "Montfleury",
        "Aubenoire",
        "Ferredor",
        "Courcelune",
        "Valperdu"
      ],
      prenomsM: [
        "Charles",
        "Charlemagne",
        "Carloman",
        "P\xE9pin",
        "Louis",
        "Lothaire",
        "Clovis",
        "Childebert",
        "Chilp\xE9ric",
        "Dagobert",
        "Th\xE9odoric",
        "Thierry",
        "Eudes",
        "Hugues",
        "Robert",
        "Guillaume",
        "Roland",
        "G\xE9rard",
        "Godefroi",
        "Geoffroi",
        "Arnoul",
        "Anselme",
        "Baudouin",
        "Bertram",
        "Richer",
        "Adalbert",
        "Amalric",
        "Arnaud",
        "Bernard",
        "Conrad",
        "Fulbert",
        "Giselbert",
        "Henri",
        "Lambert",
        "Lancelin",
        "Leodegar",
        "Odilon",
        "Rainier",
        "Renaud",
        "Richard",
        "Rodolphe",
        "Sigismond",
        "Tancr\xE8de",
        "Thibaud",
        "Tristan",
        "Ulrich",
        "Walaric",
        "Werner",
        "Guy",
        "Raoul",
        "Martin",
        "Jean",
        "Pierre",
        "Andr\xE9",
        "Paul",
        "\xC9tienne",
        "Hildemar",
        "Hildebrand",
        "Drogo",
        "Othon",
        "Aldebert",
        "Almaric",
        "Ansbert",
        "Baldric",
        "Berengar",
        "B\xE9renger",
        "Burchard",
        "Clodomir",
        "Chramne",
        "Enguerrand",
        "Ermold",
        "Foulques",
        "Fr\xE9d\xE9ric",
        "Gerulf",
        "Gautier",
        "Garnier",
        "Godebold",
        "Gontran",
        "Hardrad",
        "H\xE9ribert",
        "Isambart",
        "L\xE9on",
        "Laurent",
        "Luc",
        "Marcel",
        "Maurin",
        "Nivard",
        "Odon",
        "Pons",
        "Raimond",
        "Raimbaud",
        "Rainald",
        "Renart",
        "S\xE9bastien",
        "Serlon",
        "Sigebert",
        "Simon",
        "Tassilon",
        "Th\xE9obald",
        "Uldaric",
        "Yves"
      ],
      prenomsF: [
        "Bertrada",
        "Hildegarde",
        "Gerberge",
        "Gis\xE8le",
        "Rothrude",
        "Ermengarde",
        "Ad\xE9la\xEFde",
        "Berthe",
        "Cun\xE9gonde",
        "Fr\xE9d\xE9gonde",
        "Clotilde",
        "Bathilde",
        "A\xE9lis",
        "Blanche",
        "Judith",
        "Emma",
        "Mathilde",
        "Liutgarde",
        "Richilde",
        "Agn\xE8s",
        "B\xE9atrice",
        "Foy",
        "Claire",
        "Aude",
        "Ali\xE9nor",
        "H\xE9lo\xEFse",
        "Isabeau",
        "Ysabeau",
        "Alix",
        "Azala\xEFs",
        "Ode",
        "Perrette",
        "Rixende",
        "Sibylle",
        "Yolande",
        "Mahaut",
        "Ida",
        "Gertrude",
        "Adalsinde",
        "Rosalie",
        "Alberade",
        "Ameline",
        "Amicie",
        "Anne",
        "Arsinde",
        "A\xE9nor",
        "Alpa\xEFs",
        "Astrid",
        "B\xE9atrix",
        "Brunehaut",
        "C\xE9cile",
        "Constance",
        "Dhuoda",
        "\xC9l\xE9onore",
        "\xC9lisabeth",
        "Ermentrude",
        "Faustine",
        "Flavie",
        "Florine",
        "Gersende",
        "Guillemette",
        "Hadwige",
        "Hodierne",
        "Hugoline",
        "Jehanne",
        "Jeanne",
        "Jehannette",
        "L\xE9ontine",
        "Lucie",
        "Mabile",
        "Marguerite",
        "Marie",
        "Marion",
        "M\xE9lisende",
        "Ninon",
        "Odette",
        "Philippine",
        "Philom\xE8ne",
        "Prisca",
        "Radegonde",
        "Sancie",
        "Solveig",
        "Suzanne",
        "Th\xE9odelinde",
        "Th\xE9ophanie",
        "Ursule",
        "Violaine",
        "Wulfhilde",
        "Yvette",
        "Zo\xE9",
        "Adela",
        "Alixandre",
        "Bertilde",
        "Engeltrude",
        "Fridegonde",
        "Hermengarde",
        "Isengarde",
        "Rosamonde",
        "Siglinde"
      ]
    },
    {
      nom: "Banque 2",
      noms: [
        "Brise-Cr\xE2ne",
        "Casse-Dents",
        "Mange-Boyaux",
        "Boit-Sang",
        "Gueule-Tordue",
        "\u0152il-Pourri",
        "Sans-Nez",
        "Gratte-Cro\xFBte",
        "Brise-Os",
        "T\xEAte-Dure",
        "Poing-Fer",
        "Saigne-Lune",
        "Griffe-Rouille",
        "Coule-Gras",
        "Groincrochu",
        "L\xE8pre-Grasse",
        "Coupe-Gorge",
        "Lance-Boue",
        "Hurle-Morts",
        "Cogne-Fort",
        "Ricane-Sang",
        "Marche-Bouc",
        "Mange-Pierres",
        "Br\xFBle-Poil",
        "Casse-Jarret",
        "Frappe-Nuit",
        "L\xE8che-Lame",
        "Main-Suie",
        "Doigt-Coup\xE9",
        "Crache-Pus",
        "M\xE2che-Os",
        "Mort-Souris",
        "Brise-Nuque",
        "Rince-Tripes",
        "Cr\xE8ve-Yeux",
        "Corne-Cr\xE2ne",
        "Gratte-T\xEAte",
        "Mange-Boue",
        "Gueule-Cass\xE9e",
        "Coupe-Jarret",
        "Brise-M\xE2choire",
        "Cogne-Morne",
        "Tord-Bras",
        "Vomi-Fer",
        "M\xE2che-Gravier",
        "Casse-Crocs",
        "Pue-Bile",
        "\xC9crase-Rat",
        "Tire-Oreille",
        "Hurle-Boue",
        "Fend-Groin",
        "Mange-Cendres",
        "Casse-Genou",
        "Perce-Panse",
        "Griffe-Suie",
        "P\xE8te-Roc",
        "Bave-Noire",
        "Tranche-Gob",
        "Mord-Boue",
        "Broie-Os",
        "Marche-Fange",
        "Tord-Nuque",
        "Cogne-\xC9pine",
        "Racle-Cro\xFBte",
        "Croque-Dents",
        "Brise-Gueule",
        "Frappe-Grotte",
        "Pique-Rouille",
        "Gobe-Vase",
        "Casse-Tibia",
        "\xC9crase-Flaque",
        "T\xEAte-Fendue",
        "M\xE2che-Ronces",
        "Coupe-Nerfs",
        "Lance-Fiente",
        "Gratte-Champignon",
        "Saignesec",
        "Gueule-Morne",
        "Dents-Jaunes",
        "Trogne-Verte",
        "Claque-Fer",
        "Broute-Caillou",
        "Panse-Grasse",
        "Mord-Cr\xE2ne",
        "Fauche-Patte",
        "Bave-Croche",
        "Tord-C\xF4te",
        "\xC9clate-Nez",
        "Br\xFBle-Griffe",
        "Cogne-Fumier",
        "Ronge-Moelle",
        "Tra\xEEne-Cha\xEEne",
        "Craque-Os",
        "Vide-Tripes",
        "Tape-Mouche",
        "Pue-Cendre",
        "Mange-Morve",
        "Racle-Lame",
        "Croque-Rat",
        "Fend-Casque",
        "Sauteboue",
        "Grogne-Fer",
        "Brise-Hanche",
        "L\xE8che-Couteau",
        "Cogne-Taule",
        "M\xE2che-Fange",
        "Coupe-Sabot",
        "Pousse-Corne",
        "Griffe-Molle",
        "Broyecroc",
        "Tape-Cr\xE2ne",
        "Hache-Boue",
        "Casse-Silex",
        "\xC9tripe-Loup",
        "Mord-Poussi\xE8re",
        "Croque-Pou",
        "Fracasse-Os",
        "Fouille-Cadavre",
        "Fange-Gorge",
        "Happe-Graisse",
        "Cogne-Crotte",
        "Gueule-Peste",
        "Brise-Pif",
        "Griffe-Graisse",
        "Mange-Clou",
        "Coupe-Barbe",
        "Pousse-Vase",
        "Hurle-Tripes",
        "Crache-Rouille",
        "Casse-Broche",
        "Mord-Caillasse",
        "Tord-Boyau",
        "Pue-Tourbe",
        "Gobe-Mouche",
        "Frappe-Rat",
        "M\xE2che-Cuir",
        "Racle-Fer",
        "Cogne-Cave",
        "Coupe-Groin",
        "\xC9crase-Poux",
        "Fend-Rocher",
        "Broute-Os",
        "Tranche-Morve",
        "Bave-Fer",
        "Gratte-Charogne",
        "Tape-Bidon",
        "Mord-Lune",
        "Casse-Corne",
        "Hurle-Caverne",
        "Craque-Dent",
        "Broie-Casque",
        "Tord-M\xE8che",
        "L\xE8che-Suie",
        "Pique-Bile",
        "Mange-Vieux",
        "Vole-Jarret",
        "Cr\xE8ve-Panse",
        "Cogne-Silex",
        "Racle-Cr\xE2ne",
        "Brise-Clavicule",
        "M\xE2che-Souris",
        "Coupe-Tendon",
        "Frappe-Croupe",
        "Gobe-Larve",
        "Gratte-Trogne",
        "Pue-Marais",
        "T\xEAte-Croche",
        "Baffe-Nuit",
        "Cogne-Rouille",
        "Mange-Sabot",
        "Casse-Rogne",
        "Tord-Lardon",
        "Br\xFBle-Moustache",
        "Mord-Givre",
        "Coupe-Plaie",
        "\xC9corche-Bouc",
        "Bave-Morne",
        "Pique-\u0152il",
        "Fend-M\xE2choire",
        "Gueule-Glaviot",
        "Racle-C\xF4te",
        "Broie-Fange",
        "Tranche-Cro\xFBte",
        "Cogne-Bosse",
        "Brise-Mollet",
        "M\xE2che-T\xF4le",
        "Lance-Peste",
        "Croque-Sabot",
        "Vide-Casque",
        "Tord-\xC9chine",
        "Griffe-Crasse",
        "Hurle-Forge",
        "Mord-Nerf",
        "Broute-Fer",
        "Pue-Cave",
        "Casse-Rictus",
        "\xC9clate-Gueule",
        "Frappe-Croc",
        "Gobe-Vieux",
        "M\xE2che-Rouille"
      ],
      prenomsM: [
        "Zgeha",
        "Zebar",
        "Savor",
        "Bruh",
        "Debe",
        "Zgobil",
        "Grugo",
        "Herom",
        "Drneh",
        "Bra",
        "Drohun",
        "Teh",
        "Mokom",
        "Renin",
        "Te",
        "Lu",
        "Zgosu",
        "Tosev",
        "Rgirob",
        "Ror",
        "Gnaz",
        "Kruhik",
        "Vunit",
        "Ldaz",
        "Vev",
        "Kro",
        "Murut",
        "Sneril",
        "Dozi",
        "Smit",
        "Tibed",
        "Hazal",
        "Zuseg",
        "Va",
        "Bbog",
        "Vehus",
        "Dodar",
        "Bro",
        "Hurod",
        "Krmuz",
        "Vusuz",
        "Ginal",
        "Tid",
        "Lmen",
        "Dsot",
        "Leniz",
        "Kgut",
        "Laho",
        "Mo",
        "Rgirev",
        "Ri",
        "Dosan",
        "Ba",
        "Dubi",
        "Zgu",
        "Sneguv",
        "Tnet",
        "Gu",
        "Trigur",
        "Rater",
        "Vuda",
        "Deti",
        "Bezok",
        "Domo",
        "No",
        "Nzar",
        "Snim",
        "Ni",
        "Nomon",
        "Genoh",
        "Gnul",
        "Trder",
        "Sniman",
        "Trbos",
        "Vivus",
        "Krkiv",
        "Megov",
        "Mi",
        "Mhod",
        "Szov",
        "Tiga",
        "Zu",
        "Darov",
        "Ve",
        "Kagab",
        "Ger",
        "Vezu",
        "Ludid",
        "Hevon",
        "Namid",
        "Ko",
        "Nikid",
        "Zol",
        "To",
        "Drulu",
        "Bnog",
        "Gok",
        "Horu",
        "Greze",
        "Zur"
      ],
      prenomsF: [
        "Lizo",
        "Zoze",
        "Hige",
        "Bebum",
        "Lozeg",
        "Dbum",
        "Suve",
        "Dhag",
        "Kuhub",
        "Snura",
        "Vene",
        "Gntak",
        "Grolik",
        "Sun",
        "Drana",
        "Hega",
        "Tus",
        "Grima",
        "Duh",
        "So",
        "Brked",
        "Zgavo",
        "Luloz",
        "Zuk",
        "Bevok",
        "Dre",
        "Gegi",
        "Linu",
        "Zed",
        "Gru",
        "Nudo",
        "Lmob",
        "Gzeh",
        "Ru",
        "Zsuk",
        "Brduv",
        "Ke",
        "Ra",
        "Ha",
        "Dad",
        "Limos",
        "Grisil",
        "Rzuk",
        "Klov",
        "Kredon",
        "Lodov",
        "Silu",
        "Drulih",
        "Sig",
        "Vasu",
        "Guko",
        "Malu",
        "Vob",
        "Tbob",
        "Nzov",
        "Zgehu",
        "Zguze",
        "Beke",
        "Libul",
        "Lulu",
        "Hon",
        "Snalu",
        "Bsum",
        "Bina",
        "Debur",
        "Rede",
        "Skate",
        "Kodo",
        "Ta",
        "Kver",
        "Se",
        "Hisas",
        "Rge",
        "Bru",
        "Kero",
        "Hos",
        "Ziv",
        "Rus",
        "Shid",
        "Hvov",
        "Go",
        "Lanid",
        "Drnud",
        "Nokuk",
        "Dru",
        "Ne",
        "Borer",
        "Lnol",
        "Vreb",
        "Gresig",
        "Tdos",
        "Skiso",
        "Mil",
        "Kega",
        "Gadom",
        "Di",
        "Dukav",
        "Gavi",
        "Migo",
        "Tad"
      ]
    },
    {
      nom: "Banque 3",
      noms: [
        "Schwarzmond",
        "Blutfaust",
        "Nachtschatten",
        "Grabeshund",
        "Knochenhand",
        "Seelenlos",
        "Finstermond",
        "Dunkelherz",
        "Mondschatten",
        "Frostblick",
        "Gruftkind",
        "Leichendorn",
        "Sargtr\xE4ger",
        "Rabenklaue",
        "Nachtnebel",
        "Wintersgrim",
        "Sturmbart",
        "Hohlblick",
        "Schwermund",
        "Frostzahn",
        "Totenturm",
        "Grimmblick",
        "Staubherz",
        "Finsterlicht",
        "Schattendorn",
        "Eiszahn",
        "Grabsschrift",
        "Blutmund",
        "Nebelflur",
        "Stillherz",
        "Blutblatt",
        "Altbrunn",
        "Seelenbruch",
        "Staubzahn",
        "Finsterzahn",
        "Grimmnacht",
        "Schattenruf",
        "Grabeswind",
        "Nebelkind",
        "Totenkuss",
        "Hermannlos",
        "D\xFCsterich",
        "Eckhart",
        "Falkenrot",
        "Hartmutz",
        "Reinhard",
        "Volkergrab",
        "Norbertz",
        "Hubertnacht",
        "Leopoldsarg",
        "Matthiaskalt",
        "Niklausmor",
        "Stefandruch",
        "Lorenzmoor",
        "Markusru\xDF",
        "Kristofbein",
        "Dominik",
        "Emeric",
        "Georgengrab",
        "Hagenmoor",
        "Helmuthschatten",
        "Magnus",
        "Oskar",
        "Roland",
        "Milosknochen",
        "Milan",
        "Dusan",
        "Bogdan",
        "Dragutin",
        "Petar",
        "Danilo",
        "Sava",
        "Gregorios",
        "Seraphim",
        "Lazar",
        "Vladim\xEDr",
        "Rasmus",
        "Edgar",
        "Roderich",
        "Kazimir",
        "Blutharzer",
        "Viktorfried",
        "Grimmistvan",
        "Laszlomor",
        "Schattbela",
        "Miklosar",
        "Andrasdra",
        "Janosfried",
        "Morgabor",
        "Knochentamas",
        "Zoltanus",
        "Knochenarpad",
        "Blutcsaba",
        "Kornelried",
        "Sargleventa",
        "Grimmkorga",
        "Totervladimir",
        "Radovanhart",
        "Gregorhart",
        "Erzebrecht",
        "Katalinor",
        "Zsuzszo",
        "Agnes",
        "Anna",
        "Brigitta",
        "Margit",
        "Klara",
        "Evas",
        "Ingrid",
        "Greta",
        "Helga",
        "Kathrin",
        "Katarina",
        "Isolde",
        "Lieselth",
        "Magda",
        "Gertruda",
        "Hildegard",
        "Adelheid",
        "Roxannor",
        "Irina",
        "Draga",
        "Milena",
        "Tatiana",
        "Jelena",
        "Ksenia",
        "Sabine",
        "Ursula",
        "Lotte",
        "Anneliese",
        "Mathilde",
        "Sofia",
        "Isabella",
        "Frida",
        "Lenka",
        "Marta",
        "Kreszentia",
        "Hanna",
        "Grete",
        "Elisabeth",
        "Helene",
        "Verena",
        "Theresia",
        "Hedvig",
        "Odilia",
        "Kunigunde",
        "Walburga",
        "Gudrun",
        "Ljubica",
        "Dorotea",
        "Miroslava",
        "Roxana",
        "Lavinia",
        "Selina",
        "Eliska",
        "Milica",
        "Johanna",
        "Margrit",
        "Ludmila",
        "Anka",
        "Klara-2",
        "Anastasia",
        "Salome",
        "Kornelia",
        "Viktoria",
        "Renata",
        "Silja",
        "Sonja",
        "Ivana",
        "Branka",
        "Danica",
        "Elvira",
        "Isolde-2",
        "Lorelei",
        "Mirena",
        "Agata",
        "Beata",
        "Ravenna",
        "Nachtherz",
        "Katalinhart",
        "Grimmilna",
        "Zsuzshart",
        "Agnesmund",
        "Annabart",
        "Totenbrigitta",
        "Mirkamoor",
        "Dunkelklara",
        "Evor",
        "Nachtigrid",
        "Gretadurg",
        "Schotthelga",
        "Kathrinwald",
        "Katarienen",
        "Isoldeus",
        "Lieselthried",
        "Magdarn",
        "Totenpertra",
        "Bluthilde",
        "Gerdrunen",
        "Finsterweib"
      ],
      prenomsM: [
        "Alaric",
        "Theoderic",
        "Viktor",
        "Istvan",
        "Laszlo",
        "Bela",
        "Miklos",
        "Andras",
        "Janos",
        "Gabor",
        "Tamas",
        "Zoltan",
        "Arpad",
        "Csaba",
        "Kornel",
        "Levente",
        "Dragomir",
        "Vladislav",
        "Radovan",
        "Gregor",
        "Ulrich",
        "Heinrich",
        "Ludwig",
        "Otto",
        "Kaspar",
        "Ruediger",
        "Siegfried",
        "Gerhard",
        "Friedrich",
        "Wolfgang",
        "Manfred",
        "Gunter",
        "Klaus",
        "Hans",
        "Rainer",
        "Rudolf",
        "Konrad",
        "Wilhelm",
        "Ernst",
        "Albrecht",
        "Hermann",
        "Dietrich",
        "Eckhart",
        "Falk",
        "Hartmut",
        "Reinhard",
        "Volker",
        "Norbert",
        "Hubert",
        "Leopold",
        "Matthias",
        "Niklaus",
        "Stefan",
        "Lorenz",
        "Markus",
        "Kristof",
        "Dominik",
        "Emeric",
        "Georg",
        "Hagen",
        "Helmuth",
        "Magnus",
        "Oskar",
        "Roland",
        "Milos",
        "Milan",
        "Dusan",
        "Bogdan",
        "Dragutin",
        "Petar",
        "Danilo",
        "Sava",
        "Gregorios",
        "Seraphim",
        "Lazar",
        "Vladimir",
        "Rasmus",
        "Edgar",
        "Roderich",
        "Kasimir",
        "Blutalaric",
        "Bluttheoderic",
        "Viktorfried",
        "Grimmistvan",
        "Laszloor",
        "Schattbela",
        "Miklosar",
        "Andrasdra",
        "Janosfried",
        "Morgabor",
        "Knochentamas",
        "Zoltanius",
        "Knochenarpad",
        "Blutcsaba",
        "Kornelfried",
        "Sarglevente",
        "Grimmdragomir",
        "Totenvladislav",
        "Radovanhart",
        "Gregorhart"
      ],
      prenomsF: [
        "Erzsebet",
        "Katalin",
        "Ilona",
        "Zsuzsa",
        "Agnes",
        "Anna",
        "Brigitta",
        "Magdolna",
        "Klara",
        "Eva",
        "Ingrid",
        "Greta",
        "Helga",
        "Katrin",
        "Katarina",
        "Isolde",
        "Lisbeth",
        "Magda",
        "Gertrud",
        "Hildegard",
        "Adelheid",
        "Rosamund",
        "Irina",
        "Dragana",
        "Milena",
        "Tatiana",
        "Jelena",
        "Ksenia",
        "Sabine",
        "Ursula",
        "Lotte",
        "Anneliese",
        "Mathilde",
        "Sofia",
        "Isabella",
        "Frida",
        "Lena",
        "Marta",
        "Kreszentia",
        "Hanna",
        "Grete",
        "Elisabet",
        "Helene",
        "Verena",
        "Theresia",
        "Hedwig",
        "Odilia",
        "Kunigunde",
        "Walburga",
        "Gudrun",
        "Ljubica",
        "Dorotea",
        "Miroslava",
        "Roxana",
        "Lavinia",
        "Selina",
        "Eliska",
        "Milica",
        "Johanna",
        "Magrit",
        "Ludmila",
        "Anika",
        "Klara",
        "Anastasia",
        "Sabina",
        "Kornelia",
        "Viktoria",
        "Renata",
        "Silvia",
        "Sonja",
        "Ivana",
        "Branka",
        "Danica",
        "Elvira",
        "Isolde",
        "Lorelei",
        "Marzena",
        "Agata",
        "Beata",
        "Ravenna",
        "Nachterzsebet",
        "Katalinhart",
        "Grimmilona",
        "Zsuzsahart",
        "Agnesmund",
        "Annahart",
        "Totenbrigitta",
        "Magdolnaor",
        "Dunkelklara",
        "Evaor",
        "Nachtingrid",
        "Gretadra",
        "Schatthelga",
        "Katrinvald",
        "Katarinaen",
        "Isoldeius",
        "Lisbethfried",
        "Magdaen",
        "Totengertrud",
        "Bluthildegard"
      ]
    }
  ],
  peuplesLibres: [
    {
      nom: "Basil\xE9ens",
      description: "Faction fi\xE8re de sa culture et de ses constructions, les Basil\xE9ens par leur noblesse. Leur soci\xE9t\xE9 est scind\xE9e en deux, ceux qui travaillent la terre, et ceux qui administrent, prient et d\xE9fendent leur territoire. Chevalerie et noblesse de c\u0153ur sont les deux maitre-mot de ces guerriers sacr\xE9s.",
      lignes: [
        {
          label: "Victoire de faction (d\xE9sactiv\xE9e)",
          texte: "Au d\xE9but de la partie, d\xE9signez 2 cultures diff\xE9rentes. Vous remportez la partie si vous poss\xE9dez Notre-Dame du Palatinat et qu'aucune habitation n'est d'une de ces cultures."
        },
        {
          label: "B\xE2timent de faction",
          texte: "\xC9glise (5 Pierres + 10 Or) : peut uniquement \xEAtre construite dans une habitation de votre culture. L'\xE9glise g\xE9n\xE8re +8 Tourisme et +1 Or par tour.\nGrande Cath\xE9drale (remplace une \xC9glise, 12 Pierres + 30 Or) : peut uniquement \xEAtre construite dans votre capitale. G\xE9n\xE8re +16 Tourisme et +3 Or par tour.\nPalais de Notre-Dame du Palatinat (remplace la Grande Cath\xE9drale, 25 Pierres + 80 Or) : g\xE9n\xE8re +35 Tourisme et +8 Or par tour."
        },
        {
          label: "Paysans d\xE9vou\xE9s",
          texte: "Les champs produisent +5 Nourriture par tour ; lorsque vous am\xE9nagez un champ, g\xE9n\xE9rez 5 habitants. La garnison de vos habitations de type cit\xE9 est r\xE9duite de 20."
        },
        {
          label: "Temps de paix",
          texte: "Si vous \xEAtes suzerain, vous g\xE9n\xE9rez +5 Nourriture et +2 Or par tour pour chaque ville vassale. Lorsque vous acqu\xE9rez un nouveau vassal, vous recevez 10 fois votre rang de pays sous forme d'habitants dans votre capitale. Si vous \xEAtes un vassal, vous g\xE9n\xE9rez 15 Tourisme par rang de votre suzerain."
        },
        {
          label: "\xC2ge II \u2014 Distribution des richesses",
          texte: "Lorsque vous fondez ou am\xE9liorez une habitation, elle re\xE7oit 50 habitants."
        },
        {
          label: "\xC2ge II \u2014 Heure de la pri\xE8re",
          texte: "Vos b\xE2timents co\xFBtent 3 Pierres de moins \xE0 construire et \xE0 am\xE9liorer. Les merveilles co\xFBtent 5 Pierres de moins \xE0 construire et \xE0 am\xE9liorer et rapportent 5 Tourisme."
        },
        {
          label: "\xC2ge II \u2014 \xC9missaires efficaces",
          texte: "Lorsque vous r\xE9alisez une succession, gagnez 1 \xC9missaire \xE0 placer dans la cit\xE9 libre de votre choix. G\xE9n\xE9rez imm\xE9diatement 1 \xC9missaire."
        },
        {
          label: "\xC2ge III \u2014 Suzerainet\xE9",
          texte: "Vous pouvez poss\xE9der 1 Ministre suppl\xE9mentaire. Votre capitale re\xE7oit imm\xE9diatement 150 habitants."
        },
        {
          label: "\xC2ge III \u2014 H\xE9ritage familial",
          texte: "Lorsque vous am\xE9liorez une habitation, elle re\xE7oit 50 habitants."
        },
        {
          label: "\xC2ge III \u2014 Abuser des serfs",
          texte: "Vos champs produisent +3 Tourisme et sont \xE9galement consid\xE9r\xE9s comme des foires en ce qui concerne les bonus de technologie."
        }
      ],
      victoire: "Au d\xE9but de la partie, d\xE9signez 2 cultures diff\xE9rentes. Vous remportez la partie si vous poss\xE9dez Notre-Dame du Palatinat et qu'aucune habitation n'est d'une de ces cultures.",
      batiment: "\xC9glise (5 Pierres + 10 Or) : peut uniquement \xEAtre construite dans une habitation de votre culture. L'\xE9glise g\xE9n\xE8re +8 Tourisme et +1 Or par tour.\nGrande Cath\xE9drale (remplace une \xC9glise, 12 Pierres + 30 Or) : peut uniquement \xEAtre construite dans votre capitale. G\xE9n\xE8re +16 Tourisme et +3 Or par tour.\nPalais de Notre-Dame du Palatinat (remplace la Grande Cath\xE9drale, 25 Pierres + 80 Or) : g\xE9n\xE8re +35 Tourisme et +8 Or par tour.",
      reglesBase: [
        {
          nom: "Paysans d\xE9vou\xE9s",
          texte: "Les champs produisent +5 Nourriture par tour ; lorsque vous am\xE9nagez un champ, g\xE9n\xE9rez 5 habitants. La garnison de vos habitations de type cit\xE9 est r\xE9duite de 20."
        },
        {
          nom: "Temps de paix",
          texte: "Si vous \xEAtes suzerain, vous g\xE9n\xE9rez +5 Nourriture et +2 Or par tour pour chaque ville vassale. Lorsque vous acqu\xE9rez un nouveau vassal, vous recevez 10 fois votre rang de pays sous forme d'habitants dans votre capitale. Si vous \xEAtes un vassal, vous g\xE9n\xE9rez 15 Tourisme par rang de votre suzerain."
        }
      ],
      ageII: [
        {
          nom: "Distribution des richesses",
          texte: "Lorsque vous fondez ou am\xE9liorez une habitation, elle re\xE7oit 50 habitants."
        },
        {
          nom: "Heure de la pri\xE8re",
          texte: "Vos b\xE2timents co\xFBtent 3 Pierres de moins \xE0 construire et \xE0 am\xE9liorer. Les merveilles co\xFBtent 5 Pierres de moins \xE0 construire et \xE0 am\xE9liorer et rapportent 5 Tourisme."
        },
        {
          nom: "\xC9missaires efficaces",
          texte: "Lorsque vous r\xE9alisez une succession, gagnez 1 \xC9missaire \xE0 placer dans la cit\xE9 libre de votre choix. G\xE9n\xE9rez imm\xE9diatement 1 \xC9missaire."
        }
      ],
      ageIII: [
        {
          nom: "Suzerainet\xE9",
          texte: "Vous pouvez poss\xE9der 1 Ministre suppl\xE9mentaire. Votre capitale re\xE7oit imm\xE9diatement 150 habitants."
        },
        {
          nom: "H\xE9ritage familial",
          texte: "Lorsque vous am\xE9liorez une habitation, elle re\xE7oit 50 habitants."
        },
        {
          nom: "Abuser des serfs",
          texte: "Vos champs produisent +3 Tourisme et sont \xE9galement consid\xE9r\xE9s comme des foires en ce qui concerne les bonus de technologie."
        }
      ]
    },
    {
      nom: "PEAUX VERTES",
      description: "Violents, les peaux vertes sont la force brutale de ce monde. Vivant du pillage et de la guerre, ils compensent leurs faiblesses en construction en capturant directement les habitations des autres peuplades.",
      lignes: [
        {
          label: "B\xE2timent de faction",
          texte: "Autel eud Guer' (8 Bois + 4 Fer) : r\xE9duit le co\xFBt de lev\xE9e d'arm\xE9e de 20 Or."
        },
        {
          label: "Barbares primitifs",
          texte: "Fonder une nouvelle ville requiert 8 Or et 2 Bois de moins, mais am\xE9liorer une habitation requiert 3 Pierres de plus."
        },
        {
          label: "Union du klan !",
          texte: "Les Peaux Vertes sont r\xE9parties en clans ; plus vous en asservissez, plus le v\xF4tre sera puissant. Vous pouvez asservir des clans comme suit :\n\u2022 chaque village tribal que vous explorez compte comme un clan asservi ;\n\u2022 chaque habitation que vous fondez compte comme un clan asservi ;\n\u2022 chaque habitation que vous am\xE9liorez au rang III compte comme un clan asservi.\nChaque fois que vous asservissez un clan, g\xE9n\xE9rez 5 habitants dans l'habitation de votre choix. Le co\xFBt de lev\xE9e de vos arm\xE9es est r\xE9duit de 5 Or par clan asservi."
        },
        {
          label: "\xC2ge II \u2014 Diriger par la peur",
          texte: "Le co\xFBt de lev\xE9e d'arm\xE9e de vos vassaux est augment\xE9 de 10 Or par rang de votre royaume. Les cartes d'imp\xF4ts sont doubl\xE9es."
        },
        {
          label: "\xC2ge II \u2014 C\xE9 partou \xE0 nou !",
          texte: "Chaque ville que vous poss\xE9dez r\xE9duit le co\xFBt de lev\xE9e d'arm\xE9e de 5 Or et produit +5 Nourriture par tour."
        },
        {
          label: "\xC2ge II \u2014 Moa tap\xE9 Toa",
          texte: "La premi\xE8re crise de chaque \xE2ge est annul\xE9e."
        },
        {
          label: "\xC2ge III \u2014 Tous avek moa !",
          texte: "Vos arm\xE9es b\xE9n\xE9ficient de +1 PM. Vous pouvez poss\xE9der une arm\xE9e suppl\xE9mentaire."
        },
        {
          label: "\xC2ge III \u2014 Donn\xE9 \xE0 mang\xE9",
          texte: "Vos vassaux et vos villes vous rapportent +5 Nourriture et +1 Science par tour."
        },
        {
          label: "\xC2ge III \u2014 Multiculturalisme",
          texte: "Vous \xEAtes immunis\xE9 aux r\xE9voltes."
        }
      ],
      victoire: "",
      batiment: "Autel eud Guer' (8 Bois + 4 Fer) : r\xE9duit le co\xFBt de lev\xE9e d'arm\xE9e de 20 Or.",
      reglesBase: [
        {
          nom: "Barbares primitifs",
          texte: "Fonder une nouvelle ville requiert 8 Or et 2 Bois de moins, mais am\xE9liorer une habitation requiert 3 Pierres de plus."
        },
        {
          nom: "Union du klan !",
          texte: "Les Peaux Vertes sont r\xE9parties en clans ; plus vous en asservissez, plus le v\xF4tre sera puissant. Vous pouvez asservir des clans comme suit :\n\u2022 chaque village tribal que vous explorez compte comme un clan asservi ;\n\u2022 chaque habitation que vous fondez compte comme un clan asservi ;\n\u2022 chaque habitation que vous am\xE9liorez au rang III compte comme un clan asservi.\nChaque fois que vous asservissez un clan, g\xE9n\xE9rez 5 habitants dans l'habitation de votre choix. Le co\xFBt de lev\xE9e de vos arm\xE9es est r\xE9duit de 5 Or par clan asservi."
        }
      ],
      ageII: [
        {
          nom: "Diriger par la peur",
          texte: "Le co\xFBt de lev\xE9e d'arm\xE9e de vos vassaux est augment\xE9 de 10 Or par rang de votre royaume. Les cartes d'imp\xF4ts sont doubl\xE9es."
        },
        {
          nom: "C\xE9 partou \xE0 nou !",
          texte: "Chaque ville que vous poss\xE9dez r\xE9duit le co\xFBt de lev\xE9e d'arm\xE9e de 5 Or et produit +5 Nourriture par tour."
        },
        {
          nom: "Moa tap\xE9 Toa",
          texte: "La premi\xE8re crise de chaque \xE2ge est annul\xE9e."
        }
      ],
      ageIII: [
        {
          nom: "Tous avek moa !",
          texte: "Vos arm\xE9es b\xE9n\xE9ficient de +1 PM. Vous pouvez poss\xE9der une arm\xE9e suppl\xE9mentaire."
        },
        {
          nom: "Donn\xE9 \xE0 mang\xE9",
          texte: "Vos vassaux et vos villes vous rapportent +5 Nourriture et +1 Science par tour."
        },
        {
          nom: "Multiculturalisme",
          texte: "Vous \xEAtes immunis\xE9 aux r\xE9voltes."
        }
      ]
    },
    {
      nom: "ELFES D'OR",
      description: "Hautains ou simplement sup\xE9rieurs, les Elfes d'Or sont les ma\xEEtres incontest\xE9s de la magie, \xE0 tel point qu'ils en sont devenus d\xE9pendants.",
      lignes: [
        {
          label: "B\xE2timent de faction",
          texte: "Puit de mana (5 Pierres + 6 Soie) : votre capitale produit +1 Science par tour. Si ce b\xE2timent se trouve dans votre capitale, il g\xE9n\xE8re +1 Science par rang de l'habitation \xE0 la place."
        },
        {
          label: "L\xE0 avant les autres",
          texte: "Votre premi\xE8re habitation peut \xEAtre construite en mer et commence avec 30 habitants suppl\xE9mentaires."
        },
        {
          label: "Accros \xE0 la magie",
          texte: "Vous commencez la partie avec 8 Science. Si, \xE0 n'importe quel moment, votre r\xE9serve de Science est inf\xE9rieure \xE0 votre production de Science, vous perdez 2 fois le carr\xE9 du rang de votre royaume sous forme de Population, qui deviennent des Honn\xEEs.\n\u2022 2 Honn\xEEs : gagnez 5 de la ressource de base de votre choix.\n\u2022 10 Honn\xEEs : votre capitale produit +8 Or par tour.\n\u2022 20 Honn\xEEs : +1 Science par tour dans votre capitale.\n\u2022 50 Honn\xEEs : +1 Science par tour dans votre capitale.\n\u2022 100 Honn\xEEs : +1 Science par tour dans votre capitale.\n\u2022 200 Honn\xEEs : +1 Science par tour dans votre capitale.\n\u2022 500 Honn\xEEs : +1 Science par tour dans votre capitale.\n\u2022 1000 Honn\xEEs : +2 Science par tour dans votre capitale."
        },
        {
          label: "\xC2ge II \u2014 Savoir ancestral",
          texte: "D\xE9couvrez imm\xE9diatement deux progr\xE8s d'un m\xEAme arbre."
        },
        {
          label: "\xC2ge II \u2014 Cit\xE9 d'Or",
          texte: "Votre capitale peut accueillir un b\xE2timent suppl\xE9mentaire."
        },
        {
          label: "\xC2ge II \u2014 \xC9levage d'esclaves",
          texte: "Si vous devez gagner des Honn\xEEs pour n'importe quelle raison, vous en gagnez 100 % suppl\xE9mentaires."
        },
        {
          label: "\xC2ge III \u2014 Puit d'Or",
          texte: "Vos b\xE2timents de faction produisent +1 Science par tour et augmentent leur garnison de 40 pts."
        },
        {
          label: "\xC2ge III \u2014 Palais des Dieux",
          texte: "Votre capitale peut accueillir des b\xE2timents de tout type (ville, ch\xE2teau, guilde) et une Merveille suppl\xE9mentaire."
        },
        {
          label: "\xC2ge III \u2014 Opulence",
          texte: "Vos Honn\xEEs comptent comme des habitants en ce qui concerne les victoires et am\xE9liorations d'habitation."
        }
      ],
      victoire: "",
      batiment: "Puit de mana (5 Pierres + 6 Soie) : votre capitale produit +1 Science par tour. Si ce b\xE2timent se trouve dans votre capitale, il g\xE9n\xE8re +1 Science par rang de l'habitation \xE0 la place.",
      reglesBase: [
        {
          nom: "L\xE0 avant les autres",
          texte: "Votre premi\xE8re habitation peut \xEAtre construite en mer et commence avec 30 habitants suppl\xE9mentaires."
        },
        {
          nom: "Accros \xE0 la magie",
          texte: "Vous commencez la partie avec 8 Science. Si, \xE0 n'importe quel moment, votre r\xE9serve de Science est inf\xE9rieure \xE0 votre production de Science, vous perdez 2 fois le carr\xE9 du rang de votre royaume sous forme de Population, qui deviennent des Honn\xEEs.\n\u2022 2 Honn\xEEs : gagnez 5 de la ressource de base de votre choix.\n\u2022 10 Honn\xEEs : votre capitale produit +8 Or par tour.\n\u2022 20 Honn\xEEs : +1 Science par tour dans votre capitale.\n\u2022 50 Honn\xEEs : +1 Science par tour dans votre capitale.\n\u2022 100 Honn\xEEs : +1 Science par tour dans votre capitale.\n\u2022 200 Honn\xEEs : +1 Science par tour dans votre capitale.\n\u2022 500 Honn\xEEs : +1 Science par tour dans votre capitale.\n\u2022 1000 Honn\xEEs : +2 Science par tour dans votre capitale."
        }
      ],
      ageII: [
        {
          nom: "Savoir ancestral",
          texte: "D\xE9couvrez imm\xE9diatement deux progr\xE8s d'un m\xEAme arbre."
        },
        {
          nom: "Cit\xE9 d'Or",
          texte: "Votre capitale peut accueillir un b\xE2timent suppl\xE9mentaire."
        },
        {
          nom: "\xC9levage d'esclaves",
          texte: "Si vous devez gagner des Honn\xEEs pour n'importe quelle raison, vous en gagnez 100 % suppl\xE9mentaires."
        }
      ],
      ageIII: [
        {
          nom: "Puit d'Or",
          texte: "Vos b\xE2timents de faction produisent +1 Science par tour et augmentent leur garnison de 40 pts."
        },
        {
          nom: "Palais des Dieux",
          texte: "Votre capitale peut accueillir des b\xE2timents de tout type (ville, ch\xE2teau, guilde) et une Merveille suppl\xE9mentaire."
        },
        {
          nom: "Opulence",
          texte: "Vos Honn\xEEs comptent comme des habitants en ce qui concerne les victoires et am\xE9liorations d'habitation."
        }
      ]
    },
    {
      nom: "Sylvains",
      description: "Peuple des profondeurs foresti\xE8res, les Sylvains vivent en harmonie avec les bois et tirent l'essentiel de leur subsistance de leur apiculture.",
      lignes: [
        {
          label: "B\xE2timent de faction",
          texte: "Apiculture : am\xE9nagement unique de for\xEAt. Produit 12 Nourriture par tour."
        },
        {
          label: "Sentiers stables",
          texte: "Les cases de for\xEAt ne co\xFBtent que 1 PM \xE0 traverser."
        },
        {
          label: "Amis de la for\xEAt",
          texte: "Vous ne pouvez pas construire de scierie ni gagner de Bois d'aucune mani\xE8re que ce soit. \xC0 la place, tous les co\xFBts en Bois sont transform\xE9s en co\xFBts en Nourriture."
        },
        {
          label: "\xC2ge II \u2014 Don de miel",
          texte: "Vos apicultures ne produisent plus que 8 Nourriture par tour. Lorsque vous construisez une apiculture, placez un \xE9missaire dans la cit\xE9 libre de votre choix."
        },
        {
          label: "\xC2ge II \u2014 Vengeance de la terre",
          texte: "Le co\xFBt de vos lev\xE9es d'arm\xE9es est r\xE9duit de 10 Or pour chaque apiculture que vous poss\xE9dez. Vous pouvez poss\xE9der une arm\xE9e suppl\xE9mentaire."
        },
        {
          label: "\xC2ge II \u2014 Biblioth\xE8que enfouie",
          texte: "Vos apicultures produisent +1 Science par tour."
        },
        {
          label: "\xC2ge III \u2014 Enclave d'\xE9meraude",
          texte: "Pour chacun de vos vassaux, vos villes ont +20 Garnison irr\xE9ductibles et vous g\xE9n\xE9rez +2 Or par tour."
        },
        {
          label: "\xC2ge III \u2014 Racines du monde",
          texte: "Vous pouvez d\xE9penser tous les PM d'une de vos arm\xE9es situ\xE9e sur une case de for\xEAt pour la replacer sur une autre case de for\xEAt \xE0 15 cases ou moins et \xE0 3 cases ou plus de toute arm\xE9e ou ville d'un autre joueur."
        },
        {
          label: "\xC2ge III \u2014 Savoir ancestral",
          texte: "Chaque fois que vous construisez une apiculture, g\xE9n\xE9rez 10 Science. G\xE9n\xE9rez imm\xE9diatement 10 Science par apiculture que vous poss\xE9dez."
        }
      ],
      victoire: "",
      batiment: "Apiculture : am\xE9nagement unique de for\xEAt. Produit 12 Nourriture par tour.",
      reglesBase: [
        {
          nom: "Sentiers stables",
          texte: "Les cases de for\xEAt ne co\xFBtent que 1 PM \xE0 traverser."
        },
        {
          nom: "Amis de la for\xEAt",
          texte: "Vous ne pouvez pas construire de scierie ni gagner de Bois d'aucune mani\xE8re que ce soit. \xC0 la place, tous les co\xFBts en Bois sont transform\xE9s en co\xFBts en Nourriture."
        }
      ],
      ageII: [
        {
          nom: "Don de miel",
          texte: "Vos apicultures ne produisent plus que 8 Nourriture par tour. Lorsque vous construisez une apiculture, placez un \xE9missaire dans la cit\xE9 libre de votre choix."
        },
        {
          nom: "Vengeance de la terre",
          texte: "Le co\xFBt de vos lev\xE9es d'arm\xE9es est r\xE9duit de 10 Or pour chaque apiculture que vous poss\xE9dez. Vous pouvez poss\xE9der une arm\xE9e suppl\xE9mentaire."
        },
        {
          nom: "Biblioth\xE8que enfouie",
          texte: "Vos apicultures produisent +1 Science par tour."
        }
      ],
      ageIII: [
        {
          nom: "Enclave d'\xE9meraude",
          texte: "Pour chacun de vos vassaux, vos villes ont +20 Garnison irr\xE9ductibles et vous g\xE9n\xE9rez +2 Or par tour."
        },
        {
          nom: "Racines du monde",
          texte: "Vous pouvez d\xE9penser tous les PM d'une de vos arm\xE9es situ\xE9e sur une case de for\xEAt pour la replacer sur une autre case de for\xEAt \xE0 15 cases ou moins et \xE0 3 cases ou plus de toute arm\xE9e ou ville d'un autre joueur."
        },
        {
          nom: "Savoir ancestral",
          texte: "Chaque fois que vous construisez une apiculture, g\xE9n\xE9rez 10 Science. G\xE9n\xE9rez imm\xE9diatement 10 Science par apiculture que vous poss\xE9dez."
        }
      ]
    }
  ],
  peuplesAutres: [
    {
      nom: "NORLS",
      description: "Les Norls sont fiers de l'h\xE9ritage laiss\xE9 par leurs anc\xEAtres. Ils sont un peuple fier de leurs techniques de commerce nomade, et m\xE9prisent les grands empires de ce monde qui b\xE2tissent au d\xE9triment des paysages magnifiques de ce monde.",
      lignes: [
        {
          label: "B\xE2timent de faction",
          texte: "Fjord (8 Bois + 2 B\xE9tail) : am\xE9nagement qui peut \xEAtre construit en dehors d'une habitation, poss\xE9dant 20 Garnison et 2 Herses. Lorsque les Norls l\xE8vent une arm\xE9e, ils peuvent la lever dans n'importe lequel de leurs Fjords. Les Fjords peuvent accueillir des extensions, qui peuvent \xEAtre transform\xE9es en am\xE9nagements selon les m\xEAmes r\xE8gles qu'une habitation. Les Fjords peuvent \xEAtre construits sans technologie."
        },
        {
          label: "Vivre de la terre",
          texte: "Lorsque vous effectuez une Razzia ou un Pillage, g\xE9n\xE9rez 10 Or, deux fois la ressource cibl\xE9e et 3 Science."
        },
        {
          label: "Nomades",
          texte: "Les Norls ne poss\xE8dent pas d'habitation en d\xE9but de jeu, mais commencent avec 40 Or et 100 Nourriture en plus des ressources de d\xE9part. Construire une habitation requiert 6 Bois suppl\xE9mentaires."
        },
        {
          label: "\xC2ge II \u2014 Savoir chamanique",
          texte: "Vos b\xE2timents de faction g\xE9n\xE8rent +1 Science par tour s'ils ont au moins 1 expansion."
        },
        {
          label: "\xC2ge II \u2014 L'art du viking",
          texte: "Vous pouvez poss\xE9der une arm\xE9e suppl\xE9mentaire. +1 PM pour vos arm\xE9es."
        },
        {
          label: "\xC2ge II \u2014 La course \xE0 la mer",
          texte: "Vos habitations et b\xE2timents de faction c\xF4tiers g\xE9n\xE8rent +3 Or et +1 B\xE9tail par tour."
        },
        {
          label: "\xC2ge III \u2014 Conqu\xEAte territoriale",
          texte: "Les expansions consomment 5 Nourriture en moins. Garnison de vos b\xE2timents de faction +30."
        },
        {
          label: "\xC2ge III \u2014 Arm\xE9es des traditions",
          texte: "Vous pouvez poss\xE9der une arm\xE9e suppl\xE9mentaire. Chaque fois que vous levez une arm\xE9e, recevez 10 Tourisme d\xE9finitivement."
        },
        {
          label: "\xC2ge III \u2014 Grands explorateurs",
          texte: "Monter ou descendre d'un bateau ne consomme aucun PM. Vos bateaux ont +1 PM et co\xFBtent 4 Soies de moins \xE0 la construction."
        }
      ],
      victoire: "",
      batiment: "Fjord (8 Bois + 2 B\xE9tail) : am\xE9nagement qui peut \xEAtre construit en dehors d'une habitation, poss\xE9dant 20 Garnison et 2 Herses. Lorsque les Norls l\xE8vent une arm\xE9e, ils peuvent la lever dans n'importe lequel de leurs Fjords. Les Fjords peuvent accueillir des extensions, qui peuvent \xEAtre transform\xE9es en am\xE9nagements selon les m\xEAmes r\xE8gles qu'une habitation. Les Fjords peuvent \xEAtre construits sans technologie.",
      reglesBase: [
        {
          nom: "Vivre de la terre",
          texte: "Lorsque vous effectuez une Razzia ou un Pillage, g\xE9n\xE9rez 10 Or, deux fois la ressource cibl\xE9e et 3 Science."
        },
        {
          nom: "Nomades",
          texte: "Les Norls ne poss\xE8dent pas d'habitation en d\xE9but de jeu, mais commencent avec 40 Or et 100 Nourriture en plus des ressources de d\xE9part. Construire une habitation requiert 6 Bois suppl\xE9mentaires."
        }
      ],
      ageII: [
        {
          nom: "Savoir chamanique",
          texte: "Vos b\xE2timents de faction g\xE9n\xE8rent +1 Science par tour s'ils ont au moins 1 expansion."
        },
        {
          nom: "L'art du viking",
          texte: "Vous pouvez poss\xE9der une arm\xE9e suppl\xE9mentaire. +1 PM pour vos arm\xE9es."
        },
        {
          nom: "La course \xE0 la mer",
          texte: "Vos habitations et b\xE2timents de faction c\xF4tiers g\xE9n\xE8rent +3 Or et +1 B\xE9tail par tour."
        }
      ],
      ageIII: [
        {
          nom: "Conqu\xEAte territoriale",
          texte: "Les expansions consomment 5 Nourriture en moins. Garnison de vos b\xE2timents de faction +30."
        },
        {
          nom: "Arm\xE9es des traditions",
          texte: "Vous pouvez poss\xE9der une arm\xE9e suppl\xE9mentaire. Chaque fois que vous levez une arm\xE9e, recevez 10 Tourisme d\xE9finitivement."
        },
        {
          nom: "Grands explorateurs",
          texte: "Monter ou descendre d'un bateau ne consomme aucun PM. Vos bateaux ont +1 PM et co\xFBtent 4 Soies de moins \xE0 la construction."
        }
      ]
    },
    {
      nom: "VERMINES DE KAOSS",
      description: "D\xE9li\xE9es de l'emprise des Racines, les morts \xE8rent maintenant lmibrement \xE0 la surface. Leur objectif ? Ramener \xE0 la vie leur seigneur supr\xEAme et Dieu des Racines, Yehudiah.",
      lignes: [
        {
          label: "Victoire de faction (d\xE9sactiv\xE9e)",
          texte: "Vous remportez la partie si vous poss\xE9dez un rang total de Colonies souterraines de 30 ou plus."
        },
        {
          label: "B\xE2timent de faction",
          texte: "Colonie souterraine rang I (15 Or + 3 B\xE9tail) : doit \xEAtre b\xE2tie dans une habitation \xE0 7 cases ou moins d'une de vos habitations ou colonies.\nColonie souterraine rang II (30 Or + 10 Bois) : remplace une colonie de rang I.\nColonie souterraine rang III (60 Or + 15 Pierres) : remplace une colonie de rang II.\nColonie souterraine rang IV (100 Or + 20 Fer) : remplace une colonie de rang III.\nColonie souterraine rang V (200 Or + 30 Charbon) : remplace une colonie de rang IV.\nVos Colonies g\xE9n\xE8rent 1 Or par rang de la colonie pour le joueur poss\xE9dant la ville dans laquelle se trouve la colonie et pour vous."
        },
        {
          label: "Un chef plus intelligent",
          texte: "Votre capitale produit 1 Science par tour suppl\xE9mentaire."
        },
        {
          label: "Colonies souterraines",
          texte: "Vos colonies souterraines produisent, en fonction de leur rang :\n\u2022 rang I : +1 Bois et +2 Nourriture par tour ;\n\u2022 rang II : +1 Pierre par tour ;\n\u2022 rang III : +1 Fer par tour ;\n\u2022 rang IV : +1 Charbon par tour ;\n\u2022 rang V : +1 Science par tour ou +2 Tourisme."
        },
        {
          label: "\xC2ge II \u2014 March\xE9 noir",
          texte: "\xC9tablir une route vers une ville avec une colonie rapporte +2 Or par tour au joueur poss\xE9dant la ville, au joueur poss\xE9dant la colonie et \xE0 vous."
        },
        {
          label: "\xC2ge II \u2014 Infestation",
          texte: "Si vous attaquez une habitation poss\xE9dant une Colonie, sa garnison est r\xE9duite de 30 pts par rang de la colonie."
        },
        {
          label: "\xC2ge II \u2014 Colonies d'esclaves",
          texte: "Am\xE9liorer une colonie g\xE9n\xE8re 5 habitants dans votre capitale."
        },
        {
          label: "\xC2ge III \u2014 Grouiller partout",
          texte: "Le co\xFBt d'am\xE9lioration des colonies est r\xE9duit de 3 ressources et 20 Or."
        },
        {
          label: "\xC2ge III \u2014 Murmurer \xE0 leurs oreilles",
          texte: "Vos colonies de rang III ou plus peuvent servir de point de d\xE9part pour vos marchands et octroient +1 route commerciale."
        },
        {
          label: "\xC2ge III \u2014 \xC9tudier leur mani\xE8re de faire",
          texte: "Vos colonies g\xE9n\xE8rent +1 Science par tour."
        }
      ],
      victoire: "Vous remportez la partie si vous poss\xE9dez un rang total de Colonies souterraines de 30 ou plus.",
      batiment: "Colonie souterraine rang I (15 Or + 3 B\xE9tail) : doit \xEAtre b\xE2tie dans une habitation \xE0 7 cases ou moins d'une de vos habitations ou colonies.\nColonie souterraine rang II (30 Or + 10 Bois) : remplace une colonie de rang I.\nColonie souterraine rang III (60 Or + 15 Pierres) : remplace une colonie de rang II.\nColonie souterraine rang IV (100 Or + 20 Fer) : remplace une colonie de rang III.\nColonie souterraine rang V (200 Or + 30 Charbon) : remplace une colonie de rang IV.\nVos Colonies g\xE9n\xE8rent 1 Or par rang de la colonie pour le joueur poss\xE9dant la ville dans laquelle se trouve la colonie et pour vous.",
      reglesBase: [
        {
          nom: "Un chef plus intelligent",
          texte: "Votre capitale produit 1 Science par tour suppl\xE9mentaire."
        },
        {
          nom: "Colonies souterraines",
          texte: "Vos colonies souterraines produisent, en fonction de leur rang :\n\u2022 rang I : +1 Bois et +2 Nourriture par tour ;\n\u2022 rang II : +1 Pierre par tour ;\n\u2022 rang III : +1 Fer par tour ;\n\u2022 rang IV : +1 Charbon par tour ;\n\u2022 rang V : +1 Science par tour ou +2 Tourisme."
        }
      ],
      ageII: [
        {
          nom: "March\xE9 noir",
          texte: "\xC9tablir une route vers une ville avec une colonie rapporte +2 Or par tour au joueur poss\xE9dant la ville, au joueur poss\xE9dant la colonie et \xE0 vous."
        },
        {
          nom: "Infestation",
          texte: "Si vous attaquez une habitation poss\xE9dant une Colonie, sa garnison est r\xE9duite de 30 pts par rang de la colonie."
        },
        {
          nom: "Colonies d'esclaves",
          texte: "Am\xE9liorer une colonie g\xE9n\xE8re 5 habitants dans votre capitale."
        }
      ],
      ageIII: [
        {
          nom: "Grouiller partout",
          texte: "Le co\xFBt d'am\xE9lioration des colonies est r\xE9duit de 3 ressources et 20 Or."
        },
        {
          nom: "Murmurer \xE0 leurs oreilles",
          texte: "Vos colonies de rang III ou plus peuvent servir de point de d\xE9part pour vos marchands et octroient +1 route commerciale."
        },
        {
          nom: "\xC9tudier leur mani\xE8re de faire",
          texte: "Vos colonies g\xE9n\xE8rent +1 Science par tour."
        }
      ]
    }
  ],
  batimentsVille: [
    {
      categorie: "",
      nom: "Hameau : 20 Or + 10 Bois  + 6 B\xE9tail",
      cout: "",
      effet: ""
    },
    {
      categorie: "",
      nom: "Consomme 2 Or par tour. 10 Garnison.",
      cout: "",
      effet: ""
    },
    {
      categorie: "Militaire",
      nom: "Poste de garde",
      cout: "25 Or + 4 Fer",
      effet: "Consomme 10 Nourritures par tour.\nGarnison +40."
    },
    {
      categorie: "Militaire",
      nom: "Herses",
      cout: "4 Or  +  2  Bois",
      effet: "Ajoute deux Herses lors de bataille de si\xE8ge, aux endroits choisis par le d\xE9fenseur."
    },
    {
      categorie: "Economique",
      nom: "Camp de b\xFBcheron",
      cout: "5 Or + 1 B\xE9tail.",
      effet: "+1 Bois par tour."
    },
    {
      categorie: "Economique",
      nom: "Camp de mineur",
      cout: "5 Or + 1 Charbon.",
      effet: "+1 Pierre par tour."
    },
    {
      categorie: "Economique",
      nom: "Echoppe",
      cout: "10 Or + 3 Bois.",
      effet: "+ 2 Or par tour. Permet d'entretenir 1 route commerciale suppl\xE9mentaire."
    },
    {
      categorie: "Economique",
      nom: "Grange",
      cout: "10 Or + 3 B\xE9tail + 3 Bois.",
      effet: "+ 15 Nourriture par tour."
    },
    {
      categorie: "Economique",
      nom: "Herboristerie",
      cout: "10 Or + 4 Bois",
      effet: "Chances de contracter une maladie et de gu\xE9rir  d'une maladie augment\xE9es de 5%"
    },
    {
      categorie: "Economique",
      nom: "Ponton",
      cout: "5 Or + 5 Bois.",
      effet: "Habitations c\xF4ti\xE8res uniquement. Les ressources maritimes am\xE9nag\xE9es g\xE9n\xE8rent 1 B\xE9tail par tour."
    },
    {
      categorie: "Economique",
      nom: "Consomme 10 Nourriture et 8 Or par tour. 24 Garnison.",
      cout: "",
      effet: ""
    },
    {
      categorie: "Militaire",
      nom: "Caserne",
      cout: "Poste de garde requis. 25 Or + 4 Fer.",
      effet: "Consomme 10 Nourritures par tour. Garnison +40."
    },
    {
      categorie: "Militaire",
      nom: "R\xE9seau de routes",
      cout: "15 Or + 4 Soie.",
      effet: "Les cases dans l'enceinte de cette habitation ne co\xFBtent qu'un PM \xE0 franchir."
    },
    {
      categorie: "Militaire",
      nom: "Tour de sorcier",
      cout: "40 Or + 12 Pierres.",
      effet: "Une arm\xE9e amie peut se t\xE9l\xE9porter \xE0 une autre Tour de sorcier amie pour 1 Or par case travers\xE9e et 1 PM."
    },
    {
      categorie: "Economique",
      nom: "Camp de b\xE2tisseurs",
      cout: "10 Or + 4 Pierre.",
      effet: "R\xE9duit le co\xFBt de construction des am\xE9nagements de 5 Or et 1 Bois."
    },
    {
      categorie: "Economique",
      nom: "Camp de travailleurs",
      cout: "10 Or + 4 Pierre.",
      effet: "Remplace le Camp de b\xFBcherons ou de mineurs.\n+1 Bois et +1 Pierre par tour."
    },
    {
      categorie: "Economique",
      nom: "Etable",
      cout: "Grange requise. \n10 Or + 4 Bois + 4 B\xE9tail.",
      effet: "Vous pouvez d\xE9penser 8 B\xE9tails pour ajouter une ressource de B\xE9tail dans l'enceinte de la Cit\xE9."
    },
    {
      categorie: "Economique",
      nom: "Moulin \xE0 vent",
      cout: "Silot \xE0 grain requis.\n15 Or + 4 Bois + 4 B\xE9tail.",
      effet: "Remplace le Silo \xE0 grain. Consomme 1 Charbon par tour.\n+ 45 Nourriture par tour.\nCette cit\xE9 ne peut \xEAtre am\xE9lior\xE9e en Grande Cit\xE9."
    },
    {
      categorie: "Economique",
      nom: "Clinique",
      cout: "Herboristerie requise.\n30 Or + 6 Pierre",
      effet: "Chances de contracter une maladie et de gu\xE9rir  d'une maladie augment\xE9es de 10%"
    },
    {
      categorie: "Economique",
      nom: "Place du march\xE9",
      cout: "Echoppe requise.\n20 Or + 6 Soie.",
      effet: "+4 Or par tour. Les marchands en provenance de cette ville produisent +1 ressource."
    },
    {
      categorie: "Economique",
      nom: "Port de commerce",
      cout: "Ponton requis.\n20 Or + 6 Bois +4 Fer.",
      effet: "+1 Or par case maritime, Co\xFBt des B\xE2teaux -15 Or."
    },
    {
      categorie: "Economique",
      nom: "Port de p\xEAche",
      cout: "20 Or + 4 B\xE9tail + 4 Bois.",
      effet: "Ponton requis. Les ressources maritimes am\xE9nag\xE9es rapportent +4 Nourritures par tour, vous pouvez d\xE9penser 8 B\xE9tails pour ajouter une ressource de Crabe dans l\u2019enceinte de la Cit\xE9."
    },
    {
      categorie: "Economique",
      nom: "Silo \xE0 grain",
      cout: "20 Or + 8 Bois.",
      effet: "Remplace la Grange.\n+ 25 Nourriture par tour."
    },
    {
      categorie: "Guilde",
      nom: "Guilde des artisans de la terre.",
      cout: "40 Or + 16 Bois + 6 B\xE9tails",
      effet: "Remplace le moulin \xE0 vent. Consomme 1 Charbon par tour. + 45 Nourriture par tour et r\xE9duit de 10 la consommation en nourriture de toutes vos Habitations. Cette cit\xE9 ne peut \xEAtre am\xE9lior\xE9e en Grande Cit\xE9."
    },
    {
      categorie: "Guilde",
      nom: "Grande Cit\xE9 : 40 Or + 12 B\xE9tail + 12 Charbons, 200 habitants requis",
      cout: "",
      effet: ""
    },
    {
      categorie: "Guilde",
      nom: "Consomme 20 Nourriture et 20 Or par tour. 40 Garnison.",
      cout: "",
      effet: ""
    },
    {
      categorie: "Militaire",
      nom: "Barraquements",
      cout: "Caserne requise.\n25 Or + 4 Fer.",
      effet: "Consomme 10 Nourritures par tour. Garnison +40."
    },
    {
      categorie: "Militaire",
      nom: "Responsable des voiries",
      cout: "30 Or + 6 Soie.",
      effet: "Les cases \xE0 3 cases ou moins de cette habitation ne co\xFBtent qu'un PM \xE0 franchir."
    },
    {
      categorie: "Economique",
      nom: "Complexe d'exploitation maritime",
      cout: "Ressource maritime am\xE9nag\xE9e requise.\n35 Or + 6 Fer.",
      effet: "+12 Or par tour."
    },
    {
      categorie: "Economique",
      nom: "Complexe d'exploitation terrestre",
      cout: "Camp de travailleurs requis.\n20 Or + 6 Fer + 8 Charbon",
      effet: "+1 Bois, +1 Pierre, +1 Fer, +1 Soie, +1 Charbon par pour."
    },
    {
      categorie: "Economique",
      nom: "Plateforme commerciale",
      cout: "Place du march\xE9 requise.\n40 Or + 12 Bois +4 Soie.",
      effet: "Octroi un marchand. Les marchands en provenance de cette ville produisent +4 Or par tour."
    },
    {
      categorie: "Economique",
      nom: "H\xF4pital",
      cout: "Pavillon requis.\n40 Or + 10 Pierre +4 Fer.",
      effet: "Chances de contracter une maladie et de gu\xE9rir  d'une maladie augment\xE9es de 15%"
    },
    {
      categorie: "Guilde",
      nom: "Guilde des bourgeois",
      cout: "Quartier requis.\n60 Or + 6 Charbon + 6 Soie.",
      effet: "Chances de contracter une maladie et de gu\xE9rir  d'une maladie augment\xE9es de 15% et un bonus jsplus ce que c'est"
    },
    {
      categorie: "Guilde",
      nom: "Guilde des marchands",
      cout: "Plateforme commerciale requise.\n30 Or + 8 Charbon + 8 Soie.",
      effet: "Remplace la plateforme commerciale. Consomme 1 Charbon par tour. Octroi un marchand suppl\xE9mentaire. Les marchands en provenance de cette ville produisent +1 Or par case travers\xE9e. La port\xE9e de vos routes commerciale est augment\xE9e de 6 cases."
    },
    {
      categorie: "Guilde",
      nom: "Guilde des marins",
      cout: "Complexe d'exploitation maritime requis.\n50 Or + 4 Fer + 6 Charbon.",
      effet: "Remplace le Complexe d'exploitation maritime. Consomme 1 Charbon par tour.\n+ 18 Or par tour. Toutes vos b\xE2teaux poss\xE8dent +2 PM."
    },
    {
      categorie: "Guilde",
      nom: "2",
      cout: "Jardin Flamboyants",
      effet: "+10 Nourriture par tour.\n+10 habitants \xE0 la construction d'une habitation."
    },
    {
      categorie: "Guilde",
      nom: "3",
      cout: "Pic Ascendant",
      effet: "+1 Science par tour.\nLorsque vous attaquez une habitation, sa garnison est r\xE9duite de 30."
    },
    {
      categorie: "Guilde",
      nom: "4",
      cout: "Ruines de Seth",
      effet: "+2 Or par case de d\xE9sert dans votre pays."
    },
    {
      categorie: "Guilde",
      nom: "5",
      cout: "S\xE9pulcre du \nRayonnant",
      effet: "+15 Tourisme."
    },
    {
      categorie: "Guilde",
      nom: "6",
      cout: "Tr\xE9sor du Roi Sorcier",
      effet: "+4 Or par rang de l'habitation."
    },
    {
      categorie: "Guilde",
      nom: "7",
      cout: "Fontaine des Miracles",
      effet: "Chaque fois qu'un personnage \xE0 votre cour tombe malade, jetez un d\xE9, sur 8+ il est gu\xE9rit.\nTourisme + 8."
    },
    {
      categorie: "Guilde",
      nom: "8",
      cout: "Larme Divine",
      effet: "+20 Tourisme."
    },
    {
      categorie: "Guilde",
      nom: "9",
      cout: "Pilliers C\xE9lestes",
      effet: "Augmente la garnison de l'ensemble de vos habitations de 20."
    },
    {
      categorie: "Guilde",
      nom: "10",
      cout: "Echine du Dragon",
      effet: "+1 Fer et +1 Charbon par tour."
    },
    {
      categorie: "Guilde",
      nom: "11",
      cout: "Bassin des Reflets",
      effet: "Vos habitations c\xF4ti\xE8res fournissent +2 Or par tour. \n+1 Science par tour."
    },
    {
      categorie: "Guilde",
      nom: "12",
      cout: "Griffes de la B\xEAte",
      effet: "Co\xFBt de recrutement des arm\xE9es dans cette habitation r\xE9duit de 10 Or."
    },
    {
      categorie: "Guilde",
      nom: "13",
      cout: "L'\u0152il Endormi",
      effet: "+1 Science par tour. +8 Tourisme."
    },
    {
      categorie: "Guilde",
      nom: "14",
      cout: "C\u0153ur Ancestral",
      effet: "+1 Gemme par tour."
    },
    {
      categorie: "Guilde",
      nom: "15",
      cout: "L'Ecaille rugissante",
      effet: "Augmente la garnison de l'habitation de 20.\n+1 Pierre par tour."
    },
    {
      categorie: "Guilde",
      nom: "16",
      cout: "La Dent Rocheuse",
      effet: "Garnison +15, +12 Tourisme."
    }
  ],
  batimentsChateau: [
    {
      categorie: "",
      nom: "Motte : 20 Or + 12 Bois  + 2 B\xE9tail",
      cout: "",
      effet: ""
    },
    {
      categorie: "",
      nom: "Consomme 2 Or par tour. 26 Garnison.",
      cout: "",
      effet: ""
    },
    {
      categorie: "Militaire",
      nom: "Poste de garde",
      cout: "25 Or + 4 Fer",
      effet: "Consomme 10 Nourritures par tour.\nGarnison +40."
    },
    {
      categorie: "Militaire",
      nom: "Herses",
      cout: "Acquis par d\xE9faut",
      effet: "Ajoute deux Herses lors de bataille de si\xE8ge, aux endroits choisis par le d\xE9fenseur."
    },
    {
      categorie: "Economique",
      nom: "Camp de b\xFBcheron",
      cout: "5 Or + 1 B\xE9tail.",
      effet: "+1 Bois par tour."
    },
    {
      categorie: "Economique",
      nom: "Camp de mineur",
      cout: "5 Or + 1 Charbon.",
      effet: "+1 Pierre par tour."
    },
    {
      categorie: "Economique",
      nom: "Camp d'ing\xE9nieur",
      cout: "10 Or + 2 Bois +2 Fer.",
      effet: "Les am\xE9liorations de fortifications (rouges) co\xFBtent 6 Or et 2 Bois de moins."
    },
    {
      categorie: "Economique",
      nom: "Conjuratoire",
      cout: "10 Or + 2 Pierre.",
      effet: "Tourisme +15."
    },
    {
      categorie: "Economique",
      nom: "Ecole \xE9l\xE9mentaire",
      cout: "10 Or + 2 B\xE9tail.",
      effet: "Consomme 1 Or par tour, peut accueillir 1 Professeur. Co\xFBt des Progr\xE8s -1 Science."
    },
    {
      categorie: "Economique",
      nom: "Echoppe",
      cout: "12 Or + 2 Bois.",
      effet: "+ 2 Or par tour. Permet d'entretenir 1 route commerciale suppl\xE9mentaire."
    },
    {
      categorie: "Economique",
      nom: "Herboristerie",
      cout: "10 Or + 2 Pierre",
      effet: "Chances de contracter une maladie et de gu\xE9rir  d'une maladie augment\xE9es de 5%"
    },
    {
      categorie: "Economique",
      nom: "Terrain d'entrainement",
      cout: "12 Or + 3 Bois.",
      effet: "Si vous levez une arm\xE9e dans cette habitation, d\xE9pensez 10 Or de moins."
    },
    {
      categorie: "Economique",
      nom: "Consomme 10 Nourriture et 8 Or par tour. 45 Garnison.",
      cout: "",
      effet: ""
    },
    {
      categorie: "Militaire",
      nom: "Caserne",
      cout: "Poste de garde requis. 25 Or + 4 Fer.",
      effet: "Consomme 10 Nourritures par tour. Garnison +40."
    },
    {
      categorie: "Militaire",
      nom: "R\xE9seau de routes",
      cout: "15 Or + 4 Soie.",
      effet: "Les cases dans l'enceinte de cette habitation ne co\xFBtent qu'un PM \xE0 franchir."
    },
    {
      categorie: "Militaire",
      nom: "Tour de sorcier",
      cout: "40 Or + 12 Pierres.",
      effet: "Une arm\xE9e amie peut se t\xE9l\xE9porter \xE0 une autre Tour de sorcier amie pour 1 Or par case travers\xE9e et 1 PM."
    },
    {
      categorie: "Economique",
      nom: "Cabinet d'astronomie",
      cout: "5 Or + 4 Pierre + 2 Soie.",
      effet: "+1 Science par tour."
    },
    {
      categorie: "Economique",
      nom: "Chapelle",
      cout: "Conjuratoire requis.\n10 Or + 8 Pierre",
      effet: "Tourisme +35."
    },
    {
      categorie: "Economique",
      nom: "Ecole interm\xE9diaire",
      cout: "16 Or + 6 Pierre",
      effet: "Remplace l'\xE9cole \xE9l\xE9mentaire. Consomme 3 Or par tour, peut accueillir 2 Professeurs. Co\xFBt des Progr\xE8s \n-2 Science."
    },
    {
      categorie: "Economique",
      nom: "Ecole militaire",
      cout: "Terrain d'entrainement requis.\n20 Or + 6 Bois + 4 Fer.",
      effet: "Si vous levez une arm\xE9e dans cette habitation, d\xE9pensez 25 Or de moins."
    },
    {
      categorie: "Economique",
      nom: "Clinique",
      cout: "Herboristerie requise.\n30 Or + 6 Pierre",
      effet: "Chances de contracter une maladie et de gu\xE9rir  d'une maladie augment\xE9es de 10%"
    },
    {
      categorie: "Guilde",
      nom: "Guilde des explorateurs",
      cout: "Ecole militaire et responsable des voiries requis.\n60 Or + 6 Pierre + 12 Soie.",
      effet: "Consomme 1 Charbon par tour. Vos arm\xE9es poss\xE8dent +1 PM. Co\xFBt de lev\xE9e d'arm\xE9e -20 Or."
    },
    {
      categorie: "Guilde",
      nom: "Forteresse : 120 Or + 10 Pierres + 12  Fer, 200 habitants requis",
      cout: "",
      effet: ""
    },
    {
      categorie: "Guilde",
      nom: "Consomme 20 Nourriture et 20 Or par tour. 90 Garnison.",
      cout: "",
      effet: ""
    },
    {
      categorie: "Militaire",
      nom: "Barraquements",
      cout: "Caserne requise.\n25 Or + 4 Fer.",
      effet: "Consomme 10 Nourritures par tour. Garnison +40."
    },
    {
      categorie: "Militaire",
      nom: "Responsable des voiries",
      cout: "30 Or + 6 Soie.",
      effet: "Les cases \xE0 3 cases ou moins de cette habitation ne co\xFBtent qu'un PM \xE0 franchir."
    },
    {
      categorie: "Economique",
      nom: "Commanderie",
      cout: "Chapelle requise.\n40 Or + 12 Pierre + 6 Fer.",
      effet: "Tourisme +50."
    },
    {
      categorie: "Economique",
      nom: "Ecole sup\xE9rieure",
      cout: "Ecole interm\xE9diaire requise. 20 Or + 10 Pierre + 4 soie.",
      effet: "Remplace l'\xE9cole \xE9l\xE9mentaire. Consomme 6 Or par tour, peut accueillir 3 Professeurs. Co\xFBt des Progr\xE8s \n-4 Science."
    },
    {
      categorie: "Economique",
      nom: "Institut de recherche",
      cout: "Cabinet d'astronomie requis 20 Or +6 Pierre + 8 Soie",
      effet: "+3 Science par tour."
    },
    {
      categorie: "Economique",
      nom: "H\xF4pital",
      cout: "Pavillon requis.\n40 Or + 10 Pierre +4 Fer.",
      effet: "Chances de contracter une maladie et de gu\xE9rir  d'une maladie augment\xE9es de 15%"
    },
    {
      categorie: "Guilde",
      nom: "Guilde des diplomates",
      cout: "Ecole sup\xE9rieure requise. 120 Or + 12 Pierre.",
      effet: "+2 Soie par tour. \xC0 la construction : +3 \xE9missaires en r\xE9serve (automatique)."
    },
    {
      categorie: "Guilde",
      nom: "Guilde des \xE9vangiles",
      cout: "Commanderie requise.\n60 Or + 12 Fer.",
      effet: "Remplace le conjuratoire. Consomme 1 Charbon par tour. Tourisme +70. Vos propagandistes podd\xE8dent une charge suppl\xE9mentaire."
    },
    {
      categorie: "Guilde",
      nom: "Guilde des savants",
      cout: "Institut de recherche requis.\n50 Or + 6 Charbon + 8 Soie",
      effet: "Remplace l'institut de recherche. Consomme 1 Charbon par tour.\n+6 Science par tour. Gagnez 20  Science lors de sa construction."
    },
    {
      categorie: "Guilde",
      nom: "Merveilles Mondiales",
      cout: "",
      effet: ""
    },
    {
      categorie: "Guilde",
      nom: "Antichambre d'Alexandrie",
      cout: "Habitation rang 3.\n70 Or + 50 Pierre.",
      effet: "Lors de sa construction, augmentez votre r\xE9serve d'Or de 50%.\n+14 Or par tour."
    },
    {
      categorie: "Guilde",
      nom: "Antre de la d\xE9esse araign\xE9e",
      cout: "Habitation rang 3.\n80 Or + 30 Soie + 20 Charbon.",
      effet: "+2 Soie par tour. \xC0 la construction : +3 \xE9missaires en r\xE9serve (automatique)."
    },
    {
      categorie: "Guilde",
      nom: "Laboratoire d'exp\xE9rimentations de Falheim",
      cout: "Habitation rang 3.\n90 Or + 40 Pierre +20 Fer.",
      effet: "Double la Science g\xE9n\xE9r\xE9e par votre capitale."
    },
    {
      categorie: "Guilde",
      nom: "Ordre des chevaliers d'Orcre",
      cout: "Habitation rang 3.\n70 Or + 40 Fer + 20 Charbon",
      effet: "Lors de sa construction, recrutez une arm\xE9e avec un co\xFBt r\xE9duit de 50 Or. Lorsqu'une de vos arm\xE9es attaque une habitation, r\xE9duit sa garnison de 150."
    },
    {
      categorie: "Guilde",
      nom: "Palais des empereurs de Lun",
      cout: "Habitation rang 3.\n100 Or + 30 Bois + 30 Pierre",
      effet: "Lors se sa construction, chaque habitation de chaque joueur voit se convertir 5 habitants.\n+20 Tourisme."
    },
    {
      categorie: "Guilde",
      nom: "Tour de Crystal",
      cout: "Habitation rang 3.\n80 Or + 10 Soie + 30 Pierre",
      effet: "Lorsque vous d\xE9couvrez un progr\xE8s, g\xE9n\xE9rez 3 d'une ressource de base al\xE9atoire. +5 Science par tour."
    },
    {
      categorie: "Guilde",
      nom: "Temple de bahamutt",
      cout: "Habitation rang 2+.\n40 Or + 20 Fer.",
      effet: "Recruter des arm\xE9es co\xFBte 20 Or de moins.\n+16 Tourisme."
    },
    {
      categorie: "Guilde",
      nom: "Mont Caracole",
      cout: "Habitation rang 1+.\n30 Or + 15 Fer.",
      effet: "Cette merveille est consid\xE9r\xE9e comme une tour de d\xE9fense. L'habitation est prot\xE9g\xE9e contre les tremblements de terre et \xE9ruptions volcaniques. Garnison + 40."
    },
    {
      categorie: "Guilde",
      nom: "Sanctuaire de Salmodiva",
      cout: "Habitation rang 1+.\n20 Or + 20 Bois.",
      effet: "+25 Nourriture par tour."
    },
    {
      categorie: "Guilde",
      nom: "Grands bains",
      cout: "Habitation rang 1+.\n30 Or + 10 Fer.",
      effet: "Les marais \xE0 5 cases ou moins sont prot\xE9g\xE9s contre les innondations.\n+8 Tourisme. +4 Or par tour."
    },
    {
      categorie: "Guilde",
      nom: "Mus\xE9e d'Arch\xE9ologie",
      cout: "Habitation rang 2+. 40 Or +30 Pierre +20 Soie.",
      effet: "+30 Tourisme."
    },
    {
      categorie: "Guilde",
      nom: "Jardins d'Alexandrie",
      cout: "Habitation rang 1+.\n40 Or + 10 B\xE9tail + 40 Nourriture.",
      effet: "+40 Habitants lors de sa construction."
    }
  ],
  rangsHabitation: [
    {
      rang: "Hameau : 20 Or + 10 Bois  + 6 B\xE9tail",
      cout: "",
      effet: ""
    },
    {
      rang: "Cit\xE9 : 40 Or + 8 B\xE9tail + 6 Pierres, 120 habitants requis",
      cout: "",
      effet: ""
    },
    {
      rang: "Grande Cit\xE9 : 40 Or + 12 B\xE9tail + 12 Charbons, 200 habitants requis",
      cout: "",
      effet: ""
    }
  ],
  batimentsCouts: [
    {
      batiment: "Cabinet d'astronomie",
      habitation: "",
      rang: "",
      type: "",
      prerequis: ""
    },
    {
      batiment: "Camp de b\xE2tisseurs",
      habitation: "Ville",
      rang: "1",
      type: "Economique",
      prerequis: "",
      Pierre: 4,
      Nourriture: 10
    },
    {
      batiment: "Camp de b\xFBcheron",
      habitation: "Ville",
      rang: "1",
      type: "Economique",
      prerequis: "",
      B\u00E9tail: 1,
      Nourriture: 8
    },
    {
      batiment: "Camp de mineur",
      habitation: "Ville",
      rang: "1",
      type: "Economique",
      prerequis: "",
      Charbon: 1,
      Nourriture: 8
    },
    {
      batiment: "Camp de travailleurs",
      habitation: "Ville",
      rang: "2",
      type: "Economique",
      prerequis: "",
      Fer: 4,
      Nourriture: 15
    },
    {
      batiment: "Camp d'ing\xE9nieur",
      habitation: "",
      rang: "",
      type: "",
      prerequis: ""
    },
    {
      batiment: "Chapelle",
      habitation: "",
      rang: "",
      type: "",
      prerequis: ""
    },
    {
      batiment: "Clinique",
      habitation: "",
      rang: "",
      type: "",
      prerequis: ""
    },
    {
      batiment: "Commanderie",
      habitation: "",
      rang: "",
      type: "",
      prerequis: ""
    },
    {
      batiment: "Complexe d'exploitation maritime",
      habitation: "Ville",
      rang: "3",
      type: "Economique",
      prerequis: "",
      Fer: 6,
      Nourriture: 35
    },
    {
      batiment: "Complexe d'exploitation terrestre",
      habitation: "Ville",
      rang: "3",
      type: "Economique",
      prerequis: "",
      Charbon: 6,
      Fer: 6,
      Soie: 6,
      Nourriture: 20
    },
    {
      batiment: "Conjuratoire",
      habitation: "",
      rang: "",
      type: "",
      prerequis: ""
    },
    {
      batiment: "Echoppe",
      habitation: "Ville",
      rang: "1",
      type: "Economique",
      prerequis: "",
      Bois: 3,
      Nourriture: 8
    },
    {
      batiment: "Ecole \xE9l\xE9mentaire",
      habitation: "",
      rang: "",
      type: "",
      prerequis: ""
    },
    {
      batiment: "Ecole interm\xE9diaire",
      habitation: "",
      rang: "",
      type: "",
      prerequis: ""
    },
    {
      batiment: "Ecole militaire",
      habitation: "",
      rang: "",
      type: "",
      prerequis: ""
    },
    {
      batiment: "Ecole sup\xE9rieure",
      habitation: "",
      rang: "",
      type: "",
      prerequis: ""
    },
    {
      batiment: "Etable",
      habitation: "Ville",
      rang: "2",
      type: "Economique",
      prerequis: "",
      B\u00E9tail: 4,
      Bois: 4,
      Nourriture: 10
    },
    {
      batiment: "Grange",
      habitation: "Ville",
      rang: "1",
      type: "Economique",
      prerequis: "",
      B\u00E9tail: 3,
      Bois: 3,
      Nourriture: 5
    },
    {
      batiment: "Guilde des  m\xE9decins",
      habitation: "",
      rang: "",
      type: "",
      prerequis: ""
    },
    {
      batiment: "Guilde des diplomates",
      habitation: "",
      rang: "",
      type: "",
      prerequis: ""
    },
    {
      batiment: "Guilde des \xE9vangiles",
      habitation: "",
      rang: "",
      type: "",
      prerequis: ""
    },
    {
      batiment: "Guilde des explorateurs",
      habitation: "",
      rang: "",
      type: "",
      prerequis: ""
    },
    {
      batiment: "Guilde des marchands",
      habitation: "",
      rang: "",
      type: "",
      prerequis: ""
    },
    {
      batiment: "Guilde des marins",
      habitation: "",
      rang: "",
      type: "",
      prerequis: ""
    },
    {
      batiment: "Guilde des savants",
      habitation: "",
      rang: "",
      type: "",
      prerequis: ""
    },
    {
      batiment: "Guile des artisans de la terre",
      habitation: "Ville",
      rang: "2",
      type: "Guilde",
      prerequis: "",
      B\u00E9tail: 6,
      Bois: 16,
      Nourriture: 40
    },
    {
      batiment: "Herboristerie",
      habitation: "",
      rang: "",
      type: "",
      prerequis: ""
    },
    {
      batiment: "H\xF4pital",
      habitation: "",
      rang: "",
      type: "",
      prerequis: ""
    },
    {
      batiment: "Institut de recherche",
      habitation: "",
      rang: "",
      type: "",
      prerequis: ""
    },
    {
      batiment: "Moulin \xE0 vent",
      habitation: "Ville",
      rang: "2",
      type: "Economique",
      prerequis: "",
      B\u00E9tail: 4,
      Bois: 6,
      Nourriture: 15
    },
    {
      batiment: "Place du march\xE9",
      habitation: "Ville",
      rang: "2",
      type: "Economique",
      prerequis: "",
      Soie: 6,
      Nourriture: 20
    },
    {
      batiment: "Plateforme commerciale",
      habitation: "Ville",
      rang: "3",
      type: "Economique",
      prerequis: "",
      Bois: 12,
      Soie: 4,
      Nourriture: 40
    },
    {
      batiment: "Ponton",
      habitation: "Ville",
      rang: "1",
      type: "Economique",
      prerequis: "",
      Bois: 5,
      Nourriture: 5
    },
    {
      batiment: "Port de commerce",
      habitation: "Ville",
      rang: "2",
      type: "Economique",
      prerequis: "",
      Bois: 6,
      Fer: 4,
      Nourriture: 20
    },
    {
      batiment: "Port de p\xEAche",
      habitation: "Ville",
      rang: "2",
      type: "Economique",
      prerequis: "",
      B\u00E9tail: 4,
      Bois: 4,
      Nourriture: 20
    },
    {
      batiment: "Silo \xE0 grain",
      habitation: "Ville",
      rang: "2",
      type: "Economique",
      prerequis: "",
      Bois: 8,
      Nourriture: 20
    },
    {
      batiment: "Terrain d'entrainement",
      habitation: "",
      rang: "",
      type: "",
      prerequis: ""
    }
  ],
  amenagements: [
    {
      amenagement: "Baleine",
      type: "",
      rang: "Rang I 1",
      effet: ""
    },
    {
      amenagement: "Brasserie",
      type: "",
      rang: "Rang II 2",
      effet: ""
    },
    {
      amenagement: "Carri\xE8re",
      type: "",
      rang: "Rang III 3",
      effet: ""
    },
    {
      amenagement: "Champ",
      type: "",
      rang: " ",
      effet: ""
    },
    {
      amenagement: "Crabe",
      type: "",
      rang: " ",
      effet: ""
    },
    {
      amenagement: "Foire",
      type: "",
      rang: " ",
      effet: ""
    },
    {
      amenagement: "Mine de Charbon",
      type: "",
      rang: " ",
      effet: ""
    },
    {
      amenagement: "Mine de Fer",
      type: "",
      rang: " ",
      effet: ""
    },
    {
      amenagement: "Mine d'Or",
      type: "",
      rang: " ",
      effet: ""
    },
    {
      amenagement: "Observatoire",
      type: "",
      rang: " ",
      effet: ""
    },
    {
      amenagement: "P\xE2turage",
      type: "",
      rang: " ",
      effet: ""
    },
    {
      amenagement: "Rizi\xE8re",
      type: "",
      rang: " ",
      effet: ""
    },
    {
      amenagement: "Ruines",
      type: "",
      rang: " ",
      effet: ""
    },
    {
      amenagement: "Scierie",
      type: "",
      rang: " ",
      effet: ""
    },
    {
      amenagement: "S\xE9riculture",
      type: "",
      rang: " ",
      effet: ""
    },
    {
      amenagement: "B\xE2timent",
      type: "",
      rang: " ",
      effet: ""
    },
    {
      amenagement: "Banque centrale",
      type: "",
      rang: " ",
      effet: ""
    },
    {
      amenagement: "Grande caserne",
      type: "",
      rang: " ",
      effet: ""
    },
    {
      amenagement: "H\xF4tel de tourisme",
      type: "",
      rang: " ",
      effet: ""
    },
    {
      amenagement: "Jardin int\xE9rieur",
      type: "",
      rang: " ",
      effet: ""
    },
    {
      amenagement: "Observatoire",
      type: "",
      rang: " ",
      effet: ""
    }
  ],
  progres: [
    {
      nom: "Progr\xE8s du d\xE9veloppement c\xF4tier",
      age: 1,
      tags: "C, PV, Aurore N",
      brancheA: [
        {
          nom: "Cours de p\xEAche",
          cout: "6",
          description: "Vos habitations c\xF4ti\xE8res produisent +4 Nourriture par tour."
        },
        {
          nom: "P\xEAche de culture",
          cout: "12",
          description: "Vos ressources maritimes produisent +3 Nourriture par tour."
        }
      ],
      brancheB: [
        {
          nom: "Commerce maritime I",
          cout: "6",
          description: "Vos habitations c\xF4ti\xE8res produisent +2 Or par tour."
        },
        {
          nom: "Expansion maritime",
          cout: "10",
          description: "Construire ou am\xE9liorer des habitations c\xF4ti\xE8res vous co\xFBte 3 Bois et 3 Pierre en moins."
        }
      ],
      techC: {
        nom: "Conqu\xEAte maritime",
        cout: "14",
        description: "D\xE9verrouille la construction des bateaux et b\xE2timents de faction."
      }
    },
    {
      nom: "Progr\xE8s des strat\xE9gies d\xE9fensives",
      age: 1,
      tags: "PL, N",
      brancheA: [
        {
          nom: "Milices civiles I",
          cout: "6",
          description: "+30 garnison dans votre capitale.",
          effets: [
            {
              type: "garnison",
              montant: 30,
              cible: "capitale"
            }
          ]
        },
        {
          nom: "Fortifications solides",
          cout: "10",
          description: "+15 Garnison dans vos habitations.",
          effets: [
            {
              type: "garnison",
              montant: 15,
              cible: "habitations"
            }
          ]
        }
      ],
      brancheB: [
        {
          nom: "Eriger des murs",
          cout: "4",
          description: "Vos habitations poss\xE8dent 2 herses."
        },
        {
          nom: "Quadrilat\xE8re strat\xE9gique",
          cout: "8",
          description: "Lorsque vous combattez en d\xE9fense d'habitation vous g\xE9n\xE9rez 1 d\xE9 de man\u0153uvre  blanc suippl\xE9mentaire."
        }
      ],
      techC: {
        nom: "Milices civiles",
        cout: "12",
        description: "+30 Garnison dans vos habitations.",
        effets: [
          {
            type: "garnison",
            montant: 30,
            cible: "habitations"
          }
        ]
      }
    },
    {
      nom: "Progr\xE8s de la d\xE9couverte scientifique",
      age: 1,
      tags: "PV, Aurore, N.V",
      brancheA: [
        {
          nom: "Progr\xE8s technologiques I",
          cout: "6",
          description: "Lorsque vous d\xE9bloquez cette technologie, vous gagnez 6 Science.",
          effets: [
            {
              type: "gain",
              montant: 6,
              ressource: "Science"
            }
          ]
        },
        {
          nom: "Progr\xE8s technologiques II",
          cout: "10",
          description: "Lorsque vous d\xE9bloquez cette technologie, vous gagnez 10 Science.",
          effets: [
            {
              type: "gain",
              montant: 10,
              ressource: "Science"
            }
          ]
        }
      ],
      brancheB: [
        {
          nom: "Comprendre la soie",
          cout: "8",
          description: "Votre b\xE2timent de capitale g\xE9n\xE8re +1 Science par tour.",
          effets: [
            {
              type: "prodCapitale",
              montant: 1,
              ressource: "Science"
            }
          ]
        },
        {
          nom: "Etude astronomique",
          cout: "12",
          description: "Votre capitale produit +1 Science par tour.",
          effets: [
            {
              type: "prodCapitale",
              montant: 1,
              ressource: "Science"
            }
          ]
        }
      ],
      techC: {
        nom: "Progr\xE8s technologiques III",
        cout: "14",
        description: "Lorsque vous d\xE9bloquez cette technologie, vous gagnez 14 Sciences.",
        effets: [
          {
            type: "gain",
            montant: 14,
            ressource: "Science"
          }
        ]
      }
    },
    {
      nom: "Progr\xE8s de l'offensive",
      age: 1,
      tags: "PL, V, Aurore",
      brancheA: [
        {
          nom: "Strat\xE9gies militaires I",
          cout: "7",
          description: "La prochaine arm\xE9e que vous levez co\xFBte 50 Or de moins."
        },
        {
          nom: "Raliement ! I",
          cout: "12",
          description: "Lorsque vous menez une bataille, vous b\xE9n\xE9ficiez d'un d\xE9 blanc de manoeuvre suppl\xE9mentaire \xE0 chaque tour."
        }
      ],
      brancheB: [
        {
          nom: "Rations",
          cout: "5",
          description: "Lorsque vous attaquez une habitation, sa garnison est r\xE9duite de 20."
        },
        {
          nom: "Service militaire",
          cout: "10",
          description: "Lorsque vous attaquez une habitation, vous b\xE9n\xE9ficiez d'Avant-garde sur 2 de vos mod\xE8les."
        }
      ],
      techC: {
        nom: "L'Art de la Guerre",
        cout: "14",
        description: "Vous pouvez poss\xE9der une unit\xE9 militaire suppl\xE9mentaire."
      }
    },
    {
      nom: "Progr\xE8s du d\xE9veloppement rural",
      age: 1,
      tags: "N, Aurore, C",
      brancheA: [
        {
          nom: "D\xE9veloppement durable",
          cout: "8",
          description: "Construire un am\xE9nagement co\xFBte 1 Bois de moins."
        },
        {
          nom: "D\xE9veloppement \xE9conome",
          cout: "12",
          description: "Construire un am\xE9nagement co\xFBte 3 Or de moins."
        }
      ],
      brancheB: [
        {
          nom: "Colonialisme durable",
          cout: "6",
          description: "Construire une nouvelle habitation co\xFBte 5 Bois de moins."
        },
        {
          nom: "Colonialisme \xE9conome",
          cout: "10",
          description: "Construire une nouvelle habitation co\xFBte 20 Or de moins."
        }
      ],
      techC: {
        nom: "Identit\xE9 commune",
        cout: "15",
        description: "Permet la construction du b\xE2timent de faction. Lorsque vous d\xE9bloquez ce progr\xE8s, ajoutez 5 habitants dans chacune de vos habitations."
      }
    },
    {
      nom: "Progr\xE8s du d\xE9veloppement urbain",
      age: 1,
      tags: "V, N",
      brancheA: [
        {
          nom: "D\xE9forestation",
          cout: "8",
          description: "Votre capitale produit +1 Bois par tour.",
          effets: [
            {
              type: "prodCapitale",
              montant: 1,
              ressource: "Bois"
            }
          ]
        },
        {
          nom: "Carrieristes",
          cout: "14",
          description: "Votre capitale produit +1 Pierre par tour.",
          effets: [
            {
              type: "prodCapitale",
              montant: 1,
              ressource: "Pierre"
            }
          ]
        }
      ],
      brancheB: [
        {
          nom: "Granges",
          cout: "5",
          description: "Votre capitale g\xE9n\xE8re 10 Nourriture par tour.",
          effets: [
            {
              type: "prodCapitale",
              montant: 10,
              ressource: "Nourriture"
            }
          ]
        },
        {
          nom: "S\xE9dentarisation",
          cout: "12",
          description: "Lorsque vous d\xE9bloquez ce progr\xE8s, ajoutez 20 habitants dans votre capitale."
        }
      ],
      techC: {
        nom: "Une ville magnifique",
        cout: "15",
        description: "Permet la construction du b\xE2timent de faction. Lorsque vous d\xE9bloquez ce progr\xE8s, ajoutez 20 habitants dans votre capitale."
      }
    },
    {
      nom: "Progr\xE8s du d\xE9veloppement \xE9conomique",
      age: 1,
      tags: "N, V",
      brancheA: [
        {
          nom: "Organisation fiscale",
          cout: "3",
          description: "Votre capitale produit +2 Or par tour.",
          effets: [
            {
              type: "prodCapitale",
              montant: 2,
              ressource: "Or"
            }
          ]
        },
        {
          nom: "Usinage",
          cout: "14",
          description: "Votre capitale g\xE9n\xE8re 1 Charbon par tour.",
          effets: [
            {
              type: "prodCapitale",
              montant: 1,
              ressource: "Charbon"
            }
          ]
        }
      ],
      brancheB: [
        {
          nom: "Commerce",
          cout: "6",
          description: "Vous pouvez poss\xE9der un marchand suppl\xE9mentaire."
        },
        {
          nom: "Commerce lointain",
          cout: "10",
          description: "Vos marchands vous rapportent 3 Or par tour suppl\xE9mentaires.",
          effets: [
            {
              type: "prodParTitre",
              montant: 3,
              ressource: "Or",
              titre: "Marchand"
            }
          ]
        }
      ],
      techC: {
        nom: "Collecte d'imp\xF4ts",
        cout: "14",
        description: "Vous pouvez poss\xE9der un marchand suppl\xE9mentaire. Lorsque vous d\xE9bloquez cette technologie, recevez 20 Or.",
        effets: [
          {
            type: "gain",
            montant: 20,
            ressource: "Or"
          }
        ]
      }
    },
    {
      nom: "Progr\xE8s des relations diplomatiques",
      age: 1,
      tags: "",
      brancheA: [
        {
          nom: "Vasselit\xE9",
          cout: "8",
          description: "Si vous \xEAtes un vassal, vos habitations ont +20 Garnison."
        },
        {
          nom: "Tribut de cour",
          cout: "12",
          description: "Si vous \xEAtes un vassal, votre capitale produit +4 Or et +8 Tourisme."
        }
      ],
      brancheB: [
        {
          nom: "Garde suzeraine",
          cout: "6",
          description: "Si vous \xEAtes suzerain, votre capitale produit +12 Nourriture par tour."
        },
        {
          nom: "Patronage",
          cout: "10",
          description: "Si vous \xEAtes suzerain, votre capitale produit +1 Science par tour."
        }
      ],
      techC: {
        nom: "\xC9missaires de cour",
        cout: "14",
        description: "Lorsque vous d\xE9bloquez cette technologie, recevez 1 \xC9missaire."
      }
    },
    {
      nom: "Progr\xE8s du Tourisme",
      age: 1,
      tags: "",
      brancheA: [
        {
          nom: "Tr\xE9sor public",
          cout: "8",
          description: "Vos merveilles co\xFBtent 20 Or de moins \xE0 la construction."
        },
        {
          nom: "Mat\xE9riaux de prestige",
          cout: "12",
          description: "Vos merveilles co\xFBtent 4 ressources de moins \xE0 la construction."
        }
      ],
      brancheB: [
        {
          nom: "Routes pittoresques",
          cout: "6",
          description: "Vos habitations produisent +2 Tourisme."
        },
        {
          nom: "Mise en valeur",
          cout: "10",
          description: "Vos b\xE2timents de faction produisent +3 Tourisme."
        }
      ],
      techC: {
        nom: "Capitale prestigieuse",
        cout: "14",
        description: "Votre capitale rapporte 20 Tourisme. Vous pouvez maintenant construire votre b\xE2timent de faction."
      }
    },
    {
      nom: "Progr\xE8s de la diplomatie",
      age: 2,
      tags: "",
      brancheA: [
        {
          nom: "Geste",
          cout: "18",
          description: "Lorsque vous d\xE9bloquez cette technologie, recevez 1 \xC9missaire (cr\xE9dit\xE9 automatiquement en r\xE9serve).",
          effets: [
            {
              type: "gain",
              montant: 1,
              ressource: "\xC9missaires"
            }
          ]
        },
        {
          nom: "Offrande",
          cout: "24",
          description: "Lorsque vous d\xE9bloquez cette technologie, recevez 1 \xC9missaire (cr\xE9dit\xE9 automatiquement en r\xE9serve).",
          effets: [
            {
              type: "gain",
              montant: 1,
              ressource: "\xC9missaires"
            }
          ]
        }
      ],
      brancheB: [
        {
          nom: "D\xE9l\xE9gation",
          cout: "16",
          description: "Le prochain assassin jou\xE9 contre vous est annul\xE9 et le joueur l'ayant jou\xE9 doit vous verser 10 fois son rang de pays sous forme d'Or (plateau)."
        },
        {
          nom: "Ambassade",
          cout: "28",
          description: "Quiconque utilise un serment sur vous re\xE7oit 10 Science. Vous recevez alors 15 Science (plateau)."
        }
      ],
      techC: {
        nom: "Vassalisation",
        cout: "46",
        description: "Les cartes de dynastie d'imp\xF4ts g\xE9n\xE8rent 1 fois suppl\xE9mentaire l'imp\xF4t et vous octroient, ainsi qu'\xE0 vos vassaux, 5 Science (les cartes de dynastie ne sont pas encore automatis\xE9es \u2014 \xE0 g\xE9rer au plateau)."
      }
    },
    {
      nom: "Progr\xE8s du d\xE9veloppement urbain",
      age: 2,
      tags: "",
      brancheA: [
        {
          nom: "Viser le ciel",
          cout: "14",
          description: "Construire un b\xE2timent dans vos habitations co\xFBte 15 Or de moins."
        },
        {
          nom: "Villes et sommets",
          cout: "24",
          description: "Am\xE9liorer vos habitations requiert 15 Or, 3 Bois, 3 Pierre et 3 Fer en moins."
        }
      ],
      brancheB: [
        {
          nom: "Milles et une villes",
          cout: "17",
          description: "Lorsque vous fondez une nouvelle habitation, vous pouvez y construire imm\xE9diatement 2 am\xE9nagements gratuits."
        },
        {
          nom: "Expansionnisme",
          cout: "30",
          description: "Les habitations \xE0 plus de 7 case de votre capitale  produisent  2  Or et 2 Nourriture suppl\xE9mentaires par tour."
        }
      ],
      techC: {
        nom: "Identit\xE9 statique",
        cout: "44",
        description: ""
      }
    },
    {
      nom: "Progr\xE8s d\xE9fensif avanc\xE9",
      age: 2,
      tags: "PV, N",
      brancheA: [
        {
          nom: "Milices civiles III",
          cout: "16",
          description: "+20 Garnison dans vos habitations.",
          effets: [
            {
              type: "garnison",
              montant: 20,
              cible: "habitations"
            }
          ]
        },
        {
          nom: "Organisation d\xE9fensive",
          cout: "26",
          description: "R\xE9duit le co\xFBt de construction des b\xE2timents d\xE9fensifs de 4 Or et 2 ressources."
        }
      ],
      brancheB: [
        {
          nom: "Gestion de crise",
          cout: "22",
          description: "La prochaine crise est annul\xE9e."
        },
        {
          nom: "Combler les lacunes",
          cout: "24",
          description: "Vos habitations ne peuvent avoir moins de  30 Garnison."
        }
      ],
      techC: {
        nom: "Muraille",
        cout: "30",
        description: "+40 Garnison dans vos habitations."
      }
    },
    {
      nom: "Progr\xE8s de l'\xE9cologie",
      age: 2,
      tags: "PV, N, Aurore",
      brancheA: [
        {
          nom: "Barrage",
          cout: "22",
          description: "Lors d'innondations, choisissez 3 am\xE9nagements dans chacune de vos habitations qui ne seront pas d\xE9truits."
        },
        {
          nom: "Projet anti incendie",
          cout: "34",
          description: "Lors d'explosions volcaniques ou glissements de terrain, choisissez 3 am\xE9nagements dans chacune de vos habitations qui ne seront pas d\xE9truits."
        }
      ],
      brancheB: [
        {
          nom: "Engrais naturels I",
          cout: "18",
          description: "Les champs et rizi\xE8res produisent +2 Nourriture par tour.",
          effets: [
            {
              type: "prodParAmenagement",
              montant: 2,
              ressource: "Nourriture",
              amenagements: [
                "Champ",
                "Rizi\xE8re"
              ]
            }
          ]
        },
        {
          nom: "Engrais naturels II",
          cout: "24",
          description: "Les champs et rizi\xE8res produisent +3 Nourriture par tour.",
          effets: [
            {
              type: "prodParAmenagement",
              montant: 3,
              ressource: "Nourriture",
              amenagements: [
                "Champ",
                "Rizi\xE8re"
              ]
            }
          ]
        }
      ],
      techC: {
        nom: "Recyclage",
        cout: "26",
        description: "Vous recevez 30 Or. Vos usines produisent +1 Production par tour.",
        effets: [
          {
            type: "gain",
            montant: 30,
            ressource: "Or"
          }
        ]
      }
    },
    {
      nom: "Progr\xE8s de l'\xE9ducation",
      age: 2,
      tags: "",
      brancheA: [
        {
          nom: "Assembl\xE9e de penseurs",
          cout: "20",
          description: "D\xE9couvrir un Progr\xE8s co\xFBte 2 Science en moins."
        },
        {
          nom: "Assembl\xE9e de savants",
          cout: "28",
          description: "D\xE9couvrir un Progr\xE8s co\xFBte 3 Science en moins."
        }
      ],
      brancheB: [
        {
          nom: "Lumi\xE8re",
          cout: "16",
          description: "Votre capitale produit +1 Science par tour."
        },
        {
          nom: "Merveilleux",
          cout: "26",
          description: "Vos merveilles produisent +1 Science par tour",
          effets: [
            {
              type: "prodCapitale",
              montant: 1,
              ressource: "Science"
            }
          ]
        }
      ],
      techC: {
        nom: "Assembl\xE9es scientifiques",
        cout: "34",
        description: "Vos habitations produisent +1 Science par tour.",
        effets: [
          {
            type: "prodParHabitation",
            montant: 1,
            ressource: "Science"
          }
        ]
      }
    },
    {
      nom: "Progr\xE8s de l'ouverture culturelle",
      age: 2,
      tags: "",
      brancheA: [
        {
          nom: "Fascination culturelle",
          cout: "16",
          description: "Les foires fournissent +2 Tourisme",
          effets: [
            {
              type: "prodParAmenagement",
              montant: 2,
              ressource: "Tourisme",
              amenagements: [
                "Foire"
              ]
            }
          ]
        },
        {
          nom: "Stands de goodies",
          cout: "22",
          description: "Les foires fournissent +2 Or par tour et +2 Tourisme.",
          effets: [
            {
              type: "prodParAmenagement",
              montant: 2,
              ressource: "Or",
              amenagements: [
                "Foire"
              ]
            },
            {
              type: "prodParAmenagement",
              montant: 2,
              ressource: "Tourisme",
              amenagements: [
                "Foire"
              ]
            }
          ]
        }
      ],
      brancheB: [
        {
          nom: "Safaris",
          cout: "14",
          description: "Vos merveilles naturelle fournissent +5 Tourisme."
        },
        {
          nom: "Parcs naturels",
          cout: "24",
          description: "Les sites arch\xE9ologiques fournissent +8 Tourisme.",
          effets: [
            {
              type: "prodParAmenagement",
              montant: 8,
              ressource: "Tourisme",
              amenagements: [
                "Site arch\xE9ologique"
              ]
            }
          ]
        }
      ],
      techC: {
        nom: "Exposition universelle",
        cout: "32",
        description: "Votre capitale peut poss\xE9der une merveille suppl\xE9mentaire. Les merveilles dans votre capitale co\xFBtent 30 Or de moins \xE0 construire."
      }
    },
    {
      nom: "Progr\xE8s de l'arm\xE9e nationale",
      age: 2,
      tags: "",
      brancheA: [
        {
          nom: "Grande arm\xE9e I",
          cout: "14",
          description: "Vous pouvez poss\xE9der une arm\xE9e supp\xE9mentaire. Vous poss\xE9dez un d\xE9 de man\u0153uvre blanc suppl\xE9mentaire en bataille."
        },
        {
          nom: "Corps d'arm\xE9e",
          cout: "20",
          description: "La vitesse de vos arm\xE9e augmente de 1 PM."
        }
      ],
      brancheB: [
        {
          nom: "Conscription I",
          cout: "16",
          description: "Recruter une arm\xE9e vous co\xFBte 10 Or de moins. Lorsque vous attaquez une habitation, sa garnison est r\xE9duite de 20."
        },
        {
          nom: "Croisade",
          cout: "24",
          description: "Lorsque vous remportez une victoire militaire, gagnez 30 Or et 5 Tourisme."
        }
      ],
      techC: {
        nom: "Coup d'\xE9tat",
        cout: "32",
        description: "Lorsque vous menez une bataille, vous pouvez d\xE9signer un des sites d'armes de votre adversaire. Il ne pourra pas le jouer pour cette bataille."
      }
    },
    {
      nom: "Progr\xE8s de l'arm\xE9e nationale",
      age: 3,
      tags: "",
      brancheA: [
        {
          nom: "Grande arm\xE9e",
          cout: "38",
          description: "Vous pouvez poss\xE9der une arm\xE9e supp\xE9mentaire. Lorsque vous attaquez une habitation, sa garnison est r\xE9duite de 80."
        },
        {
          nom: "Sappeurs",
          cout: "56",
          description: "Lorsqu'une de vos arm\xE9e attaque une habitation, celle-ci ne peut b\xE9n\xE9ficier de ses remparts."
        }
      ],
      brancheB: [
        {
          nom: "Conscription",
          cout: "34",
          description: "Recruter une arm\xE9e vous co\xFBte 12 Or de moins. Vos arm\xE9es ont +1 PM."
        },
        {
          nom: "Grand d\xE9ploiement",
          cout: "58",
          description: "Lorsque vous menez une bataille, votre adversaire d\xE9ploie son arm\xE9e enti\xE8rement, puis vous d\xE9ployez la votre. Vous choissez qui a le premier tour."
        }
      ],
      techC: {
        nom: "Art de la Guerre",
        cout: "66",
        description: "Lorsque vous menez une bataille, vous pouvez choisir votre liste d'arm\xE9e apr\xE8s votre adversaire."
      }
    },
    {
      nom: "Progr\xE8s de la d\xE9fense nationale",
      age: 3,
      tags: "",
      brancheA: [
        {
          nom: "Progr\xE8s de la d\xE9fense nationale A1",
          cout: "20",
          description: "+40 Garnison dans vos habitations."
        },
        {
          nom: "R\xE9servistes",
          cout: "62",
          description: "Vos arm\xE9es dans des habitations ont un entretient de 0 Or et Nourriture par tour."
        }
      ],
      brancheB: [
        {
          nom: "Milices civiles V",
          cout: "36",
          description: "+40 Garnison dans vos habitations.",
          effets: [
            {
              type: "garnison",
              montant: 40,
              cible: "habitations"
            }
          ]
        },
        {
          nom: "Service militaire avanc\xE9",
          cout: "64",
          description: "Vos habitations gagnent un nombre d'habitants par tour \xE9gal \xE0 0,5 fois leur garnison."
        }
      ],
      techC: {
        nom: "Pr\xE9 carr\xE9",
        cout: "82",
        description: "+20 Garnison dans chacune de vos habitations. Vos habitations ne peuvent plus \xEAtre la cible de bombardements.",
        effets: [
          {
            type: "garnison",
            montant: 20,
            cible: "habitations"
          }
        ]
      }
    },
    {
      nom: "Progr\xE8s du d\xE9veloppement futur",
      age: 3,
      tags: "PV",
      brancheA: [
        {
          nom: "Technologies futures I",
          cout: "32",
          description: "Votre capitale produit +3 Science par tour.",
          effets: [
            {
              type: "prodCapitale",
              montant: 3,
              ressource: "Science"
            }
          ]
        },
        {
          nom: "Technologies futures II",
          cout: "44",
          description: "Vos habitations produisent +1 Science par tour.",
          effets: [
            {
              type: "prodParHabitation",
              montant: 1,
              ressource: "Science"
            }
          ]
        }
      ],
      brancheB: [
        {
          nom: "Mus\xE9es",
          cout: "32",
          description: "+30 Tourisme dans votre capitale.",
          effets: [
            {
              type: "prodCapitale",
              montant: 30,
              ressource: "Tourisme"
            }
          ]
        },
        {
          nom: "Merveilles naturelles",
          cout: "48",
          description: "Co\xFBt de construction des merveilles -10 Ressources. Les merveilles g\xE9n\xE8rent +10 Tourisme."
        }
      ],
      techC: {
        nom: "Progr\xE8s du d\xE9veloppement futur C",
        cout: "60",
        description: "Vous pouvez poss\xE9der 1 ministre suppl\xE9mentaire.",
        effets: [
          {
            type: "ministreSup"
          }
        ]
      }
    },
    {
      nom: "Progr\xE8s du d\xE9veloppement \xE9conomique",
      age: 3,
      tags: "",
      brancheA: [
        {
          nom: "Taxe n\xE9c\xE9ssaire I",
          cout: "38",
          description: "Lorsque vous d\xE9bloquez ce progr\xE8s, recevez 250 Or.",
          effets: [
            {
              type: "gain",
              montant: 250,
              ressource: "Or"
            }
          ]
        },
        {
          nom: "Taxes n\xE9c\xE9ssaire II",
          cout: "46",
          description: "Lorsque vous d\xE9bloquez ce progr\xE8s, recevez 300 Or.",
          effets: [
            {
              type: "gain",
              montant: 300,
              ressource: "Or"
            }
          ]
        }
      ],
      brancheB: [
        {
          nom: "Hausse du loyer",
          cout: "32",
          description: "Votre capitale produit +15 Or par tour.",
          effets: [
            {
              type: "prodCapitale",
              montant: 15,
              ressource: "Or"
            }
          ]
        },
        {
          nom: "Urbanisme",
          cout: "54",
          description: "Votre capitale peut accueillir un b\xE2timent suppl\xE9mentaire."
        }
      ],
      techC: {
        nom: "Progr\xE8s du d\xE9veloppement \xE9conomique C",
        cout: "40",
        description: "Lorsque vous d\xE9bloquez cette technologie, montez de rang de pays puis recevez 50 Or par ministre que vous poss\xE9dez.",
        effets: [
          {
            type: "rangPays"
          },
          {
            type: "orParMinistre",
            montant: 50
          }
        ]
      }
    },
    {
      nom: "Progr\xE8s d'humanisme",
      age: 3,
      tags: "",
      brancheA: [
        {
          nom: "Pr\xE9fectures",
          cout: "48",
          description: "Lorsque vous d\xE9bloquez ce progr\xE8s, ajoutez 15 habitants dans chacune de vos habitations."
        },
        {
          nom: "Prix Gorback Nobel",
          cout: "60",
          description: "Vos Ministres g\xE9n\xE8rent +6 Science par tour.",
          effets: [
            {
              type: "prodParTitre",
              montant: 6,
              ressource: "Science",
              titre: "Ministre"
            }
          ]
        }
      ],
      brancheB: [
        {
          nom: "Greniers",
          cout: "46",
          description: "Lorsque vous d\xE9bloquez ce progr\xE8s, ajoutez 40 habitants dans votre capitale."
        },
        {
          nom: "Culte de la personnalit\xE9",
          cout: "60",
          description: "Vos Ministres g\xE9n\xE8rent +30 Tourisme.",
          effets: [
            {
              type: "prodParTitre",
              montant: 30,
              ressource: "Tourisme",
              titre: "Ministre"
            }
          ]
        }
      ],
      techC: {
        nom: "Gouvernement",
        cout: "78",
        description: "Vous pouvez poss\xE9der 1 Ministre suppl\xE9mentaire."
      }
    },
    {
      nom: "Progr\xE8s de l'industrialisation",
      age: 3,
      tags: "",
      brancheA: [
        {
          nom: "Charues",
          cout: "44",
          description: "Vos champs produisent +5 Nourriture  et +1 Or par tour."
        },
        {
          nom: "Exploitation foresti\xE8re",
          cout: "58",
          description: "Vos Scieries ne produisent plus de Bois mais du Charbon."
        }
      ],
      brancheB: [
        {
          nom: "Surconsommation",
          cout: "40",
          description: "Vos habitations consomment 10 Nourriture par rang de l'habitation mais g\xE9n\xE8rent 1 Science et 5 Tourisme par rang de l'habitation."
        },
        {
          nom: "Industrialisation",
          cout: "52",
          description: "Vos b\xE2timents co\xFBtent 3 Ressources de moins et produisent+1 Charbon par tour."
        }
      ],
      techC: {
        nom: "Machine \xE0 vapeur",
        cout: "72",
        description: "+200 Habitants dans votre capitale."
      }
    },
    {
      nom: "Progr\xE8s de la Suzerainet\xE9",
      age: 3,
      tags: "",
      brancheA: [
        {
          nom: "Hommage solennel",
          cout: "46",
          description: "Lorsque vous d\xE9bloquez cette technologie, recevez 2 \xC9missaires."
        },
        {
          nom: "Offrandes",
          cout: "58",
          description: "Lorsque vous d\xE9bloquez cette technologie, recevez 3 \xC9missaires."
        }
      ],
      brancheB: [
        {
          nom: "Cartes de dynastie",
          cout: "16",
          description: "Recevez 3 Cartes de dynastie."
        },
        {
          nom: "Diplomatie effr\xE9n\xE9e",
          cout: "28",
          description: "Vous pouvez jouer autant de cartes Dynastie que vous souhaitez \xE0 chaque tour."
        }
      ],
      techC: {
        nom: "Vassalit\xE9 \xE9largie",
        cout: "46",
        description: "Vous pouvez poss\xE9der 1 carte Dynastie suppl\xE9mentaire. Vous piochez donc une carte Dynastie de plus \xE0 chaque tour."
      }
    }
  ],
  tourismeSeuils: [
    {
      seuil: 60,
      bonus: "Votre capitale re\xE7oit 15 habitants."
    },
    {
      seuil: 100,
      bonus: "Pontificat Rang I"
    },
    {
      seuil: 125,
      bonus: "A la fin de chaque \xE9t\xE9, recevez 3 de la ressource de base de votre choix."
    },
    {
      seuil: 150,
      bonus: "Votre capitale re\xE7oit 15 habitants."
    },
    {
      seuil: 180,
      bonus: "Pontificat Rang II"
    },
    {
      seuil: 220,
      bonus: "A la fin de chaque hiver, recevez 1 \xC9missaire en r\xE9serve (\xE0 g\xE9rer au plateau)."
    },
    {
      seuil: 260,
      bonus: "Votre capitale re\xE7oit 15 habitants."
    },
    {
      seuil: 340,
      bonus: "Pontificat Rang III"
    }
  ],
  dogmes: [
    {
      dogme: "Dogme des Lumi\xE8res",
      bonusPontife: "Rang 1 : Votre capitale produit +1 Science par tour.\nRang 2 : Votre capitale produit +1 Science par tour.\nRang 3 : Chacune de vos habitations produit +1 Science par tour.",
      bonusFideles: "Rang 1 : Votre capitale produit +1 Science par tour.\nRang 2 : Votre capitale produit +1 Science par tour.\nRang 3 : Votre capitale produit +2 Science par tour."
    },
    {
      dogme: "Dogme du Capitalisme",
      bonusPontife: "Rang 1 : Votre capitale produit +4 Or par tour.\nRang 2 : Votre capitale produit +6 Or par tour.\nRang 3 : Votre capitale peut accueillir un b\xE2timent suppl\xE9mentaire.",
      bonusFideles: "Rang 1 : Port\xE9e des routes commerciales +2.\nRang 2 : Capacit\xE9 de marchands +1.\nRang 3 : Votre capitale produit +20 Or par tour."
    },
    {
      dogme: "Dogme des Guerres-Saintes",
      bonusPontife: "Rang 1 : Garnison dans vos habitations +30.\nRang 2 : Tourisme +20.\nRang 3 : Garnison +20 et Tourisme +5 dans chacune de vos habitations.",
      bonusFideles: "Rang 1 : R\xE9duit les garnisons de culture adverse de 20.\nRang 2 : Taille max des arm\xE9es +50 pts.\nRang 3 :  Taille max des arm\xE9es +50 pts, co\xFBt de lev\xE9e d'arm\xE9e -20 Or."
    },
    {
      dogme: "Dogme du Pacifisme",
      bonusPontife: "Rang 1 : Gagnez imm\xE9diatement 1 \xE9missaire avec la cit\xE9 libre de votre choix, puis gagnez 1 \xE9missaire suppl\xE9mentaire avec la cit\xE9 libre de votre choix \xE0 chaque nouveau passage d'\xE2ge.\nRang 2 : Chaque serment que vous poss\xE9dez (vassaux et cit\xE9s libres dont vous \xEAtes le suzerain) vous rapporte +3 Or et +3 Nourriture par tour (maximum 4 serments).\nRang 3 : Vous devenez suzerain d'une cit\xE9 libre d\xE8s 2 \xE9missaires (au lieu de 3).",
      bonusFideles: "Rang 1 : Votre tribut de vassalit\xE9 est all\xE9g\xE9 : vous reversez 40 % des revenus de vos habitants \xE0 votre suzerain (au lieu de 50 %).\nRang 2 : Tant que vous \xEAtes vassal : vos habitations gagnent +10 Garnison et vous gagnez +2 Or par tour.\nRang 3 : Tant que vous \xEAtes vassal : vos habitations gagnent +10 Garnison suppl\xE9mentaires et vous gagnez +2 Nourriture et +2 Or par tour suppl\xE9mentaires."
    },
    {
      dogme: "Dogme du Socialisme",
      bonusPontife: "Rang 1 : Votre capitale re\xE7oit 15 habitants.\nRang 2 : Vous gagnez +5 Or par tour pour chacun de vos Ministres.\nRang 3 : Vos gouverneurs rapportent 1 Science par tour.",
      bonusFideles: "Rang 1 : Votre capitale re\xE7oit 15 habitants.\nRang 2 : Vous pouvez poss\xE9der un Ministre suppl\xE9mentaire.\nRang 3 : Votre capitale re\xE7oit 35 habitants."
    }
  ],
  citesLibres: [
    {
      type: "Industrielles - Ville\n(cases for\xEAts ou marais)",
      effet: "Votre capitale produit +1 Bois par rang de l'habitation."
    },
    {
      type: "Maritime - Ville\n(adjascentes \xE0 2 case eau ou 4 cases rivi\xE8re)",
      effet: "Ttoutes vos habitations produisent +1 Nourriture par rang de l'habitation."
    },
    {
      type: "Militaires - Ch\xE2teau\n(cases plaines)",
      effet: "Co\xFBt de lev\xE9e d'arm\xE9e r\xE9duit de 10 or par rang de votre pays."
    },
    {
      type: "Economique - Chateau\n(cases d\xE9sert)",
      effet: "+1 science par tour dans votre capitale."
    }
  ],
  regleCitesLibres: "On appelle cit\xE9 libre, une cit\xE9 n\u2019appartenant \xE0 aucun joueur. Si un joueur perd une de ses habitations par tout autre moyen que par l\u2019action directe d\u2019un autre joueur, celle-ci devient \xE0 son tour une cit\xE9 libre. Lorsqu\u2019une cit\xE9 libre apparait sur le terrain de jeu, son type est d\xE9termin\xE9 par la case sur laquelle elle se trouve. Un joueur dont une cit\xE9 est devenue libre obtient imm\xE9diatement 1 Emissaire\n     Les cit\xE9s libres poss\xE8dent 100 Garnison +40 Garnison par rang de pays du joueur ayant le plus haut rang, et change de niveau d'habitation d\xE8s qu'un joueur entre dans une nouvelle \xE8re.\n     Au cours de la partie, les joueurs pourront tenter de gagner de l\u2019influence aupr\xE8s des diff\xE9rentes cit\xE9s libres. Vous ne pouvez gagner en influence qu\u2019une seule fois par saison.\n     Lorsque vous atteignez 3 \xE9missaires avec une cit\xE9 libre, vous avez la possibilit\xE9 de devenir son suzerain. Une cit\xE9 libre compte comme un Serment pour son Suzerain.",
  victoires: [
    {
      voie: "Culturelle",
      lauriers: [
        {
          laurier: "Laurier I",
          condition: "Poss\xE9der un Pontificat de rang I.",
          bonus: "Si compl\xE9t\xE9 pendant l'\xC2ge 1 : la prochaine Merveille co\xFBte 20 Or et 10 Ressources de base de moins. Crise \xE0 la validation."
        },
        {
          laurier: "Laurier II",
          condition: "Poss\xE9der 3 Merveilles.",
          bonus: "Si compl\xE9t\xE9 pendant l'\xC2ge 2 : vous recevez 20 Tourisme et 1 \xC9missaire. Crise \xE0 la validation."
        },
        {
          laurier: "Laurier III",
          condition: "Poss\xE9der un Pontificat de rang III.",
          bonus: "Aucune r\xE9compense. Crise \xE0 la validation."
        },
        {
          laurier: "Laurier IV",
          condition: "Poss\xE9der 360 Tourisme et 4 Merveilles.",
          bonus: "Victoire !"
        }
      ]
    },
    {
      voie: "D\xE9mographique",
      lauriers: [
        {
          laurier: "Laurier I",
          condition: "Poss\xE9der 3 habitations.",
          bonus: "Si compl\xE9t\xE9 pendant l'\xC2ge 1 : la prochaine habitation co\xFBte 5 Bois de moins et commence avec 15 habitants suppl\xE9mentaires. Crise \xE0 la validation."
        },
        {
          laurier: "Laurier II",
          condition: "Poss\xE9der une habitation avec 300 habitants.",
          bonus: "Si compl\xE9t\xE9 pendant l'\xC2ge 2 : la population de votre capitale augmente de 30. Crise \xE0 la validation."
        },
        {
          laurier: "Laurier III",
          condition: "Poss\xE9der 3 habitations de rang III.",
          bonus: "Aucune r\xE9compense. Crise \xE0 la validation."
        },
        {
          laurier: "Laurier IV",
          condition: "Poss\xE9der une population totale de 2000 habitants.",
          bonus: "Victoire !"
        }
      ]
    },
    {
      voie: "Diplomatique",
      lauriers: [
        {
          laurier: "Laurier I",
          condition: "Poss\xE9der 3 \xC9missaires chez 2 cit\xE9s libres diff\xE9rentes.",
          bonus: "Si compl\xE9t\xE9 pendant l'\xC2ge 1 : votre prochaine augmentation de rang de pays ne co\xFBte aucune Nourriture. Crise \xE0 la validation."
        },
        {
          laurier: "Laurier II",
          condition: "\xCAtre Suzerain de 2 cit\xE9s libres.",
          bonus: "Si compl\xE9t\xE9 pendant l'\xC2ge 2 : recevez 2 \xC9missaires. Crise \xE0 la validation."
        },
        {
          laurier: "Laurier III",
          condition: "\xCAtre un Empereur.",
          bonus: "Aucune r\xE9compense. Crise \xE0 la validation."
        },
        {
          laurier: "Laurier IV",
          condition: "Poss\xE9der 8 \xC9missaires au sein de la m\xEAme cit\xE9 libre.",
          bonus: "Victoire !"
        }
      ]
    },
    {
      voie: "\xC9conomique",
      lauriers: [
        {
          laurier: "Laurier I",
          condition: "Am\xE9nager 4 ressources naturelles.",
          bonus: "Si compl\xE9t\xE9 pendant l'\xC2ge 1 : recevez 5 ressources de base de votre choix. Crise \xE0 la validation."
        },
        {
          laurier: "Laurier II",
          condition: "Poss\xE9der 3 routes commerciales.",
          bonus: "Si compl\xE9t\xE9 pendant l'\xC2ge 2 : votre capitale peut accueillir un b\xE2timent suppl\xE9mentaire. Crise \xE0 la validation."
        },
        {
          laurier: "Laurier III",
          condition: "Poss\xE9der un revenu de 100 Or par tour.",
          bonus: "Aucune r\xE9compense. Crise \xE0 la validation."
        },
        {
          laurier: "Laurier IV",
          condition: "Poss\xE9der 4 Guildes.",
          bonus: "Victoire !"
        }
      ]
    },
    {
      voie: "Militaire",
      lauriers: [
        {
          laurier: "Laurier I",
          condition: "Capturer une habitation.",
          bonus: "Si compl\xE9t\xE9 pendant l'\xC2ge 1 : le co\xFBt de lev\xE9e d'arm\xE9e est r\xE9duit de 15 Or pour le reste de la partie. Crise \xE0 la validation."
        },
        {
          laurier: "Laurier II",
          condition: "Poss\xE9der un Donjon dot\xE9 de deux b\xE2timents militaires.",
          bonus: "Si compl\xE9t\xE9 pendant l'\xC2ge 2 : vous pouvez poss\xE9der une arm\xE9e suppl\xE9mentaire. Crise \xE0 la validation."
        },
        {
          laurier: "Laurier III",
          condition: "Pouvoir lever 300 pts d'arm\xE9e pour moins de 10 Or.",
          bonus: "Aucune r\xE9compense. Crise \xE0 la validation."
        },
        {
          laurier: "Laurier IV",
          condition: "Contr\xF4ler 6 des habitations de d\xE9part.",
          bonus: "Victoire !"
        }
      ]
    },
    {
      voie: "Scientifique",
      lauriers: [
        {
          laurier: "Laurier I",
          condition: "Poss\xE9der un revenu de 5 Science par tour.",
          bonus: "Si compl\xE9t\xE9 pendant l'\xC2ge 1 : vous gagnez 15 Science. Crise \xE0 la validation."
        },
        {
          laurier: "Laurier II",
          condition: "Poss\xE9der un Donjon dot\xE9 d'un Cabinet d'astronomie.",
          bonus: "Si compl\xE9t\xE9 pendant l'\xC2ge 2 : apprenez 3 technologies d'un m\xEAme arbre de rang I. Crise \xE0 la validation."
        },
        {
          laurier: "Laurier III",
          condition: "D\xE9couvrir 3 Progr\xE8s complets d'\xE2ge III.",
          bonus: "Aucune r\xE9compense. Crise \xE0 la validation."
        },
        {
          laurier: "Laurier IV",
          condition: "Terminer le Progr\xE8s Futur.",
          bonus: "Victoire !"
        }
      ]
    }
  ],
  crises: [
    "S\xE9cession : marquez une de vos habitations al\xE9atoire (sauf capitale), dans 3 tours elle rejoint les cit\xE9s libres \xE0 moins que vous la transf\xE9riez \xE0 un joueur qui vous a pr\xEAt\xE9 serment.",
    "Famine :  dans 3 tours, perdez 30 Nourriture par rang de votre pays (vous pouvez tomber en n\xE9gatif).",
    "Gr\xE8ves : dans trois tours, perdez 6 de chaque ressource de base par rang de votre pays (vous pouvez tomber en n\xE9gatif).",
    "Abandon Divin : dans 3 tours, tous vos vassaux re\xE7oivent 10 science par rang de votre pays.",
    "Incroyance : dans 3 tours perdez d\xE9finitivement 10 tourisme par rang de votre pays.",
    "Fuite de capitaux : dans 3 tours vous perdez 15 or par rang de votre pays et chaque autre joueur en gagne autant."
  ],
  rappelsRegles: [
    "d\xE9but de partie : Chaque joueur prend 80 Or, 15 Bois et 60 Nourritures",
    "Nouvelles habitations \xE0 plus de 3 cases d'une autre habitation",
    "pillage / razzias : 5 fois  la production par tour de la ressource, pas de pillage de merveille",
    "Les victoires  de factions ne marchent pas",
    "La capitale produit rien",
    "Les d\xE9cisions n'existent plus",
    "On peut d\xE9truire et construire dans le m\xEAme tour",
    "les villes s'influencent avec le tourisme (changement de culture)",
    "Une merveille par ville",
    "Les arm\xE9es :",
    "On peut choisir le professeur dans l'\xE9cole, si niveau d'\xE9cole suffisant, deux professeurs identiques possible.",
    "les \xE9volutions de rangs ne sont plus en rapport avec les progr\xE8s",
    "On n'a pas de marchand de base, sauf r\xE8gles contraire.",
    "modifier la culture des autres villes\xA0:",
    "1/ dans les titres nommer un propagandiste",
    "2/ le d\xE9placer dans une ville d'une autre culture",
    "3/  modifier la culture des gens de la ville : une charge par tour pour 5 habitats, sauf r\xE8gles contraires",
    "4/ la ville change de culture si la moiti\xE9 de ses habitants sont d'une autre culture",
    "victoires : seul le premier joueur \xE0 atteindre un palier d\xE9clenche ses effets",
    "r\xE9solution bataille auto : A - 1,5*(A-B)",
    "un marchand ne peut exploiter une merveille"
  ],
  constructions: [
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Militaire",
      nom: "Poste de garde",
      cout: "25 Or + 4 Fer",
      production: "Consomme 10 Nourriture par tour.",
      description: "Consomme 10 Nourritures par tour.\nGarnison +40.",
      effets: [
        {
          ressource: "Nourriture",
          quantite: -10
        },
        {
          ressource: "Garnison",
          quantite: 40
        }
      ],
      rangMinHabitation: 1
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Militaire",
      nom: "Herses",
      cout: "4 Or + 2 Bois",
      production: "",
      description: "Ajoute deux Herses lors de bataille de si\xE8ge, aux endroits choisis par le d\xE9fenseur.",
      rangMinHabitation: 1
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "Camp de b\xFBcheron",
      cout: "5 Or + 1 B\xE9tail",
      production: "+1 Bois par tour.",
      description: "+1 Bois par tour.",
      effets: [
        {
          ressource: "Bois",
          quantite: 1
        }
      ],
      rangMinHabitation: 1
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "Camp de mineur",
      cout: "5 Or + 1 Charbon",
      production: "+1 Pierre par tour.",
      description: "+1 Pierre par tour.",
      effets: [
        {
          ressource: "Pierre",
          quantite: 1
        }
      ],
      rangMinHabitation: 1
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "Echoppe",
      cout: "10 Or + 3 Bois",
      production: "+2 Or par tour.",
      description: "+ 2 Or par tour. Permet d'entretenir 1 route commerciale suppl\xE9mentaire.",
      effets: [
        {
          ressource: "Or",
          quantite: 2
        }
      ],
      rangMinHabitation: 1
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "Grange",
      cout: "10 Or + 3 B\xE9tail + 3 Bois",
      production: "+20 Nourriture par tour.",
      description: "+ 15 Nourriture par tour.",
      effets: [
        {
          ressource: "Nourriture",
          quantite: 20
        }
      ],
      rangMinHabitation: 1
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "Herboristerie",
      cout: "10 Or + 4 Bois",
      production: "",
      description: "Chances de contracter une maladie et de gu\xE9rir d'une maladie augment\xE9es de 5%.",
      rangMinHabitation: 1
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "Ponton",
      cout: "5 Or + 5 Bois",
      production: "",
      description: "Habitations c\xF4ti\xE8res uniquement. Les ressources maritimes am\xE9nag\xE9es g\xE9n\xE8rent 1 B\xE9tail par tour.",
      rangMinHabitation: 1
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Militaire",
      nom: "Caserne",
      cout: "Poste de garde requis. 25 Or + 4 Fer.",
      production: "Consomme 10 Nourriture par tour.",
      description: "Consomme 10 Nourritures par tour.\nGarnison +40.",
      effets: [
        {
          ressource: "Nourriture",
          quantite: -10
        },
        {
          ressource: "Garnison",
          quantite: 40
        }
      ],
      rangMinHabitation: 2
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Militaire",
      nom: "R\xE9seau de routes",
      cout: "15 Or + 4 Soie",
      production: "",
      description: "Les cases dans l'enceinte de cette habitation ne co\xFBtent qu'un PM \xE0 franchir.",
      rangMinHabitation: 2
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Militaire",
      nom: "Tour de sorcier",
      cout: "40 Or + 12 Pierres",
      production: "",
      description: "Une arm\xE9e amie peut se t\xE9l\xE9porter \xE0 une autre Tour de sorcier amie pour 1 Or par case travers\xE9e et 1 PM.",
      rangMinHabitation: 2
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "Camp de b\xE2tisseurs",
      cout: "10 Or + 4 Pierre",
      production: "",
      description: "R\xE9duit le co\xFBt de construction des am\xE9nagements de 5 Or et 1 Bois.",
      rangMinHabitation: 2
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "Camp de travailleurs",
      cout: "10 Or + 4 Pierre",
      production: "+1 Bois et +1 Pierre par tour.",
      description: "Remplace le Camp de b\xFBcherons ou de mineurs.\n+1 Bois et +1 Pierre par tour.",
      effets: [
        {
          ressource: "Bois",
          quantite: 1
        },
        {
          ressource: "Pierre",
          quantite: 1
        }
      ],
      rangMinHabitation: 2
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "Etable",
      cout: "Grange requise. 10 Or + 4 Bois + 4 B\xE9tail.",
      production: "",
      description: "Vous pouvez d\xE9penser 8 B\xE9tails pour ajouter une ressource de B\xE9tail dans l'enceinte de la Cit\xE9.",
      rangMinHabitation: 2
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "Moulin \xE0 vent",
      cout: "Silo \xE0 grain requis. 15 Or + 4 Bois + 4 B\xE9tail.",
      production: "Consomme 1 Charbon par tour. +60 Nourriture par tour.",
      description: "Remplace le Silo \xE0 grain. Consomme 1 Charbon par tour.\n+ 45 Nourriture par tour.\nCette cit\xE9 ne peut \xEAtre am\xE9lior\xE9e en Grande Cit\xE9.",
      effets: [
        {
          ressource: "Charbon",
          quantite: -1
        },
        {
          ressource: "Nourriture",
          quantite: 60
        }
      ],
      rangMinHabitation: 2
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "Clinique",
      cout: "Herboristerie requise. 30 Or + 6 Pierre",
      production: "",
      description: "Chances de contracter une maladie et de gu\xE9rir d'une maladie augment\xE9es de 10%.",
      rangMinHabitation: 2
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "Place du march\xE9",
      cout: "Echoppe requise. 20 Or + 6 Soie.",
      production: "+4 Or par tour.",
      description: "+4 Or par tour. Les marchands en provenance de cette ville produisent +1 ressource.",
      effets: [
        {
          ressource: "Or",
          quantite: 4
        }
      ],
      rangMinHabitation: 2
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "Port de commerce",
      cout: "Ponton requis. 20 Or + 6 Bois + 4 Fer.",
      production: "",
      description: "+1 Or par case maritime, Co\xFBt des B\xE2teaux -15 Or.",
      rangMinHabitation: 2
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "Port de p\xEAche",
      cout: "20 Or + 4 B\xE9tail + 4 Bois.",
      production: "",
      description: "Ponton requis. Les ressources maritimes am\xE9nag\xE9es rapportent +4 Nourritures par tour, vous pouvez d\xE9penser 8 B\xE9tails pour ajouter une ressource de Crabe dans l'enceinte de la Cit\xE9.",
      rangMinHabitation: 2
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "Silo \xE0 grain",
      cout: "20 Or + 8 Bois.",
      production: "+35 Nourriture par tour.",
      description: "Remplace la Grange.\n+ 25 Nourriture par tour.",
      effets: [
        {
          ressource: "Nourriture",
          quantite: 35
        }
      ],
      rangMinHabitation: 2
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Guilde",
      nom: "Guilde des artisans de la terre.",
      cout: "40 Or + 16 Bois + 6 B\xE9tails",
      production: "Consomme 1 Charbon par tour. +60 Nourriture par tour.",
      description: "Remplace le moulin \xE0 vent. Consomme 1 Charbon par tour. + 45 Nourriture par tour et r\xE9duit de 10 la consommation en nourriture de toutes vos Habitations. Cette cit\xE9 ne peut \xEAtre am\xE9lior\xE9e en Grande Cit\xE9.",
      effets: [
        {
          ressource: "Charbon",
          quantite: -1
        },
        {
          ressource: "Nourriture",
          quantite: 60
        }
      ],
      rangMinHabitation: 2
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Militaire",
      nom: "Barraquements",
      cout: "Caserne requise. 25 Or + 4 Fer.",
      production: "Consomme 10 Nourriture par tour.",
      description: "Consomme 10 Nourritures par tour.\nGarnison +40.",
      effets: [
        {
          ressource: "Nourriture",
          quantite: -10
        },
        {
          ressource: "Garnison",
          quantite: 40
        }
      ],
      rangMinHabitation: 3
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Militaire",
      nom: "Responsable des voiries",
      cout: "30 Or + 6 Soie.",
      production: "",
      description: "Les cases \xE0 3 cases ou moins de cette habitation ne co\xFBtent qu'un PM \xE0 franchir.",
      rangMinHabitation: 3
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "Complexe d'exploitation maritime",
      cout: "Ressource maritime am\xE9nag\xE9e requise. 35 Or + 6 Fer.",
      production: "+12 Or par tour.",
      description: "+12 Or par tour.",
      effets: [
        {
          ressource: "Or",
          quantite: 12
        }
      ],
      rangMinHabitation: 3
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "Complexe d'exploitation terrestre",
      cout: "Camp de travailleurs requis. 20 Or + 6 Fer + 8 Charbon",
      production: "+1 Bois, +1 Pierre, +1 Fer, +1 Soie, +1 Charbon par tour.",
      description: "+1 Bois, +1 Pierre, +1 Fer, +1 Soie, +1 Charbon par tour.",
      effets: [
        {
          ressource: "Bois",
          quantite: 1
        },
        {
          ressource: "Pierre",
          quantite: 1
        },
        {
          ressource: "Fer",
          quantite: 1
        },
        {
          ressource: "Soie",
          quantite: 1
        },
        {
          ressource: "Charbon",
          quantite: 1
        }
      ],
      rangMinHabitation: 3
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "Plateforme commerciale",
      cout: "Place du march\xE9 requise. 40 Or + 12 Bois + 4 Soie.",
      production: "+4 Or par tour.",
      description: "Octroi un marchand. Les marchands en provenance de cette ville produisent +4 Or par tour.",
      effets: [
        {
          ressource: "Or",
          quantite: 4
        }
      ],
      rangMinHabitation: 3
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "H\xF4pital",
      cout: "Pavillon requis. 40 Or + 10 Pierre + 4 Fer.",
      production: "",
      description: "Chances de contracter une maladie et de gu\xE9rir d'une maladie augment\xE9es de 15%.",
      rangMinHabitation: 3
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Guilde",
      nom: "Guilde des bourgeois",
      cout: "Quartier requis. 60 Or + 6 Charbon + 6 Soie.",
      production: "",
      description: "Chances de contracter une maladie et de gu\xE9rir d'une maladie augment\xE9es de 15% et un bonus jsplus ce que c'est",
      rangMinHabitation: 3
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Guilde",
      nom: "Guilde des marchands",
      cout: "Plateforme commerciale requise. 30 Or + 8 Charbon + 8 Soie.",
      production: "Consomme 1 Charbon par tour.",
      description: "Remplace la plateforme commerciale. Consomme 1 Charbon par tour. Octroi un marchand suppl\xE9mentaire. Les marchands en provenance de cette ville produisent +1 Or par case travers\xE9e. La port\xE9e de vos routes commerciale est augment\xE9e de 6 cases.",
      effets: [
        {
          ressource: "Charbon",
          quantite: -1
        }
      ],
      rangMinHabitation: 3
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Guilde",
      nom: "Guilde des marins",
      cout: "Complexe d'exploitation maritime requis. 50 Or + 4 Fer + 6 Charbon.",
      production: "Consomme 1 Charbon par tour. +18 Or par tour.",
      description: "Remplace le Complexe d'exploitation maritime. Consomme 1 Charbon par tour.\n+ 18 Or par tour.\nToutes vos b\xE2teaux poss\xE8dent +2 PM.",
      effets: [
        {
          ressource: "Charbon",
          quantite: -1
        },
        {
          ressource: "Or",
          quantite: 18
        }
      ],
      rangMinHabitation: 3
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Militaire",
      nom: "Poste de garde",
      cout: "25 Or + 4 Fer",
      production: "Consomme 10 Nourriture par tour.",
      description: "Consomme 10 Nourritures par tour.\nGarnison +40.",
      effets: [
        {
          ressource: "Nourriture",
          quantite: -10
        },
        {
          ressource: "Garnison",
          quantite: 40
        }
      ],
      rangMinHabitation: 1
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Militaire",
      nom: "Herses",
      cout: "Acquis par d\xE9faut",
      production: "",
      description: "Ajoute deux Herses lors de bataille de si\xE8ge, aux endroits choisis par le d\xE9fenseur.",
      rangMinHabitation: 1
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "Camp de b\xFBcheron",
      cout: "5 Or + 1 B\xE9tail",
      production: "+1 Bois par tour.",
      description: "+1 Bois par tour.",
      effets: [
        {
          ressource: "Bois",
          quantite: 1
        }
      ],
      rangMinHabitation: 1
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "Camp de mineur",
      cout: "5 Or + 1 Charbon",
      production: "+1 Pierre par tour.",
      description: "+1 Pierre par tour.",
      effets: [
        {
          ressource: "Pierre",
          quantite: 1
        }
      ],
      rangMinHabitation: 1
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "Camp d'ing\xE9nieur",
      cout: "10 Or + 2 Bois + 2 Fer.",
      production: "",
      description: "Les am\xE9liorations de fortifications (rouges) co\xFBtent 6 Or et 2 Bois de moins.",
      rangMinHabitation: 1
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "Conjuratoire",
      cout: "10 Or + 2 Pierre",
      production: "+15 Tourisme par tour.",
      description: "Tourisme +15.",
      effets: [
        {
          ressource: "Tourisme",
          quantite: 15
        }
      ],
      rangMinHabitation: 1
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "Ecole \xE9l\xE9mentaire",
      cout: "10 Or + 2 B\xE9tail",
      production: "Consomme 1 Or par tour.",
      description: "Consomme 1 Or par tour, peut accueillir 1 Professeur. Co\xFBt des Progr\xE8s -1 Science.",
      effets: [
        {
          ressource: "Or",
          quantite: -1
        }
      ],
      rangMinHabitation: 1
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "Echoppe",
      cout: "12 Or + 2 Bois",
      production: "+2 Or par tour.",
      description: "+ 2 Or par tour. Permet d'entretenir 1 route commerciale suppl\xE9mentaire.",
      effets: [
        {
          ressource: "Or",
          quantite: 2
        }
      ],
      rangMinHabitation: 1
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "Herboristerie",
      cout: "10 Or + 2 Pierre",
      production: "",
      description: "Chances de contracter une maladie et de gu\xE9rir d'une maladie augment\xE9es de 5%.",
      rangMinHabitation: 1
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "Terrain d'entrainement",
      cout: "12 Or + 3 Bois",
      production: "",
      description: "Si vous levez une arm\xE9e dans cette habitation, d\xE9pensez 10 Or de moins.",
      rangMinHabitation: 1
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Militaire",
      nom: "Caserne",
      cout: "Poste de garde requis. 25 Or + 4 Fer.",
      production: "Consomme 10 Nourriture par tour.",
      description: "Consomme 10 Nourritures par tour.\nGarnison +40.",
      effets: [
        {
          ressource: "Nourriture",
          quantite: -10
        },
        {
          ressource: "Garnison",
          quantite: 40
        }
      ],
      rangMinHabitation: 2
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Militaire",
      nom: "R\xE9seau de routes",
      cout: "15 Or + 4 Soie",
      production: "",
      description: "Les cases dans l'enceinte de cette habitation ne co\xFBtent qu'un PM \xE0 franchir.",
      rangMinHabitation: 2
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Militaire",
      nom: "Tour de sorcier",
      cout: "40 Or + 12 Pierres",
      production: "",
      description: "Une arm\xE9e amie peut se t\xE9l\xE9porter \xE0 une autre Tour de sorcier amie pour 1 Or par case travers\xE9e et 1 PM.",
      rangMinHabitation: 2
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "Camp de b\xE2tisseurs",
      cout: "10 Or + 4 Pierre",
      production: "",
      description: "R\xE9duit le co\xFBt de construction des am\xE9nagements de 5 Or et 1 Bois.",
      rangMinHabitation: 2
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "Cabinet d'astronomie",
      cout: "5 Or + 4 Pierre + 2 Soie",
      production: "+1 Science par tour.",
      description: "+1 Science par tour.",
      effets: [
        {
          ressource: "Science",
          quantite: 1
        }
      ],
      rangMinHabitation: 2
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "Chapelle",
      cout: "Conjuratoire requis. 10 Or + 8 Pierre",
      production: "+35 Tourisme par tour.",
      description: "Tourisme +35.",
      effets: [
        {
          ressource: "Tourisme",
          quantite: 35
        }
      ],
      rangMinHabitation: 2
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "Ecole interm\xE9diaire",
      cout: "16 Or + 6 Pierre",
      production: "Consomme 3 Or par tour.",
      description: "Remplace l'\xE9cole \xE9l\xE9mentaire. Consomme 3 Or par tour, peut accueillir 2 Professeurs. Co\xFBt des Progr\xE8s -2 Science.",
      effets: [
        {
          ressource: "Or",
          quantite: -3
        }
      ],
      rangMinHabitation: 2
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "Ecole militaire",
      cout: "Terrain d'entrainement requis. 20 Or + 6 Bois + 4 Fer.",
      production: "",
      description: "Si vous levez une arm\xE9e dans cette habitation, d\xE9pensez 25 Or de moins.",
      rangMinHabitation: 2
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "Clinique",
      cout: "Herboristerie requise. 30 Or + 6 Pierre",
      production: "",
      description: "Chances de contracter une maladie et de gu\xE9rir d'une maladie augment\xE9es de 10%.",
      rangMinHabitation: 2
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Guilde",
      nom: "Guilde des explorateurs",
      cout: "Ecole militaire et responsable des voiries requis. 60 Or + 6 Pierre + 12 Soie.",
      production: "Consomme 1 Charbon par tour.",
      description: "Consomme 1 Charbon par tour. Vos arm\xE9es poss\xE8dent +1 PM. Co\xFBt de lev\xE9e d'arm\xE9e -20 Or.",
      effets: [
        {
          ressource: "Charbon",
          quantite: -1
        }
      ],
      rangMinHabitation: 2
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Militaire",
      nom: "Barraquements",
      cout: "Caserne requise. 25 Or + 4 Fer.",
      production: "Consomme 10 Nourriture par tour.",
      description: "Consomme 10 Nourritures par tour.\nGarnison +40.",
      effets: [
        {
          ressource: "Nourriture",
          quantite: -10
        },
        {
          ressource: "Garnison",
          quantite: 40
        }
      ],
      rangMinHabitation: 3
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Militaire",
      nom: "Responsable des voiries",
      cout: "30 Or + 6 Soie.",
      production: "",
      description: "Les cases \xE0 3 cases ou moins de cette habitation ne co\xFBtent qu'un PM \xE0 franchir.",
      rangMinHabitation: 3
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "Commanderie",
      cout: "Chapelle requise. 40 Or + 12 Pierre + 6 Fer.",
      production: "+50 Tourisme par tour.",
      description: "Tourisme +50.",
      effets: [
        {
          ressource: "Tourisme",
          quantite: 50
        }
      ],
      rangMinHabitation: 3
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "Ecole sup\xE9rieure",
      cout: "Ecole interm\xE9diaire requise. 20 Or + 10 Pierre + 4 Soie.",
      production: "Consomme 6 Or par tour.",
      description: "Remplace l'\xE9cole \xE9l\xE9mentaire. Consomme 6 Or par tour, peut accueillir 3 Professeurs. Co\xFBt des Progr\xE8s -4 Science.",
      effets: [
        {
          ressource: "Or",
          quantite: -6
        }
      ],
      rangMinHabitation: 3
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "Institut de recherche",
      cout: "Cabinet d'astronomie requis. 20 Or + 6 Pierre + 8 Soie",
      production: "+3 Science par tour.",
      description: "+3 Science par tour.",
      effets: [
        {
          ressource: "Science",
          quantite: 3
        }
      ],
      rangMinHabitation: 3
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "H\xF4pital",
      cout: "Pavillon requis. 40 Or + 10 Pierre + 4 Fer.",
      production: "",
      description: "Chances de contracter une maladie et de gu\xE9rir d'une maladie augment\xE9es de 15%.",
      rangMinHabitation: 3
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Guilde",
      nom: "Guilde des diplomates",
      cout: "Ecole sup\xE9rieure requise. 120 Or + 12 Pierre.",
      production: "Consomme 1 Charbon par tour.",
      description: "Remplace l'\xE9cole sup\xE9rieure. Consomme 1 Charbon par tour. Peut accueillir 4 Professeurs. Co\xFBt des Progr\xE8s \u22124 Science. Lorsque ce b\xE2timent est construit, recevez 2 \xC9missaires en r\xE9serve (cr\xE9dit\xE9s automatiquement).",
      effets: [
        {
          ressource: "Charbon",
          quantite: -1
        }
      ],
      rangMinHabitation: 3
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Guilde",
      nom: "Guilde des \xE9vangiles",
      cout: "Commanderie requise. 60 Or + 12 Fer.",
      production: "Consomme 1 Charbon par tour. +70 Tourisme par tour.",
      description: "Remplace le conjuratoire. Consomme 1 Charbon par tour. Tourisme +70. Vos propagandistes podd\xE8dent une charge suppl\xE9mentaire.",
      effets: [
        {
          ressource: "Charbon",
          quantite: -1
        },
        {
          ressource: "Tourisme",
          quantite: 70
        }
      ],
      rangMinHabitation: 3
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Guilde",
      nom: "Guilde des savants",
      cout: "Institut de recherche requis. 50 Or + 6 Charbon + 8 Soie",
      production: "Consomme 1 Charbon par tour. +6 Science par tour.",
      description: "Remplace l'institut de recherche. Consomme 1 Charbon par tour.\n+6 Science par tour.\nGagnez 20 Science lors de sa construction.",
      effets: [
        {
          ressource: "Charbon",
          quantite: -1
        },
        {
          ressource: "Science",
          quantite: 6
        }
      ],
      rangMinHabitation: 3
    },
    {
      categorie: "B\xE2timent",
      groupe: "Capitale",
      famille: "Capitale",
      nom: "Banque centrale",
      cout: "12 Or + 6 Bois",
      production: "+8 Or par tour.",
      description: "+8 Or par tour.",
      effets: [
        {
          ressource: "Or",
          quantite: 8
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Capitale",
      famille: "Capitale",
      nom: "Grande caserne",
      cout: "12 Or + 6 Bois",
      production: "",
      description: "Garnison +40. Co\xFBt de Lev\xE9e -8 Or.",
      effets: [
        {
          ressource: "Garnison",
          quantite: 40
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Capitale",
      famille: "Capitale",
      nom: "H\xF4tel de tourisme",
      cout: "12 Or + 6 Bois",
      production: "+12 Tourisme par tour.",
      description: "Tourisme +12.",
      effets: [
        {
          ressource: "Tourisme",
          quantite: 12
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Capitale",
      famille: "Capitale",
      nom: "Jardin int\xE9rieur",
      cout: "12 Or + 6 Bois",
      production: "+14 Nourriture par tour.",
      description: "+14 Nourriture par tour.",
      effets: [
        {
          ressource: "Nourriture",
          quantite: 14
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Capitale",
      famille: "Capitale",
      nom: "Observatoire",
      cout: "12 Or + 6 Bois",
      production: "+1 Science par tour.",
      description: "+1 Science par tour.",
      effets: [
        {
          ressource: "Science",
          quantite: 1
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Baleinier",
      terrain: "Baleine",
      cout: "8 Or + 3 Bois",
      production: "+2 Or et +10 Nourriture par tour.",
      description: "+2 Or et +10 Nourriture par tour.",
      effets: [
        {
          ressource: "Or",
          quantite: 2
        },
        {
          ressource: "Nourriture",
          quantite: 10
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "B\xE2teau de p\xEAche",
      terrain: "Crabe",
      cout: "8 Or + 3 Bois",
      production: "+8 Nourriture par tour.",
      description: "+8 Nourriture par tour.",
      effets: [
        {
          ressource: "Nourriture",
          quantite: 8
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Carri\xE8re",
      terrain: "Pierre",
      cout: "8 Or + 3 Bois",
      production: "+1 Pierre par tour.",
      description: "+1 Pierre par tour.",
      effets: [
        {
          ressource: "Pierre",
          quantite: 1
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Champ",
      terrain: "Plaine",
      cout: "8 Or + 3 Bois",
      production: "+15 Nourriture par tour en \xE9t\xE9.",
      description: "+10 Nourriture par tour en \xE9t\xE9.",
      effets: [
        {
          ressource: "Nourriture",
          quantite: 15,
          ete: true
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Foire",
      terrain: "Plaine ou D\xE9sert",
      cout: "8 Or + 3 Bois",
      production: "+5 Tourisme par tour.",
      description: "+5 Tourisme par tour.",
      effets: [
        {
          ressource: "Tourisme",
          quantite: 5
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Mine de Charbon",
      terrain: "Charbon",
      cout: "8 Or + 3 Bois",
      production: "+1 Charbon par tour.",
      description: "+1 Charbon par tour.",
      effets: [
        {
          ressource: "Charbon",
          quantite: 1
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Mine de Fer",
      terrain: "Fer",
      cout: "8 Or + 3 Bois",
      production: "+1 Fer par tour.",
      description: "+1 Fer par tour.",
      effets: [
        {
          ressource: "Fer",
          quantite: 1
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Mine d'Or",
      terrain: "Or",
      cout: "8 Or + 3 Bois",
      production: "+4 Or par tour.",
      description: "+4 Or par tour.",
      effets: [
        {
          ressource: "Or",
          quantite: 4
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Observatoire",
      terrain: "Geyser/Volcan",
      cout: "8 Or + 3 Bois",
      production: "+1 Science par tour.",
      description: "+1 Science par tour.",
      effets: [
        {
          ressource: "Science",
          quantite: 1
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "P\xE2turage",
      terrain: "B\xE9tail",
      cout: "8 Or + 3 Bois",
      production: "+1 B\xE9tail et +4 Nourriture par tour (chaque B\xE9tail en stock rapporte en +4 Nourriture/tour).",
      description: "+1 B\xE9tail et +8 Nourriture par tour.",
      effets: [
        {
          ressource: "B\xE9tail",
          quantite: 1
        },
        {
          ressource: "Nourriture",
          quantite: 4
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Rizi\xE8re",
      terrain: "Marais",
      cout: "8 Or + 3 Bois",
      production: "+20 Nourriture par tour en \xE9t\xE9.",
      description: "+15 Nourriture par tour en \xE9t\xE9.",
      effets: [
        {
          ressource: "Nourriture",
          quantite: 20,
          ete: true
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Scierie",
      terrain: "For\xEAt",
      cout: "8 Or + 3 Bois",
      production: "+1 Bois par tour.",
      description: "+1 Bois par tour.",
      effets: [
        {
          ressource: "Bois",
          quantite: 1
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "S\xE9riciculture",
      terrain: "Soie",
      cout: "8 Or + 3 Bois",
      production: "+1 Soie par tour.",
      description: "+1 Soie par tour.",
      effets: [
        {
          ressource: "Soie",
          quantite: 1
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Site arch\xE9ologique",
      terrain: "Ruine",
      cout: "8 Or + 3 Bois",
      production: "+8 Tourisme par tour.",
      description: "+8 Tourisme par tour.",
      effets: [
        {
          ressource: "Tourisme",
          quantite: 8
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Faction",
      nom: "\xC9glise",
      cout: "5 Pierres + 10 Or",
      production: "+1 Or par tour. Tourisme +8 \xE0 la construction.",
      description: "B\xE2timent de faction des Basil\xE9ens : peut uniquement \xEAtre construit dans une habitation de votre culture. +8 Tourisme \xE0 la construction (valeur d'\xE9tat) et +1 Or par tour.",
      effets: [
        {
          ressource: "Or",
          quantite: 1
        },
        {
          ressource: "Tourisme",
          quantite: 8
        }
      ],
      faction: "Basil\xE9ens"
    },
    {
      categorie: "B\xE2timent",
      groupe: "Capitale",
      famille: "Faction",
      nom: "Grande Cath\xE9drale",
      cout: "12 Pierres + 30 Or",
      production: "+3 Or par tour. Tourisme +16 \xE0 la construction.",
      description: "B\xE2timent de faction des Basil\xE9ens (remplace une \xC9glise) : uniquement dans votre capitale. +16 Tourisme \xE0 la construction et +3 Or par tour.",
      effets: [
        {
          ressource: "Or",
          quantite: 3
        },
        {
          ressource: "Tourisme",
          quantite: 16
        }
      ],
      faction: "Basil\xE9ens"
    },
    {
      categorie: "B\xE2timent",
      groupe: "Capitale",
      famille: "Faction",
      nom: "Palais de Notre-Dame du Palatinat",
      cout: "25 Pierres + 80 Or",
      production: "+8 Or par tour. Tourisme +35 \xE0 la construction.",
      description: "B\xE2timent de faction des Basil\xE9ens (remplace la Grande Cath\xE9drale) : uniquement dans votre capitale. +35 Tourisme \xE0 la construction et +8 Or par tour.",
      effets: [
        {
          ressource: "Or",
          quantite: 8
        },
        {
          ressource: "Tourisme",
          quantite: 35
        }
      ],
      faction: "Basil\xE9ens"
    },
    {
      categorie: "B\xE2timent",
      groupe: "Capitale",
      famille: "Faction",
      nom: "Puit de mana",
      cout: "5 Pierres + 6 Soie",
      production: "+1 Science par tour.",
      description: "B\xE2timent de faction des Elfes d'Or : votre capitale produit +1 Science par tour ; dans la capitale, +1 Science par rang de l'habitation \xE0 la place (partie au plateau : manuelle).",
      effets: [
        {
          ressource: "Science",
          quantite: 1
        }
      ],
      faction: "ELFES D'OR"
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Faction",
      nom: "Temple du soleil",
      cout: "4 Pierres + 8 Bois",
      production: "",
      description: "B\xE2timent de faction des Hommes L\xE9zards : g\xE9n\xE8re 3 Nourriture par tour par for\xEAt dans l'enceinte de l'habitation (plateau non mod\xE9lis\xE9 \u2014 production \xE0 g\xE9rer manuellement).",
      faction: "HOMMES LEZARDS"
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "Faction",
      nom: "Apiculture",
      terrain: "For\xEAt",
      cout: "8 Or + 3 Bois",
      production: "+12 Nourriture par tour.",
      description: "Am\xE9nagement de faction des Sylvains (unique, for\xEAt) : produit 12 Nourriture par tour (8 avec la r\xE8gle \xC2ge II \xAB Don de miel \xBB, d\xE9bit\xE9e automatiquement).",
      effets: [
        {
          ressource: "Nourriture",
          quantite: 12
        }
      ],
      faction: "Sylvains"
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "Faction",
      nom: "Elevage",
      terrain: "For\xEAt",
      cout: "8 Or + 3 Bois",
      production: "+2 Nourriture par tour.",
      description: "Am\xE9nagement de faction des Hommes L\xE9zards (\xC2ge III \xAB Elevage \xBB, remplace la Scierie) : +2 Nourriture par tour ; co\xFBt de lev\xE9e des arm\xE9es r\xE9duit de 5 Or (manuel).",
      effets: [
        {
          ressource: "Nourriture",
          quantite: 2
        }
      ],
      faction: "HOMMES LEZARDS"
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "Faction",
      nom: "Brasseries",
      terrain: "Plaine ou D\xE9sert",
      cout: "8 Or + 3 Bois",
      production: "+2 Or par tour.",
      description: "Am\xE9nagement de faction des Nains (\xC2ge II \xAB Brasseries \xBB, remplace les Foires) : +2 Or par tour ; un marchand maximum suppl\xE9mentaire (manuel).",
      effets: [
        {
          ressource: "Or",
          quantite: 2
        }
      ],
      faction: "NAINS"
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "Faction",
      nom: "Autel eud Guer'",
      terrain: "\u2014",
      cout: "8 Bois + 4 Fer",
      production: "",
      description: "Am\xE9nagement de faction des Peaux Vertes : r\xE9duit le co\xFBt de lev\xE9e d'arm\xE9e de 20 Or (\xE0 g\xE9rer manuellement).",
      faction: "PEAUX VERTES"
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Faction",
      nom: "Tram des profondeurs",
      faction: "NAINS",
      cout: "10 Pierres + 20 Or",
      production: "",
      description: "B\xE2timent de faction des Nains : permet de relier deux habitations \xE0 10 cases ou moins au prix de 1 PM. Si utilis\xE9 pour attaquer l'habitation, ne consid\xE9rez pas la bataille comme un si\xE8ge mais une bataille de plaine. Vous pouvez autoriser la construction de ce b\xE2timent dans une habitation que vous ne poss\xE9dez pas par une autre faction. (Effets de plateau \xE0 g\xE9rer manuellement.)"
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Faction",
      nom: "Cimeti\xE8re",
      faction: "LEGIONS D'OUTRE-TOMBE",
      cout: "10 Os + 8 Pierres",
      production: "",
      description: "B\xE2timent de faction des L\xE9gions d'Outre-Tombe : g\xE9n\xE8re 2 Os par tour. La population de l'habitation augmente de 25 par tour. (Ressource \xAB Os \xBB et croissance non automatis\xE9es \u2014 \xE0 g\xE9rer manuellement.)"
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Faction",
      nom: "Colonie souterraine rang I",
      faction: "VERMINES DE KAOSS",
      cout: "15 Or + 3 B\xE9tail",
      production: "+1 Or par tour.",
      description: "B\xE2timent de faction des Vermines de Kaoss : doit \xEAtre b\xE2tie dans une habitation \xE0 7 cases ou moins d'une de vos habitations ou colonies. Vos Colonies g\xE9n\xE8rent 1 Or par rang de la colonie pour le joueur poss\xE9dant la ville dans laquelle se trouve la colonie et pour vous. (R\xE8gle de distance \xE0 g\xE9rer manuellement.)",
      effets: [
        {
          ressource: "Or",
          quantite: 1
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Faction",
      nom: "Colonie souterraine rang II",
      faction: "VERMINES DE KAOSS",
      cout: "30 Or + 10 Bois",
      production: "+2 Or par tour.",
      description: "B\xE2timent de faction des Vermines de Kaoss (remplace une colonie de rang I) : doit \xEAtre b\xE2tie dans une habitation \xE0 7 cases ou moins d'une de vos habitations ou colonies. Vos Colonies g\xE9n\xE8rent 1 Or par rang de la colonie pour le joueur poss\xE9dant la ville dans laquelle se trouve la colonie et pour vous. (R\xE8gle de distance \xE0 g\xE9rer manuellement.)",
      effets: [
        {
          ressource: "Or",
          quantite: 2
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Faction",
      nom: "Colonie souterraine rang III",
      faction: "VERMINES DE KAOSS",
      cout: "60 Or + 15 Pierres",
      production: "+3 Or par tour.",
      description: "B\xE2timent de faction des Vermines de Kaoss (remplace une colonie de rang II) : doit \xEAtre b\xE2tie dans une habitation \xE0 7 cases ou moins d'une de vos habitations ou colonies. Vos Colonies g\xE9n\xE8rent 1 Or par rang de la colonie pour le joueur poss\xE9dant la ville dans laquelle se trouve la colonie et pour vous. (R\xE8gle de distance \xE0 g\xE9rer manuellement.)",
      effets: [
        {
          ressource: "Or",
          quantite: 3
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Faction",
      nom: "Colonie souterraine rang IV",
      faction: "VERMINES DE KAOSS",
      cout: "100 Or + 20 Fer",
      production: "+4 Or par tour.",
      description: "B\xE2timent de faction des Vermines de Kaoss (remplace une colonie de rang III) : doit \xEAtre b\xE2tie dans une habitation \xE0 7 cases ou moins d'une de vos habitations ou colonies. Vos Colonies g\xE9n\xE8rent 1 Or par rang de la colonie pour le joueur poss\xE9dant la ville dans laquelle se trouve la colonie et pour vous. (R\xE8gle de distance \xE0 g\xE9rer manuellement.)",
      effets: [
        {
          ressource: "Or",
          quantite: 4
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Faction",
      nom: "Colonie souterraine rang V",
      faction: "VERMINES DE KAOSS",
      cout: "200 Or + 30 Charbon",
      production: "+5 Or par tour.",
      description: "B\xE2timent de faction des Vermines de Kaoss (remplace une colonie de rang IV) : doit \xEAtre b\xE2tie dans une habitation \xE0 7 cases ou moins d'une de vos habitations ou colonies. Vos Colonies g\xE9n\xE8rent 1 Or par rang de la colonie pour le joueur poss\xE9dant la ville dans laquelle se trouve la colonie et pour vous. (R\xE8gle de distance \xE0 g\xE9rer manuellement.)",
      effets: [
        {
          ressource: "Or",
          quantite: 5
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "Faction",
      nom: "Fjord",
      faction: "NORLS",
      cout: "8 Bois + 2 B\xE9tail",
      production: "",
      description: "Am\xE9nagement de faction des Norls : peut \xEAtre construit en dehors d'une habitation, poss\xE8de 20 Garnison et 2 Herses. Lorsque les Norls l\xE8vent une arm\xE9e, ils peuvent la lever dans n'importe lequel de leurs Fjords. Les Fjords peuvent accueillir des extensions, transformables en am\xE9nagements selon les m\xEAmes r\xE8gles qu'une habitation. Les Fjords peuvent \xEAtre construits sans technologie. (Effets de plateau \xE0 g\xE9rer manuellement.)"
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "Faction",
      nom: "Comptoir",
      faction: "KROVORS",
      cout: "6 Bois + 4 Soie",
      production: "",
      description: "Am\xE9nagement de faction des Krovors : peut \xEAtre construit \xE0 3 cases ou plus de toute habitation. Vos marchands peuvent \xE9tablir des routes commerciales depuis un comptoir. Un comptoir rapporte 4 Or par marchand lui \xE9tant affect\xE9. (Effets de plateau \xE0 g\xE9rer manuellement.)"
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "Faction",
      nom: "Autel corrupteur",
      faction: "THRAKSANS",
      cout: "6 Pierre + 2 Soie",
      production: "",
      description: "Am\xE9nagement de faction des Thraksans (faction ignor\xE9e dans ce portage).",
      effets: [
        {
          ressource: "Tourisme",
          quantite: 4
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Merveille",
      nom: "Sanctuaire de Salmodiva",
      rangMinHabitation: 1,
      cout: "20 Or + 20 Bois",
      production: "+25 Nourriture par tour.",
      description: "+25 Nourriture par tour.",
      effets: [
        {
          ressource: "Nourriture",
          quantite: 25
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Merveille",
      nom: "Jardins d'Alexandrie",
      rangMinHabitation: 1,
      cout: "40 Or + 10 B\xE9tail + 40 Nourriture",
      production: "+40 Habitants lors de sa construction.",
      description: "+40 Habitants lors de sa construction (cr\xE9dit\xE9s automatiquement).",
      effets: [
        {
          ressource: "Habitants",
          quantite: 40
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Merveille",
      nom: "Mont Caracole",
      rangMinHabitation: 1,
      cout: "30 Or + 15 Fer",
      production: "Garnison +40.",
      description: "Garnison +40. Tour de d\xE9fense : l'habitation est prot\xE9g\xE9e contre les tremblements de terre et \xE9ruptions volcaniques.",
      effets: [
        {
          ressource: "Garnison",
          quantite: 40
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Merveille",
      nom: "Grands bains",
      rangMinHabitation: 1,
      cout: "30 Or + 10 Fer",
      production: "+4 Or par tour.",
      description: "+8 Tourisme. +4 Or par tour. Les marais \xE0 5 cases ou moins sont prot\xE9g\xE9s contre les inondations.",
      effets: [
        {
          ressource: "Or",
          quantite: 4
        },
        {
          ressource: "Tourisme",
          quantite: 8
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Merveille",
      nom: "Temple de Bahamutt",
      rangMinHabitation: 2,
      cout: "40 Or + 20 Fer",
      production: "+16 Tourisme.",
      description: "+16 Tourisme. Recruter des arm\xE9es co\xFBte 20 Or de moins (appliqu\xE9 automatiquement sur le prix de lev\xE9e).",
      effets: [
        {
          ressource: "Tourisme",
          quantite: 16
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Merveille",
      nom: "Mus\xE9e d'Arch\xE9ologie",
      rangMinHabitation: 2,
      cout: "40 Or + 30 Pierre + 20 Soie",
      production: "+30 Tourisme.",
      description: "+30 Tourisme.",
      effets: [
        {
          ressource: "Tourisme",
          quantite: 30
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Merveille",
      nom: "Tour de Crystal",
      rangMinHabitation: 3,
      cout: "80 Or + 10 Soie + 30 Pierre",
      production: "+5 Science par tour.",
      description: "+5 Science par tour. Lorsque vous d\xE9couvrez un progr\xE8s, g\xE9n\xE9rez 3 d'une ressource de base al\xE9atoire (cr\xE9dit\xE9 automatiquement).",
      effets: [
        {
          ressource: "Science",
          quantite: 5
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Merveille",
      nom: "Antichambre d'Alexandrie",
      rangMinHabitation: 3,
      cout: "70 Or + 50 Pierre",
      production: "+14 Or par tour.",
      description: "Lors de sa construction, augmentez votre r\xE9serve d'Or de 50 % (cr\xE9dit\xE9 automatiquement). +14 Or par tour.",
      effets: [
        {
          ressource: "Or",
          quantite: 14
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Merveille",
      nom: "Antre de la d\xE9esse araign\xE9e",
      rangMinHabitation: 3,
      cout: "80 Or + 30 Soie + 20 Charbon",
      production: "+2 Soie par tour. +3 \xE9missaires \xE0 la construction.",
      description: "Lors de sa construction, recevez 3 \xE9missaires en r\xE9serve (cr\xE9dit\xE9s automatiquement). +2 Soie par tour.",
      effets: [
        {
          ressource: "Soie",
          quantite: 2
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Merveille",
      nom: "Laboratoire d'exp\xE9rimentations de Falheim",
      rangMinHabitation: 3,
      cout: "90 Or + 40 Pierre + 20 Fer",
      production: "Double la Science g\xE9n\xE9r\xE9e par votre capitale.",
      description: "Double la Science g\xE9n\xE9r\xE9e par votre capitale (canal B\xE2timents, appliqu\xE9 automatiquement).",
      effets: []
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Merveille",
      nom: "Ordre des chevaliers de Notan",
      rangMinHabitation: 3,
      cout: "70 Or + 40 Fer + 20 Charbon",
      production: "Arm\xE9es : \u221225 Or sur les lev\xE9es (automatique, permanent) ; attaque d'habitation : garnison adverse \u2212150 (plateau).",
      description: "Les arm\xE9es co\xFBtent 25 Or de moins \xE0 la lev\xE9e (appliqu\xE9 automatiquement, permanent). Lorsqu'une de vos arm\xE9es attaque une habitation, r\xE9duisez sa garnison de 150 (plateau).",
      effets: []
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Merveille",
      nom: "Palais des empereurs de Lun",
      rangMinHabitation: 3,
      cout: "100 Or + 30 Bois + 30 Pierre",
      production: "+20 Tourisme.",
      description: "Lors de sa construction, chaque habitation de chaque joueur voit se convertir 5 habitants vers votre culture (appliqu\xE9 automatiquement). +20 Tourisme.",
      effets: [
        {
          ressource: "Tourisme",
          quantite: 20
        }
      ]
    }
  ],
  typesHabitation: [
    {
      type: "Ville",
      rang: "Hameau",
      cout: "20 Or + 10 Bois + 6 B\xE9tail",
      habitantsRequis: 0,
      consommation: "2 Or",
      garnison: 10
    },
    {
      type: "Ville",
      rang: "Cit\xE9",
      cout: "40 Or + 8 B\xE9tail + 6 Pierres",
      habitantsRequis: 120,
      consommation: "10 Nourriture, 8 Or",
      garnison: 24
    },
    {
      type: "Ville",
      rang: "Grande Cit\xE9",
      cout: "40 Or + 12 B\xE9tail + 12 Charbons",
      habitantsRequis: 200,
      consommation: "20 Nourriture, 20 Or",
      garnison: 40
    },
    {
      type: "Ch\xE2teau",
      rang: "Motte",
      cout: "20 Or + 12 Bois + 2 B\xE9tail",
      habitantsRequis: 0,
      consommation: "2 Or",
      garnison: 26
    },
    {
      type: "Ch\xE2teau",
      rang: "Donjon",
      cout: "40 Or + 2 B\xE9tail + 12 Pierres",
      habitantsRequis: 120,
      consommation: "10 Nourriture, 8 Or",
      garnison: 45
    },
    {
      type: "Ch\xE2teau",
      rang: "Forteresse",
      cout: "120 Or + 10 Pierres + 12 Fer",
      habitantsRequis: 200,
      consommation: "20 Nourriture, 20 Or",
      garnison: 90
    }
  ]
};

// src/config/params.ts
var DEFAULT_PARAMS = {
  adultAge: 16,
  setupAgeMax: 50,
  ageMaxBase: 40,
  ageMaxAla: 39,
  adulteryRate: 0.03,
  migrationEcole: 0.1,
  migrationSuzerain: 0.02,
  migrationMonde: 0.01,
  migrationTourisme: 0.02,
  consoNourrParHab: 1,
  gainsCrediteStock: 1,
  fertBaseRate: 1.5,
  fertSingleFactor: 0.1,
  fertTwinsRate: 0.05,
  fertTripletsRate: 1e-3,
  fertTraitFactorMin: 0,
  fertTraitFactorMax: 1.6,
  cultureFertBase: 1,
  probaMaladie: 5e-4,
  modMaladieAge: 1e-4,
  modMaladieEnceinte: 0.03,
  probaGuerison: 0.25,
  modGuerisonAge: 3e-3,
  chanceEducRoturier: 0.08,
  chanceEducNoble: 0.15,
  professeurBaseChance: 0.9,
  profBonusEduc: 0.1,
  mariageRoturiers: 0.3,
  mariageNobles: 0.15,
  mariageMesalliance: 0.03,
  mariageBonusTitre: 0.1,
  mariageMemeCulture: 0.1,
  mariageAutreCulture: -0.1,
  mariageParAnEcart: 5e-3,
  mariageTraitMax: 0.2,
  mariagePlafond: 0.9,
  mariagePlancher: 0.01,
  mariageBatard: -0.05,
  mariageDeuxBatards: 0.1,
  traitHeriteParEssai: 0.4,
  traitHeriteEssais: 3,
  traitTirageSlot: 0.3,
  conversionProba: 0.1,
  conversionPoidsLocal: 5,
  conversionMemeCulture: 5,
  // Effet des taxes Faibles/Fortes : ±25 % (retour Thibaut, marqueur
  //  (z) — avant ±50 % ; les configs existantes encore aux anciens
  //  défauts sont migrées ciblément par cfgOf, champ taxes25).
  taxOrFaibles: 0.75,
  taxOrHautes: 1.25,
  taxNaissFaibles: 1.25,
  taxNaissHautes: 0.75,
  puissanceGeneral: 45,
  puissanceSoldat: 15,
  soldatAgeMin: 16,
  soldatAgeMax: 30,
  armeePrixOr: 1,
  armeePriXPuissance: 2,
  maxArmees: 2,
  maxMarchands: 0,
  vassalPrelevement: 0.5,
  marchandOrTour: 4,
  proxRiviereNourriture: 12,
  proxMerNourriture: 7,
  titreDirigeant: "Dirigeant",
  titreGouverneur: "Gouverneur",
  titreProfesseur: "Professeur",
  titreChasseur: "Chasseur",
  titreSoldat: "Soldat",
  titreCommandant: "Commandant",
  traitBatard: "B\xE2tard",
  traitConsanguin: "Consanguin",
  traitObstine: "Obstin\xE9",
  dynastieRoturier: "Roturier",
  maxLog: 4e3,
  maxHistory: 120,
  saisonLongueur: 3,
  evMultFaible: 1,
  evMultMoyenne: 2,
  evMultForte: 3,
  evMultExtreme: 5,
  dangerSeuilForte: 9,
  dangerSeuilExtreme: 11
};
var DEFAULT_PARAM_STRINGS = {
  titreHeritierStr: "H\xE9ritier"
};
function mergeParams(custom) {
  const out = { ...DEFAULT_PARAMS, ...DEFAULT_PARAM_STRINGS };
  if (custom && typeof custom === "object") {
    for (const [k, v] of Object.entries(custom)) {
      if (v !== void 0 && v !== null && v !== "") out[k] = v;
    }
  }
  return out;
}

// src/config/defaultConfig.ts
var COULEURS_JOUEURS_DEFAUT = [
  "#C80000",
  // J1 rouge
  "#0131B4",
  // J2 bleu royal
  "#2CA02C",
  // J3 vert
  "#F5C518",
  // J4 jaune
  "#660099",
  // J5 violet
  "#F97316",
  // J6 orange
  "#40E0D0",
  // J7 turquoise
  "#EC4899"
  // J8 rose
];
var COULEURS_RESSOURCES_DEFAUT = {
  "Bois": "#7B4B2A",
  "B\xE9tail": "#8A9A5B",
  "Charbon": "#3A3A3A",
  "Fer": "#C80000",
  "Science": "#7EC8E3",
  "Pierre": "#BFC1C2",
  "Nourriture": "#2FA84F",
  "Nourr - \xE9t\xE9": "#2FA84F",
  "Soie": "#CC55AA",
  "Habitants": "#1B5E20",
  "Or": "#F5C518",
  "Tourisme": "#E8927C",
  "Garnison": "#4A6274"
};
var TRANSPARENCE_LIGNES_DEFAUT = 85;
function migrerCouleurs(c) {
  const joueurs = COULEURS_JOUEURS_DEFAUT.map((d, i) => c?.joueurs?.[i] || d);
  const ressources = {
    ...COULEURS_RESSOURCES_DEFAUT,
    ...c?.ressources ?? {}
  };
  ressources["Nourr - \xE9t\xE9"] = c?.ressources?.["Nourr - \xE9t\xE9"] ?? ressources["Nourriture"];
  const t = typeof c?.transparenceLignes === "number" && isFinite(c.transparenceLignes) ? Math.max(0, Math.min(100, c.transparenceLignes)) : TRANSPARENCE_LIGNES_DEFAUT;
  return { joueurs, ressources, transparenceLignes: t };
}
function couleurJoueur(n, C) {
  const pal = C?.couleurs ?? migrerCouleurs();
  return pal.joueurs?.[n - 1] || COULEURS_JOUEURS_DEFAUT[(n - 1) % COULEURS_JOUEURS_DEFAUT.length];
}
function couleurRessource(nom, C) {
  const pal = C?.couleurs ?? migrerCouleurs();
  return pal.ressources?.[nom] || "#9aa4ad";
}
function fondRessource(nom, C) {
  const pal = C?.couleurs ?? migrerCouleurs();
  const t = typeof pal.transparenceLignes === "number" ? Math.max(0, Math.min(100, pal.transparenceLignes)) : TRANSPARENCE_LIGNES_DEFAUT;
  return `color-mix(in srgb, ${couleurRessource(nom, C)} ${100 - t}%, transparent)`;
}
var ref = referentiels_default;
function normaliserTraits() {
  const out = ref.traitsGenetiques.map((t) => ({
    name: t.name,
    weight: Number(t.weight) || 0,
    description: t.description || "",
    life_delta: Number(t.lifeDelta) || 0,
    resurrection_min_roll: Number(t.resurrectionMinRoll) || 0,
    fert_add: Number(t.fertAdd) || 0,
    heritable: !!t.heritable,
    marriage_mod: Number(t.marriageMod) || 0
  }));
  if (!out.some((t) => t.name === "B\xE2tard")) {
    out.push({ name: "B\xE2tard", weight: 0, description: "(syst\xE8me) Enfant ill\xE9gitime.", life_delta: 0, resurrection_min_roll: 0, fert_add: 0, heritable: false, marriage_mod: 0 });
  }
  if (!out.some((t) => t.name === "Consanguin")) {
    out.push({ name: "Consanguin", weight: 0, description: "(syst\xE8me) Parents apparent\xE9s.", life_delta: -2, resurrection_min_roll: 0, fert_add: -0.2, heritable: false, marriage_mod: 0 });
  }
  return out;
}
function normaliserTitres() {
  return ref.titres.map((t) => ({
    titre: t.titre,
    education: t.education || "",
    valeur1: Number(t.valeur1) || 0,
    ressource1: t.ressource1 || "",
    valeur2: Number(t.valeur2) || 0,
    ressource2: t.ressource2 || "",
    description: t.description || "",
    nobleSeul: !!t.nobleSeul,
    regleGenre: (t.regleGenre === "vide" ? "" : t.regleGenre) || "",
    attribution: t.attribution || ""
  }));
}
function normaliserCultures() {
  return ref.cultures.map((c) => ({
    nom: c.nom,
    heredite: c.heredite,
    martialite: c.martialite,
    homoAutorisee: c.homoAutorisee === true || c.homoAutorisee === "true",
    fertFactor: Number(c.fertFactor) || 1,
    reglePays: c.reglePays || "",
    reglePerso: c.reglePerso || "",
    capitalNourrParHabMonde: Number(c.capitalNourrParHabMonde) || void 0,
    capitalTourismeParHabMonde: Number(c.capitalTourismeParHabMonde) || void 0,
    capitalOrParHabMonde: Number(c.capitalOrParHabMonde) || void 0,
    scienceParConstruction: Number(c.scienceParConstruction) || void 0
  }));
}
function normaliserBatiments() {
  const effets = {
    "Herboristerie": { categorie: "Sant\xE9", malContraction: 0.05, bonusGuerison: 0.05 },
    "Clinique": { categorie: "Sant\xE9", malContraction: 0.1, bonusGuerison: 0.1 },
    "Guilde des m\xE9decins": { categorie: "Sant\xE9", bonusGuerisonGlobal: 0.1 },
    "Ecole \xE9l\xE9mentaire": { categorie: "\xC9ducation", ecoleRang: 1 },
    "\xC9cole \xE9l\xE9mentaire": { categorie: "\xC9ducation", ecoleRang: 1 },
    "Ecole interm\xE9diaire": { categorie: "\xC9ducation", ecoleRang: 2 },
    "\xC9cole interm\xE9diaire": { categorie: "\xC9ducation", ecoleRang: 2 },
    "Ecole sup\xE9rieure": { categorie: "\xC9ducation", ecoleRang: 3 },
    "\xC9cole sup\xE9rieure": { categorie: "\xC9ducation", ecoleRang: 3 }
  };
  const vus = /* @__PURE__ */ new Set();
  const out = [];
  const push = (nom, categorie, effet) => {
    if (!nom || vus.has(nom)) return;
    if (/^\d+$/.test(nom) || nom.startsWith("Consomme ")) return;
    vus.add(nom);
    out.push({
      nom,
      categorie,
      effet,
      ecoleRang: 0,
      malContraction: 0,
      bonusGuerison: 0,
      bonusGuerisonGlobal: 0,
      ...effets[nom] ?? {}
    });
  };
  for (const b of ref.batimentsVille) push(b.nom, b.categorie || "Ville", b.effet || "");
  for (const b of ref.batimentsChateau) push(b.nom, b.categorie || "Ch\xE2teau", b.effet || "");
  for (const nom of Object.keys(effets)) if (!vus.has(nom)) push(nom, effets[nom].categorie, "B\xE2timent \xE0 effet moteur (sant\xE9 / \xE9ducation).");
  return out;
}
function peuplesNoms() {
  return [...ref.peuplesLibres, ...ref.peuplesAutres].map((p) => p.nom).filter(Boolean);
}
var BANQUE_PEUPLE = {
  "Basil\xE9ens": 0,
  "PEAUX VERTES": 1,
  "HOMMES LEZARDS": 0,
  "NAINS": 2,
  "ELFES D'OR": 0,
  "NORLS": 0,
  "LEGIONS D'OUTRE-TOMBE": 2,
  "VERMINES DE KAOSS": 0,
  "KROVORS": 0,
  "THRAKSANS": 1
};
function peupleBanqueOf() {
  const out = {};
  for (const nom of peuplesNoms()) out[nom] = BANQUE_PEUPLE[nom] ?? 0;
  return out;
}
var BASE_EVENT_EFFECTS = {
  "S\xE9cheresse": { effets: [{ ressource: "Nourriture", base: -10 }] },
  "Explosion volcanique": { effets: [{ ressource: "Nourriture", base: -6 }, { ressource: "Bois", base: -2 }] },
  "Innondation": { effets: [{ ressource: "Nourriture", base: -8 }, { ressource: "Or", base: -2 }] },
  "Barbarisme": { effets: [{ ressource: "B\xE9tail", base: -4 }] },
  "Brigandage": { effets: [{ ressource: "Or", base: -7 }] },
  "Incendie": { effets: [{ ressource: "Bois", base: -5 }] },
  "Radiations solaires": { effets: [{ ressource: "Science", base: 3 }] },
  "Ouragan": { effets: [{ ressource: "Bois", base: -3 }, { ressource: "Or", base: -2 }] },
  "Eclipse": { effets: [{ ressource: "Science", base: 2 }] },
  "Famine": { effets: [{ ressource: "Nourriture", base: -12 }] },
  "Avalanche": { effets: [{ ressource: "Nourriture", base: -6 }, { ressource: "Bois", base: -2 }] },
  "Blizzard": { effets: [{ ressource: "Nourriture", base: -8 }] },
  "Ere glaciaire": { effets: [{ ressource: "Nourriture", base: -15 }] },
  "Hiver prolong\xE9": { effets: [{ ressource: "Nourriture", base: -5 }, { ressource: "Or", base: -2 }] },
  "Peste": { effets: [{ ressource: "Habitants", base: -3 }], maladieRisque: 0.04 },
  "Gel": { effets: [{ ressource: "Nourriture", base: -6 }] },
  "Redoux": { effets: [{ ressource: "B\xE9tail", base: 2 }] },
  "Sombres pr\xE9sages": { effets: [], modDanger: 1 }
};
var BASE_DYNASTIE_EFFECTS = {
  "B\xE9n\xE9diction de Samodiva": { effets: [{ ressource: "Nourriture", base: 5 }] },
  "Brigandage": { effets: [{ ressource: "Or", base: -4 }] },
  "D\xE9couverte": { effets: [{ ressource: "Science", base: 2 }] },
  "Hommage au roi": { effets: [{ ressource: "(al\xE9atoire)", base: 2 }] },
  "Merveille architecturale": { effets: [{ ressource: "Tourisme", base: 5 }] },
  "Troupe de troubadours": { effets: [{ ressource: "Tourisme", base: 5 }] },
  "Miracle": { effets: [], guerison: true },
  "Migration": { effets: [{ ressource: "Habitants", base: 2 }] },
  "temp\xEAte magique": { effets: [{ ressource: "Science", base: 2 }] },
  "Sombre proposition": { effets: [{ ressource: "Science", base: 2 }, { ressource: "Or", base: 5 }] },
  "Syst\xE8me de pr\xE9vention": { effets: [{ ressource: "Or", base: 5 }] },
  "D\xE9couverte arch\xE9ologique": { effets: [{ ressource: "Science", base: 5 }] },
  "incendie": { effets: [{ ressource: "(al\xE9atoire)", base: -1 }] }
};
var DEFAULT_CONFIG = {
  ressources: ["B\xE9tail", "Bois", "Charbon", "Fer", "Pierre", "Soie", "Or", "Nourriture", "Science", "Habitants", "Tourisme", "Garnison"],
  educations: ["Agricole", "Scientifique", "Militaire", "\xC9conomique", "Culturelle"],
  params: mergeParams(void 0),
  titres: normaliserTitres(),
  traits: normaliserTraits(),
  cultures: normaliserCultures(),
  regimes: ref.regimes,
  events: ref.events,
  dynasties: ref.dynasties,
  offrandes: ref.offrandes,
  orientations: ref.orientations,
  genres: ref.genres,
  agesPoids: ref.agesPoids,
  banquesNoms: ref.banquesNoms,
  peupleBanque: peupleBanqueOf(),
  peuples: peuplesNoms(),
  batiments: normaliserBatiments(),
  eventEffets: ref.events.map((e) => ({
    nom: e.nom,
    effets: BASE_EVENT_EFFECTS[e.nom]?.effets ?? [],
    maladieRisque: BASE_EVENT_EFFECTS[e.nom]?.maladieRisque ?? 0,
    modDanger: BASE_EVENT_EFFECTS[e.nom]?.modDanger ?? 0
  })),
  dynastieEffets: ref.dynasties.map((d) => ({
    nom: d.nom,
    effets: BASE_DYNASTIE_EFFECTS[d.nom]?.effets ?? [],
    guerison: !!BASE_DYNASTIE_EFFECTS[d.nom]?.guerison
  })),
  init: ref.init,
  traitsGenetiques: ref.traitsGenetiques,
  ministeres: ref.ministeres,
  titresEffets: ref.titresEffets,
  peuplesLibres: ref.peuplesLibres,
  peuplesAutres: ref.peuplesAutres,
  batimentsVille: ref.batimentsVille,
  batimentsChateau: ref.batimentsChateau,
  batimentsCouts: ref.batimentsCouts,
  amenagements: ref.amenagements,
  constructions: ref.constructions,
  rangsHabitation: ref.rangsHabitation,
  typesHabitation: ref.typesHabitation,
  progres: ref.progres,
  paysRangs: [],
  // rempli depuis la feuille Pays (voir normalisation ci-dessous)
  tourismeSeuils: ref.tourismeSeuils,
  dogmes: ref.dogmes,
  citesLibres: ref.citesLibres,
  regleCitesLibres: ref.regleCitesLibres,
  victoires: ref.victoires,
  crises: ref.crises,
  rappelsRegles: ref.rappelsRegles,
  couleurs: {
    joueurs: [...COULEURS_JOUEURS_DEFAUT],
    ressources: { ...COULEURS_RESSOURCES_DEFAUT },
    transparenceLignes: TRANSPARENCE_LIGNES_DEFAUT
  }
};
DEFAULT_CONFIG.paysRangs = [
  { nom: "Baronnie", coutOr: 0, coutNourriture: 0, serments: 0, ministres: 1, bonus: "" },
  { nom: "Comt\xE9", coutOr: 20, coutNourriture: 40, serments: 1, ministres: 2, bonus: "" },
  { nom: "Duch\xE9", coutOr: 30, coutNourriture: 60, serments: 2, ministres: 3, bonus: "" },
  { nom: "Royaume", coutOr: 50, coutNourriture: 100, serments: 3, ministres: 4, bonus: "" },
  { nom: "Empire", coutOr: 100, coutNourriture: 200, serments: 4, ministres: 5, bonus: "" }
];
function migrateTraits(t) {
  if (!Array.isArray(t) || t.length === 0) return DEFAULT_CONFIG.traits;
  if (t.some((x) => x?.name === "Obstin\xE9")) return t;
  return DEFAULT_CONFIG.traits;
}
function migrerCultures(list) {
  const defs = DEFAULT_CONFIG.cultures;
  if (!Array.isArray(list) || list.length === 0) return defs;
  return list.map((c) => {
    const d = defs.find((x) => x.nom === c?.nom);
    return d ? { ...d, ...c } : c;
  });
}
function migrerRegimes(list) {
  const defs = DEFAULT_CONFIG.regimes;
  if (!Array.isArray(list) || list.length === 0) return defs;
  return list.map((r) => {
    const d = defs.find((x) => x.nom === r?.nom);
    return d ? { ...d, ...r } : r;
  });
}
function migrerFactions(list, defauts) {
  const out = (list ?? []).map((f) => {
    const ref2 = defauts.find((d) => d.nom === f.nom);
    return ref2 ? { ...ref2, ...f } : f;
  });
  for (const d of defauts) {
    if (!out.some((f) => f.nom === d.nom)) out.push(d);
  }
  return out;
}
function migrerSwapSylvains(f) {
  if (f.nom !== "Sylvains") return f;
  const a2 = f.ageII ?? [];
  const a3 = f.ageIII ?? [];
  const s2 = a2.find((r) => r.nom === "Savoir ancestral");
  const b3 = a3.find((r) => r.nom === "Biblioth\xE8que enfouie");
  if (!s2 || !b3) return f;
  return {
    ...f,
    ageII: a2.map((r) => r.nom === "Savoir ancestral" ? b3 : r),
    ageIII: a3.map((r) => r.nom === "Biblioth\xE8que enfouie" ? s2 : r),
    lignes: (f.lignes ?? []).map((l) => {
      if (/^Âge II — Savoir ancestral/.test(l.label)) {
        return { label: "\xC2ge II \u2014 Biblioth\xE8que enfouie", texte: b3.texte };
      }
      if (/^Âge III — Bibliothèque enfouie/.test(l.label)) {
        return { label: "\xC2ge III \u2014 Savoir ancestral", texte: s2.texte };
      }
      return l;
    })
  };
}
function migrerConstructions(list, defauts) {
  const out = [...list ?? []];
  const noms = new Set(out.map((c) => c.nom));
  for (const d of defauts) {
    if (!noms.has(d.nom)) out.push(d);
  }
  return out;
}
function migrerTypesHabitation(list) {
  if (!Array.isArray(list) || list.length === 0) return DEFAULT_CONFIG.typesHabitation;
  return list;
}
function migrerProgres(list) {
  if (!Array.isArray(list) || list.length === 0) return DEFAULT_CONFIG.progres;
  const vieuxFormat = list.some(
    (t) => t && (t.entrees !== void 0 || t.arbre !== void 0) && t.brancheA === void 0
  );
  if (vieuxFormat) return DEFAULT_CONFIG.progres;
  return list;
}
function migrerPaysRangs(rangs) {
  if (!Array.isArray(rangs) || rangs.length === 0) return DEFAULT_CONFIG.paysRangs;
  const r0 = rangs[0];
  if (typeof r0.coutOr !== "number" || typeof r0.serments !== "number" || typeof r0.ministres !== "number") {
    return DEFAULT_CONFIG.paysRangs;
  }
  return rangs;
}
function migrerVictoires(list) {
  const convert = (m) => ({
    voie: m.voie ?? "",
    lauriers: (m.lauriers ?? m.rangs ?? []).map((r) => ({
      laurier: r.laurier ?? r.rang ?? "",
      condition: r.condition ?? "",
      bonus: r.bonus ?? ""
    }))
  });
  if (!Array.isArray(list) || list.length === 0) return DEFAULT_CONFIG.victoires;
  return list.map(convert);
}
var RENOMMAGES_MINISTERES = {
  Colonial: "Grand bailli",
  Culture: "Ma\xEEtre des arts",
  "D\xE9fense": "Grand pr\xE9v\xF4t",
  Ecologie: "Grand veneur",
  Economie: "Surintendant des finances",
  Guerre: "Grand \xE9cuyer",
  Recherche: "Grand biblioth\xE9caire"
};
function migrerMinisteres(list) {
  if (!Array.isArray(list) || list.length === 0) return DEFAULT_CONFIG.ministeres;
  const rentrees = list.map((m) => ({
    ...m,
    ministere: RENOMMAGES_MINISTERES[m.ministere] ?? m.ministere
  }));
  const parNom = new Map(rentrees.map((m) => [m.ministere, m]));
  const defauts = DEFAULT_CONFIG.ministeres.map((d) => {
    const u = parNom.get(d.ministere);
    if (!u) return d;
    const f = { ...d, ...u };
    return {
      ...f,
      rangMinimum: f.rangMinimum ?? "Baronnie",
      mode: f.mode ?? "Plateau"
    };
  });
  const connus = new Set(DEFAULT_CONFIG.ministeres.map((d) => d.ministere));
  const persos = rentrees.filter((m) => !connus.has(m.ministere)).map((m) => ({
    ...m,
    rangMinimum: m.rangMinimum ?? "Baronnie",
    mode: m.mode ?? "Plateau"
  }));
  return [...defauts, ...persos];
}
var SCHEMA_VERSION_CONFIG = 1;
function gardeFous(m) {
  const ouDefauts = (list, defauts) => Array.isArray(list) && list.length > 0 ? list : defauts;
  m.traits = ouDefauts(m.traits, DEFAULT_CONFIG.traits);
  m.cultures = ouDefauts(m.cultures, DEFAULT_CONFIG.cultures);
  m.regimes = ouDefauts(m.regimes, DEFAULT_CONFIG.regimes);
  m.typesHabitation = ouDefauts(m.typesHabitation, DEFAULT_CONFIG.typesHabitation);
  m.progres = ouDefauts(m.progres, DEFAULT_CONFIG.progres);
  if (Array.isArray(m.progres)) {
    const connus = new Set(m.progres.map((a) => `${a.nom}|${a.age}`));
    for (const def of DEFAULT_CONFIG.progres) {
      if (!connus.has(`${def.nom}|${def.age}`)) m.progres.push(def);
    }
  }
  m.paysRangs = ouDefauts(m.paysRangs, DEFAULT_CONFIG.paysRangs);
  m.ministeres = ouDefauts(m.ministeres, DEFAULT_CONFIG.ministeres);
  m.victoires = ouDefauts(m.victoires, DEFAULT_CONFIG.victoires);
  if (Array.isArray(m.victoires)) {
    const voies = new Map(m.victoires.map((v) => [v.voie, v]));
    for (const def of DEFAULT_CONFIG.victoires) {
      const existante = voies.get(def.voie);
      const diff = !existante || existante.lauriers.some((l, i) => l.condition !== def.lauriers[i]?.condition || l.bonus !== def.lauriers[i]?.bonus);
      if (diff) m.victoires = m.victoires.map((v) => v.voie === def.voie ? def : v);
    }
    for (const def of DEFAULT_CONFIG.victoires) {
      if (!m.victoires.some((v) => v.voie === def.voie)) m.victoires.push(def);
    }
  }
  m.peuplesLibres = ouDefauts(m.peuplesLibres, DEFAULT_CONFIG.peuplesLibres);
  m.peuplesAutres = ouDefauts(m.peuplesAutres, DEFAULT_CONFIG.peuplesAutres);
  m.constructions = ouDefauts(m.constructions, DEFAULT_CONFIG.constructions);
  if (Array.isArray(m.constructions)) {
    const parNom = new Map(DEFAULT_CONFIG.constructions.map((c) => [c.nom, c]));
    for (const c of m.constructions) {
      const def = parNom.get(c.nom);
      if (def && def.rangMinHabitation !== void 0) c.rangMinHabitation = def.rangMinHabitation;
    }
    const connus = new Set(m.constructions.map((c) => c.nom));
    for (const def of DEFAULT_CONFIG.constructions) {
      if (!connus.has(def.nom)) m.constructions.push(def);
    }
  }
  m.couleurs = migrerCouleurs(m.couleurs);
}
function cfgOf(config) {
  const c = config ?? DEFAULT_CONFIG;
  const merged = {
    ...DEFAULT_CONFIG,
    ...c,
    params: mergeParams(c.params)
  };
  if ((c?.schemaVersion ?? 0) >= SCHEMA_VERSION_CONFIG) {
    gardeFous(merged);
  } else {
    merged.traits = migrateTraits(merged.traits);
    merged.cultures = migrerCultures(merged.cultures);
    merged.regimes = migrerRegimes(merged.regimes);
    merged.typesHabitation = migrerTypesHabitation(merged.typesHabitation);
    merged.progres = migrerProgres(merged.progres);
    merged.paysRangs = migrerPaysRangs(merged.paysRangs);
    merged.ministeres = migrerMinisteres(merged.ministeres);
    merged.couleurs = migrerCouleurs(c.couleurs);
    merged.victoires = migrerVictoires(merged.victoires);
    merged.peuplesLibres = migrerFactions(merged.peuplesLibres, DEFAULT_CONFIG.peuplesLibres).map(migrerSwapSylvains);
    merged.peuplesAutres = migrerFactions(merged.peuplesAutres, DEFAULT_CONFIG.peuplesAutres);
    merged.constructions = migrerConstructions(merged.constructions, DEFAULT_CONFIG.constructions);
    merged.schemaVersion = SCHEMA_VERSION_CONFIG;
  }
  if (!merged.renommagesTechs2026) {
    const RENOMS = [
      [17, "b2", "Service militaire", "Service militaire avanc\xE9"],
      [21, "a2", "D\xE9forestation", "Exploitation foresti\xE8re"],
      [21, "b2", "Usinage", "Industrialisation"],
      [22, "a1", "Geste", "Hommage solennel"],
      [22, "b1", "D\xE9l\xE9gation", "Cartes de dynastie"],
      [22, "b2", "Ambassade", "Diplomatie effr\xE9n\xE9e"],
      [22, "c", "Vassalisation", "Vassalit\xE9 \xE9largie"],
      [18, "b2", "Parcs naturels", "Merveilles naturelles"],
      [16, "b2", "Sappeurs", "Grand d\xE9ploiement"]
    ];
    for (const [iArbre, slot, ancien, nouveau] of RENOMS) {
      const a = merged.progres?.[iArbre];
      if (!a) continue;
      const t = slot === "c" ? a.techC : (slot[0] === "a" ? a.brancheA : a.brancheB)?.[+slot[1] - 1];
      if (t && t.nom === ancien) t.nom = nouveau;
    }
    merged.renommagesTechs2026 = true;
  }
  if (!merged.techsManquantes2026) {
    const FIX = [
      [11, "c"],
      [16, "c"],
      [17, "a1"],
      [18, "c"],
      [19, "c"]
    ];
    for (const [iArbre, slot] of FIX) {
      const a = merged.progres?.[iArbre];
      const d = DEFAULT_CONFIG.progres?.[iArbre];
      if (!a || !d) continue;
      const t = slot === "c" ? a.techC : (slot[0] === "a" ? a.brancheA : a.brancheB)?.[+slot[1] - 1];
      const dt = slot === "c" ? d.techC : (slot[0] === "a" ? d.brancheA : d.brancheB)?.[+slot[1] - 1];
      if (!t || !dt) continue;
      if (!t.nom) {
        Object.assign(t, dt);
      } else if (t.nom === dt.nom) {
        t.description = dt.description;
      }
    }
    merged.techsManquantes2026 = true;
  }
  if (!merged.laurier4Militaire2026) {
    const voieM = merged.victoires?.find((v) => v.voie === "Militaire");
    const l4 = voieM?.lauriers?.[3];
    const ancien = "Capturer un total de 3 Capitales.";
    if (l4 && l4.condition === ancien) {
      l4.condition = "Contr\xF4ler 6 des habitations de d\xE9part.";
    }
    merged.laurier4Militaire2026 = true;
  }
  if (!merged.sylvains2026) {
    const dLibres = DEFAULT_CONFIG.peuplesLibres;
    const dAutres = DEFAULT_CONFIG.peuplesAutres;
    const defSyl = [...dLibres, ...dAutres].find((f) => f.nom === "Sylvains");
    if (defSyl && !(merged.peuplesLibres ?? []).some((f) => f.nom === "Sylvains") && !(merged.peuplesAutres ?? []).some((f) => f.nom === "Sylvains")) {
      merged.peuplesLibres = [...merged.peuplesLibres ?? [], structuredClone(defSyl)];
    }
    if (defSyl && !(merged.peuples ?? []).includes("Sylvains")) {
      merged.peuples = [...merged.peuples ?? [], "Sylvains"];
    }
    merged.sylvains2026 = true;
  }
  if (!merged.valeursNourriture2026) {
    const MAJ = [
      // [nom, effets attendus, ancienne production, nouvelle production]
      ["Grange", [{ ressource: "Nourriture", quantite: 20 }], "+15 Nourriture par tour.", "+20 Nourriture par tour."],
      ["Silo \xE0 grain", [{ ressource: "Nourriture", quantite: 35 }], "+25 Nourriture par tour.", "+35 Nourriture par tour."],
      ["Moulin \xE0 vent", [{ ressource: "Charbon", quantite: -1 }, { ressource: "Nourriture", quantite: 60 }], "Consomme 1 Charbon par tour. +45 Nourriture par tour.", "Consomme 1 Charbon par tour. +60 Nourriture par tour."],
      ["Guilde des artisans de la terre.", [{ ressource: "Charbon", quantite: -1 }, { ressource: "Nourriture", quantite: 60 }], "Consomme 1 Charbon par tour. +45 Nourriture par tour.", "Consomme 1 Charbon par tour. +60 Nourriture par tour."],
      ["Champ", [{ ressource: "Nourriture", quantite: 15, ete: true }], "+10 Nourriture par tour en \xE9t\xE9.", "+15 Nourriture par tour en \xE9t\xE9."],
      ["Rizi\xE8re", [{ ressource: "Nourriture", quantite: 20, ete: true }], "+15 Nourriture par tour en \xE9t\xE9.", "+20 Nourriture par tour en \xE9t\xE9."],
      ["P\xE2turage", [{ ressource: "B\xE9tail", quantite: 1 }, { ressource: "Nourriture", quantite: 4 }], "+1 B\xE9tail et +8 Nourriture par tour.", "+1 B\xE9tail et +4 Nourriture par tour."]
    ];
    for (const c2 of merged.constructions ?? []) {
      const maj = MAJ.find(([nom]) => nom === c2.nom);
      if (!maj) continue;
      const [, effets, ancienneProd, nouvelleProd] = maj;
      const estAncienne = Array.isArray(c2.effets) && JSON.stringify(c2.effets) !== JSON.stringify(effets) && c2.production === ancienneProd;
      if (estAncienne) {
        c2.effets = effets;
        if (nouvelleProd) c2.production = nouvelleProd;
      }
    }
    merged.valeursNourriture2026 = true;
  }
  if (!merged.pontificats2026) {
    const ANCIEN = "A la fin de chaque hiver, recevez 1 \xC9missaire en r\xE9serve (cr\xE9dit\xE9 automatiquement).";
    const NOUVEAU = "A la fin de chaque hiver, recevez 1 \xC9missaire en r\xE9serve (\xE0 g\xE9rer au plateau).";
    for (const t of merged.tourismeSeuils ?? []) {
      if (t.seuil === 220 && t.bonus === ANCIEN) t.bonus = NOUVEAU;
    }
    merged.pontificats2026 = true;
  }
  if (!merged.taxes25) {
    const pm = merged.params;
    if (pm.taxOrFaibles === 0.5) pm.taxOrFaibles = 0.75;
    if (pm.taxOrHautes === 1.5) pm.taxOrHautes = 1.25;
    if (pm.taxNaissFaibles === 1.5) pm.taxNaissFaibles = 1.25;
    if (pm.taxNaissHautes === 0.5) pm.taxNaissHautes = 0.75;
    merged.taxes25 = true;
  }
  return {
    p: merged.params,
    ressources: merged.ressources,
    educations: merged.educations,
    titres: merged.titres,
    traits: merged.traits,
    cultures: merged.cultures,
    regimes: merged.regimes,
    events: merged.events,
    dynasties: merged.dynasties,
    offrandes: merged.offrandes,
    orientations: merged.orientations,
    genres: merged.genres,
    banquesNoms: merged.banquesNoms,
    peupleBanque: merged.peupleBanque,
    peuples: merged.peuples,
    batiments: merged.batiments,
    couleurs: migrerCouleurs(merged.couleurs),
    config: merged
  };
}

// src/engine/gameData.ts
var RESOURCES = DEFAULT_CONFIG.ressources;
var TITRES = DEFAULT_CONFIG.titres;
var TRAITS = DEFAULT_CONFIG.traits;
var CULTURES = DEFAULT_CONFIG.cultures;
var REGIMES = DEFAULT_CONFIG.regimes;
var ORIENTATIONS = DEFAULT_CONFIG.orientations;
var GENRES = DEFAULT_CONFIG.genres;
var EDUCATIONS = DEFAULT_CONFIG.educations;
var BANQUES = DEFAULT_CONFIG.banquesNoms;
var PEUPLES = DEFAULT_CONFIG.peuples.map((nom) => {
  const b = DEFAULT_CONFIG.banquesNoms[DEFAULT_CONFIG.peupleBanque[nom] ?? 0] ?? DEFAULT_CONFIG.banquesNoms[0];
  return { nom, noms: b.noms, prenomsM: b.prenomsM, prenomsF: b.prenomsF };
});
function titreDef(titre, cfg) {
  return (cfg ?? DEFAULT_CONFIG).titres.find((t) => t.titre === titre);
}
function traitDef(name, cfg) {
  return (cfg ?? DEFAULT_CONFIG).traits.find((t) => t.name === name);
}
function cultureDef(nom, cfg) {
  return (cfg ?? DEFAULT_CONFIG).cultures.find((c) => c.nom === nom);
}
function peupleDef(nom, cfg) {
  const c = cfg ?? DEFAULT_CONFIG;
  const b = c.banquesNoms[c.peupleBanque[nom] ?? 0] ?? c.banquesNoms[0];
  if (!b) return void 0;
  return { nom, noms: b.noms, prenomsM: b.prenomsM, prenomsF: b.prenomsF };
}

// src/engine/shared.ts
var idCounter = 0;
function newId(rng) {
  return `c${Date.now().toString(36)}${(idCounter++).toString(36)}${rng.int(100, 999)}`;
}
function isNobleDyn(dyn, C = cfgOf()) {
  const d = dyn.trim();
  return d !== "" && d !== C.p.dynastieRoturier;
}
function fullName(c) {
  return `${c.prenom} ${c.nom}`;
}
function detenteursDe(state) {
  return [
    ...state.players.map((p) => ({ kind: "joueur", p })),
    ...(state.citesLibres ?? []).map((cite) => ({ kind: "cite", cite }))
  ];
}
function populationDe(state, d) {
  if (d.kind === "joueur") return state.population[d.p.n] ?? [];
  return d.cite.population ?? [];
}
function nomDe(d) {
  return d.kind === "joueur" ? `J${d.p.n} \xB7 ${d.p.nom}` : `la cit\xE9 libre ${d.cite.nom}`;
}
function porteurDe(state, c) {
  for (const d of detenteursDe(state)) {
    if (populationDe(state, d).includes(c)) return d;
  }
  return void 0;
}
function memeDetenteur(a, b) {
  if (a.kind !== b.kind) return false;
  return a.kind === "joueur" ? a.p.n === b.p.n : a.cite === b.cite;
}
function toutesLesPopulations(state) {
  return detenteursDe(state).flatMap((d) => populationDe(state, d));
}
function deplacerPersonnage(state, c, dst) {
  const src = porteurDe(state, c);
  if (!src) return "Personnage introuvable dans les populations de la partie.";
  if (src.kind === dst.kind && (src.kind === "joueur" ? src.p.n === dst.p.n : src.cite === dst.cite)) {
    return "Ce personnage appartient d\xE9j\xE0 \xE0 ce porteur.";
  }
  const popSrc = populationDe(state, src);
  const i = popSrc.indexOf(c);
  if (i >= 0) popSrc.splice(i, 1);
  if (dst.kind === "joueur") {
    if (!dst.p.villes.some((v) => v.nom === c.ville)) {
      c.ville = dst.p.villes[0]?.nom ?? c.ville;
    }
    const arr = state.population[dst.p.n] ?? (state.population[dst.p.n] = []);
    arr.push(c);
  } else {
    c.ville = dst.cite.nom;
    const arr = dst.cite.population ?? (dst.cite.population = []);
    arr.push(c);
  }
  state.log.push({
    turn: state.turn,
    type: "Syst\xE8me",
    joueur: src.kind === "joueur" ? src.p.n : null,
    texte: `\u{1F91D} ${fullName(c)} (${c.dynastie}${c.titre ? `, ${c.titre}` : ""}) passe de ${nomDe(src)} \xE0 ${nomDe(dst)}.`
  });
  return null;
}
function emptyRecap() {
  return {
    conceptions: {},
    naissances: {},
    deces: {},
    decesMaladie: 0,
    mariagesNobles: {},
    conversions: {},
    titresAttribues: {},
    crises: [],
    commandantTombe: null
  };
}
function bump(dict, key, n = 1) {
  if (!key) key = "(inconnu)";
  dict[key] = (dict[key] ?? 0) + n;
}

// src/engine/saisons.ts
function saisonForTurn(turn, C = cfgOf()) {
  return Math.floor(Math.max(0, turn - 1) / Math.max(1, C.p.saisonLongueur)) % 2 === 0 ? "\xC9t\xE9" : "Hiver";
}
function applyEventEffect(state, nom, level) {
  const C = cfgOf(state.config);
  const mult = level === "faible" ? C.p.evMultFaible : level === "moyenne" ? C.p.evMultMoyenne : level === "forte" ? C.p.evMultForte : C.p.evMultExtreme;
  const def = C.config.eventEffets.find((e) => e.nom === nom);
  if (!def) return;
  if (def.modDanger) state.modDanger += def.modDanger;
  for (const eff of def.effets) {
    const v = eff.base * mult;
    for (const p of state.players) {
      const rs = p.resources[eff.ressource];
      if (rs) rs.stock += v;
    }
  }
  if (def.maladieRisque > 0) {
    const risk = def.maladieRisque * mult;
    const rng = makeRng(state.rngState);
    for (const p of state.players) {
      for (const c of state.population[p.n] ?? []) {
        if (c.statut === "Sain" && rng.chance(risk)) {
          c.statut = "Malade";
        }
      }
    }
    state.rngState = rng.state();
  }
}
function applyDynastieCard(state, p, nom, rng) {
  const C = cfgOf(state.config);
  const def = C.config.dynastieEffets.find((e) => e.nom === nom);
  if (!def) return;
  const baseRessources = C.ressources.slice(0, 7);
  if (def.guerison) {
    const pop = state.population[p.n] ?? [];
    const malades = pop.filter((c) => c.statut === "Malade");
    if (malades.length > 0) {
      const elu = rng.pick(malades);
      elu.statut = "Sain";
      state.log.push({
        turn: state.turn + 1,
        type: "Syst\xE8me",
        joueur: p.n,
        texte: `Miracle : ${fullName(elu)} est gu\xE9ri(e).`
      });
    }
  }
  for (const eff of def.effets) {
    const res = eff.ressource === "(al\xE9atoire)" ? rng.pick(baseRessources) : eff.ressource;
    const rs = p.resources[res];
    if (rs) rs.stock += eff.base;
  }
}

// src/engine/ministeres.ts
function portefeuillesDuJoueur(state, p) {
  return (state.population[p.n] ?? []).filter((c) => c.statut !== "D\xE9c\xE9d\xE9" && c.titre === "Ministre" && c.ministere).map((c) => c.ministere);
}
function aMinistre(state, p, portefeuille) {
  return (state.population[p.n] ?? []).some(
    (c) => c.statut !== "D\xE9c\xE9d\xE9" && c.titre === "Ministre" && c.ministere === portefeuille
  );
}
function facteurSacre(state, p) {
  return aMinistre(state, p, "Chancelier de justice") ? 0.75 : 1;
}
function facteurAvencement(state, p) {
  return aMinistre(state, p, "Archichancelier") ? 0.25 : 0.5;
}
function appliquerEffetsMinisteres(state, C = cfgOf(state.config)) {
  const out = {};
  for (const p of state.players) {
    const gains = {};
    for (const m of portefeuillesDuJoueur(state, p)) {
      if (m === "Tr\xE9sorier") gains["Or"] = (gains["Or"] ?? 0) + 5;
      else if (m === "Grand Pr\xE9cepteur") gains["Science"] = (gains["Science"] ?? 0) + 1;
      else if (m === "Grand pr\xE9v\xF4t") gains["Fer"] = (gains["Fer"] ?? 0) + 1;
    }
    for (const [res, v] of Object.entries(gains)) {
      const rs = p.resources[res];
      if (rs) rs.stock += v;
    }
    if (Object.keys(gains).length > 0) out[p.n] = gains;
  }
  return out;
}
function effetsFinSaisonMinisteres(state, saisonQuiTermine) {
  for (const p of state.players) {
    const portefeuilles = portefeuillesDuJoueur(state, p);
    const parts = [];
    const nbChancEmiss = portefeuilles.filter((m) => m === "Chancelier des \xE9missaires").length;
    if (nbChancEmiss > 0) {
      p.emissaires = (p.emissaires ?? 0) + nbChancEmiss;
      parts.push(`+${nbChancEmiss} \xE9missaire(s) en r\xE9serve (Chancelier des \xE9missaires)`);
    }
    const nbSenechal = portefeuilles.filter((m) => m === "S\xE9n\xE9chal").length;
    if (saisonQuiTermine === "\xC9t\xE9" && nbSenechal > 0) {
      const v = 15 * nbSenechal;
      const rs = p.resources["Nourriture"];
      if (rs) rs.stock += v;
      parts.push(`+${v} Nourriture (${nbSenechal} S\xE9n\xE9chal${nbSenechal > 1 ? "s" : ""})`);
    }
    const nbCour = portefeuilles.filter((m) => m === "Ma\xEEtre de cour").length;
    if (nbCour > 0) {
      const v = 2 * nbCour;
      const rs = p.resources["Tourisme"];
      if (rs) rs.stock += v;
      parts.push(`+${v} Tourisme (${nbCour} Ma\xEEtre${nbCour > 1 ? "s" : ""} de cour)`);
    }
    const nbLegat = portefeuilles.filter((m) => m === "L\xE9gat du pontificat").length;
    if (nbLegat > 0) {
      const v = 20 * nbLegat;
      const rs = p.resources["Tourisme"];
      if (rs) rs.stock += v;
      parts.push(`+${v} Tourisme (${nbLegat} L\xE9gat${nbLegat > 1 ? "s" : ""} du pontificat)`);
    }
    if (parts.length > 0) {
      state.log.push({
        turn: state.turn + 1,
        type: "Syst\xE8me",
        joueur: p.n,
        texte: `\u{1F451} Minist\xE8res \u2014 fin ${saisonQuiTermine === "\xC9t\xE9" ? "d'\xE9t\xE9" : "d'hiver"} : ${p.nom} re\xE7oit ${parts.join(", ")}.`
      });
    }
  }
}
function changerPortefeuille(state, p, char, ministere) {
  const etaitConnetable = char.ministere === "Conn\xE9table";
  if (etaitConnetable && ministere !== "Conn\xE9table") {
    p.garnisonMinisteres = Math.max(0, (p.garnisonMinisteres ?? 0) - 15);
    state.log.push({
      turn: state.turn,
      type: "Syst\xE8me",
      joueur: p.n,
      texte: `\u{1F451} Minist\xE8res \u2014 ${fullName(char)} quitte la charge de Conn\xE9table : \u221215 Garnison.`
    });
  }
  char.ministere = ministere;
  if (ministere === "Conn\xE9table" && !etaitConnetable) {
    p.garnisonMinisteres = (p.garnisonMinisteres ?? 0) + 15;
    state.log.push({
      turn: state.turn,
      type: "Syst\xE8me",
      joueur: p.n,
      texte: `\u{1F451} Minist\xE8res \u2014 ${fullName(char)} prend la charge de Conn\xE9table : +15 Garnison \xE0 toutes les villes de ${p.nom}.`
    });
  }
}
function migrerNomsMinisteres(state) {
  const renomme = (c) => {
    if (c.ministere && RENOMMAGES_MINISTERES[c.ministere]) {
      c.ministere = RENOMMAGES_MINISTERES[c.ministere];
    }
  };
  for (const liste of Object.values(state.population ?? {})) {
    (liste ?? []).forEach(renomme);
  }
  for (const cite of state.citesLibres ?? []) {
    (cite.population ?? []).forEach(renomme);
  }
}

// src/engine/gameData2.ts
var BUILDINGS = DEFAULT_CONFIG.batiments;
var EVENTS = DEFAULT_CONFIG.events;
var DYNASTIES = DEFAULT_CONFIG.dynasties;
function buildingDef(nom, cfg) {
  return (cfg ?? DEFAULT_CONFIG).batiments.find((b) => b.nom === nom);
}
function schoolRankOf(batiments, cfg) {
  let rank = 0;
  for (const b of batiments) {
    const def = buildingDef(b, cfg);
    if (def && def.ecoleRang > rank) rank = def.ecoleRang;
  }
  return rank;
}

// src/engine/constructions.ts
function constructionsRefs(cfg) {
  const liste = (cfg ?? DEFAULT_CONFIG).constructions;
  return Array.isArray(liste) && liste.length > 0 ? liste : DEFAULT_CONFIG.constructions;
}
function constructionRef(nom, cfg, groupe) {
  const liste = constructionsRefs(cfg).filter((c) => c.nom === nom);
  return (groupe ? liste.find((c) => c.groupe === groupe) : void 0) ?? liste[0];
}
function amenagementsRefs(cfg) {
  return constructionsRefs(cfg).filter((c) => c.categorie === "Am\xE9nagement");
}
function batimentsRefs(cfg) {
  return constructionsRefs(cfg).filter((c) => c.categorie === "B\xE2timent");
}
var NOMBRE = String.raw`\d+(?:[.,]\d+)?`;
var RESSOURCES_FLUX = "Or|Bois|Pierre|Fer|Charbon|B\xE9tail|Soie|Nourritures?|Science";
var RESSOURCES_COUT = "Or|Bois|Pierres?|Fer|Charbon|B\xE9tails?|Soie|Nourritures?|Science|Tourisme";
function normaliserRessource(res) {
  if (/^pierres?$/i.test(res)) return "Pierre";
  if (/^bétails?$/i.test(res)) return "B\xE9tail";
  if (/^nourritures?$/i.test(res)) return "Nourriture";
  return res;
}
function parseCoutTexte(texte) {
  const out = {};
  if (!texte) return out;
  const re = new RegExp(String.raw`(${NOMBRE})\s*(?:de\s+)?(${RESSOURCES_COUT})\b`, "gi");
  for (const m of texte.matchAll(re)) {
    const res = normaliserRessource(m[2]);
    out[res] = (out[res] ?? 0) + parseFloat(m[1].replace(",", "."));
  }
  return out;
}
function phrases(texte) {
  return texte.replace(/\.\s+/g, ".\n").split(/\n+/).map((p) => p.trim()).filter(Boolean);
}
function analyserPhrase(phrase) {
  if (/coût/i.test(phrase)) return {};
  const out = {};
  const push = (negatif, nb, res) => {
    let v = parseFloat(nb.replace(",", "."));
    if (negatif) v = -v;
    out[normaliserRessource(res)] = (out[normaliserRessource(res)] ?? 0) + v;
  };
  if (/consomme/i.test(phrase)) {
    const re = new RegExp(String.raw`(${NOMBRE})\s*(?:de\s+)?(${RESSOURCES_FLUX})\b`, "gi");
    for (const m of phrase.matchAll(re)) push(true, m[1], m[2]);
    return out;
  }
  const reSigne = new RegExp(String.raw`([+\-\u2212])\s*(${NOMBRE})\s*(${RESSOURCES_FLUX})\b`, "gi");
  for (const m of phrase.matchAll(reSigne)) push(m[1] === "-" || m[1] === "\u2212", m[2], m[3]);
  const reInverse = new RegExp(String.raw`(${RESSOURCES_FLUX})\s*([+\-\u2212])\s*(${NOMBRE})\b`, "gi");
  for (const m of phrase.matchAll(reInverse)) push(m[2] === "-" || m[2] === "\u2212", m[3], m[1]);
  return out;
}
var CACHE = /* @__PURE__ */ new Map();
function parseProductionTexte(nom, texte) {
  if (!texte) return {};
  const cle = `${nom}|${texte}`;
  const cache = CACHE.get(cle);
  if (cache) return cache;
  const out = {};
  for (const phrase of phrases(texte)) {
    for (const [res, v] of Object.entries(analyserPhrase(phrase))) {
      out[res] = (out[res] ?? 0) + v;
    }
  }
  CACHE.set(cle, out);
  return out;
}
function coutConstructionRef(ref2) {
  return parseCoutTexte(ref2.cout);
}
function coutBatimentRef(nom, cfg, groupe) {
  const ref2 = constructionRef(nom, cfg, groupe);
  return ref2 ? coutConstructionRef(ref2) : {};
}
var RESSOURCES_INSTANTANEES = /* @__PURE__ */ new Set(["Garnison"]);
function effetsConstructionEntries(ref2) {
  if (ref2.effets) return ref2.effets;
  const ete = eteSeulementRef(ref2);
  return Object.entries(parseProductionTexte(ref2.nom, ref2.production)).map(([ressource, quantite]) => ({ ressource, quantite, ...ete ? { ete: true } : {} }));
}
function effetsConstructionRef(ref2) {
  if (!ref2.effets) return eteSeulementRef(ref2) ? {} : parseProductionTexte(ref2.nom, ref2.production);
  const out = {};
  for (const e of ref2.effets) {
    if (e.ete || RESSOURCES_INSTANTANEES.has(e.ressource)) continue;
    out[e.ressource] = (out[e.ressource] ?? 0) + e.quantite;
  }
  return out;
}
function effetsEteConstructionRef(ref2) {
  if (!ref2.effets) return eteSeulementRef(ref2) ? parseProductionTexte(ref2.nom, ref2.production) : {};
  const out = {};
  for (const e of ref2.effets) {
    if (!e.ete || RESSOURCES_INSTANTANEES.has(e.ressource)) continue;
    out[e.ressource] = (out[e.ressource] ?? 0) + e.quantite;
  }
  return out;
}
function instantanesConstructionRef(ref2) {
  const out = {};
  if (ref2.effets) {
    for (const e of ref2.effets) {
      if (!RESSOURCES_INSTANTANEES.has(e.ressource)) continue;
      out[e.ressource] = (out[e.ressource] ?? 0) + e.quantite;
    }
    return out;
  }
  const texte = [ref2.description, ref2.production].filter(Boolean).join(" ");
  const mT = texte.match(/Tourisme\s*\+?\s*(\d+(?:[.,]\d+)?)/i) ?? texte.match(/\+\s*(\d+(?:[.,]\d+)?)\s*Tourisme/i);
  if (mT) out.Tourisme = parseFloat(mT[1].replace(",", "."));
  const mG = ref2.description.match(/Garnison\s*\+?\s*(\d+)/i);
  if (mG) out.Garnison = parseInt(mG[1], 10);
  return out;
}
function eteSeulementRef(ref2) {
  if (ref2.effets) {
    return ref2.effets.length > 0 && ref2.effets.some((e) => e.ete) && ref2.effets.every((e) => e.ete || RESSOURCES_INSTANTANEES.has(e.ressource));
  }
  return /en\s+été/i.test(ref2.production);
}
function prerequisConstruction(ref2) {
  if (!ref2) return null;
  const m = ref2.cout.match(/([A-ZÉÈÀÂÎÔÛ][\wàâäéèêëîïôöûüç'’ .-]*?)\s+requis(?:e)?s?\b/i) ?? ref2.cout.match(/requis(?:e)?s?\s*:?\s*([A-ZÉÈÀÂÎÔÛ][\wàâäéèêëîïôöûüç'’ .-]*?)(?:\.|$)/i);
  if (!m) return null;
  return m[1].trim().replace(/\s*$/, "") || null;
}
function garnisonConstructionRef(ref2) {
  if (ref2.effets) {
    return ref2.effets.filter((e) => e.ressource === "Garnison").reduce((s, e) => s + e.quantite, 0);
  }
  const m = ref2.description.match(/Garnison\s*\+?\s*(\d+)/i);
  return m ? parseInt(m[1], 10) : 0;
}
function resumeConstruction(ref2) {
  if (!ref2) return "";
  const parts = [];
  const flux = Object.entries(effetsConstructionRef(ref2));
  if (flux.length > 0) {
    parts.push(flux.map(([r, v]) => `${v > 0 ? "+" : ""}${v} ${r}`).join(", ") + " / tour");
  }
  const ete = Object.entries(effetsEteConstructionRef(ref2));
  if (ete.length > 0) {
    parts.push("\xE9t\xE9 : " + ete.map(([r, v]) => `${v > 0 ? "+" : ""}${v} ${r}`).join(", "));
  }
  const inst = instantanesConstructionRef(ref2);
  if (inst.Tourisme) parts.push(`+${inst.Tourisme} Tourisme (\xE0 la construction)`);
  if (inst.Garnison) parts.push(`Garnison +${inst.Garnison}`);
  return parts.join(" \xB7 ");
}
function reductionCampDeBatisseurs(cfg) {
  const ref2 = constructionRef("Camp de b\xE2tisseurs", cfg);
  const m = ref2?.description.match(/aménagements\s+de\s+(\d+)\s*Or\s+et\s+(\d+)\s*Bois/i);
  if (!ref2 || !m) return { Or: 5, Bois: 1 };
  return { Or: parseInt(m[1], 10), Bois: parseInt(m[2], 10) };
}

// src/engine/factions.ts
function ficheFaction(p, C) {
  return [...C.config.peuplesLibres, ...C.config.peuplesAutres].find((f) => f.nom === p.peuple);
}
function reglesActives(p, C) {
  const f = ficheFaction(p, C);
  if (!f) return [];
  const out = [];
  for (const r of f.reglesBase ?? []) out.push({ source: "Base", nom: r.nom, texte: r.texte });
  const r2 = (f.ageII ?? []).find((r) => r.nom === p.regleAge2);
  if (r2) out.push({ source: "\xC2ge II", nom: r2.nom, texte: r2.texte });
  const r3 = (f.ageIII ?? []).find((r) => r.nom === p.regleAge3);
  if (r3) out.push({ source: "\xC2ge III", nom: r3.nom, texte: r3.texte });
  return out;
}
function nbAmenagements(p, nom) {
  let n = 0;
  for (const v of p.villes) for (const a of v.amenagements ?? []) if (a === nom) n++;
  return n;
}
function nbBatiments(p, nom) {
  let n = 0;
  for (const v of p.villes) for (const b of v.batiments) if (b === nom) n++;
  return n;
}
function nbBatimentsVille(ville, nom) {
  return ville.batiments.filter((b) => b === nom).length;
}
function nbVassaux(state, p) {
  return state.players.filter((q) => q.vassalDe === p.n).length;
}
function rangPaysNiveau(p, C) {
  const rangs = C.config.paysRangs ?? [];
  const idx = rangs.findIndex((r) => r.nom === (p.rang ?? ""));
  return idx >= 0 ? idx + 1 : 1;
}
function capitaleDe(p) {
  return p.villes.find((v) => v.nom.toLowerCase() === "capitale") ?? p.villes[0];
}
function batimentsFaction(p, C) {
  return batimentsRefs(C.config).filter(
    (b) => b.categorie === "B\xE2timent" && (b.faction ?? "") === p.peuple
  );
}
function batimentsCapitale(C) {
  return batimentsRefs(C.config).filter(
    (b) => b.groupe === "Capitale" && !(b.faction ?? "")
  );
}
var nbChamps = (p) => nbAmenagements(p, "Champ");
var EFFETS = {
  // ── Basiléens ───────────────────────────────────────────────────────
  "Basil\xE9ens|Paysans d\xE9vou\xE9s": {
    auto: (c) => `champs : +5 Nourriture/tour chacun (${nbChamps(c.p)} champ(s)) ; garnison des cit\xE9s \u221220`,
    flux: (c) => ({ Nourriture: 5 * nbChamps(c.p) }),
    garnisonVille: (c, v) => (v.type ?? "Ville") === "Ville" && /cité/i.test(v.rang ?? "") ? -20 : 0
  },
  "Basil\xE9ens|Temps de paix": {
    auto: (c) => {
      const vs = nbVassaux(c.state, c.p);
      if (c.p.vassalDe != null) {
        const suz = c.state.players.find((q) => q.n === c.p.vassalDe);
        return suz ? `vassal : +15 Tourisme \xD7 rang de pays du suzerain (${suz.nom}, rang ${rangPaysNiveau(suz, c.C)})` : "vassal : +15 Tourisme \xD7 rang de pays du suzerain";
      }
      return `suzerain : +5 Nourriture et +2 Or par tour et par ville vassale (${vs} vassal(e)s)`;
    },
    flux: (c) => {
      const out = {};
      const vs = nbVassaux(c.state, c.p);
      if (vs > 0) {
        out["Nourriture"] = 5 * vs;
        out["Or"] = 2 * vs;
      }
      if (c.p.vassalDe != null) {
        const suz = c.state.players.find((q) => q.n === c.p.vassalDe);
        if (suz) out["Tourisme"] = 15 * rangPaysNiveau(suz, c.C);
      }
      return out;
    }
  },
  "Basil\xE9ens|Abuser des serfs": {
    auto: (c) => `champs : +3 Tourisme/tour chacun (${nbChamps(c.p)} champ(s))`,
    flux: (c) => ({ Tourisme: 3 * nbChamps(c.p) })
  },
  // ── Peaux Vertes ────────────────────────────────────────────────────
  "PEAUX VERTES|C\xE9 partou \xE0 nou !": {
    auto: (c) => `+5 Nourriture/tour par ville (${c.p.villes.length} ville(s))`,
    flux: (c) => ({ Nourriture: 5 * c.p.villes.length })
  },
  "PEAUX VERTES|Donn\xE9 \xE0 mang\xE9": {
    auto: (c) => `villes et vassaux : +5 Nourriture et +1 Science par tour chacun (${c.p.villes.length} ville(s) + ${nbVassaux(c.state, c.p)} vassal(e)s)`,
    flux: (c) => {
      const n = c.p.villes.length + nbVassaux(c.state, c.p);
      return { Nourriture: 5 * n, Science: 1 * n };
    }
  },
  // ── Hommes Lézards ──────────────────────────────────────────────────
  // ── Nains ───────────────────────────────────────────────────────────
  // ── Elfes d'Or ──────────────────────────────────────────────────────
  "ELFES D'OR|Puit d'Or": {
    auto: (c) => `+1 Science/tour et garnison +40 par \xAB Puit de mana \xBB (${nbBatiments(c.p, "Puit de mana")} b\xE2timent(s))`,
    flux: (c) => ({ Science: 1 * nbBatiments(c.p, "Puit de mana") }),
    garnisonVille: (c, v) => 40 * nbBatimentsVille(v, "Puit de mana")
  },
  // ── Sylvains ────────────────────────────────────────────────────────
  "Sylvains|Don de miel": {
    auto: (c) => `apicultures : 8 Nourriture/tour au lieu de 12 (\u22124 \xD7 ${nbAmenagements(c.p, "Apiculture")} apiculture(s)) ; \xE9missaire \xE0 la construction (manuel)`,
    flux: (c) => ({ Nourriture: -4 * nbAmenagements(c.p, "Apiculture") })
  },
  "Sylvains|Biblioth\xE8que enfouie": {
    auto: (c) => `apicultures : +1 Science/tour chacune (${nbAmenagements(c.p, "Apiculture")} apiculture(s))`,
    flux: (c) => ({ Science: 1 * nbAmenagements(c.p, "Apiculture") })
  },
  "Sylvains|Enclave d'\xE9meraude": {
    auto: (c) => `${nbVassaux(c.state, c.p)} vassal(e)s : +2 Or/tour chacun ; garnison +20 par vassal et par ville`,
    flux: (c) => ({ Or: 2 * nbVassaux(c.state, c.p) }),
    garnisonVille: (c) => 20 * nbVassaux(c.state, c.p)
  },
  // ── Vermines de Kaoss ───────────────────────────────────────────────
  "VERMINES DE KAOSS|Un chef plus intelligent": {
    auto: () => `capitale : +1 Science par tour`,
    flux: () => ({ Science: 1 })
  },
  // ── Krovors ─────────────────────────────────────────────────────────
  // ── Revue 2026-10-15 (2e passe) : règles chiffrées restantes ──
  // Basiléens « Émissaires efficaces » (Âge II) : +1 émissaire en réserve
  //  à chaque succession de Dirigeant (appliqué dans handleDirigeantSuccession).
  // (pas un flux par tour — one-shot, codé dans sante.ts)
  "Basil\xE9ens|\xC9missaires efficaces": {
    auto: () => `+1 \xE9missaire en r\xE9serve \xE0 chaque succession de Dirigeant (cr\xE9dit\xE9 automatiquement)`,
    flux: () => ({})
  },
  // Vermines « Étudier leur manière de faire » (Âge III) : colonies +1 Science.
  // Colonies non modélisées — reste manuel (voir description).
  // Norls « Nomades » (Base) : 40 Or + 100 Nourriture au setup — one-shot
  //  à la création de partie (codé dans setup.ts).
  "NORLS|Nomades": {
    auto: () => `40 Or et 100 Nourriture en plus au d\xE9part (appliqu\xE9 \xE0 la cr\xE9ation de partie)`,
    flux: () => ({})
  },
  // Elfes d'Or « Accros à la magie » : 8 Science au départ + Science maintenue
  //  (déjà automatisé plus haut).
  // Peaux Vertes « Diriger par la peur » : vassaux +10 Or/rang sur leurs
  //  levées — automatisable via prixArmee des VASSAUX d'un suzerain Peaux Vertes.
  "PEAUX VERTES|Diriger par la peur": {
    auto: (c) => {
      const nb = nbVassaux(c.state, c.p);
      return `le co\xFBt de lev\xE9e d'arm\xE9e de vos vassaux est augment\xE9 de 10 Or par rang de pays (${nb} vassal(e)s) \u2014 appliqu\xE9 automatiquement chez eux`;
    },
    flux: () => ({})
  },
  // ── Revue 2026-10-15 (retour Thibaut : « tous les ministres et
  //    règles de faction pris en compte automatiquement ») — ajout des
  //    règles chiffrées automatisables restantes —──────────────
  // Krovors « Merchantialisme » (Âge III) : +1 Science par marchand vivant.
  // Norls « La course à la mer » (Âge II) : habitations et bâtiments de
  //  faction côtiers : +3 Or et +1 Bétail par tour. La proximité « Mer »
  //  d'une ville (champ optionnel, page Pays) marque les côtiers.
  "NORLS|La course \xE0 la mer": {
    auto: (c) => {
      const cotes = c.p.villes.filter((v) => v.proximite === "Mer").length;
      return `villes c\xF4ti\xE8res (proximit\xE9 Mer) : +3 Or et +1 B\xE9tail/tour chacune (${cotes} ville(s))`;
    },
    flux: (c) => {
      const cotes = c.p.villes.filter((v) => v.proximite === "Mer").length;
      const out = {};
      if (cotes > 0) {
        out["Or"] = 3 * cotes;
        out["B\xE9tail"] = 1 * cotes;
      }
      return out;
    }
  },
  // Norls « Savoir chamanique » (Âge II) : bâtiments de faction avec au
  //  moins 1 expansion : +1 Science. Les expansions ne sont pas modélisées :
  //  on compte les bâtiments de faction présents (le joueur ajuste en
  //  supprimant ceux sans expansion — signalé en manuel).
  "NORLS|Savoir chamanique": {
    auto: (c) => `b\xE2timents de faction : +1 Science/tour chacun (${batimentsFaction(c.p, c.C).filter((b) => nbBatiments(c.p, b.nom) > 0).length} type(s) construit(s)) \u2014 expansions non mod\xE9lis\xE9es, ajuster au plateau`,
    flux: (c) => {
      let n = 0;
      for (const b of batimentsFaction(c.p, c.C)) n += nbBatiments(c.p, b.nom);
      const out = {};
      if (n > 0) out["Science"] = n;
      return out;
    }
  },
  // Légions d'Outre-Tombe « Investir dans l'Os » (Âge II) : bâtiments de
  //  faction : +1 Os et +1 Or chacun par tour (l'Or égale la génération d'Os).
  // Elfes d'Or « Accros à la magie » (Base) : si la réserve de Science
  //  passe sous la production de Science, remise à niveau automatique.
  "ELFES D'OR|Accros \xE0 la magie": {
    auto: (c) => `Science maintenue au niveau de la production (cr\xE9dit\xE9 automatiquement)`,
    flux: (c) => {
      const prod = prodScience(c.state, c.p, c.C);
      const stock = c.p.resources["Science"]?.stock ?? 0;
      const out = {};
      if (stock < prod) out["Science"] = prod - stock;
      return out;
    }
  }
};
function prodScience(state, p, C) {
  return p.resources["Science"]?.prod ?? 0;
}
function regleActive(p, C, nomRegle) {
  return reglesActives(p, C).some((r) => r.nom === nomRegle);
}
function detailsFaction(state, p, C) {
  const ctx = { state, p, C };
  return reglesActives(p, C).map((r) => {
    const e = EFFETS[`${p.peuple}|${r.nom}`];
    const flux = e?.flux ? e.flux(ctx) : {};
    const garnison = !!e?.garnisonVille && p.villes.some((v) => e.garnisonVille(ctx, v) !== 0);
    return {
      source: r.source,
      nom: r.nom,
      texte: r.texte,
      auto: e ? e.auto(ctx) : null,
      flux,
      garnison
    };
  });
}
function effetsFaction(state, p, C) {
  const out = {};
  for (const d of detailsFaction(state, p, C)) {
    for (const [res, v] of Object.entries(d.flux)) out[res] = (out[res] ?? 0) + v;
  }
  return out;
}
function garnisonFactionVille(state, p, ville, C) {
  const ctx = { state, p, C };
  let g = 0;
  if (p.peuple === "NORLS" && regleActive(p, C, "Conqu\xEAte territoriale")) {
    for (const b of ville.batiments) {
      if (batimentsFaction(p, C).some((bf) => bf.nom === b)) g += 30;
    }
  }
  for (const r of reglesActives(p, C)) {
    const e = EFFETS[`${p.peuple}|${r.nom}`];
    if (e?.garnisonVille) g += e.garnisonVille(ctx, ville);
  }
  return g;
}
function appliquerEffetsFaction(state, p, C = cfgOf(state.config)) {
  const out = effetsFaction(state, p, C);
  const ctx = { state, p, C };
  for (const [res, v] of Object.entries(out)) {
    if (!v) continue;
    const rs = p.resources[res];
    if (rs) rs.stock += v;
  }
  if (Object.keys(out).length > 0) {
    const parts = Object.entries(out).map(([r, v]) => `${v > 0 ? "+" : ""}${Math.round(v * 10) / 10} ${r}`).join(", ");
    state.log.push({
      turn: state.turn + 1,
      type: "Syst\xE8me",
      joueur: p.n,
      texte: `\u2694\uFE0F ${p.nom} \u2014 faction ${p.peuple} : ${parts}.`
    });
  }
  return out;
}

// src/engine/sante.ts
function computeAgeMax(c, rng, C = cfgOf()) {
  let delta = 0;
  for (const t of c.traits ?? []) {
    const td = t ? traitDef(t, C.config) : void 0;
    if (td) delta += td.life_delta;
  }
  return C.p.ageMaxBase + rng.int(0, Math.max(0, C.p.ageMaxAla)) + delta;
}
function tryResurrection(c, rng, C = cfgOf()) {
  const t1 = traitDef((c.traits ?? [])[0], C.config);
  const seuil = t1 ? t1.resurrection_min_roll : 0;
  if (seuil > 0 && rng.die(6) >= seuil) {
    c.ageMax += rng.die(6) + rng.die(6);
    return true;
  }
  return false;
}
function maladieStep(state, p, c, rng, recap) {
  if (c.statut === "D\xE9c\xE9d\xE9") return;
  const C = cfgOf(state.config);
  const ville = p.villes.find((v) => v.nom === c.ville);
  const batiments = ville ? ville.batiments : [];
  let contractMod = 0;
  let cureMod = 0;
  for (const v of p.villes) {
    for (const b of v.batiments) {
      const bd = buildingDef(b, C.config);
      if (bd) cureMod += bd.bonusGuerisonGlobal;
    }
  }
  for (const b of batiments) {
    const bd = buildingDef(b, C.config);
    if (bd) {
      contractMod += bd.malContraction;
      cureMod += bd.bonusGuerison;
    }
  }
  if (c.statut === "Sain" || c.statut === "Enceinte") {
    let pContract = C.p.probaMaladie + C.p.modMaladieAge * c.age + contractMod;
    if (c.statut === "Enceinte") pContract += C.p.modMaladieEnceinte;
    if (rng.chance(Math.max(0, pContract))) {
      if (c.statut === "Enceinte") {
        c.enceinteMalade = true;
        state.log.push({
          turn: state.turn + 1,
          type: "Naissance",
          joueur: p.n,
          texte: `${fullName(c)} tombe malade en \xE9tant enceinte \u2014 elle accouchera, puis mourra de la maladie.`
        });
      } else {
        c.statut = "Malade";
      }
    }
  } else if (c.statut === "Malade") {
    if (rng.chance(Math.max(0, C.p.probaMaladie + C.p.modMaladieAge * c.age + contractMod))) {
      killCharacter(state, p, c, "maladie", recap);
      return;
    }
    const pCure = C.p.probaGuerison - C.p.modGuerisonAge * c.age + cureMod;
    if (rng.chance(Math.max(0, pCure))) c.statut = "Sain";
  }
}
function killCharacter(state, p, c, cause, recap) {
  invaliderIndexPopulation();
  const C = cfgOf(state.config);
  c.statut = "D\xE9c\xE9d\xE9";
  if (c.mariage) {
    const conjoint = toutesLesPopulations(state).find((x) => x.mariage === fullName(c));
    if (conjoint) conjoint.mariage = null;
  }
  bump(recap.deces, c.dynastie);
  if (cause === "maladie") recap.decesMaladie++;
  state.log.push({
    turn: state.turn + 1,
    type: "D\xE9c\xE8s",
    joueur: p.n,
    texte: `${fullName(c)} (${c.age} ans, ${c.dynastie}${c.titre ? `, ${c.titre}` : ""}) meurt de ${cause === "maladie" ? "la maladie" : "vieillesse"}.`
  });
  if (c.titre === C.p.titreDirigeant) {
    handleDirigeantSuccession(state, p, c, recap);
  }
}
function handleDirigeantSuccession(state, p, defunt, recap) {
  const C = cfgOf(state.config);
  const pop = state.population[p.n] ?? [];
  const heritier = pop.find(
    (c) => c.statut !== "D\xE9c\xE9d\xE9" && c.titre === C.p.titreHeritierStr
  );
  if (heritier) {
    heritier.titre = C.p.titreDirigeant;
    const rangs = C.config.paysRangs ?? [];
    const rangDef = rangs.find((r) => r.nom === p.rang);
    let sacreTxt = "";
    if (rangDef) {
      const fS = facteurSacre(state, p);
      const fA = facteurAvencement(state, p);
      const fDemocratie = p.regime === "D\xE9mocratie" ? 0 : 1;
      const demiOr = Math.floor((rangDef.coutOr ?? 0) * fS * fA * fDemocratie);
      const demiNourr = Math.floor((rangDef.coutNourriture ?? 0) * fS * fA * fDemocratie);
      const or = p.resources["Or"];
      if (or) or.stock -= demiOr;
      const nourr = p.resources["Nourriture"];
      if (nourr) nourr.stock -= demiNourr;
      if (demiOr > 0 || demiNourr > 0) {
        const reduc = [];
        if (fS < 1) reduc.push("Chancelier de justice : \u221225 %");
        if (fA < 0.5) reduc.push("Archichancelier : sacre d\u2019av\xE8nement r\xE9duit de moiti\xE9");
        sacreTxt = ` Sacre d'av\xE8nement pay\xE9 : ${demiOr} Or et ${demiNourr} Nourriture (${reduc.length > 0 ? `r\xE9duit \u2014 ${reduc.join(" ; ")}` : p.regime === "D\xE9mocratie" ? "sacre d\u2019av\xE8nement gratuit (D\xE9mocratie)" : `moiti\xE9 du prix du rang ${rangDef.nom}`}).`;
      }
    }
    let emissTxt = "";
    if (p.peuple === "Basil\xE9ens" && regleActive(p, C, "\xC9missaires efficaces")) {
      p.emissaires = (p.emissaires ?? 0) + 1;
      emissTxt = ` \u2014 +1 \xE9missaire en r\xE9serve (\xC9missaires efficaces).`;
    }
    state.log.push({
      turn: state.turn + 1,
      type: "Syst\xE8me",
      joueur: p.n,
      texte: `${p.nom} : ${fullName(heritier)} (${heritier.dynastie}) succ\xE8de \xE0 ${fullName(defunt)} comme Dirigeant.${sacreTxt}${emissTxt}`
    });
    return;
  }
  const nobles = pop.filter(
    (c) => c.statut !== "D\xE9c\xE9d\xE9" && c.age >= C.p.adultAge && isNobleDyn(c.dynastie, C) && c.titre !== C.p.titreSoldat && c.titre !== C.p.titreCommandant
  );
  const rng = makeRng(state.rngState);
  const eligibles = nobles.filter((c) => titreAllowedForCharacter(C.p.titreDirigeant, c, p, C));
  if (eligibles.length > 0) {
    const elu = rng.pick(eligibles);
    elu.titre = C.p.titreDirigeant;
    const crises = C.config.crises ?? [];
    const crise = crises.length > 0 ? rng.pick(crises) : null;
    state.rngState = rng.state();
    recap.crises.push("CRISE DE SUCCESSION");
    state.log.push({
      turn: state.turn + 1,
      type: "Crise",
      joueur: p.n,
      texte: `CRISE DE SUCCESSION \u2014 ${p.nom} : le noble ${fullName(elu)} (${elu.dynastie}) est promu Dirigeant.${crise ? ` Av\xE8nement sans h\xE9ritier \u2014 crise d\xE9clench\xE9e : ${crise}` : ""}`
    });
    return;
  }
  recap.crises.push("CRISE MAJEURE : poste de Dirigeant vacant");
  state.log.push({
    turn: state.turn + 1,
    type: "Crise",
    joueur: p.n,
    texte: `CRISE MAJEURE \u2014 ${p.nom} : aucun h\xE9ritier ni noble disponible, le poste de Dirigeant est vacant !`
  });
}

// src/engine/naissances.ts
var cacheIndexPop = null;
function indexPopulationMonde(state) {
  if (cacheIndexPop && cacheIndexPop.state === state) return cacheIndexPop.index;
  const index = /* @__PURE__ */ new Map();
  for (const liste of Object.values(state.population ?? {})) {
    for (const c of liste ?? []) {
      if (c.statut !== "D\xE9c\xE9d\xE9") index.set(fullName(c), c);
    }
  }
  for (const cite of state.citesLibres ?? []) {
    for (const c of cite.population ?? []) {
      if (c.statut !== "D\xE9c\xE9d\xE9") index.set(fullName(c), c);
    }
  }
  cacheIndexPop = { state, index };
  return index;
}
function invaliderIndexPopulation() {
  cacheIndexPop = null;
}
function computeFecondite(state, p, c) {
  const C = cfgOf(state.config);
  if (c.statut === "D\xE9c\xE9d\xE9" || c.age < C.p.adultAge) return 0;
  if (c.sexe !== "F") return maleAgeFactor(c.age) * orientationFertFactor(c.orientation);
  const ville = p.villes.find((v) => v.nom === c.ville);
  const mari = c.mariage ? indexPopulationMonde(state).get(c.mariage) : void 0;
  if (mari && mari.sexe !== "M") return 0;
  const factorMari = mari ? maleAgeFactor(mari.age) * orientationFertFactor(mari.orientation) : C.p.fertSingleFactor;
  let proba = C.p.fertBaseRate;
  proba *= femaleAgeFactor(c.age);
  proba *= factorMari;
  proba *= traitsFertFactor(c, mari ?? null, C);
  proba *= cultureFertFactor(p.culture, C);
  proba *= orientationFertFactor(c.orientation);
  proba *= taxBirthFactor(ville, C);
  return proba;
}
function femaleAgeFactor(age) {
  if (age < 16) return 0;
  if (age <= 25) return 1;
  if (age <= 30) return 0.9;
  if (age <= 35) return 0.8;
  if (age <= 40) return 0.7;
  if (age <= 44) return 0.4;
  if (age <= 49) return 0.1;
  if (age <= 99) return 0.02;
  return 0;
}
function maleAgeFactor(age) {
  if (age < 16) return 0;
  return Math.max(0, 1 - 0.5 * (age - 16) / 42);
}
function orientationFertFactor(orientation) {
  const o = orientation.toLowerCase();
  return o.includes("homo") || o.includes("asex") ? 0.7 : 1;
}
function cultureFertFactor(culture, C = cfgOf()) {
  const c = cultureDef(culture, C.config);
  return c ? c.fertFactor : 1;
}
function traitsFertFactor(a, b, C = cfgOf()) {
  let sum = 0;
  for (const t of a.traits ?? []) {
    const td = t ? traitDef(t, C.config) : void 0;
    if (td) sum += td.fert_add;
  }
  if (b) {
    for (const t of b.traits ?? []) {
      const td = t ? traitDef(t, C.config) : void 0;
      if (td) sum += td.fert_add;
    }
  }
  return Math.min(C.p.fertTraitFactorMax, Math.max(C.p.fertTraitFactorMin, 1 + sum));
}
function conceptionEtNaissances(state, p, rng, recap) {
  const C = cfgOf(state.config);
  const pop = state.population[p.n] ?? [];
  for (const mere of pop) {
    if (mere.statut !== "Enceinte") continue;
    const pereBioName = mere.pereBio;
    const pere = pereBioName ? pop.find((x) => fullName(x) === pereBioName) : void 0;
    accoucher(state, p, mere, pere, rng, recap);
    mere.statut = "Sain";
    mere.pereBio = null;
    if (mere.enceinteMalade) {
      mere.enceinteMalade = false;
      killCharacter(state, p, mere, "maladie", recap);
    }
  }
  const indexMonde = indexPopulationMonde(state);
  const villesParNom = new Map(p.villes.map((v) => [v.nom, v]));
  for (const mere of pop) {
    if (mere.sexe !== "F" || mere.statut !== "Sain" && mere.statut !== "Malade") continue;
    if (mere.age < C.p.adultAge) continue;
    const ville = villesParNom.get(mere.ville);
    const mari = mere.mariage ? indexMonde.get(mere.mariage) : void 0;
    if (mari && mari.sexe !== "M") continue;
    const factorMari = mari ? maleAgeFactor(mari.age) * orientationFertFactor(mari.orientation) : C.p.fertSingleFactor;
    let proba = C.p.fertBaseRate;
    proba *= femaleAgeFactor(mere.age);
    proba *= factorMari;
    proba *= traitsFertFactor(mere, mari ?? null, C);
    proba *= cultureFertFactor(p.culture, C);
    proba *= orientationFertFactor(mere.orientation);
    proba *= taxBirthFactor(ville, C);
    if (rng.chance(proba)) {
      let pereBio;
      let batard = false;
      if (mari) {
        if (rng.chance(C.p.adulteryRate)) {
          const amants = pop.filter(
            (x) => x.sexe === "M" && (x.statut === "Sain" || x.statut === "Malade") && x.age >= C.p.adultAge && x.id !== mari.id
          );
          pereBio = amants.length > 0 ? rng.pick(amants) : void 0;
          batard = true;
        } else {
          pereBio = mari;
        }
      } else {
        const amants = pop.filter(
          (x) => x.sexe === "M" && (x.statut === "Sain" || x.statut === "Malade") && x.age >= C.p.adultAge
        );
        pereBio = amants.length > 0 ? rng.pick(amants) : void 0;
        batard = true;
      }
      const etaitMalade = mere.statut === "Malade";
      mere.statut = "Enceinte";
      mere.pereBio = pereBio ? fullName(pereBio) : null;
      mere.enfantBatard = batard;
      bump(recap.conceptions, mere.dynastie);
      state.log.push({
        turn: state.turn + 1,
        type: "Naissance",
        joueur: p.n,
        texte: `${fullName(mere)} attend un enfant${batard ? " (b\xE2tard)" : ""}${etaitMalade ? " \u2014 sa maladie dispara\xEEt (bug assum\xE9)" : ""}.`
      });
    }
  }
}
function accoucher(state, p, mere, pere, rng, recap) {
  const C = cfgOf(state.config);
  const pop = state.population[p.n] ?? [];
  const r = rng.next();
  const nb = r < C.p.fertTripletsRate ? 3 : r < C.p.fertTripletsRate + C.p.fertTwinsRate ? 2 : 1;
  const batard = mere.enfantBatard;
  const consanguin = isConsanguineous(mere, pere);
  for (let i = 0; i < nb; i++) {
    const enfant = {
      id: newId(rng),
      nom: mere.nom,
      prenom: pickName(state, p, rng, void 0),
      dynastie: computeBabyDynasty(state, p, mere, pere, batard, rng),
      sexe: rng.pickWeighted(C.genres, (g) => g.poids).nom === "Masculin" ? "M" : "F",
      age: 0,
      culture: mere.culture,
      ville: mere.ville,
      orientation: rng.pickWeighted(C.orientations, (o) => o.poids).nom,
      traits: ["", "", ""],
      statut: "Sain",
      mariage: null,
      mere: fullName(mere),
      pere: pere ? fullName(pere) : null,
      pereBio: null,
      enfantBatard: batard,
      titre: null,
      education: null,
      fecondite: 0,
      ageMax: 0,
      armee: null
    };
    inheritTraits(enfant, mere, pere, rng, C);
    if (batard) ensureTraitPresent(enfant, C.p.traitBatard);
    if (consanguin) ensureTraitPresent(enfant, C.p.traitConsanguin);
    enfant.ageMax = computeAgeMax(enfant, rng, C);
    pop.push(enfant);
    invaliderIndexPopulation();
    bump(recap.naissances, enfant.dynastie);
    state.log.push({
      turn: state.turn + 1,
      type: "Naissance",
      joueur: p.n,
      texte: `Naissance : ${fullName(enfant)} (${enfant.sexe}, ${enfant.dynastie})${nb > 1 ? ` \u2014 fratrie de ${nb}` : ""}.`
    });
  }
  mere.enfantBatard = false;
}
function pickName(state, p, rng, sexe) {
  const C = cfgOf(state.config);
  const peup = peupleDef(p.peuple, C.config) ?? peupleDef(C.peuples[0], C.config);
  if (!peup) return "Anonyme";
  if (sexe === "F") return rng.pick(peup.prenomsF);
  if (sexe === "M") return rng.pick(peup.prenomsM);
  return rng.pick([...peup.prenomsM, ...peup.prenomsF]);
}
function isConsanguineous(mere, pere) {
  if (!pere) return false;
  if (mere.mere && mere.mere === pere.mere) return true;
  if (mere.pere && mere.pere === pere.pere) return true;
  return false;
}
function computeBabyDynasty(state, p, mere, pere, batard, rng) {
  const C = cfgOf(state.config);
  if (batard) {
    if (pere && isNobleDyn(pere.dynastie, C)) return pere.dynastie;
    if (isNobleDyn(mere.dynastie, C)) return mere.dynastie;
    return C.p.dynastieRoturier;
  }
  const cult = cultureDef(p.culture, C.config);
  const hered = cult ? cult.heredite : "Masculine";
  if (hered === "Masculine") return pere ? pere.dynastie : mere.dynastie;
  if (hered === "F\xE9minine") return mere.dynastie;
  return rng.chance(0.5) ? pere ? pere.dynastie : mere.dynastie : mere.dynastie;
}
function inheritTraits(enfant, mere, pere, rng, C = cfgOf()) {
  const parents = [mere, ...pere ? [pere] : []];
  const nbEssais = Math.max(0, Math.round(C.p.traitHeriteEssais));
  for (const parent of parents) {
    for (const t of parent.traits ?? []) {
      if (!t) continue;
      const td = traitDef(t, C.config);
      if (!td || !td.heritable) continue;
      for (let essai = 0; essai < nbEssais; essai++) {
        if (rng.chance(C.p.traitHeriteParEssai)) {
          if (addTraitIfFree(enfant, t)) break;
        }
      }
    }
  }
  const pris = (enfant.traits ?? []).filter(Boolean);
  const pool = C.traits.filter((td) => td.weight > 0 && !pris.includes(td.name));
  for (let slot = 0; slot < 3 && pool.length > 0; slot++) {
    if ((enfant.traits ?? [])[slot]) continue;
    if (rng.chance(C.p.traitTirageSlot)) {
      const t = rng.pickWeighted(pool, (td) => td.weight);
      addTraitIfFree(enfant, t.name);
    }
  }
}
function addTraitIfFree(c, trait) {
  if (!Array.isArray(c.traits)) c.traits = ["", "", ""];
  if (c.traits.includes(trait)) return false;
  const idx = c.traits.findIndex((t) => !t);
  if (idx < 0) return false;
  c.traits[idx] = trait;
  return true;
}
function ensureTraitPresent(c, trait) {
  if (!Array.isArray(c.traits)) c.traits = ["", "", ""];
  if (!c.traits.includes(trait)) {
    const idx = c.traits.findIndex((t) => !t);
    if (idx >= 0) c.traits[idx] = trait;
    else c.traits[2] = trait;
  }
}

// src/engine/merveilles.ts
function aLaboratoireFalheim(p) {
  return nbBatiments(p, "Laboratoire d'exp\xE9rimentations de Falheim") > 0;
}

// src/engine/batiments.ts
function batimentRef(nom, C, groupe) {
  return constructionRef(nom, C?.config, groupe);
}
function batimentsConstructionsRefs(C) {
  return batimentsRefs(C?.config);
}
var RESSOURCES_FLUX2 = "Or|Bois|Pierre|Fer|Charbon|B\xE9tail|Soie|Nourritures?|Science";
var NOMBRE2 = String.raw`\d+(?:[.,]\d+)?`;
function phrases2(texte) {
  return texte.replace(/\.\s+/g, ".\n").split(/\n+/).map((p) => p.trim()).filter(Boolean);
}
function analyserPhrase2(phrase) {
  if (/coût/i.test(phrase)) return {};
  const out = {};
  const push = (negatif, nb, res) => {
    let v = parseFloat(nb.replace(",", "."));
    if (negatif) v = -v;
    const ressource = /^nourritures?$/i.test(res) ? "Nourriture" : res;
    out[ressource] = (out[ressource] ?? 0) + v;
  };
  if (/consomme/i.test(phrase)) {
    const re = new RegExp(String.raw`(${NOMBRE2})\s*(?:de\s+)?(${RESSOURCES_FLUX2})\b`, "gi");
    for (const m of phrase.matchAll(re)) push(true, m[1], m[2]);
    return out;
  }
  const reSigne = new RegExp(String.raw`([+\-\u2212])\s*(${NOMBRE2})\s*(${RESSOURCES_FLUX2})\b`, "gi");
  for (const m of phrase.matchAll(reSigne)) push(m[1] === "-" || m[1] === "\u2212", m[2], m[3]);
  const reInverse = new RegExp(String.raw`(${RESSOURCES_FLUX2})\s*([+\-\u2212])\s*(${NOMBRE2})\b`, "gi");
  for (const m of phrase.matchAll(reInverse)) push(m[2] === "-" || m[2] === "\u2212", m[3], m[1]);
  return out;
}
var EFFETS_FORCES = {
  "Ponton": {},
  "Port de p\xEAche": {},
  "Port de commerce": {},
  "Guilde des marchands": { Charbon: -1 }
};
var REMPLACE = {
  "Camp de travailleurs": ["Camp de b\xFBcheron", "Camp de mineur"],
  "Silo \xE0 grain": ["Grange"],
  "Moulin \xE0 vent": ["Silo \xE0 grain", "Grange"],
  "Guilde des artisans de la terre.": ["Moulin \xE0 vent", "Silo \xE0 grain", "Grange"],
  "Ecole interm\xE9diaire": ["Ecole \xE9l\xE9mentaire", "\xC9cole \xE9l\xE9mentaire"],
  "\xC9cole interm\xE9diaire": ["Ecole \xE9l\xE9mentaire", "\xC9cole \xE9l\xE9mentaire"],
  "Ecole sup\xE9rieure": ["Ecole interm\xE9diaire", "\xC9cole interm\xE9diaire", "Ecole \xE9l\xE9mentaire", "\xC9cole \xE9l\xE9mentaire"],
  "\xC9cole sup\xE9rieure": ["Ecole interm\xE9diaire", "\xC9cole interm\xE9diaire", "Ecole \xE9l\xE9mentaire", "\xC9cole \xE9l\xE9mentaire"],
  "Guilde des diplomates": [
    "Ecole sup\xE9rieure",
    "\xC9cole sup\xE9rieure",
    "Ecole interm\xE9diaire",
    "\xC9cole interm\xE9diaire",
    "Ecole \xE9l\xE9mentaire",
    "\xC9cole \xE9l\xE9mentaire"
  ],
  "Guilde des savants": ["Institut de recherche"],
  "Guilde des \xE9vangiles": ["Conjuratoire"],
  "Guilde des marins": ["Complexe d'exploitation maritime"],
  "Guilde des marchands": ["Plateforme commerciale"],
  // Bâtiments de faction (Basiléens) : chaque palier remplace le précédent.
  "Grande Cath\xE9drale": ["\xC9glise"],
  "Palais de Notre-Dame du Palatinat": ["Grande Cath\xE9drale", "\xC9glise"]
};
var CACHE2 = /* @__PURE__ */ new Map();
function effetsTourBatiment(nom, C) {
  const ref2 = constructionRef(nom, C.config);
  const bd = buildingDef(nom, C.config);
  const cle = `${nom}|${ref2?.production ?? ""}|${bd?.effet ?? ""}|${JSON.stringify(ref2?.effets ?? null)}`;
  const cache = CACHE2.get(cle);
  if (cache) return cache;
  let out;
  if (ref2) {
    out = effetsConstructionRef(ref2);
  } else if (nom in EFFETS_FORCES) {
    out = { ...EFFETS_FORCES[nom] };
  } else if (!bd?.effet) {
    out = {};
  } else {
    const texte = bd.effet.replace(/coût[^.]*\.?/gi, " ");
    out = {};
    for (const phrase of phrases2(texte)) {
      for (const [res, v] of Object.entries(analyserPhrase2(phrase))) {
        out[res] = (out[res] ?? 0) + v;
      }
    }
  }
  CACHE2.set(cle, out);
  return out;
}
function garnisonBatiment(nom, C) {
  const ref2 = constructionRef(nom, C.config);
  if (ref2) return garnisonConstructionRef(ref2);
  const bd = buildingDef(nom, C.config);
  const m = bd?.effet?.match(/Garnison\s*\+?\s*(\d+)/i);
  return m ? parseInt(m[1], 10) : 0;
}
function tourismeStatiqueBatiment(nom, C) {
  const ref2 = constructionRef(nom, C.config);
  if (ref2?.effets) {
    return ref2.effets.filter((e) => e.ressource === "Tourisme").reduce((s, e) => s + e.quantite, 0);
  }
  const bd = buildingDef(nom, C.config);
  const texte = [ref2?.description, ref2?.production, bd?.effet].filter(Boolean).join(" ");
  const m = texte.match(/Tourisme\s*\+?\s*(\d+(?:[.,]\d+)?)/i) ?? texte.match(/\+\s*(\d+(?:[.,]\d+)?)\s*Tourisme/i);
  return m ? parseFloat(m[1].replace(",", ".")) : 0;
}
function coutBatiment(nom, C, groupe) {
  const ref2 = constructionRef(nom, C.config, groupe);
  if (ref2) return parseCoutTexte(ref2.cout);
  const listes = [...C.config.batimentsVille ?? [], ...C.config.batimentsChateau ?? []];
  const ligne = listes.find((b) => b?.nom === nom);
  return parseCoutTexte(ligne?.cout ?? "");
}
function batimentsRemplaces(ville) {
  const presents = new Set(ville.batiments);
  const ignores = /* @__PURE__ */ new Set();
  for (const nom of presents) {
    for (const remplace of REMPLACE[nom] ?? []) {
      if (presents.has(remplace)) ignores.add(remplace);
    }
  }
  return ignores;
}
function effetsBatimentsVille(ville, C) {
  const ignores = batimentsRemplaces(ville);
  const out = {};
  for (const nom of ville.batiments) {
    if (ignores.has(nom)) continue;
    for (const [res, v] of Object.entries(effetsTourBatiment(nom, C))) {
      out[res] = (out[res] ?? 0) + v;
    }
  }
  return out;
}
function appliquerEffetsBatiments(p, C) {
  const out = {};
  for (const ville of p.villes) {
    for (const [res, v] of Object.entries(effetsBatimentsVille(ville, C))) {
      out[res] = (out[res] ?? 0) + v;
    }
  }
  if (aLaboratoireFalheim(p) && capitaleDe(p) != null) {
    const cap = capitaleDe(p);
    for (const [res, v] of Object.entries(effetsBatimentsVille(cap, C))) {
      if (res === "Science" && v > 0) out[res] = (out[res] ?? 0) + v;
    }
  }
  for (const [res, v] of Object.entries(out)) {
    if (!v) continue;
    const rs = p.resources[res];
    if (rs) rs.stock += v;
  }
  return out;
}
function detailsBatimentsJoueur(p, C) {
  const lignes = /* @__PURE__ */ new Map();
  for (const ville of p.villes) {
    const ignores = batimentsRemplaces(ville);
    for (const nom of ville.batiments) {
      let l = lignes.get(nom);
      if (!l) {
        l = { nom, villes: [], effets: {}, remplacePar: [], garnison: garnisonBatiment(nom, C) };
        lignes.set(nom, l);
      }
      l.villes.push(ville.nom);
      if (ignores.has(nom)) {
        for (const autre of ville.batiments) {
          if ((REMPLACE[autre] ?? []).includes(nom) && !l.remplacePar.includes(autre)) {
            l.remplacePar.push(autre);
          }
        }
      } else {
        for (const [res, v] of Object.entries(effetsTourBatiment(nom, C))) {
          l.effets[res] = (l.effets[res] ?? 0) + v;
        }
      }
    }
  }
  return [...lignes.values()].sort((a, b) => a.nom.localeCompare(b.nom));
}

// src/engine/habitations.ts
function nomRang(rang) {
  return rang.split(":")[0].trim();
}
function typeVille(ville) {
  return ville.type ?? "Ville";
}
function habitationDef(ville, C) {
  const type = typeVille(ville);
  const nom = nomRang(ville.rang ?? C.config.rangsHabitation?.[0]?.rang ?? "Hameau");
  const table = C.config.typesHabitation ?? [];
  const def = table.find((d) => d.type.toLowerCase() === type.toLowerCase() && nomRang(d.rang).toLowerCase() === nom.toLowerCase());
  if (def) return def;
  const idx = (C.config.rangsHabitation ?? []).findIndex((r) => nomRang(r.rang).toLowerCase() === nom.toLowerCase());
  if (idx < 0) return void 0;
  const consos = ["2 Or", "10 Nourriture, 8 Or", "20 Nourriture, 20 Or"];
  const garr = [10, 24, 40];
  return {
    type: "Ville",
    rang: nom,
    cout: "",
    habitantsRequis: [0, 120, 200][idx] ?? 0,
    consommation: consos[idx] ?? "",
    garnison: garr[idx] ?? 0
  };
}
function rangsDisponibles(type, C) {
  const table = C.config.typesHabitation ?? [];
  const rangs = table.filter((d) => d.type.toLowerCase() === type.toLowerCase()).map((d) => d.rang);
  if (rangs.length > 0) return rangs;
  return (C.config.rangsHabitation ?? []).map((r) => nomRang(r.rang));
}
function garnisonBaseVille(ville, C) {
  return habitationDef(ville, C)?.garnison ?? 0;
}
function habitantsRequisVille(ville, C) {
  return habitationDef(ville, C)?.habitantsRequis ?? 0;
}
function consommationsVille(ville, C) {
  const out = {};
  const texte = habitationDef(ville, C)?.consommation ?? "";
  for (const [res, v] of Object.entries(parseCoutTexte(texte))) {
    if (v !== 0) out[res] = (out[res] ?? 0) - v;
  }
  return out;
}
function consommationsPays(p, C, state) {
  const out = {};
  const veneur = state ? aMinistre(state, p, "Grand veneur") : false;
  const reduc = veneur ? 5 * rangPaysNiveau(p, C) : 0;
  for (const v of p.villes) {
    const consoVille = { ...consommationsVille(v, C) };
    if (reduc > 0 && consoVille["Nourriture"] !== void 0) {
      consoVille["Nourriture"] = Math.min(0, (consoVille["Nourriture"] ?? 0) + reduc);
    }
    for (const [res, val] of Object.entries(consoVille)) {
      out[res] = (out[res] ?? 0) + val;
    }
  }
  return out;
}
function coutHabitation(ville, C) {
  return parseCoutTexte(habitationDef(ville, C)?.cout ?? "");
}
function debiterCoutHabitation(state, p, ville, C, fondation = false) {
  const def = habitationDef(ville, C);
  const cout = coutHabitation(ville, C);
  let reducBailli = false;
  if (fondation && aMinistre(state, p, "Grand bailli")) {
    reducBailli = true;
    if (cout["Or"] !== void 0) cout["Or"] = Math.max(0, cout["Or"] - 8);
    if (cout["Bois"] !== void 0) cout["Bois"] = Math.max(0, cout["Bois"] - 3);
  }
  if (fondation && p.peuple === "PEAUX VERTES") {
    if (cout["Or"] !== void 0) cout["Or"] = Math.max(0, cout["Or"] - 8);
    if (cout["Bois"] !== void 0) cout["Bois"] = Math.max(0, cout["Bois"] - 2);
  }
  const reducTechs = fondation ? reductionFondation(p, C, ville) : ville.proximite === "Mer" && aTech(p, "Expansion maritime", C) ? { Bois: 3, Pierre: 3 } : {};
  for (const [r, v] of Object.entries(reducTechs)) {
    if (cout[r] !== void 0) cout[r] = Math.max(0, cout[r] - v);
  }
  for (const [res, v] of Object.entries(cout)) {
    const rs = p.resources[res];
    if (rs && v !== 0) rs.stock -= v;
  }
  const parts = Object.entries(cout).map(([r, v]) => `${v} ${r}`).join(" + ");
  let bonusHab = 0;
  let bonusTxt = "";
  if (p.peuple === "Basil\xE9ens") {
    if (regleActive(p, C, "Distribution des richesses")) {
      bonusHab += 50;
      bonusTxt += " +50 hab. (Distribution des richesses)";
    }
    if (!fondation && regleActive(p, C, "H\xE9ritage familial")) {
      bonusHab += 50;
      bonusTxt += " +50 hab. (H\xE9ritage familial)";
    }
  }
  if (bonusHab > 0) {
    const rs = p.resources["Habitants"];
    if (rs) rs.stock += bonusHab;
  }
  const requis = def?.habitantsRequis ?? 0;
  const vivants = (state.population[p.n] ?? []).filter((c) => c.statut !== "D\xE9c\xE9d\xE9" && c.ville === ville.nom).length;
  state.log.push({
    turn: state.turn,
    type: "Syst\xE8me",
    joueur: p.n,
    texte: `\u{1F3F0} ${ville.nom} \u2014 ${def?.rang ?? typeVille(ville)} (${typeVille(ville)})` + (parts ? ` \u2014 co\xFBt d\xE9bit\xE9 du stock : ${parts}` : " \u2014 gratuit") + (reducBailli ? " (Grand bailli : \u22128 Or, \u22123 Bois)." : "") + (p.peuple === "PEAUX VERTES" && fondation ? " (Barbares primitifs : \u22128 Or, \u22122 Bois)." : "") + bonusTxt + (requis > 0 && vivants < requis ? ` \u26A0 habitants insuffisants (${vivants}/${requis}).` : ".") + (def?.consommation ? ` Consommation : ${def.consommation} par tour.` : "")
  });
  return cout;
}
function appliquerConsommationsHabitations(state, p, C = cfgOf(state.config)) {
  const out = consommationsPays(p, C, state);
  for (const [res, v] of Object.entries(out)) {
    const rs = p.resources[res];
    if (rs) rs.stock += v;
  }
  if (Object.keys(out).length > 0) {
    const parts = Object.entries(out).map(([r, v]) => `${fmtCourt(v)} ${r}`).join(", ");
    state.log.push({
      turn: state.turn + 1,
      type: "Syst\xE8me",
      joueur: p.n,
      texte: `\u{1F3E0} ${p.nom} \u2014 consommation des habitations : ${parts} par tour.`
    });
  }
  return out;
}
function fmtCourt(v) {
  return `${v < 0 ? "\u2212" : ""}${Math.abs(v)}`;
}

// src/engine/regimes.ts
function rangNiveau(ville, C) {
  const type = ville.type ?? "Ville";
  const nom = nomRang(ville.rang ?? C.config.rangsHabitation?.[0]?.rang ?? "Hameau");
  const table = C.config.typesHabitation ?? [];
  const rangsType = table.filter((d) => d.type.toLowerCase() === type.toLowerCase());
  const idx = rangsType.findIndex((d) => nomRang(d.rang).toLowerCase() === nom.toLowerCase());
  if (idx >= 0) return idx + 1;
  const idx2 = (C.config.rangsHabitation ?? []).findIndex((r) => nomRang(r.rang).toLowerCase() === nom.toLowerCase());
  return idx2 >= 0 ? idx2 + 1 : 1;
}
function garnisonHabitationVille(p, ville, C, state) {
  let g = garnisonBaseVille(ville, C);
  g += p.garnisonMinisteres ?? 0;
  if (state && aMinistre(state, p, "Grand pr\xE9v\xF4t")) {
    g += 10 * rangPaysNiveau(p, C);
  }
  for (const b of ville.batiments) g += garnisonBatiment(b, C);
  g += garnisonProgresVille(p, ville, C);
  const regime = C.regimes.find((r) => r.nom === p.regime);
  const bonus = regime?.garnisonParRang ?? 0;
  if (bonus) g += bonus * rangNiveau(ville, C);
  if (state) g += garnisonFactionVille(state, p, ville, C);
  return Math.max(g, garnisonMinimaleProgres(p, C));
}
function detailGarnisonVille(p, ville, C, state) {
  const out = [];
  const push = (origine, label, valeur) => {
    if (valeur !== 0) out.push({ origine, label, valeur });
  };
  const base = garnisonBaseVille(ville, C);
  push("base", `base du rang ${nomRang(ville.rang ?? "") || ville.rang || "Hameau"}`, base);
  for (const b of ville.batiments) push("b\xE2timent", b, garnisonBatiment(b, C));
  for (const l of lignesGarnisonProgresVille(p, ville, C)) push("technologie", l.label, l.valeur);
  const regime = C.regimes.find((r) => r.nom === p.regime);
  const bonus = regime?.garnisonParRang ?? 0;
  if (bonus) push("r\xE9gime", `${p.regime} : ${bonus} \xD7 rang de la ville`, bonus * rangNiveau(ville, C));
  if (p.garnisonMinisteres) push("ministre", "Conn\xE9table (prise de fonction)", p.garnisonMinisteres);
  if (state && aMinistre(state, p, "Grand pr\xE9v\xF4t")) {
    push("ministre", "Grand pr\xE9v\xF4t : 10 \xD7 rang de pays", 10 * rangPaysNiveau(p, C));
  }
  if (state) push("faction", "r\xE8gles de faction", garnisonFactionVille(state, p, ville, C));
  return out;
}
function garnisonHabitationsPays(p, C, state) {
  let g = 0;
  for (const v of p.villes) g += garnisonHabitationVille(p, v, C, state);
  return g;
}
function effetsRegime(p, saison, C) {
  const out = {};
  const regime = C.regimes.find((r) => r.nom === p.regime);
  if (!regime) return out;
  const n = regime.nourrEteChampRiziere ?? 0;
  if (n && saison === "\xC9t\xE9") {
    let nb = 0;
    for (const v of p.villes) {
      for (const a of v.amenagements ?? []) {
        if (a === "Champ" || a === "Rizi\xE8re") nb++;
      }
    }
    if (nb > 0) out["Nourriture"] = (out["Nourriture"] ?? 0) + n * nb;
  }
  return out;
}
function nbVillesCultureMonde(state, culture) {
  let n = 0;
  for (const q of state.players) {
    for (const v of q.villes) {
      if (v.culture === culture) n++;
    }
  }
  return n;
}
function detailCulturePays(state, p, C) {
  const cult = cultureDef(p.culture, C.config);
  if (!cult) return [];
  const lois = [
    ["Nourriture", cult.capitalNourrParHabMonde],
    ["Tourisme", cult.capitalTourismeParHabMonde],
    ["Or", cult.capitalOrParHabMonde]
  ];
  const nbVillesPerso = p.villes.filter((v) => v.culture === p.culture).length;
  const nbVillesMonde = nbVillesCultureMonde(state, p.culture);
  const out = [];
  for (const [res, parVille] of lois) {
    if (!parVille) continue;
    out.push({ res, parVille, nbVillesMonde, nbVillesPerso, total: parVille * nbVillesMonde });
  }
  return out;
}
function effetsCulturePays(state, p, C) {
  const out = {};
  if (p.villes.length === 0) return out;
  for (const d of detailCulturePays(state, p, C)) {
    out[d.res] = (out[d.res] ?? 0) + d.total;
  }
  return out;
}
function tourismeCourant(state, p, C) {
  let total = 0;
  total += p.resources["Tourisme"]?.prod ?? 0;
  for (const v of p.villes) {
    const d = detailGainsVille(state, p, v, C);
    total += (d.taxes["Tourisme"] ?? 0) * C.p.gainsCrediteStock;
  }
  total += effetsCulturePays(state, p, C)["Tourisme"] ?? 0;
  total += fluxProgresJoueur(state, p, C)["Tourisme"] ?? 0;
  total += effetsFaction(state, p, C)["Tourisme"] ?? 0;
  const portefeuilles = portefeuillesDuJoueur(state, p);
  total += 2 * portefeuilles.filter((m) => m === "Ma\xEEtre de cour").length;
  total += 20 * portefeuilles.filter((m) => m === "L\xE9gat du pontificat").length;
  for (const v of p.villes) {
    for (const b of v.batiments) total += tourismeStatiqueBatiment(b, C);
    for (const a of v.amenagements ?? []) total += tourismeStatiqueBatiment(a, C);
  }
  return total;
}
function resynchroniserTourisme(state, p, contexte, C = cfgOf(state.config)) {
  const rs = p.resources["Tourisme"];
  if (!rs) return;
  const cible = Math.max(0, tourismeCourant(state, p, C));
  if (rs.stock === cible) return;
  rs.stock = cible;
  state.log.push({
    turn: state.turn,
    type: "Syst\xE8me",
    joueur: p.n,
    texte: `\u{1F309} Tourisme recalcul\xE9 (${contexte}) : stock = production courante = ${Math.round(cible * 10) / 10}.`
  });
}
function appliquerEffetsRegimesCultures(state, p, saison, C = cfgOf(state.config)) {
  const out = {};
  for (const [res, v] of Object.entries(effetsRegime(p, saison, C))) {
    out[res] = (out[res] ?? 0) + v;
  }
  for (const [res, v] of Object.entries(effetsCulturePays(state, p, C))) {
    out[res] = (out[res] ?? 0) + v;
  }
  for (const [res, v] of Object.entries(out)) {
    const rs = p.resources[res];
    if (rs) rs.stock += v;
  }
  if (Object.keys(out).length > 0) {
    const parts = Object.entries(out).map(([r, v]) => `${v > 0 ? "+" : ""}${v} ${r}`).join(", ");
    state.log.push({
      turn: state.turn + 1,
      type: "Syst\xE8me",
      joueur: p.n,
      texte: `\u{1F3DB} ${p.nom} \u2014 loi du r\xE9gime \xAB ${p.regime} \xBB et r\xE8gle de pays de la culture \xAB ${p.culture} \xBB : ${parts}.`
    });
  }
  return out;
}

// src/engine/progresAuto.ts
var rangNiveauVille = rangNiveau;
function aTech(p, nomTech, C) {
  const set = new Set(p.progresDebloques ?? []);
  for (let i = 0; i < C.config.progres.length; i++) {
    const a = C.config.progres[i];
    const slots = ["a1", "a2", "b1", "b2", "c"];
    for (const slot of slots) {
      const t = slot === "c" ? a.techC : (slot[0] === "a" ? a.brancheA : a.brancheB)[+slot[1] - 1];
      if (t?.nom === nomTech && set.has(`${i}:${slot}`)) return true;
    }
  }
  return false;
}
function fluxProgresJoueur(state, p, C) {
  const out = {};
  const cap = capitaleDe(p);
  const add = (res, v) => {
    out[res] = (out[res] ?? 0) + v;
  };
  if (cap) {
    if (aTech(p, "Comprendre la soie", C)) add("Science", 1);
    if (aTech(p, "Technologies futures I", C)) add("Science", 3);
    if (aTech(p, "Etude astronomique", C)) add("Science", 1);
    if (aTech(p, "Lumi\xE8re", C)) add("Science", 1);
    if (aTech(p, "D\xE9forestation", C)) add("Bois", 1);
    if (aTech(p, "Carrieristes", C)) add("Pierre", 1);
    if (aTech(p, "Organisation fiscale", C)) add("Or", 2);
    if (aTech(p, "Granges", C)) add("Nourriture", 10);
    if (aTech(p, "Usinage", C)) add("Charbon", 1);
    if (aTech(p, "Mus\xE9es", C)) add("Tourisme", 30);
    if (aTech(p, "Hausse du loyer", C)) add("Or", 15);
    if (aTech(p, "Garde suzeraine", C) && citesSuzerainesCount(state, p) > 0) add("Nourriture", 12);
    if (aTech(p, "Patronage", C) && citesSuzerainesCount(state, p) > 0) add("Science", 1);
  }
  const nbVilles = p.villes.length;
  if (nbVilles > 0) {
    if (aTech(p, "Assembl\xE9es scientifiques", C)) add("Science", 1 * nbVilles);
    if (aTech(p, "Technologies futures II", C)) add("Science", 1 * nbVilles);
  }
  const nbCotes = p.villes.filter((v) => v.proximite === "Mer").length;
  if (nbCotes > 0) {
    if (aTech(p, "Cours de p\xEAche", C)) add("Nourriture", 4 * nbCotes);
    if (aTech(p, "Commerce maritime I", C)) add("Or", 2 * nbCotes);
    if (aTech(p, "P\xEAche de culture", C)) add("Nourriture", 3 * nbCotes);
  }
  if (aTech(p, "Surconsommation", C)) {
    let sci = 0, tour = 0;
    for (const v of p.villes) {
      const r = rangNiveauVille(v, C);
      sci += 1 * r;
      tour += 5 * r;
    }
    if (sci > 0) add("Science", sci);
    if (tour > 0) add("Tourisme", tour);
  }
  const nbChamps2 = p.villes.reduce((n, v) => n + (v.amenagements ?? []).filter((a) => a === "Champ" || a === "Rizi\xE8re").length, 0);
  if (nbChamps2 > 0) {
    if (aTech(p, "Engrais naturels I", C)) add("Nourriture", 2 * nbChamps2);
    if (aTech(p, "Engrais naturels II", C)) add("Nourriture", 3 * nbChamps2);
  }
  if (aTech(p, "Service militaire avanc\xE9", C)) {
    let bonusHab = 0;
    for (const v of p.villes) bonusHab += 0.5 * garnisonHabitationVille(p, v, C, state);
    if (bonusHab > 0) add("Habitants", bonusHab);
  }
  if (aTech(p, "Exploitation foresti\xE8re", C)) {
    const nbScieries = p.villes.reduce(
      (n, v) => n + (v.amenagements ?? []).filter((a) => a === "Scierie").length,
      0
    );
    if (nbScieries > 0) {
      add("Bois", -1 * nbScieries);
      add("Charbon", 1 * nbScieries);
    }
  }
  if (aTech(p, "Industrialisation", C)) {
    const nbBat = p.villes.reduce((n, v) => n + v.batiments.length, 0);
    if (nbBat > 0) add("Charbon", nbBat);
  }
  if (aTech(p, "Merveilles naturelles", C)) {
    let nbMervNat = 0;
    for (const v of p.villes) nbMervNat += v.batiments.filter((b) => (C.config.constructions ?? []).find((c) => c.nom === b)?.famille === "Merveille").length;
    if (nbMervNat > 0) add("Tourisme", 10 * nbMervNat);
  }
  if (nbChamps2 > 0 && aTech(p, "Charues", C)) {
    add("Nourriture", 5 * nbChamps2);
    add("Or", 1 * nbChamps2);
  }
  const nbMerveilles = p.villes.reduce((n, v) => n + v.batiments.filter((b) => (C.config.constructions ?? []).find((c) => c.nom === b)?.famille === "Merveille").length, 0);
  if (nbMerveilles > 0 && aTech(p, "Merveilleux", C)) add("Science", 1 * nbMerveilles);
  const nbFoires = p.villes.reduce((n, v) => n + (v.amenagements ?? []).filter((a) => a === "Foire").length, 0);
  if (nbFoires > 0 && aTech(p, "Stands de goodies", C)) {
    add("Or", 2 * nbFoires);
    add("Tourisme", 2 * nbFoires);
  }
  if (nbFoires > 0 && aTech(p, "Fascination culturelle", C)) {
    add("Tourisme", 2 * nbFoires);
  }
  const nbSitesArcheo = p.villes.reduce(
    (n, v) => n + (v.amenagements ?? []).filter((a) => a === "site arch\xE9ologique" || a === "Site arch\xE9ologique").length,
    0
  );
  if (nbSitesArcheo > 0 && aTech(p, "Parcs naturels", C)) {
    add("Tourisme", 8 * nbSitesArcheo);
  }
  const vivants = (state.population[p.n] ?? []).filter((c) => c.statut !== "D\xE9c\xE9d\xE9");
  const nbTitre = (titre) => vivants.filter((c) => c.titre === titre).length;
  for (let i = 0; i < C.config.progres.length; i++) {
    const arbre = C.config.progres[i];
    const debloquees = new Set(p.progresDebloques ?? []);
    const techs = [
      ...arbre.brancheA ?? [],
      ...arbre.brancheB ?? [],
      ...arbre.techC ? [arbre.techC] : []
    ];
    techs.forEach((t, k) => {
      const nbA = (arbre.brancheA ?? []).length;
      const nbB = (arbre.brancheB ?? []).length;
      let slot = "";
      if (k < nbA) slot = `a${k + 1}`;
      else if (k < nbA + nbB) slot = `b${k - nbA + 1}`;
      else slot = "c";
      if (!slot || !debloquees.has(`${i}:${slot}`)) return;
      for (const e of t.effets ?? []) {
        if (e.type === "prodParTitre" && e.titre && e.montant && e.ressource) {
          const n = nbTitre(e.titre);
          if (n > 0) add(e.ressource, e.montant * n);
        }
      }
    });
  }
  return out;
}
function citesSuzerainesCount(state, p) {
  return (state.citesLibres ?? []).filter((c) => c.suzerain === p.n).length;
}
function reductionFondation(p, C, ville) {
  const out = {};
  if (aTech(p, "Colonialisme durable", C)) out["Bois"] = (out["Bois"] ?? 0) + 5;
  if (aTech(p, "Colonialisme \xE9conome", C)) out["Or"] = (out["Or"] ?? 0) + 20;
  if (ville?.proximite === "Mer" && aTech(p, "Expansion maritime", C)) {
    out["Bois"] = (out["Bois"] ?? 0) + 3;
    out["Pierre"] = (out["Pierre"] ?? 0) + 3;
  }
  return out;
}
function garnisonProgresVille(p, ville, C) {
  return lignesGarnisonProgresVille(p, ville, C).reduce((n, l) => n + l.valeur, 0);
}
function lignesGarnisonProgresVille(p, ville, C) {
  const cap = capitaleDe(p);
  const estCap = cap?.nom === ville.nom;
  const out = [];
  if (aTech(p, "Milices civiles I", C) && estCap) out.push({ label: "Milices civiles I (capitale)", valeur: 30 });
  if (aTech(p, "Fortifications solides", C)) out.push({ label: "Fortifications solides", valeur: 15 });
  if (aTech(p, "Milices civiles", C)) out.push({ label: "Milices civiles (toutes habitations)", valeur: 30 });
  if (aTech(p, "Muraille", C)) out.push({ label: "Muraille", valeur: 40 });
  if (aTech(p, "Progr\xE8s de la d\xE9fense nationale A1", C)) out.push({ label: "D\xE9fense nationale A1", valeur: 40 });
  if (aTech(p, "Milices civiles III", C)) out.push({ label: "Milices civiles III", valeur: 20 });
  if (aTech(p, "Milices civiles V", C)) out.push({ label: "Milices civiles V", valeur: 40 });
  if (aTech(p, "Pr\xE9 carr\xE9", C)) out.push({ label: "Pr\xE9 carr\xE9", valeur: 20 });
  if (aTech(p, "Vasselit\xE9", C) && p.vassalDe != null) out.push({ label: "Vasselit\xE9 (vassal)", valeur: 20 });
  return out;
}
function garnisonMinimaleProgres(p, C) {
  return aTech(p, "Combler les lacunes", C) ? 30 : 0;
}

// src/engine/armees.ts
function recruitForArmies(state, p, rng) {
  const C = cfgOf(state.config);
  const pop = state.population[p.n] ?? [];
  const recap = p.recap ?? emptyRecap();
  const cult = cultureDef(p.culture, C.config);
  for (const armee of p.armees) {
    armee.soldats = armee.soldats.filter((id) => {
      const s = pop.find((x) => x.id === id);
      return s && s.statut !== "D\xE9c\xE9d\xE9";
    });
    const cmd = armee.commandant ? pop.find((x) => x.id === armee.commandant) : void 0;
    let puissance = armee.soldats.length * C.p.puissanceSoldat;
    if (cmd && cmd.statut !== "D\xE9c\xE9d\xE9") {
      puissance += C.p.puissanceGeneral;
    } else if (armee.commandant) {
      armee.commandant = null;
      recap.commandantTombe = armee.nom;
      state.log.push({
        turn: state.turn + 1,
        type: "Arm\xE9e",
        joueur: p.n,
        texte: `${p.nom} : le commandant de l'arm\xE9e \xAB ${armee.nom} \xBB est tomb\xE9 \u2014 \xE0 remplacer !`
      });
    }
    while (puissance < armee.puissanceCible) {
      const candidats = pop.filter(
        (c) => c.statut !== "D\xE9c\xE9d\xE9" && c.age >= C.p.soldatAgeMin && c.age <= C.p.soldatAgeMax && !c.armee && (!c.titre || c.titre === C.p.titreChasseur) && martialiteOk(cult?.martialite, c.sexe)
      );
      if (candidats.length === 0) break;
      const s = rng.pick(candidats);
      s.titre = C.p.titreSoldat;
      s.armee = armee.nom;
      armee.soldats.push(s.id);
      puissance += C.p.puissanceSoldat;
      state.log.push({
        turn: state.turn + 1,
        type: "Arm\xE9e",
        joueur: p.n,
        texte: `${fullName(s)} rejoint l'arm\xE9e \xAB ${armee.nom} \xBB comme soldat.`
      });
    }
    armee.puissance = puissance;
  }
}
function martialiteOk(martialite, sexe) {
  if (!martialite || martialite === "Les deux") return true;
  if (martialite === "Masculine") return sexe === "M";
  if (martialite === "F\xE9minine") return sexe === "F";
  return true;
}
function recomputeArmy(state, p, armee) {
  const C = cfgOf(state.config);
  const pop = state.population[p.n] ?? [];
  const cmd = armee.commandant ? pop.find((x) => x.id === armee.commandant) : void 0;
  armee.puissance = armee.soldats.filter((id) => {
    const s = pop.find((x) => x.id === id);
    return s && s.statut !== "D\xE9c\xE9d\xE9";
  }).length * C.p.puissanceSoldat + (cmd && cmd.statut !== "D\xE9c\xE9d\xE9" ? C.p.puissanceGeneral : 0);
}

// src/engine/titres.ts
function maybeAssignProfesseurs(state, p, rng, recap) {
  const C = cfgOf(state.config);
  const pop = state.population[p.n] ?? [];
  for (const ville of p.villes) {
    const rank = schoolRankOf(ville.batiments, C.config);
    if (rank <= 0) continue;
    const vivants = pop.filter((c) => c.statut !== "D\xE9c\xE9d\xE9" && c.ville === ville.nom);
    let nbProfs = vivants.filter((c) => c.titre === C.p.titreProfesseur).length;
    if (nbProfs >= rank) continue;
    const chance = C.p.professeurBaseChance / Math.log(nbProfs + 2.72);
    if (!rng.chance(chance)) continue;
    const candidats = vivants.filter((c) => c.age >= C.p.adultAge && (!c.titre || c.titre === C.p.titreChasseur) && !(c.traits ?? []).includes(C.p.traitObstine));
    if (candidats.length === 0) continue;
    const elu = rng.pick(candidats);
    elu.titre = C.p.titreProfesseur;
    if (!elu.education) elu.education = rng.pick(C.educations);
    nbProfs++;
    bump(recap.titresAttribues, C.p.titreProfesseur);
    state.log.push({
      turn: state.turn + 1,
      type: "Titre",
      joueur: p.n,
      texte: `${fullName(elu)} est promu Professeur \xE0 ${ville.nom}.`
    });
  }
}
function gestionMariages(state, p, rng, recap) {
  const C = cfgOf(state.config);
  const pop = state.population[p.n] ?? [];
  const celib = pop.filter(
    (c) => c.statut !== "D\xE9c\xE9d\xE9" && !c.mariage && c.age >= C.p.adultAge
  );
  const mariesIds = /* @__PURE__ */ new Set();
  const marier = (a, b) => {
    invaliderIndexPopulation();
    a.mariage = fullName(b);
    b.mariage = fullName(a);
    mariesIds.add(b.id);
    const noble = isNobleDyn(a.dynastie, C) && isNobleDyn(b.dynastie, C);
    if (noble) bump(recap.mariagesNobles, formatDynastyPair(a.dynastie, b.dynastie));
    state.log.push({
      turn: state.turn + 1,
      type: "Mariage",
      joueur: p.n,
      texte: noble ? `Mariage noble : ${fullName(a)} (${a.dynastie}) \xE9pouse ${fullName(b)} (${b.dynastie}).` : `Mariage : ${fullName(a)} \xE9pouse ${fullName(b)}.`
    });
  };
  const tenter = (a, candidats) => {
    const dispo = candidats.filter((x) => !x.mariage && !mariesIds.has(x.id));
    if (dispo.length === 0) return false;
    const b = rng.pick(dispo);
    if (rng.chance(computeMarriageProbability(a, b, C))) marier(a, b);
    return true;
  };
  const femmes = rng.shuffle(celib.filter((c) => c.sexe === "F"));
  const hommes = celib.filter((c) => c.sexe === "M");
  for (const f of femmes) {
    if (f.mariage) continue;
    if (!tenter(f, hommes)) break;
  }
  if (cultureDef(p.culture, C.config)?.homoAutorisee) {
    for (const [sexeA, sexeB] of [["F", "F"], ["M", "M"]]) {
      const premiers = rng.shuffle(celib.filter((c) => c.sexe === sexeA));
      const seconds = celib.filter((c) => c.sexe === sexeB);
      for (const a of premiers) {
        if (a.mariage) continue;
        if (!tenter(a, seconds)) break;
      }
    }
  }
}
function formatDynastyPair(d1, d2) {
  return d1 <= d2 ? `${d1} & ${d2}` : `${d2} & ${d1}`;
}
function computeMarriageProbability(f, h, C = cfgOf()) {
  const nobleF = isNobleDyn(f.dynastie, C);
  const nobleH = isNobleDyn(h.dynastie, C);
  let score;
  if (!nobleF && !nobleH) score = C.p.mariageRoturiers;
  else if (nobleF && nobleH) score = C.p.mariageNobles;
  else score = C.p.mariageMesalliance;
  if (f.titre && f.titre !== C.p.titreChasseur) score += C.p.mariageBonusTitre;
  if (h.titre && h.titre !== C.p.titreChasseur) score += C.p.mariageBonusTitre;
  score += characterMarriageMod(f, C) + characterMarriageMod(h, C);
  if (f.culture && h.culture) {
    score += f.culture.toLowerCase() === h.culture.toLowerCase() ? C.p.mariageMemeCulture : C.p.mariageAutreCulture;
  }
  score -= Math.abs(f.age - h.age) * C.p.mariageParAnEcart;
  const batF = (f.traits ?? []).includes(C.p.traitBatard);
  const batH = (h.traits ?? []).includes(C.p.traitBatard);
  if (batF) score += C.p.mariageBatard;
  if (batH) score += C.p.mariageBatard;
  if (batF && batH) score += C.p.mariageDeuxBatards;
  if (batF && nobleF && nobleH) score += C.p.mariageBatard;
  if (batH && nobleH && nobleF) score += C.p.mariageBatard;
  return Math.min(C.p.mariagePlafond, Math.max(C.p.mariagePlancher, score));
}
function characterMarriageMod(c, C = cfgOf()) {
  let total = 0;
  for (const t of c.traits ?? []) {
    if (!t) continue;
    const td = traitDef(t, C.config);
    if (td) total += td.marriage_mod;
  }
  return Math.min(C.p.mariageTraitMax, Math.max(-C.p.mariageTraitMax, total));
}
function tryEducateMinor(state, p, c, rng, recap) {
  const C = cfgOf(state.config);
  if ((c.traits ?? []).includes(C.p.traitObstine)) return;
  const ville = p.villes.find((v) => v.nom === c.ville);
  if (!ville) return;
  const rank = schoolRankOf(ville.batiments, C.config);
  if (rank <= 0) return;
  const pop = state.population[p.n] ?? [];
  const profs = pop.filter((x) => x.statut !== "D\xE9c\xE9d\xE9" && x.ville === ville.nom && x.titre === C.p.titreProfesseur);
  if (profs.length === 0) return;
  const base = isNobleDyn(c.dynastie, C) ? C.p.chanceEducNoble : C.p.chanceEducRoturier;
  let chance = base * rank * (1 + C.p.profBonusEduc * (profs.length - 1));
  chance = Math.min(0.95, chance);
  if (!rng.chance(chance)) return;
  const edus = /* @__PURE__ */ new Set();
  for (const prof of profs) if (prof.education) edus.add(prof.education);
  if (edus.size === 0) return;
  c.education = rng.pick([...edus]);
  state.log.push({
    turn: state.turn + 1,
    type: "Syst\xE8me",
    joueur: p.n,
    texte: `${fullName(c)} (${c.age} ans) re\xE7oit une \xE9ducation ${c.education.toLowerCase()} \xE0 ${ville.nom}.`
  });
}
function assignAdultTitle(state, p, c, rng, recap) {
  const C = cfgOf(state.config);
  if ((c.traits ?? []).includes(C.p.traitBatard)) {
    c.titre = C.p.titreChasseur;
    bump(recap.titresAttribues, C.p.titreChasseur);
    return;
  }
  let titre = null;
  if (c.education) {
    const td = C.titres.find(
      (t) => t.attribution === "Education" && t.education === c.education
    );
    if (td && titreAllowedForCharacter(td.titre, c, p, C)) titre = td.titre;
  }
  if (!titre) titre = C.p.titreChasseur;
  c.titre = titre;
  bump(recap.titresAttribues, titre);
}
function titresAccessibles(state, p, C = cfgOf(state.config)) {
  const out = [C.p.titreChasseur, C.p.titreGouverneur];
  out.push(C.p.titreDirigeant, C.p.titreHeritierStr);
  out.push("Ministre");
  out.push("Marchand");
  const pop = state.population[p.n] ?? [];
  const educations = /* @__PURE__ */ new Set();
  for (const c of pop) {
    if (c.statut !== "D\xE9c\xE9d\xE9" && c.titre === C.p.titreProfesseur && c.education) {
      educations.add(c.education);
    }
  }
  for (const t of C.titres) {
    if (t.attribution === "Education" && t.education && educations.has(t.education)) {
      out.push(t.titre);
    }
  }
  return [...new Set(out)];
}
function titreAllowedForCharacter(titre, c, p, C = cfgOf()) {
  const td = titreDef(titre, C.config);
  if (!td) return false;
  if (td.nobleSeul && !isNobleDyn(c.dynastie, C)) return false;
  if (td.regleGenre === "Masculine" && c.sexe !== "M") return false;
  if (td.regleGenre === "F\xE9minine" && c.sexe !== "F") return false;
  if (td.regleGenre === "H\xE9r\xE9dit\xE9" || td.regleGenre === "Culture") {
    const cult = cultureDef(p.culture, C.config);
    if (cult) {
      if (cult.heredite === "Masculine" && c.sexe !== "M") return false;
      if (cult.heredite === "F\xE9minine" && c.sexe !== "F") return false;
    }
  }
  if (td.regleGenre === "Martialit\xE9") {
    const cult = cultureDef(p.culture, C.config);
    if (cult && !martialiteOk(cult.martialite, c.sexe)) return false;
  }
  return true;
}
function gouverneurDeVille(state, p, ville, C = cfgOf(state.config)) {
  return (state.population[p.n] ?? []).find(
    (c) => c.statut !== "D\xE9c\xE9d\xE9" && c.titre === C.p.titreGouverneur && c.ville === ville
  ) ?? null;
}
function designerGouverneurs(state, C = cfgOf(state.config)) {
  for (const p of state.players) {
    const pop = state.population[p.n] ?? [];
    for (const ville of p.villes) {
      if (gouverneurDeVille(state, p, ville.nom, C)) continue;
      const nobles = pop.filter(
        (c) => c.statut !== "D\xE9c\xE9d\xE9" && c.ville === ville.nom && isNobleDyn(c.dynastie, C) && c.titre !== C.p.titreDirigeant && c.titre !== C.p.titreHeritierStr
      );
      if (nobles.length === 0) continue;
      const elu = nobles.reduce((a, b) => b.age > a.age ? b : a);
      elu.titre = C.p.titreGouverneur;
      state.log.push({
        turn: state.turn + 1,
        type: "Titre",
        joueur: p.n,
        texte: `\u{1F3F0} ${ville.nom} n'a pas de ${C.p.titreGouverneur} \u2014 ${fullName(elu)}, noble le plus \xE2g\xE9 de la ville, prend automatiquement la charge (+10 % d'imp\xF4ts sur la ville).`
      });
    }
  }
}

// src/engine/economie.ts
function facteurTaxes(ville, C) {
  if (ville.taxes === "Faible") return C.p.taxOrFaibles;
  if (ville.taxes === "Forte") return C.p.taxOrHautes;
  return 1;
}
function calculerGainsPopulation(state, p, rng) {
  return gainsPopulationJoueur(state, p, cfgOf(state.config));
}
function gainsPopulationJoueur(state, p, C) {
  const totals = {};
  for (const ville of p.villes) {
    for (const [res, v] of Object.entries(gainsVilleBruts(state, p, ville, C))) {
      totals[res] = (totals[res] ?? 0) + v;
    }
  }
  return totals;
}
function gainsVilleBruts(state, p, ville, C) {
  const detail = detailGainsVille(state, p, ville, C);
  const out = {};
  for (const [res, v] of Object.entries(detail.net)) {
    if (v !== 0) out[res] = v;
  }
  return out;
}
function detailGainsVille(state, p, ville, C) {
  const pop = state.population[p.n] ?? [];
  const vivants = pop.filter((c) => c.statut !== "D\xE9c\xE9d\xE9" && c.ville === ville.nom);
  const titres = {};
  for (const c of vivants) {
    if (!c.titre) continue;
    const td = titreDef(c.titre, C.config);
    if (!td) continue;
    if (td.ressource1 && td.valeur1 !== 0) {
      titres[td.ressource1] = (titres[td.ressource1] ?? 0) + td.valeur1;
    }
    if (td.ressource2 && td.valeur2 !== 0) {
      titres[td.ressource2] = (titres[td.ressource2] ?? 0) + td.valeur2;
    }
  }
  const taxeMult = facteurTaxes(ville, C) * (aMinistre(state, p, "Grand Chambellan") ? 1.1 : 1) * (gouverneurDeVille(state, p, ville.nom, C) ? 1.1 : 1);
  const taxes = {};
  for (const [res, v] of Object.entries(titres)) {
    const tv = v * taxeMult;
    if (tv !== 0) taxes[res] = tv;
  }
  const conso = {};
  const consoNourr = C.p.consoNourrParHab * vivants.length;
  if (consoNourr !== 0) conso["Nourriture"] = -consoNourr;
  const net = {};
  for (const [res, v] of Object.entries(taxes)) net[res] = (net[res] ?? 0) + v;
  for (const [res, v] of Object.entries(conso)) net[res] = (net[res] ?? 0) + v;
  for (const k of Object.keys(net)) if (net[k] === 0) delete net[k];
  return { habitants: vivants.length, titres, taxeMult, taxes, conso, net };
}
function taxBirthFactor(ville, C = cfgOf()) {
  if (!ville) return 1;
  return ville.taxes === "Faible" ? C.p.taxNaissFaibles : ville.taxes === "Forte" ? C.p.taxNaissHautes : 1;
}
function nourritureBetail(p) {
  const betail = p.resources["B\xE9tail"]?.stock ?? 0;
  return Math.max(0, betail) * 4;
}
function impotPopulation(state, p, C) {
  const out = {};
  for (const [res, v] of Object.entries(gainsPopulationJoueur(state, p, C))) {
    const cv = v * C.p.gainsCrediteStock;
    if (cv !== 0) out[res] = cv;
  }
  return out;
}
function impotsVassaux(state, p, C) {
  const out = [];
  for (const v of state.players) {
    if (v.vassalDe !== p.n || p.vassalDe === v.n) continue;
    const gains = gainsPopulationJoueur(state, v, C);
    const part = (gains["Or"] ?? 0) * C.p.vassalPrelevement;
    if (part !== 0) out.push({ vassal: v.nom, montant: part });
  }
  return out;
}
var fmtImp = (v) => Math.round(v * 10) / 10;
function genererImpotPopulation(state, p, C, fois) {
  if (fois <= 0) return null;
  const impot = impotPopulation(state, p, C);
  if (Object.keys(impot).length === 0) {
    state.log.push({
      turn: state.turn,
      type: "Syst\xE8me",
      joueur: p.n,
      texte: `\u{1F4B0} Imp\xF4t de la population : rien \xE0 g\xE9n\xE9rer (aucun gain d'habitants pour ${p.nom}).`
    });
    return null;
  }
  const credite = {};
  for (const [res, v] of Object.entries(impot)) {
    const rs = p.resources[res];
    if (!rs) continue;
    const total = v * fois;
    rs.stock += total;
    credite[res] = total;
  }
  state.log.push({
    turn: state.turn,
    type: "Syst\xE8me",
    joueur: p.n,
    texte: `\u{1F4B0} Imp\xF4t de la population g\xE9n\xE9r\xE9 \xD7${fois} pour ${p.nom} : ` + Object.entries(credite).map(([r, v]) => `${fmtImp(v)} ${r}`).join(", ") + ` (imp\xF4t d'un tour \xD7 ${fois}).`
  });
  return credite;
}
function genererImpotVassaux(state, p, C, fois) {
  if (fois <= 0) return null;
  const parts = impotsVassaux(state, p, C);
  if (parts.length === 0) {
    state.log.push({
      turn: state.turn,
      type: "Syst\xE8me",
      joueur: p.n,
      texte: `\u{1F91D} Imp\xF4t des vassaux : rien \xE0 g\xE9n\xE9rer (aucun vassal de ${p.nom} ne reverse d'Or).`
    });
    return null;
  }
  const total = parts.reduce((s2, x) => s2 + x.montant, 0) * fois;
  const rs = p.resources["Or"];
  if (rs) rs.stock += total;
  state.log.push({
    turn: state.turn,
    type: "Syst\xE8me",
    joueur: p.n,
    texte: `\u{1F91D} Imp\xF4t des vassaux g\xE9n\xE9r\xE9 \xD7${fois} pour ${p.nom} : +${fmtImp(total)} Or (` + parts.map((x) => `${x.vassal} : ${fmtImp(x.montant)}`).join(", ") + ` par tour \xD7 ${fois}).`
  });
  return total;
}

// src/engine/amenagements.ts
function amenagementRef(nom, cfg) {
  return constructionRef(nom, cfg);
}
function amenagementsDefs(cfg) {
  return amenagementsRefs(cfg).map((ref2) => ({
    nom: ref2.nom,
    terrain: ref2.terrain ?? "\u2014",
    effet: ref2.description,
    effets: { ...effetsConstructionRef(ref2), ...effetsEteConstructionRef(ref2) },
    eteSeulement: eteSeulementRef(ref2)
  }));
}
var AMENAGEMENTS = amenagementsDefs();
var COUT_AMENAGEMENT_TEXTE = amenagementRef("Baleinier")?.cout ?? "8 Or + 3 Bois";
function amenagementDef(nom, cfg) {
  return amenagementsDefs(cfg).find((a) => a.nom === nom);
}
function aCampDeBatisseurs(p) {
  return p.villes.some((v) => v.batiments.includes("Camp de b\xE2tisseurs"));
}
function coutAmenagement(p, cfg, nom) {
  const ref2 = (nom ? amenagementRef(nom, cfg) : void 0) ?? amenagementRef("Baleinier", cfg);
  const base = ref2 ? coutConstructionRef(ref2) : { Or: 8, Bois: 3 };
  if (!aCampDeBatisseurs(p)) return { ...base };
  const reduc = reductionCampDeBatisseurs(cfg);
  const out = {};
  for (const [res, v] of Object.entries(base)) {
    out[res] = Math.max(0, v - (reduc[res] ?? 0));
  }
  return out;
}
function effetsTourAmenagement(nom, saison, cfg) {
  const ref2 = amenagementRef(nom, cfg);
  if (!ref2) return {};
  if (eteSeulementRef(ref2) && saison !== "\xC9t\xE9") return {};
  const out = { ...effetsConstructionRef(ref2) };
  if (saison === "\xC9t\xE9") {
    for (const [res, v] of Object.entries(effetsEteConstructionRef(ref2))) {
      out[res] = (out[res] ?? 0) + v;
    }
  }
  return out;
}
function effetsAmenagementsVille(ville, saison, cfg) {
  const out = {};
  for (const nom of ville.amenagements ?? []) {
    const ref2 = amenagementRef(nom, cfg);
    if (!ref2 || eteSeulementRef(ref2)) continue;
    for (const [res, v] of Object.entries(effetsConstructionRef(ref2))) {
      out[res] = (out[res] ?? 0) + v;
    }
  }
  return out;
}
function effetsNourrEteAmenagementsVille(ville, cfg) {
  const out = {};
  for (const nom of ville.amenagements ?? []) {
    const ref2 = amenagementRef(nom, cfg);
    if (!ref2) continue;
    for (const [res, v] of Object.entries(effetsEteConstructionRef(ref2))) {
      out[res] = (out[res] ?? 0) + v;
    }
  }
  return out;
}
function appliquerEffetsAmenagements(p, saison, cfg) {
  const out = {};
  for (const ville of p.villes) {
    for (const [res, v] of Object.entries(effetsAmenagementsVille(ville, saison, cfg))) {
      out[res] = (out[res] ?? 0) + v;
    }
  }
  for (const [res, v] of Object.entries(out)) {
    if (!v) continue;
    const rs = p.resources[res];
    if (rs) rs.stock += v;
  }
  return out;
}
function detailsAmenagementsJoueur(p, saison, cfg) {
  const lignes = /* @__PURE__ */ new Map();
  for (const ville of p.villes) {
    for (const nom of ville.amenagements ?? []) {
      let l = lignes.get(nom);
      if (!l) {
        const ref2 = amenagementRef(nom, cfg);
        l = {
          nom,
          terrain: ref2?.terrain ?? "\u2014",
          villes: [],
          effets: {},
          horsSaison: !!ref2 && eteSeulementRef(ref2) && saison !== "\xC9t\xE9",
          eteSeulement: !!ref2 && eteSeulementRef(ref2)
        };
        lignes.set(nom, l);
      }
      l.villes.push(ville.nom);
      for (const [res, v] of Object.entries(effetsTourAmenagement(nom, saison, cfg))) {
        l.effets[res] = (l.effets[res] ?? 0) + v;
      }
    }
  }
  return [...lignes.values()].sort((a, b) => a.nom.localeCompare(b.nom));
}

// src/engine/autres.ts
function effetAutreLigne(l) {
  return (l.nombre ?? 0) * (l.bonus ?? 0);
}
function estNourrEte(ressource) {
  return !!ressource && /^\s*nourr[a-z]*\s*[-–]?\s*été\s*$/i.test(ressource.trim().replace(/\s+/g, " ")) || !!ressource && /^nourriture\s*(d['’]?)?\s*été$/i.test(ressource.trim().replace(/\s+/g, " "));
}
function effetsAutresVille(ville) {
  const out = {};
  for (const l of ville.autres ?? []) {
    if (!l.ressource || estNourrEte(l.ressource)) continue;
    const v = effetAutreLigne(l);
    if (v !== 0) out[l.ressource] = (out[l.ressource] ?? 0) + v;
  }
  return out;
}
function effetsNourrEteAutresVille(ville) {
  const out = {};
  for (const l of ville.autres ?? []) {
    if (!l.ressource || !estNourrEte(l.ressource)) continue;
    const v = effetAutreLigne(l);
    if (v !== 0) out["Nourriture"] = (out["Nourriture"] ?? 0) + v;
  }
  return out;
}
function appliquerEffetsAutres(p) {
  const out = {};
  for (const ville of p.villes) {
    for (const [res, v] of Object.entries(effetsAutresVille(ville))) {
      out[res] = (out[res] ?? 0) + v;
    }
  }
  const nBetail = nourritureBetail(p);
  if (nBetail > 0) out["Nourriture"] = (out["Nourriture"] ?? 0) + nBetail;
  for (const [res, v] of Object.entries(out)) {
    if (!v) continue;
    const rs = p.resources[res];
    if (rs) rs.stock += v;
  }
  return out;
}
function detailsAutresJoueur(p) {
  const lignes = /* @__PURE__ */ new Map();
  for (const ville of p.villes) {
    for (const l of ville.autres ?? []) {
      if (!l.ressource) continue;
      const cle = `${l.ressource}|${l.source ?? ""}`;
      let li = lignes.get(cle);
      if (!li) {
        li = { ressource: l.ressource, source: l.source ?? "", villes: [], nombre: 0, bonus: 0, effets: 0 };
        lignes.set(cle, li);
      }
      li.villes.push(ville.nom);
      li.nombre += l.nombre ?? 0;
      li.bonus = l.bonus ?? 0;
      li.effets += effetAutreLigne(l);
    }
  }
  return [...lignes.values()].sort((a, b) => a.ressource.localeCompare(b.ressource) || a.source.localeCompare(b.source));
}

// src/engine/commerce.ts
var TITRE_MARCHAND = "Marchand";
function routesCommerce(state) {
  return state.routesCommerce ?? [];
}
function routesCommerceDe(state, joueur) {
  return routesCommerce(state).filter((r) => r.joueur === joueur);
}
function routesCommerceVers(state, joueur) {
  return routesCommerce(state).filter((r) => r.joueurCible === joueur);
}
function marchandsDe(state, joueur) {
  return (state.population[joueur] ?? []).filter((c) => c.statut !== "D\xE9c\xE9d\xE9" && c.titre === TITRE_MARCHAND);
}
function marchandDeRoute(state, route) {
  const c = (state.population[route.joueur] ?? []).find((x) => x.id === route.marchandId);
  if (!c || c.statut === "D\xE9c\xE9d\xE9" || c.titre !== TITRE_MARCHAND) return null;
  return c;
}
function ressourcesCopiables(nom, cfg) {
  const ref2 = amenagementRef(nom, cfg);
  if (!ref2) return [];
  const out = [];
  for (const [res, v] of Object.entries(effetsConstructionRef(ref2))) {
    if (v > 0) out.push({ ressource: res, valeur: v, ete: false });
  }
  for (const [res, v] of Object.entries(effetsEteConstructionRef(ref2))) {
    if (v > 0) out.push({ ressource: res, valeur: v, ete: true });
  }
  return out;
}
function amenagementsCopiables(ville, cfg) {
  const out = [];
  for (const nom of ville.amenagements ?? []) {
    if (!out.includes(nom) && ressourcesCopiables(nom, cfg).length > 0) out.push(nom);
  }
  return out;
}
function effetsRouteProprietaire(route, saison, C = cfgOf()) {
  const out = { Or: C.p.marchandOrTour };
  for (const cop of ressourcesCopiables(route.amenagement, C.config)) {
    if (cop.ete && saison !== "\xC9t\xE9") continue;
    out[cop.ressource] = (out[cop.ressource] ?? 0) + cop.valeur;
  }
  return out;
}
function effetsCommerceJoueur(state, p, saison, C = cfgOf(state.config)) {
  const out = {};
  for (const route of routesCommerce(state)) {
    if (route.joueur !== p.n && route.joueurCible !== p.n) continue;
    if (!marchandDeRoute(state, route)) continue;
    const src = route.joueur === p.n ? effetsRouteProprietaire(route, saison, C) : { Or: C.p.marchandOrTour };
    for (const [res, v] of Object.entries(src)) {
      out[res] = (out[res] ?? 0) + v;
    }
  }
  return out;
}
function detailCommerceJoueur(state, p, saison, C = cfgOf(state.config)) {
  const out = [];
  for (const route of routesCommerce(state)) {
    if (route.joueur !== p.n && route.joueurCible !== p.n) continue;
    const m = marchandDeRoute(state, route);
    if (!m) continue;
    const cible = state.players.find((q) => q.n === route.joueurCible);
    const proprietaire = state.players.find((q) => q.n === route.joueur);
    const nomVilleCible = `${route.villeCible} (${cible?.nom ?? "?"})`;
    if (route.joueur === p.n) {
      out.push({
        origine: `route de ${fullName(m)} : ${m.ville} \u2194 ${nomVilleCible} \u2014 copie de ${route.amenagement}`,
        effets: effetsRouteProprietaire(route, saison, C)
      });
    } else {
      out.push({
        origine: `route de ${fullName(m)} (${proprietaire?.nom ?? "?"}) vers ta ville ${nomVilleCible}`,
        effets: { Or: C.p.marchandOrTour }
      });
    }
  }
  return out;
}
function nettoyerRoutesCommerce(state) {
  const avant = routesCommerce(state);
  const mortes = avant.filter((r) => !marchandDeRoute(state, r));
  if (mortes.length === 0) return [];
  const ids = new Set(mortes.map((r) => r.id));
  state.routesCommerce = avant.filter((r) => !ids.has(r.id));
  for (const r of mortes) {
    state.log.push({
      turn: state.turn + 1,
      type: "Commerce",
      joueur: r.joueur,
      texte: `Route commerciale vers ${r.villeCible} ferm\xE9e : le marchand n'est plus en poste.`
    });
  }
  return mortes;
}
function appliquerEffetsCommerce(state, C = cfgOf(state.config)) {
  const out = {};
  for (const p of state.players) {
    const effets = effetsCommerceJoueur(state, p, state.saison, C);
    for (const [res, v] of Object.entries(effets)) {
      const rs = p.resources[res];
      if (rs) rs.stock += v;
    }
    out[p.n] = effets;
  }
  return out;
}
function peuplerMarchands(state, p) {
  const C = cfgOf(state.config);
  const pop = state.population[p.n] ?? [];
  const vivants = pop.filter((c) => c.statut !== "D\xE9c\xE9d\xE9");
  const routes = routesCommerceDe(state, p.n);
  for (const route of routes) {
    const m = vivants.find((c) => c.id === route.marchandId && c.titre === TITRE_MARCHAND);
    if (m) continue;
    const ancien = pop.find((c) => c.id === route.marchandId);
    const estCandidat = (c) => c.age >= C.p.adultAge && (!c.titre || c.titre === C.p.titreChasseur) && p.villes.some((v) => v.nom === c.ville);
    const poolVille = ancien?.ville ?? "";
    const elu = vivants.find((c) => estCandidat(c) && c.ville === poolVille) ?? vivants.find((c) => estCandidat(c));
    if (!elu) continue;
    elu.titre = TITRE_MARCHAND;
    route.marchandId = elu.id;
    state.log.push({
      turn: state.turn + 1,
      type: "Commerce",
      joueur: p.n,
      texte: `\u{1F6D2} ${fullName(elu)} est promu Marchand (reprend la route vers ${route.villeCible}).`
    });
  }
}
function maxMarchandsJoueur(p, C) {
  let max = C.p.maxMarchands;
  if (aTech(p, "Commerce", C)) max += 1;
  if (aTech(p, "Collecte d'imp\xF4ts", C)) max += 1;
  max += nbBatiments(p, "Plateforme commerciale");
  max += nbBatiments(p, "Guilde des marchands");
  max += nbBatiments(p, "Echoppe");
  return max;
}
function creerRouteCommerce(state, joueur, marchandId, joueurCible, villeCible, amenagement) {
  const C = cfgOf(state.config);
  const pj = state.players.find((q) => q.n === joueur);
  if (pj) {
    const nb = marchandsDe(state, joueur).length;
    const cap = maxMarchandsJoueur(pj, C);
    if (nb > cap) {
      state.log.push({
        turn: state.turn,
        type: "Commerce",
        joueur,
        texte: `\u{1F6D2} ${pj.nom} d\xE9passe son cap de routes commerciales (${nb} marchand(s) pour ${cap} disponibles).`
      });
    }
  }
  const popJoueur = state.population[joueur] ?? [];
  let m = marchandId ? popJoueur.find((c) => c.id === marchandId) : void 0;
  const invalide = !m || m.statut === "D\xE9c\xE9d\xE9" || m.titre !== TITRE_MARCHAND || routesCommerceDe(state, joueur).some((r) => r.marchandId === marchandId);
  if (invalide) {
    const roturier = popJoueur.find((c) => c.statut !== "D\xE9c\xE9d\xE9" && c.age >= C.p.adultAge && (!c.titre || c.titre === C.p.titreChasseur) && pj?.villes.some((v) => v.nom === c.ville));
    if (!roturier) {
      return "Aucun roturier disponible pour tenir la route (population adulte vide).";
    }
    roturier.titre = TITRE_MARCHAND;
    m = roturier;
    state.log.push({
      turn: state.turn,
      type: "Commerce",
      joueur,
      texte: `\u{1F6D2} ${fullName(roturier)} re\xE7oit le titre de Marchand pour tenir la nouvelle route.`
    });
  }
  if (joueurCible === joueur) return "La route doit viser la ville d'un autre joueur.";
  const cible = state.players.find((q) => q.n === joueurCible);
  const ville = cible?.villes.find((v) => v.nom === villeCible);
  if (!ville) return "Ville cibl\xE9e introuvable chez ce joueur.";
  if (!(ville.amenagements ?? []).includes(amenagement)) {
    return `${villeCible} ne poss\xE8de pas l'am\xE9nagement \xAB ${amenagement} \xBB.`;
  }
  const cops = ressourcesCopiables(amenagement, C.config);
  if (cops.length === 0) {
    return `\xAB ${amenagement} \xBB n'a aucune production copiable.`;
  }
  if (!m) return "Aucun personnage disponible pour tenir la route.";
  (state.routesCommerce ?? (state.routesCommerce = [])).push({
    id: `rc-${m.id}-${joueurCible}-${villeCible}`,
    joueur,
    marchandId: m.id,
    joueurCible,
    villeCible,
    amenagement
  });
  state.log.push({
    turn: state.turn,
    type: "Commerce",
    joueur,
    texte: `\u{1F6D2} ${fullName(m)} ouvre une route commerciale : ${m.ville} \u2194 ${villeCible} (${cible?.nom ?? "?"}) \u2014 +${C.p.marchandOrTour} Or / tour pour chaque joueur, copie de \xAB ${amenagement} \xBB (${cops.map((c) => `${c.valeur} ${c.ressource}${c.ete ? " (\xE9t\xE9)" : ""}`).join(", ")}).`
  });
  return null;
}
function changerCopieRoute(state, routeId, amenagement) {
  const C = cfgOf(state.config);
  const route = routesCommerce(state).find((r) => r.id === routeId);
  if (!route) return "Route introuvable.";
  const cible = state.players.find((q) => q.n === route.joueurCible);
  const ville = cible?.villes.find((v) => v.nom === route.villeCible);
  if (!ville) return "Ville cibl\xE9e introuvable chez ce joueur.";
  if (!(ville.amenagements ?? []).includes(amenagement)) {
    return `${route.villeCible} ne poss\xE8de pas l'am\xE9nagement \xAB ${amenagement} \xBB.`;
  }
  const cops = ressourcesCopiables(amenagement, C.config);
  if (cops.length === 0) {
    return `\xAB ${amenagement} \xBB n'a aucune production copiable.`;
  }
  route.amenagement = amenagement;
  const m = (state.population[route.joueur] ?? []).find((c) => c.id === route.marchandId);
  state.log.push({
    turn: state.turn,
    type: "Commerce",
    joueur: route.joueur,
    texte: `\u{1F6D2} Route de ${m ? fullName(m) : "marchand"} : copie d\xE9sormais \xAB ${amenagement} \xBB sur ${route.villeCible} (${cops.map((c) => `${c.valeur} ${c.ressource}${c.ete ? " (\xE9t\xE9)" : ""}`).join(", ")}).`
  });
  return null;
}
function supprimerRouteCommerce(state, routeId) {
  const routes = routesCommerce(state);
  const route = routes.find((r) => r.id === routeId);
  if (!route) return "Route introuvable.";
  state.routesCommerce = routes.filter((r) => r.id !== routeId);
  state.log.push({
    turn: state.turn,
    type: "Commerce",
    joueur: route.joueur,
    texte: `\u{1F6D2} Route commerciale vers ${route.villeCible} ferm\xE9e.`
  });
  return null;
}

// src/engine/citesLibres.ts
var MULT_NOURR_CHASSEUR_CITE = 1.1;
function citesLibresDe(state) {
  return state.citesLibres ?? [];
}
function garnisonCiteLibre(state, C) {
  let maxRang = 0;
  for (const p of state.players) maxRang = Math.max(maxRang, rangPaysNiveau(p, C));
  return 100 + 40 * maxRang;
}
function facteurTaxesCite(cite, C) {
  const t = cite.taxes ?? "Moyenne";
  if (t === "Faible") return C.p.taxOrFaibles;
  if (t === "Forte") return C.p.taxOrHautes;
  return 1;
}
function emissairesDe(cite, joueur) {
  return cite.emissaires?.[joueur] ?? 0;
}
function citesSuzerainesDe(state, p) {
  return citesLibresDe(state).filter((c) => c.suzerain === p.n);
}
function detailCiteLibre(cite, C) {
  const vivants = (cite.population ?? []).filter((c) => c.statut !== "D\xE9c\xE9d\xE9");
  const adultes = vivants.filter((c) => c.age >= C.p.adultAge).length;
  const enfants = vivants.length - adultes;
  const titres = {};
  let chasseurs = 0;
  for (const c of vivants) {
    if (!c.titre) continue;
    const td = titreDef(c.titre, C.config);
    if (!td) continue;
    const chass = c.titre === C.p.titreChasseur;
    if (chass) chasseurs++;
    if (td.ressource1 && td.valeur1 !== 0) {
      const v = chass && td.ressource1 === "Nourriture" ? td.valeur1 * MULT_NOURR_CHASSEUR_CITE : td.valeur1;
      titres[td.ressource1] = (titres[td.ressource1] ?? 0) + v;
    }
    if (td.ressource2 && td.valeur2 !== 0) {
      const v = chass && td.ressource2 === "Nourriture" ? td.valeur2 * MULT_NOURR_CHASSEUR_CITE : td.valeur2;
      titres[td.ressource2] = (titres[td.ressource2] ?? 0) + v;
    }
  }
  const taxeMult = facteurTaxesCite(cite, C);
  const taxes = {};
  for (const [res, v] of Object.entries(titres)) {
    const tv = v * taxeMult;
    if (tv !== 0) taxes[res] = tv;
  }
  const conso = {};
  const consoNourr = C.p.consoNourrParHab * vivants.length;
  if (consoNourr !== 0) conso["Nourriture"] = -consoNourr;
  const net = {};
  for (const [res, v] of Object.entries(taxes)) net[res] = (net[res] ?? 0) + v;
  for (const [res, v] of Object.entries(conso)) net[res] = (net[res] ?? 0) + v;
  for (const k of Object.keys(net)) if (net[k] === 0) delete net[k];
  const transfert = {};
  for (const [res, v] of Object.entries(net)) {
    if (v <= 0) continue;
    const t = v * C.p.gainsCrediteStock;
    if (t !== 0) transfert[res] = t;
  }
  return { habitants: vivants.length, adultes, enfants, chasseurs, titres, taxeMult, taxes, conso, net, transfert };
}
function taxesCitesLibresRecues(state, p, C) {
  const out = {};
  const boostChambellan = aMinistre(state, p, "Grand Chambellan") ? 1.1 : 1;
  for (const cite of citesSuzerainesDe(state, p)) {
    for (const [res, v] of Object.entries(detailCiteLibre(cite, C).transfert)) {
      out[res] = (out[res] ?? 0) + v * boostChambellan;
    }
  }
  return out;
}
function appliquerTaxesCitesLibres(state, C = cfgOf(state.config)) {
  const out = {};
  for (const cite of citesLibresDe(state)) {
    const n = cite.suzerain;
    if (n == null) continue;
    const suz = state.players.find((q) => q.n === n);
    if (!suz) continue;
    const d = detailCiteLibre(cite, C);
    const gains = out[suz.n] ?? (out[suz.n] = {});
    const parts = [];
    const boostChambellan = aMinistre(state, suz, "Grand Chambellan") ? 1.1 : 1;
    for (const [res, v] of Object.entries(d.transfert)) {
      if (v === 0) continue;
      const vv = v * boostChambellan;
      gains[res] = (gains[res] ?? 0) + vv;
      const rs = suz.resources[res];
      if (rs) rs.stock += vv;
      parts.push(`+${Math.round(vv * 10) / 10} ${res}`);
    }
    if (parts.length > 0) {
      state.log.push({
        turn: state.turn + 1,
        type: "Syst\xE8me",
        joueur: suz.n,
        texte: `\u{1F5FC} Cit\xE9s libres \u2014 ${suz.nom} re\xE7oit les taxes de ${cite.nom} (${d.habitants} hab. dont ${d.adultes} adulte(s) / ${d.enfants} enfant(s), ${d.chasseurs} chasseur(s) : Nourriture \xD71,1) : ${parts.join(", ")}.`
      });
    }
  }
  return out;
}
function ajouterHabitantsCiteLibre(state, cite, nb, C = cfgOf(state.config)) {
  return ajouterCiteLibre(state, cite, nb, false, C);
}
function ajouterFamilleNobleCiteLibre(state, cite, nb, C = cfgOf(state.config)) {
  return ajouterCiteLibre(state, cite, nb, true, C);
}
function ajouterCiteLibre(state, cite, nb, noble, C) {
  if (nb <= 0) return 0;
  const rng = makeRng(state.rngState);
  const pop = cite.population ?? (cite.population = []);
  const peuple = C.peuples.length > 0 ? peupleDef(rng.pick(C.peuples), C.config) : void 0;
  const banque = peuple ?? C.banquesNoms[0];
  const culture = cite.culture || C.config.cultures[0]?.nom || "";
  let dynNoble = "";
  if (noble) {
    const utilisees = new Set(pop.map((c) => c.dynastie));
    const dispo = banque.noms.filter((n) => !utilisees.has(n));
    dynNoble = dispo.length > 0 ? rng.pick(dispo) : `${rng.pick(banque.noms)} ${pop.length + 1}`;
  }
  let ajoutes = 0;
  for (let i = 0; i < nb; i++) {
    const sexe = rng.pickWeighted(C.genres, (g) => g.poids).nom === "Masculin" ? "M" : "F";
    const traits = ["", "", ""];
    const draw = (exclus) => {
      const pool = C.traits.filter((td) => td.weight > 0 && !exclus.includes(td.name));
      return pool.length === 0 ? "" : rng.pickWeighted(pool, (td) => td.weight).name;
    };
    traits[0] = draw([]);
    if (traits[0]) traits[1] = rng.chance(0.5) ? draw([traits[0]]) : "";
    if (traits[1] && rng.chance(0.3)) traits[2] = draw([traits[0], traits[1]]);
    const ageTiree = rng.int(0, Math.max(1, Math.round(C.p.setupAgeMax)));
    const c = {
      id: `cl_${cite.nom}_${state.turn}_${pop.length + 1}_${i}`,
      nom: noble ? dynNoble : rng.pick(banque.noms),
      prenom: sexe === "M" ? rng.pick(banque.prenomsM) : rng.pick(banque.prenomsF),
      dynastie: noble ? dynNoble : C.p.dynastieRoturier,
      sexe,
      // Pyramide d'âges réaliste (revue 2026-10-16) : comme la
      //  population d'un joueur au setup — certains habitants sont
      //  des ENFANTS (0..adultAge) sans titre (ils ne produisent pas
      //  mais consomment), les adultes reçoivent le titre Chasseur.
      age: ageTiree,
      culture,
      ville: cite.nom,
      orientation: rng.pickWeighted(C.orientations, (o) => o.poids).nom,
      traits,
      statut: "Sain",
      mariage: null,
      mere: null,
      pere: null,
      pereBio: null,
      enfantBatard: false,
      titre: ageTiree >= C.p.adultAge ? C.p.titreChasseur : null,
      education: null,
      fecondite: 0,
      ageMax: 0,
      armee: null
    };
    c.ageMax = computeAgeMax(c, rng, C);
    pop.push(c);
    ajoutes++;
  }
  state.rngState = rng.state();
  state.log.push({
    turn: state.turn,
    type: "Syst\xE8me",
    joueur: null,
    texte: `\u{1F465} ${ajoutes} habitant(s) ajout\xE9(s) \xE0 la cit\xE9 libre ${cite.nom} \u2014 ${noble ? `nouvelle famille noble \xAB ${dynNoble} \xBB` : "roturiers"}.`
  });
  return ajoutes;
}
function titresAccessiblesCite(state, cite, C = cfgOf(state.config)) {
  const out = [C.p.titreChasseur, C.p.titreGouverneur];
  const pop = cite.population ?? [];
  const educations = /* @__PURE__ */ new Set();
  for (const c of pop) {
    if (c.statut !== "D\xE9c\xE9d\xE9" && c.titre === C.p.titreProfesseur && c.education) {
      educations.add(c.education);
    }
  }
  for (const t of C.titres) {
    if (t.attribution === "Education" && t.education && educations.has(t.education)) {
      out.push(t.titre);
    }
  }
  return [...new Set(out)];
}
function pseudoJoueurDeCite(cite) {
  return {
    n: -1,
    nom: cite.nom,
    peuple: "",
    culture: cite.culture ?? "",
    regime: "",
    resources: {},
    villes: [],
    dynastie: null,
    armees: [],
    recap: null
  };
}
function taxesCite(cite) {
  return cite.taxes ?? "Moyenne";
}
function villeDevientCiteLibre(state, p, idx) {
  const ville = p.villes[idx];
  if (!ville) return null;
  resynchroniserTourisme(state, p, `ville \xAB ${ville.nom} \xBB devenue cit\xE9 libre`);
  const nom = ville.nom;
  const cites = state.citesLibres ?? (state.citesLibres = []);
  let nomFinal = nom;
  let n = 1;
  while (cites.some((c) => c.nom === nomFinal)) nomFinal = `${nom} ${++n}`;
  const pop = state.population[p.n] ?? [];
  const partants = pop.filter((c) => c.ville === nom);
  const restants = pop.filter((c) => c.ville !== nom);
  state.population[p.n] = restants;
  for (const c of restants) {
    if (isNobleDyn(c.dynastie, cfgOf(state.config)) && c.ville === nom) {
      c.ville = p.villes.find((v) => v.nom !== nom)?.nom ?? c.ville;
    }
  }
  p.villes.splice(idx, 1);
  cites.push({
    nom: nomFinal,
    type: (ville.type ?? "Ville") === "Ch\xE2teau" ? "Militaires - Ch\xE2teau" : "Industrielles - Ville",
    culture: ville.culture,
    taxes: ville.taxes,
    habitation: (ville.type ?? "Ville") === "Ch\xE2teau" ? "Ch\xE2teau" : "Hameau",
    suzerain: null,
    emissaires: {},
    population: partants
  });
  const cite = cites[cites.length - 1];
  const e = cite.emissaires ?? (cite.emissaires = {});
  e[p.n] = (e[p.n] ?? 0) + 1;
  state.log.push({
    turn: state.turn,
    type: "Syst\xE8me",
    joueur: p.n,
    texte: `\u{1F3FC} ${nomFinal} n'est plus une ville de ${p.nom} \u2014 elle devient une CIT\xC9 LIBRE. ${p.nom} re\xE7oit 1 \xE9missaire plac\xE9 dans cette cit\xE9.`
  });
  return nomFinal;
}
function citeLibreDevientVille(state, nomCite, acquereur) {
  const cites = state.citesLibres ?? [];
  const i = cites.findIndex((c) => c.nom === nomCite);
  if (i < 0) return null;
  const cite = cites[i];
  for (const [nStr, nb] of Object.entries(cite.emissaires ?? {})) {
    const q = state.players.find((x) => x.n === Number(nStr));
    if (q) q.emissaires = (q.emissaires ?? 0) + nb;
  }
  let nomFinal = cite.nom;
  let n = 1;
  while (acquereur.villes.some((v) => v.nom === nomFinal)) nomFinal = `${cite.nom} ${++n}`;
  const pop = state.population[acquereur.n] ?? (state.population[acquereur.n] = []);
  for (const c of cite.population ?? []) {
    c.ville = nomFinal;
    pop.push(c);
  }
  cites.splice(i, 1);
  acquereur.villes.push({
    nom: nomFinal,
    culture: cite.culture ?? acquereur.culture,
    taxes: cite.taxes ?? "Moyenne",
    type: cite.habitation === "Ch\xE2teau" ? "Ch\xE2teau" : "Ville",
    rang: cite.habitation === "Ch\xE2teau" ? "Motte" : "Hameau",
    batiments: [],
    amenagements: [],
    autres: []
  });
  state.log.push({
    turn: state.turn,
    type: "Syst\xE8me",
    joueur: acquereur.n,
    texte: `\u{1F3FC} La cit\xE9 libre ${cite.nom} devient la ville \xAB ${nomFinal} \xBB de ${acquereur.nom} \u2014 ses habitants lui appartiennent d\xE9sormais ; les \xE9missaires plac\xE9s sont restitu\xE9s \xE0 leurs r\xE9serves.`
  });
  return nomFinal;
}

// src/engine/vassalite.ts
function transfererTributVassal(state, gainsParJoueur, C) {
  for (const p of state.players) {
    if (p.vassalDe == null) continue;
    const suzerain = state.players.find((x) => x.n === p.vassalDe);
    if (!suzerain || suzerain.vassalDe === p.n) continue;
    const gains = gainsParJoueur[p.n] ?? {};
    const part = (gains["Or"] ?? 0) * C.p.vassalPrelevement;
    if (part === 0) continue;
    gains["Or"] = (gains["Or"] ?? 0) - part;
    const gainsSuz = gainsParJoueur[suzerain.n] ?? (gainsParJoueur[suzerain.n] = {});
    gainsSuz["Or"] = (gainsSuz["Or"] ?? 0) + part;
    state.log.push({
      turn: state.turn + 1,
      type: "Syst\xE8me",
      joueur: p.n,
      texte: `\u{1F91D} Vassalit\xE9 \u2014 ${p.nom} verse ${Math.round(part * 10) / 10} Or \xE0 ${suzerain.nom} (tribut de vassalit\xE9 : ${Math.round(C.p.vassalPrelevement * 100)} % des revenus de ses habitants).`
    });
  }
}

// src/engine/villes.ts
function normaliserEtat(state) {
  if (!Array.isArray(state.history)) state.history = [];
  if (!Array.isArray(state.log)) state.log = [];
  if (!Array.isArray(state.routesCommerce)) state.routesCommerce = [];
  if (!Array.isArray(state.citesLibres)) state.citesLibres = [];
  if (!state.population || typeof state.population !== "object") state.population = {};
  for (const p of state.players ?? []) {
    for (const v of p.villes ?? []) {
      if (!Array.isArray(v.batiments)) v.batiments = [];
      if (!Array.isArray(v.amenagements)) v.amenagements = [];
      if (!Array.isArray(v.autres)) v.autres = [];
    }
  }
}
function supprimerVille(state, p, idx) {
  const ville = p.villes[idx];
  if (!ville) return null;
  resynchroniserTourisme(state, p, `ville \xAB ${ville.nom} \xBB supprim\xE9e`);
  p.villes.splice(idx, 1);
  state.log.push({
    turn: state.turn,
    type: "Syst\xE8me",
    joueur: p.n,
    texte: `\u{1F5D1} ${ville.nom} n'est plus une ville de ${p.nom} (supprim\xE9e) \u2014 ses habitants restent inscrits dans sa population.`
  });
  return ville.nom;
}
function transfererVille(state, p, idx, cible) {
  const C = cfgOf(state.config);
  const ville = p.villes[idx];
  if (!ville || cible.n === p.n) return false;
  resynchroniserTourisme(state, p, `ville \xAB ${ville.nom} \xBB transf\xE9r\xE9e \xE0 ${cible.nom}`);
  resynchroniserTourisme(state, cible, `ville \xAB ${ville.nom} \xBB re\xE7ue de ${p.nom}`);
  p.villes.splice(idx, 1);
  cible.villes.push(ville);
  for (const b of [...ville.batiments ?? [], ...ville.amenagements ?? []]) {
    const tour = tourismeStatiqueBatiment(b, C);
    const rs = cible.resources["Tourisme"];
    if (tour > 0 && rs) rs.stock += tour;
  }
  const ancienNom = ville.nom;
  const popSrc = state.population[p.n] ?? [];
  const restants = [];
  const deplaces = [];
  const courRestee = [];
  for (const c of popSrc) {
    if (c.ville !== ancienNom) restants.push(c);
    else if (isNobleDyn(c.dynastie, C)) {
      courRestee.push(c);
      restants.push(c);
    } else deplaces.push(c);
  }
  let renommee = "";
  if (cible.villes.some((v) => v !== ville && v.nom === ancienNom)) {
    let i = 2;
    while (cible.villes.some((v) => v.nom === `${ancienNom} ${i}`)) i++;
    renommee = `${ancienNom} ${i}`;
    ville.nom = renommee;
    for (const c of deplaces) c.ville = renommee;
  }
  const refuge = p.villes[0]?.nom;
  if (refuge) for (const c of courRestee) c.ville = refuge;
  state.population[p.n] = restants;
  state.population[cible.n] = [...state.population[cible.n] ?? [], ...deplaces];
  state.log.push({
    turn: state.turn,
    type: "Syst\xE8me",
    joueur: cible.n,
    texte: `\u{1F5DD} ${ancienNom}${renommee ? ` (renomm\xE9e \xAB ${renommee} \xBB)` : ""} passe de ${p.nom} \xE0 ${cible.nom}${deplaces.length ? `, avec ses ${deplaces.length} habitant(s) (production des titres recalcul\xE9e pour ${cible.nom})` : ""}${courRestee.length ? ` \u2014 la cour de ${p.nom} (${courRestee.length} noble(s)) reste aupr\xE8s de lui` : ""}.`
  });
  return true;
}
function rejouerTransfertVille(state, payload) {
  const src = state.players.find((q) => q.n === payload.src);
  const dst = state.players.find((q) => q.n === payload.dst);
  if (!src || !dst) return false;
  const idx = src.villes.findIndex((v) => v.nom === payload.ville);
  if (idx < 0) {
    return false;
  }
  return transfererVille(state, src, idx, dst);
}
function bonusProximite(ville, C) {
  if (ville.proximite === "Rivi\xE8re") return C.p.proxRiviereNourriture;
  if (ville.proximite === "Mer") return C.p.proxMerNourriture;
  return 0;
}
function appliquerBonusProximite(state, C = cfgOf(state.config)) {
  const out = {};
  for (const p of state.players) {
    const gains = {};
    for (const v of p.villes) {
      const b = bonusProximite(v, C);
      if (b !== 0) gains["Nourriture"] = (gains["Nourriture"] ?? 0) + b;
    }
    for (const [res, v] of Object.entries(gains)) {
      const rs = p.resources[res];
      if (rs) rs.stock += v;
    }
    if (Object.keys(gains).length > 0) out[p.n] = gains;
  }
  return out;
}

// src/engine/production.ts
function gainsBruts(state, p) {
  return calculerGainsPopulation(state, p, makeRng(1));
}
function productionDetaillee(state, p, C) {
  const saison = state.saison;
  const coefGains = C.p.gainsCrediteStock;
  const prelevement = C.p.vassalPrelevement;
  const base = {};
  for (const [res, rs] of Object.entries(p.resources)) {
    if (rs.prod !== 0) base[res] = rs.prod;
  }
  const habitants = {};
  for (const [res, v] of Object.entries(gainsBruts(state, p))) {
    if (v !== 0) habitants[res] = v * coefGains;
  }
  const batiments = {};
  const amenagements = {};
  const autres = {};
  for (const ville of p.villes) {
    for (const [res, v] of Object.entries(effetsBatimentsVille(ville, C))) {
      batiments[res] = (batiments[res] ?? 0) + v;
    }
    for (const [res, v] of Object.entries(effetsAmenagementsVille(ville, saison, C.config))) {
      amenagements[res] = (amenagements[res] ?? 0) + v;
    }
    for (const [res, v] of Object.entries(effetsAutresVille(ville))) {
      autres[res] = (autres[res] ?? 0) + v;
    }
  }
  const nourrEte = {};
  if (saison === "\xC9t\xE9") {
    for (const ville of p.villes) {
      for (const [res, v] of Object.entries(effetsNourrEteAmenagementsVille(ville, C.config))) {
        nourrEte[res] = (nourrEte[res] ?? 0) + v;
      }
      for (const [res, v] of Object.entries(effetsNourrEteAutresVille(ville))) {
        nourrEte[res] = (nourrEte[res] ?? 0) + v;
      }
    }
  }
  const regimesCultures = {};
  for (const [res, v] of Object.entries(effetsRegime(p, saison, C))) {
    regimesCultures[res] = (regimesCultures[res] ?? 0) + v;
  }
  for (const [res, v] of Object.entries(effetsCulturePays(state, p, C))) {
    regimesCultures[res] = (regimesCultures[res] ?? 0) + v;
  }
  const vassalite = {};
  if (p.vassalDe != null) {
    const part = (gainsBruts(state, p)["Or"] ?? 0) * prelevement * coefGains;
    if (part !== 0) vassalite["Or"] = (vassalite["Or"] ?? 0) - part;
  }
  for (const q of state.players) {
    if (q.vassalDe !== p.n) continue;
    const part = (gainsBruts(state, q)["Or"] ?? 0) * prelevement * coefGains;
    if (part !== 0) vassalite["Or"] = (vassalite["Or"] ?? 0) + part;
  }
  const habitations = {};
  for (const [res, v] of Object.entries(consommationsPays(p, C, state))) {
    if (v !== 0) habitations[res] = (habitations[res] ?? 0) + v;
  }
  const faction = {};
  for (const [res, v] of Object.entries(effetsFaction(state, p, C))) {
    if (v !== 0) faction[res] = v;
  }
  const citesLibres = {};
  for (const cite of citesLibresDe(state)) {
    if (cite.suzerain !== p.n) continue;
    for (const [res, v] of Object.entries(detailCiteLibre(cite, C).transfert)) {
      if (v !== 0) citesLibres[res] = (citesLibres[res] ?? 0) + v;
    }
  }
  const commerce = {};
  for (const [res, v] of Object.entries(effetsCommerceJoueur(state, p, saison, C))) {
    if (v !== 0) commerce[res] = v;
  }
  const proximite = {};
  for (const ville of p.villes) {
    const b = bonusProximite(ville, C);
    if (b !== 0) proximite["Nourriture"] = (proximite["Nourriture"] ?? 0) + b;
  }
  const progres = {};
  for (const [res, v] of Object.entries(fluxProgresJoueur(state, p, C))) {
    if (v !== 0) progres[res] = v;
  }
  const ministeres = {};
  for (const m of portefeuillesDuJoueur(state, p)) {
    if (m === "Tr\xE9sorier") ministeres["Or"] = (ministeres["Or"] ?? 0) + 5;
    else if (m === "Grand Pr\xE9cepteur") ministeres["Science"] = (ministeres["Science"] ?? 0) + 1;
    else if (m === "Grand pr\xE9v\xF4t") ministeres["Fer"] = (ministeres["Fer"] ?? 0) + 1;
  }
  const armees = {};
  const total = {};
  for (const canal of [base, habitants, batiments, amenagements, nourrEte, autres, regimesCultures, habitations, faction, citesLibres, commerce, proximite, vassalite, ministeres, progres, armees]) {
    for (const [res, v] of Object.entries(canal)) {
      total[res] = (total[res] ?? 0) + v;
    }
  }
  return { base, habitants, batiments, amenagements, nourrEte, autres, regimesCultures, habitations, faction, citesLibres, commerce, proximite, vassalite, ministeres, progres, armees, total };
}
function productionVille(state, p, ville, C) {
  const saison = state.saison;
  const coef = C.p.gainsCrediteStock;
  const batiments = effetsBatimentsVille(ville, C);
  const amenagements = effetsAmenagementsVille(ville, saison, C.config);
  const nourrEte = {};
  if (saison === "\xC9t\xE9") {
    for (const src of [effetsNourrEteAmenagementsVille(ville, C.config), effetsNourrEteAutresVille(ville)]) {
      for (const [res, v] of Object.entries(src)) {
        nourrEte[res] = (nourrEte[res] ?? 0) + v;
      }
    }
  }
  const autres = effetsAutresVille(ville);
  const habitants = {};
  for (const [res, v] of Object.entries(detailGainsVille(state, p, ville, C).net)) {
    if (v !== 0) habitants[res] = v * coef;
  }
  const consoVille = consommationsVille(ville, C);
  const total = {};
  for (const canal of [batiments, amenagements, nourrEte, autres, habitants, consoVille]) {
    for (const [res, v] of Object.entries(canal)) {
      total[res] = (total[res] ?? 0) + v;
    }
  }
  return { batiments, amenagements, nourrEte, autres, habitants, consoVille, total };
}
function attraitTouristiqueVille(state, p, ville, C = cfgOf(state.config)) {
  const statique = [...ville.batiments ?? [], ...ville.amenagements ?? []].reduce(
    (somme, b) => somme + tourismeStatiqueBatiment(b, C),
    0
  );
  const flux = Math.max(0, productionVille(state, p, ville, C).total["Tourisme"] ?? 0);
  return statique + flux;
}
function attraitMaxMonde(state) {
  const C = cfgOf(state.config);
  let max = 0;
  for (const q of state.players) {
    for (const v of q.villes) {
      max = Math.max(max, attraitTouristiqueVille(state, q, v, C));
    }
  }
  return max;
}
function provenancesApports(state, p, C) {
  const saison = state.saison;
  const coef = C.p.gainsCrediteStock;
  const prelevement = C.p.vassalPrelevement;
  const out = {};
  const push = (res, canal, origine, valeur) => {
    if (valeur === 0) return;
    (out[res] ?? (out[res] = [])).push({ canal, origine, valeur });
  };
  for (const [res, rs] of Object.entries(p.resources)) {
    if (rs.prod !== 0) push(res, "Base", "production propre du pays", rs.prod);
  }
  for (const ville of p.villes) {
    const tg = detailGainsVille(state, p, ville, C);
    for (const [res, v] of Object.entries(tg.net)) {
      push(
        res,
        "Habitants",
        `villageois de ${ville.nom} (titres \xD7 taxes \u2014 ${tg.habitants} hab.)`,
        v * coef
      );
    }
  }
  for (const l of detailsBatimentsJoueur(p, C)) {
    for (const [res, v] of Object.entries(l.effets)) {
      push(
        res,
        "B\xE2timents",
        `${l.nom} (${l.villes.join(", ")})${l.remplacePar.length > 0 ? " \u2014 remplac\xE9" : ""}`,
        v
      );
    }
  }
  for (const l of detailsAmenagementsJoueur(p, saison, C.config)) {
    if (l.eteSeulement) continue;
    for (const [res, v] of Object.entries(l.effets)) {
      push(
        res,
        "Am\xE9nagements",
        `${l.nom} (${l.villes.join(", ")})`,
        v
      );
    }
  }
  if (saison === "\xC9t\xE9") {
    for (const l of detailsAmenagementsJoueur(p, saison, C.config)) {
      if (!l.eteSeulement) continue;
      for (const [res, v] of Object.entries(l.effets)) {
        push(
          res,
          "Nourr - \xE9t\xE9",
          `${l.nom} (${l.villes.join(", ")}) \u2014 nourriture d'\xE9t\xE9, cr\xE9dit\xE9e en \xE9t\xE9`,
          v
        );
      }
    }
    for (const l of detailsAutresJoueur(p)) {
      if (!estNourrEte(l.ressource)) continue;
      push(
        "Nourriture",
        "Nourr - \xE9t\xE9",
        `${l.source || "sans source"} (${l.villes.join(", ")}) : ${l.nombre} \xD7 ${l.bonus} \u2014 nourriture d'\xE9t\xE9`,
        l.effets
      );
    }
  }
  for (const l of detailsAutresJoueur(p)) {
    if (estNourrEte(l.ressource)) continue;
    push(
      l.ressource,
      "Autres",
      `${l.source || "sans source"} (${l.villes.join(", ")}) : ${l.nombre} \xD7 ${l.bonus}`,
      l.effets
    );
  }
  for (const [res, v] of Object.entries(effetsRegime(p, saison, C))) {
    push(res, "R\xE9gimes & cultures", `loi du r\xE9gime \xAB ${p.regime} \xBB`, v);
  }
  for (const d of detailCulturePays(state, p, C)) {
    push(
      d.res,
      "R\xE9gimes & cultures",
      `r\xE8gle de pays \xAB ${p.culture} \xBB : +${d.parVille} \xD7 ${d.nbVillesMonde} ville(s) de cette culture dans le monde (dont ${d.nbVillesPerso} chez toi)`,
      d.total
    );
  }
  for (const ville of p.villes) {
    for (const [res, v] of Object.entries(consommationsVille(ville, C))) {
      push(res, "Conso villes", `${ville.nom} (${nomRang(ville.rang ?? "")})`, v);
    }
  }
  for (const cite of citesLibresDe(state)) {
    if (cite.suzerain !== p.n) continue;
    const d = detailCiteLibre(cite, C);
    for (const [res, v] of Object.entries(d.transfert)) {
      push(
        res,
        "Cit\xE9s libres",
        `taxes de ${cite.nom} (${d.habitants} hab. dont ${d.adultes} adulte(s) / ${d.enfants} enfant(s), ${d.chasseurs} chasseur(s) : Nourriture \xD71,1)`,
        v
      );
    }
  }
  for (const d of detailCommerceJoueur(state, p, saison, C)) {
    for (const [res, v] of Object.entries(d.effets)) {
      push(res, "Commerce", d.origine, v);
    }
  }
  for (const ville of p.villes) {
    const b = bonusProximite(ville, C);
    if (b !== 0) push(
      "Nourriture",
      "Proximit\xE9",
      `${ville.nom} (${ville.proximite === "Mer" ? "bord de mer" : "bord de rivi\xE8re"})`,
      b
    );
  }
  if (p.vassalDe != null) {
    const suz = state.players.find((q) => q.n === p.vassalDe);
    const part = (gainsBruts(state, p)["Or"] ?? 0) * prelevement * coef;
    push("Or", "Vassalit\xE9", `tribut pay\xE9 \xE0 ${suz?.nom ?? "?"}`, -part);
  }
  for (const q of state.players) {
    if (q.vassalDe !== p.n) continue;
    const part = (gainsBruts(state, q)["Or"] ?? 0) * prelevement * coef;
    push("Or", "Vassalit\xE9", `tribut re\xE7u de ${q.nom}`, part);
  }
  return out;
}

// src/engine/culture.ts
function tourismeVilleDe(state, p, ville) {
  const C = cfgOf(state.config);
  let t = 0;
  for (const b of ville.batiments ?? []) t += tourismeStatiqueBatiment(b, C);
  for (const a of ville.amenagements ?? []) t += tourismeStatiqueBatiment(a, C);
  const d = detailGainsVille(state, p, ville, C);
  t += Math.max(0, (d.taxes["Tourisme"] ?? 0) * C.p.gainsCrediteStock);
  return t;
}
function tourismeVillesDe(state, p) {
  let t = 0;
  for (const v of p.villes) t += tourismeVilleDe(state, p, v);
  return t;
}
function applyCultureInfluence(state, p, rng, recap) {
  const C = cfgOf(state.config);
  const pop = state.population[p.n] ?? [];
  const pression = {};
  for (const cult of C.cultures) pression[cult.nom] = 1e-3;
  const generalParCulture = {};
  for (const other of state.players) {
    const tourTotal = other.resources["Tourisme"]?.stock ?? 0;
    const tourVilles = tourismeVillesDe(state, other);
    generalParCulture[other.culture] = (generalParCulture[other.culture] ?? 0) + tourTotal - tourVilles;
  }
  for (const other of state.players) {
    for (const v of other.villes) {
      const tv = tourismeVilleDe(state, other, v);
      if (tv > 0) pression[v.culture ?? other.culture] = (pression[v.culture ?? other.culture] ?? 0) + tv;
    }
  }
  for (const [cult, v] of Object.entries(generalParCulture)) {
    pression[cult] = (pression[cult] ?? 0) + Math.max(0, v);
  }
  for (const c of pop) {
    if (c.statut === "D\xE9c\xE9d\xE9" || c.titre === C.p.titreDirigeant) continue;
    if (!rng.chance(C.p.conversionProba)) continue;
    const poids = {};
    for (const [cult, w] of Object.entries(pression)) {
      let weight = w;
      if (cult === c.culture) weight *= C.p.conversionMemeCulture;
      const same = pop.filter((x) => x.statut !== "D\xE9c\xE9d\xE9" && x.ville === c.ville && x.culture === cult).length;
      weight += same * C.p.conversionPoidsLocal;
      poids[cult] = weight;
    }
    const entries = Object.entries(poids);
    const nouvelle = rng.pickWeighted(entries, (e) => e[1])[0];
    if (nouvelle !== c.culture) {
      c.culture = nouvelle;
      bump(recap.conversions, nouvelle);
      state.log.push({
        turn: state.turn + 1,
        type: "Culture",
        joueur: p.n,
        texte: `${fullName(c)} se convertit \xE0 la culture ${nouvelle}.`
      });
    }
  }
}
function updateCityCultures(state, p) {
  const pop = state.population[p.n] ?? [];
  for (const ville of p.villes) {
    const vivants = pop.filter((c) => c.statut !== "D\xE9c\xE9d\xE9" && c.ville === ville.nom);
    if (vivants.length === 0) continue;
    const counts = {};
    for (const c of vivants) counts[c.culture] = (counts[c.culture] ?? 0) + 1;
    const major = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    ville.culture = major;
  }
}

// src/engine/journal.ts
function snapshotRessources(state, turn, apportsParJoueur) {
  const C = cfgOf(state.config);
  for (const p of state.players) {
    const stocks = {};
    const prods = {};
    for (const r of C.ressources) {
      stocks[r] = p.resources[r]?.stock ?? 0;
      prods[r] = p.resources[r]?.prod ?? 0;
    }
    const apports = apportsParJoueur?.[p.n];
    state.history.push(apports ? { turn, joueur: p.n, stocks, prods, apports } : { turn, joueur: p.n, stocks, prods });
  }
  const maxH = C.p.maxHistory ?? 120;
  const total = state.history.length;
  if (total > maxH * Math.max(1, state.players.length)) {
    state.history = state.history.slice(total - maxH * Math.max(1, state.players.length));
  }
}
function writeRecap(state, p, recap) {
  const fmt = (dict) => Object.entries(dict).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} : ${v}`).join(", ") || "\u2014";
  const lignes = [
    `Conceptions \u2014 ${fmt(recap.conceptions)}`,
    `Naissances \u2014 ${fmt(recap.naissances)}`,
    `D\xE9c\xE8s \u2014 ${fmt(recap.deces)} (dont maladie : ${recap.decesMaladie})`,
    `Mariages nobles \u2014 ${fmt(recap.mariagesNobles)}`,
    `Conversions culturelles \u2014 ${fmt(recap.conversions)}`,
    `Titres attribu\xE9s \u2014 ${fmt(recap.titresAttribues)}`
  ];
  if (recap.crises.length > 0) lignes.push(`\u26A0 Crises : ${recap.crises.join(" ; ")}`);
  if (recap.commandantTombe) lignes.push(`\u26A0 Commandant tomb\xE9 : ${recap.commandantTombe}`);
  state.log.push({
    turn: state.turn + 1,
    type: "Syst\xE8me",
    joueur: p.n,
    texte: `R\xE9cap ${p.nom} \u2014 ${lignes.join(" | ")}`
  });
}

// src/engine/population.ts
function populationTurn(state, p, rng) {
  const C = cfgOf(state.config);
  const pop = state.population[p.n];
  if (!pop) return;
  const recap = emptyRecap();
  p.recap = recap;
  maybeAssignProfesseurs(state, p, rng, recap);
  gestionMariages(state, p, rng, recap);
  const vivants = pop.filter((c) => c.statut !== "D\xE9c\xE9d\xE9");
  for (const c of vivants) {
    if (!c.statut) c.statut = "Sain";
    if (!c.ageMax || c.ageMax <= 0) c.ageMax = computeAgeMax(c, rng, C);
    c.age += 2;
    if (c.age < C.p.adultAge) tryEducateMinor(state, p, c, rng, recap);
    c.fecondite = computeFecondite(state, p, c);
    if (c.age >= c.ageMax) {
      const resurrected = tryResurrection(c, rng, C);
      if (!resurrected) {
        killCharacter(state, p, c, "vieillesse", recap);
        continue;
      }
    }
    if (c.age >= C.p.adultAge && !c.titre) assignAdultTitle(state, p, c, rng, recap);
    maladieStep(state, p, c, rng, recap);
  }
  conceptionEtNaissances(state, p, rng, recap);
  applyCultureInfluence(state, p, rng, recap);
  updateCityCultures(state, p);
  migrerPopulation(state, p, rng);
  writeRecap(state, p, recap);
}
var cacheVillesProfState = null;
function villesAvecProfesseur(state, joueur) {
  const C = cfgOf(state.config);
  if (!cacheVillesProfState || cacheVillesProfState.state !== state) {
    const parJoueur = /* @__PURE__ */ new Map();
    for (const [nStr, liste] of Object.entries(state.population ?? {})) {
      const n = Number(nStr);
      const villes2 = /* @__PURE__ */ new Set();
      for (const c of liste ?? []) {
        if (c.statut !== "D\xE9c\xE9d\xE9" && c.titre === C.p.titreProfesseur) villes2.add(c.ville);
      }
      parJoueur.set(n, villes2);
    }
    cacheVillesProfState = { state, parJoueur };
  }
  const villes = cacheVillesProfState.parJoueur.get(joueur.n) ?? /* @__PURE__ */ new Set();
  return joueur.villes.filter((v) => villes.has(v.nom));
}
function migrerPopulation(state, p, rng) {
  const C = cfgOf(state.config);
  const pop = state.population[p.n] ?? [];
  const deplaces = /* @__PURE__ */ new Set();
  const migrer = (c, srcN, dest, motif) => {
    if (dest.joueur.n !== srcN) {
      const src = state.population[srcN] ?? [];
      const i = src.indexOf(c);
      if (i >= 0) src.splice(i, 1);
      const dst = state.population[dest.joueur.n] ?? (state.population[dest.joueur.n] = []);
      dst.push(c);
    }
    const avant = c.ville;
    c.ville = dest.ville.nom;
    deplaces.add(c.id);
    state.log.push({
      turn: state.turn + 1,
      type: "Syst\xE8me",
      joueur: srcN,
      texte: dest.joueur.n === srcN ? `${fullName(c)} quitte ${avant} pour ${dest.ville.nom} (${motif}).` : `${fullName(c)} quitte ${avant} pour ${dest.ville.nom} chez ${dest.joueur.nom} (${motif}).`
    });
  };
  const profsChezMoi = villesAvecProfesseur(state, p);
  const chezMoiAutres = profsChezMoi.map((v) => ({ joueur: p, ville: v }));
  const suzerain1 = p.vassalDe != null && p.vassalDe !== p.n ? state.players.find((x) => x.n === p.vassalDe) : void 0;
  const suzerain2 = suzerain1?.vassalDe != null && suzerain1.vassalDe !== p.n ? state.players.find((x) => x.n === suzerain1.vassalDe) : void 0;
  const chezSuzerains = [suzerain1, suzerain2].filter((s) => !!s).flatMap((s) => villesAvecProfesseur(state, s).map((v) => ({ joueur: s, ville: v })));
  const chezLeMonde = state.players.filter((q) => q.n !== p.n).flatMap((q) => villesAvecProfesseur(state, q).map((v) => ({ joueur: q, ville: v })));
  for (const c of [...pop]) {
    if (c.statut === "D\xE9c\xE9d\xE9" || c.age >= C.p.adultAge) continue;
    if (c.education) continue;
    if ((c.traits ?? []).includes(C.p.traitObstine)) continue;
    if (deplaces.has(c.id)) continue;
    if (profsChezMoi.some((v) => v.nom === c.ville)) continue;
    const ciblesMemeJoueur = chezMoiAutres.filter((t) => t.ville.nom !== c.ville);
    if (ciblesMemeJoueur.length > 0 && rng.chance(C.p.migrationEcole)) {
      migrer(c, p.n, rng.pick(ciblesMemeJoueur), "scolarit\xE9 \u2014 rejoint un Professeur");
      continue;
    }
    const ciblesSuzerain = chezSuzerains.filter((t) => t.ville.nom !== c.ville);
    if (ciblesSuzerain.length > 0 && rng.chance(C.p.migrationSuzerain)) {
      migrer(c, p.n, rng.pick(ciblesSuzerain), "scolarit\xE9 \u2014 Professeur du suzerain");
      continue;
    }
    const ciblesMonde = [...ciblesMemeJoueur, ...chezLeMonde];
    if (ciblesMonde.length > 0 && rng.chance(C.p.migrationMonde)) {
      migrer(c, p.n, rng.pick(ciblesMonde), "scolarit\xE9 \u2014 Professeur");
    }
  }
  const cibles = [];
  for (const q of state.players) {
    for (const v of q.villes) {
      const a = attraitTouristiqueVille(state, q, v, C);
      if (a > 0) cibles.push({ cible: { joueur: q, ville: v }, attrait: a });
    }
  }
  if (cibles.length === 0) return;
  const proprietaireParId = /* @__PURE__ */ new Map();
  const vivantsParNom = /* @__PURE__ */ new Map();
  const mineursParParent = /* @__PURE__ */ new Map();
  for (const q of state.players) {
    for (const x of state.population[q.n] ?? []) {
      proprietaireParId.set(x.id, q.n);
      if (x.statut === "D\xE9c\xE9d\xE9") continue;
      const nom = fullName(x);
      const lst = vivantsParNom.get(nom);
      if (lst) lst.push(x);
      else vivantsParNom.set(nom, [x]);
      if (x.age < C.p.adultAge && !x.armee) {
        for (const parent of [x.mere, x.pere]) {
          if (!parent) continue;
          const l2 = mineursParParent.get(parent);
          if (l2) l2.push(x);
          else mineursParParent.set(parent, [x]);
        }
      }
    }
  }
  for (const c of [...pop]) {
    if (c.statut === "D\xE9c\xE9d\xE9" || deplaces.has(c.id)) continue;
    if (c.armee) continue;
    if (!rng.chance(C.p.migrationTourisme)) continue;
    const dispo = cibles.filter((t) => !(t.cible.joueur.n === p.n && t.cible.ville.nom === c.ville));
    if (dispo.length === 0) continue;
    const dest = rng.pickWeighted(dispo, (t) => t.attrait);
    migrer(c, p.n, dest.cible, "attrait touristique");
    const nomComplet = fullName(c);
    const famille = [];
    if (c.mariage) {
      for (const x of vivantsParNom.get(c.mariage) ?? []) {
        if (deplaces.has(x.id) || x.id === c.id || x.armee) continue;
        famille.push(x);
      }
    }
    for (const x of mineursParParent.get(nomComplet) ?? []) {
      if (deplaces.has(x.id) || x.id === c.id || famille.includes(x)) continue;
      famille.push(x);
    }
    for (const x of famille) {
      const srcN = proprietaireParId.get(x.id);
      if (srcN == null) continue;
      migrer(x, srcN, dest.cible, `accompagne ${nomComplet} \u2014 attrait touristique`);
    }
  }
}

// src/engine/cour.ts
function donnerPersonnage(state, p, c, cible) {
  if (cible.n === p.n) return "Ce personnage appartient d\xE9j\xE0 \xE0 ce joueur.";
  return deplacerPersonnage(state, c, { kind: "joueur", p: cible });
}
function marierPersonnages(state, a, b) {
  const C = cfgOf(state.config);
  if (a.id === b.id) return "Un personnage ne peut pas se marier avec lui-m\xEAme.";
  if (a.statut === "D\xE9c\xE9d\xE9" || b.statut === "D\xE9c\xE9d\xE9") return "Un des deux personnages est d\xE9c\xE9d\xE9.";
  if (a.age < C.p.adultAge || b.age < C.p.adultAge) return "Les deux doivent \xEAtre majeurs pour se marier.";
  if (a.mariage || b.mariage) return "Un des deux personnages est d\xE9j\xE0 mari\xE9.";
  if (!isNobleDyn(a.dynastie, C) || !isNobleDyn(b.dynastie, C)) {
    return "Le mariage manuel unit deux NOBLES (la population se marie au fil des tours).";
  }
  a.mariage = fullName(b);
  b.mariage = fullName(a);
  const dA = porteurDe(state, a);
  const dB = porteurDe(state, b);
  const union = dA && dB && !memeDetenteur(dA, dB) ? " \u2014 union de deux cours" : "";
  let demenagement = "";
  if (dA && dB && !memeDetenteur(dA, dB)) {
    const popSrc = populationDe(state, dA);
    const i = popSrc.indexOf(a);
    if (i >= 0) popSrc.splice(i, 1);
    if (dB.kind === "joueur") {
      const arr = state.population[dB.p.n] ?? (state.population[dB.p.n] = []);
      arr.push(a);
    } else {
      const arr = dB.cite.population ?? (dB.cite.population = []);
      arr.push(a);
    }
    a.ville = b.ville;
    demenagement = ` \u2014 ${fullName(a)} rejoint la ville \xAB ${a.ville} \xBB`;
  }
  state.log.push({
    turn: state.turn,
    type: "Mariage",
    joueur: dA?.kind === "joueur" ? dA.p.n : null,
    texte: `Mariage noble (manuel) : ${fullName(a)} (${a.dynastie}${dA ? `, ${nomDe(dA)}` : ""}) \xE9pouse ${fullName(b)} (${b.dynastie}${dB ? `, ${nomDe(dB)}` : ""})${union}${demenagement}.`
  });
  return null;
}
function numeroJoueurDe(state, c) {
  for (const q of state.players) {
    if ((state.population[q.n] ?? []).some((x) => x.id === c.id)) return q.n;
  }
  return -1;
}

// src/engine/progres.ts
function techDefArbre(arbre, s) {
  if (s === "c") return arbre.techC;
  const br = s[0] === "a" ? arbre.brancheA : arbre.brancheB;
  return br?.[+s[1] - 1];
}
function effetsTech(t) {
  return (t?.effets ?? []).filter(
    (e) => e && typeof e.montant === "number" && e.montant !== 0 && !!e.type
  );
}
function coutScienceTech(t) {
  if (!t?.cout) return null;
  const m = String(t.cout).replace(",", ".").match(/\d+(\.\d+)?/);
  if (!m) return null;
  const v = parseFloat(m[0]);
  return Number.isFinite(v) && v > 0 ? v : null;
}
function debiterScienceTech(p, t) {
  const cs = coutScienceTech(t);
  if (cs == null) return 0;
  const rs = p.resources["Science"];
  if (rs) rs.stock -= cs;
  return cs;
}
function rembourserScienceTech(p, t) {
  const cs = coutScienceTech(t);
  if (cs == null) return 0;
  const rs = p.resources["Science"];
  if (rs) rs.stock += cs;
  return cs;
}
function resumeEffetsTech(t) {
  const parts = [];
  for (const e of effetsTech(t)) {
    const m = e.montant > 0 ? `+${e.montant}` : `${e.montant}`;
    if (e.type === "gain" && e.ressource) parts.push(`${m} ${e.ressource} (une fois)`);
    else if (e.type === "prodCapitale" && e.ressource) parts.push(`${m} ${e.ressource}/tour (capitale)`);
    else if (e.type === "prodParHabitation" && e.ressource) parts.push(`${m} ${e.ressource}/tour par habitation`);
    else if (e.type === "prodParTitre" && e.ressource) parts.push(`${m} ${e.ressource}/tour par ${e.titre ?? "titulaire"}`);
    else if (e.type === "prodParAmenagement" && e.ressource)
      parts.push(`${m} ${e.ressource}/tour par ${(e.amenagements ?? []).join(" / ") || "am\xE9nagement"}`);
    else if (e.type === "garnison")
      parts.push(`garnison ${m} ${e.cible === "capitale" ? "(capitale)" : "(habitations)"}`);
  }
  return parts.join(" \xB7 ");
}

// src/engine/victory.ts
var ROMAINS = ["I", "II", "III", "IV"];
function nbLauriers(p, voie) {
  return p.lauriers?.[voie] ?? 0;
}
function cocherLaurier(state, p, voie, niveau) {
  const actuel = nbLauriers(p, voie);
  if (niveau === 0 && actuel > 0) {
    p.lauriers = { ...p.lauriers ?? {}, [voie]: actuel - 1 };
    return actuel - 1;
  }
  if (niveau < 1 || niveau > 4 || niveau !== actuel + 1) return -1;
  p.lauriers = { ...p.lauriers ?? {}, [voie]: niveau };
  const def = cfgOf(state.config).config.victoires.find((v) => v.voie === voie);
  const bonus = def?.lauriers[niveau - 1]?.bonus ?? "";
  if (niveau === 4) {
    state.log.push({
      turn: state.turn,
      type: "Syst\xE8me",
      joueur: p.n,
      texte: `\u{1F451} VICTOIRE ! ${p.nom} vient de valider le Laurier IV de la voie ${voie} \u2014 la partie s'ach\xE8ve sur son triomphe !`
    });
  } else {
    state.log.push({
      turn: state.turn,
      type: "Syst\xE8me",
      joueur: p.n,
      texte: `\u{1F3C6} Laurier ${ROMAINS[niveau - 1]} de la voie ${voie} valid\xE9 pour ${p.nom} \u2014 une crise doit \xEAtre tir\xE9e.${bonus ? ` ${bonus}` : ""}`
    });
  }
  return niveau;
}
function victoireAtteinte(state) {
  const out = [];
  for (const p of state.players) {
    for (const [voie, n] of Object.entries(p.lauriers ?? {})) {
      if (n >= 4) out.push({ joueur: p.n, nom: p.nom, voie });
    }
  }
  return out;
}
function cleVoie(voie) {
  return voie.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
function victoryLabels(state) {
  const victoires = state ? cfgOf(state.config).config.victoires : cfgOf(void 0).config.victoires;
  return victoires.map((v) => ({ key: cleVoie(v.voie), label: v.voie }));
}
function victoryProgress(state) {
  const victoires = cfgOf(state.config).config.victoires;
  return state.players.map((p) => {
    const valeurs = {};
    const details = {};
    for (const v of victoires) {
      const n = nbLauriers(p, v.voie);
      valeurs[cleVoie(v.voie)] = n / 4;
      details[cleVoie(v.voie)] = n >= 4 ? `${n}/4 Lauriers \u2014 voie ${v.voie} TERMIN\xC9E \u{1F451}` : `${n}/4 Lauriers \u2014 prochain : ${v.lauriers[n]?.condition ?? "\u2026"}`;
    }
    return { joueur: p.n, nom: p.nom, valeurs, details };
  });
}

// src/engine/validation.ts
function validateTitleAssignment(state, player, char, titre) {
  const C = cfgOf(state.config);
  const td = titreDef(titre, C.config);
  if (!td) return { ok: false, message: `Titre inconnu : ${titre}` };
  if (char.statut === "D\xE9c\xE9d\xE9") return { ok: false, message: "Ce personnage est d\xE9c\xE9d\xE9." };
  if (char.age < C.p.adultAge) return { ok: false, message: `Ce personnage est mineur (${char.age} ans, adulte \xE0 ${C.p.adultAge}).` };
  if (td.attribution === "Arm\xE9e") {
    return { ok: false, message: `Le titre \xAB ${titre} \xBB s'obtient normalement par l'engagement militaire.` };
  }
  if (td.nobleSeul && !isNobleDyn(char.dynastie, C)) {
    return { ok: false, message: `Le titre \xAB ${titre} \xBB est en principe r\xE9serv\xE9 aux nobles (${char.dynastie}).` };
  }
  const cult = cultureDef(player.culture, C.config);
  if (td.regleGenre === "Masculine" && char.sexe !== "M") {
    return { ok: false, message: "Ce titre est en principe r\xE9serv\xE9 aux hommes." };
  }
  if (td.regleGenre === "F\xE9minine" && char.sexe !== "F") {
    return { ok: false, message: "Ce titre est en principe r\xE9serv\xE9 aux femmes." };
  }
  if (td.regleGenre === "H\xE9r\xE9dit\xE9" && cult) {
    if (cult.heredite === "Masculine" && char.sexe !== "M") {
      return { ok: false, message: `La culture ${player.culture} (h\xE9r\xE9dit\xE9 masculine) r\xE9serve en principe ce poste aux hommes.` };
    }
    if (cult.heredite === "F\xE9minine" && char.sexe !== "F") {
      return { ok: false, message: `La culture ${player.culture} (h\xE9r\xE9dit\xE9 f\xE9minine) r\xE9serve en principe ce poste aux femmes.` };
    }
  }
  if (td.regleGenre === "Martialit\xE9" && cult) {
    if (cult.martialite === "Masculine" && char.sexe !== "M") {
      return { ok: false, message: `La culture ${player.culture} (martialit\xE9 masculine) r\xE9serve en principe ce poste aux hommes.` };
    }
    if (cult.martialite === "F\xE9minine" && char.sexe !== "F") {
      return { ok: false, message: `La culture ${player.culture} (martialit\xE9 f\xE9minine) r\xE9serve en principe ce poste aux femmes.` };
    }
  }
  if (td.education && char.education !== td.education) {
    return { ok: false, message: `\xC9ducation attendue : ${td.education} (ce personnage a : ${char.education ?? "aucune"}).` };
  }
  const pop = (state.population[player.n] ?? []).filter((c) => c.statut !== "D\xE9c\xE9d\xE9");
  if (titre === C.p.titreDirigeant && pop.some((c) => c.id !== char.id && c.titre === C.p.titreDirigeant)) {
    return { ok: false, message: `Il y a d\xE9j\xE0 un ${C.p.titreDirigeant}.` };
  }
  if (titre === C.p.titreHeritierStr) {
    const dirigeant = pop.find((c) => c.titre === C.p.titreDirigeant);
    if (pop.some((c) => c.id !== char.id && c.titre === C.p.titreHeritierStr)) {
      return { ok: false, message: `Il y a d\xE9j\xE0 un ${C.p.titreHeritierStr}.` };
    }
    if (dirigeant && char.dynastie !== dirigeant.dynastie) {
      return { ok: false, message: `L'${C.p.titreHeritierStr} est en principe de la dynastie du ${C.p.titreDirigeant} (${dirigeant.dynastie}).` };
    }
  }
  if (titre === C.p.titreGouverneur) {
    const autres = pop.filter((c) => c.id !== char.id && c.titre === C.p.titreGouverneur && c.ville === char.ville);
    if (autres.length > 0) {
      return { ok: false, message: `${char.ville} a d\xE9j\xE0 un ${C.p.titreGouverneur}.` };
    }
  }
  if (titre === C.p.titreProfesseur) {
    const ville = player.villes.find((v) => v.nom === char.ville);
    const rank = ville ? schoolRankOf(ville.batiments, C.config) : 0;
    const nbProfs = pop.filter((c) => c.titre === C.p.titreProfesseur && c.ville === char.ville).length;
    if (rank === 0) return { ok: false, message: `${char.ville} ne poss\xE8de pas d'\xE9cole.` };
    if (nbProfs >= rank) {
      return { ok: false, message: `${char.ville} a d\xE9j\xE0 ${nbProfs} ${C.p.titreProfesseur}(s) pour une \xE9cole de rang ${rank}.` };
    }
  }
  if (titre === "Ministre") {
    const rangs = C.config.paysRangs ?? [];
    const cap = rangs[rangPaysNiveau(player, C) - 1]?.ministres ?? 0;
    const nbMin = pop.filter((c) => c.id !== char.id && c.titre === "Ministre").length;
    if (nbMin >= cap) {
      return {
        ok: false,
        message: `Le rang de pays ${player.rang || rangs[0]?.nom || "de d\xE9part"} n'autorise que ${cap} Ministre(s) \u2014 montez de rang (sacre) pour agrandir votre conseil.`
      };
    }
  }
  return { ok: true, message: `\xAB ${titre} \xBB attribu\xE9 \xE0 ${char.prenom} ${char.nom}.` };
}
function titleCandidatesFor(state, player, char) {
  const C = cfgOf(state.config);
  return C.titres.map((t) => {
    const issue = validateTitleAssignment(state, player, char, t.titre);
    return { titre: t.titre, ok: issue.ok, motif: issue.ok ? "" : issue.message };
  });
}
function findTitleIssues(state, player, char) {
  const out = [];
  if (!char.titre) return out;
  const C = cfgOf(state.config);
  const td = titreDef(char.titre, C.config);
  if (!td) return out;
  if (char.statut !== "D\xE9c\xE9d\xE9") {
    const issue = validateTitleAssignment(state, player, char, char.titre);
    if (!issue.ok) out.push(issue.message);
  }
  return out;
}

// src/engine/engine.ts
function sermentsPossedes(state, p) {
  const bonusMonarchie = p.regime === "Monarchie" ? 1 : 0;
  return nbVassaux(state, p) + citesSuzerainesDe(state, p).length + bonusMonarchie;
}
function runTurn(state) {
  const C = cfgOf(state.config);
  const rng = makeRng(state.rngState);
  const turnBefore = state.turn;
  const newSaison = saisonForTurn(turnBefore + 1, C);
  if (newSaison !== state.saison) {
    const ev = rng.pickWeighted(
      C.events.filter((e) => e.saison === newSaison),
      (e) => e.poids
    );
    if (ev) {
      const danger = rng.die(6) + state.modDanger;
      const level = danger <= 5 ? "faible" : danger <= 8 ? "moyenne" : danger < C.p.dangerSeuilForte ? "forte" : "extreme";
      const texte = ev[level];
      state.log.push({
        turn: turnBefore + 1,
        type: "\xC9v\xE9nement",
        joueur: null,
        texte: `\u3010${newSaison}\u3011 ${ev.nom} (danger ${danger}/6) : ${texte}`
      });
      applyEventEffect(state, ev.nom, level);
    }
    effetsFinSaisonMinisteres(state, state.saison);
    state.saison = newSaison;
  }
  for (const p of state.players) {
    const card = rng.pick(C.dynasties);
    p.dynastie = { nom: card.nom, description: card.description };
    state.log.push({
      turn: turnBefore + 1,
      type: "Dynastie",
      joueur: p.n,
      texte: `${p.nom} \u2014 Dynastie \xAB ${card.nom} \xBB : ${card.description}`
    });
    applyDynastieCard(state, p, card.nom, rng);
  }
  designerGouverneurs(state, C);
  const gainsParJoueur = {};
  for (const p of state.players) {
    gainsParJoueur[p.n] = calculerGainsPopulation(state, p, rng);
  }
  const prodParJoueur = {};
  for (const p of state.players) {
    const prodTot = {};
    for (const r of C.ressources) {
      const rs = p.resources[r];
      if (!rs) continue;
      rs.stock += rs.prod;
      prodTot[r] = rs.prod;
    }
    prodParJoueur[p.n] = prodTot;
  }
  const gainsAvantTribut = {};
  for (const p of state.players) {
    gainsAvantTribut[p.n] = { ...gainsParJoueur[p.n] ?? {} };
  }
  transfererTributVassal(state, gainsParJoueur, C);
  const coefGains = C.p.gainsCrediteStock;
  for (const p of state.players) {
    const gains = gainsParJoueur[p.n] ?? {};
    for (const [res, v] of Object.entries(gains)) {
      const rs = p.resources[res];
      if (rs) rs.stock += v * coefGains;
    }
  }
  const batimentsParJoueur = {};
  for (const p of state.players) {
    batimentsParJoueur[p.n] = appliquerEffetsBatiments(p, C);
  }
  const amenagementsParJoueur = {};
  for (const p of state.players) {
    amenagementsParJoueur[p.n] = appliquerEffetsAmenagements(p, state.saison, C.config);
  }
  const nourrEteParJoueur = {};
  for (const p of state.players) {
    const out = {};
    if (state.saison === "\xC9t\xE9") {
      for (const ville of p.villes) {
        for (const [res, v] of Object.entries(effetsNourrEteAmenagementsVille(ville, C.config))) {
          out[res] = (out[res] ?? 0) + v;
        }
        for (const [res, v] of Object.entries(effetsNourrEteAutresVille(ville))) {
          out[res] = (out[res] ?? 0) + v;
        }
      }
      for (const [res, v] of Object.entries(out)) {
        if (!v) continue;
        const rs = p.resources[res];
        if (rs) rs.stock += v;
      }
    }
    nourrEteParJoueur[p.n] = out;
  }
  const autresParJoueur = {};
  for (const p of state.players) {
    autresParJoueur[p.n] = appliquerEffetsAutres(p);
  }
  const regimesCulturesParJoueur = {};
  for (const p of state.players) {
    regimesCulturesParJoueur[p.n] = appliquerEffetsRegimesCultures(state, p, state.saison, C);
    resynchroniserTourisme(state, p, "fin de tour");
  }
  const habitationsParJoueur = {};
  for (const p of state.players) {
    habitationsParJoueur[p.n] = appliquerConsommationsHabitations(state, p, C);
  }
  const factionsParJoueur = {};
  for (const p of state.players) {
    factionsParJoueur[p.n] = appliquerEffetsFaction(state, p, C);
    resynchroniserTourisme(state, p, "fin de tour");
  }
  const citesLibresParJoueur = appliquerTaxesCitesLibres(state, C);
  const ministeresParJoueur = appliquerEffetsMinisteres(state, C);
  const proximiteParJoueur = appliquerBonusProximite(state, C);
  nettoyerRoutesCommerce(state);
  for (const p of state.players) peuplerMarchands(state, p);
  const commerceParJoueur = appliquerEffetsCommerce(state, C);
  const progresParJoueur = {};
  for (const p of state.players) {
    const flux = fluxProgresJoueur(state, p, C);
    progresParJoueur[p.n] = flux;
    for (const [res, v] of Object.entries(flux)) {
      const rs = p.resources[res];
      if (rs && v !== 0) rs.stock += v;
    }
    resynchroniserTourisme(state, p, "fin de tour");
    if (Object.keys(flux).length > 0) {
      const parts = Object.entries(flux).map(([r, v]) => `${v > 0 ? "+" : ""}${Math.round(v * 10) / 10} ${r}`).join(", ");
      state.log.push({
        turn: state.turn + 1,
        type: "Syst\xE8me",
        joueur: p.n,
        texte: `\u{1F52C} ${p.nom} \u2014 progr\xE8s technologiques : ${parts}.`
      });
    }
  }
  for (const p of state.players) {
    populationTurn(state, p, rng);
  }
  for (const p of state.players) {
    recruitForArmies(state, p, rng);
  }
  const apportsParJoueur = {};
  for (const p of state.players) {
    const population = {};
    for (const [res, v] of Object.entries(gainsAvantTribut[p.n] ?? {})) {
      if (v !== 0) population[res] = v * coefGains;
    }
    const vassalite = {};
    for (const [res, v] of Object.entries(gainsParJoueur[p.n] ?? {})) {
      const ecart = v - (gainsAvantTribut[p.n]?.[res] ?? 0);
      if (ecart !== 0) vassalite[res] = ecart * coefGains;
    }
    apportsParJoueur[p.n] = {
      production: prodParJoueur[p.n] ?? {},
      batiments: batimentsParJoueur[p.n] ?? {},
      amenagements: amenagementsParJoueur[p.n] ?? {},
      nourrEte: nourrEteParJoueur[p.n] ?? {},
      autres: autresParJoueur[p.n] ?? {},
      regimesCultures: regimesCulturesParJoueur[p.n] ?? {},
      habitations: habitationsParJoueur[p.n] ?? {},
      faction: factionsParJoueur[p.n] ?? {},
      citesLibres: citesLibresParJoueur[p.n] ?? {},
      ministeres: ministeresParJoueur[p.n] ?? {},
      commerce: commerceParJoueur[p.n] ?? {},
      proximite: proximiteParJoueur[p.n] ?? {},
      population,
      vassalite,
      progres: progresParJoueur[p.n] ?? {}
    };
  }
  snapshotRessources(state, turnBefore + 1, apportsParJoueur);
  state.turn = turnBefore + 1;
  if (state.log.length > C.p.maxLog) {
    state.log = state.log.slice(state.log.length - C.p.maxLog);
  }
  state.rngState = rng.state();
  return state;
}
export {
  AMENAGEMENTS,
  COULEURS_JOUEURS_DEFAUT,
  COULEURS_RESSOURCES_DEFAUT,
  MULT_NOURR_CHASSEUR_CITE,
  TITRE_MARCHAND,
  TRANSPARENCE_LIGNES_DEFAUT,
  aCampDeBatisseurs,
  aMinistre,
  ajouterFamilleNobleCiteLibre,
  ajouterHabitantsCiteLibre,
  amenagementDef,
  amenagementRef,
  amenagementsCopiables,
  amenagementsDefs,
  amenagementsRefs,
  appliquerBonusProximite,
  appliquerConsommationsHabitations,
  appliquerEffetsAmenagements,
  appliquerEffetsAutres,
  appliquerEffetsBatiments,
  appliquerEffetsCommerce,
  appliquerEffetsFaction,
  appliquerEffetsMinisteres,
  appliquerEffetsRegimesCultures,
  appliquerTaxesCitesLibres,
  applyCultureInfluence,
  applyDynastieCard,
  applyEventEffect,
  assignAdultTitle,
  attraitMaxMonde,
  attraitTouristiqueVille,
  batimentRef,
  batimentsCapitale,
  batimentsConstructionsRefs,
  batimentsFaction,
  batimentsRefs,
  bonusProximite,
  calculerGainsPopulation,
  capitaleDe,
  changerCopieRoute,
  changerPortefeuille,
  citeLibreDevientVille,
  citesLibresDe,
  citesSuzerainesDe,
  cocherLaurier,
  computeAgeMax,
  computeBabyDynasty,
  computeFecondite,
  computeMarriageProbability,
  conceptionEtNaissances,
  consommationsPays,
  consommationsVille,
  constructionRef,
  constructionsRefs,
  couleurJoueur,
  couleurRessource,
  coutAmenagement,
  coutBatiment,
  coutBatimentRef,
  coutConstructionRef,
  coutHabitation,
  coutScienceTech,
  creerRouteCommerce,
  debiterCoutHabitation,
  debiterScienceTech,
  deplacerPersonnage,
  designerGouverneurs,
  detailCiteLibre,
  detailCommerceJoueur,
  detailCulturePays,
  detailGainsVille,
  detailGarnisonVille,
  detailsAmenagementsJoueur,
  detailsAutresJoueur,
  detailsBatimentsJoueur,
  detailsFaction,
  detenteursDe,
  donnerPersonnage,
  effetAutreLigne,
  effetsAmenagementsVille,
  effetsAutresVille,
  effetsBatimentsVille,
  effetsCommerceJoueur,
  effetsConstructionEntries,
  effetsConstructionRef,
  effetsCulturePays,
  effetsEteConstructionRef,
  effetsFaction,
  effetsFinSaisonMinisteres,
  effetsNourrEteAmenagementsVille,
  effetsNourrEteAutresVille,
  effetsRegime,
  effetsRouteProprietaire,
  effetsTech,
  effetsTourAmenagement,
  effetsTourBatiment,
  emissairesDe,
  estNourrEte,
  eteSeulementRef,
  facteurAvencement,
  facteurSacre,
  facteurTaxesCite,
  femaleAgeFactor,
  ficheFaction,
  findTitleIssues,
  fondRessource,
  formatDynastyPair,
  fullName,
  garnisonBaseVille,
  garnisonBatiment,
  garnisonCiteLibre,
  garnisonConstructionRef,
  garnisonFactionVille,
  garnisonHabitationVille,
  garnisonHabitationsPays,
  genererImpotPopulation,
  genererImpotVassaux,
  gestionMariages,
  gouverneurDeVille,
  habitantsRequisVille,
  habitationDef,
  handleDirigeantSuccession,
  impotPopulation,
  impotsVassaux,
  inheritTraits,
  instantanesConstructionRef,
  isConsanguineous,
  isNobleDyn,
  killCharacter,
  maleAgeFactor,
  marchandsDe,
  marierPersonnages,
  martialiteOk,
  maxMarchandsJoueur,
  maybeAssignProfesseurs,
  memeDetenteur,
  migrerCouleurs,
  migrerNomsMinisteres,
  migrerPopulation,
  nbAmenagements,
  nbBatiments,
  nbLauriers,
  nbVassaux,
  nbVillesCultureMonde,
  nettoyerRoutesCommerce,
  newId,
  nomDe,
  nomRang,
  normaliserEtat,
  numeroJoueurDe,
  orientationFertFactor,
  parseCoutTexte,
  parseProductionTexte,
  peuplerMarchands,
  pickName,
  populationDe,
  populationTurn,
  portefeuillesDuJoueur,
  porteurDe,
  prerequisConstruction,
  productionDetaillee,
  productionVille,
  provenancesApports,
  pseudoJoueurDeCite,
  rangNiveau,
  rangPaysNiveau,
  rangsDisponibles,
  recomputeArmy,
  recruitForArmies,
  reductionCampDeBatisseurs,
  regleActive,
  reglesActives,
  rejouerTransfertVille,
  rembourserScienceTech,
  ressourcesCopiables,
  resumeConstruction,
  resumeEffetsTech,
  routesCommerce,
  routesCommerceDe,
  routesCommerceVers,
  runTurn,
  saisonForTurn,
  sermentsPossedes,
  snapshotRessources,
  supprimerRouteCommerce,
  supprimerVille,
  taxBirthFactor,
  taxesCite,
  taxesCitesLibresRecues,
  techDefArbre,
  titleCandidatesFor,
  titreAllowedForCharacter,
  titresAccessibles,
  titresAccessiblesCite,
  tourismeStatiqueBatiment,
  toutesLesPopulations,
  transfererTributVassal,
  transfererVille,
  tryEducateMinor,
  typeVille,
  updateCityCultures,
  victoireAtteinte,
  victoryLabels,
  victoryProgress,
  villeDevientCiteLibre,
  writeRecap
};
