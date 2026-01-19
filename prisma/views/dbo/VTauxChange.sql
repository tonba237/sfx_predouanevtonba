SELECT
  A.[ID Taux Change] AS [ID_Taux_Change],
  A.[Convertion] AS [ID_Convertion],
  B.[Code Devise] AS [Devise],
  A.[Taux Change] AS [Taux_Change],
  A.[Date Creation] AS [Date_Creation],
  Z.Nom_Utilisateur AS [Nom_Creation]
FROM
  dbo.TTauxChange AS A
  JOIN dbo.TDevises AS B ON A.Devise = B.[ID Devise]
  LEFT JOIN dbo.[VSessions] AS Z ON A.[Session] = Z.[ID_Session];