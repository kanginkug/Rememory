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
        invitor = Member.create("홍길동", "hong@gmail.com", "http://img/1", "KAKAO", "kakao_111", null, null);
        memberRepository.save(invitor);

        invitedMember = Member.create("김철수", "kim@gmail.com", "http://img/2", "KAKAO", "kakao_222", null, null);
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
        assertThatCode(() -> invitationService.save(memory.getId(), invitor.getId()))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("추억 멤버가 아닌 사람이 초대 링크 생성 시 BusinessException 발생")
    void save_비멤버_예외발생() {
        assertThatThrownBy(() -> invitationService.save(memory.getId(), invitedMember.getId()))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMBER_MEMORY_NOT_FOUND.getMessage());
    }

    @Test
    @DisplayName("없는 멤버로 초대 링크 생성 시 BusinessException 발생")
    void save_없는멤버_예외발생() {
        assertThatThrownBy(() -> invitationService.save(memory.getId(), 999999L))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMBER_NOT_FOUND.getMessage());
    }

    @Test
    @DisplayName("없는 추억으로 초대 링크 생성 시 BusinessException 발생")
    void save_없는추억_예외발생() {
        assertThatThrownBy(() -> invitationService.save(999999L, invitor.getId()))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMORY_NOT_FOUND.getMessage());
    }

    // ===== agreeInvite (초대 수락) =====

    @Test
    @DisplayName("초대 수락 성공 - MemberMemory 저장")
    void agreeInvite_성공() {
        // given
        Invitation invitation = Invitation.create(memory, invitor);
        invitationRepository.save(invitation);

        // when
        invitationService.agreeInvite(invitedMember.getId(), invitation.getInviteCode());

        // then
        Optional<MemberMemory> memberMemory = mmRepository.findActiveByMemoryIdAndMemberId(
                memory.getId(), invitedMember.getId());
        assertThat(memberMemory).isPresent();
    }

    @Test
    @DisplayName("초대 수락 성공 - usedCount 증가")
    void agreeInvite_usedCount_증가() {
        // given
        Invitation invitation = Invitation.create(memory, invitor);
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
        Invitation invitation = Invitation.create(memory, invitor);
        invitationRepository.save(invitation);

        // when & then
        assertThatThrownBy(() -> invitationService.agreeInvite(invitor.getId(), invitation.getInviteCode()))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMBER_MEMORY_ALREADY_EXISTS.getMessage());
    }

    @Test
    @DisplayName("초대 수락 성공 - 나갔던 멤버 재참여 시 leftAt 초기화")
    void agreeInvite_재참여_성공() {
        // given - invitedMember가 한 번 참여 후 나간 상태
        MemberMemory pastMemberMemory = MemberMemory.create(invitedMember, memory);
        mmRepository.save(pastMemberMemory);
        pastMemberMemory.leftMemory(); // leftAt 세팅

        Invitation invitation = Invitation.create(memory, invitor);
        invitationRepository.save(invitation);

        // when
        invitationService.agreeInvite(invitedMember.getId(), invitation.getInviteCode());

        // then - 활성 멤버로 복귀
        Optional<MemberMemory> memberMemory = mmRepository.findActiveByMemoryIdAndMemberId(
                memory.getId(), invitedMember.getId());
        assertThat(memberMemory).isPresent();
    }

    @Test
    @DisplayName("초대 수락 성공 - 재참여 시에도 usedCount 증가")
    void agreeInvite_재참여_usedCount_증가() {
        // given - invitedMember가 나간 상태
        MemberMemory pastMemberMemory = MemberMemory.create(invitedMember, memory);
        mmRepository.save(pastMemberMemory);
        pastMemberMemory.leftMemory();

        Invitation invitation = Invitation.create(memory, invitor);
        invitationRepository.save(invitation);

        // when
        invitationService.agreeInvite(invitedMember.getId(), invitation.getInviteCode());

        // then
        assertThat(invitation.getUsedCount()).isEqualTo(1);
    }

}
