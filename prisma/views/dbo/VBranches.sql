SELECT
  A.[ID Branche] AS [ID_Branche],
  A.[Code Branche] AS [Code_Branche],
  A.[Nom Branche] AS [Nom_Branche],
  B.[ID_Entite],
  B.[Nom_Entite],
  B.[ID_Groupe_Entite],
  B.[ID_Pays],
  B.[Libelle_Pays],
  B.[Devise_Locale],
  A.[Date Creation] AS [Date_Creation],
  Z.Nom_Utilisateur AS [Nom_Creation]
FROM
  dbo.TBranches AS A
  JOIN dbo.VEntites AS B ON A.[Entite] = B.[ID_Entite]
  LEFT JOIN dbo.[VSessions] AS Z ON A.[Session] = Z.[ID_Session];