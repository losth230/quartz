Option Explicit

'================================================================
'  CHASSE & PÊCHE — SIMULATION DE POPULATION
'  Macro VBA principale : "Personnages"
'================================================================

'================================================================
'  CONSTANTES
'================================================================

' --- Démographie ---
Public Const ADULT_AGE As Long = 16              ' âge à partir duquel un personnage est adulte
Public Const ADULTERY_RATE As Double = 0.03          ' part des naissances de femmes mariées issues d'adultère

' --- Traits génétiques spéciaux ---
Public Const TRAIT_BASTARD As String = "Bâtard"
Public Const TRAIT_INBRED As String = "Consanguin"

' --- Titres avec logique dédiée ---
Public Const TITRE_DIRIGEANT As String = "Dirigeant"
Public Const TITRE_GOUVERNEUR As String = "Gouverneur"
Public Const TITRE_HERITIER As String = "Héritier"
Public Const TITRE_PROFESSEUR As String = "Professeur"
Public Const TITRE_CHASSEUR As String = "Chasseur"

' --- Éducation et écoles ---
Public Const ECOLE_ELEM As String = "Ecole élémentaire"
Public Const ECOLE_INTER As String = "Ecole intermédiaire"
Public Const ECOLE_SUP As String = "Ecole supérieure"
Public Const CHANCE_EDUC_ROTURIER As Double = 0.08
Public Const CHANCE_EDUC_NOBLE As Double = 0.15
Public Const PROFESSEUR_BASE_CHANCE As Double = 0.9
Public Const PROF_BONUS_EDUC As Double = 0.1

'--- Maladies ---
Private Const PROBA_MALADIE As Double = 0.0005
Private Const MOD_MALADIE_AGE As Double = 0.0001
Private Const MOD_MALADIE_ENCEINTE As Double = 0.03
Private Const PROBA_GUERISON As Double = 0.25
Private Const MOD_GUERISON_AGE As Double = 0.003

' --- Bâtiments de santé ---
Public Const BAT_HERBORISTERIE As String = "Herboristerie"
Public Const BAT_CLINIQUE As String = "Clinique"
Public Const BAT_HOPITAL As String = "Hôpital"
Public Const BAT_GUILDE_MEDECINS As String = "Guilde des Médecins"

' Modificateurs : contract = proba de tomber malade, cure = proba de guérir
Private Const HERBO_CONTRACT As Double = -0.01
Private Const HERBO_CURE As Double = 0.05
Private Const CLINIQUE_CONTRACT As Double = -0.02
Private Const CLINIQUE_CURE As Double = 0.05
Private Const HOPITAL_CONTRACT As Double = -0.03
Private Const HOPITAL_CURE As Double = 0.15
Private Const GUILDE_CURE_GLOBAL As Double = 0.1   ' soin ajouté dans TOUTES les villes

' --- Fécondité physiologique ---
Public Const FERT_BASE_RATE As Double = 1.5
Public Const FERT_SINGLE_FACTOR As Double = 0.1
Public Const FERT_TWINS_RATE As Double = 0.05
Public Const FERT_TRIPLETS_RATE As Double = 0.001
Public Const FERT_TRAIT_FACTOR_MIN As Double = 0
Public Const FERT_TRAIT_FACTOR_MAX As Double = 1.6

' --- Feuilles ---
Public Const CITY_HEADER_ROW As Long = 1

'--- Armées ---
Public Const PUISSANCE_GENERAL As Long = 45
Public Const PUISSANCE_SOLDAT As Long = 15
Public Const SOLDAT_AGE_MAX As Long = 30
Public Const TITRE_SOLDAT As String = "Soldat"

' --- Influence culturelle ---
Private Const PROBA_CHANGEMENT_CULTURE As Double = 0.1
Private Const POIDS_VILLE_CULTURE As Double = 5#

Private Const MAX_VILLES As Long = 8
Private Const CULTURE_ROW As Long = 2       ' ligne de la culture de ville (G2, K2…)
Private Const VILLE_NAME_ROW As Long = 1    ' ligne du nom de ville (E1, I1…)
Private Const FIRST_VILLE_NAME_COL As Long = 5   ' E1
' nom en col X, culture en col X+2, blocs espacés de 4

' --- Taxes (par ville) ---
Public Const TAX_NORMALES As String = "Moyenne"   ' niveau de taxes par défaut
Private Const TAXES_ROW As Long = 2                 ' ligne du niveau de taxes (4e case du bloc ville)
Private Const TAXES_COL_OFFSET As Long = 3          ' colonne : nameCol + 3 → H2, L2, P2, T2, X2, AB2, AF2, AJ2
Private Const TAX_OR_FAIBLES As Double = 0.5        ' or gagné si taxes faibles
Private Const TAX_OR_HAUTES As Double = 1.5         ' or gagné si taxes fortes
Private Const TAX_NAISS_FAIBLES As Double = 1.5    ' facteur conception si taxes faibles
Private Const TAX_NAISS_HAUTES As Double = 0.5      ' facteur conception si taxes fortes

' --- Trait bloquant l'éducation ---
Public Const TRAIT_NO_EDUC As String = "Obstiné"

' --- Migration des enfants sans éducation ---
Private Const MIGRATION_PROBA As Double = 0.1       ' chance par tour

' --- Gains de population par ville ---
Private Const GAINS_ROW As Long = 69               ' 1re ligne des gains (Science / Tourisme)
Private Const GAINS_CREDITE_STOCK As Boolean = True ' True : la macro ajoute les gains aux stocks
Private Const CONSO_NOURR_PAR_HAB As Double = 1      ' nourriture consommée par habitant vivant / tour

'================================================================
'  TYPES
'================================================================

' Compteurs et messages générés pendant un tour pour un joueur.
' Sont écrits en J{n}!A3 à la fin du tour.
Public Type TurnStats
    nbMariagesNobles As Long
    mariagesNoblesByPair As Object
    nbNaissances As Long
    nbNaissancesNobles As Long
    naissancesNoblesByDyn As Object
    nbMorts As Long
    nbMortsNobles As Long
    mortsNoblesByDyn As Object
    nbMortsTitres As Long
    mortsTitresByTitre As Object
    nbTitresAttribues As Long
    titreCounts As Object
    crisisMsg As String
    nbConceptions As Long
    nbConceptionsNobles As Long
    conceptionsNoblesByDyn As Object
    nbMortsMaladie As Long
    nbConversions As Long
    conversionsByCulture As Object
End Type

'================================================================
'  POINTS D'ENTRÉE PUBLICS
'================================================================

' Macro principale lancée par le bouton "Tour suivant"
Public Sub Personnages()
    Dim j As Long
    Randomize
    Call IncrementTour
    For j = 1 To 8
        Call PersonnagesPourJoueur(j)
        Call RecruitForArmies(j)
    Next j
    Call SnapshotRessources
    Call GenererGraphiques
End Sub

' Ouvre l'UserForm d'attribution manuelle de titres
Public Sub OuvrirAttributionTitre()
    frmAttribuerTitre.Show
End Sub

