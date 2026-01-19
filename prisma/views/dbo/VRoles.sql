SELECT
  A.[ID Role] AS [ID_Role],
  A.[Libelle Role] AS [Libelle_Role],
  A.[Date Creation] AS [Date_Creation],
  Z.Nom_Utilisateur AS [Nom_Creation]
FROM
  [dbo].[TRoles] AS A
  LEFT JOIN dbo.[VSessions] AS Z ON A.[Session] = Z.[ID_Session];