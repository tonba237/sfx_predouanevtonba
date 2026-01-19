SELECT
  A.[ID Permission Role] AS [ID_Permission_Role],
  B.[ID Role] AS [ID_Role],
  B.[Libelle Role] AS [Libelle_Role],
  C.[ID Permission Base] AS [ID_Permission],
  C.[Libelle Permission] AS [Libelle_Permission],
  A.[Date Creation] AS [Date_Creation],
  Z.Nom_Utilisateur AS [Nom_Creation]
FROM
  [dbo].[TPermissonsRoles] AS A
  JOIN [dbo].[TRoles] AS B ON A.[Role] = B.[ID Role]
  JOIN [dbo].[TPermissionsBase] AS C ON A.[Permission] = C.[ID Permission Base]
  LEFT JOIN dbo.[VSessions] AS Z ON A.[Session] = Z.[ID_Session]
WHERE
  C.[Permission Active] = 1;