'================================================================
'  TRAITEMENT D'UN JOUEUR — ORCHESTRATION
'================================================================
Public Sub PersonnagesPourJoueur(ByVal joueur As Long)

    '----------------------------------------------------------------
    ' Déclarations
    '----------------------------------------------------------------
    Dim stats As TurnStats
    Set stats.titreCounts = CreateObject("Scripting.Dictionary")
    Set stats.naissancesNoblesByDyn = CreateObject("Scripting.Dictionary")
    Set stats.mortsNoblesByDyn = CreateObject("Scripting.Dictionary")
    Set stats.mortsTitresByTitre = CreateObject("Scripting.Dictionary")
    Set stats.mariagesNoblesByPair = CreateObject("Scripting.Dictionary")
    Set stats.conceptionsNoblesByDyn = CreateObject("Scripting.Dictionary")
    Set stats.conversionsByCulture = CreateObject("Scripting.Dictionary")

    Dim wsP As Worksheet, wsJ As Worksheet, wsNames As Worksheet
    Dim wsJson As Worksheet, wsTG As Worksheet
    Dim lo As ListObject, loNames As ListObject
    Dim loOrient As ListObject, loTraits As ListObject, loTraitStats As ListObject
    Dim peuple As String, nomTableNoms As String

    Dim arrOrient As Variant, arrTraits As Variant, arrTraitStats As Variant
    Dim totalOrient As Double, totalTrait As Double

    Dim maleNames As Collection, femaleNames As Collection
    Dim nameRowIndex As Long, randIndex As Long

    ' Indices colonnes — tableau P_j
    Dim colNom As Long, colPrenom As Long, colDyn As Long
    Dim colMere As Long, colPere As Long, colMariage As Long
    Dim colSexe As Long, colAge As Long, colCulture As Long, colFec As Long
    Dim colOrientP As Long
    Dim colTrait1P As Long, colTrait2P As Long, colTrait3P As Long
    Dim colAgeMax As Long
    Dim colTitre As Long, colVille As Long, colEducation As Long

    ' Indices colonnes — autres tables
    Dim colPrenomN As Long, colGenreN As Long
    Dim colOrientName As Long, colOrientWeight As Long
    Dim colTraitName As Long, colTraitWeight As Long
    Dim colTGName As Long, colTGLifeDelta As Long, colTGResRoll As Long
    Dim colTGWeight As Long, colTGDesc As Long, colTGHeritable As Long, colTGMarriageMod As Long

    ' Variables d'itération
    Dim i As Long, n As Long, k As Long
    Dim nbInit As Long, baseLife As Long
    Dim agemax As Long, resMin As Long, dRoll As Long
    Dim currentTrait As String
    Dim sexVal As String, genreVal As String
    Dim w As Variant, r As Double, cum As Double

    ' Variables de mort
    Dim deathDyn As String, deathTitre As String

    ' Variables d'attribution de titre auto
    Dim ageNow As Long, titreNow As String
    Dim isBastardChar As Boolean
    Dim educVal As String, newTitle As String

    ' Variables de naissance
    Dim newRow As ListRow
    Dim ageFemme As Long, motherCity As String
    Dim motherFert As Double, fatherFert As Double
    Dim fert As Double, score As Double
    Dim rawRoll As Long, agePenalty As Long
    Dim nbBabies As Long
    Dim orientFactor As Double, motherOrient As String, fatherOrient As String
    Dim nbProfs As Long
    Dim availableEducations As Collection
    Dim babySex As String, babyFirstName As String, babyOrientation As String
    Dim babyFatherName As String, babyEducation As String
    Dim fatherRow As Long, bioFatherRow As Long, loverRow As Long
    Dim isMarried As Boolean, isBastard As Boolean, isInbred As Boolean
    Dim motherTrait1 As String, motherTrait2 As String, motherTrait3 As String
    Dim fatherTrait1 As String, fatherTrait2 As String, fatherTrait3 As String
    Dim trait1Name As String, trait2Name As String, trait3Name As String
    Dim baseT1 As String, baseT2 As String, baseT3 As String
    Dim dynMother As String, dynFather As String, babyDyn As String
    Dim heredite As String
    
    Dim colStatut As Long, colPereBio As Long, colEnfantBatard As Long, colTGFertAdd As Long
    Dim pConception As Double, currentStatut As String
    Dim storedFatherName As String, storedIsBastard As Boolean
    Dim fatherFullName As String, motherDyn As String

    '----------------------------------------------------------------
    ' Étape 1 — Récupération des feuilles et tableaux
    '----------------------------------------------------------------
    On Error Resume Next
    Set wsP = ThisWorkbook.Worksheets("P" & joueur)
    If wsP Is Nothing Then Exit Sub
    Set lo = wsP.ListObjects("P_" & joueur)
    If lo Is Nothing Then Exit Sub
    On Error GoTo 0

    Set wsNames = ThisWorkbook.Worksheets("BDD_pop")
    Set wsJson = ThisWorkbook.Worksheets("JSON")
    Set loOrient = wsJson.ListObjects("Orientation")
    Set loTraits = wsJson.ListObjects("Traits_Génétique")
    Set wsTG = ThisWorkbook.Worksheets("traits_genetiques")
    Set loTraitStats = wsTG.ListObjects("traits_genetiques")

    On Error Resume Next
    Set wsJ = ThisWorkbook.Worksheets("J" & joueur)
    On Error GoTo 0

    peuple = ""
    If Not wsJ Is Nothing Then peuple = Trim$(CStr(wsJ.Range("A1").Value))
    nomTableNoms = BuildNameTableName(peuple)

    On Error Resume Next
    If nomTableNoms <> "" Then Set loNames = wsNames.ListObjects(nomTableNoms)
    If loNames Is Nothing Then Set loNames = wsNames.ListObjects("noms_Peuples_Libres")
    On Error GoTo 0

    '----------------------------------------------------------------
    ' Étape 2 — Indices de colonnes
    '----------------------------------------------------------------

    ' P_j (obligatoires)
    colNom = lo.ListColumns("Nom").Index
    colPrenom = lo.ListColumns("Prénom").Index
    colDyn = lo.ListColumns("Dynastie").Index
    colMere = lo.ListColumns("Mère").Index
    colPere = lo.ListColumns("Père").Index
    colMariage = lo.ListColumns("Mariage").Index
    colSexe = lo.ListColumns("Sexe").Index
    colAge = lo.ListColumns("Age").Index
    colCulture = lo.ListColumns("Culture").Index
    colFec = lo.ListColumns("Fécondité").Index
    colOrientP = lo.ListColumns("Orientation").Index
    colTrait1P = lo.ListColumns("Trait1").Index
    colTrait2P = lo.ListColumns("Trait2").Index
    colTrait3P = lo.ListColumns("Trait3").Index
    colAgeMax = lo.ListColumns("AgeMax").Index
    colStatut = lo.ListColumns("Statut").Index
    colPereBio = lo.ListColumns("PereBio").Index
    colEnfantBatard = lo.ListColumns("EnfantBatard").Index

    ' P_j (optionnelles)
    On Error Resume Next
    colTitre = lo.ListColumns("Titre").Index
    If colTitre = 0 Then colTitre = lo.ListColumns("Titres").Index
    colVille = lo.ListColumns("Ville").Index
    colEducation = lo.ListColumns("Education").Index
    On Error GoTo 0

    ' Noms
    colPrenomN = loNames.ListColumns("Prénom").Index
    colGenreN = loNames.ListColumns("Genre").Index

    ' Orientation
    On Error Resume Next
    colOrientName = loOrient.ListColumns("Orientation sexuelle").Index
    colOrientWeight = loOrient.ListColumns("Nombre d'occurrences").Index
    On Error GoTo 0
    If colOrientName = 0 Then colOrientName = 1
    If colOrientWeight = 0 Then colOrientWeight = 2

    ' Traits (legacy)
    On Error Resume Next
    colTraitName = loTraits.ListColumns("Trait génétique").Index
    colTraitWeight = loTraits.ListColumns("Nombre d'occurrence").Index
    On Error GoTo 0
    If colTraitName = 0 Then colTraitName = 1
    If colTraitWeight = 0 Then colTraitWeight = 2

    ' traits_genetiques (référentiel)
    colTGName = loTraitStats.ListColumns("name").Index
    colTGLifeDelta = loTraitStats.ListColumns("life_delta").Index
    colTGResRoll = loTraitStats.ListColumns("resurrection_min_roll").Index
    colTGFertAdd = loTraitStats.ListColumns("fert_add").Index

    On Error Resume Next
    colTGWeight = loTraitStats.ListColumns("weight").Index
    If colTGWeight = 0 Then colTGWeight = loTraitStats.ListColumns("Nombre d'occurrences").Index
    colTGDesc = loTraitStats.ListColumns("description").Index
    If colTGDesc = 0 Then colTGDesc = loTraitStats.ListColumns("Description").Index
    colTGHeritable = loTraitStats.ListColumns("heritable").Index
    colTGMarriageMod = loTraitStats.ListColumns("marriage_mod").Index
    On Error GoTo 0

    If colTGWeight = 0 Then colTGWeight = 2
    If colTGDesc = 0 Then colTGDesc = 3

    arrTraitStats = loTraitStats.DataBodyRange.Value

    '----------------------------------------------------------------
    ' Étape 3 — Promotions auto (Profs) + mariages
    '----------------------------------------------------------------
    Call MaybeAssignProfesseursInCities(lo, joueur, colVille, colTitre, colAge, colStatut, colEducation, stats)
    Call GestionMariagesDansTableau(lo, colSexe, colAge, colMariage, colNom, colPrenom, colDyn, _
                                    colTrait1P, colTrait2P, colTrait3P, colStatut, colTitre, colCulture, _
                                    arrTraitStats, colTGName, colTGMarriageMod, stats)

    '----------------------------------------------------------------
    ' Étape 4 — Listes de prénoms M/F
    '----------------------------------------------------------------
    Set maleNames = New Collection
    Set femaleNames = New Collection
    For i = 1 To loNames.DataBodyRange.Rows.count
        genreVal = LCase$(CStr(loNames.DataBodyRange.Cells(i, colGenreN).Value))
        If Left$(genreVal, 1) = "m" Then
            maleNames.Add i
        ElseIf Left$(genreVal, 1) = "f" Then
            femaleNames.Add i
        End If
    Next i

    '----------------------------------------------------------------
    ' Étape 5 — Distributions pondérées (orientation, traits)
    '----------------------------------------------------------------
    arrOrient = loOrient.DataBodyRange.Value
    totalOrient = 0
    For i = 1 To UBound(arrOrient, 1)
        w = arrOrient(i, colOrientWeight)
        If IsNumeric(w) And w > 0 Then totalOrient = totalOrient + w
    Next i

    arrTraits = loTraits.DataBodyRange.Value
    totalTrait = 0
    For i = 1 To UBound(arrTraits, 1)
        w = arrTraits(i, colTraitWeight)
        If IsNumeric(w) And w > 0 Then totalTrait = totalTrait + w
    Next i

    '----------------------------------------------------------------
    ' Étape 6 — Boucle principale : vieillissement, mort, naissances
    '----------------------------------------------------------------
    nbInit = 0
    If Not lo.DataBodyRange Is Nothing Then nbInit = lo.DataBodyRange.Rows.count
    baseLife = 40

    For i = 1 To nbInit

        ' Initialisation Vivant si vide
        If Trim$(CStr(lo.DataBodyRange.Cells(i, colStatut).Value)) = "" Then
            lo.DataBodyRange.Cells(i, colStatut).Value = "Sain"
        End If

        ' Saut si déjà mort
        If Not IsAlive(lo.DataBodyRange.Cells(i, colStatut).Value) Then GoTo NextPerson

        ' Calcul AgeMax si absent
        currentTrait = CStr(lo.DataBodyRange.Cells(i, colTrait1P).Value)
        If Not IsNumeric(lo.DataBodyRange.Cells(i, colAgeMax).Value) _
           Or lo.DataBodyRange.Cells(i, colAgeMax).Value <= 0 Then
            ' --- MODIFIÉ : AgeMax tient compte des 3 traits (±6 ans en slot 2/3 inclus) ---
            agemax = ComputeAgeMaxEx(baseLife, _
                        CStr(lo.DataBodyRange.Cells(i, colTrait1P).Value), _
                        CStr(lo.DataBodyRange.Cells(i, colTrait2P).Value), _
                        CStr(lo.DataBodyRange.Cells(i, colTrait3P).Value), _
                        arrTraitStats, colTGName, colTGLifeDelta)
            lo.DataBodyRange.Cells(i, colAgeMax).Value = agemax
        Else
            agemax = lo.DataBodyRange.Cells(i, colAgeMax).Value
        End If

        ' Vieillissement (+2 ans)
        If IsNumeric(lo.DataBodyRange.Cells(i, colAge).Value) Then
            lo.DataBodyRange.Cells(i, colAge).Value = lo.DataBodyRange.Cells(i, colAge).Value + 2
        Else
            lo.DataBodyRange.Cells(i, colAge).Value = 2
        End If
        
        ' --- Éducation des mineurs (tentative chaque tour) ---
        If colEducation > 0 Then
            ageNow = 0
            If IsNumeric(lo.DataBodyRange.Cells(i, colAge).Value) Then ageNow = CLng(lo.DataBodyRange.Cells(i, colAge).Value)
            If ageNow < ADULT_AGE Then
                If Trim$(CStr(lo.DataBodyRange.Cells(i, colEducation).Value)) = "" Then
                    educVal = TryEducateMinor(lo, i, joueur, colVille, colTitre, colEducation, colDyn, colStatut)
                    If educVal <> "" Then
                        lo.DataBodyRange.Cells(i, colEducation).Value = educVal
                    Else
                        ' --- NOUVEAU : pas d'école ici, l'enfant peut déménager
                        Call MaybeMigrateUneducatedChild(lo, i, joueur, colVille, colTitre, colAge, colEducation, colStatut)
                    End If
                End If
            End If
        End If
        
        ' MAJ Fécondité (visible côté joueur)
        If colFec > 0 Then
            lo.DataBodyRange.Cells(i, colFec).Value = _
                Round(ComputeIndividualFertility(lo, i, colSexe, colAge, colCulture, _
                                                 colTrait1P, colTrait2P, colTrait3P, _
                                                 arrTraitStats, colTGName, colTGFertAdd), 2)
        End If
        
        ' --- Test de mort par vieillesse ---
        If lo.DataBodyRange.Cells(i, colAge).Value >= agemax Then

            ' Possible résurrection
            resMin = GetResurrectionRoll(currentTrait, arrTraitStats, colTGName, colTGResRoll)
            If resMin > 0 Then
                dRoll = Int(6 * Rnd) + 1
                If dRoll >= resMin Then
                    lo.DataBodyRange.Cells(i, colAgeMax).Value = lo.DataBodyRange.Cells(i, colAge).Value + _
                                                                 (Int(6 * Rnd) + 1) + (Int(6 * Rnd) + 1)
                    GoTo NextPerson
                End If
            End If

            ' Stats du décès
            deathDyn = Trim$(CStr(lo.DataBodyRange.Cells(i, colDyn).Value))
            deathTitre = ""
            If colTitre > 0 Then deathTitre = Trim$(CStr(lo.DataBodyRange.Cells(i, colTitre).Value))

            stats.nbMorts = stats.nbMorts + 1
            If IsNobleDyn(deathDyn) Then
                stats.nbMortsNobles = stats.nbMortsNobles + 1
                Call IncDictKey(stats.mortsNoblesByDyn, deathDyn)
            End If
            If deathTitre <> "" Then
                stats.nbMortsTitres = stats.nbMortsTitres + 1
                Call IncDictKey(stats.mortsTitresByTitre, deathTitre)
            End If

            ' Marquer comme mort + désengager le mariage
            lo.DataBodyRange.Cells(i, colStatut).Value = "Décédé"
            Call ClearSpouseMarriage(lo, i, colMariage, colNom, colPrenom)

            ' Succession si Dirigeant
            If colTitre > 0 Then
                If StrComp(deathTitre, TITRE_DIRIGEANT, vbTextCompare) = 0 Then
                    Call HandleDirigeantSuccession(lo, colTitre, colDyn, colAge, colStatut, colSexe, colCulture, stats)
                End If
            End If

            GoTo NextPerson
        End If

        ' --- Attribution automatique de titre aux adultes ---
        If colTitre > 0 Then
            ageNow = 0
            If IsNumeric(lo.DataBodyRange.Cells(i, colAge).Value) Then
                ageNow = CLng(lo.DataBodyRange.Cells(i, colAge).Value)
            End If

            If ageNow >= ADULT_AGE Then
                titreNow = Trim$(CStr(lo.DataBodyRange.Cells(i, colTitre).Value))
                isBastardChar = CharacterHasTrait(lo, i, colTrait1P, colTrait2P, colTrait3P, TRAIT_BASTARD)

                If isBastardChar Then
                    If titreNow = "" Then
                        ' Bâtard sans titre => Chasseur (compté)
                        lo.DataBodyRange.Cells(i, colTitre).Value = TITRE_CHASSEUR
                        Call AddTitleStat(stats, TITRE_CHASSEUR)
                    ElseIf StrComp(titreNow, TITRE_CHASSEUR, vbTextCompare) <> 0 _
                       And StrComp(titreNow, TITRE_SOLDAT, vbTextCompare) <> 0 Then
                        lo.DataBodyRange.Cells(i, colTitre).Value = TITRE_CHASSEUR
                    End If
                ElseIf titreNow = "" Then
                    ' Adulte non-bâtard sans titre : titre selon éducation
                    educVal = ""
                    If colEducation > 0 Then
                        educVal = Trim$(CStr(lo.DataBodyRange.Cells(i, colEducation).Value))
                    End If
                    newTitle = GetTitleFromEducation(educVal, _
                                  CStr(lo.DataBodyRange.Cells(i, colSexe).Value), _
                                  CStr(lo.DataBodyRange.Cells(i, colCulture).Value))
                    lo.DataBodyRange.Cells(i, colTitre).Value = newTitle
                    Call AddTitleStat(stats, newTitle)
                End If
            End If
        End If
        
        ' --- Maladie / guérison ---
        Dim pMaladie As Double, pGuerison As Double, ageMal As Long
        Dim maladieCity As String, contractMod As Double, cureMod As Double
        
        currentStatut = LCase$(Trim$(CStr(lo.DataBodyRange.Cells(i, colStatut).Value)))
        ageMal = 0
        If IsNumeric(lo.DataBodyRange.Cells(i, colAge).Value) Then ageMal = CLng(lo.DataBodyRange.Cells(i, colAge).Value)
        
        maladieCity = ""
        If colVille > 0 Then maladieCity = Trim$(CStr(lo.DataBodyRange.Cells(i, colVille).Value))
        contractMod = 0: cureMod = 0
        Call GetCityHealthModifiers(joueur, lo, maladieCity, colVille, contractMod, cureMod)
        
        pMaladie = PROBA_MALADIE + ageMal * MOD_MALADIE_AGE + contractMod
        If currentStatut = "enceinte" Then pMaladie = pMaladie + MOD_MALADIE_ENCEINTE
        If pMaladie < 0 Then pMaladie = 0
        
        If currentStatut = "malade" Then
            ' Rechute = décès
            If Rnd < pMaladie Then
                Call MarkCharacterDeath(lo, i, colDyn, colTitre, colStatut, colMariage, _
                                        colNom, colPrenom, colAge, colSexe, colCulture, stats, "maladie")
                GoTo NextPerson
            End If
            ' Tentative de guérison
            pGuerison = PROBA_GUERISON - ageMal * MOD_GUERISON_AGE + cureMod
            If pGuerison < 0 Then pGuerison = 0
            If Rnd < pGuerison Then lo.DataBodyRange.Cells(i, colStatut).Value = "Sain"
        Else
            ' Contraction
            If Rnd < pMaladie Then
                If currentStatut = "enceinte" Then
                    lo.DataBodyRange.Cells(i, colPereBio).Value = ""
                    lo.DataBodyRange.Cells(i, colEnfantBatard).Value = ""
                End If
                lo.DataBodyRange.Cells(i, colStatut).Value = "Malade"
            End If
        End If

        ' --- Grossesse / naissance (femmes adultes) ---
        sexVal = LCase$(CStr(lo.DataBodyRange.Cells(i, colSexe).Value))
        
        If Left$(sexVal, 1) = "f" Then
            ageFemme = 0
            If IsNumeric(lo.DataBodyRange.Cells(i, colAge).Value) Then
                ageFemme = CLng(lo.DataBodyRange.Cells(i, colAge).Value)
            End If
        
            If ageFemme >= ADULT_AGE Then
        
                currentStatut = LCase$(Trim$(CStr(lo.DataBodyRange.Cells(i, colStatut).Value)))
        
                '----- CAS 1 : enceinte ? naissance -----
                If currentStatut = "enceinte" Then
        
                    storedFatherName = Trim$(CStr(lo.DataBodyRange.Cells(i, colPereBio).Value))
                    storedIsBastard = (LCase$(Trim$(CStr(lo.DataBodyRange.Cells(i, colEnfantBatard).Value))) = "o")
        
                    bioFatherRow = 0
                    If storedFatherName <> "" Then
                        bioFatherRow = FindRowByFullName(lo, storedFatherName, colNom, colPrenom)
                    End If
                    isBastard = storedIsBastard
                    If bioFatherRow = 0 And storedFatherName = "" Then isBastard = True
        
                    isInbred = False
                    If bioFatherRow > 0 And colPere > 0 Then
                        isInbred = IsConsanguineous(lo, i, bioFatherRow, colMere, colPere)
                    End If
        
                    nbBabies = RollNumberOfBabies()
        
                    motherCity = ""
                    If colVille > 0 Then motherCity = Trim$(CStr(lo.DataBodyRange.Cells(i, colVille).Value))
                    nbProfs = CountProfesseursInCity(lo, motherCity, colVille, colTitre, colStatut)
                    Set availableEducations = GetEducationsAvailableInCity( _
                            lo, motherCity, colVille, colTitre, colEducation, colStatut)
        
                    For n = 1 To nbBabies
                        Set newRow = lo.ListRows.Add
        
                        If Rnd < 0.51 Then babySex = "M" Else babySex = "F"
        
                        babyFirstName = ""
                        If Left$(LCase$(babySex), 1) = "m" Then
                            If maleNames.count > 0 Then
                                randIndex = Int(maleNames.count * Rnd) + 1
                                nameRowIndex = maleNames(randIndex)
                                babyFirstName = loNames.DataBodyRange.Cells(nameRowIndex, colPrenomN).Value
                            End If
                        Else
                            If femaleNames.count > 0 Then
                                randIndex = Int(femaleNames.count * Rnd) + 1
                                nameRowIndex = femaleNames(randIndex)
                                babyFirstName = loNames.DataBodyRange.Cells(nameRowIndex, colPrenomN).Value
                            End If
                        End If
        
                        babyOrientation = ""
                        If totalOrient > 0 Then
                            r = Rnd * totalOrient
                            cum = 0
                            For k = 1 To UBound(arrOrient, 1)
                                w = arrOrient(k, colOrientWeight)
                                If IsNumeric(w) And w > 0 Then
                                    cum = cum + w
                                    If r <= cum Then
                                        babyOrientation = arrOrient(k, colOrientName)
                                        Exit For
                                    End If
                                End If
                            Next k
                        End If
        
                        trait1Name = "": trait2Name = "": trait3Name = ""
                        motherTrait1 = lo.DataBodyRange.Cells(i, colTrait1P).Value
                        motherTrait2 = lo.DataBodyRange.Cells(i, colTrait2P).Value
                        motherTrait3 = lo.DataBodyRange.Cells(i, colTrait3P).Value
                        AddInheritedTraitToChild trait1Name, trait2Name, trait3Name, motherTrait1, arrTraitStats, colTGName, colTGHeritable
                        AddInheritedTraitToChild trait1Name, trait2Name, trait3Name, motherTrait2, arrTraitStats, colTGName, colTGHeritable
                        AddInheritedTraitToChild trait1Name, trait2Name, trait3Name, motherTrait3, arrTraitStats, colTGName, colTGHeritable
        
                        If bioFatherRow > 0 Then
                            fatherTrait1 = lo.DataBodyRange.Cells(bioFatherRow, colTrait1P).Value
                            fatherTrait2 = lo.DataBodyRange.Cells(bioFatherRow, colTrait2P).Value
                            fatherTrait3 = lo.DataBodyRange.Cells(bioFatherRow, colTrait3P).Value
                            AddInheritedTraitToChild trait1Name, trait2Name, trait3Name, fatherTrait1, arrTraitStats, colTGName, colTGHeritable
                            AddInheritedTraitToChild trait1Name, trait2Name, trait3Name, fatherTrait2, arrTraitStats, colTGName, colTGHeritable
                            AddInheritedTraitToChild trait1Name, trait2Name, trait3Name, fatherTrait3, arrTraitStats, colTGName, colTGHeritable
                        End If
        
                        baseT1 = GetBaseTraitName(trait1Name)
                        If baseT1 = "" Then
                            If Rnd < 0.3 Then trait1Name = PickRandomTraitName(arrTraitStats, colTGName, colTGWeight)
                        End If
                        baseT1 = GetBaseTraitName(trait1Name)
                        baseT2 = GetBaseTraitName(trait2Name)
                        If baseT1 <> "" And baseT2 = "" Then
                            If Rnd < 0.3 Then trait2Name = PickRandomTraitName(arrTraitStats, colTGName, colTGWeight, baseT1)
                        End If
                        baseT2 = GetBaseTraitName(trait2Name)
                        baseT3 = GetBaseTraitName(trait3Name)
                        If baseT2 <> "" And baseT3 = "" Then
                            If Rnd < 0.3 Then trait3Name = PickRandomTraitName(arrTraitStats, colTGName, colTGWeight, _
                                                                                GetBaseTraitName(trait1Name), baseT2)
                        End If
        
                        If isBastard Then EnsureBastardTrait trait1Name, trait2Name, trait3Name
                        If isInbred Then EnsureTraitPresent trait1Name, trait2Name, trait3Name, TRAIT_INBRED
        
                        dynMother = Trim$(CStr(lo.DataBodyRange.Cells(i, colDyn).Value))
                        dynFather = ""
                        If bioFatherRow > 0 Then dynFather = Trim$(CStr(lo.DataBodyRange.Cells(bioFatherRow, colDyn).Value))
                        heredite = GetCultureHeredite(Trim$(CStr(lo.DataBodyRange.Cells(i, colCulture).Value)))
                        babyDyn = ComputeBabyDynasty(isBastard, dynMother, dynFather, heredite)
        
                        stats.nbNaissances = stats.nbNaissances + 1
                        If IsNobleDyn(babyDyn) Then
                            stats.nbNaissancesNobles = stats.nbNaissancesNobles + 1
                            Call IncDictKey(stats.naissancesNoblesByDyn, babyDyn)
                        End If
        
                        babyFatherName = ""
                        If bioFatherRow > 0 Then
                            babyFatherName = Trim$(CStr(lo.DataBodyRange.Cells(bioFatherRow, colPrenom).Value) & " " & _
                                                    CStr(lo.DataBodyRange.Cells(bioFatherRow, colNom).Value))
                        ElseIf storedFatherName <> "" Then
                            babyFatherName = storedFatherName
                        End If
        
                        With newRow.Range
                            .Cells(1, colNom).Value = lo.DataBodyRange.Cells(i, colNom).Value
                            .Cells(1, colDyn).Value = babyDyn
                            .Cells(1, colCulture).Value = lo.DataBodyRange.Cells(i, colCulture).Value
                            .Cells(1, colMere).Value = lo.DataBodyRange.Cells(i, colPrenom).Value & " " & CStr(lo.DataBodyRange.Cells(i, colNom).Value)
                            .Cells(1, colPere).Value = babyFatherName
                            .Cells(1, colAge).Value = 0
                            .Cells(1, colSexe).Value = babySex
                            .Cells(1, colPrenom).Value = babyFirstName
                            .Cells(1, colOrientP).Value = babyOrientation
                            If colVille > 0 Then .Cells(1, colVille).Value = lo.DataBodyRange.Cells(i, colVille).Value
                            .Cells(1, colMariage).Value = ""
                            If colTitre > 0 Then .Cells(1, colTitre).Value = ""
                            Call SetTraitCell(.Cells(1, colTrait1P), trait1Name, arrTraitStats, colTGName, colTGDesc)
                            Call SetTraitCell(.Cells(1, colTrait2P), trait2Name, arrTraitStats, colTGName, colTGDesc)
                            Call SetTraitCell(.Cells(1, colTrait3P), trait3Name, arrTraitStats, colTGName, colTGDesc)
                            .Cells(1, colStatut).Value = "Sain"
                            .Cells(1, colFec).Value = 0
                            ' --- MODIFIÉ : AgeMax du bébé sur les 3 traits ---
                            .Cells(1, colAgeMax).Value = ComputeAgeMaxEx(baseLife, trait1Name, trait2Name, trait3Name, _
                                                                        arrTraitStats, colTGName, colTGLifeDelta)
                            .Cells(1, colStatut).Value = "Sain"
                        End With
                    Next n
        
                    ' Reset post-partum
                    lo.DataBodyRange.Cells(i, colStatut).Value = "Sain"
                    lo.DataBodyRange.Cells(i, colPereBio).Value = ""
                    lo.DataBodyRange.Cells(i, colEnfantBatard).Value = ""
        
                '----- CAS 2 : saine ? tentative de conception -----
                ElseIf currentStatut <> "malade" Then
        
                    fatherRow = GetHusbandRowIndex(lo, i, colMariage, colSexe, colNom, colPrenom, colStatut)
                    isMarried = (fatherRow > 0)
        
                    pConception = ComputeConceptionProb(lo, i, fatherRow, _
                                                        colAge, colCulture, colOrientP, _
                                                        colTrait1P, colTrait2P, colTrait3P, _
                                                        arrTraitStats, colTGName, colTGFertAdd)
        
                    ' --- NOUVEAU : effet des taxes de la ville sur les naissances ---
                    If colVille > 0 Then
                        motherCity = Trim$(CStr(lo.DataBodyRange.Cells(i, colVille).Value))
                        pConception = pConception * GetCityBirthTaxFactor(joueur, motherCity)
                    End If
        
                    If Rnd < pConception Then
                        isBastard = False
                        bioFatherRow = 0
                        If isMarried Then
                            bioFatherRow = fatherRow
                            If Rnd < ADULTERY_RATE Then
                                loverRow = PickRandomMaleLover(lo, i, colSexe, colAge, colStatut, fatherRow)
                                If loverRow > 0 Then
                                    bioFatherRow = loverRow
                                    isBastard = True
                                End If
                            End If
                        Else
                            isBastard = True
                            bioFatherRow = PickRandomMaleLover(lo, i, colSexe, colAge, colStatut, 0)
                        End If
        
                        If bioFatherRow > 0 Then
                            fatherFullName = Trim$(CStr(lo.DataBodyRange.Cells(bioFatherRow, colPrenom).Value) & " " & _
                                                    CStr(lo.DataBodyRange.Cells(bioFatherRow, colNom).Value))
                            lo.DataBodyRange.Cells(i, colStatut).Value = "Enceinte"
                            lo.DataBodyRange.Cells(i, colPereBio).Value = fatherFullName
                            lo.DataBodyRange.Cells(i, colEnfantBatard).Value = IIf(isBastard, "O", "N")
        
                            stats.nbConceptions = stats.nbConceptions + 1
                            motherDyn = Trim$(CStr(lo.DataBodyRange.Cells(i, colDyn).Value))
                            If IsNobleDyn(motherDyn) Then
                                stats.nbConceptionsNobles = stats.nbConceptionsNobles + 1
                                Call IncDictKey(stats.conceptionsNoblesByDyn, motherDyn)
                            End If
                        End If
                    End If
                End If
            End If
        End If
        
    
NextPerson:
    Next i
    
    '----------------------------------------------------------------
    ' Étape 7 — Récap en J{n}!A3
    '----------------------------------------------------------------
    Call ApplyCultureInfluence(joueur, lo, colVille, colCulture, colStatut, colTitre, stats)
    Call WriteRecapA3(joueur, stats)

End Sub

'================================================================
'  MARIAGES
'================================================================

Public Sub GestionMariagesDansTableau( _
        lo As ListObject, _
        ByVal colSexe As Long, ByVal colAge As Long, ByVal colMariage As Long, _
        ByVal colNom As Long, ByVal colPrenom As Long, ByVal colDyn As Long, _
        ByVal colTrait1 As Long, ByVal colTrait2 As Long, ByVal colTrait3 As Long, _
        ByVal colStatut As Long, ByVal colTitre As Long, ByVal colCulture As Long, _
        traitStats As Variant, _
        ByVal colTGName As Long, ByVal colTGMarriageMod As Long, _
        ByRef stats As TurnStats)

    Dim i As Long, nbRows As Long
    Dim femaleList As Collection, maleList As Collection
    Dim ageVal As Variant, sexVal As String
    Dim fIdx As Long, fRow As Long, mIdx As Long, mRow As Long
    Dim p As Double
    Dim fFullName As String, mFullName As String
    Dim dynF As String, dynM As String

    If lo Is Nothing Then Exit Sub
    If lo.DataBodyRange Is Nothing Then Exit Sub

    nbRows = lo.DataBodyRange.Rows.count
    If nbRows = 0 Then Exit Sub

    Set femaleList = New Collection
    Set maleList = New Collection

    ' Candidats : adultes vivants célibataires
    For i = 1 To nbRows
        If IsAlive(lo.DataBodyRange.Cells(i, colStatut).Value) Then
            ageVal = lo.DataBodyRange.Cells(i, colAge).Value
            If IsNumeric(ageVal) Then
                If CLng(ageVal) >= ADULT_AGE Then
                    If Trim$(CStr(lo.DataBodyRange.Cells(i, colMariage).Value)) = "" Then
                        sexVal = LCase$(Left$(CStr(lo.DataBodyRange.Cells(i, colSexe).Value), 1))
                        If sexVal = "f" Then
                            femaleList.Add i
                        ElseIf sexVal = "m" Then
                            maleList.Add i
                        End If
                    End If
                End If
            End If
        End If
    Next i

    ' Pour chaque femme : tentative de mariage
    For fIdx = 1 To femaleList.count
        If maleList.count = 0 Then Exit For

        fRow = femaleList(fIdx)
        mIdx = Int(maleList.count * Rnd) + 1
        mRow = maleList(mIdx)

        p = ComputeMarriageProbability(lo, fRow, mRow, colDyn, colTitre, _
                                        colTrait1, colTrait2, colTrait3, _
                                        colCulture, colAge, _
                                        traitStats, colTGName, colTGMarriageMod)

        If p < 0.01 Then p = 0.01
        If p > 0.9 Then p = 0.9

        If Rnd < p Then
            fFullName = Trim$(CStr(lo.DataBodyRange.Cells(fRow, colPrenom).Value) & " " & _
                              CStr(lo.DataBodyRange.Cells(fRow, colNom).Value))
            mFullName = Trim$(CStr(lo.DataBodyRange.Cells(mRow, colPrenom).Value) & " " & _
                              CStr(lo.DataBodyRange.Cells(mRow, colNom).Value))

            lo.DataBodyRange.Cells(fRow, colMariage).Value = mFullName
            lo.DataBodyRange.Cells(mRow, colMariage).Value = fFullName

            ' Stats : mariage noble si les deux époux sont nobles
            dynF = Trim$(CStr(lo.DataBodyRange.Cells(fRow, colDyn).Value))
            dynM = Trim$(CStr(lo.DataBodyRange.Cells(mRow, colDyn).Value))
            If IsNobleDyn(dynF) And IsNobleDyn(dynM) Then
                stats.nbMariagesNobles = stats.nbMariagesNobles + 1
                Call IncDictKey(stats.mariagesNoblesByPair, FormatDynastyPair(dynF, dynM))
            End If

            maleList.Remove mIdx
        End If
    Next fIdx
End Sub

