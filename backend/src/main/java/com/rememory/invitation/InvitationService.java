package com.rememory.invitation;

import com.rememory.common.exception.BusinessException;
import com.rememory.common.exception.ErrorCode;
import com.rememory.member.Member;
import com.rememory.member.MemberRepository;
import com.rememory.member.fcm.FcmService;
import com.rememory.memory.MemberMemory;
import com.rememory.memory.MemberMemoryRepository;
import com.rememory.memory.Memory;
import com.rememory.memory.MemoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InvitationService {

    private final InvitationRepository invitationRepository;
    private final MemberRepository memberRepository;
    private final MemoryRepository memoryRepository;
    private final MemberMemoryRepository mmRepository;
    private final FcmService fcmService;

    /** 초대 링크 생성 및 저장, 생성된 invite code 반환 */
    @Transactional
    public String save(Long memoryId, Long invitorId){
        Member invitor =  memberRepository.findOne(invitorId).orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        Memory memory = memoryRepository.findOne(memoryId).orElseThrow(() -> new BusinessException(ErrorCode.MEMORY_NOT_FOUND));

        if(mmRepository.findActiveByMemoryIdAndMemberId(memoryId, invitorId).isEmpty()){
            throw new BusinessException(ErrorCode.MEMBER_MEMORY_NOT_FOUND);
        }

        Invitation invitation = Invitation.create(memory, invitor);
        invitationRepository.save(invitation);
        return invitation.getInviteCode();
    }

    /**
     * 초대 수락
     * 링크 유효성(만료·사용 횟수) 먼저 체크 후 중복 참여 검증
     * 이미 참여 중인 멤버가 재클릭해도 MEMBER_MEMORY_ALREADY_EXISTS로 차단
     */
    @Transactional
    public void agreeInvite(Long invitedMemberId, String inviteCode) {
        Invitation invitation = invitationRepository.findOneByInviteCode(inviteCode).orElseThrow(() -> new BusinessException(ErrorCode.INVITATION_NOT_FOUND));

        if(invitation.getExpiresAt().isBefore(LocalDateTime.now())){
            throw new BusinessException(ErrorCode.INVITATION_EXPIRED);
        }

        if(invitation.getMaxUses() != 0 && invitation.getMaxUses() < invitation.getUsedCount() + 1) {
            throw new BusinessException(ErrorCode.INVITATION_MAX_USES_EXCEEDED);
        }

        Member invitedMember = memberRepository.findOne(invitedMemberId).orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        Memory memory = memoryRepository.findOne(invitation.getMemory().getId()).orElseThrow(() -> new BusinessException(ErrorCode.MEMORY_NOT_FOUND));

        if(mmRepository.findActiveByMemoryIdAndMemberId(memory.getId(),invitedMemberId).isPresent()) {
            throw new BusinessException(ErrorCode.MEMBER_MEMORY_ALREADY_EXISTS);
        }

        mmRepository.findLeftByMemoryIdAndMemberId(memory.getId(), invitedMemberId)
                .ifPresentOrElse(
                        MemberMemory::comebackMember,
                        () -> mmRepository.save(MemberMemory.create(invitedMember, memory))
                );
        invitation.plusUsedCount();
        memory.plusMemberCount();

        String fcmTitle = "새 멤버가 참여했어요";
        String body = invitedMember.getName() + "님이 [" + memory.getName() + "]에 합류했습니다.";
        // 추억 멤버 id 목록 조회
        List<MemberMemory> members = mmRepository.findActiveByMemoryId(memory.getId());
        for(MemberMemory receiver : members){
            if (receiver.getMember().getId().equals(invitedMemberId)) continue;
            fcmService.sendNotification(receiver.getMember().getId(), fcmTitle, body, "/memory/" + memory.getId(), com.rememory.member.fcm.FcmNotificationType.INVITATION);
        }
    }
}
