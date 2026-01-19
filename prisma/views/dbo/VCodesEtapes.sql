SELECT
  A.[ID Code Etape] AS [ID_Code_Etape],
  A.[Libelle Etape] AS [Libelle_Etape],
  A.[Suivi Duree] AS [Suivi_Duree],
  A.[Circuit Etape] AS [Circuit_Etape],
  A.[Index Etape] AS [Index_Etape],
  A.[Entite] AS [ID_Entite],
  A.[Date Creation] AS [Date_Creation],
  Z.Nom_Utilisateur AS [Nom_Creation]
FROM
  [dbo].TCodesEtapes AS A
  LEFT JOIN dbo.[VSessions] AS Z ON A.[Session] = Z.[ID_Session]
WHERE
  A.[ID Code Etape] NOT IN (0, 1000000);