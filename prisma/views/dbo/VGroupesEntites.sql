SELECT
  A.[ID Groupe Entite] AS [ID_Groupe_Entite],
  A.[Nom Groupe Entite] AS [Nom_Groupe_Entite],
  A.[Date Creation] AS [Date_Creation],
  Z.Nom_Utilisateur AS [Nom_Creation]
FROM
  [dbo].TGroupesEntites AS A
  LEFT JOIN dbo.[VSessions] AS Z ON A.[Session] = Z.[ID_Session];