Public Function ComputeMarriageProbability( _
        lo As ListObject, _
        ByVal fRow As Long, ByVal mRow As Long, _
        ByVal colDyn As Long, ByVal colTitre As Long, _
        ByVal colTrait1 As Long, ByVal colTrait2 As Long, ByVal colTrait3 As Long, _
        ByVal colCulture As Long, ByVal colAge As Long, _
        traitStats As Variant, _
        ByVal colTGName As Long, ByVal colTGMarriageMod As Long) As Double

    Dim dynF As String, dynM As String
    Dim isNobleF As Boolean, isNobleM As Boolean
    Dim score As Double
    Dim titreF As String, titreM As String
    Dim modF As Double, modM As Double
    Dim cultF As String, cultM As String
    Dim ageF As Long, ageM As Long, ageDiff As Long
    Dim isBastardF As Boolean, isBastardM As Boolean

    dynF = Trim$(CStr(lo.DataBodyRange.Cells(fRow, colDyn).Value))
    dynM = Trim$(CStr(lo.DataBodyRange.Cells(mRow, colDyn).Value))

    isNobleF = IsNobleDyn(dynF)
    isNobleM = IsNobleDyn(dynM)

    ' Score de base
    If Not isNobleF And Not isNobleM Then
        score = 0.3
    ElseIf isNobleF And isNobleM Then
        score = 0.15
    Else
        score = 0.03
        ' mésalliance
    End If

    ' Bonus titres (sauf Chasseur)
    If colTitre > 0 Then
        titreF = Trim$(CStr(lo.DataBodyRange.Cells(fRow, colTitre).Value))
        titreM = Trim$(CStr(lo.DataBodyRange.Cells(mRow, colTitre).Value))
        If titreF <> "" And StrComp(titreF, TITRE_CHASSEUR, vbTextCompare) <> 0 Then score = score + 0.1
        If titreM <> "" And StrComp(titreM, TITRE_CHASSEUR, vbTextCompare) <> 0 Then score = score + 0.1
    End If

    ' Effets traits (hors Bâtard)
    If Not IsEmpty(traitStats) And colTGName > 0 And colTGMarriageMod > 0 Then
        modF = ComputeCharacterMarriageMod( _
                    GetBaseTraitName(CStr(lo.DataBodyRange.Cells(fRow, colTrait1).Value)), _
                    GetBaseTraitName(CStr(lo.DataBodyRange.Cells(fRow, colTrait2).Value)), _
                    GetBaseTraitName(CStr(lo.DataBodyRange.Cells(fRow, colTrait3).Value)), _
                    traitStats, colTGName, colTGMarriageMod)
        modM = ComputeCharacterMarriageMod( _
                    GetBaseTraitName(CStr(lo.DataBodyRange.Cells(mRow, colTrait1).Value)), _
                    GetBaseTraitName(CStr(lo.DataBodyRange.Cells(mRow, colTrait2).Value)), _
                    GetBaseTraitName(CStr(lo.DataBodyRange.Cells(mRow, colTrait3).Value)), _
                    traitStats, colTGName, colTGMarriageMod)
        score = score + modF + modM
    End If

    ' Culture
    If colCulture > 0 Then
        cultF = Trim$(CStr(lo.DataBodyRange.Cells(fRow, colCulture).Value))
        cultM = Trim$(CStr(lo.DataBodyRange.Cells(mRow, colCulture).Value))
        If cultF <> "" And cultM <> "" Then
            If StrComp(cultF, cultM, vbTextCompare) = 0 Then
                score = score + 0.1
            Else
                score = score - 0.1
            End If
        End If
    End If

    ' Écart d'âge
    If IsNumeric(lo.DataBodyRange.Cells(fRow, colAge).Value) And _
       IsNumeric(lo.DataBodyRange.Cells(mRow, colAge).Value) Then
        ageF = CLng(lo.DataBodyRange.Cells(fRow, colAge).Value)
        ageM = CLng(lo.DataBodyRange.Cells(mRow, colAge).Value)
        ageDiff = Abs(ageF - ageM)
        score = score - (ageDiff * 0.005)
    End If

    ' Effet Bâtard
    isBastardF = CharacterHasTrait(lo, fRow, colTrait1, colTrait2, colTrait3, TRAIT_BASTARD)
    isBastardM = CharacterHasTrait(lo, mRow, colTrait1, colTrait2, colTrait3, TRAIT_BASTARD)
    If isBastardF Then score = score - 0.05
    If isBastardM Then score = score - 0.05
    If isBastardF And isBastardM Then score = score + 0.1   ' compensation
    If isBastardF And IsNobleDyn(dynF) And IsNobleDyn(dynM) Then score = score - 0.05
    If isBastardM And IsNobleDyn(dynM) And IsNobleDyn(dynF) Then score = score - 0.05

    ' Bornes
    If score < 0.01 Then score = 0.01
    If score > 0.9 Then score = 0.9

    ComputeMarriageProbability = score
End Function

Public Function ComputeCharacterMarriageMod( _
        ByVal tr1 As String, ByVal tr2 As String, ByVal tr3 As String, _
        traitStats As Variant, _
        ByVal colName As Long, ByVal colMarriageMod As Long) As Double

    Dim total As Double

    If colMarriageMod <= 0 Then Exit Function

    If tr1 <> "" Then total = total + GetTraitMarriageMod(tr1, traitStats, colName, colMarriageMod)
    If tr2 <> "" Then total = total + GetTraitMarriageMod(tr2, traitStats, colName, colMarriageMod)
    If tr3 <> "" Then total = total + GetTraitMarriageMod(tr3, traitStats, colName, colMarriageMod)

    If total < -0.2 Then total = -0.2
    If total > 0.2 Then total = 0.2

    ComputeCharacterMarriageMod = total
End Function

Public Function GetTraitMarriageMod( _
        ByVal traitName As String, _
        traitStats As Variant, _
        ByVal colName As Long, ByVal colMarriageMod As Long) As Double

    Dim i As Long, v As Variant

    traitName = GetBaseTraitName(traitName)
    If traitName = "" Then Exit Function
    If StrComp(traitName, TRAIT_BASTARD, vbTextCompare) = 0 Then Exit Function   ' géré au niveau couple

    For i = 1 To UBound(traitStats, 1)
        If StrComp(CStr(traitStats(i, colName)), traitName, vbTextCompare) = 0 Then
            v = traitStats(i, colMarriageMod)
            If IsNumeric(v) Then GetTraitMarriageMod = CDbl(v)
            Exit Function
        End If
    Next i
End Function

'================================================================
'  SUCCESSION DU DIRIGEANT
'================================================================

Public Sub HandleDirigeantSuccession( _
        lo As ListObject, _
        ByVal colTitre As Long, ByVal colDyn As Long, _
        ByVal colAge As Long, ByVal colStatut As Long, _
        ByVal colSexe As Long, ByVal colCulture As Long, _
        ByRef stats As TurnStats)

    Dim heritierRow As Long
    Dim randomNobleRow As Long

    ' 1) Héritier vivant ?
    heritierRow = FindFirstRowWithTitle(lo, TITRE_HERITIER, colTitre, colStatut)
    If heritierRow > 0 Then
        lo.DataBodyRange.Cells(heritierRow, colTitre).Value = TITRE_DIRIGEANT
        Call AddTitleStat(stats, TITRE_DIRIGEANT)
        Exit Sub
    End If

    ' 2) Pas d'héritier : noble adulte aléatoire
    randomNobleRow = PickRandomAdultNoble(lo, colDyn, colAge, colStatut, colSexe, colCulture)
    If randomNobleRow > 0 Then
        lo.DataBodyRange.Cells(randomNobleRow, colTitre).Value = TITRE_DIRIGEANT
        Call AddTitleStat(stats, TITRE_DIRIGEANT)
        stats.crisisMsg = "CRISE DE SUCCESSION : aucun Héritier désigné. Un noble adulte a été promu Dirigeant à défaut."
    Else
        stats.crisisMsg = "CRISE MAJEURE : plus aucun noble adulte vivant. Le poste de Dirigeant est vacant."
    End If
End Sub

Public Function FindFirstRowWithTitle(lo As ListObject, ByVal titre As String, _
                                        ByVal colTitre As Long, ByVal colStatut As Long) As Long
    Dim i As Long
    For i = 1 To lo.DataBodyRange.Rows.count
        If IsAlive(lo.DataBodyRange.Cells(i, colStatut).Value) Then
            If StrComp(Trim$(CStr(lo.DataBodyRange.Cells(i, colTitre).Value)), titre, vbTextCompare) = 0 Then
                FindFirstRowWithTitle = i
                Exit Function
            End If
        End If
    Next i
End Function

Public Function PickRandomAdultNoble(lo As ListObject, _
                                       ByVal colDyn As Long, ByVal colAge As Long, _
                                       ByVal colStatut As Long, _
                                       ByVal colSexe As Long, ByVal colCulture As Long) As Long
    Dim candidates As Collection
    Dim i As Long, charSex As String, charCulture As String
    Set candidates = New Collection
    For i = 1 To lo.DataBodyRange.Rows.count
        If IsAlive(lo.DataBodyRange.Cells(i, colStatut).Value) Then
            If IsNumeric(lo.DataBodyRange.Cells(i, colAge).Value) Then
                If CLng(lo.DataBodyRange.Cells(i, colAge).Value) >= ADULT_AGE Then
                    If IsNobleDyn(Trim$(CStr(lo.DataBodyRange.Cells(i, colDyn).Value))) Then
                        charSex = CStr(lo.DataBodyRange.Cells(i, colSexe).Value)
                        charCulture = Trim$(CStr(lo.DataBodyRange.Cells(i, colCulture).Value))
                        If IsTitleAllowedForCharacter(TITRE_DIRIGEANT, charSex, charCulture) Then
                            candidates.Add i
                        End If
                    End If
                End If
            End If
        End If
    Next i
    If candidates.count = 0 Then Exit Function
    PickRandomAdultNoble = candidates(Int(candidates.count * Rnd) + 1)
End Function

'================================================================
'  ÉCOLES & ÉDUCATION
'================================================================

Public Function GetSchoolRank(ByVal buildingName As String) As Long
    Dim s As String
    s = Trim$(buildingName)
    If s = "" Then Exit Function

    If StrComp(s, ECOLE_ELEM, vbTextCompare) = 0 Then
        GetSchoolRank = 1
    ElseIf StrComp(s, ECOLE_INTER, vbTextCompare) = 0 Then
        GetSchoolRank = 2
    ElseIf StrComp(s, ECOLE_SUP, vbTextCompare) = 0 Then
        GetSchoolRank = 3
    End If
End Function

Public Function FindCityBuildingsColumn(wsJ As Worksheet, ByVal villeName As String) As Long
    Dim col As Long, lastCol As Long

    villeName = Trim$(villeName)
    If villeName = "" Then Exit Function

    lastCol = wsJ.Cells(CITY_HEADER_ROW, wsJ.Columns.count).End(xlToLeft).Column
    For col = 1 To lastCol
        If StrComp(Trim$(CStr(wsJ.Cells(CITY_HEADER_ROW, col).Value)), villeName, vbTextCompare) = 0 Then
            FindCityBuildingsColumn = col + 1
            Exit Function
        End If
    Next col
End Function

Public Function GetSchoolRankInCity(ByVal joueur As Long, ByVal villeName As String) As Long
    Dim wsJ As Worksheet
    Dim buildingsCol As Long, r As Long, lastRow As Long
    Dim rank As Long, maxRank As Long

    On Error Resume Next
    Set wsJ = ThisWorkbook.Worksheets("J" & joueur)
    On Error GoTo 0
    If wsJ Is Nothing Then Exit Function

    buildingsCol = FindCityBuildingsColumn(wsJ, villeName)
    If buildingsCol = 0 Then Exit Function

    lastRow = wsJ.Cells(wsJ.Rows.count, buildingsCol).End(xlUp).Row
    For r = 1 To lastRow
        rank = GetSchoolRank(CStr(wsJ.Cells(r, buildingsCol).Value))
        If rank > maxRank Then maxRank = rank
    Next r

    GetSchoolRankInCity = maxRank
End Function

Public Function CountProfesseursInCity(lo As ListObject, ByVal villeName As String, _
                                         ByVal colVille As Long, ByVal colTitre As Long, _
                                         ByVal colStatut As Long) As Long
    Dim i As Long, c As Long

    For i = 1 To lo.DataBodyRange.Rows.count
        If IsAlive(lo.DataBodyRange.Cells(i, colStatut).Value) Then
            If StrComp(Trim$(CStr(lo.DataBodyRange.Cells(i, colVille).Value)), villeName, vbTextCompare) = 0 Then
                If StrComp(Trim$(CStr(lo.DataBodyRange.Cells(i, colTitre).Value)), TITRE_PROFESSEUR, vbTextCompare) = 0 Then
                    c = c + 1
                End If
            End If
        End If
    Next i

    CountProfesseursInCity = c
End Function

Public Function PickRandomEligibleForProfesseur(lo As ListObject, ByVal villeName As String, _
                                                   ByVal colVille As Long, ByVal colTitre As Long, _
                                                   ByVal colAge As Long, ByVal colStatut As Long) As Long
    Dim candidates As Collection
    Dim i As Long
    Dim titleVal As String
    Dim ageVal As Variant
    Dim colT1 As Long, colT2 As Long, colT3 As Long

    ' --- NOUVEAU : indices des traits (exclusion des "Obstinés") ---
    On Error Resume Next
    colT1 = lo.ListColumns("Trait1").Index
    colT2 = lo.ListColumns("Trait2").Index
    colT3 = lo.ListColumns("Trait3").Index
    On Error GoTo 0

    Set candidates = New Collection
    For i = 1 To lo.DataBodyRange.Rows.count
        If IsAlive(lo.DataBodyRange.Cells(i, colStatut).Value) Then
            If StrComp(Trim$(CStr(lo.DataBodyRange.Cells(i, colVille).Value)), villeName, vbTextCompare) = 0 Then
                ageVal = lo.DataBodyRange.Cells(i, colAge).Value
                If IsNumeric(ageVal) Then
                    If CLng(ageVal) >= ADULT_AGE Then
                        titleVal = Trim$(CStr(lo.DataBodyRange.Cells(i, colTitre).Value))
                        If StrComp(titleVal, TITRE_PROFESSEUR, vbTextCompare) <> 0 Then
                            ' --- NOUVEAU : pas de Professeur "Obstiné" ---
                            If Not CharacterHasTrait(lo, i, colT1, colT2, colT3, TRAIT_NO_EDUC) Then
                                candidates.Add i
                            End If
                        End If
                    End If
                End If
            End If
        End If
    Next i

    If candidates.count = 0 Then Exit Function
    PickRandomEligibleForProfesseur = candidates(Int(candidates.count * Rnd) + 1)
End Function

Public Sub MaybeAssignProfesseursInCities(lo As ListObject, ByVal joueur As Long, _
                                            ByVal colVille As Long, ByVal colTitre As Long, _
                                            ByVal colAge As Long, ByVal colStatut As Long, _
                                            ByVal colEducation As Long, _
                                            ByRef stats As TurnStats)
    Dim seen As Object
    Dim cities As Collection
    Dim v As Variant, villeName As String
    Dim i As Long
    Dim schoolRank As Long, currentProfs As Long
    Dim chance As Double
    Dim newProfRow As Long
    Dim currentEduc As String

    If lo Is Nothing Or lo.DataBodyRange Is Nothing Then Exit Sub

    Set seen = CreateObject("Scripting.Dictionary")
    Set cities = New Collection

    For i = 1 To lo.DataBodyRange.Rows.count
        villeName = Trim$(CStr(lo.DataBodyRange.Cells(i, colVille).Value))
        If villeName <> "" And Not seen.exists(LCase$(villeName)) Then
            seen.Add LCase$(villeName), True
            cities.Add villeName
        End If
    Next i

    For Each v In cities
        villeName = CStr(v)
        schoolRank = GetSchoolRankInCity(joueur, villeName)
        If schoolRank > 0 Then
            currentProfs = CountProfesseursInCity(lo, villeName, colVille, colTitre, colStatut)
            If currentProfs < schoolRank Then
                chance = PROFESSEUR_BASE_CHANCE / Log(currentProfs + 2.71628)
                If Rnd < chance Then
                    newProfRow = PickRandomEligibleForProfesseur(lo, villeName, colVille, colTitre, colAge, colStatut)
                    If newProfRow > 0 Then
                        lo.DataBodyRange.Cells(newProfRow, colTitre).Value = TITRE_PROFESSEUR
                        Call AddTitleStat(stats, TITRE_PROFESSEUR)

                        ' Un Prof doit avoir une éducation pour enseigner
                        If colEducation > 0 Then
                            currentEduc = Trim$(CStr(lo.DataBodyRange.Cells(newProfRow, colEducation).Value))
                            If currentEduc = "" Then
                                lo.DataBodyRange.Cells(newProfRow, colEducation).Value = PickRandomEducation()
                            End If
                        End If
                    End If
                End If
            End If
        End If
    Next v
End Sub

Public Function RollEducationAtBirth(ByVal joueur As Long, ByVal motherCity As String, _
                                       ByVal babyDyn As String, ByVal nbProfs As Long, _
                                       availableEducations As Collection) As String
    Dim schoolRank As Long
    Dim baseChance As Double, modChance As Double
    Dim idx As Long

    If nbProfs = 0 Then Exit Function
    If availableEducations Is Nothing Then Exit Function
    If availableEducations.count = 0 Then Exit Function

    schoolRank = GetSchoolRankInCity(joueur, motherCity)
    If schoolRank = 0 Then Exit Function

    If IsNobleDyn(babyDyn) Then
        baseChance = CHANCE_EDUC_NOBLE * schoolRank
    Else
        baseChance = CHANCE_EDUC_ROTURIER * schoolRank
    End If

    modChance = baseChance * (1 + PROF_BONUS_EDUC * (nbProfs - 1))
    If modChance > 1 Then modChance = 1

    If Rnd < modChance Then
        idx = Int(availableEducations.count * Rnd) + 1
        RollEducationAtBirth = CStr(availableEducations(idx))
    End If
End Function

Public Function TryEducateMinor(lo As ListObject, ByVal rowIndex As Long, ByVal joueur As Long, _
                                 ByVal colVille As Long, ByVal colTitre As Long, _
                                 ByVal colEducation As Long, ByVal colDyn As Long, _
                                 ByVal colStatut As Long) As String
    Dim ville As String, babyDyn As String
    Dim nbProfs As Long
    Dim availableEducations As Collection
    Dim colT1 As Long, colT2 As Long, colT3 As Long

    If colEducation <= 0 Then Exit Function

    ' --- NOUVEAU : le trait "Obstiné" empêche toute éducation ---
    On Error Resume Next
    colT1 = lo.ListColumns("Trait1").Index
    colT2 = lo.ListColumns("Trait2").Index
    colT3 = lo.ListColumns("Trait3").Index
    On Error GoTo 0
    If CharacterHasTrait(lo, rowIndex, colT1, colT2, colT3, TRAIT_NO_EDUC) Then Exit Function

    ville = ""
    If colVille > 0 Then ville = Trim$(CStr(lo.DataBodyRange.Cells(rowIndex, colVille).Value))

    nbProfs = CountProfesseursInCity(lo, ville, colVille, colTitre, colStatut)
    If nbProfs = 0 Then Exit Function

    Set availableEducations = GetEducationsAvailableInCity(lo, ville, colVille, colTitre, colEducation, colStatut)
    If availableEducations.count = 0 Then Exit Function

    babyDyn = Trim$(CStr(lo.DataBodyRange.Cells(rowIndex, colDyn).Value))
    TryEducateMinor = RollEducationAtBirth(joueur, ville, babyDyn, nbProfs, availableEducations)
End Function

Private Function GetTitleFromEducation(ByVal education As String, _
                                         ByVal charSex As String, ByVal charCulture As String) As String
    Dim ws As Worksheet, lo As ListObject
    Dim i As Long, colT As Long, colE As Long, colA As Long
    Dim proposedTitle As String

    education = Trim$(education)
    GetTitleFromEducation = TITRE_CHASSEUR
    If education = "" Then Exit Function

    On Error Resume Next
    Set ws = ThisWorkbook.Worksheets("Titres")
    Set lo = ws.ListObjects("Titres")
    On Error GoTo 0
    If lo Is Nothing Then Exit Function

    colT = lo.ListColumns("Titre").Index
    colE = lo.ListColumns("Education").Index
    colA = lo.ListColumns("Attribution").Index

    proposedTitle = TITRE_CHASSEUR
    For i = 1 To lo.DataBodyRange.Rows.count
        If StrComp(Trim$(CStr(lo.DataBodyRange.Cells(i, colE).Value)), education, vbTextCompare) = 0 Then
            If StrComp(Trim$(CStr(lo.DataBodyRange.Cells(i, colA).Value)), "Education", vbTextCompare) = 0 Then
                proposedTitle = CStr(lo.DataBodyRange.Cells(i, colT).Value)
                Exit For
            End If
        End If
    Next i

    If Not IsTitleAllowedForCharacter(proposedTitle, charSex, charCulture) Then
        proposedTitle = TITRE_CHASSEUR
    End If
    GetTitleFromEducation = proposedTitle
End Function

Public Function PickRandomEducation() As String
    Dim r As Long
    r = Int(5 * Rnd) + 1
    Select Case r
        Case 1: PickRandomEducation = "Culturelle"
        Case 2: PickRandomEducation = "Scientifique"
        Case 3: PickRandomEducation = "Agricole"
        Case 4: PickRandomEducation = "Militaire"
        Case 5: PickRandomEducation = "Économique"
    End Select
