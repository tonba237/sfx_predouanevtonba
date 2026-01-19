SELECT
  A.[ID Type Dossier] AS [ID_Type_Dossier],
  A.[Libelle Type Dossier] AS [Libelle_Type_Dossier],
  B.[ID Sens Trafic] AS [ID_Sens_Trafic],
  B.[Libelle Sens Trafic] AS [Libelle_Sens_Trafic],
  C.[ID Mode Transport] AS [ID_Mode_Transport],
  C.[Libelle Mode Transport] AS [Libelle_Mode_Transport],
  A.[Entite] AS [ID_Entite],
  A.[Date Creation] AS [Date_Creation],
  Z.Nom_Utilisateur AS [Nom_Creation]
FROM
  dbo.TTypesDossiers AS A
  JOIN dbo.TSensTrafic AS B ON A.[Sens Trafic] = B.[ID Sens Trafic]
  JOIN dbo.TModesTransport AS C ON A.[Mode Transport] = C.[ID Mode Transport]
  LEFT JOIN dbo.[VSessions] AS Z ON A.[Session] = Z.[ID_Session];