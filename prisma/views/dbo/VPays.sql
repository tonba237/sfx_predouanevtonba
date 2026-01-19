SELECT
  A.[ID Pays] AS [ID_Pays],
  A.[Code Pays] AS [Code_Pays],
  A.[Libelle Pays] AS [Libelle_Pays],
  B.[Code Devise] AS [Devise_Locale],
  A.[Date Creation] AS [Date_Creation],
  Z.Nom_Utilisateur AS [Nom_Creation]
FROM
  dbo.TPays AS A
  JOIN dbo.TDevises AS B ON A.[Devise Locale] = B.[ID Devise]
  LEFT JOIN dbo.[VSessions] AS Z ON A.[Session] = Z.[ID_Session];