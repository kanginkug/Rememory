package com.rememory.member.fcm;

public record NotificationSettingRequest(
        boolean notificationEnabled,
        boolean notificationPlaceEnabled,
        boolean notificationReviewEnabled,
        boolean notificationInvitationEnabled
) {}
