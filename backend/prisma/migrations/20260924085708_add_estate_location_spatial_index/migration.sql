-- Create a GiST spatial index on the geography representation
-- of Estate.location so radius-based PostGIS queries can
-- efficiently search by distance.

CREATE INDEX "estates_location_geography_gist_idx"
ON "estates"
USING GIST ((location::geography));
