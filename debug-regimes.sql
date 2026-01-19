-- Requête de diagnostic pour trouver les associations automatiques
-- Exécuter dans SQL Server Management Studio

-- 1. Vérifier les associations pour IHS CAMEROUN
SELECT 
    rc.ID_Regime_Client,
    rc.ID_Client,
    c.Nom_Client,
    rd.Libelle_Regime_Declaration,
    rc.Ratio_DC,
    rc.Date_Creation,
    rc.Nom_Creation
FROM [dbo].[TRegimesClients] rc
JOIN [dbo].[TClients] c ON rc.Client = c.ID_Client
JOIN [dbo].[TRegimesDeclarations] rd ON rc.Regime_Declaration = rd.ID_Regime_Declaration
WHERE c.Nom_Client = 'IHS CAMEROUN'
ORDER BY rc.Date_Creation DESC;

-- 2. Vérifier s'il y a des triggers sur TClients
SELECT 
    name,
    is_disabled,
    is_not_for_replication,
    is_instead_of_trigger
FROM sys.triggers 
WHERE parent_id = OBJECT_ID('TClients')
ORDER BY name;

-- 3. Vérifier les procédures stockées récemment exécutées
SELECT TOP 10
    execution_count,
    total_elapsed_time_ms,
    total_worker_time_ms,
    last_execution_time,
    object_name
FROM sys.dm_exec_procedure_stats
WHERE database_id = DB_ID()
    AND object_name LIKE '%regime%'
ORDER BY last_execution_time DESC;
