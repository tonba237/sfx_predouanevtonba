SELECT
  A.[ID Utilisateur] AS [ID_Utilisateur],
  A.[Nom Utilisateur] AS [Nom_Utilisateur],
  A.[Date Creation] AS [Date_Creation],
  Z.Nom_Utilisateur AS [Nom_Creation]
FROM
  dbo.TUtilisateurs AS A
  LEFT JOIN dbo.[VSessions] AS Z ON A.[Session] = Z.[ID_Session]
WHERE
  [ID Utilisateur] > 0;