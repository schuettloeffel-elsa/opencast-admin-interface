-- Drop unused tables
drop table oc_job_oc_service_registration;
drop table oc_job_context;

-- Increase mime_type field size
ALTER TABLE oc_assets_asset MODIFY COLUMN mime_type VARCHAR (255);