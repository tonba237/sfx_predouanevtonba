SELECT
  A.[ID Convertion] AS [ID_Convertion],
  A.[Date Convertion] AS [Date_Convertion],
  A.[Date Creation] AS [Date_Creation],
  A.[Entite] AS [ID_Entite],
  Z.Nom_Utilisateur AS [Nom_Creation]
FROM
  [dbo].TConvertions AS A
  LEFT JOIN dbo.[VSessions] AS Z ON A.[Session] = Z.[ID_Session];