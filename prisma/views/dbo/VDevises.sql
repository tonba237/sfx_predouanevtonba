SELECT
  A.[ID Devise] AS [ID_Devise],
  A.[Code Devise] AS [Code_Devise],
  A.[Libelle Devise] AS [Libelle_Devise],
  A.[Decimales] AS [Decimales],
  A.[Date Creation] AS [Date_Creation],
  Z.Nom_Utilisateur AS [Nom_Creation]
FROM
  [dbo].TDevises AS A
  LEFT JOIN dbo.[VSessions] AS Z ON A.[Session] = Z.[ID_Session]
WHERE
  [Devise Inactive] = 0;