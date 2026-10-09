'============================================================
' SECTION : 1. Constantes à ajouter en haut du module « Personnages »
'============================================================
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
Private Const MIGRATION_PROBA As Double = 0.15      ' chance par tour

'============================================================
' SECTION : 2. Nouvelles procédures à ajouter dans le module « Personnages »
'============================================================
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

'============================================================
' SECTION : 3.1 `TryEducateMinor` (module « Personnages »)
'============================================================
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

'============================================================
' SECTION : 3.2 `PickRandomEligibleForProfesseur` (module « Personnages »)
'============================================================
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

'============================================================
' SECTION : 3.3 `PersonnagesPourJoueur` (module « Personnages ») — version complète
'============================================================
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
                            .Cells(1, colMere).Value = lo.DataBodyRange.Cells(i, colPrenom).Value & " " & lo.DataBodyRange.Cells(i, colNom).Value
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

'============================================================
' SECTION : 3.4 `FinDeTour` (module ressources/fin de tour) — version complète
'============================================================
Sub FinDeTour()
    Dim joueurs      As Variant, nomJoueur As Variant
    Dim wsAcc        As Worksheet, wsSum   As Worksheet, wsRef As Worksheet
    Dim wsJ          As Worksheet
    Dim lastRowJ     As Long, lastRowRes   As Long
    Dim r            As Long, cCol         As Long
    Dim turnNum      As Long, sumCol       As Long
    Dim seasonIdx    As Long, seasonName   As String
    Dim prodRowEte   As Variant
    Dim prodFood     As Double, prodSummer As Double
    Dim foodRow      As Variant, stockFood As Double
    Dim resourceName As String, resourceRow As Variant
    Dim summaryVal   As Double
    Dim headerRowRes As Variant, playerPos As Variant
    Dim playersCount As Long
    Dim i            As Long
    Dim jNum         As Long, taxFactor As Double
    
    ' — 0) Configuration générale
    'Const rowHab    As Long = 69    ' ligne des Habitants sur chaque feuille Jx
    'Const rowCroiss As Long = 70    ' ligne de la Croissance sur chaque feuille Jx
    Const colStart  As Long = 6     ' première colonne du bloc ville (F = 6)
    Const colStep   As Long = 4     ' largeur de chaque bloc ville
    Const nbVilles  As Long = 7     ' nombre de blocs villes
    
    joueurs = Array("J1", "J2", "J3", "J4", "J5", "J6", "J7", "J8")
    playersCount = UBound(joueurs) + 1
    
    Set wsAcc = ThisWorkbook.Sheets("Accueil")
    Set wsRef = ThisWorkbook.Sheets("J1")   ' référentiel pour la liste des ressources
    
    ' — 1) Tour & Saison
    turnNum = wsAcc.Range("C1").Value
    seasonName = wsAcc.Range("F1").Value
    
    ' — 2) Mise à jour des ressources (col B += col C)
    For Each nomJoueur In joueurs
        Set wsJ = ThisWorkbook.Sheets(nomJoueur)
        jNum = CLng(Mid$(CStr(nomJoueur), 2))    ' --- NOUVEAU : "J3" -> 3 (pour les taxes)
        CalculerGainsPopulation jNum            ' --- NOUVEAU : gains de population par ville (avant la mise à jour globale)
        taxFactor = GetPlayerGoldTaxFactor(jNum) ' --- NOUVEAU : facteur de taxes du joueur (or et nourriture)
        lastRowJ = 28
        
        prodRowEte = Application.Match("Nourr - été", wsJ.Columns("A"), 0)
        If IsError(prodRowEte) Then prodRowEte = 0
        
        For r = 18 To lastRowJ
            Select Case wsJ.Cells(r, "A").Value
            Case "Nourriture"
                ' --- NOUVEAU : la nourriture produite dépend aussi des taxes ---
                prodFood = wsJ.Cells(r, "C").Value * taxFactor
                If seasonName = "Été" And prodRowEte > 0 Then
                    prodSummer = wsJ.Cells(prodRowEte, "C").Value * taxFactor
                Else
                    prodSummer = 0
                End If
                wsJ.Cells(r, "B").Value = wsJ.Cells(r, "B").Value + prodFood + prodSummer
            Case "Nourr - été"
                ' pas d'action (déjà comptée avec la nourriture, taxes comprises)
            Case "Or"
                ' --- NOUVEAU : l'or gagné dépend des taxes (moyenne pondérée par ville) ---
                wsJ.Cells(r, "B").Value = wsJ.Cells(r, "B").Value + _
                    wsJ.Cells(r, "C").Value * taxFactor
            Case Else
                wsJ.Cells(r, "B").Value = wsJ.Cells(r, "B").Value + wsJ.Cells(r, "C").Value
            End Select
        Next r
        
