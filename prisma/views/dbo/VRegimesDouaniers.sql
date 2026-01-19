SELECT
  A.[ID Regime Douanier] AS [ID_Regime_Douanier],
  A.[Libelle Regime Douanier] AS [Libelle_Regime_Douanier],
  A.[Date Creation] AS [Date_Creation],
  Z.Nom_Utilisateur AS [Nom_Creation]
FROM
  dbo.TRegimesDouaniers AS A
  LEFT JOIN dbo.[VSessions] AS Z ON A.[Session] = Z.[ID_Session];