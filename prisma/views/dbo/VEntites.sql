SELECT
  A.[ID Entite] AS [ID_Entite],
  A.[Nom Entite] AS [Nom_Entite],
  B.[ID Groupe Entite] AS [ID_Groupe_Entite],
  B.[Nom Groupe Entite] AS [Nom_Groupe_Entite],
  C.[ID Pays] AS [ID_Pays],
  C.[Libelle Pays] AS [Libelle_Pays],
  D.[Code Devise] AS [Devise_Locale],
  A.[Date Creation] AS [Date_Creation],
  Z.Nom_Utilisateur AS [Nom_Creation]
FROM
  [dbo].TEntites AS A
  JOIN dbo.TGroupesEntites AS B ON A.[Groupe Entite] = B.[ID Groupe Entite]
  JOIN dbo.TPays AS C ON A.[Pays] = C.[ID Pays]
  JOIN dbo.TDevises AS D ON C.[Devise Locale] = D.[ID Devise]
  LEFT JOIN dbo.[VSessions] AS Z ON A.[Session] = Z.[ID_Session];