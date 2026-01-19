SELECT
  A.[ID Regime Declaration] AS [ID_Regime_Declaration],
  B.[ID Regime Douanier] AS [ID_Regime_Douanier],
  B.[Libelle Regime Douanier] AS [Libelle_Regime_Douanier],
  A.[Libelle Regime Declaration] AS [Libelle_Regime_Declaration],
  A.[Taux DC] AS [Ratio_DC],
  IIF(A.[Taux DC] = 0, 0, 1 - A.[Taux DC]) AS [Ratio_TR],
  A.[Entite] AS [ID_Entite],
  A.[Date Creation] AS [Date_Creation],
  Z.Nom_Utilisateur AS [Nom_Creation]
FROM
  dbo.TRegimesDeclarations AS A
  JOIN TRegimesDouaniers AS B ON A.[Regime Douanier] = B.[ID Regime Douanier]
  LEFT JOIN dbo.[VSessions] AS Z ON A.[Session] = Z.[ID_Session];