package com.rememory.invitation;

import com.rememory.common.exception.BusinessException;
import com.rememory.common.exception.ErrorCode;
import com.rememory.member.Member;
import com.rememory.member.MemberRepository;
import com.rememory.memory.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@Transactional
class InvitationServiceTest {

    @Autowired InvitationService invitationService;
    @Autowired InvitationRepository invitationRepository;
    @Autowired MemberRepository memberRepository;
    @Autowired MemoryRepository memoryRepository;
    @Autowired MemberMemoryRepository mmRepository;

    private Member invitor;
    private Member invitedMember;
    private Memory memory;

    @BeforeEach
    void setUp() {
        invitor = Member.create("홍길동", "hong@gmail.com", "KAKAO", "kakao_111", "http://img/1");
        memberRepository.save(invitor);

        invitedMember = Member.create("김철수", "kim@gmail.com", "KAKAO", "kakao_222", "http://img/2");
        memberRepository.save(invitedMember);

        memory = Memory.create(invitor, "제주도 여행", "즐거운 여행",
                LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 5));
        memoryRepository.save(memory);

        MemberMemory memberMemory = MemberMemory.create(invitor, memory);
        mmRepository.save(memberMemory);
    }

    // ===== save (초대 링크 생성) =====

    @Test
    @DisplayName("초대 링크 생성 성공")
    void save_성공() {
        // when & then - 예외 없이 실행되면 성공
        assertThatCode(() -> invitationService.save(memory.getId(), invitor.getId(), 5))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("추억 멤버가 아닌 사람이 초대 링크 생성 시 BusinessException 발생")
    void save_비멤버_예외발생() {
        assertThatThrownBy(() -> invitationService.save(memory.getId(), invitedMember.getId(), 5))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMBER_MEMORY_NOT_FOUND.getMessage());
    }

    @Test
    @DisplayName("없는 멤버로 초대 링크 생성 시 BusinessException 발생")
    void save_없는멤버_예외발생() {
        assertThatThrownBy(() -> invitationService.save(memory.getId(), 999999L, 5))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMBER_NOT_FOUND.getMessage());
    }

    @Test
    @DisplayName("없는 추억으로 초대 링크 생성 시 BusinessException 발생")
    void save_없는추억_예외발생() {
        assertThatThrownBy(() -> invitationService.save(999999L, invitor.getId(), 5))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMORY_NOT_FOUND.getMessage());
    }

    // ===== agreeInvite (초대 수락) =====

    @Test
    @DisplayName("초대 수락 성공 - MemberMemory 저장")
    void agreeInvite_성공() {
        // given
        Invitation invitation = Invitation.create(memory, invitor, 5);
        invitationRepository.save(invitation);

        // when
        invitationService.agreeInvite(invitedMember.getId(), invitation.getInviteCode());

        // then
        Optional<MemberMemory> memberMemory = mmRepository.findByMemoryIdAndMemberId(
                memory.getId(), invitedMember.getId());
        assertThat(memberMemory).isPresent();
    }

    @Test
    @DisplayName("초대 수락 성공 - usedCount 증가")
    void agreeInvite_usedCount_증가() {
        // given
        Invitation invitation = Invitation.create(memory, invitor, 5);
        invitationRepository.save(invitation);

        // when
        invitationService.agreeInvite(invitedMember.getId(), invitation.getInviteCode());

        // then
        assertThat(invitation.getUsedCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("없는 초대 코드로 수락 시 BusinessException 발생")
    void agreeInvite_없는코드_예외발생() {
        assertThatThrownBy(() -> invitationService.agreeInvite(invitedMember.getId(), "없는코드"))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.INVITATION_NOT_FOUND.getMessage());
    }

    @Test
    @DisplayName("이미 참가한 멤버가 초대 수락 시 BusinessException 발생")
    void agreeInvite_이미참가_예외발생() {
        // given - invitor는 이미 MemberMemory에 있음
        Invitation invitation = Invitation.create(memory, invitor, 5);
        invitationRepository.save(invitation);

        // when & then
        assertThatThrownBy(() -> invitationService.agreeInvite(invitor.getId(), invitation.getInviteCode()))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMBER_MEMORY_ALREADY_EXISTS.getMessage());
    }

    @Test
    @DisplayName("maxUses 초과 시 BusinessException 발생")
    void agreeInvite_maxUses_초과_예외발생() {
        // given - maxUses = 1
        Invitation invitation = Invitation.create(memory, invitor, 1);
        invitationRepository.save(invitation);

        // 첫 번째 수락 (성공)
        invitationService.agreeInvite(invitedMember.getId(), invitation.getInviteCode());

        // 두 번째 수락할 새 멤버
        Member newMember = Member.create("박영희", "park@gmail.com", "KAKAO", "kakao_333", "http://img/3");
        memberRepository.save(newMember);

        // when & then
        assertThatThrownBy(() -> invitationService.agreeInvite(newMember.getId(), invitation.getInviteCode()))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.INVITATION_MAX_USES_EXCEEDED.getMessage());
    }
}
