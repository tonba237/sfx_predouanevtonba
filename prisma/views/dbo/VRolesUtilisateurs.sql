SELECT
  A.[ID Role Utilisateur] AS [ID_Role_Utilisateur],
  B.[ID Role] AS [ID_Role],
  B.[Libelle Role] AS [Libelle_Role],
  C.[ID Utilisateur] AS [ID_Utilisateur],
  C.[Nom Utilisateur] AS [Nom_Utilisateur],
  A.[Date Creation] AS [Date_Creation],
  Z.Nom_Utilisateur AS [Nom_Creation]
FROM
  [dbo].[TRolesUtilisateurs] AS A
  JOIN [dbo].[TRoles] AS B ON A.[Role] = B.[ID Role]
  JOIN [dbo].[TUtilisateurs] AS C ON A.[Utilisateur] = C.[ID Utilisateur]
  LEFT JOIN dbo.[VSessions] AS Z ON A.[Session] = Z.[ID_Session];