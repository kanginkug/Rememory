ALTER TABLE member ADD COLUMN notification_place_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE member ADD COLUMN notification_review_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE member ADD COLUMN notification_invitation_enabled BOOLEAN NOT NULL DEFAULT true;