End Function

Public Function GetEducationsAvailableInCity(lo As ListObject, ByVal villeName As String, _
                                                ByVal colVille As Long, ByVal colTitre As Long, _
                                                ByVal colEducation As Long, ByVal colStatut As Long) As Collection
    Dim result As New Collection
    Dim seen As Object
    Dim i As Long
    Dim educVal As String

    Set GetEducationsAvailableInCity = result
    If colEducation <= 0 Or colVille <= 0 Or colTitre <= 0 Then Exit Function
    If lo.DataBodyRange Is Nothing Then Exit Function

    Set seen = CreateObject("Scripting.Dictionary")

    For i = 1 To lo.DataBodyRange.Rows.count
        If IsAlive(lo.DataBodyRange.Cells(i, colStatut).Value) Then
            If StrComp(Trim$(CStr(lo.DataBodyRange.Cells(i, colVille).Value)), villeName, vbTextCompare) = 0 Then
                If StrComp(Trim$(CStr(lo.DataBodyRange.Cells(i, colTitre).Value)), TITRE_PROFESSEUR, vbTextCompare) = 0 Then
                    educVal = Trim$(CStr(lo.DataBodyRange.Cells(i, colEducation).Value))
                    If educVal <> "" And Not seen.exists(LCase$(educVal)) Then
                        seen.Add LCase$(educVal), True
                        result.Add educVal
                    End If
                End If
            End If
        End If
    Next i
End Function

'================================================================
'  ATTRIBUTION MANUELLE DE TITRES (UI)
'================================================================

Public Function GetTitresAttribuables() As Variant
    Dim ws As Worksheet, lo As ListObject
    Dim i As Long, n As Long, colT As Long
    Dim arr() As String

    On Error Resume Next
    Set ws = ThisWorkbook.Worksheets("Titres")
    Set lo = ws.ListObjects("Titres")
    On Error GoTo 0

    If lo Is Nothing Or lo.DataBodyRange Is Nothing Then
        GetTitresAttribuables = Array(TITRE_CHASSEUR)
        Exit Function
    End If

    On Error Resume Next
    colT = lo.ListColumns("Titre").Index
    If colT = 0 Then colT = lo.ListColumns("Titres").Index
    If colT = 0 Then colT = lo.ListColumns("Nom").Index
    If colT = 0 Then colT = lo.ListColumns("Nom du titre").Index
    On Error GoTo 0
    If colT = 0 Then colT = 1

    n = lo.DataBodyRange.Rows.count
    ReDim arr(n - 1)
    For i = 1 To n
        arr(i - 1) = Trim$(CStr(lo.DataBodyRange.Cells(i, colT).Value))
    Next i

    GetTitresAttribuables = arr
End Function

Public Function ValidateTitleAssignment(ByVal joueur As Long, ByVal rowIndex As Long, _
                                         ByVal titre As String) As String
    Dim wsP As Worksheet, lo As ListObject
    Dim colTitre As Long, colDyn As Long, colVille As Long, colAge As Long, colStatut As Long
    Dim charDyn As String, charVille As String
    Dim ageVal As Variant
    Dim dirDyn As String
    Dim schoolRank As Long, currentProfs As Long

    Set wsP = ThisWorkbook.Worksheets("P" & joueur)
    Set lo = wsP.ListObjects("P_" & joueur)

    colTitre = lo.ListColumns("Titre").Index
    colDyn = lo.ListColumns("Dynastie").Index
    colVille = lo.ListColumns("Ville").Index
    colAge = lo.ListColumns("Age").Index
    colStatut = lo.ListColumns("Statut").Index

    ' Adulte ?
    ageVal = lo.DataBodyRange.Cells(rowIndex, colAge).Value
    If Not IsNumeric(ageVal) Or CLng(ageVal) < ADULT_AGE Then
        ValidateTitleAssignment = "Le personnage doit être adulte (" & ADULT_AGE & " ans)."
        Exit Function
    End If

    ' Vivant ?
    If Not IsAlive(lo.DataBodyRange.Cells(rowIndex, colStatut).Value) Then
        ValidateTitleAssignment = "Le personnage est mort."
        Exit Function
    End If

    charDyn = Trim$(CStr(lo.DataBodyRange.Cells(rowIndex, colDyn).Value))
    charVille = Trim$(CStr(lo.DataBodyRange.Cells(rowIndex, colVille).Value))

    ' Réservé aux nobles ?
    If IsTitreNobleOnly(titre) And Not IsNobleDyn(charDyn) Then
        ValidateTitleAssignment = "Le titre " & titre & " est réservé aux nobles."
        Exit Function
    End If
    ' Filtre culturel générique (Hérédité, Martialité, ...)
    Dim charSex As String, charCulture As String, ruleName As String
    charSex = CStr(lo.DataBodyRange.Cells(rowIndex, lo.ListColumns("Sexe").Index).Value)
    charCulture = Trim$(CStr(lo.DataBodyRange.Cells(rowIndex, lo.ListColumns("Culture").Index).Value))
    If Not IsTitleAllowedForCharacter(titre, charSex, charCulture) Then
        ruleName = GetTitleGenderRule(titre)
        ValidateTitleAssignment = "Le titre " & titre & " n'est pas autorisé pour ce sexe selon la " & _
                                    ruleName & " de la culture " & charCulture & "."
        Exit Function
    End If
    
    ' Titres réservés à l'armée
    If StrComp(GetTitleAttribution(titre), "Armée", vbTextCompare) = 0 Then
        ValidateTitleAssignment = "Le titre " & titre & " ne peut être donné que via l'engagement militaire."
        Exit Function
    End If

    Select Case True
        Case StrComp(titre, TITRE_GOUVERNEUR, vbTextCompare) = 0
            If charVille = "" Then
                ValidateTitleAssignment = "Le personnage doit être affecté à une ville."
                Exit Function
            End If
            If CountTitreInCity(lo, TITRE_GOUVERNEUR, charVille, colTitre, colVille, colStatut) >= 1 Then
                ValidateTitleAssignment = "La ville " & charVille & " a déjà un Gouverneur."
                Exit Function
            End If

        Case StrComp(titre, TITRE_HERITIER, vbTextCompare) = 0
            dirDyn = GetDirigeantDynasty(lo, colTitre, colDyn, colStatut)
            If dirDyn = "" Then
                ValidateTitleAssignment = "Pas de Dirigeant en place : impossible de désigner un Héritier."
                Exit Function
            End If
            If StrComp(charDyn, dirDyn, vbTextCompare) <> 0 Then
                ValidateTitleAssignment = "L'Héritier doit être de la dynastie " & dirDyn & "."
                Exit Function
            End If
            If CountTitreInPlayer(lo, TITRE_HERITIER, colTitre, colStatut) >= 1 Then
                ValidateTitleAssignment = "Il y a déjà un Héritier en place."
                Exit Function
            End If

        Case StrComp(titre, TITRE_DIRIGEANT, vbTextCompare) = 0
            If CountTitreInPlayer(lo, TITRE_DIRIGEANT, colTitre, colStatut) >= 1 Then
                ValidateTitleAssignment = "Il y a déjà un Dirigeant. Supprimez d'abord son titre manuellement."
                Exit Function
            End If

        Case StrComp(titre, TITRE_PROFESSEUR, vbTextCompare) = 0
            If charVille = "" Then
                ValidateTitleAssignment = "Le personnage doit être affecté à une ville."
                Exit Function
            End If
            schoolRank = GetSchoolRankInCity(joueur, charVille)
            If schoolRank = 0 Then
                ValidateTitleAssignment = "Pas d'école dans la ville " & charVille & "."
                Exit Function
            End If
            currentProfs = CountProfesseursInCity(lo, charVille, colVille, colTitre, colStatut)
            If currentProfs >= schoolRank Then
                ValidateTitleAssignment = "Le nombre maximum de Professeurs (" & schoolRank & ") est atteint dans " & charVille & "."
                Exit Function
            End If
    End Select

    ValidateTitleAssignment = ""
End Function

Public Sub ApplyTitleAssignment(ByVal joueur As Long, ByVal rowIndex As Long, ByVal titre As String)
    Dim wsP As Worksheet, lo As ListObject
    Dim colTitre As Long, colEducation As Long
    Dim educVal As String

    Set wsP = ThisWorkbook.Worksheets("P" & joueur)
    Set lo = wsP.ListObjects("P_" & joueur)

    colTitre = lo.ListColumns("Titre").Index
    On Error Resume Next
    colEducation = lo.ListColumns("Education").Index
    On Error GoTo 0

    lo.DataBodyRange.Cells(rowIndex, colTitre).Value = titre

    ' Si Professeur sans éducation, lui en donner une
    If StrComp(titre, TITRE_PROFESSEUR, vbTextCompare) = 0 And colEducation > 0 Then
        educVal = Trim$(CStr(lo.DataBodyRange.Cells(rowIndex, colEducation).Value))
        If educVal = "" Then
            lo.DataBodyRange.Cells(rowIndex, colEducation).Value = PickRandomEducation()
        End If
    End If
End Sub

Public Function IsTitreNobleOnly(ByVal titre As String) As Boolean
    Dim ws As Worksheet, lo As ListObject
    Dim colT As Long, colN As Long
    Dim i As Long, v As String

    On Error Resume Next
    Set ws = ThisWorkbook.Worksheets("Titres")
    Set lo = ws.ListObjects("Titres")
    On Error GoTo 0
    If lo Is Nothing Or lo.DataBodyRange Is Nothing Then Exit Function

    colT = lo.ListColumns("Titre").Index
    On Error Resume Next
    colN = lo.ListColumns("NobleSeul").Index
    On Error GoTo 0
    If colN = 0 Then Exit Function

    For i = 1 To lo.DataBodyRange.Rows.count
        If StrComp(Trim$(CStr(lo.DataBodyRange.Cells(i, colT).Value)), titre, vbTextCompare) = 0 Then
            v = LCase$(Trim$(CStr(lo.DataBodyRange.Cells(i, colN).Value)))
            If v = "oui" Or v = "yes" Or v = "true" Or v = "1" Or v = "x" Then
                IsTitreNobleOnly = True
            End If
            Exit Function
        End If
    Next i
End Function

Public Function CountTitreInPlayer(lo As ListObject, ByVal titre As String, _
                                     ByVal colTitre As Long, ByVal colStatut As Long) As Long
    Dim i As Long, c As Long
    For i = 1 To lo.DataBodyRange.Rows.count
        If IsAlive(lo.DataBodyRange.Cells(i, colStatut).Value) Then
            If StrComp(Trim$(CStr(lo.DataBodyRange.Cells(i, colTitre).Value)), titre, vbTextCompare) = 0 Then
                c = c + 1
            End If
        End If
    Next i
    CountTitreInPlayer = c
End Function

Public Function CountTitreInCity(lo As ListObject, ByVal titre As String, ByVal villeName As String, _
                                    ByVal colTitre As Long, ByVal colVille As Long, ByVal colStatut As Long) As Long
    Dim i As Long, c As Long
    For i = 1 To lo.DataBodyRange.Rows.count
        If IsAlive(lo.DataBodyRange.Cells(i, colStatut).Value) Then
            If StrComp(Trim$(CStr(lo.DataBodyRange.Cells(i, colVille).Value)), villeName, vbTextCompare) = 0 Then
                If StrComp(Trim$(CStr(lo.DataBodyRange.Cells(i, colTitre).Value)), titre, vbTextCompare) = 0 Then
                    c = c + 1
                End If
            End If
        End If
    Next i
    CountTitreInCity = c
End Function

Public Function GetDirigeantDynasty(lo As ListObject, ByVal colTitre As Long, _
                                       ByVal colDyn As Long, ByVal colStatut As Long) As String
    Dim i As Long
    For i = 1 To lo.DataBodyRange.Rows.count
        If IsAlive(lo.DataBodyRange.Cells(i, colStatut).Value) Then
            If StrComp(Trim$(CStr(lo.DataBodyRange.Cells(i, colTitre).Value)), TITRE_DIRIGEANT, vbTextCompare) = 0 Then
                GetDirigeantDynasty = Trim$(CStr(lo.DataBodyRange.Cells(i, colDyn).Value))
                Exit Function
            End If
        End If
    Next i
End Function

'================================================================
'  TRAITS GÉNÉTIQUES — référentiel et héritage
'================================================================

Public Function GetBaseTraitName(ByVal traitCell As String) As String
    Dim p As Long
    traitCell = Trim$(traitCell)
    If traitCell = "" Then Exit Function

    p = InStr(traitCell, " - ")
    If p > 0 Then
        GetBaseTraitName = Trim$(Left$(traitCell, p - 1))
    Else
        GetBaseTraitName = traitCell
    End If
End Function

Public Function GetTraitDescription(traitName As String, traitStats As Variant, _
                                       colName As Long, colDesc As Long) As String
    Dim i As Long
    traitName = Trim$(traitName)
    If traitName = "" Then Exit Function

    For i = 1 To UBound(traitStats, 1)
        If StrComp(CStr(traitStats(i, colName)), traitName, vbTextCompare) = 0 Then
            GetTraitDescription = CStr(traitStats(i, colDesc))
            Exit Function
        End If
    Next i
End Function

Public Function GetLifeDeltaForTrait(traitName As String, traitStats As Variant, _
                                        colName As Long, colDelta As Long) As Long
    Dim i As Long
    traitName = Trim$(traitName)
    If traitName = "" Then Exit Function

    For i = 1 To UBound(traitStats, 1)
        If StrComp(CStr(traitStats(i, colName)), traitName, vbTextCompare) = 0 Then
            If IsNumeric(traitStats(i, colDelta)) Then
                GetLifeDeltaForTrait = CLng(traitStats(i, colDelta))
            End If
            Exit Function
        End If
    Next i
End Function

Public Function GetResurrectionRoll(traitName As String, traitStats As Variant, _
                                       colName As Long, colRes As Long) As Long
    Dim i As Long
    traitName = GetBaseTraitName(traitName)
    If traitName = "" Then Exit Function

    For i = 1 To UBound(traitStats, 1)
        If StrComp(CStr(traitStats(i, colName)), traitName, vbTextCompare) = 0 Then
            If IsNumeric(traitStats(i, colRes)) Then
                GetResurrectionRoll = CLng(traitStats(i, colRes))
            End If
            Exit Function
        End If
    Next i
End Function

Public Function IsTraitHeritable(traitName As String, traitStats As Variant, _
                                    colName As Long, colHeritable As Long) As Boolean
    Dim i As Long
    traitName = GetBaseTraitName(traitName)
    If traitName = "" Then Exit Function

    For i = 1 To UBound(traitStats, 1)
        If StrComp(CStr(traitStats(i, colName)), traitName, vbTextCompare) = 0 Then
            If IsNumeric(traitStats(i, colHeritable)) Then
                If CLng(traitStats(i, colHeritable)) = 1 Then IsTraitHeritable = True
            End If
            Exit Function
        End If
    Next i
End Function

Public Function PickRandomTraitName(traitStats As Variant, colName As Long, colWeight As Long, _
                                       Optional exclude1 As String = "", Optional exclude2 As String = "") As String
    Dim i As Long
    Dim w As Variant
    Dim total As Double, r As Double, cum As Double
    Dim name As String

    exclude1 = Trim$(exclude1)
    exclude2 = Trim$(exclude2)

    For i = 1 To UBound(traitStats, 1)
        name = CStr(traitStats(i, colName))
        w = traitStats(i, colWeight)
        If IsNumeric(w) And w > 0 Then
            If (exclude1 = "" Or StrComp(name, exclude1, vbTextCompare) <> 0) _
               And (exclude2 = "" Or StrComp(name, exclude2, vbTextCompare) <> 0) Then
                total = total + CDbl(w)
            End If
        End If
    Next i

    If total <= 0 Then Exit Function

    r = Rnd * total
    cum = 0
    For i = 1 To UBound(traitStats, 1)
        name = CStr(traitStats(i, colName))
        w = traitStats(i, colWeight)
        If IsNumeric(w) And w > 0 Then
            If (exclude1 = "" Or StrComp(name, exclude1, vbTextCompare) <> 0) _
               And (exclude2 = "" Or StrComp(name, exclude2, vbTextCompare) <> 0) Then
                cum = cum + CDbl(w)
                If r <= cum Then
                    PickRandomTraitName = name
                    Exit Function
                End If
            End If
        End If
    Next i
End Function

Public Sub AddInheritedTraitToChild(ByRef childTrait1 As String, ByRef childTrait2 As String, _
                                      ByRef childTrait3 As String, _
                                      ByVal parentTrait As String, _
                                      traitStats As Variant, colName As Long, colHeritable As Long)
    Dim baseName As String

    baseName = GetBaseTraitName(parentTrait)
    If baseName = "" Then Exit Sub
    If Not IsTraitHeritable(baseName, traitStats, colName, colHeritable) Then Exit Sub
    If Rnd > 0.4 Then Exit Sub

    ' Déjà présent ?
    If StrComp(GetBaseTraitName(childTrait1), baseName, vbTextCompare) = 0 _
       Or StrComp(GetBaseTraitName(childTrait2), baseName, vbTextCompare) = 0 _
       Or StrComp(GetBaseTraitName(childTrait3), baseName, vbTextCompare) = 0 Then
        Exit Sub
    End If

    ' Slot libre ?
    If childTrait1 = "" Or StrComp(GetBaseTraitName(childTrait1), "Aucun", vbTextCompare) = 0 Then
        childTrait1 = baseName
    ElseIf childTrait2 = "" Or StrComp(GetBaseTraitName(childTrait2), "Aucun", vbTextCompare) = 0 Then
        childTrait2 = baseName
    ElseIf childTrait3 = "" Or StrComp(GetBaseTraitName(childTrait3), "Aucun", vbTextCompare) = 0 Then
        childTrait3 = baseName
    End If
End Sub

Public Sub EnsureBastardTrait(ByRef trait1Name As String, ByRef trait2Name As String, ByRef trait3Name As String)
    EnsureTraitPresent trait1Name, trait2Name, trait3Name, TRAIT_BASTARD
End Sub

Public Sub EnsureTraitPresent(ByRef trait1Name As String, ByRef trait2Name As String, _
                                 ByRef trait3Name As String, ByVal wantedTrait As String)
    Dim b1 As String, b2 As String, b3 As String

    wantedTrait = GetBaseTraitName(wantedTrait)
    If wantedTrait = "" Then Exit Sub

    b1 = GetBaseTraitName(trait1Name)
    b2 = GetBaseTraitName(trait2Name)
    b3 = GetBaseTraitName(trait3Name)

    ' Déjà présent ?
    If StrComp(b1, wantedTrait, vbTextCompare) = 0 _
       Or StrComp(b2, wantedTrait, vbTextCompare) = 0 _
       Or StrComp(b3, wantedTrait, vbTextCompare) = 0 Then
        Exit Sub
    End If

    ' Slot libre ?
    If b1 = "" Or StrComp(b1, "Aucun", vbTextCompare) = 0 Then
        trait1Name = wantedTrait
    ElseIf b2 = "" Or StrComp(b2, "Aucun", vbTextCompare) = 0 Then
        trait2Name = wantedTrait
    ElseIf b3 = "" Or StrComp(b3, "Aucun", vbTextCompare) = 0 Then
        trait3Name = wantedTrait
    End If
End Sub

Public Function CharacterHasTrait(lo As ListObject, ByVal rowIndex As Long, _
                                     ByVal colTrait1 As Long, ByVal colTrait2 As Long, _
                                     ByVal colTrait3 As Long, ByVal traitName As String) As Boolean
    Dim t As String
    traitName = GetBaseTraitName(traitName)

    t = GetBaseTraitName(CStr(lo.DataBodyRange.Cells(rowIndex, colTrait1).Value))
    If StrComp(t, traitName, vbTextCompare) = 0 Then CharacterHasTrait = True: Exit Function

    t = GetBaseTraitName(CStr(lo.DataBodyRange.Cells(rowIndex, colTrait2).Value))
    If StrComp(t, traitName, vbTextCompare) = 0 Then CharacterHasTrait = True: Exit Function

    t = GetBaseTraitName(CStr(lo.DataBodyRange.Cells(rowIndex, colTrait3).Value))
    If StrComp(t, traitName, vbTextCompare) = 0 Then CharacterHasTrait = True: Exit Function
End Function

Public Sub SetTraitCell(ByVal c As Range, traitName As String, traitStats As Variant, _
                          colName As Long, colDesc As Long)
    Dim desc As String, title As String

    traitName = Trim$(traitName)
    c.Value = traitName
    c.WrapText = False

    desc = GetTraitDescription(traitName, traitStats, colName, colDesc)

    On Error Resume Next
    c.Validation.Delete
    On Error GoTo 0

    If desc <> "" Then
        title = Left$(traitName, 32)
        If Len(desc) > 255 Then desc = Left$(desc, 252) & "..."

        On Error Resume Next
        c.Validation.Add Type:=xlValidateCustom, AlertStyle:=xlValidAlertInformation, _
                          Operator:=xlBetween, Formula1:="=TRUE"
        c.Validation.IgnoreBlank = True
        c.Validation.InCellDropdown = False
        c.Validation.InputTitle = title
        c.Validation.InputMessage = desc
        On Error GoTo 0
    End If
End Sub


'================================================================
'  GÉNÉALOGIE
'================================================================

