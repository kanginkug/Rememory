package com.rememory.invitation;

import com.rememory.common.exception.BusinessException;
import com.rememory.common.exception.ErrorCode;
import com.rememory.member.Member;
import com.rememory.member.MemberRepository;
import com.rememory.memory.MemberMemory;
import com.rememory.memory.MemberMemoryRepository;
import com.rememory.memory.Memory;
import com.rememory.memory.MemoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InvitationService {

    private final InvitationRepository invitationRepository;
    private final MemberRepository memberRepository;
    private final MemoryRepository memoryRepository;
    private final MemberMemoryRepository mmRepository;

    @Transactional
    public void save(Long memoryId, Long invitorId, int invitedCnt){
        Member invitor =  memberRepository.findOne(invitorId).orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        Memory memory = memoryRepository.findOne(memoryId).orElseThrow(() -> new BusinessException(ErrorCode.MEMORY_NOT_FOUND));

        if(mmRepository.findByMemoryIdAndMemberId(memoryId, invitorId).isEmpty()){
            throw new BusinessException(ErrorCode.MEMBER_MEMORY_NOT_FOUND);
        }

        Invitation invitation = Invitation.create(memory, invitor, invitedCnt);
        invitationRepository.save(invitation);
    }

    @Transactional
    public void agreeInvite(Long invitedMemberId, String inviteCode) {
        Invitation invitation = invitationRepository.findOneByInviteCode(inviteCode).orElseThrow(() -> new BusinessException(ErrorCode.INVITATION_NOT_FOUND));

        if(invitation.getExpiresAt().isBefore(LocalDateTime.now())){
            throw new BusinessException(ErrorCode.INVITATION_EXPIRED);
        }

        if(invitation.getMaxUses() < invitation.getUsedCount()+1) {
            throw new BusinessException(ErrorCode.INVITATION_MAX_USES_EXCEEDED);
        }

        Member invitedMember = memberRepository.findOne(invitedMemberId).orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        Memory memory = memoryRepository.findOne(invitation.getMemory().getId()).orElseThrow(() -> new BusinessException(ErrorCode.MEMORY_NOT_FOUND));

        if(mmRepository.findByMemoryIdAndMemberId(memory.getId(),invitedMemberId).isPresent()) {
            throw new BusinessException(ErrorCode.MEMBER_MEMORY_ALREADY_EXISTS);
        }

        invitation.plusUsedCount();
        MemberMemory memberMemory = MemberMemory.create(invitedMember, memory);
        mmRepository.save(memberMemory);
    }
}
