package com.rememory.member.fcm;

import com.rememory.common.exception.BusinessException;
import com.rememory.common.exception.ErrorCode;
import com.rememory.member.Member;
import com.rememory.member.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FcmService {

    private final MemberRepository memberRepository;

    @Transactional
    public void updateNotificationSettings(Long memberId, NotificationSettingRequest request) {
        Member member = memberRepository.findOne(memberId).orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        member.updateNotificationSettings(
                request.notificationEnabled(),
                request.notificationPlaceEnabled(),
                request.notificationReviewEnabled(),
                request.notificationInvitationEnabled()
        );
    }

    @Transactional
    public void updateFcmToken(Long memberId, String fcmToken) {
            Member member = memberRepository.findOne(memberId).orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
            member.updateFcmToken(fcmToken);
    }

    /**
     * @param title ex) 새 멤버가 참여했어요
     * @param body ex) nickname + "님이 추억에 합류했습니다."
     */
    public void sendNotification(Long receiverId, String title, String body, String url, FcmNotificationType type) {
        Member receiver = memberRepository.findOne(receiverId).orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        if (receiver.getFcmToken() == null || !receiver.isNotificationEnabled()) return;
        if (type == FcmNotificationType.PLACE && !receiver.isNotificationPlaceEnabled()) return;
        if (type == FcmNotificationType.REVIEW && !receiver.isNotificationReviewEnabled()) return;
        if (type == FcmNotificationType.INVITATION && !receiver.isNotificationInvitationEnabled()) return;

        Message message = Message.builder()
                .setToken(receiver.getFcmToken())
                .putData("title", title)
                .putData("body", body)
                .putData("url", url)
                .build();
        try {
            FirebaseMessaging.getInstance().send(message);
        } catch (FirebaseMessagingException | IllegalStateException e) {
            log.warn("FCM 전송 실패 receiverId={}: {}", receiverId, e.getMessage());
        }
    }
}