Public Function GetHusbandRowIndex(lo As ListObject, rowIndex As Long, _
                                     colMariage As Long, colSexe As Long, _
                                     colNom As Long, colPrenom As Long, colStatut As Long) As Long
    Dim spouse As String, candidateName As String
    Dim j As Long

    spouse = Trim$(CStr(lo.DataBodyRange.Cells(rowIndex, colMariage).Value))
    If spouse = "" Then Exit Function

    For j = 1 To lo.DataBodyRange.Rows.count
        If j <> rowIndex Then
            If Left$(LCase$(CStr(lo.DataBodyRange.Cells(j, colSexe).Value)), 1) = "m" Then
                If IsAlive(lo.DataBodyRange.Cells(j, colStatut).Value) Then
                    candidateName = Trim$(CStr(lo.DataBodyRange.Cells(j, colPrenom).Value) & " " & _
                                          CStr(lo.DataBodyRange.Cells(j, colNom).Value))
                    If StrComp(spouse, candidateName, vbTextCompare) = 0 Then
                        GetHusbandRowIndex = j
                        Exit Function
                    End If
                End If
            End If
        End If
    Next j
End Function

Public Function PickRandomMaleLover(lo As ListObject, ByVal motherRow As Long, _
                                       ByVal colSexe As Long, ByVal colAge As Long, _
                                       ByVal colStatut As Long, ByVal excludeRow As Long) As Long
    Dim i As Long, nbRows As Long
    Dim candidates As Collection
    Dim sexVal As String
    Dim ageVal As Variant
    Dim idx As Long

    If lo Is Nothing Then Exit Function
    If lo.DataBodyRange Is Nothing Then Exit Function

    nbRows = lo.DataBodyRange.Rows.count
    If nbRows = 0 Then Exit Function

    Set candidates = New Collection
    For i = 1 To nbRows
        If i <> motherRow And i <> excludeRow Then
            If IsAlive(lo.DataBodyRange.Cells(i, colStatut).Value) Then
                sexVal = LCase$(Left$(CStr(lo.DataBodyRange.Cells(i, colSexe).Value), 1))
                If sexVal = "m" Then
                    ageVal = lo.DataBodyRange.Cells(i, colAge).Value
                    If IsNumeric(ageVal) Then
                        If CLng(ageVal) >= ADULT_AGE Then candidates.Add i
                    End If
                End If
            End If
        End If
    Next i

    If candidates.count = 0 Then Exit Function
    idx = Int(candidates.count * Rnd) + 1
    PickRandomMaleLover = candidates(idx)
End Function

Public Function ComputeBabyDynasty(ByVal isBastard As Boolean, ByVal dynMother As String, _
                                      ByVal dynFather As String, ByVal heredite As String) As String
    dynMother = Trim$(dynMother)
    dynFather = Trim$(dynFather)

    If isBastard Then
        ' Au moins un noble => dynastie noble
        If IsNobleDyn(dynMother) Then
            ComputeBabyDynasty = dynMother
        ElseIf IsNobleDyn(dynFather) Then
            ComputeBabyDynasty = dynFather
        Else
            ComputeBabyDynasty = "Roturier"
        End If
        Exit Function
    End If

    ' Légitime : selon hérédité culturelle
    Select Case LCase$(Trim$(heredite))
        Case "masculine"
            ComputeBabyDynasty = IIf(dynFather <> "", dynFather, IIf(dynMother <> "", dynMother, "Roturier"))
        Case "féminine", "feminine"
            ComputeBabyDynasty = IIf(dynMother <> "", dynMother, IIf(dynFather <> "", dynFather, "Roturier"))
        Case "parité", "parite"
            If Rnd < 0.5 Then
                ComputeBabyDynasty = IIf(dynFather <> "", dynFather, IIf(dynMother <> "", dynMother, "Roturier"))
            Else
                ComputeBabyDynasty = IIf(dynMother <> "", dynMother, IIf(dynFather <> "", dynFather, "Roturier"))
            End If
        Case Else
            ComputeBabyDynasty = IIf(dynFather <> "", dynFather, IIf(dynMother <> "", dynMother, "Roturier"))
    End Select
End Function

Public Function IsConsanguineous(lo As ListObject, ByVal motherRow As Long, ByVal fatherRow As Long, _
                                    ByVal colMere As Long, ByVal colPere As Long) As Boolean
    Dim mm As String, mf As String, fm As String, ff As String

    If fatherRow <= 0 Then Exit Function
    If colMere <= 0 Or colPere <= 0 Then Exit Function

    mm = Trim$(CStr(lo.DataBodyRange.Cells(motherRow, colMere).Value))
    mf = Trim$(CStr(lo.DataBodyRange.Cells(motherRow, colPere).Value))
    fm = Trim$(CStr(lo.DataBodyRange.Cells(fatherRow, colMere).Value))
    ff = Trim$(CStr(lo.DataBodyRange.Cells(fatherRow, colPere).Value))

    If mm <> "" Then
        If fm <> "" And StrComp(mm, fm, vbTextCompare) = 0 Then IsConsanguineous = True: Exit Function
        If ff <> "" And StrComp(mm, ff, vbTextCompare) = 0 Then IsConsanguineous = True: Exit Function
    End If
    If mf <> "" Then
        If fm <> "" And StrComp(mf, fm, vbTextCompare) = 0 Then IsConsanguineous = True: Exit Function
        If ff <> "" And StrComp(mf, ff, vbTextCompare) = 0 Then IsConsanguineous = True: Exit Function
    End If
End Function

Public Sub ClearSpouseMarriage(lo As ListObject, ByVal deceasedRow As Long, _
                                  ByVal colMariage As Long, ByVal colNom As Long, ByVal colPrenom As Long)
    Dim deceasedName As String
    Dim j As Long

    deceasedName = Trim$(CStr(lo.DataBodyRange.Cells(deceasedRow, colPrenom).Value) & " " & _
                          CStr(lo.DataBodyRange.Cells(deceasedRow, colNom).Value))
    If Trim$(deceasedName) = "" Then Exit Sub

    For j = 1 To lo.DataBodyRange.Rows.count
        If j <> deceasedRow Then
            If StrComp(Trim$(CStr(lo.DataBodyRange.Cells(j, colMariage).Value)), deceasedName, vbTextCompare) = 0 Then
                lo.DataBodyRange.Cells(j, colMariage).Value = ""
                Exit Sub
            End If
        End If
    Next j
End Sub

' Lit l'Hérédité d'une culture depuis _Params!params_culture (Masculine/Féminine/Parité).
Public Function GetCultureHeredite(ByVal cultureName As String) As String
    GetCultureHeredite = ReadCultureParam(cultureName, "Hérédité")
    If GetCultureHeredite = "" Then GetCultureHeredite = "Masculine"   ' fallback
End Function

'================================================================
'  STATS & RÉCAP DE FIN DE TOUR
'================================================================

' Incrémente le compteur de titres et le détail par titre
Public Sub AddTitleStat(ByRef stats As TurnStats, ByVal titleName As String)
    titleName = Trim$(titleName)
    If titleName = "" Then Exit Sub

    stats.nbTitresAttribues = stats.nbTitresAttribues + 1

    If stats.titreCounts Is Nothing Then
        Set stats.titreCounts = CreateObject("Scripting.Dictionary")
    End If

    If stats.titreCounts.exists(titleName) Then
        stats.titreCounts(titleName) = stats.titreCounts(titleName) + 1
    Else
        stats.titreCounts.Add titleName, 1
    End If
End Sub

' Écrit le récap dans J{n}!A3 (écrase l'ancien)
Public Sub WriteRecapA3(ByVal joueur As Long, ByRef stats As TurnStats)
    Dim wsJ As Worksheet
    Dim s As String

    On Error Resume Next
    Set wsJ = ThisWorkbook.Worksheets("J" & joueur)
    On Error GoTo 0
    If wsJ Is Nothing Then Exit Sub

    If stats.crisisMsg <> "" Then s = "[!] " & stats.crisisMsg & vbCrLf & vbCrLf
    
    s = s & "Récap du tour :" & vbCrLf

    s = s & "• Conceptions : " & stats.nbConceptions & " (dont " & stats.nbConceptionsNobles & " nobles)" & vbCrLf
    If stats.nbConceptionsNobles > 0 Then
        s = s & "    -> Mères nobles : " & FormatDictionary(stats.conceptionsNoblesByDyn) & vbCrLf
    End If

    s = s & "• Naissances : " & stats.nbNaissances & " (dont " & stats.nbNaissancesNobles & " nobles)" & vbCrLf
    If stats.nbNaissancesNobles > 0 Then
        s = s & "    -> Nobles : " & FormatDictionary(stats.naissancesNoblesByDyn) & vbCrLf
    End If

    s = s & "• Décès : " & stats.nbMorts & " (dont " & stats.nbMortsNobles & " nobles, " & _
        stats.nbMortsTitres & " titrés, " & stats.nbMortsMaladie & " par maladie)" & vbCrLf
    If stats.nbMortsNobles > 0 Then
        s = s & "    -> Nobles : " & FormatDictionary(stats.mortsNoblesByDyn) & vbCrLf
    End If
    If stats.nbMortsTitres > 0 Then
        s = s & "    -> Titres perdus : " & FormatDictionary(stats.mortsTitresByTitre) & vbCrLf
    End If

    s = s & "• Mariages nobles : " & stats.nbMariagesNobles
    If stats.nbMariagesNobles > 0 Then
        s = s & vbCrLf & "    -> " & FormatDictionary(stats.mariagesNoblesByPair)
    End If
    s = s & vbCrLf
    
    s = s & "• Conversions culturelles : " & stats.nbConversions
    If stats.nbConversions > 0 Then
        s = s & vbCrLf & "    -> " & FormatDictionary(stats.conversionsByCulture)
    End If
    s = s & vbCrLf
    
    s = s & "• Titres attribués (auto) : " & stats.nbTitresAttribues
    If stats.nbTitresAttribues > 0 Then
        s = s & vbCrLf & "    -> " & FormatDictionary(stats.titreCounts)
    End If

    wsJ.Range("A35").Value = s
    wsJ.Range("A35").WrapText = True
End Sub

'================================================================
'  UTILITAIRES
'================================================================

Public Function IsGenderAllowed(ByVal cultureRule As String, ByVal sex As String) As Boolean
    Dim r As String, s As String
    r = LCase$(Trim$(cultureRule))
    s = LCase$(Left$(Trim$(sex), 1))
    If r = "" Or r = "parité" Or r = "parite" Then IsGenderAllowed = True: Exit Function
    If r = "masculine" Then
        IsGenderAllowed = (s = "m")
    ElseIf r = "féminine" Or r = "feminine" Then
        IsGenderAllowed = (s = "f")
    Else
        IsGenderAllowed = True
    End If
End Function

Public Function GetTitleGenderRule(ByVal titleName As String) As String
    Dim ws As Worksheet, lo As ListObject
    Dim colT As Long, colR As Long, i As Long
    titleName = Trim$(titleName)
    If titleName = "" Then Exit Function
    On Error Resume Next
    Set ws = ThisWorkbook.Worksheets("Titres")
    Set lo = ws.ListObjects("Titres")
    On Error GoTo 0
    If lo Is Nothing Then Exit Function
    If lo.DataBodyRange Is Nothing Then Exit Function
    On Error Resume Next
    colT = lo.ListColumns("Titre").Index
    colR = lo.ListColumns("RegleGenre").Index
    On Error GoTo 0
    If colT = 0 Or colR = 0 Then Exit Function
    For i = 1 To lo.DataBodyRange.Rows.count
        If StrComp(Trim$(CStr(lo.DataBodyRange.Cells(i, colT).Value)), titleName, vbTextCompare) = 0 Then
            GetTitleGenderRule = Trim$(CStr(lo.DataBodyRange.Cells(i, colR).Value))
            Exit Function
        End If
    Next i
End Function

Private Function GetTitleAttribution(ByVal titleName As String) As String
    Dim ws As Worksheet, lo As ListObject
    Dim colT As Long, colA As Long, i As Long
    titleName = Trim$(titleName)
    If titleName = "" Then Exit Function
    On Error Resume Next
    Set ws = ThisWorkbook.Worksheets("Titres")
    Set lo = ws.ListObjects("Titres")
    On Error GoTo 0
    If lo Is Nothing Or lo.DataBodyRange Is Nothing Then Exit Function
    On Error Resume Next
    colT = lo.ListColumns("Titre").Index
    colA = lo.ListColumns("Attribution").Index
    On Error GoTo 0
    If colT = 0 Or colA = 0 Then Exit Function
    For i = 1 To lo.DataBodyRange.Rows.count
        If StrComp(Trim$(CStr(lo.DataBodyRange.Cells(i, colT).Value)), titleName, vbTextCompare) = 0 Then
            GetTitleAttribution = Trim$(CStr(lo.DataBodyRange.Cells(i, colA).Value))
            Exit Function
        End If
    Next i
End Function

Public Function IsTitleAllowedForCharacter(ByVal titleName As String, _
                                              ByVal charSex As String, ByVal charCulture As String) As Boolean
    Dim rule As String, ruleValue As String
    rule = GetTitleGenderRule(titleName)
    If rule = "" Then IsTitleAllowedForCharacter = True: Exit Function
    ruleValue = ReadCultureParam(charCulture, rule)
    IsTitleAllowedForCharacter = IsGenderAllowed(ruleValue, charSex)
End Function

Public Sub IncDictKey(ByRef dict As Object, ByVal k As String)
    k = Trim$(k)
    If k = "" Then Exit Sub
    If dict Is Nothing Then Set dict = CreateObject("Scripting.Dictionary")
    If dict.exists(k) Then dict(k) = dict(k) + 1 Else dict.Add k, 1
End Sub

Public Function FormatDynastyPair(ByVal dyn1 As String, ByVal dyn2 As String) As String
    dyn1 = Trim$(dyn1): dyn2 = Trim$(dyn2)
    If StrComp(dyn1, dyn2, vbTextCompare) <= 0 Then
        FormatDynastyPair = dyn1 & " × " & dyn2
    Else
        FormatDynastyPair = dyn2 & " × " & dyn1
    End If
End Function

Public Function FormatDictionary(dict As Object) As String
    Dim result As String, k As Variant
    If dict Is Nothing Then Exit Function
    If dict.count = 0 Then Exit Function
    For Each k In dict.keys
        If result <> "" Then result = result & ", "
        result = result & CStr(k) & " : " & dict(k)
    Next k
    FormatDictionary = result
End Function

' Lit une colonne paramétrique d'une culture depuis _Params!params_culture.
Public Function ReadCultureParam(ByVal cultureName As String, ByVal paramCol As String) As String
    Dim wsP As Worksheet, lo As ListObject
    Dim colC As Long, colP As Long, i As Long

    On Error Resume Next
    Set wsP = ThisWorkbook.Worksheets("_Params")
    If wsP Is Nothing Then Exit Function
    Set lo = wsP.ListObjects("params_culture")
    On Error GoTo 0
    If lo Is Nothing Or lo.DataBodyRange Is Nothing Then Exit Function

    On Error Resume Next
    colC = lo.ListColumns("Culture").Index
    colP = lo.ListColumns(paramCol).Index
    On Error GoTo 0
    If colC = 0 Or colP = 0 Then Exit Function

    cultureName = Trim$(cultureName)
    For i = 1 To lo.DataBodyRange.Rows.count
        If StrComp(CStr(lo.DataBodyRange.Cells(i, colC).Value), cultureName, vbTextCompare) = 0 Then
            ReadCultureParam = Trim$(CStr(lo.DataBodyRange.Cells(i, colP).Value))
            Exit Function
        End If
    Next i
End Function

Public Function IsNobleDyn(ByVal dyn As String) As Boolean
    dyn = Trim$(dyn)
    If dyn = "" Then Exit Function
    If StrComp(dyn, "Roturier", vbTextCompare) = 0 Then Exit Function
    IsNobleDyn = True
End Function

Public Function BuildNameTableName(ByVal faction As String) As String
    Dim s As String
    s = Trim$(faction)
    If s = "" Then Exit Function
    s = Replace(s, " ", "_")
    BuildNameTableName = "noms_" & s
End Function

'================================================================
'  FÉCONDITÉ PHYSIOLOGIQUE
'================================================================

Public Function FemaleAgeFactor(ByVal age As Long) As Double
    Select Case age
        Case Is < 16:    FemaleAgeFactor = 0
        Case 16 To 25:   FemaleAgeFactor = 1#
        Case 26 To 30:   FemaleAgeFactor = 0.9
        Case 31 To 35:   FemaleAgeFactor = 0.8
        Case 36 To 40:   FemaleAgeFactor = 0.7
        Case 41 To 44:   FemaleAgeFactor = 0.4
        Case 45 To 49:   FemaleAgeFactor = 0.1
        Case 50 To 99:   FemaleAgeFactor = 0.02
        Case Else:       FemaleAgeFactor = 0
    End Select
End Function

Public Function MaleAgeFactor(ByVal age As Long) As Double
    If age < 16 Then
        MaleAgeFactor = 0
    Else
        MaleAgeFactor = 1# - 0.5 * (age - 16) / 42
        If MaleAgeFactor < 0 Then MaleAgeFactor = 0
    End If
End Function

Public Function OrientationFertFactor(ByVal orientation As String) As Double
    OrientationFertFactor = 1#
    orientation = LCase$(Trim$(orientation))
    If InStr(orientation, "homo") > 0 Or InStr(orientation, "asex") > 0 Then
        OrientationFertFactor = 0.7
    End If
End Function

Public Function LookupTraitFertAdd(ByVal traitName As String, traitStats As Variant, _
                                      ByVal colName As Long, ByVal colFertAdd As Long) As Double
    Dim i As Long
    If traitName = "" Or colFertAdd <= 0 Then Exit Function
    For i = 1 To UBound(traitStats, 1)
        If StrComp(CStr(traitStats(i, colName)), traitName, vbTextCompare) = 0 Then
            If IsNumeric(traitStats(i, colFertAdd)) Then
                LookupTraitFertAdd = CDbl(traitStats(i, colFertAdd))
            End If
            Exit Function
        End If
    Next i
End Function

Public Function GetTraitFertAdd(lo As ListObject, ByVal rowIndex As Long, _
                                   ByVal colT1 As Long, ByVal colT2 As Long, ByVal colT3 As Long, _
                                   traitStats As Variant, ByVal colName As Long, ByVal colFertAdd As Long) As Double
    If colFertAdd <= 0 Then Exit Function
    GetTraitFertAdd = _
        LookupTraitFertAdd(GetBaseTraitName(CStr(lo.DataBodyRange.Cells(rowIndex, colT1).Value)), traitStats, colName, colFertAdd) + _
        LookupTraitFertAdd(GetBaseTraitName(CStr(lo.DataBodyRange.Cells(rowIndex, colT2).Value)), traitStats, colName, colFertAdd) + _
        LookupTraitFertAdd(GetBaseTraitName(CStr(lo.DataBodyRange.Cells(rowIndex, colT3).Value)), traitStats, colName, colFertAdd)
End Function

Public Function GetCultureFertFactor(ByVal cultureName As String) As Double
    Dim v As String
    GetCultureFertFactor = 1#
    v = ReadCultureParam(cultureName, "fert_factor")
    If IsNumeric(v) Then GetCultureFertFactor = CDbl(v)
End Function

Public Function ComputeConceptionProb( _
        lo As ListObject, ByVal motherRow As Long, ByVal husbandRow As Long, _
        ByVal colAge As Long, ByVal colCulture As Long, ByVal colOrient As Long, _
        ByVal colT1 As Long, ByVal colT2 As Long, ByVal colT3 As Long, _
        traitStats As Variant, ByVal colTGName As Long, ByVal colTGFertAdd As Long) As Double

    Dim p As Double, ageF As Long, ageM As Long
    Dim femAge As Double, malAge As Double
    Dim cultureF As Double, orientF As Double
    Dim tMother As Double, tFather As Double, tFactor As Double

    If Not IsNumeric(lo.DataBodyRange.Cells(motherRow, colAge).Value) Then Exit Function
    ageF = CLng(lo.DataBodyRange.Cells(motherRow, colAge).Value)
    femAge = FemaleAgeFactor(ageF)
    If femAge = 0 Then Exit Function

    If husbandRow > 0 Then
        ageM = 30
        If IsNumeric(lo.DataBodyRange.Cells(husbandRow, colAge).Value) Then
            ageM = CLng(lo.DataBodyRange.Cells(husbandRow, colAge).Value)
        End If
        malAge = MaleAgeFactor(ageM)
    Else
        malAge = FERT_SINGLE_FACTOR
    End If

    tMother = GetTraitFertAdd(lo, motherRow, colT1, colT2, colT3, traitStats, colTGName, colTGFertAdd)
    If husbandRow > 0 Then
        tFather = GetTraitFertAdd(lo, husbandRow, colT1, colT2, colT3, traitStats, colTGName, colTGFertAdd)
    End If
    tFactor = 1# + tMother + tFather
    If tFactor < FERT_TRAIT_FACTOR_MIN Then tFactor = FERT_TRAIT_FACTOR_MIN
    If tFactor > FERT_TRAIT_FACTOR_MAX Then tFactor = FERT_TRAIT_FACTOR_MAX

    cultureF = 1#
    If colCulture > 0 Then
        cultureF = GetCultureFertFactor(Trim$(CStr(lo.DataBodyRange.Cells(motherRow, colCulture).Value)))
    End If

    orientF = 1#
    If colOrient > 0 Then
        orientF = OrientationFertFactor(CStr(lo.DataBodyRange.Cells(motherRow, colOrient).Value))
        If husbandRow > 0 Then
            orientF = orientF * OrientationFertFactor(CStr(lo.DataBodyRange.Cells(husbandRow, colOrient).Value))
        End If
    End If

    p = FERT_BASE_RATE * femAge * malAge * tFactor * cultureF * orientF
    If p < 0 Then p = 0
    ComputeConceptionProb = p
