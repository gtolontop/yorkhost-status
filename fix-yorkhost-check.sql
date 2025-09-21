-- Fix the yorkhost.fr check configuration
-- Option 1: Change expected status to accept redirects
UPDATE checks 
SET expected_status = NULL
WHERE target = 'https://yorkhost.fr';

-- Option 2: Change to HTTPS type (more appropriate)
UPDATE checks 
SET type = 'HTTPS'
WHERE target = 'https://yorkhost.fr';

-- Option 3: Update target to the final URL after redirect
-- UPDATE checks 
-- SET target = 'https://yorkhost.fr/fr'
-- WHERE target = 'https://yorkhost.fr';