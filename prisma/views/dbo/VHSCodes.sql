SELECT
  A.[ID HS Code] AS [ID_HS_Code],
  A.[HS Code] AS [HS_Code],
  A.[Libelle HS Code] AS [Libelle_HS_Code],
  A.[Entite] AS [ID_Entite],
  A.[Date Creation] AS [Date_Creation],
  Z.Nom_Utilisateur AS [Nom_Creation]
FROM
  dbo.THSCodes AS A
  LEFT JOIN dbo.[VSessions] AS Z ON A.[Session] = Z.[ID_Session];