End Function

Public Function ComputeIndividualFertility( _
        lo As ListObject, ByVal rowIndex As Long, _
        ByVal colSexe As Long, ByVal colAge As Long, ByVal colCulture As Long, _
        ByVal colT1 As Long, ByVal colT2 As Long, ByVal colT3 As Long, _
        traitStats As Variant, ByVal colTGName As Long, ByVal colTGFertAdd As Long) As Double

    Dim age As Long, sexVal As String
    Dim ageF As Double, tMod As Double, cF As Double

    If Not IsNumeric(lo.DataBodyRange.Cells(rowIndex, colAge).Value) Then Exit Function
    age = CLng(lo.DataBodyRange.Cells(rowIndex, colAge).Value)
    sexVal = LCase$(Left$(CStr(lo.DataBodyRange.Cells(rowIndex, colSexe).Value), 1))
    If sexVal = "f" Then ageF = FemaleAgeFactor(age) Else ageF = MaleAgeFactor(age)
    tMod = GetTraitFertAdd(lo, rowIndex, colT1, colT2, colT3, traitStats, colTGName, colTGFertAdd)
    cF = 1#
    If colCulture > 0 Then cF = GetCultureFertFactor(Trim$(CStr(lo.DataBodyRange.Cells(rowIndex, colCulture).Value)))
    ComputeIndividualFertility = ageF * (1 + tMod) * cF
    If ComputeIndividualFertility < 0 Then ComputeIndividualFertility = 0
End Function

Public Function RollNumberOfBabies() As Long
    Dim r As Double
    r = Rnd
    If r < FERT_TRIPLETS_RATE Then
        RollNumberOfBabies = 3
    ElseIf r < FERT_TRIPLETS_RATE + FERT_TWINS_RATE Then
        RollNumberOfBabies = 2
    Else
        RollNumberOfBabies = 1
    End If
End Function

Public Function FindRowByFullName(lo As ListObject, ByVal fullName As String, _
                                     ByVal colNom As Long, ByVal colPrenom As Long) As Long
    Dim i As Long, candidate As String
    fullName = Trim$(fullName)
    If fullName = "" Then Exit Function
    For i = 1 To lo.DataBodyRange.Rows.count
        candidate = Trim$(CStr(lo.DataBodyRange.Cells(i, colPrenom).Value) & " " & _
                          CStr(lo.DataBodyRange.Cells(i, colNom).Value))
        If StrComp(candidate, fullName, vbTextCompare) = 0 Then
            FindRowByFullName = i
            Exit Function
        End If
    Next i
End Function

Public Function IsAlive(ByVal statutVal As Variant) As Boolean
    Dim s As String
    s = LCase$(Trim$(CStr(statutVal)))
    IsAlive = (s <> "décédé" And s <> "decede")
End Function

'================================================================
'  ARMÉES
'================================================================

Private Function FindEligibleSoldat(loP As ListObject, _
                                      ByVal colSexe As Long, ByVal colAge As Long, _
                                      ByVal colCulture As Long, ByVal colStatut As Long, _
                                      ByVal colArmee As Long) As Long
    Dim candidates As Collection
    Dim i As Long, age As Long
    Dim sexVal As String, cultureVal As String, martialite As String
    Set candidates = New Collection
    For i = 1 To loP.DataBodyRange.Rows.count
        If Trim$(CStr(loP.DataBodyRange.Cells(i, colArmee).Value)) <> "" Then GoTo NextC
        If Not IsAlive(loP.DataBodyRange.Cells(i, colStatut).Value) Then GoTo NextC
        If Not IsNumeric(loP.DataBodyRange.Cells(i, colAge).Value) Then GoTo NextC
        age = CLng(loP.DataBodyRange.Cells(i, colAge).Value)
        If age < ADULT_AGE Or age > SOLDAT_AGE_MAX Then GoTo NextC
        sexVal = CStr(loP.DataBodyRange.Cells(i, colSexe).Value)
        cultureVal = Trim$(CStr(loP.DataBodyRange.Cells(i, colCulture).Value))
        martialite = ReadCultureParam(cultureVal, "Martialité")
        If Not IsGenderAllowed(martialite, sexVal) Then GoTo NextC
        candidates.Add i
NextC:
    Next i
    If candidates.count = 0 Then Exit Function
    FindEligibleSoldat = candidates(Int(candidates.count * Rnd) + 1)
End Function

Public Sub RecruitForArmies(ByVal joueur As Long)
    Dim wsP As Worksheet, loP As ListObject
    Dim wsA As Worksheet, loA As ListObject
    Dim colNomP As Long, colPrenomP As Long, colSexeP As Long, colAgeP As Long
    Dim colCultureP As Long, colStatutP As Long, colArmeeP As Long
    Dim colArmeeA As Long, colPuiA As Long, colGenA As Long, colCibleA As Long
    Dim i As Long, j As Long
    Dim armyName As String, generalName As String, cible As Long
    Dim generalRow As Long, soldatCount As Long, currentPuissance As Long
    Dim candidateRow As Long
    Dim colTitreP As Long

    On Error Resume Next
    Set wsP = ThisWorkbook.Worksheets("P" & joueur)
    Set loP = wsP.ListObjects("P_" & joueur)
    Set wsA = ThisWorkbook.Worksheets("J" & joueur)
    Set loA = wsA.ListObjects("Armees_J" & joueur)
    On Error GoTo 0
    If loP Is Nothing Or loA Is Nothing Then Exit Sub
    If loA.DataBodyRange Is Nothing Then Exit Sub
    If loP.DataBodyRange Is Nothing Then Exit Sub

    colNomP = loP.ListColumns("Nom").Index
    colPrenomP = loP.ListColumns("Prénom").Index
    colSexeP = loP.ListColumns("Sexe").Index
    colAgeP = loP.ListColumns("Age").Index
    colCultureP = loP.ListColumns("Culture").Index
    colStatutP = loP.ListColumns("Statut").Index
    colArmeeP = loP.ListColumns("Armée").Index

    colArmeeA = loA.ListColumns("Armée").Index
    colPuiA = loA.ListColumns("Puissance").Index
    colGenA = loA.ListColumns("Général").Index
    colCibleA = loA.ListColumns("Cible").Index
    colTitreP = loP.ListColumns("Titre").Index

    For i = 1 To loA.DataBodyRange.Rows.count
        armyName = Trim$(CStr(loA.DataBodyRange.Cells(i, colArmeeA).Value))
        generalName = Trim$(CStr(loA.DataBodyRange.Cells(i, colGenA).Value))
        cible = 0
        If IsNumeric(loA.DataBodyRange.Cells(i, colCibleA).Value) Then
            cible = CLng(loA.DataBodyRange.Cells(i, colCibleA).Value)
        End If
        If armyName = "" Then GoTo NextArmy

        ' Général : trouver et vérifier
        generalRow = 0
        If generalName <> "" Then
            generalRow = FindRowByFullName(loP, generalName, colNomP, colPrenomP)
        End If
        
        Dim generalDead As Boolean, generalUnknown As Boolean
        generalUnknown = (generalName = "" Or generalRow = 0)
        generalDead = False
        If generalRow > 0 Then
            generalDead = Not IsAlive(loP.DataBodyRange.Cells(generalRow, colStatutP).Value)
        End If
        
        If generalUnknown Or generalDead Then
            ' Marquer général mort dans Armees_Jn
            If generalDead Then loA.DataBodyRange.Cells(i, colGenA).Value = ""
        
            ' Calcul puissance basé sur soldats vivants uniquement (pas de bonus général)
            soldatCount = 0
            For j = 1 To loP.DataBodyRange.Rows.count
                If j <> generalRow Then
                    If StrComp(Trim$(CStr(loP.DataBodyRange.Cells(j, colArmeeP).Value)), armyName, vbTextCompare) = 0 Then
                        If IsAlive(loP.DataBodyRange.Cells(j, colStatutP).Value) Then
                            soldatCount = soldatCount + 1
                        End If
                    End If
                End If
            Next j
            loA.DataBodyRange.Cells(i, colPuiA).Value = soldatCount * PUISSANCE_SOLDAT
        
            ' Notification dans le récap
            If generalDead Then
                Call AppendArmyWarning(joueur, armyName, "commandant " & generalName & " tombé")
            Else
                Call AppendArmyWarning(joueur, armyName, "commandant à nommer")
            End If
            GoTo NextArmy
        End If

        ' Compter soldats vivants, nettoyer morts
        soldatCount = 0
        For j = 1 To loP.DataBodyRange.Rows.count
            If j = generalRow Then GoTo NextSoldat
            If StrComp(Trim$(CStr(loP.DataBodyRange.Cells(j, colArmeeP).Value)), armyName, vbTextCompare) = 0 Then
                If IsAlive(loP.DataBodyRange.Cells(j, colStatutP).Value) Then
                    soldatCount = soldatCount + 1
                Else
                    loP.DataBodyRange.Cells(j, colArmeeP).Value = ""
                End If
            End If
NextSoldat:
        Next j

        currentPuissance = PUISSANCE_GENERAL + soldatCount * PUISSANCE_SOLDAT

        ' Recruter jusqu'à cible (sans dépasser)
        Do While currentPuissance + PUISSANCE_SOLDAT <= cible
            candidateRow = FindEligibleSoldat(loP, colSexeP, colAgeP, colCultureP, colStatutP, colArmeeP)
            If candidateRow = 0 Then Exit Do
            loP.DataBodyRange.Cells(candidateRow, colArmeeP).Value = armyName
            loP.DataBodyRange.Cells(candidateRow, colTitreP).Value = TITRE_SOLDAT
            currentPuissance = currentPuissance + PUISSANCE_SOLDAT
        Loop

        loA.DataBodyRange.Cells(i, colPuiA).Value = currentPuissance
NextArmy:
    Next i
End Sub

Public Sub LeverArmee()
    Dim joueur As Long, generalName As String, cibleStr As String, cible As Long
    Dim wsA As Worksheet, loA As ListObject, wsP As Worksheet, loP As ListObject
    Dim colNomP As Long, colPrenomP As Long, colStatutP As Long
    Dim colDynP As Long, colAgeP As Long, colArmeeP As Long
    Dim generalRow As Long, armyName As String, newRow As ListRow

    cibleStr = InputBox("Numéro du joueur (1-8) ?", "Lever une armée")
    If Not IsNumeric(cibleStr) Then Exit Sub
    joueur = CLng(cibleStr)
    If joueur < 1 Or joueur > 8 Then Exit Sub

    On Error Resume Next
    Set wsP = ThisWorkbook.Worksheets("P" & joueur)
    Set loP = wsP.ListObjects("P_" & joueur)
    Set wsA = ThisWorkbook.Worksheets("J" & joueur)
    Set loA = wsA.ListObjects("Armees_J" & joueur)
    On Error GoTo 0
    If loP Is Nothing Or loA Is Nothing Then MsgBox "Tables introuvables.": Exit Sub

    colNomP = loP.ListColumns("Nom").Index
    colPrenomP = loP.ListColumns("Prénom").Index
    colStatutP = loP.ListColumns("Statut").Index
    colDynP = loP.ListColumns("Dynastie").Index
    colAgeP = loP.ListColumns("Age").Index
    colArmeeP = loP.ListColumns("Armée").Index

    Dim frm As frmChoisirCommandant
    Set frm = New frmChoisirCommandant
    frm.Populate joueur
    frm.Show vbModal
    generalName = frm.SelectedName
    Unload frm
    If generalName = "" Then Exit Sub
    generalRow = FindRowByFullName(loP, generalName, colNomP, colPrenomP)
    If generalRow = 0 Then MsgBox "Personnage introuvable.": Exit Sub
    If Not IsAlive(loP.DataBodyRange.Cells(generalRow, colStatutP).Value) Then MsgBox "Décédé.": Exit Sub
    If Not IsNobleDyn(Trim$(CStr(loP.DataBodyRange.Cells(generalRow, colDynP).Value))) Then MsgBox "Non noble.": Exit Sub
    If Not IsNumeric(loP.DataBodyRange.Cells(generalRow, colAgeP).Value) Then MsgBox "Sans âge.": Exit Sub
    If CLng(loP.DataBodyRange.Cells(generalRow, colAgeP).Value) < ADULT_AGE Then MsgBox "Trop jeune.": Exit Sub
    If Trim$(CStr(loP.DataBodyRange.Cells(generalRow, colArmeeP).Value)) <> "" Then MsgBox "Déjà engagé.": Exit Sub

    cibleStr = InputBox("Puissance cible (entre " & PUISSANCE_GENERAL & " et 300) :", "Lever une armée")
    If Not IsNumeric(cibleStr) Then Exit Sub
    cible = CLng(cibleStr)
    If cible < PUISSANCE_GENERAL Or cible > 300 Then MsgBox "Cible hors plage.": Exit Sub

    armyName = "Armée " & (loA.ListRows.count + 1)
    Set newRow = loA.ListRows.Add
    newRow.Range.Cells(1, loA.ListColumns("Armée").Index).Value = armyName
    newRow.Range.Cells(1, loA.ListColumns("Général").Index).Value = generalName
    newRow.Range.Cells(1, loA.ListColumns("Cible").Index).Value = cible
    newRow.Range.Cells(1, loA.ListColumns("Puissance").Index).Value = PUISSANCE_GENERAL
    loP.DataBodyRange.Cells(generalRow, colArmeeP).Value = armyName

    Call RecruitForArmies(joueur)
    MsgBox armyName & " levée."
End Sub

Private Sub AppendArmyWarning(ByVal joueur As Long, ByVal armyName As String, ByVal detail As String)
    Dim wsJ As Worksheet, current As String
    On Error Resume Next
    Set wsJ = ThisWorkbook.Worksheets("J" & joueur)
    On Error GoTo 0
    If wsJ Is Nothing Then Exit Sub
    current = CStr(wsJ.Range("A35").Value)
    If current <> "" Then current = current & vbCrLf
    wsJ.Range("A35").Value = current & "? " & armyName & " : " & detail & ". Nomme un nouveau commandant."
    wsJ.Range("A35").WrapText = True
End Sub

Public Sub NommerCommandant()
    Dim joueur As Long, generalName As String, armyName As String, inp As String
    Dim wsA As Worksheet, loA As ListObject, wsP As Worksheet, loP As ListObject
    Dim colNomP As Long, colPrenomP As Long, colStatutP As Long, colDynP As Long
    Dim colAgeP As Long, colArmeeP As Long
    Dim colArmeeA As Long, colGenA As Long, colPuiA As Long
    Dim generalRow As Long, i As Long, j As Long, armyRow As Long, soldatCount As Long

    inp = InputBox("Numéro du joueur (1-8) ?", "Nommer un commandant")
    If Not IsNumeric(inp) Then Exit Sub
    joueur = CLng(inp)
    If joueur < 1 Or joueur > 8 Then Exit Sub

    On Error Resume Next
    Set wsP = ThisWorkbook.Worksheets("P" & joueur)
    Set loP = wsP.ListObjects("P_" & joueur)
    Set wsA = ThisWorkbook.Worksheets("J" & joueur)
    Set loA = wsA.ListObjects("Armees_J" & joueur)
    On Error GoTo 0
    If loP Is Nothing Or loA Is Nothing Then MsgBox "Tables introuvables.": Exit Sub

    colNomP = loP.ListColumns("Nom").Index
    colPrenomP = loP.ListColumns("Prénom").Index
    colStatutP = loP.ListColumns("Statut").Index
    colDynP = loP.ListColumns("Dynastie").Index
    colAgeP = loP.ListColumns("Age").Index
    colArmeeP = loP.ListColumns("Armée").Index
    colArmeeA = loA.ListColumns("Armée").Index
    colGenA = loA.ListColumns("Général").Index
    colPuiA = loA.ListColumns("Puissance").Index

    armyName = InputBox("Nom de l'armée (ex: Armée 1) :", "Nommer un commandant")
    If armyName = "" Then Exit Sub
    armyRow = 0
    For i = 1 To loA.DataBodyRange.Rows.count
        If StrComp(Trim$(CStr(loA.DataBodyRange.Cells(i, colArmeeA).Value)), armyName, vbTextCompare) = 0 Then
            armyRow = i: Exit For
        End If
    Next i
    If armyRow = 0 Then MsgBox "Armée introuvable.": Exit Sub
    If Trim$(CStr(loA.DataBodyRange.Cells(armyRow, colGenA).Value)) <> "" Then
        MsgBox "Cette armée a déjà un général.": Exit Sub
    End If

    Dim frm As frmChoisirCommandant
    Set frm = New frmChoisirCommandant
    frm.Populate joueur
    frm.Show vbModal
    generalName = frm.SelectedName
    Unload frm
    If generalName = "" Then Exit Sub
    generalRow = FindRowByFullName(loP, generalName, colNomP, colPrenomP)
    If generalRow = 0 Then MsgBox "Personnage introuvable.": Exit Sub
    If Not IsAlive(loP.DataBodyRange.Cells(generalRow, colStatutP).Value) Then MsgBox "Décédé.": Exit Sub
    If Not IsNobleDyn(Trim$(CStr(loP.DataBodyRange.Cells(generalRow, colDynP).Value))) Then MsgBox "Non noble.": Exit Sub
    If Not IsNumeric(loP.DataBodyRange.Cells(generalRow, colAgeP).Value) Then MsgBox "Sans âge.": Exit Sub
    If CLng(loP.DataBodyRange.Cells(generalRow, colAgeP).Value) < ADULT_AGE Then MsgBox "Trop jeune.": Exit Sub
    If Trim$(CStr(loP.DataBodyRange.Cells(generalRow, colArmeeP).Value)) <> "" Then MsgBox "Déjà engagé.": Exit Sub

    ' Assignment
    loA.DataBodyRange.Cells(armyRow, colGenA).Value = generalName
    loP.DataBodyRange.Cells(generalRow, colArmeeP).Value = armyName

    ' Recalcul immédiat de la puissance
    soldatCount = 0
    For j = 1 To loP.DataBodyRange.Rows.count
        If j <> generalRow Then
            If StrComp(Trim$(CStr(loP.DataBodyRange.Cells(j, colArmeeP).Value)), armyName, vbTextCompare) = 0 Then
                If IsAlive(loP.DataBodyRange.Cells(j, colStatutP).Value) Then
                    soldatCount = soldatCount + 1
                End If
            End If
        End If
    Next j
    loA.DataBodyRange.Cells(armyRow, colPuiA).Value = PUISSANCE_GENERAL + soldatCount * PUISSANCE_SOLDAT

    MsgBox armyName & " : " & generalName & " nommé commandant."
End Sub

Public Sub RetirerArmee()
    Dim joueur As Long, armyName As String, inp As String
    Dim wsA As Worksheet, loA As ListObject, wsP As Worksheet, loP As ListObject
    Dim colArmeeA As Long, colArmeeP As Long, colTitreP As Long, colStatutP As Long
    Dim armyRow As Long, i As Long
    Dim resp As VbMsgBoxResult

    inp = InputBox("Numéro du joueur (1-8) ?", "Retirer une armée")
    If Not IsNumeric(inp) Then Exit Sub
    joueur = CLng(inp)
    If joueur < 1 Or joueur > 8 Then Exit Sub

    On Error Resume Next
    Set wsP = ThisWorkbook.Worksheets("P" & joueur)
    Set loP = wsP.ListObjects("P_" & joueur)
    Set wsA = ThisWorkbook.Worksheets("J" & joueur)
    Set loA = wsA.ListObjects("Armees_J" & joueur)
    On Error GoTo 0
    If loP Is Nothing Or loA Is Nothing Then MsgBox "Tables introuvables.": Exit Sub
    If loA.DataBodyRange Is Nothing Then MsgBox "Aucune armée.": Exit Sub

    colArmeeA = loA.ListColumns("Armée").Index
    colArmeeP = loP.ListColumns("Armée").Index
    colTitreP = loP.ListColumns("Titre").Index
    colStatutP = loP.ListColumns("Statut").Index

    armyName = InputBox("Nom de l'armée à dissoudre (ex: Armée 1) :", "Retirer une armée")
    If armyName = "" Then Exit Sub

    armyRow = 0
    For i = 1 To loA.DataBodyRange.Rows.count
        If StrComp(Trim$(CStr(loA.DataBodyRange.Cells(i, colArmeeA).Value)), armyName, vbTextCompare) = 0 Then
            armyRow = i: Exit For
        End If
    Next i
    If armyRow = 0 Then MsgBox "Armée introuvable.": Exit Sub

    resp = MsgBox("Dissoudre " & armyName & " ?" & vbCrLf & _
                  "Les soldats vivants seront libérés et perdront leur titre Soldat.", _
                  vbYesNo + vbQuestion, "Confirmation")
    If resp <> vbYes Then Exit Sub

    ' Libérer tous les membres
    If Not loP.DataBodyRange Is Nothing Then
        For i = 1 To loP.DataBodyRange.Rows.count
            If StrComp(Trim$(CStr(loP.DataBodyRange.Cells(i, colArmeeP).Value)), armyName, vbTextCompare) = 0 Then
                loP.DataBodyRange.Cells(i, colArmeeP).Value = ""
                If IsAlive(loP.DataBodyRange.Cells(i, colStatutP).Value) Then
                    If StrComp(Trim$(CStr(loP.DataBodyRange.Cells(i, colTitreP).Value)), TITRE_SOLDAT, vbTextCompare) = 0 Then
                        loP.DataBodyRange.Cells(i, colTitreP).Value = TITRE_CHASSEUR
                    End If
                End If
            End If
        Next i
    End If

    ' Supprimer la ligne dans Armees_Jn
    loA.ListRows(armyRow).Delete

    MsgBox armyName & " dissoute."
