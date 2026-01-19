SELECT
  A.[ID Sens Trafic] AS [ID_Sens_Trafic],
  A.[Libelle Sens Trafic] AS [Libelle_Sens_Trafic],
  A.[Date Creation] AS [Date_Creation],
  Z.Nom_Utilisateur AS [Nom_Creation]
FROM
  dbo.TSensTrafic AS A
  LEFT JOIN dbo.[VSessions] AS Z ON A.[Session] = Z.[ID_Session];