SELECT
  A.[ID Client] AS [ID_Client],
  A.[Nom Client] AS [Nom_Client],
  A.[Entite] AS [ID_Entite],
  A.[Date Creation] AS [Date_Creation],
  Z.Nom_Utilisateur AS [Nom_Creation]
FROM
  dbo.TClients AS A
  LEFT JOIN dbo.[VSessions] AS Z ON A.[Session] = Z.[ID_Session];