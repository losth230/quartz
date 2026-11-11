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
      description: "Si ce personnage est propagandiste, il g\xE9n\xE8re 6 Tourisme \xE0 sa mort."
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
  cultures: [
    {
      nom: "Communautarisme",
      fertFactor: 1,
      heredite: "Parit\xE9",
      regleVille: "Logements \xE9largis : les habitations ont +5 Taudis.",
      regleHabitant: "Bourgeoisie facile : seuil de prestige bourgeois abaiss\xE9 (100 \u2192 80).",
      taudisParHabitation: 5,
      prestigeSeuilBourgeois: 80
    },
    {
      nom: "D\xE9isme",
      fertFactor: 1,
      heredite: "Masculine",
      regleVille: "Monuments pieux : les b\xE2timents de faction offrent +1 emplacement de Scientifique.",
      regleHabitant: "Lavages de main : r\xE9duit les chances de contracter des maladies de 2 %.",
      scientifiqueParBatiment: 1,
      maladieContractMod: -0.02
    },
    {
      nom: "Lunisme",
      fertFactor: 1,
      heredite: "Masculine",
      regleVille: "Villes Saintes : les habitations ont +2 emplacements de Palais.",
      regleHabitant: "Foi sup\xE9rieure : les nobles rapportent +1 Tourisme par tour.",
      palaisParHabitation: 2,
      tourismeParNoble: 1
    },
    {
      nom: "Naturalisme",
      fertFactor: 1.1,
      heredite: "Parit\xE9",
      regleVille: "Champs nourriciers : les fermiers rapportent +1 Nourriture par tour en \xE9t\xE9.",
      regleHabitant: "Walpurgis : fertFactor 1,1 (+10 % de naissances).",
      nourrEteParFermier: 1
    },
    {
      nom: "Sethisme",
      fertFactor: 1,
      heredite: "F\xE9minine",
      regleVille: "Caravanes : une fois 3 am\xE9nagements atteints, +1 route commerciale disponible.",
      regleHabitant: "Conseil des Sages : les nobles rapportent +0,1 Science par tour.",
      caravanesSeuilAmenagements: 3,
      caravanesRoutesBonus: 1,
      scienceParNoble: 0.1
    },
    {
      nom: "Z\xE9lotisme",
      fertFactor: 1,
      heredite: "F\xE9minine",
      regleVille: "Ferveur martiale : les garnisons des habitations qui ne sont pas de cette culture sont r\xE9duites de 20 points par rang de l'habitation.",
      regleHabitant: "Corps de fer : les Gardes produisent +10 Garnison et +0,2 Or par tour.",
      garnisonHorsCultureParRang: 20,
      garnisonParGardeCulture: 10,
      orParGarde: 0.2
    }
  ],
  regimes: [
    {
      nom: "Autoritarisme",
      loi: "Conscription : prix de lev\xE9e d'arm\xE9e -10 Or par rang du pays. Fronti\xE8res closes : vos habitants ont 20 % de chances de moins de partir.",
      leveeOrParRangPays: 10,
      departHabitantsMult: 0.8
    },
    {
      nom: "Socialisme",
      loi: "Terre d'accueil : chaque fois qu'un migrant arrive dans une de vos villes, recevez 1 Or. Redistribution : les bourgeois ne consomment que 1 nourriture par tour et les nobles que 2 nourriture par tour.",
      orParMigrant: 1,
      consoNourrBourgeoisRegime: 1,
      consoNourrNobleRegime: 2
    },
    {
      nom: "D\xE9mocratie",
      loi: "Elections : le sacre d'av\xE8nement est gratuit. Le pouvoir du peuple : +5 Bonheur dans chacune de vos habitations.",
      bonheurParHabitation: 5
    },
    {
      nom: "Monarchie",
      loi: "Droit Divin : vous poss\xE9dez 1 serment suppl\xE9mentaire. Vassaux d\xE9vou\xE9s : les taxes des vassaux rapportent 5 % de ressources suppl\xE9mentaires.",
      tributVassalMult: 1.05
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
      description: "",
      lignes: []
    },
    {
      nom: "PEAUX VERTES",
      description: "",
      lignes: []
    },
    {
      nom: "ELFES D'OR",
      description: "",
      lignes: []
    },
    {
      nom: "Sylvains",
      description: "",
      lignes: []
    }
  ],
  peuplesAutres: [
    {
      nom: "NORLS",
      description: "",
      lignes: []
    },
    {
      nom: "VERMINES DE KAOSS",
      description: "",
      lignes: []
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
  regleCitesLibres: "On appelle cit\xE9 libre, une cit\xE9 n\u2019appartenant \xE0 aucun joueur. Si un joueur perd une de ses habitations par tout autre moyen que par l\u2019action directe d\u2019un autre joueur, celle-ci devient \xE0 son tour une cit\xE9 libre. Lorsqu\u2019une cit\xE9 libre apparait sur le terrain de jeu, son type est d\xE9termin\xE9 par la case sur laquelle elle se trouve. Un joueur dont une cit\xE9 est devenue libre obtient imm\xE9diatement 1 Emissaire\n     Les cit\xE9s libres poss\xE8dent 100 Garnison +40 Garnison par rang de pays du joueur ayant le plus haut rang, et change de niveau d'habitation d\xE8s qu'un joueur entre dans une nouvelle \xE8re.\n     Au cours de la partie, les joueurs pourront tenter de gagner des \xE9missaires aupr\xE8s des diff\xE9rentes cit\xE9s libres. Vous ne pouvez gagner un \xE9missaire qu\u2019une seule fois par saison.\n     Lorsque vous atteignez 3 \xE9missaires avec une cit\xE9 libre, vous avez la possibilit\xE9 de devenir son suzerain. Une cit\xE9 libre compte comme un Serment pour son Suzerain.",
  victoires: [
    {
      voie: "Culturelle",
      lauriers: [
        {
          laurier: "Laurier I",
          condition: "",
          bonus: ""
        },
        {
          laurier: "Laurier II",
          condition: "",
          bonus: ""
        },
        {
          laurier: "Laurier III",
          condition: "",
          bonus: ""
        },
        {
          laurier: "Laurier IV",
          condition: "",
          bonus: ""
        }
      ]
    },
    {
      voie: "D\xE9mographique",
      lauriers: [
        {
          laurier: "Laurier I",
          condition: "",
          bonus: ""
        },
        {
          laurier: "Laurier II",
          condition: "",
          bonus: ""
        },
        {
          laurier: "Laurier III",
          condition: "",
          bonus: ""
        },
        {
          laurier: "Laurier IV",
          condition: "",
          bonus: ""
        }
      ]
    },
    {
      voie: "Diplomatique",
      lauriers: [
        {
          laurier: "Laurier I",
          condition: "",
          bonus: ""
        },
        {
          laurier: "Laurier II",
          condition: "",
          bonus: ""
        },
        {
          laurier: "Laurier III",
          condition: "",
          bonus: ""
        },
        {
          laurier: "Laurier IV",
          condition: "",
          bonus: ""
        }
      ]
    },
    {
      voie: "\xC9conomique",
      lauriers: [
        {
          laurier: "Laurier I",
          condition: "",
          bonus: ""
        },
        {
          laurier: "Laurier II",
          condition: "",
          bonus: ""
        },
        {
          laurier: "Laurier III",
          condition: "",
          bonus: ""
        },
        {
          laurier: "Laurier IV",
          condition: "",
          bonus: ""
        }
      ]
    },
    {
      voie: "Militaire",
      lauriers: [
        {
          laurier: "Laurier I",
          condition: "",
          bonus: ""
        },
        {
          laurier: "Laurier II",
          condition: "",
          bonus: ""
        },
        {
          laurier: "Laurier III",
          condition: "",
          bonus: ""
        },
        {
          laurier: "Laurier IV",
          condition: "",
          bonus: ""
        }
      ]
    },
    {
      voie: "Scientifique",
      lauriers: [
        {
          laurier: "Laurier I",
          condition: "",
          bonus: ""
        },
        {
          laurier: "Laurier II",
          condition: "",
          bonus: ""
        },
        {
          laurier: "Laurier III",
          condition: "",
          bonus: ""
        },
        {
          laurier: "Laurier IV",
          condition: "",
          bonus: ""
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
    "modifier la culture des autres villes\xA0:",
    "1/ dans les titres nommer un propagandiste",
    "2/ le d\xE9placer dans une ville d'une autre culture",
    "3/  modifier la culture des gens de la ville : une charge par tour pour 5 habitats, sauf r\xE8gles contraires",
    "4/ la ville change de culture si la moiti\xE9 de ses habitants sont d'une autre culture",
    "victoires : seul le premier joueur \xE0 atteindre un palier d\xE9clenche ses effets",
    "r\xE9solution bataille auto : A - 1,5*(A-B)"
  ],
  constructions: [
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Militaire",
      nom: "Poste de garde",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 1,
      emplacements: [
        {
          metier: "Garde",
          places: 4
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 25
        },
        {
          ressource: "Fer",
          valeur: 4
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 10
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Militaire",
      nom: "Herses",
      cout: "",
      production: "",
      description: "",
      rangMinHabitation: 1,
      couts: [
        {
          ressource: "Or",
          valeur: 4
        },
        {
          ressource: "Bois",
          valeur: 2
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "Camp de b\xFBcheron",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 1,
      emplacements: [
        {
          metier: "B\xFBcheron",
          places: 2
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 5
        },
        {
          ressource: "B\xE9tail",
          valeur: 1
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "Camp de mineur",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 1,
      emplacements: [
        {
          metier: "Mineur",
          places: 2
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 5
        },
        {
          ressource: "Charbon",
          valeur: 1
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "Echoppe",
      cout: "",
      production: "",
      description: "",
      routesApportees: 1,
      effets: [],
      rangMinHabitation: 1,
      emplacements: [
        {
          metier: "Commer\xE7ant",
          places: 2
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 10
        },
        {
          ressource: "Bois",
          valeur: 3
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "Grange",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 1,
      emplacements: [
        {
          metier: "\xC9leveur",
          places: 2
        },
        {
          metier: "Fermier",
          places: 4
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 10
        },
        {
          ressource: "B\xE9tail",
          valeur: 3
        },
        {
          ressource: "Bois",
          valeur: 3
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "Herboristerie",
      cout: "",
      production: "",
      description: "",
      rangMinHabitation: 1,
      malContraction: 0.05,
      bonusGuerison: 0.05,
      couts: [
        {
          ressource: "Or",
          valeur: 10
        },
        {
          ressource: "Pierre",
          valeur: 2
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "Ponton",
      cout: "",
      production: "",
      description: "",
      rangMinHabitation: 1,
      cotier: true,
      effets: [],
      emplacements: [
        {
          metier: "P\xEAcheur",
          places: 2
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 5
        },
        {
          ressource: "Bois",
          valeur: 5
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Militaire",
      nom: "Bas quartier",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 1,
      couts: [
        {
          ressource: "Bois",
          valeur: 10
        },
        {
          ressource: "Or",
          valeur: 10
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 20
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Militaire",
      nom: "Caserne",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 2,
      emplacements: [
        {
          metier: "Garde",
          places: 4
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 25
        },
        {
          ressource: "Fer",
          valeur: 4
        }
      ],
      requis: "Poste de garde",
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 10
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Militaire",
      nom: "R\xE9seau de routes",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 2,
      couts: [
        {
          ressource: "Or",
          valeur: 15
        },
        {
          ressource: "Soie",
          valeur: 4
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Militaire",
      nom: "Tour de sorcier",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 2,
      emplacements: [
        {
          metier: "Scientifique",
          places: 1
        }
      ],
      domicilesApportes: [
        {
          domicile: "Maison de notable",
          nombre: 1
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 40
        },
        {
          ressource: "Pierre",
          valeur: 12
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Militaire",
      nom: "Quartier interm\xE9diaire",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 2,
      domicilesApportes: [
        {
          domicile: "Maison",
          nombre: 20
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 20
        },
        {
          ressource: "Pierre",
          valeur: 10
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "Camp de travailleurs",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 2,
      emplacements: [
        {
          metier: "B\xFBcheron",
          places: 2
        },
        {
          metier: "Mineur",
          places: 2
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 10
        },
        {
          ressource: "Pierre",
          valeur: 4
        }
      ],
      requis: "Camp de b\xFBcheron",
      remplaceBatiment: [
        "Camp de b\xFBcheron",
        "Camp de mineur"
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "Silo \xE0 grain",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 2,
      emplacements: [
        {
          metier: "\xC9leveur",
          places: 3
        },
        {
          metier: "Fermier",
          places: 7
        }
      ],
      remplaceBatiment: [
        "Grange"
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 20
        },
        {
          ressource: "Bois",
          valeur: 8
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "Moulin \xE0 vent",
      cout: "",
      production: "",
      description: "",
      effets: [
        {
          ressource: "Charbon",
          quantite: -1
        }
      ],
      rangMinHabitation: 2,
      emplacements: [
        {
          metier: "\xC9leveur",
          places: 4
        },
        {
          metier: "Fermier",
          places: 15
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 15
        },
        {
          ressource: "Bois",
          valeur: 4
        },
        {
          ressource: "B\xE9tail",
          valeur: 4
        }
      ],
      requis: "Silo \xE0 grain",
      remplaceBatiment: [
        "Silo \xE0 grain",
        "Grange"
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "Place du march\xE9",
      cout: "",
      production: "",
      description: "",
      routesApportees: 1,
      effets: [],
      rangMinHabitation: 2,
      emplacements: [
        {
          metier: "Commer\xE7ant",
          places: 6
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 20
        },
        {
          ressource: "Soie",
          valeur: 6
        }
      ],
      requis: "Echoppe"
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "Port de commerce",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 2,
      emplacements: [
        {
          metier: "P\xEAcheur",
          places: 4
        },
        {
          metier: "Commer\xE7ant",
          places: 10
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 20
        },
        {
          ressource: "Bois",
          valeur: 4
        },
        {
          ressource: "Soie",
          valeur: 4
        }
      ],
      requis: "Ponton"
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "Port de p\xEAche",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 2,
      emplacements: [
        {
          metier: "P\xEAcheur",
          places: 6
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 20
        },
        {
          ressource: "B\xE9tail",
          valeur: 4
        },
        {
          ressource: "Bois",
          valeur: 4
        }
      ],
      requis: "Ponton"
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "Clinique",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 2,
      emplacements: [
        {
          metier: "Gu\xE9risseur",
          places: 5
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 30
        },
        {
          ressource: "Pierre",
          valeur: 6
        }
      ],
      requis: "Herboristerie"
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Guilde",
      nom: "Guilde des artisans de la terre",
      cout: "",
      production: "",
      description: "",
      effets: [
        {
          ressource: "Charbon",
          quantite: -1
        }
      ],
      rangMinHabitation: 2,
      emplacements: [
        {
          metier: "Fermier",
          places: 30
        }
      ],
      remplaceBatiment: [
        "Moulin \xE0 vent"
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 40
        },
        {
          ressource: "Bois",
          valeur: 16
        },
        {
          ressource: "B\xE9tail",
          valeur: 6
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Militaire",
      nom: "Barraquements",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 3,
      emplacements: [
        {
          metier: "Garde",
          places: 4
        }
      ],
      requis: "Caserne",
      couts: [
        {
          ressource: "Or",
          valeur: 25
        },
        {
          ressource: "Fer",
          valeur: 4
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Militaire",
      nom: "Banlieue",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 3,
      requis: "Quartier interm\xE9diaire",
      couts: [
        {
          ressource: "Or",
          valeur: 40
        },
        {
          ressource: "Fer",
          valeur: 10
        },
        {
          ressource: "Bois",
          valeur: 10
        }
      ],
      domicilesApportes: [
        {
          domicile: "Maison",
          nombre: 40
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "Complexe d'exploitation maritime",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 3,
      emplacements: [
        {
          metier: "Commer\xE7ant",
          places: 24
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 50
        },
        {
          ressource: "Bois",
          valeur: 10
        },
        {
          ressource: "Fer",
          valeur: 4
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "Usine",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 3,
      emplacements: [
        {
          metier: "B\xFBcheron",
          places: 2
        },
        {
          metier: "Mineur",
          places: 2
        },
        {
          metier: "Forgeron",
          places: 2
        },
        {
          metier: "Tisseur",
          places: 2
        },
        {
          metier: "Charbonnier",
          places: 2
        }
      ],
      requis: "Camp de travailleurs",
      couts: [
        {
          ressource: "Or",
          valeur: 20
        },
        {
          ressource: "Fer",
          valeur: 6
        },
        {
          ressource: "Charbon",
          valeur: 8
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "Plateforme commerciale",
      cout: "",
      production: "",
      description: "",
      routesApportees: 2,
      effets: [],
      rangMinHabitation: 3,
      requis: "Place du march\xE9",
      couts: [
        {
          ressource: "Or",
          valeur: 40
        },
        {
          ressource: "Bois",
          valeur: 12
        },
        {
          ressource: "Soie",
          valeur: 4
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Economique",
      nom: "H\xF4pital",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 3,
      emplacements: [
        {
          metier: "Gu\xE9risseur",
          places: 10
        }
      ],
      requis: "Clinique",
      couts: [
        {
          ressource: "Or",
          valeur: 40
        },
        {
          ressource: "Pierre",
          valeur: 10
        },
        {
          ressource: "Fer",
          valeur: 4
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Guilde",
      nom: "Guilde des bourgeois",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 3,
      requis: "Banlieue",
      couts: [
        {
          ressource: "Or",
          valeur: 60
        },
        {
          ressource: "Charbon",
          valeur: 10
        },
        {
          ressource: "Soie",
          valeur: 10
        }
      ],
      domicilesApportes: [
        {
          domicile: "Maison de notable",
          nombre: 20
        }
      ],
      multProductionBourgeois: 1.5
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Guilde",
      nom: "Guilde des marchands",
      cout: "",
      production: "",
      description: "",
      routesApportees: 2,
      effets: [
        {
          ressource: "Charbon",
          quantite: -1
        }
      ],
      rangMinHabitation: 3,
      requis: "Plateforme commerciale",
      remplaceBatiment: [
        "Plateforme commerciale"
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 30
        },
        {
          ressource: "Charbon",
          valeur: 8
        },
        {
          ressource: "Soie",
          valeur: 8
        }
      ],
      multRevenusCommerce: 1.5,
      effetPlateau: "port\xE9e des routes commerciales du pays +6 cases (effet de plateau)"
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ville",
      famille: "Guilde",
      nom: "Guilde des marins",
      cout: "",
      production: "",
      description: "",
      effets: [
        {
          ressource: "Charbon",
          quantite: -1
        }
      ],
      rangMinHabitation: 3,
      emplacements: [
        {
          metier: "Commer\xE7ant",
          places: 40
        }
      ],
      requis: "Complexe d'exploitation maritime",
      remplaceBatiment: [
        "Complexe d'exploitation maritime"
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 50
        },
        {
          ressource: "Fer",
          valeur: 4
        },
        {
          ressource: "Charbon",
          valeur: 6
        }
      ],
      bonusMetierParHabitant: [
        {
          metier: "Commer\xE7ant",
          ressource: "Or",
          valeur: 0.5
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Militaire",
      nom: "Poste de garde",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 1,
      emplacements: [
        {
          metier: "Garde",
          places: 4
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 25
        },
        {
          ressource: "Fer",
          valeur: 4
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 10
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Militaire",
      nom: "Herses",
      cout: "",
      production: "",
      description: "",
      rangMinHabitation: 1,
      couts: [
        {
          ressource: "Or",
          valeur: 4
        },
        {
          ressource: "Bois",
          valeur: 2
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Militaire",
      nom: "Terrain d'entrainement",
      reductionLeveeArmee: 10,
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 1,
      couts: [
        {
          ressource: "Or",
          valeur: 12
        },
        {
          ressource: "Bois",
          valeur: 3
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "Camp de b\xFBcheron",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 1,
      emplacements: [
        {
          metier: "B\xFBcheron",
          places: 2
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 5
        },
        {
          ressource: "B\xE9tail",
          valeur: 1
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "Camp de mineur",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 1,
      emplacements: [
        {
          metier: "Mineur",
          places: 2
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 5
        },
        {
          ressource: "Charbon",
          valeur: 1
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "Camp d'ing\xE9nieur",
      cout: "",
      production: "",
      description: "",
      rangMinHabitation: 1,
      couts: [
        {
          ressource: "Or",
          valeur: 10
        },
        {
          ressource: "Bois",
          valeur: 2
        },
        {
          ressource: "Fer",
          valeur: 2
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "Conjuratoire",
      cout: "",
      production: "",
      description: "",
      effets: [
        {
          ressource: "Tourisme",
          quantite: 15
        }
      ],
      rangMinHabitation: 1,
      couts: [
        {
          ressource: "Or",
          valeur: 10
        },
        {
          ressource: "Pierre",
          valeur: 2
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "Ecole \xE9l\xE9mentaire",
      cout: "",
      production: "",
      description: "",
      effets: [
        {
          ressource: "Or",
          quantite: -1
        }
      ],
      rangMinHabitation: 1,
      emplacements: [
        {
          metier: "Professeur",
          places: 1
        },
        {
          metier: "Scientifique",
          places: 1
        }
      ],
      ecoleRang: 1,
      couts: [
        {
          ressource: "Or",
          valeur: 10
        },
        {
          ressource: "B\xE9tail",
          valeur: 2
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "Echoppe",
      cout: "",
      production: "",
      description: "",
      routesApportees: 1,
      effets: [],
      rangMinHabitation: 1,
      emplacements: [
        {
          metier: "Commer\xE7ant",
          places: 2
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 12
        },
        {
          ressource: "Bois",
          valeur: 2
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "Herboristerie",
      cout: "",
      production: "",
      description: "",
      rangMinHabitation: 1,
      malContraction: 0.05,
      bonusGuerison: 0.05,
      couts: [
        {
          ressource: "Or",
          valeur: 10
        },
        {
          ressource: "Pierre",
          valeur: 2
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Militaire",
      nom: "Bas quartier",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 1,
      couts: [
        {
          ressource: "Bois",
          valeur: 10
        },
        {
          ressource: "Or",
          valeur: 10
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 20
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Militaire",
      nom: "Caserne",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 2,
      emplacements: [
        {
          metier: "Garde",
          places: 4
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 25
        },
        {
          ressource: "Fer",
          valeur: 4
        }
      ],
      requis: "Poste de garde",
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 10
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Militaire",
      nom: "R\xE9seau de routes",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 2,
      couts: [
        {
          ressource: "Or",
          valeur: 15
        },
        {
          ressource: "Soie",
          valeur: 4
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Militaire",
      nom: "Tour de sorcier",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 2,
      emplacements: [
        {
          metier: "Scientifique",
          places: 1
        }
      ],
      domicilesApportes: [
        {
          domicile: "Maison de notable",
          nombre: 1
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 40
        },
        {
          ressource: "Pierre",
          valeur: 12
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Militaire",
      nom: "Ecole militaire",
      reductionLeveeArmee: 25,
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 2,
      emplacements: [
        {
          metier: "Garde",
          places: 2
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 20
        },
        {
          ressource: "Bois",
          valeur: 6
        },
        {
          ressource: "Fer",
          valeur: 4
        }
      ],
      requis: "Terrain d'entrainement"
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Militaire",
      nom: "Quartier interm\xE9diaire",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 2,
      domicilesApportes: [
        {
          domicile: "Maison",
          nombre: 20
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 20
        },
        {
          ressource: "Pierre",
          valeur: 10
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Militaire",
      nom: "Haut quartier",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 2,
      domicilesApportes: [
        {
          domicile: "Maison de notable",
          nombre: 20
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 40
        },
        {
          ressource: "Soie",
          valeur: 10
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "Clinique",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 2,
      emplacements: [
        {
          metier: "Gu\xE9risseur",
          places: 5
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 30
        },
        {
          ressource: "Pierre",
          valeur: 6
        }
      ],
      requis: "Herboristerie"
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "Cabinet d'astronomie",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 2,
      emplacements: [
        {
          metier: "Scientifique",
          places: 4
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 5
        },
        {
          ressource: "Pierre",
          valeur: 4
        },
        {
          ressource: "Soie",
          valeur: 2
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "Chapelle",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 2,
      emplacements: [
        {
          metier: "Artiste",
          places: 7
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 10
        },
        {
          ressource: "Pierre",
          valeur: 8
        }
      ],
      requis: "Conjuratoire"
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "Ecole interm\xE9diaire",
      cout: "",
      production: "",
      description: "",
      effets: [
        {
          ressource: "Or",
          quantite: -3
        }
      ],
      rangMinHabitation: 2,
      emplacements: [
        {
          metier: "Professeur",
          places: 2
        },
        {
          metier: "Scientifique",
          places: 1
        }
      ],
      remplaceBatiment: [
        "Ecole \xE9l\xE9mentaire"
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 16
        },
        {
          ressource: "Pierre",
          valeur: 6
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Guilde",
      nom: "Guilde des explorateurs",
      reductionLeveeArmee: 20,
      cout: "",
      production: "",
      description: "",
      effets: [
        {
          ressource: "Charbon",
          quantite: -1
        }
      ],
      rangMinHabitation: 2,
      couts: [
        {
          ressource: "Or",
          valeur: 60
        },
        {
          ressource: "Pierre",
          valeur: 6
        },
        {
          ressource: "Soie",
          valeur: 12
        }
      ],
      requis: "Ecole militaire"
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "D\xE9l\xE9gation",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 1,
      emissairesApportes: 1,
      couts: [
        {
          ressource: "Or",
          valeur: 10
        },
        {
          ressource: "Soie",
          valeur: 4
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "Chancellerie",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 2,
      emissairesApportes: 2,
      requis: "D\xE9l\xE9gation",
      remplaceBatiment: [
        "D\xE9l\xE9gation"
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 20
        },
        {
          ressource: "Pierre",
          valeur: 4
        },
        {
          ressource: "Soie",
          valeur: 6
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "Ambassade",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 3,
      emissairesApportes: 4,
      requis: "Chancellerie",
      remplaceBatiment: [
        "Chancellerie"
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 40
        },
        {
          ressource: "Charbon",
          valeur: 4
        },
        {
          ressource: "Soie",
          valeur: 10
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Militaire",
      nom: "Barraquements",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 3,
      emplacements: [
        {
          metier: "Garde",
          places: 4
        }
      ],
      requis: "Caserne",
      couts: [
        {
          ressource: "Or",
          valeur: 25
        },
        {
          ressource: "Fer",
          valeur: 4
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Militaire",
      nom: "Responsable des voies",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 3,
      couts: [
        {
          ressource: "Or",
          valeur: 30
        },
        {
          ressource: "Soie",
          valeur: 6
        }
      ],
      effetPlateau: "les cases \xE0 3 cases ou moins de cette habitation ne co\xFBtent qu'1 PM \xE0 franchir (effet de plateau)"
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Militaire",
      nom: "Banlieue",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 3,
      requis: "Quartier interm\xE9diaire",
      couts: [
        {
          ressource: "Or",
          valeur: 40
        },
        {
          ressource: "Fer",
          valeur: 10
        },
        {
          ressource: "Bois",
          valeur: 10
        }
      ],
      domicilesApportes: [
        {
          domicile: "Maison",
          nombre: 40
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "Commanderie",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 3,
      emplacements: [
        {
          metier: "Artiste",
          places: 10
        }
      ],
      requis: "Chapelle",
      couts: [
        {
          ressource: "Or",
          valeur: 40
        },
        {
          ressource: "Pierre",
          valeur: 12
        },
        {
          ressource: "Fer",
          valeur: 6
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "Ecole sup\xE9rieure",
      cout: "",
      production: "",
      description: "",
      effets: [
        {
          ressource: "Or",
          quantite: -6
        }
      ],
      rangMinHabitation: 3,
      emplacements: [
        {
          metier: "Professeur",
          places: 4
        },
        {
          metier: "Scientifique",
          places: 2
        }
      ],
      ecoleRang: 3,
      requis: "Ecole interm\xE9diaire",
      remplaceBatiment: [
        "Ecole interm\xE9diaire"
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 20
        },
        {
          ressource: "Pierre",
          valeur: 10
        },
        {
          ressource: "Soie",
          valeur: 4
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "Institut de recherche",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 3,
      emplacements: [
        {
          metier: "Scientifique",
          places: 8
        }
      ],
      requis: "Cabinet d'astronomie",
      couts: [
        {
          ressource: "Or",
          valeur: 20
        },
        {
          ressource: "Pierre",
          valeur: 6
        },
        {
          ressource: "Soie",
          valeur: 8
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Economique",
      nom: "H\xF4pital",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 3,
      emplacements: [
        {
          metier: "Gu\xE9risseur",
          places: 10
        }
      ],
      requis: "Clinique",
      couts: [
        {
          ressource: "Or",
          valeur: 40
        },
        {
          ressource: "Pierre",
          valeur: 10
        },
        {
          ressource: "Fer",
          valeur: 4
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Guilde",
      nom: "Guilde des bourgeois",
      cout: "",
      production: "",
      description: "",
      effets: [],
      rangMinHabitation: 3,
      requis: "Banlieue",
      couts: [
        {
          ressource: "Or",
          valeur: 60
        },
        {
          ressource: "Charbon",
          valeur: 10
        },
        {
          ressource: "Soie",
          valeur: 10
        }
      ],
      domicilesApportes: [
        {
          domicile: "Maison de notable",
          nombre: 20
        }
      ],
      multProductionBourgeois: 1.5
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Guilde",
      nom: "Guilde des diplomates",
      cout: "",
      production: "",
      description: "",
      effets: [
        {
          ressource: "Charbon",
          quantite: -1
        }
      ],
      rangMinHabitation: 3,
      emissairesApportes: 7,
      requis: "Ambassade",
      remplaceBatiment: [
        "Ambassade"
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 60
        },
        {
          ressource: "Charbon",
          valeur: 8
        },
        {
          ressource: "Soie",
          valeur: 20
        }
      ],
      tributVassalPlus: 0.05
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Guilde",
      nom: "Guilde des \xE9vang\xE9listes",
      cout: "",
      production: "",
      description: "",
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
      rangMinHabitation: 3,
      requis: "Commanderie",
      remplaceBatiment: [
        "Commanderie"
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 60
        },
        {
          ressource: "Fer",
          valeur: 12
        }
      ],
      conversionLocalePlus: 0.1
    },
    {
      categorie: "B\xE2timent",
      groupe: "Ch\xE2teau",
      famille: "Guilde",
      nom: "Guilde des savants",
      cout: "",
      production: "",
      description: "",
      effets: [
        {
          ressource: "Charbon",
          quantite: -1
        }
      ],
      rangMinHabitation: 3,
      emplacements: [
        {
          metier: "Scientifique",
          places: 15
        }
      ],
      requis: "Institut de recherche",
      remplaceBatiment: [
        "Institut de recherche"
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 50
        },
        {
          ressource: "Charbon",
          valeur: 6
        },
        {
          ressource: "Soie",
          valeur: 8
        }
      ],
      scienceProfesseurPlus: 0.05
    },
    {
      categorie: "B\xE2timent",
      groupe: "Capitale",
      famille: "Capitale",
      nom: "Banque centrale",
      cout: "",
      production: "",
      description: "",
      effets: [
        {
          ressource: "Or",
          quantite: 8
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 12
        },
        {
          ressource: "Bois",
          valeur: 6
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Capitale",
      famille: "Capitale",
      nom: "Grande caserne",
      reductionLeveeArmee: 8,
      cout: "",
      production: "",
      description: "",
      effets: [
        {
          ressource: "Garnison",
          quantite: 40
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 12
        },
        {
          ressource: "Bois",
          valeur: 6
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Capitale",
      famille: "Capitale",
      nom: "H\xF4tel de tourisme",
      cout: "",
      production: "",
      description: "",
      effets: [
        {
          ressource: "Tourisme",
          quantite: 12
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 12
        },
        {
          ressource: "Bois",
          valeur: 6
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Capitale",
      famille: "Capitale",
      nom: "Jardin int\xE9rieur",
      cout: "",
      production: "",
      description: "",
      effets: [
        {
          ressource: "Nourriture",
          quantite: 14
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 12
        },
        {
          ressource: "Bois",
          valeur: 6
        }
      ]
    },
    {
      categorie: "B\xE2timent",
      groupe: "Capitale",
      famille: "Capitale",
      nom: "Observatoire",
      cout: "",
      production: "",
      description: "",
      effets: [
        {
          ressource: "Science",
          quantite: 1
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 12
        },
        {
          ressource: "Bois",
          valeur: 6
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Baleinier",
      terrain: "Baleine",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "P\xEAcheur",
          places: 3
        },
        {
          metier: "Commer\xE7ant",
          places: 2
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 8
        },
        {
          ressource: "Bois",
          valeur: 3
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "B\xE2teau de p\xEAche",
      terrain: "Crabe",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "P\xEAcheur",
          places: 2
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 8
        },
        {
          ressource: "Bois",
          valeur: 3
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Carri\xE8re",
      terrain: "Pierre",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "Mineur",
          places: 2
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 8
        },
        {
          ressource: "Bois",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 5
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Champ",
      terrain: "Plaine",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "Fermier",
          places: 3
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 8
        },
        {
          ressource: "Bois",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 5
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Foire",
      terrain: "Plaine ou D\xE9sert",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "Artiste",
          places: 1
        },
        {
          metier: "Commer\xE7ant",
          places: 1
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 8
        },
        {
          ressource: "Bois",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 5
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Mine de Charbon",
      terrain: "Charbon",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "Charbonnier",
          places: 2
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 8
        },
        {
          ressource: "Bois",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 5
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Mine de Fer",
      terrain: "Fer",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "Forgeron",
          places: 2
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 8
        },
        {
          ressource: "Bois",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 5
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Mine d'Or",
      terrain: "Or",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "Commer\xE7ant",
          places: 6
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 8
        },
        {
          ressource: "Bois",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 5
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Observatoire",
      terrain: "Geyser/Volcan",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "Scientifique",
          places: 1
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 8
        },
        {
          ressource: "Bois",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 5
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "P\xE2turage",
      terrain: "B\xE9tail",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "\xC9leveur",
          places: 2
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 8
        },
        {
          ressource: "Bois",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 5
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Rizi\xE8re",
      terrain: "Marais",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "Fermier",
          places: 4
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 8
        },
        {
          ressource: "Bois",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 5
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Scierie",
      terrain: "For\xEAt",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "B\xFBcheron",
          places: 2
        },
        {
          metier: "Chasseur",
          places: 2
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 8
        },
        {
          ressource: "Bois",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 5
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "S\xE9riciculture",
      terrain: "Soie",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "Tisseur",
          places: 2
        },
        {
          metier: "Chasseur",
          places: 2
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 8
        },
        {
          ressource: "Bois",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 5
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Site arch\xE9ologique",
      terrain: "Ruine",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "Arch\xE9ologue",
          places: 2
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 8
        },
        {
          ressource: "Bois",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 5
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Baleinier (tier 2)",
      terrain: "Baleine",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "P\xEAcheur",
          places: 5
        },
        {
          metier: "Commer\xE7ant",
          places: 5
        }
      ],
      rangMinHabitation: 2,
      remplaceAmenagement: "Baleinier",
      couts: [
        {
          ressource: "Or",
          valeur: 15
        },
        {
          ressource: "Pierre",
          valeur: 3
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Baleinier (tier 3)",
      terrain: "Baleine",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "P\xEAcheur",
          places: 7
        },
        {
          metier: "Commer\xE7ant",
          places: 10
        }
      ],
      rangMinHabitation: 3,
      remplaceAmenagement: "Baleinier (tier 2)",
      couts: [
        {
          ressource: "Or",
          valeur: 35
        },
        {
          ressource: "Fer",
          valeur: 3
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "B\xE2teau de p\xEAche (tier 2)",
      terrain: "Crabe",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "P\xEAcheur",
          places: 4
        }
      ],
      rangMinHabitation: 2,
      remplaceAmenagement: "B\xE2teau de p\xEAche",
      couts: [
        {
          ressource: "Or",
          valeur: 15
        },
        {
          ressource: "Pierre",
          valeur: 3
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "B\xE2teau de p\xEAche (tier 3)",
      terrain: "Crabe",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "P\xEAcheur",
          places: 7
        }
      ],
      rangMinHabitation: 3,
      remplaceAmenagement: "B\xE2teau de p\xEAche (tier 2)",
      couts: [
        {
          ressource: "Or",
          valeur: 35
        },
        {
          ressource: "Fer",
          valeur: 3
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Carri\xE8re (tier 2)",
      terrain: "Pierre",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "Mineur",
          places: 4
        }
      ],
      rangMinHabitation: 2,
      remplaceAmenagement: "Carri\xE8re",
      couts: [
        {
          ressource: "Or",
          valeur: 15
        },
        {
          ressource: "Pierre",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 8
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Carri\xE8re (tier 3)",
      terrain: "Pierre",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "Mineur",
          places: 6
        },
        {
          metier: "Charbonnier",
          places: 2
        }
      ],
      rangMinHabitation: 3,
      remplaceAmenagement: "Carri\xE8re (tier 2)",
      couts: [
        {
          ressource: "Or",
          valeur: 35
        },
        {
          ressource: "Fer",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 10
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Champ (tier 2)",
      terrain: "Plaine",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "Fermier",
          places: 6
        }
      ],
      rangMinHabitation: 2,
      remplaceAmenagement: "Champ",
      couts: [
        {
          ressource: "Or",
          valeur: 15
        },
        {
          ressource: "Pierre",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 8
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Champ (tier 3)",
      terrain: "Plaine",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "Fermier",
          places: 10
        }
      ],
      rangMinHabitation: 3,
      remplaceAmenagement: "Champ (tier 2)",
      couts: [
        {
          ressource: "Or",
          valeur: 35
        },
        {
          ressource: "Fer",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 10
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Foire (tier 2)",
      terrain: "Plaine ou D\xE9sert",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "Artiste",
          places: 2
        },
        {
          metier: "Commer\xE7ant",
          places: 2
        }
      ],
      rangMinHabitation: 2,
      remplaceAmenagement: "Foire",
      couts: [
        {
          ressource: "Or",
          valeur: 15
        },
        {
          ressource: "Pierre",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 8
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Foire (tier 3)",
      terrain: "Plaine ou D\xE9sert",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "Artiste",
          places: 4
        },
        {
          metier: "Commer\xE7ant",
          places: 4
        }
      ],
      rangMinHabitation: 3,
      remplaceAmenagement: "Foire (tier 2)",
      couts: [
        {
          ressource: "Or",
          valeur: 35
        },
        {
          ressource: "Fer",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 10
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Mine de Charbon (tier 2)",
      terrain: "Charbon",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "Charbonnier",
          places: 4
        }
      ],
      rangMinHabitation: 2,
      remplaceAmenagement: "Mine de Charbon",
      couts: [
        {
          ressource: "Or",
          valeur: 15
        },
        {
          ressource: "Pierre",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 8
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Mine de Charbon (tier 3)",
      terrain: "Charbon",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "Charbonnier",
          places: 6
        }
      ],
      rangMinHabitation: 3,
      remplaceAmenagement: "Mine de Charbon (tier 2)",
      couts: [
        {
          ressource: "Or",
          valeur: 35
        },
        {
          ressource: "Fer",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 10
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Mine de Fer (tier 2)",
      terrain: "Fer",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "Forgeron",
          places: 4
        },
        {
          metier: "Garde",
          places: 1
        }
      ],
      rangMinHabitation: 2,
      remplaceAmenagement: "Mine de Fer",
      couts: [
        {
          ressource: "Or",
          valeur: 15
        },
        {
          ressource: "Pierre",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 8
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Mine de Fer (tier 3)",
      terrain: "Fer",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "Forgeron",
          places: 6
        },
        {
          metier: "Garde",
          places: 3
        }
      ],
      rangMinHabitation: 3,
      remplaceAmenagement: "Mine de Fer (tier 2)",
      couts: [
        {
          ressource: "Or",
          valeur: 35
        },
        {
          ressource: "Fer",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 10
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Mine d'Or (tier 2)",
      terrain: "Or",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "Commer\xE7ant",
          places: 14
        }
      ],
      rangMinHabitation: 2,
      remplaceAmenagement: "Mine d'Or",
      couts: [
        {
          ressource: "Or",
          valeur: 15
        },
        {
          ressource: "Pierre",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 8
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Mine d'Or (tier 3)",
      terrain: "Or",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "Commer\xE7ant",
          places: 24
        }
      ],
      rangMinHabitation: 3,
      remplaceAmenagement: "Mine d'Or (tier 2)",
      couts: [
        {
          ressource: "Or",
          valeur: 35
        },
        {
          ressource: "Fer",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 10
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Observatoire (tier 2)",
      terrain: "Geyser/Volcan",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "Scientifique",
          places: 3
        }
      ],
      rangMinHabitation: 2,
      remplaceAmenagement: "Observatoire",
      couts: [
        {
          ressource: "Or",
          valeur: 15
        },
        {
          ressource: "Pierre",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 8
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Observatoire (tier 3)",
      terrain: "Geyser/Volcan",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "Scientifique",
          places: 5
        }
      ],
      rangMinHabitation: 3,
      remplaceAmenagement: "Observatoire (tier 2)",
      couts: [
        {
          ressource: "Or",
          valeur: 35
        },
        {
          ressource: "Fer",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 10
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "P\xE2turage (tier 2)",
      terrain: "B\xE9tail",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "\xC9leveur",
          places: 5
        }
      ],
      rangMinHabitation: 2,
      remplaceAmenagement: "P\xE2turage",
      couts: [
        {
          ressource: "Or",
          valeur: 15
        },
        {
          ressource: "Pierre",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 8
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "P\xE2turage (tier 3)",
      terrain: "B\xE9tail",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "\xC9leveur",
          places: 8
        }
      ],
      rangMinHabitation: 3,
      remplaceAmenagement: "P\xE2turage (tier 2)",
      couts: [
        {
          ressource: "Or",
          valeur: 35
        },
        {
          ressource: "Fer",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 10
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Rizi\xE8re (tier 2)",
      terrain: "Marais",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "Fermier",
          places: 8
        }
      ],
      rangMinHabitation: 2,
      remplaceAmenagement: "Rizi\xE8re",
      couts: [
        {
          ressource: "Or",
          valeur: 15
        },
        {
          ressource: "Pierre",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 8
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Rizi\xE8re (tier 3)",
      terrain: "Marais",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "Fermier",
          places: 15
        }
      ],
      rangMinHabitation: 3,
      remplaceAmenagement: "Rizi\xE8re (tier 2)",
      couts: [
        {
          ressource: "Or",
          valeur: 35
        },
        {
          ressource: "Fer",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 10
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Scierie (tier 2)",
      terrain: "For\xEAt",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "B\xFBcheron",
          places: 4
        },
        {
          metier: "Tisseur",
          places: 2
        }
      ],
      rangMinHabitation: 2,
      remplaceAmenagement: "Scierie",
      couts: [
        {
          ressource: "Or",
          valeur: 15
        },
        {
          ressource: "Pierre",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 8
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Scierie (tier 3)",
      terrain: "For\xEAt",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "B\xFBcheron",
          places: 6
        },
        {
          metier: "Tisseur",
          places: 2
        }
      ],
      rangMinHabitation: 3,
      remplaceAmenagement: "Scierie (tier 2)",
      couts: [
        {
          ressource: "Or",
          valeur: 35
        },
        {
          ressource: "Fer",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 10
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "S\xE9riciculture (tier 2)",
      terrain: "Soie",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "Tisseur",
          places: 4
        },
        {
          metier: "Commer\xE7ant",
          places: 2
        }
      ],
      rangMinHabitation: 2,
      remplaceAmenagement: "S\xE9riciculture",
      couts: [
        {
          ressource: "Or",
          valeur: 15
        },
        {
          ressource: "Pierre",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 8
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "S\xE9riciculture (tier 3)",
      terrain: "Soie",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "Tisseur",
          places: 6
        },
        {
          metier: "Commer\xE7ant",
          places: 5
        }
      ],
      rangMinHabitation: 3,
      remplaceAmenagement: "S\xE9riciculture (tier 2)",
      couts: [
        {
          ressource: "Or",
          valeur: 35
        },
        {
          ressource: "Fer",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 10
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Site arch\xE9ologique (tier 2)",
      terrain: "Ruine",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "Arch\xE9ologue",
          places: 4
        }
      ],
      rangMinHabitation: 2,
      remplaceAmenagement: "Site arch\xE9ologique",
      couts: [
        {
          ressource: "Or",
          valeur: 15
        },
        {
          ressource: "Pierre",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 8
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Terrain",
      famille: "",
      nom: "Site arch\xE9ologique (tier 3)",
      terrain: "Ruine",
      cout: "",
      production: "",
      description: "",
      effets: [],
      emplacements: [
        {
          metier: "Arch\xE9ologue",
          places: 7
        }
      ],
      rangMinHabitation: 3,
      remplaceAmenagement: "Site arch\xE9ologique (tier 2)",
      couts: [
        {
          ressource: "Or",
          valeur: 35
        },
        {
          ressource: "Fer",
          valeur: 3
        }
      ],
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 10
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Merveille naturelle",
      famille: "",
      nom: "Caverne de la tisseuse",
      terrain: "",
      cout: "",
      production: "+1 Soie par rang de l'habitation par tour.",
      description: "",
      effets: [],
      emplacements: [],
      couts: [
        {
          ressource: "Or",
          valeur: 12
        },
        {
          ressource: "Bois",
          valeur: 5
        }
      ],
      merveilleNaturelle: true,
      effetsParRang: [
        {
          ressource: "Soie",
          quantite: 1
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Merveille naturelle",
      famille: "",
      nom: "Jardins Flamboyants",
      terrain: "",
      cout: "",
      production: "+10 Bonheur dans l'habitation.",
      description: "",
      effets: [],
      emplacements: [],
      couts: [
        {
          ressource: "Or",
          valeur: 12
        },
        {
          ressource: "Bois",
          valeur: 5
        }
      ],
      merveilleNaturelle: true,
      bonheurApporte: 10
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Merveille naturelle",
      famille: "",
      nom: "Pic Ascendant",
      terrain: "",
      cout: "",
      production: "+1 Science par tour.",
      description: "",
      effets: [
        {
          ressource: "Science",
          quantite: 1
        }
      ],
      emplacements: [],
      couts: [
        {
          ressource: "Or",
          valeur: 12
        },
        {
          ressource: "Bois",
          valeur: 5
        }
      ],
      merveilleNaturelle: true,
      effetPlateau: "Si\xE8ge : lorsque vous attaquez une habitation, sa garnison est r\xE9duite de 30"
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Merveille naturelle",
      famille: "",
      nom: "Ruines de Seth",
      terrain: "",
      cout: "",
      production: "+2 Or et +10 Tourisme par tour.",
      description: "",
      effets: [
        {
          ressource: "Or",
          quantite: 2
        },
        {
          ressource: "Tourisme",
          quantite: 10
        }
      ],
      emplacements: [],
      couts: [
        {
          ressource: "Or",
          valeur: 12
        },
        {
          ressource: "Bois",
          valeur: 5
        }
      ],
      merveilleNaturelle: true
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Merveille naturelle",
      famille: "",
      nom: "S\xE9pulcre du Rayonnant",
      terrain: "",
      cout: "",
      production: "+20 Garnison dans l'habitation, +10 Taudis.",
      description: "",
      effets: [
        {
          ressource: "Garnison",
          quantite: 20
        }
      ],
      emplacements: [],
      couts: [
        {
          ressource: "Or",
          valeur: 12
        },
        {
          ressource: "Bois",
          valeur: 5
        }
      ],
      merveilleNaturelle: true,
      domicilesApportes: [
        {
          domicile: "Taudis",
          nombre: 10
        }
      ]
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Merveille naturelle",
      famille: "",
      nom: "Tr\xE9sor du roi sorcier",
      terrain: "",
      cout: "",
      production: "+1 emplacement de route commerciale.",
      description: "",
      effets: [],
      emplacements: [],
      couts: [
        {
          ressource: "Or",
          valeur: 12
        },
        {
          ressource: "Bois",
          valeur: 5
        }
      ],
      merveilleNaturelle: true,
      routesApportees: 1
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Merveille naturelle",
      famille: "",
      nom: "Coeur Ancestral",
      terrain: "",
      cout: "",
      production: "+1 \xE9missaire tant que poss\xE9d\xE9e.",
      description: "",
      effets: [],
      emplacements: [],
      couts: [
        {
          ressource: "Or",
          valeur: 12
        },
        {
          ressource: "Bois",
          valeur: 5
        }
      ],
      merveilleNaturelle: true,
      emissairesApportes: 1
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Merveille naturelle",
      famille: "",
      nom: "Echine du dragon",
      terrain: "",
      cout: "",
      production: "+1 Charbon et +1 Fer par tour.",
      description: "",
      effets: [
        {
          ressource: "Charbon",
          quantite: 1
        },
        {
          ressource: "Fer",
          quantite: 1
        }
      ],
      emplacements: [],
      couts: [
        {
          ressource: "Or",
          valeur: 12
        },
        {
          ressource: "Bois",
          valeur: 5
        }
      ],
      merveilleNaturelle: true
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Merveille naturelle",
      famille: "",
      nom: "Pilliers C\xE9lestes",
      terrain: "",
      cout: "",
      production: "Vos arm\xE9es ont +1 PM.",
      description: "",
      effets: [],
      emplacements: [],
      couts: [
        {
          ressource: "Or",
          valeur: 12
        },
        {
          ressource: "Bois",
          valeur: 5
        }
      ],
      merveilleNaturelle: true,
      effetPlateau: "Vos arm\xE9es ont +1 PM"
    },
    {
      categorie: "Am\xE9nagement",
      groupe: "Merveille naturelle",
      famille: "",
      nom: "Antre de Magmadon",
      terrain: "",
      cout: "",
      production: "Co\xFBt de lev\xE9e d'arm\xE9e dans cette habitation -15 Or.",
      description: "",
      effets: [],
      emplacements: [],
      couts: [
        {
          ressource: "Or",
          valeur: 12
        },
        {
          ressource: "Bois",
          valeur: 5
        }
      ],
      merveilleNaturelle: true,
      reductionLeveeArmee: 15
    }
  ],
  typesHabitation: [
    {
      type: "Ville",
      rang: "Hameau",
      cout: "",
      habitantsRequis: 0,
      domicilesDisponibles: "50 Taudis, 1 Maison de notable",
      metiersBase: [
        {
          metier: "Chasseur",
          places: 40
        },
        {
          metier: "Garde",
          places: 2
        },
        {
          metier: "Commer\xE7ant",
          places: 1
        },
        {
          metier: "Gouverneur",
          places: 1
        }
      ],
      domicilesRang: [
        {
          domicile: "Taudis",
          nombre: 50
        },
        {
          domicile: "Maison de notable",
          nombre: 1
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 20
        },
        {
          ressource: "Bois",
          valeur: 10
        },
        {
          ressource: "B\xE9tail",
          valeur: 6
        }
      ]
    },
    {
      type: "Ville",
      rang: "Cit\xE9",
      cout: "",
      habitantsRequis: 120,
      domicilesDisponibles: "100 Taudis, 20 Maisons, 1 Maison de notable",
      metiersBase: [
        {
          metier: "Chasseur",
          places: 20
        },
        {
          metier: "Garde",
          places: 4
        },
        {
          metier: "Commer\xE7ant",
          places: 5
        },
        {
          metier: "Gouverneur",
          places: 1
        }
      ],
      domicilesRang: [
        {
          domicile: "Taudis",
          nombre: 100
        },
        {
          domicile: "Maison",
          nombre: 20
        },
        {
          domicile: "Maison de notable",
          nombre: 1
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 40
        },
        {
          ressource: "B\xE9tail",
          valeur: 8
        },
        {
          ressource: "Pierre",
          valeur: 6
        }
      ]
    },
    {
      type: "Ville",
      rang: "Grande Cit\xE9",
      cout: "",
      habitantsRequis: 200,
      domicilesDisponibles: "150 Taudis, 100 Maisons, 1 Maison de notable",
      metiersBase: [
        {
          metier: "Garde",
          places: 8
        },
        {
          metier: "Commer\xE7ant",
          places: 10
        },
        {
          metier: "Gouverneur",
          places: 1
        }
      ],
      domicilesRang: [
        {
          domicile: "Taudis",
          nombre: 150
        },
        {
          domicile: "Maison",
          nombre: 100
        },
        {
          domicile: "Maison de notable",
          nombre: 1
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 40
        },
        {
          ressource: "B\xE9tail",
          valeur: 12
        },
        {
          ressource: "Charbon",
          valeur: 12
        }
      ]
    },
    {
      type: "Ch\xE2teau",
      rang: "Motte",
      cout: "",
      habitantsRequis: 0,
      domicilesDisponibles: "50 Taudis, 5 Maisons de notable",
      metiersBase: [
        {
          metier: "Chasseur",
          places: 40
        },
        {
          metier: "Garde",
          places: 4
        },
        {
          metier: "Gouverneur",
          places: 1
        }
      ],
      domicilesRang: [
        {
          domicile: "Taudis",
          nombre: 50
        },
        {
          domicile: "Maison de notable",
          nombre: 5
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 20
        },
        {
          ressource: "Bois",
          valeur: 12
        },
        {
          ressource: "B\xE9tail",
          valeur: 2
        }
      ]
    },
    {
      type: "Ch\xE2teau",
      rang: "Donjon",
      cout: "",
      habitantsRequis: 120,
      domicilesDisponibles: "100 Taudis, 10 Maisons de notable",
      metiersBase: [
        {
          metier: "Chasseur",
          places: 20
        },
        {
          metier: "Garde",
          places: 8
        },
        {
          metier: "Gouverneur",
          places: 1
        }
      ],
      domicilesRang: [
        {
          domicile: "Taudis",
          nombre: 100
        },
        {
          domicile: "Maison de notable",
          nombre: 10
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 40
        },
        {
          ressource: "B\xE9tail",
          valeur: 2
        },
        {
          ressource: "Pierre",
          valeur: 12
        }
      ]
    },
    {
      type: "Ch\xE2teau",
      rang: "Forteresse",
      cout: "",
      habitantsRequis: 200,
      domicilesDisponibles: "150 Taudis, 20 Maisons de notable",
      metiersBase: [
        {
          metier: "Garde",
          places: 16
        },
        {
          metier: "Gouverneur",
          places: 1
        }
      ],
      domicilesRang: [
        {
          domicile: "Taudis",
          nombre: 150
        },
        {
          domicile: "Maison de notable",
          nombre: 20
        }
      ],
      couts: [
        {
          ressource: "Or",
          valeur: 120
        },
        {
          ressource: "Pierre",
          valeur: 10
        },
        {
          ressource: "Fer",
          valeur: 12
        }
      ]
    }
  ],
  metiers: [
    {
      valeur1: 2,
      ressource1: "Nourriture",
      valeur2: 0,
      ressource2: "",
      description: "Dernier m\xE9tier pris (poste de repli) : change de m\xE9tier d\xE8s qu'un autre poste est disponible",
      nobleSeul: false,
      regleGenre: "vide",
      attribution: "",
      metier: "Chasseur",
      qualite: "roturier"
    },
    {
      valeur1: 5,
      ressource1: "Tourisme",
      valeur2: 0,
      ressource2: "",
      description: "",
      nobleSeul: false,
      regleGenre: "vide",
      attribution: "",
      metier: "Artiste",
      qualite: "roturier"
    },
    {
      valeur1: 1,
      ressource1: "Or",
      valeur2: 0,
      ressource2: "",
      description: "",
      nobleSeul: false,
      regleGenre: "vide",
      attribution: "",
      metier: "Commer\xE7ant",
      qualite: "bourgeois"
    },
    {
      valeur1: 0.5,
      ressource1: "Bois",
      valeur2: 0,
      ressource2: "",
      description: "",
      nobleSeul: false,
      regleGenre: "vide",
      attribution: "",
      metier: "B\xFBcheron",
      qualite: "roturier"
    },
    {
      valeur1: 0.5,
      ressource1: "Pierre",
      valeur2: 0,
      ressource2: "",
      description: "",
      nobleSeul: false,
      regleGenre: "vide",
      attribution: "",
      metier: "Mineur",
      qualite: "roturier"
    },
    {
      valeur1: 0.5,
      ressource1: "Fer",
      valeur2: 0,
      ressource2: "",
      description: "",
      nobleSeul: false,
      regleGenre: "vide",
      attribution: "",
      metier: "Forgeron",
      qualite: "roturier"
    },
    {
      valeur1: 0.5,
      ressource1: "Soie",
      valeur2: 0,
      ressource2: "",
      description: "",
      nobleSeul: false,
      regleGenre: "vide",
      attribution: "",
      metier: "Tisseur",
      qualite: "roturier"
    },
    {
      valeur1: 0.5,
      ressource1: "B\xE9tail",
      valeur2: 2,
      ressource2: "Nourriture",
      description: "",
      nobleSeul: false,
      regleGenre: "vide",
      attribution: "",
      metier: "\xC9leveur",
      qualite: "roturier"
    },
    {
      valeur1: 0.5,
      ressource1: "Charbon",
      valeur2: 0,
      ressource2: "",
      description: "",
      nobleSeul: false,
      regleGenre: "vide",
      attribution: "",
      metier: "Charbonnier",
      qualite: "roturier"
    },
    {
      valeur1: 10,
      ressource1: "Nourriture",
      valeur2: 0,
      ressource2: "",
      description: "Ne produit qu'en \xE9t\xE9",
      nobleSeul: false,
      regleGenre: "vide",
      attribution: "",
      metier: "Fermier",
      ete: true,
      qualite: "roturier"
    },
    {
      valeur1: 4,
      ressource1: "Tourisme",
      valeur2: 0,
      ressource2: "",
      description: "",
      nobleSeul: false,
      regleGenre: "vide",
      attribution: "",
      metier: "Arch\xE9ologue",
      qualite: "roturier"
    },
    {
      valeur1: 4,
      ressource1: "Nourriture",
      valeur2: 0,
      ressource2: "",
      description: "",
      nobleSeul: false,
      regleGenre: "vide",
      attribution: "",
      metier: "P\xEAcheur",
      qualite: "roturier"
    },
    {
      valeur1: 0.5,
      ressource1: "Science",
      valeur2: 0,
      ressource2: "",
      description: "",
      nobleSeul: false,
      regleGenre: "vide",
      attribution: "",
      metier: "Scientifique",
      qualite: "bourgeois"
    },
    {
      valeur1: 0,
      ressource1: "",
      valeur2: 0,
      ressource2: "",
      description: "+10 Garnison tant qu'en poste.",
      nobleSeul: false,
      regleGenre: "vide",
      attribution: "",
      metier: "Garde",
      qualite: "roturier"
    },
    {
      valeur1: 0,
      ressource1: "",
      valeur2: 0,
      ressource2: "",
      description: "+10 % de taxe de Science dans la ville",
      nobleSeul: false,
      regleGenre: "vide",
      attribution: "Ville",
      metier: "Professeur",
      qualite: "bourgeois"
    },
    {
      valeur1: 0,
      ressource1: "",
      valeur2: 0,
      ressource2: "",
      description: "+10 % de taxe d'Or dans la ville",
      nobleSeul: false,
      regleGenre: "vide",
      attribution: "",
      metier: "Banquier",
      qualite: "bourgeois"
    },
    {
      valeur1: 0,
      ressource1: "",
      valeur2: 0,
      ressource2: "",
      description: "+10 % de taxe de Tourisme dans la ville",
      nobleSeul: false,
      regleGenre: "vide",
      attribution: "",
      metier: "Troubadour",
      qualite: "bourgeois"
    },
    {
      valeur1: 0,
      ressource1: "",
      valeur2: 0,
      ressource2: "",
      description: "Chef de faction \xB7 1 par joueur",
      nobleSeul: true,
      regleGenre: "H\xE9r\xE9dit\xE9",
      attribution: "Succession",
      metier: "Dirigeant",
      qualite: "noble"
    },
    {
      valeur1: 0,
      ressource1: "",
      valeur2: 0,
      ressource2: "",
      description: "Max 1 par ville \xB7 +10 % d'imp\xF4ts",
      nobleSeul: true,
      regleGenre: "vide",
      attribution: "Manuelle",
      metier: "Gouverneur",
      qualite: "noble"
    },
    {
      valeur1: 0,
      ressource1: "",
      valeur2: 0,
      ressource2: "",
      description: "M\xEAme dynastie que le Dirigeant",
      nobleSeul: true,
      regleGenre: "H\xE9r\xE9dit\xE9",
      attribution: "Manuelle",
      metier: "H\xE9ritier",
      qualite: "noble"
    },
    {
      valeur1: 0,
      ressource1: "",
      valeur2: 0,
      ressource2: "",
      description: "",
      nobleSeul: true,
      regleGenre: "vide",
      attribution: "Manuelle",
      metier: "Ministre",
      qualite: "noble"
    },
    {
      valeur1: 0,
      ressource1: "",
      valeur2: 0,
      ressource2: "",
      description: "15 points dans une arm\xE9e",
      nobleSeul: false,
      regleGenre: "vide",
      attribution: "Arm\xE9e",
      metier: "Soldat",
      puissanceArmee: 15,
      ageMin: 16,
      ageMax: 30,
      qualite: "roturier"
    },
    {
      valeur1: 0,
      ressource1: "",
      valeur2: 0,
      ressource2: "",
      description: "45 points, unit\xE9 de type Commandant",
      nobleSeul: true,
      regleGenre: "vide",
      attribution: "Arm\xE9e",
      metier: "Commandant",
      puissanceArmee: 45,
      qualite: "noble"
    },
    {
      valeur1: 0,
      ressource1: "",
      valeur2: 0,
      ressource2: "",
      description: "+2 % de chances de gu\xE9rison et \u22122 % de risque de contracter la maladie pour la ville tant qu'en poste.",
      nobleSeul: false,
      regleGenre: "vide",
      attribution: "",
      metier: "Gu\xE9risseur",
      qualite: "roturier"
    }
  ],
  metiersEffets: [
    {
      effet: "Il s'agit d'une unit\xE9 de type Commandant.",
      revocation: "10  Or",
      metier: "Commandant"
    },
    {
      effet: "Un de vos personnage doit poss\xE9der ce titre, s'il meurt, d\xE9clenchez une succession. Ce titre n'est pas exclusif.",
      revocation: "Irr\xE9vocable",
      metier: "Dirigeant"
    },
    {
      effet: "Chaque arm\xE9e doit poss\xE9der un g\xE9n\xE9ral parmi ses commandants.",
      revocation: "20  Or",
      metier: "G\xE9n\xE9ral"
    },
    {
      effet: "Un gouverneur doit \xEAtre plac\xE9 dans une habitation et octroie +10 % d'imp\xF4ts \xE0 sa ville (les anciens bonus de garnison et d'Or sont retir\xE9s). Si une ville sans gouverneur abrite un noble, le noble le plus \xE2g\xE9 devient automatiquement gouverneur \xE0 la fin du tour.",
      revocation: "30  Or",
      metier: "Gouverneur"
    },
    {
      effet: "L'H\xE9ritier devient Dirigeant lors de la succession. Si votre h\xE9ritier meurt, d\xE9clenchez une crise.",
      revocation: "50 Or \n+  10  Soie",
      metier: "H\xE9ritier"
    },
    {
      effet: "Il s'agit d'un unit\xE9 de type Lanceur de sorts.",
      revocation: "5  Or",
      metier: "Mage"
    },
    {
      effet: "",
      revocation: "",
      metier: "Ministre"
    },
    {
      metier: "Garde",
      revocation: "",
      effet: "+10 Garnison (statique) tant que le poste est tenu ; retir\xE9 si le Garde part ou meurt. La Garnison n'est jamais par tour."
    },
    {
      metier: "Professeur",
      revocation: "",
      effet: "+10 % de taxe de Science dans sa ville. Nomination automatique par les \xE9coles (rang d'\xE9cole = nombre de Professeurs)."
    },
    {
      metier: "Banquier",
      revocation: "",
      effet: "+10 % de taxe d'Or dans sa ville. Cumul additif avec le Gouverneur et les autres m\xE9tiers de taxe."
    },
    {
      metier: "Troubadour",
      revocation: "",
      effet: "+10 % de taxe de Tourisme dans sa ville. Cumul additif avec le Gouverneur et les autres m\xE9tiers de taxe."
    }
  ],
  domiciles: [
    {
      domicile: "Taudis",
      qualite: 0
    },
    {
      domicile: "Maison",
      qualite: 1
    },
    {
      domicile: "Auberge",
      qualite: 2
    },
    {
      domicile: "Maison de notable",
      qualite: 3
    },
    {
      domicile: "Palais",
      qualite: 4
    }
  ]
};

// src/config/params.ts
var DEFAULT_PARAMS = {
  adultAge: 16,
  setupAgeMax: 50,
  adulteryRate: 0.03,
  // (REFLI — retrait migration scolaire 2026-10-28, cf. interface)
  migrationEcole: 0.1,
  migrationSuzerain: 0.02,
  migrationMonde: 0.01,
  // (Arbitrage Thibaut 2026-10-28 — flux de migration par bonheur)
  migrationBonheurMax: 0.1,
  // (v3 ADDITIVE, 6e arbitrage Thibaut 2026-10-29 : bonus ADDITIFS sur
  //  la base d'attrait du bonheur — les multiplicatifs v2 ×1,25/×1,5
  //  et les ×1,5 emploi/logement du 5e retour sont REMPLACÉS)
  migrationBonheurCulture: 0.25,
  migrationBonheurMemeJoueur: 0.5,
  migrationBonheurEmploi: 1,
  migrationBonheurLogement: 1,
  consoNourrParHab: 1,
  consoNourrBourgeois: 2,
  consoNourrNoble: 4,
  prodMultBourgeois: 1.5,
  prodMultNoble: 1,
  gainsCrediteStock: 1,
  // (2026-11-02, arbitrage Thibaut « la fertilité de base doit être
  //  à 1 » : AVANT 1,5 — une proba > 1 était cappée par le rng.chance,
  //  une femme mariée jeune sans malus concevait à CHAQUE tour. À 1,
  //  la proba de base ne dépasse jamais 100 % : les facteurs
  //  (âges, mari, traits, culture, dogmes, taxes) la font monter
  //  JUSQU'À 1 au maximum.)
  fertBaseRate: 1,
  fertSingleFactor: 0.1,
  fertTwinsRate: 0.05,
  fertTripletsRate: 1e-3,
  fertTraitFactorMin: 0,
  fertTraitFactorMax: 1.6,
  cultureFertBase: 1,
  maladieBase: 25e-4,
  maladiePente: 0.08,
  // (RETRAIT 2026-10-25 : maladieCap et modMaladieEnceinte supprimés)
  probaGuerison: 0.25,
  guerisseurGuerison: 0.02,
  guerisseurContraction: 0.02,
  modGuerisonAge: 3e-3,
  garnisonParGarde: 10,
  professeurBaseChance: 0.9,
  mariageRoturiers: 0.3,
  mariageNobles: 0.15,
  mariageMesalliance: 0.03,
  mariageBonusMetier: 0.1,
  mariageMemeCulture: 0.1,
  mariageMemeRang: 0.1,
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
  // ── Dogmes de culture (fondations 2026-10-30) ──
  //  Palier de Tourisme d'une culture ouvrant le choix d'un dogme
  //  (arbitrage Thibaut 30/10 : 50 → 1er dogme, 100 → 2e… cumul à
  //  l'infini, un dogme par palier, jamais remplaçable ; tourisme
  //  de culture = somme des villes de la culture, tous joueurs,
  //  sans les cités libres).
  palierTourismeDogme: 50,
  // Dîme du pèlerinage (bonus du pontife, arbitrage Thibaut
  //  2026-11-01) : 5 % de la production (Or, Nourriture, Science)
  //  de chaque habitation des cultures ayant un dogme, versés au
  //  pontife — prélèvement réel, un log par versement, canal
  //  « Pèlerinage » du récap. Une culture sans dogme ne paie rien.
  pelerinageTaux: 0.05,
  // Effet des taxes Faibles/Fortes — ±25 % (retour Thibaut, marqueur
  //  (z) — avant ±50 % ; les configs existantes encore aux anciens
  //  défauts sont migrées ciblément par cfgOf, champ taxes25).
  // ARBITRAGE Thibaut 2026-10-28 « changement des taxes » : la
  //  Nourriture part du côté des NAISSANCES — Faible = naissances et
  //  Nourriture ×1,25 mais toutes les autres productions ×0,75 ;
  //  Forte = l'inverse ; Moyenne = ×1 partout. Les nouvelles clés
  //  taxNourr* reçoivent les défauts ci-dessous (mergeParams les pose
  //  sur les configs existantes, sans migration) ; les clés taxOr*
  //  changent de SENS — elles ne portent plus que les ressources hors
  //  Nourriture (valeurs inchangées, les configs sauvegardées restent
  //  valides telles quelles).
  taxOrFaibles: 0.75,
  taxOrHautes: 1.25,
  taxNourrFaibles: 1.25,
  taxNourrHautes: 0.75,
  taxNaissFaibles: 1.25,
  taxNaissHautes: 0.75,
  // Replis d'armée (arbitrage 2026-10-28 : les valeurs vivent sur
  //  les lignes de métier Soldat / Commandant du référentiel).
  puissanceGeneral: 45,
  puissanceSoldat: 15,
  soldatAgeMin: 16,
  soldatAgeMax: 30,
  armeePrixOr: 1,
  armeePriXPuissance: 2,
  maxArmees: 2,
  maxMarchands: 0,
  vassalPrelevement: 0.5,
  proxRiviereNourriture: 12,
  proxMerNourriture: 7,
  metierDirigeant: "Dirigeant",
  metierGouverneur: "Gouverneur",
  metierProfesseur: "Professeur",
  metierChasseur: "Chasseur",
  metierSoldat: "Soldat",
  metierCommandant: "Commandant",
  metierGarde: "Garde",
  metierBanquier: "Banquier",
  metierTroubadour: "Troubadour",
  traitBatard: "B\xE2tard",
  traitConsanguin: "Consanguin",
  traitObstine: "Obstin\xE9",
  dynastieRoturier: "Roturier",
  maxLog: 4e3,
  maxHistory: 120,
  saisonLongueur: 3
};
var DEFAULT_PARAM_STRINGS = {
  metierHeritierStr: "H\xE9ritier"
};
var RENOMMAGES_PARAMS = {
  titreDirigeant: "metierDirigeant",
  titreGouverneur: "metierGouverneur",
  titreProfesseur: "metierProfesseur",
  titreChasseur: "metierChasseur",
  titreSoldat: "metierSoldat",
  titreCommandant: "metierCommandant",
  titreHeritierStr: "metierHeritierStr",
  mariageBonusTitre: "mariageBonusMetier"
};
function mergeParams(custom) {
  const trad = {};
  if (custom && typeof custom === "object") {
    for (const [k, v] of Object.entries(custom)) {
      if (v === void 0 || v === null || v === "") continue;
      const cle = RENOMMAGES_PARAMS[k] ?? k;
      if (RENOMMAGES_PARAMS[k] !== void 0 && trad[cle] !== void 0) continue;
      trad[cle] = v;
    }
  }
  const out = { ...DEFAULT_PARAMS, ...DEFAULT_PARAM_STRINGS, ...trad };
  return out;
}

// src/config/defaultConfig.ts
function normaliserConstruction(c) {
  const rb = c.remplaceBatiment;
  if (typeof rb !== "string") return c;
  const out = { ...c, remplaceBatiment: [rb] };
  return out;
}
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
function normaliserMetiers() {
  return ref.metiers.map((t) => ({
    metier: t.metier,
    valeur1: Number(t.valeur1) || 0,
    ressource1: t.ressource1 || "",
    valeur2: Number(t.valeur2) || 0,
    ressource2: t.ressource2 || "",
    description: t.description || "",
    nobleSeul: !!t.nobleSeul,
    regleGenre: (t.regleGenre === "vide" ? "" : t.regleGenre) || "",
    attribution: t.attribution || "",
    capParVille: t.capParVille === void 0 ? void 0 : Number(t.capParVille),
    ete: t.ete === true ? true : void 0,
    qualite: t.qualite === "bourgeois" || t.qualite === "noble" ? t.qualite : "roturier"
  }));
}
function normaliserCultures() {
  return ref.cultures.map((c) => ({
    nom: c.nom,
    heredite: c.heredite,
    // (audit express 2026-10-26 : piège falsy-zéro — un futur
    //  fertFactor 0 légal serait écrasé en 1 par `|| 1` (même
    //  famille que le bug Taudis 0 du 2026-10-25) ; le défaut 1 ne
    //  s'applique qu'aux valeurs absentes ou non finies)
    fertFactor: Number.isFinite(Number(c.fertFactor)) ? Number(c.fertFactor) : 1,
    // (refonte 12 lois, 2026-10-29 : reglePays/reglePerso RENOMMÉS
    //  regleVille/regleHabitant — repli croisé pour les référentiels
    //  anciens ; les 13 champs chiffrés des lois sont optionnels.)
    regleVille: c.regleVille || c.reglePays || "",
    regleHabitant: c.regleHabitant || c.reglePerso || "",
    taudisParHabitation: Number(c.taudisParHabitation) || void 0,
    palaisParHabitation: Number(c.palaisParHabitation) || void 0,
    prestigeSeuilBourgeois: Number(c.prestigeSeuilBourgeois) || void 0,
    scientifiqueParBatiment: Number(c.scientifiqueParBatiment) || void 0,
    maladieContractMod: Number(c.maladieContractMod) || void 0,
    tourismeParNoble: Number(c.tourismeParNoble) || void 0,
    nourrEteParFermier: Number(c.nourrEteParFermier) || void 0,
    caravanesSeuilAmenagements: Number(c.caravanesSeuilAmenagements) || void 0,
    caravanesRoutesBonus: Number(c.caravanesRoutesBonus) || void 0,
    scienceParNoble: Number(c.scienceParNoble) || void 0,
    garnisonHorsCultureParRang: Number(c.garnisonHorsCultureParRang) || void 0,
    garnisonParGardeCulture: Number(c.garnisonParGardeCulture) || void 0,
    orParGarde: Number(c.orParGarde) || void 0
  }));
}
function normaliserBatiments() {
  const out = [];
  for (const c of ref.constructions) {
    const moteur = (c.ecoleRang ?? 0) > 0 || (c.malContraction ?? 0) > 0 || (c.bonusGuerison ?? 0) > 0 || (c.bonusGuerisonGlobal ?? 0) > 0;
    if (!moteur) continue;
    if (out.some((b) => b.nom === c.nom)) continue;
    out.push({
      nom: c.nom,
      categorie: (c.ecoleRang ?? 0) > 0 ? "\xC9ducation" : "Sant\xE9",
      effet: c.description,
      ecoleRang: c.ecoleRang ?? 0,
      malContraction: c.malContraction ?? 0,
      bonusGuerison: c.bonusGuerison ?? 0,
      bonusGuerisonGlobal: c.bonusGuerisonGlobal ?? 0
    });
  }
  if (!out.some((b) => b.nom === "Guilde des m\xE9decins")) {
    out.push({
      nom: "Guilde des m\xE9decins",
      categorie: "Sant\xE9",
      effet: "B\xE2timent \xE0 effet moteur (sant\xE9 / \xE9ducation).",
      ecoleRang: 0,
      malContraction: 0,
      bonusGuerison: 0,
      bonusGuerisonGlobal: 0.1
    });
  }
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
var DEFAULT_CONFIG = {
  ressources: ["B\xE9tail", "Bois", "Charbon", "Fer", "Pierre", "Soie", "Or", "Nourriture", "Science", "Habitants", "Tourisme", "Garnison"],
  params: mergeParams(void 0),
  metiers: normaliserMetiers(),
  traits: normaliserTraits(),
  cultures: normaliserCultures(),
  regimes: ref.regimes,
  // (events / dynasties / eventEffets / dynastieEffets retirés le
  //  2026-10-24, retour arbitre — cf. docblocks plus haut)
  offrandes: ref.offrandes,
  orientations: ref.orientations,
  genres: ref.genres,
  agesPoids: ref.agesPoids,
  banquesNoms: ref.banquesNoms,
  peupleBanque: peupleBanqueOf(),
  peuples: peuplesNoms(),
  batiments: normaliserBatiments(),
  init: ref.init,
  traitsGenetiques: ref.traitsGenetiques,
  metiersEffets: ref.metiersEffets,
  peuplesLibres: ref.peuplesLibres,
  peuplesAutres: ref.peuplesAutres,
  // (NORMALISATION remplaceBatiment 2026-11-02 : le champ devient un
  //  TABLEAU ; une config sauvegardée d'avant peut porter un string —
  //  conversion à la lecture, patron idempotent.)
  constructions: ref.constructions.map(normaliserConstruction),
  typesHabitation: ref.typesHabitation,
  domiciles: (ref.domiciles ?? []).map((d) => ({
    domicile: String(d.domicile ?? ""),
    // (correctif 2026-10-24 : ÉCHELLE 0-4 — le `|| 1` transformait
    //  la qualité 0 (Masure) en 1 : le falsy zéro est un piège de
    //  l'idiome || ; Number.isFinite garde le 0 légitime)
    qualite: Number.isFinite(Number(d.qualite)) ? Number(d.qualite) : 0
  })),
  paysRangs: [],
  // rempli depuis la feuille Pays (voir normalisation ci-dessous)
  tourismeSeuils: ref.tourismeSeuils,
  // (dogmes de l'ANCIEN système retirés du référentiel le 2026-10-24,
  //  retour arbitre — RETOUR 2026-10-30 : mise en forme d'abord (table
  //  vide), puis 2e séance du 30/10 : la table des 12 DOGMES DÉFINITIFS
  //  retenus par Thibaut. Tous GÉNÉRIQUS (culture '*' : proposés au
  //  choix de toute culture) ; les effets chiffrés sont lus PAR TYPE
  //  par les hooks moteurs — cf. le docblock de DogmeDef. Un dogme est
  //  unique par culture, jamais remplaçable.)
  dogmes: [
    {
      nom: "Dogme du Travail",
      culture: "*",
      description: "Tous les sans-emplois de cette culture produisent +1 Nourriture par tour (production comme les m\xE9tiers, avant les taxes, sans multiplicateur de rang).",
      effets: [{ type: "travailNourriture", valeur: 1 }]
    },
    {
      nom: "Dogme de la Famille",
      culture: "*",
      description: "+0,1 de f\xE9condit\xE9 pour les personnages de cette culture, c\xF4t\xE9 homme et c\xF4t\xE9 femme. Le jet de conception prend en compte la f\xE9condit\xE9 de chaque \xE9poux (un \xE9poux de cette culture multiplie sa part) \u2014 mais la f\xE9condit\xE9 affich\xE9e d'une \xE9pouse ne monte jamais \xE0 cause de la culture de son mari.",
      effets: [{ type: "fecondite", valeur: 0.1 }]
    },
    {
      nom: "Dogme de la Patrie",
      culture: "*",
      description: "+2 m\xE9tiers de Garde dans les habitations de cette culture (cap cumul\xE9e aux bases du rang et aux emplacements des constructions de la ville).",
      effets: [{ type: "gardeParHabitation", valeur: 2 }]
    },
    {
      nom: "Dogme de l\u2019\xC9galit\xE9",
      culture: "*",
      description: "Les Bourgeois de cette culture ne consomment que 1 Nourriture par tour (le dogme fixe la consommation : il l\u2019emporte sur le r\xE9gime et le d\xE9faut moteur).",
      effets: [{ type: "consoNourrBourgeois", valeur: 1 }]
    },
    {
      nom: "Dogme de la Solidarit\xE9",
      culture: "*",
      description: "+5 Taudis par habitation de cette culture (culture majoritaire de la cit\xE9 \u2014 m\xEAme nature que la loi \xAB Logements \xE9largis \xBB, lits attribuables).",
      effets: [{ type: "taudisParHabitation", valeur: 5 }]
    },
    {
      nom: "Dogme de la Fraternit\xE9",
      culture: "*",
      description: "R\xE9duit les r\xE9voltes de 20 % \u2014 la m\xE9canique des r\xE9voltes n\u2019est PAS impl\xE9ment\xE9e \xE0 ce stade : le dogme est au r\xE9f\xE9rentiel mais n\u2019a AUCUN effet moteur."
    },
    {
      nom: "Dogme de la Libert\xE9",
      culture: "*",
      description: "+10 Bonheur dans les villes de cette culture (avant le plafond de 100).",
      effets: [{ type: "bonheurVille", valeur: 10 }]
    },
    {
      nom: "Dogme de la Sant\xE9",
      culture: "*",
      description: "R\xE9duit de 5 points les chances de contracter une maladie pour les personnages de cette culture (modificateur additif aux autres protections).",
      effets: [{ type: "maladieContractMod", valeur: -0.05 }]
    },
    {
      nom: "Dogme de l\u2019\xC9vangile",
      culture: "*",
      description: "Cette culture est 10 % plus importante dans la conversion culturelle (le poids de la culture dans les conversions \xD71,1).",
      effets: [{ type: "pressionCulture", valeur: 0.1 }]
    },
    {
      nom: "Dogme de la M\xE8re Patrie",
      culture: "*",
      description: "+5 % de ressources produites par les vassaux : le tribut re\xE7u par un suzerain de cette culture est \xD71,05 \u2014 le vassal paie sa part, la diff\xE9rence est cr\xE9\xE9e.",
      effets: [{ type: "tributVassal", valeur: 0.05 }]
    },
    {
      nom: "Dogme des Guerres Saintes",
      culture: "*",
      description: "La garnison des habitations d\u2019une AUTRE culture perd 40 (une fois par culture porteuse du dogme ; les villes de la culture porteuse sont prot\xE9g\xE9es ; plancher 0).",
      effets: [{ type: "garnisonHorsCulture", valeur: -40 }]
    },
    {
      nom: "Dogme du Nationalisme",
      culture: "*",
      description: "Les habitants d\u2019autres cultures vivant dans des villes de cette culture ont 15 % de chances suppl\xE9mentaires dans le tirage de conversion culturelle de se convertir \xE0 cette culture (pas de jet s\xE9par\xE9).",
      effets: [{ type: "conversionLocale", valeur: 0.15 }]
    }
  ],
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
  { nom: "Baronnie", coutOr: 0, coutNourriture: 0, serments: 0, bonus: "" },
  { nom: "Comt\xE9", coutOr: 20, coutNourriture: 40, serments: 1, bonus: "" },
  { nom: "Duch\xE9", coutOr: 30, coutNourriture: 60, serments: 2, bonus: "" },
  { nom: "Royaume", coutOr: 50, coutNourriture: 100, serments: 3, bonus: "" },
  { nom: "Empire", coutOr: 100, coutNourriture: 200, serments: 4, bonus: "" }
];
function migrateTraits(t) {
  if (!Array.isArray(t) || t.length === 0) return DEFAULT_CONFIG.traits;
  if (t.some((x) => x?.name === "Obstin\xE9")) return t;
  return DEFAULT_CONFIG.traits;
}
function migrerCultures(list) {
  const defs = DEFAULT_CONFIG.cultures;
  if (!Array.isArray(list) || list.length === 0) return defs;
  const CHAMPS = [
    "taudisParHabitation",
    "palaisParHabitation",
    "prestigeSeuilBourgeois",
    "scientifiqueParBatiment",
    "maladieContractMod",
    "tourismeParNoble",
    "nourrEteParFermier",
    "caravanesSeuilAmenagements",
    "caravanesRoutesBonus",
    "scienceParNoble",
    "garnisonHorsCultureParRang",
    "garnisonParGardeCulture",
    "orParGarde"
  ];
  return list.map((c) => {
    const d = defs.find((x) => x.nom === c?.nom);
    if (!d) return c;
    const out = {
      nom: c.nom,
      heredite: c.heredite,
      regleVille: c.regleVille ?? d.regleVille,
      regleHabitant: c.regleHabitant ?? d.regleHabitant,
      fertFactor: c.fertFactor === 1 && d.fertFactor !== 1 ? d.fertFactor : c.fertFactor ?? d.fertFactor
    };
    for (const ch of CHAMPS) {
      if (c[ch] !== void 0) out[ch] = c[ch];
      else if (d[ch] !== void 0) out[ch] = d[ch];
    }
    return out;
  });
}
function migrerRegimes(list) {
  const defs = DEFAULT_CONFIG.regimes;
  if (!Array.isArray(list) || list.length === 0) return defs;
  return list.map((r) => {
    const d = defs.find((x) => x.nom === r?.nom);
    if (!d) return r;
    return {
      nom: r.nom,
      loi: r.loi,
      leveeOrParRangPays: r.leveeOrParRangPays ?? d.leveeOrParRangPays,
      departHabitantsMult: r.departHabitantsMult ?? d.departHabitantsMult,
      orParMigrant: r.orParMigrant ?? d.orParMigrant,
      consoNourrBourgeoisRegime: r.consoNourrBourgeoisRegime ?? d.consoNourrBourgeoisRegime,
      consoNourrNobleRegime: r.consoNourrNobleRegime ?? d.consoNourrNobleRegime,
      bonheurParHabitation: r.bonheurParHabitation ?? d.bonheurParHabitation,
      tributVassalMult: r.tributVassalMult ?? d.tributVassalMult
    };
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
  for (let i = 0; i < out.length; i++) {
    const d = defauts.find((x) => x.nom === out[i].nom && x.groupe === out[i].groupe);
    if (d) out[i] = { ...d, ...out[i] };
  }
  const cles = new Set(out.map((c) => `${c.nom}|${c.groupe}`));
  for (const d of defauts) {
    if (!cles.has(`${d.nom}|${d.groupe}`)) out.push(d);
  }
  return out;
}
function realignerConstructions(list, defauts) {
  if (!Array.isArray(list)) return defauts;
  const parCle = new Map(
    defauts.map((d) => [`${d.nom}|${d.groupe}`, d])
  );
  return list.map((c) => {
    const aligne = parCle.get(`${c.nom}|${c.groupe}`);
    if (aligne) return aligne;
    return migrerDomicilesApportes(c);
  });
}
function migrerDomicilesApportes(c) {
  const t = c.taudisApportes;
  if (t == null) return c;
  const out = { ...c };
  delete out.taudisApportes;
  const dom = [...out.domicilesApportes ?? []];
  const i = dom.findIndex((e) => e.domicile === "Taudis");
  if (i >= 0) dom[i] = { domicile: "Taudis", nombre: dom[i].nombre + t };
  else dom.unshift({ domicile: "Taudis", nombre: t });
  out.domicilesApportes = dom;
  return out;
}
function parseMetiersBaseTexte(texte, metiersConnus) {
  const out = [];
  if (!texte) return out;
  const connus = metiersConnus ? new Set(metiersConnus) : void 0;
  for (const morceau of texte.split(",")) {
    const m = /^(\d+)\s+(.+)$/.exec(morceau.trim());
    if (!m) continue;
    let nom = m[2].trim();
    if (nom.endsWith("s")) nom = nom.slice(0, -1);
    if (connus && !connus.has(nom)) continue;
    const existant = out.find((e) => e.metier === nom);
    if (existant) existant.places += Number(m[1]);
    else out.push({ metier: nom, places: Number(m[1]) });
  }
  return out;
}
function migrerTypesHabitation(list) {
  if (!Array.isArray(list) || list.length === 0) return DEFAULT_CONFIG.typesHabitation;
  for (const d of list) {
    if (d.metiersBase === void 0 || d.domicilesDisponibles === void 0) {
      const ref2 = DEFAULT_CONFIG.typesHabitation.find((t) => t.type === d.type && t.rang === d.rang);
      d.metiersBase = d.metiersBase ?? ref2?.metiersBase ?? [];
      d.domicilesDisponibles = d.domicilesDisponibles ?? ref2?.domicilesDisponibles ?? "";
    }
    if (d.domicilesRang === void 0) {
      const ref2 = DEFAULT_CONFIG.typesHabitation.find((t) => t.type === d.type && t.rang === d.rang);
      d.domicilesRang = ref2?.domicilesRang ? [...ref2.domicilesRang] : [];
    }
    if (d.couts === void 0) {
      const ref2 = DEFAULT_CONFIG.typesHabitation.find((t) => t.type === d.type && t.rang === d.rang);
      d.couts = ref2?.couts ? [...ref2.couts] : [];
    }
  }
  return list;
}
function migrerPaysRangs(rangs) {
  if (!Array.isArray(rangs) || rangs.length === 0) return DEFAULT_CONFIG.paysRangs;
  const r0 = rangs[0];
  if (typeof r0.coutOr !== "number" || typeof r0.serments !== "number") {
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
var SCHEMA_VERSION_CONFIG = 5;
function gardeFous(m) {
  const ouDefauts = (list, defauts) => Array.isArray(list) && list.length > 0 ? list : defauts;
  m.traits = ouDefauts(m.traits, DEFAULT_CONFIG.traits);
  m.cultures = ouDefauts(m.cultures, DEFAULT_CONFIG.cultures);
  if (!Array.isArray(m.dogmes)) m.dogmes = [];
  m.regimes = ouDefauts(m.regimes, DEFAULT_CONFIG.regimes);
  m.typesHabitation = ouDefauts(m.typesHabitation, DEFAULT_CONFIG.typesHabitation);
  m.paysRangs = ouDefauts(m.paysRangs, DEFAULT_CONFIG.paysRangs);
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
var CACHE_CFG = /* @__PURE__ */ new WeakMap();
function cfgOf(config) {
  const c = config ?? DEFAULT_CONFIG;
  const cache = CACHE_CFG.get(c);
  if (cache) return cache;
  const merged = {
    ...DEFAULT_CONFIG,
    ...c,
    params: mergeParams(c.params)
  };
  const dogmesBruts = c.dogmes;
  const estDogmeNouveauFormat = (d) => typeof d?.culture === "string" && d.culture !== "";
  const tableSauvegardee = (Array.isArray(dogmesBruts) ? dogmesBruts : []).filter(estDogmeNouveauFormat);
  const tableDefaut = (DEFAULT_CONFIG.dogmes ?? []).filter((d) => estDogmeNouveauFormat(d));
  merged.dogmes = tableSauvegardee.length > 0 ? tableSauvegardee : tableDefaut;
  delete merged.progres;
  const purgeEvt = merged;
  delete purgeEvt.events;
  delete purgeEvt.dynasties;
  delete purgeEvt.eventEffets;
  delete purgeEvt.dynastieEffets;
  delete merged.params?.marchandOrTour;
  if (Array.isArray(merged.metiers)) {
    merged.metiers = merged.metiers.filter((m) => m.metier !== "Marchand");
  }
  if (Array.isArray(merged.metiersEffets)) {
    merged.metiersEffets = merged.metiersEffets.filter((e) => e.metier !== "Marchand");
  }
  if (typeof merged.regleCitesLibres === "string") {
    merged.regleCitesLibres = merged.regleCitesLibres.replace("de l\u2019influence aupr\xE8s des diff\xE9rentes cit\xE9s libres", "des \xE9missaires aupr\xE8s des diff\xE9rentes cit\xE9s libres").replace("gagner en influence qu\u2019une seule fois", "gagner un \xE9missaire qu\u2019une seule fois");
  }
  if ((c?.schemaVersion ?? 0) >= SCHEMA_VERSION_CONFIG) {
    gardeFous(merged);
  } else {
    const ancienM = c;
    if (Array.isArray(ancienM.titres)) {
      merged.metiers = ancienM.titres.map((t) => {
        const { titre: ancienMetier, ...reste } = t;
        const r = reste;
        if (r.metier === void 0 && ancienMetier !== void 0) r.metier = ancienMetier;
        return r;
      });
      delete ancienM.titres;
    }
    if (Array.isArray(ancienM.titresEffets)) {
      merged.metiersEffets = ancienM.titresEffets.map((e) => {
        const { titre: ancienTitre, ...reste } = e;
        const r = reste;
        if (r.metier === void 0 && ancienTitre !== void 0) r.metier = ancienTitre;
        return r;
      });
      delete ancienM.titresEffets;
    }
    merged.traits = migrateTraits(merged.traits);
    merged.cultures = migrerCultures(merged.cultures);
    merged.regimes = migrerRegimes(merged.regimes);
    merged.typesHabitation = migrerTypesHabitation(merged.typesHabitation);
    merged.paysRangs = migrerPaysRangs(merged.paysRangs);
    merged.couleurs = migrerCouleurs(c.couleurs);
    merged.victoires = migrerVictoires(merged.victoires);
    merged.peuplesLibres = migrerFactions(merged.peuplesLibres, DEFAULT_CONFIG.peuplesLibres).map(migrerSwapSylvains);
    merged.peuplesAutres = migrerFactions(merged.peuplesAutres, DEFAULT_CONFIG.peuplesAutres);
    merged.constructions = (merged.constructions ?? []).filter((c2) => !c2.faction);
    merged.constructions = (merged.constructions ?? []).filter(
      (c2) => (c2.famille ?? "") !== "Merveille"
    );
    merged.constructions = realignerConstructions(merged.constructions, DEFAULT_CONFIG.constructions);
    merged.constructions = migrerConstructions(merged.constructions, DEFAULT_CONFIG.constructions);
    merged.schemaVersion = SCHEMA_VERSION_CONFIG;
  }
  {
    const parNomPeuple = new Map(
      [...DEFAULT_CONFIG.peuplesLibres, ...DEFAULT_CONFIG.peuplesAutres].map((d) => [d.nom, d])
    );
    const alignerPeuples = (list) => (list ?? []).map((p) => {
      const def = parNomPeuple.get(p.nom);
      return def ? structuredClone(def) : p;
    });
    merged.peuplesLibres = alignerPeuples(merged.peuplesLibres);
    merged.peuplesAutres = alignerPeuples(merged.peuplesAutres);
  }
  if (Array.isArray(merged.metiers)) {
    const defMin = DEFAULT_CONFIG.metiers.find((t) => t.metier === "Ministre");
    for (const t of merged.metiers) {
      if (t.metier === "Ministre" && defMin && t.description !== defMin.description) {
        t.description = defMin.description;
      }
    }
  }
  if (Array.isArray(merged.metiersEffets)) {
    const defMinEff = DEFAULT_CONFIG.metiersEffets.find((t) => t.metier === "Ministre");
    for (const t of merged.metiersEffets) {
      if (t.metier === "Ministre" && defMinEff && (t.effet !== defMinEff.effet || t.revocation !== defMinEff.revocation)) {
        t.effet = defMinEff.effet;
        t.revocation = defMinEff.revocation;
      }
    }
  }
  if (Array.isArray(merged.metiers)) {
    const defChasseur = DEFAULT_CONFIG.metiers.find((t) => t.metier === "Chasseur");
    const defFermier = DEFAULT_CONFIG.metiers.find((t) => t.metier === "Fermier");
    for (const t of merged.metiers) {
      if (t.metier === "Chasseur" && defChasseur && t.valeur1 === 1.5 && t.ressource1 === "Nourriture" && t.valeur2 === 0) {
        t.valeur1 = defChasseur.valeur1;
      }
      if (t.metier === "Fermier" && defFermier && t.ete === true && (t.valeur1 === 5 || t.valeur1 === 15) && t.ressource1 === "Nourriture" && t.valeur2 === 0) {
        t.valeur1 = defFermier.valeur1;
      }
    }
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
  if (!merged.armeesBanque2026) {
    const pm = merged.params;
    for (const m of merged.metiers) {
      if (m.metier === pm.metierSoldat) {
        if (m.puissanceArmee === void 0) m.puissanceArmee = pm.puissanceSoldat ?? 15;
        if (m.ageMin === void 0) m.ageMin = pm.soldatAgeMin ?? 16;
        if (m.ageMax === void 0) m.ageMax = pm.soldatAgeMax ?? 30;
      }
      if (m.metier === pm.metierCommandant) {
        if (m.puissanceArmee === void 0) m.puissanceArmee = pm.puissanceGeneral ?? 45;
      }
    }
    for (const c2 of merged.constructions ?? []) {
      if (c2.reductionLeveeArmee !== void 0) continue;
      const d = DEFAULT_CONFIG.constructions.find((x) => x.nom === c2.nom && x.groupe === c2.groupe);
      if (d?.reductionLeveeArmee !== void 0) c2.reductionLeveeArmee = d.reductionLeveeArmee;
    }
    merged.armeesBanque2026 = true;
  }
  if (!merged.taxes25) {
    const pm = merged.params;
    if (pm.taxOrFaibles === 0.5) pm.taxOrFaibles = 0.75;
    if (pm.taxOrHautes === 1.5) pm.taxOrHautes = 1.25;
    if (pm.taxNaissFaibles === 1.5) pm.taxNaissFaibles = 1.25;
    if (pm.taxNaissHautes === 0.5) pm.taxNaissHautes = 0.75;
    merged.taxes25 = true;
  }
  if (!merged.martialiteSupprimee) {
    for (const m of merged.metiers) {
      if (m.regleGenre === "Martialit\xE9") m.regleGenre = "";
    }
    for (const cu of merged.cultures) {
      delete cu.martialite;
    }
    merged.martialiteSupprimee = true;
  }
  if (!merged.metiersAmenagements2026) {
    const RENOMMAGES = {
      Artisan: "Commer\xE7ant",
      Chercheur: "Scientifique",
      Sportif: "Garde"
    };
    const ANCIENS = [
      ["Chasseur", "", 1, "Nourriture", 0.1, "Or", "M\xE9tier par d\xE9faut", false, "", ""],
      ["Artiste", "Culturelle", 1.2, "Tourisme", 0, "", "", false, "", "Education"],
      ["Chercheur", "Scientifique", 0.2, "Science", 0, "", "", false, "", "Education"],
      ["\xC9leveur", "Agricole", 2.5, "Nourriture", 0, "", "", false, "", "Education"],
      ["Sportif", "Militaire", 5, "Garnison", 0, "", "", false, "", "Education"],
      ["Artisan", "\xC9conomique", 1.5, "Or", 0, "", "", false, "", "Education"],
      ["Professeur", "", 0, "", 0, "", "", false, "", "Ville"],
      ["Dirigeant", "", 0, "", 0, "", "Chef de faction \xB7 1 par joueur", true, "H\xE9r\xE9dit\xE9", "Succession"],
      ["Gouverneur", "", 0, "", 0, "", "Max 1 par ville", true, "", "Manuelle"],
      ["H\xE9ritier", "", 0, "", 0, "", "M\xEAme dynastie que le Dirigeant", true, "H\xE9r\xE9dit\xE9", "Manuelle"],
      // NB : le Marchand (retiré du jeu le 2026-10-24, arbitrage
      //  Thibaut « supprime carrément le métier de marchand ») reste
      //  dans ce tableau HISTORIQUE : il décrit les défauts d'avant
      //  la 3a ; la purge de cfgOf retire déjà ses entrées de
      //  merged.metiers AVANT ce bloc — la ligne ne peut plus être
      //  appariée, elle ne sert qu'à la lisibilité du snapshot.
      ["Marchand", "", 0, "", 0, "", "", false, "", "Manuelle"],
      // NB : le Ministre (textes VIDÉS le 2026-10-24, retour arbitre
      //  « garder la ligne titre, vider ses textes » — le système
      //  des ministères a été retiré le 2026-10-23, la ligne titre
      //  reste) est conservé dans ce tableau HISTORIQUE avec ses
      //  défauts d'avant la 3a (« Plusieurs autorisés ») : c'est ce
      //  portrait qu'apparie la migration « ancien défaut exact →
      //  nouveau défaut » ; le garde-fou de cfgOf vide ensuite la
      //  description de l'entrée « Ministre » des configs.
      ["Ministre", "", 0, "", 0, "", "Plusieurs autoris\xE9s", true, "", "Manuelle"],
      ["Propagandiste", "", 0, "", 0, "", "", false, "", "Manuelle"],
      ["Soldat", "", 0, "", 0, "", "", false, "", "Arm\xE9e"],
      ["Commandant", "", 0, "", 0, "", "", true, "", "Arm\xE9e"]
    ];
    const cle = (m) => JSON.stringify([m.education ?? "", m.valeur1, m.ressource1, m.valeur2, m.ressource2, m.description, m.nobleSeul, m.regleGenre, m.attribution]);
    const nouveaux = new Map(DEFAULT_CONFIG.metiers.map((d) => [d.metier, d]));
    const parAncienNom = new Map(ANCIENS.map((a2) => [a2[0], a2]));
    const out = [];
    for (const m of merged.metiers) {
      const nom = m.metier;
      const ancien = parAncienNom.get(nom);
      if (ancien && cle(m) === JSON.stringify(ancien.slice(1))) {
        const def = nouveaux.get(RENOMMAGES[nom] ?? nom);
        if (def) out.push(structuredClone(def));
        continue;
      }
      if (RENOMMAGES[nom] && !merged.metiers.some((x) => x.metier === RENOMMAGES[nom])) {
        m.metier = RENOMMAGES[nom];
      }
      if (nom !== "Propagandiste") out.push(m);
    }
    for (const d of DEFAULT_CONFIG.metiers) {
      if (!out.some((m) => m.metier === d.metier)) out.push(structuredClone(d));
    }
    merged.metiers = out;
    merged.metiersEffets = (merged.metiersEffets ?? []).filter((e) => e.metier !== "Propagandiste");
    for (const d of DEFAULT_CONFIG.metiersEffets) {
      if (!merged.metiersEffets.some((e) => e.metier === d.metier)) {
        merged.metiersEffets.push(structuredClone(d));
      }
    }
    const ANCIENS_EFFETS = {
      "Baleinier": [{ ressource: "Or", quantite: 2 }, { ressource: "Nourriture", quantite: 10 }],
      "B\xE2teau de p\xEAche": [{ ressource: "Nourriture", quantite: 8 }],
      "Carri\xE8re": [{ ressource: "Pierre", quantite: 1 }],
      "Champ": [{ ressource: "Nourriture", quantite: 15, ete: true }],
      "Foire": [{ ressource: "Tourisme", quantite: 5 }],
      "Mine de Charbon": [{ ressource: "Charbon", quantite: 1 }],
      "Mine de Fer": [{ ressource: "Fer", quantite: 1 }],
      "Mine d'Or": [{ ressource: "Or", quantite: 4 }],
      "Observatoire": [{ ressource: "Science", quantite: 1 }],
      "P\xE2turage": [{ ressource: "B\xE9tail", quantite: 1 }, { ressource: "Nourriture", quantite: 4 }],
      "Rizi\xE8re": [{ ressource: "Nourriture", quantite: 20, ete: true }],
      "Scierie": [{ ressource: "Bois", quantite: 1 }],
      "S\xE9riciculture": [{ ressource: "Soie", quantite: 1 }],
      "Site arch\xE9ologique": [{ ressource: "Tourisme", quantite: 8 }]
    };
    const defsAmenagements = new Map(
      DEFAULT_CONFIG.constructions.filter((c2) => c2.emplacements).map((c2) => [c2.nom, c2])
    );
    for (const c2 of merged.constructions ?? []) {
      const def = defsAmenagements.get(c2.nom);
      if (!def) continue;
      if (c2.emplacements === void 0) c2.emplacements = structuredClone(def.emplacements);
      const ancienEffets = ANCIENS_EFFETS[c2.nom];
      if (ancienEffets && JSON.stringify(c2.effets ?? null) === JSON.stringify(ancienEffets)) {
        c2.effets = [];
        c2.production = def.production;
        c2.description = def.description;
      }
    }
    merged.metiersAmenagements2026 = true;
  }
  if (!merged.descriptionsAmenagementsVides) {
    for (const c2 of merged.constructions ?? []) {
      if (c2.categorie === "Am\xE9nagement") c2.description = "";
    }
    merged.descriptionsAmenagementsVides = true;
  }
  delete merged.rangsHabitation;
  for (const h of merged.typesHabitation ?? []) {
    const ancien = h.metiersDisponibles;
    if (h.metiersBase === void 0) {
      h.metiersBase = typeof ancien === "string" ? parseMetiersBaseTexte(ancien, merged.metiers.map((m) => m.metier)) : DEFAULT_CONFIG.typesHabitation.find(
        (t) => t.type === h.type && t.rang === h.rang
      )?.metiersBase ?? [];
    }
    delete h.metiersDisponibles;
  }
  for (const cle of ["batimentsVille", "batimentsChateau", "batimentsCouts", "amenagements"]) {
    delete merged[cle];
  }
  delete merged.educations;
  for (const m of merged.metiers) delete m.education;
  merged.constructions = (merged.constructions ?? []).filter(
    (c2) => !((c2.rangMinHabitation ?? 0) >= 2 && c2.categorie === "B\xE2timent")
  );
  merged.constructions.push(
    ...DEFAULT_CONFIG.constructions.filter(
      (c2) => (c2.rangMinHabitation ?? 0) >= 2 && c2.categorie === "B\xE2timent"
    )
  );
  const resultat = {
    p: merged.params,
    ressources: merged.ressources,
    metiers: merged.metiers,
    traits: merged.traits,
    cultures: merged.cultures,
    regimes: merged.regimes,
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
  CACHE_CFG.set(c, resultat);
  return resultat;
}

// src/engine/gameData.ts
var RESOURCES = DEFAULT_CONFIG.ressources;
var CULTURES = DEFAULT_CONFIG.cultures;
var REGIMES = DEFAULT_CONFIG.regimes;
var PEUPLES = DEFAULT_CONFIG.peuples.map((nom) => {
  const b = DEFAULT_CONFIG.banquesNoms[DEFAULT_CONFIG.peupleBanque[nom] ?? 0] ?? DEFAULT_CONFIG.banquesNoms[0];
  return { nom, noms: b.noms, prenomsM: b.prenomsM, prenomsF: b.prenomsF };
});
function metierDef(metier, cfg) {
  return (cfg ?? DEFAULT_CONFIG).metiers.find((t) => t.metier === metier);
}
function traitDef(name, cfg) {
  return (cfg ?? DEFAULT_CONFIG).traits.find((t) => t.name === name);
}
function cultureDef(nom, cfg) {
  return (cfg ?? DEFAULT_CONFIG).cultures.find((c) => c.nom === nom);
}
function regimeDef(nom, cfg) {
  return (cfg ?? DEFAULT_CONFIG).regimes.find((r) => r.nom === nom);
}
function peupleDef(nom, cfg) {
  const c = cfg ?? DEFAULT_CONFIG;
  const b = c.banquesNoms[c.peupleBanque[nom] ?? 0] ?? c.banquesNoms[0];
  if (!b) return void 0;
  return { nom, noms: b.noms, prenomsM: b.prenomsM, prenomsF: b.prenomsF };
}

// src/engine/saisons.ts
function saisonForTurn(turn, C = cfgOf()) {
  return Math.floor(Math.max(0, turn - 1) / Math.max(1, C.p.saisonLongueur)) % 2 === 0 ? "\xC9t\xE9" : "Hiver";
}

// src/engine/gameData2.ts
function buildingDef(nom, cfg) {
  const liste = (cfg ?? DEFAULT_CONFIG).batiments;
  const sansAccents = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return liste.find((b) => b.nom === nom) ?? liste.find((b) => sansAccents(b.nom) === sansAccents(nom));
}
function schoolRankOf(batiments, cfg) {
  let rank = 0;
  for (const b of batiments) {
    const def = buildingDef(b, cfg);
    if (def && def.ecoleRang > rank) rank = def.ecoleRang;
  }
  return rank;
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
function neDemenageJamais(c, C) {
  return c.metier === C.p.metierDirigeant || c.metier === C.p.metierHeritierStr;
}
function perteDemenagement(c, C) {
  if (neDemenageJamais(c, C)) return;
  c.metier = null;
  c.domicile = null;
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
function toutesLesPopulations(state) {
  return detenteursDe(state).flatMap((d) => populationDe(state, d));
}
function emptyRecap() {
  return {
    conceptions: {},
    naissances: {},
    deces: {},
    decesMaladie: 0,
    mariagesNobles: {},
    conversions: {},
    metiersAttribues: {},
    crises: [],
    commandantTombe: null
  };
}
function bump(dict, key, n = 1) {
  if (!key) key = "(inconnu)";
  dict[key] = (dict[key] ?? 0) + n;
}

// src/engine/rangs.ts
function nomRang(rang) {
  return rang.split(":")[0].trim();
}
function rangsDefsType(type, C) {
  return (C.config.typesHabitation ?? []).filter((d) => d.type.toLowerCase() === type.toLowerCase());
}
function rangNiveau(ville, C) {
  const nom = nomRang(ville.rang ?? "Hameau").toLowerCase();
  const idx = rangsDefsType(ville.type ?? "Ville", C).findIndex((d) => nomRang(d.rang).toLowerCase() === nom);
  return idx >= 0 ? idx + 1 : 1;
}

// src/rules/registry.ts
function slug(nom) {
  return nom.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function effetsConstructionVersBanque(effets) {
  const out = [];
  for (const e of effets) {
    if (e.ressource === "Garnison") {
      out.push({ type: "garnisonVille", valeur: e.quantite });
    } else if (e.ete) {
      out.push({ type: "fluxVille", ressource: e.ressource, valeur: e.quantite, ete: true });
    } else {
      out.push({ type: "fluxVille", ressource: e.ressource, valeur: e.quantite });
    }
  }
  return out;
}
function reglesConstructions(C) {
  const refs = C.config.constructions ?? [];
  const out = [];
  for (const ref2 of refs) {
    const effets = [
      ...effetsConstructionVersBanque(ref2.effets ?? []),
      ...(ref2.emplacements ?? []).map((e) => ({
        type: "placesMetier",
        metier: e.metier,
        valeur: Number(e.places) || 0
      })),
      ...(ref2.domicilesApportes ?? []).map((e) => ({
        type: "logements",
        logement: e.domicile,
        valeur: e.nombre
      })),
      // (Retour Thibaut 2026-10-28 : « les armées, et surtout les
      //  réductions de levée, rejoignent la banque » — le champ
      //  reductionLeveeArmee de la fiche de construction est
      //  traduit en effet de banque, lu par reductionLeveeBatiments
      //  pour le prix d'une levée dans la ville.)
      ...ref2.reductionLeveeArmee ? [{ type: "reductionLeveeArmee", valeur: ref2.reductionLeveeArmee }] : []
    ];
    if (effets.length === 0) continue;
    const source = ref2.categorie === "Am\xE9nagement" ? "amenagement" : "batiment";
    out.push({
      id: `${source}.${slug(ref2.nom)}@${slug(ref2.groupe)}`,
      source,
      nom: ref2.nom,
      // Le groupe est porté par la règle (accès moteur par nom+groupe).
      groupe: ref2.groupe,
      effets
    });
  }
  return out;
}
var cacheRegles = null;
function cleConstruction(nom, groupe) {
  return `${nom}|${groupe ?? ""}`;
}
function reglePourConstruction(ref2, C) {
  if (!cacheRegles || cacheRegles.config !== C) {
    const regles = reglesConstructions(C);
    cacheRegles = {
      config: C,
      regles,
      parCle: new Map(regles.map((r) => [cleConstruction(r.nom, r.groupe), r]))
    };
  }
  return cacheRegles.parCle.get(cleConstruction(ref2.nom, ref2.groupe));
}

// src/rules/effects/banque.ts
function conditionsRemplies(cond, ctx) {
  if (!cond) return true;
  if (cond.saison && ctx.saison !== cond.saison) return false;
  return true;
}
function appliquerEffet(e, _ctx, out) {
  switch (e.type) {
    case "fluxVille": {
      if (e.ete) {
        out.fluxEte[e.ressource] = (out.fluxEte[e.ressource] ?? 0) + e.valeur;
      } else {
        out.flux[e.ressource] = (out.flux[e.ressource] ?? 0) + e.valeur;
      }
      break;
    }
    // (RETRAIT 2026-10-29, refonte « 8 lois » des régimes : le cas
    //  'fluxParAmenagement' est supprimé avec la source 'regime' de
    //  la banque — sa seule règle vivante (Socialisme « Pour le
    //  peuple ») est REMPLACÉE par des lois lues par le moteur.
    //  Aucune construction du référentiel ne produisait ce type.
    //  Historique git, règle 9.)
    // (RETRAIT 2026-10-29, refonte « 12 lois » des cultures : le
    //  canal fluxParVilleCultureMonde est supprimé avec la source
    //  'culture' — règles de pays « +N par ville de cette culture
    //  dans le monde » remplacées par les lois de VILLE et
    //  d'HABITANT lues par le moteur. Historique git, règle 9.)
    // (RETRAIT 2026-10-24, retour arbitre : les types d'effets des
    //  TECHS — fluxSiCapitale, fluxParVille, fluxParVilleProximite,
    //  fluxParRangHabitation, fluxParBatiment,
    //  fluxParGarnisonHabitation, fluxParMetier — sont supprimés
    //  avec le système de progrès. L'ancien contenu reste dans
    //  l'historique git, règle 9.)
    // (RETRAIT 2026-10-24, purge R4 « complète » : les types restants
    //  SANS PRODUCTEUR — fluxJoueur, fluxCapitale, garnisonParRang,
    //  tourismeInstantane, habitantsVille, conversionPoids,
    //  migrationPoids, reductionCout, reductionLeveeArmee
    //  (RESTAURÉ le 2026-10-28 avec un producteur : constructions,
    //  arbitrage Thibaut « les armées, et surtout les réductions de
    //  levée, rejoignent la banque »),
    //  emissaires, scienceInstantanee, ressourcesInstantanees,
    //  demographieVille (et les canaux instantanes/conversion/
    //  migration/reductions de la contribution) — sont supprimés :
    //  le référentiel ne produit que fluxVille, garnisonVille,
    //  fluxParAmenagement et fluxParVilleCultureMonde, et le moteur
    //  ne lit que flux/fluxEte/garnison. L'ancien contenu reste dans
    //  l'historique git, règle 9.)
    case "garnisonVille": {
      out.garnison += e.valeur;
      break;
    }
    // (Retour Thibaut 2026-10-27 : « des valeurs qui passent par la
    //  banque » — les emplacements de métiers et les logements sont
    //  des canaux de la contribution AU MÊME TITRE que les flux.)
    case "placesMetier": {
      out.placesMetier[e.metier] = (out.placesMetier[e.metier] ?? 0) + e.valeur;
      break;
    }
    case "logements": {
      out.logements[e.logement] = (out.logements[e.logement] ?? 0) + e.valeur;
      break;
    }
    // (Retour Thibaut 2026-10-28 : « les armées, et surtout les
    //  réductions de levée, rejoignent la banque » — les réductions
    //  de levée d'armée sont un canal de la contribution au même
    //  titre que les flux et les logements.)
    case "reductionLeveeArmee": {
      out.reductionLeveeArmee += e.valeur;
      break;
    }
  }
}
function contributionVide() {
  return { flux: {}, fluxEte: {}, garnison: 0, placesMetier: {}, logements: {}, reductionLeveeArmee: 0 };
}
function appliquerRegles(regles, ctx) {
  const out = contributionVide();
  for (const r of regles) {
    if (!conditionsRemplies(r.conditions, ctx)) continue;
    for (const e of r.effets) appliquerEffet(e, ctx, out);
  }
  return out;
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
var C_LECTURE = cfgOf(void 0);
function contexteLectureSeule() {
  return {
    state: {},
    joueur: {},
    saison: ""
  };
}
function contributionBanque(ref2, cfg) {
  const regle = reglePourConstruction(ref2, cfg ? cfgOf(cfg) : C_LECTURE);
  if (!regle) return void 0;
  return appliquerRegles([regle], contexteLectureSeule());
}
function effetsConstructionRef(ref2, cfg) {
  const c = contributionBanque(ref2, cfg);
  return c ? c.flux : {};
}
function effetsEteConstructionRef(ref2, cfg) {
  const c = contributionBanque(ref2, cfg);
  return c ? c.fluxEte : {};
}
function eteSeulementRef(ref2, cfg) {
  const regle = reglePourConstruction(ref2, cfg ? cfgOf(cfg) : C_LECTURE);
  const flux = (regle?.effets ?? []).filter(
    (e) => e.type === "fluxVille"
  );
  return flux.length > 0 && flux.every((e) => e.ete);
}
function emplacementsConstructionRef(ref2, cfg) {
  const c = contributionBanque(ref2, cfg);
  return c ? Object.entries(c.placesMetier).map(([metier, places]) => ({ metier, places })) : [];
}
function logementsConstructionRef(ref2, cfg) {
  const c = contributionBanque(ref2, cfg);
  return c ? { ...c.logements } : {};
}
function garnisonConstructionRef(ref2, cfg) {
  const c = contributionBanque(ref2, cfg);
  return c ? c.garnison : 0;
}
function estCotiereRef(ref2) {
  return ref2?.cotier === true;
}

// src/engine/batiments.ts
function remplaceBatimentRef(nom, cfg, groupe) {
  const ref2 = constructionRef(nom, cfg, groupe);
  return ref2?.remplaceBatiment ?? [];
}
function effetsTourBatiment(nom, C, groupe) {
  const ref2 = constructionRef(nom, C.config, groupe);
  return ref2 ? effetsConstructionRef(ref2, C.config) : {};
}
function garnisonBatiment(nom, C, groupe) {
  const ref2 = constructionRef(nom, C.config, groupe);
  return ref2 ? garnisonConstructionRef(ref2, C.config) : 0;
}
function productionTourismeBatiment(nom, C, groupe) {
  const ref2 = constructionRef(nom, C.config, groupe);
  return ref2 ? effetsConstructionRef(ref2, C.config)["Tourisme"] ?? 0 : 0;
}
function batimentsRemplaces(ville, C) {
  const presents = new Set(ville.batiments);
  const ignores = /* @__PURE__ */ new Set();
  for (const nom of presents) {
    for (const remplace of remplaceBatimentRef(nom, C.config, ville.type)) {
      if (presents.has(remplace)) ignores.add(remplace);
    }
  }
  return ignores;
}
function effetsBatimentsVille(ville, C) {
  const ignores = batimentsRemplaces(ville, C);
  const groupe = ville.type;
  const out = {};
  for (const nom of ville.batiments) {
    if (ignores.has(nom)) continue;
    for (const [res, v] of Object.entries(effetsTourBatiment(nom, C, groupe))) {
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
  for (const [res, v] of Object.entries(out)) {
    if (!v) continue;
    const rs = p.resources[res];
    if (rs) rs.stock += v;
  }
  return out;
}
function batimentsActifsVille(ville, C) {
  const ignores = batimentsRemplaces(ville, C);
  return (ville.batiments ?? []).filter((nom) => !ignores.has(nom));
}
function modificateursPaysJoueur(p, C) {
  const out = {
    multProductionBourgeois: 1,
    bonusMetierParHabitant: [],
    multRevenusCommerce: 1,
    tributVassalPlus: 0,
    conversionLocalePlus: 0,
    scienceProfesseurPlus: 0
  };
  for (const ville of p.villes) {
    const ignores = batimentsRemplaces(ville, C);
    for (const nom of ville.batiments) {
      if (ignores.has(nom)) continue;
      const ref2 = constructionRef(nom, C.config, ville.type);
      if (!ref2) continue;
      out.multProductionBourgeois *= ref2.multProductionBourgeois ?? 1;
      out.multRevenusCommerce *= ref2.multRevenusCommerce ?? 1;
      out.tributVassalPlus += ref2.tributVassalPlus ?? 0;
      out.conversionLocalePlus += ref2.conversionLocalePlus ?? 0;
      out.scienceProfesseurPlus += ref2.scienceProfesseurPlus ?? 0;
      for (const bm of ref2.bonusMetierParHabitant ?? []) out.bonusMetierParHabitant.push(bm);
    }
  }
  return out;
}
function conversionLocaleBatimentsVille(ville, C) {
  let total = 0;
  for (const nom of batimentsActifsVille(ville, C)) {
    total += constructionRef(nom, C.config, ville.type)?.conversionLocalePlus ?? 0;
  }
  return total;
}

// src/engine/amenagements.ts
function amenagementRef(nom, cfg) {
  return constructionRef(nom, cfg);
}
function effetsAmenagementsVille(ville, cfg) {
  const out = {};
  const C = cfg ? cfgOf(cfg) : cfgOf();
  const rang = rangNiveau(ville, C);
  for (const nom of ville.amenagements ?? []) {
    const ref2 = amenagementRef(nom, cfg);
    if (!ref2 || eteSeulementRef(ref2, cfg)) continue;
    for (const [res, v] of Object.entries(effetsConstructionRef(ref2, cfg))) {
      out[res] = (out[res] ?? 0) + v;
    }
    for (const e of ref2.effetsParRang ?? []) {
      out[e.ressource] = (out[e.ressource] ?? 0) + e.quantite * rang;
    }
  }
  return out;
}
function effetsNourrEteAmenagementsVille(ville, cfg) {
  const out = {};
  for (const nom of ville.amenagements ?? []) {
    const ref2 = amenagementRef(nom, cfg);
    if (!ref2) continue;
    for (const [res, v] of Object.entries(effetsEteConstructionRef(ref2, cfg))) {
      out[res] = (out[res] ?? 0) + v;
    }
  }
  return out;
}
function appliquerEffetsAmenagements(p, cfg) {
  const out = {};
  for (const ville of p.villes) {
    for (const [res, v] of Object.entries(effetsAmenagementsVille(ville, cfg))) {
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

// src/engine/commerce.ts
function routesCommerce(state) {
  return (state.routesCommerce ?? []).filter((r) => !("marchandId" in r));
}
function routesCommerceDe(state, joueur) {
  return routesCommerce(state).filter((r) => r.joueur === joueur);
}
function ressourcesCopiables(nom, cfg) {
  const ref2 = constructionRef(nom, cfg);
  if (!ref2) return [];
  const out = [];
  for (const [res, v] of Object.entries(effetsConstructionRef(ref2, cfg))) {
    if (v > 0) out.push({ ressource: res, valeur: v, ete: false });
  }
  for (const [res, v] of Object.entries(effetsEteConstructionRef(ref2, cfg))) {
    if (v > 0) out.push({ ressource: res, valeur: v, ete: true });
  }
  return out;
}
function effetsRouteProprietaire(route, saison, C = cfgOf()) {
  const out = {};
  if (!route.amenagement) return out;
  for (const cop of ressourcesCopiables(route.amenagement, C.config)) {
    if (cop.ete && saison !== "\xC9t\xE9") continue;
    out[cop.ressource] = (out[cop.ressource] ?? 0) + cop.valeur;
  }
  return out;
}
function effetsCommerceJoueur(state, p, saison, C = cfgOf(state.config)) {
  const out = {};
  for (const route of routesCommerceDe(state, p.n)) {
    const src = effetsRouteProprietaire(route, saison, C);
    for (const [res, v] of Object.entries(src)) {
      out[res] = (out[res] ?? 0) + v;
    }
  }
  const mult = modificateursPaysJoueur(p, C).multRevenusCommerce;
  if (mult > 1) {
    for (const res of Object.keys(out)) out[res] *= mult;
  }
  return out;
}
function nomCibleRoute(state, route) {
  if (route.joueurCible === null) {
    return `${route.citeCible ?? route.villeCible} (cit\xE9 libre)`;
  }
  const cible = state.players.find((q) => q.n === route.joueurCible);
  return `${route.villeCible} (${cible?.nom ?? "?"})`;
}
function nettoyerRoutesCommerce(state) {
  const avant = state.routesCommerce ?? [];
  const mortes = avant.filter((r) => {
    if ("marchandId" in r) return true;
    const proprietaire = state.players.find((q) => q.n === r.joueur);
    if (!proprietaire || !proprietaire.villes.some((v) => v.nom === r.villeOrigine)) return true;
    if (r.joueurCible === null) {
      return !(state.citesLibres ?? []).some((c) => c.nom === (r.citeCible ?? r.villeCible));
    }
    const cible = state.players.find((q) => q.n === r.joueurCible);
    const ville = cible?.villes.find((v) => v.nom === r.villeCible);
    if (!ville) return true;
    if (!r.amenagement) return false;
    return !(ville.amenagements ?? []).includes(r.amenagement);
  });
  if (mortes.length === 0) return [];
  const ids = new Set(mortes.map((r) => r.id));
  state.routesCommerce = avant.filter((r) => !ids.has(r.id));
  for (const r of mortes) {
    const motif = "marchandId" in r ? "ancien mod\xE8le (marchand titulaire) \u2014 arbitrage 2026-10-24 : \xE0 rouvrir manuellement" : `la ville d'origine ou la cible (${nomCibleRoute(state, r)}) n'existe plus, ou l'am\xE9nagement copi\xE9 a disparu`;
    state.log.push({
      turn: state.turn + 1,
      type: "Commerce",
      joueur: r.joueur,
      texte: `Route commerciale ${r.villeOrigine} \u2194 ${nomCibleRoute(state, r)} ferm\xE9e : ${motif}.`
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

// src/engine/garnisons.ts
function garnisonHabitationVille(p, ville, C, state) {
  let g = 0;
  for (const b of ville.batiments) g += garnisonBatiment(b, C, ville.type);
  for (const a of ville.amenagements ?? []) {
    const ref2 = amenagementRef(a, C.config);
    if (ref2) g += garnisonConstructionRef(ref2, C.config);
  }
  if (state) {
    const pop = state.population[p.n] ?? [];
    const gardes = pop.filter(
      (c) => c.statut !== "D\xE9c\xE9d\xE9" && c.ville === ville.nom && c.metier === C.p.metierGarde
    );
    g += C.p.garnisonParGarde * gardes.length;
    for (const c of gardes) {
      g += cultureDef(c.culture, C.config)?.garnisonParGardeCulture ?? 0;
    }
  }
  if (state) g -= malusFerveurMartiale(state, ville, C);
  if (state) g -= malusGuerresSaintes(state, ville, C);
  return Math.max(0, g);
}
function malusFerveurMartiale(state, ville, C) {
  let malus = 0;
  for (const cult of C.config.cultures) {
    const n = cult.garnisonHorsCultureParRang ?? 0;
    if (!n) continue;
    const presente = state.players.some((q) => q.villes.some((v) => v.culture === cult.nom));
    if (!presente) continue;
    if (ville.culture === cult.nom) continue;
    malus += n * rangNiveau(ville, C);
  }
  return malus;
}
function malusGuerresSaintes(state, ville, C) {
  let malus = 0;
  if (!state.dogmes?.length) return 0;
  const culturesPorteuses = new Set(state.dogmes.map((d) => d.culture));
  for (const cult of culturesPorteuses) {
    if (ville.culture === cult) continue;
    const effet = effetsDogmeCulture(state, cult, "garnisonHorsCulture", C);
    if (effet < 0) malus += -effet;
  }
  return malus;
}

// src/engine/regimes.ts
function detailLoisHabitants(state, p, C) {
  const out = [];
  const vivants = (state.population[p.n] ?? []).filter((c) => c.statut !== "D\xE9c\xE9d\xE9");
  for (const cult of C.config.cultures) {
    const membres = vivants.filter((c) => c.culture === cult.nom);
    if (membres.length === 0) continue;
    const nobles = membres.filter((c) => rangDe(c, C) === "noble");
    if (cult.tourismeParNoble && nobles.length > 0) {
      out.push({
        res: "Tourisme",
        loi: "Foi sup\xE9rieure",
        culture: cult.nom,
        parHab: cult.tourismeParNoble,
        nb: nobles.length,
        total: cult.tourismeParNoble * nobles.length
      });
    }
    if (cult.scienceParNoble && nobles.length > 0) {
      out.push({
        res: "Science",
        loi: "Conseil des Sages",
        culture: cult.nom,
        parHab: cult.scienceParNoble,
        nb: nobles.length,
        total: cult.scienceParNoble * nobles.length
      });
    }
    const gardes = membres.filter((c) => C.p.metierGarde && c.metier === C.p.metierGarde);
    if (cult.orParGarde && gardes.length > 0) {
      out.push({
        res: "Or",
        loi: "Corps de fer",
        culture: cult.nom,
        parHab: cult.orParGarde,
        nb: gardes.length,
        total: cult.orParGarde * gardes.length
      });
    }
  }
  return out;
}
function loisHabitants(state, p, C) {
  const out = {};
  for (const d of detailLoisHabitants(state, p, C)) {
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
  total += loisHabitants(state, p, C)["Tourisme"] ?? 0;
  for (const v of p.villes) {
    for (const b of v.batiments) total += productionTourismeBatiment(b, C, v.type);
    for (const a of v.amenagements ?? []) total += productionTourismeBatiment(a, C, v.type);
  }
  total += effetsCommerceJoueur(state, p, state.saison, C)["Tourisme"] ?? 0;
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
function appliquerEffetsRegimesCultures(state, p, C = cfgOf(state.config)) {
  const out = {};
  for (const [res, v] of Object.entries(loisHabitants(state, p, C))) {
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
      texte: `\u{1F3DB} ${p.nom} \u2014 lois d'habitants des cultures : ${parts}.`
    });
  }
  return out;
}

// src/engine/citesLibres.ts
var MULT_NOURR_CHASSEUR_CITE = 1.1;
function citesLibresDe(state) {
  return state.citesLibres ?? [];
}
function facteurTaxesCite(cite, C, ressource) {
  const t = cite.taxes ?? "Moyenne";
  if (t === "Faible") return ressource === "Nourriture" ? C.p.taxNourrFaibles : C.p.taxOrFaibles;
  if (t === "Forte") return ressource === "Nourriture" ? C.p.taxNourrHautes : C.p.taxOrHautes;
  return 1;
}
function detailCiteLibre(cite, C, state) {
  const vivants = (cite.population ?? []).filter((c) => c.statut !== "D\xE9c\xE9d\xE9");
  const adultes = vivants.filter((c) => c.age >= C.p.adultAge).length;
  const enfants = vivants.length - adultes;
  const metiers = {};
  let chasseurs = 0;
  for (const c of vivants) {
    if (!c.metier) continue;
    const td = metierDef(c.metier, C.config);
    if (!td) continue;
    if (td.ete && state && state.saison !== "\xC9t\xE9") continue;
    const chass = c.metier === C.p.metierChasseur;
    if (chass) chasseurs++;
    if (td.ressource1 && td.valeur1 !== 0) {
      const v = chass && td.ressource1 === "Nourriture" ? td.valeur1 * MULT_NOURR_CHASSEUR_CITE : td.valeur1;
      metiers[td.ressource1] = (metiers[td.ressource1] ?? 0) + v;
    }
    if (td.ressource2 && td.valeur2 !== 0) {
      const v = chass && td.ressource2 === "Nourriture" ? td.valeur2 * MULT_NOURR_CHASSEUR_CITE : td.valeur2;
      metiers[td.ressource2] = (metiers[td.ressource2] ?? 0) + v;
    }
  }
  const taxeMult = {};
  for (const res of Object.keys(metiers)) taxeMult[res] = facteurTaxesCite(cite, C, res);
  const taxes = {};
  for (const [res, v] of Object.entries(metiers)) {
    const tv = v * taxeMult[res];
    if (tv !== 0) taxes[res] = tv;
  }
  const conso = {};
  const consoNourr = vivants.reduce((n, c) => n + consoNourrHabitant(c, C), 0);
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
  return { habitants: vivants.length, adultes, enfants, chasseurs, metiers, taxeMult, taxes, conso, net, transfert };
}
function appliquerTaxesCitesLibres(state, C = cfgOf(state.config)) {
  const out = {};
  for (const cite of citesLibresDe(state)) {
    const n = cite.suzerain;
    if (n == null) continue;
    const suz = state.players.find((q) => q.n === n);
    if (!suz) continue;
    const d = detailCiteLibre(cite, C, state);
    const gains = out[suz.n] ?? (out[suz.n] = {});
    const parts = [];
    for (const [res, v] of Object.entries(d.transfert)) {
      if (v === 0) continue;
      const vv = v;
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

// src/engine/geographie.ts
function villeCotiere(ville) {
  return ville.proximite != null && ville.proximite !== "Plaine";
}

// src/engine/villes.ts
function normaliserEtat(state) {
  const C = cfgOf(state.config);
  if (!Array.isArray(state.history)) state.history = [];
  if (!Array.isArray(state.log)) state.log = [];
  if (!Array.isArray(state.routesCommerce)) state.routesCommerce = [];
  if (!Array.isArray(state.citesLibres)) state.citesLibres = [];
  if (!Array.isArray(state.dogmes)) state.dogmes = [];
  if (!state.population || typeof state.population !== "object") state.population = {};
  for (const p of state.players ?? []) {
    for (const v of p.villes ?? []) {
      if (!Array.isArray(v.batiments)) v.batiments = [];
      if (!Array.isArray(v.amenagements)) v.amenagements = [];
      if (!Array.isArray(v.autres)) v.autres = [];
      if (!Array.isArray(v.domiciles)) v.domiciles = stockRang(v.type ?? "Ville", v.rang ?? "Hameau", C);
    }
  }
}
function transfererVille(state, p, idx, cible) {
  const C = cfgOf(state.config);
  const ville = p.villes[idx];
  if (!ville || cible.n === p.n) return false;
  p.villes.splice(idx, 1);
  resynchroniserTourisme(state, p, `ville \xAB ${ville.nom} \xBB transf\xE9r\xE9e \xE0 ${cible.nom}`);
  cible.villes.push(ville);
  resynchroniserTourisme(state, cible, `ville \xAB ${ville.nom} \xBB re\xE7ue de ${p.nom}`);
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
  if (refuge) for (const c of courRestee) {
    c.ville = refuge;
    perteDemenagement(c, C);
  }
  state.population[p.n] = restants;
  state.population[cible.n] = [...state.population[cible.n] ?? [], ...deplaces];
  state.log.push({
    turn: state.turn,
    type: "Syst\xE8me",
    joueur: cible.n,
    texte: `\u{1F5DD} ${ancienNom}${renommee ? ` (renomm\xE9e \xAB ${renommee} \xBB)` : ""} passe de ${p.nom} \xE0 ${cible.nom}${deplaces.length ? `, avec ses ${deplaces.length} habitant(s) (production des m\xE9tiers recalcul\xE9e pour ${cible.nom})` : ""}${courRestee.length ? ` \u2014 la cour de ${p.nom} (${courRestee.length} noble(s)) reste aupr\xE8s de lui` : ""}.`
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

// src/engine/pelerinage.ts
var RESSOURCES_PELERINAGE = ["Or", "Nourriture", "Science"];
function culturesDimieres(state) {
  const out = /* @__PURE__ */ new Set();
  for (const d of state.dogmes ?? []) out.add(d.culture);
  return [...out];
}
function dimeCulture(state, culture, C) {
  if (dogmesCulture(state, culture).length === 0) return void 0;
  const pontife = joueurPontifeCulture(state, culture, C);
  if (!pontife) return void 0;
  const taux = C.p.pelerinageTaux;
  const versements = [];
  for (const q of state.players) {
    let montants;
    for (const ville of q.villes ?? []) {
      if (ville.culture !== culture) continue;
      const prod = productionVille(state, q, ville, C).total;
      for (const res of RESSOURCES_PELERINAGE) {
        const part = Math.max(0, prod[res] ?? 0) * taux;
        if (part <= 0) continue;
        montants ?? (montants = {});
        montants[res] = (montants[res] ?? 0) + part;
      }
    }
    if (montants) versements.push({ payeur: q, montants });
  }
  return { culture, pontife: pontife.joueur, versements };
}
var fmt1 = (v) => Math.round(v * 10) / 10;
function preleverPelerinage(state, C) {
  const out = [];
  for (const culture of culturesDimieres(state)) {
    const dime = dimeCulture(state, culture, C);
    if (!dime || dime.versements.length === 0) continue;
    let total;
    for (const v of dime.versements) {
      for (const [res, montant] of Object.entries(v.montants)) {
        const rs = v.payeur.resources?.[res];
        if (rs) rs.stock -= montant;
        total ?? (total = {});
        total[res] = (total[res] ?? 0) + montant;
      }
      const or = fmt1(v.montants["Or"] ?? 0);
      const nourr = fmt1(v.montants["Nourriture"] ?? 0);
      const science = fmt1(v.montants["Science"] ?? 0);
      state.log.push({
        turn: state.turn + 1,
        type: "Culture",
        joueur: v.payeur.n,
        texte: `\u{1F56F} P\xE8lerinage \u2014 ${v.payeur.nom} verse ${or} Or, ${nourr} Nourr., ${science} Science \xE0 ${dime.pontife.nom} (d\xEEme de la culture ${culture}).`
      });
    }
    if (total) {
      for (const [res, montant] of Object.entries(total)) {
        const rs = dime.pontife.resources?.[res];
        if (rs) rs.stock += montant;
      }
    }
    out.push(dime);
  }
  return out;
}

// src/engine/production.ts
function productionVille(state, p, ville, C) {
  const saison = state.saison;
  const coef = C.p.gainsCrediteStock;
  const batiments = effetsBatimentsVille(ville, C);
  const amenagements = effetsAmenagementsVille(ville, C.config);
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
  const total = {};
  for (const canal of [batiments, amenagements, nourrEte, autres, habitants]) {
    for (const [res, v] of Object.entries(canal)) {
      total[res] = (total[res] ?? 0) + v;
    }
  }
  return { batiments, amenagements, nourrEte, autres, habitants, total };
}

// src/engine/dogmes.ts
function tourismeVille(state, p, ville, C) {
  return productionVille(state, p, ville, C).total["Tourisme"] ?? 0;
}
function dogmesCulture(state, culture) {
  return (state.dogmes ?? []).filter((d) => d.culture === culture).sort((a, b) => a.palier - b.palier);
}
function joueurPontifeCulture(state, culture, C) {
  let meilleur;
  for (const q of state.players) {
    let t = 0;
    for (const v of q.villes) {
      if (v.culture === culture) t += tourismeVille(state, q, v, C);
    }
    if (t <= 0) continue;
    if (!meilleur || t > meilleur.tourisme) meilleur = { joueur: q, tourisme: t };
  }
  return meilleur;
}
function effetsDogmeCulture(state, culture, type, C = cfgOf(state.config)) {
  if (!state.dogmes?.length) return 0;
  let total = 0;
  for (const d of state.dogmes) {
    if (d.culture !== culture) continue;
    const ref2 = (C.config.dogmes ?? []).find((r) => r.nom === d.nom);
    if (!ref2?.effets) continue;
    for (const e of ref2.effets) if (e.type === type) total += e.valeur;
  }
  return total;
}

// src/engine/domiciles.ts
function domicileDef(nom, C) {
  if (!nom) return void 0;
  const n = nom.toLowerCase() === "masure" ? "Taudis" : nom;
  return C.config.domiciles.find((d) => d.domicile.toLowerCase() === n.toLowerCase());
}
function qualiteDomicile(nom, C) {
  return domicileDef(nom, C)?.qualite ?? 0;
}
function stockRang(type, rang, C) {
  const def = rangsDefsType(type, C).find(
    (d) => nomRang(d.rang).toLowerCase() === nomRang(rang).toLowerCase()
  );
  return def?.domicilesRang ? def.domicilesRang.map((e) => ({ ...e })) : [];
}
function domicilesApportesVille(ville, C) {
  const total = /* @__PURE__ */ new Map();
  for (const nom of [...ville.amenagements ?? [], ...batimentsActifsVille(ville, C)]) {
    const ref2 = constructionRef(nom, C.config, ville.type);
    if (!ref2) continue;
    for (const [domicile, nombre] of Object.entries(logementsConstructionRef(ref2, C.config))) {
      if (nombre > 0) total.set(domicile, (total.get(domicile) ?? 0) + nombre);
    }
  }
  return [...total.entries()].map(([domicile, nombre]) => ({ domicile, nombre }));
}
function domicilesCultureVille(ville, C, state) {
  const cult = cultureDef(ville.culture, C.config);
  const out = [];
  if (cult?.taudisParHabitation) out.push({ domicile: "Taudis", nombre: cult.taudisParHabitation });
  if (cult?.palaisParHabitation) out.push({ domicile: "Palais", nombre: cult.palaisParHabitation });
  if (state) {
    const solid = effetsDogmeCulture(state, ville.culture, "taudisParHabitation", C);
    if (solid > 0) out.push({ domicile: "Taudis", nombre: solid });
  }
  return out;
}
function reserveNobleDomicile(nom) {
  const n = (nom ?? "").trim().toLowerCase();
  return n === "maison de notable" || n === "palais";
}
function vivantsVille(state, nJoueur, ville) {
  return (state.population[nJoueur] ?? []).filter(
    (c) => c.statut !== "D\xE9c\xE9d\xE9" && c.ville === ville.nom
  );
}
function attribuerDomicilesVille(state, p, ville, C) {
  if (!Array.isArray(ville.domiciles)) initStockVille(ville, C);
  const pop = vivantsVille(state, p.n, ville);
  const stock = /* @__PURE__ */ new Map();
  for (const e of ville.domiciles ?? []) stock.set(e.domicile, (stock.get(e.domicile) ?? 0) + e.nombre);
  for (const e of domicilesCultureVille(ville, C, state)) {
    stock.set(e.domicile, (stock.get(e.domicile) ?? 0) + e.nombre);
  }
  const servs = [...pop].sort((a, b) => (b.prestige ?? 0) - (a.prestige ?? 0));
  const typesTries = [...C.config.domiciles].sort((a, b) => b.qualite - a.qualite);
  let loges = 0;
  for (const c of servs) {
    const noble = rangDe(c, C) === "noble";
    if (c.domicile && (stock.get(c.domicile) ?? 0) > 0 && (noble || !reserveNobleDomicile(c.domicile))) {
      stock.set(c.domicile, (stock.get(c.domicile) ?? 0) - 1);
      loges++;
      continue;
    }
    let place = null;
    for (const t of typesTries) {
      if (!noble && reserveNobleDomicile(t.domicile)) continue;
      const restant = stock.get(t.domicile) ?? 0;
      if (restant > 0) {
        stock.set(t.domicile, restant - 1);
        place = t.domicile;
        break;
      }
    }
    c.domicile = place;
    if (place) loges++;
  }
  return loges;
}
function initStockVille(ville, C) {
  ville.domiciles = stockRang(ville.type ?? "Ville", ville.rang ?? "Hameau", C);
}

// src/engine/habitations.ts
function typeVille(ville) {
  return ville.type ?? "Ville";
}
function rangDef(type, rang, C) {
  const nom = nomRang(rang).toLowerCase();
  return rangsDefsType(type, C).find((d) => nomRang(d.rang).toLowerCase() === nom);
}
function habitationDef(ville, C) {
  return rangDef(typeVille(ville), ville.rang ?? "Hameau", C);
}
function metiersDisponiblesRang(ville, C) {
  const out = {};
  for (const e of habitationDef(ville, C)?.metiersBase ?? []) {
    out[e.metier] = (out[e.metier] ?? 0) + e.places;
  }
  return out;
}

// src/engine/bonheur.ts
function scoreOptimum(offre, demande) {
  if (demande <= 0) return offre <= 0 ? 100 : 0;
  if (offre <= 0) return 0;
  const malus = Math.abs(1 - offre / demande);
  return Math.max(0, Math.min(100, Math.round(100 * (1 - malus))));
}
function scoreSante(malades, habitants) {
  if (habitants <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round(100 - 100 * malades / habitants)));
}
function bonheurVille(s) {
  const v = [s.emploi, s.logement, s.securite, s.sante];
  return Math.round(v.reduce((a, b) => a + b, 0) / v.length);
}
function emploisOffertsVille(state, p, ville, C) {
  let offres = 0;
  for (const m of Object.keys(metiersDisponiblesRang(ville, C))) {
    const cap = capMetierVille(m, ville, C, { state, joueur: p.n });
    if (Number.isFinite(cap)) offres += Math.floor(cap);
  }
  return offres;
}
function logementsVille(ville, C, state) {
  const stockVille = Array.isArray(ville.domiciles) ? ville.domiciles.reduce((acc, e) => acc + e.nombre, 0) : null;
  const apportes = domicilesApportesVille(ville, C).reduce((acc, e) => acc + e.nombre, 0) + domicilesCultureVille(ville, C, state).reduce((acc, e) => acc + e.nombre, 0);
  if (stockVille !== null) return stockVille + apportes;
  const def = rangsDefsType(ville.type ?? "Ville", C).find(
    (d) => nomRang(d.rang).toLowerCase() === nomRang(ville.rang ?? "Hameau").toLowerCase()
  );
  if (Array.isArray(def?.domicilesRang)) {
    return def.domicilesRang.reduce((acc, e) => acc + e.nombre, 0) + apportes;
  }
  const txt = def?.domicilesDisponibles ?? "";
  let total = 0;
  for (const part of txt.split(",")) {
    const m = part.trim().match(/^(\d+)\s/);
    if (m) total += Number(m[1]);
  }
  return total + apportes;
}
function scoresVille(state, p, ville, C) {
  const pop = (state.population[p.n] ?? []).filter(
    (c) => c.statut !== "D\xE9c\xE9d\xE9" && c.ville === ville.nom
  );
  const habitants = pop.length;
  const travailleurs = pop.filter((c) => c.age >= C.p.adultAge).length;
  const enPoste = pop.filter((c) => c.metier && c.age >= C.p.adultAge).length;
  const malades = pop.filter((c) => c.statut === "Malade").length;
  const offres = emploisOffertsVille(state, p, ville, C);
  const structure = scoreOptimum(offres, travailleurs);
  const pourvu = scoreOptimum(enPoste, travailleurs);
  const emploi = Math.round((structure + pourvu) / 2);
  const logement = scoreOptimum(logementsVille(ville, C, state), habitants);
  const securite = scoreOptimum(garnisonHabitationVille(p, ville, C, state), 100 * rangNiveau(ville, C));
  const sante = scoreSante(malades, habitants);
  return { emploi, logement, securite, sante };
}
function bonusBonheurRegime(p, C) {
  return regimeDef(p.regime, C.config)?.bonheurParHabitation ?? 0;
}
function bonheurVilleComplete(state, p, ville, C) {
  const dogme = effetsDogmeCulture(state, ville.culture, "bonheurVille", C);
  return Math.min(
    100,
    bonheurVille(scoresVille(state, p, ville, C)) + bonusBonheurRegime(p, C) + dogme + bonheurApportesVille(ville, C)
  );
}
function bonheurApportesVille(ville, C) {
  let total = 0;
  for (const b of ville.batiments ?? []) {
    total += constructionRef(b, C.config, ville.type)?.bonheurApporte ?? 0;
  }
  for (const a of ville.amenagements ?? []) {
    total += constructionRef(a, C.config)?.bonheurApporte ?? 0;
  }
  return total;
}

// src/engine/statutSocial.ts
function rangSocial(prestige, seuilBourgeois = 100) {
  if (prestige >= 250) return "noble";
  if (prestige >= seuilBourgeois) return "bourgeois";
  return "roturier";
}
function seuilBourgeoisCulture(culture, C) {
  return cultureDef(culture ?? "", C.config)?.prestigeSeuilBourgeois ?? 100;
}
function rangDe(c, C) {
  if (isNobleDyn(c.dynastie, C)) return "noble";
  return rangSocial(prestigeDe(c), seuilBourgeoisCulture(c.culture, C));
}
var PRESTIGE_NOBLE_NAISSANCE = 300;
function prestigeDe(c) {
  return c.prestige ?? 0;
}
function gainPrestigeTour(c, C, bonheurVille2) {
  let g = 0;
  if (!c.metier) g -= 2;
  if (!c.domicile) g -= 2;
  if (c.statut === "Malade") g -= 2;
  if (c.domicile) g += Math.max(0, qualiteDomicile(c.domicile, C));
  const q = C.metiers.find((m) => m.metier === c.metier)?.qualite;
  if (q === "bourgeois") g += 2;
  else if (q === "noble") g += 5;
  if (bonheurVille2 > 50) g += 1;
  return g;
}
function evaluerFamilles(state, p, C) {
  const evenements = [];
  const pop = state.population[p.n] ?? [];
  const parId = new Map(pop.map((c) => [c.id, c]));
  const bonheurParVille = /* @__PURE__ */ new Map();
  for (const v of p.villes) bonheurParVille.set(v.nom, bonheurVilleComplete(state, p, v, C));
  const adultes = pop.filter((c) => c.statut !== "D\xE9c\xE9d\xE9" && c.age >= C.p.adultAge);
  const traites = /* @__PURE__ */ new Set();
  const appliquer = (c, gain) => {
    const ancien = rangDe(c, C);
    const nouveauPrestige = prestigeDe(c) + gain;
    c.prestige = Math.max(0, Math.round(nouveauPrestige));
    const nouveau = rangDe(c, C);
    if (nouveau !== ancien) {
      evenements.push({
        joueur: p.n,
        nom: fullName(c),
        texte: nouveau === "bourgeois" ? `\u{1F4C8} ${fullName(c)} acc\xE8de \xE0 la bourgeoisie (prestige ${c.prestige}).` : nouveau === "noble" ? `\u{1F451} ${fullName(c)} acc\xE8de \xE0 la noblesse (prestige ${c.prestige}).` : ancien === "noble" ? `\u{1F4C9} ${fullName(c)} retombe bourgeois (prestige ${c.prestige}).` : `\u{1F4C9} ${fullName(c)} retombe roturier (prestige ${c.prestige}).`
      });
    }
  };
  for (const a of adultes) {
    if (traites.has(a.id)) continue;
    const conj = a.mariageId ? parId.get(a.mariageId) : void 0;
    if (conj && conj.statut !== "D\xE9c\xE9d\xE9" && !traites.has(conj.id)) {
      traites.add(a.id);
      traites.add(conj.id);
      const gainA = gainPrestigeTour(a, C, bonheurParVille.get(a.ville) ?? 0);
      const gainB = gainPrestigeTour(conj, C, bonheurParVille.get(conj.ville) ?? 0);
      const pA = prestigeDe(a), pB = prestigeDe(conj);
      const ancienA = rangDe(a, C), ancienB = rangDe(conj, C);
      const moyenneActuelle = (pA + pB) / 2;
      const gainMoyen = (gainA + gainB) / 2;
      a.prestige = Math.max(0, Math.round(moyenneActuelle + gainMoyen));
      conj.prestige = Math.max(0, Math.round(moyenneActuelle + gainMoyen));
      for (const [perso, ancien] of [[a, ancienA], [conj, ancienB]]) {
        if (rangDe(perso, C) !== ancien) {
          const nv = rangDe(perso, C);
          evenements.push({
            joueur: p.n,
            nom: fullName(perso),
            texte: nv === "bourgeois" ? `\u{1F4C8} ${fullName(perso)} acc\xE8de \xE0 la bourgeoisie (prestige ${perso.prestige}).` : nv === "noble" ? `\u{1F451} ${fullName(perso)} acc\xE8de \xE0 la noblesse (prestige ${perso.prestige}).` : ancien === "noble" ? `\u{1F4C9} ${fullName(perso)} retombe bourgeois (prestige ${perso.prestige}).` : `\u{1F4C9} ${fullName(perso)} retombe roturier (prestige ${perso.prestige}).`
          });
        }
      }
      continue;
    }
    traites.add(a.id);
    appliquer(a, gainPrestigeTour(a, C, bonheurParVille.get(a.ville) ?? 0));
  }
  for (const c of pop) {
    if (c.statut === "D\xE9c\xE9d\xE9" || c.age < C.p.adultAge) continue;
    if (c.prestigeHerite !== void 0) continue;
    const mere = c.mereId ? parId.get(c.mereId) : void 0;
    const pere = c.pereId ? parId.get(c.pereId) : void 0;
    if (!mere && !pere) continue;
    let heritage;
    if (mere && pere) {
      heritage = Math.round((prestigeDe(mere) + prestigeDe(pere)) / 2 * 0.5);
    } else {
      heritage = Math.round(prestigeDe(mere ?? pere) * 0.5);
    }
    if (isNobleDyn(c.dynastie, C)) {
      heritage = Math.max(PRESTIGE_NOBLE_NAISSANCE, heritage);
    }
    c.prestige = heritage;
    c.prestigeHerite = heritage;
  }
  return evenements;
}

// src/engine/metiers.ts
function maybeAssignProfesseurs(state, p, rng, recap) {
  const C = cfgOf(state.config);
  const pop = state.population[p.n] ?? [];
  for (const ville of p.villes) {
    const rank = schoolRankOf(ville.batiments, C.config);
    if (rank <= 0) continue;
    const vivants = pop.filter((c) => c.statut !== "D\xE9c\xE9d\xE9" && c.ville === ville.nom);
    let nbProfs = vivants.filter((c) => c.metier === C.p.metierProfesseur).length;
    if (nbProfs >= rank) continue;
    const chance = C.p.professeurBaseChance / Math.log(nbProfs + 2.72);
    if (!rng.chance(chance)) continue;
    const candidats = vivants.filter((c) => c.age >= C.p.adultAge && (!c.metier || c.metier === C.p.metierChasseur) && !(c.traits ?? []).includes(C.p.traitObstine));
    if (candidats.length === 0) continue;
    const elu = rng.pick(candidats);
    elu.metier = C.p.metierProfesseur;
    nbProfs++;
    bump(recap.metiersAttribues, C.p.metierProfesseur);
    state.log.push({
      turn: state.turn + 1,
      type: "M\xE9tier",
      joueur: p.n,
      texte: `${fullName(elu)} est promu Professeur \xE0 ${ville.nom}.`
    });
  }
}
function gestionMariages(state, p, rng, recap) {
  const C = cfgOf(state.config);
  const pop = state.population[p.n] ?? [];
  const celib = pop.filter(
    (c) => c.statut !== "D\xE9c\xE9d\xE9" && !c.mariageId && c.age >= C.p.adultAge
  );
  const mariesIds = /* @__PURE__ */ new Set();
  const marier = (a, b) => {
    a.mariage = fullName(b);
    b.mariage = fullName(a);
    a.mariageId = b.id;
    b.mariageId = a.id;
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
    const dispo = candidats.filter((x) => !x.mariageId && !mariesIds.has(x.id));
    if (dispo.length === 0) return false;
    const b = rng.pick(dispo);
    if (rng.chance(computeMarriageProbability(a, b, C))) marier(a, b);
    return true;
  };
  const celibParVille = /* @__PURE__ */ new Map();
  for (const c of celib) {
    const l = celibParVille.get(c.ville);
    if (l) l.push(c);
    else celibParVille.set(c.ville, [c]);
  }
  for (const celibVille of celibParVille.values()) {
    const femmes = rng.shuffle(celibVille.filter((c) => c.sexe === "F"));
    const hommes = celibVille.filter((c) => c.sexe === "M");
    for (const f of femmes) {
      if (f.mariageId) continue;
      if (!tenter(f, hommes)) break;
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
  if (f.metier && f.metier !== C.p.metierChasseur) score += C.p.mariageBonusMetier;
  if (h.metier && h.metier !== C.p.metierChasseur) score += C.p.mariageBonusMetier;
  score += characterMarriageMod(f, C) + characterMarriageMod(h, C);
  if (f.culture && h.culture) {
    score += f.culture.toLowerCase() === h.culture.toLowerCase() ? C.p.mariageMemeCulture : C.p.mariageAutreCulture;
  }
  if (rangDe(f, C) === rangDe(h, C)) score += C.p.mariageMemeRang;
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
function assignAdultMetier(state, p, c, recap, vivantsParVille) {
  const C = cfgOf(state.config);
  const ville = p.villes.find((v) => v.nom === c.ville);
  let metier = null;
  if (ville) {
    metier = premierPosteLibre(state, p, ville, C, vivantsParVille);
  }
  c.metier = metier;
  if (metier) bump(recap.metiersAttribues, metier);
}
function metierAllowedForCharacter(metier, c, p, C = cfgOf()) {
  const td = metierDef(metier, C.config);
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
  return true;
}
function gouverneurDeVille(state, p, ville, C = cfgOf(state.config)) {
  return (state.population[p.n] ?? []).find(
    (c) => c.statut !== "D\xE9c\xE9d\xE9" && c.metier === C.p.metierGouverneur && c.ville === ville
  ) ?? null;
}
function designerGouverneurs(state, C = cfgOf(state.config)) {
  for (const p of state.players) {
    const pop = state.population[p.n] ?? [];
    for (const ville of p.villes) {
      if (gouverneurDeVille(state, p, ville.nom, C)) continue;
      const nobles = pop.filter(
        (c) => c.statut !== "D\xE9c\xE9d\xE9" && c.ville === ville.nom && isNobleDyn(c.dynastie, C) && c.metier !== C.p.metierDirigeant && c.metier !== C.p.metierHeritierStr
      );
      if (nobles.length === 0) continue;
      const elu = nobles.reduce((a, b) => b.age > a.age ? b : a);
      elu.metier = C.p.metierGouverneur;
      state.log.push({
        turn: state.turn + 1,
        type: "M\xE9tier",
        joueur: p.n,
        texte: `\u{1F3F0} ${ville.nom} n'a pas de ${C.p.metierGouverneur} \u2014 ${fullName(elu)}, noble le plus \xE2g\xE9 de la ville, prend automatiquement la charge (+10 % d'imp\xF4ts sur la ville).`
      });
    }
  }
}
function emplacementsMetierVille(metier, ville, C = cfgOf(), ctx) {
  let total = 0;
  for (const nom of [...batimentsActifsVille(ville, C), ...ville.amenagements ?? []]) {
    const ref2 = constructionRef(nom, C.config);
    if (!ref2) continue;
    if (estCotiereRef(ref2) && !villeCotiere(ville)) continue;
    for (const e of emplacementsConstructionRef(ref2, C.config)) {
      if (e.metier === metier) total += e.places;
    }
  }
  if (metier === "Scientifique") {
    const n = cultureDef(ville.culture, C.config)?.scientifiqueParBatiment ?? 0;
    if (n) total += n * (ville.batiments ?? []).filter(
      (b) => constructionRef(b, C.config)?.batimentDeFaction === true
    ).length;
  }
  if (ctx) total += emplacementsRoutesVille(metier, ctx.state, ctx.joueur, ville.nom, C);
  return total;
}
function emplacementsRoutesVille(metier, state, joueur, villeNom, C) {
  const routes = state.routesCommerce ?? [];
  if (routes.length === 0) return 0;
  let total = 0;
  for (const r of routes) {
    if ("marchandId" in r) continue;
    if (r.joueur === joueur && r.villeOrigine === villeNom) {
      const ref2 = r.amenagement ? constructionRef(r.amenagement, C.config) : null;
      if (ref2) {
        for (const e of emplacementsConstructionRef(ref2, C.config)) {
          if (e.metier === metier) total += e.places;
        }
      }
    }
  }
  return total;
}
function capMetierVille(metier, ville, C = cfgOf(), ctx) {
  if (!metier) return Number.POSITIVE_INFINITY;
  const empl = emplacementsMetierVille(metier, ville, C, ctx);
  const td = metierDef(metier, C.config);
  const dogmeGarde = metier === C.p.metierGarde && ctx?.state ? effetsDogmeCulture(ctx.state, ville.culture, "gardeParHabitation", C) : 0;
  if (td?.capParVille !== void 0) return td.capParVille + empl + dogmeGarde;
  const base = metiersDisponiblesRang(ville, C)[metier] ?? 0;
  const productif = !!td && (td.ressource1 !== "" && td.valeur1 !== 0 || td.ressource2 !== "" && td.valeur2 !== 0);
  if (productif || base > 0 || empl > 0 || dogmeGarde > 0) return base + empl + dogmeGarde;
  return Number.POSITIVE_INFINITY;
}
function postesLibresVille(vivants, ville, C, ctx) {
  const enPoste = {};
  for (const c of vivants) {
    if (c.metier) enPoste[c.metier] = (enPoste[c.metier] ?? 0) + 1;
  }
  const plafonnes = [];
  for (const t of C.metiers) {
    if (t.nobleSeul || t.attribution === "Arm\xE9e" || t.attribution === "Succession" || t.attribution === "Ville") continue;
    if (Number.isFinite(capMetierVille(t.metier, ville, C, ctx))) plafonnes.push(t.metier);
  }
  plafonnes.sort((a, b) => (a === C.p.metierChasseur ? 1 : 0) - (b === C.p.metierChasseur ? 1 : 0));
  return plafonnes.map((m) => ({
    metier: m,
    libres: Math.max(0, Math.floor(capMetierVille(m, ville, C, ctx)) - (enPoste[m] ?? 0))
  }));
}
function premierPosteLibre(state, p, ville, C, vivantsParVille) {
  const vivants = vivantsParVille ? (vivantsParVille.get(ville.nom) ?? []).filter((c) => c.statut !== "D\xE9c\xE9d\xE9") : (state.population[p.n] ?? []).filter((c) => c.statut !== "D\xE9c\xE9d\xE9" && c.ville === ville.nom);
  const postes = postesLibresVille(vivants, ville, C, { state, joueur: p.n });
  const premier = postes.find((x) => x.libres > 0);
  return premier ? premier.metier : null;
}
function reaffecterMetiers(state, C = cfgOf(state.config)) {
  for (const p of state.players) {
    const pop = state.population[p.n] ?? [];
    const vivantsParVille = /* @__PURE__ */ new Map();
    for (const c of pop) {
      if (c.statut === "D\xE9c\xE9d\xE9") continue;
      const l = vivantsParVille.get(c.ville);
      if (l) l.push(c);
      else vivantsParVille.set(c.ville, [c]);
    }
    for (const ville of p.villes) {
      const vivants = vivantsParVille.get(ville.nom) ?? [];
      if (!C.metiers.some((t) => t.metier === "Marchand")) {
        const exMarchands = vivants.filter((c) => c.metier === "Marchand");
        if (exMarchands.length > 0) {
          for (const c of exMarchands) c.metier = null;
          state.log.push({
            turn: state.turn + 1,
            type: "M\xE9tier",
            joueur: p.n,
            texte: `${ville.nom} : le m\xE9tier de Marchand a \xE9t\xE9 retir\xE9 du jeu \u2014 ${exMarchands.length} habitant(s) perd(ent) le titre (sans emploi, puis reprise d'un poste aux places libres).`
          });
        }
      }
      const enPoste = {};
      for (const c of vivants) {
        if (!c.metier) continue;
        (enPoste[c.metier] ?? (enPoste[c.metier] = [])).push(c);
      }
      for (const t of C.metiers) {
        const cap = capMetierVille(t.metier, ville, C, { state, joueur: p.n });
        if (!Number.isFinite(cap)) continue;
        const occupants = enPoste[t.metier] ?? [];
        if (occupants.length <= Math.floor(cap)) continue;
        const perdants = [...occupants].sort((x, y) => y.age - x.age).slice(0, occupants.length - Math.floor(cap));
        for (const c of perdants) c.metier = null;
        state.log.push({
          turn: state.turn + 1,
          type: "M\xE9tier",
          joueur: p.n,
          texte: `${ville.nom} : capacit\xE9 de ${t.metier.toLowerCase()}(s) atteinte (${Math.floor(cap)}) \u2014 ${perdants.length} habitant(s) (les plus \xE2g\xE9s) passe(nt) sans emploi.`
        });
      }
      const attribues = /* @__PURE__ */ new Map();
      const changements = /* @__PURE__ */ new Map();
      const candidats = vivants.filter((c) => !c.metier && c.age >= C.p.adultAge || c.metier === C.p.metierChasseur).sort((a, b) => b.age - a.age);
      if (candidats.length > 0) {
        const postes = postesLibresVille(vivants, ville, C, { state, joueur: p.n });
        for (const c of candidats) {
          const etaitChasseur = c.metier === C.p.metierChasseur;
          const poste = postes.find((x) => x.libres > 0 && (!etaitChasseur || x.metier !== C.p.metierChasseur));
          if (!poste) {
            if (etaitChasseur) continue;
            else break;
          }
          c.metier = poste.metier;
          poste.libres -= 1;
          if (etaitChasseur) {
            const pChasseur = postes.find((x) => x.metier === C.p.metierChasseur);
            if (pChasseur) pChasseur.libres += 1;
            changements.set(poste.metier, (changements.get(poste.metier) ?? 0) + 1);
          } else {
            attribues.set(poste.metier, (attribues.get(poste.metier) ?? 0) + 1);
          }
        }
      }
      if (attribues.size > 0) {
        const textePostes = [...attribues.entries()].map(([m, n]) => `${n} ${m.toLowerCase()}(s)`).join(", ");
        state.log.push({
          turn: state.turn + 1,
          type: "M\xE9tier",
          joueur: p.n,
          texte: `${ville.nom} : ${[...attribues.values()].reduce((x, y) => x + y, 0)} sans-emploi(s) pren(nen)t un poste (places disponibles) \u2014 ${textePostes}.`
        });
      }
      if (changements.size > 0) {
        const textePostes = [...changements.entries()].map(([m, n]) => `${n} ${m.toLowerCase()}(s)`).join(", ");
        state.log.push({
          turn: state.turn + 1,
          type: "M\xE9tier",
          joueur: p.n,
          texte: `${ville.nom} : ${[...changements.values()].reduce((x, y) => x + y, 0)} chasseur(s) change(nt) de m\xE9tier (places disponibles) \u2014 ${textePostes} ; le Chasseur n est jamais qu un poste de repli.`
        });
      }
    }
  }
}

// src/engine/economie.ts
function multProdRang(c, C) {
  const r = rangDe(c, C);
  return r === "noble" ? C.p.prodMultNoble : r === "bourgeois" ? C.p.prodMultBourgeois : 1;
}
function consoNourrHabitant(c, C, regime, state) {
  const r = rangDe(c, C);
  if (state && r === "bourgeois") {
    const dogme = effetsDogmeCulture(state, c.culture, "consoNourrBourgeois", C);
    if (dogme > 0) return dogme;
  }
  const reg = regimeDef(regime ?? "", C.config);
  return r === "noble" ? reg?.consoNourrNobleRegime ?? C.p.consoNourrNoble : r === "bourgeois" ? reg?.consoNourrBourgeoisRegime ?? C.p.consoNourrBourgeois : C.p.consoNourrParHab;
}
function facteurTaxes(ville, C, ressource) {
  if (ville.taxes === "Faible") return ressource === "Nourriture" ? C.p.taxNourrFaibles : C.p.taxOrFaibles;
  if (ville.taxes === "Forte") return ressource === "Nourriture" ? C.p.taxNourrHautes : C.p.taxOrHautes;
  return 1;
}
function calculerGainsPopulation(state, p) {
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
  const metiers = {};
  const batimentCotierActif = villeCotiere(ville) && (ville.batiments ?? []).some((b) => estCotiereRef(constructionRef(b, C.config)));
  const champsNourriciers = cultureDef(ville.culture, C.config)?.nourrEteParFermier ?? 0;
  const modsTier3 = modificateursPaysJoueur(p, C);
  for (const c of vivants) {
    if (!c.metier) {
      const trav = effetsDogmeCulture(state, c.culture, "travailNourriture", C);
      if (trav > 0) metiers["Nourriture"] = (metiers["Nourriture"] ?? 0) + trav;
      continue;
    }
    const td = metierDef(c.metier, C.config);
    if (!td) continue;
    if (td.ete && state.saison !== "\xC9t\xE9") continue;
    let mult = multProdRang(c, C);
    if (modsTier3.multProductionBourgeois > 1 && rangDe(c, C) === "bourgeois") {
      mult *= modsTier3.multProductionBourgeois;
    }
    for (const bm of modsTier3.bonusMetierParHabitant) {
      if (c.metier === bm.metier) {
        metiers[bm.ressource] = (metiers[bm.ressource] ?? 0) + bm.valeur * mult;
      }
    }
    if (batimentCotierActif && c.metier === "P\xEAcheur") {
      metiers["B\xE9tail"] = (metiers["B\xE9tail"] ?? 0) + 0.5 * mult;
    }
    if (champsNourriciers && state.saison === "\xC9t\xE9" && c.metier === "Fermier") {
      metiers["Nourriture"] = (metiers["Nourriture"] ?? 0) + champsNourriciers * mult;
    }
    if (td.ressource1 && td.valeur1 !== 0) {
      metiers[td.ressource1] = (metiers[td.ressource1] ?? 0) + td.valeur1 * mult;
    }
    if (td.ressource2 && td.valeur2 !== 0) {
      metiers[td.ressource2] = (metiers[td.ressource2] ?? 0) + td.valeur2 * mult;
    }
  }
  const taxeMult = {};
  for (const res of Object.keys(metiers)) taxeMult[res] = facteurTaxes(ville, C, res);
  const bonusTaxes = {};
  const ajouteBonus = (res, part) => {
    bonusTaxes[res] = (bonusTaxes[res] ?? 0) + part;
  };
  if (gouverneurDeVille(state, p, ville.nom, C)) {
    for (const res of Object.keys(metiers)) ajouteBonus(res, 0.1);
  }
  if (C.p.metierBanquier && vivants.some((c) => c.metier === C.p.metierBanquier) && metiers["Or"] !== void 0) ajouteBonus("Or", 0.1);
  if (C.p.metierProfesseur && vivants.some((c) => c.metier === C.p.metierProfesseur) && metiers["Science"] !== void 0) {
    ajouteBonus("Science", 0.1 + modsTier3.scienceProfesseurPlus);
  }
  if (C.p.metierTroubadour && vivants.some((c) => c.metier === C.p.metierTroubadour) && metiers["Tourisme"] !== void 0) ajouteBonus("Tourisme", 0.1);
  const taxes = {};
  for (const [res, v] of Object.entries(metiers)) {
    const tv = v * taxeMult[res] * (1 + (bonusTaxes[res] ?? 0));
    if (tv !== 0) taxes[res] = tv;
  }
  const conso = {};
  const consoNourr = vivants.reduce((n, c) => n + consoNourrHabitant(c, C, p.regime, state), 0);
  if (consoNourr !== 0) conso["Nourriture"] = -consoNourr;
  const net = {};
  for (const [res, v] of Object.entries(taxes)) net[res] = (net[res] ?? 0) + v;
  for (const [res, v] of Object.entries(conso)) net[res] = (net[res] ?? 0) + v;
  for (const k of Object.keys(net)) if (net[k] === 0) delete net[k];
  return { habitants: vivants.length, metiers, taxeMult, bonusTaxes, taxes, conso, net };
}
function taxBirthFactor(ville, C = cfgOf()) {
  if (!ville) return 1;
  return ville.taxes === "Faible" ? C.p.taxNaissFaibles : ville.taxes === "Forte" ? C.p.taxNaissHautes : 1;
}
function nourritureBetail(p) {
  const betail = p.resources["B\xE9tail"]?.stock ?? 0;
  return Math.max(0, betail) * 4;
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
    const recu = part * (regimeDef(suzerain.regime, C.config)?.tributVassalMult ?? 1) * (1 + effetsDogmeCulture(state, suzerain.culture, "tributVassal", C)) * (1 + modificateursPaysJoueur(suzerain, C).tributVassalPlus);
    const gainsSuz = gainsParJoueur[suzerain.n] ?? (gainsParJoueur[suzerain.n] = {});
    gainsSuz["Or"] = (gainsSuz["Or"] ?? 0) + recu;
    state.log.push({
      turn: state.turn + 1,
      type: "Syst\xE8me",
      joueur: p.n,
      texte: `\u{1F91D} Vassalit\xE9 \u2014 ${p.nom} verse ${Math.round(part * 10) / 10} Or \xE0 ${suzerain.nom} (tribut de vassalit\xE9 : ${Math.round(C.p.vassalPrelevement * 100)} % des revenus de ses habitants).`
    });
  }
}

// src/engine/indexPopulation.ts
var cacheIndexPop = null;
function indexPopulationMonde(state) {
  if (cacheIndexPop && cacheIndexPop.state === state) return cacheIndexPop.index;
  const index = /* @__PURE__ */ new Map();
  for (const liste of Object.values(state.population ?? {})) {
    for (const c of liste ?? []) {
      if (c.statut !== "D\xE9c\xE9d\xE9") index.set(c.id, c);
    }
  }
  for (const cite of state.citesLibres ?? []) {
    for (const c of cite.population ?? []) {
      if (c.statut !== "D\xE9c\xE9d\xE9") index.set(c.id, c);
    }
  }
  cacheIndexPop = { state, index };
  return index;
}
function ajouterALIndexPopulation(state, c) {
  if (cacheIndexPop && cacheIndexPop.state === state && c.statut !== "D\xE9c\xE9d\xE9") {
    cacheIndexPop.index.set(c.id, c);
  }
}
function retirerDeLIndexPopulation(state, id) {
  if (cacheIndexPop && cacheIndexPop.state === state) {
    cacheIndexPop.index.delete(id);
  }
}

// src/engine/sante.ts
function probaContracterMaladie(c, C = cfgOf()) {
  let delta = 0;
  for (const t of c.traits ?? []) {
    const td = t ? traitDef(t, C.config) : void 0;
    if (td) delta += td.life_delta;
  }
  const pente = C.p.maladiePente * Math.min(1.5, Math.max(0.5, 1 + delta / 100));
  return C.p.maladieBase * Math.exp(pente * c.age);
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
  const guerisseurs = (state.population[p.n] ?? []).filter(
    (x) => x.statut !== "D\xE9c\xE9d\xE9" && x.ville === c.ville && x.metier === "Gu\xE9risseur"
  ).length;
  contractMod -= guerisseurs * C.p.guerisseurContraction;
  cureMod += guerisseurs * C.p.guerisseurGuerison;
  contractMod += cultureDef(c.culture, C.config)?.maladieContractMod ?? 0;
  contractMod += effetsDogmeCulture(state, c.culture, "maladieContractMod", C);
  if (c.statut === "Sain" || c.statut === "Enceinte") {
    const pContract = probaContracterMaladie(c, C) + contractMod;
    if (rng.chance(Math.max(0, pContract))) {
      if (c.statut === "Enceinte") {
        c.statut = "Sain";
        c.pereBio = null;
        c.pereBioId = null;
        c.enfantBatard = false;
        state.log.push({
          turn: state.turn + 1,
          type: "Naissance",
          joueur: p.n,
          texte: `${fullName(c)} tombe malade en \xE9tant enceinte \u2014 elle perd le b\xE9b\xE9, et se r\xE9tablit.`
        });
      } else {
        c.statut = "Malade";
      }
    }
  } else if (c.statut === "Malade") {
    if (rng.chance(Math.max(0, probaContracterMaladie(c, C) + contractMod))) {
      killCharacter(state, p, c, "maladie", recap);
      return;
    }
    const pCure = C.p.probaGuerison - C.p.modGuerisonAge * c.age + cureMod;
    if (rng.chance(Math.max(0, pCure))) c.statut = "Sain";
  }
}
function killCharacter(state, p, c, cause, recap) {
  retirerDeLIndexPopulation(state, c.id);
  const C = cfgOf(state.config);
  c.statut = "D\xE9c\xE9d\xE9";
  if (c.mariageId) {
    const conjoint = toutesLesPopulations(state).find((x) => x.mariageId === c.id);
    if (conjoint) {
      conjoint.mariage = null;
      conjoint.mariageId = null;
    }
  }
  bump(recap.deces, c.dynastie);
  if (cause === "maladie") recap.decesMaladie++;
  state.log.push({
    turn: state.turn + 1,
    type: "D\xE9c\xE8s",
    joueur: p.n,
    texte: `${fullName(c)} (${c.age} ans, ${c.dynastie}${c.metier ? `, ${c.metier}` : ""}) meurt de ${cause === "maladie" ? "la maladie" : cause}.`
  });
  if (c.metier === C.p.metierDirigeant) {
    handleDirigeantSuccession(state, p, c, recap);
  }
}
function handleDirigeantSuccession(state, p, defunt, recap) {
  const C = cfgOf(state.config);
  const pop = state.population[p.n] ?? [];
  const heritier = pop.find(
    (c) => c.statut !== "D\xE9c\xE9d\xE9" && c.metier === C.p.metierHeritierStr
  );
  if (heritier) {
    heritier.metier = C.p.metierDirigeant;
    const rangs = C.config.paysRangs ?? [];
    const rangDef2 = rangs.find((r) => r.nom === p.rang);
    let sacreTxt = "";
    if (rangDef2) {
      const fS = 1;
      const fA = 0.5;
      const fDemocratie = p.regime === "D\xE9mocratie" ? 0 : 1;
      const demiOr = Math.floor((rangDef2.coutOr ?? 0) * fS * fA * fDemocratie);
      const demiNourr = Math.floor((rangDef2.coutNourriture ?? 0) * fS * fA * fDemocratie);
      const or = p.resources["Or"];
      if (or) or.stock -= demiOr;
      const nourr = p.resources["Nourriture"];
      if (nourr) nourr.stock -= demiNourr;
      if (demiOr > 0 || demiNourr > 0) {
        const reduc = [];
        if (fS < 1) reduc.push("Chancelier de justice : \u221225 %");
        if (fA < 0.5) reduc.push("Archichancelier : sacre d\u2019av\xE8nement r\xE9duit de moiti\xE9");
        sacreTxt = ` Sacre d'av\xE8nement pay\xE9 : ${demiOr} Or et ${demiNourr} Nourriture (${reduc.length > 0 ? `r\xE9duit \u2014 ${reduc.join(" ; ")}` : p.regime === "D\xE9mocratie" ? "sacre d\u2019av\xE8nement gratuit (D\xE9mocratie)" : `moiti\xE9 du prix du rang ${rangDef2.nom}`}).`;
      }
    }
    state.log.push({
      turn: state.turn + 1,
      type: "Syst\xE8me",
      joueur: p.n,
      texte: `${p.nom} : ${fullName(heritier)} (${heritier.dynastie}) succ\xE8de \xE0 ${fullName(defunt)} comme Dirigeant.${sacreTxt}`
    });
    return;
  }
  const nobles = pop.filter(
    (c) => c.statut !== "D\xE9c\xE9d\xE9" && c.age >= C.p.adultAge && isNobleDyn(c.dynastie, C) && c.metier !== C.p.metierSoldat && c.metier !== C.p.metierCommandant
  );
  const rng = makeRng(state.rngState);
  const eligibles = nobles.filter((c) => metierAllowedForCharacter(C.p.metierDirigeant, c, p, C));
  if (eligibles.length > 0) {
    const elu = rng.pick(eligibles);
    elu.metier = C.p.metierDirigeant;
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
function computeFecondite(state, p, c) {
  const C = cfgOf(state.config);
  if (c.statut === "D\xE9c\xE9d\xE9" || c.age < C.p.adultAge) return 0;
  if (c.sexe !== "F") {
    return maleAgeFactor(c.age) * orientationFertFactor(c.orientation) * cultureFertFactor(c.culture, C) * (1 + effetsDogmeCulture(state, c.culture, "fecondite", C));
  }
  const ville = p.villes.find((v) => v.nom === c.ville);
  const mari = c.mariageId ? indexPopulationMonde(state).get(c.mariageId) : void 0;
  if (mari && mari.sexe !== "M") return 0;
  const factorMari = mari ? maleAgeFactor(mari.age) * orientationFertFactor(mari.orientation) : C.p.fertSingleFactor;
  let proba = C.p.fertBaseRate;
  proba *= femaleAgeFactor(c.age);
  proba *= factorMari;
  proba *= traitsFertFactor(c, mari ?? null, C);
  proba *= cultureFertFactor(c.culture, C);
  proba *= 1 + effetsDogmeCulture(state, c.culture, "fecondite", C);
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
    const pere = mere.pereBioId ? pop.find((x) => x.id === mere.pereBioId) : void 0;
    accoucher(state, p, mere, pere, rng, recap);
    mere.statut = "Sain";
    mere.pereBio = null;
    mere.pereBioId = null;
  }
  const indexMonde = indexPopulationMonde(state);
  const villesParNom = new Map(p.villes.map((v) => [v.nom, v]));
  for (const mere of pop) {
    if (mere.sexe !== "F" || mere.statut !== "Sain" && mere.statut !== "Malade") continue;
    if (mere.age < C.p.adultAge) continue;
    const ville = villesParNom.get(mere.ville);
    const mari = mere.mariageId ? indexMonde.get(mere.mariageId) : void 0;
    if (mari && mari.sexe !== "M") continue;
    const factorMari = mari ? maleAgeFactor(mari.age) * orientationFertFactor(mari.orientation) * cultureFertFactor(mari.culture, C) * (1 + effetsDogmeCulture(state, mari.culture, "fecondite", C)) : C.p.fertSingleFactor;
    let proba = C.p.fertBaseRate;
    proba *= femaleAgeFactor(mere.age);
    proba *= factorMari;
    proba *= traitsFertFactor(mere, mari ?? null, C);
    proba *= cultureFertFactor(mere.culture, C);
    proba *= 1 + effetsDogmeCulture(state, mere.culture, "fecondite", C);
    proba *= orientationFertFactor(mere.orientation);
    proba *= taxBirthFactor(ville, C);
    if (rng.chance(proba)) {
      let pereBio;
      let batard = false;
      const amantsDeLaVille = pop.filter(
        (x) => x.sexe === "M" && (x.statut === "Sain" || x.statut === "Malade") && x.age >= C.p.adultAge && x.ville === mere.ville
      );
      if (mari) {
        if (rng.chance(C.p.adulteryRate)) {
          const amants = amantsDeLaVille.filter((x) => x.id !== mari.id);
          pereBio = amants.length > 0 ? rng.pick(amants) : void 0;
          batard = true;
        } else {
          pereBio = mari;
        }
      } else {
        pereBio = amantsDeLaVille.length > 0 ? rng.pick(amantsDeLaVille) : void 0;
        batard = true;
      }
      const etaitMalade = mere.statut === "Malade";
      mere.statut = "Enceinte";
      mere.pereBio = pereBio ? fullName(pereBio) : null;
      mere.pereBioId = pereBio ? pereBio.id : null;
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
    const dyn = computeBabyDynasty(state, mere, pere, batard, rng);
    const enfant = {
      id: newId(rng),
      nom: mere.nom,
      prenom: pickName(state, p, rng, void 0),
      dynastie: dyn,
      // (clé posée seulement pour les bébés nobles — le format
      //  compact de sauvegarde omet prestige sinon)
      ...isNobleDyn(dyn, C) ? { prestige: PRESTIGE_NOBLE_NAISSANCE } : {},
      sexe: rng.pickWeighted(C.genres, (g) => g.poids).nom === "Masculin" ? "M" : "F",
      age: 0,
      culture: mere.culture,
      ville: mere.ville,
      orientation: rng.pickWeighted(C.orientations, (o) => o.poids).nom,
      traits: ["", "", ""],
      statut: "Sain",
      mariage: null,
      mariageId: null,
      mere: fullName(mere),
      mereId: mere.id,
      pere: pere ? fullName(pere) : null,
      pereId: pere ? pere.id : null,
      pereBio: null,
      pereBioId: null,
      enfantBatard: batard,
      metier: null,
      fecondite: 0,
      armee: null
    };
    inheritTraits(enfant, mere, pere, rng, C);
    if (batard) ensureTraitPresent(enfant, C.p.traitBatard);
    if (consanguin) ensureTraitPresent(enfant, C.p.traitConsanguin);
    pop.push(enfant);
    ajouterALIndexPopulation(state, enfant);
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
  if (mere.mereId && mere.mereId === pere.mereId) return true;
  if (mere.pereId && mere.pereId === pere.pereId) return true;
  return false;
}
function computeBabyDynasty(state, mere, pere, batard, rng) {
  const C = cfgOf(state.config);
  if (batard) {
    if (pere && isNobleDyn(pere.dynastie, C)) return pere.dynastie;
    if (isNobleDyn(mere.dynastie, C)) return mere.dynastie;
    return C.p.dynastieRoturier;
  }
  const cult = cultureDef(mere.culture, C.config);
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

// src/engine/culture.ts
function tourismeVilleDe(state, p, ville) {
  const C = cfgOf(state.config);
  let t = 0;
  for (const b of ville.batiments ?? []) t += productionTourismeBatiment(b, C, ville.type);
  for (const a of ville.amenagements ?? []) t += productionTourismeBatiment(a, C, ville.type);
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
    if (c.statut === "D\xE9c\xE9d\xE9" || c.metier === C.p.metierDirigeant) continue;
    const culteAccueil = p.villes.find((v) => v.nom === c.ville)?.culture;
    const nationalisme = culteAccueil && culteAccueil !== c.culture ? effetsDogmeCulture(state, culteAccueil, "conversionLocale", C) : 0;
    const villeAccueil = p.villes.find((v) => v.nom === c.ville);
    const convBatiment = villeAccueil ? conversionLocaleBatimentsVille(villeAccueil, C) : 0;
    if (rng.chance(C.p.conversionProba)) {
      const poids = {};
      for (const [cult, w] of Object.entries(pression)) {
        let weight = w;
        if (cult === c.culture) weight *= C.p.conversionMemeCulture;
        weight *= 1 + effetsDogmeCulture(state, cult, "pressionCulture", C);
        const same = pop.filter((x) => x.statut !== "D\xE9c\xE9d\xE9" && x.ville === c.ville && x.culture === cult).length;
        weight += same * C.p.conversionPoidsLocal;
        poids[cult] = weight;
      }
      if ((nationalisme > 0 || convBatiment > 0) && culteAccueil) {
        const poidsAutres = Object.entries(poids).filter(([cult]) => cult !== culteAccueil).reduce((acc, [, w]) => acc + w, 0);
        poids[culteAccueil] = (poids[culteAccueil] ?? 0) + (nationalisme + convBatiment) * poidsAutres;
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
    `M\xE9tiers attribu\xE9s \u2014 ${fmt(recap.metiersAttribues)}`
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
  const vivantsParVille = /* @__PURE__ */ new Map();
  for (const c of vivants) {
    const l = vivantsParVille.get(c.ville);
    if (l) l.push(c);
    else vivantsParVille.set(c.ville, [c]);
  }
  for (const c of vivants) {
    if (!c.statut) c.statut = "Sain";
    c.age += 2;
    c.fecondite = computeFecondite(state, p, c);
    if (c.age >= C.p.adultAge && !c.metier) assignAdultMetier(state, p, c, recap, vivantsParVille);
    maladieStep(state, p, c, rng, recap);
  }
  conceptionEtNaissances(state, p, rng, recap);
  applyCultureInfluence(state, p, rng, recap);
  updateCityCultures(state, p);
  for (const v of p.villes) attribuerDomicilesVille(state, p, v, C);
  const evenementsRang = evaluerFamilles(state, p, C);
  for (const ev of evenementsRang) {
    state.log.push({ turn: state.turn + 1, type: "Syst\xE8me", joueur: p.n, texte: ev.texte });
  }
  writeRecap(state, p, recap);
}

// src/engine/migrationBonheur.ts
function probaDepartBonheur(bonheur, C) {
  return Math.max(0, C.p.migrationBonheurMax * (100 - bonheur) / 100);
}
function multDepartRegime(p, C) {
  return regimeDef(p.regime, C.config)?.departHabitantsMult ?? 1;
}
function poidsDestination(c, ville, bonheur, C, memeJoueur = false, bonusAdditifs = 0) {
  const attrait = 1 + bonheur / 100;
  const joueur = memeJoueur ? C.p.migrationBonheurMemeJoueur : 0;
  const culture = (ville.culture ?? "") === c.culture ? C.p.migrationBonheurCulture : 0;
  return attrait * (1 + joueur + culture + bonusAdditifs);
}
function facteurEmploi(sansMetier, emploisLibres, C) {
  return sansMetier && emploisLibres ? C.p.migrationBonheurEmploi : 0;
}
function facteurLogement(sansDomicile, logementsLibres, C) {
  return sansDomicile && logementsLibres ? C.p.migrationBonheurLogement : 0;
}
function migrationBonheur(state, rng) {
  const C = cfgOf(state.config);
  const fiches = state.players.flatMap(
    (p) => p.villes.map((v) => {
      const vivants = (state.population[p.n] ?? []).filter(
        (c) => c.statut !== "D\xE9c\xE9d\xE9" && c.ville === v.nom
      );
      const enPoste = vivants.filter((c) => c.metier && c.age >= C.p.adultAge).length;
      return {
        joueur: p,
        ville: v,
        bonheur: bonheurVilleComplete(state, p, v, C),
        emploisLibres: emploisOffertsVille(state, p, v, C) > enPoste,
        logementsLibres: logementsVille(v, C, state) > vivants.length
      };
    })
  );
  if (fiches.length < 2) return;
  const deplaces = /* @__PURE__ */ new Set();
  for (const p of state.players) {
    const parVille = /* @__PURE__ */ new Map();
    const parVilleTous = /* @__PURE__ */ new Map();
    for (const c of state.population[p.n] ?? []) {
      if (c.statut === "D\xE9c\xE9d\xE9") continue;
      const lt = parVilleTous.get(c.ville);
      if (lt) lt.push(c);
      else parVilleTous.set(c.ville, [c]);
      if (neDemenageJamais(c, C) || c.armee) continue;
      const l = parVille.get(c.ville);
      if (l) l.push(c);
      else parVille.set(c.ville, [c]);
    }
    for (const v of p.villes) {
      const habitants = parVille.get(v.nom);
      if (!habitants || habitants.length === 0) continue;
      const src = fiches.find((f) => f.joueur.n === p.n && f.ville.nom === v.nom);
      if (!src) continue;
      const candidats = fiches.filter((f) => f !== src);
      for (const c of [...habitants]) {
        if (deplaces.has(c.id)) continue;
        let conj;
        if (c.mariageId) {
          conj = (parVilleTous.get(v.nom) ?? []).find((x) => x.id === c.mariageId);
          if (conj && (neDemenageJamais(conj, C) || conj.armee)) continue;
        }
        const idsFoyer = /* @__PURE__ */ new Set([c.id, ...conj ? [conj.id] : []]);
        const enfantsFoyer = (parVilleTous.get(v.nom) ?? []).filter((e) => !e.mariageId && !deplaces.has(e.id) && !neDemenageJamais(e, C) && !e.armee && (idsFoyer.has(e.mereId ?? "") || idsFoyer.has(e.pereId ?? "")));
        if (!rng.chance(probaDepartBonheur(src.bonheur, C) * multDepartRegime(p, C))) continue;
        const dest = rng.pickWeighted(candidats, (f) => poidsDestination(
          c,
          f.ville,
          f.bonheur,
          C,
          f.joueur.n === p.n,
          facteurEmploi(!c.metier, f.emploisLibres, C) + facteurLogement(!c.domicile, f.logementsLibres, C)
        ));
        const foyer = [c, ...conj ? [conj] : [], ...enfantsFoyer];
        for (const m of foyer) {
          if (dest.joueur.n !== p.n) {
            const src2 = state.population[p.n] ?? [];
            const i = src2.indexOf(m);
            if (i >= 0) src2.splice(i, 1);
            const dst = state.population[dest.joueur.n] ?? (state.population[dest.joueur.n] = []);
            dst.push(m);
          }
          const avant = m.ville;
          m.ville = dest.ville.nom;
          perteDemenagement(m, C);
          deplaces.add(m.id);
          const chez = dest.joueur.n === p.n ? "" : ` chez ${dest.joueur.nom}`;
          const verbe = m === c ? "quitte" : `suit ${fullName(c)} \u2014 quitte`;
          state.log.push({
            turn: state.turn + 1,
            type: "Syst\xE8me",
            joueur: p.n,
            texte: `${fullName(m)} ${verbe} ${avant} pour ${dest.ville.nom}${chez} (bonheur ${src.bonheur}/100 \u2014 cherche meilleure vie).`
          });
        }
        const orParMig = regimeDef(dest.joueur.regime, C.config)?.orParMigrant ?? 0;
        if (orParMig > 0) {
          for (const m of foyer) {
            const rs = dest.joueur.resources["Or"];
            if (rs) rs.stock += orParMig;
            state.log.push({
              turn: state.turn + 1,
              type: "Syst\xE8me",
              joueur: dest.joueur.n,
              texte: `\u{1F30D} Terre d'accueil \u2014 ${dest.joueur.nom} re\xE7oit ${orParMig} Or (1 migrant(s) arriv\xE9(s) : ${fullName(m)}).`
            });
          }
        }
      }
    }
  }
  for (const p of state.players) updateCityCultures(state, p);
}

// src/engine/armees.ts
function puissanceArmeeMetier(nomMetier, C, repli) {
  return metierDef(nomMetier, C.config)?.puissanceArmee ?? repli;
}
function agesRecrutementSoldat(C) {
  const def = metierDef(C.p.metierSoldat, C.config);
  return { min: def?.ageMin ?? C.p.soldatAgeMin, max: def?.ageMax ?? C.p.soldatAgeMax };
}
function recruitForArmies(state, p, rng) {
  const C = cfgOf(state.config);
  const pop = state.population[p.n] ?? [];
  const recap = p.recap ?? emptyRecap();
  for (const armee of p.armees) {
    armee.soldats = armee.soldats.filter((id) => {
      const s = pop.find((x) => x.id === id);
      return s && s.statut !== "D\xE9c\xE9d\xE9";
    });
    const cmd = armee.commandant ? pop.find((x) => x.id === armee.commandant) : void 0;
    const puissanceSoldat = puissanceArmeeMetier(C.p.metierSoldat, C, C.p.puissanceSoldat);
    const puissanceCommandant = puissanceArmeeMetier(C.p.metierCommandant, C, C.p.puissanceGeneral);
    const ages = agesRecrutementSoldat(C);
    let puissance = armee.puissance;
    if (cmd && cmd.statut !== "D\xE9c\xE9d\xE9") {
    } else if (armee.commandant) {
      armee.commandant = null;
      puissance = Math.max(0, puissance - puissanceCommandant);
      recap.commandantTombe = armee.nom;
      state.log.push({
        turn: state.turn + 1,
        type: "Arm\xE9e",
        joueur: p.n,
        texte: `${p.nom} : le commandant de l'arm\xE9e \xAB ${armee.nom} \xBB est tomb\xE9 \u2014 \xE0 remplacer !`
      });
    }
    while (puissance + puissanceSoldat <= armee.puissanceCible) {
      const candidats = pop.filter(
        (c) => c.statut !== "D\xE9c\xE9d\xE9" && c.age >= ages.min && c.age <= ages.max && !c.armee && (!c.metier || c.metier === C.p.metierChasseur)
      );
      if (candidats.length === 0) break;
      const s = rng.pick(candidats);
      s.metier = C.p.metierSoldat;
      s.armee = armee.nom;
      armee.soldats.push(s.id);
      puissance += puissanceSoldat;
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

// src/engine/tour.ts
function runTurn(state) {
  const C = cfgOf(state.config);
  const rng = makeRng(state.rngState);
  const turnBefore = state.turn;
  const newSaison = saisonForTurn(turnBefore + 1, C);
  if (newSaison !== state.saison) state.saison = newSaison;
  designerGouverneurs(state, C);
  reaffecterMetiers(state, C);
  const gainsParJoueur = {};
  for (const p of state.players) {
    gainsParJoueur[p.n] = calculerGainsPopulation(state, p);
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
    amenagementsParJoueur[p.n] = appliquerEffetsAmenagements(p, C.config);
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
  const loisCulturesParJoueur = {};
  for (const p of state.players) {
    loisCulturesParJoueur[p.n] = appliquerEffetsRegimesCultures(state, p, C);
    resynchroniserTourisme(state, p, "fin de tour");
  }
  for (const p of state.players) {
    resynchroniserTourisme(state, p, "fin de tour");
  }
  const citesLibresParJoueur = appliquerTaxesCitesLibres(state, C);
  const proximiteParJoueur = appliquerBonusProximite(state, C);
  nettoyerRoutesCommerce(state);
  const commerceParJoueur = appliquerEffetsCommerce(state, C);
  for (const p of state.players) {
    resynchroniserTourisme(state, p, "fin de tour");
  }
  const pelerinageDimes = preleverPelerinage(state, C);
  const pelerinageParJoueur = {};
  for (const dime of pelerinageDimes) {
    for (const v of dime.versements) {
      const solde = pelerinageParJoueur[v.payeur.n] ?? (pelerinageParJoueur[v.payeur.n] = {});
      for (const [res, montant] of Object.entries(v.montants)) {
        solde[res] = (solde[res] ?? 0) - montant;
      }
      const soldePontife = pelerinageParJoueur[dime.pontife.n] ?? (pelerinageParJoueur[dime.pontife.n] = {});
      for (const [res, montant] of Object.entries(v.montants)) {
        soldePontife[res] = (soldePontife[res] ?? 0) + montant;
      }
    }
  }
  for (const p of state.players) {
    populationTurn(state, p, rng);
  }
  migrationBonheur(state, rng);
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
      loisCultures: loisCulturesParJoueur[p.n] ?? {},
      citesLibres: citesLibresParJoueur[p.n] ?? {},
      commerce: commerceParJoueur[p.n] ?? {},
      proximite: proximiteParJoueur[p.n] ?? {},
      population,
      vassalite,
      // (Pèlerinage, arbitrage 2026-11-01 — étape 3quindecies :
      //  solde net de la dîme du pontife, négatif = payée, positif
      //  = reçue. Le pontife payeur porte les DEUX dans son solde.)
      pelerinage: pelerinageParJoueur[p.n] ?? {}
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

// src/engine/fusion.ts
function sectionValide(sec) {
  if (!sec || typeof sec !== "object") return false;
  if (typeof sec.tour !== "number" || !Number.isFinite(sec.tour)) return false;
  if (sec.player !== void 0 && (typeof sec.player !== "object" || sec.player === null)) return false;
  if (sec.population !== void 0 && !Array.isArray(sec.population)) return false;
  if (sec.routes !== void 0 && !Array.isArray(sec.routes)) return false;
  if (sec.citesLibres !== void 0 && !Array.isArray(sec.citesLibres)) return false;
  if (sec.log !== void 0 && !Array.isArray(sec.log)) return false;
  return true;
}
function fusionnerSections(ref2, sections) {
  const popClone = structuredClone(ref2.population);
  const draft = {
    ...structuredClone({ ...ref2, population: {}, config: void 0 }),
    population: popClone,
    config: ref2.config
  };
  const newLogs = [];
  const conflits = [];
  const refCiteParNom = new Map((ref2.citesLibres ?? []).map((c) => [c.nom, JSON.stringify(c)]));
  const citeFusionnes = new Map((draft.citesLibres ?? []).map((c) => [c.nom, c]));
  const citeModifieePar = /* @__PURE__ */ new Map();
  const routesFusionnees = [...draft.routesCommerce ?? []];
  const numerosJoueurs = Object.keys(sections).map(Number).filter((n) => Number.isInteger(n) && n >= 0).sort((a, b) => a - b);
  for (const n of numerosJoueurs) {
    const nStr = String(n);
    if (!Number.isInteger(n) || n < 0) continue;
    const sec = sections[nStr];
    if (!sec) continue;
    if (!sectionValide(sec)) {
      newLogs.push({
        turn: ref2.turn + 1,
        type: "Syst\xE8me",
        joueur: n,
        texte: `\u26A0 Section invalide ignor\xE9e (donn\xE9es malform\xE9es re\xE7ues) \u2014 les actions de J${n} ne comptent pas pour ce tour.`
      });
      continue;
    }
    const pj = draft.players.find((q) => q.n === n);
    if (!pj) {
      newLogs.push({
        turn: ref2.turn + 1,
        type: "Syst\xE8me",
        joueur: n,
        texte: `\u26A0\uFE0F Joueur ${n} inexistant dans la partie \u2014 section ignor\xE9e, ses modifications ne comptent pas pour ce tour.`
      });
      continue;
    }
    if (sec.player) Object.assign(pj, sec.player);
    if (sec.population) draft.population[n] = sec.population;
    if (Array.isArray(sec.routes)) {
      for (let i = routesFusionnees.length - 1; i >= 0; i--) {
        if (routesFusionnees[i]?.joueur === n) routesFusionnees.splice(i, 1);
      }
      for (const r of sec.routes) routesFusionnees.push(r);
    }
    if (Array.isArray(sec.citesLibres)) {
      for (const c of sec.citesLibres ?? []) {
        const refJson = refCiteParNom.get(c.nom);
        if (refJson === void 0) {
          if (!citeFusionnes.has(c.nom)) citeFusionnes.set(c.nom, c);
        } else if (JSON.stringify(c) !== refJson) {
          citeModifieePar.set(c.nom, [...citeModifieePar.get(c.nom) ?? [], n]);
          citeFusionnes.set(c.nom, c);
        }
      }
    }
    if (Array.isArray(sec.log)) newLogs.push(...sec.log);
  }
  const tourFusion = draft.turn;
  for (const [nom, auteurs] of citeModifieePar) {
    if (auteurs.length > 1) {
      for (const n of [...auteurs].sort((a, b) => a - b)) {
        const sec = sections[String(n)];
        if (!sec || !sectionValide(sec)) continue;
        const cand = (sec.citesLibres ?? []).find((c) => c.nom === nom);
        if (cand) {
          citeFusionnes.set(nom, cand);
          break;
        }
      }
      conflits.push({
        turn: tourFusion,
        type: "Conflit",
        joueur: null,
        texte: `\u26A0\uFE0F Cit\xE9 libre \xAB ${nom} \xBB modifi\xE9e par ${auteurs.length} joueurs ce tour (${auteurs.join(", ")}) \u2014 version du joueur ${Math.min(...auteurs)} retenue.`
      });
    }
  }
  const vus = /* @__PURE__ */ new Set();
  draft.routesCommerce = routesFusionnees.filter((r) => {
    if (vus.has(r.id)) return false;
    vus.add(r.id);
    return true;
  });
  draft.citesLibres = [...citeFusionnes.values()];
  const logFusionne = [...draft.log, ...conflits, ...newLogs];
  draft.log = logFusionne.slice(-Math.max(50, draft.log.length));
  return draft;
}
function rejouerEvenementsPartages(draft, evenements) {
  for (const ev of evenements) {
    if (ev.type === "transfert_ville") {
      rejouerTransfertVille(draft, ev.payload);
    } else if (ev.type === "forcer_absents") {
      const message = typeof ev.payload.message === "string" ? ev.payload.message : "\u23ED Tour forc\xE9.";
      draft.log.push({
        turn: draft.turn,
        type: "Conflit",
        joueur: ev.joueur,
        texte: message
      });
    }
  }
}
function appliquerConfigMondiale(draft, cfg) {
  if (cfg) draft.config = cfg;
}
function etatReseau(state) {
  const reseau = { ...state };
  delete reseau.config;
  return reseau;
}

// src/engine/migrations.ts
var SCHEMA_VERSION_ETAT = 4;
var MIGRATIONS = [
  {
    v: 1,
    quoi: "normalisation de base (history/log/villes compl\xE9t\xE9s \u2014 garde-fou anciennes sauvegardes)",
    // Historiquement appelé « normaliserEtat » à chaque chargement.
    //  Devenu migration v1 : les états neufs créés par createGame
    //  sont déjà complets ; les états anciens passent ici UNE FOIS.
    appliquer: normaliserEtat
  },
  {
    v: 2,
    quoi: "portefeuilles renomm\xE9s (classeur \u2192 offices de cour)",
    // Retrait ministères (retour Thibaut 2026-10-23) : la fonction
    //  migrerNomsMinisteres est partie avec engine/ministeres.ts —
    //  migration devenue un no-op, NUMÉRO CONSERVÉ (les sauvegardes
    //  tamponnent leur v ; ne jamais renuméroter).
    appliquer: () => {
    }
  },
  {
    v: 3,
    quoi: "rework habitants : titre \u2192 metier, retrait ageMax, ajout domicile",
    // Rework habitants (2026-10-20) : le champ `titre` devient `metier`
    //  (null = Sans-emploi, rôle neutre) ; `ageMax` disparaît (la
    //  maladie Gompertz est la seule cause de mort) ; `domicile`
    //  (null en vague 1) est ajouté par les garde-fous, pas ici.
    appliquer: migrerTitresVersMetiers
  },
  {
    v: 4,
    quoi: "vague 3a : renommages m\xE9tiers Artisan\u2192Commer\xE7ant, Chercheur\u2192Scientifique, Sportif\u2192Garde ; Propagandiste supprim\xE9 (Sans-emploi)",
    // Rework métiers & aménagements (2026-10-21) : la table du
    //  référentiel passe à 24 métiers. Les métiers disparus ou
    //  renommés migrent sur TOUTES les populations (joueurs ET
    //  cités libres). Le Propagandiste (supprimé avec ses charges)
    //  devient Sans-emploi (metier null).
    appliquer: migrerMetiersVague3a
  }
  // ── Futures migrations : v: 5, 6… (une entrée = une évolution) ──
  //  Ex. ajout d'un champ aux personnages, renommage d'une ressource,
  //  restructuration d'un tableau : jamais de renumérotation.
];
function migrerTitresVersMetiers(state) {
  for (const c of toutesLesPopulations(state)) {
    if (c.titre !== void 0 && (c.metier === void 0 || c.metier === null)) {
      c.metier = c.titre;
    }
    delete c.titre;
    delete c.ageMax;
  }
  for (const p of state.players) {
    const recap = p.recap;
    if (recap && recap.titresAttribues !== void 0) {
      const existants = recap.metiersAttribues;
      if (existants == null || Object.keys(existants).length === 0) {
        recap.metiersAttribues = recap.titresAttribues;
      }
      delete recap.titresAttribues;
    }
  }
}
function migrerMetiersVague3a(state) {
  const RENOMS = {
    Artisan: "Commer\xE7ant",
    Chercheur: "Scientifique",
    Sportif: "Garde",
    Propagandiste: null
    // supprimé (charges comprises) → Sans-emploi
  };
  for (const c of toutesLesPopulations(state)) {
    if (c.metier && c.metier in RENOMS) c.metier = RENOMS[c.metier];
  }
}
function migrerEtat(state) {
  const appliquees = [];
  const actuel = state.schema ?? 0;
  for (const m of MIGRATIONS) {
    if (m.v <= actuel) continue;
    m.appliquer(state);
    appliquees.push(`v${m.v} : ${m.quoi}`);
  }
  ;
  state.schema = SCHEMA_VERSION_ETAT;
  return appliquees;
}
export {
  appliquerConfigMondiale,
  etatReseau,
  fusionnerSections,
  migrerEtat,
  normaliserEtat,
  rejouerEvenementsPartages,
  runTurn
};
