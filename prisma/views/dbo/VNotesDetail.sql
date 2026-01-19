SELECT
  A.[ID Note Detail] AS [ID_Note_Detail],
  B.[ID_Colisage_Dossier],
  B.[ID_Dossier],
  B.[HS_Code],
  B.[Description_Colis],
  B.[No_Commande],
  B.[Nom_Fournisseur],
  B.[No_Facture],
  B.[Code_Devise],
  B.[Pays_Origine],
  B.ID_Regime_Declaration,
  B.[ID_Regime_Douanier],
  B.[Libelle_Regime_Douanier],
  B.[Libelle_Regime_Declaration],
  B.Item_No,
  B.[Regroupement_Client],
  A.[Regime] AS [Regime],
  A.[Base Qte] AS [Base_Qte],
  A.[Base Prix Unitaire] AS [Base_PU],
  A.[Base Poids Brut] AS [Base_Poids_Brut],
  A.[Base Poids Net] AS [Base_Poids_Net],
  A.[Base Volume] AS [Base_Volume],
  A.[Date Creation] AS [Date_Creation],
  Z.Nom_Utilisateur AS [Nom_Creation]
FROM
  [dbo].[TNotesDetail] AS A
  JOIN [dbo].[VColisageDossiers] AS B ON A.[Colisage Dossier] = B.ID_Colisage_Dossier
  LEFT JOIN dbo.[VSessions] AS Z ON A.[Session] = Z.[ID_Session];