End Sub

Public Sub AjouterPopulation()
    Dim joueur As Long, ville As String, nbAjout As Long
    Dim cultureCible As String, nomFamilleCible As String, dynastieCible As String
    Dim inp As String

    inp = InputBox("Numéro du joueur (1-8) ?", "Ajouter population")
    If Not IsNumeric(inp) Then Exit Sub
    joueur = CLng(inp): If joueur < 1 Or joueur > 8 Then Exit Sub

    ville = Trim$(InputBox("Nom de la ville :", "Ajouter population"))
    If ville = "" Then Exit Sub

    inp = InputBox("Nombre de personnages à ajouter :", "Ajouter population")
    If Not IsNumeric(inp) Then Exit Sub
    nbAjout = CLng(inp): If nbAjout < 1 Then Exit Sub

    cultureCible = Trim$(InputBox("Culture (vide = aléatoire parmi ville) :", "Ajouter population"))
    nomFamilleCible = Trim$(InputBox("Nom de famille (vide = aléatoire) :", "Ajouter population"))
    dynastieCible = Trim$(InputBox("Dynastie (vide = aléatoire) :", "Ajouter population"))

    Dim wsP As Worksheet, loP As ListObject, loNames As ListObject, loOrient As ListObject, loTraits As ListObject
    ' Tables fixes
    On Error Resume Next
    Set wsP = ThisWorkbook.Worksheets("P" & joueur)
    Set loP = wsP.ListObjects("P_" & joueur)
    On Error GoTo 0
    If loP Is Nothing Then MsgBox "Table P_" & joueur & " introuvable.": Exit Sub
    
    ' Nom du peuple depuis A1
    Dim peupleName As String
    peupleName = Trim$(CStr(ThisWorkbook.Worksheets("J" & joueur).Range("A1").Value))
    If peupleName = "" Then MsgBox "Aucun peuple défini en A1 de P" & joueur & ".": Exit Sub
    
    ' Table de noms du peuple dans BDD_pop
    On Error Resume Next
    Set loNames = ThisWorkbook.Worksheets("BDD_pop").ListObjects("noms_" & peupleName)
    On Error GoTo 0
    If loNames Is Nothing Then MsgBox "Table '" & peupleName & "' introuvable sur 'BDD_pop'.": Exit Sub
    
    On Error Resume Next
    Set loOrient = ThisWorkbook.Worksheets("JSON").ListObjects("Orientation")
    On Error GoTo 0
    If loOrient Is Nothing Then MsgBox "Table 'orientations' introuvable sur 'JSON'.": Exit Sub
    
    On Error Resume Next
    Set loTraits = ThisWorkbook.Worksheets("traits_genetiques").ListObjects("traits_genetiques")
    On Error GoTo 0
    If loTraits Is Nothing Then MsgBox "Table 'traits_genetiques' introuvable.": Exit Sub

    Dim colNom&, colPrenom&, colSexe&, colAge&, colCulture&, colDyn&, colVille&, colOrient&
    Dim colTr1&, colTr2&, colTr3&, colStatut&, colMariage&, colMere&, colPere&, colTitre&
    Dim colEducation&, colFec&, colAgeMax&, colArmee&, colPereBio&, colEnfantBatard&

    colNom = loP.ListColumns("Nom").Index: colPrenom = loP.ListColumns("Prénom").Index
    colSexe = loP.ListColumns("Sexe").Index: colAge = loP.ListColumns("Age").Index
    colCulture = loP.ListColumns("Culture").Index: colDyn = loP.ListColumns("Dynastie").Index
    colVille = loP.ListColumns("Ville").Index: colOrient = loP.ListColumns("Orientation").Index
    colTr1 = loP.ListColumns("Trait1").Index: colTr2 = loP.ListColumns("Trait2").Index
    colTr3 = loP.ListColumns("Trait3").Index: colStatut = loP.ListColumns("Statut").Index
    colMariage = loP.ListColumns("Mariage").Index: colMere = loP.ListColumns("Mère").Index
    colPere = loP.ListColumns("Père").Index: colAgeMax = loP.ListColumns("AgeMax").Index
    colFec = loP.ListColumns("Fécondité").Index: colArmee = loP.ListColumns("Armée").Index
    colPereBio = loP.ListColumns("PereBio").Index: colEnfantBatard = loP.ListColumns("EnfantBatard").Index
    On Error Resume Next
    colTitre = loP.ListColumns("Titre").Index
    colEducation = loP.ListColumns("Education").Index
    On Error GoTo 0

    Dim cityChars As Collection, i&, v$
    Set cityChars = New Collection
    If Not loP.DataBodyRange Is Nothing Then
        For i = 1 To loP.DataBodyRange.Rows.count
            v = Trim$(CStr(loP.DataBodyRange.Cells(i, colVille).Value))
            If StrComp(v, ville, vbTextCompare) = 0 Then cityChars.Add i
        Next i
    End If
    If cityChars.count = 0 Then MsgBox "La ville '" & ville & "' n'a aucune population existante.": Exit Sub

    Dim arrTraitStats As Variant, arrOrient As Variant
    arrTraitStats = loTraits.DataBodyRange.Value
    arrOrient = loOrient.DataBodyRange.Value

    Dim colTGName&, colTGWeight&, colTGDesc&, colTGLife&
    colTGName = loTraits.ListColumns("name").Index
    colTGWeight = loTraits.ListColumns("weight").Index
    On Error Resume Next
    colTGDesc = loTraits.ListColumns("description").Index
    colTGLife = loTraits.ListColumns("life_delta").Index
    On Error GoTo 0

    Dim colOName&, colOWeight&
    colOName = loOrient.ListColumns("Orientation sexuelle").Index
    colOWeight = loOrient.ListColumns("Nombre d'occurrences").Index
    Dim totalOrient As Double, k&, ww As Double
    For k = 1 To UBound(arrOrient, 1)
        If IsNumeric(arrOrient(k, colOWeight)) Then totalOrient = totalOrient + CDbl(arrOrient(k, colOWeight))
    Next k

    Dim colPrN&, colSeN&, sn$
    colPrN = loNames.ListColumns("Prénom").Index
    colSeN = loNames.ListColumns("Genre").Index
    Dim maleNames As New Collection, femaleNames As New Collection
    For i = 1 To loNames.DataBodyRange.Rows.count
        sn = LCase$(Left$(Trim$(CStr(loNames.DataBodyRange.Cells(i, colSeN).Value)), 1))
        If sn = "m" Then maleNames.Add i
        If sn = "f" Then femaleNames.Add i
    Next i

    Dim baseLife&: baseLife = 40
    Dim newRows As New Collection
    Dim n&, newRow As ListRow, sex$, firstName$, lastName$, dyn$, culture$
    Dim refR&, age&, orient$, trait1$, trait2$, trait3$, agemax&, r#, cum#, randIdx&, nameIdx&, kk&
    Dim allCultures As Collection
    Set allCultures = New Collection
    Dim loCulturesTable As ListObject
    On Error Resume Next
    Set loCulturesTable = ThisWorkbook.Worksheets("_Params").ListObjects("params_culture")
    On Error GoTo 0
    If Not loCulturesTable Is Nothing Then
        If Not loCulturesTable.DataBodyRange Is Nothing Then
            Dim ii As Long, vv As String
            For ii = 1 To loCulturesTable.DataBodyRange.Rows.count
                vv = Trim$(CStr(loCulturesTable.DataBodyRange.Cells(ii, 1).Value))
                If vv <> "" Then allCultures.Add vv
            Next ii
        End If
    End If

    For n = 1 To nbAjout
        Set newRow = loP.ListRows.Add

        If Rnd < 0.5 Then sex = "M" Else sex = "F"
        firstName = ""
        If sex = "M" And maleNames.count > 0 Then
            randIdx = Int(maleNames.count * Rnd) + 1
            nameIdx = maleNames(randIdx)
            firstName = CStr(loNames.DataBodyRange.Cells(nameIdx, colPrN).Value)
        ElseIf sex = "F" And femaleNames.count > 0 Then
            randIdx = Int(femaleNames.count * Rnd) + 1
            nameIdx = femaleNames(randIdx)
            firstName = CStr(loNames.DataBodyRange.Cells(nameIdx, colPrN).Value)
        End If

        If nomFamilleCible <> "" Then
            lastName = nomFamilleCible
        Else
            refR = cityChars(Int(cityChars.count * Rnd) + 1)
            lastName = Trim$(CStr(loP.DataBodyRange.Cells(refR, colNom).Value))
        End If
        If dynastieCible <> "" Then
            dyn = dynastieCible
        Else
            refR = cityChars(Int(cityChars.count * Rnd) + 1)
            dyn = Trim$(CStr(loP.DataBodyRange.Cells(refR, colDyn).Value))
        End If
        If cultureCible <> "" Then
            culture = cultureCible
        ElseIf allCultures.count > 0 Then
            culture = allCultures(Int(allCultures.count * Rnd) + 1)
        Else
            culture = ""
        End If

        age = Int(Rnd * 51)
        orient = ""
        If totalOrient > 0 Then
            r = Rnd * totalOrient: cum = 0
            For kk = 1 To UBound(arrOrient, 1)
                ww = 0
                If IsNumeric(arrOrient(kk, colOWeight)) Then ww = CDbl(arrOrient(kk, colOWeight))
                cum = cum + ww
                If r <= cum Then orient = CStr(arrOrient(kk, colOName)): Exit For
            Next kk
        End If

        trait1 = "": trait2 = "": trait3 = ""
        trait1 = PickRandomTraitName(arrTraitStats, colTGName, colTGWeight)
        If Rnd < 0.5 Then trait2 = PickRandomTraitName(arrTraitStats, colTGName, colTGWeight, GetBaseTraitName(trait1))
        If trait2 <> "" And Rnd < 0.3 Then trait3 = PickRandomTraitName(arrTraitStats, colTGName, colTGWeight, GetBaseTraitName(trait1), GetBaseTraitName(trait2))

        agemax = ComputeAgeMaxEx(baseLife, trait1, trait2, trait3, arrTraitStats, colTGName, colTGLife)

        With newRow.Range
            .Cells(1, colNom).Value = lastName
            .Cells(1, colPrenom).Value = firstName
            .Cells(1, colSexe).Value = sex
            .Cells(1, colAge).Value = age
            .Cells(1, colCulture).Value = culture
            .Cells(1, colDyn).Value = dyn
            .Cells(1, colVille).Value = ville
            .Cells(1, colOrient).Value = orient
            Call SetTraitCell(.Cells(1, colTr1), trait1, arrTraitStats, colTGName, colTGDesc)
            Call SetTraitCell(.Cells(1, colTr2), trait2, arrTraitStats, colTGName, colTGDesc)
            Call SetTraitCell(.Cells(1, colTr3), trait3, arrTraitStats, colTGName, colTGDesc)
            .Cells(1, colStatut).Value = "Sain"
            .Cells(1, colMariage).Value = ""
            .Cells(1, colMere).Value = ""
            .Cells(1, colPere).Value = ""
            .Cells(1, colAgeMax).Value = agemax
            .Cells(1, colArmee).Value = ""
            .Cells(1, colPereBio).Value = ""
            .Cells(1, colEnfantBatard).Value = ""
            If colTitre > 0 Then .Cells(1, colTitre).Value = ""
            If colEducation > 0 Then .Cells(1, colEducation).Value = ""
            .Cells(1, colFec).Value = 0
        End With

        newRows.Add loP.DataBodyRange.Rows.count
    Next n
    MsgBox nbAjout & " personnages ajoutés à " & ville & "."
End Sub


'--- La mort ---
Private Sub MarkCharacterDeath(lo As ListObject, ByVal i As Long, _
        ByVal colDyn As Long, ByVal colTitre As Long, ByVal colStatut As Long, _
        ByVal colMariage As Long, ByVal colNom As Long, ByVal colPrenom As Long, _
        ByVal colAge As Long, ByVal colSexe As Long, ByVal colCulture As Long, _
        ByRef stats As TurnStats, Optional ByVal cause As String = "")
    Dim deathDyn As String, deathTitre As String
    deathDyn = Trim$(CStr(lo.DataBodyRange.Cells(i, colDyn).Value))
    deathTitre = ""
    If colTitre > 0 Then deathTitre = Trim$(CStr(lo.DataBodyRange.Cells(i, colTitre).Value))
    stats.nbMorts = stats.nbMorts + 1
    If cause = "maladie" Then
        stats.nbMortsMaladie = stats.nbMortsMaladie + 1
    End If
    If IsNobleDyn(deathDyn) Then
        stats.nbMortsNobles = stats.nbMortsNobles + 1
        Call IncDictKey(stats.mortsNoblesByDyn, deathDyn)
    End If
    If deathTitre <> "" Then
        stats.nbMortsTitres = stats.nbMortsTitres + 1
        Call IncDictKey(stats.mortsTitresByTitre, deathTitre)
    End If
    lo.DataBodyRange.Cells(i, colStatut).Value = "Décédé"
    Call ClearSpouseMarriage(lo, i, colMariage, colNom, colPrenom)
    If colTitre > 0 Then
        If StrComp(deathTitre, TITRE_DIRIGEANT, vbTextCompare) = 0 Then
            Call HandleDirigeantSuccession(lo, colTitre, colDyn, colAge, colStatut, colSexe, colCulture, stats)
        End If
    End If
End Sub

Private Sub GetCityHealthModifiers(ByVal joueur As Long, loP As ListObject, _
        ByVal cityName As String, ByVal colVille As Long, _
        ByRef contractMod As Double, ByRef cureMod As Double)
    Dim wsJ As Worksheet
    Dim bcol As Long, r As Long, b As String
    contractMod = 0: cureMod = 0

    On Error Resume Next
    Set wsJ = ThisWorkbook.Worksheets("J" & joueur)
    On Error GoTo 0
    If wsJ Is Nothing Then Exit Sub

    ' --- Effets locaux : bâtiments de la ville du personnage ---
    If cityName <> "" Then
        bcol = FindCityBuildingsColumn(wsJ, cityName)
        If bcol > 0 Then
        Dim lastR As Long
        lastR = wsJ.Cells(wsJ.Rows.count, bcol).End(xlUp).Row
        For r = CITY_HEADER_ROW + 1 To lastR
            b = Trim$(CStr(wsJ.Cells(r, bcol).Value))
            If b <> "" Then
                Select Case True
                    Case StrComp(b, BAT_HERBORISTERIE, vbTextCompare) = 0
                        contractMod = contractMod + HERBO_CONTRACT
                        cureMod = cureMod + HERBO_CURE
                    Case StrComp(b, BAT_CLINIQUE, vbTextCompare) = 0
                        contractMod = contractMod + CLINIQUE_CONTRACT
                        cureMod = cureMod + CLINIQUE_CURE
                    Case StrComp(b, BAT_HOPITAL, vbTextCompare) = 0
                        contractMod = contractMod + HOPITAL_CONTRACT
                        cureMod = cureMod + HOPITAL_CURE
                    Case StrComp(b, BAT_GUILDE_MEDECINS, vbTextCompare) = 0
                        contractMod = contractMod + HOPITAL_CONTRACT
                        cureMod = cureMod + HOPITAL_CURE
                End Select
            End If
        Next r
        End If
    End If

    ' --- Effet global : une Guilde des Médecins n'importe où soigne partout ---
    If PlayerHasBuildingAnywhere(wsJ, BAT_GUILDE_MEDECINS) Then
        cureMod = cureMod + GUILDE_CURE_GLOBAL
    End If
End Sub

Private Function PlayerHasBuildingAnywhere(wsJ As Worksheet, ByVal buildingName As String) As Boolean
    Dim f As Range
    On Error Resume Next
    Set f = wsJ.UsedRange.Find(What:=buildingName, LookIn:=xlValues, _
                               LookAt:=xlWhole, MatchCase:=False)
    On Error GoTo 0
    PlayerHasBuildingAnywhere = Not (f Is Nothing)
End Function

' --- Pression culturelle par tourisme ---
Private Function BuildCulturePressure() As Object
    Dim d As Object, j As Long, wsJ As Worksheet
    Dim cult As String, tourism As Double
    Set d = CreateObject("Scripting.Dictionary")
    For j = 1 To 8
        On Error Resume Next
        Set wsJ = ThisWorkbook.Worksheets("J" & j)
        On Error GoTo 0
        If Not wsJ Is Nothing Then
            cult = Trim$(CStr(wsJ.Range("A2").Value))
            tourism = 0
            If IsNumeric(wsJ.Range("B29").Value) Then tourism = CDbl(wsJ.Range("B29").Value)
            If cult <> "" Then
                If d.exists(cult) Then d(cult) = d(cult) + tourism Else d.Add cult, tourism
            End If
        End If
        Set wsJ = Nothing
    Next j
    Set BuildCulturePressure = d
End Function

' --- Pression culturelle dans une ville pour pondération locale ---
Private Function CountCulturesInCity(loP As ListObject, ByVal cityName As String, _
                                      ByVal colVille As Long, ByVal colCulture As Long, _
                                      ByVal colStatut As Long) As Object
    Dim d As Object, k As Long, v As String, c As String
    Set d = CreateObject("Scripting.Dictionary")
    cityName = Trim$(cityName)
    If loP.DataBodyRange Is Nothing Then Set CountCulturesInCity = d: Exit Function
    For k = 1 To loP.DataBodyRange.Rows.count
        If IsAlive(loP.DataBodyRange.Cells(k, colStatut).Value) Then
            v = Trim$(CStr(loP.DataBodyRange.Cells(k, colVille).Value))
            If StrComp(v, cityName, vbTextCompare) = 0 Then
                c = Trim$(CStr(loP.DataBodyRange.Cells(k, colCulture).Value))
                If c <> "" Then
                    If d.exists(c) Then d(c) = d(c) + 1 Else d.Add c, 1
                End If
            End If
        End If
    Next k
    Set CountCulturesInCity = d
End Function

' --- Tirage pondéré d'une culture  ---
Private Function PickWeightedCulture(pressure As Object, localCounts As Object) As String
    Dim total As Double, r As Double, cum As Double, k As Variant, w As Double
    Dim allKeys As Object
    Set allKeys = CreateObject("Scripting.Dictionary")

    ' Union des cultures (touristiques + locales)
    For Each k In pressure.keys
        If Not allKeys.exists(k) Then allKeys.Add k, 0#
    Next k
    For Each k In localCounts.keys
        If Not allKeys.exists(k) Then allKeys.Add k, 0#
    Next k

    ' Poids = tourisme global + POIDS_VILLE × présence locale
    For Each k In allKeys.keys
        w = 0
        If pressure.exists(k) Then w = w + pressure(k)
        If localCounts.exists(k) Then w = w + POIDS_VILLE_CULTURE * localCounts(k)
        allKeys(k) = w
        total = total + w
    Next k

    If total <= 0 Then Exit Function
    r = Rnd * total
    cum = 0
    For Each k In allKeys.keys
        cum = cum + allKeys(k)
        If r <= cum Then PickWeightedCulture = CStr(k): Exit Function
    Next k
End Function

' --- Changement individuel de culture  ---
Public Sub ApplyCultureInfluence(ByVal joueur As Long, loP As ListObject, _
                                  ByVal colVille As Long, ByVal colCulture As Long, _
                                  ByVal colStatut As Long, ByVal colTitre As Long, _
                                  ByRef stats As TurnStats)
    Dim pressure As Object, i As Long, cityName As String
    Dim localCounts As Object, newCult As String, oldCult As String
    Dim cityCache As Object

    If loP.DataBodyRange Is Nothing Then Exit Sub
    Set pressure = BuildCulturePressure()
    If pressure.count = 0 Then Exit Sub

    ' Cache des comptages par ville (évite de recompter pour chaque habitant)
    Set cityCache = CreateObject("Scripting.Dictionary")

    For i = 1 To loP.DataBodyRange.Rows.count
        If Not IsAlive(loP.DataBodyRange.Cells(i, colStatut).Value) Then GoTo NextC
        ' Dirigeant exclu
        If colTitre > 0 Then
            If StrComp(Trim$(CStr(loP.DataBodyRange.Cells(i, colTitre).Value)), TITRE_DIRIGEANT, vbTextCompare) = 0 Then GoTo NextC
        End If

        If Rnd < PROBA_CHANGEMENT_CULTURE Then
            cityName = Trim$(CStr(loP.DataBodyRange.Cells(i, colVille).Value))
            If Not cityCache.exists(cityName) Then
                cityCache.Add cityName, CountCulturesInCity(loP, cityName, colVille, colCulture, colStatut)
            End If
            Set localCounts = cityCache(cityName)

            oldCult = Trim$(CStr(loP.DataBodyRange.Cells(i, colCulture).Value))
            newCult = PickWeightedCulture(pressure, localCounts)
            If newCult <> "" And StrComp(newCult, oldCult, vbTextCompare) <> 0 Then
                loP.DataBodyRange.Cells(i, colCulture).Value = newCult
                stats.nbConversions = stats.nbConversions + 1
                Call IncDictKey(stats.conversionsByCulture, newCult)
            End If
        End If
NextC:
    Next i

    ' Recalcul des cultures majoritaires APRÈS les changements
    Call UpdateCityCultures(joueur, loP, colVille, colCulture, colStatut)
End Sub