NextJoueur:
    Next nomJoueur

    ' — 3) Mise à jour de la population SUR CHAQUE FEUILLE JOUEUR
    '     Habitants += Croissance + (stockFood si stockFood<0)
        
    ' repérer la ligne du stock de Nourriture
    ' For Each nomJoueur In joueurs
        ' Set wsJ = ThisWorkbook.Sheets(nomJoueur)
        
        ' foodRow = Application.Match("Nourriture", wsJ.Columns("A"), 0)
        ' If Not IsError(foodRow) Then
            ' stockFood = wsJ.Cells(foodRow, "B").Value
        ' Else
            ' stockFood = 0
        ' End If
        
        ' For i = 0 To nbVilles - 1
            ' cCol = colStart + i * colStep
            ' Dim popGrowth As Double
            ' popGrowth = 0
            ' lecture de la croissance
            ' If IsNumeric(wsJ.Cells(rowCroiss, cCol).Value) Then
                ' popGrowth = wsJ.Cells(rowCroiss, cCol).Value
            'End If
            ' si stockFood négatif, on l'ajoute
            'If stockFood < 0 Then popGrowth = popGrowth + stockFood * 10
            ' on applique aux habitants, en veillant à ne pas avoir moins de 0 habitants
            'If IsNumeric(wsJ.Cells(rowHab, cCol).Value) Then
                'wsJ.Cells(rowHab, cCol).Value = Application.Max(0, wsJ.Cells(rowHab, cCol).Value + popGrowth)
            'End If
        'Next i
    'Next nomJoueur

    ' — 5) Incrément du tour et gestion du changement de saison
    seasonIdx = Int(turnNum / 3) Mod 2
    seasonName = IIf(seasonIdx = 1, "Hiver", "Été")
    wsAcc.Range("F1").Value = seasonName
    If turnNum Mod 3 = 0 Then
        ' Appel de la fonction Evenement lorsque la saison change (ex: tour 3->4, 6->7...)
        Evenement
    End If
    TirerDynastie
    Personnages
    wsAcc.Range("C1").Value = turnNum + 1
End Sub

'============================================================
' SECTION : 3.5 `SnapshotRessources` (module historique) — version complète
'============================================================
' Ajoute une ligne par joueur pour le tour courant.
Public Sub SnapshotRessources()
    Dim wsH As Worksheet, wsSrc As Worksheet
    Dim res As Variant
    Dim tour As Long, j As Long, k As Long, nbRes As Long
    Dim lastRow As Long, r As Long, c As Long
    Dim rowIdx() As Long
    Dim col As Long, v As Variant
    Dim prodVal As Double

    On Error Resume Next
    Set wsH = ThisWorkbook.Worksheets(HIST_SHEET)
    Set wsSrc = ThisWorkbook.Worksheets(SRC_SHEET)
    On Error GoTo 0
    If wsH Is Nothing Or wsSrc Is Nothing Then Exit Sub

    res = ListeRessources()
    nbRes = UBound(res) - LBound(res) + 1

    ' En-têtes si feuille vide
    If Trim$(CStr(wsH.Cells(1, 1).Value)) = "" Then Call EcrireEntetes(wsH, res, nbRes)

    tour = GetTourActuel()

    ' Localiser chaque ressource sur Accueil
    ReDim rowIdx(1 To nbRes)
    For k = 1 To nbRes
        rowIdx(k) = FindResourceRow(wsSrc, CStr(res(LBound(res) + k - 1)))
    Next k

    lastRow = wsH.Cells(wsH.Rows.count, 1).End(xlUp).Row

    For j = 1 To NB_JOUEURS
        r = lastRow + j
        wsH.Cells(r, 1).Value = tour
        wsH.Cells(r, 2).Value = j

        col = FIRST_STOCK_COL + (j - 1) * COL_STEP

        For k = 1 To nbRes
            c = 2 + (k - 1) * 2      ' colonnes 3,5,7... = stock ; 4,6,8... = prod
            If rowIdx(k) > 0 Then
                ' Stock
                v = wsSrc.Cells(rowIdx(k), col).Value
                wsH.Cells(r, c + 1).Value = IIf(IsNumeric(v) And Not IsEmpty(v), CDbl(v), 0)
                ' Production
                v = wsSrc.Cells(rowIdx(k), col + 1).Value
                prodVal = IIf(IsNumeric(v) And Not IsEmpty(v), CDbl(v), 0)
                ' --- NOUVEAU : l'or et la nourriture produits sont nets de taxes (graphiques cohérents) ---
                If StrComp(CStr(res(LBound(res) + k - 1)), "Or", vbTextCompare) = 0 _
                   Or StrComp(CStr(res(LBound(res) + k - 1)), "Nourriture", vbTextCompare) = 0 _
                   Or StrComp(CStr(res(LBound(res) + k - 1)), "Nourr - été", vbTextCompare) = 0 Then
                    prodVal = prodVal * GetPlayerGoldTaxFactor(j)
                End If
                wsH.Cells(r, c + 2).Value = prodVal
            Else
                wsH.Cells(r, c + 1).Value = 0
                wsH.Cells(r, c + 2).Value = 0
            End If
        Next k
    Next j
End Sub

'============================================================
' SECTION : 3bis. Gains de population par ville — `CalculerGainsPopulation`
'============================================================
'================================================================
'  GAINS DE POPULATION PAR VILLE (titres des habitants vivants)
'================================================================
Private Const GAINS_ROW As Long = 69               ' 1re ligne des gains (Science / Tourisme)
Private Const GAINS_CREDITE_STOCK As Boolean = True ' True : la macro ajoute les gains aux stocks
Private Const CONSO_NOURR_PAR_HAB As Double = 1     ' nourriture consommée par habitant vivant / tour

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

            ' 2) Prévision : les taxes de LA VILLE s'appliquent à l'Or et à la Nourriture
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
        Case "habitants", "habs":    colOffset = 3: rw = GAINS_ROW + 2   ' H71 (à confirmer)
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

