SELECT
  A.[ID Etape Dossier] AS [ID_Etape_Dossier],
  A.Dossier AS [ID_Dossier],
  B.[ID Code Etape] AS [ID_Etape],
  B.[Libelle Etape] AS [Libelle_Etape],
  B.[Circuit Etape] AS [Circuit_Etape],
  B.[Index Etape] AS [Index_Etape],
  A.[Date Debut] AS [Date_Debut_Etape],
  A.[Date Fin] AS [Date_Fin_Etape],
  A.[Reference] AS [Reference_Etape],
  A.[Qte] AS [Qte_Etape],
  A.[Obs] AS [Obs_Etape],
  IIF(
    B.[Suivi Duree] = 1,
    DATEDIFF(DAY, A.[Date Debut], A.[Date Fin]) - B.[Delai Etape],
    0
  ) AS [Retard_Etape],
  A.[Date Creation] AS [Date_Creation],
  Z.Nom_Utilisateur AS [Nom_Creation]
FROM
  dbo.TEtapesDossiers AS A
  JOIN dbo.TCodesEtapes AS B ON A.[Etape Dossier] = B.[ID Code Etape]
  LEFT JOIN dbo.[VSessions] AS Z ON A.[Session] = Z.[ID_Session];