' --- Calcul des cultures majoritaires des villes ---
Private Sub UpdateCityCultures(ByVal joueur As Long, loP As ListObject, _
                                ByVal colVille As Long, ByVal colCulture As Long, _
                                ByVal colStatut As Long)
    Dim wsJ As Worksheet, b As Long, nameCol As Long, cultCol As Long
    Dim cityName As String, counts As Object, k As Variant, bestC As String, bestN As Double

    On Error Resume Next
    Set wsJ = ThisWorkbook.Worksheets("J" & joueur)
    On Error GoTo 0
    If wsJ Is Nothing Then Exit Sub

    For b = 0 To MAX_VILLES - 1
        nameCol = FIRST_VILLE_NAME_COL + b * 4
        cultCol = nameCol + 2
        cityName = Trim$(CStr(wsJ.Cells(VILLE_NAME_ROW, nameCol).Value))
        If cityName <> "" Then
            Set counts = CountCulturesInCity(loP, cityName, colVille, colCulture, colStatut)
            bestC = "": bestN = -1
            For Each k In counts.keys
                If counts(k) > bestN Then bestN = counts(k): bestC = CStr(k)
            Next k
            If bestC <> "" Then wsJ.Cells(CULTURE_ROW, cultCol).Value = bestC
        End If
    Next b
End Sub


'##### ----- FONCTIONS DE TEST ----- #####'

Public Sub TestBatimentsSante()
    Dim wsJ As Worksheet, bcol As Long, r As Long
    Set wsJ = ThisWorkbook.Worksheets("J1")
    bcol = FindCityBuildingsColumn(wsJ, "1")
    MsgBox "Colonne bâtiments = " & bcol & " | CITY_HEADER_ROW = " & CITY_HEADER_ROW
    If bcol = 0 Then Exit Sub
    Dim s As String
    For r = CITY_HEADER_ROW + 1 To CITY_HEADER_ROW + 8
        s = s & r & " : [" & CStr(wsJ.Cells(r, bcol).Value) & "]" & vbCrLf
    Next r
    MsgBox s
End Sub

Public Sub TestEffetsSante()
    Dim cm As Double, qm As Double
    Call GetCityHealthModifiers(1, ThisWorkbook.Worksheets("P1").ListObjects("P_1"), _
                                "1", 0, cm, qm)
    MsgBox "contractMod = " & cm & vbCrLf & "cureMod = " & qm
End Sub

Public Sub TestCulturePressure()
    Dim p As Object, k As Variant, s As String
    Set p = BuildCulturePressure()
    s = "Cultures sous pression : " & p.count & vbCrLf
    For Each k In p.keys
        s = s & k & " = " & p(k) & vbCrLf
    Next k
    MsgBox s
End Sub

Public Sub TestConversion()
    Dim lo As ListObject
    Dim st As TurnStats
    Set lo = ThisWorkbook.Worksheets("P1").ListObjects("P_1")
    Set st.conversionsByCulture = CreateObject("Scripting.Dictionary")

    Dim colVille&, colCulture&, colStatut&, colTitre&
    colVille = lo.ListColumns("Ville").Index
    colCulture = lo.ListColumns("Culture").Index
    colStatut = lo.ListColumns("Statut").Index
    colTitre = lo.ListColumns("Titre").Index

    Call ApplyCultureInfluence(1, lo, colVille, colCulture, colStatut, colTitre, st)
    MsgBox "Conversions : " & st.nbConversions & vbCrLf & FormatDictionary(st.conversionsByCulture)
End Sub


'================================================================
'  TAXES PAR VILLE
'================================================================

' Lit le niveau de taxes d'une ville (ligne TAXES_ROW, 4e case du bloc ville : nameCol + TAXES_COL_OFFSET).
' Retourne "Moyenne" si vide ou ville inconnue.
Public Function GetCityTaxLevel(ByVal joueur As Long, ByVal villeName As String) As String
    Dim wsJ As Worksheet
    Dim b As Long, nameCol As Long
    Dim cityName As String, lvl As String

    GetCityTaxLevel = TAX_NORMALES
    villeName = Trim$(villeName)
    If villeName = "" Then Exit Function

    On Error Resume Next
    Set wsJ = ThisWorkbook.Worksheets("J" & joueur)
    On Error GoTo 0
    If wsJ Is Nothing Then Exit Function

    For b = 0 To MAX_VILLES - 1
        nameCol = FIRST_VILLE_NAME_COL + b * 4
        cityName = Trim$(CStr(wsJ.Cells(VILLE_NAME_ROW, nameCol).Value))
        If StrComp(cityName, villeName, vbTextCompare) = 0 Then
            lvl = Trim$(CStr(wsJ.Cells(TAXES_ROW, nameCol + TAXES_COL_OFFSET).Value))
            If lvl <> "" Then GetCityTaxLevel = lvl
            Exit Function
        End If
    Next b
End Function

' Facteur de conception selon les taxes de la ville de la mère
Public Function GetCityBirthTaxFactor(ByVal joueur As Long, ByVal villeName As String) As Double
    GetCityBirthTaxFactor = 1
    Select Case LCase$(GetCityTaxLevel(joueur, villeName))
        Case "faible":           GetCityBirthTaxFactor = TAX_NAISS_FAIBLES
        Case "forte":            GetCityBirthTaxFactor = TAX_NAISS_HAUTES
    End Select
End Function

' Facteur d'or selon les taxes de la ville
Public Function GetCityGoldTaxFactor(ByVal joueur As Long, ByVal villeName As String) As Double
    GetCityGoldTaxFactor = 1
    Select Case LCase$(GetCityTaxLevel(joueur, villeName))
        Case "faible":           GetCityGoldTaxFactor = TAX_OR_FAIBLES
        Case "forte":            GetCityGoldTaxFactor = TAX_OR_HAUTES
    End Select
End Function

' Facteur d'or du joueur : moyenne des taxes pondérée par la population vivante de chaque ville
Public Function GetPlayerGoldTaxFactor(ByVal joueur As Long) As Double
    Dim wsJ As Worksheet, loP As ListObject
    Dim colVille As Long, colStatut As Long
    Dim b As Long, nameCol As Long, cityName As String
    Dim pop As Long, totalPop As Long
    Dim weighted As Double

    GetPlayerGoldTaxFactor = 1
    On Error Resume Next
    Set wsJ = ThisWorkbook.Worksheets("J" & joueur)
    Set loP = ThisWorkbook.Worksheets("P" & joueur).ListObjects("P_" & joueur)
    On Error GoTo 0
    If wsJ Is Nothing Or loP Is Nothing Then Exit Function
    If loP.DataBodyRange Is Nothing Then Exit Function

    colVille = loP.ListColumns("Ville").Index
    colStatut = loP.ListColumns("Statut").Index

    For b = 0 To MAX_VILLES - 1
        nameCol = FIRST_VILLE_NAME_COL + b * 4
        cityName = Trim$(CStr(wsJ.Cells(VILLE_NAME_ROW, nameCol).Value))
        If cityName <> "" Then
            pop = CountAliveInCity(loP, cityName, colVille, colStatut)
            weighted = weighted + pop * GetCityGoldTaxFactor(joueur, cityName)
            totalPop = totalPop + pop
        End If
    Next b
    If totalPop > 0 Then GetPlayerGoldTaxFactor = weighted / totalPop
End Function

Public Function CountAliveInCity(loP As ListObject, ByVal villeName As String, _
                                 ByVal colVille As Long, ByVal colStatut As Long) As Long
    Dim i As Long
    If loP.DataBodyRange Is Nothing Then Exit Function
    For i = 1 To loP.DataBodyRange.Rows.count
        If IsAlive(loP.DataBodyRange.Cells(i, colStatut).Value) Then
            If StrComp(Trim$(CStr(loP.DataBodyRange.Cells(i, colVille).Value)), villeName, vbTextCompare) = 0 Then
                CountAliveInCity = CountAliveInCity + 1
            End If
        End If
    Next i
End Function

' À lancer une seule fois : installe le menu Faible/Moyenne/Forte
' dans chaque bloc ville de J1..J8 et met "Moyenne" par défaut.
Public Sub InstallerMenusTaxes()
    Dim j As Long, b As Long, nameCol As Long
    Dim wsJ As Worksheet, c As Range
    Dim sep As String, valCell As String

    ' Séparateur de liste régional d'Excel ("," ou ";" selon la configuration)
    sep = CStr(Application.International(xlListSeparator))

    For j = 1 To 8
        On Error Resume Next
        Set wsJ = ThisWorkbook.Worksheets("J" & j)
        On Error GoTo 0
        If Not wsJ Is Nothing Then
            For b = 0 To MAX_VILLES - 1
                nameCol = FIRST_VILLE_NAME_COL + b * 4
                If Trim$(CStr(wsJ.Cells(VILLE_NAME_ROW, nameCol).Value)) <> "" Then
                    Set c = wsJ.Cells(TAXES_ROW, nameCol + TAXES_COL_OFFSET)
                    On Error Resume Next
                    c.Validation.Delete
                    c.Validation.Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, _
                        Operator:=xlBetween, Formula1:="Faible" & sep & "Moyenne" & sep & "Forte"
                    c.Validation.IgnoreBlank = True
                    c.Validation.InCellDropdown = True
                    ' Valeur par défaut : "Moyenne" si vide ou valeur obsolète
                    valCell = Trim$(CStr(c.Value))
                    If StrComp(valCell, "Faible", vbTextCompare) <> 0 _
                       And StrComp(valCell, "Moyenne", vbTextCompare) <> 0 _
                       And StrComp(valCell, "Forte", vbTextCompare) <> 0 Then
                        c.Value = TAX_NORMALES
                    End If
                    On Error GoTo 0
                End If
            Next b
        End If
        Set wsJ = Nothing
    Next j
    MsgBox "Menus de taxes installés (ligne " & TAXES_ROW & ", 4e case du bloc de chaque ville)."
End Sub

'================================================================
'  AGEMAX MULTI-TRAITS
'================================================================

' AgeMax prenant en compte les life_delta des 3 traits (et non plus du seul Trait1)
Public Function ComputeAgeMaxEx(ByVal baseLife As Long, _
                                ByVal t1 As String, ByVal t2 As String, ByVal t3 As String, _
                                traitStats As Variant, _
                                ByVal colName As Long, ByVal colDelta As Long) As Long
    Dim delta As Long
    delta = GetLifeDeltaForTrait(GetBaseTraitName(t1), traitStats, colName, colDelta) _
          + GetLifeDeltaForTrait(GetBaseTraitName(t2), traitStats, colName, colDelta) _
          + GetLifeDeltaForTrait(GetBaseTraitName(t3), traitStats, colName, colDelta)
    ComputeAgeMaxEx = baseLife + Int(40 * Rnd) + delta
End Function

'================================================================
'  MIGRATION DES ENFANTS SANS ÉDUCATION
'================================================================

' Un mineur sans éducation, dont la ville n'a pas de Professeur,
' a MIGRATION_PROBA % de chance par tour de partir vers une ville
' du même joueur où des Professeurs offrent une éducation.
Public Sub MaybeMigrateUneducatedChild(lo As ListObject, ByVal rowIndex As Long, _
                                       ByVal joueur As Long, _
                                       ByVal colVille As Long, ByVal colTitre As Long, _
                                       ByVal colAge As Long, ByVal colEducation As Long, _
                                       ByVal colStatut As Long)
    Dim villeActuelle As String
    Dim seen As Object, cities As Collection
    Dim i As Long, v As String, cible As String
    Dim ageNow As Long
    Dim colT1 As Long, colT2 As Long, colT3 As Long

    If lo.DataBodyRange Is Nothing Then Exit Sub
    If colVille <= 0 Or colEducation <= 0 Or colTitre <= 0 Then Exit Sub

    ' Déjà éduqué ou adulte : pas de migration
    If Trim$(CStr(lo.DataBodyRange.Cells(rowIndex, colEducation).Value)) <> "" Then Exit Sub
    If IsNumeric(lo.DataBodyRange.Cells(rowIndex, colAge).Value) Then
        ageNow = CLng(lo.DataBodyRange.Cells(rowIndex, colAge).Value)
    End If
    If ageNow >= ADULT_AGE Then Exit Sub

    ' Les "Obstinés" ne migrent pas : l'éducation ne les tentera jamais
    On Error Resume Next
    colT1 = lo.ListColumns("Trait1").Index
    colT2 = lo.ListColumns("Trait2").Index
    colT3 = lo.ListColumns("Trait3").Index
    On Error GoTo 0
    If CharacterHasTrait(lo, rowIndex, colT1, colT2, colT3, TRAIT_NO_EDUC) Then Exit Sub

    ' La ville actuelle éduque-t-elle déjà ? Si oui, pas besoin de partir
    villeActuelle = Trim$(CStr(lo.DataBodyRange.Cells(rowIndex, colVille).Value))
    If CountProfesseursInCity(lo, villeActuelle, colVille, colTitre, colStatut) > 0 Then Exit Sub

    If Rnd >= MIGRATION_PROBA Then Exit Sub

    ' Villes candidates du même joueur : avec Professeur ET éducation disponible
    Set seen = CreateObject("Scripting.Dictionary")
    Set cities = New Collection
    For i = 1 To lo.DataBodyRange.Rows.count
        v = Trim$(CStr(lo.DataBodyRange.Cells(i, colVille).Value))
        If v <> "" And StrComp(v, villeActuelle, vbTextCompare) <> 0 _
           And Not seen.exists(LCase$(v)) Then
            seen.Add LCase$(v), True
            If CountProfesseursInCity(lo, v, colVille, colTitre, colStatut) > 0 Then
                If GetEducationsAvailableInCity(lo, v, colVille, colTitre, colEducation, colStatut).count > 0 Then
                    cities.Add v
                End If
            End If
        End If
    Next i
    If cities.count = 0 Then Exit Sub

    cible = cities(Int(cities.count * Rnd) + 1)
    lo.DataBodyRange.Cells(rowIndex, colVille).Value = cible
End Sub

'================================================================
'  GAINS DE POPULATION PAR VILLE (titres des habitants vivants)
'================================================================
' Pour chaque ville : additionne Valeur1/Ressource1 et Valeur2/Ressource2
' des titres des habitants vivants de la ville, applique les taxes de la
' ville (Or et Nourriture), soustrait la consommation (1 nourriture par
' habitant vivant, non taxée), AFFICHE la prévision dans les cases de gains
' du bloc ville (F69:F71 et H69:H70) et crédite directement les stocks.
' Lecture des quantités via CellToDouble (Val() casserait les décimales
' en réglage français : Val("0,5") = 0).

Public Sub CalculerGainsPopulation(ByVal joueur As Long)
    Dim wsJ As Worksheet, loP As ListObject, loT As ListObject
    Dim colTitre As Long, colStatut As Long, colVille As Long
    Dim cTName As Long, cRes1 As Long, cQte1 As Long, cRes2 As Long, cQte2 As Long
    Dim b As Long, nameCol As Long, i As Long, k As Long
    Dim cityName As String, titre As String
    Dim taxF As Double
    Dim nbVivants As Long
    Dim cityGains As Object, totals As Object
    Dim key As Variant
    Dim cOff As Long, rw As Long

    On Error Resume Next
    Set wsJ = ThisWorkbook.Worksheets("J" & joueur)
    Set loP = ThisWorkbook.Worksheets("P" & joueur).ListObjects("P_" & joueur)
    Set loT = ThisWorkbook.Worksheets("Titres").ListObjects("Titres")
    On Error GoTo 0
    If wsJ Is Nothing Or loP Is Nothing Or loT Is Nothing Then Exit Sub
    If loP.DataBodyRange Is Nothing Or loT.DataBodyRange Is Nothing Then Exit Sub

    On Error Resume Next
    colTitre = loP.ListColumns("Titre").Index
    colStatut = loP.ListColumns("Statut").Index
    colVille = loP.ListColumns("Ville").Index
    cTName = loT.ListColumns("Titre").Index
    cRes1 = loT.ListColumns("Ressource1").Index
    cQte1 = loT.ListColumns("Valeur1").Index
    cRes2 = loT.ListColumns("Ressource2").Index
    cQte2 = loT.ListColumns("Valeur2").Index
    On Error GoTo 0
    If colTitre = 0 Or colStatut = 0 Or colVille = 0 _
       Or cTName = 0 Or cRes1 = 0 Or cQte1 = 0 Then Exit Sub

    Set totals = CreateObject("Scripting.Dictionary")

    For b = 0 To MAX_VILLES - 1
        nameCol = FIRST_VILLE_NAME_COL + b * 4
        cityName = Trim$(CStr(wsJ.Cells(VILLE_NAME_ROW, nameCol).Value))
        If cityName <> "" Then
            Set cityGains = CreateObject("Scripting.Dictionary")
            nbVivants = 0

            ' 1) Gains bruts : titres des habitants vivants de cette ville (+ comptage des vivants)
            For i = 1 To loP.DataBodyRange.Rows.count
                If IsAlive(loP.DataBodyRange.Cells(i, colStatut).Value) Then
                    If StrComp(Trim$(CStr(loP.DataBodyRange.Cells(i, colVille).Value)), cityName, vbTextCompare) = 0 Then
                        nbVivants = nbVivants + 1
                        titre = Trim$(CStr(loP.DataBodyRange.Cells(i, colTitre).Value))
                        If titre <> "" Then
                            For k = 1 To loT.DataBodyRange.Rows.count
                                If StrComp(Trim$(CStr(loT.DataBodyRange.Cells(k, cTName).Value)), titre, vbTextCompare) = 0 Then
                                    AddYieldToDict cityGains, CStr(loT.DataBodyRange.Cells(k, cRes1).Value), CellToDouble(loT.DataBodyRange.Cells(k, cQte1).Value)
                                    If cRes2 > 0 And cQte2 > 0 Then
                                        AddYieldToDict cityGains, CStr(loT.DataBodyRange.Cells(k, cRes2).Value), CellToDouble(loT.DataBodyRange.Cells(k, cQte2).Value)
                                    End If
                                    Exit For
                                End If
                            Next k
                        End If
                    End If
                End If
            Next i

            ' 2) Taxes de la ville : uniquement l'Or et la Nourriture
            taxF = GetCityGoldTaxFactor(joueur, cityName)
            MultiplyYieldInDict cityGains, "Or", taxF
            MultiplyYieldInDict cityGains, "Nourriture", taxF

            ' 3) Consommation : chaque habitant vivant mange 1 nourriture (non taxée)
            AddYieldToDict cityGains, "Nourriture", -CONSO_NOURR_PAR_HAB * nbVivants

            ' 4) Affichage dans les cases de gains + cumul du joueur
            For Each key In cityGains.keys
                If GetGainsCell(CStr(key), cOff, rw) Then
                    wsJ.Cells(rw, nameCol + cOff).Value = cityGains(key)
                End If
                AddYieldToDict totals, CStr(key), CDbl(cityGains(key))
            Next key
        End If
    Next b

    ' 5) Crédit direct des stocks (lignes 18-28, colonne B)
    If GAINS_CREDITE_STOCK Then
        For Each key In totals.keys
            AddToResourceStock wsJ, CStr(key), CDbl(totals(key))
        Next key
    End If
End Sub

' Ajoute un gain dans un dictionnaire (clé insensible à la casse)
Private Sub AddYieldToDict(d As Object, ByVal resName As String, ByVal qte As Double)
    Dim key As Variant
    resName = Trim$(resName)
    If resName = "" Or qte = 0 Then Exit Sub
    For Each key In d.keys
        If StrComp(CStr(key), resName, vbTextCompare) = 0 Then
            d(key) = CDbl(d(key)) + qte
            Exit Sub
        End If
    Next key
    d.Add resName, qte
End Sub

' Multiplie le gain d'une ressource (clé insensible à la casse)
Private Sub MultiplyYieldInDict(d As Object, ByVal resName As String, ByVal factor As Double)
    Dim key As Variant
    For Each key In d.keys
        If StrComp(CStr(key), resName, vbTextCompare) = 0 Then
            d(key) = CDbl(d(key)) * factor
            Exit Sub
        End If
    Next key
End Sub

' Lecture numérique fiable d'une cellule (remplace Val : Val("0,5") = 0 en réglage français !)
Private Function CellToDouble(ByVal v As Variant) As Double
    If IsNumeric(v) Then CellToDouble = CDbl(v)
End Function

' Emplacement d'affichage d'un gain dans le bloc ville : (décalage colonne, ligne)
Private Function GetGainsCell(ByVal resName As String, ByRef colOffset As Long, ByRef rw As Long) As Boolean
    Select Case LCase$(Trim$(resName))
        Case "science":              colOffset = 1: rw = GAINS_ROW       ' F69
        Case "tourisme":             colOffset = 1: rw = GAINS_ROW + 1   ' F70
        Case "garnison":             colOffset = 1: rw = GAINS_ROW + 2   ' F71
        Case "or":                   colOffset = 3: rw = GAINS_ROW       ' H69
        Case "nourriture":           colOffset = 3: rw = GAINS_ROW + 1   ' H70
        Case Else: Exit Function
    End Select
    GetGainsCell = True
End Function

' Ajoute un montant au stock d'une ressource (nom en col A, stock en col B, lignes 18-28)
Public Sub AddToResourceStock(wsJ As Worksheet, ByVal resName As String, ByVal montant As Double)
    Dim r As Long
    For r = 18 To 28
        If StrComp(Trim$(CStr(wsJ.Cells(r, "A").Value)), resName, vbTextCompare) = 0 Then
            wsJ.Cells(r, "B").Value = wsJ.Cells(r, "B").Value + montant
            Exit Sub
        End If
    Next r
End Sub
