SELECT
  A.[ID Mode Transport] AS [ID_Mode_Transport],
  A.[Libelle Mode Transport] AS [Libelle_Mode_Transport],
  A.[Date Creation] AS [Date_Creation],
  Z.Nom_Utilisateur AS [Nom_Creation]
FROM
  dbo.TModesTransport AS A
  LEFT JOIN dbo.[VSessions] AS Z ON A.[Session] = Z.[ID_Session];